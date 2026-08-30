"use client";

import React, { useState, useEffect } from 'react';
import { 
  Settings, MapPin, DollarSign, Plus, FileText, CheckCircle2, Trash2, Edit, 
  AlertCircle, Sparkles, Car, Star, Shield, Crown, RefreshCw, Save, Upload, 
  X, Plane, ArrowLeftRight, Building2, Phone, Mail, Percent, ShieldAlert 
} from 'lucide-react';
import { Branch, ARCTariff, MUTariff, VehicleCategory, TransferTariff } from '@/types/logistics';
import { MUTariffForm } from '@/components/travelcab/settings/MUTariffForm';
import { ARCTariffForm } from '@/components/travelcab/settings/ARCTariffForm';
import { TransferTariffForm } from '@/components/travelcab/settings/TransferTariffForm';
import { 
  collection, onSnapshot, doc, setDoc, deleteDoc, getDocs, updateDoc, 
  writeBatch, query, where, addDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function TravelCabSettingsPage() {
  const [activeTab, setActiveTab] = useState<'tariffs' | 'branches' | 'categories' | 'system'>('tariffs');
  const [tariffSubTab, setTariffSubTab] = useState<'mu' | 'arc' | 'transfers'>('mu');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');
  
  // System Config / Logistics States
  const [notificationSoundUrl, setNotificationSoundUrl] = useState('');
  const [isSavingSystem, setIsSavingSystem] = useState(false);
  const [isLoadingSystem, setIsLoadingSystem] = useState(true);
  
  // Real-Time States
  const [muTariffs, setMuTariffs] = useState<MUTariff[]>([]);
  const [arcTariffs, setArcTariffs] = useState<ARCTariff[]>([]);
  const [transferTariffs, setTransferTariffs] = useState<TransferTariff[]>([]);
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  
  // Loading states
  const [isLoadingTariffs, setIsLoadingTariffs] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);

  // Edit / Form States
  const [editingMUTariff, setEditingMUTariff] = useState<MUTariff | null>(null);
  const [editingARCTariff, setEditingARCTariff] = useState<ARCTariff | null>(null);
  const [editingTransferTariff, setEditingTransferTariff] = useState<TransferTariff | null>(null);
  
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

  // Branch form state
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchForm, setBranchForm] = useState({
    name: '',
    code: '',
    city: '',
    province: '',
    address: '',
    phone: '',
    email: '',
    active: true
  });
  const [showBranchModal, setShowBranchModal] = useState(false);

  // 1. Escuchar Tarifarios en tiempo real
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'tariffs'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any);
      setMuTariffs(list.filter(t => t.type === 'mu' && t.id !== 'mu_active'));
      setArcTariffs(list.filter(t => (t.type === 'arc' || t.type === 'aci') && t.id !== 'arc_active'));
      setTransferTariffs(list.filter(t => t.type === 'transfers'));
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

  // 3. Escuchar Sucursales en tiempo real
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'branches'), (snapshot) => {
      const list = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        name: docSnap.data().name || 'Sucursal',
        code: docSnap.data().code || '',
        city: docSnap.data().city || '',
        province: docSnap.data().province || '',
        address: docSnap.data().address || '',
        phone: docSnap.data().phone || '',
        email: docSnap.data().email || '',
        active: docSnap.data().active !== undefined ? docSnap.data().active : true,
        activeMUTariffId: docSnap.data().activeMUTariffId,
        activeARCTariffId: docSnap.data().activeARCTariffId,
        activeTransferTariffId: docSnap.data().activeTransferTariffId,
        createdAt: docSnap.data().createdAt || Date.now()
      } as Branch));
      setBranches(list);
      setIsLoadingBranches(false);
    }, (error) => {
      console.error("Error listening to branches:", error);
      setIsLoadingBranches(false);
    });
    return unsub;
  }, []);

  // 4. Escuchar Configuración de Logística y Sonidos
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

  // 5. Detectar parámetros de la URL para redirección profunda
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
          setEditingTransferTariff(null);
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

  // Sincronizar formulario de sucursales en modo edición
  useEffect(() => {
    if (editingBranch) {
      setBranchForm({
        name: editingBranch.name || '',
        code: editingBranch.code || '',
        city: editingBranch.city || '',
        province: editingBranch.province || '',
        address: editingBranch.address || '',
        phone: editingBranch.phone || '',
        email: editingBranch.email || '',
        active: editingBranch.active !== undefined ? editingBranch.active : true
      });
      setShowBranchModal(true);
    }
  }, [editingBranch]);

  // 6. Acciones CRUD Tarifas
  const handleEditTariff = (tariff: any) => {
    if (tariff.type === 'mu') {
      setEditingMUTariff(tariff);
      setTariffSubTab('mu');
    } else if (tariff.type === 'transfers') {
      setEditingTransferTariff(tariff);
      setTariffSubTab('transfers');
    } else {
      setEditingARCTariff(tariff);
      setTariffSubTab('arc');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteTariff = async (id: string, name: string, isActive: boolean) => {
    if (confirm(`¿Estás seguro de que deseas eliminar el tarifario "${name}"? Esta acción no se puede deshacer.`)) {
      try {
        await deleteDoc(doc(db, 'tariffs', id));
        alert("Tarifario eliminado correctamente de Firestore.");
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
      const q = query(tariffsRef, where('type', '==', tariff.type), where('category', '==', tariff.category || 'estandar'));
      const querySnap = await getDocs(q);

      querySnap.docs.forEach(docSnap => {
        if (docSnap.id === 'mu_active' || docSnap.id === 'arc_active') return;

        if (docSnap.id === tariff.id) {
          batch.update(doc(db, 'tariffs', docSnap.id), { isActive: true });
        } else {
          batch.update(doc(db, 'tariffs', docSnap.id), { isActive: false });
        }
      });

      await batch.commit();

      const categoryName = (tariff.category || 'estandar').toLowerCase();
      if (categoryName === 'estandar' || categoryName === 'standard') {
        const activeDocId = tariff.type === 'mu' ? 'mu_active' : 'arc_active';
        await setDoc(doc(db, 'tariffs', activeDocId), {
          ...tariff,
          isActive: true,
          updatedAt: Date.now()
        });
      }

      alert(`Tarifario "${tariff.name}" activado correctamente.`);
    } catch (err: any) {
      console.error("Error activating tariff:", err);
      alert("Error al activar tarifario: " + err.message);
    }
  };

  const handleDeactivateTariff = async (tariff: any) => {
    try {
      await updateDoc(doc(db, 'tariffs', tariff.id), { isActive: false });

      const categoryName = (tariff.category || 'estandar').toLowerCase();
      if (categoryName === 'estandar' || categoryName === 'standard') {
        const activeDocId = tariff.type === 'mu' ? 'mu_active' : 'arc_active';
        await updateDoc(doc(db, 'tariffs', activeDocId), { isActive: false });
      }

      alert(`Tarifario "${tariff.name}" desactivado correctamente.`);
    } catch (err: any) {
      console.error("Error deactivating tariff:", err);
      alert("Error al desactivar tarifario: " + err.message);
    }
  };

  // 7. Acciones CRUD Categorías
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.id.trim() || !categoryForm.name.trim()) {
      alert("Por favor completa los campos Código y Nombre.");
      return;
    }

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

  // 8. Acciones CRUD Sucursales
  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.name.trim()) {
      alert("Por favor ingresa el nombre de la sucursal.");
      return;
    }

    try {
      const payload: Partial<Branch> = {
        name: branchForm.name.trim(),
        code: branchForm.code.trim().toUpperCase(),
        city: branchForm.city.trim(),
        province: branchForm.province.trim(),
        address: branchForm.address.trim(),
        phone: branchForm.phone.trim(),
        email: branchForm.email.trim(),
        active: branchForm.active,
        createdAt: editingBranch?.createdAt || Date.now()
      };

      if (editingBranch) {
        await setDoc(doc(db, 'branches', editingBranch.id), payload, { merge: true });
        alert("Sucursal actualizada correctamente.");
      } else {
        await addDoc(collection(db, 'branches'), payload);
        alert("Sucursal creada correctamente.");
      }

      setBranchForm({
        name: '', code: '', city: '', province: '', address: '', phone: '', email: '', active: true
      });
      setEditingBranch(null);
      setShowBranchModal(false);
    } catch (err: any) {
      console.error("Error saving branch:", err);
      alert("Error al guardar sucursal: " + err.message);
    }
  };

  const handleDeleteBranch = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar la sucursal "${name}"?`)) {
      try {
        await deleteDoc(doc(db, 'branches', id));
        alert("Sucursal eliminada.");
      } catch (err: any) {
        console.error("Error deleting branch:", err);
        alert("Error al eliminar sucursal: " + err.message);
      }
    }
  };

  const getBranchNames = (branchIds?: string[]) => {
    if (!branchIds || branchIds.length === 0 || branchIds.includes('all')) {
      return ['🌐 Todas las Sucursales'];
    }
    return branchIds.map(bId => {
      const found = branches.find(b => b.id === bId);
      return found ? `📍 ${found.name}` : `📍 Sucursal #${bId}`;
    });
  };

  const filterTariffsByBranch = (list: any[]) => {
    if (selectedBranchFilter === 'all') return list;
    return list.filter(t => {
      if (!t.branchIds || t.branchIds.length === 0 || t.branchIds.includes('all')) return true;
      return t.branchIds.includes(selectedBranchFilter);
    });
  };

  const renderCategoryIcon = (iconName?: string) => {
    if (!iconName) return <Car className="h-5 w-5 text-slate-400" />;
    
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
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-tech-blue flex items-center">
            <Settings className="mr-3 h-8 w-8 text-vial-orange" />
            Configuración Logística
          </h1>
          <p className="mt-2 text-slate-500">Gestión centralizada de tarifarios reales, sucursales y categorías.</p>
        </div>
      </div>

      {/* Tabs Principales */}
      <div className="mb-6 flex border-b border-slate-200 overflow-x-auto">
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
          <Building2 className="h-5 w-5" />
          <span>Sucursales ({branches.length})</span>
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex space-x-2 rounded-xl bg-white p-1 border border-slate-200 shadow-sm">
                <button
                  onClick={() => {
                    setTariffSubTab('mu');
                    setEditingMUTariff(null);
                  }}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                    tariffSubTab === 'mu' ? 'bg-tech-blue text-white shadow' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  🏙️ Movilidad Urbana (MU)
                </button>
                <button
                  onClick={() => {
                    setTariffSubTab('arc');
                    setEditingARCTariff(null);
                  }}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                    tariffSubTab === 'arc' ? 'bg-vial-orange text-gray-950 shadow' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  🚌 Rural Compartido (ARC)
                </button>
                <button
                  onClick={() => {
                    setTariffSubTab('transfers');
                    setEditingTransferTariff(null);
                  }}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                    tariffSubTab === 'transfers' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  ✈️ Traslados Fijos
                </button>
              </div>

              {/* Filtro por Sucursal */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Filtrar por Sucursal:</span>
                <select
                  value={selectedBranchFilter}
                  onChange={(e) => setSelectedBranchFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-tech-blue focus:outline-none"
                >
                  <option value="all">🌐 Todas las Sucursales</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>📍 {b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Columna Izquierda: Formulario de Creación/Edición */}
              <div className="lg:col-span-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-6 text-xl font-bold text-tech-blue">
                    {tariffSubTab === 'mu' 
                      ? (editingMUTariff ? `Editar Tarifario MU: ${editingMUTariff.name}` : 'Crear Nuevo Tarifario MU (Urbano)') 
                      : tariffSubTab === 'arc'
                      ? (editingARCTariff ? `Editar Tarifario ARC: ${editingARCTariff.name}` : 'Crear Nuevo Tarifario ARC (Rural Compartido)')
                      : (editingTransferTariff ? `Editar Traslado Fijo: ${editingTransferTariff.name}` : 'Crear Nuevo Traslado Fijo Punto a Punto')
                    }
                  </h2>
                  {tariffSubTab === 'mu' ? (
                    <MUTariffForm 
                      editData={editingMUTariff} 
                      onSubmitSuccess={() => setEditingMUTariff(null)} 
                    />
                  ) : tariffSubTab === 'arc' ? (
                    <ARCTariffForm 
                      editData={editingARCTariff} 
                      onSubmitSuccess={() => setEditingARCTariff(null)} 
                    />
                  ) : (
                    <TransferTariffForm
                      editData={editingTransferTariff}
                      onSubmitSuccess={() => setEditingTransferTariff(null)}
                    />
                  )}
                </div>
              </div>

              {/* Columna Derecha: Listado en tiempo real */}
              <div className="lg:col-span-1">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-full">
                  <h2 className="mb-4 text-lg font-bold text-tech-blue flex items-center justify-between">
                    <span className="flex items-center">
                      <FileText className="mr-2 h-5 w-5 text-slate-500" />
                      Tarifarios Activos
                    </span>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {tariffSubTab === 'mu' ? filterTariffsByBranch(muTariffs).length : tariffSubTab === 'arc' ? filterTariffsByBranch(arcTariffs).length : filterTariffsByBranch(transferTariffs).length} registrados
                    </span>
                  </h2>
                  
                  <div className="space-y-4 max-h-[800px] overflow-y-auto pr-1 custom-scrollbar">
                    {isLoadingTariffs ? (
                      <div className="text-center py-8 text-slate-400 text-xs font-semibold flex flex-col items-center gap-2">
                        <RefreshCw className="h-5 w-5 animate-spin text-vial-orange" />
                        Cargando tarifarios desde Firestore...
                      </div>
                    ) : tariffSubTab === 'transfers' ? (
                      filterTariffsByBranch(transferTariffs).length === 0 ? (
                        <p className="text-sm text-slate-400 py-6 text-center">No hay traslados fijos para esta sucursal.</p>
                      ) : (
                        filterTariffsByBranch(transferTariffs).map(t => (
                          <div
                            key={t.id}
                            className={`rounded-xl border p-4 transition-all relative ${
                              t.isActive 
                                ? 'border-indigo-500/30 bg-indigo-50/20 shadow-sm' 
                                : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2 pr-12">
                              <div className="space-y-1">
                                <h4 className="font-bold text-tech-blue text-sm flex items-center gap-1.5">
                                  ✈️ {t.name}
                                </h4>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {getBranchNames(t.branchIds).map((bName, i) => (
                                    <span key={i} className="text-[9px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                                      {bName}
                                    </span>
                                  ))}
                                  <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded uppercase">
                                    Cat: {t.category}
                                  </span>
                                </div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase mt-2">{t.routes?.length || 0} Rutas Fijas:</p>
                                <div className="space-y-1 mt-1">
                                  {t.routes?.map((r: any) => (
                                    <div key={r.id} className="text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                                      <div className="flex justify-between items-center">
                                        <span className="font-semibold">{r.originName} {r.isBidirectional ? '⇄' : '➔'} {r.destinationName}</span>
                                        <span className="font-black text-indigo-600">${r.fixedPrice?.toLocaleString('es-AR')}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Acciones */}
                            <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                              {!t.isActive ? (
                                <button 
                                  onClick={() => handleActivateTariff(t)}
                                  className="text-[11px] font-bold text-indigo-600 hover:underline uppercase"
                                >
                                  Activar
                                </button>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-green-600 uppercase flex items-center">
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Activa
                                  </span>
                                  <button 
                                    onClick={() => handleDeactivateTariff(t)}
                                    className="text-[10px] font-bold text-rose-500 hover:underline uppercase"
                                  >
                                    Desactivar
                                  </button>
                                </div>
                              )}

                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={() => handleEditTariff(t)}
                                  className="p-1.5 text-slate-400 hover:text-tech-blue hover:bg-slate-200 rounded transition-colors"
                                  title="Editar"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteTariff(t.id, t.name, !!t.isActive)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )
                    ) : tariffSubTab === 'mu' ? (
                      filterTariffsByBranch(muTariffs).length === 0 ? (
                        <p className="text-sm text-slate-400 py-6 text-center">No hay tarifarios MU para esta sucursal.</p>
                      ) : (
                        filterTariffsByBranch(muTariffs).map(t => (
                          <div 
                            key={t.id} 
                            className={`rounded-xl border p-4 transition-all relative ${
                              t.isActive 
                                ? 'border-green-500/30 bg-green-500/5 shadow-sm' 
                                : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2 pr-12">
                              <div>
                                <h4 className="font-bold text-tech-blue text-sm flex items-center gap-1.5">
                                  {t.name}
                                </h4>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {getBranchNames(t.branchIds).map((bName, i) => (
                                    <span key={i} className="text-[9px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                                      {bName}
                                    </span>
                                  ))}
                                  <span className="text-[9px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded uppercase">
                                    Cat: {t.category}
                                  </span>
                                </div>
                              </div>
                              {t.isActive && (
                                <span className="flex items-center text-[10px] font-extrabold text-green-600 bg-green-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Activo
                                </span>
                              )}
                            </div>
                            
                            <div className="text-[11px] text-slate-600 space-y-1 mt-2 bg-white/70 p-2.5 rounded-lg border border-slate-200/60">
                              <p className="font-bold text-slate-800">Bajada: ${t.baseFare} | KM: ${t.pricePerKm} | Min Viaje: ${t.travelMinutePrice}</p>
                              <p>Mínimo: ${t.minimumFare} | Espera: ${t.waitMinutePrice}/min (Cortesía: {t.courtesyTimeMinutes}m)</p>
                              <p className="font-semibold text-slate-500">
                                Comisión: {t.commissionRate}% | IVA/IIBB/TEM s/com: {t.iva}% / {t.iibb}% / {t.taxMunicipal}%
                              </p>
                              {t.penalties && (
                                <p className="text-[10px] text-rose-600 font-semibold pt-1 border-t border-slate-100">
                                  Multa Cancelación Pasajero: ${t.penalties.cancelFixedFee} (Gracia: {t.penalties.cancelGracePeriodMinutes}m) | Multa Chofer: ${t.penalties.driverCancelPenaltyFee}
                                </p>
                              )}
                            </div>

                            {/* Acciones */}
                            <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                              {!t.isActive ? (
                                <button 
                                  onClick={() => handleActivateTariff(t)}
                                  className="text-[11px] font-bold text-vial-orange hover:underline uppercase"
                                >
                                  Activar Tarifa
                                </button>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-green-600 uppercase flex items-center">
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> En Producción
                                  </span>
                                  <button 
                                    onClick={() => handleDeactivateTariff(t)}
                                    className="text-[10px] font-bold text-rose-500 hover:underline uppercase"
                                  >
                                    Desactivar
                                  </button>
                                </div>
                              )}

                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={() => handleEditTariff(t)}
                                  className="p-1.5 text-slate-400 hover:text-tech-blue hover:bg-slate-200 rounded transition-colors"
                                  title="Editar"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteTariff(t.id, t.name, !!t.isActive)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
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
                      filterTariffsByBranch(arcTariffs).length === 0 ? (
                        <p className="text-sm text-slate-400 py-6 text-center">No hay tarifarios ARC para esta sucursal.</p>
                      ) : (
                        filterTariffsByBranch(arcTariffs).map(t => (
                          <div 
                            key={t.id} 
                            className={`rounded-xl border p-4 transition-all relative ${
                              t.isActive 
                                ? 'border-vial-orange/30 bg-vial-orange/5 shadow-sm' 
                                : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2 pr-12">
                              <div>
                                <h4 className="font-bold text-tech-blue text-sm">{t.name}</h4>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {getBranchNames(t.branchIds).map((bName, i) => (
                                    <span key={i} className="text-[9px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                                      {bName}
                                    </span>
                                  ))}
                                  <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded uppercase">
                                    Cat: {t.category}
                                  </span>
                                </div>
                              </div>
                              {t.isActive && (
                                <span className="flex items-center text-[10px] font-extrabold text-vial-orange bg-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Activo
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-600 space-y-1 mt-2 bg-white/70 p-2.5 rounded-lg border border-slate-200/60">
                              <p className="font-bold text-slate-800">Rutas Troncales: {t.routes?.length || 0}</p>
                              <div className="space-y-1 mt-1">
                                {t.routes?.map((r: any) => (
                                  <div key={r.id} className="text-xs text-slate-700 bg-white p-1.5 rounded border border-slate-200">
                                    <div className="flex justify-between items-center">
                                      <span>{r.mainOrigin} {r.isBidirectional ? '⇄' : '➔'} {r.mainDestination}</span>
                                      <span className="font-bold text-vial-orange">${r.pricePerSeat?.toLocaleString('es-AR')}/cupo</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <p className="font-semibold text-slate-500 pt-1">
                                Comisión: {t.commissionRate}% | IVA/IIBB/TEM s/com: {t.iva}% / {t.iibb}% / {t.taxMunicipal}%
                              </p>
                            </div>

                            {/* Acciones */}
                            <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                              {!t.isActive ? (
                                <button 
                                  onClick={() => handleActivateTariff(t)}
                                  className="text-[11px] font-bold text-vial-orange hover:underline uppercase"
                                >
                                  Activar Tarifa
                                </button>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-vial-orange uppercase flex items-center">
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> En Producción
                                  </span>
                                  <button 
                                    onClick={() => handleDeactivateTariff(t)}
                                    className="text-[10px] font-bold text-rose-500 hover:underline uppercase"
                                  >
                                    Desactivar
                                  </button>
                                </div>
                              )}

                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={() => handleEditTariff(t)}
                                  className="p-1.5 text-slate-400 hover:text-tech-blue hover:bg-slate-200 rounded transition-colors"
                                  title="Editar"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteTariff(t.id, t.name, !!t.isActive)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
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
            <div className="lg:col-span-1">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-xl font-bold text-tech-blue">
                  {editingCategory ? `Editar Categoría: ${editingCategory.name}` : 'Crear Categoría'}
                </h2>
                
                <form onSubmit={handleSaveCategory} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">ID / Código</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ej. estandar, vip, premium"
                      disabled={!!editingCategory}
                      value={categoryForm.id}
                      onChange={(e) => setCategoryForm({...categoryForm, id: e.target.value})}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-tech-blue focus:border-vial-orange focus:outline-none disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Nombre Comercial</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ej. TravelCab VIP"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-tech-blue focus:border-vial-orange focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Descripción</label>
                    <textarea 
                      rows={3}
                      placeholder="Ej. Autos de alta gama con chofer corporativo."
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-tech-blue focus:border-vial-orange focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Tiempo de Arribo (ETA)</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ej. 3 - 5 min"
                      value={categoryForm.eta}
                      onChange={(e) => setCategoryForm({...categoryForm, eta: e.target.value})}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-tech-blue focus:border-vial-orange focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Capacidad Asientos</label>
                    <input 
                      type="number" 
                      min="1"
                      max="12"
                      required
                      value={categoryForm.seats}
                      onChange={(e) => setCategoryForm({...categoryForm, seats: Number(e.target.value)})}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-tech-blue focus:border-vial-orange focus:outline-none"
                    />
                  </div>

                  <div className="flex pt-2 gap-2">
                    {editingCategory && (
                      <button 
                        type="button" 
                        onClick={() => {
                          setEditingCategory(null);
                          setCategoryForm({ id: '', name: '', description: '', eta: '3 - 5 min', icon: 'Car', seats: 4 });
                        }}
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                    )}
                    <button 
                      type="submit" 
                      className="flex-1 flex items-center justify-center rounded-lg bg-vial-orange px-4 py-2 text-xs font-extrabold text-gray-950 hover:opacity-90 shadow"
                    >
                      <Save className="mr-1 h-3.5 w-3.5" />
                      {editingCategory ? "Actualizar" : "Crear Categoría"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-xl font-bold text-tech-blue flex items-center">
                  <Car className="mr-2 h-5 w-5 text-slate-500" />
                  Categorías en Firestore ({categories.length})
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map(cat => (
                    <div 
                      key={cat.id} 
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 hover:border-slate-300 transition-all flex flex-col justify-between"
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
                        <p className="text-xs text-slate-500 font-semibold mb-3">
                          {cat.description || 'Sin descripción comercial cargada.'}
                        </p>
                      </div>
                      
                      <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-500">
                          ETA: <span className="text-tech-blue">{cat.eta}</span> | Asientos: <span className="text-vial-orange">{cat.seats || 4}</span>
                        </span>
                        
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => setEditingCategory(cat)}
                            className="p-1 text-slate-400 hover:text-tech-blue rounded"
                            title="Editar"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded"
                            title="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB DE SUCURSALES (REAL FIRESTORE) */}
        {activeTab === 'branches' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-tech-blue flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-vial-orange" />
                  Sucursales Operativas de la Red
                </h3>
                <p className="text-xs text-slate-500">Sedes habilitadas para la asignación de choferes y tarifarios específicos.</p>
              </div>
              <button 
                onClick={() => {
                  setEditingBranch(null);
                  setBranchForm({ name: '', code: '', city: '', province: '', address: '', phone: '', email: '', active: true });
                  setShowBranchModal(true);
                }}
                className="flex items-center space-x-2 rounded-xl bg-vial-orange px-4 py-2.5 text-xs font-extrabold text-gray-950 hover:opacity-90 shadow-sm transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Agregar Nueva Sucursal</span>
              </button>
            </div>

            {/* Listado de Sucursales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {isLoadingBranches ? (
                <div className="col-span-3 text-center py-12 text-slate-400 text-xs font-semibold flex flex-col items-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin text-vial-orange" />
                  Cargando sucursales...
                </div>
              ) : branches.length === 0 ? (
                <div className="col-span-3 text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-white text-slate-400 text-sm font-semibold">
                  No hay sucursales creadas. Haz clic en "Agregar Nueva Sucursal".
                </div>
              ) : (
                branches.map(branch => (
                  <div key={branch.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-base font-black text-tech-blue">{branch.name}</h4>
                          <span className="text-[10px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {branch.code || 'SUC-00'}
                          </span>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          branch.active ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {branch.active ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                        <p className="flex items-center gap-1.5 text-slate-700 font-semibold">
                          <MapPin className="h-3.5 w-3.5 text-vial-orange flex-shrink-0" />
                          {branch.address ? `${branch.address}, ` : ''}{branch.city || 'Ciudad'}{branch.province ? `, ${branch.province}` : ''}
                        </p>
                        {branch.phone && (
                          <p className="flex items-center gap-1.5 text-slate-500">
                            <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                            {branch.phone}
                          </p>
                        )}
                        {branch.email && (
                          <p className="flex items-center gap-1.5 text-slate-500">
                            <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                            {branch.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                      <span className="text-[11px] font-bold text-slate-400">
                        Tarifas asociadas: {muTariffs.filter(t => t.branchIds?.includes(branch.id)).length + arcTariffs.filter(t => t.branchIds?.includes(branch.id)).length}
                      </span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setEditingBranch(branch)}
                          className="p-1.5 text-slate-400 hover:text-tech-blue hover:bg-slate-100 rounded-lg transition-colors"
                          title="Editar Sucursal"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteBranch(branch.id, branch.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Eliminar Sucursal"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Crear/Editar Sucursal */}
            {showBranchModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
                  <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-tech-blue">
                      {editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal Operativa'}
                    </h3>
                    <button onClick={() => setShowBranchModal(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <form onSubmit={handleSaveBranch} className="p-5 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Nombre de la Sucursal</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ej. Sucursal Tucumán Centro"
                        value={branchForm.name}
                        onChange={e => setBranchForm({ ...branchForm, name: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-tech-blue outline-none focus:border-vial-orange"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Código / Sigla</label>
                        <input 
                          type="text" 
                          placeholder="Ej. SUC-TUC-01"
                          value={branchForm.code}
                          onChange={e => setBranchForm({ ...branchForm, code: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-tech-blue uppercase outline-none focus:border-vial-orange"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Provincia</label>
                        <input 
                          type="text" 
                          placeholder="Ej. Tucumán"
                          value={branchForm.province}
                          onChange={e => setBranchForm({ ...branchForm, province: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-tech-blue outline-none focus:border-vial-orange"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Ciudad / Localidad</label>
                        <input 
                          type="text" 
                          placeholder="Ej. San Miguel de Tucumán"
                          value={branchForm.city}
                          onChange={e => setBranchForm({ ...branchForm, city: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-tech-blue outline-none focus:border-vial-orange"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Dirección / Sede</label>
                        <input 
                          type="text" 
                          placeholder="Ej. 25 de Mayo 450"
                          value={branchForm.address}
                          onChange={e => setBranchForm({ ...branchForm, address: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-tech-blue outline-none focus:border-vial-orange"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Teléfono</label>
                        <input 
                          type="tel" 
                          placeholder="Ej. +54 381 4123456"
                          value={branchForm.phone}
                          onChange={e => setBranchForm({ ...branchForm, phone: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-tech-blue outline-none focus:border-vial-orange"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Email de Contacto</label>
                        <input 
                          type="email" 
                          placeholder="Ej. tucuman@travelapp.ar"
                          value={branchForm.email}
                          onChange={e => setBranchForm({ ...branchForm, email: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-tech-blue outline-none focus:border-vial-orange"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input 
                        type="checkbox"
                        id="branchActive"
                        checked={branchForm.active}
                        onChange={e => setBranchForm({ ...branchForm, active: e.target.checked })}
                        className="rounded text-vial-orange focus:ring-vial-orange"
                      />
                      <label htmlFor="branchActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                        Sucursal Activa para Operaciones y Despacho
                      </label>
                    </div>

                    <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowBranchModal(false)}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-vial-orange px-5 py-2 text-xs font-extrabold text-gray-950 hover:opacity-90 shadow-sm"
                      >
                        {editingBranch ? 'Guardar Cambios' : 'Crear Sucursal'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB DE CONFIGURACIÓN DEL SISTEMA */}
        {activeTab === 'system' && (
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-tech-blue flex items-center">
                  <Settings className="mr-2 h-5 w-5 text-vial-orange" />
                  Configuración del Sistema
                </h3>
              </div>

              <div className="space-y-6 max-w-2xl bg-slate-50 p-6 rounded-xl border border-slate-200">
                <div>
                  <h4 className="text-base font-bold text-tech-blue mb-1">Alertas y Notificaciones Sonoras</h4>
                  <p className="text-sm text-slate-500 mb-4">
                    Configura la pista de audio de notificación que se reproducirá en bucle en la aplicación del conductor al recibir solicitudes.
                  </p>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      URL del Audio de Notificación (MP3 / WAV)
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-tech-blue bg-white focus:border-vial-orange focus:outline-none transition-colors"
                      placeholder="https://example.com/sound.mp3"
                      value={notificationSoundUrl}
                      onChange={(e) => setNotificationSoundUrl(e.target.value)}
                    />
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
