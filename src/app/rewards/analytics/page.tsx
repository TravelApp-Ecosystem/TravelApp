"use client";

import React from 'react';
import { PieChart, TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

export default function RewardsAnalyticsPage() {
  // Mock Data
  const totalPoints = 1450000;
  const pointValue = 10; // Promedio o valor base
  const financialBacking = totalPoints * pointValue;

  const ranking = [
    { name: 'TravelCab ARC', points: 800000, percentage: 55 },
    { name: 'Promo Experiencias', points: 450000, percentage: 31 },
    { name: 'MU Diurno', points: 200000, percentage: 14 },
  ];

  return (
    <div className="p-6 lg:p-8 bg-slate-50 min-h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-tech-blue flex items-center">
          <PieChart className="mr-3 h-6 w-6 text-vial-orange" />
          Dashboard Financiero: Rewards
        </h1>
        <p className="text-sm text-slate-500 mt-1">Análisis de emisión de puntos y métricas de respaldo corporativo.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* KPI: Total Puntos */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Puntos Emitidos</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-tech-blue">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <p className="text-4xl font-black text-tech-blue">{totalPoints.toLocaleString('es-AR')}</p>
            <span className="text-sm font-bold text-vial-orange">pts</span>
          </div>
        </div>

        {/* KPI: Respaldo Financiero */}
        <div className="rounded-2xl border-2 border-tech-blue bg-white p-6 shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-2 bg-tech-blue"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-tech-blue uppercase tracking-wider">Respaldo Financiero Necesario</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-tech-blue/10 text-tech-blue">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-tech-blue mr-1">$</span>
            <p className="text-4xl font-black text-tech-blue">{financialBacking.toLocaleString('es-AR')}</p>
          </div>
          <p className="text-xs text-slate-400 mt-2">Valor promedio de conversión: ${pointValue}/pt</p>
        </div>

        {/* KPI: Usuarios Activos en Rewards */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Cuentas Fidelizadas</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-vial-orange/10 text-vial-orange">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <p className="text-4xl font-black text-tech-blue">3,420</p>
            <span className="text-xs font-bold text-green-500 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" /> +12%
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ranking */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-bold text-tech-blue mb-6">Ranking de Emisión por Regla</h3>
          
          <div className="space-y-6">
            {ranking.map((item, index) => (
              <div key={index} className="relative">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-bold text-tech-blue">{item.name}</span>
                  <span className="text-sm font-medium text-slate-500">{item.points.toLocaleString('es-AR')} pts ({item.percentage}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div className="bg-tech-blue h-2.5 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-tech-blue mb-6">Últimos Canjes</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-vial-orange/20 flex items-center justify-center text-vial-orange font-bold text-xs mr-3">
                    CB
                  </div>
                  <div>
                    <p className="text-xs font-bold text-tech-blue">Carlos B.</p>
                    <p className="text-[10px] text-slate-400">Hace {i * 15} min</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-red-500">-500 pts</p>
                  <p className="text-[10px] text-slate-500">Viaje Gratis</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
