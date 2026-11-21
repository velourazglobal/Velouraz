import {
  db,
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "./utils/firebaseServer.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { orderId, razorpayOrderId } = req.query || {};

  if (!orderId && !razorpayOrderId) {
    return res.status(400).json({ error: "orderId or razorpayOrderId query parameter is required." });
  }

  try {
    let orderDoc = null;
    let orderData = null;

    if (orderId) {
      const docRef = doc(db, "orders", orderId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        orderDoc = snap;
        orderData = snap.data();
      }
    }

    if (!orderData && razorpayOrderId) {
      const q = query(collection(db, "orders"), where("razorpayOrderId", "==", razorpayOrderId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        orderDoc = snap.docs[0];
        orderData = orderDoc.data();
      }
    }

    if (!orderData) {
      return res.status(404).json({ error: "Order not found." });
    }

    // If order is still PENDING and razorpayOrderId exists, reconcile status with Razorpay
    if (orderData.paymentStatus === "PENDING" && orderData.razorpayOrderId) {
      const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      if (keyId && keySecret) {
        try {
          const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
          const rzpRes = await fetch(
            `https://api.razorpay.com/v1/orders/${orderData.razorpayOrderId}/payments`,
            {
              headers: { Authorization: authHeader },
            }
          );

          if (rzpRes.ok) {
            const paymentsData = await rzpRes.json();
            const items = paymentsData.items || [];
            const capturedPayment = items.find((p) => p.status === "captured" || p.status === "authorized");

            if (capturedPayment) {
              // Reconcile pending order to PAID
              const updates = {
                paymentStatus: "PAID",
                orderStatus: "CONFIRMED",
                razorpayPaymentId: capturedPayment.id,
                paidAt: new Date().toISOString(),
                stockDeducted: true,
                updatedAt: serverTimestamp(),
              };

              // Deduct stock if needed
              if (!orderData.stockDeducted && Array.isArray(orderData.items)) {
                for (const item of orderData.items) {
                  if (item.id && !item.id.startsWith("bs-")) {
                    try {
                      const pRef = doc(db, "products", item.id);
                      const pSnap = await getDoc(pRef);
                      if (pSnap.exists()) {
                        const cur = Number(pSnap.data().stock ?? 0);
                        const qty = Math.max(1, Number(item.quantity) || 1);
                        await updateDoc(pRef, {
                          stock: Math.max(0, cur - qty),
                          updatedAt: serverTimestamp(),
                        });
                      }
                    } catch (e) {
                      console.warn("Reconciliation stock deduction warning:", e);
                    }
                  }
                }
              }

              await updateDoc(orderDoc.ref, updates);
              orderData = { ...orderData, ...updates };
            }
          }
        } catch (fetchErr) {
          console.warn("[Order Status Reconciliation Notice]:", fetchErr?.message);
        }
      }
    }

    return res.status(200).json({
      success: true,
      orderId: orderDoc.id,
      orderNumber: orderData.orderNumber || orderDoc.id,
      paymentStatus: orderData.paymentStatus,
      orderStatus: orderData.orderStatus,
      paymentMethod: orderData.paymentMethod,
      razorpayPaymentId: orderData.razorpayPaymentId || null,
      totalAmount: orderData.totalAmount || orderData.total,
      currency: orderData.currency || "INR",
      customerName: orderData.customerName,
      items: orderData.items,
      createdAt: orderData.createdAt,
    });
  } catch (err) {
    console.error("[Order Status API Error]:", err);
    return res.status(500).json({ error: err.message || "Failed to fetch order status." });
  }
}

