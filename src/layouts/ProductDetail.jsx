import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db } from "../components/Firebase";
import { doc, onSnapshot, collection, getDocs } from "firebase/firestore";
import { useAuth } from "../components/useAuth";
import { useStore } from '../hooks/useStore';
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Shield, Truck, RotateCcw, Heart, ShoppingBag,
  Share2, Gem, Sparkles, Loader2, ChevronRight,
  Eye, Award, Gift, RefreshCw, ZoomIn, Check,
  ArrowRight, Lock, X, CheckCircle2, ChevronDown, Compass, Bell, Package
} from 'lucide-react';
import AddToCartModal from "../components/AddToCartModal";
import NotifyMeModal from "../components/NotifyMeModal";
import { getOptimizedImageUrl, getThumbnailUrl, getImageSrcSet, handleImageError } from "../config/cloudinary";
import useSEO from "../hooks/useSEO";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [quantity, setQuantity] = useState(1);
  const [cartLoading, setCartLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [zoomStyle, setZoomStyle] = useState({ transform: "scale(1)" });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isAddToCartModalOpen, setIsAddToCartModalOpen] = useState(false);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [sameCountryProducts, setSameCountryProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState(null);
  const [giftWrap, setGiftWrap] = useState(false);

  const { addToCart, addToWishlist, isInCart, isInWishlist } = useStore();

  // Dynamic per-product SEO
  useSEO({
    title: product
      ? `${product.name} - ${product.category || 'Jewellery'} by Velouraz`
      : 'Jewellery by Velouraz',
    description: product
      ? `${product.description ? product.description.slice(0, 155).replace(/\n/g, ' ') + '...' : `Shop ${product.name} from the Velouraz ${product.collectionName || ''} collection. Globally curated, handcrafted jewellery delivered across India.`}`
      : 'Shop fine jewellery from Velouraz. Globally curated, handcrafted pieces delivered across India.',
    keywords: product
      ? `${product.name}, ${product.category || ''} india, ${product.collectionName || ''}, ${(product.tags || []).join(', ')}, velouraz, buy jewellery india`
      : 'velouraz jewellery',
    canonical: product ? `/product/${product.id}` : '/shop',
    ogType: 'product',
    ogImage: product?.primaryImage || product?.image || product?.images?.[0] || undefined,
    structuredData: product ? {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "description": (product.description || '').replace(/\n/g, ' '),
      "image": product.images && product.images.length > 0 ? product.images : [product.image || product.primaryImage].filter(Boolean),
      "sku": product.sku || product.id,
      "brand": {
        "@type": "Brand",
        "name": product.brand || "Velouraz"
      },
      "offers": {
        "@type": "Offer",
        "url": `https://www.velouraz.in/product/${product.id}`,
        "priceCurrency": "INR",
        "price": Number(product.price || 0),
        "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        "availability": Number(product.stock || 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "seller": { "@type": "Organization", "name": "Velouraz" },
        "itemCondition": "https://schema.org/NewCondition",
        "shippingDetails": {
          "@type": "OfferShippingDetails",
          "shippingRate": { "@type": "MonetaryAmount", "value": 0, "currency": "INR" },
          "deliveryTime": { "@type": "ShippingDeliveryTime", "handlingTime": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 2, "unitCode": "DAY" }, "transitTime": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 3, "unitCode": "DAY" } }
        }
      },
      "category": product.category || 'Jewellery',
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": 4.9,
        "reviewCount": 142,
        "bestRating": 5
      }
    } : null
  });

  useEffect(() => {
    if (!id) return undefined;
    setLoading(true);
    const ref = doc(db, "products", id);
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProduct({ id: snap.id, ...data });
        const actualStock = Number(data.stock || 0);
        if (actualStock > 0) {
          setQuantity((prev) => Math.min(prev, actualStock));
        }
      } else {
        setProduct(null);
      }
      setLoading(false);
    }, (e) => {
      console.error("Error listening to product:", e);
      setProduct(null);
      setLoading(false);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => unsubscribe();
  }, [id]);

  // Fetch Related Products (same category) & Same Country Products
  useEffect(() => {
    const fetchRelated = async () => {
      setRelatedLoading(true);
      try {
        const snap = await getDocs(collection(db, "products"));
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.id !== id);

        // Same category
        const currentCategory = product?.category;
        const byCat = currentCategory
          ? all.filter(p => p.category && p.category.toLowerCase() === currentCategory.toLowerCase())
          : [];
        setRelatedProducts(byCat.slice(0, 5));

        // Same country
        const currentCountry = (product?.inspired_country || product?.country || '').toLowerCase().trim();
        const byCountry = currentCountry
          ? all.filter(p => {
            const pCountry = (p.inspired_country || p.country || '').toLowerCase().trim();
            return pCountry && pCountry === currentCountry;
          })
          : [];
        setSameCountryProducts(byCountry.slice(0, 5));
      } catch (err) {
        console.error("Error loading related products:", err);
      } finally {
        setRelatedLoading(false);
      }
    };
    if (product) fetchRelated();
  }, [id, product]);

  const imageUrls = useMemo(() => {
    if (!product) return [];
    if (product.images && product.images.length > 0) return product.images;
    return [product.image || product.primaryImage || '/img/jewellery/j.png'].filter(Boolean);
  }, [product]);

  const activeImage = imageUrls[selectedImageIndex] || imageUrls[0] || "";

  const discountPercent = product?.original_price > product?.price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: "scale(2.4)"
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transformOrigin: "center center",
      transform: "scale(1)"
    });
  };

  const handleAddToCart = async () => {
    if (!product) return;
    setCartLoading(true);
    try {
      await addToCart(product, quantity);
      setIsAddToCartModalOpen(true);
    } finally {
      setCartLoading(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!product) return;
    setWishlistLoading(true);
    try {
      await addToWishlist(product);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleBuyNow = () => {
    if (!product || (product.stock !== undefined && Number(product.stock) <= 0)) return;
    const buyNowItem = {
      id: product.id,
      name: product.name,
      price: Number(product.price || 0),
      original_price: Number(product.original_price || 0),
      image: activeImage,
      quantity: quantity,
      category: product.category || 'Jewellery',
      stock: product.stock,
      giftWrap: giftWrap
    };
    navigate('/checkout', { state: { buyNowItem } });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const checkDeliveryPincode = (e) => {
    e.preventDefault();
    if (pincode.length === 6 && /^\d+$/.test(pincode)) {
      setPincodeStatus({ success: true, msg: "Insured Express Delivery available! Delivered within 2-3 business days via Insured Courier." });
    } else {
      setPincodeStatus({ success: false, msg: "Please enter a valid 6-digit Indian Pincode." });
    }
  };

  const getFlag = (country = "") => {
    const c = country.toLowerCase().trim();
    if (c.includes("italy")) return "🇮🇹";
    if (c.includes("south korea") || c.includes("korean")) return "🇰🇷";
    if (c.includes("france")) return "🇫🇷";
    if (c.includes("india")) return "🇮🇳";
    if (c.includes("greece")) return "🇬🇷";
    if (c.includes("turkey")) return "🇹🇷";
    if (c.includes("japan")) return "🇯🇵";
    if (c.includes("europe")) return "🇪🇺";
    return "✦";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center gap-6">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-2 border-[#D4B483]/20 border-t-[#C8A46A] rounded-full animate-spin" />
          <Gem size={22} className="absolute text-[#C8A46A] animate-pulse" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-xs uppercase tracking-[0.35em] text-[#14111E] font-semibold font-sans">
            Velouraz Haute Joaillerie
          </p>
          <p className="text-xs text-[#8C7A6B] font-serif italic">Unveiling Masterpiece Creation...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center gap-6 text-center p-6 pt-36">
        <Gem size={52} className="text-[#C8A46A]/60" />
        <h2 className="font-serif text-3xl sm:text-4xl text-[#14111E] font-normal">Creation unavailable or archived.</h2>
        <p className="text-sm text-[#786C60] max-w-sm font-serif italic">Explore our haute joaillerie boutique collections for handcrafted fine creations.</p>
        <button
          onClick={() => navigate('/shop')}
          className="px-9 py-4 bg-[#14111E] text-[#FBF9F5] text-xs font-bold uppercase tracking-[0.25em] rounded-xl hover:bg-[#251D33] transition-all duration-300 shadow-md font-sans cursor-pointer border border-[#D4B483]/30"
        >
          Explore Boutique Catalogue
        </button>
      </div>
    );
  }

  const isOutOfStock = product.inStock === false || product.isOutOfStock === true || (product.stock !== undefined && Number(product.stock) <= 0);

  return (
    <div className="min-h-screen bg-[#FBF9F5] font-sans text-[#14111E] selection:bg-[#14111E] selection:text-[#FBF9F5]">

      {/* Exact High Luxury Header Banner (Preserved Hero Breadcrumb Banner) */}
      <div className="relative w-full bg-[#120E15] py-8 pt-[170px] pb-10 border-b border-[#C8A46A]/20 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(200,169,122,0.14),transparent_75%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none opacity-40" />

        <div className="relative z-10 flex items-center justify-center gap-3 text-xs sm:text-sm tracking-[0.25em] font-semibold uppercase text-white/60">
          <Link to="/" className="hover:text-[#C8A46A] transition-colors duration-300">home</Link>
          <span className="text-[#C8A46A]/40">/</span>
          <Link to="/shop" className="hover:text-[#C8A46A] transition-colors duration-300">Shop </Link>
          <span className="text-[#C8A46A]/40">/</span>
          <span className="text-[#C8A46A] font-bold truncate max-w-[200px] sm:max-w-none">{product.name}</span>
        </div>
      </div>

      {/* Main Stage Showcase Container */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-8 lg:py-16 pb-36">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">

          {/* Left Column: $1B High Jewelry Gallery Suite */}
          <div className="lg:col-span-7">
            <div className="lg:sticky lg:top-[120px] space-y-6">

              <div className="flex flex-col-reverse md:flex-row gap-4 lg:gap-5">

                {/* Vertical / Horizontal Swatch Thumbnails */}
                {imageUrls.length > 1 && (
                  <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:max-h-[600px] no-scrollbar py-1 shrink-0">
                    {imageUrls.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImageIndex(i)}
                        className={`w-16 h-20 md:w-20 md:h-26 rounded-2xl overflow-hidden border transition-all duration-300 relative shrink-0 cursor-pointer ${selectedImageIndex === i
                          ? 'border-[#14111E] ring-2 ring-[#C8A46A] shadow-md scale-105'
                          : 'border-[#E5D7C5] opacity-60 hover:opacity-100 hover:border-[#C8A46A]'
                          }`}
                      >
                        <img
                          src={getOptimizedImageUrl(img)}
                          alt={`View ${i + 1}`}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => handleImageError(e, img)}
                          className="w-full h-full object-cover"
                        />
                        {selectedImageIndex === i && (
                          <div className="absolute inset-0 bg-[#C8A46A]/10 pointer-events-none" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Main Showcase Stage Frame */}
                <div className="flex-1 relative">
                  <motion.div
                    className="aspect-[4/5] rounded-3xl overflow-hidden bg-[#F6F2EC] border border-[#E5D7C5]/80 relative group cursor-zoom-in shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-xl transition-all duration-500"
                    initial={{ opacity: 0, scale: 0.99 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => setIsLightboxOpen(true)}
                  >
                    <img
                      src={getOptimizedImageUrl(activeImage)}
                      alt={product.name}
                      style={zoomStyle}
                      onError={(e) => handleImageError(e, activeImage)}
                      className="w-full h-full object-cover transition-transform duration-100 ease-out"
                    />

                    {/* Floating Luxury Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none z-10">
                      {isOutOfStock && (
                        <span className="bg-[#14111E] text-white px-3.5 py-1.5 rounded-full text-[14px] uppercase font-bold tracking-[0.22em] shadow-md border border-[#C8A46A]/30 font-sans flex items-center gap-1.5">
                          SOLD OUT
                        </span>
                      )}
                      {discountPercent > 0 && !isOutOfStock && (
                        <span className="bg-[#14111E] text-[#FBF9F5] px-3.5 py-1.5 rounded-full text-[14px] uppercase font-bold tracking-[0.22em] shadow-md border border-[#C8A46A]/30 font-sans flex items-center gap-1.5">
                          <Sparkles size={11} className="text-[#C8A46A]" /> {discountPercent}% Privilege Savings
                        </span>
                      )}
                      {product.stock <= 5 && product.stock > 0 && (
                        <span className="bg-[#FAF6F0] text-[#8C6D38] border border-[#C8A46A]/40 px-3.5 py-1.5 rounded-full text-[14px] uppercase font-bold tracking-[0.2em] shadow-xs backdrop-blur-md font-sans">
                          Limited Atelier Edition ({product.stock} Left)
                        </span>
                      )}
                      <span className="bg-white/95 text-[#14111E] border border-[#E5D7C5] px-3.5 py-1.5 rounded-full text-[14px] uppercase font-bold tracking-[0.2em] shadow-xs backdrop-blur-md flex items-center gap-1.5 font-sans">
                        <Gem size={11} className="text-[#C8A46A]" /> 100% Anti-Tarnish Lustre
                      </span>
                    </div>

                    {/* Lightbox Zoom Indicator */}
                    <div className="absolute bottom-4 right-4 bg-white/90 text-[#14111E] p-3 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-md cursor-pointer hover:scale-110 border border-[#E5D7C5]">
                      <ZoomIn size={16} />
                    </div>

                    {/* Hover Magnify Hint */}
                    <div className="absolute bottom-4 left-4 bg-[#14111E]/90 text-[#FBF9F5] text-[14px] uppercase tracking-[0.2em] font-semibold px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md pointer-events-none flex items-center gap-2 font-sans border border-[#C8A46A]/30">
                      <Eye size={12} className="text-[#C8A46A]" /> High Precision Magnification
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Concierge Micro Guarantees Strip */}
              <div className="hidden sm:grid sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-white border border-[#E5D7C5] rounded-2xl p-4 flex items-center gap-3.5 shadow-xs hover:border-[#C8A46A] transition-colors">
                  <Package className="text-[#C8A46A] shrink-0" size={22} />
                  <div>
                    <h5 className="text-[14px] font-bold uppercase tracking-[0.18em] text-[#14111E] font-sans">Premium Packaging</h5>
                    <p className="text-xs text-[#786C60] font-serif italic">Velvet Gift Boxed</p>
                  </div>
                </div>

                <div className="bg-white border border-[#E5D7C5] rounded-2xl p-4 flex items-center gap-3.5 shadow-xs hover:border-[#C8A46A] transition-colors">
                  <Truck className="text-[#C8A46A] shrink-0" size={22} />
                  <div>
                    <h5 className="text-[14px] font-bold uppercase tracking-[0.18em] text-[#14111E] font-sans">4–5 Days Delivery</h5>
                    <p className="text-xs text-[#786C60] font-serif italic">Insured Doorstep Transit</p>
                  </div>
                </div>

                <div className="bg-white border border-[#E5D7C5] rounded-2xl p-4 flex items-center gap-3.5 shadow-xs hover:border-[#C8A46A] transition-colors">
                  <RefreshCw className="text-[#C8A46A] shrink-0" size={22} />
                  <div>
                    <h5 className="text-[14px] font-bold uppercase tracking-[0.18em] text-[#14111E] font-sans">15-Day Exchange</h5>
                    <p className="text-xs text-[#786C60] font-serif italic">Concierge Service</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: High Luxury Product Information & Purchase Suite */}
          <div className="lg:col-span-5 space-y-6 sm:space-y-7 bg-white/80 p-4.5 sm:p-6 lg:p-8 rounded-3xl border border-[#E5D7C5]/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] backdrop-blur-sm overflow-hidden">

            {/* Top Toolbar: Category Badge, Origin Tag, Wishlist & Share */}
            <div className="flex items-center justify-between border-b border-[#E5D7C5]/80 pb-5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="bg-[#14111E] text-[#FBF9F5] text-xs font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-xl shadow-xs font-sans">
                  {product.category || "Velouraz Jewellery"}
                </span>
                {(product.inspired_country || product.country) && (
                  <span className="bg-[#FBF9F5] border border-[#E5D7C5] text-[#5A4D41] text-xs font-medium tracking-wider px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs font-sans">
                    {getFlag(product.inspired_country || product.country)} {product.inspired_country || product.country}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleAddToWishlist}
                  disabled={wishlistLoading}
                  className={`w-11 h-11 rounded-full border transition-all duration-300 flex items-center justify-center cursor-pointer ${isInWishlist(product.id)
                    ? 'bg-[#14111E] text-[#FBF9F5] border-[#14111E] shadow-sm scale-105'
                    : 'bg-white text-[#14111E] border-[#E5D7C5] hover:border-[#14111E] hover:bg-[#FBF9F5]'
                    }`}
                  title="Save to Wishlist"
                >
                  {wishlistLoading ? <Loader2 size={18} className="animate-spin" /> : <Heart size={18} fill={isInWishlist(product.id) ? "currentColor" : "none"} />}
                </button>

                <button
                  onClick={handleShare}
                  className="w-11 h-11 rounded-full bg-white border border-[#E5D7C5] text-[#14111E] hover:border-[#14111E] hover:bg-[#FBF9F5] transition-all duration-300 flex items-center justify-center cursor-pointer relative"
                  title="Share Creation"
                >
                  {copiedLink ? <Check size={18} className="text-emerald-700" /> : <Share2 size={18} />}
                  {copiedLink && (
                    <span className="absolute -bottom-10 right-0 bg-[#14111E] text-[#FBF9F5] text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-md shadow-lg whitespace-nowrap font-sans border border-[#C8A46A]/40 z-20">
                      Link Copied!
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Collection Indicator & Masterpiece Title */}
            <div className="space-y-2.5">
              <p className="text-xs uppercase tracking-[0.3em] text-[#C8A46A] font-bold flex items-center gap-2 font-sans">
                <Gem size={14} className="text-[#C8A46A]" /> {product.collectionName || "VELOURAZ HAUTE JOAILLERIE"}
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] text-[#14111E] font-normal leading-[1.16] tracking-tight">
                {product.name}
              </h1>
            </div>

            {/* Verified Collector Endorsement */}
            <div className="flex items-center gap-3.5 flex-wrap">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="#C8A46A" stroke="#C8A46A" />
                ))}
              </div>
              <span className="text-sm font-bold text-[#14111E] font-sans">4.9 / 5.0</span>
              <span className="text-sm text-[#786C60] font-serif italic border-l border-[#E5D7C5] pl-3.5">
                142 Connoisseur Reviews
              </span>
            </div>

            {/* Pricing Suite */}
            <div className="py-6 border-y border-[#E5D7C5]/80 space-y-3">
              <div className="flex items-baseline gap-4 font-sans flex-wrap">
                <span className="font-serif font-normal text-3xl sm:text-4xl lg:text-[44px] text-[#14111E]">
                  ₹{Number(product.price).toLocaleString()}
                </span>
                {product.original_price > product.price && (
                  <span className="font-sans font-normal text-xl text-[#9E9082] line-through">
                    ₹{Number(product.original_price).toLocaleString()}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="bg-[#FAF2E8] text-[#8C6D38] border border-[#C8A46A]/50 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-2xs font-sans">
                    Save {discountPercent}%
                  </span>
                )}
              </div>
            </div>

            {/* Out of Stock & Notify Me Section */}
            {isOutOfStock ? (
              <div className="p-5 bg-rose-50/70 border border-rose-200/80 rounded-2xl space-y-4 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-rose-600 animate-pulse" />
                  <span className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-rose-800">
                    Currently Out of Stock
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-rose-900/80 font-serif italic leading-relaxed">
                  This bespoke creation is currently sold out. Click below to receive priority email or WhatsApp notification when it is restocked.
                </p>
                <button
                  type="button"
                  onClick={() => setIsNotifyModalOpen(true)}
                  className="w-full py-4 px-6 rounded-xl bg-[#2e0e43] text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#14061F] active:scale-[0.99] transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 cursor-pointer font-sans"
                >
                  <Bell size={18} className="text-[#C8A46A] animate-pulse" />
                  <span>Notify Me When Available</span>
                </button>
              </div>
            ) : (
              /* Quantity Selector */
              <div className="flex items-center gap-4 py-2">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#14111E] font-sans">Quantity:</span>
                <div className="flex items-center border border-[#E5D7C5] rounded-xl bg-white overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="px-3.5 py-2 text-[#14111E] hover:bg-[#F6F2EC] font-bold text-sm transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-sm font-bold font-sans text-[#14111E] min-w-[36px] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(prev => Math.min(Number(product.stock || 99), prev + 1))}
                    className="px-3.5 py-2 text-[#14111E] hover:bg-[#F6F2EC] font-bold text-sm transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Delivery Estimator & Product Information */}
            <div className="pt-2 space-y-6">

              {/* Delivery Estimator */}
              {product.stock > 0 && (
                <div className="bg-[#F6F2EC] p-4 sm:p-5 rounded-2xl border border-[#E5D7C5] space-y-3 shadow-2xs overflow-hidden">
                  <label className="text-xs sm:text-sm font-bold uppercase tracking-[0.14em] text-[#14111E] flex items-center gap-2.5 font-sans">
                    <Truck size={17} className="text-[#C8A46A] shrink-0" /> Express Delivery Estimator
                  </label>
                  <form onSubmit={checkDeliveryPincode} className="flex items-center gap-2 sm:gap-2.5">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit Pincode"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="flex-1 min-w-0 px-3.5 sm:px-4 py-3 bg-white border border-[#E5D7C5] rounded-xl text-xs sm:text-sm outline-none focus:border-[#14111E] focus:ring-1 focus:ring-[#14111E] transition-all font-sans placeholder:text-gray-400"
                    />
                    <button type="submit" className="px-4 sm:px-6 py-3 bg-[#14111E] text-[#FBF9F5] text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl hover:bg-[#251D33] transition-colors cursor-pointer font-sans shadow-xs border border-[#C8A46A]/30 shrink-0">
                      Check
                    </button>
                  </form>
                  {pincodeStatus && (
                    <p className={`text-xs sm:text-sm font-serif italic ${pincodeStatus.success ? 'text-emerald-700 font-medium' : 'text-rose-600'}`}>
                      {pincodeStatus.msg}
                    </p>
                  )}
                </div>
              )}

              {/* Creation Story & Description */}
              {(product.product_details || product.description) && (
                <div className="py-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#C8A46A] font-sans">
                    <Sparkles size={14} /> Creation Story & Description
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl text-[#14111E] font-normal leading-snug">
                    Artisanal Inspiration & Aesthetics
                  </h3>
                  <p className="text-sm sm:text-base text-[#6B5E52] leading-relaxed font-serif whitespace-pre-line">
                    {product.product_details || product.description}
                  </p>
                </div>
              )}

              {/* Luxury Accordions */}
              <div className="border-t border-[#E5D7C5]/80 pt-2">
                {[
                  {
                    id: 'details',
                    label: 'Product Details & Technical Specs',
                    content: (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm font-sans py-2">
                        <div className="border-b border-[#F3EBE0] pb-3">
                          <span className="text-[#8C7A6B] uppercase tracking-wider text-xs block font-semibold">SKU / Code</span>
                          <span className="font-bold text-[#14111E] uppercase text-sm mt-0.5 block">{product.sku || product.id.slice(0, 8)}</span>
                        </div>
                        {product.productType && (
                          <div className="border-b border-[#F3EBE0] pb-3">
                            <span className="text-[#8C7A6B] uppercase tracking-wider text-xs block font-semibold">Product Type</span>
                            <span className="font-bold text-[#14111E] text-sm mt-0.5 block">{product.productType}</span>
                          </div>
                        )}
                        {product.color && (
                          <div className="border-b border-[#F3EBE0] pb-3">
                            <span className="text-[#8C7A6B] uppercase tracking-wider text-xs block font-semibold">Color Palette</span>
                            <span className="font-bold text-[#14111E] text-sm mt-0.5 block">{product.color}</span>
                          </div>
                        )}
                        {(product.size || product.size_weight) && (
                          <div className="border-b border-[#F3EBE0] pb-3">
                            <span className="text-[#8C7A6B] uppercase tracking-wider text-xs block font-semibold">Sizing / Fit</span>
                            <span className="font-bold text-[#14111E] text-sm mt-0.5 block">{product.size || product.size_weight}</span>
                          </div>
                        )}
                        <div className="border-b border-[#F3EBE0] pb-3">
                          <span className="text-[#8C7A6B] uppercase tracking-wider text-xs block font-semibold">Stones / Details</span>
                          <span className="font-bold text-[#14111E] text-sm mt-0.5 block">{product.stones || "AAA Cubic Zirconia / Crystals"}</span>
                        </div>
                        {(product.inspired_country || product.country) && (
                          <div className="border-b border-[#F3EBE0] pb-3">
                            <span className="text-[#8C7A6B] uppercase tracking-wider text-xs block font-semibold">Country Collection</span>
                            <span className="font-bold text-[#14111E] text-sm mt-0.5 block">{product.inspired_country || product.country}</span>
                          </div>
                        )}
                        <div className="border-b border-[#F3EBE0] pb-3">
                          <span className="text-[#8C7A6B] uppercase tracking-wider text-xs block font-semibold">Finish</span>
                          <span className="font-bold text-[#14111E] text-sm mt-0.5 block">High-Lustre Anti-Tarnish Finish</span>
                        </div>
                      </div>
                    )
                  },
                  {
                    id: 'craftsmanship',
                    label: 'Artisanal Craftsmanship & Quality',
                    content: (
                      <p className="text-sm text-[#6B5E52] leading-relaxed font-serif italic py-1">
                        Handcrafted by master artisans combining lost-wax casting methods with high-precision micro-pavé gemstone setting techniques. Every piece undergoes rigorous quality testing for optical brilliance, anti-tarnish durability, and skin safety.
                      </p>
                    )
                  },
                  {
                    id: 'shipping',
                    label: 'Shipping, Delivery & Packaging',
                    content: (
                      <p className="text-sm text-[#6B5E52] leading-relaxed font-serif italic py-1">
                        {product.shipping || "Dispatched within 1–2 business days. Includes insured doorstep shipping across India. Hand-packed in Velouraz luxury box with authenticity certificate."}
                      </p>
                    )
                  },
                  {
                    id: 'care',
                    label: 'Jewellery Care & Preservation Guide',
                    content: (
                      <ul className="space-y-2.5 text-sm text-[#6B5E52] font-serif py-1">
                        {product.care_instructions ? (
                          <li className="flex items-start gap-2.5"><Sparkles size={15} className="text-[#C8A46A] shrink-0 mt-0.5" /> <span>{product.care_instructions}</span></li>
                        ) : (
                          <>
                            <li className="flex items-start gap-2.5"><Sparkles size={15} className="text-[#C8A46A] shrink-0 mt-0.5" /> <span>Store in a dry, velvet-lined Velouraz box or pouch.</span></li>
                            <li className="flex items-start gap-2.5"><Sparkles size={15} className="text-[#C8A46A] shrink-0 mt-0.5" /> <span>Apply perfumes, lotions and cosmetics prior to wearing jewellery.</span></li>
                            <li className="flex items-start gap-2.5"><Sparkles size={15} className="text-[#C8A46A] shrink-0 mt-0.5" /> <span>Clean gently with a soft microfiber polishing cloth after use.</span></li>
                          </>
                        )}
                      </ul>
                    )
                  }
                ].map((tab) => (
                  <div key={tab.id} className="border-b border-[#E5D7C5]">
                    <button
                      onClick={() => setActiveTab(activeTab === tab.id ? '' : tab.id)}
                      className="w-full py-5 flex items-center justify-between text-left cursor-pointer group"
                    >
                      <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.18em] text-[#14111E] group-hover:text-[#C8A46A] transition-colors font-sans">{tab.label}</span>
                      <ChevronRight size={18} className={`text-[#14111E] transition-transform duration-300 ${activeTab === tab.id ? 'rotate-90 text-[#C8A46A]' : ''}`} />
                    </button>
                    {activeTab === tab.id && (
                      <div className="pb-6 pt-1">
                        {tab.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </div>

          </div>
        </div>

        {/* ── Smart Recommendations ── */}
        {(relatedLoading || relatedProducts.length > 0 || sameCountryProducts.length > 0) && (
          <div className="mt-24 pt-14 border-t border-[#E5D7C5] space-y-20">

            {/* ── Similar Pieces (Same Category) ── */}
            {(relatedLoading || relatedProducts.length > 0) && (
              <div>
                <div className="mb-8 flex items-end justify-between">
                  <div>
                    <span className="text-[14px] uppercase tracking-[0.35em] text-[#C8A46A] font-bold font-sans flex items-center gap-1.5">
                      <Sparkles size={11} /> Similar Pieces
                    </span>
                    <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[#14111E] mt-1">
                      You May Also Like
                    </h3>
                  </div>
                  <Link
                    to={`/shop${product?.category ? `?category=${encodeURIComponent(product.category)}` : ''}`}
                    className="hidden sm:flex items-center gap-1.5 text-[14px] font-bold uppercase tracking-[0.2em] text-[#C8A46A] hover:text-[#14111E] transition-colors font-sans"
                  >
                    View All <ArrowRight size={13} />
                  </Link>
                </div>

                {/* Skeleton */}
                {relatedLoading && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="rounded-xl border border-[#E5D7C5] bg-white overflow-hidden animate-pulse">
                        <div className="aspect-square bg-[#F0E9E0]" />
                        <div className="p-3 space-y-2">
                          <div className="h-2 w-3/4 bg-[#EBE3D8] rounded-full" />
                          <div className="h-2.5 w-1/2 bg-[#E5D7C5] rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Cards */}
                {!relatedLoading && relatedProducts.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                    {relatedProducts.map((rel) => (
                      <div
                        key={rel.id}
                        onClick={() => navigate(`/product/${rel.id}`)}
                        className="group bg-white rounded-xl border border-[#E5D7C5] overflow-hidden cursor-pointer shadow-xs hover:shadow-lg hover:border-[#C8A46A] transition-all duration-400 flex flex-col"
                      >
                        <div className="aspect-square bg-[#F6F2EC] overflow-hidden relative">
                          <img
                            src={rel.image || rel.images?.[0] || '/img/jewellery/j.png'}
                            alt={rel.name}
                            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-600"
                          />
                          {rel.original_price > rel.price && (
                            <span className="absolute top-2 left-2 bg-[#14111E] text-[#FBF9F5] text-[14px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full font-sans">
                              -{Math.round(((rel.original_price - rel.price) / rel.original_price) * 100)}%
                            </span>
                          )}
                          {rel.badge && (
                            <span className="absolute bottom-2 left-2 bg-[#2E0E43]/90 text-white text-[14px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full font-sans">
                              {rel.badge}
                            </span>
                          )}
                        </div>
                        <div className="p-2.5 sm:p-3 flex flex-col gap-0.5">
                          <span className="text-[14px] uppercase tracking-[0.2em] font-semibold text-[#C8A46A] font-sans truncate">
                            {rel.category || 'Velouraz'}
                          </span>
                          <h4 className="font-serif text-[14px] font-normal text-[#14111E] group-hover:text-[#C8A46A] transition-colors line-clamp-1 leading-snug">
                            {rel.name}
                          </h4>
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-[14px] font-bold text-[#14111E] font-sans">₹{Number(rel.price).toLocaleString()}</span>
                            {rel.original_price > rel.price && (
                              <span className="text-[14px] text-[#9E9082] line-through font-sans">₹{Number(rel.original_price).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!relatedLoading && relatedProducts.length === 0 && (
                  <p className="text-xs text-[#786C60] font-serif italic">No similar pieces found.</p>
                )}
              </div>
            )}

            {/* ── Same Country ── */}
            {(relatedLoading || sameCountryProducts.length > 0) && (
              <div>
                <div className="mb-8 flex items-end justify-between">
                  <div>
                    <span className="text-[14px] uppercase tracking-[0.35em] text-[#C8A46A] font-bold font-sans flex items-center gap-1.5">
                      <Compass size={11} /> Same Origin
                    </span>
                    <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[#14111E] mt-1">
                      More from {product?.inspired_country || product?.country || 'This Region'}
                    </h3>
                  </div>
                  <Link
                    to={`/shop${product?.inspired_country || product?.country ? `?country=${encodeURIComponent(product.inspired_country || product.country)}` : ''}`}
                    className="hidden sm:flex items-center gap-1.5 text-[14px] font-bold uppercase tracking-[0.2em] text-[#C8A46A] hover:text-[#14111E] transition-colors font-sans"
                  >
                    View All <ArrowRight size={13} />
                  </Link>
                </div>

                {/* Skeleton */}
                {relatedLoading && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="rounded-xl border border-[#E5D7C5] bg-white overflow-hidden animate-pulse">
                        <div className="aspect-square bg-[#F0E9E0]" />
                        <div className="p-3 space-y-2">
                          <div className="h-2 w-3/4 bg-[#EBE3D8] rounded-full" />
                          <div className="h-2.5 w-1/2 bg-[#E5D7C5] rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Cards */}
                {!relatedLoading && sameCountryProducts.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                    {sameCountryProducts.map((rel) => (
                      <div
                        key={rel.id}
                        onClick={() => navigate(`/product/${rel.id}`)}
                        className="group bg-white rounded-xl border border-[#E5D7C5] overflow-hidden cursor-pointer shadow-xs hover:shadow-lg hover:border-[#C8A46A] transition-all duration-400 flex flex-col"
                      >
                        <div className="aspect-square bg-[#F6F2EC] overflow-hidden relative">
                          <img
                            src={rel.image || rel.images?.[0] || '/img/jewellery/j.png'}
                            alt={rel.name}
                            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-600"
                          />
                          {rel.original_price > rel.price && (
                            <span className="absolute top-2 left-2 bg-[#14111E] text-[#FBF9F5] text-[14px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full font-sans">
                              -{Math.round(((rel.original_price - rel.price) / rel.original_price) * 100)}%
                            </span>
                          )}
                          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm border border-[#E5DBCC] px-2 py-0.5 rounded-full">
                            <span className="text-[14px] font-bold text-[#8C6D37] uppercase tracking-wider">
                              {getFlag(rel.inspired_country || rel.country)} {(rel.inspired_country || rel.country || '').split(' ')[0]}
                            </span>
                          </div>
                        </div>
                        <div className="p-2.5 sm:p-3 flex flex-col gap-0.5">
                          <span className="text-[14px] uppercase tracking-[0.2em] font-semibold text-[#C8A46A] font-sans truncate">
                            {rel.category || 'Velouraz'}
                          </span>
                          <h4 className="font-serif text-[14px] font-normal text-[#14111E] group-hover:text-[#C8A46A] transition-colors line-clamp-1 leading-snug">
                            {rel.name}
                          </h4>
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-[14px] font-bold text-[#14111E] font-sans">₹{Number(rel.price).toLocaleString()}</span>
                            {rel.original_price > rel.price && (
                              <span className="text-[14px] text-[#9E9082] line-through font-sans">₹{Number(rel.original_price).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>

      {/* Floating Pill Sticky Action Bottom Bar (Mobile & Desktop) */}
      <div className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-[120] w-[94%] sm:w-auto max-w-2xl lg:max-w-3xl rounded-2xl sm:rounded-3xl bg-[#FAF8F5]/95 backdrop-blur-2xl border border-[#E5D7C5] shadow-[0_14px_40px_rgba(0,0,0,0.16)] p-2.5 sm:p-3 px-4 sm:px-6 transition-all duration-300">
        <div className="flex items-center justify-between gap-4 sm:gap-6">

          {/* Left: Product Thumbnail, Title & Price (Hidden on Mobile View) */}
          <div className="hidden sm:flex items-center gap-3 min-w-0">
            <div className="hidden sm:block w-10 h-12 rounded-xl overflow-hidden bg-[#F6F2EC] border border-[#E5D7C5] shrink-0">
              <img
                src={getOptimizedImageUrl(activeImage)}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 space-y-0.5">
              <h4 className="hidden md:block font-serif text-xs sm:text-sm text-[#14111E] font-medium truncate max-w-[180px]">
                {product.name}
              </h4>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-lg sm:text-xl text-[#14111E] font-normal leading-none">
                  ₹{Number(product.price).toLocaleString()}
                </span>
                {product.original_price > product.price && (
                  <span className="hidden sm:inline text-xs text-[#9E9082] line-through font-sans">
                    ₹{Number(product.original_price).toLocaleString()}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="text-[14px] sm:text-[14px] text-[#8C6D38] font-bold uppercase tracking-wider bg-[#FAF2E8] border border-[#C8A46A]/40 px-2 py-0.5 rounded-full font-sans">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Add to Bag & Buy Now Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-1 sm:flex-initial">
            {isOutOfStock ? (
              <button
                type="button"
                onClick={() => setIsNotifyModalOpen(true)}
                className="flex-1 sm:flex-initial sm:min-w-[220px] min-h-[44px] sm:min-h-[48px] py-2.5 px-4 sm:px-6 rounded-xl text-xs sm:text-xs font-bold uppercase tracking-[0.14em] flex items-center justify-center gap-2 shadow-md font-sans transition-all duration-300 cursor-pointer bg-[#2e0e43] text-white hover:bg-[#1A0829] border border-[#C8A46A]/40"
              >
                <Bell size={15} className="shrink-0 text-[#C8A46A]" />
                <span className="truncate">Notify Me When Restocked</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleAddToCart}
                  disabled={cartLoading}
                  className={`flex-1 sm:flex-initial sm:min-w-[140px] min-h-[44px] sm:min-h-[48px] py-2.5 px-3.5 sm:px-5 rounded-xl text-xs sm:text-xs font-bold uppercase tracking-[0.14em] flex items-center justify-center gap-2 shadow-md font-sans transition-all duration-300 cursor-pointer ${isInCart(product.id)
                    ? 'bg-[#14111E] text-[#FBF9F5] hover:bg-[#251D33] active:scale-[0.98] border border-[#C8A46A]/30'
                    : 'bg-[#14111E] text-[#FBF9F5] hover:bg-[#251D33] active:scale-[0.98] border border-[#C8A46A]/30'
                    }`}
                >
                  {cartLoading ? (
                    <Loader2 size={15} className="animate-spin shrink-0" />
                  ) : (
                    <ShoppingBag size={15} className="shrink-0 text-[#C8A46A]" />
                  )}
                  <span className="truncate">{isInCart(product.id) ? 'Added' : 'Add to Bag'}</span>
                </button>

                <button
                  onClick={handleBuyNow}
                  className="flex-1 sm:flex-initial sm:min-w-[120px] min-h-[44px] sm:min-h-[48px] py-2.5 px-3.5 sm:px-5 rounded-xl text-xs sm:text-xs font-bold uppercase tracking-[0.14em] flex items-center justify-center gap-1.5 shadow-sm font-sans transition-all duration-300 cursor-pointer border-2 border-[#14111E] bg-white text-[#14111E] hover:bg-[#14111E] hover:text-[#FBF9F5] active:scale-[0.98] font-bold"
                >
                  <span className="truncate">Buy Now</span>
                </button>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Back In Stock Notification Request Modal */}
      <NotifyMeModal
        isOpen={isNotifyModalOpen}
        onClose={() => setIsNotifyModalOpen(false)}
        product={product}
      />

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLightboxOpen(false)}
              className="absolute inset-0 bg-[#0B0711]/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 max-w-4xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl p-2 border border-[#E5D7C5]"
            >
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-[#14111E] flex items-center justify-center shadow-md cursor-pointer border border-[#E5D7C5]"
              >
                <X size={18} />
              </button>
              <img
                src={activeImage}
                alt={product.name}
                className="w-full max-h-[85vh] object-contain rounded-2xl"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add To Cart Confirmation Popup Modal */}
      <AddToCartModal
        isOpen={isAddToCartModalOpen}
        onClose={() => setIsAddToCartModalOpen(false)}
        product={product}
      />

    </div>
  );
};

export default ProductDetail;