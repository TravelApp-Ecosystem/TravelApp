"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CheckCircle2, X, ChevronRight } from "lucide-react";

/**
 * Placa mecánica individual estilo cartel de aeropuerto (Split-Flap)
 * Diseño minimalista en aluminio anodizado negro mate (sin tarjetas genéricas alrededor)
 */
function SplitFlapTile({ digit }: { digit: string }) {
  const [currentDigit, setCurrentDigit] = useState(digit);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (digit !== currentDigit) {
      setCurrentDigit(digit);
      setIsFlipping(true);
      const timer = setTimeout(() => setIsFlipping(false), 320);
      return () => clearTimeout(timer);
    }
  }, [digit, currentDigit]);

  return (
    <div className="relative w-9 h-12 sm:w-11 sm:h-15 rounded-md bg-[#141416]/90 backdrop-blur-md border border-white/12 shadow-[0_8px_20px_rgba(0,0,0,0.65)] flex items-center justify-center select-none overflow-hidden">
      {/* Mitad superior */}
      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-[#1d1d20] to-[#121214]" />
      {/* Mitad inferior */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-[#121214] to-[#1a1a1d]" />

      {/* Muescas mecánicas laterales */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-2 bg-black z-20" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-2 bg-black z-20" />

      {/* Corte horizontal central del flap */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-black/95 z-20" />

      <span
        className={`relative z-10 text-xl sm:text-2xl font-bold text-[#f5f5f7] tracking-tight transition-transform duration-200 ${
          isFlipping ? "scale-y-90 opacity-85" : "scale-y-100 opacity-100"
        }`}
      >
        {currentDigit}
      </span>
    </div>
  );
}

function AirportFlapUnit({ value, label }: { value: number; label: string }) {
  const padded = String(Math.max(0, value)).padStart(2, "0");
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-1">
        <SplitFlapTile digit={padded[0] || "0"} />
        <SplitFlapTile digit={padded[1] || "0"} />
      </div>
      <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a1a1a6]">
        {label}
      </span>
    </div>
  );
}

export default function PreparateTravelAppClient() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const formSectionRef = useRef<HTMLElement | null>(null);

  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 9,
    minutes: 30,
    seconds: 0,
  });

  // Modal o scroll hacia el registro limpio
  const [modalOpen, setModalOpen] = useState(false);

  // Formulario: solo Nombre, Teléfono y Localidad
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Garantizar video 100% sin sonido
  useEffect(() => {
    const vid = videoRef.current;
    if (vid) {
      vid.muted = true;
      vid.defaultMuted = true;
      vid.volume = 0;
      vid.play().catch(() => {});
    }
  }, []);

  // Cuenta regresiva hacia el 01/11/2026 00:00:00 (Argentina GMT-3)
  useEffect(() => {
    const targetDate = new Date("2026-11-01T00:00:00-03:00").getTime();

    const updateTimer = () => {
      const diff = Math.max(0, targetDate - Date.now());
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanNombre = nombre.trim();
    const cleanTelefono = telefono.trim();
    const cleanLocalidad = localidad.trim();

    if (!cleanNombre || !cleanTelefono || !cleanLocalidad) {
      setErrorMsg("Completá tu nombre, teléfono y localidad.");
      return;
    }

    setIsSubmitting(true);
    try {
      const host =
        typeof window !== "undefined" ? window.location.hostname : "travelapp.ar";

      await addDoc(collection(db, "waitlist_leads"), {
        nombre: cleanNombre,
        telefono: cleanTelefono,
        localidad: cleanLocalidad,
        plataforma: "travelapp",
        rol: "usuario",
        dominioOrigen: host,
        notificadoTravis: false,
        fechaRegistro: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });

      setSubmitted(true);
    } catch (err) {
      console.error("Error al registrar lead:", err);
      setErrorMsg("No pudimos procesar tu solicitud. Intentá nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full bg-black text-[#f5f5f7] antialiased selection:bg-white/20"
      style={{ fontFamily: "'Quicksand', sans-serif" }}
    >
      {/* ─── 1. BARRA SUPERIOR FLOTANTE ESTILO APPLE ───────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 h-12 bg-black/70 backdrop-blur-xl border-b border-white/[0.08] flex items-center justify-center px-4">
        <div className="w-full max-w-5xl flex items-center justify-between text-xs font-medium text-[#d2d2d7]">
          {/* Logo TravelApp Flotante */}
          <div className="relative h-6 w-28 sm:w-32 shrink-0">
            <Image
              src="/assets/travelapp_blanco.svg"
              alt="TravelApp"
              fill
              priority
              className="object-contain object-left"
            />
          </div>

          {/* Unidades del Ecosistema (Estilo navegación minimalista Apple) */}
          <nav className="hidden md:flex items-center gap-7 text-[12px] tracking-wide text-[#d2d2d7]/90">
            <span>Ecosistema</span>
            <span>Rewards</span>
            <span>Experience</span>
            <span>TravelCab</span>
            <span>Luna Viajera</span>
            <span>Afiliados</span>
          </nav>

          {/* Acción rápida derecha */}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="text-[12px] font-semibold text-white hover:text-[#d2d2d7] transition-colors cursor-pointer"
          >
            Acceso 01/11
          </button>
        </div>
      </header>

      {/* ─── 2. HERO PRINCIPAL CON VIDEO 100% LIMPIO (SIN CAPA AZUL) ─────────── */}
      <section className="relative w-full h-screen min-h-[680px] flex flex-col justify-between items-center text-center overflow-hidden pt-20 pb-10 px-4">
        {/* Video original limpio, sin tintes de color encima */}
        <video
          ref={videoRef}
          src="/assets/videos/travelapp-teaser.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onVolumeChange={(e) => {
            e.currentTarget.muted = true;
            e.currentTarget.volume = 0;
          }}
          className="absolute inset-0 w-full h-full object-cover object-center z-0"
        />

        {/* Sombra negra sutil únicamente arriba y abajo para lectura perfecta del texto blanco */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.12) 38%, rgba(0,0,0,0.12) 62%, rgba(0,0,0,0.82) 100%)",
          }}
        />

        {/* Bloque Editorial Superior Centrado (Composición idéntica a Apple.com) */}
        <div className="relative z-20 max-w-3xl mx-auto pt-4 sm:pt-8 flex flex-col items-center">
          {/* Logo flotante principal */}
          <div className="relative h-9 sm:h-11 w-40 sm:w-48 mb-3">
            <Image
              src="/assets/travelapp_blanco.svg"
              alt="TravelApp"
              fill
              priority
              className="object-contain object-center"
            />
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-[56px] font-bold tracking-tight text-white leading-[1.08]">
            Movete por tu ciudad. Acumulá puntos. Viajá.
          </h1>

          <p className="mt-2.5 text-base sm:text-xl md:text-2xl font-medium text-[#f5f5f7]/95 max-w-2xl">
            Nuestro ADN conecta cada traslado con tus próximas vacaciones.
          </p>

          <p className="mt-1.5 text-xs sm:text-sm md:text-base font-medium text-[#a1a1a6]">
            Disponible el 01/11. Registrate para recibir tu acceso prioritario.
          </p>

          {/* Botón Píldora limpio estilo Apple */}
          <div className="mt-5 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="px-6 py-2.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold text-sm sm:text-base transition-all shadow-lg cursor-pointer"
            >
              Registrarme para el 01/11
            </button>

            <button
              type="button"
              onClick={() =>
                formSectionRef.current?.scrollIntoView({ behavior: "smooth" })
              }
              className="inline-flex items-center gap-1 text-sm sm:text-base font-semibold text-white hover:underline cursor-pointer"
            >
              <span>Conocer Rewards</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contador de Aeropuerto Flotante Inferior (Limpio, sin cajas pesadas) */}
        <div className="relative z-20 flex flex-col items-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#d2d2d7] mb-2.5">
            Despegue Oficial • 01 de Noviembre
          </div>
          <div className="flex items-center gap-2.5 sm:gap-4">
            <AirportFlapUnit value={timeLeft.days} label="Días" />
            <span className="text-xl font-light text-white/40 -mt-5">:</span>
            <AirportFlapUnit value={timeLeft.hours} label="Horas" />
            <span className="text-xl font-light text-white/40 -mt-5">:</span>
            <AirportFlapUnit value={timeLeft.minutes} label="Min" />
            <span className="text-xl font-light text-white/40 -mt-5">:</span>
            <AirportFlapUnit value={timeLeft.seconds} label="Seg" />
          </div>
        </div>
      </section>

      {/* ─── 3. SEGUNDO BLOQUE NEGRO PURO ESTILO APPLE (REWARDS + REGISTRO) ──── */}
      <section
        ref={formSectionRef}
        className="w-full bg-black border-t border-white/10 py-20 sm:py-28 px-4 text-center"
      >
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          {/* Logo oficial TravelApp Rewards */}
          <div className="relative h-10 sm:h-12 w-40 sm:w-48 mb-4">
            <Image
              src="/assets/rewards_blanco.svg"
              alt="TravelApp Rewards"
              fill
              className="object-contain object-center"
            />
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Cada kilómetro en tu ciudad suma para tu próximo viaje.
          </h2>

          <p className="mt-3 text-sm sm:text-base text-[#a1a1a6] font-medium leading-relaxed max-w-xl">
            El <strong className="text-white">01/11</strong> abrimos nuestras plataformas y comenzamos la versión Beta. Dejanos tu nombre, teléfono y localidad para que nuestro asistente <strong className="text-white">Travis</strong> te envíe por WhatsApp tu invitación de lanzamiento.
          </p>

          {/* Formulario Minimalista en Línea (Sin tarjetas genéricas) */}
          <div className="w-full mt-10">
            {!submitted ? (
              <form
                onSubmit={handleSubmit}
                className="w-full max-w-xl mx-auto space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Nombre y apellido"
                    className="w-full rounded-full bg-[#1d1d1f] border border-white/15 focus:border-white/50 focus:outline-none px-5 py-3.5 text-sm text-white placeholder:text-[#86868b] font-medium transition-colors"
                  />
                  <input
                    type="tel"
                    required
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Teléfono (WhatsApp)"
                    className="w-full rounded-full bg-[#1d1d1f] border border-white/15 focus:border-white/50 focus:outline-none px-5 py-3.5 text-sm text-white placeholder:text-[#86868b] font-medium transition-colors"
                  />
                  <input
                    type="text"
                    required
                    value={localidad}
                    onChange={(e) => setLocalidad(e.target.value)}
                    placeholder="Localidad"
                    className="w-full rounded-full bg-[#1d1d1f] border border-white/15 focus:border-white/50 focus:outline-none px-5 py-3.5 text-sm text-white placeholder:text-[#86868b] font-medium transition-colors"
                  />
                </div>

                {errorMsg && (
                  <p className="text-xs text-red-400 font-medium pt-1">
                    {errorMsg}
                  </p>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 rounded-full bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-50 text-white font-semibold text-sm sm:text-base transition-all cursor-pointer"
                  >
                    {isSubmitting
                      ? "Guardando..."
                      : "Recibir invitación el 01/11"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-6 flex flex-col items-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#0071e3]" />
                <p className="text-lg font-bold text-white">
                  Tu lugar para el 01/11 ya está reservado, {nombre}.
                </p>
                <p className="text-sm text-[#a1a1a6]">
                  Te escribiremos por WhatsApp al {telefono} ({localidad}).
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── 4. MODAL MINIMALISTA ESTILO APPLE (AL TOCAR EL BOTÓN DEL HERO) ──── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-[#161617] border border-white/15 p-8 text-center shadow-2xl">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[#a1a1a6] hover:text-white transition-colors cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative h-8 w-32 mx-auto mb-4">
              <Image
                src="/assets/travelapp_blanco.svg"
                alt="TravelApp"
                fill
                className="object-contain object-center"
              />
            </div>

            {!submitted ? (
              <>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  El 01/11 nos vemos.
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-[#a1a1a6] font-medium leading-relaxed">
                  Completá tus datos para recibir por WhatsApp el acceso a nuestras webs y empezar a sumar puntos en <strong className="text-white">TravelApp Rewards</strong>.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Nombre y apellido"
                    className="w-full rounded-2xl bg-[#1d1d1f] border border-white/15 focus:border-white/50 focus:outline-none px-4 py-3.5 text-sm text-white placeholder:text-[#86868b] font-medium"
                  />
                  <input
                    type="tel"
                    required
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Teléfono (WhatsApp)"
                    className="w-full rounded-2xl bg-[#1d1d1f] border border-white/15 focus:border-white/50 focus:outline-none px-4 py-3.5 text-sm text-white placeholder:text-[#86868b] font-medium"
                  />
                  <input
                    type="text"
                    required
                    value={localidad}
                    onChange={(e) => setLocalidad(e.target.value)}
                    placeholder="Localidad"
                    className="w-full rounded-2xl bg-[#1d1d1f] border border-white/15 focus:border-white/50 focus:outline-none px-4 py-3.5 text-sm text-white placeholder:text-[#86868b] font-medium"
                  />

                  {errorMsg && (
                    <p className="text-xs text-red-400 font-medium">
                      {errorMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 py-3.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-50 text-white font-semibold text-sm transition-all cursor-pointer"
                  >
                    {isSubmitting
                      ? "Registrando..."
                      : "Confirmar mi registro 01/11"}
                  </button>
                </form>
              </>
            ) : (
              <div className="py-6 space-y-3">
                <CheckCircle2 className="w-10 h-10 text-[#0071e3] mx-auto" />
                <h4 className="text-xl font-bold text-white">
                  ¡Registro confirmado!
                </h4>
                <p className="text-sm text-[#a1a1a6]">
                  Gracias, <strong className="text-white">{nombre}</strong>. El 01/11 Travis te enviará un WhatsApp al <strong className="text-white">{telefono}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="mt-4 px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── 5. FOOTER MINIMALISTA ESTILO APPLE ───────────────────────────────── */}
      <footer className="w-full bg-black border-t border-white/10 py-6 px-4 text-center text-xs text-[#86868b]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Copyright © 2026 TravelApp S.A.S. Todos los derechos reservados.</span>
          <span>Argentina • Lanzamiento Oficial 01/11</span>
        </div>
      </footer>
    </div>
  );
}
