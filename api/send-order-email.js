import { sendMailWithFallback } from "./utils/mailer.js";

const formatItemsHtml = (items = []) => {
  if (!items || items.length === 0) {
    return `<tr><td colspan="3" style="padding: 14px; color: #8a8292;">No items specified</td></tr>`;
  }
  return items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #2e2633;">
        <td style="padding: 14px; color: #ffffff; font-size: 14px;">
          <strong>${item.name || item.title || "Jewellery Item"}</strong>
        </td>
        <td style="padding: 14px; color: #b5adc0; font-size: 14px; text-align: center;">
          ${item.quantity || 1}
        </td>
        <td style="padding: 14px; color: #d4af37; font-size: 14px; text-align: right; font-weight: 500;">
          ₹${(Number(item.price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}
        </td>
      </tr>
    `
    )
    .join("");
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let orderData = req.body;
  if (typeof orderData === "string") {
    try {
      orderData = JSON.parse(orderData);
    } catch (e) {
      // Keep as string fallback
    }
  }

  if (!orderData) {
    return res.status(400).json({ error: "Order details are missing." });
  }

  const customerEmail = orderData.email || orderData.shippingAddress?.email;
  if (!customerEmail) {
    return res.status(400).json({ error: "Customer email address is required." });
  }

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const adminEmail = process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || smtpUser || "admin@velouraz.com";

  // Dev mode simulation if SMTP missing
  if (!smtpUser || !smtpPass) {
    console.warn(`[DEV MODE] SMTP not configured in .env. Simulated order email for Order #${orderData.id || orderData.orderId}`);
    return res.status(200).json({
      success: true,
      simulated: true,
      message: "Dev Mode: SMTP credentials not set in .env. Email dispatch simulated.",
    });
  }

  const orderId = orderData.id || orderData.orderId || "VEL-" + Math.floor(100000 + Math.random() * 900000);
  const customerName = orderData.customerName || orderData.shippingAddress?.name || "Valued Customer";
  const orderDateFormatted = new Date(orderData.orderDate || Date.now()).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const totalFormatted = `₹${Number(orderData.totalAmount || orderData.total || 0).toLocaleString("en-IN")}`;
  const addressFormatted = orderData.shippingAddress?.fullAddress ||
    `${orderData.shippingAddress?.address || ""}, ${orderData.shippingAddress?.city || ""} - ${orderData.shippingAddress?.pincode || ""}`;
  const paymentMethod = (orderData.paymentMethod || "online").toUpperCase();
  const paymentStatus = orderData.paymentStatus || "Paid";

  // 1. Customer Receipt Email
  const customerMailOptions = {
    from: process.env.SMTP_FROM || `"Velouraz" <${smtpUser}>`,
    to: customerEmail,
    subject: `Order Confirmation #${orderId} - Velouraz`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation #${orderId}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0d0b0e; color: #ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" maxWidth="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #161217; border: 1px solid #2e2633; border-radius: 14px; overflow: hidden; padding: 40px 30px;">
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <h1 style="margin: 0; font-family: Georgia, serif; font-size: 26px; font-weight: normal; letter-spacing: 4px; color: #d4af37;">VELOURAZ</h1>
                    <p style="margin: 5px 0 0 0; font-size: 14px; tracking: 2px; text-transform: uppercase; color: #8a8292;">High Jewellery</p>
                  </td>
                </tr>
                <tr>
                  <td style="border-top: 1px solid #2e2633; padding-top: 25px;">
                    <h2 style="font-size: 18px; color: #ffffff; margin-bottom: 8px;">Order Confirmed!</h2>
                    <p style="font-size: 14px; color: #b5adc0; line-height: 1.6; margin: 0 0 20px 0;">
                      Dear ${customerName},<br>
                      Thank you for choosing Velouraz. Your order has been placed successfully and is currently being processed by our artisans.
                    </p>

                    <div style="background: #1e1921; padding: 15px 20px; border-radius: 8px; margin-bottom: 25px; border-left: 3px solid #d4af37;">
                      <p style="margin: 3px 0; font-size: 14px; color: #b5adc0;"><strong>Order ID:</strong> #${orderId}</p>
                      <p style="margin: 3px 0; font-size: 14px; color: #b5adc0;"><strong>Date:</strong> ${orderDateFormatted}</p>
                      <p style="margin: 3px 0; font-size: 14px; color: #b5adc0;"><strong>Payment Method:</strong> ${paymentMethod} (${paymentStatus})</p>
                    </div>

                    <h3 style="font-size: 15px; color: #d4af37; margin-bottom: 14px;">Order Summary</h3>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px;">
                      <thead>
                        <tr style="border-bottom: 1px solid #2e2633; background: #1e1921;">
                          <th style="padding: 14px; text-align: left; color: #8a8292; font-size: 14px; text-transform: uppercase;">Item</th>
                          <th style="padding: 14px; text-align: center; color: #8a8292; font-size: 14px; text-transform: uppercase;">Qty</th>
                          <th style="padding: 14px; text-align: right; color: #8a8292; font-size: 14px; text-transform: uppercase;">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${formatItemsHtml(orderData.items)}
                      </tbody>
                    </table>

                    <div style="text-align: right; padding-top: 14px; border-top: 1px dashed #2e2633;">
                      <p style="margin: 0; font-size: 18px; font-weight: bold; color: #d4af37;">Total Amount: ${totalFormatted}</p>
                    </div>

                    <div style="margin-top: 30px; padding: 20px; background: #1e1921; border-radius: 8px;">
                      <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #ffffff;">Shipping Address</h4>
                      <p style="margin: 0; font-size: 14px; color: #b5adc0; line-height: 1.5;">${addressFormatted}</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="border-top: 1px solid #2e2633; margin-top: 30px; padding-top: 25px;">
                    <p style="font-size: 14px; color: #8a8292; margin: 0;">
                      Need assistance? Reply to this email or contact support at ${adminEmail}.
                    </p>
                    <p style="font-size: 14px; color: #6b6374; margin-top: 14px;">
                      © ${new Date().getFullYear()} Velouraz High Jewellery. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  // 2. Admin Alert Email
  const adminMailOptions = {
    from: process.env.SMTP_FROM || `"Velouraz Orders" <${smtpUser}>`,
    to: adminEmail,
    subject: `🚨 NEW ORDER RECEIVED: #${orderId} (${totalFormatted})`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #111;">
        <h2 style="color: #b8860b;">New Order Received - Velouraz</h2>
        <p><strong>Order ID:</strong> #${orderId}</p>
        <p><strong>Customer Name:</strong> ${customerName}</p>
        <p><strong>Customer Email:</strong> ${customerEmail}</p>
        <p><strong>Total Amount:</strong> ${totalFormatted}</p>
        <p><strong>Payment Method:</strong> ${paymentMethod}</p>
        <p><strong>Shipping Address:</strong> ${addressFormatted}</p>
        <hr />
        <h3>Purchased Items:</h3>
        <ul>
          ${(orderData.items || []).map((i) => `<li>${i.name} (x${i.quantity || 1}) - ₹${i.price}</li>`).join("")}
        </ul>
      </div>
    `,
  };

  try {
    await Promise.all([
      sendMailWithFallback(customerMailOptions),
      sendMailWithFallback(adminMailOptions),
    ]);
    console.log(`[Nodemailer] Order confirmation emails sent for Order #${orderId}`);
    return res.status(200).json({ success: true, message: "Order emails sent successfully." });
  } catch (error) {
    console.error("[Nodemailer] Failed to send order confirmation emails:", error);
    return res.status(500).json({ error: error.message || "Failed to send order emails." });
  }
}
