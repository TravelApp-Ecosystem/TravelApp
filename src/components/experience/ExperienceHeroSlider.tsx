"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Sparkles, MapPin, Compass } from "lucide-react";

export interface ExperienceHeroSlide {
  id: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  posterUrl?: string;
  badge?: string;
  title: string;
  subtitle: string;
  ctaText?: string;
  ctaUrl?: string;
}

interface ExperienceHeroSliderProps {
  slides?: ExperienceHeroSlide[];
  children?: React.ReactNode; // Buscador Receptivo
}

const DEFAULT_EXPERIENCE_SLIDES: ExperienceHeroSlide[] = [
  {
    id: "slide-salinas",
    mediaType: "image",
    mediaUrl:
      "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=2560&q=95",
    badge: "✦ PUNA & CULTURA ANDINA",
    title: "Sentí la inmensidad del Norte",
    subtitle:
      "Salinas Grandes, Purmamarca y el Cerro de los Siete Colores con guías matriculados, pick-up en tu hotel y cuotas fijas.",
    ctaText: "Ver Salidas Salinas Grandes",
    ctaUrl: "/landing/experience/marketplace?destino=Salinas",
  },
  {
    id: "slide-cafayate",
    mediaType: "image",
    mediaUrl:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2560&q=95",
    badge: "✦ BODEGAS & QUEBRADAS",
    title: "Cafayate, Vinos de Altura & Quebrada",
    subtitle:
      "Recorré la Quebrada de las Conchas, visitá bodegas boutique con degustación de Torrontés y disfrutá un almuerzo criollo.",
    ctaText: "Explorar Ruta de Cafayate",
    ctaUrl: "/landing/experience/marketplace?destino=Cafayate",
  },
  {
    id: "slide-cachi",
    mediaType: "image",
    mediaUrl:
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=2560&q=95",
    badge: "✦ VALLES CALCHAQUÍES",
    title: "Cachi & Cuesta del Obispo",
    subtitle:
      "Vistas panorámicas a más de 3.000 msnm, Parque Nacional Los Cardones y la serenidad de uno de los pueblos más bellos del país.",
    ctaText: "Ver Excursión a Cachi",
    ctaUrl: "/landing/experience/marketplace?destino=Cachi",
  },
  {
    id: "slide-yungas",
    mediaType: "image",
    mediaUrl:
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=2560&q=95",
    badge: "✦ NATURALEZA & AVENTURA",
    title: "Tafí del Valle & Selva de las Yungas",
    subtitle:
      "Verde imponente en la Quebrada de Los Sosa, historia ancestral en las Ruinas de Quilmes y cabalgatas entre cerros.",
    ctaText: "Descubrir Tafí del Valle",
    ctaUrl: "/landing/experience/marketplace?destino=Tafi",
  },
];

const SUGGESTED_EXPERIENCES = [
  "Salinas Grandes",
  "Cafayate & Bodegas",
  "Purmamarca",
  "Hornocal 14 Colores",
  "Cachi",
  "Tafí del Valle",
];

export function ExperienceHeroSlider({ slides, children }: ExperienceHeroSliderProps) {
  const router = useRouter();
  const cleanSlides = slides && slides.length > 0 ? slides : DEFAULT_EXPERIENCE_SLIDES;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Autoplay cada 7 segundos
  useEffect(() => {
    if (cleanSlides.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % cleanSlides.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [cleanSlides.length, isPaused]);

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev - 1 + cleanSlides.length) % cleanSlides.length);
  };

  const handleNext = () => {
    setCurrentIdx((prev) => (prev + 1) % cleanSlides.length);
  };

  const currentSlide = cleanSlides[currentIdx] || cleanSlides[0];

  return (
    <section
      className="relative w-full min-h-[560px] sm:min-h-[640px] lg:min-h-[700px] flex flex-col justify-between overflow-hidden bg-slate-950 font-sans"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 1. Fondo Visual HD con Transición Suave */}
      <div className="absolute inset-0 z-0">
        {cleanSlides.map((slide, idx) => {
          const isActive = idx === currentIdx;
          return (
            <div
              key={slide.id || idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {slide.mediaType === "video" ? (
                <video
                  src={slide.mediaUrl}
                  poster={slide.posterUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="relative w-full h-full">
                  <Image
                    src={slide.mediaUrl}
                    alt={slide.title}
                    fill
                    priority={idx === 0}
                    quality={92}
                    sizes="100vw"
                    className="object-cover object-center transform scale-105 transition-transform duration-10000 ease-out"
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Gradiente Coral-Azul Institucional de Contraste */}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-black/30 pointer-events-none" />
        <div className="absolute inset-0 z-20 bg-gradient-to-r from-black/60 via-black/20 to-transparent pointer-events-none" />
      </div>

      {/* 2. Encabezado Editorial Superior Estilo National Geographic */}
      <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 pb-4 sm:pb-6 w-full flex-1 flex flex-col justify-center">
        <div className="max-w-3xl">
          {currentSlide.badge && (
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[#ff4f5a]/30 backdrop-blur-md border border-[#ff4f5a]/50 text-white text-[10px] sm:text-xs font-bold tracking-wider uppercase mb-2 sm:mb-4 shadow-sm">
              <Compass className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#ff4f5a]" />
              <span>{currentSlide.badge}</span>
            </div>
          )}

          <h1 className="text-2xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.12] sm:leading-[1.08] mb-2 sm:mb-4 drop-shadow-lg">
            {currentSlide.title}
          </h1>

          <p className="text-xs sm:text-lg md:text-xl text-white/95 font-medium max-w-2xl mb-3 sm:mb-6 leading-relaxed drop-shadow-md">
            {currentSlide.subtitle}
          </p>
        </div>
      </div>

      {/* 3. Buscador Receptivo Especializado Desplegado */}
      {children && (
        <div className="relative z-30 max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pb-8 sm:pb-16 w-full animate-in fade-in duration-300">
          {children}

          {/* Destinos Populares Sugeridos al pie del buscador */}
          <div className="mt-2.5 sm:mt-3.5 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-white/90 px-1 sm:px-2">
            <span className="font-bold drop-shadow-sm flex items-center gap-1 text-white">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#ff4f5a]" />
              Experiencias más buscadas:
            </span>
            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
              {SUGGESTED_EXPERIENCES.map((dest) => (
                <button
                  key={dest}
                  type="button"
                  onClick={() => {
                    router.push(
                      `/landing/experience/marketplace?destino=${encodeURIComponent(dest)}`
                    );
                  }}
                  className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-xs text-[10px] sm:text-[11px] font-bold text-white transition-all hover:scale-105 border border-white/20 cursor-pointer"
                >
                  {dest}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Flechas y Dots Indicadores */}
      {cleanSlides.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Slide anterior"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 transition-all hidden sm:flex items-center justify-center cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Slide siguiente"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 transition-all hidden sm:flex items-center justify-center cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots Indicadores */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2">
            {cleanSlides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIdx(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === currentIdx
                    ? "w-8 h-2 bg-[#ff4f5a]"
                    : "w-2 h-2 bg-white/60 hover:bg-white"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
