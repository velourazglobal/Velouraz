import React, { useState, useEffect } from "react";
import { useAuth } from "../components/useAuth";
import { db, auth } from "../components/Firebase";
import { updateProfile } from "firebase/auth";
import {
  doc, getDoc, setDoc, updateDoc, collection, getDocs,
  query, where, orderBy, serverTimestamp
} from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Package, Heart, LogOut, ChevronRight, Settings,
  ShoppingBag, CreditCard, MapPin, Bell, Award, Crown,
  ArrowRight, ArrowLeft, FileText, Truck, Search, Plus, Edit2, Trash2,
  CheckCircle2, Clock, Printer, X, ShieldCheck, Sparkles, Phone, Mail, Map as MapIcon, RefreshCw, Download,
  Home, Building2, Check
} from "lucide-react";

import { generateInvoicePDF } from "../utils/invoice";
import { syncUserGuestOrders } from "../services/otpService";

const formatOrderDate = (order) => {
  if (!order) return new Date().toLocaleDateString("en-IN");
  const val = order.createdAt || order.orderDate;
  if (!val) return new Date().toLocaleDateString("en-IN");
  if (val?.seconds) return new Date(val.seconds * 1000).toLocaleDateString("en-IN");
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date().toLocaleDateString("en-IN") : d.toLocaleDateString("en-IN");
  }
  return new Date().toLocaleDateString("en-IN");
};

