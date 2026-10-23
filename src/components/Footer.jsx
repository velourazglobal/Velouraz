import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, ShieldCheck, Truck, RefreshCw, Gem, Lock, ArrowUpRight, Mail, CheckCircle2, Sparkles, Package } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubscribed(true);
      setEmail('');
    }, 600);
  };

  const sections = [
    {
      title: "SHOP & COLLECTIONS",
      links: [
        { name: "All Collections", href: "/shop" },
        { name: "The World Edit", href: "/world-edit" },
        { name: "Featured Bestsellers", href: "/shop?filter=bestsellers" }
      ]
    },
    {
      title: "CUSTOMER CARE",
      links: [
        { name: "Track Orders", href: "/orders" },
        { name: "Shopping Bag", href: "/cart" },
        { name: "My Wishlist", href: "/wishlist" }
      ]
    },
    {
      title: "OUR HOUSE",
      links: [
        { name: "Our Story & Heritage", href: "/about" },
        { name: "Blogs", href: "/blog" },
        { name: "My Account", href: "/account" },
        { name: "Contact Us", href: "/contact" }
      ]
    },
    {
      title: "LEGAL POLICIES",
      links: [
        { name: "Terms & Conditions", href: "/terms-and-conditions" },
        { name: "Privacy Policy", href: "/privacy-policy" },
        { name: "Return & Refund Policy", href: "/return-policy" }
      ]
    }
  ];

  const valueProps = [
    {
      icon: <Package className="w-5 h-5 text-[#B89355]" />,
      title: "Premium Packaging",
      subtitle: "Signature Box & Care Kit"
    },
    {
      icon: <Truck className="w-5 h-5 text-[#B89355]" />,
      title: "Insured Express Shipping",
      subtitle: "Safe & Fast Doorstep Delivery"
    },
    {
      icon: <RefreshCw className="w-5 h-5 text-[#B89355]" />,
      title: "4–5 Days Delivery",
      subtitle: "Swift & Secure Courier"
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-[#B89355]" />,
      title: "Lifetime Heritage Warranty",
      subtitle: "Guaranteed Artistry & Quality"
    }
  ];

  return (
    <footer className="w-full bg-[#FAF6F0] text-[#2A2623] font-sans border-t border-[#E8DFC8] relative overflow-hidden">

      {/* Soft Ambient Cream & Gold Glow Accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#C8A46A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#EFE6DC]/50 rounded-full blur-3xl pointer-events-none" />

      {/* Top Value Proposition Strip */}

      {/* VIP Atelier Newsletter Subscription Section */}

      {/* Main Footer Links & Brand Section */}
      <div className="relative pt-16 pb-14 px-6 lg:px-12 bg-gradient-to-b from-[#FAF6F0] via-[#F5ECE0] to-[#EFE6DC]">
        <div className="max-w-[1440px] mx-auto">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 mb-16">

            {/* Brand Column */}
            <div className="lg:col-span-4 space-y-6">
              <Link to="/" className="inline-block group">
                <img
                  src="/img/logo.png"
                  alt="Velouraz Jewellery"
                  className="h-14 lg:h-16 object-contain group-hover:opacity-85 transition-opacity"
                />
              </Link>

              <p className="text-[#6B5E52] font-serif text-base sm:text-lg leading-relaxed max-w-sm font-light">
                Curated high jewellery inspired by global heritage, crafted for the modern aesthetic with uncompromised artistry.
              </p>

              {/* Concierge Highlight */}
              <div className="pt-2">
                <p className="text-sm font-sans uppercase tracking-[0.2em] text-[#B89355] mb-1 font-bold">
                  Atelier Concierge
                </p>
                <a
                  href="mailto:contact@velouraz.in"
                  className="text-base text-[#2A2623] hover:text-[#B89355] transition-colors duration-300 font-serif flex items-center gap-1.5 inline-flex font-semibold"
                >
                  contact@velouraz.in <ArrowUpRight className="w-4 h-4 text-[#B89355]" />
                </a>
              </div>

              {/* Social Icons */}
              <div className="space-y-3 pt-3">
                <p className="text-sm font-sans uppercase tracking-[0.18em] text-[#B89355] font-bold">
                  Follow Our Journey
                </p>
                <div className="flex items-center gap-3">
                  {/* Instagram */}
                  <a
                    href="https://www.instagram.com/_velouraz_?igsh=cWt5bDBjZHZuZG9h&utm_source=qr"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="w-12 h-12 rounded-full bg-white/80 border border-[#E0D5C1] flex items-center justify-center text-[#2A2623] hover:text-white hover:bg-[#B89355] hover:border-[#B89355] hover:shadow-[0_4px_15px_rgba(184,147,85,0.35)] transition-all duration-300"
                  >
                    <Instagram size={20} />
                  </a>
                  {/* Pinterest */}
                  <a
                    href="https://pin.it/1TYN6PtZY"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Pinterest"
                    className="w-12 h-12 rounded-full bg-white/80 border border-[#E0D5C1] flex items-center justify-center text-[#2A2623] hover:text-white hover:bg-[#B89355] hover:border-[#B89355] hover:shadow-[0_4px_15px_rgba(184,147,85,0.35)] transition-all duration-300"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.606 0 12.017 0z" /></svg>
                  </a>
                  {/* Facebook */}
                  <a
                    href="https://www.facebook.com/profile.php?id=61592066286829"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="w-12 h-12 rounded-full bg-white/80 border border-[#E0D5C1] flex items-center justify-center text-[#2A2623] hover:text-white hover:bg-[#B89355] hover:border-[#B89355] hover:shadow-[0_4px_15px_rgba(184,147,85,0.35)] transition-all duration-300"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                  </a>
                  {/* LinkedIn */}
                  <a
                    href="https://www.linkedin.com/company/velouraz/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="w-12 h-12 rounded-full bg-white/80 border border-[#E0D5C1] flex items-center justify-center text-[#2A2623] hover:text-white hover:bg-[#B89355] hover:border-[#B89355] hover:shadow-[0_4px_15px_rgba(184,147,85,0.35)] transition-all duration-300"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                  </a>
                  {/* Threads */}
                  <a
                    href="https://www.threads.com/@_velouraz_?invite=0"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Threads"
                    className="w-12 h-12 rounded-full bg-white/80 border border-[#E0D5C1] flex items-center justify-center text-[#2A2623] hover:text-white hover:bg-[#B89355] hover:border-[#B89355] hover:shadow-[0_4px_15px_rgba(184,147,85,0.35)] transition-all duration-300"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12.186 24h-.007c-3.581-.026-6.377-1.222-8.31-3.554C2.008 18.2 1 15.176 1 11.45 1 4.887 5.864.07 12.277 0c3.554 0 6.643 1.404 8.696 3.953l-2.073 1.748c-1.636-2.033-4.088-3.155-6.914-3.155-5.26 0-9.25 3.92-9.25 9.404 0 3.208.825 5.703 2.385 7.217 1.482 1.439 3.655 2.18 6.46 2.204 4.092.035 7.152-1.282 8.358-3.606.666-1.284.88-2.879.636-4.743-.377-2.875-2.613-4.748-5.69-4.748-2.64 0-4.526 1.464-4.834 3.737-.024.183.05.352.193.456.14.103.328.125.487.054 1.344-.593 2.76-.328 3.633.303.654.472.981 1.2.923 2.05-.084 1.233-1.077 2.116-2.358 2.1-1.042-.013-1.898-.755-1.996-1.728l.006-.062c.162-1.666 1.49-2.906 3.253-3.045 1.547-.122 3.018.423 3.864 1.428.618.734.922 1.667.857 2.628-.152 2.23-1.83 3.99-4.073 4.275-2.793.355-5.234-.582-6.527-2.506C5.034 14.88 5 13.06 5 11.45c0-4.143 3.003-7.5 7.234-7.5 2.327 0 4.412.982 5.72 2.696l1.96-1.872C20.198 2.532 17.518 1.25 12.234 1.25 6.786 1.25 2.25 5.567 2.25 11.45c0 3.44.912 6.19 2.637 8.168 1.68 1.928 4.094 2.926 7.292 2.95h.007c3.923 0 7.261-1.686 9.076-4.595.632-1.013.974-2.191 1.018-3.5.093-2.774-.78-5.112-2.525-6.761-1.583-1.496-3.774-2.278-6.335-2.26-4.168.03-7.218 2.873-7.53 7.025-.262 3.493 2.117 6.47 5.58 6.993 2.05.31 4.143-.162 5.741-1.294l1.32 1.76c-2.072 1.47-4.78 2.083-7.442 1.681-4.526-.684-7.636-4.577-7.294-9.15.408-5.43 4.383-9.15 9.876-9.19 3.298-.023 6.128.986 8.19 2.93 2.247 2.12 3.371 5.12 3.25 8.68-.057 1.68-.498 3.193-1.31 4.494C20.521 21.84 16.545 24 12.186 24z" /></svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Navigation Columns - 4 Grid Columns */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              {sections.map((section) => (
                <div key={section.title} className="space-y-4">
                  <h4 className="text-sm sm:text-base font-bold tracking-[0.2em] text-[#B89355] uppercase font-sans mb-4 border-b border-[#E8DFC8] pb-2.5">
                    {section.title}
                  </h4>
                  <ul className="space-y-3.5">
                    {section.links.map((link) => (
                      <li key={link.name}>
                        <Link
                          to={link.href}
                          className="text-base sm:text-[17px] text-[#6B5E52] hover:text-[#B89355] transition-all duration-300 font-serif tracking-wide flex items-center gap-2 group"
                        >
                          <span className="opacity-0 group-hover:opacity-100 text-[#B89355] text-xs transition-opacity duration-300">✦</span>
                          <span className="group-hover:translate-x-1 transition-transform duration-300">
                            {link.name}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

          </div>

          {/* Bottom Bar & Copyright */}
          <div className="relative pt-8 border-t border-[#E8DFC8] flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">

            {/* Center Decorative Diamond Flourish */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#F5ECE0] px-3 text-[#B89355] text-sm">
              ✦
            </div>

            <div className="space-y-1">
              <p className="text-sm sm:text-base text-[#7B6D63] font-sans">
                © {currentYear} Velouraz Jewellery. All Rights Reserved.
              </p>
              <p className="text-sm sm:text-base text-[#7B6D63] font-sans">
                Design by <a href="https://letskillify.com" target="_blank" rel="noopener noreferrer" className="font-bold text-[#B89355] hover:underline">Letskillify</a>
              </p>
            </div>

            {/* Payment & Security Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm sm:text-base">
              <span className="bg-white/80 border border-[#E0D5C1] px-4.5 py-2 rounded-full text-sm sm:text-base font-serif text-[#6B5E52] flex items-center gap-2 shadow-xs">
                <Lock size={16} className="text-[#B89355]" /> 256-Bit SSL Encryption
              </span>
              <span className="bg-white/80 border border-[#E0D5C1] px-4.5 py-2 rounded-full text-sm sm:text-base font-serif text-[#6B5E52]">
                💳 Razorpay Secured
              </span>
            </div>

          </div>

        </div>
      </div>

    </footer>
  );
};

export default Footer;

