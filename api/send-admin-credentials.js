import { sendMailWithFallback } from "./utils/mailer.js";

const normalizeEmail = (email) => {
  if (!email || typeof email !== "string") return "";
  return email.trim().toLowerCase();
};

export default async function handler(req, res) {
  // 1. Only allow POST method
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  // 2. Parse body
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      // fallback
    }
  }

  const cleanEmail = normalizeEmail(body?.email);
  const adminId = body?.adminId || "";
  const displayName = body?.displayName || adminId;
  const password = body?.password || "";
  const loginUrl = body?.loginUrl || "https://velouraz.in/admin";

  // 3. Validate input
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
    const fromAddress = process.env.SMTP_FROM || (smtpUser ? `"Velouraz High Jewellery" <${smtpUser}>` : '"Velouraz Admin Control" <admin@velouraz.in>');

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
                        © ${new Date().getFullYear()} Velouraz High Jewellery. Executive Management System.
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

    // Send email via Nodemailer
    await sendMailWithFallback(mailOptions);

    console.log(`[Vercel API] Admin credentials email dispatched via Nodemailer to ${cleanEmail}`);
    return res.status(200).json({
      success: true,
      message: "Admin credentials emailed successfully via Nodemailer.",
    });
  } catch (error) {
    console.error("[Vercel API] Failed to send admin credentials email:", error?.message || error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to send credentials email.",
    });
  }
}
