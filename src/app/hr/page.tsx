'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users, Plus, Search, Eye, Wallet, CheckCircle,
  AlertCircle, XCircle, Clock, Car, ChevronRight,
  Filter, Download
} from 'lucide-react';
import { DriverPartner, PartnerStatus } from '@/types/partners';

// ── Mock Data ─────────────────────────────────────────────────
const MOCK_PARTNERS: DriverPartner[] = [
  {
    id: 'DRV-001',
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now(),
    firstName: 'Carlos',
    lastName: 'Mamani',
    dob: '1988-04-12',
    email: 'carlos.mamani@gmail.com',
    phone: '+54 381 456-7890',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
    address: {
      street: 'Av. Belgrano',
      number: '1250',
      city: 'San Miguel de Tucumán',
      province: 'Tucumán',
      postalCode: '4000',
    },
    taxInfo: { taxIdType: 'CUIL', taxIdNumber: '20-88441230-5' },
    bankInfo: { cbuCvu: '0000003100012345678901', alias: 'carlos.mamani.mp', accountHolder: 'Carlos Mamani' },
    vehicle: {
      id: 'VH-001',
      make: 'Volkswagen', model: 'Gol Trend', year: 2020,
      color: 'Blanco', licensePlate: 'AB 123 CD',
      sutrappa: { isActive: true, licenseNumber: 'REM-004512', holder: 'Carlos Mamani' },
    },
    driverLicenseUrl: '/docs/lic-001.pdf',
    status: 'Activo',
    wallet: { cashBalance: 12450.75, pointsBalance: 3200, transactions: [] },
  },
  {
    id: 'DRV-002',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now(),
    firstName: 'Romina',
    lastName: 'Herrera',
    dob: '1995-09-25',
    email: 'romina.h@hotmail.com',
    phone: '+54 381 333-1111',
    address: {
      street: 'Calle 25 de Mayo',
      number: '780',
      city: 'Yerba Buena',
      province: 'Tucumán',
      postalCode: '4107',
    },
    taxInfo: {
      taxIdType: 'CUIT',
      taxIdNumber: '27-95882340-4',
      registrationType: 'Monotributista',
    },
    bankInfo: { cbuCvu: '0000007900054321098765', alias: 'romina.herrera', accountHolder: 'Romina Herrera' },
    vehicle: {
      id: 'VH-002',
      make: 'Chevrolet', model: 'Onix', year: 2022,
      color: 'Gris', licensePlate: 'DC 456 EF',
      sutrappa: { isActive: false },
    },
    status: 'Pendiente Documentación',
    wallet: { cashBalance: 0, pointsBalance: 0, transactions: [] },
  },
  {
    id: 'DRV-003',
    createdAt: Date.now() - 86400000 * 90,
    updatedAt: Date.now() - 86400000 * 2,
    firstName: 'Jorge',
    lastName: 'Ruiz',
    dob: '1979-11-03',
    email: 'j.ruiz.conductor@gmail.com',
    phone: '+54 381 777-2222',
    address: {
      street: 'San Martín',
      number: '340',
      city: 'Tafí Viejo',
      province: 'Tucumán',
      postalCode: '4103',
    },
    taxInfo: { taxIdType: 'CUIL', taxIdNumber: '20-79334512-1' },
    bankInfo: { cbuCvu: '0000001500087654321098', alias: 'jorge.ruiz.taxi', accountHolder: 'Jorge Ruiz' },
    vehicle: {
      id: 'VH-003',
      make: 'Renault', model: 'Logan', year: 2018,
      color: 'Negro', licensePlate: 'GH 789 IJ',
      sutrappa: { isActive: true, licenseNumber: 'TAX-001234', holder: 'Jorge Ruiz' },
    },
    status: 'Suspendido',
    wallet: { cashBalance: 3200.00, pointsBalance: 800, transactions: [] },
  },
];

