"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MUTariff, VehicleCategory } from '@/types/logistics';
import { 
  ShieldCheck, 
  UserCheck, 
  Gift, 
  Award, 
  Zap, 
  Phone, 
  ArrowRight, 
  Navigation, 
  Star, 
  CheckCircle,
  Menu,
  X,
  MapPin,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Clock,
  Check,
  CreditCard,
  Wallet,
  Coins,
  QrCode,
  Shield,
  Briefcase,
  ExternalLink
} from 'lucide-react';
import { GoogleAddressAutocomplete } from '@/components/travelcab/GoogleAddressAutocomplete';

// Importación dinámica para desactivar SSR y evitar errores de 'window is not defined' con Google Maps
const GoogleInteractiveMap = dynamic(
  () => import('@/components/travelcab/GoogleInteractiveMap').then((mod) => mod.GoogleInteractiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full flex-col items-center justify-center bg-slate-950 text-slate-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-vial-orange border-t-transparent mb-2"></div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cargando Mapa Satelital...</p>
      </div>
    )
  }
);

// ==========================================
// CMS READY DATA STRUCTURE (LANDING_DATA)
// Modificar este objeto para actualizar la Landing Page
// ==========================================
const LANDING_DATA = {
  navigation: {
    logoText: "TravelCab",
    logoImage: "/assets/travelcab_original.svg",
    tagline: "Movilidad Premium",
    ctaText: "Pedir Ahora",
    ctaUrl: "https://wa.me/5493814188106?text=Hola!%20Quiero%20pedir%20un%20TravelCab%20ahora.",
    driverRegisterUrl: "/hr/new-partner"
  },
  hero: {
    badge: "✓ EL ESTÁNDAR MÁS ALTO EN MOVILIDAD URBANA",
    title: "La Ciudad a tu Ritmo",
    subtitle: "Viajes urbanos premium con el soporte local más confiable. Disfruta de seguridad monitoreada 24/7, choferes profesionales certificados y la tarifa más justa del mercado.",
    stats: [
      { value: "10 min", label: "Espera promedio" },
      { value: "4.9 / 5", label: "Calificación promedio" },
      { value: "100%", label: "Viajes Monitoreados" }
    ],
    backgroundImage: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1920&q=80"
  },
  dispatcher: {
    badge: "DESPACHADOR WEB INTELIGENTE",
    title: "Solicita tu Viaje",
    subtitle: "Ingresa origen y destino para cotizar en tiempo real.",
    pickupLabel: "Punto de Origen",
    pickupPlaceholder: "¿Dónde te buscamos? (Ej. Av. Mitre 550)",
    dropoffLabel: "Punto de Destino",
    dropoffPlaceholder: "¿A dónde viajas? (Ej. Aeropuerto)",
    passengerNameLabel: "Nombre del Pasajero",
    passengerNamePlaceholder: "Escribe tu nombre y apellido",
    passengerPhoneLabel: "Número de Teléfono",
    passengerPhonePlaceholder: "Ej: +54 9 381 655-4433",
    paymentMethodLabel: "Método de Pago",
    paymentMethods: [
      { id: "Efectivo", label: "Efectivo al Conductor", icon: "Coins" },
      { id: "Billetera Virtual", label: "Billetera Virtual", icon: "Wallet" },
      { id: "Tarjeta", label: "Tarjeta de Débito / Crédito", icon: "CreditCard" }
    ],
    legalText: "* Las tarifas mostradas son estimadas y pueden variar de acuerdo con el tráfico real, horario y factores climáticos.",
    whatsappConfig: {
      phone: "5493814188106",
      messageTemplate: "¡Hola TravelCab! 🚕 Quiero solicitar un viaje desde la web:\n\n👤 *Pasajero:* {name}\n📞 *Teléfono:* {phone}\n🛣️ *Modalidad:* {modality}\n📍 *Origen:* {pickup}\n🏁 *Destino:* {dropoff}\n🚗 *Categoría:* {vehicle}\n💳 *Pago:* {payment}\n💵 *Tarifa Estimada:* {price}\n\n_Por favor, confírmenme la asignación del móvil y chofer._"
    },
    vehicles: [
      {
        id: "standard",
        name: "TravelCab Standard",
        description: "Sedán moderno, climatizado, ideal para tus traslados diarios de forma rápida.",
        baseRate: 580,
        multiplier: 1.0,
        eta: "3 - 5 min"
      },
      {
        id: "premium",
        name: "TravelCab Premium",
        description: "Auto de gama alta, máximo confort, chofer corporativo bilingüe y espacio extra.",
        baseRate: 850,
        multiplier: 1.45,
        eta: "2 - 4 min"
      }
    ]
  },
  passengers: {
    badge: "VIAJA SEGURO",
    title: "Confort, tranquilidad y puntualidad en cada trayecto",
    subtitle: "Hemos reinventado el servicio de traslados urbanos para brindarte la tranquilidad que te mereces cuando te trasladas por la ciudad.",
    benefits: [
      {
        id: "security",
        icon: "ShieldCheck",
        title: "Seguridad 24/7",
        description: "Monitoreo satelital activo en tiempo real. Tu recorrido está respaldado de principio a fin por nuestro centro de operaciones de alta tecnología."
      },
      {
        id: "drivers",
        icon: "UserCheck",
        title: "Conductores Calificados",
        description: "Olvídate de las sorpresas. Nuestro equipo está conformado únicamente por choferes profesionales certificados tras rigurosos análisis de antecedentes."
      },
      {
        id: "rewards",
        icon: "Gift",
        title: "Puntos Rewards",
        description: "Cada kilómetro recorrido te otorga puntos exclusivos dentro de nuestro ecosistema. Canjéalos por viajes bonificados o beneficios corporativos."
      }
    ]
  },
  drivers: {
    badge: "SISTEMA PREMIUM HÍBRIDO",
    title: "Modelo Híbrido: Membresía Fija o Comisión",
    subtitle: "Elige el esquema financiero que mejor se adapte a tu estilo de vida. Puedes abonar una membresía mensual fija y retener el 100% del valor de tus viajes, o trabajar bajo nuestro esquema tradicional de baja comisión por viaje.",
    benefits: [
      {
        icon: "Award",
        title: "Membresía Fija",
        description: "Retén el 100% de la facturación de tus viajes pagando una membresía plana mensual. Ideal para choferes de dedicación completa."
      },
      {
        icon: "Zap",
        title: "Esquema por Comisión",
        description: "Si prefieres trabajar de forma eventual, abona únicamente una comisión baja y transparente del 15% por cada viaje completado."
      },
      {
        icon: "Phone",
        title: "Soporte de la IA 'Travis'",
        description: "Soporte telefónico local y asistencia automatizada inteligente en WhatsApp a través de nuestra IA 'Travis' las 24 horas del día."
      }
    ],
    ctaRegister: {
      text: "Comenzar Registro",
      url: "/hr/new-partner"
    },
    ctaInfo: {
      text: "Solicitar más información",
      url: "https://wa.me/5493814188106?text=Hola%20IA%20Travis!%20Quiero%20solicitar%20más%20información%20sobre%20el%20Modelo%20Híbrido%20de%20TravelCab."
    }
  },
  faq: {
    title: "Preguntas Frecuentes",
    subtitle: "Todo lo que necesitas saber sobre el servicio de movilidad premium",
    items: [
      {
        question: "¿Cómo funciona el Despachador Web Inteligente?",
        answer: "El despachador te permite ingresar origen y destino, calcular una tarifa estimada instantáneamente y elegir tu categoría. Al confirmar, te redirigirá a WhatsApp con un mensaje pre-configurado para que nuestra central asigne el chofer más cercano en segundos."
      },
      {
        question: "¿Qué es el 'Modelo Híbrido' para conductores (Membresía vs. Comisión)?",
        answer: "Es un esquema flexible único. Como conductor, puedes optar por pagar una membresía mensual fija (retienes el 100% del valor de tus viajes) o bien operar bajo el esquema tradicional de comisión baja (15%) por cada traslado realizado."
      },
      {
        question: "¿Qué métodos de pago puedo utilizar?",
        answer: "Ofrecemos flexibilidad total. Puedes abonar en efectivo directo al chofer, realizar transferencias instantáneas mediante Mercado Pago o billeteras virtuales, o registrar de forma segura tarjetas de débito/crédito corporativas."
      },
      {
        question: "¿Cómo se garantiza la seguridad de mi viaje?",
        answer: "Todos nuestros traslados son monitoreados satelitalmente las 24 horas. Además, nuestros choferes pasan por rigurosas pruebas de antecedentes penales, análisis psicofísicos y validación de vehículos de forma presencial."
      },
      {
        question: "¿Qué requisitos debe cumplir un vehículo para ser aceptado?",
        answer: "El vehículo debe ser modelo 2018 o posterior, contar con 4 puertas, aire acondicionado en óptimas condiciones, seguro comercial al día y pasar una revisión técnica e higiénica presencial en nuestras oficinas locales."
      },
      {
        question: "¿Ofrecen soluciones de movilidad corporativa para empresas?",
        answer: "Sí, contamos con un área dedicada para cuentas corporativas. Ofrecemos facturación mensual unificada, paneles de control para administrar traslados del personal y tarifas corporativas especiales."
      },
      {
        question: "¿Cómo funciona el sistema de Puntos Rewards?",
        answer: "Cada kilómetro recorrido en TravelCab acumula puntos automáticamente en tu perfil del ecosistema. Estos puntos pueden ser canjeados por descuentos en tus próximos viajes o beneficios exclusivos con partners."
      },
      {
        question: "¿Qué es el servicio de Auto Rural Compartido (ARC)?",
        answer: "ARC es una alternativa económica diseñada para viajes interurbanos o rurales. Permite a varios pasajeros compartir un mismo trayecto planificado, reduciendo el costo del viaje hasta en un 35% por persona."
      },
      {
        question: "¿Quién es la IA 'Travis' y cómo me ayuda?",
        answer: "Travis es nuestro asistente virtual inteligente disponible las 24 horas en WhatsApp. Está capacitado para cotizar tarifas, responder dudas sobre los servicios y guiar de forma rápida a los conductores en su proceso de registro."
      },
      {
        question: "¿Los conductores reciben capacitación antes de empezar?",
        answer: "Absolutamente. Todos los choferes de la red completan de manera obligatoria una inducción integral en servicio de atención premium al cliente, normas de seguridad vial, conducción defensiva y uso del despachador digital."
      }
    ]
  },
  socials: {
    facebook: "https://facebook.com/travelcab",
    instagram: "https://instagram.com/travelcab.ar",
    messenger: "https://m.me/travelcab",
    travelappInstagram: "https://instagram.com/travelapp.ar",
    travelappFacebook: "https://facebook.com/travelapp.ar"
  },
  contact: {
    phone: "0810-220-0018",
    whatsapp: "https://wa.me/5493814188106"
  },
  footer: {
    brand: "TravelCab",
    description: "La red de movilidad urbana corporativa y particular más segura, confiable y moderna. Llevándote a donde necesitas estar, de la mejor manera posible.",
    copyright: "© 2026 TravelCab. Todos los derechos reservados. Una marca de TravelApp s.a.s.",
    legalLinks: [
      { text: "Términos de Uso", url: "#" },
      { text: "Política de Cookies", url: "#" },
      { text: "Política de Privacidad", url: "#" }
    ]
  }
};

