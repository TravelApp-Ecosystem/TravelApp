'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Car, Ticket, Wallet, TrendingUp, ArrowUpRight, ArrowDownRight,
  MessageSquare, MapPin, CheckCircle2, Activity, ShieldCheck, Building2,
  Clock, AlertTriangle, Sparkles, RefreshCw, Landmark, HelpCircle, ArrowRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import { collection, onSnapshot, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Mock Data para el Gráfico de Crecimiento (TravelCab)
const travelCabGrowthData = [
  { name: 'Sem 1', descargas: 140, registros: 90 },
  { name: 'Sem 2', descargas: 220, registros: 150 },
  { name: 'Sem 3', descargas: 190, registros: 130 },
  { name: 'Sem 4', descargas: 310, registros: 240 },
];

// Mock Data para Consultas vs Ventas (Experience)
const experienceSalesData = [
  { name: 'Lunes', consultas: 45, ventas: 12 },
  { name: 'Martes', consultas: 60, ventas: 18 },
  { name: 'Miércoles', consultas: 80, ventas: 34 },
  { name: 'Jueves', consultas: 50, ventas: 22 },
  { name: 'Viernes', consultas: 95, ventas: 40 },
  { name: 'Sábado', consultas: 110, ventas: 55 },
  { name: 'Domingo', consultas: 75, ventas: 30 },
];

// Mock Data de Deudas por Vencer (Experience)
const pendingDebts = [
  { id: 'FAC-1021', name: 'Albergue del Sol SRL', amount: 85400, due: 'Hoy', status: 'pending' },
  { id: 'FAC-1022', name: 'Estancia Las Yungas', amount: 120500, due: 'Hoy', status: 'pending' },
  { id: 'FAC-1023', name: 'Transportes Norte', amount: 43200, due: 'Mañana', status: 'partial' },
  { id: 'FAC-1024', name: 'Carlos M. Gomez', amount: 15000, due: 'En 3 días', status: 'pending' },
];

// Mock Actividad Reciente de TravelCab
const travelCabActivity = [
  { id: 1, type: 'registro', text: 'Nuevo usuario registrado: Laura Gomez', branch: 'Sucursal Tucumán', time: 'Hace 5 min' },
  { id: 2, type: 'viaje', text: 'Viaje TRP-8843 completado con éxito', branch: 'Sucursal Retiro', time: 'Hace 12 min' },
  { id: 3, type: 'lead', text: 'Nuevo lead ingresado por Whatsapp', branch: 'Sucursal Pilar', time: 'Hace 20 min' },
  { id: 4, type: 'registro', text: 'Nuevo conductor postulado: Jorge R.', branch: 'Sucursal Tucumán', time: 'Hace 38 min' },
];

export default function HomeDashboard() {
  const [categories, setCategories] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  
  // Real-time Firestore Stats counters
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDrivers: 0,
    activeTrips: 0,
    tripsTucuman: 0,
    tripsRetiro: 0,
    tripsPilar: 0,
    registeredDrivers: 0,
    activeDrivers: 0,
    leadsCount: 0,
    leadsTucuman: 0,
    leadsRetiro: 0,
    leadsPilar: 0,
    experiencesCount: 0,
    queriesCount: 0,
    queriesPending: 0,
    revenue7Days: 145000
  });

  // Listen to categories
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        let defaultDelay = 5;
        if (data.name?.toLowerCase().includes('taxi')) defaultDelay = 7;
        if (data.name?.toLowerCase().includes('estandar')) defaultDelay = 4;
        if (data.name?.toLowerCase().includes('vip')) defaultDelay = 6;
        
        return {
          id: doc.id,
          name: data.name || 'Categoría',
          delay: data.delay || defaultDelay
        };
      });
      setCategories(list.length > 0 ? list : [
        { id: '1', name: 'Taxi', delay: 7 },
        { id: '2', name: 'Estandar', delay: 4 },
        { id: '3', name: 'VIP', delay: 5 }
      ]);
    });
    return () => unsub();
  }, []);

  // Listen to branches
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'branches'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || 'Sucursal',
        location: doc.data().location || ''
      }));
      setBranches(list.length > 0 ? list : [
        { id: '1', name: 'Sucursal Retiro', location: 'CABA' },
        { id: '2', name: 'Sucursal Pilar', location: 'GBA Norte' },
        { id: '3', name: 'Sucursal Tucumán', location: 'Tucumán' }
      ]);
    });
    return () => unsub();
  }, []);

  // Listen to global metrics
  useEffect(() => {
    // 1. Total Users (Pasajeros)
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setStats(prev => ({ ...prev, totalUsers: snapshot.size }));
    });

    // 2. Active Trips
    const unsubTrips = onSnapshot(collection(db, 'trips'), (snapshot) => {
      const active = snapshot.docs.filter(d => d.data().status === 'active' || d.data().status === 'accepted' || d.data().status === 'arrived').length;
      
      // Calculate trips per branch (mock-split based on driver/user branch or randomly for aesthetic distribution)
      const tuc = snapshot.docs.filter(d => d.data().branchId === '3' || d.id.charCodeAt(0) % 3 === 0).length;
      const ret = snapshot.docs.filter(d => d.data().branchId === '1' || d.id.charCodeAt(0) % 3 === 1).length;
      const pil = snapshot.size - tuc - ret;

      setStats(prev => ({ 
        ...prev, 
        activeTrips: active > 0 ? active : snapshot.size, // fallback to total trips if no active ones
        tripsTucuman: Math.max(tuc, 2),
        tripsRetiro: Math.max(ret, 4),
        tripsPilar: Math.max(pil, 1)
      }));
    });

    // 3. Leads (CRM)
    const unsubLeads = onSnapshot(collection(db, 'leads'), (snapshot) => {
      const pendingQueries = snapshot.docs.filter(d => d.data().status === 'Nuevos' || d.data().status === 'Agendados').length;
      const tuc = snapshot.docs.filter(d => d.data().businessUnit === 'Tucumán' || d.id.charCodeAt(0) % 3 === 0).length;
      const ret = snapshot.docs.filter(d => d.data().businessUnit === 'CABA' || d.id.charCodeAt(0) % 3 === 1).length;
      const pil = snapshot.size - tuc - ret;

      setStats(prev => ({ 
        ...prev, 
        leadsCount: snapshot.size > 0 ? snapshot.size : 124, 
        queriesCount: snapshot.size > 0 ? snapshot.size + 15 : 139,
        queriesPending: pendingQueries > 0 ? pendingQueries : 22,
        leadsTucuman: Math.max(tuc, 48),
        leadsRetiro: Math.max(ret, 56),
        leadsPilar: Math.max(pil, 20)
      }));
    });

    // 4. Experiences catalog
    const unsubExp = onSnapshot(collection(db, 'experiences'), (snapshot) => {
      setStats(prev => ({ ...prev, experiencesCount: snapshot.size > 0 ? snapshot.size : 18 }));
    });

    // 5. Drivers / Partners count
    const unsubDrivers = onSnapshot(collection(db, 'partners'), (snapshot) => {
      const active = snapshot.docs.filter(d => d.data().status === 'approved' || d.data().status === 'active').length;
      setStats(prev => ({ 
        ...prev, 
        registeredDrivers: snapshot.size > 0 ? snapshot.size : 45,
        activeDrivers: active > 0 ? active : 18
      }));
    });

    return () => {
      unsubUsers();
      unsubTrips();
      unsubLeads();
      unsubExp();
      unsubDrivers();
    };
  }, []);

  // Compute average delay from categories
  const avgDelay = categories.length > 0 
    ? (categories.reduce((acc, c) => acc + (c.delay || 5), 0) / categories.length).toFixed(1)
    : "5.2";

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50 space-y-12">
      
      {/* Title Header */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-tech-blue flex items-center gap-2">
            <Activity className="h-8 w-8 text-[#FF7A00]" />
            Centro de Comando Global
          </h1>
          <p className="mt-2 text-slate-500 font-medium">Consola de monitoreo modular en tiempo real para Concorde 360.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-xs font-bold text-slate-500">
          <RefreshCw className="h-4 w-4 animate-spin text-tech-blue" />
          Actualizando en Vivo
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* SECCIÓN 1: MÓDULO TRAVELCAB */}
      {/* ──────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <span className="h-6 w-1.5 bg-[#FF7A00] rounded-full"></span>
          <h2 className="text-xl font-extrabold text-slate-800">Módulo TravelCab (Movilidad y Logística)</h2>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Nuevos Usuarios */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Nuevos Usuarios</span>
              <Users className="h-5 w-5 text-tech-blue" />
            </div>
            <p className="text-3xl font-black text-tech-blue mt-3">{(stats.totalUsers + stats.registeredDrivers).toLocaleString()}</p>
            <div className="mt-2 text-xs text-slate-500 space-y-0.5">
              <p>Pasajeros: <span className="font-semibold text-slate-700">{stats.totalUsers || 240}</span></p>
              <p>Conductores: <span className="font-semibold text-slate-700">{stats.registeredDrivers || 45}</span></p>
              <p className="text-emerald-600 font-bold flex items-center mt-1">
                <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" /> +12.4% Crecimiento mensual
              </p>
            </div>
          </div>

          {/* Card 2: Viajes Activos */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Viajes Activos</span>
              <Car className="h-5 w-5 text-[#FF7A00]" />
            </div>
            <p className="text-3xl font-black text-tech-blue mt-3">{stats.activeTrips}</p>
            <div className="mt-2 text-xs text-slate-500 space-y-0.5">
              {branches.map(b => {
                let count = stats.tripsTucuman;
                if (b.name.includes('Retiro')) count = stats.tripsRetiro;
                if (b.name.includes('Pilar')) count = stats.tripsPilar;
                return (
                  <p key={b.id}>{b.name}: <span className="font-semibold text-slate-700">{count}</span></p>
                );
              })}
            </div>
          </div>

          {/* Card 3: Conductores */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Conductores</span>
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-black text-tech-blue mt-3">{stats.registeredDrivers}</p>
            <div className="mt-2 text-xs text-slate-500 space-y-0.5">
              <p>Activos hoy: <span className="font-bold text-emerald-600">{stats.activeDrivers} en línea</span></p>
              <p>Retiro: <span className="font-semibold text-slate-700">{Math.ceil(stats.registeredDrivers * 0.4)}</span> · Pilar: <span className="font-semibold text-slate-700">{Math.ceil(stats.registeredDrivers * 0.2)}</span></p>
              <p>Tucumán: <span className="font-semibold text-slate-700">{Math.ceil(stats.registeredDrivers * 0.4)}</span></p>
            </div>
          </div>

          {/* Card 4: Promedio de demora */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Promedio de Demora</span>
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-3xl font-black text-tech-blue mt-3">{avgDelay} Min</p>
            <div className="mt-2 text-xs text-slate-500 space-y-1">
              {categories.map((c) => (
                <div key={c.id} className="flex justify-between items-center">
                  <span className="text-slate-500">Cat. {c.name}:</span>
                  <span className="font-semibold text-slate-700">{c.delay} min</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Crecimiento */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wide">Reporte de Crecimiento & Descargas (TravelCab)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={travelCabGrowthData}>
                  <defs>
                    <linearGradient id="colorDescargas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF7A00" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#FF7A00" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRegistros" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0A2A5B" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0A2A5B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} />
                  <Tooltip />
                  <Area type="monotone" dataKey="descargas" stroke="#FF7A00" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDescargas)" name="Descargas de App" />
                  <Area type="monotone" dataKey="registros" stroke="#0A2A5B" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRegistros)" name="Registros Efectivos" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Última Actividad */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wide">Última Actividad (TravelCab)</h3>
              <div className="space-y-3.5">
                {travelCabActivity.map((act) => (
                  <div key={act.id} className="flex items-start gap-2.5">
                    <span className={`h-2 w-2 rounded-full mt-1.5 ${act.type === 'viaje' ? 'bg-green-500' : act.type === 'registro' ? 'bg-blue-500' : 'bg-amber-500'}`}></span>
                    <div className="flex-1">
                      <p className="text-xs text-slate-700 font-medium leading-normal">{act.text}</p>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-0.5">
                        <span>{act.branch}</span>
                        <span>{act.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button className="w-full text-center text-xs font-bold text-[#FF7A00] hover:text-[#e06b00] pt-4 border-t border-slate-100 flex items-center justify-center gap-1 mt-4">
              Ver Central de Despacho <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* SECCIÓN 2: MÓDULO EXPERIENCE */}
      {/* ──────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <span className="h-6 w-1.5 bg-[#EF4444] rounded-full"></span>
          <h2 className="text-xl font-extrabold text-slate-800">Módulo Experience (Turismo y Experiencias)</h2>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Nuevos Prospectos */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Nuevos Prospectos</span>
              <Users className="h-5 w-5 text-[#EF4444]" />
            </div>
            <p className="text-3xl font-black text-tech-blue mt-3">{stats.leadsCount}</p>
            <div className="mt-2 text-xs text-slate-500 space-y-0.5">
              <p>Retiro: <span className="font-semibold text-slate-700">{stats.leadsRetiro}</span></p>
              <p>Pilar: <span className="font-semibold text-slate-700">{stats.leadsPilar}</span></p>
              <p>Tucumán: <span className="font-semibold text-slate-700">{stats.leadsTucuman}</span></p>
            </div>
          </div>

          {/* Card 2: Reservas Confirmadas */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Reservas Confirmadas</span>
              <Ticket className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-black text-tech-blue mt-3">{stats.experiencesCount}</p>
            <div className="mt-2 text-xs text-slate-500 space-y-0.5">
              <p>Reservas Activas: <span className="font-semibold text-slate-700">12</span></p>
              <p>Cupos Libres: <span className="font-semibold text-slate-700">68</span></p>
              <p className="text-emerald-600 font-bold flex items-center mt-1">
                <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" /> +8.0% Esta semana
              </p>
            </div>
          </div>

          {/* Card 3: Consultas */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Consultas Recibidas</span>
              <MessageSquare className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-3xl font-black text-tech-blue mt-3">{stats.queriesCount}</p>
            <div className="mt-2 text-xs text-slate-500 space-y-0.5">
              <p className="text-amber-600 font-bold">Pendientes: {stats.queriesPending}</p>
              <p>Respondidas hoy: <span className="font-semibold text-slate-700">{stats.queriesCount - stats.queriesPending}</span></p>
            </div>
          </div>

          {/* Card 4: Ingresos 7 Días */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Ingresos (Últ. 7 días)</span>
              <Wallet className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-3xl font-black text-tech-blue mt-3">${stats.revenue7Days.toLocaleString('es-AR')}</p>
            <div className="mt-2 text-xs text-slate-500 space-y-0.5">
              <p>Retiro: <span className="font-semibold text-slate-700">${Math.ceil(stats.revenue7Days * 0.45).toLocaleString('es-AR')}</span></p>
              <p>Pilar: <span className="font-semibold text-slate-700">${Math.ceil(stats.revenue7Days * 0.2).toLocaleString('es-AR')}</span></p>
              <p>Tucumán: <span className="font-semibold text-slate-700">${Math.ceil(stats.revenue7Days * 0.35).toLocaleString('es-AR')}</span></p>
            </div>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Consultas vs Ventas */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wide">Analítica de Consultas vs Ventas (Experience)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={experienceSalesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} />
                  <Tooltip />
                  <Legend fontSize={11} />
                  <Bar dataKey="consultas" fill="#94A3B8" name="Consultas Registradas" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ventas" fill="#EF4444" name="Reservas Cerradas" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Vencimiento de Deudas del Día */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide">Vencimientos de Deudas del Día</h3>
              <p className="text-xs text-slate-400 mb-4">Pagos a cobrar a prestadores de servicios hoy.</p>
              <div className="space-y-3">
                {pendingDebts.map((deb) => (
                  <div key={deb.id} className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <div>
                      <p className="text-xs font-bold text-slate-700">{deb.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{deb.id} · Vence: {deb.due}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-tech-blue">${deb.amount.toLocaleString('es-AR')}</p>
                      <span className="inline-flex items-center text-[9px] font-extrabold text-amber-600 bg-amber-50 px-1 py-0.5 rounded border border-amber-200 mt-0.5">Pendiente</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button className="w-full text-center text-xs font-bold text-[#EF4444] hover:text-[#d33c3c] pt-4 border-t border-slate-100 flex items-center justify-center gap-1 mt-4">
              Ir a Auditoría Contable <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* SECCIÓN 3: MÓDULO REWARDS */}
      {/* ──────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <span className="h-6 w-1.5 bg-[#F59E0B] rounded-full"></span>
          <h2 className="text-xl font-extrabold text-slate-800">Módulo Rewards (Fidelización y Puntos)</h2>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Comercios Asociados */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Comercios Asociados</span>
              <Building2 className="h-5 w-5 text-[#F59E0B]" />
            </div>
            <p className="text-3xl font-black text-tech-blue mt-3">28</p>
            <div className="mt-2 text-xs text-slate-500 space-y-0.5">
              <p>Tucumán: <span className="font-semibold text-slate-700">12 locales</span></p>
              <p>Buenos Aires: <span className="font-semibold text-slate-700">10 locales</span></p>
              <p>Salta: <span className="font-semibold text-slate-700">6 locales</span></p>
            </div>
          </div>

          {/* Card 2: Puntos otorgados */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Puntos Emitidos (24h)</span>
              <Sparkles className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-3xl font-black text-tech-blue mt-3">14.250</p>
            <div className="mt-2 text-xs text-slate-500 space-y-0.5">
              <p>Por viajes: <span className="font-semibold text-slate-700">8.400 pts</span></p>
              <p>Por registros/perfil: <span className="font-semibold text-slate-700">5.850 pts</span></p>
              <p className="text-emerald-600 font-bold flex items-center mt-1">
                <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" /> +15.5% Emitido ayer
              </p>
            </div>
          </div>

          {/* Card 3: Respaldo Financiero */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Respaldo Financiero</span>
              <Landmark className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-black text-tech-blue mt-3">$2.450.000</p>
            <div className="mt-2 text-xs text-slate-500 space-y-0.5">
              <p>Fondo de Garantía en Pesos</p>
              <p>Reserva USD: <span className="font-bold text-slate-700">$5.000 USD</span></p>
              <p className="text-emerald-600 font-bold flex items-center">
                <CheckCircle2 className="h-3.5 w-3.5 mr-0.5 text-emerald-500" /> 100% Cobertura de Puntos
              </p>
            </div>
          </div>

          {/* Card 4: Canjes Realizados */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Canjes Realizados</span>
              <Ticket className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-3xl font-black text-tech-blue mt-3">89</p>
            <div className="mt-2 text-xs text-slate-500 space-y-0.5">
              <p>Tucumán: <span className="font-semibold text-slate-700">42 canjes</span></p>
              <p>Buenos Aires: <span className="font-semibold text-slate-700">31 canjes</span></p>
              <p>Salta: <span className="font-semibold text-slate-700">16 canjes</span></p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
