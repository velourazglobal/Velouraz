import React, { useState, useEffect } from 'react';
import { db } from '../../../components/Firebase';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy
} from 'firebase/firestore';
import {
  FileText, Plus, Edit2, Trash2, Image, Sparkles, X, Check, Search, Calendar, User, Clock, Eye,
  CloudUpload, Loader2, Images, AlertCircle, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadToCloudinary } from '../../../config/cloudinary';
import CloudinaryImageLibrary from './CloudinaryImageLibrary';

const defaultCategories = ['Jewellery Care', 'Trends', 'Craftsmanship', 'Style Guide', 'Behind The Scenes'];

const BlogManager = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);

  // Cloudinary States
  const [isCloudinaryLibraryOpen, setIsCloudinaryLibraryOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Jewellery Care',
    author: 'Velouraz Editorial',
    readTime: '5 min read',
    image: '',
    excerpt: '',
    content: ''
  });

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "blogs"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setBlogs(list);
    } catch (err) {
      console.error("Error fetching blogs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const openAddModal = () => {
    setEditingBlog(null);
    setFormData({
      title: '',
      category: 'Jewellery Care',
      author: 'Velouraz Editorial',
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=1200',
      excerpt: '',
      content: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title || '',
      category: blog.category || 'Jewellery Care',
      author: blog.author || 'Velouraz Editorial',
      readTime: blog.readTime || '5 min read',
      image: blog.image || '',
      excerpt: blog.excerpt || '',
      content: blog.content || ''
    });
    setIsModalOpen(true);
  };

  // Upload single blog cover image directly to Cloudinary
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const cloudUrl = await uploadToCloudinary(file);
      setFormData(prev => ({ ...prev, image: cloudUrl }));
    } catch (err) {
      console.error("Error uploading cover image to Cloudinary:", err);
      alert("Failed to upload image to Cloudinary. Please try again.");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  // Select image from Cloudinary Library
  const handleSelectCloudinaryImage = (url) => {
    if (typeof url === 'string') {
      setFormData(prev => ({ ...prev, image: url }));
    } else if (Array.isArray(url) && url.length > 0) {
      setFormData(prev => ({ ...prev, image: url[0].url }));
    }
    setIsCloudinaryLibraryOpen(false);
  };

  // Bulk Upload local blog images in /img/blogs to Cloudinary
  const handleBulkUploadLocalImages = async () => {
    setBulkUploading(true);
    setBulkMessage('');

    const localImageDefs = [
      { keyword: "Japan", path: "/img/blogs/japan-miyuki.png", name: "japan-miyuki.png" },
      { keyword: "Paris", path: "/img/blogs/paris-luxury.png", name: "paris-luxury.png" },
      { keyword: "India", path: "/img/blogs/india-silver.png", name: "india-silver.png" },
      { keyword: "Korean", path: "/img/blogs/korea-pearls.png", name: "korea-pearls.png" },
      { keyword: "Akoya", path: "/img/blogs/korea-pearls.png", name: "korea-pearls.png" },
    ];

    try {
      let uploadedCount = 0;
      const snap = await getDocs(collection(db, "blogs"));
      const docsList = snap.docs;

      for (const item of localImageDefs) {
        try {
          const response = await fetch(item.path);
          if (!response.ok) continue;
          const blob = await response.blob();
          const file = new File([blob], item.name, { type: blob.type || "image/png" });
          const cloudUrl = await uploadToCloudinary(file);
          uploadedCount++;

          // Update matching blogs in Firestore
          for (const blogDoc of docsList) {
            const data = blogDoc.data();
            const title = data.title || "";
            const currentImg = data.image || "";

            if (
              title.toLowerCase().includes(item.keyword.toLowerCase()) ||
              currentImg.includes(item.name) ||
              currentImg === item.path
            ) {
              await updateDoc(doc(db, "blogs", blogDoc.id), {
                image: cloudUrl
              });
            }
          }
        } catch (err) {
          console.error(`Failed uploading ${item.name} to Cloudinary:`, err);
        }
      }

      await fetchBlogs();
      setBulkMessage(`Successfully uploaded ${uploadedCount} local blog image(s) to Cloudinary and updated Firestore!`);
    } catch (err) {
      console.error("Bulk upload error:", err);
      setBulkMessage("Failed to complete bulk Cloudinary upload.");
    } finally {
      setBulkUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      alert("Title and content are required.");
      return;
    }

    setSaving(true);
    try {
      const blogPayload = {
        title: formData.title,
        category: formData.category,
        author: formData.author,
        readTime: formData.readTime,
        image: formData.image || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=1200',
        excerpt: formData.excerpt || formData.content.slice(0, 140) + '...',
        content: formData.content,
        updatedAt: serverTimestamp()
      };

      if (editingBlog) {
        await updateDoc(doc(db, "blogs", editingBlog.id), blogPayload);
      } else {
        await addDoc(collection(db, "blogs"), {
          ...blogPayload,
          createdAt: serverTimestamp()
        });
      }

      setIsModalOpen(false);
      fetchBlogs();
    } catch (err) {
      console.error("Error saving blog:", err);
      alert("Failed to save blog post.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (blogId) => {
    if (!window.confirm("Are you sure you want to delete this article?")) return;
    try {
      await deleteDoc(doc(db, "blogs", blogId));
      fetchBlogs();
    } catch (err) {
      console.error("Error deleting blog:", err);
    }
  };

  const filteredBlogs = blogs.filter(b =>
    b.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-[#2e0e43]" size={24} /> Blog & Journal Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">Create, edit and manage dynamic blog articles & editorial stories with Cloudinary storage.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleBulkUploadLocalImages}
            disabled={bulkUploading}
            title="Upload local blog images (/img/blogs/*) to Cloudinary and update Firestore"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
          >
            {bulkUploading ? (
              <>
                <Loader2 className="animate-spin" size={16} /> Uploading to Cloudinary...
              </>
            ) : (
              <>
                <CloudUpload size={16} /> Upload Local Images to Cloudinary
              </>
            )}
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2e0e43] text-white text-sm font-semibold rounded-xl hover:bg-[#5E0B24] transition-all cursor-pointer shadow-md"
          >
            <Plus size={16} /> Create Article
          </button>
        </div>
      </div>

      {/* Bulk Upload Feedback Banner */}
      {bulkMessage && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{bulkMessage}</span>
          <button onClick={() => setBulkMessage('')} className="ml-auto text-emerald-600 hover:text-emerald-800">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#2e0e43] transition-all"
          />
        </div>
        <p className="text-sm text-gray-500 font-medium">
          Showing <span className="font-bold text-gray-900">{filteredBlogs.length}</span> articles
        </p>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white p-4 rounded-2xl border border-gray-100">
              <div className="aspect-video bg-gray-200 rounded-xl mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredBlogs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.map((blog) => (
            <div key={blog.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
                  <img src={blog.image || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=1200'} alt={blog.title} className="w-full h-full object-cover" />
                  <span className="absolute top-3 left-3 bg-[#2e0e43] text-white text-[14px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-md">
                    {blog.category}
                  </span>
                  {blog.image?.includes('cloudinary') && (
                    <span className="absolute top-3 right-3 bg-emerald-600/90 backdrop-blur-xs text-white text-[14px] uppercase font-bold tracking-wider px-2 py-0.5 rounded flex items-center gap-1">
                      <CloudUpload size={11} /> Cloudinary
                    </span>
                  )}
                </div>
                <div className="p-5 space-y-2">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><User size={12} /> {blog.author}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {blog.readTime}</span>
                  </div>
                  <h3 className="font-serif font-bold text-lg text-gray-900 leading-snug line-clamp-2">
                    {blog.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 font-light">
                    {blog.excerpt}
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                <a
                  href={`/blog/${blog.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-gray-500 hover:text-[#2e0e43] flex items-center gap-1"
                >
                  <Eye size={13} /> View
                </a>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(blog)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="Edit article"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(blog.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete article"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-8">
          <FileText size={40} className="mx-auto text-gray-300 mb-3" />
          <h3 className="font-serif text-xl font-bold text-gray-800">No blog posts found</h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">Click "Create Article" to publish your first journal story.</p>
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 bg-[#2e0e43] text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
          >
            Create First Article
          </button>
        </div>
      )}

      {/* Add / Edit Blog Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-xl font-serif font-bold text-gray-900">
                  {editingBlog ? 'Edit Blog Article' : 'Publish New Blog Article'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Article Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. The Ultimate Jewellery Care Guide for Daily Luxury"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#2e0e43]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#2e0e43]"
                    >
                      {defaultCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Author Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Velouraz Editorial"
                      value={formData.author}
                      onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#2e0e43]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Read Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 5 min read"
                      value={formData.readTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, readTime: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#2e0e43]"
                    />
                  </div>
                </div>

                {/* Cloudinary Image Upload / URL / Gallery */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">Cover Image (Cloudinary)</label>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Paste image URL..."
                      value={formData.image}
                      onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                      className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#2e0e43]"
                    />

                    <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0">
                      {uploadingImage ? (
                        <>
                          <Loader2 className="animate-spin" size={15} /> Uploading...
                        </>
                      ) : (
                        <>
                          <CloudUpload size={15} className="text-[#2e0e43]" /> Upload File
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="hidden" />
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsCloudinaryLibraryOpen(true)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                    >
                      <Images size={15} /> Media Library
                    </button>
                  </div>

                  {formData.image && (
                    <div className="relative h-32 aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group">
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                        className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
                        title="Remove image"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Excerpt / Short Summary</label>
                  <textarea
                    rows={2}
                    placeholder="Brief intro for the article card..."
                    value={formData.excerpt}
                    onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#2e0e43]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Full Article Content *</label>
                  <textarea
                    rows={8}
                    required
                    placeholder="Write your article content here..."
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#2e0e43] font-sans"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 border border-gray-200 text-gray-600 text-xs font-bold uppercase rounded-xl hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-[#2e0e43] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#5E0B24] transition-all cursor-pointer shadow-md"
                  >
                    {saving ? 'Saving...' : editingBlog ? 'Update Article' : 'Publish Article'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cloudinary Image Library Modal */}
      {isCloudinaryLibraryOpen && (
        <CloudinaryImageLibrary
          onSelect={handleSelectCloudinaryImage}
          onClose={() => setIsCloudinaryLibraryOpen(false)}
          multiple={false}
        />
      )}
    </div>
  );
};

export default BlogManager;

