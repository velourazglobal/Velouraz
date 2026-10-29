import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { Loader2, Heart, ChevronLeft, ChevronRight, Globe, Star, ShoppingBag } from 'lucide-react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../Firebase';
import { useStore } from '../../hooks/useStore';
import AddToCartModal from '../AddToCartModal';
import { getOptimizedImageUrl, getThumbnailUrl, getImageSrcSet, getOptimizedVideoUrl, getVideoPosterUrl, handleImageError, handleVideoError } from '../../config/cloudinary';
import { isProductBestseller } from '../../services/productService';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';

/* ── Skeleton Card ── */
const SkeletonCard = () => (
  <div className="flex flex-col rounded-2xl border border-[#EBE3D8] bg-white overflow-hidden shadow-xs animate-pulse">
    {/* Image area */}
    <div className="aspect-[4/4.3] w-full bg-[#F0E9E0]" />
    {/* Info area */}
    <div className="p-4 sm:p-5 space-y-3 border-t border-[#F5EFE6]">
      <div className="h-2.5 w-16 bg-[#F0E9E0] rounded-full" />
      <div className="h-3.5 w-4/5 bg-[#EBE3D8] rounded-full" />
      <div className="flex items-center justify-between pt-3 border-t border-[#F7F2EB]">
        <div className="h-3.5 w-20 bg-[#EBE3D8] rounded-full" />
        <div className="h-3 w-10 bg-[#F0E9E0] rounded-full" />
      </div>
    </div>
  </div>
);

