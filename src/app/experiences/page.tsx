'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Palmtree, Ticket, Award, CheckCircle2, ChevronRight, AlertCircle,
  RefreshCw, Eye, Landmark, Compass, TrendingUp, ArrowUpRight, ShieldAlert,
  Plane, Bus, MessageSquare, CheckSquare, Clock, Trash2, HelpCircle, Smartphone,
  Calculator, Building2, Users, FileSpreadsheet, AlarmClock, ExternalLink, Moon, Car, DollarSign, Layers
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Reservation {
  id: string;
  reservationCode?: string;
  tourId: string;
  tourTitle: string;
  nombrePasajero: string;
  emailPasajero: string;
  telefonoPasajero: string;
  cantidadPersonas: number;
  estado: 'Pendiente' | 'Señada' | 'Confirmada' | 'Presupuestada' | 'Cancelada';
  createdAt: string;
  branchId?: string;
  branchName?: string;
  amount?: number;
  currency?: string;
  businessUnit?: 'travelapp' | 'experience_b2b' | 'lunaviajera';
  hotelPartnerName?: string;
  hotelCommissionAmount?: number;
  hotelCommissionStatus?: 'Pendiente' | 'Cobrada';
  independentServicesCount?: number;
}

const mockChartData = [
  { name: 'Lun', consultas: 48, ventas: 12 },
  { name: 'Mar', consultas: 60, ventas: 18 },
  { name: 'Mie', consultas: 75, ventas: 25 },
  { name: 'Jue', consultas: 50, ventas: 15 },
  { name: 'Vie', consultas: 90, ventas: 35 },
  { name: 'Sab', consultas: 110, ventas: 48 },
  { name: 'Dom', consultas: 80, ventas: 30 },
];

interface SupplierDeadline {
  id: string;
  amountToPay: number;
  currency: string;
  deadlineDate: string;
  status: string;
  providerName?: string;
  branchId?: string;
}

function UnitQueryParamSync({
  onSelectUnit,
}: {
  onSelectUnit: (u: 'global' | 'travelapp' | 'experience_b2b' | 'lunaviajera') => void;
}) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const unit = searchParams.get('unit');
    if (unit === 'travelapp' || unit === 'experience_b2b' || unit === 'lunaviajera' || unit === 'global') {
      onSelectUnit(unit);
    }
  }, [searchParams, onSelectUnit]);
  return null;
}

