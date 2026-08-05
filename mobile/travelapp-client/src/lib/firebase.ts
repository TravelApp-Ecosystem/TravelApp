import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBouuxeZhMl3LNyRQOe6BxUnnYc0hVbjIo',
  authDomain: 'mvp-travelapp.firebaseapp.com',
  projectId: 'mvp-travelapp',
  storageBucket: 'mvp-travelapp.firebasestorage.app',
  messagingSenderId: '596622732697',
  appId: '1:596622732697:web:6765f2beee41420c3db708',
};

let app: any;
if (!firebase.apps.length) {
  console.log('Inicializando Firebase con Persistencia AsyncStorage (Client)...');
  app = firebase.initializeApp(firebaseConfig);
} else {
  app = firebase.app();
}

let authInstance: any;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  authInstance = firebase.auth();
}

export const auth = authInstance;
export const db = getFirestore(app);
export default firebase;
