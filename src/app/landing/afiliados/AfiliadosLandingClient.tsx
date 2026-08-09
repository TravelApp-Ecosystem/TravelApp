'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles, Award, ArrowRight, CheckCircle2, Shield, Ticket,
  TrendingUp, Users, DollarSign, Wallet, HelpCircle, ChevronRight,
  Zap, Copy, Check, Menu, X, ArrowUpRight, Phone, Mail, MapPin, Briefcase,
  Upload, Send, Loader2
} from 'lucide-react';
import { doc, onSnapshot, collection, addDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { DEFAULT_EXPERIENCE_TIERS } from '@/lib/commissions';
import { TravisOmnichannelWidget } from '@/components/shared/TravisOmnichannelWidget';

// Inline SVGs for social media
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
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
  if (content.startsWith('http') || content.startsWith('/assets')) {
    return <img src={content} alt={alt} className="h-10 w-auto opacity-75 hover:opacity-100 transition-opacity" />;
  }
  return <div dangerouslySetInnerHTML={{ __html: content }} className="opacity-75 hover:opacity-100 transition-opacity max-h-12 overflow-hidden text-[10px]" />;
};

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
  legales: {
    razonSocial: 'TravelApp s.a.s.',
    cuit: '30-71829340-9',
    domicilio: 'San Miguel de Tucumán, Argentina',
    terminos: 'Al utilizar nuestros servicios, el usuario acepta los términos y condiciones vigentes de TravelApp s.a.s.',
    privacidad: 'TravelApp s.a.s. garantiza la protección de datos personales de conformidad con la Ley 25.326.'
  },
  redesSociales: {
    facebook: 'https://facebook.com/travelapp.ar',
    instagram: 'https://instagram.com/travelapp.ar',
    whatsapp: 'https://wa.me/5493814188106',
    linkedin: '',
    youtube: '',
    tiktok: '',
    messenger: 'https://m.me/travelapp'
  },
  sellosLegales: {
    arcaQr: '',
    baseDatosSello: ''
  },
  trabajaNosotros: {
    titulo: 'Sumate al Equipo TravelApp',
    subtitulo: 'Buscamos personas apasionadas por los viajes, la tecnología y el servicio de excelencia.',
    puestos: ['Conductor Socio TravelCab', 'Guía de Experiencias', 'Atención al Cliente', 'Desarrollo de Software', 'Marketing Digital', 'Operaciones', 'Ventas B2B', 'Otro']
  },
  footer: {
    brandText: 'TravelApp Experience Partners',
    copyrightText: '© 2026 TravelApp Ecosistema. Todos los derechos reservados.'
  }
};

