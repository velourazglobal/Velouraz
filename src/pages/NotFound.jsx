import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Compass, Search } from 'lucide-react';
import useSEO from '../hooks/useSEO';

const NotFound = () => {
  useSEO({
    title: 'Page Not Found - 404',
    description: 'This page could not be found. Return to the Velouraz homepage to explore our globally curated jewellery collection.',
    noIndex: true,
  });

  return (
    <div className="min-h-screen bg-[#FDFAF5] text-[#2A2623] flex items-center justify-center px-6 font-sans overflow-hidden selection:bg-[#2A2623] selection:text-white">
      <div className="text-center space-y-16 max-w-4xl relative">

        {/* Abstract Background Element - Floating Glass Morphism */}
        <motion.div
          animate={{
            rotate: [0, 90, 180, 270, 360],
            scale: [1, 1.1, 1],
            x: [0, 50, 0, -50, 0],
            y: [0, -30, 0, 30, 0]
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-[#2A2623]/3 rounded-full blur-[100px] -z-10"
        />

        {/* Large Background Text */}
        <div className="absolute inset-0 flex items-center justify-center -z-10 opacity-[0.02]">
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 2.5, ease: [0.19, 1, 0.22, 1] }}
            className="text-[20rem] md:text-[30rem] lg:text-[40rem] font-serif font-black tracking-tighter select-none pointer-events-none"
          >
            404
          </motion.span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
          className="space-y-12"
        >
          {/* Animated Icon Container */}
          <div className="flex justify-center mb-16">
            <motion.div
              animate={{
                y: [0, -20, 0],
                rotateY: [0, 180, 360]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-[#2A2623] border border-[#2A2623]/10 shadow-[0_20px_50px_rgba(0,0,0,0.05)]"
            >
              <Compass size={40} strokeWidth={1} className="opacity-80" />
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.h1
              initial={{ opacity: 0, letterSpacing: "-0.05em" }}
              animate={{ opacity: 1, letterSpacing: "0.02em" }}
              transition={{ duration: 2, ease: [0.19, 1, 0.22, 1] }}
              className="text-6xl md:text-9xl font-serif leading-none uppercase font-light"
            >
              Lost in <br />
              <span className="italic font-normal text-[#2e0e43]">Elegance</span>
            </motion.h1>

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "80px" }}
              transition={{ delay: 1, duration: 1.5 }}
              className="h-[1px] bg-[#2A2623]/20 mx-auto"
            />
          </div>

          <p className="text-[#2A2623]/60 text-[16px] md:text-[16px] tracking-[0.4em] uppercase max-w-lg mx-auto leading-relaxed font-medium px-4">
            The masterpiece you seek has been moved to our private vault.
            Allow us to guide you back to our current collection.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="pt-16 flex flex-col md:flex-row items-center justify-center gap-6"
        >
          <Link
            to="/"
            className="group relative inline-flex items-center gap-6 px-14 py-5 bg-[#2A2623] text-white text-[16px] tracking-[0.3em] font-bold uppercase transition-all duration-500 rounded-full overflow-hidden shadow-2xl hover:shadow-[#2A2623]/20 active:scale-95"
          >
            <span className="relative z-10 flex items-center gap-3">
              <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform duration-500" />
              Return Home
            </span>
            <div className="absolute inset-0 bg-[#2e0e43] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.19, 1, 0.22, 1]" />
          </Link>

          <Link
            to="/shop"
            className="group inline-flex items-center gap-6 px-14 py-5 border border-[#2A2623]/20 text-[#2A2623] text-[16px] tracking-[0.3em] font-bold uppercase hover:bg-[#2A2623] hover:text-white transition-all duration-500 rounded-full active:scale-95"
          >
            <Search size={16} />
            Browse Collection
          </Link>
        </motion.div>

        {/* Footer Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="pt-24"
        >
          <p className="text-[16px] tracking-[0.2em] text-[#2A2623]/30 uppercase">
            Velouraz &copy; {new Date().getFullYear()}   Timeless Artistry
          </p>
        </motion.div>
      </div>

      {/* Grainy Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply" style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")"
      }} />
    </div>
  );
};

export default NotFound;