// Mapeador estático de iconos para evitar renderizado dinámico inseguro
const IconMap = {
  ShieldCheck: ShieldCheck,
  UserCheck: UserCheck,
  Gift: Gift,
  Award: Award,
  Zap: Zap,
  Phone: Phone,
  Coins: Coins,
  Wallet: Wallet,
  CreditCard: CreditCard
};

const DEFAULT_MU_TARIFFS_FALLBACK: MUTariff[] = [
  {
    id: 'mu-standard-fallback',
    name: 'TravelCab Standard',
    category: 'estandar',
    baseFare: 580,
    pricePerKm: 480,
    minimumFare: 2800,
    travelMinutePrice: 120,
    waitMinutePrice: 180,
    courtesyTimeMinutes: 5,
    iva: 21,
    iibb: 3.5,
    taxMunicipal: 1.5,
    electronicPaymentFee: 5,
    commissionRate: 15,
    weeklyMembership: 5000,
    isActive: true
  },
  {
    id: 'mu-premium-fallback',
    name: 'TravelCab Premium',
    category: 'premium',
    baseFare: 850,
    pricePerKm: 680,
    minimumFare: 3800,
    travelMinutePrice: 160,
    waitMinutePrice: 200,
    courtesyTimeMinutes: 5,
    iva: 21,
    iibb: 3.5,
    taxMunicipal: 1.5,
    electronicPaymentFee: 5,
    commissionRate: 15,
    weeklyMembership: 5000,
    isActive: true
  }
];

