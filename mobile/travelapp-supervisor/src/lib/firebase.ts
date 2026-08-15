import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBouuxeZhMl3LNyRQOe6BxUnnYc0hVbjIo',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'mvp-travelapp.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'mvp-travelapp',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'mvp-travelapp.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '596622732697',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:596622732697:web:6765f2beee41420c3db708',
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let authInstance: ReturnType<typeof getAuth>;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (_e) {
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const db = getFirestore(app);
export default app;
