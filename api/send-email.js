import { sendMailWithFallback } from "../server-utils/mailer.js";
import { verifyAdminRequest } from "../server-utils/firebaseServer.js";

const normalizeEmail = (email) => {
  if (!email || typeof email !== "string") return "";
  return email.trim().toLowerCase();
};

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
  // Enable CORS
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

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed. Use POST." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      // fallback
    }
  }

  if (!body) {
    return res.status(400).json({ error: "Request payload missing." });
  }

  const isAdmin =
    req.query?.type === "admin" ||
    body?.type === "admin" ||
    Boolean(body?.adminId);

  const isShipping =
    req.query?.type === "shipping" ||
    body?.type === "shipping" ||
    Boolean(body?.awbCode || body?.awbNumber || body?.shipping?.awbCode);

  // ─── ADMIN CREDENTIALS EMAIL ────────────────────────────────────────────────

  if (isAdmin) {
    const authCheck = await verifyAdminRequest(req);
    if (!authCheck.authorized) {
      return res.status(401).json({
        success: false,
        message: authCheck.error || "Unauthorized. SuperAdmin privileges required to send admin credentials.",
      });
    }

    const cleanEmail = normalizeEmail(body?.email);
    const adminId = body?.adminId || "";
    const displayName = body?.displayName || adminId;
    const password = body?.password || "";
    const loginUrl = body?.loginUrl || "https://velouraz.in/admin";

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    if (!adminId || !password) {
      return res.status(400).json({
        success: false,
        message: "Admin ID and Password are required.",
      });
    }

    try {
      const smtpUser = process.env.SMTP_USER;
      const fromAddress =
        process.env.SMTP_FROM ||
        (smtpUser ? `"Velouraz Jewellery" <${smtpUser}>` : '"Velouraz Admin Control" <admin@velouraz.in>');

      const mailOptions = {
        from: fromAddress,
        to: cleanEmail,
        subject: `Velouraz Admin Portal - Login Credentials for ${displayName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Velouraz Admin Credentials</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0d0b0e; color: #ffffff;">
            <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="100%" maxWidth="580" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #161217; border: 1px solid #2e2633; border-radius: 14px; overflow: hidden; padding: 40px 30px;">
                    <tr>
                      <td align="center" style="padding-bottom: 20px;">
                        <h1 style="margin: 0; font-family: Georgia, serif; font-size: 26px; font-weight: normal; letter-spacing: 4px; color: #d4af37;">VELOURAZ</h1>
                        <p style="margin: 5px 0 0 0; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; color: #8a8292;">Store Administration Portal</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="border-top: 1px solid #2e2633; padding-top: 25px;">
                        <h2 style="font-size: 18px; font-weight: 500; color: #ffffff; margin-bottom: 14px;">Welcome to Velouraz Admin Team</h2>
                        <p style="font-size: 14px; color: #b5adc0; line-height: 1.6; margin: 0 0 24px 0;">
                          Hello <strong>${displayName}</strong>,<br><br>
                          Your Store Administrator account for Velouraz has been created successfully. Below are your official login credentials:
                        </p>

                        <div style="background: #1e1921; border-radius: 10px; border: 1px solid #2e2633; padding: 20px; margin-bottom: 25px;">
                          <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 14px; color: #ffffff;">
                            <tr>
                              <td width="35%" style="color: #8a8292; font-weight: bold;">Account Role:</td>
                              <td style="color: #d4af37; font-weight: bold;">Store Administrator (Admin)</td>
                            </tr>
                            <tr>
                              <td style="color: #8a8292; font-weight: bold;">Admin ID:</td>
                              <td style="font-family: monospace; font-size: 15px; color: #ffffff;">${adminId}</td>
                            </tr>
                            <tr>
                              <td style="color: #8a8292; font-weight: bold;">Email ID:</td>
                              <td style="color: #ffffff;">${cleanEmail}</td>
                            </tr>
                            <tr>
                              <td style="color: #8a8292; font-weight: bold;">Password:</td>
                              <td style="font-family: monospace; font-size: 15px; color: #d4af37; font-weight: bold;">${password}</td>
                            </tr>
                          </table>
                        </div>

                        <div style="text-align: center; margin: 25px 0;">
                          <a href="${loginUrl}" target="_blank" style="display: inline-block; background-color: #811331; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; letter-spacing: 1px;">
                            LOGIN TO ADMIN PORTAL
                          </a>
                        </div>

                        <p style="font-size: 13px; color: #8a8292; line-height: 1.5; margin: 0;">
                          For security reasons, please do not share these credentials with unauthorized persons.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="border-top: 1px solid #2e2633; margin-top: 30px; padding-top: 25px;">
                        <p style="font-size: 12px; color: #6b6374; margin: 0;">
                          © ${new Date().getFullYear()} Velouraz Jewellery. Executive Management System.
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

      await sendMailWithFallback(mailOptions);
      console.log(`[Velouraz API] Admin credentials email dispatched via Nodemailer to ${cleanEmail}`);
      return res.status(200).json({
        success: true,
        message: "Admin credentials emailed successfully via Nodemailer.",
      });
    } catch (error) {
      console.error("[Velouraz API] Failed to send admin credentials email:", error?.message || error);
      return res.status(500).json({
        success: false,
        message: error?.message || "Failed to send credentials email.",
      });
    }
  }

  // ─── SHIPPING NOTIFICATION EMAIL (SHIPROCKET DISPATCH) ──────────────────────
  if (isShipping) {
    const shippingData = body;
    const cleanCustomerEmail = normalizeEmail(
      shippingData.email ||
      shippingData.shippingAddress?.email ||
      shippingData.customerEmail ||
      shippingData.billing_email
    );

    if (!cleanCustomerEmail) {
      return res.status(400).json({ success: false, message: "Customer email is required for shipping notification." });
    }

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      console.warn(`[DEV MODE] SMTP not configured. Simulated shipping email for AWB ${shippingData.awbCode || shippingData.awbNumber}`);
      return res.status(200).json({ success: true, simulated: true, message: "Dev Mode: Shipping email simulated." });
    }

    const orderId = shippingData.orderNumber || shippingData.orderId || shippingData.id || "N/A";
    const customerName = shippingData.customerName || shippingData.shippingAddress?.name || "Valued Collector";
    const courierName = shippingData.courierName || shippingData.shipping?.courierName || "Shiprocket Express Air";
    const awbCode = shippingData.awbCode || shippingData.awbNumber || shippingData.shipping?.awbCode || "N/A";
    const estDelivery = shippingData.estimatedDeliveryDate || shippingData.estimatedDelivery || shippingData.shipping?.estimatedDeliveryDate || "3-5 Business Days";
    const trackingUrl = shippingData.trackingUrl || shippingData.shipping?.trackingUrl || `https://shiprocket.co/tracking/${awbCode}`;

    const fromAddress =
      process.env.SMTP_FROM ||
      (smtpUser ? `"Velouraz Logistics" <${smtpUser}>` : '"Velouraz Dispatch" <dispatch@velouraz.in>');

    const shippingMailOptions = {
      from: fromAddress,
      to: cleanCustomerEmail,
      subject: `Your Velouraz Order #${orderId} Has Been Dispatched! (AWB: ${awbCode})`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Order Dispatched - Velouraz</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0d0b0e; color: #ffffff;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" maxWidth="580" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #161217; border: 1px solid #2e2633; border-radius: 14px; overflow: hidden; padding: 40px 30px;">
                  <tr>
                    <td align="center" style="padding-bottom: 20px;">
                      <h1 style="margin: 0; font-family: Georgia, serif; font-size: 26px; font-weight: normal; letter-spacing: 4px; color: #d4af37;">VELOURAZ</h1>
                      <p style="margin: 5px 0 0 0; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; color: #8a8292;">Insured Express Logistics</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="border-top: 1px solid #2e2633; padding-top: 25px;">
                      <h2 style="font-size: 18px; font-weight: 500; color: #ffffff; margin-bottom: 12px;">Your Piece Has Been Packed & Shipped</h2>
                      <p style="font-size: 14px; color: #b5adc0; line-height: 1.6; margin: 0 0 24px 0;">
                        Dear <strong>${customerName}</strong>,<br><br>
                        Great news! Your handcrafted jewellery piece from Velouraz has been inspected, packed in secure packaging, and handed over to our official shipping partner <strong>${courierName}</strong>.
                      </p>

                      <div style="background: #1e1921; border-radius: 10px; border: 1px solid #2e2633; padding: 20px; margin-bottom: 25px;">
                        <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 14px; color: #ffffff;">
                          <tr>
                            <td width="40%" style="color: #8a8292; font-weight: bold;">Order Reference:</td>
                            <td style="color: #ffffff; font-weight: bold;">#${orderId}</td>
                          </tr>
                          <tr>
                            <td style="color: #8a8292; font-weight: bold;">Logistics Partner:</td>
                            <td style="color: #d4af37; font-weight: bold;">${courierName}</td>
                          </tr>
                          <tr>
                            <td style="color: #8a8292; font-weight: bold;">AWB / Tracking No:</td>
                            <td style="font-family: monospace; font-size: 15px; color: #22c55e; font-weight: bold;">${awbCode}</td>
                          </tr>
                          <tr>
                            <td style="color: #8a8292; font-weight: bold;">Est. Delivery:</td>
                            <td style="color: #ffffff;">${estDelivery}</td>
                          </tr>
                        </table>
                      </div>

                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${trackingUrl}" target="_blank" style="display: inline-block; background-color: #811331; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; font-size: 14px; letter-spacing: 1px;">
                          TRACK SHIPMENT LIVE
                        </a>
                      </div>

                      <p style="font-size: 13px; color: #8a8292; line-height: 1.5; margin: 0;">
                        You can also track your live shipment progress at any time directly on our website in your account's Orders page.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="border-top: 1px solid #2e2633; margin-top: 30px; padding-top: 25px;">
                      <p style="font-size: 12px; color: #6b6374; margin: 0;">
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

    try {
      await sendMailWithFallback(shippingMailOptions);
      console.log(`[Velouraz API] Shipping notification email dispatched to ${cleanCustomerEmail} for AWB ${awbCode}`);
      return res.status(200).json({ success: true, message: "Shipping notification email sent." });
    } catch (shipErr) {
      console.error("[Velouraz API] Failed to send shipping email:", shipErr);
      return res.status(500).json({ success: false, message: shipErr.message || "Failed to send shipping email." });
    }
  }

  // ─── ORDER CONFIRMATION EMAIL ───────────────────────────────────────────────
  const orderData = body;
  const customerEmail =
    normalizeEmail(orderData.email) ||
    normalizeEmail(orderData.shippingAddress?.email) ||
    normalizeEmail(orderData.customerEmail) ||
    normalizeEmail(orderData.billing_email);

  if (!customerEmail) {
    return res.status(400).json({ error: "Customer email address is required." });
  }

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const adminEmail = process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || smtpUser || "admin@velouraz.com";

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
  const addressFormatted =
    orderData.shippingAddress?.fullAddress ||
    `${orderData.shippingAddress?.address || ""}, ${orderData.shippingAddress?.city || ""} - ${orderData.shippingAddress?.pincode || ""}`;
  const paymentMethod = (orderData.paymentMethod || "online").toUpperCase();
  const paymentStatus = orderData.paymentStatus || "Paid";

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
                      © ${new Date().getFullYear()} Velouraz Jewellery. All rights reserved.
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
    const results = await Promise.allSettled([
      sendMailWithFallback(customerMailOptions),
      sendMailWithFallback(adminMailOptions),
    ]);
    const successCount = results.filter((r) => r.status === "fulfilled").length;
    console.log(`[Velouraz API] Order confirmation emails sent for Order #${orderId} (${successCount}/2 delivered)`);
    return res.status(200).json({ success: true, message: "Order emails sent successfully." });
  } catch (error) {
    console.error("[Velouraz API] Failed to send order confirmation emails:", error);
    return res.status(500).json({ error: error.message || "Failed to send order emails." });
  }
}