const Account = () => {
  const { user, loading: authLoading, logout, deleteAccount, changePassword } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard' | 'orders' | 'track' | 'addresses' | 'profile' | 'invoices'
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  // Address State
  const [addresses, setAddresses] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddrIndex, setEditingAddrIndex] = useState(null);
  const [addrForm, setAddrForm] = useState({
    type: "Home",
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false
  });

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({
    displayName: "",
    phone: "",
    email: ""
  });
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  // Change Password State
  const [passForm, setPassForm] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [passLoading, setPassLoading] = useState(false);
  const [passMessage, setPassMessage] = useState("");
  const [passError, setPassError] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError("");
    setPassMessage("");
    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassError("New passwords do not match.");
      return;
    }
    if (passForm.newPassword.length < 6) {
      setPassError("Password must be at least 6 characters long.");
      return;
    }
    setPassLoading(true);
    try {
      await changePassword(passForm.newPassword);
      setPassMessage("Password updated successfully!");
      setPassForm({ newPassword: "", confirmPassword: "" });
    } catch (err) {
      console.error("Change password error:", err);
      setPassError(err.message || "Failed to update password.");
    } finally {
      setPassLoading(false);
    }
  };

  // ── Profile / address / cart / wishlist loader ────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }

    const loadProfileData = async () => {
      setLoading(true);
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const d = userSnap.data();
          setUserData(d);
          setProfileForm({
            displayName: d.displayName || user.displayName || "",
            phone: d.phone || d.phoneNumber || "",
            email: d.email || user.email || ""
          });
          const savedAddrs = d.savedAddresses || [];
          if (savedAddrs.length === 0 && d.defaultAddress) {
            savedAddrs.push({ ...d.defaultAddress, isDefault: true, type: "Home" });
          }
          setAddresses(savedAddrs);
        } else {
          setProfileForm({
            displayName: user.displayName || "",
            phone: "",
            email: user.email || ""
          });
        }
      } catch (err) {
        console.error("Error loading profile data:", err);
      } finally {
        setLoading(false);
      }

      // Cart & Wishlist counts (independent of orders)
      try {
        const cartSnap = await getDocs(collection(db, "users", user.uid, "cart"));
        const wishlistSnap = await getDocs(collection(db, "users", user.uid, "wishlist"));
        setCartCount(cartSnap.size);
        setWishlistCount(wishlistSnap.size);
      } catch (e) {
        console.warn("Cart/wishlist count notice:", e?.message);
      }
    };

    loadProfileData();
  }, [user, authLoading, navigate]);

  // ── Orders loader (identical strategy to Orders.jsx) ──────────────────────
  useEffect(() => {
    if (authLoading || !user) return;

    const fetchOrders = async () => {
      try {
        const cleanEmail = (user.email || "").trim().toLowerCase();
        console.log("[Account DEBUG] fetchOrders start | uid:", user.uid, "| email:", cleanEmail);

        // Step 1: sync guest orders
        if (user.uid && cleanEmail) {
          try {
            const synced = await syncUserGuestOrders(user.uid, cleanEmail);
            console.log("[Account DEBUG] syncUserGuestOrders linked:", synced, "orders");
          } catch (syncErr) {
            console.warn("[Account] Guest order sync notice:", syncErr?.message);
          }
        }

        const ordersRef = collection(db, "orders");
        const orderMap = new Map();

        // Query A: by userId
        try {
          const q1 = query(ordersRef, where("userId", "==", user.uid));
          const snap1 = await getDocs(q1);
          console.log("[Account DEBUG] Query by userId returned:", snap1.size, "docs");
          snap1.docs.forEach((docSnap) => {
            orderMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
          });
        } catch (e1) {
          console.error("[Account] Order query by userId FAILED:", e1?.message, e1);
        }

        // Query B: by email
        if (cleanEmail) {
          try {
            const q2 = query(ordersRef, where("email", "==", cleanEmail));
            const snap2 = await getDocs(q2);
            console.log("[Account DEBUG] Query by email returned:", snap2.size, "docs");
            snap2.docs.forEach((docSnap) => {
              orderMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
            });
          } catch (e2) {
            console.error("[Account] Order query by email FAILED:", e2?.message, e2);
          }
        }

        const list = Array.from(orderMap.values());
        console.log("[Account DEBUG] Total unique orders to display:", list.length);

        const parseDate = (val) => {
          if (!val) return 0;
          if (typeof val === "number") return val;
          if (val?.seconds) return val.seconds * 1000;
          const p = new Date(val).getTime();
          return isNaN(p) ? 0 : p;
        };
        list.sort((a, b) => parseDate(b.createdAt || b.orderDate) - parseDate(a.createdAt || a.orderDate));
        setOrders(list);
        console.log("[Account DEBUG] setOrders called with", list.length, "orders");
      } catch (err) {
        console.error("[Account] Error fetching orders:", err);
      }
    };

    fetchOrders();
  }, [user, authLoading]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      navigate("/");
    } catch (error) {
      alert("Failed to delete account. Please re-authenticate and try again.");
    }
  };

  // Profile Update Handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileUpdating(true);
    setProfileMessage("");
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: profileForm.displayName
        });
      }
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        displayName: profileForm.displayName,
        phone: profileForm.phone,
        email: profileForm.email,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setUserData(prev => ({
        ...prev,
        displayName: profileForm.displayName,
        phone: profileForm.phone
      }));
      setProfileMessage("Profile details updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      setProfileMessage("Failed to update profile. Please try again.");
    } finally {
      setProfileUpdating(false);
    }
  };

  // Address Handlers
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    let updated = [...addresses];

    if (addrForm.isDefault) {
      updated = updated.map(a => ({ ...a, isDefault: false }));
    }

    if (editingAddrIndex !== null) {
      updated[editingAddrIndex] = addrForm;
    } else {
      updated.push(addrForm);
    }

    setAddresses(updated);
    setShowAddressModal(false);
    setEditingAddrIndex(null);

    // Save to Firestore
    try {
      const userRef = doc(db, "users", user.uid);
      const defaultAddr = updated.find(a => a.isDefault) || updated[0] || null;
      await setDoc(userRef, {
        savedAddresses: updated,
        defaultAddress: defaultAddr,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error("Error saving address:", err);
    }
  };

  const handleDeleteAddress = async (index) => {
    const updated = addresses.filter((_, i) => i !== index);
    setAddresses(updated);
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        savedAddresses: updated,
        defaultAddress: updated[0] || null
      }, { merge: true });
    } catch (err) {
      console.error("Error deleting address:", err);
    }
  };

  const openEditAddress = (index) => {
    setEditingAddrIndex(index);
    setAddrForm(addresses[index]);
    setShowAddressModal(true);
  };

  const openNewAddress = () => {
    setEditingAddrIndex(null);
    setAddrForm({
      type: "Home",
      name: userData?.displayName || user?.displayName || "",
      phone: userData?.phone || "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      isDefault: addresses.length === 0
    });
    setShowAddressModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFAF5] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-2 border-[#2e0e43] border-t-transparent rounded-full animate-spin" />
        <p className="text-base uppercase tracking-[0.3em] font-bold text-[#2e0e43]">Loading Your Atelier Profile</p>
      </div>
    );
  }

  const sidebarLinks = [
    { id: "dashboard", label: "Dashboard", icon: Crown },
    { id: "orders", label: "Order History", icon: Package, badge: orders.length },
    { id: "track", label: "Track Order", icon: Truck },
    { id: "addresses", label: "Saved Addresses", icon: MapPin, badge: addresses.length },
    { id: "invoices", label: "Invoices & Receipts", icon: FileText },
    { id: "profile", label: "Account Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#FDFAF5] font-sans text-[#2A2623] pt-44 sm:pt-52 lg:pt-56 pb-20">

      {/* Top User-Friendly Back Button & Navigation Bar */}
      <div className="max-w-[1340px] mx-auto px-4 sm:px-8 mb-6 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white border border-[#D8CBBE]/60 text-[#2A2623] hover:bg-[#2e0e43] hover:text-white hover:border-[#2e0e43] transition-all duration-300 shadow-sm font-bold text-xs uppercase tracking-widest group cursor-pointer"
        >
          <ArrowLeft size={16} className="text-[#2e0e43] group-hover:text-white group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-[#D8CBBE]/40 shadow-xs">
          <Link
            to="/"
            className="text-xs uppercase tracking-widest font-bold text-[#7B6D63] hover:text-[#2e0e43] transition-colors"
          >
            Home
          </Link>
          <span className="text-[#D8CBBE]">•</span>
          <Link
            to="/shop"
            className="text-xs uppercase tracking-widest font-bold text-[#7B6D63] hover:text-[#2e0e43] transition-colors"
          >
            Shop Collection
          </Link>
          <span className="text-[#D8CBBE]">•</span>
          <span className="text-xs uppercase tracking-widest font-bold text-[#2e0e43]">
            My Account
          </span>
        </div>
      </div>

      {/* Top Banner Header */}
      <div className="max-w-[1340px] mx-auto px-4 sm:px-8 mb-8">
        <div className="bg-[#0E0B09] rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl border border-[#C8A97A]/20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#2e0e43]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-5 z-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#2e0e43] border-2 border-[#C8A97A] flex items-center justify-center text-white text-2xl font-serif font-bold shadow-lg">
              {userData?.displayName ? userData.displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[16px] tracking-[0.25em] font-bold uppercase text-[#C8A97A]">Velouraz Privé Member</span>
                <Crown size={14} className="text-[#C8A97A]" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif tracking-tight">
                {userData?.displayName || user?.displayName || "Valued Client"}
              </h1>
              <p className="text-base text-white/50">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 z-10 w-full md:w-auto">
            <Link
              to="/wishlist"
              className="flex-1 md:flex-none px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-base font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
            >
              <Heart size={14} className="text-[#C8A97A]" /> Wishlist ({wishlistCount})
            </Link>
            <Link
              to="/cart"
              className="flex-1 md:flex-none px-4 py-2.5 bg-[#2e0e43] hover:bg-[#921438] rounded-xl text-base font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
            >
              <ShoppingBag size={14} /> Cart ({cartCount})
            </Link>
          </div>
        </div>
      </div>

      {/* Main Dashboard Layout */}
      <div className="max-w-[1340px] mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Sidebar Navigation */}
          <aside className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-[#D8CBBE]/40 p-4 shadow-sm space-y-1 sticky top-28">
              <div className="px-3 py-2 border-b border-[#D8CBBE]/20 mb-2">
                <p className="text-[16px] uppercase tracking-[0.25em] font-bold text-[#7B6D63]">Account Menu</p>
              </div>

              {sidebarLinks.map((link) => {
                const Icon = link.icon;
                const active = activeTab === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => setActiveTab(link.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-base font-bold transition-all ${active
                        ? "bg-[#2e0e43] text-white shadow-sm"
                        : "text-[#2A2623]/80 hover:bg-[#FDFAF5] hover:text-[#2e0e43]"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={16} className={active ? "text-white" : "text-[#2e0e43]"} />
                      <span>{link.label}</span>
                    </div>
                    {link.badge !== undefined && link.badge > 0 && (
                      <span className={`text-[16px] px-2 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-[#D8CBBE]/30 text-[#7B6D63]"}`}>
                        {link.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="pt-4 border-t border-[#D8CBBE]/30 mt-4 space-y-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold text-red-600 hover:bg-red-50 transition-all"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </div>
          </aside>

          {/* Tab Content Area */}
          <main className="lg:col-span-9 min-w-0">
            {activeTab !== "dashboard" && (
              <button
                onClick={() => setActiveTab("dashboard")}
                className="inline-flex items-center gap-2 mb-4 px-3.5 py-1.5 rounded-full bg-white border border-[#D8CBBE]/50 text-xs font-bold uppercase tracking-wider text-[#2e0e43] hover:bg-[#2e0e43] hover:text-white transition-all shadow-xs group cursor-pointer"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform text-[#2e0e43] group-hover:text-white" />
                <span>Back to Dashboard</span>
              </button>
            )}

            <AnimatePresence mode="wait">

              {/* TAB 1: DASHBOARD OVERVIEW */}
              {activeTab === "dashboard" && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Quick Overview Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-2xl border border-[#D8CBBE]/40 shadow-sm space-y-2">
                      <div className="flex justify-between items-center text-[#2e0e43]">
                        <Package size={22} />
                        <span className="text-[16px] uppercase font-bold tracking-widest text-[#7B6D63]">Orders</span>
                      </div>
                      <p className="text-2xl font-serif font-bold text-[#2A2623]">{orders.length}</p>
                      <p className="text-[16px] text-[#7B6D63]">Total completed orders</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-[#D8CBBE]/40 shadow-sm space-y-2">
                      <div className="flex justify-between items-center text-[#2e0e43]">
                        <MapPin size={22} />
                        <span className="text-[16px] uppercase font-bold tracking-widest text-[#7B6D63]">Saved Address</span>
                      </div>
                      <p className="text-2xl font-serif font-bold text-[#2A2623]">{addresses.length}</p>
                      <p className="text-[16px] text-[#7B6D63]">Locations for fast checkout</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-[#D8CBBE]/40 shadow-sm space-y-2">
                      <div className="flex justify-between items-center text-[#2e0e43]">
                        <Crown size={22} />
                        <span className="text-[16px] uppercase font-bold tracking-widest text-[#7B6D63]">Status</span>
                      </div>
                      <p className="text-2xl font-serif font-bold text-[#2e0e43]">Privé Gold</p>
                      <p className="text-[16px] text-[#7B6D63]">Insured Express Shipping</p>
                    </div>
                  </div>

                  {/* Recent Orders Overview */}
                  <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#D8CBBE]/40 shadow-sm space-y-6">
                    <div className="flex justify-between items-center border-b border-[#D8CBBE]/30 pb-4">
                      <div>
                        <h3 className="font-serif text-xl font-bold text-[#2A2623]">Recent Purchases</h3>
                        <p className="text-base text-[#7B6D63]">Latest order history and tracking status</p>
                      </div>
                      <button
                        onClick={() => setActiveTab("orders")}
                        className="text-base font-bold text-[#2e0e43] hover:underline flex items-center gap-1 uppercase tracking-wider"
                      >
                        View All ({orders.length}) <ArrowRight size={12} />
                      </button>
                    </div>

                    {orders.length > 0 ? (
                      <div className="space-y-4">
                        {orders.slice(0, 3).map((order) => (
                          <div
                            key={order.id}
                            className="p-4 rounded-xl bg-[#FDFAF5] border border-[#D8CBBE]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-white border border-[#D8CBBE]/40 flex items-center justify-center text-[#2e0e43]">
                                <Package size={20} />
                              </div>
                              <div>
                                <p className="text-base font-bold text-[#2A2623] font-mono">#{order.orderNumber || order.id?.slice(0, 10).toUpperCase()}</p>
                                <p className="text-[16px] text-[#7B6D63]">
                                  {order.items?.length || 1} item(s) • {formatOrderDate(order)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-4">
                              <span className="text-sm font-bold text-[#2e0e43]">₹{Number(order.total || order.totalAmount || 0).toLocaleString("en-IN")}</span>
                              <button
                                onClick={() => { setSelectedOrder(order); setShowOrderModal(true); }}
                                className="px-3 py-1.5 border border-[#2e0e43] text-[#2e0e43] text-[16px] font-bold uppercase rounded-lg hover:bg-[#2e0e43] hover:text-white transition-all"
                              >
                                Details
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 space-y-3">
                        <ShoppingBag size={36} className="mx-auto text-[#2e0e43]/30" />
                        <p className="text-sm font-serif text-[#7B6D63]">No recent orders found</p>
                        <Link to="/shop" className="inline-block px-5 py-2.5 bg-[#2e0e43] text-white text-base font-bold uppercase tracking-wider rounded-xl">
                          Discover Shop
                        </Link>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* TAB 2: ORDER HISTORY */}
              {activeTab === "orders" && (
                <motion.div
                  key="orders"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-white p-6 sm:p-8 rounded-2xl border border-[#D8CBBE]/40 shadow-sm space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8CBBE]/30 pb-4">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-[#2A2623]">Order History</h3>
                      <p className="text-base text-[#7B6D63]">Full chronological archive of your luxury orders</p>
                    </div>
                    <span className="text-base font-semibold text-[#2e0e43] bg-[#2e0e43]/10 px-3 py-1 rounded-full w-fit">
                      {orders.length} Total Orders
                    </span>
                  </div>

                  {orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="p-5 rounded-2xl bg-[#FDFAF5] border border-[#D8CBBE]/40 space-y-4 hover:border-[#2e0e43]/40 transition-all"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D8CBBE]/30 pb-3">
                            <div>
                              <span className="text-[16px] font-bold uppercase tracking-widest text-[#7B6D63]">Order Reference</span>
                              <p className="text-base font-bold text-[#2A2623] font-mono">#{order.orderNumber || order.id}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 bg-[#2e0e43]/10 text-[#2e0e43] text-[16px] font-bold uppercase tracking-wider rounded-full">
                                {order.orderStatus || order.status || "Processing"}
                              </span>
                              <span className="text-base text-[#7B6D63]">
                                {formatOrderDate(order)}
                              </span>
                            </div>
                          </div>

                          {/* Items Preview */}
                          <div className="flex flex-wrap gap-3 items-center">
                            {order.items?.map((item, i) => (
                              <div key={i} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-[#D8CBBE]/30">
                                <div className="w-10 h-10 rounded overflow-hidden bg-black/5 flex-shrink-0">
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="max-w-[140px]">
                                  <p className="text-[16px] font-semibold text-[#2A2623] truncate">{item.name}</p>
                                  <p className="text-[16px] text-[#7B6D63]">Qty: {item.quantity || 1}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Bottom Action Bar */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#D8CBBE]/20">
                            <div>
                              <span className="text-[16px] text-[#7B6D63] uppercase font-bold">Total Amount</span>
                              <p className="text-sm font-bold text-[#2e0e43]">₹{Number(order.total || order.totalAmount || 0).toLocaleString("en-IN")}</p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => { setSelectedOrder(order); setShowOrderModal(true); }}
                                className="px-4 py-2 border border-[#2A2623] text-[#2A2623] text-base font-bold uppercase tracking-wider rounded-xl hover:bg-[#2A2623] hover:text-white transition-all"
                              >
                                Details
                              </button>
                              <button
                                onClick={() => generateInvoicePDF(order)}
                                className="px-4 py-2 bg-[#2e0e43] text-white text-base font-bold uppercase tracking-wider rounded-xl hover:bg-[#2A2623] transition-all flex items-center gap-1.5"
                              >
                                <Download size={12} /> PDF Invoice
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 space-y-4">
                      <Package size={42} className="mx-auto text-[#2e0e43]/30" />
                      <p className="text-base font-serif text-[#7B6D63]">You haven't placed any orders yet.</p>
                      <Link to="/shop" className="inline-block px-6 py-3 bg-[#2e0e43] text-white text-base font-bold uppercase tracking-widest rounded-xl">
                        Shop Now
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB 3: TRACK ORDER */}
              {activeTab === "track" && (
                <motion.div
                  key="track"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-white p-6 sm:p-8 rounded-2xl border border-[#D8CBBE]/40 shadow-sm space-y-8"
                >
                  <div className="border-b border-[#D8CBBE]/30 pb-4">
                    <h3 className="font-serif text-xl font-bold text-[#2A2623]">Track Your Order</h3>
                    <p className="text-base text-[#7B6D63]">Live delivery status & progress tracking</p>
                  </div>

                  {orders.length > 0 ? (
                    <div className="space-y-8">
                      {/* Active Order Card */}
                      {(() => {
                        const activeOrder = orders[0];
                        return (
                          <div className="p-6 rounded-2xl bg-[#FDFAF5] border border-[#D8CBBE]/40 space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[#D8CBBE]/30 pb-4">
                              <div>
                                <p className="text-[16px] uppercase font-bold text-[#7B6D63] tracking-widest">Active Order ID</p>
                                <p className="text-sm font-bold font-mono text-[#2A2623]">#{activeOrder.id}</p>
                              </div>
                              <div>
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-base font-bold rounded-full">
                                  Estimated Delivery: In 3-5 Days
                                </span>
                              </div>
                            </div>

                            {/* Tracking Timeline */}
                            <div className="py-4">
                              <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                {[
                                  { label: "Order Placed", desc: "Confirmed", done: true },
                                  { label: "Artisan Crafting", desc: "Quality Check", done: true },
                                  { label: "Dispatched", desc: "Express Air Courier", done: true },
                                  { label: "Out for Delivery", desc: "Arriving Soon", done: false },
                                  { label: "Delivered", desc: "Parcel Handover", done: false },
                                ].map((step, idx) => (
                                  <div key={idx} className="flex md:flex-col items-center gap-3 relative z-10">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base font-bold ${step.done ? "bg-[#2e0e43] text-white" : "bg-gray-200 text-gray-400"
                                      }`}>
                                      {step.done ? <CheckCircle2 size={16} /> : idx + 1}
                                    </div>
                                    <div className="text-left md:text-center">
                                      <p className="text-base font-bold text-[#2A2623]">{step.label}</p>
                                      <p className="text-[16px] text-[#7B6D63]">{step.desc}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-16 text-[#7B6D63]">
                      No active orders to track. Place an order to see live tracking updates!
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB 4: SAVED ADDRESSES */}
              {activeTab === "addresses" && (
                <motion.div
                  key="addresses"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-white p-6 sm:p-8 rounded-2xl border border-[#D8CBBE]/40 shadow-sm space-y-6"
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#D8CBBE]/30 pb-4">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-[#2A2623]">Saved Delivery Addresses</h3>
                      <p className="text-base text-[#7B6D63]">Manage address book for fast express checkout</p>
                    </div>
                    <button
                      onClick={openNewAddress}
                      className="px-4 py-2.5 bg-[#2e0e43] text-white text-base font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 hover:bg-[#2A2623] transition-all"
                    >
                      <Plus size={14} /> Add New Address
                    </button>
                  </div>

                  {addresses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {addresses.map((addr, idx) => (
                        <div
                          key={idx}
                          className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${addr.isDefault ? "border-[#2e0e43] bg-[#2e0e43]/5 shadow-sm" : "border-[#D8CBBE]/50 bg-[#FDFAF5]"
                            }`}
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[16px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded bg-[#2A2623] text-white">
                                {addr.type || "Home"}
                              </span>
                              {addr.isDefault && (
                                <span className="text-[16px] font-bold uppercase tracking-widest text-[#2e0e43] flex items-center gap-1">
                                  <CheckCircle2 size={12} /> Default
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-[#2A2623]">{addr.name}</h4>
                            <p className="text-base text-[#7B6D63] leading-relaxed">{addr.address}, {addr.city}, {addr.state} - {addr.pincode}</p>
                            <p className="text-base text-[#7B6D63] font-semibold">Phone: {addr.phone}</p>
                          </div>

                          <div className="flex items-center gap-3 pt-3 border-t border-[#D8CBBE]/30">
                            <button
                              onClick={() => openEditAddress(idx)}
                              className="text-base font-bold text-[#2e0e43] flex items-center gap-1 hover:underline"
                            >
                              <Edit2 size={12} /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(idx)}
                              className="text-base font-bold text-red-600 flex items-center gap-1 hover:underline ml-auto"
                            >
                              <Trash2 size={12} /> Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-[#7B6D63] space-y-3">
                      <MapPin size={36} className="mx-auto text-[#2e0e43]/30" />
                      <p className="text-sm font-serif">No saved addresses yet.</p>
                      <button
                        onClick={openNewAddress}
                        className="px-5 py-2.5 bg-[#2e0e43] text-white text-base font-bold uppercase tracking-wider rounded-xl"
                      >
                        Add Your Address
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB 5: INVOICES */}
              {activeTab === "invoices" && (
                <motion.div
                  key="invoices"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-white p-6 sm:p-8 rounded-2xl border border-[#D8CBBE]/40 shadow-sm space-y-6"
                >
                  <div className="border-b border-[#D8CBBE]/30 pb-4">
                    <h3 className="font-serif text-xl font-bold text-[#2A2623]">Invoices & Tax Receipts</h3>
                    <p className="text-base text-[#7B6D63]">Official tax invoices for your jewelry acquisitions</p>
                  </div>

                  {orders.length > 0 ? (
                    <div className="space-y-3">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="p-4 rounded-xl bg-[#FDFAF5] border border-[#D8CBBE]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <FileText size={22} className="text-[#2e0e43]" />
                            <div>
                              <p className="text-base font-bold text-[#2A2623] font-mono">Invoice #{order.id.slice(0, 10).toUpperCase()}</p>
                              <p className="text-[16px] text-[#7B6D63]">
                                Issued: {new Date(order.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString("en-IN")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-4">
                            <span className="text-base font-bold text-[#2e0e43]">₹{Number(order.total || 0).toLocaleString()}</span>
                            <button
                              onClick={() => { setInvoiceOrder(order); setShowInvoiceModal(true); }}
                              className="px-4 py-2 bg-[#2e0e43] text-white text-base font-bold uppercase rounded-lg hover:bg-[#2A2623] transition-all flex items-center gap-1.5"
                            >
                              <Printer size={12} /> View & Print
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-[#7B6D63]">
                      No invoices available yet.
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB 6: PROFILE SETTINGS */}
              {activeTab === "profile" && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-white p-6 sm:p-8 rounded-2xl border border-[#D8CBBE]/40 shadow-sm space-y-6"
                >
                  <div className="border-b border-[#D8CBBE]/30 pb-4">
                    <h3 className="font-serif text-xl font-bold text-[#2A2623]">Account & Contact Settings</h3>
                    <p className="text-base text-[#7B6D63]">Update display name, phone number, and preferences</p>
                  </div>

                  {profileMessage && (
                    <div className="p-3 bg-[#2e0e43]/10 border border-[#2e0e43]/30 text-[#2e0e43] rounded-xl text-base font-semibold">
                      {profileMessage}
                    </div>
                  )}

                  <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
                    <div className="space-y-1.5">
                      <label className="text-[16px] font-bold uppercase tracking-wider text-[#7B6D63]">Full Name</label>
                      <input
                        type="text"
                        value={profileForm.displayName}
                        onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                        className="w-full bg-[#FDFAF5] border border-[#D8CBBE]/60 rounded-xl px-4 py-3 text-base outline-none focus:border-[#2e0e43] transition-all font-medium text-[#2A2623]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[16px] font-bold uppercase tracking-wider text-[#7B6D63]">Mobile Phone Number</label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full bg-[#FDFAF5] border border-[#D8CBBE]/60 rounded-xl px-4 py-3 text-base outline-none focus:border-[#2e0e43] transition-all font-medium text-[#2A2623]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[16px] font-bold uppercase tracking-wider text-[#7B6D63]">Email Address (Account ID)</label>
                      <input
                        type="email"
                        disabled
                        value={profileForm.email}
                        className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-base font-medium text-gray-500 cursor-not-allowed"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={profileUpdating}
                      className="px-6 py-3 bg-[#2e0e43] text-white text-base font-bold uppercase tracking-widest rounded-xl hover:bg-[#2A2623] transition-all cursor-pointer"
                    >
                      {profileUpdating ? "Saving Changes..." : "Save Profile Details"}
                    </button>
                  </form>

                  {/* Change Password Section */}
                  <div className="pt-6 border-t border-[#D8CBBE]/30 space-y-4 max-w-lg">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={20} className="text-[#2e0e43]" />
                      <h4 className="font-serif text-lg font-bold text-[#2A2623]">Security & Password Reset</h4>
                    </div>

                    {passMessage && (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <span>{passMessage}</span>
                      </div>
                    )}

                    {passError && (
                      <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm font-semibold flex items-center gap-2">
                        <X size={16} className="text-rose-600 shrink-0" />
                        <span>{passError}</span>
                      </div>
                    )}

                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[14px] font-bold uppercase tracking-wider text-[#7B6D63]">New Password</label>
                        <input
                          type="password"
                          required
                          value={passForm.newPassword}
                          onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                          placeholder="••••••••"
                          className="w-full bg-[#FDFAF5] border border-[#D8CBBE]/60 rounded-xl px-4 py-3 text-base outline-none focus:border-[#2e0e43] transition-all font-medium text-[#2A2623]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[14px] font-bold uppercase tracking-wider text-[#7B6D63]">Confirm New Password</label>
                        <input
                          type="password"
                          required
                          value={passForm.confirmPassword}
                          onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                          placeholder="••••••••"
                          className="w-full bg-[#FDFAF5] border border-[#D8CBBE]/60 rounded-xl px-4 py-3 text-base outline-none focus:border-[#2e0e43] transition-all font-medium text-[#2A2623]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={passLoading}
                        className="px-6 py-3 bg-[#2A2623] text-white text-sm font-bold uppercase tracking-widest rounded-xl hover:bg-[#2e0e43] transition-all cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        {passLoading ? "Updating Password..." : "Update Security Password"}
                      </button>
                    </form>
                  </div>

                  {/* Danger Zone */}
                  <div className="pt-6 border-t border-[#D8CBBE]/30">
                    <button
                      onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                      className="text-base font-bold text-red-600 hover:underline"
                    >
                      Deactivate Account
                    </button>
                    {showDeleteConfirm && (
                      <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
                        <p className="text-base text-red-700 font-semibold">Are you sure? This will delete your account permanently.</p>
                        <button
                          onClick={handleDeleteAccount}
                          className="px-4 py-2 bg-red-600 text-white text-base font-bold uppercase rounded-lg"
                        >
                          Confirm Permanent Delete
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* MODAL 1: ORDER DETAILS MODAL */}
      <AnimatePresence>
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOrderModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-10 border border-[#D8CBBE]/40 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center border-b border-[#D8CBBE]/30 pb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="px-3 py-1.5 rounded-full bg-[#F8F4EF] hover:bg-[#2e0e43] text-[#2e0e43] hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider group cursor-pointer"
                  >
                    <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span>Back</span>
                  </button>
                  <div>
                    <span className="text-[16px] font-bold uppercase tracking-widest text-[#2e0e43]">Order Breakdown</span>
                    <h3 className="font-serif text-xl font-bold font-mono">#{selectedOrder.id}</h3>
                  </div>
                </div>
                <button onClick={() => setShowOrderModal(false)} className="p-2 text-gray-400 hover:text-black">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                <h4 className="text-base font-bold uppercase tracking-wider text-[#7B6D63]">Items Purchased</h4>
                <div className="space-y-2 divide-y divide-[#D8CBBE]/20">
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} className="pt-2 flex items-center gap-3">
                      <img src={item.image} alt={item.name} className="w-12 h-12 rounded object-cover border border-[#D8CBBE]/30" />
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-[#2A2623] truncate">{item.name}</p>
                        <p className="text-[16px] text-[#7B6D63]">Qty: {item.quantity || 1}</p>
                      </div>
                      <span className="text-base font-bold text-[#2e0e43]">
                        ₹{(Number(item.price || 0) * (item.quantity || 1)).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#FDFAF5] p-4 rounded-xl border border-[#D8CBBE]/30 space-y-2 text-base text-[#7B6D63]">
                <h4 className="font-bold text-[#2A2623] uppercase tracking-wider text-[16px]">Shipping Details</h4>
                <p><span className="font-bold text-[#2A2623]">{selectedOrder.shippingDetails?.name}</span> ({selectedOrder.shippingDetails?.phone})</p>
                <p>{selectedOrder.shippingDetails?.address}, {selectedOrder.shippingDetails?.city}, {selectedOrder.shippingDetails?.state} - {selectedOrder.shippingDetails?.pincode}</p>
                <p className="pt-1 text-[16px]">Payment Method: <span className="font-bold text-[#2e0e43]">{selectedOrder.paymentMethod}</span></p>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-[#D8CBBE]/30">
                <span className="text-base font-bold uppercase tracking-wider text-[#7B6D63]">Grand Total</span>
                <span className="text-xl font-serif font-bold text-[#2e0e43]">₹{Number(selectedOrder.total || 0).toLocaleString()}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: TAX INVOICE MODAL */}
      <AnimatePresence>
        {showInvoiceModal && invoiceOrder && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInvoiceModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-10 border border-[#D8CBBE]/40 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <img src="/img/logo.png" alt="Velouraz" className="h-8" style={{ filter: 'brightness(0)' }} />
                  <div>
                    <p className="text-[16px] tracking-[0.3em] uppercase font-bold text-[#2e0e43]">Official Tax Invoice</p>
                    <p className="text-base font-bold text-gray-700 font-mono">Invoice #{invoiceOrder.id.slice(0, 12).toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => window.print()} className="p-2 text-base font-bold bg-[#2e0e43] text-white rounded-lg flex items-center gap-1">
                    <Printer size={14} /> Print
                  </button>
                  <button onClick={() => setShowInvoiceModal(false)} className="p-2 text-gray-400 hover:text-black">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Invoice Body */}
              <div className="space-y-6 text-base text-gray-700">
                <div className="grid grid-cols-2 gap-4 bg-[#FDFAF5] p-4 rounded-xl border border-[#D8CBBE]/30">
                  <div>
                    <p className="text-[16px] uppercase font-bold text-[#7B6D63]">Billed To</p>
                    <p className="font-bold text-gray-900">{invoiceOrder.shippingDetails?.name}</p>
                    <p>{invoiceOrder.shippingDetails?.address}</p>
                    <p>{invoiceOrder.shippingDetails?.city}, {invoiceOrder.shippingDetails?.pincode}</p>
                    <p>Phone: {invoiceOrder.shippingDetails?.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[16px] uppercase font-bold text-[#7B6D63]">Merchant</p>
                    <p className="font-bold text-[#2e0e43]">House of Velouraz</p>
                    <p>GSTIN: 07AAAAA0000A1Z5</p>
                    <p>Date: {new Date(invoiceOrder.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString("en-IN")}</p>
                    <p>Payment ID: {invoiceOrder.paymentId || "N/A"}</p>
                  </div>
                </div>

                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-[16px] uppercase tracking-wider text-gray-500 font-bold">
                      <th className="py-2">Item Description</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-right">Rate</th>
                      <th className="py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoiceOrder.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-3 font-semibold text-gray-900">{item.name}</td>
                        <td className="py-3 text-center">{item.quantity || 1}</td>
                        <td className="py-3 text-right">₹{Number(item.price || 0).toLocaleString()}</td>
                        <td className="py-3 text-right font-bold text-[#2e0e43]">₹{(Number(item.price || 0) * (item.quantity || 1)).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t border-gray-200 pt-3 space-y-1 text-right text-base">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold">₹{Number(invoiceOrder.subtotal || invoiceOrder.total).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (3% Jewellery GST Included):</span>
                    <span className="font-semibold">Inclusive</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-[#2e0e43] pt-2 border-t">
                    <span>Total Amount Paid:</span>
                    <span>₹{Number(invoiceOrder.total || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: COMPACT LUXURY ADD/EDIT ADDRESS MODAL */}
      <AnimatePresence>
        {showAddressModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddressModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full relative z-10 border border-[#D8CBBE]/50 shadow-2xl space-y-4"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-[#D8CBBE]/30 pb-3">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-[#C8A46A]" />
                  <h3 className="font-serif text-lg font-bold text-[#2e0e43]">
                    {editingAddrIndex !== null ? "Edit Delivery Address" : "Add Delivery Address"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-black transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveAddress} className="space-y-3.5">

                {/* Row 1: Type Selection + Default Checkbox */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
                  <div className="flex items-center gap-1.5">
                    {["Home", "Work", "Other"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setAddrForm({ ...addrForm, type: t })}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${addrForm.type === t
                            ? "bg-[#2e0e43] text-white border-[#2e0e43] shadow-xs"
                            : "border-[#D8CBBE] text-[#7B6D63] bg-[#FDFAF5] hover:border-[#2e0e43]"
                          }`}
                      >
                        {t === "Home" && <Home size={12} />}
                        {t === "Work" && <Building2 size={12} />}
                        {t === "Other" && <MapPin size={12} />}
                        {t}
                      </button>
                    ))}
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer text-sm font-medium text-[#7B6D63] hover:text-[#2e0e43]">
                    <input
                      type="checkbox"
                      checked={addrForm.isDefault}
                      onChange={(e) => setAddrForm({ ...addrForm, isDefault: e.target.checked })}
                      className="accent-[#2e0e43] w-3.5 h-3.5 rounded"
                    />
                    <span>Set Default</span>
                  </label>
                </div>

                {/* Row 2: Name & Primary Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-sans">
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider text-[#7B6D63] mb-1">
                      Recipient Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={addrForm.name}
                      onChange={(e) => setAddrForm({ ...addrForm, name: e.target.value })}
                      placeholder="Full Name"
                      className="w-full bg-[#FDFAF5] border border-[#D8CBBE] rounded-xl px-3.5 py-2 text-sm font-medium outline-none focus:border-[#2e0e43] focus:bg-white transition-all text-[#2A2623]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider text-[#7B6D63] mb-1">
                      Primary Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={addrForm.phone}
                      onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
                      placeholder="10-digit number"
                      className="w-full bg-[#FDFAF5] border border-[#D8CBBE] rounded-xl px-3.5 py-2 text-sm font-medium outline-none focus:border-[#2e0e43] focus:bg-white transition-all text-[#2A2623]"
                    />
                  </div>
                </div>

                {/* Row 3: Flat/House No & Landmark */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-sans">
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider text-[#7B6D63] mb-1">
                      Flat / House / Suite
                    </label>
                    <input
                      type="text"
                      value={addrForm.flat || addrForm.apartment || ""}
                      onChange={(e) => setAddrForm({ ...addrForm, flat: e.target.value, apartment: e.target.value })}
                      placeholder="Flat 402, Building A"
                      className="w-full bg-[#FDFAF5] border border-[#D8CBBE] rounded-xl px-3.5 py-2 text-sm font-medium outline-none focus:border-[#2e0e43] focus:bg-white transition-all text-[#2A2623]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider text-[#7B6D63] mb-1">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={addrForm.landmark || ""}
                      onChange={(e) => setAddrForm({ ...addrForm, landmark: e.target.value })}
                      placeholder="Near City Mall"
                      className="w-full bg-[#FDFAF5] border border-[#D8CBBE] rounded-xl px-3.5 py-2 text-sm font-medium outline-none focus:border-[#2e0e43] focus:bg-white transition-all text-[#2A2623]"
                    />
                  </div>
                </div>

                {/* Row 4: Street Address / Area */}
                <div className="text-sm font-sans">
                  <label className="block text-sm font-bold uppercase tracking-wider text-[#7B6D63] mb-1">
                    Street Address / Area *
                  </label>
                  <input
                    type="text"
                    required
                    value={addrForm.address}
                    onChange={(e) => setAddrForm({ ...addrForm, address: e.target.value })}
                    placeholder="Street name, colony or locality"
                    className="w-full bg-[#FDFAF5] border border-[#D8CBBE] rounded-xl px-3.5 py-2 text-sm font-medium outline-none focus:border-[#2e0e43] focus:bg-white transition-all text-[#2A2623]"
                  />
                </div>

                {/* Row 5: City, State, & Pincode */}
                <div className="grid grid-cols-3 gap-2.5 text-sm font-sans">
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider text-[#7B6D63] mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={addrForm.city}
                      onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                      placeholder="Mumbai"
                      className="w-full bg-[#FDFAF5] border border-[#D8CBBE] rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-[#2e0e43] focus:bg-white transition-all text-[#2A2623]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider text-[#7B6D63] mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={addrForm.state}
                      onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
                      placeholder="Maharashtra"
                      className="w-full bg-[#FDFAF5] border border-[#D8CBBE] rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-[#2e0e43] focus:bg-white transition-all text-[#2A2623]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider text-[#7B6D63] mb-1">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={addrForm.pincode}
                      onChange={(e) => setAddrForm({ ...addrForm, pincode: e.target.value })}
                      placeholder="400001"
                      className="w-full bg-[#FDFAF5] border border-[#D8CBBE] rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-[#2e0e43] focus:bg-white transition-all text-[#2A2623] font-mono"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#2e0e43] text-white text-sm font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-[#1A0829] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer font-sans"
                  >
                    <Check size={16} />
                    <span>Save Address</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Account;
