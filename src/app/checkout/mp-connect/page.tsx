'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Wallet, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';

export default function MPConnectPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get('userId');
  const email = searchParams.get('email');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (userId) {
      const fetchUser = async () => {
        const docRef = doc(db, 'users', userId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setUserData(snap.data());
        }
      };
      fetchUser();
    }
  }, [userId]);

  const handleAuthorize = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const docRef = doc(db, 'users', userId);
      // Guardar el acuerdo de pago (simulado) en el perfil del usuario
      await updateDoc(docRef, {
        mpLinked: true,
        mpPayerToken: 'mp_token_3476218152', // Token de prueba asociado a la cuenta sandbox
        mpUserEmail: email || 'test_user_wallet@travelapp.ar',
        mpLinkedAt: Date.now()
      });
      setSuccess(true);
    } catch (err) {
      console.error('Error authorizing Wallet Connect:', err);
      alert('Hubo un error al autorizar la vinculación.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-slate-100 flex flex-col items-center gap-6">
          <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 animate-bounce">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">¡Conexión Exitosa!</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Tu cuenta de Mercado Pago se vinculó de manera segura a **TravelApp Ecosistema**. 
            Ya puedes pagar tus viajes automáticamente con un solo clic.
          </p>
          <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left text-xs text-slate-500 flex flex-col gap-2">
            <div><span className="font-bold text-slate-700">Pasajero ID:</span> {userId}</div>
            <div><span className="font-bold text-slate-700">Método:</span> Wallet Connect 1-Clic</div>
            <div><span className="font-bold text-slate-700">Estado:</span> Autorizado 🟢</div>
          </div>
          <p className="text-xs text-slate-400">Puedes volver a la aplicación móvil ahora.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#009EE3] p-6 text-white">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl text-slate-800 flex flex-col gap-6">
        {/* Header Mercado Pago */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-sky-50 flex items-center justify-center text-[#009EE3]">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-md font-extrabold tracking-tight text-[#009EE3]">mercado pago</h2>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Wallet Connect</span>
            </div>
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold">Sandbox Mode</span>
        </div>

        <div className="flex flex-col gap-2 text-center my-2">
          <h1 className="text-xl font-bold text-slate-800">Autorizar TravelApp</h1>
          <p className="text-sm text-slate-500">
            Autoriza a **TravelApp** para realizar débitos directos en tu cuenta por los servicios de viaje solicitados.
          </p>
        </div>

        {/* Datos Sandbox */}
        <div className="bg-sky-50 rounded-2xl p-4 border border-sky-100 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-[#009EE3] font-bold text-xs">
            <ShieldCheck className="h-4 w-4" />
            <span>Cuenta de Pruebas Detectada</span>
          </div>
          <div className="text-xs text-slate-600 leading-relaxed">
            Iniciando sesión como pasajero de prueba:
            <div className="font-mono mt-1 text-[11px] bg-white/80 p-2 rounded-lg border border-sky-100 flex flex-col gap-1">
              <div><span className="font-bold">Usuario:</span> TESTUSER3713055520452621694</div>
              <div><span className="font-bold">Password:</span> axH7mJqngb</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-2">
          <button
            onClick={handleAuthorize}
            disabled={loading}
            className="w-full bg-[#009EE3] text-white font-bold py-3.5 rounded-2xl shadow-lg hover:bg-[#0087c4] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <span>Autorizar Vinculación</span>
            )}
          </button>
          
          <button
            onClick={() => window.close()}
            className="w-full bg-slate-50 text-slate-500 font-bold py-3.5 rounded-2xl hover:bg-slate-100 transition-all text-center text-sm"
          >
            Cancelar
          </button>
        </div>

        <div className="text-[10px] text-slate-400 text-center leading-relaxed">
          Esta vinculación permite cobros directos sin ingresar datos de tarjeta cada vez. Puedes revocar esta autorización en cualquier momento desde tu panel de Mercado Pago.
        </div>
      </div>
    </div>
  );
}
