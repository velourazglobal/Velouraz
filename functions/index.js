const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");
const axios = require("axios");
const Razorpay = require("razorpay");
const nodemailer = require("nodemailer");

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Helper: Normalize email
const normalizeEmail = (email) => {
  if (!email || typeof email !== "string") return "";
  return email.trim().toLowerCase();
};

// Helper: Secure SHA-256 Hash
const hashOtp = (email, otp) => {
  const secret = process.env.OTP_SECRET || "velouraz_secure_otp_salt_2026";
  return crypto.createHmac("sha256", secret).update(`${email}:${otp}`).digest("hex");
};

// Helper: Create Nodemailer Transporter
const createSmtpTransporter = () => {
  const host = process.env.SMTP_HOST || functions.config().smtp?.host || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || functions.config().smtp?.port) || 465;
  const user = process.env.SMTP_USER || functions.config().smtp?.user;
  const pass = process.env.SMTP_PASS || functions.config().smtp?.pass;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

// Helper: Send Transactional OTP Email via Nodemailer
const sendNodemailerOtp = async (toEmail, otp) => {
  const transporter = createSmtpTransporter();

  if (!transporter) {
    console.warn(`[DEV MODE] SMTP keys not configured in backend env. Generated OTP for ${toEmail}: ${otp}`);
    return { success: true, simulated: true };
  }

  const fromAddress = process.env.SMTP_FROM || functions.config().smtp?.from || `"Velouraz High Jewellery" <${process.env.SMTP_USER || functions.config().smtp?.user}>`;

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `${otp} is your Velouraz Verification Code`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #111; text-align: center; font-family: Georgia, serif;">VELOURAZ</h2>
          <hr style="border: none; border-top: 1px solid #eee;" />
          <p style="color: #333; font-size: 16px;">Hello,</p>
          <p style="color: #555; font-size: 14px;">Your 6-digit verification code is:</p>
          <div style="text-align: center; margin: 25px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #b8860b; background: #faf8f5; padding: 14px 24px; border-radius: 6px; border: 1px dashed #b8860b;">
              ${otp}
            </span>
          </div>
          <p style="color: #777; font-size: 14px;">This code expires in 10 minutes. If you did not request this code, please ignore this email.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Nodemailer OTP Error:", error.message);
    throw new Error("Failed to send verification email. Please try again.");
  }
};

// Internal OTP Sender logic
const generateAndSendOtpInternal = async (email) => {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("Invalid email address.");
  }

  const sessionRef = db.collection("otpSessions").doc(cleanEmail);
  const sessionSnap = await sessionRef.get();

  const now = Date.now();
  if (sessionSnap.exists) {
    const data = sessionSnap.data();
    if (data.lastSentAt && now - data.lastSentAt < 60000) {
      const remainingSeconds = Math.ceil((60000 - (now - data.lastSentAt)) / 1000);
      throw new Error(`Please wait ${remainingSeconds} seconds before requesting another code.`);
    }
  }

  // Generate cryptographically secure 6-digit OTP
  const otpNumber = crypto.randomInt(100000, 999999).toString();
  const hashedOtp = hashOtp(cleanEmail, otpNumber);
  const expiresAt = now + 10 * 60 * 1000; // 10 minutes

  await sessionRef.set({
    email: cleanEmail,
    otpHash: hashedOtp,
    expiresAt,
    attempts: 0,
    used: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastSentAt: now,
  });

  await sendNodemailerOtp(cleanEmail, otpNumber);
  return { success: true, message: "Verification code sent successfully." };
};

// 1. HTTP Callable / Function: Send OTP
exports.sendOtp = functions.https.onCall(async (data, context) => {
  const email = data.email;
  try {
    return await generateAndSendOtpInternal(email);
  } catch (err) {
    // Surface rate-limit and validation errors to the client
    if (err.message && (
      err.message.includes("Please wait") ||
      err.message.includes("Invalid email")
    )) {
      throw new functions.https.HttpsError("invalid-argument", err.message);
    }
    // For SMTP / infra errors: log server-side but don't crash the client
    console.error("[sendOtp] Non-fatal error, falling back:", err.message);
    throw new functions.https.HttpsError("internal", err.message || "Failed to send verification code.");
  }
});

