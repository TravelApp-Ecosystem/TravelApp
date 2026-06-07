"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Sparkles
} from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

const DEFAULT_EXPERIENCE_CMS_DATA = {
  header: {
    logo: "/assets/travelapp_logo.svg",
    brand: "TravelApp",
    product: "Experiences",
    ctaText: "Reservar Ahora",
    ctaUrl: "https://wa.me/5493814188106?text=Hola!%20Quiero%20saber%20más%20sobre%20TravelApp%20Experiences.",
    loginUrl: "/login"
  },
  heroSlides: [
    {
      title: "Viví Argentina de otra manera",
      subtitle: "Experiencias únicas en el NOA, Cuyo y la Patagonia",
      text: "Recorridos exclusivos y curados con guías certificados locales.",
      bgImage: "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1920&q=80",
      ctaText: "Descubrir Catálogo",
      ctaUrl: "#catalog"
    }
  ],
  carouselOffers: [
    {
      imageUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80",
      title: "Mendoza Wine Tasting VIP",
      link: "#catalog"
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=600&q=80",
      title: "Aventura en Jujuy 4x4",
      link: "#catalog"
    }
  ],
  servicios: [
    {
      id: "adventure",
      title: "Aventura & Naturaleza",
      summary: "Trekking, senderismo y experiencias en el entorno natural más espectacular de Argentina.",
      imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80",
      modalDetail: "Detalles del servicio de aventura: Contamos con vehículos 4x4 equipados, guías profesionales de montaña inscritos en Parques Nacionales y seguros completos para cada pasajero."
    },
    {
      id: "food",
      title: "Cultura & Gastronomía",
      summary: "Tours de bodegas, degustaciones exclusivas, y cenas privadas con chefs locales destacados.",
      imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80",
      modalDetail: "Disfruta de Mendoza y el norte con los mejores maridajes. Ofrecemos reservas directas en restaurantes de bodegas con estrella Michelin y catas dirigidas por sommeliers certificados."
    }
  ],
  rewardsBlock: {
    title: "Viajá con TravelApp Rewards",
    subtitle: "Acumulá puntos en cada viaje de experiencias y canjealos por traslados gratis con TravelCab o descuentos en tus próximos destinos.",
    pointsText: "Obtené tarifas reducidas en todas nuestras experiencias al registrarte.",
    badgeText: "ECOSISTEMA REWARDS",
    imageUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80"
  },
  redesSociales: {
    facebook: "https://facebook.com/travelapp.ar",
    instagram: "https://instagram.com/travelapp.ar",
    messenger: "https://m.me/travelapp.ar",
    whatsapp: "https://wa.me/5493814188106"
  },
  footer: {
    brandText: "TravelApp Experiences",
    copyrightText: "© 2026 TravelApp Experiences. Una marca de TravelApp s.a.s."
  }
};

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
  </svg>
);
const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);
const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.5 12 3.5 12 3.5s-7.518 0-9.388.503a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11C4.482 20.5 12 20.5 12 20.5s7.518 0 9.388-.503a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);
const TiktokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.032 2.61-.019 3.91-.006.03 1.56.7 2.92 1.94 3.79.79.56 1.7.93 2.65 1.11.01 1.41-.01 2.82.003 4.23-.88-.13-1.74-.46-2.52-.94-.85-.52-1.55-1.24-2.02-2.11v6.92c-.01 1.43-.37 2.85-1.07 4.09-.76 1.34-1.92 2.4-3.32 2.99-1.57.66-3.37.76-5.02.26-1.5-.45-2.83-1.46-3.69-2.82-1-1.58-1.28-3.56-.78-5.38.48-1.76 1.7-3.26 3.34-4.08 1.15-.58 2.44-.81 3.72-.66v4.3c-.76-.23-1.61-.13-2.3.29-.63.39-1.05 1.05-1.16 1.79-.17.99.31 2.05 1.17 2.53.69.39 1.54.43 2.26.11.83-.37 1.39-1.19 1.44-2.1.03-3.64.01-7.28.02-10.93.01-.13.01-.26.01-.39z"/>
  </svg>
);

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
      <img src={trimmed} alt={alt} className="h-6 w-auto object-contain" />
      <span className="text-[8px] font-bold text-slate-400 uppercase">{alt}</span>
    </div>
  );
};

