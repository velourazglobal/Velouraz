import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../components/useAuth';
import { db } from '../components/Firebase';
import { doc, setDoc, deleteDoc, collection, onSnapshot, getDocs, writeBatch } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const StoreContext = createContext(null);

export const StoreProvider = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);

  // Merge local guest cart to user account upon authentication
  const mergeGuestCartToUser = async (targetUid) => {
    const uid = targetUid || user?.uid;
    if (!uid) return;

    try {
      const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
      if (localCart.length > 0) {
        const batch = writeBatch(db);
        localCart.forEach((item) => {
          const itemRef = doc(db, "users", uid, "cart", item.id);
          batch.set(itemRef, item, { merge: true });
        });
        await batch.commit();
        localStorage.removeItem('cart');
      }
    } catch (err) {
      console.error("Error merging guest cart to user account:", err);
    }
  };

  // Sync with Firestore or LocalStorage
  useEffect(() => {
    let unsubscribeCart = () => {};
    let unsubscribeWishlist = () => {};

    if (user) {
      // Auto merge guest cart if items exist
      mergeGuestCartToUser(user.uid);

      // Real-time sync for logged-in user
      const cartRef = collection(db, "users", user.uid, "cart");
      unsubscribeCart = onSnapshot(cartRef, (snap) => {
        setCartItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      const wishRef = collection(db, "users", user.uid, "wishlist");
      unsubscribeWishlist = onSnapshot(wishRef, (snap) => {
        setWishlistItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    } else {
      // Guest: Load from LocalStorage
      const loadLocal = () => {
        const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
        setCartItems(localCart);
        setWishlistItems([]);
      };
      loadLocal();
      
      // Listen for storage changes in other tabs
      window.addEventListener('storage', loadLocal);
      return () => window.removeEventListener('storage', loadLocal);
    }

    return () => {
      unsubscribeCart();
      unsubscribeWishlist();
    };
  }, [user]);

  const addToCart = async (product, qty = 1) => {
    // Guard against zero-stock
    const stockNum = Number(product.stock || 0);
    if (stockNum <= 0) {
      alert('This item is currently out of stock.');
      return false;
    }

    const existing = cartItems.find(i => i.id === product.id);
    const maxAllowed = Math.min(10, stockNum);
    const currentQty = existing ? (existing.quantity || 1) : 0;
    const finalQty = Math.min(maxAllowed, currentQty + qty);

    if (existing && currentQty >= maxAllowed) {
      alert(`Limit reached. Maximum available stock: ${stockNum}`);
      return false;
    }

    const item = {
      id: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      original_price: Number(product.original_price) || 0,
      image: product.image || product.images?.[0] || "",
      addedAt: new Date().toISOString(),
      quantity: finalQty,
      stock: stockNum
    };

    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid, "cart", product.id), item);
        return true;
      } catch (error) {
        console.error("Error adding to cart:", error);
        return false;
      }
    } else {
      let localCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const index = localCart.findIndex(i => i.id === product.id);
      
      if (index > -1) {
        localCart[index] = { ...localCart[index], ...item };
      } else {
        localCart.push(item);
      }
      
      localStorage.setItem('cart', JSON.stringify(localCart));
      setCartItems([...localCart]);
      return true;
    }
  };

  const removeFromCart = async (productId) => {
    if (user) {
      try {
        await deleteDoc(doc(db, "users", user.uid, "cart", productId));
        return true;
      } catch (error) {
        console.error("Error removing from cart:", error);
        return false;
      }
    } else {
      let localCart = JSON.parse(localStorage.getItem('cart') || '[]');
      localCart = localCart.filter(i => i.id !== productId);
      localStorage.setItem('cart', JSON.stringify(localCart));
      setCartItems([...localCart]);
      return true;
    }
  };

  const updateCartQuantity = async (productId, newQty) => {
    const item = cartItems.find(i => i.id === productId);
    if (!item) return false;
    
    // Decrement to 0 = remove the item
    if (newQty < 1) {
      return removeFromCart(productId);
    }

    const stockNum = Number(item.stock || 0);
    const maxAllowed = Math.min(10, stockNum > 0 ? stockNum : newQty);
    if (newQty > maxAllowed) {
      alert(`Only ${stockNum} pieces are available in stock.`);
      return false;
    }

    if (user) {
      try {
        const itemRef = doc(db, "users", user.uid, "cart", productId);
        await setDoc(itemRef, { quantity: newQty }, { merge: true });
        return true;
      } catch (error) {
        console.error("Error updating quantity:", error);
        return false;
      }
    } else {
      let localCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const index = localCart.findIndex(i => i.id === productId);
      if (index > -1) {
        localCart[index].quantity = newQty;
        localStorage.setItem('cart', JSON.stringify(localCart));
        setCartItems([...localCart]);
      }
      return true;
    }
  };

  const addToWishlist = async (product) => {
    if (!user) {
      navigate('/login');
      return false;
    }

    const item = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image || product.images?.[0] || "",
      addedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "users", user.uid, "wishlist", product.id), item);
      return true;
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      return false;
    }
  };

  const clearCart = async () => {
    if (user) {
      try {
        const snap = await getDocs(collection(db, "users", user.uid, "cart"));
        const batch = writeBatch(db);
        snap.docs.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
        setCartItems([]);
        return true;
      } catch (error) {
        console.error("Error clearing cart in Firestore:", error);
        return false;
      }
    } else {
      localStorage.removeItem('cart');
      setCartItems([]);
      return true;
    }
  };

  const isInCart = (productId) => cartItems.some(i => i.id === productId);
  const isInWishlist = (productId) => wishlistItems.some(i => i.id === productId);

  return (
    <StoreContext.Provider value={{ 
      cartItems, 
      wishlistItems, 
      cartCount: cartItems.length, 
      wishlistCount: wishlistItems.length,
      addToCart, 
      updateCartQuantity,
      removeFromCart,
      clearCart,
      mergeGuestCartToUser,
      addToWishlist, 
      isInCart, 
      isInWishlist 
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};

// Compatibility export for old hook name
export const useCartWishlist = useStore;
