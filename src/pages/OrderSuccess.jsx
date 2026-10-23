import React, { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { db } from "../components/Firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  CheckCircle2,
  PackageCheck,
  Truck,
  Mail,
  MapPin,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Clock
} from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";
import { motion } from "framer-motion";

const OrderSuccess = () => {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isNewAccountCreated = Boolean(location.state?.isNewUser);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const docRef = doc(db, "orders", id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setOrder({ id: snap.id, ...snap.data() });
        } else {
          setError("Order details not found.");
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order information.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#C8A46A]"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] py-20 px-6 text-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-[#E8DFD5] shadow-sm">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-serif text-[#2e0e43] mb-2">Order Confirmed</h2>
          <p className="text-sm text-[#7B6D63] mb-6">Your payment was processed successfully.</p>
          <Link
            to="/shop"
            className="inline-flex items-center justify-center gap-2 bg-[#2e0e43] text-white px-6 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-[#C8A46A] transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const {
    orderNumber,
    customerName,
    email,
    phone,
    shippingAddress,
    items = [],
    subtotal,
    shippingFee,
    discountAmount,
    total,
    paymentStatus,
    paymentMethod,
    createdAt
  } = order;

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-[#2A2623]">
      <Breadcrumb
        title="Order Confirmation"
        subtitle="Thank you for choosing Velouraz High Jewellery"
        bgImage="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1600"
        links={[
          { name: "Home", href: "/" },
          { name: "Checkout", href: "/checkout" },
          { name: "Confirmation", href: "#", active: true },
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header Banner */}
          <div className="bg-white rounded-3xl p-8 border border-[#E8DFD5] shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2e0e43] via-[#C8A46A] to-[#2e0e43]" />

            <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-inner">
              <CheckCircle2 size={40} />
            </div>

            <span className="text-xs font-sans font-semibold uppercase tracking-[0.25em] text-[#C8A46A] block mb-1">
              Payment Successful
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif text-[#2e0e43] font-normal mb-3">
              Thank You, {customerName}!
            </h1>
            <p className="text-base text-[#7B6D63] font-serif max-w-md mx-auto mb-6">
              Your order <strong className="text-[#2e0e43] font-sans">#{orderNumber}</strong> has been confirmed and is now being crafted with utmost care.
            </p>

            {/* Account Creation Banner if Guest Converted */}
            {isNewAccountCreated && (
              <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#C8A46A]/40 text-left max-w-lg mx-auto mb-6 flex items-start gap-3">
                <UserCheck size={20} className="text-[#C8A46A] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#2e0e43]">Account Created Automatically</h4>
                  <p className="text-xs text-[#7B6D63] font-serif mt-0.5">
                    Your personal Velouraz account has been created. You can use Email OTP anytime to log in and track your orders.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-sans">
              <span className="bg-[#FAF6F0] border border-[#E8DFD5] px-4 py-2 rounded-full text-[#7B6D63]">
                Confirmation sent to: <strong className="text-[#2e0e43]">{email}</strong>
              </span>
              <span className="bg-emerald-50 border border-emerald-200/60 px-4 py-2 rounded-full text-emerald-800 font-medium">
                Payment Status: {paymentStatus || "Paid"}
              </span>
            </div>
          </div>

          {/* Details 2-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Delivery & Shipping Info */}
            <div className="bg-white rounded-3xl p-6 border border-[#E8DFD5] shadow-sm space-y-4">
              <h3 className="text-xs font-semibold text-[#2e0e43] uppercase tracking-[0.2em] font-sans flex items-center gap-2 border-b border-[#F5EFE8] pb-3">
                <Truck size={16} className="text-[#C8A46A]" />
                Delivery Information
              </h3>

              <div className="space-y-2 text-xs font-serif text-[#7B6D63]">
                <p className="font-sans font-medium text-[#2e0e43] text-sm">{customerName}</p>
                <p>{shippingAddress?.flat} {shippingAddress?.address}</p>
                <p>{shippingAddress?.city}, {shippingAddress?.state} - {shippingAddress?.pincode}</p>
                <p>{shippingAddress?.country}</p>
                <p className="pt-2 font-sans text-xs text-[#2e0e43]">Phone: {phone}</p>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-white rounded-3xl p-6 border border-[#E8DFD5] shadow-sm space-y-4">
              <h3 className="text-xs font-semibold text-[#2e0e43] uppercase tracking-[0.2em] font-sans flex items-center gap-2 border-b border-[#F5EFE8] pb-3">
                <ShieldCheck size={16} className="text-[#C8A46A]" />
                Payment & Order Summary
              </h3>

              <div className="space-y-2.5 text-xs font-sans text-[#7B6D63]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-normal text-[#2A2623]">₹{Number(subtotal || 0).toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span className="font-normal">−₹{Number(discountAmount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-normal text-[#2A2623]">
                    {shippingFee === 0 ? "Free" : `₹${shippingFee}`}
                  </span>
                </div>

                <div className="border-t border-[#F5EFE8] pt-3 flex justify-between items-baseline">
                  <span className="font-medium text-sm text-[#2e0e43]">Total Paid</span>
                  {/* Total price font normal as requested */}
                  <span className="text-xl font-normal text-[#2e0e43] tracking-tight">
                    ₹{Number(total || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Purchased Items List */}
          <div className="bg-white rounded-3xl p-6 border border-[#E8DFD5] shadow-sm space-y-4">
            <h3 className="text-xs font-semibold text-[#2e0e43] uppercase tracking-[0.2em] font-sans flex items-center gap-2 border-b border-[#F5EFE8] pb-3">
              <ShoppingBag size={16} className="text-[#C8A46A]" />
              Items Ordered ({items.length})
            </h3>

            <div className="divide-y divide-[#F5EFE8]">
              {items.map((item, idx) => (
                <div key={idx} className="py-4 flex items-center gap-4">
                  <div className="w-16 h-18 rounded-xl bg-[#FAF6F0] overflow-hidden border border-[#E8DFD5] shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-serif font-normal text-[#2e0e43] truncate">{item.name}</h4>
                    <p className="text-xs text-[#7B6D63] font-sans mt-0.5">
                      Qty: {item.quantity || 1} {item.size && `• Size: ${item.size}`} {item.metal && `• ${item.metal}`}
                    </p>
                  </div>
                  <div className="text-right">
                    {/* Item price font normal */}
                    <span className="text-sm font-normal text-[#2e0e43] font-sans">
                      ₹{Number(item.price * (item.quantity || 1)).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to={`/orders`}
              className="w-full sm:w-auto bg-[#2e0e43] text-white px-8 py-4 rounded-xl text-xs font-semibold uppercase tracking-[0.22em] hover:bg-[#1A0829] transition-all shadow-md text-center flex items-center justify-center gap-2"
            >
              <PackageCheck size={16} className="text-[#C8A46A]" />
              <span>Track Order</span>
            </Link>

            <Link
              to="/shop"
              className="w-full sm:w-auto bg-[#FAF6F0] text-[#2e0e43] border border-[#C8A46A]/40 px-8 py-4 rounded-xl text-xs font-semibold uppercase tracking-[0.22em] hover:bg-[#F5EFE8] transition-all text-center flex items-center justify-center gap-2"
            >
              <span>Continue Shopping</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderSuccess;
