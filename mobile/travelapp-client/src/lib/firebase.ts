import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBouuxeZhMl3LNyRQOe6BxUnnYc0hVbjIo',
  authDomain: 'mvp-travelapp.firebaseapp.com',
  projectId: 'mvp-travelapp',
  storageBucket: 'mvp-travelapp.firebasestorage.app',
  messagingSenderId: '596622732697',
  appId: '1:596622732697:web:6765f2beee41420c3db708',
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let authInstance: any;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const db = getFirestore(app);
export default app;
