import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, CheckCircle2, Sparkles, Loader2, Mail, Phone, User } from 'lucide-react';
import { db } from './Firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from './useAuth';
import { getOptimizedImageUrl } from '../config/cloudinary';

const NotifyMeModal = ({ isOpen, onClose, product }) => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setName(user.displayName || user.name || '');
      setPhone(user.phoneNumber || user.phone || '');
    }
    setSubmitted(false);
    setErrorMsg('');
  }, [user, isOpen]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please provide a valid email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await addDoc(collection(db, 'stock_notifications'), {
        productId: product.id,
        productName: product.name,
        productImage: product.image || product.images?.[0] || product.primaryImage || '',
        productPrice: Number(product.price || 0),
        userEmail: email.trim().toLowerCase(),
        userPhone: phone.trim(),
        userName: name.trim() || user?.displayName || 'Valued Client',
        userId: user?.uid || null,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting notification request:', err);
      setErrorMsg('Could not register request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const productImg = product.image || product.images?.[0] || product.primaryImage || '/img/jewellery/j.png';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0B0711]/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-lg bg-[#FAF8F5] border border-[#D8CBBE] rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.3)] overflow-hidden font-sans"
        >
          {/* Top Header Bar */}
          <div className="bg-[#14061F] text-[#F3ECE1] px-6 py-4 flex items-center justify-between border-b border-[#C8A46A]/30">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-[#C8A46A] animate-pulse" />
              <span className="text-xs sm:text-sm font-sans font-bold uppercase tracking-[0.2em] text-[#C8A46A]">
                Back in Stock Request
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#E5C794] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-7 space-y-5">
            {/* Product Summary Pill */}
            <div className="flex items-center gap-4 p-3 bg-white border border-[#D8CBBE]/60 rounded-2xl shadow-2xs">
              <div className="w-16 h-18 rounded-xl overflow-hidden bg-[#1A0829] border border-[#C8A46A]/30 shrink-0">
                <img
                  src={getOptimizedImageUrl(productImg)}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <span className="text-[11px] font-sans uppercase font-bold tracking-[0.2em] text-[#C8A46A] block truncate">
                  {product.category || 'Velouraz High Jewellery'}
                </span>
                <h4 className="font-serif text-sm sm:text-base text-[#2e0e43] font-normal leading-snug truncate">
                  {product.name}
                </h4>
                <p className="text-xs font-sans font-bold text-[#2e0e43]">
                  ₹{Number(product.price || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {submitted ? (
              /* Success State */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 size={32} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-serif text-2xl text-[#2e0e43] font-normal">
                    Notification Request Confirmed!
                  </h3>
                  <p className="text-xs sm:text-sm text-[#7B6D63] font-serif leading-relaxed max-w-sm mx-auto">
                    We have registered your preference for <span className="font-medium text-[#2e0e43]">{product.name}</span>. Our concierge team will reach out to <span className="font-bold text-[#2e0e43]">{email}</span> as soon as it becomes available.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="mt-2 px-8 py-3 bg-[#2e0e43] text-white text-xs font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-[#14061F] transition-all shadow-md cursor-pointer font-sans"
                >
                  Done
                </button>
              </motion.div>
            ) : (
              /* Form State */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-serif text-xl sm:text-2xl text-[#2e0e43] font-normal">
                    Be the First to Know
                  </h3>
                  <p className="text-xs text-[#7B6D63] font-serif leading-relaxed">
                    Leave your contact details below to receive priority access when this handcrafted piece is restocked.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium font-sans">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-3 pt-1">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-sans uppercase font-bold tracking-[0.16em] text-[#7B6D63] flex items-center gap-1.5">
                      <User size={12} className="text-[#C8A46A]" /> Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Maharani Devi"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-[#D8CBBE] rounded-xl text-xs sm:text-sm text-[#2e0e43] outline-none focus:border-[#2e0e43] focus:ring-1 focus:ring-[#2e0e43] transition-all font-sans"
                    />
                  </div>

                  {/* Email (Required) */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-sans uppercase font-bold tracking-[0.16em] text-[#7B6D63] flex items-center gap-1.5">
                      <Mail size={12} className="text-[#C8A46A]" /> Email Address <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. client@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-[#D8CBBE] rounded-xl text-xs sm:text-sm text-[#2e0e43] outline-none focus:border-[#2e0e43] focus:ring-1 focus:ring-[#2e0e43] transition-all font-sans"
                    />
                  </div>

                  {/* Phone Number (Optional) */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-sans uppercase font-bold tracking-[0.16em] text-[#7B6D63] flex items-center gap-1.5">
                      <Phone size={12} className="text-[#C8A46A]" /> Phone / WhatsApp (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-[#D8CBBE] rounded-xl text-xs sm:text-sm text-[#2e0e43] outline-none focus:border-[#2e0e43] focus:ring-1 focus:ring-[#2e0e43] transition-all font-sans"
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-xl bg-[#2e0e43] text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#14061F] active:scale-[0.99] transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer font-sans disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Registering Request...</span>
                      </>
                    ) : (
                      <>
                        <Bell size={16} className="text-[#C8A46A]" />
                        <span>Notify Me When Restocked</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NotifyMeModal;
