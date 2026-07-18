'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, Plus, Search, Eye, CheckCircle,
  AlertCircle, XCircle, Clock, Car, ChevronRight,
  Filter, RefreshCw, Mail, Phone, Edit2, Trash2, CheckCircle2
} from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface DriverPartner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  photoUrl?: string;
  status: 'Activo' | 'Pendiente Documentación' | 'Suspendido' | 'En Revisión';
  vehicle?: {
    make: string;
    model: string;
    licensePlate: string;
    color: string;
    year: number;
  };
}

const MOCK_DRIVERS: DriverPartner[] = [
  {
    id: 'DRV-001',
    firstName: 'Carlos',
    lastName: 'Mamani',
    email: 'carlos.mamani@gmail.com',
    phone: '+54 381 456-7890',
    status: 'Activo',
    vehicle: { make: 'Volkswagen', model: 'Gol Trend', licensePlate: 'AB 123 CD', color: 'Blanco', year: 2020 }
  },
  {
    id: 'DRV-002',
    firstName: 'Romina',
    lastName: 'Herrera',
    email: 'romina.h@hotmail.com',
    phone: '+54 381 333-1111',
    status: 'Pendiente Documentación',
    vehicle: { make: 'Chevrolet', model: 'Onix', licensePlate: 'DC 456 EF', color: 'Gris', year: 2022 }
  },
  {
    id: 'DRV-003',
    firstName: 'Jorge',
    lastName: 'Ruiz',
    email: 'jorge.ruiz@yahoo.com',
    phone: '+54 381 777-2222',
    status: 'Activo',
    vehicle: { make: 'Toyota', model: 'Corolla', licensePlate: 'GH 789 IJ', color: 'Plata', year: 2019 }
  }
];

