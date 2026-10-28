import crypto from "crypto";

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

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed. Use POST.",
    });
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (parseErr) {
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
    } = body || {};

    const resolvedOrderId = order_id || razorpay_order_id;
    const resolvedPaymentId = payment_id || razorpay_payment_id;
    const resolvedSignature = signature || razorpay_signature;

    // Check for missing fields
    if (!resolvedOrderId || !resolvedPaymentId || !resolvedSignature) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields. order_id, payment_id, and signature are required.",
        missing: {
          order_id: !resolvedOrderId,
          payment_id: !resolvedPaymentId,
          signature: !resolvedSignature,
        },
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      console.error("RAZORPAY_KEY_SECRET is not configured on server.");
      return res.status(500).json({
        success: false,
        message: "Razorpay secret key is not configured on the server.",
      });
    }

    // Generate expected HMAC-SHA256 signature
    const textToSign = `${resolvedOrderId}|${resolvedPaymentId}`;
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(textToSign)
      .digest("hex");

    // Timing-safe comparison to prevent timing attacks
    let isSignatureValid = false;
    try {
      const genBuf = Buffer.from(generatedSignature, "utf8");
      const sigBuf = Buffer.from(resolvedSignature, "utf8");
      if (genBuf.length === sigBuf.length && crypto.timingSafeEqual(genBuf, sigBuf)) {
        isSignatureValid = true;
      }
    } catch (cmpErr) {
      isSignatureValid = false;
    }

    if (!isSignatureValid) {
      console.warn(`[Signature Mismatch] For Order ${resolvedOrderId}: received ${resolvedSignature}, generated ${generatedSignature}`);
      return res.status(400).json({
        success: false,
        verified: false,
        message: "Payment signature verification failed. Signature mismatch.",
      });
    }

    // Success - Verified genuine payment
    return res.status(200).json({
      success: true,
      verified: true,
      message: "Payment signature verified successfully.",
      order_id: resolvedOrderId,
      payment_id: resolvedPaymentId,
    });
  } catch (error) {
    console.error("Unexpected error in /api/verify-payment:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Internal server error verifying payment signature.",
    });
  }
}

