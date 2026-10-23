import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { db } from "../../../components/Firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  updateDoc,
} from "firebase/firestore";

import { uploadToCloudinary } from "../../../config/cloudinary";
import CloudinaryImageLibrary from "./CloudinaryImageLibrary";
import { listenToTags } from "../../../services/tagsService";
import { Check } from "lucide-react";

export const ProductForm = ({ onSuccess }) => {
  const { register, handleSubmit, reset, formState } = useForm({
    defaultValues: {
      name: "",
      category: "",
      description: "",
      discount: 0,
      care_instructions: "",
      stones: "",
      size_weight: "",
      original_price: 0,
      price: 0,
      rating: 0,
      stock_status: "In Stock",
      stock: 0,
      material: "",
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedCloudinaryImages, setSelectedCloudinaryImages] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  const categories = ["Necklace", "Earrings", "Rings", "Bracelet", "Bangles", "Bridal Wear", "Anklets"];

  useEffect(() => {
    const unsub = listenToTags((tags) => setAllTags(tags));
    return () => unsub();
  }, []);

  const toggleTag = (tagName) => {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    );
  };

  const onSubmit = async (values) => {
    setError("");
    setLoading(true);
    try {
      const files = values.images?.[0] ? Array.from(values.images) : [];
      const uploadUrls = [...selectedCloudinaryImages];
      for (const file of files) {
        const url = await uploadToCloudinary(file);
        uploadUrls.push(url);
      }

      const docData = {
        name: values.name,
        category: values.category,
        description: values.description,
        discount: Number(values.discount) || 0,
        care_instructions: values.care_instructions,
        images: uploadUrls,
        image: uploadUrls[0] || "",
        stones: values.stones,
        size_weight: values.size_weight,
        original_price: Number(values.original_price) || 0,
        price: Number(values.price) || 0,
        rating: Number(values.rating) || 0,
        stock_status: values.stock <= 0 ? "Out of Stock" : values.stock_status,
        stock: Number(values.stock) || 0,
        material: values.material,
        tags: selectedTags,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, "products"), docData);
      reset();
      setSelectedCloudinaryImages([]);
      setSelectedTags([]);
      if (onSuccess) {
        onSuccess();
      }
    } catch {
      setError("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-base font-semibold text-slate-700 uppercase tracking-wider">Product Name</label>
          <input
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#811331] focus:ring-1 focus:ring-[#811331] outline-none transition-all text-sm"
            placeholder="e.g. Emerald Queen Choker"
            {...register("name", { required: true })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-base font-semibold text-slate-700 uppercase tracking-wider">Category</label>
          <select
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#811331] focus:ring-1 focus:ring-[#811331] outline-none transition-all text-sm appearance-none bg-white"
            {...register("category", { required: true })}
          >
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-base font-semibold text-slate-700 uppercase tracking-wider">Description</label>
        <textarea
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#811331] focus:ring-1 focus:ring-[#811331] outline-none transition-all text-sm min-h-[100px]"
          placeholder="Describe the product benefits and key features..."
          rows={3}
          {...register("description")}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-base font-semibold text-slate-700 uppercase tracking-wider">Original Price (₹)</label>
          <input
            type="number"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#811331] focus:ring-1 focus:ring-[#811331] outline-none transition-all text-sm"
            placeholder="0.00"
            {...register("original_price")}
          />
        </div>
        <div className="space-y-1">
          <label className="text-base font-semibold text-slate-700 uppercase tracking-wider">Sale Price (₹)</label>
          <input
            type="number"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#811331] focus:ring-1 focus:ring-[#811331] outline-none transition-all text-sm"
            placeholder="0.00"
            {...register("price", { required: true })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-base font-semibold text-slate-700 uppercase tracking-wider">Material</label>
          <input
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#811331] focus:ring-1 focus:ring-[#811331] outline-none transition-all text-sm"
            placeholder="e.g. 22K Gold Plated Brass"
            {...register("material")}
          />
          <div className="space-y-1">
          <label className="text-base font-semibold text-slate-700 uppercase tracking-wider">Stock Quantity</label>
          <input
            type="number"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#811331] focus:ring-1 focus:ring-[#811331] outline-none transition-all text-sm"
            placeholder="0"
            {...register("stock")}
          />
        </div>
      </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-base font-semibold text-slate-700 uppercase tracking-wider">Stones/Details</label>
          <input
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#811331] focus:ring-1 focus:ring-[#811331] outline-none transition-all text-sm"
            placeholder="e.g. Handcrafted Kundan, American Diamonds"
            {...register("stones")}
          />
        </div>
        <div className="space-y-1">
          <label className="text-base font-semibold text-slate-700 uppercase tracking-wider">Size/Weight</label>
          <input
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#811331] focus:ring-1 focus:ring-[#811331] outline-none transition-all text-sm"
            placeholder="e.g. 2.4 inches / 45g"
            {...register("size_weight")}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-base font-semibold text-slate-700 uppercase tracking-wider">Care Instructions</label>
        <textarea
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#811331] focus:ring-1 focus:ring-[#811331] outline-none transition-all text-sm min-h-[80px]"
          placeholder="e.g. Keep away from water and perfume. Store in a dry pouch."
          rows={2}
          {...register("care_instructions")}
        />
      </div>

      {/* Checkmark Product Tags Selection (Multiple) */}
      <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
        <div className="flex justify-between items-center">
          <label className="text-base font-semibold text-slate-700 uppercase tracking-wider">
            Product Tags (Select One or Multiple)
          </label>
          <span className="text-xs text-slate-500 font-medium">
            {selectedTags.length} tag(s) selected
          </span>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {allTags.map((tag) => {
            const checked = selectedTags.includes(tag.name);
            return (
              <button
                type="button"
                key={tag.id}
                onClick={() => toggleTag(tag.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                  checked
                    ? "bg-[#811331] text-white border-[#811331] shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:border-[#811331]"
                }`}
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center transition-all ${checked ? "bg-white text-[#811331]" : "border border-slate-300 bg-slate-50"}`}>
                  {checked && <Check size={12} strokeWidth={3} />}
                </div>
                <span>{tag.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-base font-semibold text-slate-700 uppercase tracking-wider">Product Images</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <input
              type="file"
              multiple
              accept="image/*"
              className="w-full px-4 py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-[#811331] transition-colors text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-base file:font-semibold file:bg-[#811331]/10 file:text-[#811331] cursor-pointer"
              {...register("images")}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowLibrary(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#811331] text-[#811331] text-sm font-semibold hover:bg-[#811331]/5 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Choose from Cloudinary
          </button>
        </div>

        {selectedCloudinaryImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedCloudinaryImages.map((url, index) => (
              <div key={index} className="relative group">
                <img src={url} alt="Selected" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                <button
                  type="button"
                  onClick={() => setSelectedCloudinaryImages(prev => prev.filter((_, i) => i !== index))}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showLibrary && (
        <CloudinaryImageLibrary
          onSelect={(url) => {
            setSelectedCloudinaryImages(prev => [...prev, url]);
            setShowLibrary(false);
          }}
          onClose={() => setShowLibrary(false)}
        />
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        {formState.isSubmitted && !loading && !error && (
          <span className="flex items-center gap-1.5 text-base font-bold text-emerald-600 animate-in fade-in slide-in-from-right-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Product Created Successfully
          </span>
        )}
        {error && (
          <span className="text-base font-bold text-red-600">
            Error: {error}
          </span>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-2.5 rounded-xl bg-[#811331] text-white text-sm font-bold shadow-lg shadow-[#811331]/20 hover:bg-[#650f27] hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:translate-y-0"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Uploading...
            </span>
          ) : "Publish Product"}
        </button>
      </div>
    </form>
  );
};

export const EditProductForm = ({ product, onSuccess }) => {
  const { register, handleSubmit, reset, formState } = useForm({
    defaultValues: {
      name: product?.name || "",
      category: product?.category || "",
      description: product?.description || "",
      original_price: product?.original_price || 0,
      price: product?.price || 0,
      stock: product?.stock || 0,
      material: product?.material || "",
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedCloudinaryImages, setSelectedCloudinaryImages] = useState(product?.images || []);
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState(product?.tags || []);

  const categories = ["Necklace", "Earrings", "Rings", "Bracelet", "Bangles", "Bridal Wear", "Anklets"];

  useEffect(() => {
    const unsub = listenToTags((tags) => setAllTags(tags));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (product) {
      reset({
        name: product.name || "",
        category: product.category || "",
        description: product.description || "",
        original_price: product.original_price || 0,
        price: product.price || 0,
        stock: product.stock || 0,
        material: product.material || "",
      });
      setSelectedTags(product.tags || []);
    }
  }, [product, reset]);

  const toggleTag = (tagName) => {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    );
  };

  const onSubmit = async (values) => {
    if (!product?.id) return;
    setError("");
    setLoading(true);
    try {
      let uploadUrls = [...selectedCloudinaryImages];
      const files = values.images?.[0] ? Array.from(values.images) : [];
      if (files.length > 0) {
        for (const file of files) {
          const url = await uploadToCloudinary(file);
          uploadUrls.push(url);
        }
      }

      const updateData = {
        name: values.name,
        category: values.category,
        description: values.description,
        original_price: Number(values.original_price) || 0,
        price: Number(values.price) || 0,
        stock: Number(values.stock) || 0,
        stock_status: values.stock <= 0 ? "Out of Stock" : "In Stock",
        material: values.material,
        tags: selectedTags,
        images: uploadUrls,
        image: uploadUrls[0] || product.image || "",
      };

      await updateDoc(doc(db, "products", product.id), updateData);
      if (onSuccess) {
        onSuccess();
      }
    } catch {
      setError("Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-base font-semibold text-slate-700 uppercase tracking-wider">Product Name</label>
          <input
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#811331] focus:ring-1 focus:ring-[#811331] outline-none transition-all text-sm"
            placeholder="e.g. Emerald Queen Choker"
            {...register("name", { required: true })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-base font-semibold text-slate-700 uppercase tracking-wider">Category</label>
          <select
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#811331] focus:ring-1 focus:ring-[#811331] outline-none transition-all text-sm appearance-none bg-white"
            {...register("category", { required: true })}
          >
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-base font-semibold text-slate-700 uppercase tracking-wider">Description</label>
        <textarea
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#811331] focus:ring-1 focus:ring-[#811331] outline-none transition-all text-sm min-h-[100px]"
          placeholder="Describe the product benefits..."
          rows={3}
          {...register("description")}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-base font-semibold text-slate-700 uppercase tracking-wider">Original Price (₹)</label>
          <input
            type="number"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#811331] focus:ring-1 focus:ring-[#811331] outline-none transition-all text-sm"
            placeholder="0.00"
            {...register("original_price")}
          />
        </div>
        <div className="space-y-1">
          <label className="text-base font-semibold text-slate-700 uppercase tracking-wider">Sale Price (₹)</label>
          <input
            type="number"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#811331] focus:ring-1 focus:ring-[#811331] outline-none transition-all text-sm"
            placeholder="0.00"
            {...register("price", { required: true })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-base font-semibold text-slate-700 uppercase tracking-wider">Material</label>
          <input
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#811331] focus:ring-1 focus:ring-[#811331] outline-none transition-all text-sm"
            placeholder="e.g. 22K Gold Plated Brass"
            {...register("material")}
          />
          <div className="space-y-1">
          <label className="text-base font-semibold text-slate-700 uppercase tracking-wider">Stock Quantity</label>
          <input
            type="number"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#811331] focus:ring-1 focus:ring-[#811331] outline-none transition-all text-sm"
            placeholder="0"
            {...register("stock")}
          />
        </div>
      </div>
      </div>

      {/* Checkmark Product Tags Selection (Multiple) */}
      <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
        <div className="flex justify-between items-center">
          <label className="text-base font-semibold text-slate-700 uppercase tracking-wider">
            Product Tags (Select One or Multiple)
          </label>
          <span className="text-xs text-slate-500 font-medium">
            {selectedTags.length} tag(s) selected
          </span>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {allTags.map((tag) => {
            const checked = selectedTags.includes(tag.name);
            return (
              <button
                type="button"
                key={tag.id}
                onClick={() => toggleTag(tag.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                  checked
                    ? "bg-[#811331] text-white border-[#811331] shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:border-[#811331]"
                }`}
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center transition-all ${checked ? "bg-white text-[#811331]" : "border border-slate-300 bg-slate-50"}`}>
                  {checked && <Check size={12} strokeWidth={3} />}
                </div>
                <span>{tag.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-base font-semibold text-slate-700 uppercase tracking-wider">Update Images (Optional)</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <input
              type="file"
              multiple
              accept="image/*"
              className="w-full px-4 py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-[#811331] transition-colors text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-base file:font-semibold file:bg-[#811331]/10 file:text-[#811331] cursor-pointer"
              {...register("images")}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowLibrary(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#811331] text-[#811331] text-sm font-semibold hover:bg-[#811331]/5 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Choose from Cloudinary
          </button>
        </div>

        {selectedCloudinaryImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedCloudinaryImages.map((url, index) => (
              <div key={index} className="relative group">
                <img src={url} alt="Selected" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                <button
                  type="button"
                  onClick={() => setSelectedCloudinaryImages(prev => prev.filter((_, i) => i !== index))}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showLibrary && (
        <CloudinaryImageLibrary
          onSelect={(url) => {
            setSelectedCloudinaryImages(prev => [...prev, url]);
            setShowLibrary(false);
          }}
          onClose={() => setShowLibrary(false)}
        />
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        {error && (
          <span className="text-base font-bold text-red-600">
            {error}
          </span>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-2.5 rounded-xl bg-[#811331] text-white text-sm font-bold shadow-lg shadow-[#811331]/20 hover:bg-[#650f27] transition-all disabled:opacity-60"
        >
          {loading ? "Saving Changes..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
};
