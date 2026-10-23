import React, { useState, useEffect } from "react";
import { useStore } from "../hooks/useStore";
import { useAuth } from "../components/useAuth";
import { db } from "../components/Firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc, writeBatch } from "firebase/firestore";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Truck,
  ArrowLeft,
  CreditCard,
  User,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Lock,
  Sparkles,
  AlertCircle,
  Loader2,
  PackageCheck,
  Package,
  Gem,
  Gift,
  ChevronRight,
  ChevronDown,
  Check,
  Plus,
  Home,
  Building2,
  Tag,
  ArrowRight,
  TicketPercent,
  X
} from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";
import { sendOrderEmails } from "../services/emailService";
import { createShiprocketOrder } from "../services/shiprocketService";
import { validateCoupon } from "../services/couponService";
import OtpModal from "../components/OtpModal";
import { createRazorpayOrder, verifyPaymentAndCreateOrder } from "../services/otpService";
import RazorpayTestModal from "../components/RazorpayTestModal";
import { getOptimizedImageUrl, handleImageError } from "../config/cloudinary";

const Checkout = () => {
  const { cartItems, clearCart } = useStore();
  const { user, verifyEmailOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("razorpay"); // 'razorpay' | 'cod'
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [showMobileSummary, setShowMobileSummary] = useState(false);

  // OTP Modal State for Guest Checkout
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [guestEmail, setGuestEmail] = useState("");

  // Razorpay Test Payment Modal State
  const [showRazorpayTestModal, setShowRazorpayTestModal] = useState(false);
  const [rzpTestOrderData, setRzpTestOrderData] = useState(null);

  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedSavedIndex, setSelectedSavedIndex] = useState(null);
  const [isNewAddress, setIsNewAddress] = useState(false);

  // Buy Now context state
  const [buyNowItem, setBuyNowItem] = useState(location.state?.buyNowItem || null);
  const isBuyNow = Boolean(buyNowItem);
  const checkoutItems = isBuyNow ? [buyNowItem] : cartItems;

  useEffect(() => {
    if (location.state?.buyNowItem) {
      setBuyNowItem(location.state.buyNowItem);
    }
  }, [location.state]);

  // Comprehensive Form State
  const [formData, setFormData] = useState({
    name: user?.displayName || "",
    email: user?.email || "",
    phone: "",
    alternatePhone: "",
    flat: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    type: "Home",
    saveToAccount: true,
  });



  // Load Saved Addresses from User Firestore Doc
  useEffect(() => {
    if (user?.uid) {
      const userRef = doc(db, "users", user.uid);
      getDoc(userRef).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const addrs = data.savedAddresses || [];
          if (addrs.length === 0 && data.defaultAddress) {
            addrs.push({ ...data.defaultAddress, type: "Home", isDefault: true });
          }

          setSavedAddresses(addrs);

          if (addrs.length > 0) {
            // Find default or first saved address
            const defaultIdx = addrs.findIndex(a => a.isDefault);
            const activeIdx = defaultIdx !== -1 ? defaultIdx : 0;
            const activeAddr = addrs[activeIdx];

            setSelectedSavedIndex(activeIdx);
            setIsNewAddress(false);

            setFormData({
              name: activeAddr.name || data.displayName || data.name || user.displayName || "",
              email: data.email || user.email || "",
              phone: activeAddr.phone || data.phone || data.phoneNumber || "",
              alternatePhone: activeAddr.alternatePhone || "",
              flat: activeAddr.flat || "",
              address: activeAddr.address || "",
              city: activeAddr.city || "",
              state: activeAddr.state || "",
              pincode: activeAddr.pincode || "",
              country: activeAddr.country || "India",
              type: activeAddr.type || "Home",
              saveToAccount: true,
            });
          } else {
            setIsNewAddress(true);
            setFormData(prev => ({
              ...prev,
              name: data.displayName || data.name || user.displayName || prev.name,
              email: data.email || user.email || prev.email,
              phone: data.phone || data.phoneNumber || prev.phone,
            }));
          }
        }
      }).catch(err => console.error("Error loading user saved addresses:", err));
    }
  }, [user]);

  const [stockStatus, setStockStatus] = useState({});

  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");

  // Calculate totals
  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * (item.quantity || 1),
    0
  );
  const shippingFee = subtotal >= 1999 || subtotal === 0 ? 0 : 99;
  const discountAmount = appliedCoupon ? Number(appliedCoupon.discountAmount || 0) : 0;
  const total = Math.max(0, subtotal + shippingFee - discountAmount);

  const handleApplyCoupon = async (e) => {
    if (e) e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    setCouponSuccess("");
    try {
      const res = await validateCoupon(couponCode, subtotal);
      if (res.valid) {
        setAppliedCoupon({
          code: res.coupon.code,
          discountAmount: res.discountAmount,
          coupon: res.coupon,
        });
        setCouponSuccess(res.message);
      } else {
        setCouponError(res.message);
      }
    } catch (err) {
      console.error("Coupon error:", err);
      setCouponError("Failed to apply coupon.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponSuccess("");
    setCouponError("");
  };

  useEffect(() => {
    const checkStock = async () => {
      const status = {};
      for (const item of checkoutItems) {
        if (!item.id || item.id.startsWith("bs-")) continue;
        try {
          const pRef = doc(db, "products", item.id);
          const pSnap = await getDoc(pRef);
          if (pSnap.exists()) {
            status[item.id] = Number(pSnap.data().stock || 0);
          }
        } catch (e) {
          console.error("Stock check error:", e);
        }
      }
      setStockStatus(status);
    };
    if (checkoutItems.length > 0) {
      checkStock();
    }
  }, [checkoutItems]);

  const isAnyOutOfStock = checkoutItems.some((item) => {
    const stock = stockStatus[item.id];
    return stock !== undefined && stock < (item.quantity || 1);
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectSavedAddress = (index) => {
    const addr = savedAddresses[index];
    setSelectedSavedIndex(index);
    setIsNewAddress(false);
    setFormData(prev => ({
      ...prev,
      name: addr.name || prev.name,
      phone: addr.phone || prev.phone,
      alternatePhone: addr.alternatePhone || "",
      flat: addr.flat || "",
      address: addr.address || "",
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.pincode || "",
      country: addr.country || "India",
      type: addr.type || "Home",
    }));
  };

  const handleAddNewAddress = () => {
    setSelectedSavedIndex(null);
    setIsNewAddress(true);
    setFormData(prev => ({
      ...prev,
      flat: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      alternatePhone: "",
      type: "Home",
      saveToAccount: true,
    }));
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const executeOrderCreation = async (paymentDetails = {}) => {
    setLoading(true);
    try {
      const cleanEmail = (formData.email || "").trim().toLowerCase();

      // 1. Update product stocks in Firestore
      const batch = writeBatch(db);
      for (const item of checkoutItems) {
        if (item.id && !item.id.startsWith("bs-")) {
          try {
            const pRef = doc(db, "products", item.id);
            const pSnap = await getDoc(pRef);
            if (pSnap.exists()) {
              const currentStock = Number(pSnap.data().stock || 0);
              const newStock = Math.max(0, currentStock - Number(item.quantity || 1));
              batch.update(pRef, { stock: newStock });
            }
          } catch (stkErr) {
            console.warn("Stock update warning for item:", item.id, stkErr);
          }
        }
      }
      await batch.commit().catch(e => console.warn("Batch stock commit warning:", e));

      // 2. Associate with logged in user or existing user by email
      let orderUserId = user?.uid || "guest";
      if (!user?.uid && cleanEmail) {
        try {
          const userQuery = query(collection(db, "users"), where("email", "==", cleanEmail));
          const userSnap = await getDocs(userQuery);
          if (!userSnap.empty) {
            orderUserId = userSnap.docs[0].id;
          }
        } catch (uErr) {
          console.warn("User lookup error:", uErr);
        }
      }

      const fullShippingAddress = {
        name: formData.name,
        email: cleanEmail,
        phone: formData.phone,
        alternatePhone: formData.alternatePhone || "",
        flat: formData.flat || "",
        address: formData.address || "",
        fullAddress: `${formData.flat ? formData.flat + ', ' : ''}${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
        city: formData.city || "",
        state: formData.state || "",
        pincode: formData.pincode || "",
        country: formData.country || "India",
        type: formData.type || "Home",
      };

      // 3. Register Order with Shiprocket Logistics (Optional)
      let shiprocketResult = { shiprocketOrderId: null, awbNumber: null, courierName: null };
      try {
        shiprocketResult = await createShiprocketOrder({
          customerName: formData.name,
          email: cleanEmail,
          phone: formData.phone,
          shippingAddress: fullShippingAddress,
          items: checkoutItems,
          totalAmount: total,
          paymentMethod,
        });
      } catch (srErr) {
        console.warn("Shiprocket integration notice:", srErr?.message);
      }

      const generatedOrderNum = `VLZ-${Math.floor(100000 + Math.random() * 900000)}`;

      const orderData = {
        orderNumber: generatedOrderNum,
        userId: orderUserId,
        customerName: formData.name,
        email: cleanEmail,
        phone: formData.phone,
        alternatePhone: formData.alternatePhone || "",
        shippingAddress: fullShippingAddress,
        items: checkoutItems.map(i => ({
          id: i.id,
          name: i.name || "Jewellery Item",
          price: Number(i.price || 0),
          original_price: Number(i.original_price || i.price || 0),
          quantity: Number(i.quantity || 1),
          image: i.image || i.primaryImage || '',
          size: i.size || null,
          metal: i.metal || null,
        })),
        subtotal,
        shippingFee,
        discountAmount,
        couponDetails: appliedCoupon ? {
          code: appliedCoupon.code,
          discountAmount: appliedCoupon.discountAmount,
        } : null,
        totalAmount: total,
        total: total,
        paymentMethod: paymentMethod || "cod",
        paymentStatus: paymentMethod === "razorpay" ? "Paid" : "Pending",
        paymentDetails,
        orderStatus: "Processing",
        shiprocketOrderId: shiprocketResult?.shiprocketOrderId || null,
        trackingNumber: shiprocketResult?.awbNumber || null,
        courierName: shiprocketResult?.courierName || null,
        createdAt: serverTimestamp(),
        orderDate: new Date().toISOString()
      };

      // 4. Save Order to Firestore orders collection
      const docRef = await addDoc(collection(db, "orders"), orderData);
      const finalCreatedOrder = { id: docRef.id, orderId: docRef.id, ...orderData };

      // 5. Send Email Confirmation to Customer & Admin Notification
      sendOrderEmails(finalCreatedOrder).catch(err => console.error("Order email dispatch error:", err));

      // 6. Save address to account if user logged in
      if (user?.uid) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          let currentSaved = [];
          if (userSnap.exists() && userSnap.data().savedAddresses) {
            currentSaved = userSnap.data().savedAddresses;
          }

          const newAddrObj = {
            name: formData.name,
            phone: formData.phone,
            alternatePhone: formData.alternatePhone || "",
            flat: formData.flat || "",
            address: formData.address || "",
            city: formData.city || "",
            state: formData.state || "",
            pincode: formData.pincode || "",
            country: formData.country || "India",
            type: formData.type || "Home",
            isDefault: currentSaved.length === 0
          };

          if (formData.saveToAccount && isNewAddress) {
            const exists = currentSaved.some(a => a.address === newAddrObj.address && a.pincode === newAddrObj.pincode);
            if (!exists) {
              currentSaved.push(newAddrObj);
            }
          }

          await setDoc(userRef, {
            defaultAddress: newAddrObj,
            savedAddresses: currentSaved,
            phone: formData.phone
          }, { merge: true });
        } catch (addrErr) {
          console.warn("Address save error:", addrErr);
        }
      }

      // 7. Clear Shopping Cart & Buy Now State
      setBuyNowItem(null);
      if (typeof window !== 'undefined' && window.history?.replaceState) {
        window.history.replaceState(null, "", window.location.pathname);
      }
      if (clearCart) {
        await clearCart();
      }

      return finalCreatedOrder;
    } catch (err) {
      console.error("Order creation error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (createdOrder) => {
    setBuyNowItem(null);
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      window.history.replaceState(null, "", window.location.pathname);
    }
    if (clearCart) {
      await clearCart();
    }

    const orderId = createdOrder?.id || createdOrder?.orderId;
    if (orderId) {
      navigate(`/order-success/${orderId}`, { state: { isNewUser: false } });
    } else {
      setOrderSuccess(createdOrder);
    }
  };

  const handleOtpSuccess = async (verificationResult) => {
    setShowOtpModal(false);
    navigate(`/order-success/${pendingOrderId}`, { state: { isNewUser: verificationResult.isNewUser } });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.address || !formData.city || !formData.pincode || !formData.state) {
      alert("Please fill in all required contact & shipping fields.");
      return;
    }

    if (isAnyOutOfStock) {
      alert("One or more items in your cart are currently out of stock.");
      return;
    }

    setLoading(true);

    try {
      if (paymentMethod === "razorpay") {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          alert("Razorpay SDK failed to load. Please check your internet connection.");
          setLoading(false);
          return;
        }

        const rzpOrder = await createRazorpayOrder(checkoutItems, discountAmount);

        const options = {
          key: rzpOrder.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_VelourazDummyKey",
          amount: rzpOrder.amount,
          currency: rzpOrder.currency || "INR",
          name: "Velouraz High Jewellery",
          description: "Haute Joaillerie Order Payment",
          image: "/img/logo.png",
          order_id: (rzpOrder.id && !rzpOrder.id.startsWith("order_sim_")) ? rzpOrder.id : undefined,
          handler: async function (response) {
            try {
              setLoading(true);
              const createdOrder = await executeOrderCreation({
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id || rzpOrder.id,
                razorpaySignature: response.razorpay_signature,
              });
              await handlePaymentSuccess(createdOrder);
            } catch (err) {
              console.error("Payment verification error:", err);
              alert(err.message || "Payment verification failed.");
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.phone,
          },
          theme: {
            color: "#2e0e43",
          },
        };

        try {
          const paymentObject = new window.Razorpay(options);
          paymentObject.open();
          setLoading(false);
        } catch (err) {
          console.warn("Razorpay simulated mode, completing order directly:", err);
          const createdOrder = await executeOrderCreation({ paymentMethod: "razorpay" });
          await handlePaymentSuccess(createdOrder);
        }
      } else {
        const createdOrder = await executeOrderCreation({ paymentMethod: "cod" });
        await handlePaymentSuccess(createdOrder);
      }
    } catch (err) {
      console.error("Order submission error:", err);
      alert(err.message || "Failed to place order. Please try again.");
      setLoading(false);
    }
  };

  // Order Success Screen
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] font-sans text-[#14111E] pt-32 pb-24 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full bg-white rounded-3xl border border-[#E5D7C5] p-8 sm:p-12 text-center shadow-xl space-y-6 relative overflow-hidden"
        >
          <div className="w-20 h-20 rounded-full bg-[#14111E]/10 text-[#14111E] border border-[#14111E]/30 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 size={44} className="text-[#C8A46A]" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase font-bold tracking-[0.25em] text-[#C8A46A] block">
              Order Confirmed & Email Receipt Sent
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#14111E] font-normal">
              Thank You for Your Order
            </h1>
            <p className="text-xs sm:text-sm text-[#786C60] font-serif leading-relaxed max-w-md mx-auto">
              Order Reference <span className="font-bold text-[#14111E] font-mono">#{orderSuccess.id.slice(0, 10).toUpperCase()}</span> has been assigned to our master ateliers.
            </p>
          </div>

          {/* Detailed Summary Box */}
          <div className="bg-[#F6F2EC] rounded-2xl p-6 border border-[#E5D7C5] text-left space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between border-b border-[#E5D7C5] pb-2.5">
              <span className="text-[#786C60] uppercase font-bold tracking-wider text-[14px]">Recipient Name</span>
              <span className="font-semibold text-[#14111E]">{orderSuccess.customerName}</span>
            </div>
            <div className="flex justify-between border-b border-[#E5D7C5] pb-2.5">
              <span className="text-[#786C60] uppercase font-bold tracking-wider text-[14px]">Shiprocket AWB</span>
              <span className="font-mono font-bold text-[#14111E]">{orderSuccess.trackingNumber}</span>
            </div>
            <div className="flex justify-between border-b border-[#E5D7C5] pb-2.5">
              <span className="text-[#786C60] uppercase font-bold tracking-wider text-[14px]">Delivery Destination</span>
              <span className="font-medium text-[#14111E] text-right max-w-xs">{orderSuccess.shippingAddress.fullAddress}</span>
            </div>
            <div className="flex justify-between border-b border-[#E5D7C5] pb-2.5">
              <span className="text-[#786C60] uppercase font-bold tracking-wider text-[14px]">Payment Method</span>
              <span className="font-bold text-[#14111E] uppercase tracking-wider">{orderSuccess.paymentMethod} ({orderSuccess.paymentStatus})</span>
            </div>
            <div className="flex justify-between items-baseline pt-1">
              <span className="text-[#786C60] uppercase font-bold tracking-wider text-[14px]">Total Paid</span>
              <span className="font-bold text-[#14111E] font-sans text-xl">₹{Number(orderSuccess.totalAmount).toLocaleString()}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3.5 pt-2">
            <button
              onClick={() => {
                const targetId = orderSuccess.id;
                setOrderSuccess(null);
                setBuyNowItem(null);
                if (typeof window !== 'undefined' && window.history?.replaceState) {
                  window.history.replaceState(null, "", window.location.pathname);
                }
                navigate(`/track-order?id=${targetId}`, { replace: true, state: {} });
              }}
              className="flex-1 py-4 bg-[#14111E] text-[#FBF9F5] text-xs font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-[#251D33] transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 border border-[#C8A46A]/30 font-sans"
            >
              <Truck size={16} className="text-[#C8A46A]" />
              Track Shipment with Shiprocket
            </button>
            <button
              onClick={() => {
                setOrderSuccess(null);
                setBuyNowItem(null);
                if (typeof window !== 'undefined' && window.history?.replaceState) {
                  window.history.replaceState(null, "", window.location.pathname);
                }
                navigate('/orders', { replace: true, state: {} });
              }}
              className="flex-1 py-4 border border-[#E5D7C5] text-[#14111E] text-xs font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-[#F6F2EC] transition-colors cursor-pointer font-sans"
            >
              View Order History
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center p-6 text-center pt-32 font-sans text-[#14111E]">
        <Gem size={48} className="text-[#C8A46A] mb-4" />
        <h2 className="font-serif text-3xl sm:text-4xl text-[#14111E] font-normal">Your shopping bag is empty.</h2>
        <p className="text-xs sm:text-sm text-[#786C60] font-serif italic mt-2 mb-8 max-w-sm">Please add pieces to your collection before proceeding to express checkout.</p>
        <button
          onClick={() => {
            setBuyNowItem(null);
            if (typeof window !== 'undefined' && window.history?.replaceState) {
              window.history.replaceState(null, "", window.location.pathname);
            }
            navigate('/shop', { replace: true, state: {} });
          }}
          className="px-8 py-4 bg-[#14111E] text-[#FBF9F5] text-xs font-bold uppercase tracking-[0.22em] rounded-xl hover:bg-[#251D33] transition-all shadow-md cursor-pointer border border-[#C8A46A]/30 font-sans"
        >
          Explore Boutique Catalogue
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F4EF] font-sans text-[#2A2623]">

      {/* Top Breadcrumb Header */}
      <Breadcrumb
        title="Express Checkout"
        subtitle="Complete your order securely with insured express delivery across India."
        bgImage="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1600"
        links={[
          { name: 'Home', href: '/' },
          { name: 'Shopping Bag', href: '/cart' },
          { name: 'Checkout', active: true }
        ]}
      />

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10 pb-32 lg:pb-24">

        {/* Stock Alert Banner */}
        {isAnyOutOfStock && (
          <div className="mb-6 bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex items-center gap-3 text-rose-700 text-xs sm:text-sm font-medium shadow-xs">
            <AlertCircle size={18} className="flex-shrink-0 text-rose-600" />
            <p>One or more items in your order are out of stock. Please adjust quantities in your bag.</p>
          </div>
        )}

        {/* MOBILE COLLAPSIBLE ORDER SUMMARY ACCORDION */}
        <div className="lg:hidden bg-white border border-[#E8DFD5] rounded-2xl mb-6 shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={() => setShowMobileSummary(!showMobileSummary)}
            className="w-full p-4 bg-[#FAF6F0]/80 flex items-center justify-between text-left cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-[#C8A46A]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#2e0e43] font-sans">
                {showMobileSummary ? "Hide Order Summary" : "Show Order Summary"}
              </span>
              <span className="text-[14px] font-sans text-[#7B6D63] bg-white border border-[#E8DFD5] px-2 py-0.5 rounded-full">
                {checkoutItems.length} {checkoutItems.length === 1 ? 'Piece' : 'Pieces'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-normal text-[#2e0e43] font-sans">
                ₹{total.toLocaleString()}
              </span>
              <ChevronDown size={16} className={`text-[#2e0e43] transition-transform duration-300 ${showMobileSummary ? "rotate-180" : ""}`} />
            </div>
          </button>

          <AnimatePresence>
            {showMobileSummary && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 border-t border-[#E8DFD5] space-y-4 bg-white"
              >
                {/* Items List */}
                <div className="space-y-2.5 max-h-56 overflow-y-auto">
                  {checkoutItems.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center p-2 rounded-xl bg-[#FDFAF5] border border-[#D8CBBE]/30">
                      <div className="w-14 h-16 rounded-lg overflow-hidden bg-[#F4EEE8] border border-[#D8CBBE]/40 flex-shrink-0">
                        <img
                          src={item.image || item.primaryImage || '/img/jewellery/j.png'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-[#2A2623] truncate font-serif">{item.name}</h4>
                        <p className="text-[14px] text-[#7B6D63] font-sans">Qty: {item.quantity || 1}</p>
                        <p className="text-xs font-sans font-normal text-[#2e0e43]">
                          ₹{Number(item.price).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calculations */}
                <div className="space-y-2 pt-3 border-t border-[#E8DFD5] text-xs font-sans">
                  <div className="flex justify-between text-[#7B6D63]">
                    <span>Subtotal</span>
                    <span className="font-normal text-[#2A2623]">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#7B6D63]">
                    <span>Insured Delivery</span>
                    <span className="font-semibold text-emerald-700 uppercase tracking-wider text-[14px]">FREE</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>-₹{discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-2 border-t border-[#E8DFD5] font-semibold text-[#2e0e43]">
                    <span>Total Amount</span>
                    <span className="text-lg font-normal text-[#2e0e43]">₹{total.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">

          {/* Left Column: Shipping Address & Payment Selection */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">

            {/* STEP 1: SHIPPING & DELIVERY ADDRESS */}
            <div className="bg-white p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-[#D8CBBE]/50 shadow-xs space-y-5">

              <div className="flex items-center justify-between border-b border-[#D8CBBE]/30 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#2e0e43] text-white text-xs font-semibold flex items-center justify-center">1</span>
                  <h3 className="font-serif text-lg sm:text-2xl text-[#2e0e43] font-normal">Shipping & Delivery Address</h3>
                </div>
                <span className="text-xs text-[#C8A46A] font-semibold uppercase tracking-wider font-sans">Step 1 of 2</span>
              </div>

              {/* SAVED ADDRESSES SELECTOR */}
              {savedAddresses.length > 0 && (
                <div className="space-y-3 bg-[#FDFAF5] p-4 rounded-xl border border-[#D8CBBE]/40">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#2e0e43] flex items-center gap-1.5">
                      <MapPin size={14} className="text-[#C8A46A]" />
                      Select from Saved Addresses
                    </label>
                    <button
                      type="button"
                      onClick={handleAddNewAddress}
                      className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1 transition-colors ${isNewAddress ? "text-[#2e0e43] underline" : "text-[#C8A46A] hover:text-[#2e0e43]"
                        }`}
                    >
                      <Plus size={13} /> Add New Address
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {savedAddresses.map((addr, idx) => {
                      const isSelected = selectedSavedIndex === idx && !isNewAddress;
                      return (
                        <div
                          key={idx}
                          onClick={() => handleSelectSavedAddress(idx)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex flex-col justify-between space-y-1.5 relative ${isSelected
                            ? "bg-white border-[#2e0e43] ring-1 ring-[#2e0e43]/20 shadow-xs"
                            : "bg-white/70 border-[#D8CBBE] hover:border-[#C8A46A] hover:bg-white"
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[14px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#2e0e43] text-white">
                              {addr.type || "Home"}
                            </span>
                            {isSelected && (
                              <span className="text-[14px] font-semibold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <Check size={11} /> Selected
                              </span>
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-[#2A2623]">{addr.name}</h4>
                            <p className="text-xs text-[#7B6D63] line-clamp-2 leading-relaxed">
                              {addr.flat ? addr.flat + ', ' : ''}{addr.address}, {addr.city}, {addr.state} - {addr.pincode}
                            </p>
                            <p className="text-[14px] text-[#7B6D63] font-medium mt-0.5">Phone: {addr.phone}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* COMPREHENSIVE ADDRESS INPUT FIELDS */}
              <div className="space-y-3.5 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#7B6D63]">
                    {savedAddresses.length > 0 && !isNewAddress ? "Selected Delivery Details" : "Delivery Address Details"}
                  </h4>
                  {savedAddresses.length > 0 && !isNewAddress && (
                    <span className="text-xs text-[#C8A46A] italic hidden sm:inline">Auto-filled from address book</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm font-sans">

                  {/* Recipient Full Name */}
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-[#7B6D63] mb-1 text-[14px]">
                      Recipient Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter full name"
                      className="w-full px-3.5 py-2.5 bg-[#FDFAF5] border border-[#D8CBBE] rounded-xl outline-none focus:border-[#2e0e43] focus:bg-white transition-all text-xs sm:text-sm"
                    />
                  </div>

                  {/* Contact Email */}
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-[#7B6D63] mb-1 text-[14px]">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 bg-[#FDFAF5] border border-[#D8CBBE] rounded-xl outline-none focus:border-[#2e0e43] focus:bg-white transition-all text-xs sm:text-sm"
                    />
                  </div>

                  {/* Primary Phone */}
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-[#7B6D63] mb-1 text-[14px]">
                      Mobile Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="10-digit mobile number"
                      className="w-full px-3.5 py-2.5 bg-[#FDFAF5] border border-[#D8CBBE] rounded-xl outline-none focus:border-[#2e0e43] focus:bg-white transition-all text-xs sm:text-sm"
                    />
                  </div>

                  {/* Alternate Phone (Optional) */}
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-[#7B6D63] mb-1 text-[14px]">
                      Alternate Phone <span className="font-normal text-[#7B6D63]/70">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      name="alternatePhone"
                      value={formData.alternatePhone}
                      onChange={handleInputChange}
                      placeholder="Secondary contact number"
                      className="w-full px-3.5 py-2.5 bg-[#FDFAF5] border border-[#D8CBBE] rounded-xl outline-none focus:border-[#2e0e43] focus:bg-white transition-all text-xs sm:text-sm"
                    />
                  </div>

                  {/* Flat / House No / Building */}
                  <div className="sm:col-span-2">
                    <label className="block font-semibold uppercase tracking-wider text-[#7B6D63] mb-1 text-[14px]">
                      Flat / House No. / Building / Suite *
                    </label>
                    <input
                      type="text"
                      required
                      name="flat"
                      value={formData.flat}
                      onChange={handleInputChange}
                      placeholder="e.g. Flat 402, Royal Residency, Tower B"
                      className="w-full px-3.5 py-2.5 bg-[#FDFAF5] border border-[#D8CBBE] rounded-xl outline-none focus:border-[#2e0e43] focus:bg-white transition-all text-xs sm:text-sm"
                    />
                  </div>

                  {/* Street Address / Area / Colony / Landmark */}
                  <div className="sm:col-span-2">
                    <label className="block font-semibold uppercase tracking-wider text-[#7B6D63] mb-1 text-[14px]">
                      Street Address / Area / Landmark *
                    </label>
                    <textarea
                      rows={2}
                      required
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Street name, colony, area or nearby landmark"
                      className="w-full px-3.5 py-2.5 bg-[#FDFAF5] border border-[#D8CBBE] rounded-xl outline-none focus:border-[#2e0e43] focus:bg-white transition-all text-xs sm:text-sm resize-none"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-[#7B6D63] mb-1 text-[14px]">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="e.g. Mumbai"
                      className="w-full px-3.5 py-2.5 bg-[#FDFAF5] border border-[#D8CBBE] rounded-xl outline-none focus:border-[#2e0e43] focus:bg-white transition-all text-xs sm:text-sm"
                    />
                  </div>

                  {/* State */}
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-[#7B6D63] mb-1 text-[14px]">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="e.g. Maharashtra"
                      className="w-full px-3.5 py-2.5 bg-[#FDFAF5] border border-[#D8CBBE] rounded-xl outline-none focus:border-[#2e0e43] focus:bg-white transition-all text-xs sm:text-sm"
                    />
                  </div>

                  {/* Pincode */}
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-[#7B6D63] mb-1 text-[14px]">
                      Pincode / Postal Code *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder="6-digit pincode"
                      className="w-full px-3.5 py-2.5 bg-[#FDFAF5] border border-[#D8CBBE] rounded-xl outline-none focus:border-[#2e0e43] focus:bg-white transition-all text-xs sm:text-sm font-mono"
                    />
                  </div>

                  {/* Address Type Pill Radios */}
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-[#7B6D63] mb-1 text-[14px]">
                      Address Type
                    </label>
                    <div className="flex items-center gap-2 pt-0.5">
                      {["Home", "Work", "Other"].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, type: t }))}
                          className={`flex-1 py-2 px-2.5 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${formData.type === t
                            ? "bg-[#2e0e43] text-white border-[#2e0e43] shadow-xs"
                            : "bg-[#FDFAF5] text-[#7B6D63] border-[#D8CBBE] hover:border-[#2e0e43]"
                            }`}
                        >
                          {t === "Home" && <Home size={13} />}
                          {t === "Work" && <Building2 size={13} />}
                          {t === "Other" && <MapPin size={13} />}
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Save to Account Checkbox */}
                {user?.uid && (
                  <div className="pt-1.5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#2A2623]">
                      <input
                        type="checkbox"
                        name="saveToAccount"
                        checked={formData.saveToAccount}
                        onChange={handleInputChange}
                        className="w-3.5 h-3.5 accent-[#2e0e43] rounded"
                      />
                      <span>Save address to account for future express checkouts</span>
                    </label>
                  </div>
                )}

              </div>

            </div>

            {/* STEP 2: PAYMENT METHOD */}
            <div className="bg-white p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-[#D8CBBE]/50 shadow-xs space-y-5">

              <div className="flex items-center justify-between border-b border-[#D8CBBE]/30 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#2e0e43] text-white text-xs font-semibold flex items-center justify-center">2</span>
                  <h3 className="font-serif text-lg sm:text-2xl text-[#2e0e43] font-normal">Payment Method</h3>
                </div>
                <span className="text-xs text-[#C8A46A] font-semibold uppercase tracking-wider font-sans">Step 2 of 2</span>
              </div>

              <div className="space-y-3">

                {/* Razorpay Online Payment */}
                <label
                  onClick={() => setPaymentMethod("razorpay")}
                  className={`flex items-center justify-between p-4 rounded-xl sm:rounded-2xl border cursor-pointer transition-all duration-300 ${paymentMethod === "razorpay"
                    ? "bg-[#2e0e43]/5 border-[#2e0e43] ring-1 ring-[#2e0e43] shadow-xs"
                    : "bg-[#FDFAF5] border-[#D8CBBE] hover:border-[#C8A46A]"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "razorpay"}
                      onChange={() => setPaymentMethod("razorpay")}
                      className="accent-[#2e0e43] w-4 h-4"
                    />
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-[#2A2623] uppercase tracking-wider font-sans flex items-center gap-2">
                        <span>Razorpay Online Payment</span>
                        <span className="text-[14px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-sans font-normal">Instant</span>
                      </p>
                      <p className="text-xs text-[#7B6D63] font-serif">
                        UPI (GPay, PhonePe), Credit/Debit Cards, NetBanking
                      </p>
                    </div>
                  </div>
                  <CreditCard size={20} className="text-[#2e0e43] shrink-0 hidden sm:block" />
                </label>

                {/* Cash on Delivery */}
                <label
                  onClick={() => setPaymentMethod("cod")}
                  className={`flex items-center justify-between p-4 rounded-xl sm:rounded-2xl border cursor-pointer transition-all duration-300 ${paymentMethod === "cod"
                    ? "bg-[#2e0e43]/5 border-[#2e0e43] ring-1 ring-[#2e0e43] shadow-xs"
                    : "bg-[#FDFAF5] border-[#D8CBBE] hover:border-[#C8A46A]"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="accent-[#2e0e43] w-4 h-4"
                    />
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-[#2A2623] uppercase tracking-wider font-sans">
                        Cash on Delivery (COD)
                      </p>
                      <p className="text-xs text-[#7B6D63] font-serif">
                        Pay in cash upon doorstep delivery
                      </p>
                    </div>
                  </div>
                  <Truck size={20} className="text-[#C8A46A] shrink-0 hidden sm:block" />
                </label>

              </div>

            </div>

            {/* TRUST & SECURITY GUARANTEES */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-white p-4 rounded-2xl border border-[#D8CBBE]/40 text-center space-y-1 shadow-2xs">
                <ShieldCheck size={20} className="mx-auto text-[#2e0e43]" />
                <h5 className="text-xs font-semibold uppercase tracking-wider text-[#2A2623] font-sans">256-Bit SSL</h5>
                <p className="text-[14px] text-[#7B6D63] font-serif">Bank grade security</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#D8CBBE]/40 text-center space-y-1 shadow-2xs">
                <Truck size={20} className="mx-auto text-[#C8A46A]" />
                <h5 className="text-xs font-semibold uppercase tracking-wider text-[#2A2623] font-sans">Insured Transit</h5>
                <p className="text-[14px] text-[#7B6D63] font-serif">100% door-to-door protection</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#D8CBBE]/40 text-center space-y-1 shadow-2xs">
                <Package size={20} className="mx-auto text-[#2e0e43]" />
                <h5 className="text-xs font-semibold uppercase tracking-wider text-[#2A2623] font-sans">Premium Packaging</h5>
                <p className="text-[14px] text-[#7B6D63] font-serif">Signature Velouraz box</p>
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Order Summary Sidebar */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <div className="bg-white p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-[#D8CBBE]/50 shadow-md lg:sticky lg:top-24 space-y-5">

              <div className="border-b border-[#D8CBBE]/30 pb-3.5 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl sm:text-2xl text-[#2e0e43] font-normal">Order Summary</h3>
                  <p className="text-xs text-[#7B6D63] font-sans font-medium mt-0.5">
                    {checkoutItems.length} Piece{checkoutItems.length > 1 ? 's' : ''} in Bag
                  </p>
                </div>
                <Sparkles size={16} className="text-[#C8A46A]" />
              </div>

              {/* Items List Preview */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {checkoutItems.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-center p-2 rounded-xl bg-[#FDFAF5] border border-[#D8CBBE]/30">
                    <div className="w-14 h-16 rounded-lg overflow-hidden bg-[#F4EEE8] border border-[#D8CBBE]/40 flex-shrink-0">
                      {(() => {
                        const rawImg = item.image || item.primaryImage || '/img/jewellery/j.png';
                        return (
                          <img
                            src={getOptimizedImageUrl(rawImg)}
                            alt={item.name}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => handleImageError(e, rawImg)}
                            className="w-full h-full object-cover"
                          />
                        );
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-[#2A2623] truncate font-serif">{item.name}</h4>
                      <p className="text-[14px] text-[#7B6D63] font-sans">Qty: {item.quantity || 1}</p>
                      <p className="text-xs font-sans font-normal text-[#2e0e43]">
                        ₹{Number(item.price).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Code Section */}
              <div className="space-y-2 pt-2 border-t border-[#D8CBBE]/30 font-sans">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#2e0e43] flex items-center gap-1.5">
                  <TicketPercent size={14} className="text-[#C8A46A]" />
                  Promo / Coupon Code
                </label>

                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter Code (e.g. VELOURAZ10)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 bg-[#FDFAF5] border border-[#D8CBBE] rounded-xl text-xs font-mono font-bold uppercase outline-none focus:border-[#2e0e43]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-3.5 py-2 bg-[#2e0e43] text-white text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-[#1A0829] transition-all disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      {couponLoading ? "..." : "Apply"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-bold font-mono text-xs">{appliedCoupon.code} APPLIED</p>
                        <p className="text-[14px] text-emerald-700">Saved ₹{appliedCoupon.discountAmount.toLocaleString()}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-emerald-700 hover:text-rose-600 p-1 font-bold cursor-pointer"
                      title="Remove coupon"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}

                {couponError && <p className="text-xs text-rose-600 font-semibold">{couponError}</p>}
                {couponSuccess && !appliedCoupon && <p className="text-xs text-emerald-600 font-semibold">{couponSuccess}</p>}
              </div>

              {/* Cost Calculations */}
              <div className="space-y-3 pt-3 border-t border-[#D8CBBE]/30 text-xs sm:text-sm font-sans">
                <div className="flex justify-between text-[#7B6D63]">
                  <span>Subtotal</span>
                  <span className="font-normal text-[#2A2623]">₹{subtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-[#7B6D63]">
                  <span>Insured Shipping Fee</span>
                  <span className="font-semibold text-emerald-700 uppercase tracking-wider text-[14px]">
                    {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700 font-medium bg-emerald-50 p-2 rounded-lg border border-emerald-200 text-xs">
                    <span>Coupon Discount ({appliedCoupon.code})</span>
                    <span>-₹{discountAmount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between items-baseline pt-3 border-t border-[#D8CBBE]/40 font-sans">
                  <span className="text-xs sm:text-sm font-medium text-[#2A2623]">Total Amount</span>
                  <span className="text-[#2e0e43] text-xl sm:text-2xl font-normal font-sans tracking-tight">₹{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Primary Submit Order CTA (Desktop View) */}
              <button
                type="submit"
                disabled={loading || isAnyOutOfStock}
                className={`hidden lg:flex w-full min-h-[52px] py-3.5 px-6 text-xs font-semibold uppercase tracking-[0.2em] rounded-xl transition-all duration-300 items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-xl ${loading || isAnyOutOfStock
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#2e0e43] text-white hover:bg-[#1A0829] active:scale-[0.99]'
                  }`}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin shrink-0" />
                ) : (
                  <Lock size={16} className="shrink-0 text-[#C8A46A]" />
                )}
                <span>{loading ? 'Processing Order...' : 'Complete Purchase'}</span>
              </button>

              <p className="text-xs text-[#7B6D63] text-center font-serif flex items-center justify-center gap-1.5">
                <Lock size={13} className="text-[#C8A46A]" />
                256-Bit SSL Encrypted & Authenticated
              </p>

            </div>
          </div>

        </form>

      </div>

      {/* MOBILE STICKY BOTTOM ORDER BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8DFD5] p-3 px-4 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] flex items-center justify-between gap-4">
        <div className="min-w-0">
          <span className="text-[14px] text-[#7B6D63] font-serif uppercase tracking-wider block">
            Total Payable
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-normal font-sans text-[#2e0e43]">
              ₹{total.toLocaleString()}
            </span>

          </div>
        </div>

        <button
          onClick={handlePlaceOrder}
          disabled={loading || isAnyOutOfStock}
          className="bg-[#2e0e43] text-white py-3 px-5 rounded-xl text-xs font-semibold uppercase tracking-[0.18em] hover:bg-[#1A0829] active:scale-95 transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-40"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} className="text-[#C8A46A]" />}
          <span>{loading ? "Processing..." : "Place Order"}</span>
        </button>
      </div>

      {/* Guest Checkout OTP Modal */}
      <OtpModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        email={guestEmail}
        orderId={pendingOrderId}
        displayName={formData.name}
        onSuccess={handleOtpSuccess}
      />
    </div>
  );
};

export default Checkout;
