import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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

async function run() {
  try {
    await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    const snap = await getDocs(collection(db, "tariffs"));
    const tariffs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const catSnap = await getDocs(collection(db, "categories"));
    const categories = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    writeFileSync("scratch/tariffs_dump.json", JSON.stringify({ tariffs, categories }, null, 2));
    console.log("Dumped successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

run();
