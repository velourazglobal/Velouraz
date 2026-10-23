import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  RefreshCcw,
  Clock,
  AlertTriangle,
  CheckCircle,
  Ban,
  Sparkles,
  Search,
  CreditCard,
  Truck,
  Tag,
  PackageX,
  Lock,
  Scale,
  Mail,
  Phone,
  MapPin,
  Globe
} from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import useSEO from '../hooks/useSEO';

const ReturnPolicy = () => {
  useSEO({
    title: 'Return and Refund Policy - velouraz',
    description: 'At velouraz, we want you to love your jewellery. If you receive a damaged, defective or incorrect item, our team is here to help. Read our full return and refund policy.',
    keywords: 'velouraz return policy, jewellery refund india, velouraz exchange policy, damaged jewellery return',
    canonical: '/return-policy',
  });

  const fader = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  };

  const breadcrumbLinks = [
    { name: 'Home', href: '/' },
    { name: 'Return Policy', href: '/return-policy', active: true }
  ];

  return (
    <div className="min-h-screen bg-[#FDFAF5] text-[#2A2623] font-sans overflow-hidden">

      {/* Premium Breadcrumb */}
      <Breadcrumb
        title="Return & Refund Policy"
        subtitle="At velouraz, we want you to love your jewellery. Detailed guidelines for returns, exchanges, and refunds."
        bgImage="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1600"
        links={breadcrumbLinks}
      />

      <div className="max-w-4xl mx-auto py-16 px-6 relative z-10">
        <motion.div {...fader} className="space-y-16">

          {/* Intro Notice Banner */}
          <div className="p-8 bg-white/70 rounded-3xl border border-[#D8CBBE]/40 shadow-sm space-y-3">
            <p className="text-[#7B6D63] text-base sm:text-lg leading-relaxed font-light">
              At velouraz, we want you to love your jewellery. If you receive a product that is damaged, defective or incorrect, please contact us and we will be happy to assist you in accordance with this policy and applicable law.
            </p>
          </div>

          <div className="space-y-16 text-[#7B6D63] leading-relaxed tracking-wide text-base sm:text-lg font-light">

            {/* Unboxing Notice */}
            <section className="space-y-4 bg-[#FFF2E6] border border-[#FFD9B3] p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFD9B3]/20 rounded-bl-full pointer-events-none" />
              <div className="flex items-center gap-3 text-[#E65C00]">
                <AlertTriangle size={24} className="animate-pulse" />
                <h3 className="text-[#2A2623] text-xl font-serif font-bold">Unboxing Video Required for Returns</h3>
              </div>
              <p className="font-medium text-[#4A423C]">
                For a smooth and hassle-free return process, customers are required to record a <strong>continuous unboxing video</strong> while opening the package.
              </p>
              <div className="p-4 bg-[#FFEBDA] rounded-xl border border-[#FFD9B3]/50">
                <p className="text-sm font-semibold uppercase tracking-wider text-[#E65C00] mb-1">Please Note:</p>
                <p className="text-[#5A4F46]">
                  Returns or claims may not be accepted without a valid unboxing video as proof of the package condition at the time of delivery.
                </p>
              </div>
            </section>

            {/* 1. Eligibility for Returns */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <CheckCircle size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">1. Eligibility for Returns</h2>
              </div>
              <p>You may request a return or exchange within 5 days if:</p>
              <ul className="grid sm:grid-cols-2 gap-3 pt-1">
                {[
                  "You received a damaged product.",
                  "You received a defective product.",
                  "You received a product different from the one ordered.",
                  "The product received has a manufacturing defect."
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 items-start bg-white/50 p-3.5 rounded-xl border border-[#D8CBBE]/20 hover:border-[#2e0e43]/30 transition-all">
                    <span className="text-[#2e0e43] font-bold mt-0.5">•</span>
                    <span className="text-[#2A2623] font-medium text-sm sm:text-base">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="font-medium text-[#2A2623] pt-2">For eligible returns, the product must generally be:</p>
              <ul className="space-y-3 pt-1">
                {[
                  "Unworn and unused.",
                  "In its original condition.",
                  "Returned with the original packaging, tags and accessories, where applicable.",
                  "A video showing the defect of the product.",
                  "Accompanied by the original order details."
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 items-start bg-white/50 p-3.5 rounded-xl border border-[#D8CBBE]/20 hover:border-[#2e0e43]/30 transition-all">
                    <span className="text-[#2e0e43] font-bold mt-0.5">•</span>
                    <span className="text-[#2A2623] font-medium text-sm sm:text-base">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="pt-2 italic font-serif text-[#2e0e43]">
                Certain products may have specific return conditions mentioned on their individual product pages.
              </p>
            </section>

            {/* 2. Return Request Period */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <Clock size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">2. Return Request Period</h2>
              </div>
              <div className="space-y-4">
                <p>Please contact velouraz within [48 hours / 3 days] of delivery if you receive a damaged, defective or incorrect product.</p>
                <p className="font-medium text-[#2A2623]">To raise a return request, contact:</p>
                <div className="bg-white/60 p-4 rounded-xl border border-[#D8CBBE]/30 space-y-1 text-sm sm:text-base">
                  <p><strong className="text-[#2A2623]">Email:</strong> contact@velouraz.in</p>
                  <p><strong className="text-[#2A2623]">WhatsApp/Phone:</strong> +91 83494 40045</p>
                </div>
                <p className="font-medium text-[#2A2623]">Please provide your:</p>
                <ul className="grid sm:grid-cols-2 gap-3 pt-1">
                  {[
                    "Order number",
                    "Name and contact details",
                    "Reason for return",
                    "Clear photographs and video of the product",
                    "Photographs of the packaging",
                    "Unboxing video, where available"
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3 items-start bg-white/50 p-3.5 rounded-xl border border-[#D8CBBE]/20 hover:border-[#2e0e43]/30 transition-all">
                      <span className="text-[#2e0e43] font-bold mt-0.5">•</span>
                      <span className="text-[#2A2623] font-medium text-sm sm:text-base">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="pt-2">We may request additional information or photographs to assess the issue.</p>
              </div>
            </section>

            {/* 3. Damaged Products */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <AlertTriangle size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">3. Damaged Products</h2>
              </div>
              <div className="space-y-4">
                <p>If your package appears damaged at the time of delivery, please photograph the package before opening it.</p>
                <p>If the jewellery is damaged inside the package, please contact us as soon as possible and provide photographs/videos showing the condition of the package and product.</p>
                <p>Once the claim is reviewed and approved, velouraz may offer a replacement, exchange or refund, depending on product availability and the circumstances of the case.</p>
              </div>
            </section>

            {/* 4. Incorrect Product */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <RefreshCcw size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">4. Incorrect Product</h2>
              </div>
              <div className="space-y-4">
                <p>If you receive a product that is different from what you ordered, please contact us within the return-request period.</p>
                <p className="font-medium text-[#2A2623]">After verification, velouraz will arrange an appropriate resolution, which may include:</p>
                <ul className="space-y-3 pt-1">
                  {[
                    "Replacement with the correct product;",
                    "Exchange; or",
                    "Refund, where applicable."
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3 items-start bg-white/50 p-3.5 rounded-xl border border-[#D8CBBE]/20 hover:border-[#2e0e43]/30 transition-all">
                      <span className="text-[#2e0e43] font-bold mt-0.5">•</span>
                      <span className="text-[#2A2623] font-medium text-sm sm:text-base">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* 6. Non-Returnable Situations */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <Ban size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">6. Non-Returnable Situations</h2>
              </div>
              <p className="font-medium text-[#2A2623]">Returns may not be accepted where the product has:</p>
              <ul className="space-y-3 pt-1">
                {[
                  "Been worn or used.",
                  "Been damaged after delivery.",
                  "Been altered or repaired by a third party.",
                  "Been exposed to chemicals, perfume, water, cosmetics or other substances resulting in damage.",
                  "Been scratched or otherwise damaged through misuse.",
                  "Been returned without the original packaging where such packaging is required for the return.",
                  "Been customised or personalised specifically for the customer, subject to applicable law."
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 items-start bg-white/50 p-3.5 rounded-xl border border-[#D8CBBE]/20 hover:border-[#2e0e43]/30 transition-all">
                    <span className="text-[#2e0e43] font-bold mt-0.5">•</span>
                    <span className="text-[#2A2623] font-medium text-sm sm:text-base">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="pt-2 italic font-serif text-[#2e0e43]">
                Natural variations in gemstones, pearls, beads, colour, texture or shape are not necessarily considered defects.
              </p>
            </section>

            {/* 7. Jewellery Care and Normal Wear */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <Sparkles size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">7. Jewellery Care and Normal Wear</h2>
              </div>
              <div className="space-y-4">
                <p>Sterling silver may naturally tarnish or oxidise over time.</p>
                <p>Gold-plated or PVD-finished jewellery may experience gradual wear depending on usage, friction, chemicals, moisture and individual care.</p>
                <p>Such normal changes caused by use are generally not considered manufacturing defects.</p>
                <p>Customers should follow the jewellery-care instructions provided by velouraz.</p>
              </div>
            </section>

            {/* 8. Return Inspection */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <Search size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">8. Return Inspection</h2>
              </div>
              <div className="space-y-4">
                <p>All returned products may be inspected before a refund, replacement or exchange is approved.</p>
                <p>velouraz reserves the right to reject a return where the product does not meet the applicable return conditions, subject to applicable law.</p>
              </div>
            </section>

            {/* 9. Refunds */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <CreditCard size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">9. Refunds</h2>
              </div>
              <div className="space-y-4">
                <p>Once a return is approved, the refund will be processed through the original payment method wherever reasonably possible.</p>
                <p>The processing time may depend on the payment gateway, bank or financial institution.</p>
                <p>velouraz will communicate the applicable refund status to the customer.</p>
              </div>
            </section>

            {/* 10. Shipping Charges */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <Truck size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">10. Shipping Charges</h2>
              </div>
              <div className="space-y-4">
                <p className="font-medium text-[#2A2623]">Where a return is accepted because the product was:</p>
                <ul className="space-y-3 pt-1">
                  {[
                    "Damaged during delivery;",
                    "Defective; or",
                    "Incorrectly supplied by velouraz,"
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3 items-start bg-white/50 p-3.5 rounded-xl border border-[#D8CBBE]/20 hover:border-[#2e0e43]/30 transition-all">
                      <span className="text-[#2e0e43] font-bold mt-0.5">•</span>
                      <span className="text-[#2A2623] font-medium text-sm sm:text-base">{item}</span>
                    </li>
                  ))}
                </ul>
                <p>velouraz will determine the appropriate return-shipping arrangement in accordance with applicable law and the circumstances of the case.</p>
                <p>For other permitted returns, shipping charges may be non-refundable where legally permissible.</p>
              </div>
            </section>



            {/* 16. Contact Us */}
            <section className="space-y-8 group pt-4">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <Mail size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">11. Contact Us</h2>
              </div>
              <p>
                For return, exchange or refund assistance, please contact:
              </p>

              <div className="bg-white rounded-3xl p-8 border border-[#D8CBBE]/30 shadow-sm space-y-4 max-w-xl">
                <h3 className="text-[#2A2623] font-serif font-bold text-xl border-b border-[#D8CBBE]/20 pb-3">velouraz</h3>
                <div className="space-y-3 text-sm sm:text-base">
                  <p className="flex items-center gap-3"><Mail size={16} className="text-[#2e0e43] shrink-0" /><strong className="text-[#2A2623]">Email:</strong> contact@velouraz.in</p>
                  <p className="flex items-center gap-3"><Phone size={16} className="text-[#2e0e43] shrink-0" /><strong className="text-[#2A2623]">Phone/WhatsApp:</strong> +91 83494 40045</p>
                  <p className="flex items-start gap-3"><MapPin size={16} className="text-[#2e0e43] shrink-0 mt-1" /><strong className="text-[#2A2623] shrink-0">Business Address:</strong> 783 Khatiwala tank, Indore 452014</p>
                  <p className="flex items-center gap-3"><Globe size={16} className="text-[#2e0e43] shrink-0" /><strong className="text-[#2A2623]">Website:</strong> velouraz.in</p>
                </div>
              </div>
            </section>

          </div>

          <div className="mt-24 pt-12 border-t border-[#D8CBBE]/30 text-center">
            <p className="text-sm sm:text-base tracking-[0.4em] uppercase text-[#7B6D63]/40 font-bold">© 2026 velouraz. Artisans of Luxury.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReturnPolicy;
