"use client";

import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, HelpCircle } from 'lucide-react';
import { MUTariff, VehicleCategory } from '@/types/logistics';
import { collection, onSnapshot, doc, setDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface MUTariffFormProps {
  editData?: MUTariff | null;
  onSubmitSuccess?: () => void;
}

export const MUTariffForm: React.FC<MUTariffFormProps> = ({ editData, onSubmitSuccess }) => {
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  
  const [formData, setFormData] = useState<Partial<MUTariff>>({
    name: '',
    category: '',
    baseFare: 0,
    pricePerKm: 0,
    minimumFare: 0,
    waitMinutePrice: 0,
    courtesyTimeMinutes: 5,
    travelMinutePrice: 0,
    iva: 21,
    iibb: 3.5,
    taxMunicipal: 1.5,
    electronicPaymentFee: 5,
    commissionRate: 15,
    weeklyMembership: 5000,
    specialRates: [],
  });

  // Cargar categorías dinámicas en tiempo real
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as VehicleCategory);
      setCategories(list);
      setIsLoadingCategories(false);
    }, (err) => {
      console.error("Error loading categories in MUTariffForm:", err);
      setIsLoadingCategories(false);
    });
    return unsub;
  }, []);

  // Sincronizar editData cuando cambie
  useEffect(() => {
    if (editData) {
      setFormData({
        ...editData,
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
        category: '',
        baseFare: 0,
        pricePerKm: 0,
        minimumFare: 0,
        waitMinutePrice: 0,
        courtesyTimeMinutes: 5,
        travelMinutePrice: 0,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) {
      alert("Por favor selecciona una categoría para el servicio.");
      return;
    }

    try {
      const tariffData = {
        ...formData,
        type: 'mu',
        isActive: formData.isActive ?? false,
        updatedAt: Date.now(),
      };

      let finalId = formData.id;
      if (finalId) {
        // Actualizar existente
        await setDoc(doc(db, 'tariffs', finalId), tariffData);
      } else {
        // Crear nuevo con ID automático
        const docRef = await addDoc(collection(db, 'tariffs'), tariffData);
        finalId = docRef.id;
        await setDoc(doc(db, 'tariffs', finalId), { ...tariffData, id: finalId });
      }

      // Si este tarifario se marca activo, actualizar el doc mu_active de referencia rápida
      if (tariffData.isActive) {
        await setDoc(doc(db, 'tariffs', 'mu_active'), { ...tariffData, id: finalId, isActive: true });
      }

      alert(formData.id ? "Tarifario MU actualizado exitosamente en Firestore" : "Tarifario MU creado exitosamente en Firestore");
      
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error: any) {
      console.error("Error saving MU tariff:", error);
      alert("Hubo un error al guardar el tarifario: " + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white/50 p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-tech-blue">Configuración General MU</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Nombre del Tarifario</label>
            <input 
              type="text" 
              required
              placeholder="Ej. Tarifa Diurna CABA"
              value={formData.name || ''}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-tech-blue focus:border-vial-orange focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Categoría del Vehículo</label>
            <select
              required
              value={formData.category || ''}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-tech-blue focus:border-vial-orange focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="">Selecciona una categoría...</option>
              {isLoadingCategories ? (
                <option disabled>Cargando categorías...</option>
              ) : categories.length === 0 ? (
                <option disabled>No hay categorías creadas. Crea una primero.</option>
              ) : (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.id})
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Bajada de Bandera ($)</label>
            <input 
              type="number" 
              required
              min="0"
              value={formData.baseFare || 0}
              onChange={(e) => setFormData({...formData, baseFare: Number(e.target.value)})}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-tech-blue focus:border-vial-orange focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Precio por KM ($)</label>
            <input 
              type="number" 
              required
              min="0"
              value={formData.pricePerKm || 0}
              onChange={(e) => setFormData({...formData, pricePerKm: Number(e.target.value)})}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-tech-blue focus:border-vial-orange focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Valor Mínimo del Viaje ($)</label>
            <input 
              type="number" 
              required
              min="0"
              value={formData.minimumFare || 0}
              onChange={(e) => setFormData({...formData, minimumFare: Number(e.target.value)})}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-tech-blue focus:border-vial-orange focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Minuto en Viaje ($)</label>
            <input 
              type="number" 
              required
              min="0"
              value={formData.travelMinutePrice || 0}
              onChange={(e) => setFormData({...formData, travelMinutePrice: Number(e.target.value)})}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-tech-blue focus:border-vial-orange focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Minuto de Espera ($)</label>
            <input 
              type="number" 
              required
              min="0"
              value={formData.waitMinutePrice || 0}
              onChange={(e) => setFormData({...formData, waitMinutePrice: Number(e.target.value)})}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-tech-blue focus:border-vial-orange focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Tiempo de Cortesía (Minutos)</label>
            <input 
              type="number" 
              required
              min="0"
              value={formData.courtesyTimeMinutes || 0}
              onChange={(e) => setFormData({...formData, courtesyTimeMinutes: Number(e.target.value)})}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-tech-blue focus:border-vial-orange focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white/50 p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-tech-blue flex items-center gap-1.5">
          Impuestos, Comisiones y Membresías
          <span title="Valores fiscales por localidad y márgenes de la empresa"><HelpCircle className="h-3.5 w-3.5 text-slate-400" /></span>
        </h3>
        
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">IVA (%)</label>
            <input 
              type="number" 
              required
              step="0.1"
              min="0"
              value={formData.iva !== undefined ? formData.iva : 21}
              onChange={(e) => setFormData({...formData, iva: Number(e.target.value)})}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-tech-blue focus:border-vial-orange focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Ingresos Brutos (%)</label>
            <input 
              type="number" 
              required
              step="0.01"
              min="0"
              value={formData.iibb !== undefined ? formData.iibb : 3.5}
              onChange={(e) => setFormData({...formData, iibb: Number(e.target.value)})}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-tech-blue focus:border-vial-orange focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Tasas Municipales (%)</label>
            <input 
              type="number" 
              required
              step="0.01"
              min="0"
              value={formData.taxMunicipal !== undefined ? formData.taxMunicipal : 1.5}
              onChange={(e) => setFormData({...formData, taxMunicipal: Number(e.target.value)})}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-tech-blue focus:border-vial-orange focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Tax Pago Electrónico / Tarjeta (%)</label>
            <input 
              type="number" 
              required
              step="0.1"
              min="0"
              value={formData.electronicPaymentFee !== undefined ? formData.electronicPaymentFee : 5}
              onChange={(e) => setFormData({...formData, electronicPaymentFee: Number(e.target.value)})}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-tech-blue focus:border-vial-orange focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Comisión de Plataforma (%)</label>
            <input 
              type="number" 
              required
              step="0.1"
              min="0"
              value={formData.commissionRate !== undefined ? formData.commissionRate : 15}
              onChange={(e) => setFormData({...formData, commissionRate: Number(e.target.value)})}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-tech-blue focus:border-vial-orange focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Membresía Semanal ($)</label>
            <input 
              type="number" 
              required
              min="0"
              value={formData.weeklyMembership !== undefined ? formData.weeklyMembership : 5000}
              onChange={(e) => setFormData({...formData, weeklyMembership: Number(e.target.value)})}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-tech-blue focus:border-vial-orange focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white/50 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-tech-blue">Tarifas Especiales</h3>
          <button 
            type="button" 
            onClick={() => {
              const newSpecial = { id: Date.now().toString(), name: '', daysOfWeek: ['Todos los días'], startTime: '00:00', endTime: '23:59', percentageModifier: 0 };
              setFormData({ ...formData, specialRates: [...(formData.specialRates || []), newSpecial as any] });
            }}
            className="flex items-center text-xs font-semibold text-vial-orange hover:opacity-80"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Agregar Regla
          </button>
        </div>
        
        <div className="space-y-3">
          {!formData.specialRates || formData.specialRates.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No hay tarifas especiales asignadas. Agrega una nueva regla (ej. Nocturna).</p>
          ) : (
            formData.specialRates.map((rate, idx) => (
              <div key={rate.id} className="grid grid-cols-1 gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 sm:grid-cols-12 items-start relative shadow-sm">
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
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-tech-blue focus:border-vial-orange focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="mb-1 block text-xs font-medium text-slate-500">Días (Mantén Ctrl para varios)</label>
                  <select 
                    multiple
                    value={rate.daysOfWeek || []}
                    onChange={(e) => {
                      const selectedDays = Array.from(e.target.selectedOptions, option => option.value);
                      const updated = formData.specialRates?.map(r => r.id === rate.id ? { ...r, daysOfWeek: selectedDays } : r);
                      setFormData({ ...formData, specialRates: updated });
                    }}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-tech-blue focus:border-vial-orange focus:outline-none h-16"
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
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-tech-blue focus:border-vial-orange focus:outline-none"
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
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-tech-blue focus:border-vial-orange focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-500">% Modificador</label>
                  <input 
                    type="number" 
                    placeholder="+15 / -10"
                    value={rate.percentageModifier || 0}
                    onChange={(e) => {
                      const updated = formData.specialRates?.map(r => r.id === rate.id ? { ...r, percentageModifier: Number(e.target.value) } : r);
                      setFormData({ ...formData, specialRates: updated });
                    }}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-tech-blue focus:border-vial-orange focus:outline-none"
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
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancelar Edición
          </button>
        )}
        <button type="submit" className="flex items-center rounded-md bg-vial-orange px-5 py-2.5 text-sm font-extrabold text-gray-950 hover:opacity-90 shadow-md">
          <Save className="mr-2 h-4 w-4" />
          {formData.id ? "Actualizar Tarifario MU" : "Guardar Tarifario MU"}
        </button>
      </div>
    </form>
  );
};
