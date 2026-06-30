import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if it hasn't been initialized yet
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// REST / HTTP Config:
// Forzamos al SDK a usar conexiones puras HTTP en el cliente (para evitar bloqueos)
// pero en el servidor (Vercel) usamos la conexión estándar de Firestore.
const db = typeof window !== 'undefined'
  ? initializeFirestore(app, { experimentalForceLongPolling: true })
  : getFirestore(app);

const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