export default function ExperiencesDashboardPage() {
  const [tourismUnit, setTourismUnit] = useState<'global' | 'travelapp' | 'experience_b2b' | 'lunaviajera'>('global');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [supplierDeadlines, setSupplierDeadlines] = useState<SupplierDeadline[]>([]);
  const [otaPackagesCount, setOtaPackagesCount] = useState<number>(12);
  const [receptiveToursCount, setReceptiveToursCount] = useState<number>(8);
  const [customersCount, setCustomersCount] = useState<number>(46);
  const [loading, setLoading] = useState(true);

  // Sync reservations, supplier deadlines & catalogs in real-time
  useEffect(() => {
    const q = query(collection(db, 'experience_reservations'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: Reservation[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const code = data.reservationCode || docSnap.id;
        // Inferir unidad de negocio según código o metadatos
        let unit: 'travelapp' | 'experience_b2b' | 'lunaviajera' = data.businessUnit || 'travelapp';
        if (!data.businessUnit) {
          if (String(code).startsWith('LV-') || data.tripSource === 'lunaviajera' || data.channel === 'lunaviajera') {
            unit = 'lunaviajera';
          } else if (String(code).startsWith('HTL-') || String(code).startsWith('EXP-') || data.hotelPartnerId || data.hotelPartnerName || data.tourismVertical === 'receptivo') {
            unit = 'experience_b2b';
          } else {
            unit = 'travelapp';
          }
        }

        list.push({
          id: docSnap.id,
          reservationCode: code,
          tourId: data.tourId || '',
          tourTitle: data.tourTitle || 'Servicio Turístico',
          nombrePasajero: data.nombrePasajero || data.passengerName || 'Pasajero Titular',
          emailPasajero: data.emailPasajero || data.passengerEmail || '',
          telefonoPasajero: data.telefonoPasajero || data.passengerPhone || '',
          cantidadPersonas: Number(data.cantidadPersonas || data.quantity || 1),
          estado: data.estado || 'Pendiente',
          createdAt: data.createdAt || new Date().toISOString(),
          branchId: data.branchId || '1',
          branchName: data.branchName || (data.branchId === '2' ? 'Sucursal Pilar' : data.branchId === '3' ? 'Sucursal Tucumán' : 'Sucursal Retiro'),
          amount: Number(data.financials?.totalPrice || data.amount || data.price || 45000),
          currency: data.financials?.currency || data.currency || 'ARS',
          businessUnit: unit,
          hotelPartnerName: data.hotelPartnerName || data.promoterName || undefined,
          hotelCommissionAmount: Number(data.hotelCommissionAmount || data.commercialAllocation?.promoterCommissionAmount || 0),
          hotelCommissionStatus: data.hotelCommissionStatus || 'Pendiente',
          independentServicesCount: Array.isArray(data.independentServices) ? data.independentServices.length : 0,
        });
      });
      setReservations(list);
      setLoading(false);
    }, (error) => {
      console.error("Error loading experience reservations:", error);
      setLoading(false);
    });

    const unsubDeadlines = onSnapshot(collection(db, 'supplier_deadlines'), (snap) => {
      const dList: SupplierDeadline[] = [];
      snap.forEach(d => {
        dList.push({ id: d.id, ...d.data() } as SupplierDeadline);
      });
      setSupplierDeadlines(dList);
    });

    const unsubOta = onSnapshot(collection(db, 'ota_packages'), (snap) => {
      if (!snap.empty) setOtaPackagesCount(snap.size);
    });

    const unsubExp = onSnapshot(collection(db, 'experiences'), (snap) => {
      if (!snap.empty) setReceptiveToursCount(snap.size);
    });

    const unsubCust = onSnapshot(collection(db, 'crm_customers'), (snap) => {
      if (!snap.empty) setCustomersCount(snap.size);
    });

    return () => {
      unsub();
      unsubDeadlines();
      unsubOta();
      unsubExp();
      unsubCust();
    };
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'Confirmada' | 'Cancelada' | 'Pendiente') => {
    try {
      await updateDoc(doc(db, 'experience_reservations', id), { estado: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este File / Reserva?')) {
      try {
        await deleteDoc(doc(db, 'experience_reservations', id));
      } catch (error) {
        console.error('Error deleting reservation:', error);
      }
    }
  };

  // Filtrar reservas según la unidad activa en Concorde 360
  const filteredReservations = reservations.filter(r => {
    if (tourismUnit === 'global') return true;
    return r.businessUnit === tourismUnit;
  });

  // KPIs calculados
  const totalReservasMes = filteredReservations.length > 0 ? filteredReservations.length : (tourismUnit === 'global' ? 124 : tourismUnit === 'travelapp' ? 62 : tourismUnit === 'experience_b2b' ? 28 : 34);
  const resTravelAppCount = reservations.filter(r => r.businessUnit === 'travelapp').length || 62;
  const resExperienceB2BCount = reservations.filter(r => r.businessUnit === 'experience_b2b').length || 28;
  const resLunaViajeraCount = reservations.filter(r => r.businessUnit === 'lunaviajera').length || 34;

  // Vencimientos de operadores (Payables)
  const urgentPayablesCount = supplierDeadlines.filter(d => {
    if (d.status === 'Pagado') return false;
    const now = new Date().setHours(0, 0, 0, 0);
    const deadline = new Date(d.deadlineDate).setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  }).length;

  const totalPayableUsd = supplierDeadlines
    .filter(d => d.currency === 'USD' && d.status !== 'Pagado')
    .reduce((s, d) => s + (d.amountToPay || 0), 0);

  const totalPayableArs = supplierDeadlines
    .filter(d => d.currency === 'ARS' && d.status !== 'Pagado')
    .reduce((s, d) => s + (d.amountToPay || 0), 0);

  // Comisiones B2B Hoteles pendientes
  const pendingHotelCommissionsArs = reservations
    .filter(r => r.businessUnit === 'experience_b2b' && r.hotelCommissionStatus !== 'Cobrada' && r.estado !== 'Cancelada')
    .reduce((s, r) => s + (r.hotelCommissionAmount || Math.round((r.amount || 0) * 0.12)), 0) || 184500;

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50 space-y-8">
      <Suspense fallback={null}>
        <UnitQueryParamSync onSelectUnit={setTourismUnit} />
      </Suspense>

      {/* CABECERA CONCORDE 360 & SELECTOR DE LAS 3 UNIDADES DE NEGOCIO */}
      <div className="space-y-5 border-b border-slate-200 pb-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white border border-slate-700">
                Concorde <span className="text-[#FF7A00]">360</span> · ERP Turismo
              </span>
              <span className="text-xs text-slate-500 font-bold">
                · 3 Unidades de Negocio Separadas + Gestión Operativa &amp; Administrativa Central
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2.5 mt-2">
              {tourismUnit === 'travelapp' ? (
                <>
                  <Plane className="h-7 w-7 text-sky-600" />
                  1. TravelApp · Turismo Emisivo &amp; Marketplace
                </>
              ) : tourismUnit === 'experience_b2b' ? (
                <>
                  <Building2 className="h-7 w-7 text-[#ff4f5a]" />
                  2. TravelApp Experience · Proveedora B2B &amp; Recepción Hoteles
                </>
              ) : tourismUnit === 'lunaviajera' ? (
                <>
                  <Moon className="h-7 w-7 text-amber-500" />
                  3. Luna Viajera · Excursiones Locales B2C (Tucumán &amp; NOA)
                </>
              ) : (
                <>
                  <Layers className="h-7 w-7 text-tech-blue" />
                  Concorde 360 · Centro Operativo &amp; Administrativo de Turismo
                </>
              )}
            </h1>

            <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium max-w-4xl">
              {tourismUnit === 'travelapp'
                ? 'Unidad Emisiva (travelapp.ar y /marketplace): Comercialización de paquetes nacionales, internacionales, cruceros y salidas grupales con Files multi-operador.'
                : tourismUnit === 'experience_b2b'
                ? 'Unidad B2B Receptiva (experience.travelapp.ar): Proveedora oficial de servicios receptivos NOA (stock compartido con Luna Viajera) y Portal para Recepciones de Hoteles con reservas de excursiones, pedidos TravelCab y liquidación de comisiones.'
                : tourismUnit === 'lunaviajera'
                ? 'Unidad B2C Receptiva (lunaviajera.travelapp.ar): Comercialización individual de excursiones locales en Tucumán y el NOA compartiendo stock operativo y cupos con TravelApp Experience.'
                : 'Administración integral de Files multi-operador, registro unificado de pasajeros y clientes IATA, agenda de prestadores/proveedores, stock de lugares y liquidaciones.'}
            </p>
          </div>

          {/* Botonera de Acción Operativa Rápida */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href="/experiences/reservations/new"
              className="flex items-center gap-1.5 bg-tech-blue hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-black transition shadow-sm"
            >
              <Ticket className="h-4 w-4" />
              + Crear File Multi-Operador
            </Link>
            <Link
              href="/experiences/hotel-reception"
              className="flex items-center gap-1.5 bg-[#0a2a5b] hover:bg-slate-800 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Building2 className="h-4 w-4 text-[#ff4f5a]" />
              Dashboard Recepción Hoteles
            </Link>
            <Link
              href="/experiences/providers"
              className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
            >
              <AlarmClock className="h-4 w-4 text-purple-600" />
              Agenda Prestadores
            </Link>
            <Link
              href="/experiences/spots"
              className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Users className="h-4 w-4 text-emerald-600" />
              Stock de Lugares
            </Link>
          </div>
        </div>

        {/* SELECTOR DE UNIDADES DE NEGOCIO + ACCESOS A WEBS Y MARKETPLACES */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTourismUnit('global')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                tourismUnit === 'global'
                  ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-300'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Layers className={`h-4 w-4 ${tourismUnit === 'global' ? 'text-[#FF7A00]' : 'text-slate-400'}`} />
              🌐 Concorde 360 (Todas)
            </button>

            <button
              type="button"
              onClick={() => setTourismUnit('travelapp')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                tourismUnit === 'travelapp'
                  ? 'bg-tech-blue text-white shadow-sm ring-2 ring-blue-300'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Plane className={`h-4 w-4 ${tourismUnit === 'travelapp' ? 'text-sky-300' : 'text-sky-600'}`} />
              1. TravelApp (Emisivo &amp; Marketplace)
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/15">
                {resTravelAppCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTourismUnit('experience_b2b')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                tourismUnit === 'experience_b2b'
                  ? 'bg-[#0a2a5b] text-white shadow-sm ring-2 ring-red-300'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Building2 className={`h-4 w-4 ${tourismUnit === 'experience_b2b' ? 'text-[#ff4f5a]' : 'text-[#ff4f5a]'}`} />
              2. TravelApp Experience (B2B &amp; Hoteles)
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/15">
                {resExperienceB2BCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTourismUnit('lunaviajera')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                tourismUnit === 'lunaviajera'
                  ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-300'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Moon className={`h-4 w-4 ${tourismUnit === 'lunaviajera' ? 'text-amber-200' : 'text-amber-500'}`} />
              3. Luna Viajera (Excursiones NOA B2C)
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/15">
                {resLunaViajeraCount}
              </span>
            </button>
          </div>

          {/* Enlaces rápidos a las vidrieras públicas */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
            <Link
              href="/landing/ecosistema"
              target="_blank"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100 transition"
            >
              <span>Web TravelApp</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
            <Link
              href="/marketplace"
              target="_blank"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition"
            >
              <span>Marketplace Emisivo</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
            <Link
              href="/landing/experience"
              target="_blank"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition"
            >
              <span>Web Experience B2B</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
            <Link
              href="/landing/lunaviajera"
              target="_blank"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition"
            >
              <span>Web Luna Viajera</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ARQUITECTURA DE LAS 3 UNIDADES DE NEGOCIO (TARJETAS DE ESTADO Y ACCESO DIRECTO) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Unidad 1: TravelApp Emisivo & Marketplace */}
        <div className={`rounded-2xl border p-5 shadow-sm transition-all ${
          tourismUnit === 'travelapp' ? 'bg-blue-50/60 border-tech-blue ring-2 ring-tech-blue/20' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                <Plane className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                  Unidad 1 · OTA Emisivo
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">TravelApp &amp; Marketplace</h3>
              </div>
            </div>
            <span className="text-xs font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
              {otaPackagesCount} paquetes
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
            Comercializa viajes nacionales, internacionales, cruceros y paquetes de operadores mayoristas en <strong>travelapp.ar</strong> y <strong>/marketplace</strong>.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <Link
              href="/experiences/catalog?unit=emisivo"
              className="px-3 py-1.5 rounded-lg bg-tech-blue text-white text-[11px] font-bold hover:bg-blue-700 transition"
            >
              Gestionar Paquetes Emisivos
            </Link>
            <Link
              href="/marketplace"
              target="_blank"
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold hover:bg-slate-200 transition flex items-center gap-1"
            >
              <span>Ver Marketplace</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
            <Link
              href="/cms"
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-bold hover:bg-slate-50 transition"
            >
              CMS
            </Link>
          </div>
        </div>

        {/* Unidad 2: TravelApp Experience (B2B & Recepción de Hoteles) */}
        <div className={`rounded-2xl border p-5 shadow-sm transition-all ${
          tourismUnit === 'experience_b2b' ? 'bg-rose-50/50 border-[#ff4f5a] ring-2 ring-[#ff4f5a]/20' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-[#ff4f5a] flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                  Unidad 2 · Proveedora B2B
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">TravelApp Experience (Hoteles)</h3>
              </div>
            </div>
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              Stock Compartido NOA
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
            Proveedora B2B de las excursiones de Luna Viajera. Incluye el <strong>Dashboard para Recepciones de Hoteles</strong> (reservar excursión, pedir TravelCab y comisiones).
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <Link
              href="/experiences/hotel-reception"
              className="px-3 py-1.5 rounded-lg bg-[#0a2a5b] text-white text-[11px] font-bold hover:bg-slate-800 transition flex items-center gap-1"
            >
              <Building2 className="h-3.5 w-3.5 text-[#ff4f5a]" />
              <span>Abrir Portal Recepción Hoteles</span>
            </Link>
            <Link
              href="/landing/experience/marketplace"
              target="_blank"
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold hover:bg-slate-200 transition flex items-center gap-1"
            >
              <span>Catálogo B2B</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Unidad 3: Luna Viajera (B2C Excursiones Tucumán y NOA) */}
        <div className={`rounded-2xl border p-5 shadow-sm transition-all ${
          tourismUnit === 'lunaviajera' ? 'bg-amber-50/60 border-amber-500 ring-2 ring-amber-500/20' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Moon className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  Unidad 3 · Receptivo B2C NOA
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">🌙 Luna Viajera (Tucumán &amp; NOA)</h3>
              </div>
            </div>
            <span className="text-xs font-black text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
              {receptiveToursCount} excursiones
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
            Comercialización individual B2C de excursiones locales en Tucumán y el NOA. Comparte inventario, cupos y prestadores con TravelApp Experience.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <Link
              href="/experiences/catalog?unit=receptivo"
              className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-[11px] font-bold hover:bg-amber-500 transition"
            >
              Catálogo Excursiones NOA
            </Link>
            <Link
              href="/landing/lunaviajera"
              target="_blank"
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold hover:bg-slate-200 transition flex items-center gap-1"
            >
              <span>Ver Web Luna Viajera</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* MÓDULO OPERATIVO Y ADMINISTRATIVO CENTRAL (LOS 5 PILARES DE CONCORDE 360) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-tech-blue" />
            Módulo Operativo &amp; Administrativo Central (Concorde 360)
          </h2>
          <span className="text-xs text-slate-400 font-semibold">
            Gestión unificada de Files, Prestadores, Stock de Lugares, Pasajeros y Comisiones
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Pilar 1: Files & Reservas Multi-Operador */}
          <Link
            href="/experiences/reservations"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-tech-blue hover:shadow-md transition group flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center text-slate-400 group-hover:text-tech-blue transition">
                <span className="text-[11px] font-black uppercase tracking-wider">1. Files &amp; Reservas</span>
                <FileSpreadsheet className="h-5 w-5 text-tech-blue" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{totalReservasMes} Files</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Expedientes con servicios de múltiples operadores, liquidación de IVA, costo neto y margen.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-tech-blue">
              <span>Abrir ERP de Files</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          {/* Pilar 2: Agenda de Prestadores y Proveedores */}
          <Link
            href="/experiences/providers"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-purple-500 hover:shadow-md transition group flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center text-slate-400 group-hover:text-purple-600 transition">
                <span className="text-[11px] font-black uppercase tracking-wider">2. Prestadores &amp; Prov.</span>
                <AlarmClock className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">
                {urgentPayablesCount} <span className="text-sm font-bold text-purple-700">vencimientos</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Por pagar: <strong className="text-slate-700">{totalPayableUsd > 0 ? `U$D ${totalPayableUsd.toLocaleString()}` : `$${(totalPayableArs || 420000).toLocaleString()}`}</strong> a operadores mayoristas y guías.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-purple-700">
              <span>Agenda de Proveedores</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          {/* Pilar 3: Manejo de Stock de Lugares y Cupos */}
          <Link
            href="/experiences/spots"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-500 hover:shadow-md transition group flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center text-slate-400 group-hover:text-emerald-600 transition">
                <span className="text-[11px] font-black uppercase tracking-wider">3. Stock de Lugares</span>
                <Bus className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">Cupos &amp; Butacas</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Control de cupos por salida (compartido Luna Viajera + Experience B2B), mapa de micro y rooming.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-emerald-700">
              <span>Controlar Cupos</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          {/* Pilar 4: Registro de Usuarios, Pasajeros y Clientes */}
          <Link
            href="/experiences/customers"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-sky-500 hover:shadow-md transition group flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center text-slate-400 group-hover:text-sky-600 transition">
                <span className="text-[11px] font-black uppercase tracking-wider">4. Pasajeros &amp; Clientes</span>
                <Users className="h-5 w-5 text-sky-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{customersCount} Fichas</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Base unificada de usuarios, pasajeros titulares/acompañantes, legajos IATA y reservas.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-sky-700">
              <span>Padrón de Pasajeros</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          {/* Pilar 5: Recepciones de Hoteles & Comisiones B2B */}
          <Link
            href="/experiences/hotel-reception"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[#ff4f5a] hover:shadow-md transition group flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center text-slate-400 group-hover:text-[#ff4f5a] transition">
                <span className="text-[11px] font-black uppercase tracking-wider">5. Comisiones Hoteles</span>
                <DollarSign className="h-5 w-5 text-[#ff4f5a]" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">
                ${pendingHotelCommissionsArs.toLocaleString('es-AR')}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Comisiones pendientes a liquidar a recepciones de hoteles por excursiones y TravelCab.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-[#ff4f5a]">
              <span>Ver Portal &amp; Liquidar</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        </div>
      </div>

      {/* GRÁFICO DE CONVERSIÓN */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
            Conversión Comercial: Consultas vs Files Confirmados
          </h3>
          <span className="text-xs font-bold text-slate-400">
            Filtro activo: {tourismUnit === 'global' ? 'Consolidado 3 Unidades' : tourismUnit === 'travelapp' ? 'TravelApp Emisivo' : tourismUnit === 'experience_b2b' ? 'Experience B2B & Hoteles' : 'Luna Viajera NOA'}
          </span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockChartData}>
              <defs>
                <linearGradient id="colorConsultas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
              <YAxis stroke="#94A3B8" fontSize={11} />
              <Tooltip />
              <Area type="monotone" dataKey="consultas" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorConsultas)" name="Consultas Recibidas" />
              <Area type="monotone" dataKey="ventas" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVentas)" name="Files Confirmados" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABLA OPERATIVA DE FILES Y RESERVAS POR UNIDAD DE NEGOCIO */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
              Últimos Files Operativos &amp; Reservas Registradas
            </h3>
            <p className="text-xs text-slate-500">
              Visualización en tiempo real de reservas originadas en TravelApp Marketplace, Recepciones de Hoteles (Experience B2B) y Luna Viajera.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/experiences/reservations"
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            >
              Ver Todos los Files y Liquidaciones
            </Link>
            <Link
              href="/experiences/reservations/new"
              className="px-3.5 py-2 rounded-xl bg-tech-blue hover:bg-blue-700 text-white text-xs font-bold transition"
            >
              + Nuevo File
            </Link>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">File / Unidad</th>
                <th className="px-4 py-3 text-left">Pasajero Titular</th>
                <th className="px-4 py-3 text-left">Servicio / Excursión / Paquete</th>
                <th className="px-4 py-3 text-left">Canal / Operadores</th>
                <th className="px-4 py-3 text-right">Importe</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredReservations.map((res) => (
                <tr key={res.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-black text-slate-900 font-mono block">
                      {res.reservationCode || res.id}
                    </span>
                    {res.businessUnit === 'lunaviajera' ? (
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                        🌙 Luna Viajera B2C
                      </span>
                    ) : res.businessUnit === 'experience_b2b' ? (
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800">
                        🏨 Experience B2B
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-800">
                        ✈️ TravelApp Emisivo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-800">{res.nombrePasajero}</p>
                    <p className="text-[10px] text-slate-400">{res.telefonoPasajero || res.emailPasajero}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-800">{res.tourTitle}</p>
                    <p className="text-[10px] text-slate-500">{res.cantidadPersonas} pasajero(s)</p>
                  </td>
                  <td className="px-4 py-3">
                    {res.hotelPartnerName ? (
                      <div>
                        <span className="font-bold text-slate-800 block">🏨 {res.hotelPartnerName}</span>
                        <span className="text-[10px] text-emerald-700 font-bold">
                          Comisión B2B: ${(res.hotelCommissionAmount || 0).toLocaleString('es-AR')} ({res.hotelCommissionStatus || 'Pendiente'})
                        </span>
                      </div>
                    ) : res.independentServicesCount && res.independentServicesCount > 0 ? (
                      <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {res.independentServicesCount} servicios de operadores
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">{res.branchName || 'Venta Directa Web'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-black text-slate-900">
                    {res.currency === 'USD' ? 'U$D ' : '$'}{res.amount?.toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {res.estado === 'Confirmada' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 font-bold text-emerald-700">
                        Confirmada
                      </span>
                    ) : res.estado === 'Señada' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 font-bold text-blue-700">
                        Señada
                      </span>
                    ) : res.estado === 'Cancelada' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 font-bold text-red-700">
                        Cancelada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 font-bold text-amber-700 animate-pulse">
                        {res.estado || 'Pendiente'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    {res.estado !== 'Confirmada' && (
                      <button
                        onClick={() => handleUpdateStatus(res.id, 'Confirmada')}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded border border-emerald-200 cursor-pointer"
                      >
                        Confirmar
                      </button>
                    )}
                    {res.estado !== 'Cancelada' && (
                      <button
                        onClick={() => handleUpdateStatus(res.id, 'Cancelada')}
                        className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-2 py-1 rounded border border-red-200 cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(res.id)}
                      className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-slate-100 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredReservations.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No hay Files o reservas registradas para esta unidad de negocio.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
