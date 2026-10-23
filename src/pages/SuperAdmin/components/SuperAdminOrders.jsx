import React, { useState } from "react";
import { db } from "../../../components/Firebase";
import { doc, updateDoc } from "firebase/firestore";
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Package,
  Calendar,
  User,
  MapPin,
  CreditCard,
  FileText,
  Save,
  X,
  ExternalLink,
  ChevronRight,
  Download
} from "lucide-react";
import { generateInvoicePDF } from "../../../utils/invoice";

const statusBadgeClasses = (status) => {
  switch (status?.toLowerCase()) {
    case "delivered":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50";
    case "shipped":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/50";
    case "processing":
      return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/50";
    case "cancelled":
      return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/50";
    default:
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50";
  }
};

const formatOrderDate = (order) => {
  const val = order?.createdAt || order?.orderDate || order?.date || order?.timestamp || order?.created_at;
  if (!val) return "N/A";

  try {
    let dateObj;
    if (typeof val === "object" && typeof val.toDate === "function") {
      dateObj = val.toDate();
    } else if (typeof val === "object" && val.seconds) {
      dateObj = new Date(val.seconds * 1000);
    } else if (typeof val === "number") {
      dateObj = new Date(val);
    } else if (typeof val === "string") {
      dateObj = new Date(val);
    }

    if (dateObj && !isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    }
  } catch (e) {
    console.warn("Date parse error:", e);
  }
  return String(val || "N/A");
};

