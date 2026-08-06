'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Megaphone, Plus, Edit2, Save, Trash2, Award, Ticket,
  TrendingUp, Users, ArrowLeft, Check, Sparkles, DollarSign, ExternalLink
} from 'lucide-react';
import { ExperiencePartnerTier, ExperiencePartner } from '@/types/affiliates';
import { DEFAULT_EXPERIENCE_TIERS } from '@/lib/commissions';

// Mock Experience Partners for Marketing Panel
const MOCK_EXPERIENCE_PARTNERS: ExperiencePartner[] = [
  {
    id: 'PART-001',
    userId: 'USR-201',
    name: 'María Florencia Travel',
    email: 'florencia.travels@gmail.com',
    phone: '+54 381 445-1234',
    refCode: 'FLOR_TRAVEL',
    currentTierId: 'tier-2',
    totalBookingsConcreted: 8,
    totalCommissionEarned: 48000,
    walletBalance: 48000,
    assignedCouponCode: 'FLOR10OFF',
    assignedCouponDiscountPct: 10,
    createdAt: Date.now() - 86400000 * 45,
    status: 'active',
  },
  {
    id: 'PART-002',
    userId: 'USR-202',
    name: 'Lucas Excursiones & Vlogs',
    email: 'lucas.vlogs@gmail.com',
    phone: '+54 381 556-7890',
    refCode: 'LUCAS_EXCURSION',
    currentTierId: 'tier-3',
    totalBookingsConcreted: 14,
    totalCommissionEarned: 112000,
    walletBalance: 112000,
    assignedCouponCode: 'LUCAS15OFF',
    assignedCouponDiscountPct: 15,
    createdAt: Date.now() - 86400000 * 90,
    status: 'active',
  },
  {
    id: 'PART-003',
    userId: 'USR-203',
    name: 'Camila Rutas Tucumán',
    email: 'camila.rutas@hotmail.com',
    phone: '+54 381 998-1122',
    refCode: 'CAMI_RUTAS',
    currentTierId: 'tier-1',
    totalBookingsConcreted: 3,
    totalCommissionEarned: 10800,
    walletBalance: 10800,
    assignedCouponCode: 'CAMI5OFF',
    assignedCouponDiscountPct: 5,
    createdAt: Date.now() - 86400000 * 15,
    status: 'active',
  },
];

