'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2, Plus, Search, MapPin, Trash2, Edit2, CheckCircle2, AlertCircle, ToggleLeft, ToggleRight
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Branch {
  id: string;
  name: string;
  location: string;
  address: string;
  phone: string;
  active: boolean;
  enabledARCRouteIds: string[];
}

const DEFAULT_BRANCHES: Branch[] = [
  {
    id: '1',
    name: 'Sucursal Retiro',
    location: 'CABA',
    address: 'Av. Ramos Mejía 1300',
    phone: '+54 11 4312-0000',
    active: true,
    enabledARCRouteIds: ['r1', 'r2']
  },
  {
    id: '2',
    name: 'Sucursal Pilar',
    location: 'GBA Norte',
    address: 'Ruta 8 Km 52.5',
    phone: '+54 230 443-0000',
    active: true,
    enabledARCRouteIds: ['r3']
  },
  {
    id: '3',
    name: 'Sucursal Tucumán',
    location: 'Tucumán',
    address: 'San Martín 560, S. M. de Tucumán',
    phone: '+54 381 422-0000',
    active: true,
    enabledARCRouteIds: ['r4', 'r5']
  }
];

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    location: '',
    address: '',
    phone: '',
    active: true,
    enabledRoutesString: ''
  });

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
            location: data.location || '',
            address: data.address || '',
            phone: data.phone || '',
            active: data.active !== undefined ? data.active : true,
            enabledARCRouteIds: data.enabledARCRouteIds || []
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
    if (!form.name || !form.location) return;

    const id = editingId || Math.random().toString(36).substr(2, 9);
    const routesArray = form.enabledRoutesString
      .split(',')
      .map(r => r.trim())
      .filter(r => r.length > 0);

    const payload = {
      name: form.name,
      location: form.location,
      address: form.address,
      phone: form.phone,
      active: form.active,
      enabledARCRouteIds: routesArray
    };

    try {
      await setDoc(doc(db, 'branches', id), payload);
      setShowModal(false);
      setEditingId(null);
      setForm({ name: '', location: '', address: '', phone: '', active: true, enabledRoutesString: '' });
    } catch (err) {
      console.error("Error saving branch:", err);
    }
  };

  const handleEdit = (b: Branch) => {
    setEditingId(b.id);
    setForm({
      name: b.name,
      location: b.location,
      address: b.address,
      phone: b.phone,
      active: b.active,
      enabledRoutesString: (b.enabledARCRouteIds || []).join(', ')
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

  const filtered = branches.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.location.toLowerCase().includes(search.toLowerCase())
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
          <p className="mt-1 text-sm text-slate-500">Configuración y alta de sucursales geográficas para asignación de viajes y personal en el ecosistema.</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setForm({ name: '', location: '', address: '', phone: '', active: true, enabledRoutesString: '' });
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
          placeholder="Buscar por nombre o ubicación..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-700 shadow-sm outline-none focus:border-tech-blue/40 focus:ring-2 focus:ring-tech-blue/10 transition-all"
        />
      </div>

      {/* Branches List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(b => (
          <div key={b.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between gap-4 relative">
            <div>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="bg-tech-blue/10 p-2.5 rounded-lg">
                    <Building2 className="h-5 w-5 text-tech-blue" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{b.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">ID: {b.id}</p>
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

              <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {b.address || 'Sin dirección registrada'} · <span className="font-bold text-slate-700">{b.location}</span></p>
                <p className="font-mono text-slate-500">Teléfono: {b.phone || '—'}</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-between items-center mt-auto">
              <p className="text-[10px] text-slate-400 font-bold uppercase">
                Rutas ARC: <span className="text-slate-600 font-semibold">{b.enabledARCRouteIds.length}</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(b)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 shadow-sm hover:border-tech-blue/30 hover:text-tech-blue transition-all"
                >
                  <Edit2 className="h-3 w-3" /> Editar
                </button>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-white px-2 py-1 text-xs font-semibold text-red-600 shadow-sm hover:border-red-300 hover:bg-red-50 transition-all"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
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
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="bg-slate-50 p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {editingId ? 'Editar Sucursal' : 'Nueva Sucursal'}
              </h2>
            </div>
            
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Provincia / Región</label>
                  <input
                    type="text"
                    required
                    value={form.location}
                    onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                    placeholder="Ej: CABA / Tucumán"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                    placeholder="Ej: +54 11 4312-0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Dirección Física</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                  placeholder="Ej: Av. Ramos Mejía 1300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Rutas Habilitadas (IDs separados por coma)</label>
                <input
                  type="text"
                  value={form.enabledRoutesString}
                  onChange={e => setForm(p => ({ ...p, enabledRoutesString: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                  placeholder="r1, r2, r3"
                />
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
                  Sucursal Activa (Disponible en Ecosistema)
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
