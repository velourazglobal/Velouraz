import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '../Firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export const DEFAULT_MARQUEE_ITEMS = [
  '✦ Ethically Sourced',
  '✦ Artisanal Craftsmanship',
  '✦ Anti-Tarnish Formula',
  '✦ Global Heritage Designs',
  '✦ Skin Friendly Alloys',
  '✦ 4.9 ★ Patron Rated',
  '✦ Premium Gift Packaging',
  '✦ 4–5 Days Express Delivery',
];

const SERIF = "'Cormorant Garamond', Georgia, serif";

/**
 * High-visibility luxury brand marquee ticker (Bottom Hero Section Scroll Texts)
 */
const Marquee = () => {
  const [marqueeItems, setMarqueeItems] = useState(DEFAULT_MARQUEE_ITEMS);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "site_settings", "hero_marquee"), (snap) => {
      if (snap.exists() && snap.data().items && snap.data().items.length > 0) {
        setMarqueeItems(snap.data().items);
      } else {
        setMarqueeItems(DEFAULT_MARQUEE_ITEMS);
      }
    }, (err) => console.warn("Error fetching hero marquee:", err));
    return () => unsub();
  }, []);

  const itemsToRender = marqueeItems.length > 0 ? marqueeItems : DEFAULT_MARQUEE_ITEMS;
  const doubled = [...itemsToRender, ...itemsToRender, ...itemsToRender]; // triple loop for continuous scroll

  return (
    <div className="w-full relative overflow-hidden bg-gradient-to-r from-[#170624] via-[#2A0E40] to-[#170624] border-y border-[#C8A97A]/30 py-3.5 shadow-md z-10 font-sans">

      {/* Side Fade Overlays for cinematic scroll transition */}
      <div className="absolute top-0 left-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-[#170624] to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-[#170624] to-transparent z-10 pointer-events-none" />

      <div className="relative flex items-center">
        <motion.div
          className="flex shrink-0 gap-0 items-center"
          animate={{ x: ['0%', '-33.33%'] }}
          transition={{ duration: 32, ease: 'linear', repeat: Infinity }}
        >
          {doubled.map((item, index) => (
            <span
              key={index}
              className="shrink-0 px-8 sm:px-12 text-xs sm:text-sm tracking-[0.25em] uppercase font-semibold text-[#F5E6CE] whitespace-nowrap flex items-center gap-3 drop-shadow-sm"
              style={{ fontFamily: SERIF }}
            >
              {item}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Marquee;
