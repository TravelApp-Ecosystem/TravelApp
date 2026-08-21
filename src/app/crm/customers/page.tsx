'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, Search, Eye, Star, ChevronRight,
  Phone, Mail, Shield, Crown, Filter, UserPlus
} from 'lucide-react';
import { Lead, CustomerLevel } from '@/types/crm';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  const isVIP = customer.customerLevel === 2 || (customer.profileCompletedPercentage && customer.profileCompletedPercentage > 50);
  const familyCount = customer.familyMembers?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`p-6 border-b border-slate-100 ${isVIP ? 'bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent' : 'bg-slate-50'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-base shadow-sm ${isVIP ? 'bg-amber-500 text-white' : 'bg-tech-blue text-white'}`}>
                {customer.customerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{customer.customerName}</h2>
                <div className="mt-1 flex items-center gap-2">
                  <LevelBadge level={customer.customerLevel} />
                  <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${customer.customerStatus === 'Cliente' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {customer.customerStatus}
                  </span>
                  {customer.profileCompletedPercentage !== undefined && (
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {customer.profileCompletedPercentage}% datos
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-all">✕</button>
          </div>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Contact */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Teléfono / WhatsApp</p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">{customer.phone || 'No registrado'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5 truncate">{customer.email || 'No registrado'}</p>
            </div>
          </div>

          {/* Wallet / Points */}
          {customer.wallet && (
            <div className="rounded-xl border border-tech-blue/20 bg-tech-blue/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-tech-blue">Billetera & Fidelización</p>
                <p className="text-xs text-slate-500 mt-0.5">Saldo promocional y puntos acumulados</p>
              </div>
              <div className="flex gap-6 text-right">
                <div>
                  <p className="text-[10px] text-slate-400">Puntos Rewards</p>
                  <p className="text-lg font-black text-amber-600">⭐ {customer.wallet.pointsBalance.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Crédito ARS</p>
                  <p className="text-lg font-black text-tech-blue">${customer.wallet.cashCredit.toLocaleString('es-AR')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Documentos & Emisión IATA */}
          <div className="border-t border-slate-100 pt-3 space-y-2">
            <p className="text-xs font-black uppercase tracking-wide text-tech-blue">1. Documentación & Emisión de Pasajes</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <span className="text-slate-400 block text-[10px] font-bold">DOCUMENTO / DNI</span>
                <span className="font-bold text-slate-700">{customer.document?.number || '—'}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <span className="text-slate-400 block text-[10px] font-bold">PASAPORTE</span>
                <span className="font-bold text-slate-700">{customer.document?.type === 'Pasaporte' ? customer.document.number : (customer.document?.expiryDate ? `Vto: ${customer.document.expiryDate}` : '—')}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <span className="text-slate-400 block text-[10px] font-bold">NACIMIENTO / GÉNERO</span>
                <span className="font-bold text-slate-700">{customer.dob || '—'} {customer.gender ? `(${customer.gender})` : ''}</span>
              </div>
            </div>
          </div>

          {/* Grupo Familiar & Acompañantes */}
          <div className="border-t border-slate-100 pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-wide text-tech-blue flex items-center gap-1.5">
                👨‍👩‍👧‍👦 2. Grupo Familiar & Acompañantes Frecuentes ({familyCount})
              </p>
            </div>
            {customer.familyMembers && customer.familyMembers.length > 0 ? (
              <div className="space-y-2">
                {customer.familyMembers.map((fam, idx) => (
                  <div key={fam.id || idx} className="flex items-center justify-between bg-sky-50/60 border border-sky-100 p-2.5 rounded-xl text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{fam.fullName}</span>
                        <span className="bg-sky-200/70 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-md">{fam.relationship}</span>
                      </div>
                      <p className="text-slate-500 text-[11px]">
                        {fam.documentType}: <span className="font-mono font-medium">{fam.documentNumber}</span>
                        {fam.dob ? ` · Nac: ${fam.dob}` : ''}
                        {fam.gender ? ` (${fam.gender})` : ''}
                      </p>
                    </div>
                    {fam.dietaryRestrictions && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded-md">
                        🥗 {fam.dietaryRestrictions}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg">No posee familiares cargados aún.</p>
            )}
          </div>

          {/* Domicilio & Facturación AFIP */}
          <div className="border-t border-slate-100 pt-3 space-y-2">
            <p className="text-xs font-black uppercase tracking-wide text-tech-blue">3. Domicilio & Facturación (AFIP)</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <span className="text-slate-400 block text-[10px] font-bold">DOMICILIO RESIDENCIA</span>
                <span className="font-semibold text-slate-700">
                  {customer.address ? `${customer.address.street} ${customer.address.number || ''}, ${customer.address.city || ''} (${customer.address.province || ''})` : '—'}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg">
                <span className="text-slate-400 block text-[10px] font-bold">CONDICIÓN IVA / CUIT</span>
                <span className="font-bold text-slate-800">
                  {customer.taxData?.taxCondition || 'Consumidor Final'} {customer.taxData?.cuitCuil ? `· CUIT: ${customer.taxData.cuitCuil}` : ''}
                </span>
                {customer.taxData?.businessName && <span className="block text-slate-500 text-[11px]">{customer.taxData.businessName}</span>}
              </div>
            </div>
          </div>

          {/* Ficha Médica & Contacto Emergencia */}
          <div className="border-t border-slate-100 pt-3 space-y-2">
            <p className="text-xs font-black uppercase tracking-wide text-tech-blue">4. Ficha Médica & Emergencia</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-amber-50/70 border border-amber-200/60 p-2.5 rounded-lg">
                <span className="text-amber-800 block text-[10px] font-bold">CONTACTO DE EMERGENCIA</span>
                <span className="font-bold text-slate-800">{customer.emergencyContact?.name || '—'}</span>
                <span className="block text-slate-600 text-[11px]">{customer.emergencyContact?.phone} ({customer.emergencyContact?.relationship || 'Contacto'})</span>
              </div>
              <div className="bg-amber-50/70 border border-amber-200/60 p-2.5 rounded-lg">
                <span className="text-amber-800 block text-[10px] font-bold">ALERGIAS & DIETAS</span>
                <span className="font-bold text-amber-900">{customer.dietaryRestrictions || customer.allergies || customer.medicalSafety?.dietaryRestrictions || 'Sin restricciones'}</span>
                {customer.medicalSafety?.mobilityAssistance && <span className="block text-red-600 font-bold text-[10px]">♿ Requiere Asistencia Especial</span>}
              </div>
            </div>
          </div>

          {/* Preferencias VIP */}
          {customer.preferences && (
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <p className="text-xs font-black uppercase tracking-wide text-tech-blue">5. Preferencias de Viaje VIP</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded-lg text-center">
                  <span className="text-slate-400 block text-[10px] font-bold">ASIENTO</span>
                  <span className="font-bold text-slate-700">{customer.preferences.seatPreference || 'Indistinto'}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg text-center">
                  <span className="text-slate-400 block text-[10px] font-bold">HABITACIÓN</span>
                  <span className="font-bold text-slate-700">{customer.preferences.roomPreference || 'Matrimonial'}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg text-center">
                  <span className="text-slate-400 block text-[10px] font-bold">MILLAS</span>
                  <span className="font-bold text-slate-700">{customer.preferences.frequentFlyerProgram ? `${customer.preferences.frequentFlyerProgram}: ${customer.preferences.frequentFlyerNumber}` : '—'}</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────
export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [selected, setSelected] = useState<Lead | null>(null);
  const [users, setUsers] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      if (snapshot.empty) {
        setUsers(MOCK_CUSTOMERS);
      } else {
        const list: Lead[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            customerName: data.customerName || data.displayName || 'Pasajero Sin Nombre',
            phone: data.phone || '',
            email: data.email || '',
            status: data.status || 'Ganados/Perdidos',
            customerStatus: data.customerStatus || 'Cliente',
            customerLevel: data.customerLevel || 1,
            origin: data.origin || 'App Móvil',
            businessUnit: data.businessUnit || 'TravelCab',
            chatHistory: data.chatHistory || [],
            loyaltyPoints: data.rewardsPoints || data.loyaltyPoints || 0,
            wallet: data.wallet || {
              pointsBalance: data.rewardsPoints || 0,
              cashCredit: data.walletBalance || 0,
              transactions: []
            },
            dob: data.dob || '',
            gender: data.gender || undefined,
            nationality: data.nationality || undefined,
            occupation: data.occupation || '',
            document: data.document || (data.documentNumber ? { type: 'DNI', number: data.documentNumber } : undefined),
            address: data.address || undefined,
            emergencyContact: data.emergencyContact || undefined,
            allergies: data.allergies || '',
            dietaryRestrictions: data.dietaryRestrictions || '',
            medicalSafety: data.medicalSafety || undefined,
            taxData: data.taxData || undefined,
            preferences: data.preferences || undefined,
            familyMembers: data.familyMembers || undefined,
            profileCompletedPercentage: data.profileCompletedPercentage || undefined,
          } as Lead;
        });
        setUsers(list);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching real users:", error);
      setUsers(MOCK_CUSTOMERS);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = users.filter(c => {
    const matchName = c.customerName.toLowerCase().includes(search.toLowerCase());
    const matchLevel = filterLevel === 'all' || String(c.customerLevel) === filterLevel;
    return matchName && matchLevel;
  });

  const vipCount = users.filter(c => c.customerLevel === 2).length;
  const clientCount = users.filter(c => c.customerStatus === 'Cliente').length;
  const totalPoints = users.reduce((a, c) => a + (c.loyaltyPoints || 0), 0);

  return (
    <div className="flex h-full w-full flex-col bg-slate-50 p-6 gap-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-tech-blue">
            <Users className="h-7 w-7" /> Lista de Clientes
          </h1>
          <p className="mt-1 text-sm text-slate-500">Base de clientes y prospectos registrados en el ecosistema Concorde 360.</p>
        </div>
        <Link
          href="/experiences/customers/new"
          className="inline-flex items-center gap-2 bg-tech-blue hover:bg-tech-blue/90 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm w-fit"
        >
          <UserPlus className="h-4 w-4 text-emerald-400" />
          + Crear Nuevo Cliente
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Clientes', value: users.length, color: 'text-tech-blue' },
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
            type="text" placeholder="Buscar cliente..."
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
                {['Cliente', 'Contacto', 'Nivel', 'Estado', 'Unidad', 'Puntos', 'Acciones'].map(h => (
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
          <p className="text-xs text-slate-400">Mostrando {filtered.length} de {users.length} clientes</p>
        </div>
      </div>

      {/* Modal */}
      {selected && <CustomerModal customer={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
