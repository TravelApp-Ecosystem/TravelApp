"use client";

import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, HelpCircle, ShieldAlert, Building2, DollarSign, Clock, Percent } from 'lucide-react';
import { MUTariff, VehicleCategory, Branch, TariffSpecialRate, TariffPenalties } from '@/types/logistics';
import { collection, onSnapshot, doc, setDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface MUTariffFormProps {
  editData?: MUTariff | null;
  onSubmitSuccess?: () => void;
}

export const MUTariffForm: React.FC<MUTariffFormProps> = ({ editData, onSubmitSuccess }) => {
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<Partial<MUTariff>>({
    name: '',
    branchIds: [],
    category: '',
    baseFare: 0,
    pricePerKm: 0,
    minimumFare: 0,
    waitMinutePrice: 0,
    courtesyTimeMinutes: 5,
    travelMinutePrice: 0,
    penalties: {
      cancelGracePeriodMinutes: 3,
      cancelFixedFee: 1500,
      postAcceptanceCancelFeeType: 'percentage',
      postAcceptanceCancelFeeValue: 20,
      postAcceptanceGraceMinutes: 2,
      driverCancelPenaltyFee: 2000,
    },
    iva: 21,
    iibb: 3.5,
    taxMunicipal: 1.5,
    electronicPaymentFee: 5,
    commissionRate: 15,
    weeklyMembership: 5000,
    specialRates: [],
  });

  // Cargar categorías y sucursales dinámicas en tiempo real
  useEffect(() => {
    const unsubCats = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as VehicleCategory);
      setCategories(list);
    }, (err) => {
      console.error("Error loading categories in MUTariffForm:", err);
    });

    const unsubBranches = onSnapshot(collection(db, 'branches'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Branch);
      setBranches(list);
      setIsLoadingData(false);
    }, (err) => {
      console.error("Error loading branches in MUTariffForm:", err);
      setIsLoadingData(false);
    });

    return () => {
      unsubCats();
      unsubBranches();
    };
  }, []);

  // Sincronizar editData cuando cambie
  useEffect(() => {
    if (editData) {
      setFormData({
        ...editData,
        branchIds: editData.branchIds ?? [],
        penalties: {
          cancelGracePeriodMinutes: editData.penalties?.cancelGracePeriodMinutes ?? 3,
          cancelFixedFee: editData.penalties?.cancelFixedFee ?? 1500,
          postAcceptanceCancelFeeType: editData.penalties?.postAcceptanceCancelFeeType ?? 'percentage',
          postAcceptanceCancelFeeValue: editData.penalties?.postAcceptanceCancelFeeValue ?? 20,
          postAcceptanceGraceMinutes: editData.penalties?.postAcceptanceGraceMinutes ?? 2,
          driverCancelPenaltyFee: editData.penalties?.driverCancelPenaltyFee ?? 2000,
        },
        iva: editData.iva ?? 21,
        iibb: editData.iibb ?? 3.5,
        taxMunicipal: editData.taxMunicipal ?? 1.5,
        electronicPaymentFee: editData.electronicPaymentFee ?? 5,
        commissionRate: editData.commissionRate ?? 15,
        weeklyMembership: editData.weeklyMembership ?? 5000,
        specialRates: editData.specialRates ?? [],
      });
    } else {
      setFormData({
        name: '',
        branchIds: [],
        category: '',
        baseFare: 0,
        pricePerKm: 0,
        minimumFare: 0,
        waitMinutePrice: 0,
        courtesyTimeMinutes: 5,
        travelMinutePrice: 0,
        penalties: {
          cancelGracePeriodMinutes: 3,
          cancelFixedFee: 1500,
          postAcceptanceCancelFeeType: 'percentage',
          postAcceptanceCancelFeeValue: 20,
          postAcceptanceGraceMinutes: 2,
          driverCancelPenaltyFee: 2000,
        },
        iva: 21,
        iibb: 3.5,
        taxMunicipal: 1.5,
        electronicPaymentFee: 5,
        commissionRate: 15,
        weeklyMembership: 5000,
        specialRates: [],
      });
    }
  }, [editData]);

  const toggleBranch = (branchId: string) => {
    const current = formData.branchIds || [];
    if (branchId === 'all') {
      if (current.includes('all')) {
        setFormData({ ...formData, branchIds: [] });
      } else {
        setFormData({ ...formData, branchIds: ['all'] });
      }
      return;
    }

    let updated: string[];
    if (current.includes('all')) {
      updated = [branchId];
    } else if (current.includes(branchId)) {
      updated = current.filter(id => id !== branchId);
    } else {
      updated = [...current, branchId];
    }
    setFormData({ ...formData, branchIds: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.name?.trim()) {
      alert("Por favor ingresa un nombre para el tarifario.");
      return;
    }
    if (!formData.category) {
      alert("Por favor selecciona una categoría para el servicio.");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalId = formData.id?.trim() || '';
      const isEditing = Boolean(finalId);
      
      if (!isEditing) {
        const newDocRef = doc(collection(db, 'tariffs'));
        finalId = newDocRef.id;
      }

      const tariffData: MUTariff = {
        name: formData.name.trim(),
        branchIds: formData.branchIds && formData.branchIds.length > 0 ? formData.branchIds : ['all'],
        category: formData.category,
        baseFare: Number(formData.baseFare || 0),
        pricePerKm: Number(formData.pricePerKm || 0),
        minimumFare: Number(formData.minimumFare || 0),
        waitMinutePrice: Number(formData.waitMinutePrice || 0),
        courtesyTimeMinutes: Number(formData.courtesyTimeMinutes || 0),
        travelMinutePrice: Number(formData.travelMinutePrice || 0),
        penalties: formData.penalties || {
          cancelGracePeriodMinutes: 3,
          cancelFixedFee: 1500,
          postAcceptanceCancelFeeType: 'percentage',
          postAcceptanceCancelFeeValue: 20,
          postAcceptanceGraceMinutes: 2,
          driverCancelPenaltyFee: 2000,
        },
        iva: Number(formData.iva ?? 21),
        iibb: Number(formData.iibb ?? 3.5),
        taxMunicipal: Number(formData.taxMunicipal ?? 1.5),
        electronicPaymentFee: Number(formData.electronicPaymentFee ?? 5),
        commissionRate: Number(formData.commissionRate ?? 15),
        weeklyMembership: Number(formData.weeklyMembership ?? 5000),
        specialRates: formData.specialRates || [],
        type: 'mu',
        isActive: formData.isActive ?? true,
        id: finalId,
      };

      // Guardar exactamente un solo documento atómico
      await setDoc(doc(db, 'tariffs', finalId), {
        ...tariffData,
        updatedAt: Date.now(),
        ...(isEditing ? {} : { createdAt: Date.now() })
      });

      alert(isEditing ? "Tarifario MU actualizado exitosamente en Firestore" : "Tarifario MU creado exitosamente en Firestore");
      
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error: any) {
      console.error("Error saving MU tariff:", error);
      alert("Hubo un error al guardar el tarifario: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* 1. CONFIGURACIÓN GENERAL Y SUCURSALES */}
      <div className="rounded-xl border border-slate-200 bg-white/70 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-tech-blue flex items-center gap-2">
          <Building2 className="h-4 w-4 text-vial-orange" />
          Identificación y Asignación de Sucursal
        </h3>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Nombre del Tarifario</label>
            <input 
              type="text" 
              required
              placeholder="Ej. Tarifa Diurna Tucumán Centro"
              value={formData.name || ''}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-tech-blue focus:border-vial-orange focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Categoría del Servicio</label>
            <select
              required
              value={formData.category || ''}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-tech-blue focus:border-vial-orange focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="">Selecciona una categoría...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selector de Sucursales Asignadas */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-600">
            Sucursales donde Aplica este Tarifario
          </label>
          <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => toggleBranch('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                formData.branchIds?.includes('all') || !formData.branchIds || formData.branchIds.length === 0
                  ? 'bg-tech-blue text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              🌐 Todas las Sucursales
            </button>
            {branches.map(b => {
              const isSelected = !formData.branchIds?.includes('all') && formData.branchIds?.includes(b.id);
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => toggleBranch(b.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-vial-orange text-gray-950 shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  📍 {b.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. VALORES DE RUTA (TAXÍMETRO / KILÓMETRO) */}
      <div className="rounded-xl border border-slate-200 bg-white/70 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-tech-blue flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-emerald-600" />
          Estructura de Precios Base (Movilidad Urbana)
        </h3>
        
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Bajada de Bandera ($)</label>
            <input 
              type="number" 
              required
              min="0"
              value={formData.baseFare || 0}
              onChange={(e) => setFormData({...formData, baseFare: Number(e.target.value)})}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-tech-blue font-bold focus:border-vial-orange focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Valor del Km ($)</label>
            <input 
              type="number" 
              required
              min="0"
              value={formData.pricePerKm || 0}
              onChange={(e) => setFormData({...formData, pricePerKm: Number(e.target.value)})}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-tech-blue font-bold focus:border-vial-orange focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Valor Mínimo del Viaje ($)</label>
            <input 
              type="number" 
              required
              min="0"
              value={formData.minimumFare || 0}
              onChange={(e) => setFormData({...formData, minimumFare: Number(e.target.value)})}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-tech-blue font-bold focus:border-vial-orange focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Valor de Minuto en Viaje ($)</label>
            <input 
              type="number" 
              required
              min="0"
              value={formData.travelMinutePrice || 0}
              onChange={(e) => setFormData({...formData, travelMinutePrice: Number(e.target.value)})}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-tech-blue font-bold focus:border-vial-orange focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Valor de Minuto de Espera ($)</label>
            <input 
              type="number" 
              required
              min="0"
              value={formData.waitMinutePrice || 0}
              onChange={(e) => setFormData({...formData, waitMinutePrice: Number(e.target.value)})}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-tech-blue font-bold focus:border-vial-orange focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Tiempo de Cortesía (Minutos)</label>
            <input 
              type="number" 
              required
              min="0"
              value={formData.courtesyTimeMinutes || 0}
              onChange={(e) => setFormData({...formData, courtesyTimeMinutes: Number(e.target.value)})}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-tech-blue font-bold focus:border-vial-orange focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 3. PENALIDADES PASAJERO Y MULTA AL CONDUCTOR */}
      <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-rose-800 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-600" />
            Políticas de Cancelación, Penalidades y Multas
          </h3>
          <span className="text-[11px] font-semibold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
            Pasajero & Chofer
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white p-3 rounded-lg border border-rose-100">
            <label className="mb-1 block text-xs font-semibold text-slate-700">Tiempo para Cancelar Sin Cargo</label>
            <div className="flex items-center gap-1.5">
              <input 
                type="number" 
                min="0"
                required
                value={formData.penalties?.cancelGracePeriodMinutes || 0}
                onChange={(e) => setFormData({
                  ...formData,
                  penalties: { ...formData.penalties!, cancelGracePeriodMinutes: Number(e.target.value) }
                })}
                className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm font-bold text-tech-blue"
              />
              <span className="text-xs text-slate-500 font-semibold">min</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Margen gratuito antes de aplicar penalidad al pasajero.</p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-rose-100">
            <label className="mb-1 block text-xs font-semibold text-slate-700">Monto Fijo Penalidad Pre-Aceptación ($)</label>
            <input 
              type="number" 
              min="0"
              required
              value={formData.penalties?.cancelFixedFee || 0}
              onChange={(e) => setFormData({
                ...formData,
                penalties: { ...formData.penalties!, cancelFixedFee: Number(e.target.value) }
              })}
              className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm font-bold text-rose-600"
            />
            <p className="text-[10px] text-slate-400 mt-1">Cargo al cancelar fuera de tiempo antes de confirmación.</p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-rose-100">
            <label className="mb-1 block text-xs font-semibold text-slate-700">Penalidad Post-Aceptación</label>
            <div className="flex gap-2">
              <select
                value={formData.penalties?.postAcceptanceCancelFeeType || 'percentage'}
                onChange={(e) => setFormData({
                  ...formData,
                  penalties: { ...formData.penalties!, postAcceptanceCancelFeeType: e.target.value as any }
                })}
                className="rounded-md border border-slate-200 px-2 py-1.5 text-xs font-bold text-slate-700 bg-slate-50"
              >
                <option value="percentage">% Porcentaje</option>
                <option value="fixed">$ Fijo</option>
              </select>
              <input 
                type="number" 
                min="0"
                required
                value={formData.penalties?.postAcceptanceCancelFeeValue || 0}
                onChange={(e) => setFormData({
                  ...formData,
                  penalties: { ...formData.penalties!, postAcceptanceCancelFeeValue: Number(e.target.value) }
                })}
                className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm font-bold text-rose-600"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Ej: 20% del viaje cotizado o monto fijo si ya aceptó chofer.</p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-rose-100">
            <label className="mb-1 block text-xs font-semibold text-slate-700">Tiempo de Gracia Post-Aceptación</label>
            <div className="flex items-center gap-1.5">
              <input 
                type="number" 
                min="0"
                required
                value={formData.penalties?.postAcceptanceGraceMinutes || 0}
                onChange={(e) => setFormData({
                  ...formData,
                  penalties: { ...formData.penalties!, postAcceptanceGraceMinutes: Number(e.target.value) }
                })}
                className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm font-bold text-tech-blue"
              />
              <span className="text-xs text-slate-500 font-semibold">min</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Minutos tras la aceptación del chofer sin cobro de multa.</p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-rose-100 sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-700">Multa al Chofer por Cancelar Viaje Aceptado ($)</label>
            <input 
              type="number" 
              min="0"
              required
              value={formData.penalties?.driverCancelPenaltyFee || 0}
              onChange={(e) => setFormData({
                ...formData,
                penalties: { ...formData.penalties!, driverCancelPenaltyFee: Number(e.target.value) }
              })}
              className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm font-bold text-rose-700"
            />
            <p className="text-[10px] text-slate-400 mt-1">Débito automático al saldo/billetera del conductor si cancela un servicio asignado.</p>
          </div>
        </div>
      </div>

      {/* 4. IMPUESTOS (SOBRE COMISIÓN), COMISIÓN Y MEMBRESÍA */}
      <div className="rounded-xl border border-slate-200 bg-white/70 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-tech-blue flex items-center gap-2">
          <Percent className="h-4 w-4 text-indigo-600" />
          Comisión de Plataforma e Impuestos Fiscales (Calculados s/ Comisión)
        </h3>
        
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Comisión de Plataforma (%)</label>
            <input 
              type="number" 
              required
              step="0.1"
              min="0"
              value={formData.commissionRate !== undefined ? formData.commissionRate : 15}
              onChange={(e) => setFormData({...formData, commissionRate: Number(e.target.value)})}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-tech-blue font-bold focus:border-vial-orange focus:outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">Porcentaje de intermediación sobre el viaje.</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Membresía Semanal ($)</label>
            <input 
              type="number" 
              required
              min="0"
              value={formData.weeklyMembership !== undefined ? formData.weeklyMembership : 5000}
              onChange={(e) => setFormData({...formData, weeklyMembership: Number(e.target.value)})}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-tech-blue font-bold focus:border-vial-orange focus:outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">Canon fijo semanal para conductores.</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Tax Pago Electrónico / Tarjeta (%)</label>
            <input 
              type="number" 
              required
              step="0.1"
              min="0"
              value={formData.electronicPaymentFee !== undefined ? formData.electronicPaymentFee : 5}
              onChange={(e) => setFormData({...formData, electronicPaymentFee: Number(e.target.value)})}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-tech-blue font-bold focus:border-vial-orange focus:outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">Recargo por procesamiento de pasarela/billetera.</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">IVA (% s/ Comisión)</label>
            <input 
              type="number" 
              required
              step="0.1"
              min="0"
              value={formData.iva !== undefined ? formData.iva : 21}
              onChange={(e) => setFormData({...formData, iva: Number(e.target.value)})}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-tech-blue focus:border-vial-orange focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">IIBB (% s/ Comisión)</label>
            <input 
              type="number" 
              required
              step="0.01"
              min="0"
              value={formData.iibb !== undefined ? formData.iibb : 3.5}
              onChange={(e) => setFormData({...formData, iibb: Number(e.target.value)})}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-tech-blue focus:border-vial-orange focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">TEM - Tasa Municipal (% s/ Comisión)</label>
            <input 
              type="number" 
              required
              step="0.01"
              min="0"
              value={formData.taxMunicipal !== undefined ? formData.taxMunicipal : 1.5}
              onChange={(e) => setFormData({...formData, taxMunicipal: Number(e.target.value)})}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-tech-blue focus:border-vial-orange focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 5. TARIFAS ESPECIALES (DÍAS Y HORARIOS) */}
      <div className="rounded-xl border border-slate-200 bg-white/70 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-tech-blue flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Tarifas Especiales y Reglas Dinámicas
          </h3>
          <button 
            type="button" 
            onClick={() => {
              const newSpecial: TariffSpecialRate = { 
                id: Date.now().toString(), 
                name: '', 
                daysOfWeek: ['Todos los días'], 
                startTime: '22:00', 
                endTime: '06:00', 
                percentageModifier: 20 
              };
              setFormData({ ...formData, specialRates: [...(formData.specialRates || []), newSpecial] });
            }}
            className="flex items-center text-xs font-bold text-vial-orange hover:opacity-80"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Agregar Regla Horaria
          </button>
        </div>
        
        <div className="space-y-3">
          {!formData.specialRates || formData.specialRates.length === 0 ? (
            <p className="text-sm text-slate-400 py-3 text-center">No hay tarifas especiales asignadas (ej. Tarifa Nocturna +20%).</p>
          ) : (
            formData.specialRates.map((rate) => (
              <div key={rate.id} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-12 items-start relative shadow-sm">
                <div className="absolute top-2 right-2">
                  <button 
                    type="button"
                    onClick={() => {
                      const updated = formData.specialRates?.filter(r => r.id !== rate.id);
                      setFormData({ ...formData, specialRates: updated });
                    }}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="sm:col-span-3">
                  <label className="mb-1 block text-xs font-medium text-slate-500">Nombre</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Nocturna"
                    value={rate.name || ''}
                    onChange={(e) => {
                      const updated = formData.specialRates?.map(r => r.id === rate.id ? { ...r, name: e.target.value } : r);
                      setFormData({ ...formData, specialRates: updated });
                    }}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-tech-blue font-bold focus:border-vial-orange focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="mb-1 block text-xs font-medium text-slate-500">Días</label>
                  <select 
                    multiple
                    value={rate.daysOfWeek || []}
                    onChange={(e) => {
                      const selectedDays = Array.from(e.target.selectedOptions, option => option.value);
                      const updated = formData.specialRates?.map(r => r.id === rate.id ? { ...r, daysOfWeek: selectedDays } : r);
                      setFormData({ ...formData, specialRates: updated });
                    }}
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-tech-blue focus:border-vial-orange focus:outline-none h-14"
                  >
                    {['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo','Todos los días','Feriados'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-500">Inicio</label>
                  <input 
                    type="time" 
                    value={rate.startTime || '00:00'}
                    onChange={(e) => {
                      const updated = formData.specialRates?.map(r => r.id === rate.id ? { ...r, startTime: e.target.value } : r);
                      setFormData({ ...formData, specialRates: updated });
                    }}
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-tech-blue focus:border-vial-orange focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-500">Fin</label>
                  <input 
                    type="time" 
                    value={rate.endTime || '23:59'}
                    onChange={(e) => {
                      const updated = formData.specialRates?.map(r => r.id === rate.id ? { ...r, endTime: e.target.value } : r);
                      setFormData({ ...formData, specialRates: updated });
                    }}
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-tech-blue focus:border-vial-orange focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-500">% Modificador</label>
                  <input 
                    type="number" 
                    placeholder="+20 / -10"
                    value={rate.percentageModifier || 0}
                    onChange={(e) => {
                      const updated = formData.specialRates?.map(r => r.id === rate.id ? { ...r, percentageModifier: Number(e.target.value) } : r);
                      setFormData({ ...formData, specialRates: updated });
                    }}
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-tech-blue font-bold focus:border-vial-orange focus:outline-none"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4 gap-3">
        {formData.id && (
          <button 
            type="button" 
            onClick={() => {
              if (onSubmitSuccess) onSubmitSuccess();
            }}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancelar Edición
          </button>
        )}
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="flex items-center rounded-lg bg-vial-orange px-5 py-2.5 text-sm font-extrabold text-gray-950 hover:opacity-90 shadow-md disabled:opacity-50"
        >
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? "Guardando..." : formData.id ? "Actualizar Tarifario MU" : "Guardar Tarifario MU"}
        </button>
      </div>
    </form>
  );
};

