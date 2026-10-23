// SuperAdmin.jsx
import React, { useState, useEffect, useMemo } from "react";
import { db, auth } from "../../components/Firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  LayoutDashboard,
  ShoppingBag,
  List,
  Users,
  Image,
  LogOut,
  Plus,
  Package,
  Activity,
  Bell,
  ChevronRight,
  Gem,
  Search,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  Grid2X2,
  Tags,
  Layers3,
  Globe2,
  TicketPercent,
  Star,
  FileText,
  Images,
  Settings,
  Truck,
  CreditCard,
  PanelLeftClose,
  PanelLeftOpen,
  Database,
  Lock,
  Mail,
  Camera,
  Trash2,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  Video
} from "lucide-react";

import SuperAdminAuth from "./SuperAdminAuth";
import MetricCards from "../Admin/components/MetricCards";
import ProductsTable from "../Admin/components/ProductsTable";
import UsersTable from "../Admin/components/UsersTable";
import MediaLibrary from "../Admin/components/MediaLibrary";
import ProductEditor from "../Admin/components/ProductEditor";
import CatalogManager from "../Admin/components/CatalogManager";
import SiteSettingsManager from "../Admin/components/SiteSettingsManager";
import ProductImageManager from "../Admin/components/ProductImageManager";
import BlogManager from "../Admin/components/BlogManager";
import ReviewsManager from "../Admin/components/ReviewsManager";
import GalleryManager from "../Admin/components/GalleryManager";
import NewsManager from "../Admin/components/NewsManager";
import TagsManager from "../Admin/components/TagsManager";
import CouponManager from "../Admin/components/CouponManager";
import AdminsTable from "./components/AdminsTable";
import SuperAdminOrders from "./components/SuperAdminOrders";
import { listenToProducts, listenToTrashedProducts, trashProduct, restoreProduct, permanentlyDeleteProduct } from "../../services/productService";

// Chart.js imports
import { Chart as ChartJS, ArcElement, CategoryScale, Filler, Legend, LineElement, LinearScale, PointElement, Tooltip } from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(ArcElement, CategoryScale, Filler, Legend, LineElement, LinearScale, PointElement, Tooltip);

const sidebarItems = [
  { name: "Dashboard", icon: LayoutDashboard, desc: "Executive Platform Overview" },
  { name: "Products", icon: Package, desc: "Product Catalog & Trashed Items" },
  { name: "Product Images", icon: Images, desc: "Manage Product Photos & Gallery" },
  { name: "Orders", icon: ShoppingBag, desc: "Live Customer Transactions & Status Updates" },
  { name: "Inventory", icon: Database, desc: "Stock Adjustments & Low Stock Control" },
  { name: "Billing", icon: CreditCard, desc: "Gross Income & Invoice Audit Logs" },
  { name: "Categories", icon: List, desc: "Store Categories" },
  { name: "Sub Categories", icon: Grid2X2, desc: "Sub-Categories" },
  { name: "Collections", icon: Layers3, desc: "Curated Collections" },
  { name: "Countries", icon: Globe2, desc: "Regional Hubs" },
  { name: "Attributes", icon: Tags, desc: "Jewellery Attributes" },
  { name: "Tags Manager", icon: Tags, desc: "Product Meta Tags" },
  { name: "Coupon Manager", icon: TicketPercent, desc: "Discount Coupons & Promotions" },
  { name: "Blogs", icon: FileText, desc: "Journal & Editorial Articles" },
  { name: "Reviews", icon: Star, desc: "Customer Reviews & Ratings" },
  { name: "Gallery", icon: Images, desc: "Visual Experience Gallery" },
  { name: "News & Reels", icon: Video, desc: "Short Videos & Press Updates" },
  { name: "Hero & Banners", icon: Settings, desc: "Hero Carousels & Banners" },
  { name: "Users", icon: Users, desc: "Registered User Accounts" },
  { name: "Admins", icon: ShieldCheck, desc: "Create & Manage Super Admins & Store Admins" },
  { name: "Media", icon: Image, desc: "Cloudinary Asset Library" },
];

const sortNewest = (rows) => [...rows].sort((a, b) => {
  const toMillis = (value) => value?.toMillis?.() ?? new Date(value || 0).getTime();
  return toMillis(b.createdAt || b.orderDate || b.date) - toMillis(a.createdAt || a.orderDate || a.date);
});

