"use client";

import React, { useState } from "react";
import { ExperienceHeader } from "@/components/experience/ExperienceHeader";
import { ExperienceHeroSlider } from "@/components/experience/ExperienceHeroSlider";
import { ExperienceSearchEngine } from "@/components/experience/ExperienceSearchEngine";
import { ExperienceGuaranteesBar } from "@/components/experience/ExperienceGuaranteesBar";
import { ExperienceCatalogCarousel } from "@/components/experience/ExperienceCatalogCarousel";
import { ExperienceRegionsSection } from "@/components/experience/ExperienceRegionsSection";
import { ExperienceOperatorCta } from "@/components/experience/ExperienceOperatorCta";
import { ExperienceTravisSection } from "@/components/experience/ExperienceTravisSection";
import { ExperienceFooter } from "@/components/experience/ExperienceFooter";
import { TravisOmnichannelWidget } from "@/components/shared/TravisOmnichannelWidget";
import {
  Eye,
  Target,
  HeartHandshake,
  X,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Compass,
  CheckCircle2,
  Send,
} from "lucide-react";

interface ExperienceLandingClientProps {
  initialCms?: any;
}

export default function ExperienceLandingClient({
  initialCms,
}: ExperienceLandingClientProps) {
  // Modal Quienes Somos (Visión, Misión, Valores)
  const [quienesSomosModal, setQuienesSomosModal] = useState<
    "vision" | "mision" | "valores" | null
  >(null);

  // Modal Contacto
  const [contactoModal, setContactoModal] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSent, setContactSent] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `*Consulta Turismo Receptivo - TravelApp Experience*
• *Nombre:* ${contactName}
• *Teléfono:* ${contactPhone}
• *Mensaje:* ${contactMessage}`;
    const url = `https://wa.me/5493812020050?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    setContactSent(true);
    setTimeout(() => {
      setContactSent(false);
      setContactoModal(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans antialiased overflow-x-hidden selection:bg-[#ff4f5a] selection:text-white">
      
      {/* 1. Header Oficial Experience */}
      <ExperienceHeader
        onOpenQuienesSomos={(tab) => setQuienesSomosModal(tab)}
        onOpenContacto={() => setContactoModal(true)}
      />

      {/* 2. Hero Slider con Buscador Receptivo Embebido (Conectado con CMS Web) */}
      <ExperienceHeroSlider
        slides={initialCms?.heroSlides || initialCms?.slides}
        cmsHero={initialCms?.marketplaceHero || initialCms?.hero}
      >
        <ExperienceSearchEngine />
      </ExperienceHeroSlider>

      {/* 3. Barra Flotante de Garantías Receptivas (Dock de 5 tarjetas) */}
      <ExperienceGuaranteesBar />

      {/* 4. Carrusel de Experiencias Receptivas Destacadas */}
      <ExperienceCatalogCarousel />

      {/* 5. Selector de Regiones & Destinos (Jujuy, Salta, Tucumán, Catamarca) */}
      <ExperienceRegionsSection />

      {/* 6. Travis Concierge Digital Especializado en Territorio */}
      <ExperienceTravisSection />

      {/* 7. Llamado a la Acción para Guías y Prestadores Locales */}
      <ExperienceOperatorCta />

      {/* 8. Footer Oficial */}
      <ExperienceFooter />

      {/* 9. Burbuja Flotante de Travis Asistente Omnicanal */}
      <TravisOmnichannelWidget
        businessUnit="Experiences"
        primaryColor="#ff4f5a"
        brandName="TravelApp Experience"
        whatsappUrl="https://wa.me/5493812020050"
      />

      {/* MODAL INSTITUCIONAL: QUIÉNES SOMOS (Visión / Misión / Valores) */}
      {quienesSomosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-900 animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setQuienesSomosModal(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {quienesSomosModal === "vision" && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#0a2a5b] flex items-center justify-center">
                  <Eye className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Nuestra Visión</h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
                  Ser la plataforma líder de turismo receptivo inteligente en Argentina y Sudamérica, transformando la manera en que los viajeros descubren experiencias auténticas, conectando guías locales y prestadores con tecnología de vanguardia y garantizando viajes seguros, sostenibles e inolvidables.
                </p>
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-[#0a2a5b]">
                  <Compass className="w-4 h-4 text-[#ff4f5a]" />
                  <span>TravelApp Experience · Hacia el futuro del turismo</span>
                </div>
              </div>
            )}

            {quienesSomosModal === "mision" && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#ff4f5a] flex items-center justify-center">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Nuestra Misión</h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
                  Diseñar, coordinar y brindar experiencias turísticas genuinas en territorio, integrando la calidez del anfitrión local con la eficiencia de nuestra infraestructura tecnológica. Buscamos que cada pasajero viva la cultura, los sabores y los paisajes con la mayor tranquilidad, respaldo médico y comodidad operativa.
                </p>
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-[#ff4f5a]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Compromiso de excelencia operativa 24/7</span>
                </div>
              </div>
            )}

            {quienesSomosModal === "valores" && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Nuestros Valores</h3>
                <div className="space-y-3 text-xs sm:text-sm text-slate-600 font-medium">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <strong className="text-slate-900 block mb-0.5">1. Autenticidad y Respeto Cultural:</strong>
                    Valoramos las raíces, los saberes ancestrales y las comunidades que nos reciben.
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <strong className="text-slate-900 block mb-0.5">2. Seguridad Absoluta:</strong>
                    No negociamos los estándares de guías matriculados, seguros y unidades vehiculares.
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <strong className="text-slate-900 block mb-0.5">3. Innovación con Rostro Humano:</strong>
                    Tecnología que facilita el viaje pero manteniendo siempre la calidez humana.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE CONTACTO RÁPIDO */}
      {contactoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-900 animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setContactoModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-xs font-bold text-[#ff4f5a] uppercase mb-1">
              <Phone className="w-4 h-4" />
              <span>Atención Receptiva Oficial</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
              Contactate con TravelApp Experience
            </h3>

            <p className="text-xs text-slate-500 mb-5">
              Estamos a tu disposición para asesorarte sobre excursiones, traslados y salidas a medida.
            </p>

            <div className="space-y-3 mb-6">
              <a
                href="tel:08102200018"
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-[#0a2a5b] text-white flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">Línea Telefónica Gratuita</div>
                  <div className="text-sm font-extrabold text-slate-900">0810-220-0018</div>
                </div>
              </a>

              <a
                href="https://wa.me/5493812020050"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-800 uppercase">WhatsApp Guardias 24/7</div>
                  <div className="text-sm font-extrabold text-emerald-950">+54 9 381 202-0050</div>
                </div>
              </a>
            </div>

            {contactSent ? (
              <div className="py-4 text-center space-y-1 bg-emerald-50 rounded-2xl p-3 border border-emerald-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <div className="text-sm font-bold text-emerald-900">¡Mensaje Enviado!</div>
                <div className="text-xs text-emerald-700">Te redirigimos al WhatsApp oficial.</div>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-3 text-left">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Tu Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Ej. Sofía Herrera"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#ff4f5a]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Tu Teléfono o WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Ej. +54 9 11 23456789"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#ff4f5a]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    ¿En qué podemos ayudarte?
                  </label>
                  <textarea
                    rows={2}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Consultas sobre disponibilidad, salidas especiales o traslados..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#ff4f5a]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#0a2a5b] hover:bg-[#071d3f] text-white text-xs sm:text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Iniciar Conversación por WhatsApp</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
