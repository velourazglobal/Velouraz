import Razorpay from "razorpay";

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

    const { amount, currency = "INR", receipt, notes = {} } = body || {};

    // Validate amount (must be in paise, and >= 100 paise)
    const numericAmount = Number(amount);
    if (!amount || isNaN(numericAmount) || numericAmount < 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount. Minimum amount is 100 paise (₹1).",
      });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(401).json({
        success: false,
        message: "Razorpay credentials are not configured on the server.",
      });
    }

    const amountInPaise = Math.round(numericAmount);
    const orderReceipt = receipt || `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Call Razorpay Orders API
    const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: currency.toUpperCase(),
        receipt: orderReceipt,
        notes,
      }),
    });

    const data = await response.json();

    // Handle authentication failure
    if (response.status === 401) {
      return res.status(401).json({
        success: false,
        message: data.error?.description || "Razorpay authentication failed. Invalid API credentials.",
        error: data.error,
      });
    }

    // Handle other Razorpay API errors
    if (!response.ok) {
      console.error("Razorpay order creation failed:", data);
      return res.status(500).json({
        success: false,
        message: data.error?.description || "Failed to create order with Razorpay.",
        error: data.error,
      });
    }

    // Success response
    return res.status(200).json({
      success: true,
      order_id: data.id,
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
      receipt: data.receipt,
      key_id: keyId,
    });
  } catch (error) {
    console.error("Unexpected error in /api/create-order:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Internal server error while creating order.",
    });
  }
}

