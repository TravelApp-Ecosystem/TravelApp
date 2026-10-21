"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Navigation,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle,
  Building2,
  Plane,
  Car,
  Sparkles,
} from 'lucide-react';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  ARCTariff,
  MUTariff,
  TransferTariff,
  VehicleCategory,
  Branch,
  TariffSpecialRate,
} from '@/types/logistics';
import {
  GoogleAddressAutocomplete,
  resolveTucumanAddressCoords,
  TUCUMAN_PLACES_GAZETTEER,
} from './GoogleAddressAutocomplete';

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

// Cálculo vial Haversine inmediato (respaldo instantáneo y preciso para Tucumán / NOA)
function calculateRoadMetrics(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number }
): { distanceKm: number; durationMin: number } {
  const R = 6371; // Radio terrestre en km
  const dLat = ((dest.lat - origin.lat) * Math.PI) / 180;
  const dLng = ((dest.lng - origin.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((origin.lat * Math.PI) / 180) *
      Math.cos((dest.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightKm = R * c;
  const roadKm = Math.max(1.5, Number((straightKm * 1.32).toFixed(1)));
  const durationMin = Math.max(5, Math.round(roadKm * 2.3));
  return { distanceKm: roadKm, durationMin };
}

// Tarifarios urbanos de respaldo si en Firestore hay valores en 0 o faltan categorías
const FALLBACK_MU_TARIFFS: MUTariff[] = [
  {
    id: 'fallback_mu_taxi',
    name: 'Tarifa Taxi Oficial (SUTRAPPA)',
    branchIds: ['all'],
    category: 'taxi',
    baseFare: 1200,
    pricePerKm: 750,
    minimumFare: 2200,
    waitMinutePrice: 60,
    courtesyTimeMinutes: 5,
    travelMinutePrice: 55,
    penalties: {
      cancelGracePeriodMinutes: 3,
      cancelFixedFee: 1200,
      postAcceptanceCancelFeeType: 'percentage',
      postAcceptanceCancelFeeValue: 20,
      postAcceptanceGraceMinutes: 2,
      driverCancelPenaltyFee: 1500,
    },
    iva: 21,
    iibb: 3.5,
    taxMunicipal: 1.5,
    electronicPaymentFee: 5,
    commissionRate: 10,
    weeklyMembership: 5000,
    specialRates: [],
    type: 'mu',
    isActive: true,
  },
  {
    id: 'fallback_mu_estandar',
    name: 'TravelCab Estándar',
    branchIds: ['all'],
    category: 'estandar',
    baseFare: 1400,
    pricePerKm: 820,
    minimumFare: 2500,
    waitMinutePrice: 70,
    courtesyTimeMinutes: 5,
    travelMinutePrice: 65,
    penalties: {
      cancelGracePeriodMinutes: 3,
      cancelFixedFee: 1500,
      postAcceptanceCancelFeeType: 'percentage',
      postAcceptanceCancelFeeValue: 20,
      postAcceptanceGraceMinutes: 2,
      driverCancelPenaltyFee: 2000,
    },
    iva: 21,
    iibb: 3.5,
    taxMunicipal: 1.5,
    electronicPaymentFee: 5,
    commissionRate: 15,
    weeklyMembership: 5000,
    specialRates: [],
    type: 'mu',
    isActive: true,
  },
  {
    id: 'fallback_mu_vip',
    name: 'TravelCab VIP / Ejecutivo',
    branchIds: ['all'],
    category: 'vip',
    baseFare: 2200,
    pricePerKm: 1150,
    minimumFare: 3600,
    waitMinutePrice: 100,
    courtesyTimeMinutes: 5,
    travelMinutePrice: 90,
    penalties: {
      cancelGracePeriodMinutes: 3,
      cancelFixedFee: 2000,
      postAcceptanceCancelFeeType: 'percentage',
      postAcceptanceCancelFeeValue: 20,
      postAcceptanceGraceMinutes: 2,
      driverCancelPenaltyFee: 2500,
    },
    iva: 21,
    iibb: 3.5,
    taxMunicipal: 1.5,
    electronicPaymentFee: 5,
    commissionRate: 15,
    weeklyMembership: 6500,
    specialRates: [],
    type: 'mu',
    isActive: true,
  },
];

const FALLBACK_ARC_TARIFFS: ARCTariff[] = [
  {
    id: 'fallback_arc_valles',
    name: 'Troncal Valles & Interior Tucumán',
    branchIds: ['all'],
    category: 'arc_compartido',
    routes: [
      {
        id: 'arc-1',
        mainOrigin: 'San Miguel de Tucumán (Centro / Terminal)',
        mainDestination: 'Tafí del Valle',
        pricePerSeat: 14500,
        isBidirectional: true,
      },
      {
        id: 'arc-2',
        mainOrigin: 'San Miguel de Tucumán (Centro / Terminal)',
        mainDestination: 'Monteros / Concepción',
        pricePerSeat: 8500,
        isBidirectional: true,
      },
      {
        id: 'arc-3',
        mainOrigin: 'San Miguel de Tucumán (Centro / Terminal)',
        mainDestination: 'San Pedro de Colalao',
        pricePerSeat: 11500,
        isBidirectional: true,
      },
    ],
    iva: 21,
    iibb: 3.5,
    taxMunicipal: 1.5,
    electronicPaymentFee: 5,
    commissionRate: 15,
    weeklyMembership: 5000,
    specialRates: [],
    type: 'arc',
    isActive: true,
  },
];

const FALLBACK_TRANSFER_TARIFFS: TransferTariff[] = [
  {
    id: 'fallback_transfer_aero',
    name: 'Traslados Punto a Punto (Aeropuerto & Hoteles)',
    branchIds: ['all'],
    category: 'transfer_ejecutivo',
    routes: [
      {
        id: 'trf-1',
        originName: 'Centro / Hoteles San Miguel de Tucumán',
        destinationName: 'Aeropuerto Internacional TUC (Benjamín Matienzo)',
        fixedPrice: 18500,
        isBidirectional: true,
      },
      {
        id: 'trf-2',
        originName: 'Yerba Buena / Country Clubs',
        destinationName: 'Aeropuerto Internacional TUC (Benjamín Matienzo)',
        fixedPrice: 24500,
        isBidirectional: true,
      },
      {
        id: 'trf-3',
        originName: 'Centro / Hoteles San Miguel de Tucumán',
        destinationName: 'Termas de Río Hondo (Hoteles)',
        fixedPrice: 68000,
        isBidirectional: true,
      },
    ],
    iva: 21,
    iibb: 3.5,
    taxMunicipal: 1.5,
    electronicPaymentFee: 5,
    commissionRate: 15,
    weeklyMembership: 5000,
    specialRates: [],
    type: 'transfers',
    isActive: true,
  },
];

// Garantiza que ningún tarifario MU tenga valores en $0 por error de carga
function normalizeMuTariff(raw: any): MUTariff {
  const catLower = `${raw.category || ''} ${raw.name || ''}`.toLowerCase();
  const isVip = catLower.includes('vip') || catLower.includes('ejecutiv') || catLower.includes('premium');
  const isPlus = catLower.includes('plus') || catLower.includes('familiar') || catLower.includes('xl');
  const isTaxi = catLower.includes('taxi') || catLower.includes('sutrappa');

  const defaultBase = isVip ? 2200 : isPlus ? 1750 : isTaxi ? 1200 : 1400;
  const defaultPerKm = isVip ? 1150 : isPlus ? 950 : isTaxi ? 750 : 820;
  const defaultMin = isVip ? 3600 : isPlus ? 2900 : isTaxi ? 2200 : 2500;
  const defaultMinPrice = isVip ? 90 : isPlus ? 75 : isTaxi ? 55 : 65;

  return {
    ...raw,
    baseFare: Number(raw.baseFare) > 0 ? Number(raw.baseFare) : defaultBase,
    pricePerKm: Number(raw.pricePerKm) > 0 ? Number(raw.pricePerKm) : defaultPerKm,
    minimumFare: Number(raw.minimumFare) > 0 ? Number(raw.minimumFare) : defaultMin,
    travelMinutePrice:
      Number(raw.travelMinutePrice) > 0 ? Number(raw.travelMinutePrice) : defaultMinPrice,
    commissionRate: Number(raw.commissionRate) > 0 ? Number(raw.commissionRate) : 15,
    iva: raw.iva !== undefined ? Number(raw.iva) : 21,
    iibb: raw.iibb !== undefined ? Number(raw.iibb) : 3.5,
    taxMunicipal: raw.taxMunicipal !== undefined ? Number(raw.taxMunicipal) : 1.5,
    electronicPaymentFee:
      raw.electronicPaymentFee !== undefined ? Number(raw.electronicPaymentFee) : 5,
  };
}

export interface UnifiedDispatcherB2BPartner {
  id: string;
  commercialName: string;
  category: string;
  branchId?: string;
  branchName?: string;
  address: string;
  cabCommissionPct: number;
}

interface UnifiedDispatcherProps {
  onCoordsChange?: (coords: {
    originCoords: { lat: number; lng: number } | null;
    destinationCoords: { lat: number; lng: number } | null;
  }) => void;
  defaultOriginAddress?: string;
  defaultOriginCoords?: { lat: number; lng: number } | null;
  b2bPartner?: UnifiedDispatcherB2BPartner | null;
  onTripDispatched?: (tripData: any) => void;
}

export const UnifiedDispatcher: React.FC<UnifiedDispatcherProps> = ({
  onCoordsChange,
  defaultOriginAddress,
  defaultOriginCoords,
  b2bPartner,
  onTripDispatched,
}) => {
  const [serviceType, setServiceType] = useState<'MU' | 'ARC' | 'TRANSFER'>('MU');

  // Dynamic collections from Firestore
  const [muTariffs, setMuTariffs] = useState<MUTariff[]>(FALLBACK_MU_TARIFFS);
  const [arcTariffs, setArcTariffs] = useState<ARCTariff[]>(FALLBACK_ARC_TARIFFS);
  const [transferTariffs, setTransferTariffs] = useState<TransferTariff[]>(FALLBACK_TRANSFER_TARIFFS);
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
  const initialOriginAddr = defaultOriginAddress?.trim() || '';
  const initialOriginCoords = useMemo(() => {
    if (defaultOriginCoords) return defaultOriginCoords;
    if (initialOriginAddr.length >= 3) return resolveTucumanAddressCoords(initialOriginAddr);
    return null;
  }, [defaultOriginCoords, initialOriginAddr]);

  const [muOriginAddress, setMuOriginAddress] = useState<string>(initialOriginAddr);
  const [muOriginCoords, setMuOriginCoords] = useState<{ lat: number; lng: number } | null>(
    initialOriginCoords
  );
  const [muDestAddress, setMuDestAddress] = useState('');
  const [muDestCoords, setMuDestCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Route calculation outputs for MU
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [durationMin, setDurationMin] = useState<number>(0);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);

  // Feedback visual de despacho
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);
  const [dispatchErrorMsg, setDispatchErrorMsg] = useState<string | null>(null);

  // Sincronizar automáticamente cuando cambia el domicilio del aliado B2B por defecto
  useEffect(() => {
    if (defaultOriginAddress && defaultOriginAddress.trim().length > 0) {
      const addr = defaultOriginAddress.trim();
      const resolved = defaultOriginCoords || resolveTucumanAddressCoords(addr);
      setMuOriginAddress(addr);
      setMuOriginCoords(resolved);
    }
  }, [defaultOriginAddress, defaultOriginCoords]);

  // 1. Escuchar Categorías, Tarifarios y Sucursales en tiempo real
  useEffect(() => {
    const unsubCats = onSnapshot(
      collection(db, 'categories'),
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as VehicleCategory);
        setCategories(list);
      },
      (error) => {
        console.error('Error loading categories in Dispatcher:', error);
      }
    );

    const unsubTariffs = onSnapshot(
      collection(db, 'tariffs'),
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as any);

        const dbMu = list
          .filter((t) => t.type === 'mu' && t.id !== 'mu_active' && t.isActive !== false)
          .map(normalizeMuTariff);

        // Si en Firestore hay menos de 2 tarifas MU, complementamos con las categorías oficiales para poder comparar
        if (dbMu.length === 0) {
          setMuTariffs(FALLBACK_MU_TARIFFS);
        } else if (dbMu.length === 1) {
          const existingCat = (dbMu[0].category || '').toLowerCase();
          const extras = FALLBACK_MU_TARIFFS.filter(
            (f) => !existingCat.includes(f.category.toLowerCase())
          );
          setMuTariffs([...dbMu, ...extras]);
        } else {
          setMuTariffs(dbMu);
        }

        const dbArc = list.filter(
          (t) =>
            (t.type === 'arc' || t.type === 'aci') &&
            t.id !== 'arc_active' &&
            t.isActive !== false &&
            Array.isArray(t.routes) &&
            t.routes.length > 0
        );
        setArcTariffs(dbArc.length > 0 ? dbArc : FALLBACK_ARC_TARIFFS);

        const dbTransfers = list.filter(
          (t) =>
            t.type === 'transfers' &&
            t.isActive !== false &&
            Array.isArray(t.routes) &&
            t.routes.length > 0
        );
        setTransferTariffs(dbTransfers.length > 0 ? dbTransfers : FALLBACK_TRANSFER_TARIFFS);

        setIsLoadingTariffs(false);
      },
      (error) => {
        console.error('Error loading active tariffs:', error);
        setIsLoadingTariffs(false);
      }
    );

    const unsubBranches = onSnapshot(
      collection(db, 'branches'),
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Branch);
        setBranches(list.filter((b) => b.active !== false));
      },
      (error) => {
        console.error('Error loading branches in Dispatcher:', error);
      }
    );

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

  // Calcular ruta al tener Origen y Destino en MU (Haversine inmediato + Google DirectionsService si está activo)
  useEffect(() => {
    if (serviceType !== 'MU' || !muOriginCoords || !muDestCoords) {
      setDistanceKm(0);
      setDurationMin(0);
      return;
    }

    // 1. Cálculo instantáneo garantizado para que la tarifa nunca quede en $0
    const fallbackMetrics = calculateRoadMetrics(muOriginCoords, muDestCoords);
    setDistanceKm(fallbackMetrics.distanceKm);
    setDurationMin(fallbackMetrics.durationMin);

    // 2. Si Google Maps DirectionsService está disponible, refinar con distancia vial exacta
    if (typeof window !== 'undefined' && window.google?.maps?.DirectionsService) {
      setIsCalculatingRoute(true);
      try {
        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
          {
            origin: muOriginCoords,
            destination: muDestCoords,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            setIsCalculatingRoute(false);
            if (status === window.google.maps.DirectionsStatus.OK && result?.routes?.[0]?.legs?.[0]) {
              const leg = result.routes[0].legs[0];
              const km = (leg.distance?.value || 0) / 1000;
              const mins = Math.round((leg.duration?.value || 0) / 60);
              if (km > 0) {
                setDistanceKm(Number(km.toFixed(1)));
                setDurationMin(Math.max(3, mins));
              }
            }
          }
        );
      } catch {
        setIsCalculatingRoute(false);
      }
    }
  }, [serviceType, muOriginCoords, muDestCoords]);

  // Filtrar tarifas según la sucursal seleccionada
  const filteredMuTariffs = useMemo(() => {
    const matches = muTariffs.filter((t) => {
      if (selectedBranchId === 'all') return true;
      if (!t.branchIds || t.branchIds.length === 0 || t.branchIds.includes('all')) return true;
      return t.branchIds.includes(selectedBranchId);
    });
    return matches.length > 0 ? matches : muTariffs;
  }, [muTariffs, selectedBranchId]);

  const filteredArcTariffs = useMemo(() => {
    const matches = arcTariffs.filter((t) => {
      if (selectedBranchId === 'all') return true;
      if (!t.branchIds || t.branchIds.length === 0 || t.branchIds.includes('all')) return true;
      return t.branchIds.includes(selectedBranchId);
    });
    return matches.length > 0 ? matches : arcTariffs;
  }, [arcTariffs, selectedBranchId]);

  const filteredTransferTariffs = useMemo(() => {
    const matches = transferTariffs.filter((t) => {
      if (selectedBranchId === 'all') return true;
      if (!t.branchIds || t.branchIds.length === 0 || t.branchIds.includes('all')) return true;
      return t.branchIds.includes(selectedBranchId);
    });
    return matches.length > 0 ? matches : transferTariffs;
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
    filteredArcTariffs.forEach((tariff) => {
      tariff.routes?.forEach((r) => {
        if (r.mainOrigin && r.mainDestination) {
          list.push({
            origin: r.mainOrigin,
            destination: r.mainDestination,
            pricePerSeat: Number(r.pricePerSeat) || 9500,
            tariffId: tariff.id,
            category: tariff.category,
          });
          if (r.isBidirectional !== false) {
            list.push({
              origin: r.mainDestination,
              destination: r.mainOrigin,
              pricePerSeat: Number(r.pricePerSeat) || 9500,
              tariffId: tariff.id,
              category: tariff.category,
            });
          }
        }
      });
    });
    return list;
  }, [filteredArcTariffs]);

  const arcAvailableOrigins = useMemo(() => {
    return Array.from(new Set(arcRouteOptions.map((r) => r.origin)));
  }, [arcRouteOptions]);

  const arcAvailableDestinations = useMemo(() => {
    if (!arcOrigin) return [];
    return Array.from(
      new Set(arcRouteOptions.filter((r) => r.origin === arcOrigin).map((r) => r.destination))
    );
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
    filteredTransferTariffs.forEach((tariff) => {
      tariff.routes?.forEach((r) => {
        if (r.originName && r.destinationName) {
          list.push({
            origin: r.originName,
            destination: r.destinationName,
            fixedPrice: Number(r.fixedPrice) || 18500,
            tariffId: tariff.id,
            category: tariff.category,
          });
          if (r.isBidirectional !== false) {
            list.push({
              origin: r.destinationName,
              destination: r.originName,
              fixedPrice: Number(r.fixedPrice) || 18500,
              tariffId: tariff.id,
              category: tariff.category,
            });
          }
        }
      });
    });
    return list;
  }, [filteredTransferTariffs]);

  const transferAvailableOrigins = useMemo(() => {
    return Array.from(new Set(transferRouteOptions.map((r) => r.origin)));
  }, [transferRouteOptions]);

  const transferAvailableDestinations = useMemo(() => {
    if (!transferOrigin) return [];
    return Array.from(
      new Set(transferRouteOptions.filter((r) => r.origin === transferOrigin).map((r) => r.destination))
    );
  }, [transferRouteOptions, transferOrigin]);

  // Auto-seleccionar tarifa activa
  useEffect(() => {
    if (serviceType === 'MU') {
      if (!selectedTariffId || !filteredMuTariffs.some((t) => t.id === selectedTariffId)) {
        setSelectedTariffId(filteredMuTariffs[0]?.id || '');
      }
    } else if (serviceType === 'ARC') {
      if (arcOrigin && arcDestination) {
        const match = arcRouteOptions.find(
          (r) => r.origin === arcOrigin && r.destination === arcDestination
        );
        if (match) setSelectedTariffId(match.tariffId);
      } else if (arcAvailableOrigins.length > 0 && !arcOrigin) {
        const firstOrigin = arcAvailableOrigins[0];
        const firstDest = arcRouteOptions.find((r) => r.origin === firstOrigin)?.destination || '';
        setArcOrigin(firstOrigin);
        setArcDestination(firstDest);
      }
    } else if (serviceType === 'TRANSFER') {
      if (transferOrigin && transferDestination) {
        const match = transferRouteOptions.find(
          (r) => r.origin === transferOrigin && r.destination === transferDestination
        );
        if (match) setSelectedTariffId(match.tariffId);
      } else if (transferAvailableOrigins.length > 0 && !transferOrigin) {
        const firstOrigin = transferAvailableOrigins[0];
        const firstDest =
          transferRouteOptions.find((r) => r.origin === firstOrigin)?.destination || '';
        setTransferOrigin(firstOrigin);
        setTransferDestination(firstDest);
      }
    }
  }, [
    serviceType,
    filteredMuTariffs,
    arcOrigin,
    arcDestination,
    transferOrigin,
    transferDestination,
    arcRouteOptions,
    transferRouteOptions,
    arcAvailableOrigins,
    transferAvailableOrigins,
    selectedTariffId,
  ]);

  // Tarifario actualmente seleccionado
  const currentTariff = useMemo(() => {
    if (serviceType === 'MU') {
      return filteredMuTariffs.find((t) => t.id === selectedTariffId) || filteredMuTariffs[0];
    } else if (serviceType === 'ARC') {
      return filteredArcTariffs.find((t) => t.id === selectedTariffId) || filteredArcTariffs[0];
    } else {
      return (
        filteredTransferTariffs.find((t) => t.id === selectedTariffId) || filteredTransferTariffs[0]
      );
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
      const match =
        arcRouteOptions.find(
          (r) => r.tariffId === tariff?.id && r.origin === arcOrigin && r.destination === arcDestination
        ) ||
        arcRouteOptions.find((r) => r.origin === arcOrigin && r.destination === arcDestination);
      base = match ? match.pricePerSeat * Math.max(1, seats) : 0;
    } else if (serviceType === 'TRANSFER') {
      const match =
        transferRouteOptions.find(
          (r) =>
            r.tariffId === tariff?.id &&
            r.origin === transferOrigin &&
            r.destination === transferDestination
        ) ||
        transferRouteOptions.find(
          (r) => r.origin === transferOrigin && r.destination === transferDestination
        );
      base = match ? match.fixedPrice : 0;
    } else {
      // Movilidad Urbana (MU)
      if (distanceKm > 0 && tariff) {
        const safeTariff = normalizeMuTariff(tariff);
        const calculatedFare =
          safeTariff.baseFare +
          safeTariff.pricePerKm * distanceKm +
          safeTariff.travelMinutePrice * durationMin;

        base = Math.max(safeTariff.minimumFare, Math.round(calculatedFare / 50) * 50);
      }
    }

    // APLICAR TARIFA ESPECIAL (DÍAS Y HORARIOS ESPECÍFICOS) SOBRE EL CÁLCULO TOTAL DEL VIAJE
    const { modifierPct, appliedRate } = getSpecialRateModifier(tariff?.specialRates);
    const unadjustedBase = base;
    if (base > 0 && modifierPct !== 0) {
      base = Math.round(base * (1 + modifierPct / 100));
    }

    // Comisión bruta de la plataforma sobre el valor del viaje
    const platformCommission = base * (commissionPercent / 100);

    // 1. Desglose de IVA (Débito Fiscal contenido en la comisión)
    // Base Imponible Neta (sin IVA) = Comisión Total / (1 + alícuota IVA)
    const commissionNetOfIva =
      ivaPercent > 0 ? platformCommission / (1 + ivaPercent / 100) : platformCommission;
    const ivaAmt = platformCommission - commissionNetOfIva;

    // 2. IIBB (DGR) y TEM (DIM Municipal) calculados DESCONTANDO EL IVA (sobre la Comisión Neta sin IVA)
    const iibbAmt = commissionNetOfIva * (iibbPercent / 100);
    const taxMunAmt = commissionNetOfIva * (taxMunicipalPercent / 100);
    const totalTaxesOnCommission = ivaAmt + iibbAmt + taxMunAmt;
    const platformCleanMargin = Math.max(0, platformCommission - totalTaxesOnCommission);

    // Recargo electrónico sobre el precio final si aplica
    const electronicFeeAmt =
      paymentMethod !== 'Efectivo' ? base * (electronicFeePercent / 100) : 0;
    const finalPassengerPrice = Math.round(base + electronicFeeAmt);
    const driverNetEarnings = Math.round(base - platformCommission);

    // Comisión del aliado B2B (si opera desde Portal B2B)
    const b2bCommissionPct = b2bPartner?.cabCommissionPct ?? 0;
    const b2bPartnerCommissionAmt = Math.round(finalPassengerPrice * (b2bCommissionPct / 100));

    return {
      unadjustedBasePrice: unadjustedBase,
      basePrice: base,
      specialRateModifierPct: modifierPct,
      appliedSpecialRate: appliedRate,
      commissionAmount: platformCommission,
      commissionNetWithoutIva: commissionNetOfIva,
      ivaAmount: ivaAmt,
      iibbAmount: iibbAmt,
      taxMunicipalAmount: taxMunAmt,
      totalTaxesOnCommission,
      platformCleanMargin,
      electronicFeeAmount: electronicFeeAmt,
      finalPassengerPrice,
      driverNetEarnings,
      b2bCommissionPct,
      b2bPartnerCommissionAmt,
    };
  };

  const financial = calculateTariffDetails(currentTariff);

  const getCategoryLabel = (catId?: string) => {
    if (!catId) return 'Estándar';
    const found = categories.find((c) => c.id === catId);
    return found ? found.name : catId.charAt(0).toUpperCase() + catId.slice(1);
  };

  // Despachar el Viaje y guardar en Firestore (tanto en `trips` como en `travelcab_trips` si es B2B)
  const handleDispatch = async () => {
    setDispatchSuccessMsg(null);
    setDispatchErrorMsg(null);

    if (!passengerName.trim()) {
      setDispatchErrorMsg('Por favor ingresá el nombre del pasajero.');
      return;
    }

    let originText = '';
    let destinationText = '';
    let originCoordinates = muOriginCoords;
    let destinationCoordinates = muDestCoords;

    if (serviceType === 'ARC') {
      if (!arcOrigin || !arcDestination) {
        setDispatchErrorMsg('Por favor seleccioná el origen y el destino del tramo troncal ARC.');
        return;
      }
      originText = `${arcOrigin}${arcNotes ? ` (${arcNotes})` : ''}`;
      destinationText = arcDestination;
      originCoordinates = resolveTucumanAddressCoords(arcOrigin);
      destinationCoordinates = resolveTucumanAddressCoords(arcDestination);
    } else if (serviceType === 'TRANSFER') {
      if (!transferOrigin || !transferDestination) {
        setDispatchErrorMsg('Por favor seleccioná el punto de origen y destino del traslado.');
        return;
      }
      originText = `${transferOrigin}${transferNotes ? ` (${transferNotes})` : ''}`;
      destinationText = transferDestination;
      originCoordinates = resolveTucumanAddressCoords(transferOrigin);
      destinationCoordinates = resolveTucumanAddressCoords(transferDestination);
    } else {
      if (!muOriginAddress.trim() || !muDestAddress.trim()) {
        setDispatchErrorMsg('Por favor ingresá el origen y el destino del viaje.');
        return;
      }
      originText = muOriginAddress.trim();
      destinationText = muDestAddress.trim();
      if (!originCoordinates) {
        originCoordinates = resolveTucumanAddressCoords(originText);
        setMuOriginCoords(originCoordinates);
      }
      if (!destinationCoordinates) {
        destinationCoordinates = resolveTucumanAddressCoords(destinationText);
        setMuDestCoords(destinationCoordinates);
      }
    }

    if (financial.finalPassengerPrice <= 0) {
      setDispatchErrorMsg('Seleccioná un destino válido para calcular la tarifa antes de despachar.');
      return;
    }

    setIsDispatching(true);
    try {
      const tripCode = `CAB-${Math.floor(1000 + Math.random() * 9000)}`;
      const tripData: Record<string, any> = {
        tripCode,
        passengerName: passengerName.trim(),
        passengerPhone:
          passengerPhone.trim() || (passengerType === 'Usuario' ? 'Registrado' : 'No informado'),
        origin: originText,
        destination: destinationText,
        originCoords: originCoordinates,
        destinationCoords: destinationCoordinates,
        status: 'Buscando Chofer',
        price: financial.finalPassengerPrice,
        basePrice: financial.basePrice,
        platformCommission: Math.round(financial.commissionAmount),
        commissionNetWithoutIva: Number(financial.commissionNetWithoutIva.toFixed(2)),
        ivaDebitFiscal: Number(financial.ivaAmount.toFixed(2)),
        iibbToPay: Number(financial.iibbAmount.toFixed(2)),
        temToPay: Number(financial.taxMunicipalAmount.toFixed(2)),
        totalTaxesOnCommission: Number(financial.totalTaxesOnCommission.toFixed(2)),
        platformCleanMargin: Number(financial.platformCleanMargin.toFixed(2)),
        taxRatesApplied: {
          commissionRate: currentTariff?.commissionRate ?? 15,
          iva: currentTariff?.iva ?? 21,
          iibb: currentTariff?.iibb ?? 3.5,
          taxMunicipal: currentTariff?.taxMunicipal ?? 1.5,
        },
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
        bookingChannel: b2bPartner ? 'hotel_reception_b2b' : 'central_dispatch',
        ...(b2bPartner
          ? {
              partnerId: b2bPartner.id,
              partnerName: b2bPartner.commercialName,
              partnerCategory: b2bPartner.category,
              hotelId: b2bPartner.id,
              hotelName: b2bPartner.commercialName,
              hotelCommissionPct: b2bPartner.cabCommissionPct,
              hotelCommission: financial.b2bPartnerCommissionAmt,
            }
          : {}),
        createdAt: Date.now(),
      };

      // 1. Guardar en `trips` para Central de Despacho y Mapa en Tiempo Real
      await addDoc(collection(db, 'trips'), tripData);

      // 2. Si se despacha desde el Portal B2B, registrar también en `travelcab_trips` para liquidación de comisiones B2B
      if (b2bPartner) {
        await addDoc(collection(db, 'travelcab_trips'), {
          tripCode,
          bookingChannel: 'hotel_reception_b2b',
          partnerId: b2bPartner.id,
          partnerName: b2bPartner.commercialName,
          partnerCategory: b2bPartner.category,
          hotelId: b2bPartner.id,
          hotelName: b2bPartner.commercialName,
          branchId: b2bPartner.branchId || 'CENTRAL',
          branchName: b2bPartner.branchName || 'Casa Central',
          passengerName: passengerName.trim(),
          passengerPhone: passengerPhone.trim() || 'Mostrador B2B',
          roomNumber: b2bPartner.branchName || 'Recepción',
          origin: originText,
          destination: destinationText,
          distanceKm: serviceType === 'MU' ? distanceKm : 5,
          vehicleCategory: currentTariff?.name || getCategoryLabel(currentTariff?.category),
          paymentMethod,
          estimatedFare: financial.finalPassengerPrice,
          hotelCommissionPct: b2bPartner.cabCommissionPct,
          hotelCommission: financial.b2bPartnerCommissionAmt,
          commissionStatus: 'pending',
          status: 'dispatching',
          driverName: 'Buscando unidad cercana...',
          createdAt: serverTimestamp(),
          createdAtIso: new Date().toISOString(),
        });
      }

      if (onTripDispatched) {
        onTripDispatched(tripData);
      }

      // Limpiar formulario (conservando el origen por defecto si es aliado B2B)
      setPassengerName('');
      setPassengerPhone('');
      setArcNotes('');
      setTransferNotes('');
      setMuDestAddress('');
      setMuDestCoords(null);

      if (defaultOriginAddress && defaultOriginAddress.trim().length > 0) {
        const addr = defaultOriginAddress.trim();
        setMuOriginAddress(addr);
        setMuOriginCoords(defaultOriginCoords || resolveTucumanAddressCoords(addr));
      } else {
        setMuOriginAddress('');
        setMuOriginCoords(null);
      }

      setDispatchSuccessMsg(
        b2bPartner
          ? `¡Viaje ${tripCode} despachado! Tarifa: $${financial.finalPassengerPrice.toLocaleString('es-AR')} · Comisión generada para ${b2bPartner.commercialName}: +$${financial.b2bPartnerCommissionAmt.toLocaleString('es-AR')}`
          : `¡Viaje ${tripCode} creado exitosamente y despachado a la flota de choferes! ($${financial.finalPassengerPrice.toLocaleString('es-AR')})`
      );
      setTimeout(() => setDispatchSuccessMsg(null), 7000);
    } catch (error: any) {
      console.error('Error al despachar el viaje:', error);
      setDispatchErrorMsg('Hubo un error al despachar el viaje: ' + error.message);
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-slate-50 p-5 sm:p-6 overflow-y-auto custom-scrollbar">
      {/* Encabezado y Selector de Sucursal */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-tech-blue flex items-center">
            <Navigation className="mr-2 h-6 w-6 text-vial-orange" />
            Despachador Maestro
          </h2>
          <p className="text-xs text-slate-500">
            {b2bPartner
              ? `Despacho directo desde ${b2bPartner.commercialName} (${b2bPartner.cabCommissionPct}% comisión B2B activa).`
              : 'Cotización y despacho directo para flota urbana, rural y traslados.'}
          </p>
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
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                📍 {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mensajes de confirmación o alerta */}
      {dispatchSuccessMsg && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-900 flex items-center gap-2 shadow-xs">
          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{dispatchSuccessMsg}</span>
        </div>
      )}

      {dispatchErrorMsg && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-bold text-red-800 flex items-center gap-2 shadow-xs">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{dispatchErrorMsg}</span>
        </div>
      )}

      {/* Selector de Tipo de Servicio */}
      <div className="mb-5 flex rounded-2xl bg-white p-1.5 border border-slate-200 shadow-sm gap-1.5">
        <button
          type="button"
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
          type="button"
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
          type="button"
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
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pasajero
            </label>
            <div className="flex rounded-lg bg-slate-100 p-0.5">
              <button
                type="button"
                onClick={() => setPassengerType('Usuario')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                  passengerType === 'Usuario'
                    ? 'bg-white text-tech-blue shadow-xs'
                    : 'text-slate-400'
                }`}
              >
                Registrado
              </button>
              <button
                type="button"
                onClick={() => setPassengerType('Invitado')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                  passengerType === 'Invitado'
                    ? 'bg-white text-tech-blue shadow-xs'
                    : 'text-slate-400'
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
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Medio de Pago
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Efectivo', 'Billetera Virtual', 'Tarjeta'] as const).map((method) => (
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
                  {method === 'Efectivo'
                    ? '💵 Efectivo'
                    : method === 'Billetera Virtual'
                      ? '📱 Billetera'
                      : '💳 Tarjeta'}
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
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Origen Troncal
                </label>
                <select
                  value={arcOrigin}
                  onChange={(e) => {
                    const nextOrigin = e.target.value;
                    setArcOrigin(nextOrigin);
                    const firstDest =
                      arcRouteOptions.find((r) => r.origin === nextOrigin)?.destination || '';
                    setArcDestination(firstDest);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-tech-blue focus:border-vial-orange focus:outline-none"
                >
                  <option value="">-- Seleccionar Origen --</option>
                  {arcAvailableOrigins.map((o) => (
                    <option key={o} value={o}>
                      📍 {o}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Destino Troncal
                </label>
                <select
                  value={arcDestination}
                  disabled={!arcOrigin}
                  onChange={(e) => setArcDestination(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-tech-blue focus:border-vial-orange focus:outline-none disabled:opacity-50"
                >
                  <option value="">-- Seleccionar Destino --</option>
                  {arcAvailableDestinations.map((d) => (
                    <option key={d} value={d}>
                      🏁 {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Asientos / Cupos
                </label>
                <div className="flex items-center space-x-2 bg-white p-2 rounded-xl border border-slate-200">
                  <Users className="h-4 w-4 text-vial-orange" />
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={seats}
                    onChange={(e) => setSeats(Math.max(1, Number(e.target.value)))}
                    className="w-full text-xs font-black text-tech-blue outline-none"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Punto de Encuentro / Nota (Opcional)
                </label>
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
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Punto de Partida
                </label>
                <select
                  value={transferOrigin}
                  onChange={(e) => {
                    const nextOrigin = e.target.value;
                    setTransferOrigin(nextOrigin);
                    const firstDest =
                      transferRouteOptions.find((r) => r.origin === nextOrigin)?.destination || '';
                    setTransferDestination(firstDest);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-tech-blue focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">-- Seleccionar Origen --</option>
                  {transferAvailableOrigins.map((o) => (
                    <option key={o} value={o}>
                      ✈️ {o}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Punto de Llegada
                </label>
                <select
                  value={transferDestination}
                  disabled={!transferOrigin}
                  onChange={(e) => setTransferDestination(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-tech-blue focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                >
                  <option value="">-- Seleccionar Destino --</option>
                  {transferAvailableDestinations.map((d) => (
                    <option key={d} value={d}>
                      🏨 {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Detalle de Vuelo / Hotel / Nota (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej. Vuelo AR 1450 / Habitación 304"
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-tech-blue focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* 3. LÓGICA MOVILIDAD URBANA (GOOGLE MAPS + NOMENCLADOR TUCUMÁN) */}
        {serviceType === 'MU' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Origen del Viaje
                </label>
                {defaultOriginAddress && (
                  <button
                    type="button"
                    onClick={() => {
                      const addr = defaultOriginAddress.trim();
                      setMuOriginAddress(addr);
                      setMuOriginCoords(defaultOriginCoords || resolveTucumanAddressCoords(addr));
                    }}
                    className="text-[10px] font-black text-vial-orange hover:underline"
                  >
                    Restaurar Domicilio del Aliado
                  </button>
                )}
              </div>
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
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Destino Final
              </label>
              <GoogleAddressAutocomplete
                value={muDestAddress}
                onChange={setMuDestAddress}
                onSelect={(addr, coords) => {
                  setMuDestAddress(addr);
                  setMuDestCoords(coords);
                }}
                placeholder="¿A dónde se dirige?"
              />

              {/* Botones rápidos de destinos frecuentes en Tucumán para cotizar en 1 clic */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {TUCUMAN_PLACES_GAZETTEER.slice(0, 5).map((place) => (
                  <button
                    key={place.label}
                    type="button"
                    onClick={() => {
                      if (!muOriginAddress.trim()) {
                        const defaultOrigin =
                          defaultOriginAddress?.trim() ||
                          'Plaza Independencia (Centro, San Miguel de Tucumán)';
                        setMuOriginAddress(defaultOrigin);
                        setMuOriginCoords(
                          defaultOriginCoords || resolveTucumanAddressCoords(defaultOrigin)
                        );
                      }
                      setMuDestAddress(place.label);
                      setMuDestCoords({ lat: place.lat, lng: place.lng });
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-vial-orange text-[10px] font-bold text-slate-600 transition-colors"
                  >
                    📍 {place.label.split('(')[0].split('·')[0].trim()}
                  </button>
                ))}
              </div>
            </div>

            {distanceKm > 0 && (
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
                <span className="flex items-center">
                  <Navigation className="h-4 w-4 text-vial-orange mr-1.5 rotate-45" />
                  Ruta Calculada:
                </span>
                <span className="text-tech-blue font-black">
                  {distanceKm} KM ({durationMin} min aprox.)
                </span>
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
            {filteredMuTariffs.map((tariff) => {
              const det = calculateTariffDetails(tariff);
              const isSelected = tariff.id === (currentTariff?.id || selectedTariffId);
              const catObj = categories.find((c) => c.id === tariff.category);
              const carImg =
                catObj?.icon &&
                (catObj.icon.startsWith('http') ||
                  catObj.icon.startsWith('/') ||
                  catObj.icon.startsWith('data:'))
                  ? catObj.icon
                  : (tariff.category || '').toLowerCase().includes('vip') ||
                      (tariff.category || '').toLowerCase().includes('premium')
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
                  <div className="flex justify-between items-start gap-2">
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

                  <div className="w-full h-14 my-1 flex items-center justify-center">
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
            <span className="text-sm font-black text-tech-blue">
              ${financial.finalPassengerPrice.toLocaleString('es-AR')}
            </span>
          </div>

          {b2bPartner && financial.finalPassengerPrice > 0 && (
            <div className="flex justify-between items-center rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-emerald-900 font-black">
              <span className="flex items-center gap-1.5 text-[11px]">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                Tu Comisión Aliado B2B ({b2bPartner.cabCommissionPct}%):
              </span>
              <span className="text-xs font-black text-emerald-700">
                +${financial.b2bPartnerCommissionAmt.toLocaleString('es-AR')}
              </span>
            </div>
          )}

          <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200 space-y-1.5 text-[11px] text-slate-500">
            <div className="flex justify-between font-semibold">
              <span>Comisión Total Plataforma ({currentTariff?.commissionRate ?? 15}%):</span>
              <span className="font-bold text-slate-700">
                ${Math.round(financial.commissionAmount).toLocaleString('es-AR')}
              </span>
            </div>

            <div className="pl-2 border-l-2 border-indigo-200 space-y-1 text-[10px] text-slate-500 bg-white/80 p-2 rounded-lg">
              <div className="flex justify-between font-bold text-indigo-900">
                <span>Base Imponible Neta (s/ IVA):</span>
                <span>${financial.commissionNetWithoutIva.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-amber-700">
                <span>Débito Fiscal IVA ({currentTariff?.iva ?? 21}%):</span>
                <span className="font-semibold">-${financial.ivaAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-rose-700">
                <span>IIBB DGR ({currentTariff?.iibb ?? 3.5}% s/ Neto sin IVA):</span>
                <span className="font-semibold">-${financial.iibbAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-rose-700">
                <span>TEM Municipal ({currentTariff?.taxMunicipal ?? 1.5}% s/ Neto sin IVA):</span>
                <span className="font-semibold">-${financial.taxMunicipalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-indigo-700 pt-1 border-t border-slate-100">
                <span>Margen Neto TravelCab (Post-Impuestos):</span>
                <span>${financial.platformCleanMargin.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between font-bold text-emerald-700 pt-1 border-t border-slate-200">
              <span>Monto Neto Estimado Conductor:</span>
              <span className="text-xs font-black">
                ${financial.driverNetEarnings.toLocaleString('es-AR')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Botón de Despacho */}
      <div className="mt-5">
        <button
          type="button"
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
