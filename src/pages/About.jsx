import React from 'react';
import { motion } from 'framer-motion';
import AboutBreadcrumb from '../components/AboutBreadcrumb';
import Newsletter from '../components/Newsletter';
import useSEO from '../hooks/useSEO';

const CRIMSON = '#000000';
const DARK = '#000000';
const GOLD = '#C8A97A';
const CREAM = '#FDFAF6';
const SANS = "'Montserrat', sans-serif";

const fadeUp = {
  initial: { opacity: 0, y: 35 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] }
};

const About = () => {
  useSEO({
    title: 'Our Story - The Journey Behind Velouraz',
    description: 'Velouraz was born from the friendship and shared love of travel of founders Zahabiya Kalabhai and Alifiya Bohra. Discover how their global journeys inspired a collection of jewellery that brings the world closer to you.',
    keywords: 'velouraz story, about velouraz, jewellery brand india, zahabiya kalabhai, alifiya bohra, globally curated jewellery brand, jewellery founders india',
    canonical: '/about',
    ogType: 'website',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.velouraz.in/" },
        { "@type": "ListItem", "position": 2, "name": "Our Story", "item": "https://www.velouraz.in/about" }
      ]
    }
  });

  const breadcrumbLinks = [
    { name: 'Home', href: '/' },
    { name: 'Our Story', href: '/about', active: true }
  ];

  return (
    <div className="overflow-hidden font-sans" style={{ backgroundColor: CREAM, color: DARK, fontFamily: SANS }}>

      {/* ── BREADCRUMB HERO ────────────────────────────────────── */}
      <AboutBreadcrumb
        title="Our Story"
        subtitle="About the Brand and our Story • The journey of Zahabiya & Alifiya."
        bgImage="https://res.cloudinary.com/dcjn4y284/image/upload/v1787401054/ABout_Us_Image_vrb2xe.png"
        links={breadcrumbLinks}
      />

      {/* ── MAIN STORY CONTAINER ────────────────────────────────── */}
      <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-24 space-y-16 lg:space-y-24">

        {/* ── SECTION HEADER ────────────────────────────────────── */}
        <div className="max-w-3xl space-y-3 sm:space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-[1.5px]" style={{ background: CRIMSON }} />
            <span className="text-xs sm:text-sm tracking-[0.25em] font-semibold text-black uppercase" style={{ fontFamily: SANS }}>
              About the Brand & Our Story
            </span>
          </div>

          <h1
            className="font-normal leading-[1.15] tracking-tight"
            style={{
              fontFamily: SANS,
              fontSize: 'clamp(1.85rem, 4vw, 3rem)',
              color: DARK
            }}
          >
            A Friendship Transformed <br className="hidden sm:block" />
            <span className="italic font-semibold" style={{ color: CRIMSON, fontFamily: SANS }}>into a Global Journey.</span>
          </h1>
        </div>

        {/* ── PART 1: FRIENDSHIP & JOURNEY (IMAGE ON LEFT, CONTENT ON RIGHT) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-start">

          {/* Left Column: Image 1 (Top Image) */}
          <motion.div
            className="lg:col-span-5 flex flex-col space-y-4 lg:sticky lg:top-28"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative group overflow-hidden rounded-xl sm:rounded-2xl border border-[#D8CBBE]/50 shadow-[0_15px_45px_rgba(42,38,35,0.08)] aspect-[4/5] bg-[#F6F2EB]">
              <img
                src="https://res.cloudinary.com/dcjn4y284/image/upload/v1788501333/WhatsApp_Image_2026-09-03_at_13.00.32_zrjdup.jpg"
                alt="Zahabiya & Alifiya - Founders of Velouraz"
                className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.03]"
              />
            </div>

            <div className="border-l-2 border-[#C8A97A] pl-4 sm:pl-5 space-y-1.5 hidden lg:block">
              <span className="text-xs tracking-widest font-semibold uppercase text-black" style={{ fontFamily: SANS }}>Our Essence</span>
              <p className="text-xs sm:text-sm font-normal leading-relaxed italic text-black/80" style={{ fontFamily: SANS }}>
                "Inspired by our travels, curated for your story VELOURAZ brings the world a little closer to home."
              </p>
            </div>
          </motion.div>

          {/* Right Column: Narrative Part 1 */}
          <div className="lg:col-span-7 flex flex-col space-y-5 sm:space-y-6 text-black text-sm sm:text-base leading-relaxed font-normal" style={{ fontFamily: SANS }}>
            <motion.p
              className="text-base sm:text-lg text-black leading-relaxed font-normal"
              style={{ fontFamily: SANS }}
              {...fadeUp}
            >
              As best friends, Zahabiya Kalabhai and Alifiya Bohra found inspiration wherever their journeys took them from vibrant city streets to hidden local markets and beautiful destinations across the globe. Every journey revealed something new: A craft, a gemstone, a texture, a tradition or a piece of jewellery that carried a story of its own.
            </motion.p>

            <motion.p style={{ fontFamily: SANS }} {...fadeUp} transition={{ delay: 0.05 }}>
              From the delicate artistry of Japan, where intricate Miyuki beads bring colour and precision to jewellery, to the luminous beauty of South Korea’s pearls; from the ancient symbolism of Turkish stones and the iconic Evil Eye, to the timeless allure of Chinese jade; from sapphires and rubbies from Thailand,The opals from Australia to the rich gemstone heritage of India to the refined craftsmanship found across the world each destination became part of our inspiration.
            </motion.p>

            <motion.p style={{ fontFamily: SANS }} {...fadeUp} transition={{ delay: 0.1 }}>
              What began as a love for discovering beautiful jewellery evolved into something more meaningful: a desire to bring the world’s most captivating jewellery traditions together in one collection.
            </motion.p>

            <motion.p style={{ fontFamily: SANS }} {...fadeUp} transition={{ delay: 0.15 }}>
              We call it globally curated jewellery thoughtfully discovered pieces that blend heritage with contemporary style, designed to feel effortless yet distinctive, elegant yet expressive.
            </motion.p>

            <motion.p style={{ fontFamily: SANS }} {...fadeUp} transition={{ delay: 0.2 }}>
              Because to us, jewellery is never simply an accessory. It is a memory of a place, a reflection of your individuality, and a little piece of the world you can carry with you.
            </motion.p>
          </div>
        </div>

        {/* ── MID-STORY HIGHLIGHT QUOTE CARD ───────────────────────── */}
        <motion.div
          className="relative my-8 sm:my-12 p-6 sm:p-10 rounded-2xl bg-gradient-to-r from-[#F9F6F0] via-[#F4EFE6] to-[#F9F6F0] border border-[#C8A97A]/40 shadow-sm text-center overflow-hidden"
          {...fadeUp}
        >
          <div className="max-w-3xl mx-auto space-y-3 relative z-10">
            <span className="text-[14px] sm:text-xs tracking-[0.3em] font-semibold text-[#C8A97A] uppercase" style={{ fontFamily: SANS }}>
              ✦ VELOURAZ PHILOSOPHY ✦
            </span>
            <p className="italic text-base sm:text-xl lg:text-2xl text-black font-medium leading-relaxed" style={{ fontFamily: SANS }}>
              "Inspired by our travels, curated for your story VELOURAZ brings the world a little closer to home."
            </p>
          </div>
          <div className="absolute inset-0 bg-[#C8A97A]/5 pointer-events-none" />
        </motion.div>

        {/* ── PART 2: AND SO, VELOURAZ WAS BORN (CONTENT ON LEFT, BOTTOM IMAGE ON RIGHT) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-start">

          {/* Left Column: Narrative Part 2 (CONTENT ON LEFT SIDE) */}
          <div className="lg:col-span-7 flex flex-col space-y-5 sm:space-y-6 text-black text-sm sm:text-base leading-relaxed font-normal order-2 lg:order-1" style={{ fontFamily: SANS }}>
            <motion.h2
              className="text-xl sm:text-2xl lg:text-3xl font-bold text-black uppercase tracking-wider"
              style={{ fontFamily: SANS }}
              {...fadeUp}
            >
              AND SO, VELOURAZ WAS BORN.
            </motion.h2>

            <motion.p style={{ fontFamily: SANS }} {...fadeUp} transition={{ delay: 0.05 }}>
              From countless journeys, discoveries, and conversations about the beauty we found around the world, an idea began to take shape.
            </motion.p>

            <motion.p style={{ fontFamily: SANS }} {...fadeUp} transition={{ delay: 0.15 }}>
              The name itself is inspired by velour a fabric celebrated for its softness, richness, warmth, and understated elegance. It became the perfect expression of what we wanted VELOURAZ to feel like: luxury that is felt rather than flaunted, beauty that feels effortless, and jewellery that becomes a natural extension of you.
            </motion.p>

            <motion.p
              className="text-base sm:text-lg font-semibold text-black"
              style={{ fontFamily: SANS }}
              {...fadeUp}
              transition={{ delay: 0.2 }}
            >
              But VELOURAZ is more than a name.
            </motion.p>

            <motion.p style={{ fontFamily: SANS }} {...fadeUp} transition={{ delay: 0.25 }}>
              It is our way of bringing the world closer discovering the artistry, colours, gemstones, pearls, traditions, and jewellery cultures that make every destination extraordinary, and reimagining them for the woman of today.
            </motion.p>

            <motion.p style={{ fontFamily: SANS }} {...fadeUp} transition={{ delay: 0.3 }}>
              We believe the most beautiful pieces are not simply worn they are discovered, collected, remembered, and made your own.
            </motion.p>

            <motion.p style={{ fontFamily: SANS }} {...fadeUp} transition={{ delay: 0.35 }}>
              Today, VELOURAZ is a world of globally curated jewellery, created for women who carry their own stories, follow their own style, and find beauty beyond the ordinary.
            </motion.p>

            {/* Callout Box */}
            <motion.div
              className="p-5 sm:p-7 rounded-xl border-l-4 bg-[#FBF9F4] border-[#000000] shadow-sm space-y-3"
              style={{ fontFamily: SANS }}
              {...fadeUp}
              transition={{ delay: 0.4 }}
            >
              <p className="text-base sm:text-lg font-semibold text-black" style={{ fontFamily: SANS }}>
                For Zahabiya and Alifiya , VELOURAZ is more than a brand.
              </p>
              <ul className="space-y-2 text-sm sm:text-base text-black font-normal list-disc list-inside" style={{ fontFamily: SANS }}>
                <li style={{ fontFamily: SANS }}>It is a friendship transformed into a journey.</li>
                <li style={{ fontFamily: SANS }}>A curiosity transformed into a collection.</li>
                <li style={{ fontFamily: SANS }}>And a dream transformed into something you can wear.</li>
              </ul>
            </motion.div>

            <motion.div className="space-y-1 pt-2" {...fadeUp} transition={{ delay: 0.45 }}>
              <p className="italic text-base sm:text-lg text-black font-medium" style={{ fontFamily: SANS }}>
                Because every journey leaves a trace.
              </p>
              <p className="italic text-base sm:text-lg text-black font-medium" style={{ fontFamily: SANS }}>
                Ours just happens to be jewellery.
              </p>
            </motion.div>

            <motion.p
              className="text-base sm:text-lg font-semibold text-black pt-3"
              style={{ fontFamily: SANS }}
              {...fadeUp}
              transition={{ delay: 0.5 }}
            >
              Welcome to VELOURAZ where the world becomes jewellery, and jewellery becomes part of your story.
            </motion.p>
          </div>

          {/* Right Column: Image 2 (Bottom Image ON RIGHT SIDE) */}
          <motion.div
            className="lg:col-span-5 flex flex-col space-y-4 lg:sticky lg:top-28 order-1 lg:order-2"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative group overflow-hidden rounded-xl sm:rounded-2xl border border-[#D8CBBE]/50 shadow-[0_15px_45px_rgba(42,38,35,0.08)] aspect-[4/5] bg-[#F6F2EB]">
              <img
                src="https://res.cloudinary.com/dcjn4y284/image/upload/v1788501324/WhatsApp_Image_2026-09-03_at_13.00.32.jpegh_xsa9mr.jpg"
                alt="Velouraz Heritage & Craftsmanship"
                className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.03]"
              />
            </div>
          </motion.div>

        </div>

        {/* ── FOUNDERS CLOSING SECTION ──────────────────────────── */}
        <div className="pt-8 sm:pt-12 border-t border-[#D8CBBE]/40">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">

            {/* Founders Closing Column */}
            <motion.div className="lg:col-span-8 space-y-3" {...fadeUp}>
              <span className="text-xs sm:text-sm tracking-[0.2em] uppercase font-semibold text-black" style={{ fontFamily: SANS }}>
                With Love,
              </span>
              <p
                className="italic font-normal leading-none"
                style={{
                  fontFamily: SANS,
                  fontSize: 'clamp(2rem, 4vw, 3.25rem)',
                  color: CRIMSON
                }}
              >
                Zahabiya & Alifiya
              </p>
              <div className="flex items-center gap-3 pt-1">
                <span className="w-8 h-[1.5px]" style={{ background: GOLD }} />
                <span className="text-xs sm:text-sm tracking-[0.2em] uppercase font-semibold text-black" style={{ fontFamily: SANS }}>
                  Founders, VELOURAZ
                </span>
              </div>
            </motion.div>

            {/* Monogram brand stamp */}
            <motion.div
              className="lg:col-span-4 flex justify-start lg:justify-end"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div
                className="text-2xl lg:text-3xl font-light tracking-[0.15em] border border-black/15 px-6 py-3 rounded-full"
                style={{ fontFamily: SANS, color: '#000000', opacity: 0.4 }}
              >
                VELOURAZ
              </div>
            </motion.div>

          </div>
        </div>

      </div>

      {/* ── PARALLAX TEXT RIBBON ───────────────────────────────── */}
      <div
        className="w-full py-3.5 border-t border-b border-[#D8CBBE]/30 overflow-hidden"
        style={{ background: '#2A2623' }}
      >
        <motion.div
          className="flex whitespace-nowrap"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 25, ease: 'linear', repeat: Infinity }}
        >
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className="text-xs sm:text-sm tracking-[0.2em] uppercase font-light px-12 text-[#C8A97A]"
              style={{ fontFamily: SANS }}
            >
              ✦ Inspired by Travels, Curated for Your Story ✦
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── NEWSLETTER SECTION ───────────────────────────────── */}
      <Newsletter />

    </div>
  );
};

export default About;