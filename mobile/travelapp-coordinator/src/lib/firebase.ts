import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBouuxeZhMl3LNyRQOe6BxUnnYc0hVbjIo',
  authDomain: 'mvp-travelapp.firebaseapp.com',
  projectId: 'mvp-travelapp',
  storageBucket: 'mvp-travelapp.firebasestorage.app',
  messagingSenderId: '596622732697',
  appId: '1:596622732697:web:6765f2beee41420c3db708',
};

let app;
if (!firebase.apps.length) {
  console.log('Inicializando Firebase Compat (Client)...');
  app = firebase.initializeApp(firebaseConfig);
} else {
  app = firebase.app();
}

export const auth = firebase.auth();
export const db = getFirestore(app); // Instancia modular
export default firebase;

