'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Palmtree, Save, ArrowLeft, CheckCircle2, RefreshCw, PlusCircle, Users } from 'lucide-react';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Coordinator {
  id: string;
  name: string;
  phone: string;
}

export default function NewGroupTripPage() {
  const [form, setForm] = useState({
    title: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    departureOrigin: '',
    coordinatorId: '',
    totalSeats: '40',
    pricePerPerson: '45000',
    currency: 'ARS',
    notes: ''
  });

  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Load coordinators list in real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'coordinators'), (snap) => {
      const list: Coordinator[] = snap.docs.map(docSnap => ({
        id: docSnap.id,
        name: docSnap.data().name || 'Coordinador',
        phone: docSnap.data().phone || ''
      }));
      setCoordinators(list.length > 0 ? list : [
        { id: '1', name: 'Laura Gómez', phone: '+54 381 999-8888' },
        { id: '2', name: 'Martín Cardozo', phone: '+54 381 777-6666' }
      ]);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.destination || !form.departureDate) return;

    setSaving(true);
    try {
      const selectedCoord = coordinators.find(c => c.id === form.coordinatorId);
      const coordinatorName = selectedCoord ? selectedCoord.name : 'Laura Gómez';

      const payload = {
        title: form.title,
        destination: form.destination,
        departureDate: form.departureDate,
        returnDate: form.returnDate,
        departureOrigin: form.departureOrigin,
        coordinatorId: form.coordinatorId || '1',
        coordinatorName,
        totalSeats: Number(form.totalSeats),
        availableSeats: Number(form.totalSeats), // initially all are free
        pricePerPerson: Number(form.pricePerPerson),
        currency: form.currency,
        notes: form.notes,
        createdAt: Date.now(),
        passengers: [],
        roomingList: []
      };

      await addDoc(collection(db, 'contracted_trips'), payload);
      
      setSuccess(true);
      setForm({
        title: '',
        destination: '',
        departureDate: '',
        returnDate: '',
        departureOrigin: '',
        coordinatorId: coordinators[0]?.id || '',
        totalSeats: '40',
        pricePerPerson: '45000',
        currency: 'ARS',
        notes: ''
      });
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error("Error creating contracted group trip:", err);
      alert("Error al registrar viaje grupal.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50 space-y-6">
      
      {/* Back */}
      <Link href="/experiences" className="flex w-fit items-center gap-1.5 text-sm text-slate-500 hover:text-tech-blue transition-colors">
        <ArrowLeft className="h-4 w-4" /> Volver al Tablero
      </Link>

      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-tech-blue flex items-center gap-2">
            <PlusCircle className="h-7 w-7 text-green-500" />
            Crear Viaje Grupal
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 font-medium">Configurar nuevo contingente, tour corporativo o viaje especial cerrado.</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-center gap-2.5 text-xs font-bold">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ¡Viaje Grupal registrado y habilitado con éxito en el catálogo operativo!
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Nombre / Título del Viaje Grupal *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
              placeholder="Ej: Promo Alumnos Colegio San Javier — Iruya 2026"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Destino *</label>
              <input
                type="text"
                required
                value={form.destination}
                onChange={e => setForm(p => ({ ...p, destination: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                placeholder="Ej: Salta & Jujuy"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Lugar de Salida (Origen)</label>
              <input
                type="text"
                value={form.departureOrigin}
                onChange={e => setForm(p => ({ ...p, departureOrigin: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                placeholder="Ej: San Miguel de Tucumán"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Fecha de Salida *</label>
              <input
                type="date"
                required
                value={form.departureDate}
                onChange={e => setForm(p => ({ ...p, departureDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Fecha de Regreso</label>
              <input
                type="date"
                value={form.returnDate}
                onChange={e => setForm(p => ({ ...p, returnDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Cupos / Plazas *</label>
              <input
                type="number"
                required
                min="1"
                value={form.totalSeats}
                onChange={e => setForm(p => ({ ...p, totalSeats: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                placeholder="40"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Precio por Pasajero *</label>
              <input
                type="number"
                required
                min="0"
                value={form.pricePerPerson}
                onChange={e => setForm(p => ({ ...p, pricePerPerson: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                placeholder="45000"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Moneda</label>
              <select
                value={form.currency}
                onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none bg-white focus:border-tech-blue"
              >
                <option value="ARS">Pesos (ARS)</option>
                <option value="USD">Dólares (USD)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Asignar Coordinador de Viaje</label>
            <select
              value={form.coordinatorId}
              onChange={e => setForm(p => ({ ...p, coordinatorId: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none bg-white focus:border-tech-blue"
            >
              <option value="">Seleccionar Coordinador</option>
              {coordinators.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Observaciones / Itinerario / Notas</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue h-24 resize-none"
              placeholder="Detallar itinerario sugerido o exigencias especiales de hotelería..."
            />
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-tech-blue px-6 py-2.5 text-xs font-bold text-white hover:bg-tech-blue/90 shadow-md transition-all active:scale-[0.98]"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Guardando...' : 'Crear Viaje Grupal'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
