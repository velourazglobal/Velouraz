import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle2, Sparkles, Heart } from 'lucide-react';
import { getOptimizedImageUrl, handleImageError } from '../config/cloudinary';

const SANS = "'Montserrat', sans-serif";
const BG_IMAGE = "https://res.cloudinary.com/dcjn4y284/image/upload/v1788008294/velouraz_end_tjyeye.png";

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsSubscribed(true);
      setEmail('');
    }, 800);
  };

  return (
    <section className="relative w-full min-h-[420px] sm:min-h-[480px] md:min-h-[540px] lg:min-h-[600px] py-12 sm:py-16 lg:py-20 flex items-center justify-center overflow-hidden text-white">
      {/* Background Image - 100% width & height cover */}
      <div className="absolute inset-0 z-0">
        <img
          src={getOptimizedImageUrl(BG_IMAGE)}
          alt="Velouraz Newsletter"
          loading="lazy"
          decoding="async"
          onError={(e) => handleImageError(e, BG_IMAGE)}
          className="w-full h-full object-cover object-center"
        />
      </div>

      <div className="relative z-10 max-w-[1280px] w-full mx-auto px-6 sm:px-10 lg:px-16 flex justify-center sm:justify-start" style={{ fontFamily: SANS }}>
        {/* Transparent Glassmorphic Newsletter Card */}
        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md relative"
        >
          {/* Ambient Outer Gold Glow */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#E5C794]/30 via-[#F3E5AB]/20 to-[#C8A97A]/30 blur-2xl opacity-70 pointer-events-none" />

          {/* Transparent Card Glass Frame */}
          <div className="relative p-7 sm:p-9 rounded-2xl bg-black/40 backdrop-blur-xl border border-[#E5C794]/50 shadow-[0_25px_60px_rgba(0,0,0,0.6),0_0_35px_rgba(200,169,122,0.18)] space-y-6 overflow-hidden group transition-all duration-500">

            {/* Glowing Top Gold Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#E5C794] to-transparent shadow-[0_0_14px_#E5C794]" />

            {/* Card Header */}
            <div className="space-y-3 text-left">

              <h3 className="text-2xl sm:text-3xl font-light tracking-wide text-white drop-shadow-md">
                Join the <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#F3E5AB] via-[#FFF8E7] to-[#E5C794]">Inner Circle</span>
              </h3>
              <p className="text-sm text-[#F0E6D8] font-normal leading-relaxed drop-shadow-sm">
                Receive private invitations, preview new collections, and unlock VIP privileges.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {isSubscribed ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-6 rounded-xl bg-black/50 border border-[#E5C794]/70 text-center space-y-3 backdrop-blur-md shadow-xl"
                >
                  <div className="w-14 h-14 rounded-full bg-[#E5C794]/30 border border-[#E5C794] flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 size={30} className="text-[#F3E5AB]" />
                  </div>
                  <h4 className="text-lg font-semibold text-white tracking-wide">
                    Welcome to Velouraz Privé
                  </h4>
                  <p className="text-sm text-[#F0E6D8] font-normal leading-relaxed">
                    You are officially on the guest list. Check your inbox soon for your exclusive welcome invitation.
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full px-4 py-3.5 pl-11 rounded-xl bg-black/50 border border-[#E5C794]/60 text-white placeholder:text-[#D4C5B0] text-sm focus:outline-none focus:border-[#F3E5AB] focus:ring-2 focus:ring-[#E5C794]/50 transition-all shadow-inner font-normal backdrop-blur-md"
                    />
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F3E5AB]" />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D4A96A] via-[#F8E7C4] to-[#C8A97A] text-black font-extrabold text-sm sm:text-base tracking-[0.22em] uppercase hover:brightness-110 active:scale-[0.99] transition-all duration-300 shadow-[0_4px_25px_rgba(229,199,148,0.45)] hover:shadow-[0_6px_30px_rgba(243,229,171,0.65)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        SUBSCRIBE TO PRIVÉ
                        <ArrowRight size={16} className="text-black stroke-[2.5]" />
                      </>
                    )}
                  </button>

                  <p className="text-sm text-[#D4C5B0] text-center font-normal tracking-wide drop-shadow-sm">
                    By subscribing, you agree to our Terms & Privacy Policy.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>

          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Newsletter;
