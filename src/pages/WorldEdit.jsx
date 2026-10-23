import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../components/Firebase';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Globe2, Sparkles, Filter, ShoppingBag, Eye, Heart } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import { useStore } from '../hooks/useStore';

const defaultCountries = [
  {
    id: 'paris',
    name: 'Paris',
    code: 'FR',
    flag: '🇫🇷',
    collection: 'THE MAISON PARIS',
    tagline: 'Parisian chic & Haute Joaillerie gold',
    description: 'Clean tennis bracelets, baroque pearl pendants, and versatile gold charms designed for daily sophisticated layering.',
    video: 'https://res.cloudinary.com/dcjn4y284/video/upload/v1788795174/paris44_tisl79.mp4',
    image: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672216/paris_vsqtxa.png',
    featuredItems: ['Tennis Bracelets', 'Baroque Pendants', 'Gold Hoops']
  },
  {
    id: 'thailand',
    name: 'Thailand',
    code: 'TH',
    flag: '🇹🇭',
    collection: 'THE THAI GEMSTONE EDIT',
    tagline: 'Vibrant sapphires & Siam high jewellery',
    description: 'Exquisite hand-selected rubies and colored sapphire jewels inspired by Southeast Asian royal ateliers.',
    video: 'https://res.cloudinary.com/dcjn4y284/video/upload/v1788795261/80622904_1788526626895108_iruogb.mp4',
    image: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672219/thiland_yz8axz.png',
    featuredItems: ['Ruby Pendants', 'Siam Drop Rings', 'Gemstone Chokers']
  },
  {
    id: 'india',
    name: 'India',
    code: 'IN',
    flag: '🇮🇳',
    collection: 'HERITAGE COLLECTION',
    tagline: 'Royal court luxury & timeless craft',
    description: 'Centuries-old technique of setting uncut gems in pure gold foils, accented by rich Meenakari enamel artwork.',
    video: 'https://res.cloudinary.com/dcjn4y284/video/upload/v1788884537/507503123_1788884097045152_tpzo3m.mp4',
    image: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672225/india_yqlodw.png',
    featuredItems: ['Raw Gemstone Chokers', 'Jadau Earrings', 'Bridal Sets']
  },
  {
    id: 'japan',
    name: 'Japan',
    code: 'JP',
    flag: '🇯🇵',
    collection: 'MIYUKI ATELIER',
    tagline: 'Precision beadwork & serene minimalist elegance',
    description: 'Delicate glass seed beads and pristine Akoya pearls woven into lightweight, modern architectural silhouettes.',
    video: 'https://res.cloudinary.com/dcjn4y284/video/upload/v1788795166/51181631_1788526616621934_a6gfv6.mp4',
    image: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672222/japan_mzkd7z.png',
    featuredItems: ['Miyuki Chokers', 'Minimal Pearl Drops', 'Silk Thread Sets']
  },
  {
    id: 'south-korea',
    name: 'South Korea',
    code: 'KR',
    flag: '🇰🇷',
    collection: 'PEARLS & SILVER',
    tagline: 'Contemporary drama & ethereal glass sheen',
    description: 'Statement ear cuffs, asymmetric drop earrings, and sleek layered chains favored by Seoul fashion directors.',
    video: 'https://res.cloudinary.com/dcjn4y284/video/upload/v1788884546/634109263_1788884070021943_pf5oas.mp4',
    image: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672225/south_korea_km1orl.png',
    featuredItems: ['Layered Chains', 'Asymmetric Drops', 'Crystal Cuffs']
  },
  {
    id: 'turkey',
    name: 'Turkey',
    code: 'TR',
    flag: '🇹🇷',
    collection: 'EVIL EYE & OXIDISED',
    tagline: 'Sacred protection & Ottoman artisanal heritage',
    description: 'Intricately handcrafted enamel, protective talismans, and dark oxidised silver inspired by ancient Mediterranean ateliers.',
    video: 'https://res.cloudinary.com/dcjn4y284/video/upload/v1788795174/paris44_tisl79.mp4',
    image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&q=80&w=1200',
    featuredItems: ['Evil Eye Amulets', 'Teardrop Earrings', 'Enamel Necklaces']
  }
];

