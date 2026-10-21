'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    Briefcase, Building2, Compass, Globe, Calendar, DollarSign,
    PlusCircle, CheckCircle2, Clock, Phone, Mail, MapPin,
    AlertTriangle, Search, Filter, ExternalLink, ShieldCheck, Truck
} from 'lucide-react';
import { db } from '@/lib/firebase';
import {
    collection, getDocs, addDoc, updateDoc, doc,
    serverTimestamp, query, orderBy
} from 'firebase/firestore';

interface TourismProvider {
    id: string;
    name: string;
    type: 'mayorista_emisivo' | 'prestador_noa' | 'hotel_b2b';
    subCategory: string;
    unitScope: string;
    cuit: string;
    contactName: string;
    phone: string;
    email: string;
    location: string;
    commissionOrConditions: string;
    status: 'active' | 'inactive';
}

const DEFAULT_PROVIDERS: TourismProvider[] = [
    {
        id: 'prov-piamonte',
        name: 'Piamonte Mayorista',
        type: 'mayorista_emisivo',
        subCategory: 'Operador Mayorista Internacional & Cupos',
        unitScope: 'TravelApp (Emisivo)',
        cuit: '30-58912345-9',
        contactName: 'Mesa Operativa Agencias',
        phone: '+54 11 4321-9000',
        email: 'reservas@piamonte.com',
        location: 'CABA / Nacional',
        commissionOrConditions: 'Comisión Agencia 12% - 15% s/ Neto',
        status: 'active',
    },
    {
        id: 'prov-ola',
        name: 'OLA Mayorista de Turismo',
        type: 'mayorista_emisivo',
        subCategory: 'Cupos Aéreos, Brasil & Caribe',
        unitScope: 'TravelApp (Emisivo)',
        cuit: '30-61239874-1',
        contactName: 'Soporte Interior NOA',
        phone: '+54 381 422-8800',
        email: 'noa@ola.com.ar',
        location: 'Tucumán / Córdoba / CABA',
        commissionOrConditions: 'Comisión Agencia 12% + Over',
        status: 'active',
    },
    {
        id: 'prov-aero',
        name: 'AERO Operador Mayorista',
        type: 'mayorista_emisivo',
        subCategory: 'Europa, Exóticos & Cruceros',
        unitScope: 'TravelApp (Emisivo)',
        cuit: '30-65498712-3',
        contactName: 'Guardia Emisiones',
        phone: '+54 11 5236-4000',
        email: 'operaciones@aerolaplata.com',
        location: 'La Plata / CABA',
        commissionOrConditions: 'Comisión Agencia 14%',
        status: 'active',
    },
    {
        id: 'prov-transporte-valles',
        name: 'Flota Sprinter Calchaquí (CNRT Habilitada)',
        type: 'prestador_noa',
        subCategory: 'Transporte Receptivo / Combis 19 y 24 pax',
        unitScope: 'Luna Viajera + Experience B2B',
        cuit: '30-71029384-6',
        contactName: 'Carlos Albornoz (Jefe Tráfico)',
        phone: '+54 9 381 555-0192',
        email: 'trafico@vallesbus.com.ar',
        location: 'San Miguel de Tucumán',
        commissionOrConditions: 'Tarifa Neta por Salida Full Day / Half Day',
        status: 'active',
    },
    {
        id: 'prov-bodega-lasarcas',
        name: 'Bodega Chico Zossi & Las Arcas de Tolombón',
        type: 'prestador_noa',
        subCategory: 'Enoturismo, Degustación & Almuerzo Regional',
        unitScope: 'Luna Viajera + Experience B2B',
        cuit: '30-70881234-5',
        contactName: 'Reservas Enoturismo',
        phone: '+54 9 381 409-1122',
        email: 'turismo@lasarcas.com.ar',
        location: 'Colalao del Valle, Tucumán',
        commissionOrConditions: 'Tarifa Neta Receptivo (-20% s/ Mostrador)',
        status: 'active',
    },
    {
        id: 'prov-guias-noa',
        name: 'Cuerpo de Guías Matriculados EATT Tucumán',
        type: 'prestador_noa',
        subCategory: 'Guías Bilingües & Arqueológicos (Quilmes / Tafí)',
        unitScope: 'Luna Viajera + Experience B2B',
        cuit: '27-29384756-4',
        contactName: 'Lic. Mariana Paz',
        phone: '+54 9 381 612-3344',
        email: 'coord.guias@travelapp.ar',
        location: 'Tucumán & NOA',
        commissionOrConditions: 'Honorario por Jornada / Idioma',
        status: 'active',
    },
    {
        id: 'prov-hotel-sheraton',
        name: 'Sheraton Tucumán Hotel (Conserjería B2B)',
        type: 'hotel_b2b',
        subCategory: 'Recepción Hotel Aliado · Punto de Venta B2B',
        unitScope: 'TravelApp Experience (B2B)',
        cuit: '30-70918273-0',
        contactName: 'Jefe de Conserjería / Recepción',
        phone: '+54 381 455-9000',
        email: 'concierge.tucuman@sheraton.com',
        location: 'Av. Soldati 440, Tucumán',
        commissionOrConditions: '15% Excursiones NOA · 10% TravelCab',
        status: 'active',
    },
    {
        id: 'prov-hotel-catalinas',
        name: 'Hotel Catalinas Park (Recepción B2B)',
        type: 'hotel_b2b',
        subCategory: 'Recepción Hotel Aliado · Punto de Venta B2B',
        unitScope: 'TravelApp Experience (B2B)',
        cuit: '30-68192837-2',
        contactName: 'Recepción Principal',
        phone: '+54 381 450-2200',
        email: 'recepcion@catalinaspark.com',
        location: 'Av. Soldati 380, Tucumán',
        commissionOrConditions: '15% Excursiones NOA · 10% TravelCab',
        status: 'active',
    },
];

