"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Compass,
  Gift,
  Users,
  Car,
  Sparkles,
  ShieldCheck,
  Building2,
  CheckCircle2,
  ArrowRight,
  Globe,
  Award,
  Zap,
  Phone,
  Mail,
  MapPin,
  X,
  Eye,
  Target,
  HeartHandshake
} from "lucide-react";

import { OtaHeader } from "@/components/ota/OtaHeader";
import { OtaHeroSlider, HeroSlide } from "@/components/ota/OtaHeroSlider";
import { OtaSearchEngine } from "@/components/ota/OtaSearchEngine";
import { OtaFloatingPromos } from "@/components/ota/OtaFloatingPromos";
import { OtaMarketplaceCarousel, MarketplaceItem } from "@/components/ota/OtaMarketplaceCarousel";
import { OtaAppSection } from "@/components/ota/OtaAppSection";
import { OtaRewardsSection } from "@/components/ota/OtaRewardsSection";
import { OtaTravisSection } from "@/components/ota/OtaTravisSection";
import { OtaCareersSection } from "@/components/ota/OtaCareersSection";
import { OtaFooter } from "@/components/ota/OtaFooter";
import { OtaPromoPushPop, PromoPushPopConfig } from "@/components/ota/OtaPromoPushPop";
import { OtaCookieConsent } from "@/components/ota/OtaCookieConsent";
import { TravisOmnichannelWidget } from "@/components/shared/TravisOmnichannelWidget";

interface EcosistemaLandingClientProps {
  initialCms: any;
}

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: "slide-1",
    mediaType: "image",
    mediaUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2560&q=95",
    badge: "✦ DESTINOS PARADISÍACOS 2026",
    title: "Viajá donde siempre soñaste",
    subtitle:
      "Playas de aguas turquesas, hoteles all inclusive y traslados seguros. Disfrutá el mundo con la tranquilidad que merecés.",
    ctaText: "Ver Paquetes Caribe",
    ctaUrl: "/marketplace?destination=Cancún",
  },
  {
    id: "slide-2",
    mediaType: "image",
    mediaUrl:
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=2560&q=95",
    badge: "✦ EXPERIENCIAS & AVENTURA",
    title: "Descubrí la magia de la Patagonia",
    subtitle:
      "Lagos glaciares, montañas imponentes y gastronomía de montaña con guías verificados y cuotas fijas.",
    ctaText: "Explorar la Patagonia",
    ctaUrl: "/marketplace?destination=Bariloche",
  },
  {
    id: "slide-3",
    mediaType: "image",
    mediaUrl:
      "https://images.unsplash.com/photo-1589556264800-08ae9e129a8c?auto=format&fit=crop&w=2560&q=95",
    badge: "✦ MARAVILLAS NATURALES",
    title: "La fuerza viva del Iguazú",
    subtitle:
      "Sumergite en la selva misionera con vuelos directos, paseos náuticos y hotelería de primer nivel.",
    ctaText: "Ver Salidas Iguazú",
    ctaUrl: "/marketplace?destination=Iguazú",
  },
];

const DEFAULT_PROMO_PUSHPOP: PromoPushPopConfig = {
  enabled: true,
  badge: "🔥 TRAVEL SALE 2026",
  title: "¡Hasta 40% OFF en Paquetes y Puntos Dobles!",
  subtitle:
    "Aprovechá las mejores escapadas de fin de semana largo y sumá doble puntaje TravelApp Rewards en todas tus reservas.",
  discountCode: "TRAVELSALE",
  imageUrl:
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=85",
  ctaText: "Ver Ofertas Especiales",
  ctaUrl: "/marketplace",
};

