"use client";

import React, { useState, useEffect } from 'react';
import { Settings, MapPin, DollarSign, Plus, FileText, CheckCircle2, Trash2, Edit, AlertCircle, Sparkles, Car, Star, Shield, Crown, RefreshCw, Save, Upload, X } from 'lucide-react';
import { Branch, ARCTariff, MUTariff, VehicleCategory } from '@/types/logistics';
import { MUTariffForm } from '@/components/travelcab/settings/MUTariffForm';
import { ARCTariffForm } from '@/components/travelcab/settings/ARCTariffForm';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocs, updateDoc, writeBatch, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Mock Sucursales para mantener compatibilidad
const mockBranches: Branch[] = [
  { id: '1', name: 'Sucursal Retiro', location: 'CABA', enabledARCRouteIds: ['r1', 'r2'] },
  { id: '2', name: 'Sucursal Pilar', location: 'GBA Norte', enabledARCRouteIds: ['r3'] },
];

export default function TravelCabSettingsPage() {
  const [activeTab, setActiveTab] = useState<'tariffs' | 'branches' | 'categories' | 'system'>('tariffs');
  const [tariffSubTab, setTariffSubTab] = useState<'mu' | 'arc'>('mu');
  
  // System Config / Logistics States
  const [notificationSoundUrl, setNotificationSoundUrl] = useState('');
  const [isSavingSystem, setIsSavingSystem] = useState(false);
  const [isLoadingSystem, setIsLoadingSystem] = useState(true);
  
  // Real-Time States
  const [muTariffs, setMuTariffs] = useState<MUTariff[]>([]);
  const [arcTariffs, setArcTariffs] = useState<ARCTariff[]>([]);
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  
  // Loading states
  const [isLoadingTariffs, setIsLoadingTariffs] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Edit / Form States
  const [editingMUTariff, setEditingMUTariff] = useState<MUTariff | null>(null);
  const [editingARCTariff, setEditingARCTariff] = useState<ARCTariff | null>(null);
  
  // Categories form state
  const [editingCategory, setEditingCategory] = useState<VehicleCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    id: '',
    name: '',
    description: '',
    eta: '3 - 5 min',
    icon: 'Car',
    seats: 4
  });
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  // 1. Escuchar Tarifarios en tiempo real
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'tariffs'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any);
      // Filtrar localmente por tipo
      setMuTariffs(list.filter(t => t.type === 'mu'));
      setArcTariffs(list.filter(t => t.type === 'arc'));
      setIsLoadingTariffs(false);
    }, (error) => {
      console.error("Error listening to tariffs:", error);
      setIsLoadingTariffs(false);
    });
    return unsub;
  }, []);

  // 2. Escuchar Categorías en tiempo real
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as VehicleCategory);
      setCategories(list);
      setIsLoadingCategories(false);
    }, (error) => {
      console.error("Error listening to categories:", error);
      setIsLoadingCategories(false);
    });
    return unsub;
  }, []);

  // 3. Escuchar Configuración de Logística y Sonidos
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_config', 'logistics'), (snap) => {
      if (snap.exists()) {
        setNotificationSoundUrl(snap.data().notificationSoundUrl || '');
      }
      setIsLoadingSystem(false);
    }, (error) => {
      console.error("Error listening to system config:", error);
      setIsLoadingSystem(false);
    });
    return unsub;
  }, []);

  const handleSaveSystemConfig = async () => {
    setIsSavingSystem(true);
    try {
      await setDoc(doc(db, 'system_config', 'logistics'), {
        notificationSoundUrl
      }, { merge: true });
      alert('Configuración del sistema guardada con éxito.');
    } catch (err) {
      console.error("Error saving system config:", err);
      alert('Error al guardar la configuración.');
    } finally {
      setIsSavingSystem(false);
    }
  };

  // 3. Detectar parámetros de la URL para redirección profunda (Sidebar links)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      const actionParam = params.get('action');

      if (tabParam === 'tariffs') {
        setActiveTab('tariffs');
        if (actionParam === 'new') {
          setEditingMUTariff(null);
          setEditingARCTariff(null);
        }
      } else if (tabParam === 'categories') {
        setActiveTab('categories');
        if (actionParam === 'new') {
          setEditingCategory(null);
          setCategoryForm({ id: '', name: '', description: '', eta: '3 - 5 min', icon: 'Car', seats: 4 });
          setShowCategoryForm(true);
        }
      } else if (tabParam === 'branches') {
        setActiveTab('branches');
      }
    }
  }, [typeof window !== "undefined" ? window.location.search : '']);

  // Sincronizar formulario de categorías en modo edición
  useEffect(() => {
    if (editingCategory) {
      setCategoryForm({
        id: editingCategory.id,
        name: editingCategory.name,
        description: editingCategory.description,
        eta: editingCategory.eta,
        icon: editingCategory.icon || 'Car',
        seats: editingCategory.seats !== undefined ? editingCategory.seats : 4
      });
      setShowCategoryForm(true);
    }
  }, [editingCategory]);

  // 4. Acciones CRUD Tarifas
  const handleEditTariff = (tariff: any) => {
    if (tariff.type === 'mu') {
      setEditingMUTariff(tariff);
      setTariffSubTab('mu');
    } else {
      setEditingARCTariff(tariff);
      setTariffSubTab('arc');
    }
    // Scroll al formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteTariff = async (id: string, name: string, isActive: boolean) => {
    if (confirm(`¿Estás seguro de que deseas eliminar el tarifario "${name}"? Esta acción no se puede deshacer.`)) {
      try {
        await deleteDoc(doc(db, 'tariffs', id));
        alert("Tarifario eliminado correctamente.");
        if (isActive) {
          alert("Alerta: Has eliminado un tarifario ACTIVO. Recuerda activar otro de inmediato.");
        }
      } catch (err: any) {
        console.error("Error deleting tariff:", err);
        alert("Error al eliminar el tarifario: " + err.message);
      }
    }
  };

  const handleActivateTariff = async (tariff: any) => {
    try {
      const batch = writeBatch(db);
      const tariffsRef = collection(db, 'tariffs');
      const q = query(tariffsRef, where('type', '==', tariff.type));
      const querySnap = await getDocs(q);

      // Desactivar todos los demás del mismo tipo
      querySnap.docs.forEach(docSnap => {
        if (docSnap.id === tariff.id) {
          batch.update(doc(db, 'tariffs', docSnap.id), { isActive: true });
        } else {
          batch.update(doc(db, 'tariffs', docSnap.id), { isActive: false });
        }
      });

      await batch.commit();

      // Guardar copia en el doc de acceso directo rápido
      const activeDocId = tariff.type === 'mu' ? 'mu_active' : 'arc_active';
      await setDoc(doc(db, 'tariffs', activeDocId), {
        ...tariff,
        isActive: true,
        updatedAt: Date.now()
      });

      alert(`Tarifario "${tariff.name}" activado correctamente.`);
    } catch (err: any) {
      console.error("Error activating tariff:", err);
      alert("Error al activar tarifario: " + err.message);
    }
  };

  // 5. Acciones CRUD Categorías
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.id.trim() || !categoryForm.name.trim()) {
      alert("Por favor completa los campos Código y Nombre.");
      return;
    }

    // Limpiar ID (minúsculas, sin espacios)
    const categoryId = categoryForm.id.trim().toLowerCase().replace(/\s+/g, '-');

    try {
      const catData: VehicleCategory = {
        id: categoryId,
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim(),
        eta: categoryForm.eta.trim(),
        icon: categoryForm.icon,
        seats: Number(categoryForm.seats || 4),
        createdAt: editingCategory ? editingCategory.createdAt : Date.now()
      };

      await setDoc(doc(db, 'categories', categoryId), catData);
      
      alert(editingCategory ? "Categoría actualizada correctamente" : "Categoría creada correctamente");
      setCategoryForm({ id: '', name: '', description: '', eta: '3 - 5 min', icon: 'Car', seats: 4 });
      setEditingCategory(null);
      setShowCategoryForm(false);
    } catch (err: any) {
      console.error("Error saving category:", err);
      alert("Error al guardar la categoría: " + err.message);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar la categoría "${name}" (${id})?`)) {
      try {
        await deleteDoc(doc(db, 'categories', id));
        alert("Categoría eliminada correctamente.");
      } catch (err: any) {
        console.error("Error deleting category:", err);
        alert("Error al eliminar la categoría: " + err.message);
      }
    }
  };

  const renderCategoryIcon = (iconName?: string) => {
    if (!iconName) return <Car className="h-5 w-5 text-slate-400" />;
    
    // Check if it's a URL or base64 image data
    if (iconName.startsWith('http') || iconName.startsWith('data:image')) {
      return (
        <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-200 bg-white">
          <img src={iconName} alt="Categoría" className="w-full h-full object-cover" />
        </div>
      );
    }

    switch (iconName) {
      case 'Crown': return <Crown className="h-5 w-5 text-amber-500" />;
      case 'Sparkles': return <Sparkles className="h-5 w-5 text-yellow-400" />;
      case 'Star': return <Star className="h-5 w-5 text-indigo-400" />;
      case 'Shield': return <Shield className="h-5 w-5 text-emerald-400" />;
      default: return <Car className="h-5 w-5 text-slate-400" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-tech-blue flex items-center">
            <Settings className="mr-3 h-8 w-8 text-vial-orange" />
            Configuración Logística
          </h1>
          <p className="mt-2 text-slate-500">Gestión de sucursales, categorías dinámicas y tarifarios reales.</p>
        </div>
      </div>

      {/* Tabs Principales */}
      <div className="mb-6 flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('tariffs')}
          className={`flex items-center space-x-2 border-b-2 px-6 py-3 font-semibold transition-colors ${
            activeTab === 'tariffs'
              ? 'border-vial-orange text-vial-orange'
              : 'border-transparent text-slate-500 hover:text-slate-600'
          }`}
        >
          <DollarSign className="h-5 w-5" />
          <span>Tarifarios</span>
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center space-x-2 border-b-2 px-6 py-3 font-semibold transition-colors ${
            activeTab === 'categories'
              ? 'border-vial-orange text-vial-orange'
              : 'border-transparent text-slate-500 hover:text-slate-600'
          }`}
        >
          <Car className="h-5 w-5" />
          <span>Categorías de Vehículo</span>
        </button>
        <button
          onClick={() => setActiveTab('branches')}
          className={`flex items-center space-x-2 border-b-2 px-6 py-3 font-semibold transition-colors ${
            activeTab === 'branches'
              ? 'border-vial-orange text-vial-orange'
              : 'border-transparent text-slate-500 hover:text-slate-600'
          }`}
        >
          <MapPin className="h-5 w-5" />
          <span>Sucursales</span>
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center space-x-2 border-b-2 px-6 py-3 font-semibold transition-colors ${
            activeTab === 'system'
              ? 'border-vial-orange text-vial-orange'
              : 'border-transparent text-slate-500 hover:text-slate-600'
          }`}
        >
          <Settings className="h-5 w-5" />
          <span>Configuración Sistema</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* TABS DE TARIFARIOS */}
        {activeTab === 'tariffs' && (
          <div className="flex flex-col space-y-6">
            <div className="flex space-x-2 rounded-lg bg-white/50 p-1 border border-slate-200 w-fit">
              <button
                onClick={() => {
                  setTariffSubTab('mu');
                  setEditingMUTariff(null);
                }}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                  tariffSubTab === 'mu' ? 'bg-slate-100 text-tech-blue shadow-sm' : 'text-slate-500 hover:text-slate-600'
                }`}
              >
                Tarifas MU (Movilidad Urbana)
              </button>
              <button
                onClick={() => {
                  setTariffSubTab('arc');
                  setEditingARCTariff(null);
                }}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                  tariffSubTab === 'arc' ? 'bg-vial-orange text-gray-950 shadow-sm' : 'text-slate-500 hover:text-slate-600'
                }`}
              >
                Tarifas ARC (Compartido)
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Columna Izquierda: Formulario de Creación/Edición */}
              <div className="lg:col-span-2">
                <div className="rounded-xl border border-slate-200 bg-white/40 p-6 shadow-lg">
                  <h2 className="mb-6 text-xl font-bold text-tech-blue">
                    {tariffSubTab === 'mu' 
                      ? (editingMUTariff ? `Editar Tarifario MU: ${editingMUTariff.name}` : 'Crear Tarifario MU') 
                      : (editingARCTariff ? `Editar Tarifario ARC: ${editingARCTariff.name}` : 'Crear Tarifario ARC')
                    }
                  </h2>
                  {tariffSubTab === 'mu' ? (
                    <MUTariffForm 
                      editData={editingMUTariff} 
                      onSubmitSuccess={() => setEditingMUTariff(null)} 
                    />
                  ) : (
                    <ARCTariffForm 
                      editData={editingARCTariff} 
                      onSubmitSuccess={() => setEditingARCTariff(null)} 
                    />
                  )}
                </div>
              </div>

              {/* Columna Derecha: Listado en tiempo real */}
              <div className="lg:col-span-1">
                <div className="rounded-xl border border-slate-200 bg-white/40 p-6 shadow-lg h-full">
                  <h2 className="mb-6 text-xl font-bold text-tech-blue flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-slate-500" />
                    Tarifarios en Firestore
                  </h2>
                  
                  <div className="space-y-4">
                    {isLoadingTariffs ? (
                      <div className="text-center py-8 text-slate-400 text-xs font-semibold flex flex-col items-center gap-2">
                        <RefreshCw className="h-5 w-5 animate-spin text-vial-orange" />
                        Cargando tarifarios desde Firestore...
                      </div>
                    ) : tariffSubTab === 'mu' ? (
                      muTariffs.length === 0 ? (
                        <p className="text-sm text-slate-400 py-6 text-center">No hay tarifarios MU creados aún.</p>
                      ) : (
                        muTariffs.map(t => (
                          <div 
                            key={t.id} 
                            className={`rounded-lg border p-4 transition-all relative ${
                              t.isActive 
                                ? 'border-green-500/30 bg-green-500/5 shadow-inner' 
                                : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2 pr-12">
                              <div>
                                <h4 className="font-bold text-tech-blue text-sm flex items-center gap-1.5">
                                  {t.name}
                                </h4>
                                <span className="inline-block mt-0.5 text-[9px] font-bold bg-slate-200/70 text-slate-600 px-2 py-0.5 rounded">
                                  Categoría: {t.category}
                                </span>
                              </div>
                              {t.isActive && (
                                <span className="flex items-center text-[10px] font-extrabold text-green-600 bg-green-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Activo
                                </span>
                              )}
                            </div>
                            
                            <div className="text-[11px] text-slate-500 space-y-1 mt-2">
                              <p>Bajada: ${t.baseFare} | KM: ${t.pricePerKm}</p>
                              <p>Minuto viaje: ${t.travelMinutePrice} | Minuto espera: ${t.waitMinutePrice}</p>
                              <p>Mínimo: ${t.minimumFare}</p>
                              <p className="font-semibold text-slate-600">
                                IVA: {t.iva}% | IIBB: {t.iibb}% | Munic: {t.taxMunicipal}%
                              </p>
                              <p className="font-semibold text-slate-600">
                                Comisión: {t.commissionRate}% | Memb: ${t.weeklyMembership}/sem
                              </p>
                            </div>

                            {/* Acciones de la Tarjeta */}
                            <div className="mt-4 pt-3 border-t border-slate-200/50 flex items-center justify-between">
                              {!t.isActive ? (
                                <button 
                                  onClick={() => handleActivateTariff(t)}
                                  className="text-[11px] font-bold text-vial-orange hover:underline uppercase"
                                >
                                  Activar Tarifa
                                </button>
                              ) : (
                                <span className="text-[10px] font-bold text-green-600 uppercase flex items-center">
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> En Producción
                                </span>
                              )}

                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={() => handleEditTariff(t)}
                                  className="p-1.5 text-slate-400 hover:text-tech-blue hover:bg-slate-200/50 rounded transition-colors"
                                  title="Editar"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteTariff(t.id, t.name, !!t.isActive)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50/50 rounded transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )
                    ) : (
                      arcTariffs.length === 0 ? (
                        <p className="text-sm text-slate-400 py-6 text-center">No hay tarifarios ARC creados aún.</p>
                      ) : (
                        arcTariffs.map(t => (
                          <div 
                            key={t.id} 
                            className={`rounded-lg border p-4 transition-all relative ${
                              t.isActive 
                                ? 'border-vial-orange/30 bg-vial-orange/5 shadow-inner' 
                                : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2 pr-12">
                              <div>
                                <h4 className="font-bold text-tech-blue text-sm">{t.name}</h4>
                                <span className="inline-block mt-0.5 text-[9px] font-bold bg-slate-200/70 text-slate-600 px-2 py-0.5 rounded">
                                  Categoría: {t.category}
                                </span>
                              </div>
                              {t.isActive && (
                                <span className="flex items-center text-[10px] font-extrabold text-vial-orange bg-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Activo
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-500 space-y-1 mt-2">
                              <p>Rutas definidas: {t.routes?.length || 0}</p>
                              <p className="font-semibold text-slate-600">
                                IVA: {t.iva}% | IIBB: {t.iibb}% | Munic: {t.taxMunicipal}%
                              </p>
                              <p className="font-semibold text-slate-600">
                                Tarjeta: {t.electronicPaymentFee}% | Plataforma: {t.commissionRate}%
                              </p>
                            </div>

                            {/* Acciones de la Tarjeta */}
                            <div className="mt-4 pt-3 border-t border-slate-200/50 flex items-center justify-between">
                              {!t.isActive ? (
                                <button 
                                  onClick={() => handleActivateTariff(t)}
                                  className="text-[11px] font-bold text-vial-orange hover:underline uppercase"
                                >
                                  Activar Tarifa
                                </button>
                              ) : (
                                <span className="text-[10px] font-bold text-vial-orange uppercase flex items-center">
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> En Producción
                                </span>
                              )}

                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={() => handleEditTariff(t)}
                                  className="p-1.5 text-slate-400 hover:text-tech-blue hover:bg-slate-200/50 rounded transition-colors"
                                  title="Editar"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteTariff(t.id, t.name, !!t.isActive)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50/50 rounded transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TABS DE CATEGORÍAS */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Columna Izquierda: Formulario Categorías */}
            <div className="lg:col-span-1">
              <div className="rounded-xl border border-slate-200 bg-white/40 p-6 shadow-lg">
                <h2 className="mb-6 text-xl font-bold text-tech-blue">
                  {editingCategory ? `Editar Categoría: ${editingCategory.name}` : 'Crear Categoría'}
                </h2>
                
                <form onSubmit={handleSaveCategory} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">ID / Código de Categoría</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ej. estandar, vip, premium"
                      disabled={!!editingCategory}
                      value={categoryForm.id}
                      onChange={(e) => setCategoryForm({...categoryForm, id: e.target.value})}
                      className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-tech-blue focus:border-vial-orange focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-60"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Este ID debe ser único, en minúsculas y sin espacios (se guardará como ej: 'estandar').</p>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">Nombre Público</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ej. TravelCab VIP"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                      className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-tech-blue focus:border-vial-orange focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">Descripción Comercial</label>
                    <textarea 
                      rows={3}
                      placeholder="Ej. Autos de alta gama con chofer corporativo."
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                      className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-tech-blue focus:border-vial-orange focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">Tiempo de Arribo Promedio (ETA)</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ej. 3 - 5 min"
                      value={categoryForm.eta}
                      onChange={(e) => setCategoryForm({...categoryForm, eta: e.target.value})}
                      className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-tech-blue focus:border-vial-orange focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 bg-slate-50/50 p-3 rounded-xl border border-slate-200/50">
                    <label className="block text-xs font-semibold text-slate-500">Imagen de Categoría (URL o Archivo)</label>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={categoryForm.icon || ''}
                          onChange={(e) => setCategoryForm({...categoryForm, icon: e.target.value})}
                          placeholder="Ingresa la URL de la imagen o ícono..."
                          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white focus:outline-none focus:border-vial-orange text-tech-blue"
                        />
                        <label className="flex cursor-pointer items-center justify-center gap-1 text-[11px] font-bold text-tech-blue border border-tech-blue bg-white hover:bg-tech-blue/5 px-3 py-2 rounded-lg transition-all shadow-sm">
                          <Upload className="h-3.5 w-3.5" />
                          Subir Archivo
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setCategoryForm({...categoryForm, icon: reader.result as string});
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                      {categoryForm.icon && (
                        <div className="relative w-24 h-16 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 flex-shrink-0 group">
                          {categoryForm.icon.startsWith('http') || categoryForm.icon.startsWith('data:image') ? (
                            <img src={categoryForm.icon} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full bg-slate-100 text-xs font-bold text-slate-500">
                              {categoryForm.icon}
                            </div>
                          )}
                          <button 
                            type="button" 
                            onClick={() => setCategoryForm({...categoryForm, icon: ''})}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-100 transition-opacity"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500">Asientos Disponibles (Capacidad)</label>
                    <input 
                      type="number" 
                      min="1"
                      max="12"
                      required
                      placeholder="Ej. 4 o 8"
                      value={categoryForm.seats}
                      onChange={(e) => setCategoryForm({...categoryForm, seats: Number(e.target.value)})}
                      className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-tech-blue focus:border-vial-orange focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Capacidad máxima de pasajeros. Especialmente útil para calcular disponibilidad en el Auto Rural Compartido (ARC).</p>
                  </div>

                  <div className="flex pt-2 gap-2">
                    {editingCategory && (
                      <button 
                        type="button" 
                        onClick={() => {
                          setEditingCategory(null);
                          setCategoryForm({ id: '', name: '', description: '', eta: '3 - 5 min', icon: 'Car', seats: 4 });
                        }}
                        className="flex-1 rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                    )}
                    <button 
                      type="submit" 
                      className="flex-1 flex items-center justify-center rounded-md bg-vial-orange px-4 py-2 text-xs font-extrabold text-gray-950 hover:opacity-90 shadow"
                    >
                      <Save className="mr-1 h-3.5 w-3.5" />
                      {editingCategory ? "Actualizar" : "Crear Categoría"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Columna Derecha: Listado Categorías */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-slate-200 bg-white/40 p-6 shadow-lg">
                <h2 className="mb-6 text-xl font-bold text-tech-blue flex items-center">
                  <Car className="mr-2 h-5 w-5 text-slate-500" />
                  Categorías Creadas en Firestore
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isLoadingCategories ? (
                    <div className="col-span-2 text-center py-12 text-slate-400 text-xs font-semibold flex flex-col items-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-vial-orange" />
                      Cargando categorías...
                    </div>
                  ) : categories.length === 0 ? (
                    <div className="col-span-2 text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400 text-sm font-semibold">
                      No hay categorías configuradas. Crea una a la izquierda.
                    </div>
                  ) : (
                    categories.map(cat => (
                      <div 
                        key={cat.id} 
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-2.5 py-1 text-xs font-extrabold text-tech-blue">
                              {renderCategoryIcon(cat.icon)}
                              {cat.name}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              ID: {cat.id}
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-500 leading-relaxed font-semibold mb-3">
                            {cat.description || 'Sin descripción comercial cargada.'}
                          </p>
                        </div>
                        
                        <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-400 flex items-center gap-3">
                            <span>ETA: <span className="text-tech-blue font-extrabold">{cat.eta}</span></span>
                            <span>|</span>
                            <span>Asientos: <span className="text-[#ff6b00] font-extrabold">{cat.seats || 4}</span></span>
                          </span>
                          
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => setEditingCategory(cat)}
                              className="p-1 text-slate-400 hover:text-tech-blue hover:bg-slate-200 rounded"
                              title="Editar"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteCategory(cat.id, cat.name)}
                              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                              title="Eliminar"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB DE SUCURSALES (Mock) */}
        {activeTab === 'branches' && (
          <div className="lg:col-span-1">
             <div className="rounded-xl border border-slate-200 bg-white/50 p-6 shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-tech-blue flex items-center">
                    Sucursales Activas
                  </h3>
                  <button className="flex items-center space-x-2 rounded-md bg-vial-orange px-4 py-2 text-sm font-medium text-gray-950 hover:opacity-90 transition-colors">
                    <Plus className="h-4 w-4" />
                    <span>Agregar Sucursal</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockBranches.map(branch => (
                    <div key={branch.id} className="rounded-lg border border-slate-200 bg-slate-50 p-5 hover:border-slate-300 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-base font-bold text-tech-blue">{branch.name}</h4>
                          <p className="text-sm text-slate-500">{branch.location}</p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500">
                          Activa
                        </span>
                      </div>
                      <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                         <p className="text-xs text-slate-500">Rutas ARC Habilitadas: <span className="font-medium text-slate-600">{branch.enabledARCRouteIds.length}</span></p>
                         <button className="text-sm font-medium text-vial-orange hover:opacity-80 transition-colors">Editar</button>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}

        {/* TAB DE CONFIGURACIÓN DEL SISTEMA */}
        {activeTab === 'system' && (
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-slate-200 bg-white/50 p-6 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-tech-blue flex items-center">
                  <Settings className="mr-2 h-5 w-5 text-vial-orange" />
                  Configuración del Sistema
                </h3>
              </div>

              <div className="space-y-6 max-w-2xl bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <div>
                  <h4 className="text-base font-bold text-tech-blue mb-1">Alertas y Notificaciones Sonoras</h4>
                  <p className="text-sm text-slate-500 mb-4">
                    Configura la pista de audio de notificación que se reproducirá en bucle en la aplicación del conductor al recibir solicitudes, y como alerta emergente en la aplicación del pasajero.
                  </p>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      URL del Audio de Notificación (MP3 / WAV)
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-tech-blue placeholder-slate-400 focus:border-vial-orange focus:outline-none transition-colors"
                      placeholder="https://example.com/sound.mp3"
                      value={notificationSoundUrl}
                      onChange={(e) => setNotificationSoundUrl(e.target.value)}
                    />
                    <p className="text-xs text-slate-400">
                      Proporciona un enlace directo a un archivo de sonido público (ej. hospedado en Firebase Storage, AWS S3 o similar).
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={handleSaveSystemConfig}
                    disabled={isSavingSystem}
                    className="flex items-center space-x-2 rounded-lg bg-vial-orange px-5 py-2.5 text-sm font-black text-gray-950 hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isSavingSystem ? 'Guardando...' : 'Guardar Configuración'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
