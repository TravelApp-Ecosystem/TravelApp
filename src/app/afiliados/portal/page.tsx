'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles, Award, Copy, Check, Ticket, TrendingUp, ArrowLeft,
  ShoppingBag, Image as ImageIcon, Video, MessageSquare, Download, Share2,
  ExternalLink, Zap, CheckCircle2, ShieldCheck, CreditCard, RefreshCw, Smartphone
} from 'lucide-react';

export default function AfiliadosPortalPage() {
  const [copied, setCopied] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'marketplace' | 'mediahub' | 'payouts'>('dashboard');

  // Mercado Pago OAuth State
  const [mpLinked, setMpLinked] = useState(true);
  const [mpAccountEmail, setMpAccountEmail] = useState('mp.florencia@mercadopago.com.ar');

  // Creator Profile Data
  const creator = {
    name: 'María Florencia Rossi',
    role: 'Experience Ambassador / Creator',
    refCode: 'FLOR_TRAVEL',
    currentTierName: 'Level 3: Master Partner',
    commissionPct: 7.0, // 7% por cuota
    couponCode: 'FLOR10OFF',
    couponDiscountPct: 10,
    shareUrl: 'https://travelapp.ar/landing/experience?ref=FLOR_TRAVEL',
    totalBookings: 14,
    nextTierMinBookings: 20,
    nextTierName: 'Level 4: VIP Ambassador (10% comisión)',
    totalEarned: 98000,
    walletBalance: 98000,
    rewardsPoints: 3500,
  };

  // Marketplace Catalog Items
  const catalogExperiences = [
    {
      id: 'EXP-101',
      title: 'Excursión Valles Calchaquíes & Bodegas VIP',
      location: 'Tafí del Valle & Cafayate',
      price: 120000,
      commissionPerSale: 8400, // 7%
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
      badge: 'Más Vendida',
    },
    {
      id: 'EXP-102',
      title: 'Trekking & Canopy Aventura Yungas',
      location: 'San Javier, Tucumán',
      price: 60000,
      commissionPerSale: 4200,
      imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80',
      badge: 'Aventura',
    },
    {
      id: 'EXP-103',
      title: 'Traslado Privado Executive TravelCab',
      location: 'Aeropuerto Tucumán ➔ Hotel',
      price: 45000,
      commissionPerSale: 3150,
      imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=600&q=80',
      badge: 'Movilidad VIP',
    },
    {
      id: 'EXP-104',
      title: 'Día de Campo & Cabalgata en Ruinas de Quilmes',
      location: 'Amaicha del Valle',
      price: 95000,
      commissionPerSale: 6650,
      imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80',
      badge: 'Cultura & Historia',
    }
  ];

  // Media Hub Resources
  const mediaResources = [
    {
      id: 'MED-01',
      title: 'Pack Fotos HD Valles Calchaquíes & Bodegas (10 fotos)',
      type: 'image',
      size: '15 MB',
      downloadUrl: '#',
      previewUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'MED-02',
      title: 'Reel 9:16 Aventura Yungas (Editado con audio en tendencia)',
      type: 'video',
      size: '42 MB',
      downloadUrl: '#',
      previewUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'MED-03',
      title: 'Template de Historia Instagram con Código FLOR10OFF',
      type: 'image',
      size: '8 MB',
      downloadUrl: '#',
      previewUrl: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=400&q=80',
    }
  ];

  // Suggested Copy Texts
  const copyTemplates = [
    {
      id: 'CP-01',
      platform: 'Instagram / TikTok Caption',
      text: '¡Vivir la experiencia de los Valles Calchaquíes nunca fue tan fácil! 🍇🍷 Usando mi código FLOR10OFF tenés un 10% de descuento en tu reserva con TravelApp. ¡Reservá acá y disfrutá Tucumán con todo incluido! 👉 https://travelapp.ar/landing/experience?ref=FLOR_TRAVEL',
    },
    {
      id: 'CP-02',
      platform: 'Mensaje de WhatsApp para Seguidores / Grupos',
      text: '¡Hola! Te comparto un descuento exclusivo para tu próximo viaje o excursión en Tucumán. Usá el cupón FLOR10OFF en la web oficial de TravelApp: https://travelapp.ar/landing/experience?ref=FLOR_TRAVEL ¡Espero que lo disfrutes mucho! 🙌✨',
    }
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(creator.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const progressPct = Math.min(100, Math.round((creator.totalBookings / creator.nextTierMinBookings) * 100));

  return (
    <div className="flex h-full w-full flex-col bg-slate-50 p-4 sm:p-6 gap-6 overflow-y-auto font-sans">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0A2A5B] via-blue-900 to-[#EF4444] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-amber-300 border border-white/10">
            <Sparkles className="h-4 w-4" />
            Portal Oficial de Embajador TravelApp Experience
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">{creator.name}</h1>
          <p className="text-xs text-slate-200">
            Nivel Actual: <strong className="text-amber-300">{creator.currentTierName}</strong> · Comisión por Cuota: <strong className="text-emerald-300">{creator.commissionPct}%</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-right">
            <p className="text-[10px] font-bold text-slate-200 uppercase">Comisiones Liquidadas</p>
            <p className="text-2xl font-black text-amber-300">${creator.walletBalance.toLocaleString('es-AR')}</p>
          </div>
        </div>
      </div>

      {/* TABS DE NAVEGACIÓN */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'dashboard'
              ? 'bg-[#0A2A5B] text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4 text-[#EF4444]" />
          Dashboard & Métricas
        </button>

        <button
          onClick={() => setActiveTab('marketplace')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'marketplace'
              ? 'bg-[#0A2A5B] text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-emerald-400" />
          Marketplace de Viajes de la Empresa
        </button>

        <button
          onClick={() => setActiveTab('mediahub')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'mediahub'
              ? 'bg-[#0A2A5B] text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-amber-400" />
          Repositorio de Recursos (Media Hub)
        </button>

        <button
          onClick={() => setActiveTab('payouts')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'payouts'
              ? 'bg-[#0A2A5B] text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Zap className="w-4 h-4 text-sky-400" />
          Vinculación de Mercado Pago (OAuth)
        </button>
      </div>

      {/* CONTENIDO PESTAÑA 1: DASHBOARD & MÉTRICAS */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* BARRA DE PROGRESO DE NIVEL */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Award className="h-6 w-6 text-[#EF4444]" />
                <h3 className="text-sm font-black text-[#0A2A5B]">
                  Progreso de Nivel: {creator.totalBookings} / {creator.nextTierMinBookings} Reservas Concretadas
                </h3>
              </div>
              <span className="text-xs font-extrabold text-[#0A2A5B] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                ¡Faltan {creator.nextTierMinBookings - creator.totalBookings} reservas para subir a {creator.nextTierName}!
              </span>
            </div>

            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-0.5 shadow-inner border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-[#0A2A5B] to-[#EF4444] rounded-full transition-all duration-500 shadow-md"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* CARD DE ENLACE DE REFERIDO Y CUPÓN */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-[#0A2A5B] flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-emerald-600" />
                  Tu Enlace de Afiliado & Código de Descuento para Seguidores
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Compartí este código con tus seguidores para que reciban un <strong className="text-emerald-600">{creator.couponDiscountPct}% OFF</strong> en su viaje. ¡Al reservar con tu enlace cobrás tu comisión en cada cuota!
                </p>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono text-xs font-bold text-slate-700 flex justify-between items-center">
                  <span>{creator.shareUrl}</span>
                  <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded font-sans font-black border border-emerald-300">
                    CUPÓN: {creator.couponCode}
                  </span>
                </div>

                <button
                  onClick={handleCopyLink}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] px-5 py-3 text-xs font-bold text-white shadow-md transition-all"
                >
                  {copied ? <Check className="h-4 w-4 text-amber-300" /> : <Copy className="h-4 w-4" />}
                  {copied ? '¡Enlace Copiado!' : 'Copiar Enlace'}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-[#0A2A5B] to-emerald-800 p-6 text-white shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold opacity-80 mb-2">
                  <span>TRAVELAPP EXPERIENCE</span>
                  <span>VALIDEZ ACTIVA</span>
                </div>
                <p className="text-3xl font-black">{creator.couponDiscountPct}% OFF</p>
                <p className="text-xs opacity-90 mt-1">Beneficio exclusivo para tus clientes y seguidores.</p>
              </div>

              <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 text-center border border-white/20 mt-4">
                <span className="text-xs font-mono font-black text-amber-300 tracking-wider">
                  {creator.couponCode}
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* CONTENIDO PESTAÑA 2: MARKETPLACE DE VIAJES DE LA EMPRESA */}
      {activeTab === 'marketplace' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <h3 className="text-base font-black text-[#0A2A5B] flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#EF4444]" /> Catálogo Oficial de Viajes & Experiencias de la Empresa
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Elegí cualquier experiencia o paquete turístico del catálogo corporativo, generá tu link personalizado con 1-click y empezá a comisionar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {catalogExperiences.map((exp) => (
              <div key={exp.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
                <div>
                  <div className="relative h-44">
                    <img src={exp.imageUrl} alt={exp.title} className="w-full h-full object-cover" />
                    <span className="absolute top-3 left-3 bg-[#0A2A5B] text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {exp.badge}
                    </span>
                  </div>
                  <div className="p-4 space-y-2 text-xs">
                    <h4 className="font-bold text-[#0A2A5B] leading-snug">{exp.title}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">{exp.location}</p>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-slate-400">Precio Venta:</span>
                      <span className="font-bold text-slate-700">${exp.price.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-700 font-bold">
                      <span>Tu Comisión ({creator.commissionPct}%):</span>
                      <span>+${exp.commissionPerSale.toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 space-y-2">
                  <button
                    onClick={() => handleCopyText(`https://travelapp.ar/landing/experience?id=${exp.id}&ref=${creator.refCode}`, exp.id)}
                    className="w-full py-2.5 rounded-xl bg-[#0A2A5B] hover:bg-[#0A2A5B]/90 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    {copiedItem === exp.id ? <Check className="w-3.5 h-3.5 text-amber-300" /> : <Share2 className="w-3.5 h-3.5" />}
                    {copiedItem === exp.id ? '¡Link Copiado!' : 'Generar Link de Experiencia'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTENIDO PESTAÑA 3: REPOSORTIO DE RECURSOS PROMOCIONALES (MEDIA HUB) */}
      {activeTab === 'mediahub' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <h3 className="text-base font-black text-[#0A2A5B] flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-amber-500" /> Repositorio de Recursos & Material Promocional
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Descargá imágenes HD sin marca de agua, Reels de video listos para publicar, y copys diseñados para aumentar tus conversiones.
            </p>
          </div>

          {/* Galería de Archivos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mediaResources.map((res) => (
              <div key={res.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
                <div className="relative h-36 rounded-xl overflow-hidden border border-slate-200">
                  <img src={res.previewUrl} alt={res.title} className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] font-mono px-2 py-0.5 rounded">
                    {res.size}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-[#0A2A5B] leading-snug">{res.title}</h4>
                <a
                  href={res.previewUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0A2A5B] font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-200"
                >
                  <Download className="w-3.5 h-3.5 text-[#EF4444]" /> Descargar Recurso HD
                </a>
              </div>
            ))}
          </div>

          {/* Plantillas de Textos / Copys */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-black text-xs text-[#0A2A5B] uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#EF4444]" /> Copys & Textos Sugeridos para Publicaciones
            </h4>

            <div className="space-y-4">
              {copyTemplates.map((copy) => (
                <div key={copy.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-[#0A2A5B]">
                    <span>{copy.platform}</span>
                    <button
                      onClick={() => handleCopyText(copy.text, copy.id)}
                      className="inline-flex items-center gap-1 text-[#EF4444] hover:text-red-700 font-extrabold text-[11px]"
                    >
                      {copiedItem === copy.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedItem === copy.id ? '¡Copiado!' : 'Copiar Copy'}
                    </button>
                  </div>
                  <p className="text-slate-700 font-mono text-[11px] bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
                    {copy.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* CONTENIDO PESTAÑA 4: VINCULACIÓN DE MERCADO PAGO (OAUTH SPLIT) */}
      {activeTab === 'payouts' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-[#0A2A5B] flex items-center gap-2">
                  <Zap className="w-5 h-5 text-sky-500" /> Vinculación de Cuenta de Mercado Pago (OAuth Split Inverso)
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Conectá tu cuenta de Mercado Pago vía OAuth para recibir la acreditación instantánea de tus comisiones cada vez que un cliente reserve.
                </p>
              </div>
            </div>

            {/* Estado de Vinculación MP */}
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-black text-xl shadow-md">
                    MP
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#0A2A5B] flex items-center gap-1.5">
                      Estado de Vinculación: 
                      {mpLinked ? (
                        <span className="text-emerald-700 font-black bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full text-[10px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Vinculado & Activo
                        </span>
                      ) : (
                        <span className="text-amber-700 font-black bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full text-[10px]">
                          Desconectado
                        </span>
                      )}
                    </h4>
                    {mpLinked && (
                      <p className="text-xs text-slate-600 font-mono mt-0.5">Cuenta MP: {mpAccountEmail}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setMpLinked(!mpLinked)}
                  className={`px-5 py-3 rounded-xl font-bold text-xs shadow-md transition-all ${
                    mpLinked
                      ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      : 'bg-sky-600 text-white hover:bg-sky-700'
                  }`}
                >
                  {mpLinked ? 'Desvincular Cuenta MP' : '⚡ Conectar Mercado Pago OAuth'}
                </button>
              </div>

              {mpLinked && (
                <div className="bg-white p-4 rounded-xl border border-sky-200 text-xs text-slate-600 space-y-1 font-medium">
                  <p className="flex items-center gap-1.5 text-emerald-700 font-bold">
                    <ShieldCheck className="w-4 h-4" /> Vinculación Mercado Pago OAuth Certificada
                  </p>
                  <p>Cada cuota abonada por tus referidos se dividirá automáticamente en el acto (Split Inverso MP). El {creator.commissionPct}% ingresa directo a tu billetera Mercado Pago.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
