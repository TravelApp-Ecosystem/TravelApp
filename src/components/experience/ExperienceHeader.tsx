"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Phone,
  MessageCircle,
  Menu,
  X,
  ChevronDown,
  Compass,
  Users,
  Target,
  Eye,
  HeartHandshake,
  Sparkles,
  MapPin,
  Car,
  Gift,
  ShieldCheck,
  Mountain,
  Sun,
  Wine,
  Calendar,
} from "lucide-react";

interface ExperienceHeaderProps {
  onOpenQuienesSomos?: (tab: "vision" | "mision" | "valores") => void;
  onOpenContacto?: () => void;
}

export function ExperienceHeader({
  onOpenQuienesSomos,
  onOpenContacto,
}: ExperienceHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quienesSomosOpen, setQuienesSomosOpen] = useState(false);
  const [ecosistemaOpen, setEcosistemaOpen] = useState(false);
  const [receptivoOpen, setReceptivoOpen] = useState(false);
  const [regionesOpen, setRegionesOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0a2a5b] text-white shadow-lg border-b border-white/10 font-sans selection:bg-[#ff4f5a] selection:text-white">
      {/* 1. Top Bar Corporativa */}
      <div className="w-full bg-[#071d3f] border-b border-white/5 py-1.5 px-4 sm:px-6 lg:px-8 text-[11px] sm:text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="inline-flex items-center gap-1.5 font-bold text-[#ff4f5a] tracking-wide">
              <Compass className="w-3.5 h-3.5 animate-spin-slow" />
              TRAVELAPP EXPERIENCE · TURISMO RECEPTIVO OFICIAL
            </span>
            <span className="hidden md:inline text-white/40">|</span>
            <span className="hidden md:inline text-white/80">
              Salidas diarias en Salta, Jujuy & Tucumán con guías matriculados
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href="tel:08102200018"
              className="flex items-center gap-1.5 text-white/90 hover:text-white font-bold transition-colors"
            >
              <Phone className="w-3 h-3 text-[#ff4f5a]" />
              <span>0810-220-0018</span>
            </a>
            <a
              href="https://wa.me/5493812020050"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden xs:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-bold border border-emerald-500/30 transition-all"
            >
              <MessageCircle className="w-3 h-3" />
              <span>WhatsApp Receptivo</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Barra de Navegación Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          
          {/* Logo TravelApp Experience Oficial */}
          <Link
            href="/landing/experience"
            className="flex items-center gap-2 sm:gap-3 group shrink-0"
          >
            <div className="relative">
              <span className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white group-hover:text-white/95 transition-all">
                Travel<span className="text-white/90 font-light">App</span>
              </span>
              {/* Brillo sutil institucional */}
              <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
            </div>

            {/* Badge Coral de Experience */}
            <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-md bg-[#ff4f5a] text-white text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-sm shadow-[#ff4f5a]/30">
              <Compass className="w-3 h-3" />
              Experience
            </span>
          </Link>

          {/* Menú de Navegación Desktop */}
          <nav className="hidden xl:flex items-center gap-1 lg:gap-2">
            
            {/* 1. Desplegable Quienes Somos */}
            <div
              className="relative"
              onMouseEnter={() => setQuienesSomosOpen(true)}
              onMouseLeave={() => setQuienesSomosOpen(false)}
            >
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-white/90 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <span>Quiénes somos</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${quienesSomosOpen ? "rotate-180" : ""}`} />
              </button>

              {quienesSomosOpen && (
                <div className="absolute top-full left-0 w-64 bg-[#071d3f] rounded-2xl shadow-2xl border border-white/10 p-2 text-white animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                  <button
                    type="button"
                    onClick={() => {
                      setQuienesSomosOpen(false);
                      onOpenQuienesSomos?.("vision");
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors text-left cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <Eye className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Nuestra Visión</div>
                      <div className="text-[11px] text-white/60">El futuro del turismo receptivo</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setQuienesSomosOpen(false);
                      onOpenQuienesSomos?.("mision");
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors text-left cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#ff4f5a]/20 text-[#ff4f5a] flex items-center justify-center shrink-0">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Nuestra Misión</div>
                      <div className="text-[11px] text-white/60">Experiencias auténticas y seguras</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setQuienesSomosOpen(false);
                      onOpenQuienesSomos?.("valores");
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors text-left cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <HeartHandshake className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Nuestros Valores</div>
                      <div className="text-[11px] text-white/60">Compromiso, cultura y calidez</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* 2. Desplegable El Ecosistema */}
            <div
              className="relative"
              onMouseEnter={() => setEcosistemaOpen(true)}
              onMouseLeave={() => setEcosistemaOpen(false)}
            >
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-white/90 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <span>El Ecosistema</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${ecosistemaOpen ? "rotate-180" : ""}`} />
              </button>

              {ecosistemaOpen && (
                <div className="absolute top-full left-0 w-72 bg-[#071d3f] rounded-2xl shadow-2xl border border-white/10 p-2 text-white animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                  <Link
                    href="/landing/ecosistema"
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-black text-xs">
                      TA
                    </div>
                    <div>
                      <div className="text-xs font-bold">TravelApp Oficial</div>
                      <div className="text-[11px] text-white/60">Portal matriz y turismo emisivo</div>
                    </div>
                  </Link>

                  <Link
                    href="/landing/experience"
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-white/10 text-white transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#ff4f5a]/20 text-[#ff4f5a] flex items-center justify-center shrink-0">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#ff4f5a]">TravelApp Experience</div>
                      <div className="text-[11px] text-white/60">Turismo receptivo en territorio</div>
                    </div>
                  </Link>

                  <Link
                    href="/landing/travelcab"
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#ff5a19]/20 text-[#ff5a19] flex items-center justify-center shrink-0">
                      <Car className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">TravelCab</div>
                      <div className="text-[11px] text-white/60">Traslados oficiales y transfers</div>
                    </div>
                  </Link>

                  <Link
                    href="/landing/rewards"
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#e5a93b]/20 text-[#e5a93b] flex items-center justify-center shrink-0">
                      <Gift className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">TravelApp Rewards</div>
                      <div className="text-[11px] text-white/60">Club de puntos y beneficios</div>
                    </div>
                  </Link>

                  <Link
                    href="/landing/afiliados"
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Afiliados & Embajadores</div>
                      <div className="text-[11px] text-white/60">Ganá comisiones por recomendar</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* 3. Desplegable Turismo Receptivo */}
            <div
              className="relative"
              onMouseEnter={() => setReceptivoOpen(true)}
              onMouseLeave={() => setReceptivoOpen(false)}
            >
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-white/90 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <span>Turismo Receptivo</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${receptivoOpen ? "rotate-180" : ""}`} />
              </button>

              {receptivoOpen && (
                <div className="absolute top-full left-0 w-72 bg-[#071d3f] rounded-2xl shadow-2xl border border-white/10 p-2 text-white animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                  <Link
                    href="/landing/experience/marketplace?tipo=excursiones-dia"
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#ff4f5a]/20 text-[#ff4f5a] flex items-center justify-center shrink-0">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Excursiones de 1 Día</div>
                      <div className="text-[11px] text-white/60">Salinas, Cafayate, Cachi, Iruya</div>
                    </div>
                  </Link>

                  <Link
                    href="/landing/experience/marketplace?tipo=aventura"
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Mountain className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Aventura & Trekking</div>
                      <div className="text-[11px] text-white/60">Cabalgatas, 4x4 y yungas</div>
                    </div>
                  </Link>

                  <Link
                    href="/landing/experience/marketplace?tipo=vinos"
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Wine className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Ruta del Vino & Bodegas</div>
                      <div className="text-[11px] text-white/60">Catas en altura y maridajes</div>
                    </div>
                  </Link>

                  <Link
                    href="/landing/experience/marketplace?tipo=circuitos"
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Circuitos Multidía</div>
                      <div className="text-[11px] text-white/60">Norte completo de 3 a 7 días</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* 4. Enlace Directo al Marketplace Receptivo */}
            <Link
              href="/landing/experience/marketplace"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-white/90 hover:text-white hover:bg-white/10 transition-all"
            >
              <span>Catálogo Receptivo</span>
              <span className="px-1.5 py-0.5 rounded-full bg-[#ff4f5a] text-white text-[9px] font-black uppercase">
                2026
              </span>
            </Link>

            {/* 5. Botón Contacto */}
            <button
              type="button"
              onClick={onOpenContacto}
              className="px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-white/90 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              Contacto
            </button>
          </nav>

          {/* Botones de Autenticación / Acceso */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/login"
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              Ingresar
            </Link>

            <Link
              href="/registro"
              className="px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-[#ff4f5a] hover:bg-[#e63e49] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#ff4f5a]/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              Registrarse
            </Link>

            {/* Botón Burger Menú Mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Abrir menú móvil"
              className="xl:hidden p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú Desplegable Mobile */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#071d3f] border-t border-white/10 px-4 pt-3 pb-6 space-y-3 animate-in fade-in duration-200">
          <div className="space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#ff4f5a]">
              Navegación
            </div>
            <Link
              href="/landing/experience"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-bold text-white hover:bg-white/10"
            >
              Inicio Experience
            </Link>
            <Link
              href="/landing/experience/marketplace"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-bold text-white hover:bg-white/10"
            >
              Catálogo de Excursiones Receptivas
            </Link>
            <Link
              href="/landing/experience/marketplace?tipo=aventura"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-bold text-white hover:bg-white/10"
            >
              Aventura & Trekking
            </Link>
            <Link
              href="/landing/experience/marketplace?tipo=vinos"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-bold text-white hover:bg-white/10"
            >
              Ruta del Vino & Bodegas
            </Link>
          </div>

          <div className="pt-2 border-t border-white/10 space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              El Ecosistema
            </div>
            <Link
              href="/landing/ecosistema"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-bold text-white hover:bg-white/10"
            >
              TravelApp Oficial (OTA)
            </Link>
            <Link
              href="/landing/travelcab"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-bold text-white hover:bg-white/10"
            >
              TravelCab (Traslados Oficiales)
            </Link>
            <Link
              href="/landing/rewards"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-bold text-white hover:bg-white/10"
            >
              TravelApp Rewards (Club de Puntos)
            </Link>
            <Link
              href="/landing/afiliados"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-bold text-white hover:bg-white/10"
            >
              Afiliados & Embajadores
            </Link>
          </div>

          <div className="pt-2 border-t border-white/10 space-y-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenContacto?.();
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-white hover:bg-white/10"
            >
              Contacto Directo
            </button>
            <a
              href="tel:08102200018"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-emerald-400 bg-emerald-500/10"
            >
              <Phone className="w-4 h-4" />
              <span>0810-220-0018</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
