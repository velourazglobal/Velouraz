import { db } from "../components/Firebase";
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, serverTimestamp } from "firebase/firestore";

export const DEFAULT_REELS = [
  {
    id: "DcLBf4Tghoy",
    title: "Elegance That Speaks Without Words",
    video: "https://res.cloudinary.com/dcjn4y284/video/upload/v1787410921/1_pcpxcj.mp4",
    url: "https://www.instagram.com/reel/DcLBf4Tghoy/?igsh=bW92cHBjZHM3d2Fx",
    tag: "Luxury Edit",
    duration: "0:30",
    order: 10,
    isDefault: true,
  },
  {
    id: "DaxMdOLNzLv",
    title: "Timeless Royal Kundan Craft",
    video: "https://res.cloudinary.com/dcjn4y284/video/upload/v1787410967/2_l2cima.mp4",
    url: "https://www.instagram.com/reel/DaxMdOLNzLv/?igsh=MWVlYThqbTYyNHYxYg==",
    tag: "Artisanal Craft",
    duration: "0:45",
    order: 20,
    isDefault: true,
  },
  {
    id: "DbAbQzstTso",
    title: "Precision Setting & Polishing",
    video: "https://res.cloudinary.com/dcjn4y284/video/upload/v1787410930/3_nc7otj.mp4",
    url: "https://www.instagram.com/reel/DbAbQzstTso/?igsh=N2V0MWh0MW40Nmdy",
    tag: "Atelier Reel",
    duration: "0:25",
    order: 30,
    isDefault: true,
  },
  {
    id: "Db2X8BsDdOg",
    title: "Handcrafted 925 Sterling Silver",
    video: "https://res.cloudinary.com/dcjn4y284/video/upload/v1787410991/4_tb8cdk.mp4",
    url: "https://www.instagram.com/reel/Db2X8BsDdOg/?igsh=MWNkaWM3emRubjQwaw==",
    tag: "Sterling Silver",
    duration: "0:35",
    order: 40,
    isDefault: true,
  },
  {
    id: "DbN2BortfR_",
    title: "Velouraz Signature Statement Edit",
    video: "https://res.cloudinary.com/dcjn4y284/video/upload/v1787410934/5_asgame.mp4",
    url: "https://www.instagram.com/reel/DbN2BortfR_/?igsh=MXNxbTAxbDM3N3I5aw==",
    tag: "Signature Edit",
    duration: "0:40",
    order: 50,
    isDefault: true,
  },
];

/**
 * Listen to news reels in real-time.
 * If firestore has items, return firestore items sorted by order.
 * If firestore is empty, return DEFAULT_REELS.
 */
export const listenToNewsReels = (callback, onError) => {
  const reelsRef = collection(db, "news_reels");
  return onSnapshot(
    reelsRef,
    (snapshot) => {
      if (snapshot.empty) {
        callback(DEFAULT_REELS);
      } else {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        callback(items);
      }
    },
    (error) => {
      console.warn("Could not listen to news_reels:", error);
      if (onError) onError(error);
      callback(DEFAULT_REELS);
    }
  );
};

/**
 * Add a news reel post
 */
export const addNewsReel = async (data) => {
  const reelsRef = collection(db, "news_reels");
  const docRef = await addDoc(reelsRef, {
    title: data.title || "",
    video: data.video || "",
    url: data.url || "",
    tag: data.tag || "Reel Edit",
    duration: data.duration || "0:30",
    order: Number(data.order) || Date.now(),
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

/**
 * Update a news reel post
 */
export const updateNewsReel = async (id, data) => {
  const docRef = doc(db, "news_reels", id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Delete a news reel post
 */
export const deleteNewsReel = async (id) => {
  const docRef = doc(db, "news_reels", id);
  await deleteDoc(docRef);
};

/**
 * Reorder reels array
 */
export const reorderNewsReels = async (reelsArray) => {
  await Promise.all(
    reelsArray.map((reel, index) => {
      if (!reel.id || reel.isDefault) return Promise.resolve();
      const docRef = doc(db, "news_reels", reel.id);
      return updateDoc(docRef, { order: (index + 1) * 10 });
    })
  );
};
