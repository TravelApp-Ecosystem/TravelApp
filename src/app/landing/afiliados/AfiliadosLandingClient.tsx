'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles, Award, ArrowRight, CheckCircle2, Shield, Ticket,
  TrendingUp, Users, DollarSign, Wallet, HelpCircle, ChevronRight,
  Zap, Copy, Check, Menu, X, ArrowUpRight, Phone, Mail, MapPin, Briefcase
} from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DEFAULT_EXPERIENCE_TIERS } from '@/lib/commissions';
import { TravisOmnichannelWidget } from '@/components/shared/TravisOmnichannelWidget';

const DEFAULT_AFILIADOS_CMS_DATA = {
  header: {
    brand: 'TravelApp',
    product: 'Experience Partners',
    ctaText: 'Ser Embajador',
    loginUrl: '/afiliados/login',
    registerUrl: '/afiliados/register',
  },
  hero: {
    badge: 'PROGRAMA DE AFILIADOS & EMBAJADORES',
    title: 'Monetizá tu audiencia recomendando experiencias inolvidables',
    subtitle: 'Ganá hasta un 10% de comisión por cada reserva, regalá cupones de descuento exclusivos a tus seguidores y cobrá al instante vía Mercado Pago o semanalmente por CBU.',
    primaryCtaText: 'Registrarme Gratis',
    secondaryCtaText: 'Conocer Niveles',
    heroImage: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=80',
  },
  stats: [
    { label: 'Comisión Máxima', value: '10%', detail: 'por cada cuota/reserva' },
    { label: 'Cupones Exclusivos', value: 'Hasta 20% OFF', detail: 'para tus seguidores' },
    { label: 'Modalidad de Cobro', value: 'Instantáneo', detail: 'Split MP o CBU semanal' },
    { label: 'Puntos Rewards', value: '1.000 pts', detail: 'extra por nivel VIP' },
  ],
  payoutMethods: {
    title: 'Cobrá tus comisiones como vos prefieras',
    subtitle: 'Garantizamos transparencia total en cada venta realizada con tu código o enlace de referido.',
    optionMpTitle: 'Split Mercado Pago Instantáneo',
    optionMpDesc: 'Vincularás tu cuenta de Mercado Pago vía OAuth. Cada vez que un cliente reserve una experiencia con tu enlace, tu comisión se acredita en el acto a tu cuenta de Mercado Pago (Split Inverso).',
    optionCbuTitle: 'CBU / CVU Liquidación Semanal',
    optionCbuDesc: 'Si preferís transferencia bancaria tradicional, acumulás todas tus comisiones de la semana y las recibís todos los Lunes directamente en tu cuenta bancaria o billetera virtual.',
  },
  faqs: [
    {
      q: '¿Tiene algún costo unirme al Programa de Embajadores?',
      a: 'No, es 100% gratuito y no requiere inversión inicial. Solo necesitás registrarte para obtener tu enlace y tu código de cupón personal.'
    },
    {
      q: '¿Cómo funcionan los niveles de comisión?',
      a: 'Comenzás en el Nivel 1 (Starter) ganando un 3% de comisión. A medida que concretás reservas pasás a Pro Creator (5%), Master Partner (7%) y VIP Ambassador (10%).'
    },
    {
      q: '¿Cómo reciben el descuento mis seguidores?',
      a: 'Les entregamos un código de cupón personalizado con tu nombre (ej. FLOR10OFF) para que obtengan descuentos exclusivos en todo el catálogo de turismo y experiencias.'
    },
    {
      q: '¿Cuándo y cómo cobro mis comisiones?',
      a: 'Podés elegir cobrar al instante a través de Split Inverso en Mercado Pago o recibir transferencias automáticas por CBU/CVU todos los días Lunes.'
    }
  ],
  footer: {
    brandText: 'TravelApp Experience Partners',
    copyrightText: '© 2026 TravelApp Ecosistema. Todos los derechos reservados.'
  }
};

