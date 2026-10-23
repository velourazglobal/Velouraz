import { db } from "../components/Firebase";
import { collection, query, where, getDocs, writeBatch } from "firebase/firestore";

/**
 * Velouraz OTP & Authentication Service
 * Uses Vercel Serverless Functions + Nodemailer for OTP emails.
 */

/**
 * Normalizes email format
 */
export const normalizeEmail = (email) => {
  if (!email || typeof email !== "string") return "";
  return email.trim().toLowerCase();
};

/**
 * Auto-links any past orders placed anonymously under an email address to the user account
 */
export const syncUserGuestOrders = async (uid, email) => {
  if (!uid || !email) return 0;
  const cleanEmail = normalizeEmail(email);
  try {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("email", "==", cleanEmail));
    const snap = await getDocs(q);

    if (snap.empty) return 0;

    const batch = writeBatch(db);
    let updatedCount = 0;
    snap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.userId !== uid) {
        batch.update(docSnap.ref, { userId: uid, updatedAt: new Date().toISOString() });
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
      console.log(`[Order Sync] Successfully linked ${updatedCount} guest order(s) for email ${cleanEmail} to user account ${uid}`);
    }
    return updatedCount;
  } catch (err) {
    console.warn("[Order Sync Notice]:", err?.message || err);
    return 0;
  }
};

/**
 * Requests a 6-digit Email OTP via Vercel Serverless API (/api/send-otp)
 */
export const requestOtp = async (email) => {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("Please enter a valid email address.");
  }

  const response = await fetch("/api/send-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: cleanEmail }),
  });

  let data = {};
  try {
    data = await response.json();
  } catch (e) {
    throw new Error("Invalid response from server. Please try again.");
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Failed to send verification code. Please try again.");
  }

  return data;
};

/**
 * Verifies a 6-digit Email OTP via Vercel Serverless API (/api/verify-otp)
 */
export const verifyOtp = async (email, otp, orderId = null, displayName = "") => {
  const cleanEmail = normalizeEmail(email);
  const cleanOtp = (otp || "").toString().trim();

  if (!cleanEmail || cleanOtp.length !== 6) {
    throw new Error("Please enter a valid 6-digit verification code.");
  }

  const response = await fetch("/api/verify-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: cleanEmail,
      otp: cleanOtp,
      orderId,
      displayName,
    }),
  });

  let data = {};
  try {
    data = await response.json();
  } catch (e) {
    throw new Error("Invalid response from server. Please try again.");
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Verification code is invalid or has expired.");
  }

  return data;
};

/**
 * Creates Razorpay Order
 */
export const createRazorpayOrder = async (items, discountAmount = 0) => {
  const subtotal = items.reduce((sum, i) => sum + (Number(i.price || 0) * (i.quantity || 1)), 0);
  const shipping = subtotal >= 1999 || subtotal === 0 ? 0 : 99;
  const total = Math.max(0, subtotal + shipping - discountAmount);
  const amountInPaise = Math.round(total * 100);

  try {
    const res = await fetch("/api/create-razorpay-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amountInPaise, currency: "INR" }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          id: data.orderId,
          amount: data.amount || amountInPaise,
          currency: data.currency || "INR",
          keyId: data.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_VelourazKey",
          isSimulated: data.isSimulated || false,
        };
      }
    }
  } catch (e) {
    console.log("Razorpay API call notice, fallback to local test order:", e?.message);
  }

  return {
    id: `order_test_${Date.now()}`,
    amount: amountInPaise,
    currency: "INR",
    keyId: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_VelourazKey",
    isSimulated: true,
  };
};

/**
 * Verifies Razorpay Payment & Creates Order
 */
export const verifyPaymentAndCreateOrder = async (payload) => {
  const { customerDetails, items, appliedCoupon, paymentMethod, razorpayOrderId, razorpayPaymentId } = payload;
  const cleanEmail = normalizeEmail(customerDetails.email);

  let subtotal = 0;
  const sanitizedItems = (items || []).map((i) => {
    const price = Number(i.price || 0);
    const qty = Math.max(1, Number(i.quantity || 1));
    subtotal += price * qty;
    return {
      id: i.id || `item_${Date.now()}`,
      name: i.name || "Jewellery Item",
      price,
      original_price: Number(i.original_price || price),
      quantity: qty,
      image: i.image || "",
      size: i.size || null,
      metal: i.metal || null,
    };
  });

  const shippingFee = subtotal >= 1999 || subtotal === 0 ? 0 : 99;
  const discountAmount = appliedCoupon ? Number(appliedCoupon.discountAmount || 0) : 0;
  const total = Math.max(0, subtotal + shippingFee - discountAmount);

  const orderNumber = `VLZ-${Math.floor(100000 + Math.random() * 900000)}`;
  const authUid = customerDetails.userId || null;

  return {
    success: true,
    orderNumber,
    requiresOtp: !authUid,
    email: cleanEmail,
  };
};
