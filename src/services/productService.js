import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../components/Firebase";

export const parseSortableDate = (item) => {
  if (!item) return 0;
  const parseVal = (val) => {
    if (!val) return 0;
    if (typeof val.toMillis === "function") return val.toMillis();
    if (typeof val.seconds === "number") return val.seconds * 1000;
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      const t = new Date(val).getTime();
      return isNaN(t) ? 0 : t;
    }
    return 0;
  };
  const created = parseVal(item.createdAt);
  if (created > 0) return created;
  const updated = parseVal(item.updatedAt);
  if (updated > 0) return updated;
  const deleted = parseVal(item.deletedAt);
  if (deleted > 0) return deleted;
  return Date.now();
};

export const sortNewestProducts = (products) => [...products].sort((a, b) => parseSortableDate(b) - parseSortableDate(a));

export const listenToProducts = (onData, onError) => onSnapshot(
  collection(db, "products"),
  (snapshot) => onData(sortNewestProducts(
    snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .filter((item) => !item.deleted)
  )),
  onError,
);

export const listenToTrashedProducts = (onData, onError) => onSnapshot(
  collection(db, "products"),
  (snapshot) => onData(sortNewestProducts(
    snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .filter((item) => item.deleted === true)
  )),
  onError,
);

export const createProduct = async (values, { status, visibility, images = [] } = {}) => {
  const stock = Number(values.stock || 0);
  const productStatus = status === "Draft" ? "Draft" : (values.status === "Out of Stock" || stock <= 0 ? "Out of Stock" : "Published");
  const record = {
    ...values,
    name: values.name?.trim(),
    sku: values.sku?.trim(),
    price: Number(values.price || 0),
    original_price: Number(values.original_price || 0),
    stock,
    stock_status: stock <= 0 ? "Out of Stock" : "In Stock",
    status: productStatus,
    visibility: visibility || values.visibility || "Public",
    images,
    image: images[0] || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  delete record.imagesInput;
  return addDoc(collection(db, "products"), record);
};

export const updateProduct = (id, values) => {
  const updates = { ...values, updatedAt: serverTimestamp() };
  if (values.stock !== undefined) {
    const s = Math.max(0, Number(values.stock) || 0);
    updates.stock = s;
    if (!values.stock_status) {
      updates.stock_status = s <= 0 ? "Out of Stock" : "In Stock";
    }
  }
  return updateDoc(doc(db, "products", id), updates);
};

export const quickUpdateStock = (id, newStock) => {
  const s = Math.max(0, Number(newStock) || 0);
  return updateDoc(doc(db, "products", id), {
    stock: s,
    stock_status: s <= 0 ? "Out of Stock" : "In Stock",
    updatedAt: serverTimestamp()
  });
};

// Soft-delete: moves product to trash
export const trashProduct = (id) =>
  updateDoc(doc(db, "products", id), {
    deleted: true,
    deletedAt: serverTimestamp(),
  });

// Restore: removes the deleted flag
export const restoreProduct = (id) =>
  updateDoc(doc(db, "products", id), {
    deleted: false,
    deletedAt: null,
    updatedAt: serverTimestamp(),
  });

// Permanently delete from Firestore
export const permanentlyDeleteProduct = (id) => deleteDoc(doc(db, "products", id));

// Legacy alias kept for backward compat (now soft-deletes)
export const removeProduct = (id) => trashProduct(id);

/**
 * Check if a product is a New Arrival.
 * Strict check: must be explicitly flagged or tagged, and not explicitly disabled.
 */
export const isProductNewArrival = (p) => {
  if (!p) return false;
  if (p.isNewArrival === false) return false;
  if (p.isNewArrival === true || p.newArrival === true) return true;
  if (p.badge && String(p.badge).toLowerCase().includes("new")) return true;
  if (Array.isArray(p.tags) && p.tags.some((t) => {
    const s = String(t).toLowerCase().trim();
    return s === "new arrivals" || s === "new arrival" || s === "new";
  })) return true;
  return false;
};

/**
 * Check if a product is a Best Seller.
 * Strict check: must be explicitly flagged or tagged, and not explicitly disabled.
 */
export const isProductBestseller = (p) => {
  if (!p) return false;
  if (p.isBestseller === false) return false;
  if (p.isBestseller === true || p.bestseller === true) return true;
  if (p.badge && String(p.badge).toLowerCase().includes("bestseller")) return true;
  if (Array.isArray(p.tags) && p.tags.some((t) => {
    const s = String(t).toLowerCase().trim();
    return s === "bestsellers" || s === "bestseller" || s === "best seller" || s === "best sellers";
  })) return true;
  return false;
};

/**
 * Quickly toggle New Arrival or Best Seller status for a product.
 * Synchronizes booleans, tags array, and badge fields.
 */
export const toggleProductCollection = async (id, type, product) => {
  if (!id) return;
  const existingTags = Array.isArray(product?.tags) ? [...product.tags] : [];
  const updates = { updatedAt: serverTimestamp() };

  if (type === "new_arrival") {
    const currentlyActive = isProductNewArrival(product);
    const nextVal = !currentlyActive;
    updates.isNewArrival = nextVal;
    updates.newArrival = nextVal;

    if (nextVal) {
      if (!existingTags.some((t) => {
        const s = String(t).toLowerCase().trim();
        return s === "new arrivals" || s === "new arrival";
      })) {
        updates.tags = [...existingTags, "New Arrivals"];
      }
    } else {
      updates.tags = existingTags.filter((t) => {
        const s = String(t).toLowerCase().trim();
        return s !== "new arrivals" && s !== "new arrival" && s !== "new";
      });
      if (product?.badge && String(product.badge).toLowerCase().includes("new")) {
        updates.badge = "";
      }
    }
  } else if (type === "bestseller") {
    const currentlyActive = isProductBestseller(product);
    const nextVal = !currentlyActive;
    updates.isBestseller = nextVal;
    updates.bestseller = nextVal;

    if (nextVal) {
      if (!existingTags.some((t) => {
        const s = String(t).toLowerCase().trim();
        return s === "bestsellers" || s === "bestseller";
      })) {
        updates.tags = [...existingTags, "Bestsellers"];
      }
    } else {
      updates.tags = existingTags.filter((t) => {
        const s = String(t).toLowerCase().trim();
        return s !== "bestsellers" && s !== "bestseller" && s !== "best sellers" && s !== "best seller";
      });
      if (product?.badge && String(product.badge).toLowerCase().includes("bestseller")) {
        updates.badge = "";
      }
    }
  }

  return updateDoc(doc(db, "products", id), updates);
};

