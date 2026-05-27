"use client";

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, DollarSign, Users, AlertCircle, CheckCircle, CreditCard, Banknote, HelpCircle, RefreshCw } from 'lucide-react';
import { collection, onSnapshot, doc, addDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ARCTariff, MUTariff, VehicleCategory } from '@/types/logistics';
import { GoogleAddressAutocomplete } from './GoogleAddressAutocomplete';

const DEFAULT_MU_TARIFF: MUTariff = {
  id: 'mu-base',
  name: 'Tarifario MU Estándar Base',
  category: 'estandar',
  baseFare: 1200,          // ARS bajada de bandera
  pricePerKm: 480,         // ARS por kilómetro
  minimumFare: 2800,       // Tarifa mínima
  waitMinutePrice: 180,
  courtesyTimeMinutes: 5,
  travelMinutePrice: 120,   // ARS por minuto de viaje
  iva: 21,
  iibb: 3.5,
  taxMunicipal: 1.5,
  electronicPaymentFee: 5,
  commissionRate: 15,
  weeklyMembership: 5000,
};

const DEFAULT_VIP_TARIFF: MUTariff = {
  id: 'mu-vip',
  name: 'Tarifario MU VIP Base',
  category: 'vip',
  baseFare: 1800,          
  pricePerKm: 650,         
  minimumFare: 3800,       
  waitMinutePrice: 220,
  courtesyTimeMinutes: 5,
  travelMinutePrice: 150,   
  iva: 21,
  iibb: 3.5,
  taxMunicipal: 1.5,
  electronicPaymentFee: 5,
  commissionRate: 15,
  weeklyMembership: 5000,
};

const MOCK_ARC_TARIFF: ARCTariff = {
  id: 'arc-base',
  name: 'Tarifario ARC Rural Base',
  category: 'estandar',
  iva: 21,
  iibb: 3.5,
  taxMunicipal: 1.5,
  electronicPaymentFee: 5,
  commissionRate: 15,
  weeklyMembership: 5000,
  routes: [
    { id: 'r1', mainOrigin: 'CABA', mainDestination: 'Ezeiza', pricePerSeat: 15000 },
    { id: 'r2', mainOrigin: 'CABA', mainDestination: 'Pilar', pricePerSeat: 12000 },
    { id: 'r3', mainOrigin: 'Pilar', mainDestination: 'Ezeiza', pricePerSeat: 18000 },
  ],
};

interface UnifiedDispatcherProps {
  onCoordsChange?: (coords: {
    originCoords: { lat: number; lng: number } | null;
    destinationCoords: { lat: number; lng: number } | null;
  }) => void;
}

