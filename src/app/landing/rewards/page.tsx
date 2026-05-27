"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  Gift,
  Star,
  Zap,
  TrendingUp,
  Award,
  ChevronRight,
  Menu,
  X,
  CreditCard,
  Plane,
  Coffee,
  ShoppingBag,
} from "lucide-react";

const REWARDS_DATA = {
  nav: {
    brand: "TravelApp",
    product: "Rewards",
    cta: "Unirse al Programa",
    ctaUrl: "/login",
    loginUrl: "/login",
  },
  hero: {
    badge: "✦ EL PROGRAMA DE LEALTAD MÁS INNOVADOR",
    title: "Tus viajes tienen",
    titleAccent: "recompensa",
    subtitle:
      "Acumulá puntos en cada viaje con TravelCab o reserva de Experiencias. Canjealos por viajes gratis, descuentos exclusivos y beneficios en toda nuestra red de partners aliados.",
    stats: [
      { value: "1 Km", label: "= 10 Puntos Travel" },
      { value: "+50", label: "Comercios adheridos" },
      { value: "100%", label: "Gratis y automático" },
    ],
  },
  benefits: [
    {
      icon: "Plane",
      title: "Viajes Bonificados",
      description:
        "Usá tus puntos para pagar total o parcialmente tus próximos viajes en TravelCab.",
    },
    {
      icon: "Coffee",
      title: "Gastronomía",
      description:
        "Descuentos en cafeterías, restaurantes y bares adheridos al ecosistema.",
    },
    {
      icon: "ShoppingBag",
      title: "Retail & Compras",
      description:
        "Accedé a vouchers de descuento en marcas exclusivas de indumentaria y tecnología.",
    },
    {
      icon: "Star",
      title: "Status Premium",
      description:
        "A mayor cantidad de viajes, subís de categoría para obtener soporte prioritario y mejores tarifas.",
    },
  ],
  howItWorks: [
    {
      step: "01",
      title: "Viajá o Reservá",
      description: "Pedí un TravelCab o reservá una experiencia desde tu cuenta.",
    },
    {
      step: "02",
      title: "Sumá Puntos",
      description: "Tus puntos se acreditan automáticamente al finalizar tu viaje o evento.",
    },
    {
      step: "03",
      title: "Canjeá Beneficios",
      description: "Entrá a tu Wallet en la app y elegí tu recompensa favorita.",
    },
  ],
  cta: {
    title: "Empezá a sumar hoy mismo",
    subtitle: "Iniciá sesión o registrate gratis para activar tu Travel Wallet y empezar a acumular beneficios.",
    buttonText: "Activar mi Billetera Rewards",
    buttonUrl: "/login",
  },
};

const IconMap: Record<string, React.ElementType> = {
  Plane,
  Coffee,
  ShoppingBag,
  Star,
  Zap,
  TrendingUp,
  Award,
  CreditCard,
  Gift,
};

