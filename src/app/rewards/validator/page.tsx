'use client';

import React, { useState } from 'react';
import { Zap, Search, CheckCircle, XCircle, AlertCircle, RefreshCw, Clock } from 'lucide-react';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Redemption {
  id: string;
  itemId: string;
  itemTitle: string;
  pointsRequired: number;
  nombreSolicitante: string;
  emailSolicitante: string;
  telefonoSolicitante: string;
  estado: "Pendiente" | "Aprobado" | "Rechazado";
  createdAt: string;
}

export default function CouponValidatorPage() {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [coupon, setCoupon] = useState<Redemption | null>(null);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setCoupon(null);
    setSearched(true);

    try {
      const code = couponCode.trim();
      // Try by document ID first
      const docRef = doc(db, 'reward_redemptions', code);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setCoupon({
          id: docSnap.id,
          itemId: data.itemId || '',
          itemTitle: data.itemTitle || 'Premio',
          pointsRequired: Number(data.pointsRequired || 0),
          nombreSolicitante: data.nombreSolicitante || 'Cliente',
          emailSolicitante: data.emailSolicitante || '',
          telefonoSolicitante: data.telefonoSolicitante || '',
          estado: data.estado || 'Pendiente',
          createdAt: data.createdAt || ''
        });
      } else {
        // Fallback: search by itemId or exact match search in collection
        const q = query(collection(db, 'reward_redemptions'), where('itemId', '==', code));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          const first = qSnap.docs[0];
          const data = first.data();
          setCoupon({
            id: first.id,
            itemId: data.itemId || '',
            itemTitle: data.itemTitle || 'Premio',
            pointsRequired: Number(data.pointsRequired || 0),
            nombreSolicitante: data.nombreSolicitante || 'Cliente',
            emailSolicitante: data.emailSolicitante || '',
            telefonoSolicitante: data.telefonoSolicitante || '',
            estado: data.estado || 'Pendiente',
            createdAt: data.createdAt || ''
          });
        } else {
          setErrorMsg('No se encontró ningún cupón con el código proporcionado.');
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al consultar la base de datos de cupones.');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!coupon) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'reward_redemptions', coupon.id), {
        estado: 'Aprobado'
      });
      setCoupon(prev => prev ? { ...prev, estado: 'Aprobado' } : null);
      setSuccessMsg('¡El cupón ha sido validado y canjeado con éxito!');
    } catch (err) {
      console.error(err);
      setErrorMsg('No se pudo validar el cupón.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50 space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-tech-blue flex items-center gap-2">
            <Zap className="h-7 w-7 text-vial-orange animate-pulse" />
            Validador de Cupones
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 font-medium">Validación en tiempo real de códigos de descuento, canjes de premios y vouchers.</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        
        {/* Search Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-tech-blue uppercase tracking-wide">Ingresar Código de Cupón</h3>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={couponCode}
                onChange={e => setCouponCode(e.target.value)}
                placeholder="Ej: dGZ5V8vW9H7rY12s o EXP-001"
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-sm text-slate-700 outline-none focus:border-tech-blue font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-tech-blue hover:bg-tech-blue/90 text-white font-bold py-2 px-5 rounded-lg text-xs transition-all flex items-center gap-1.5"
            >
              {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : 'Buscar'}
            </button>
          </form>
        </div>

        {/* Results Card */}
        {searched && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-center gap-2.5 text-xs font-bold">
                <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-250 text-emerald-700 p-4 rounded-xl flex items-center gap-2.5 text-xs font-bold">
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                {successMsg}
              </div>
            )}

            {coupon && (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{coupon.itemTitle}</h4>
                    <p className="text-[10px] text-slate-450 font-mono mt-0.5">Código: {coupon.id}</p>
                  </div>
                  {coupon.estado === 'Aprobado' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-250 px-2.5 py-0.5 font-bold text-emerald-700 text-[10px] uppercase">
                      <CheckCircle className="h-3.5 w-3.5" /> Canjeado
                    </span>
                  ) : coupon.estado === 'Rechazado' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-250 px-2.5 py-0.5 font-bold text-rose-700 text-[10px] uppercase">
                      <XCircle className="h-3.5 w-3.5" /> Rechazado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-250 px-2.5 py-0.5 font-bold text-amber-700 text-[10px] uppercase animate-pulse">
                      <Clock className="h-3.5 w-3.5" /> Pendiente de Canje
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Beneficiario</p>
                    <p className="font-bold text-slate-700 mt-1">{coupon.nombreSolicitante}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{coupon.emailSolicitante}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Puntos Requeridos</p>
                    <p className="font-black text-tech-blue mt-1">{coupon.pointsRequired} pts</p>
                  </div>
                </div>

                {coupon.estado === 'Pendiente' && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleValidate}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-6 rounded-lg text-xs shadow transition-all"
                    >
                      Aprobar &amp; Validar Canje
                    </button>
                  </div>
                )}

                {coupon.estado === 'Aprobado' && !successMsg && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold">
                    <AlertCircle className="h-4 w-4 text-blue-600 shrink-0" />
                    Este cupón ya fue canjeado. No requiere ninguna otra acción.
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>

    </div>
  );
}
