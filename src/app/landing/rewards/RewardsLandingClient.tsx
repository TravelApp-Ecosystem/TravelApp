"use client";

import React, { useState, useEffect } from "react";
import { TravisOmnichannelWidget } from "@/components/shared/TravisOmnichannelWidget";
import {
  ArrowRight,
  Gift,
  Star,
  Zap,
  TrendingUp,
  Award,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  CreditCard,
  Plane,
  Coffee,
  ShoppingBag,
  Phone,
  Sparkles,
  Building2,
  CheckCircle,
  Users,
} from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

/* ════════════════════════════════════════════════════════════
   CMS DEFAULT DATA
════════════════════════════════════════════════════════════ */
const DEFAULT_REWARDS_CMS_DATA = {
  heroSlides: [
    {
      title: "Tus viajes tienen recompensa",
      subtitle: "Acumulá puntos en cada viaje y canjeálos por beneficios exclusivos en todo el ecosistema TravelApp.",
      text: "Gratis, automático y sin costos ocultos.",
      bgImage: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1920&q=80",
      ctaText: "Ver Catálogo de Canjes",
      ctaUrl: "/canjes",
      overlayOpacity: 65,
    }
  ],
  howItWorks: [
    { step: "01", title: "Viajá o Reservá", description: "Pedí un TravelCab o reservá una experiencia desde tu cuenta registrada." },
    { step: "02", title: "Sumá Puntos", description: "Tus puntos Travel se acreditan automáticamente al finalizar tu viaje o evento." },
    { step: "03", title: "Canjeá Beneficios", description: "Ingresá al catálogo de canjes y elegí tu recompensa favorita." },
  ],
  benefits: [
    { icon: "Plane", title: "Viajes Bonificados", description: "Usá tus puntos para pagar total o parcialmente tus próximos viajes en TravelCab." },
    { icon: "Coffee", title: "Gastronomía", description: "Descuentos en cafeterías, restaurantes y bares adheridos al ecosistema." },
    { icon: "ShoppingBag", title: "Retail & Compras", description: "Accedé a vouchers de descuento en marcas exclusivas de indumentaria y tecnología." },
    { icon: "Star", title: "Status Premium", description: "A mayor cantidad de viajes, subís de categoría para obtener soporte prioritario y mejores tarifas." },
  ],
  ctaBlock: {
    title: "Empezá a sumar hoy mismo",
    subtitle: "Iniciá sesión o registrate gratis para activar tu Travel Wallet y empezar a acumular beneficios.",
    buttonText: "Activar mi Billetera Rewards",
    buttonUrl: "/login",
  },
  businessSection: {
    title: "¿Tenés un negocio?",
    subtitle: "Sumate al ecosistema TravelApp y ofrecé beneficios Rewards a tus clientes. Llegá a miles de viajeros activos cada mes.",
    buttonText: "Quiero ser Partner",
    buttonUrl: "mailto:partners@travelapp.ar",
    features: [
      "Visibilidad en el catálogo de canjes",
      "Integración automática de puntos",
      "Panel de control de métricas",
      "Soporte comercial dedicado",
    ],
  },
  redesSociales: {
    facebook: "",
    instagram: "",
    whatsapp: "",
    youtube: "",
    tiktok: "",
  },
  sellosLegales: {
    arcaQr: "",
    baseDatosSello: "",
  },
  footer: {
    copyrightText: "© 2026 TravelApp Rewards. Una marca de TravelApp s.a.s.",
  },
};

