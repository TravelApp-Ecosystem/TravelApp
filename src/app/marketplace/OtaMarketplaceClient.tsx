"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search, Filter, X, Plane, Ship, Bus, MapPin, Calendar, Clock,
  Sparkles, CheckCircle2, Building2, Award, Heart, Share2, HelpCircle,
  Phone, MessageCircle, ChevronRight, ArrowRight, ShieldCheck, Tag,
  Utensils, Hotel, ArrowLeft, Send, Check
} from "lucide-react";
import { collection, onSnapshot, addDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OtaPackage, OtaPackageType, OtaProviderType } from "@/types/ota";
import { DEFAULT_OTA_PACKAGES } from "@/lib/mockOtaPackages";
import { OtaHeader } from "@/components/ota/OtaHeader";
import { OtaFooter } from "@/components/ota/OtaFooter";

interface OtaMarketplaceClientProps {
  initialCms?: any;
}

export default function OtaMarketplaceClient({ initialCms }: OtaMarketplaceClientProps) {
  const [packages, setPackages] = useState<OtaPackage[]>(DEFAULT_OTA_PACKAGES);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<"ARS" | "USD">("ARS");

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [selectedFoodPlan, setSelectedFoodPlan] = useState<string>("all");
  const [priceSort, setPriceSort] = useState<"none" | "asc" | "desc">("none");

  // Modal de Detalle / Cotización
  const [selectedPackage, setSelectedPackage] = useState<OtaPackage | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: "", email: "", phone: "", notes: "", passengersCount: 2 });
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [submittingLead, setSubmittingLead] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Escuchar paquetes desde Firestore (colección ota_packages), con fallback a DEFAULT_OTA_PACKAGES
  useEffect(() => {
    try {
      const q = query(collection(db, "ota_packages"), orderBy("createdAt", "desc"));
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as OtaPackage[];
            setPackages(list);
          } else {
            setPackages(DEFAULT_OTA_PACKAGES);
          }
          setLoading(false);
        },
        (error) => {
          console.warn("Firestore ota_packages no disponible o vacío, usando fallback:", error);
          setPackages(DEFAULT_OTA_PACKAGES);
          setLoading(false);
        }
      );
      return () => unsub();
    } catch {
      setPackages(DEFAULT_OTA_PACKAGES);
      setLoading(false);
    }
  }, []);

  // Filtrado reactivo
  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      // Texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = pkg.title.toLowerCase().includes(q);
        const matchDest = pkg.destination.toLowerCase().includes(q);
        const matchCountry = pkg.country.toLowerCase().includes(q);
        const matchOperator = pkg.operatorName?.toLowerCase().includes(q);
        if (!matchTitle && !matchDest && !matchCountry && !matchOperator) return false;
      }

      // Región
      if (selectedRegion !== "all" && pkg.region !== selectedRegion) return false;

      // Tipo de viaje
      if (selectedType !== "all" && pkg.type !== selectedType) return false;

      // Proveedor (Propio vs Mayorista)
      if (selectedProvider !== "all" && pkg.providerType !== selectedProvider) return false;

      // Régimen de comidas
      if (selectedFoodPlan !== "all" && pkg.foodPlan !== selectedFoodPlan) return false;

      return true;
    }).sort((a, b) => {
      if (priceSort === "asc") {
        const priceA = currency === "ARS" ? a.priceArs : a.priceUsd;
        const priceB = currency === "ARS" ? b.priceArs : b.priceUsd;
        return priceA - priceB;
      }
      if (priceSort === "desc") {
        const priceA = currency === "ARS" ? a.priceArs : a.priceUsd;
        const priceB = currency === "ARS" ? b.priceArs : b.priceUsd;
        return priceB - priceA;
      }
      return 0;
    });
  }, [packages, searchQuery, selectedRegion, selectedType, selectedProvider, selectedFoodPlan, priceSort, currency]);

  // Manejar consulta directa a CRM (Concorde 360)
  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage || !leadForm.name || !leadForm.phone) return;

    setSubmittingLead(true);
    try {
      // Enviar a la colección de leads de Concorde 360
      await addDoc(collection(db, "leads"), {
        name: leadForm.name,
        email: leadForm.email || "",
        phone: leadForm.phone,
        notes: `Interesado en OTA: ${selectedPackage.title} (${selectedPackage.operatorName || 'OTA'}). Pasajeros: ${leadForm.passengersCount}. Comentarios: ${leadForm.notes}`,
        destination: selectedPackage.destination,
        packageId: selectedPackage.id,
        businessUnit: "OTA",
        source: "Marketplace OTA Web",
        status: "Nuevos",
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
      });
      setLeadSubmitted(true);
    } catch (err) {
      console.error("Error al enviar lead al CRM:", err);
      // Fallback amigable
      setLeadSubmitted(true);
    } finally {
      setSubmittingLead(false);
    }
  };

  const handleShare = (pkg: OtaPackage) => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/marketplace?pkg=${pkg.id}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header institucional OTA */}
      <OtaHeader />

      {/* Hero Portada del Marketplace OTA */}
      <section className="relative pt-28 pb-16 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FF7A00]/20 text-[#FF7A00] border border-[#FF7A00]/30 mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              TRAVELMARKET · TURISMO EMISIVO OFICIAL
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Paquetes Turísticos, Salidas & Operadores Mayoristas
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300">
              Explorá viajes nacionales e internacionales con vuelos, hotelería y traslados garantizados.
              Salidas acompañadas exclusivas y alianzas con los mayores operadores turísticos de Argentina y el mundo.
            </p>
          </div>

          {/* Barra de Búsqueda Rápida */}
          <div className="mt-8 max-w-4xl mx-auto bg-white p-3 rounded-2xl shadow-xl border border-slate-200 text-slate-800">
            <div className="flex flex-col md:flex-row items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl w-full">
                <Search className="h-5 w-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="¿A dónde querés viajar? (ej. Cancún, Bariloche, Europa, Brasil...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none text-sm font-semibold outline-none w-full placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Selector de Región Rápido */}
              <div className="flex items-center gap-1.5 w-full md:w-auto">
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-3 py-3 outline-none cursor-pointer w-full md:w-auto"
                >
                  <option value="all">Todas las Regiones</option>
                  <option value="Nacional">Destinos Nacionales</option>
                  <option value="Internacional">Destinos Internacionales</option>
                </select>

                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-3 py-3 outline-none cursor-pointer w-full md:w-auto"
                >
                  <option value="all">Todos los Viajes</option>
                  <option value="paquete">Paquetes Completos</option>
                  <option value="salida_grupal">Salidas Grupales</option>
                  <option value="crucero">Cruceros</option>
                  <option value="escapada">Escapadas</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contenido Principal con Filtros y Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {/* Filtros avanzados en pills */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mr-2">
              <Filter className="h-3.5 w-3.5" /> Filtrar:
            </span>

            {/* Pill: Operador (Propio vs Mayorista) */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                onClick={() => setSelectedProvider("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedProvider === "all" ? "bg-white text-tech-blue shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Todos los Proveedores
              </button>
              <button
                onClick={() => setSelectedProvider("propio")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedProvider === "propio" ? "bg-white text-[#FF7A00] shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                ⭐ Salidas Propias
              </button>
              <button
                onClick={() => setSelectedProvider("mayorista")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedProvider === "mayorista" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                🏢 Mayoristas Asociados
              </button>
            </div>

            {/* Pill: Régimen */}
            <select
              value={selectedFoodPlan}
              onChange={(e) => setSelectedFoodPlan(e.target.value)}
              className="bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-xl px-3 py-2 outline-none cursor-pointer shadow-xs"
            >
              <option value="all">Cualquier Régimen</option>
              <option value="All Inclusive">All Inclusive</option>
              <option value="Media Pensión">Media Pensión</option>
              <option value="Desayuno">Con Desayuno</option>
            </select>
          </div>

          {/* Ordenar y contador */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">
              {filteredPackages.length} viaje{filteredPackages.length === 1 ? "" : "s"} disponible{filteredPackages.length === 1 ? "" : "s"}
            </span>

            <select
              value={priceSort}
              onChange={(e) => setPriceSort(e.target.value as any)}
              className="bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-3 py-2 outline-none cursor-pointer shadow-xs"
            >
              <option value="none">Destacados</option>
              <option value="asc">Precio: Menor a Mayor</option>
              <option value="desc">Precio: Mayor a Menor</option>
            </select>
          </div>
        </div>

        {/* Notificación de Copiado de Link */}
        {copiedLink && (
          <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-bounce">
            <Check className="h-4 w-4" /> Enlace copiado al portapapeles
          </div>
        )}

        {/* Grid de Paquetes OTA */}
        {filteredPackages.length === 0 ? (
          <div className="py-20 text-center">
            <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700">No encontramos viajes con esos filtros</h3>
            <p className="text-xs text-slate-400 mt-1">Probá cambiando los términos de búsqueda o limpiando los filtros.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedRegion("all");
                setSelectedType("all");
                setSelectedProvider("all");
                setSelectedFoodPlan("all");
              }}
              className="mt-4 px-4 py-2 bg-tech-blue text-white rounded-xl text-xs font-bold hover:bg-tech-blue/90"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPackages.map((pkg) => {
              const displayPrice = currency === "ARS" ? `$${pkg.priceArs.toLocaleString("es-AR")}` : `USD $${pkg.priceUsd.toLocaleString("en-US")}`;
              const isWholesale = pkg.providerType === "mayorista";

              return (
                <div
                  key={pkg.id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  {/* Imagen y Badges */}
                  <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                    <img
                      src={pkg.imageUrl}
                      alt={pkg.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Badge Principal */}
                    {pkg.badge && (
                      <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                        {pkg.badge}
                      </div>
                    )}

                    {/* Badge Operador */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg backdrop-blur-md shadow-sm ${
                        isWholesale 
                          ? "bg-blue-600/90 text-white" 
                          : "bg-[#FF7A00]/90 text-white"
                      }`}>
                        {isWholesale ? <Building2 className="h-3 w-3" /> : <Award className="h-3 w-3" />}
                        {pkg.operatorName || (isWholesale ? "Mayorista" : "TravelApp")}
                      </span>
                    </div>

                    {/* Botón Compartir */}
                    <button
                      onClick={() => handleShare(pkg)}
                      title="Copiar enlace"
                      className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/80 hover:bg-white text-slate-700 flex items-center justify-center transition-all shadow-md backdrop-blur-xs"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Cuerpo de la Card */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      {/* Destino y Duración */}
                      <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-2">
                        <span className="flex items-center gap-1 text-slate-600">
                          <MapPin className="h-3.5 w-3.5 text-[#FF7A00]" />
                          {pkg.destination}, {pkg.country}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {pkg.durationDays}D / {pkg.durationNights}N
                        </span>
                      </div>

                      {/* Título */}
                      <h3 className="text-lg font-black text-slate-900 leading-snug group-hover:text-tech-blue transition-colors line-clamp-2">
                        {pkg.title}
                      </h3>

                      {/* Descripción corta */}
                      <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {pkg.description}
                      </p>

                      {/* Puntos clave / comodidades */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-[11px] font-bold text-slate-600">
                        <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">
                          {pkg.transportType === "Aéreo" ? <Plane className="h-3 w-3 text-blue-500" /> : pkg.transportType === "Crucero" ? <Ship className="h-3 w-3 text-cyan-600" /> : <Bus className="h-3 w-3 text-amber-500" />}
                          {pkg.transportType} {pkg.airline ? `(${pkg.airline})` : ""}
                        </span>

                        <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">
                          <Utensils className="h-3 w-3 text-emerald-500" />
                          {pkg.foodPlan}
                        </span>

                        {pkg.hotelName && (
                          <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">
                            <Hotel className="h-3 w-3 text-purple-500" />
                            {pkg.hotelStars}★ {pkg.hotelName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Precios & Acciones */}
                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex items-end justify-between mb-3">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Tarifa por pasajero
                          </span>
                          <span className="text-2xl font-black text-slate-900 tracking-tight">
                            {displayPrice}
                          </span>
                          {pkg.installments && (
                            <span className="text-[10px] font-extrabold text-emerald-600 block">
                              💳 {pkg.installments}
                            </span>
                          )}
                        </div>

                        {pkg.rewardsPointsEarned && (
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                              <Sparkles className="h-3 w-3 text-amber-500" /> +{pkg.rewardsPointsEarned} pts Rewards
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Botones */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setSelectedPackage(pkg);
                            setModalOpen(true);
                            setLeadSubmitted(false);
                          }}
                          className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1 shadow-sm"
                        >
                          Ver Detalle
                        </button>

                        <a
                          href={`https://wa.me/5493812020050?text=${encodeURIComponent(`Hola TravelApp! Me interesa el viaje "${pkg.title}" (${pkg.id}). ¿Tienen disponibilidad y opciones de pago?`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1 shadow-sm"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal de Detalle & Cotización para CRM */}
      {modalOpen && selectedPackage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header con Foto */}
            <div className="relative h-64 w-full">
              <img
                src={selectedPackage.imageUrl}
                alt={selectedPackage.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 h-9 w-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition-all"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="absolute bottom-4 left-6 right-6 text-white">
                <span className="inline-block text-[11px] font-black uppercase tracking-wider bg-[#FF7A00] px-2.5 py-0.5 rounded-full mb-1">
                  {selectedPackage.operatorName || (selectedPackage.providerType === "mayorista" ? "Operador Mayorista" : "TravelApp")}
                </span>
                <h2 className="text-2xl font-black">{selectedPackage.title}</h2>
                <p className="text-xs text-slate-200">{selectedPackage.destination}, {selectedPackage.country} · {selectedPackage.durationDays} Días / {selectedPackage.durationNights} Noches</p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Información General */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Descripción del Viaje</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{selectedPackage.description}</p>
              </div>

              {/* Servicios Incluidos */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5">Servicios Incluidos</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedPackage.includedServices.map((srv, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{srv}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fechas y Salidas */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-bold text-slate-500 block">Salidas Programadas:</span>
                    <span className="font-extrabold text-slate-800">{selectedPackage.departureDates.join(" · ")}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block">Origen:</span>
                    <span className="font-extrabold text-slate-800">{selectedPackage.departureOrigin}</span>
                  </div>
                </div>
              </div>

              {/* Formulario de Cotización para CRM */}
              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-sm font-black text-slate-900 mb-1 flex items-center gap-2">
                  <Send className="h-4 w-4 text-[#FF7A00]" />
                  Solicitar Cotización Oficial / Reserva
                </h4>
                <p className="text-xs text-slate-400 mb-4">Un asesor comercial de TravelApp se comunicará para brindarte formas de pago y cupos.</p>

                {leadSubmitted ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                    <h5 className="text-sm font-black text-emerald-800">¡Consulta Recibida con Éxito!</h5>
                    <p className="text-xs text-emerald-700">Te asignamos un asesor que te contactará a la brevedad por WhatsApp o correo.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitLead} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Nombre Completo *</label>
                        <input
                          type="text"
                          required
                          value={leadForm.name}
                          onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                          placeholder="Tu nombre y apellido"
                          className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-tech-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">WhatsApp / Teléfono *</label>
                        <input
                          type="tel"
                          required
                          value={leadForm.phone}
                          onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                          placeholder="+54 9 ..."
                          className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-tech-blue"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Email</label>
                        <input
                          type="email"
                          value={leadForm.email}
                          onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                          placeholder="correo@ejemplo.com"
                          className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-tech-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Cantidad de Pasajeros</label>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={leadForm.passengersCount}
                          onChange={(e) => setLeadForm({ ...leadForm, passengersCount: parseInt(e.target.value) || 1 })}
                          className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-tech-blue"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingLead}
                      className="w-full py-3 rounded-xl bg-tech-blue hover:bg-tech-blue/90 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md disabled:opacity-50"
                    >
                      {submittingLead ? "Enviando Solicitud..." : "Enviar Solicitud a un Asesor"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer oficial */}
      <OtaFooter />
    </div>
  );
}
