import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  QrCode,
  Building2,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  X,
  Lock,
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react";

const RazorpayTestModal = ({ isOpen, onClose, amount, orderId, customerData, onSuccess }) => {
  const [activeTab, setActiveTab] = useState("upi"); // 'upi' | 'card' | 'netbanking' | 'wallet'
  const [upiId, setUpiId] = useState("success@razorpay");
  const [cardNumber, setCardNumber] = useState("4111 1111 1111 1111");
  const [cardExpiry, setCardExpiry] = useState("12/30");
  const [cardCvv, setCardCvv] = useState("123");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const paymentId = `pay_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const signature = `sig_test_${Math.random().toString(36).substring(2, 12)}`;
      onSuccess({
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId || `order_test_${Date.now()}`,
        razorpay_signature: signature,
        method: activeTab,
      });
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden font-sans"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0c2340] to-[#1a3a60] p-5 text-white relative">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center font-bold text-blue-300 text-xs">
                RZP
              </div>
              <span className="text-xs uppercase tracking-widest text-blue-200 font-bold">
                Razorpay Test Payment
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <p className="text-[14px] text-blue-200 uppercase font-medium">Paying Velouraz</p>
                <h3 className="text-2xl font-bold text-white">₹{Number(amount || 0).toLocaleString()}</h3>
              </div>
              <span className="text-[14px] bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-1 rounded-full font-bold">
                TEST MODE
              </span>
            </div>
          </div>

          {/* Customer Context Bar */}
          <div className="bg-slate-50 border-b border-slate-100 px-5 py-2.5 flex items-center justify-between text-xs text-slate-600">
            <span className="truncate max-w-[200px] font-medium">{customerData?.name || "Customer"}</span>
            <span className="font-mono text-slate-400 text-[14px]">{customerData?.phone || customerData?.email}</span>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-4 border-b border-slate-100 bg-slate-50/50 p-1 text-[14px] font-semibold text-slate-600">
            <button
              onClick={() => setActiveTab("upi")}
              className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition-all ${activeTab === "upi" ? "bg-white text-blue-600 shadow-xs font-bold" : "hover:text-slate-900"
                }`}
            >
              <QrCode size={15} />
              <span>UPI / QR</span>
            </button>
            <button
              onClick={() => setActiveTab("card")}
              className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition-all ${activeTab === "card" ? "bg-white text-blue-600 shadow-xs font-bold" : "hover:text-slate-900"
                }`}
            >
              <CreditCard size={15} />
              <span>Card</span>
            </button>
            <button
              onClick={() => setActiveTab("netbanking")}
              className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition-all ${activeTab === "netbanking" ? "bg-white text-blue-600 shadow-xs font-bold" : "hover:text-slate-900"
                }`}
            >
              <Building2 size={15} />
              <span>NetBanking</span>
            </button>
            <button
              onClick={() => setActiveTab("wallet")}
              className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition-all ${activeTab === "wallet" ? "bg-white text-blue-600 shadow-xs font-bold" : "hover:text-slate-900"
                }`}
            >
              <Wallet size={15} />
              <span>Wallet</span>
            </button>
          </div>

          {/* Tab Contents */}
          <div className="p-5 space-y-4">
            {activeTab === "upi" && (
              <div className="space-y-3">
                <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-3.5 text-center">
                  <p className="text-xs font-semibold text-blue-900">Scan QR or enter test UPI ID</p>
                  <div className="w-28 h-28 mx-auto my-2.5 bg-white border border-blue-200 rounded-xl p-2 flex items-center justify-center">
                    <QrCode size={90} className="text-slate-800" />
                  </div>
                  <p className="text-[14px] text-blue-700">Supported: GPay, PhonePe, Paytm, BHIM</p>
                </div>

                <div>
                  <label className="block text-[14px] font-bold text-slate-600 uppercase mb-1">
                    Virtual Payment Address (VPA)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-medium outline-none focus:border-blue-500 bg-slate-50"
                  />
                  <p className="text-[14px] text-slate-400 mt-1">Use 'success@razorpay' to simulate successful payment.</p>
                </div>
              </div>
            )}

            {activeTab === "card" && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[14px] font-bold text-slate-600 uppercase mb-1">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3.5 py-2 pl-9 rounded-xl border border-slate-200 text-xs font-mono font-medium outline-none focus:border-blue-500 bg-slate-50"
                    />
                    <CreditCard size={15} className="absolute left-3 top-2.5 text-slate-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[14px] font-bold text-slate-600 uppercase mb-1">
                      Expiry (MM/YY)
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono text-center outline-none focus:border-blue-500 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block text-[14px] font-bold text-slate-600 uppercase mb-1">
                      CVV
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono text-center outline-none focus:border-blue-500 bg-slate-50"
                    />
                  </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-[14px] text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Razorpay test cards pre-configured for instant verification.</span>
                </div>
              </div>
            )}

            {activeTab === "netbanking" && (
              <div className="space-y-3">
                <label className="block text-[14px] font-bold text-slate-600 uppercase">
                  Select Popular Bank
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak Bank", "Yes Bank"].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setSelectedBank(b)}
                      className={`p-2.5 rounded-xl border font-medium flex items-center justify-between transition-all ${selectedBank === b
                        ? "border-blue-600 bg-blue-50/50 text-blue-900 font-bold"
                        : "border-slate-200 bg-slate-50 hover:bg-white text-slate-700"
                        }`}
                    >
                      <span>{b}</span>
                      {selectedBank === b && <Check size={14} className="text-blue-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "wallet" && (
              <div className="space-y-3">
                <label className="block text-[14px] font-bold text-slate-600 uppercase">
                  Select Wallet
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {["Amazon Pay", "Paytm Wallet", "PhonePe Wallet", "MobiKwik"].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setSelectedBank(w)}
                      className={`p-2.5 rounded-xl border font-medium flex items-center justify-between transition-all ${selectedBank === w
                        ? "border-blue-600 bg-blue-50/50 text-blue-900 font-bold"
                        : "border-slate-200 bg-slate-50 hover:bg-white text-slate-700"
                        }`}
                    >
                      <span>{w}</span>
                      {selectedBank === w && <Check size={14} className="text-blue-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={isProcessing}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Pay ₹{Number(amount || 0).toLocaleString()} (Test Mode)</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-[14px] text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Lock size={12} className="text-slate-400" />
                256-Bit SSL Encrypted
              </span>
              <span>Secured by Razorpay Sandbox</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RazorpayTestModal;
