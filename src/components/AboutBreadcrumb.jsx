import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const SANS = "'Montserrat', sans-serif";

const AboutBreadcrumb = ({
  title = "Our story",
  subtitle = "About the Brand and our Story • The journey of Zahabiya & Alifiya.",
  bgImage = "https://res.cloudinary.com/dcjn4y284/image/upload/v1787401054/ABout_Us_Image_vrb2xe.png",
  links = [
    { name: 'Home', href: '/' },
    { name: 'Our Story', href: '/about', active: true }
  ]
}) => {
  return (
    <div className="relative w-full h-[380px] sm:h-[440px] lg:h-[500px] overflow-hidden flex items-center justify-start border-b border-[#C8A97A]/30 shadow-md bg-[#1A1613]">
      {/* Background Image without heavy center dark overlays */}
      <motion.div
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2, ease: [0.19, 1, 0.22, 1] }}
        className="absolute inset-0 w-full h-full"
      >
        <img
          src={bgImage}
          alt={title}
          className="w-full h-full object-cover object-center brightness-[0.97] contrast-[1.02]"
        />
        {/* Soft gradient from left for text legibility, keeping right side crystal clear */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30 pointer-events-none" />
      </motion.div>

      {/* Content wrapper aligned to LEFT side */}
      <div className="relative z-10 max-w-[1360px] w-full mx-auto px-6 sm:px-10 lg:px-16 pt-[60px] sm:pt-[80px] lg:pt-[90px]" style={{ fontFamily: SANS }}>
        <div className="max-w-xl text-left text-white space-y-4">

          {/* Glass Card on Left Side */}
          <div className="p-5 sm:p-7 lg:p-8 rounded-2xl bg-[#14081c]/60 backdrop-blur-md border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.35)] space-y-3">

            {/* Breadcrumb Navigation Links */}
            {links && links.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.6 }}
                className="flex items-center gap-2 text-xs sm:text-xs tracking-[0.2em] font-semibold uppercase text-white/90"
                style={{ fontFamily: SANS }}
              >
                {links.map((link, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <ChevronRight size={13} className="text-[#C8A97A] opacity-90" />}
                    {link.active ? (
                      <span className="text-[#F0D5A8] font-bold drop-shadow">{link.name}</span>
                    ) : (
                      <Link to={link.href} className="text-white/85 hover:text-white transition-colors duration-300">
                        {link.name}
                      </Link>
                    )}
                  </React.Fragment>
                ))}
              </motion.div>
            )}

            {/* Title */}
            <div className="overflow-hidden">
              <motion.h1
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ delay: 0.25, duration: 0.8 }}
                className="text-2xl sm:text-3xl lg:text-4xl font-light text-[#FFFDF9] leading-tight tracking-wide drop-shadow-md"
                style={{ fontFamily: SANS }}
              >
                {title}
              </motion.h1>
            </div>

            {/* Subtitle */}
            {subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-xs sm:text-sm lg:text-base italic text-white/95 font-light leading-relaxed drop-shadow"
                style={{ fontFamily: SANS }}
              >
                {subtitle}
              </motion.p>
            )}

          </div>

        </div>
      </div>

      {/* Bottom Subtle Champagne Gold Line Accent */}
      <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-[#C8A97A]/80 via-[#C8A97A]/40 to-transparent" />
    </div>
  );
};

export default AboutBreadcrumb;
