// SiteSettingsManager.jsx
import React, { useState, useEffect, useRef } from "react";
import { db } from "../../../components/Firebase";
import { doc, getDoc, setDoc, collection, onSnapshot, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, Plus, Trash2, Edit3, ImagePlus, Loader2, Play, Video, Type, Link2, Bell, AlertCircle, Check, Image as ImageIcon, RefreshCw, Upload, Globe, ChevronUp, ChevronDown, Sparkles
} from "lucide-react";
import { uploadToCloudinary, uploadToCloudinaryWithProgress } from "../../../config/cloudinary";
import { DEFAULT_HEADER_WORLD_EDITS } from "../../../components/Header";
import { DEFAULT_HOMEPAGE_WORLD_EDIT_VIDEOS } from "../../../components/Homepage/PromoSlider";

const labelStyle = "block text-[16px] font-bold uppercase tracking-wider text-slate-500 mb-1.5";

const SiteSettingsManager = ({ isDarkMode = false }) => {
  const [activeSubTab, setActiveSubTab] = useState("hero"); // hero, announcements, world_edits, header_world_edit, mega_menus

  const cardStyle = isDarkMode
    ? "p-5 rounded-2xl border bg-slate-855 border-slate-700 shadow-sm text-white"
    : "p-5 rounded-2xl border bg-white border-slate-100 shadow-sm text-slate-800";

  const inp = isDarkMode
    ? "w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-base text-white outline-none focus:border-[#941232]"
    : "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-800 outline-none focus:border-[#941232]";

  // ─── Hero Banner State ──────────────────────────────────────────────────────
  const [heroData, setHeroData] = useState({
    videoURL: "/img/video1.mp4",
    eyebrow: "Curated · Inspired · Timeless",
    title: "Jewellery that Travels the World",
    subtitle: "Handpicked designs from iconic cultures, crafted for the modern you.",
    btn1Text: "Explore Collections",
    btn1Link: "/shop",
    btn2Text: "World Edit",
    btn2Link: "/world-edit"
  });
  const [savingHero, setSavingHero] = useState(false);
  const [savedHero, setSavedHero] = useState(false);
  const videoInputRef = useRef(null);
  const [uploadingHeroVideo, setUploadingHeroVideo] = useState(false);
  const [heroVideoProgress, setHeroVideoProgress] = useState(0);

  // ─── Announcements Carousel State (Top Header Texts) ─────────────────────
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [savingAnnouncements, setSavingAnnouncements] = useState(false);
  const [savedAnnouncements, setSavedAnnouncements] = useState(false);

  // ─── Bottom Hero Scroll Texts State (Hero Marquee) ───────────────────────
  const [heroMarquee, setHeroMarquee] = useState([]);
  const [newMarqueeText, setNewMarqueeText] = useState("");
  const [savingMarquee, setSavingMarquee] = useState(false);
  const [savedMarquee, setSavedMarquee] = useState(false);

  // ─── Homepage World Edit Videos State ──────────────────────────────────────
  const [worldEdits, setWorldEdits] = useState([]);
  const [editingEdit, setEditingEdit] = useState(null);
  const [newEdit, setNewEdit] = useState({
    country: "",
    collection: "",
    video: "",
    defaultImage: "",
    hoverImage: "",
    link: "",
    badge: "ORGANIC",
    order: 1,
    comingSoon: false
  });
  const [uploadingEditVideo, setUploadingEditVideo] = useState(false);
  const [editVideoProgress, setEditVideoProgress] = useState(0);
  const [uploadingEditImage, setUploadingEditImage] = useState(false);
  const [uploadingHoverImage, setUploadingHoverImage] = useState(false);
  const [seedingHomepage, setSeedingHomepage] = useState(false);

  // ─── Header World Edit Dropdown State ──────────────────────────────────────
  const [headerEdits, setHeaderEdits] = useState([]);
  const [editingHeaderDoc, setEditingHeaderDoc] = useState(null);
  const [newHeaderDoc, setNewHeaderDoc] = useState({
    country: "",
    flag: "",
    subtitle: "",
    collection: "",
    cta: "",
    href: "",
    bgImage: "",
    order: 1,
    comingSoon: false
  });
  const [uploadingHeaderBg, setUploadingHeaderBg] = useState(false);
  const [seedingHeader, setSeedingHeader] = useState(false);


  // ─── Header Mega Menus Dynamic State ───────────────────────────────────────
  const [megaMenus, setMegaMenus] = useState({
    collections: {
      image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=800",
      tagline: "TIMELESS BEAUTY",
      heading: "Crafted to Be Cherished",
      sections: [
        { title: "JEWELLERY SETS", icon: "𝓥", items: "Kundan Sets, Polki Sets, American Diamond Sets, Temple Jewellery Sets, Minimal Sets" },
        { title: "EARRINGS", icon: "❂", items: "Stud Earrings, Jhumka, Hoops, Chandbali, Drop Earrings" },
        { title: "NECKLACES", icon: "◇", items: "Choker Necklaces, Short Necklaces, Long Necklaces, Layered Necklaces, Pendant Necklaces" },
        { title: "RINGS", icon: "○", items: "Statement Rings, Adjustable Rings, Cocktail Rings, Stacking Rings, Band Rings" },
        { title: "BANGLES", icon: "◎", items: "Kada Bangles, Stone Bangles, Lac Bangles, Gold Plated Bangles, Pearl Bangles" },
        { title: "ANKLETS", icon: "✧", items: "Charms Anklets, Beaded Anklets, Chain Anklets, Oxidised Anklets, Minimal Anklets" }
      ]
    },
    world_edit: {
      image: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&q=80&w=800",
      tagline: "BEAUTY HAS NO BOUNDARIES",
      heading: "Jewellery Inspired by Cultures, Crafted for You.",
      sections: [
        { title: "KOREAN EDIT", icon: "⛩", items: "Pearl Collection, Minimal Luxe, Crystal Drops, Layered Necklaces, Statement Earrings" },
        { title: "TURKISH EDIT", icon: "🕌", items: "Evil Eye Collection, Oxidised Silver, Teardrop Earrings, Enamel Jewellery, Layered Necklaces" },
        { title: "INDIAN EDIT", icon: "◈", items: "Kundan Jewellery, Polki Sets, Temple Jewels, Meenakari Collection, Jadau Jewellery" },
        { title: "ARABIAN EDIT", icon: "☽", items: "Statement Sets, Gold Plated, Coin Jewellery, Chunky Chains, Dangle Earrings" },
        { title: "EUROPEAN EDIT", icon: "⚜", items: "Minimal Gold, Pearl Jewellery, Sleek Rings, Hoop Earrings, Tennis Bracelets" },
        { title: "THAI EDIT", icon: "❋", items: "Beaded Jewellery, Handcrafted Silver, Color Stone Earrings, Floral Motifs, Boho Necklaces" }
      ]
    },
    the_edit: {
      image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800",
      tagline: "Curated Picks, Loved by Many",
      heading: "HANDPICKED. TRENDING. TIMELESS.",
      sections: [
        { title: "TRENDING LUXE", icon: "✧", items: "Statement Pieces, Korean Luxe, Minimal Gold, Pearl Trends, Layered Looks" },
        { title: "BEST SELLERS", icon: "♡", items: "Top Rated, Customer Favorites, Most Loved Earrings, Most Loved Necklaces, Most Loved Sets" }
      ]
    }
  });

  const [selectedMegaMenuKey, setSelectedMegaMenuKey] = useState("collections"); // collections, world_edit, the_edit
  const [newSection, setNewSection] = useState({ title: "", icon: "", items: "" });
  const [savingMegaMenus, setSavingMegaMenus] = useState(false);
  const [savedMegaMenus, setSavedMegaMenus] = useState(false);
  const [uploadingMegaMenuImage, setUploadingMegaMenuImage] = useState(false);

  // ─── Initial Load ───────────────────────────────────────────────────────────
  useEffect(() => {
    // Read Hero banner config
    const heroRef = doc(db, "site_settings", "hero");
    getDoc(heroRef).then((snap) => {
      if (snap.exists()) setHeroData(snap.data());
    });

    // Read Top Header Announcements
    const announcementsRef = doc(db, "site_settings", "announcements");
    getDoc(announcementsRef).then((snap) => {
      if (snap.exists() && snap.data().items && snap.data().items.length > 0) {
        setAnnouncements(snap.data().items);
      } else {
        setAnnouncements([
          "✦ Express Shipping Across India ✦",
          "✦ Use Code VELOURAZ5 for 5% OFF on Your First Order ✦",
          "✦ Artisanal Craftsmanship | Handcrafted Designs ✦"
        ]);
      }
    });

    // Read Bottom Hero Section Scroll Texts (Hero Marquee)
    const marqueeRef = doc(db, "site_settings", "hero_marquee");
    getDoc(marqueeRef).then((snap) => {
      if (snap.exists() && snap.data().items && snap.data().items.length > 0) {
        setHeroMarquee(snap.data().items);
      } else {
        setHeroMarquee([
          '✦ Ethically Sourced',
          '✦ Artisanal Craftsmanship',
          '✦ Anti-Tarnish Formula',
          '✦ Global Heritage Designs',
          '✦ Skin Friendly Alloys',
          '✦ 4.9 ★ Patron Rated',
          '✦ Premium Gift Packaging',
          '✦ Easy & Seamless Returns',
        ]);
      }
    });

    // Read Navigation Mega Menus
    const megaMenusRef = doc(db, "site_settings", "mega_menus");
    getDoc(megaMenusRef).then((snap) => {
      if (snap.exists()) {
        setMegaMenus(snap.data());
      }
    });

    // Realtime listen to Homepage World Edits Carousel items
    const stopEdits = onSnapshot(collection(db, "world_edits_carousel"), (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => (a.order || 0) - (b.order || 0));
      setWorldEdits(items);
    });

    // Realtime listen to Header World Edit dropdown items
    const stopHeaderEdits = onSnapshot(collection(db, "header_world_edits"), (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => (a.order || 0) - (b.order || 0));
      setHeaderEdits(items);
    });

    return () => {
      stopEdits();
      stopHeaderEdits();
    };
  }, []);

  // ─── Hero video upload ──────────────────────────────────────────────────────
  const handleHeroVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingHeroVideo(true);
    setHeroVideoProgress(0);
    try {
      const url = await uploadToCloudinaryWithProgress(file, (percent) => {
        setHeroVideoProgress(percent);
      });
      const updated = { ...heroData, videoURL: url };
      setHeroData(updated);
      await setDoc(doc(db, "site_settings", "hero"), updated, { merge: true });
    } catch (err) {
      console.error("Hero video upload failed:", err);
    } finally {
      setUploadingHeroVideo(false);
    }
  };

  const handleDeleteHeroVideo = async () => {
    if (window.confirm("Are you sure you want to remove the Hero video? The fallback image will be displayed.")) {
      const updated = { ...heroData, videoURL: "" };
      setHeroData(updated);
      await setDoc(doc(db, "site_settings", "hero"), updated, { merge: true });
    }
  };

  const handleSaveHero = async () => {
    setSavingHero(true);
    setSavedHero(false);
    try {
      await setDoc(doc(db, "site_settings", "hero"), heroData);
      setSavedHero(true);
      setTimeout(() => setSavedHero(false), 3000);
    } catch (err) {
      console.error("Save hero config failed:", err);
    } finally {
      setSavingHero(false);
    }
  };

  // ─── Announcements actions (Top Header Texts) ────────────────────────────
  const handleAddAnnouncement = () => {
    if (!newAnnouncement.trim()) return;
    setAnnouncements((prev) => [...prev, newAnnouncement.trim()]);
    setNewAnnouncement("");
  };

  const handleUpdateAnnouncement = (index, val) => {
    setAnnouncements((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleMoveAnnouncement = (index, direction) => {
    setAnnouncements((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });
  };

  const handleRemoveAnnouncement = (index) => {
    setAnnouncements((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveAnnouncements = async () => {
    setSavingAnnouncements(true);
    setSavedAnnouncements(false);
    try {
      await setDoc(doc(db, "site_settings", "announcements"), { items: announcements });
      setSavedAnnouncements(true);
      setTimeout(() => setSavedAnnouncements(false), 3000);
    } catch (e) {
      console.error("Save announcements failed:", e);
    } finally {
      setSavingAnnouncements(false);
    }
  };

  // ─── Hero Marquee Scroll Texts actions (Bottom Hero Section) ──────────────
  const handleAddMarquee = () => {
    if (!newMarqueeText.trim()) return;
    setHeroMarquee((prev) => [...prev, newMarqueeText.trim()]);
    setNewMarqueeText("");
  };

  const handleUpdateMarquee = (index, val) => {
    setHeroMarquee((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleMoveMarquee = (index, direction) => {
    setHeroMarquee((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });
  };

  const handleRemoveMarquee = (index) => {
    setHeroMarquee((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveMarquee = async () => {
    setSavingMarquee(true);
    setSavedMarquee(false);
    try {
      await setDoc(doc(db, "site_settings", "hero_marquee"), { items: heroMarquee });
      setSavedMarquee(true);
      setTimeout(() => setSavedMarquee(false), 3000);
    } catch (e) {
      console.error("Save hero marquee failed:", e);
    } finally {
      setSavingMarquee(false);
    }
  };

  // ─── Homepage World Edit Videos actions ──────────────────────────────────────
  const handleWorldEditVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingEditVideo(true);
    setEditVideoProgress(0);
    try {
      const url = await uploadToCloudinaryWithProgress(file, (percent) => {
        setEditVideoProgress(percent);
      });
      if (editingEdit) {
        setEditingEdit((prev) => ({ ...prev, video: url }));
      } else {
        setNewEdit((prev) => ({ ...prev, video: url }));
      }
    } catch (err) {
      console.error("Video upload failed:", err);
    } finally {
      setUploadingEditVideo(false);
    }
  };

  const handleWorldEditPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingEditImage(true);
    try {
      const url = await uploadToCloudinary(file);
      if (editingEdit) {
        setEditingEdit((prev) => ({ ...prev, defaultImage: url, image: url }));
      } else {
        setNewEdit((prev) => ({ ...prev, defaultImage: url, image: url }));
      }
    } catch (err) {
      console.error("Photo upload failed:", err);
    } finally {
      setUploadingEditImage(false);
    }
  };

  const handleWorldEditHoverPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingHoverImage(true);
    try {
      const url = await uploadToCloudinary(file);
      if (editingEdit) {
        setEditingEdit((prev) => ({ ...prev, hoverImage: url }));
      } else {
        setNewEdit((prev) => ({ ...prev, hoverImage: url }));
      }
    } catch (err) {
      console.error("Hover photo upload failed:", err);
    } finally {
      setUploadingHoverImage(false);
    }
  };

  const handleSaveWorldEdit = async (e) => {
    e.preventDefault();
    const data = editingEdit || newEdit;
    if (!data.country) return;

    try {
      const payload = {
        country: data.country.toUpperCase(),
        collection: data.collection || "",
        video: data.video || "",
        videoUrl: data.video || "",
        defaultImage: data.defaultImage || data.image || "",
        hoverImage: data.hoverImage || data.defaultImage || data.image || "",
        image: data.defaultImage || data.image || "",
        link: data.link || `/shop?country=${encodeURIComponent(data.country)}`,
        badge: data.badge || "ORGANIC",
        order: Number(data.order) || 1,
        comingSoon: Boolean(data.comingSoon),
        updatedAt: new Date().toISOString()
      };

      if (editingEdit) {
        await updateDoc(doc(db, "world_edits_carousel", editingEdit.id), payload);
        setEditingEdit(null);
      } else {
        await addDoc(collection(db, "world_edits_carousel"), payload);
        setNewEdit({
          country: "",
          collection: "",
          video: "",
          defaultImage: "",
          hoverImage: "",
          link: "",
          badge: "ORGANIC",
          order: worldEdits.length + 1,
          comingSoon: false
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWorldEdit = async (id) => {
    if (window.confirm("Delete this video card from Homepage World Edit carousel?")) {
      await deleteDoc(doc(db, "world_edits_carousel", id));
    }
  };

  const handleSeedHomepageVideos = async () => {
    if (!window.confirm("This will upload all 5 default homepage videos & current data into database so you can manage them. Continue?")) return;
    setSeedingHomepage(true);
    try {
      for (const item of DEFAULT_HOMEPAGE_WORLD_EDIT_VIDEOS) {
        const itemRef = doc(db, "world_edits_carousel", item.id);
        await setDoc(itemRef, {
          country: item.country,
          collection: item.collection,
          badge: item.badge,
          video: item.video,
          videoUrl: item.video,
          defaultImage: item.defaultImage,
          hoverImage: item.hoverImage,
          image: item.defaultImage,
          link: item.link,
          order: item.order
        }, { merge: true });
      }
    } catch (err) {
      console.error("Error seeding homepage videos:", err);
    } finally {
      setSeedingHomepage(false);
    }
  };

  // ─── Header World Edit Dropdown actions ─────────────────────────────────────
  const handleHeaderBgUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingHeaderBg(true);
    try {
      const url = await uploadToCloudinary(file);
      if (editingHeaderDoc) {
        setEditingHeaderDoc((prev) => ({ ...prev, bgImage: url }));
      } else {
        setNewHeaderDoc((prev) => ({ ...prev, bgImage: url }));
      }
    } catch (err) {
      console.error("Header bg upload failed:", err);
    } finally {
      setUploadingHeaderBg(false);
    }
  };

  const handleSaveHeaderOption = async (e) => {
    e.preventDefault();
    const data = editingHeaderDoc || newHeaderDoc;
    if (!data.country) return;

    try {
      const payload = {
        country: data.country,
        flag: data.flag || "",
        subtitle: data.subtitle || "",
        collection: data.collection || "",
        cta: data.cta || `DISCOVER ${data.country.toUpperCase()}`,
        href: data.href || `/shop?country=${encodeURIComponent(data.country)}`,
        bgImage: data.bgImage || "",
        order: Number(data.order) || 1,
        comingSoon: Boolean(data.comingSoon),
        updatedAt: new Date().toISOString()
      };

      if (editingHeaderDoc) {
        await updateDoc(doc(db, "header_world_edits", editingHeaderDoc.id), payload);
        setEditingHeaderDoc(null);
      } else {
        await addDoc(collection(db, "header_world_edits"), payload);
        setNewHeaderDoc({
          country: "",
          flag: "",
          subtitle: "",
          collection: "",
          cta: "",
          href: "",
          bgImage: "",
          order: headerEdits.length + 1,
          comingSoon: false
        });
      }
    } catch (err) {
      console.error("Error saving header option:", err);
    }
  };

  const handleDeleteHeaderOption = async (id) => {
    if (window.confirm("Delete this option from Header World Edit dropdown?")) {
      await deleteDoc(doc(db, "header_world_edits", id));
    }
  };

  const handleSeedHeaderOptions = async () => {
    if (!window.confirm("This will upload all 5 default header dropdown items & current images to database so you can manage them. Continue?")) return;
    setSeedingHeader(true);
    try {
      for (const item of DEFAULT_HEADER_WORLD_EDITS) {
        const itemRef = doc(db, "header_world_edits", item.id);
        await setDoc(itemRef, {
          country: item.country,
          flag: item.flag,
          subtitle: item.subtitle,
          collection: item.collection,
          cta: item.cta,
          href: item.href,
          bgImage: item.bgImage,
          order: item.order
        }, { merge: true });
      }
    } catch (err) {
      console.error("Error seeding header options:", err);
    } finally {
      setSeedingHeader(false);
    }
  };


  // ─── Mega Menus config ─────────────────────────────────────────────────────
  const handleMegaMenuPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMegaMenuImage(true);
    try {
      const url = await uploadToCloudinary(file);
      setMegaMenus((prev) => ({
        ...prev,
        [selectedMegaMenuKey]: {
          ...prev[selectedMegaMenuKey],
          image: url
        }
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingMegaMenuImage(false);
    }
  };

  const handleSaveMegaMenus = async () => {
    setSavingMegaMenus(true);
    setSavedMegaMenus(false);
    try {
      await setDoc(doc(db, "site_settings", "mega_menus"), megaMenus);
      setSavedMegaMenus(true);
      setTimeout(() => setSavedMegaMenus(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingMegaMenus(false);
    }
  };

  const handleAddSection = () => {
    if (!newSection.title.trim()) return;
    const updatedSections = [...megaMenus[selectedMegaMenuKey].sections, {
      title: newSection.title.toUpperCase(),
      icon: newSection.icon || "✧",
      items: newSection.items
    }];
    setMegaMenus((prev) => ({
      ...prev,
      [selectedMegaMenuKey]: {
        ...prev[selectedMegaMenuKey],
        sections: updatedSections
      }
    }));
    setNewSection({ title: "", icon: "", items: "" });
  };

  const handleRemoveSection = (index) => {
    const updatedSections = megaMenus[selectedMegaMenuKey].sections.filter((_, idx) => idx !== index);
    setMegaMenus((prev) => ({
      ...prev,
      [selectedMegaMenuKey]: {
        ...prev[selectedMegaMenuKey],
        sections: updatedSections
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className={`flex gap-2 border-b pb-3 flex-wrap ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
        {[
          { id: "hero", label: "Hero Video & Banner" },
          { id: "announcements", label: "Top Header Texts" },
          { id: "hero_marquee", label: "Bottom Hero Scroll Texts" },
          { id: "world_edits", label: "Homepage World Edit Videos" },
          { id: "header_world_edit", label: "Header World Edit Dropdown" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-base font-bold transition-all ${activeSubTab === tab.id
              ? "bg-[#941232] text-white animate-pulse"
              : `${isDarkMode ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Hero Section Editor ─── */}
      {activeSubTab === "hero" && (
        <div className={cardStyle}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>Hero Video & Content</h3>
              <p className="text-base text-slate-400">Configure title, subtitle, promotional video and CTA links</p>
            </div>
            <button
              onClick={handleSaveHero}
              disabled={savingHero}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#941232] hover:bg-[#b01540] text-white text-base font-bold transition-all disabled:opacity-50"
            >
              {savingHero ? <Loader2 size={13} className="animate-spin" /> : savedHero ? <Check size={13} /> : <Save size={13} />}
              {savingHero ? "Saving..." : savedHero ? "Saved!" : "Save Hero Section"}
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className={labelStyle}>Hero Video Source (MP4 / Webm)</label>
                  {heroData.videoURL && (
                    <button
                      type="button"
                      onClick={handleDeleteHeroVideo}
                      className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 hover:underline"
                    >
                      <Trash2 size={12} /> Remove Video
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={heroData.videoURL || ""}
                    onChange={(e) => setHeroData({ ...heroData, videoURL: e.target.value })}
                    className={inp}
                    placeholder="Enter video URL link or upload below"
                  />
                  <label className={`flex items-center justify-center px-3 py-2 rounded-xl border border-dashed border-slate-350 cursor-pointer ${isDarkMode ? "bg-slate-900 text-slate-300 hover:bg-slate-800" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`} title="Upload new video">
                    <Video size={16} />
                    <span className="text-xs font-semibold ml-1.5 hidden sm:inline">Upload</span>
                    <input type="file" accept="video/*" className="hidden" onChange={handleHeroVideoUpload} />
                  </label>
                  {heroData.videoURL && (
                    <button
                      type="button"
                      onClick={handleDeleteHeroVideo}
                      className="px-3 py-2 bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                      title="Delete video"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {uploadingHeroVideo && (
                  <div className="mt-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-amber-600">
                      <span className="flex items-center gap-1.5">
                        <Loader2 size={13} className="animate-spin" /> Uploading Video to Cloudinary...
                      </span>
                      <span className="font-mono text-sm">{heroVideoProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-amber-600 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${heroVideoProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                {!heroData.videoURL && <p className="text-xs text-slate-400 mt-1 italic">No video active. Homepage hero will show the fallback background image.</p>}
              </div>

              <div>
                <label className={labelStyle}>Hero Fallback Poster Image</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={heroData.posterURL || ""}
                    onChange={(e) => setHeroData({ ...heroData, posterURL: e.target.value })}
                    className={inp}
                    placeholder="e.g. /img/b (1).jpeg or Cloudinary URL"
                  />
                  <label className={`flex items-center justify-center px-3 py-2 rounded-xl border border-dashed border-slate-350 cursor-pointer ${isDarkMode ? "bg-slate-900 text-slate-300 hover:bg-slate-800" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`} title="Upload poster image">
                    <ImageIcon size={16} />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const url = await uploadToCloudinary(file);
                          setHeroData((prev) => ({ ...prev, posterURL: url }));
                        } catch (err) {
                          console.error("Poster upload failed:", err);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className={labelStyle}>Eyebrow Subtitle</label>
                <input
                  type="text"
                  value={heroData.eyebrow}
                  onChange={(e) => setHeroData({ ...heroData, eyebrow: e.target.value })}
                  className={inp}
                />
              </div>

              <div>
                <label className={labelStyle}>Hero Main Headline</label>
                <input
                  type="text"
                  value={heroData.title}
                  onChange={(e) => setHeroData({ ...heroData, title: e.target.value })}
                  className={inp}
                />
              </div>

              <div>
                <label className={labelStyle}>Hero Sub-copy description</label>
                <textarea
                  rows={2}
                  value={heroData.subtitle}
                  onChange={(e) => setHeroData({ ...heroData, subtitle: e.target.value })}
                  className={`${inp} resize-none`}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Button 1 Label</label>
                  <input
                    type="text"
                    value={heroData.btn1Text}
                    onChange={(e) => setHeroData({ ...heroData, btn1Text: e.target.value })}
                    className={inp}
                  />
                </div>
                <div>
                  <label className={labelStyle}>Button 1 Link</label>
                  <input
                    type="text"
                    value={heroData.btn1Link}
                    onChange={(e) => setHeroData({ ...heroData, btn1Link: e.target.value })}
                    className={inp}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Button 2 Label</label>
                  <input
                    type="text"
                    value={heroData.btn2Text}
                    onChange={(e) => setHeroData({ ...heroData, btn2Text: e.target.value })}
                    className={inp}
                  />
                </div>
                <div>
                  <label className={labelStyle}>Button 2 Link</label>
                  <input
                    type="text"
                    value={heroData.btn2Link}
                    onChange={(e) => setHeroData({ ...heroData, btn2Link: e.target.value })}
                    className={inp}
                  />
                </div>
              </div>

              {/* Video / Banner Preview */}
              <div className="rounded-xl border border-slate-100 dark:border-slate-700/60 overflow-hidden bg-slate-900 relative aspect-video flex items-center justify-center group">
                {heroData.videoURL ? (
                  <>
                    <video src={heroData.videoURL} autoPlay muted loop className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 z-20">
                      <button
                        type="button"
                        onClick={handleDeleteHeroVideo}
                        className="px-2.5 py-1.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-lg text-xs font-bold shadow-lg flex items-center gap-1 backdrop-blur-md transition-all"
                      >
                        <Trash2 size={12} /> Delete Video
                      </button>
                    </div>
                  </>
                ) : heroData.posterURL ? (
                  <img src={heroData.posterURL} alt="Hero Poster" className="w-full h-full object-cover" />
                ) : (
                  <img src="/img/b (1).jpeg" alt="Default Hero Poster" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/45 p-4 flex flex-col justify-end text-white pointer-events-none">
                  <p className="text-[14px] uppercase tracking-widest text-[#C8A97A] font-bold">{heroData.eyebrow}</p>
                  <h4 className="font-serif text-lg font-semibold text-white mt-1 leading-tight">{heroData.title}</h4>
                  <p className="text-xs text-white/70 line-clamp-1 mt-0.5">{heroData.subtitle}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Top Header Announcement Texts Editor ─── */}
      {activeSubTab === "announcements" && (
        <div className={cardStyle}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className={`text-base font-bold ${isDarkMode ? "text-white" : "text-slate-800"} flex items-center gap-2`}>
                <Type size={18} className="text-[#941232]" />
                Top Header Announcement Texts
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage revolving promotional ticker lines shown in the top crimson header bar.
              </p>
            </div>
            <button
              onClick={handleSaveAnnouncements}
              disabled={savingAnnouncements}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#941232] hover:bg-[#b01540] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              {savingAnnouncements ? <Loader2 size={14} className="animate-spin" /> : savedAnnouncements ? <Check size={14} /> : <Save size={14} />}
              {savingAnnouncements ? "Saving..." : savedAnnouncements ? "Saved!" : "Save Header Texts"}
            </button>
          </div>

          {/* Live Preview Box */}
          <div className="mb-6 p-3 bg-[#2e0e43] rounded-2xl text-center border border-[#C8A97A]/30 shadow-inner overflow-hidden">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#C8A97A] block mb-1">
              ✦ Live Top Header Preview ✦
            </span>
            <div className="text-xs sm:text-sm font-sans font-medium uppercase tracking-[0.16em] text-white/90 truncate py-1">
              {announcements.length > 0 ? announcements[0] : "✦ Express Shipping Across India ✦"}
            </div>
          </div>

          <div className="space-y-5">
            {/* Add Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newAnnouncement}
                onChange={(e) => setNewAnnouncement(e.target.value)}
                className={inp}
                placeholder="Add new header text line (e.g. ✦ Express Shipping Across India ✦)"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddAnnouncement(); } }}
              />
              <button
                type="button"
                onClick={handleAddAnnouncement}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#941232] hover:bg-[#b01540] transition-all shrink-0 cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={14} /> Add Line
              </button>
            </div>

            {/* List */}
            <div className="space-y-2.5">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                Active Header Lines ({announcements.length})
              </h4>
              <div className={`border rounded-2xl divide-y overflow-hidden ${isDarkMode ? "border-slate-800 divide-slate-800" : "border-slate-100 divide-slate-100"}`}>
                {announcements.map((text, index) => (
                  <div key={index} className={`flex items-center gap-3 p-3 text-sm ${isDarkMode ? "bg-slate-900/60" : "bg-slate-50/60"}`}>
                    <span className="text-xs font-mono font-bold text-slate-400 w-5 shrink-0">#{index + 1}</span>
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => handleUpdateAnnouncement(index, e.target.value)}
                      className={`flex-1 min-w-0 bg-transparent outline-none font-semibold text-xs sm:text-sm ${isDarkMode ? "text-white" : "text-slate-800"}`}
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveAnnouncement(index, -1)}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 transition-all cursor-pointer"
                        title="Move Up"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveAnnouncement(index, 1)}
                        disabled={index === announcements.length - 1}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 transition-all cursor-pointer"
                        title="Move Down"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveAnnouncement(index)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                        title="Delete Line"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {announcements.length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-400 italic">No header text lines configured. Click Add above.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Bottom Hero Scroll Texts Editor (Hero Marquee) ─── */}
      {activeSubTab === "hero_marquee" && (
        <div className={cardStyle}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className={`text-base font-bold ${isDarkMode ? "text-white" : "text-slate-800"} flex items-center gap-2`}>
                <Sparkles size={18} className="text-[#941232]" />
                Bottom Hero Section Scroll Texts
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage the continuous scrolling ticker lines displayed right at the bottom of the Hero section.
              </p>
            </div>
            <button
              onClick={handleSaveMarquee}
              disabled={savingMarquee}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#941232] hover:bg-[#b01540] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              {savingMarquee ? <Loader2 size={14} className="animate-spin" /> : savedMarquee ? <Check size={14} /> : <Save size={14} />}
              {savingMarquee ? "Saving..." : savedMarquee ? "Saved!" : "Save Scroll Tickers"}
            </button>
          </div>

          {/* Live Marquee Preview Banner */}
          <div className="mb-6 p-3.5 bg-gradient-to-r from-[#170624] via-[#2A0E40] to-[#170624] border border-[#C8A97A]/40 rounded-2xl overflow-hidden shadow-md">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#C8A97A] block text-center mb-2">
              ✦ Live Bottom Hero Marquee Scroll Preview ✦
            </span>
            <div className="flex gap-8 overflow-x-auto no-scrollbar py-1 text-xs tracking-[0.2em] uppercase font-semibold text-[#F5E6CE]">
              {heroMarquee.map((item, idx) => (
                <span key={idx} className="shrink-0 whitespace-nowrap">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            {/* Add Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newMarqueeText}
                onChange={(e) => setNewMarqueeText(e.target.value)}
                className={inp}
                placeholder="Add new scrolling ticker line (e.g. ✦ Anti-Tarnish Lustre)"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddMarquee(); } }}
              />
              <button
                type="button"
                onClick={handleAddMarquee}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#941232] hover:bg-[#b01540] transition-all shrink-0 cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={14} /> Add Scroll Line
              </button>
            </div>

            {/* List */}
            <div className="space-y-2.5">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                Active Scrolling Ticker Lines ({heroMarquee.length})
              </h4>
              <div className={`border rounded-2xl divide-y overflow-hidden ${isDarkMode ? "border-slate-800 divide-slate-800" : "border-slate-100 divide-slate-100"}`}>
                {heroMarquee.map((text, index) => (
                  <div key={index} className={`flex items-center gap-3 p-3 text-sm ${isDarkMode ? "bg-slate-900/60" : "bg-slate-50/60"}`}>
                    <span className="text-xs font-mono font-bold text-slate-400 w-5 shrink-0">#{index + 1}</span>
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => handleUpdateMarquee(index, e.target.value)}
                      className={`flex-1 min-w-0 bg-transparent outline-none font-semibold text-xs sm:text-sm ${isDarkMode ? "text-white" : "text-slate-800"}`}
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveMarquee(index, -1)}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 transition-all cursor-pointer"
                        title="Move Up"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveMarquee(index, 1)}
                        disabled={index === heroMarquee.length - 1}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 transition-all cursor-pointer"
                        title="Move Down"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveMarquee(index)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                        title="Delete Line"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {heroMarquee.length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-400 italic">No scrolling ticker lines configured. Click Add above.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Homepage World Edit Videos Editor ─── */}
      {activeSubTab === "world_edits" && (
        <div className="space-y-6">
          <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${cardStyle}`}>
            <div>
              <h3 className={`text-base font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                Homepage World Edit Videos & Data
              </h3>
              <p className="text-base text-slate-400">
                Manage interactive video cards displayed on the homepage World Edits section
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            {/* Form */}
            <div className={cardStyle}>
              <h3 className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-slate-800"} mb-4`}>
                {editingEdit ? "Edit Homepage Video Card" : "Add New Homepage Video Card"}
              </h3>
              <form onSubmit={handleSaveWorldEdit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>Country Name *</label>
                    <input
                      type="text"
                      required
                      value={editingEdit ? editingEdit.country : newEdit.country}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (editingEdit) setEditingEdit({ ...editingEdit, country: val });
                        else setNewEdit({ ...newEdit, country: val });
                      }}
                      className={inp}
                      placeholder="e.g. PARIS"
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Collection / Sub-header Label</label>
                    <input
                      type="text"
                      value={editingEdit ? editingEdit.collection : newEdit.collection}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (editingEdit) setEditingEdit({ ...editingEdit, collection: val });
                        else setNewEdit({ ...newEdit, collection: val });
                      }}
                      className={inp}
                      placeholder="e.g. THE MAISON PARIS"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelStyle}>Video File / Video URL *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingEdit ? (editingEdit.video || editingEdit.videoUrl || "") : newEdit.video}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (editingEdit) setEditingEdit({ ...editingEdit, video: val, videoUrl: val });
                        else setNewEdit({ ...newEdit, video: val });
                      }}
                      className={inp}
                      placeholder="Enter direct video URL or upload file"
                    />
                    <label className={`flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl border border-dashed border-slate-350 cursor-pointer shrink-0 ${isDarkMode ? "bg-slate-900 text-slate-300" : "bg-slate-50 text-slate-600"}`}>
                      <Video size={16} />
                      <span className="text-xs font-bold">Upload Video</span>
                      <input type="file" accept="video/*" className="hidden" onChange={handleWorldEditVideoUpload} />
                    </label>
                  </div>
                  {uploadingEditVideo && (
                    <div className="mt-2 space-y-1">
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div className="bg-[#941232] h-2 rounded-full transition-all duration-300" style={{ width: `${editVideoProgress}%` }} />
                      </div>
                      <p className="text-[16px] text-amber-600 font-semibold animate-pulse">Uploading Video: {editVideoProgress}%</p>
                    </div>
                  )}
                </div>



                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className={labelStyle}>Redirect Link</label>
                    <input
                      type="text"
                      value={editingEdit ? editingEdit.link : newEdit.link}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (editingEdit) setEditingEdit({ ...editingEdit, link: val });
                        else setNewEdit({ ...newEdit, link: val });
                      }}
                      className={inp}
                      placeholder="e.g. /shop?country=Paris"
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Sort Order</label>
                    <input
                      type="number"
                      value={editingEdit ? (editingEdit.order || 1) : newEdit.order}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (editingEdit) setEditingEdit({ ...editingEdit, order: val });
                        else setNewEdit({ ...newEdit, order: val });
                      }}
                      className={inp}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-800/40">
                  <input
                    type="checkbox"
                    id="worldEditComingSoon"
                    checked={editingEdit ? Boolean(editingEdit.comingSoon) : Boolean(newEdit.comingSoon)}
                    onChange={(e) => {
                      const val = e.target.checked;
                      if (editingEdit) setEditingEdit({ ...editingEdit, comingSoon: val });
                      else setNewEdit({ ...newEdit, comingSoon: val });
                    }}
                    className="w-4 h-4 rounded border-slate-300 accent-[#941232] cursor-pointer"
                  />
                  <label htmlFor="worldEditComingSoon" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    Display as <span className="text-[#941232] dark:text-amber-400 font-bold">Coming Soon</span> in Storefront (Shows luxury arriving soon preview when products are not uploaded yet)
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#941232] hover:bg-[#b01540] text-white text-base font-bold rounded-xl shadow-md transition-all"
                  >
                    {editingEdit ? "Update Homepage Card" : "Add Homepage Card"}
                  </button>
                  {editingEdit && (
                    <button
                      type="button"
                      onClick={() => setEditingEdit(null)}
                      className="px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-bold"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* List */}
            <div className="space-y-4">
              <h3 className={`text-md font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                Active Homepage Video Cards (({worldEdits.length}))
              </h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {worldEdits.map((item) => {
                  const videoSrc = item.video || item.videoUrl;
                  const imgSrc = item.defaultImage || item.image || item.hoverImage;
                  return (
                    <div key={item.id} className={`flex gap-3 p-3.5 border rounded-2xl items-center ${isDarkMode ? "bg-slate-855 border-slate-700" : "bg-white border-slate-100"}`}>
                      <div className="w-16 h-20 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 relative">
                        {videoSrc ? (
                          <video src={videoSrc} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                        ) : imgSrc ? (
                          <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500"><Video size={18} /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-base font-bold uppercase truncate ${isDarkMode ? "text-white" : "text-slate-800"}`}>{item.country}</p>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400">Order: {item.order || 1}</span>
                          {item.comingSoon && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-300/40">
                              ✦ Coming Soon
                            </span>
                          )}
                        </div>
                        <p className="text-[14px] text-slate-400 truncate">{item.collection || "No collection label"}</p>
                        <p className="text-[12px] text-slate-400 truncate font-mono mt-0.5">{item.link}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setEditingEdit(item)}
                          className={`p-2 rounded-xl ${isDarkMode ? "bg-slate-750 text-white hover:bg-slate-700" : "bg-slate-100 text-slate-650 hover:bg-slate-200"}`}
                          title="Edit"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteWorldEdit(item.id)}
                          className="p-2 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-xl text-rose-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Header World Edit Dropdown Editor ─── */}
      {activeSubTab === "header_world_edit" && (
        <div className="space-y-6">
          <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${cardStyle}`}>
            <div>
              <h3 className={`text-base font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                Header "World Edit" Dropdown Menu & Images
              </h3>
              <p className="text-base text-slate-400">
                Manage the destination columns, background images, titles, and CTA links shown when hovering "World Edit" in the site header
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            {/* Form */}
            <div className={cardStyle}>
              <h3 className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-slate-800"} mb-4`}>
                {editingHeaderDoc ? "Edit Header Dropdown Option" : "Add New Header Dropdown Option"}
              </h3>
              <form onSubmit={handleSaveHeaderOption} className="space-y-4">
                <div>
                  <label className={labelStyle}>Country Name *</label>
                  <input
                    type="text"
                    required
                    value={editingHeaderDoc ? editingHeaderDoc.country : newHeaderDoc.country}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (editingHeaderDoc) setEditingHeaderDoc({ ...editingHeaderDoc, country: val });
                      else setNewHeaderDoc({ ...newHeaderDoc, country: val });
                    }}
                    className={inp}
                    placeholder="e.g. Paris"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>Subtitle Label</label>
                    <input
                      type="text"
                      value={editingHeaderDoc ? editingHeaderDoc.subtitle : newHeaderDoc.subtitle}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (editingHeaderDoc) setEditingHeaderDoc({ ...editingHeaderDoc, subtitle: val });
                        else setNewHeaderDoc({ ...newHeaderDoc, subtitle: val });
                      }}
                      className={inp}
                      placeholder="e.g. Inspired by Paris"
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Collection Header Label</label>
                    <input
                      type="text"
                      value={editingHeaderDoc ? editingHeaderDoc.collection : newHeaderDoc.collection}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (editingHeaderDoc) setEditingHeaderDoc({ ...editingHeaderDoc, collection: val });
                        else setNewHeaderDoc({ ...newHeaderDoc, collection: val });
                      }}
                      className={inp}
                      placeholder="e.g. THE MAISON PARIS"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelStyle}>Cover Background Image URL / File *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingHeaderDoc ? (editingHeaderDoc.bgImage || editingHeaderDoc.image || "") : newHeaderDoc.bgImage}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (editingHeaderDoc) setEditingHeaderDoc({ ...editingHeaderDoc, bgImage: val });
                        else setNewHeaderDoc({ ...newHeaderDoc, bgImage: val });
                      }}
                      className={inp}
                      placeholder="Image URL link"
                    />
                    <label className={`flex items-center justify-center p-2.5 rounded-xl border border-dashed border-slate-350 cursor-pointer shrink-0 ${isDarkMode ? "bg-slate-900 text-slate-300" : "bg-slate-50 text-slate-600"}`}>
                      <ImagePlus size={16} />
                      <input type="file" accept="image/*" className="hidden" onChange={handleHeaderBgUpload} />
                    </label>
                  </div>
                  {uploadingHeaderBg && <p className="text-[16px] text-amber-600 font-semibold animate-pulse mt-1">Uploading Cover Image...</p>}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelStyle}>CTA Button Text</label>
                    <input
                      type="text"
                      value={editingHeaderDoc ? editingHeaderDoc.cta : newHeaderDoc.cta}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (editingHeaderDoc) setEditingHeaderDoc({ ...editingHeaderDoc, cta: val });
                        else setNewHeaderDoc({ ...newHeaderDoc, cta: val });
                      }}
                      className={inp}
                      placeholder="e.g. DISCOVER PARIS"
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Redirect Link (Href)</label>
                    <input
                      type="text"
                      value={editingHeaderDoc ? (editingHeaderDoc.href || editingHeaderDoc.link || "") : newHeaderDoc.href}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (editingHeaderDoc) setEditingHeaderDoc({ ...editingHeaderDoc, href: val });
                        else setNewHeaderDoc({ ...newHeaderDoc, href: val });
                      }}
                      className={inp}
                      placeholder="e.g. /shop?country=Paris"
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Sort Order</label>
                    <input
                      type="number"
                      value={editingHeaderDoc ? (editingHeaderDoc.order || 1) : newHeaderDoc.order}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (editingHeaderDoc) setEditingHeaderDoc({ ...editingHeaderDoc, order: val });
                        else setNewHeaderDoc({ ...newHeaderDoc, order: val });
                      }}
                      className={inp}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-800/40">
                  <input
                    type="checkbox"
                    id="headerEditComingSoon"
                    checked={editingHeaderDoc ? Boolean(editingHeaderDoc.comingSoon) : Boolean(newHeaderDoc.comingSoon)}
                    onChange={(e) => {
                      const val = e.target.checked;
                      if (editingHeaderDoc) setEditingHeaderDoc({ ...editingHeaderDoc, comingSoon: val });
                      else setNewHeaderDoc({ ...newHeaderDoc, comingSoon: val });
                    }}
                    className="w-4 h-4 rounded border-slate-300 accent-[#941232] cursor-pointer"
                  />
                  <label htmlFor="headerEditComingSoon" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    Display as <span className="text-[#941232] dark:text-amber-400 font-bold">Coming Soon</span> in Storefront (Shows luxury arriving soon preview when products are not uploaded yet)
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#941232] hover:bg-[#b01540] text-white text-base font-bold rounded-xl shadow-md transition-all"
                  >
                    {editingHeaderDoc ? "Update Dropdown Option" : "Add Dropdown Option"}
                  </button>
                  {editingHeaderDoc && (
                    <button
                      type="button"
                      onClick={() => setEditingHeaderDoc(null)}
                      className="px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-bold"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* List */}
            <div className="space-y-4">
              <h3 className={`text-md font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                Active Header Dropdown Items ({headerEdits.length})
              </h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {headerEdits.map((item) => {
                  const bgImg = item.bgImage || item.image;
                  return (
                    <div key={item.id} className={`flex gap-3 p-3.5 border rounded-2xl items-center ${isDarkMode ? "bg-slate-855 border-slate-700" : "bg-white border-slate-100"}`}>
                      <div className="w-16 h-20 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 relative">
                        {bgImg ? (
                          <img src={bgImg} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500"><ImageIcon size={18} /></div>
                        )}
                        {item.flag && (
                          <span className="absolute top-1 left-1 text-sm bg-black/60 rounded-md px-1">{item.flag}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-base font-bold truncate ${isDarkMode ? "text-white" : "text-slate-800"}`}>{item.country}</p>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400">Order: {item.order || 1}</span>
                          {item.comingSoon && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-300/40">
                              ✦ Coming Soon
                            </span>
                          )}
                        </div>
                        <p className="text-[14px] text-slate-400 truncate">{item.subtitle || item.collection || "No subtitle"}</p>
                        <p className="text-[12px] text-slate-400 truncate font-mono mt-0.5">{item.href || item.link}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setEditingHeaderDoc(item)}
                          className={`p-2 rounded-xl ${isDarkMode ? "bg-slate-750 text-white hover:bg-slate-700" : "bg-slate-100 text-slate-650 hover:bg-slate-200"}`}
                          title="Edit"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteHeaderOption(item.id)}
                          className="p-2 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-xl text-rose-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteSettingsManager;
