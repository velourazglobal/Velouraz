import React, { useState, useEffect } from "react";
import { db } from "../components/Firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X, Maximize2 } from "lucide-react";
import Breadcrumb from "../components/Breadcrumb";
import useSEO from "../hooks/useSEO";

const Gallery = () => {
    useSEO({
        title: 'Gallery - Behind the Scenes at Velouraz',
        description: 'Take a peek inside the world of Velouraz. From international gem sourcing trips and live exhibitions to happy customers wearing our globally curated jewellery.',
        keywords: 'velouraz gallery, jewellery brand india gallery, behind the scenes jewellery, velouraz events, jewellery exhibition india',
        canonical: '/gallery',
    });

    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "gallery"), (snapshot) => {
            const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            data.sort((a, b) => (a.order || 0) - (b.order || 0));
            setPhotos(data);
            setLoading(false);
        }, (err) => {
            console.error(err);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    return (
        <div className="min-h-screen bg-[#FAF7F2] font-sans text-[#2A2623] pb-24">
            <Breadcrumb
                title="Our Gallery"
                subtitle="A glimpse into our journey, our crafts, exhibitions, and the beautiful people who bring life to our creations."
                bgImage="https://res.cloudinary.com/dcjn4y284/image/upload/v1787672225/india_yqlodw.png" // placeholder related to brand
                links={[
                    { name: "Home", href: "/" },
                    { name: "Gallery", href: "/gallery", active: true },
                ]}
            />

            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-12">
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    <h2 className="font-serif text-3xl sm:text-5xl font-light text-[#2A2623] tracking-tight">Behind the <span className="italic text-[#8B6B38]">Scenes</span></h2>
                    <p className="text-base text-[#6B5E52] leading-relaxed">
                        From international gem sourcing trips, live exhibitions, to our happy customers. Take a peek into the world of Velouraz.
                    </p>
                </div>

                {loading ? (
                    <div className="grid h-64 place-items-center">
                        <Loader2 className="animate-spin text-[#8B6B38] w-8 h-8" />
                    </div>
                ) : photos.length === 0 ? (
                    <div className="text-center text-[#6B5E52] py-20 bg-white rounded-3xl border border-[#EFE8DC] shadow-sm">
                        <p className="text-lg">Gallery is currently being updated. Check back soon for new photos!</p>
                    </div>
                ) : (
                    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                        {photos.map((photo, i) => (
                            <motion.div
                                key={photo.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: (Math.min(i, 10)) * 0.1 }}
                                className="break-inside-avoid shadow-[0_4px_25px_rgba(0,0,0,0.04)] rounded-2xl overflow-hidden cursor-pointer group relative bg-[#EFE8DC]"
                                onClick={() => setSelectedPhoto(photo)}
                            >
                                <img
                                    src={photo.url}
                                    alt={photo.caption || photo.title || `Velouraz jewellery - ${photo.id}`}
                                    className="w-full h-auto object-cover transform transition-transform duration-700 ease-out group-hover:scale-105"
                                    loading="lazy"
                                />

                                {/* Overlay for interaction */}
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                    <div className="bg-white/20 backdrop-blur-md rounded-full p-3 border border-white/40 transform scale-50 group-hover:scale-100 transition-transform duration-300">
                                        <Maximize2 className="text-white w-5 h-5" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {selectedPhoto && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedPhoto(null)}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
                    >
                        <button
                            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-[60]"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPhoto(null);
                            }}
                        >
                            <X size={24} />
                        </button>
                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            src={selectedPhoto.url}
                            alt="Gallery Preview"
                            className="max-h-[90vh] max-w-full rounded-xl shadow-2xl object-contain relative z-50 cursor-default"
                            onClick={(e) => e.stopPropagation()} // Prevent close on image click
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Gallery;
