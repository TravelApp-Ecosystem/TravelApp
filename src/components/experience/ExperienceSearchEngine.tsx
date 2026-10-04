"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Compass,
  MapPin,
  Calendar,
  Users,
  Search,
  Sun,
  Mountain,
  Wine,
  Layers,
  Car,
  ChevronDown,
  Sparkles,
} from "lucide-react";

export type ExperienceCategoryTab =
  | "excursiones-dia"
  | "aventura"
  | "vinos"
  | "circuitos"
  | "travelcab";

interface ExperienceSearchEngineProps {
  onSearch?: (params: any) => void;
}

export function ExperienceSearchEngine({ onSearch }: ExperienceSearchEngineProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ExperienceCategoryTab>("excursiones-dia");

  // Parámetros de Búsqueda Receptiva
  const [puntoPartida, setPuntoPartida] = useState("Salta Capital");
  const [destino, setDestino] = useState("");
  const [fecha, setFecha] = useState("");
  const [dificultad, setDificultad] = useState("all");
  const [adultos, setAdultos] = useState(2);
  const [menores, setMenores] = useState(0);
  const [showPassengerModal, setShowPassengerModal] = useState(false);

  const tabs = [
    {
      id: "excursiones-dia" as ExperienceCategoryTab,
      label: "Excursiones de 1 Día",
      icon: <Sun className="w-4 h-4 text-[#ff4f5a]" />,
    },
    {
      id: "aventura" as ExperienceCategoryTab,
      label: "Aventura & Trekking",
      icon: <Mountain className="w-4 h-4 text-emerald-500" />,
    },
    {
      id: "vinos" as ExperienceCategoryTab,
      label: "Ruta del Vino & Bodegas",
      icon: <Wine className="w-4 h-4 text-amber-500" />,
    },
    {
      id: "circuitos" as ExperienceCategoryTab,
      label: "Circuitos Multidía",
      icon: <Layers className="w-4 h-4 text-blue-500" />,
    },
    {
      id: "travelcab" as ExperienceCategoryTab,
      label: "Traslado TravelCab",
      icon: <Car className="w-4 h-4 text-[#ff5a19]" />,
    },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === "travelcab") {
      router.push(`/landing/travelcab?origen=${encodeURIComponent(puntoPartida)}`);
      return;
    }

    const queryParams = new URLSearchParams();
    queryParams.set("tipo", activeTab);
    if (puntoPartida) queryParams.set("origen", puntoPartida);
    if (destino) queryParams.set("destino", destino);
    if (fecha) queryParams.set("fecha", fecha);
    if (dificultad !== "all") queryParams.set("dificultad", dificultad);
    queryParams.set("pax", String(adultos + menores));

    router.push(`/landing/experience/marketplace?${queryParams.toString()}`);
  };

  return (
    <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-2xl border border-white/60 font-sans text-slate-800">
      
      {/* 1. Selector de Pestañas de Turismo Receptivo */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 sm:pb-3 scrollbar-none overscroll-x-contain select-none flex-nowrap border-b border-slate-100">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-[#0a2a5b] text-white shadow-md shadow-blue-950/20 scale-[1.02]"
                  : "bg-slate-100/90 hover:bg-slate-200 text-slate-700 hover:text-slate-900"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Formulario de Búsqueda de Experiencias */}
      <form onSubmit={handleSearchSubmit} className="mt-4 sm:mt-5 space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          
          {/* Campo 1: Punto de Partida / Pick-up */}
          <div className="relative p-2.5 sm:p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl sm:rounded-2xl border border-slate-200/80 transition-colors">
            <label className="block text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">
              Punto de Partida (Hotel / Terminal)
            </label>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#ff4f5a] shrink-0" />
              <select
                value={puntoPartida}
                onChange={(e) => setPuntoPartida(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="Salta Capital">Salta Capital (Centro & Hoteles)</option>
                <option value="San Salvador de Jujuy">San Salvador de Jujuy</option>
                <option value="Purmamarca">Purmamarca (Pueblo & Hoteles)</option>
                <option value="Tilcara">Tilcara / Humahuaca</option>
                <option value="Cafayate">Cafayate (Valles Calchaquíes)</option>
                <option value="San Miguel de Tucumán">San Miguel de Tucumán</option>
                <option value="Tafí del Valle">Tafí del Valle</option>
              </select>
            </div>
          </div>

          {/* Campo 2: Destino o Actividad */}
          <div className="relative p-2.5 sm:p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl sm:rounded-2xl border border-slate-200/80 transition-colors">
            <label className="block text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">
              ¿Qué destino o actividad buscás?
            </label>
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#ff4f5a] shrink-0" />
              <input
                type="text"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                placeholder="Ej. Salinas Grandes, Bodegas, Cachi..."
                className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Campo 3: Fecha de Excursión */}
          <div className="relative p-2.5 sm:p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl sm:rounded-2xl border border-slate-200/80 transition-colors">
            <label className="block text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">
              Fecha de la Excursión
            </label>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#ff4f5a] shrink-0" />
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Campo 4: Pasajeros & Dificultad */}
          <div className="relative p-2.5 sm:p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl sm:rounded-2xl border border-slate-200/80 transition-colors">
            <label className="block text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">
              Viajeros & Dificultad
            </label>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowPassengerModal(!showPassengerModal)}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-800 cursor-pointer"
              >
                <Users className="w-4 h-4 text-[#ff4f5a]" />
                <span>
                  {adultos + menores} {adultos + menores === 1 ? "persona" : "personas"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </button>

              <select
                value={dificultad}
                onChange={(e) => setDificultad(e.target.value)}
                aria-label="Filtro de Dificultad"
                className="bg-transparent text-[11px] font-extrabold text-[#0a2a5b] focus:outline-none cursor-pointer text-right"
              >
                <option value="all">Dificultad: Todas</option>
                <option value="baja">Baja (Familiar / Niños)</option>
                <option value="moderada">Moderada</option>
                <option value="aventura">Aventura / Exigente</option>
              </select>
            </div>

            {/* Modal flotante de Pasajeros */}
            {showPassengerModal && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 text-slate-800">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <div>
                    <div className="text-xs font-bold">Adultos</div>
                    <div className="text-[10px] text-slate-400">Desde 12 años</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setAdultos(Math.max(1, adultos - 1))}
                      className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 font-bold flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-sm font-bold">{adultos}</span>
                    <button
                      type="button"
                      onClick={() => setAdultos(adultos + 1)}
                      className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 font-bold flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-xs font-bold">Menores</div>
                    <div className="text-[10px] text-slate-400">Hasta 11 años</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setMenores(Math.max(0, menores - 1))}
                      className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 font-bold flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-sm font-bold">{menores}</span>
                    <button
                      type="button"
                      onClick={() => setMenores(menores + 1)}
                      className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 font-bold flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPassengerModal(false)}
                  className="w-full mt-2 py-1.5 rounded-xl bg-[#0a2a5b] text-white text-xs font-bold cursor-pointer"
                >
                  Listo
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3. Botón de Búsqueda Full-Width */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-500 font-medium">
            <Sparkles className="w-4 h-4 text-[#ff4f5a]" />
            <span>
              Incluye <strong>Pick-up en tu hotel</strong> y <strong>Seguro de Turismo Activo</strong>
            </span>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-[#ff4f5a] hover:bg-[#e63e49] text-white text-sm sm:text-base font-extrabold shadow-lg shadow-[#ff4f5a]/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Explorar Experiencias</span>
          </button>
        </div>
      </form>
    </div>
  );
}
