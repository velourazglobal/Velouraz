import React, { useState, useEffect } from "react";
import { listenToTags, addCustomTag, removeCustomTag } from "../../../services/tagsService";
import { listenToProducts } from "../../../services/productService";
import { Tags, Plus, Trash2, CheckCircle2, Lock, Tag, Sparkles } from "lucide-react";

const TagsManager = () => {
  const [tags, setTags] = useState([]);
  const [products, setProducts] = useState([]);
  const [newTagName, setNewTagName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const unsubTags = listenToTags((tagList) => setTags(tagList));
    const unsubProds = listenToProducts((prodList) => setProducts(prodList));
    return () => {
      unsubTags();
      unsubProds();
    };
  }, []);

  // Calculate product count per tag
  const getTagProductCount = (tagName) => {
    const lowerName = tagName.toLowerCase();
    return products.filter((p) =>
      Array.isArray(p.tags) && p.tags.some((t) => String(t).toLowerCase() === lowerName)
    ).length;
  };

  const handleAddTag = async (e) => {
    e.preventDefault();
    const clean = newTagName.trim();
    if (!clean) return;

    if (tags.some((t) => t.name.toLowerCase() === clean.toLowerCase())) {
      setErrorMsg(`Tag "${clean}" already exists.`);
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      await addCustomTag(clean);
      setNewTagName("");
    } catch (err) {
      console.error("Error adding tag:", err);
      setErrorMsg("Failed to add tag. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTag = async (tagId, tagName) => {
    if (tagId.startsWith("default-")) {
      alert("Default system tags cannot be deleted.");
      return;
    }
    if (window.confirm(`Are you sure you want to remove the custom tag "${tagName}"?`)) {
      try {
        await removeCustomTag(tagId);
      } catch (err) {
        console.error("Error removing tag:", err);
      }
    }
  };

  return (
    <div className="space-y-8 font-sans text-slate-800">
      
      {/* Header Container */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#811331] block">
              Catalog Management Suite
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 flex items-center gap-2.5">
              <Tags className="text-[#811331]" size={28} /> Tags Manager
            </h1>
            <p className="text-sm text-slate-500">
              Manage system tags (Bestsellers, New Arrivals) and add custom promotional tags to highlight your creations.
            </p>
          </div>
        </div>

        {/* Add Tag Input Form */}
        <form onSubmit={handleAddTag} className="flex flex-col sm:flex-row gap-3 max-w-xl">
          <div className="relative flex-1">
            <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. Festival Special, Limited Edition, Royalty..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#811331] focus:ring-1 focus:ring-[#811331] transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !newTagName.trim()}
            className="px-6 py-3 bg-[#811331] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#650f27] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 shrink-0"
          >
            <Plus size={16} />
            <span>{loading ? "Adding..." : "Add Custom Tag"}</span>
          </button>
        </form>

        {errorMsg && <p className="text-xs text-rose-600 font-semibold">{errorMsg}</p>}
      </div>

      {/* Tags Grid Display */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <h3 className="text-lg font-serif font-bold text-slate-900 flex items-center gap-2">
            <Sparkles size={18} className="text-[#811331]" /> Active Catalog Tags ({tags.length})
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Tags are displayed in product upload forms and shop filters
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tags.map((tag) => {
            const count = getTagProductCount(tag.name);
            return (
              <div
                key={tag.id}
                className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 hover:border-[#811331] transition-all group"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800 truncate">{tag.name}</span>
                    {tag.isDefault && (
                      <span title="System Built-in Tag">
                        <Lock size={12} className="text-slate-400 shrink-0" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    <strong className="text-[#811331] font-semibold">{count}</strong> product(s) tagged
                  </p>
                </div>

                {!tag.isDefault && (
                  <button
                    onClick={() => handleDeleteTag(tag.id, tag.name)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Remove custom tag"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default TagsManager;