const BestSellers = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistLoadings, setWishlistLoadings] = useState({});
  const [cartLoadings, setCartLoadings] = useState({});
  const [addModalProduct, setAddModalProduct] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = 0.6;
  }, []);

  useEffect(() => {
    const fetchBestsellers = async () => {
      try {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const filtered = list.filter(isProductBestseller);
          setProducts(filtered);
        } else {
          setProducts([]);
        }
      } catch (e) {
        console.error("Error fetching bestsellers:", e);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBestsellers();
  }, []);

  const { addToWishlist, isInWishlist, addToCart, isInCart } = useStore();

  const handleAddToWishlist = async (e, product) => {
    e.stopPropagation();
    setWishlistLoadings(prev => ({ ...prev, [product.id]: true }));
    try { await addToWishlist(product); }
    finally { setWishlistLoadings(prev => ({ ...prev, [product.id]: false })); }
  };

  const handleAddToCart = async (e, product) => {
    e.stopPropagation();
    if (product.stock <= 0) return;
    setCartLoadings(prev => ({ ...prev, [product.id]: true }));
    try {
      const res = await addToCart(product, 1);
      if (res) { setAddModalProduct(product); setIsAddModalOpen(true); }
    } finally {
      setCartLoadings(prev => ({ ...prev, [product.id]: false }));
    }
  };

  /* Skeleton placeholders count while loading */
  const SKELETON_COUNT = 4;

  return (
    <section className="py-10 md:py-14 relative overflow-hidden bg-[#FAF7F2]">
      {/* Background Video */}
      <video
        ref={videoRef}
        autoPlay loop muted playsInline
        onLoadedMetadata={(e) => { e.target.playbackRate = 0.6; }}
        onPlay={(e) => { e.target.playbackRate = 0.6; }}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0 opacity-40"
      >
        <source src="https://res.cloudinary.com/duzwys877/video/upload/v1785058045/Animate_two_airplanes_looping_202607261457_fojd30.mp4" type="video/mp4" />
      </video>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 md:mb-10 gap-4">
          <div className="text-center sm:text-left">
            <h2 className="font-serif font-light text-3xl sm:text-4xl md:text-5xl text-[#222222] tracking-tight">
              The <span className="italic font-normal text-[#2E0E43]">Bestsellers</span>
            </h2>
            <div className="flex items-center gap-2.5 mt-2 justify-center sm:justify-start">
              <span className="w-7 h-[1px] bg-[#B58E58]/60" />
              <span className="text-[14px] text-[#B58E58] uppercase tracking-[0.25em] font-semibold">Curated Pieces</span>
            </div>
          </div>

          {/* Navigation Arrows */}
          {!loading && products.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                ref={prevRef}
                aria-label="Previous product"
                className="w-10 h-10 rounded-full border border-[#D8CBBE] bg-white/90 flex items-center justify-center text-[#7B6D63] hover:border-[#2E0E43] hover:text-[#2E0E43] hover:bg-white transition-all duration-300 cursor-pointer disabled:opacity-30 shadow-xs"
              >
                <ChevronLeft size={19} strokeWidth={1.5} />
              </button>
              <button
                ref={nextRef}
                aria-label="Next product"
                className="w-10 h-10 rounded-full border border-[#D8CBBE] bg-white/90 flex items-center justify-center text-[#7B6D63] hover:border-[#2E0E43] hover:text-[#2E0E43] hover:bg-white transition-all duration-300 cursor-pointer disabled:opacity-30 shadow-xs"
              >
                <ChevronRight size={19} strokeWidth={1.5} />
              </button>
            </div>
          )}
        </div>

        {/* Skeleton Loader */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && products.length === 0 && (
          <div className="text-center py-16 text-[#999]">
            <p className="font-serif italic text-lg">No bestsellers found at the moment.</p>
            <p className="text-xs mt-1 tracking-widest uppercase text-[#C8A46A]">Check back soon</p>
          </div>
        )}

        {/* Product Slider */}
        {!loading && products.length > 0 && (
          <div className="relative">
            <Swiper
              modules={[Navigation, Autoplay]}
              spaceBetween={22}
              slidesPerView={1.2}
              loop={products.length > 3}
              speed={800}
              autoplay={{ delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }}
              navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
              onBeforeInit={(swiper) => {
                swiper.params.navigation.prevEl = prevRef.current;
                swiper.params.navigation.nextEl = nextRef.current;
              }}
              breakpoints={{
                480: { slidesPerView: 2, spaceBetween: 18 },
                768: { slidesPerView: 3, spaceBetween: 22 },
                1024: { slidesPerView: 4, spaceBetween: 26 },
              }}
              className="!overflow-visible py-1"
            >
              {products.map((product, index) => {
                const inWishlist = isInWishlist ? isInWishlist(product.id) : false;
                const inCart = isInCart ? isInCart(product.id) : false;
                const isSoldOut = product.stock <= 0 || product.badge === 'SOLD OUT';
                const badgeLabel = isSoldOut ? 'SOLD OUT' : (product.badge || 'BESTSELLER');
                const countryList = ['ITALY', 'SRI LANKA', 'TURKEY', 'UAE', 'BRAZIL'];
                const country = product.country || countryList[index % countryList.length];
                const reviewsCount = product.reviewsCount || product.reviews || 128;
                const isCartLoading = cartLoadings[product.id];

                return (
                  <SwiperSlide key={product.id || index}>
                    <div
                      className="group flex flex-col h-full rounded-2xl border border-[#EBE3D8] bg-white overflow-hidden shadow-xs hover:shadow-xl hover:border-[#B58E58] transition-all duration-500 cursor-pointer"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      {/* Image Container */}
                      <div className="relative aspect-[4/4.3] w-full overflow-hidden bg-[#FAF6F0]">
                        {(() => {
                          const rawImg = product.image || product.images?.[0] || 'img/jewellery/j.png';
                          return (
                            <img
                              src={getThumbnailUrl(rawImg, 420)}
                              srcSet={getImageSrcSet(rawImg, [320, 480, 640])}
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                              alt={product.name}
                              loading="lazy"
                              decoding="async"
                              onError={(e) => handleImageError(e, rawImg)}
                              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            />
                          );
                        })()}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                        {/* Badge Tag */}
                        <div className="absolute top-3 left-3 z-10">
                          <span
                            className={`inline-block text-[14px] tracking-[0.2em] font-bold uppercase px-3 py-1 rounded-md text-white shadow-xs ${isSoldOut ? 'bg-gray-800' : 'bg-[#2E0E43]'
                              }`}
                          >
                            {badgeLabel}
                          </span>
                        </div>

                        {/* Country Tag */}
                        <div className="absolute bottom-3 left-3 z-10 group-hover:opacity-0 transition-opacity duration-300">
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs border border-[#E5DBCC] text-[14px] font-bold text-[#8C6D37] tracking-wider uppercase shadow-xs">
                            <Globe size={11} className="text-[#8C6D37]" />
                            <span>{country}</span>
                          </div>
                        </div>

                        {/* Wishlist Button */}
                        <button
                          onClick={(e) => handleAddToWishlist(e, product)}
                          disabled={wishlistLoadings[product.id]}
                          aria-label="Add to wishlist"
                          className="absolute top-3 right-3 w-8.5 h-8.5 rounded-full bg-white/90 backdrop-blur-xs shadow-xs flex items-center justify-center text-[#2A2623] hover:text-[#2E0E43] hover:bg-white transition-all duration-300 z-10 hover:scale-110 cursor-pointer border border-black/5"
                        >
                          {wishlistLoadings[product.id] ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Heart
                              size={15}
                              fill={inWishlist ? '#2E0E43' : 'none'}
                              stroke={inWishlist ? '#2E0E43' : 'currentColor'}
                              strokeWidth={inWishlist ? 0 : 1.5}
                            />
                          )}
                        </button>

                        {/* Add to Cart Hover Button */}
                        <div className="absolute bottom-3 inset-x-3 z-20 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out">
                          <button
                            onClick={(e) => handleAddToCart(e, product)}
                            disabled={isSoldOut || isCartLoading}
                            className={`w-full py-2.5 px-4 rounded-full text-[14px] font-bold tracking-[0.18em] uppercase transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer border border-white/20 ${isSoldOut
                              ? 'bg-gray-800/90 text-white/70 cursor-not-allowed'
                              : 'bg-[#2E0E43] text-white hover:bg-[#1E092D] active:scale-95'
                              }`}
                          >
                            {isCartLoading ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <>
                                <ShoppingBag size={13} />
                                <span>{inCart ? 'Add More' : 'Add to Cart'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="p-4 sm:p-5 bg-white flex flex-col justify-between flex-1 text-left border-t border-[#F5EFE6]">
                        <div>
                          <span className="text-[14px] font-bold tracking-[0.25em] text-[#B58E58] block mb-1 uppercase">
                            {product.brand || "VELOURAZ"}
                          </span>
                          <h3 className="text-[14px] sm:text-[15px] font-serif font-medium text-[#222222] group-hover:text-[#2E0E43] leading-snug line-clamp-1 mb-2.5 transition-colors">
                            {product.name}
                          </h3>
                        </div>

                        {/* Price & Rating */}
                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#F7F2EB]">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[15px] sm:text-base font-bold text-[#2E0E43]">
                              ₹{Number(product.price || 0).toLocaleString()}
                            </span>
                            {product.original_price && Number(product.original_price) > Number(product.price) && (
                              <span className="text-xs text-[#999999] line-through font-normal">
                                ₹{Number(product.original_price).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star size={12} className="fill-[#D4A359] text-[#D4A359]" />
                            <span className="text-xs text-[#666666] font-medium">({reviewsCount})</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>
        )}

        {/* Explore All Button */}
        {!loading && products.length > 0 && (
          <div className="flex justify-center mt-10 md:mt-12">
            <Link
              to="/shop?tag=Bestsellers"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 border border-[#2E0E43] text-[#2E0E43] text-[14px] font-semibold tracking-[0.22em] uppercase hover:bg-[#2E0E43] hover:text-white transition-all duration-300 rounded-full"
            >
              <span>EXPLORE ALL BESTSELLERS</span>
              <span className="text-xs text-[#B58E58] group-hover:text-white">✦</span>
            </Link>
          </div>
        )}

      </div>

      {/* Add To Cart Popup */}
      {isAddModalOpen && (
        <AddToCartModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          product={addModalProduct}
        />
      )}
    </section>
  );
};

export default BestSellers;
