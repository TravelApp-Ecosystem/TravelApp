"use client";

import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, MapPin, Building2, ArrowLeftRight, Clock, Percent, HelpCircle } from 'lucide-react';
import { TransferTariff, TransferRoute, VehicleCategory, Branch, TariffSpecialRate } from '@/types/logistics';
import { collection, onSnapshot, doc, setDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface TransferTariffFormProps {
  editData?: TransferTariff | null;
  onSubmitSuccess?: () => void;
}

export const TransferTariffForm: React.FC<TransferTariffFormProps> = ({ editData, onSubmitSuccess }) => {
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [formData, setFormData] = useState<Partial<TransferTariff>>({
    name: '',
    branchIds: [],
    category: '',
    iva: 21,
    iibb: 3.5,
    taxMunicipal: 1.5,
    electronicPaymentFee: 5,
    commissionRate: 15,
    weeklyMembership: 5000,
    routes: [],
    specialRates: []
  });

  useEffect(() => {
    const unsubCats = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as VehicleCategory);
      setCategories(list);
    }, (err) => {
      console.error("Error loading categories in TransferTariffForm:", err);
    });

    const unsubBranches = onSnapshot(collection(db, 'branches'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Branch);
      setBranches(list);
      setIsLoadingData(false);
    }, (err) => {
      console.error("Error loading branches in TransferTariffForm:", err);
      setIsLoadingData(false);
    });

    return () => {
      unsubCats();
      unsubBranches();
    };
  }, []);

  useEffect(() => {
    if (editData) {
      setFormData({
        ...editData,
        branchIds: editData.branchIds ?? [],
        iva: editData.iva ?? 21,
        iibb: editData.iibb ?? 3.5,
        taxMunicipal: editData.taxMunicipal ?? 1.5,
        electronicPaymentFee: editData.electronicPaymentFee ?? 5,
        commissionRate: editData.commissionRate ?? 15,
        weeklyMembership: editData.weeklyMembership ?? 5000,
        routes: editData.routes ?? [],
        specialRates: editData.specialRates ?? [],
      });
    } else {
      setFormData({
        name: '',
        branchIds: [],
        category: '',
        iva: 21,
        iibb: 3.5,
        taxMunicipal: 1.5,
        electronicPaymentFee: 5,
        commissionRate: 15,
        weeklyMembership: 5000,
        routes: [],
        specialRates: []
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

  const handleAddRoute = () => {
    const newRoute: TransferRoute = {
      id: `transfer-route-${Date.now()}`,
      originName: '',
      destinationName: '',
      fixedPrice: 0,
      isBidirectional: true
    };
    setFormData({ ...formData, routes: [...(formData.routes || []), newRoute] });
  };

  const handleRemoveRoute = (id: string) => {
    setFormData({ ...formData, routes: formData.routes?.filter(r => r.id !== id) });
  };

  const updateRoute = (id: string, field: keyof TransferRoute, value: any) => {
    setFormData({
      ...formData,
      routes: formData.routes?.map(r => r.id === id ? { ...r, [field]: value } : r)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert("Por favor ingresa un nombre identificador para el tarifario.");
      return;
    }
    if (!formData.category) {
      alert("Por favor selecciona una categoría.");
      return;
    }

    try {
      const tariffData: TransferTariff = {
        name: formData.name.trim(),
        branchIds: formData.branchIds && formData.branchIds.length > 0 ? formData.branchIds : ['all'],
        category: formData.category,
        routes: formData.routes || [],
        iva: Number(formData.iva ?? 21),
        iibb: Number(formData.iibb ?? 3.5),
        taxMunicipal: Number(formData.taxMunicipal ?? 1.5),
        electronicPaymentFee: Number(formData.electronicPaymentFee ?? 5),
        commissionRate: Number(formData.commissionRate ?? 15),
        weeklyMembership: Number(formData.weeklyMembership ?? 5000),
        specialRates: formData.specialRates || [],
        type: 'transfers',
        isActive: formData.isActive ?? true,
        id: formData.id || '',
      };

      let finalId = formData.id;
      if (finalId) {
        await setDoc(doc(db, 'tariffs', finalId), { ...tariffData, updatedAt: Date.now() });
      } else {
        const docRef = await addDoc(collection(db, 'tariffs'), { ...tariffData, updatedAt: Date.now() });
        finalId = docRef.id;
        await setDoc(doc(db, 'tariffs', finalId), { ...tariffData, id: finalId, updatedAt: Date.now() });
      }

      alert(formData.id ? "Tarifario de Traslados actualizado exitosamente" : "Tarifario de Traslados creado exitosamente");

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error: any) {
      console.error("Error saving Transfer tariff:", error);
      alert("Hubo un error al guardar el tarifario: " + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* 1. CONFIGURACIÓN GENERAL Y SUCURSALES */}
      <div className="rounded-xl border border-slate-200 bg-white/70 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-tech-blue flex items-center gap-2">
          <Building2 className="h-4 w-4 text-indigo-600" />
          Identificación y Asignación de Sucursal
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Nombre del Tarifario</label>
            <input
              type="text"
              required
              placeholder="Ej. Traslados Ejecutivos Aeropuerto Tucumán"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-tech-blue focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Categoría de Vehículo</label>
            <select
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-tech-blue focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={formData.category || ''}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="">-- Seleccionar categoría --</option>
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
                  ? 'bg-indigo-600 text-white shadow-sm'
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
                      ? 'bg-indigo-600 text-white shadow-sm'
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

      {/* 2. RUTAS DE TRASLADOS PUNTO A PUNTO CON PRECIO FIJO */}
      <div className="rounded-xl border border-slate-200 bg-white/70 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-tech-blue flex items-center gap-2">
              <MapPin className="h-4 w-4 text-indigo-600" />
              Rutas de Traslados Fijos Punto a Punto
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tarifa cerrada por viaje completo sin Google Maps (ej: Aeropuerto ➔ Hotel Hilton).
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddRoute}
            className="flex items-center text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Añadir Ruta Fija
          </button>
        </div>

        <div className="space-y-3">
          {!formData.routes || formData.routes.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              <p className="text-xs text-slate-500">No has añadido rutas fijas de traslados a este tarifario.</p>
              <button
                type="button"
                onClick={handleAddRoute}
                className="mt-2 text-xs text-indigo-600 font-bold hover:underline"
              >
                + Añadir primera ruta (ej: Aeropuerto Benjamín Matienzo ➔ Hotel Centro)
              </button>
            </div>
          ) : (
            formData.routes.map((route) => (
              <div key={route.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
                <div className="md:col-span-4">
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Origen (ej: Aeropuerto)</label>
                  <input
                    type="text"
                    required
                    placeholder="Punto de origen..."
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-tech-blue focus:border-indigo-500 focus:outline-none"
                    value={route.originName}
                    onChange={(e) => updateRoute(route.id, 'originName', e.target.value)}
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Destino (ej: Hotel)</label>
                  <input
                    type="text"
                    required
                    placeholder="Punto de destino..."
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-tech-blue focus:border-indigo-500 focus:outline-none"
                    value={route.destinationName}
                    onChange={(e) => updateRoute(route.id, 'destinationName', e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Precio Fijo ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-emerald-700 focus:border-indigo-500 focus:outline-none"
                    value={route.fixedPrice}
                    onChange={(e) => updateRoute(route.id, 'fixedPrice', Number(e.target.value))}
                  />
                </div>

                <div className="md:col-span-2 flex items-center justify-between pt-4 md:pt-0">
                  <label className="flex items-center gap-1.5 cursor-pointer" title="Habilita la tarifa tanto para Ida como para Vuelta">
                    <input 
                      type="checkbox"
                      checked={route.isBidirectional !== false}
                      onChange={(e) => updateRoute(route.id, 'isBidirectional', e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                      <ArrowLeftRight className="h-3 w-3 text-indigo-600" /> Ida/Vuelta
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleRemoveRoute(route.id)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. COMISIÓN, MEMBRESÍA E IMPUESTOS (SOBRE COMISIÓN) */}
      <div className="rounded-xl border border-slate-200 bg-white/70 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-tech-blue flex items-center gap-2">
          <Percent className="h-4 w-4 text-indigo-600" />
          Comisión de Plataforma e Impuestos Fiscales (s/ Comisión)
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
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-tech-blue font-bold focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Membresía Semanal ($)</label>
            <input 
              type="number" 
              required
              min="0"
              value={formData.weeklyMembership !== undefined ? formData.weeklyMembership : 5000}
              onChange={(e) => setFormData({...formData, weeklyMembership: Number(e.target.value)})}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-tech-blue font-bold focus:border-indigo-500 focus:outline-none"
            />
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
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-tech-blue font-bold focus:border-indigo-500 focus:outline-none"
            />
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
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-tech-blue focus:border-indigo-500 focus:outline-none"
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
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-tech-blue focus:border-indigo-500 focus:outline-none"
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
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-tech-blue focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 4. TARIFAS ESPECIALES */}
      <div className="rounded-xl border border-slate-200 bg-white/70 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-tech-blue flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Tarifas Especiales por Días y Horarios
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
                percentageModifier: 15 
              };
              setFormData({ ...formData, specialRates: [...(formData.specialRates || []), newSpecial] });
            }}
            className="flex items-center text-xs font-bold text-indigo-600 hover:opacity-80"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Agregar Regla Horaria
          </button>
        </div>
        
        <div className="space-y-3">
          {!formData.specialRates || formData.specialRates.length === 0 ? (
            <p className="text-sm text-slate-400 py-3 text-center">No hay tarifas especiales asignadas para estos traslados fijos.</p>
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
                    placeholder="Ej: Feriados / Fin de Semana"
                    value={rate.name || ''}
                    onChange={(e) => {
                      const updated = formData.specialRates?.map(r => r.id === rate.id ? { ...r, name: e.target.value } : r);
                      setFormData({ ...formData, specialRates: updated });
                    }}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-tech-blue font-bold focus:border-indigo-500 focus:outline-none"
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
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-tech-blue focus:border-indigo-500 focus:outline-none h-14"
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
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-tech-blue focus:border-indigo-500 focus:outline-none"
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
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-tech-blue focus:border-indigo-500 focus:outline-none"
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
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-tech-blue font-bold focus:border-indigo-500 focus:outline-none"
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
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-2.5 rounded-lg transition-colors shadow-md"
        >
          <Save size={18} />
          {formData.id ? "Actualizar Tarifario Traslados" : "Guardar Tarifario Traslados"}
        </button>
      </div>
    </form>
  );
};

