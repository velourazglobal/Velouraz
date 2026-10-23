import React, { useState, useEffect } from "react";
import { listenToCoupons, addCoupon, deleteCoupon, toggleCouponStatus } from "../../../services/couponService";
import { TicketPercent, Plus, Trash2, CheckCircle2, XCircle, Sparkles, Percent, DollarSign, Calendar, Lock } from "lucide-react";

const CouponManager = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    minOrderAmount: "",
    maxDiscount: "",
    expiryDate: "",
    description: "",
  });

  useEffect(() => {
    const unsub = listenToCoupons((data) => setCoupons(data));
    return () => unsub();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddCoupon = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!formData.code.trim()) {
      setErrorMsg("Coupon code is required.");
      return;
    }

    if (!formData.discountValue || Number(formData.discountValue) <= 0) {
      setErrorMsg("Discount value must be greater than 0.");
      return;
    }

    setLoading(true);
    try {
      await addCoupon(formData);
      setSuccessMsg(`Coupon "${formData.code.toUpperCase()}" created successfully!`);
      setFormData({
        code: "",
        discountType: "percentage",
        discountValue: "",
        minOrderAmount: "",
        maxDiscount: "",
        expiryDate: "",
        description: "",
      });
    } catch (err) {
      console.error("Error creating coupon:", err);
      setErrorMsg("Failed to create coupon. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (couponId, code) => {
    if (couponId.startsWith("default-")) {
      alert("Default system coupons cannot be deleted.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete coupon "${code}"?`)) {
      try {
        await deleteCoupon(couponId);
      } catch (err) {
        console.error("Error deleting coupon:", err);
      }
    }
  };

  const handleToggle = async (couponId, currentStatus) => {
    if (couponId.startsWith("default-")) {
      alert("Default system coupons status is fixed.");
      return;
    }
    try {
      await toggleCouponStatus(couponId, currentStatus);
    } catch (err) {
      console.error("Error toggling coupon status:", err);
    }
  };

  const activeCount = coupons.filter((c) => c.isActive).length;
  const percentCount = coupons.filter((c) => c.discountType === "percentage").length;
  const flatCount = coupons.filter((c) => c.discountType === "flat").length;

  return (
    <div className="space-y-8 font-sans text-slate-800">
      
      {/* Page Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#811331] block">
              Promotional Rewards Suite
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 flex items-center gap-2.5">
              <TicketPercent className="text-[#811331]" size={28} /> Coupon Manager
            </h1>
            <p className="text-sm text-slate-500">
              Create and manage promotional discount coupons for user checkout savings.
            </p>
          </div>
        </div>

        {/* Coupon Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <p className="text-xs font-semibold uppercase text-slate-500">Total Coupons</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{coupons.length}</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
            <p className="text-xs font-semibold uppercase text-emerald-700">Active Coupons</p>
            <p className="text-2xl font-bold text-emerald-800 mt-1">{activeCount}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
            <p className="text-xs font-semibold uppercase text-blue-700">% Off Offers</p>
            <p className="text-2xl font-bold text-blue-800 mt-1">{percentCount}</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <p className="text-xs font-semibold uppercase text-amber-700">Flat ₹ Offers</p>
            <p className="text-2xl font-bold text-amber-800 mt-1">{flatCount}</p>
          </div>
        </div>
      </div>

      {/* Add New Coupon Form */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
          <Sparkles className="text-[#811331]" size={20} />
          <h3 className="text-lg font-serif font-bold text-slate-900">Create New Promo Coupon</h3>
        </div>

        <form onSubmit={handleAddCoupon} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            
            {/* Coupon Code */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Coupon Code *</label>
              <input
                type="text"
                name="code"
                required
                placeholder="e.g. FESTIVE20"
                value={formData.code}
                onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold uppercase outline-none focus:border-[#811331] focus:ring-1 focus:ring-[#811331]"
              />
            </div>

            {/* Discount Type */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Discount Type *</label>
              <select
                name="discountType"
                value={formData.discountType}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#811331] focus:ring-1 focus:ring-[#811331]"
              >
                <option value="percentage">Percentage (% OFF)</option>
                <option value="flat">Flat Amount (₹ OFF)</option>
              </select>
            </div>

            {/* Discount Value */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Discount Value ({formData.discountType === "percentage" ? "%" : "₹"}) *
              </label>
              <input
                type="number"
                name="discountValue"
                required
                min="1"
                placeholder={formData.discountType === "percentage" ? "e.g. 15" : "e.g. 500"}
                value={formData.discountValue}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#811331] focus:ring-1 focus:ring-[#811331]"
              />
            </div>

            {/* Minimum Order Amount */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Min Order Amount (₹)</label>
              <input
                type="number"
                name="minOrderAmount"
                min="0"
                placeholder="e.g. 1999"
                value={formData.minOrderAmount}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#811331] focus:ring-1 focus:ring-[#811331]"
              />
            </div>

            {/* Max Discount Limit */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Max Discount Cap (₹) {formData.discountType === "flat" ? "(Optional)" : ""}
              </label>
              <input
                type="number"
                name="maxDiscount"
                min="0"
                placeholder="e.g. 1000"
                value={formData.maxDiscount}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#811331] focus:ring-1 focus:ring-[#811331]"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Expiry Date (Optional)</label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#811331] focus:ring-1 focus:ring-[#811331]"
              />
            </div>

          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Offer Description / Subtext</label>
            <input
              type="text"
              name="description"
              placeholder="e.g. Get 15% off on orders above ₹4,999"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#811331] focus:ring-1 focus:ring-[#811331]"
            />
          </div>

          {errorMsg && <p className="text-xs text-rose-600 font-semibold">{errorMsg}</p>}
          {successMsg && <p className="text-xs text-emerald-600 font-semibold">{successMsg}</p>}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-[#811331] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#650f27] transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Plus size={16} />
              <span>{loading ? "Publishing..." : "Publish Coupon"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Coupons List Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6 sm:p-8">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <h3 className="text-lg font-serif font-bold text-slate-900">Active & Published Coupons ({coupons.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Coupon Code</th>
                <th className="py-3.5 px-4">Discount</th>
                <th className="py-3.5 px-4">Min Order</th>
                <th className="py-3.5 px-4">Max Cap</th>
                <th className="py-3.5 px-4">Expiry</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-slate-50/60 transition-colors">
                  
                  {/* Coupon Code */}
                  <td className="py-4 px-4 font-mono font-bold text-slate-900">
                    <span className="px-3 py-1.5 rounded-xl bg-[#811331]/10 text-[#811331] border border-[#811331]/20 inline-flex items-center gap-1.5">
                      <TicketPercent size={14} />
                      {coupon.code}
                    </span>
                  </td>

                  {/* Discount */}
                  <td className="py-4 px-4 font-bold text-slate-800">
                    {coupon.discountType === "percentage" ? (
                      <span className="text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                        {coupon.discountValue}% OFF
                      </span>
                    ) : (
                      <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        Flat ₹{Number(coupon.discountValue).toLocaleString()} OFF
                      </span>
                    )}
                  </td>

                  {/* Min Order */}
                  <td className="py-4 px-4 text-slate-600">
                    {coupon.minOrderAmount ? `₹${Number(coupon.minOrderAmount).toLocaleString()}` : "No Min Order"}
                  </td>

                  {/* Max Cap */}
                  <td className="py-4 px-4 text-slate-600">
                    {coupon.maxDiscount ? `₹${Number(coupon.maxDiscount).toLocaleString()}` : "No Cap"}
                  </td>

                  {/* Expiry */}
                  <td className="py-4 px-4 text-slate-600">
                    {coupon.expiryDate ? coupon.expiryDate : "Never"}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4">
                    <button
                      onClick={() => handleToggle(coupon.id, coupon.isActive)}
                      className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-all ${
                        coupon.isActive
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                      }`}
                    >
                      {coupon.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {coupon.isActive ? "Active" : "Disabled"}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right">
                    {!coupon.isDefault ? (
                      <button
                        onClick={() => handleDelete(coupon.id, coupon.code)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete coupon"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <span title="Built-in System Coupon" className="text-slate-400 p-2 inline-block">
                        <Lock size={14} />
                      </span>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default CouponManager;
