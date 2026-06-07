"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Compass,
  MapPin,
  Award,
  Calendar,
  Users,
  Phone,
  ArrowLeft,
  Search,
  Filter,
  X,
  Clock,
  Sparkles,
  Heart,
  ChevronRight,
  Info,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { collection, onSnapshot, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Tour } from "@/types/experiences";

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
  </svg>
);
const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);
const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.5 12 3.5 12 3.5s-7.518 0-9.388.503a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11C4.482 20.5 12 20.5 12 20.5s7.518 0 9.388-.503a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);
const TiktokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.032 2.61-.019 3.91-.006.03 1.56.7 2.92 1.94 3.79.79.56 1.7.93 2.65 1.11.01 1.41-.01 2.82.003 4.23-.88-.13-1.74-.46-2.52-.94-.85-.52-1.55-1.24-2.02-2.11v6.92c-.01 1.43-.37 2.85-1.07 4.09-.76 1.34-1.92 2.4-3.32 2.99-1.57.66-3.37.76-5.02.26-1.5-.45-2.83-1.46-3.69-2.82-1-1.58-1.28-3.56-.78-5.38.48-1.76 1.7-3.26 3.34-4.08 1.15-.58 2.44-.81 3.72-.66v4.3c-.76-.23-1.61-.13-2.3.29-.63.39-1.05 1.05-1.16 1.79-.17.99.31 2.05 1.17 2.53.69.39 1.54.43 2.26.11.83-.37 1.39-1.19 1.44-2.1.03-3.64.01-7.28.02-10.93.01-.13.01-.26.01-.39z"/>
  </svg>
);

const RenderLegalSeal = ({ content, alt }: { content?: string; alt: string }) => {
  if (!content) return null;
  const trimmed = content.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("<") || trimmed.includes("<script")) {
    return (
      <div 
        className="flex items-center justify-center min-h-[40px] max-h-16 overflow-hidden [&_img]:max-h-10 [&_img]:w-auto"
        dangerouslySetInnerHTML={{ __html: trimmed }} 
      />
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 hover:border-slate-700 transition-colors">
      <img src={trimmed} alt={alt} className="h-6 w-auto object-contain" />
      <span className="text-[8px] font-bold text-slate-400 uppercase">{alt}</span>
    </div>
  );
};

interface ExperienceMarketplaceClientProps {
  initialCms: any;
}

