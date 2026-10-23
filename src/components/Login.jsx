import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "./useAuth";
import { Mail, Lock, ArrowRight, ArrowLeft, Home, Eye, EyeOff, AlertCircle, Gem, X, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import OtpModal from "./OtpModal";

const SERIF = "'Cormorant Garamond', Georgia, serif";
const GOLD = '#C8A97A';
const CRIMSON = '#2e0e43';

const Login = () => {
  const { login, googleSignIn, sendEmailOtp, verifyEmailOtp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auth Mode: "otp" (Passwordless Default) or "password" (Fallback)
  const [authMode, setAuthMode] = useState("otp");
  const [showOtpModal, setShowOtpModal] = useState(false);

  // Google Login State
  const [googleLoading, setGoogleLoading] = useState(false);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  const handleSuccessfulAuth = () => {
    const from = location.state?.from || "/";
    const buyNowItem = location.state?.buyNowItem;
    if (buyNowItem) {
      navigate(from, { state: { buyNowItem } });
    } else {
      navigate(from);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await sendEmailOtp(email);
      setShowOtpModal(true);
    } catch (err) {
      setError(err.message || "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerified = async (result) => {
    setShowOtpModal(false);
    handleSuccessfulAuth();
  };

  const handleSubmitPasswordLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      handleSuccessfulAuth();
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await googleSignIn();
      handleSuccessfulAuth();
    } catch (err) {
      console.error("Google Auth error:", err);
      setError("Google Sign-In was cancelled or failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSendResetPassword = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetMessage("");
    setResetLoading(true);
    try {
      const res = await resetPassword(resetEmail || email);
      setResetMessage(res.message);
    } catch (err) {
      setResetError(err.message || "Failed to send reset instructions.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex selection:bg-[#2e0e43] selection:text-white">

      {/* Left Panel   Brand Visual */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden items-end" style={{ background: '#0A0705' }}>
        <img
          src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=1200"
          alt="Luxury Jewelry"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,7,5,0.95) 0%, rgba(10,7,5,0.3) 50%, rgba(10,7,5,0.6) 100%)' }} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 p-14 pb-16 w-full"
        >
          <Link to="/" className="inline-block mb-12">
            <img src="/img/logo.png" alt="Velouraz" className="h-10" />
          </Link>

          <h2
            className="text-5xl xl:text-6xl font-light text-white mb-6 leading-[1.1]"
            style={{ fontFamily: SERIF }}
          >
            Welcome to the<br />
            <em className="not-italic font-semibold" style={{ color: GOLD }}>House of Velouraz</em>
          </h2>

          <p className="text-white/45 text-[16px] max-w-md leading-relaxed mb-10" style={{ fontFamily: SERIF }}>
            Where every piece of jewellery tells a story of timeless craftsmanship, inspired by cultures across the world.
          </p>

          <div className="flex items-center gap-8">
            {['Handcrafted', 'Artisanal', 'Worldwide'].map((tag, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full" style={{ background: GOLD }} />
                <span className="text-[16px] tracking-[0.25em] uppercase font-bold text-white/40">{tag}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel   Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center bg-[#FDFAF5] px-6 sm:px-12 py-12 relative">
        {/* Top Back to Shop Button */}
        <Link
          to="/shop"
          className="absolute top-6 left-6 sm:top-8 sm:left-8 inline-flex items-center gap-2 text-xs font-bold text-[#7B6D63] hover:text-[#2e0e43] uppercase tracking-widest transition-all group z-20"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Shop</span>
        </Link>

        {/* Subtle decorative element */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#2e0e43]/[0.03] rounded-full blur-[100px] pointer-events-none" />

        {/* Mobile logo */}
        <Link to="/" className="lg:hidden mb-10">
          <img src="/img/logo.png" alt="Velouraz" className="h-9" />
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[385px] relative z-10 bg-white/60 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-[#D8CBBE]/40 shadow-xl"
        >
          {/* Header */}
          <div className="mb-7">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-6 h-[1px]" style={{ background: CRIMSON }} />
              <span className="text-xs tracking-[0.25em] font-bold uppercase text-[#7B6D63]">Welcome Back</span>
            </div>
            <h1
              className="text-3xl md:text-4xl font-light text-[#2A2623] mb-2 leading-tight"
              style={{ fontFamily: SERIF }}
            >
              Sign <span className="italic" style={{ color: CRIMSON }}>In</span>
            </h1>
            <p className="text-sm text-[#7B6D63]" style={{ fontFamily: SERIF }}>
              Access your account and curated collections.
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2.5 text-red-600 text-xs font-medium"
            >
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Google Sign In Option */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full py-3 px-4 mb-5 bg-white border border-[#D8CBBE]/80 rounded-xl text-xs font-bold tracking-wider uppercase text-slate-700 hover:bg-slate-50 hover:border-[#2e0e43]/30 transition-all flex items-center justify-center gap-2.5 shadow-xs cursor-pointer active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{googleLoading ? "Connecting..." : "Sign in with Google"}</span>
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#D8CBBE]/40" />
            <span className="text-[14px] tracking-[0.2em] uppercase font-bold text-[#7B6D63]/60">Or with Email</span>
            <div className="flex-1 h-px bg-[#D8CBBE]/40" />
          </div>

          {/* Method Switcher Tabs: Email OTP (Default) vs Password */}
          <div className="flex bg-[#FAF6F0] p-1 rounded-xl mb-5 text-xs font-sans border border-[#E8DFD5]">
            <button
              type="button"
              onClick={() => { setAuthMode("otp"); setError(""); }}
              className={`flex-1 py-2 rounded-lg font-semibold tracking-wider uppercase transition-all ${authMode === "otp"
                ? "bg-white text-[#2e0e43] shadow-xs"
                : "text-[#7B6D63] hover:text-[#2e0e43]"
                }`}
            >
              Email OTP
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode("password"); setError(""); }}
              className={`flex-1 py-2 rounded-lg font-semibold tracking-wider uppercase transition-all ${authMode === "password"
                ? "bg-white text-[#2e0e43] shadow-xs"
                : "text-[#7B6D63] hover:text-[#2e0e43]"
                }`}
            >
              Password
            </button>
          </div>

          {authMode === "otp" ? (
            /* Email OTP Passwordless Form */
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-[0.18em] text-[#2A2623] ml-0.5">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7B6D63]/40 group-focus-within:text-[#2e0e43] transition-colors" size={15} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-[#D8CBBE]/60 rounded-xl focus:border-[#2e0e43] focus:ring-1 focus:ring-[#2e0e43]/20 outline-none transition-all text-sm font-medium text-[#2A2623] placeholder:text-[#7B6D63]/40"
                    required
                  />
                </div>
                <p className="text-[14px] text-[#7B6D63] font-serif mt-1">
                  We'll send a 6-digit verification code to your email. Passwordless & instant access.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group w-full py-3.5 rounded-xl text-white font-bold text-xs tracking-[0.22em] uppercase transition-all transform active:scale-[0.99] flex items-center justify-center gap-2.5 mt-2 shadow-md cursor-pointer bg-[#2e0e43] hover:bg-[#1A0829] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin text-[#C8A46A]" />
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform duration-300 text-[#C8A46A]" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Password Login Form */
            <form onSubmit={handleSubmitPasswordLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-[0.18em] text-[#2A2623] ml-0.5">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7B6D63]/40 group-focus-within:text-[#2e0e43] transition-colors" size={15} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-[#D8CBBE]/60 rounded-xl focus:border-[#2e0e43] focus:ring-1 focus:ring-[#2e0e43]/20 outline-none transition-all text-sm font-medium text-[#2A2623] placeholder:text-[#7B6D63]/40"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-0.5">
                  <label className="text-xs font-bold uppercase tracking-[0.18em] text-[#2A2623]">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setShowForgotModal(true);
                    }}
                    className="text-xs font-bold text-[#2e0e43]/80 hover:text-[#2e0e43] transition-colors uppercase tracking-wider cursor-pointer underline"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7B6D63]/40 group-focus-within:text-[#2e0e43] transition-colors" size={15} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-white border border-[#D8CBBE]/60 rounded-xl focus:border-[#2e0e43] focus:ring-1 focus:ring-[#2e0e43]/20 outline-none transition-all text-sm font-medium text-[#2A2623] placeholder:text-[#7B6D63]/40"
                    required
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
                disabled={loading}
                className="group w-full py-3.5 rounded-xl text-white font-bold text-xs tracking-[0.25em] uppercase transition-all transform active:scale-[0.99] flex items-center justify-center gap-2.5 mt-2 shadow-md cursor-pointer bg-[#2A2623] hover:bg-[#2e0e43]"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={15} strokeWidth={2} className="group-hover:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Sign Up Link */}
          <p className="text-center text-sm text-[#7B6D63] mt-6" style={{ fontFamily: SERIF }}>
            New to Velouraz?{" "}
            <Link to="/signup" state={location.state} className="text-[#2e0e43] font-semibold hover:text-[#2A2623] transition-colors border-b border-[#2e0e43]/20 hover:border-[#2A2623] pb-px">
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FDFAF5] p-6 sm:p-8 rounded-3xl max-w-md w-full border border-[#D8CBBE] shadow-2xl relative space-y-5"
            >
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setResetMessage("");
                  setResetError("");
                }}
                className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="space-y-1">
                <span className="text-xs uppercase font-bold tracking-widest text-[#2e0e43] block">Account Verification</span>
                <h3 className="text-2xl font-serif font-bold text-slate-900">Reset Your Password</h3>
                <p className="text-sm text-slate-600">
                  Enter your registered email address below. We'll send a password reset verification link to log in.
                </p>
              </div>

              {resetMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>{resetMessage}</span>
                </div>
              )}

              {resetError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <span>{resetError}</span>
                </div>
              )}

              <form onSubmit={handleSendResetPassword} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Email Address</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#2e0e43]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={resetLoading || !resetEmail.trim()}
                  className="w-full py-3.5 bg-[#2e0e43] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#1A0829] transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  {resetLoading ? "Sending Code / Link..." : "Send Verification Email"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OTP Verification Modal */}
      <OtpModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        email={email}
        onSuccess={handleOtpVerified}
      />
    </div>
  );
};

export default Login;

