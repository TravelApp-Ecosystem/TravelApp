'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2, Plus, Search, MapPin, Trash2, Edit2, CheckCircle2, User, Phone, Map, ShieldCheck, Mail
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  managerId: string;
  managerName: string;
  province: string;
  locality: string;
  postalCode: string;
  active: boolean;
  enabledServices: {
    travelCab: boolean;
    experience: boolean;
    rewards: boolean;
  };
}

interface StaffUser {
  id: string;
  name: string;
  role: string;
}

const DEFAULT_BRANCHES: Branch[] = [
  {
    id: '1',
    name: 'Sucursal Retiro',
    address: 'Av. Ramos Mejía 1300',
    phone: '+54 11 4312-0000',
    managerId: '1',
    managerName: 'Fernando Incola',
    province: 'CABA',
    locality: 'Retiro',
    postalCode: '1104',
    active: true,
    enabledServices: {
      travelCab: true,
      experience: true,
      rewards: true
    }
  },
  {
    id: '2',
    name: 'Sucursal Pilar',
    address: 'Ruta 8 Km 52.5',
    phone: '+54 230 443-0000',
    managerId: '3',
    managerName: 'Auditor Externo',
    province: 'Buenos Aires',
    locality: 'Pilar',
    postalCode: '1629',
    active: true,
    enabledServices: {
      travelCab: true,
      experience: false,
      rewards: true
    }
  },
  {
    id: '3',
    name: 'Sucursal Tucumán',
    address: 'San Martín 560',
    phone: '+54 381 422-0000',
    managerId: '2',
    managerName: 'Operador Tucumán',
    province: 'Tucumán',
    locality: 'San Miguel de Tucumán',
    postalCode: '4000',
    active: true,
    enabledServices: {
      travelCab: true,
      experience: true,
      rewards: false
    }
  }
];

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    managerId: '',
    province: '',
    locality: '',
    postalCode: '',
    active: true,
    enabledServices: {
      travelCab: true,
      experience: false,
      rewards: false
    }
  });

  // Load staff users for Responsable selector
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'staff_users'), (snapshot) => {
      const list: StaffUser[] = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || 'Usuario Interno',
        role: doc.data().role || 'operator'
      }));
      setStaff(list.length > 0 ? list : [
        { id: '1', name: 'Fernando Incola', role: 'admin' },
        { id: '2', name: 'Operador Tucumán', role: 'operator' },
        { id: '3', name: 'Auditor Externo', role: 'viewer' }
      ]);
    });
    return () => unsub();
  }, []);

  // Load sucursales
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'branches'), (snapshot) => {
      if (snapshot.empty) {
        setBranches(DEFAULT_BRANCHES);
      } else {
        const list: Branch[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            address: data.address || '',
            phone: data.phone || '',
            managerId: data.managerId || '',
            managerName: data.managerName || 'Sin Responsable',
            province: data.province || '',
            locality: data.locality || '',
            postalCode: data.postalCode || '',
            active: data.active !== undefined ? data.active : true,
            enabledServices: data.enabledServices || { travelCab: true, experience: false, rewards: false }
          };
        });
        setBranches(list);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error loading branches:", error);
      setBranches(DEFAULT_BRANCHES);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.province || !form.locality) return;

    const id = editingId || Math.random().toString(36).substr(2, 9);
    const selectedManager = staff.find(s => s.id === form.managerId);
    const managerName = selectedManager ? selectedManager.name : 'Sin Responsable';

    const payload = {
      name: form.name,
      address: form.address,
      phone: form.phone,
      managerId: form.managerId,
      managerName,
      province: form.province,
      locality: form.locality,
      postalCode: form.postalCode,
      active: form.active,
      enabledServices: form.enabledServices
    };

    try {
      await setDoc(doc(db, 'branches', id), payload);
      setShowModal(false);
      setEditingId(null);
      setForm({
        name: '',
        address: '',
        phone: '',
        managerId: '',
        province: '',
        locality: '',
        postalCode: '',
        active: true,
        enabledServices: { travelCab: true, experience: false, rewards: false }
      });
    } catch (err) {
      console.error("Error saving branch:", err);
    }
  };

  const handleEdit = (b: Branch) => {
    setEditingId(b.id);
    setForm({
      name: b.name,
      address: b.address,
      phone: b.phone,
      managerId: b.managerId,
      province: b.province,
      locality: b.locality,
      postalCode: b.postalCode,
      active: b.active,
      enabledServices: b.enabledServices || { travelCab: true, experience: false, rewards: false }
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta sucursal?')) {
      try {
        await deleteDoc(doc(db, 'branches', id));
      } catch (err) {
        console.error("Error deleting branch:", err);
      }
    }
  };

  const toggleStatus = async (b: Branch) => {
    try {
      await setDoc(doc(db, 'branches', b.id), {
        ...b,
        active: !b.active
      });
    } catch (err) {
      console.error("Error toggling branch status:", err);
    }
  };

  const toggleService = (service: 'travelCab' | 'experience' | 'rewards') => {
    setForm(p => ({
      ...p,
      enabledServices: {
        ...p.enabledServices,
        [service]: !p.enabledServices[service]
      }
    }));
  };

  const filtered = branches.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.locality.toLowerCase().includes(search.toLowerCase()) ||
    b.province.toLowerCase().includes(search.toLowerCase())
  );

  const activeBranches = branches.filter(b => b.active).length;

  return (
    <div className="flex h-full w-full flex-col bg-slate-50 p-6 gap-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-tech-blue">
            <Building2 className="h-7 w-7 text-tech-blue" /> Gestión de Sucursales
          </h1>
          <p className="mt-1 text-sm text-slate-500">Configuración de sucursales geográficas, responsables de área y servicios del ecosistema.</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setForm({
              name: '',
              address: '',
              phone: '',
              managerId: staff[0]?.id || '',
              province: '',
              locality: '',
              postalCode: '',
              active: true,
              enabledServices: { travelCab: true, experience: false, rewards: false }
            });
            setShowModal(true);
          }}
          className="inline-flex items-center justify-center space-x-2 rounded-xl bg-tech-blue px-4 py-2.5 text-sm font-bold text-white hover:bg-tech-blue/90 shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Agregar Sucursal</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Total Sucursales', value: branches.length, color: 'text-tech-blue' },
          { label: 'Sucursales Activas', value: activeBranches, color: 'text-emerald-600' },
          { label: 'Sucursales Inactivas', value: branches.length - activeBranches, color: 'text-slate-500' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="mt-0.5 text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, localidad o provincia..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-700 shadow-sm outline-none focus:border-tech-blue/40 focus:ring-2 focus:ring-tech-blue/10 transition-all"
        />
      </div>

      {/* Branches List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(b => (
          <div key={b.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between gap-4 relative hover:shadow-md transition-shadow">
            <div>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="bg-tech-blue/10 p-2.5 rounded-lg">
                    <Building2 className="h-5 w-5 text-tech-blue" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{b.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">CP: {b.postalCode || '—'}</p>
                  </div>
                </div>
                <button onClick={() => toggleStatus(b)} title="Cambiar Estado">
                  {b.active ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      Activa
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-400">
                      Inactiva
                    </span>
                  )}
                </button>
              </div>

              {/* Domicilio & Contacto */}
              <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" /> 
                  {b.address ? `${b.address}, ` : ''}{b.locality}
                </p>
                <p className="flex items-center gap-1.5 ml-5 font-bold text-slate-700">{b.province}</p>
                <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400" /> {b.phone || '—'}</p>
                <p className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-slate-400" /> Responsable: <span className="font-bold text-tech-blue">{b.managerName}</span></p>
              </div>

              {/* Habilitación de Servicios */}
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {b.enabledServices?.travelCab && (
                  <span className="inline-flex items-center rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[10px] font-bold text-[#FF7A00]">
                    TravelCab
                  </span>
                )}
                {b.enabledServices?.experience && (
                  <span className="inline-flex items-center rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-[#EF4444]">
                    Experience
                  </span>
                )}
                {b.enabledServices?.rewards && (
                  <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-[#F59E0B]">
                    Rewards
                  </span>
                )}
                {!b.enabledServices?.travelCab && !b.enabledServices?.experience && !b.enabledServices?.rewards && (
                  <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                    Sin Servicios
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-end gap-2 mt-auto">
              <button
                onClick={() => handleEdit(b)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:border-tech-blue/30 hover:text-tech-blue transition-all"
              >
                <Edit2 className="h-3 w-3" /> Editar
              </button>
              <button
                onClick={() => handleDelete(b.id)}
                className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 shadow-sm hover:border-red-300 hover:bg-red-50 transition-all"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            No se encontraron sucursales para esta búsqueda.
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="bg-slate-50 p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {editingId ? 'Editar Sucursal' : 'Nueva Sucursal'}
              </h2>
            </div>
            
            <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Nombre de la Sucursal</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                    placeholder="Ej: Sucursal Retiro"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Responsable</label>
                  <select
                    value={form.managerId}
                    onChange={e => setForm(p => ({ ...p, managerId: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none bg-white focus:border-tech-blue"
                  >
                    <option value="">Seleccionar Responsable</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Teléfono de la Sucursal</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                    placeholder="Ej: +54 11 4312-0000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Provincia</label>
                  <input
                    type="text"
                    required
                    value={form.province}
                    onChange={e => setForm(p => ({ ...p, province: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                    placeholder="Ej: Tucumán"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Localidad</label>
                  <input
                    type="text"
                    required
                    value={form.locality}
                    onChange={e => setForm(p => ({ ...p, locality: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                    placeholder="Ej: Yerba Buena"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Domicilio (Opcional)</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                    placeholder="Ej: Av. Aconquija 1200 (dejar vacío si no aplica)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Código Postal</label>
                  <input
                    type="text"
                    required
                    value={form.postalCode}
                    onChange={e => setForm(p => ({ ...p, postalCode: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                    placeholder="Ej: 4107"
                  />
                </div>
              </div>

              {/* Habilitación de Servicios */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-500 mb-2">Habilitación de Servicios</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => toggleService('travelCab')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                      form.enabledServices.travelCab
                        ? 'border-[#FF7A00] bg-orange-50 text-[#FF7A00]'
                        : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="h-5 w-5 mb-1" />
                    <span className="text-[10px] font-bold">TravelCab</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleService('experience')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                      form.enabledServices.experience
                        ? 'border-[#EF4444] bg-red-50 text-[#EF4444]'
                        : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="h-5 w-5 mb-1" />
                    <span className="text-[10px] font-bold">Experience</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleService('rewards')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                      form.enabledServices.rewards
                        ? 'border-[#F59E0B] bg-amber-50 text-[#F59E0B]'
                        : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="h-5 w-5 mb-1" />
                    <span className="text-[10px] font-bold">Rewards</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="branch-active-checkbox"
                  checked={form.active}
                  onChange={e => setForm(p => ({ ...p, active: e.target.checked }))}
                  className="h-4 w-4 text-tech-blue"
                />
                <label htmlFor="branch-active-checkbox" className="text-xs font-bold text-slate-600 cursor-pointer">
                  Sucursal Activa (Mostrar en desgloses e informes)
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-tech-blue px-4 py-2 text-xs font-bold text-white hover:bg-tech-blue/90"
                >
                  Guardar Sucursal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
