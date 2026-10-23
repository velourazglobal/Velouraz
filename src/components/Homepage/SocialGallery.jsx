import React from 'react';
import { motion } from 'framer-motion';
import { Instagram, ArrowRight } from 'lucide-react';
import { getOptimizedImageUrl, handleImageError } from '../../config/cloudinary';

const galleryItems = [
  { id: 1, image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=600&auto=format&fit=crop', handle: '@velouraz_official' },
  { id: 2, image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop', handle: '@isabelle.m' },
  { id: 3, image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=600&auto=format&fit=crop', handle: '@sophia_rossi' },
  { id: 4, image: 'https://plus.unsplash.com/premium_photo-1681276170281-cf50a487a1b7?w=600&auto=format&fit=crop', handle: '@elenor_v' },
  { id: 5, image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=600&auto=format&fit=crop', handle: '@maria.d' },
  { id: 6, image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=600&auto=format&fit=crop', handle: '@clara.j' },
];

const SocialGallery = () => {
  return (
    <section className="bg-[#FDFAF5] py-12 lg:py-24 px-4 sm:px-8 lg:px-16 font-sans relative overflow-hidden border-t border-[#640D14]/10">
      {/* Decorative vertical lines */}
      <div className="absolute left-[5%] top-0 w-[1px] h-full bg-[#640D14]/5 hidden lg:block" />
      <div className="absolute right-[5%] top-0 w-[1px] h-full bg-[#640D14]/5 hidden lg:block" />

      <div className="max-w-[1800px] mx-auto relative z-10">

        {/* Section Header */}
        <div className="flex flex-col lg:flex-row justify-between lg:items-end mb-16 md:mb-24 border-b border-[#640D14]/10 pb-12 md:pb-16">
          <div className="space-y-6">
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-[#640D14]/60 text-[16px] md:text-[16px] tracking-[0.6em] uppercase block font-bold"
            >
              Velouraz Moments
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="font-serif text-3xl md:text-5xl lg:text-6xl text-[#2C1A0E] tracking-tight leading-tight"
            >
              <span style={{ fontFamily: "var(--font-script)", fontWeight: 100 }} className="text-5xl md:text-6xl lg:text-7xl block md:inline mb-2 md:mb-0 text-[#640D14]/60">The</span> Gallery
            </motion.h2>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 lg:mt-0 max-w-sm"
          >
            <p className="text-[16px] md:text-[16px] tracking-[0.2em] uppercase text-[#5C3D1E]/60 leading-relaxed font-bold">
              Witness the timeless elegance and sophisticated style of the Velouraz community.
            </p>
          </motion.div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {galleryItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="group relative overflow-hidden aspect-square bg-[#F5EDD8] border border-[#640D14]/10 rounded-xl hover:border-[#640D14]/30 hover:shadow-[0_14px_40px_rgba(44,26,14,0.08)] transition-all duration-700"
            >
              <img
                src={getOptimizedImageUrl(item.image)}
                alt={`Styled by ${item.handle}`}
                loading="lazy"
                decoding="async"
                onError={(e) => handleImageError(e, item.image)}
                className="w-full h-full object-cover opacity-85 transition-transform duration-1000 ease-out group-hover:scale-105 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-[#2C1A0E]/0 group-hover:bg-[#2C1A0E]/30 transition-colors duration-500 flex flex-col justify-end p-5">
                <div className="flex items-center gap-2 text-white text-[16px] tracking-[0.2em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-2 group-hover:translate-y-0">
                  <Instagram size={14} strokeWidth={1.5} className="text-[#640D14]" />
                  {item.handle}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Join Us Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="hidden lg:flex flex-col justify-center items-center text-center p-10 border border-[#640D14]/15 bg-[#F5EDD8] aspect-square rounded-xl hover:border-[#640D14]/30 hover:shadow-[0_14px_40px_rgba(100,13,20,0.1)] transition-all duration-500 group cursor-pointer"
          >
            <Instagram size={32} strokeWidth={1} className="text-[#640D14] mb-6 group-hover:scale-110 transition-transform duration-300" />
            <h3 className="font-serif text-2xl text-[#2C1A0E] mb-4">Share Your Sparkle</h3>
            <p className="text-[16px] tracking-[0.2em] uppercase text-[#5C3D1E]/60 mb-8 leading-relaxed">
              Join our community using #VelourazStyle
            </p>
            <button className="text-[16px] tracking-[0.4em] uppercase text-[#640D14] border-b border-[#640D14]/30 pb-1.5 hover:text-[#2C1A0E] hover:border-[#2C1A0E] transition-colors">
              Follow Us
            </button>
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <button className="group relative pr-12 text-[#2C1A0E] hover:text-[#640D14] transition-colors duration-500">
            <span className="font-sans text-[16px] tracking-[0.4em] uppercase border-b border-[#640D14]/20 pb-2 group-hover:border-[#640D14]">
              Explore Our Instagram
            </span>
            <ArrowRight size={18} className="absolute right-0 bottom-3 group-hover:translate-x-2 transition-transform duration-500 text-[#640D14]" />
          </button>
        </div>
      </div>
    </section>
  );
};


export default SocialGallery;