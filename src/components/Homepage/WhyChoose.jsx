import React from 'react';
import { motion } from 'framer-motion';
import { Gem, Award, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

// Custom icons
const ArtisanalIcon = ({ size = 22, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2v6" />
    <path d="M8 8h8a2 2 0 0 1 2 2v3H6v-3a2 2 0 0 1 2-2z" />
    <path d="M4 17h16" />
    <path d="M7 17v3a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-3" />
  </svg>
);

const features = [
  {
    icon: Gem,
    title: "PRECIOUS MATERIALS",
    subtitle: "Chosen for beauty, quality and lasting elegance.",
    description: "We carefully select materials for their finish, character and enduring appeal, ensuring every piece feels refined and special."
  },
  {
    icon: ArtisanalIcon,
    title: "ARTISAN CRAFT",
    subtitle: "Finished with skill, care and precision.",
    description: "Every detail is thoughtfully considered, from the setting and polish to the final finishing touches that give each piece its distinctive character."
  },
  {
    icon: ShieldCheck,
    title: "MADE TO LAST",
    subtitle: "Designed for enduring beauty and everyday wear.",
    description: "Our pieces are created with durability, comfort and timeless style in mind, so they can remain part of your collection for years to come."
  },
  {
    icon: Award,
    title: "THE VELOURAZ PROMISE",
    subtitle: "Curated with care, presented with distinction.",
    description: "Every Velouraz piece is thoughtfully selected, carefully checked and beautifully presented to make your experience feel special from discovery to delivery."
  },
  {
    icon: CheckCircle2,
    title: "925 STERLING SILVER CERTIFICATION",
    subtitle: "Crafted in genuine 925 sterling silver.",
    description: "Containing 92.5% pure silver blended with 7.5% strengthening metals for enhanced durability and lasting beauty."
  }
];

const QualitySection = () => {
  return (
    <section
      className="py-10 md:py-14 relative overflow-hidden bg-[#FAF7F2]"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 w-full relative z-10">

        {/* Header Section */}
        <div className="max-w-2xl mx-auto text-center mb-8 md:mb-10">
          <h2
            className="font-serif font-light leading-tight tracking-tight text-3xl sm:text-4xl md:text-5xl lg:text-[42px] text-[#222222]"
          >
            The Velouraz <span className="italic font-normal text-[#2e0e43]">Standard</span>
          </h2>
          <div className="flex items-center justify-center gap-3 mt-3">
            <span className="w-8 h-[1px] bg-[#B58E58]/40" />
            <span className="text-xs text-[#B58E58]">✦</span>
            <span className="w-8 h-[1px] bg-[#B58E58]/40" />
          </div>
        </div>

        {/* 5-Column Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 md:gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="group flex flex-col items-center text-center p-6 md:p-7 rounded-2xl border border-[#EFE8DC] bg-[#FAF7F2]/90 hover:bg-white hover:border-[#D5C6B1] transition-all duration-300 shadow-[0_4px_25px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
              >
                {/* Gold Circle Ring Icon Container */}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 mb-5 border border-[#D5C6B1] bg-white/80 text-[#B58E58] group-hover:scale-105 group-hover:border-[#B58E58]"
                >
                  <IconComponent size={22} strokeWidth={1.2} className="text-[#B58E58]" />
                </div>

                {/* Title */}
                <h3
                  className="text-xs md:text-[14px] font-bold tracking-[0.14em] uppercase mb-2 text-[#2A2623] group-hover:text-[#2e0e43] transition-colors font-sans"
                >
                  {feature.title}
                </h3>

                {/* Subtitle */}
                <p className="text-xs font-semibold text-[#2e0e43]/90 italic mb-2.5 leading-snug">
                  {feature.subtitle}
                </p>

                {/* Full Description */}
                <p className="text-xs text-[#7B6D63] leading-relaxed font-light font-sans">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default QualitySection;

