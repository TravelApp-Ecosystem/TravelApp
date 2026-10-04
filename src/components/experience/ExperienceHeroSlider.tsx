"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Sparkles, Compass } from "lucide-react";

export interface ExperienceHeroSlide {
  id?: string;
  mediaType?: "image" | "video";
  mediaUrl?: string;
  bgImage?: string;
  videoUrl?: string;
  imageUrl?: string;
  bgImageUrl?: string;
  posterUrl?: string;
  badge?: string;
  tag?: string;
  title: string;
  subtitle?: string;
  text?: string;
  ctaText?: string;
  ctaUrl?: string;
}

interface ExperienceHeroSliderProps {
  slides?: ExperienceHeroSlide[];
  cmsHero?: {
    bgType?: "image" | "video" | "solid";
    bgImageUrl?: string;
    bgVideoUrl?: string;
    videoUrl?: string;
    title?: string;
    subtitle?: string;
    tag?: string;
  };
  children?: React.ReactNode; // Buscador Receptivo
}

const DEFAULT_EXPERIENCE_SLIDES: ExperienceHeroSlide[] = [
  {
    id: "slide-salinas",
    mediaType: "image",
    bgImage:
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
    bgImage:
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
    bgImage:
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
    bgImage:
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

function extractMedia(slide: any): { isVideo: boolean; src: string; poster?: string } {
  if (slide.videoUrl && typeof slide.videoUrl === "string" && slide.videoUrl.trim() !== "") {
    return { isVideo: true, src: slide.videoUrl, poster: slide.posterUrl || slide.bgImage };
  }
  if (slide.mediaType === "video" && (slide.mediaUrl || slide.videoUrl)) {
    return { isVideo: true, src: slide.mediaUrl || slide.videoUrl, poster: slide.posterUrl };
  }

  // Comprobar fuentes de imagen: bgImage (CMS base64 o URL), mediaUrl, imageUrl o bgImageUrl
  const candidate = slide.bgImage || slide.mediaUrl || slide.imageUrl || slide.bgImageUrl;
  if (candidate && typeof candidate === "string" && candidate.trim() !== "") {
    return { isVideo: false, src: candidate };
  }

  return {
    isVideo: false,
    src: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=2560&q=95",
  };
}

export function ExperienceHeroSlider({
  slides,
  cmsHero,
  children,
}: ExperienceHeroSliderProps) {
  const router = useRouter();

  // Normalizamos las diapositivas para soportar cualquier formato del CMS Web (base64, URLs directas o videos)
  const resolvedSlides = useMemo(() => {
    let rawSlides: any[] = [];

    if (slides && Array.isArray(slides) && slides.length > 0) {
      rawSlides = slides;
    } else if (cmsHero && (cmsHero.bgImageUrl || cmsHero.bgVideoUrl || cmsHero.videoUrl)) {
      rawSlides = [
        {
          id: "slide-cms-hero",
          bgImage: cmsHero.bgImageUrl,
          videoUrl: cmsHero.bgVideoUrl || cmsHero.videoUrl,
          mediaType: cmsHero.bgType === "video" ? "video" : "image",
          badge: cmsHero.tag || "✦ TURISMO RECEPTIVO OFICIAL",
          title: cmsHero.title || "Sentí la inmensidad del Norte",
          subtitle: cmsHero.subtitle || "Salinas Grandes, Purmamarca y Cafayate con guías matriculados.",
        },
        ...DEFAULT_EXPERIENCE_SLIDES.slice(1),
      ];
    } else {
      rawSlides = DEFAULT_EXPERIENCE_SLIDES;
    }

    return rawSlides.map((item, idx) => {
      const media = extractMedia(item);
      return {
        id: item.id || `slide-${idx}`,
        isVideo: media.isVideo,
        src: media.src,
        poster: media.poster,
        badge: item.badge || item.tag || "✦ TURISMO RECEPTIVO OFICIAL",
        title: item.title || "Sentí la inmensidad del Norte",
        subtitle: item.subtitle || item.text || "Excursiones diarias con guías matriculados y traslados oficiales.",
        ctaText: item.ctaText,
        ctaUrl: item.ctaUrl,
      };
    });
  }, [slides, cmsHero]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Autoplay cada 7 segundos si hay más de 1 diapositiva
  useEffect(() => {
    if (resolvedSlides.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % resolvedSlides.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [resolvedSlides.length, isPaused]);

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev - 1 + resolvedSlides.length) % resolvedSlides.length);
  };

  const handleNext = () => {
    setCurrentIdx((prev) => (prev + 1) % resolvedSlides.length);
  };

  const currentSlide = resolvedSlides[currentIdx] || resolvedSlides[0];

  return (
    <section
      className="relative w-full min-h-[560px] sm:min-h-[640px] lg:min-h-[700px] flex flex-col justify-between overflow-hidden bg-[#0a2a5b] font-sans"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 1. Fondo Visual HD 100% Limpio (Fotografía o Video del CMS sin velos oscuros) */}
      <div className="absolute inset-0 z-0">
        {resolvedSlides.map((slide, idx) => {
          const isActive = idx === currentIdx;
          return (
            <div
              key={slide.id || idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {slide.isVideo ? (
                <video
                  src={slide.src}
                  poster={slide.poster}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <img
                  src={slide.src}
                  alt={slide.title}
                  className="w-full h-full object-cover object-center"
                  loading={idx === 0 ? "eager" : "lazy"}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 2. Encabezado Editorial Superior Estilo National Geographic con Imagen Limpia */}
      <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 pb-4 sm:pb-6 w-full flex-1 flex flex-col justify-center">
        <div className="max-w-3xl">
          {currentSlide.badge && (
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/30 text-white text-[10px] sm:text-xs font-medium tracking-wider uppercase mb-2 sm:mb-4 shadow-sm">
              <Compass className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#ff4f5a]" />
              <span>{currentSlide.badge}</span>
            </div>
          )}

          <h1 className="text-2xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.12] sm:leading-[1.08] mb-2 sm:mb-4 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
            {currentSlide.title}
          </h1>

          <p className="text-xs sm:text-lg md:text-xl text-white font-medium max-w-2xl mb-3 sm:mb-6 leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            {currentSlide.subtitle}
          </p>
        </div>
      </div>

      {/* 3. Buscador Receptivo Especializado Desplegado */}
      {children && (
        <div className="relative z-30 max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pb-8 sm:pb-16 w-full animate-in fade-in duration-300">
          {children}

          {/* Destinos Populares Sugeridos al pie del buscador */}
          <div className="mt-2.5 sm:mt-3.5 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-white px-1 sm:px-2">
            <span className="font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] flex items-center gap-1 text-white">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
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
                  className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-[10px] sm:text-[11px] font-medium text-white transition-all hover:scale-105 border border-white/30 cursor-pointer shadow-sm"
                >
                  {dest}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Flechas y Dots Indicadores */}
      {resolvedSlides.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Slide anterior"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 transition-all hidden sm:flex items-center justify-center cursor-pointer shadow-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Slide siguiente"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 transition-all hidden sm:flex items-center justify-center cursor-pointer shadow-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots Indicadores */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2">
            {resolvedSlides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIdx(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === currentIdx
                    ? "w-8 h-2 bg-[#ff4f5a] shadow-md"
                    : "w-2 h-2 bg-white/70 hover:bg-white shadow"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
