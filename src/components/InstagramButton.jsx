import React from 'react';
import { motion } from 'framer-motion';

const InstagramButton = () => {
  const instagramUrl = "https://www.instagram.com/_velouraz_?igsh=cWt5bDBjZHZuZG9h&utm_source=qr";

  return (
    <motion.a
      href={instagramUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Follow us on Instagram"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-20 lg:bottom-6 left-4 sm:left-6 z-[999] flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white shadow-[0_8px_25px_rgba(238,42,123,0.45)] hover:shadow-[0_14px_35px_rgba(238,42,123,0.65)] transition-all duration-300 group cursor-pointer"
    >
      {/* Online indicator badge */}
      <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 sm:h-4 sm:w-4">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" style={{ animationDuration: '2.5s' }}></span>
        <span className="relative inline-flex rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 bg-pink-500 border-2 border-white"></span>
      </span>

      {/* Tooltip on Hover (aligned to the right of the button) */}
      <span className="absolute left-14 sm:left-16 px-3.5 py-2 bg-[#2A2623] text-[#F8F4EF] text-xs font-medium rounded-xl shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none border border-[#D8CBBE]/30 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#ee2a7b] animate-pulse" />
        Follow on Instagram
      </span>

      {/* Official Authentic Instagram Camera Logo SVG */}
      <svg
        viewBox="0 0 24 24"
        className="w-7 h-7 fill-current drop-shadow-sm"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    </motion.a>
  );
};

export default InstagramButton;
