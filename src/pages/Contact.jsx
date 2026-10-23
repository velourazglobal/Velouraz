import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail, Phone, MapPin, ChevronDown, Instagram, Send, Clock,
  MessageCircle, Globe, Award, Sparkles, CheckCircle2, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Breadcrumb from '../components/Breadcrumb';
import useSEO from '../hooks/useSEO';

const Contact = () => {
  useSEO({
    title: 'Contact Us - Get in Touch with Velouraz',
    description: 'Have a question about a piece or need help with your order? Reach out to the Velouraz team by email, phone or WhatsApp. We are available Monday to Saturday, 10am to 7pm IST.',
    keywords: 'contact velouraz, velouraz customer support, jewellery brand contact india, velouraz whatsapp, velouraz email, velouraz indore',
    canonical: '/contact',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "name": "Contact Velouraz",
      "url": "https://www.velouraz.in/contact",
      "description": "Contact the Velouraz team for order support, custom inquiries or general information about our jewellery collections."
    }
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    }, 800);
  };

  const fadeUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, ease: [0.19, 1, 0.22, 1] }
  };

  const breadcrumbLinks = [
    { name: 'Home', href: '/' },
    { name: 'Contact Us', href: '/contact', active: true }
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-sans text-[#2A2623]">

      {/* Header Banner */}
      <Breadcrumb
        title="Contact us"
        subtitle="We are at your service for personal advice, order inquiries, or bespoke creations."
        bgImage="https://images.unsplash.com/photo-1594913785162-e6785311bc51?auto=format&fit=crop&q=80&w=1600"
        links={breadcrumbLinks}
      />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">

        {/* Main Grid: Info Sidebar & Compact Form */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">

          {/* Left Column: Atelier Concierge Info & Socials */}
          <motion.div
            {...fadeUp}
            className="lg:col-span-5 flex flex-col justify-between space-y-6"
          >
            {/* Atelier Info Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE3D8] shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-6 flex-1">
              <div>
                <span className="text-[14px] font-bold uppercase tracking-[0.3em] text-[#C8A97A] block mb-1">
                  ✦ VELOURAZ
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif text-[#2e0e43] font-normal leading-tight">
                  Get in Touch
                </h2>
                <p className="text-xs sm:text-sm text-[#6B5E54] mt-2 leading-relaxed">
                  Have a question about a piece or need assistance with your order? Our client advisory team is here to assist you.
                </p>
              </div>

              {/* Contact Method Rows */}
              <div className="space-y-4 pt-2 border-t border-[#EAE3D8]/60">
                {/* Email */}
                <a
                  href="mailto:contact@velouraz.in"
                  className="flex items-start gap-4 p-3.5 rounded-2xl hover:bg-[#FAF7F2] border border-transparent hover:border-[#EAE3D8] transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#2e0e43]/5 text-[#2e0e43] flex items-center justify-center shrink-0 group-hover:bg-[#2e0e43] group-hover:text-white transition-colors">
                    <Mail size={18} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold uppercase tracking-widest text-[#9C8B7C]">Email Us</p>
                    <p className="text-sm font-semibold text-[#2A2623] group-hover:text-[#2e0e43] transition-colors">contact@velouraz.in</p>
                    <p className="text-[14px] text-[#8C7B6C] mt-0.5">Response within 24 hours</p>
                  </div>
                </a>

                {/* Phone */}
                <a
                  href="tel:+918349440045"
                  className="flex items-start gap-4 p-3.5 rounded-2xl hover:bg-[#FAF7F2] border border-transparent hover:border-[#EAE3D8] transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#2e0e43]/5 text-[#2e0e43] flex items-center justify-center shrink-0 group-hover:bg-[#2e0e43] group-hover:text-white transition-colors">
                    <Phone size={18} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold uppercase tracking-widest text-[#9C8B7C]">Call Us</p>
                    <p className="text-sm font-semibold text-[#2A2623] group-hover:text-[#2e0e43] transition-colors">+91 83494 40045</p>
                    <p className="text-[14px] text-[#8C7B6C] mt-0.5">Mon   Sat, 10am - 7pm IST</p>
                  </div>
                </a>

                {/* Location */}
                <div className="flex items-start gap-4 p-3.5 rounded-2xl hover:bg-[#FAF7F2] border border-transparent hover:border-[#EAE3D8] transition-all group">
                  <div className="w-10 h-10 rounded-full bg-[#2e0e43]/5 text-[#2e0e43] flex items-center justify-center shrink-0 group-hover:bg-[#2e0e43] group-hover:text-white transition-colors">
                    <MapPin size={18} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold uppercase tracking-widest text-[#9C8B7C]">Our Location</p>
                    <p className="text-sm font-semibold text-[#2A2623]">783 Khatiwala tank, Indore 452014</p>
                    <p className="text-[14px] text-[#8C7B6C] mt-0.5">Handcrafted in the heart of artisanal heritage</p>
                  </div>
                </div>
              </div>

              {/* Instant WhatsApp Support Card */}
              <a
                href="https://wa.me/918349440045"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-[#2e0e43] to-[#451463] text-white shadow-md hover:shadow-lg transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <MessageCircle size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#C8A97A]">WhatsApp Concierge</p>
                    <p className="text-xs text-white/80">Chat instantly with our advisor</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-[#C8A97A] group-hover:translate-x-1 transition-transform" />
              </a>

              {/* Social Channels */}
              <div className="pt-2 flex items-center justify-between border-t border-[#EAE3D8]/60">
                <span className="text-[14px] font-bold uppercase tracking-widest text-[#9C8B7C]">Follow Velouraz</span>
                <div className="flex items-center gap-2">
                  <a
                    href="https://www.instagram.com/_velouraz_?igsh=cWt5bDBjZHZuZG9h&utm_source=qr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full border border-[#D5C6B1] flex items-center justify-center text-[#2e0e43] hover:bg-[#2e0e43] hover:text-white transition-colors"
                    title="Instagram"
                  >
                    <Instagram size={14} />
                  </a>
                  <a
                    href="https://pin.it/1TYN6PtZY"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full border border-[#D5C6B1] flex items-center justify-center text-[#2e0e43] hover:bg-[#2e0e43] hover:text-white transition-colors"
                    title="Pinterest"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.606 0 12.017 0z" /></svg>
                  </a>
                  <a
                    href="https://www.facebook.com/profile.php?id=61592066286829"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full border border-[#D5C6B1] flex items-center justify-center text-[#2e0e43] hover:bg-[#2e0e43] hover:text-white transition-colors"
                    title="Facebook"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                  </a>
                  <a
                    href="https://www.linkedin.com/company/velouraz/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full border border-[#D5C6B1] flex items-center justify-center text-[#2e0e43] hover:bg-[#2e0e43] hover:text-white transition-colors"
                    title="LinkedIn"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                  </a>
                  <a
                    href="https://www.threads.com/@_velouraz_?invite=0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full border border-[#D5C6B1] flex items-center justify-center text-[#2e0e43] hover:bg-[#2e0e43] hover:text-white transition-colors"
                    title="Threads"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12.186 24h-.007c-3.581-.026-6.377-1.222-8.31-3.554C2.008 18.2 1 15.176 1 11.45 1 4.887 5.864.07 12.277 0c3.554 0 6.643 1.404 8.696 3.953l-2.073 1.748c-1.636-2.033-4.088-3.155-6.914-3.155-5.26 0-9.25 3.92-9.25 9.404 0 3.208.825 5.703 2.385 7.217 1.482 1.439 3.655 2.18 6.46 2.204 4.092.035 7.152-1.282 8.358-3.606.666-1.284.88-2.879.636-4.743-.377-2.875-2.613-4.748-5.69-4.748-2.64 0-4.526 1.464-4.834 3.737-.024.183.05.352.193.456.14.103.328.125.487.054 1.344-.593 2.76-.328 3.633.303.654.472.981 1.2.923 2.05-.084 1.233-1.077 2.116-2.358 2.1-1.042-.013-1.898-.755-1.996-1.728l.006-.062c.162-1.666 1.49-2.906 3.253-3.045 1.547-.122 3.018.423 3.864 1.428.618.734.922 1.667.857 2.628-.152 2.23-1.83 3.99-4.073 4.275-2.793.355-5.234-.582-6.527-2.506C5.034 14.88 5 13.06 5 11.45c0-4.143 3.003-7.5 7.234-7.5 2.327 0 4.412.982 5.72 2.696l1.96-1.872C20.198 2.532 17.518 1.25 12.234 1.25 6.786 1.25 2.25 5.567 2.25 11.45c0 3.44.912 6.19 2.637 8.168 1.68 1.928 4.094 2.926 7.292 2.95h.007c3.923 0 7.261-1.686 9.076-4.595.632-1.013.974-2.191 1.018-3.5.093-2.774-.78-5.112-2.525-6.761-1.583-1.496-3.774-2.278-6.335-2.26-4.168.03-7.218 2.873-7.53 7.025-.262 3.493 2.117 6.47 5.58 6.993 2.05.31 4.143-.162 5.741-1.294l1.32 1.76c-2.072 1.47-4.78 2.083-7.442 1.681-4.526-.684-7.636-4.577-7.294-9.15.408-5.43 4.383-9.15 9.876-9.19 3.298-.023 6.128.986 8.19 2.93 2.247 2.12 3.371 5.12 3.25 8.68-.057 1.68-.498 3.193-1.31 4.494C20.521 21.84 16.545 24 12.186 24z" /></svg>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Premium & Compact Form */}
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
            className="lg:col-span-7"
          >
            <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-[#EAE3D8] shadow-[0_4px_25px_rgba(0,0,0,0.03)] relative overflow-hidden h-full flex flex-col justify-between">

              <div>
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#EAE3D8]/60">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-serif text-[#2e0e43] font-normal">
                      Send a Message
                    </h3>
                    <p className="text-xs text-[#7B6D63] mt-0.5">
                      Fill out the form below and our team will respond promptly.
                    </p>
                  </div>
                  <Sparkles size={20} className="text-[#C8A97A] hidden sm:block shrink-0" />
                </div>

                {/* Success Banner */}
                <AnimatePresence>
                  {submitted && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-medium flex items-center gap-2.5"
                    >
                      <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                      <span>Thank you! Your message has been sent to Velouraz Concierge.</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name & Email 2-Column Grid */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[14px] font-bold uppercase tracking-wider text-[#5C4F44]">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-[#FAF7F2] border border-[#EAE3D8] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#2A2623] outline-none focus:border-[#2e0e43] focus:bg-white transition-all placeholder:text-[#9C8B7C]/60"
                        placeholder="e.g. Sophia Anderson"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[14px] font-bold uppercase tracking-wider text-[#5C4F44]">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-[#FAF7F2] border border-[#EAE3D8] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#2A2623] outline-none focus:border-[#2e0e43] focus:bg-white transition-all placeholder:text-[#9C8B7C]/60"
                        placeholder="sophia@example.com"
                      />
                    </div>
                  </div>

                  {/* Inquiry Type Select */}
                  <div className="space-y-1.5">
                    <label className="text-[14px] font-bold uppercase tracking-wider text-[#5C4F44]">Inquiry Type</label>
                    <div className="relative">
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full bg-[#FAF7F2] border border-[#EAE3D8] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#2A2623] outline-none focus:border-[#2e0e43] focus:bg-white transition-all appearance-none cursor-pointer pr-10"
                      >
                        <option>General Inquiry</option>
                        <option>Order Status & Support</option>
                        <option>Bespoke & Custom Orders</option>
                        <option>Wholesale & Collaborations</option>
                        <option>Press & Media</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7B6D63] pointer-events-none" />
                    </div>
                  </div>

                  {/* Message Textarea */}
                  <div className="space-y-1.5">
                    <label className="text-[14px] font-bold uppercase tracking-wider text-[#5C4F44]">Your Message *</label>
                    <textarea
                      rows="4"
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-[#FAF7F2] border border-[#EAE3D8] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#2A2623] outline-none focus:border-[#2e0e43] focus:bg-white transition-all resize-none placeholder:text-[#9C8B7C]/60"
                      placeholder="How can our concierge assist you today?"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3 bg-[#2e0e43] hover:bg-[#451463] text-white text-xs font-bold uppercase tracking-[0.2em] rounded-xl shadow-md transition-all cursor-pointer hover:shadow-lg disabled:opacity-50"
                    >
                      <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                      <Send size={14} className={isSubmitting ? 'animate-bounce' : 'transition-transform'} />
                    </button>
                  </div>
                </form>
              </div>

              {/* Bottom Note */}
              <div className="pt-6 mt-6 border-t border-[#EAE3D8]/60 flex items-center justify-between text-[14px] text-[#8C7B6C]">
                <span>🔒 Your personal information is protected by our privacy commitment.</span>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

    </div>
  );
};

export default Contact;
