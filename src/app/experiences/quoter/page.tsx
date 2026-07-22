'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Calculator, ArrowLeft, Plus, Save, Sparkles, CheckCircle2, Ticket, Palmtree, DollarSign, Percent } from 'lucide-react';
import { collection, setDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function ExperienceQuoterPage() {
  const router = useRouter();
  
  // Basic Trip Info
  const [tripTitle, setTripTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [tripType, setTripType] = useState<'Grupal' | 'Individual'>('Grupal');
  const [paxCount, setPaxCount] = useState<number>(10);
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');

  // Cost items breakdown
  const [transportCost, setTransportCost] = useState<number>(150000);
  const [accommodationCost, setAccommodationCost] = useState<number>(200000);
  const [coordinatorCost, setCoordinatorCost] = useState<number>(50000);
  const [insuranceCost, setInsuranceCost] = useState<number>(30000);
  const [extraCosts, setExtraCosts] = useState<number>(20000);

  // Financial Variables
  const [taxRatePct, setTaxRatePct] = useState<number>(21); // IVA 21%
  const [profitMarginPct, setProfitMarginPct] = useState<number>(30); // Margen 30%

  // Actions state
  const [savingCatalog, setSavingCatalog] = useState(false);
  const [savingReservation, setSavingReservation] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Calculations
  const totalBaseCosts = Number(transportCost || 0) + Number(accommodationCost || 0) + Number(coordinatorCost || 0) + Number(insuranceCost || 0) + Number(extraCosts || 0);
  const costPerPax = paxCount > 0 ? totalBaseCosts / paxCount : totalBaseCosts;

  const totalTaxes = Math.round(totalBaseCosts * (taxRatePct / 100));
  const totalSubtotalWithTax = totalBaseCosts + totalTaxes;

  const totalProfitMargin = Math.round(totalSubtotalWithTax * (profitMarginPct / 100));
  const totalPvpPrice = totalSubtotalWithTax + totalProfitMargin;

  const pvpPerPax = paxCount > 0 ? Math.round(totalPvpPrice / paxCount) : totalPvpPrice;

  // Save as catalog item
  const handleSaveToCatalog = async () => {
    if (!tripTitle || !destination) {
      alert('Por favor ingresá el título del viaje y el destino.');
      return;
    }

    setSavingCatalog(true);
    try {
      const tourId = `EXP-${Math.floor(100 + Math.random() * 900)}`;
      const payload = {
        id: tourId,
        title: tripTitle,
        location: destination,
        price: pvpPerPax,
        currency,
        priceRewards: Math.round(pvpPerPax * 0.8),
        pointsEarned: Math.round(pvpPerPax * 0.05),
        tripType,
        transportation: 'Transporte Privado',
        departureDate: '',
        departureOrigin: 'A convenir',
        services: ['Guía Profesional', 'Seguro de Viaje', 'Coordinación en Ruta'],
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800',
        description: `Viaje cotizado ad-hoc para ${paxCount} pasajeros a ${destination}.`,
        observations: `Cotización realizada con ${taxRatePct}% imp. y ${profitMarginPct}% margen.`,
        availability: 'Disponible',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'experiences', tourId), payload);
      setSuccessMsg(`¡Viaje guardado en el Catálogo de Experiencias! (ID: ${tourId})`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error saving to catalog:', err);
      alert('Error al guardar en el catálogo.');
    } finally {
      setSavingCatalog(false);
    }
  };

  // Generate direct reservation with File number
  const handleGenerateReservation = async () => {
    if (!tripTitle) {
      alert('Por favor ingresá el título del viaje cotizado.');
      return;
    }

    setSavingReservation(true);
    try {
      const fileNumber = `FILE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const payload = {
        fileNumber,
        tourId: 'CUSTOM-QUOTED',
        tourTitle: tripTitle,
        nombrePasajero: 'Reserva Cotización Ad-Hoc',
        emailPasajero: '',
        telefonoPasajero: '',
        cantidadPersonas: paxCount,
        estado: 'Pendiente',
        branchId: '1',
        branchName: 'Sucursal Retiro',
        amount: totalPvpPrice,
        currency,
        costBreakdown: {
          totalBaseCosts,
          totalTaxes,
          totalProfitMargin,
          pricePerPax: pvpPerPax
        },
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'experience_reservations'), payload);
      setSuccessMsg(`¡Reserva creada exitosamente con N° de Expediente: ${fileNumber}!`);
      setTimeout(() => {
        router.push('/experiences/reservations/new');
      }, 2000);
    } catch (err) {
      console.error('Error generating reservation:', err);
      alert('Error al generar la reserva.');
    } finally {
      setSavingReservation(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50 space-y-6">
      {/* Back link */}
      <Link href="/experiences" className="flex w-fit items-center gap-1.5 text-sm text-slate-500 hover:text-tech-blue transition-colors">
        <ArrowLeft className="h-4 w-4" /> Volver al Tablero de Experiencias
      </Link>

      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-tech-blue flex items-center gap-2">
            <Calculator className="h-7 w-7 text-green-500" />
            Cotizador de Viajes Propios
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            Calculadora inteligente de costos, impuestos (IVA) y margen de ganancia bruta para el PVP al público.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-2.5 text-sm font-bold shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Input Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Trip Info */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Palmtree className="h-4 w-4 text-tech-blue" />
              1. Datos Básicos de la Excursión / Viaje
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nombre o Nombre del Paquete *</label>
                <input
                  type="text"
                  value={tripTitle}
                  onChange={e => setTripTitle(e.target.value)}
                  placeholder="Ej: Tour Bariloche & Siete Lagos VIP"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-tech-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Destino Principal *</label>
                <input
                  type="text"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  placeholder="Ej: San Carlos de Bariloche, Rio Negro"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-tech-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tipo de Salida</label>
                <select
                  value={tripType}
                  onChange={e => setTripType(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none bg-white focus:border-tech-blue font-medium"
                >
                  <option value="Grupal">Grupal (Contingente)</option>
                  <option value="Individual">Individual (Pasajeros Ad-Hoc)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Cant. Pasajeros (PAX)</label>
                  <input
                    type="number"
                    min="1"
                    value={paxCount}
                    onChange={e => setPaxCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-tech-blue font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Moneda</label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none bg-white focus:border-tech-blue font-bold"
                  >
                    <option value="ARS">ARS ($)</option>
                    <option value="USD">USD (US$)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Base Costs Breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              2. Desglose de Costos Operativos Totales (Servicios)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Traslado / Chárter / Vuelos</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    value={transportCost}
                    onChange={e => setTransportCost(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-200 pl-7 pr-3 py-2 text-sm text-slate-800 outline-none focus:border-tech-blue font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Alojamiento &amp; Hotel</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    value={accommodationCost}
                    onChange={e => setAccommodationCost(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-200 pl-7 pr-3 py-2 text-sm text-slate-800 outline-none focus:border-tech-blue font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Guías &amp; Coordinadores</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    value={coordinatorCost}
                    onChange={e => setCoordinatorCost(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-200 pl-7 pr-3 py-2 text-sm text-slate-800 outline-none focus:border-tech-blue font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Seguros Médicos / Asistencia</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    value={insuranceCost}
                    onChange={e => setInsuranceCost(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-200 pl-7 pr-3 py-2 text-sm text-slate-800 outline-none focus:border-tech-blue font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Extras &amp; Excursiones</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    value={extraCosts}
                    onChange={e => setExtraCosts(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-200 pl-7 pr-3 py-2 text-sm text-slate-800 outline-none focus:border-tech-blue font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Taxes & Margins */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Percent className="h-4 w-4 text-purple-600" />
              3. Configuración de Impuestos y Margen Comercial
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <label className="block text-xs font-bold text-slate-700">Tasa de Impuestos / IVA (%)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taxRatePct}
                    onChange={e => setTaxRatePct(parseFloat(e.target.value) || 0)}
                    className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-base font-bold text-slate-800 outline-none focus:border-tech-blue text-center bg-white"
                  />
                  <span className="text-xs text-slate-500 font-medium">IVA / Cargas Turísticas</span>
                </div>
                <p className="text-[11px] text-slate-400">Total impuestos calculados: <strong className="text-slate-700">${totalTaxes.toLocaleString()} {currency}</strong></p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <label className="block text-xs font-bold text-slate-700">Margen de Ganancia Bruta (%)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={profitMarginPct}
                    onChange={e => setProfitMarginPct(parseFloat(e.target.value) || 0)}
                    className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-base font-bold text-emerald-700 outline-none focus:border-tech-blue text-center bg-white"
                  />
                  <span className="text-xs text-slate-500 font-medium">Ganancia Empresa</span>
                </div>
                <p className="text-[11px] text-slate-400">Margen bruto proyectado: <strong className="text-emerald-600">+${totalProfitMargin.toLocaleString()} {currency}</strong></p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Col: Live Summary Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-tech-blue text-white rounded-2xl p-6 shadow-xl sticky top-6 space-y-6">
            <div>
              <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider mb-2">
                Resultado de Cotización
              </span>
              <h3 className="text-lg font-black text-white">{tripTitle || 'Viaje en Cotización'}</h3>
              <p className="text-xs text-slate-300 mt-1">{destination || 'Destino por definir'} • {paxCount} PAX</p>
            </div>

            <div className="border-t border-white/10 pt-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Costo Base Operativo:</span>
                <span className="font-mono font-bold">${totalBaseCosts.toLocaleString()} {currency}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Impuestos ({taxRatePct}%):</span>
                <span className="font-mono font-bold text-purple-300">+${totalTaxes.toLocaleString()} {currency}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Margen Ganancia ({profitMarginPct}%):</span>
                <span className="font-mono font-bold text-emerald-400">+${totalProfitMargin.toLocaleString()} {currency}</span>
              </div>

              <div className="border-t border-white/20 pt-3 flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Precio Final PVP (Total)</p>
                  <p className="text-2xl font-black text-white font-mono">${totalPvpPrice.toLocaleString()}</p>
                </div>
                <span className="text-xs font-bold text-emerald-400 font-mono">{currency}</span>
              </div>

              <div className="bg-white/10 border border-white/10 rounded-xl p-3 flex justify-between items-center text-xs mt-3">
                <span className="text-slate-300 font-medium">PVP por Pasajero (PAX):</span>
                <span className="font-black text-emerald-300 font-mono text-base">${pvpPerPax.toLocaleString()} {currency}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleGenerateReservation}
                disabled={savingReservation}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Ticket className="h-4 w-4" />
                {savingReservation ? 'Generando Expediente...' : 'Generar Reserva (Crear File)'}
              </button>

              <button
                onClick={handleSaveToCatalog}
                disabled={savingCatalog}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Palmtree className="h-4 w-4 text-green-400" />
                {savingCatalog ? 'Guardando...' : 'Guardar en Catálogo Marketplace'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
