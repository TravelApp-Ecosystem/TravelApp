'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Save, Trash2, Gift, ClipboardList, Layers, Tag, X } from 'lucide-react';
import { collection, onSnapshot, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RewardRule, GlobalRewardsConfig } from '@/types/rewards';
import { 
  DEFAULT_REWARDS_CONFIG, 
  subscribeGlobalRewardsConfig, 
  saveGlobalRewardsConfig 
} from '@/lib/rewards-config';
import { CheckCircle2, ShieldCheck, DollarSign, Sparkles, Camera } from 'lucide-react';


function RewardsSettingsContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'rules' | 'rubros' | 'categories'>('rules');

  // Firestore Sync States
  const [rules, setRules] = useState<RewardRule[]>([]);
  const [rubros, setRubros] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal open states
  const [showRubroModal, setShowRubroModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Form input states
  const [newRubroName, setNewRubroName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  // Global Rewards Policy (Concorde 360)
  const [globalConfig, setGlobalConfig] = useState<GlobalRewardsConfig>(DEFAULT_REWARDS_CONFIG);
  const [savingGlobalConfig, setSavingGlobalConfig] = useState(false);
  const [globalSaveSuccess, setGlobalSaveSuccess] = useState(false);

  // 1. Sync data in real-time
  useEffect(() => {
    // Sync global rewards policy
    const unsubGlobal = subscribeGlobalRewardsConfig((cfg) => {
      setGlobalConfig(cfg);
    });

    // Sync reward_rules
    const unsubRules = onSnapshot(collection(db, 'reward_rules'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as RewardRule));
      setRules(list.length > 0 ? list : [
        { id: '1', name: 'Bares & Gastronomía', rubro: 'Gastronomía', conversionRate: 2500, pointValue: 175, isActive: true },
        { id: '2', name: 'TravelCab Movilidad Urbana', rubro: 'Movilidad', conversionRate: 3000, pointValue: 175, isActive: true },
        { id: '3', name: 'Paquetes & Experiencias Organizadas', rubro: 'Turismo', conversionRate: 3000, pointValue: 175, isActive: true },
        { id: '4', name: 'Hotelería & Alojamiento', rubro: 'Hotelería', conversionRate: 3500, pointValue: 175, isActive: true },
        { id: '5', name: 'Excursiones & Tours de Aventura', rubro: 'Tours', conversionRate: 2000, pointValue: 175, isActive: true },
      ]);
    });

    // Sync reward_rubros
    const unsubRubros = onSnapshot(collection(db, 'reward_rubros'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, name: d.data().name || '' }));
      setRubros(list.length > 0 ? list : [
        { id: '1', name: 'Gastronomía' },
        { id: '2', name: 'Traslados Logísticos' },
        { id: '3', name: 'Alojamiento & Tours' }
      ]);
    });

    // Sync reward_categories
    const unsubCategories = onSnapshot(collection(db, 'reward_categories'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, name: d.data().name || '' }));
      setCategories(list.length > 0 ? list : [
        { id: '1', name: 'Gold' },
        { id: '2', name: 'Platinum' },
        { id: '3', name: 'VIP' }
      ]);
      setLoading(false);
    }, () => {
      setLoading(false);
    });

    return () => {
      unsubGlobal();
      unsubRules();
      unsubRubros();
      unsubCategories();
    };
  }, []);

  // 2. Parse query params to deep-link
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const actionParam = searchParams.get('action');

    if (tabParam === 'rubros') {
      setActiveTab('rubros');
      if (actionParam === 'new') {
        setShowRubroModal(true);
      }
    } else if (tabParam === 'categories') {
      setActiveTab('categories');
      if (actionParam === 'new') {
        setShowCategoryModal(true);
      }
    }
  }, [searchParams]);

  // Operations for Global Policy (Concorde 360)
  const handleSaveGlobalConfig = async () => {
    setSavingGlobalConfig(true);
    try {
      await saveGlobalRewardsConfig({
        universalPointValue: Number(globalConfig.universalPointValue) || 175,
        welcomePointsBonus: Number(globalConfig.welcomePointsBonus) || 20,
        profilePhotoBonusPoints: Number(globalConfig.profilePhotoBonusPoints) || 10,
        dailyIssuanceCapPoints: Number(globalConfig.dailyIssuanceCapPoints) || 1000,
        defaultPointValue: Number(globalConfig.universalPointValue) || 175,
      });
      setGlobalSaveSuccess(true);
      setTimeout(() => setGlobalSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Error saving global rewards policy:', err);
      alert('Error al guardar la política global de rewards.');
    } finally {
      setSavingGlobalConfig(false);
    }
  };

  // Operations for rules
  const handleAddRule = () => {
    const newRule: RewardRule = {
      id: `RULE-${Date.now()}`,
      name: '',
      conversionRate: 3000,
      pointValue: globalConfig.universalPointValue || 175,
      isActive: true,
    };
    setRules([...rules, newRule]);
  };

  const handleUpdateRule = (id: string, updates: Partial<RewardRule>) => {
    setRules(rules.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handleDeleteRule = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta regla?")) {
      try {
        await deleteDoc(doc(db, 'reward_rules', id));
        setRules(rules.filter(r => r.id !== id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSaveRules = async () => {
    try {
      for (const rule of rules) {
        await setDoc(doc(db, 'reward_rules', rule.id), rule);
      }
      alert("Reglas de Recompensa guardadas con éxito.");
    } catch (err) {
      console.error(err);
      alert("Error al guardar reglas.");
    }
  };

  // Operations for Rubros
  const handleSaveRubro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRubroName.trim()) return;

    try {
      const id = `RUBRO-${Date.now()}`;
      await setDoc(doc(db, 'reward_rubros', id), { name: newRubroName.trim() });
      setNewRubroName('');
      setShowRubroModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRubro = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este rubro comercial?")) {
      try {
        await deleteDoc(doc(db, 'reward_rubros', id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Operations for Categories
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const id = `CAT-${Date.now()}`;
      await setDoc(doc(db, 'reward_categories', id), { name: newCategoryName.trim() });
      setNewCategoryName('');
      setShowCategoryModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta categoría?")) {
      try {
        await deleteDoc(doc(db, 'reward_categories', id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="p-6 lg:p-8 bg-slate-50 min-h-full space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-tech-blue flex items-center gap-2">
            <Gift className="h-7 w-7 text-vial-orange" />
            Configuraciones de Recompensas
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 font-medium">Parámetros generales, tasas de fidelización, catálogo de rubros y niveles de comercios.</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex space-x-1 rounded-xl bg-white/50 p-1 backdrop-blur-md w-max border border-slate-200">
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center rounded-lg px-6 py-2 transition-all text-xs font-bold ${
            activeTab === 'rules'
              ? 'bg-tech-blue text-white shadow-md'
              : 'text-slate-500 hover:text-tech-blue hover:bg-slate-100'
          }`}
        >
          <ClipboardList className="mr-2 h-4 w-4" />
          Reglas de Fidelidad
        </button>
        <button
          onClick={() => setActiveTab('rubros')}
          className={`flex items-center rounded-lg px-6 py-2 transition-all text-xs font-bold ${
            activeTab === 'rubros'
              ? 'bg-tech-blue text-white shadow-md'
              : 'text-slate-500 hover:text-tech-blue hover:bg-slate-100'
          }`}
        >
          <Tag className="mr-2 h-4 w-4" />
          Rubros Comerciales
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center rounded-lg px-6 py-2 transition-all text-xs font-bold ${
            activeTab === 'categories'
              ? 'bg-tech-blue text-white shadow-md'
              : 'text-slate-500 hover:text-tech-blue hover:bg-slate-100'
          }`}
        >
          <Layers className="mr-2 h-4 w-4" />
          Categorías de Comercios
        </button>
      </div>

      {/* Tab 1: Rules */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          {/* POLÍTICA MONETARIA MAESTRA & CONTROL DE EMISIÓN (CONCORDE 360) */}
          <div className="rounded-3xl border-2 border-tech-blue/30 bg-gradient-to-br from-white via-slate-50 to-blue-50/40 p-6 shadow-md space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-tech-blue text-white shadow-sm">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <h2 className="text-base font-black tracking-tight text-tech-blue">
                    Política Monetaria Maestra & Resguardo Ecosistema
                  </h2>
                  <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
                    Concorde 360
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 font-medium">
                  Valores universales de conversión, incentivos de registro y cupos diarios de emisión.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {globalSaveSuccess && (
                  <span className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200 animate-fadeIn">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ¡Política actualizada!
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSaveGlobalConfig}
                  disabled={savingGlobalConfig}
                  className="inline-flex items-center gap-2 rounded-xl bg-tech-blue px-5 py-2.5 text-xs font-black text-white shadow-md hover:brightness-110 transition-all disabled:opacity-50"
                  style={{ backgroundColor: '#0a2a5b' }}
                >
                  <Save className="h-4 w-4" />
                  {savingGlobalConfig ? 'Guardando...' : 'Guardar Política Maestra'}
                </button>
              </div>
            </div>

            {/* Aviso estricto de privacidad del valor monetario */}
            <div className="rounded-2xl border border-amber-300/80 bg-amber-50/70 p-4 text-xs text-amber-950 space-y-1.5">
              <p className="font-black text-amber-900 flex items-center gap-1.5">
                <Gift className="h-4 w-4 text-amber-600" /> Regla de Confidencialidad y Privacidad Visual
              </p>
              <p className="text-amber-800 leading-relaxed font-medium">
                • <strong>Pasajero / Usuario:</strong> En ningún momento ve la cotización en pesos ($ ARS) del punto. Solo visualiza los <strong>PUNTOS</strong> que acumula o canjea (ej: <em>&ldquo;Te regalamos 20 Puntos Rewards&rdquo;</em>, <em>&ldquo;+10 Puntos por cargar foto&rdquo;</em>, <em>&ldquo;Canjear por 20 Pts&rdquo;</em>).
                <br />
                • <strong>Chofer / Conductor:</strong> En su billetera ve exclusivamente el importe en <strong>PESOS ($ ARS)</strong> que se le acreditará por el viaje (ej: <em>$17.500 ARS brutos menos comisión de la plataforma</em>).
                <br />
                • <strong>Uso exclusivo Concorde 360:</strong> El valor en pesos acá configurado se utiliza para calcular el fondo de respaldo requerido en la cuenta custodia de BIND PSP y para los Términos y Condiciones legales.
              </p>
            </div>

            {/* Grid de Controles Editables */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Control 1: Valor Universal del Punto */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    Valor Universal del Punto
                  </label>
                  <DollarSign className="h-4 w-4 text-tech-blue" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-500">$</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={globalConfig.universalPointValue}
                    onChange={(e) => setGlobalConfig({ ...globalConfig, universalPointValue: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-base font-black text-tech-blue outline-none focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/10 bg-slate-50"
                  />
                  <span className="text-xs font-bold text-slate-400">ARS</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  Equivalencia universal fija para respaldo contable y canjes.
                </p>
              </div>

              {/* Control 2: Bono de Bienvenida por Registro */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    Bono Registro Usuario
                  </label>
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={globalConfig.welcomePointsBonus}
                    onChange={(e) => setGlobalConfig({ ...globalConfig, welcomePointsBonus: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-base font-black text-tech-blue outline-none focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/10 bg-slate-50"
                  />
                  <span className="text-xs font-bold text-slate-400">Puntos</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  Acreditación automática al crear cuenta en Web o App.
                </p>
              </div>

              {/* Control 3: Recompensa por Cargar Foto de Perfil */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    Bono Carga Foto Perfil
                  </label>
                  <Camera className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={globalConfig.profilePhotoBonusPoints}
                    onChange={(e) => setGlobalConfig({ ...globalConfig, profilePhotoBonusPoints: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-base font-black text-tech-blue outline-none focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/10 bg-slate-50"
                  />
                  <span className="text-xs font-bold text-slate-400">Puntos</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  Incentivo único para foto de perfil de usuario/pasajero.
                </p>
              </div>

              {/* Control 4: Tope Diario de Emisión */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    Tope Diario de Emisión
                  </label>
                  <ShieldCheck className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={globalConfig.dailyIssuanceCapPoints ?? 1000}
                    onChange={(e) => setGlobalConfig({ ...globalConfig, dailyIssuanceCapPoints: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-base font-black text-tech-blue outline-none focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/10 bg-slate-50"
                  />
                  <span className="text-xs font-bold text-slate-400">Pts/día</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  Límite máximo diario de emisión promocional de marketing.
                </p>
              </div>
            </div>

            {/* Calculadora de Impacto Financiero en Vivo (Visible solo para Staff en Concorde 360) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4.5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-tech-blue" />
                  Simulador de Pasivo Financiero y Respaldo Requerido en BIND PSP:
                </p>
                <span className="text-[10px] font-bold text-slate-400">Cotización base: ${globalConfig.universalPointValue} ARS/pt</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Registro Básico</span>
                  <p className="text-sm font-black text-slate-700 mt-1">{globalConfig.welcomePointsBonus} pts</p>
                  <p className="text-[11px] font-bold text-tech-blue mt-0.5">
                    = ${(globalConfig.welcomePointsBonus * globalConfig.universalPointValue).toLocaleString('es-AR')} ARS
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Bono Foto Perfil</span>
                  <p className="text-sm font-black text-slate-700 mt-1">{globalConfig.profilePhotoBonusPoints} pts</p>
                  <p className="text-[11px] font-bold text-tech-blue mt-0.5">
                    = ${(globalConfig.profilePhotoBonusPoints * globalConfig.universalPointValue).toLocaleString('es-AR')} ARS
                  </p>
                </div>

                <div className="bg-blue-50/60 rounded-xl p-3 border border-blue-200/60">
                  <span className="text-[10px] text-tech-blue font-bold block uppercase">Usuario Completo</span>
                  <p className="text-sm font-black text-tech-blue mt-1">
                    {globalConfig.welcomePointsBonus + globalConfig.profilePhotoBonusPoints} pts
                  </p>
                  <p className="text-[11px] font-bold text-tech-blue mt-0.5">
                    = ${((globalConfig.welcomePointsBonus + globalConfig.profilePhotoBonusPoints) * globalConfig.universalPointValue).toLocaleString('es-AR')} ARS
                  </p>
                </div>

                <div className="bg-emerald-50/60 rounded-xl p-3 border border-emerald-200/60">
                  <span className="text-[10px] text-emerald-800 font-bold block uppercase">Tope Presupuestario Diario</span>
                  <p className="text-sm font-black text-emerald-800 mt-1">
                    {(globalConfig.dailyIssuanceCapPoints ?? 1000).toLocaleString('es-AR')} pts
                  </p>
                  <p className="text-[11px] font-black text-emerald-700 mt-0.5">
                    = ${(((globalConfig.dailyIssuanceCapPoints ?? 1000)) * globalConfig.universalPointValue).toLocaleString('es-AR')} ARS/día
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-800">Matriz de Emisión por Rubro Comercial</p>
              <p className="text-[11px] text-slate-400 font-medium">Definí cada cuántos pesos gastados se otorga 1 Punto y el valor universal de canje.</p>
            </div>
            <button 
              onClick={handleAddRule}
              className="bg-tech-blue text-white hover:bg-tech-blue/90 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Nueva Regla
            </button>
          </div>

          <div className="space-y-4">
            {rules.map((rule) => {
              const conversion = rule.conversionRate || 3000;
              const pointVal = rule.pointValue || 175;
              const cashbackPct = ((pointVal / conversion) * 100).toFixed(1);
              const sampleSpend = conversion * 10;
              const samplePoints = 10;
              const sampleDiscount = samplePoints * pointVal;

              return (
                <div key={rule.id} className="rounded-2xl border border-slate-250 bg-white p-5 shadow-sm transition-shadow hover:shadow-md relative space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-slate-400 font-bold">ID: {rule.id}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black text-[10px]">
                        {cashbackPct}% Rendimiento Real
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleUpdateRule(rule.id, { isActive: !rule.isActive })}
                        className={`px-3 py-1 text-[10px] font-black uppercase rounded-full border transition-all ${
                          rule.isActive 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                      >
                        {rule.isActive ? 'Activa' : 'Inactiva'}
                      </button>
                      <button onClick={() => handleDeleteRule(rule.id)} className="text-slate-400 hover:text-red-500 p-1">
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">Nombre de la Promoción / Rubro *</label>
                      <input 
                        type="text" 
                        placeholder="Ej. Bares & Gastronomía"
                        value={rule.name}
                        onChange={(e) => handleUpdateRule(rule.id, { name: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-tech-blue"
                      />
                    </div>
                    
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">Tasa de Emisión (Monto en $)</label>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-500 font-bold">Cada $</span>
                        <input 
                          type="number" 
                          value={rule.conversionRate}
                          onChange={(e) => handleUpdateRule(rule.id, { conversionRate: Number(e.target.value) })}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-tech-blue"
                        />
                        <span className="text-xs text-slate-500 whitespace-nowrap font-bold">= 1 Pto</span>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-600">Valor de Canje Fijo ($)</label>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-500 font-bold">1 Pto = $</span>
                        <input 
                          type="number" 
                          value={rule.pointValue}
                          onChange={(e) => handleUpdateRule(rule.id, { pointValue: Number(e.target.value) })}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-tech-blue"
                        />
                        <span className="text-xs text-slate-500 whitespace-nowrap font-bold">ARS</span>
                      </div>
                    </div>
                  </div>

                  {/* Barra de Simulación Visual de la Regla */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                    <span className="font-bold flex items-center gap-1">
                      💡 Ejemplo de consumo de <strong>${sampleSpend.toLocaleString()} ARS</strong>:
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg font-black text-amber-600">
                        ⭐ Suma {samplePoints} Puntos
                      </span>
                      <span className="bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-black text-emerald-700">
                        = ${sampleDiscount.toLocaleString()} ARS al canjear
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-3">
            <button 
              onClick={handleSaveRules}
              className="inline-flex items-center justify-center space-x-2 rounded-xl bg-vial-orange px-6 py-2.5 text-xs font-bold text-white shadow hover:opacity-90 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Guardar Reglas</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Rubros */}
      {activeTab === 'rubros' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-500">Nómina de Rubros Comerciales</p>
            <button 
              onClick={() => setShowRubroModal(true)}
              className="bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Nuevo Rubro
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rubros.map((item) => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-slate-800">{item.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {item.id}</p>
                </div>
                <button
                  onClick={() => handleDeleteRubro(item.id)}
                  className="text-slate-400 hover:text-red-500 p-1 hover:bg-slate-50 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Categories */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-500">Niveles / Categorías de Comercios</p>
            <button 
              onClick={() => setShowCategoryModal(true)}
              className="bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Nueva Categoría
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((item) => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-indigo-700">{item.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {item.id}</p>
                </div>
                <button
                  onClick={() => handleDeleteCategory(item.id)}
                  className="text-slate-400 hover:text-red-500 p-1 hover:bg-slate-50 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Rubro */}
      {showRubroModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-800">Crear Rubro Comercial</h2>
              <button onClick={() => setShowRubroModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSaveRubro} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nombre del Rubro *</label>
                <input
                  type="text"
                  required
                  value={newRubroName}
                  onChange={e => setNewRubroName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                  placeholder="Ej: Gastronomía"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowRubroModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-tech-blue px-4 py-2 text-xs font-bold text-white hover:bg-tech-blue/90"
                >
                  Crear Rubro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Category */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-800">Crear Categoría Comercio</h2>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSaveCategory} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nombre de la Categoría *</label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                  placeholder="Ej: Platinum"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-lg bg-tech-blue px-4 py-2 text-xs font-bold text-white hover:bg-tech-blue/90"
                >
                  <Save className="mr-1 h-3.5 w-3.5" />
                  Crear Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function RewardsSettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Cargando parámetros...</div>}>
      <RewardsSettingsContent />
    </Suspense>
  );
}
