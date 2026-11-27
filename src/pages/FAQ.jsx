import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Search, HelpCircle, ShieldCheck, Truck, RefreshCw, MessageSquare, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import useSEO from '../hooks/useSEO';

const FAQ_CATEGORIES = [
  'All Questions',
  'Brand & Craftsmanship',
  'Orders & Delivery',
  'Returns & Exchanges',
  'Payments & Security',
  'Jewellery Care'
];

const ALL_FAQS = [
  {
    category: 'Brand & Craftsmanship',
    question: "Who are the founders behind Velouraz, and what is the brand's story?",
    answer: "Velouraz was born from a friendship transformed into a global journey. Best friends and founders, Zahabiya Kalabhai and Alifiya Bohra, found inspiration during their international travels. Their desire to bring the world's most captivating jewellery traditions into one cohesive collection led to the creation of Velouraz — a brand where the world becomes jewellery, and jewellery becomes part of your story."
  },
  {
    category: 'Brand & Craftsmanship',
    question: "What makes Velouraz jewellery globally curated?",
    answer: "Our collections draw inspiration from cultural hubs across the globe. From the delicate artistry of Japanese Miyuki beads and luminous South Korean pearls to the ancient symbolism of Turkish stones, Australian opals, Chinese jade, Parisian elegance, and the rich Kundan and Polki heritage of India, we bridge global destinations with contemporary style."
  },
  {
    category: 'Brand & Craftsmanship',
    question: "Is Velouraz jewellery made of real silver and precious materials?",
    answer: "Yes, we uphold 'The Velouraz Standard'. Our premium selections include fine 925 Sterling Silver pieces containing 92.5% pure silver. We also utilize high-grade anti-tarnish alloys, 18K/22K micron gold plating, and hand-selected semi-precious stones designed for enduring beauty and everyday wear."
  },
  {
    category: 'Brand & Craftsmanship',
    question: "What types of jewellery can I buy from the Velouraz online shop?",
    answer: "We offer a wide variety of fine jewellery including statement Earrings, Rings, Necklaces, Bracelets, Bangles, and exclusive Bridal Wear. Each piece is designed for the modern woman who seeks luxury that is felt rather than flaunted."
  },
  {
    category: 'Orders & Delivery',
    question: "How long does shipping take and how can I track my order?",
    answer: "All orders are dispatched via premier express couriers (such as Shiprocket, Bluedart, Delhivery, Xpressbees). Delivery typically takes 2 to 5 business days depending on your delivery pincode. As soon as your order is dispatched, you receive a real-time tracking link and AWB number via SMS, WhatsApp, and email. You can also track your shipment anytime on our 'Track Orders' page."
  },
  {
    category: 'Orders & Delivery',
    question: "Do you offer free shipping across India?",
    answer: "Yes, we offer complimentary express insured shipping on all orders of ₹1,999 and above. For orders below ₹1,999, a nominal insured express delivery charge of ₹99 is applied at checkout."
  },
  {
    category: 'Returns & Exchanges',
    question: "What is your return and exchange policy for online orders?",
    answer: "We offer a hassle-free 7-day return and exchange policy for unworn items in their original packaging. Because we deal in premium jewellery, we require customers to record a continuous unboxing video upon receiving their package to help us process any defect or transit damage claims swiftly and transparently."
  },
  {
    category: 'Returns & Exchanges',
    question: "Why is an unboxing video mandatory for returns?",
    answer: "Because high-value handcrafted jewellery is susceptible to damage or tampering during transit, a continuous unboxing video (starting with the sealed courier bag and showing all sides before opening) guarantees swift verification and immediate replacement or refund without dispute."
  },
  {
    category: 'Payments & Security',
    question: "Which payment methods are accepted on Velouraz?",
    answer: "We accept all major secure payment methods through our certified Razorpay payment gateway, including UPI (Google Pay, PhonePe, Paytm, CRED), Credit Cards, Debit Cards, Net Banking, and select digital wallets. All transactions are safeguarded by bank-grade 256-bit SSL encryption."
  },
  {
    category: 'Payments & Security',
    question: "Is it safe to make an online payment on Velouraz?",
    answer: "Absolutely. We do not store any credit card numbers, CVVs, or bank credentials. All transactions are securely processed directly on PCI-DSS Level 1 compliant servers through Razorpay with end-to-end tokenization."
  },
  {
    category: 'Jewellery Care',
    question: "How do I care for my Velouraz jewellery to ensure longevity?",
    answer: "To preserve the pristine radiance and gold plating of your pieces: avoid contact with perfumes, sanitizers, lotions, and harsh chemicals; remove before showering or swimming; and store each piece individually in your signature Velouraz airtight pouch or box away from moisture and direct sunlight."
  },
  {
    category: 'Jewellery Care',
    question: "Are Velouraz jewellery pieces hypoallergenic?",
    answer: "Yes. Our pieces are crafted using nickel-free, lead-free, and cadmium-free compositions to ensure they are hypoallergenic, gentle on sensitive skin, and comfortable for prolonged wear."
  }
];

