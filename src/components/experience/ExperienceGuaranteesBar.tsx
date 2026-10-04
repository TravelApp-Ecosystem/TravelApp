"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import {
  Award,
  ShieldCheck,
  Car,
  CreditCard,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Compass,
} from "lucide-react";

export function ExperienceGuaranteesBar() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const guarantees = [
    {
      id: "guias",
      badge: "100% Verificados",
      badgeColor: "bg-emerald-100 text-emerald-800",
      icon: <Award className="w-5 h-5 text-emerald-600" />,
      title: "Guías Matriculados & Baquianos",
      desc: "Profesionales acreditados por Secretarías de Turismo con conocimiento ancestral del territorio.",
      cta: "Conocer guías",
      href: "/landing/experience/marketplace",
      accent: "border-emerald-100 hover:border-emerald-300",
    },
    {
      id: "seguro",
      badge: "Seguridad Total",
      badgeColor: "bg-blue-100 text-[#0a2a5b]",
      icon: <ShieldCheck className="w-5 h-5 text-[#0a2a5b]" />,
      title: "Seguro de Asistencia Incluido",
      desc: "Todas las salidas cuentan con seguro de turismo activo y seguimiento satelital de guardia.",
      cta: "Ver cobertura",
      href: "/landing/experience/marketplace",
      accent: "border-blue-100 hover:border-blue-300",
    },
    {
      id: "travelcab",
      badge: "Conectividad TravelCab",
      badgeColor: "bg-orange-100 text-[#ff5a19]",
      icon: <Car className="w-5 h-5 text-[#ff5a19]" />,
      title: "Pick-up en la Puerta de tu Hotel",
      desc: "Unidades ejecutivas habilitadas te buscan y regresan a tu alojamiento sin demoras.",
      cta: "Traslados TravelCab",
      href: "/landing/travelcab",
      accent: "border-orange-100 hover:border-orange-300",
    },
    {
      id: "cuotas",
      badge: "Financiación Directa",
      badgeColor: "bg-red-100 text-[#ff4f5a]",
      icon: <CreditCard className="w-5 h-5 text-[#ff4f5a]" />,
      title: "Hasta 12 Cuotas Fijas en Pesos",
      desc: "Pagá con tarjeta o congelá tu tarifa sin interés reservando con Time-to-Pay.",
      cta: "Ver promociones",
      href: "/landing/experience/marketplace",
      accent: "border-red-100 hover:border-red-300",
    },
    {
      id: "rewards",
      badge: "Club de Puntos",
      badgeColor: "bg-amber-100 text-amber-900",
      icon: <Sparkles className="w-5 h-5 text-[#e5a93b]" />,
      title: "5% de Cashback en Rewards",
      desc: "Cada excursión acumula puntos para canjear en traslados al aeropuerto o futuras salidas.",
      cta: "Conocer Rewards",
      href: "/landing/rewards",
      accent: "border-amber-100 hover:border-amber-300",
    },
  ];

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const cardWidth = 280;
      const newIdx = Math.round(scrollLeft / cardWidth);
      setActiveIdx(Math.min(Math.max(newIdx, 0), guarantees.length - 1));
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -280 : 280;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const scrollToIdx = (idx: number) => {
    if (scrollRef.current) {
      const cardWidth = 280;
      scrollRef.current.scrollTo({ left: idx * cardWidth, behavior: "smooth" });
      setActiveIdx(idx);
    }
  };

  return (
    <section className="relative z-30 mt-3 sm:-mt-10 lg:-mt-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-sans">
      <div className="relative">
        
        {/* Barra Superior con Controles (desktop & mobile) */}
        <div className="flex items-center justify-between mb-2.5 sm:mb-2 px-1">
          <span className="text-xs font-bold text-slate-800 sm:text-white/90 drop-shadow-sm flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#ff4f5a]" />
            Garantías Oficiales en Territorio ({guarantees.length})
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Garantía anterior"
              className="p-1.5 rounded-full bg-white text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Garantía siguiente"
              className="p-1.5 rounded-full bg-white text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Carrusel Horizontal de Tarjetas de Garantía */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none overscroll-x-contain select-none snap-x snap-proximity scroll-smooth"
        >
          {guarantees.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              draggable={false}
              className={`flex-none w-[76vw] max-w-[275px] sm:w-[290px] bg-white rounded-2xl p-4 sm:p-5 shadow-xl hover:shadow-2xl transition-all duration-300 border ${item.accent} flex flex-col justify-between group snap-start cursor-pointer`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                </div>

                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug group-hover:text-[#0a2a5b] transition-colors">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1.5">
                  {item.desc}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0a2a5b] group-hover:text-[#ff4f5a] transition-colors">
                <span>{item.cta}</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
          {/* Espaciador final para permitir scroll completo de la 5ta tarjeta */}
          <div className="w-4 flex-none" />
        </div>

        {/* Indicadores de puntos en mobile */}
        <div className="flex justify-center items-center gap-1.5 mt-2 sm:hidden">
          {guarantees.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => scrollToIdx(idx)}
              aria-label={`Ir a la garantía ${idx + 1}`}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                idx === activeIdx
                  ? "w-5 h-1.5 bg-[#ff4f5a]"
                  : "w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
