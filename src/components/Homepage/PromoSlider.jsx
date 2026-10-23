import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { db } from '../../components/Firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { getOptimizedImageUrl, getOptimizedVideoUrl, handleImageError } from '../../config/cloudinary';

import 'swiper/css';
import 'swiper/css/navigation';

export const DEFAULT_HOMEPAGE_WORLD_EDIT_VIDEOS = [
  {
    id: 'paris',
    country: 'PARIS',
    collection: 'THE MAISON PARIS',
    badge: 'ORGANIC',
    video: 'https://res.cloudinary.com/dcjn4y284/video/upload/v1788795174/paris44_tisl79.mp4',
    defaultImage: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672216/paris_vsqtxa.png',
    hoverImage: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672216/paris_vsqtxa.png',
    link: '/shop?country=Paris',
    order: 1
  },
  {
    id: 'thailand',
    country: 'THAILAND',
    collection: 'THE THAI GEMSTONE EDIT',
    badge: 'ORGANIC',
    video: 'https://res.cloudinary.com/dcjn4y284/video/upload/v1788795261/80622904_1788526626895108_iruogb.mp4',
    defaultImage: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672219/thiland_yz8axz.png',
    hoverImage: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672219/thiland_yz8axz.png',
    link: '/shop?country=Thailand',
    order: 2
  },
  {
    id: 'india',
    country: 'INDIA',
    collection: 'HERITAGE COLLECTION',
    badge: 'ORGANIC',
    video: 'https://res.cloudinary.com/dcjn4y284/video/upload/v1788884537/507503123_1788884097045152_tpzo3m.mp4',
    defaultImage: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672225/india_yqlodw.png',
    hoverImage: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672225/india_yqlodw.png',
    link: '/world-edit/india',
    order: 3
  },
  {
    id: 'japan',
    country: 'JAPAN',
    collection: 'MIYUKI ATELIER',
    badge: 'ORGANIC',
    video: 'https://res.cloudinary.com/dcjn4y284/video/upload/v1788795166/51181631_1788526616621934_a6gfv6.mp4',
    defaultImage: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672222/japan_mzkd7z.png',
    hoverImage: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672222/japan_mzkd7z.png',
    link: '/shop?country=Japan',
    order: 4
  },
  {
    id: 'south-korea',
    country: 'SOUTH KOREA',
    collection: 'PEARLS & SILVER',
    badge: 'ORGANIC',
    video: 'https://res.cloudinary.com/dcjn4y284/video/upload/v1788884546/634109263_1788884070021943_pf5oas.mp4',
    defaultImage: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672225/south_korea_km1orl.png',
    hoverImage: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672225/south_korea_km1orl.png',
    link: '/shop?country=South%20Korea',
    order: 5
  }
];

const staticCollections = DEFAULT_HOMEPAGE_WORLD_EDIT_VIDEOS;


const CRIMSON = '#2e0e43';
const LIGHT_BG = '#FFFFFF';
const SERIF = "'Cormorant Garamond', Georgia, serif";

const CardItem = ({ item }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const videoRef = useRef(null);

  const videoSrc = item.video || item.videoUrl;

  useEffect(() => {
    let interval;
    if (!videoSrc && isHovered) {
      // Switch immediately to 2nd image on hover when video is absent
      setCurrentImageIndex(1);

      // Cycle every 2 seconds between 1st (0) and 2nd (1) image continuously
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev === 0 ? 1 : 0));
      }, 2000);
    } else {
      setCurrentImageIndex(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHovered, videoSrc]);

  const defaultImg = item.defaultImage || item.image;
  const hoverImg = item.hoverImage || item.defaultImage || item.image;

  return (
    <Link
      to={item.link || '#'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative block aspect-[3/4] w-full overflow-hidden bg-gray-900 rounded-none shadow-md"
    >
      {/* Organic Ribbon Badge */}

      {/* Container for Video or Images */}
      <div className="relative w-full h-full overflow-hidden">
        {videoSrc ? (
          <video
            ref={videoRef}
            src={getOptimizedVideoUrl(videoSrc)}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <>
            {/* 1st Image */}
            <img
              src={getOptimizedImageUrl(defaultImg)}
              alt={item.country}
              loading="lazy"
              decoding="async"
              onError={(e) => handleImageError(e, defaultImg)}
              className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${currentImageIndex === 0 ? 'opacity-100' : 'opacity-0'
                }`}
            />

            {/* 2nd Image */}
            <img
              src={getOptimizedImageUrl(hoverImg)}
              alt={`${item.country} alternative`}
              loading="lazy"
              decoding="async"
              onError={(e) => handleImageError(e, hoverImg)}
              className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${currentImageIndex === 1 ? 'opacity-100' : 'opacity-0'
                }`}
            />
          </>
        )}
      </div>

      {/* Bottom Vignette Gradient */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none z-10" />

      {/* Card Overlay Text */}
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-center z-15 flex flex-col items-center justify-end">
        <h3 className="text-white text-sm sm:text-base md:text-lg font-extrabold uppercase tracking-wider drop-shadow-md">
          {item.country}
        </h3>
        {item.collection && (
          <p className="text-white/85 text-[14px] sm:text-[14px] md:text-[14px] tracking-[0.18em] uppercase mt-1 font-medium opacity-90">
            {item.collection}
          </p>
        )}
      </div>

      {/* Inner Border */}
      <div className="absolute inset-0 border border-white/10 pointer-events-none z-20" />
    </Link>
  );
};