const SuperAdmin = () => {
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [products, setProducts] = useState([]);
  const [trashedProducts, setTrashedProducts] = useState([]);
  const [productViewMode, setProductViewMode] = useState("active");

  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [adminsList, setAdminsList] = useState([]);
  const [superAdminsList, setSuperAdminsList] = useState([]);

  const [superAdminUser, setSuperAdminUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Global search state
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Graph Range & Metric Controls State
  const [graphMetric, setGraphMetric] = useState("orders"); // "orders" | "products"
  const [chartRangeMode, setChartRangeMode] = useState("14days"); // "14days" | "month" | "year" | "custom"
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customStartDate, setCustomStartDate] = useState(
    new Date(Date.now() - 13 * 86400000).toISOString().split("T")[0]
  );
  const [customEndDate, setCustomEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // ─── Theme preference ───────────────────────────────────────────────────────
  useEffect(() => {
    const darkPref = localStorage.getItem("velouraz_superadmin_dark");
    if (darkPref === "true") setIsDarkMode(true);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("velouraz_superadmin_dark", isDarkMode);
  }, [isDarkMode]);

  // ─── Super Admin Authentication Persistence ──────────────────────────────
  useEffect(() => {
    const storedSuper = localStorage.getItem("velouraz_superadmin");
    if (storedSuper) {
      try {
        setSuperAdminUser(JSON.parse(storedSuper));
      } catch (e) {}
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "superadmins", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().role === "superadmin") {
            setSuperAdminUser(user);
            localStorage.setItem("velouraz_superadmin", JSON.stringify(user));
          } else {
            const q = query(collection(db, "superadmins"), where("email", "==", user.email));
            const qSnap = await getDocs(q);
            if (!qSnap.empty) {
              setSuperAdminUser(user);
              localStorage.setItem("velouraz_superadmin", JSON.stringify(user));
            }
          }
        } catch (error) {
          console.error("Error verifying superadmin status:", error);
        }
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // ─── Listen to Collections in Real-time ─────────────────────────────────────
  useEffect(() => {
    if (!superAdminUser) return undefined;

    const stopProducts = listenToProducts(setProducts, (err) => console.warn("Products listener err:", err));
    const stopTrashed = listenToTrashedProducts(setTrashedProducts, (err) => console.warn("Trashed listener err:", err));

    const snapUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(sortNewest(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))));
    });

    const snapOrders = onSnapshot(collection(db, "orders"), (snapshot) => {
      setOrders(sortNewest(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))));
    });

    const snapAdmins = onSnapshot(collection(db, "admins"), (snapshot) => {
      setAdminsList(sortNewest(snapshot.docs.map((d) => ({ firestoreId: d.id, ...d.data() }))));
    });

    const snapSuperAdmins = onSnapshot(collection(db, "superadmins"), (snapshot) => {
      setSuperAdminsList(sortNewest(snapshot.docs.map((d) => ({ firestoreId: d.id, ...d.data() }))));
    });

    return () => {
      stopProducts();
      stopTrashed();
      snapUsers();
      snapOrders();
      snapAdmins();
      snapSuperAdmins();
    };
  }, [superAdminUser]);

  const handleLogout = () => {
    signOut(auth);
    setSuperAdminUser(null);
    localStorage.removeItem("velouraz_superadmin");
  };

  // ─── Revenue & Calculations ────────────────────────────────────────────────
  const grossRevenue = useMemo(() => {
    return orders
      .filter((o) => (o.status || o.orderStatus) !== "Cancelled")
      .reduce((sum, o) => sum + Number(o.total || o.totalAmount || 0), 0);
  }, [orders]);

  const profitMargin = useMemo(() => {
    return products.reduce((sum, p) => {
      const margin = Number(p.price || 0) - Number(p.costPrice || p.original_price * 0.4 || 0);
      return sum + (margin > 0 ? margin : 0);
    }, 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => Number(p.stock || 0) <= 10).length;
  }, [products]);

  // Helper for parsing any Firestore item date format
  const parseItemDate = (val) => {
    if (!val) return null;
    if (typeof val === "object" && typeof val.toDate === "function") {
      return val.toDate();
    }
    if (typeof val === "object" && val.seconds) {
      return new Date(val.seconds * 1000);
    }
    if (typeof val === "number") {
      return new Date(val);
    }
    if (typeof val === "string") {
      const parsed = new Date(val);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return null;
  };

  const getItemDate = (item) => {
    return (
      parseItemDate(item.createdAt) ||
      parseItemDate(item.orderDate) ||
      parseItemDate(item.date) ||
      parseItemDate(item.timestamp) ||
      parseItemDate(item.created_at)
    );
  };

  // ─── Global Search ──────────────────────────────────────────────────────────
  useEffect(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) { setSearchResults([]); setShowSearchResults(false); return; }
    const matched = products.filter((p) =>
      `${p.name || ""} ${p.sku || ""} ${p.category || ""} ${p.country || ""}`.toLowerCase().includes(q)
    ).slice(0, 5).map((p) => ({ type: "product", label: p.name, sub: p.category || "No category", id: p.id, img: p.images?.[0] }));
    const matchedOrders = orders.filter((o) =>
      `${o.id} ${o.customerName || ""} ${o.email || ""}`.toLowerCase().includes(q)
    ).slice(0, 3).map((o) => ({ type: "order", label: `Order #${o.id.slice(0, 8)}`, sub: o.customerName || o.email || "Customer", id: o.id }));
    const matchedUsers = users.filter((u) =>
      `${u.name || ""} ${u.email || ""}`.toLowerCase().includes(q)
    ).slice(0, 3).map((u) => ({ type: "user", label: u.name || u.email, sub: u.email || "User", id: u.id }));
    setSearchResults([...matched, ...matchedOrders, ...matchedUsers]);
    setShowSearchResults(true);
  }, [globalSearch, products, orders, users]);

  // ─── Product Operations ────────────────────────────────────────────────────
  const handleDeleteProduct = async (id) => {
    await trashProduct(id);
  };

  const handleRestoreProduct = async (id) => {
    await restoreProduct(id);
  };

  const handlePermanentDelete = async (id) => {
    await permanentlyDeleteProduct(id);
  };

  const handleQuickStockAdjustment = async (productId, amount) => {
    try {
      const prodRef = doc(db, "products", productId);
      const prodSnap = await getDoc(prodRef);
      if (prodSnap.exists()) {
        const currentStock = Number(prodSnap.data().stock || 0);
        await updateDoc(prodRef, {
          stock: Math.max(0, currentStock + amount),
          stock_status: (currentStock + amount) <= 0 ? "Out of Stock" : "In Stock"
        });
      }
    } catch (e) {
      console.error("Stock adjustment failed:", e);
    }
  };

  // Chart data calculations with metric toggle (Uploaded Products vs Orders & Revenue)
  const chartData = useMemo(() => {
    let labels = [];
    let dataArr = [];
    let periodTotal = 0;
    let periodCount = 0;

    if (graphMetric === "orders") {
      const validOrders = orders.filter(
        (o) => (o.status || o.orderStatus) !== "Cancelled"
      );

      if (chartRangeMode === "14days") {
        const dates = Array.from({ length: 14 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (13 - i));
          return d;
        });

        labels = dates.map((d) =>
          d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
        );
        dataArr = Array(14).fill(0);

        validOrders.forEach((o) => {
          const oDate = getItemDate(o);
          if (!oDate) return;

          const matchIdx = dates.findIndex(
            (d) =>
              d.getDate() === oDate.getDate() &&
              d.getMonth() === oDate.getMonth() &&
              d.getFullYear() === oDate.getFullYear()
          );

          if (matchIdx !== -1) {
            dataArr[matchIdx] += Number(o.total || o.totalAmount || 0);
            periodCount += 1;
          }
        });
      } else if (chartRangeMode === "month") {
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const dates = Array.from({ length: daysInMonth }, (_, i) => {
          return new Date(selectedYear, selectedMonth, i + 1);
        });

        labels = dates.map((d) =>
          d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
        );
        dataArr = Array(daysInMonth).fill(0);

        validOrders.forEach((o) => {
          const oDate = getItemDate(o);
          if (!oDate) return;

          if (
            oDate.getMonth() === Number(selectedMonth) &&
            oDate.getFullYear() === Number(selectedYear)
          ) {
            const dayIdx = oDate.getDate() - 1;
            if (dayIdx >= 0 && dayIdx < daysInMonth) {
              dataArr[dayIdx] += Number(o.total || o.totalAmount || 0);
              periodCount += 1;
            }
          }
        });
      } else if (chartRangeMode === "year") {
        const monthNames = [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        labels = monthNames;
        dataArr = Array(12).fill(0);

        validOrders.forEach((o) => {
          const oDate = getItemDate(o);
          if (!oDate) return;

          if (oDate.getFullYear() === Number(selectedYear)) {
            const monthIdx = oDate.getMonth();
            if (monthIdx >= 0 && monthIdx < 12) {
              dataArr[monthIdx] += Number(o.total || o.totalAmount || 0);
              periodCount += 1;
            }
          }
        });
      } else if (chartRangeMode === "custom") {
        const start = new Date(customStartDate + "T00:00:00");
        const end = new Date(customEndDate + "T23:59:59");

        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
          const diffTime = Math.abs(end - start);
          const diffDays = Math.min(
            Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1,
            90
          );

          const dates = Array.from({ length: diffDays }, (_, i) => {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            return d;
          });

          labels = dates.map((d) =>
            d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
          );
          dataArr = Array(diffDays).fill(0);

          validOrders.forEach((o) => {
            const oDate = getItemDate(o);
            if (!oDate) return;

            if (oDate >= start && oDate <= end) {
              const matchIdx = dates.findIndex(
                (d) =>
                  d.getDate() === oDate.getDate() &&
                  d.getMonth() === oDate.getMonth() &&
                  d.getFullYear() === oDate.getFullYear()
              );
              if (matchIdx !== -1) {
                dataArr[matchIdx] += Number(o.total || o.totalAmount || 0);
                periodCount += 1;
              }
            }
          });
        } else {
          labels = ["Select Valid Dates"];
          dataArr = [0];
        }
      }

      periodTotal = dataArr.reduce((a, b) => a + b, 0);
    } else {
      // Metric: Uploaded Products count
      if (chartRangeMode === "14days") {
        const dates = Array.from({ length: 14 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (13 - i));
          return d;
        });

        labels = dates.map((d) =>
          d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
        );
        dataArr = Array(14).fill(0);

        products.forEach((p) => {
          const pDate = getItemDate(p);
          if (!pDate) return;

          const matchIdx = dates.findIndex(
            (d) =>
              d.getDate() === pDate.getDate() &&
              d.getMonth() === pDate.getMonth() &&
              d.getFullYear() === pDate.getFullYear()
          );

          if (matchIdx !== -1) {
            dataArr[matchIdx] += 1;
          }
        });
      } else if (chartRangeMode === "month") {
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const dates = Array.from({ length: daysInMonth }, (_, i) => {
          return new Date(selectedYear, selectedMonth, i + 1);
        });

        labels = dates.map((d) =>
          d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
        );
        dataArr = Array(daysInMonth).fill(0);

        products.forEach((p) => {
          const pDate = getItemDate(p);
          if (!pDate) return;

          if (
            pDate.getMonth() === Number(selectedMonth) &&
            pDate.getFullYear() === Number(selectedYear)
          ) {
            const dayIdx = pDate.getDate() - 1;
            if (dayIdx >= 0 && dayIdx < daysInMonth) {
              dataArr[dayIdx] += 1;
            }
          }
        });
      } else if (chartRangeMode === "year") {
        const monthNames = [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        labels = monthNames;
        dataArr = Array(12).fill(0);

        products.forEach((p) => {
          const pDate = getItemDate(p);
          if (!pDate) return;

          if (pDate.getFullYear() === Number(selectedYear)) {
            const monthIdx = pDate.getMonth();
            if (monthIdx >= 0 && monthIdx < 12) {
              dataArr[monthIdx] += 1;
            }
          }
        });
      } else if (chartRangeMode === "custom") {
        const start = new Date(customStartDate + "T00:00:00");
        const end = new Date(customEndDate + "T23:59:59");

        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
          const diffTime = Math.abs(end - start);
          const diffDays = Math.min(
            Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1,
            90
          );

          const dates = Array.from({ length: diffDays }, (_, i) => {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            return d;
          });

          labels = dates.map((d) =>
            d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
          );
          dataArr = Array(diffDays).fill(0);

          products.forEach((p) => {
            const pDate = getItemDate(p);
            if (!pDate) return;

            if (pDate >= start && pDate <= end) {
              const matchIdx = dates.findIndex(
                (d) =>
                  d.getDate() === pDate.getDate() &&
                  d.getMonth() === pDate.getMonth() &&
                  d.getFullYear() === pDate.getFullYear()
              );
              if (matchIdx !== -1) {
                dataArr[matchIdx] += 1;
              }
            }
          });
        } else {
          labels = ["Select Valid Dates"];
          dataArr = [0];
        }
      }

      periodTotal = dataArr.reduce((a, b) => a + b, 0);
    }

    return {
      labels,
      dataArr,
      periodTotal,
      periodCount
    };
  }, [orders, products, graphMetric, chartRangeMode, selectedMonth, selectedYear, customStartDate, customEndDate]);

  const lineChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: graphMetric === "orders" ? "Platform Revenue (₹)" : "Uploaded Products",
        data: chartData.dataArr,
        borderColor: graphMetric === "orders" ? "#811331" : "#059669",
        backgroundColor: graphMetric === "orders" ? "rgba(129,19,49,.08)" : "rgba(5,150,105,.08)",
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        borderWidth: 2
      }
    ]
  };

  const currentItem = sidebarItems.find((i) => i.name === activeItem);

  // ─── Header ─────────────────────────────────────────────────────────────────
  const renderHeader = () => (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base font-medium text-slate-400">Velouraz Executive</span>
          <ChevronRight size={12} className="text-slate-300" />
          <span className="text-base font-semibold text-[#811331]">{activeItem}</span>
        </div>
        <h1 className={`text-2xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
          {activeItem}
        </h1>
        <p className={`mt-1 text-base ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
          {currentItem?.desc || "Super Admin Control Console"}
        </p>
      </div>
      <div className="flex items-center gap-3 self-end sm:self-auto">
        <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full shadow-sm border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100"}`}>
          <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_6px_1px_rgba(239,68,68,0.6)] animate-pulse" />
          <span className={`text-base font-medium ${isDarkMode ? "text-slate-300" : "text-slate-500"}`}>
            Access: <span className="font-bold text-red-500">Super Admin Mode</span>
          </span>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setIsProductModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#811331] text-white rounded-xl text-base font-bold shadow-lg shadow-[#811331]/20 hover:bg-[#9d1a3d] transition-all active:scale-95"
        >
          <Plus size={16} />
          <span>Add Product</span>
        </button>
      </div>
    </header>
  );

  // ─── Main Content Views ──────────────────────────────────────────────────────
  const renderMainContent = () => {
    switch (activeItem) {
      case "Dashboard":
        return (
          <div className="space-y-6">
            {/* Analytics Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className={`p-5 rounded-2xl border shadow-sm ${isDarkMode ? "bg-[#1e2230] border-slate-700/60 text-white" : "bg-white border-slate-100 text-slate-900"}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`text-base font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Gross Revenue</p>
                    <p className="text-2xl font-bold mt-2">₹{grossRevenue.toLocaleString("en-IN")}</p>
                  </div>
                  <span className="p-3 rounded-xl bg-rose-50 text-[#811331]">
                    <TrendingUp size={20} />
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-3 text-base text-emerald-600 font-semibold">
                  <ArrowUpRight size={14} />
                  <span>Real-time platform sales</span>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border shadow-sm ${isDarkMode ? "bg-[#1e2230] border-slate-700/60 text-white" : "bg-white border-slate-100 text-slate-900"}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`text-base font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Total Orders</p>
                    <p className="text-2xl font-bold mt-2">{orders.length}</p>
                  </div>
                  <span className="p-3 rounded-xl bg-blue-50 text-blue-600">
                    <ShoppingBag size={20} />
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-3 text-base text-blue-600 font-semibold">
                  <span>Across all users</span>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border shadow-sm ${isDarkMode ? "bg-[#1e2230] border-slate-700/60 text-white" : "bg-white border-slate-100 text-slate-900"}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`text-base font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Live Products</p>
                    <p className="text-2xl font-bold mt-2">{products.length}</p>
                  </div>
                  <span className="p-3 rounded-xl bg-[#811331]/10 text-[#811331]">
                    <Package size={20} />
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-3 text-base text-amber-600 font-semibold">
                  <span>{lowStockCount} low stock items</span>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border shadow-sm ${isDarkMode ? "bg-[#1e2230] border-slate-700/60 text-white" : "bg-white border-slate-100 text-slate-900"}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`text-base font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Active Users</p>
                    <p className="text-2xl font-bold mt-2">{users.length}</p>
                  </div>
                  <span className="p-3 rounded-xl bg-purple-50 text-purple-600">
                    <Users size={20} />
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-3 text-base text-purple-600 font-semibold">
                  <span>Customer accounts</span>
                </div>
              </div>
            </div>

            {/* Line graph with dataset Metric Switcher & Date Range Selectors */}
            <div className={`p-6 rounded-2xl border shadow-sm space-y-4 ${isDarkMode ? "bg-[#1e2230] border-slate-700/60 text-white" : "bg-white border-slate-100 text-slate-900"}`}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4 border-slate-100/10">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="text-base font-bold">Platform Analytics Graph</h3>
                    {graphMetric === "orders" ? (
                      <span className="px-3 py-1 rounded-full bg-[#811331]/10 text-[#811331] dark:text-rose-400 font-bold text-sm">
                        ₹{chartData.periodTotal.toLocaleString("en-IN")} Total Revenue ({chartData.periodCount} Orders)
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-sm border border-emerald-200">
                        {chartData.periodTotal} Products Uploaded in Period
                      </span>
                    )}
                  </div>

                  {/* Metric Switcher Options */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setGraphMetric("orders")}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-base font-bold transition-all ${
                        graphMetric === "orders"
                          ? "bg-[#811331] text-white shadow-md"
                          : isDarkMode
                          ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <ShoppingBag size={14} />
                      <span>Orders & Revenue</span>
                    </button>
                    <button
                      onClick={() => setGraphMetric("products")}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-base font-bold transition-all ${
                        graphMetric === "products"
                          ? "bg-emerald-600 text-white shadow-md"
                          : isDarkMode
                          ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <Package size={14} />
                      <span>Uploaded Products</span>
                    </button>
                  </div>
                </div>

                {/* Date Range Mode Selector and Controls */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Mode Buttons */}
                  <div className={`p-1 rounded-xl flex items-center gap-1 border ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-slate-100 border-slate-200"}`}>
                    {[
                      { id: "14days", label: "14 Days" },
                      { id: "month", label: "Month" },
                      { id: "year", label: "Year" },
                      { id: "custom", label: "Custom Dates" }
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => setChartRangeMode(btn.id)}
                        className={`px-3 py-1.5 rounded-lg text-base font-bold transition-all ${
                          chartRangeMode === btn.id
                            ? "bg-[#811331] text-white shadow-sm"
                            : isDarkMode
                            ? "text-slate-300 hover:text-white"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {/* Controls for Month Mode */}
                  {chartRangeMode === "month" && (
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className={`px-3 py-1.5 rounded-xl font-bold text-base outline-none border ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}
                      >
                        {[
                          "January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"
                        ].map((mName, idx) => (
                          <option key={idx} value={idx}>{mName}</option>
                        ))}
                      </select>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className={`px-3 py-1.5 rounded-xl font-bold text-base outline-none border ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}
                      >
                        {[2024, 2025, 2026, 2027].map((yr) => (
                          <option key={yr} value={yr}>{yr}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Controls for Year Mode */}
                  {chartRangeMode === "year" && (
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className={`px-3 py-1.5 rounded-xl font-bold text-base outline-none border ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}
                    >
                      {[2024, 2025, 2026, 2027].map((yr) => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  )}

                  {/* Controls for Custom Date Range */}
                  {chartRangeMode === "custom" && (
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className={`px-3 py-1.5 rounded-xl text-base font-bold outline-none border ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}
                      />
                      <span className="text-slate-400 font-bold">to</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className={`px-3 py-1.5 rounded-xl text-base font-bold outline-none border ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"}`}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="h-64 pt-2">
                <Line
                  data={lineChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const val = Number(context.raw || 0);
                            return graphMetric === "orders"
                              ? ` Revenue: ₹${val.toLocaleString("en-IN")}`
                              : ` Uploaded Products: ${val} items`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (val) =>
                            graphMetric === "orders"
                              ? `₹${Number(val).toLocaleString("en-IN")}`
                              : `${val} items`
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        );

      case "Products":
        return (
          <ProductsTable
            products={products}
            trashedProducts={trashedProducts}
            viewMode={productViewMode}
            onViewModeChange={setProductViewMode}
            onAddProduct={() => { setEditingProduct(null); setIsProductModalOpen(true); }}
            onEditProduct={(p) => { setEditingProduct(p); setIsProductModalOpen(true); }}
            onDeleteProduct={handleDeleteProduct}
            onRestoreProduct={handleRestoreProduct}
            onPermanentDelete={handlePermanentDelete}
            onRefresh={() => { }}
          />
        );

      case "Orders":
        return <SuperAdminOrders orders={orders} isDarkMode={isDarkMode} />;

      case "Inventory":
        return (
          <div className={`rounded-2xl border shadow-sm overflow-hidden ${isDarkMode ? "bg-[#1e2230] border-slate-700/60" : "bg-white border-slate-100"}`}>
            <div className="px-6 py-5 border-b border-slate-100/10">
              <h3 className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>Super Admin Inventory Control</h3>
              <p className={`text-base ${isDarkMode ? "text-slate-400" : "text-slate-500"} mt-1`}>Manage product stock levels and perform instant inventory adjustments</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className={`text-[16px] font-bold uppercase tracking-wider border-b border-slate-100/10 ${isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-400"}`}>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Current Stock</th>
                    <th className="px-6 py-4">Quick Adjustments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/10 text-base">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/5">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={p.images?.[0] || p.image} alt="" className="w-10 h-10 rounded-xl object-cover bg-slate-100" />
                          <div>
                            <p className={`font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>{p.name}</p>
                            <p className={`text-[16px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>SKU: {p.sku || "N/A"}</p>
                          </div>
                        </div>
                      </td>
                      <td className={`px-6 py-4 font-semibold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{p.category}</td>
                      <td className={`px-6 py-4 font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                        <span className={`inline-block px-3 py-1 rounded-lg ${Number(p.stock || 0) <= 10 ? "bg-amber-50 text-amber-700 border border-amber-200 font-bold" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                          {p.stock || 0} units
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleQuickStockAdjustment(p.id, -1)}
                            className="w-8 h-8 bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center font-bold text-slate-700 dark:text-white"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => handleQuickStockAdjustment(p.id, 5)}
                            className="px-3 py-1 bg-[#811331]/10 text-[#811331] rounded-lg font-bold text-[16px]"
                          >
                            +5
                          </button>
                          <button
                            onClick={() => handleQuickStockAdjustment(p.id, 25)}
                            className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-bold text-[16px]"
                          >
                            +25
                          </button>
                          <button
                            onClick={() => handleQuickStockAdjustment(p.id, 1)}
                            className="w-8 h-8 bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center font-bold text-slate-700 dark:text-white"
                          >
                            +1
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "Billing":
        return (
          <div className="space-y-6 font-sans">
            <div className={`p-6 rounded-2xl border shadow-sm ${isDarkMode ? "bg-[#1e2230] border-slate-700/60 text-white" : "bg-white border-slate-100 text-slate-900"}`}>
              <h3 className="text-base font-bold mb-2">Platform Billing & Revenue Audit</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div className={`p-4 rounded-xl border ${isDarkMode ? "border-slate-700 bg-slate-900/40" : "border-slate-100 bg-slate-50"}`}>
                  <p className={`text-base font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Total Gross Revenue</p>
                  <p className="text-2xl font-bold mt-1">₹{grossRevenue.toLocaleString("en-IN")}</p>
                </div>
                <div className={`p-4 rounded-xl border ${isDarkMode ? "border-slate-700 bg-slate-900/40" : "border-slate-100 bg-slate-50"}`}>
                  <p className={`text-base font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Estimated Catalog Margin</p>
                  <p className="text-2xl font-bold mt-1 text-emerald-600">₹{profitMargin.toLocaleString("en-IN")}</p>
                </div>
                <div className={`p-4 rounded-xl border ${isDarkMode ? "border-slate-700 bg-slate-900/40" : "border-slate-100 bg-slate-50"}`}>
                  <p className={`text-base font-bold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Average Order Invoice</p>
                  <p className="text-2xl font-bold mt-1">
                    ₹{orders.length ? Math.round(grossRevenue / orders.length).toLocaleString("en-IN") : 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      // ─── Catalog Structure ───
      case "Categories":
        return <CatalogManager type="Categories" />;
      case "Sub Categories":
      case "SubCategories":
        return <CatalogManager type="SubCategories" />;
      case "Collections":
        return <CatalogManager type="Collections" />;
      case "Countries":
        return <CatalogManager type="Countries" />;
      case "Attributes":
        return <CatalogManager type="Attributes" />;
      case "Tags Manager":
      case "TagsManager":
        return <TagsManager />;
      case "Coupon Manager":
      case "CouponManager":
        return <CouponManager />;

      // ─── Content & Editorial ───
      case "Blogs":
        return <BlogManager />;
      case "Reviews":
        return <ReviewsManager isDarkMode={isDarkMode} />;
      case "Gallery":
        return <GalleryManager />;
      case "News & Reels":
      case "NewsReels":
        return <NewsManager isDarkMode={isDarkMode} />;
      case "Hero & Banners":
      case "Banners":
        return <SiteSettingsManager isDarkMode={isDarkMode} />;

      // ─── Users, Admins & Media ───
      case "Users":
        return <UsersTable users={users} />;
      case "Admins":
        return (
          <AdminsTable
            adminsList={adminsList}
            superAdminsList={superAdminsList}
            isDarkMode={isDarkMode}
            onRefresh={() => {}}
          />
        );
      case "Media":
        return <MediaLibrary />;
      case "Product Images":
        return <ProductImageManager products={products} isDarkMode={isDarkMode} />;

      default:
        return null;
    }
  };

  // ─── Sidebar Component ───────────────────────────────────────────────────────
  const SidebarContent = ({ collapsed = false }) => (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#630a21] via-[#570819] to-[#31040e] text-white">
      <div className={`border-b border-white/10 ${collapsed ? "px-3 py-5" : "px-6 py-5"}`}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          {collapsed ? (
            <div className="grid h-10 w-10 place-items-center rounded-full border border-[#e8c37b]/70 text-[#e8c37b]">
              <Gem size={21} />
            </div>
          ) : (
            <div className="text-center flex-1">
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-full border border-[#e8c37b]/70 text-[#e8c37b]"><Gem size={21} /></div>
              <p className="mt-2 font-serif text-[25px] leading-none tracking-wide text-white">VELOURAZ</p>
              <p className="mt-1 text-[16px] tracking-[.18em] text-[#e8c37b]/80">SUPER ADMIN CONSOLE</p>
            </div>
          )}
        </div>
      </div>

      <nav className={`flex-1 overflow-y-auto py-4 text-[16px] ${collapsed ? "px-2" : "px-3"}`}>
        {sidebarItems.map((item) => {
          const isActive = item.name === activeItem;
          const Icon = item.icon;
          return (
            <button
              key={item.name}
              onClick={() => {
                setActiveItem(item.name);
                setIsSidebarOpen(false);
              }}
              className={`flex w-full items-center rounded-lg font-semibold transition-all mb-1 ${collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
                } ${isActive ? "bg-[#a4143e] text-white shadow-md" : "text-white/80 hover:bg-white/10"}`}
            >
              <Icon size={16} />
              {!collapsed && <span>{item.name}</span>}
            </button>
          );
        })}
      </nav>

      <div className={`border-t border-white/10 py-3 space-y-1 ${collapsed ? "px-2" : "px-3"}`}>
        <button
          onClick={handleLogout}
          className={`flex w-full items-center rounded-lg px-2 py-2 text-[16px] font-bold text-red-300 hover:bg-white/10 ${collapsed ? "justify-center" : "gap-3 px-3"}`}
        >
          <LogOut size={16} />
          {!collapsed && "Logout Super Admin"}
        </button>
      </div>
    </div>
  );

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-[3px] border-white/10 border-t-[#811331] rounded-full"
          />
          <p className="text-base text-white/40 font-medium tracking-widest uppercase">Verifying Super Admin Access...</p>
        </div>
      </div>
    );
  }

  if (!superAdminUser) {
    return <SuperAdminAuth onAuthSuccess={(u) => setSuperAdminUser(u)} />;
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-[#0f1117] text-white" : "bg-[#f5f5f7] text-slate-900"} font-sans selection:bg-[#811331]/10 transition-colors duration-300`}>
      {/* Sidebar - Desktop */}
      <aside className={`hidden lg:flex flex-col fixed top-0 left-0 h-screen z-30 transition-all duration-300 ${isSidebarCollapsed ? "w-16" : "w-64"}`}>
        <SidebarContent collapsed={isSidebarCollapsed} />
      </aside>

      {/* Main Content offset */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${isSidebarCollapsed ? "lg:ml-16" : "lg:ml-64"}`}>
        {/* Topbar */}
        <header className={`hidden lg:flex h-[74px] items-center gap-6 justify-between border-b px-7 xl:px-9 ${isDarkMode ? "bg-[#1a1d27] border-slate-700/60" : "bg-white border-slate-200/80"} sticky top-0 z-20`}>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`grid h-9 w-9 place-items-center rounded-lg ${isDarkMode ? "text-slate-300 hover:bg-slate-700" : "text-slate-700 hover:bg-slate-100"}`}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>

          {/* Search */}
          <div className="relative flex w-full max-w-[430px] flex-col">
            <label className={`flex items-center gap-3 rounded-xl border px-3.5 py-2 ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50/50 border-slate-200 text-slate-700"} transition-colors`}>
              <Search size={17} className="text-slate-400" />
              <input
                className="w-full bg-transparent text-base outline-none"
                placeholder="Search catalog, orders, users..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                onFocus={() => globalSearch && setShowSearchResults(true)}
              />
            </label>
          </div>

          {/* Right Area */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition-all ${isDarkMode ? "bg-slate-700 text-yellow-400" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#811331] text-base font-bold text-white shadow-md">SA</span>
              <div>
                <p className={`text-base font-semibold ${isDarkMode ? "text-white" : "text-slate-800"}`}>Super Admin</p>
                <p className="text-[16px] text-slate-400">{superAdminUser.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Navbar */}
        <nav className={`lg:hidden flex items-center justify-between px-4 py-3 border-b sticky top-0 z-30 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#811331] flex items-center justify-center shadow-md">
              <Gem size={15} className="text-white" />
            </div>
            <div>
              <p className={`text-sm font-bold tracking-tight leading-none ${isDarkMode ? "text-white" : "text-slate-900"}`}>Velouraz</p>
              <p className="text-[16px] font-medium tracking-widest uppercase mt-0.5 text-[#811331]">Super Admin Console</p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className={`p-2 rounded-xl ${isDarkMode ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"}`}
          >
            <Menu size={18} />
          </button>
        </nav>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
              <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} className="relative z-10 w-72 h-full">
                <SidebarContent />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto px-4 py-5 pb-24 sm:px-8 sm:py-8 lg:px-7 lg:py-6 lg:pb-10 xl:px-9">
          <div className="max-w-[1500px] mx-auto">
            {renderHeader()}
            <motion.div key={activeItem} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              {renderMainContent()}
            </motion.div>
          </div>
        </main>
      </div>

      {/* Product Editor Modal */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsProductModalOpen(false)} className="absolute inset-0 bg-slate-950/50 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className={`rounded-3xl shadow-2xl max-w-4xl w-full relative z-10 max-h-[90vh] overflow-hidden flex flex-col ${isDarkMode ? "bg-[#1a1d26]" : "bg-white"}`}>
              <div className={`px-6 py-4 border-b flex items-center justify-between ${isDarkMode ? "border-slate-700" : "border-slate-100"}`}>
                <div>
                  <h2 className={`text-base font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>{editingProduct ? "Edit Product" : "Add New Product"}</h2>
                  <p className="text-base text-slate-400">Super admins can manage catalog items directly</p>
                </div>
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400"><X size={16} /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <ProductEditor product={editingProduct} onCancel={() => setIsProductModalOpen(false)} onSuccess={() => { setIsProductModalOpen(false); }} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuperAdmin;
