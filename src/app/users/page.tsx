'use client';

import React, { useState, useEffect } from 'react';
import {
  Users, Shield, Plus, Search, Trash2, Edit2, Building2, Mail, CheckCircle2
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  branchId: string;
  branchName: string;
  active: boolean;
  createdAt: string;
}

interface Branch {
  id: string;
  name: string;
  location: string;
}

const MOCK_STAFF: StaffUser[] = [
  {
    id: '1',
    name: 'Fernando Incola',
    email: 'ferincola@gmail.com',
    role: 'admin',
    branchId: '1',
    branchName: 'Sucursal Retiro',
    active: true,
    createdAt: '2026-06-01'
  },
  {
    id: '2',
    name: 'Operador Tucumán',
    email: 'operator.tuc@travelapp.ar',
    role: 'operator',
    branchId: '3',
    branchName: 'Sucursal Tucumán',
    active: true,
    createdAt: '2026-06-15'
  },
  {
    id: '3',
    name: 'Auditor Externo',
    email: 'viewer.audit@travelapp.ar',
    role: 'viewer',
    branchId: 'all',
    branchName: 'Todas las Sucursales',
    active: true,
    createdAt: '2026-07-01'
  }
];

export default function StaffUsersPage() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'operator' as 'admin' | 'operator' | 'viewer',
    branchId: '1',
    active: true
  });

  // Load branches
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'branches'), (snapshot) => {
      const list: Branch[] = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || 'Sucursal',
        location: doc.data().location || ''
      }));
      setBranches(list.length > 0 ? list : [
        { id: '1', name: 'Sucursal Retiro', location: 'CABA' },
        { id: '2', name: 'Sucursal Pilar', location: 'GBA Norte' },
        { id: '3', name: 'Sucursal Tucumán', location: 'Tucumán' }
      ]);
    });
    return () => unsub();
  }, []);

  // Load staff users
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'staff_users'), (snapshot) => {
      if (snapshot.empty) {
        setStaff(MOCK_STAFF);
      } else {
        const list: StaffUser[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            email: data.email || '',
            role: data.role || 'operator',
            branchId: data.branchId || '1',
            branchName: data.branchName || 'Sucursal',
            active: data.active !== undefined ? data.active : true,
            createdAt: data.createdAt || new Date().toISOString().split('T')[0]
          };
        });
        setStaff(list);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error loading staff users:", error);
      setStaff(MOCK_STAFF);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;

    const id = editingId || Math.random().toString(36).substr(2, 9);
    const selectedBranch = branches.find(b => b.id === form.branchId);
    const branchName = form.branchId === 'all' ? 'Todas las Sucursales' : (selectedBranch?.name || 'Sucursal');

    const payload = {
      name: form.name,
      email: form.email,
      role: form.role,
      branchId: form.branchId,
      branchName,
      active: form.active,
      createdAt: editingId ? (staff.find(s => s.id === editingId)?.createdAt || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0]
    };

    try {
      await setDoc(doc(db, 'staff_users', id), payload);
      setShowModal(false);
      setEditingId(null);
      setForm({ name: '', email: '', role: 'operator', branchId: '1', active: true });
    } catch (err) {
      console.error("Error saving staff user:", err);
    }
  };

  const handleEdit = (user: StaffUser) => {
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
      active: user.active
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar a este usuario interno?')) {
      try {
        await deleteDoc(doc(db, 'staff_users', id));
      } catch (err) {
        console.error("Error deleting staff user:", err);
      }
    }
  };

  const filtered = staff.filter(user => {
    const matchSearch = user.name.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || user.role === filterRole;
    return matchSearch && matchRole;
  });

  const admins = staff.filter(u => u.role === 'admin').length;
  const operators = staff.filter(u => u.role === 'operator').length;
  const viewers = staff.filter(u => u.role === 'viewer').length;

  return (
    <div className="flex h-full w-full flex-col bg-slate-50 p-6 gap-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-tech-blue">
            <Shield className="h-7 w-7 text-tech-blue" /> Gestión de Usuarios Internos
          </h1>
          <p className="mt-1 text-sm text-slate-500">Administración de credenciales, accesos y sucursales del personal de Concorde 360.</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setForm({ name: '', email: '', role: 'operator', branchId: '1', active: true });
            setShowModal(true);
          }}
          className="inline-flex items-center justify-center space-x-2 rounded-xl bg-tech-blue px-4 py-2.5 text-sm font-bold text-white hover:bg-tech-blue/90 shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Agregar Usuario Interno</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Personal', value: staff.length, color: 'text-tech-blue' },
          { label: 'Administradores', value: admins, color: 'text-rose-600' },
          { label: 'Operadores', value: operators, color: 'text-amber-600' },
          { label: 'Lectores (Viewer)', value: viewers, color: 'text-blue-600' },
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
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-700 shadow-sm outline-none focus:border-tech-blue/40 focus:ring-2 focus:ring-tech-blue/10 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none"
          >
            <option value="all">Todos los Roles</option>
            <option value="admin">Administrador</option>
            <option value="operator">Operador</option>
            <option value="viewer">Lector (Viewer)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                {['Personal', 'Email / Contacto', 'Rol de Acceso', 'Sucursal Asignada', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(user => (
                <tr key={user.id} className="group hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-tech-blue/10 text-xs font-bold text-tech-blue">
                        {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{user.name}</p>
                        <p className="text-xs font-mono text-slate-400">ID: {user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="flex items-center gap-1 text-xs text-slate-600">
                      <Mail className="h-3 w-3 text-slate-400" /> {user.email}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Creado: {user.createdAt}</p>
                  </td>
                  <td className="px-4 py-3">
                    {user.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-xs font-bold text-rose-700">
                        Administrador
                      </span>
                    ) : user.role === 'operator' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-700">
                        Operador
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-bold text-blue-700">
                        Lector (Viewer)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" /> {user.branchName}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 shadow-sm hover:border-tech-blue/30 hover:text-tech-blue transition-all"
                      >
                        <Edit2 className="h-3 w-3" /> Editar
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-white px-2 py-1 text-xs font-semibold text-red-600 shadow-sm hover:border-red-300 hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                    No se encontraron usuarios internos para esta búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="bg-slate-50 p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {editingId ? 'Editar Usuario Interno' : 'Nuevo Usuario Interno'}
              </h2>
            </div>
            
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                  placeholder="Ej: Fernando Incola"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                  placeholder="usuario@travelapp.ar"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Rol de Acceso</label>
                <select
                  value={form.role}
                  onChange={e => setForm(p => ({ ...p, role: e.target.value as any }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none bg-white focus:border-tech-blue"
                >
                  <option value="admin">Administrador (Acceso Total)</option>
                  <option value="operator">Operador (Gestión Operativa)</option>
                  <option value="viewer">Lector (Solo Lectura/Consultas)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Sucursal Asignada</label>
                <select
                  value={form.branchId}
                  onChange={e => setForm(p => ({ ...p, branchId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none bg-white focus:border-tech-blue"
                >
                  <option value="all">Todas las Sucursales</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.location})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="user-active-checkbox"
                  checked={form.active}
                  onChange={e => setForm(p => ({ ...p, active: e.target.checked }))}
                  className="h-4 w-4 text-tech-blue"
                />
                <label htmlFor="user-active-checkbox" className="text-xs font-bold text-slate-600 cursor-pointer">
                  Usuario Activo (Permitir inicio de sesión)
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
