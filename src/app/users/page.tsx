'use client';

import React, { useState } from 'react';
import {
  Users, Search, Eye, Star, ChevronRight,
  Phone, Mail, Shield, Crown, Filter
} from 'lucide-react';
import { Lead, CustomerLevel } from '@/types/crm';

// ── Mock Customers ────────────────────────────────────────────
const MOCK_CUSTOMERS: Lead[] = [
  {
    id: 'CUS-001',
    customerName: 'Ana García',
    phone: '+54 381 111-2222',
    email: 'ana.garcia@gmail.com',
    status: 'Ganados/Perdidos',
    customerStatus: 'Cliente',
    customerLevel: 2,
    origin: 'WhatsApp',
    businessUnit: 'TravelCab',
    chatHistory: [],
    loyaltyPoints: 4800,
    wallet: { pointsBalance: 4800, cashCredit: 250, transactions: [] },
    dob: '1990-03-15',
    occupation: 'Contadora',
    document: { type: 'DNI', number: '32.441.230' },
    address: { street: 'Laprida', number: '560', city: 'Tucumán', province: 'Tucumán', postalCode: '4000' },
    emergencyContact: { name: 'Roberto García', phone: '+54 381 333-4444', relationship: 'Padre' },
    allergies: 'Mariscos',
  },
  {
    id: 'CUS-002',
    customerName: 'Martín López',
    phone: '+54 381 555-6666',
    email: 'martin.l@hotmail.com',
    status: 'Agendados',
    customerStatus: 'Prospecto',
    customerLevel: 1,
    origin: 'Web',
    businessUnit: 'Experiencias',
    chatHistory: [],
    loyaltyPoints: 0,
  },
  {
    id: 'CUS-003',
    customerName: 'Laura Rodríguez',
    phone: '+54 381 777-8888',
    email: 'laurarod@gmail.com',
    status: 'Ganados/Perdidos',
    customerStatus: 'Cliente',
    customerLevel: 2,
    origin: 'IG',
    businessUnit: 'Rewards',
    chatHistory: [],
    loyaltyPoints: 12500,
    wallet: { pointsBalance: 12500, cashCredit: 800, transactions: [] },
    dob: '1985-08-22',
    occupation: 'Médica',
    document: { type: 'Pasaporte', number: 'AAB123456', expiryDate: '2028-05-01' },
    address: { street: 'San Martín', number: '1100', city: 'Yerba Buena', province: 'Tucumán', postalCode: '4107' },
    emergencyContact: { name: 'Pedro Rodríguez', phone: '+54 381 999-0000', relationship: 'Esposo' },
    dietaryRestrictions: 'Vegana',
  },
  {
    id: 'CUS-004',
    customerName: 'Diego Sánchez',
    phone: '+54 381 221-3344',
    status: 'Nuevos',
    customerStatus: 'Prospecto',
    customerLevel: 1,
    origin: 'Messenger',
    businessUnit: 'TravelCab',
    chatHistory: [],
  },
];

// ── Level Badge ───────────────────────────────────────────────
const LevelBadge = ({ level }: { level: CustomerLevel }) =>
  level === 2 ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
      <Crown className="h-3 w-3" /> VIP Nivel 2
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
      Nivel 1
    </span>
  );

