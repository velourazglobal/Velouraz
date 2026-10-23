import React from 'react';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { Link } from 'react-router-dom';

import 'swiper/css';
import 'swiper/css/pagination';
import { getOptimizedImageUrl, handleImageError } from '../../config/cloudinary';

const blogPosts = [
  {
    id: 1,
    title: "How To Style Kundan Jewellery for Every Occasion",
    date: "MAY 20, 2024",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: 2,
    title: "A Guide to Korean Minimal Jewellery (And Why We Love It)",
    date: "MAY 15, 2024",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: 3,
    title: "5 Timeless Jewellery Pieces Every Woman Should Own",
    date: "MAY 10, 2024",
    image: "https://images.unsplash.com/photo-1626497748470-283424659b83?auto=format&fit=crop&q=80&w=800",
  }
];

const Stories = () => {
  return (
    <section className="bg-[#F8F4EF] py-10 lg:py-20 overflow-hidden border-t border-[#D8CBBE]/30">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-10">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
          
          {/* Left: Section Header */}
          <div className="w-full lg:w-1/3 space-y-10">
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-[1px] bg-[#2e0e43]" />
                <span className="text-[16px] md:text-[16px] tracking-[0.4em] font-bold text-[#7B6D63] uppercase">
                  THE JOURNAL
                </span>
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl lg:text-5xl font-serif text-[#2A2623] leading-tight"
              >
                Stories, Style & <span className="text-[#2e0e43] italic">Inspiration</span>
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-[#7B6D63] font-serif text-base leading-relaxed max-w-sm"
              >
                Dive into the world of jewellery, fashion trends, and timeless elegance.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Link 
                to="/journal" 
                className="bg-[#2e0e43] text-white px-10 py-4 text-[16px] tracking-[0.2em] font-bold uppercase hover:bg-[#5E0B24] transition-all inline-block shadow-xl"
              >
                Explore Journal
              </Link>
            </motion.div>
          </div>

          {/* Right: Articles Slider */}
          <div className="w-full lg:w-2/3 overflow-hidden">
            <Swiper
              modules={[Pagination, Autoplay]}
              spaceBetween={30}
              slidesPerView={1.1}
              autoplay={{ delay: 5000, disableOnInteraction: false }}
              pagination={{
                clickable: true,
                el: '.journal-pagination'
              }}
              breakpoints={{
                768: { slidesPerView: 2.1 },
                1280: { slidesPerView: 2.1 }
              }}
              className="w-full"
            >
              {blogPosts.map((post, index) => (
                <SwiperSlide key={post.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.8 }}
                    className="group"
                  >
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-6 shadow-sm group-hover:shadow-xl transition-all duration-700">
                      <img 
                        src={getOptimizedImageUrl(post.image)} 
                        alt={post.title} 
                        loading="lazy"
                        decoding="async"
                        onError={(e) => handleImageError(e, post.image)}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                    </div>
                    <div className="space-y-3">
                      <span className="text-[16px] tracking-[0.2em] font-bold text-[#2e0e43] uppercase">
                        {post.date}
                      </span>
                      <h3 className="text-xl lg:text-2xl font-serif text-[#2A2623] group-hover:text-[#2e0e43] transition-colors leading-snug">
                        {post.title}
                      </h3>
                    </div>
                  </motion.div>
                </SwiperSlide>
              ))}
            </Swiper>
            
            {/* Custom Pagination as seen in reference */}
            <div className="journal-pagination mt-16 flex justify-center lg:justify-start gap-2 [&_.swiper-pagination-bullet]:!bg-transparent [&_.swiper-pagination-bullet]:!border [&_.swiper-pagination-bullet]:!border-[#2e0e43] [&_.swiper-pagination-bullet]:!opacity-100 [&_.swiper-pagination-bullet-active]:!bg-[#2e0e43] [&_.swiper-pagination-bullet]:!w-2.5 [&_.swiper-pagination-bullet]:!h-2.5 [&_.swiper-pagination-bullet]:!transition-all" />
          </div>

        </div>
      </div>
    </section>
  );
};

export default Stories;
