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
import { doc, onSnapshot, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Tour } from "@/types/experiences";

const CONVERSION_RATE = 1000; // 1 USD = 1000 ARS (Valor de referencia para conversión dinámica)

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

export default function ExperienceLanding() {
  const [cmsData, setCmsData] = useState<any>(DEFAULT_EXPERIENCE_CMS_DATA);
  const [tours, setTours] = useState<Tour[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Hero Slider State
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Modales
  const [activeServiceModal, setActiveServiceModal] = useState<any | null>(null);
  const [activeTourDetail, setActiveTourDetail] = useState<Tour | null>(null);
  const [isQuienesSomosOpen, setIsQuienesSomosOpen] = useState(false);

  // Filtros del Catálogo
  const [searchDest, setSearchDest] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterTransport, setFilterTransport] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState<'ARS' | 'USD'>('USD');

  // Listeners de Firestore
  useEffect(() => {
    // 1. Escuchar CMS Config en tiempo real
    const unsubCms = onSnapshot(doc(db, "cms", "landing_experience"), (snap) => {
      if (snap.exists()) {
        setCmsData({
          ...DEFAULT_EXPERIENCE_CMS_DATA,
          ...snap.data()
        });
      }
    });

    // 2. Escuchar colección de viajes (experiences)
    const unsubTours = onSnapshot(collection(db, "experiences"), (snap) => {
      const list: Tour[] = [];
      snap.forEach(d => {
        list.push(d.data() as Tour);
      });
      setTours(list);
    });

    return () => {
      unsubCms();
      unsubTours();
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

  // Lista de destinos únicos para el filtro
  const uniqueDestinations = Array.from(new Set(tours.map(t => t.location.split(',')[0].trim())));
  const uniqueTransports = Array.from(new Set(tours.map(t => t.transportation).filter(Boolean)));
  const uniqueOrigins = Array.from(new Set(tours.map(t => t.departureOrigin).filter(Boolean)));

  // Filtrado de viajes
  const filteredTours = tours.filter(tour => {
    const matchDest = !searchDest || tour.location.toLowerCase().includes(searchDest.toLowerCase());
    const matchType = !filterType || tour.tripType === filterType;
    const matchTransport = !filterTransport || tour.transportation === filterTransport;
    const matchOrigin = !filterOrigin || tour.departureOrigin === filterOrigin;
    const matchDate = !filterDate || tour.departureDate >= filterDate;
    return matchDest && matchType && matchTransport && matchOrigin && matchDate;
  });

  // Helper de conversión de precios
  const formatPrice = (price: number = 0, fromCurrency: 'ARS' | 'USD') => {
    const safePrice = price || 0;
    if (fromCurrency === selectedCurrency) {
      return `${selectedCurrency === 'ARS' ? '$' : 'USD '} ${safePrice.toLocaleString('es-AR')}`;
    }
    // Conversión aproximada
    let converted = safePrice;
    if (fromCurrency === 'ARS' && selectedCurrency === 'USD') {
      converted = safePrice / CONVERSION_RATE;
    } else if (fromCurrency === 'USD' && selectedCurrency === 'ARS') {
      converted = safePrice * CONVERSION_RATE;
    }
    return `${selectedCurrency === 'ARS' ? '$' : 'USD '} ${Math.round(converted).toLocaleString('es-AR')}`;
  };

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

      {/* CATÁLOGO DE VIAJES INTERACTIVO CON FILTROS */}
      <section id="catalog" className="py-20 bg-white border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-6">
          
          {/* Título e Selector Bimonetario */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6 border-b border-slate-100 pb-6">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-tech-blue">Planificá tu destino</span>
              <h2 className="mt-2 text-3xl font-black text-slate-800">Catálogo de Viajes Disponibles</h2>
              <p className="text-sm text-slate-500 mt-2">Filtra por fecha, destino, transporte y más para encontrar tu viaje perfecto.</p>
            </div>
            
            {/* Toggle de Monedas */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 w-max shadow-inner">
              <button
                onClick={() => setSelectedCurrency('ARS')}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase transition-all ${
                  selectedCurrency === 'ARS' ? 'bg-white text-tech-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Pesos ($)
              </button>
              <button
                onClick={() => setSelectedCurrency('USD')}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase transition-all ${
                  selectedCurrency === 'USD' ? 'bg-white text-tech-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Dólares (USD)
              </button>
            </div>
          </div>

          {/* FILTROS INTERACTIVOS */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-10 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            
            {/* Destino Selector */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Destino / Localidad</label>
              <select
                value={searchDest}
                onChange={(e) => setSearchDest(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs bg-white focus:outline-none"
              >
                <option value="">Todos los Destinos</option>
                {uniqueDestinations.map(dest => (
                  <option key={dest} value={dest}>{dest}</option>
                ))}
              </select>
            </div>

            {/* Tipo de Viaje */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Tipo de Viaje</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs bg-white focus:outline-none"
              >
                <option value="">Todos los esquemas</option>
                <option value="Individual">Individual</option>
                <option value="Grupal">Grupal</option>
              </select>
            </div>

            {/* Transporte */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Medio de Transporte</label>
              <select
                value={filterTransport}
                onChange={(e) => setFilterTransport(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs bg-white focus:outline-none"
              >
                <option value="">Cualquier Transporte</option>
                {uniqueTransports.map(tr => (
                  <option key={tr} value={tr}>{tr}</option>
                ))}
              </select>
            </div>

            {/* Origen */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Origen de Salida</label>
              <select
                value={filterOrigin}
                onChange={(e) => setFilterOrigin(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs bg-white focus:outline-none"
              >
                <option value="">Cualquier Origen</option>
                {uniqueOrigins.map(ori => (
                  <option key={ori} value={ori}>{ori}</option>
                ))}
              </select>
            </div>

            {/* Fecha Salida */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">A partir de fecha</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Reset Filtros link */}
          {(searchDest || filterType || filterTransport || filterOrigin || filterDate) && (
            <button
              onClick={() => {
                setSearchDest("");
                setFilterType("");
                setFilterTransport("");
                setFilterOrigin("");
                setFilterDate("");
              }}
              className="text-xs font-bold text-red-500 hover:text-red-600 mb-6 block"
            >
              × Limpiar filtros de búsqueda
            </button>
          )}

          {/* GRID DE TARJETAS DE VIAJES */}
          {filteredTours.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
              <Compass className="mb-4 h-12 w-12 text-slate-300 animate-pulse" />
              <h3 className="text-lg font-bold text-slate-600">No encontramos viajes con esos filtros</h3>
              <p className="mt-1 text-sm text-slate-400">Intenta reestableciendo los filtros para ver otras opciones.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTours.map(tour => {
                const isAvailable = tour.availability === 'Disponible' || tour.availability === 'Cupos Limitados';
                
                return (
                  <div key={tour.id} className="flex flex-col bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    {/* Imagen Portada */}
                    <div className="h-44 w-full bg-slate-100 relative overflow-hidden">
                      <img src={tour.imageUrl || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"} alt={tour.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent"></div>
                      
                      {/* Código de Viaje */}
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-slate-900/80 text-[10px] font-black text-white uppercase backdrop-blur-sm tracking-wider">
                        {tour.id}
                      </span>

                      {/* Badge disponibilidad */}
                      <span className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-white ${
                        tour.availability === 'Disponible' ? 'bg-emerald-500' : tour.availability === 'Cupos Limitados' ? 'bg-amber-500' : 'bg-slate-500'
                      }`}>
                        {tour.availability}
                      </span>
                    </div>

                    {/* Contenido */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-tech-blue" />
                            {tour.location}
                          </span>
                          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                            {tour.tripType}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-slate-800 leading-snug line-clamp-1">
                          {tour.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {tour.description}
                        </p>
                      </div>

                      {/* Servicios Incluidos (Vista Rápida) */}
                      <div className="flex flex-wrap gap-1 border-t border-slate-100 pt-3">
                        {tour.services?.slice(0, 3).map((srv, i) => (
                          <span key={i} className="text-[10px] bg-slate-50 border border-slate-200/80 rounded px-1.5 py-0.5 text-slate-500 font-semibold truncate max-w-[80px]">
                            {srv}
                          </span>
                        ))}
                        {tour.services?.length > 3 && (
                          <span className="text-[10px] text-tech-blue font-bold px-1 py-0.5">+{tour.services.length - 3}</span>
                        )}
                      </div>

                      {/* Precios bimonetarios y botón de Ficha */}
                      <div className="border-t border-slate-100 pt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase">Tarifa Regular</span>
                            <span className="block text-sm font-semibold text-slate-500">
                              {formatPrice(tour.price, tour.currency)}
                            </span>
                          </div>
                          
                          {/* Puntos que suma */}
                          <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 text-[10px] font-black text-emerald-600 px-2 py-0.5">
                            <Award className="h-3 w-3" /> +{tour.pointsEarned} pts
                          </span>
                        </div>

                        {/* Caja Destacada Rewards */}
                        <div className="bg-lime-500/10 border border-lime-500/20 rounded-2xl p-2.5 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[9px] font-black text-lime-700 uppercase block tracking-wider leading-none">Miembro Rewards</span>
                            <span className="text-base font-black text-lime-600 mt-1 block">
                              {formatPrice(tour.priceRewards, tour.currency)}
                            </span>
                          </div>
                          <button
                            onClick={() => setActiveTourDetail(tour)}
                            className="bg-lime-500 hover:bg-lime-600 rounded-xl px-3 py-2 text-xs font-black text-gray-950 transition-colors shadow-sm"
                          >
                            Ver Ficha
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
            <ul className="space-y-2 text-xs">
              <li>
                <a href={cmsData.redesSociales?.facebook || "https://facebook.com/travelapp.ar"} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  Facebook: facebook.com/travelapp.ar
                </a>
              </li>
              <li>
                <a href={`https://instagram.com/${cmsData.redesSociales?.instagram?.replace('@', '') || 'travelapp.ar'}`} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  Instagram: {cmsData.redesSociales?.instagram || "@travelapp.ar"}
                </a>
              </li>
              <li>
                <a href={cmsData.redesSociales?.messenger || "https://m.me/travelapp.ar"} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  Messenger: {cmsData.redesSociales?.messenger || "@travelapp.ar"}
                </a>
              </li>
            </ul>
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

        <div className="mx-auto max-w-7xl border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>{cmsData.footer?.copyrightText || "© 2026 TravelApp Experiences. Una marca de TravelApp s.a.s."}</p>
          <div className="flex gap-4">
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
      {/* MODAL DETALLE DE FICHA DE VIAJE */}
      {/* ======================================================== */}
      {activeTourDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp">
            
            {/* Header Imagen */}
            <div className="h-52 w-full relative">
              <img
                src={activeTourDetail.imageUrl || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"}
                alt={activeTourDetail.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>
              
              <button
                onClick={() => setActiveTourDetail(null)}
                className="absolute top-4 right-4 text-white bg-slate-900/60 p-2 rounded-full hover:bg-slate-900/80 transition-all border border-white/10"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="absolute bottom-4 left-5 right-5 text-white">
                <span className="px-2 py-0.5 rounded bg-lime-500 text-gray-950 font-black text-[9px] uppercase tracking-widest block w-max mb-1">
                  Código: {activeTourDetail.id}
                </span>
                <h3 className="text-xl font-black leading-snug">{activeTourDetail.title}</h3>
              </div>
            </div>

            {/* Cuerpo de la ficha scrollable */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              
              {/* Info rápida */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 block font-bold uppercase text-[9px]">Destino</span>
                  <span className="font-extrabold text-slate-700 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-tech-blue" />
                    {activeTourDetail.location}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 block font-bold uppercase text-[9px]">Salida</span>
                  <span className="font-extrabold text-slate-700 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-tech-blue" />
                    {activeTourDetail.departureDate}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 block font-bold uppercase text-[9px]">Desde</span>
                  <span className="font-extrabold text-slate-700 truncate block">
                    {activeTourDetail.departureOrigin}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 block font-bold uppercase text-[9px]">Esquema</span>
                  <span className="font-extrabold text-slate-700 flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-tech-blue" />
                    {activeTourDetail.tripType} ({activeTourDetail.transportation})
                  </span>
                </div>
              </div>

              {/* Precios del modal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-slate-200 p-4 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Tarifa Público General</span>
                  <span className="text-xl font-bold text-slate-600 mt-2 block">
                    {formatPrice(activeTourDetail.price, activeTourDetail.currency)}
                  </span>
                </div>

                <div className="bg-lime-500/10 border border-lime-500/20 p-4 rounded-2xl flex flex-col justify-between relative overflow-hidden">
                  <span className="text-[10px] font-black text-lime-700 uppercase tracking-wide block">Tarifa Club Rewards</span>
                  <span className="text-2xl font-black text-lime-600 mt-2 block">
                    {formatPrice(activeTourDetail.priceRewards, activeTourDetail.currency)}
                  </span>
                  <span className="absolute top-2 right-2 inline-flex items-center gap-0.5 rounded bg-lime-500 text-gray-950 font-black text-[9px] px-1.5 py-0.5">
                    +{activeTourDetail.pointsEarned} pts
                  </span>
                </div>
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-tech-blue" /> Descripción General
                </h4>
                <p className="text-slate-500 text-xs leading-relaxed leading-relaxed whitespace-pre-line">
                  {activeTourDetail.description}
                </p>
              </div>

              {/* Servicios Incluidos */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-tech-blue" /> Servicios Incluidos
                </h4>
                <div className="flex flex-wrap gap-2">
                  {activeTourDetail.services?.map((srv, i) => (
                    <span key={i} className="bg-slate-100 border border-slate-200 text-slate-600 rounded-lg px-2.5 py-1 text-xs font-bold">
                      ✓ {srv}
                    </span>
                  ))}
                </div>
              </div>

              {/* Observaciones */}
              {activeTourDetail.observations && (
                <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl space-y-1">
                  <h5 className="text-xs font-extrabold text-amber-700 uppercase tracking-wide">Observaciones importantes</h5>
                  <p className="text-[11px] text-amber-800 leading-relaxed">{activeTourDetail.observations}</p>
                </div>
              )}

            </div>

            {/* Footer Modal Controles */}
            <div className="bg-slate-50 border-t border-slate-100 p-4 flex gap-3">
              <button
                onClick={() => setActiveTourDetail(null)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-500 hover:bg-slate-50 text-center"
              >
                Cerrar Ficha
              </button>
              <a
                href={`https://wa.me/5493814188106?text=Hola!%20Quiero%20reservar%20el%20viaje%20con%20código%20${activeTourDetail.id}%20(${activeTourDetail.title}).`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 rounded-xl bg-lime-500 hover:bg-lime-600 py-3 text-xs font-black text-gray-950 text-center flex items-center justify-center gap-1.5 shadow-md shadow-lime-500/20"
              >
                <Phone className="h-4 w-4" /> Reservar por WhatsApp
              </a>
            </div>

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