export default function EcosistemaLandingClient({
  initialCms,
}: EcosistemaLandingClientProps) {
  const [cms, setCms] = useState<any>(initialCms || {});
  const [currency, setCurrency] = useState<"ARS" | "USD">("ARS");

  // Modales interactivos
  const [quienesSomosModal, setQuienesSomosModal] = useState<"vision" | "mision" | "valores" | null>(null);
  const [contactoModal, setContactoModal] = useState(false);

  // Cargar preferencia de moneda guardada
  useEffect(() => {
    const savedCurrency = localStorage.getItem("ta_currency") as "ARS" | "USD" | null;
    if (savedCurrency) {
      setCurrency(savedCurrency);
    }
  }, []);

  const handleCurrencyChange = (c: "ARS" | "USD") => {
    setCurrency(c);
    localStorage.setItem("ta_currency", c);
  };

  // Escuchar cambios del CMS en Firestore en tiempo real (landing_ecosistema)
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "cms", "landing_ecosistema"), (docSnap) => {
      if (docSnap.exists()) {
        setCms(docSnap.data());
      }
    });
    return () => unsub();
  }, []);

  const heroSlides: HeroSlide[] =
    cms.heroSlider && cms.heroSlider.length > 0
      ? cms.heroSlider
      : DEFAULT_SLIDES;

  const promoConfig: PromoPushPopConfig = cms.pushPopPromo || DEFAULT_PROMO_PUSHPOP;

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans flex flex-col selection:bg-tech-blue selection:text-white">
      
      {/* 1. Header Oficial: Fondo Azul Tech, Logo con Brillo, 3 Dropdowns, 0810-220-0018 */}
      <OtaHeader
        phone={cms.contacto?.telefono || "0810-220-0018"}
        onOpenQuienesSomos={(tab) => setQuienesSomosModal(tab)}
        onOpenContacto={() => setContactoModal(true)}
      />

      {/* 2. Hero Slider Ultra HD con Buscador Multiproducto de 8 Pestañas Switchables */}
      <OtaHeroSlider slides={heroSlides}>
        <OtaSearchEngine enabledTabs={cms.enabledSearchTabs} />
      </OtaHeroSlider>

      {/* 3. Barra Flotante de Promociones & Financiación en Carrusel */}
      <OtaFloatingPromos />

      {/* 4. Carrusel de Viajes Destacados (Hasta 10 tarjetas + botón "Ver más") */}
      <OtaMarketplaceCarousel
        currency={currency}
        items={cms.marketplaceDestacados}
      />

      {/* 5. Sección Institucional: El Ecosistema Integrado */}
      <section id="ecosistema" className="py-16 sm:py-24 bg-slate-50 font-sans border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-[#0A2A5B] text-xs font-black uppercase tracking-wider mb-3">
              <Building2 className="w-3.5 h-3.5 text-[#FF5A19]" />
              <span>Conocé el Ecosistema</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
              La Red Integrada de Turismo y Movilidad de Argentina
            </h2>
            <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
              Combinamos tecnología de vanguardia, pasarelas de pago seguras y coordinación en territorio para brindarte una solución integral en cada etapa de tu viaje.
            </p>
          </div>

          {/* Grid de las 4 Unidades del Ecosistema */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Unidad 1: Experience */}
            <Link
              href="/landing/experience"
              className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#FF4F5A] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2 group-hover:text-[#FF4F5A] transition-colors">
                  TravelApp Experience
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed mb-4">
                  Excursiones auténticas de día, bodegas, aventura y turismo receptivo en el Norte con guías expertos.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-black text-[#FF4F5A] pt-3 border-t border-slate-100">
                <span>Ver Receptivo</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Unidad 2: TravelCab */}
            <Link
              href="/landing/travelcab"
              className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF5A19] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Car className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2 group-hover:text-[#FF5A19] transition-colors">
                  TravelCab Movilidad
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed mb-4">
                  Traslados urbanos y conexiones a aeropuertos con tarifas fijas, conductores verificados y reserva previa.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-black text-[#FF5A19] pt-3 border-t border-slate-100">
                <span>Pedir o Cotizar Móvil</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Unidad 3: Rewards */}
            <Link
              href="/landing/rewards"
              className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#E5A93B] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Gift className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2 group-hover:text-[#E5A93B] transition-colors">
                  TravelApp Rewards
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed mb-4">
                  Programa de beneficios donde cada viaje suma puntos canjeables por gastronomía, hoteles y descuentos.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-black text-[#E5A93B] pt-3 border-t border-slate-100">
                <span>Catálogo de Canjes</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Unidad 4: Afiliados */}
            <Link
              href="/landing/afiliados"
              className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2 group-hover:text-purple-600 transition-colors">
                  Red de Afiliados
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed mb-4">
                  Monetizá tu comunidad recomendando viajes con links y cupones únicos. Cobrá comisiones semanales en MP o CBU.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-black text-purple-600 pt-3 border-t border-slate-100">
                <span>Ser Embajador</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Sección 2: TravelApp App Móvil (Descargas Play Store / App Store y Registro) */}
      <OtaAppSection
        showPlayStore={cms.appSection?.showPlayStore}
        showAppStore={cms.appSection?.showAppStore}
        playStoreUrl={cms.appSection?.playStoreUrl}
        appStoreUrl={cms.appSection?.appStoreUrl}
      />

      {/* 7. Sección 3: TravelApp Rewards (Resumen del Programa y CTA Registro) */}
      <OtaRewardsSection />

      {/* 8. Sección 4: Travis Asistente Virtual Inteligente 24/7 con IA */}
      <OtaTravisSection whatsappUrl={cms.contacto?.whatsapp} />

      {/* 9. Sección 5: Sumate al Equipo (Oportunidades Laborales y Carga de CV) */}
      <OtaCareersSection positions={cms.jobPositions} />

      {/* 10. Footer Oficial: Sellos ARCA/FAEVYT/DNAV/IATA, Redes Sociales, Botón de Arrepentimiento */}
      <OtaFooter config={cms.legales} />

      {/* 11. Push Pop Promocional Emergente (TravelSale, Puntos Dobles, etc.) */}
      <OtaPromoPushPop config={promoConfig} />

      {/* 12. Banner y Modal de Aceptación de Cookies (Ley 25.326) */}
      <OtaCookieConsent />

      {/* 13. Asistente Flotante Permanente Travis Omnichannel */}
      <TravisOmnichannelWidget
        businessUnit="OTA"
        primaryColor="#0A2A5B"
        brandName="Travis IA"
        whatsappUrl={
          cms.contacto?.whatsapp ||
          "https://wa.me/5493812020050?text=Hola%20Travis!%20Quiero%20consultar%20por%20un%20viaje"
        }
      />

      {/* MODAL INSTITUCIONAL: VISIÓN, MISIÓN Y VALORES */}
      {quienesSomosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100 text-slate-800">
            <button
              onClick={() => setQuienesSomosModal(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Tabs Visión / Misión / Valores */}
            <div className="flex gap-2 border-b border-slate-100 pb-4 mb-6">
              <button
                type="button"
                onClick={() => setQuienesSomosModal("vision")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  quienesSomosModal === "vision"
                    ? "bg-blue-50 text-tech-blue border border-blue-200"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Visión
              </button>
              <button
                type="button"
                onClick={() => setQuienesSomosModal("mision")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  quienesSomosModal === "mision"
                    ? "bg-orange-50 text-[#FF5A19] border border-orange-200"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <Target className="w-3.5 h-3.5" /> Misión
              </button>
              <button
                type="button"
                onClick={() => setQuienesSomosModal("valores")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  quienesSomosModal === "valores"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5" /> Valores
              </button>
            </div>

            {quienesSomosModal === "vision" && (
              <div className="space-y-3 animate-in fade-in">
                <h3 className="text-2xl font-black text-slate-900">Nuestra Visión</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Ser la plataforma líder de turismo y movilidad integrada de Argentina y Latinoamérica, unificando paquetes emisivos de clase mundial, turismo receptivo regional y traslados seguros bajo un modelo de innovación continua, transparencia y fidelización real.
                </p>
              </div>
            )}

            {quienesSomosModal === "mision" && (
              <div className="space-y-3 animate-in fade-in">
                <h3 className="text-2xl font-black text-slate-900">Nuestra Misión</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Empoderar a cada viajero conectándolo con las mejores opciones de transporte, alojamiento y experiencias guiadas con tarifas transparentes, atención 24/7 impulsada por IA y un ecosistema que premia cada kilómetro recorrido.
                </p>
              </div>
            )}

            {quienesSomosModal === "valores" && (
              <div className="space-y-3 animate-in fade-in">
                <h3 className="text-2xl font-black text-slate-900">Nuestros Valores</h3>
                <ul className="text-sm text-slate-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Transparencia:</strong> Tarifas claras sin cargos ocultos ni sorpresas.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Seguridad y Formalidad:</strong> Operadores certificados, licencias oficiales y respaldo regulatorio.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Pasión por el Viajero:</strong> Asistencia cálida y resolutiva las 24 horas del día.</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE CONTACTO DIRECTO */}
      {contactoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100 text-slate-800">
            <button
              onClick={() => setContactoModal(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-tech-blue text-xs font-bold uppercase mb-3">
              <Phone className="w-3.5 h-3.5 text-[#FF5A19]" />
              <span>Canales de Atención Oficial</span>
            </div>

            <h3 className="text-2xl font-black text-slate-900 mb-2">Contactate con TravelApp</h3>
            <p className="text-xs text-slate-500 mb-6">Estamos a tu disposición para cotizaciones, asistencia en viaje o consultas corporativas.</p>

            <div className="space-y-3">
              <a
                href="tel:08102200018"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-tech-blue transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-tech-blue flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-black text-slate-800">Línea Telefónica Nacional</span>
                    <span className="text-[11px] text-slate-500 font-bold">0810-220-0018</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-tech-blue transition-colors" />
              </a>

              <a
                href={cms.contacto?.whatsapp || "https://wa.me/5493812020050"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 hover:border-emerald-500 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-black text-emerald-900">WhatsApp Comercial & Travis IA</span>
                    <span className="text-[11px] text-emerald-600 font-bold">+54 9 381 202-0050</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-1 transition-transform" />
              </a>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="font-black text-slate-800 block">Oficina Central:</span>
                <span className="text-slate-500">San Miguel de Tucumán, Argentina · Atención Lunes a Sábado de 09:00 a 20:00 hs</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
