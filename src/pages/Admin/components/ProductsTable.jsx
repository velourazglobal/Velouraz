import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Edit2,
  Trash2,
  Package,
  Plus,
  Minus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Globe2,
  RotateCcw,
  AlertTriangle,
  X,
  Trash,
  ArchiveRestore,
  ShieldAlert,
  Sparkles,
  Star,
} from "lucide-react";
import { statusBadgeClasses } from "./AdminUtils";
import CSVUpload from "./CSVUpload";
import {
  quickUpdateStock,
  parseSortableDate,
  isProductNewArrival,
  isProductBestseller,
  toggleProductCollection,
} from "../../../services/productService";
import { getThumbnailUrl, handleImageError } from "../../../config/cloudinary";

// ─── Confirm Dialog ──────────────────────────────────────────────────────────
const ConfirmDialog = ({ isOpen, title, message, confirmLabel, confirmClass, onConfirm, onCancel, icon: Icon }) => {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed z-[1000] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl border border-slate-100 w-[90vw] max-w-[400px] p-6"
          >
            <div className="flex flex-col items-center text-center gap-4">
              {Icon && (
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100">
                  <Icon size={26} className="text-red-500" />
                </div>
              )}
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
              </div>
              <div className="flex gap-3 w-full mt-1">
                <button
                  onClick={onCancel}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 py-2.5 rounded-xl text-white font-bold text-sm transition-all active:scale-95 ${confirmClass || "bg-red-500 hover:bg-red-600"}`}
                >
                  {confirmLabel || "Confirm"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── Quick Stock Editor ──────────────────────────────────────────────────────
const QuickStockEditor = ({ productId, currentStock }) => {
  const [val, setVal] = useState(currentStock ?? 0);
  const [updating, setUpdating] = useState(false);

  React.useEffect(() => {
    setVal(currentStock ?? 0);
  }, [currentStock]);

  const handleUpdate = async (newStock) => {
    const s = Math.max(0, Number(newStock) || 0);
    setVal(s);
    setUpdating(true);
    try {
      await quickUpdateStock(productId, s);
    } catch (err) {
      console.error("Failed to update stock:", err);
      setVal(currentStock ?? 0);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={updating || val <= 0}
        onClick={() => handleUpdate(Number(val) - 1)}
        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 flex items-center justify-center text-xs font-bold transition-all"
        title="Decrease stock"
      >
        <Minus size={11} />
      </button>
      <input
        type="number"
        min="0"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={(e) => handleUpdate(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.target.blur();
          }
        }}
        className={`w-14 px-1.5 py-1 text-center text-sm font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#811331]/30 transition-all ${val > 10
            ? "border-emerald-200 text-emerald-700 bg-emerald-50/40"
            : val > 0
              ? "border-amber-200 text-amber-700 bg-amber-50/40"
              : "border-red-200 text-red-700 bg-red-50/50"
          }`}
      />
      <button
        type="button"
        disabled={updating}
        onClick={() => handleUpdate(Number(val) + 1)}
        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 flex items-center justify-center text-xs font-bold transition-all"
        title="Increase stock"
      >
        <Plus size={11} />
      </button>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const ProductsTable = ({
  products = [],
  trashedProducts = [],
  viewMode: externalViewMode,
  onViewModeChange,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onRestoreProduct,
  onPermanentDelete,
  onBatchTrash,
  onBatchRestore,
  onBatchPermanentDelete,
  onRefresh,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All Categories");
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get("country") || "All Countries");
  const [collectionFilter, setCollectionFilter] = useState(searchParams.get("collection") || "all");
  const [sortBy, setSortBy] = useState("newest");
  const [collectionLoading, setCollectionLoading] = useState({});

  // View mode: "active" or "trash"
  const [internalViewMode, setInternalViewMode] = useState("active");
  const viewMode = externalViewMode !== undefined ? externalViewMode : internalViewMode;

  const handleSetViewMode = (mode) => {
    if (onViewModeChange) {
      onViewModeChange(mode);
    }
    setInternalViewMode(mode);
    // Reset filters when switching views so trashed items aren't hidden by active product filters
    setSearch("");
    setCategory("All Categories");
    setSelectedCountry("All Countries");
    setCollectionFilter("all");
    updateParam("search", "");
    updateParam("category", "All Categories");
    updateParam("country", "All Countries");
    updateParam("collection", "all");
  };

  // Pagination & Selection States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null, ids: [] });

  const currentList = viewMode === "trash" ? trashedProducts : products;

  const newArrivalsCount = useMemo(() => currentList.filter(isProductNewArrival).length, [currentList]);
  const bestsellersCount = useMemo(() => currentList.filter(isProductBestseller).length, [currentList]);
  const featuredCount = useMemo(() => currentList.filter((p) => Boolean(p.featuredProduct || p.featured)).length, [currentList]);

  const handleToggleCollection = async (product, type) => {
    const key = `${product.id}-${type}`;
    setCollectionLoading((prev) => ({ ...prev, [key]: true }));
    try {
      await toggleProductCollection(product.id, type, product);
    } catch (err) {
      console.error("Error toggling collection status:", err);
      alert("Failed to update status. Please try again.");
    } finally {
      setCollectionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  useEffect(() => {
    const sQuery = searchParams.get("search") || searchParams.get("q") || "";
    const cQuery = searchParams.get("category") || "All Categories";
    const coQuery = searchParams.get("country") || "All Countries";
    const colQuery = searchParams.get("collection") || "all";
    setSearch(sQuery);
    setCategory(cQuery);
    setSelectedCountry(coQuery);
    setCollectionFilter(colQuery);
  }, [searchParams]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (!value || value === "All Categories" || value === "All Countries" || value === "all") {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams, { replace: true });
  };

  // Filter & Search & Sort
  const filteredProducts = useMemo(() => {
    const list = currentList.filter((product) => {
      const queryStr = search.toLowerCase().trim();
      const matchesSearch =
        !queryStr ||
        `${product.name || ""} ${product.sku || ""} ${product.country || ""}`.toLowerCase().includes(queryStr);
      const matchesCategory =
        category === "All Categories" ||
        (product.category && product.category.toLowerCase() === category.toLowerCase());
      const matchesCountry =
        selectedCountry === "All Countries" ||
        (product.country && product.country.toLowerCase() === selectedCountry.toLowerCase());
      const matchesCollection = (() => {
        if (collectionFilter === "all") return true;
        if (collectionFilter === "new_arrivals") return isProductNewArrival(product);
        if (collectionFilter === "best_sellers") return isProductBestseller(product);
        if (collectionFilter === "featured") return Boolean(product.featuredProduct || product.featured);
        return true;
      })();
      return matchesSearch && matchesCategory && matchesCountry && matchesCollection;
    });

    return [...list].sort((a, b) => {
      if (sortBy === "oldest") {
        return parseSortableDate(a) - parseSortableDate(b);
      }
      if (sortBy === "name_asc") {
        return (a.name || "").localeCompare(b.name || "");
      }
      if (sortBy === "name_desc") {
        return (b.name || "").localeCompare(a.name || "");
      }
      if (sortBy === "price_asc") {
        return (Number(a.price) || 0) - (Number(b.price) || 0);
      }
      if (sortBy === "price_desc") {
        return (Number(b.price) || 0) - (Number(a.price) || 0);
      }
      // Default: "newest" (Upload Date: New → Old)
      return parseSortableDate(b) - parseSortableDate(a);
    });
  }, [currentList, search, category, selectedCountry, collectionFilter, sortBy]);

  // Derived Pagination
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [search, category, selectedCountry, sortBy, pageSize, viewMode]);

  const allCategories = useMemo(() => {
    const combined = [...products, ...trashedProducts];
    return [...new Set(combined.map((p) => p.category).filter(Boolean))];
  }, [products, trashedProducts]);

  const allCountries = useMemo(() => {
    const combined = [...products, ...trashedProducts];
    return [...new Set(combined.map((p) => p.country).filter(Boolean))];
  }, [products, trashedProducts]);

  // Selection Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const pageIds = paginatedProducts.map((p) => p.id);
      setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
    } else {
      const pageIds = paginatedProducts.map((p) => p.id);
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    }
  };

  const handleSelectOne = (id, checked) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const isAllPageSelected =
    paginatedProducts.length > 0 && paginatedProducts.every((p) => selectedIds.includes(p.id));

  // ─── Confirm helpers ────────────────────────────────────────────────────────
  const openConfirm = (type, ids) => setConfirmDialog({ open: true, type, ids });
  const closeConfirm = () => setConfirmDialog({ open: false, type: null, ids: [] });

  const handleConfirm = async () => {
    const { type, ids } = confirmDialog;
    closeConfirm();
    if (type === "trash_one") {
      await onDeleteProduct?.(ids[0]);
    } else if (type === "trash_batch") {
      await onBatchTrash?.(ids);
      setSelectedIds([]);
    } else if (type === "restore_one") {
      await onRestoreProduct?.(ids[0]);
    } else if (type === "restore_batch") {
      await onBatchRestore?.(ids);
      setSelectedIds([]);
    } else if (type === "permanent_one") {
      await onPermanentDelete?.(ids[0]);
    } else if (type === "permanent_batch") {
      await onBatchPermanentDelete?.(ids);
      setSelectedIds([]);
    } else if (type === "empty_trash") {
      await onBatchPermanentDelete?.(trashedProducts.map((p) => p.id));
      setSelectedIds([]);
    }
    if (onRefresh) onRefresh();
  };

  // ─── Dialog config ─────────────────────────────────────────────────────────
  const getDialogConfig = () => {
    const { type, ids } = confirmDialog;
    const count = ids.length;
    switch (type) {
      case "trash_one":
        return {
          title: "Move to Trash",
          message: "This product will be moved to trash. You can restore it later.",
          confirmLabel: "Move to Trash",
          confirmClass: "bg-amber-500 hover:bg-amber-600",
          icon: Trash2,
        };
      case "trash_batch":
        return {
          title: `Move ${count} Products to Trash`,
          message: `${count} selected products will be moved to trash. You can restore them later.`,
          confirmLabel: "Move to Trash",
          confirmClass: "bg-amber-500 hover:bg-amber-600",
          icon: Trash2,
        };
      case "restore_one":
        return {
          title: "Restore Product",
          message: "This product will be restored to your active catalogue.",
          confirmLabel: "Restore",
          confirmClass: "bg-emerald-500 hover:bg-emerald-600",
          icon: ArchiveRestore,
        };
      case "restore_batch":
        return {
          title: `Restore ${count} Products`,
          message: `${count} products will be restored to your active catalogue.`,
          confirmLabel: "Restore All",
          confirmClass: "bg-emerald-500 hover:bg-emerald-600",
          icon: ArchiveRestore,
        };
      case "permanent_one":
        return {
          title: "Permanently Delete",
          message: "This action is irreversible. The product will be permanently removed from the database.",
          confirmLabel: "Delete Forever",
          confirmClass: "bg-red-600 hover:bg-red-700",
          icon: ShieldAlert,
        };
      case "permanent_batch":
        return {
          title: `Permanently Delete ${count} Products`,
          message: `This action cannot be undone. All ${count} selected products will be permanently removed.`,
          confirmLabel: "Delete Forever",
          confirmClass: "bg-red-600 hover:bg-red-700",
          icon: ShieldAlert,
        };
      case "empty_trash":
        return {
          title: "Empty Trash",
          message: `All ${trashedProducts.length} products in trash will be permanently deleted. This cannot be undone.`,
          confirmLabel: "Empty Trash",
          confirmClass: "bg-red-600 hover:bg-red-700",
          icon: ShieldAlert,
        };
      default:
        return {};
    }
  };

  const dialogConfig = getDialogConfig();

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <ConfirmDialog
        isOpen={confirmDialog.open}
        {...dialogConfig}
        onConfirm={handleConfirm}
        onCancel={closeConfirm}
      />

      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
        {/* Header */}
        <div className="px-6 py-5 sm:px-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900 flex items-center gap-2.5">
              <span className="p-1.5 bg-[#811331]/10 rounded-lg">
                {viewMode === "trash" ? (
                  <Trash size={15} className="text-[#811331]" />
                ) : (
                  <Package size={15} className="text-[#811331]" />
                )}
              </span>
              {viewMode === "trash" ? "Trash" : "Products"}
            </h2>
            <p className="text-base text-slate-400 font-medium mt-1 ml-0.5">
              {viewMode === "trash"
                ? `${trashedProducts.length} item${trashedProducts.length !== 1 ? "s" : ""} in trash`
                : `${products.length} item${products.length !== 1 ? "s" : ""} in inventory`}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Toggle */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 gap-1">
              <button
                onClick={() => handleSetViewMode("active")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-base font-bold transition-all ${viewMode === "active"
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                <Package size={13} />
                Products
              </button>
              <button
                onClick={() => handleSetViewMode("trash")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-base font-bold transition-all relative ${viewMode === "trash"
                    ? "bg-white text-red-600 shadow-sm border border-red-100"
                    : "text-slate-500 hover:text-red-500"
                  }`}
              >
                <Trash2 size={13} />
                Trash
                {trashedProducts.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[14px] font-bold flex items-center justify-center">
                    {trashedProducts.length > 99 ? "99+" : trashedProducts.length}
                  </span>
                )}
              </button>
            </div>

            {/* Batch Actions */}
            {selectedIds.length > 0 && viewMode === "active" && (
              <button
                onClick={() => openConfirm("trash_batch", selectedIds)}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-100 rounded-xl text-base font-bold transition-all"
              >
                <Trash2 size={13} />
                Move to Trash ({selectedIds.length})
              </button>
            )}
            {selectedIds.length > 0 && viewMode === "trash" && (
              <>
                <button
                  onClick={() => openConfirm("restore_batch", selectedIds)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded-xl text-base font-bold transition-all"
                >
                  <ArchiveRestore size={13} />
                  Restore ({selectedIds.length})
                </button>
                <button
                  onClick={() => openConfirm("permanent_batch", selectedIds)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl text-base font-bold transition-all"
                >
                  <ShieldAlert size={13} />
                  Delete Forever ({selectedIds.length})
                </button>
              </>
            )}

            {/* Empty Trash Button */}
            {viewMode === "trash" && trashedProducts.length > 0 && (
              <button
                onClick={() => openConfirm("empty_trash", [])}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-base font-bold transition-all shadow-md shadow-red-200"
              >
                <Trash size={13} />
                Empty Trash
              </button>
            )}

            {viewMode === "active" && (
              <>
                <CSVUpload onComplete={onRefresh} />
                <button
                  type="button"
                  onClick={onRefresh}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-100 transition-all"
                  title="Refresh"
                >
                  <RefreshCw size={14} />
                </button>
                <button
                  type="button"
                  onClick={onAddProduct}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#811331] text-white rounded-xl text-[16px] font-bold shadow-md shadow-[#811331]/20 hover:bg-[#9d1a3d] transition-all active:scale-95"
                >
                  <Plus size={13} />
                  New Product
                </button>
              </>
            )}

            {viewMode === "trash" && (
              <button
                type="button"
                onClick={onRefresh}
                className="p-2.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-100 transition-all"
                title="Refresh"
              >
                <RefreshCw size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Trash Banner */}
        {viewMode === "trash" && (
          <div className="mx-5 mt-4 sm:mx-8 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-700 font-medium">
              Items in trash are soft-deleted. Restore them to bring them back, or delete forever to remove permanently.
            </p>
          </div>
        )}

        {/* Quick Filter Pills (All / New Arrivals / Best Sellers) */}
        {viewMode === "active" && (
          <div className="mx-5 mt-4 sm:mx-8 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1 shrink-0">
              <Sparkles size={13} className="text-[#811331]" /> Filter By:
            </span>
            <button
              type="button"
              onClick={() => {
                setCollectionFilter("all");
                updateParam("collection", "all");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                collectionFilter === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              All Products ({currentList.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setCollectionFilter("new_arrivals");
                updateParam("collection", "new_arrivals");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                collectionFilter === "new_arrivals"
                  ? "bg-purple-700 text-white shadow-xs"
                  : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
              }`}
            >
              <span>✨</span> New Arrivals ({newArrivalsCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setCollectionFilter("best_sellers");
                updateParam("collection", "best_sellers");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                collectionFilter === "best_sellers"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
              }`}
            >
              <span>⭐</span> Best Sellers ({bestsellersCount})
            </button>
            {featuredCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setCollectionFilter("featured");
                  updateParam("collection", "featured");
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                  collectionFilter === "featured"
                    ? "bg-rose-700 text-white shadow-xs"
                    : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                }`}
              >
                <span>🔥</span> Featured ({featuredCount})
              </button>
            )}
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="mx-5 mb-4 mt-3 flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 sm:mx-8 sm:flex-row sm:items-center flex-wrap">
          <label className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-400 min-w-[200px]">
            <Search size={15} />
            <input
              value={search}
              onChange={(event) => {
                const val = event.target.value;
                setSearch(val);
                updateParam("search", val);
              }}
              className="w-full bg-transparent text-base text-slate-700 outline-none"
              placeholder={`Search ${viewMode === "trash" ? "trashed" : ""} products...`}
            />
          </label>
          {/* Category Select */}
          <select
            value={category}
            onChange={(event) => {
              const val = event.target.value;
              setCategory(val);
              updateParam("category", val);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-base font-medium text-slate-600 outline-none cursor-pointer"
          >
            <option value="All Categories">All Categories</option>
            {allCategories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          {/* Country Select */}
          <select
            value={selectedCountry}
            onChange={(event) => {
              const val = event.target.value;
              setSelectedCountry(val);
              updateParam("country", val);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-base font-medium text-slate-600 outline-none cursor-pointer"
          >
            <option value="All Countries">All Countries</option>
            {allCountries.map((c) => (
              <option key={c} value={c}>🌍 {c}</option>
            ))}
          </select>
          {/* Collection / Badge Filter Select */}
          <select
            value={collectionFilter}
            onChange={(event) => {
              const val = event.target.value;
              setCollectionFilter(val);
              updateParam("collection", val);
            }}
            className={`rounded-lg border px-3 py-2 text-base font-medium outline-none cursor-pointer transition-all ${
              collectionFilter !== "all"
                ? "border-[#811331] bg-[#811331]/5 text-[#811331] font-bold"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            <option value="all">All Badges & Collections</option>
            <option value="new_arrivals">✨ New Arrivals ({newArrivalsCount})</option>
            <option value="best_sellers">⭐ Best Sellers ({bestsellersCount})</option>
            <option value="featured">🔥 Featured ({featuredCount})</option>
          </select>
          {/* Sort By Select */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-base font-medium text-slate-600">
            <SlidersHorizontal size={14} className="text-slate-400 flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="bg-transparent outline-none font-bold text-slate-700 cursor-pointer text-base"
              title="Sort products"
            >
              <option value="newest">Sort: Upload Date (New → Old)</option>
              <option value="oldest">Sort: Upload Date (Old → New)</option>
              <option value="name_asc">Sort: Name (A → Z)</option>
              <option value="name_desc">Sort: Name (Z → A)</option>
              <option value="price_asc">Sort: Price (Low → High)</option>
              <option value="price_desc">Sort: Price (High → Low)</option>
            </select>
          </div>
          {(search || category !== "All Categories" || selectedCountry !== "All Countries" || collectionFilter !== "all" || sortBy !== "newest") && (
            <button
              onClick={() => {
                setSearch("");
                setCategory("All Categories");
                setSelectedCountry("All Countries");
                setCollectionFilter("all");
                setSortBy("newest");
                updateParam("search", "");
                updateParam("category", "All Categories");
                updateParam("country", "All Countries");
                updateParam("collection", "all");
              }}
              className="px-3 py-2 rounded-lg bg-slate-200/70 hover:bg-slate-200 text-base font-bold text-[#811331] transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[16px] font-bold text-slate-400 uppercase tracking-[0.12em] border-b border-slate-50 bg-slate-50/60">
                <th className="px-6 py-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={isAllPageSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-350 accent-[#811331] cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4">Product</th>
                <th className="px-5 py-4">SKU</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Country</th>
                <th className="px-5 py-4">Price</th>
                {viewMode === "active" && <th className="px-5 py-4">Stock</th>}
                {viewMode === "active" && <th className="px-5 py-4">Status</th>}
                {viewMode === "active" && <th className="px-5 py-4">Date</th>}
                {viewMode === "trash" && <th className="px-5 py-4">Deleted</th>}
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedProducts.map((row, idx) => {
                const isChecked = selectedIds.includes(row.id);
                return (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className={`hover:bg-slate-50/60 transition-colors group ${isChecked ? "bg-red-50/20" : ""} ${viewMode === "trash" ? "opacity-70" : ""}`}
                  >
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handleSelectOne(row.id, e.target.checked)}
                        className="w-4 h-4 rounded border-slate-350 accent-[#811331] cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-11 h-11 rounded-xl bg-slate-100 overflow-hidden border flex-shrink-0 ${viewMode === "trash" ? "border-red-100 grayscale" : "border-slate-200"}`}>
                          {(() => {
                            const rawImg = (Array.isArray(row.images) && row.images[0]) || row.image || (typeof row.images === 'string' ? row.images : null);
                            return rawImg ? (
                              <img
                                src={getThumbnailUrl(rawImg)}
                                alt={row.name}
                                loading="lazy"
                                decoding="async"
                                onError={(e) => handleImageError(e, rawImg)}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Package size={18} />
                              </div>
                            );
                          })()}
                        </div>
                        <div>
                          <p className="text-[16px] font-bold text-slate-900 line-clamp-1 max-w-[200px]">{row.name}</p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[13px] text-slate-400 font-mono">{row.id.substring(0, 8)}…</span>
                            {viewMode === "active" && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={collectionLoading[`${row.id}-new_arrival`]}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleCollection(row, "new_arrival");
                                  }}
                                  title={isProductNewArrival(row) ? "Click to remove from New Arrivals" : "Click to mark as New Arrival"}
                                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                                    isProductNewArrival(row)
                                      ? "bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-200"
                                      : "bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 border border-slate-200/50"
                                  }`}
                                >
                                  ✨ New {isProductNewArrival(row) ? "✓" : "+"}
                                </button>
                                <button
                                  type="button"
                                  disabled={collectionLoading[`${row.id}-bestseller`]}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleCollection(row, "bestseller");
                                  }}
                                  title={isProductBestseller(row) ? "Click to remove from Best Sellers" : "Click to mark as Best Seller"}
                                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                                    isProductBestseller(row)
                                      ? "bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200"
                                      : "bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 border border-slate-200/50"
                                  }`}
                                >
                                  ⭐ Best {isProductBestseller(row) ? "✓" : "+"}
                                </button>
                                {row.featuredProduct && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200" title="Featured Product">
                                    🔥
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[16px] font-medium text-slate-500">{row.sku || row.productCode || row.id.slice(0, 10)}</td>
                    <td className="px-5 py-4">
                      <span className="text-[16px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {row.category || "Uncategorized"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {row.country ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[16px] font-semibold text-blue-600">
                          🌍 {row.country}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[16px]"> </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-[16px] font-bold text-slate-900">₹{Number(row.price || 0).toLocaleString()}</p>
                    </td>
                    {viewMode === "active" && (
                      <td className="px-5 py-4">
                        <QuickStockEditor productId={row.id} currentStock={row.stock} />
                      </td>
                    )}
                    {viewMode === "active" && (
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[16px] font-bold uppercase tracking-wide border ${statusBadgeClasses(row.stock_status || "In Stock")}`}>
                          {row.stock_status || "In Stock"}
                        </span>
                      </td>
                    )}
                    {viewMode === "active" && (
                      <td className="px-5 py-4 text-[16px] text-slate-500">
                        {row.createdAt?.toDate ? row.createdAt.toDate().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : " "}
                      </td>
                    )}
                    {viewMode === "trash" && (
                      <td className="px-5 py-4 text-[16px] text-red-400">
                        {row.deletedAt?.toDate
                          ? row.deletedAt.toDate().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                          : "Recently"}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {viewMode === "active" && (
                          <>
                            {onEditProduct && (
                              <button
                                type="button"
                                onClick={() => onEditProduct(row)}
                                className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-[#811331] bg-slate-100 transition-all"
                                title="Edit"
                              >
                                <Edit2 size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openConfirm("trash_one", [row.id])}
                              className="p-2 rounded-xl text-amber-600 hover:text-white hover:bg-amber-500 bg-amber-50 transition-all"
                              title="Move to Trash"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                        {viewMode === "trash" && (
                          <>
                            <button
                              type="button"
                              onClick={() => openConfirm("restore_one", [row.id])}
                              className="p-2 rounded-xl text-emerald-600 hover:text-white hover:bg-emerald-500 bg-emerald-50 transition-all"
                              title="Restore"
                            >
                              <ArchiveRestore size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openConfirm("permanent_one", [row.id])}
                              className="p-2 rounded-xl text-red-500 hover:text-white hover:bg-red-500 bg-red-50 transition-all"
                              title="Delete Forever"
                            >
                              <ShieldAlert size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View */}
        <div className="lg:hidden divide-y divide-slate-50">
          {paginatedProducts.map((row) => {
            const isChecked = selectedIds.includes(row.id);
            return (
              <div key={row.id} className={`p-5 hover:bg-slate-50 transition-colors relative ${isChecked ? "bg-red-50/10" : ""} ${viewMode === "trash" ? "opacity-75" : ""}`}>
                <div className="absolute top-4 left-4 z-10">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => handleSelectOne(row.id, e.target.checked)}
                    className="w-4.5 h-4.5 rounded border-slate-350 accent-[#811331]"
                  />
                </div>

                <div className="flex items-center gap-4 mb-4 pl-7">
                  <div className={`w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden border flex-shrink-0 ${viewMode === "trash" ? "border-red-100 grayscale" : "border-slate-200"}`}>
                    {row.images?.[0] ? (
                      <img src={getThumbnailUrl(row.images[0], 120)} alt={row.name} width="56" height="56" loading="lazy" decoding="async" onError={(e) => handleImageError(e, row.images[0])} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Package size={22} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{row.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[16px] font-bold text-slate-400 uppercase">{row.category}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="text-sm font-bold text-[#811331]">₹{Number(row.price || 0).toLocaleString()}</span>
                    </div>
                    {viewMode === "active" && (
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <button
                          type="button"
                          disabled={collectionLoading[`${row.id}-new_arrival`]}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleCollection(row, "new_arrival");
                          }}
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                            isProductNewArrival(row)
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : "bg-slate-100 text-slate-400 border border-slate-200/50"
                          }`}
                        >
                          ✨ New {isProductNewArrival(row) ? "✓" : "+"}
                        </button>
                        <button
                          type="button"
                          disabled={collectionLoading[`${row.id}-bestseller`]}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleCollection(row, "bestseller");
                          }}
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                            isProductBestseller(row)
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-slate-100 text-slate-400 border border-slate-200/50"
                          }`}
                        >
                          ⭐ Best {isProductBestseller(row) ? "✓" : "+"}
                        </button>
                        {row.featuredProduct && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            🔥
                          </span>
                        )}
                      </div>
                    )}
                    {viewMode === "active" && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">Stock:</span>
                        <QuickStockEditor productId={row.id} currentStock={row.stock} />
                      </div>
                    )}
                    {viewMode === "trash" && (
                      <div className="mt-1">
                        <span className="text-xs font-semibold text-red-400">
                          Deleted: {row.deletedAt?.toDate ? row.deletedAt.toDate().toLocaleDateString("en-IN") : "Recently"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-7">
                  {viewMode === "active" && (
                    <>
                      {onEditProduct && (
                        <button
                          onClick={() => onEditProduct(row)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-xl text-base font-bold transition-all active:scale-95"
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                      )}
                      <button
                        onClick={() => openConfirm("trash_one", [row.id])}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-50 text-amber-700 rounded-xl text-base font-bold border border-amber-100 transition-all active:scale-95"
                      >
                        <Trash2 size={13} /> Trash
                      </button>
                    </>
                  )}
                  {viewMode === "trash" && (
                    <>
                      <button
                        onClick={() => openConfirm("restore_one", [row.id])}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-base font-bold border border-emerald-100 transition-all active:scale-95"
                      >
                        <ArchiveRestore size={13} /> Restore
                      </button>
                      <button
                        onClick={() => openConfirm("permanent_one", [row.id])}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 rounded-xl text-base font-bold border border-red-100 transition-all active:scale-95"
                      >
                        <ShieldAlert size={13} /> Delete Forever
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="px-8 py-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-slate-100">
              {viewMode === "trash" ? (
                <Trash size={30} className="text-slate-300" />
              ) : (
                <Package size={30} className="text-slate-300" />
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              {currentList.length === 0
                ? viewMode === "trash" ? "Trash is empty" : "No products yet"
                : "No matching products found"}
            </h3>
            <p className="text-base text-slate-400 max-w-[280px] mx-auto">
              {currentList.length === 0
                ? viewMode === "trash"
                  ? "Soft-deleted products will appear here and can be restored."
                  : "Your inventory is empty. Add your first jewelry item."
                : "No products matched your search keyword or selected filters."}
            </p>
            {currentList.length > 0 && (
              <button
                onClick={() => {
                  setSearch("");
                  setCategory("All Categories");
                  setSelectedCountry("All Countries");
                  setSortBy("newest");
                }}
                className="mt-5 px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-base font-bold transition-all border border-slate-200"
              >
                Reset Filters
              </button>
            )}
            {currentList.length === 0 && viewMode === "active" && (
              <button
                onClick={onAddProduct}
                className="mt-6 px-6 py-2.5 bg-[#811331] text-white rounded-xl text-base font-bold shadow-lg shadow-[#811331]/20 hover:bg-[#9d1a3d] transition-all"
              >
                Add Your First Product
              </button>
            )}
          </div>
        )}

        {/* Footer Controls with Pagination */}
        {filteredProducts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 px-6 py-4 gap-4 text-base font-semibold text-slate-500 bg-slate-50/30">
            <div className="flex items-center gap-2">
              <span>Showing</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 outline-none text-slate-700 font-bold"
              >
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>{size} rows</option>
                ))}
              </select>
              <span>of {filteredProducts.length} entries</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-800">
                Page {currentPage} of {totalPages || 1}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default ProductsTable;
