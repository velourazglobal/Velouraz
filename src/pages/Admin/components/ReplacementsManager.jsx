import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  Package,
  Eye,
  Camera,
  ExternalLink,
  Copy,
  Check,
  X,
  AlertCircle,
  FileText,
  Download,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Loader2,
  HelpCircle,
  Layers,
  ChevronDown,
  Printer,
  Sparkles,
} from "lucide-react";
import {
  listenToAllReplacements,
  reviewReplacementRequest,
  bookReversePickup,
  confirmReturnReceived,
  createReplacementShipment,
  REPLACEMENT_STATUS_MAP,
  trackShipmentAwb,
} from "../../../services/replacementService";
import { checkCourierServiceability } from "../../../services/shiprocketService";
import { getThumbnailUrl } from "../../../config/cloudinary";

const ReplacementsManager = ({ isDarkMode = false }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copyFeedback, setCopyFeedback] = useState("");

  // Modals state
  const [selectedRequest, setSelectedRequest] = useState(null); // Full view modal
  const [lightboxImage, setLightboxImage] = useState(null); // Fullscreen image
  const [actionModalType, setActionModalType] = useState(null); // 'APPROVE' | 'REJECT' | 'REVERSE_PICKUP' | 'INSPECTION' | 'REPLACEMENT_SHIPMENT' | null
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");

  // Action Form States
  const [adminRemarks, setAdminRemarks] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Reverse Pickup Form State
  const [reversePickupForm, setReversePickupForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    weight: "0.5",
    length: "10",
    breadth: "10",
    height: "5",
    courierId: "",
  });
  const [reverseCouriers, setReverseCouriers] = useState([]);
  const [checkingReverseService, setCheckingReverseService] = useState(false);

  // Inspection Form State
  const [inspectionStatus, setInspectionStatus] = useState("PASSED"); // 'PENDING' | 'PASSED' | 'FAILED'
  const [inspectionRemarks, setInspectionRemarks] = useState("");

  // Replacement Delivery Form State
  const [replacementShipForm, setReplacementShipForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    weight: "0.5",
    length: "10",
    breadth: "10",
    height: "5",
    courierId: "",
  });
  const [replacementCouriers, setReplacementCouriers] = useState([]);
  const [checkingReplacementService, setCheckingReplacementService] = useState(false);

  // Live real-time listener for all replacements
  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToAllReplacements(
      (data) => {
        setRequests(data);
        setLoading(false);
      },
      (err) => {
        console.warn("Failed to listen to replacement requests:", err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopyFeedback(label || "Copied!");
    setTimeout(() => setCopyFeedback(""), 2000);
  };

  // ─── Dashboard Metrics ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = requests.length;
    const requested = requests.filter((r) => r.status === "REQUESTED").length;
    const underReview = requests.filter((r) => r.status === "UNDER_REVIEW").length;
    const approved = requests.filter((r) => r.status === "APPROVED").length;
    const rejected = requests.filter((r) => r.status === "REJECTED").length;
    const pickupPending = requests.filter(
      (r) => r.status === "REVERSE_PICKUP_PENDING" || r.status === "REVERSE_PICKUP_SCHEDULED"
    ).length;
    const pickupCompleted = requests.filter(
      (r) => r.status === "REVERSE_PICKED_UP" || r.status === "RETURN_RECEIVED"
    ).length;
    const processing = requests.filter(
      (r) => r.status === "INSPECTION_APPROVED" || r.status === "REPLACEMENT_PROCESSING"
    ).length;
    const shipped = requests.filter(
      (r) => r.status === "REPLACEMENT_SHIPPED" || r.status === "REPLACEMENT_DELIVERED"
    ).length;
    const completed = requests.filter((r) => r.status === "CLOSED").length;

    return {
      total,
      requested,
      underReview,
      approved,
      rejected,
      pickupPending,
      pickupCompleted,
      processing,
      shipped,
      completed,
    };
  }, [requests]);

  // ─── Filtered Requests Calculation ──────────────────────────────────────────
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "NEW" && req.status !== "REQUESTED") return false;
        if (statusFilter === "REVIEW" && req.status !== "UNDER_REVIEW") return false;
        if (statusFilter === "APPROVED" && req.status !== "APPROVED") return false;
        if (statusFilter === "REJECTED" && req.status !== "REJECTED") return false;
        if (
          statusFilter === "PICKUP" &&
          req.status !== "REVERSE_PICKUP_PENDING" &&
          req.status !== "REVERSE_PICKUP_SCHEDULED"
        )
          return false;
        if (
          statusFilter === "INSPECTION" &&
          req.status !== "RETURN_RECEIVED" &&
          req.status !== "INSPECTION_PENDING" &&
          req.status !== "INSPECTION_APPROVED"
        )
          return false;
        if (statusFilter === "SHIPPED" && req.status !== "REPLACEMENT_SHIPPED") return false;
        if (statusFilter === "COMPLETED" && req.status !== "CLOSED" && req.status !== "REPLACEMENT_DELIVERED")
          return false;
      }

      // Search query
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const idMatch = String(req.id || "").toLowerCase().includes(q);
        const orderMatch = String(req.orderNumber || req.orderId || "").toLowerCase().includes(q);
        const nameMatch = String(req.customerName || "").toLowerCase().includes(q);
        const phoneMatch = String(req.customerPhone || "").toLowerCase().includes(q);
        const emailMatch = String(req.customerEmail || "").toLowerCase().includes(q);
        const reasonMatch = String(req.reason || "").toLowerCase().includes(q);
        if (!idMatch && !orderMatch && !nameMatch && !phoneMatch && !emailMatch && !reasonMatch) {
          return false;
        }
      }

      return true;
    });
  }, [requests, statusFilter, searchQuery]);

  // ─── Actions Handlers ───────────────────────────────────────────────────────
  const openApproveModal = (req) => {
    setSelectedRequest(req);
    setAdminRemarks("");
    setActionError("");
    setActionSuccessMsg("");
    setActionModalType("APPROVE");
  };

  const handleConfirmApprove = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    setActionError("");
    try {
      await reviewReplacementRequest({
        requestId: selectedRequest.id,
        decision: "APPROVE",
        remarks: adminRemarks.trim(),
      });
      setActionSuccessMsg("Request successfully approved. Ready to book reverse pickup.");
      setTimeout(() => {
        setActionModalType(null);
        setSelectedRequest(null);
      }, 1500);
    } catch (err) {
      setActionError(err.message || "Failed to approve request.");
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (req) => {
    setSelectedRequest(req);
    setRejectionReason("");
    setAdminRemarks("");
    setActionError("");
    setActionSuccessMsg("");
    setActionModalType("REJECT");
  };

  const handleConfirmReject = async () => {
    if (!selectedRequest) return;
    if (!rejectionReason.trim()) {
      setActionError("Please provide a mandatory reason for rejecting this replacement claim.");
      return;
    }
    setActionLoading(true);
    setActionError("");
    try {
      await reviewReplacementRequest({
        requestId: selectedRequest.id,
        decision: "REJECT",
        rejectionReason: rejectionReason.trim(),
        remarks: adminRemarks.trim(),
      });
      setActionSuccessMsg("Request rejected. Notification email dispatched to customer.");
      setTimeout(() => {
        setActionModalType(null);
        setSelectedRequest(null);
      }, 1500);
    } catch (err) {
      setActionError(err.message || "Failed to reject request.");
    } finally {
      setActionLoading(false);
    }
  };

  // Open Reverse Pickup Modal
  const openReversePickupModal = (req) => {
    setSelectedRequest(req);
    const addr = req.reversePickup?.pickupAddress || {};
    setReversePickupForm({
      name: addr.name || req.customerName || "",
      phone: addr.phone || req.customerPhone || "",
      email: addr.email || req.customerEmail || "",
      address: addr.address || addr.fullAddress || "",
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.pincode || "",
      weight: "0.5",
      length: "10",
      breadth: "10",
      height: "5",
      courierId: "",
    });
    setReverseCouriers([]);
    setActionError("");
    setActionSuccessMsg("");
    setActionModalType("REVERSE_PICKUP");
  };

  const handleCheckReverseCouriers = async () => {
    const pin = String(reversePickupForm.pincode || "").replace(/\D/g, "");
    if (pin.length !== 6) {
      setActionError("Please enter a valid 6-digit customer pickup pincode.");
      return;
    }
    setCheckingReverseService(true);
    setActionError("");
    try {
      // In return shipments: pickup is customer pincode, destination is Velouraz (452014)
      const res = await checkCourierServiceability({
        pickupPincode: pin,
        deliveryPincode: "452014",
        weight: reversePickupForm.weight || "0.5",
      });
      setReverseCouriers(res.couriers || []);
      if (res.couriers?.[0]?.courier_company_id) {
        setReversePickupForm((prev) => ({
          ...prev,
          courierId: String(res.couriers[0].courier_company_id),
        }));
      }
    } catch (err) {
      setActionError(err.message || "Failed to check Shiprocket reverse courier serviceability.");
    } finally {
      setCheckingReverseService(false);
    }
  };

  const handleConfirmReversePickup = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    setActionError("");
    try {
      const payload = {
        requestId: selectedRequest.id,
        pickupAddress: {
          name: reversePickupForm.name,
          phone: reversePickupForm.phone,
          email: reversePickupForm.email,
          address: reversePickupForm.address,
          city: reversePickupForm.city,
          state: reversePickupForm.state,
          pincode: reversePickupForm.pincode,
        },
        packageDetails: {
          weight: reversePickupForm.weight,
          length: reversePickupForm.length,
          breadth: reversePickupForm.breadth,
          height: reversePickupForm.height,
        },
        courierId: reversePickupForm.courierId || null,
      };

      await bookReversePickup(payload);
      setActionSuccessMsg("Shiprocket reverse pickup successfully booked & AWB generated!");
      setTimeout(() => {
        setActionModalType(null);
        setSelectedRequest(null);
      }, 1500);
    } catch (err) {
      setActionError(err.message || "Failed to book reverse pickup with Shiprocket.");
    } finally {
      setActionLoading(false);
    }
  };

  // Open Inspection / Return Received Modal
  const openInspectionModal = (req) => {
    setSelectedRequest(req);
    setInspectionStatus("PASSED");
    setInspectionRemarks("");
    setActionError("");
    setActionSuccessMsg("");
    setActionModalType("INSPECTION");
  };

  const handleConfirmInspection = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    setActionError("");
    try {
      await confirmReturnReceived({
        requestId: selectedRequest.id,
        inspectionStatus,
        inspectionRemarks: inspectionRemarks.trim(),
      });
      setActionSuccessMsg("Item receipt and inspection recorded successfully.");
      setTimeout(() => {
        setActionModalType(null);
        setSelectedRequest(null);
      }, 1500);
    } catch (err) {
      setActionError(err.message || "Failed to record return inspection.");
    } finally {
      setActionLoading(false);
    }
  };

  // Open Replacement Delivery Shipment Modal
  const openReplacementShipModal = (req) => {
    setSelectedRequest(req);
    const addr = req.replacementShipment?.deliveryAddress || req.reversePickup?.pickupAddress || {};
    setReplacementShipForm({
      name: addr.name || req.customerName || "",
      phone: addr.phone || req.customerPhone || "",
      email: addr.email || req.customerEmail || "",
      address: addr.address || addr.fullAddress || "",
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.pincode || "",
      weight: "0.5",
      length: "10",
      breadth: "10",
      height: "5",
      courierId: "",
    });
    setReplacementCouriers([]);
    setActionError("");
    setActionSuccessMsg("");
    setActionModalType("REPLACEMENT_SHIPMENT");
  };

  const handleCheckReplacementCouriers = async () => {
    const pin = String(replacementShipForm.pincode || "").replace(/\D/g, "");
    if (pin.length !== 6) {
      setActionError("Please enter a valid 6-digit delivery pincode.");
      return;
    }
    setCheckingReplacementService(true);
    setActionError("");
    try {
      const res = await checkCourierServiceability({
        pickupPincode: "452014",
        deliveryPincode: pin,
        weight: replacementShipForm.weight || "0.5",
      });
      setReplacementCouriers(res.couriers || []);
      if (res.couriers?.[0]?.courier_company_id) {
        setReplacementShipForm((prev) => ({
          ...prev,
          courierId: String(res.couriers[0].courier_company_id),
        }));
      }
    } catch (err) {
      setActionError(err.message || "Failed to check courier serviceability.");
    } finally {
      setCheckingReplacementService(false);
    }
  };

  const handleConfirmReplacementShipment = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    setActionError("");
    try {
      const payload = {
        requestId: selectedRequest.id,
        deliveryAddress: {
          name: replacementShipForm.name,
          phone: replacementShipForm.phone,
          email: replacementShipForm.email,
          address: replacementShipForm.address,
          city: replacementShipForm.city,
          state: replacementShipForm.state,
          pincode: replacementShipForm.pincode,
        },
        packageDetails: {
          weight: replacementShipForm.weight,
          length: replacementShipForm.length,
          breadth: replacementShipForm.breadth,
          height: replacementShipForm.height,
        },
        courierId: replacementShipForm.courierId || null,
      };

      await createReplacementShipment(payload);
      setActionSuccessMsg("Replacement piece dispatched with Shiprocket! AWB assigned.");
      setTimeout(() => {
        setActionModalType(null);
        setSelectedRequest(null);
      }, 1500);
    } catch (err) {
      setActionError(err.message || "Failed to create replacement shipment.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {copyFeedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#14111E] text-[#C8A46A] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-xl border border-[#C8A46A]/30">
          ✓ {copyFeedback}
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-[#E5D7C5] dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#14111E] text-[#C8A46A] flex items-center justify-center shadow-sm">
            <RotateCcw size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold uppercase tracking-widest text-[#C8A46A]">
                Executive Control
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold uppercase border border-emerald-200 dark:border-emerald-800">
                Shiprocket Reverse Logistics
              </span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-[#14111E] dark:text-white">
              Returns & Replacement Management
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-xl bg-[#FAF3E8] dark:bg-slate-800 text-[#8B6B38] dark:text-amber-300 text-xs font-bold uppercase tracking-wider border border-[#C8A46A]/30">
            {stats.total} Total Claims
          </span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-[#E5D7C5] dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#786C60] dark:text-slate-400">
            New Claims
          </span>
          <p className="text-2xl font-serif font-bold text-amber-600 dark:text-amber-400">
            {stats.requested}
          </p>
          <span className="text-[10px] text-gray-500">Requires Review</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-[#E5D7C5] dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#786C60] dark:text-slate-400">
            Approved
          </span>
          <p className="text-2xl font-serif font-bold text-emerald-600 dark:text-emerald-400">
            {stats.approved}
          </p>
          <span className="text-[10px] text-gray-500">Pending Reverse Pickup</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-[#E5D7C5] dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#786C60] dark:text-slate-400">
            Reverse Pickup
          </span>
          <p className="text-2xl font-serif font-bold text-purple-600 dark:text-purple-400">
            {stats.pickupPending}
          </p>
          <span className="text-[10px] text-gray-500">In Transit to Hub</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-[#E5D7C5] dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#786C60] dark:text-slate-400">
            Replacement Shipped
          </span>
          <p className="text-2xl font-serif font-bold text-blue-600 dark:text-blue-400">
            {stats.shipped}
          </p>
          <span className="text-[10px] text-gray-500">New Item Dispatched</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-[#E5D7C5] dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#786C60] dark:text-slate-400">
            Claims Rejected
          </span>
          <p className="text-2xl font-serif font-bold text-rose-600 dark:text-rose-400">
            {stats.rejected}
          </p>
          <span className="text-[10px] text-gray-500">Ineligible Claims</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-[#E5D7C5] dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-3 text-[#786C60] dark:text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Request ID, Order #, Name, Phone..."
            className="w-full bg-[#FAF3E8]/50 dark:bg-slate-800 border border-[#E5D7C5] dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs font-sans text-[#14111E] dark:text-white outline-none focus:border-[#C8A46A] transition-all"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: "all", label: "All" },
            { id: "NEW", label: "New Claims", count: stats.requested },
            { id: "APPROVED", label: "Approved", count: stats.approved },
            { id: "PICKUP", label: "Pickup Active", count: stats.pickupPending },
            { id: "INSPECTION", label: "Inspection", count: stats.pickupCompleted },
            { id: "SHIPPED", label: "Dispatched", count: stats.shipped },
            { id: "REJECTED", label: "Rejected", count: stats.rejected },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? "bg-[#14111E] text-[#C8A46A] shadow-xs"
                  : "bg-gray-100 dark:bg-slate-800 text-[#786C60] dark:text-slate-400 hover:text-black dark:hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    statusFilter === tab.id
                      ? "bg-[#C8A46A] text-[#14111E]"
                      : "bg-gray-200 dark:bg-slate-700 text-[#786C60]"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-[#E5D7C5] dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="border-b border-[#E5D7C5] dark:border-slate-800 bg-[#FAF3E8]/60 dark:bg-slate-800/50 text-[#786C60] dark:text-slate-400 uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4">Request / Order ID</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Defective Product</th>
                <th className="py-3.5 px-4">Reason</th>
                <th className="py-3.5 px-4 text-center">Photo Evidence</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5D7C5]/60 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-500">
                    <Loader2 size={24} className="animate-spin text-[#C8A46A] mx-auto mb-2" />
                    <span>Loading replacement requests from Firestore...</span>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#786C60] space-y-2">
                    <Package size={32} className="mx-auto text-gray-400" />
                    <p className="font-serif text-base text-[#14111E] dark:text-white">
                      No replacement claims found
                    </p>
                    <p className="text-xs">Adjust your search query or status filter.</p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const statusInfo =
                    REPLACEMENT_STATUS_MAP[req.status] || REPLACEMENT_STATUS_MAP.REQUESTED;
                  const firstProd = req.products?.[0] || {};
                  const photoCount = req.customerImages?.length || 0;

                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-[#FAF3E8]/30 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Request / Order ID */}
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[#14111E] dark:text-white">
                            #{req.requestId}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(req.requestId, "Request ID Copied")}
                            className="p-1 text-gray-400 hover:text-[#C8A46A]"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                        <p className="text-[11px] text-[#786C60] font-serif">
                          Order: <span className="font-mono font-semibold">#{req.orderNumber || req.orderId}</span>
                        </p>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4 space-y-0.5">
                        <p className="font-bold text-[#14111E] dark:text-white">
                          {req.customerName || "Customer"}
                        </p>
                        <p className="text-[11px] text-[#786C60]">{req.customerPhone || "N/A"}</p>
                      </td>

                      {/* Product */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5 max-w-xs">
                          <img
                            src={getThumbnailUrl(firstProd.image || "/img/jewellery/j.png", 100)}
                            alt={firstProd.productName}
                            className="w-9 h-10 rounded-lg object-cover border border-[#E5D7C5] shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-serif font-bold text-[#14111E] dark:text-white truncate">
                              {firstProd.productName}
                            </p>
                            <p className="text-[11px] text-[#786C60]">
                              Qty: {firstProd.quantity} • ₹{Number(firstProd.price || 0).toLocaleString("en-IN")}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#14111E] dark:text-white block">
                          {req.reason}
                        </span>
                        <p className="text-[11px] text-[#786C60] truncate max-w-[180px] italic">
                          "{req.description}"
                        </p>
                      </td>

                      {/* Photo Evidence Gallery */}
                      <td className="py-3.5 px-4 text-center">
                        {photoCount > 0 ? (
                          <div
                            onClick={() => setSelectedRequest(req)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF3E8] border border-[#C8A46A]/50 text-[#8B6B38] font-bold text-[11px] cursor-pointer hover:bg-[#14111E] hover:text-[#FAF6F0] transition-all"
                          >
                            <Camera size={12} />
                            <span>{photoCount} Photos</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">No photos</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold uppercase border ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedRequest(req)}
                            className="px-3 py-1.5 bg-[#14111E] text-[#FBF9F5] rounded-xl hover:bg-[#251D33] font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                          >
                            <Eye size={12} className="text-[#C8A46A]" />
                            <span>Review</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL 1: COMPLETE REQUEST DETAILS & PHOTO INSPECTION MODAL ─── */}
      <AnimatePresence>
        {selectedRequest && !actionModalType && (
          <div className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRequest(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-[#FDFAF5] dark:bg-slate-900 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto relative z-10 border border-[#E5D7C5] dark:border-slate-800 shadow-2xl flex flex-col font-sans text-[#14111E] dark:text-white"
            >
              {/* Header */}
              <div className="p-6 border-b border-[#E5D7C5] dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 rounded-t-3xl sticky top-0 z-20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#14111E] text-[#C8A46A] flex items-center justify-center">
                    <RotateCcw size={18} />
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold tracking-widest text-[#C8A46A]">
                      Claim Inspection & Decision
                    </span>
                    <h3 className="font-serif text-xl font-bold font-mono">
                      #{selectedRequest.requestId}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 text-gray-400 hover:text-black dark:hover:text-white rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6 flex-1 text-xs">
                {/* Status Bar */}
                <div
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                    (REPLACEMENT_STATUS_MAP[selectedRequest.status] || REPLACEMENT_STATUS_MAP.REQUESTED).color
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-sm">
                      Status: {(REPLACEMENT_STATUS_MAP[selectedRequest.status] || REPLACEMENT_STATUS_MAP.REQUESTED).label}
                    </p>
                    <p className="opacity-90">
                      {(REPLACEMENT_STATUS_MAP[selectedRequest.status] || REPLACEMENT_STATUS_MAP.REQUESTED).desc}
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold shrink-0">
                    Linked Order #{selectedRequest.orderNumber || selectedRequest.orderId}
                  </span>
                </div>

                {/* Customer & Pickup Address */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#E5D7C5] dark:border-slate-700 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#786C60] dark:text-slate-400 flex items-center gap-1">
                      <User size={13} /> Customer Details
                    </span>
                    <p className="font-bold text-sm text-[#14111E] dark:text-white">
                      {selectedRequest.customerName}
                    </p>
                    <p className="text-[#786C60] dark:text-slate-400">
                      Phone: <span className="font-semibold text-[#14111E] dark:text-white">{selectedRequest.customerPhone || "N/A"}</span>
                    </p>
                    <p className="text-[#786C60] dark:text-slate-400">
                      Email: <span className="font-semibold text-[#14111E] dark:text-white">{selectedRequest.customerEmail || "N/A"}</span>
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#786C60] dark:text-slate-400 flex items-center gap-1">
                      <MapPin size={13} /> Pickup & Delivery Address
                    </span>
                    <p className="text-[#14111E] dark:text-white leading-relaxed">
                      {selectedRequest.reversePickup?.pickupAddress?.address ||
                        selectedRequest.reversePickup?.pickupAddress?.fullAddress ||
                        "Standard order address"}
                    </p>
                    <p className="font-bold text-[#14111E] dark:text-white">
                      {[
                        selectedRequest.reversePickup?.pickupAddress?.city,
                        selectedRequest.reversePickup?.pickupAddress?.state,
                        selectedRequest.reversePickup?.pickupAddress?.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>

                {/* Complaint Details */}
                <div className="bg-[#FAF3E8] dark:bg-slate-800 p-5 rounded-2xl border border-[#C8A46A]/40 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B6B38] dark:text-amber-400">
                      Defect Reason: {selectedRequest.reason}
                    </span>
                  </div>
                  <p className="text-sm font-serif italic text-[#14111E] dark:text-white leading-relaxed">
                    "{selectedRequest.description}"
                  </p>
                </div>

                {/* Customer Photographs Gallery */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#E5D7C5] dark:border-slate-700 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#786C60] dark:text-slate-400 flex items-center gap-1.5">
                      <Camera size={14} className="text-[#C8A46A]" /> Customer Defect Photographs ({selectedRequest.customerImages?.length || 0})
                    </span>
                    <span className="text-[11px] text-[#786C60] italic">
                      Click any photograph to enlarge in high resolution
                    </span>
                  </div>

                  {selectedRequest.customerImages?.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {selectedRequest.customerImages.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          onClick={() => setLightboxImage(imgUrl)}
                          className="relative aspect-square rounded-2xl overflow-hidden border border-[#E5D7C5] dark:border-slate-700 bg-gray-100 cursor-pointer group shadow-xs"
                        >
                          <img
                            src={getThumbnailUrl(imgUrl, 300)}
                            alt={`Defect ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1">
                            <Eye size={18} />
                            <span className="text-[10px] font-bold">Inspect Photo {idx + 1}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">No photographs submitted.</p>
                  )}
                </div>

                {/* Dual Logistics Summary (Reverse & Forward) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Reverse Pickup Info */}
                  <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-2">
                    <span className="text-xs font-bold uppercase text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                      <RotateCcw size={13} /> Reverse Pickup (Shiprocket)
                    </span>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400">
                      Status: <strong className="text-purple-700 dark:text-purple-300">{selectedRequest.reversePickup?.status || "Not Created"}</strong>
                    </p>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400">
                      AWB: <strong className="font-mono text-purple-900 dark:text-purple-200">{selectedRequest.reversePickup?.awb || "Pending"}</strong>
                    </p>
                    {selectedRequest.reversePickup?.awb && (
                      <a
                        href={selectedRequest.reversePickup?.trackingUrl || `https://shiprocket.co/tracking/${selectedRequest.reversePickup.awb}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:underline pt-1"
                      >
                        <ExternalLink size={12} /> Track Reverse Courier
                      </a>
                    )}
                  </div>

                  {/* Replacement Shipment Info */}
                  <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
                    <span className="text-xs font-bold uppercase text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <Truck size={13} /> Replacement Dispatch
                    </span>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400">
                      Status: <strong className="text-emerald-700 dark:text-emerald-300">{selectedRequest.replacementShipment?.status || "Not Dispatched"}</strong>
                    </p>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400">
                      AWB: <strong className="font-mono text-emerald-900 dark:text-emerald-200">{selectedRequest.replacementShipment?.awb || "Pending"}</strong>
                    </p>
                    {selectedRequest.replacementShipment?.awb && (
                      <a
                        href={selectedRequest.replacementShipment?.trackingUrl || `https://shiprocket.co/tracking/${selectedRequest.replacementShipment.awb}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline pt-1"
                      >
                        <ExternalLink size={12} /> Track Replacement Parcel
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-5 border-t border-[#E5D7C5] dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-3xl flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 border border-[#E5D7C5] dark:border-slate-700 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 font-bold uppercase tracking-wider text-xs"
                >
                  Close
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  {/* If REQUESTED or UNDER_REVIEW: Show Approve & Reject */}
                  {(selectedRequest.status === "REQUESTED" || selectedRequest.status === "UNDER_REVIEW") && (
                    <>
                      <button
                        type="button"
                        onClick={() => openRejectModal(selectedRequest)}
                        className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle size={14} /> Reject Claim
                      </button>

                      <button
                        type="button"
                        onClick={() => openApproveModal(selectedRequest)}
                        className="px-5 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <CheckCircle2 size={14} /> Approve Claim
                      </button>
                    </>
                  )}

                  {/* If APPROVED: Show Book Reverse Pickup */}
                  {selectedRequest.status === "APPROVED" && (
                    <button
                      type="button"
                      onClick={() => openReversePickupModal(selectedRequest)}
                      className="px-5 py-2 bg-[#14111E] text-[#FBF9F5] hover:bg-[#251D33] rounded-xl font-bold uppercase tracking-wider text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <RotateCcw size={14} className="text-[#C8A46A]" /> Book Reverse Pickup
                    </button>
                  )}

                  {/* If REVERSE_PICKUP_SCHEDULED or REVERSE_PICKED_UP: Show Confirm Return Received */}
                  {(selectedRequest.status === "REVERSE_PICKUP_SCHEDULED" ||
                    selectedRequest.status === "REVERSE_PICKED_UP" ||
                    selectedRequest.status === "RETURN_RECEIVED") && (
                    <button
                      type="button"
                      onClick={() => openInspectionModal(selectedRequest)}
                      className="px-5 py-2 bg-teal-600 text-white hover:bg-teal-700 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <ShieldCheck size={14} /> Record Return & Inspection
                    </button>
                  )}

                  {/* If INSPECTION_APPROVED: Show Create Replacement Shipment */}
                  {(selectedRequest.status === "INSPECTION_APPROVED" ||
                    selectedRequest.status === "REPLACEMENT_PROCESSING") && (
                    <button
                      type="button"
                      onClick={() => openReplacementShipModal(selectedRequest)}
                      className="px-5 py-2 bg-[#14111E] text-[#FBF9F5] hover:bg-[#251D33] rounded-xl font-bold uppercase tracking-wider text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Truck size={14} className="text-[#C8A46A]" /> Create Replacement Shipment
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL 2: APPROVE CONFIRMATION POPUP ─── */}
      <AnimatePresence>
        {actionModalType === "APPROVE" && selectedRequest && (
          <div className="fixed inset-0 z-[230] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActionModalType(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-lg w-full relative z-10 border border-[#E5D7C5] dark:border-slate-800 shadow-2xl space-y-5 text-xs text-[#14111E] dark:text-white"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold">Approve Replacement Claim</h3>
                  <p className="text-[11px] text-[#786C60] dark:text-slate-400">
                    Request #{selectedRequest.requestId} • Order #{selectedRequest.orderNumber || selectedRequest.orderId}
                  </p>
                </div>
              </div>

              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
                  {actionError}
                </div>
              )}
              {actionSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl">
                  {actionSuccessMsg}
                </div>
              )}

              <div className="p-3.5 bg-[#FAF3E8] dark:bg-slate-800 rounded-xl space-y-1">
                <span className="font-bold text-[#8B6B38]">Defect Reason:</span>
                <p className="font-semibold">{selectedRequest.reason}</p>
                <p className="text-[11px] text-[#786C60] dark:text-slate-400 italic">
                  "{selectedRequest.description}"
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-[#786C60] block">
                  Approval Remarks (Optional):
                </label>
                <textarea
                  rows={2}
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="e.g. Verified defect from customer photographs. Approved for reverse courier pickup."
                  className="w-full bg-[#FAF3E8]/50 dark:bg-slate-800 border border-[#E5D7C5] dark:border-slate-700 rounded-xl p-3 outline-none focus:border-[#C8A46A]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActionModalType(null)}
                  disabled={actionLoading}
                  className="px-4 py-2 border border-gray-200 rounded-xl font-bold uppercase text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApprove}
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold uppercase text-xs hover:bg-emerald-700 flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>Confirm Approval</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL 3: REJECT CONFIRMATION POPUP ─── */}
      <AnimatePresence>
        {actionModalType === "REJECT" && selectedRequest && (
          <div className="fixed inset-0 z-[230] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActionModalType(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-lg w-full relative z-10 border border-[#E5D7C5] dark:border-slate-800 shadow-2xl space-y-5 text-xs text-[#14111E] dark:text-white"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <XCircle size={22} />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold">Reject Replacement Claim</h3>
                  <p className="text-[11px] text-[#786C60] dark:text-slate-400">
                    Request #{selectedRequest.requestId}
                  </p>
                </div>
              </div>

              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
                  {actionError}
                </div>
              )}
              {actionSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl">
                  {actionSuccessMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-rose-700 block">
                  Mandatory Rejection Reason:
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900 rounded-xl p-2.5 outline-none font-semibold text-rose-900 dark:text-rose-200"
                >
                  <option value="">-- Select Rejection Reason --</option>
                  <option value="Photographs show intentional tampering or improper storage">
                    Photographs show intentional tampering or improper storage
                  </option>
                  <option value="Damaged by customer after normal usage (not manufacturing defect)">
                    Damaged by customer after normal usage (not manufacturing defect)
                  </option>
                  <option value="Product returned does not match original purchased piece">
                    Product returned does not match original purchased piece
                  </option>
                  <option value="Photographic evidence inconclusive or missing defect">
                    Photographic evidence inconclusive or missing defect
                  </option>
                  <option value="Expired replacement eligibility window">
                    Expired replacement eligibility window
                  </option>
                  <option value="Other">Other (explained in remarks)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-[#786C60] block">
                  Additional Remarks for Customer Notification:
                </label>
                <textarea
                  rows={3}
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="Provide detailed explanation to be emailed to the client..."
                  className="w-full bg-[#FAF3E8]/50 dark:bg-slate-800 border border-[#E5D7C5] dark:border-slate-700 rounded-xl p-3 outline-none focus:border-[#C8A46A]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActionModalType(null)}
                  disabled={actionLoading}
                  className="px-4 py-2 border border-gray-200 rounded-xl font-bold uppercase text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={actionLoading}
                  className="px-5 py-2 bg-rose-600 text-white rounded-xl font-bold uppercase text-xs hover:bg-rose-700 flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL 4: BOOK SHIPROCKET REVERSE PICKUP MODAL ─── */}
      <AnimatePresence>
        {actionModalType === "REVERSE_PICKUP" && selectedRequest && (
          <div className="fixed inset-0 z-[230] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActionModalType(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-xl w-full max-h-[90vh] overflow-y-auto relative z-10 border border-[#E5D7C5] dark:border-slate-800 shadow-2xl space-y-5 text-xs text-[#14111E] dark:text-white"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <RotateCcw size={20} />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold">Book Shiprocket Reverse Pickup</h3>
                  <p className="text-[11px] text-[#786C60] dark:text-slate-400">
                    Defective piece collection from customer address
                  </p>
                </div>
              </div>

              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
                  {actionError}
                </div>
              )}
              {actionSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl">
                  {actionSuccessMsg}
                </div>
              )}

              {/* Customer Pickup Address Form */}
              <div className="space-y-3">
                <span className="font-bold uppercase tracking-wider text-[#786C60] block">
                  1. Customer Pickup Location
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={reversePickupForm.name}
                    onChange={(e) => setReversePickupForm({ ...reversePickupForm, name: e.target.value })}
                    placeholder="Customer Name"
                    className="p-2.5 rounded-xl border border-[#E5D7C5] dark:border-slate-700 bg-[#FAF3E8]/30 dark:bg-slate-800 outline-none"
                  />
                  <input
                    type="tel"
                    value={reversePickupForm.phone}
                    onChange={(e) => setReversePickupForm({ ...reversePickupForm, phone: e.target.value })}
                    placeholder="Phone Number"
                    className="p-2.5 rounded-xl border border-[#E5D7C5] dark:border-slate-700 bg-[#FAF3E8]/30 dark:bg-slate-800 outline-none"
                  />
                </div>
                <input
                  type="text"
                  value={reversePickupForm.address}
                  onChange={(e) => setReversePickupForm({ ...reversePickupForm, address: e.target.value })}
                  placeholder="Street Address, Flat, Landmark"
                  className="w-full p-2.5 rounded-xl border border-[#E5D7C5] dark:border-slate-700 bg-[#FAF3E8]/30 dark:bg-slate-800 outline-none"
                />
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={reversePickupForm.city}
                    onChange={(e) => setReversePickupForm({ ...reversePickupForm, city: e.target.value })}
                    placeholder="City"
                    className="p-2.5 rounded-xl border border-[#E5D7C5] dark:border-slate-700 bg-[#FAF3E8]/30 dark:bg-slate-800 outline-none"
                  />
                  <input
                    type="text"
                    value={reversePickupForm.state}
                    onChange={(e) => setReversePickupForm({ ...reversePickupForm, state: e.target.value })}
                    placeholder="State"
                    className="p-2.5 rounded-xl border border-[#E5D7C5] dark:border-slate-700 bg-[#FAF3E8]/30 dark:bg-slate-800 outline-none"
                  />
                  <input
                    type="text"
                    maxLength={6}
                    value={reversePickupForm.pincode}
                    onChange={(e) => setReversePickupForm({ ...reversePickupForm, pincode: e.target.value })}
                    placeholder="Pincode"
                    className="p-2.5 rounded-xl border border-[#E5D7C5] dark:border-slate-700 bg-[#FAF3E8]/30 dark:bg-slate-800 font-mono font-bold outline-none"
                  />
                </div>
              </div>

              {/* Package Dimensions */}
              <div className="space-y-3">
                <span className="font-bold uppercase tracking-wider text-[#786C60] block">
                  2. Parcel Weight & Dimensions
                </span>
                <div className="grid grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[10px] text-gray-500">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={reversePickupForm.weight}
                      onChange={(e) => setReversePickupForm({ ...reversePickupForm, weight: e.target.value })}
                      className="w-full p-2 rounded-xl border border-[#E5D7C5] dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">Length (cm)</label>
                    <input
                      type="number"
                      value={reversePickupForm.length}
                      onChange={(e) => setReversePickupForm({ ...reversePickupForm, length: e.target.value })}
                      className="w-full p-2 rounded-xl border border-[#E5D7C5] dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">Breadth (cm)</label>
                    <input
                      type="number"
                      value={reversePickupForm.breadth}
                      onChange={(e) => setReversePickupForm({ ...reversePickupForm, breadth: e.target.value })}
                      className="w-full p-2 rounded-xl border border-[#E5D7C5] dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">Height (cm)</label>
                    <input
                      type="number"
                      value={reversePickupForm.height}
                      onChange={(e) => setReversePickupForm({ ...reversePickupForm, height: e.target.value })}
                      className="w-full p-2 rounded-xl border border-[#E5D7C5] dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Courier Serviceability Check */}
              <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="font-bold uppercase tracking-wider text-[#786C60]">
                    3. Courier Availability
                  </span>
                  <button
                    type="button"
                    onClick={handleCheckReverseCouriers}
                    disabled={checkingReverseService}
                    className="px-3 py-1 bg-[#FAF3E8] text-[#8B6B38] font-bold rounded-lg hover:bg-[#14111E] hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {checkingReverseService ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    <span>Check Couriers</span>
                  </button>
                </div>

                {reverseCouriers.length > 0 ? (
                  <select
                    value={reversePickupForm.courierId}
                    onChange={(e) => setReversePickupForm({ ...reversePickupForm, courierId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E5D7C5] dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  >
                    {reverseCouriers.map((c) => (
                      <option key={c.courier_company_id} value={c.courier_company_id}>
                        {c.courier_name} — Rate: ₹{c.rate} • ETD: {c.etd || "2-4 Days"}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[11px] text-gray-400 italic">
                    Click "Check Couriers" to fetch live reverse courier options from Shiprocket.
                  </p>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2.5 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActionModalType(null)}
                  disabled={actionLoading}
                  className="px-4 py-2 border border-gray-200 rounded-xl font-bold uppercase text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReversePickup}
                  disabled={actionLoading}
                  className="px-5 py-2 bg-purple-700 text-white rounded-xl font-bold uppercase text-xs hover:bg-purple-800 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                  <span>Book Reverse Pickup</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL 5: CONFIRM RETURN RECEIVED & CRAFTSMANSHIP INSPECTION MODAL ─── */}
      <AnimatePresence>
        {actionModalType === "INSPECTION" && selectedRequest && (
          <div className="fixed inset-0 z-[230] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActionModalType(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-lg w-full relative z-10 border border-[#E5D7C5] dark:border-slate-800 shadow-2xl space-y-5 text-xs text-[#14111E] dark:text-white"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold">Record Return Receipt & Inspection</h3>
                  <p className="text-[11px] text-[#786C60] dark:text-slate-400">
                    Defective piece received at Velouraz fulfillment center
                  </p>
                </div>
              </div>

              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
                  {actionError}
                </div>
              )}
              {actionSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl">
                  {actionSuccessMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-[#786C60] block">
                  Inspection Outcome:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "PASSED", label: "Passed", desc: "Approved for replacement" },
                    { id: "PENDING", label: "Pending", desc: "Under testing" },
                    { id: "FAILED", label: "Failed", desc: "Claim rejected" },
                  ].map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setInspectionStatus(opt.id)}
                      className={`p-3 rounded-xl border cursor-pointer text-center space-y-1 transition-all ${
                        inspectionStatus === opt.id
                          ? "bg-[#FAF3E8] border-[#C8A46A] shadow-xs"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p className="font-bold text-xs">{opt.label}</p>
                      <p className="text-[10px] text-gray-500 leading-tight">{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold uppercase tracking-wider text-[#786C60] block">
                  Inspection Remarks / Observations:
                </label>
                <textarea
                  rows={3}
                  value={inspectionRemarks}
                  onChange={(e) => setInspectionRemarks(e.target.value)}
                  placeholder="e.g. Received damaged stone setting verified. Authorizing brand-new replacement dispatch."
                  className="w-full bg-[#FAF3E8]/50 dark:bg-slate-800 border border-[#E5D7C5] dark:border-slate-700 rounded-xl p-3 outline-none focus:border-[#C8A46A]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActionModalType(null)}
                  disabled={actionLoading}
                  className="px-4 py-2 border border-gray-200 rounded-xl font-bold uppercase text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmInspection}
                  disabled={actionLoading}
                  className="px-5 py-2 bg-teal-600 text-white rounded-xl font-bold uppercase text-xs hover:bg-teal-700 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>Record Inspection</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL 6: CREATE REPLACEMENT SHIPMENT MODAL ─── */}
      <AnimatePresence>
        {actionModalType === "REPLACEMENT_SHIPMENT" && selectedRequest && (
          <div className="fixed inset-0 z-[230] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActionModalType(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-xl w-full max-h-[90vh] overflow-y-auto relative z-10 border border-[#E5D7C5] dark:border-slate-800 shadow-2xl space-y-5 text-xs text-[#14111E] dark:text-white"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#14111E] text-[#C8A46A] flex items-center justify-center">
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold">Dispatch Replacement Piece</h3>
                  <p className="text-[11px] text-[#786C60] dark:text-slate-400">
                    Ship brand-new handcrafted jewellery piece via Shiprocket (Prepaid / ₹0 Customer Charge)
                  </p>
                </div>
              </div>

              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
                  {actionError}
                </div>
              )}
              {actionSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl">
                  {actionSuccessMsg}
                </div>
              )}

              {/* Customer Delivery Address */}
              <div className="space-y-3">
                <span className="font-bold uppercase tracking-wider text-[#786C60] block">
                  1. Customer Delivery Address
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={replacementShipForm.name}
                    onChange={(e) => setReplacementShipForm({ ...replacementShipForm, name: e.target.value })}
                    placeholder="Customer Name"
                    className="p-2.5 rounded-xl border border-[#E5D7C5] dark:border-slate-700 bg-[#FAF3E8]/30 dark:bg-slate-800 outline-none"
                  />
                  <input
                    type="tel"
                    value={replacementShipForm.phone}
                    onChange={(e) => setReplacementShipForm({ ...replacementShipForm, phone: e.target.value })}
                    placeholder="Phone Number"
                    className="p-2.5 rounded-xl border border-[#E5D7C5] dark:border-slate-700 bg-[#FAF3E8]/30 dark:bg-slate-800 outline-none"
                  />
                </div>
                <input
                  type="text"
                  value={replacementShipForm.address}
                  onChange={(e) => setReplacementShipForm({ ...replacementShipForm, address: e.target.value })}
                  placeholder="Street Address, Flat, Landmark"
                  className="w-full p-2.5 rounded-xl border border-[#E5D7C5] dark:border-slate-700 bg-[#FAF3E8]/30 dark:bg-slate-800 outline-none"
                />
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={replacementShipForm.city}
                    onChange={(e) => setReplacementShipForm({ ...replacementShipForm, city: e.target.value })}
                    placeholder="City"
                    className="p-2.5 rounded-xl border border-[#E5D7C5] dark:border-slate-700 bg-[#FAF3E8]/30 dark:bg-slate-800 outline-none"
                  />
                  <input
                    type="text"
                    value={replacementShipForm.state}
                    onChange={(e) => setReplacementShipForm({ ...replacementShipForm, state: e.target.value })}
                    placeholder="State"
                    className="p-2.5 rounded-xl border border-[#E5D7C5] dark:border-slate-700 bg-[#FAF3E8]/30 dark:bg-slate-800 outline-none"
                  />
                  <input
                    type="text"
                    maxLength={6}
                    value={replacementShipForm.pincode}
                    onChange={(e) => setReplacementShipForm({ ...replacementShipForm, pincode: e.target.value })}
                    placeholder="Pincode"
                    className="p-2.5 rounded-xl border border-[#E5D7C5] dark:border-slate-700 bg-[#FAF3E8]/30 dark:bg-slate-800 font-mono font-bold outline-none"
                  />
                </div>
              </div>

              {/* Package Dimensions */}
              <div className="space-y-3">
                <span className="font-bold uppercase tracking-wider text-[#786C60] block">
                  2. Parcel Weight & Dimensions
                </span>
                <div className="grid grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[10px] text-gray-500">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={replacementShipForm.weight}
                      onChange={(e) => setReplacementShipForm({ ...replacementShipForm, weight: e.target.value })}
                      className="w-full p-2 rounded-xl border border-[#E5D7C5] dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">Length (cm)</label>
                    <input
                      type="number"
                      value={replacementShipForm.length}
                      onChange={(e) => setReplacementShipForm({ ...replacementShipForm, length: e.target.value })}
                      className="w-full p-2 rounded-xl border border-[#E5D7C5] dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">Breadth (cm)</label>
                    <input
                      type="number"
                      value={replacementShipForm.breadth}
                      onChange={(e) => setReplacementShipForm({ ...replacementShipForm, breadth: e.target.value })}
                      className="w-full p-2 rounded-xl border border-[#E5D7C5] dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">Height (cm)</label>
                    <input
                      type="number"
                      value={replacementShipForm.height}
                      onChange={(e) => setReplacementShipForm({ ...replacementShipForm, height: e.target.value })}
                      className="w-full p-2 rounded-xl border border-[#E5D7C5] dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Courier Serviceability */}
              <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="font-bold uppercase tracking-wider text-[#786C60]">
                    3. Courier Selection
                  </span>
                  <button
                    type="button"
                    onClick={handleCheckReplacementCouriers}
                    disabled={checkingReplacementService}
                    className="px-3 py-1 bg-[#FAF3E8] text-[#8B6B38] font-bold rounded-lg hover:bg-[#14111E] hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {checkingReplacementService ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    <span>Check Couriers</span>
                  </button>
                </div>

                {replacementCouriers.length > 0 ? (
                  <select
                    value={replacementShipForm.courierId}
                    onChange={(e) => setReplacementShipForm({ ...replacementShipForm, courierId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E5D7C5] dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  >
                    {replacementCouriers.map((c) => (
                      <option key={c.courier_company_id} value={c.courier_company_id}>
                        {c.courier_name} — Rate: ₹{c.rate} • ETD: {c.etd || "2-4 Days"}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[11px] text-gray-400 italic">
                    Click "Check Couriers" to fetch live Shiprocket courier rates for this delivery pincode.
                  </p>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2.5 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActionModalType(null)}
                  disabled={actionLoading}
                  className="px-4 py-2 border border-gray-200 rounded-xl font-bold uppercase text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReplacementShipment}
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[#14111E] text-[#FBF9F5] rounded-xl font-bold uppercase text-xs hover:bg-[#251D33] flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {actionLoading ? <Loader2 size={14} className="animate-spin text-[#C8A46A]" /> : <Truck size={14} className="text-[#C8A46A]" />}
                  <span>Confirm Dispatch</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL 7: FULLSCREEN PHOTOGRAPH LIGHTBOX ─── */}
      <AnimatePresence>
        {lightboxImage && (
          <div
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-[260] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          >
            <div className="relative max-w-4xl max-h-[92vh]">
              <img
                src={lightboxImage}
                alt="Enlarged Defect Photograph"
                className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/20"
              />
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="absolute top-3 right-3 p-2 bg-black/70 hover:bg-black text-white rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReplacementsManager;

