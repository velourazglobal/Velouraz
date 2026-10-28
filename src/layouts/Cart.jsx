import React, { useEffect, useState } from "react";
import { db } from "../components/Firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Trash2,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Minus,
  Plus,
  CheckCircle2,
  AlertCircle,
  Tag,
  ChevronRight,
  Gift,
  Lock,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Package
} from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";
import { useStore } from "../hooks/useStore";
import { useAuth } from "../components/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { getOptimizedImageUrl, handleImageError } from "../config/cloudinary";

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, updateCartQuantity, removeFromCart } = useStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveStocks, setLiveStocks] = useState({});

  // Gift note state
  const [showGiftNote, setShowGiftNote] = useState(false);
  const [giftNoteText, setGiftNoteText] = useState("");
  const [savedGiftNote, setSavedGiftNote] = useState("");

  useEffect(() => {
    setItems(cartItems);

    if (cartItems.length === 0) {
      setLoading(false);
      setLiveStocks({});
      return undefined;
    }

    const unsubs = [];
    cartItems.forEach((item) => {
      if (!item.id || item.id.startsWith('bs-')) return;
      const pRef = doc(db, "products", item.id);
      const unsub = onSnapshot(pRef, async (snap) => {
        if (snap.exists()) {
          const actualStock = Number(snap.data().stock || 0);
          setLiveStocks((prev) => ({ ...prev, [item.id]: actualStock }));
          if (actualStock <= 0) {
            await removeFromCart(item.id);
          } else if (item.quantity > actualStock) {
            await updateCartQuantity(item.id, actualStock);
          }
        }
      }, (err) => {
        console.error("Live stock subscription error for item", item.id, err);
      });
      unsubs.push(unsub);
    });

    setLoading(false);

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [cartItems, updateCartQuantity, removeFromCart]);

  const removeItem = async (id) => {
    await removeFromCart(id);
  };

  const subtotal = items.reduce((sum, i) => sum + (Number(i.price) * (i.quantity || 1)), 0);
  const originalTotal = items.reduce((sum, i) => sum + (Number(i.original_price || i.price) * (i.quantity || 1)), 0);
  const productSavings = originalTotal - subtotal;
  const itemCount = items.reduce((sum, i) => sum + (i.quantity || 1), 0);

  const handleSaveGiftNote = () => {
    setSavedGiftNote(giftNoteText);
    setShowGiftNote(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#C8A46A]"></div>
      </div>
    );
  }

  const total = subtotal;

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-[#2A2623]">

      {/* Hero Breadcrumb */}
      <Breadcrumb
        title="Shopping Cart"
        subtitle="Review your curated high-jewellery items before checkout"
        bgImage="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1600"
        links={[
          { name: 'Home', href: '/' },
          { name: 'Shop', href: '/shop' },
          { name: 'Cart', href: '/cart', active: true }
        ]}
      />

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10 pb-32 lg:pb-24">

        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#E8DFD5]">
          <div>
            <h1 className="text-xl sm:text-3xl font-serif text-[#2e0e43] font-normal tracking-tight flex items-center gap-2.5">
              Your Selection
              <span className="text-[14px] sm:text-xs font-sans font-normal text-[#C8A46A] bg-[#FAF6F0] border border-[#C8A46A]/30 px-2.5 py-0.5 rounded-full tracking-wider uppercase">
                {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-[#7B6D63] mt-0.5 font-serif">
              Handcrafted elegance, curated for your private collection
            </p>
          </div>

          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] font-semibold text-[#2e0e43] hover:text-[#C8A46A] transition-colors duration-300 group self-start sm:self-auto"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Continue Shopping
          </Link>
        </div>

        {items.length === 0 ? (
          /* Empty Cart State */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-16 sm:py-20 px-6 rounded-3xl bg-white border border-[#E8DFD5] shadow-sm text-center max-w-lg mx-auto"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FAF6F0] border border-[#C8A46A]/40 flex items-center justify-center mx-auto mb-5 shadow-inner">
              <ShoppingBag size={28} className="text-[#C8A46A]" strokeWidth={1.5} />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#2e0e43] mb-2 font-normal">Your cart is empty</h2>
            <p className="text-xs sm:text-sm text-[#7B6D63] mb-6 leading-relaxed max-w-md mx-auto font-serif">
              Your personal high-jewellery bag is waiting. Discover our bespoke collections and curate your style.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-2 bg-[#2e0e43] text-white px-7 py-3.5 rounded-xl text-xs font-semibold uppercase tracking-[0.2em] hover:bg-[#C8A46A] transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Explore Collection
              <ArrowRight size={14} />
            </Link>
          </motion.div>
        ) : (
          /* Main 2-Column Cart Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">

            {/* Left Column: Cart Items + Trust Bar + Assurance Banner */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4 sm:space-y-6">

              {/* Item Cards List */}
              <div className="space-y-3 sm:space-y-4">
                <AnimatePresence mode="popLayout">
                  {items.map((item) => {
                    const unitPrice = Number(item.price);
                    const originalPrice = Number(item.original_price || item.price);
                    const itemSavings = originalPrice > unitPrice ? (originalPrice - unitPrice) * (item.quantity || 1) : 0;

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        key={item.id}
                        className="p-3.5 sm:p-5 rounded-2xl bg-white border border-[#E8DFD5] shadow-[0_2px_14px_rgba(0,0,0,0.02)] hover:border-[#C8A46A]/40 transition-all duration-300 relative overflow-hidden group"
                      >
                        {/* Top subtle golden gradient hairline */}
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C8A46A]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex gap-3.5 sm:gap-5 items-center">

                          {/* Product Image */}
                          <Link
                            to={`/product/${item.id}`}
                            className="w-20 h-24 sm:w-28 sm:h-32 rounded-xl overflow-hidden bg-[#FAF6F0] flex-shrink-0 border border-[#E8DFD5] group/img relative"
                          >
                            <img
                              src={getOptimizedImageUrl(item.image)}
                              alt={item.name}
                              loading="lazy"
                              decoding="async"
                              onError={(e) => handleImageError(e, item.image)}
                              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                            />
                          </Link>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <span className="text-[14px] sm:text-[14px] font-sans font-semibold uppercase tracking-[0.2em] text-[#C8A46A] block">
                                  Velouraz Jewellery
                                </span>
                                <Link
                                  to={`/product/${item.id}`}
                                  className="text-sm sm:text-base font-serif text-[#2e0e43] hover:text-[#C8A46A] transition-colors leading-tight font-normal truncate block mt-0.5"
                                >
                                  {item.name}
                                </Link>
                              </div>

                              {/* Remove Button for Desktop & Mobile */}
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-[#7B6D63]/60 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors shrink-0"
                                title="Remove item"
                                aria-label="Remove item"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            {/* Variant / Size info if present */}
                            {(item.size || item.metal || item.color) && (
                              <p className="text-[14px] sm:text-xs text-[#7B6D63] font-sans flex items-center gap-2">
                                {item.size && <span>Size: <strong className="text-[#2A2623] font-normal">{item.size}</strong></span>}
                                {item.metal && <span>Metal: <strong className="text-[#2A2623] font-normal">{item.metal}</strong></span>}
                              </p>
                            )}

                            {/* Price Tag & Quantity Row */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-[#F5EFE8]">

                              {/* Price display */}
                              <div className="flex items-baseline gap-2">
                                <span className="text-base sm:text-lg font-normal text-[#2e0e43] font-sans tracking-tight">
                                  ₹{unitPrice.toLocaleString()}
                                </span>
                                {originalPrice > unitPrice && (
                                  <span className="text-xs font-normal text-[#7B6D63]/50 line-through font-sans">
                                    ₹{originalPrice.toLocaleString()}
                                  </span>
                                )}
                                {itemSavings > 0 && (
                                  <span className="text-[14px] font-normal px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/50 font-sans hidden sm:inline-block">
                                    Save ₹{itemSavings.toLocaleString()}
                                  </span>
                                )}
                              </div>

                              {/* Quantity Selector */}
                              <div className="flex items-center border border-[#E8DFD5] rounded-lg overflow-hidden bg-[#FAF6F0]/80 shadow-xs">
                                <button
                                  onClick={() => updateCartQuantity(item.id, (item.quantity || 1) - 1)}
                                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[#2A2623] hover:bg-[#E8DFD5] active:bg-[#D8CBBE] transition-colors"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="w-7 sm:w-8 text-center font-normal text-[#2A2623] text-xs sm:text-sm font-sans">
                                  {item.quantity || 1}
                                </span>
                                <button
                                  onClick={() => updateCartQuantity(item.id, (item.quantity || 1) + 1)}
                                  disabled={(item.quantity || 1) >= Math.min(10, liveStocks[item.id] ?? item.stock ?? 1)}
                                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[#2A2623] hover:bg-[#E8DFD5] active:bg-[#D8CBBE] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>

                            </div>

                          </div>

                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Trust Highlights Suite Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8DFD5] shadow-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">

                  {/* Premium Packaging */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#FAF6F0] border border-[#C8A46A]/30 flex items-center justify-center text-[#C8A46A] shrink-0 shadow-inner">
                      <Package size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#2A2623] font-sans">Premium Packaging</h4>
                      <p className="text-[14px] text-[#7B6D63] font-serif">Velvet Gift Boxed</p>
                    </div>
                  </div>

                  {/* Free Shipping */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#FAF6F0] border border-[#C8A46A]/30 flex items-center justify-center text-[#C8A46A] shrink-0 shadow-inner">
                      <Truck size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#2A2623] font-sans">Insured Shipping</h4>
                      <p className="text-[14px] text-[#7B6D63] font-serif">Safe doorstep delivery</p>
                    </div>
                  </div>

                  {/* Express Delivery */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#FAF6F0] border border-[#C8A46A]/30 flex items-center justify-center text-[#C8A46A] shrink-0 shadow-inner">
                      <RefreshCw size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#2A2623] font-sans">4–5 Days Delivery</h4>
                      <p className="text-[14px] text-[#7B6D63] font-serif">Fast insured doorstep transit</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Assurance Banner Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FAF6F0] to-[#F5EFE8] border border-[#C8A46A]/30 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#2e0e43]/10 border border-[#2e0e43]/15 flex items-center justify-center text-[#2e0e43] shrink-0">
                    <Tag size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-[#2e0e43] font-serif">Express Insured Delivery</h4>
                    <p className="text-[14px] text-[#7B6D63] font-serif hidden sm:block">Fast 4–5 days delivery across India. Full transit protection.</p>
                  </div>
                </div>

                <Link
                  to="/return-policy"
                  className="inline-flex items-center gap-1 text-[14px] uppercase tracking-wider font-semibold text-[#2e0e43] hover:text-[#C8A46A] transition-colors shrink-0 font-sans"
                >
                  Policy <ArrowRight size={13} />
                </Link>
              </div>

            </div>

            {/* Right Column: Price Details & Order Summary Card */}
            <div className="lg:col-span-5 xl:col-span-4">
              <div className="lg:sticky lg:top-24 bg-white rounded-2xl border border-[#E8DFD5] border-t-2 border-t-[#C8A46A] shadow-[0_4px_25px_rgba(0,0,0,0.03)] overflow-hidden">

                {/* Header */}
                <div className="px-5 py-3.5 border-b border-[#E8DFD5] bg-[#FAF6F0]/80 backdrop-blur-sm flex items-center justify-between">
                  <h2 className="text-xs font-semibold text-[#2e0e43] uppercase tracking-[0.2em] font-sans flex items-center gap-2">
                    <Sparkles size={14} className="text-[#C8A46A]" />
                    ORDER SUMMARY
                  </h2>
                  <span className="text-xs font-serif text-[#7B6D63]">
                    {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
                  </span>
                </div>

                <div className="p-5 space-y-4">

                  {/* Line Items */}
                  <div className="space-y-3 text-xs sm:text-sm font-sans">

                    {/* Price Subtotal */}
                    <div className="flex justify-between items-center text-[#7B6D63]">
                      <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                      <span className="font-normal text-[#2A2623] text-sm sm:text-base">₹{originalTotal.toLocaleString()}</span>
                    </div>

                    {/* Product Savings / Discount */}
                    {productSavings > 0 ? (
                      <div className="flex justify-between items-center text-emerald-700">
                        <span>Bespoke Discount</span>
                        <span className="font-normal text-sm sm:text-base">−₹{productSavings.toLocaleString()}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-[#7B6D63]">
                        <span>Discount</span>
                        <span className="font-normal text-sm sm:text-base">—</span>
                      </div>
                    )}

                    {/* Delivery Charges */}


                    {/* GST Included */}
                    <div className="flex justify-between items-center text-[#7B6D63]">
                      <span>Estimated GST</span>
                      <span className="text-emerald-700 font-medium text-xs">Included</span>
                    </div>

                  </div>

                  {/* Savings Banner Highlight if saving money */}
                  {productSavings > 0 && (
                    <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/60 text-emerald-800 text-xs font-sans flex items-center justify-between">
                      <span className="font-medium">Total Savings</span>
                      <span className="font-normal text-xs sm:text-sm">₹{productSavings.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Total Box Divider & Content */}
                  <div className="p-3.5 rounded-xl bg-[#FAF6F0] border border-[#C8A46A]/20 space-y-0.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs sm:text-sm font-medium text-[#2A2623] font-sans">Total Amount</span>
                      <span className="text-xl sm:text-2xl font-normal font-sans text-[#2e0e43] tracking-tight">
                        ₹{total.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[14px] text-[#7B6D63] font-serif text-right">
                      Inclusive of all applicable taxes
                    </p>
                  </div>

                  {/* Gift Note Section */}
                  <div className="pt-1">
                    {!showGiftNote ? (
                      <button
                        onClick={() => setShowGiftNote(true)}
                        className="w-full flex items-center justify-between text-xs font-sans text-[#7B6D63] hover:text-[#2e0e43] transition-colors py-2 border-t border-b border-[#F5EFE8]"
                      >
                        <span className="flex items-center gap-2">
                          <Gift size={14} className="text-[#C8A46A]" />
                          {savedGiftNote ? 'Edit Personalized Gift Note' : 'Add Personalized Gift Note'}
                        </span>
                        <ChevronRight size={14} />
                      </button>
                    ) : (
                      <div className="space-y-2.5 bg-[#FAF6F0] p-3.5 rounded-xl border border-[#C8A46A]/30">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#2A2623] flex items-center gap-1.5">
                          <Gift size={14} className="text-[#C8A46A]" />
                          Personalized Gift Message
                        </p>
                        <textarea
                          rows={2.5}
                          placeholder="Write your special message for the recipient..."
                          value={giftNoteText}
                          onChange={(e) => setGiftNoteText(e.target.value)}
                          className="w-full border border-[#E8DFD5] rounded-lg p-2 text-xs text-[#2A2623] bg-white outline-none focus:border-[#C8A46A] resize-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setShowGiftNote(false)}
                            className="px-2.5 py-1 text-xs text-[#7B6D63] hover:text-[#2A2623]"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveGiftNote}
                            className="px-3.5 py-1 rounded-lg bg-[#2e0e43] text-white text-[14px] font-semibold uppercase tracking-wider hover:bg-[#C8A46A] transition-colors"
                          >
                            Save Note
                          </button>
                        </div>
                      </div>
                    )}
                    {savedGiftNote && !showGiftNote && (
                      <p className="text-[14px] text-emerald-700 bg-emerald-50 border border-emerald-100 p-2 rounded-lg mt-2 font-serif italic">
                        "{savedGiftNote}"
                      </p>
                    )}
                  </div>

                  {/* Primary Checkout Action Button (Desktop View) */}
                  <button
                    onClick={() => navigate("/checkout")}
                    disabled={items.length === 0}
                    className="hidden lg:flex w-full bg-[#2e0e43] text-white py-3.5 px-6 rounded-xl text-xs font-semibold uppercase tracking-[0.25em] hover:bg-[#1A0829] active:scale-[0.99] transition-all duration-300 shadow-md hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed items-center justify-center gap-2 group cursor-pointer"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform shrink-0 text-[#C8A46A]" />
                  </button>

                  {/* Safe & Secure Sub-caption */}
                  <div className="flex items-center justify-center gap-1.5 text-[14px] text-[#7B6D63] font-serif">
                    <Lock size={13} className="text-[#C8A46A]" />
                    <span>256-Bit SSL Encrypted • Safe & Secure</span>
                  </div>

                </div>

              </div>
            </div>

          </div>
        )}

      </div>

      {/* MOBILE STICKY BOTTOM CHECKOUT BAR */}
      {items.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8DFD5] p-3 px-4 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] flex items-center justify-between gap-4">
          <div className="min-w-0">
            <span className="text-[14px] text-[#7B6D63] font-serif uppercase tracking-wider block">
              Total ({itemCount} {itemCount === 1 ? 'item' : 'items'})
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-normal font-sans text-[#2e0e43]">
                ₹{total.toLocaleString()}
              </span>

            </div>
          </div>

          <button
            onClick={() => navigate("/checkout")}
            className="bg-[#2e0e43] text-white py-3 px-5 rounded-xl text-xs font-semibold uppercase tracking-[0.18em] hover:bg-[#1A0829] active:scale-95 transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <span>Checkout</span>
            <ArrowRight size={14} className="text-[#C8A46A]" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Cart;