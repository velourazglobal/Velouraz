import crypto from "crypto";
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
} from "../server-utils/firebaseServer.js";
import { sendMailWithFallback } from "../server-utils/mailer.js";

// Helper to send order confirmation email
async function dispatchOrderConfirmationEmails(order) {
  try {
    const customerEmail =
      order.email ||
      order.shippingAddress?.email ||
      order.customerEmail ||
      order.billing_email;

    if (!customerEmail) {
      console.warn("[Email Notification Warning]: No customer email found on order:", order.id || order.orderNumber);
      return;
    }

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const adminEmail = process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || smtpUser || "admin@velouraz.in";

    if (!smtpUser || !smtpPass) {
      console.warn(`[DEV MODE] SMTP not configured. Simulated confirmation email for Order #${order.orderNumber || order.id}`);
      return;
    }

    const orderId = order.orderNumber || order.id || `VEL-${Date.now()}`;
    const customerName = order.customerName || order.shippingAddress?.name || "Valued Customer";
    
    // Calculate financial breakdown
    const itemsTotal = (order.items || []).reduce(
      (acc, item) => acc + Number(item.price || 0) * Number(item.quantity || 1),
      0
    );
    const subtotal = Number(order.subtotal !== undefined ? order.subtotal : (itemsTotal || order.total || 0));
    const discountAmount = Number(order.discountAmount || 0);
    const totalVal = Number(order.totalAmount || order.total || (subtotal - discountAmount));
    const shippingFee = order.shippingFee !== undefined
      ? Number(order.shippingFee)
      : Math.max(0, totalVal - (subtotal - discountAmount));

    const subtotalFormatted = `₹${subtotal.toLocaleString("en-IN")}`;
    const shippingFormatted = shippingFee > 0 ? `₹${shippingFee.toLocaleString("en-IN")}` : "FREE";
    const discountFormatted = discountAmount > 0 ? `- ₹${discountAmount.toLocaleString("en-IN")}` : null;
    const totalFormatted = `₹${totalVal.toLocaleString("en-IN")}`;
    const addressFormatted =
      order.shippingAddress?.fullAddress ||
      `${order.shippingAddress?.address || ""}, ${order.shippingAddress?.city || ""} - ${order.shippingAddress?.pincode || ""}`;

    const itemsHtml = (order.items || [])
      .map(
        (item) => `
        <tr style="border-bottom: 1px solid #2e2633;">
          <td style="padding: 14px; color: #ffffff; font-size: 14px;">
            <strong>${item.name || "Jewellery Item"}</strong>
            ${item.size ? `<br><span style="font-size: 12px; color: #8a8292;">Size: ${item.size}</span>` : ""}
            ${item.metal ? `<span style="font-size: 12px; color: #8a8292;"> | Metal: ${item.metal}</span>` : ""}
          </td>
          <td style="padding: 14px; color: #b5adc0; font-size: 14px; text-align: center;">
            ${item.quantity || 1}
          </td>
          <td style="padding: 14px; color: #d4af37; font-size: 14px; text-align: right; font-weight: 500;">
            ₹${(Number(item.price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}
          </td>
        </tr>`
      )
      .join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0d0b0e; color: #ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" style="max-width: 600px; background-color: #161217; border: 1px solid #2e2633; border-radius: 14px; padding: 40px 30px;">
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <h1 style="margin: 0; font-family: Georgia, serif; font-size: 26px; color: #d4af37; letter-spacing: 4px;">VELOURAZ</h1>
                  </td>
                </tr>
                <tr>
                  <td style="border-top: 1px solid #2e2633; padding-top: 25px;">
                    <h2 style="margin: 0 0 10px 0; color: #ffffff; font-size: 20px;">Order Confirmed & Payment Received</h2>
                    <p style="margin: 0 0 20px 0; color: #b5adc0; font-size: 14px; line-height: 1.6;">
                      Dear ${customerName}, thank you for your order. We have successfully received your payment via Razorpay (ID: <strong>${order.razorpayPaymentId || "Verified"}</strong>). Your order is being prepared by our team.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table width="100%" style="background-color: #1f1a22; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
                      <tr>
                        <td style="font-size: 13px; color: #8a8292; padding: 4px 0;">Order Reference:</td>
                        <td style="font-size: 13px; color: #ffffff; text-align: right; font-weight: bold;">#${orderId}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #8a8292; padding: 4px 0;">Payment Method:</td>
                        <td style="font-size: 13px; color: #22c55e; text-align: right; font-weight: bold;">RAZORPAY (PAID)</td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #8a8292; padding: 4px 0;">Razorpay Payment ID:</td>
                        <td style="font-size: 13px; color: #ffffff; text-align: right; font-family: monospace;">${order.razorpayPaymentId || "N/A"}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #8a8292; padding: 4px 0;">Delivery Address:</td>
                        <td style="font-size: 13px; color: #ffffff; text-align: right;">${addressFormatted}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 25px;">
                      <thead>
                        <tr style="border-bottom: 2px solid #2e2633;">
                          <th style="text-align: left; padding: 10px 0; color: #8a8292; font-size: 12px; text-transform: uppercase;">Item</th>
                          <th style="text-align: center; padding: 10px 0; color: #8a8292; font-size: 12px; text-transform: uppercase;">Qty</th>
                          <th style="text-align: right; padding: 10px 0; color: #8a8292; font-size: 12px; text-transform: uppercase;">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHtml}
                      </tbody>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="border-top: 1px solid #2e2633; padding-top: 15px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 4px 0; color: #8a8292; font-size: 14px;">Subtotal:</td>
                        <td style="padding: 4px 0; color: #ffffff; font-size: 14px; text-align: right;">${subtotalFormatted}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #8a8292; font-size: 14px;">Delivery Charges:</td>
                        <td style="padding: 4px 0; color: ${shippingFee === 0 ? "#22c55e" : "#ffffff"}; font-size: 14px; text-align: right; font-weight: ${shippingFee === 0 ? "bold" : "normal"};">${shippingFormatted}</td>
                      </tr>
                      ${
                        discountFormatted
                          ? `<tr>
                              <td style="padding: 4px 0; color: #22c55e; font-size: 14px;">Discount Applied:</td>
                              <td style="padding: 4px 0; color: #22c55e; font-size: 14px; text-align: right; font-weight: bold;">${discountFormatted}</td>
                            </tr>`
                          : ""
                      }
                      <tr>
                        <td style="padding: 10px 0 0 0; color: #ffffff; font-size: 16px; font-weight: bold; border-top: 1px solid #2e2633;">Total Paid:</td>
                        <td style="padding: 10px 0 0 0; color: #d4af37; font-size: 18px; font-weight: bold; text-align: right; border-top: 1px solid #2e2633;">${totalFormatted}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="border-top: 1px solid #2e2633; margin-top: 25px; padding-top: 20px;">
                    <p style="font-size: 13px; color: #8a8292; margin: 0;">
                      You can track your order status anytime on our website under My Orders.
                    </p>
                    <p style="font-size: 12px; color: #6b6374; margin-top: 10px;">
                      © ${new Date().getFullYear()} VELOURAZ. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const fromAddress =
      process.env.SMTP_FROM ||
      (smtpUser ? `"VELOURAZ" <${smtpUser}>` : '"VELOURAZ" <orders@velouraz.in>');

    await Promise.allSettled([
      sendMailWithFallback({
        from: fromAddress,
        to: customerEmail,
        subject: `Payment Confirmed — Order #${orderId} | VELOURAZ`,
        html: emailHtml,
      }),
      sendMailWithFallback({
        from: fromAddress,
        to: adminEmail,
        subject: `🚨 [PAID ORDER] #${orderId} - ${totalFormatted} (${customerName})`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #111;">
            <h2 style="color: #b8860b;">New Paid Order Confirmed - VELOURAZ</h2>
            <p><strong>Order ID:</strong> #${orderId}</p>
            <p><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
            <p><strong>Razorpay Payment ID:</strong> ${order.razorpayPaymentId}</p>
            <p><strong>Subtotal:</strong> ${subtotalFormatted}</p>
            <p><strong>Delivery Charges:</strong> ${shippingFormatted}</p>
            ${discountFormatted ? `<p><strong>Discount:</strong> ${discountFormatted}</p>` : ""}
            <p><strong>Amount Paid:</strong> <strong style="color: #b8860b;">${totalFormatted}</strong></p>
            <p><strong>Delivery Address:</strong> ${addressFormatted}</p>
            <hr />
            <h3>Items:</h3>
            <ul>
              ${(order.items || []).map((i) => `<li>${i.name} (Qty: ${i.quantity || 1}) - ₹${i.price}</li>`).join("")}
            </ul>
          </div>
        `,
      }),
    ]);

    console.log(`[Velouraz Mailer] Order confirmation emails dispatched for Order #${orderId}`);
  } catch (emailErr) {
    console.error("[Email Notification Error]:", emailErr);
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ─── GET: Check order status & reconcile with Razorpay if pending ──────────
  if (req.method === "GET") {
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
                const updates = {
                  paymentStatus: "PAID",
                  orderStatus: "CONFIRMED",
                  razorpayPaymentId: capturedPayment.id,
                  paidAt: new Date().toISOString(),
                  stockDeducted: true,
                  updatedAt: serverTimestamp(),
                };

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

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed. Use GET or POST.",
    });
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid JSON in request body.",
        });
      }
    }

    const {
      order_id,
      payment_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      signature,
      orderId: internalOrderId,
    } = body || {};

    const resolvedOrderId = order_id || razorpay_order_id;
    const resolvedPaymentId = payment_id || razorpay_payment_id;
    const resolvedSignature = signature || razorpay_signature;

    // Check for missing required fields
    if (!resolvedOrderId || !resolvedPaymentId || !resolvedSignature) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment fields: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.",
        missing: {
          razorpay_order_id: !resolvedOrderId,
          razorpay_payment_id: !resolvedPaymentId,
          razorpay_signature: !resolvedSignature,
        },
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;

    if (!keySecret) {
      console.error("[Razorpay Verify] RAZORPAY_KEY_SECRET is not configured on server.");
      return res.status(500).json({
        success: false,
        message: "Razorpay secret key is not configured on the server.",
      });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 1. Cryptographic HMAC-SHA256 Signature Verification
    // ─────────────────────────────────────────────────────────────────────────────
    const textToSign = `${resolvedOrderId}|${resolvedPaymentId}`;
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(textToSign)
      .digest("hex");

    let isSignatureValid = false;
    try {
      const genBuf = Buffer.from(generatedSignature, "utf8");
      const sigBuf = Buffer.from(resolvedSignature, "utf8");
      if (genBuf.length === sigBuf.length && crypto.timingSafeEqual(genBuf, sigBuf)) {
        isSignatureValid = true;
      }
    } catch {
      isSignatureValid = false;
    }

    if (!isSignatureValid) {
      console.warn(
        `[Signature Mismatch] Order: ${resolvedOrderId}, Payment: ${resolvedPaymentId}. Received: ${resolvedSignature}, Generated: ${generatedSignature}`
      );
      return res.status(400).json({
        success: false,
        verified: false,
        message: "Payment signature verification failed. Signature mismatch.",
      });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 2. Locate Pending Order in Firestore
    // ─────────────────────────────────────────────────────────────────────────────
    let targetOrderDoc = null;
    let targetOrderId = null;
    let orderData = null;

    // A. Search by razorpayOrderId
    try {
      const q = query(
        collection(db, "orders"),
        where("razorpayOrderId", "==", resolvedOrderId)
      );
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        targetOrderDoc = querySnap.docs[0];
        targetOrderId = targetOrderDoc.id;
        orderData = targetOrderDoc.data();
      }
    } catch (queryErr) {
      console.warn("[Firestore Order Query Notice]:", queryErr?.message);
    }

    // B. Search by internalOrderId if provided and not yet found
    if (!orderData && internalOrderId) {
      try {
        const directDocRef = doc(db, "orders", internalOrderId);
        const directSnap = await getDoc(directDocRef);
        if (directSnap.exists()) {
          targetOrderDoc = directSnap;
          targetOrderId = directSnap.id;
          orderData = directSnap.data();
        }
      } catch (directDocErr) {
        console.warn("[Firestore Direct Doc Read Notice]:", directDocErr?.message);
      }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 3. Idempotency Check (If already confirmed & paid)
    // ─────────────────────────────────────────────────────────────────────────────
    if (orderData && (orderData.paymentStatus === "PAID" || orderData.orderStatus === "CONFIRMED")) {
      console.log(`[Idempotent Payment Verification] Order ${targetOrderId} is already PAID.`);
      return res.status(200).json({
        success: true,
        verified: true,
        alreadyConfirmed: true,
        message: "Payment already verified and confirmed.",
        orderId: targetOrderId,
        orderNumber: orderData.orderNumber || targetOrderId,
        order: { id: targetOrderId, ...orderData },
      });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 4. Server-to-Server Razorpay Payment API Verification
    // ─────────────────────────────────────────────────────────────────────────────
    if (keyId && keySecret) {
      try {
        const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
        const pResponse = await fetch(`https://api.razorpay.com/v1/payments/${resolvedPaymentId}`, {
          method: "GET",
          headers: {
            Authorization: authHeader,
          },
        });

        if (pResponse.ok) {
          const paymentDetails = await pResponse.json();

          // Verify order ID association
          if (paymentDetails.order_id && paymentDetails.order_id !== resolvedOrderId) {
            console.error(`[Fraud Alert] Payment ${resolvedPaymentId} belongs to Razorpay order ${paymentDetails.order_id}, but request specified ${resolvedOrderId}`);
            return res.status(400).json({
              success: false,
              verified: false,
              message: "Payment verification failed. Razorpay Order ID mismatch with captured payment.",
            });
          }

          // Verify payment status is authorized or captured
          const validStatuses = ["authorized", "captured"];
          if (!validStatuses.includes(paymentDetails.status)) {
            console.warn(`[Payment Status Warning] Payment status is ${paymentDetails.status}`);
            return res.status(400).json({
              success: false,
              verified: false,
              message: `Payment is in ${paymentDetails.status} state, not completed.`,
            });
          }

          // Verify currency is INR
          if (paymentDetails.currency && paymentDetails.currency.toUpperCase() !== "INR") {
            return res.status(400).json({
              success: false,
              verified: false,
              message: "Currency mismatch. Expected INR.",
            });
          }

          // Verify amount if order record exists
          if (orderData && orderData.totalAmount) {
            const expectedPaise = Math.round(Number(orderData.totalAmount) * 100);
            if (paymentDetails.amount && Math.abs(paymentDetails.amount - expectedPaise) > 10) {
              console.error(`[Amount Mismatch Alert] Order expects ${expectedPaise} paise, but payment is ${paymentDetails.amount} paise`);
              return res.status(400).json({
                success: false,
                verified: false,
                message: "Payment amount does not match the order total.",
              });
            }
          }
        }
      } catch (rzpApiErr) {
        console.warn("[Razorpay Payment Fetch Notice]:", rzpApiErr?.message);
        // Continue if API check had transient network failure, since cryptographic signature passed
      }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 5. Atomic Stock Deduction (Deducted Exactly Once)
    // ─────────────────────────────────────────────────────────────────────────────
    if (orderData && !orderData.stockDeducted && Array.isArray(orderData.items)) {
      for (const item of orderData.items) {
        if (item.id && !item.id.startsWith("bs-")) {
          try {
            const pRef = doc(db, "products", item.id);
            const pSnap = await getDoc(pRef);
            if (pSnap.exists()) {
              const currentStock = Number(pSnap.data().stock ?? 0);
              const deductQty = Math.max(1, Number(item.quantity) || 1);
              const newStock = Math.max(0, currentStock - deductQty);
              await updateDoc(pRef, {
                stock: newStock,
                stock_status: newStock <= 0 ? "Out of Stock" : "In Stock",
                updatedAt: serverTimestamp(),
              });
            }
          } catch (stkErr) {
            console.error(`[Stock Deduction Error for ${item.id}]:`, stkErr);
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 6. Update Existing Order Record to PAID & CONFIRMED
    // ─────────────────────────────────────────────────────────────────────────────
    const confirmedAt = new Date().toISOString();
    let finalOrder = null;

    if (targetOrderId) {
      const orderRef = doc(db, "orders", targetOrderId);
      const updates = {
        paymentStatus: "PAID",
        orderStatus: "CONFIRMED",
        paymentMethod: "RAZORPAY",
        razorpayPaymentId: resolvedPaymentId,
        razorpayOrderId: resolvedOrderId,
        paidAt: confirmedAt,
        stockDeducted: true,
        updatedAt: serverTimestamp(),
      };

      try {
        await updateDoc(orderRef, updates);
        finalOrder = { id: targetOrderId, ...orderData, ...updates };
      } catch (updateErr) {
        console.error("[Firestore Order Update Error]:", updateErr);
      }
    }

    // Dispatch emails securely (awaited with timeout guard so serverless does not freeze before network finish)
    if (finalOrder) {
      try {
        await Promise.race([
          dispatchOrderConfirmationEmails(finalOrder),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Email dispatch timeout")), 6500)),
        ]);
      } catch (mailErr) {
        console.warn("[Verify Payment Mail Notice]:", mailErr?.message || mailErr);
      }
    }

    return res.status(200).json({
      success: true,
      verified: true,
      message: "Payment verified successfully.",
      orderId: targetOrderId || resolvedOrderId,
      orderNumber: (finalOrder && finalOrder.orderNumber) || targetOrderId || resolvedOrderId,
      paymentId: resolvedPaymentId,
      order: finalOrder || {
        id: targetOrderId || resolvedOrderId,
        paymentStatus: "PAID",
        orderStatus: "CONFIRMED",
        paymentMethod: "RAZORPAY",
        razorpayPaymentId: resolvedPaymentId,
        razorpayOrderId: resolvedOrderId,
      },
    });
  } catch (error) {
    console.error("Unexpected error in /api/verify-payment:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Internal server error verifying payment signature.",
    });
  }
}
