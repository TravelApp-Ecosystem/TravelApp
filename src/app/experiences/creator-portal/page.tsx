'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles, Award, QrCode, Copy, Check, Ticket,
  TrendingUp, ArrowLeft, ShieldCheck, Wallet, ChevronRight, Gift
} from 'lucide-react';

export default function ExperienceCreatorPortalPage() {
  const [copied, setCopied] = useState(false);

  // Mock Creator Data
  const creator = {
    name: 'María Florencia Travel',
    role: 'Experience Creator / Travel Ambassador',
    refCode: 'FLOR_TRAVEL',
    currentTierName: 'Level 2: Pro Creator',
    commissionPct: 5.0, // 5% per installment
    couponCode: 'FLOR10OFF',
    couponDiscountPct: 10,
    shareUrl: 'https://travelapp.com/experiences?aff=FLOR_TRAVEL',
    totalBookings: 8,
    nextTierMinBookings: 11,
    nextTierName: 'Level 3: Master Partner (7% comisión)',
    totalEarned: 48000,
    walletBalance: 48000,
    rewardsPoints: 2000,
  };

  // Mock Bookings with Installments Split
  const bookings = [
    {
      id: 'RES-901',
      experienceTitle: 'Excursión Valles Calchaquíes & Bodegas',
      customerName: 'Santiago Rossi',
      totalAmount: 120000,
      installmentsCount: 3,
      paidInstallments: 2,
      commissionPerInstallment: 2000, // 5% of $40,000 installment
      totalCommissionEarned: 4000,
      status: 'active',
    },
    {
      id: 'RES-902',
      experienceTitle: 'Trekking & Canopy San Javier',
      customerName: 'Laura Benítez',
      totalAmount: 60000,
      installmentsCount: 2,
      paidInstallments: 2,
      commissionPerInstallment: 1500, // 5% of $30,000 installment
      totalCommissionEarned: 3000,
      status: 'completed',
    },
    {
      id: 'RES-903',
      experienceTitle: 'City Tour Histórico & Gastronómico',
      customerName: 'Esteban Paz',
      totalAmount: 90000,
      installmentsCount: 3,
      paidInstallments: 1,
      commissionPerInstallment: 1500, // 5% of $30,000 installment
      totalCommissionEarned: 1500,
      status: 'active',
    },
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(creator.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const progressPct = Math.min(100, Math.round((creator.totalBookings / creator.nextTierMinBookings) * 100));

  return (
    <div className="flex h-full w-full flex-col bg-slate-50 p-6 gap-6 overflow-y-auto">
      
      {/* Back button */}
      <Link href="/marketing/partners" className="flex w-fit items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-tech-blue transition-colors">
        <ArrowLeft className="h-4 w-4" /> Volver a Panel de Marketing
      </Link>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-tech-blue text-white rounded-2xl p-6 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-amber-300 mb-2 border border-white/10">
            <Sparkles className="h-4 w-4" />
            Experience Creator & Ambassador Portal
          </div>
          <h1 className="text-2xl font-black">{creator.name}</h1>
          <p className="text-xs text-slate-300 mt-1">
            Nivel Actual: <strong className="text-amber-300">{creator.currentTierName}</strong> · Comisión por Cuota: <strong className="text-emerald-400">{creator.commissionPct}%</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 text-right">
            <p className="text-[11px] font-bold text-slate-300 uppercase">Comisiones Liquidadas</p>
            <p className="text-2xl font-black text-amber-300">${creator.walletBalance.toLocaleString('es-AR')}</p>
          </div>
          <div className="bg-amber-500/20 backdrop-blur-md rounded-xl p-4 border border-amber-500/30 text-right">
            <p className="text-[11px] font-bold text-amber-300 uppercase">Puntos Rewards</p>
            <p className="text-2xl font-black text-amber-400">+{creator.rewardsPoints}</p>
          </div>
        </div>
      </div>

      {/* GAMIFIED LEVEL PROGRESS BAR */}
      <div className="rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 via-indigo-50 to-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-purple-600" />
            <h3 className="text-sm font-black text-slate-800">
              Progreso de Nivel: {creator.totalBookings} / {creator.nextTierMinBookings} Reservas
            </h3>
          </div>
          <span className="text-xs font-extrabold text-purple-700 bg-purple-100 px-3 py-1 rounded-full border border-purple-200">
            ¡Faltan {creator.nextTierMinBookings - creator.totalBookings} reservas para subir a {creator.nextTierName}!
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden p-0.5 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-emerald-400 rounded-full transition-all duration-500 shadow-md"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* REFERRAL LINK & FOLLOWER COUPON CARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Link and Coupon */}
        <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-tech-blue flex items-center gap-2">
              <Ticket className="h-5 w-5 text-emerald-600" />
              Tu Enlace de Afiliado & Código de Descuento para Seguidores
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Compartí este código con tus seguidores para que reciban un <strong className="text-emerald-600">{creator.couponDiscountPct}% OFF</strong> en su viaje. ¡Al reservar con tu enlace cobrás tu comisión en cada cuota!
            </p>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 font-mono text-xs font-bold text-slate-700 flex justify-between items-center">
              <span>{creator.shareUrl}</span>
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded font-sans font-black border border-emerald-300">
                CUPÓN: {creator.couponCode}
              </span>
            </div>

            <button
              onClick={handleCopyLink}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-purple-700 transition-all"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
              {copied ? '¡Enlace Copiado!' : 'Copiar Enlace'}
            </button>
          </div>
        </div>

        {/* Coupon Card Preview */}
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-500 to-teal-700 p-6 text-white shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold opacity-80 mb-2">
              <span>TRAVELAPP EXPERIENCE</span>
              <span>VALIDEZ ACTIVA</span>
            </div>
            <p className="text-3xl font-black">{creator.couponDiscountPct}% OFF</p>
            <p className="text-xs opacity-90 mt-1">Beneficio exclusivo para tus clientes y seguidores.</p>
          </div>

          <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 text-center border border-white/20 mt-4">
            <span className="text-xs font-mono font-black text-amber-300 tracking-wider">
              {creator.couponCode}
            </span>
          </div>
        </div>

      </div>

      {/* BOOKINGS TABLE WITH INSTALLMENT SPLIT */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-tech-blue mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-600" />
          Reservas de Turismo & Split de Comisión por Cuota
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500">
              <tr>
                <th className="px-4 py-3">Reserva / Experiencia</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3 text-right">Monto Total</th>
                <th className="px-4 py-3 text-center">Cuotas Pagadas</th>
                <th className="px-4 py-3 text-right">Comisión por Cuota ({creator.commissionPct}%)</th>
                <th className="px-4 py-3 text-right">Tu Ganancia Acreditada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-tech-blue">{b.experienceTitle}</div>
                    <div className="text-[10px] text-slate-400">{b.id}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{b.customerName}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">${b.totalAmount.toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center rounded-full bg-purple-50 border border-purple-200 px-2.5 py-0.5 text-[11px] font-black text-purple-800">
                      {b.paidInstallments} de {b.installmentsCount} cuotas
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-700">+${b.commissionPerInstallment.toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3 text-right font-black text-emerald-600 text-sm">+${b.totalCommissionEarned.toLocaleString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
