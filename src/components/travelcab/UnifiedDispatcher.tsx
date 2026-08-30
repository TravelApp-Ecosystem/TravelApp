"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Navigation, DollarSign, Users, AlertCircle, CheckCircle, CreditCard, Banknote, HelpCircle, RefreshCw, Building2, ArrowLeftRight, Plane, Car, Percent, ShieldCheck } from 'lucide-react';
import { collection, onSnapshot, doc, addDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ARCTariff, MUTariff, TransferTariff, VehicleCategory, Branch, ARCRoute, TransferRoute, TariffSpecialRate } from '@/types/logistics';
import { GoogleAddressAutocomplete } from './GoogleAddressAutocomplete';

const DAYS_OF_WEEK_SPANISH = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const getSpecialRateModifier = (specialRates?: TariffSpecialRate[], checkDate = new Date()) => {
  if (!specialRates || specialRates.length === 0) return { modifierPct: 0, appliedRate: null };

  const currentDayName = DAYS_OF_WEEK_SPANISH[checkDate.getDay()];
  const currentMinutes = checkDate.getHours() * 60 + checkDate.getMinutes();

  for (const rate of specialRates) {
    const days = rate.daysOfWeek || [];
    const dayMatches = days.includes('Todos los días') || days.includes(currentDayName);
    if (!dayMatches) continue;

    const [startH, startM] = (rate.startTime || '00:00').split(':').map(Number);
    const [endH, endM] = (rate.endTime || '23:59').split(':').map(Number);
    const startMin = (startH || 0) * 60 + (startM || 0);
    const endMin = (endH || 23) * 60 + (endM || 59);

    let timeMatches = false;
    if (startMin <= endMin) {
      timeMatches = currentMinutes >= startMin && currentMinutes <= endMin;
    } else {
      timeMatches = currentMinutes >= startMin || currentMinutes <= endMin;
    }

    if (timeMatches && rate.percentageModifier) {
      return { modifierPct: rate.percentageModifier, appliedRate: rate };
    }
  }

  return { modifierPct: 0, appliedRate: null };
};

interface UnifiedDispatcherProps {
  onCoordsChange?: (coords: {
    originCoords: { lat: number; lng: number } | null;
    destinationCoords: { lat: number; lng: number } | null;
  }) => void;
}

