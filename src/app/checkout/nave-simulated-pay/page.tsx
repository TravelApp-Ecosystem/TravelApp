'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Building2,
  ArrowRight,
  Info,
  Calendar,
  Lock
} from 'lucide-react';

function NaveSimulatedPayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const file = searchParams.get('file') || 'EXP-2026-DEMO';
  const amountStr = searchParams.get('amount') || '50000';
  const title = searchParams.get('title') || 'Excursión / Paquete TravelApp Experience';
  const amount = Number(amountStr) || 50000;

  const [paymentTab, setPaymentTab] = useState<'card' | 'modo'>('card');
  const [selectedInstallment, setSelectedInstallment] = useState<number>(1);
  const [cardHolder, setCardHolder] = useState('MARCOS VIGNOLA');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 5678');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Esquema referencial de cuotas bancarias Galicia / Nave
  const installmentOptions = [
    { installments: 1, label: '1 pago de', value: amount, note: 'Sin interés' },
    { installments: 3, label: '3 cuotas fijas de', value: Math.round(amount / 3), note: 'Cuota Simple / Promo Galicia' },
    { installments: 6, label: '6 cuotas fijas de', value: Math.round((amount * 1.15) / 6), note: 'CFT: 15% recargo financiado' },
    { installments: 12, label: '12 cuotas fijas de', value: Math.round((amount * 1.30) / 12), note: 'CFT: 30% recargo financiado' },
  ];

  const handleConfirmPayment = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Enviar notificación al Webhook receptor de Nave para conciliar la reserva en Firestore
      const webhookPayload = {
        payment_id: `nave_galicia_${Date.now()}`,
        external_payment_id: file,
        status: 'APPROVED',
        amount: amount,
        payment_method: paymentTab === 'card' ? `Tarjeta Crédito (${selectedInstallment} cuotas)` : 'QR MODO Galicia',
        store_code: 'TRAVELAPP_GALICIA_01'
      };

      const res = await fetch('/api/webhooks/nave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      });

      if (!res.ok) {
        console.warn('[Nave Sim Pay] Webhook respondió con estado:', res.status);
      }

      // 2. Redirigir a la pantalla de éxito con el código de expediente
      setTimeout(() => {
        router.push(`/checkout/success?file=${encodeURIComponent(file)}&amount=${amount}&type=experience`);
      }, 1200);

    } catch (err: any) {
      console.error('[Nave Sim Pay Error]:', err);
      // Aún con error de red en webhook, redirigir a éxito para no bloquear la experiencia de test
      router.push(`/checkout/success?file=${encodeURIComponent(file)}&amount=${amount}&type=experience`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-sans text-slate-800">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Cabecera Nave / Banco Galicia */}
        <div className="bg-gradient-to-r from-orange-600 via-red-600 to-rose-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center font-black text-lg border border-white/20">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-tight text-lg">nave</span>
                <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-md">
                  Banco Galicia
                </span>
              </div>
              <p className="text-[11px] text-white/80 font-medium">Pasarela de Pagos Oficial TravelApp</p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-black/20 text-white/90 px-2.5 py-1 rounded-full border border-white/10">
            Sandbox Test
          </span>
        </div>

        {/* Resumen del Pedido */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Expediente: {file}
              </span>
              <h2 className="text-base font-black text-slate-900 leading-snug">{title}</h2>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-[10px] font-bold text-slate-400 block">Total a Abonar</span>
              <span className="text-xl font-black text-rose-600">
                ${amount.toLocaleString('es-AR')} <span className="text-xs font-bold text-slate-500">ARS</span>
              </span>
            </div>
          </div>
        </div>

        {/* Pestañas de Pago: Tarjeta vs MODO */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setPaymentTab('card')}
              className={`py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition ${
                paymentTab === 'card'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <CreditCard className="h-4 w-4 text-orange-600" /> Tarjetas y Cuotas
            </button>
            <button
              type="button"
              onClick={() => setPaymentTab('modo')}
              className={`py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition ${
                paymentTab === 'modo'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <QrCode className="h-4 w-4 text-emerald-600" /> QR MODO / Galicia
            </button>
          </div>

          {paymentTab === 'card' ? (
            <div className="space-y-4">
              {/* Selector de Cuotas / Financiación */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 block flex items-center justify-between">
                  <span>Seleccioná tu plan de pago:</span>
                  <span className="text-[10px] text-orange-600 font-bold">Promociones Galicia</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {installmentOptions.map((opt) => (
                    <button
                      key={opt.installments}
                      type="button"
                      onClick={() => setSelectedInstallment(opt.installments)}
                      className={`p-3 rounded-2xl border text-left transition ${
                        selectedInstallment === opt.installments
                          ? 'border-orange-500 bg-orange-50/50 shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-slate-900">
                          {opt.installments}x ${opt.value.toLocaleString('es-AR')}
                        </span>
                        {selectedInstallment === opt.installments && (
                          <CheckCircle2 className="h-4 w-4 text-orange-600" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block font-medium mt-0.5">
                        {opt.note}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mock de Tarjeta */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Tarjeta Habilitada para Sandbox
                </span>
                <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700">
                  <span>{cardNumber}</span>
                  <span className="text-[11px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md font-sans">
                    Galicia Visa
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-sans font-medium">
                  Titular: <strong className="text-slate-800">{cardHolder}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-center py-2">
              <div className="h-40 w-40 bg-white border-2 border-dashed border-emerald-400 rounded-3xl mx-auto flex flex-col items-center justify-center p-3 shadow-inner">
                <QrCode className="h-28 w-28 text-slate-800" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mt-1">
                  MODO Interoperable
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">
                Escaneá este código QR con la app de <strong>Banco Galicia</strong>, <strong>MODO</strong> o cualquier billetera para simular el pago instantáneo.
              </p>
            </div>
          )}

          {/* Aviso Sandbox */}
          <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200 text-amber-900 flex items-start gap-2.5 text-xs">
            <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="leading-snug text-[11px]">
              <strong className="block font-bold">Simulación de Entorno Nave Developers:</strong>
              Al confirmar, el sistema disparará la confirmación al webhook oficial de Nave y actualizará la reserva en Firestore.
            </div>
          </div>

          {/* Botón de Confirmación */}
          <button
            type="button"
            disabled={loading}
            onClick={handleConfirmPayment}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-black text-sm shadow-xl shadow-orange-600/30 flex items-center justify-center gap-2 transition disabled:opacity-75"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Procesando pago en Nave...</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                <span>Confirmar Pago de ${amount.toLocaleString('es-AR')} ARS</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 transition"
          >
            Cancelar y volver al catálogo
          </button>
        </div>

        {/* Footer Seguridad */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 text-center flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Encriptación SSL 256-bit — Certificado por Prisma & Grupo Financiero Galicia</span>
        </div>

      </div>
    </div>
  );
}

export default function NaveSimulatedPayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    }>
      <NaveSimulatedPayContent />
    </Suspense>
  );
}
