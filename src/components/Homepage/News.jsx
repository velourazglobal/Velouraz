import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram, ArrowRight, ExternalLink, X } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, FreeMode } from 'swiper/modules';
import { listenToNewsReels, DEFAULT_REELS } from '../../services/newsService';
import { getOptimizedVideoUrl } from '../../config/cloudinary';

import 'swiper/css';
import 'swiper/css/free-mode';

const TheJournal = () => {
  const [reelPosts, setReelPosts] = useState(DEFAULT_REELS);

  useEffect(() => {
    const unsubscribe = listenToNewsReels((data) => {
      if (data && data.length > 0) {
        setReelPosts(data);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <section className="bg-[#FAF7F2] py-12 md:py-16 overflow-hidden relative border-t border-[#EAE3D8]">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-10 text-left">

        {/* Section Header */}
        <div className="mb-8 md:mb-12 text-center max-w-2xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[14px] font-bold uppercase tracking-[0.3em] text-[#C8A97A] block mb-1.5"
          >
            ✦ VELOURAZ ON INSTAGRAM
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif font-normal leading-tight tracking-tight text-3xl sm:text-4xl md:text-5xl text-[#2e0e43]"
          >
            Moments That <span className="italic font-normal text-[#C8A97A]">Inspire Us</span>
          </motion.h2>
          <p className="text-xs sm:text-sm text-[#7B6D63] font-serif italic mt-2">
            Watch our official reels & discover handcrafted jewellery in motion.
          </p>
        </div>

        {/* Reels Slider */}
        <div className="mb-12">
          <Swiper
            modules={[Autoplay, FreeMode]}
            spaceBetween={20}
            slidesPerView={1.3}
            freeMode={true}
            autoplay={{ delay: 3500, disableOnInteraction: false }}
            breakpoints={{
              640: { slidesPerView: 2.3 },
              1024: { slidesPerView: 4 },
              1280: { slidesPerView: 5 }
            }}
            className="!overflow-visible"
          >
            {reelPosts.map((post, index) => (
              <SwiperSlide key={post.id || index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => window.open(post.url, '_blank')}
                  className="group relative aspect-[9/16] overflow-hidden cursor-pointer rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-700 bg-[#170624]"
                >
                  {/* Video Reel Preview */}
                  <video
                    src={getOptimizedVideoUrl(post.video, { width: 480 })}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* Dark Gradient Overlay for Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#14061F]/90 via-black/20 to-[#14061F]/40 group-hover:from-[#14061F]/95 transition-all duration-500" />

                  {/* Top Bar Info */}
                  <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                      <Instagram size={13} className="text-[#E5C794]" />
                      <span className="text-[14px] font-bold text-white tracking-widest uppercase">@_velouraz_</span>
                    </div>
                    <span className="text-[14px] font-bold text-white/80 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full">
                      REEL
                    </span>
                  </div>

                  {/* Bottom Information */}
                  <div className="absolute bottom-4 inset-x-4 z-10 space-y-1">
                    <span className="text-[14px] font-bold uppercase tracking-wider text-[#E5C794] block">
                      ✦ {post.tag || "Luxury Edit"}
                    </span>
                    <p className="text-xs sm:text-sm font-serif text-white font-medium line-clamp-2 leading-snug">
                      {post.title}
                    </p>
                    <div className="flex items-center gap-1.5 pt-1 text-[14px] text-white/70 group-hover:text-white transition-colors">
                      <span>Watch Reel on Instagram</span>
                      <ExternalLink size={11} />
                    </div>
                  </div>
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Footer CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center"
        >
          <a
            href="https://www.instagram.com/_velouraz_?igsh=cWt5bDBjZHZuZG9h&utm_source=qr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-full bg-[#2e0e43] flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110">
              <Instagram size={20} />
            </div>
            <div className="flex items-center gap-3 border-b border-transparent group-hover:border-[#2e0e43] transition-all pb-1">
              <span className="text-xs sm:text-sm font-bold text-[#2A2623] tracking-[0.2em] uppercase">FOLLOW OUR REELS</span>
              <span className="text-xs sm:text-sm text-[#7B6D63] font-serif border-l border-[#D8CBBE] pl-3 italic">@_velouraz_</span>
              <ArrowRight size={16} className="text-[#2e0e43] transition-transform group-hover:translate-x-1" />
            </div>
          </a>
        </motion.div>

      </div>
    </section>
  );
};

export default TheJournal;
