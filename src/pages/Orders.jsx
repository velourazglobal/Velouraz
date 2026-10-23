import React, { useState, useEffect } from "react";
import { useAuth } from "../components/useAuth";
import { db } from "../components/Firebase";
import { collection, query, where, getDocs, orderBy, doc, getDoc, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { useNavigate, useSearchParams, useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Truck, CheckCircle2, Clock, FileText, Download,
  Search, ArrowLeft, ChevronRight, X, Printer, ShoppingBag,
  CreditCard, ShieldCheck, MapPin, Eye, ExternalLink, Sparkles,
  RefreshCw, Calendar, Building, Star, MessageSquare, Send, Check
} from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";
import { generateInvoicePDF } from "../utils/invoice";
import { trackShiprocketOrder } from "../services/shiprocketService";
import { syncUserGuestOrders } from "../services/otpService";

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { id: routeId } = useParams();

  // Params
  const queryId = searchParams.get("id") || searchParams.get("track") || routeId || "";
  const initialTab = searchParams.get("tab") === "tracking" || Boolean(queryId) ? "tracking" : "history";

  const [activeTabMode, setActiveTabMode] = useState(initialTab); // 'history' | 'tracking'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Review Modal State
  const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedItemForReview, setSelectedItemForReview] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    headline: "Verified Buyer",
    quote: "",
    customerName: "",
    location: "",
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewedItemMap, setReviewedItemMap] = useState({});

  // Live Shiprocket Tracking State
  const [trackingInput, setTrackingInput] = useState(queryId);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingOrderData, setTrackingOrderData] = useState(null);
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [trackingError, setTrackingError] = useState("");

  // Load User Orders from Firestore with Live Real-time Subscription
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    setLoading(true);
    const cleanEmail = (user?.email || "").trim().toLowerCase();
    if (user?.uid && cleanEmail) {
      syncUserGuestOrders(user.uid, cleanEmail).catch((syncErr) => {
        console.warn("Guest order sync notice:", syncErr);
      });
    }

    const ordersRef = collection(db, "orders");

    const parseOrderDate = (val) => {
      if (!val) return 0;
      if (typeof val === 'number') return val;
      if (val?.seconds) return val.seconds * 1000;
      const parsed = new Date(val).getTime();
      return isNaN(parsed) ? 0 : parsed;
    };

    let mapUserId = new Map();
    let mapEmail = new Map();

    const combineAndSetOrders = () => {
      const combinedMap = new Map([...mapUserId, ...mapEmail]);
      const list = Array.from(combinedMap.values());
      list.sort((a, b) => parseOrderDate(b.createdAt) - parseOrderDate(a.createdAt));
      setOrders(list);
      setLoading(false);
    };

    // Real-time Query 1: by userId
    const q1 = query(ordersRef, where("userId", "==", user.uid));
    const unsub1 = onSnapshot(
      q1,
      (snap1) => {
        mapUserId = new Map();
        snap1.docs.forEach((docSnap) => {
          mapUserId.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
        });
        combineAndSetOrders();
      },
      (err1) => {
        console.warn("Real-time orders by userId notice:", err1);
        setLoading(false);
      }
    );

    // Real-time Query 2: by email
    let unsub2 = () => {};
    if (cleanEmail) {
      const q2 = query(ordersRef, where("email", "==", cleanEmail));
      unsub2 = onSnapshot(
        q2,
        (snap2) => {
          mapEmail = new Map();
          snap2.docs.forEach((docSnap) => {
            mapEmail.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
          });
          combineAndSetOrders();
        },
        (err2) => {
          console.warn("Real-time orders by email notice:", err2);
        }
      );
    }

    return () => {
      unsub1();
      unsub2();
    };
  }, [user, navigate]);

  // Handle Shiprocket Live Tracking Lookup
  const handleTrackLookup = async (targetCode) => {
    const code = String(targetCode || trackingInput).trim();
    if (!code) {
      setTrackingError("Please enter a valid Order Reference or Shiprocket AWB Code.");
      return;
    }

    setTrackingLoading(true);
    setTrackingError("");
    setTrackingOrderData(null);

    try {
      // 1. Fetch Order Doc from Firestore
      const docRef = doc(db, "orders", code);
      const snap = await getDoc(docRef);

      let found = null;
      if (snap.exists()) {
        found = { id: snap.id, ...snap.data() };
        setTrackingOrderData(found);
      }

      // 2. Fetch Shiprocket Tracking Status
      const info = await trackShiprocketOrder(code);
      setTrackingInfo(info);

      if (!found && !info.success) {
        setTrackingError("No active shipment found with reference code #" + code);
      }
    } catch (err) {
      console.error("Tracking lookup error:", err);
      setTrackingError("Failed to fetch live tracking. Please try again.");
    } finally {
      setTrackingLoading(false);
    }
  };

  // Handle Review Modal
  const handleOpenReviewModal = (order, item = null) => {
    setSelectedOrderForReview(order);
    setSelectedItemForReview(item || (order.items && order.items.length > 0 ? order.items[0] : null));
    setReviewForm({
      rating: 5,
      headline: "Verified Buyer",
      quote: "",
      customerName: order.customerName || order.shippingAddress?.name || user?.displayName || "",
      location: order.shippingAddress?.city ? `${order.shippingAddress.city}, India` : "India",
    });
    setReviewSuccess(false);
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.quote.trim()) return;

    setSubmittingReview(true);
    try {
      const reviewData = {
        customerName: reviewForm.customerName.trim() || user?.displayName || selectedOrderForReview?.customerName || "Verified Collector",
        name: reviewForm.customerName.trim() || user?.displayName || selectedOrderForReview?.customerName || "Verified Collector",
        location: reviewForm.location.trim() || (selectedOrderForReview?.shippingAddress?.city ? `${selectedOrderForReview.shippingAddress.city}, India` : "India"),
        place: reviewForm.location.trim() || (selectedOrderForReview?.shippingAddress?.city ? `${selectedOrderForReview.shippingAddress.city}, India` : "India"),
        title: reviewForm.headline.trim() || "Verified Buyer",
        date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        quote: reviewForm.quote.trim(),
        review: reviewForm.quote.trim(),
        rating: Number(reviewForm.rating) || 5,
        orderId: selectedOrderForReview?.id || "",
        productId: selectedItemForReview?.id || selectedItemForReview?.productId || "",
        productName: selectedItemForReview?.name || "",
        productImage: selectedItemForReview?.image || "",
        userId: user?.uid || "",
        userEmail: user?.email || "",
        createdAt: serverTimestamp(),
        visible: true
      };

      await addDoc(collection(db, "reviews"), reviewData);

      if (selectedOrderForReview?.id) {
        setReviewedItemMap(prev => ({
          ...prev,
          [`${selectedOrderForReview.id}_${selectedItemForReview?.name || 'all'}`]: true
        }));
      }

      setReviewSuccess(true);
      setTimeout(() => {
        setShowReviewModal(false);
        setReviewSuccess(false);
      }, 2000);
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Failed to submit review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    if (queryId) {
      setActiveTabMode("tracking");
      setTrackingInput(queryId);
      handleTrackLookup(queryId);
    }
  }, [queryId]);

  // Filter History Orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items?.some((item) =>
        item.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );

    if (!matchesSearch) return false;

    if (statusFilter === "all") return true;
    if (statusFilter === "paid") return order.paymentStatus?.toLowerCase().includes("paid") || order.paymentMethod?.toLowerCase().includes("razorpay");
    if (statusFilter === "cod") return order.paymentMethod?.toLowerCase().includes("cod");
    return true;
  });

  const breadcrumbLinks = [
    { name: "Home", href: "/" },
    { name: "My Account", href: "/account" },
    { name: "Order & Tracking Hub", href: "/orders", active: true },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-2 border-[#14111E] border-t-[#C8A46A] rounded-full animate-spin" />
        <p className="text-xs uppercase tracking-[0.35em] font-bold text-[#14111E] font-sans">
          Fetching Velouraz Orders & Shipments...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F5] font-sans text-[#14111E] pt-32 pb-28 selection:bg-[#14111E] selection:text-[#FBF9F5]">

      <Breadcrumb
        title="Orders & Live Tracking"
        subtitle="Manage your acquisitions, download tax invoices, and track Shiprocket deliveries in real time."
        bgImage="https://images.unsplash.com/photo-1544027993-37dbfe43552e?auto=format&fit=crop&q=80&w=1600"
        links={breadcrumbLinks}
      />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-8">

        {/* Main Mode Toggle Header Bar */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5D7C5] shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#E5D7C5] pb-6">
            <div>
              <span className="text-[14px] uppercase tracking-[0.25em] font-bold text-[#C8A46A] block font-sans">
                Velouraz Concierge Portal
              </span>
              <h1 className="font-serif text-3xl font-normal text-[#14111E]">
                {activeTabMode === "history" ? "Acquisition History" : "Shiprocket Live Shipment Tracker"}
              </h1>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center bg-[#F6F2EC] p-1.5 rounded-2xl border border-[#E5D7C5] w-full md:w-auto">
              <button
                onClick={() => {
                  setActiveTabMode("history");
                  setSearchParams({});
                }}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 font-sans cursor-pointer flex items-center justify-center gap-2 ${activeTabMode === "history"
                  ? "bg-[#14111E] text-[#FBF9F5] shadow-xs border border-[#C8A46A]/30"
                  : "text-[#786C60] hover:text-[#14111E]"
                  }`}
              >
                <Package size={15} className={activeTabMode === "history" ? "text-[#C8A46A]" : ""} />
                <span>My Purchases ({orders.length})</span>
              </button>

              <button
                onClick={() => {
                  setActiveTabMode("tracking");
                  if (orders.length > 0 && !trackingInput) {
                    const firstId = orders[0].id;
                    setTrackingInput(firstId);
                    handleTrackLookup(firstId);
                  }
                }}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 font-sans cursor-pointer flex items-center justify-center gap-2 ${activeTabMode === "tracking"
                  ? "bg-[#14111E] text-[#FBF9F5] shadow-xs border border-[#C8A46A]/30"
                  : "text-[#786C60] hover:text-[#14111E]"
                  }`}
              >
                <Truck size={15} className={activeTabMode === "tracking" ? "text-[#C8A46A]" : ""} />
                <span>Shiprocket Tracker</span>
              </button>
            </div>
          </div>

          {/* Sub-Filters for History Mode */}
          {activeTabMode === "history" && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {[
                  { id: "all", label: "All Purchases" },
                  { id: "paid", label: "Paid Online" },
                  { id: "cod", label: "Cash on Delivery" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all font-sans cursor-pointer ${statusFilter === tab.id
                      ? "bg-[#14111E] text-[#FBF9F5] border border-[#C8A46A]/30"
                      : "bg-[#F6F2EC] text-[#786C60] border border-[#E5D7C5] hover:text-[#14111E]"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#786C60]" />
                <input
                  type="text"
                  placeholder="Search by Order Reference or Item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#F6F2EC] border border-[#E5D7C5] rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-[#14111E] transition-all text-[#14111E] font-sans"
                />
              </div>
            </div>
          )}
        </div>

        {/* MODE 1: ACQUISITION HISTORY LIST */}
        {activeTabMode === "history" && (
          filteredOrders.length > 0 ? (
            <div className="space-y-6">
              {filteredOrders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl border border-[#E5D7C5] p-6 sm:p-8 shadow-xs space-y-6 hover:border-[#C8A46A] transition-all duration-300"
                >
                  {/* Order Card Header */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#E5D7C5] pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-[14px] font-bold uppercase tracking-widest text-[#786C60] font-sans">
                          Order Reference
                        </span>
                        <span className="px-3 py-0.5 bg-[#14111E] text-[#FBF9F5] text-[14px] font-bold uppercase tracking-wider rounded-full font-sans border border-[#C8A46A]/30">
                          {order.orderStatus || order.paymentStatus || "Paid"}
                        </span>
                      </div>
                      <p className="text-sm font-bold font-mono text-[#14111E]">#{order.id}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-xs text-[#786C60] font-sans">
                      <div>
                        <p className="text-[14px] uppercase font-bold text-[#786C60] tracking-wider">Order Date</p>
                        <p className="font-semibold text-[#14111E] mt-0.5">
                          {new Date(order.createdAt?.seconds * 1000 || order.orderDate || Date.now()).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="h-6 w-px bg-[#E5D7C5] hidden sm:block" />
                      <div>
                        <p className="text-[14px] uppercase font-bold text-[#786C60] tracking-wider">Payment Method</p>
                        <p className="font-semibold text-[#14111E] uppercase mt-0.5">{order.paymentMethod || "Online"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-3">
                    {order.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-4 p-3 rounded-2xl bg-[#F6F2EC] border border-[#E5D7C5]"
                      >
                        <img
                          src={item.image || '/img/jewellery/j.png'}
                          alt={item.name}
                          className="w-16 h-20 rounded-xl object-cover border border-[#E5D7C5] shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-serif text-base font-normal text-[#14111E] truncate">{item.name}</h4>
                          <p className="text-xs text-[#786C60] font-sans pt-0.5">Quantity: {item.quantity || 1}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold font-sans text-[#14111E] block">
                            ₹{(Number(item.price || 0) * (item.quantity || 1)).toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenReviewModal(order, item)}
                            className="text-[14px] font-sans font-semibold text-[#B89355] hover:text-[#2A2623] hover:underline inline-flex items-center gap-1 mt-1 justify-end cursor-pointer"
                          >
                            <Star size={11} className="fill-[#B89355]" /> Review Item
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pt-4 border-t border-[#E5D7C5]">
                    <div>
                      <span className="text-[14px] uppercase font-bold text-[#786C60] font-sans tracking-wider">Total Amount</span>
                      <p className="text-xl font-serif font-normal text-[#14111E]">
                        ₹{Number(order.totalAmount || order.total || 0).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        onClick={() => handleOpenReviewModal(order)}
                        className="px-4 py-2.5 bg-[#FAF3E8] border border-[#C8A46A]/50 text-[#8B6B38] text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#14111E] hover:text-[#FAF6F0] hover:border-[#14111E] transition-all flex items-center gap-1.5 font-sans cursor-pointer shadow-xs"
                      >
                        <Star size={14} className="text-[#B89355] fill-[#B89355]" /> Write Review
                      </button>

                      <button
                        onClick={() => {
                          setActiveTabMode("tracking");
                          setTrackingInput(order.id);
                          handleTrackLookup(order.id);
                        }}
                        className="px-4 py-2.5 bg-[#14111E] border border-[#14111E] text-[#FBF9F5] text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#251D33] transition-all flex items-center gap-1.5 font-sans cursor-pointer shadow-xs"
                      >
                        <Truck size={14} className="text-[#C8A46A]" /> Shiprocket Track
                      </button>

                      <button
                        onClick={() => { setSelectedOrder(order); setShowDetailModal(true); }}
                        className="px-4 py-2.5 border border-[#E5D7C5] bg-white text-[#14111E] text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#F6F2EC] transition-all flex items-center gap-1.5 font-sans cursor-pointer"
                      >
                        <Eye size={14} /> Receipt
                      </button>

                      <button
                        onClick={() => generateInvoicePDF(order)}
                        className="px-4 py-2.5 bg-white border border-[#E5D7C5] text-[#14111E] text-xs font-bold uppercase tracking-wider rounded-xl hover:border-[#14111E] transition-all flex items-center gap-1.5 font-sans cursor-pointer"
                      >
                        <Download size={14} className="text-[#C8A46A]" /> Tax Invoice
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-16 border border-[#E5D7C5] shadow-xs text-center space-y-4">
              <ShoppingBag size={48} className="mx-auto text-[#C8A46A]/60" />
              <h3 className="font-serif text-2xl text-[#14111E] font-normal">No acquisitions found</h3>
              <p className="text-xs text-[#786C60] font-serif italic max-w-sm mx-auto">
                {searchQuery ? "No orders match your search query." : "You have not placed any orders with House of Velouraz yet."}
              </p>
              <Link
                to="/shop"
                className="inline-block px-7 py-3.5 bg-[#14111E] text-[#FBF9F5] text-xs font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-[#251D33] transition-all font-sans cursor-pointer border border-[#C8A46A]/30"
              >
                Explore Boutique Catalogue
              </Link>
            </div>
          )
        )}

        {/* MODE 2: SHIPROCKET LIVE TRACKER PAGE */}
        {activeTabMode === "tracking" && (
          <div className="space-y-8">
            {/* Search Input Box */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5D7C5] shadow-xs space-y-4 text-center">
              <div className="max-w-md mx-auto space-y-1">
                <span className="text-[14px] uppercase font-bold tracking-[0.25em] text-[#C8A46A] font-sans flex items-center justify-center gap-1.5">
                  <Truck size={13} /> Direct Logistics Lookup
                </span>
                <h3 className="font-serif text-2xl text-[#14111E]">Check Shiprocket Tracking Status</h3>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleTrackLookup(trackingInput);
                }}
                className="max-w-xl mx-auto flex gap-2"
              >
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#786C60]" />
                  <input
                    type="text"
                    placeholder="Enter Order ID or Shiprocket AWB (e.g. SR-VEL-...)"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#F6F2EC] border border-[#E5D7C5] rounded-xl text-xs outline-none focus:border-[#14111E] transition-all text-[#14111E] font-sans"
                  />
                </div>
                <button
                  type="submit"
                  disabled={trackingLoading}
                  className="px-6 py-3 bg-[#14111E] text-[#FBF9F5] text-xs font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-[#251D33] transition-all flex items-center gap-2 cursor-pointer shadow-xs border border-[#C8A46A]/30 font-sans shrink-0"
                >
                  {trackingLoading ? <RefreshCw size={14} className="animate-spin" /> : <Truck size={14} className="text-[#C8A46A]" />}
                  <span>{trackingLoading ? "Fetching..." : "Track"}</span>
                </button>
              </form>

              {trackingError && (
                <p className="text-xs text-rose-600 font-serif italic pt-1">{trackingError}</p>
              )}
            </div>

            {/* Tracking Output Details */}
            {trackingInfo && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

                {/* Status Summary Bar */}
                <div className="bg-white rounded-3xl border border-[#E5D7C5] p-6 sm:p-8 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-6 text-center md:text-left">
                  <div>
                    <span className="text-[14px] uppercase font-bold tracking-[0.2em] text-[#786C60] block font-sans">
                      AWB Tracking Code
                    </span>
                    <p className="text-xs font-bold font-mono text-[#14111E] mt-1">
                      {trackingInfo.awbNumber}
                    </p>
                  </div>

                  <div>
                    <span className="text-[14px] uppercase font-bold tracking-[0.2em] text-[#786C60] block font-sans">
                      Carrier Partner
                    </span>
                    <p className="text-xs font-bold text-[#14111E] mt-1 font-sans flex items-center justify-center md:justify-start gap-1.5">
                      <Building size={13} className="text-[#C8A46A]" /> {trackingInfo.courierName}
                    </p>
                  </div>

                  <div>
                    <span className="text-[14px] uppercase font-bold tracking-[0.2em] text-[#786C60] block font-sans">
                      Est. Delivery Date
                    </span>
                    <p className="text-xs font-bold text-emerald-800 mt-1 font-sans flex items-center justify-center md:justify-start gap-1.5">
                      <Calendar size={13} className="text-[#C8A46A]" /> {trackingInfo.estimatedDelivery}
                    </p>
                  </div>

                  <div>
                    <span className="text-[14px] uppercase font-bold tracking-[0.2em] text-[#786C60] block font-sans">
                      Current Dispatch Status
                    </span>
                    <span className="inline-block mt-1 px-3 py-1 bg-[#14111E] text-[#FBF9F5] text-[14px] font-bold uppercase tracking-wider rounded-full font-sans border border-[#C8A46A]/30">
                      {trackingInfo.currentStatus}
                    </span>
                  </div>
                </div>

                {/* Timeline Progress */}
                <div className="bg-white rounded-3xl border border-[#E5D7C5] p-6 sm:p-10 shadow-xs space-y-6">
                  <h3 className="font-serif text-2xl text-[#14111E] font-normal flex items-center gap-2">
                    <Sparkles size={18} className="text-[#C8A46A]" /> Shiprocket Real-Time Logistics Timeline
                  </h3>

                  <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3.5 sm:before:left-4.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E5D7C5]">
                    {trackingInfo.timeline.map((step, idx) => (
                      <div key={idx} className="relative flex items-start gap-4">
                        <div
                          className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs transition-all ${step.completed
                            ? "bg-[#14111E] border-[#C8A46A] text-[#FBF9F5]"
                            : "bg-white border-[#E5D7C5] text-[#9E9082]"
                            }`}
                        >
                          {step.completed ? <CheckCircle2 size={13} className="text-[#C8A46A]" /> : <Clock size={12} />}
                        </div>

                        <div className="space-y-1">
                          <h4 className={`text-xs sm:text-sm font-bold tracking-wide font-sans ${step.completed ? "text-[#14111E]" : "text-[#9E9082]"}`}>
                            {step.title}
                          </h4>
                          <p className="text-xs text-[#786C60] font-serif italic">
                            {step.location} • <span className="font-sans text-[14px] not-italic">{step.timestamp}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Associated Order Breakdown */}
                {trackingOrderData && (
                  <div className="bg-white rounded-3xl border border-[#E5D7C5] p-6 sm:p-8 shadow-xs space-y-6">
                    <div className="flex justify-between items-center border-b border-[#E5D7C5] pb-4">
                      <div>
                        <span className="text-[14px] uppercase font-bold tracking-[0.2em] text-[#C8A46A] block font-sans">
                          Order Breakdown
                        </span>
                        <h4 className="font-serif text-xl text-[#14111E]">Order #{trackingOrderData.id}</h4>
                      </div>

                      <button
                        onClick={() => generateInvoicePDF(trackingOrderData)}
                        className="px-4 py-2 bg-[#F6F2EC] border border-[#E5D7C5] text-[#14111E] text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#14111E] hover:text-[#FBF9F5] transition-all flex items-center gap-2 cursor-pointer font-sans"
                      >
                        <Download size={14} className="text-[#C8A46A]" /> Tax Invoice
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-[#F6F2EC] p-5 rounded-2xl border border-[#E5D7C5] space-y-2">
                        <span className="text-[14px] font-bold uppercase tracking-wider text-[#14111E] font-sans flex items-center gap-1.5">
                          <MapPin size={13} className="text-[#C8A46A]" /> Destination Address
                        </span>
                        <p className="text-xs font-bold text-[#14111E] font-sans">{trackingOrderData.customerName || trackingOrderData.shippingAddress?.name}</p>
                        <p className="text-xs text-[#786C60] font-serif">{trackingOrderData.shippingAddress?.fullAddress || `${trackingOrderData.shippingAddress?.address}, ${trackingOrderData.shippingAddress?.city} - ${trackingOrderData.shippingAddress?.pincode}`}</p>
                      </div>

                      <div className="bg-[#F6F2EC] p-5 rounded-2xl border border-[#E5D7C5] space-y-3">
                        <span className="text-[14px] font-bold uppercase tracking-wider text-[#14111E] font-sans flex items-center gap-1.5">
                          <Package size={13} className="text-[#C8A46A]" /> Items List ({(trackingOrderData.items || []).length})
                        </span>
                        <div className="space-y-2 max-h-32 overflow-y-auto no-scrollbar">
                          {(trackingOrderData.items || []).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs font-sans border-b border-[#E5D7C5]/50 pb-1.5">
                              <span className="font-medium text-[#14111E] truncate max-w-[200px]">{item.name} × {item.quantity || 1}</span>
                              <span className="font-bold text-[#14111E]">₹{(Number(item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

          </div>
        )}

      </div>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {showDetailModal && selectedOrder && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailModal(false)}
              className="fixed inset-0 bg-[#0B0711]/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-10 border border-[#E5D7C5] shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center border-b border-[#E5D7C5] pb-4">
                <div>
                  <span className="text-[14px] font-bold uppercase tracking-wider text-[#C8A46A] font-sans">Velouraz Acquisition Receipt</span>
                  <h3 className="font-serif text-xl font-bold font-mono text-[#14111E]">#{selectedOrder.id}</h3>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="p-2 text-gray-400 hover:text-black">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#786C60] font-sans">Purchased Items</h4>
                <div className="space-y-2 divide-y divide-[#E5D7C5]">
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} className="pt-2 flex items-center gap-3">
                      <img src={item.image || '/img/jewellery/j.png'} alt={item.name} className="w-12 h-14 rounded-xl object-cover border border-[#E5D7C5]" />
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-base text-[#14111E] truncate">{item.name}</p>
                        <p className="text-xs text-[#786C60] font-sans">Qty: {item.quantity || 1}</p>
                      </div>
                      <span className="text-xs font-bold font-sans text-[#14111E]">
                        ₹{(Number(item.price || 0) * (item.quantity || 1)).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#F6F2EC] p-4 rounded-xl border border-[#E5D7C5] space-y-2 text-xs font-sans">
                <h4 className="font-bold text-[#14111E] uppercase tracking-wider text-[14px]">Shipping & Payment Info</h4>
                <p><span className="font-bold text-[#14111E]">{selectedOrder.customerName || selectedOrder.shippingAddress?.name}</span> ({selectedOrder.phone || selectedOrder.shippingAddress?.phone})</p>
                <p>{selectedOrder.shippingAddress?.fullAddress || `${selectedOrder.shippingAddress?.address}, ${selectedOrder.shippingAddress?.city} - ${selectedOrder.shippingAddress?.pincode}`}</p>
                <p className="pt-1 text-[14px]">Payment Method: <span className="font-bold text-[#14111E] uppercase">{selectedOrder.paymentMethod} ({selectedOrder.paymentStatus})</span></p>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-[#E5D7C5]">
                <button
                  onClick={() => generateInvoicePDF(selectedOrder)}
                  className="px-4 py-2 bg-[#14111E] text-[#FBF9F5] text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#251D33] transition-all flex items-center gap-1.5 font-sans"
                >
                  <Download size={14} className="text-[#C8A46A]" /> Download Tax Invoice
                </button>
                <div className="text-right font-sans">
                  <span className="text-[14px] font-bold uppercase tracking-wider text-[#786C60]">Grand Total</span>
                  <p className="text-lg font-serif font-bold text-[#14111E]">₹{Number(selectedOrder.totalAmount || selectedOrder.total || 0).toLocaleString()}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REVIEW MODAL */}
      <AnimatePresence>
        {showReviewModal && selectedOrderForReview && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReviewModal(false)}
              className="fixed inset-0 bg-[#0B0711]/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto relative z-10 border border-[#E5D7C5] shadow-2xl space-y-6"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start border-b border-[#E5D7C5] pb-4">
                <div>
                  <span className="text-[14px] font-bold uppercase tracking-[0.2em] text-[#C8A46A] font-sans flex items-center gap-1.5">
                    <Sparkles size={12} /> Share Your Experience
                  </span>
                  <h3 className="font-serif text-2xl font-normal text-[#14111E]">Product & Order Review</h3>
                  <p className="text-xs text-[#786C60] font-serif italic mt-0.5">
                    Your review will be featured on our homepage story section.
                  </p>
                </div>
                <button onClick={() => setShowReviewModal(false)} className="p-2 text-gray-400 hover:text-black">
                  <X size={18} />
                </button>
              </div>

              {reviewSuccess ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                    <Check size={28} />
                  </div>
                  <h4 className="font-serif text-2xl text-[#14111E]">Thank You for Your Review!</h4>
                  <p className="text-xs text-[#786C60] font-serif italic max-w-xs mx-auto">
                    Your luxury feedback has been recorded and will appear live on our homepage.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-5">
                  {/* Select Item (if order has items) */}
                  {selectedOrderForReview.items?.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-[14px] uppercase font-bold tracking-wider text-[#786C60] font-sans block">
                        Select Item to Review
                      </label>
                      <div className="grid grid-cols-1 gap-2 max-h-36 overflow-y-auto pr-1">
                        {selectedOrderForReview.items.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => setSelectedItemForReview(item)}
                            className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${selectedItemForReview?.name === item.name
                              ? "bg-[#FAF3E8] border-[#C8A46A] shadow-xs"
                              : "bg-[#F6F2EC] border-[#E5D7C5] hover:border-[#C8A46A]/50"
                              }`}
                          >
                            <img src={item.image || '/img/jewellery/j.png'} alt={item.name} className="w-10 h-12 rounded-lg object-cover border border-[#E5D7C5]" />
                            <div className="flex-1 min-w-0">
                              <p className="font-serif text-sm text-[#14111E] truncate">{item.name}</p>
                              <p className="text-[14px] text-[#786C60] font-sans">₹{(Number(item.price || 0)).toLocaleString()}</p>
                            </div>
                            {selectedItemForReview?.name === item.name && (
                              <Check size={16} className="text-[#C8A46A] shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rating Stars */}
                  <div className="space-y-1.5 text-center bg-[#FAF6F0] p-4 rounded-2xl border border-[#E8DFC8]">
                    <label className="text-[14px] uppercase font-bold tracking-[0.2em] text-[#8B6B38] font-sans block">
                      Your Rating
                    </label>
                    <div className="flex justify-center gap-2 pt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                          className="p-1 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            size={26}
                            className={`${star <= reviewForm.rating
                              ? "fill-[#B89355] text-[#B89355]"
                              : "text-gray-300"
                              } transition-colors`}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-[14px] font-sans font-semibold text-[#8B6B38] pt-1">
                      {reviewForm.rating === 5 && "✦ Royal Excellence (5/5)"}
                      {reviewForm.rating === 4 && "✦ Very Satisfied (4/5)"}
                      {reviewForm.rating === 3 && "✦ Satisfied (3/5)"}
                      {reviewForm.rating === 2 && "✦ Fair (2/5)"}
                      {reviewForm.rating === 1 && "✦ Poor (1/5)"}
                    </p>
                  </div>

                  {/* Name & Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[14px] uppercase font-bold tracking-wider text-[#786C60] font-sans block mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ananya Sharma"
                        value={reviewForm.customerName}
                        onChange={(e) => setReviewForm({ ...reviewForm, customerName: e.target.value })}
                        className="w-full bg-[#F6F2EC] border border-[#E5D7C5] rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#14111E] text-[#14111E] font-sans"
                      />
                    </div>
                    <div>
                      <label className="text-[14px] uppercase font-bold tracking-wider text-[#786C60] font-sans block mb-1">
                        Location / City
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Mumbai, India"
                        value={reviewForm.location}
                        onChange={(e) => setReviewForm({ ...reviewForm, location: e.target.value })}
                        className="w-full bg-[#F6F2EC] border border-[#E5D7C5] rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#14111E] text-[#14111E] font-sans"
                      />
                    </div>
                  </div>

                  {/* Review Title */}
                  <div>
                    <label className="text-[14px] uppercase font-bold tracking-wider text-[#786C60] font-sans block mb-1">
                      Review Title / Badge
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Verified Buyer, Stunning Kundan Choker!"
                      value={reviewForm.headline}
                      onChange={(e) => setReviewForm({ ...reviewForm, headline: e.target.value })}
                      className="w-full bg-[#F6F2EC] border border-[#E5D7C5] rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#14111E] text-[#14111E] font-sans"
                    />
                  </div>

                  {/* Review Quote Text */}
                  <div>
                    <label className="text-[14px] uppercase font-bold tracking-wider text-[#786C60] font-sans block mb-1">
                      Your Review / Story
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Share details about the quality, anti-tarnish finish, weight, and packaging of your acquisition..."
                      value={reviewForm.quote}
                      onChange={(e) => setReviewForm({ ...reviewForm, quote: e.target.value })}
                      className="w-full bg-[#F6F2EC] border border-[#E5D7C5] rounded-xl p-3.5 text-xs outline-none focus:border-[#14111E] text-[#14111E] font-sans resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full py-3.5 bg-[#14111E] text-[#FBF9F5] text-xs font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-[#251D33] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md border border-[#C8A46A]/30 font-sans"
                  >
                    {submittingReview ? (
                      <RefreshCw size={14} className="animate-spin text-[#C8A46A]" />
                    ) : (
                      <Send size={14} className="text-[#C8A46A]" />
                    )}
                    <span>{submittingReview ? "Submitting..." : "Publish Review to Homepage"}</span>
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Orders;