// ── Status Badge ──────────────────────────────────────────────
const StatusBadge = ({ status }: { status: PartnerStatus }) => {
  const config: Record<PartnerStatus, { color: string; icon: React.ReactNode; label: string }> = {
    'Activo': {
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <CheckCircle className="h-3.5 w-3.5" />,
      label: 'Activo',
    },
    'Pendiente Documentación': {
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: <Clock className="h-3.5 w-3.5" />,
      label: 'Pendiente Docs',
    },
    'Suspendido': {
      color: 'bg-red-50 text-red-700 border-red-200',
      icon: <XCircle className="h-3.5 w-3.5" />,
      label: 'Suspendido',
    },
    'En Revisión': {
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      label: 'En Revisión',
    },
  };
  const cfg = config[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
};

// ── Stats Card ────────────────────────────────────────────────
const StatCard = ({
  value, label, color
}: { value: number | string; label: string; color: string }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    <p className="mt-0.5 text-xs text-slate-500">{label}</p>
  </div>
);

// ── Main Component ────────────────────────────────────────────
export default function HRPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = MOCK_PARTNERS.filter(p => {
    const matchName = `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchName && matchStatus;
  });

  const counts = {
    total: MOCK_PARTNERS.length,
    active: MOCK_PARTNERS.filter(p => p.status === 'Activo').length,
    pending: MOCK_PARTNERS.filter(p => p.status === 'Pendiente Documentación').length,
    suspended: MOCK_PARTNERS.filter(p => p.status === 'Suspendido').length,
  };

  return (
    <div className="flex h-full w-full flex-col bg-slate-50 p-6 gap-6">

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-tech-blue">
            <Users className="h-7 w-7" />
            RRHH — Socios Conductores
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestión de socios, documentación y habilitaciones.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors">
            <Download className="h-4 w-4" />
            Exportar
          </button>
          <Link
            href="/hr/new-partner"
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-95"
            style={{ backgroundColor: '#ff6b00' }}
          >
            <Plus className="h-4 w-4" />
            Carga Manual de Conductor
          </Link>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard value={counts.total} label="Total Socios" color="text-tech-blue" />
        <StatCard value={counts.active} label="Activos" color="text-emerald-600" />
        <StatCard value={counts.pending} label="Pend. Documentación" color="text-amber-600" />
        <StatCard value={counts.suspended} label="Suspendidos" color="text-red-600" />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-700 shadow-sm outline-none focus:border-tech-blue/40 focus:ring-2 focus:ring-tech-blue/10 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-tech-blue/40 focus:ring-2 focus:ring-tech-blue/10 transition-all"
          >
            <option value="all">Todos los estados</option>
            <option value="Activo">Activos</option>
            <option value="Pendiente Documentación">Pendiente Docs</option>
            <option value="Suspendido">Suspendidos</option>
            <option value="En Revisión">En Revisión</option>
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Conductor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tax ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Vehículo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Sutrappa</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Billetera</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 text-sm">
                    No se encontraron socios con ese criterio.
                  </td>
                </tr>
              ) : (
                filtered.map(partner => (
                  <tr key={partner.id} className="group hover:bg-slate-50/60 transition-colors">
                    {/* Conductor */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-9 w-9 flex-shrink-0 rounded-full bg-slate-200 overflow-hidden"
                          style={{ border: '2px solid #e2e8f0' }}
                        >
                          {partner.photoUrl ? (
                            <img src={partner.photoUrl} alt={partner.firstName} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-500 font-bold text-sm">
                              {partner.firstName[0]}{partner.lastName[0]}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{partner.firstName} {partner.lastName}</p>
                          <p className="text-xs text-slate-400">{partner.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Tax ID */}
                    <td className="px-4 py-3">
                      <p className="text-xs font-mono text-slate-600">{partner.taxInfo.taxIdType}</p>
                      <p className="text-xs text-slate-400">{partner.taxInfo.taxIdNumber}</p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={partner.status} />
                    </td>

                    {/* Vehicle */}
                    <td className="px-4 py-3">
                      {partner.vehicle ? (
                        <div className="flex items-center gap-1.5">
                          <Car className="h-3.5 w-3.5 text-slate-400" />
                          <div>
                            <p className="text-xs font-medium text-slate-700">
                              {partner.vehicle.make} {partner.vehicle.model}
                            </p>
                            <p className="text-xs text-slate-400 font-mono">{partner.vehicle.licensePlate}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Sin vehículo</span>
                      )}
                    </td>

                    {/* Sutrappa */}
                    <td className="px-4 py-3">
                      {partner.vehicle?.sutrappa.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          <CheckCircle className="h-3 w-3" />
                          {partner.vehicle.sutrappa.licenseNumber}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>

                    {/* Wallet */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        <p className="text-xs font-bold text-tech-blue">
                          ${partner.wallet.cashBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-slate-400">{partner.wallet.pointsBalance.toLocaleString()} pts</p>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/hr/${partner.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:border-tech-blue/30 hover:text-tech-blue transition-all group-hover:shadow-md"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver Perfil
                        <ChevronRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2.5">
          <p className="text-xs text-slate-400">
            Mostrando {filtered.length} de {MOCK_PARTNERS.length} socios registrados
          </p>
        </div>
      </div>

    </div>
  );
}
