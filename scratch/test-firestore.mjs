import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Función para cargar variables de un archivo .env.local de forma simple
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('.env.local no existe en el directorio actual.');
    process.exit(1);
  }
  
  const content = fs.readFileSync(envPath, 'utf-8');
  const lines = content.split('\n');
  const env = {};
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      env[key] = val;
    }
  }
  return env;
}

async function testConnection() {
  const env = loadEnvLocal();
  
  const firebaseConfig = {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  };

  console.log('Inicializando Firebase con Project ID:', firebaseConfig.projectId);
  
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('Intentando leer de la colección "experiences"...');
    const q = query(collection(db, 'experiences'), limit(5));
    const querySnapshot = await getDocs(q);
    
    console.log('¡ÉXITO! La lectura pública está habilitada en Firestore.');
    console.log(`Se encontraron ${querySnapshot.size} viajes en el catálogo.`);
    
    querySnapshot.forEach((doc) => {
      console.log(`- ID: ${doc.id}, Título: ${doc.data().title || doc.data().titulo || 'Sin título'}`);
    });
  } catch (error) {
    console.error('❌ ERROR AL LEER FIRESTORE:');
    console.error('Código de error:', error.code);
    console.error('Mensaje:', error.message);
    if (error.code === 'permission-denied') {
      console.error('\n👉 Esto confirma que las reglas de seguridad de Firestore siguen bloqueando las lecturas públicas (403 Forbidden).');
    }
  }
}

testConnection();
