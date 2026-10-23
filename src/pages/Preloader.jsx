import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PremiumPreloader = ({ onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    // Smooth progress counter over ~900ms
    const startTime = Date.now();
    const duration = 900;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);

      // Easing curve for luxurious acceleration & deceleration
      const easedProgress = Math.pow(progress / 100, 0.8) * 100;
      setCounter(easedProgress);

      if (progress >= 100) {
        clearInterval(timer);
        setTimeout(() => {
          setLoading(false);
          if (onComplete) setTimeout(onComplete, 400);
        }, 150);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [onComplete]);

  const luxuryEase = [0.19, 1, 0.22, 1];

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.03,
            filter: "blur(6px)",
            transition: { duration: 0.5, ease: luxuryEase }
          }}
          className="fixed inset-0 z-[9999] bg-[#FDFAF5] flex items-center justify-center p-4 selection:bg-none overflow-hidden text-[#2A2623]"
        >
          {/* Subtle Ambient Warm Champagne Gold Glow */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.25, 0.45, 0.25]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(200,169,122,0.25)_0%,transparent_65%)] pointer-events-none rounded-full blur-3xl"
          />

          {/* Subtle Canvas Grain Texture */}
          <div
            className="absolute inset-0 opacity-[0.035] pointer-events-none mix-blend-multiply"
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")"
            }}
          />

          {/* Compact Light Glassmorphic Emblem Pod */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: luxuryEase }}
            className="relative w-full max-w-[360px] sm:max-w-[380px] bg-white/85 backdrop-blur-xl border border-[#D8CBBE]/60 rounded-3xl p-7 sm:p-9 shadow-[0_20px_50px_rgba(42,38,35,0.07),0_0_30px_rgba(200,169,122,0.12)] flex flex-col items-center justify-center text-center overflow-hidden"
          >
            {/* Shimmer Light Sweep across card */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5, ease: "easeInOut" }}
              className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/60 to-transparent -skew-x-12 pointer-events-none"
            />

            {/* Micro Corner Accents */}
            <div className="absolute top-3 left-3 w-2.5 h-2.5 border-t border-l border-[#C8A97A]/60 rounded-tl-[3px]" />
            <div className="absolute top-3 right-3 w-2.5 h-2.5 border-t border-r border-[#C8A97A]/60 rounded-tr-[3px]" />
            <div className="absolute bottom-3 left-3 w-2.5 h-2.5 border-b border-l border-[#C8A97A]/60 rounded-bl-[3px]" />
            <div className="absolute bottom-3 right-3 w-2.5 h-2.5 border-b border-r border-[#C8A97A]/60 rounded-br-[3px]" />

            {/* Logo Image (Crisp Obsidian Black) */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7, ease: luxuryEase }}
              className="mb-3"
            >
              <img
                src="/img/logo.png"
                alt="Velouraz"
                className="h-10 sm:h-12 w-auto object-contain brightness-0"
              />
            </motion.div>

            {/* Compact Brand Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9 }}
              transition={{ delay: 0.25, duration: 0.7 }}
              className="text-[14px] sm:text-[14px] font-semibold uppercase tracking-[0.35em] text-[#2A2623]/80 mb-7 pl-[0.35em]"
            >
              Haute Joaillerie · Indore
            </motion.p>

            {/* Micro Hairline Progress Container */}
            <div className="w-full max-w-[220px] flex flex-col items-center">
              <div className="w-full h-[2px] bg-[#2A2623]/10 rounded-full relative overflow-hidden shadow-inner mb-3">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#C8A97A] via-[#B58E58] to-[#2A2623] rounded-full shadow-[0_0_6px_#C8A97A]"
                  style={{ width: `${counter}%` }}
                />
              </div>

              {/* Minimalist Tabular Counter & Status */}
              <div className="w-full flex items-center justify-between text-[14px] font-serif tracking-[0.25em] text-[#2A2623]/70 uppercase">
                <span>Loading</span>
                <span className="font-mono font-semibold text-[#2A2623]">
                  {Math.round(counter).toString().padStart(3, '0')}%
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PremiumPreloader;