/* ════════════════════════════════════════════════════════════
   ICONOS
════════════════════════════════════════════════════════════ */
const IconMap: Record<string, React.ElementType> = {
  Plane, Coffee, ShoppingBag, Star, Zap, TrendingUp, Award, CreditCard, Gift,
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
  if (trimmed.startsWith("<") || trimmed.includes("<script")) {
    return (
      <div
        className="flex items-center justify-center min-h-[40px] max-h-16 overflow-hidden [&_img]:max-h-10 [&_img]:w-auto"
        dangerouslySetInnerHTML={{ __html: trimmed }}
      />
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-900 bg-slate-950 px-3 py-1.5 hover:border-slate-800 transition-colors">
      <img src={trimmed} alt={alt} className="h-6 w-auto object-contain" />
      <span className="text-[8px] font-bold text-slate-400 uppercase">{alt}</span>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
════════════════════════════════════════════════════════════ */
export default function RewardsLandingClient({ initialCms }: { initialCms?: any }) {
  const [cmsData, setCmsData] = useState<any>(
    initialCms ? { ...DEFAULT_REWARDS_CMS_DATA, ...initialCms } : DEFAULT_REWARDS_CMS_DATA
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Escucha en tiempo real del CMS de Rewards
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "cms", "landing_rewards"), (snap) => {
      if (snap.exists()) {
        setCmsData({ ...DEFAULT_REWARDS_CMS_DATA, ...snap.data() });
      }
    });
    return () => unsub();
  }, []);

  // Auto-avance del slider
  useEffect(() => {
    const slidesCount = cmsData.heroSlides?.length || 1;
    if (slidesCount <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slidesCount);
    }, 6000);
    return () => clearInterval(interval);
  }, [cmsData.heroSlides]);

  const slides = cmsData.heroSlides || DEFAULT_REWARDS_CMS_DATA.heroSlides;
  const howItWorks = cmsData.howItWorks || DEFAULT_REWARDS_CMS_DATA.howItWorks;
  const benefits = cmsData.benefits || DEFAULT_REWARDS_CMS_DATA.benefits;
  const ctaBlock = cmsData.ctaBlock || DEFAULT_REWARDS_CMS_DATA.ctaBlock;
  const businessSection = cmsData.businessSection || DEFAULT_REWARDS_CMS_DATA.businessSection;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans overflow-x-hidden">

      {/* ══ HEADER ══ */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 md:px-8">
          <a href="/" className="flex items-center gap-2">
            <img src="/assets/rewards_original.svg" alt="TravelApp Rewards" className="h-9 w-auto object-contain" />
          </a>

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
            <a href="#como-sumar" className="hover:text-[#ff6b00] transition-colors">¿Cómo sumar?</a>
            <a href="#beneficios" className="hover:text-[#ff6b00] transition-colors">Beneficios</a>
            <a href="/canjes" className="hover:text-[#ff6b00] transition-colors">Catálogo de Canjes</a>
            <a href="#negocios" className="hover:text-[#ff6b00] transition-colors">Sumá tu Negocio</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <a href="/login" className="text-sm font-bold text-slate-600 hover:text-[#ff6b00] transition-colors">
              Mi Wallet
            </a>
            <a
              href={ctaBlock?.buttonUrl || "/login"}
              className="inline-flex items-center gap-2 rounded-xl bg-[#ff6b00] hover:bg-[#e05e00] px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-orange-200 transition-all duration-300 hover:shadow-orange-300"
            >
              Activar Cuenta
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
            <a href="#como-sumar" onClick={() => setMobileOpen(false)} className="text-sm font-semibold text-slate-700 py-2">¿Cómo sumar puntos?</a>
            <a href="#beneficios" onClick={() => setMobileOpen(false)} className="text-sm font-semibold text-slate-700 py-2">Beneficios</a>
            <a href="/canjes" onClick={() => setMobileOpen(false)} className="text-sm font-semibold text-slate-700 py-2">Catálogo de Canjes</a>
            <a href="#negocios" onClick={() => setMobileOpen(false)} className="text-sm font-semibold text-slate-700 py-2">Sumá tu Negocio</a>
            <hr className="border-slate-100" />
            <a href="/login" className="text-sm font-semibold text-slate-700 py-2">Mi Wallet Rewards</a>
            <a
              href={ctaBlock?.buttonUrl || "/login"}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff6b00] px-5 py-3 text-sm font-black text-white"
            >
              Activar mi Cuenta <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        )}
      </header>

      {/* ══ HERO SLIDER ══ */}
      <section className="relative h-[65vh] min-h-[500px] w-full overflow-hidden bg-[#0a2a5b]">
        {slides.map((slide: any, idx: number) => {
          const opacity = (slide.overlayOpacity ?? 65) / 100;
          return (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out flex items-center ${
                currentSlide === idx ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
              style={{
                backgroundImage: `url('${slide.bgImage}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {/* Overlay con opacidad controlable (Azul Marino #0a2a5b) */}
              <div
                className="absolute inset-0"
                style={{ backgroundColor: `rgba(10, 42, 91, ${opacity})` }}
              />
              <div className="relative z-10 mx-auto max-w-5xl px-6 text-center text-white space-y-6">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-amber-400 backdrop-blur-sm">
                  <Sparkles className="h-3.5 w-3.5" /> PROGRAMA DE LEALTAD TRAVELAPP
                </span>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight">
                  {slide.title}
                </h1>
                <p className="text-lg sm:text-xl text-slate-200 max-w-3xl mx-auto font-medium leading-relaxed">
                  {slide.subtitle}
                </p>
                {slide.text && (
                  <p className="text-sm text-slate-350/90 max-w-2xl mx-auto">
                    {slide.text}
                  </p>
                )}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a
                    href={slide.ctaUrl || "/canjes"}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#ff6b00] hover:bg-[#e05e00] px-8 py-4 text-base font-black text-white transition-all duration-300 hover:-translate-y-1 shadow-2xl shadow-orange-950/50"
                  >
                    {slide.ctaText || "Ver Catálogo de Canjes"}
                    <ArrowRight className="h-5 w-5" />
                  </a>
                  <a
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/20 px-8 py-4 text-base font-black text-white transition-all duration-300 backdrop-blur-sm"
                  >
                    Mi Wallet
                  </a>
                </div>
              </div>
            </div>
          );
        })}

        {/* Controles del Slider */}
        {slides.length > 1 && (
          <>
            <button
              onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-all"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-all"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {slides.map((_: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2.5 rounded-full transition-all ${
                    currentSlide === idx ? "w-8 bg-[#ff6b00]" : "w-2.5 bg-white/40"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* ══ STATS BAR ══ */}
      <div className="bg-gradient-to-r from-[#0a2a5b] to-[#123e72] text-white py-5 px-6 border-b border-orange-500/10">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-16 text-center">
          {[
            { value: "1 Km", label: "= 10 Puntos Travel" },
            { value: "+50", label: "Comercios adheridos" },
            { value: "100%", label: "Gratis y automático" },
          ].map((stat, i) => (
            <div key={i} className="space-y-0.5">
              <p className="text-2xl font-black text-white">{stat.value}</p>
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══ CÓMO SUMAR PUNTOS ══ */}
      <section id="como-sumar" className="py-24 px-4 bg-slate-50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <span className="inline-flex items-center rounded-full bg-orange-50 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[#ff6b00] ring-1 ring-orange-100 mb-4">
              Simple y automático
            </span>
            <h2 className="text-4xl font-black text-slate-900">¿Cómo sumar puntos?</h2>
            <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">Es transparente, automático y sin costos ocultos.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-orange-100 via-amber-200 to-orange-100 z-0" />
            {howItWorks.map((step: any, i: number) => (
              <div key={i} className="relative z-10 bg-white rounded-3xl p-8 border border-slate-200/60 shadow-lg shadow-slate-200/50 text-center hover:-translate-y-1 transition-transform duration-300">
                <span className="inline-flex w-16 h-16 rounded-2xl bg-[#f59e0b] text-[#0a2a5b] font-black text-xl items-center justify-center shadow-lg shadow-amber-100 mb-6">
                  {step.step}
                </span>
                <h3 className="text-xl font-black text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CATÁLOGO DE CANJES CTA ══ */}
      <section className="py-20 bg-white border-t border-b border-slate-100 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-orange-500 via-white to-white" />
        <div className="mx-auto max-w-5xl px-6 text-center space-y-8 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff6b00]/10 border border-[#ff6b00]/20 text-xs text-[#ff6b00] font-black tracking-wide">
            <Gift className="h-3.5 w-3.5" /> CANJEÁ TUS PUNTOS
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Explorá el Catálogo de <br />
            <span className="text-[#f59e0b]">Beneficios y Premios</span>
          </h2>
          <p className="text-base text-slate-500 max-w-2xl mx-auto leading-relaxed font-semibold">
            Viajes gratis con TravelCab, descuentos en gastronomía, retail y mucho más. Filtrá por categoría, puntos disponibles y canjeá en segundos.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/canjes"
              className="group inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-2xl bg-slate-900 hover:bg-[#ff6b00] px-8 py-4 text-sm font-black text-white transition-all duration-300 shadow-xl hover:-translate-y-1"
            >
              Ver Catálogo Completo de Canjes
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* ══ BENEFICIOS ══ */}
      <section id="beneficios" className="py-24 px-4 bg-slate-50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <span className="inline-flex items-center rounded-full bg-orange-50 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[#ff6b00] ring-1 ring-orange-100 mb-4">
              Para cada estilo de vida
            </span>
            <h2 className="text-4xl font-black text-slate-900">Catálogo de Beneficios</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b: any, i: number) => {
              const Icon = IconMap[b.icon] || Gift;
              return (
                <div key={i} className="group p-6 rounded-3xl bg-white border border-slate-100 hover:border-orange-200 hover:bg-orange-50/20 transition-all duration-300 shadow-sm hover:shadow-lg">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#0a2a5b]/10 to-[#0a2a5b]/5 shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6 text-[#ff6b00]" />
                  </div>
                  <h3 className="font-black text-slate-900 text-lg mb-2">{b.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{b.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ SECCIÓN NEGOCIO AL ECOSISTEMA ══ */}
      <section id="negocios" className="py-20 px-4 bg-[#0a2a5b] text-white relative overflow-hidden border-t border-[#ff6b00]/10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-slate-700/10 blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Texto */}
            <div className="lg:col-span-7 space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-amber-400">
                <Building2 className="h-3.5 w-3.5" /> PARA EMPRESAS Y COMERCIOS
              </span>
              <h2 className="text-3xl sm:text-4xl font-black leading-tight">
                {businessSection?.title || "¿Tenés un negocio?"}
              </h2>
              <p className="text-lg text-slate-350 leading-relaxed">
                {businessSection?.subtitle || "Sumate al ecosistema TravelApp y ofrecé beneficios Rewards a tus clientes."}
              </p>
              <ul className="space-y-3">
                {(businessSection?.features || DEFAULT_REWARDS_CMS_DATA.businessSection.features).map((f: string, i: number) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-semibold text-slate-200">
                    <CheckCircle className="h-5 w-5 text-[#ff6b00] flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="pt-2">
                <a
                  href={businessSection?.buttonUrl || "mailto:partners@travelapp.ar"}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white hover:bg-orange-50 px-8 py-4 text-sm font-black text-[#0a2a5b] shadow-xl transition-all hover:-translate-y-1"
                >
                  {businessSection?.buttonText || "Quiero ser Partner"}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Visual */}
            <div className="lg:col-span-5">
              <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#ff6b00] to-[#e05e00] flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-black text-white">Partner TravelApp</p>
                    <p className="text-xs text-slate-400">Ecosistema conectado</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Users, label: "Miles de usuarios activos" },
                    { icon: Zap, label: "Integración automática" },
                    { icon: TrendingUp, label: "Métricas en tiempo real" },
                    { icon: Star, label: "Soporte comercial" },
                  ].map((item, i) => (
                    <div key={i} className="bg-white/10 rounded-2xl p-3 flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-amber-400 flex-shrink-0" />
                      <span className="text-xs font-semibold text-slate-200 leading-tight">{item.label}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-[#ff6b00] rounded-2xl p-4 text-center">
                  <p className="text-xs font-black text-white uppercase tracking-widest">Contacto Comercial</p>
                  <p className="text-sm font-bold text-white mt-1">partners@travelapp.ar</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL ══ */}
      <section className="py-24 px-4 bg-white text-center">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-orange-50 to-amber-50 mb-4 border border-orange-200 shadow-lg shadow-orange-100/50">
            <Gift className="h-10 w-10 text-[#ff6b00]" />
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
            {ctaBlock?.title}
          </h2>
          <p className="text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto">
            {ctaBlock?.subtitle}
          </p>
          <div className="pt-4">
            <a
              href={ctaBlock?.buttonUrl || "/login"}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#ff6b00] hover:bg-[#e05e00] px-10 py-5 text-lg font-black text-white transition-all duration-300 hover:-translate-y-1 shadow-2xl shadow-orange-200"
            >
              {ctaBlock?.buttonText} <ArrowRight className="h-6 w-6" />
            </a>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="border-t border-slate-200/30 bg-slate-950 text-slate-500 py-16 px-6">
        <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="space-y-4">
            <img src="/assets/rewards_blanco.svg" alt="TravelApp Rewards" className="h-8 w-auto object-contain" />
            <p className="text-xs text-slate-400 leading-relaxed">
              El programa de lealtad más completo del ecosistema TravelApp. Acumulá y canjeá en todo el país.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-4">Navegación</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#como-sumar" className="hover:text-white transition-colors">¿Cómo sumar?</a></li>
              <li><a href="#beneficios" className="hover:text-white transition-colors">Beneficios</a></li>
              <li><a href="/canjes" className="hover:text-white transition-colors">Catálogo de Canjes</a></li>
              <li><a href="#negocios" className="hover:text-white transition-colors">Sumá tu Negocio</a></li>
              <li><a href="/login" className="hover:text-white transition-colors">Portal Administrativo</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-4">Redes Sociales</h4>
            <div className="flex flex-wrap gap-2.5">
              {cmsData.redesSociales?.facebook && (
                <a href={cmsData.redesSociales.facebook} target="_blank" rel="noreferrer"
                  className="h-8 w-8 rounded-lg bg-slate-900 hover:bg-[#ff6b00] hover:text-white flex items-center justify-center transition-colors border border-slate-800 text-slate-400">
                  <FacebookIcon className="h-4 w-4" />
                </a>
              )}
              {cmsData.redesSociales?.instagram && (
                <a href={cmsData.redesSociales.instagram} target="_blank" rel="noreferrer"
                  className="h-8 w-8 rounded-lg bg-slate-900 hover:bg-[#ff6b00] hover:text-white flex items-center justify-center transition-colors border border-slate-800 text-slate-400">
                  <InstagramIcon className="h-4 w-4" />
                </a>
              )}
              {cmsData.redesSociales?.youtube && (
                <a href={cmsData.redesSociales.youtube} target="_blank" rel="noreferrer"
                  className="h-8 w-8 rounded-lg bg-slate-900 hover:bg-[#ff6b00] hover:text-white flex items-center justify-center transition-colors border border-slate-800 text-slate-400">
                  <YoutubeIcon className="h-4 w-4" />
                </a>
              )}
              {cmsData.redesSociales?.tiktok && (
                <a href={cmsData.redesSociales.tiktok} target="_blank" rel="noreferrer"
                  className="h-8 w-8 rounded-lg bg-slate-900 hover:bg-[#ff6b00] hover:text-white flex items-center justify-center transition-colors border border-slate-800 text-slate-400">
                  <TiktokIcon className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-4">Soporte</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href={cmsData.redesSociales?.whatsapp || "#"} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 text-orange-400 hover:underline">
                  <Phone className="h-3 w-3" /> Contactar por WhatsApp
                </a>
              </li>
              <li className="text-[10px] text-slate-500">Atención personalizada las 24hs.</li>
            </ul>
          </div>
        </div>

        <div className="mx-auto max-w-7xl border-t border-slate-900/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-600">
          <p className="order-2 md:order-1 text-center md:text-left">
            {cmsData.footer?.copyrightText || "© 2026 TravelApp Rewards. Una marca de TravelApp s.a.s."}
          </p>
          {cmsData.sellosLegales && (
            <div className="order-1 md:order-2 flex flex-wrap items-center justify-center gap-4">
              <RenderLegalSeal content={cmsData.sellosLegales?.arcaQr} alt="ARCA" />
              <RenderLegalSeal content={cmsData.sellosLegales?.baseDatosSello} alt="Base de Datos" />
            </div>
          )}
          <div className="order-3 flex gap-4">
            <a href="#" className="hover:text-slate-400 transition-colors">Términos</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Privacidad</a>
          </div>
        </div>
      </footer>

      {/* 🤖 Travis Chat Web Widget (Flotante Omnicanal - Navy Blue style) */}
      <TravisOmnichannelWidget 
        businessUnit="Rewards" 
        whatsappUrl={cmsData.redesSociales?.whatsapp || "https://wa.me/5493814188106"}
        messengerUrl={cmsData.redesSociales?.messenger || "https://m.me/travelapp"}
        instagramUrl={cmsData.redesSociales?.instagram || "https://instagram.com/travelapp.ar"}
        primaryColor="#0a2a5b" // Navy Blue for brand coherence
        brandName="Rewards"
      />
    </div>
  );
}
