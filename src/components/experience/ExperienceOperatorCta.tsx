"use client";

import React, { useState } from "react";
import {
  Users,
  Award,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Send,
  X,
  Phone,
  FileCheck,
  Sparkles,
} from "lucide-react";

export function ExperienceOperatorCta() {
  const [modalOpen, setModalOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [matricula, setMatricula] = useState("");
  const [provincia, setProvincia] = useState("Salta");
  const [rubro, setRubro] = useState("Guía Matriculado de Turismo");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Armar mensaje directo a WhatsApp corporativo
    const text = `*Postulación Red de Prestadores TravelApp Experience*
• *Nombre / Prestador:* ${nombre}
• *Matrícula / Registro:* ${matricula || "En trámite"}
• *Provincia:* ${provincia}
• *Rubro:* ${rubro}
• *Teléfono / WhatsApp:* ${telefono}
• *Email:* ${email}
• *Propuesta:* ${mensaje}`;

    const url = `https://wa.me/5493812020050?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setModalOpen(false);
    }, 2000);
  };

  return (
    <section className="py-12 sm:py-20 bg-gradient-to-br from-[#0a2a5b] via-[#071d3f] to-[#122e57] text-white font-sans relative overflow-hidden">
      {/* Círculos decorativos de fondo */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 rounded-full bg-[#ff4f5a]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
          
          {/* Columna Izquierda: Información Editorial */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ff4f5a]/20 border border-[#ff4f5a]/40 text-[#ff4f5a] text-xs font-black uppercase tracking-wider">
              <Award className="w-4 h-4" />
              <span>Red de Prestadores Oficiales</span>
            </div>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              ¿Sos Guía Matriculado o Prestador en el Norte?
            </h2>

            <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
              Sumá tus excursiones, cabalgatas, catas o circuitos a la plataforma TravelApp Experience. Conectamos tus salidas con miles de viajeros, con liquidaciones seguras, reservas confirmadas y traslados coordinados con TravelCab.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs sm:text-sm font-bold">Liquidaciones Puntuales</div>
                  <div className="text-[11px] text-slate-400">Cobro garantizado por cada pasajero</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                <ShieldCheck className="w-5 h-5 text-[#ff4f5a] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs sm:text-sm font-bold">Respaldo Integral</div>
                  <div className="text-[11px] text-slate-400">Seguros de turismo activo y apoyo 24/7</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                <FileCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs sm:text-sm font-bold">Control de Cupos Real</div>
                  <div className="text-[11px] text-slate-400">Panel propio para gestionar tus salidas</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                <Sparkles className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs sm:text-sm font-bold">Conectividad TravelCab</div>
                  <div className="text-[11px] text-slate-400">Pick-up hotelero coordinado sin demoras</div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-2xl bg-[#ff4f5a] hover:bg-[#e63e49] text-white font-extrabold text-sm sm:text-base shadow-xl shadow-[#ff4f5a]/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Sumar mi Excursión / Postularme</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta de Homologación Rápida */}
          <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl">
            <h3 className="text-lg sm:text-xl font-bold mb-2">Requisitos de Homologación</h3>
            <p className="text-xs text-slate-300 mb-4">
              Trabajamos exclusivamente con prestadores habilitados para asegurar la máxima calidad y seguridad de los pasajeros.
            </p>

            <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#ff4f5a]" />
                <span>Matrícula de Guía Provincial / Nacional al día</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#ff4f5a]" />
                <span>Seguro de Responsabilidad Civil y Accidentes Personales</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#ff4f5a]" />
                <span>Vehículos habilitados por CNRT o Dirección de Transporte</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#ff4f5a]" />
                <span>Capacitación en primeros auxilios en zonas agrestes</span>
              </li>
            </ul>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span>Auditoría continua de calidad</span>
              <span className="text-emerald-400 font-bold">Sello Seguro 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Postulación de Prestadores */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-900 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-xs font-bold text-[#ff4f5a] uppercase mb-1">
              <Award className="w-4 h-4" />
              <span>Red de Prestadores Receptivos</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2">
              Postulá tu Servicio o Excursión
            </h3>

            <p className="text-xs text-slate-500 mb-5">
              Completá tus datos y nuestro equipo de operaciones se contactará vía WhatsApp para homologar tu salida.
            </p>

            {submitted ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <div className="text-base font-bold text-slate-900">¡Postulación Enviada!</div>
                <div className="text-xs text-slate-500">
                  Te redirigimos al WhatsApp de Operaciones para continuar.
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Nombre Completo / Razón Social *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Juan Pérez / Aventura Calchaquí"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#ff4f5a]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Provincia *
                    </label>
                    <select
                      value={provincia}
                      onChange={(e) => setProvincia(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#ff4f5a] bg-white cursor-pointer"
                    >
                      <option value="Salta">Salta</option>
                      <option value="Jujuy">Jujuy</option>
                      <option value="Tucumán">Tucumán</option>
                      <option value="Catamarca">Catamarca</option>
                      <option value="Otra">Otra Región</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      N° Matrícula / Registro
                    </label>
                    <input
                      type="text"
                      value={matricula}
                      onChange={(e) => setMatricula(e.target.value)}
                      placeholder="Ej. MAT-1249 / Trámite"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#ff4f5a]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Tipo de Servicio *
                  </label>
                  <select
                    value={rubro}
                    onChange={(e) => setRubro(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#ff4f5a] bg-white cursor-pointer"
                  >
                    <option value="Guía Matriculado de Turismo">Guía Matriculado de Turismo</option>
                    <option value="Empresa de Transporte Receptivo">Empresa de Transporte Receptivo (Combos/Buses)</option>
                    <option value="Turismo Aventura (Cabalgatas, 4x4, Trekking)">Turismo Aventura (Cabalgatas, 4x4, Trekking)</option>
                    <option value="Bodega / Experiencia Gastronómica">Bodega / Experiencia Gastronómica</option>
                    <option value="Agencia Receptiva Local">Agencia Receptiva Local</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="Ej. +54 9 387 1234567"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#ff4f5a]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ejemplo@prestador.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#ff4f5a]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Detalle de tu excursión o propuesta
                  </label>
                  <textarea
                    rows={2}
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder="Contanos qué excursiones realizás, frecuencias y capacidad de pasajeros..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#ff4f5a]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#ff4f5a] hover:bg-[#e63e49] text-white text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Postulación por WhatsApp</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
