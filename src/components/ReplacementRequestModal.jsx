import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  Camera,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Package,
  RotateCcw,
  Sparkles,
  Loader2,
  FileText,
  ChevronRight,
  Info,
} from "lucide-react";
import { useAuth } from "./useAuth";
import {
  uploadToCloudinaryWithProgress,
  getThumbnailUrl,
} from "../config/cloudinary";
import {
  createReplacementRequest,
  DEFAULT_REPLACEMENT_POLICY,
} from "../services/replacementService";

const ReplacementRequestModal = ({
  isOpen,
  onClose,
  order,
  onSuccess,
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  // Form State
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState(DEFAULT_REPLACEMENT_POLICY.reasons[0]);
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]); // Array of { file, url, progress, error, id }
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successData, setSuccessData] = useState(null);

  if (!isOpen || !order) return null;

  const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [];
  const selectedProduct = items[selectedProductIndex] || {
    name: "Jewellery Piece",
    price: order.totalAmount || order.total || 999,
    quantity: 1,
    image: "/img/jewellery/j.png",
  };

  const maxAllowedQty = Math.max(1, Number(selectedProduct.quantity || 1));

  // Handle File Selection
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setErrorMsg("");

    const remainingSlots = DEFAULT_REPLACEMENT_POLICY.maxPhotos - images.length;
    if (remainingSlots <= 0) {
      setErrorMsg(`You have reached the maximum limit of ${DEFAULT_REPLACEMENT_POLICY.maxPhotos} photographs.`);
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);

    // Validate size and mime type
    for (const f of filesToUpload) {
      if (!DEFAULT_REPLACEMENT_POLICY.allowedMimeTypes.includes(f.type?.toLowerCase())) {
        setErrorMsg("Only JPG, JPEG, PNG, and WEBP images are supported.");
        return;
      }
      if (f.size > DEFAULT_REPLACEMENT_POLICY.maxPhotoSizeMB * 1024 * 1024) {
        setErrorMsg(`"${f.name}" exceeds the maximum 5MB size limit.`);
        return;
      }
    }

    // Prepare placeholders with initial progress
    const newPlaceholders = filesToUpload.map((f, i) => ({
      id: `${Date.now()}-${i}-${Math.random()}`,
      file: f,
      name: f.name,
      url: URL.createObjectURL(f), // Local preview
      uploadedUrl: null,
      progress: 0,
      uploading: true,
      error: null,
    }));

    setImages((prev) => [...prev, ...newPlaceholders]);
    setIsUploading(true);

    // Upload each in parallel with progress
    for (const placeholder of newPlaceholders) {
      try {
        const uploadedUrl = await uploadToCloudinaryWithProgress(
          placeholder.file,
          (percent) => {
            setImages((prev) =>
              prev.map((img) =>
                img.id === placeholder.id ? { ...img, progress: percent } : img
              )
            );
          }
        );

        setImages((prev) =>
          prev.map((img) =>
            img.id === placeholder.id
              ? { ...img, uploadedUrl, uploading: false, progress: 100 }
              : img
          )
        );
      } catch (uploadErr) {
        console.error("Cloudinary upload error:", uploadErr);
        setImages((prev) =>
          prev.map((img) =>
            img.id === placeholder.id
              ? { ...img, uploading: false, error: "Upload failed" }
              : img
          )
        );
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    // Validation
    const uploadedUrls = images.filter((img) => img.uploadedUrl).map((img) => img.uploadedUrl);
    if (images.some((img) => img.uploading)) {
      setErrorMsg("Please wait for all photographs to finish uploading.");
      return;
    }
    if (uploadedUrls.length === 0) {
      setErrorMsg("Photographic evidence is mandatory. Please upload at least one photograph showing the defect.");
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setErrorMsg("Please provide a detailed description of the problem (minimum 10 characters).");
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedItemPayload = [
        {
          id: selectedProduct.id || `PROD-${selectedProductIndex}`,
          productId: selectedProduct.id || `PROD-${selectedProductIndex}`,
          name: selectedProduct.name || "Jewellery Piece",
          sku: selectedProduct.sku || `SKU-${selectedProduct.id || "JWL"}`,
          quantity: Number(quantity),
          orderedQuantity: Number(selectedProduct.quantity || 1),
          price: Number(selectedProduct.price || 0),
          image: selectedProduct.image || "/img/jewellery/j.png",
          reason,
        },
      ];

      const res = await createReplacementRequest({
        order,
        selectedProducts: selectedItemPayload,
        reason,
        description: description.trim(),
        images: uploadedUrls,
        user,
      });

      setSuccessData(res);
      if (onSuccess) onSuccess(res.replacementData);
    } catch (err) {
      console.error("Replacement request creation failed:", err);
      setErrorMsg(err.message || "Failed to submit replacement request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-[#0B0711]/85 backdrop-blur-md"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="bg-[#FDFAF5] rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto relative z-10 border border-[#E5D7C5] shadow-2xl flex flex-col font-sans"
      >
        {/* Header */}
        <div className="p-6 sm:p-7 border-b border-[#E5D7C5] flex items-center justify-between bg-white rounded-t-3xl sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#14111E] text-[#C8A46A] flex items-center justify-center shadow-sm">
              <RotateCcw size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#C8A46A] font-sans">
                  Velouraz Guarantee
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold uppercase">
                  Insured Reverse Pickup
                </span>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#14111E]">
                Request Product Replacement
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-7 space-y-6 flex-1">
          {successData ? (
            /* Success State */
            <div className="py-8 text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#C8A46A]">
                  Request Registered
                </span>
                <h4 className="font-serif text-2xl sm:text-3xl font-bold text-[#14111E]">
                  Replacement Claim Submitted
                </h4>
                <p className="text-sm text-[#786C60] max-w-md mx-auto leading-relaxed">
                  Your replacement request has been submitted successfully. Our team will review your photographic evidence and arrange reverse pickup shortly.
                </p>
              </div>

              {/* Request ID Badge */}
              <div className="bg-[#FAF3E8] border border-[#C8A46A]/40 rounded-2xl p-4 max-w-md mx-auto">
                <p className="text-xs uppercase tracking-wider text-[#786C60] font-bold">
                  Replacement Request ID
                </p>
                <p className="text-xl font-mono font-bold text-[#14111E] tracking-wider mt-0.5">
                  #{successData.requestId}
                </p>
                <p className="text-xs text-[#8B6B38] mt-1 font-serif italic">
                  Linked to Order #{order.orderNumber || order.id}
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#14111E] text-[#FBF9F5] text-xs font-bold uppercase tracking-wider hover:bg-[#251D33] transition-all shadow-sm"
                >
                  View My Orders & Track
                </button>
              </div>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Alert */}
              {errorMsg && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 1. Select Product for Replacement */}
              <div className="space-y-2.5">
                <label className="text-xs uppercase font-bold tracking-wider text-[#786C60] block">
                  1. Select Defective Product Requiring Replacement
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedProductIndex(idx);
                        setQuantity(1);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        selectedProductIndex === idx
                          ? "bg-[#FAF3E8] border-[#C8A46A] shadow-xs"
                          : "bg-white border-[#E5D7C5] hover:border-[#C8A46A]/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={getThumbnailUrl(item.image || "/img/jewellery/j.png", 140)}
                          alt={item.name}
                          className="w-12 h-14 rounded-xl object-cover border border-[#E5D7C5] shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-serif text-sm font-bold text-[#14111E] truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-[#786C60] mt-0.5">
                            Ordered Qty: {item.quantity || 1} • Rate: ₹{Number(item.price || 0).toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            selectedProductIndex === idx
                              ? "border-[#14111E] bg-[#14111E] text-[#C8A46A]"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {selectedProductIndex === idx && <CheckCircle2 size={12} />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Select Quantity & Reason */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase font-bold tracking-wider text-[#786C60] block">
                    2. Replacement Quantity
                  </label>
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full bg-white border border-[#E5D7C5] rounded-xl px-4 py-2.5 text-sm font-semibold text-[#14111E] outline-none focus:border-[#C8A46A] transition-all"
                  >
                    {Array.from({ length: maxAllowedQty }, (_, i) => i + 1).map((q) => (
                      <option key={q} value={q}>
                        {q} {q === 1 ? "Unit" : "Units"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase font-bold tracking-wider text-[#786C60] block">
                    3. Reason for Replacement
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-white border border-[#E5D7C5] rounded-xl px-4 py-2.5 text-sm font-semibold text-[#14111E] outline-none focus:border-[#C8A46A] transition-all"
                  >
                    {DEFAULT_REPLACEMENT_POLICY.reasons.map((r, i) => (
                      <option key={i} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4. Detailed Description */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs uppercase font-bold tracking-wider text-[#786C60] block">
                    4. Description of Problem / Defect
                  </label>
                  <span className="text-[11px] text-[#786C60]">
                    {description.length}/500 chars (min 10)
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={500}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe exactly what defect, breakage, stone missing, or damage was observed on the jewellery piece upon opening..."
                  className="w-full bg-white border border-[#E5D7C5] rounded-xl p-3.5 text-sm font-sans text-[#14111E] outline-none focus:border-[#C8A46A] transition-all placeholder:text-gray-400 resize-none"
                />
              </div>

              {/* 5. Photo Upload Evidence */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase font-bold tracking-wider text-[#786C60] flex items-center gap-1.5">
                    <Camera size={14} className="text-[#C8A46A]" />
                    <span>5. Upload Defect Photographs (Mandatory)</span>
                  </label>
                  <span className="text-[11px] text-[#786C60]">
                    {images.length}/{DEFAULT_REPLACEMENT_POLICY.maxPhotos} images (Max 5MB each)
                  </span>
                </div>

                {/* Upload Drag/Click Zone */}
                {images.length < DEFAULT_REPLACEMENT_POLICY.maxPhotos && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#C8A46A]/50 bg-[#FAF3E8]/60 hover:bg-[#FAF3E8] hover:border-[#C8A46A] rounded-2xl p-5 text-center cursor-pointer transition-all space-y-1.5 group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-full bg-white border border-[#E5D7C5] flex items-center justify-center mx-auto text-[#14111E] group-hover:scale-105 transition-transform">
                      <Upload size={18} className="text-[#C8A46A]" />
                    </div>
                    <p className="text-xs font-bold text-[#14111E]">
                      Click to upload photographs of the defect
                    </p>
                    <p className="text-[11px] text-[#786C60]">
                      Accepts JPG, PNG, WEBP • Clear, well-lit photos accelerate approval
                    </p>
                  </div>
                )}

                {/* Thumbnail Previews & Progress */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                    {images.map((img) => (
                      <div
                        key={img.id}
                        className="relative rounded-xl overflow-hidden border border-[#E5D7C5] bg-white group aspect-square shadow-xs"
                      >
                        <img
                          src={img.uploadedUrl || img.url}
                          alt="Evidence"
                          className="w-full h-full object-cover"
                        />

                        {/* Uploading overlay */}
                        {img.uploading && (
                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-2 text-white">
                            <Loader2 size={16} className="animate-spin mb-1 text-[#C8A46A]" />
                            <span className="text-[10px] font-bold">{img.progress}%</span>
                            <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden mt-1">
                              <div
                                className="bg-[#C8A46A] h-full transition-all"
                                style={{ width: `${img.progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Error overlay */}
                        {img.error && (
                          <div className="absolute inset-0 bg-rose-900/80 flex items-center justify-center p-2 text-white text-center">
                            <span className="text-[10px] font-bold">{img.error}</span>
                          </div>
                        )}

                        {/* Remove button */}
                        {!img.uploading && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(img.id);
                            }}
                            className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full transition-colors opacity-90 group-hover:opacity-100"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Policy Terms Note */}
              <div className="bg-[#F6F2EC] rounded-2xl p-4 border border-[#E5D7C5] flex items-start gap-3 text-xs text-[#786C60] leading-relaxed">
                <Info size={16} className="text-[#C8A46A] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#14111E]">Velouraz Policy Summary: </span>
                  Upon approval, our Shiprocket courier partner will execute a free reverse pickup. After gemological receipt & craftsmanship inspection, a brand-new replacement piece will be dispatched at zero additional charge.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E5D7C5]">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting || isUploading}
                  className="px-5 py-2.5 rounded-xl border border-[#E5D7C5] text-[#14111E] text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading || images.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-[#14111E] text-[#FBF9F5] text-xs font-bold uppercase tracking-wider hover:bg-[#251D33] transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-[#C8A46A]" />
                      <span>Submitting Claim...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw size={14} className="text-[#C8A46A]" />
                      <span>Submit Replacement Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ReplacementRequestModal;

