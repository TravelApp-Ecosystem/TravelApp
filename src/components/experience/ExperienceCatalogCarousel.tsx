"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  Award,
  Car,
  Utensils,
  Mountain,
  Sun,
  Wine,
  Users,
} from "lucide-react";

export interface ReceptiveTourItem {
  id: string;
  title: string;
  category: string;
  destination: string;
  duration: string;
  difficulty: "Fácil" | "Moderada" | "Aventura";
  imageUrl: string;
  priceArs: number;
  priceUsd: number;
  pointsEarned: number;
  rating: number;
  badge?: string;
  includedServices: string[];
  installmentsText: string;
  url: string;
}

interface ExperienceCatalogCarouselProps {
  currency?: "ARS" | "USD";
  items?: ReceptiveTourItem[];
}

const DEFAULT_RECEPTIVE_TOURS: ReceptiveTourItem[] = [
  {
    id: "tour-salinas-grandes",
    title: "Salinas Grandes, Purmamarca & Los Colorados",
    category: "Puna & Quebrada",
    destination: "Jujuy, Argentina",
    duration: "Día Completo (10 hs)",
    difficulty: "Fácil",
    imageUrl:
      "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1200&q=90",
    priceArs: 48500,
    priceUsd: 40,
    pointsEarned: 485,
    rating: 5.0,
    badge: "Más Elegido",
    includedServices: [
      "Pick-up en tu hotel",
      "Guía matriculado bilingüe",
      "Paseo por Cuesta de Lipán",
      "Seguro de asistencia",
    ],
    installmentsText: "12 cuotas fijas de $5.200",
    url: "/landing/experience/marketplace?id=salinas-grandes",
  },
  {
    id: "tour-cafayate-bodegas",
    title: "Cafayate, Quebrada de las Conchas & Bodegas",
    category: "Ruta del Vino",
    destination: "Salta, Argentina",
    duration: "Día Completo (9 hs)",
    difficulty: "Fácil",
    imageUrl:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=90",
    priceArs: 45000,
    priceUsd: 38,
    pointsEarned: 450,
    rating: 4.9,
    badge: "Gastronomía & Vinos",
    includedServices: [
      "Visita Anfiteatro y Garganta",
      "Degustación en 2 bodegas",
      "Pick-up en hotel céntrico",
      "Almuerzo criollo opcional",
    ],
    installmentsText: "12 cuotas fijas de $4.850",
    url: "/landing/experience/marketplace?id=cafayate-bodegas",
  },
  {
    id: "tour-hornocal-humahuaca",
    title: "Serranía del Hornocal (14 Colores) & Humahuaca",
    category: "Aventura Andina",
    destination: "Humahuaca, Jujuy",
    duration: "Día Completo (12 hs)",
    difficulty: "Moderada",
    imageUrl:
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1200&q=90",
    priceArs: 58000,
    priceUsd: 48,
    pointsEarned: 580,
    rating: 5.0,
    badge: "Imperdible 2026",
    includedServices: [
      "Traslado en 4x4 a 4.350 msnm",
      "Guía de comunidad andina",
      "Visita Tilcara y Uquía",
      "Kit de hidratación",
    ],
    installmentsText: "12 cuotas fijas de $6.200",
    url: "/landing/experience/marketplace?id=hornocal-humahuaca",
  },
  {
    id: "tour-cachi-cardones",
    title: "Cachi por Cuesta del Obispo & Los Cardones",
    category: "Valles Calchaquíes",
    destination: "Cachi, Salta",
    duration: "Día Completo (10 hs)",
    difficulty: "Fácil",
    imageUrl:
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=90",
    priceArs: 46000,
    priceUsd: 39,
    pointsEarned: 460,
    rating: 4.9,
    badge: "Paisaje Mágico",
    includedServices: [
      "Piedra del Molino 3.348 msnm",
      "Parque Nacional Los Cardones",
      "Tiempo libre en Cachi histórico",
      "Guía y seguro incluidos",
    ],
    installmentsText: "12 cuotas fijas de $4.950",
    url: "/landing/experience/marketplace?id=cachi-cardones",
  },
  {
    id: "tour-tafi-quilmes",
    title: "Tafí del Valle & Ruinas Sagradas de Quilmes",
    category: "Historia & Yungas",
    destination: "Tucumán, Argentina",
    duration: "Día Completo (9 hs)",
    difficulty: "Fácil",
    imageUrl:
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=90",
    priceArs: 42000,
    priceUsd: 35,
    pointsEarned: 420,
    rating: 4.8,
    badge: "Arqueología Ancestral",
    includedServices: [
      "Quebrada de Los Sosa y El Indio",
      "Visita Museo de Quilmes",
      "Dique La Angostura",
      "Coordinación profesional",
    ],
    installmentsText: "12 cuotas fijas de $4.500",
    url: "/landing/experience/marketplace?id=tafi-quilmes",
  },
  {
    id: "tour-cabalgata-calchaqui",
    title: "Cabalgata Calchaquí, Atardecer & Fogón Criollo",
    category: "Turismo Activo",
    destination: "San Lorenzo / Salta",
    duration: "Medio Día (4 hs)",
    difficulty: "Fácil",
    imageUrl:
      "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=1200&q=90",
    priceArs: 38000,
    priceUsd: 32,
    pointsEarned: 380,
    rating: 4.9,
    badge: "Apto Familia",
    includedServices: [
      "Caballos mansos y casco",
      "Empanadas salteñas y vino",
      "Guía baquiano local",
      "Fotos de recuerdo",
    ],
    installmentsText: "12 cuotas fijas de $4.100",
    url: "/landing/experience/marketplace?id=cabalgata-calchaqui",
  },
  {
    id: "tour-yungas-trekking",
    title: "Trekking en Yungas & Cascadas Escondidas",
    category: "Ecoturismo",
    destination: "Yungas Tucumanas",
    duration: "Medio Día (5 hs)",
    difficulty: "Moderada",
    imageUrl:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=90",
    priceArs: 32000,
    priceUsd: 28,
    pointsEarned: 320,
    rating: 4.8,
    badge: "Naturaleza Pura",
    includedServices: [
      "Bastones de trekking",
      "Snack energético y frutas",
      "Guía de montaña certificado",
      "Baño en cascada natural",
    ],
    installmentsText: "12 cuotas fijas de $3.450",
    url: "/landing/experience/marketplace?id=yungas-trekking",
  },
  {
    id: "tour-iruya-travesia",
    title: "Travesía Iruya: El Pueblo Colgado del Cerro",
    category: "Alta Aventura",
    destination: "Iruya, Salta / Jujuy",
    duration: "2 Días / 1 Noche",
    difficulty: "Aventura",
    imageUrl:
      "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1200&q=90",
    priceArs: 98000,
    priceUsd: 82,
    pointsEarned: 980,
    rating: 5.0,
    badge: "Experiencia Exclusiva",
    includedServices: [
      "Transporte 4x4 de alta montaña",
      "Noche de posada colonial",
      "Trekking a San Isidro",
      "Pensión completa regional",
    ],
    installmentsText: "12 cuotas fijas de $10.500",
    url: "/landing/experience/marketplace?id=iruya-travesia",
  },
];

