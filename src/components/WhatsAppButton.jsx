import React from 'react';
import { motion } from 'framer-motion';

const WhatsAppButton = () => {
  const phoneNumber = '918349440045';
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=Hello%20Velouraz!%20I%20would%20like%20to%20know%20more%20about%20your%20jewellery%20collection.`;

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-[999] flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] text-white shadow-[0_8px_25px_rgba(37,211,102,0.45)] hover:shadow-[0_14px_35px_rgba(37,211,102,0.65)] transition-all duration-300 group cursor-pointer"
    >
      {/* Online indicator badge */}
      <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 sm:h-4 sm:w-4">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" style={{ animationDuration: '2.5s' }}></span>
        <span className="relative inline-flex rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 bg-emerald-500 border-2 border-white"></span>
      </span>

      {/* Tooltip on Hover */}
      <span className="absolute right-14 sm:right-16 px-3.5 py-2 bg-[#2A2623] text-[#F8F4EF] text-xs font-medium rounded-xl shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none border border-[#D8CBBE]/30 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
        Chat on WhatsApp
      </span>

      {/* Official Authentic WhatsApp Logo SVG */}
      <svg
        viewBox="0 0 48 48"
        className="w-9 h-9 drop-shadow-sm"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path fill="#fff" d="M24,4C12.954,4,4,12.954,4,24c0,3.876,1.107,7.498,3.018,10.573L4,44l9.742-3.149C16.74,42.827,20.259,44,24,44 c11.046,0,20-8.954,20-20S35.046,4,24,4z" />
        <path fill="#25D366" d="M24,7c-9.389,0-17,7.611-17,17c0,3.342,0.974,6.463,2.652,9.112L7.5,39.5l6.59-2.13C16.666,39.043,19.704,40,24,40 c9.389,0,17-7.611,17-17S33.389,7,24,7z" />
        <path fill="#fff" d="M34.82,28.84c-0.54-0.27-3.18-1.57-3.67-1.75c-0.49-0.18-0.85-0.27-1.21,0.27c-0.36,0.54-1.39,1.75-1.71,2.11 c-0.32,0.36-0.63,0.4-1.17,0.13c-0.54-0.27-2.28-0.84-4.34-2.68c-1.61-1.43-2.69-3.21-3.01-3.75c-0.32-0.54-0.03-0.83,0.24-1.1 c0.24-0.24,0.54-0.63,0.81-0.94c0.27-0.31,0.36-0.54,0.54-0.9c0.18-0.36,0.09-0.67-0.04-0.94c-0.13-0.27-1.21-2.92-1.66-4.01 c-0.44-1.06-0.89-0.92-1.21-0.93c-0.31-0.01-0.67-0.01-1.03-0.01c-0.36,0-0.94,0.13-1.43,0.67c-0.49,0.54-1.88,1.84-1.88,4.48 c0,2.64,1.93,5.19,2.2,5.55c0.27,0.36,3.79,5.79,9.18,8.12c1.28,0.55,2.28,0.88,3.06,1.13c1.29,0.41,2.46,0.35,3.39,0.21 c1.03-0.15,3.18-1.3,3.63-2.55c0.45-1.25,0.45-2.33,0.31-2.55C35.72,29.24,35.36,29.11,34.82,28.84z" />
      </svg>
    </motion.a>
  );
};

export default WhatsAppButton;
