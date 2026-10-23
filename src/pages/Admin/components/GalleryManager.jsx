import React, { useState, useEffect } from "react";
import { db } from "../../../components/Firebase";
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    onSnapshot,
    serverTimestamp,
} from "firebase/firestore";
import { uploadToCloudinary, getThumbnailUrl, handleImageError } from "../../../config/cloudinary";
import { Trash2, Upload, GripVertical, Loader2, ArrowUp, ArrowDown } from "lucide-react";

const GalleryManager = () => {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "gallery"), (snapshot) => {
            const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            // Sort by order
            data.sort((a, b) => (a.order || 0) - (b.order || 0));
            setPhotos(data);
            setLoading(false);
        }, (err) => {
            console.error(err);
            setError("Unable to load gallery.");
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const handleUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setUploading(true);
        setError("");

        try {
            let currentMaxOrder = photos.length > 0 ? Math.max(...photos.map(p => p.order || 0)) : 0;

            for (const file of files) {
                const url = await uploadToCloudinary(file);
                currentMaxOrder += 10;
                await addDoc(collection(db, "gallery"), {
                    url,
                    order: currentMaxOrder,
                    createdAt: serverTimestamp(),
                });
            }
        } catch (err) {
            setError(err?.message || "Upload failed");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const movePhoto = async (index, direction) => {
        if (direction === -1 && index === 0) return;
        if (direction === 1 && index === photos.length - 1) return;

        const newPhotos = [...photos];
        const temp = newPhotos[index];
        newPhotos[index] = newPhotos[index + direction];
        newPhotos[index + direction] = temp;

        // Fast local UI update
        setPhotos(newPhotos);

        // Save order changes
        try {
            await Promise.all(
                newPhotos.map((photo, i) =>
                    updateDoc(doc(db, "gallery", photo.id), { order: i * 10 })
                )
            );
        } catch (err) {
            setError("Failed to update order");
        }
    };

    const deletePhoto = async (id) => {
        if (!window.confirm("Are you sure you want to delete this photo from the gallery?")) return;
        try {
            await deleteDoc(doc(db, "gallery", id));
        } catch (err) {
            setError("Failed to delete photo");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Gallery Manager</h2>
                    <p className="text-sm text-slate-500 mt-1">Upload and arrange photos for the website gallery.</p>
                </div>
                <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#811331] px-5 py-2.5 text-sm font-bold text-white shadow-md active:scale-95 transition-all ${uploading ? "opacity-60 pointer-events-none" : "hover:bg-[#6b0f28]"}`}>
                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    {uploading ? "Uploading..." : "Upload Photos"}
                    <input type="file" multiple accept="image/*" onChange={handleUpload} className="hidden" />
                </label>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm font-bold">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="grid h-64 place-items-center">
                    <Loader2 className="animate-spin text-[#811331]" />
                </div>
            ) : photos.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
                    No photos in gallery yet. Upload some to get started!
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-5 py-3 font-semibold uppercase tracking-wider text-slate-500 text-xs w-24">Order</th>
                                <th className="px-5 py-3 font-semibold uppercase tracking-wider text-slate-500 text-xs">Image</th>
                                <th className="px-5 py-3 font-semibold uppercase tracking-wider text-slate-500 text-xs text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {photos.map((photo, index) => (
                                <tr key={photo.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-5 py-3 align-middle">
                                        <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => movePhoto(index, -1)} disabled={index === 0} className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 disabled:hover:bg-transparent">
                                                <ArrowUp size={16} />
                                            </button>
                                            <button onClick={() => movePhoto(index, 1)} disabled={index === photos.length - 1} className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 disabled:hover:bg-transparent">
                                                <ArrowDown size={16} />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        {(() => {
                                            const rawUrl = photo.url || photo.image || photo.src;
                                            return (
                                                <img 
                                                    src={getThumbnailUrl(rawUrl)} 
                                                    alt="Gallery" 
                                                    loading="lazy" 
                                                    decoding="async" 
                                                    onError={(e) => handleImageError(e, rawUrl)} 
                                                    className="h-20 w-32 object-cover rounded-lg border border-slate-200 bg-slate-100" 
                                                />
                                            );
                                        })()}
                                    </td>
                                    <td className="px-5 py-3 text-right align-middle">
                                        <button onClick={() => deletePhoto(photo.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default GalleryManager;
