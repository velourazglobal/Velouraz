import React, { useState, useMemo } from "react";
import {
  ShoppingBag, Eye, X, Printer, MapPin, Truck, Phone, Mail, User,
  CreditCard, Box, Search, Filter, Copy, Check, ExternalLink, RefreshCw,
  Clock, AlertCircle, ChevronDown, CheckCircle2, FileText, ArrowRight,
  Package, Calendar, Building, Sparkles, Send, ShieldCheck
} from "lucide-react";
import { statusBadgeClasses, ORDER_STATUSES } from "./AdminUtils";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../../../components/Firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import {
  checkCourierServiceability,
  createShiprocketShipment,
  generateShippingLabel,
  generateShippingManifest,
  syncShipmentTracking,
  DEFAULT_PICKUP_LOCATION
} from "../../../services/shiprocketService";

const OrdersTable = ({ orders = [] }) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  // Selection & Modal States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState("");

  // Packed Modal State
  const [packedModalOrder, setPackedModalOrder] = useState(null);
  const [packedForm, setPackedForm] = useState({
    name: "",
    email: "",
    phone: "",
    flat: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    length: "12",
    breadth: "12",
    height: "5",
    weight: "0.35",
    pickupLocation: DEFAULT_PICKUP_LOCATION,
  });
  const [checkingServiceability, setCheckingServiceability] = useState(false);
  const [availableCouriers, setAvailableCouriers] = useState([]);
  const [selectedCourierId, setSelectedCourierId] = useState(null);
  const [packedError, setPackedError] = useState("");
  const [creatingShipment, setCreatingShipment] = useState(false);
  const [shipmentSuccess, setShipmentSuccess] = useState(null);

  // Live Tracking Modal State
  const [trackingModalOrder, setTrackingModalOrder] = useState(null);
  const [trackingSyncLoading, setTrackingSyncLoading] = useState(false);
  const [trackingSyncMessage, setTrackingSyncMessage] = useState("");

  // Copy helper
  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyFeedback(label || "Copied!");
    setTimeout(() => setCopyFeedback(""), 2000);
  };

  // Open Packed Popup / Shipment Modal
  const handleOpenPackedModal = async (order) => {
    setPackedModalOrder(order);
    const addr = order.shippingAddress || {};
    const initialForm = {
      name: order.customerName || addr.name || "",
      email: order.email || addr.email || "",
      phone: order.phone || addr.phone || "",
      flat: addr.flat || "",
      address: addr.address || addr.fullAddress || "",
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.pincode || "",
      country: addr.country || "India",
      length: "12",
      breadth: "12",
      height: "5",
      weight: "0.35",
      pickupLocation: DEFAULT_PICKUP_LOCATION,
    };
    setPackedForm(initialForm);
    setPackedError("");
    setShipmentSuccess(null);
    setAvailableCouriers([]);
    setSelectedCourierId(null);

    // Auto-check courier options if delivery pincode is valid
    if (initialForm.pincode && initialForm.pincode.replace(/\D/g, "").length === 6) {
      fetchCouriers(initialForm.pincode, initialForm.weight);
    }
  };

  // Fetch Couriers from Shiprocket API
  const fetchCouriers = async (pincode, weight) => {
    setCheckingServiceability(true);
    setPackedError("");
    try {
      const res = await checkCourierServiceability({
        pickupPincode: "452014",
        deliveryPincode: pincode,
        weight: weight || "0.35",
      });
      if (res.couriers && res.couriers.length > 0) {
        setAvailableCouriers(res.couriers);
        setSelectedCourierId(res.couriers[0].courier_company_id);
      } else {
        setAvailableCouriers([]);
        setPackedError("No couriers available for this pincode.");
      }
    } catch (err) {
      console.warn("Serviceability check error:", err);
      setPackedError(err.message || "Failed to check courier serviceability.");
    } finally {
      setCheckingServiceability(false);
    }
  };

  // Handle direct Status Change
  const handleStatusChange = async (order, newStatus) => {
    if (!order || !order.id) return;
    if (newStatus === "Packed") {
      // Trigger Packed Modal Workflow instead of immediate update
      handleOpenPackedModal(order);
      return;
    }

    try {
      const orderRef = doc(db, "orders", order.id);
      const nowIso = new Date().toISOString();
      const existingHistory = Array.isArray(order.trackingHistory) ? order.trackingHistory : [];

      const statusEvent = {
        status: newStatus,
        activity: `Order status manually updated to ${newStatus} by administrator.`,
        location: "Velouraz Operations",
        timestamp: nowIso,
      };

      await updateDoc(orderRef, {
        orderStatus: newStatus,
        status: newStatus,
        trackingHistory: [...existingHistory, statusEvent],
        updatedAt: serverTimestamp(),
      });

      // Update currently selected modal order if open
      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder((prev) => ({
          ...prev,
          orderStatus: newStatus,
          status: newStatus,
          trackingHistory: [...existingHistory, statusEvent],
        }));
      }
    } catch (err) {
      console.error("Failed to update order status:", err);
      alert("Failed to update order status: " + err.message);
    }
  };

  // Submit Shipment Creation to Shiprocket
  const handleCreateShipmentSubmit = async (e) => {
    if (e) e.preventDefault();
    if (creatingShipment || !packedModalOrder) return;

    setPackedError("");

    // Validate Package dimensions & weight
    const l = Number(packedForm.length);
    const b = Number(packedForm.breadth);
    const h = Number(packedForm.height);
    const w = Number(packedForm.weight);

    if (isNaN(l) || l <= 0 || isNaN(b) || b <= 0 || isNaN(h) || h <= 0 || isNaN(w) || w <= 0) {
      setPackedError("Please enter valid, positive numbers for dimensions (cm) and weight (kg).");
      return;
    }

    if (!packedForm.name.trim() || !packedForm.phone.trim() || !packedForm.address.trim() || !packedForm.city.trim() || !packedForm.state.trim()) {
      setPackedError("Please fill in all required customer and delivery address fields.");
      return;
    }

    if (packedForm.pincode.replace(/\D/g, "").length !== 6) {
      setPackedError("Please enter a valid 6-digit postal pincode.");
      return;
    }

    setCreatingShipment(true);

    try {
      const result = await createShiprocketShipment({
        orderId: packedModalOrder.id,
        customerDetails: {
          name: packedForm.name.trim(),
          email: packedForm.email.trim(),
          phone: packedForm.phone.replace(/\D/g, ""),
          flat: packedForm.flat.trim(),
          address: packedForm.address.trim(),
          city: packedForm.city.trim(),
          state: packedForm.state.trim(),
          pincode: packedForm.pincode.replace(/\D/g, ""),
          country: packedForm.country.trim() || "India",
        },
        pickupLocation: packedForm.pickupLocation || DEFAULT_PICKUP_LOCATION,
        packageDetails: { length: l, breadth: b, height: h, weight: w },
        courierId: selectedCourierId,
      });

      setShipmentSuccess(result.shipping);

      // Refresh selected order if open
      if (selectedOrder && selectedOrder.id === packedModalOrder.id) {
        setSelectedOrder((prev) => ({
          ...prev,
          orderStatus: "Packed",
          status: "Packed",
          shipping: result.shipping,
          trackingNumber: result.shipping?.awbCode,
        }));
      }

      setTimeout(() => {
        setPackedModalOrder(null);
      }, 1800);
    } catch (err) {
      console.error("Shiprocket shipment creation error:", err);
      setPackedError(err.message || "Failed to create shipment order in Shiprocket.");
    } finally {
      setCreatingShipment(false);
    }
  };

  // Sync Live Tracking from Shiprocket
  const handleSyncTracking = async (order) => {
    if (!order) return;
    setTrackingSyncLoading(true);
    setTrackingSyncMessage("");

    try {
      const targetAwb = order.shipping?.awbCode || order.trackingNumber || "";
      const res = await syncShipmentTracking(order.id, targetAwb);
      setTrackingSyncMessage(`Live tracking refreshed: ${res.currentStatus || "Synchronized"}`);

      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder((prev) => ({
          ...prev,
          shipping: {
            ...prev.shipping,
            status: res.currentStatus,
            trackingUrl: res.trackUrl || prev.shipping?.trackingUrl,
          },
        }));
      }
    } catch (err) {
      console.warn("Tracking sync error:", err);
      setTrackingSyncMessage("Sync error: " + (err.message || "Could not reach tracking API."));
    } finally {
      setTrackingSyncLoading(false);
      setTimeout(() => setTrackingSyncMessage(""), 4000);
    }
  };

  // Invoice Printing
  const handlePrintInvoice = (order) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const orderNum = order.orderNumber || order.orderId || order.id || "N/A";
    const cName = order.customerName || order.customer || order.shippingAddress?.name || "Customer";
    const cEmail = order.email || "";
    const cPhone = order.phone || "";

    const sAddr = order.shippingAddress || {};
    const fullAddrSrc = sAddr.fullAddress || sAddr.address || "";

    const dateStr = order.orderDate
      ? new Date(order.orderDate).toLocaleDateString()
      : order.createdAt?.toMillis
      ? new Date(order.createdAt.toMillis()).toLocaleDateString()
      : "N/A";

    const items = order.items || order.cartItems || [];
    const sub = order.subtotal || order.totalAmount || 0;
    const ship = order.shippingFee || 0;
    const disc = order.discountAmount || 0;
    const tot = order.totalAmount || order.total || 0;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${orderNum}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e1e1e; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #b8860b; padding-bottom: 20px; }
            .title { font-size: 26px; font-weight: bold; letter-spacing: 4px; color: #b8860b; margin-bottom: 5px; }
            .subtitle { font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #777; }
            .info { margin-bottom: 30px; display: flex; justify-content: space-between; font-size: 13px; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e5e5; }
            th { background-color: #faf8f5; font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; color: #555; }
            .totals { width: 320px; float: right; font-size: 13px; }
            .totals-row { display: flex; justify-content: space-between; padding: 6px 0; }
            .totals-row.bold { font-weight: bold; font-size: 16px; border-top: 2px solid #b8860b; padding-top: 10px; margin-top: 6px; }
            .footer { clear: both; text-align: center; margin-top: 50px; font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">VELOURAZ</div>
            <div class="subtitle">Official Tax Invoice & Authenticity Certificate</div>
            <div style="margin-top: 10px; font-size: 13px;">Order Reference: <strong>#${orderNum}</strong></div>
          </div>
          <div class="info">
            <div>
              <strong>BILLED & SHIPPED TO:</strong><br/>
              ${cName}<br/>
              ${fullAddrSrc}<br/>
              ${sAddr.city ? sAddr.city + ", " : ""}${sAddr.state || ""} ${sAddr.pincode || ""}<br/>
              ${cEmail ? cEmail + "<br/>" : ""}
              ${cPhone ? cPhone : ""}
            </div>
            <div style="text-align: right">
              <strong>Order Date:</strong> ${dateStr}<br/>
              <strong>Payment Method:</strong> ${order.paymentMethod || "Razorpay"}<br/>
              <strong>Razorpay Payment ID:</strong> ${order.razorpayPaymentId || order.paymentDetails?.razorpayPaymentId || "N/A"}<br/>
              <strong>Payment Status:</strong> ${order.paymentStatus || "PAID"}<br/>
              <strong>Order Status:</strong> ${order.status || order.orderStatus || "Confirmed"}<br/>
              ${order.shipping?.awbCode ? `<strong>Shiprocket AWB:</strong> ${order.shipping.awbCode}<br/>` : ""}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align: center">Qty</th>
                <th style="text-align: right">Price</th>
                <th style="text-align: right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (i) => `
                <tr>
                  <td>
                    <strong>${i.name}</strong>
                    ${i.size ? `<br><small style="color:#777">Size: ${i.size}</small>` : ""}
                    ${i.metal ? `<small style="color:#777"> | Metal: ${i.metal}</small>` : ""}
                  </td>
                  <td style="text-align: center">${i.quantity || 1}</td>
                  <td style="text-align: right">₹${Number(i.price || 0).toLocaleString()}</td>
                  <td style="text-align: right">₹${(Number(i.price || 0) * Number(i.quantity || 1)).toLocaleString()}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <div class="totals">
             <div class="totals-row">
               <span>Subtotal:</span>
               <span>₹${Number(sub).toLocaleString()}</span>
             </div>
             ${
               ship > 0
                 ? `
             <div class="totals-row">
               <span>Insured Express Delivery:</span>
               <span>₹${Number(ship).toLocaleString()}</span>
             </div>`
                 : `
             <div class="totals-row">
               <span>Insured Delivery:</span>
               <span style="color:#10b981; font-weight:bold;">FREE</span>
             </div>`
             }
             ${
               disc > 0
                 ? `
             <div class="totals-row" style="color: #10b981;">
               <span>Discount:</span>
               <span>-₹${Number(disc).toLocaleString()}</span>
             </div>`
                 : ""
             }
             <div class="totals-row bold">
               <span>Total Paid:</span>
               <span>₹${Number(tot).toLocaleString()}</span>
             </div>
          </div>
          <div class="footer">
            Thank you for shopping with Velouraz High Jewellery.<br/>
            Registered Office: 783, Raj Gold Residency, Flat No. 104, Khatiwala Tank, Indore, MP - 452014
          </div>
          <script>
            window.onload = function() { setTimeout(function(){ window.print(); }, 400); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filtered Orders calculation
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 0. Always show only PAID orders
      const payStatus = (order.paymentStatus || "").toUpperCase();
      if (payStatus !== "PAID") return false;

      // 1. Search filter
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const orderId = String(order.id || "").toLowerCase();
        const orderNumber = String(order.orderNumber || "").toLowerCase();
        const rzpPayId = String(order.razorpayPaymentId || order.paymentDetails?.razorpayPaymentId || "").toLowerCase();
        const cName = String(order.customerName || order.customer || order.shippingAddress?.name || "").toLowerCase();
        const cEmail = String(order.email || order.shippingAddress?.email || "").toLowerCase();
        const cPhone = String(order.phone || order.shippingAddress?.phone || "").toLowerCase();
        const awb = String(order.shipping?.awbCode || order.trackingNumber || "").toLowerCase();

        const match =
          orderId.includes(q) ||
          orderNumber.includes(q) ||
          rzpPayId.includes(q) ||
          cName.includes(q) ||
          cEmail.includes(q) ||
          cPhone.includes(q) ||
          awb.includes(q);

        if (!match) return false;
      }

      // 2. Order Status filter
      if (statusFilter !== "all") {
        const curStatus = (order.orderStatus || order.status || "Pending").toLowerCase();
        if (curStatus !== statusFilter.toLowerCase()) return false;
      }

      // 3. Payment Status filter
      if (paymentFilter !== "all") {
        const curPayStatus = (order.paymentStatus || "Pending").toLowerCase();
        if (curPayStatus !== paymentFilter.toLowerCase()) return false;
      }

      return true;
    });
  }, [orders, searchQuery, statusFilter, paymentFilter]);

  return (
    <>
      <section className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-full">
        {/* Top Header & Analytics Bar */}
        <div className="px-6 py-6 sm:px-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/40">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="p-2 bg-[#811331]/10 rounded-xl">
                <ShoppingBag size={18} className="text-[#811331]" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                Order & Shipping Management
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#811331] text-white">
                {orders.length} Total
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Real-time Razorpay payments, Shiprocket AWB creation, and automated logistics tracking
            </p>
          </div>

          {/* Quick Copy Feedback Toast */}
          {copyFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-md"
            >
              <Check size={14} className="text-emerald-400" />
              <span>{copyFeedback}</span>
            </motion.div>
          )}
        </div>

        {/* Filter and Search Bar */}
        <div className="p-5 sm:px-8 border-b border-slate-100 bg-white grid grid-cols-1 sm:grid-cols-12 gap-3.5">
          {/* Search Input */}
          <div className="sm:col-span-6 lg:col-span-5 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order ID, Razorpay ID, Name, Phone, AWB..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-[#811331] focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Order Status Filter */}
          <div className="sm:col-span-3 lg:col-span-4 relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 outline-none focus:border-[#811331] transition-all cursor-pointer appearance-none"
            >
              <option value="all">All Order Statuses</option>
              {ORDER_STATUSES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Payment Status Filter */}
          <div className="sm:col-span-3 lg:col-span-3 relative">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 outline-none focus:border-[#811331] transition-all cursor-pointer appearance-none"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid (Razorpay)</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden xl:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[12px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50/80">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-5 py-4">Customer Details</th>
                <th className="px-4 py-4">Order Date</th>
                <th className="px-4 py-4">Products</th>
                <th className="px-3 py-4 text-center">Total Qty</th>
                <th className="px-4 py-4">Total Amount</th>
                <th className="px-5 py-4">Razorpay Payment</th>
                <th className="px-4 py-4">Order Status</th>
                <th className="px-5 py-4">Shipping Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredOrders.map((row) => {
                const orderIdDisplay = row.orderNumber || row.orderId || row.id;
                const rzpPaymentId = row.razorpayPaymentId || row.paymentDetails?.razorpayPaymentId || "";
                const items = row.items || row.cartItems || [];
                const totalQty = items.reduce((acc, i) => acc + Number(i.quantity || 1), 0);
                const isPaid = (row.paymentStatus || "").toUpperCase() === "PAID";
                const shippingObj = row.shipping || {};
                const awbCode = shippingObj.awbCode || row.trackingNumber || "";
                const currentOrderStatus = row.orderStatus || row.status || "Order Placed";

                const dateStr = row.orderDate
                  ? new Date(row.orderDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                  : row.createdAt?.toMillis
                  ? new Date(row.createdAt.toMillis()).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                  : "Recent";

                return (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* 1. Order ID */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          #{orderIdDisplay.slice(0, 14)}
                        </span>
                        <button
                          onClick={() => handleCopy(orderIdDisplay, "Order ID Copied!")}
                          title="Copy Order ID"
                          className="p-1 text-slate-400 hover:text-slate-700 transition-colors rounded hover:bg-slate-100"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </td>

                    {/* 2 & 3 & 4. Customer Name, Email, Phone */}
                    <td className="px-5 py-4 min-w-[180px]">
                      <p className="font-bold text-slate-800 truncate">
                        {row.customerName || row.customer || row.shippingAddress?.name || "Customer"}
                      </p>
                      <p className="text-slate-500 text-[11px] truncate flex items-center gap-1">
                        <Mail size={10} className="shrink-0 text-slate-400" />
                        {row.email || row.shippingAddress?.email || "No email"}
                      </p>
                      <p className="text-slate-500 text-[11px] flex items-center gap-1 font-mono">
                        <Phone size={10} className="shrink-0 text-slate-400" />
                        {row.phone || row.shippingAddress?.phone || "No phone"}
                      </p>
                    </td>

                    {/* 5. Order Date */}
                    <td className="px-4 py-4 whitespace-nowrap text-slate-600">
                      <span className="font-medium">{dateStr}</span>
                    </td>

                    {/* 6. Products summary */}
                    <td className="px-4 py-4 max-w-[160px]">
                      <div className="flex items-center gap-2">
                        {items[0]?.image ? (
                          <img
                            src={items[0].image}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <Box size={14} className="text-slate-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate text-[11px]">
                            {items[0]?.name || "Fine Jewellery"}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {items.length > 1 ? `+${items.length - 1} more items` : "1 Piece"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* 7. Total Quantity */}
                    <td className="px-3 py-4 text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-700">
                        {totalQty}
                      </span>
                    </td>

                    {/* 8. Total Amount */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900 text-sm">
                        ₹{Number(row.totalAmount || row.total || 0).toLocaleString()}
                      </span>
                    </td>

                    {/* 9 & 10 & 11. Payment Method, Razorpay Payment ID, Payment Status */}
                    <td className="px-5 py-4 min-w-[170px]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              isPaid
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {row.paymentStatus || "PENDING"}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 uppercase">
                            {row.paymentMethod || "Razorpay"}
                          </span>
                        </div>

                        {rzpPaymentId ? (
                          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 max-w-fit">
                            <span className="truncate max-w-[110px]" title={rzpPaymentId}>
                              {rzpPaymentId}
                            </span>
                            <button
                              onClick={() => handleCopy(rzpPaymentId, "Razorpay ID Copied!")}
                              title="Copy Razorpay Payment ID"
                              className="text-slate-400 hover:text-slate-800"
                            >
                              <Copy size={11} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No payment ID</span>
                        )}
                      </div>
                    </td>

                    {/* 12. Order Status with direct dropdown */}
                    <td className="px-4 py-4 min-w-[150px]">
                      <div className="relative">
                        <select
                          value={currentOrderStatus}
                          onChange={(e) => handleStatusChange(row, e.target.value)}
                          className={`w-full py-1.5 pl-2.5 pr-6 rounded-lg text-xs font-bold uppercase tracking-wide border cursor-pointer appearance-none transition-all ${statusBadgeClasses(
                            currentOrderStatus
                          )}`}
                        >
                          {ORDER_STATUSES.map((st) => (
                            <option key={st} value={st} className="bg-white text-slate-800 font-normal">
                              {st}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={12}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-current opacity-70 pointer-events-none"
                        />
                      </div>
                    </td>

                    {/* 13. Shipping Status */}
                    <td className="px-5 py-4 min-w-[160px]">
                      {awbCode ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                            <Truck size={11} /> {shippingObj.status || "AWB Assigned"}
                          </span>
                          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-600">
                            <span className="truncate max-w-[100px]">{awbCode}</span>
                            <button
                              onClick={() => handleCopy(awbCode, "AWB Copied!")}
                              title="Copy AWB Code"
                              className="text-slate-400 hover:text-slate-700"
                            >
                              <Copy size={11} />
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            {shippingObj.courierName || "Shiprocket"}
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenPackedModal(row)}
                          className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 rounded-lg text-[11px] font-bold tracking-wider uppercase transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Package size={11} /> Pack & Ship
                        </button>
                      )}
                    </td>

                    {/* 14. Action Buttons */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(row)}
                          className="p-1.5 bg-slate-50 text-slate-700 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
                          title="View Full Order Details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handlePrintInvoice(row)}
                          className="p-1.5 bg-slate-50 text-slate-700 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
                          title="Print Tax Invoice"
                        >
                          <Printer size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-8 py-16 text-center">
                    <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200">
                      <ShoppingBag size={22} className="text-slate-400" />
                    </div>
                    <p className="text-base font-bold text-slate-700 mb-0.5">No orders found</p>
                    <p className="text-xs text-slate-400">
                      Try adjusting your search terms or status filters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile & Tablet Responsive Cards */}
        <div className="xl:hidden divide-y divide-slate-100">
          {filteredOrders.map((row) => {
            const orderIdDisplay = row.orderNumber || row.orderId || row.id;
            const rzpPaymentId = row.razorpayPaymentId || row.paymentDetails?.razorpayPaymentId || "";
            const isPaid = (row.paymentStatus || "").toUpperCase() === "PAID";
            const shippingObj = row.shipping || {};
            const awbCode = shippingObj.awbCode || row.trackingNumber || "";
            const currentOrderStatus = row.orderStatus || row.status || "Order Placed";

            return (
              <div key={row.id} className="p-4 sm:p-5 space-y-3 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      #{orderIdDisplay.slice(0, 14)}
                    </span>
                    <button
                      onClick={() => handleCopy(orderIdDisplay, "Order ID Copied!")}
                      className="p-1 text-slate-400"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${statusBadgeClasses(
                      currentOrderStatus
                    )}`}
                  >
                    {currentOrderStatus}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800">
                      {row.customerName || row.customer || row.shippingAddress?.name || "Customer"}
                    </p>
                    <p className="text-slate-500 font-mono text-[11px]">
                      {row.phone || row.shippingAddress?.phone}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 text-sm">
                      ₹{Number(row.totalAmount || row.total || 0).toLocaleString()}
                    </p>
                    <span
                      className={`text-[10px] font-bold uppercase ${
                        isPaid ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {row.paymentStatus || "PENDING"} (Razorpay)
                    </span>
                  </div>
                </div>

                {/* Razorpay ID & AWB Pill */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-[11px]">
                  {rzpPaymentId && (
                    <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-700">
                      <span>Pay: {rzpPaymentId.slice(0, 14)}...</span>
                      <button onClick={() => handleCopy(rzpPaymentId, "Razorpay ID Copied!")}>
                        <Copy size={10} className="text-slate-400" />
                      </button>
                    </div>
                  )}
                  {awbCode ? (
                    <div className="flex items-center gap-1 bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded font-mono">
                      <Truck size={11} />
                      <span>AWB: {awbCode}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenPackedModal(row)}
                      className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded font-bold text-[10px] uppercase tracking-wider"
                    >
                      Pack & Ship with Shiprocket
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <div className="relative">
                    <select
                      value={currentOrderStatus}
                      onChange={(e) => handleStatusChange(row, e.target.value)}
                      className="py-1 px-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold uppercase text-slate-700"
                    >
                      {ORDER_STATUSES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePrintInvoice(row)}
                      className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-200 flex items-center gap-1"
                    >
                      <Printer size={12} /> Invoice
                    </button>
                    <button
                      onClick={() => setSelectedOrder(row)}
                      className="px-3.5 py-1.5 bg-[#811331] text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#600e25] flex items-center gap-1"
                    >
                      <Eye size={12} /> Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          2. PACKED POPUP — SHIPROCKET SHIPMENT MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {packedModalOrder && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 my-auto text-slate-800"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-white to-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                      Create Shiprocket Shipment
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Order Reference: #{packedModalOrder.orderNumber || packedModalOrder.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPackedModalOrder(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleCreateShipmentSubmit} className="overflow-y-auto p-6 space-y-6 flex-1 text-xs">
                {packedError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2.5">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{packedError}</span>
                  </div>
                )}

                {shipmentSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span>Shipment Created & AWB Assigned!</span>
                    </div>
                    <p className="font-mono text-xs">AWB: {shipmentSuccess.awbCode}</p>
                    <p className="text-xs">Carrier: {shipmentSuccess.courierName}</p>
                  </div>
                )}

                {/* Section A: Customer Details */}
                <div className="space-y-3 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/60">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <User size={13} className="text-[#811331]" /> A. Customer Details (Auto-filled)
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Verify before shipment</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Customer Name *</label>
                      <input
                        type="text"
                        required
                        value={packedForm.name}
                        onChange={(e) => setPackedForm({ ...packedForm, name: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#811331]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Customer Phone *</label>
                      <input
                        type="tel"
                        required
                        value={packedForm.phone}
                        onChange={(e) => setPackedForm({ ...packedForm, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#811331] font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Customer Email</label>
                      <input
                        type="email"
                        value={packedForm.email}
                        onChange={(e) => setPackedForm({ ...packedForm, email: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#811331]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Street Address / Landmark *</label>
                      <input
                        type="text"
                        required
                        value={packedForm.address}
                        onChange={(e) => setPackedForm({ ...packedForm, address: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#811331]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={packedForm.city}
                        onChange={(e) => setPackedForm({ ...packedForm, city: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#811331]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">State *</label>
                      <input
                        type="text"
                        required
                        value={packedForm.state}
                        onChange={(e) => setPackedForm({ ...packedForm, state: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#811331]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Delivery Pincode *</label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={packedForm.pincode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setPackedForm({ ...packedForm, pincode: val });
                          if (val.length === 6) fetchCouriers(val, packedForm.weight);
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#811331] font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Country</label>
                      <input
                        type="text"
                        disabled
                        value={packedForm.country}
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Section B: Registered Velouraz Pickup Details */}
                <div className="space-y-2 bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                      <MapPin size={13} className="text-purple-700" /> B. Default Pickup Hub (Shiprocket Registered)
                    </span>
                    <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                      Nickname: {packedForm.pickupLocation}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800">Velouraz Central Fulfillment Center</p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    783, Raj Gold Residency, Flat No. 104, Khatiwala Tank, Indore, Madhya Pradesh, India – 452014
                  </p>
                </div>

                {/* Section C: Package Details */}
                <div className="space-y-3 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/60">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Box size={13} className="text-[#811331]" /> C. Package Dimensions & Weight
                    </span>
                    <span className="text-[10px] text-slate-400">Strictly positive values</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Length (cm) *</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        required
                        value={packedForm.length}
                        onChange={(e) => setPackedForm({ ...packedForm, length: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#811331] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Breadth (cm) *</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        required
                        value={packedForm.breadth}
                        onChange={(e) => setPackedForm({ ...packedForm, breadth: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#811331] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Height (cm) *</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        required
                        value={packedForm.height}
                        onChange={(e) => setPackedForm({ ...packedForm, height: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#811331] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Weight (kg) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.05"
                        required
                        value={packedForm.weight}
                        onChange={(e) => {
                          setPackedForm({ ...packedForm, weight: e.target.value });
                          if (packedForm.pincode?.length === 6) fetchCouriers(packedForm.pincode, e.target.value);
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#811331] font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Section D: Product Details Review */}
                <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                  <span className="font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <ShoppingBag size={13} className="text-[#811331]" /> D. Items to Ship ({(packedModalOrder.items || []).length})
                  </span>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto pt-1">
                    {(packedModalOrder.items || []).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="font-medium text-slate-800 truncate max-w-[320px]">
                          {item.name} × {item.quantity || 1}
                        </span>
                        <span className="font-bold font-mono text-slate-900">
                          ₹{(Number(item.price || 0) * (item.quantity || 1)).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs font-bold">
                    <span>Order Total (Prepaid):</span>
                    <span className="text-emerald-700 text-sm">
                      ₹{Number(packedModalOrder.totalAmount || packedModalOrder.total || 0).toLocaleString()} (PAID)
                    </span>
                  </div>
                </div>

                {/* Section E: Live Courier Selection */}
                <div className="space-y-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <span className="font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <Truck size={14} className="text-[#811331]" /> E. Select Courier Partner
                      </span>
                      <p className="text-[10px] text-slate-400">Available couriers for Pincode {packedForm.pincode || "..."}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => fetchCouriers(packedForm.pincode, packedForm.weight)}
                      disabled={checkingServiceability}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RefreshCw size={11} className={checkingServiceability ? "animate-spin" : ""} /> Check Rates
                    </button>
                  </div>

                  {checkingServiceability ? (
                    <div className="py-6 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={20} className="animate-spin text-[#811331]" />
                      <span>Checking Shiprocket live serviceability & freight rates...</span>
                    </div>
                  ) : availableCouriers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {availableCouriers.map((c) => {
                        const isSelected = selectedCourierId === c.courier_company_id;
                        return (
                          <div
                            key={c.courier_company_id}
                            onClick={() => setSelectedCourierId(c.courier_company_id)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? "bg-purple-50/70 border-purple-600 ring-1 ring-purple-600 shadow-xs"
                                : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="space-y-0.5">
                              <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                <span>{c.courier_name}</span>
                                {c.rating && (
                                  <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded font-mono">
                                    ★ {c.rating}
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Delivery in <span className="font-semibold text-slate-700">{c.estimated_delivery_days || "3-5"} days</span> ({c.etd || "Expected Soon"})
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-slate-900 font-mono text-xs">
                                ₹{c.rate}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-slate-400 text-xs italic">
                      Enter a 6-digit delivery pincode to preview available couriers and rates.
                    </div>
                  )}
                </div>

                {/* Section F: Action Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={creatingShipment}
                    className="w-full py-4 bg-[#811331] text-white rounded-xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#630e25] transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {creatingShipment ? (
                      <>
                        <RefreshCw size={15} className="animate-spin text-amber-300" />
                        <span>Creating Shipment & Assigning AWB...</span>
                      </>
                    ) : (
                      <>
                        <Package size={16} />
                        <span>CREATE SHIPROCKET SHIPMENT</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-slate-400 text-center mt-2">
                    Orders are automatically updated to "Packed", AWB generated, and customer notified.
                  </p>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════════
          3. ORDER DETAILS & SHIPPING MANAGEMENT MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ y: 20, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 my-auto"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">Order Information</h3>
                  <span className="text-xs font-mono font-bold bg-white border border-slate-200 px-3 py-1 rounded-md text-slate-700 shadow-xs">
                    #{selectedOrder.orderNumber || selectedOrder.id}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePrintInvoice(selectedOrder)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition-colors shadow-xs"
                  >
                    <Printer size={14} /> Print Invoice
                  </button>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto p-6 md:p-8 space-y-8 flex-1 text-xs sm:text-sm">
                {/* 4 Cards Grid: Customer, Address, Order Status, Payment Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Information */}
                  <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200/60">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <User size={13} className="text-[#811331]" /> Customer Information
                    </h4>
                    <p className="font-bold text-slate-800 text-base">
                      {selectedOrder.customerName || selectedOrder.customer || selectedOrder.shippingAddress?.name || "Customer"}
                    </p>
                    <p className="text-slate-600 flex items-center gap-2">
                      <Mail size={14} className="text-slate-400" />
                      {selectedOrder.email || selectedOrder.shippingAddress?.email || "No email"}
                    </p>
                    <p className="text-slate-600 flex items-center gap-2 font-mono">
                      <Phone size={14} className="text-slate-400" />
                      {selectedOrder.phone || selectedOrder.shippingAddress?.phone || "No phone"}
                    </p>
                  </div>

                  {/* Delivery Destination */}
                  <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200/60">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <MapPin size={13} className="text-[#811331]" /> Delivery Address
                    </h4>
                    <p className="text-slate-700 leading-relaxed">
                      {selectedOrder.shippingAddress?.fullAddress ||
                        `${selectedOrder.shippingAddress?.flat ? selectedOrder.shippingAddress.flat + ", " : ""}${
                          selectedOrder.shippingAddress?.address || ""
                        }`}
                    </p>
                    <p className="text-slate-600 font-medium">
                      {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} -{" "}
                      <span className="font-mono font-bold text-slate-800">{selectedOrder.shippingAddress?.pincode}</span>
                    </p>
                    <p className="text-slate-500 text-xs">{selectedOrder.shippingAddress?.country || "India"}</p>
                  </div>

                  {/* Order Status & Direct Transition */}
                  <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200/60">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Box size={13} className="text-[#811331]" /> Ecommerce Status Management
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-xs">Current Stage:</span>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${statusBadgeClasses(
                            selectedOrder.orderStatus || selectedOrder.status
                          )}`}
                        >
                          {selectedOrder.orderStatus || selectedOrder.status || "Order Placed"}
                        </span>
                      </div>
                      <div className="pt-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Update Order Status:
                        </label>
                        <select
                          value={selectedOrder.orderStatus || selectedOrder.status || "Order Placed"}
                          onChange={(e) => handleStatusChange(selectedOrder, e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold uppercase text-xs text-slate-800 outline-none focus:border-[#811331] cursor-pointer"
                        >
                          {ORDER_STATUSES.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Razorpay Payment Information */}
                  <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200/60">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <CreditCard size={13} className="text-[#811331]" /> Razorpay Payment Details
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Method:</span>
                        <span className="font-bold text-slate-800 uppercase">
                          {selectedOrder.paymentMethod || "Razorpay"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Payment Status:</span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                          {selectedOrder.paymentStatus || "PAID"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Razorpay Payment ID:</span>
                        <div className="flex items-center gap-1 font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                          <span>{selectedOrder.razorpayPaymentId || selectedOrder.paymentDetails?.razorpayPaymentId || "N/A"}</span>
                          {selectedOrder.razorpayPaymentId && (
                            <button
                              onClick={() => handleCopy(selectedOrder.razorpayPaymentId, "Payment ID Copied!")}
                              title="Copy Razorpay Payment ID"
                              className="text-slate-400 hover:text-slate-800"
                            >
                              <Copy size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Total Paid Amount:</span>
                        <span className="font-bold text-slate-900 text-sm">
                          ₹{Number(selectedOrder.totalAmount || selectedOrder.total || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ═════════════════════════════════════════════════════════════
                    DEDICATED SHIPPING INFORMATION SECTION (SHIPROCKET)
                    ═════════════════════════════════════════════════════════════ */}
                <div className="bg-gradient-to-br from-purple-50/70 via-white to-slate-50 p-6 rounded-3xl border border-purple-200/80 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-purple-100 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
                        <Truck size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">Shiprocket Shipping Information</h4>
                        <p className="text-xs text-slate-500">Live logistics, AWB tracking, and carrier manifest</p>
                      </div>
                    </div>

                    {selectedOrder.shipping?.awbCode ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleSyncTracking(selectedOrder)}
                          disabled={trackingSyncLoading}
                          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <RefreshCw size={12} className={trackingSyncLoading ? "animate-spin text-purple-700" : ""} />
                          <span>Refresh Tracking</span>
                        </button>
                        <a
                          href={selectedOrder.shipping.trackingUrl || `https://shiprocket.co/tracking/${selectedOrder.shipping.awbCode}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 bg-purple-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-purple-800 flex items-center gap-1.5 shadow-xs"
                        >
                          <ExternalLink size={12} /> Track Live
                        </a>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenPackedModal(selectedOrder)}
                        className="px-4 py-2 bg-purple-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-purple-800 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Package size={14} /> Create Shipment in Shiprocket
                      </button>
                    )}
                  </div>

                  {trackingSyncMessage && (
                    <div className="p-3 bg-purple-100/80 border border-purple-200 rounded-xl text-xs text-purple-900 font-semibold flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-purple-700 shrink-0" />
                      <span>{trackingSyncMessage}</span>
                    </div>
                  )}

                  {selectedOrder.shipping?.awbCode ? (
                    <div className="space-y-4">
                      {/* Shipping Info Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            Shiprocket Order ID
                          </span>
                          <span className="font-mono font-bold text-slate-800">
                            {selectedOrder.shipping.shiprocketOrderId || "N/A"}
                          </span>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            Shipment ID
                          </span>
                          <span className="font-mono font-bold text-slate-800">
                            {selectedOrder.shipping.shipmentId || "N/A"}
                          </span>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            AWB Tracking Number
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="font-mono font-bold text-emerald-700">
                              {selectedOrder.shipping.awbCode}
                            </span>
                            <button
                              onClick={() => handleCopy(selectedOrder.shipping.awbCode, "AWB Copied!")}
                              title="Copy AWB Number"
                              className="text-slate-400 hover:text-slate-800"
                            >
                              <Copy size={11} />
                            </button>
                          </div>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            Courier Partner
                          </span>
                          <span className="font-bold text-slate-800">
                            {selectedOrder.shipping.courierName || "Shiprocket Air"}
                          </span>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            Shipping Status
                          </span>
                          <span className="font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                            {selectedOrder.shipping.status || "AWB Assigned"}
                          </span>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            Pickup Status
                          </span>
                          <span className="font-semibold text-slate-700">
                            {selectedOrder.shipping.pickupStatus || "Scheduled"}
                          </span>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            Package Weight
                          </span>
                          <span className="font-mono font-semibold text-slate-700">
                            {selectedOrder.shipping.packageWeight || "0.35"} kg
                          </span>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            Expected Delivery
                          </span>
                          <span className="font-semibold text-emerald-800">
                            {selectedOrder.shipping.estimatedDeliveryDate || "3-5 Business Days"}
                          </span>
                        </div>
                      </div>

                      {/* Documents / Action Buttons */}
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        {selectedOrder.shipping.labelUrl ? (
                          <a
                            href={selectedOrder.shipping.labelUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 flex items-center gap-1.5 shadow-xs"
                          >
                            <FileText size={13} /> Download Shipping Label
                          </a>
                        ) : (
                          <button
                            onClick={async () => {
                              try {
                                const url = await generateShippingLabel(
                                  selectedOrder.shipping.shipmentId,
                                  selectedOrder.id
                                );
                                window.open(url, "_blank");
                              } catch (e) {
                                alert(e.message);
                              }
                            }}
                            className="px-4 py-2 bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-200 flex items-center gap-1.5 cursor-pointer"
                          >
                            <FileText size={13} /> Generate Shipping Label
                          </button>
                        )}

                        <button
                          onClick={async () => {
                            try {
                              const url = await generateShippingManifest(
                                selectedOrder.shipping.shipmentId,
                                selectedOrder.id
                              );
                              window.open(url, "_blank");
                            } catch (e) {
                              alert(e.message);
                            }
                          }}
                          className="px-4 py-2 bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-200 flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText size={13} /> Download Manifest
                        </button>
                      </div>

                      {/* Live Tracking Timeline */}
                      {Array.isArray(selectedOrder.trackingHistory) && selectedOrder.trackingHistory.length > 0 && (
                        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                          <h5 className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                            <Clock size={12} className="text-purple-700" /> Tracking Milestones
                          </h5>
                          <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                            {selectedOrder.trackingHistory.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2.5 text-xs border-b border-slate-100 pb-2">
                                <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0 mt-1.5" />
                                <div className="flex-1">
                                  <p className="font-bold text-slate-800">{item.status || item.activity}</p>
                                  <p className="text-slate-500 text-[11px]">
                                    {item.location && `${item.location} • `}
                                    {item.timestamp ? new Date(item.timestamp).toLocaleString("en-IN") : ""}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 text-center space-y-3 bg-white rounded-2xl border border-dashed border-purple-200 p-6">
                      <Package size={32} className="text-purple-400 mx-auto" />
                      <div className="space-y-1">
                        <p className="font-bold text-slate-800 text-sm">No Shiprocket Shipment Created Yet</p>
                        <p className="text-slate-500 text-xs max-w-md mx-auto">
                          Click below to review delivery details, select package dimensions and courier partner, and generate an official AWB.
                        </p>
                      </div>
                      <button
                        onClick={() => handleOpenPackedModal(selectedOrder)}
                        className="px-6 py-2.5 bg-purple-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-purple-800 transition-all cursor-pointer shadow-sm"
                      >
                        Create Shipment Now
                      </button>
                    </div>
                  )}
                </div>

                {/* Ordered Items Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <ShoppingBag size={13} className="text-[#811331]" /> Ordered Pieces
                  </h4>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[11px]">
                        <tr>
                          <th className="px-5 py-3.5">Item Description</th>
                          <th className="px-4 py-3.5 text-center">Qty</th>
                          <th className="px-5 py-3.5 text-right">Unit Price</th>
                          <th className="px-5 py-3.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(selectedOrder.items || selectedOrder.cartItems || []).map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                {item.image || item.primaryImage ? (
                                  <img
                                    src={item.image || item.primaryImage}
                                    alt=""
                                    className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                    <Box size={16} className="text-slate-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-bold text-slate-800">{item.name}</p>
                                  {(item.size || item.metal) && (
                                    <p className="text-[11px] text-slate-500">
                                      {item.size ? `Size: ${item.size} ` : ""}
                                      {item.metal ? `Metal: ${item.metal}` : ""}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                              {item.quantity || 1}
                            </td>
                            <td className="px-5 py-3.5 text-right font-mono text-slate-700">
                              ₹{Number(item.price || 0).toLocaleString()}
                            </td>
                            <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900">
                              ₹{(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals Summary */}
                <div className="flex justify-end pt-2">
                  <div className="w-full sm:w-80 space-y-2.5 bg-slate-50 p-5 rounded-2xl border border-slate-200/80 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-bold text-slate-800 font-mono">
                        ₹{Number(selectedOrder.subtotal || selectedOrder.totalAmount || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Insured Express Delivery:</span>
                      {Number(selectedOrder.shippingFee) > 0 ? (
                        <span className="font-bold text-slate-800 font-mono">
                          ₹{Number(selectedOrder.shippingFee).toLocaleString()}
                        </span>
                      ) : (
                        <span className="font-bold text-emerald-700 uppercase text-[11px]">FREE</span>
                      )}
                    </div>
                    {Number(selectedOrder.discountAmount) > 0 && (
                      <div className="flex justify-between items-center text-emerald-700">
                        <span>Discount Applied:</span>
                        <span className="font-bold font-mono">
                          -₹{Number(selectedOrder.discountAmount).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-base font-bold text-slate-900 border-t border-slate-200 pt-2.5">
                      <span>Total Paid:</span>
                      <span className="font-sans text-lg text-[#811331]">
                        ₹{Number(selectedOrder.totalAmount || selectedOrder.total || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default OrdersTable;
