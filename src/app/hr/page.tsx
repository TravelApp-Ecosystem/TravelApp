'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, Plus, Search, Eye, CheckCircle,
  AlertCircle, XCircle, Clock, Car, ChevronRight,
  Filter, Download, Briefcase, FileText, ExternalLink,
  RefreshCw, Mail, Phone, Calendar,
} from 'lucide-react';
import { DriverPartner, PartnerStatus } from '@/types/partners';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
    address: { street: 'Av. Belgrano', number: '1250', city: 'San Miguel de Tucumán', province: 'Tucumán', postalCode: '4000' },
    taxInfo: { taxIdType: 'CUIL', taxIdNumber: '20-88441230-5' },
    bankInfo: { cbuCvu: '0000003100012345678901', alias: 'carlos.mamani.mp', accountHolder: 'Carlos Mamani' },
    vehicle: { id: 'VH-001', make: 'Volkswagen', model: 'Gol Trend', year: 2020, color: 'Blanco', licensePlate: 'AB 123 CD', sutrappa: { isActive: true, licenseNumber: 'REM-004512', holder: 'Carlos Mamani' } },
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
    address: { street: 'Calle 25 de Mayo', number: '780', city: 'Yerba Buena', province: 'Tucumán', postalCode: '4107' },
    taxInfo: { taxIdType: 'CUIT', taxIdNumber: '27-95882340-4', registrationType: 'Monotributista' },
    bankInfo: { cbuCvu: '0000007900054321098765', alias: 'romina.herrera', accountHolder: 'Romina Herrera' },
    vehicle: { id: 'VH-002', make: 'Chevrolet', model: 'Onix', year: 2022, color: 'Gris', licensePlate: 'DC 456 EF', sutrappa: { isActive: false } },
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
    email: 'jorge.ruiz@yahoo.com',
    phone: '+54 381 777-2222',
    address: { street: 'San Martín', number: '540', city: 'Banda del Río Salí', province: 'Tucumán', postalCode: '4109' },
    taxInfo: { taxIdType: 'CUIL', taxIdNumber: '20-79112345-8' },
    bankInfo: { cbuCvu: '0000001500078912345612', alias: 'jorge.ruiz.tc', accountHolder: 'Jorge Ruiz' },
    vehicle: { id: 'VH-003', make: 'Toyota', model: 'Corolla', year: 2019, color: 'Plata', licensePlate: 'GH 789 IJ', sutrappa: { isActive: true, licenseNumber: 'REM-002277', holder: 'Jorge Ruiz' } },
    driverLicenseUrl: '/docs/lic-003.pdf',
    status: 'Activo',
    wallet: { cashBalance: 34120.00, pointsBalance: 8750, transactions: [] },
  },
  {
    id: 'DRV-004',
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now() - 86400000 * 1,
    firstName: 'Ana',
    lastName: 'Torres',
    dob: '2001-03-18',
    email: 'ana.torres.tuc@gmail.com',
    phone: '+54 381 555-9999',
    address: { street: 'Laprida', number: '890', city: 'San Miguel de Tucumán', province: 'Tucumán', postalCode: '4000' },
    taxInfo: { taxIdType: 'CUIL', taxIdNumber: '27-01123456-2' },
    bankInfo: { cbuCvu: '', alias: '', accountHolder: '' },
    vehicle: { id: 'VH-004', make: 'Renault', model: 'Kwid', year: 2023, color: 'Rojo', licensePlate: 'KL 012 MN', sutrappa: { isActive: false } },
    status: 'En Revisión',
    wallet: { cashBalance: 0, pointsBalance: 300, transactions: [] },
  },
];

// ── Status Badge ──────────────────────────────────────────────
const STATUS_CONFIG: Record<PartnerStatus, { icon: React.ReactNode; label: string; cls: string }> = {
  'Activo':                  { icon: <CheckCircle className="h-3 w-3" />, label: 'Activo', cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  'Pendiente Documentación': { icon: <Clock className="h-3 w-3" />, label: 'Pendiente Docs', cls: 'bg-amber-50 border-amber-200 text-amber-700' },
  'Suspendido':              { icon: <XCircle className="h-3 w-3" />, label: 'Suspendido', cls: 'bg-red-50 border-red-200 text-red-700' },
  'En Revisión':             { icon: <AlertCircle className="h-3 w-3" />, label: 'En Revisión', cls: 'bg-blue-50 border-blue-200 text-blue-700' },
};

const StatusBadge = ({ status }: { status: PartnerStatus }) => {
  const cfg = STATUS_CONFIG[status] ?? { icon: null, label: status, cls: 'bg-slate-100 border-slate-200 text-slate-600' };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cfg.cls}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
};

// ── Job Application Types ─────────────────────────────────────
type AppStatus = 'Recibida' | 'En Revisión' | 'Entrevista Agendada' | 'Contratado' | 'Descartado';
interface JobApplication {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  puesto: string;
  mensaje: string;
  cvUrl: string;
  cvFileName: string;
  status: AppStatus;
  createdAt: number;
}