export default function TravelCabLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Estados del Despachador Web
  const [dispatcherStep, setDispatcherStep] = useState<1 | 2 | 3>(1);
  const [modality, setModality] = useState<'MU' | 'ARC'>('MU');
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  
  // Real routing outputs from Google Maps
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [durationMin, setDurationMin] = useState<number>(0);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  // Errores de Validación del Despachador
  const [formErrors, setFormErrors] = useState<{
    name?: boolean;
    phone?: boolean;
    pickup?: boolean;
    dropoff?: boolean;
  }>({});

  // Categoría de Vehículo Seleccionada para el Paso 3
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [calculatedPrice, setCalculatedPrice] = useState('');

  // Firestore dynamic state
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [activeTariffs, setActiveTariffs] = useState<MUTariff[]>([]);
  const [isLoadingTariffs, setIsLoadingTariffs] = useState(true);

  // Escuchar categorías y tarifas activas en tiempo real
  React.useEffect(() => {
    // 1. Categorías
    const unsubCats = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as VehicleCategory);
      setCategories(list);
    }, (error) => {
      console.log('Error loading categories on landing page:', error.message);
    });

    // 2. Tarifarios MU Activos
    const qMu = query(collection(db, 'tariffs'), where('type', '==', 'mu'), where('isActive', '==', true));
    const unsubMu = onSnapshot(qMu, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as MUTariff);
      setActiveTariffs(list);
      setIsLoadingTariffs(false);
    }, (error) => {
      console.log('Error loading active MU tariffs on landing:', error.message);
      setIsLoadingTariffs(false);
    });

    return () => {
      unsubCats();
      unsubMu();
    };
  }, []);

  // Lista de vehículos dinámica basada en tarifarios de Firestore
  const vehiclesList = React.useMemo(() => {
    const list = activeTariffs.length > 0 ? activeTariffs : DEFAULT_MU_TARIFFS_FALLBACK;
    
    return list.map((tariff) => {
      const categoryObj = categories.find(c => c.id === tariff.category);
      
      let name = '';
      let description = '';
      let eta = '3 - 5 min';
      
      if (categoryObj) {
        name = categoryObj.name;
        description = categoryObj.description;
        eta = categoryObj.eta;
      } else {
        // Fallback names for default categories
        if (tariff.category === 'vip') {
          name = 'TravelCab VIP';
          description = 'Vehículo de alta gama con chofer profesional y máximo confort corporativo.';
          eta = '3 - 5 min';
        } else if (tariff.category === 'premium') {
          name = 'TravelCab Premium';
          description = 'Auto de gama alta, máximo confort, espacio extra y chofer bilingüe.';
          eta = '2 - 4 min';
        } else {
          name = 'TravelCab Standard';
          description = 'Sedán moderno, climatizado, ideal para tus traslados diarios de forma rápida.';
          eta = '4 - 6 min';
        }
      }
      
      return {
        id: tariff.id,
        name: name,
        description: description,
        eta: eta,
        baseRate: tariff.baseFare,
        multiplier: tariff.category === 'premium' ? 1.45 : tariff.category === 'vip' ? 1.6 : 1.0,
        tariff: tariff
      };
    });
  }, [activeTariffs, categories]);

  // Calcular ruta al tener Origen y Destino mediante Google Maps Directions API
  React.useEffect(() => {
    if (!pickupCoords || !dropoffCoords) {
      setDistanceKm(0);
      setDurationMin(0);
      return;
    }

    if (typeof window !== "undefined" && window.google) {
      setIsCalculatingRoute(true);
      const directionsService = new window.google.maps.DirectionsService();
      
      directionsService.route(
        {
          origin: pickupCoords,
          destination: dropoffCoords,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          setIsCalculatingRoute(false);
          if (status === window.google.maps.DirectionsStatus.OK && result) {
            const leg = result.routes[0].legs[0];
            const km = (leg.distance?.value || 0) / 1000;
            const mins = Math.round((leg.duration?.value || 0) / 60);
            
            setDistanceKm(Number(km.toFixed(1)));
            setDurationMin(mins);
          } else {
            console.error("Error calculando ruta en landing:", status);
          }
        }
      );
    }
  }, [pickupCoords, dropoffCoords]);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // Función para calcular la tarifa real usando la distancia de Google Maps o simulada
  const getCalculatedPriceForVehicle = (vehicle: any) => {
    let distance = distanceKm;
    let duration = durationMin;
    
    if (distance === 0) {
      const charsCount = (pickupLocation.length || 10) + (dropoffLocation.length || 10);
      distance = Math.max(5, (charsCount * 0.35));
      duration = Math.round(distance * 1.5);
    }

    const tariff = vehicle.tariff || DEFAULT_MU_TARIFFS_FALLBACK[0];
    const baseFare = tariff.baseFare || vehicle.baseRate || 580;
    const pricePerKm = tariff.pricePerKm || (vehicle.id === 'premium' ? 680 : 480);
    const travelMinutePrice = tariff.travelMinutePrice || (vehicle.id === 'premium' ? 160 : 120);
    const minimumFare = tariff.minimumFare || (vehicle.id === 'premium' ? 3800 : 2800);
    
    // Subtotal base
    const basePrice = baseFare + (distance * pricePerKm) + (duration * travelMinutePrice);
    
    // Impuestos desglosados (IVA, IIBB, Municipales)
    const iva = tariff.iva !== undefined ? tariff.iva : 21;
    const iibb = tariff.iibb !== undefined ? tariff.iibb : 3.5;
    const taxMunicipal = tariff.taxMunicipal !== undefined ? tariff.taxMunicipal : 1.5;
    const totalTaxesPct = iva + iibb + taxMunicipal;
    
    let taxedPrice = basePrice * (1 + totalTaxesPct / 100);
    
    // Recargo por pago electrónico si no es Efectivo
    if (paymentMethod === 'Tarjeta' || paymentMethod === 'Billetera Virtual') {
      const cardFeePct = tariff.electronicPaymentFee !== undefined ? tariff.electronicPaymentFee : 5;
      taxedPrice = taxedPrice * (1 + cardFeePct / 100);
    }
    
    // Descuento del 35% si es Auto Compartido (ARC)
    const modalityFactor = modality === 'ARC' ? 0.65 : 1.0;
    
    const finalPrice = Math.max(minimumFare, Math.round(taxedPrice * modalityFactor));
    return finalPrice;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleCalculateRate = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación
    const errors: typeof formErrors = {};
    if (!passengerName.trim()) errors.name = true;
    if (!passengerPhone.trim()) errors.phone = true;
    if (!pickupLocation.trim()) errors.pickup = true;
    if (!dropoffLocation.trim()) errors.dropoff = true;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setDispatcherStep(2);
  };

  const handleSelectVehicle = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    const priceAmount = getCalculatedPriceForVehicle(vehicle);
    const formattedPrice = formatCurrency(priceAmount);
    setCalculatedPrice(formattedPrice);

    // Armar enlace de WhatsApp dinámico
    const modalityText = modality === 'MU' ? 'Movilidad Urbana (Privado)' : 'Auto Rural Compartido (ARC)';
    
    let message = LANDING_DATA.dispatcher.whatsappConfig.messageTemplate
      .replace('{name}', passengerName)
      .replace('{phone}', passengerPhone)
      .replace('{modality}', modalityText)
      .replace('{pickup}', pickupLocation)
      .replace('{dropoff}', dropoffLocation)
      .replace('{vehicle}', vehicle.name)
      .replace('{payment}', paymentMethod)
      .replace('{price}', formattedPrice);

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${LANDING_DATA.dispatcher.whatsappConfig.phone}?text=${encodedMessage}`;

    // Abrir WhatsApp en pestaña nueva
    window.open(whatsappUrl, '_blank');
    
    // Pasar a Paso 3 (Confirmación)
    setDispatcherStep(3);
  };

  const handleResetDispatcher = () => {
    setDispatcherStep(1);
    setPassengerName('');
    setPassengerPhone('');
    setPickupLocation('');
    setDropoffLocation('');
    setPaymentMethod('Efectivo');
    setSelectedVehicle(null);
    setCalculatedPrice('');
    setFormErrors({});
  };

  return (
    <div className="min-h-screen bg-slate-50 text-tech-blue font-sans selection:bg-vial-orange/20 selection:text-tech-blue overflow-x-hidden animate-fadeIn">
      
      {/* ---------------- NAVIGATION HEADER (MINIMALISTA) ---------------- */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-md transition-all duration-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 md:px-8">
          {/* Logo Oficial SVG */}
          <a href="/landing/travelcab" className="flex items-center">
            <img
              src={LANDING_DATA.navigation.logoImage}
              alt="TravelCab"
              className="h-16 md:h-22 w-auto object-contain transition-all duration-300"
            />
          </a>

          {/* Desktop: Botón Login Dropdown */}
          <div className="hidden md:flex items-center">
            <div className="relative group">
              <button className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-tech-blue text-tech-blue bg-transparent px-5 py-2.5 text-sm font-bold hover:bg-tech-blue hover:text-white transition-all duration-200 cursor-pointer">
                Ingresar / Registrarse
                <ChevronRight className="h-4 w-4 rotate-90" />
              </button>
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-slate-200/60 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 overflow-hidden transform origin-top-right scale-95 group-hover:scale-100">
                <a
                  href="/travelcab/login?role=passenger"
                  className="block px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-vial-orange border-b border-slate-100 transition-colors"
                >
                  Soy Pasajero
                </a>
                <a
                  href={LANDING_DATA.navigation.driverRegisterUrl}
                  className="block px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-vial-orange transition-colors"
                >
                  Soy Conductor
                </a>
              </div>
            </div>
          </div>

          {/* Mobile: hamburguesa */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 md:hidden hover:bg-slate-100 transition-colors"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-100 bg-white p-4 md:hidden flex flex-col gap-2 shadow-lg animate-fadeIn">
            <div className="flex flex-col gap-1 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase px-4 tracking-wider">Acceso a Plataforma</span>
              <a
                href="/travelcab/login?role=passenger"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-vial-orange transition-colors"
              >
                Soy Pasajero (Ingresar)
              </a>
              <a
                href={LANDING_DATA.navigation.driverRegisterUrl}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-vial-orange transition-colors"
              >
                Soy Conductor (Registrarme)
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ---------------- HERO SECTION (ESTILO BOOKING.COM CON DESPACHADOR) ---------------- */}
      <section 
        className="relative overflow-hidden bg-cover bg-center py-20 lg:py-28 px-4 md:px-8 text-white transition-all duration-300"
        style={{ 
          backgroundImage: `linear-gradient(rgba(10, 42, 91, 0.85), rgba(15, 23, 42, 0.95)), url('${LANDING_DATA.hero.backgroundImage}')` 
        }}
      >
        {/* Ambient Lights Overlay */}
        <div className="absolute top-0 right-0 -z-5 h-[400px] w-[400px] rounded-full bg-vial-orange/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -z-5 h-[300px] w-[300px] rounded-full bg-tech-blue/20 blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-6 xl:col-span-7 space-y-6 text-center lg:text-left">
              <span className="inline-flex items-center rounded-full bg-vial-orange/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-vial-orange ring-1 ring-vial-orange/30 animate-pulse">
                {LANDING_DATA.hero.badge}
              </span>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                {LANDING_DATA.hero.title}
              </h1>
              
              <p className="mx-auto lg:mx-0 max-w-xl text-lg text-slate-200 leading-relaxed font-medium">
                {LANDING_DATA.hero.subtitle}
              </p>

              {/* Secondary Action Link / Info */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <a 
                  href={LANDING_DATA.navigation.driverRegisterUrl}
                  className="group w-full sm:w-auto inline-flex flex-col items-center justify-center rounded-2xl border-2 border-white/40 bg-white/5 backdrop-blur-sm px-8 py-3 text-center text-white hover:bg-white hover:text-tech-blue hover:border-white hover:-translate-y-1 active:translate-y-0 transition-all duration-300"
                >
                  <span className="font-extrabold text-base">
                    Quiero registrarme como Conductor
                  </span>
                  <span className="text-[11px] text-slate-300 group-hover:text-slate-500 font-medium tracking-wide mt-0.5">
                    Membresía mensual fija o comisiones bajas
                  </span>
                </a>
              </div>

              {/* Stats Highlights */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/10 max-w-md mx-auto lg:mx-0">
                {LANDING_DATA.hero.stats.map((stat, idx) => (
                  <div key={idx} className="text-center lg:text-left">
                    <p className="text-2xl sm:text-3xl font-extrabold text-vial-orange tracking-tight">{stat.value}</p>
                    <p className="text-xs sm:text-sm font-semibold text-slate-300 mt-1 leading-snug">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Visual Column (Floating Premium WebDispatcher with Dynamic Map) */}
            <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center items-center w-full gap-4 relative z-20">
              
              {/* Dynamic Interactive Google Map Card */}
              <div className="w-full max-w-[480px] h-[220px] bg-slate-950 border border-slate-700/40 rounded-3xl overflow-hidden shadow-2xl relative">
                <GoogleInteractiveMap 
                  activeTrip={null}
                  trips={[]}
                  previewCoords={{ originCoords: pickupCoords, destinationCoords: dropoffCoords }}
                />
              </div>

              <div 
                id="web-dispatcher-card" 
                className="w-full max-w-[480px] bg-white/95 backdrop-blur-md border border-slate-200/50 rounded-3xl p-6 md:p-8 shadow-2xl text-tech-blue transition-all duration-500 hover:shadow-vial-orange/10"
              >
                {/* Badge Superior */}
                <div className="flex justify-between items-center mb-6 border-b border-slate-200/60 pb-4">
                  <div>
                    <span className="text-[10px] font-extrabold text-vial-orange uppercase tracking-widest bg-vial-orange/10 px-2.5 py-1 rounded-full">
                      {LANDING_DATA.dispatcher.badge}
                    </span>
                    <h3 className="text-xl font-black tracking-tight text-tech-blue mt-1.5">{LANDING_DATA.dispatcher.title}</h3>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-tech-blue text-white">
                    <Navigation className="h-5 w-5 rotate-45 text-vial-orange fill-vial-orange" />
                  </div>
                </div>

                {/* ---------------- PASO 1: FORMULARIO ---------------- */}
                {dispatcherStep === 1 && (
                  <form onSubmit={handleCalculateRate} className="space-y-4 animate-fadeIn">
                    {/* Toggle Switch Elegant (MU vs ARC) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Modalidad de Viaje</label>
                      <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/40">
                        <button
                          type="button"
                          onClick={() => setModality('MU')}
                          className={`py-2 px-3 rounded-xl text-xs font-extrabold tracking-tight transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                            modality === 'MU' 
                              ? 'bg-tech-blue text-white shadow-sm' 
                              : 'text-slate-500 hover:text-tech-blue'
                          }`}
                        >
                          <Zap className={`h-3.5 w-3.5 ${modality === 'MU' ? 'text-vial-orange fill-vial-orange' : ''}`} />
                          M. Urbana (Individual)
                        </button>
                        <button
                          type="button"
                          onClick={() => setModality('ARC')}
                          className={`py-2 px-3 rounded-xl text-xs font-extrabold tracking-tight transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                            modality === 'ARC' 
                              ? 'bg-tech-blue text-white shadow-sm' 
                              : 'text-slate-500 hover:text-tech-blue'
                          }`}
                        >
                          <UserCheck className={`h-3.5 w-3.5 ${modality === 'ARC' ? 'text-vial-orange fill-vial-orange' : ''}`} />
                          Auto Compartido (ARC)
                        </button>
                      </div>
                    </div>

                    {/* Inputs de Datos Personales */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide flex justify-between">
                          <span>{LANDING_DATA.dispatcher.passengerNameLabel}</span>
                          <span className="text-[10px] text-red-500 font-extrabold">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder={LANDING_DATA.dispatcher.passengerNamePlaceholder}
                          value={passengerName}
                          onChange={(e) => setPassengerName(e.target.value)}
                          className={`w-full px-3 py-2.5 rounded-xl text-sm font-semibold border bg-white focus:outline-none transition-all duration-200 ${
                            formErrors.name 
                              ? 'border-red-500 focus:ring-2 focus:ring-red-200' 
                              : 'border-slate-200 focus:border-vial-orange focus:ring-2 focus:ring-vial-orange/15'
                          }`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide flex justify-between">
                          <span>{LANDING_DATA.dispatcher.passengerPhoneLabel}</span>
                          <span className="text-[10px] text-red-500 font-extrabold">*</span>
                        </label>
                        <input
                          type="tel"
                          placeholder={LANDING_DATA.dispatcher.passengerPhonePlaceholder}
                          value={passengerPhone}
                          onChange={(e) => setPassengerPhone(e.target.value)}
                          className={`w-full px-3 py-2.5 rounded-xl text-sm font-semibold border bg-white focus:outline-none transition-all duration-200 ${
                            formErrors.phone 
                              ? 'border-red-500 focus:ring-2 focus:ring-red-200' 
                              : 'border-slate-200 focus:border-vial-orange focus:ring-2 focus:ring-vial-orange/15'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Ubicaciones (Origen y Destino) */}
                    <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/40">
                      <div className="space-y-1 relative">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide flex justify-between">
                          <span>{LANDING_DATA.dispatcher.pickupLabel}</span>
                          <span className="text-[10px] text-red-500 font-extrabold">*</span>
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3.5 top-[13px] h-4 w-4 text-vial-orange z-10" />
                          <GoogleAddressAutocomplete
                            value={pickupLocation}
                            onChange={setPickupLocation}
                            onSelect={(address, coords) => {
                              setPickupLocation(address);
                              setPickupCoords(coords);
                            }}
                            placeholder={LANDING_DATA.dispatcher.pickupPlaceholder}
                            className="pl-10"
                            error={formErrors.pickup}
                          />
                        </div>
                      </div>

                      <div className="space-y-1 relative">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide flex justify-between">
                          <span>{LANDING_DATA.dispatcher.dropoffLabel}</span>
                          <span className="text-[10px] text-red-500 font-extrabold">*</span>
                        </label>
                        <div className="relative">
                          <Navigation className="absolute left-3.5 top-[13px] h-4 w-4 text-tech-blue rotate-45 z-10" />
                          <GoogleAddressAutocomplete
                            value={dropoffLocation}
                            onChange={setDropoffLocation}
                            onSelect={(address, coords) => {
                              setDropoffLocation(address);
                              setDropoffCoords(coords);
                            }}
                            placeholder={LANDING_DATA.dispatcher.dropoffPlaceholder}
                            className="pl-10"
                            error={formErrors.dropoff}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Método de Pago Select */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                        {LANDING_DATA.dispatcher.paymentMethodLabel}
                      </label>
                      <div className="relative">
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 bg-white focus:border-vial-orange focus:ring-2 focus:ring-vial-orange/15 focus:outline-none appearance-none"
                        >
                          {LANDING_DATA.dispatcher.paymentMethods.map((method) => (
                            <option key={method.id} value={method.id}>
                              {method.label}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                          <ChevronRight className="h-4 w-4 rotate-90" />
                        </div>
                      </div>
                    </div>

                    {/* Botón de Envío */}
                    <button
                      type="submit"
                      className="w-full mt-2 inline-flex items-center justify-center rounded-2xl bg-vial-orange py-4 text-center text-sm font-extrabold text-white shadow-lg shadow-vial-orange/20 hover:bg-[#ff7b1a] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                    >
                      Calcular Tarifa
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  </form>
                )}

                {/* ---------------- PASO 2: SELECCIÓN DE VEHÍCULO / TARIFA ---------------- */}
                {dispatcherStep === 2 && (
                  <div className="space-y-5 animate-fadeIn">
                    {/* Resumen del Trayecto */}
                    <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200/50 pb-2">
                        <span>Resumen del Trayecto</span>
                        <span className="text-vial-orange">
                          {modality === 'MU' ? 'Movilidad Urbana' : 'Auto Rural Compartido'}
                        </span>
                      </div>
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-start gap-2.5">
                          <MapPin className="h-4 w-4 text-vial-orange shrink-0 mt-0.5" />
                          <p className="text-xs font-semibold text-slate-700 leading-tight">
                            <span className="font-extrabold text-slate-400">Origen:</span> {pickupLocation}
                          </p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <Navigation className="h-4 w-4 text-tech-blue rotate-45 shrink-0 mt-0.5" />
                          <p className="text-xs font-semibold text-slate-700 leading-tight">
                            <span className="font-extrabold text-slate-400">Destino:</span> {dropoffLocation}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-200/50 flex justify-between items-center text-[11px] font-bold text-slate-500">
                        <span>Pasajero: {passengerName}</span>
                        <span>Pago: {paymentMethod}</span>
                      </div>
                    </div>

                    <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">Vehículos Disponibles</h4>

                    {/* Lista de Tarjetas de Categorías de Vehículo */}
                    <div className="space-y-3">
                      {vehiclesList.map((vehicle) => {
                        const price = getCalculatedPriceForVehicle(vehicle);
                        const formattedPrice = formatCurrency(price);
                        
                        return (
                          <div 
                            key={vehicle.id}
                            className="group relative border border-slate-200 rounded-2xl p-4 bg-white hover:border-vial-orange hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                          >
                            <div className="flex justify-between items-start gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-extrabold text-sm text-tech-blue group-hover:text-vial-orange transition-colors">
                                    {vehicle.name}
                                  </h5>
                                  <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                    ETA: {vehicle.eta}
                                  </span>
                                </div>
                                <p className="text-[11px] font-semibold text-slate-500 leading-relaxed max-w-[240px]">
                                  {vehicle.description}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] font-extrabold text-slate-400 block uppercase">TARIFA EST.</span>
                                <span className="text-base sm:text-lg font-black text-vial-orange">{formattedPrice}</span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleSelectVehicle(vehicle)}
                              className="mt-3.5 w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-tech-blue py-2.5 text-xs font-bold text-white shadow hover:bg-vial-orange transition-all duration-200 cursor-pointer"
                            >
                              Pedir este viaje
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Disclaimer Legal Obligatorio */}
                    <p className="text-[10px] font-medium text-slate-400 leading-relaxed text-center px-2">
                      {LANDING_DATA.dispatcher.legalText}
                    </p>

                    {/* Botón Volver */}
                    <button
                      onClick={() => setDispatcherStep(1)}
                      className="w-full inline-flex items-center justify-center gap-1 text-xs font-bold text-slate-500 hover:text-tech-blue py-2 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Volver y Editar Datos
                    </button>
                  </div>
                )}

                {/* ---------------- PASO 3: CONFIRMACIÓN Y ENVÍO ---------------- */}
                {dispatcherStep === 3 && (
                  <div className="text-center py-6 space-y-6 animate-fadeIn">
                    {/* Check de Éxito Animado */}
                    <div className="flex justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-500 border border-emerald-200 shadow-inner">
                        <Check className="h-8 w-8 stroke-[3]" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xl font-black text-tech-blue tracking-tight">¡Viaje Solicitado con Éxito!</h4>
                      <p className="text-xs font-semibold text-slate-500 leading-relaxed max-w-sm mx-auto">
                        Te hemos enviado un WhatsApp con los datos del conductor y el vehículo. Si la pestaña no se abrió automáticamente, presiona el botón inferior.
                      </p>
                    </div>

                    {/* Resumen del Pedido Final */}
                    {selectedVehicle && (
                      <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 text-left max-w-sm mx-auto space-y-2">
                        <div className="flex justify-between text-xs font-extrabold text-slate-500 pb-2 border-b border-slate-200/50">
                          <span>Viaje Confirmado</span>
                          <span className="text-vial-orange">{calculatedPrice}</span>
                        </div>
                        <ul className="text-[11px] font-semibold text-slate-600 space-y-1 pt-1">
                          <li><span className="font-bold text-slate-400">Pasajero:</span> {passengerName}</li>
                          <li><span className="font-bold text-slate-400">Origen:</span> {pickupLocation}</li>
                          <li><span className="font-bold text-slate-400">Destino:</span> {dropoffLocation}</li>
                          <li><span className="font-bold text-slate-400">Categoría:</span> {selectedVehicle.name}</li>
                          <li><span className="font-bold text-slate-400">Método de Pago:</span> {paymentMethod}</li>
                        </ul>
                      </div>
                    )}

                    {/* Enlace Manual de WhatsApp */}
                    <div className="space-y-3 max-w-sm mx-auto pt-2">
                      <button
                        onClick={() => {
                          if (selectedVehicle) {
                            handleSelectVehicle(selectedVehicle);
                          }
                        }}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 py-3.5 text-sm font-extrabold text-white shadow-md hover:bg-emerald-500 hover:shadow-lg transition-all duration-200 cursor-pointer"
                      >
                        <Phone className="h-4 w-4 fill-white" />
                        Reabrir WhatsApp
                      </button>

                      <button
                        onClick={handleResetDispatcher}
                        className="w-full inline-flex items-center justify-center rounded-2xl border-2 border-slate-200 bg-transparent py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-tech-blue transition-all duration-200 cursor-pointer"
                      >
                        Pedir otro viaje
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ---------------- PASSENGER BENEFITS ---------------- */}
      <section id="passengers" className="py-20 bg-white px-4 md:px-8 border-t border-slate-100">
        <div className="mx-auto max-w-7xl">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-block rounded-full bg-vial-orange/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-vial-orange">
              {LANDING_DATA.passengers.badge}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-tech-blue">
              {LANDING_DATA.passengers.title}
            </h2>
            <p className="text-slate-600 font-medium text-lg">
              {LANDING_DATA.passengers.subtitle}
            </p>
          </div>

          {/* 3-Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {LANDING_DATA.passengers.benefits.map((benefit) => {
              // Obtener componente de icono
              const IconComponent = IconMap[benefit.icon as keyof typeof IconMap] || ShieldCheck;
              return (
                <div 
                  key={benefit.id} 
                  className="group relative rounded-3xl border border-slate-100 bg-slate-50/50 p-8 shadow-sm hover:bg-white hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-5">
                    {/* Icon Wrap */}
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-vial-orange/10 text-vial-orange ring-1 ring-vial-orange/20 shadow-sm group-hover:scale-110 group-hover:bg-vial-orange group-hover:text-white transition-all duration-300">
                      <IconComponent className="h-7 w-7" strokeWidth={2} />
                    </div>
                    
                    <h3 className="text-xl font-bold tracking-tight text-tech-blue">{benefit.title}</h3>
                    <p className="text-slate-600 font-medium text-sm leading-relaxed">{benefit.description}</p>
                  </div>
                  
                  {/* Subtle link arrow */}
                  <div className="mt-8 flex items-center gap-1.5 text-xs font-bold text-vial-orange opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Saber más <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ---------------- DRIVERS SECTION (MODELO HÍBRIDO) ---------------- */}
      <section id="drivers" className="py-20 px-4 md:px-8 bg-slate-50">
        <div className="mx-auto max-w-7xl">
          
          {/* Main Card Container */}
          <div className="relative rounded-[40px] bg-gradient-to-br from-tech-blue via-tech-blue to-slate-900 text-white shadow-2xl overflow-hidden p-8 sm:p-12 lg:p-16">
            {/* Light Effects */}
            <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-vial-orange/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-slate-700/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Column (Content & Benefits) */}
              <div className="lg:col-span-7 space-y-6">
                <span className="inline-block rounded-full bg-vial-orange px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-950 shadow-md">
                  {LANDING_DATA.drivers.badge}
                </span>
                
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                  {LANDING_DATA.drivers.title}
                </h2>
                
                <p className="text-slate-300 font-medium text-base sm:text-lg max-w-2xl leading-relaxed">
                  {LANDING_DATA.drivers.subtitle}
                </p>

                {/* Benefits List */}
                <div className="space-y-6 pt-4">
                  {LANDING_DATA.drivers.benefits.map((benefit, idx) => {
                    const DriverIcon = IconMap[benefit.icon as keyof typeof IconMap] || Award;
                    return (
                      <div key={idx} className="flex gap-4 items-start group">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-vial-orange border border-white/10 group-hover:bg-vial-orange group-hover:text-slate-950 transition-all duration-300 shadow-md">
                          <DriverIcon className="h-6 w-6" strokeWidth={2} />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white group-hover:text-vial-orange transition-colors">{benefit.title}</h4>
                          <p className="text-slate-300 font-medium text-sm leading-relaxed mt-1">{benefit.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* CTA Action Buttons Dual */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <a 
                    href={LANDING_DATA.drivers.ctaRegister.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center justify-center rounded-2xl bg-vial-orange px-8 py-4 text-center font-extrabold text-slate-950 shadow-lg shadow-vial-orange/30 hover:bg-[#ff7b1a] hover:shadow-xl hover:shadow-vial-orange/40 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 text-lg cursor-pointer"
                  >
                    {LANDING_DATA.drivers.ctaRegister.text}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform text-slate-950" />
                  </a>

                  <a 
                    href={LANDING_DATA.drivers.ctaInfo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center justify-center rounded-2xl border-2 border-white/30 bg-white/5 backdrop-blur-sm px-8 py-4 text-center font-extrabold text-white hover:bg-white hover:text-tech-blue hover:-translate-y-1 active:translate-y-0 transition-all duration-300 text-lg cursor-pointer"
                  >
                    {LANDING_DATA.drivers.ctaInfo.text}
                    <Phone className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  </a>
                </div>

              </div>

              {/* Right Column (Visual Financial Stats Panel) */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-md bg-white/10 border border-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                  <div className="flex justify-between items-center border-b border-white/15 pb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Esquemas Comparados (Semanal)</span>
                    <TrendingUp className="h-5 w-5 text-vial-orange animate-bounce" />
                  </div>

                  {/* Calculator visualizer */}
                  <div className="space-y-4">
                    {/* Esquema 1: Membresía */}
                    <div className="bg-slate-950/40 rounded-2xl p-4 border border-emerald-500/20 relative">
                      <span className="absolute top-2.5 right-3 text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Recomendado</span>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Esquema Membresía Fija</p>
                      <div className="flex justify-between items-baseline mt-1">
                        <h3 className="text-2xl font-extrabold text-white">$220,000 ARS</h3>
                        <span className="text-[10px] font-semibold text-emerald-400">Te quedas con el 100%</span>
                      </div>
                      <p className="text-[10px] font-medium text-slate-400 mt-1">Solo abonas tu cuota mensual de membresía plana.</p>
                    </div>

                    {/* Esquema 2: Comisión */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-950/20 rounded-xl p-3 border border-white/5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Esquema Comisión (15%)</p>
                        <p className="text-sm font-extrabold text-red-400 mt-0.5">-$33,000 ARS</p>
                        <p className="text-[9px] text-slate-500">Abonado por cada viaje</p>
                      </div>
                      <div className="bg-slate-950/20 rounded-xl p-3 border border-white/5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Tus Ganancias (85%)</p>
                        <p className="text-sm font-extrabold text-emerald-400 mt-0.5">+$187,000 ARS</p>
                        <p className="text-[9px] text-slate-500">Neto estimado</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress / Acceptance rate simulator */}
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-300">Tasa de Aceptación Requerida</span>
                      <span className="text-emerald-400">92% (Óptima)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }} />
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-950/20 p-2.5 rounded-lg border border-white/5 mt-4">
                      <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                      <span>Soporte telefónico local e IA 'Travis' incluidos 24/7</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ---------------- FAQ SECTION (PREGUNTAS FRECUENTES) ---------------- */}
      <section id="faq" className="py-20 bg-white px-4 md:px-8 border-b border-slate-100">
        <div className="mx-auto max-w-4xl">
          
          {/* Header */}
          <div className="text-center space-y-4 mb-16">
            <span className="inline-block rounded-full bg-tech-blue/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-tech-blue">
              AYUDA
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-tech-blue">
              {LANDING_DATA.faq.title}
            </h2>
            <p className="text-slate-600 font-medium text-lg max-w-2xl mx-auto">
              {LANDING_DATA.faq.subtitle}
            </p>
          </div>

          {/* Accordion List (Itera hasta 10 elementos) */}
          <div className="space-y-4">
            {LANDING_DATA.faq.items.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx} 
                  className={`rounded-2xl border transition-all duration-300 ${
                    isOpen ? 'border-vial-orange bg-slate-50/50 shadow-md scale-[1.01]' : 'border-slate-200/80 bg-white hover:border-slate-300'
                  }`}
                >
                  <button 
                    onClick={() => toggleFaq(idx)}
                    className="flex w-full items-center justify-between p-5 text-left focus:outline-none cursor-pointer"
                  >
                    <span className="text-base sm:text-lg font-bold text-tech-blue tracking-tight pr-4">
                      {item.question}
                    </span>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-tech-blue transition-transform duration-300 ${
                      isOpen ? 'rotate-185 bg-vial-orange text-white' : ''
                    }`}>
                      <ChevronRight className={`h-4 w-4 transform transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    </span>
                  </button>
                  
                  {/* Collapsible Answer */}
                  <div className={`overflow-hidden transition-all duration-500 ${
                    isOpen ? 'max-h-[300px] border-t border-slate-200/50' : 'max-h-0'
                  }`}>
                    <p className="p-5 text-slate-600 font-medium text-sm sm:text-base leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ---------------- FOOTER MINIMALISTA CORPORATIVO ---------------- */}
      <footer className="bg-slate-950 text-slate-400 py-16 px-4 md:px-8 relative overflow-hidden">
        {/* Ambient light decorations */}
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-vial-orange/5 blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 h-60 w-60 rounded-full bg-tech-blue/10 blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-4xl relative z-10 flex flex-col items-center gap-10 text-center">
          
          {/* Logo grande y centrado */}
          <img
            src="/assets/travelcab_blanco.svg"
            alt="TravelCab"
            className="h-24 w-auto opacity-90 mx-auto"
          />

          {/* Teléfono */}
          <div className="flex items-center justify-center gap-2.5 text-sm font-semibold text-slate-300">
            <Phone className="h-4 w-4 text-vial-orange flex-shrink-0" />
            <span>{LANDING_DATA.contact.phone}</span>
          </div>

          {/* Redes Sociales */}
          <div className="flex items-center justify-center gap-3">
            {/* Facebook */}
            <a
              href={LANDING_DATA.socials.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-vial-orange hover:text-slate-950 transition-all duration-200"
              aria-label="Facebook TravelCab"
            >
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
              </svg>
            </a>
            {/* Instagram */}
            <a
              href={LANDING_DATA.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-vial-orange hover:text-slate-950 transition-all duration-200"
              aria-label="Instagram TravelCab"
            >
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </a>
            {/* Facebook Messenger */}
            <a
              href={LANDING_DATA.socials.messenger}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-vial-orange hover:text-slate-950 transition-all duration-200"
              aria-label="Chat por Messenger"
            >
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.652V24l4.088-2.242c1.092.3 2.246.464 3.443.464C18.627 22.222 24 17.247 24 11.111 24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.26L19.752 8l-6.561 6.963z"/>
              </svg>
            </a>
            {/* WhatsApp Travis */}
            <a
              href={LANDING_DATA.contact.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-emerald-500 hover:text-white transition-all duration-200"
              aria-label="WhatsApp Travis"
            >
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
          </div>

          {/* Trabaja con Nosotros (Botón Fantasma Naranja Vial) */}
          <div className="pt-2">
            <a 
              href="/rrhh"
              className="inline-flex items-center gap-2 rounded-xl border border-vial-orange/40 text-vial-orange bg-transparent px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-vial-orange hover:text-slate-950 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 shadow-md cursor-pointer"
            >
              <Briefcase className="h-4 w-4" />
              Trabaja con Nosotros
            </a>
          </div>

          {/* Sellos de Confianza y Certificaciones (Discretos y sutiles) */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
            {/* Sello QR ARCA */}
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-900 bg-slate-950 px-4 py-2 hover:border-slate-800 transition-colors">
              <QrCode className="h-5 w-5 text-slate-500 hover:text-vial-orange transition-colors" />
              <div className="text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sello QR ARCA</span>
                <span className="text-[8px] text-slate-600 block">Constancia Oficial</span>
              </div>
            </div>
            {/* Registro Base de Datos */}
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-900 bg-slate-950 px-4 py-2 hover:border-slate-800 transition-colors">
              <Shield className="h-5 w-5 text-slate-500 hover:text-emerald-500 transition-colors" />
              <div className="text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Base de Datos</span>
                <span className="text-[8px] text-slate-600 block">Reg. N° 5882/B</span>
              </div>
            </div>
          </div>

          {/* Línea separadora */}
          <div className="w-full border-t border-slate-900" />

          {/* Copyright y links legales */}
          <div className="flex flex-col md:flex-row items-center justify-between w-full gap-4 text-xs font-semibold text-slate-500">
            <p className="text-center">{LANDING_DATA.footer.copyright}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
              {LANDING_DATA.footer.legalLinks.map((link, idx) => (
                <span key={idx} className="flex items-center gap-4">
                  {idx > 0 && <span className="text-slate-800 hidden sm:inline">•</span>}
                  <a href={link.url} className="hover:text-slate-300 transition-colors">
                    {link.text}
                  </a>
                </span>
              ))}
            </div>
          </div>

        </div>
      </footer>

      {/* -------- BOTÓN FLOTANTE TRAVIS (OMNICANAL) -------- */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 group">
        {/* Tooltip / Mini menú al hover */}
        <div className="flex flex-col items-end gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
          {/* Etiqueta de presentación */}
          <div className="bg-slate-900/95 backdrop-blur-sm text-white text-xs font-bold px-3.5 py-2 rounded-2xl shadow-xl border border-slate-700/50 flex items-center gap-2 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Travis está en línea
          </div>
          {/* WhatsApp */}
          <a
            href={`${LANDING_DATA.contact.whatsapp}?text=Hola%20Travis!%20Quiero%20saber%20m%C3%A1s%20sobre%20TravelCab.`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-lg transition-all duration-200 hover:-translate-y-0.5"
          >
            <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </a>
          {/* Messenger */}
          <a
            href={LANDING_DATA.socials.messenger}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 bg-[#0084FF] hover:bg-[#0073e6] text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-lg transition-all duration-200 hover:-translate-y-0.5"
          >
            <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.652V24l4.088-2.242c1.092.3 2.246.464 3.443.464C18.627 22.222 24 17.247 24 11.111 24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.26L19.752 8l-6.561 6.963z"/></svg>
            Messenger
          </a>
          {/* Instagram DM */}
          <a
            href={`https://ig.me/m/travelapp.ar`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-lg transition-all duration-200 hover:-translate-y-0.5"
          >
            <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            Instagram
          </a>
        </div>

        {/* Botón principal Travis */}
        <button
          className="flex items-center gap-3 bg-tech-blue hover:bg-vial-orange text-white font-extrabold text-sm px-5 py-3.5 rounded-2xl shadow-2xl shadow-tech-blue/30 hover:shadow-vial-orange/30 transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-white/10"
          aria-label="Hablar con Travis"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
          </span>
          Hablá con Travis
          <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </button>
      </div>

    </div>
  );
}
