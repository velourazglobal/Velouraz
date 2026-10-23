import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, UserCheck, Settings, Mail, CreditCard, Truck, Lock, Clock, Globe, AlertTriangle, RefreshCw, Phone, MapPin } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import useSEO from '../hooks/useSEO';

const PrivacyPolicy = () => {
  useSEO({
    title: 'Privacy Policy - How velouraz Protects Your Data',
    description: 'Read the velouraz Privacy Policy to understand how we collect, use and protect your personal information when you shop for jewellery on our website.',
    keywords: 'velouraz privacy policy, data protection velouraz, jewellery brand privacy india',
    canonical: '/privacy-policy',
  });

  const fader = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 }, viewport: { once: true },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  };

  const breadcrumbLinks = [
    { name: 'Home', href: '/' },
    { name: 'Privacy Policy', href: '/privacy-policy', active: true }
  ];

  return (
    <div className="min-h-screen bg-[#FDFAF5] text-[#2A2623] font-sans overflow-hidden">

      {/* Premium Breadcrumb */}
      <Breadcrumb
        title="Privacy Policy"
        subtitle="The Privacy Policy describes that by using our website you acknowledge that you have read and understood this Privacy Policy."
        bgImage="https://images.unsplash.com/photo-1544027993-37dbfe43552e?auto=format&fit=crop&q=80&w=1600"
        links={breadcrumbLinks}
      />

      <div className="max-w-4xl mx-auto py-16 px-6 relative z-10">
        <motion.div {...fader} className="space-y-16">

          {/* Intro Notice Banner */}
          <div className="p-8 bg-white/70 rounded-3xl border border-[#D8CBBE]/40 shadow-sm space-y-3">
            <p className="text-[#7B6D63] text-base sm:text-lg leading-relaxed font-light">
              The Privacy Policy describes that by using our website you acknowledge that you have read and understood this Privacy Policy
            </p>
            <p className="text-[#2A2623] font-medium text-base sm:text-lg">
              Depending on how you interact with us, we may collect the following information:
            </p>
          </div>

          <div className="space-y-16 text-[#7B6D63] leading-relaxed tracking-wide text-base sm:text-lg font-light">

            {/* Section A */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <UserCheck size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">1. Information you provide to us</h2>
              </div>
              <p>
                When you create an account, place an order, contact us or otherwise interact with velouraz, we may collect:
              </p>
              <ul className="grid sm:grid-cols-2 gap-3 pt-2">
                {[
                  "Full name",
                  "Mobile/telephone number",
                  "Email address",
                  "Billing address",
                  "Shipping/delivery address",
                  "Order and purchase information",
                  "Payment-related information necessary to process your transaction",
                  "Product preferences and communications with us",
                  "Information you provide when contacting customer support",
                  "Any other information you voluntarily provide to us"
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 items-start bg-white/50 p-3.5 rounded-xl border border-[#D8CBBE]/20 hover:border-[#2e0e43]/30 transition-all">
                    <span className="text-[#2e0e43] font-bold mt-0.5">•</span>
                    <span className="text-[#2A2623] font-medium text-sm sm:text-base">{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Section 2 */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <Settings size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">2. How We Use Your Information</h2>
              </div>
              <p>
                We may use your information to:
              </p>
              <ul className="grid sm:grid-cols-2 gap-3 pt-2">
                {[
                  "Process and fulfil your orders",
                  "Process payments and refunds",
                  "Arrange delivery and shipping",
                  "Communicate with you regarding your order",
                  "Provide customer support",
                  "Respond to enquiries and requests",
                  "Manage your account, where applicable",
                  "Improve our website, products and services",
                  "Personalise your shopping experience",
                  "Detect, prevent and investigate fraud, misuse or security incidents",
                  "Maintain records required for business, accounting and legal purposes",
                  "Send marketing communications where permitted and, where required, with your consent",
                  "Conduct analytics and understand customer preferences",
                  "Comply with applicable laws, regulations and lawful requests"
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 items-start bg-white/50 p-3.5 rounded-xl border border-[#D8CBBE]/20 hover:border-[#2e0e43]/30 transition-all">
                    <span className="text-[#2e0e43] font-bold mt-0.5">•</span>
                    <span className="text-[#2A2623] font-medium text-sm sm:text-base">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="pt-2 italic font-serif text-[#2e0e43]">
                We will use personal information only for legitimate and lawful purposes applicable to our business.
              </p>
            </section>

            {/* Section 3 */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <Mail size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">3. Marketing Communications</h2>
              </div>
              <p>
                If you choose to receive marketing communications from us, we may contact you through email, SMS, WhatsApp or other communication channels with information about:
              </p>
              <ul className="grid sm:grid-cols-2 gap-3 pt-2">
                {[
                  "New collections",
                  "Product launches",
                  "Offers and promotions",
                  "Events",
                  "Brand updates",
                  "Other velouraz-related communications"
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 items-start bg-white/50 p-3.5 rounded-xl border border-[#D8CBBE]/20 hover:border-[#2e0e43]/30 transition-all">
                    <span className="text-[#2e0e43] font-bold mt-0.5">•</span>
                    <span className="text-[#2A2623] font-medium text-sm sm:text-base">{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Section 5 */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <CreditCard size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">4. Payment Information</h2>
              </div>
              <div className="space-y-4">
                <p>Payments made through our website may be processed by third-party payment service providers.</p>
                <p>Depending on the payment method selected, your payment information may be processed directly by the relevant payment provider.</p>
                <p>velouraz does not intentionally store complete debit-card or credit-card numbers, CVV numbers or banking passwords on its own systems unless specifically required and lawfully permitted.</p>
                <p>Payment information is handled according to the applicable policies and security practices of the payment service provider.</p>
              </div>
            </section>

            {/* Section 7 */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <Truck size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">5. Shipping and Delivery Partners</h2>
              </div>
              <div className="space-y-4">
                <p>To deliver your order, we may provide necessary information such as your name, phone number and delivery address to our logistics, courier or shipping partners.</p>
                <p>These partners may process your information only as necessary to provide their services to us and you.</p>
              </div>
            </section>

            {/* Section 9 */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <Lock size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">6. Data Security</h2>
              </div>
              <div className="space-y-4">
                <p>We take reasonable technical and organisational measures to protect personal information against unauthorised access, misuse, alteration, disclosure or destruction.</p>
                <p>However, no method of transmission or electronic storage can be guaranteed to be completely secure.</p>
                <p>You are responsible for maintaining the confidentiality of any account credentials or information used to access your account.</p>
              </div>
            </section>

            {/* Section 10 */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <Clock size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">7. Data Retention</h2>
              </div>
              <div className="space-y-4">
                <p>We retain personal information only for as long as reasonably necessary for the purposes described in this Privacy Policy, including fulfilling orders, providing services, maintaining business and financial records, resolving disputes, preventing fraud and complying with legal or regulatory obligations.</p>
                <p>When personal information is no longer required, we may delete, anonymise or securely dispose of it, subject to applicable legal requirements.</p>
              </div>
            </section>

            {/* Section 13 */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <Globe size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">8. International Data Processing</h2>
              </div>
              <div className="space-y-4">
                <p>Some of our service providers may process or store information outside India.</p>
                <p>Where personal information is transferred or processed outside India, we will take steps required under applicable law and our contractual arrangements with relevant service providers.</p>
              </div>
            </section>

            {/* Section 14 */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <AlertTriangle size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">9. Fraud and Security</h2>
              </div>
              <div className="space-y-4">
                <p>We may use personal information to detect and prevent fraudulent transactions, unauthorised activity, abuse of our website and other security threats.</p>
                <p>We may disclose information to relevant authorities or service providers where reasonably necessary to investigate or prevent unlawful activity.</p>
              </div>
            </section>

            {/* Section 15 */}
            <section className="space-y-6 group">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <RefreshCw size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">10. Changes to This Privacy Policy</h2>
              </div>
              <div className="space-y-4">
                <p>We may update this Privacy Policy from time to time to reflect changes in our business, technology, services or applicable laws.</p>
                <p>The updated version will be published on this page with a revised “Last Updated” date.</p>
                <p>We encourage you to review this page periodically.</p>
              </div>
            </section>

            {/* Section 16 */}
            <section className="space-y-8 group pt-4">
              <div className="flex items-center gap-4 text-[#2e0e43]">
                <div className="w-12 h-12 rounded-2xl bg-[#2e0e43]/5 flex items-center justify-center shadow-sm group-hover:bg-[#2e0e43] group-hover:text-white transition-all duration-500 shrink-0">
                  <Mail size={22} />
                </div>
                <h2 className="text-[#2A2623] text-xl sm:text-2xl font-serif font-bold tracking-tight">11. Contact Us</h2>
              </div>
              <p>
                If you have questions, concerns or requests relating to this Privacy Policy or your personal information, please contact us:
              </p>

              <div className="grid md:grid-cols-2 gap-6 pt-2">
                {/* Official Contact Box */}
                <div className="bg-white rounded-3xl p-8 border border-[#D8CBBE]/30 shadow-sm space-y-4">
                  <h3 className="text-[#2A2623] font-serif font-bold text-xl border-b border-[#D8CBBE]/20 pb-3">velouraz</h3>
                  <div className="space-y-3 text-sm sm:text-base">
                    <p className="flex items-center gap-3"><Globe size={16} className="text-[#2e0e43] shrink-0" /><strong className="text-[#2A2623]">Website:</strong> velouraz.in</p>
                    <p className="flex items-center gap-3"><Mail size={16} className="text-[#2e0e43] shrink-0" /><strong className="text-[#2A2623]">Email:</strong> contact@velouraz.in</p>
                    <p className="flex items-center gap-3"><Phone size={16} className="text-[#2e0e43] shrink-0" /><strong className="text-[#2A2623]">Phone:</strong> +91 83494 40045</p>
                    <p className="flex items-start gap-3"><MapPin size={16} className="text-[#2e0e43] shrink-0 mt-1" /><strong className="text-[#2A2623] shrink-0">Address:</strong> 783 Khatiwala tank, Indore 452014</p>
                  </div>
                </div>

                {/* Grievance Contact Box */}
                <div className="bg-white rounded-3xl p-8 border border-[#D8CBBE]/30 shadow-sm space-y-4">
                  <h3 className="text-[#2A2623] font-serif font-bold text-xl border-b border-[#D8CBBE]/20 pb-3">Privacy / Data Grievance Contact</h3>
                  <div className="space-y-3 text-sm sm:text-base">
                    <p className="flex items-center gap-3"><UserCheck size={16} className="text-[#2e0e43] shrink-0" /><strong className="text-[#2A2623]">Name:</strong> Grievance Officer, velouraz</p>
                    <p className="flex items-center gap-3"><Mail size={16} className="text-[#2e0e43] shrink-0" /><strong className="text-[#2A2623]">Email:</strong> contact@velouraz.in</p>
                    <p className="flex items-center gap-3"><Phone size={16} className="text-[#2e0e43] shrink-0" /><strong className="text-[#2A2623]">Phone:</strong> +91 83494 40045</p>
                  </div>
                </div>
              </div>

              <p className="pt-2">
                We will make reasonable efforts to respond to privacy-related requests within the period required by applicable law.
              </p>
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

export default PrivacyPolicy;
