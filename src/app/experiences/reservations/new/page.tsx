'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Ticket, Save, ArrowLeft, CheckCircle2, RefreshCw, Sparkles, User, Landmark } from 'lucide-react';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Tour } from '@/types/experiences';

interface Customer {
  id: string;
  displayName: string;
  email: string;
  phone: string;
}

export default function NewReservationPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [passengerName, setPassengerName] = useState('');
  const [passengerEmail, setPassengerEmail] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [selectedTourId, setSelectedTourId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [branchId, setBranchId] = useState('1');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Load tours & customers in real-time
  useEffect(() => {
    // 1. Sync tours
    const unsubTours = onSnapshot(collection(db, 'experiences'), (snap) => {
      const list = snap.docs.map(docSnap => docSnap.data() as Tour);
      setTours(list);
    });

    // 2. Sync crm_customers
    const unsubCustomers = onSnapshot(collection(db, 'crm_customers'), (snap) => {
      const list = snap.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          displayName: data.displayName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Cliente',
          email: data.email || '',
          phone: data.phone || ''
        };
      });
      setCustomers(list);
      setLoading(false);
    }, () => {
      setLoading(false);
    });

    return () => {
      unsubTours();
      unsubCustomers();
    };
  }, []);

  // Autofill passenger info when a CRM customer is selected
  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    const cust = customers.find(c => c.id === id);
    if (cust) {
      setPassengerName(cust.displayName);
      setPassengerEmail(cust.email);
      setPassengerPhone(cust.phone);
    } else {
      setPassengerName('');
      setPassengerEmail('');
      setPassengerPhone('');
    }
  };

  const selectedTour = tours.find(t => t.id === selectedTourId);
  const tourPrice = selectedTour ? selectedTour.price : 0;
  const tourCurrency = selectedTour ? selectedTour.currency : 'ARS';
  const totalPrice = tourPrice * Number(quantity);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passengerName || !selectedTourId || !quantity) return;

    setSaving(true);
    try {
      const branchName = branchId === '2' ? 'Sucursal Pilar' : branchId === '3' ? 'Sucursal Tucumán' : 'Sucursal Retiro';

      const payload = {
        tourId: selectedTourId,
        tourTitle: selectedTour ? selectedTour.title : 'Tour Especial',
        nombrePasajero: passengerName,
        emailPasajero: passengerEmail,
        telefonoPasajero: passengerPhone,
        cantidadPersonas: Number(quantity),
        estado: 'Pendiente',
        branchId,
        branchName,
        amount: totalPrice,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'experience_reservations'), payload);

      setSuccess(true);
      setSelectedCustomerId('');
      setPassengerName('');
      setPassengerEmail('');
      setPassengerPhone('');
      setSelectedTourId('');
      setQuantity('1');
      setBranchId('1');
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error("Error creating reservation:", err);
      alert("Error al registrar la reserva.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50 space-y-6">
      
      {/* Back */}
      <Link href="/experiences" className="flex w-fit items-center gap-1.5 text-sm text-slate-500 hover:text-tech-blue transition-colors">
        <ArrowLeft className="h-4 w-4" /> Volver al Tablero
      </Link>

      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-tech-blue flex items-center gap-2">
            <Ticket className="h-7 w-7 text-green-500" />
            Crear Reserva
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 font-medium">Registrar venta de pasajes o canje de puntos de tours y excursiones de Concorde 360.</p>
        </div>
      </div>

      <div className="max-w-2xl">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs font-semibold flex flex-col items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-green-500" />
            Cargando base de tours y clientes...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-center gap-2.5 text-xs font-bold">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                ¡Reserva registrada con éxito! Aparecerá en el panel de control.
              </div>
            )}

            {/* Selector de Cliente Existente CRM */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                <User className="h-3.5 w-3.5" /> Buscar Cliente Existente (Opcional)
              </label>
              <select
                value={selectedCustomerId}
                onChange={e => handleSelectCustomer(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none bg-white focus:border-tech-blue font-medium"
              >
                <option value="">-- Ingresar datos manualmente --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.displayName} ({c.email})</option>
                ))}
              </select>
            </div>

            {/* Datos Personales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nombre Completo Pasajero *</label>
                <input
                  type="text"
                  required
                  value={passengerName}
                  onChange={e => setPassengerName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Email Pasajero *</label>
                <input
                  type="email"
                  required
                  value={passengerEmail}
                  onChange={e => setPassengerEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                  placeholder="juan@correo.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Teléfono Pasajero</label>
                <input
                  type="text"
                  value={passengerPhone}
                  onChange={e => setPassengerPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                  placeholder="+54 9 381..."
                />
              </div>
            </div>

            {/* Configuración de Reserva */}
            <div className="border-t border-slate-100 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1">Seleccionar Tour / Destino *</label>
                <select
                  required
                  value={selectedTourId}
                  onChange={e => setSelectedTourId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none bg-white focus:border-tech-blue"
                >
                  <option value="">Seleccionar Tour</option>
                  {tours.map(t => (
                    <option key={t.id} value={t.id}>{t.title} ({t.location})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Cantidad Pasajeros *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                />
              </div>
            </div>

            {/* Sucursal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <Landmark className="h-3.5 w-3.5" /> Asignar Sucursal Venta
                </label>
                <select
                  value={branchId}
                  onChange={e => setBranchId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none bg-white focus:border-tech-blue"
                >
                  <option value="1">Sucursal Retiro</option>
                  <option value="2">Sucursal Pilar</option>
                  <option value="3">Sucursal Tucumán</option>
                </select>
              </div>

              {/* Total Calculation */}
              {selectedTour && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Monto Estimado</p>
                  <p className="text-xl font-black text-tech-blue mt-1">
                    {tourCurrency === 'USD' ? 'U$S' : '$'} {totalPrice.toLocaleString('es-AR')}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Precio base: {tourCurrency === 'USD' ? 'U$S' : '$'} {tourPrice} x {quantity}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-tech-blue px-6 py-2.5 text-xs font-bold text-white hover:bg-tech-blue/90 shadow-md transition-all active:scale-[0.98]"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Guardando...' : 'Crear Reserva'}
              </button>
            </div>
          </form>
        )}
      </div>

    </div>
  );
}