const WorldEdit = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [countriesList, setCountriesList] = useState(defaultCountries);
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [loading, setLoading] = useState(true);

  const { addToCart, addToWishlist, isInCart, isInWishlist } = useStore();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snap = await getDocs(collection(db, "products"));
        if (!snap.empty) {
          setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch (err) {
        console.error("Error fetching products for World Edit:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Listen to world_edits_carousel Firestore collection for dynamic video uploads
  useEffect(() => {
    return onSnapshot(collection(db, "world_edits_carousel"), (snap) => {
      if (!snap.empty) {
        const firestoreMap = {};
        snap.docs.forEach(doc => {
          const data = doc.data();
          if (data.country) {
            firestoreMap[data.country.toLowerCase()] = data.video || data.videoUrl;
          }
        });

        setCountriesList(prev => prev.map(c => {
          const customVideo = firestoreMap[c.name.toLowerCase()];
          return customVideo ? { ...c, video: customVideo } : c;
        }));
      }
    });
  }, []);

  // Compute product count per country
  const countryCounts = useMemo(() => {
    const counts = {};
    countriesList.forEach(c => {
      counts[c.name] = products.filter(p => p.country && p.country.toLowerCase() === c.name.toLowerCase()).length;
    });
    return counts;
  }, [products, countriesList]);

  const filteredCountries = selectedCountry === 'All'
    ? countriesList
    : countriesList.filter(c => c.name.toLowerCase() === selectedCountry.toLowerCase());

  // Featured products matching active selected country tab
  const countryProducts = useMemo(() => {
    if (selectedCountry === 'All') return products.slice(0, 8);
    return products.filter(p => p.country && p.country.toLowerCase() === selectedCountry.toLowerCase());
  }, [products, selectedCountry]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-sans text-[#2A2623]">
      {/* Hero Header */}
      <Breadcrumb
        title="The World Edit"
        subtitle="Explore luxury jewellery collections inspired by global cultures, artisanal heritage, and world traditions."
        bgImage="https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&q=80&w=1600"
        links={[
          { name: 'Home', href: '/' },
          { name: 'World Edit', href: '/world-edit', active: true }
        ]}
      />

      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-12">

        {/* Section Intro */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="flex items-center justify-center gap-3">
            <span className="w-8 h-px bg-[#B58E58]" />
            <span className="text-xs md:text-sm tracking-[0.3em] font-bold text-[#B58E58] uppercase">
              Global Artisanal Journeys
            </span>
            <span className="w-8 h-px bg-[#B58E58]" />
          </div>
          <h2 className="font-serif font-light text-3xl md:text-5xl text-[#222222]">
            Curated by <span className="italic text-[#2e0e43]">Country & Culture</span>
          </h2>
          <p className="text-xs md:text-sm text-[#7B6D63] font-serif font-light leading-relaxed">
            Select a region below to discover handcrafted statement pieces, traditional motifs, and iconic craftsmanship from across the globe.
          </p>
        </div>

        {/* Country Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-12 border-b border-[#EFE8DC] pb-6">
          <button
            onClick={() => setSelectedCountry('All')}
            className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${selectedCountry === 'All'
              ? 'bg-[#2e0e43] text-white shadow-md'
              : 'bg-[#FFFDF9] text-[#7B6D63] border border-[#EFE8DC] hover:border-[#B58E58] hover:text-[#2e0e43]'
              }`}
          >
            🌐 All Countries ({countriesList.length})
          </button>
          {countriesList.map((country) => (
            <button
              key={country.id}
              onClick={() => setSelectedCountry(country.name)}
              className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${selectedCountry === country.name
                ? 'bg-[#2e0e43] text-white shadow-md'
                : 'bg-[#FFFDF9] text-[#7B6D63] border border-[#EFE8DC] hover:border-[#B58E58] hover:text-[#2e0e43]'
                }`}
            >
              <span>{country.flag}</span>
              <span>{country.name}</span>
              {countryCounts[country.name] > 0 && (
                <span className={`text-[14px] px-1.5 py-0.5 rounded-full ${selectedCountry === country.name ? 'bg-white/20 text-white' : 'bg-[#EFE8DC] text-[#2A2623]'
                  }`}>
                  {countryCounts[country.name]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Country Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {filteredCountries.map((c, idx) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="group bg-[#FFFDF9] rounded-3xl border border-[#EFE8DC] overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_14px_35px_rgba(0,0,0,0.08)] hover:border-[#C8A97A] transition-all duration-500 flex flex-col justify-between"
            >
              <div>
                {/* Media Cover (Auto-playing Video or Fallback Image - Same as PromoSlider) */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-900">
                  {c.video ? (
                    <video
                      src={c.video}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <img
                      src={c.image}
                      alt={c.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                    />
                  )}

                  {/* Dark Vignette Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none z-10" />

                  {/* Flag & Name Badge Overlay */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-[#1A1613]/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-white z-20">
                    <span className="text-base">{c.flag}</span>
                    <span className="text-xs font-bold uppercase tracking-widest">{c.name}</span>
                  </div>

                  {/* Dynamic Product Count */}
                  <div className="absolute top-4 right-4 bg-[#2e0e43] text-white text-[14px] uppercase font-bold tracking-widest px-3 py-1 rounded-full shadow-md z-20">
                    {countryCounts[c.name] || 0} Products
                  </div>

                  {/* Title Overlay on Image Bottom */}
                  <div className="absolute bottom-4 left-4 right-4 text-white z-20">
                    <p className="text-[#C8A97A] text-[14px] font-bold uppercase tracking-widest mb-0.5">
                      {c.collection}
                    </p>
                    <h3 className="font-serif text-2xl font-light leading-tight">
                      {c.tagline}
                    </h3>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 space-y-4">
                  <p className="text-xs text-[#7B6D63] font-sans font-light leading-relaxed">
                    {c.description}
                  </p>

                  {/* Featured Signature Elements */}
                  <div className="pt-2 border-t border-[#EFE8DC]/60">
                    <span className="text-[14px] uppercase font-bold tracking-widest text-[#B58E58] block mb-2">
                      Key Highlights
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {c.featuredItems.map((item, i) => (
                        <span key={i} className="text-[14px] font-medium bg-[#FAF7F2] border border-[#EFE8DC] text-[#2A2623] px-2.5 py-1 rounded-md">
                          ✦ {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button Footer */}
              <div className="p-6 pt-0 mt-auto">
                <button
                  onClick={() => {
                    if (c.name.toLowerCase() === 'india') {
                      navigate('/world-edit/india');
                    } else {
                      navigate(`/shop?country=${encodeURIComponent(c.name)}`);
                    }
                  }}
                  className="w-full h-12 bg-[#2A2623] text-white text-xs font-bold uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 group-hover:bg-[#2e0e43] transition-all duration-300 cursor-pointer shadow-sm"
                >
                  Explore {c.name} Collection <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Live Product Showcase Section */}
        {countryProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-[#EFE8DC]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
              <div>
                <span className="text-xs uppercase tracking-[0.25em] font-bold text-[#B58E58]">Live Catalogue</span>
                <h3 className="font-serif text-3xl text-[#222222] font-light">
                  {selectedCountry === 'All' ? 'Featured Global Pieces' : `${selectedCountry} Jewellery Highlights`}
                </h3>
              </div>

              <button
                onClick={() => navigate(`/shop${selectedCountry !== 'All' ? `?country=${encodeURIComponent(selectedCountry)}` : ''}`)}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#2e0e43] hover:text-[#2A2623] transition-colors cursor-pointer"
              >
                View All {selectedCountry !== 'All' ? selectedCountry : ''} Products in Shop <ArrowRight size={14} />
              </button>
            </div>

            {/* Showcase Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {countryProducts.slice(0, 8).map((product) => (
                <div
                  key={product.id}
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="group bg-[#FFFDF9] rounded-2xl border border-[#EFE8DC] overflow-hidden shadow-sm hover:shadow-md hover:border-[#C8A97A] transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-[#F3ECE1]">
                    <img
                      src={product.image || product.images?.[0] || 'img/jewellery/j.png'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {product.country && (
                      <span className="absolute top-2 left-2 bg-black/75 text-white text-[14px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                        {product.country}
                      </span>
                    )}
                  </div>
                  <div className="p-4 space-y-1.5">
                    <span className="text-[14px] font-semibold text-[#B58E58] uppercase tracking-wider block">
                      {product.category || 'Jewellery'}
                    </span>
                    <h4 className="font-serif text-sm font-bold text-[#2A2623] truncate group-hover:text-[#2e0e43] transition-colors">
                      {product.name}
                    </h4>
                    <p className="font-serif text-base font-light text-[#222222]">
                      ₹{Number(product.price).toLocaleString()}
                    </p>
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

export default WorldEdit;
