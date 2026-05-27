"use client";

import React, { useState } from "react";
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
} from "lucide-react";

const EXPERIENCE_DATA = {
  nav: {
    logo: "/assets/travelapp_logo.svg",
    brand: "TravelApp",
    product: "Experiences",
    cta: "Reservar Ahora",
    ctaUrl: "https://wa.me/5493814188106?text=Hola!%20Quiero%20saber%20más%20sobre%20TravelApp%20Experiences.",
    loginUrl: "/login",
  },
  hero: {
    badge: "✦ EXPERIENCIAS ÚNICAS EN ARGENTINA",
    title: "Viví Argentina",
    titleAccent: "de otra manera",
    subtitle:
      "Experiencias curadas, guías locales certificados y recorridos exclusivos que no encontrarás en ningún otro lado. Desde el NOA hasta la Patagonia.",
    stats: [
      { value: "+120", label: "Experiencias disponibles" },
      { value: "4.9★", label: "Calificación promedio" },
      { value: "+5K", label: "Viajeros satisfechos" },
    ],
    bg: "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1920&q=80",
  },
  categories: [
    {
      icon: "Compass",
      title: "Aventura & Naturaleza",
      description:
        "Trekking en Quebrada de Humahuaca, kayak en Tigre, senderismo en Los Glaciares. La naturaleza argentina en estado puro.",
      img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80",
    },
    {
      icon: "Camera",
      title: "Cultura & Gastronomía",
      description:
        "Tours de bodega en Mendoza, recorridos culturales en Buenos Aires, experiencias culinarias con chefs locales.",
      img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80",
    },
    {
      icon: "Heart",
      title: "Bienestar & Relax",
      description:
        "Retiros de yoga en las sierras, spa termal en Jujuy, experiencias de desconexión total en entornos naturales únicos.",
      img: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80",
    },
  ],
  features: [
    {
      icon: "Shield",
      title: "Reserva 100% Segura",
      description: "Pago protegido y cancelación flexible hasta 48hs antes.",
    },
    {
      icon: "Users",
      title: "Guías Certificados",
      description: "Profesionales locales verificados con años de experiencia.",
    },
    {
      icon: "Calendar",
      title: "A tu Ritmo",
      description: "Experiencias privadas o grupales, vos elegís cómo vivirlas.",
    },
    {
      icon: "Globe",
      title: "Todo Incluido",
      description: "Traslados, equipamiento y seguro de viaje incluidos.",
    },
  ],
  cta: {
    title: "¿Listo para tu próxima aventura?",
    subtitle:
      "Contanos qué tipo de experiencia buscás y nuestro equipo te arma un itinerario a medida.",
    whatsapp:
      "https://wa.me/5493814188106?text=Hola!%20Quiero%20armar%20una%20experiencia%20personalizada%20con%20TravelApp.",
    phone: "0810-220-0018",
  },
};

const IconMap: Record<string, React.ElementType> = {
  Compass,
  Camera,
  Heart,
  Shield,
  Users,
  Calendar,
  Globe,
};

