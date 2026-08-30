"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles, Tag } from "lucide-react";

export interface PromoCard {
  title: string;
  badge?: string;
  subtitle?: string;
  description?: string;
  imageUrl: string;
  url: string;
  ctaText?: string;
  gradient?: string;
}

interface OverlappingCardCarouselProps {
  cards: PromoCard[];
  title?: string;
  subtitle?: string;
}

const GRADIENT_PRESETS = [
  "from-blue-600/90 via-indigo-600/80 to-purple-800/90",
  "from-amber-500/90 via-orange-600/80 to-red-700/90",
  "from-emerald-600/90 via-teal-600/80 to-cyan-800/90",
  "from-rose-600/90 via-pink-600/80 to-purple-800/90",
  "from-slate-900/90 via-slate-800/85 to-indigo-950/90",
];

export const OverlappingCardCarousel: React.FC<OverlappingCardCarouselProps> = ({
  cards = [],
  title = "Novedades y Beneficios",
  subtitle = "Deslizá para descubrir promociones exclusivas",
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  if (!cards || cards.length === 0) return null;

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  // Touch Swipe Handlers (Swipe táctil natural en móviles)
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  return (
    <div className="w-full py-4 select-none">
      {/* Header del Carrusel */}
      {(title || subtitle) && (
        <div className="flex items-center justify-between px-4 mb-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5 drop-shadow-xs">
              <Sparkles className="h-4 w-4 text-amber-400" />
              {title}
            </h3>
            {subtitle && <p className="text-xs text-white/80 font-medium drop-shadow-2xs">{subtitle}</p>}
          </div>

          {/* Indicadores / Controles de navegación */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              aria-label="Anterior"
              className="h-7 w-7 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-xs flex items-center justify-center transition active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Siguiente"
              className="h-7 w-7 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-xs flex items-center justify-center transition active:scale-95"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Contenedor con efecto de apilado / Superposición 3D tipo Mercado Pago */}
      <div
        ref={containerRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="relative w-full h-[220px] sm:h-[240px] px-4 overflow-visible flex items-center justify-center"
      >
        {cards.map((card, idx) => {
          // Calcular la distancia relativa al índice activo
          const diff = (idx - activeIndex + cards.length) % cards.length;
          
          // Solo renderizamos las 3 tarjetas más cercanas para optimizar rendimiento
          const isCurrent = diff === 0;
          const isNext = diff === 1 || (diff === -(cards.length - 1));
          const isPrev = diff === cards.length - 1;

          let transformStyle = "opacity-0 pointer-events-none scale-75 translate-x-20 z-0";

          if (isCurrent) {
            transformStyle = "opacity-100 scale-100 translate-x-0 z-30 shadow-2xl shadow-slate-900/25";
          } else if (isNext) {
            transformStyle = "opacity-85 scale-[0.92] translate-x-6 sm:translate-x-10 z-20 shadow-lg cursor-pointer";
          } else if (isPrev) {
            transformStyle = "opacity-40 scale-[0.85] -translate-x-6 sm:-translate-x-10 z-10 pointer-events-none";
          } else {
            return null;
          }

          const gradient = card.gradient || GRADIENT_PRESETS[idx % GRADIENT_PRESETS.length];

          return (
            <div
              key={idx}
              onClick={() => {
                if (isNext) handleNext();
                if (isCurrent && card.url) {
                  window.open(card.url, "_blank");
                }
              }}
              className={`absolute w-[88%] sm:w-[380px] h-[190px] sm:h-[210px] rounded-3xl overflow-hidden transition-all duration-500 ease-out border border-white/20 cursor-pointer ${transformStyle}`}
            >
              {/* Imagen de Fondo */}
              <img
                src={card.imageUrl}
                alt={card.title}
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Degradado Vibrante */}
              <div className={`absolute inset-0 bg-gradient-to-tr ${gradient}`} />

              {/* Contenido Minimalista de Alto Impacto */}
              <div className="relative z-10 p-5 h-full flex flex-col justify-between text-white">
                
                {/* Badge Superior Flotante */}
                <div className="flex items-center justify-between">
                  {card.badge ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/25 backdrop-blur-md border border-white/30 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white shadow-xs">
                      <Tag className="h-3 w-3 text-amber-300" />
                      {card.badge}
                    </span>
                  ) : (
                    <span />
                  )}

                  <span className="text-[10px] font-bold text-white/70 bg-black/20 px-2 py-0.5 rounded-full">
                    {idx + 1} / {cards.length}
                  </span>
                </div>

                {/* Título y Subtítulo Corto (Sin párrafos pesados) */}
                <div className="space-y-1">
                  <h4 className="text-lg sm:text-xl font-black text-white leading-tight drop-shadow-sm line-clamp-1">
                    {card.title}
                  </h4>
                  <p className="text-xs text-white/90 font-medium line-clamp-2 drop-shadow-xs">
                    {card.subtitle || card.description}
                  </p>
                </div>

                {/* Botón de Acción Rápido (CTA) */}
                <div className="flex items-center justify-between pt-1">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-white bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/30 transition-all shadow-sm">
                    {card.ctaText || "Ver Beneficio"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>

                  <span className="text-[9px] text-white/60 font-semibold uppercase tracking-wider">
                    TravelApp Rewards
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Paginador de Puntos (Dots) */}
      <div className="flex items-center justify-center gap-1.5 mt-2">
        {cards.map((_, dotIdx) => (
          <button
            key={dotIdx}
            onClick={() => setActiveIndex(dotIdx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              dotIdx === activeIndex ? "w-6 bg-[#ff6b00]" : "w-1.5 bg-slate-300"
            }`}
            aria-label={`Ir a tarjeta ${dotIdx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
