import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDKTCwXYM5BlOT8uhYvB5H3Bk4UiIX5aN4",
  authDomain: "velouraz-e708a.firebaseapp.com",
  projectId: "velouraz-e708a",
  storageBucket: "velouraz-e708a.firebasestorage.app",
  messagingSenderId: "427246020538",
  appId: "1:427246020538:web:f709bc8574fbcfe6061f83",
  measurementId: "G-6NH5MQ96B2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const headerWorldEdits = [
  {
    id: 'paris',
    country: 'Paris',
    flag: '🇫🇷',
    subtitle: 'Inspired by Paris',
    collection: 'THE MAISON PARIS',
    cta: 'DISCOVER PARIS',
    href: '/shop?country=Paris',
    bgImage: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672216/paris_vsqtxa.png',
    order: 1
  },
  {
    id: 'thailand',
    country: 'Thailand',
    flag: '🇹🇭',
    subtitle: 'Inspired by Thailand',
    collection: 'THE THAI GEMSTONE EDIT',
    cta: 'DISCOVER THAILAND',
    href: '/shop?country=Thailand',
    bgImage: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672219/thiland_yz8axz.png',
    order: 2
  },
  {
    id: 'india',
    country: 'India',
    flag: '🇮🇳',
    subtitle: 'Inspired by India',
    collection: 'THE SIGNATURE COLLECTION',
    cta: 'DISCOVER INDIA',
    href: '/world-edit/india',
    bgImage: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672225/india_yqlodw.png',
    order: 3
  },
  {
    id: 'japan',
    country: 'Japan',
    flag: '🇯🇵',
    subtitle: 'Inspired by Japan',
    collection: 'THE MIYUKI ATELIER',
    cta: 'DISCOVER JAPAN',
    href: '/shop?country=Japan',
    bgImage: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672222/japan_mzkd7z.png',
    order: 4
  },
  {
    id: 'south-korea',
    country: 'South Korea',
    flag: '🇰🇷',
    subtitle: 'Inspired by South Korea',
    collection: 'THE PEARL EDIT',
    cta: 'DISCOVER SOUTH KOREA',
    href: '/shop?country=South%20Korea',
    bgImage: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1788798991/ChatGPT_Image_Sep_7_2026_10_04_26_PM_ogtaqk.png',
    order: 5
  },
];

const homepageWorldEditVideos = [
  {
    id: 'paris',
    country: 'PARIS',
    collection: 'THE MAISON PARIS',
    badge: 'ORGANIC',
    video: 'https://res.cloudinary.com/dcjn4y284/video/upload/v1788795174/paris44_tisl79.mp4',
    videoUrl: 'https://res.cloudinary.com/dcjn4y284/video/upload/v1788795174/paris44_tisl79.mp4',
    defaultImage: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672216/paris_vsqtxa.png',
    hoverImage: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672216/paris_vsqtxa.png',
    image: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672216/paris_vsqtxa.png',
    link: '/shop?country=Paris',
    order: 1
  },
  {
    id: 'thailand',
    country: 'THAILAND',
    collection: 'THE THAI GEMSTONE EDIT',
    badge: 'ORGANIC',
    video: 'https://res.cloudinary.com/dcjn4y284/video/upload/v1788795261/80622904_1788526626895108_iruogb.mp4',
    videoUrl: 'https://res.cloudinary.com/dcjn4y284/video/upload/v1788795261/80622904_1788526626895108_iruogb.mp4',
    defaultImage: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672219/thiland_yz8axz.png',
    hoverImage: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672219/thiland_yz8axz.png',
    image: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672219/thiland_yz8axz.png',
    link: '/shop?country=Thailand',
    order: 2
  },
  {
    id: 'india',
    country: 'INDIA',
    collection: 'HERITAGE COLLECTION',
    badge: 'ORGANIC',
    video: 'https://res.cloudinary.com/dcjn4y284/video/upload/v1788884537/507503123_1788884097045152_tpzo3m.mp4',
    videoUrl: 'https://res.cloudinary.com/dcjn4y284/video/upload/v1788884537/507503123_1788884097045152_tpzo3m.mp4',
    defaultImage: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672225/india_yqlodw.png',
    hoverImage: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672225/india_yqlodw.png',
    image: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672225/india_yqlodw.png',
    link: '/world-edit/india',
    order: 3
  },
  {
    id: 'japan',
    country: 'JAPAN',
    collection: 'MIYUKI ATELIER',
    badge: 'ORGANIC',
    video: 'https://res.cloudinary.com/dcjn4y284/video/upload/v1788795166/51181631_1788526616621934_a6gfv6.mp4',
    videoUrl: 'https://res.cloudinary.com/dcjn4y284/video/upload/v1788795166/51181631_1788526616621934_a6gfv6.mp4',
    defaultImage: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672222/japan_mzkd7z.png',
    hoverImage: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672222/japan_mzkd7z.png',
    image: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672222/japan_mzkd7z.png',
    link: '/shop?country=Japan',
    order: 4
  },
  {
    id: 'south-korea',
    country: 'SOUTH KOREA',
    collection: 'PEARLS & SILVER',
    badge: 'ORGANIC',
    video: 'https://res.cloudinary.com/dcjn4y284/video/upload/v1788884546/634109263_1788884070021943_pf5oas.mp4',
    videoUrl: 'https://res.cloudinary.com/dcjn4y284/video/upload/v1788884546/634109263_1788884070021943_pf5oas.mp4',
    defaultImage: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672225/south_korea_km1orl.png',
    hoverImage: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672225/south_korea_km1orl.png',
    image: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1787672225/south_korea_km1orl.png',
    link: '/shop?country=South%20Korea',
    order: 5
  }
];

async function seed() {
  console.log("Seeding header_world_edits to Firebase...");
  for (const item of headerWorldEdits) {
    const { id, ...data } = item;
    await setDoc(doc(db, "header_world_edits", id), data);
    console.log("Uploaded header_world_edits:", id);
  }

  console.log("Seeding world_edits_carousel to Firebase...");
  for (const item of homepageWorldEditVideos) {
    const { id, ...data } = item;
    await setDoc(doc(db, "world_edits_carousel", id), data);
    console.log("Uploaded world_edits_carousel:", id);
  }

  console.log("🎉 ALL CURRENT DATA SUCCESSFULLY UPLOADED TO FIREBASE!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seeding error:", err);
  process.exit(1);
});
