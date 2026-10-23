import React, { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { db } from "./Firebase";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import {
  Heart,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  Loader2,
  Sparkles,
  ShieldCheck,
  Truck,
  Gift,
  ArrowRight,
  Lock,
  Gem,
  CheckCircle2,
  Filter,
  Check,
  Bell
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../hooks/useStore";
import Breadcrumb from "./Breadcrumb";
import { getOptimizedImageUrl, handleImageError } from "../config/cloudinary";
import NotifyMeModal from "./NotifyMeModal";

const Wishlist = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToCart, cartCount } = useStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all' | 'inStock'
  const [movingItems, setMovingItems] = useState({});
  const [movingAll, setMovingAll] = useState(false);
  const [notifyProduct, setNotifyProduct] = useState(null);

  const isItemOutOfStock = (item) => {
    if (item.inStock === false) return true;
    if (item.isOutOfStock === true) return true;
    if (item.stock !== undefined && item.stock !== null) {
      return Number(item.stock) <= 0;
    }
    return false;
  };

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const snap = await getDocs(collection(db, "users", user.uid, "wishlist"));
        const rawList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Fetch live product stock from Firestore
        const productSnap = await getDocs(collection(db, "products"));
        const productMap = {};
        productSnap.docs.forEach((d) => { productMap[d.id] = d.data(); });

        const updatedList = rawList.map((item) => {
          const live = productMap[item.id];
          if (live) {
            return {
              ...item,
              stock: live.stock !== undefined ? live.stock : item.stock,
              inStock: live.inStock !== undefined ? live.inStock : item.inStock,
              isOutOfStock: live.isOutOfStock !== undefined ? live.isOutOfStock : item.isOutOfStock,
              price: live.price !== undefined ? live.price : item.price,
            };
          }
          return item;
        });

        setItems(updatedList);
      } catch (error) {
        console.error("Error loading wishlist:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const removeItem = async (id) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "wishlist", id));
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const moveToCart = async (item) => {
    if (!user) return;
    if (isItemOutOfStock(item)) {
      setNotifyProduct(item);
      return;
    }
    setMovingItems(prev => ({ ...prev, [item.id]: true }));
    try {
      const success = await addToCart(item);
      if (success) {
        await removeItem(item.id);
      }
    } catch (error) {
      console.error("Error moving to cart:", error);
    } finally {
      setMovingItems(prev => ({ ...prev, [item.id]: false }));
    }
  };

  const handleMoveAllToCart = async () => {
    if (!user || items.length === 0) return;
    setMovingAll(true);
    try {
      const inStockItems = items.filter(item => !isItemOutOfStock(item));
      for (const item of inStockItems) {
        const success = await addToCart(item);
        if (success) {
          await deleteDoc(doc(db, "users", user.uid, "wishlist", item.id));
        }
      }
      setItems(prev => prev.filter(i => isItemOutOfStock(i)));
    } catch (err) {
      console.error("Error moving all to cart:", err);
    } finally {
      setMovingAll(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F4EF] flex items-center justify-center">
        <div className="relative flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#2e0e43]"></div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#2e0e43]">Loading Private Collection</p>
        </div>
      </div>
    );
  }

  const inStockItems = items.filter(i => !isItemOutOfStock(i));
  const displayedItems = filter === "inStock" ? inStockItems : items;

  return (
    <div className="min-h-screen bg-[#F8F4EF] font-sans text-[#2A2623]">

      {/* Hero Breadcrumb */}
      <Breadcrumb
        title="My Private Collection"
        subtitle="A curated editorial gallery of bespoke high jewellery, saved for your next celebration."
        bgImage="https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&q=80&w=1600"
        links={[
          { name: 'Home', href: '/' },
          { name: 'Shop', href: '/shop' },
          { name: 'Wishlist', href: '/wishlist', active: true }
        ]}
      />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10 pb-28">

        {/* Top Atelier Header Suite */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-[#D8CBBE]/40">

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-sans font-semibold uppercase tracking-[0.25em] text-[#C8A46A]">
                ✦ Velouraz Private Selection ✦
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-serif text-[#2e0e43] font-normal tracking-tight flex items-center gap-2.5">
              My Wishlist Gallery
              <span className="text-xs sm:text-sm text-[#7B6D63] font-sans font-normal bg-[#2e0e43]/5 border border-[#2e0e43]/10 px-2.5 py-0.5 rounded-full">
                {items.length} {items.length === 1 ? 'Piece' : 'Pieces'}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-[#7B6D63] font-serif leading-relaxed max-w-xl">
              Your personal gallery of handcrafted masterpieces saved for acquisition.
            </p>
          </div>

          {/* Action Suite Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            {items.length > 0 && inStockItems.length > 0 && (
              <button
                onClick={handleMoveAllToCart}
                disabled={movingAll}
                className="px-4 py-2.5 rounded-xl bg-[#2e0e43] text-white text-xs font-semibold uppercase tracking-[0.18em] hover:bg-[#1A0829] active:scale-[0.99] transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer font-sans"
              >
                {movingAll ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ShoppingBag size={14} className="text-[#C8A46A]" />
                )}
                <span>{movingAll ? "Moving..." : "Move All to Bag"}</span>
              </button>
            )}

            <Link
              to="/cart"
              className="px-3.5 py-2.5 rounded-xl bg-white border border-[#D8CBBE] text-[#2e0e43] hover:border-[#2e0e43] hover:bg-[#FDFAF5] text-xs font-semibold uppercase tracking-[0.18em] transition-all duration-300 shadow-2xs flex items-center gap-1.5 font-sans"
            >
              <ShoppingBag size={14} className="text-[#C8A46A]" />
              <span>Bag ({cartCount})</span>
            </Link>

            <Link
              to="/shop"
              className="px-3.5 py-2.5 rounded-xl bg-transparent border border-[#D8CBBE] text-[#7B6D63] hover:text-[#2A2623] hover:border-[#2A2623] text-xs font-semibold uppercase tracking-[0.18em] transition-all duration-300 flex items-center gap-1.5 font-sans"
            >
              <ArrowLeft size={14} />
              <span>Boutique</span>
            </Link>
          </div>

        </div>

        {/* Filter Pills Bar */}
        {items.length > 0 && (
          <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${filter === "all"
                  ? "bg-[#2e0e43] text-white shadow-xs"
                  : "bg-white text-[#7B6D63] border border-[#D8CBBE]/60 hover:border-[#2e0e43]"
                  }`}
              >
                All Saved ({items.length})
              </button>
              <button
                onClick={() => setFilter("inStock")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${filter === "inStock"
                  ? "bg-[#2e0e43] text-white shadow-xs"
                  : "bg-white text-[#7B6D63] border border-[#D8CBBE]/60 hover:border-[#2e0e43]"
                  }`}
              >
                In Stock ({inStockItems.length})
              </button>
            </div>

            <p className="text-xs font-serif text-[#7B6D63] italic hidden sm:block">
              Showing {displayedItems.length} of {items.length} saved creations
            </p>
          </div>
        )}

        {/* Main Wishlist Gallery */}
        {items.length === 0 ? (
          /* Empty Gallery State */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-16 sm:py-24 px-6 rounded-3xl bg-white border border-[#D8CBBE]/50 shadow-sm text-center max-w-lg mx-auto space-y-5"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#F4EEE8] border border-[#C8A46A]/40 flex items-center justify-center mx-auto shadow-inner">
              <Heart size={32} className="text-[#2e0e43]" strokeWidth={1.5} />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs uppercase font-semibold tracking-[0.25em] text-[#C8A46A] block">
                Gallery Empty
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#2e0e43] font-normal">
                Your Private Gallery is Empty
              </h2>
              <p className="text-xs sm:text-sm text-[#7B6D63] font-serif leading-relaxed max-w-md mx-auto">
                Discover our high-jewellery catalog and curate your personal collection of timeless treasures.
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center gap-2 bg-[#2e0e43] text-white px-7 py-3 rounded-xl text-xs font-semibold uppercase tracking-[0.2em] hover:bg-[#1A0829] transition-all duration-300 shadow-md hover:shadow-lg font-sans"
              >
                <span>Explore Boutique</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        ) : (
          /* Editorial High-Jewellery Product Gallery Grid (2 COLUMNS ON MOBILE!) */
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
              {displayedItems.map((item, idx) => {
                const isOutOfStock = isItemOutOfStock(item);
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.03 }}
                    key={item.id}
                    className="bg-white border border-[#D8CBBE]/50 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-xs hover:shadow-xl hover:border-[#C8A46A] transition-all duration-300 flex flex-col justify-between group relative"
                  >
                    <div>
                      {/* Image Showcase Container */}
                      <div className="aspect-[4/5] rounded-xl sm:rounded-2xl overflow-hidden bg-[#F4EEE8] relative mb-3 sm:mb-4 border border-[#D8CBBE]/30">
                        <img
                          src={getOptimizedImageUrl(item.image)}
                          alt={item.name}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => handleImageError(e, item.image)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-[#2A2623]/0 group-hover:bg-[#2A2623]/5 transition-colors duration-300" />

                        {/* Top-Left Saved Badge */}
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-white/90 backdrop-blur-md border border-[#C8A46A]/40 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full flex items-center gap-1 shadow-2xs">
                          <Heart size={10} className="text-[#C8A46A] fill-[#C8A46A]" />
                          <span className="text-[14px] sm:text-[14px] font-semibold uppercase tracking-wider text-[#2e0e43] font-sans">Saved</span>
                        </div>

                        {/* Top-Right Trash Action Button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                          className="absolute top-2 right-2 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 bg-white/90 backdrop-blur-md border border-[#D8CBBE]/60 rounded-full flex items-center justify-center text-[#7B6D63] hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-all shadow-2xs"
                          title="Remove from wishlist"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Item Information */}
                      <div className="space-y-1 sm:space-y-2 px-0.5">

                        {/* Brand Tag */}
                        <span className="text-[14px] sm:text-[14px] font-sans font-semibold uppercase tracking-[0.2em] text-[#C8A46A] block truncate">
                          {item.brand || "Velouraz High Jewellery"}
                        </span>

                        {/* Product Title */}
                        <Link
                          to={`/product/${item.id}`}
                          className="text-xs sm:text-base font-serif text-[#2A2623] hover:text-[#2e0e43] transition-colors leading-snug font-normal line-clamp-1 sm:line-clamp-2 block"
                        >
                          {item.name}
                        </Link>

                        {/* Price & Stock Pill */}
                        <div className="flex flex-wrap items-center justify-between gap-1 pt-0.5">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm sm:text-base font-normal text-[#2e0e43] font-sans">
                              ₹{Number(item.price || 0).toLocaleString()}
                            </span>
                            {Number(item.original_price) > Number(item.price) && (
                              <span className="text-[14px] sm:text-xs text-[#7B6D63]/50 line-through font-sans hidden sm:inline-block">
                                ₹{Number(item.original_price).toLocaleString()}
                              </span>
                            )}
                          </div>

                          <span className={`text-[14px] sm:text-[14px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${isOutOfStock ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}>
                            {isOutOfStock ? "Out of Stock" : "In Stock"}
                          </span>
                        </div>

                      </div>
                    </div>

                    {/* Card Bottom CTA Button */}
                    <div className="pt-3 mt-1">
                      {isOutOfStock ? (
                        <button
                          onClick={() => setNotifyProduct(item)}
                          className="w-full py-2.5 sm:py-3 px-3 rounded-xl text-[14px] sm:text-xs font-semibold uppercase tracking-[0.18em] flex items-center justify-center gap-1.5 transition-all duration-300 shadow-2xs bg-[#2e0e43] text-white hover:bg-[#1A0829] active:scale-[0.99] hover:shadow-md cursor-pointer border border-[#C8A46A]/40"
                        >
                          <Bell size={13} className="shrink-0 text-[#C8A46A] animate-pulse" />
                          <span>Notify Me</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => moveToCart(item)}
                          disabled={movingItems[item.id]}
                          className="w-full py-2.5 sm:py-3 px-3 rounded-xl text-[14px] sm:text-xs font-semibold uppercase tracking-[0.18em] flex items-center justify-center gap-1.5 transition-all duration-300 shadow-2xs bg-[#2e0e43] text-white hover:bg-[#1A0829] active:scale-[0.99] hover:shadow-md cursor-pointer font-sans"
                        >
                          {movingItems[item.id] ? (
                            <Loader2 size={13} className="animate-spin shrink-0" />
                          ) : (
                            <ShoppingBag size={13} className="shrink-0 text-[#C8A46A]" />
                          )}
                          <span>{movingItems[item.id] ? "Moving..." : "Move to Bag"}</span>
                        </button>
                      )}
                    </div>

                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}

        {/* Back in stock notification modal for wishlist items */}
        <NotifyMeModal
          isOpen={!!notifyProduct}
          onClose={() => setNotifyProduct(null)}
          product={notifyProduct}
        />

      </div>
    </div>
  );
};

export default Wishlist;
