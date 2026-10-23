import nodemailer from "nodemailer";

// ─── SMTP Configuration ────────────────────────────────────────────────────────
// All credentials come from environment variables only.
// Set SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS in:
//   Local → .env file
//   Production → Vercel Dashboard → Project → Settings → Environment Variables

const createTransporter = (port, secure) => {
  const host = process.env.SMTP_HOST;
  const user = (process.env.SMTP_USER || "").trim();
  const pass = (process.env.SMTP_PASS || "").trim();

  if (!host || !user || !pass) {
    throw new Error(
      "[Velouraz Mailer] SMTP credentials not configured. " +
      "Set SMTP_HOST, SMTP_USER, and SMTP_PASS in your environment variables."
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
};

/**
 * Sends mail with automatic fallback between Port 465 (SSL) and Port 587 (STARTTLS)
 * Returns simulated success in dev mode if SMTP is not configured.
 */
export const sendMailWithFallback = async (mailOptions) => {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // Dev mode: simulate email if SMTP not configured
  if (!smtpUser || !smtpPass) {
    console.warn(
      "[Velouraz Mailer] SMTP not configured — email simulated in dev mode.\n" +
      `  To: ${mailOptions.to}\n  Subject: ${mailOptions.subject}`
    );
    return { simulated: true, messageId: `dev-${Date.now()}` };
  }

  const primaryPort = Number(process.env.SMTP_PORT) || 465;
  const primarySecure =
    process.env.SMTP_SECURE === "true" ||
    (process.env.SMTP_SECURE !== "false" && primaryPort === 465);

  try {
    const transporter = createTransporter(primaryPort, primarySecure);
    return await transporter.sendMail(mailOptions);
  } catch (err) {
    console.warn(
      `[Velouraz Mailer] Primary attempt (port ${primaryPort}) failed: ${err.message}. Trying fallback port...`
    );
    const fallbackPort = primaryPort === 465 ? 587 : 465;
    const fallbackSecure = fallbackPort === 465;
    const fallbackTransporter = createTransporter(fallbackPort, fallbackSecure);
    return await fallbackTransporter.sendMail(mailOptions);
  }
};

// Named transporter export for direct use
export const transporter = {
  sendMail: sendMailWithFallback,
};