export default function ExperienceMarketplaceClient({ initialCms }: ExperienceMarketplaceClientProps) {
  const cmsData = initialCms || {};
  const [tours, setTours] = useState<Tour[]>([]);
  const [loadingTours, setLoadingTours] = useState(true);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDestination, setSelectedDestination] = useState("all");
  const [selectedTripType, setSelectedTripType] = useState("all");
  const [selectedTransport, setSelectedTransport] = useState("all");
  const [selectedAvailability, setSelectedAvailability] = useState("all");
  const [priceSortOrder, setPriceSortOrder] = useState<"none" | "asc" | "desc">("none");

  // Modales
  const [activeTourDetail, setActiveTourDetail] = useState<Tour | null>(null);
  const [tourToReserve, setTourToReserve] = useState<Tour | null>(null);

  // Formulario de Reserva
  const [passengerName, setPassengerName] = useState("");
  const [passengerEmail, setPassengerEmail] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");
  const [passengerCount, setPassengerCount] = useState(1);
  const [isSubmittingRes, setIsSubmittingRes] = useState(false);
  const [resStatus, setResStatus] = useState<"idle" | "success" | "error">("idle");

  // Cargar tours en tiempo real
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "experiences"), (snapshot) => {
      const list: Tour[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Tour);
      });
      setTours(list);
      setLoadingTours(false);
    });
    return () => unsub();
  }, []);

  // Extraer valores únicos de filtros
  const uniqueDestinations = useMemo(() => {
    return Array.from(new Set(tours.map((t) => t.location.split(",")[0].trim()).filter(Boolean)));
  }, [tours]);

  const uniqueTransports = useMemo(() => {
    return Array.from(new Set(tours.map((t) => t.transportation).filter(Boolean)));
  }, [tours]);

  // Filtrado de Tours
  const filteredTours = useMemo(() => {
    let result = [...tours];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q)
      );
    }

    if (selectedDestination !== "all") {
      result = result.filter((t) => t.location.toLowerCase().includes(selectedDestination.toLowerCase()));
    }

    if (selectedTripType !== "all") {
      result = result.filter((t) => t.tripType === selectedTripType);
    }

    if (selectedTransport !== "all") {
      result = result.filter((t) => t.transportation === selectedTransport);
    }

    if (selectedAvailability !== "all") {
      result = result.filter((t) => t.availability === selectedAvailability);
    }

    if (priceSortOrder === "asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (priceSortOrder === "desc") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [tours, searchQuery, selectedDestination, selectedTripType, selectedTransport, selectedAvailability, priceSortOrder]);

  const formatPrice = (value: number, currency: string = "ARS") => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0
    }).format(value);
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tourToReserve) return;
    setIsSubmittingRes(true);
    setResStatus("idle");

    try {
      await addDoc(collection(db, "experience_reservations"), {
        tourId: tourToReserve.id,
        tourTitle: tourToReserve.title,
        nombrePasajero: passengerName,
        emailPasajero: passengerEmail,
        telefonoPasajero: passengerPhone,
        cantidadPersonas: passengerCount,
        estado: "Pendiente",
        createdAt: new Date().toISOString()
      });

      setResStatus("success");
      // Reset form
      setPassengerName("");
      setPassengerEmail("");
      setPassengerPhone("");
      setPassengerCount(1);
    } catch (err) {
      console.error("Error creating reservation:", err);
      setResStatus("error");
    } finally {
      setIsSubmittingRes(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between">
      
      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-lg">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="https://experience.travelapp.ar" className="h-9 w-9 rounded-xl bg-slate-850 hover:bg-slate-800 flex items-center justify-center border border-slate-700 transition-colors">
              <ArrowLeft className="h-5 w-5 text-lime-400" />
            </a>
            <div className="flex items-center gap-2">
              <Compass className="h-6 w-6 text-lime-400" />
              <div>
                <span className="font-black text-lg block leading-none tracking-tight">TravelApp</span>
                <span className="text-[10px] text-lime-400 font-bold uppercase tracking-wider block mt-0.5">Experiences</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-500/10 border border-lime-500/20 text-xs text-lime-400 font-black tracking-wide">
              <Sparkles className="h-3.5 w-3.5" /> CATÁLOGO OFICIAL
            </span>
          </div>
        </div>
      </header>

      {/* PORTADA BANNER */}
      <section className="bg-slate-900 text-white py-12 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-lime-400 via-slate-900 to-slate-950"></div>
        <div className="mx-auto max-w-7xl relative z-10 text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Explorá el Marketplace de <span className="text-lime-400">Viajes & Experiencias</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Descubrí salidas grupales, catas VIP, cabalgatas y aventuras guiadas por todo el país. Sumá puntos Rewards y reservá al instante.
          </p>
        </div>
      </section>

      {/* PANEL PRINCIPAL: CATÁLOGO Y FILTROS */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* FILTROS DE ESCRITORIO (Sidebar) */}
        <aside className="lg:col-span-3 space-y-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-fit">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" /> Filtrar Catálogo
            </h2>
            <button 
              onClick={() => {
                setSearchQuery("");
                setSelectedDestination("all");
                setSelectedTripType("all");
                setSelectedTransport("all");
                setSelectedAvailability("all");
                setPriceSortOrder("none");
              }}
              className="text-[10px] font-bold text-lime-600 hover:text-lime-700 uppercase"
            >
              Limpiar
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Destino */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-600 block">Destino del Viaje</label>
              <select 
                value={selectedDestination} 
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-700 focus:outline-none focus:border-lime-500 transition-colors"
              >
                <option value="all">Todos los destinos</option>
                {uniqueDestinations.map((dest, i) => (
                  <option key={i} value={dest}>{dest}</option>
                ))}
              </select>
            </div>

            {/* Tipo de Viaje */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-600 block">Tipo de Salida</label>
              <select 
                value={selectedTripType} 
                onChange={(e) => setSelectedTripType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-700 focus:outline-none focus:border-lime-500 transition-colors"
              >
                <option value="all">Grupal e Individual</option>
                <option value="Grupal">Grupal</option>
                <option value="Individual">Individual</option>
              </select>
            </div>

            {/* Transporte */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-600 block">Medio de Transporte</label>
              <select 
                value={selectedTransport} 
                onChange={(e) => setSelectedTransport(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-700 focus:outline-none focus:border-lime-500 transition-colors"
              >
                <option value="all">Todos los transportes</option>
                {uniqueTransports.map((trans, i) => (
                  <option key={i} value={trans}>{trans}</option>
                ))}
              </select>
            </div>

            {/* Disponibilidad */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-600 block">Disponibilidad</label>
              <select 
                value={selectedAvailability} 
                onChange={(e) => setSelectedAvailability(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-700 focus:outline-none focus:border-lime-500 transition-colors"
              >
                <option value="all">Cualquier estado</option>
                <option value="Disponible">Disponible</option>
                <option value="Cupos Limitados">Cupos Limitados</option>
                <option value="Agotado">Agotado</option>
              </select>
            </div>

            {/* Ordenar por Precio */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-600 block">Ordenar por Precio</label>
              <select 
                value={priceSortOrder} 
                onChange={(e) => setPriceSortOrder(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-700 focus:outline-none focus:border-lime-500 transition-colors"
              >
                <option value="none">Sin ordenar</option>
                <option value="asc">Menor a Mayor precio</option>
                <option value="desc">Mayor a Menor precio</option>
              </select>
            </div>
          </div>
        </aside>

        {/* GRILLA DE TOURS Y BARRA DE BÚSQUEDA */}
        <section className="lg:col-span-9 space-y-6">
          
          {/* Barra de Búsqueda */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por excursión, destino, descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-400/40 focus:border-lime-500 transition-all"
            />
          </div>

          {/* Estado de Carga */}
          {loadingTours ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-lime-500 border-t-transparent"></div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Sincronizando Catálogo en tiempo real...</p>
            </div>
          ) : filteredTours.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-2">
              <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
              <h3 className="text-lg font-black text-slate-800">No encontramos resultados</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                No hay viajes cargados en el sistema que coincidan con la búsqueda o filtros actuales. Intentá reestablecer los filtros.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTours.map((tour) => {
                const isAvailable = tour.availability === "Disponible" || tour.availability === "Cupos Limitados";
                
                return (
                  <div key={tour.id} className="flex flex-col bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    
                    {/* Imagen Portada */}
                    <div className="h-44 w-full bg-slate-100 relative overflow-hidden">
                      <img 
                        src={tour.imageUrl || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"} 
                        alt={tour.title} 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent"></div>
                      
                      {/* Código de Viaje */}
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-slate-900/80 text-[10px] font-black text-white uppercase backdrop-blur-sm tracking-wider">
                        {tour.id}
                      </span>

                      {/* Badge disponibilidad */}
                      <span className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-white ${
                        tour.availability === "Disponible" ? "bg-emerald-500" : tour.availability === "Cupos Limitados" ? "bg-amber-500" : "bg-slate-500"
                      }`}>
                        {tour.availability}
                      </span>
                    </div>

                    {/* Contenido de la Tarjeta */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-slate-500 text-[10px] font-black uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-lime-600" />
                            {tour.location}
                          </span>
                          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                            {tour.tripType}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-slate-800 leading-snug line-clamp-1">
                          {tour.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {tour.description}
                        </p>
                      </div>

                      {/* Servicios Incluidos */}
                      <div className="flex flex-wrap gap-1 border-t border-slate-100 pt-3">
                        {tour.services?.slice(0, 3).map((srv, i) => (
                          <span key={i} className="text-[9px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-500 font-semibold truncate max-w-[80px]">
                            {srv}
                          </span>
                        ))}
                        {tour.services?.length > 3 && (
                          <span className="text-[9px] text-lime-600 font-bold px-1 py-0.5">+{tour.services.length - 3}</span>
                        )}
                      </div>

                      {/* Precios y Acciones */}
                      <div className="border-t border-slate-100 pt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase">Tarifa Regular</span>
                            <span className="block text-sm font-semibold text-slate-500">
                              {formatPrice(tour.price, tour.currency)}
                            </span>
                          </div>
                          
                          <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 text-[9px] font-black text-emerald-600 px-2 py-0.5">
                            <Award className="h-3 w-3" /> +{tour.pointsEarned} pts
                          </span>
                        </div>

                        {/* Caja Destacada Rewards */}
                        <div className="bg-lime-500/10 border border-lime-500/20 rounded-2xl p-2.5 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[9px] font-black text-lime-700 uppercase block tracking-wider leading-none">Miembro Rewards</span>
                            <span className="text-base font-black text-lime-600 mt-1 block">
                              {formatPrice(tour.priceRewards, tour.currency)}
                            </span>
                          </div>
                          <button
                            onClick={() => setActiveTourDetail(tour)}
                            className="bg-lime-500 hover:bg-lime-600 rounded-xl px-3 py-2 text-xs font-black text-gray-950 transition-colors shadow-sm"
                          >
                            Ver Ficha
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-16 px-6">
        <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Compass className="h-6 w-6 text-lime-400" />
              <span className="font-black text-white text-lg">{cmsData.footer?.brandText || "TravelApp Experiences"}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Viajá, explorá y acumulá recompensas en el ecosistema turístico más completo de Argentina.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-4">Navegación</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="https://experience.travelapp.ar" className="hover:text-white transition-colors">Volver a la Landing</a></li>
              <li><a href={cmsData.header?.loginUrl || "/login"} className="hover:text-white transition-colors">Portal Administrativo</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-4">Redes Sociales</h4>
            <div className="flex flex-wrap gap-2.5">
              {cmsData.redesSociales?.facebook && (
                <a
                  href={cmsData.redesSociales.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-lime-500 hover:text-slate-900 flex items-center justify-center transition-colors border border-slate-700 text-slate-300"
                >
                  <FacebookIcon className="h-4 w-4" />
                </a>
              )}
              {cmsData.redesSociales?.instagram && (
                <a
                  href={cmsData.redesSociales.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-lime-500 hover:text-slate-900 flex items-center justify-center transition-colors border border-slate-700 text-slate-300"
                >
                  <InstagramIcon className="h-4 w-4" />
                </a>
              )}
              {cmsData.redesSociales?.linkedin && (
                <a
                  href={cmsData.redesSociales.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-lime-500 hover:text-slate-900 flex items-center justify-center transition-colors border border-slate-700 text-slate-300"
                >
                  <LinkedinIcon className="h-4 w-4" />
                </a>
              )}
              {cmsData.redesSociales?.youtube && (
                <a
                  href={cmsData.redesSociales.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-lime-500 hover:text-slate-900 flex items-center justify-center transition-colors border border-slate-700 text-slate-300"
                >
                  <YoutubeIcon className="h-4 w-4" />
                </a>
              )}
              {cmsData.redesSociales?.tiktok && (
                <a
                  href={cmsData.redesSociales.tiktok}
                  target="_blank"
                  rel="noreferrer"
                  className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-lime-500 hover:text-slate-900 flex items-center justify-center transition-colors border border-slate-700 text-slate-300"
                >
                  <TiktokIcon className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-4">Soporte & Reservas</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href={cmsData.redesSociales?.whatsapp || "#"} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-lime-400 hover:underline">
                  <Phone className="h-3 w-3" /> Contactar por WhatsApp
                </a>
              </li>
              <li className="text-[10px] text-slate-500">Atención personalizada las 24hs.</li>
            </ul>
          </div>
        </div>

        <div className="mx-auto max-w-7xl border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <p className="order-2 md:order-1 text-center md:text-left">
            {cmsData.footer?.copyrightText || "© 2026 TravelApp Experiences. Una marca de TravelApp s.a.s."}
          </p>
          <div className="order-1 md:order-2 flex flex-wrap items-center justify-center gap-4">
            <RenderLegalSeal content={cmsData.sellosLegales?.arcaQr} alt="ARCA" />
            <RenderLegalSeal content={cmsData.sellosLegales?.baseDatosSello} alt="Base de Datos" />
          </div>
          <div className="order-3 flex gap-4">
            <a href="#" className="hover:text-slate-300">Términos de Servicio</a>
            <a href="#" className="hover:text-slate-300">Políticas de Privacidad</a>
          </div>
        </div>
      </footer>

      {/* ======================================================== */}
      {/* MODAL DETALLES DEL VIAJE (FICHA) */}
      {/* ======================================================== */}
      {activeTourDetail && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
          onClick={() => setActiveTourDetail(null)}
        >
          <div 
            className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "scaleIn 0.3s ease-out" }}
          >
            {/* Cabecera del modal: Imagen Portada */}
            <div className="relative h-60 bg-slate-100 flex-shrink-0">
              <img 
                src={activeTourDetail.imageUrl || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"} 
                alt={activeTourDetail.title} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent"></div>
              
              <button 
                onClick={() => setActiveTourDetail(null)}
                className="absolute top-4 right-4 h-9 w-9 rounded-xl bg-slate-900/60 hover:bg-slate-900 flex items-center justify-center text-white backdrop-blur-sm transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="absolute bottom-4 left-6 right-6 text-white space-y-1">
                <span className="px-2 py-0.5 rounded-lg bg-lime-500 text-[10px] font-black text-gray-950 uppercase tracking-wider">
                  {activeTourDetail.id}
                </span>
                <h3 className="text-xl sm:text-2xl font-black leading-snug">{activeTourDetail.title}</h3>
              </div>
            </div>

            {/* Contenido Escroleable */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-600 leading-relaxed flex-1">
              
              {/* Info de Ficha Rápida */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Destino</span>
                  <span className="font-bold text-slate-800 block truncate">{activeTourDetail.location}</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Salida</span>
                  <span className="font-bold text-slate-800 block">{activeTourDetail.departureDate}</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Origen</span>
                  <span className="font-bold text-slate-800 block truncate">{activeTourDetail.departureOrigin}</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Modalidad</span>
                  <span className="font-bold text-slate-800 block truncate">{activeTourDetail.tripType}</span>
                </div>
              </div>

              {/* Precios Regular vs Rewards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Tarifa General</span>
                  <span className="text-lg font-bold text-slate-700 mt-1 block">
                    {formatPrice(activeTourDetail.price, activeTourDetail.currency)}
                  </span>
                </div>
                <div className="bg-lime-500/10 border border-lime-500/20 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-lime-700 uppercase tracking-wider block leading-none">Miembro Rewards</span>
                    <span className="text-xl font-black text-lime-600 mt-1 block">
                      {formatPrice(activeTourDetail.priceRewards, activeTourDetail.currency)}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-lime-500/20 px-2.5 py-1 text-[10px] font-black text-lime-700 border border-lime-500/30">
                    Suma +{activeTourDetail.pointsEarned} pts
                  </span>
                </div>
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-800 uppercase text-xs tracking-wider border-b border-slate-100 pb-1.5">Descripción de la Experiencia</h4>
                <p className="whitespace-pre-line text-slate-500 text-xs leading-relaxed">{activeTourDetail.description}</p>
              </div>

              {/* Servicios Incluidos */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-800 uppercase text-xs tracking-wider border-b border-slate-100 pb-1.5">Servicios Incluidos</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeTourDetail.services?.map((srv, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-lime-500 font-bold self-center">✓</span>
                      <span className="text-slate-600 font-medium">{srv}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observaciones */}
              {activeTourDetail.observations && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                  <Info className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-black text-amber-900 text-xs uppercase tracking-wider">Notas Especiales</h5>
                    <p className="text-[11px] text-amber-800 leading-relaxed mt-1">{activeTourDetail.observations}</p>
                  </div>
                </div>
              )}

            </div>

            {/* Footer de Acciones del Modal */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex-shrink-0 flex flex-col sm:flex-row items-center gap-3">
              <button 
                onClick={() => setActiveTourDetail(null)}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-slate-200 bg-white font-bold hover:bg-slate-100 transition-colors text-xs text-slate-600 text-center"
              >
                Volver
              </button>
              
              {activeTourDetail.availability !== "Agotado" ? (
                <button
                  onClick={() => {
                    setTourToReserve(activeTourDetail);
                    setActiveTourDetail(null);
                    setResStatus("idle");
                  }}
                  className="w-full sm:flex-1 px-8 py-3 rounded-2xl bg-lime-500 hover:bg-lime-600 text-gray-950 font-black text-xs text-center transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <Calendar className="h-4 w-4" /> Solicitar Reserva Directa
                </button>
              ) : (
                <span className="w-full sm:flex-1 px-8 py-3 rounded-2xl bg-slate-200 text-slate-500 font-bold text-xs text-center border border-slate-300">
                  Totalmente Agotado
                </span>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL FORMULARIO DE RESERVA */}
      {/* ======================================================== */}
      {tourToReserve && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
          onClick={() => {
            if (!isSubmittingRes) setTourToReserve(null);
          }}
        >
          <div 
            className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-100"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "scaleIn 0.3s ease-out" }}
          >
            <div className="bg-slate-900 text-white p-6 relative">
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                <Compass className="h-5 w-5 text-lime-400" /> Solicitud de Reserva
              </h3>
              <p className="text-xs text-slate-400 mt-1 truncate">Viaje: {tourToReserve.title} ({tourToReserve.id})</p>
              
              {!isSubmittingRes && (
                <button 
                  onClick={() => setTourToReserve(null)}
                  className="absolute top-4 right-4 h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {resStatus === "success" ? (
              <div className="p-8 text-center space-y-4">
                <div className="h-16 w-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600 animate-pulse">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <h4 className="text-lg font-black text-slate-800">¡Reserva Solicitada con Éxito!</h4>
                <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                  Tu reserva ha sido ingresada al panel operativo con estado <strong>Pendiente</strong>. Un asesor comercial verificará la disponibilidad y te contactará a la brevedad.
                </p>
                <div className="pt-4 flex flex-col gap-2">
                  <a
                    href={`https://wa.me/5493814188106?text=Hola!%20Acabo%20de%20solicitar%20la%20reserva%20para%20el%20viaje%20${tourToReserve.id}%20(${tourToReserve.title})%20en%20el%20sitio%20web.`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black shadow-md flex items-center justify-center gap-2 transition-colors"
                  >
                    <Phone className="h-4 w-4" /> Acelerar por WhatsApp
                  </a>
                  <button
                    onClick={() => setTourToReserve(null)}
                    className="w-full px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
                  >
                    Cerrar Ventana
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="p-6 space-y-4 text-xs font-semibold">
                {resStatus === "error" && (
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3 text-red-800">
                    <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <div>
                      <h5 className="font-black">Error al procesar reserva</h5>
                      <p className="text-[10px] mt-0.5">Hubo un problema de conexión. Intentá nuevamente.</p>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-slate-500 block">Nombre del Pasajero Principal</label>
                  <input
                    type="text"
                    required
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-lime-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 block">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={passengerEmail}
                    onChange={(e) => setPassengerEmail(e.target.value)}
                    placeholder="juan@email.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-lime-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 block">Teléfono (WhatsApp)</label>
                  <input
                    type="tel"
                    required
                    value={passengerPhone}
                    onChange={(e) => setPassengerPhone(e.target.value)}
                    placeholder="Ej. +54 9 381 XXXXXXX"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-lime-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 block">Cantidad de Pasajeros</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={passengerCount}
                    onChange={(e) => setPassengerCount(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-lime-500 transition-colors"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    disabled={isSubmittingRes}
                    onClick={() => setTourToReserve(null)}
                    className="w-1/3 px-4 py-3 rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold transition-colors text-center"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRes}
                    className="flex-1 px-6 py-3 rounded-2xl bg-lime-500 hover:bg-lime-600 disabled:bg-slate-200 text-gray-950 font-black flex items-center justify-center gap-2 transition-colors shadow-md"
                  >
                    {isSubmittingRes ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-850 border-t-transparent"></div>
                    ) : (
                      "Confirmar Reserva"
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
