import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, Compass, Gem, ShieldCheck, Heart, ArrowRight } from 'lucide-react';
import OptimizedImage from '../common/OptimizedImage';

const PILLARS = [
  {
    icon: <Compass className="w-5 h-5 text-[#B89355]" />,
    title: "Global Cultural Curation",
    description: "Bridging artisan traditions from Paris, Kyoto, Seoul, and Istanbul with royal Indian craftsmanship."
  },
  {
    icon: <Gem className="w-5 h-5 text-[#B89355]" />,
    title: "The Velouraz Standard",
    description: "Fine 925 sterling silver, 18K/22K micron gold plating, and resilient anti-tarnish protective coatings."
  },
  {
    icon: <Heart className="w-5 h-5 text-[#B89355]" />,
    title: "Quiet, Felt Luxury",
    description: "Jewellery created for the discerning woman — opulent yet lightweight, made to be lived in every day."
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-[#B89355]" />,
    title: "Artisan Provenance",
    description: "Each heirloom creation arrives in signature velvet presentation boxes with verified authenticity."
  }
];

const AboutSection = () => {
  return (
    <section className="relative w-full py-20 lg:py-28 bg-[#FAF6F0] overflow-hidden border-t border-[#E8DFC8]">
      {/* Ambient Warm Golden Glow */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[#C8A46A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-96 h-96 bg-[#EFE6DC]/60 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-14 relative z-10">

        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.25em] text-[#B89355] uppercase font-sans">
            <Sparkles size={14} /> The House of Velouraz
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#2A2623] font-normal tracking-wide">
            Where The World Becomes <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-[#B89355] via-[#8C6B37] to-[#B89355]">Jewellery</span>
          </h2>
          <div className="w-16 h-[2px] bg-[#B89355]/40 mx-auto mt-4" />
        </div>

        {/* Two-Column Story Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center mb-16">

          {/* Left Column: Visual Vignette */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 relative"
          >
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(42,38,35,0.12)] border border-[#E8DFC8]">
              <OptimizedImage
                src="https://res.cloudinary.com/dy1g9f3bj/image/upload/v1789806625/oruyvr71wucdn8yde1xn.jpg"
                alt="Velouraz Founders and Heritage Jewellery"
                preset="banner"
                aspectRatio="4/5"
                widths={[400, 600, 800]}
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              {/* Floating Quote Card */}
              <div className="absolute bottom-6 left-6 right-6 p-5 rounded-2xl bg-white/90 backdrop-blur-md border border-[#E8DFC8] shadow-lg">
                <p className="font-serif italic text-sm sm:text-base text-[#2A2623] leading-relaxed">
                  "Jewellery should not merely ornament — it should carry the soul of distant places and the warmth of real friendship."
                </p>
                <p className="text-[11px] font-sans uppercase tracking-[0.2em] text-[#B89355] font-bold mt-2">
                  — Zahabiya & Alifiya, Founders
                </p>
              </div>
            </div>

            {/* Decorative Gold Badge */}
            <div className="hidden sm:flex absolute -top-5 -right-5 w-24 h-24 rounded-full bg-[#14111E] text-white border-2 border-[#C8A46A] shadow-xl flex-col items-center justify-center text-center p-2">
              <span className="text-[10px] tracking-widest uppercase font-bold text-[#C8A46A]">ESTD.</span>
              <span className="font-serif text-lg font-bold">2026</span>
              <span className="text-[9px] tracking-wider uppercase text-white/70">INDIA</span>
            </div>
          </motion.div>

          {/* Right Column: Narrative & Values */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="space-y-4">
              <p className="font-serif text-xl sm:text-2xl text-[#2A2623] leading-relaxed font-light">
                Velouraz began with two lifelong friends traversing historic bazaars, European ateliers, and ancient temple jewellery workshops.
              </p>
              <p className="text-sm sm:text-base text-[#6B5E52] leading-relaxed font-sans font-normal">
                Frustrated by mass-produced accessories and fleeting fast-fashion, founders Zahabiya Kalabhai and Alifiya Bohra envisioned a boutique house where every silhouette reflects cultural provenance, heirloom durability, and accessible everyday luxury.
              </p>
            </div>

            {/* Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {PILLARS.map((p, idx) => (
                <div
                  key={idx}
                  className="p-4 sm:p-5 rounded-2xl bg-white/70 border border-[#E8DFC8] hover:border-[#B89355] transition-all duration-300 space-y-2 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-[#FAF6F0] group-hover:bg-[#B89355]/10 transition-colors">
                      {p.icon}
                    </span>
                    <h4 className="font-serif text-base text-[#2A2623] font-semibold">
                      {p.title}
                    </h4>
                  </div>
                  <p className="text-xs text-[#7B6D63] leading-relaxed">
                    {p.description}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                to="/about"
                className="px-7 py-3.5 rounded-full bg-[#14111E] text-white hover:bg-[#B89355] text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-md inline-flex items-center gap-2 cursor-pointer group"
              >
                Read Our Story
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/shop"
                className="px-7 py-3.5 rounded-full bg-white text-[#2A2623] hover:text-[#B89355] border border-[#E8DFC8] hover:border-[#B89355] text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-xs inline-flex items-center gap-2 cursor-pointer"
              >
                Explore Collections
              </Link>
            </div>

          </motion.div>

        </div>

      </div>
    </section>
  );
};

export default AboutSection;
