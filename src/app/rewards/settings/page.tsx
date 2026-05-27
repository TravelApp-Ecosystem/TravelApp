"use client";

import React, { useState } from 'react';
import { RewardRule } from '@/types/rewards';
import { Plus, Save, Trash2, Gift } from 'lucide-react';

export default function RewardsSettingsPage() {
  const [rules, setRules] = useState<RewardRule[]>([
    { id: '1', name: 'TravelCab Estándar', conversionRate: 1000, pointValue: 10, isActive: true },
    { id: '2', name: 'Experiencias VIP', conversionRate: 500, pointValue: 15, isActive: true },
  ]);

  const addRule = () => {
    const newRule: RewardRule = {
      id: Date.now().toString(),
      name: '',
      conversionRate: 0,
      pointValue: 0,
      isActive: true,
    };
    setRules([...rules, newRule]);
  };

  const updateRule = (id: string, updates: Partial<RewardRule>) => {
    setRules(rules.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const saveRules = () => {
    console.log("Saving rules...", rules);
    alert("Reglas guardadas exitosamente.");
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-tech-blue flex items-center">
            <Gift className="mr-2 h-6 w-6 text-vial-orange" />
            Reglas de Recompensa
          </h1>
          <p className="text-sm text-slate-500 mt-1">Configura las reglas infinitas de acumulación y canje de puntos.</p>
        </div>
        <button 
          onClick={addRule}
          className="inline-flex items-center justify-center space-x-2 rounded-md bg-white border border-slate-200 px-4 py-2 text-sm font-medium text-tech-blue hover:bg-slate-50 transition-colors"
        >
          <Plus className="h-4 w-4 text-vial-orange" />
          <span>Nueva Regla</span>
        </button>
      </div>

      <div className="space-y-4">
        {rules.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            No hay reglas configuradas. Haz clic en "Nueva Regla" para comenzar.
          </div>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md relative">
              <div className="absolute top-4 right-4 flex space-x-2">
                <button 
                  onClick={() => updateRule(rule.id, { isActive: !rule.isActive })}
                  className={`px-3 py-1 text-xs font-bold rounded-full ${rule.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}
                >
                  {rule.isActive ? 'Activa' : 'Inactiva'}
                </button>
                <button onClick={() => deleteRule(rule.id)} className="text-slate-400 hover:text-red-500 p-1">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-12 items-start mt-2">
                <div className="sm:col-span-4">
                  <label className="mb-1 block text-xs font-bold text-tech-blue uppercase tracking-wider">Nombre de la Promoción</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Promo Cuba"
                    value={rule.name}
                    onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                    className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-tech-blue placeholder-slate-400 focus:border-vial-orange focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                
                <div className="sm:col-span-4">
                  <label className="mb-1 block text-xs font-bold text-tech-blue uppercase tracking-wider">Tasa de Conversión ($)</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-500">Cada $</span>
                    <input 
                      type="number" 
                      value={rule.conversionRate}
                      onChange={(e) => updateRule(rule.id, { conversionRate: Number(e.target.value) })}
                      className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-tech-blue focus:border-vial-orange focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <span className="text-sm text-slate-500 whitespace-nowrap">= 1 Punto</span>
                  </div>
                </div>

                <div className="sm:col-span-4">
                  <label className="mb-1 block text-xs font-bold text-tech-blue uppercase tracking-wider">Valor de Respaldo ($)</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-500">1 Punto vale $</span>
                    <input 
                      type="number" 
                      value={rule.pointValue}
                      onChange={(e) => updateRule(rule.id, { pointValue: Number(e.target.value) })}
                      className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-tech-blue focus:border-vial-orange focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 flex justify-end">
        <button 
          onClick={saveRules}
          className="inline-flex items-center justify-center space-x-2 rounded-md bg-vial-orange px-6 py-2.5 text-sm font-bold text-white shadow hover:opacity-90 transition-colors"
        >
          <Save className="h-4 w-4" />
          <span>Guardar Cambios</span>
        </button>
      </div>
    </div>
  );
}
