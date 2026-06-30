import { readFileSync } from "fs";
import { resolve } from "path";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";

const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = Object.fromEntries(
  envContent
    .split("\n")
    .filter((line) => line.includes("="))
    .map((line) => {
      const [key, ...rest] = line.split("=");
      return [key.trim(), rest.join("=").trim()];
    })
);

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const TEST_EMAIL = "admin@travelapp.ar";
const TEST_PASSWORD = "admin123";

async function estimateTravelCabFareLocal(origin, destination, categoryName = 'Estandar') {
  // Simulating the Distance Matrix values
  let distanceKm = 8.5;
  let durationMin = 15;
  
  // 1. Fetch categories
  let categoryId = 'cat-1';
  if (categoryName.toLowerCase() === 'premium') {
    categoryId = 'cat-2';
  } else if (categoryName.toLowerCase() === 'taxi') {
    categoryId = 'cat-3';
  }

  const catSnap = await getDocs(collection(db, 'categories'));
  if (!catSnap.empty) {
    const matchedCat = catSnap.docs.find(d => {
      const name = (d.data().name || '').toLowerCase();
      return name === categoryName.toLowerCase() || d.id === categoryName.toLowerCase();
    });
    if (matchedCat) {
      categoryId = matchedCat.id;
    }
  }

  // 2. Fetch active tariffs
  let baseFare = 0;
  let pricePerKm = 0;
  let travelMinutePrice = 0;
  let minimumFare = 0;
  let hasActiveTariff = false;

  const q = query(collection(db, 'tariffs'), where('isActive', '==', true));
  const activeTariffSnap = await getDocs(q);
  if (!activeTariffSnap.empty) {
    const matchedTariffDoc = activeTariffSnap.docs.find(d => {
      const cat = (d.data().category || '').toLowerCase();
      return cat === categoryId.toLowerCase() || cat === categoryName.toLowerCase();
    });

    if (matchedTariffDoc) {
      const t = matchedTariffDoc.data();
      baseFare = t.baseFare !== undefined ? t.baseFare : 300;
      pricePerKm = t.pricePerKm !== undefined ? t.pricePerKm : 180;
      travelMinutePrice = t.travelMinutePrice !== undefined ? t.travelMinutePrice : 50;
      minimumFare = t.minimumFare !== undefined ? t.minimumFare : 450;
      hasActiveTariff = true;
    }
  }

  let cost = 0;
  if (!hasActiveTariff) {
    const normalizedCat = categoryName.toLowerCase();
    pricePerKm = normalizedCat === 'premium' ? 550 : normalizedCat === 'taxi' ? 450 : 350;
    baseFare = normalizedCat === 'premium' ? 600 : normalizedCat === 'taxi' ? 450 : 350;
    cost = Math.round(baseFare + pricePerKm * distanceKm);
  } else {
    const calculated = baseFare + (pricePerKm * distanceKm) + (travelMinutePrice * durationMin);
    cost = Math.max(minimumFare, Math.round(calculated));
  }

  return { categoryName, cost, hasActiveTariff, baseFare, pricePerKm, travelMinutePrice, minimumFare };
}

async function run() {
  try {
    await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    
    console.log("Estimating fares for Yerba Buena -> Plaza Independencia (8.5 km, 15 mins):");
    const categories = ['Estandar', 'Premium', 'Taxi'];
    
    for (const catName of categories) {
      const res = await estimateTravelCabFareLocal("Yerba Buena", "Plaza Independencia", catName);
      console.log(JSON.stringify(res, null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

run();