export const UnifiedDispatcher: React.FC<UnifiedDispatcherProps> = ({ onCoordsChange }) => {
  const [serviceType, setServiceType] = useState<'MU' | 'ARC'>('MU');
  
  // Dynamic collections from Firestore
  const [activeMuTariffs, setActiveMuTariffs] = useState<MUTariff[]>([]);
  const [activeArcTariffs, setActiveArcTariffs] = useState<ARCTariff[]>([]);
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [selectedTariffId, setSelectedTariffId] = useState<string>('');
  
  // Loading states
  const [isLoadingTariffs, setIsLoadingTariffs] = useState(true);

  // Form State
  const [passengerType, setPassengerType] = useState<'Usuario' | 'Invitado'>('Usuario');
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Tarjeta' | 'Billetera Virtual'>('Efectivo');
  
  // ARC specific
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [arcPickupAddress, setArcPickupAddress] = useState('');
  const [arcPickupCoords, setArcPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [seats, setSeats] = useState(1);
  
  // MU specific
  const [muOriginAddress, setMuOriginAddress] = useState('');
  const [muOriginCoords, setMuOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [muDestAddress, setMuDestAddress] = useState('');
  const [muDestCoords, setMuDestCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [driverAssignment, setDriverAssignment] = useState<'Auto' | 'Manual'>('Auto');

  // Route calculation outputs
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [durationMin, setDurationMin] = useState<number>(0);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);

  // Escuchar categorías y tarifas activas en tiempo real
  useEffect(() => {
    // 1. Categorías
    const unsubCats = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as VehicleCategory);
      setCategories(list);
    }, (error) => {
      console.log('Error loading categories in Dispatcher:', error.message);
    });

    // 2. Tarifarios MU Activos
    const qMu = query(collection(db, 'tariffs'), where('type', '==', 'mu'), where('isActive', '==', true));
    const unsubMu = onSnapshot(qMu, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as MUTariff);
      setActiveMuTariffs(list);
      setIsLoadingTariffs(false);
    }, (error) => {
      console.log('Error loading active MU tariffs:', error.message);
      setIsLoadingTariffs(false);
    });

    // 3. Tarifarios ARC Activos
    const qArc = query(collection(db, 'tariffs'), where('type', '==', 'arc'), where('isActive', '==', true));
    const unsubArc = onSnapshot(qArc, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ARCTariff);
      setActiveArcTariffs(list);
    }, (error) => {
      console.log('Error loading active ARC tariffs:', error.message);
    });

    return () => {
      unsubCats();
      unsubMu();
      unsubArc();
    };
  }, []);

  // Notificar coordenadas de cotización para vista previa en el mapa
  useEffect(() => {
    if (onCoordsChange) {
      onCoordsChange({
        originCoords: muOriginCoords,
        destinationCoords: muDestCoords,
      });
    }
  }, [muOriginCoords, muDestCoords, onCoordsChange]);

  // Calcular ruta al tener Origen y Destino en MU
  useEffect(() => {
    if (serviceType !== 'MU' || !muOriginCoords || !muDestCoords) {
      setDistanceKm(0);
      setDurationMin(0);
      return;
    }

    if (typeof window !== "undefined" && window.google) {
      setIsCalculatingRoute(true);
      const directionsService = new window.google.maps.DirectionsService();
      
      directionsService.route(
        {
          origin: muOriginCoords,
          destination: muDestCoords,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          setIsCalculatingRoute(false);
          if (status === window.google.maps.DirectionsStatus.OK && result) {
            const leg = result.routes[0].legs[0];
            const km = (leg.distance?.value || 0) / 1000;
            const mins = Math.round((leg.duration?.value || 0) / 60);
            
            setDistanceKm(Number(km.toFixed(1)));
            setDurationMin(mins);
          } else {
            console.error("Error calculando ruta para tarifas:", status);
          }
        }
      );
    }
  }, [serviceType, muOriginCoords, muDestCoords]);

  // Fallbacks locales si Firestore no tiene registros activos
  const muTariffsList = activeMuTariffs.length > 0 ? activeMuTariffs : [DEFAULT_MU_TARIFF, DEFAULT_VIP_TARIFF];
  const arcTariffsList = activeArcTariffs.length > 0 ? activeArcTariffs : [MOCK_ARC_TARIFF];

  // Auto-seleccionar primer tarifario si el actual no es válido
  useEffect(() => {
    if (serviceType === 'MU') {
      if (!selectedTariffId || !muTariffsList.some(t => t.id === selectedTariffId)) {
        setSelectedTariffId(muTariffsList[0]?.id || '');
      }
    } else {
      if (!selectedTariffId || !arcTariffsList.some(t => t.id === selectedTariffId)) {
        setSelectedTariffId(arcTariffsList[0]?.id || '');
      }
    }
  }, [serviceType, activeMuTariffs, activeArcTariffs]);

  // Tarifario seleccionado
  const currentTariff = serviceType === 'MU' 
    ? muTariffsList.find(t => t.id === selectedTariffId) || muTariffsList[0]
    : arcTariffsList.find(t => t.id === selectedTariffId) || arcTariffsList[0];

  // Función para calcular precios de cualquier tarifario MU/ARC dado
  const calculateTariffDetails = (tariff: any) => {
    let base = 0;
    const ivaPercent = tariff?.iva ?? 21;
    const iibbPercent = tariff?.iibb ?? 3.5;
    const taxMunicipalPercent = tariff?.taxMunicipal ?? 1.5;
    const electronicFeePercent = tariff?.electronicPaymentFee ?? 5;
    const commissionPercent = tariff?.commissionRate ?? 15;

    if (serviceType === 'ARC') {
      const selectedRoute = tariff?.routes?.find((r: any) => r.id === selectedRouteId);
      base = selectedRoute ? selectedRoute.pricePerSeat * seats : 0;
    } else {
      if (distanceKm > 0 && tariff) {
        const calculatedFare = 
          tariff.baseFare + 
          (tariff.pricePerKm * distanceKm) + 
          (tariff.travelMinutePrice * durationMin);
          
        base = Math.max(tariff.minimumFare, Math.round(calculatedFare));
      }
    }

    const ivaAmt = base * (ivaPercent / 100);
    const iibbAmt = base * (iibbPercent / 100);
    const taxMunAmt = base * (taxMunicipalPercent / 100);
    const totalTax = ivaAmt + iibbAmt + taxMunAmt;
    
    const subt = base + totalTax;
    const elecBack = subt * (electronicFeePercent / 100);
    
    const cash = Math.round(subt);
    const elec = Math.round(subt + elecBack);
    
    const platformComm = base * (commissionPercent / 100);
    const driverNet = base - platformComm;

    return {
      basePrice: base,
      ivaAmount: ivaAmt,
      iibbAmount: iibbAmt,
      taxMunicipalAmount: taxMunAmt,
      totalTaxes: totalTax,
      subtotal: subt,
      electronicFeeAmount: elecBack,
      cashTotal: cash,
      electronicTotal: elec,
      commissionAmount: platformComm,
      driverNetEarnings: driverNet
    };
  };

  // Detalle financiero de la opción activa seleccionada
  const financial = calculateTariffDetails(currentTariff);

  // Obtener nombre de la categoría
  const getCategoryLabel = (catId: string) => {
    const found = categories.find(c => c.id === catId);
    return found ? found.name : catId.charAt(0).toUpperCase() + catId.slice(1);
  };

  // Despachar el Viaje y guardar en Firestore
  const handleDispatch = async () => {
    if (!passengerName.trim()) {
      alert("Por favor ingresa el nombre del pasajero.");
      return;
    }

    if (serviceType === 'ARC') {
      if (!selectedRouteId || !arcPickupAddress || !arcPickupCoords) {
        alert("Por favor completa la ruta, la dirección y coordenadas de recogida.");
        return;
      }
    } else {
      if (!muOriginAddress || !muDestAddress || !muOriginCoords || !muDestCoords) {
        alert("Por favor selecciona un origen y destino válidos.");
        return;
      }
    }

    setIsDispatching(true);
    try {
      const selectedRoute = serviceType === 'ARC' 
        ? (currentTariff as ARCTariff).routes.find(r => r.id === selectedRouteId)
        : null;

      const finalPrice = paymentMethod === 'Efectivo' ? financial.cashTotal : financial.electronicTotal;

      const tripData = {
        passengerName,
        passengerPhone: passengerType === 'Invitado' ? passengerPhone : 'Buscar en base de usuarios',
        origin: serviceType === 'ARC' ? arcPickupAddress : muOriginAddress,
        destination: serviceType === 'ARC' ? `${selectedRoute?.mainOrigin} ➔ ${selectedRoute?.mainDestination}` : muDestAddress,
        originCoords: serviceType === 'ARC' ? arcPickupCoords : muOriginCoords,
        destinationCoords: serviceType === 'ARC' 
          ? { lat: arcPickupCoords!.lat + 0.05, lng: arcPickupCoords!.lng + 0.05 } 
          : muDestCoords,
        status: 'Buscando Chofer',
        price: finalPrice,
        distanceKm: serviceType === 'MU' ? distanceKm : 15.5, 
        durationMinutes: serviceType === 'MU' ? durationMin : 25,
        serviceType,
        paymentMethod,
        category: currentTariff?.category || 'estandar',
        createdAt: Date.now(),
      };

      await addDoc(collection(db, 'trips'), tripData);
      
      // Limpiar Formulario
      setPassengerName('');
      setPassengerPhone('');
      setSelectedRouteId('');
      setArcPickupAddress('');
      setArcPickupCoords(null);
      setMuOriginAddress('');
      setMuOriginCoords(null);
      setMuDestAddress('');
      setMuDestCoords(null);
      
      alert("Viaje creado correctamente en Firebase y despachado a la flota.");
    } catch (error: any) {
      console.error("Error al despachar el viaje:", error);
      alert("Hubo un error al guardar el viaje: " + error.message);
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-slate-50 p-6 overflow-y-auto custom-scrollbar">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-tech-blue flex items-center">
          <Navigation className="mr-2 h-6 w-6 text-vial-orange" />
          Despachador Maestro
        </h2>
      </div>

      {/* Tipo de Servicio Switch */}
      <div className="mb-6 flex rounded-xl bg-white p-1 border border-slate-200 shadow-sm">
        <button
          onClick={() => {
            setServiceType('MU');
            setSelectedTariffId('');
          }}
          className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
            serviceType === 'MU' 
              ? 'bg-tech-blue text-white shadow' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Movilidad Urbana (MU)
        </button>
        <button
          onClick={() => {
            setServiceType('ARC');
            setSelectedTariffId('');
          }}
          className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
            serviceType === 'ARC' 
              ? 'bg-vial-orange text-gray-950 shadow' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Auto Rural Compartido (ARC)
        </button>
      </div>

      {/* Formulario de Asignación */}
      <div className="space-y-5 flex-1">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Tipo de Pasajero</label>
          <div className="flex rounded-lg bg-slate-100 p-1 mb-3">
            <button
              onClick={() => setPassengerType('Usuario')}
              className={`flex-1 rounded py-1.5 text-xs font-bold transition-colors ${
                passengerType === 'Usuario' ? 'bg-white text-tech-blue shadow' : 'text-slate-500'
              }`}
            >
              Usuario Registrado
            </button>
            <button
              onClick={() => setPassengerType('Invitado')}
              className={`flex-1 rounded py-1.5 text-xs font-bold transition-colors ${
                passengerType === 'Invitado' ? 'bg-white text-tech-blue shadow' : 'text-slate-500'
              }`}
            >
              Invitado / Eventual
            </button>
          </div>

          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Nombre del Pasajero / Grupo</label>
          <input 
            type="text" 
            placeholder={passengerType === 'Usuario' ? "Buscar usuario corporativo..." : "Escribe el nombre del pasajero..."}
            value={passengerName}
            onChange={(e) => setPassengerName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-tech-blue placeholder-slate-400 focus:border-vial-orange focus:outline-none focus:ring-2 focus:ring-vial-orange/15 mb-3"
          />

          {passengerType === 'Invitado' && (
            <div className="mb-3">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Teléfono de Contacto</label>
              <input 
                type="tel" 
                placeholder="Ej. +54 9 11 1234-5678"
                value={passengerPhone}
                onChange={(e) => setPassengerPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-tech-blue placeholder-slate-400 focus:border-vial-orange focus:outline-none focus:ring-2 focus:ring-vial-orange/15"
              />
            </div>
          )}

          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Medio de Pago Obligatorio</label>
          <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-xl border border-slate-200 mb-3">
            <button
              onClick={() => setPaymentMethod('Efectivo')}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                paymentMethod === 'Efectivo' ? 'bg-white text-tech-blue shadow border border-slate-200/50' : 'text-slate-500'
              }`}
            >
              Efectivo
            </button>
            <button
              onClick={() => setPaymentMethod('Billetera Virtual')}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                paymentMethod === 'Billetera Virtual' ? 'bg-white text-tech-blue shadow border border-slate-200/50' : 'text-slate-500'
              }`}
            >
              Billetera
            </button>
            <button
              onClick={() => setPaymentMethod('Tarjeta')}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                paymentMethod === 'Tarjeta' ? 'bg-white text-tech-blue shadow border border-slate-200/50' : 'text-slate-500'
              }`}
            >
              Tarjeta
            </button>
          </div>
        </div>

        {serviceType === 'ARC' ? (
          <>
            {/* Lógica ARC Dinámica */}
            <div className="rounded-2xl border border-vial-orange/20 bg-vial-orange/5 p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Ruta Troncal ARC</label>
                <select 
                  value={selectedRouteId}
                  onChange={(e) => setSelectedRouteId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-tech-blue focus:border-vial-orange focus:outline-none focus:ring-2 focus:ring-vial-orange/15"
                >
                  <option value="">Seleccione una ruta troncal...</option>
                  {(currentTariff as ARCTariff)?.routes?.map((r: any) => (
                    <option key={r.id} value={r.id}>{r.mainOrigin} ➔ {r.mainDestination} (${r.pricePerSeat.toLocaleString('es-AR')}/asiento)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Dirección de Recogida Exacta (Google Places)</label>
                <div className="relative">
                  <GoogleAddressAutocomplete
                    value={arcPickupAddress}
                    onChange={setArcPickupAddress}
                    onSelect={(addr, coords) => {
                      setArcPickupAddress(addr);
                      setArcPickupCoords(coords);
                    }}
                    placeholder="Calle, Número, Localidad de origen..."
                  />
                </div>
              </div>
            </div>

            {/* Asignación de Cupos */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Asientos a Reservar</label>
              <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-slate-200">
                <Users className="h-5 w-5 text-slate-500" />
                <input 
                  type="number" 
                  min="1"
                  max="8"
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                  className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold text-tech-blue focus:outline-none"
                />
                <span className="text-xs text-slate-500 font-semibold">Máximo 8 asientos</span>
              </div>
            </div>
          </>
        ) : (
          /* Lógica MU Clásica con Google Maps Autocomplete */
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4 shadow-sm">
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Origen del Viaje</label>
                <GoogleAddressAutocomplete
                  value={muOriginAddress}
                  onChange={setMuOriginAddress}
                  onSelect={(addr, coords) => {
                    setMuOriginAddress(addr);
                    setMuOriginCoords(coords);
                  }}
                  placeholder="¿Dónde buscamos al pasajero?"
                />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Destino Final</label>
                <GoogleAddressAutocomplete
                  value={muDestAddress}
                  onChange={setMuDestAddress}
                  onSelect={(addr, coords) => {
                    setMuDestAddress(addr);
                    setMuDestCoords(coords);
                  }}
                  placeholder="¿A dónde se dirige?"
                />
             </div>

             {/* Ruteo Indicador */}
             {distanceKm > 0 && (
               <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
                 <span className="flex items-center">
                   <Navigation className="h-4 w-4 text-vial-orange mr-1.5 rotate-45" />
                   Distancia Estimada:
                 </span>
                 <span className="text-tech-blue">{distanceKm} KM ({durationMin} min)</span>
               </div>
             )}

             {isCalculatingRoute && (
               <div className="text-center text-xs font-semibold text-slate-400 py-1 flex justify-center items-center gap-2">
                 <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"></div>
                 Calculando ruta óptima con Google Maps...
               </div>
             )}

             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Asignación de Unidad</label>
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setDriverAssignment('Auto')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                      driverAssignment === 'Auto' ? 'bg-white text-tech-blue shadow border border-slate-200/50' : 'text-slate-500'
                    }`}
                  >
                    Automática Inteligente
                  </button>
                  <button
                    onClick={() => setDriverAssignment('Manual')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                      driverAssignment === 'Manual' ? 'bg-white text-tech-blue shadow border border-slate-200/50' : 'text-slate-500'
                    }`}
                  >
                    Manual Forzada
                  </button>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* SECCIÓN DE TARJETAS DE CATEGORÍAS (TIPO UBER/DIDI) */}
      {(serviceType === 'MU' && distanceKm > 0) || (serviceType === 'ARC' && selectedRouteId) ? (
        <div className="mt-6">
          <label className="block text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-2.5">
            Categorías y Tarifas Disponibles
          </label>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2">
            {(serviceType === 'MU' ? muTariffsList : arcTariffsList).map((tariff) => {
              const details = calculateTariffDetails(tariff);
              const isSelected = tariff.id === selectedTariffId;
              const displayPrice = paymentMethod === 'Efectivo' ? details.cashTotal : details.electronicTotal;
              
              return (
                <div
                  key={tariff.id}
                  onClick={() => setSelectedTariffId(tariff.id)}
                  className={`rounded-xl border p-4 cursor-pointer transition-all flex flex-col justify-between hover:shadow-md ${
                    isSelected 
                      ? 'border-vial-orange bg-vial-orange/5 ring-1 ring-vial-orange'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-sm text-tech-blue">{tariff.name}</h4>
                      <span className="inline-block mt-1 text-[9px] font-black uppercase bg-slate-200 text-slate-600 px-2 py-0.5 rounded">
                        {getCategoryLabel(tariff.category)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-extrabold text-slate-400 block uppercase">
                        {paymentMethod === 'Efectivo' ? 'EFECTIVO' : 'DIGITAL'}
                      </span>
                      <span className="text-base font-black text-vial-orange">
                        ${displayPrice.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 font-semibold mt-3 pt-2.5 border-t border-slate-100 flex justify-between">
                    <span>IVA: {tariff.iva}% | IIBB: {tariff.iibb}%</span>
                    <span>Plataforma: {tariff.commissionRate}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Desglose Financiero Expandido (Transparencia Total) */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-xs font-black uppercase text-tech-blue tracking-wider mb-4 flex items-center">
          <DollarSign className="mr-1.5 h-4 w-4 text-vial-orange" />
          Desglose Tarifario ({currentTariff?.name || 'Base'})
        </h3>
        
        <div className="space-y-2.5 text-xs font-semibold">
          <div className="flex justify-between text-slate-500">
            <span>Base / Subtotal Neto</span>
            <span>${financial.basePrice.toLocaleString('es-AR')}</span>
          </div>
          
          <div className="space-y-1 pl-3 border-l-2 border-slate-200">
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>IVA ({currentTariff?.iva ?? 21}%)</span>
              <span>+${Math.round(financial.ivaAmount).toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Ingresos Brutos ({currentTariff?.iibb ?? 3.5}%)</span>
              <span>+${Math.round(financial.iibbAmount).toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Tasas Municipales ({currentTariff?.taxMunicipal ?? 1.5}%)</span>
              <span>+${Math.round(financial.taxMunicipalAmount).toLocaleString('es-AR')}</span>
            </div>
          </div>

          <div className="flex justify-between text-slate-500 font-bold border-t border-slate-100 pt-2">
            <span>Subtotal Gravado</span>
            <span>${Math.round(financial.subtotal).toLocaleString('es-AR')}</span>
          </div>

          {paymentMethod !== 'Efectivo' && (
            <div className="flex justify-between text-slate-400 text-[11px] pl-3 border-l-2 border-slate-200">
              <span>Recargo Digital / Tarjeta ({currentTariff?.electronicPaymentFee ?? 5}%)</span>
              <span>+${Math.round(financial.electronicFeeAmount).toLocaleString('es-AR')}</span>
            </div>
          )}

          <div className="my-3 border-t border-slate-200"></div>
          
          {/* MÉTODOS DE PAGO Y COSTO FINAL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center text-green-600 mb-1">
                  <Banknote className="h-4 w-4 mr-1.5" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Monto a Cobrar</span>
                </div>
                <p className="text-xl font-black text-tech-blue">
                  ${(paymentMethod === 'Efectivo' ? financial.cashTotal : financial.electronicTotal).toLocaleString('es-AR')}
                </p>
                <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                  Método: {paymentMethod} {paymentMethod !== 'Efectivo' && `(recargo del ${currentTariff?.electronicPaymentFee ?? 5}% aplicado)`}
                </p>
              </div>
            </div>
            
            <div className="rounded-xl border border-blue-500/20 bg-tech-blue/5 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center text-tech-blue mb-1">
                  <CreditCard className="h-4 w-4 mr-1.5" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Caja Conductor y Margen</span>
                </div>
                <p className="text-xl font-black text-tech-blue">
                  ${Math.round(financial.driverNetEarnings).toLocaleString('es-AR')}
                </p>
                <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                  Ganancia Neta Chofer (Comisión Plataforma {currentTariff?.commissionRate ?? 15}%: -${Math.round(financial.commissionAmount)})
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button 
          onClick={handleDispatch}
          disabled={
            isDispatching || 
            (serviceType === 'ARC' && (!selectedRouteId || !arcPickupCoords || !passengerName)) ||
            (serviceType === 'MU' && (!muOriginCoords || !muDestCoords || !passengerName))
          }
          className="w-full flex items-center justify-center space-x-2 rounded-xl bg-vial-orange py-3.5 text-sm font-extrabold text-gray-950 hover:bg-[#ff7b1a] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-vial-orange/20 cursor-pointer"
        >
          {isDispatching ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent mr-2"></div>
          ) : (
            <CheckCircle className="h-5 w-5 mr-1" />
          )}
          <span>Confirmar y Despachar Viaje</span>
        </button>
      </div>
    </div>
  );
};
