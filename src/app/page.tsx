"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Car, 
  Ticket, 
  Wallet, 
  TrendingUp, 
  ArrowUpRight,
  MessageSquare,
  MapPin,
  CheckCircle,
  Activity
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Mock Data para el Gráfico
const performanceData = [
  { name: 'Lun', interacciones: 4000, conversiones: 2400 },
  { name: 'Mar', interacciones: 3000, conversiones: 1398 },
  { name: 'Mié', interacciones: 2000, conversiones: 9800 },
  { name: 'Jue', interacciones: 2780, conversiones: 3908 },
  { name: 'Vie', interacciones: 1890, conversiones: 4800 },
  { name: 'Sáb', interacciones: 2390, conversiones: 3800 },
  { name: 'Dom', interacciones: 3490, conversiones: 4300 },
];

// Mock Data para el Feed de Actividad
const activityFeed = [
  { id: 1, text: 'Carlos M. cerró una negociación', module: 'crm', time: 'Hace 10 min', icon: MessageSquare, color: 'text-tech-blue', bg: 'bg-tech-blue/10' },
  { id: 2, text: 'Chofer asignado al Viaje TRP-10492', module: 'travelcab', time: 'Hace 45 min', icon: Car, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { id: 3, text: 'Nueva reserva VIP confirmada', module: 'experiences', time: 'Hace 2 horas', icon: Ticket, color: 'text-lime-500', bg: 'bg-lime-500/10' },
  { id: 4, text: 'Nuevo lead ingresado por WhatsApp', module: 'crm', time: 'Hace 3 horas', icon: Users, color: 'text-tech-blue', bg: 'bg-tech-blue/10' },
  { id: 5, text: 'Viaje TRP-10488 completado', module: 'travelcab', time: 'Hace 5 horas', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
];

export default function HomeDashboard() {
  const [stats, setStats] = useState({
    leads: 0,
    trips: 0,
    experiences: 0,
    revenue: 145000 // Mock value
  });

  useEffect(() => {
    // Escucha en tiempo real a Leads
    const unsubLeads = onSnapshot(collection(db, 'leads'), (snapshot) => {
      setStats(prev => ({ ...prev, leads: snapshot.size }));
    });

    // Escucha en tiempo real a Viajes
    const unsubTrips = onSnapshot(collection(db, 'trips'), (snapshot) => {
      setStats(prev => ({ ...prev, trips: snapshot.size }));
    });

    // Escucha en tiempo real a Experiencias
    const unsubExperiences = onSnapshot(collection(db, 'experiences'), (snapshot) => {
      setStats(prev => ({ ...prev, experiences: snapshot.size }));
    });

    return () => {
      unsubLeads();
      unsubTrips();
      unsubExperiences();
    };
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50">
      
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-tech-blue flex items-center">
            <Activity className="mr-3 h-8 w-8 text-tech-blue" />
            Centro de Comando Global
          </h1>
          <p className="mt-2 text-slate-500">Visión panorámica en tiempo real del ecosistema TravelApp.</p>
        </div>
      </div>

      {/* KPI Cards (4 Column Grid) */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* KPI: Leads */}
        <div className="group rounded-2xl border border-slate-200 bg-white/50 p-6 shadow-sm transition-all hover:bg-slate-100 hover:shadow-lg hover:shadow-blue-900/20">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500 group-hover:text-slate-600">Nuevos Prospectos</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-tech-blue/10 transition-colors group-hover:bg-tech-blue/20">
              <Users className="h-5 w-5 text-tech-blue" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-3">
            <p className="text-3xl font-black text-tech-blue">{stats.leads}</p>
            <span className="flex items-center text-xs font-bold text-green-500">
              <ArrowUpRight className="mr-0.5 h-3 w-3" /> +12%
            </span>
          </div>
        </div>

        {/* KPI: Viajes */}
        <div className="group rounded-2xl border border-slate-200 bg-white/50 p-6 shadow-sm transition-all hover:bg-slate-100 hover:shadow-lg hover:shadow-yellow-900/20">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500 group-hover:text-slate-600">Viajes Activos</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10 transition-colors group-hover:bg-yellow-500/20">
              <Car className="h-5 w-5 text-yellow-500" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-3">
            <p className="text-3xl font-black text-tech-blue">{stats.trips}</p>
            <span className="flex items-center text-xs font-bold text-green-500">
              <ArrowUpRight className="mr-0.5 h-3 w-3" /> +5%
            </span>
          </div>
        </div>

        {/* KPI: Experiencias */}
        <div className="group rounded-2xl border border-slate-200 bg-white/50 p-6 shadow-sm transition-all hover:bg-slate-100 hover:shadow-lg hover:shadow-lime-900/20">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500 group-hover:text-slate-600">Reservas Confirmadas</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-500/10 transition-colors group-hover:bg-lime-500/20">
              <Ticket className="h-5 w-5 text-lime-400" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-3">
            <p className="text-3xl font-black text-tech-blue">{stats.experiences}</p>
            <span className="flex items-center text-xs font-bold text-slate-500">
              Sin cambios
            </span>
          </div>
        </div>

        {/* KPI: Ingresos */}
        <div className="group rounded-2xl border border-slate-200 bg-white/50 p-6 shadow-sm transition-all hover:bg-slate-100 hover:shadow-lg hover:shadow-purple-900/20">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500 group-hover:text-slate-600">Ingresos Proyectados</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 transition-colors group-hover:bg-purple-500/20">
              <Wallet className="h-5 w-5 text-purple-400" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-3">
            <p className="text-3xl font-black text-tech-blue">
              ${(stats.revenue / 1000).toFixed(1)}k
            </p>
            <span className="flex items-center text-xs font-bold text-green-500">
              <ArrowUpRight className="mr-0.5 h-3 w-3" /> +24%
            </span>
          </div>
        </div>

      </div>

      {/* Bento Box Layout: Main content area */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Gráfico (Ocupa 2/3 en Desktop) */}
        <div className="rounded-2xl border border-slate-200 bg-white/50 p-6 shadow-xl lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-tech-blue">Interacciones vs. Conversiones</h3>
              <p className="text-sm text-slate-500">Rendimiento de las métricas durante los últimos 7 días.</p>
            </div>
            <button className="flex items-center space-x-2 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors">
              <TrendingUp className="h-4 w-4" />
              <span>Reporte</span>
            </button>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInteracciones" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorConversiones" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a3e635" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a3e635" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', borderRadius: '0.75rem' }}
                  itemStyle={{ color: '#f3f4f6' }}
                />
                <Area type="monotone" dataKey="interacciones" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorInteracciones)" />
                <Area type="monotone" dataKey="conversiones" stroke="#a3e635" strokeWidth={3} fillOpacity={1} fill="url(#colorConversiones)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feed de Actividad (Ocupa 1/3 en Desktop) */}
        <div className="rounded-2xl border border-slate-200 bg-white/50 p-6 shadow-xl">
          <h3 className="mb-6 text-lg font-bold text-tech-blue">Última Actividad</h3>
          
          <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            {activityFeed.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  {/* Marker */}
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-50 ${item.bg} text-tech-blue shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110`}>
                    <Icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                  {/* Card */}
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 bg-white shadow transition-colors hover:border-slate-300">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${item.color}`}>{item.module}</span>
                      <time className="text-[10px] font-medium text-slate-500">{item.time}</time>
                    </div>
                    <div className="text-sm font-medium text-slate-700">{item.text}</div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <button className="mt-6 w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-tech-blue">
            Ver Todo el Historial
          </button>
        </div>

      </div>

    </div>
  );
}
