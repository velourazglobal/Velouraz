import "./App.css";
import { Suspense, lazy } from "react";
import { useState, useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import AuthProvider from "./components/AuthProvider";
import { StoreProvider } from "./hooks/useStore";
import ScrollToTop from "./components/ScrollToTop";
import Preloader from "./pages/Preloader";




const Home = lazy(() => import("./components/Homepage/Home"));
const Admin = lazy(() => import("./pages/Admin/Admin"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin/SuperAdmin"));
const Login = lazy(() => import("./components/Login"));
const Signup = lazy(() => import("./components/Signup"));
const Cart = lazy(() => import("./layouts/Cart"));
const Wishlist = lazy(() => import("./components/Wishlist"));
const ProductDetail = lazy(() => import("./layouts/ProductDetail"));
const QuickView = lazy(() => import("./components/QuickView"));
const Account = lazy(() => import("./pages/Account"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Shop = lazy(() => import("./pages/Shop"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const ReturnPolicy = lazy(() => import("./pages/ReturnPolicy"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogDetail = lazy(() => import("./pages/BlogDetail"));
const WorldEdit = lazy(() => import("./pages/WorldEdit"));
const IndiaEdit = lazy(() => import("./pages/IndiaEdit"));
const Gallery = lazy(() => import("./pages/Gallery"));
const NotFound = lazy(() => import("./pages/NotFound"));

import WhatsAppButton from "./components/WhatsAppButton";
import InstagramButton from "./components/InstagramButton";

const AppRoutes = () => {
  const location = useLocation();
  const hideChrome =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/superadmin") ||
    location.pathname.startsWith("/super") ||
    location.pathname === "/login" ||
    location.pathname === "/signup";

  return (
    <>
      <ScrollToTop />
      {!hideChrome && <Header />}
      <Suspense fallback={<div className="h-screen w-full bg-[#0A0705]" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/superadmin" element={<SuperAdmin />} />
          <Route path="/super" element={<SuperAdmin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success/:id" element={<OrderSuccess />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/account" element={<Account />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/track-order" element={<Orders />} />
          <Route path="/track-order/:id" element={<Orders />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/product/:id/quickview" element={<QuickView />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/return-policy" element={<ReturnPolicy />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogDetail />} />
          <Route path="/journal" element={<Blog />} />
          <Route path="/world-edit" element={<WorldEdit />} />
          <Route path="/world-edit/india" element={<IndiaEdit />} />
          <Route path="/india-edit" element={<IndiaEdit />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      {!hideChrome && <Footer />}
      {!hideChrome && <InstagramButton />}
      {!hideChrome && <WhatsAppButton />}
    </>
  );
};

function App() {
  const [isPreloaderDone, setIsPreloaderDone] = useState(false);

  return (
    <>
      {!isPreloaderDone && <Preloader onComplete={() => setIsPreloaderDone(true)} />}
      <AuthProvider>
        <BrowserRouter>
          <StoreProvider>
            <AppRoutes />
          </StoreProvider>
        </BrowserRouter>
      </AuthProvider>
    </>
  );
}

export default App
