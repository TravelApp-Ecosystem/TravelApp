'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users, Bus, Hotel, Clock, ArrowLeft, Search, CheckCircle2,
  AlertTriangle, UserCheck, ShieldCheck, Printer, RefreshCw,
  Sparkles, MapPin, Calendar, ArrowRight, X, User, Layers,
  Sliders, Settings, Plus, Trash2, Edit3, Check
} from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, query, orderBy, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MasterTrip, ScheduledDeparture, getTimeRemainingInfo, BusDeckConfig } from '@/types/experiences';

interface ReservationItem {
  id: string;
  reservationCode: string;
  nombrePasajero: string;
  emailPasajero: string;
  telefonoPasajero: string;
  dniPasajero?: string;
  tourId: string;
  tourTitle: string;
  destination?: string;
  roomCategory?: string;
  cantidadPersonas: number;
  passengersList?: Array<{ fullName: string; dni: string; dietaryRestrictions?: string }>;
  estado: string;
  expiresAt?: string;
  timeToPayPolicy?: string;
  financials?: {
    totalPrice: number;
    paidAmount: number;
    balanceDue: number;
    currency: string;
  };
  seatNumbers?: number[];
  roomNumber?: string;
}

interface BusConfigState {
  decksCount: 1 | 2;
  preset: 'suite_26' | 'suite_32' | 'convencional_42' | 'mixto_50' | 'doble_piso_60' | 'custom';
  deck1Seats: number; // Planta Baja
  deck1Type: 'Cama' | 'SemiCama' | 'Suite_Premium';
  deck2Seats: number; // Planta Alta
  deck2Type: 'Cama' | 'SemiCama' | 'Suite_Premium';
  totalSeats: number;
}

