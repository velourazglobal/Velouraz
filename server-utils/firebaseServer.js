import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  runTransaction,
  writeBatch,
  serverTimestamp,
  increment,
} from "firebase/firestore";

// ─── Server-side Firebase Configuration ───────────────────────────────────────
// Reads from environment variables ONLY. No hardcoded fallbacks.
// Set these in Vercel Dashboard → Project → Settings → Environment Variables
// For local dev, set them in your .env file (never commit .env to Git)

const {
  VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID,
} = process.env;

if (!VITE_FIREBASE_API_KEY || !VITE_FIREBASE_PROJECT_ID || !VITE_FIREBASE_APP_ID) {
  const missing = [
    !VITE_FIREBASE_API_KEY && "VITE_FIREBASE_API_KEY",
    !VITE_FIREBASE_PROJECT_ID && "VITE_FIREBASE_PROJECT_ID",
    !VITE_FIREBASE_APP_ID && "VITE_FIREBASE_APP_ID",
  ].filter(Boolean);
  console.error(
    `[Velouraz API] Missing required Firebase environment variables: ${missing.join(", ")}.\n` +
    `Add them to your .env file locally, or in Vercel Dashboard → Settings → Environment Variables.`
  );
}

const firebaseConfig = {
  apiKey: VITE_FIREBASE_API_KEY,
  authDomain: VITE_FIREBASE_AUTH_DOMAIN,
  projectId: VITE_FIREBASE_PROJECT_ID,
  storageBucket: VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: VITE_FIREBASE_APP_ID,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Verifies that an incoming serverless request originates from an authorized Admin or SuperAdmin
 */
export async function verifyAdminRequest(req) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization || "";
  const adminKey = req.headers?.["x-admin-key"] || req.headers?.["x-admin-secret"] || "";

  // 1. Secret key authentication (for webhooks or server tasks)
  if (process.env.ADMIN_API_SECRET && adminKey && adminKey === process.env.ADMIN_API_SECRET) {
    return { authorized: true, role: "superadmin" };
  }

  // 2. Firebase ID Token verification
  if (authHeader.startsWith("Bearer ")) {
    const idToken = authHeader.split("Bearer ")[1].trim();
    if (!idToken) return { authorized: false, error: "Empty authorization token." };

    const apiKey = process.env.VITE_FIREBASE_API_KEY;
    if (!apiKey) return { authorized: false, error: "Firebase API configuration missing on server." };

    try {
      const resp = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        }
      );

      if (!resp.ok) {
        return { authorized: false, error: "Invalid or expired administrator token." };
      }

      const data = await resp.json();
      const user = data.users?.[0];
      if (!user) return { authorized: false, error: "Administrator identity not found." };

      const uid = user.localId;
      const email = (user.email || "").toLowerCase();

      // Check superadmins collection by document ID
      const superDoc = await getDoc(doc(db, "superadmins", uid));
      if (superDoc.exists()) {
        return { authorized: true, uid, email, role: "superadmin" };
      }

      // Check admins collection by document ID
      const adminDoc = await getDoc(doc(db, "admins", uid));
      if (adminDoc.exists()) {
        return { authorized: true, uid, email, role: "admin" };
      }

      // Check by email in superadmins
      const superQuery = query(collection(db, "superadmins"), where("email", "==", email));
      const superSnap = await getDocs(superQuery);
      if (!superSnap.empty) {
        return { authorized: true, uid, email, role: "superadmin" };
      }

      // Check by email in admins
      const adminQuery = query(collection(db, "admins"), where("email", "==", email));
      const adminSnap = await getDocs(adminQuery);
      if (!adminSnap.empty) {
        return { authorized: true, uid, email, role: "admin" };
      }

      return { authorized: false, error: "User does not possess administrator permissions." };
    } catch (err) {
      return { authorized: false, error: err.message || "Failed to verify admin credentials." };
    }
  }

  return { authorized: false, error: "Authorization required. Please provide a valid admin token." };
}

export {
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  runTransaction,
  writeBatch,
  serverTimestamp,
  increment,
};

