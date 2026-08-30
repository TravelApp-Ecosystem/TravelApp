"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Send
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

const DEFAULT_EXPERIENCE_CMS_DATA = {
  header: {
    logo: "/assets/travelapp_logo.svg",
    brand: "TravelApp",
    product: "Experiences",
    announcementText: "🔥 Preventa Temporada 2026: Reservá hoy en cuotas fijas o con Time-to-Pay garantizado",
    announcementUrl: "/marketplace",
    ctaText: "Explorar Catálogo",
    ctaUrl: "/marketplace",
    loginUrl: "/login"
  },
  heroPromoBanner: {
    enabled: true,
    tag: "PROMO EXCLUSIVA",
    text: "🔥 12 Cuotas fijas sin interés en paquetes propios + Time-to-Pay garantizado",
    subtext: "Congelá tu tarifa hoy sin tarjeta de crédito y asegurá tu butaca"
  },
  enabledSearchTabs: {
    paquetes: true,
    vuelos: false,
    hoteles: false,
    buses: false,
    civitatis: false,
    travelcab: true
  },
  heroSlides: [
    {
      title: "Viví Argentina y el Mundo con Calidad Premium",
      subtitle: "Salidas Grupales con Bus Propio, Cruceros & Circuitos Internacionales",
      text: "Recorridos acompañados por coordinadores 24/7, hoteles seleccionados y la mejor tarifa garantizada.",
      bgImage: "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1920&q=80",
      ctaText: "Ver Salidas 2026",
      ctaUrl: "/marketplace"
    },
    {
      title: "Norte Argentino & Paisajes Mágicos",
      subtitle: "Salta, Jujuy, Cafayate & Quebrada de Humahuaca",
      text: "Transporte cama ejecutivo, pensión completa y excursiones exclusivas.",
      bgImage: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1920&q=80",
      ctaText: "Descubrir Itinerario",
      ctaUrl: "/marketplace"
    },
    {
      title: "Cruceros & Travesías Internacionales",
      subtitle: "Brasil, Caribe y Mediterráneo All Inclusive",
      text: "Cabinas con balcón, gastronomía de primer nivel y espectáculos a bordo.",
      bgImage: "https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=1920&q=80",
      ctaText: "Cotizar Crucero",
      ctaUrl: "/marketplace"
    }
  ],
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
      comment: "Viajamos al Norte con TravelApp y la coordinación fue impecable. El micro súper cómodo y los hoteles de primer nivel. ¡Ya señamos para las Cataratas!",
      rating: 5,
      trip: "Norte Argentino Fascinante",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
    },
    {
      name: "Carlos Silveira",
      location: "San Miguel de Tucumán",
      comment: "La reserva con Time-to-Pay me permitió congelar el viaje mientras coordinaba con mi familia. Muy transparente y la App móvil te acompaña todo el recorrido.",
      rating: 5,
      trip: "Mendoza & Ruta del Vino",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
    },
    {
      name: "Valeria Benítez",
      location: "Buenos Aires",
      comment: "El crucero por Brasil superó todas las expectativas. Atención personalizada desde el primer día y nos sumó puntos Club Rewards para usar en TravelCab.",
      rating: 5,
      trip: "Crucero MSC Brasil & Ilhabela",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80"
    }
  ],
  rewardsBlock: {
    title: "Viajá, Acumulá Puntos & Disfrutá Más",
    subtitle: "Cada viaje con TravelApp Experience suma puntos en tu cuenta Club Rewards. Canjealos por traslados gratuitos con TravelCab o descuentos en tus próximas vacaciones.",
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

  // Catálogo de Viajes para el Carrusel Horizontal (Hasta 15 Viajes Propios + Mayoristas)
  const [featuredTrips, setFeaturedTrips] = useState<any[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Pestaña activa del Buscador Multiproducto
  const [searchTab, setSearchTab] = useState<SearchCategoryTab>('paquetes');

  // Inputs del Motor de Búsqueda
  const [searchDestination, setSearchDestination] = useState("");
  const [searchMonth, setSearchMonth] = useState("all");
  
  // Inputs Vuelos (Basset API ready)
  const [flightOrigin, setFlightOrigin] = useState("Buenos Aires (BUE)");
  const [flightDestination, setFlightDestination] = useState("Salta (SLA)");
  const [flightDate, setFlightDate] = useState("");

  // Inputs Hoteles (Basset Bedbanks ready)
  const [hotelCity, setHotelCity] = useState("Bariloche");
  const [hotelCheckIn, setHotelCheckIn] = useState("");
  const [hotelGuests, setHotelGuests] = useState(2);

  // Inputs Buses (Unibus ready)
  const [busOrigin, setBusOrigin] = useState("Retiro, CABA");
  const [busDestination, setBusDestination] = useState("Mar del Plata");

  // Inputs Civitatis & TravelCab
  const [activityCity, setActivityCity] = useState("Mendoza");
  const [cabPickup, setCabPickup] = useState("Aeropuerto Tucumán");
  const [cabDropoff, setCabDropoff] = useState("Hotel Sheraton Tucumán");

  // Capturar código de afiliado en la URL
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
    }
  }, []);

  // Escuchar CMS en tiempo real
  useEffect(() => {
    const unsubCms = onSnapshot(doc(db, "cms", "landing_experience"), (snap) => {
      if (snap.exists()) {
        setCmsData({
          ...DEFAULT_EXPERIENCE_CMS_DATA,
          ...snap.data()
        });
      }
    });

    // Escuchar catálogo de experiencias (mostrar viajes propios y de operadores)
    const unsubTrips = onSnapshot(collection(db, "experiences"), (snap) => {
      const list: any[] = [];
      snap.forEach((d) => {
        const data = d.data();
        let pType = data.productType || 'salida_propia';
        if (data.title?.toLowerCase().includes('crucero') || data.transportation?.toLowerCase().includes('barco')) {
          pType = 'crucero';
        } else if (data.operatorProvider || data.isMayorista) {
          pType = 'operador_mayorista';
        }
        list.push({ id: d.id, ...data, productType: pType });
      });
      setFeaturedTrips(list);
      setLoadingTrips(false);
    });

    return () => {
      unsubCms();
      unsubTrips();
    };
  }, []);

  // Auto-avance del Slider
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

  // Helper Scroll Carrusel
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const offset = direction === 'left' ? -380 : 380;
      carouselRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Helper para buscar paquetes
  const handlePackageSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchDestination) params.set("q", searchDestination);
    if (affiliateRef) params.set("ref", affiliateRef);
    window.location.href = `/marketplace?${params.toString()}`;
  };

  // Módulos habilitados en el buscador
  const enabledTabs = cmsData.enabledSearchTabs || DEFAULT_EXPERIENCE_CMS_DATA.enabledSearchTabs;

  return (
    <div className="min-h-screen bg-slate-50 text-[#0A2A5B] font-sans overflow-x-hidden selection:bg-[#FF4F5A] selection:text-white">
      
      {/* 1. TOPBAR DE ANUNCIOS & PROMOS */}
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

      {/* 2. NAVBAR GLASSMORFICO (AZUL CORPORATIVO #0A2A5B) */}
      <header className="sticky top-0 z-50 bg-[#0A2A5B]/95 backdrop-blur-md border-b border-white/10 text-white shadow-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/assets/travelapp_blanco.svg" alt="TravelApp" className="h-8 sm:h-9 w-auto object-contain" />
          </Link>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-bold uppercase tracking-wider text-slate-200">
            <a href="#destinos" className="hover:text-[#FF4F5A] transition-colors">
              Salidas Grupales
            </a>
            <a href="#cruceros" className="hover:text-[#FF4F5A] transition-colors">
              Cruceros &amp; Escapadas
            </a>
            <a href="#beneficios" className="hover:text-[#E5A93B] transition-colors flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-[#E5A93B]" /> Club Rewards
            </a>
            <Link href="/landing/travelcab" className="hover:text-[#FF5A19] transition-colors flex items-center gap-1">
              <Car className="h-3.5 w-3.5 text-[#FF5A19]" /> TravelCab
            </Link>
            <a href="#app" className="hover:text-[#FF4F5A] transition-colors">
              App Pasajero
            </a>
            <a href="#afiliados" className="hover:text-[#FF4F5A] transition-colors">
              Afiliados
            </a>
          </nav>

          {/* Botones de Acción */}
          <div className="hidden sm:flex items-center gap-3">
            <a
              href={cmsData.header?.loginUrl || "/login"}
              className="text-xs font-bold px-4 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition"
            >
              Ingresar a mi Viaje
            </a>
            <Link
              href={affiliateRef ? `/marketplace?ref=${affiliateRef}` : "/marketplace"}
              className="px-5 py-2.5 rounded-xl bg-[#FF4F5A] hover:bg-[#e03e48] text-white font-bold text-xs transition shadow-lg shadow-[#FF4F5A]/30 flex items-center gap-1.5 cursor-pointer"
            >
              <Compass className="h-4 w-4" /> Explorar Catálogo 2026
            </Link>
          </div>

          {/* Botón Móvil */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Menú Móvil */}
        {mobileOpen && (
          <div className="lg:hidden bg-[#0A2A5B] border-b border-white/10 px-6 py-4 space-y-3 animate-in slide-in-from-top text-white">
            <a href="#destinos" onClick={() => setMobileOpen(false)} className="block text-xs font-bold text-slate-200 py-1.5 hover:text-[#FF4F5A]">
              Salidas Grupales
            </a>
            <a href="#cruceros" onClick={() => setMobileOpen(false)} className="block text-xs font-bold text-slate-200 py-1.5 hover:text-[#FF4F5A]">
              Cruceros &amp; Escapadas
            </a>
            <a href="#beneficios" onClick={() => setMobileOpen(false)} className="block text-xs font-bold text-[#E5A93B] py-1.5">
              ⭐ Club Rewards
            </a>
            <Link href="/landing/travelcab" onClick={() => setMobileOpen(false)} className="block text-xs font-bold text-[#FF5A19] py-1.5">
              🚕 Traslados TravelCab
            </Link>
            <a href="#app" onClick={() => setMobileOpen(false)} className="block text-xs font-bold text-slate-200 py-1.5 hover:text-[#FF4F5A]">
              App del Pasajero
            </a>
            <Link
              href={affiliateRef ? `/marketplace?ref=${affiliateRef}` : "/marketplace"}
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center py-3 rounded-xl bg-[#FF4F5A] text-white font-bold text-xs shadow-md"
            >
              Ver Todo el Catálogo
            </Link>
          </div>
        )}
      </header>

      {/* 3. HERO SECTION 4K DE ALTO IMPACTO */}
      <section className="relative min-h-[620px] lg:min-h-[700px] flex items-center justify-center overflow-hidden bg-[#0A2A5B]">
        {/* Imagen de Fondo HD Nítida */}
        <div className="absolute inset-0 z-0">
          <img
            src={activeSlide?.bgImage || "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1920&q=80"}
            alt={activeSlide?.title}
            className="w-full h-full object-cover object-center transition-all duration-1000 transform scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A2A5B] via-[#0A2A5B]/50 to-transparent"></div>
        </div>

        {/* Contenido Central del Hero con Card Translúcida Limpia */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 text-center space-y-6">
          
          {/* BANNER EDITABLE EN EL HERO (EJ: 12 CUOTAS SIN INTERÉS) */}
          {cmsData.heroPromoBanner?.enabled !== false && (
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#FF4F5A]/95 backdrop-blur-md text-white text-xs sm:text-sm font-bold border border-white/30 shadow-2xl animate-pulse mx-auto">
              <Sparkles className="h-4 w-4 text-[#E5A93B] flex-shrink-0" />
              <span>{cmsData.heroPromoBanner?.text || "🔥 12 Cuotas fijas sin interés en paquetes propios + Time-to-Pay"}</span>
            </div>
          )}

          {/* Tarjeta de Título Flotante HD */}
          <div className="bg-[#0A2A5B]/85 backdrop-blur-md p-6 sm:p-10 rounded-3xl border border-white/20 shadow-2xl space-y-4 max-w-4xl mx-auto text-white">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-[11px] font-bold text-[#FF4F5A] uppercase tracking-widest">
              <Sparkles className="h-3 w-3 text-[#FF4F5A]" />
              {activeSlide?.subtitle || "EXPERIENCIAS INOLVIDABLES"}
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-white">
              {activeSlide?.title}
            </h1>

            <p className="text-xs sm:text-base text-slate-200 max-w-2xl mx-auto leading-relaxed font-medium">
              {activeSlide?.text}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href={affiliateRef ? `/marketplace?ref=${affiliateRef}` : "/marketplace"}
                className="px-8 py-3.5 rounded-2xl bg-[#FF4F5A] hover:bg-[#e03e48] text-white font-bold text-xs sm:text-sm transition shadow-xl shadow-[#FF4F5A]/40 flex items-center gap-2 transform hover:-translate-y-0.5 cursor-pointer"
              >
                {activeSlide?.ctaText || "Ver Catálogo de Viajes"} <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#buscador"
                className="px-6 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm transition border border-white/20 cursor-pointer"
              >
                Buscar por Destino
              </a>
            </div>
          </div>

          {/* Indicadores de Slider */}
          <div className="flex justify-center gap-2 pt-2">
            {cmsData.heroSlides?.map((_: any, idx: number) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                className={`h-2.5 rounded-full transition-all ${
                  currentSlide === idx ? "w-8 bg-red-500 shadow-md" : "w-2.5 bg-white/60 hover:bg-white"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 4. MOTOR DE BÚSQUEDA MULTIPRODUCTO (HABILITABLE DESDE CMS) */}
      <section id="buscador" className="relative z-20 -mt-10 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-4 sm:p-6 space-y-5">
          
          {/* Pestañas de Servicios Habilitadas desde CMS */}
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

            {enabledTabs.vuelos && (
              <button
                type="button"
                onClick={() => setSearchTab('vuelos')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition whitespace-nowrap cursor-pointer ${
                  searchTab === 'vuelos' ? "bg-[#0A2A5B] text-white shadow-md" : "text-slate-500 hover:text-[#0A2A5B] hover:bg-slate-100"
                }`}
              >
                <Plane className="h-4 w-4 text-[#FF4F5A]" /> ✈️ Vuelos (GDS)
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

            {enabledTabs.buses && (
              <button
                type="button"
                onClick={() => setSearchTab('buses')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition whitespace-nowrap cursor-pointer ${
                  searchTab === 'buses' ? "bg-[#0A2A5B] text-white shadow-md" : "text-slate-500 hover:text-[#0A2A5B] hover:bg-slate-100"
                }`}
              >
                <Bus className="h-4 w-4 text-[#FF4F5A]" /> 🚌 Micros de Línea
              </button>
            )}

            {enabledTabs.civitatis && (
              <button
                type="button"
                onClick={() => setSearchTab('civitatis')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition whitespace-nowrap cursor-pointer ${
                  searchTab === 'civitatis' ? "bg-[#0A2A5B] text-white shadow-md" : "text-slate-500 hover:text-[#0A2A5B] hover:bg-slate-100"
                }`}
              >
                <Ticket className="h-4 w-4 text-[#FF4F5A]" /> 🎯 Tours Civitatis
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
          </div>

          {/* 1. Formulario Paquetes y Salidas Grupales */}
          {searchTab === 'paquetes' && (
            <form onSubmit={handlePackageSearch} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="sm:col-span-2 space-y-1">
                <span className="font-bold text-slate-600 block">¿A dónde querés viajar?</span>
                <div className="flex items-center bg-slate-50 rounded-2xl border border-slate-200 px-3 py-2.5 focus-within:border-[#FF4F5A] focus-within:ring-2 focus-within:ring-[#FF4F5A]/20 transition-all">
                  <MapPin className="h-4 w-4 text-[#FF4F5A] mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchDestination}
                    onChange={(e) => setSearchDestination(e.target.value)}
                    placeholder="Ej: Salta, Cataratas, Bariloche, Mendoza, Caribe..."
                    className="w-full bg-transparent font-bold text-[#0A2A5B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-600 block">Temporada / Mes</span>
                <select
                  value={searchMonth}
                  onChange={(e) => setSearchMonth(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl border border-slate-200 px-3 py-3 font-bold text-[#0A2A5B] focus:outline-none focus:border-[#FF4F5A] focus:ring-2 focus:ring-[#FF4F5A]/20 transition-all"
                >
                  <option value="all">Todas las fechas</option>
                  <option value="verano">Verano 2026</option>
                  <option value="otoño">Otoño / Semana Santa</option>
                  <option value="invierno">Vacaciones de Invierno</option>
                  <option value="primavera">Primavera 2026</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-3 bg-[#FF4F5A] hover:bg-[#e03e48] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#FF4F5A]/30 transition transform hover:scale-[1.02] cursor-pointer"
                >
                  <Search className="h-4 w-4" /> Buscar Experiencias
                </button>
              </div>
            </form>
          )}

          {/* 2. Formulario Vuelos (Basset API Ready) */}
          {searchTab === 'vuelos' && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-slate-600 block">Origen</span>
                <input
                  type="text"
                  value={flightOrigin}
                  onChange={(e) => setFlightOrigin(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl border border-slate-200 px-3 py-2.5 font-bold text-[#0A2A5B]"
                />
              </div>
              <div className="space-y-1">
                <span className="font-bold text-slate-600 block">Destino</span>
                <input
                  type="text"
                  value={flightDestination}
                  onChange={(e) => setFlightDestination(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl border border-slate-200 px-3 py-2.5 font-bold text-[#0A2A5B]"
                />
              </div>
              <div className="space-y-1">
                <span className="font-bold text-slate-600 block">Fecha de Salida</span>
                <input
                  type="date"
                  value={flightDate}
                  onChange={(e) => setFlightDate(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl border border-slate-200 px-3 py-2.5 font-bold text-[#0A2A5B]"
                />
              </div>
              <div className="flex items-end">
                <a
                  href={`https://wa.me/5493814188106?text=Hola!%20Quiero%20cotizar%20un%20vuelo%20de%20${encodeURIComponent(flightOrigin)}%20hacia%20${encodeURIComponent(flightDestination)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 bg-[#0A2A5B] hover:bg-[#113875] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
                >
                  <Plane className="h-4 w-4 text-[#FF4F5A]" /> Cotizar Vuelos (GDS)
                </a>
              </div>
            </div>
          )}

          {/* 3. Formulario Hoteles */}
          {searchTab === 'hoteles' && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <span className="font-extrabold text-slate-500 block">Ciudad / Hotel</span>
                <input
                  type="text"
                  value={hotelCity}
                  onChange={(e) => setHotelCity(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl border border-slate-200 px-3 py-2.5 font-bold text-slate-800"
                />
              </div>
              <div className="space-y-1">
                <span className="font-extrabold text-slate-500 block">Check-in</span>
                <input
                  type="date"
                  value={hotelCheckIn}
                  onChange={(e) => setHotelCheckIn(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl border border-slate-200 px-3 py-2.5 font-bold text-slate-800"
                />
              </div>
              <div className="space-y-1">
                <span className="font-extrabold text-slate-500 block">Huéspedes</span>
                <select
                  value={hotelGuests}
                  onChange={(e) => setHotelGuests(Number(e.target.value))}
                  className="w-full bg-slate-50 rounded-2xl border border-slate-200 px-3 py-2.5 font-bold text-slate-800"
                >
                  <option value={1}>1 Huésped (Single)</option>
                  <option value={2}>2 Huéspedes (Doble)</option>
                  <option value={3}>3 Huéspedes (Triple)</option>
                  <option value={4}>4+ Huéspedes (Familiar)</option>
                </select>
              </div>
              <div className="flex items-end">
                <a
                  href={`https://wa.me/5493814188106?text=Hola!%20Quiero%20cotizar%20hotel%20en%20${encodeURIComponent(hotelCity)}%20para%20${hotelGuests}%20personas`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 bg-[#0A2A5B] hover:bg-[#113875] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
                >
                  <Hotel className="h-4 w-4 text-[#FF4F5A]" /> Buscar Alojamiento
                </a>
              </div>
            </div>
          )}

          {/* 4. Formulario Buses */}
          {searchTab === 'buses' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-slate-600 block">Origen</span>
                <input
                  type="text"
                  value={busOrigin}
                  onChange={(e) => setBusOrigin(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl border border-slate-200 px-3 py-2.5 font-bold text-[#0A2A5B]"
                />
              </div>
              <div className="space-y-1">
                <span className="font-bold text-slate-600 block">Destino</span>
                <input
                  type="text"
                  value={busDestination}
                  onChange={(e) => setBusDestination(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl border border-slate-200 px-3 py-2.5 font-bold text-[#0A2A5B]"
                />
              </div>
              <div className="flex items-end">
                <a
                  href={`https://wa.me/5493814188106?text=Hola!%20Quiero%20comprar%20pasaje%20de%20bus%20de%20${encodeURIComponent(busOrigin)}%20a%20${encodeURIComponent(busDestination)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 bg-[#0A2A5B] hover:bg-[#113875] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
                >
                  <Bus className="h-4 w-4 text-[#FF4F5A]" /> Consultar Pasajes Unibus
                </a>
              </div>
            </div>
          )}

          {/* 5. Formulario Tours Civitatis */}
          {searchTab === 'civitatis' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-slate-600 block">Ciudad o Actividad</span>
                <input
                  type="text"
                  value={activityCity}
                  onChange={(e) => setActivityCity(e.target.value)}
                  placeholder="Ej: Mendoza, Ushuaia, Cancún, Roma..."
                  className="w-full bg-slate-50 rounded-2xl border border-slate-200 px-3 py-2.5 font-bold text-[#0A2A5B]"
                />
              </div>
              <div className="flex items-end">
                <a
                  href={`https://wa.me/5493814188106?text=Hola!%20Quiero%20reservar%20excursiones%20y%20tours%20en%20${encodeURIComponent(activityCity)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 bg-[#0A2A5B] hover:bg-[#113875] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
                >
                  <Ticket className="h-4 w-4 text-[#FF4F5A]" /> Ver Tours Disponibles
                </a>
              </div>
            </div>
          )}

          {/* 6. Formulario Traslados TravelCab */}
          {searchTab === 'travelcab' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-slate-600 block">Punto de Recogida</span>
                <input
                  type="text"
                  value={cabPickup}
                  onChange={(e) => setCabPickup(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl border border-slate-200 px-3 py-2.5 font-bold text-[#0A2A5B]"
                />
              </div>
              <div className="space-y-1">
                <span className="font-bold text-slate-600 block">Destino</span>
                <input
                  type="text"
                  value={cabDropoff}
                  onChange={(e) => setCabDropoff(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl border border-slate-200 px-3 py-2.5 font-bold text-[#0A2A5B]"
                />
              </div>
              <div className="flex items-end">
                <Link
                  href="/landing/travelcab"
                  className="w-full py-3 bg-[#FF5A19] hover:bg-[#e04e14] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                >
                  <Car className="h-4 w-4 text-white" /> Cotizar con TravelCab
                </Link>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* 5. BARRA DE CONFIANZA & MÉTRICAS (CMS SYNC) */}
      <section className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
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

      {/* 6. CARRUSEL HORIZONTAL DE SALIDAS DESTACADAS */}
      <section id="destinos" className="max-w-7xl mx-auto px-6 py-12 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs font-bold text-[#FF4F5A] uppercase tracking-widest block">
              CATÁLOGO SELECCIONADO 2026
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#0A2A5B] tracking-tight">
              Salidas Grupales, Circuitos &amp; Cruceros
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Deslizá horizontalmente para ver nuestras salidas organizadas y de operadores mayoristas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Flechas de Navegación del Carrusel */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollCarousel('left')}
                className="h-10 w-10 rounded-full bg-white shadow-md border border-slate-200 text-[#0A2A5B] hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
                title="Anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel('right')}
                className="h-10 w-10 rounded-full bg-white shadow-md border border-slate-200 text-[#0A2A5B] hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
                title="Siguiente"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <Link
              href={affiliateRef ? `/marketplace?ref=${affiliateRef}` : "/marketplace"}
              className="text-xs font-bold px-4 py-2 bg-[#FF4F5A] hover:bg-[#e03e48] text-white rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              Ver Todo el Catálogo <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Carrusel Horizontal Scrollable */}
        {loadingTrips ? (
          <div className="py-16 text-center">
            <div className="h-8 w-8 border-4 border-[#FF4F5A] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-slate-400 mt-2">Cargando salidas oficiales...</p>
          </div>
        ) : (
          <div
            ref={carouselRef}
            className="flex gap-6 overflow-x-auto scroll-smooth pb-6 pt-2 snap-x no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {featuredTrips.slice(0, 15).map((trip) => {
              const isCruise = trip.productType === 'crucero';
              const isMayorista = trip.productType === 'operador_mayorista';
              const isPropia = trip.productType === 'salida_propia';

              return (
                <div
                  key={trip.id}
                  className="min-w-[300px] sm:min-w-[340px] max-w-[340px] flex-shrink-0 snap-start bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                >
                  {/* Imagen HD Nítida */}
                  <div className="relative h-56 bg-slate-100 overflow-hidden">
                    <img
                      src={trip.imageUrl || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"}
                      alt={trip.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Badge de Tipología */}
                    <div className="absolute top-3 left-3">
                      {isPropia && (
                        <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                          Salida Propia Garantizada
                        </span>
                      )}
                      {isMayorista && (
                        <span className="px-3 py-1 rounded-full bg-[#0A2A5B] text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                          Circuito Mayorista
                        </span>
                      )}
                      {isCruise && (
                        <span className="px-3 py-1 rounded-full bg-[#0A2A5B] text-white text-[10px] font-bold uppercase tracking-wider shadow-md flex items-center gap-1">
                          <Ship className="h-3 w-3 text-[#FF4F5A]" /> Crucero
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cuerpo */}
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-[#FF4F5A] uppercase tracking-widest block">
                        {trip.location || trip.destination} · {trip.duration || `${trip.nightsCount || 4} Noches`}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-[#0A2A5B] leading-snug group-hover:text-[#FF4F5A] transition-colors line-clamp-1">
                        {trip.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {trip.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Desde</span>
                          <span className="text-base font-bold text-[#0A2A5B]">
                            {formatPrice(trip.price, trip.currency)}
                          </span>
                        </div>
                        {trip.priceRewards && (
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-[#FF4F5A] block">
                              Club Rewards: {formatPrice(trip.priceRewards, trip.currency)}
                            </span>
                            <span className="text-[9px] text-[#E5A93B] font-bold block">
                              +{trip.pointsEarned || 350} pts
                            </span>
                          </div>
                        )}
                      </div>

                      <Link
                        href={affiliateRef ? `/marketplace?ref=${affiliateRef}&q=${encodeURIComponent(trip.title)}` : `/marketplace?q=${encodeURIComponent(trip.title)}`}
                        className="w-full py-2.5 bg-[#0A2A5B] hover:bg-[#113875] text-white rounded-xl text-xs font-bold transition text-center shadow-md block cursor-pointer"
                      >
                        Reservar con Time-to-Pay
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 7. MOSAICO DE FORMATOS DE EXPERIENCIAS */}
      <section className="bg-[#0A2A5B] text-white py-20 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-[#FF4F5A] uppercase tracking-widest block">EXPERIENCIAS CURADAS</span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">Formatos Diseñados para Cada Pasajero</h2>
            <p className="text-xs sm:text-sm text-slate-200 font-medium">
              Desde escapadas grupales acompañadas hasta cruceros y circuitos por el mundo.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Salidas Grupales Acompañadas",
                sub: "Bus propio, pensión completa y coordinador 24/7",
                icon: Bus,
                image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80"
              },
              {
                title: "Cruceros & Travesías",
                sub: "MSC, Costa y fluviales con todo incluido",
                icon: Ship,
                image: "https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=600&q=80"
              },
              {
                title: "Rutas del Vino & Escapadas",
                sub: "Bodegas boutique y gastronomía de autor",
                icon: Hotel,
                image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80"
              },
              {
                title: "Circuitos por el Mundo",
                sub: "Europa, Sudamérica y Caribe con guías locales",
                icon: Globe,
                image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80"
              }
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  className="bg-[#113875]/80 rounded-3xl overflow-hidden border border-white/10 shadow-xl group hover:border-[#FF4F5A] transition-colors"
                >
                  <div className="h-44 overflow-hidden relative">
                    <img src={card.image} alt={card.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-3 right-3 h-9 w-9 rounded-xl bg-[#0A2A5B]/90 backdrop-blur-md flex items-center justify-center text-[#FF4F5A]">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="p-5 space-y-1.5 text-white">
                    <h4 className="font-bold text-sm text-white group-hover:text-[#FF4F5A] transition-colors">{card.title}</h4>
                    <p className="text-xs text-slate-200 leading-relaxed">{card.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. CLUB REWARDS & BENEFICIOS */}
      <section id="beneficios" className="max-w-7xl mx-auto px-6 py-20">
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

      {/* 9. LA APP DEL PASAJERO MÓVIL */}
      <section id="app" className="bg-slate-100/80 py-20 px-6 border-y border-slate-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold text-[#FF4F5A] uppercase tracking-widest block">TECNOLOGÍA A BORDO</span>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#0A2A5B] tracking-tight">
              Toda la Información de tu Viaje en la App Móvil
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Al contratar cualquier salida con TravelApp Experience, accedés a tu portal digital exclusivo para consultar cada detalle en tiempo real:
            </p>

            <div className="space-y-3 text-xs font-bold text-slate-700">
              <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <span>Itinerario interactivo día a día con horarios, puntos de encuentro y mapas</span>
              </div>
              <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <span>Número de butaca asignada en el bus y habitación de hotel (Rooming list)</span>
              </div>
              <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <span>Botón SOS directo con el coordinador de tu viaje y asistencia médica 24/7</span>
              </div>
              <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <span>Voucher digital y tickets de excursiones disponibles 100% offline</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            {/* Mockup Smartphone */}
            <div className="w-72 bg-[#0A2A5B] p-4 rounded-[40px] shadow-2xl border-4 border-[#0F356E] space-y-3">
              <div className="h-4 w-28 bg-white/20 rounded-full mx-auto"></div>
              <div className="bg-[#020617] rounded-[32px] p-4 text-white space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="font-bold text-[10px] text-[#FF4F5A]">TRAVELAPP MÓVIL</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                </div>
                <div className="bg-[#0A2A5B] p-3 rounded-2xl space-y-1">
                  <span className="text-[10px] text-slate-300 block font-bold uppercase">Viaje Activo</span>
                  <div className="font-bold text-sm text-white">Norte Argentino Fascinante</div>
                  <span className="text-[10px] text-emerald-400 font-bold block">Butaca #14 · Cama Superior</span>
                </div>
                <div className="bg-[#0A2A5B] p-3 rounded-2xl space-y-1">
                  <span className="text-[10px] text-slate-300 block font-bold uppercase">Coordinador Asignado</span>
                  <div className="font-bold text-xs text-white">Marcos Vignola</div>
                  <span className="text-[10px] text-slate-300 block">+54 9 381 555-6667</span>
                </div>
                <div className="p-3 bg-[#FF4F5A] text-white rounded-2xl text-center font-bold text-xs shadow-md">
                  Ver Voucher &amp; Asistencia SOS
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. TESTIMONIOS REALES & COMUNIDAD */}
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
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "{t.comment}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full object-cover border border-slate-200" />
                <div>
                  <div className="font-bold text-xs text-[#0A2A5B]">{t.name}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{t.location} · {t.trip}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 11. CONVERTITE EN PROMOTOR / AFILIADO OFICIAL */}
      <section id="afiliados" className="max-w-7xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-r from-[#0A2A5B] via-[#113875] to-[#FF4F5A] rounded-3xl text-white p-8 sm:p-12 shadow-2xl flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-widest bg-white/15 px-3 py-1 rounded-full inline-block text-white">
              RED DE PROMOTORES OFICIALES
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              ¿Querés Vender Viajes y Ganar Comisiones?
            </h3>
            <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-medium">
              Sumate a la red de promotores y afiliados de TravelApp Experience. Compartí tu enlace personalizado y cobrá comisiones automáticas por cada reserva.
            </p>
          </div>

          <Link
            href="/afiliados"
            className="px-8 py-4 rounded-2xl bg-white text-[#0A2A5B] hover:bg-slate-100 font-bold text-xs transition shadow-xl transform hover:scale-105 cursor-pointer"
          >
            Registrarme como Afiliado
          </Link>
        </div>
      </section>

      {/* 12. FOOTER INSTITUCIONAL COMPLETO CON QR DE ARCA */}
      <footer className="bg-[#0A2A5B] text-white border-t border-white/10 pt-16 pb-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-white/10 text-xs">
          
          {/* Columna 1: Marca & Resumen */}
          <div className="space-y-4">
            <img src="/assets/experience_blanco.svg" alt="TravelApp Experiences" className="h-8 w-auto object-contain" />
            <p className="text-slate-300 leading-relaxed font-medium">
              Especialistas en turismo grupal, cruceros internacionales y experiencias curadas por Argentina y el mundo.
            </p>
            <div className="flex items-center gap-3 text-slate-300">
              <a href={cmsData.redesSociales?.facebook} target="_blank" rel="noreferrer" className="hover:text-white transition">Facebook</a>
              <a href={cmsData.redesSociales?.instagram} target="_blank" rel="noreferrer" className="hover:text-white transition">Instagram</a>
              <a href={cmsData.redesSociales?.whatsapp} target="_blank" rel="noreferrer" className="hover:text-white transition">WhatsApp</a>
            </div>
          </div>

          {/* Columna 2: Enlaces Rápidos */}
          <div className="space-y-3">
            <span className="font-bold text-white uppercase tracking-wider block">Explorar</span>
            <ul className="space-y-2 text-slate-300 font-medium">
              <li><Link href="/marketplace" className="hover:text-[#FF4F5A] transition">Catálogo de Salidas 2026</Link></li>
              <li><a href="#destinos" className="hover:text-[#FF4F5A] transition">Viajes Grupales</a></li>
              <li><a href="#cruceros" className="hover:text-[#FF4F5A] transition">Cruceros Internacionales</a></li>
              <li><Link href="/landing/rewards" className="hover:text-[#E5A93B] transition">Club Rewards</Link></li>
              <li><Link href="/landing/travelcab" className="hover:text-[#FF5A19] transition">Traslados TravelCab</Link></li>
            </ul>
          </div>

          {/* Columna 3: Contacto & Sucursales */}
          <div className="space-y-3">
            <span className="font-bold text-white uppercase tracking-wider block">Atención al Pasajero</span>
            <ul className="space-y-2 text-slate-300 font-medium">
              <li>Casa Central: San Miguel de Tucumán</li>
              <li>WhatsApp Comercial: +54 9 381 418-8106</li>
              <li>Horario: Lunes a Sábados 09:00 a 20:00 hs</li>
              <li>Guardia de Coordinación: 24/7 en viaje</li>
            </ul>
          </div>

          {/* Columna 4: Seguridad & QR ARCA / AFIP */}
          <div className="space-y-3">
            <span className="font-bold text-white uppercase tracking-wider block">Seguridad &amp; Fiscal</span>
            <div className="space-y-3 text-slate-300 text-[11px] font-medium">
              <p>Agencia Oficial Habilitada por Ministerio de Turismo y Deportes de la Nación.</p>
              
              {/* Sello Fiscal ARCA QR */}
              <div className="pt-1">
                <RenderLegalSeal
                  content={cmsData.sellosLegales?.arcaQr || "https://www.afip.gob.ar/images/f960/DATAWEB.jpg"}
                  alt="ARCA / AFIP Data Fiscal"
                />
              </div>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-8 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-400">
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