// ── Customer Modal ────────────────────────────────────────────
const CustomerModal = ({ customer, onClose }: { customer: Lead; onClose: () => void }) => {
  const isVIP = customer.customerLevel === 2;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`rounded-t-2xl p-5 ${isVIP ? 'bg-gradient-to-r from-amber-50 to-orange-50' : 'bg-slate-50'}`}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">{customer.customerName}</h2>
              <div className="mt-1 flex items-center gap-2">
                <LevelBadge level={customer.customerLevel} />
                <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${customer.customerStatus === 'Cliente' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {customer.customerStatus}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all">✕</button>
          </div>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Contact */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Contacto</p>
            {customer.phone && <p className="flex items-center gap-2 text-sm text-slate-700"><Phone className="h-3.5 w-3.5 text-slate-400" />{customer.phone}</p>}
            {customer.email && <p className="flex items-center gap-2 text-sm text-slate-700"><Mail className="h-3.5 w-3.5 text-slate-400" />{customer.email}</p>}
          </div>

          {/* Wallet */}
          {customer.wallet && (
            <div className="rounded-xl border border-tech-blue/20 bg-tech-blue/5 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-tech-blue mb-2">Billetera</p>
              <div className="flex gap-4">
                <div>
                  <p className="text-[10px] text-slate-400">Puntos</p>
                  <p className="text-lg font-bold text-tech-blue">{customer.wallet.pointsBalance.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Crédito</p>
                  <p className="text-lg font-bold text-tech-blue">${customer.wallet.cashCredit.toLocaleString('es-AR')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Level 2 extended */}
          {isVIP && (
            <>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Datos Personales (Nivel 2)</p>
                {customer.dob && <p className="text-sm text-slate-600"><span className="font-medium">Nacimiento:</span> {customer.dob}</p>}
                {customer.occupation && <p className="text-sm text-slate-600"><span className="font-medium">Ocupación:</span> {customer.occupation}</p>}
              </div>

              {customer.document && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Documento</p>
                  <p className="flex items-center gap-2 text-sm text-slate-600">
                    <Shield className="h-3.5 w-3.5 text-slate-400" />
                    {customer.document.type}: {customer.document.number}
                    {customer.document.expiryDate && <span className="text-xs text-slate-400">(vto: {customer.document.expiryDate})</span>}
                  </p>
                </div>
              )}

              {customer.address && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Domicilio</p>
                  <p className="text-sm text-slate-600 mt-1">
                    {customer.address.street} {customer.address.number}, {customer.address.city}, {customer.address.province} ({customer.address.postalCode})
                  </p>
                </div>
              )}

              {customer.emergencyContact && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Contacto de Emergencia</p>
                  <p className="text-sm text-slate-600 mt-1 font-medium">{customer.emergencyContact.name}</p>
                  <p className="text-sm text-slate-500">{customer.emergencyContact.phone} · {customer.emergencyContact.relationship}</p>
                </div>
              )}

              {(customer.allergies || customer.dietaryRestrictions) && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600">Alergias / Dieta</p>
                  {customer.allergies && <p className="text-sm text-amber-800 mt-1">Alergia: {customer.allergies}</p>}
                  {customer.dietaryRestrictions && <p className="text-sm text-amber-800">Dieta: {customer.dietaryRestrictions}</p>}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────
export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [selected, setSelected] = useState<Lead | null>(null);

  const filtered = MOCK_CUSTOMERS.filter(c => {
    const matchName = c.customerName.toLowerCase().includes(search.toLowerCase());
    const matchLevel = filterLevel === 'all' || String(c.customerLevel) === filterLevel;
    return matchName && matchLevel;
  });

  const vipCount = MOCK_CUSTOMERS.filter(c => c.customerLevel === 2).length;
  const clientCount = MOCK_CUSTOMERS.filter(c => c.customerStatus === 'Cliente').length;
  const totalPoints = MOCK_CUSTOMERS.reduce((a, c) => a + (c.loyaltyPoints || 0), 0);

  return (
    <div className="flex h-full w-full flex-col bg-slate-50 p-6 gap-6">

      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-tech-blue">
          <Users className="h-7 w-7" /> Gestión de Usuarios
        </h1>
        <p className="mt-1 text-sm text-slate-500">Base de clientes y prospectos del ecosistema TravelApp.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Usuarios', value: MOCK_CUSTOMERS.length, color: 'text-tech-blue' },
          { label: 'Clientes Activos', value: clientCount, color: 'text-emerald-600' },
          { label: 'VIP Nivel 2', value: vipCount, color: 'text-amber-600' },
          { label: 'Puntos Totales', value: totalPoints.toLocaleString(), color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="mt-0.5 text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text" placeholder="Buscar usuario..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-700 shadow-sm outline-none focus:border-tech-blue/40 focus:ring-2 focus:ring-tech-blue/10 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none">
            <option value="all">Todos los niveles</option>
            <option value="1">Nivel 1 — Básico</option>
            <option value="2">Nivel 2 — VIP</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                {['Usuario', 'Contacto', 'Nivel', 'Estado', 'Unidad', 'Puntos', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(c => (
                <tr key={c.id} className="group hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-tech-blue/10 text-xs font-bold text-tech-blue">
                        {c.customerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{c.customerName}</p>
                        <p className="text-xs font-mono text-slate-400">{c.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-slate-600">{c.phone || '—'}</p>
                    <p className="text-xs text-slate-400">{c.email || '—'}</p>
                  </td>
                  <td className="px-4 py-3"><LevelBadge level={c.customerLevel} /></td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${c.customerStatus === 'Cliente' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {c.customerStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{c.businessUnit}</td>
                  <td className="px-4 py-3">
                    {c.loyaltyPoints ? (
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                        <Star className="h-3 w-3" />{c.loyaltyPoints.toLocaleString()}
                      </div>
                    ) : <span className="text-xs text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(c)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:border-tech-blue/30 hover:text-tech-blue transition-all group-hover:shadow-md">
                      <Eye className="h-3.5 w-3.5" /> Ver
                      <ChevronRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2.5">
          <p className="text-xs text-slate-400">Mostrando {filtered.length} de {MOCK_CUSTOMERS.length} usuarios</p>
        </div>
      </div>

      {/* Modal */}
      {selected && <CustomerModal customer={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
