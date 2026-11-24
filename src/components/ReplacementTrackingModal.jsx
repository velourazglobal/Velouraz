import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  RotateCcw,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Camera,
  Eye,
  Calendar,
  Building,
  ShieldCheck,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./Firebase";
import {
  REPLACEMENT_STATUS_MAP,
  REPLACEMENT_TIMELINE_STAGES,
  trackShipmentAwb,
} from "../services/replacementService";
import { getThumbnailUrl } from "../config/cloudinary";

const ReplacementTrackingModal = ({
  isOpen,
  onClose,
  requestId,
  initialData = null,
}) => {
  const [requestData, setRequestData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [copyFeedback, setCopyFeedback] = useState("");
  const [activePhoto, setActivePhoto] = useState(null); // Lightbox photo
  const [activeAwbTracking, setActiveAwbTracking] = useState(null);
  const [awbLoading, setAwbLoading] = useState(false);

  // Subscribe to real-time updates for this replacement request
  useEffect(() => {
    if (!requestId || !isOpen) return;

    setLoading(!requestData);
    const docRef = doc(db, "replacementRequests", requestId);
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          setRequestData({ id: snap.id, ...snap.data() });
        }
        setLoading(false);
      },
      (err) => {
        console.warn("Error listening to replacement request:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [requestId, isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopyFeedback(label || "Copied!");
    setTimeout(() => setCopyFeedback(""), 2000);
  };

  const handleLiveTrackAwb = async (awb) => {
    if (!awb) return;
    setAwbLoading(true);
    try {
      const res = await trackShipmentAwb(awb);
      setActiveAwbTracking(res);
    } catch (err) {
      console.warn("Track AWB error:", err);
    } finally {
      setAwbLoading(false);
    }
  };

  const statusKey = requestData?.status || "REQUESTED";
  const statusInfo = REPLACEMENT_STATUS_MAP[statusKey] || REPLACEMENT_STATUS_MAP.REQUESTED;
  const currentStage = statusInfo.stage;

  const reverseAwb = requestData?.reversePickup?.awb;
  const hasReverseAwb = reverseAwb && !reverseAwb.includes("REV-PENDING");

  const replacementAwb = requestData?.replacementShipment?.awb;
  const hasReplacementAwb = replacementAwb && !replacementAwb.includes("REP-PENDING");

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
        className="bg-[#FDFAF5] rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto relative z-10 border border-[#E5D7C5] shadow-2xl flex flex-col font-sans"
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
                  Replacement Case
                </span>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#14111E] font-mono">
                #{requestData?.requestId || requestId}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-7 space-y-6 flex-1">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 size={32} className="animate-spin text-[#C8A46A] mx-auto" />
              <p className="text-sm font-serif text-[#786C60]">Loading replacement tracking details...</p>
            </div>
          ) : !requestData ? (
            <div className="py-16 text-center text-[#786C60] space-y-2">
              <AlertCircle size={32} className="mx-auto text-amber-500" />
              <p className="font-serif text-base">Replacement record not found.</p>
            </div>
          ) : (
            <>
              {/* Toast Copy Alert */}
              {copyFeedback && (
                <div className="p-3 bg-[#14111E] text-[#C8A46A] rounded-xl text-xs font-bold uppercase tracking-wider text-center animate-fade-in">
                  ✓ {copyFeedback}
                </div>
              )}

              {/* Status Explanation Banner */}
              <div className={`p-4 rounded-2xl border flex items-start gap-3 ${statusInfo.color}`}>
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${statusInfo.dot}`} />
                <div className="space-y-0.5">
                  <h4 className="font-bold text-sm">{statusInfo.label}</h4>
                  <p className="text-xs opacity-90 leading-relaxed">{statusInfo.desc}</p>
                  {requestData.admin?.remarks && (
                    <p className="text-xs mt-1 pt-1 border-t border-black/10 font-serif italic">
                      Admin Note: "{requestData.admin.remarks}"
                    </p>
                  )}
                  {requestData.admin?.rejectionReason && (
                    <p className="text-xs mt-1 pt-1 border-t border-black/10 font-bold text-rose-700">
                      Rejection Reason: {requestData.admin.rejectionReason}
                    </p>
                  )}
                </div>
              </div>

              {/* 8-Stage Visual Timeline */}
              {currentStage >= 0 && (
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E5D7C5] shadow-xs space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#786C60] font-sans flex items-center gap-1.5">
                    <Clock size={14} className="text-[#C8A46A]" /> Progress Timeline
                  </h4>

                  <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
                    {REPLACEMENT_TIMELINE_STAGES.map((stageName, idx) => {
                      const isCompleted = currentStage >= idx;
                      const isCurrent = currentStage === idx;

                      return (
                        <div key={idx} className="flex flex-col items-center text-center gap-1.5">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              isCompleted
                                ? "bg-[#14111E] text-[#C8A46A] border border-[#C8A46A]"
                                : "bg-gray-100 text-gray-400 border border-gray-200"
                            } ${isCurrent ? "ring-2 ring-[#C8A46A] ring-offset-2" : ""}`}
                          >
                            {isCompleted ? <Check size={14} /> : idx + 1}
                          </div>
                          <span
                            className={`text-[10px] leading-tight font-sans ${
                              isCurrent
                                ? "font-bold text-[#14111E]"
                                : isCompleted
                                ? "text-[#786C60] font-medium"
                                : "text-gray-400"
                            }`}
                          >
                            {stageName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dual Shiprocket Logistics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Reverse Pickup Tracking Card */}
                <div className="bg-white p-5 rounded-2xl border border-[#E5D7C5] shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E5D7C5] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                        <RotateCcw size={16} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#14111E]">
                        Reverse Pickup
                      </span>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                      {requestData.reversePickup?.status || "Pending Booking"}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#786C60]">
                    <div className="flex justify-between items-center">
                      <span>Courier Partner:</span>
                      <span className="font-bold text-[#14111E]">
                        {requestData.reversePickup?.courierName || "To be assigned"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span>Reverse AWB:</span>
                      {hasReverseAwb ? (
                        <div className="flex items-center gap-1.5 font-mono font-bold text-[#14111E]">
                          <span>{reverseAwb}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(reverseAwb, "Reverse AWB Copied")}
                            className="p-1 hover:text-[#C8A46A] transition-colors"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Not generated yet</span>
                      )}
                    </div>
                  </div>

                  {hasReverseAwb && (
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleLiveTrackAwb(reverseAwb)}
                        className="flex-1 px-3 py-2 rounded-xl bg-[#14111E] text-[#FBF9F5] text-xs font-bold uppercase tracking-wider hover:bg-[#251D33] transition-all flex items-center justify-center gap-1.5"
                      >
                        <Truck size={12} className="text-[#C8A46A]" /> Track Pickup
                      </button>
                      <a
                        href={requestData.reversePickup?.trackingUrl || `https://shiprocket.co/tracking/${reverseAwb}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 border border-[#E5D7C5] rounded-xl hover:bg-gray-50 text-[#14111E]"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  )}
                </div>

                {/* 2. Replacement Delivery Tracking Card */}
                <div className="bg-white p-5 rounded-2xl border border-[#E5D7C5] shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E5D7C5] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <Package size={16} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#14111E]">
                        Replacement Delivery
                      </span>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {requestData.replacementShipment?.status || "Pending Dispatch"}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#786C60]">
                    <div className="flex justify-between items-center">
                      <span>Logistics Partner:</span>
                      <span className="font-bold text-[#14111E]">
                        {requestData.replacementShipment?.courierName || "To be dispatched"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span>Replacement AWB:</span>
                      {hasReplacementAwb ? (
                        <div className="flex items-center gap-1.5 font-mono font-bold text-[#14111E]">
                          <span>{replacementAwb}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(replacementAwb, "Replacement AWB Copied")}
                            className="p-1 hover:text-[#C8A46A] transition-colors"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Created after return inspection</span>
                      )}
                    </div>
                  </div>

                  {hasReplacementAwb && (
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleLiveTrackAwb(replacementAwb)}
                        className="flex-1 px-3 py-2 rounded-xl bg-[#14111E] text-[#FBF9F5] text-xs font-bold uppercase tracking-wider hover:bg-[#251D33] transition-all flex items-center justify-center gap-1.5"
                      >
                        <Truck size={12} className="text-[#C8A46A]" /> Track Delivery
                      </button>
                      <a
                        href={requestData.replacementShipment?.trackingUrl || `https://shiprocket.co/tracking/${replacementAwb}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 border border-[#E5D7C5] rounded-xl hover:bg-gray-50 text-[#14111E]"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Scanned Tracking Details (if clicked track) */}
              {activeAwbTracking && (
                <div className="bg-white p-5 rounded-2xl border border-[#C8A46A]/50 shadow-sm space-y-3">
                  <div className="flex justify-between items-center border-b border-[#E5D7C5] pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#14111E] flex items-center gap-2">
                      <Truck size={14} className="text-[#C8A46A]" /> Live Courier Scans ({activeAwbTracking.awb})
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveAwbTracking(null)}
                      className="text-gray-400 hover:text-black p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {Array.isArray(activeAwbTracking.activities) && activeAwbTracking.activities.length > 0 ? (
                      activeAwbTracking.activities.map((act, i) => (
                        <div key={i} className="text-xs p-2 rounded-lg bg-[#FAF3E8]/50 border border-[#E5D7C5] flex justify-between gap-3">
                          <div>
                            <p className="font-bold text-[#14111E]">{act.status || act.activity}</p>
                            <p className="text-[11px] text-[#786C60]">{act.location}</p>
                          </div>
                          <span className="text-[10px] text-[#786C60] font-mono shrink-0">
                            {new Date(act.timestamp).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#786C60] italic">
                        Courier manifest registered. Live scans update as the parcel moves through logistics hubs.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Product & Complaint Information */}
              <div className="bg-white p-5 rounded-2xl border border-[#E5D7C5] shadow-xs space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#786C60] font-sans">
                  Item Details & Defect Evidence
                </h4>

                <div className="space-y-3">
                  {requestData.products?.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 pb-3 border-b border-[#E5D7C5] last:border-none last:pb-0">
                      <img
                        src={getThumbnailUrl(item.image || "/img/jewellery/j.png", 140)}
                        alt={item.productName}
                        className="w-12 h-14 rounded-xl object-cover border border-[#E5D7C5]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-sm font-bold text-[#14111E] truncate">
                          {item.productName}
                        </p>
                        <p className="text-xs text-[#786C60]">
                          Qty for Replacement: {item.quantity} • Reason: <span className="font-semibold text-[#14111E]">{requestData.reason}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-[#FAF3E8] p-3.5 rounded-xl border border-[#C8A46A]/30 text-xs text-[#14111E] space-y-1">
                  <span className="font-bold uppercase tracking-wider text-[11px] text-[#8B6B38]">
                    Customer Description
                  </span>
                  <p className="italic leading-relaxed">"{requestData.description}"</p>
                </div>

                {/* Uploaded Defect Photographs Gallery */}
                {requestData.customerImages?.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#786C60] flex items-center gap-1.5">
                      <Camera size={14} className="text-[#C8A46A]" /> Submitted Photographs
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                      {requestData.customerImages.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          onClick={() => setActivePhoto(imgUrl)}
                          className="relative aspect-square rounded-xl overflow-hidden border border-[#E5D7C5] bg-gray-100 cursor-pointer group shadow-xs"
                        >
                          <img
                            src={getThumbnailUrl(imgUrl, 200)}
                            alt={`Evidence ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye size={16} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E5D7C5] bg-white rounded-b-3xl flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#14111E] text-[#FBF9F5] text-xs font-bold uppercase tracking-wider hover:bg-[#251D33] transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>

      {/* Lightbox Preview */}
      <AnimatePresence>
        {activePhoto && (
          <div
            onClick={() => setActivePhoto(null)}
            className="fixed inset-0 z-[250] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md cursor-pointer"
          >
            <div className="relative max-w-3xl max-h-[90vh]">
              <img
                src={activePhoto}
                alt="Enlarged defect photo"
                className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/20"
              />
              <button
                type="button"
                onClick={() => setActivePhoto(null)}
                className="absolute top-3 right-3 p-2 bg-black/70 hover:bg-black text-white rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReplacementTrackingModal;
