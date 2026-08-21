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
    dob: '',
    gender: 'M',
    nationality: 'Argentina',
    taxCondition: 'Consumidor Final',
    cuitCuil: '',
    businessName: '',
    emergencyContact: '',
    medicalNotes: '',
    observations: '',
    allergies: '',
    dietaryRestrictions: '',
  });

  const [familyMembers, setFamilyMembers] = useState<{
    fullName: string;
    relationship: string;
    documentType: string;
    documentNumber: string;
    dob: string;
  }[]>([]);

  const [newFamName, setNewFamName] = useState('');
  const [newFamRel, setNewFamRel] = useState('Cónyuge');
  const [newFamDoc, setNewFamDoc] = useState('');
  const [newFamDob, setNewFamDob] = useState('');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAddFamily = () => {
    if (!newFamName || !newFamDoc) return alert('Ingresá nombre y documento del familiar.');
    setFamilyMembers(prev => [
      ...prev,
      {
        fullName: newFamName,
        relationship: newFamRel,
        documentType: 'DNI',
        documentNumber: newFamDoc,
        dob: newFamDob
      }
    ]);
    setNewFamName('');
    setNewFamDoc('');
    setNewFamDob('');
  };

  const handleRemoveFamily = (idx: number) => {
    setFamilyMembers(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email) return;

    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        displayName: `${form.firstName} ${form.lastName}`.trim(),
        customerName: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        phone: form.phone,
        documentNumber: form.documentNumber,
        passport: form.passport,
        dob: form.dob,
        gender: form.gender,
        nationality: form.nationality,
        customerLevel: 2,
        customerStatus: 'Cliente',
        taxData: {
          taxCondition: form.taxCondition,
          cuitCuil: form.cuitCuil,
          businessName: form.businessName
        },
        emergencyContact: {
          name: form.emergencyContact,
          phone: form.phone
        },
        medicalNotes: form.medicalNotes,
        observations: form.observations,
        allergies: form.allergies,
        dietaryRestrictions: form.dietaryRestrictions,
        familyMembers,
        createdAt: Date.now(),
        source: 'Experience Admin'
      };

      // Add to crm_customers & users
      await addDoc(collection(db, 'crm_customers'), payload);
      await addDoc(collection(db, 'users'), payload);
      
      setSuccess(true);
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        documentNumber: '',
        passport: '',
        dob: '',
        gender: 'M',
        nationality: 'Argentina',
        taxCondition: 'Consumidor Final',
        cuitCuil: '',
        businessName: '',
        emergencyContact: '',
        medicalNotes: '',
        observations: '',
        allergies: '',
        dietaryRestrictions: '',
      });
      setFamilyMembers([]);
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
            Crear Ficha Completa de Cliente &amp; Familia
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 font-medium">Registrar nuevo pasajero en la base central de datos de Concorde 360 con datos de emisión IATA, fiscales y familiares.</p>
        </div>
      </div>

      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-center gap-2.5 text-xs font-bold">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ¡Cliente VIP registrado con éxito en la base de datos central!
            </div>
          )}

          {/* 1. Datos Personales */}
          <div>
            <p className="text-xs font-black text-tech-blue uppercase tracking-wide mb-3">1. Datos Personales &amp; Contacto</p>
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

            <div className="grid grid-cols-2 gap-4 mt-3">
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
                <label className="block text-xs font-bold text-slate-500 mb-1">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                  placeholder="+54 9 381 456-7890"
                />
              </div>
            </div>
          </div>

          {/* 2. Documentos & Emisión */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-black text-tech-blue uppercase tracking-wide mb-3">2. Documentación &amp; Emisión IATA</p>
            <div className="grid grid-cols-3 gap-4">
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
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Fecha de Nacimiento</label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={e => setForm(p => ({ ...p, dob: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                />
              </div>
            </div>
          </div>

          {/* 3. Datos Fiscales */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-black text-tech-blue uppercase tracking-wide mb-3">3. Facturación Fiscal (AFIP)</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Condición IVA</label>
                <select
                  value={form.taxCondition}
                  onChange={e => setForm(p => ({ ...p, taxCondition: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue bg-white"
                >
                  <option value="Consumidor Final">Consumidor Final</option>
                  <option value="Monotributista">Monotributista</option>
                  <option value="Responsable Inscripto">Responsable Inscripto</option>
                  <option value="Exento">Exento</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">CUIT / CUIL</label>
                <input
                  type="text"
                  value={form.cuitCuil}
                  onChange={e => setForm(p => ({ ...p, cuitCuil: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                  placeholder="20-34555888-9"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Razón Social</label>
                <input
                  type="text"
                  value={form.businessName}
                  onChange={e => setForm(p => ({ ...p, businessName: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                  placeholder="Empresa S.A."
                />
              </div>
            </div>
          </div>

          {/* 4. Grupo Familiar */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <p className="text-xs font-black text-tech-blue uppercase tracking-wide">4. Grupo Familiar &amp; Acompañantes</p>
            
            {familyMembers.length > 0 && (
              <div className="space-y-2">
                {familyMembers.map((fam, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-sky-50 border border-sky-100 p-2.5 rounded-xl text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{fam.fullName}</span>
                      <span className="ml-2 bg-sky-200 text-sky-800 font-bold px-2 py-0.5 rounded text-[10px]">{fam.relationship}</span>
                      <span className="ml-2 text-slate-500">DNI: {fam.documentNumber} {fam.dob ? `· Nac: ${fam.dob}` : ''}</span>
                    </div>
                    <button type="button" onClick={() => handleRemoveFamily(idx)} className="text-red-500 font-bold text-xs hover:underline">
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 items-end">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Nombre Familiar</label>
                <input
                  type="text"
                  value={newFamName}
                  onChange={e => setNewFamName(e.target.value)}
                  placeholder="Ej: María Pérez"
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 bg-white outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Parentesco</label>
                <select
                  value={newFamRel}
                  onChange={e => setNewFamRel(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700 bg-white outline-none"
                >
                  <option value="Cónyuge">Cónyuge</option>
                  <option value="Hijo/a">Hijo/a</option>
                  <option value="Padre/Madre">Padre/Madre</option>
                  <option value="Hermano/a">Hermano/a</option>
                  <option value="Amigo/a">Amigo/a</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">DNI / Documento</label>
                <input
                  type="text"
                  value={newFamDoc}
                  onChange={e => setNewFamDoc(e.target.value)}
                  placeholder="38111222"
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 bg-white outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleAddFamily}
                className="bg-sky-700 text-white rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-sky-800 transition-all h-[34px]"
              >
                + Añadir Familiar
              </button>
            </div>
          </div>

          {/* 5. Ficha Médica & Observaciones */}
          <div className="border-t border-slate-100 pt-4 space-y-4">
            <p className="text-xs font-black text-tech-blue uppercase tracking-wide">5. Ficha Médica &amp; Seguridad</p>
            
            <div className="grid grid-cols-2 gap-4">
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
                <label className="block text-xs font-bold text-slate-500 mb-1">Dietas / Restricciones Alimentarias</label>
                <input
                  type="text"
                  value={form.dietaryRestrictions}
                  onChange={e => setForm(p => ({ ...p, dietaryRestrictions: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                  placeholder="Ej: Celíaco, Vegano, etc."
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Notas Médicas / Alergias / Medicación</label>
              <textarea
                value={form.medicalNotes}
                onChange={e => setForm(p => ({ ...p, medicalNotes: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue h-16 resize-none"
                placeholder="Ej: Hipertenso, medicado con Losartán. Alérgico a la penicilina."
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
              {saving ? 'Guardando...' : 'Guardar Ficha Completa'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
