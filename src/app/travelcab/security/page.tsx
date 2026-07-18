'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Clock, CheckCircle2, RefreshCw, Save, Sparkles, HelpCircle } from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function SecuritySettingsPage() {
  const [biometricTimeout, setBiometricTimeout] = useState<number>(5);
  const [referralPassengerBonus, setReferralPassengerBonus] = useState<number>(500);
  const [referralDriverBonus, setReferralDriverBonus] = useState<number>(1000);
  const [pointsConversionRate, setPointsConversionRate] = useState<number>(10);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Sync settings from Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_config', 'driver_settings'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.biometricTimeoutMinutes !== undefined) {
          setBiometricTimeout(data.biometricTimeoutMinutes);
        }
        if (data.referralPassengerBonus !== undefined) {
          setReferralPassengerBonus(data.referralPassengerBonus);
        }
        if (data.referralDriverBonus !== undefined) {
          setReferralDriverBonus(data.referralDriverBonus);
        }
        if (data.pointsConversionRate !== undefined) {
          setPointsConversionRate(data.pointsConversionRate);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Error loading security settings:", error);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await setDoc(doc(db, 'system_config', 'driver_settings'), {
        biometricTimeoutMinutes: Number(biometricTimeout),
        referralPassengerBonus: Number(referralPassengerBonus),
        referralDriverBonus: Number(referralDriverBonus),
        pointsConversionRate: Number(pointsConversionRate),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      alert("Configuración de seguridad y parámetros actualizada correctamente en Firestore.");
    } catch (err: any) {
      console.error("Error updating security settings:", err);
      alert("Error al actualizar la configuración: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50 space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-tech-blue flex items-center gap-2">
            <ShieldAlert className="h-7 w-7 text-vial-orange" />
            Seguridad del Ecosistema
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 font-medium">Parámetros globales de verificación biométrica, inactividad y bonos del conductor.</p>
        </div>
      </div>

      <div className="max-w-2xl">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs font-semibold flex flex-col items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-vial-orange" />
            Cargando parámetros de seguridad...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Box 1: Biometric Verification */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-800">
                <Clock className="w-5 h-5 text-[#FF7A00]" />
                <h3 className="text-sm font-black uppercase tracking-wide">Verificación Biométrica de Choferes</h3>
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Define el tiempo máximo de inactividad que puede transcurrir antes de que la aplicación del conductor exija una verificación de identidad biométrica (facial) para continuar en servicio.
              </p>

              <div className="grid grid-cols-4 gap-2 pt-2">
                {[1, 5, 15, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setBiometricTimeout(mins)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      biometricTimeout === mins
                        ? 'bg-tech-blue border-tech-blue text-white shadow-md'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {mins} Minutos
                  </button>
                ))}
              </div>
            </div>

            {/* Box 2: Parametros de Ecosistema */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-800">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h3 className="text-sm font-black uppercase tracking-wide">Premios &amp; Tasas de Conversión</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Bono por Referido Pasajero ($)</label>
                  <input
                    type="number"
                    value={referralPassengerBonus}
                    onChange={e => setReferralPassengerBonus(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Bono por Referido Chofer ($)</label>
                  <input
                    type="number"
                    value={referralDriverBonus}
                    onChange={e => setReferralDriverBonus(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue bg-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Tasa de Conversión (Puntos por cada $100 gastados)</label>
                  <input
                    type="number"
                    value={pointsConversionRate}
                    onChange={e => setPointsConversionRate(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-tech-blue px-6 py-2.5 text-xs font-bold text-white hover:bg-tech-blue/90 shadow-md transition-all active:scale-[0.98]"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </form>
        )}
      </div>

    </div>
  );
}
