"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Compass, Sparkles } from "lucide-react";

const REGIONS = [
  {
    id: "jujuy",
    name: "Jujuy & Quebrada",
    tagline: "Patrimonio de la Humanidad UNESCO",
    description:
      "Salinas Grandes, Purmamarca, Cerro de los Siete Colores, Tilcara y la imponente Serranía del Hornocal.",
    imageUrl:
      "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1200&q=85",
    toursCount: "12 Excursiones",
    filterParam: "Jujuy",
    accentColor: "from-amber-600/80",
  },
  {
    id: "salta",
    name: "Salta La Linda",
    tagline: "Valles Calchaquíes & Ruta del Vino",
    description:
      "Cafayate y sus bodegas de altura, Cachi por la Cuesta del Obispo, Los Cardones y la mágica Iruya.",
    imageUrl:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=85",
    toursCount: "16 Excursiones",
    filterParam: "Salta",
    accentColor: "from-[#ff4f5a]/80",
  },
  {
    id: "tucuman",
    name: "Tucumán & Yungas",
    tagline: "Selva de Montaña & Arqueología",
    description:
      "Tafí del Valle, Quebrada de Los Sosa, El Cadillal, San Javier y las sagradas Ruinas de Quilmes.",
    imageUrl:
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=85",
    toursCount: "8 Excursiones",
    filterParam: "Tucumán",
    accentColor: "from-emerald-700/80",
  },
  {
    id: "catamarca",
    name: "Catamarca & Puna",
    tagline: "Expediciones & Paisajes Lunares",
    description:
      "Campo de Piedra Pómez, Antofagasta de la Sierra, volcanes gigantescos y Termas de Fiambalá.",
    imageUrl:
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1200&q=85",
    toursCount: "5 Expediciones",
    filterParam: "Catamarca",
    accentColor: "from-blue-700/80",
  },
];

export function ExperienceRegionsSection() {
  return (
    <section className="py-12 sm:py-20 bg-slate-50 font-sans border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff4f5a]/10 text-[#ff4f5a] text-xs font-bold uppercase mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>Destinos del Norte Argentino</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Elegí tu Próxima Región
          </h2>
          <p className="text-xs sm:text-base text-slate-500 font-medium mt-2">
            Operamos de manera directa con base en Salta, Jujuy y Tucumán, garantizando conectividad total y salidas los 365 días del año.
          </p>
        </div>

        {/* Grid de Regiones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {REGIONS.map((reg) => (
            <Link
              key={reg.id}
              href={`/landing/experience/marketplace?destino=${encodeURIComponent(reg.filterParam)}`}
              className="group relative h-80 sm:h-96 rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-end p-5 sm:p-6"
            >
              {/* Imagen de Fondo */}
              <Image
                src={reg.imageUrl}
                alt={reg.name}
                fill
                sizes="(max-width: 768px) 100vw, 300px"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />

              {/* Gradiente de Contraste */}
              <div
                className={`absolute inset-0 bg-gradient-to-t ${reg.accentColor} via-slate-950/50 to-transparent transition-opacity`}
              />

              {/* Contenido Editorial de la Región */}
              <div className="relative z-10 text-white">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-extrabold uppercase mb-2">
                  {reg.toursCount}
                </span>

                <h3 className="text-xl sm:text-2xl font-black leading-tight group-hover:translate-x-1 transition-transform">
                  {reg.name}
                </h3>

                <p className="text-xs font-bold text-white/90 mt-1 line-clamp-1">
                  {reg.tagline}
                </p>

                <p className="text-[11px] text-white/80 font-normal mt-1.5 line-clamp-2 leading-relaxed">
                  {reg.description}
                </p>

                <div className="mt-4 flex items-center gap-1.5 text-xs font-extrabold text-white group-hover:text-amber-300 transition-colors">
                  <span>Explorar excursiones</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
