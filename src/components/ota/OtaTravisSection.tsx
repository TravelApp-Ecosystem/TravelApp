"use client";

import React from "react";
import Image from "next/image";
import {
  Bot,
  Sparkles,
  MessageSquare,
  Zap,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Send,
  HelpCircle,
  Smartphone
} from "lucide-react";

interface OtaTravisSectionProps {
  whatsappUrl?: string;
}

export function OtaTravisSection({
  whatsappUrl = "https://wa.me/5493812020050?text=Hola%20Travis!%20Quiero%20planificar%20un%20viaje%20con%20TravelApp",
}: OtaTravisSectionProps) {
  return (
    <section id="travis" className="py-20 sm:py-28 bg-slate-900 text-white font-sans relative overflow-hidden">
      {/* Luces y degradados de fondo */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#FF5A19]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Columna Izquierda: Presentación y Funciones de Travis */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-black uppercase tracking-wider">
              <Bot className="w-4 h-4 text-[#FF7A00]" />
              <span>Inteligencia Artificial de Viajes</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Conocé a <span className="text-[#FF7A00]">Travis</span>, tu copiloto y asistente virtual 24/7
            </h2>

            <p className="text-base sm:text-lg text-slate-300 font-medium leading-relaxed">
              Travis no es un chatbot tradicional: es un asistente inteligente entrenado exclusivamente con las tarifas, rutas, hoteles y excursiones del ecosistema TravelApp. Te atiende en segundos, sin esperas y por el canal que prefieras.
            </p>

            {/* Grilla de 4 Capacidades Principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/40 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
                  <Zap className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-black text-white">Cotizaciones al Instante</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Decile qué presupuesto tenés y cuántos viajan. Travis busca las mejores combinaciones de aéreo + hotel.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-orange-500/40 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-[#FF7A00] flex items-center justify-center mb-3">
                  <Clock className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-black text-white">Disponibilidad 24/7</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Respondé dudas a las 3 de la mañana, fines de semana o feriados. Travis siempre está despierto para vos.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-black text-white">Omnicanal por WhatsApp</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Podés chatear desde la web o directamente agregarlo a WhatsApp para enviar notas de voz o mensajes.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/40 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-black text-white">Soporte Operativo</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Consultá el estado de tu vuelo, tu reserva de hotel o pedí un móvil de TravelCab a través de Travis.
                </p>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 transition-all cursor-pointer transform hover:-translate-y-0.5"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Hablar con Travis por WhatsApp</span>
              </a>

              <a
                href="#contacto"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/20 transition-all"
              >
                <span>Conocer Más</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta / Interfaz Interactiva de Travis */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md bg-slate-800/90 rounded-3xl p-6 border border-slate-700 shadow-2xl backdrop-blur-md relative">
              {/* Header del Chat */}
              <div className="flex items-center gap-3.5 pb-4 border-b border-slate-700/80">
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0A2A5B] to-blue-600 p-0.5 shadow-md flex items-center justify-center overflow-hidden">
                  <Image
                    src="/assets/travis_formal.svg"
                    alt="Travis Asistente Oficial"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-800"></span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-black text-white">Travis AI</h4>
                    <span className="text-[10px] font-bold text-[#FF7A00] bg-orange-500/20 px-1.5 py-0.2 rounded-full">Oficial</span>
                  </div>
                  <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    En línea · Responde en segundos
                  </p>
                </div>
              </div>

              {/* Mensajes Simulados */}
              <div className="py-4 space-y-3.5 text-xs">
                {/* Mensaje Travis 1 */}
                <div className="flex gap-2.5 items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                    T
                  </div>
                  <div className="bg-slate-700/80 p-3 rounded-2xl rounded-tl-xs text-slate-200 leading-relaxed border border-slate-600/50">
                    ¡Hola! Soy Travis de TravelApp ✈️ ¿Estás pensando en una escapada o unas vacaciones largas?
                  </div>
                </div>

                {/* Mensaje Usuario */}
                <div className="flex gap-2.5 items-start justify-end">
                  <div className="bg-[#FF5A19] p-3 rounded-2xl rounded-tr-xs text-white leading-relaxed max-w-[80%] font-medium">
                    Hola Travis! Busco paquete a Cancún para 2 personas en noviembre con All Inclusive.
                  </div>
                </div>

                {/* Mensaje Travis 2 */}
                <div className="flex gap-2.5 items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                    T
                  </div>
                  <div className="bg-slate-700/80 p-3 rounded-2xl rounded-tl-xs text-slate-200 leading-relaxed border border-slate-600/50 space-y-2">
                    <p>
                      ¡Excelente elección! Tengo una salida confirmada con <strong className="text-white">Juliá Tours</strong> en el <strong className="text-white">Riu Tequila 5★</strong>:
                    </p>
                    <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-600/80 text-[11px] space-y-1">
                      <div className="text-emerald-400 font-black">🌴 8 Días / 7 Noches All Inclusive 24hs</div>
                      <div className="text-slate-300">✈️ Vuelos directos con Copa Airlines + Equipaje</div>
                      <div className="text-white font-extrabold">💳 Hasta 6 cuotas fijas + 850 pts Rewards</div>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      ¿Querés que te reserve los cupos o te envíe el PDF completo?
                    </p>
                  </div>
                </div>
              </div>

              {/* Input Simulado */}
              <div className="pt-2 border-t border-slate-700/80 flex items-center gap-2">
                <div className="flex-1 bg-slate-900/80 rounded-xl px-3 py-2 text-xs text-slate-400 border border-slate-700">
                  Escribí tu consulta para Travis...
                </div>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-xl bg-[#FF5A19] hover:bg-[#e04c10] text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
