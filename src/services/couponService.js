import { db } from "../components/Firebase";
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, getDocs } from "firebase/firestore";

// Seed default coupons if collection is empty
const DEFAULT_COUPONS = [
  {
    id: "default-velouraz10",
    code: "VELOURAZ10",
    discountType: "percentage",
    discountValue: 10,
    minOrderAmount: 1499,
    maxDiscount: 1000,
    expiryDate: "2028-12-31",
    isActive: true,
    description: "10% OFF on luxury orders above ₹1,499",
    isDefault: true,
  },
  {
    id: "default-luxe500",
    code: "LUXE500",
    discountType: "flat",
    discountValue: 500,
    minOrderAmount: 2999,
    maxDiscount: 500,
    expiryDate: "2028-12-31",
    isActive: true,
    description: "Flat ₹500 OFF on purchases over ₹2,999",
    isDefault: true,
  },
  {
    id: "default-royal15",
    code: "ROYAL15",
    discountType: "percentage",
    discountValue: 15,
    minOrderAmount: 4999,
    maxDiscount: 2500,
    expiryDate: "2028-12-31",
    isActive: true,
    description: "15% OFF VIP Privilege on orders above ₹4,999",
    isDefault: true,
  },
];

/**
 * Listen to all coupons in real-time
 */
export const listenToCoupons = (callback) => {
  const couponsRef = collection(db, "coupons");
  return onSnapshot(
    couponsRef,
    (snapshot) => {
      const firestoreCoupons = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      const firestoreCodes = new Set(firestoreCoupons.map((c) => c.code.toUpperCase()));
      const allCoupons = [
        ...firestoreCoupons,
        ...DEFAULT_COUPONS.filter((d) => !firestoreCodes.has(d.code.toUpperCase())),
      ];

      callback(allCoupons);
    },
    (err) => {
      console.warn("Coupon listener error fallback:", err);
      callback(DEFAULT_COUPONS);
    }
  );
};

/**
 * Add a new coupon
 */
export const addCoupon = async (couponData) => {
  const cleanCode = couponData.code.trim().toUpperCase();
  if (!cleanCode) throw new Error("Coupon code is required");

  const newDoc = {
    code: cleanCode,
    discountType: couponData.discountType || "percentage", // "percentage" | "flat"
    discountValue: Number(couponData.discountValue) || 0,
    minOrderAmount: Number(couponData.minOrderAmount) || 0,
    maxDiscount: Number(couponData.maxDiscount) || 0,
    expiryDate: couponData.expiryDate || "",
    description: couponData.description || "",
    isActive: couponData.isActive !== false,
    createdAt: new Date(),
  };

  const couponsRef = collection(db, "coupons");
  return await addDoc(couponsRef, newDoc);
};

/**
 * Delete a coupon
 */
export const deleteCoupon = async (couponId) => {
  if (couponId.startsWith("default-")) return;
  await deleteDoc(doc(db, "coupons", couponId));
};

/**
 * Toggle active status of a coupon
 */
export const toggleCouponStatus = async (couponId, currentStatus) => {
  if (couponId.startsWith("default-")) return;
  const couponRef = doc(db, "coupons", couponId);
  await updateDoc(couponRef, { isActive: !currentStatus });
};

/**
 * Validate a coupon code for checkout
 */
export const validateCoupon = async (code, subtotal) => {
  const cleanCode = (code || "").trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, message: "Please enter a valid coupon code." };
  }

  let foundCoupon = null;

  try {
    const snap = await getDocs(collection(db, "coupons"));
    const firestoreCoupons = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    foundCoupon = firestoreCoupons.find((c) => c.code.toUpperCase() === cleanCode);
  } catch (err) {
    console.warn("Error checking firestore coupons:", err);
  }

  if (!foundCoupon) {
    foundCoupon = DEFAULT_COUPONS.find((c) => c.code.toUpperCase() === cleanCode);
  }

  if (!foundCoupon) {
    return { valid: false, message: `Coupon "${cleanCode}" is invalid or does not exist.` };
  }

  if (!foundCoupon.isActive) {
    return { valid: false, message: `Coupon "${cleanCode}" is currently inactive.` };
  }

  if (foundCoupon.expiryDate) {
    const expTime = new Date(foundCoupon.expiryDate).getTime();
    if (isNaN(expTime) || expTime < Date.now() - 86400000) {
      return { valid: false, message: `Coupon "${cleanCode}" has expired.` };
    }
  }

  if (subtotal < Number(foundCoupon.minOrderAmount || 0)) {
    return {
      valid: false,
      message: `Coupon "${cleanCode}" requires a minimum order of ₹${Number(foundCoupon.minOrderAmount).toLocaleString()}. Add ₹${(Number(foundCoupon.minOrderAmount) - subtotal).toLocaleString()} more to apply.`,
    };
  }

  // Calculate discount amount
  let discount = 0;
  if (foundCoupon.discountType === "percentage") {
    discount = Math.round((subtotal * Number(foundCoupon.discountValue)) / 100);
    if (foundCoupon.maxDiscount && Number(foundCoupon.maxDiscount) > 0) {
      discount = Math.min(discount, Number(foundCoupon.maxDiscount));
    }
  } else {
    discount = Number(foundCoupon.discountValue);
  }

  discount = Math.min(discount, subtotal);

  return {
    valid: true,
    discountAmount: discount,
    coupon: foundCoupon,
    message: `Coupon "${foundCoupon.code}" applied! Saved ₹${discount.toLocaleString()}.`,
  };
};