const PromoSlider = () => {
  const [prevEl, setPrevEl] = useState(null);
  const [nextEl, setNextEl] = useState(null);
  const [collections, setCollections] = useState(staticCollections);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "world_edits_carousel"), (snap) => {
      if (!snap.empty) {
        const fetched = snap.docs.map((d, index) => {
          const data = d.data();
          const countryName = data.country || '';
          const fallback = staticCollections[index] || {};
          return {
            id: d.id,
            badge: data.badge || 'ORGANIC',
            order: typeof data.order === 'number' ? data.order : index + 1,
            ...data,
            video: data.video || data.videoUrl || fallback.video,
            defaultImage: data.defaultImage || data.image || fallback.defaultImage || 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&q=80&w=800',
            hoverImage: data.hoverImage || data.image || fallback.hoverImage || 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&q=80&w=800',
            link: data.link || `/shop?country=${encodeURIComponent(countryName)}`
          };
        });
        fetched.sort((a, b) => (a.order || 0) - (b.order || 0));
        setCollections(fetched);
      } else {
        setCollections(staticCollections);
      }
    });
  }, []);


  return (
    <section className="w-full relative py-6 md:py-8 overflow-hidden" style={{ backgroundColor: LIGHT_BG }}>
      <div className="max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-10 mb-6 md:mb-8 flex items-center justify-between">
        <div className="w-10 opacity-0 hidden sm:block" /> {/* Spacer for centering */}

        <div className="max-w-2xl mx-auto text-center">
          <h2
            className="font-serif font-light leading-tight tracking-tight text-3xl sm:text-4xl md:text-5xl lg:text-[42px] text-[#222222]"
          >
            World <span className="italic font-normal text-[#2e0e43]">Edits</span>
          </h2>
          <div className="flex items-center justify-center gap-3 mt-3">
            <span className="w-8 h-[1px] bg-[#B58E58]/40" />
            <span className="text-xs text-[#B58E58]">✦</span>
            <span className="w-8 h-[1px] bg-[#B58E58]/40" />
          </div>
        </div>

        {/* Custom Navigation Header Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => prevEl && prevEl.click()}
            aria-label="Previous slide"
            className="w-11 h-11 rounded-full bg-[#2e0e43] border border-[#C8A97A] text-[#F0D5A8] hover:bg-[#C8A97A] hover:text-[#2e0e43] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center shadow-md cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
            title="Previous Slide"
          >
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <button
            onClick={() => nextEl && nextEl.click()}
            aria-label="Next slide"
            className="w-11 h-11 rounded-full bg-[#2e0e43] border border-[#C8A97A] text-[#F0D5A8] hover:bg-[#C8A97A] hover:text-[#2e0e43] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center shadow-md cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
            title="Next Slide"
          >
            <ChevronRight size={20} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* If <= 5 items on Desktop, render grid. If > 5 items or Mobile/Tablet, render Swiper Slider */}
      {isDesktop && collections.length <= 5 ? (
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 max-w-[1650px]">
          <div
            className="mx-auto grid gap-3 sm:gap-4 md:gap-5"
            style={{ gridTemplateColumns: `repeat(${collections.length}, minmax(0, 1fr))` }}
          >
            {collections.map((item) => (
              <CardItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      ) : (
        <div className="relative mx-auto px-4 sm:px-6 lg:px-10 max-w-[1650px] group">
          {/* Prominent Floating Overlay Navigation Controls */}
          <button
            ref={(node) => setPrevEl(node)}
            aria-label="Previous slide"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#2e0e43]/90 text-[#F0D5A8] backdrop-blur-md border-2 border-[#C8A97A] shadow-[0_8px_25px_rgba(0,0,0,0.5)] hover:bg-[#C8A97A] hover:text-[#2e0e43] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer disabled:opacity-20 disabled:pointer-events-none"
            title="Previous Slide"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>

          <button
            ref={(node) => setNextEl(node)}
            aria-label="Next slide"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#2e0e43]/90 text-[#F0D5A8] backdrop-blur-md border-2 border-[#C8A97A] shadow-[0_8px_25px_rgba(0,0,0,0.5)] hover:bg-[#C8A97A] hover:text-[#2e0e43] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer disabled:opacity-20 disabled:pointer-events-none"
            title="Next Slide"
          >
            <ChevronRight size={24} strokeWidth={2.5} />
          </button>

          <Swiper
            modules={[Navigation, Autoplay]}
            spaceBetween={16}
            slidesPerView={1.15}
            autoplay={{ delay: 4500, disableOnInteraction: false }}
            navigation={{
              prevEl,
              nextEl,
            }}
            breakpoints={{
              320: { slidesPerView: 1.2, spaceBetween: 12 },
              480: { slidesPerView: 1.8, spaceBetween: 16 },
              640: { slidesPerView: 2.5, spaceBetween: 16 },
              768: { slidesPerView: 3.5, spaceBetween: 20 },
              1024: { slidesPerView: 4.2, spaceBetween: 20 },
              1280: { slidesPerView: 5, spaceBetween: 24 },
            }}
            className="w-full"
          >
            {collections.map((item) => (
              <SwiperSlide key={item.id}>
                <CardItem item={item} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </section>
  );
};

export default PromoSlider;