export default function ExperienceSpotsPage() {
  const [activeTab, setActiveTab] = useState<'seats' | 'rooming' | 'ttl'>('seats');
  const [trips, setTrips] = useState<MasterTrip[]>([]);
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [selectedDepartureIdx, setSelectedDepartureIdx] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Modal de Configuración y Edición de Micro
  const [showBusConfigModal, setShowBusConfigModal] = useState<boolean>(false);
  const [busConfig, setBusConfig] = useState<BusConfigState>({
    decksCount: 2,
    preset: 'doble_piso_60',
    deck1Seats: 12,
    deck1Type: 'Cama',
    deck2Seats: 48,
    deck2Type: 'SemiCama',
    totalSeats: 60
  });

  // Seat Selection / Assignment Modal
  const [selectedSeatNumber, setSelectedSeatNumber] = useState<number | null>(null);
  const [assigningReservationId, setAssigningReservationId] = useState<string>('');

  // 1. Sync master trips and reservations from Firestore
  useEffect(() => {
    const unsubTrips = onSnapshot(collection(db, 'experiences'), (snap) => {
      const list: MasterTrip[] = [];
      snap.forEach(d => {
        const data = d.data();
        list.push({ id: d.id, ...data } as MasterTrip);
      });
      setTrips(list);
      if (!selectedTripId && list.length > 0) {
        setSelectedTripId(list[0].id);
      }
    });

    const q = query(collection(db, 'experience_reservations'), orderBy('createdAt', 'desc'));
    const unsubRes = onSnapshot(q, (snap) => {
      const list: ReservationItem[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() } as ReservationItem);
      });
      setReservations(list);
      setLoading(false);
    });

    return () => {
      unsubTrips();
      unsubRes();
    };
  }, []);

  const selectedTrip = trips.find(t => t.id === selectedTripId) || trips[0];
  const departures = selectedTrip?.scheduledDepartures || [
    {
      id: 'dep-1',
      departureDate: selectedTrip?.departureDate || '2026-10-12',
      returnDate: '2026-10-18',
      status: 'Abierta' as any,
      totalSeats: busConfig.totalSeats,
      availableSeats: busConfig.totalSeats - 8,
      rooming: {
        single: { totalBlocked: 4, occupied: 1, available: 3 },
        doble: { totalBlocked: 15, occupied: 2, available: 13 },
        triple: { totalBlocked: 4, occupied: 0, available: 4 },
        cuadruple: { totalBlocked: 2, occupied: 0, available: 2 }
      },
      coordinator: { name: 'Marcos Vignola', phone: '+5493815556667' },
      transportProvider: 'Flecha Bus Chárter'
    }
  ];

  const currentDeparture = departures[selectedDepartureIdx] || departures[0];

  // Filter reservations for the active trip
  const tripReservations = reservations.filter(r => r.tourId === selectedTrip?.id || r.tourTitle === selectedTrip?.title);

  // Total Capacity Calculations
  const totalBusSeats = busConfig.totalSeats;
  const confirmedReservations = tripReservations.filter(r => r.estado === 'Confirmada');
  const depositReservations = tripReservations.filter(r => r.estado === 'Señada');
  const ttlReservations = tripReservations.filter(r => r.estado === 'Presupuestada' && r.expiresAt);

  const confirmedSeatsCount = confirmedReservations.reduce((s, r) => s + r.cantidadPersonas, 0);
  const depositSeatsCount = depositReservations.reduce((s, r) => s + r.cantidadPersonas, 0);
  const ttlSeatsCount = ttlReservations.reduce((s, r) => s + r.cantidadPersonas, 0);

  const totalOccupiedSeats = confirmedSeatsCount + depositSeatsCount;
  const freeSeatsCount = Math.max(0, totalBusSeats - totalOccupiedSeats - ttlSeatsCount);

  // Presets selector handler
  const applyBusPreset = (preset: BusConfigState['preset']) => {
    if (preset === 'suite_26') {
      setBusConfig({
        decksCount: 1,
        preset,
        deck1Seats: 26,
        deck1Type: 'Suite_Premium',
        deck2Seats: 0,
        deck2Type: 'SemiCama',
        totalSeats: 26
      });
    } else if (preset === 'suite_32') {
      setBusConfig({
        decksCount: 1,
        preset,
        deck1Seats: 32,
        deck1Type: 'Cama',
        deck2Seats: 0,
        deck2Type: 'SemiCama',
        totalSeats: 32
      });
    } else if (preset === 'convencional_42') {
      setBusConfig({
        decksCount: 1,
        preset,
        deck1Seats: 42,
        deck1Type: 'SemiCama',
        deck2Seats: 0,
        deck2Type: 'SemiCama',
        totalSeats: 42
      });
    } else if (preset === 'mixto_50') {
      setBusConfig({
        decksCount: 2,
        preset,
        deck1Seats: 12,
        deck1Type: 'Cama',
        deck2Seats: 38,
        deck2Type: 'SemiCama',
        totalSeats: 50
      });
    } else if (preset === 'doble_piso_60') {
      setBusConfig({
        decksCount: 2,
        preset,
        deck1Seats: 12,
        deck1Type: 'Cama',
        deck2Seats: 48,
        deck2Type: 'SemiCama',
        totalSeats: 60
      });
    } else {
      setBusConfig(prev => ({ ...prev, preset: 'custom' }));
    }
  };

  // Recalcular total de butacas al editar campos personalizados
  const updateCustomSeats = (field: 'decksCount' | 'deck1Seats' | 'deck2Seats' | 'deck1Type' | 'deck2Type', value: any) => {
    setBusConfig(prev => {
      const updated = { ...prev, preset: 'custom' as const, [field]: value };
      const d1 = Number(updated.deck1Seats) || 0;
      const d2 = updated.decksCount === 2 ? (Number(updated.deck2Seats) || 0) : 0;
      updated.totalSeats = d1 + d2;
      return updated;
    });
  };

  // Generar listas de asientos para Deck 1 y Deck 2
  const deck1SeatsList = useMemo(() => {
    return Array.from({ length: busConfig.deck1Seats }, (_, i) => i + 1);
  }, [busConfig.deck1Seats]);

  const deck2SeatsList = useMemo(() => {
    if (busConfig.decksCount === 1) return [];
    return Array.from({ length: busConfig.deck2Seats }, (_, i) => busConfig.deck1Seats + i + 1);
  }, [busConfig.decksCount, busConfig.deck1Seats, busConfig.deck2Seats]);

  // Passenger Assignment by Seat Number
  const getSeatPassengerInfo = (seatNum: number) => {
    // 1. Check if an explicit reservation has assigned this seat in seatNumbers array
    const explicitRes = tripReservations.find(r => r.seatNumbers && r.seatNumbers.includes(seatNum));
    if (explicitRes) {
      return {
        assigned: true,
        passengerName: explicitRes.nombrePasajero,
        dni: explicitRes.dniPasajero,
        phone: explicitRes.telefonoPasajero,
        reservationId: explicitRes.id,
        reservationCode: explicitRes.reservationCode || explicitRes.id,
        status: explicitRes.estado,
        expiresAt: explicitRes.expiresAt,
        isTTL: explicitRes.estado === 'Presupuestada' && !!explicitRes.expiresAt
      };
    }

    // 2. Mock auto-allocation for visualization
    let currentCount = 0;
    for (const res of tripReservations) {
      if (res.estado === 'Cancelada') continue;
      const count = res.cantidadPersonas;
      if (seatNum > currentCount && seatNum <= currentCount + count) {
        const pIndex = seatNum - currentCount - 1;
        const paxName = res.passengersList && res.passengersList[pIndex]
          ? res.passengersList[pIndex].fullName
          : `${res.nombrePasajero} (Pax #${pIndex + 1})`;
        return {
          assigned: true,
          passengerName: paxName,
          dni: res.dniPasajero,
          phone: res.telefonoPasajero,
          reservationId: res.id,
          reservationCode: res.reservationCode || res.id,
          status: res.estado,
          expiresAt: res.expiresAt,
          isTTL: res.estado === 'Presupuestada' && !!res.expiresAt
        };
      }
      currentCount += count;
    }
    return { assigned: false };
  };

  // Asignar o liberar butaca
  const handleAssignSeatToReservation = async (reservationId: string, seatNum: number) => {
    try {
      const resDoc = doc(db, 'experience_reservations', reservationId);
      const resItem = tripReservations.find(r => r.id === reservationId);
      const currentSeats = resItem?.seatNumbers || [];
      const updatedSeats = Array.from(new Set([...currentSeats, seatNum]));
      await updateDoc(resDoc, { seatNumbers: updatedSeats });
      setSelectedSeatNumber(null);
      setAssigningReservationId('');
    } catch (err) {
      console.error('Error assigning seat:', err);
      alert('Error al asignar butaca.');
    }
  };

  const handleReleaseSeat = async (reservationId: string, seatNum: number) => {
    try {
      const resDoc = doc(db, 'experience_reservations', reservationId);
      const resItem = tripReservations.find(r => r.id === reservationId);
      const currentSeats = resItem?.seatNumbers || [];
      const updatedSeats = currentSeats.filter(s => s !== seatNum);
      await updateDoc(resDoc, { seatNumbers: updatedSeats });
      setSelectedSeatNumber(null);
    } catch (err) {
      console.error('Error releasing seat:', err);
    }
  };

  // Helper TTL
  const formatTTLBadge = (expiresAtStr?: string) => {
    if (!expiresAtStr) return null;
    const now = new Date().getTime();
    const exp = new Date(expiresAtStr).getTime();
    const diffMs = exp - now;
    if (diffMs <= 0) return { isExpired: true, text: 'Expirado', badge: 'bg-red-100 text-red-700' };
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { isExpired: false, text: `${hours}h ${mins}m restantes`, badge: 'bg-amber-100 text-amber-800' };
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-6">
      {/* HEADER SUPERIOR */}
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/experiences"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Control de Inventario &amp; Stock
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2 mt-0.5">
              <Bus className="h-7 w-7 text-tech-blue" />
              Gestión de Butacas, Rooming &amp; Time-to-Pay
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowBusConfigModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-black hover:bg-purple-700 transition flex items-center gap-1.5 shadow-md shadow-purple-600/20"
          >
            <Settings className="h-4 w-4" /> Configurar Micro ({busConfig.totalSeats} Butacas)
          </button>
          <Link
            href="/experiences/inventory"
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition shadow-sm"
          >
            Fichas Maestras
          </Link>
          <Link
            href="/experiences/reservations"
            className="px-4 py-2 bg-tech-blue text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-md shadow-tech-blue/20"
          >
            Gestión de Reservas
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* SELECTOR DE EXPERIENCIA & FECHA DE SALIDA */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 flex-1 min-w-[280px]">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Experiencia Activa</span>
              <select
                value={selectedTripId}
                onChange={e => {
                  setSelectedTripId(e.target.value);
                  setSelectedDepartureIdx(0);
                }}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-black text-slate-800 focus:bg-white"
              >
                {trips.map(t => (
                  <option key={t.id} value={t.id}>{t.title} ({t.destination})</option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Fecha de Salida Programada</span>
              <select
                value={selectedDepartureIdx}
                onChange={e => setSelectedDepartureIdx(Number(e.target.value))}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-tech-blue focus:bg-white"
              >
                {departures.map((d, i) => (
                  <option key={d.id || i} value={i}>
                    Salida: {d.departureDate} al {d.returnDate} ({d.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[10px] font-bold block">TIPO DE MICRO:</span>
              <span className="font-bold text-purple-800">
                {busConfig.decksCount === 2 ? `2 Pisos (Doble Deck · ${busConfig.totalSeats} Pax)` : `1 Piso (Planta Única · ${busConfig.totalSeats} Pax)`}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[10px] font-bold block">TRANSPORTISTA:</span>
              <span className="font-bold text-slate-800">{currentDeparture?.transportProvider || 'Flecha Bus Chárter'}</span>
            </div>
          </div>
        </div>

        {/* METRICAS DE STOCK SUPERIORES */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <span className="text-[10px] text-slate-400 font-bold block">CAPACIDAD TOTAL</span>
            <span className="text-2xl font-black text-slate-800">{totalBusSeats} Butacas</span>
          </div>

          <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-4 shadow-sm">
            <span className="text-[10px] text-emerald-700 font-bold block">CONFIRMADAS / SEÑADAS</span>
            <span className="text-2xl font-black text-emerald-800">{totalOccupiedSeats} Ocupadas</span>
          </div>

          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 shadow-sm">
            <span className="text-[10px] text-amber-700 font-bold block">EN ESPERA DE PAGO (TTL)</span>
            <span className="text-2xl font-black text-amber-800">{ttlSeatsCount} Retenidas</span>
          </div>

          <div className="bg-blue-50 rounded-2xl border border-blue-200 p-4 shadow-sm">
            <span className="text-[10px] text-blue-700 font-bold block">BUTACAS LIBRES</span>
            <span className="text-2xl font-black text-blue-800">{freeSeatsCount} Disponibles</span>
          </div>
        </div>

        {/* TABS PRINCIPALES */}
        <div className="flex bg-white p-2 rounded-2xl border border-slate-200 shadow-sm text-xs font-bold gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('seats')}
            className={`flex items-center gap-2 py-2.5 px-5 rounded-xl transition ${
              activeTab === 'seats'
                ? 'bg-tech-blue text-white shadow-md shadow-tech-blue/20'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Bus className="h-4 w-4" /> Mapa de Butacas del Bus ({busConfig.totalSeats} Asientos)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rooming')}
            className={`flex items-center gap-2 py-2.5 px-5 rounded-xl transition ${
              activeTab === 'rooming'
                ? 'bg-tech-blue text-white shadow-md shadow-tech-blue/20'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Hotel className="h-4 w-4" /> Rooming List Hotelera
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ttl')}
            className={`flex items-center gap-2 py-2.5 px-5 rounded-xl transition ${
              activeTab === 'ttl'
                ? 'bg-tech-blue text-white shadow-md shadow-tech-blue/20'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Clock className="h-4 w-4" /> Monitor Time-to-Pay (Auto-Release)
          </button>
        </div>

        {/* TAB 1: MAPA VISUAL DE BUTACAS ADAPTATIVO (1 O 2 PISOS) */}
        {activeTab === 'seats' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex flex-wrap justify-between items-center border-b border-slate-100 pb-4 gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Bus className="h-5 w-5 text-tech-blue" />
                  Distribución de Asientos ({busConfig.decksCount === 2 ? 'Micro de 2 Pisos' : 'Micro de 1 Piso'} · {totalBusSeats} Butacas)
                </h3>
                <p className="text-xs text-slate-400">
                  Hacé click en cualquier butaca para asignar o reasignar pasajeros, ver comprobante o estado Time-to-Pay.
                </p>
              </div>

              {/* Referencias de Color & Tipologías */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold">
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-500 inline-block"></span> Confirmado</span>
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-amber-400 inline-block"></span> En Espera (TTL)</span>
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-white border border-slate-300 inline-block"></span> Libre</span>
                <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px]">P. Baja: {busConfig.deck1Type}</span>
                {busConfig.decksCount === 2 && (
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px]">P. Alta: {busConfig.deck2Type}</span>
                )}
              </div>
            </div>

            {/* GRID DE PISOS (1 O 2 PISOS) */}
            <div className={`grid grid-cols-1 ${busConfig.decksCount === 2 ? 'lg:grid-cols-2' : 'max-w-2xl mx-auto'} gap-6`}>
              
              {/* PLANTA BAJA (O PLANTA ÚNICA) */}
              <div className="bg-slate-100/80 p-6 rounded-3xl border border-slate-300 shadow-inner space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-black text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-purple-600" />
                    {busConfig.decksCount === 2 ? 'Planta Baja (Deck 1)' : 'Planta Única'}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    {busConfig.deck1Seats} Asientos ({busConfig.deck1Type})
                  </span>
                </div>

                <div className="text-center font-black text-[10px] text-slate-400 uppercase tracking-widest bg-white/70 py-1.5 rounded-xl border border-slate-200">
                  🚍 FRENTE · CABINA CHOFER &amp; GUÍA
                </div>

                <div className="grid grid-cols-4 gap-2.5">
                  {deck1SeatsList.map(seatNum => {
                    const info = getSeatPassengerInfo(seatNum);
                    const isAssigned = info.assigned;
                    const isTTL = info.isTTL;

                    return (
                      <button
                        key={seatNum}
                        type="button"
                        onClick={() => setSelectedSeatNumber(seatNum)}
                        className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center relative shadow-sm hover:scale-105 duration-150 ${
                          isAssigned
                            ? isTTL
                              ? 'bg-amber-100 border-amber-300 text-amber-900 ring-1 ring-amber-400'
                              : 'bg-emerald-600 border-emerald-700 text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-tech-blue hover:bg-blue-50'
                        }`}
                      >
                        <span className="text-xs font-black">#{seatNum}</span>
                        <span className="text-[9px] truncate max-w-[70px] font-medium mt-0.5">
                          {isAssigned ? info.passengerName?.split(' ')[0] : 'Libre'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="text-center font-bold text-[10px] text-slate-400 uppercase tracking-widest bg-white/70 py-1 rounded-xl border border-slate-200">
                  🚻 BAÑO &amp; MINIBAR TRASERO
                </div>
              </div>

              {/* PLANTA ALTA (SOLO SI TIENE 2 PISOS) */}
              {busConfig.decksCount === 2 && (
                <div className="bg-slate-100/80 p-6 rounded-3xl border border-slate-300 shadow-inner space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-black text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-blue-600" />
                      Planta Alta (Deck 2)
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {busConfig.deck2Seats} Asientos ({busConfig.deck2Type})
                    </span>
                  </div>

                  <div className="text-center font-black text-[10px] text-blue-700 uppercase tracking-widest bg-blue-50 py-1.5 rounded-xl border border-blue-200">
                    🌟 FRENTE PANORÁMICO (VISTA SUPERIOR)
                  </div>

                  <div className="grid grid-cols-4 gap-2.5">
                    {deck2SeatsList.map(seatNum => {
                      const info = getSeatPassengerInfo(seatNum);
                      const isAssigned = info.assigned;
                      const isTTL = info.isTTL;

                      return (
                        <button
                          key={seatNum}
                          type="button"
                          onClick={() => setSelectedSeatNumber(seatNum)}
                          className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center relative shadow-sm hover:scale-105 duration-150 ${
                            isAssigned
                              ? isTTL
                                ? 'bg-amber-100 border-amber-300 text-amber-900 ring-1 ring-amber-400'
                                : 'bg-emerald-600 border-emerald-700 text-white'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-tech-blue hover:bg-blue-50'
                          }`}
                        >
                          <span className="text-xs font-black">#{seatNum}</span>
                          <span className="text-[9px] truncate max-w-[70px] font-medium mt-0.5">
                            {isAssigned ? info.passengerName?.split(' ')[0] : 'Libre'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="text-center font-bold text-[10px] text-slate-400 uppercase tracking-widest bg-white/70 py-1 rounded-xl border border-slate-200">
                    🪜 ESCALERA DE ACCESO &amp; SALIDA DE EMERGENCIA
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* TAB 2: ROOMING LIST HOTELERA */}
        {activeTab === 'rooming' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Hotel className="h-5 w-5 text-indigo-600" />
                  Rooming List Oficial ({selectedTrip?.hotelName || 'Hotel Alejandro I'})
                </h3>
                <p className="text-xs text-slate-400">
                  Planilla de distribución de habitaciones con régimen de comidas lista para remitir al hotel.
                </p>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="h-4 w-4" /> Imprimir Rooming List
              </button>
            </div>

            {/* TABLA DE ROOMING */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Habitación</th>
                    <th className="p-3.5">Tipología</th>
                    <th className="p-3.5">Huéspedes Asignados</th>
                    <th className="p-3.5">Régimen</th>
                    <th className="p-3.5">Observaciones / Dieta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {tripReservations.filter(r => r.estado !== 'Cancelada').map((res, idx) => (
                    <tr key={res.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold text-slate-800">
                        Hab. {101 + idx}
                      </td>
                      <td className="p-3.5 capitalize font-bold text-indigo-700">
                        {res.roomCategory || 'Doble'}
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">
                        {res.passengersList && res.passengersList.length > 0
                          ? res.passengersList.map(p => p.fullName).join(' + ')
                          : res.nombrePasajero}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {selectedTrip?.foodPlan?.replace('_', ' ') || 'Media Pensión'}
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {res.passengersList?.map(p => p.dietaryRestrictions).filter(Boolean).join(', ') || 'Estándar'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: MONITOR TIME-TO-PAY (AUTO-RELEASE) */}
        {activeTab === 'ttl' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  Monitor de Reservas en Espera de Pago (Time-to-Pay)
                </h3>
                <p className="text-xs text-slate-400">
                  Control de reservas que vencen automáticamente si no registran pago antes del límite fijado.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {reservations.filter(r => r.expiresAt && r.estado !== 'Confirmada' && r.estado !== 'Cancelada').length === 0 ? (
                <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  No hay reservas temporales pendientes de pago.
                </div>
              ) : (
                reservations
                  .filter(r => r.expiresAt && r.estado !== 'Confirmada' && r.estado !== 'Cancelada')
                  .map(res => {
                    const ttl = formatTTLBadge(res.expiresAt);
                    return (
                      <div
                        key={res.id}
                        className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-black text-slate-900">{res.nombrePasajero}</span>
                            <span className="font-mono text-[10px] text-slate-400 font-bold">{res.reservationCode || res.id}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ttl?.badge}`}>
                              {ttl?.text}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {res.tourTitle} · {res.cantidadPersonas} Pasajeros · Saldo: ${res.financials?.balanceDue?.toLocaleString()} {res.financials?.currency}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href="/experiences/reservations"
                            className="px-3 py-1.5 bg-tech-blue text-white rounded-xl text-xs font-bold hover:bg-blue-700"
                          >
                            Cobrar / Prorrogar
                          </Link>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL CONFIGURADOR DE MICRO (1 O 2 PISOS / BUTACAS) */}
      {/* ======================================================== */}
      {showBusConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-6 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Bus className="h-5 w-5 text-purple-600" />
                  Configurador de Micro &amp; Pisos
                </h3>
                <p className="text-xs text-slate-400">Elegí la tipología de bus o personalizá la cantidad de butacas por piso.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowBusConfigModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* PRESETS RÁPIDOS */}
            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">Plantillas / Presets de Micros Habituales:</label>
              <div className="grid grid-cols-2 gap-2 font-medium">
                {[
                  { key: 'suite_26', label: 'Suite Ejecutiva', sub: '1 Piso · 26 Asientos Cama VIP' },
                  { key: 'suite_32', label: 'Suite Cama', sub: '1 Piso · 32 Asientos Cama' },
                  { key: 'convencional_42', label: 'Convencional Turismo', sub: '1 Piso · 42 SemiCama' },
                  { key: 'mixto_50', label: 'Mixto Doble Piso', sub: '2 Pisos · 12 Cama + 38 SemiCama' },
                  { key: 'doble_piso_60', label: 'Doble Piso 60', sub: '2 Pisos · 12 Cama + 48 SemiCama' },
                  { key: 'custom', label: 'Personalizado', sub: 'Elegir pisos y butacas a medida' }
                ].map(p => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => applyBusPreset(p.key as any)}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      busConfig.preset === p.key
                        ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold ring-1 ring-purple-500'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                    }`}
                  >
                    <span className="font-bold block text-xs">{p.label}</span>
                    <span className="text-[10px] text-slate-400 block">{p.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* SELECTOR DE PISOS & DISTRIBUCIÓN */}
            <div className="space-y-4 pt-2 border-t border-slate-100 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Cantidad de Pisos del Micro</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => updateCustomSeats('decksCount', 1)}
                    className={`flex-1 py-2 rounded-lg font-bold transition text-xs ${
                      busConfig.decksCount === 1 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    1 Piso (Planta Única)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateCustomSeats('decksCount', 2)}
                    className={`flex-1 py-2 rounded-lg font-bold transition text-xs ${
                      busConfig.decksCount === 2 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    2 Pisos (Doble Piso / Mix)
                  </button>
                </div>
              </div>

              {/* PLANTA BAJA */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-black text-slate-800 block text-xs">
                  {busConfig.decksCount === 2 ? 'Planta Baja (Deck 1)' : 'Planta Única'}:
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Cantidad de Asientos</span>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={busConfig.deck1Seats}
                      onChange={e => updateCustomSeats('deck1Seats', Number(e.target.value))}
                      className="w-full p-2 bg-white rounded-xl border border-slate-200 font-black text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Tipo de Butaca</span>
                    <select
                      value={busConfig.deck1Type}
                      onChange={e => updateCustomSeats('deck1Type', e.target.value)}
                      className="w-full p-2 bg-white rounded-xl border border-slate-200 font-bold text-slate-800"
                    >
                      <option value="Cama">Cama</option>
                      <option value="SemiCama">Semi Cama</option>
                      <option value="Suite_Premium">Suite Premium (Ejecutivo)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* PLANTA ALTA (SI TIENE 2 PISOS) */}
              {busConfig.decksCount === 2 && (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <span className="font-black text-slate-800 block text-xs">Planta Alta (Deck 2):</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Cantidad de Asientos</span>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={busConfig.deck2Seats}
                        onChange={e => updateCustomSeats('deck2Seats', Number(e.target.value))}
                        className="w-full p-2 bg-white rounded-xl border border-slate-200 font-black text-slate-800"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Tipo de Butaca</span>
                      <select
                        value={busConfig.deck2Type}
                        onChange={e => updateCustomSeats('deck2Type', e.target.value)}
                        className="w-full p-2 bg-white rounded-xl border border-slate-200 font-bold text-slate-800"
                      >
                        <option value="SemiCama">Semi Cama</option>
                        <option value="Cama">Cama</option>
                        <option value="Suite_Premium">Suite Premium</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* RESUMEN TOTAL DE BUTACAS */}
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex justify-between items-center text-xs">
                <span className="font-black text-purple-900">Total de Butacas Resultante:</span>
                <span className="text-base font-black text-purple-700">{busConfig.totalSeats} Butacas</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBusConfigModal(false)}
                className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => setShowBusConfigModal(false)}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-md"
              >
                Aplicar Configuración
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DETALLE & ASIGNACIÓN DE BUTACA */}
      {/* ======================================================== */}
      {selectedSeatNumber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Bus className="h-4 w-4 text-tech-blue" />
                Detalle de Butaca #{selectedSeatNumber}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedSeatNumber(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {(() => {
              const info = getSeatPassengerInfo(selectedSeatNumber);
              if (info.assigned) {
                return (
                  <div className="space-y-3 text-xs">
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Pasajero Asignado</span>
                      <div className="font-black text-slate-900 text-sm">{info.passengerName}</div>
                      {info.dni && <div className="text-slate-500 text-[11px]">DNI: {info.dni}</div>}
                      <div className="text-slate-500 font-mono text-[10px]">Expediente: {info.reservationCode}</div>
                      <div className="pt-1 flex items-center justify-between">
                        <span className="font-bold">Estado:</span>
                        <span className={`font-black ${info.isTTL ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {info.status}
                        </span>
                      </div>
                    </div>

                    {info.reservationId && (
                      <button
                        type="button"
                        onClick={() => handleReleaseSeat(info.reservationId!, selectedSeatNumber)}
                        className="w-full py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-xs font-bold transition"
                      >
                        Liberar Butaca #{selectedSeatNumber}
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div className="space-y-4 text-xs">
                  <div className="text-center py-4 space-y-1">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                    <p className="font-bold text-slate-800">Esta butaca está libre.</p>
                    <p className="text-slate-400 text-[11px]">Podés asignar un pasajero de la lista de reservas activas.</p>
                  </div>

                  {/* Asignar Reserva */}
                  {tripReservations.length > 0 && (
                    <div className="space-y-2">
                      <label className="font-bold text-slate-600 block">Asignar a Expediente:</label>
                      <select
                        value={assigningReservationId}
                        onChange={e => setAssigningReservationId(e.target.value)}
                        className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                      >
                        <option value="">Seleccionar Reserva / Pasajero...</option>
                        {tripReservations.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.nombrePasajero} ({r.cantidadPersonas} pax) - {r.reservationCode || r.id}
                          </option>
                        ))}
                      </select>

                      {assigningReservationId && (
                        <button
                          type="button"
                          onClick={() => handleAssignSeatToReservation(assigningReservationId, selectedSeatNumber)}
                          className="w-full py-2 bg-tech-blue text-white rounded-xl text-xs font-black hover:bg-blue-700 transition shadow-sm"
                        >
                          Confirmar Asignación de Butaca #{selectedSeatNumber}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedSeatNumber(null)}
                className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
