export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) {
        // fallback
      }
    }

    const { amount, currency = "INR", receipt, notes } = body || {};

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount specified." });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "rzp_test_VelourazKey";
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // If real keySecret is configured, call Razorpay Orders API
    if (keySecret && keyId && !keyId.includes("Dummy")) {
      const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          amount: Math.round(Number(amount)), // amount in paise
          currency,
          receipt: receipt || `receipt_${Date.now()}`,
          notes: notes || {},
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.warn("Razorpay API Error:", data);
        return res.status(response.status).json({
          success: false,
          message: data.error?.description || "Failed to create Razorpay order",
          data,
        });
      }

      return res.status(200).json({
        success: true,
        orderId: data.id,
        amount: data.amount,
        currency: data.currency,
        keyId,
      });
    }

    // Fallback/Simulated test order creation
    const simulatedOrderId = `order_test_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    return res.status(200).json({
      success: true,
      orderId: simulatedOrderId,
      amount: Math.round(Number(amount)),
      currency: currency || "INR",
      keyId,
      isSimulated: true,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Internal server error creating Razorpay order.",
    });
  }
}
