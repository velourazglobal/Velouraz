import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { db } from '../../components/Firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { getOptimizedImageUrl, handleImageError } from '../../config/cloudinary';

import 'swiper/css';
import 'swiper/css/navigation';

const defaultCategories = [
  {
    id: '1',
    num: '01',
    name: "BANGLES",
    image: "img/jewellery/j.png",
    link: "/shop?category=Bangles"
  },
  {
    id: '2',
    num: '02',
    name: "JEWELLERY",
    image: "img/jewellery/j (6).png",
    link: "/shop"
  },
  {
    id: '3',
    num: '03',
    name: "NECKLACES",
    image: "img/jewellery/j (1).png",
    link: "/shop?category=Necklace"
  },
  {
    id: '4',
    num: '04',
    name: "JEWELLERY SETS",
    image: "img/jewellery/j (3).png",
    link: "/shop?category=Bridal Wear"
  },
  {
    id: '5',
    num: '05',
    name: "BRACELETS",
    image: "img/jewellery/j (4).png",
    link: "/shop?category=Bracelet"
  },
  {
    id: '6',
    num: '06',
    name: "RINGS",
    image: "img/jewellery/j (5).png",
    link: "/shop?category=Rings"
  }
];

const getCategoryIcon = (name) => {
  const n = (name || '').toLowerCase();
  if (n.includes('bangle')) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E5C794" strokeWidth="1.5">
        <ellipse cx="12" cy="12" rx="9" ry="5" />
      </svg>
    );
  }
  if (n.includes('necklace')) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E5C794" strokeWidth="1.5">
        <path d="M4 6C4 13.5 7.58 19 12 19C16.42 19 20 13.5 20 6" />
        <circle cx="12" cy="19" r="1.5" fill="#E5C794" />
      </svg>
    );
  }
  if (n.includes('bracelet')) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E5C794" strokeWidth="1.5">
        <ellipse cx="12" cy="12" rx="8" ry="6" strokeDasharray="3 2" />
      </svg>
    );
  }
  if (n.includes('ring')) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E5C794" strokeWidth="1.5">
        <circle cx="12" cy="14" r="5" />
        <polygon points="12,5 15,9 9,9" fill="#E5C794" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E5C794" strokeWidth="1.5">
      <path d="M12 2L15 8L21 9L16.5 13.5L18 19.5L12 16.5L6 19.5L7.5 13.5L3 9L9 8L12 2Z" />
    </svg>
  );
};

