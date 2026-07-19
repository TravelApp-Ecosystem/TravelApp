'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { UserPlus, Save, ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function NewCustomerPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    documentNumber: '',
    passport: '',
    emergencyContact: '',
    medicalNotes: '',
    observations: ''
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email) return;

    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        displayName: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        phone: form.phone,
        documentNumber: form.documentNumber,
        passport: form.passport,
        emergencyContact: form.emergencyContact,
        medicalNotes: form.medicalNotes,
        observations: form.observations,
        createdAt: Date.now(),
        source: 'Experience Admin'
      };

      // Add to crm_customers or passengers collection
      await addDoc(collection(db, 'crm_customers'), payload);
      
      setSuccess(true);
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        documentNumber: '',
        passport: '',
        emergencyContact: '',
        medicalNotes: '',
        observations: ''
      });
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error("Error creating customer:", err);
      alert("Error al registrar cliente.");
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
            <UserPlus className="h-7 w-7 text-green-500" />
            Crear Cliente
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 font-medium">Registrar nuevo pasajero en la base central de datos de Concorde 360.</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-center gap-2.5 text-xs font-bold">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ¡Cliente registrado con éxito en la base de datos central!
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Nombre *</label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                placeholder="Ej: Juan"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Apellido *</label>
              <input
                type="text"
                required
                value={form.lastName}
                onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                placeholder="Ej: Pérez"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Correo Electrónico *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                placeholder="juan.perez@correo.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Teléfono</label>
              <input
                type="text"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                placeholder="+54 9 381 456-7890"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">DNI / Documento</label>
              <input
                type="text"
                value={form.documentNumber}
                onChange={e => setForm(p => ({ ...p, documentNumber: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                placeholder="Ej: 34555888"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Nro. Pasaporte</label>
              <input
                type="text"
                value={form.passport}
                onChange={e => setForm(p => ({ ...p, passport: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                placeholder="Ej: AAA999888"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-4">
            <p className="text-xs font-black text-tech-blue uppercase tracking-wide">Ficha Médica &amp; Seguridad</p>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Contacto de Emergencia (Nombre y Teléfono)</label>
              <input
                type="text"
                value={form.emergencyContact}
                onChange={e => setForm(p => ({ ...p, emergencyContact: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                placeholder="Ej: María Pérez (Esposa) - 3815554433"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Notas Médicas / Alergias / Medicación</label>
              <textarea
                value={form.medicalNotes}
                onChange={e => setForm(p => ({ ...p, medicalNotes: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue h-20 resize-none"
                placeholder="Ej: Hipertenso, medicado con Losartán. Alérgico a la penicilina."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Observaciones Generales</label>
              <input
                type="text"
                value={form.observations}
                onChange={e => setForm(p => ({ ...p, observations: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                placeholder="Preferencia de asiento, restricciones alimentarias, etc."
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-tech-blue px-6 py-2.5 text-xs font-bold text-white hover:bg-tech-blue/90 shadow-md transition-all active:scale-[0.98]"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Guardando...' : 'Guardar Registro'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