const APP_STATUS_ORDER: AppStatus[] = ['Recibida', 'En Revisión', 'Entrevista Agendada', 'Contratado', 'Descartado'];

const APP_STATUS_STYLES: Record<AppStatus, string> = {
  'Recibida':            'bg-blue-50 border-blue-200 text-blue-700',
  'En Revisión':         'bg-amber-50 border-amber-200 text-amber-700',
  'Entrevista Agendada': 'bg-purple-50 border-purple-200 text-purple-700',
  'Contratado':          'bg-emerald-50 border-emerald-200 text-emerald-700',
  'Descartado':          'bg-red-50 border-red-200 text-red-700',
};

// ── Stats Card ────────────────────────────────────────────────
const StatCard = ({ value, label, color }: { value: number | string; label: string; color: string }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    <p className="mt-0.5 text-xs text-slate-500">{label}</p>
  </div>
);

// ── Main Component ────────────────────────────────────────────
export default function HRPage() {
  const [activeHRTab, setActiveHRTab] = useState<'socios' | 'postulaciones'>('socios');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Job applications state
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [appSearch, setAppSearch] = useState('');
  const [appFilterStatus, setAppFilterStatus] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Real-time listener for job_applications
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'job_applications'),
      (snapshot) => {
        const apps: JobApplication[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<JobApplication, 'id'>),
        }));
        apps.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setApplications(apps);
        setAppsLoading(false);
      },
      (err) => { console.error('Error loading job_applications:', err); setAppsLoading(false); }
    );
    return () => unsub();
  }, []);

  const updateAppStatus = async (appId: string, newStatus: AppStatus) => {
    setUpdatingId(appId);
    try {
      await updateDoc(doc(db, 'job_applications', appId), { status: newStatus });
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

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

  const filteredApps = applications.filter(a => {
    const matchName = `${a.nombre} ${a.apellido}`.toLowerCase().includes(appSearch.toLowerCase()) ||
      a.email.toLowerCase().includes(appSearch.toLowerCase()) ||
      a.puesto.toLowerCase().includes(appSearch.toLowerCase());
    const matchStatus = appFilterStatus === 'all' || a.status === appFilterStatus;
    return matchName && matchStatus;
  });

  const appCounts = {
    total: applications.length,
    recibida: applications.filter(a => a.status === 'Recibida').length,
    entrevista: applications.filter(a => a.status === 'Entrevista Agendada').length,
    contratado: applications.filter(a => a.status === 'Contratado').length,
  };

  return (
    <div className="flex h-full w-full flex-col bg-slate-50 p-6 gap-6">

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-tech-blue">
            <Users className="h-7 w-7" />
            RRHH — Gestión de Personal
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Socios conductores y postulaciones recibidas desde la landing pública.
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

      {/* ── Tab Switcher ── */}
      <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1 shadow-sm w-fit">
        <button
          onClick={() => setActiveHRTab('socios')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeHRTab === 'socios' ? 'bg-tech-blue text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Car className="h-4 w-4" />
          Socios Conductores
          <span className={`ml-1 text-[10px] font-black px-1.5 py-0.5 rounded-full ${
            activeHRTab === 'socios' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
          }`}>{counts.total}</span>
        </button>
        <button
          onClick={() => setActiveHRTab('postulaciones')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeHRTab === 'postulaciones' ? 'bg-tech-blue text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Briefcase className="h-4 w-4" />
          Postulaciones
          {appCounts.recibida > 0 && (
            <span className={`ml-1 text-[10px] font-black px-1.5 py-0.5 rounded-full ${
              activeHRTab === 'postulaciones' ? 'bg-lime-400 text-slate-900' : 'bg-red-100 text-red-600'
            }`}>{appCounts.recibida} nueva{appCounts.recibida !== 1 ? 's' : ''}</span>
          )}
        </button>
      </div>

      {/* ════ TAB: SOCIOS ════ */}
      {activeHRTab === 'socios' && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard value={counts.total} label="Total Socios" color="text-tech-blue" />
            <StatCard value={counts.active} label="Activos" color="text-emerald-600" />
            <StatCard value={counts.pending} label="Pend. Documentación" color="text-amber-600" />
            <StatCard value={counts.suspended} label="Suspendidos" color="text-red-600" />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text" placeholder="Buscar por nombre..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-700 shadow-sm outline-none focus:border-tech-blue/40 focus:ring-2 focus:ring-tech-blue/10 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-tech-blue/40 focus:ring-2 focus:ring-tech-blue/10 transition-all">
                <option value="all">Todos los estados</option>
                <option value="Activo">Activos</option>
                <option value="Pendiente Documentación">Pendiente Docs</option>
                <option value="Suspendido">Suspendidos</option>
                <option value="En Revisión">En Revisión</option>
              </select>
            </div>
          </div>

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
                    <tr><td colSpan={7} className="py-16 text-center text-slate-400 text-sm">No se encontraron socios con ese criterio.</td></tr>
                  ) : (
                    filtered.map(partner => (
                      <tr key={partner.id} className="group hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 flex-shrink-0 rounded-full bg-slate-200 overflow-hidden" style={{ border: '2px solid #e2e8f0' }}>
                              {partner.photoUrl
                                ? <img src={partner.photoUrl} alt={partner.firstName} className="h-full w-full object-cover" />
                                : <div className="flex h-full w-full items-center justify-center text-slate-500 font-bold text-sm">{partner.firstName[0]}{partner.lastName[0]}</div>}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{partner.firstName} {partner.lastName}</p>
                              <p className="text-xs text-slate-400">{partner.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-mono text-slate-600">{partner.taxInfo.taxIdType}</p>
                          <p className="text-xs text-slate-400">{partner.taxInfo.taxIdNumber}</p>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={partner.status} /></td>
                        <td className="px-4 py-3">
                          {partner.vehicle
                            ? <div className="flex items-center gap-1.5"><Car className="h-3.5 w-3.5 text-slate-400" /><div><p className="text-xs font-medium text-slate-700">{partner.vehicle.make} {partner.vehicle.model}</p><p className="text-xs text-slate-400 font-mono">{partner.vehicle.licensePlate}</p></div></div>
                            : <span className="text-xs text-slate-400">Sin vehículo</span>}
                        </td>
                        <td className="px-4 py-3">
                          {partner.vehicle?.sutrappa.isActive
                            ? <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-semibold text-blue-700"><CheckCircle className="h-3 w-3" />{partner.vehicle.sutrappa.licenseNumber}</span>
                            : <span className="text-xs text-slate-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-col items-end gap-0.5">
                            <p className="text-xs font-bold text-tech-blue">${partner.wallet.cashBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                            <p className="text-xs text-slate-400">{partner.wallet.pointsBalance.toLocaleString()} pts</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/hr/${partner.id}`} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:border-tech-blue/30 hover:text-tech-blue transition-all group-hover:shadow-md">
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
            <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2.5">
              <p className="text-xs text-slate-400">Mostrando {filtered.length} de {MOCK_PARTNERS.length} socios registrados</p>
            </div>
          </div>
        </>
      )}

      {/* ════ TAB: POSTULACIONES ════ */}
      {activeHRTab === 'postulaciones' && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard value={appCounts.total} label="Total Postulaciones" color="text-tech-blue" />
            <StatCard value={appCounts.recibida} label="Recibidas (Nuevas)" color="text-blue-600" />
            <StatCard value={appCounts.entrevista} label="En Entrevista" color="text-purple-600" />
            <StatCard value={appCounts.contratado} label="Contratados" color="text-emerald-600" />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text" placeholder="Buscar por nombre, email o área..."
                value={appSearch} onChange={e => setAppSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-700 shadow-sm outline-none focus:border-tech-blue/40 focus:ring-2 focus:ring-tech-blue/10 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select value={appFilterStatus} onChange={e => setAppFilterStatus(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-tech-blue/40 focus:ring-2 focus:ring-tech-blue/10 transition-all">
                <option value="all">Todos los estados</option>
                {APP_STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {appsLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Cargando postulaciones en tiempo real...
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-16 text-center">
              <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-medium">
                {applications.length === 0
                  ? 'Aún no hay postulaciones. Se recibirán a través del formulario en travelapp.ar.'
                  : 'No hay postulaciones con ese criterio.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApps.map(app => (
                <div key={app.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="h-11 w-11 rounded-xl bg-tech-blue/10 flex items-center justify-center text-tech-blue font-black text-sm flex-shrink-0">
                        {app.nombre?.[0]}{app.apellido?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-800">{app.nombre} {app.apellido}</p>
                        <p className="text-xs text-tech-blue font-bold">{app.puesto}</p>
                        <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{app.email}</span>
                          {app.telefono && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{app.telefono}</span>}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {app.createdAt ? new Date(app.createdAt).toLocaleDateString('es-AR') : '—'}
                          </span>
                        </div>
                        {app.mensaje && (
                          <p className="mt-2 text-xs text-slate-500 line-clamp-2 max-w-lg italic">"{app.mensaje}"</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5 items-start sm:items-end flex-shrink-0">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black ${APP_STATUS_STYLES[app.status] || 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        {app.status}
                      </span>
                      <select
                        value={app.status}
                        disabled={updatingId === app.id}
                        onChange={(e) => updateAppStatus(app.id, e.target.value as AppStatus)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 outline-none focus:border-tech-blue/40 cursor-pointer disabled:opacity-50 transition-all"
                      >
                        {APP_STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {app.cvUrl && (
                        <a href={app.cvUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-tech-blue/30 bg-tech-blue/5 hover:bg-tech-blue/10 px-3 py-1.5 text-xs font-bold text-tech-blue transition-colors">
                          <FileText className="h-3.5 w-3.5" />
                          Descargar CV
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-xs text-slate-400 text-center">
            {filteredApps.length} de {applications.length} postulaciones · Actualizando en tiempo real
          </div>
        </>
      )}

    </div>
  );
}