const SuperAdminOrders = ({ orders = [], isDarkMode = false }) => {
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Edit fields for selected order modal
  const [editStatus, setEditStatus] = useState("");
  const [editTrackingNumber, setEditTrackingNumber] = useState("");
  const [editCourier, setEditCourier] = useState("");
  const [editEstDelivery, setEditEstDelivery] = useState("");
  const [editAdminNotes, setEditAdminNotes] = useState("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  const handleOpenOrderModal = (order) => {
    setSelectedOrder(order);
    setEditStatus(order.status || order.orderStatus || "Pending");
    setEditTrackingNumber(order.trackingNumber || order.awbCode || "");
    setEditCourier(order.courierPartner || order.courier || "");
    setEditEstDelivery(order.estimatedDelivery || "");
    setEditAdminNotes(order.adminNotes || "");
    setSaveSuccessMsg("");
  };

  const handleTableStatusChange = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        orderStatus: newStatus,
        updatedAt: new Date().toISOString(),
        lastUpdatedBy: "Super Admin"
      });
    } catch (err) {
      console.error("Failed to update status from table:", err);
      alert("Error updating order status: " + err.message);
    }
  };

  const handleSaveOrderDetails = async () => {
    if (!selectedOrder) return;
    setIsUpdating(true);
    setSaveSuccessMsg("");

    try {
      const orderRef = doc(db, "orders", selectedOrder.id);
      
      const updatedFields = {
        status: editStatus,
        orderStatus: editStatus,
        trackingNumber: editTrackingNumber.trim(),
        awbCode: editTrackingNumber.trim(),
        courierPartner: editCourier.trim(),
        courier: editCourier.trim(),
        estimatedDelivery: editEstDelivery.trim(),
        adminNotes: editAdminNotes.trim(),
        updatedAt: new Date().toISOString(),
        lastUpdatedBy: "Super Admin"
      };

      await updateDoc(orderRef, updatedFields);

      // Update local view
      setSelectedOrder((prev) => ({
        ...prev,
        ...updatedFields
      }));

      setSaveSuccessMsg("Order status updated successfully! Live updates pushed to customer panel.");
      setTimeout(() => setSaveSuccessMsg(""), 5000);
    } catch (err) {
      console.error("Failed to update order status:", err);
      alert("Error updating order status: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const currentStatus = (o.status || o.orderStatus || "Pending").toLowerCase();
    const matchStatus =
      filterStatus === "All" || currentStatus === filterStatus.toLowerCase();

    const q = searchQuery.toLowerCase().trim();
    const customer = (o.customerName || o.customer || o.email || "").toLowerCase();
    const id = (o.id || o.orderId || "").toLowerCase();
    const matchQuery = !q || customer.includes(q) || id.includes(q);

    return matchStatus && matchQuery;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Control Bar */}
      <div
        className={`p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 ${
          isDarkMode ? "bg-[#1e2230] border-slate-700/60 text-white" : "bg-white border-slate-100 text-slate-900"
        }`}
      >
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {["All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map((status) => {
            const isActive = filterStatus === status;
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl text-base font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#811331] text-white shadow-md shadow-[#811331]/20"
                    : isDarkMode
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>

        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, Customer Name, Email..."
            className={`w-full pl-10 pr-4 py-2 rounded-xl text-base outline-none border transition-colors ${
              isDarkMode
                ? "bg-slate-800 border-slate-700 text-white placeholder-slate-400"
                : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
            }`}
          />
        </div>
      </div>

      {/* Orders Table Container */}
      <div
        className={`rounded-2xl border shadow-sm overflow-hidden ${
          isDarkMode ? "bg-[#1e2230] border-slate-700/60" : "bg-white border-slate-100"
        }`}
      >
        <div className="px-6 py-5 border-b border-slate-100/10 flex items-center justify-between">
          <div>
            <h3 className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              Super Admin Order Management ({filteredOrders.length})
            </h3>
            <p className={`text-base ${isDarkMode ? "text-slate-400" : "text-slate-500"} mt-0.5`}>
              Edit order statuses directly from the table & download invoices
            </p>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[16px] font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className={`text-[16px] font-bold uppercase tracking-wider border-b border-slate-100/10 ${
                  isDarkMode ? "bg-slate-800/60 text-slate-400" : "bg-slate-50 text-slate-500"
                }`}
              >
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Ordering Date</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/10 text-base font-medium">
              {filteredOrders.map((o) => {
                const currentStatus = o.status || o.orderStatus || "Pending";
                const displayDate = formatOrderDate(o);

                return (
                  <tr
                    key={o.id}
                    className={`transition-colors ${
                      isDarkMode ? "hover:bg-slate-800/40" : "hover:bg-slate-50/80"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-base">
                          #{o.orderId || o.id.slice(0, 10).toUpperCase()}
                        </span>
                        {o.trackingNumber && (
                          <span className="text-[16px] text-blue-600 font-mono">
                            AWB: {o.trackingNumber}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className={`font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                          {o.customerName || o.customer || o.shippingAddress?.name || "Customer"}
                        </p>
                        <p className={`text-[16px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                          {o.email || o.shippingAddress?.email || "No Email"}
                        </p>
                      </div>
                    </td>
                    <td className={`px-6 py-4 font-semibold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                      {displayDate}
                    </td>
                    <td className={`px-6 py-4 font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      ₹{Number(o.total || o.totalAmount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={currentStatus}
                        onChange={(e) => handleTableStatusChange(o.id, e.target.value)}
                        className={`px-3 py-1 rounded-full font-bold border text-[16px] uppercase tracking-wider outline-none cursor-pointer transition-all ${statusBadgeClasses(
                          currentStatus
                        )}`}
                      >
                        <option value="Pending" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Pending</option>
                        <option value="Processing" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Processing</option>
                        <option value="Shipped" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Shipped</option>
                        <option value="Delivered" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Delivered</option>
                        <option value="Cancelled" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => generateInvoicePDF(o)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#811331] text-white rounded-xl text-base font-bold shadow-sm hover:bg-[#9d1a3d] transition-all active:scale-95"
                          title="Download PDF Invoice"
                        >
                          <FileText size={14} />
                          <span>Download Invoice</span>
                        </button>
                        <button
                          onClick={() => handleOpenOrderModal(o)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="View Details & Tracking"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <ShoppingBag size={24} />
                    </div>
                    <p className={`text-base font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                      No orders found
                    </p>
                    <p className="text-base text-slate-400 mt-1">
                      No customer orders matching the active search/filter rules.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details & Status Updater Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setSelectedOrder(null)}
          />

          <div
            className={`relative z-10 w-full max-w-3xl rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col ${
              isDarkMode ? "bg-[#1a1d26] text-white" : "bg-white text-slate-900"
            }`}
          >
            {/* Modal Header */}
            <div
              className={`px-6 py-5 border-b flex items-center justify-between ${
                isDarkMode ? "border-slate-700" : "border-slate-100"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-[#811331]">Order Details</span>
                  <ChevronRight size={14} className="text-slate-400" />
                  <span className="font-mono font-bold">
                    #{selectedOrder.orderId || selectedOrder.id}
                  </span>
                </div>
                <p className="text-base text-slate-400 mt-0.5">
                  View purchase items, customer details, and tracking codes
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {saveSuccessMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-base font-bold flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {/* Status Update Control Card */}
              <div
                className={`p-5 rounded-2xl border space-y-4 ${
                  isDarkMode
                    ? "bg-slate-800/80 border-slate-700"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <h4 className="text-base font-bold uppercase tracking-wider text-[#811331] flex items-center gap-2">
                  <Truck size={16} /> Order Tracking & Dispatch Info
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[16px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Order Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl text-base outline-none font-bold border ${
                        isDarkMode
                          ? "bg-slate-900 border-slate-700 text-white"
                          : "bg-white border-slate-300 text-slate-900"
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[16px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Tracking / AWB Number
                    </label>
                    <input
                      type="text"
                      value={editTrackingNumber}
                      onChange={(e) => setEditTrackingNumber(e.target.value)}
                      placeholder="e.g. VEL8923140IN"
                      className={`w-full px-4 py-2.5 rounded-xl text-base outline-none font-mono font-bold border ${
                        isDarkMode
                          ? "bg-slate-900 border-slate-700 text-white"
                          : "bg-white border-slate-300 text-slate-900"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[16px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Courier Partner
                    </label>
                    <input
                      type="text"
                      value={editCourier}
                      onChange={(e) => setEditCourier(e.target.value)}
                      placeholder="e.g. BlueDart / Shiprocket / Delhivery"
                      className={`w-full px-4 py-2.5 rounded-xl text-base outline-none border ${
                        isDarkMode
                          ? "bg-slate-900 border-slate-700 text-white"
                          : "bg-white border-slate-300 text-slate-900"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[16px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Estimated Delivery Date
                    </label>
                    <input
                      type="text"
                      value={editEstDelivery}
                      onChange={(e) => setEditEstDelivery(e.target.value)}
                      placeholder="e.g. 12 Oct 2026"
                      className={`w-full px-4 py-2.5 rounded-xl text-base outline-none border ${
                        isDarkMode
                          ? "bg-slate-900 border-slate-700 text-white"
                          : "bg-white border-slate-300 text-slate-900"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[16px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Internal Admin Notes
                  </label>
                  <textarea
                    rows={2}
                    value={editAdminNotes}
                    onChange={(e) => setEditAdminNotes(e.target.value)}
                    placeholder="Notes for order fulfillment or dispatch updates..."
                    className={`w-full px-4 py-2.5 rounded-xl text-base outline-none border ${
                      isDarkMode
                        ? "bg-slate-900 border-slate-700 text-white"
                        : "bg-white border-slate-300 text-slate-900"
                    }`}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={handleSaveOrderDetails}
                    disabled={isUpdating}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#811331] hover:bg-[#9d1a3d] text-white font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Save size={16} />
                    <span>{isUpdating ? "Saving Changes..." : "Save Dispatch Details"}</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="text-base font-bold uppercase tracking-wider text-slate-400">
                  Ordered Items ({selectedOrder.items?.length || 0})
                </h4>

                <div className="space-y-2">
                  {(selectedOrder.items || []).map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 ${
                        isDarkMode
                          ? "bg-slate-800/40 border-slate-700"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image || item.images?.[0] || "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200"}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover bg-slate-200"
                        />
                        <div>
                          <p className="font-bold text-base">{item.name || item.title || "Jewellery Item"}</p>
                          <p className="text-base text-slate-400">
                            Qty: {item.quantity || item.qty || 1} {item.variant ? `| ${item.variant}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-base">
                          ₹{Number(item.price || 0).toLocaleString("en-IN")}
                        </p>
                        <p className="text-[16px] text-slate-400 font-bold">
                          Subtotal: ₹{(Number(item.price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer & Shipping Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    isDarkMode ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <p className="text-[16px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User size={14} /> Customer Details
                  </p>
                  <p className="font-bold text-base">
                    {selectedOrder.customerName || selectedOrder.shippingAddress?.name || "Guest Customer"}
                  </p>
                  <p className="text-base text-slate-400">
                    Email: {selectedOrder.email || selectedOrder.shippingAddress?.email || "N/A"}
                  </p>
                  <p className="text-base text-slate-400">
                    Phone: {selectedOrder.phone || selectedOrder.shippingAddress?.phone || "N/A"}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    isDarkMode ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <p className="text-[16px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <MapPin size={14} /> Shipping Address
                  </p>
                  <p className="text-base font-semibold">
                    {selectedOrder.shippingAddress?.fullAddress ||
                      `${selectedOrder.shippingAddress?.address || ""}, ${
                        selectedOrder.shippingAddress?.city || ""
                      } ${selectedOrder.shippingAddress?.pincode || ""}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className={`px-6 py-4 border-t flex items-center justify-between ${
                isDarkMode ? "border-slate-700 bg-slate-900/60" : "border-slate-100 bg-slate-50"
              }`}
            >
              <button
                onClick={() => generateInvoicePDF(selectedOrder)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#811331] text-white hover:bg-[#9d1a3d] rounded-xl text-base font-bold transition-all shadow-md"
              >
                <FileText size={16} />
                <span>Download Invoice PDF</span>
              </button>

              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-base rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminOrders;
