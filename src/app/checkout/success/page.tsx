'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CheckCircle2, ChevronRight, Home, Calendar } from 'lucide-react';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tripId = searchParams.get('tripId');
  const amount = searchParams.get('amount') || '0';

  const [loading, setLoading] = useState(true);
  const [tripData, setTripData] = useState<any>(null);

  useEffect(() => {
    if (tripId && tripId !== 'landing') {
      const updateTrip = async () => {
        try {
          const docRef = doc(db, 'trips', tripId);
          await updateDoc(docRef, {
            paymentStatus: 'paid',
            paidAt: Date.now()
          });
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            setTripData(snap.data());
          }
        } catch (err) {
          console.error('Error updating trip payment status:', err);
        } finally {
          setLoading(false);
        }
      };
      updateTrip();
    } else {
      setLoading(false);
    }
  }, [tripId]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-slate-800">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-slate-100 flex flex-col items-center gap-6 text-center">
        <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 animate-bounce">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-slate-800">¡Pago Confirmado!</h1>
          <p className="text-sm text-slate-500 mt-2">Tu pago de viaje fue procesado correctamente.</p>
        </div>

        <div className="w-full bg-slate-50 rounded-2xl p-5 border border-slate-100 text-left text-xs text-slate-500 flex flex-col gap-3">
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="font-bold text-slate-700">Monto Acreditado:</span>
            <span className="font-bold text-emerald-600 text-sm">${Number(amount || tripData?.price || 0).toLocaleString('es-AR')} ARS</span>
          </div>
          <div><span className="font-bold text-slate-700">Transacción:</span> Mercado Pago Split 1:1</div>
          <div><span className="font-bold text-slate-700">Viaje ID:</span> {tripId}</div>
          {tripData && (
            <>
              <div><span className="font-bold text-slate-700">Origen:</span> {tripData.origin}</div>
              <div><span className="font-bold text-slate-700">Destino:</span> {tripData.destination}</div>
              <div><span className="font-bold text-slate-700">Pasajero:</span> {tripData.passengerName || tripData.userName}</div>
            </>
          )}
          <div className="flex items-center gap-2 text-emerald-600 font-semibold mt-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Servicio de asignación activo</span>
          </div>
        </div>

        <button
          onClick={() => router.push('/')}
          className="w-full bg-[#0A2A5B] text-white font-bold py-3.5 rounded-2xl shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
        >
          <Home className="h-4 w-4" />
          <span>Volver al Inicio</span>
        </button>
      </div>
    </div>
  );
}
