import crypto from "crypto";
import { sendMailWithFallback } from "./utils/mailer.js";
import { db, doc, getDoc, setDoc } from "./utils/firebaseServer.js";

const normalizeEmail = (email) => {
  if (!email || typeof email !== "string") return "";
  return email.trim().toLowerCase();
};

const hashOtp = (email, otp) => {
  // OTP_SECRET must be set in environment — prevents use of predictable salts
  const secret = process.env.OTP_SECRET;
  if (!secret) {
    throw new Error('[Velouraz OTP] OTP_SECRET environment variable is not set. Add it to your .env or Vercel settings.');
  }
  return crypto.createHmac('sha256', secret).update(`${email}:${otp}`).digest('hex');
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

  // 3. Validate email
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid email address.",
    });
  }

  try {
    const now = Date.now();
    const sessionRef = doc(db, "otpSessions", cleanEmail);
    const sessionSnap = await getDoc(sessionRef);

    // 4. Resend Cooldown / Rate Limiting (60 seconds)
    if (sessionSnap.exists()) {
      const data = sessionSnap.data();
      if (data.lastSentAt && now - data.lastSentAt < 60000) {
        const waitSec = Math.ceil((60000 - (now - data.lastSentAt)) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitSec} seconds before requesting another code.`,
        });
      }
    }

    // 5. Generate 6-digit OTP server-side
    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = hashOtp(cleanEmail, otp);
    const expiresAt = now + 5 * 60 * 1000; // 5 minutes expiration

    // 6. Store session securely in Firestore
    await setDoc(sessionRef, {
      email: cleanEmail,
      otpHash: hashedOtp,
      expiresAt,
      attempts: 0,
      used: false,
      createdAt: new Date().toISOString(),
      lastSentAt: now,
    });

    // 7. Prepare email content
    const smtpUser = process.env.SMTP_USER;
    const fromAddress = process.env.SMTP_FROM || (smtpUser ? `"Velouraz High Jewellery" <${smtpUser}>` : '');

    const mailOptions = {
      from: fromAddress,
      to: cleanEmail,
      subject: `${otp} is your Velouraz Verification Code`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Velouraz Verification Code</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0d0b0e; color: #ffffff;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" maxWidth="550" cellpadding="0" cellspacing="0" style="max-width: 550px; background-color: #161217; border: 1px solid #2e2633; border-radius: 14px; overflow: hidden; padding: 40px 30px;">
                  <tr>
                    <td align="center" style="padding-bottom: 20px;">
                      <h1 style="margin: 0; font-family: Georgia, serif; font-size: 26px; font-weight: normal; letter-spacing: 4px; color: #d4af37;">VELOURAZ</h1>
                      <p style="margin: 5px 0 0 0; font-size: 14px; tracking: 2px; text-transform: uppercase; color: #8a8292;">High Jewellery</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="border-top: 1px solid #2e2633; padding-top: 25px;">
                      <h2 style="font-size: 18px; font-weight: 500; color: #ffffff; margin-bottom: 14px;">Verification Code</h2>
                      <p style="font-size: 14px; color: #b5adc0; line-height: 1.6; margin: 0 0 24px 0;">
                        Please enter the verification code below to verify your email and proceed.
                      </p>
                      <div style="text-align: center; margin: 30px 0; padding: 20px; background: #1e1921; border-radius: 8px; border: 1px dashed #d4af37;">
                        <span style="font-size: 34px; font-weight: bold; letter-spacing: 8px; color: #d4af37;">${otp}</span>
                      </div>
                      <p style="font-size: 14px; color: #8a8292; line-height: 1.5; margin: 0;">
                        This code is valid for <strong>5 minutes</strong>. For security reasons, please do not share this code with anyone.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="border-top: 1px solid #2e2633; margin-top: 30px; padding-top: 25px;">
                      <p style="font-size: 14px; color: #6b6374; margin: 0;">
                        If you did not request this code, please ignore this email.
                      </p>
                      <p style="font-size: 14px; color: #6b6374; margin-top: 8px;">
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

    // 8. Send Email via Nodemailer and ONLY return success after it completes
    await sendMailWithFallback(mailOptions);

    console.log(`[Vercel API] OTP email dispatched successfully to ${cleanEmail}`);
    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("[Vercel API] Failed to send OTP:", error?.message || error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to send OTP",
    });
  }
}
