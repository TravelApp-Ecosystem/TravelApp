"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Star,
  Globe,
  Users,
  Calendar,
  Shield,
  ChevronRight,
  Menu,
  X,
  MapPin,
  Heart,
  Compass,
  Camera,
  Phone,
  Award,
  ChevronLeft,
  DollarSign,
  Car,
  FileText,
  Clock,
  Sparkles,
  Bus,
  Plane,
  Ship,
  Hotel,
  Ticket,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  MessageCircle,
  Search,
  Check,
  Layers,
  Send,
  Cookie,
  Copy,
  Info,
  Tag,
  Play
} from "lucide-react";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TravisOmnichannelWidget } from "@/components/shared/TravisOmnichannelWidget";

export type SearchCategoryTab = 'paquetes' | 'vuelos' | 'hoteles' | 'buses' | 'civitatis' | 'travelcab';

const RenderLegalSeal = ({ content, alt }: { content?: string; alt: string }) => {
  if (!content) return null;
  const trimmed = content.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('<') || trimmed.includes('<script')) {
    return (
      <div 
        className="flex items-center justify-center min-h-[40px] max-h-16 overflow-hidden [&_img]:max-h-10 [&_img]:w-auto"
        dangerouslySetInnerHTML={{ __html: trimmed }} 
      />
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 hover:border-slate-700 transition-colors">
      <img src={trimmed} alt={alt} className="h-8 w-auto object-contain" />
      <span className="text-[9px] font-bold text-slate-400 uppercase">{alt}</span>
    </div>
  );
};

export const DEFAULT_EXPERIENCE_CMS_DATA = {
  header: {
    logo: "/assets/experience_blanco.svg",
    brand: "TravelApp",
    product: "Experience",
    phone: "+54 9 381 418-8106",
    phoneFormatted: "+54 9 381 418-8106",
    phoneCallUrl: "tel:+5493814188106",
    announcementText: "🔥 Preventa Turismo Receptivo Norte 2026: Reservá hoy en 12 Cuotas Fijas o con Time-to-Pay garantizado",
    announcementUrl: "/marketplace",
    loginUrl: "/login",
    registerUrl: "/login?mode=register"
  },
  promoPushPop: {
    enabled: true,
    badge: "🔥 OFERTA DE TEMPORADA",
    title: "¡Viví el Norte Argentino con 12 Cuotas Fijas!",
    subtitle: "Reservá tus excursiones y paquetes receptivos con 15% OFF extra en pagos por transferencia o congelá tu tarifa sin interés.",
    imageUrl: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1200&q=80",
    discountCode: "NORTE2026",
    ctaText: "Aprovechar Promoción",
    ctaUrl: "/marketplace",
    showCookiesConsent: true,
    cookiesText: "Utilizamos cookies para garantizar la mejor experiencia y procesar tus reservas de forma segura."
  },
  heroPromoBanner: {
    enabled: true,
    tag: "PROMO EXCLUSIVA",
    text: "🔥 12 Cuotas fijas sin interés en paquetes propios + Time-to-Pay garantizado",
    subtext: "Congelá tu tarifa hoy sin tarjeta de crédito y asegurá tu butaca"
  },
  heroSlides: [
    {
      title: "Turismo Receptivo en el Norte Argentino",
      subtitle: "SALTA, JUJUY, CAFAYATE & QUEBRADA DE HUMAHUACA",
      text: "Excursiones diarias en buses ejecutivos, guías matriculados, pensión completa y coordinación 24/7 en destino.",
      bgImage: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1920&q=80",
      videoUrl: "",
      ctaText: "Ver Excursiones Norte 2026",
      ctaUrl: "#excursiones"
    },
    {
      title: "Salinas Grandes, Purmamarca & Los Cardones",
      subtitle: "PAISAJES MÁGICOS Y CULTURA ANDINA",
      text: "Recorridos de día completo con traslados desde tu hotel, paradas fotográficas y la mejor tarifa garantizada.",
      bgImage: "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1920&q=80",
      videoUrl: "",
      ctaText: "Explorar Itinerarios",
      ctaUrl: "#excursiones"
    },
    {
      title: "Circuitos Mayoristas & Salidas Grupales",
      subtitle: "CONECTIVIDAD TOTAL CON TRASLADOS TRAVELCAB",
      text: "Combiná tus paquetes turísticos con traslados aeropuerto y sumá puntos canjeables en Club Rewards.",
      bgImage: "https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=1920&q=80",
      videoUrl: "",
      ctaText: "Cotizar Paquete Completo",
      ctaUrl: "/marketplace"
    }
  ],
  floatingBanners: [
    {
      icon: "DollarSign",
      badge: "FINANCIACIÓN",
      title: "12 Cuotas Fijas sin Interés",
      description: "Congelá el valor de tu viaje en pesos hoy mismo con Time-to-Pay garantizado.",
      ctaText: "Ver Medios de Pago",
      ctaUrl: "/marketplace"
    },
    {
      icon: "MapPin",
      badge: "RECEPTIVO OFICIAL",
      title: "Turismo Receptivo Norte",
      description: "Salidas diarias a Salinas, Cafayate, Cachi, Iruya y Quebrada con guías locales.",
      ctaText: "Ver Salidas",
      ctaUrl: "#excursiones"
    },
    {
      icon: "Car",
      badge: "CONECTIVIDAD",
      title: "Traslados In/Out con TravelCab",
      description: "Vehículos habilitados para transfers Aeropuerto ↔ Hotel ↔ Terminal sin esperas.",
      ctaText: "Cotizar Traslado",
      ctaUrl: "/landing/travelcab"
    },
    {
      icon: "Sparkles",
      badge: "CLUB REWARDS",
      title: "Sumá Puntos con tu Viaje",
      description: "Acumulá beneficios en cada excursión y canjealos por viajes o traslados gratis.",
      ctaText: "Conocer Rewards",
      ctaUrl: "/landing/rewards"
    }
  ],
  receptiveAbout: {
    tag: "QUIÉNES SOMOS",
    title: "Líderes en Turismo Receptivo y Experiencias en el Norte Argentino",
    description: "Somos una empresa de viajes y turismo habilitada oficialmente, especializada en diseñar itinerarios auténticos en el Norte Argentino. Nuestra flota moderna, equipo de coordinadores en destino y plataforma tecnológica aseguran una experiencia inolvidable de punta a punta.",
    points: [
      "Guías matriculados y especialistas en historia, geografía y cultura andina",
      "Unidades de transporte ejecutivas con seguro de viajero y seguimiento satelital",
      "Atención omnicanal 24/7 en destino con Travis IA y equipo humano de guardia",
      "Flexibilidad total de reserva con Time-to-Pay y cuotas fijas en pesos"
    ],
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80"
  },
  enabledSearchTabs: {
    paquetes: true,
    vuelos: false,
    hoteles: false,
    buses: false,
    civitatis: false,
    travelcab: true
  },
  metrics: [
    { number: "+15.000", label: "Pasajeros Transportados", icon: "Users" },
    { number: "98.5%", label: "Satisfacción & Reseñas 5★", icon: "Star" },
    { number: "24 / 7", label: "Coordinación & Soporte en Destino", icon: "Shield" },
    { number: "100%", label: "Salidas Garantizadas con Time-to-Pay", icon: "Clock" }
  ],
  testimonials: [
    {
      name: "Marta & Roberto González",
      location: "Córdoba Capital",
      comment: "Viajamos a Salta y Jujuy con TravelApp y la coordinación fue impecable. El micro súper cómodo, los guías atentos a cada detalle y los paisajes increíbles.",
      rating: 5,
      trip: "Salinas Grandes & Purmamarca",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
    },
    {
      name: "Carlos Silveira",
      location: "San Miguel de Tucumán",
      comment: "La reserva con Time-to-Pay me permitió congelar la tarifa con anticipación. La app móvil te da los horarios y datos del coordinador al instante.",
      rating: 5,
      trip: "Cafayate & Ruta del Vino",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
    },
    {
      name: "Valeria Benítez",
      location: "Buenos Aires",
      comment: "Excelente servicio de traslados desde el aeropuerto y la excursión a Cachi fue maravillosa. Además sumamos puntos Rewards para usar en TravelCab.",
      rating: 5,
      trip: "Cachi por Cuesta del Obispo",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80"
    }
  ],
  rewardsBlock: {
    title: "Viajá, Acumulá Puntos & Disfrutá Más",
    subtitle: "Cada excursión o paquete contratado en TravelApp Experience suma puntos en tu cuenta Club Rewards. Canjealos por traslados oficiales en TravelCab o descuentos en tus próximas vacaciones.",
    pointsText: "Obtené tarifas reducidas en todas nuestras salidas al registrarte gratis.",
    badgeText: "ECOSISTEMA CLUB REWARDS",
    imageUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80"
  },
  redesSociales: {
    facebook: "https://facebook.com/travelapp.ar",
    instagram: "https://instagram.com/travelapp.ar",
    messenger: "https://m.me/travelapp.ar",
    whatsapp: "https://wa.me/5493814188106"
  },
  sellosLegales: {
    arcaQr: "https://www.afip.gob.ar/images/f960/DATAWEB.jpg",
    baseDatosSello: ""
  },
  footer: {
    brandText: "TravelApp Experiences",
    copyrightText: "© 2026 TravelApp Experiences. Una marca oficial de TravelApp s.a.s. Todos los derechos reservados."
  }
};

