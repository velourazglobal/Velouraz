import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../components/Firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { Calendar, User, Clock, ArrowLeft, Share2, MessageCircle, Loader2, Sparkles, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const GOLD = '#C8A97A';
const SERIF = "'Cormorant Garamond', Georgia, serif";

const defaultBlogs = [
  {
    id: 'fallback-1',
    title: 'The Ultimate Jewellery Care Guide for Daily Luxury',
    category: 'Jewellery Care',
    author: 'Velouraz Editorial Team',
    readTime: '6 min read',
    createdAt: { toMillis: () => new Date('2026-06-15').getTime() },
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=1200',
    excerpt: 'Preserve the luster of your conflict-free diamonds and 18k solid gold base with our step-by-step master guide for home preservation.',
    content: `Fine jewellery is an investment in beauty, heritage, and emotion. Whether your collection features conflict-free diamonds, precious gemstones, or classic 18k solid gold base, maintaining their brilliance requires consistent and careful attention. 

Here is our master guide on how to keep your pieces radiant for a lifetime.

### 1. General Handling Rules
Always put your jewellery on last when getting dressed. Cosmetics, hairsprays, perfumes, and lotions often contain chemicals that can dull the finish of precious metals and cloud the brilliance of stones. 

Conversely, make your jewellery the first thing you remove at the end of the day.

### 2. Routine Cleaning at Home
For solid gold and diamond pieces, a gentle home bath works wonders:
- Prepare a bowl of warm water with a few drops of mild dish soap.
- Soak the pieces for 10 to 15 minutes to loosen oils and daily grime.
- Use a very soft-bristled toothbrush to gently scrub the settings, especially underneath the stones where lotion and soap residue collect.
- Rinse thoroughly under clean running water.
- Pat dry with a clean, lint-free microfiber cloth.

### 3. Storing Your Masterpieces
Store your pieces individually in a soft fabric-lined tray or their original Velouraz pouch. Harder gems like diamonds can easily scratch softer gemstones and gold if they rub against each other. Keeping them separated prevents unwanted friction.`
  },
  {
    id: 'fallback-2',
    title: 'Autumn/Winter 2026 High Jewellery Styling Trends',
    category: 'Trends',
    author: 'Aria Dev, Styling Director',
    readTime: '4 min read',
    createdAt: { toMillis: () => new Date('2026-07-02').getTime() },
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200',
    excerpt: 'From stacked crystal cuffs to statement emerald chokers, explore how leading tastemakers are layering jewellery this season.',
    content: `As we transition into the cooler months of 2026, high fashion and high jewellery are merging in spectacular ways. This season is defined by contrast combining structured, heavy tailoring with delicate, light-catching accessories. 

Here are the major trends our design editors are tracking.

### 1. Layered Statement Necklaces
The single delicate chain is stepping aside to make way for artful, multi-layered arrangements. The key to this look is pairing different weights and styles:
- Start with a solid gold choker as a base.
- Add a medium-weight chain with an eye-catching pendant.
- Finish the look with a longer, finer lariat to elongate the collarline.

### 2. Mixed Metals
The old rule of sticking exclusively to white gold or yellow gold is gone. Combining platinum, solid yellow gold, and rose gold in a single stacked arrangement creates a modern, editorial aesthetic. When mixing metals, keep the gemstone color palette consistent to maintain visual harmony.`
  },
  {
    id: 'fallback-3',
    title: 'The Sacred Art of Kundan: A Craftsmanship Heritage',
    category: 'Craftsmanship',
    author: 'Rajiv Sen, Heritage Specialist',
    readTime: '8 min read',
    createdAt: { toMillis: () => new Date('2026-05-20').getTime() },
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=1200',
    excerpt: 'An immersive look inside our ateliers where artisans practice centuries-old methods of setting raw gemstones in pure gold.',
    content: `Kundan is one of the oldest forms of jewellery making in India, possessing a rich heritage that dates back to the royal courts of the Mughal era. Today, the art is kept alive by highly skilled craftsmen who train for decades to master the delicate balance of heat, metal, and stones.

### The Meticulous Setting Process
Kundan creation is a collaborative process between different specialized artisans:
- **Ghaat**: The initial framing where gold strips are welded into shape.
- **Paadh**: The lac filling stage that provides stability inside the frames.
- **Khudai**: Engraving patterns into the gold.
- **Minakari**: Applying vibrant enamel colors to the back or sides of the gold frames.
- **Kundan**: Setting the gemstones by pressing pure, highly refined gold foil around the edges.

Because the foil is pure, refined gold, it creates a tight, highly reflective setting that amplifies the natural fire and brilliance of the raw gemstones.`
  }
];

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedBlogs, setRelatedBlogs] = useState([]);

  useEffect(() => {
    const fetchBlogDetail = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "blogs", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setBlog({ id: docSnap.id, ...docSnap.data() });
        } else {
          // Check fallback
          const fallback = defaultBlogs.find(b => b.id === id);
          if (fallback) {
            setBlog(fallback);
          } else {
            setBlog(null);
          }
        }
      } catch (err) {
        console.error("Error fetching blog details:", err);
        const fallback = defaultBlogs.find(b => b.id === id);
        setBlog(fallback || null);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogDetail();
  }, [id]);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const q = collection(db, "blogs");
        const snap = await getDocs(q);
        let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (list.length === 0) {
          list = defaultBlogs;
        }
        setRelatedBlogs(list.filter(b => b.id !== id).slice(0, 3));
      } catch (err) {
        setRelatedBlogs(defaultBlogs.filter(b => b.id !== id).slice(0, 3));
      }
    };
    fetchRelated();
  }, [id]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'July 2026';
    const date = new Date(timestamp.toMillis ? timestamp.toMillis() : timestamp);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Article link copied to clipboard!");
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Check out this beautiful article: "${blog?.title}" at ${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center pt-28">
        <Loader2 size={36} className="animate-spin text-[#2e0e43]" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center pt-28 px-4 text-center">
        <BookOpen size={48} className="text-[#C8A97A] mb-4" />
        <h2 className="text-3xl text-[#222222] mb-4 font-normal" style={{ fontFamily: SERIF }}>Article Not Found</h2>
        <p className="text-sm text-[#7B6D63] mb-6">The article you are looking for does not exist or has been removed.</p>
        <Link to="/blog" className="px-8 py-3 bg-[#2e0e43] text-white text-xs font-bold uppercase tracking-[0.2em] rounded-full hover:bg-[#C8A97A] hover:text-[#2e0e43] transition-all">
          Back to Journal
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-sans text-[#2A2623] pt-28 pb-24">
      {/* Clean Header Breadcrumb & Controls (NO image in breadcrumb) */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E7DEC8]">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#5C5248] hover:text-[#2e0e43] transition-colors group"
          >
            <ArrowLeft size={14} className="transition-transform duration-300 group-hover:-translate-x-1" />
            <span>Back to Journal</span>
          </Link>

          <div className="hidden sm:flex items-center gap-2 text-xs text-[#6C6055] font-medium">
            <Link to="/" className="hover:text-[#2e0e43]">Home</Link>
            <span>/</span>
            <Link to="/blog" className="hover:text-[#2e0e43]">Journal</Link>
            <span>/</span>
            <span className="text-[#C8A97A] font-semibold truncate max-w-[200px] sm:max-w-[300px]">
              {blog.title}
            </span>
          </div>

          {/* Social Share Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white rounded-full border border-[#E7DEC8] text-xs font-semibold text-[#5C5248] hover:text-[#2e0e43] hover:border-[#2e0e43] transition-all cursor-pointer shadow-sm"
              title="Copy Link"
            >
              <Share2 size={13} />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white rounded-full border border-[#E7DEC8] text-xs font-semibold text-[#5C5248] hover:text-[#2e0e43] hover:border-[#2e0e43] transition-all cursor-pointer shadow-sm"
              title="Share on WhatsApp"
            >
              <MessageCircle size={13} />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split-Screen Layout (Image on One Side, Content on Another) */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">

          {/* Left Column: Sticky Featured Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 lg:sticky lg:top-28"
          >
            <div className="relative rounded-3xl border border-[#E7DEC8] overflow-hidden bg-white shadow-[0_14px_40px_rgba(0,0,0,0.06)] group">
              <div className="aspect-[16/10] max-h-[380px] sm:max-h-[420px] w-full overflow-hidden bg-[#F3ECE1]">
                <img
                  src={blog.image}
                  alt={blog.title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
              </div>

              {/* Image Footer Details */}
              <div className="p-5 bg-white border-t border-[#E7DEC8]/80 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#C8A97A]">
                  <Sparkles size={14} />
                  <span>Velouraz Editorial</span>
                </div>
                <span className="text-[14px] text-[#7B6D63] font-medium">{blog.readTime || '5 min read'}</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Editorial Article Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-7 space-y-8"
          >
            {/* Article Title Header */}
            <div className="space-y-4 border-b border-[#E7DEC8] pb-8">

              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-normal text-[#2A2623] leading-[1.15]"
                style={{ fontFamily: SERIF }}
              >
                {blog.title}
              </h1>

              {/* Meta Info Bar */}
              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-semibold text-[#5C5248] tracking-wider font-sans">
                <span className="flex items-center gap-2 text-[#C8A97A]">
                  <Calendar size={14} strokeWidth={1.5} /> {formatDate(blog.createdAt)}
                </span>
                <span className="inline-block w-1 h-1 rounded-full bg-[#C8A97A]/50" />
                <span className="flex items-center gap-2">
                  <User size={14} strokeWidth={1.5} /> {blog.author || 'Velouraz Editorial Team'}
                </span>
                <span className="inline-block w-1 h-1 rounded-full bg-[#C8A97A]/50" />
                <span className="flex items-center gap-2">
                  <Clock size={14} strokeWidth={1.5} /> {blog.readTime || '5 min read'}
                </span>
              </div>
            </div>

            {/* Excerpt Highlight Box */}
            {blog.excerpt && (
              <div className="p-6 rounded-2xl bg-[#F6F1E7] border-l-4 border-[#C8A97A] text-sm sm:text-base text-[#4E443B] font-light leading-relaxed italic">
                "{blog.excerpt}"
              </div>
            )}

            {/* Article Content */}
            <div
              className="prose prose-lg max-w-none text-base sm:text-lg text-[#3D352E] leading-relaxed space-y-6 whitespace-pre-line font-sans font-light"
            >
              {blog.content}
            </div>

            {/* Author & Share Footer Box */}
            <div className="pt-8 border-t border-[#E7DEC8] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C8A97A]">Written By</p>
                <p className="text-base font-normal text-[#2A2623]" style={{ fontFamily: SERIF }}>
                  {blog.author || 'Velouraz Editorial Team'}
                </p>
              </div>

              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#2e0e43] text-white text-xs font-bold uppercase tracking-[0.18em] rounded-full hover:bg-[#C8A97A] hover:text-[#2e0e43] transition-all cursor-pointer shadow-md"
              >
                <Share2 size={13} /> Share Story
              </button>
            </div>
          </motion.div>

        </div>

        {/* Related Stories Section */}
        {relatedBlogs.length > 0 && (
          <div className="mt-24 pt-12 border-t border-[#E7DEC8]">
            <div className="flex items-center justify-between mb-10">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C8A97A]">Explore More</span>
                <h3 className="text-2xl sm:text-3xl font-normal text-[#2A2623]" style={{ fontFamily: SERIF }}>
                  Related Journal Stories
                </h3>
              </div>
              <Link
                to="/blog"
                className="hidden sm:inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#2e0e43] hover:text-[#C8A97A] transition-colors"
              >
                View All Journal <ArrowLeft size={13} className="rotate-180" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedBlogs.map((rBlog) => (
                <div
                  key={rBlog.id}
                  className="group bg-white rounded-2xl border border-[#E7DEC8] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_rgba(46,14,67,0.08)] hover:border-[#C8A97A] transition-all duration-500 flex flex-col justify-between"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#F3ECE1]">
                    <img
                      src={rBlog.image}
                      alt={rBlog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                    <h4
                      className="text-lg font-normal text-[#2A2623] leading-snug line-clamp-2 group-hover:text-[#2e0e43] transition-colors"
                      style={{ fontFamily: SERIF }}
                    >
                      <Link to={`/blog/${rBlog.id}`}>{rBlog.title}</Link>
                    </h4>
                    <Link
                      to={`/blog/${rBlog.id}`}
                      className="inline-flex items-center gap-1.5 text-[14px] font-bold uppercase tracking-[0.18em] text-[#2e0e43] hover:text-[#C8A97A] transition-colors pt-2"
                    >
                      Read Story <ArrowLeft size={12} className="rotate-180" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogDetail;
