'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    Users, UserPlus, Search, FileText, Phone, Mail, ShieldCheck,
    Globe, Compass, Building2, Sparkles, ArrowRight, CheckCircle2,
    CreditCard, Calendar
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

interface UnifiedCustomerRecord {
    id: string;
    fullName: string;
    documentNumber: string;
    email: string;
    phone: string;
    roleType: 'cliente_titular' | 'pasajero_viajero' | 'usuario_web';
    businessUnit: 'travelapp' | 'experience_b2b' | 'lunaviajera' | 'ecosistema';
    originLabel: string;
    filesCount: number;
    lastServiceName?: string;
    nationality?: string;
}

export default function UnifiedTourismCustomersPage() {
    const [records, setRecords] = useState<UnifiedCustomerRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [unitFilter, setUnitFilter] = useState<'ALL' | 'travelapp' | 'experience_b2b' | 'lunaviajera'>('ALL');
    const [roleFilter, setRoleFilter] = useState<'ALL' | 'cliente_titular' | 'pasajero_viajero' | 'usuario_web'>('ALL');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const loadUnifiedRegistry = async () => {
            setLoading(true);
            try {
                const [crmSnap, resSnap, usersSnap] = await Promise.all([
                    getDocs(collection(db, 'crm_customers')),
                    getDocs(query(collection(db, 'experience_reservations'), orderBy('createdAt', 'desc'))),
                    getDocs(collection(db, 'users'))
                ]);

                const mapByKey = new Map<string, UnifiedCustomerRecord>();

                // 1. Clientes dados de alta en CRM / Alta IATA
                crmSnap.docs.forEach(d => {
                    const data = d.data();
                    const fullName =
                        data.fullName ||
                        `${data.firstName || ''} ${data.lastName || ''}`.trim() ||
                        data.name ||
                        'Cliente Registrado';
                    const docNum = data.dni || data.passportNumber || data.documentNumber || 'S/D';
                    const key = (data.email || docNum || d.id).toLowerCase();

                    mapByKey.set(key, {
                        id: d.id,
                        fullName,
                        documentNumber: docNum,
                        email: data.email || '',
                        phone: data.phone || data.whatsapp || '',
                        roleType: 'cliente_titular',
                        businessUnit: (data.businessUnit as any) || 'travelapp',
                        originLabel: data.source || 'Padrón IATA / CRM',
                        filesCount: 0,
                        nationality: data.nationality || 'Argentina',
                    });
                });

                // 2. Titulares y Pasajeros dentro de Files & Reservas (experience_reservations)
                resSnap.docs.forEach(d => {
                    const r = d.data();
                    const unit: 'travelapp' | 'experience_b2b' | 'lunaviajera' =
                        r.businessUnit === 'experience_b2b' || r.hotelPartnerName
                            ? 'experience_b2b'
                            : r.businessUnit === 'lunaviajera' ||
                              String(r.source || '').toLowerCase().includes('luna')
                            ? 'lunaviajera'
                            : 'travelapp';

                    const holderName = r.customerName || r.passengerName || 'Titular Reserva';
                    const holderDoc = r.customerDni || r.dni || 'S/D';
                    const holderKey = (r.customerEmail || holderDoc || holderName).toLowerCase();

                    if (mapByKey.has(holderKey)) {
                        const existing = mapByKey.get(holderKey)!;
                        existing.filesCount += 1;
                        existing.lastServiceName = r.tourName || existing.lastServiceName;
                    } else {
                        mapByKey.set(holderKey, {
                            id: `res-holder-${d.id}`,
                            fullName: holderName,
                            documentNumber: holderDoc,
                            email: r.customerEmail || '',
                            phone: r.customerPhone || '',
                            roleType: 'cliente_titular',
                            businessUnit: unit,
                            originLabel: r.hotelPartnerName
                                ? `Huésped ${r.hotelPartnerName}`
                                : r.source || 'Reserva / File Activo',
                            filesCount: 1,
                            lastServiceName: r.tourName || 'Servicio Turístico',
                        });
                    }

                    // Acompañantes / Lista de Pasajeros del File
                    if (Array.isArray(r.passengersList)) {
                        r.passengersList.forEach((pax: any, idx: number) => {
                            if (!pax?.fullName) return;
                            const paxKey = `${pax.dni || pax.fullName}-${idx}`.toLowerCase();
                            if (!mapByKey.has(paxKey)) {
                                mapByKey.set(paxKey, {
                                    id: `pax-${d.id}-${idx}`,
                                    fullName: pax.fullName,
                                    documentNumber: pax.dni || 'S/D',
                                    email: '',
                                    phone: '',
                                    roleType: 'pasajero_viajero',
                                    businessUnit: unit,
                                    originLabel: `Pasajero en File ${r.fileCode || d.id.slice(0, 6)}`,
                                    filesCount: 1,
                                    lastServiceName: r.tourName,
                                });
                            }
                        });
                    }
                });

                // 3. Usuarios registrados en Web / App
                usersSnap.docs.forEach(d => {
                    const u = d.data();
                    const email = u.email || '';
                    const key = (email || d.id).toLowerCase();
                    if (!mapByKey.has(key)) {
                        mapByKey.set(key, {
                            id: d.id,
                            fullName: u.displayName || u.name || email.split('@')[0] || 'Usuario App',
                            documentNumber: u.dni || 'Web User',
                            email,
                            phone: u.phone || '',
                            roleType: 'usuario_web',
                            businessUnit: 'ecosistema',
                            originLabel: `Cuenta Registrada (${u.role || 'Pasajero'})`,
                            filesCount: 0,
                        });
                    }
                });

                setRecords(Array.from(mapByKey.values()));
            } catch (err) {
                console.error('Error loading unified customer registry:', err);
            } finally {
                setLoading(false);
            }
        };

        loadUnifiedRegistry();
    }, []);

    const filteredRecords = useMemo(() => {
        return records.filter(rec => {
            if (unitFilter !== 'ALL' && rec.businessUnit !== unitFilter) return false;
            if (roleFilter !== 'ALL' && rec.roleType !== roleFilter) return false;
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            return (
                rec.fullName.toLowerCase().includes(q) ||
                rec.documentNumber.toLowerCase().includes(q) ||
                rec.email.toLowerCase().includes(q) ||
                rec.originLabel.toLowerCase().includes(q) ||
                (rec.lastServiceName || '').toLowerCase().includes(q)
            );
        });
    }, [records, unitFilter, roleFilter, search]);

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider">
                        <Users className="w-3.5 h-3.5" />
                        Concorde 360 · Padrón Unificado de Turismo
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900">
                        Registro de Usuarios, Pasajeros, Clientes y Reservas
                    </h1>
                    <p className="text-sm text-slate-500 max-w-2xl">
                        Base centralizada que cruza <strong>Clientes Titulares</strong>,{' '}
                        <strong>Pasajeros en Files</strong>, <strong>Huéspedes de Hoteles B2B</strong> y{' '}
                        <strong>Usuarios Registrados</strong> en las 3 unidades de negocio.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href="/experiences/customers/new"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-sm transition"
                    >
                        <UserPlus className="w-4 h-4" />
                        Alta Cliente / Pasajero IATA (MRZ)
                    </Link>
                    <Link
                        href="/experiences/reservations/new"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition"
                    >
                        <FileText className="w-4 h-4 text-emerald-400" />
                        Crear File Multi-Operador
                    </Link>
                </div>
            </div>

            {/* Filtros por Unidad de Negocio y Tipo de Registro */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-1.5">
                    {[
                        { id: 'ALL', label: `Todos (${records.length})` },
                        { id: 'travelapp', label: '🌐 TravelApp Emisivo' },
                        { id: 'experience_b2b', label: '🏨 Experience B2B / Hoteles' },
                        { id: 'lunaviajera', label: '🌙 Luna Viajera NOA' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setUnitFilter(tab.id as any)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-black transition ${
                                unitFilter === tab.id
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={roleFilter}
                        onChange={e => setRoleFilter(e.target.value as any)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
                    >
                        <option value="ALL">Todos los Perfiles</option>
                        <option value="cliente_titular">💳 Clientes Titulares de Reserva</option>
                        <option value="pasajero_viajero">🧳 Pasajeros / Acompañantes en File</option>
                        <option value="usuario_web">👤 Usuarios Registrados Web/App</option>
                    </select>

                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar nombre, DNI, pasaporte, hotel..."
                            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium w-64 focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>
            </div>

            {/* Tabla del Padrón Unificado */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-sm text-slate-500">
                        Cargando padrón unificado de clientes, pasajeros y usuarios...
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className="p-12 text-center space-y-3">
                        <Users className="w-10 h-10 text-slate-300 mx-auto" />
                        <p className="text-sm font-bold text-slate-700">
                            No se encontraron registros con este filtro.
                        </p>
                        <Link
                            href="/experiences/customers/new"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                        >
                            + Dar de Alta Primer Pasajero / Cliente
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                    <th className="py-3.5 px-4">Nombre Completo / Rol</th>
                                    <th className="py-3.5 px-4">DNI / Pasaporte</th>
                                    <th className="py-3.5 px-4">Unidad de Negocio & Origen</th>
                                    <th className="py-3.5 px-4">Contacto</th>
                                    <th className="py-3.5 px-4">Files / Último Viaje</th>
                                    <th className="py-3.5 px-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredRecords.map(rec => {
                                    const unitBadge =
                                        rec.businessUnit === 'experience_b2b'
                                            ? {
                                                  label: 'Experience B2B / Hotel',
                                                  cls: 'bg-amber-100 text-amber-900',
                                              }
                                            : rec.businessUnit === 'lunaviajera'
                                            ? {
                                                  label: 'Luna Viajera NOA',
                                                  cls: 'bg-purple-100 text-purple-900',
                                              }
                                            : rec.businessUnit === 'travelapp'
                                            ? {
                                                  label: 'TravelApp Emisivo',
                                                  cls: 'bg-blue-100 text-blue-900',
                                              }
                                            : {
                                                  label: 'Usuario Ecosistema',
                                                  cls: 'bg-slate-100 text-slate-700',
                                              };

                                    return (
                                        <tr key={rec.id} className="hover:bg-slate-50/80">
                                            <td className="py-3.5 px-4">
                                                <span className="font-black text-slate-900 block">
                                                    {rec.fullName}
                                                </span>
                                                <span className="text-[11px] font-bold uppercase text-indigo-600">
                                                    {rec.roleType === 'cliente_titular'
                                                        ? '💳 Cliente Titular'
                                                        : rec.roleType === 'pasajero_viajero'
                                                        ? '🧳 Pasajero en File'
                                                        : '👤 Usuario Registrado'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-700">
                                                {rec.documentNumber}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${unitBadge.cls}`}
                                                >
                                                    {unitBadge.label}
                                                </span>
                                                <span className="block text-xs text-slate-500 mt-0.5">
                                                    {rec.originLabel}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-xs text-slate-600">
                                                {rec.phone && (
                                                    <span className="block font-semibold">
                                                        📞 {rec.phone}
                                                    </span>
                                                )}
                                                {rec.email && <span>✉️ {rec.email}</span>}
                                                {!rec.phone && !rec.email && (
                                                    <span className="text-slate-400">Sin contacto</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className="font-bold text-slate-900 text-xs block">
                                                    {rec.filesCount} File(s) asociados
                                                </span>
                                                {rec.lastServiceName && (
                                                    <span className="text-xs text-slate-500 truncate max-w-[220px] block">
                                                        {rec.lastServiceName}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <Link
                                                    href="/experiences/reservations/new"
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 text-xs font-bold transition"
                                                >
                                                    Abrir File <ArrowRight className="w-3.5 h-3.5" />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
