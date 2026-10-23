import { db } from "../components/Firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot } from "firebase/firestore";

export const DEFAULT_TAGS = [
  "Bestsellers",
  "New Arrivals",
  "Featured",
  "Trending",
  "Exclusive",
  "Sale",
  "Gift Special",
  "India Silver",
  "India Luxe"
];

/**
 * Listen to tags from Firestore combined with default tags
 */
export const listenToTags = (callback) => {
  const tagsRef = collection(db, "tags");
  return onSnapshot(tagsRef, (snapshot) => {
    const firestoreTags = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    const firestoreNames = new Set(firestoreTags.map((t) => t.name.toLowerCase()));

    const allTags = [
      ...DEFAULT_TAGS.map((name) => ({
        id: `default-${name.toLowerCase().replace(/\s+/g, "-")}`,
        name,
        isDefault: true,
      })),
      ...firestoreTags.filter((t) => !DEFAULT_TAGS.map(d => d.toLowerCase()).includes(t.name.toLowerCase())),
    ];

    callback(allTags);
  }, (err) => {
    console.warn("Tags fallback listener error:", err);
    callback(DEFAULT_TAGS.map((name) => ({
      id: `default-${name.toLowerCase().replace(/\s+/g, "-")}`,
      name,
      isDefault: true,
    })));
  });
};

/**
 * Add a custom tag
 */
export const addCustomTag = async (tagName) => {
  const cleanName = tagName.trim();
  if (!cleanName) return;
  const tagsRef = collection(db, "tags");
  await addDoc(tagsRef, { name: cleanName, createdAt: new Date() });
};

/**
 * Remove a custom tag
 */
export const removeCustomTag = async (tagId) => {
  if (!tagId || tagId.startsWith("default-")) return;
  await deleteDoc(doc(db, "tags", tagId));
};
