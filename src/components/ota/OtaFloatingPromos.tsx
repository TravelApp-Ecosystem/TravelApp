"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  Flame,
  Sparkles,
  Car,
  Headphones,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Percent,
} from "lucide-react";

export function OtaFloatingPromos() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const promos = [
    {
      id: "cuotas",
      badge: "Financiación Exclusiva",
      badgeColor: "bg-blue-100 text-[#0a2a5b]",
      icon: <CreditCard className="w-5 h-5 text-[#0a2a5b]" />,
      title: "Hasta 12 Cuotas Fijas",
      desc: "Pagá tus vuelos y paquetes con Visa, Mastercard y promociones bancarias.",
      cta: "Ver bancos",
      href: "/marketplace?filter=financiacion",
      accent: "border-blue-100 hover:border-blue-300",
    },
    {
      id: "sale",
      badge: "🔥 Oferta de Temporada",
      badgeColor: "bg-orange-100 text-[#ff5a19]",
      icon: <Flame className="w-5 h-5 text-[#ff5a19]" />,
      title: "Travel Sale: Hasta 40% OFF",
      desc: "Descuentos directos en paquetes a Bariloche, Mendoza y el Caribe.",
      cta: "Ver ofertas",
      href: "/marketplace?promo=travelsale",
      accent: "border-orange-100 hover:border-orange-300",
    },
    {
      id: "rewards",
      badge: "Club de Puntos",
      badgeColor: "bg-amber-100 text-amber-900",
      icon: <Sparkles className="w-5 h-5 text-[#e5a93b]" />,
      title: "Sumá 5% de Cashback",
      desc: "Cada viaje acumula puntos Rewards para canjear en tus próximas vacaciones.",
      cta: "Conocer Rewards",
      href: "/landing/rewards",
      accent: "border-amber-100 hover:border-amber-300",
    },
    {
      id: "travelcab",
      badge: "Ecosistema Integrado",
      badgeColor: "bg-red-100 text-[#ff4f5a]",
      icon: <Car className="w-5 h-5 text-[#ff5a19]" />,
      title: "Traslados Bonificados",
      desc: "TravelCab te lleva al aeropuerto sin cargo con la compra de tu paquete.",
      cta: "Pedir traslado",
      href: "/landing/travelcab",
      accent: "border-red-100 hover:border-red-300",
    },
    {
      id: "atencion",
      badge: "Atención Humana 24/7",
      badgeColor: "bg-emerald-100 text-emerald-800",
      icon: <Headphones className="w-5 h-5 text-emerald-600" />,
      title: "Asesores Reales en Argentina",
      desc: "Soporte personalizado vía WhatsApp antes, durante y después del viaje.",
      cta: "Consultar ahora",
      href: "https://wa.me/5493812020050",
      accent: "border-emerald-100 hover:border-emerald-300",
    },
  ];

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const cardWidth = 280;
      const newIdx = Math.round(scrollLeft / cardWidth);
      setActiveIdx(Math.min(Math.max(newIdx, 0), promos.length - 1));
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
      {/* Contenedor Flotante Estilo Dock */}
      <div className="relative">
        {/* Barra de Título y Controles (accesibles en mobile y desktop) */}
        <div className="flex items-center justify-between mb-2.5 sm:mb-2 px-1">
          <span className="text-xs font-bold text-slate-800 sm:text-white/90 drop-shadow-sm flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-[#e5a93b]" />
            Beneficios & Financiación ({promos.length})
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Beneficio anterior"
              className="p-1.5 rounded-full bg-white text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Beneficio siguiente"
              className="p-1.5 rounded-full bg-white text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Carrusel Horizontal de Tarjetas Flotantes */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none overscroll-x-contain select-none snap-x snap-proximity scroll-smooth"
        >
          {promos.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              draggable={false}
              className={`flex-none w-[76vw] max-w-[275px] sm:w-[290px] bg-white rounded-2xl p-4 sm:p-5 shadow-xl hover:shadow-2xl transition-all duration-300 border ${item.accent} flex flex-col justify-between group snap-start cursor-pointer`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${item.badgeColor}`}>
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

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0a2a5b] group-hover:text-[#ff5a19] transition-colors">
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
          {promos.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => scrollToIdx(idx)}
              aria-label={`Ir al beneficio ${idx + 1}`}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                idx === activeIdx
                  ? "w-5 h-1.5 bg-[#FF5A19]"
                  : "w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
