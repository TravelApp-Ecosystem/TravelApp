"use client";

import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, HelpCircle } from 'lucide-react';
import { ARCTariff, ARCRoute, VehicleCategory } from '@/types/logistics';
import { collection, onSnapshot, doc, setDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ARCTariffFormProps {
  editData?: ARCTariff | null;
  onSubmitSuccess?: () => void;
}

export const ARCTariffForm: React.FC<ARCTariffFormProps> = ({ editData, onSubmitSuccess }) => {
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const [formData, setFormData] = useState<Partial<ARCTariff>>({
    name: '',
    category: '',
    iva: 21,
    iibb: 3.5,
    taxMunicipal: 1.5,
    electronicPaymentFee: 5,
    commissionRate: 15,
    weeklyMembership: 5000,
    routes: []
  });

  // Cargar categorías dinámicas en tiempo real
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as VehicleCategory);
      setCategories(list);
      setIsLoadingCategories(false);
    }, (err) => {
      console.error("Error loading categories in ARCTariffForm:", err);
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
        routes: editData.routes ?? [],
      });
    } else {
      setFormData({
        name: '',
        category: '',
        iva: 21,
        iibb: 3.5,
        taxMunicipal: 1.5,
        electronicPaymentFee: 5,
        commissionRate: 15,
        weeklyMembership: 5000,
        routes: []
      });
    }
  }, [editData]);

  const handleAddRoute = () => {
    const newRoute: ARCRoute = {
      id: `route-${Date.now()}`,
      mainOrigin: '',
      mainDestination: '',
      pricePerSeat: 0
    };
    setFormData({ ...formData, routes: [...(formData.routes || []), newRoute] });
  };

  const handleRemoveRoute = (id: string) => {
    setFormData({ ...formData, routes: formData.routes?.filter(r => r.id !== id) });
  };

  const updateRoute = (id: string, field: keyof ARCRoute, value: string | number) => {
    setFormData({
      ...formData,
      routes: formData.routes?.map(r => r.id === id ? { ...r, [field]: value } : r)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) {
      alert("Por favor selecciona una categoría.");
      return;
    }

    try {
      const tariffData = {
        ...formData,
        type: 'arc',
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

      // Si este tarifario se marca activo, actualizar el doc arc_active de referencia rápida
      if (tariffData.isActive) {
        await setDoc(doc(db, 'tariffs', 'arc_active'), { ...tariffData, id: finalId, isActive: true });
      }

      alert(formData.id ? "Tarifario ARC actualizado exitosamente en Firestore" : "Tarifario ARC creado exitosamente en Firestore");

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error: any) {
      console.error("Error saving ARC tariff:", error);
      alert("Hubo un error al guardar el tarifario: " + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white/50 p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-tech-blue">Configuración General ARC</h3>
        
        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Nombre del Tarifario</label>
            <input 
              type="text" 
              required
              placeholder="Ej. ARC Premium Norte"
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
        </div>

        <h3 className="mb-3 mt-6 text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
          Impuestos, Comisiones y Membresías
          <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
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
          <h3 className="text-sm font-bold text-tech-blue">Rutas Troncales ARC</h3>
          <button 
            type="button" 
            onClick={handleAddRoute}
            className="flex items-center text-xs font-semibold text-vial-orange hover:opacity-80"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Agregar Ruta
          </button>
        </div>

        <div className="space-y-3">
          {!formData.routes || formData.routes.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No hay rutas definidas. Agrega una nueva ruta troncal.</p>
          ) : (
            formData.routes.map((route, idx) => (
              <div key={route.id} className="flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-end shadow-sm">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-slate-500">Origen Principal</label>
                  <input 
                    type="text" 
                    placeholder="Ej. CABA"
                    value={route.mainOrigin || ''}
                    onChange={(e) => updateRoute(route.id, 'mainOrigin', e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-tech-blue focus:border-vial-orange focus:outline-none"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-slate-500">Destino Principal</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Pilar"
                    value={route.mainDestination || ''}
                    onChange={(e) => updateRoute(route.id, 'mainDestination', e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-tech-blue focus:border-vial-orange focus:outline-none"
                    required
                  />
                </div>
                <div className="w-full sm:w-32">
                  <label className="mb-1 block text-xs font-medium text-slate-500">Precio/Cupo ($)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={route.pricePerSeat || 0}
                    onChange={(e) => updateRoute(route.id, 'pricePerSeat', Number(e.target.value))}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-tech-blue focus:border-vial-orange focus:outline-none"
                    required
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => handleRemoveRoute(route.id)}
                  className="rounded-md bg-red-500/10 p-2 text-red-500 hover:bg-red-500/20 mb-[1px]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
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
          {formData.id ? "Actualizar Tarifario ARC" : "Guardar Tarifario ARC"}
        </button>
      </div>
    </form>
  );
};