export default function ExperienceLandingClient({ initialCms }: { initialCms?: any }) {
  const [cmsData, setCmsData] = useState<any>(initialCms ? { ...DEFAULT_EXPERIENCE_CMS_DATA, ...initialCms } : DEFAULT_EXPERIENCE_CMS_DATA);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [affiliateRef, setAffiliateRef] = useState<string>("");
  
  // Full-Screen Pushpop & Cookies Modal State
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  // Catálogo de Excursiones para el Carrusel Vertical
  const [featuredTrips, setFeaturedTrips] = useState<any[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Pestaña activa del Buscador Multiproducto
  const [searchTab, setSearchTab] = useState<SearchCategoryTab>('paquetes');

  // Inputs del Motor de Búsqueda
  const [searchDestination, setSearchDestination] = useState("");
  const [searchMonth, setSearchMonth] = useState("all");
  const [flightOrigin, setFlightOrigin] = useState("Buenos Aires (BUE)");
  const [flightDestination, setFlightDestination] = useState("Salta (SLA)");
  const [flightDate, setFlightDate] = useState("");
  const [hotelCity, setHotelCity] = useState("Salta");
  const [hotelCheckIn, setHotelCheckIn] = useState("");
  const [hotelGuests, setHotelGuests] = useState(2);
  const [busOrigin, setBusOrigin] = useState("San Miguel de Tucumán");
  const [busDestination, setBusDestination] = useState("Salta Capital");
  const [activityCity, setActivityCity] = useState("Purmamarca");
  const [cabPickup, setCabPickup] = useState("Aeropuerto de Salta (SLA)");
  const [cabDropoff, setCabDropoff] = useState("Hotel Centro Salta");

  // Capturar código de afiliado y verificar si se debe mostrar el Pop-up Fullscreen
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref") || params.get("afiliado") || params.get("promotor");
      if (ref) {
        setAffiliateRef(ref);
        localStorage.setItem("travelapp_affiliate_ref", ref);
      } else {
        const stored = localStorage.getItem("travelapp_affiliate_ref");
        if (stored) setAffiliateRef(stored);
      }

      // Comprobar si el usuario ya cerró el modal en esta sesión
      const dismissed = sessionStorage.getItem("travelapp_experience_modal_dismissed");
      if (!dismissed && cmsData.promoPushPop?.enabled !== false) {
        // Pequeño delay de 800ms para carga suave y elegante
        const timer = setTimeout(() => {
          setShowPromoModal(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [cmsData.promoPushPop?.enabled]);

  // Escuchar CMS en tiempo real desde Firestore
  useEffect(() => {
    const unsubCms = onSnapshot(doc(db, "cms", "landing_experience"), (snap) => {
      if (snap.exists()) {
        setCmsData({
          ...DEFAULT_EXPERIENCE_CMS_DATA,
          ...snap.data()
        });
      }
    });

    // Escuchar catálogo de experiencias (excursiones del Norte y paquetes)
    const unsubTrips = onSnapshot(collection(db, "experiences"), (snap) => {
      const list: any[] = [];
      snap.forEach((d) => {
        const data = d.data();
        let pType = data.productType || 'excursion_norte';
        if (data.title?.toLowerCase().includes('crucero') || data.transportation?.toLowerCase().includes('barco')) {
          pType = 'crucero';
        } else if (data.operatorProvider || data.isMayorista) {
          pType = 'operador_mayorista';
        } else if (data.isReceptive || data.location?.toLowerCase().includes('salta') || data.location?.toLowerCase().includes('jujuy')) {
          pType = 'receptivo_norte';
        }
        list.push({ id: d.id, ...data, productType: pType });
      });

      // Si no hay datos en Firestore, proveer excursiones por defecto de alta calidad del Norte
      if (list.length === 0) {
        list.push(
          {
            id: "salinas-purmamarca",
            title: "Salinas Grandes & Purmamarca por Cuesta de Lipán",
            location: "Jujuy, Argentina",
            duration: "Día Completo (12 hs)",
            rating: 4.9,
            reviewsCount: 142,
            price: 52000,
            currency: "ARS",
            priceRewards: 45000,
            pointsEarned: 520,
            tag: "Más Vendido",
            description: "Recorré la Quebrada de Humahuaca, Purmamarca con el Cerro de los Siete Colores y las imponentes Salinas Grandes.",
            imageUrl: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80",
            productType: "receptivo_norte"
          },
          {
            id: "cafayate-quebrada",
            title: "Cafayate por Quebrada de las Conchas & Bodegas",
            location: "Salta, Argentina",
            duration: "Día Completo (11 hs)",
            rating: 4.9,
            reviewsCount: 128,
            price: 48000,
            currency: "ARS",
            priceRewards: 41000,
            pointsEarned: 480,
            tag: "Ruta del Vino",
            description: "Formaciones geológicas milenarias como El Anfiteatro y Garganta del Diablo, culminando con cata de vinos Torrontés.",
            imageUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80",
            productType: "receptivo_norte"
          },
          {
            id: "cachi-cuesta-obispo",
            title: "Cachi por Cuesta del Obispo & Parque Los Cardones",
            location: "Valles Calchaquíes, Salta",
            duration: "Día Completo (12 hs)",
            rating: 4.8,
            reviewsCount: 96,
            price: 50000,
            currency: "ARS",
            priceRewards: 43000,
            pointsEarned: 500,
            tag: "Aventura & Altura",
            description: "Ascendé a más de 3.300 msnm por la mítica Cuesta del Obispo y descubrí la arquitectura colonial de Cachi.",
            imageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=800&q=80",
            productType: "receptivo_norte"
          },
          {
            id: "humahuaca-hornocal",
            title: "Quebrada de Humahuaca & Serranías del Hornocal (14 Colores)",
            location: "Jujuy, Argentina",
            duration: "Día Completo (13 hs)",
            rating: 5.0,
            reviewsCount: 180,
            price: 58000,
            currency: "ARS",
            priceRewards: 49500,
            pointsEarned: 580,
            tag: "Patrimonio UNESCO",
            description: "El mirador panorámico más impactante del Norte a 4.350 msnm con Tilcara, Uquía y la Pucará.",
            imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
            productType: "receptivo_norte"
          },
          {
            id: "city-tour-salta",
            title: "City Tour Histórico Salta la Linda & San Lorenzo",
            location: "Salta Capital",
            duration: "Medio Día (4 hs)",
            rating: 4.8,
            reviewsCount: 88,
            price: 24000,
            currency: "ARS",
            priceRewards: 20000,
            pointsEarned: 240,
            tag: "Cultura & Historia",
            description: "Catedral Basílica, Museo MAAM, Cabildo Histórico, Cerro San Bernardo y villa veraniega San Lorenzo.",
            imageUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80",
            productType: "receptivo_norte"
          }
        );
      }

      setFeaturedTrips(list);
      setLoadingTrips(false);
    });

    return () => {
      unsubCms();
      unsubTrips();
    };
  }, []);

  // Auto-avance del Slider Hero
  useEffect(() => {
    const slidesCount = cmsData.heroSlides?.length || 1;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slidesCount);
    }, 7000);
    return () => clearInterval(interval);
  }, [cmsData.heroSlides]);

  const activeSlide = cmsData.heroSlides?.[currentSlide] || cmsData.heroSlides?.[0];

  const formatPrice = (value: number, currency: string = "ARS") => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency === "USD" ? "USD" : "ARS",
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const handleCloseModal = () => {
    setShowPromoModal(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("travelapp_experience_modal_dismissed", "true");
    }
  };

  const handleCopyCoupon = (code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCoupon(true);
      setTimeout(() => setCopiedCoupon(false), 2500);
    }
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const offset = direction === 'left' ? -340 : 340;
      carouselRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handlePackageSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchDestination) params.set("q", searchDestination);
    if (affiliateRef) params.set("ref", affiliateRef);
    window.location.href = `/marketplace?${params.toString()}`;
  };

  const enabledTabs = cmsData.enabledSearchTabs || DEFAULT_EXPERIENCE_CMS_DATA.enabledSearchTabs;

  return (
    <div className="min-h-screen bg-slate-50 text-[#0A2A5B] font-['Quicksand',sans-serif] overflow-x-hidden selection:bg-[#FF4F5A] selection:text-white">

      {/* ========================================================================= */}
      {/* 0. MODAL FULL-SCREEN PUSHPOP DE ENTRADA (PROMO ESPECIAL + COOKIES)       */}
      {/* ========================================================================= */}
      {showPromoModal && cmsData.promoPushPop?.enabled !== false && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/20 flex flex-col md:flex-row transform transition-all animate-in zoom-in-95">
            
            {/* Botón Cerrar (X) */}
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute top-4 right-4 z-20 h-10 w-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-lg"
              title="Cerrar y continuar"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Mitad Izquierda: Imagen HD de la Promoción */}
            <div className="relative md:w-1/2 min-h-[220px] md:min-h-[460px] bg-slate-900 overflow-hidden">
              <img
                src={cmsData.promoPushPop?.imageUrl || "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1200&q=80"}
                alt={cmsData.promoPushPop?.title || "Promoción Especial Norte"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A2A5B] via-[#0A2A5B]/30 to-transparent"></div>
              
              <div className="absolute bottom-6 left-6 right-6 text-white space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF4F5A] text-white text-[11px] font-bold uppercase tracking-wider shadow-md">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{cmsData.promoPushPop?.badge || "🔥 OFERTA DE TEMPORADA"}</span>
                </div>
                <div className="text-xl font-bold tracking-tight drop-shadow-md">
                  Norte Argentino 2026
                </div>
                <p className="text-xs text-slate-200 font-medium">
                  Salidas grupales garantizadas con bus propio y guías locales.
                </p>
              </div>
            </div>

            {/* Mitad Derecha: Contenido de la Promo, Cupón y Cookies */}
            <div className="p-6 sm:p-8 md:w-1/2 flex flex-col justify-between space-y-6 bg-white text-[#0A2A5B]">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[#FF4F5A] uppercase tracking-widest">
                  <Sparkles className="h-4 w-4" />
                  <span>EXPERIENCIAS & RECEPTIVO</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0A2A5B] leading-tight">
                  {cmsData.promoPushPop?.title || "¡Viví el Norte Argentino con 12 Cuotas Fijas!"}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  {cmsData.promoPushPop?.subtitle || "Reservá tus excursiones y paquetes receptivos con 15% OFF extra en pagos por transferencia o congelá tu tarifa sin interés."}
                </p>

                {/* Cupón de Descuento si está configurado */}
                {cmsData.promoPushPop?.discountCode && (
                  <div className="bg-slate-50 border border-dashed border-[#FF4F5A]/40 rounded-2xl p-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">CÓDIGO DE CUPÓN</span>
                      <span className="text-base font-extrabold text-[#FF4F5A] tracking-wider">
                        {cmsData.promoPushPop.discountCode}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyCoupon(cmsData.promoPushPop.discountCode)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#0A2A5B] hover:bg-[#113875] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      {copiedCoupon ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" /> ¡Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> Copiar Código
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Botón Principal de Conversión */}
              <div className="space-y-4 pt-2">
                <a
                  href={cmsData.promoPushPop?.ctaUrl || "/marketplace"}
                  onClick={handleCloseModal}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#FF4F5A] hover:bg-[#e03e48] text-white font-bold text-sm text-center shadow-xl shadow-[#FF4F5A]/30 flex items-center justify-center gap-2 transition transform hover:scale-[1.02] cursor-pointer"
                >
                  <Ticket className="h-4 w-4" />
                  <span>{cmsData.promoPushPop?.ctaText || "Aprovechar Promoción"}</span>
                  <ArrowRight className="h-4 w-4" />
                </a>

                {/* Consentimiento Legal de Cookies Integrado */}
                {cmsData.promoPushPop?.showCookiesConsent !== false && (
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5 text-left">
                      <Cookie className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <span>{cmsData.promoPushPop?.cookiesText || "Utilizamos cookies para garantizar la mejor experiencia de navegación y reserva segura."}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="text-xs font-bold text-[#0A2A5B] hover:text-[#FF4F5A] underline whitespace-nowrap cursor-pointer"
                    >
                      Aceptar y Continuar
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOPBAR DE ANUNCIOS & PREVENTA                                         */}
      {/* ========================================================================= */}
      {cmsData.header?.announcementText && (
        <div className="bg-gradient-to-r from-[#0A2A5B] via-[#113875] to-[#0A2A5B] border-b border-white/10 text-white text-xs font-bold py-2.5 px-4 text-center tracking-wide flex items-center justify-center gap-2 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-[#E5A93B]" />
          <span>{cmsData.header.announcementText}</span>
          {affiliateRef && (
            <span className="hidden md:inline-block bg-[#FF4F5A] px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black tracking-wider text-white shadow-sm">
              Asesor: {affiliateRef}
            </span>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. HEADER NAVBAR CORPORATIVO TRAVELAPP EXPERIENCE                        */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-[#0A2A5B]/95 backdrop-blur-md border-b border-white/10 text-white shadow-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          
          {/* Logo TravelApp Experience */}
          <Link href="/landing/experience" className="flex items-center gap-2.5 cursor-pointer py-0.5">
            <img 
              src={cmsData.header?.logo || "/assets/experience_blanco.svg"} 
              alt="TravelApp Experience" 
              className="h-12 sm:h-14 md:h-16 w-auto object-contain transition-all duration-200" 
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/assets/experience_blanco.svg";
              }}
            />
          </Link>

          {/* Menú de Navegación Central */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-bold uppercase tracking-wider text-slate-200">
            <a href="#quienes-somos" className="hover:text-[#FF4F5A] transition-colors">
              Quiénes Somos
            </a>
            <a href="#excursiones" className="hover:text-[#FF4F5A] transition-colors">
              Excursiones
            </a>
            <Link href="/landing/travelcab" className="hover:text-[#FF5A19] transition-colors flex items-center gap-1.5">
              <Car className="h-3.5 w-3.5 text-[#FF5A19]" /> Traslados
            </Link>
            <a href="#paquetes" className="hover:text-[#FF4F5A] transition-colors">
              Paquetes
            </a>
            <Link href="/landing/rewards" className="hover:text-[#E5A93B] transition-colors flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-[#E5A93B]" /> Club Rewards
            </Link>
          </nav>

          {/* Zona de Teléfono y Accesos de Usuario */}
          <div className="hidden sm:flex items-center gap-3">
            
            {/* Teléfono / WhatsApp Directo */}
            <a
              href={cmsData.header?.phoneCallUrl || `tel:${cmsData.header?.phone || "+5493814188106"}`}
              className="hidden xl:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition border border-white/10"
              title="Llamar a atención comercial"
            >
              <Phone className="h-3.5 w-3.5 text-[#FF4F5A]" />
              <span>{cmsData.header?.phoneFormatted || cmsData.header?.phone || "+54 9 381 418-8106"}</span>
            </a>

            {/* Login & Registro */}
            <a
              href={cmsData.header?.loginUrl || "/login"}
              className="text-xs font-bold px-3.5 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition"
            >
              Ingresar
            </a>
            
            <a
              href={cmsData.header?.registerUrl || "/login?mode=register"}
              className="px-4 py-2 rounded-xl bg-[#FF4F5A] hover:bg-[#e03e48] text-white font-bold text-xs transition shadow-lg shadow-[#FF4F5A]/30 flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="h-3.5 w-3.5" /> Registrarme
            </a>
          </div>

          {/* Botón Hamburguesa Móvil */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Drawer de Menú Móvil */}
        {mobileOpen && (
          <div className="lg:hidden bg-[#0A2A5B] border-b border-white/10 px-6 py-4 space-y-3 animate-in slide-in-from-top text-white">
            <a href="#quienes-somos" onClick={() => setMobileOpen(false)} className="block text-xs font-bold text-slate-200 py-1.5 hover:text-[#FF4F5A]">
              Quiénes Somos
            </a>
            <a href="#excursiones" onClick={() => setMobileOpen(false)} className="block text-xs font-bold text-slate-200 py-1.5 hover:text-[#FF4F5A]">
              Excursiones Receptivas
            </a>
            <Link href="/landing/travelcab" onClick={() => setMobileOpen(false)} className="block text-xs font-bold text-[#FF5A19] py-1.5">
              🚕 Traslados TravelCab
            </Link>
            <a href="#paquetes" onClick={() => setMobileOpen(false)} className="block text-xs font-bold text-slate-200 py-1.5 hover:text-[#FF4F5A]">
              Paquetes &amp; Salidas
            </a>
            <Link href="/landing/rewards" onClick={() => setMobileOpen(false)} className="block text-xs font-bold text-[#E5A93B] py-1.5">
              ⭐ Club Rewards
            </Link>
            
            {/* Contacto Móvil */}
            <a 
              href={cmsData.header?.phoneCallUrl || `tel:${cmsData.header?.phone || "+5493814188106"}`}
              className="flex items-center gap-2 text-xs font-bold text-slate-200 py-2 border-t border-white/10"
            >
              <Phone className="h-4 w-4 text-[#FF4F5A]" /> {cmsData.header?.phoneFormatted || "+54 9 381 418-8106"}
            </a>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <a
                href={cmsData.header?.loginUrl || "/login"}
                onClick={() => setMobileOpen(false)}
                className="block text-center py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs"
              >
                Ingresar
              </a>
              <a
                href={cmsData.header?.registerUrl || "/login?mode=register"}
                onClick={() => setMobileOpen(false)}
                className="block text-center py-2.5 rounded-xl bg-[#FF4F5A] text-white font-bold text-xs shadow-md"
              >
                Registrarme
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 3. HERO SECTION HD (SLIDER / VIDEO LOOP + QUICKSAND DROP SHADOW)         */}
      {/* ========================================================================= */}
      <section className="relative min-h-[640px] lg:min-h-[720px] flex items-center justify-center overflow-hidden bg-[#0A2A5B]">
        
        {/* Fondo: Video Loop HD o Slider de Fotografías */}
        <div className="absolute inset-0 z-0">
          {activeSlide?.videoUrl ? (
            <video
              key={activeSlide.videoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover object-center"
            >
              <source src={activeSlide.videoUrl} type="video/mp4" />
            </video>
          ) : (
            <img
              src={activeSlide?.bgImage || "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1920&q=80"}
              alt={activeSlide?.title}
              className="w-full h-full object-cover object-center transition-all duration-1000 transform scale-100"
            />
          )}
          
          {/* Capa de contraste y gradiente para legibilidad óptima */}
          <div 
            className="absolute inset-0 bg-gradient-to-t from-[#0A2A5B] via-[#0A2A5B]/60 to-black/40"
            style={{ opacity: (activeSlide?.overlayOpacity ?? 75) / 100 }}
          />
        </div>

        {/* Contenido Central del Hero */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 text-center space-y-6">
          
          {/* Banner de Promo en el Hero */}
          {cmsData.heroPromoBanner?.enabled !== false && (
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#FF4F5A]/95 backdrop-blur-md text-white text-xs sm:text-sm font-bold border border-white/30 shadow-2xl mx-auto">
              <Sparkles className="h-4 w-4 text-[#E5A93B] flex-shrink-0" />
              <span>{cmsData.heroPromoBanner?.text || "🔥 12 Cuotas fijas sin interés en paquetes propios + Time-to-Pay"}</span>
            </div>
          )}

          {/* Titular en Quicksand con Drop Shadow Corporativo */}
          <div className="space-y-4 max-w-4xl mx-auto text-white">
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold text-[#FF4F5A] uppercase tracking-widest border border-white/20 shadow-lg">
              <Sparkles className="h-3.5 w-3.5 text-[#FF4F5A]" />
              <span>{activeSlide?.subtitle || "TURISMO RECEPTIVO OFICIAL EN EL NORTE"}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)]">
              {activeSlide?.title}
            </h1>

            <p className="text-sm sm:text-lg text-slate-100 max-w-2xl mx-auto leading-relaxed font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              {activeSlide?.text}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <a
                href={activeSlide?.ctaUrl || "#excursiones"}
                className="px-8 py-4 rounded-2xl bg-[#FF4F5A] hover:bg-[#e03e48] text-white font-bold text-xs sm:text-sm transition shadow-2xl shadow-[#FF4F5A]/50 flex items-center gap-2 transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>{activeSlide?.ctaText || "Ver Catálogo de Excursiones"}</span>
                <ArrowRight className="h-4 w-4" />
              </a>
              
              <a
                href="#quienes-somos"
                className="px-6 py-4 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm transition border border-white/30 backdrop-blur-md cursor-pointer"
              >
                Conocer Más
              </a>
            </div>
          </div>

          {/* Controles de Diapositivas */}
          <div className="flex justify-center items-center gap-2 pt-4">
            {cmsData.heroSlides?.map((_: any, idx: number) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                className={`h-2.5 rounded-full transition-all cursor-pointer ${
                  currentSlide === idx ? "w-8 bg-[#FF4F5A] shadow-lg" : "w-2.5 bg-white/60 hover:bg-white"
                }`}
                title={`Ver slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SECCIÓN 2: BANNERS FLOTANTES SUPERPUESTOS (OVERLAP PROMO CARDS)        */}
      {/* ========================================================================= */}
      <section className="relative z-30 -mt-12 sm:-mt-16 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {(cmsData.floatingBanners || DEFAULT_EXPERIENCE_CMS_DATA.floatingBanners).map((banner: any, idx: number) => {
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-[#0A2A5B]/10 text-[#0A2A5B] text-[10px] font-bold uppercase tracking-wider">
                      {banner.badge}
                    </span>
                    <div className="h-9 w-9 rounded-2xl bg-[#FF4F5A]/10 text-[#FF4F5A] flex items-center justify-center font-bold">
                      {idx === 0 && <DollarSign className="h-5 w-5" />}
                      {idx === 1 && <MapPin className="h-5 w-5" />}
                      {idx === 2 && <Car className="h-5 w-5" />}
                      {idx === 3 && <Sparkles className="h-5 w-5" />}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-[#0A2A5B] group-hover:text-[#FF4F5A] transition-colors leading-snug">
                    {banner.title}
                  </h3>

                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {banner.description}
                  </p>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100">
                  <a
                    href={banner.ctaUrl || "#"}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF4F5A] hover:text-[#e03e48] transition-colors"
                  >
                    <span>{banner.ctaText || "Ver más"}</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. CARRUSEL DE TARJETAS VERTICALES (75% IMAGEN HD / 25% BASE BLANCA)      */}
      {/* ========================================================================= */}
      <section id="excursiones" className="max-w-7xl mx-auto px-6 py-20 space-y-8">
        
        {/* Encabezado del Catálogo de Excursiones */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#FF4F5A] uppercase tracking-widest">
              <Compass className="h-4 w-4" />
              <span>CATÁLOGO RECEPTIVO 2026</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#0A2A5B] tracking-tight">
              Excursiones y Experiencias en el Norte
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl">
              Salidas diarias garantizadas con transporte ejecutivo, guías matriculados y reserva en cuotas fijas con Time-to-Pay.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Flechas de Navegación del Carrusel */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollCarousel('left')}
                className="h-11 w-11 rounded-2xl bg-white shadow-md border border-slate-200 text-[#0A2A5B] hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
                title="Anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel('right')}
                className="h-11 w-11 rounded-2xl bg-white shadow-md border border-slate-200 text-[#0A2A5B] hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
                title="Siguiente"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <Link
              href={affiliateRef ? `/marketplace?ref=${affiliateRef}` : "/marketplace"}
              className="text-xs font-bold px-5 py-3 bg-[#FF4F5A] hover:bg-[#e03e48] text-white rounded-2xl shadow-lg shadow-[#FF4F5A]/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Ver Todo el Catálogo</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Carrusel Horizontal de Tarjetas Verticales (75% Foto / 25% Base Blanca) */}
        {loadingTrips ? (
          <div className="py-20 text-center">
            <div className="h-9 w-9 border-4 border-[#FF4F5A] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-slate-400 mt-3">Cargando excursiones oficiales...</p>
          </div>
        ) : (
          <div
            ref={carouselRef}
            className="flex gap-6 overflow-x-auto scroll-smooth pb-8 pt-2 snap-x no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {featuredTrips.map((trip) => {
              return (
                <div
                  key={trip.id}
                  className="min-w-[280px] sm:min-w-[320px] max-w-[320px] flex-shrink-0 snap-start bg-white rounded-3xl border border-slate-200/90 shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col justify-between group cursor-pointer"
                >
                  
                  {/* 75% Superior: Fotografía HD Vertical con Badges Flotantes */}
                  <div className="relative h-72 sm:h-80 bg-slate-900 overflow-hidden">
                    <img
                      src={trip.imageUrl || "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80"}
                      alt={trip.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />

                    {/* Gradiente sutil inferior sobre la imagen */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                    {/* Badge Superior Izquierdo: Etiqueta Promocional */}
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 rounded-full bg-[#FF4F5A] text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                        {trip.tag || "Salida Diaria"}
                      </span>
                    </div>

                    {/* Badge Superior Derecho: Duración */}
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[10px] font-bold flex items-center gap-1 shadow-md">
                      <Clock className="h-3 w-3 text-[#E5A93B]" />
                      <span>{trip.duration || "Día Completo"}</span>
                    </div>

                    {/* Texto sobre la base de la imagen: Ubicación & Rating */}
                    <div className="absolute bottom-3 left-4 right-4 text-white space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 font-bold text-slate-200 text-[11px]">
                          <MapPin className="h-3.5 w-3.5 text-[#FF4F5A]" />
                          <span>{trip.location || "Salta / Jujuy"}</span>
                        </span>
                        
                        <span className="flex items-center gap-1 bg-[#0A2A5B]/80 px-2 py-0.5 rounded-lg text-[11px] font-bold text-[#E5A93B]">
                          <Star className="h-3 w-3 fill-[#E5A93B]" />
                          <span>{trip.rating || 4.9}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 25% Inferior: Ficha Blanca con Resumen, Precio y Botones de Acción */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3 bg-white">
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-bold text-[#0A2A5B] leading-snug group-hover:text-[#FF4F5A] transition-colors line-clamp-2">
                        {trip.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">
                        {trip.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      
                      {/* Precios y Puntos Club Rewards */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Desde</span>
                          <span className="text-base font-extrabold text-[#0A2A5B]">
                            {formatPrice(trip.price, trip.currency)}
                          </span>
                        </div>
                        {trip.pointsEarned && (
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-[#E5A93B] block">
                              +{trip.pointsEarned} pts
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold block">
                              Club Rewards
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Botones de Acción (Ver Más y Reservar) */}
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          href={affiliateRef ? `/marketplace?ref=${affiliateRef}&q=${encodeURIComponent(trip.title)}` : `/marketplace?q=${encodeURIComponent(trip.title)}`}
                          className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0A2A5B] text-xs font-bold text-center transition"
                        >
                          Ver Detalle
                        </Link>
                        
                        <a
                          href={`https://wa.me/5493814188106?text=Hola!%20Quiero%20reservar%20la%20excursión:%20${encodeURIComponent(trip.title)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="py-2.5 px-3 rounded-xl bg-[#FF4F5A] hover:bg-[#e03e48] text-white text-xs font-bold text-center transition shadow-md shadow-[#FF4F5A]/20"
                        >
                          Reservar
                        </a>
                      </div>

                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 6. MOTOR DE BÚSQUEDA MULTIPRODUCTO                                       */}
      {/* ========================================================================= */}
      <section id="paquetes" className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-5 sm:p-8 space-y-6">
          
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs font-bold text-[#FF4F5A] uppercase tracking-widest block">BUSCADOR INTEGRADO</span>
            <h3 className="text-xl sm:text-2xl font-bold text-[#0A2A5B] tracking-tight">
              Encontrá tu Excursión, Paquete o Traslado
            </h3>
          </div>

          {/* Pestañas de Servicios */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100 text-xs font-bold uppercase tracking-wider">
            {enabledTabs.paquetes !== false && (
              <button
                type="button"
                onClick={() => setSearchTab('paquetes')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition whitespace-nowrap cursor-pointer ${
                  searchTab === 'paquetes' ? "bg-[#0A2A5B] text-white shadow-md" : "text-slate-500 hover:text-[#0A2A5B] hover:bg-slate-100"
                }`}
              >
                <Compass className="h-4 w-4 text-[#FF4F5A]" /> 🚍 Salidas &amp; Paquetes
              </button>
            )}

            {enabledTabs.travelcab !== false && (
              <button
                type="button"
                onClick={() => setSearchTab('travelcab')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition whitespace-nowrap cursor-pointer ${
                  searchTab === 'travelcab' ? "bg-[#0A2A5B] text-white shadow-md" : "text-slate-500 hover:text-[#0A2A5B] hover:bg-slate-100"
                }`}
              >
                <Car className="h-4 w-4 text-[#FF5A19]" /> 🚕 Traslados TravelCab
              </button>
            )}

            {enabledTabs.hoteles && (
              <button
                type="button"
                onClick={() => setSearchTab('hoteles')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition whitespace-nowrap cursor-pointer ${
                  searchTab === 'hoteles' ? "bg-[#0A2A5B] text-white shadow-md" : "text-slate-500 hover:text-[#0A2A5B] hover:bg-slate-100"
                }`}
              >
                <Hotel className="h-4 w-4 text-[#FF4F5A]" /> 🏨 Hoteles
              </button>
            )}
          </div>

          {/* Formulario Paquetes y Salidas */}
          {searchTab === 'paquetes' && (
            <form onSubmit={handlePackageSearch} className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="sm:col-span-2 space-y-1.5">
                <span className="font-bold text-slate-700 block">¿Qué destino o excursión buscás?</span>
                <div className="flex items-center bg-slate-50 rounded-2xl border border-slate-200 px-3.5 py-3 focus-within:border-[#FF4F5A] focus-within:ring-2 focus-within:ring-[#FF4F5A]/20 transition-all">
                  <MapPin className="h-4 w-4 text-[#FF4F5A] mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchDestination}
                    onChange={(e) => setSearchDestination(e.target.value)}
                    placeholder="Ej: Salinas Grandes, Cafayate, Cachi, Humahuaca..."
                    className="w-full bg-transparent font-bold text-[#0A2A5B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 block">Temporada / Fecha</span>
                <select
                  value={searchMonth}
                  onChange={(e) => setSearchMonth(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl border border-slate-200 px-3.5 py-3.5 font-bold text-[#0A2A5B] focus:outline-none focus:border-[#FF4F5A] transition-all"
                >
                  <option value="all">Todas las fechas</option>
                  <option value="verano">Temporada 2026</option>
                  <option value="semana-santa">Semana Santa</option>
                  <option value="invierno">Vacaciones de Invierno</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#FF4F5A] hover:bg-[#e03e48] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#FF4F5A]/30 transition transform hover:scale-[1.02] cursor-pointer"
                >
                  <Search className="h-4 w-4" /> Buscar Experiencias
                </button>
              </div>
            </form>
          )}

          {/* Formulario Traslados TravelCab */}
          {searchTab === 'travelcab' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 block">Origen / Aeropuerto</span>
                <input
                  type="text"
                  value={cabPickup}
                  onChange={(e) => setCabPickup(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl border border-slate-200 px-3.5 py-3 font-bold text-[#0A2A5B]"
                />
              </div>
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 block">Destino / Hotel</span>
                <input
                  type="text"
                  value={cabDropoff}
                  onChange={(e) => setCabDropoff(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl border border-slate-200 px-3.5 py-3 font-bold text-[#0A2A5B]"
                />
              </div>
              <div className="flex items-end">
                <Link
                  href="/landing/travelcab"
                  className="w-full py-3.5 bg-[#FF5A19] hover:bg-[#e04e14] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#FF5A19]/30 transition cursor-pointer"
                >
                  <Car className="h-4 w-4 text-white" /> Cotizar con TravelCab
                </Link>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. QUIÉNES SOMOS / RECEPTIVO NORTE INSTITUCIONAL                          */}
      {/* ========================================================================= */}
      <section id="quienes-somos" className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0A2A5B]/10 text-[#0A2A5B] text-xs font-bold uppercase tracking-wider">
              <Award className="h-3.5 w-3.5 text-[#FF4F5A]" />
              <span>{cmsData.receptiveAbout?.tag || "QUIÉNES SOMOS"}</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-bold text-[#0A2A5B] tracking-tight leading-tight">
              {cmsData.receptiveAbout?.title || "Líderes en Turismo Receptivo y Experiencias en el Norte Argentino"}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              {cmsData.receptiveAbout?.description}
            </p>

            <div className="space-y-3">
              {(cmsData.receptiveAbout?.points || DEFAULT_EXPERIENCE_CMS_DATA.receptiveAbout.points).map((pt: string, i: number) => (
                <div key={i} className="flex items-start gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs font-bold text-slate-700">{pt}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex flex-wrap gap-4">
              <a
                href={cmsData.redesSociales?.whatsapp || "https://wa.me/5493814188106"}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3.5 rounded-2xl bg-[#0A2A5B] hover:bg-[#113875] text-white font-bold text-xs transition shadow-lg flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4 text-[#FF4F5A]" /> Asesoramiento Personalizado
              </a>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
            <img
              src={cmsData.receptiveAbout?.image || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80"}
              alt="Turismo Receptivo Norte"
              className="w-full h-[450px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A2A5B] via-transparent to-transparent"></div>
            
            <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
              <span className="text-[10px] font-bold text-[#E5A93B] uppercase tracking-wider block">SEGURIDAD &amp; CALIDAD</span>
              <div className="text-lg font-bold">Unidades Ejecutivas Propias</div>
              <p className="text-xs text-slate-200">Coordinación 24/7 y choferes profesionales en cada recorrido.</p>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. MÉTRICAS DE CONFIANZA                                                 */}
      {/* ========================================================================= */}
      <section className="bg-slate-100/80 border-y border-slate-200 py-14 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {(cmsData.metrics || DEFAULT_EXPERIENCE_CMS_DATA.metrics).map((m: any, idx: number) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm text-center space-y-2 hover:border-[#FF4F5A]/30 transition-colors"
            >
              <span className="text-2xl sm:text-4xl font-bold text-[#0A2A5B] block tracking-tight">
                {m.number}
              </span>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {m.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. TESTIMONIOS REALES DE VIAJEROS                                         */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-6 py-20 space-y-12">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-[#FF4F5A] uppercase tracking-widest block">RESEÑAS VERIFICADAS</span>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#0A2A5B] tracking-tight">Lo que Dicen Nuestros Pasajeros</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(cmsData.testimonials || DEFAULT_EXPERIENCE_CMS_DATA.testimonials).map((t: any, i: number) => (
            <div
              key={i}
              className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-xl transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-[#E5A93B]">
                  {Array.from({ length: t.rating || 5 }).map((_, si) => (
                    <Star key={si} className="h-4 w-4 fill-[#E5A93B]" />
                  ))}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic font-medium">
                  "{t.comment}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full object-cover border border-slate-200" />
                <div>
                  <div className="font-bold text-xs text-[#0A2A5B]">{t.name}</div>
                  <div className="text-[10px] text-slate-400 font-bold">{t.location} · {t.trip}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. CLUB REWARDS & ECOSISTEMA                                             */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-br from-[#0A2A5B] via-[#0F356E] to-[#0A2A5B] rounded-3xl text-white p-8 sm:p-12 border border-white/10 shadow-2xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <span className="px-3.5 py-1 rounded-full bg-[#E5A93B]/20 border border-[#E5A93B]/40 text-[#E5A93B] text-xs font-bold uppercase tracking-wider">
              {cmsData.rewardsBlock?.badgeText || "ECOSISTEMA CLUB REWARDS"}
            </span>

            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight leading-tight text-white">
              {cmsData.rewardsBlock?.title || "Viajá, Acumulá Puntos & Disfrutá Más"}
            </h2>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
              {cmsData.rewardsBlock?.subtitle}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
                <Car className="h-5 w-5 text-[#FF5A19] flex-shrink-0" />
                <span>Canjeable por traslados oficiales en <strong>TravelCab</strong></span>
              </div>
              <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
                <Ticket className="h-5 w-5 text-[#E5A93B] flex-shrink-0" />
                <span>Descuentos en cuotas de tus próximas vacaciones</span>
              </div>
            </div>

            <Link
              href="/landing/rewards"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#E5A93B] hover:bg-[#d4982e] text-[#0A2A5B] font-bold text-xs transition shadow-lg shadow-[#E5A93B]/20 cursor-pointer"
            >
              Conocer Beneficios Club Rewards <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            <img
              src={cmsData.rewardsBlock?.imageUrl || "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80"}
              alt="Club Rewards"
              className="w-full h-80 object-cover"
            />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. FOOTER INSTITUCIONAL OFICIAL (CON QR DE ARCA)                         */}
      {/* ========================================================================= */}
      <footer className="bg-[#0A2A5B] text-white border-t border-white/10 pt-16 pb-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-white/10 text-xs">
          
          {/* Columna 1: Marca & Resumen */}
          <div className="space-y-4">
            <Link href="/landing/experience" className="inline-block">
              <img 
                src={cmsData.header?.logo || "/assets/experience_blanco.svg"} 
                alt="TravelApp Experiences" 
                className="h-12 sm:h-14 w-auto object-contain" 
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/assets/experience_blanco.svg";
                }}
              />
            </Link>
            <p className="text-slate-300 leading-relaxed font-medium">
              Especialistas en turismo receptivo en el Norte Argentino, salidas grupales y experiencias curadas por todo el país.
            </p>
            <div className="flex items-center gap-3 text-slate-300 font-bold">
              <a href={cmsData.redesSociales?.facebook} target="_blank" rel="noreferrer" className="hover:text-white transition">Facebook</a>
              <a href={cmsData.redesSociales?.instagram} target="_blank" rel="noreferrer" className="hover:text-white transition">Instagram</a>
              <a href={cmsData.redesSociales?.whatsapp} target="_blank" rel="noreferrer" className="hover:text-white transition">WhatsApp</a>
            </div>
          </div>

          {/* Columna 2: Enlaces Rápidos */}
          <div className="space-y-3">
            <span className="font-bold text-white uppercase tracking-wider block">Explorar</span>
            <ul className="space-y-2 text-slate-300 font-medium">
              <li><a href="#excursiones" className="hover:text-[#FF4F5A] transition">Excursiones Receptivas</a></li>
              <li><a href="#paquetes" className="hover:text-[#FF4F5A] transition">Paquetes &amp; Salidas</a></li>
              <li><Link href="/landing/travelcab" className="hover:text-[#FF5A19] transition">Traslados TravelCab</Link></li>
              <li><Link href="/landing/rewards" className="hover:text-[#E5A93B] transition">Club Rewards</Link></li>
              <li><Link href="/afiliados" className="hover:text-[#FF4F5A] transition">Red de Afiliados</Link></li>
            </ul>
          </div>

          {/* Columna 3: Contacto & Sucursales */}
          <div className="space-y-3">
            <span className="font-bold text-white uppercase tracking-wider block">Atención al Pasajero</span>
            <ul className="space-y-2 text-slate-300 font-medium">
              <li>Casa Central: San Miguel de Tucumán</li>
              <li>WhatsApp Comercial: {cmsData.header?.phoneFormatted || "+54 9 381 418-8106"}</li>
              <li>Horario: Lunes a Sábados 09:00 a 20:00 hs</li>
              <li>Guardia de Coordinación: 24/7 en viaje</li>
            </ul>
          </div>

          {/* Columna 4: Seguridad & QR ARCA / AFIP */}
          <div className="space-y-3">
            <span className="font-bold text-white uppercase tracking-wider block">Seguridad &amp; Fiscal</span>
            <div className="space-y-3 text-slate-300 text-[11px] font-medium">
              <p>Agencia Oficial Habilitada por Ministerio de Turismo y Deportes de la Nación.</p>
              
              <div className="pt-1">
                <RenderLegalSeal
                  content={cmsData.sellosLegales?.arcaQr || "https://www.afip.gob.ar/images/f960/DATAWEB.jpg"}
                  alt="ARCA / AFIP Data Fiscal"
                />
              </div>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-8 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-400 font-medium">
          <p>{cmsData.footer?.copyrightText || "© 2026 TravelApp Experiences. Una marca de TravelApp s.a.s."}</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition">Términos y Condiciones</a>
            <a href="#" className="hover:text-white transition">Políticas de Cancelación</a>
            <a href="#" className="hover:text-white transition">Privacidad de Datos</a>
          </div>
        </div>
      </footer>

      {/* Travis Omnichannel Live Chat */}
      <TravisOmnichannelWidget
        businessUnit="Experiences"
        primaryColor="#FF4F5A"
        brandName="TravelApp Experiences"
        whatsappUrl={cmsData.redesSociales?.whatsapp || "https://wa.me/5493814188106"}
        instagramUrl={cmsData.redesSociales?.instagram || "https://instagram.com/travelapp.ar"}
      />
    </div>
  );
}
