import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote, MapPin } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { db } from '../Firebase';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { getOptimizedImageUrl, handleImageError } from '../../config/cloudinary';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';

const SERIF = "'Cormorant Garamond', Georgia, serif";

const defaultReviews = [
  {
    id: 'rev-1',
    name: "Ananya Sharma",
    location: "Mumbai, India",
    title: "Verified Buyer",
    date: "14 may 2026",
    quote: "The Kundan Choker exceeded all my expectations. The craftsmanship is divine and the atelier packaging felt like receiving a royal gift.",
    rating: 5
  },
  {
    id: 'rev-2',
    name: "Rohan Kapoor",
    location: "New Delhi, India",
    title: "Verified Collector",
    date: "02 jun 2026",
    quote: "Acquired the Solitaire Ring for our 10th anniversary. Exceptional brilliance and unmatched anti-tarnish durability.",
    rating: 5
  },
  {
    id: 'rev-3',
    name: "Meera Oberoi",
    location: "London, UK",
    title: "Verified Buyer",
    date: "28 april 2026",
    quote: "Velouraz high jewellery pieces have become my signature style for celebrations. The weight, luster, and finish are extraordinary.",
    rating: 5
  },
  {
    id: 'rev-4',
    name: "Kavita Singhania",
    location: "Dubai, UAE",
    title: "Verified Buyer",
    date: "19 may 2026",
    quote: "The attention to detail and gemstone clarity is remarkable. Truly heirloom-quality creations.",
    rating: 5
  }
];

const TestimonialSection = () => {
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const [reviewsList, setReviewsList] = useState(defaultReviews);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "reviews"), (snapshot) => {
      if (!snapshot.empty) {
        const fetched = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.visible !== false) {
            fetched.push({
              id: docSnap.id,
              name: data.customerName || data.name || "Happy Collector",
              location: data.place || data.location || "",
              title: data.title || "Verified Buyer",
              date: data.date || "",
              quote: data.review || data.quote || "",
              rating: Number(data.rating) || 5,
              productName: data.productName || "",
              productImage: data.productImage || ""
            });
          }
        });

        if (fetched.length > 0) {
          setReviewsList([...fetched, ...defaultReviews]);
        }
      }
    }, (error) => {
      console.error("Firebase reviews fetch error:", error);
    });

    return () => unsubscribe();
  }, []);

  return (
    <section className="py-16 md:py-20 relative overflow-hidden bg-[#F8F4EF] border-t border-b border-[#D8CBBE]/40">

      {/* Subtle Ambient Background Radial Lighting */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(ellipse at center, rgba(200,164,106,0.12), transparent 70%)' }}
      />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-10 md:mb-12 gap-6">

          <div className="text-center sm:text-left space-y-2">
            <h2 className="font-serif font-normal leading-tight text-3xl sm:text-4xl md:text-5xl text-[#2e0e43]">
              Real Stories. <span className="italic font-serif">Real Love.</span>
            </h2>
          </div>

          {/* Swiper Navigation Controls */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              ref={prevRef}
              aria-label="Previous testimonial"
              className="w-11 h-11 rounded-full bg-white border border-[#D8CBBE] flex items-center justify-center text-[#2e0e43] hover:bg-[#2e0e43] hover:text-white hover:border-[#2e0e43] transition-all duration-300 shadow-xs cursor-pointer"
            >
              <ChevronLeft size={18} strokeWidth={1.8} />
            </button>
            <button
              ref={nextRef}
              aria-label="Next testimonial"
              className="w-11 h-11 rounded-full bg-white border border-[#D8CBBE] flex items-center justify-center text-[#2e0e43] hover:bg-[#2e0e43] hover:text-white hover:border-[#2e0e43] transition-all duration-300 shadow-xs cursor-pointer"
            >
              <ChevronRight size={18} strokeWidth={1.8} />
            </button>
          </div>

        </div>

        {/* Testimonials Carousel */}
        <div className="relative overflow-hidden">
          <Swiper
            modules={[Navigation, Autoplay]}
            spaceBetween={24}
            slidesPerView={1}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}
            onBeforeInit={(swiper) => {
              swiper.params.navigation.prevEl = prevRef.current;
              swiper.params.navigation.nextEl = nextRef.current;
            }}
            breakpoints={{
              640: { slidesPerView: 1.5 },
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
              1280: { slidesPerView: 3 },
            }}
            className="!overflow-visible [&_.swiper-slide]:!h-auto"
          >
            {reviewsList.map((review, index) => (
              <SwiperSlide key={review.id || index} className="!h-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="p-7 lg:p-8 h-[314px] flex flex-col justify-between border border-[#E5D7C5] bg-gradient-to-b from-[#FFFFFF] via-[#FAF6F0] to-[#F7F0E6] rounded-3xl hover:border-[#C8A46A] hover:shadow-[0_15px_40px_rgba(200,164,106,0.18)] transition-all duration-500 shadow-sm relative group overflow-hidden"
                >

                  {/* Top Quote Watermark Icon */}
                  <Quote size={36} className="absolute top-5 right-5 text-[#C8A46A]/15 group-hover:text-[#C8A46A]/30 transition-colors pointer-events-none" />

                  {/* Top Bar: Rating Stars & Location Badge */}
                  <div className="flex items-center justify-between gap-3 mb-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      {[...Array(review.rating || 5)].map((_, i) => (
                        <Star key={i} size={15} className="fill-[#B89355] text-[#B89355]" />
                      ))}
                    </div>

                    {review.location && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF3E8] border border-[#C8A46A]/30 text-[#8B6B38] text-[14px] font-sans font-semibold tracking-wider uppercase">
                        <MapPin size={11} className="text-[#B89355]" />
                        {review.location}
                      </span>
                    )}
                  </div>

                  {/* Reviewed Product Tag if present */}
                  {review.productName && (
                    <div className="mb-2 flex items-center gap-2 text-[14px] text-[#8B6B38] font-sans font-semibold bg-[#FAF3E8]/80 px-2.5 py-1 rounded-lg border border-[#C8A46A]/30 w-fit shrink-0">
                      {review.productImage && (
                        <img
                          src={getOptimizedImageUrl(review.productImage)}
                          alt={review.productName}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => handleImageError(e, review.productImage)}
                          className="w-5 h-5 rounded-md object-cover border border-[#D8CBBE]"
                        />
                      )}
                      <span className="truncate max-w-[180px]">Item: {review.productName}</span>
                    </div>
                  )}

                  {/* Quote Content with line-clamp truncation */}
                  <p className="text-[#2A2623] text-base sm:text-lg leading-relaxed italic font-serif font-light flex-grow line-clamp-3">
                    "{review.quote}"
                  </p>

                  {/* Reviewer Details Footer */}
                  <div className="mt-4 pt-4 border-t border-[#E8DFC8] flex items-center gap-3.5 shrink-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-[#E5C794] shadow-sm shrink-0 bg-gradient-to-br from-[#2e0e43] to-[#4a186a] border border-[#C8A46A]/40 font-serif">
                      {review.name ? review.name.trim().charAt(0) : 'V'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold tracking-[0.2em] font-sans text-[#2A2623] uppercase truncate">
                        {review.name ? review.name.trim() : 'Verified Collector'}
                      </p>
                      <p className="text-xs sm:text-sm font-serif text-[#7B6D63] truncate">
                        {review.title || 'Verified Buyer'}{review.date ? ` • ${review.date}` : ''}
                      </p>
                    </div>
                  </div>

                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

      </div>
    </section>
  );
};

export default TestimonialSection;