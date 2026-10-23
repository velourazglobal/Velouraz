import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { db } from "../components/Firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { motion } from "framer-motion";
import {
  Truck,
  Package,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  ArrowLeft,
  ShieldCheck,
  Calendar,
  ExternalLink,
  Sparkles,
  RefreshCw,
  FileText,
  Building
} from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";
import { trackShiprocketOrder } from "../services/shiprocketService";
import { generateInvoicePDF } from "../utils/invoice";

const OrderTracking = () => {
  const { id: routeId } = useParams();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get("id") || routeId || "";

  const [inputQuery, setInputQuery] = useState(queryId);
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeSearchId, setActiveSearchId] = useState(queryId);

  const handleTrack = async (searchId) => {
    const targetId = String(searchId || inputQuery).trim();
    if (!targetId) {
      setErrorMsg("Please enter a valid Order Reference or Shiprocket AWB Number.");
      return;
    }

    setActiveSearchId(targetId);
    setLoading(true);
    setErrorMsg("");
    setOrderData(null);

    try {
      // 1. Check if Order exists in Firestore
      const docRef = doc(db, "orders", targetId);
      const snap = await getDoc(docRef);

      let foundOrder = null;
      if (snap.exists()) {
        foundOrder = { id: snap.id, ...snap.data() };
        setOrderData(foundOrder);
      }

      // 2. Fetch Live Shiprocket Tracking
      const tracking = await trackShiprocketOrder(targetId);
      setTrackingInfo(tracking);

      if (!foundOrder && !tracking.success) {
        setErrorMsg("No active shipment found with reference code #" + targetId);
      }
    } catch (err) {
      console.error("Tracking lookup error:", err);
      setErrorMsg("Error fetching tracking status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Real-time Firestore subscription to order status updates
  useEffect(() => {
    if (!activeSearchId) return undefined;

    const docRef = doc(db, "orders", activeSearchId);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setOrderData({ id: docSnap.id, ...docSnap.data() });
        }
      },
      (err) => {
        console.warn("Order tracking real-time listener notice:", err);
      }
    );

    return () => unsubscribe();
  }, [activeSearchId]);

  useEffect(() => {
    if (queryId) {
      handleTrack(queryId);
    }
  }, [queryId]);

  const breadcrumbLinks = [
    { name: "Home", href: "/" },
    { name: "Orders", href: "/orders" },
    { name: "Live Shipment Tracking", href: "/track-order", active: true },
  ];

  return (
    <div className="min-h-screen bg-[#FBF9F5] font-sans text-[#14111E] pt-32 pb-28 selection:bg-[#14111E] selection:text-[#FBF9F5]">

      <Breadcrumb
        title="Live Shipment Tracking"
        subtitle="Real-time Shiprocket logistics tracking for your handcrafted Velouraz acquisitions."
        bgImage="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=1600"
        links={breadcrumbLinks}
      />

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-8">

        {/* Search Header Container */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E5D7C5] shadow-xs text-center space-y-6">
          <div className="max-w-xl mx-auto space-y-2">
            <span className="text-xs uppercase tracking-[0.3em] font-bold text-[#C8A46A] flex items-center justify-center gap-2">
              <Truck size={14} /> Shiprocket Express Courier Tracking
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#14111E]">
              Track Your Masterpiece
            </h1>
            <p className="text-xs sm:text-sm text-[#786C60] font-serif italic">
              Enter your Order Reference ID or Shiprocket AWB Tracking Code below to check real-time dispatch progress.
            </p>
          </div>

          {/* Search Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTrack(inputQuery);
            }}
            className="max-w-xl mx-auto flex gap-2"
          >
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#786C60]" />
              <input
                type="text"
                placeholder="e.g. VEL-104928 or SR-VEL-104928"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-[#FBF9F5] border border-[#E5D7C5] rounded-xl text-xs sm:text-sm outline-none focus:border-[#14111E] transition-all font-sans text-[#14111E]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3.5 bg-[#14111E] text-[#FBF9F5] text-xs font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-[#251D33] transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-xs border border-[#C8A46A]/30 shrink-0 font-sans"
            >
              {loading ? <RefreshCw size={15} className="animate-spin" /> : <Truck size={15} className="text-[#C8A46A]" />}
              <span>{loading ? "Searching..." : "Track"}</span>
            </button>
          </form>

          {errorMsg && (
            <p className="text-xs text-rose-600 font-serif italic pt-1">{errorMsg}</p>
          )}
        </div>

        {/* Tracking Details & Timeline View */}
        {trackingInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Overview Card */}
            <div className="bg-white rounded-3xl border border-[#E5D7C5] p-6 sm:p-8 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-6 text-center md:text-left">
              <div>
                <span className="text-[14px] uppercase font-bold tracking-[0.2em] text-[#786C60] block font-sans">
                  Tracking Code (AWB)
                </span>
                <p className="text-sm font-bold font-mono text-[#14111E] mt-1">
                  {trackingInfo.awbNumber}
                </p>
              </div>

              <div>
                <span className="text-[14px] uppercase font-bold tracking-[0.2em] text-[#786C60] block font-sans">
                  Logistics Carrier
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
                  Current Status
                </span>
                <span className="inline-block mt-1 px-3 py-1 bg-[#14111E] text-[#FBF9F5] text-[14px] font-bold uppercase tracking-wider rounded-full font-sans border border-[#C8A46A]/30">
                  {trackingInfo.currentStatus}
                </span>
              </div>
            </div>

            {/* Visual Timeline Section */}
            <div className="bg-white rounded-3xl border border-[#E5D7C5] p-6 sm:p-10 shadow-xs space-y-8">
              <h3 className="font-serif text-2xl text-[#14111E] font-normal flex items-center gap-2">
                <Sparkles size={18} className="text-[#C8A46A]" /> Live Delivery Progress
              </h3>

              {/* Progress Steps List */}
              <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3.5 sm:before:left-4.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E5D7C5]">
                {trackingInfo.timeline.map((step, idx) => (
                  <div key={idx} className="relative flex items-start gap-4">
                    {/* Status Dot */}
                    <div
                      className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs transition-all ${step.completed
                        ? "bg-[#14111E] border-[#C8A46A] text-[#FBF9F5] shadow-xs"
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

            {/* Order Items & Shipping Address Breakdown (If available) */}
            {orderData && (
              <div className="bg-white rounded-3xl border border-[#E5D7C5] p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E5D7C5] pb-4">
                  <div>
                    <span className="text-[14px] uppercase font-bold tracking-[0.2em] text-[#C8A46A] block font-sans">
                      Associated Order Details
                    </span>
                    <h4 className="font-serif text-xl text-[#14111E]">Order #{orderData.id}</h4>
                  </div>

                  <button
                    onClick={() => generateInvoicePDF(orderData)}
                    className="px-4 py-2 bg-[#FBF9F5] border border-[#E5D7C5] text-[#14111E] text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#14111E] hover:text-[#FBF9F5] transition-all flex items-center gap-2 cursor-pointer font-sans"
                  >
                    <FileText size={14} className="text-[#C8A46A]" /> Download Tax Invoice PDF
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Shipping Address */}
                  <div className="bg-[#F6F2EC] p-5 rounded-2xl border border-[#E5D7C5] space-y-2">
                    <span className="text-[14px] font-bold uppercase tracking-wider text-[#14111E] font-sans flex items-center gap-1.5">
                      <MapPin size={13} className="text-[#C8A46A]" /> Delivery Address
                    </span>
                    <p className="text-xs font-bold text-[#14111E] font-sans">{orderData.customerName || orderData.shippingAddress?.name}</p>
                    <p className="text-xs text-[#786C60] font-serif">{orderData.shippingAddress?.fullAddress || `${orderData.shippingAddress?.address}, ${orderData.shippingAddress?.city} - ${orderData.shippingAddress?.pincode}`}</p>
                    <p className="text-xs text-[#786C60] font-sans">Phone: {orderData.phone || orderData.shippingAddress?.phone}</p>
                  </div>

                  {/* Items List */}
                  <div className="bg-[#F6F2EC] p-5 rounded-2xl border border-[#E5D7C5] space-y-3">
                    <span className="text-[14px] font-bold uppercase tracking-wider text-[#14111E] font-sans flex items-center gap-1.5">
                      <Package size={13} className="text-[#C8A46A]" /> Purchased Creations ({(orderData.items || []).length})
                    </span>
                    <div className="space-y-2 max-h-36 overflow-y-auto no-scrollbar">
                      {(orderData.items || []).map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs font-sans border-b border-[#E5D7C5]/50 pb-1.5">
                          <span className="font-medium text-[#14111E] truncate max-w-[200px]">{item.name} × {item.quantity || 1}</span>
                          <span className="font-bold text-[#14111E]">₹{(Number(item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold font-sans pt-1 border-t border-[#E5D7C5]">
                      <span>Total Paid:</span>
                      <span className="text-[#14111E]">₹{Number(orderData.totalAmount || orderData.total || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center pt-2">
              <Link
                to="/orders"
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#14111E] hover:text-[#C8A46A] transition-colors font-sans"
              >
                <ArrowLeft size={14} /> Back to All Purchases
              </Link>
            </div>

          </motion.div>
        )}

      </div>
    </div>
  );
};

export default OrderTracking;