export default function ProvidersAndDeadlinesPage() {
    const [activeTab, setActiveTab] = useState<'directory' | 'deadlines' | 'new'>('directory');
    const [filterType, setFilterType] = useState<'ALL' | 'mayorista_emisivo' | 'prestador_noa' | 'hotel_b2b'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const [providers, setProviders] = useState<TourismProvider[]>(DEFAULT_PROVIDERS);
    const [deadlines, setDeadlines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Nuevo Prestador / Operador Form
    const [name, setName] = useState('');
    const [type, setType] = useState<'mayorista_emisivo' | 'prestador_noa' | 'hotel_b2b'>('prestador_noa');
    const [subCategory, setSubCategory] = useState('');
    const [cuit, setCuit] = useState('');
    const [contactName, setContactName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [location, setLocation] = useState('Tucumán / NOA');
    const [commissionOrConditions, setCommissionOrConditions] = useState('');

    const fetchProvidersAndDeadlines = async () => {
        setLoading(true);
        try {
            const [provSnap, deadSnap] = await Promise.all([
                getDocs(collection(db, 'tourism_providers')),
                getDocs(query(collection(db, 'supplier_deadlines'), orderBy('dueDate', 'asc')))
            ]);

            if (!provSnap.empty) {
                const dbProvs = provSnap.docs.map(d => ({ id: d.id, ...d.data() } as TourismProvider));
                setProviders([...dbProvs, ...DEFAULT_PROVIDERS]);
            }

            const dbDeadlines = deadSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setDeadlines(dbDeadlines);
        } catch (err) {
            console.error('Error loading providers & deadlines:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProvidersAndDeadlines();
    }, []);

    const filteredProviders = useMemo(() => {
        return providers.filter(p => {
            if (filterType !== 'ALL' && p.type !== filterType) return false;
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
                p.name.toLowerCase().includes(q) ||
                p.subCategory.toLowerCase().includes(q) ||
                p.location.toLowerCase().includes(q) ||
                p.contactName.toLowerCase().includes(q)
            );
        });
    }, [providers, filterType, searchQuery]);

    const handleCreateProvider = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        setSaving(true);
        try {
            const unitScope =
                type === 'mayorista_emisivo'
                    ? 'TravelApp (Emisivo)'
                    : type === 'hotel_b2b'
                    ? 'TravelApp Experience (B2B)'
                    : 'Luna Viajera + Experience B2B';

            const newDoc = {
                name,
                type,
                subCategory: subCategory || 'Prestador Turístico',
                unitScope,
                cuit: cuit || 'S/D',
                contactName: contactName || 'Reservas',
                phone,
                email,
                location,
                commissionOrConditions: commissionOrConditions || 'Acuerdo Comercial Vigente',
                status: 'active' as const,
                createdAt: serverTimestamp(),
            };

            const ref = await addDoc(collection(db, 'tourism_providers'), newDoc);
            setProviders(prev => [{ id: ref.id, ...newDoc }, ...prev]);
            setName('');
            setSubCategory('');
            setCuit('');
            setContactName('');
            setPhone('');
            setEmail('');
            setCommissionOrConditions('');
            setActiveTab('directory');
        } catch (err) {
            console.error('Error saving provider:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleMarkDeadlinePaid = async (deadlineId: string) => {
        try {
            await updateDoc(doc(db, 'supplier_deadlines', deadlineId), {
                status: 'paid',
                paidAt: new Date().toISOString(),
            });
            setDeadlines(prev =>
                prev.map(d => (d.id === deadlineId ? { ...d, status: 'paid' } : d))
            );
        } catch (err) {
            console.error('Error updating deadline:', err);
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-wider">
                        <Briefcase className="w-3.5 h-3.5" />
                        Concorde 360 · Módulo Operativo & Administrativo
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900">
                        Agenda de Prestadores, Operadores & Proveedores
                    </h1>
                    <p className="text-sm text-slate-500 max-w-2xl">
                        Directorio centralizado de <strong>Operadores Mayoristas (TravelApp)</strong>,{' '}
                        <strong>Prestadores Locales NOA (Luna Viajera & Experience)</strong>,{' '}
                        <strong>Hoteles Aliados B2B</strong> y control de vencimientos de pago por File.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setActiveTab('new')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-sm transition"
                    >
                        <PlusCircle className="w-4 h-4" />
                        Registrar Prestador / Operador
                    </button>
                    <Link
                        href="/experiences/hotel-reception"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition"
                    >
                        <Building2 className="w-4 h-4 text-amber-400" />
                        Ver Comisiones Hoteles B2B
                    </Link>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                    <button
                        onClick={() => setActiveTab('directory')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition ${
                            activeTab === 'directory'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        📋 Directorio de Prestadores & Operadores ({providers.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('deadlines')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition ${
                            activeTab === 'deadlines'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        ⏰ Vencimientos de Pago a Operadores ({deadlines.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('new')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition ${
                            activeTab === 'new'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        + Alta de Prestador / Aliado
                    </button>
                </div>

                {activeTab === 'directory' && (
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Buscar operador, guía, hotel..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <select
                            value={filterType}
                            onChange={e => setFilterType(e.target.value as any)}
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
                        >
                            <option value="ALL">Todas las Unidades</option>
                            <option value="mayorista_emisivo">
                                🌐 Operadores Mayoristas (TravelApp)
                            </option>
                            <option value="prestador_noa">
                                🏔️ Prestadores Locales NOA (Luna Viajera / Exp)
                            </option>
                            <option value="hotel_b2b">
                                🏨 Hoteles Aliados B2B (Experience)
                            </option>
                        </select>
                    </div>
                )}
            </div>

            {/* TAB 1: DIRECTORIO */}
            {activeTab === 'directory' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredProviders.map(prov => {
                        const badgeStyle =
                            prov.type === 'mayorista_emisivo'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : prov.type === 'hotel_b2b'
                                ? 'bg-amber-100 text-amber-900 border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-200';

                        return (
                            <div
                                key={prov.id}
                                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-indigo-300 transition flex flex-col justify-between gap-4"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <span
                                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${badgeStyle}`}
                                        >
                                            {prov.unitScope}
                                        </span>
                                        <span className="text-[11px] font-mono text-slate-400">
                                            CUIT: {prov.cuit}
                                        </span>
                                    </div>
                                    <h3 className="text-base font-black text-slate-900">
                                        {prov.name}
                                    </h3>
                                    <p className="text-xs font-bold text-indigo-600">
                                        {prov.subCategory}
                                    </p>
                                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                        💼 <strong>Acuerdo / Comisión:</strong>{' '}
                                        {prov.commissionOrConditions}
                                    </p>
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                        {prov.location}
                                    </span>
                                    <span className="flex items-center gap-1 font-semibold">
                                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                        {prov.phone}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Mail className="w-3.5 h-3.5 text-indigo-500" />
                                        {prov.email}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* TAB 2: VENCIMIENTOS DE PAGO A OPERADORES (SUPPLIER DEADLINES) */}
            {activeTab === 'deadlines' && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-black text-slate-900">
                                Calendario de Vencimientos de Pago a Operadores (`supplier_deadlines`)
                            </h2>
                            <p className="text-xs text-slate-500">
                                Generados automáticamente al cargar servicios de distintos operadores en un File.
                            </p>
                        </div>
                        <Link
                            href="/experiences/reservations/new"
                            className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
                        >
                            + Crear File Multi-Operador
                        </Link>
                    </div>

                    {deadlines.length === 0 ? (
                        <div className="p-12 text-center space-y-2">
                            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                            <p className="text-sm font-bold text-slate-700">
                                No hay vencimientos pendientes registrados en `supplier_deadlines`.
                            </p>
                            <p className="text-xs text-slate-500">
                                Cuando cargues servicios de operadores mayoristas o prestadores locales en un File, sus fechas límite de pago aparecerán aquí.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                        <th className="py-3.5 px-4">Vencimiento</th>
                                        <th className="py-3.5 px-4">Operador / Prestador</th>
                                        <th className="py-3.5 px-4">File / Localizador</th>
                                        <th className="py-3.5 px-4">Pasajero / Titular</th>
                                        <th className="py-3.5 px-4 text-right">Costo Neto a Pagar</th>
                                        <th className="py-3.5 px-4">Estado</th>
                                        <th className="py-3.5 px-4 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {deadlines.map(d => {
                                        const isPaid = d.status === 'paid';
                                        return (
                                            <tr key={d.id} className="hover:bg-slate-50">
                                                <td className="py-3.5 px-4 font-bold text-slate-900">
                                                    {d.dueDate || 'Sin fecha'}
                                                </td>
                                                <td className="py-3.5 px-4 font-black text-indigo-700">
                                                    {d.supplierName || 'Operador'}
                                                </td>
                                                <td className="py-3.5 px-4 font-mono text-xs">
                                                    {d.fileNumber || d.externalLocator || d.id.slice(0, 8)}
                                                </td>
                                                <td className="py-3.5 px-4 text-slate-700">
                                                    {d.customerName || 'Pasajero'}
                                                </td>
                                                <td className="py-3.5 px-4 text-right font-black text-slate-900">
                                                    {d.currency || 'USD'}{' '}
                                                    {Number(d.netAmount || d.amount || 0).toLocaleString('es-AR')}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span
                                                        className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${
                                                            isPaid
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : 'bg-amber-100 text-amber-800'
                                                        }`}
                                                    >
                                                        {isPaid ? '✓ Pagado' : '⏳ Pendiente'}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    {!isPaid && (
                                                        <button
                                                            onClick={() => handleMarkDeadlinePaid(d.id)}
                                                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                                                        >
                                                            Registrar Pago
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: ALTA DE NUEVO PRESTADOR / OPERADOR */}
            {activeTab === 'new' && (
                <form
                    onSubmit={handleCreateProvider}
                    className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm max-w-3xl space-y-5"
                >
                    <h2 className="text-xl font-black text-slate-900">
                        Dar de Alta Nuevo Prestador, Operador Mayorista u Hotel B2B
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Nombre Comercial / Razón Social *
                            </label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Ej: Excursiones Calchaquí SRL"
                                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Tipo y Unidad de Negocio *
                            </label>
                            <select
                                value={type}
                                onChange={e => setType(e.target.value as any)}
                                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold"
                            >
                                <option value="prestador_noa">
                                    🏔️ Prestador Local NOA (Luna Viajera + Experience)
                                </option>
                                <option value="mayorista_emisivo">
                                    🌐 Operador Mayorista (TravelApp Emisivo)
                                </option>
                                <option value="hotel_b2b">
                                    🏨 Hotel Aliado B2B (Recepción Experience)
                                </option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Rubro / Especialidad
                            </label>
                            <input
                                type="text"
                                value={subCategory}
                                onChange={e => setSubCategory(e.target.value)}
                                placeholder="Ej: Transporte Sprinter / Bodega / Mayorista Caribe"
                                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                CUIT / Legajo EVT
                            </label>
                            <input
                                type="text"
                                value={cuit}
                                onChange={e => setCuit(e.target.value)}
                                placeholder="30-XXXXXXXX-X"
                                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Persona de Contacto
                            </label>
                            <input
                                type="text"
                                value={contactName}
                                onChange={e => setContactName(e.target.value)}
                                placeholder="Nombre contacto"
                                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Teléfono / WhatsApp Guardia
                            </label>
                            <input
                                type="text"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="+54 9 381..."
                                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Email Reservas / Liquidaciones
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="reservas@..."
                                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Ubicación / Base Operativa
                            </label>
                            <input
                                type="text"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Comisión Pactada / Condiciones de Pago
                            </label>
                            <input
                                type="text"
                                value={commissionOrConditions}
                                onChange={e => setCommissionOrConditions(e.target.value)}
                                placeholder="Ej: Comisión 15% / Cuenta Corriente 7 días"
                                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black shadow-sm"
                        >
                            {saving ? 'Guardando...' : 'Guardar en Agenda de Prestadores'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('directory')}
                            className="px-4 py-3 rounded-2xl bg-slate-100 text-slate-700 text-sm font-bold"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
