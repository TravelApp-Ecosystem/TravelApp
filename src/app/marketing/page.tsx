"use client";

import React from 'react';
import { Megaphone, DollarSign, Target, Zap, Users, PlayCircle, PauseCircle } from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

// Colores de la Paleta Analítica
const COLORS = {
  cyan: '#22d3ee',
  pink: '#ec4899',
  purple: '#a855f7',
  gray: '#4b5563'
};

const PIE_COLORS = [COLORS.cyan, COLORS.pink, COLORS.purple, COLORS.gray];

// Mock Data
const acquisitionData = [
  { name: 'WhatsApp', value: 45 },
  { name: 'Meta Ads', value: 30 },
  { name: 'Google Ads', value: 15 },
  { name: 'Tráfico Web', value: 10 },
];

const budgetData = [
  { name: 'CRM Ventas', presupuesto: 2000, ingresos: 8500 },
  { name: 'TravelCab', presupuesto: 3500, ingresos: 12000 },
  { name: 'Experiencias', presupuesto: 1500, ingresos: 4500 },
];

const campaignsData = [
  { id: 'CMP-01', name: 'Retargeting Ejecutivos', platform: 'Meta Ads', status: 'Activa', spend: 1250, cpl: 12.5 },
  { id: 'CMP-02', name: 'Search B2B Corporate', platform: 'Google Ads', status: 'Activa', spend: 850, cpl: 25.0 },
  { id: 'CMP-03', name: 'Promo Verano Viñales', platform: 'Meta Ads', status: 'Pausada', spend: 400, cpl: 8.0 },
];

export default function MarketingPage() {
  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-tech-blue flex items-center">
          <Megaphone className="mr-3 h-8 w-8 text-pink-500" />
          Growth & Ads
        </h1>
        <p className="mt-2 text-slate-500">Control central de campañas, presupuesto y analítica de adquisición.</p>
      </div>

      {/* 4 KPI Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* KPI: Inversión Total */}
        <div className="group rounded-2xl border border-slate-200 bg-white/50 p-6 shadow-sm transition-all hover:bg-slate-100 hover:shadow-lg hover:shadow-cyan-900/20">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500">Inversión (Mes)</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
              <DollarSign className="h-5 w-5 text-cyan-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black text-tech-blue">$7,500</p>
          </div>
        </div>

        {/* KPI: CAC Promedio */}
        <div className="group rounded-2xl border border-slate-200 bg-white/50 p-6 shadow-sm transition-all hover:bg-slate-100 hover:shadow-lg hover:shadow-pink-900/20">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500">CAC Promedio</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/10">
              <Target className="h-5 w-5 text-pink-500" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black text-tech-blue">$15.20</p>
          </div>
        </div>

        {/* KPI: ROAS */}
        <div className="group rounded-2xl border border-slate-200 bg-white/50 p-6 shadow-sm transition-all hover:bg-slate-100 hover:shadow-lg hover:shadow-purple-900/20">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500">ROAS Global</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
              <Zap className="h-5 w-5 text-purple-500" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black text-tech-blue">3.4x</p>
          </div>
        </div>

        {/* KPI: Leads */}
        <div className="group rounded-2xl border border-slate-200 bg-white/50 p-6 shadow-sm transition-all hover:bg-slate-100 hover:shadow-lg hover:shadow-gray-700/20">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500">Leads Generados</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <Users className="h-5 w-5 text-slate-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-black text-tech-blue">492</p>
          </div>
        </div>

      </div>

      {/* Visualización de Datos (Media Section) */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* Panel Izquierdo: Donut Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white/50 p-6 shadow-xl">
          <h3 className="mb-6 text-lg font-bold text-tech-blue">Fuentes de Adquisición</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={acquisitionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {acquisitionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', borderRadius: '0.75rem', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel Derecho: Bar Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white/50 p-6 shadow-xl">
          <h3 className="mb-6 text-lg font-bold text-tech-blue">Presupuesto vs. Ingresos (por Unidad)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={budgetData}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: '#1f2937', opacity: 0.4}}
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', borderRadius: '0.75rem' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar dataKey="presupuesto" name="Gasto ($)" fill={COLORS.pink} radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="ingresos" name="Retorno ($)" fill={COLORS.cyan} radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Tabla de Campañas Activas */}
      <div className="rounded-2xl border border-slate-200 bg-white/50 shadow-xl overflow-hidden">
        <div className="border-b border-slate-200 p-6">
          <h3 className="text-lg font-bold text-tech-blue">Campañas Activas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-500">
            <thead className="bg-slate-50/50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Nombre de Campaña</th>
                <th className="px-6 py-4 font-medium">Plataforma</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium">Gasto Actual</th>
                <th className="px-6 py-4 font-medium">CPL Promedio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {campaignsData.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-slate-100/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-200">{campaign.name}</td>
                  <td className="px-6 py-4">{campaign.platform}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                      campaign.status === 'Activa' 
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' 
                        : 'bg-slate-100 text-slate-500 border-slate-300'
                    }`}>
                      {campaign.status === 'Activa' ? <PlayCircle className="mr-1 h-3 w-3" /> : <PauseCircle className="mr-1 h-3 w-3" />}
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-tech-blue">${campaign.spend}</td>
                  <td className="px-6 py-4 text-pink-400">${campaign.cpl.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
