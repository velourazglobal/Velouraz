import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Breadcrumb = ({ title, subtitle, bgImage, links }) => {
  return (
    <div className="relative w-full h-[280px] sm:h-[340px] md:h-[380px] overflow-hidden flex items-center justify-center border-b border-[#C8A97A]/25 shadow-sm">
      {/* Background Image with Slow Scale Animation */}
      <motion.div
        initial={{ scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2.2, ease: [0.19, 1, 0.22, 1] }}
        className="absolute inset-0"
      >
        <img
          src={bgImage}
          alt={title}
          className="w-full h-full object-cover object-center"
        />
        {/* Layered Gradient Overlays for Luxury Contrast */}
        <div className="absolute inset-0 bg-[#14061F]/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#14061F]/80 via-transparent to-[#14061F]/85" />
      </motion.div>

      {/* Content wrapper */}
      <div className="relative z-10 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-12 pt-16 sm:pt-20 md:pt-24 text-center text-white">
        {/* Navigation Breadcrumb Links */}
        {links && links.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
            className="flex items-center justify-center gap-2 text-[14px] sm:text-xs tracking-[0.3em] font-bold uppercase mb-4"
          >
            {links.map((link, index) => (
              <React.Fragment key={index}>
                {index > 0 && <ChevronRight size={11} className="text-[#C8A97A]/60" />}
                {link.active ? (
                  <span className="text-[#E5C794] drop-shadow-sm">{link.name}</span>
                ) : (
                  <Link to={link.href} className="text-white/70 hover:text-white transition-colors duration-300">
                    {link.name}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </motion.div>
        )}

        {/* Title */}
        <div className="overflow-hidden mb-3">
          <motion.h1
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
            className="text-3xl sm:text-5xl md:text-6xl font-serif text-[#F5EFE6] font-normal leading-tight tracking-wide px-2 drop-shadow-md"
          >
            {title}
          </motion.h1>
        </div>

        {/* Subtitle */}
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
            className="text-xs sm:text-base md:text-lg font-serif italic text-white/85 max-w-2xl mx-auto font-light leading-relaxed px-4"
          >
            {subtitle}
          </motion.p>
        )}
      </div>

      {/* Bottom Subtle Champagne Gold Line Accent */}
      <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#C8A97A]/50 to-transparent" />
    </div>
  );
};

export default Breadcrumb;


