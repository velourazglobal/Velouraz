import { getOptimizedVideoUrl, getVideoPosterUrl, handleVideoError } from '../config/cloudinary';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Gem, Crown } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';

const IndiaEdit = () => {
  const navigate = useNavigate();

  const handleSilverClick = () => {
    navigate('/shop?country=India&tag=India Silver');
  };

  const handleLuxeClick = () => {
    navigate('/shop?country=India&tag=India Luxe');
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] font-sans text-[#2A2623]">

      {/* Hero Banner Section */}
      <Breadcrumb
        title="The India Edit"
        subtitle="Exploring royal courts, artisanal silver craft, uncut Polki diamonds & timeless Indian high jewellery."
        bgImage="https://res.cloudinary.com/dcjn4y284/image/upload/v1787672225/india_yqlodw.png"
        links={[
          { name: 'Home', href: '/' },
          { name: 'World Edit', href: '/world-edit' },
          { name: 'The India Edit', href: '/world-edit/india', active: true }
        ]}
      />

      {/* Main Container */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-12 lg:py-16">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#FAF3E8] border border-[#C8A46A]/30 text-[#B89355] text-xs font-semibold uppercase tracking-[0.25em]">
            <Sparkles className="w-3.5 h-3.5 text-[#B89355]" /> Inspired by Indian Artistry & Royal Heritage
          </div>

          <h1 className="font-serif font-light text-3xl sm:text-5xl text-[#2A2623] tracking-tight leading-tight">
            Curated Collections of <span className="italic text-[#8B6B38]">Indian Craftsmanship</span>
          </h1>

          <p className="text-sm sm:text-base text-[#6B5E52] font-serif font-light leading-relaxed">
            Select a collection below to discover fine 925 sterling silver statement creations or imperial court Jadau, uncut Polki diamonds, and royal Kundan chokers in our boutique.
          </p>
        </div>

        {/* ─── THE TWO FEATURED CARDS SECTION ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">

          {/* CARD 1: THE SILVER EDIT */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            onClick={handleSilverClick}
            className="group relative bg-[#1A1816] rounded-3xl overflow-hidden shadow-[0_14px_40px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_50px_rgba(184,147,85,0.25)] transition-all duration-700 cursor-pointer min-h-[550px] sm:min-h-[600px] flex flex-col justify-end border border-transparent hover:border-[#C8A46A]/50"
          >
            {/* Background Video */}
            <video
              src={getOptimizedVideoUrl("https://res.cloudinary.com/dcjn4y284/video/upload/v1788968773/1008051119_1788964981716435_f8jyrw.mp4")} poster={getVideoPosterUrl("https://res.cloudinary.com/dcjn4y284/video/upload/v1788968773/1008051119_1788964981716435_f8jyrw.mp4")} preload="metadata"
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/90 transition-opacity duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1816] via-[#1A1816]/40 to-transparent opacity-80" />

            {/* Badge Overlay */}
            <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/30 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-white z-10 transition-transform duration-500 group-hover:translate-y-[-2px]">
              <Gem className="w-3.5 h-3.5 text-[#C8A46A]" />
              <span className="text-xs font-bold uppercase tracking-widest font-sans">925 Sterling</span>
            </div>

            {/* Content Area */}
            <div className="relative z-10 p-8 sm:p-10 w-full transform transition-transform duration-500 group-hover:translate-y-[-8px]">
              <div className="space-y-3 mb-8">
                <span className="text-xs font-sans uppercase font-bold tracking-[0.25em] text-[#E5C794] flex items-center gap-2">
                  <span className="w-8 h-[1px] bg-[#E5C794]"></span>
                  Collection I
                </span>
                <h2 className="font-serif text-4xl sm:text-5xl font-light leading-tight text-white group-hover:text-[#F9F6F0] transition-colors duration-500 drop-shadow-lg">
                  The Silver Edit
                </h2>
              </div>

              <button
                type="button"
                onClick={handleSilverClick}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-sans text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#B89355] hover:border-[#B89355] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 group/btn shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgba(184,147,85,0.4)]"
              >
                <span>Explore Collection</span>
                <ArrowRight className="w-4 h-4 text-white group-hover/btn:translate-x-1.5 transition-transform duration-300" />
              </button>
            </div>
          </motion.div>

          {/* CARD 2: THE LUXE EDIT */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            onClick={handleLuxeClick}
            className="group relative bg-[#1A1816] rounded-3xl overflow-hidden shadow-[0_14px_40px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_50px_rgba(184,147,85,0.25)] transition-all duration-700 cursor-pointer min-h-[550px] sm:min-h-[600px] flex flex-col justify-end border border-transparent hover:border-[#C8A46A]/50"
          >
            {/* Background Video */}
            <video
              src={getOptimizedVideoUrl("https://res.cloudinary.com/dcjn4y284/video/upload/v1788968870/387140918_1788965268020976_lfcapn.mp4")} poster={getVideoPosterUrl("https://res.cloudinary.com/dcjn4y284/video/upload/v1788968870/387140918_1788965268020976_lfcapn.mp4")} preload="metadata"
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/90 transition-opacity duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1816] via-[#1A1816]/40 to-transparent opacity-80" />

            {/* Badge Overlay */}
            <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/30 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-white z-10 transition-transform duration-500 group-hover:translate-y-[-2px]">
              <Crown className="w-3.5 h-3.5 text-[#C8A46A]" />
              <span className="text-xs font-bold uppercase tracking-widest font-sans">Royal Kundan & Polki</span>
            </div>

            {/* Content Area */}
            <div className="relative z-10 p-8 sm:p-10 w-full transform transition-transform duration-500 group-hover:translate-y-[-8px]">
              <div className="space-y-3 mb-8">
                <span className="text-xs font-sans uppercase font-bold tracking-[0.25em] text-[#E5C794] flex items-center gap-2">
                  <span className="w-8 h-[1px] bg-[#E5C794]"></span>
                  Collection II
                </span>
                <h2 className="font-serif text-4xl sm:text-5xl font-light leading-tight text-white group-hover:text-[#F9F6F0] transition-colors duration-500 drop-shadow-lg">
                  The Luxe Edit
                </h2>
              </div>

              <button
                type="button"
                onClick={handleLuxeClick}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-sans text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#B89355] hover:border-[#B89355] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 group/btn shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgba(184,147,85,0.4)]"
              >
                <span>Explore Collection</span>
                <ArrowRight className="w-4 h-4 text-white group-hover/btn:translate-x-1.5 transition-transform duration-300" />
              </button>
            </div>
          </motion.div>

        </div>

      </div>
    </div>
  );
};

export default IndiaEdit;
