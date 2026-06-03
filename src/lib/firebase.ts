import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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
// Forzamos al SDK a usar conexiones puras HTTP en lugar de gRPC (WebSockets de larga duración / fetch)
// Esto funciona perfectamente en Vercel Serverless sin necesitar claves de cuentas de servicio.
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // Fuerza HTTP Long Polling en lugar de gRPC WebSockets
  useFetchStreams: false // Deshabilita los streams HTTP que causan timeouts en Vercel
});

const auth = getAuth(app);

export { app, db, auth };
