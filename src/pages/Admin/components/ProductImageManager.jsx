// ProductImageManager.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Images,
  Image as ImageIcon,
  Upload,
  Plus,
  Trash2,
  Search,
  Crown,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Filter,
  Loader2,
  Link as LinkIcon,
  Computer,
  Sparkles,
  RefreshCw,
  Eye,
  AlertCircle,
  Package,
  Layers
} from "lucide-react";
import { updateProduct, listenToProducts } from "../../../services/productService";
import { uploadToCloudinary, getThumbnailUrl, getOptimizedImageUrl, handleImageError } from "../../../config/cloudinary";

const ProductImageManager = ({ products: initialProducts = [], isDarkMode = false }) => {
  const [products, setProducts] = useState(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [imageFilter, setImageFilter] = useState("all"); // 'all', 'has_images', 'missing_images'

  // Modal state for editing a product's full gallery
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalImages, setModalImages] = useState([]);
  const [newUrl, setNewUrl] = useState("");
  const [isUploadingModal, setIsUploadingModal] = useState(false);
  const [modalSuccessMsg, setModalSuccessMsg] = useState("");
  const [modalErrorMsg, setModalErrorMsg] = useState("");

  // Quick upload loading state per product row: { [productId]: boolean }
  const [rowUploading, setRowUploading] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

  // Image Lightbox Preview
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  const fileInputRef = useRef(null);
  const modalFileInputRef = useRef(null);

  // Subscribe to live products if initialProducts is empty or for real-time updates
  useEffect(() => {
    const unsubscribe = listenToProducts(
      (data) => setProducts(data),
      (err) => console.warn("Error listening to products in Image Manager:", err)
    );
    return () => unsubscribe();
  }, []);

  const showToast = (msg, type = "success") => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Categories list for filter
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["All", ...Array.from(set)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        `${p.name || ""} ${p.sku || ""} ${p.category || ""}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchCategory = categoryFilter === "All" || p.category === categoryFilter;

      const imgCount = (p.images && p.images.length > 0) ? p.images.length : (p.image ? 1 : 0);
      let matchImageFilter = true;
      if (imageFilter === "has_images") matchImageFilter = imgCount > 0;
      if (imageFilter === "missing_images") matchImageFilter = imgCount === 0;

      return matchSearch && matchCategory && matchImageFilter;
    });
  }, [products, searchTerm, categoryFilter, imageFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = products.length;
    const withImages = products.filter(
      (p) => (p.images && p.images.length > 0) || p.image
    ).length;
    const missing = total - withImages;
    const totalImagesCount = products.reduce((acc, p) => {
      if (p.images && p.images.length > 0) return acc + p.images.length;
      if (p.image) return acc + 1;
      return acc;
    }, 0);
    return { total, withImages, missing, totalImagesCount };
  }, [products]);

  // Handle Quick Upload from Table Row
  const handleQuickUpload = async (product, files) => {
    if (!files || files.length === 0) return;
    setRowUploading((prev) => ({ ...prev, [product.id]: true }));

    try {
      const uploadedUrls = [];
      for (const file of Array.from(files)) {
        const url = await uploadToCloudinary(file);
        uploadedUrls.push(url);
      }

      const existingImages = product.images && product.images.length > 0
        ? [...product.images]
        : (product.image ? [product.image] : []);

      const updatedImages = [...existingImages, ...uploadedUrls];
      const updatedPrimaryImage = updatedImages[0] || "";

      await updateProduct(product.id, {
        images: updatedImages,
        image: updatedPrimaryImage
      });

      showToast(`Added ${uploadedUrls.length} image(s) to "${product.name}"`);
    } catch (err) {
      console.error("Upload error:", err);
      showToast("Failed to upload image. Please try again.", "error");
    } finally {
      setRowUploading((prev) => ({ ...prev, [product.id]: false }));
    }
  };

  // Delete specific image directly from table thumbnail hover
  const handleDeleteImageFromProduct = async (product, indexToDelete) => {
    if (!window.confirm(`Delete image #${indexToDelete + 1} from "${product.name}"?`)) return;

    const existingImages = product.images && product.images.length > 0
      ? [...product.images]
      : (product.image ? [product.image] : []);

    const updatedImages = existingImages.filter((_, idx) => idx !== indexToDelete);
    const updatedPrimaryImage = updatedImages[0] || "";

    try {
      await updateProduct(product.id, {
        images: updatedImages,
        image: updatedPrimaryImage
      });
      showToast(`Image deleted from "${product.name}"`);
    } catch (err) {
      console.error("Error removing image:", err);
      showToast("Failed to remove image", "error");
    }
  };

  // Set primary image directly from table thumbnail hover
  const handleSetPrimaryFromTable = async (product, indexToPrimary) => {
    const existingImages = product.images && product.images.length > 0
      ? [...product.images]
      : (product.image ? [product.image] : []);

    if (indexToPrimary === 0 || indexToPrimary >= existingImages.length) return;

    const targetImg = existingImages[indexToPrimary];
    const remaining = existingImages.filter((_, idx) => idx !== indexToPrimary);
    const updatedImages = [targetImg, ...remaining];

    try {
      await updateProduct(product.id, {
        images: updatedImages,
        image: targetImg
      });
      showToast(`Primary image updated for "${product.name}"`);
    } catch (err) {
      console.error("Error setting primary image:", err);
      showToast("Failed to set primary image", "error");
    }
  };

  // Modal Open Handlers
  const openGalleryModal = (product) => {
    setSelectedProduct(product);
    const productImages = product.images && product.images.length > 0
      ? [...product.images]
      : (product.image ? [product.image] : []);
    setModalImages(productImages);
    setNewUrl("");
    setModalSuccessMsg("");
    setModalErrorMsg("");
  };

  const closeGalleryModal = () => {
    setSelectedProduct(null);
    setModalImages([]);
    setNewUrl("");
    setModalSuccessMsg("");
    setModalErrorMsg("");
  };

  // Modal Actions
  const handleModalAddUrl = () => {
    if (!newUrl.trim()) return;
    const url = newUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      setModalErrorMsg("Please enter a valid image URL starting with http:// or https://");
      return;
    }
    setModalImages((prev) => [...prev, url]);
    setNewUrl("");
    setModalErrorMsg("");
  };

  const handleModalUploadFiles = async (files) => {
    if (!files || files.length === 0) return;
    setIsUploadingModal(true);
    setModalErrorMsg("");
    try {
      const uploaded = [];
      for (const file of Array.from(files)) {
        const url = await uploadToCloudinary(file);
        uploaded.push(url);
      }
      setModalImages((prev) => [...prev, ...uploaded]);
      setModalSuccessMsg(`Uploaded ${uploaded.length} image(s)`);
    } catch (err) {
      console.error("Modal upload error:", err);
      setModalErrorMsg("Failed to upload file(s) to Cloudinary.");
    } finally {
      setIsUploadingModal(false);
    }
  };

  const handleModalMove = (fromIndex, direction) => {
    const toIndex = direction === "left" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= modalImages.length) return;

    const copy = [...modalImages];
    const temp = copy[fromIndex];
    copy[fromIndex] = copy[toIndex];
    copy[toIndex] = temp;
    setModalImages(copy);
  };

  const handleModalMakePrimary = (index) => {
    if (index === 0) return;
    const copy = [...modalImages];
    const selected = copy[index];
    copy.splice(index, 1);
    copy.unshift(selected);
    setModalImages(copy);
  };

  const handleModalRemoveImage = (index) => {
    setModalImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveModalGallery = async () => {
    if (!selectedProduct) return;
    setIsUploadingModal(true);
    setModalSuccessMsg("");
    setModalErrorMsg("");

    try {
      const updatedImages = [...modalImages];
      const updatedPrimary = updatedImages[0] || "";

      await updateProduct(selectedProduct.id, {
        images: updatedImages,
        image: updatedPrimary
      });

      showToast(`Updated image gallery for "${selectedProduct.name}"`);
      closeGalleryModal();
    } catch (err) {
      console.error("Save gallery error:", err);
      setModalErrorMsg("Failed to save updated gallery to Firestore.");
    } finally {
      setIsUploadingModal(false);
    }
  };

  // Dark mode style variables
  const cardBg = isDarkMode ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-100";
  const tableHeaderBg = isDarkMode ? "bg-slate-800/80 text-slate-300" : "bg-slate-50 text-slate-700";
  const rowBorder = isDarkMode ? "border-slate-800/80 hover:bg-slate-800/40" : "border-slate-100 hover:bg-slate-50/60";
  const textTitle = isDarkMode ? "text-white" : "text-slate-900";
  const textSub = isDarkMode ? "text-slate-400" : "text-slate-500";
  const inputStyle = isDarkMode
    ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-[#811331]"
    : "bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-[#811331]";

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-semibold ${toastMessage.type === "error"
              ? "bg-red-900/90 border-red-700 text-white"
              : "bg-emerald-900/90 border-emerald-700 text-white"
              }`}
          >
            {toastMessage.type === "error" ? <AlertCircle size={18} /> : <Check size={18} />}
            <span>{toastMessage.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Overview Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={`rounded-2xl border p-5 shadow-sm transition-all ${cardBg}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${textSub}`}>Total Products</p>
              <h3 className={`mt-2 text-2xl font-bold ${textTitle}`}>{metrics.total}</h3>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#811331]/10 text-[#811331]">
              <Package size={22} />
            </div>
          </div>
          <p className="mt-2 text-xs text-emerald-500 font-medium">Catalog Items</p>
        </div>

        <div className={`rounded-2xl border p-5 shadow-sm transition-all ${cardBg}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${textSub}`}>With Images</p>
              <h3 className="mt-2 text-2xl font-bold text-emerald-500">{metrics.withImages}</h3>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <ImageIcon size={22} />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400 font-medium">
            {metrics.total > 0 ? Math.round((metrics.withImages / metrics.total) * 100) : 0}% of catalog ready
          </p>
        </div>

        <div className={`rounded-2xl border p-5 shadow-sm transition-all ${cardBg}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${textSub}`}>Missing Images</p>
              <h3 className={`mt-2 text-2xl font-bold ${metrics.missing > 0 ? "text-amber-500" : textTitle}`}>
                {metrics.missing}
              </h3>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
              <AlertCircle size={22} />
            </div>
          </div>
          <p className="mt-2 text-xs text-amber-500 font-medium">
            {metrics.missing > 0 ? "Requires photo uploads" : "All products have images"}
          </p>
        </div>

        <div className={`rounded-2xl border p-5 shadow-sm transition-all ${cardBg}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${textSub}`}>Total Uploaded Photos</p>
              <h3 className={`mt-2 text-2xl font-bold text-[#811331]`}>{metrics.totalImagesCount}</h3>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#811331]/10 text-[#811331]">
              <Images size={22} />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400 font-medium">Across all product galleries</p>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className={`rounded-2xl border p-5 shadow-sm ${cardBg}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search size={17} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${textSub}`} />
            <input
              type="text"
              placeholder="Search product name, SKU, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm outline-none transition-all ${inputStyle}`}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter size={15} className={textSub} />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`rounded-xl border px-3 py-2 text-sm outline-none font-medium cursor-pointer ${inputStyle}`}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    Category: {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Image Status Filter Pills */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
              <button
                onClick={() => setImageFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition-all ${imageFilter === "all"
                  ? "bg-[#811331] text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
              >
                All ({metrics.total})
              </button>
              <button
                onClick={() => setImageFilter("has_images")}
                className={`px-3 py-1.5 rounded-lg transition-all ${imageFilter === "has_images"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
              >
                With Images ({metrics.withImages})
              </button>
              <button
                onClick={() => setImageFilter("missing_images")}
                className={`px-3 py-1.5 rounded-lg transition-all ${imageFilter === "missing_images"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
              >
                Missing ({metrics.missing})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Product Images Table */}
      <div className={`overflow-hidden rounded-2xl border shadow-sm ${cardBg}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className={`border-b text-xs font-bold uppercase tracking-wider ${tableHeaderBg}`}>
                <th className="py-4 px-5">Product Info</th>
                <th className="py-4 px-5">Uploaded Images Gallery</th>
                <th className="py-4 px-5 text-center">Total Images</th>
                <th className="py-4 px-5 text-center">Quick Upload</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Images size={36} className="text-slate-300 dark:text-slate-600" />
                      <p className="text-base font-semibold">No matching products found</p>
                      <p className="text-xs text-slate-400">Try adjusting your search query or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const productImages =
                    product.images && product.images.length > 0
                      ? product.images
                      : product.image
                        ? [product.image]
                        : [];
                  const count = productImages.length;
                  const isUploading = rowUploading[product.id];

                  return (
                    <tr key={product.id} className={`transition-colors ${rowBorder}`}>
                      {/* Product Info */}
                      <td className="py-4 px-5 align-middle">
                        <div className="flex items-center gap-3.5">
                          {/* Mini Lead Thumbnail */}
                          <div
                            onClick={() => productImages[0] && setPreviewImageUrl(productImages[0])}
                            className={`h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border bg-slate-100 dark:bg-slate-800 cursor-pointer grid place-items-center relative group ${productImages[0] ? "border-[#811331]/30" : "border-dashed border-slate-300"
                              }`}
                          >
                            {productImages[0] ? (
                              <>
                                <img
                                  src={getThumbnailUrl(productImages[0])}
                                  alt={product.name}
                                  loading="lazy"
                                  decoding="async"
                                  onError={(e) => handleImageError(e, productImages[0])}
                                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center text-white">
                                  <Eye size={14} />
                                </div>
                              </>
                            ) : (
                              <ImageIcon size={18} className="text-slate-400" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <h4 className={`font-bold text-sm truncate ${textTitle}`} title={product.name}>
                              {product.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              {product.sku && (
                                <span className="text-[14px] font-mono font-medium text-slate-400 uppercase">
                                  SKU: {product.sku}
                                </span>
                              )}
                              {product.category && (
                                <span className="inline-block rounded-md bg-[#811331]/10 px-2 py-0.5 text-[14px] font-bold text-[#811331]">
                                  {product.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Uploaded Images Thumbnails Gallery */}
                      <td className="py-4 px-5 align-middle">
                        {count === 0 ? (
                          <div className="flex items-center gap-2 text-xs font-semibold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg w-fit">
                            <AlertCircle size={14} />
                            <span>No images uploaded yet</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 overflow-x-auto max-w-[420px] py-1 scrollbar-thin">
                            {productImages.map((imgUrl, idx) => (
                              <div
                                key={idx}
                                className={`group relative h-14 w-14 flex-shrink-0 rounded-xl overflow-hidden border-2 bg-slate-100 dark:bg-slate-800 shadow-sm transition-all ${idx === 0 ? "border-[#811331] ring-2 ring-[#811331]/20" : "border-slate-200 dark:border-slate-700"
                                  }`}
                              >
                                <img
                                  src={getThumbnailUrl(imgUrl)}
                                  alt={`Product photo ${idx + 1}`}
                                  loading="lazy"
                                  decoding="async"
                                  onError={(e) => handleImageError(e, imgUrl)}
                                  className="h-full w-full object-cover"
                                />

                                {/* Primary Badge indicator */}
                                {idx === 0 && (
                                  <span className="absolute top-0.5 left-0.5 bg-[#811331] text-white p-0.5 rounded-md text-[14px] shadow-sm">
                                    <Crown size={10} />
                                  </span>
                                )}

                                {/* Hover action overlay */}
                                <div className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewImageUrl(imgUrl)}
                                      title="Preview full size"
                                      className="p-1 rounded bg-white/20 hover:bg-white/40 text-white"
                                    >
                                      <Eye size={11} />
                                    </button>

                                    {idx !== 0 && (
                                      <button
                                        type="button"
                                        onClick={() => handleSetPrimaryFromTable(product, idx)}
                                        title="Make Primary Image"
                                        className="p-1 rounded bg-amber-500 hover:bg-amber-600 text-white"
                                      >
                                        <Crown size={11} />
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteImageFromProduct(product, idx)}
                                      title="Delete Image"
                                      className="p-1 rounded bg-red-600 hover:bg-red-700 text-white"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Total Images Count Badge */}
                      <td className="py-4 px-5 align-middle text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${count > 0
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            }`}
                        >
                          <ImageIcon size={13} />
                          {count} {count === 1 ? "Image" : "Images"}
                        </span>
                      </td>

                      {/* Quick File Upload Button for Row */}
                      <td className="py-4 px-5 align-middle text-center">
                        <label
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${isUploading
                            ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                            : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700"
                            }`}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 size={14} className="animate-spin text-[#811331]" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Plus size={14} className="text-[#811331]" />
                              <span>Add Image</span>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                disabled={isUploading}
                                onChange={(e) => handleQuickUpload(product, e.target.files)}
                              />
                            </>
                          )}
                        </label>
                      </td>

                      {/* Actions Button */}
                      <td className="py-4 px-5 align-middle text-right">
                        <button
                          onClick={() => openGalleryModal(product)}
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#811331] hover:bg-[#9d1a3d] text-white text-xs font-bold shadow-md shadow-[#811331]/20 transition-all active:scale-95"
                        >
                          <Images size={14} />
                          <span>Manage Gallery</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lightbox Image Preview Modal */}
      <AnimatePresence>
        {previewImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImageUrl(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <div className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-black border border-white/10 p-2 shadow-2xl">
              <button
                onClick={() => setPreviewImageUrl(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>
              <img
                src={previewImageUrl}
                alt="Full size preview"
                className="max-h-[85vh] w-auto object-contain rounded-xl mx-auto"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Gallery Manager Modal for a Selected Product */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={`w-full max-w-4xl rounded-3xl border p-6 shadow-2xl my-8 ${cardBg}`}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#811331]">
                      Product Image Manager
                    </span>
                  </div>
                  <h2 className={`text-xl font-bold ${textTitle}`}>{selectedProduct.name}</h2>
                  <p className={`text-xs ${textSub}`}>
                    SKU: {selectedProduct.sku || "N/A"} • Category: {selectedProduct.category || "General"}
                  </p>
                </div>
                <button
                  onClick={closeGalleryModal}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="py-5 space-y-6 max-h-[68vh] overflow-y-auto pr-1 scrollbar-thin">
                {/* Status Messages */}
                {modalSuccessMsg && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                    <Check size={16} />
                    <span>{modalSuccessMsg}</span>
                  </div>
                )}
                {modalErrorMsg && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold border border-red-500/20">
                    <AlertCircle size={16} />
                    <span>{modalErrorMsg}</span>
                  </div>
                )}

                {/* Upload & Add New Image Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60">
                  {/* Option 1: File Upload from Computer */}
                  <div>
                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${textTitle}`}>
                      1. Upload from Computer
                    </h4>
                    <button
                      type="button"
                      disabled={isUploadingModal}
                      onClick={() => modalFileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#811331] hover:bg-[#9d1a3d] text-white text-xs font-bold shadow-md shadow-[#811331]/20 transition-all disabled:opacity-50"
                    >
                      {isUploadingModal ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Computer size={16} />
                      )}
                      <span>{isUploadingModal ? "Uploading to Cloudinary..." : "Choose File(s)"}</span>
                    </button>
                    <input
                      ref={modalFileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleModalUploadFiles(e.target.files)}
                    />
                    <p className="mt-1.5 text-[14px] text-slate-400">
                      Supports JPG, PNG, WEBP. Uploads directly to Cloudinary gallery.
                    </p>
                  </div>

                  {/* Option 2: Add Direct Image URL */}
                  <div>
                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${textTitle}`}>
                      2. Add Image URL
                    </h4>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleModalAddUrl()}
                        className={`flex-1 rounded-xl border px-3 py-2 text-xs outline-none ${inputStyle}`}
                      />
                      <button
                        type="button"
                        onClick={handleModalAddUrl}
                        className="px-3 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900 text-xs font-bold transition-all"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <p className="mt-1.5 text-[14px] text-slate-400">
                      Paste a direct web image link and press enter or plus.
                    </p>
                  </div>
                </div>

                {/* Gallery Items Grid */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`text-sm font-bold ${textTitle}`}>
                      Gallery Images ({modalImages.length})
                    </h4>
                    <span className="text-xs text-slate-400">
                      First image with crown <Crown size={12} className="inline text-amber-500" /> is the Primary Storefront Image.
                    </span>
                  </div>

                  {modalImages.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400">
                      <ImageIcon size={32} className="mx-auto mb-2 text-slate-300" />
                      <p className="text-sm font-semibold">No images in gallery</p>
                      <p className="text-xs">Use the upload options above to add product photos.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                      {modalImages.map((imgUrl, index) => (
                        <div
                          key={index}
                          className={`group relative aspect-square rounded-2xl overflow-hidden border-2 bg-slate-100 dark:bg-slate-800 shadow-sm transition-all ${index === 0 ? "border-[#811331] ring-2 ring-[#811331]/30" : "border-slate-200 dark:border-slate-700"
                            }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`Gallery item ${index + 1}`}
                            className="h-full w-full object-cover"
                          />

                          {/* Primary Badge */}
                          {index === 0 && (
                            <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-[#811331] px-2 py-0.5 text-[14px] font-bold text-white shadow-md">
                              <Crown size={11} />
                              <span>Primary</span>
                            </div>
                          )}

                          {/* Index Badge */}
                          <div className="absolute top-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-[14px] font-mono font-bold text-white backdrop-blur-sm">
                            #{index + 1}
                          </div>

                          {/* Image Action Overlay */}
                          <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                            <div className="flex items-center gap-1.5">
                              {/* Move Left */}
                              {index > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleModalMove(index, "left")}
                                  title="Move Left"
                                  className="p-1.5 rounded-lg bg-white/20 text-white hover:bg-white/40"
                                >
                                  <ArrowLeft size={14} />
                                </button>
                              )}

                              {/* Make Primary */}
                              {index !== 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleModalMakePrimary(index)}
                                  title="Set as Primary"
                                  className="p-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 font-semibold text-xs flex items-center gap-1"
                                >
                                  <Crown size={14} />
                                </button>
                              )}

                              {/* Move Right */}
                              {index < modalImages.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleModalMove(index, "right")}
                                  title="Move Right"
                                  className="p-1.5 rounded-lg bg-white/20 text-white hover:bg-white/40"
                                >
                                  <ArrowRight size={14} />
                                </button>
                              )}

                              {/* Remove */}
                              <button
                                type="button"
                                onClick={() => handleModalRemoveImage(index)}
                                title="Remove Image"
                                className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between border-t pt-4 border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeGalleryModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isUploadingModal}
                  onClick={handleSaveModalGallery}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#811331] hover:bg-[#9d1a3d] text-white text-xs font-bold shadow-lg shadow-[#811331]/25 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isUploadingModal ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>Save Gallery Changes</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductImageManager;
