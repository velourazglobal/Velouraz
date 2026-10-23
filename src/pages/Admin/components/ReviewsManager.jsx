import React, { useState, useEffect, useMemo } from "react";
import { db } from "../../../components/Firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";
import {
  Star,
  Plus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Sparkles,
  User,
  X,
  Loader2,
  MessageSquare,
  Award
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ReviewsManager = ({ isDarkMode }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRating, setFilterRating] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    customerName: "",
    place: "",
    title: "Verified Buyer",
    rating: 5,
    quote: "",
    date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    visible: true,
  });

  // Real-time listener for Firestore reviews
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setReviews(list);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to reviews:", error);
      // Fallback query if index is missing
      getDocs(collection(db, "reviews")).then((snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setReviews(list);
        setLoading(false);
      });
    });

    return () => unsubscribe();
  }, []);

  // Compute Metrics
  const metrics = useMemo(() => {
    const total = reviews.length;
    const activeCount = reviews.filter((r) => r.visible !== false).length;
    const fiveStarCount = reviews.filter((r) => Number(r.rating) === 5).length;
    const avgRating = total > 0
      ? (reviews.reduce((acc, curr) => acc + (Number(curr.rating) || 5), 0) / total).toFixed(1)
      : "5.0";
    return { total, activeCount, fiveStarCount, avgRating };
  }, [reviews]);

  // Filtered Reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = (r.customerName || r.name || "").toLowerCase().includes(q);
      const placeMatch = (r.place || r.location || "").toLowerCase().includes(q);
      const quoteMatch = (r.quote || r.review || "").toLowerCase().includes(q);
      const titleMatch = (r.title || "").toLowerCase().includes(q);

      const matchesSearch = !q || nameMatch || placeMatch || quoteMatch || titleMatch;
      const matchesRating = filterRating === "all" || String(r.rating) === String(filterRating);

      return matchesSearch && matchesRating;
    });
  }, [reviews, searchQuery, filterRating]);

  // Modal Handlers
  const handleOpenAdd = () => {
    setEditingReview(null);
    setFormData({
      customerName: "",
      place: "",
      title: "Verified Buyer",
      rating: 5,
      quote: "",
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      visible: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (review) => {
    setEditingReview(review);
    setFormData({
      customerName: review.customerName || review.name || "",
      place: review.place || review.location || "",
      title: review.title || "Verified Buyer",
      rating: Number(review.rating) || 5,
      quote: review.quote || review.review || "",
      date: review.date || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      visible: review.visible !== false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName.trim() || !formData.quote.trim()) return;

    setSubmitting(true);
    try {
      const payload = {
        customerName: formData.customerName.trim(),
        name: formData.customerName.trim(), // fallback field
        place: formData.place.trim(),
        location: formData.place.trim(), // fallback field
        title: formData.title.trim() || "Verified Buyer",
        rating: Number(formData.rating),
        quote: formData.quote.trim(),
        review: formData.quote.trim(), // fallback field
        date: formData.date || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        visible: formData.visible,
        updatedAt: serverTimestamp(),
      };

      if (editingReview) {
        await updateDoc(doc(db, "reviews", editingReview.id), payload);
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, "reviews"), payload);
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving review:", err);
      alert("Failed to save review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await deleteDoc(doc(db, "reviews", id));
    } catch (err) {
      console.error("Error deleting review:", err);
    }
  };

  const handleToggleVisibility = async (review) => {
    try {
      const newStatus = review.visible === false ? true : false;
      await updateDoc(doc(db, "reviews", review.id), {
        visible: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error toggling visibility:", err);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            Homepage Reviews & Testimonials
          </h2>
          <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            Manage customer feedback, star ratings, and location badges for the homepage carousel.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#811331] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#811331]/20 hover:bg-[#9d1a3d] transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Plus size={16} />
          <span>Add New Review</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl border shadow-xs ${isDarkMode ? "bg-slate-800/80 border-slate-700/80 text-white" : "bg-white border-slate-100 text-slate-800"}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Reviews</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <MessageSquare size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2">{metrics.total}</p>
          <p className="text-xs text-slate-400 mt-1">In database</p>
        </div>

        <div className={`p-5 rounded-2xl border shadow-xs ${isDarkMode ? "bg-slate-800/80 border-slate-700/80 text-white" : "bg-white border-slate-100 text-slate-800"}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active on Homepage</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Eye size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2">{metrics.activeCount}</p>
          <p className="text-xs text-emerald-500 font-medium mt-1">Visible to buyers</p>
        </div>

        <div className={`p-5 rounded-2xl border shadow-xs ${isDarkMode ? "bg-slate-800/80 border-slate-700/80 text-white" : "bg-white border-slate-100 text-slate-800"}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Rating</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Star size={18} className="fill-amber-500 text-amber-500" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2">{metrics.avgRating} / 5.0</p>
          <p className="text-xs text-amber-500 font-medium mt-1">Overall Satisfaction</p>
        </div>

        <div className={`p-5 rounded-2xl border shadow-xs ${isDarkMode ? "bg-slate-800/80 border-slate-700/80 text-white" : "bg-white border-slate-100 text-slate-800"}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">5-Star Reviews</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Award size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2">{metrics.fiveStarCount}</p>
          <p className="text-xs text-slate-400 mt-1">Top ratings</p>
        </div>
      </div>

      {/* Controls & Search */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${isDarkMode ? "bg-slate-800/60 border-slate-700" : "bg-white border-slate-100 shadow-xs"}`}>
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, quote, place..."
            className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm outline-none transition-all ${isDarkMode
              ? "bg-slate-900 border border-slate-700 text-white focus:border-[#811331]"
              : "bg-slate-50 border border-slate-200 text-slate-900 focus:border-[#811331]"
              }`}
          />
        </div>

        {/* Rating Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className={`text-xs font-semibold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Filter Rating:</span>
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className={`px-3 py-2 rounded-xl text-sm font-medium outline-none transition-all ${isDarkMode
              ? "bg-slate-900 border border-slate-700 text-white"
              : "bg-slate-50 border border-slate-200 text-slate-800"
              }`}
          >
            <option value="all">All Stars</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {/* Reviews Table / Grid */}
      <div className={`rounded-2xl border overflow-hidden shadow-xs ${isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-white border-slate-100"}`}>
        {loading ? (
          <div className="py-16 text-center text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="animate-spin text-[#811331]" size={20} />
            <span>Loading store reviews...</span>
          </div>
        ) : filteredReviews.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className={`border-b text-xs font-bold uppercase tracking-wider ${isDarkMode ? "bg-slate-900/50 border-slate-700 text-slate-400" : "bg-slate-50/80 border-slate-100 text-slate-500"}`}>
                  <th className="py-4 px-6">Customer & Place</th>
                  <th className="py-4 px-4">Rating</th>
                  <th className="py-4 px-6">Review Quote</th>
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-4 text-center">Homepage Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? "divide-slate-700/60 text-slate-300" : "divide-slate-100 text-slate-700"}`}>
                {filteredReviews.map((rev) => (
                  <tr key={rev.id} className={`transition-colors ${isDarkMode ? "hover:bg-slate-700/40" : "hover:bg-slate-50/60"}`}>

                    {/* Customer & Place */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#811331] to-[#b31d45] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs font-serif">
                          {(rev.customerName || rev.name || "C").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold font-sans text-slate-900 dark:text-white leading-tight">
                            {rev.customerName || rev.name || "Anonymous"}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-serif">
                            <span className="text-[#811331] font-semibold">{rev.title || "Verified Buyer"}</span>
                            {(rev.place || rev.location) && (
                              <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md font-sans text-[14px] font-medium border border-amber-500/20">
                                <MapPin size={10} />
                                {rev.place || rev.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Rating */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < (Number(rev.rating) || 5) ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}
                          />
                        ))}
                      </div>
                    </td>

                    {/* Review Quote */}
                    <td className="py-4 px-6 max-w-md">
                      <p className="line-clamp-2 italic font-serif text-sm leading-relaxed">
                        "{rev.quote || rev.review}"
                      </p>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-500">
                      {rev.date || "N/A"}
                    </td>

                    {/* Status Toggle */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleToggleVisibility(rev)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${rev.visible !== false
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/20"
                          : "bg-slate-500/10 text-slate-400 border border-slate-500/30 hover:bg-slate-500/20"
                          }`}
                      >
                        {rev.visible !== false ? (
                          <>
                            <Eye size={12} /> Live on Homepage
                          </>
                        ) : (
                          <>
                            <EyeOff size={12} /> Hidden
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(rev)}
                          className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-500/10 transition-colors cursor-pointer"
                          title="Edit Review"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(rev.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Delete Review"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <MessageSquare size={36} className="mx-auto text-slate-300" />
            <p className="text-base font-medium">No reviews found</p>
            <p className="text-xs">Click "Add New Review" to create your first customer testimonial.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Review Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative z-10 w-full max-w-lg rounded-3xl border shadow-2xl p-6 sm:p-8 overflow-hidden ${isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-100 text-slate-900"
                }`}
            >
              <div className="flex items-center justify-between border-b pb-4 mb-6 border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-[#811331]" />
                  <h3 className="font-bold text-lg">
                    {editingReview ? "Edit Review" : "Add New Review"}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Customer Name & Place Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-500 dark:text-slate-400">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      placeholder="e.g. Ananya Sharma"
                      className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all ${isDarkMode
                        ? "bg-slate-800 border border-slate-700 text-white focus:border-[#811331]"
                        : "bg-slate-50 border border-slate-200 text-slate-900 focus:border-[#811331]"
                        }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>Place / Location</span>
                      <span className="text-[14px] text-[#811331] font-normal">Requested Field</span>
                    </label>
                    <div className="relative">
                      <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
                      <input
                        type="text"
                        value={formData.place}
                        onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                        placeholder="e.g. Mumbai, India"
                        className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all ${isDarkMode
                          ? "bg-slate-800 border border-slate-700 text-white focus:border-[#811331]"
                          : "bg-slate-50 border border-slate-200 text-slate-900 focus:border-[#811331]"
                          }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Title Tag & Rating Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-500 dark:text-slate-400">
                      Title / Status Tag
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Verified Buyer"
                      className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all ${isDarkMode
                        ? "bg-slate-800 border border-slate-700 text-white focus:border-[#811331]"
                        : "bg-slate-50 border border-slate-200 text-slate-900 focus:border-[#811331]"
                        }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-500 dark:text-slate-400">
                      Star Rating
                    </label>
                    <div className="flex items-center gap-1 py-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData({ ...formData, rating: star })}
                          className="p-1 cursor-pointer hover:scale-110 transition-transform"
                        >
                          <Star
                            size={22}
                            className={star <= formData.rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-500 dark:text-slate-400">
                    Display Date
                  </label>
                  <input
                    type="text"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    placeholder="e.g. 14 Feb 2026"
                    className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all ${isDarkMode
                      ? "bg-slate-800 border border-slate-700 text-white focus:border-[#811331]"
                      : "bg-slate-50 border border-slate-200 text-slate-900 focus:border-[#811331]"
                      }`}
                  />
                </div>

                {/* Quote / Review Text */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-500 dark:text-slate-400">
                    Review Text / Quote *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.quote}
                    onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                    placeholder="Enter the customer review or quote..."
                    className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all ${isDarkMode
                      ? "bg-slate-800 border border-slate-700 text-white focus:border-[#811331]"
                      : "bg-slate-50 border border-slate-200 text-slate-900 focus:border-[#811331]"
                      }`}
                  />
                </div>

                {/* Visibility Toggle */}
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="visibleToggle"
                    checked={formData.visible}
                    onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                    className="w-4 h-4 rounded text-[#811331] focus:ring-[#811331] cursor-pointer"
                  />
                  <label htmlFor="visibleToggle" className="text-sm font-medium cursor-pointer">
                    Show this review on Homepage Carousel
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-[#811331] text-white font-bold text-sm shadow-lg shadow-[#811331]/20 hover:bg-[#9d1a3d] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    <span>{editingReview ? "Update Review" : "Save Review"}</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ReviewsManager;
