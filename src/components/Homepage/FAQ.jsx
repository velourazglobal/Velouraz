import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const FAQ_DATA = [
    {
        question: "Who are the founders behind Velouraz, and what is the brand's story?",
        answer: "Velouraz was born from a friendship transformed into a global journey. Best friends and founders, Zahabiya Kalabhai and Alifiya Bohra, found inspiration during their international travels. Their desire to bring the world's most captivating jewellery traditions into one cohesive collection led to the creation of Velouraz — a brand where the world becomes jewellery, and jewellery becomes part of your story."
    },
    {
        question: "What makes Velouraz jewellery globally curated?",
        answer: "Our collections draw inspiration from cultural hubs across the globe. From the delicate artistry of Japanese Miyuki beads and luminous South Korean pearls to the ancient symbolism of Turkish stones, Australian opals, Chinese jade, Parisian elegance, and the rich Kundan and Polki heritage of India, we bridge global destinations with contemporary style."
    },
    {
        question: "Is Velouraz jewellery made of real silver and precious materials?",
        answer: "Yes, we uphold 'The Velouraz Standard'. Our premium selections include fine 925 Sterling Silver pieces containing 92.5% pure silver. We also utilize high-quality anti-tarnish alloys, 18K/22K gold plating, and hand-selected precious stones designed for enduring beauty and everyday wear."
    },
    {
        question: "What types of jewellery can I buy from the Velouraz online shop?",
        answer: "We offer a wide variety of haute joaillerie including statement Earrings, Rings, Necklaces, Bracelets, Bangles, and exclusive Bridal Wear. Each piece is designed for the modern woman who seeks luxury that is felt rather than flaunted."
    },
    {
        question: "What is your return and exchange policy for online orders?",
        answer: "We offer a hassle-free 7-day return and exchange policy for unworn items in their original packaging. Because we deal in premium jewellery, we require customers to record a continuous unboxing video upon receiving their package to help us process any defect or transit damage claims swiftly."
    }
];

const FAQItem = ({ faq, isOpen, onClick }) => {
    return (
        <div className="border-b border-[#2A2623]/10">
            <button
                className="w-full py-6 flex items-center justify-between text-left focus:outline-none group"
                onClick={onClick}
            >
                <h3 className="font-serif text-[18px] sm:text-[20px] text-[#2A2623] group-hover:text-[#C8A46A] transition-colors pr-8">
                    {faq.question}
                </h3>
                <span className="flex-shrink-0 w-8 h-8 rounded-full border border-[#2A2623]/20 flex items-center justify-center text-[#2A2623] group-hover:border-[#C8A46A] group-hover:bg-[#C8A46A] group-hover:text-white transition-all duration-300">
                    {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                </span>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                    >
                        <p className="pb-6 text-[14px] sm:text-[15px] leading-relaxed text-[#7B6D63] font-sans">
                            {faq.answer}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState(0);

    return (
        <section className="py-20 sm:py-32 bg-[#F8F4EF]">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">

                    {/* Header Area */}
                    <div className="lg:col-span-5 flex flex-col justify-start">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <h2 className="text-[#A64D68] text-[12px] font-bold uppercase tracking-[0.2em] mb-4">
                                Assistance & Information
                            </h2>
                            <h3 className="font-serif text-[36px] sm:text-[44px] lg:text-[52px] leading-[1.1] text-[#2A2623] mb-6">
                                Frequently<br />Asked Questions
                            </h3>
                            <p className="text-[#7B6D63] text-[15px] leading-relaxed max-w-md">
                                Everything you need to know about our globally curated jewellery, shipping, and care instructions to preserve the brilliance of your pieces.
                            </p>
                        </motion.div>
                    </div>

                    {/* Accordion Area */}
                    <div className="lg:col-span-7">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            {FAQ_DATA.map((faq, index) => (
                                <FAQItem
                                    key={index}
                                    faq={faq}
                                    isOpen={openIndex === index}
                                    onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                                />
                            ))}
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default FAQ;
