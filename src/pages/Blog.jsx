import React, { useState, useEffect } from 'react';
import { db } from '../components/Firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Search, Calendar, Clock, ArrowRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Breadcrumb from '../components/Breadcrumb';
import useSEO from '../hooks/useSEO';

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
    excerpt: 'Preserve the luster of your conflict-free diamonds and 18k solid gold base with our step-by-step master guide for home preservation.'
  },
  {
    id: 'fallback-2',
    title: 'Autumn/Winter 2026 High Jewellery Styling Trends',
    category: 'Trends',
    author: 'Aria Dev, Styling Director',
    readTime: '4 min read',
    createdAt: { toMillis: () => new Date('2026-07-02').getTime() },
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200',
    excerpt: 'From stacked crystal cuffs to statement emerald chokers, explore how leading tastemakers are layering jewellery this season.'
  },
  {
    id: 'fallback-3',
    title: 'The Sacred Art of Kundan: A Craftsmanship Heritage',
    category: 'Craftsmanship',
    author: 'Rajiv Sen, Heritage Specialist',
    readTime: '8 min read',
    createdAt: { toMillis: () => new Date('2026-05-20').getTime() },
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=1200',
    excerpt: 'An immersive look inside our ateliers where artisans practice centuries-old methods of setting raw gemstones in pure gold.'
  }
];

const Blog = () => {
  useSEO({
    title: 'The Journal - Jewellery Stories, Trends and Styling',
    description: 'Read the Velouraz journal for inspiring stories about jewellery heritage, global craft traditions, styling guides and the latest trends in contemporary jewellery.',
    keywords: 'velouraz journal, jewellery blog india, jewellery care guide, bridal jewellery trends, kundan craftsmanship, jewellery styling tips',
    canonical: '/blog',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Blog",
      "name": "The Velouraz Journal",
      "url": "https://www.velouraz.in/blog",
      "description": "Artisanal stories, high jewellery heritage, global inspirations and exclusive styling perspectives.",
      "publisher": {
        "@type": "Organization",
        "name": "Velouraz",
        "logo": { "@type": "ImageObject", "url": "https://www.velouraz.in/img/logo.png" }
      }
    }
  });

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const q = query(collection(db, "blogs"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setBlogs(list);
        } else {
          setBlogs(defaultBlogs);
        }
      } catch (err) {
        console.error("Error fetching blogs:", err);
        setBlogs(defaultBlogs);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const filteredBlogs = blogs.filter(blog => {
    const term = searchTerm.toLowerCase();
    return blog.title?.toLowerCase().includes(term) ||
      blog.excerpt?.toLowerCase().includes(term) ||
      blog.category?.toLowerCase().includes(term);
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return 'July 2026';
    const date = new Date(timestamp.toMillis ? timestamp.toMillis() : timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-sans text-[#2A2623]">
      {/* Premium Breadcrumb Hero */}
      <Breadcrumb
        title="The Journal"
        subtitle="Artisanal stories, high jewellery heritage, global inspirations, and exclusive styling perspectives."
        bgImage="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=1600"
        links={[
          { name: 'Home', href: '/' },
          { name: 'Journal', href: '/blog', active: true }
        ]}
      />

      {/* Search Bar - Left Aligned */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 my-8 md:my-10">
        <div className="flex items-center justify-start border-b border-[#E7DEC8] pb-6">
          <div className="relative w-full sm:w-80 md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C8A97A]" size={16} />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[#E7DEC8] rounded-full pl-11 pr-4 py-2.5 text-xs md:text-sm text-[#2A2623] outline-none focus:border-[#2e0e43] focus:ring-1 focus:ring-[#2e0e43] transition-all placeholder:text-[#5C5248]/50 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* 3-In-A-Row Equal-Size Cards Grid */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pb-24">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl border border-[#E7DEC8] p-4">
                <div className="aspect-[16/10] bg-[#F3ECE1] rounded-xl mb-4" />
                <div className="h-5 bg-[#F3ECE1] rounded w-3/4 mb-3" />
                <div className="h-3 bg-[#F3ECE1] rounded w-full mb-2" />
                <div className="h-3 bg-[#F3ECE1] rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredBlogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {filteredBlogs.map((blog, idx) => (
              <motion.article
                key={blog.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (idx % 3) * 0.08 }}
                className="group bg-white rounded-2xl border border-[#E7DEC8] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_rgba(46,14,67,0.08)] hover:border-[#C8A97A] transition-all duration-500 flex flex-col h-full"
              >
                {/* Card Image */}
                <div className="relative aspect-[16/12] w-full overflow-hidden bg-[#F3ECE1]">
                  <img
                    src={blog.image}
                    alt={blog.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-40 group-hover:opacity-20 transition-opacity" />
                </div>

                {/* Card Body */}
                <div className="p-6 md:p-7 flex flex-col justify-between flex-1 space-y-4">
                  <div className="space-y-3">
                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-[14px] font-semibold text-[#C8A97A] tracking-wider uppercase font-sans">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} strokeWidth={1.5} /> {formatDate(blog.createdAt)}
                      </span>
                      <span className="inline-block w-1 h-1 rounded-full bg-[#C8A97A]/50" />
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} strokeWidth={1.5} /> {blog.readTime || '5 min read'}
                      </span>
                    </div>

                    {/* Article Title */}
                    <h2
                      className="text-xl lg:text-2xl font-normal text-[#2A2623] leading-snug group-hover:text-[#2e0e43] transition-colors line-clamp-2"
                      style={{ fontFamily: SERIF }}
                    >
                      <Link to={`/blog/${blog.id}`}>{blog.title}</Link>
                    </h2>

                    {/* Excerpt */}
                    <p className="text-xs md:text-sm text-[#6C6055] font-sans font-light leading-relaxed line-clamp-3">
                      {blog.excerpt}
                    </p>
                  </div>

                  {/* Footer Info */}
                  <div className="pt-4 border-t border-[#E7DEC8]/60 flex items-center justify-between mt-auto">
                    <span className="text-[14px] font-semibold text-[#5C5248] tracking-wide">
                      {blog.author || 'Velouraz Editorial'}
                    </span>
                    <Link
                      to={`/blog/${blog.id}`}
                      className="inline-flex items-center gap-2 text-[14px] font-bold uppercase tracking-[0.2em] text-[#2e0e43] hover:text-[#C8A97A] transition-colors group/link"
                    >
                      <span>Read Story</span>
                      <ArrowRight size={13} className="transition-transform duration-300 group-hover/link:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#E7DEC8] p-8 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
            <BookOpen size={38} className="mx-auto text-[#C8A97A] mb-3" />
            <h3 className="text-2xl text-[#2A2623] mb-2 font-normal" style={{ fontFamily: SERIF }}>No journal entries found</h3>
            <p className="text-xs md:text-sm text-[#6C6055] max-w-md mx-auto mb-6">Try broadening your search term.</p>
            <button
              onClick={() => setSearchTerm('')}
              className="px-8 py-3 bg-[#2e0e43] text-white text-xs font-bold uppercase tracking-[0.2em] rounded-full hover:bg-[#C8A97A] hover:text-[#2e0e43] transition-all cursor-pointer shadow-md"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
