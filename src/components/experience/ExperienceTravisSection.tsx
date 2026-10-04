"use client";

import React, { useState } from "react";
import {
  Bot,
  Sparkles,
  MessageSquare,
  ArrowRight,
  Shield,
  Clock,
  Compass,
  CheckCircle2,
  Send,
} from "lucide-react";

export function ExperienceTravisSection() {
  const [activeQuestion, setActiveQuestion] = useState(0);

  const sampleConversations = [
    {
      q: "¿Qué abrigo debo llevar a Salinas Grandes y la Puna?",
      a: "¡Excelente pregunta! En la Puna hay gran amplitud térmica. Te recomiendo vestir en capas (térmica + polar + campera cortaviento), lentes con filtro UV categoría 3 o 4, gorro para sol y protector solar FPS 50+. A la siesta el sol es intenso pero corre viento frío.",
    },
    {
      q: "¿Cómo prevengo el mal de altura en Hornocal o Cuesta de Lipán?",
      a: "Para alturas mayores a 3.500 msnm: mantenete muy bien hidratado con agua mineral, comé liviano la noche anterior, evitá el alcohol y masticá hojas de coca o tomá té de coca bien caliente. Los guías llevan oxígeno preventivo y botiquín de primeros auxilios.",
    },
    {
      q: "¿Dónde probar las mejores empanadas y Torrontés en Cafayate?",
      a: "Te sugiero almorzar en los patios coloniales de Bodega El Esteco o Bodega Nanni (orgánica). Sus empanadas cortadas a cuchillo al horno de barro maridan a la perfección con un Torrontés cosecha tardía bien frío.",
    },
    {
      q: "¿A qué hora me pasa a buscar TravelCab por mi hotel?",
      a: "El horario habitual para excursiones de día completo (Salinas o Cafayate) es entre las 06:45 y las 07:30 hs. El día anterior a las 20:00 hs recibirás un WhatsApp de Travis con la patente del vehículo y el contacto directo de tu guía.",
    },
  ];

  return (
    <section className="py-12 sm:py-20 bg-slate-900 text-white font-sans relative overflow-hidden">
      {/* Luces sutiles de fondo */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-[#ff4f5a]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
          
          {/* Columna Izquierda: Información Editorial */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff4f5a]/20 border border-[#ff4f5a]/40 text-[#ff4f5a] text-xs font-bold uppercase tracking-wider">
              <Bot className="w-4 h-4" />
              <span>Inteligencia Artificial Especializada</span>
            </div>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Travis: Tu Baquiano & Concierge Digital 24/7
            </h2>

            <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
              Travis conoce cada rincón del Norte Argentino: el estado de los caminos de montaña, el clima en tiempo real, qué indumentaria empacar y los secretos gastronómicos que solo un local sabe.
            </p>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs sm:text-sm text-slate-200">
                  Alertas meteorológicas y estado de pasos de altura
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs sm:text-sm text-slate-200">
                  Notificación automática de horario de pick-up en hotel
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs sm:text-sm text-slate-200">
                  Recomendaciones de restaurantes, bodegas y peñas folclóricas
                </span>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="https://wa.me/5493812020050?text=Hola%20Travis,%20quiero%20hacerte%20una%20consulta%20sobre%20el%20Norte%20Argentino"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 transition-all hover:scale-105 active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chatear con Travis por WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Columna Derecha: Simulación Interactiva de Travis */}
          <div className="lg:col-span-6 bg-slate-950/80 rounded-3xl p-5 sm:p-7 border border-white/10 shadow-2xl space-y-4">
            
            {/* Cabecera del Chat */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ff4f5a] to-[#0a2a5b] flex items-center justify-center text-white shadow-md">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950" />
                </div>
                <div>
                  <div className="text-sm font-bold flex items-center gap-1.5">
                    <span>Travis Experience</span>
                    <Sparkles className="w-3.5 h-3.5 text-[#ff4f5a]" />
                  </div>
                  <div className="text-[10px] text-slate-400">Concierge Receptivo en Línea</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-slate-300">
                24 / 7
              </span>
            </div>

            {/* Selector de Preguntas Frecuentes */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Tocá una pregunta para ver la respuesta de Travis:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sampleConversations.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveQuestion(idx)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold text-left transition-all cursor-pointer ${
                      activeQuestion === idx
                        ? "bg-[#ff4f5a] text-white shadow-md"
                        : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                    }`}
                  >
                    {item.q}
                  </button>
                ))}
              </div>
            </div>

            {/* Burbujas de Chat */}
            <div className="space-y-3 pt-2">
              {/* Mensaje del Usuario */}
              <div className="flex justify-end">
                <div className="max-w-[85%] p-3.5 rounded-2xl rounded-tr-xs bg-[#0a2a5b] text-white text-xs sm:text-sm font-medium shadow-md">
                  {sampleConversations[activeQuestion].q}
                </div>
              </div>

              {/* Respuesta de Travis */}
              <div className="flex justify-start items-start gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-[#ff4f5a] flex items-center justify-center text-white shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="max-w-[88%] p-3.5 rounded-2xl rounded-tl-xs bg-slate-900 border border-white/10 text-slate-200 text-xs sm:text-sm font-normal leading-relaxed shadow-md">
                  {sampleConversations[activeQuestion].a}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
