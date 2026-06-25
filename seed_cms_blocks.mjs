import { readFileSync } from "fs";
import { resolve } from "path";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// Lee .env.local manualmente
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
  console.log(`\n🔗 Conectando a Firebase para seedear cms_blocks/block-1 para: ${TEST_EMAIL}...\n`);

  try {
    const cred = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    console.log(`✅ Logueado con UID: ${cred.user.uid}`);

    const docRef = doc(db, "cms_blocks", "block-1");
    const docData = {
      id: "block-1",
      blockTitle: "Novedades del Ecosistema",
      cards: [
        {
          title: "TravelApp Rewards",
          description: "Completá tu foto de perfil en el panel y ganá 150 puntos extra al instante para tu próximo canje.",
          imageUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80",
          url: "https://travelapp.ar/rewards"
        },
        {
          title: "Nuevas Experiencias",
          description: "Ya podés agendar paseos de aventura y traslados rurales en las yungas tucumanas.",
          imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80",
          url: "https://travelapp.ar/experiences"
        },
        {
          title: "Travis AI Chatbot",
          description: "Hablá con nuestro asistente inteligente de viajes para programar traslados con IA.",
          imageUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80",
          url: "https://travelapp.ar/chatbot"
        },
        {
          title: "Viajes Compartidos",
          description: "Viajá con otros pasajeros en la misma dirección y ahorrá hasta un 40% del traslado.",
          imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80",
          url: "https://travelapp.ar/share"
        },
        {
          title: "Socio Conductor",
          description: "Registrá tu auto o taxi y empezá a generar ingresos con soporte local certificado.",
          imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=600&q=80",
          url: "https://travelapp.ar/conductor"
        }
      ]
    };

    await setDoc(docRef, docData);
    console.log("✅ Colección cms_blocks/block-1 seedeada con éxito.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al seedear cms_blocks/block-1:", error);
    process.exit(1);
  }
}

run();
