import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, ArrowRight, Sparkles, Clock } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { getThumbnailUrl, handleImageError } from '../config/cloudinary';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEY = 'velouraz_abandoned_cart_last_shown';

const AbandonedCartReminder = () => {
  const { cartItems, cartCount } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Conditions where reminder should NOT trigger
    if (!cartItems || cartItems.length === 0) return;

    const path = location.pathname;
    const isExcludedRoute =
      path === '/cart' ||
      path === '/checkout' ||
      path.startsWith('/order-success') ||
      path.startsWith('/admin') ||
      path.startsWith('/super') ||
      path === '/login' ||
      path === '/signup';

    if (isExcludedRoute) return;

    // Check 24-hour frequency limit in localStorage
    try {
      const lastShown = localStorage.getItem(STORAGE_KEY);
      if (lastShown) {
        const timeDiff = Date.now() - parseInt(lastShown, 10);
        if (timeDiff < TWENTY_FOUR_HOURS_MS) {
          return;
        }
      }
    } catch (e) {
      console.warn("Storage check notice:", e);
    }

    // Delay modal trigger by 10 seconds of active browsing so it never interrupts immediately
    const timer = setTimeout(() => {
      setIsOpen(true);
      try {
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
      } catch (err) {
        console.warn("Storage write notice:", err);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [cartItems, location.pathname]);

  const handleDismiss = () => {
    setIsOpen(false);
  };

  const handleProceedToCheckout = () => {
    setIsOpen(false);
    navigate('/checkout');
  };

  const handleViewBag = () => {
    setIsOpen(false);
    navigate('/cart');
  };

  if (!isOpen || !cartItems || cartItems.length === 0) return null;

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * (item.quantity || 1),
    0
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        {/* Soft Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleDismiss}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Luxury Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md bg-[#FAF7F2] rounded-3xl border border-[#C8A46A]/40 shadow-[0_25px_60px_rgba(0,0,0,0.35)] overflow-hidden font-sans z-10 text-[#2A2623]"
        >
          {/* Top Gold Foil Accent Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#B89355] via-[#E8DFC8] to-[#B89355]" />

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            aria-label="Close reminder"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 border border-[#E8DFC8] hover:bg-[#14111E] hover:text-white flex items-center justify-center transition-colors cursor-pointer text-[#7B6D63]"
          >
            <X size={15} />
          </button>

          <div className="p-6 sm:p-7 space-y-5">

            {/* Header Badge & Title */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#14111E] text-white text-[11px] font-bold tracking-[0.2em] uppercase font-sans shadow-xs">
                <Sparkles size={12} className="text-[#C8A46A]" /> Velouraz Privé Reserve
              </div>
              <h3 className="font-serif text-2xl sm:text-[26px] text-[#14111E] font-normal tracking-wide">
                Your Curated Pieces <span className="italic text-[#B89355]">Await</span>
              </h3>
              <p className="text-xs sm:text-sm text-[#7B6D63] font-normal leading-relaxed">
                You left handcrafted creations in your shopping bag. Due to small artisan batches, pieces are subject to stock reservation limits.
              </p>
            </div>

            {/* Cart Items Preview (Up to 2 items) */}
            <div className="bg-white rounded-2xl p-3 border border-[#E8DFC8] space-y-2.5 max-h-48 overflow-y-auto no-scrollbar shadow-xs">
              {cartItems.slice(0, 2).map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-1.5">
                  <div className="w-12 h-14 rounded-lg overflow-hidden bg-[#FAF7F2] border border-[#E8DFC8] shrink-0">
                    <img
                      src={getThumbnailUrl(item.image || item.primaryImage || '/img/jewellery/j.png', 120)}
                      alt={item.name}
                      onError={(e) => handleImageError(e, item.image || item.primaryImage)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif text-xs font-semibold text-[#14111E] truncate">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-[#7B6D63]">
                      Qty: {item.quantity || 1}
                    </p>
                    <p className="text-xs font-bold text-[#B89355]">
                      ₹{Number(item.price).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}

              {cartItems.length > 2 && (
                <div className="text-center pt-1 border-t border-[#E8DFC8]/60 text-[11px] text-[#7B6D63] font-medium">
                  + {cartItems.length - 2} more handcrafted item{cartItems.length - 2 > 1 ? 's' : ''} in your bag
                </div>
              )}
            </div>

            {/* Subtotal & Free Shipping Ribbon */}
            <div className="flex items-center justify-between text-xs sm:text-sm px-1">
              <span className="text-[#7B6D63] font-medium">Bag Subtotal:</span>
              <span className="font-serif font-bold text-base text-[#14111E]">
                ₹{subtotal.toLocaleString()}
              </span>
            </div>

            {subtotal >= 1999 ? (
              <div className="text-center text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 py-1.5 rounded-xl">
                ✦ Unlocked Complimentary Insured Express Shipping
              </div>
            ) : (
              <div className="text-center text-[11px] text-[#7B6D63] bg-[#FAF7F2] py-1 rounded-xl">
                Add ₹{(1999 - subtotal).toLocaleString()} more for Free Express Delivery
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2.5 pt-1">
              <button
                onClick={handleProceedToCheckout}
                className="w-full py-3.5 rounded-full bg-[#14111E] text-white hover:bg-[#B89355] text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={handleViewBag}
                className="w-full py-2.5 text-xs text-[#7B6D63] hover:text-[#14111E] font-medium transition-colors cursor-pointer text-center"
              >
                View Full Shopping Bag ({cartCount} {cartCount === 1 ? 'piece' : 'pieces'})
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AbandonedCartReminder;