export default function ExperienceLanding() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans overflow-x-hidden">
      {/* NAV */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 md:px-8">
          <a href="/experience" className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Compass className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-black text-slate-900 text-lg leading-none">TravelApp</span>
                <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none">
                  Experiences
                </span>
              </div>
            </div>
          </a>

          <div className="hidden md:flex items-center gap-4">
            <a
              href={EXPERIENCE_DATA.nav.loginUrl}
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Ingresar
            </a>
            <a
              href={EXPERIENCE_DATA.cta.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-emerald-200"
            >
              {EXPERIENCE_DATA.nav.cta}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="border-t border-slate-100 bg-white p-4 md:hidden flex flex-col gap-3">
            <a href={EXPERIENCE_DATA.nav.loginUrl} className="text-sm font-semibold text-slate-700 py-2">
              Ingresar al Dashboard
            </a>
            <a
              href={EXPERIENCE_DATA.cta.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white"
            >
              {EXPERIENCE_DATA.nav.cta} <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        )}
      </header>

      {/* HERO */}
      <section
        className="relative overflow-hidden py-24 lg:py-36 px-4 text-white"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(5, 90, 60, 0.92), rgba(10, 40, 30, 0.97)), url('${EXPERIENCE_DATA.hero.bg}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-20 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute bottom-10 left-10 h-52 w-52 rounded-full bg-teal-300/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-5xl text-center relative z-10 space-y-8">
          <span className="inline-flex items-center rounded-full bg-emerald-400/20 px-5 py-2 text-xs font-bold uppercase tracking-widest text-emerald-300 ring-1 ring-emerald-400/30">
            {EXPERIENCE_DATA.hero.badge}
          </span>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight">
            {EXPERIENCE_DATA.hero.title}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">
              {EXPERIENCE_DATA.hero.titleAccent}
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-xl text-emerald-100/90 leading-relaxed">
            {EXPERIENCE_DATA.hero.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href={EXPERIENCE_DATA.cta.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-8 py-4 text-base font-black text-white transition-all duration-300 hover:-translate-y-1 shadow-2xl shadow-emerald-900/40"
            >
              Descubrir Experiencias
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          <div className="grid grid-cols-3 gap-8 pt-12 border-t border-white/10 max-w-lg mx-auto">
            {EXPERIENCE_DATA.hero.stats.map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-black text-emerald-300">{s.value}</p>
                <p className="text-sm text-emerald-100/70 mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-24 px-4 bg-slate-50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              ¿Qué querés vivir?
            </span>
            <h2 className="mt-3 text-4xl lg:text-5xl font-black text-slate-900">
              Explorá por categoría
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
              Encontrá la experiencia perfecta para vos, tu familia o tu equipo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {EXPERIENCE_DATA.categories.map((cat, i) => {
              const Icon = IconMap[cat.icon];
              return (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-3xl bg-white border border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2"
                >
                  <div className="h-52 overflow-hidden">
                    <img
                      src={cat.img}
                      alt={cat.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        {Icon && <Icon className="h-5 w-5 text-emerald-600" />}
                      </div>
                      <h3 className="text-lg font-black text-slate-900">{cat.title}</h3>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed">{cat.description}</p>
                    <a
                      href={EXPERIENCE_DATA.cta.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      Ver experiencias <ChevronRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 px-4 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900">¿Por qué TravelApp Experiences?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {EXPERIENCE_DATA.features.map((f, i) => {
              const Icon = IconMap[f.icon];
              return (
                <div key={i} className="text-center space-y-4">
                  <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                    {Icon && <Icon className="h-7 w-7 text-white" />}
                  </div>
                  <h3 className="font-black text-slate-900 text-lg">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-4 bg-gradient-to-br from-emerald-600 to-teal-700 text-white text-center">
        <div className="mx-auto max-w-3xl space-y-8">
          <h2 className="text-4xl lg:text-5xl font-black leading-tight">
            {EXPERIENCE_DATA.cta.title}
          </h2>
          <p className="text-xl text-emerald-100 leading-relaxed">{EXPERIENCE_DATA.cta.subtitle}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={EXPERIENCE_DATA.cta.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-white text-emerald-700 hover:bg-emerald-50 px-8 py-4 text-base font-black transition-all duration-200 hover:-translate-y-1 shadow-2xl"
            >
              Consultar por WhatsApp <ArrowRight className="h-5 w-5" />
            </a>
            <a
              href={`tel:${EXPERIENCE_DATA.cta.phone}`}
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/40 bg-white/10 px-8 py-4 text-base font-bold text-white hover:bg-white/20 transition-all duration-200"
            >
              <Phone className="h-5 w-5" /> {EXPERIENCE_DATA.cta.phone}
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-slate-900 text-slate-400 py-10 px-4">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Compass className="h-4 w-4 text-white" />
            </div>
            <span className="font-black text-white">TravelApp Experiences</span>
          </div>
          <p className="text-sm">© 2026 TravelApp Experiences. Una marca de TravelApp s.a.s.</p>
          <div className="flex gap-4 text-sm">
            <a href="#" className="hover:text-white transition-colors">Términos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            <a href="/login" className="hover:text-white transition-colors">Ingresar</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