export default function MarketingPartnersPage() {
  const [tiers, setTiers] = useState<ExperiencePartnerTier[]>(DEFAULT_EXPERIENCE_TIERS);
  const [partners, setPartners] = useState<ExperiencePartner[]>(MOCK_EXPERIENCE_PARTNERS);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [tierForm, setTierForm] = useState<Partial<ExperiencePartnerTier>>({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleEditTier = (tier: ExperiencePartnerTier) => {
    setEditingTierId(tier.id);
    setTierForm({ ...tier });
  };

  const handleSaveTier = (tierId: string) => {
    setTiers(tiers.map(t => t.id === tierId ? { ...t, ...tierForm } as ExperiencePartnerTier : t));
    setEditingTierId(null);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="flex h-full w-full flex-col bg-slate-50 p-6 gap-6 overflow-y-auto">
      
      {/* Back button */}
      <Link href="/marketing" className="flex w-fit items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-tech-blue transition-colors">
        <ArrowLeft className="h-4 w-4" /> Volver a Growth & Marketing
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-tech-blue flex items-center gap-2">
            <Award className="h-7 w-7 text-purple-600" />
            Programa de Embajadores & Afiliados (TravelApp Experience)
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Control de creadores de contenido, matriz de niveles editables, comisiones por cuota y cupones de descuento.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/experiences/creator-portal"
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all active:scale-95"
          >
            <ExternalLink className="h-4 w-4" />
            Ver Portal del Experience Creator
          </Link>
        </div>
      </div>

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-sm">
          <Check className="h-4 w-4 text-emerald-600" />
          ¡Configuración de niveles actualizada y guardada con éxito! Se aplicará a las próximas comisiones en cuotas.
        </div>
      )}

      {/* TIER ENGINE CONFIGURATOR (100% Editable Matrix) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-tech-blue flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Matriz Dinámica de Niveles & Beneficios (100% Configurable)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Editá los rangos de reservas, el % de comisión por cuota, el descuento para seguidores y los Puntos Rewards por nivel.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map((tier) => {
            const isEditing = editingTierId === tier.id;
            return (
              <div
                key={tier.id}
                className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
                  isEditing ? 'border-purple-500 bg-purple-50/30 ring-2 ring-purple-500/20' : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-extrabold bg-purple-100 text-purple-800 border border-purple-200`}>
                      {tier.name}
                    </span>
                    {!isEditing ? (
                      <button
                        onClick={() => handleEditTier(tier)}
                        className="rounded p-1 text-slate-400 hover:text-purple-600 hover:bg-slate-200/50 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSaveTier(tier.id)}
                        className="rounded bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 flex items-center gap-1"
                      >
                        <Save className="h-3 w-3" /> Guardar
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Min. Reservas</label>
                        <input
                          type="number"
                          value={tierForm.minBookings ?? tier.minBookings}
                          onChange={e => setTierForm({ ...tierForm, minBookings: parseInt(e.target.value) || 0 })}
                          className="w-full rounded border border-slate-300 p-1.5 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">% Comisión (por cuota)</label>
                        <input
                          type="number" step="0.5"
                          value={tierForm.commissionPct ?? tier.commissionPct}
                          onChange={e => setTierForm({ ...tierForm, commissionPct: parseFloat(e.target.value) || 0 })}
                          className="w-full rounded border border-slate-300 p-1.5 font-bold text-purple-700"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">% Cupón Seguidores</label>
                        <input
                          type="number"
                          value={tierForm.couponDiscountPct ?? tier.couponDiscountPct}
                          onChange={e => setTierForm({ ...tierForm, couponDiscountPct: parseInt(e.target.value) || 0 })}
                          className="w-full rounded border border-slate-300 p-1.5 font-bold text-emerald-700"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Puntos Rewards Extra</label>
                        <input
                          type="number"
                          value={tierForm.bonusRewardPoints ?? tier.bonusRewardPoints}
                          onChange={e => setTierForm({ ...tierForm, bonusRewardPoints: parseInt(e.target.value) || 0 })}
                          className="w-full rounded border border-slate-300 p-1.5 font-bold text-amber-700"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Rango Ventas:</span>
                        <span className="font-bold text-slate-700">{tier.minBookings} a {tier.maxBookings || '∞'} reservas</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Comisión Cuota:</span>
                        <span className="font-extrabold text-purple-700 text-sm">{tier.commissionPct}%</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Cupón Seguidores:</span>
                        <span className="font-bold text-emerald-700">{tier.couponDiscountPct ? `${tier.couponDiscountPct}% OFF` : 'Sin cupón'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Bonus Rewards:</span>
                        <span className="font-bold text-amber-600">+{tier.bonusRewardPoints} pts</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PARTNERS / CREATORS TABLE */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-tech-blue mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-600" />
          Creators & Embajadores Registrados
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500">
              <tr>
                <th className="px-4 py-3">Creador / Embajador</th>
                <th className="px-4 py-3">Código de Afiliado</th>
                <th className="px-4 py-3 text-center">Nivel Actual</th>
                <th className="px-4 py-3 text-center">Reservas Concretadas</th>
                <th className="px-4 py-3">Cupón Asignado</th>
                <th className="px-4 py-3 text-right">Comisión Acumulada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {partners.map((p) => {
                const partnerTier = tiers.find(t => t.id === p.currentTierId) || tiers[0];
                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-tech-blue">{p.name}</div>
                      <div className="text-[10px] text-slate-400">{p.email}</div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-purple-700">
                      ref={p.refCode}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-extrabold text-purple-800 border border-purple-200">
                        {partnerTier.name} ({partnerTier.commissionPct}%)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-800 text-sm">
                      {p.totalBookingsConcreted}
                    </td>
                    <td className="px-4 py-3 font-mono text-emerald-700 font-bold">
                      {p.assignedCouponCode} ({p.assignedCouponDiscountPct}% OFF)
                    </td>
                    <td className="px-4 py-3 text-right font-black text-purple-800 text-sm">
                      ${p.totalCommissionEarned.toLocaleString('es-AR')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