export default function AfiliadosLandingClient() {
  const [cmsData, setCmsData] = useState(DEFAULT_AFILIADOS_CMS_DATA);
  const [tiers, setTiers] = useState(DEFAULT_EXPERIENCE_TIERS);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [legalModal, setLegalModal] = useState<{ title: string; content: string } | null>(null);

  // Escuchar matriz de niveles en tiempo real desde Firestore
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, 'settings', 'affiliate_tiers'), (snap) => {
        if (snap.exists() && snap.data()?.tiers) {
          setTiers(snap.data().tiers);
        }
      });
      return () => unsub();
    } catch (err) {
      console.warn('[Tiers listener error]:', err);
    }
  }, []);

  // Job Modal State (Trabajá con nosotros)
  const [showJobModal, setShowJobModal] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [jobForm, setJobForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    puesto: '',
    mensaje: ''
  });

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
            legales: { ...DEFAULT_AFILIADOS_CMS_DATA.legales, ...(val.legales || {}) },
            redesSociales: { ...DEFAULT_AFILIADOS_CMS_DATA.redesSociales, ...(val.redesSociales || {}) },
            sellosLegales: { ...DEFAULT_AFILIADOS_CMS_DATA.sellosLegales, ...(val.sellosLegales || {}) },
            trabajaNosotros: { ...DEFAULT_AFILIADOS_CMS_DATA.trabajaNosotros, ...(val.trabajaNosotros || {}) },
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

  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvFile) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');
    try {
      const path = `cv_submissions/${Date.now()}_${cvFile.name}`;
      const fileRef = storageRef(storage, path);
      const task = uploadBytesResumable(fileRef, cvFile);

      task.on(
        'state_changed',
        (snap) => {
          const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
          setUploadProgress(pct);
        },
        (err) => {
          console.error(err);
          setSubmitStatus('error');
          setIsSubmitting(false);
        },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          await addDoc(collection(db, 'job_applications'), {
            ...jobForm,
            cvUrl: url,
            createdAt: new Date().toISOString(),
            status: 'pendiente'
          });
          setSubmitStatus('success');
          setIsSubmitting(false);
        }
      );
    } catch (err) {
      console.error(err);
      setSubmitStatus('error');
      setIsSubmitting(false);
    }
  };

  const resetJobModal = () => {
    setShowJobModal(false);
    setCvFile(null);
    setSubmitStatus('idle');
    setUploadProgress(0);
    setJobForm({ nombre: '', apellido: '', email: '', telefono: '', puesto: '', mensaje: '' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#EF4444] selection:text-white">
      
      {/* NAVBAR CON LOGO REAL TRAVELAPP EXPERIENCE */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0A2A5B] border-b border-white/10 transition-all shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Real de TravelApp Experience */}
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/assets/experience_blanco.svg"
              alt="TravelApp Experience"
              className="h-9 w-auto group-hover:scale-105 transition-transform"
            />
            <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40">
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

      {/* HERO SECTION CON FONDO GRIS PROFESIONAL CLARO (SLATE 50 / WHITE) */}
      <section className="relative pt-12 pb-24 overflow-hidden font-sans bg-gradient-to-b from-slate-50 via-white to-slate-100 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-[#EF4444]/10 border border-[#EF4444]/30 px-3.5 py-1.5 rounded-full text-xs font-extrabold text-[#EF4444]">
                <Sparkles className="w-4 h-4 text-amber-500" />
                {cmsData.hero.badge}
              </div>

              {/* Título en Azul Tech */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-[#0A2A5B]">
                {cmsData.hero.title}
              </h1>

              <p className="text-base text-slate-600 leading-relaxed font-medium">
                {cmsData.hero.subtitle}
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Link
                  href={cmsData.header.registerUrl}
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-black text-sm shadow-xl shadow-[#EF4444]/25 hover:scale-105 transition-all"
                >
                  {cmsData.hero.primaryCtaText}
                  <ArrowRight className="w-5 h-5 text-amber-300" />
                </Link>

                <a
                  href="#niveles"
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-[#0A2A5B] font-bold text-sm shadow-sm transition-all"
                >
                  {cmsData.hero.secondaryCtaText}
                </a>
              </div>

              {/* Trust Features Cards */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                {cmsData.stats.map((s, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
                    <p className="text-base font-black text-[#EF4444] mt-0.5">{s.value}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{s.detail}</p>
                  </div>
                ))}
              </div>

            </div>

            {/* Right Column Card Preview (Fondo Blanco Limpio con Sombra Elegante) */}
            <div className="relative">
              <div className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl overflow-hidden">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-6 relative border border-slate-200">
                  <img
                    src={cmsData.hero.heroImage}
                    alt="TravelApp Ambassador"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                  
                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-md flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase">Cupón Activo Seguidores</p>
                      <p className="text-lg font-black font-mono text-[#0A2A5B]">FLOR10OFF</p>
                    </div>
                    <button
                      onClick={handleCopyDemoCode}
                      className="bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedCode ? '¡Copiado!' : 'Probar Cupón'}
                    </button>
                  </div>
                </div>

                <div className="space-y-3 font-sans">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Nivel de Creador</span>
                    <span className="font-extrabold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      Level 3: Master Partner
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Comisión por Cuota</span>
                    <span className="font-black text-emerald-600 text-sm">7.0%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Cobro Preferido</span>
                    <span className="font-bold text-sky-600">Split MP Instantáneo ⚡</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* MATRIZ DE NIVELES CON TARJETAS EN FONDO BLANCO */}
      <section id="niveles" className="py-20 bg-white border-b border-slate-200 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-[#EF4444]/10 border border-[#EF4444]/30 px-3 py-1 rounded-full text-xs font-bold text-[#EF4444]">
              <Award className="w-4 h-4 text-amber-500" />
              MATRIZ DE NIVELES & CRECIMIENTO
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0A2A5B]">
              A mayor volumen de ventas, mayor porcentaje de comisión
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              Avanzás de nivel automáticamente a medida que tus seguidores y clientes confirman sus reservas de turismo y experiencias.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 flex flex-col justify-between hover:border-[#EF4444] hover:bg-white hover:shadow-xl transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20">
                      {tier.name}
                    </span>
                  </div>

                  <div className="mb-6">
                    <span className="text-4xl font-black text-[#0A2A5B] tracking-tight">{tier.commissionPct}%</span>
                    <span className="text-xs font-bold text-slate-500 ml-1">de comisión</span>
                  </div>

                  <ul className="space-y-3 text-xs text-slate-600 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>{tier.minBookings} a {tier.maxBookings || '∞'}</strong> reservas concretadas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Cupón de <strong>{tier.couponDiscountPct}% OFF</strong> seguidores</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                      <span><strong>+{tier.bonusRewardPoints}</strong> Puntos Rewards por reserva</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href={cmsData.header.registerUrl}
                  className="w-full py-2.5 rounded-xl bg-white border border-slate-200 group-hover:bg-[#EF4444] group-hover:border-[#EF4444] group-hover:text-white text-[#0A2A5B] font-bold text-xs text-center transition-all shadow-sm"
                >
                  Unirme en este Nivel
                </Link>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* MÉTODOS DE COBRO CON ILUSTRACIÓN LIMPIA */}
      <section id="cobro" className="py-20 bg-slate-50 font-sans border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold text-emerald-700">
              <Wallet className="w-4 h-4 text-emerald-600" />
              TRANSPARENCIA BANCARIA & MERCADO PAGO
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0A2A5B]">
              {cmsData.payoutMethods.title}
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              {cmsData.payoutMethods.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Split MP */}
            <div className="rounded-3xl border border-sky-200 bg-white p-8 relative overflow-hidden shadow-md">
              <div className="inline-flex items-center gap-2 bg-sky-50 text-sky-700 text-xs font-extrabold px-3 py-1 rounded-full mb-4 border border-sky-200">
                ⚡ PAGO INSTANTÁNEO
              </div>
              <h3 className="text-xl font-black text-[#0A2A5B] mb-3">
                {cmsData.payoutMethods.optionMpTitle}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                {cmsData.payoutMethods.optionMpDesc}
              </p>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Ejemplo Venta Experiencia:</span>
                  <span className="font-bold text-[#0A2A5B]">$100.000 ARS</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-bold">
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
            <div className="rounded-3xl border border-amber-200 bg-white p-8 relative overflow-hidden shadow-md">
              <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-xs font-extrabold px-3 py-1 rounded-full mb-4 border border-amber-200">
                🗓️ TODOS LOS LUNES
              </div>
              <h3 className="text-xl font-black text-[#0A2A5B] mb-3">
                {cmsData.payoutMethods.optionCbuTitle}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                {cmsData.payoutMethods.optionCbuDesc}
              </p>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Acumulado Semanal Billetera:</span>
                  <span className="font-bold text-[#0A2A5B]">$48.000 ARS</span>
                </div>
                <div className="flex justify-between text-amber-700 font-bold">
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

      {/* FAQS SECTION EN FONDO BLANCO */}
      <section id="faqs" className="py-20 bg-white font-sans">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-[#EF4444]/10 border border-[#EF4444]/30 px-3 py-1 rounded-full text-xs font-bold text-[#EF4444]">
              <HelpCircle className="w-4 h-4 text-[#EF4444]" />
              RESPUESTAS RÁPIDAS
            </div>
            <h2 className="text-3xl font-black text-[#0A2A5B]">Preguntas Frecuentes</h2>
          </div>

          <div className="space-y-4">
            {cmsData.faqs.map((faq, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 space-y-2">
                <h3 className="text-base font-bold text-[#0A2A5B] flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-[#EF4444] shrink-0" />
                  {faq.q}
                </h3>
                <p className="text-xs text-slate-600 pl-6 leading-relaxed">
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

      {/* FOOTER CORPORATIVO OFICIAL EXACTAMENTE IDÉNTICO A TRAVELAPP.AR */}
      <footer className="bg-slate-950 text-slate-400 py-16 text-xs font-sans border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            
            {/* Columna 1: Brand & Redes Sociales */}
            <div className="space-y-4">
              <img
                src="/assets/travelapp_blanco.svg"
                alt="TravelApp Ecosistema"
                className="h-8 w-auto"
              />
              <p className="text-xs text-slate-400 leading-relaxed">
                El Ecosistema de Viajes más completo de Argentina. Experiencias auténticas, movilidad segura y recompensas.
              </p>
              <div className="flex items-center gap-2.5 pt-2">
                {cmsData.redesSociales?.instagram && (
                  <a href={cmsData.redesSociales.instagram} target="_blank" rel="noreferrer" className="h-9 w-9 rounded-xl bg-slate-900 hover:bg-[#EF4444] flex items-center justify-center transition-colors border border-slate-800">
                    <InstagramIcon className="h-4 w-4 text-slate-400 hover:text-white" />
                  </a>
                )}
                {cmsData.redesSociales?.facebook && (
                  <a href={cmsData.redesSociales.facebook} target="_blank" rel="noreferrer" className="h-9 w-9 rounded-xl bg-slate-900 hover:bg-blue-600 flex items-center justify-center transition-colors border border-slate-800">
                    <FacebookIcon className="h-4 w-4 text-slate-400 hover:text-white" />
                  </a>
                )}
                {cmsData.redesSociales?.linkedin && (
                  <a href={cmsData.redesSociales.linkedin} target="_blank" rel="noreferrer" className="h-9 w-9 rounded-xl bg-slate-900 hover:bg-blue-700 flex items-center justify-center transition-colors border border-slate-800">
                    <LinkedinIcon className="h-4 w-4 text-slate-400 hover:text-white" />
                  </a>
                )}
                {cmsData.redesSociales?.youtube && (
                  <a href={cmsData.redesSociales.youtube} target="_blank" rel="noreferrer" className="h-9 w-9 rounded-xl bg-slate-900 hover:bg-red-600 flex items-center justify-center transition-colors border border-slate-800">
                    <YoutubeIcon className="h-4 w-4 text-slate-400 hover:text-white" />
                  </a>
                )}
                {cmsData.redesSociales?.tiktok && (
                  <a href={cmsData.redesSociales.tiktok} target="_blank" rel="noreferrer" className="h-9 w-9 rounded-xl bg-slate-900 hover:bg-black flex items-center justify-center transition-colors border border-slate-800">
                    <TiktokIcon className="h-4 w-4 text-slate-400 hover:text-white" />
                  </a>
                )}
              </div>
            </div>

            {/* Columna 2: Unidades de Negocio */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider mb-4">Nuestros Servicios</h4>
              <ul className="space-y-3 text-xs">
                <li>
                  <Link href="/landing/experience" className="flex items-center gap-2 hover:text-[#EF4444] transition-colors">
                    <img src="/assets/experience_blanco.svg" className="h-4 w-auto opacity-60" alt="" />
                    TravelApp Experience
                  </Link>
                </li>
                <li>
                  <Link href="/landing/rewards" className="flex items-center gap-2 hover:text-[#EF4444] transition-colors">
                    <img src="/assets/rewards_blanco.svg" className="h-4 w-auto opacity-60" alt="" />
                    TravelApp Rewards
                  </Link>
                </li>
                <li>
                  <Link href="/landing/travelcab" className="flex items-center gap-2 hover:text-[#EF4444] transition-colors">
                    <img src="/assets/travelcab_blanco.svg" className="h-4 w-auto opacity-60" alt="" />
                    TravelCab
                  </Link>
                </li>
              </ul>
            </div>

            {/* Columna 3: Información Legal */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider mb-4">Información Legal</h4>
              <ul className="space-y-3 text-xs text-slate-400">
                <li>{cmsData.legales?.razonSocial}</li>
                <li>CUIT: {cmsData.legales?.cuit}</li>
                <li>{cmsData.legales?.domicilio}</li>
                <li>
                  <button onClick={() => setLegalModal({ title: 'Términos y Condiciones', content: cmsData.legales?.terminos })} className="hover:text-white transition-colors text-left">
                    Términos y Condiciones
                  </button>
                </li>
                <li>
                  <button onClick={() => setLegalModal({ title: 'Política de Privacidad', content: cmsData.legales?.privacidad })} className="hover:text-white transition-colors text-left">
                    Política de Privacidad
                  </button>
                </li>
              </ul>
            </div>

            {/* Columna 4: Contacto */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider mb-4">Contacto</h4>
              <ul className="space-y-3 text-xs">
                <li>
                  <a href={cmsData.redesSociales?.whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-bold">
                    <Phone className="h-3.5 w-3.5" /> WhatsApp
                  </a>
                </li>
                <li>
                  <a href="tel:08102200018" className="inline-flex items-center gap-2 text-slate-300 hover:text-white font-semibold">
                    <Phone className="h-3.5 w-3.5 text-[#EF4444]" /> 0810-220-0018
                  </a>
                </li>
                <li>
                  <a href="mailto:hola@travelapp.ar" className="inline-flex items-center gap-2 text-slate-300 hover:text-white font-semibold">
                    <Mail className="h-3.5 w-3.5 text-[#EF4444]" /> hola@travelapp.ar
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setShowJobModal(true);
                      setSubmitStatus('idle');
                    }}
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-left"
                  >
                    <Briefcase className="h-3.5 w-3.5 text-[#EF4444]" /> Trabajá con Nosotros
                  </button>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
            <p className="order-2 md:order-1 text-center md:text-left">
              © 2026 {cmsData.legales?.razonSocial} — Todos los derechos reservados.
            </p>
            <div className="order-1 md:order-2 flex flex-wrap items-center justify-center gap-4">
              <RenderLegalSeal content={cmsData.sellosLegales?.arcaQr} alt="ARCA" />
              <RenderLegalSeal content={cmsData.sellosLegales?.baseDatosSello} alt="Base de Datos" />
            </div>
            <div className="order-3 flex gap-5">
              <button onClick={() => setLegalModal({ title: 'Términos y Condiciones', content: cmsData.legales?.terminos })} className="hover:text-slate-300">
                Términos de Servicio
              </button>
              <button onClick={() => setLegalModal({ title: 'Política de Privacidad', content: cmsData.legales?.privacidad })} className="hover:text-slate-300">
                Privacidad
              </button>
            </div>
          </div>

        </div>
      </footer>

      {/* LEGAL MODAL */}
      {legalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn font-sans">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full text-slate-900 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-[#0A2A5B]">{legalModal.title}</h3>
              <button onClick={() => setLegalModal(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-h-60 overflow-y-auto">
              {legalModal.content}
            </p>
            <button onClick={() => setLegalModal(null)} className="w-full py-2.5 rounded-xl bg-[#0A2A5B] text-white text-xs font-bold">
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* JOB APPLICATION MODAL (TRABAJÁ CON NOSOTROS) */}
      {showJobModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 bg-slate-950/80 backdrop-blur-sm overflow-y-auto font-sans">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl mb-8 overflow-hidden border border-slate-200">
            <div className="relative bg-[#0A2A5B] p-8 text-white">
              <button onClick={resetJobModal} className="absolute top-5 right-5 h-9 w-9 rounded-full bg-white/10 flex items-center justify-center">
                <X className="h-5 w-5 text-white" />
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#EF4444]">
                Postulaciones Abiertas
              </span>
              <h3 className="text-2xl font-black mt-1 leading-snug">
                {cmsData.trabajaNosotros?.titulo}
              </h3>
              <p className="text-xs text-slate-300 mt-2">
                {cmsData.trabajaNosotros?.subtitulo}
              </p>
            </div>

            {submitStatus === 'success' ? (
              <div className="p-12 text-center">
                <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <h4 className="text-2xl font-black text-[#0A2A5B] mb-2">¡Postulación Recibida!</h4>
                <p className="text-slate-600 text-xs mb-6">Tu CV fue enviado exitosamente al equipo de RRHH.</p>
                <button onClick={resetJobModal} className="rounded-xl bg-[#0A2A5B] text-white px-8 py-3 text-xs font-bold">Cerrar</button>
              </div>
            ) : (
              <form onSubmit={handleJobSubmit} className="p-8 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nombre *</label>
                    <input required type="text" value={jobForm.nombre} onChange={e => setJobForm(p => ({ ...p, nombre: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Apellido *</label>
                    <input required type="text" value={jobForm.apellido} onChange={e => setJobForm(p => ({ ...p, apellido: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email *</label>
                    <input required type="email" value={jobForm.email} onChange={e => setJobForm(p => ({ ...p, email: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Teléfono</label>
                    <input type="tel" value={jobForm.telefono} onChange={e => setJobForm(p => ({ ...p, telefono: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Área de Interés *</label>
                  <select required value={jobForm.puesto} onChange={e => setJobForm(p => ({ ...p, puesto: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none">
                    <option value="">Seleccioná el área...</option>
                    {(cmsData.trabajaNosotros?.puestos || []).map((p: string) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">¿Por qué querés sumarte al equipo? *</label>
                  <textarea required rows={3} value={jobForm.mensaje} onChange={e => setJobForm(p => ({ ...p, mensaje: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none" />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Curriculum Vitae (PDF o DOCX · máx. 5MB) *</label>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={e => { const f = e.target.files?.[0]; if (f) setCvFile(f); }} className="w-full text-xs text-slate-500" />
                </div>

                <button type="submit" disabled={isSubmitting || !cvFile} className="w-full py-3.5 rounded-xl bg-[#0A2A5B] hover:bg-[#0A2A5B]/90 text-white font-bold text-xs transition-all disabled:opacity-50">
                  {isSubmitting ? 'Enviando...' : 'Enviar Postulación'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TRAVIS AI WIDGET */}
      <TravisOmnichannelWidget businessUnit="Experiences" />

    </div>
  );
}
