'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users, QrCode, Copy, Check, Car, DollarSign,
  TrendingUp, Award, ArrowLeft, Download, ShieldCheck, Wallet
} from 'lucide-react';

export default function FleetSupervisorPortalPage() {
  const [copied, setCopied] = useState(false);

  // Supervisor Data
  const supervisor = {
    name: 'Fernando Gómez',
    role: 'Fleet Supervisor / Reclutador de Flota',
    referralCode: 'FERNANDO-CAB',
    commissionPct: 10.0, // 10% of company fee (20%)
    shareUrl: 'https://travelapp.com/signup/driver?ref=FERNANDO-CAB',
    totalRecruited: 12,
    activeDriversToday: 9,
    totalFleetRevenueThisMonth: 1485000,
    companyFeeCollected: 297000,
    supervisorCommissionEarned: 29700, // 10% of 297,000
    walletBalance: 29700,
  };

  const recruitedDrivers = [
    { id: 'DRV-001', name: 'Carlos Mamani', vehicle: 'VW Gol Trend (AB 123 CD)', status: 'Activo', tripsToday: 14, monthRevenue: 185000, commissionGenerated: 3700 },
    { id: 'DRV-003', name: 'Jorge Ruiz', vehicle: 'Toyota Corolla (GH 789 IJ)', status: 'Activo', tripsToday: 18, monthRevenue: 240000, commissionGenerated: 4800 },
    { id: 'DRV-005', name: 'Mariano Silva', vehicle: 'Fiat Cronos (AB 456 EF)', status: 'Activo', tripsToday: 11, monthRevenue: 155000, commissionGenerated: 3100 },
    { id: 'DRV-007', name: 'Valeria Luna', vehicle: 'Chevrolet Onix (DC 789 GH)', status: 'En Ruta', tripsToday: 9, monthRevenue: 130000, commissionGenerated: 2600 },
    { id: 'DRV-009', name: 'Esteban Morales', vehicle: 'Renault Logan (AE 112 KL)', status: 'Activo', tripsToday: 15, monthRevenue: 210000, commissionGenerated: 4200 },
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(supervisor.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full w-full flex-col bg-slate-50 p-6 gap-6 overflow-y-auto">

      {/* Back button */}
      <Link href="/hr" className="flex w-fit items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-tech-blue transition-colors">
        <ArrowLeft className="h-4 w-4" /> Volver a Panel de RRHH
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-tech-blue text-white rounded-2xl p-6 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-amber-300 mb-2 border border-white/10">
            <ShieldCheck className="h-4 w-4" />
            Portal de Fleet Supervisor
          </div>
          <h1 className="text-2xl font-black">{supervisor.name}</h1>
          <p className="text-xs text-slate-300 mt-1">
            Supervisión y Reclutamiento de Flota · Comisión Configurada: <strong className="text-amber-300">{supervisor.commissionPct}% del Fee de Empresa</strong>
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 flex items-center gap-4">
          <div>
            <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Mi Comisión Acumulada</p>
            <p className="text-2xl font-black text-amber-300">${supervisor.supervisorCommissionEarned.toLocaleString('es-AR')}</p>
          </div>
          <button className="rounded-lg bg-amber-400 hover:bg-amber-300 px-3 py-2 text-xs font-black text-slate-900 shadow-md transition-all active:scale-95">
            Solicitar Retiro
          </button>
        </div>
      </div>

      {/* Target Share QR Card & Referral Code */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Referral Card */}
        <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-tech-blue flex items-center gap-2">
              <QrCode className="h-5 w-5 text-amber-500" />
              Tu Código de Invitación Personal para Choferes
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Compartí tu código o enlace directo con los choferes que invites. Cada conductor que se registre con tu enlace quedará automáticamento vinculado a tu supervisión.
            </p>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 font-mono text-sm font-bold text-slate-700 flex justify-between items-center">
              <span>{supervisor.shareUrl}</span>
              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded font-sans font-bold">
                REF: {supervisor.referralCode}
              </span>
            </div>

            <button
              onClick={handleCopyLink}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-tech-blue px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-tech-blue/90 transition-all"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              {copied ? '¡Copiado!' : 'Copiar Enlace'}
            </button>
          </div>
        </div>

        {/* QR Preview Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 mb-3 shadow-inner">
            <QrCode className="h-24 w-24 text-slate-800" />
          </div>
          <p className="text-xs font-bold text-slate-700">QR de Alta Rápida de Conductor</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Escanear con la cámara del celular</p>
        </div>

      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Choferes Reclutados</p>
          <p className="text-2xl font-black text-tech-blue mt-1">{supervisor.totalRecruited}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Activos Hoy</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{supervisor.activeDriversToday} choferes</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Recaudación Flota (Mes)</p>
          <p className="text-2xl font-black text-tech-blue mt-1">${supervisor.totalFleetRevenueThisMonth.toLocaleString('es-AR')}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
          <p className="text-xs font-bold text-amber-800 uppercase">Fee Empresa (20%)</p>
          <p className="text-2xl font-black text-amber-600 mt-1">${supervisor.companyFeeCollected.toLocaleString('es-AR')}</p>
        </div>
      </div>

      {/* Recruited Drivers Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-tech-blue mb-4 flex items-center gap-2">
          <Car className="h-5 w-5 text-amber-500" />
          Choferes bajo tu Supervisión
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500">
              <tr>
                <th className="px-4 py-3">Chofer</th>
                <th className="px-4 py-3">Vehículo Registrado</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Viajes Hoy</th>
                <th className="px-4 py-3 text-right">Facturado (Mes)</th>
                <th className="px-4 py-3 text-right">Tu Comisión Generada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {recruitedDrivers.map((drv) => (
                <tr key={drv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-tech-blue">{drv.name}</div>
                    <div className="text-[10px] text-slate-400">{drv.id}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">{drv.vehicle}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                      {drv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-800">{drv.tripsToday}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-700">${drv.monthRevenue.toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3 text-right font-black text-amber-600">+${drv.commissionGenerated.toLocaleString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