export function ExperienceCatalogCarousel({
  currency = "ARS",
  items,
}: ExperienceCatalogCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const activeItems = items && items.length > 0 ? items : DEFAULT_RECEPTIVE_TOURS;

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const cardWidth = 320;
      const newIdx = Math.round(scrollLeft / cardWidth);
      setActiveIdx(Math.min(Math.max(newIdx, 0), activeItems.length - 1));
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -340 : 340;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <section id="experiencias-destacadas" className="py-12 sm:py-24 bg-white font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado Editorial Receptivo */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-6 sm:mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-[#ff4f5a] text-xs font-bold uppercase mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#ff4f5a]" />
              <span>Turismo Receptivo · Salidas Confirmadas</span>
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              Experiencias Auténticas en el Norte
            </h2>
            <p className="text-xs sm:text-base text-slate-500 font-medium mt-1.5 sm:mt-2 max-w-2xl">
              Excursiones guiadas con pick-up en hotel, baquianos locales, seguros de montaña y el respaldo de TravelApp Experience.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Ver excursión anterior"
              className="p-2.5 sm:p-3 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Ver excursión siguiente"
              className="p-2.5 sm:p-3 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Carrusel de Tarjetas Receptivas */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 pt-2 scrollbar-none overscroll-x-contain select-none snap-x snap-proximity scroll-smooth"
        >
          {activeItems.map((item) => {
            const formattedPrice =
              currency === "ARS"
                ? `$${item.priceArs.toLocaleString("es-AR")}`
                : `u$s ${item.priceUsd}`;

            return (
              <div
                key={item.id}
                className="flex-none w-[82vw] max-w-[340px] sm:w-[350px] bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100 flex flex-col snap-start group"
              >
                {/* 1. Fotografía HD con Badges */}
                <div className="relative h-60 w-full overflow-hidden bg-slate-900">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 300px, 350px"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  {/* Badge de Dificultad */}
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold shadow-sm">
                    <Mountain className="w-3.5 h-3.5 text-[#ff4f5a]" />
                    <span>Dificultad: {item.difficulty}</span>
                  </div>

                  {/* Badge de Promoción si existe */}
                  {item.badge && (
                    <div className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full bg-[#ff4f5a] text-white text-[11px] font-extrabold uppercase tracking-wide shadow-md">
                      {item.badge}
                    </div>
                  )}

                  {/* Duración al pie de la foto */}
                  <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-slate-800 text-[11px] font-bold">
                    <Clock className="w-3 h-3 text-[#ff4f5a]" />
                    <span>{item.duration}</span>
                  </div>
                </div>

                {/* 2. Cuerpo Editorial de la Tarjeta */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1.5">
                      <span className="text-[#ff4f5a] font-extrabold uppercase tracking-wider text-[11px]">
                        {item.category}
                      </span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-[#ff4f5a]" />
                        {item.destination}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-[#0a2a5b] transition-colors leading-snug line-clamp-2">
                      {item.title}
                    </h3>

                    {/* Servicios Incluidos */}
                    <div className="mt-3.5 space-y-1.5 border-t border-slate-100 pt-3">
                      {item.includedServices.slice(0, 3).map((serv, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-center gap-2 text-xs text-slate-600 font-medium"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{serv}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. Bloque de Tarifas, Cuotas y Botón de Reserva */}
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-xs font-bold text-slate-400">Tarifa por persona</span>
                      <span className="text-xl sm:text-2xl font-black text-slate-900">
                        {formattedPrice}
                      </span>
                    </div>

                    <div className="text-[11px] font-bold text-emerald-600 mb-3">
                      {item.installmentsText}
                    </div>

                    {/* Puntos Rewards */}
                    <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-amber-50 text-amber-900 text-[10px] font-extrabold mb-3 border border-amber-200/60">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#e5a93b]" />
                        TravelApp Rewards:
                      </span>
                      <span className="text-[#e5a93b] font-black">+{item.pointsEarned} pts</span>
                    </div>

                    <Link
                      href={item.url}
                      className="w-full py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-[#0a2a5b] hover:bg-[#071d3f] text-white text-xs sm:text-sm font-extrabold shadow-md transition-all flex items-center justify-center gap-2 group/btn cursor-pointer"
                    >
                      <span>Reservar Excursión</span>
                      <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
          {/* Espaciador final para permitir scroll completo de la última tarjeta */}
          <div className="w-4 flex-none" />
        </div>

        {/* Indicadores de puntos en mobile */}
        <div className="flex justify-center items-center gap-1.5 mt-3 sm:hidden">
          {activeItems.slice(0, 8).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (scrollRef.current) {
                  const cardWidth = 320;
                  scrollRef.current.scrollTo({ left: idx * cardWidth, behavior: "smooth" });
                  setActiveIdx(idx);
                }
              }}
              aria-label={`Ir a la excursión ${idx + 1}`}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                idx === activeIdx
                  ? "w-6 h-1.5 bg-[#ff4f5a]"
                  : "w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>

        {/* 4. Banner Llamado a la Acción (CTA) para el Catálogo Completo */}
        <div className="mt-12 p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[#0a2a5b] via-[#071d3f] to-[#122e57] text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10">
          <div className="max-w-2xl text-center md:text-left">
            <span className="px-3.5 py-1 rounded-full bg-[#ff4f5a]/20 text-[#ff4f5a] text-xs font-bold uppercase tracking-wider inline-block mb-3 border border-[#ff4f5a]/30">
              Catálogo Completo de Receptivo
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              ¿Buscás circuitos a medida o salidas privadas?
            </h3>
            <p className="text-sm sm:text-base text-slate-200 font-medium mt-2">
              Coordinamos salidas grupales, viajes de afinidad y circuitos privados con vehículos ejecutivos TravelCab en Salta, Jujuy y Tucumán.
            </p>
          </div>

          <Link
            href="/landing/experience/marketplace"
            className="flex items-center gap-3 px-8 py-4 rounded-full bg-[#ff4f5a] hover:bg-[#e63e49] text-white font-bold text-sm sm:text-base shadow-lg shadow-[#ff4f5a]/30 transition-all shrink-0 cursor-pointer"
          >
            <span>Ver Todas las Excursiones</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
