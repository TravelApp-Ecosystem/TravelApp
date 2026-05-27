/**
 * seed-auth-user.mjs
 * ---------------------------------------------------------------------------
 * Script de utilidad para crear el usuario de prueba en Firebase Auth.
 * Ejecutar UNA SOLA VEZ desde el root del proyecto:
 *
 *   node seed-auth-user.mjs
 *
 * Requiere que las variables de entorno de .env.local estén disponibles.
 * Las lee directamente del archivo para no necesitar dotenv en producción.
 * ---------------------------------------------------------------------------
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from "firebase/auth";

// ── Lee .env.local manualmente ──────────────────────────────────────────────
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

// ── Credenciales de prueba ───────────────────────────────────────────────────
const TEST_EMAIL = "admin@travelapp.ar";
const TEST_PASSWORD = "admin123";

async function seedUser() {
  console.log(`\n🔐 TravelApp – Seeding test user: ${TEST_EMAIL}\n`);

  try {
    const methods = await fetchSignInMethodsForEmail(auth, TEST_EMAIL);
    if (methods.length > 0) {
      console.log("✅ El usuario ya existe en Firebase Auth. No se creó uno nuevo.");
      process.exit(0);
    }
  } catch {
    // fetchSignInMethodsForEmail puede fallar en proyectos con Email Enumeration
    // Protection habilitada. Intentamos crear directamente.
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    console.log(`✅ Usuario creado exitosamente:`);
    console.log(`   UID: ${cred.user.uid}`);
    console.log(`   Email: ${cred.user.email}`);
    console.log(`\n   Credenciales de acceso:`);
    console.log(`   Email:    ${TEST_EMAIL}`);
    console.log(`   Password: ${TEST_PASSWORD}`);
    console.log(`\n🚀 Podés iniciar sesión en http://localhost:3000/login\n`);
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      console.log("✅ El usuario ya existe. Credenciales vigentes.");
    } else {
      console.error("❌ Error al crear el usuario:", err.message);
      console.error("   Asegurate de habilitar Email/Password en Firebase Auth Console:");
      console.error("   https://console.firebase.google.com/project/mvp-travelapp/authentication/providers");
      process.exit(1);
    }
  }

  process.exit(0);
}

seedUser();
