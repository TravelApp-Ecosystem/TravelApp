"use client";

import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, MapPin } from 'lucide-react';
import { TransferTariff, TransferRoute, VehicleCategory } from '@/types/logistics';
import { collection, onSnapshot, doc, setDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface TransferTariffFormProps {
  editData?: TransferTariff | null;
  onSubmitSuccess?: () => void;
}

export const TransferTariffForm: React.FC<TransferTariffFormProps> = ({ editData, onSubmitSuccess }) => {
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const [formData, setFormData] = useState<Partial<TransferTariff>>({
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

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as VehicleCategory);
      setCategories(list);
      setIsLoadingCategories(false);
    }, (err) => {
      console.error("Error loading categories in TransferTariffForm:", err);
      setIsLoadingCategories(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (editData) {
      setFormData({
        ...editData,
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
    const newRoute: TransferRoute = {
      id: `transfer-route-${Date.now()}`,
      originName: '',
      destinationName: '',
      fixedPrice: 0
    };
    setFormData({ ...formData, routes: [...(formData.routes || []), newRoute] });
  };

  const handleRemoveRoute = (id: string) => {
    setFormData({ ...formData, routes: formData.routes?.filter(r => r.id !== id) });
  };

  const updateRoute = (id: string, field: keyof TransferRoute, value: string | number) => {
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
      const tariffData = {
        ...formData,
        type: 'transfers',
        isActive: formData.isActive ?? true,
        updatedAt: Date.now(),
      };

      let finalId = formData.id;
      if (finalId) {
        await setDoc(doc(db, 'tariffs', finalId), tariffData);
      } else {
        const docRef = await addDoc(collection(db, 'tariffs'), tariffData);
        finalId = docRef.id;
        await setDoc(doc(db, 'tariffs', finalId), { ...tariffData, id: finalId });
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
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {formData.id ? 'Editar Tarifario de Traslados Fijos' : 'Crear Tarifario de Traslados Fijos'}
          </h2>
          <p className="text-sm text-slate-500">
            Rutas exclusivas punto a punto con precio fijo (ej. Aeropuerto ➔ Hotel)
          </p>
        </div>
        <button
          type="submit"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Save size={18} />
          Guardar Tarifario
        </button>
      </div>

      {/* Datos básicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Tarifario</label>
          <input
            type="text"
            required
            placeholder="ej. Tarifario Aeropuerto - Hoteles CABA"
            className="w-full text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Categoría de Vehículo</label>
          <select
            required
            className="w-full text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

      {/* Rutas de Traslados */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
            <MapPin size={18} className="text-indigo-600" />
            Rutas de Traslados Punto a Punto (Precios Fijos)
          </h3>
          <button
            type="button"
            onClick={handleAddRoute}
            className="flex items-center gap-1 text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Añadir Ruta Fija
          </button>
        </div>

        {formData.routes?.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
            <p className="text-sm text-slate-500">No has añadido rutas fijas de traslados a este tarifario.</p>
            <button
              type="button"
              onClick={handleAddRoute}
              className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              + Añadir primera ruta (ej: Aeropuerto ➔ Hotel)
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {formData.routes?.map((route, idx) => (
              <div key={route.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-50 border border-slate-200 p-3 rounded-lg">
                <div className="md:col-span-5">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Origen (ej: Aeropuerto)</label>
                  <input
                    type="text"
                    required
                    placeholder="Punto de origen..."
                    className="w-full text-slate-900 bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={route.originName}
                    onChange={(e) => updateRoute(route.id, 'originName', e.target.value)}
                  />
                </div>

                <div className="md:col-span-5">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Destino (ej: Hotel Céntrico)</label>
                  <input
                    type="text"
                    required
                    placeholder="Punto de destino..."
                    className="w-full text-slate-900 bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={route.destinationName}
                    onChange={(e) => updateRoute(route.id, 'destinationName', e.target.value)}
                  />
                </div>

                <div className="md:col-span-2 flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Precio Fijo ($)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      className="w-full text-slate-900 bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={route.fixedPrice}
                      onChange={(e) => updateRoute(route.id, 'fixedPrice', Number(e.target.value))}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveRoute(route.id)}
                    className="mt-5 p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </form>
  );
};
