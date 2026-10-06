import { readFileSync } from "fs";
import { resolve } from "path";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

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

const DEFAULT_OTA_PACKAGES = [
  {
    id: "OTA-PKG-001",
    title: "Cancún & Riviera Maya All Inclusive",
    destination: "Cancún",
    country: "México",
    region: "Internacional",
    type: "paquete",
    providerType: "mayorista",
    providerCategory: "operador_verificado",
    operatorName: "Juliá Tours",
    modality: "Individual",
    durationDays: 8,
    durationNights: 7,
    departureDates: ["12 Nov 2026", "03 Dic 2026", "15 Ene 2027"],
    departureOrigin: "Buenos Aires (Ezeiza)",
    transportType: "Aéreo",
    airline: "Copa Airlines",
    luggageIncluded: "Equipaje en bodega (23kg) incluido",
    hotelName: "Riu Tequila 5★ Resort",
    hotelStars: 5,
    foodPlan: "All Inclusive",
    currency: "USD",
    price: 2150,
    memberPrice: 1990,
    priceUsd: 2150,
    priceArs: 2850000,
    financingText: "Hasta 6 cuotas fijas en USD con tarjeta",
    installments: "Hasta 6 cuotas fijas en USD",
    rewardsPointsEarned: 850,
    rewardsPointsRequired: 18000,
    enabledActions: ["ver_detalle", "whatsapp", "reservar", "senar", "pagar"],
    badge: "🌴 ALL INCLUSIVE 5★",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85",
    description: "Viví unas vacaciones soñadas en el Caribe mexicano con aéreos directos, traslados privados y régimen All Inclusive en resort de primera línea.",
    includedServices: [
      "Vuelos ida y vuelta con equipaje en bodega",
      "Traslados in/out en van ejecutiva",
      "7 noches All Inclusive 24hs",
      "Acceso ilimitado a restaurantes temáticos",
      "Asistencia al viajero internacional"
    ],
    featured: true
  },
  {
    id: "OTA-PKG-002",
    title: "Bariloche Mágico & Circuito Chico",
    destination: "Bariloche",
    country: "Argentina",
    region: "Nacional",
    type: "salida_grupal",
    providerType: "propio",
    providerCategory: "propio",
    operatorName: "TravelApp Exclusivo",
    modality: "Salida Grupal Acompañada",
    stockBadge: "Últimos 4 cupos",
    durationDays: 6,
    durationNights: 5,
    departureDates: ["20 Oct 2026", "10 Nov 2026", "08 Dic 2026"],
    departureOrigin: "Tucumán / Buenos Aires",
    transportType: "Aéreo",
    airline: "Aerolíneas Argentinas",
    luggageIncluded: "Equipaje en bodega incluido",
    hotelName: "Hotel Edelweiss 4★",
    hotelStars: 4,
    foodPlan: "Media Pensión",
    currency: "ARS",
    price: 980000,
    memberPrice: 890000,
    priceArs: 980000,
    priceUsd: 740,
    financingText: "12 cuotas fijas con todas las tarjetas de crédito",
    installments: "Hasta 12 cuotas fijas",
    rewardsPointsEarned: 450,
    rewardsPointsRequired: 8500,
    enabledActions: ["ver_detalle", "whatsapp", "reservar", "senar", "pagar"],
    badge: "⭐ SALIDA PROPIA ACOMPAÑADA",
    imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=85",
    description: "Salida grupal exclusiva con coordinador permanente TravelApp. Navegación por el Lago Nahuel Huapi, Cerro Campanario y degustación de chocolates artesanales.",
    includedServices: [
      "Aéreos ida y vuelta desde Tucumán o BUE",
      "5 noches de alojamiento en hotel céntrico 4★",
      "Media pensión (desayunos y cenas con bebidas)",
      "Circuito Chico y Punto Panorámico",
      "Coordinador permanente desde el origen"
    ],
    featured: true
  },
  {
    id: "OTA-PKG-003",
    title: "Crucero Costa: Río de Janeiro, Ilhabela & Punta del Este",
    destination: "Costas de Brasil y Uruguay",
    country: "Brasil / Uruguay",
    region: "Internacional",
    type: "crucero",
    providerType: "mayorista",
    providerCategory: "operador_verificado",
    operatorName: "Costa Cruceros / Ola",
    modality: "Individual",
    durationDays: 9,
    durationNights: 8,
    departureDates: ["14 Dic 2026", "04 Ene 2027", "22 Feb 2027"],
    departureOrigin: "Puerto de Buenos Aires",
    transportType: "Crucero",
    cruiseCabin: "Cabina Externa con Balcón al Mar",
    cruisePorts: "Buenos Aires, Río de Janeiro, Ilhabela, Punta del Este",
    hotelName: "Buque Costa Fascinosa (Cabina con Balcón)",
    hotelStars: 5,
    foodPlan: "Pensión Completa",
    currency: "USD",
    price: 1850,
    memberPrice: 1690,
    priceUsd: 1850,
    priceArs: 2450000,
    financingText: "Hasta 6 cuotas fijas en USD sin recargo",
    installments: "Hasta 6 cuotas en USD o ARS",
    rewardsPointsEarned: 700,
    rewardsPointsRequired: 15000,
    enabledActions: ["ver_detalle", "whatsapp", "reservar", "senar", "pagar"],
    badge: "🚢 CRUCERO EXCLUSIVO 2026/27",
    imageUrl: "https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=1200&q=85",
    description: "Navegá por las aguas más cálidas del Atlántico a bordo del Costa Fascinosa con todas las comidas incluidas y escalas en Río y Punta del Este.",
    includedServices: [
      "8 noches a bordo de Costa Fascinosa",
      "Cabina externa con balcón privado",
      "Pensión completa (5 comidas diarias)",
      "Shows estilo Broadway y piscinas",
      "Tasas portuarias y de servicio incluidas"
    ],
    featured: true
  },
  {
    id: "OTA-PKG-004",
    title: "Europa Clásica: Madrid, París, Alpes y Roma",
    destination: "Madrid, París, Roma",
    country: "España / Francia / Italia",
    region: "Internacional",
    type: "paquete",
    providerType: "mayorista",
    providerCategory: "operador_verificado",
    operatorName: "Europamundo / Special Tours",
    modality: "Salida Grupal Acompañada",
    durationDays: 16,
    durationNights: 14,
    departureDates: ["05 Abr 2027", "18 May 2027", "14 Sep 2027"],
    departureOrigin: "Buenos Aires (Ezeiza)",
    transportType: "Aéreo",
    airline: "Iberia / Air Europa",
    luggageIncluded: "Equipaje despachado 23kg + carry-on",
    hotelName: "Hoteles Categoría Confort 4★ Céntricos",
    hotelStars: 4,
    foodPlan: "Desayuno",
    currency: "USD",
    price: 3200,
    memberPrice: 2980,
    priceUsd: 3200,
    priceArs: 4200000,
    financingText: "Seña 30% y saldo financiado hasta 45 días antes de la salida",
    installments: "Financiación especial en USD",
    rewardsPointsEarned: 1200,
    rewardsPointsRequired: 26000,
    enabledActions: ["ver_detalle", "whatsapp", "reservar", "senar"],
    badge: "🏛️ CIRCUITO EUROPEO COMPLETO",
    imageUrl: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1200&q=85",
    description: "El gran circuito de Europa con guía correo de habla hispana, traslados en bus panorámico con Wi-Fi, barco en Venecia y visitas panorámicas.",
    includedServices: [
      "Vuelos intercontinentales ida y vuelta",
      "Autocar de gran confort con Wi-Fi",
      "14 noches de alojamiento con desayuno buffet",
      "Visitas guiadas en Madrid, París y Roma",
      "Traslado nocturno a Trastevere en Roma"
    ],
    featured: true
  },
  {
    id: "OTA-PKG-005",
    title: "Mendoza & Termas de Cacheuta en Bus Cama",
    destination: "Mendoza",
    country: "Argentina",
    region: "Nacional",
    type: "salida_grupal",
    providerType: "propio",
    providerCategory: "propio",
    operatorName: "TravelApp Exclusivo",
    modality: "Salida Grupal Acompañada",
    stockBadge: "Salida Confirmada - 8 Cupos",
    durationDays: 5,
    durationNights: 3,
    departureDates: ["12 Oct 2026", "20 Nov 2026", "08 Dic 2026"],
    departureOrigin: "Tucumán / Córdoba",
    transportType: "Bus Cama",
    busType: "Cama",
    luggageIncluded: "Bodega de bus hasta 2 piezas",
    hotelName: "Hotel Crillón Mendoza 3★ Sup",
    hotelStars: 3,
    foodPlan: "Media Pensión",
    currency: "ARS",
    price: 590000,
    memberPrice: 530000,
    priceArs: 590000,
    priceUsd: 450,
    financingText: "6 cuotas fijas de $115.000 o contado efectivo 10% desc.",
    installments: "Hasta 6 cuotas fijas",
    rewardsPointsEarned: 280,
    rewardsPointsRequired: 5200,
    enabledActions: ["ver_detalle", "whatsapp", "reservar", "senar", "pagar"],
    badge: "🚌 SALIDA PROPIA BUS CHÁRTER",
    imageUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=85",
    description: "Salida grupal en Bus Cama Chárter exclusivo de TravelApp. Día completo de relajación en Termas de Cacheuta con almuerzo criollo y visita a bodega.",
    includedServices: [
      "Bus Cama ida y vuelta con servicio a bordo",
      "3 noches en Hotel Crillón céntrico",
      "Media pensión incluida",
      "Entrada y día completo en Parque Termal Cacheuta",
      "Visita a Bodega y Fábrica de Chocolates"
    ],
    featured: false
  },
  {
    id: "OTA-PKG-006",
    title: "Río de Janeiro & Buzios Maravilloso",
    destination: "Río de Janeiro & Buzios",
    country: "Brasil",
    region: "Internacional",
    type: "paquete",
    providerType: "mayorista",
    providerCategory: "operador_verificado",
    operatorName: "Juliá Tours / Gol",
    modality: "Individual",
    durationDays: 8,
    durationNights: 7,
    departureDates: ["10 Nov 2026", "01 Dic 2026", "18 Ene 2027"],
    departureOrigin: "Buenos Aires / Córdoba",
    transportType: "Aéreo",
    airline: "Gol Linhas Aéreas",
    luggageIncluded: "Carry-on 10kg incluido (Bodega opcional)",
    hotelName: "Windsor Copa + Pousada Buzios",
    hotelStars: 4,
    foodPlan: "Desayuno",
    currency: "USD",
    price: 1100,
    memberPrice: 990,
    priceArs: 1450000,
    priceUsd: 1100,
    financingText: "Hasta 3 cuotas fijas sin interés en USD",
    installments: "Hasta 6 cuotas fijas",
    rewardsPointsEarned: 520,
    rewardsPointsRequired: 9800,
    enabledActions: ["ver_detalle", "whatsapp", "reservar", "senar", "pagar"],
    badge: "🏖️ PLAYA & SAMBA BRASIL",
    imageUrl: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1200&q=85",
    description: "Combinado imperdible: la energía de Copacabana y el Cristo Redentor en Río, más el encanto y las playas paradisíacas de la península de Buzios.",
    includedServices: [
      "Aéreos ida y vuelta a Río de Janeiro",
      "3 noches en Copacabana + 4 noches en Buzios",
      "Todos los traslados interhoteles incluidos",
      "Desayuno buffet brasilero incluido",
      "Asistencia médica internacional"
    ],
    featured: false
  }
];

