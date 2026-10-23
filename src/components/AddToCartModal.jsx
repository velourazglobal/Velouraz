import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ShoppingBag, ArrowRight, X, Minus, Plus } from "lucide-react";
import { useStore } from "../hooks/useStore";

const AddToCartModal = ({ isOpen, onClose, product }) => {
  const navigate = useNavigate();
  const { cartItems, updateCartQuantity } = useStore();
  const [timerKey, setTimerKey] = useState(0);

  // Find current item in cart to get real-time quantity
  const cartItem = cartItems.find(i => i.id === product?.id);
  const currentQuantity = cartItem ? cartItem.quantity : 1;
  const stockLimit = product ? Number(product.stock || 10) : 10;

  // 5-Second Auto-Dismiss Timer
  useEffect(() => {
    if (!isOpen || !product) return;

    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [isOpen, product, timerKey, onClose]);

  const handleQuantityChange = async (newQty) => {
    if (!product) return;
    setTimerKey(prev => prev + 1); // Reset 5s timer on interaction
    await updateCartQuantity(product.id, newQty);
  };

  const handleGoToCart = () => {
    onClose();
    navigate('/cart');
  };

  if (!isOpen || !product) return null;

  const productImage = product.image || product.images?.[0] || '/img/jewellery/j.png';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
        
        {/* Dark Obsidian Glass Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0B0711]/75 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: "spring", damping: 25, stiffness: 280 }}
          className="relative z-10 max-w-lg w-full bg-white rounded-3xl border border-[#D8CBBE]/60 p-6 sm:p-7 shadow-2xl overflow-hidden font-sans text-[#2A2623]"
        >
          
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-[#F4EEE8] pb-4 mb-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={22} className="text-emerald-700 shrink-0" />
              <h3 className="text-sm sm:text-base font-bold uppercase tracking-[0.18em] text-[#2e0e43] font-sans">
                Added to Shopping Bag
              </h3>
            </div>
            
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F8F4EF] hover:bg-[#2e0e43] hover:text-white transition-all flex items-center justify-center text-[#7B6D63] cursor-pointer"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Product Thumbnail & Details Card */}
          <div className="flex items-center gap-4 bg-[#FDFAF5] p-4 rounded-2xl border border-[#D8CBBE]/40 mb-5">
            <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden bg-[#F4EEE8] border border-[#D8CBBE]/50 shrink-0">
              <img 
                src={productImage} 
                alt={product.name} 
                className="w-full h-full object-cover" 
              />
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
              <span className="text-sm font-sans font-bold uppercase tracking-[0.2em] text-[#C8A46A] block truncate">
                {product.brand || product.category || "Velouraz High Jewellery"}
              </span>

              <h4 className="font-serif text-base sm:text-lg text-[#2e0e43] font-normal leading-snug line-clamp-2">
                {product.name}
              </h4>

              <div className="flex items-baseline gap-2 pt-0.5">
                <span className="text-base font-bold font-sans text-[#2e0e43]">
                  ₹{Number(product.price || 0).toLocaleString()}
                </span>
                {Number(product.original_price) > Number(product.price) && (
                  <span className="text-sm text-[#7B6D63]/50 line-through font-sans">
                    ₹{Number(product.original_price).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Quantity Controls */}
          <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-[#D8CBBE]/50 mb-6">
            <span className="text-sm font-bold uppercase tracking-wider text-[#7B6D63] font-sans">
              Update Quantity:
            </span>

            <div className="flex items-center border border-[#D8CBBE] rounded-xl bg-[#FDFAF5] overflow-hidden shadow-xs">
              <button
                onClick={() => handleQuantityChange(currentQuantity - 1)}
                className="w-10 h-10 flex items-center justify-center text-[#2A2623] hover:bg-[#F4EEE8] transition-colors cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus size={15} />
              </button>
              <span className="w-10 text-center font-bold text-sm text-[#2e0e43] font-sans">
                {currentQuantity}
              </span>
              <button
                onClick={() => handleQuantityChange(currentQuantity + 1)}
                disabled={currentQuantity >= stockLimit}
                className="w-10 h-10 flex items-center justify-center text-[#2A2623] hover:bg-[#F4EEE8] transition-colors cursor-pointer disabled:opacity-30"
                aria-label="Increase quantity"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>

          {/* Action Buttons Suite */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
            <button
              onClick={handleGoToCart}
              className="w-full min-h-[48px] py-3.5 px-5 rounded-xl bg-[#2e0e43] text-white hover:bg-[#1A0829] text-sm font-bold uppercase tracking-[0.18em] transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer font-sans"
            >
              <ShoppingBag size={16} className="text-[#C8A46A]" />
              <span>Go to Cart</span>
            </button>

            <button
              onClick={onClose}
              className="w-full min-h-[48px] py-3.5 px-5 rounded-xl bg-white border border-[#D8CBBE] text-[#2e0e43] hover:bg-[#FDFAF5] text-sm font-bold uppercase tracking-[0.18em] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer font-sans"
            >
              <span>Continue Shopping</span>
            </button>
          </div>

          {/* 5-Second Animated Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#F4EEE8] overflow-hidden">
            <motion.div
              key={timerKey}
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
              className="h-full bg-[#C8A46A]"
            />
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddToCartModal;