const FAQ = () => {
  const [selectedCategory, setSelectedCategory] = useState('All Questions');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndices, setOpenIndices] = useState([0]); // Open first FAQ by default

  useSEO({
    title: "Frequently Asked Questions | VELOURAZ Atelier",
    description: "Find answers to commonly asked questions about Velouraz global jewellery, shipping times, returns, unboxing requirements, materials, and care guidelines.",
    canonical: "/faq"
  });

  const filteredFaqs = useMemo(() => {
    return ALL_FAQS.filter((faq) => {
      const matchesCategory = selectedCategory === 'All Questions' || faq.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || faq.question.toLowerCase().includes(q) || faq.answer.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const toggleFAQ = (index) => {
    setOpenIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#2A2623] font-sans selection:bg-[#14111E] selection:text-[#FBF9F5]">

      {/* Hero Header Banner */}
      <div className="relative w-full bg-[#120E15] py-16 pt-[160px] pb-20 border-b border-[#C8A46A]/20 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(200,169,122,0.18),transparent_75%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none opacity-40" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 space-y-4">
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm tracking-[0.25em] font-semibold uppercase text-white/60 mb-2">
            <Link to="/" className="hover:text-[#C8A46A] transition-colors">Home</Link>
            <span className="text-[#C8A46A]/40">/</span>
            <span className="text-[#C8A46A] font-bold">Frequently Asked Questions</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white font-normal tracking-wide">
            How May We <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-[#F3E5AB] via-[#FFF8E7] to-[#E5C794]">Assist You?</span>
          </h1>
          <p className="text-sm sm:text-base text-[#D4C5B0] font-light max-w-xl mx-auto leading-relaxed">
            Everything you need to know about our globally curated jewellery, bespoke craftsmanship, orders, and services.
          </p>

          {/* Quick Search Bar inside Banner */}
          <div className="pt-4 max-w-lg mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C8A46A] w-5 h-5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions (e.g. shipping, returns, unboxing video)..."
                className="w-full pl-12 pr-4 py-3.5 rounded-full bg-white/10 backdrop-blur-md border border-[#C8A46A]/40 text-white placeholder:text-white/50 text-sm focus:outline-none focus:border-[#F3E5AB] focus:ring-2 focus:ring-[#C8A46A]/30 transition-all shadow-lg"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs uppercase tracking-wider text-white/70 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1100px] mx-auto px-6 py-12 md:py-16">

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-12">
          {FAQ_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? 'bg-[#14111E] text-white shadow-md border border-[#14111E]'
                    : 'bg-white text-[#6B5E52] border border-[#E8DFC8] hover:border-[#C8A46A] hover:text-[#14111E]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* FAQ Accordion List */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 md:p-12 border border-[#E8DFC8] shadow-[0_4px_30px_rgba(0,0,0,0.02)] space-y-2">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => {
              const isOpen = openIndices.includes(index);
              return (
                <div key={faq.question} className="border-b border-[#2A2623]/10 last:border-b-0 py-2">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full py-5 flex items-center justify-between text-left focus:outline-none group cursor-pointer"
                  >
                    <div className="space-y-1 pr-6">
                      <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#B89355] block">
                        {faq.category}
                      </span>
                      <h3 className="font-serif text-[17px] sm:text-[19px] text-[#2A2623] group-hover:text-[#B89355] transition-colors">
                        {faq.question}
                      </h3>
                    </div>
                    <span className="shrink-0 w-8 h-8 rounded-full border border-[#2A2623]/20 flex items-center justify-center text-[#2A2623] group-hover:border-[#B89355] group-hover:bg-[#B89355] group-hover:text-white transition-all duration-300">
                      {isOpen ? <Minus size={15} /> : <Plus size={15} />}
                    </span>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pb-6 text-[14px] sm:text-[15px] leading-relaxed text-[#6B5E52] font-sans font-normal border-l-2 border-[#B89355]/40 pl-4 my-2">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 space-y-4">
              <HelpCircle className="w-12 h-12 text-[#C8A46A]/50 mx-auto" />
              <h4 className="font-serif text-xl text-[#2A2623]">No questions found</h4>
              <p className="text-sm text-[#7B6D63]">Try adjusting your search query or selecting another category.</p>
              <button
                onClick={() => { setSelectedCategory('All Questions'); setSearchQuery(''); }}
                className="px-6 py-2.5 rounded-full bg-[#14111E] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#C8A46A] transition-colors"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Atelier Concierge Contact Box */}
        <div className="mt-12 rounded-3xl p-8 sm:p-10 bg-gradient-to-br from-[#120E15] via-[#1E1724] to-[#120E15] text-white border border-[#C8A46A]/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#E5C794] font-semibold">
              <Sparkles size={14} /> Velouraz Atelier Concierge
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-light">
              Still have a question?
            </h3>
            <p className="text-sm text-[#D4C5B0] max-w-md font-light leading-relaxed">
              Our bespoke concierge team is available to assist you with styling recommendations, custom requests, and order queries.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <a
              href="https://wa.me/918349440045?text=Hello%20Velouraz%20Concierge%2C%20I%20have%20a%20question%20regarding..."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-sans text-xs uppercase font-bold tracking-[0.18em] transition-all duration-300 shadow-md flex items-center justify-center gap-2"
            >
              <MessageSquare size={16} /> WhatsApp Concierge
            </a>
            <a
              href="mailto:contact@velouraz.in"
              className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-sans text-xs uppercase font-bold tracking-[0.18em] border border-white/20 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Email Atelier
            </a>
          </div>
        </div>

      </div>

    </div>
  );
};

export default FAQ;