export default function ExperienceLanding({ initialCms }: { initialCms?: any }) {
  const [cmsData, setCmsData] = useState<any>(initialCms ? { ...DEFAULT_EXPERIENCE_CMS_DATA, ...initialCms } : DEFAULT_EXPERIENCE_CMS_DATA);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Hero Slider State
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Modales
  const [activeServiceModal, setActiveServiceModal] = useState<any | null>(null);
  const [isQuienesSomosOpen, setIsQuienesSomosOpen] = useState(false);

  // Listeners de Firestore
  useEffect(() => {
    // Escuchar CMS Config en tiempo real
    const unsubCms = onSnapshot(doc(db, "cms", "landing_experience"), (snap) => {
      if (snap.exists()) {
        setCmsData({
          ...DEFAULT_EXPERIENCE_CMS_DATA,
          ...snap.data()
        });
      }
    });

    return () => {
      unsubCms();
    };
  }, []);

  // Auto-advance slider
  useEffect(() => {
    const slidesCount = cmsData.heroSlides?.length || 1;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slidesCount);
    }, 6000);
    return () => clearInterval(interval);
  }, [cmsData.heroSlides]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden">
      
      {/* HEADER EN AZUL CORPORATIVO */}
      <header className="sticky top-0 z-40 w-full bg-tech-blue border-b border-white/10 shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#" className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <Compass className="h-6 w-6 text-white animate-spin-slow" />
            </div>
            <div>
              <span className="font-black text-white text-xl tracking-tight leading-none block">
                {cmsData.header?.brand || "TravelApp"}
              </span>
              <span className="text-[10px] font-black text-lime-400 uppercase tracking-widest leading-none">
                {cmsData.header?.product || "Experiences"}
              </span>
            </div>
          </a>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-white/80">
            <button 
              onClick={() => setIsQuienesSomosOpen(true)}
              className="hover:text-white transition-colors"
            >
              Quiénes Somos
            </button>
            <a href="#catalog" className="hover:text-white transition-colors">
              Catálogo de Viajes
            </a>
            <a href="#services" className="hover:text-white transition-colors">
              Servicios
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <a
              href={cmsData.header?.loginUrl || "/login"}
              className="text-sm font-bold text-white hover:text-lime-400 transition-colors"
            >
              Ingresar
            </a>
            <a
              href={cmsData.header?.ctaUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-lime-500 hover:bg-lime-600 px-5 py-2.5 text-sm font-black text-gray-950 shadow-lg shadow-lime-500/20 transition-all hover:scale-[1.02]"
            >
              {cmsData.header?.ctaText || "Reservar"}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 text-white md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-white/10 bg-tech-blue p-5 md:hidden flex flex-col gap-4 text-white">
            <button 
              onClick={() => { setMobileOpen(false); setIsQuienesSomosOpen(true); }}
              className="text-left font-bold text-white/90 py-2"
            >
              Quiénes Somos
            </button>
            <a 
              href="#catalog" 
              onClick={() => setMobileOpen(false)}
              className="font-bold text-white/90 py-2"
            >
              Catálogo de Viajes
            </a>
            <a 
              href="#services" 
              onClick={() => setMobileOpen(false)}
              className="font-bold text-white/90 py-2"
            >
              Servicios
            </a>
            <hr className="border-white/10" />
            <a href={cmsData.header?.loginUrl || "/login"} className="font-bold py-2">
              Ingresar al Dashboard
            </a>
            <a
              href={cmsData.header?.ctaUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime-500 py-3 text-sm font-black text-gray-950"
            >
              {cmsData.header?.ctaText || "Reservar"} <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        )}
      </header>

      {/* HERO SLIDER (HASTA 10 SLIDES) */}
      <section className="relative h-[65vh] min-h-[500px] w-full overflow-hidden bg-slate-900">
        {(cmsData.heroSlides || []).map((slide: any, idx: number) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out flex items-center ${
              currentSlide === idx ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(15, 32, 67, 0.85), rgba(10, 20, 40, 0.95)), url('${slide.bgImage}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="mx-auto max-w-5xl px-6 text-center text-white space-y-6 animate-fadeIn">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight">
                {slide.title}
              </h1>
              <p className="text-lg sm:text-xl text-slate-200 max-w-3xl mx-auto font-medium">
                {slide.subtitle}
              </p>
              {slide.text && (
                <p className="text-sm text-slate-300 max-w-2xl mx-auto opacity-90">
                  {slide.text}
                </p>
              )}
              <div className="pt-4">
                <a
                  href={slide.ctaUrl || "#catalog"}
                  className="inline-flex items-center gap-2 rounded-2xl bg-lime-500 hover:bg-lime-600 px-8 py-4 text-base font-black text-gray-950 transition-all duration-300 hover:-translate-y-1 shadow-2xl shadow-lime-500/20"
                >
                  {slide.ctaText || "Ver Catálogo"}
                  <ArrowRight className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        ))}

        {/* Controles del Slider */}
        {cmsData.heroSlides?.length > 1 && (
          <>
            <button
              onClick={() => setCurrentSlide(prev => (prev - 1 + cmsData.heroSlides.length) % cmsData.heroSlides.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-all"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() => setCurrentSlide(prev => (prev + 1) % cmsData.heroSlides.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-all"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Indicadores */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {cmsData.heroSlides.map((_: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2.5 rounded-full transition-all ${
                    currentSlide === idx ? "w-8 bg-lime-500" : "w-2.5 bg-white/40"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* OFERTAS DESTACADAS (CARRUSEL MOCK / CMS) */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-tech-blue">Experiencias Destacadas</span>
              <h2 className="mt-2 text-3xl font-black text-slate-800">Ofertas de Viajes Exclusivos</h2>
            </div>
            <a
              href="#catalog"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 hover:border-tech-blue hover:text-tech-blue px-5 py-2.5 text-sm font-bold text-slate-600 transition-all"
            >
              Ver Catálogo Completo
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {(cmsData.carouselOffers || []).map((offer: any, idx: number) => (
              <a
                key={idx}
                href={offer.link || "#catalog"}
                className="group relative h-64 overflow-hidden rounded-2xl border border-slate-200 shadow-md block"
              >
                <img
                  src={offer.imageUrl}
                  alt={offer.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent"></div>
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <span className="inline-flex items-center rounded-lg bg-lime-500 text-gray-950 font-bold text-[10px] px-2 py-0.5 mb-2 uppercase">
                    Oferta Especial
                  </span>
                  <h3 className="text-lg font-black leading-snug group-hover:text-lime-300 transition-colors">
                    {offer.title}
                  </h3>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* BLOQUE DE NUESTROS SERVICIOS (MODALES CMS) */}
      <section id="services" className="py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-tech-blue">¿Qué ofrecemos?</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-black text-slate-800">Servicios Incluidos en tu Experiencia</h2>
            <p className="mt-4 text-slate-500 max-w-xl mx-auto text-sm">
              Descubrí los servicios flotantes exclusivos que componen nuestro estándar de viaje premium.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(cmsData.servicios || []).map((svc: any) => (
              <div
                key={svc.id}
                className="group rounded-3xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {svc.imageUrl && (
                    <div className="h-44 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                      <img src={svc.imageUrl} alt={svc.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform" />
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-tech-blue">{svc.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{svc.summary}</p>
                </div>
                
                <button
                  onClick={() => setActiveServiceModal(svc)}
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-tech-blue hover:text-tech-blue/80 transition-colors"
                >
                  Conocer más detalles <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN PROMO MARKETPLACE */}
      <section id="catalog" className="py-24 bg-white border-t border-slate-200 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-lime-400 via-white to-white"></div>
        <div className="mx-auto max-w-4xl px-6 text-center space-y-8 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-500/10 border border-lime-500/20 text-xs text-lime-600 font-black tracking-wide">
            <Sparkles className="h-3.5 w-3.5" /> EXPLORÁ LAS MEJORES EXPERIENCIAS
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Descubrí Salidas, Aventuras y <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-500 to-tech-blue">Tours Curados al Instante</span>
          </h2>
          <p className="text-base text-slate-500 max-w-2xl mx-auto leading-relaxed font-semibold">
            Ingresá a nuestro Marketplace completo e interactivo de viajes. Filtra por destinos favoritos, transporte, disponibilidad en tiempo real y gestioná tu reserva en segundos.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="/marketplace"
              className="group inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-2xl bg-slate-900 hover:bg-lime-500 hover:text-slate-950 px-8 py-4 text-sm font-black text-white transition-all duration-300 shadow-xl shadow-slate-200 hover:-translate-y-1"
            >
              Ver Catálogo e Iniciar Reserva
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* RESUMEN FUERTE REWARDS (DINÁMICO CMS) */}
      <section className="py-20 bg-tech-blue text-white overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="absolute top-10 right-10 h-96 w-96 rounded-full bg-lime-400 blur-3xl" />
          <div className="absolute bottom-10 left-10 h-72 w-72 rounded-full bg-blue-300 blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Texto Izquierda */}
          <div className="lg:col-span-7 space-y-6">
            <span className="inline-flex items-center rounded-full bg-lime-400/25 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-lime-400 border border-lime-400/20">
              {cmsData.rewardsBlock?.badgeText || "MEMBER CLUB"}
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight text-white">
              {cmsData.rewardsBlock?.title}
            </h2>
            <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl">
              {cmsData.rewardsBlock?.subtitle}
            </p>
            {cmsData.rewardsBlock?.pointsText && (
              <div className="flex items-center gap-2.5 text-lime-400 font-bold text-sm">
                <Sparkles className="h-5 w-5 text-lime-400" />
                {cmsData.rewardsBlock.pointsText}
              </div>
            )}
            <div className="pt-2">
              <a
                href={cmsData.header?.loginUrl || "/login"}
                className="inline-flex items-center gap-2 rounded-2xl bg-white hover:bg-slate-100 px-6 py-3.5 text-sm font-black text-tech-blue shadow-xl transition-all"
              >
                Crea tu Cuenta Club Rewards
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Imagen Derecha */}
          <div className="lg:col-span-5 relative">
            <div className="relative h-72 sm:h-96 w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <img
                src={cmsData.rewardsBlock?.imageUrl || "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80"}
                alt="Rewards Promo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-16 px-6">
        <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Compass className="h-6 w-6 text-lime-400" />
              <span className="font-black text-white text-lg">{cmsData.footer?.brandText || "TravelApp Experiences"}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Viajá, explorá y acumulá recompensas en el ecosistema turístico más completo de Argentina.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-4">Navegación</h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => setIsQuienesSomosOpen(true)} className="hover:text-white transition-colors">Quiénes Somos</button></li>
              <li><a href="#catalog" className="hover:text-white transition-colors">Catálogo de Viajes</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Servicios Exclusivos</a></li>
              <li><a href={cmsData.header?.loginUrl || "/login"} className="hover:text-white transition-colors">Portal Administrativo</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-4">Redes Sociales</h4>
            <div className="flex flex-wrap gap-2.5">
              {cmsData.redesSociales?.facebook && (
                <a
                  href={cmsData.redesSociales.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-lime-500 hover:text-slate-900 flex items-center justify-center transition-colors border border-slate-700 text-slate-300"
                >
                  <FacebookIcon className="h-4 w-4" />
                </a>
              )}
              {cmsData.redesSociales?.instagram && (
                <a
                  href={cmsData.redesSociales.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-lime-500 hover:text-slate-900 flex items-center justify-center transition-colors border border-slate-700 text-slate-300"
                >
                  <InstagramIcon className="h-4 w-4" />
                </a>
              )}
              {cmsData.redesSociales?.linkedin && (
                <a
                  href={cmsData.redesSociales.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-lime-500 hover:text-slate-900 flex items-center justify-center transition-colors border border-slate-700 text-slate-300"
                >
                  <LinkedinIcon className="h-4 w-4" />
                </a>
              )}
              {cmsData.redesSociales?.youtube && (
                <a
                  href={cmsData.redesSociales.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-lime-500 hover:text-slate-900 flex items-center justify-center transition-colors border border-slate-700 text-slate-300"
                >
                  <YoutubeIcon className="h-4 w-4" />
                </a>
              )}
              {cmsData.redesSociales?.tiktok && (
                <a
                  href={cmsData.redesSociales.tiktok}
                  target="_blank"
                  rel="noreferrer"
                  className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-lime-500 hover:text-slate-900 flex items-center justify-center transition-colors border border-slate-700 text-slate-300"
                >
                  <TiktokIcon className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-4">Soporte & Reservas</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href={cmsData.redesSociales?.whatsapp || "#"} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-lime-400 hover:underline">
                  <Phone className="h-3 w-3" /> Contactar por WhatsApp
                </a>
              </li>
              <li className="text-[10px] text-slate-500">Atención personalizada las 24hs.</li>
            </ul>
          </div>
        </div>

        <div className="mx-auto max-w-7xl border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <p className="order-2 md:order-1 text-center md:text-left">
            {cmsData.footer?.copyrightText || "© 2026 TravelApp Experiences. Una marca de TravelApp s.a.s."}
          </p>
          <div className="order-1 md:order-2 flex flex-wrap items-center justify-center gap-4">
            <RenderLegalSeal content={cmsData.sellosLegales?.arcaQr} alt="ARCA" />
            <RenderLegalSeal content={cmsData.sellosLegales?.baseDatosSello} alt="Base de Datos" />
          </div>
          <div className="order-3 flex gap-4">
            <a href="#" className="hover:text-slate-300">Términos de Servicio</a>
            <a href="#" className="hover:text-slate-300">Políticas de Privacidad</a>
          </div>
        </div>
      </footer>

      {/* ======================================================== */}
      {/* MODAL DETALLES DEL SERVICIO */}
      {/* ======================================================== */}
      {activeServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl relative animate-scaleUp">
            <button
              onClick={() => setActiveServiceModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold text-tech-blue border-b border-slate-100 pb-3 pr-8">
              {activeServiceModal.title}
            </h3>
            <div className="mt-4 text-sm text-slate-600 leading-relaxed space-y-4">
              {activeServiceModal.imageUrl && (
                <div className="h-44 w-full rounded-2xl overflow-hidden bg-slate-100">
                  <img src={activeServiceModal.imageUrl} alt={activeServiceModal.title} className="w-full h-full object-cover" />
                </div>
              )}
              <p className="font-medium text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {activeServiceModal.summary}
              </p>
              <p className="whitespace-pre-line text-xs">
                {activeServiceModal.modalDetail || "Detalles en carga administrativa."}
              </p>
            </div>
            <button
              onClick={() => setActiveServiceModal(null)}
              className="mt-6 w-full rounded-xl bg-tech-blue py-3 text-sm font-bold text-white text-center hover:brightness-105"
            >
              Entendido
            </button>
          </div>
        </div>
      )}



      {/* ======================================================== */}
      {/* MODAL QUIÉNES SOMOS */}
      {/* ======================================================== */}
      {isQuienesSomosOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl relative animate-scaleUp">
            <button
              onClick={() => setIsQuienesSomosOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold text-tech-blue border-b border-slate-100 pb-3 pr-8 flex items-center gap-1.5">
              <Users className="h-5 w-5 text-tech-blue" /> Quiénes Somos
            </h3>
            <div className="mt-4 text-sm text-slate-600 leading-relaxed max-h-[50vh] overflow-y-auto pr-1">
              <p className="font-bold text-slate-800 text-base mb-2">TravelApp Experiences</p>
              <p className="whitespace-pre-line text-xs">
                {`Somos la división de experiencias exclusivas y tours turísticos de TravelApp s.a.s.\n\nNuestra misión es conectar a viajeros con lo mejor del paisaje y la gastronomía de Argentina, garantizando traslados confortables, la mejor atención al cliente y acumulación de puntos integrados a todo nuestro ecosistema tecnológico de movilidad.`}
              </p>
            </div>
            <button
              onClick={() => setIsQuienesSomosOpen(false)}
              className="mt-6 w-full rounded-xl bg-tech-blue py-3 text-sm font-bold text-white text-center hover:brightness-105"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