export default function TravelCabDriversPage() {
  const [drivers, setDrivers] = useState<DriverPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Edit states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    status: 'Activo' as any,
    make: '',
    model: '',
    licensePlate: '',
    color: '',
    year: '2020'
  });

  // Listen to drivers collection in Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'drivers'), (snapshot) => {
      if (snapshot.empty) {
        setDrivers(MOCK_DRIVERS);
      } else {
        const list: DriverPartner[] = snapshot.docs.map(d => {
          const data = d.data();
          const fullName = data.name || data.displayName || 'Conductor';
          const parts = fullName.split(' ');
          const fName = data.firstName || parts[0] || 'Conductor';
          const lName = data.lastName || parts.slice(1).join(' ') || '';

          return {
            id: d.id,
            firstName: fName,
            lastName: lName,
            email: data.email || 'correo@travelapp.ar',
            phone: data.phone || '+54 381 000-0000',
            status: data.status || 'En Revisión',
            photoUrl: data.photoUrl || undefined,
            vehicle: data.activeVehicle ? {
              make: data.activeVehicle.brand?.split(' ')[0] || 'Vehículo',
              model: data.activeVehicle.brand?.split(' ').slice(1).join(' ') || '',
              licensePlate: data.activeVehicle.plate || '',
              color: data.activeVehicle.color || '',
              year: Number(data.activeVehicle.year) || 2020
            } : (data.vehicle || undefined)
          };
        });
        setDrivers(list);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching drivers:", error);
      setDrivers(MOCK_DRIVERS);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'drivers', id), { status: newStatus });
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleEditClick = (drv: DriverPartner) => {
    setEditingId(drv.id);
    setEditForm({
      firstName: drv.firstName,
      lastName: drv.lastName,
      email: drv.email,
      phone: drv.phone,
      status: drv.status,
      make: drv.vehicle?.make || '',
      model: drv.vehicle?.model || '',
      licensePlate: drv.vehicle?.licensePlate || '',
      color: drv.vehicle?.color || '',
      year: String(drv.vehicle?.year || '2020')
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      const payload = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        name: `${editForm.firstName} ${editForm.lastName}`,
        email: editForm.email,
        phone: editForm.phone,
        status: editForm.status,
        activeVehicle: {
          brand: `${editForm.make} ${editForm.model}`.trim(),
          plate: editForm.licensePlate,
          color: editForm.color,
          year: Number(editForm.year)
        }
      };

      await updateDoc(doc(db, 'drivers', editingId), payload);
      setShowEditModal(false);
      setEditingId(null);
    } catch (err) {
      console.error("Error editing driver:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar a este conductor del sistema?')) {
      try {
        await deleteDoc(doc(db, 'drivers', id));
      } catch (err) {
        console.error("Error deleting driver:", err);
      }
    }
  };

  const filtered = drivers.filter(d => {
    const matchSearch = `${d.firstName} ${d.lastName}`.toLowerCase().includes(search.toLowerCase()) || d.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex h-full w-full flex-col bg-slate-50 p-6 gap-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-tech-blue">
            <Users className="h-7 w-7 text-tech-blue" /> Gestión de Conductores
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">Revisión de documentación, habilitación de choferes y vehículos de la flota TravelCab.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Choferes', value: drivers.length, color: 'text-tech-blue' },
          { label: 'Activos', value: drivers.filter(d => d.status === 'Activo').length, color: 'text-emerald-600' },
          { label: 'Pendientes', value: drivers.filter(d => d.status === 'Pendiente Documentación' || d.status === 'En Revisión').length, color: 'text-amber-600' },
          { label: 'Suspendidos', value: drivers.filter(d => d.status === 'Suspendido').length, color: 'text-rose-600' },
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
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-700 shadow-sm outline-none focus:border-tech-blue/40 focus:ring-2 focus:ring-tech-blue/10 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-tech-blue"
          >
            <option value="all">Todos los Estados</option>
            <option value="Activo">Activos</option>
            <option value="Pendiente Documentación">Pendiente Docs</option>
            <option value="En Revisión">En Revisión</option>
            <option value="Suspendido">Suspendidos</option>
          </select>
        </div>
      </div>

      {/* List Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Conductor</th>
                <th className="px-4 py-3 text-left">Contacto</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Vehículo Activo</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filtered.map(partner => (
                <tr key={partner.id} className="group hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 flex-shrink-0 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                        {partner.photoUrl ? (
                          <img src={partner.photoUrl} alt="Chofer" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-bold text-slate-400">
                            {partner.firstName[0]}{partner.lastName[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{partner.firstName} {partner.lastName}</p>
                        <p className="text-[10px] font-mono text-slate-400">ID: {partner.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="flex items-center gap-1"><Mail className="h-3 w-3 text-slate-400" /> {partner.email}</p>
                    <p className="flex items-center gap-1 font-mono text-slate-500 mt-0.5"><Phone className="h-3 w-3 text-slate-400" /> {partner.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    {partner.status === 'Activo' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 font-bold text-emerald-700">
                        <CheckCircle className="h-3 w-3" /> Habilitado
                      </span>
                    ) : partner.status === 'Suspendido' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 font-bold text-red-700">
                        <XCircle className="h-3 w-3" /> Suspendido
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 font-bold text-amber-700">
                        <Clock className="h-3 w-3" /> {partner.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {partner.vehicle ? (
                      <div>
                        <p className="font-semibold text-slate-800">{partner.vehicle.make} {partner.vehicle.model}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{partner.vehicle.licensePlate}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Sin Vehículo</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-center">
                      <Link
                        href={`/travelcab/drivers/${partner.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 hover:border-tech-blue hover:text-tech-blue transition-all"
                      >
                        <Eye className="h-3 w-3" /> Ver Perfil
                      </Link>
                      
                      <button
                        onClick={() => handleEditClick(partner)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 hover:border-amber-500 hover:text-amber-600 transition-all"
                      >
                        <Edit2 className="h-3 w-3" /> Editar
                      </button>

                      {partner.status !== 'Activo' ? (
                        <button
                          onClick={() => handleUpdateStatus(partner.id, 'Activo')}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700 hover:bg-emerald-100 transition-all"
                        >
                          Habilitar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(partner.id, 'Suspendido')}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-rose-700 hover:bg-rose-100 transition-all"
                        >
                          Deshabilitar
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(partner.id)}
                        className="p-1 hover:bg-red-50 text-red-500 rounded-lg hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    No se encontraron conductores registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Form Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="bg-slate-50 p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Editar Conductor</h2>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={editForm.firstName}
                    onChange={e => setEditForm(p => ({ ...p, firstName: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Apellido</label>
                  <input
                    type="text"
                    required
                    value={editForm.lastName}
                    onChange={e => setEditForm(p => ({ ...p, lastName: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Teléfono</label>
                <input
                  type="text"
                  required
                  value={editForm.phone}
                  onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Estado de Habilitación</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm(p => ({ ...p, status: e.target.value as any }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none bg-white focus:border-tech-blue"
                >
                  <option value="Activo">Habilitado (Activo)</option>
                  <option value="Pendiente Documentación">Pendiente Docs</option>
                  <option value="En Revisión">En Revisión</option>
                  <option value="Suspendido">Suspendido</option>
                </select>
              </div>

              {/* Datos de Vehículo */}
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-black text-tech-blue uppercase tracking-wide mb-2">Datos del Vehículo</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Marca</label>
                    <input
                      type="text"
                      value={editForm.make}
                      onChange={e => setEditForm(p => ({ ...p, make: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                      placeholder="Ej: Volkswagen"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Modelo</label>
                    <input
                      type="text"
                      value={editForm.model}
                      onChange={e => setEditForm(p => ({ ...p, model: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                      placeholder="Ej: Gol Trend"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Patente / Matrícula</label>
                    <input
                      type="text"
                      value={editForm.licensePlate}
                      onChange={e => setEditForm(p => ({ ...p, licensePlate: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                      placeholder="Ej: AB 123 CD"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Color</label>
                    <input
                      type="text"
                      value={editForm.color}
                      onChange={e => setEditForm(p => ({ ...p, color: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                      placeholder="Ej: Blanco"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Año de fabricación</label>
                    <input
                      type="number"
                      value={editForm.year}
                      onChange={e => setEditForm(p => ({ ...p, year: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                      placeholder="2020"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-tech-blue px-4 py-2 text-xs font-bold text-white hover:bg-tech-blue/90"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
