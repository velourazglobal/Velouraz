import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Globe, Gem, Package, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import { db } from '../../components/Firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { getOptimizedVideoUrl, getOptimizedImageUrl, handleImageError } from '../../config/cloudinary';

const GOLD = '#C8A97A';
const SERIF = "'Cormorant Garamond', Georgia, serif";

const usps = [
  { icon: <Globe size={16} strokeWidth={1.2} />, title: 'Inspired by Cultures', desc: 'Curated from across the world' },
  { icon: <Gem size={16} strokeWidth={1.2} />, title: 'Premium Quality', desc: 'Crafted to last, made to shine' },
  { icon: <Package size={16} strokeWidth={1.2} />, title: 'Premium Packaging', desc: 'Signature Velouraz box' },
  { icon: <Truck size={16} strokeWidth={1.2} />, title: '4–5 Days Delivery', desc: 'Fast insured transit' },
  { icon: <ShieldCheck size={16} strokeWidth={1.2} />, title: 'Secure Payments', desc: 'Shop with confidence' },
];

const Hero = () => {
  const videoRef = useRef(null);
  const sectionRef = useRef(null);
  const [heroConfig, setHeroConfig] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "site_settings", "hero"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setHeroConfig(data);
      } else {
        setHeroConfig({ videoURL: "" });
      }
    });
    return () => unsub();
  }, []);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  useEffect(() => {
    if (heroConfig?.videoURL) {
      videoRef.current?.play().catch(() => { });
    }
  }, [heroConfig?.videoURL]);


  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden"
      style={{ height: '100svh', minHeight: 640 }}
    >

      {/* ── VIDEO BG ─────────────────────────── */}
      <motion.div className="absolute inset-0 z-0 origin-center bg-[#080503]" style={{ scale: videoScale }}>
        {heroConfig?.videoURL ? (
          <video
            key={heroConfig.videoURL}
            ref={videoRef}
            src={getOptimizedVideoUrl(heroConfig.videoURL)}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onError={(e) => {
              console.warn("Hero video playback failed:", e);
            }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : null}
      </motion.div>

      {/* ── OVERLAYS ─────────────────────────────────── */}
      {/* Base darkening */}
      <div className="absolute inset-0 z-10" style={{ background: 'rgba(8,5,3,0.22)' }} />
      {/* Left-side content reveal gradient */}
      <div
        className="absolute inset-0 z-10"
        style={{ background: 'linear-gradient(105deg, rgba(8,5,3,0.52) 0%, rgba(8,5,3,0.22) 45%, transparent 70%)' }}
      />
      {/* Bottom fade for USP bar */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 h-[45%]"
        style={{ background: 'linear-gradient(to top, rgba(8,5,3,0.78) 0%, transparent 100%)' }}
      />
      {/* Top fade for header */}
      <div
        className="absolute inset-x-0 top-0 z-10 h-28"
        style={{ background: 'linear-gradient(to bottom, rgba(8,5,3,0.30) 0%, transparent 100%)' }}
      />

      {/* ── USP BAR ──────────────────────────────────── */}
      <div className="absolute bottom-0 inset-x-0 z-30">
        <motion.div
          className="max-w-[1440px] mx-auto px-4 lg:px-10 pb-4 lg:pb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Desktop grid */}
          {/* <div
            className="hidden lg:grid lg:grid-cols-5 divide-x"
            style={{
              background: 'rgba(8,5,3,0.58)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderTop: '1px solid rgba(200,169,122,0.15)',
              borderLeft: '1px solid rgba(200,169,122,0.15)',
              borderRight: '1px solid rgba(200,169,122,0.15)',
              borderBottom: '1px solid rgba(200,169,122,0.08)',
              divideColor: 'rgba(255,255,255,0.06)',
            }}
          >
            {usps.map((u, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-5 py-4"
                style={{ borderRight: i < 4 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}
              >
                <span style={{ color: GOLD, flexShrink: 0 }}>{u.icon}</span>
                <div>
                  <p className="text-[14px] tracking-[0.18em] font-bold uppercase mb-0.5" style={{ color: GOLD }}>
                    {u.title}
                  </p>
                  <p className="text-[16px] text-white/50 font-light" style={{ fontFamily: SERIF }}>
                    {u.desc}
                  </p>
                </div>
              </div>
            ))}
          </div> */}

          {/* Mobile slider */}
          {/* <div
            className="lg:hidden overflow-hidden"
            style={{
              background: 'rgba(8,5,3,0.62)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(200,169,122,0.12)',
            }}
          >
            <Swiper
              spaceBetween={0}
              slidesPerView={1}
              autoplay={{ delay: 2800, disableOnInteraction: false }}
              modules={[Autoplay]}
              className="w-full"
            >
              {usps.map((u, i) => (
                <SwiperSlide key={i}>
                  <div className="flex items-center gap-3 px-5 py-3.5">
                    <span style={{ color: GOLD, flexShrink: 0 }}>{u.icon}</span>
                    <div>
                      <p className="text-[8.5px] tracking-[0.2em] font-bold uppercase mb-0.5" style={{ color: GOLD }}>
                        {u.title}
                      </p>
                      <p className="text-[16px] text-white/50 font-light" style={{ fontFamily: SERIF }}>
                        {u.desc}
                      </p>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div> */}
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;