async function run() {
  console.log(`\n🔗 Actualizando paquetes en Firestore (ota_packages y experiences)...\n`);
  try {
    const cred = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    console.log(`✅ Autenticado como ${TEST_EMAIL}`);

    for (const pkg of DEFAULT_OTA_PACKAGES) {
      await setDoc(doc(db, "ota_packages", pkg.id), {
        ...pkg,
        updatedAt: new Date().toISOString()
      });

      const tourSync = {
        id: pkg.id,
        title: pkg.title,
        location: `${pkg.destination}, ${pkg.country}`,
        price: pkg.price,
        currency: pkg.currency,
        priceRewards: pkg.memberPrice || Math.round(pkg.price * 0.9),
        pointsEarned: pkg.rewardsPointsEarned || 500,
        tripType: pkg.modality === 'Salida Grupal Acompañada' ? 'Grupal' : 'Individual',
        scope: pkg.region === 'Nacional' ? 'Nacional' : 'Internacional',
        tourismVertical: 'emisivo',
        productType: pkg.type === 'crucero' ? 'crucero' : pkg.providerCategory === 'propio' ? 'salida_propia' : 'operador_mayorista',
        transportation: `${pkg.transportType} ${pkg.airline || ''}`.trim(),
        departureDate: pkg.departureDates?.[0] || '2026-11-12',
        departureOrigin: pkg.departureOrigin,
        services: pkg.includedServices,
        imageUrl: pkg.imageUrl,
        description: pkg.description,
        observations: `Operador: ${pkg.operatorName || 'TravelApp'} · Régimen: ${pkg.foodPlan} · ${pkg.durationDays}D / ${pkg.durationNights}N`,
        availability: 'Disponible',
      };
      await setDoc(doc(db, "experiences", pkg.id), tourSync);
      console.log(`   + ${pkg.id}: ${pkg.title} (${pkg.currency} ${pkg.price})`);
    }

    console.log(`\n🎉 SEED DE PAQUETES ACTUALIZADO CON ÉXITO.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error en seeder:", err);
    process.exit(1);
  }
}

run();
