/**
 * Velouraz Email Notification Service
 * Calls server-side Vercel API endpoints (/api/send-otp and /api/send-order-email).
 * No Nodemailer library is imported in client code.
 */

import { requestOtp } from "./otpService";

/**
 * Send 6-Digit Email OTP via Vercel Serverless API
 */
export const sendOtpViaNodemailer = async (toEmail) => {
  try {
    const result = await requestOtp(toEmail);
    return { success: true, message: result.message || "OTP sent successfully" };
  } catch (error) {
    console.error("[EmailService] Exception sending OTP email:", error);
    return { success: false, error: error.message };
  }
};

// Backward-compatibility alias
export const sendOtpViaEmailJS = sendOtpViaNodemailer;

/**
 * Send Order Confirmation & Admin Notification Emails via Vercel Serverless API
 */
export const sendOrderEmails = async (orderData) => {
  console.log("[EmailService] Initiating order email dispatches for Order #" + (orderData.id || orderData.orderId));
  try {
    const response = await fetch("/api/send-order-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    let data = {};
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.warn("[EmailService] API returned non-JSON response:", text.slice(0, 150));
      }
    }

    if (response.ok && data.success !== false) {
      console.log("[EmailService] Order emails dispatched successfully.");
      return [{ status: "fulfilled", value: { success: true } }];
    } else {
      console.error("[EmailService] Order email error response:", data.error || response.statusText);
      return [{ status: "rejected", reason: data.error || `HTTP ${response.status}: Failed to send order email` }];
    }
  } catch (error) {
    console.error("[EmailService] Exception sending order emails:", error);
    return [{ status: "rejected", reason: error.message }];
  }
};

export const sendOrderConfirmationToUser = sendOrderEmails;
export const sendOrderNotificationToAdmin = sendOrderEmails;

/**
 * Send New Admin Credentials via Nodemailer (/api/send-admin-credentials)
 */
export const sendAdminCredentialsEmail = async ({ email, adminId, displayName, password }) => {
  try {
    const loginUrl = `${window.location.origin}/admin`;
    const response = await fetch("/api/send-admin-credentials", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        adminId,
        displayName,
        password,
        loginUrl,
      }),
    });

    let data = {};
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.warn("[EmailService] API returned non-JSON response:", text.slice(0, 150));
      }
    }

    if (response.ok && data.success !== false) {
      console.log("[EmailService] Admin credentials email sent successfully to " + email);
      return { success: true, message: data.message || "Email sent successfully" };
    } else {
      console.warn("[EmailService] Server email warning:", data.message || response.statusText);
      return { success: false, error: data.message || "Failed to send email via API" };
    }
  } catch (error) {
    console.error("[EmailService] Exception sending admin credentials email:", error);
    return { success: false, error: error.message };
  }
};