export default function RewardsLanding() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden">
      {/* NAV */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 md:px-8">
          <a href="/rewards" className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-200">
                <Gift className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-black text-slate-900 text-lg leading-none">TravelApp</span>
                <span className="block text-[10px] font-bold text-violet-600 uppercase tracking-widest leading-none">
                  Rewards
                </span>
              </div>
            </div>
          </a>

          <div className="hidden md:flex items-center gap-4">
            <a
              href={REWARDS_DATA.nav.loginUrl}
              className="text-sm font-semibold text-slate-600 hover:text-violet-600 transition-colors"
            >
              Ingresar a mi Wallet
            </a>
            <a
              href={REWARDS_DATA.nav.ctaUrl}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-600 transition-all duration-300 shadow-lg"
            >
              {REWARDS_DATA.nav.cta}
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
            <a href={REWARDS_DATA.nav.loginUrl} className="text-sm font-semibold text-slate-700 py-2">
              Ingresar a mi Wallet
            </a>
            <a
              href={REWARDS_DATA.nav.ctaUrl}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white"
            >
              {REWARDS_DATA.nav.cta} <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden py-20 lg:py-28 px-4 bg-white">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] h-[500px] w-[500px] rounded-full bg-violet-100/50 blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-10%] h-[400px] w-[400px] rounded-full bg-fuchsia-100/50 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 text-center lg:text-left">
              <span className="inline-flex items-center rounded-full bg-violet-100 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-violet-700 ring-1 ring-violet-200">
                {REWARDS_DATA.hero.badge}
              </span>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] text-slate-900">
                {REWARDS_DATA.hero.title}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-500">
                  {REWARDS_DATA.hero.titleAccent}
                </span>
              </h1>

              <p className="mx-auto lg:mx-0 max-w-xl text-lg text-slate-600 leading-relaxed font-medium">
                {REWARDS_DATA.hero.subtitle}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <a
                  href={REWARDS_DATA.cta.buttonUrl}
                  className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-slate-900 hover:bg-violet-600 px-8 py-4 text-base font-black text-white transition-all duration-300 shadow-xl shadow-violet-200/50 hover:-translate-y-1"
                >
                  Activar mi Cuenta
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>

            {/* Right Side Visual (Mockup of Wallet/Card) */}
            <div className="relative mx-auto w-full max-w-md perspective-1000">
              <div className="relative w-full aspect-[1.58] rounded-3xl bg-gradient-to-br from-violet-900 via-slate-900 to-fuchsia-900 p-8 shadow-2xl shadow-violet-900/20 text-white transform transition-transform duration-700 hover:rotate-y-12 hover:rotate-x-12 border border-white/10">
                <div className="flex justify-between items-start mb-12">
                  <div className="flex items-center gap-2">
                    <Gift className="h-6 w-6 text-fuchsia-400" />
                    <span className="font-bold tracking-widest uppercase text-sm text-fuchsia-100">Travel Wallet</span>
                  </div>
                  <Zap className="h-6 w-6 text-amber-400" />
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Balance de Puntos</p>
                  <p className="text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
                    12,450
                  </p>
                </div>

                <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Miembro Status</p>
                    <p className="font-bold text-white tracking-wide">PLATINUM</p>
                  </div>
                  <div className="h-8 w-12 rounded bg-white/20 backdrop-blur-sm"></div>
                </div>
              </div>
              
              {/* Floating Stat Cards */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-xl border border-slate-100 animate-bounce-slow">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">+450 Puntos</p>
                    <p className="text-sm font-black text-slate-900">Último viaje</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-4 bg-slate-50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900">¿Cómo sumar puntos?</h2>
            <p className="mt-4 text-lg text-slate-500">Es transparente, automático y sin costos ocultos.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-violet-200 via-fuchsia-200 to-violet-200 -translate-y-1/2 z-0"></div>

            {REWARDS_DATA.howItWorks.map((step, i) => (
              <div key={i} className="relative z-10 bg-white rounded-3xl p-8 border border-slate-200/60 shadow-lg shadow-slate-200/50 text-center">
                <span className="inline-block w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white font-black text-xl leading-[56px] shadow-lg shadow-violet-200 mb-6">
                  {step.step}
                </span>
                <h3 className="text-xl font-black text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS GRID */}
      <section className="py-24 px-4 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900">Catálogo de Beneficios</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {REWARDS_DATA.benefits.map((b, i) => {
              const Icon = IconMap[b.icon];
              return (
                <div key={i} className="group p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-violet-200 hover:bg-violet-50/50 transition-all duration-300">
                  <div className="h-12 w-12 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {Icon && <Icon className="h-6 w-6 text-violet-600" />}
                  </div>
                  <h3 className="font-black text-slate-900 text-lg mb-2">{b.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{b.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-24 px-4 bg-slate-900 text-white text-center">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-white/10 backdrop-blur-md mb-4 border border-white/20 shadow-[0_0_50px_rgba(139,92,246,0.3)]">
            <Gift className="h-10 w-10 text-violet-400" />
          </div>
          <h2 className="text-4xl lg:text-5xl font-black leading-tight">
            {REWARDS_DATA.cta.title}
          </h2>
          <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
            {REWARDS_DATA.cta.subtitle}
          </p>
          <div className="pt-8">
            <a
              href={REWARDS_DATA.cta.buttonUrl}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-10 py-5 text-lg font-black transition-all duration-300 hover:-translate-y-1 shadow-2xl shadow-violet-900/50"
            >
              {REWARDS_DATA.cta.buttonText} <ArrowRight className="h-6 w-6" />
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/10 bg-slate-950 text-slate-500 py-10 px-4">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <Gift className="h-4 w-4 text-white" />
            </div>
            <span className="font-black text-slate-300">TravelApp Rewards</span>
          </div>
          <p className="text-sm">© 2026 TravelApp Rewards. Una marca de TravelApp s.a.s.</p>
        </div>
      </footer>
    </div>
  );
}
