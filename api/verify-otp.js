import crypto from "crypto";
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
} from "./utils/firebaseServer.js";

const normalizeEmail = (email) => {
  if (!email || typeof email !== "string") return "";
  return email.trim().toLowerCase();
};

const hashOtp = (email, otp) => {
  const secret = process.env.OTP_SECRET || "velouraz_secure_otp_salt_2026";
  return crypto.createHmac("sha256", secret).update(`${email}:${otp}`).digest("hex");
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
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
  const cleanOtp = (body?.otp || "").toString().trim();
  const orderId = body?.orderId || null;
  const displayName = body?.displayName || "";

  if (!cleanEmail || cleanOtp.length !== 6) {
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
    console.error("[Vercel API] Verify OTP error:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Verification failed. Please try again.",
    });
  }
}
