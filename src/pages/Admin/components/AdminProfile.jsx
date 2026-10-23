import React, { useState, useRef } from "react";
import { db } from "../../../components/Firebase";
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, User, Phone, Mail, Shield, Save, Check,
  AlertCircle, Loader2, Edit3, Globe2, MapPin, Briefcase, X,
} from "lucide-react";
import { uploadToCloudinary } from "../../../config/cloudinary";

// ─── Sub-components ───────────────────────────────────────────────────────────
const Field = ({ label, icon: Icon, children, isDark, full }) => (
  <div className={`rounded-xl border p-3.5 sm:p-4 ${isDark ? "border-slate-700 bg-slate-800/60" : "border-slate-100 bg-slate-50/50"} ${full ? "col-span-full" : ""}`}>
    <label className={`flex items-center gap-1.5 mb-2 text-[16px] sm:text-[16px] font-bold uppercase tracking-widest ${isDark ? "text-slate-400" : "text-slate-400"}`}>
      <Icon size={11} />
      {label}
    </label>
    {children}
  </div>
);

const inputCls = (isDark, error) =>
  `w-full rounded-lg border px-3 sm:px-3.5 py-2 sm:py-2.5 text-sm outline-none transition-all ${error
    ? "border-red-400 bg-red-50 text-red-800 focus:ring-2 focus:ring-red-100"
    : isDark
      ? "border-slate-600 bg-slate-700 text-white placeholder:text-slate-500 focus:border-[#9c1237] focus:ring-2 focus:ring-[#9c1237]/20"
      : "border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-[#9c1237] focus:ring-2 focus:ring-[#9c1237]/10"
  }`;

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminProfile = ({ adminUser, onUpdate, isDarkMode = false }) => {
  const fileRef = useRef(null);

  const [profileData, setProfileData] = useState({
    displayName: adminUser?.displayName || adminUser?.name || "",
    email: adminUser?.email || "",
    phone: adminUser?.phone || adminUser?.contact || "",
    role: adminUser?.role || "Admin",
    location: adminUser?.location || "",
    department: adminUser?.department || "",
    bio: adminUser?.bio || "",
    photoURL: adminUser?.photoURL || adminUser?.photo || "",
  });

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(profileData.photoURL || "");

  // Theme helpers
  const cardBg = isDarkMode ? "bg-slate-800/80 border-slate-700/60" : "bg-white border-slate-100";
  const textPrimary = isDarkMode ? "text-white" : "text-slate-900";
  const textMuted = isDarkMode ? "text-slate-400" : "text-slate-500";
  const divider = isDarkMode ? "border-slate-700" : "border-slate-100";

  // ─── Photo upload ──────────────────────────────────────────────────────────
  const handleImagePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB.");
      return;
    }

    // Show instant local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploading(true);
    setUploadProgress(0);
    setError("");

    try {
      // Use the shared uploadToCloudinary from config   this is the one that works for products too
      const cloudUrl = await uploadToCloudinary(file);
      setProfileData((prev) => ({ ...prev, photoURL: cloudUrl }));
      setPreviewUrl(cloudUrl);
      setUploadProgress(100);
    } catch (err) {
      console.error("Profile photo upload error:", err);
      // Keep local preview but store the blob URL   will be lost on refresh
      // Show clear actionable error
      setError(
        "Photo uploaded locally but Cloudinary upload failed. " +
        "Please check your Cloudinary preset allows unsigned uploads, then try again. " +
        "Your other profile changes will still save."
      );
      // Keep objectUrl as preview so the user can see what they selected
      setProfileData((prev) => ({ ...prev, photoURL: objectUrl }));
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected after error
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // ─── Save profile ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!profileData.displayName?.trim()) {
      setError("Display name is required.");
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const firestoreId = adminUser?.firestoreId || adminUser?.uid;
      if (firestoreId) {
        await setDoc(doc(db, "admins", firestoreId), {
          displayName: profileData.displayName.trim(),
          phone: profileData.phone.trim(),
          email: profileData.email.trim(),
          role: profileData.role.trim(),
          location: profileData.location.trim(),
          department: profileData.department.trim(),
          bio: profileData.bio.trim(),
          photoURL: profileData.photoURL,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
      const updated = { ...adminUser, ...profileData };
      localStorage.setItem("velouraz_admin", JSON.stringify(updated));
      if (onUpdate) onUpdate(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Profile save error:", err);
      setError("Failed to save profile: " + (err.message || "Unknown error. Check Firestore rules."));
    } finally {
      setSaving(false);
    }
  };

  const initials = (profileData.displayName || profileData.email || adminUser?.adminId || "A")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase())
    .join("")
    .slice(0, 2);

  return (
    <div className="space-y-4 sm:space-y-5 max-w-2xl mx-auto w-full">

      {/* ─── Profile Hero Card ─── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`rounded-2xl border shadow-sm overflow-hidden ${cardBg}`}
      >
        {/* Cover banner */}
        <div className="h-24 sm:h-32 bg-gradient-to-r from-[#630a21] via-[#811331] to-[#a4143e] relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "radial-gradient(circle at 30% 50%, white 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
          {/* Decorative circles */}
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/5" />
          <div className="absolute -right-2 -bottom-6 h-24 w-24 rounded-full bg-white/5" />
        </div>

        <div className="px-4 sm:px-6 pb-5 sm:pb-6 -mt-10 sm:-mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            {/* Avatar + upload */}
            <div className="flex items-end gap-4">
              <div className="relative flex-shrink-0">
                {/* Photo circle */}
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-gradient-to-br from-[#631028] to-[#3d0819]">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                      onError={() => setPreviewUrl("")}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-white text-2xl font-bold font-serif select-none">
                      {initials}
                    </div>
                  )}
                  {/* Upload overlay when uploading */}
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                      <Loader2 size={22} className="animate-spin text-white" />
                    </div>
                  )}
                </div>

                {/* Camera button */}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-xl bg-[#811331] text-white flex items-center justify-center shadow-lg hover:bg-[#9d1a3d] active:scale-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed z-10"
                  title="Change photo"
                >
                  {uploading
                    ? <Loader2 size={13} className="animate-spin" />
                    : <Camera size={13} />}
                </button>

                {/* Hidden file input */}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleImagePick}
                />
              </div>

              {/* Name + role */}
              <div className="mb-1">
                <h2 className={`text-base sm:text-xl font-bold leading-tight ${textPrimary}`}>
                  {profileData.displayName || adminUser?.adminId || "Admin User"}
                </h2>
                <p className={`text-base sm:text-sm mt-0.5 ${textMuted}`}>
                  {profileData.role || "Admin"} · {profileData.department || "Velouraz Team"}
                </p>
                {uploading && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[16px] font-semibold text-amber-600">
                    <Loader2 size={10} className="animate-spin" /> Uploading photo…
                  </span>
                )}
              </div>
            </div>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || uploading}
              className={`self-end sm:self-auto flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${saved
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                : "bg-[#811331] text-white shadow-lg shadow-[#811331]/20 hover:bg-[#9d1a3d]"
                }`}
            >
              {saving
                ? <Loader2 size={14} className="animate-spin" />
                : saved
                  ? <Check size={14} />
                  : <Save size={14} />}
              {saving ? "Saving…" : saved ? "Saved!" : "Save Profile"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ─── Error / Notice Banner ─── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span className="flex-1 text-base sm:text-sm">{error}</span>
            <button onClick={() => setError("")} className="text-red-400 hover:text-red-600 flex-shrink-0">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Personal Information Form ─── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08 }}
        className={`rounded-2xl border shadow-sm p-4 sm:p-6 ${cardBg}`}
      >
        <div className="flex items-center gap-2 mb-4 sm:mb-5">
          <div className="p-2 rounded-xl bg-[#811331]/10">
            <Edit3 size={14} className="text-[#811331]" />
          </div>
          <div>
            <h3 className={`text-sm sm:text-[16px] font-bold ${textPrimary}`}>Personal Information</h3>
            <p className={`text-base ${textMuted}`}>Update your profile details below</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Field label="Display Name" icon={User} isDark={isDarkMode}>
            <input
              type="text"
              value={profileData.displayName}
              onChange={(e) => setProfileData((p) => ({ ...p, displayName: e.target.value }))}
              className={inputCls(isDarkMode)}
              placeholder="Your full name"
            />
          </Field>

          <Field label="Email Address" icon={Mail} isDark={isDarkMode}>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData((p) => ({ ...p, email: e.target.value }))}
              className={inputCls(isDarkMode)}
              placeholder="you@velouraz.com"
            />
          </Field>

          <Field label="Phone / Contact" icon={Phone} isDark={isDarkMode}>
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData((p) => ({ ...p, phone: e.target.value }))}
              className={inputCls(isDarkMode)}
              placeholder="+91 98765 43210"
            />
          </Field>

          <Field label="Role / Title" icon={Shield} isDark={isDarkMode}>
            <input
              type="text"
              value={profileData.role}
              onChange={(e) => setProfileData((p) => ({ ...p, role: e.target.value }))}
              className={inputCls(isDarkMode)}
              placeholder="e.g. Catalog Manager"
            />
          </Field>

          <Field label="Department" icon={Briefcase} isDark={isDarkMode}>
            <input
              type="text"
              value={profileData.department}
              onChange={(e) => setProfileData((p) => ({ ...p, department: e.target.value }))}
              className={inputCls(isDarkMode)}
              placeholder="e.g. Product Management"
            />
          </Field>

          <Field label="Location" icon={MapPin} isDark={isDarkMode}>
            <input
              type="text"
              value={profileData.location}
              onChange={(e) => setProfileData((p) => ({ ...p, location: e.target.value }))}
              className={inputCls(isDarkMode)}
              placeholder="e.g. Indore, India"
            />
          </Field>

          {/* Bio   full width */}
          <Field label="About / Bio" icon={Globe2} isDark={isDarkMode} full>
            <textarea
              rows={3}
              value={profileData.bio}
              onChange={(e) => setProfileData((p) => ({ ...p, bio: e.target.value }))}
              className={`${inputCls(isDarkMode)} resize-none`}
              placeholder="Short bio about yourself…"
            />
          </Field>
        </div>
      </motion.div>

      {/* ─── Account Info (read-only) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.16 }}
        className={`rounded-2xl border shadow-sm p-4 sm:p-6 ${cardBg}`}
      >
        <h3 className={`text-sm sm:text-[16px] font-bold mb-4 ${textPrimary}`}>Account Credentials</h3>
        <div className={`rounded-xl border ${isDarkMode ? "border-slate-700 bg-slate-900/40" : "border-slate-100 bg-slate-50"}`}>
          {[
            ["Admin ID", adminUser?.adminId || " ", true],
            ["Account Type", null, false],
            ["Access Level", "Catalog & Content", false],
          ].map(([key, val, mono], idx, arr) => (
            <div key={key}>
              <div className="flex items-center justify-between px-4 py-3">
                <span className={`text-base font-semibold ${textMuted}`}>{key}</span>
                {key === "Account Type" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#811331]/10 px-2.5 py-0.5 text-base font-bold text-[#811331]">
                    <Shield size={11} /> Admin
                  </span>
                ) : (
                  <span className={`${mono ? "font-mono" : "font-semibold"} text-base sm:text-sm ${textPrimary}`}>{val}</span>
                )}
              </div>
              {idx < arr.length - 1 && <div className={`border-t ${divider}`} />}
            </div>
          ))}
        </div>
        <p className={`mt-3 text-[16px] ${textMuted}`}>
          To change your Admin ID or password, contact a Super Admin.
        </p>
      </motion.div>
    </div>
  );
};

export default AdminProfile;
