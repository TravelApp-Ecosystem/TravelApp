/**
 * seed_contracted_trip.mjs
 * ---------------------------------------------------------------------------
 * Script de utilidad para crear el viaje grupal de prueba en Firestore.
 * Ejecutar desde el root del proyecto:
 *
 *   node seed_contracted_trip.mjs
 *
 * ---------------------------------------------------------------------------
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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
const db = getFirestore(app);

const TEST_EMAIL = "admin@travelapp.ar";
const TEST_PASSWORD = "admin123";

async function run() {
  console.log(`\n🔗 Conectando a Firebase para seedear viaje grupal para: ${TEST_EMAIL}...\n`);

  try {
    // 1. Iniciar sesión para obtener el UID real del test user
    const cred = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    const uid = cred.user.uid;
    console.log(`✅ Logueado con UID: ${uid}`);

    // 2. Definir el documento de viaje grupal contratado
    const tripId = `trip_humahuaca_${uid}`;
    const tripRef = doc(db, "contracted_trips", tripId);

    const tripData = {
      id: tripId,
      userId: uid,
      destination: "Quebrada de Humahuaca & Salinas Grandes",
      dates: "12 Oct - 19 Oct, 2026",
      imageUrl: "https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?q=80&w=800&auto=format&fit=crop",
      coordinator: {
        name: "Marcos Vignola",
        phone: "+5493815556667",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"
      },
      services: [
        "Aéreos ida y vuelta (Aerolíneas Argentinas)",
        "Traslados privados en minibus (TravelCab ACI)",
        "7 noches en Posada del Silencio (Purmamarca)",
        "Régimen de media pensión (Desayuno y Cena)",
        "Excursiones terrestres con guías locales autorizados",
        "Cobertura Assist Card Premium (Asistencia Médica Completa)"
      ],
      itinerary: [
        {
          day: 1,
          title: "Vuelo a Salta & Transfer a Purmamarca",
          description: "Arribo al aeropuerto de Salta. Recepción por Marcos Vignola y traslado privado a Purmamarca recorriendo el espectacular camino de cornisa. Check-in en el hotel y cena grupal de bienvenida."
        },
        {
          day: 2,
          title: "Cerro de Siete Colores & Paseo de los Colorados",
          description: "Trekking matutino suave por el Paseo de los Colorados para apreciar las distintas tonalidades geológicas del Cerro de Siete Colores. Tarde libre para recorrer la feria de artesanos locales de Purmamarca."
        },
        {
          day: 3,
          title: "Salinas Grandes & Cuesta de Lipán",
          description: "Ascenso por la impactante Cuesta de Lipán hasta alcanzar los 4.170 msnm. Descenso a las imponentes Salinas Grandes. Almuerzo campestre en el salar y sesión fotográfica interactiva."
        },
        {
          day: 4,
          title: "Pucará de Tilcara & Garganta del Diablo",
          description: "Traslado a Tilcara. Visita guiada al sitio arqueológico Pucará de Tilcara. Trekking opcional a la Garganta del Diablo para ver las cascadas naturales en el lecho del río."
        },
        {
          day: 5,
          title: "Hornocal (Serranía de los 14 Colores) & Humahuaca",
          description: "Viaje al norte hacia Humahuaca. Almuerzo tradicional con peña folclórica en vivo. Por la tarde, ascenso en camionetas 4x4 al mirador del Hornocal (4.350 msnm) para ver el atardecer sobre los 14 colores."
        },
        {
          day: 6,
          title: "Día Libre en Purmamarca o Excursión Opcional a Iruya",
          description: "Día libre para descansar y disfrutar del hotel. Recomendamos la excursión opcional de día entero al mágico pueblo colgado de la montaña: Iruya."
        },
        {
          day: 7,
          title: "Caminata entre Cardones & Regreso a Salta Capital",
          description: "Check-out del hotel. Viaje de regreso visitando el Parque Nacional Los Cardones. Tarde libre en Salta Capital para últimas compras y cena de despedida grupal en la Peña de Balderrama."
        },
        {
          day: 8,
          title: "Despedida & Vuelo de Retorno",
          description: "Transfer al aeropuerto de Salta para abordar el vuelo de regreso a Buenos Aires. Fin de la experiencia."
        }
      ],
      payment: {
        totalAmount: 1450,
        paidAmount: 950,
        currency: "USD"
      },
      assistancePdfUrl: "https://www.assistcard.com/content/dam/assistcard/global/pdf/condiciones-generales.pdf",
      recommendations: "Llevar ropa de abrigo en capas (amplitud térmica), protector solar factor 50+, anteojos de sol, calzado de trekking cómodo y abundante agua para evitar el mal de altura (apunamiento).",
      optionalExcursions: [
        {
          id: "exc-iruya",
          title: "Excursión Especial de Día Entero a Iruya (4x4)",
          description: "Aventura todo terreno cruzando el Abra del Cóndor a 4000 msnm para descender al histórico pueblo colgado de Iruya. Incluye almuerzo.",
          price: 120,
          paid: false
        },
        {
          id: "exc-bodega",
          title: "Degustación de Vinos de Altura & Almuerzo en Cafayate",
          description: "Visita a una prestigiosa bodega boutique con degustación dirigida por enólogo y almuerzo de pasos maridado.",
          price: 85,
          paid: false
        }
      ],
      photos: [
        "https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?q=80&w=600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1619542402915-dcaf30e4e2a1?q=80&w=600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=600&auto=format&fit=crop"
      ]
    };

    // 3. Escribir el documento en Firestore
    await setDoc(tripRef, tripData);
    console.log(`🎉 Viaje grupal de prueba creado con éxito en Firestore!`);
    console.log(`   ID Documento: ${tripId}`);
    
    // 4. Asegurarse de que el perfil del usuario tenga habilitada la bandera
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      hasPurchasedOrganizedTrip: true,
      updatedAt: Date.now()
    }, { merge: true });
    console.log(`✅ Bandera hasPurchasedOrganizedTrip configurada en true para el usuario ${uid}`);

  } catch (err) {
    console.error("❌ Error al seedear el viaje:", err);
  }

  process.exit(0);
}

run();
