import React, { useState } from "react";
import { app, db } from "../../../components/Firebase";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut as secondarySignOut } from "firebase/auth";
import { deleteDoc, doc, addDoc, setDoc, collection } from "firebase/firestore";
import { ShieldCheck, UserPlus, Trash2, Crown, Camera } from "lucide-react";
import { uploadToCloudinary } from "../../../config/cloudinary";
import { sendAdminCredentialsEmail } from "../../../services/emailService";

const AdminsTable = ({ adminsList = [], superAdminsList = [], onRefresh, isDarkMode = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adminId, setAdminId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const url = await uploadToCloudinary(file);
      setPhotoURL(url);
    } catch (err) {
      console.error("Photo upload failed:", err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!email || !password || !adminId) return;
    setIsSubmitting(true);
    setEmailStatus(null);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanAdminId = adminId.trim();
      const cleanName = displayName.trim() || cleanAdminId;
      const cleanPassword = password.trim();

      // 1. Pre-create Firebase Auth user using secondary app instance so SuperAdmin is NOT logged out
      let newUid = null;
      try {
        const secondaryApp = getApps().find((a) => a.name === "SecondaryAdminCreator") ||
          initializeApp(app.options, "SecondaryAdminCreator");
        const secondaryAuth = getAuth(secondaryApp);
        const cred = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, cleanPassword);
        newUid = cred.user.uid;
        await secondarySignOut(secondaryAuth);
      } catch (authErr) {
        console.warn("Could not pre-create Firebase Auth user (may already exist):", authErr?.message);
      }

      // 2. Save to admins collection (keyed by newUid if created, otherwise auto doc)
      const adminDocPayload = {
        adminId: cleanAdminId,
        displayName: cleanName,
        email: cleanEmail,
        password: cleanPassword,
        role: "Admin",
        photoURL: photoURL || "",
        uid: newUid || "",
        createdAt: new Date().toISOString()
      };

      if (newUid) {
        await setDoc(doc(db, "admins", newUid), adminDocPayload);
      } else {
        await addDoc(collection(db, "admins"), adminDocPayload);
      }

      // Dispatch Nodemailer email silently via serverless API (/api/send-admin-credentials)
      let apiResult = null;
      try {
        apiResult = await sendAdminCredentialsEmail({
          email: cleanEmail,
          adminId: cleanAdminId,
          displayName: cleanName,
          password: cleanPassword,
        });
      } catch (apiErr) {
        console.warn("Nodemailer API notice:", apiErr?.message);
      }

      setEmailStatus(
        `New Admin account created successfully! Login credentials emailed to ${cleanEmail}.`
      );
      setTimeout(() => setEmailStatus(null), 8000);

      // Reset form & close modal
      setAdminId("");
      setDisplayName("");
      setEmail("");
      setPassword("");
      setPhotoURL("");
      setIsModalOpen(false);

      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to create admin:", err);
      alert("Error creating account: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSuperAdmin = async (id) => {
    if (window.confirm("Are you sure you want to revoke Super Admin access for this account?")) {
      await deleteDoc(doc(db, "superadmins", id));
      if (onRefresh) onRefresh();
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (window.confirm("Are you sure you want to revoke Admin access for this account?")) {
      await deleteDoc(doc(db, "admins", id));
      if (onRefresh) onRefresh();
    }
  };

  const allAccounts = [
    ...superAdminsList.map((sa) => ({ ...sa, accountType: "superadmin" })),
    ...adminsList.map((a) => ({ ...a, accountType: "admin" }))
  ];

  return (
    <section className="space-y-6 font-sans">
      {emailStatus && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl font-semibold text-base shadow-sm">
          {emailStatus}
        </div>
      )}

      <div
        className={`rounded-3xl border shadow-sm overflow-hidden ${isDarkMode ? "bg-[#1e2230] border-slate-700/60" : "bg-white border-slate-100"
          }`}
      >
        <div className="px-6 py-6 sm:px-8 border-b border-slate-100/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              <ShieldCheck size={22} className="text-[#811331]" />
              Administrators Control & Accounts Manager
            </h2>
            <p className={`text-base font-medium mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Manage active store administrators, create new admins, and dispatch login credentials directly to their email.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#811331] text-white rounded-xl text-base font-bold shadow-lg shadow-[#811331]/20 hover:bg-[#9d1a3d] transition-all active:scale-95"
            >
              <UserPlus size={16} />
              <span>Create Admin</span>
            </button>
            <span className="px-3.5 py-1.5 rounded-full bg-[#811331]/10 text-[#811331] text-[16px] font-bold uppercase tracking-wider">
              {allAccounts.length} Accounts
            </span>
          </div>
        </div>

        {/* Accounts Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className={`text-[16px] font-bold uppercase tracking-wider border-b border-slate-100/10 ${isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-400"
                  }`}
              >
                <th className="px-8 py-5">Account Name / ID</th>
                <th className="px-6 py-5">Email Address</th>
                <th className="px-6 py-5">Role Level</th>
                <th className="px-6 py-5">Access Password</th>
                <th className="px-6 py-5">Created On</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/10 text-base font-medium">
              {allAccounts.map((acc) => {
                const isSuper = acc.accountType === "superadmin" || acc.role === "superadmin";
                const createdDate = acc.createdAt
                  ? new Date(acc.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })
                  : "Active";

                return (
                  <tr
                    key={acc.firestoreId || acc.id}
                    className={`transition-colors ${isDarkMode ? "hover:bg-slate-800/40" : "hover:bg-slate-50/80"}`}
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        {acc.photoURL ? (
                          <img
                            src={acc.photoURL}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-base ${isSuper
                                ? "bg-gradient-to-tr from-[#811331] to-[#b32049] text-white"
                                : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white"
                              }`}
                          >
                            {(acc.displayName || acc.adminId || acc.email || "A").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className={`font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                            {acc.displayName || acc.adminId || "Administrator"}
                          </p>
                          <p className={`text-[16px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                            ID: {acc.adminId || acc.id?.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-5 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                      {acc.email || "No Email"}
                    </td>
                    <td className="px-6 py-5">
                      {isSuper ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#811331]/20 to-amber-500/20 text-[#811331] dark:text-amber-400 border border-[#811331]/30 font-bold text-[16px] uppercase tracking-wider">
                          <Crown size={12} className="text-amber-500" />
                          Super Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 font-bold text-[16px] uppercase tracking-wider">
                          <ShieldCheck size={12} />
                          Admin
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {acc.password || "••••••••"}
                    </td>
                    <td className={`px-6 py-5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      {createdDate}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                        onClick={() =>
                          isSuper
                            ? handleDeleteSuperAdmin(acc.firestoreId || acc.id)
                            : handleDeleteAdmin(acc.firestoreId || acc.id)
                        }
                        className="p-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-100 dark:border-red-900/50 transition-all"
                        title="Revoke Access"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {allAccounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-16 text-center">
                    <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200 dark:border-slate-700 text-slate-400">
                      <ShieldCheck size={28} />
                    </div>
                    <p className={`text-base font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                      No administrative accounts registered
                    </p>
                    <p className="text-base text-slate-400 mt-1">
                      Click 'Create Admin' above to grant access to a store manager.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

          <div
            className={`relative z-10 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col ${isDarkMode ? "bg-[#1a1d26] text-white" : "bg-white text-slate-900"
              }`}
          >
            <div
              className={`px-6 py-5 border-b flex items-center justify-between ${isDarkMode ? "border-slate-700" : "border-slate-100"
                }`}
            >
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <ShieldCheck size={20} className="text-[#811331]" />
                  Create Admin Account
                </h3>
                <p className="text-base text-slate-400 mt-0.5">
                  Grant store permissions and email credentials to the new admin
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-6 space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-blue-700 dark:text-blue-300 font-semibold text-sm flex items-center gap-2">
                <ShieldCheck size={18} />
                <span>Account Role Level: <strong>Store Administrator (Admin)</strong></span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[16px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Admin ID / Username
                  </label>
                  <input
                    type="text"
                    required
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    placeholder="e.g. admin_alex"
                    className={`w-full px-4 py-2.5 rounded-xl text-base outline-none border ${isDarkMode
                        ? "bg-slate-800 border-slate-700 text-white"
                        : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                  />
                </div>

                <div>
                  <label className="block text-[16px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className={`w-full px-4 py-2.5 rounded-xl text-base outline-none border ${isDarkMode
                        ? "bg-slate-800 border-slate-700 text-white"
                        : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[16px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  New Admin Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin.alex@velouraz.com"
                  className={`w-full px-4 py-2.5 rounded-xl text-base outline-none border ${isDarkMode
                      ? "bg-slate-800 border-slate-700 text-white"
                      : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                />
              </div>

              <div>
                <label className="block text-[16px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Access Password
                </label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set login password"
                  className={`w-full px-4 py-2.5 rounded-xl text-base outline-none border font-mono ${isDarkMode
                      ? "bg-slate-800 border-slate-700 text-white"
                      : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                />
              </div>

              <div>
                <label className="block text-[16px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Profile Photo URL (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    placeholder="https://..."
                    className={`flex-1 px-4 py-2.5 rounded-xl text-base outline-none border ${isDarkMode
                        ? "bg-slate-800 border-slate-700 text-white"
                        : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                  />
                  <label className="flex items-center justify-center px-3.5 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-800">
                    <Camera size={16} />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                </div>
                {uploadingPhoto && (
                  <p className="text-[16px] text-amber-600 font-semibold animate-pulse mt-1">
                    Uploading image...
                  </p>
                )}
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#811331] hover:bg-[#9d1a3d] text-white font-bold text-base rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Admin & Mail Credentials"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminsTable;
