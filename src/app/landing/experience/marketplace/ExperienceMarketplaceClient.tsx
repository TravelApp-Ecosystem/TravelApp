"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
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
  AlertTriangle,
  Bus,
  Plane,
  Check,
  ShieldCheck,
  Tag,
  BedDouble,
  Utensils,
  Share2,
  HelpCircle,
  Ship,
  FileText,
  DollarSign,
  CreditCard,
  Send,
  ExternalLink,
  MessageCircle,
  Layers,
  ChevronDown
} from "lucide-react";
import { collection, onSnapshot, addDoc, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Tour, MasterTrip, calculateTimeToPayDeadline, getTimeRemainingInfo } from "@/types/experiences";
import { ChatWidget } from "@/components/messaging/ChatWidget";

export type ProductType = 'salida_propia' | 'operador_mayorista' | 'crucero' | 'paquete_individual' | 'experiencia_dia';
export type BookingActionType = 'buy_full' | 'deposit' | 'time_to_pay' | 'inquiry_manual' | 'cruise_quote';

interface ExperienceMarketplaceClientProps {
  initialCms?: any;
}

export default function ExperienceMarketplaceClient({ initialCms }: ExperienceMarketplaceClientProps) {
  const cmsData = initialCms || {};
  const [tours, setTours] = useState<any[]>([]);
  const [loadingTours, setLoadingTours] = useState(true);
  const [errorTours, setErrorTours] = useState<string | null>(null);

  // Tracking de Afiliados / Promotores
  const [affiliateRef, setAffiliateRef] = useState<string>("");
  const [affiliateCopied, setAffiliateCopied] = useState(false);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductType, setSelectedProductType] = useState<string>("all");
  const [selectedDestination, setSelectedDestination] = useState<string>("all");
  const [selectedTripType, setSelectedTripType] = useState<string>("all");
  const [selectedTransport, setSelectedTransport] = useState<string>("all");
  const [priceSortOrder, setPriceSortOrder] = useState<"none" | "asc" | "desc">("none");

  // Modal de Detalle Completo
  const [activeTourDetail, setActiveTourDetail] = useState<any | null>(null);
  const [modalActiveTab, setModalActiveTab] = useState<"summary" | "itinerary" | "stops" | "departures">("summary");

  // Modal de Reserva / Compra Adaptativa
  const [tourToReserve, setTourToReserve] = useState<any | null>(null);
  const [activeBookingAction, setActiveBookingAction] = useState<BookingActionType>('time_to_pay');

  // Estado del Formulario de Reserva
  const [passengerName, setPassengerName] = useState("");
  const [passengerEmail, setPassengerEmail] = useState("");
  const [passengerPhone, setPassengerPhone] = useState("");
  const [passengerDni, setPassengerDni] = useState("");
  const [passengerCount, setPassengerCount] = useState(1);
  const [selectedDepartureDate, setSelectedDepartureDate] = useState("");
  const [selectedRoomCategory, setSelectedRoomCategory] = useState("doble");
  const [selectedBoardingStop, setSelectedBoardingStop] = useState("");
  const [selectedCabinType, setSelectedCabinType] = useState("Balcon");
  const [inquiryNotes, setInquiryNotes] = useState("");
  const [isSubmittingRes, setIsSubmittingRes] = useState(false);
  const [resStatus, setResStatus] = useState<"idle" | "success" | "error">("idle");
  const [createdResCode, setCreatedResCode] = useState("");
  const [createdTtlInfo, setCreatedTtlInfo] = useState<any>(null);

  // Capturar código de afiliado desde la URL (?ref=... o ?afiliado=...)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref") || params.get("afiliado") || params.get("promotor");
      if (ref) {
        setAffiliateRef(ref);
        localStorage.setItem("travelapp_affiliate_ref", ref);
      } else {
        const stored = localStorage.getItem("travelapp_affiliate_ref");
        if (stored) setAffiliateRef(stored);
      }
    }
  }, []);

  // Cargar catálogo de viajes desde Firestore
  useEffect(() => {
    const unsubExp = onSnapshot(collection(db, "experiences"), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let pType: ProductType = data.productType || 'salida_propia';
        if (data.title?.toLowerCase().includes('crucero') || data.transportation?.toLowerCase().includes('barco')) {
          pType = 'crucero';
        } else if (data.operatorProvider || data.isMayorista) {
          pType = 'operador_mayorista';
        }
        list.push({ id: docSnap.id, ...data, productType: pType });
      });
      setTours(list);
      setErrorTours(null);
      setLoadingTours(false);
    }, (error) => {
      console.error("Error cargando catálogo:", error);
      setErrorTours(error.message || "Error de conexión o permisos en la base de datos.");
      setLoadingTours(false);
    });

    return () => unsubExp();
  }, []);

  // Extraer valores únicos de destinos
  const uniqueDestinations = useMemo(() => {
    return Array.from(new Set(tours.map((t) => (t.location || t.destination || "").split(",")[0].trim()).filter(Boolean)));
  }, [tours]);

  // Filtrado de Tours
  const filteredTours = useMemo(() => {
    let result = [...tours];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) =>
        t.title?.toLowerCase().includes(q) ||
        t.location?.toLowerCase().includes(q) ||
        t.destination?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      );
    }

    if (selectedProductType !== "all") {
      result = result.filter((t) => t.productType === selectedProductType);
    }

    if (selectedDestination !== "all") {
      result = result.filter((t) => (t.location || t.destination || "").includes(selectedDestination));
    }

    if (selectedTripType !== "all") {
      result = result.filter((t) => t.tripType === selectedTripType);
    }

    if (selectedTransport !== "all") {
      result = result.filter((t) => t.transportation?.toLowerCase().includes(selectedTransport.toLowerCase()));
    }

    if (priceSortOrder === "asc") {
      result.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (priceSortOrder === "desc") {
      result.sort((a, b) => (b.price || 0) - (a.price || 0));
    }

    return result;
  }, [tours, searchQuery, selectedProductType, selectedDestination, selectedTripType, selectedTransport, priceSortOrder]);

  const formatPrice = (value: number, currency: string = "ARS") => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency === "USD" ? "USD" : "ARS",
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  // Previsualización Time-to-Pay en el formulario
  const activeTtlPreview = useMemo(() => {
    if (!selectedDepartureDate) {
      return calculateTimeToPayDeadline(tourToReserve?.departureDate);
    }
    return calculateTimeToPayDeadline(selectedDepartureDate);
  }, [selectedDepartureDate, tourToReserve]);

  // Abrir Modal de Acción específico
  const handleOpenAction = (tour: any, action: BookingActionType) => {
    setTourToReserve(tour);
    setActiveBookingAction(action);
    setSelectedDepartureDate(tour.departureDate || "");
    setSelectedRoomCategory("doble");
    setSelectedBoardingStop(tour.boardingStops?.[0]?.place || "");
    setResStatus("idle");
  };

  // Procesar Reserva / Compra / Consulta
  const handleProcessBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tourToReserve) return;
    setIsSubmittingRes(true);
    setResStatus("idle");

    try {
      const depDate = selectedDepartureDate || tourToReserve.departureDate || new Date().toISOString().split('T')[0];
      const ttl = calculateTimeToPayDeadline(depDate);
      const resCode = `EXP-${Math.floor(100000 + Math.random() * 900000)}`;
      const unitPrice = tourToReserve.price || 0;
      const totalPrice = unitPrice * passengerCount;
      const currency = tourToReserve.currency || "ARS";
      const depositAmount = Math.round(totalPrice * 0.3); // Seña 30%

      let initialStatus = "Presupuestada";
      let paidNow = 0;

      if (activeBookingAction === 'buy_full') {
        initialStatus = "Confirmada";
        paidNow = totalPrice;
      } else if (activeBookingAction === 'deposit') {
        initialStatus = "Señada";
        paidNow = depositAmount;
      } else if (activeBookingAction === 'inquiry_manual' || activeBookingAction === 'cruise_quote') {
        initialStatus = "Consulta_Operador_Manual";
      }

      // 1. Guardar en experience_reservations con atribución de afiliado
      const resRef = await addDoc(collection(db, "experience_reservations"), {
        reservationCode: resCode,
        tourId: tourToReserve.id,
        tourTitle: tourToReserve.title,
        destination: tourToReserve.location || tourToReserve.destination || 'Argentina',
        productType: tourToReserve.productType || 'salida_propia',
        bookingMode: activeBookingAction,
        nombrePasajero: passengerName,
        passengerName: passengerName,
        emailPasajero: passengerEmail,
        passengerEmail: passengerEmail,
        telefonoPasajero: passengerPhone,
        passengerPhone: passengerPhone,
        dniPasajero: passengerDni,
        cantidadPersonas: passengerCount,
        quantity: passengerCount,
        departureDate: depDate,
        roomCategory: selectedRoomCategory,
        cabinType: selectedCabinType,
        boardingStop: selectedBoardingStop || 'Terminal Central',
        inquiryNotes,
        estado: initialStatus,
        expiresAt: ttl.deadlineIso,
        timeToPayPolicy: ttl.label,
        financials: {
          currency: currency,
          totalPrice: totalPrice,
          paidAmount: paidNow,
          pendingAmount: totalPrice - paidNow,
          depositAmount: depositAmount
        },
        affiliateRef: affiliateRef || null,
        promoterId: affiliateRef || null,
        createdAt: new Date().toISOString()
      });

      // 2. Sincronizar en contracted_trips para la App del Pasajero
      await addDoc(collection(db, "contracted_trips"), {
        reservationId: resRef.id,
        reservationCode: resCode,
        tripTitle: tourToReserve.title,
        destination: tourToReserve.location || tourToReserve.destination || 'Argentina',
        passengerName: passengerName,
        passengerEmail: passengerEmail,
        passengerPhone: passengerPhone,
        departureDate: depDate,
        status: initialStatus,
        productType: tourToReserve.productType || 'salida_propia',
        boardingStop: selectedBoardingStop || 'Terminal Central',
        roomCategory: selectedRoomCategory,
        itinerary: tourToReserve.itineraryDayByDay || [],
        coordinator: {
          name: "Coordinación Oficial TravelApp",
          phone: "+54 9 381 418-8106",
          status: "Asignado"
        },
        paxCount: passengerCount,
        payment: {
          totalAmount: totalPrice,
          paidAmount: paidNow,
          currency: currency
        },
        affiliateRef: affiliateRef || null,
        createdAt: new Date().toISOString()
      });

      setCreatedResCode(resCode);
      setCreatedTtlInfo(ttl);
      setResStatus("success");

      // Limpiar formulario
      setPassengerName("");
      setPassengerEmail("");
      setPassengerPhone("");
      setPassengerDni("");
      setPassengerCount(1);
      setInquiryNotes("");
    } catch (err: any) {
      console.error("Error creating reservation:", err);
      setResStatus("error");
    } finally {
      setIsSubmittingRes(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between">
      
      {/* 1. BARRA SUPERIOR MINIMALISTA Y LIMPIA (SUBPÁGINA) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/landing/experience"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition"
            >
              <ArrowLeft className="h-4 w-4 text-red-600" /> Volver a la Web
            </Link>
            <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 pl-3">
              <img src="/assets/experience_original.svg" alt="TravelApp Experiences" className="h-7 w-auto object-contain" />
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Catálogo Oficial 2026</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {affiliateRef && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> Asesor: {affiliateRef}
              </div>
            )}
            <span className="text-xs font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {filteredTours.length} {filteredTours.length === 1 ? 'Viaje Disponible' : 'Viajes Disponibles'}
            </span>
          </div>
        </div>
      </header>

      {/* 2. BARRA DE FILTROS Y CATEGORÍAS HORIZONTAL LIMPIA */}
      <section className="bg-white border-b border-slate-200 py-4 px-4 sm:px-6 shadow-sm">
        <div className="max-w-7xl mx-auto space-y-4">
          
          {/* Chips de Categorías */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-black">
            {[
              { id: 'all', label: '🌟 Todos los Viajes' },
              { id: 'salida_propia', label: '🚍 Salidas Propias' },
              { id: 'operador_mayorista', label: '🌍 Circuitos de Operador' },
              { id: 'crucero', label: '🚢 Cruceros' },
              { id: 'experiencia_dia', label: '🎒 Aventuras de 1 Día' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedProductType(tab.id)}
                className={`px-4 py-2 rounded-2xl transition whitespace-nowrap ${
                  selectedProductType === tab.id
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Fila de Controles de Búsqueda y Filtros Rápidos */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
            
            {/* Buscador de Texto */}
            <div className="sm:col-span-5 relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar destino, hotel, crucero o excursión..."
                className="w-full pl-10 pr-8 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Selector de Destino */}
            <div className="sm:col-span-3">
              <select
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="w-full py-2.5 px-3 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-700 focus:outline-none focus:border-red-500"
              >
                <option value="all">Todos los Destinos</option>
                {uniqueDestinations.map((dest, i) => (
                  <option key={i} value={dest}>{dest}</option>
                ))}
              </select>
            </div>

            {/* Selector de Modalidad */}
            <div className="sm:col-span-2">
              <select
                value={selectedTripType}
                onChange={(e) => setSelectedTripType(e.target.value)}
                className="w-full py-2.5 px-3 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-700 focus:outline-none focus:border-red-500"
              >
                <option value="all">Modalidad</option>
                <option value="Grupal">Salida Grupal</option>
                <option value="Individual">Individual</option>
              </select>
            </div>

            {/* Selector de Orden */}
            <div className="sm:col-span-2">
              <select
                value={priceSortOrder}
                onChange={(e: any) => setPriceSortOrder(e.target.value)}
                className="w-full py-2.5 px-3 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-700 focus:outline-none focus:border-red-500"
              >
                <option value="none">Destacados</option>
                <option value="asc">Menor Tarifa</option>
                <option value="desc">Mayor Tarifa</option>
              </select>
            </div>

          </div>

        </div>
      </section>

      {/* 3. GRILLA FULL-WIDTH DE TARJETAS EN ALTA DEFINICIÓN */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {loadingTours ? (
          <div className="py-24 text-center space-y-3">
            <div className="h-10 w-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-slate-400">Cargando catálogo de viajes...</p>
          </div>
        ) : errorTours ? (
          <div className="py-20 text-center space-y-3 bg-red-50 rounded-3xl border border-red-200 p-8">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">No se pudo cargar el catálogo</h3>
            <p className="text-xs text-red-600">{errorTours}</p>
          </div>
        ) : filteredTours.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <Search className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">No se encontraron experiencias</h3>
            <p className="text-xs text-slate-500">Prueba con otros términos de búsqueda o elimina los filtros.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedProductType("all");
                setSelectedDestination("all");
                setSelectedTripType("all");
                setPriceSortOrder("none");
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-red-700 transition"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTours.map((tour) => {
              const isCruise = tour.productType === 'crucero';
              const isMayorista = tour.productType === 'operador_mayorista';
              const isPropia = tour.productType === 'salida_propia';
              const isExcursion = tour.productType === 'experiencia_dia';

              let durationText = tour.duration || `${tour.nightsCount || 4} Noches`;

              return (
                <div
                  key={tour.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                >
                  {/* Foto de Portada HD */}
                  <div className="relative h-56 bg-slate-100 overflow-hidden">
                    <img
                      src={tour.imageUrl || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"}
                      alt={tour.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Badges de Tipología */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                      {isPropia && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                          Salida Propia
                        </span>
                      )}
                      {isMayorista && (
                        <span className="px-2.5 py-1 rounded-full bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                          Circuito Mayorista
                        </span>
                      )}
                      {isCruise && (
                        <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                          <Ship className="h-3 w-3" /> Crucero
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cuerpo de la Tarjeta */}
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black text-red-600 uppercase tracking-widest block">
                        {tour.location || tour.destination} · {durationText}
                      </span>
                      <h3 className="text-sm font-black text-slate-900 leading-snug group-hover:text-red-600 transition-colors line-clamp-2">
                        {tour.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {tour.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase block">
                            {tour.pricingStructure === 'flat_single_price' ? 'Tarifa Única' : 'Desde'}
                          </span>
                          <span className="text-base font-black text-slate-900">
                            {formatPrice(tour.price, tour.currency)}
                          </span>
                        </div>
                        {tour.priceRewards && (
                          <div className="text-right">
                            <span className="text-[10px] text-red-600 font-black block">
                              Club Rewards: {formatPrice(tour.priceRewards, tour.currency)}
                            </span>
                            <span className="text-[9px] text-emerald-600 font-bold block">
                              +{tour.pointsEarned || 350} pts
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Botonera de Acción Adaptativa */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTourDetail(tour);
                            setModalActiveTab("summary");
                          }}
                          className="py-2 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition text-center"
                        >
                          Ver Detalle
                        </button>

                        {isPropia && (
                          <button
                            type="button"
                            onClick={() => handleOpenAction(tour, 'time_to_pay')}
                            className="py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition shadow-md shadow-red-600/20 text-center"
                          >
                            Reservar
                          </button>
                        )}

                        {isMayorista && (
                          <button
                            type="button"
                            onClick={() => handleOpenAction(tour, 'inquiry_manual')}
                            className="py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black transition shadow-md shadow-purple-600/20 text-center"
                          >
                            Consultar
                          </button>
                        )}

                        {isCruise && (
                          <button
                            type="button"
                            onClick={() => handleOpenAction(tour, 'cruise_quote')}
                            className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition shadow-md shadow-blue-600/20 text-center"
                          >
                            Cotizar
                          </button>
                        )}

                        {isExcursion && (
                          <button
                            type="button"
                            onClick={() => handleOpenAction(tour, 'buy_full')}
                            className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-md shadow-emerald-600/20 text-center"
                          >
                            Comprar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 4. MODAL DE DETALLE COMPLETO DEL VIAJE */}
      {activeTourDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95">
            
            {/* Header del Modal */}
            <div className="relative h-48 bg-slate-900 overflow-hidden flex-shrink-0">
              <img
                src={activeTourDetail.imageUrl || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"}
                alt={activeTourDetail.title}
                className="w-full h-full object-cover opacity-80"
              />
              <button
                type="button"
                onClick={() => setActiveTourDetail(null)}
                className="absolute top-4 right-4 h-9 w-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="absolute bottom-4 left-6 right-6 text-white space-y-1">
                <span className="text-[10px] font-black uppercase text-red-400 tracking-widest block">
                  {activeTourDetail.location || activeTourDetail.destination}
                </span>
                <h3 className="text-xl sm:text-2xl font-black leading-tight">
                  {activeTourDetail.title}
                </h3>
              </div>
            </div>

            {/* Pestañas del Modal */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-6 text-xs font-black uppercase tracking-wider overflow-x-auto">
              <button
                type="button"
                onClick={() => setModalActiveTab("summary")}
                className={`py-3 px-4 border-b-2 transition whitespace-nowrap ${
                  modalActiveTab === "summary" ? "border-red-600 text-red-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                📋 Resumen &amp; Tarifas
              </button>
              {activeTourDetail.itineraryDayByDay && activeTourDetail.itineraryDayByDay.length > 0 && (
                <button
                  type="button"
                  onClick={() => setModalActiveTab("itinerary")}
                  className={`py-3 px-4 border-b-2 transition whitespace-nowrap ${
                    modalActiveTab === "itinerary" ? "border-red-600 text-red-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  🗺️ Itinerario Día a Día
                </button>
              )}
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs leading-relaxed flex-1 text-slate-600">
              {modalActiveTab === "summary" && (
                <div className="space-y-6">
                  {/* Tarjetas de Tarifas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        {activeTourDetail.pricingStructure === 'flat_single_price' ? 'Tarifa Única por Pasajero' : 'Tarifa Base (Doble)'}
                      </span>
                      <span className="text-xl font-black text-slate-900 mt-1 block">
                        {formatPrice(activeTourDetail.price, activeTourDetail.currency)}
                      </span>
                    </div>
                    <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black text-red-700 uppercase tracking-wider block">Miembro Club Rewards</span>
                        <span className="text-xl font-black text-red-600 mt-1 block">
                          {formatPrice(activeTourDetail.priceRewards || activeTourDetail.price * 0.95, activeTourDetail.currency)}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-red-200 text-red-800 text-[10px] font-black">
                        +{activeTourDetail.pointsEarned || 350} pts
                      </span>
                    </div>
                  </div>

                  {/* Matriz por Habitación si existe */}
                  {activeTourDetail.roomPricing && Object.keys(activeTourDetail.roomPricing).length > 0 && activeTourDetail.pricingStructure !== 'flat_single_price' && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                      <span className="font-black text-slate-800 uppercase tracking-wider block text-[11px]">
                        🏨 Tarifario por Habitación ({activeTourDetail.currency}):
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {Object.entries(activeTourDetail.roomPricing).map(([room, price]) => (
                          <div key={room} className="bg-white p-2.5 rounded-xl border border-slate-200">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">{room}</span>
                            <span className="font-black text-slate-800 text-xs">{formatPrice(Number(price), activeTourDetail.currency)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <h4 className="font-black text-slate-900 uppercase tracking-wider">Descripción del Recorrido</h4>
                    <p className="whitespace-pre-line text-slate-600">{activeTourDetail.description}</p>
                  </div>

                  {activeTourDetail.services && activeTourDetail.services.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-black text-slate-900 uppercase tracking-wider">Servicios Incluidos</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activeTourDetail.services.map((srv: string, i: number) => (
                          <div key={i} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-emerald-600" />
                            <span className="font-bold text-slate-700">{srv}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {modalActiveTab === "itinerary" && (
                <div className="space-y-4">
                  {activeTourDetail.itineraryDayByDay?.map((day: any, idx: number) => (
                    <div key={idx} className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px] uppercase">
                          Día {day.dayNumber}
                        </span>
                        <span className="text-xs font-black text-slate-700">{day.title}</span>
                      </div>
                      <p className="text-slate-600">{day.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Modal con Botón de Reserva */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="font-black text-slate-900 text-sm">
                Total: {formatPrice(activeTourDetail.price, activeTourDetail.currency)}
              </span>
              <button
                type="button"
                onClick={() => {
                  const tour = activeTourDetail;
                  setActiveTourDetail(null);
                  handleOpenAction(tour, tour.productType === 'salida_propia' ? 'time_to_pay' : 'inquiry_manual');
                }}
                className="px-6 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition shadow-md shadow-red-600/30"
              >
                Continuar con la Reserva
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. MODAL FORMULARIO DE RESERVA / TIME-TO-PAY */}
      {tourToReserve && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto text-xs">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-red-600 tracking-wider block">
                  {activeBookingAction === 'buy_full' ? 'Compra 100% Online' :
                   activeBookingAction === 'deposit' ? 'Señar Viaje (30%)' :
                   activeBookingAction === 'cruise_quote' ? 'Cotización Oficial de Crucero' :
                   activeBookingAction === 'inquiry_manual' ? 'Solicitud de Disponibilidad' :
                   'Reserva Time-to-Pay'}
                </span>
                <h3 className="text-base font-black text-slate-900">{tourToReserve.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setTourToReserve(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {resStatus === "success" ? (
              <div className="space-y-4 py-4 text-center">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-black text-slate-900">¡Reserva Generada con Éxito!</h4>
                  <p className="text-slate-500 font-medium">Código de Expediente: <strong className="text-slate-900">{createdResCode}</strong></p>
                </div>
                {createdTtlInfo && (
                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-amber-900 space-y-1 text-left">
                    <span className="font-black block">⏰ Política Time-to-Pay Activada:</span>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Tu butaca está bloqueada. Tenés <strong>{createdTtlInfo.hours} horas</strong> para formalizar el pago antes de que se libere automáticamente el inventario.
                    </p>
                  </div>
                )}
                <div className="pt-2 flex gap-3">
                  <a
                    href={`https://wa.me/5493814188106?text=Hola!%20Acabo%20de%20reservar%20el%20viaje%20${encodeURIComponent(tourToReserve.title)}%20con%20codigo%20${createdResCode}${affiliateRef ? `%20(Asesor:%20${affiliateRef})` : ''}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-center transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30"
                  >
                    <MessageCircle className="h-4 w-4" /> Notificar por WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={() => setTourToReserve(null)}
                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleProcessBooking} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-slate-600 font-bold block">Nombre y Apellido del Titular</label>
                  <input
                    type="text"
                    required
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    placeholder="Ej: Marcos Vignola"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-600 font-bold block">DNI / Pasaporte</label>
                    <input
                      type="text"
                      required
                      value={passengerDni}
                      onChange={(e) => setPassengerDni(e.target.value)}
                      placeholder="Ej: 34567890"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-600 font-bold block">Teléfono WhatsApp</label>
                    <input
                      type="tel"
                      required
                      value={passengerPhone}
                      onChange={(e) => setPassengerPhone(e.target.value)}
                      placeholder="Ej: +5493815551234"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-600 font-bold block">Email de Confirmación</label>
                    <input
                      type="email"
                      required
                      value={passengerEmail}
                      onChange={(e) => setPassengerEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-600 font-bold block">Cantidad de Pasajeros</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      required
                      value={passengerCount}
                      onChange={(e) => setPassengerCount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                    />
                  </div>
                </div>

                {activeBookingAction === 'time_to_pay' && (
                  <div className="bg-amber-50 rounded-2xl p-3.5 border border-amber-200 text-amber-900 space-y-1">
                    <span className="font-black block flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-amber-700" /> Política Time-to-Pay: {activeTtlPreview.hours}hs para Señar
                    </span>
                    <p className="text-[11px] text-amber-700 leading-snug">
                      {activeTtlPreview.label}. Tu butaca queda bloqueada temporalmente sin necesidad de pagar ahora.
                    </p>
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    disabled={isSubmittingRes}
                    onClick={() => setTourToReserve(null)}
                    className="w-1/3 py-3 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRes}
                    className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black transition shadow-md shadow-red-600/30 flex items-center justify-center gap-2"
                  >
                    {isSubmittingRes ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      activeBookingAction === 'buy_full' ? 'Confirmar y Pagar 100%' :
                      activeBookingAction === 'deposit' ? 'Abonar Seña (30%)' :
                      activeBookingAction === 'cruise_quote' ? 'Solicitar Cotización' :
                      activeBookingAction === 'inquiry_manual' ? 'Enviar Solicitud' :
                      'Confirmar Reserva Time-to-Pay'
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Floating Web Chat Widget */}
      <ChatWidget />
    </div>
  );
}
