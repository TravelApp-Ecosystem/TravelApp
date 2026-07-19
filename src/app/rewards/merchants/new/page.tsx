'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserPlus, Save, ArrowLeft, CheckCircle2, Upload, Eye, X } from 'lucide-react';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface RewardRule {
  id: string;
  name: string;
}

export default function NewAssociatedMerchantPage() {
  const [form, setForm] = useState({
    nombreFantasia: '',
    razonSocial: '',
    cuit: '',
    domicilio: '',
    localidad: '',
    provincia: '',
    codigoPostal: '',
    titularName: '',
    titularCargo: '',
    telefono: '',
    redesSociales: '',
    convenioScanBase64: '',
    fechaAlta: '',
    fechaVencimiento: '',
    asesorName: '',
    ejecutivoName: '',
    reglaAcordadaId: '',
    rubroName: 'Gastronomía',
    categoryName: 'Gold',
    username: '',
    password: ''
  });

  const [rules, setRules] = useState<RewardRule[]>([]);
  const [rubros, setRubros] = useState<string[]>(['Gastronomía', 'Traslados Logísticos', 'Alojamiento & Tours', 'Retail y Compras', 'Salud y Bienestar', 'Entretenimiento']);
  const [categories, setCategories] = useState<string[]>(['Gold', 'Silver', 'Bronze', 'Platinum', 'VIP']);
  
  const [isUploading, setIsUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Sync rules, rubros & categories from firestore if available
  useEffect(() => {
    // 1. Rules
    const unsubRules = onSnapshot(collection(db, 'reward_rules'), (snap) => {
      const list: RewardRule[] = snap.docs.map(d => ({
        id: d.id,
        name: d.data().name || 'Regla'
      }));
      setRules(list.length > 0 ? list : [
        { id: '1', name: 'TravelCab Estándar' },
        { id: '2', name: 'Experiencias VIP' }
      ]);
    });

    // 2. Rubros
    const unsubRubros = onSnapshot(collection(db, 'reward_rubros'), (snap) => {
      if (!snap.empty) {
        setRubros(snap.docs.map(d => d.data().name));
      }
    });

    // 3. Categories
    const unsubCategories = onSnapshot(collection(db, 'reward_categories'), (snap) => {
      if (!snap.empty) {
        setCategories(snap.docs.map(d => d.data().name));
      }
    });

    return () => {
      unsubRules();
      unsubRubros();
      unsubCategories();
    };
  }, []);

  const handleScanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const base64 = canvas.toDataURL('image/jpeg', 0.65);
        setForm(p => ({ ...p, convenioScanBase64: base64 }));
        setIsUploading(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombreFantasia || !form.razonSocial || !form.cuit) return;

    setSaving(true);
    try {
      const payload = {
        ...form,
        createdAt: Date.now(),
        status: 'Activo'
      };

      await addDoc(collection(db, 'rewards_merchants'), payload);

      setSuccess(true);
      setForm({
        nombreFantasia: '',
        razonSocial: '',
        cuit: '',
        domicilio: '',
        localidad: '',
        provincia: '',
        codigoPostal: '',
        titularName: '',
        titularCargo: '',
        telefono: '',
        redesSociales: '',
        convenioScanBase64: '',
        fechaAlta: '',
        fechaVencimiento: '',
        asesorName: '',
        ejecutivoName: '',
        reglaAcordadaId: rules[0]?.id || '',
        rubroName: rubros[0] || 'Gastronomía',
        categoryName: categories[0] || 'Gold',
        username: '',
        password: ''
      });
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error("Error creating merchant:", err);
      alert("Error al dar de alta el comercio.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50 space-y-6">
      
      {/* Back */}
      <Link href="/rewards/analytics" className="flex w-fit items-center gap-1.5 text-sm text-slate-500 hover:text-tech-blue transition-colors">
        <ArrowLeft className="h-4 w-4" /> Volver al Tablero
      </Link>

      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-tech-blue flex items-center gap-2">
            <UserPlus className="h-7 w-7 text-vial-orange" />
            Comercio Asociado
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 font-medium">Registrar un nuevo comercio asociado y convenio comercial en la red de canjes.</p>
        </div>
      </div>

      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-center gap-2.5 text-xs font-bold">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ¡Comercio Asociado dado de alta con éxito en la red de Rewards!
            </div>
          )}

          {/* Sección 1: Información Comercial */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-tech-blue uppercase tracking-wide">1. Identificación Comercial</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nombre de Fantasía *</label>
                <input
                  type="text"
                  required
                  value={form.nombreFantasia}
                  onChange={e => setForm(p => ({ ...p, nombreFantasia: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                  placeholder="Ej: McDonald's Pilar"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Razón Social *</label>
                <input
                  type="text"
                  required
                  value={form.razonSocial}
                  onChange={e => setForm(p => ({ ...p, razonSocial: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                  placeholder="Ej: Arcos Dorados S.A."
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">CUIT / DNI *</label>
                <input
                  type="text"
                  required
                  value={form.cuit}
                  onChange={e => setForm(p => ({ ...p, cuit: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                  placeholder="Ej: 30-11223344-9"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Rubro</label>
                <select
                  value={form.rubroName}
                  onChange={e => setForm(p => ({ ...p, rubroName: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none bg-white focus:border-tech-blue"
                >
                  {rubros.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Categoría Comercio</label>
                <select
                  value={form.categoryName}
                  onChange={e => setForm(p => ({ ...p, categoryName: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none bg-white focus:border-tech-blue"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1">Domicilio</label>
                <input
                  type="text"
                  value={form.domicilio}
                  onChange={e => setForm(p => ({ ...p, domicilio: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                  placeholder="Av. 12 de Octubre 1500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Localidad</label>
                <input
                  type="text"
                  value={form.localidad}
                  onChange={e => setForm(p => ({ ...p, localidad: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                  placeholder="Pilar"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">C.P. / Provincia</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={form.codigoPostal}
                    onChange={e => setForm(p => ({ ...p, codigoPostal: e.target.value }))}
                    className="w-1/3 rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                    placeholder="1630"
                  />
                  <input
                    type="text"
                    value={form.provincia}
                    onChange={e => setForm(p => ({ ...p, provincia: e.target.value }))}
                    className="flex-1 rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                    placeholder="Buenos Aires"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sección 2: Titular de Contacto */}
          <div className="border-t border-slate-100 pt-4 space-y-4">
            <h3 className="text-xs font-black text-tech-blue uppercase tracking-wide">2. Representante / Contacto</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Titular (Nombre Completo)</label>
                <input
                  type="text"
                  value={form.titularName}
                  onChange={e => setForm(p => ({ ...p, titularName: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                  placeholder="Carlos Alberto Pérez"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Cargo / Función</label>
                <input
                  type="text"
                  value={form.titularCargo}
                  onChange={e => setForm(p => ({ ...p, titularCargo: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                  placeholder="Gerente Comercial"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={form.telefono}
                  onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                  placeholder="+54 11 555-5555"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Redes Sociales / Sitio Web</label>
              <input
                type="text"
                value={form.redesSociales}
                onChange={e => setForm(p => ({ ...p, redesSociales: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                placeholder="Instagram: @mcdonalds_ar · www.mcdonalds.com.ar"
              />
            </div>
          </div>

          {/* Sección 3: Convenio Comercial */}
          <div className="border-t border-slate-100 pt-4 space-y-4">
            <h3 className="text-xs font-black text-tech-blue uppercase tracking-wide">3. Detalles del Convenio</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Fecha de Alta</label>
                <input
                  type="date"
                  value={form.fechaAlta}
                  onChange={e => setForm(p => ({ ...p, fechaAlta: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Fecha de Vencimiento</label>
                <input
                  type="date"
                  value={form.fechaVencimiento}
                  onChange={e => setForm(p => ({ ...p, fechaVencimiento: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Asesor / Comercial</label>
                <input
                  type="text"
                  value={form.asesorName}
                  onChange={e => setForm(p => ({ ...p, asesorName: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                  placeholder="Ej: Laura Gómez"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Ejecutivo de Cuentas</label>
                <input
                  type="text"
                  value={form.ejecutivoName}
                  onChange={e => setForm(p => ({ ...p, ejecutivoName: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                  placeholder="Ej: Martín Cardozo"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Regla Acordada de Puntos</label>
                <select
                  value={form.reglaAcordadaId}
                  onChange={e => setForm(p => ({ ...p, reglaAcordadaId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none bg-white focus:border-tech-blue"
                >
                  <option value="">Seleccionar Regla...</option>
                  {rules.map(rule => <option key={rule.id} value={rule.id}>{rule.name}</option>)}
                </select>
              </div>
            </div>

            {/* Subir Scan de Convenio */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Cargar Copia Firmada de Convenio (PDF/Imagen)</label>
              <div className="flex gap-2 items-center">
                <label className="flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 cursor-pointer text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all h-[38px]">
                  <Upload className="h-4 w-4 mr-1.5" />
                  {isUploading ? 'Subiendo...' : 'Adjuntar Documento'}
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleScanUpload} />
                </label>

                {form.convenioScanBase64 && (
                  <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-250 px-3 py-1.5 rounded-lg text-xs text-emerald-800 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Documento Cargado
                    <button 
                      type="button" 
                      onClick={() => setForm(p => ({ ...p, convenioScanBase64: '' }))}
                      className="text-slate-400 hover:text-slate-600 ml-1"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sección 4: Credenciales del Portal del Comercio */}
          <div className="border-t border-slate-100 pt-4 space-y-4">
            <h3 className="text-xs font-black text-tech-blue uppercase tracking-wide">4. Credenciales de Validación del Comercio</h3>
            <p className="text-[11px] text-slate-400 font-medium">Estas claves le permitirán al comercio validar cupones en la aplicación móvil o web.</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nombre de Usuario *</label>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                  placeholder="Ej: arcos.pilar"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Contraseña de Validación *</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                  placeholder="Min 6 caracteres"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-tech-blue px-6 py-2.5 text-xs font-bold text-white hover:bg-tech-blue/90 shadow-md transition-all active:scale-[0.98]"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Guardando...' : 'Dar de Alta'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
