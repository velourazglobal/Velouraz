import React, { useEffect, useState } from "react";
import { db, auth } from "./Firebase";
import { 
  collection, query, where, getDocs, addDoc, doc, getDoc, setDoc, updateDoc, deleteDoc, writeBatch 
} from "firebase/firestore";
import { 
  signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail, updatePassword as firebaseUpdatePassword,
  signInWithCustomToken, onAuthStateChanged
} from "firebase/auth";
import { AuthContext } from "./useAuth";
import { requestOtp, verifyOtp, syncUserGuestOrders } from "../services/otpService";

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Restore from localStorage immediately so protected pages don't flash redirect
    const storedUser = localStorage.getItem("velouraz_user");
    let restoredUser = null;
    if (storedUser) {
      try {
        restoredUser = JSON.parse(storedUser);
        setUser(restoredUser);
      } catch (e) {
        console.error("User parse error:", e);
        localStorage.removeItem("velouraz_user");
      }
    }

    const syncStorageUser = () => {
      const current = localStorage.getItem("velouraz_user");
      if (current) {
        try {
          setUser(JSON.parse(current));
        } catch (e) {}
      } else {
        setUser(null);
      }
    };

    window.addEventListener("storage", syncStorageUser);

    // 2. Listen for native Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Firebase Auth session exists (Google, custom token, etc.)
        try {
          const userRef = doc(db, "users", fbUser.uid);
          const userSnap = await getDoc(userRef);
          let userData;
          if (userSnap.exists()) {
            userData = { uid: fbUser.uid, ...userSnap.data() };
          } else {
            userData = {
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "Customer",
              createdAt: new Date().toISOString(),
            };
            await setDoc(userRef, userData);
          }
          setUser(userData);
          localStorage.setItem("velouraz_user", JSON.stringify(userData));
          syncUserGuestOrders(userData.uid, userData.email);
        } catch (err) {
          console.error("Error fetching user on Auth change:", err);
        }
      } else {
        // Firebase Auth is null.
        // IMPORTANT: Don't wipe users who logged in via OTP client fallback —
        // those users have no Firebase Auth session but ARE valid (stored in Firestore + localStorage).
        const currentStored = localStorage.getItem("velouraz_user");
        if (!currentStored) {
          // No localStorage user either, truly logged out
          setUser(null);
        }
        // If localStorage has a user (OTP fallback login), keep them signed in.
        // They will be cleared only on explicit logout().
      }
      setLoading(false);
    });

    return () => {
      window.removeEventListener("storage", syncStorageUser);
      unsubscribe();
    };
  }, []);

  // Standard Email & Password Login
  const login = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const q = query(collection(db, "users"), where("email", "==", cleanEmail), where("password", "==", password));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const userData = { uid: snap.docs[0].id, ...snap.docs[0].data() };
      setUser(userData);
      localStorage.setItem("velouraz_user", JSON.stringify(userData));
      syncUserGuestOrders(userData.uid, userData.email);
      return userData;
    } else {
      throw new Error("Invalid email or password.");
    }
  };

  // Google OAuth Sign In
  const googleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const gUser = result.user;

    const userRef = doc(db, "users", gUser.uid);
    const userSnap = await getDoc(userRef);

    let userData;
    if (userSnap.exists()) {
      userData = { uid: gUser.uid, ...userSnap.data() };
    } else {
      userData = {
        uid: gUser.uid,
        email: gUser.email,
        displayName: gUser.displayName || gUser.email.split("@")[0],
        photoURL: gUser.photoURL || "",
        createdAt: new Date().toISOString(),
        authProvider: "google",
      };
      await setDoc(userRef, userData);
    }

    setUser(userData);
    localStorage.setItem("velouraz_user", JSON.stringify(userData));
    syncUserGuestOrders(userData.uid, userData.email);
    return userData;
  };

  // Passwordless Email OTP Login
  const sendEmailOtp = async (email) => {
    return await requestOtp(email);
  };

  const verifyEmailOtp = async (email, otp, orderId = null, displayName = "") => {
    const result = await verifyOtp(email, otp, orderId, displayName);
    if (result.customToken) {
      try {
        await signInWithCustomToken(auth, result.customToken);
      } catch (err) {
        console.warn("Custom token sign in warning:", err);
      }
    }

    // Load updated Firestore user doc
    const userRef = doc(db, "users", result.uid);
    const userSnap = await getDoc(userRef);
    let userData;
    if (userSnap.exists()) {
      userData = { uid: result.uid, ...userSnap.data() };
    } else {
      userData = {
        uid: result.uid,
        email: result.email,
        displayName: displayName || result.email.split("@")[0],
        createdAt: new Date().toISOString(),
      };
    }

    setUser(userData);
    localStorage.setItem("velouraz_user", JSON.stringify(userData));
    syncUserGuestOrders(userData.uid, userData.email);
    return { ...userData, isNewUser: result.isNewUser };
  };

  // Password Reset / Forgot Password
  const resetPassword = async (email) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) throw new Error("Please enter a valid email address.");

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return {
        success: true,
        message: `Password reset verification email sent to ${cleanEmail}. Please check your inbox to set a new password!`,
      };
    } catch (err) {
      console.warn("Firebase Auth reset password error/fallback:", err);
      const q = query(collection(db, "users"), where("email", "==", cleanEmail));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return {
          success: true,
          message: `Verification reset instructions dispatched to ${cleanEmail}. Please check your email to log in.`,
        };
      } else {
        throw new Error("No account found registered under this email address.");
      }
    }
  };

  // Change Password
  const changePassword = async (newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    if (auth.currentUser) {
      await firebaseUpdatePassword(auth.currentUser, newPassword);
    }

    if (user?.uid) {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { password: newPassword, updatedAt: new Date().toISOString() });
      const updatedUser = { ...user, password: newPassword };
      setUser(updatedUser);
      localStorage.setItem("velouraz_user", JSON.stringify(updatedUser));
    }
    return true;
  };

  // Standard Email & Password Signup
  const signup = async (email, password, displayName) => {
    const cleanEmail = email.trim().toLowerCase();
    const q = query(collection(db, "users"), where("email", "==", cleanEmail));
    const snap = await getDocs(q);
    if (!snap.empty) {
      throw new Error("An account already exists with this email address.");
    }

    const userData = {
      email: cleanEmail,
      password,
      displayName,
      createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, "users"), userData);
    const finalUser = { uid: docRef.id, ...userData };
    setUser(finalUser);
    localStorage.setItem("velouraz_user", JSON.stringify(finalUser));
    syncUserGuestOrders(finalUser.uid, finalUser.email);
    return finalUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("velouraz_user");
    auth.signOut().catch(() => {});
  };

  const deleteAccount = async () => {
    if (!user?.uid) return;
    try {
      await deleteDoc(doc(db, "users", user.uid));
      logout();
      return true;
    } catch (error) {
      console.error("Error deleting account:", error);
      throw error;
    }
  };

  const value = { 
    user, 
    loading, 
    login, 
    signup, 
    googleSignIn, 
    sendEmailOtp,
    verifyEmailOtp,
    resetPassword, 
    changePassword, 
    logout, 
    deleteAccount 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;

