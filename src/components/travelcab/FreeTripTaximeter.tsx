"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Car, Play, CheckCircle, Navigation, Clock, DollarSign,
  Mail, Phone, User, ShieldCheck, CreditCard, Banknote,
  QrCode, AlertCircle, RefreshCw, Send, Check
} from 'lucide-react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MUTariff } from '@/types/logistics';

interface FreeTripTaximeterProps {
  onTripCompleted?: (tripData: any) => void;
}

export const FreeTripTaximeter: React.FC<FreeTripTaximeterProps> = ({ onTripCompleted }) => {
  // Estado del viaje: 'idle' (Libre) | 'running' (En Viaje) | 'completed' (Finalizado)
  const [tripState, setTripState] = useState<'idle' | 'running' | 'completed'>('idle');

  // Datos del Conductor y Pasajero
  const [driverName, setDriverName] = useState('Carlos Mamani (Gol Trend - AB 123 CD)');
  const [passengerName, setPassengerName] = useState('');
  const [passengerEmail, setPassengerEmail] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [originAddress, setOriginAddress] = useState('San Miguel de Tucumán');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Mercado Pago QR' | 'Tarjeta Débito/Crédito'>('Efectivo');

  // Tarifas configuradas
  const [baseFare, setBaseFare] = useState(1200);        // Bajada de bandera
  const [pricePerKm, setPricePerKm] = useState(480);       // Precio por Km
  const [pricePerMinute, setPricePerMinute] = useState(120); // Precio por Minuto

  // Taxímetro en Tiempo Real
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [currentFare, setCurrentFare] = useState(1200);

  // Estados de Recibo Digital
  const [sendingReceipt, setSendingReceipt] = useState(false);
  const [receiptSentSuccess, setReceiptSentSuccess] = useState(false);
  const [completedTripId, setCompletedTripId] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Temporizador y cálculo de tarifa en vivo
  useEffect(() => {
    if (tripState === 'running') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const nextSec = prev + 1;
          // Simulación de avance en km (~35 km/h en ciudad = ~0.01 km/seg)
          const nextKm = Number((nextSec * 0.0098).toFixed(2));
          setDistanceKm(nextKm);

          const timeCost = Math.round((nextSec / 60) * pricePerMinute);
          const kmCost = Math.round(nextKm * pricePerKm);
          const totalFare = Math.max(baseFare, baseFare + timeCost + kmCost);
          setCurrentFare(totalFare);

          return nextSec;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [tripState, baseFare, pricePerKm, pricePerMinute]);

  // INICIAR VIAJE LIBRE
  const handleStartTrip = () => {
    setElapsedSeconds(0);
    setDistanceKm(0);
    setCurrentFare(baseFare);
    setReceiptSentSuccess(false);
    setCompletedTripId(null);
    setTripState('running');
  };

  // FINALIZAR VIAJE
  const handleFinishTrip = async () => {
    setTripState('completed');
    if (timerRef.current) clearInterval(timerRef.current);

    const tripData = {
      serviceType: 'Viaje Libre (Taxímetro)',
      passengerName: passengerName.trim() || 'Pasajero Libre / Calle',
      passengerEmail: passengerEmail.trim() || null,
      passengerPhone: passengerPhone.trim() || null,
      driverName,
      origin: originAddress,
      destination: destinationAddress.trim() || 'Destino Libre',
      durationMinutes: Math.ceil(elapsedSeconds / 60),
      distanceKm: distanceKm,
      price: currentFare,
      baseFare,
      paymentMethod,
      status: 'Completado',
      createdAt: Date.now(),
    };

    try {
      const docRef = await addDoc(collection(db, 'trips'), tripData);
      setCompletedTripId(docRef.id);

      // Si se proporcionó email del pasajero, enviar automáticamente el recibo
      if (passengerEmail.trim()) {
        await handleSendReceipt(docRef.id, currentFare, passengerEmail.trim(), tripData.passengerName);
      }

      if (onTripCompleted) {
        onTripCompleted({ id: docRef.id, ...tripData });
      }
    } catch (err) {
      console.error('Error al registrar viaje libre en Firestore:', err);
    }
  };

  // ENVIAR RECIBO DIGITAL POR MAIL
  const handleSendReceipt = async (
    tripId: string,
    amount: number,
    targetEmail?: string,
    targetName?: string
  ) => {
    const emailToSend = targetEmail || passengerEmail.trim();
    if (!emailToSend) return;

    setSendingReceipt(true);
    try {
      const res = await fetch('/api/receipt/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: tripId || completedTripId || 'LIBRE-' + Date.now().toString().slice(-4),
          passengerEmail: emailToSend,
          passengerName: targetName || passengerName.trim() || 'Pasajero TravelCab',
          amount,
          origin: originAddress,
          destination: destinationAddress.trim() || 'Centro de la Ciudad',
          driverName,
          paymentMethod,
          distanceKm,
          durationMinutes: Math.ceil(elapsedSeconds / 60),
          date: new Date().toLocaleDateString('es-AR', {
            day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
          }),
        }),
      });

      if (res.ok) {
        setReceiptSentSuccess(true);
      }
    } catch (error) {
      console.error('Error enviando recibo:', error);
    } finally {
      setSendingReceipt(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white p-4 sm:p-6 overflow-y-auto space-y-5">
      
      {/* Header Modo Conductor */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-2xl bg-vial-orange flex items-center justify-center text-gray-950 font-black shadow-lg shadow-orange-500/20">
            <Car className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-vial-orange block">
              TravelCab Driver · Modo Viaje Libre
            </span>
            <h2 className="text-base font-black text-white">{driverName}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
            tripState === 'running' 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}>
            <span className={`h-2 w-2 rounded-full ${tripState === 'running' ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
            {tripState === 'running' ? 'En Viaje' : 'Libre'}
          </span>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* PANTALLA 1: VIAJE EN CURSO / TAXÍMETRO ACTIVO               */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tripState === 'running' && (
        <div className="space-y-4 animate-in fade-in zoom-in-95">
          
          {/* DISPLAY GIGANTE DE TARIFA ACUMULADA */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-950 rounded-3xl p-6 border-2 border-emerald-500/40 text-center shadow-2xl space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block">
              Tarifa en Curso (Taxímetro Activo)
            </span>
            <div className="text-5xl sm:text-6xl font-black text-white tracking-tight flex items-center justify-center gap-1">
              <span className="text-emerald-400 text-3xl sm:text-4xl">$</span>
              {currentFare.toLocaleString('es-AR')}
              <span className="text-xs font-bold text-slate-400 self-end mb-2">ARS</span>
            </div>

            {/* Sub-métricas: Tiempo y Distancia */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
              <div className="bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800 flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 text-vial-orange animate-spin" style={{ animationDuration: '3s' }} />
                <span className="font-mono text-base font-black text-white">{formatTimer(elapsedSeconds)}</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800 flex items-center justify-center gap-2">
                <Navigation className="h-4 w-4 text-blue-400" />
                <span className="text-base font-black text-white">{distanceKm} km</span>
              </div>
            </div>
          </div>

          {/* Desglose de Parámetros */}
          <div className="bg-slate-800/60 rounded-2xl p-3.5 border border-slate-700/60 text-[11px] space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span>Bajada de Bandera:</span>
              <span className="font-bold text-white">${baseFare.toLocaleString()} ARS</span>
            </div>
            <div className="flex justify-between">
              <span>Costo por Kilómetro (${pricePerKm}/km):</span>
              <span className="font-bold text-white">${Math.round(distanceKm * pricePerKm).toLocaleString()} ARS</span>
            </div>
            <div className="flex justify-between">
              <span>Costo por Tiempo (${pricePerMinute}/min):</span>
              <span className="font-bold text-white">${Math.round((elapsedSeconds / 60) * pricePerMinute).toLocaleString()} ARS</span>
            </div>
          </div>

          {/* Pasajero y Destino en Curso */}
          <div className="bg-slate-800/40 rounded-2xl p-3 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <User className="h-4 w-4 text-slate-400" />
              <span>Pasajero: <strong>{passengerName || 'Pasajero de Calle'}</strong></span>
            </div>
            {passengerEmail && (
              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <Mail className="h-3.5 w-3.5 text-blue-400" />
                <span>Recibo a: <strong>{passengerEmail}</strong></span>
              </div>
            )}
          </div>

          {/* 🔴 BOTÓN GIGANTE TÁCTIL: FINALIZAR VIAJE */}
          <button
            type="button"
            onClick={handleFinishTrip}
            className="w-full h-16 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-orange-600 text-white font-black text-lg sm:text-xl uppercase tracking-wider shadow-xl shadow-red-600/30 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 border-2 border-red-400/30 cursor-pointer"
          >
            <CheckCircle className="h-7 w-7" />
            FINALIZAR VIAJE
          </button>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* PANTALLA 2: VIAJE LIBRE INACTIVO (PREPARADO PARA INICIAR)    */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tripState === 'idle' && (
        <div className="space-y-4">
          <div className="bg-slate-800/80 rounded-3xl p-5 border border-slate-700 space-y-4">
            <span className="text-xs font-black uppercase text-vial-orange tracking-wider block">
              Configuración de Salida Libre
            </span>

            {/* Datos del Pasajero */}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                  Nombre del Pasajero (Opcional)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 font-bold focus:border-vial-orange focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                  Email del Pasajero (Para emisión automática de Recibo)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    value={passengerEmail}
                    onChange={(e) => setPassengerEmail(e.target.value)}
                    placeholder="pasajero@correo.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 font-bold focus:border-vial-orange focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                  Destino / Parada Prevista
                </label>
                <div className="relative">
                  <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    placeholder="Ej. Terminal de Ómnibus / Yerba Buena"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 font-bold focus:border-vial-orange focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Tarifario activo */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700 text-center text-xs">
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-750">
                <span className="text-[9px] text-slate-400 block">Bandera</span>
                <span className="font-black text-white">${baseFare}</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-750">
                <span className="text-[9px] text-slate-400 block">Por Km</span>
                <span className="font-black text-white">${pricePerKm}</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-750">
                <span className="text-[9px] text-slate-400 block">Por Min</span>
                <span className="font-black text-white">${pricePerMinute}</span>
              </div>
            </div>
          </div>

          {/* 🟢 BOTÓN GIGANTE TÁCTIL: INICIAR VIAJE LIBRE */}
          <button
            type="button"
            onClick={handleStartTrip}
            className="w-full h-16 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white font-black text-lg sm:text-xl uppercase tracking-wider shadow-xl shadow-emerald-600/30 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 border-2 border-emerald-400/30 cursor-pointer"
          >
            <Play className="h-7 w-7 fill-white" />
            INICIAR VIAJE LIBRE
          </button>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* PANTALLA 3: VIAJE FINALIZADO & RECIBO POR MAIL               */}
      {/* ───────────────────────────────────────────────────────────── */}
      {tripState === 'completed' && (
        <div className="space-y-4 animate-in zoom-in-95">
          <div className="bg-slate-800 rounded-3xl p-5 border border-slate-700 space-y-4">
            <div className="text-center space-y-1">
              <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-emerald-500/40">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-white">¡Viaje Finalizado con Éxito!</h3>
              <p className="text-xs text-slate-400">Resumen y liquidación del traslado.</p>
            </div>

            {/* Total a Cobrar */}
            <div className="bg-slate-900 p-4 rounded-2xl text-center border border-slate-750">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Total a Cobrar</span>
              <span className="text-4xl font-black text-emerald-400">${currentFare.toLocaleString('es-AR')} ARS</span>
              <div className="flex justify-center gap-4 text-xs text-slate-400 mt-2 font-bold">
                <span>{distanceKm} km recorridos</span>
                <span>•</span>
                <span>{formatTimer(elapsedSeconds)} de duración</span>
              </div>
            </div>

            {/* Medio de Pago */}
            <div className="space-y-1.5 text-xs">
              <label className="text-[10px] font-black uppercase text-slate-400 block">Medio de Pago:</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Efectivo', 'Mercado Pago QR', 'Tarjeta Débito/Crédito'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition ${
                      paymentMethod === m 
                        ? 'bg-vial-orange text-gray-950 border-vial-orange'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Sección de Emisión de Recibo por Mail */}
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-750 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-blue-400 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Recibo Digital al Pasajero
                </span>
                {receiptSentSuccess && (
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Enviado por Mail
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="email"
                  value={passengerEmail}
                  onChange={(e) => setPassengerEmail(e.target.value)}
                  placeholder="email.del.pasajero@gmail.com"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 font-bold focus:border-blue-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleSendReceipt(completedTripId || 'LIBRE-' + Date.now().toString().slice(-4), currentFare)}
                  disabled={!passengerEmail.trim() || sendingReceipt}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-black transition flex items-center gap-1 shadow-md cursor-pointer"
                >
                  {sendingReceipt ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  {receiptSentSuccess ? 'Reenviar' : 'Emitir'}
                </button>
              </div>

              {receiptSentSuccess && (
                <p className="text-[10px] text-emerald-300 font-medium animate-in fade-in">
                  ✓ El comprobante oficial con el desglose del viaje ha sido enviado exitosamente a <strong>{passengerEmail}</strong>.
                </p>
              )}
            </div>
          </div>

          {/* Botón para iniciar nuevo viaje */}
          <button
            type="button"
            onClick={() => {
              setTripState('idle');
              setPassengerName('');
              setPassengerEmail('');
              setPassengerPhone('');
              setDestinationAddress('');
              setReceiptSentSuccess(false);
            }}
            className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-750 text-white font-black text-sm uppercase tracking-wider border border-slate-700 transition active:scale-[0.98] cursor-pointer"
          >
            Nuevo Viaje Libre / Modo Disponible
          </button>
        </div>
      )}
    </div>
  );
};
