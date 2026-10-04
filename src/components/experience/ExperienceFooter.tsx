"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Compass,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  X,
  FileText,
  AlertCircle,
  Send,
} from "lucide-react";

interface ExperienceFooterProps {
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
  onOpenArrepentimiento?: () => void;
}

export function ExperienceFooter({
  onOpenPrivacy,
  onOpenTerms,
  onOpenArrepentimiento,
}: ExperienceFooterProps) {
  const [modalType, setModalType] = useState<
    "privacidad" | "terminos" | "arrepentimiento" | null
  >(null);
  const [arrepentimientoCode, setArrepentimientoCode] = useState("");
  const [arrepentimientoEmail, setArrepentimientoEmail] = useState("");
  const [arrepentimientoSent, setArrepentimientoSent] = useState(false);

  const handleArrepentimientoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setArrepentimientoSent(true);
    setTimeout(() => {
      setArrepentimientoSent(false);
      setModalType(null);
    }, 3000);
  };

  return (
    <footer className="w-full bg-[#071d3f] text-white font-sans border-t border-white/10 selection:bg-[#ff4f5a] selection:text-white">
      {/* 1. Contenedor Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-12">
          
          {/* Columna Izquierda: Logo TravelApp Experience y Distintivos de Confianza */}
          <div className="md:col-span-5 space-y-4 sm:space-y-6">
            <Link href="/landing/experience" className="inline-flex items-center gap-2 group">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Travel<span className="font-light text-white/90">App</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#ff4f5a] text-white text-[10px] font-black uppercase tracking-wider">
                Experience
              </span>
            </Link>

            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-sm">
              División de Turismo Receptivo y Experiencias en Destino de TravelApp s.a.s. Operatoria directa en Salta, Jujuy, Tucumán y Catamarca con guías matriculados y vehículos habilitados.
            </p>

            {/* Espacio para Distintivos de Confianza & QR (ARCA / Base de Datos / Atavyt / Faevyt / DNAV / IATA) */}
            <div className="pt-2">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                Distintivos Oficiales & Habilitaciones
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* ARCA Data Fiscal */}
                <div className="p-1.5 rounded-lg bg-white/10 border border-white/15 flex items-center gap-1.5 text-[10px] font-bold text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>ARCA Data Fiscal</span>
                </div>

                {/* Registro Nac. Base de Datos */}
                <div className="p-1.5 rounded-lg bg-white/10 border border-white/15 flex items-center gap-1.5 text-[10px] font-bold text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>Registro Base de Datos</span>
                </div>

                {/* FAEVYT / ATAVYT */}
                <div className="p-1.5 rounded-lg bg-white/10 border border-white/15 flex items-center gap-1.5 text-[10px] font-bold text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Operador Receptivo Homologado</span>
                </div>

                {/* Turismo Activo Seguro */}
                <div className="p-1.5 rounded-lg bg-white/10 border border-white/15 flex items-center gap-1.5 text-[10px] font-bold text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-[#ff4f5a]" />
                  <span>Seguro Turismo Activo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Centro: Redes Sociales Oficiales y Canales */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-300">
              Seguinos en Redes
            </h4>
            <div className="flex flex-col space-y-2.5 text-xs sm:text-sm text-slate-300">
              <a
                href="https://facebook.com/travelapp.ar"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-[#ff4f5a] transition-colors"
              >
                <span>Facebook Oficial</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>

              <a
                href="https://instagram.com/travelapp.ar"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-[#ff4f5a] transition-colors"
              >
                <span>Instagram @travelapp.ar</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>

              <a
                href="https://youtube.com/@travelapp_ar"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-[#ff4f5a] transition-colors"
              >
                <span>YouTube Canal Oficial</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>

              <a
                href="https://tiktok.com/@travelapp.ar"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-[#ff4f5a] transition-colors"
              >
                <span>TikTok TravelApp</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>

              <a
                href="https://linkedin.com/company/travelapp-sas"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-[#ff4f5a] transition-colors"
              >
                <span>LinkedIn Corporativo</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
            </div>
          </div>

          {/* Columna Derecha: Políticas Legales y Botón de Arrepentimiento */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-300">
              Legales & Transparencia
            </h4>
            <div className="flex flex-col space-y-2.5 text-xs sm:text-sm text-slate-300">
              <button
                type="button"
                onClick={() => setModalType("privacidad")}
                className="text-left hover:text-white transition-colors cursor-pointer"
              >
                Política de Privacidad
              </button>

              <button
                type="button"
                onClick={() => setModalType("terminos")}
                className="text-left hover:text-white transition-colors cursor-pointer"
              >
                Términos y Condiciones del Servicio
              </button>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setModalType("arrepentimiento")}
                  className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 border border-red-500/30 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Botón de Arrepentimiento (Defensa al Consumidor)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Barra de Datos Legales, Domicilio y Contacto (Sin Legajo ni Resolución) */}
        <div className="mt-10 pt-6 border-t border-white/10 text-xs text-slate-400 space-y-2 sm:space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <strong className="text-slate-200">TravelApp s.a.s.</strong> · CUIT 30-71889988-4
            </div>
            <div>
              Domicilio: San Martín 850, San Miguel de Tucumán, Argentina
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
            <div className="flex items-center gap-4">
              <span>Teléfono Oficial: <strong className="text-slate-200">0810-220-0018</strong></span>
              <span>Correo: <strong className="text-slate-200">contacto@travelapp.com.ar</strong></span>
            </div>
            <div>
              Atención Omnicanal Receptiva 24/7 con Travis Concierge
            </div>
          </div>
        </div>

        {/* 3. Copyright al pie */}
        <div className="mt-6 pt-4 border-t border-white/5 text-center text-[11px] text-slate-500">
          Todos los derechos reservados por TravelApp s.a.s. - 2026
        </div>
      </div>

      {/* Modales Legales Reutilizables */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-900 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setModalType(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {modalType === "privacidad" && (
              <div>
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-[#0a2a5b]">
                  <FileText className="w-5 h-5 text-[#ff4f5a]" />
                  Política de Privacidad
                </h3>
                <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <p>
                    En <strong>TravelApp s.a.s.</strong> protegemos la privacidad y los datos personales de todos nuestros pasajeros conforme a la Ley Nacional de Protección de Datos Personales N° 25.326 de la República Argentina.
                  </p>
                  <p>
                    Los datos recabados para la contratación de excursiones receptivas y traslados (nombre, DNI, teléfono de contacto y hotel de estadía) son utilizados exclusivamente para la emisión de seguros de viaje, coordinación de pick-up y facturación electrónica.
                  </p>
                  <p>
                    No comercializamos ni cedemos bases de datos a terceros bajo ninguna circunstancia.
                  </p>
                </div>
              </div>
            )}

            {modalType === "terminos" && (
              <div>
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-[#0a2a5b]">
                  <FileText className="w-5 h-5 text-[#ff4f5a]" />
                  Términos y Condiciones del Servicio
                </h3>
                <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <p>
                    <strong>1. Operatoria Receptiva:</strong> Todas las salidas están sujetas a condiciones climáticas y de seguridad vial en zonas de alta montaña. En caso de cierre de pasos por causas de fuerza mayor, la excursión se reprogramará sin costo o se reembolsará el importe proporcional.
                  </p>
                  <p>
                    <strong>2. Horarios y Pick-Up:</strong> El pasajero debe encontrarse en el lobby del hotel en el horario notificado por Travis. La tolerancia de espera de las unidades de transporte es de 10 minutos.
                  </p>
                  <p>
                    <strong>3. Seguros y Responsabilidad:</strong> Todas las salidas incluyen seguro de asistencia médica y accidentes en viaje contratado con aseguradoras habilitadas por la Superintendencia de Seguros de la Nación.
                  </p>
                </div>
              </div>
            )}

            {modalType === "arrepentimiento" && (
              <div>
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  Botón de Arrepentimiento
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Conforme al Art. 34 de la Ley 24.240 de Defensa del Consumidor y Resolución 424/2020 de la Secretaría de Comercio Interior, podés solicitar la revocación y reembolso de tu compra online dentro del plazo de 10 días corridos contados a partir de la contratación.
                </p>

                {arrepentimientoSent ? (
                  <div className="py-6 text-center space-y-2 bg-emerald-50 rounded-2xl p-4 border border-emerald-200">
                    <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto" />
                    <div className="text-sm font-bold text-emerald-900">
                      Solicitud de Revocación Recibida
                    </div>
                    <div className="text-xs text-emerald-700">
                      Un asesor de TravelApp se comunicará dentro de las próximas 24 hs hábiles para procesar el reintegro a tu medio de pago original.
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleArrepentimientoSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Código de Reserva o Factura *
                      </label>
                      <input
                        type="text"
                        required
                        value={arrepentimientoCode}
                        onChange={(e) => setArrepentimientoCode(e.target.value)}
                        placeholder="Ej. EXP-2026-9812"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Correo Electrónico registrado en la compra *
                      </label>
                      <input
                        type="email"
                        required
                        value={arrepentimientoEmail}
                        onChange={(e) => setArrepentimientoEmail(e.target.value)}
                        placeholder="tuemail@ejemplo.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Confirmar Solicitud de Arrepentimiento</span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </footer>
  );
}
