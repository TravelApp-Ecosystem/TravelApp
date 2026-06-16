'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, ShieldAlert, CreditCard, Loader2 } from 'lucide-react';

export default function MPSimulatedPayPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const amount = searchParams.get('amount') || '0';
  const tripId = searchParams.get('tripId') || 'landing';

  const [loading, setLoading] = useState(false);

  const handlePay = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push(`/checkout/success?tripId=${tripId}&amount=${amount}`);
    }, 2000);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-slate-800">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl border border-slate-100 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-sky-50 flex items-center justify-center text-[#009EE3]">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-md font-extrabold tracking-tight text-[#009EE3]">mercado pago</h2>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Checkout Pro</span>
            </div>
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold">Sandbox</span>
        </div>

        {/* Resumen */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-extrabold text-slate-800">${Number(amount).toLocaleString('es-AR')} ARS</h1>
          <p className="text-sm text-slate-500">Viaje TravelCab Especial (ID: {tripId})</p>
        </div>

        {/* Simulador tarjeta */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-3">
          <div className="text-xs text-slate-500 font-bold">Tarjeta de Pruebas (Visa)</div>
          <div className="h-12 bg-white rounded-xl border border-slate-200 px-3 flex items-center justify-between text-sm font-mono text-slate-600">
            <span>•••• •••• •••• 4321</span>
            <span>05/29</span>
          </div>
        </div>

        {/* Alerta */}
        <div className="flex gap-2.5 items-start bg-amber-50 p-3.5 rounded-2xl border border-amber-100 text-amber-800 text-xs leading-relaxed">
          <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-600" />
          <span>Este es un entorno de simulación seguro para las pruebas del MVP del Ecosistema de TravelApp. No se realizarán cargos reales a tu cuenta.</span>
        </div>

        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full bg-[#009EE3] text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-[#0087c4] transition-all flex items-center justify-center gap-2 disabled:opacity-75"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Procesando pago...</span>
            </>
          ) : (
            <span>Pagar Ahora</span>
          )}
        </button>

        <button
          onClick={() => router.back()}
          className="w-full bg-slate-50 text-slate-500 font-bold py-3.5 rounded-2xl hover:bg-slate-100 transition-all text-center text-sm"
        >
          Volver a la tienda
        </button>
      </div>
    </div>
  );
}