export default function AfiliadosLandingClient() {
  const [cmsData, setCmsData] = useState(DEFAULT_AFILIADOS_CMS_DATA);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [legalModal, setLegalModal] = useState<{ title: string; content: string } | null>(null);

  // Escuchar cambios dinámicos del CMS en tiempo real
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, 'cms_blocks', 'landing_afiliados'), (snap) => {
        if (snap.exists()) {
          const val = snap.data();
          setCmsData({
            ...DEFAULT_AFILIADOS_CMS_DATA,
            ...val,
            header: { ...DEFAULT_AFILIADOS_CMS_DATA.header, ...(val.header || {}) },
            hero: { ...DEFAULT_AFILIADOS_CMS_DATA.hero, ...(val.hero || {}) },
            payoutMethods: { ...DEFAULT_AFILIADOS_CMS_DATA.payoutMethods, ...(val.payoutMethods || {}) },
            faqs: val.faqs || DEFAULT_AFILIADOS_CMS_DATA.faqs,
          });
        }
      });
      return () => unsub();
    } catch (err) {
      console.warn('[CMS Afiliados listener error]:', err);
    }
  }, []);

  const handleCopyDemoCode = () => {
    navigator.clipboard.writeText('TUCUMAN10OFF');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-[#EF4444] selection:text-white">
      
      {/* NAVBAR CON LOGO REAL TRAVELAPP EXPERIENCE */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0A2A5B]/90 border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Real de TravelApp Experience */}
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/assets/experience_blanco.svg"
              alt="TravelApp Experience"
              className="h-9 w-auto group-hover:scale-105 transition-transform"
            />
            <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40">
              Partners
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-200">
            <a href="#niveles" className="hover:text-[#EF4444] transition-colors">Niveles & Comisiones</a>
            <a href="#cobro" className="hover:text-[#EF4444] transition-colors">Métodos de Cobro</a>
            <a href="#faqs" className="hover:text-[#EF4444] transition-colors">Preguntas Frecuentes</a>
          </div>

          {/* Action CTAs con Rojo Coral */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href={cmsData.header.loginUrl}
              className="text-xs font-extrabold text-slate-200 hover:text-white px-4 py-2.5 rounded-xl border border-white/20 hover:bg-white/10 transition-all"
            >
              Iniciar Sesión
            </Link>
            <Link
              href={cmsData.header.registerUrl}
              className="inline-flex items-center gap-2 text-xs font-black text-white bg-[#EF4444] hover:bg-[#DC2626] px-5 py-2.5 rounded-xl shadow-lg shadow-[#EF4444]/30 hover:scale-105 transition-all"
            >
              {cmsData.header.ctaText}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-white/20 text-white hover:bg-white/10"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0A2A5B] border-b border-white/10 px-4 py-6 space-y-4 font-sans">
            <a href="#niveles" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-white">Niveles & Comisiones</a>
            <a href="#cobro" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-white">Métodos de Cobro</a>
            <a href="#faqs" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-white">Preguntas Frecuentes</a>
            <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
              <Link href={cmsData.header.loginUrl} className="w-full text-center py-2.5 text-xs font-bold bg-white/10 text-white rounded-xl">Iniciar Sesión</Link>
              <Link href={cmsData.header.registerUrl} className="w-full text-center py-2.5 text-xs font-black bg-[#EF4444] text-white rounded-xl">Registrarme Gratis</Link>
            </div>
          </div>
        )}
      </nav>

      {/* HERO SECTION CON PALETA TRAVELAPP EXPERIENCE (AZUL TECH + ROJO CORAL) */}
      <section className="relative pt-12 pb-24 overflow-hidden font-sans">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#EF4444]/15 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-[#EF4444]/10 border border-[#EF4444]/30 px-3.5 py-1.5 rounded-full text-xs font-extrabold text-[#EF4444]">
                <Sparkles className="w-4 h-4 text-amber-400" />
                {cmsData.hero.badge}
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-white">
                {cmsData.hero.title}
              </h1>

              <p className="text-base text-slate-300 leading-relaxed font-medium">
                {cmsData.hero.subtitle}
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Link
                  href={cmsData.header.registerUrl}
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-black text-sm shadow-xl shadow-[#EF4444]/30 hover:scale-105 transition-all"
                >
                  {cmsData.hero.primaryCtaText}
                  <ArrowRight className="w-5 h-5 text-amber-300" />
                </Link>

                <a
                  href="#niveles"
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[#0A2A5B] border border-white/10 hover:bg-[#0A2A5B]/80 text-white font-bold text-sm transition-all"
                >
                  {cmsData.hero.secondaryCtaText}
                </a>
              </div>

              {/* Trust Features */}
              <div className="pt-6 border-t border-slate-900 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                {cmsData.stats.map((s, idx) => (
                  <div key={idx} className="bg-[#0A2A5B]/40 border border-slate-800 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
                    <p className="text-base font-black text-[#EF4444] mt-0.5">{s.value}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{s.detail}</p>
                  </div>
                ))}
              </div>

            </div>

            {/* Right Column Card Preview */}
            <div className="relative">
              <div className="relative rounded-3xl border border-slate-800 bg-[#0A2A5B]/60 backdrop-blur-xl p-6 shadow-2xl overflow-hidden">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-6 relative">
                  <img
                    src={cmsData.hero.heroImage}
                    alt="TravelApp Ambassador"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                  
                  <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-slate-700/80 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-emerald-400 uppercase">Cupón Activo Seguidores</p>
                      <p className="text-lg font-black font-mono text-amber-300">FLOR10OFF</p>
                    </div>
                    <button
                      onClick={handleCopyDemoCode}
                      className="bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedCode ? '¡Copiado!' : 'Probar Cupón'}
                    </button>
                  </div>
                </div>

                <div className="space-y-3 font-sans">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Nivel de Creador</span>
                    <span className="font-extrabold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                      Level 3: Master Partner
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Comisión por Cuota</span>
                    <span className="font-black text-emerald-400 text-sm">7.0%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Cobro Preferido</span>
                    <span className="font-bold text-sky-400">Split MP Instantáneo ⚡</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* MATRIZ DE NIVELES */}
      <section id="niveles" className="py-20 bg-slate-900/50 border-y border-slate-800/80 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-[#EF4444]/10 border border-[#EF4444]/30 px-3 py-1 rounded-full text-xs font-bold text-[#EF4444]">
              <Award className="w-4 h-4 text-amber-400" />
              MATRIZ DE NIVELES & CRECIMIENTO
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              A mayor volumen de ventas, mayor porcentaje de comisión
            </h2>
            <p className="text-sm text-slate-300">
              Avanzás de nivel automáticamente a medida que tus seguidores y clientes confirman sus reservas de turismo y experiencias.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {DEFAULT_EXPERIENCE_TIERS.map((tier) => (
              <div
                key={tier.id}
                className="rounded-2xl border border-slate-800 bg-[#0A2A5B]/40 p-6 flex flex-col justify-between hover:border-[#EF4444]/50 hover:shadow-xl hover:shadow-[#EF4444]/10 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30">
                      {tier.name}
                    </span>
                  </div>

                  <div className="mb-6">
                    <span className="text-4xl font-black text-white tracking-tight">{tier.commissionPct}%</span>
                    <span className="text-xs font-bold text-slate-300 ml-1">de comisión</span>
                  </div>

                  <ul className="space-y-3 text-xs text-slate-300 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>{tier.minBookings} a {tier.maxBookings || '∞'}</strong> reservas concretadas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Cupón de <strong>{tier.couponDiscountPct}% OFF</strong> seguidores</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span><strong>+{tier.bonusRewardPoints}</strong> Puntos Rewards por reserva</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href={cmsData.header.registerUrl}
                  className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 group-hover:bg-[#EF4444] group-hover:border-[#EF4444] group-hover:text-white text-slate-300 font-bold text-xs text-center transition-all"
                >
                  Unirme en este Nivel
                </Link>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* MÉTODOS DE COBRO */}
      <section id="cobro" className="py-20 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold text-emerald-400">
              <Wallet className="w-4 h-4 text-emerald-400" />
              TRANSPARENCIA BANCARIA & MERCADO PAGO
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              {cmsData.payoutMethods.title}
            </h2>
            <p className="text-sm text-slate-300">
              {cmsData.payoutMethods.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Split MP */}
            <div className="rounded-3xl border border-sky-500/30 bg-gradient-to-b from-[#0A2A5B] to-slate-950 p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 text-sky-500/10">
                <Zap className="w-32 h-32" />
              </div>
              <div className="inline-flex items-center gap-2 bg-sky-500/20 text-sky-300 text-xs font-extrabold px-3 py-1 rounded-full mb-4 border border-sky-500/30">
                ⚡ PAGO INSTANTÁNEO
              </div>
              <h3 className="text-xl font-black text-white mb-3">
                {cmsData.payoutMethods.optionMpTitle}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                {cmsData.payoutMethods.optionMpDesc}
              </p>
              <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Ejemplo Venta Experiencia:</span>
                  <span className="font-bold text-white">$100.000 ARS</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Tu Comisión Inmediata MP (10%):</span>
                  <span>+$10.000 ARS</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Neto Empresa TravelApp:</span>
                  <span>$90.000 ARS</span>
                </div>
              </div>
            </div>

            {/* CBU Weekly */}
            <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-b from-[#0A2A5B] to-slate-950 p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 text-amber-500/10">
                <DollarSign className="w-32 h-32" />
              </div>
              <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 text-xs font-extrabold px-3 py-1 rounded-full mb-4 border border-amber-500/30">
                🗓️ TODOS LOS LUNES
              </div>
              <h3 className="text-xl font-black text-white mb-3">
                {cmsData.payoutMethods.optionCbuTitle}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                {cmsData.payoutMethods.optionCbuDesc}
              </p>
              <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Acumulado Semanal Billetera:</span>
                  <span className="font-bold text-white">$48.000 ARS</span>
                </div>
                <div className="flex justify-between text-amber-400 font-bold">
                  <span>Transferencia Lunes a tu CBU:</span>
                  <span>$48.000 ARS</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>CBU / CVU Registrado:</span>
                  <span className="font-mono">00000031000...</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* FAQS SECTION */}
      <section id="faqs" className="py-20 bg-slate-900/40 border-t border-slate-800/80 font-sans">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-[#EF4444]/10 border border-[#EF4444]/30 px-3 py-1 rounded-full text-xs font-bold text-[#EF4444]">
              <HelpCircle className="w-4 h-4 text-[#EF4444]" />
              RESPUESTAS RÁPIDAS
            </div>
            <h2 className="text-3xl font-black text-white">Preguntas Frecuentes</h2>
          </div>

          <div className="space-y-4">
            {cmsData.faqs.map((faq, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-800 bg-[#0A2A5B]/30 p-6 space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-[#EF4444] shrink-0" />
                  {faq.q}
                </h3>
                <p className="text-xs text-slate-300 pl-6 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>

          {/* CTA Banner */}
          <div className="rounded-3xl bg-gradient-to-r from-[#0A2A5B] via-blue-900 to-[#EF4444] p-8 sm:p-12 text-center text-white shadow-2xl relative overflow-hidden">
            <h2 className="text-2xl sm:text-3xl font-black mb-3">
              ¿Listo para empezar a ganar con TravelApp?
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 max-w-xl mx-auto mb-6">
              Completá tu registro en menos de 2 minutos y obtené acceso inmediato a tu panel personalizado de embajador.
            </p>
            <Link
              href={cmsData.header.registerUrl}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-[#0A2A5B] font-black text-sm shadow-xl hover:bg-slate-100 hover:scale-105 transition-all"
            >
              Crear mi Cuenta de Afiliado
              <ArrowRight className="w-4 h-4 text-[#EF4444]" />
            </Link>
          </div>

        </div>
      </section>

      {/* FOOTER CORPORATIVO OFICIAL IDENTICO A TRAVELAPP.AR */}
      <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 py-16 text-xs font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            
            {/* Columna 1: Brand */}
            <div className="space-y-4">
              <img
                src="/assets/travelapp_blanco.svg"
                alt="TravelApp Ecosistema"
                className="h-8 w-auto"
              />
              <p className="text-xs text-slate-400 leading-relaxed">
                El Ecosistema de Viajes más completo de Argentina. Experiencias auténticas, movilidad segura y recompensas.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <a href="https://instagram.com/travelapp.ar" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-[#EF4444] transition-all">
                  <span className="sr-only">Instagram</span> 📸
                </a>
                <a href="https://facebook.com/travelapp.ar" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-[#EF4444] transition-all">
                  <span className="sr-only">Facebook</span> 📘
                </a>
              </div>
            </div>

            {/* Columna 2: Unidades de Negocio */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Unidades de Negocio</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/landing/experience" className="hover:text-[#EF4444] transition-colors flex items-center gap-2">
                    <img src="/assets/experience_blanco.svg" className="h-4 w-auto opacity-70" alt="" />
                    TravelApp Experience
                  </Link>
                </li>
                <li>
                  <Link href="/landing/rewards" className="hover:text-[#EF4444] transition-colors flex items-center gap-2">
                    <img src="/assets/rewards_blanco.svg" className="h-4 w-auto opacity-70" alt="" />
                    TravelApp Rewards
                  </Link>
                </li>
                <li>
                  <Link href="/landing/travelcab" className="hover:text-[#EF4444] transition-colors flex items-center gap-2">
                    <img src="/assets/travelcab_blanco.svg" className="h-4 w-auto opacity-70" alt="" />
                    TravelCab Movilidad
                  </Link>
                </li>
              </ul>
            </div>

            {/* Columna 3: Información Legal */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Información Legal</h4>
              <ul className="space-y-2 text-xs">
                <li>TravelApp Ecosistema de Servicios S.A.</li>
                <li>CUIT: 30-71829340-9</li>
                <li>Av. Aconquija 1850, Yerba Buena, Tucumán</li>
                <li>
                  <button onClick={() => setLegalModal({ title: 'Términos y Condiciones', content: 'Términos de servicio oficiales de TravelApp Ecosistema.' })} className="hover:text-white transition-colors text-left">
                    Términos y Condiciones
                  </button>
                </li>
                <li>
                  <button onClick={() => setLegalModal({ title: 'Política de Privacidad', content: 'Política de Privacidad y Protección de Datos de TravelApp.' })} className="hover:text-white transition-colors text-left">
                    Política de Privacidad
                  </button>
                </li>
              </ul>
            </div>

            {/* Columna 4: Contacto */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Contacto Directo</h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <a href="https://wa.me/5493814188106" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-bold">
                    <Phone className="w-3.5 h-3.5" /> WhatsApp Oficial
                  </a>
                </li>
                <li>
                  <a href="tel:08102200018" className="inline-flex items-center gap-2 text-slate-300 hover:text-white font-semibold">
                    <Phone className="w-3.5 h-3.5 text-[#EF4444]" /> 0810-220-0018
                  </a>
                </li>
                <li>
                  <a href="mailto:hola@travelapp.ar" className="inline-flex items-center gap-2 text-slate-300 hover:text-white font-semibold">
                    <Mail className="w-3.5 h-3.5 text-[#EF4444]" /> hola@travelapp.ar
                  </a>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© 2026 TravelApp Ecosistema — Todos los derechos reservados.</p>
            <div className="flex gap-4">
              <button onClick={() => setLegalModal({ title: 'Términos y Condiciones', content: 'Términos de servicio.' })} className="hover:text-slate-300">
                Términos
              </button>
              <button onClick={() => setLegalModal({ title: 'Política de Privacidad', content: 'Política de privacidad.' })} className="hover:text-slate-300">
                Privacidad
              </button>
            </div>
          </div>

        </div>
      </footer>

      {/* LEGAL MODAL */}
      {legalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-slate-100 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">{legalModal.title}</h3>
              <button onClick={() => setLegalModal(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-h-60 overflow-y-auto">
              {legalModal.content}
            </p>
            <button onClick={() => setLegalModal(null)} className="w-full py-2.5 rounded-xl bg-[#0A2A5B] text-white text-xs font-bold">
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* TRAVIS AI WIDGET */}
      <TravisOmnichannelWidget businessUnit="Experiences" />

    </div>
  );
}
