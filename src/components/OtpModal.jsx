import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ShieldCheck, ArrowRight, Loader2, RefreshCw, X, CheckCircle2, AlertCircle, Eye, EyeOff, KeyRound } from "lucide-react";
import { requestOtp, verifyOtp } from "../services/otpService";
import { db } from "./Firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";

const OtpModal = ({ isOpen, onClose, email, orderId, displayName = "", onSuccess }) => {
  // Step: "otp" (verify 6-digit code) or "setup" (new user password setup)
  const [step, setStep] = useState("otp");

  // Step 1: OTP State
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  // Step 2: New User Account Setup State
  const [verifiedResult, setVerifiedResult] = useState(null);
  const [setupDisplayName, setSetupDisplayName] = useState(displayName || "");
  const [setupPassword, setSetupPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);

  const inputRefs = useRef([]);

  // Reset modal state on open
  useEffect(() => {
    if (isOpen) {
      setStep("otp");
      setOtp(["", "", "", "", "", ""]);
      setError("");
      setResendMessage("");
      setResendCooldown(60);
      setVerifiedResult(null);
      setSetupDisplayName(displayName || "");
      setSetupPassword("");
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 150);
    }
  }, [isOpen, displayName]);

  // Resend Countdown Timer
  useEffect(() => {
    let timer;
    if (isOpen && step === "otp" && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, step, resendCooldown]);

  if (!isOpen) return null;

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    if (value.length > 1) {
      const pasted = value.slice(0, 6).split("");
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pasted[i] || "";
      }
      setOtp(newOtp);
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else {
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d+$/.test(pastedData)) return;

    const digits = pastedData.slice(0, 6).split("");
    const newOtp = ["", "", "", "", "", ""];
    digits.forEach((d, idx) => {
      newOtp[idx] = d;
    });
    setOtp(newOtp);
    const focusIdx = Math.min(digits.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleOtpSubmit = async (e) => {
    if (e) e.preventDefault();
    const fullOtp = otp.join("");
    if (fullOtp.length !== 6) {
      setError("Please enter all 6 digits of the verification code.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await verifyOtp(email, fullOtp, orderId, displayName);
      setVerifiedResult(result);

      // Immediately sync verified user into localStorage & fire storage update
      const userRef = doc(db, "users", result.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = { uid: result.uid, ...userSnap.data() };
        localStorage.setItem("velouraz_user", JSON.stringify(userData));
        window.dispatchEvent(new Event("storage"));
      }

      if (result.isNewUser) {
        // New User! Present Step 2 option to add name & password
        setSetupDisplayName(displayName || email.split("@")[0]);
        setStep("setup");
      } else {
        // Existing User! Simple login directly
        if (onSuccess) {
          await onSuccess(result);
        }
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      setError(err.message || "Invalid or expired verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAccountSetup = async (e, isSkip = false) => {
    if (e) e.preventDefault();
    setSetupLoading(true);
    setError("");

    try {
      if (!isSkip && verifiedResult?.uid) {
        const userRef = doc(db, "users", verifiedResult.uid);
        const updates = { updatedAt: new Date().toISOString() };
        if (setupDisplayName.trim()) updates.displayName = setupDisplayName.trim();
        if (setupPassword.trim()) updates.password = setupPassword.trim();
        await updateDoc(userRef, updates);

        const updatedSnap = await getDoc(userRef);
        if (updatedSnap.exists()) {
          const finalUserData = { uid: verifiedResult.uid, ...updatedSnap.data() };
          localStorage.setItem("velouraz_user", JSON.stringify(finalUserData));
        }
      }

      if (onSuccess) {
        await onSuccess(verifiedResult);
      }
    } catch (err) {
      console.error("Account setup error:", err);
      setError(err.message || "Failed to complete account setup. Please try again.");
    } finally {
      setSetupLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;

    setResendLoading(true);
    setError("");
    setResendMessage("");

    try {
      await requestOtp(email);
      setResendMessage("A new verification code has been dispatched to your email.");
      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message || "Failed to resend verification code.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md bg-white rounded-3xl border border-[#E8DFD5] shadow-2xl p-6 sm:p-8 relative overflow-hidden text-[#2A2623]"
      >
        {/* Top Gold Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2e0e43] via-[#C8A46A] to-[#2e0e43]" />

        {/* Close Button if applicable */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-[#7B6D63] hover:text-[#2e0e43] transition-colors rounded-full hover:bg-[#FAF6F0]"
          >
            <X size={18} />
          </button>
        )}

        {step === "otp" ? (
          /* STEP 1: VERIFY 6-DIGIT OTP */
          <>
            {/* Header Icon */}
            <div className="w-16 h-16 rounded-2xl bg-[#FAF6F0] border border-[#C8A46A]/40 flex items-center justify-center mx-auto mb-5 shadow-inner text-[#2e0e43]">
              <ShieldCheck size={32} className="text-[#C8A46A]" />
            </div>

            <div className="text-center space-y-2 mb-6">
              <span className="text-[14px] font-sans font-semibold uppercase tracking-[0.25em] text-[#C8A46A]">
                Security Verification
              </span>
              <h3 className="text-2xl font-serif font-normal text-[#2e0e43]">
                Verify Your Email
              </h3>
              <p className="text-xs text-[#7B6D63] font-serif leading-relaxed px-2">
                We've sent a 6-digit verification code to <br />
                <strong className="text-[#2e0e43] font-sans font-medium">{email}</strong>
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-sans flex items-start gap-2.5"
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Success Alert */}
            {resendMessage && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-sans flex items-start gap-2.5"
              >
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                <span>{resendMessage}</span>
              </motion.div>
            )}

            {/* OTP Input Grid */}
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold font-sans text-[#2e0e43] bg-[#FAF6F0]/70 border border-[#E8DFD5] rounded-xl focus:border-[#C8A46A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C8A46A]/20 transition-all"
                    disabled={loading}
                  />
                ))}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || otp.join("").length !== 6}
                className="w-full bg-[#2e0e43] text-white py-3.5 px-6 rounded-xl text-xs font-semibold uppercase tracking-[0.22em] hover:bg-[#1A0829] active:scale-[0.99] transition-all shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 group cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-[#C8A46A]" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform text-[#C8A46A]" />
                  </>
                )}
              </button>
            </form>

            {/* Resend Cooldown Bar */}
            <div className="mt-6 pt-4 border-t border-[#F5EFE8] text-center space-y-2 font-serif text-xs">
              <p className="text-[#7B6D63]">Didn't receive the verification code?</p>
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0 || resendLoading}
                className="inline-flex items-center gap-1.5 font-sans font-semibold text-[#2e0e43] hover:text-[#C8A46A] disabled:text-[#9A8E85] disabled:cursor-not-allowed transition-colors text-xs"
              >
                {resendLoading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <RefreshCw size={13} className={resendCooldown === 0 ? "text-[#C8A46A]" : ""} />
                )}
                <span>
                  {resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : "Resend verification code"}
                </span>
              </button>
            </div>
          </>
        ) : (
          /* STEP 2: NEW USER ACCOUNT & PASSWORD CREATION */
          <>
            <div className="w-16 h-16 rounded-2xl bg-[#FAF6F0] border border-[#C8A46A]/40 flex items-center justify-center mx-auto mb-5 shadow-inner text-[#2e0e43]">
              <KeyRound size={30} className="text-[#C8A46A]" />
            </div>

            <div className="text-center space-y-2 mb-6">
              <span className="text-[14px] font-sans font-semibold uppercase tracking-[0.25em] text-[#C8A46A]">
                New Account Created
              </span>
              <h3 className="text-2xl font-serif font-normal text-[#2e0e43]">
                Create Your Account Details
              </h3>
              <p className="text-xs text-[#7B6D63] font-serif leading-relaxed px-2">
                Your email is verified! Create a password so you can log in using either password or OTP next time.
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-sans flex items-start gap-2.5"
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={(e) => handleCompleteAccountSetup(e, false)} className="space-y-4 font-sans text-xs">
              <div className="space-y-1.5 text-left">
                <label className="font-bold uppercase tracking-[0.18em] text-[#2A2623] ml-0.5">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7B6D63]/40 group-focus-within:text-[#2e0e43] transition-colors" size={15} />
                  <input
                    type="text"
                    value={setupDisplayName}
                    onChange={(e) => setSetupDisplayName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-[#D8CBBE]/60 rounded-xl focus:border-[#2e0e43] focus:ring-1 focus:ring-[#2e0e43]/20 outline-none transition-all text-sm font-medium text-[#2A2623]"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="font-bold uppercase tracking-[0.18em] text-[#2A2623] ml-0.5">Create Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7B6D63]/40 group-focus-within:text-[#2e0e43] transition-colors" size={15} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={setupPassword}
                    onChange={(e) => setSetupPassword(e.target.value)}
                    placeholder="Set a password (min 6 characters)"
                    className="w-full pl-10 pr-10 py-3 bg-white border border-[#D8CBBE]/60 rounded-xl focus:border-[#2e0e43] focus:ring-1 focus:ring-[#2e0e43]/20 outline-none transition-all text-sm font-medium text-[#2A2623]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7B6D63]/40 hover:text-[#2e0e43] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={setupLoading}
                className="w-full bg-[#2e0e43] text-white py-3.5 px-6 rounded-xl text-xs font-semibold uppercase tracking-[0.22em] hover:bg-[#1A0829] active:scale-[0.99] transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 group cursor-pointer mt-2"
              >
                {setupLoading ? (
                  <Loader2 size={16} className="animate-spin text-[#C8A46A]" />
                ) : (
                  <>
                    <span>Save & Create Account</span>
                    <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform text-[#C8A46A]" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={(e) => handleCompleteAccountSetup(e, true)}
                className="w-full text-center text-xs font-semibold text-[#7B6D63] hover:text-[#2e0e43] transition-colors py-2 uppercase tracking-wider underline cursor-pointer"
              >
                Skip for now
              </button>
            </form>
          </>
        )}

        {/* Security Guarantee Note */}
        <div className="mt-4 text-center text-[14px] text-[#9A8E85] font-serif flex items-center justify-center gap-1.5">
          <Lock size={12} className="text-[#C8A46A]" />
          <span>Your information is encrypted & securely processed</span>
        </div>
      </motion.div>
    </div>
  );
};

export default OtpModal;
