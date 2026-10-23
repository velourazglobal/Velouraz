import React, { useState, useEffect } from "react";
import { db } from "../../../components/Firebase";
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import {
  Bell, Mail, Phone, Trash2, CheckCircle2, Clock, Search, ExternalLink,
  MessageSquare, User, Filter, AlertCircle, Sparkles, Check
} from "lucide-react";
import { getOptimizedImageUrl } from "../../../config/cloudinary";

const StockNotificationsManager = ({ isDarkMode }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all' | 'pending' | 'notified'
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "stock_notifications"),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        // Sort newest first
        list.sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
          return tB - tA;
        });
        setRequests(list);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching stock notifications:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const handleToggleStatus = async (req) => {
    try {
      const newStatus = req.status === "notified" ? "pending" : "notified";
      await updateDoc(doc(db, "stock_notifications", req.id), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Error updating notification status:", err);
      alert("Failed to update status.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notification request?")) return;
    try {
      await deleteDoc(doc(db, "stock_notifications", id));
    } catch (err) {
      console.error("Error deleting notification request:", err);
      alert("Failed to delete request.");
    }
  };

  // Filter & Search
  const filteredRequests = requests.filter((r) => {
    const matchesFilter =
      filter === "all" ? true : (r.status || "pending") === filter;
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.productName?.toLowerCase().includes(q) ||
      r.userEmail?.toLowerCase().includes(q) ||
      r.userName?.toLowerCase().includes(q) ||
      r.userPhone?.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const pendingCount = requests.filter((r) => (r.status || "pending") === "pending").length;
  const notifiedCount = requests.filter((r) => r.status === "notified").length;

  const bgCard = isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/90";
  const textTitle = isDarkMode ? "text-white" : "text-slate-900";
  const textSub = isDarkMode ? "text-slate-400" : "text-slate-500";
  const inputBg = isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900";

  return (
    <div className="space-y-6">

      {/* Header & Stats Banner */}
      <div className={`p-6 rounded-3xl border ${bgCard} shadow-sm space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#811331] text-white flex items-center justify-center shadow-md shadow-[#811331]/20">
              <Bell size={24} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${textTitle}`}>
                Back In Stock Notifications
              </h2>
              <p className={`text-sm ${textSub}`}>
                Manage customer alert requests for out-of-stock creations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className={`px-4 py-2 rounded-2xl border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-amber-50 border-amber-200"} flex items-center gap-2`}>
              <Clock size={16} className="text-amber-600" />
              <span className="text-sm font-bold text-amber-700 font-sans">
                {pendingCount} Pending Requests
              </span>
            </div>
            <div className={`px-4 py-2 rounded-2xl border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-emerald-50 border-emerald-200"} flex items-center gap-2`}>
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span className="text-sm font-bold text-emerald-700 font-sans">
                {notifiedCount} Notified
              </span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200/40">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${filter === "all"
                ? "bg-[#811331] text-white shadow-sm"
                : `${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"} hover:bg-[#811331]/10`
                }`}
            >
              All Requests ({requests.length})
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${filter === "pending"
                ? "bg-amber-600 text-white shadow-sm"
                : `${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"} hover:bg-amber-500/10`
                }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter("notified")}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${filter === "notified"
                ? "bg-emerald-600 text-white shadow-sm"
                : `${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"} hover:bg-emerald-500/10`
                }`}
            >
              Notified ({notifiedCount})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${textSub}`} />
            <input
              type="text"
              placeholder="Search client email, name, product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs font-sans outline-none border transition-all ${inputBg}`}
            />
          </div>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className={`p-12 text-center rounded-3xl border ${bgCard} space-y-3`}>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#811331] border-t-transparent mx-auto" />
          <p className={`text-sm ${textSub}`}>Loading alert requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className={`p-12 text-center rounded-3xl border ${bgCard} space-y-3`}>
          <Bell size={40} className="mx-auto text-slate-400 opacity-50" />
          <h3 className={`text-lg font-bold ${textTitle}`}>No Notification Requests Found</h3>
          <p className={`text-sm ${textSub} max-w-sm mx-auto`}>
            {searchTerm
              ? `No requests match "${searchTerm}".`
              : "When customers request back-in-stock alerts for sold out items, they will appear here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map((req) => {
            const isNotified = req.status === "notified";
            const createdDate = req.createdAt?.toMillis
              ? new Date(req.createdAt.toMillis()).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })
              : req.createdAt
                ? new Date(req.createdAt).toLocaleString()
                : "Recent";

            const whatsappMessage = encodeURIComponent(
              `Hi ${req.userName || "Valued Client"},\nGreat news from Velouraz! The creation "${req.productName}" you requested is now back in stock.\n\nShop now: https://www.velouraz.in/product/${req.productId}`
            );

            const mailtoSubject = encodeURIComponent(
              `Back in Stock: ${req.productName} at Velouraz`
            );
            const mailtoBody = encodeURIComponent(
              `Dear ${req.userName || "Valued Client"},\n\nWe are delighted to inform you that "${req.productName}" is back in stock at Velouraz High Jewellery.\n\nYou can order it now at: https://www.velouraz.in/product/${req.productId}\n\nWarm regards,\nVelouraz Concierge`
            );

            return (
              <div
                key={req.id}
                className={`p-5 rounded-3xl border ${bgCard} shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden`}
              >
                {/* Status Indicator Bar */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${isNotified ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                />

                <div className="space-y-4 pt-1">
                  {/* Product Header Pill */}
                  <div className={`p-3 rounded-2xl border flex items-center gap-3 ${isDarkMode ? "bg-slate-800/60 border-slate-700" : "bg-slate-50 border-slate-200/80"}`}>
                    <div className="w-14 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/50 shrink-0">
                      <img
                        src={getOptimizedImageUrl(req.productImage || "/img/jewellery/j.png")}
                        alt={req.productName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h4 className={`text-sm font-bold truncate ${textTitle}`}>
                        {req.productName || "Product"}
                      </h4>
                      <p className="text-xs font-semibold text-[#811331] font-sans">
                        ₹{Number(req.productPrice || 0).toLocaleString()}
                      </p>
                      <a
                        href={`/product/${req.productId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-medium text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        <span>View Product</span>
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="space-y-2 text-xs font-sans">
                    <div className="flex items-center justify-between border-b border-slate-200/40 pb-2">
                      <span className={`font-semibold ${textSub} uppercase tracking-wider text-[10px]`}>
                        Requested Date
                      </span>
                      <span className={`font-medium ${textTitle}`}>
                        {createdDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <User size={14} className="text-[#811331] shrink-0" />
                      <span className={`font-bold ${textTitle} truncate`}>
                        {req.userName || "Client"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-400 shrink-0" />
                      <a
                        href={`mailto:${req.userEmail}?subject=${mailtoSubject}&body=${mailtoBody}`}
                        className="text-blue-600 hover:underline font-medium truncate"
                        title="Send Email"
                      >
                        {req.userEmail}
                      </a>
                    </div>

                    {req.userPhone && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-emerald-600 shrink-0" />
                        <a
                          href={`tel:${req.userPhone}`}
                          className={`hover:underline font-medium ${textTitle}`}
                        >
                          {req.userPhone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-slate-200/40 space-y-2">
                  <div className="flex items-center gap-2">
                    {/* Send Email Action */}
                    <a
                      href={`mailto:${req.userEmail}?subject=${mailtoSubject}&body=${mailtoBody}`}
                      className="flex-1 py-2 px-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                      title="Send Mail"
                    >
                      <Mail size={13} />
                      <span>Email</span>
                    </a>

                    {/* WhatsApp Action */}
                    {req.userPhone && (
                      <a
                        href={`https://wa.me/${req.userPhone.replace(/[^0-9]/g, "")}?text=${whatsappMessage}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                        title="Contact on WhatsApp"
                      >
                        <MessageSquare size={13} />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    {/* Toggle Notified Status */}
                    <button
                      onClick={() => handleToggleStatus(req)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${isNotified
                        ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs"
                        : "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300"
                        }`}
                    >
                      {isNotified ? (
                        <>
                          <CheckCircle2 size={14} />
                          <span>Notified</span>
                        </>
                      ) : (
                        <>
                          <Clock size={14} />
                          <span>Mark Notified</span>
                        </>
                      )}
                    </button>

                    {/* Delete Action */}
                    <button
                      onClick={() => handleDelete(req.id)}
                      className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                      title="Delete Request"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StockNotificationsManager;
