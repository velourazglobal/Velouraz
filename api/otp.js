import crypto from "crypto";
import { sendMailWithFallback } from "../server-utils/mailer.js";
import { 
  db, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from "../server-utils/firebaseServer.js";

const normalizeEmail = (email) => {
  if (!email || typeof email !== "string") return "";
  return email.trim().toLowerCase();
};

const hashOtp = (email, otp) => {
  const secret = process.env.OTP_SECRET || "velouraz_secure_otp_salt_2026";
  return crypto.createHmac("sha256", secret).update(`${email}:${otp}`).digest("hex");
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
    return res.status(405).json({ success: false, message: "Method not allowed. Use POST." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      // fallback
    }
  }

  const cleanEmail = normalizeEmail(body?.email);
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid email address.",
    });
  }

  // Determine whether this is a verification request or a send request
  const cleanOtp = (body?.otp || "").toString().trim();
  const isVerify =
    req.query?.action === "verify" ||
    body?.action === "verify" ||
    cleanOtp.length > 0;

  // ─── VERIFY OTP ──────────────────────────────────────────────────────────────
  if (isVerify) {
    const orderId = body?.orderId || null;
    const displayName = body?.displayName || "";

    if (cleanOtp.length !== 6) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 6-digit verification code.",
      });
    }

    try {
      const sessionRef = doc(db, "otpSessions", cleanEmail);
      const sessionSnap = await getDoc(sessionRef);

      if (!sessionSnap.exists()) {
        return res.status(400).json({
          success: false,
          message: "No verification session found. Please request a new code.",
        });
      }

      const session = sessionSnap.data();
      const now = Date.now();

      if (session.used) {
        return res.status(400).json({
          success: false,
          message: "This verification code has already been used.",
        });
      }

      if (session.expiresAt < now) {
        return res.status(400).json({
          success: false,
          message: "Verification code has expired. Please request a new code.",
        });
      }

      if ((session.attempts || 0) >= 5) {
        return res.status(400).json({
          success: false,
          message: "Maximum verification attempts exceeded. Please request a new code.",
        });
      }

      const computedHash = hashOtp(cleanEmail, cleanOtp);
      if (computedHash !== session.otpHash) {
        await updateDoc(sessionRef, { attempts: (session.attempts || 0) + 1 });
        return res.status(400).json({
          success: false,
          message: "Incorrect verification code. Please check and try again.",
        });
      }

      // Mark session as used
      await updateDoc(sessionRef, { used: true });

      // Look up or create user in Firestore
      const q = query(collection(db, "users"), where("email", "==", cleanEmail));
      const userSnap = await getDocs(q);

      let userId;
      let isNewUser = false;

      if (!userSnap.empty) {
        userId = userSnap.docs[0].id;
      } else {
        isNewUser = true;
        const newUserRef = doc(collection(db, "users"));
        userId = newUserRef.id;
        await setDoc(newUserRef, {
          uid: userId,
          email: cleanEmail,
          displayName: displayName || cleanEmail.split("@")[0],
          createdAt: new Date().toISOString(),
          authProvider: "email_otp",
        });
      }

      // Link order if orderId provided
      if (orderId) {
        try {
          const orderRef = doc(db, "orders", orderId);
          await setDoc(orderRef, { userId, updatedAt: new Date().toISOString() }, { merge: true });
        } catch (err) {
          console.warn("Failed to link order ID:", err);
        }
      }

      return res.status(200).json({
        success: true,
        uid: userId,
        isNewUser,
        email: cleanEmail,
      });
    } catch (error) {
      console.error("[Velouraz API] Verify OTP error:", error);
      return res.status(500).json({
        success: false,
        message: error?.message || "Verification failed. Please try again.",
      });
    }
  }

  // ─── SEND OTP ────────────────────────────────────────────────────────────────
  try {
    const now = Date.now();
    const sessionRef = doc(db, "otpSessions", cleanEmail);
    const sessionSnap = await getDoc(sessionRef);

    // Resend Cooldown / Rate Limiting (60 seconds)
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

    // Generate 6-digit OTP server-side
    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = hashOtp(cleanEmail, otp);
    const expiresAt = now + 5 * 60 * 1000; // 5 minutes expiration

    // Store session securely in Firestore
    await setDoc(sessionRef, {
      email: cleanEmail,
      otpHash: hashedOtp,
      expiresAt,
      attempts: 0,
      used: false,
      createdAt: new Date().toISOString(),
      lastSentAt: now,
    });

    const smtpUser = process.env.SMTP_USER;
    const fromAddress = process.env.SMTP_FROM || (smtpUser ? `"Velouraz Jewellery" <${smtpUser}>` : '');

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

    await sendMailWithFallback(mailOptions);
    console.log(`[Velouraz API] OTP email dispatched successfully to ${cleanEmail}`);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("[Velouraz API] Failed to send OTP:", error?.message || error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to send OTP",
    });
  }
}