// 2. HTTP Callable / Function: Verify OTP & Authenticate User
exports.verifyOtp = functions.https.onCall(async (data, context) => {
  const cleanEmail = normalizeEmail(data.email);
  const inputOtp = (data.otp || "").toString().trim();
  const orderId = data.orderId || null;

  if (!cleanEmail || inputOtp.length !== 6) {
    throw new functions.https.HttpsError("invalid-argument", "Please enter a valid 6-digit verification code.");
  }

  const sessionRef = db.collection("otpSessions").doc(cleanEmail);
  const sessionSnap = await sessionRef.get();

  if (!sessionSnap.exists) {
    throw new functions.https.HttpsError("not-found", "No verification session found. Please request a new code.");
  }

  const session = sessionSnap.data();
  const now = Date.now();

  if (session.used) {
    throw new functions.https.HttpsError("failed-precondition", "This code has already been used. Please request a new one.");
  }

  if (session.expiresAt < now) {
    throw new functions.https.HttpsError("deadline-exceeded", "Verification code has expired. Please request a new code.");
  }

  if ((session.attempts || 0) >= 5) {
    throw new functions.https.HttpsError("resource-exhausted", "Maximum verification attempts exceeded. Please request a new code.");
  }

  const computedHash = hashOtp(cleanEmail, inputOtp);
  if (computedHash !== session.otpHash) {
    await sessionRef.update({ attempts: (session.attempts || 0) + 1 });
    throw new functions.https.HttpsError("permission-denied", "Incorrect verification code. Please check and try again.");
  }

  // Mark session as used
  await sessionRef.update({ used: true });

  // Get or Create Firebase Auth User
  let firebaseUser;
  let isNewUser = false;
  try {
    firebaseUser = await admin.auth().getUserByEmail(cleanEmail);
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      firebaseUser = await admin.auth().createUser({
        email: cleanEmail,
        displayName: data.displayName || cleanEmail.split("@")[0],
        emailVerified: true,
      });
      isNewUser = true;
    } else {
      throw new functions.https.HttpsError("internal", "Authentication error during account setup.");
    }
  }

  const uid = firebaseUser.uid;

  // Create or Update Firestore user doc
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    await userRef.set({
      uid,
      email: cleanEmail,
      displayName: data.displayName || firebaseUser.displayName || cleanEmail.split("@")[0],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      authProvider: "email_otp",
    });
  } else {
    await userRef.update({
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // Associate order with UID if provided
  if (orderId) {
    const orderRef = db.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();
    if (orderSnap.exists) {
      await orderRef.update({
        userId: uid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }

  // Generate Custom Auth Token for Client Login
  const customToken = await admin.auth().createCustomToken(uid);

  return {
    customToken,
    uid,
    isNewUser,
    email: cleanEmail,
  };
});

// 3. HTTP Callable / Function: Create Razorpay Order
exports.createRazorpayOrder = functions.https.onCall(async (data, context) => {
  const items = data.items || [];
  if (!Array.isArray(items) || items.length === 0) {
    throw new functions.https.HttpsError("invalid-argument", "Cart is empty.");
  }

  // Server-side validation of item prices against Firestore products collection
  let subtotal = 0;
  for (const item of items) {
    if (!item.id) continue;
    const pSnap = await db.collection("products").doc(item.id).get();
    let price = Number(item.price || 0);
    if (pSnap.exists) {
      price = Number(pSnap.data().price || price);
    }
    const qty = Math.max(1, Number(item.quantity || 1));
    subtotal += price * qty;
  }

  const shippingFee = subtotal >= 1999 || subtotal === 0 ? 0 : 99;
  const discountAmount = Number(data.discountAmount || 0);
  const totalAmount = Math.max(0, subtotal + shippingFee - discountAmount);

  const keyId = process.env.RAZORPAY_KEY_ID || functions.config().razorpay?.key_id || "rzp_test_VelourazDummyKey";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || functions.config().razorpay?.key_secret || "VelourazDummySecret";

  if (!keyId || keyId === "rzp_test_VelourazDummyKey") {
    console.warn("[DEV MODE] Razorpay secret keys not set. Returning test order fallback.");
    return {
      id: `order_sim_${Date.now()}`,
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      keyId,
    };
  }

  try {
    const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await instance.orders.create({
      amount: Math.round(totalAmount * 100), // in paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    return {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    };
  } catch (err) {
    console.error("Razorpay Order Creation Error:", err);
    throw new functions.https.HttpsError("internal", "Failed to create payment order.");
  }
});

// 4. HTTP Callable / Function: Verify Razorpay Payment & Create Order
exports.verifyPaymentAndCreateOrder = functions.https.onCall(async (data, context) => {
  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    customerDetails,
    items,
    appliedCoupon,
    paymentMethod,
  } = data;

  const keySecret = process.env.RAZORPAY_KEY_SECRET || functions.config().razorpay?.key_secret || "VelourazDummySecret";

  // Signature verification for Razorpay payments
  if (paymentMethod === "razorpay" && razorpayOrderId && razorpayPaymentId && razorpaySignature) {
    if (keySecret !== "VelourazDummySecret") {
      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      if (generatedSignature !== razorpaySignature) {
        throw new functions.https.HttpsError("permission-denied", "Invalid payment signature verification failed.");
      }
    }
  }

  // Idempotency check: Check if order already exists
  if (razorpayPaymentId) {
    const existingSnap = await db
      .collection("orders")
      .where("razorpayPaymentId", "==", razorpayPaymentId)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      const existingDoc = existingSnap.docs[0];
      return {
        success: true,
        orderId: existingDoc.id,
        orderNumber: existingDoc.data().orderNumber,
        requiresOtp: false,
      };
    }
  }

  // Recalculate trusted total server-side
  let subtotal = 0;
  const sanitizedItems = [];
  for (const item of items || []) {
    let price = Number(item.price || 0);
    let originalPrice = Number(item.original_price || price);
    let name = item.name || "Jewellery Item";
    let image = item.image || "";

    if (item.id && !item.id.startsWith("bs-")) {
      const pSnap = await db.collection("products").doc(item.id).get();
      if (pSnap.exists()) {
        const pData = pSnap.data();
        price = Number(pData.price || price);
        originalPrice = Number(pData.original_price || originalPrice);
        name = pData.name || name;
        image = pData.image || pData.images?.[0] || image;
      }
    }
    const qty = Math.max(1, Number(item.quantity || 1));
    subtotal += price * qty;
    sanitizedItems.push({
      id: item.id || `item_${Date.now()}`,
      name,
      price,
      original_price: originalPrice,
      quantity: qty,
      image,
      size: item.size || null,
      metal: item.metal || null,
    });
  }

  const shippingFee = subtotal >= 1999 || subtotal === 0 ? 0 : 99;
  const discountAmount = appliedCoupon ? Number(appliedCoupon.discountAmount || 0) : 0;
  const total = Math.max(0, subtotal + shippingFee - discountAmount);

  const orderNumber = `VLZ-${Math.floor(100000 + Math.random() * 900000)}`;
  const cleanEmail = normalizeEmail(customerDetails.email);

  const authUid = context.auth?.uid || customerDetails.userId || null;

  const orderData = {
    orderNumber,
    userId: authUid,
    customerName: customerDetails.name,
    email: cleanEmail,
    phone: customerDetails.phone || "",
    alternatePhone: customerDetails.alternatePhone || "",
    shippingAddress: {
      flat: customerDetails.flat || "",
      address: customerDetails.address || "",
      city: customerDetails.city || "",
      state: customerDetails.state || "",
      pincode: customerDetails.pincode || "",
      country: customerDetails.country || "India",
      type: customerDetails.type || "Home",
    },
    items: sanitizedItems,
    subtotal,
    shippingFee,
    discountAmount,
    couponCode: appliedCoupon?.code || null,
    total,
    paymentMethod: paymentMethod || "razorpay",
    paymentStatus: paymentMethod === "cod" ? "Pending" : "Paid",
    orderStatus: "Processing",
    razorpayOrderId: razorpayOrderId || null,
    razorpayPaymentId: razorpayPaymentId || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const orderRef = await db.collection("orders").add(orderData);

  // If user is guest (!authUid), automatically send OTP for email verification & account setup
  let requiresOtp = false;
  if (!authUid) {
    requiresOtp = true;
    try {
      await generateAndSendOtpInternal(cleanEmail);
    } catch (otpErr) {
      console.error("Auto OTP dispatch error post-checkout:", otpErr.message);
    }
  }

  return {
    success: true,
    orderId: orderRef.id,
    orderNumber,
    requiresOtp,
    email: cleanEmail,
  };
});