const CategorySection = () => {
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const [categories, setCategories] = useState(defaultCategories);

  useEffect(() => {
    return onSnapshot(collection(db, "categories"), (snap) => {
      if (!snap.empty) {
        setCategories(snap.docs.map((d, index) => {
          const item = d.data();
          let targetCategory = item.name || '';

          // Map to match Shop category filters
          const nameLower = targetCategory.toLowerCase().trim();
          if (nameLower === 'necklaces') targetCategory = 'Necklace';
          else if (nameLower === 'bracelets') targetCategory = 'Bracelet';
          else if (nameLower === 'jewellery sets' || nameLower === 'sets') targetCategory = 'Bridal Wear';
          else if (nameLower === 'jewellery') targetCategory = ''; // Show all
          else {
            // Capitalize first letter to match Shop category casing
            targetCategory = targetCategory.charAt(0).toUpperCase() + targetCategory.slice(1);
          }

          const shopLink = targetCategory ? `/shop?category=${encodeURIComponent(targetCategory)}` : '/shop';

          return {
            id: d.id,
            num: String(index + 1).padStart(2, '0'),
            name: (item.name || '').toUpperCase(),
            image: item.image || defaultCategories[index % defaultCategories.length].image,
            link: shopLink
          };
        }));
      } else {
        setCategories(defaultCategories);
      }
    });
  }, []);

  return (
    <section
      className="py-6 md:py-8 overflow-hidden relative bg-cover bg-center bg-no-repeat bg-[#FAF7F2]"
      style={{
        backgroundImage: `url('https://res.cloudinary.com/duzwys877/image/upload/v1785055538/ChatGPT_Image_Jul_26_2026_02_14_54_PM_ynzwqp.png')`
      }}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">

        {/* Section Header */}
        <div className="flex flex-col lg:flex-row items-center lg:items-center justify-between mb-6 md:mb-8 gap-6">
          <div className="w-10 opacity-0 hidden lg:block" /> {/* Spacer for centering */}

          <div className="max-w-2xl mx-auto text-center">
            <h2
              className="font-serif font-light leading-tight tracking-tight text-3xl sm:text-4xl md:text-5xl lg:text-[42px] text-[#222222]"
            >
              Shop By <span className="italic font-normal text-[#2e0e43]">Category</span>
            </h2>
            <div className="flex items-center justify-center gap-3 mt-3">
              <span className="w-8 h-[1px] bg-[#B58E58]/40" />
              <span className="text-xs text-[#B58E58]">✦</span>
              <span className="w-8 h-[1px] bg-[#B58E58]/40" />
            </div>
          </div>

          {/* Slider Navigation Buttons */}
          <div className="flex items-center gap-2.5 pb-2">
            <button
              ref={prevRef}
              aria-label="Previous categories"
              className="w-10 h-10 rounded-full border border-[#D8CBBE] bg-white/60 flex items-center justify-center text-[#7B6D63] hover:border-[#2e0e43] hover:text-[#2e0e43] hover:bg-white transition-all duration-300 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft size={18} strokeWidth={1.5} />
            </button>
            <button
              ref={nextRef}
              aria-label="Next categories"
              className="w-10 h-10 rounded-full border border-[#D8CBBE] bg-white/60 flex items-center justify-center text-[#7B6D63] hover:border-[#2e0e43] hover:text-[#2e0e43] hover:bg-white transition-all duration-300 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Categories Slider */}
        <div className="relative">
          <Swiper
            modules={[Navigation, Autoplay]}
            spaceBetween={20}
            slidesPerView={1.2}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}
            onBeforeInit={(swiper) => {
              swiper.params.navigation.prevEl = prevRef.current;
              swiper.params.navigation.nextEl = nextRef.current;
            }}
            breakpoints={{
              480: { slidesPerView: 2, spaceBetween: 16 },
              768: { slidesPerView: 4, spaceBetween: 16 },
              1024: { slidesPerView: 4, spaceBetween: 20 },
              1280: { slidesPerView: 4, spaceBetween: 24 },
            }}
            className="!overflow-visible"
          >
            {categories.map((category, index) => (
              <SwiperSlide key={category.id || index}>
                <motion.div
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.08 }}
                  className="group flex flex-col h-full rounded-2xl border border-[#D5C29D]/50 bg-black overflow-hidden shadow-[0_6px_25px_rgba(0,0,0,0.12)] hover:shadow-[0_14px_35px_rgba(0,0,0,0.22)] hover:border-[#B58E58] transition-all duration-500 cursor-pointer relative aspect-[3/3.8]"
                >
                  <Link to={category.link} className="relative w-full h-full block">
                    {/* Background Full Image */}
                    <img
                      src={getOptimizedImageUrl(category.image)}
                      alt={category.name}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => handleImageError(e, category.image)}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />

                    {/* Top-Left Circular Jewellery Icon Badge */}
                    <div className="absolute top-4 left-4 z-10">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#D5C29D]/60 bg-black/40 backdrop-blur-md flex items-center justify-center text-[#E5C794] shadow-md group-hover:bg-[#2E0E43]/80 transition-colors duration-300">
                        {getCategoryIcon(category.name)}
                      </div>
                    </div>

                    {/* Bottom Dark Gradient Overlay with Title & Arrow */}
                    <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5 bg-gradient-to-t from-[#14061F]/90 via-[#14061F]/50 to-transparent flex items-center justify-between gap-3">
                      <h3 className="text-xs sm:text-sm font-serif font-medium tracking-[0.18em] text-white uppercase group-hover:text-[#E5C794] transition-colors duration-300">
                        {category.name}
                      </h3>

                      <div className="w-8 h-8 rounded-full bg-[#1F0A2C] border border-[#D5C29D]/50 text-[#E5C794] flex items-center justify-center shrink-0 group-hover:bg-[#B58E58] group-hover:border-[#B58E58] group-hover:text-white transition-all duration-300 shadow-md">
                        <ArrowRight size={13} strokeWidth={1.5} className="group-hover:translate-x-0.5 transition-transform duration-300" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Bottom Explore All Collections Button */}
        <div className="flex justify-center mt-12 md:mt-16">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 border border-[#2e0e43] text-[#2e0e43] text-xs font-semibold tracking-[0.25em] uppercase hover:bg-[#2e0e43] hover:text-white transition-all duration-300 bg-transparent group"
          >
            <span>EXPLORE ALL COLLECTIONS</span>
            <span className="text-xs text-[#B58E58] group-hover:text-white transition-colors">✦</span>
          </Link>
        </div>

      </div>
    </section>
  );
};

export default CategorySection;


