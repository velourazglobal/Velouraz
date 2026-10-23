import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search, Menu, X, ShoppingBag, Heart, User,
  ChevronDown, ArrowRight, Loader2, Globe2, Sparkles, Tag, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { useAuth } from './useAuth';
import { useStore } from '../hooks/useStore';
import { db } from './Firebase';
import { doc, getDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';


/* ─── Design Tokens ──────────────────────────────────── */
const GOLD = '#C8A97A';
const CRIMSON = '#2e0e43';
const NAV_SERIF = "'Cormorant Garamond', Georgia, serif";

export const DEFAULT_HEADER_WORLD_EDITS = [
  {
    id: 'paris',
    country: 'Paris',
    flag: '🇫🇷',
    subtitle: 'Inspired by Paris',
    collection: 'THE MAISON PARIS',
    cta: 'DISCOVER PARIS',
    href: '/shop?country=Paris',
    bgImage: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672216/paris_vsqtxa.png',
    order: 1
  },
  {
    id: 'thailand',
    country: 'Thailand',
    flag: '🇹🇭',
    subtitle: 'Inspired by Thailand',
    collection: 'THE THAI GEMSTONE EDIT',
    cta: 'DISCOVER THAILAND',
    href: '/shop?country=Thailand',
    bgImage: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672219/thiland_yz8axz.png',
    order: 2
  },
  {
    id: 'india',
    country: 'India',
    flag: '🇮🇳',
    subtitle: 'Inspired by India',
    collection: 'THE SIGNATURE COLLECTION',
    cta: 'DISCOVER INDIA',
    href: '/world-edit/india',
    bgImage: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672225/india_yqlodw.png',
    order: 3
  },
  {
    id: 'japan',
    country: 'Japan',
    flag: '🇯🇵',
    subtitle: 'Inspired by Japan',
    collection: 'THE MIYUKI ATELIER',
    cta: 'DISCOVER JAPAN',
    href: '/shop?country=Japan',
    bgImage: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672222/japan_mzkd7z.png',
    order: 4
  },
  {
    id: 'south-korea',
    country: 'South Korea',
    flag: '🇰🇷',
    subtitle: 'Inspired by South Korea',
    collection: 'THE PEARL EDIT',
    cta: 'DISCOVER SOUTH KOREA',
    href: '/shop?country=South%20Korea',
    bgImage: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1788798991/ChatGPT_Image_Sep_7_2026_10_04_26_PM_ogtaqk.png',
    order: 5
  },
];


const fallbackCountries = [
  "Turkey", "Japan", "India", "South Korea", "Europe",
  "China", "United Arab Emirates", "Italy", "Sri Lanka", "Brazil",
  "Thailand", "France", "Spain", "Germany", "United Kingdom"
];

const trendingTags = ['Kundan', 'Pearls', 'Bangles', 'Choker', 'Gold Plated', 'Silver', 'Rings'];

const getCountryFlag = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("turkey")) return "🇹🇷";
  if (n.includes("japan")) return "🇯🇵";
  if (n.includes("india")) return "🇮🇳";
  if (n.includes("korea")) return "🇰🇷";
  if (n.includes("europe") || n.includes("france")) return "⚜️";
  if (n.includes("china")) return "🇨🇳";
  if (n.includes("emirates") || n.includes("uae")) return "🇦🇪";
  if (n.includes("italy")) return "🇮🇹";
  if (n.includes("sri lanka")) return "🇱🇰";
  if (n.includes("brazil")) return "🇧🇷";
  if (n.includes("thailand")) return "🇹🇭";
  if (n.includes("spain")) return "🇪🇸";
  if (n.includes("germany")) return "🇩🇪";
  if (n.includes("uk") || n.includes("united kingdom")) return "🇬🇧";
  if (n.includes("us") || n.includes("united states")) return "🇺🇸";
  return "🌍";
};

const LuxuryHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([
    "✦ Express Shipping Across India ✦"
  ]);
  const [annIndex, setAnnIndex] = useState(0);
  const [dbCountries, setDbCountries] = useState([]);
  const [headerWorldEdits, setHeaderWorldEdits] = useState(DEFAULT_HEADER_WORLD_EDITS);

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const unsubAnn = onSnapshot(doc(db, "site_settings", "announcements"), (snap) => {
      if (snap.exists() && snap.data().items && snap.data().items.length > 0) {
        setAnnouncements(snap.data().items);
      } else {
        setAnnouncements(["✦ Express Shipping Across India ✦"]);
      }
    }, (err) => console.warn("Error fetching announcements:", err));

    getDocs(collection(db, "countries"))
      .then((snap) => {
        if (!snap.empty) {
          const list = snap.docs.map(d => d.data().name).filter(Boolean);
          const unique = Array.from(new Set(list));
          if (unique.length > 0) setDbCountries(unique.slice(0, 15));
        }
      })
      .catch((err) => console.error("Error fetching countries:", err));

    // Listen to real-time header_world_edits Firestore collection
    const unsubEdits = onSnapshot(collection(db, "header_world_edits"), (snap) => {
      if (!snap.empty) {
        const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        fetched.sort((a, b) => (a.order || 0) - (b.order || 0));
        setHeaderWorldEdits(fetched);
      } else {
        setHeaderWorldEdits(DEFAULT_HEADER_WORLD_EDITS);
      }
    }, (err) => console.error("Error fetching header_world_edits:", err));

    return () => unsubEdits();
  }, []);


  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
      setAnnIndex((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [announcements]);

  const dropdownCountries = useMemo(() => {
    return dbCountries.length >= 5 ? dbCountries.slice(0, 15) : fallbackCountries.slice(0, 15);
  }, [dbCountries]);

  const isTransparentRoute =
    location.pathname === '/' ||
    location.pathname === '/shop' ||
    location.pathname === '/cart' ||
    location.pathname === '/wishlist' ||
    location.pathname.startsWith('/product/');

  const [scrolled, setScrolled] = useState(!isTransparentRoute || window.scrollY > 20);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaMenu, setMegaMenu] = useState(null);
  const [mobileExpanded, setMobileExpanded] = useState(null);

  const { user } = useAuth();
  const { cartCount, wishlistCount } = useStore();

  const navLinks = [
    { name: 'New Arrivals', href: '/shop?filter=new' },
    { name: 'Best Sellers', href: '/shop?filter=bestsellers' },
    { name: 'World Edit', href: '/world-edit', hasDropdown: true },
    { name: 'Gallery', href: '/gallery' },
    { name: 'Blogs', href: '/blog' },
    { name: 'Our Story', href: '/about' },
    { name: 'Contact Us', href: '/contact' },
  ];

  useEffect(() => {
    if (!isTransparentRoute) {
      setScrolled(true);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [isTransparentRoute]);

  useEffect(() => {
    document.body.style.overflow = (mobileOpen || isSearchOpen) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen, isSearchOpen]);

  const headerBg = scrolled ? 'rgba(255, 255, 255, 0.96)' : 'transparent';
  const headerBorder = scrolled ? 'rgba(0,0,0,0.06)' : 'transparent';
  const textColor = scrolled ? '#2A2623' : '#ffffff';

  return (
    <>
      {/* Announcement Bar */}
      <div
        className="relative z-[60] text-center py-1.5 px-4 h-[34px] overflow-hidden flex items-center justify-center shadow-xs"
        style={{ background: CRIMSON, position: 'fixed', top: 0, left: 0, right: 0 }}
      >
        <AnimatePresence mode="wait">
          <motion.p
            key={annIndex}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="text-[14px] sm:text-[14px] tracking-[0.16em] font-medium text-white/90 truncate uppercase"
          >
            {announcements[annIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Main Header Container */}
      <header
        ref={(el) => {
          if (el) {
            document.documentElement.style.setProperty(
              '--header-height',
              el.getBoundingClientRect().bottom + 'px'
            );
          }
        }}
        className="w-full fixed z-50 transition-all duration-300 backdrop-blur-md"
        style={{
          top: 0,
          paddingTop: 34,
          background: headerBg,
          borderBottom: `1px solid ${headerBorder}`,
          boxShadow: scrolled ? '0 4px 25px rgba(0,0,0,0.06)' : 'none'
        }}
      >
        {/* Compact Header Top Bar */}
        <div
          className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between"
          style={{ height: scrolled ? '60px' : '72px', transition: 'height 0.3s ease' }}
        >
          {/* Left: Mobile Menu & Icon-only Search */}
          <div className="flex items-center gap-1 sm:gap-3 flex-1">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 sm:p-2 rounded-full hover:bg-black/5 transition-all"
              style={{ color: textColor }}
              aria-label="Menu"
            >
              <Menu className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px]" />
            </button>

            {/* Search Icon Only (Desktop & Mobile) */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-1.5 sm:p-2.5 rounded-full hover:bg-black/5 hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer group"
              style={{ color: textColor }}
              title="Search Products"
              aria-label="Search"
            >
              <Search className="w-[17px] h-[17px] sm:w-[21px] sm:h-[21px] group-hover:text-[#2e0e43] transition-colors" />
            </button>
          </div>

          {/* Center: Larger Prominent Luxury Logo */}
          <div className="flex-1 flex justify-center items-center py-1">
            <Link to="/" className="relative group inline-flex items-center justify-center transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]">
              <img
                src="/img/logo.png"
                alt="Velouraz"
                className="transition-all duration-300 object-contain drop-shadow-[0_2px_14px_rgba(0,0,0,0.08)]"
                style={{
                  height: scrolled ? '46px' : '58px',
                  maxHeight: '68px'
                }}
              />
            </Link>
          </div>

          {/* Right: Icons (Wishlist, Account, Cart) */}
          <div className="flex items-center justify-end gap-0.5 sm:gap-2 flex-1">
            <Link
              to="/wishlist"
              className="relative p-1.5 sm:p-2.5 rounded-full hover:bg-black/5 hover:scale-105 active:scale-95 transition-all"
              style={{ color: textColor }}
              title="Wishlist"
            >
              <Heart className="w-[17px] h-[17px] sm:w-[20px] sm:h-[20px]" />
              {wishlistCount > 0 && <BadgeDot count={wishlistCount} />}
            </Link>

            <Link
              to={user ? '/account' : '/login'}
              className="p-1.5 sm:p-2.5 rounded-full hover:bg-black/5 hover:scale-105 active:scale-95 transition-all"
              style={{ color: textColor }}
              title={user ? "My Account" : "Sign In"}
            >
              <User className="w-[17px] h-[17px] sm:w-[20px] sm:h-[20px]" />
            </Link>

            <Link
              to="/cart"
              className="relative p-1.5 sm:p-2.5 rounded-full hover:bg-black/5 hover:scale-105 active:scale-95 transition-all"
              style={{ color: textColor }}
              title="Shopping Bag"
            >
              <ShoppingBag className="w-[17px] h-[17px] sm:w-[20px] sm:h-[20px]" />
              {cartCount > 0 && <BadgeDot count={cartCount} />}
            </Link>
          </div>
        </div>

        {/* Navigation Links Bar */}
        <nav className="hidden lg:block" style={{ borderTop: `1px solid ${scrolled ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)'}` }}>
          <div className="max-w-[1440px] mx-auto flex justify-center gap-1">
            {navLinks.map((link) => (
              <div key={link.name} className="relative" onMouseEnter={() => setMegaMenu(link.name)} onMouseLeave={() => setMegaMenu(null)}>
                <Link
                  to={link.href}
                  className="flex items-center gap-1.5 px-5 py-2.5 text-[14px] tracking-[0.18em] font-bold uppercase transition-colors"
                  style={{ color: scrolled ? '#2A2623' : 'rgba(255,255,255,0.95)' }}
                >
                  {link.name} {link.hasDropdown && <ChevronDown size={12} style={{ transform: megaMenu === link.name ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />}
                  <span
                    className="absolute bottom-0 left-4 right-4 h-[2px] transition-all duration-300"
                    style={{ background: GOLD, transform: megaMenu === link.name ? 'scaleX(1)' : 'scaleX(0)' }}
                  />
                </Link>
              </div>
            ))}
          </div>
        </nav>
      </header>

      {/* Interactive Search Overlay Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <SearchOverlayModal onClose={() => setIsSearchOpen(false)} />
        )}
      </AnimatePresence>

      {/* World Edit Mega Menu */}
      <AnimatePresence>
        {megaMenu && navLinks.find(l => l.name === megaMenu)?.hasDropdown && (
          <div onMouseEnter={() => setMegaMenu(megaMenu)} onMouseLeave={() => setMegaMenu(null)}>
            <WorldEditDropdownPanel items={headerWorldEdits} onClose={() => setMegaMenu(null)} />
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed left-0 top-0 bottom-0 z-[100] w-[88vw] max-w-sm flex flex-col bg-[#0E0B09] shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#C8A97A]/20">
                <img src="/img/logo.png" alt="Velouraz" className="h-12 object-contain drop-shadow-xs" />
                <button onClick={() => setMobileOpen(false)} className="p-2 text-white/60 hover:text-white rounded-full"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {navLinks.map((link) => (
                  <div key={link.name} className="border-b border-[#C8A97A]/10">
                    <div className="flex justify-between items-center py-4 cursor-pointer" onClick={() => { if (link.hasDropdown) setMobileExpanded(mobileExpanded === link.name ? null : link.name); else { setMobileOpen(false); navigate(link.href); } }}>
                      <Link to={link.href} onClick={() => setMobileOpen(false)} className="text-xl text-white font-light" style={{ fontFamily: NAV_SERIF }}>{link.name}</Link>
                      {link.hasDropdown && <ChevronDown size={18} style={{ color: GOLD, transform: mobileExpanded === link.name ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />}
                    </div>
                    {link.hasDropdown && mobileExpanded === link.name && (
                      <div className="mb-5 rounded-2xl p-4 bg-[#140D1C] border border-[#C8A97A]/25 space-y-3.5 shadow-lg">
                        <div className="flex items-center justify-between border-b border-[#C8A97A]/20 pb-2.5">
                          <span className="text-[14px] uppercase font-bold tracking-[0.2em] text-[#C8A97A]">Featured World Edits</span>
                          <Link to="/world-edit" onClick={() => setMobileOpen(false)} className="text-[14px] font-bold uppercase tracking-wider text-[#F0D5A8] hover:text-white flex items-center gap-1">
                            View All <ArrowRight size={10} />
                          </Link>
                        </div>

                        <div className="flex flex-col gap-2">
                          {headerWorldEdits.map((item, idx) => {
                            const flag = item.flag || getCountryFlag(item.country);
                            return (
                              <Link
                                key={item.id || `${item.country}-${idx}`}
                                to={item.href || item.link || '/world-edit'}
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#C8A97A]/40 hover:bg-[#C8A97A]/10 transition-all group text-decoration-none"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-lg filter drop-shadow-xs">{flag}</span>
                                  <div>
                                    <p className="text-sm font-medium text-white group-hover:text-[#F0D5A8] transition-colors leading-tight" style={{ fontFamily: NAV_SERIF }}>
                                      {item.country}
                                    </p>
                                    {item.subtitle && (
                                      <p className="text-[14px] italic text-white/60 mt-0.5" style={{ fontFamily: NAV_SERIF }}>{item.subtitle}</p>
                                    )}
                                  </div>
                                </div>
                                <ArrowRight size={12} className="text-[#C8A97A] group-hover:translate-x-1 transition-transform shrink-0" />
                              </Link>
                            );
                          })}
                        </div>


                        <div className="pt-2 border-t border-[#C8A97A]/20 text-center">
                          <Link
                            to="/world-edit"
                            onClick={() => setMobileOpen(false)}
                            className="inline-flex items-center gap-1.5 text-[14px] font-bold uppercase tracking-[0.2em] text-[#C8A97A] hover:text-white transition-colors py-1 text-decoration-none"
                          >
                            <span>Explore All Countries</span>
                            <ArrowRight size={12} />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const BadgeDot = ({ count }) => (
  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[14px] font-bold text-white bg-[#2e0e43] border border-white">
    {count}
  </span>
);

/* ─── Interactive Search Overlay Modal ────────────────────── */
const SearchOverlayModal = ({ onClose }) => {
  const [queryStr, setQueryStr] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();

    // Keydown listener for ESC key to dismiss search modal
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Fetch initial products for search lookup
    setLoading(true);
    getDocs(collection(db, "products"))
      .then((snap) => {
        if (!snap.empty) {
          setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      })
      .catch((err) => console.error("Search fetch error:", err))
      .finally(() => setLoading(false));

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const searchResults = useMemo(() => {
    if (!queryStr.trim()) return [];
    const q = queryStr.toLowerCase().trim();
    return products.filter(p => {
      const nameMatch = p.name?.toLowerCase().includes(q);
      const catMatch = p.category?.toLowerCase().includes(q);
      const matMatch = p.material?.toLowerCase().includes(q);
      const countryMatch = p.country?.toLowerCase().includes(q) || p.origin?.toLowerCase().includes(q);
      const tagMatch = Array.isArray(p.tags) && p.tags.some(t => String(t).toLowerCase().includes(q));
      return nameMatch || catMatch || matMatch || countryMatch || tagMatch;
    }).slice(0, 8);
  }, [queryStr, products]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (queryStr.trim()) {
      navigate(`/shop?search=${encodeURIComponent(queryStr.trim())}`);
      onClose();
    }
  };

  const handleTagClick = (tag) => {
    const cleanTag = tag.replace(/[^a-zA-Z0-9 ]/g, '').trim();
    setQueryStr(cleanTag);
    navigate(`/shop?search=${encodeURIComponent(cleanTag)}`);
    onClose();
  };

  const handleCountryClick = (country) => {
    if (country && country.toLowerCase() === 'india') {
      navigate('/world-edit/india');
    } else {
      setQueryStr(country);
      navigate(`/shop?country=${encodeURIComponent(country)}`);
    }
    onClose();
  };

  const luxuryTrendingChips = [
    { label: "💎 Kundan Chokers", query: "Kundan" },
    { label: "✨ Diamond Rings", query: "Rings" },
    { label: "👑 Royal Bangles", query: "Bangles" },
    { label: "🌊 Pearl Edit", query: "Pearls" },
    { label: "🥇 Gold Plated", query: "Gold Plated" },
    { label: "💍 Solitaires", query: "Solitaire font" },
  ];

  const countrySuggestions = [
    { name: "India", flag: "🇮🇳" },
    { name: "Japan", flag: "🇯🇵" },
    { name: "Turkey", flag: "🇹🇷" },
    { name: "South Korea", flag: "🇰🇷" },
    { name: "France", flag: "🇫🇷" },
    { name: "Thailand", flag: "🇹🇭" },
    { name: "United Arab Emirates", flag: "🇦🇪" },
    { name: "Italy", flag: "🇮🇹" },
    { name: "United Kingdom", flag: "🇬🇧" },
    { name: "Spain", flag: "🇪🇸" },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-start">
      {/* Dark Obsidian Glass Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-[#0B0711]/90 backdrop-blur-2xl"
      />

      {/* Main Search Panel */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="relative z-10 w-full bg-gradient-to-b from-[#14061F] via-[#100419] to-[#0B0212] border-b border-[#C8A46A]/30 text-[#F3ECE1] shadow-[0_30px_90px_rgba(0,0,0,0.9)] overflow-hidden"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">

          {/* Top Utility Header */}
          <div className="flex items-center justify-between border-b border-[#3A1B54]/60 pb-2.5 sm:pb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-[#C8A46A] animate-pulse" />
              <span className="text-xs sm:text-sm font-sans font-bold uppercase tracking-[0.2em] sm:tracking-[0.22em] text-[#C8A46A]">
                Velouraz Search
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-block text-xs font-mono uppercase tracking-wider text-[#C5B39A]/60 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                Press ESC to exit
              </span>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 border border-[#C8A46A]/30 hover:border-[#C8A46A] hover:bg-[#C8A46A] hover:text-[#14061F] transition-all flex items-center justify-center text-[#E5C794] shadow-xs cursor-pointer"
                aria-label="Close search"
              >
                <X size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>
          </div>

          {/* Luxury Input Form */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center group">
            <Search className="absolute left-3.5 sm:left-5 w-4 h-4 sm:w-6 sm:h-6 text-[#C8A46A] group-focus-within:text-[#E5C794] transition-colors" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search by collection, country, gemstone, metal, or style..."
              value={queryStr}
              onChange={(e) => setQueryStr(e.target.value)}
              className="w-full pl-10 sm:pl-14 pr-10 sm:pr-14 py-3 sm:py-5 bg-white/[0.05] border border-[#C8A46A]/40 rounded-xl sm:rounded-2xl text-sm sm:text-xl font-serif text-white placeholder:text-[#C5B39A]/50 outline-none focus:border-[#E5C794] focus:bg-white/[0.08] focus:ring-2 focus:ring-[#C8A46A]/30 transition-all font-light shadow-inner"
            />
            {queryStr && (
              <button
                type="button"
                onClick={() => setQueryStr('')}
                className="absolute right-3 sm:right-4 p-1.5 text-[#C5B39A] hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            )}
          </form>

          {/* Curated Trending Chips & Country Collections */}
          <div className="space-y-3">

            {/* World Edit Country Suggestions */}
            <div className="space-y-1.5">
              <span className="text-xs sm:text-sm font-sans font-bold uppercase tracking-[0.18em] sm:tracking-[0.2em] text-[#C8A46A] flex items-center gap-1.5">
                <Globe2 size={13} className="text-[#C8A46A]" /> Explore Country Collections (World Edit):
              </span>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
                {countrySuggestions.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => handleCountryClick(c.name)}
                    className="shrink-0 px-3 py-1 sm:px-3.5 sm:py-1.5 bg-[#2e0e43]/40 hover:bg-[#C8A46A] hover:text-[#14061F] border border-[#C8A46A]/40 rounded-full text-xs sm:text-sm font-sans font-medium text-[#F0D5A8] transition-all duration-300 cursor-pointer shadow-xs flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <span>{c.flag}</span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Product Searches */}
            <div className="space-y-1.5">
              <span className="text-xs sm:text-sm font-sans font-bold uppercase tracking-[0.18em] sm:tracking-[0.2em] text-[#C5B39A]/80 block">
                Popular Styles:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
                {luxuryTrendingChips.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => handleTagClick(chip.query)}
                    className="shrink-0 px-3 py-1 sm:px-3.5 sm:py-1.5 bg-white/5 hover:bg-[#C8A46A] hover:text-[#14061F] border border-[#C8A46A]/20 rounded-full text-xs sm:text-sm font-sans font-medium text-[#E5C794] transition-all duration-300 cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Live Search Results Preview */}
          {queryStr.trim() !== '' && (
            <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-[#3A1B54]/70 max-h-[60vh] sm:max-h-[55vh] overflow-y-auto pr-1">

              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-sans font-bold uppercase tracking-[0.18em] sm:tracking-[0.2em] text-[#E5C794]">
                  Matching Creations ({searchResults.length})
                </span>
                <button
                  onClick={handleSearchSubmit}
                  className="text-xs sm:text-sm font-bold text-[#E5C794] hover:text-white transition-colors flex items-center gap-1 sm:gap-1.5 cursor-pointer font-sans"
                >
                  <span>View All in Boutique</span>
                  <ArrowRight size={13} className="sm:w-3.5 sm:h-3.5" />
                </button>
              </div>

              {loading ? (
                <div className="py-8 text-center text-[#C5B39A] flex items-center justify-center gap-2 font-serif text-sm sm:text-base">
                  <Loader2 className="animate-spin text-[#C8A46A]" size={20} />
                  <span>Searching catalogue...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                  {searchResults.map((item) => (
                    <Link
                      key={item.id}
                      to={`/product/${item.id}`}
                      onClick={onClose}
                      className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/[0.04] border border-[#C8A46A]/20 hover:border-[#C8A46A] hover:bg-white/[0.08] transition-all duration-300 flex items-center gap-3 group"
                    >
                      <div className="w-14 h-16 sm:w-16 sm:h-18 rounded-lg sm:rounded-xl overflow-hidden bg-[#1A0829] border border-[#C8A46A]/30 shrink-0">
                        <img
                          src={item.image || '/img/jewellery/j.png'}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      <div className="overflow-hidden space-y-1 min-w-0">
                        <span className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-[#C8A46A] block truncate">
                          {item.category || "Velouraz"}
                        </span>
                        <h4 className="text-sm font-serif text-white group-hover:text-[#E5C794] transition-colors truncate font-medium">
                          {item.name}
                        </h4>
                        <p className="text-sm font-sans font-bold text-[#E5C794]">
                          ₹{Number(item.price || 0).toLocaleString()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center bg-white/[0.03] border border-[#3A1B54] rounded-2xl space-y-2">
                  <p className="text-base text-[#C5B39A] font-serif">
                    No direct creation matches found for "{queryStr}"
                  </p>
                  <button
                    onClick={handleSearchSubmit}
                    className="text-sm font-bold text-[#E5C794] hover:underline uppercase tracking-wider font-sans cursor-pointer"
                  >
                    Search Full Catalogue in Boutique →
                  </button>
                </div>
              )}

            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
};

const WorldEditDropdownCard = ({ item, onClose }) => {
  const bgImg = item.bgImage || item.image || '';
  const flag = item.flag || getCountryFlag(item.country);
  return (
    <Link
      to={item.href || item.link || '/world-edit'}
      onClick={onClose}
      className="group relative p-7 flex flex-col justify-between overflow-hidden text-decoration-none min-h-[480px] h-full w-full block"
    >
      <div className="absolute inset-0 z-0 overflow-hidden bg-zinc-950">
        {bgImg && (
          <img
            src={bgImg}
            alt={item.country}
            className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
      </div>

      <div className="relative z-10 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xl filter drop-shadow-md">{flag}</span>
          {item.comingSoon && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#C8A97A] text-[#14061F] shadow-sm">
              ✦ Coming Soon
            </span>
          )}
        </div>

        <div>
          <h3
            className="text-3xl lg:text-4xl text-white font-normal tracking-tight group-hover:text-[#F0D5A8] transition-colors drop-shadow-md"
            style={{ fontFamily: NAV_SERIF }}
          >
            {item.country}
          </h3>
          {item.subtitle && (
            <p className="text-xs lg:text-sm italic text-white/90 font-light mt-0.5 drop-shadow" style={{ fontFamily: NAV_SERIF }}>
              {item.subtitle}
            </p>
          )}
        </div>

        <div className="w-8 group-hover:w-16 h-[1px] bg-[#C8A97A] transition-all duration-300 my-3.5 shadow-sm" />

        {item.collection && (
          <div className="text-[14px] lg:text-[14px] font-bold tracking-[0.22em] uppercase text-[#F0D5A8] leading-tight drop-shadow">
            {item.collection}
          </div>
        )}
      </div>

      <div className="relative z-10 pt-4 flex items-center justify-between text-[14px] font-bold tracking-[0.22em] uppercase text-white group-hover:text-[#F0D5A8] transition-colors drop-shadow-md">
        <span>{item.comingSoon ? 'PREVIEW COLLECTION' : (item.cta || `DISCOVER ${item.country.toUpperCase()}`)}</span>
        <ArrowRight size={14} className="text-[#C8A97A] group-hover:translate-x-2 transition-transform duration-300" />
      </div>
    </Link>
  );
};

const WorldEditDropdownPanel = ({ items = [], onClose }) => {
  const displayItems = items && items.length > 0 ? items : DEFAULT_HEADER_WORLD_EDITS;
  const [prevEl, setPrevEl] = useState(null);
  const [nextEl, setNextEl] = useState(null);
  const isSliderNeeded = displayItems.length > 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="fixed left-0 right-0 z-[200] bg-[#0A070D] border-t border-[#C8A97A] border-b border-[#C8A97A]/20 shadow-[0_35px_90px_rgba(0,0,0,0.95)] overflow-hidden"
      style={{ top: 'var(--header-height, 148px)' }}
    >
      {/* Top Banner Bar */}
      <div className="border-b border-[#C8A97A]/20 bg-[#0F0B14] px-8 py-2.5 flex items-center justify-between z-20 relative">
        <div className="flex items-center gap-2 text-[14px] tracking-[0.25em] font-semibold text-[#C8A97A] uppercase">
          <Globe2 size={13} className="text-[#C8A97A]" />
          <span>The World Edit • Globally Curated Jewellery Collections</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Swiper Slider Arrows when > 5 options */}
          {isSliderNeeded && (
            <div className="flex items-center gap-2 border-r border-[#C8A97A]/30 pr-4">
              <span className="text-[12px] font-mono tracking-widest text-[#C8A97A]/80 uppercase hidden sm:inline-block mr-1">
                Slide Options:
              </span>
              <button
                onClick={() => prevEl && prevEl.click()}
                className="w-8 h-8 rounded-full bg-[#1A1024] border border-[#C8A97A]/50 text-[#F0D5A8] hover:bg-[#C8A97A] hover:text-[#0A070D] transition-all flex items-center justify-center cursor-pointer shadow-sm active:scale-95"
                aria-label="Previous options"
                title="Previous Slide"
              >
                <ChevronLeft size={16} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => nextEl && nextEl.click()}
                className="w-8 h-8 rounded-full bg-[#1A1024] border border-[#C8A97A]/50 text-[#F0D5A8] hover:bg-[#C8A97A] hover:text-[#0A070D] transition-all flex items-center justify-center cursor-pointer shadow-sm active:scale-95"
                aria-label="Next options"
                title="Next Slide"
              >
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          )}

          <Link
            to="/world-edit"
            onClick={onClose}
            className="flex items-center gap-1.5 text-[14px] font-bold tracking-[0.2em] uppercase text-[#F0D5A8] hover:text-white transition-colors"
          >
            <span>Explore All Countries</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Dynamic Swiper Carousel or Grid */}
      <div className="relative w-full max-w-[1600px] mx-auto min-h-[480px] group">
        {/* Floating Side Navigation Buttons for Swiper (Clear & Prominent) */}
        {isSliderNeeded && (
          <>
            <button
              ref={(node) => setPrevEl(node)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full bg-[#0A070D]/90 backdrop-blur-md border-2 border-[#C8A97A] text-[#F0D5A8] hover:bg-[#C8A97A] hover:text-[#0A070D] hover:scale-110 active:scale-95 shadow-[0_0_25px_rgba(200,169,122,0.5)] transition-all duration-300 flex items-center justify-center cursor-pointer disabled:opacity-20 disabled:pointer-events-none"
              aria-label="Previous options"
              title="Previous Countries"
            >
              <ChevronLeft size={24} strokeWidth={2.5} />
            </button>
            <button
              ref={(node) => setNextEl(node)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full bg-[#0A070D]/90 backdrop-blur-md border-2 border-[#C8A97A] text-[#F0D5A8] hover:bg-[#C8A97A] hover:text-[#0A070D] hover:scale-110 active:scale-95 shadow-[0_0_25px_rgba(200,169,122,0.5)] transition-all duration-300 flex items-center justify-center cursor-pointer disabled:opacity-20 disabled:pointer-events-none"
              aria-label="Next options"
              title="Next Countries"
            >
              <ChevronRight size={24} strokeWidth={2.5} />
            </button>
          </>
        )}

        {!isSliderNeeded ? (
          <div
            className="grid divide-x divide-[#C8A97A]/20 min-h-[480px]"
            style={{ gridTemplateColumns: `repeat(${displayItems.length}, minmax(0, 1fr))` }}
          >
            {displayItems.map((item, index) => (
              <WorldEditDropdownCard key={item.id || index} item={item} onClose={onClose} />
            ))}
          </div>
        ) : (
          <Swiper
            modules={[Navigation, Autoplay]}
            spaceBetween={0}
            slidesPerView={5}
            navigation={{
              prevEl,
              nextEl,
            }}
            className="w-full h-full divide-x divide-[#C8A97A]/20"
          >
            {displayItems.map((item, index) => (
              <SwiperSlide key={item.id || index} className="h-full border-r border-[#C8A97A]/20">
                <WorldEditDropdownCard item={item} onClose={onClose} />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </motion.div>
  );
};

export default LuxuryHeader;



