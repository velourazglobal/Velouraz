import crypto from "crypto";
import {
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "../server-utils/firebaseServer.js";
import { sendMailWithFallback } from "../server-utils/mailer.js";

// Helper to send order email
async function sendConfirmedOrderEmail(order) {
  try {
    const customerEmail = order.email || order.shippingAddress?.email;
    if (!customerEmail) return;

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    if (!smtpUser || !smtpPass) return;

    const orderId = order.orderNumber || order.id || `VEL-${Date.now()}`;
    const customerName = order.customerName || order.shippingAddress?.name || "Valued Customer";
    const totalFormatted = `₹${Number(order.totalAmount || order.total || 0).toLocaleString("en-IN")}`;

    await sendMailWithFallback({
      from: process.env.SMTP_FROM || `"Velouraz" <${smtpUser}>`,
      to: customerEmail,
      subject: `Payment Confirmed — Order #${orderId} | Velouraz`,
      html: `<p>Dear ${customerName}, your payment for order #${orderId} of ${totalFormatted} has been confirmed. Razorpay Payment ID: ${order.razorpayPaymentId}.</p>`,
    });
  } catch (err) {
    console.error("[Webhook Email Error]:", err);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const webhookSignature = req.headers["x-razorpay-signature"];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

    if (!webhookSignature) {
      console.warn("[Webhook Warning] Missing x-razorpay-signature header.");
      return res.status(400).json({ error: "Missing x-razorpay-signature header." });
    }

    if (!webhookSecret) {
      console.error("[Webhook Error] RAZORPAY_WEBHOOK_SECRET or RAZORPAY_KEY_SECRET is not configured.");
      return res.status(500).json({ error: "Webhook secret is not configured on server." });
    }

    // Retrieve raw body for HMAC signature verification
    let rawBody = req.rawBody;
    if (!rawBody) {
      if (typeof req.body === "string") {
        rawBody = req.body;
      } else if (Buffer.isBuffer(req.body)) {
        rawBody = req.body.toString("utf8");
      } else if (typeof req.body === "object") {
        rawBody = JSON.stringify(req.body);
      }
    }

    // Verify HMAC-SHA256 signature
    const generatedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    let isSignatureValid = false;
    try {
      const genBuf = Buffer.from(generatedSignature, "utf8");
      const sigBuf = Buffer.from(webhookSignature, "utf8");
      if (genBuf.length === sigBuf.length && crypto.timingSafeEqual(genBuf, sigBuf)) {
        isSignatureValid = true;
      }
    } catch {
      isSignatureValid = false;
    }

    if (!isSignatureValid) {
      console.warn("[Webhook Signature Mismatch] Signature validation failed.");
      return res.status(400).json({ error: "Invalid webhook signature." });
    }

    // Parse payload
    let event = req.body;
    if (typeof event === "string") {
      try {
        event = JSON.parse(event);
      } catch {
        return res.status(400).json({ error: "Invalid JSON payload." });
      }
    }

    const eventId = event?.id;
    const eventType = event?.event;

    console.log(`[Razorpay Webhook Received] Event: ${eventType}, ID: ${eventId}`);

    // Deduplicate webhook events using Firestore processed_webhooks collection
    if (eventId) {
      try {
        const webhookDocRef = doc(db, "processed_webhooks", eventId);
        const webhookSnap = await getDoc(webhookDocRef);
        if (webhookSnap.exists()) {
          console.log(`[Webhook Deduplication] Event ${eventId} was already processed.`);
          return res.status(200).json({ status: "already_processed", eventId });
        }

        // Record event ID as processed
        await setDoc(webhookDocRef, {
          eventId,
          eventType,
          processedAt: serverTimestamp(),
        });
      } catch (dedupErr) {
        console.warn("[Webhook Dedup Store Notice]:", dedupErr?.message);
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EVENT: payment.captured or order.paid
    // ─────────────────────────────────────────────────────────────────────────
    if (eventType === "payment.captured" || eventType === "order.paid") {
      const paymentEntity = event?.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id || event?.payload?.order?.entity?.id;
      const razorpayPaymentId = paymentEntity?.id;

      if (!razorpayOrderId) {
        return res.status(200).json({ status: "ignored_missing_order_id" });
      }

      // Find order in Firestore
      const q = query(
        collection(db, "orders"),
        where("razorpayOrderId", "==", razorpayOrderId)
      );
      const querySnap = await getDocs(q);

      if (!querySnap.empty) {
        const orderDoc = querySnap.docs[0];
        const orderData = orderDoc.data();

        // If already paid, do nothing (idempotent)
        if (orderData.paymentStatus === "PAID" && orderData.orderStatus === "CONFIRMED") {
          console.log(`[Webhook] Order ${orderDoc.id} is already marked as PAID.`);
          return res.status(200).json({ status: "already_paid" });
        }

        // Deduct stock if not already deducted
        if (!orderData.stockDeducted && Array.isArray(orderData.items)) {
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
                console.error(`[Webhook Stock Deduction Error]:`, stkErr);
              }
            }
          }
        }

        // Update order status to PAID and CONFIRMED
        const updates = {
          paymentStatus: "PAID",
          orderStatus: "CONFIRMED",
          paymentMethod: "RAZORPAY",
          razorpayPaymentId: razorpayPaymentId || orderData.razorpayPaymentId || "webhook_captured",
          stockDeducted: true,
          paidAt: new Date().toISOString(),
          webhookProcessedAt: new Date().toISOString(),
          updatedAt: serverTimestamp(),
        };

        await updateDoc(orderDoc.ref, updates);

        // Async email dispatch
        sendConfirmedOrderEmail({ id: orderDoc.id, ...orderData, ...updates }).catch((e) =>
          console.error("[Webhook Email Error]:", e)
        );

        console.log(`[Webhook Confirmed] Order ${orderDoc.id} marked as PAID.`);
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EVENT: payment.failed
    // ─────────────────────────────────────────────────────────────────────────
    if (eventType === "payment.failed") {
      const paymentEntity = event?.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const failureReason = paymentEntity?.error_description || paymentEntity?.error_reason || "Payment failed";

      if (razorpayOrderId) {
        const q = query(
          collection(db, "orders"),
          where("razorpayOrderId", "==", razorpayOrderId)
        );
        const querySnap = await getDocs(q);

        if (!querySnap.empty) {
          const orderDoc = querySnap.docs[0];
          const orderData = orderDoc.data();

          if (orderData.paymentStatus !== "PAID") {
            await updateDoc(orderDoc.ref, {
              paymentStatus: "FAILED",
              failureReason,
              updatedAt: serverTimestamp(),
            });
            console.log(`[Webhook Failed] Order ${orderDoc.id} marked as FAILED: ${failureReason}`);
          }
        }
      }
    }

    return res.status(200).json({ status: "ok", received: true });
  } catch (error) {
    console.error("[Webhook Exception]:", error);
    return res.status(500).json({ error: error.message || "Webhook processing failed." });
  }
}