export const UnifiedDispatcher: React.FC<UnifiedDispatcherProps> = ({ onCoordsChange }) => {
  const [serviceType, setServiceType] = useState<'MU' | 'ARC' | 'TRANSFER'>('MU');
  
  // Dynamic collections from Firestore
  const [muTariffs, setMuTariffs] = useState<MUTariff[]>([]);
  const [arcTariffs, setArcTariffs] = useState<ARCTariff[]>([]);
  const [transferTariffs, setTransferTariffs] = useState<TransferTariff[]>([]);
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  
  // Selected Branch & Tariff
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [selectedTariffId, setSelectedTariffId] = useState<string>('');
  
  // Loading states
  const [isLoadingTariffs, setIsLoadingTariffs] = useState(true);

  // Form State
  const [passengerType, setPassengerType] = useState<'Usuario' | 'Invitado'>('Usuario');
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Tarjeta' | 'Billetera Virtual'>('Efectivo');
  
  // ARC specific (No Google Maps required)
  const [arcOrigin, setArcOrigin] = useState<string>('');
  const [arcDestination, setArcDestination] = useState<string>('');
  const [arcNotes, setArcNotes] = useState<string>('');
  const [seats, setSeats] = useState(1);

  // TRANSFER specific (No Google Maps required)
  const [transferOrigin, setTransferOrigin] = useState<string>('');
  const [transferDestination, setTransferDestination] = useState<string>('');
  const [transferNotes, setTransferNotes] = useState<string>('');
  
  // MU specific (Google Maps Autocomplete & Routing)
  const [muOriginAddress, setMuOriginAddress] = useState('');
  const [muOriginCoords, setMuOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [muDestAddress, setMuDestAddress] = useState('');
  const [muDestCoords, setMuDestCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [driverAssignment, setDriverAssignment] = useState<'Auto' | 'Manual'>('Auto');

  // Route calculation outputs for MU
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [durationMin, setDurationMin] = useState<number>(0);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);

  // 1. Escuchar Categorías, Tarifarios y Sucursales en tiempo real
  useEffect(() => {
    const unsubCats = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as VehicleCategory);
      setCategories(list);
    }, (error) => {
      console.error('Error loading categories in Dispatcher:', error);
    });

    const unsubTariffs = onSnapshot(collection(db, 'tariffs'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any);
      setMuTariffs(list.filter(t => t.type === 'mu' && t.id !== 'mu_active' && t.isActive));
      setArcTariffs(list.filter(t => (t.type === 'arc' || t.type === 'aci') && t.id !== 'arc_active' && t.isActive));
      setTransferTariffs(list.filter(t => t.type === 'transfers' && t.isActive));
      setIsLoadingTariffs(false);
    }, (error) => {
      console.error('Error loading active tariffs:', error);
      setIsLoadingTariffs(false);
    });

    const unsubBranches = onSnapshot(collection(db, 'branches'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Branch);
      setBranches(list.filter(b => b.active !== false));
    }, (error) => {
      console.error('Error loading branches in Dispatcher:', error);
    });

    return () => {
      unsubCats();
      unsubTariffs();
      unsubBranches();
    };
  }, []);

  // Notificar coordenadas de MU para vista previa en el mapa
  useEffect(() => {
    if (onCoordsChange) {
      onCoordsChange({
        originCoords: muOriginCoords,
        destinationCoords: muDestCoords,
      });
    }
  }, [muOriginCoords, muDestCoords, onCoordsChange]);

  // Calcular ruta al tener Origen y Destino en MU con Google Maps
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

  // Filtrar tarifas según la sucursal seleccionada
  const filteredMuTariffs = useMemo(() => {
    return muTariffs.filter(t => {
      if (selectedBranchId === 'all') return true;
      if (!t.branchIds || t.branchIds.length === 0 || t.branchIds.includes('all')) return true;
      return t.branchIds.includes(selectedBranchId);
    });
  }, [muTariffs, selectedBranchId]);

  const filteredArcTariffs = useMemo(() => {
    return arcTariffs.filter(t => {
      if (selectedBranchId === 'all') return true;
      if (!t.branchIds || t.branchIds.length === 0 || t.branchIds.includes('all')) return true;
      return t.branchIds.includes(selectedBranchId);
    });
  }, [arcTariffs, selectedBranchId]);

  const filteredTransferTariffs = useMemo(() => {
    return transferTariffs.filter(t => {
      if (selectedBranchId === 'all') return true;
      if (!t.branchIds || t.branchIds.length === 0 || t.branchIds.includes('all')) return true;
      return t.branchIds.includes(selectedBranchId);
    });
  }, [transferTariffs, selectedBranchId]);

  // Lista de Rutas Troncales ARC disponibles (directas e inversas)
  interface RouteOption {
    origin: string;
    destination: string;
    pricePerSeat: number;
    tariffId: string;
    category: string;
  }

  const arcRouteOptions = useMemo<RouteOption[]>(() => {
    const list: RouteOption[] = [];
    filteredArcTariffs.forEach(tariff => {
      tariff.routes?.forEach(r => {
        if (r.mainOrigin && r.mainDestination) {
          // Ruta directa
          list.push({
            origin: r.mainOrigin,
            destination: r.mainDestination,
            pricePerSeat: r.pricePerSeat,
            tariffId: tariff.id,
            category: tariff.category
          });
          // Ruta inversa si es bidireccional
          if (r.isBidirectional !== false) {
            list.push({
              origin: r.mainDestination,
              destination: r.mainOrigin,
              pricePerSeat: r.pricePerSeat,
              tariffId: tariff.id,
              category: tariff.category
            });
          }
        }
      });
    });
    return list;
  }, [filteredArcTariffs]);

  // Orígenes únicos ARC
  const arcAvailableOrigins = useMemo(() => {
    return Array.from(new Set(arcRouteOptions.map(r => r.origin)));
  }, [arcRouteOptions]);

  // Destinos ARC según origen seleccionado
  const arcAvailableDestinations = useMemo(() => {
    if (!arcOrigin) return [];
    return Array.from(new Set(arcRouteOptions.filter(r => r.origin === arcOrigin).map(r => r.destination)));
  }, [arcRouteOptions, arcOrigin]);

  // Lista de Rutas de Traslados disponibles
  interface TransferOption {
    origin: string;
    destination: string;
    fixedPrice: number;
    tariffId: string;
    category: string;
  }

  const transferRouteOptions = useMemo<TransferOption[]>(() => {
    const list: TransferOption[] = [];
    filteredTransferTariffs.forEach(tariff => {
      tariff.routes?.forEach(r => {
        if (r.originName && r.destinationName) {
          list.push({
            origin: r.originName,
            destination: r.destinationName,
            fixedPrice: r.fixedPrice,
            tariffId: tariff.id,
            category: tariff.category
          });
          if (r.isBidirectional !== false) {
            list.push({
              origin: r.destinationName,
              destination: r.originName,
              fixedPrice: r.fixedPrice,
              tariffId: tariff.id,
              category: tariff.category
            });
          }
        }
      });
    });
    return list;
  }, [filteredTransferTariffs]);

  // Orígenes únicos Traslados
  const transferAvailableOrigins = useMemo(() => {
    return Array.from(new Set(transferRouteOptions.map(r => r.origin)));
  }, [transferRouteOptions]);

  // Destinos Traslados según origen seleccionado
  const transferAvailableDestinations = useMemo(() => {
    if (!transferOrigin) return [];
    return Array.from(new Set(transferRouteOptions.filter(r => r.origin === transferOrigin).map(r => r.destination)));
  }, [transferRouteOptions, transferOrigin]);

  // Auto-seleccionar tarifa activa
  useEffect(() => {
    if (serviceType === 'MU') {
      if (!selectedTariffId || !filteredMuTariffs.some(t => t.id === selectedTariffId)) {
        setSelectedTariffId(filteredMuTariffs[0]?.id || '');
      }
    } else if (serviceType === 'ARC') {
      if (arcOrigin && arcDestination) {
        const match = arcRouteOptions.find(r => r.origin === arcOrigin && r.destination === arcDestination);
        if (match) setSelectedTariffId(match.tariffId);
      }
    } else if (serviceType === 'TRANSFER') {
      if (transferOrigin && transferDestination) {
        const match = transferRouteOptions.find(r => r.origin === transferOrigin && r.destination === transferDestination);
        if (match) setSelectedTariffId(match.tariffId);
      }
    }
  }, [serviceType, filteredMuTariffs, arcOrigin, arcDestination, transferOrigin, transferDestination, arcRouteOptions, transferRouteOptions]);

  // Tarifario actualmente seleccionado
  const currentTariff = useMemo(() => {
    if (serviceType === 'MU') {
      return filteredMuTariffs.find(t => t.id === selectedTariffId) || filteredMuTariffs[0];
    } else if (serviceType === 'ARC') {
      return filteredArcTariffs.find(t => t.id === selectedTariffId) || filteredArcTariffs[0];
    } else {
      return filteredTransferTariffs.find(t => t.id === selectedTariffId) || filteredTransferTariffs[0];
    }
  }, [serviceType, selectedTariffId, filteredMuTariffs, filteredArcTariffs, filteredTransferTariffs]);

  // CÁLCULO FINANCIERO CON IMPUESTOS SOBRE LA COMISIÓN
  const calculateTariffDetails = (tariff: any) => {
    let base = 0;
    const commissionPercent = tariff?.commissionRate ?? 15;
    const ivaPercent = tariff?.iva ?? 21;
    const iibbPercent = tariff?.iibb ?? 3.5;
    const taxMunicipalPercent = tariff?.taxMunicipal ?? 1.5;
    const electronicFeePercent = tariff?.electronicPaymentFee ?? 5;

    if (serviceType === 'ARC') {
      const match = arcRouteOptions.find(r => r.tariffId === tariff?.id && r.origin === arcOrigin && r.destination === arcDestination);
      base = match ? match.pricePerSeat * seats : 0;
    } else if (serviceType === 'TRANSFER') {
      const match = transferRouteOptions.find(r => r.tariffId === tariff?.id && r.origin === transferOrigin && r.destination === transferDestination);
      base = match ? match.fixedPrice : 0;
    } else {
      // Movilidad Urbana (MU)
      if (distanceKm > 0 && tariff) {
        const calculatedFare = 
          (tariff.baseFare || 0) + 
          ((tariff.pricePerKm || 0) * distanceKm) + 
          ((tariff.travelMinutePrice || 0) * durationMin);
          
        base = Math.max(tariff.minimumFare || 0, Math.round(calculatedFare));
      }
    }

    // APLICAR TARIFA ESPECIAL (DÍAS Y HORARIOS ESPECÍFICOS) SOBRE EL CÁLCULO TOTAL DEL VIAJE
    const { modifierPct, appliedRate } = getSpecialRateModifier(tariff?.specialRates);
    const unadjustedBase = base;
    if (base > 0 && modifierPct !== 0) {
      base = Math.round(base * (1 + modifierPct / 100));
    }

    // Comisión de la plataforma sobre el valor total del viaje (ya con tarifa especial aplicada)
    const platformCommission = base * (commissionPercent / 100);

    // Impuestos calculados como PORCENTAJE SOBRE LA COMISIÓN de la plataforma
    const ivaAmt = platformCommission * (ivaPercent / 100);
    const iibbAmt = platformCommission * (iibbPercent / 100);
    const taxMunAmt = platformCommission * (taxMunicipalPercent / 100);
    const totalTaxesOnCommission = ivaAmt + iibbAmt + taxMunAmt;

    // Recargo electrónico sobre el precio final si aplica
    const electronicFeeAmt = paymentMethod !== 'Efectivo' ? base * (electronicFeePercent / 100) : 0;
    const finalPassengerPrice = Math.round(base + electronicFeeAmt);
    const driverNetEarnings = Math.round(base - platformCommission);

    return {
      unadjustedBasePrice: unadjustedBase,
      basePrice: base,
      specialRateModifierPct: modifierPct,
      appliedSpecialRate: appliedRate,
      commissionAmount: platformCommission,
      ivaAmount: ivaAmt,
      iibbAmount: iibbAmt,
      taxMunicipalAmount: taxMunAmt,
      totalTaxesOnCommission,
      electronicFeeAmount: electronicFeeAmt,
      finalPassengerPrice,
      driverNetEarnings
    };
  };

  const financial = calculateTariffDetails(currentTariff);

  const getCategoryLabel = (catId?: string) => {
    if (!catId) return 'Estándar';
    const found = categories.find(c => c.id === catId);
    return found ? found.name : catId.charAt(0).toUpperCase() + catId.slice(1);
  };

  // Despachar el Viaje y guardar en Firestore
  const handleDispatch = async () => {
    if (!passengerName.trim()) {
      alert("Por favor ingresa el nombre del pasajero.");
      return;
    }

    let originText = '';
    let destinationText = '';
    let originCoordinates = null;
    let destinationCoordinates = null;

    if (serviceType === 'ARC') {
      if (!arcOrigin || !arcDestination) {
        alert("Por favor selecciona el origen y el destino del tramo troncal ARC.");
        return;
      }
      originText = `${arcOrigin} ${arcNotes ? `(${arcNotes})` : ''}`;
      destinationText = arcDestination;
    } else if (serviceType === 'TRANSFER') {
      if (!transferOrigin || !transferDestination) {
        alert("Por favor selecciona el punto de origen y destino del traslado.");
        return;
      }
      originText = `${transferOrigin} ${transferNotes ? `(${transferNotes})` : ''}`;
      destinationText = transferDestination;
    } else {
      if (!muOriginAddress || !muDestAddress || !muOriginCoords || !muDestCoords) {
        alert("Por favor selecciona un origen y destino válidos en el mapa.");
        return;
      }
      originText = muOriginAddress;
      destinationText = muDestAddress;
      originCoordinates = muOriginCoords;
      destinationCoordinates = muDestCoords;
    }

    if (financial.basePrice <= 0) {
      alert("El precio cotizado no es válido. Revisa los datos del viaje.");
      return;
    }

    setIsDispatching(true);
    try {
      const tripData = {
        passengerName: passengerName.trim(),
        passengerPhone: passengerPhone.trim() || (passengerType === 'Usuario' ? 'Registrado' : 'No informado'),
        origin: originText,
        destination: destinationText,
        originCoords: originCoordinates,
        destinationCoords: destinationCoordinates,
        status: 'Buscando Chofer',
        price: financial.finalPassengerPrice,
        basePrice: financial.basePrice,
        platformCommission: financial.commissionAmount,
        driverNetEarnings: financial.driverNetEarnings,
        distanceKm: serviceType === 'MU' ? distanceKm : 0,
        durationMinutes: serviceType === 'MU' ? durationMin : 0,
        seats: serviceType === 'ARC' ? seats : 1,
        serviceType,
        paymentMethod,
        category: currentTariff?.category || 'estandar',
        branchId: selectedBranchId,
        tariffId: currentTariff?.id || '',
        tariffName: currentTariff?.name || '',
        createdAt: Date.now(),
      };

      await addDoc(collection(db, 'trips'), tripData);
      
      // Limpiar formulario
      setPassengerName('');
      setPassengerPhone('');
      setArcNotes('');
      setTransferNotes('');
      setMuOriginAddress('');
      setMuOriginCoords(null);
      setMuDestAddress('');
      setMuDestCoords(null);
      
      alert("¡Viaje creado exitosamente en Firestore y despachado a la flota de choferes!");
    } catch (error: any) {
      console.error("Error al despachar el viaje:", error);
      alert("Hubo un error al despachar el viaje: " + error.message);
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-slate-50 p-6 overflow-y-auto custom-scrollbar">
      
      {/* Encabezado y Selector de Sucursal */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-tech-blue flex items-center">
            <Navigation className="mr-2 h-6 w-6 text-vial-orange" />
            Despachador Maestro
          </h2>
          <p className="text-xs text-slate-500">Cotización y despacho directo para flota urbana, rural y traslados.</p>
        </div>

        {/* Selector de Sucursal Operativa */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
          <Building2 className="h-4 w-4 text-vial-orange flex-shrink-0" />
          <span className="text-xs font-bold text-slate-500">Sucursal:</span>
          <select 
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="text-xs font-black text-tech-blue bg-transparent outline-none cursor-pointer"
          >
            <option value="all">🌐 Todas las Sucursales</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>📍 {b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Selector de Tipo de Servicio */}
      <div className="mb-6 flex rounded-2xl bg-white p-1.5 border border-slate-200 shadow-sm gap-1.5">
        <button
          onClick={() => setServiceType('MU')}
          className={`flex-1 rounded-xl py-2.5 text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            serviceType === 'MU' 
              ? 'bg-tech-blue text-white shadow-md' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Car className="h-4 w-4" />
          Movilidad Urbana (MU)
        </button>
        <button
          onClick={() => setServiceType('ARC')}
          className={`flex-1 rounded-xl py-2.5 text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            serviceType === 'ARC' 
              ? 'bg-vial-orange text-gray-950 shadow-md' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="h-4 w-4" />
          Rural Troncal (ARC)
        </button>
        <button
          onClick={() => setServiceType('TRANSFER')}
          className={`flex-1 rounded-xl py-2.5 text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            serviceType === 'TRANSFER' 
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Plane className="h-4 w-4" />
          Traslados Fijos
        </button>
      </div>

      {/* Datos del Pasajero y Pago */}
      <div className="space-y-4 flex-1">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pasajero</label>
            <div className="flex rounded-lg bg-slate-100 p-0.5">
              <button
                onClick={() => setPassengerType('Usuario')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                  passengerType === 'Usuario' ? 'bg-white text-tech-blue shadow-xs' : 'text-slate-400'
                }`}
              >
                Registrado
              </button>
              <button
                onClick={() => setPassengerType('Invitado')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                  passengerType === 'Invitado' ? 'bg-white text-tech-blue shadow-xs' : 'text-slate-400'
                }`}
              >
                Invitado
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input 
              type="text" 
              placeholder="Nombre del pasajero..."
              value={passengerName}
              onChange={(e) => setPassengerName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-tech-blue placeholder-slate-400 focus:border-vial-orange focus:outline-none"
            />
            <input 
              type="tel" 
              placeholder="Teléfono / WhatsApp..."
              value={passengerPhone}
              onChange={(e) => setPassengerPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-tech-blue placeholder-slate-400 focus:border-vial-orange focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Medio de Pago</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Efectivo', 'Billetera Virtual', 'Tarjeta'] as const).map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 rounded-xl text-xs font-extrabold transition-all border ${
                    paymentMethod === method 
                      ? 'bg-tech-blue text-white border-tech-blue shadow-xs' 
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {method === 'Efectivo' ? '💵 Efectivo' : method === 'Billetera Virtual' ? '📱 Billetera' : '💳 Tarjeta'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 1. LÓGICA ARC (SIN GOOGLE MAPS - TRONCALES DINÁMICOS) */}
        {serviceType === 'ARC' && (
          <div className="rounded-2xl border border-vial-orange/30 bg-amber-50/30 p-4 space-y-3.5 shadow-xs">
            <h3 className="text-xs font-black text-vial-orange uppercase tracking-wider flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              Selección de Tramo Troncal ARC
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Origen Troncal</label>
                <select
                  value={arcOrigin}
                  onChange={(e) => {
                    setArcOrigin(e.target.value);
                    setArcDestination('');
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-tech-blue focus:border-vial-orange focus:outline-none"
                >
                  <option value="">-- Seleccionar Origen --</option>
                  {arcAvailableOrigins.map(o => (
                    <option key={o} value={o}>📍 {o}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Destino Troncal</label>
                <select
                  value={arcDestination}
                  disabled={!arcOrigin}
                  onChange={(e) => setArcDestination(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-tech-blue focus:border-vial-orange focus:outline-none disabled:opacity-50"
                >
                  <option value="">-- Seleccionar Destino --</option>
                  {arcAvailableDestinations.map(d => (
                    <option key={d} value={d}>🏁 {d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Asientos / Cupos</label>
                <div className="flex items-center space-x-2 bg-white p-2 rounded-xl border border-slate-200">
                  <Users className="h-4 w-4 text-vial-orange" />
                  <input 
                    type="number" 
                    min="1"
                    max="8"
                    value={seats}
                    onChange={(e) => setSeats(Number(e.target.value))}
                    className="w-full text-xs font-black text-tech-blue outline-none"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Punto de Encuentro / Nota (Opcional)</label>
                <input 
                  type="text"
                  placeholder="Ej. Parada Terminal de Ómnibus / Caseta"
                  value={arcNotes}
                  onChange={(e) => setArcNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-tech-blue focus:border-vial-orange focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. LÓGICA TRASLADOS FIJOS (SIN GOOGLE MAPS) */}
        {serviceType === 'TRANSFER' && (
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-50/20 p-4 space-y-3.5 shadow-xs">
            <h3 className="text-xs font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
              <Plane className="h-4 w-4" />
              Selección de Traslado Fijo Punto a Punto
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Punto de Partida</label>
                <select
                  value={transferOrigin}
                  onChange={(e) => {
                    setTransferOrigin(e.target.value);
                    setTransferDestination('');
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-tech-blue focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">-- Seleccionar Origen --</option>
                  {transferAvailableOrigins.map(o => (
                    <option key={o} value={o}>✈️ {o}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Punto de Llegada</label>
                <select
                  value={transferDestination}
                  disabled={!transferOrigin}
                  onChange={(e) => setTransferDestination(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-tech-blue focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                >
                  <option value="">-- Seleccionar Destino --</option>
                  {transferAvailableDestinations.map(d => (
                    <option key={d} value={d}>🏨 {d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Detalle de Vuelo / Hotel / Nota (Opcional)</label>
              <input 
                type="text"
                placeholder="Ej. Vuelo AR 1450 / Hotel Sheraton"
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-tech-blue focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* 3. LÓGICA MOVILIDAD URBANA (GOOGLE MAPS) */}
        {serviceType === 'MU' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Origen del Viaje</label>
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
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Destino Final</label>
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

            {distanceKm > 0 && (
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
                <span className="flex items-center">
                  <Navigation className="h-4 w-4 text-vial-orange mr-1.5 rotate-45" />
                  Ruta Calculada:
                </span>
                <span className="text-tech-blue">{distanceKm} KM ({durationMin} min aprox.)</span>
              </div>
            )}

            {isCalculatingRoute && (
              <div className="text-center text-xs font-semibold text-slate-400 py-1 flex justify-center items-center gap-2">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-vial-orange border-t-transparent"></div>
                Calculando trayecto...
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECCIÓN DE TARJETAS DE CATEGORÍAS */}
      {serviceType === 'MU' && distanceKm > 0 && filteredMuTariffs.length > 0 && (
        <div className="mt-4">
          <label className="block text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-2">
            Categorías Disponibles
          </label>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {filteredMuTariffs.map(tariff => {
              const det = calculateTariffDetails(tariff);
              const isSelected = tariff.id === selectedTariffId;
              const catObj = categories.find(c => c.id === tariff.category);
              const carImg = catObj?.icon && (catObj.icon.startsWith('http') || catObj.icon.startsWith('/') || catObj.icon.startsWith('data:'))
                ? catObj.icon
                : (tariff.category || '').toLowerCase().includes('vip') || (tariff.category || '').toLowerCase().includes('premium')
                  ? '/assets/landing_premium.svg'
                  : (tariff.category || '').toLowerCase().includes('plus')
                    ? '/assets/landing_plus.svg'
                    : (tariff.category || '').toLowerCase().includes('taxi')
                      ? '/assets/landing_taxi.svg'
                      : '/assets/landing_estandar.svg';

              return (
                <div
                  key={tariff.id}
                  onClick={() => setSelectedTariffId(tariff.id)}
                  className={`rounded-2xl border-2 p-3.5 cursor-pointer transition-all flex flex-col justify-between hover:shadow-md group relative overflow-hidden ${
                    isSelected 
                      ? 'border-vial-orange bg-vial-orange/10 ring-2 ring-vial-orange/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-xs text-tech-blue">{tariff.name}</h4>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {getCategoryLabel(tariff.category)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-tech-blue">
                        ${det.finalPassengerPrice.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-16 my-1.5 flex items-center justify-center">
                    <img 
                      src={carImg} 
                      alt={tariff.name} 
                      className="w-full h-full object-contain filter drop-shadow-xs group-hover:scale-105 transition-transform duration-300" 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DESGLOSE FINANCIERO CON IMPUESTOS SOBRE COMISIÓN */}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-black uppercase text-tech-blue tracking-wider flex items-center justify-between">
          <span className="flex items-center">
            <DollarSign className="mr-1 h-4 w-4 text-vial-orange" />
            Desglose Financiero ({currentTariff?.name || 'Tarifa Seleccionada'})
          </span>
          <span className="text-[10px] font-bold text-slate-400">
            {getCategoryLabel(currentTariff?.category)}
          </span>
        </h3>
        
        <div className="space-y-2 text-xs">
          <div className="flex justify-between font-bold text-slate-700 items-center">
            <span>Tarifa del Servicio al Pasajero:</span>
            <span className="text-sm font-black text-tech-blue">${financial.finalPassengerPrice.toLocaleString('es-AR')}</span>
          </div>

          <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200 space-y-1.5 text-[11px] text-slate-500">
            <div className="flex justify-between font-semibold">
              <span>Comisión de Plataforma ({currentTariff?.commissionRate ?? 15}%):</span>
              <span className="font-bold text-slate-700">${Math.round(financial.commissionAmount).toLocaleString('es-AR')}</span>
            </div>
            
            <div className="pl-2 border-l-2 border-slate-200 space-y-1 text-[10px] text-slate-400">
              <div className="flex justify-between">
                <span>IVA s/ comisión ({currentTariff?.iva ?? 21}%):</span>
                <span>${financial.ivaAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>IIBB s/ comisión ({currentTariff?.iibb ?? 3.5}%):</span>
                <span>${financial.iibbAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>TEM s/ comisión ({currentTariff?.taxMunicipal ?? 1.5}%):</span>
                <span>${financial.taxMunicipalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between font-bold text-emerald-700 pt-1 border-t border-slate-200">
              <span>Monto Neto Estimado Conductor:</span>
              <span className="text-xs font-black">${financial.driverNetEarnings.toLocaleString('es-AR')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Botón de Despacho */}
      <div className="mt-5">
        <button 
          onClick={handleDispatch}
          disabled={
            isDispatching || 
            financial.basePrice <= 0 ||
            !passengerName.trim() ||
            (serviceType === 'ARC' && (!arcOrigin || !arcDestination)) ||
            (serviceType === 'TRANSFER' && (!transferOrigin || !transferDestination)) ||
            (serviceType === 'MU' && (!muOriginCoords || !muDestCoords))
          }
          className="w-full flex items-center justify-center space-x-2 rounded-xl bg-vial-orange py-3.5 text-sm font-black text-gray-950 hover:opacity-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md cursor-pointer"
        >
          {isDispatching ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-950 border-t-transparent mr-2"></div>
          ) : (
            <CheckCircle className="h-5 w-5 mr-1" />
          )}
          <span>Confirmar y Despachar Viaje</span>
        </button>
      </div>
    </div>
  );
};

