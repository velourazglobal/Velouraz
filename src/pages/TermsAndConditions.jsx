import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Info, 
  Sparkles, 
  HeartHandshake, 
  ShieldAlert, 
  Tag, 
  ShoppingBag, 
  CreditCard, 
  Truck, 
  RefreshCcw, 
  AlertCircle, 
  Award, 
  MessageSquare, 
  Ban, 
  Share2, 
  Activity, 
  ShieldOff, 
  CheckCircle, 
  Lock, 
  Eye, 
  Scale, 
  ShieldCheck, 
  Mail, 
  Phone, 
  MapPin, 
  Globe 
} from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';

const TermsAndConditions = () => {
  const fader = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  };

  const breadcrumbLinks = [
    { name: 'Home', href: '/' },
    { name: 'Terms & Conditions', href: '/terms-and-conditions', active: true }
  ];

  return (
    <div className="min-h-screen bg-[#FDFAF5] text-[#2A2623] font-sans overflow-hidden">
      
      {/* Premium Breadcrumb */}
      <Breadcrumb 
        title="Terms & Conditions"
        subtitle="These Terms & Conditions govern your access to and use of the VelourAZ website, including the purchase of products through our website."
        bgImage="https://images.unsplash.com/photo-1554034483-04fac19c3d71?auto=format&fit=crop&q=80&w=1600"
        links={breadcrumbLinks}
      />

      <div className="max-w-4xl mx-auto py-16 px-6 relative z-10">
        <motion.div {...fader} className="space-y-16">
          
          {/* Welcome Notice Banner */}
          <div className="p-8 bg-white/70 rounded-3xl border border-[#D8CBBE]/40 shadow-sm space-y-4">
            <p className="text-[#2A2623] font-serif font-bold text-lg sm:text-xl">
              Welcome to VelourAZ. These Terms & Conditions govern your access to and use of the VelourAZ website, including the purchase of products through our website.
            </p>
            <p className="text-[#7B6D63] text-base sm:text-lg leading-relaxed font-light">
              By accessing or using our website, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms,then you may please do access our website.
            </p>
          </div>

          <div className="space-y-16 text-[#7B6D63] leading-relaxed tracking-wide text-base sm:text-lg font-light">
            
            {/* Product Information */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <Info size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">Product Information</h2>
              </div>
              <p>
                We make reasonable efforts to ensure that product descriptions, photographs, measurements, materials and colours displayed on our website are accurate.
              </p>
              <p className="font-medium text-[#2A2623]">However:</p>
              <ul className="space-y-3 pt-1">
                {[
                  "Colours may vary slightly depending on your device or screen settings.",
                  "Natural gemstones and pearls may naturally vary in colour, shape, size, texture and appearance.",
                  "Handmade or individually finished products may have minor variations.",
                  "Measurements and weights may have minor manufacturing tolerances.",
                  "Product photographs may include styling elements that are not included with the purchase."
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 items-start bg-white/50 p-3.5 rounded-xl border border-[#D8CBBE]/20 hover:border-[#2e0e43]/30 transition-all">
                    <span className="text-[#2e0e43] font-bold mt-0.5">•</span>
                    <span className="text-[#2A2623] font-medium text-sm sm:text-base">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="pt-2 italic font-serif text-[#2e0e43]">
                Such natural or minor variations do not necessarily constitute a manufacturing defect.
              </p>
            </section>

            {/* 4. Sterling Silver and Jewellery Materials */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <Sparkles size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">4. Sterling Silver and Jewellery Materials</h2>
              </div>
              <div className="space-y-4">
                <p>Where a product is described as 925 Sterling Silver, the product is represented as meeting the applicable 925 silver fineness specification.</p>
                <p>Where applicable, information about plating, gemstones, pearls, beads and other materials will be stated in the individual product description.</p>
                <p>Customers should read the product description carefully before placing an order.</p>
                <p>A product described as gold-plated or gold-finished over sterling silver should not be interpreted as solid gold.</p>
                <p>Similarly, “925” should not be interpreted as meaning that every component, stone, plating layer or accessory attached to a product is made of 925 silver unless expressly stated in the product description.</p>
              </div>
            </section>

            {/* 5. Jewellery Care */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <HeartHandshake size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">5. Jewellery Care</h2>
              </div>
              <p>Jewellery requires appropriate care to maintain its appearance.</p>
              <p className="font-medium text-[#2A2623]">Customers are advised to avoid unnecessary exposure to:</p>
              <ul className="grid sm:grid-cols-2 gap-3 pt-1">
                {[
                  "Perfume and cosmetics",
                  "Lotions and creams",
                  "Chlorine and swimming pools",
                  "Salt water",
                  "Household chemicals",
                  "Excessive moisture",
                  "Prolonged contact with sweat",
                  "Sleeping while wearing jewellery, where applicable"
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 items-start bg-white/50 p-3.5 rounded-xl border border-[#D8CBBE]/20 hover:border-[#2e0e43]/30 transition-all">
                    <span className="text-[#2e0e43] font-bold mt-0.5">•</span>
                    <span className="text-[#2A2623] font-medium text-sm sm:text-base">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-4 pt-2">
                <p>Sterling silver can naturally tarnish over time due to exposure to air, moisture, chemicals and other environmental factors.</p>
                <p>Plated jewellery may also experience gradual wear depending on usage, friction, exposure and care.</p>
                <p>Normal tarnishing, oxidation or gradual plating wear caused by use is not necessarily considered a manufacturing defect.</p>
              </div>
            </section>

            {/* 6. Skin Sensitivity */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <ShieldAlert size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">6. Skin Sensitivity</h2>
              </div>
              <div className="space-y-4">
                <p>Individual skin reactions vary from person to person.</p>
                <p>Where a product is described as nickel-free or suitable for sensitive skin, such description will be based on the applicable product specifications and/or available testing or supplier documentation.</p>
                <p>However, VelourAZ cannot guarantee that a particular product will be suitable for every individual.</p>
                <p>Customers with known metal, gemstone, plating or cosmetic sensitivities should review the product materials before purchase and discontinue use if irritation occurs.</p>
              </div>
            </section>

            {/* 7. Prices */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <Tag size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">7. Prices</h2>
              </div>
              <div className="space-y-4">
                <p>All product prices displayed on the website are in Indian Rupees (INR) unless otherwise stated.</p>
                <p>Applicable taxes, including GST where applicable, will be charged in accordance with applicable law.</p>
                <p>VelourAZ reserves the right to change product prices at any time. Any price change will not affect an order that has already been accepted and confirmed, except where required by law or in the event of an obvious pricing error.</p>
              </div>
            </section>

            {/* 8. Orders */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <ShoppingBag size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">8. Orders</h2>
              </div>
              <div className="space-y-4">
                <p>Placing an order constitutes an offer to purchase the selected product(s).</p>
                <p>An order will be considered accepted once VelourAZ confirms the order and/or dispatches the product, subject to applicable law.</p>
                <p className="font-medium text-[#2A2623]">We reserve the right to cancel or refuse an order in circumstances including:</p>
                <ul className="grid sm:grid-cols-2 gap-3 pt-1">
                  {[
                    "Product unavailability",
                    "Incorrect product or pricing information",
                    "Suspected fraudulent activity",
                    "Payment issues",
                    "Incorrect shipping information",
                    "Inventory or technical errors",
                    "Circumstances beyond our reasonable control"
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3 items-start bg-white/50 p-3.5 rounded-xl border border-[#D8CBBE]/20 hover:border-[#2e0e43]/30 transition-all">
                      <span className="text-[#2e0e43] font-bold mt-0.5">•</span>
                      <span className="text-[#2A2623] font-medium text-sm sm:text-base">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="pt-2">If an order is cancelled after payment has been received, the applicable amount will be refunded through the original or appropriate payment method.</p>
              </div>
            </section>

            {/* 9. Payment */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <CreditCard size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">9. Payment</h2>
              </div>
              <div className="space-y-4">
                <p>Payments may be processed through third-party payment gateways.</p>
                <p>By submitting payment details, you confirm that you are authorised to use the selected payment method.</p>
                <p>VelourAZ does not intentionally retain complete card, banking or other sensitive payment credentials where payment processing is handled by a third-party payment provider.</p>
              </div>
            </section>

            {/* 10. Shipping */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <Truck size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">10. Shipping</h2>
              </div>
              <div className="space-y-4">
                <p>Orders will be shipped to the delivery address provided by the customer during checkout.</p>
                <p>Customers are responsible for ensuring that the shipping address, telephone number and other delivery information are accurate.</p>
                <p>Delivery timelines displayed on the website are estimates and may be affected by courier delays, weather, public holidays, operational disruptions or other circumstances beyond our reasonable control.</p>
                <p>For further information, please refer to our Shipping Policy.</p>
              </div>
            </section>

            {/* 11. Returns, Exchanges and Refunds */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <RefreshCcw size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">11. Returns, Exchanges and Refunds</h2>
              </div>
              <div className="space-y-4">
                <p>Returns, exchanges and refunds are subject to the VelourAZ Returns & Refund Policy published on our website.</p>
                <p>Certain products may be non-returnable or non-exchangeable for hygiene, customised-product or other legitimate reasons, where permitted by applicable law.</p>
                <p>Products must generally be returned in their original condition, unused and with the original packaging and tags, where applicable.</p>
                <p>VelourAZ reserves the right to inspect returned products before approving an eligible return, exchange or refund.</p>
                <p>Nothing in this section limits any mandatory consumer rights available under applicable Indian law.</p>
              </div>
            </section>

            {/* 12. Damaged or Incorrect Products */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <AlertCircle size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">12. Damaged or Incorrect Products</h2>
              </div>
              <p>
                If you receive a product that is damaged, defective or different from the product ordered, please contact VelourAZ at [customer service email] within [48 hours/3 days] of delivery.
              </p>
              <p className="font-medium text-[#2A2623]">Please provide:</p>
              <ul className="grid sm:grid-cols-2 gap-3 pt-1">
                {[
                  "Order number",
                  "Photographs of the package",
                  "Photographs/videos of the product",
                  "Description of the issue"
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 items-start bg-white/50 p-3.5 rounded-xl border border-[#D8CBBE]/20 hover:border-[#2e0e43]/30 transition-all">
                    <span className="text-[#2e0e43] font-bold mt-0.5">•</span>
                    <span className="text-[#2A2623] font-medium text-sm sm:text-base">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-4 pt-2">
                <p>We may request additional information to assess the matter.</p>
                <p>Where a claim is accepted, VelourAZ may provide an appropriate replacement, exchange or refund in accordance with our applicable policy and law.</p>
              </div>
            </section>

            {/* 13. Intellectual Property */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <Award size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">13. Intellectual Property</h2>
              </div>
              <p>All content appearing on the VelourAZ website, including but not limited to:</p>
              <ul className="grid sm:grid-cols-2 gap-3 pt-1">
                {[
                  "Brand name",
                  "Logo",
                  "Product photographs",
                  "Product descriptions",
                  "Graphics",
                  "Videos",
                  "Designs",
                  "Website layout",
                  "Text",
                  "Marketing material"
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 items-start bg-white/50 p-3.5 rounded-xl border border-[#D8CBBE]/20 hover:border-[#2e0e43]/30 transition-all">
                    <span className="text-[#2e0e43] font-bold mt-0.5">•</span>
                    <span className="text-[#2A2623] font-medium text-sm sm:text-base">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-4 pt-2">
                <p>is owned by or licensed to VelourAZ and is protected under applicable intellectual-property laws.</p>
                <p>You may not copy, reproduce, modify, distribute, publish, sell or commercially exploit VelourAZ content without prior written permission.</p>
              </div>
            </section>

            {/* 14. User Reviews and Content */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <MessageSquare size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">14. User Reviews and Content</h2>
              </div>
              <p>If you submit a review, photograph, testimonial or other content to VelourAZ, you confirm that:</p>
              <ul className="space-y-3 pt-1">
                {[
                  "You have the right to submit the content.",
                  "The content is not unlawful, defamatory, misleading or infringing.",
                  "The content does not violate another person's rights."
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 items-start bg-white/50 p-3.5 rounded-xl border border-[#D8CBBE]/20 hover:border-[#2e0e43]/30 transition-all">
                    <span className="text-[#2e0e43] font-bold mt-0.5">•</span>
                    <span className="text-[#2A2623] font-medium text-sm sm:text-base">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="pt-2">
                By submitting content, you grant VelourAZ permission to use, reproduce, display and publish that content for legitimate business and marketing purposes, subject to applicable law.
              </p>
            </section>

            {/* 15. Website Use */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <Ban size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">15. Website Use</h2>
              </div>
              <p className="font-medium text-[#2A2623]">You agree not to:</p>
              <ul className="space-y-3 pt-1">
                {[
                  "Use the website for unlawful purposes.",
                  "Attempt to gain unauthorised access to the website or its systems.",
                  "Introduce malicious software or harmful code.",
                  "Scrape or reproduce website content without permission.",
                  "Interfere with website security or functionality.",
                  "Use another person's account or payment information without authorisation."
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 items-start bg-white/50 p-3.5 rounded-xl border border-[#D8CBBE]/20 hover:border-[#2e0e43]/30 transition-all">
                    <span className="text-[#2e0e43] font-bold mt-0.5">•</span>
                    <span className="text-[#2A2623] font-medium text-sm sm:text-base">{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* 16. Third-Party Services */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <Share2 size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">16. Third-Party Services</h2>
              </div>
              <div className="space-y-4">
                <p>Our website may use third-party services including payment gateways, logistics providers, analytics services, advertising platforms and other technology providers.</p>
                <p>Your use of such services may also be subject to their respective terms and privacy policies.</p>
                <p>VelourAZ is not responsible for the independent policies or practices of third-party service providers, except to the extent required by applicable law.</p>
              </div>
            </section>

            {/* 17. Website Availability */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <Activity size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">17. Website Availability</h2>
              </div>
              <div className="space-y-4">
                <p>We make reasonable efforts to keep our website available and functioning properly.</p>
                <p>However, we do not guarantee that the website will always be uninterrupted, error-free or available at all times.</p>
                <p>We may temporarily suspend or modify website functionality for maintenance, upgrades, security or other operational reasons.</p>
              </div>
            </section>

            {/* 18. Limitation of Liability */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <ShieldOff size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">18. Limitation of Liability</h2>
              </div>
              <div className="space-y-4">
                <p>To the maximum extent permitted by applicable law, VelourAZ shall not be liable for indirect, incidental or consequential losses arising from the use of our website or products.</p>
                <p>Nothing in these Terms excludes or limits liability that cannot legally be excluded or limited under applicable Indian law.</p>
              </div>
            </section>

            {/* 19. Indemnity */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <CheckCircle size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">19. Indemnity</h2>
              </div>
              <div className="space-y-4">
                <p>To the extent permitted by applicable law, you agree to indemnify and hold VelourAZ harmless from claims, losses or expenses arising from your unlawful use of the website, violation of these Terms or infringement of third-party rights.</p>
              </div>
            </section>

            {/* 20. Fraud and Misuse */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <Lock size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">20. Fraud and Misuse</h2>
              </div>
              <div className="space-y-4">
                <p>VelourAZ reserves the right to investigate suspicious transactions and take appropriate action where fraudulent activity, payment misuse, repeated abuse of return policies or other unlawful activity is suspected.</p>
                <p>This may include cancellation of orders and reporting matters to the appropriate authorities where required or permitted by law.</p>
              </div>
            </section>

            {/* 21. Privacy */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <Eye size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">21. Privacy</h2>
              </div>
              <div className="space-y-4">
                <p>Your use of the website is also subject to our Privacy Policy, which explains how we collect, use, store and protect personal information.</p>
                <p>Please review our Privacy Policy before placing an order.</p>
              </div>
            </section>

            {/* 22. Changes to These Terms */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <FileText size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">22. Changes to These Terms</h2>
              </div>
              <div className="space-y-4">
                <p>VelourAZ may update these Terms & Conditions from time to time.</p>
                <p>The updated version will be published on this page with the revised “Last Updated” date.</p>
                <p>Your continued use of the website after an update constitutes acceptance of the revised Terms, subject to applicable law.</p>
              </div>
            </section>

            {/* 23. Governing Law */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <Scale size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">23. Governing Law</h2>
              </div>
              <div className="space-y-4">
                <p>These Terms shall be governed by the laws of India.</p>
                <p>Any dispute shall be subject to the jurisdiction of the courts having appropriate jurisdiction over the matter, subject to applicable consumer-protection and other mandatory laws.</p>
              </div>
            </section>

            {/* 24. Consumer Rights */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">24. Consumer Rights</h2>
              </div>
              <div className="space-y-4">
                <p>Nothing in these Terms is intended to exclude, restrict or override any consumer rights or legal protections that cannot lawfully be excluded under applicable Indian law.</p>
              </div>
            </section>

            {/* 25. Contact Us */}
            <section className="space-y-8 group pt-4">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <Mail size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">25. Contact Us</h2>
              </div>
              <p>
                For questions regarding these Terms & Conditions, orders or products, please contact:
              </p>

              <div className="bg-white rounded-3xl p-8 border border-[#D8CBBE]/30 shadow-sm space-y-4 max-w-xl">
                <h3 className="text-[#2A2623] font-serif font-bold text-xl border-b border-[#D8CBBE]/20 pb-3">Velouraz</h3>
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
            <p className="text-sm sm:text-base tracking-[0.4em] uppercase text-[#7B6D63]/40 font-bold">© 2026 VELOURAZ. </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
