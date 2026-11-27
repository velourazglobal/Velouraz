import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ArrowRight, CheckCircle2, MessageSquare, Sparkles } from 'lucide-react';
import { db } from './Firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getOptimizedImageUrl, handleImageError } from '../config/cloudinary';

const SANS = "'Montserrat', sans-serif";
const BG_IMAGE = "https://res.cloudinary.com/dcjn4y284/image/upload/v1788008294/velouraz_end_tjyeye.png";
const DESTINATION_WHATSAPP = "918349440045";

const Newsletter = () => {
  const [phone, setPhone] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // Record subscriber in Firestore
      await addDoc(collection(db, "newsletter_whatsapp"), {
        phone: cleanPhone,
        countryCode: "+91",
        createdAt: serverTimestamp(),
        source: 'homepage_newsletter',
        subscribed: true
      });
    } catch (err) {
      console.warn("Subscriber save notice:", err);
    } finally {
      setLoading(false);
      setIsSubscribed(true);
      // Seamlessly open WhatsApp concierge chat
      const waUrl = `https://wa.me/${DESTINATION_WHATSAPP}?text=${encodeURIComponent(
        `Hello Velouraz Atelier, I would like to join the Velouraz Privé Inner Circle on WhatsApp! My contact: +91 ${cleanPhone}`
      )}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      setPhone('');
    }
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
          <div className="relative p-7 sm:p-9 rounded-2xl bg-black/50 backdrop-blur-xl border border-[#E5C794]/50 shadow-[0_25px_60px_rgba(0,0,0,0.6),0_0_35px_rgba(200,169,122,0.18)] space-y-6 overflow-hidden group transition-all duration-500">

            {/* Glowing Top Gold Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#E5C794] to-transparent shadow-[0_0_14px_#E5C794]" />

            {/* Card Header */}
            <div className="space-y-3 text-left">
              <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-[#F3E5AB] uppercase">
                <Sparkles size={13} /> WhatsApp Privé Club
              </div>
              <h3 className="text-2xl sm:text-3xl font-light tracking-wide text-white drop-shadow-md">
                Join the <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#F3E5AB] via-[#FFF8E7] to-[#E5C794]">Inner Circle</span>
              </h3>
              <p className="text-sm text-[#F0E6D8] font-normal leading-relaxed drop-shadow-sm">
                Receive private invitations, collection drops, and bespoke styling on WhatsApp.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {isSubscribed ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-6 rounded-xl bg-black/60 border border-[#E5C794]/70 text-center space-y-4 backdrop-blur-md shadow-xl"
                >
                  <div className="w-14 h-14 rounded-full bg-[#25D366]/20 border border-[#25D366] flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 size={30} className="text-[#25D366]" />
                  </div>
                  <h4 className="text-lg font-semibold text-white tracking-wide font-serif">
                    Welcome to Velouraz Privé
                  </h4>
                  <p className="text-sm text-[#F0E6D8] font-normal leading-relaxed">
                    You are now on our VIP WhatsApp roster (+91 83494 40045). We'll keep you updated on new creations.
                  </p>
                  <a
                    href={`https://wa.me/${DESTINATION_WHATSAPP}?text=Hello%20Velouraz%20Atelier%2C%20I%20have%20joined%20the%20Priv%C3%A9%20Inner%20Circle%21`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md"
                  >
                    <MessageSquare size={16} /> Open WhatsApp Chat
                  </a>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#F3E5AB] font-mono tracking-wider border-r border-[#E5C794]/40 pr-2">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        maxLength={12}
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (errorMsg) setErrorMsg('');
                        }}
                        placeholder="Enter WhatsApp mobile number"
                        className="w-full px-4 py-3.5 pl-16 rounded-xl bg-black/50 border border-[#E5C794]/60 text-white placeholder:text-[#D4C5B0] text-sm focus:outline-none focus:border-[#F3E5AB] focus:ring-2 focus:ring-[#E5C794]/50 transition-all shadow-inner font-normal backdrop-blur-md font-mono"
                      />
                    </div>
                    {errorMsg && (
                      <p className="text-xs text-rose-300 font-medium pl-1">{errorMsg}</p>
                    )}
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
                        <MessageSquare size={18} className="text-black" />
                        JOIN ON WHATSAPP
                        <ArrowRight size={16} className="text-black stroke-[2.5]" />
                      </>
                    )}
                  </button>

                  <p className="text-xs text-[#D4C5B0] text-center font-normal tracking-wide drop-shadow-sm">
                    Direct VIP concierge via WhatsApp (+91 83494 40045). No spam, ever.
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
