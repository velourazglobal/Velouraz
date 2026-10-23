import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
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

export { db, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs };
