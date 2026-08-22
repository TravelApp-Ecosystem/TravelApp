'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calculator, ArrowLeft, Plus, Save, Sparkles, CheckCircle2, Ticket,
  Palmtree, DollarSign, Percent, Bus, Plane, Hotel, Utensils, Gift,
  ShieldCheck, UserCheck, PlusCircle, Trash2, FileText, ChevronDown,
  ChevronUp, ArrowRight, Award, Globe, MapPin, Calendar, HelpCircle,
  FileCheck, Layers, ExternalLink, Info, AlertTriangle, Printer,
  TrendingUp, BarChart3, PieChart, CheckCircle, X
} from 'lucide-react';
import { collection, setDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  TripScope, CurrencyType, IvaRate, TransportType, FlightMode,
  FoodPlan, RoomCategory, OrganizedTripQuote, RoomCalculationResult,
  AdditionalServiceItem, BusConfig, FlightConfig, LodgingConfig,
  LodgingHotelStay, LodgingRoomRate,
  FoodPlanConfig, CourtesyConfig, CoordinatorConfig, TravelAssistanceConfig,
  RewardsFinancialConfig
} from '@/types/experiences';

export default function ExperienceQuoterPage() {
  const router = useRouter();

  // -------------------------------------------------------------
  // 1. INFORMACIÓN GENERAL & CONFIGURACIÓN BIMONETARIA
  // -------------------------------------------------------------
  const [title, setTitle] = useState('Norte Argentino Fascinante');
  const [destination, setDestination] = useState('Salta, Jujuy y Cafayate');
  const [departureOrigin, setDepartureOrigin] = useState('San Miguel de Tucumán');
  const [departureDate, setDepartureDate] = useState('2026-10-12');
  const [returnDate, setReturnDate] = useState('2026-10-18');
  const [scope, setScope] = useState<TripScope>('Nacional');

  // Tipo de Cambio & Percepciones
  const [exchangeRate, setExchangeRate] = useState<number>(1350); // 1 USD = $1350 ARS
  const [usdToArsPerceptionPercent, setUsdToArsPerceptionPercent] = useState<number>(30); // 30% percepciones para viajes USD cobrados en ARS

  // Moneda Objetivo: Nacional = ARS, Internacional = USD
  const targetCurrency: CurrencyType = scope === 'Nacional' ? 'ARS' : 'USD';

  // -------------------------------------------------------------
  // 2. MÓDULO TRANSPORTE
  // -------------------------------------------------------------
  const [transportType, setTransportType] = useState<TransportType>('Bus');

  // Configuración Bus
  const [busConfig, setBusConfig] = useState<BusConfig>({
    provider: 'Flecha Bus Chárter / Plusmar',
    totalCharterPrice: 3800000,
    currency: 'ARS',
    ivaRate: '21',
    seatsTotal: 55,
    seatsCama: 15,
    seatsSemiCama: 40,
    calculationBasePax: 42,
    backupDocs: [{ name: 'Contrato_Transporte_2026.pdf', notes: 'Tarifa corporativa congelada' }]
  });

  // Configuración Avión
  const [flightConfig, setFlightConfig] = useState<FlightConfig>({
    mode: 'Cupo_Grupo',
    provider: 'Aerolíneas Argentinas / Flybondi',
    currency: 'USD',
    ivaRate: 'Exento',
    netBaseFarePerPax: 180,
    taxesPerPax: 45,
    totalCharterPrice: 18500,
    calculationBasePax: 40,
    backupDocs: [{ name: 'Bloqueo_Cupos_GDS.pdf', notes: 'PNR de grupo confirmado' }]
  });

  // -------------------------------------------------------------
  // 3. MÓDULO ALOJAMIENTO (MÚLTIPLES HOTELES / CIRCUITO MULTICIUDAD)
  // -------------------------------------------------------------
  const [hotelsList, setHotelsList] = useState<LodgingHotelStay[]>([
    {
      id: 'hotel-1',
      city: 'Salta Capital',
      hotelName: 'Hotel Alejandro I (5★)',
      foodPlan: 'Media_Pension',
      nightsCount: 3,
      currency: 'ARS',
      ivaRate: '21',
      rooms: {
        single: { enabled: true, ratePerNightPerPax: 95000 },
        doble: { enabled: true, ratePerNightPerPax: 55000 },
        triple: { enabled: true, ratePerNightPerPax: 44000 },
        cuadruple: { enabled: true, ratePerNightPerPax: 38000 },
        quintuple: { enabled: false, ratePerNightPerPax: 34000 }
      },
      backupDocs: [{ name: 'Convenio_AlejandroI.pdf', notes: 'Convenio bloque mayorista' }]
    },
    {
      id: 'hotel-2',
      city: 'Cafayate',
      hotelName: 'Cabañas de Viña & Spa (4★)',
      foodPlan: 'Desayuno',
      nightsCount: 2,
      currency: 'ARS',
      ivaRate: '21',
      rooms: {
        single: { enabled: true, ratePerNightPerPax: 85000 },
        doble: { enabled: true, ratePerNightPerPax: 48000 },
        triple: { enabled: true, ratePerNightPerPax: 39000 },
        cuadruple: { enabled: true, ratePerNightPerPax: 33000 },
        quintuple: { enabled: false, ratePerNightPerPax: 30000 }
      },
      backupDocs: [{ name: 'Convenio_CabanasVina.pdf', notes: 'Convenio temporada' }]
    }
  ]);
  const [activeHotelIdx, setActiveHotelIdx] = useState<number>(0);

  // -------------------------------------------------------------
  // 4. PLAN DE COMIDAS EXTRA
  // -------------------------------------------------------------
  const [foodPlanExtra, setFoodPlanExtra] = useState<FoodPlanConfig>({
    unitPricePerMeal: 18000,
    mealsCount: 3,
    currency: 'ARS',
    ivaRate: '21',
    description: '3 Almuerzos en paradores de ruta y peña folclórica'
  });

  // -------------------------------------------------------------
  // 5. LIBERADOS / CORTESÍAS
  // -------------------------------------------------------------
  const [courtesyConfig, setCourtesyConfig] = useState<CourtesyConfig>({
    hasCourtesy: true,
    courtesyPaxCount: 2 // 1 Coordinador + 1 Chofer con servicios absorbidos
  });

  // -------------------------------------------------------------
  // 6. COORDINACIÓN & GUÍAS
  // -------------------------------------------------------------
  const [coordinationConfig, setCoordinationConfig] = useState<CoordinatorConfig>({
    coordinatorFeeTotal: 450000,
    perDiemTotal: 150000,
    currency: 'ARS'
  });

  // -------------------------------------------------------------
  // 7. ASISTENCIA AL VIAJERO
  // -------------------------------------------------------------
  const [assistanceConfig, setAssistanceConfig] = useState<TravelAssistanceConfig>({
    provider: 'Universal Assistance / Assist Card',
    coverageType: 'Nacional Premium 500k',
    ratePerDay: 4500,
    daysCount: 6,
    currency: 'ARS',
    ivaRate: '21',
    backupDocs: [{ name: 'Cotizacion_Universal_2026.pdf', notes: 'Póliza colectiva receptiva' }]
  });

  // -------------------------------------------------------------
  // 8. SERVICIOS ADICIONALES (HASTA 20 ITEMS)
  // -------------------------------------------------------------
  const [extraServices, setExtraServices] = useState<AdditionalServiceItem[]>([
    {
      id: 'ext-1',
      name: 'Entradas Parques Nacionales & Museos',
      provider: 'Adm. Parques Nacionales',
      costType: 'por_pax',
      netCost: 15000,
      currency: 'ARS',
      ivaRate: 'Exento'
    },
    {
      id: 'ext-2',
      name: 'Cata y Degustación en Bodega Cafayate',
      provider: 'Bodega Domingo Molina',
      costType: 'por_pax',
      netCost: 22000,
      currency: 'ARS',
      ivaRate: '21'
    }
  ]);

  // -------------------------------------------------------------
  // 9. VARIABLES FINANCIERAS, COMISIONES & ESTRUCTURA TARIFARIA
  // -------------------------------------------------------------
  const [financials, setFinancials] = useState<RewardsFinancialConfig & { sellerCommissionPercent?: number }>({
    markupPercent: 28, // 28% Margen Bruto Agencia
    sellerCommissionPercent: 3, // 3% Comisión Vendedor Interno
    affiliateCommissionPercent: 5, // 5% Comisión de Promotor/Afiliado
    rewardsDiscountPercent: 12, // 12% Descuento Miembro Rewards
    rewardsEarnMultiplier: scope === 'Nacional' ? 0.001 : 1, // 1 pt cada $1000 ARS en nac, o 1 pt por USD en int
    rewardsPointValue: scope === 'Nacional' ? 15 : 0.012, // $15 ARS por punto o $0.012 USD por punto
    exchangeRate: 1350,
    usdToArsPerceptionPercent: 30
  });

  // Modalidad Tarifaria: Matriz SGL/DBL/TPL vs Tarifa Única Plana por Pax
  const [pricingStructure, setPricingStructure] = useState<'per_room_type' | 'flat_single_price'>('per_room_type');
  const [flatPriceAmount, setFlatPriceAmount] = useState<number>(185000);
  const [featuredRoomType, setFeaturedRoomType] = useState<RoomCategory>('doble');

  // UI State
  const [activeSection, setActiveSection] = useState<string>('all');
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showProfitAnalysisModal, setShowProfitAnalysisModal] = useState(false);

  // -------------------------------------------------------------
  // HELPER DE CONVERSIÓN BIMONETARIA
  // -------------------------------------------------------------
  const convertAmountToTarget = (amount: number, fromCurrency: CurrencyType, iva: IvaRate): number => {
    // 1. Aplicar IVA si corresponde
    let ivaMultiplier = 1;
    if (iva === '21') ivaMultiplier = 1.21;
    if (iva === '10.5') ivaMultiplier = 1.105;

    const amountWithIva = amount * ivaMultiplier;

    // 2. Si ya está en la moneda objetivo, no requiere conversión
    if (fromCurrency === targetCurrency) {
      return amountWithIva;
    }

    // 3. Conversión de moneda
    if (targetCurrency === 'ARS' && fromCurrency === 'USD') {
      // De USD a ARS (Viaje Nacional)
      return amountWithIva * exchangeRate;
    }

    if (targetCurrency === 'USD' && fromCurrency === 'ARS') {
      // De ARS a USD (Viaje Internacional)
      return exchangeRate > 0 ? amountWithIva / exchangeRate : 0;
    }

    return amountWithIva;
  };

  // Base de cálculo general de pasajeros
  const basePax = transportType === 'Bus'
    ? Math.max(1, busConfig.calculationBasePax)
    : flightConfig.mode === 'Charter'
      ? Math.max(1, flightConfig.calculationBasePax)
      : 1;

  // -------------------------------------------------------------
  // CÁLCULO DE COSTOS UNITARIOS POR MÓDULO (En Moneda Objetivo)
  // -------------------------------------------------------------

  // 1. Costo Transporte por Pax
  const transportCostPerPax = useMemo(() => {
    if (transportType === 'Bus') {
      const totalBusInTarget = convertAmountToTarget(busConfig.totalCharterPrice, busConfig.currency, busConfig.ivaRate);
      return totalBusInTarget / basePax;
    } else {
      if (flightConfig.mode === 'Cupo_Grupo') {
        const fareInTarget = convertAmountToTarget(flightConfig.netBaseFarePerPax, flightConfig.currency, flightConfig.ivaRate);
        const taxesInTarget = convertAmountToTarget(flightConfig.taxesPerPax, flightConfig.currency, 'Exento');
        return fareInTarget + taxesInTarget;
      } else {
        const totalCharterInTarget = convertAmountToTarget(flightConfig.totalCharterPrice, flightConfig.currency, flightConfig.ivaRate);
        return totalCharterInTarget / basePax;
      }
    }
  }, [transportType, busConfig, flightConfig, basePax, targetCurrency, exchangeRate]);

  // 2. Costo Comidas Extra por Pax
  const foodCostPerPax = useMemo(() => {
    const totalFoodUnit = foodPlanExtra.unitPricePerMeal * foodPlanExtra.mealsCount;
    return convertAmountToTarget(totalFoodUnit, foodPlanExtra.currency, foodPlanExtra.ivaRate);
  }, [foodPlanExtra, targetCurrency, exchangeRate]);

  // 3. Costo Coordinador por Pax
  const coordinationCostPerPax = useMemo(() => {
    const totalCoord = coordinationConfig.coordinatorFeeTotal + coordinationConfig.perDiemTotal;
    const totalInTarget = convertAmountToTarget(totalCoord, coordinationConfig.currency, 'Sin IVA' as IvaRate);
    return totalInTarget / basePax;
  }, [coordinationConfig, basePax, targetCurrency, exchangeRate]);

  // 4. Costo Asistencia por Pax
  const assistanceCostPerPax = useMemo(() => {
    const totalAssistance = assistanceConfig.ratePerDay * assistanceConfig.daysCount;
    return convertAmountToTarget(totalAssistance, assistanceConfig.currency, assistanceConfig.ivaRate);
  }, [assistanceConfig, targetCurrency, exchangeRate]);

  // 5. Costo Servicios Adicionales por Pax
  const extraServicesCostPerPax = useMemo(() => {
    return extraServices.reduce((acc, item) => {
      const itemCostInTarget = convertAmountToTarget(item.netCost, item.currency, item.ivaRate);
      if (item.costType === 'por_pax') {
        return acc + itemCostInTarget;
      } else {
        return acc + (itemCostInTarget / basePax);
      }
    }, 0);
  }, [extraServices, basePax, targetCurrency, exchangeRate]);

  // Total Noches sumadas de todo el itinerario hotelero
  const totalLodgingNights = useMemo(() => {
    return hotelsList.reduce((acc, h) => acc + (Number(h.nightsCount) || 0), 0);
  }, [hotelsList]);

  // Costo total de estadía de todos los hoteles para una categoría de habitación
  const calculateTotalLodgingForRoom = (roomKey: RoomCategory) => {
    return hotelsList.reduce((acc, h) => {
      const room = h.rooms[roomKey];
      if (!room || !room.enabled) return acc;
      const stayCost = (room.ratePerNightPerPax || 0) * (h.nightsCount || 0);
      return acc + convertAmountToTarget(stayCost, h.currency, h.ivaRate);
    }, 0);
  };

  // 6. Costo Promedio de Alojamiento por Pax (usado para costear el liberado)
  const averageLodgingPerPax = useMemo(() => {
    return calculateTotalLodgingForRoom('doble');
  }, [hotelsList, targetCurrency, exchangeRate]);

  // 7. Costo Prorrateado de Liberados por Pax Pagante
  const courtesyCostPerPax = useMemo(() => {
    if (!courtesyConfig.hasCourtesy || courtesyConfig.courtesyPaxCount <= 0) return 0;

    // Servicios netos consumidos por cada liberado (Alojamiento + Comidas + Seguro + Extras por pax)
    const singleCourtesyNetServices = averageLodgingPerPax + foodCostPerPax + assistanceCostPerPax + extraServicesCostPerPax;
    const totalCourtesyCost = singleCourtesyNetServices * courtesyConfig.courtesyPaxCount;

    // Se absorbe y divide entre la BASE de pasajeros cotizados
    return totalCourtesyCost / basePax;
  }, [courtesyConfig, averageLodgingPerPax, foodCostPerPax, assistanceCostPerPax, extraServicesCostPerPax, basePax]);

  // Costo Fijo Común (Sin Alojamiento) por cada pasajero
  const commonFixedCostPerPax = transportCostPerPax + foodCostPerPax + coordinationCostPerPax + assistanceCostPerPax + extraServicesCostPerPax + courtesyCostPerPax;

  // -------------------------------------------------------------
  // MATRIZ DE PRECIOS POR HABITACIÓN
  // -------------------------------------------------------------
  const matrixResults: RoomCalculationResult[] = useMemo(() => {
    const roomKeys: { key: RoomCategory; label: string }[] = [
      { key: 'single', label: 'Habitación Single (Individual)' },
      { key: 'doble', label: 'Habitación Doble (Matrimonial / Twin)' },
      { key: 'triple', label: 'Habitación Triple' },
      { key: 'cuadruple', label: 'Habitación Cuádruple' },
      { key: 'quintuple', label: 'Habitación Quíntuple' }
    ];

    return roomKeys.map(({ key, label }) => {
      const isEnabledAnywhere = hotelsList.some(h => h.rooms[key]?.enabled);
      if (!isEnabledAnywhere) {
        return {
          roomType: key,
          roomLabel: label,
          enabled: false,
          costNetoTargetCurrency: 0,
          pvpTargetCurrency: 0,
          pvpRewardsTargetCurrency: 0,
          pointsEarned: 0,
          pointsRequiredForRedemption: 0,
          secondaryCurrencyLabel: targetCurrency === 'ARS' ? 'USD' : 'ARS',
          pvpSecondaryCurrency: 0
        };
      }

      // Costo de alojamiento acumulado de esta habitación en todos los hoteles
      const roomStayCostInTarget = calculateTotalLodgingForRoom(key);

      // Costo Neto Total por Pax
      const costNeto = commonFixedCostPerPax + roomStayCostInTarget;

      // Margen / Markup
      const markupAmount = costNeto * (financials.markupPercent / 100);
      // Comisión Promotor
      const commissionAmount = (costNeto + markupAmount) * (financials.affiliateCommissionPercent / 100);

      // PVP Sugerido
      const pvpTarget = Math.round(costNeto + markupAmount + commissionAmount);

      // Tarifa Socios Rewards (con descuento)
      const pvpRewards = Math.round(pvpTarget * (1 - (financials.rewardsDiscountPercent / 100)));

      // Puntos que Acumula (según alcance)
      const pointsEarned = scope === 'Nacional'
        ? Math.round(pvpTarget * financials.rewardsEarnMultiplier)
        : Math.round(pvpTarget * financials.rewardsEarnMultiplier);

      // Puntos Requeridos para Canje Total
      const pointsRequiredForRedemption = financials.rewardsPointValue > 0
        ? Math.round(pvpTarget / financials.rewardsPointValue)
        : 0;

      // Conversión Secundaria
      let pvpSecondary = 0;
      if (targetCurrency === 'ARS') {
        // En Nacional (ARS) -> Secondary es USD
        pvpSecondary = exchangeRate > 0 ? Math.round(pvpTarget / exchangeRate) : 0;
      } else {
        // En Internacional (USD) -> Secondary es ARS CON Percepciones
        const arsWithoutPerception = pvpTarget * exchangeRate;
        const perceptionAmount = arsWithoutPerception * (usdToArsPerceptionPercent / 100);
        pvpSecondary = Math.round(arsWithoutPerception + perceptionAmount);
      }

      return {
        roomType: key,
        roomLabel: label,
        enabled: true,
        costNetoTargetCurrency: Math.round(costNeto),
        pvpTargetCurrency: pvpTarget,
        pvpRewardsTargetCurrency: pvpRewards,
        pointsEarned,
        pointsRequiredForRedemption,
        secondaryCurrencyLabel: targetCurrency === 'ARS' ? 'USD (Referencia)' : 'ARS (Final con Percepciones)',
        pvpSecondaryCurrency: pvpSecondary
      };
    });
  }, [
    hotelsList, commonFixedCostPerPax, financials, scope,
    targetCurrency, exchangeRate, usdToArsPerceptionPercent
  ]);

  // -------------------------------------------------------------
  // ANÁLISIS DE GANANCIA Y BALANCE FINANCIERO EN TIEMPO REAL
  // -------------------------------------------------------------
  const tripFinancialAnalysis = useMemo(() => {
    // 1. Costos Fijos Totales de la Salida
    const transportTotal = transportType === 'Bus'
      ? convertAmountToTarget(busConfig.totalCharterPrice, busConfig.currency, busConfig.ivaRate)
      : (flightConfig.mode === 'Charter'
          ? convertAmountToTarget(flightConfig.totalCharterPrice || 0, flightConfig.currency, flightConfig.ivaRate)
          : 0);

    const coordinationTotal = convertAmountToTarget(
      (coordinationConfig.coordinatorFeeTotal || 0) + (coordinationConfig.perDiemTotal || 0),
      coordinationConfig.currency,
      'Sin IVA' as IvaRate
    );
    const courtesyTotal = courtesyCostPerPax * basePax;
    const fixedExtrasTotal = extraServices
      .filter(i => i.costType === 'grupal_fijo')
      .reduce((sum, item) => sum + convertAmountToTarget(item.netCost, item.currency, item.ivaRate), 0);

    const totalFixedCosts = transportTotal + coordinationTotal + courtesyTotal + fixedExtrasTotal;

    // 2. Costos Variables por Pasajero (Alojamiento Base Doble de referencia + comidas + extras por pax)
    const lodgingStayRef = calculateTotalLodgingForRoom('doble');
    const foodExtraPax = convertAmountToTarget(
      (foodPlanExtra.unitPricePerMeal || 0) * (foodPlanExtra.mealsCount || 0),
      foodPlanExtra.currency,
      foodPlanExtra.ivaRate
    );
    const assistancePax = convertAmountToTarget(assistanceConfig.ratePerDay * assistanceConfig.daysCount, assistanceConfig.currency, assistanceConfig.ivaRate);
    const variableExtrasPax = extraServices
      .filter(i => i.costType === 'por_pax')
      .reduce((sum, item) => sum + convertAmountToTarget(item.netCost, item.currency, item.ivaRate), 0);

    const flightSeatPax = (transportType === 'Avion' && flightConfig.mode === 'Cupo_Grupo')
      ? convertAmountToTarget((flightConfig.netBaseFarePerPax || 0) + (flightConfig.taxesPerPax || 0), flightConfig.currency, flightConfig.ivaRate)
      : 0;

    const variableCostPerPax = lodgingStayRef + foodExtraPax + assistancePax + variableExtrasPax + flightSeatPax;
    const totalVariableCostsForGroup = variableCostPerPax * basePax;

    // 3. Costo Total Operativo de la Salida
    const totalOperatingCost = totalFixedCosts + totalVariableCostsForGroup;

    // 4. Tarifas y Márgenes (Base Doble de referencia o tarifa plana)
    const markupPercent = financials.markupPercent;
    const sellerCommissionPercent = financials.sellerCommissionPercent || 3;
    const affiliateCommissionPercent = financials.affiliateCommissionPercent || 5;

    let pvpPerPax = 185000;
    let costNetoPax = 120000;

    if (pricingStructure === 'flat_single_price') {
      pvpPerPax = flatPriceAmount;
      costNetoPax = Math.round(totalFixedCosts / basePax + variableCostPerPax);
    } else {
      const refRoom = matrixResults.find(m => m.roomType === featuredRoomType && m.enabled)
        || matrixResults.find(m => m.roomType === 'doble' && m.enabled)
        || matrixResults.find(m => m.enabled)
        || matrixResults[0];
      costNetoPax = refRoom?.costNetoTargetCurrency || Math.round(totalFixedCosts / basePax + variableCostPerPax);
      pvpPerPax = refRoom?.pvpTargetCurrency || Math.round(costNetoPax * (1 + markupPercent / 100 + affiliateCommissionPercent / 100));
    }

    const agencyProfitPerPax = Math.round(costNetoPax * (markupPercent / 100));
    const sellerCommissionPerPax = Math.round((costNetoPax + agencyProfitPerPax) * (sellerCommissionPercent / 100));
    const affiliateCommissionPerPax = Math.round((costNetoPax + agencyProfitPerPax) * (affiliateCommissionPercent / 100));

    // 5. Facturación e Ingresos de la Salida Completa (Base Pax)
    const totalGrossRevenue = pvpPerPax * basePax;
    const totalAgencyProfit = agencyProfitPerPax * basePax;
    const totalSellerCommission = sellerCommissionPerPax * basePax;
    const totalAffiliateCommission = affiliateCommissionPerPax * basePax;

    // 6. Margen de Contribución & Punto de Equilibrio (Break-Even)
    const contributionMarginPerPax = pvpPerPax - variableCostPerPax - sellerCommissionPerPax - affiliateCommissionPerPax;
    const breakEvenPax = contributionMarginPerPax > 0
      ? Math.ceil(totalFixedCosts / contributionMarginPerPax)
      : basePax;

    // 7. Detalle exhaustivo por categoría de habitación
    const roomBreakdown = matrixResults.filter(m => m.enabled).map(r => {
      const roomCostNet = r.costNetoTargetCurrency;
      const roomAgencyProfit = Math.round(roomCostNet * (markupPercent / 100));
      const roomSellerComm = Math.round((roomCostNet + roomAgencyProfit) * (sellerCommissionPercent / 100));
      const roomAffiliateComm = Math.round((roomCostNet + roomAgencyProfit) * (affiliateCommissionPercent / 100));
      const roomPvp = r.pvpTargetCurrency;
      const totalTripProfitIfAll = roomAgencyProfit * basePax;
      const totalRevenueIfAll = roomPvp * basePax;

      return {
        roomType: r.roomType,
        roomLabel: r.roomLabel,
        costNetoPax: roomCostNet,
        agencyProfitPax: roomAgencyProfit,
        sellerCommPax: roomSellerComm,
        affiliateCommPax: roomAffiliateComm,
        pvpPax: roomPvp,
        totalTripProfitIfAll,
        totalRevenueIfAll
      };
    });

    return {
      basePax,
      totalFixedCosts: Math.round(totalFixedCosts),
      totalVariableCostsForGroup: Math.round(totalVariableCostsForGroup),
      totalOperatingCost: Math.round(totalOperatingCost),
      variableCostPerPax: Math.round(variableCostPerPax),
      fixedCostPerPax: Math.round(totalFixedCosts / (basePax || 1)),
      costNetoPax: Math.round(costNetoPax),
      pvpPerPax,
      agencyProfitPerPax,
      sellerCommissionPerPax,
      affiliateCommissionPerPax,
      totalGrossRevenue,
      totalAgencyProfit,
      totalSellerCommission,
      totalAffiliateCommission,
      contributionMarginPerPax: Math.round(contributionMarginPerPax),
      breakEvenPax,
      roomBreakdown
    };
  }, [
    basePax, transportType, busConfig, flightConfig, coordinationConfig,
    courtesyConfig, extraServices, hotelsList, foodPlanExtra, assistanceConfig,
    financials, matrixResults, targetCurrency, exchangeRate, usdToArsPerceptionPercent,
    pricingStructure, flatPriceAmount, featuredRoomType
  ]);

  // Manejo de Agregar Ítem Extra
  const handleAddExtraService = () => {
    if (extraServices.length >= 20) {
      alert('Máximo de 20 servicios adicionales alcanzado.');
      return;
    }
    const newItem: AdditionalServiceItem = {
      id: `ext-${Date.now()}`,
      name: 'Nuevo Servicio / Excursión',
      provider: 'Proveedor Local',
      costType: 'por_pax',
      netCost: 10000,
      currency: targetCurrency,
      ivaRate: '21'
    };
    setExtraServices([...extraServices, newItem]);
  };

  const handleRemoveExtraService = (id: string) => {
    setExtraServices(extraServices.filter(i => i.id !== id));
  };

  const handleUpdateExtraService = (id: string, field: keyof AdditionalServiceItem, value: any) => {
    setExtraServices(extraServices.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // -------------------------------------------------------------
  // GESTIÓN DE HOTELES EN ITINERARIO (MULTI-CIUDAD)
  // -------------------------------------------------------------
  const handleAddHotelStay = () => {
    const nextIdx = hotelsList.length + 1;
    const newStay: LodgingHotelStay = {
      id: `hotel-${Date.now()}`,
      city: `Ciudad ${nextIdx}`,
      hotelName: `Hotel / Complejo ${nextIdx}`,
      foodPlan: 'Media_Pension',
      nightsCount: 2,
      currency: targetCurrency,
      ivaRate: '21',
      rooms: {
        single: { enabled: true, ratePerNightPerPax: 65000 },
        doble: { enabled: true, ratePerNightPerPax: 38000 },
        triple: { enabled: true, ratePerNightPerPax: 30000 },
        cuadruple: { enabled: true, ratePerNightPerPax: 25000 },
        quintuple: { enabled: false, ratePerNightPerPax: 22000 }
      }
    };
    setHotelsList([...hotelsList, newStay]);
    setActiveHotelIdx(hotelsList.length);
  };

  const handleRemoveHotelStay = (idxToRemove: number) => {
    if (hotelsList.length <= 1) {
      alert('El viaje debe contar con al menos un hotel configurado.');
      return;
    }
    const updated = hotelsList.filter((_, i) => i !== idxToRemove);
    setHotelsList(updated);
    if (activeHotelIdx >= updated.length) {
      setActiveHotelIdx(updated.length - 1);
    }
  };

  const updateActiveHotelField = (field: keyof LodgingHotelStay, value: any) => {
    setHotelsList(prev => {
      const copy = [...prev];
      copy[activeHotelIdx] = { ...copy[activeHotelIdx], [field]: value };
      return copy;
    });
  };

  const updateActiveHotelRoom = (rKey: RoomCategory, field: keyof LodgingRoomRate, value: any) => {
    setHotelsList(prev => {
      const copy = [...prev];
      const currentRooms = copy[activeHotelIdx].rooms;
      copy[activeHotelIdx] = {
        ...copy[activeHotelIdx],
        rooms: {
          ...currentRooms,
          [rKey]: { ...currentRooms[rKey], [field]: value }
        }
      };
      return copy;
    });
  };

  // -------------------------------------------------------------
  // GUARDAR COTIZACIÓN EN FIRESTORE
  // -------------------------------------------------------------
  const handleSaveQuote = async (action: 'draft' | 'catalog' | 'reservation') => {
    setSavingStatus(action);
    setFeedbackMessage(null);

    try {
      const quoteId = `EXP-Q-${Math.floor(1000 + Math.random() * 9000)}`;

      const consolidatedLodging: LodgingConfig = {
        hotelName: hotelsList.map(h => `${h.city}: ${h.hotelName}`).join(' | '),
        foodPlan: hotelsList[0]?.foodPlan || 'Media_Pension',
        nightsCount: totalLodgingNights,
        currency: hotelsList[0]?.currency || 'ARS',
        ivaRate: hotelsList[0]?.ivaRate || '21',
        rooms: {
          single: { enabled: true, ratePerNightPerPax: calculateTotalLodgingForRoom('single') },
          doble: { enabled: true, ratePerNightPerPax: calculateTotalLodgingForRoom('doble') },
          triple: { enabled: true, ratePerNightPerPax: calculateTotalLodgingForRoom('triple') },
          cuadruple: { enabled: true, ratePerNightPerPax: calculateTotalLodgingForRoom('cuadruple') },
          quintuple: { enabled: false, ratePerNightPerPax: calculateTotalLodgingForRoom('quintuple') }
        },
        hotelsList: hotelsList,
        backupDocs: hotelsList.flatMap(h => h.backupDocs || [])
      };

      const quoteData: OrganizedTripQuote = {
        id: quoteId,
        title,
        destination,
        departureOrigin,
        departureDate,
        returnDate,
        scope,
        targetCurrency,
        transportType,
        transportBus: busConfig,
        transportFlight: flightConfig,
        lodging: consolidatedLodging,
        foodPlanExtra,
        courtesy: courtesyConfig,
        coordination: coordinationConfig,
        assistance: assistanceConfig,
        extraServices,
        financials: {
          ...financials,
          exchangeRate,
          usdToArsPerceptionPercent
        },
        matrixResults,
        status: action === 'catalog' ? 'Publicada_Catalogo' : 'Confirmada',
        createdAt: new Date().toISOString()
      };

      // 1. Guardar en colección experience_quotes
      await setDoc(doc(db, 'experience_quotes', quoteId), quoteData);

      // 2. Si es para el catálogo, también lo publicamos en la colección 'experiences'
      if (action === 'catalog') {
        let activeBasePrice = 150000;
        let activeRewardsPrice = 120000;
        let activePoints = 100;

        if (pricingStructure === 'flat_single_price') {
          activeBasePrice = flatPriceAmount;
          activeRewardsPrice = Math.round(flatPriceAmount * (1 - financials.rewardsDiscountPercent / 100));
          activePoints = Math.round(flatPriceAmount * financials.rewardsEarnMultiplier);
        } else {
          const chosen = matrixResults.find(m => m.roomType === featuredRoomType && m.enabled)
            || matrixResults.find(m => m.roomType === 'doble' && m.enabled)
            || matrixResults.find(m => m.enabled)
            || matrixResults[0];
          activeBasePrice = chosen?.pvpTargetCurrency || 150000;
          activeRewardsPrice = chosen?.pvpRewardsTargetCurrency || 120000;
          activePoints = chosen?.pointsEarned || 100;
        }

        await setDoc(doc(db, 'experiences', quoteId), {
          id: quoteId,
          title,
          location: destination,
          price: activeBasePrice,
          currency: targetCurrency,
          priceRewards: activeRewardsPrice,
          pointsEarned: activePoints,
          pricingStructure,
          featuredRoomType,
          tripType: 'Grupal',
          scope,
          transportation: transportType === 'Bus' ? 'Bus Chárter de Lujo' : 'Aéreo Comercial / Chárter',
          departureDate,
          departureOrigin,
          services: [
            consolidatedLodging.hotelName,
            `Régimen: ${consolidatedLodging.foodPlan.replace('_', ' ')}`,
            transportType === 'Bus' ? `Bus Chárter ${busConfig.seatsTotal} Butacas` : `Aéreo ${flightConfig.provider}`,
            `Coordinador Acompañante`,
            `Asistencia Médica ${assistanceConfig.coverageType}`
          ],
          imageUrl: scope === 'Nacional'
            ? 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&q=80&w=1000'
            : 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1000',
          description: `Salida grupal organizada a ${destination} con base de ${basePax} pasajeros. Circuito hotelero en: ${consolidatedLodging.hotelName} (${consolidatedLodging.nightsCount} noches totales).`,
          observations: `Cotización bimonetaria fijada a TC $${exchangeRate} ${scope === 'Internacional' ? `(+${usdToArsPerceptionPercent}% per.)` : ''}.`,
          availability: 'Disponible',
          quoteId: quoteId,
          roomPricing: matrixResults.reduce((acc, r) => {
            if (r.enabled) acc[r.roomType] = r.pvpTargetCurrency;
            return acc;
          }, {} as Record<string, number>),
          createdAt: new Date().toISOString()
        });

        setFeedbackMessage({
          type: 'success',
          text: `¡Cotización ${quoteId} publicada con éxito en el Catálogo de Experiencias!`
        });
      } else if (action === 'reservation') {
        // Redirigir al flujo de reservas pasando el quoteId
        router.push(`/experiences/reservations/new?quoteId=${quoteId}&title=${encodeURIComponent(title)}&price=${matrixResults.find(m => m.enabled)?.pvpTargetCurrency || 0}&currency=${targetCurrency}`);
        return;
      } else {
        setFeedbackMessage({
          type: 'success',
          text: `¡Cotización ${quoteId} guardada correctamente como presupuesto!`
        });
      }

      setSavingStatus(null);
    } catch (error: any) {
      console.error('Error saving quote:', error);
      setFeedbackMessage({
        type: 'error',
        text: `Error al procesar la cotización: ${error.message}`
      });
      setSavingStatus(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      {/* HEADER SUPERIOR */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/experiences"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition shadow-sm"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-tech-blue/10 px-3 py-0.5 text-xs font-bold text-tech-blue uppercase tracking-wider">
                  Salidas Propias Organizadas
                </span>
                <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${scope === 'Nacional' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                  {scope === 'Nacional' ? '🇦🇷 Salida Nacional (ARS)' : '🌎 Salida Internacional (USD)'}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 mt-1">
                <Calculator className="h-8 w-8 text-tech-blue" />
                Cotizador de Viajes Bimonetario
              </h1>
            </div>
          </div>

          {/* SELECTOR NACIONAL / INTERNACIONAL & BARRA BIMONETARIA */}
          <div className="flex flex-wrap items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setScope('Nacional');
                  if (transportType === 'Bus') setBusConfig(p => ({ ...p, ivaRate: '21' }));
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  scope === 'Nacional'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🇦🇷 Nacional (ARS)
              </button>
              <button
                type="button"
                onClick={() => {
                  setScope('Internacional');
                  if (transportType === 'Bus') setBusConfig(p => ({ ...p, ivaRate: 'Exento' }));
                  setFlightConfig(p => ({ ...p, ivaRate: 'Exento' }));
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  scope === 'Internacional'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🌎 Internacional (USD)
              </button>
            </div>

            {/* Input Tipo de Cambio */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500">TC (USD/ARS): $</span>
              <input
                type="number"
                value={exchangeRate}
                onChange={e => setExchangeRate(Number(e.target.value))}
                className="w-20 bg-transparent text-xs font-black text-slate-800 focus:outline-none"
              />
            </div>

            {/* Percepciones si es Internacional */}
            {scope === 'Internacional' && (
              <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                <span className="text-xs font-bold text-amber-700">Percepciones ARS:</span>
                <input
                  type="number"
                  value={usdToArsPerceptionPercent}
                  onChange={e => setUsdToArsPerceptionPercent(Number(e.target.value))}
                  className="w-12 bg-transparent text-xs font-black text-amber-900 focus:outline-none"
                />
                <span className="text-xs font-bold text-amber-700">%</span>
              </div>
            )}

            {/* Botones de Análisis de Rentabilidad y Balance Imprimible */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowProfitAnalysisModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-tech-blue hover:bg-slate-900 text-white text-xs font-black transition shadow-sm"
              >
                <BarChart3 className="h-4 w-4 text-emerald-400" />
                Análisis de Ganancias
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowProfitAnalysisModal(true);
                  setTimeout(() => {
                    window.print();
                  }, 400);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition border border-slate-200"
              >
                <Printer className="h-4 w-4 text-slate-600" />
                Imprimir Balance
              </button>
            </div>
          </div>
        </div>

        {feedbackMessage && (
          <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${
            feedbackMessage.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">{feedbackMessage.text}</p>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* COLUMNA IZQUIERDA: CONFIGURACIÓN Y MÓDULOS DE COSTO (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* 1. DATOS BÁSICOS DEL VIAJE */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-tech-blue" />
              1. Cabecera e Itinerario del Viaje
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1">Nombre / Título de la Salida</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-tech-blue/20 focus:border-tech-blue"
                  placeholder="Ej: Aventura en Cataratas del Iguazú"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Destino Principal</label>
                <input
                  type="text"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-tech-blue/20 focus:border-tech-blue"
                  placeholder="Ej: Salta & Jujuy"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Origen de Salida</label>
                <input
                  type="text"
                  value={departureOrigin}
                  onChange={e => setDepartureOrigin(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-tech-blue/20 focus:border-tech-blue"
                  placeholder="Ej: Retiro / Tucumán / Córdoba"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Fecha de Salida</label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={e => setDepartureDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-tech-blue/20 focus:border-tech-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Fecha de Regreso</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={e => setReturnDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-tech-blue/20 focus:border-tech-blue"
                />
              </div>
            </div>
          </div>

          {/* 2. MÓDULO TRANSPORTE */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                {transportType === 'Bus' ? <Bus className="h-5 w-5 text-emerald-600" /> : <Plane className="h-5 w-5 text-blue-600" />}
                2. Módulo de Transporte ({transportType})
              </h2>
              {/* Switch Bus / Avión */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTransportType('Bus')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    transportType === 'Bus' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Bus Chárter
                </button>
                <button
                  type="button"
                  onClick={() => setTransportType('Avion')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    transportType === 'Avion' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Avión
                </button>
              </div>
            </div>

            {transportType === 'Bus' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1">Empresa Prestadora / Transportista</label>
                    <input
                      type="text"
                      value={busConfig.provider}
                      onChange={e => setBusConfig(p => ({ ...p, provider: e.target.value }))}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Costo Total del Chárter</label>
                    <div className="flex">
                      <select
                        value={busConfig.currency}
                        onChange={e => setBusConfig(p => ({ ...p, currency: e.target.value as CurrencyType }))}
                        className="rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-2 text-xs font-bold text-slate-700"
                      >
                        <option value="ARS">ARS ($)</option>
                        <option value="USD">USD (U$D)</option>
                      </select>
                      <input
                        type="number"
                        value={busConfig.totalCharterPrice}
                        onChange={e => setBusConfig(p => ({ ...p, totalCharterPrice: Number(e.target.value) }))}
                        className="w-full rounded-r-xl border border-slate-200 px-3.5 py-2 text-sm font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Tratamiento IVA</label>
                    <select
                      value={busConfig.ivaRate}
                      onChange={e => setBusConfig(p => ({ ...p, ivaRate: e.target.value as IvaRate }))}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 font-medium"
                    >
                      <option value="21">Gravado 21%</option>
                      <option value="10.5">Gravado 10.5%</option>
                      <option value="Exento">Exento de IVA (Servicio Internacional)</option>
                      <option value="0">Sin IVA / Factura C</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Butacas Disponibles</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400">Total</span>
                        <input
                          type="number"
                          value={busConfig.seatsTotal}
                          onChange={e => setBusConfig(p => ({ ...p, seatsTotal: Number(e.target.value) }))}
                          className="w-full p-2 text-xs rounded-lg border border-slate-200 font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Cama</span>
                        <input
                          type="number"
                          value={busConfig.seatsCama}
                          onChange={e => setBusConfig(p => ({ ...p, seatsCama: Number(e.target.value) }))}
                          className="w-full p-2 text-xs rounded-lg border border-slate-200"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Semi-Cama</span>
                        <input
                          type="number"
                          value={busConfig.seatsSemiCama}
                          onChange={e => setBusConfig(p => ({ ...p, seatsSemiCama: Number(e.target.value) }))}
                          className="w-full p-2 text-xs rounded-lg border border-slate-200"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Base de Cotización (Pasajeros)
                    </label>
                    <input
                      type="number"
                      value={busConfig.calculationBasePax}
                      onChange={e => setBusConfig(p => ({ ...p, calculationBasePax: Number(e.target.value) }))}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 font-bold text-indigo-700 bg-indigo-50/40"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Punto de equilibrio para prorratear el costo.</p>
                  </div>
                </div>

                {/* Subtotal Transporte */}
                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800">
                    Valor de Butaca Resultante ({targetCurrency}):
                  </span>
                  <span className="text-sm font-black text-emerald-700">
                    ${Math.round(transportCostPerPax).toLocaleString()} {targetCurrency} / pax
                  </span>
                </div>
              </div>
            ) : (
              // Configuración Avión
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Modalidad Aérea</label>
                    <select
                      value={flightConfig.mode}
                      onChange={e => setFlightConfig(p => ({ ...p, mode: e.target.value as FlightMode }))}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 font-medium"
                    >
                      <option value="Cupo_Grupo">Cupo / Bloqueo de Grupo (GDS)</option>
                      <option value="Charter">Chárter Aéreo Completo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Aerolínea / Proveedor</label>
                    <input
                      type="text"
                      value={flightConfig.provider}
                      onChange={e => setFlightConfig(p => ({ ...p, provider: e.target.value }))}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 font-medium"
                    />
                  </div>

                  {flightConfig.mode === 'Cupo_Grupo' ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Tarifa Neta Aérea por Pax</label>
                        <div className="flex">
                          <select
                            value={flightConfig.currency}
                            onChange={e => setFlightConfig(p => ({ ...p, currency: e.target.value as CurrencyType }))}
                            className="rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-2 text-xs font-bold"
                          >
                            <option value="USD">USD</option>
                            <option value="ARS">ARS</option>
                          </select>
                          <input
                            type="number"
                            value={flightConfig.netBaseFarePerPax}
                            onChange={e => setFlightConfig(p => ({ ...p, netBaseFarePerPax: Number(e.target.value) }))}
                            className="w-full rounded-r-xl border border-slate-200 px-3.5 py-2 text-sm font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Impuestos / Tasas por Pax</label>
                        <input
                          type="number"
                          value={flightConfig.taxesPerPax}
                          onChange={e => setFlightConfig(p => ({ ...p, taxesPerPax: Number(e.target.value) }))}
                          className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 font-bold"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Costo Total Chárter Aéreo</label>
                        <div className="flex">
                          <select
                            value={flightConfig.currency}
                            onChange={e => setFlightConfig(p => ({ ...p, currency: e.target.value as CurrencyType }))}
                            className="rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-2 text-xs font-bold"
                          >
                            <option value="USD">USD</option>
                            <option value="ARS">ARS</option>
                          </select>
                          <input
                            type="number"
                            value={flightConfig.totalCharterPrice}
                            onChange={e => setFlightConfig(p => ({ ...p, totalCharterPrice: Number(e.target.value) }))}
                            className="w-full rounded-r-xl border border-slate-200 px-3.5 py-2 text-sm font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Base Pasajeros Chárter</label>
                        <input
                          type="number"
                          value={flightConfig.calculationBasePax}
                          onChange={e => setFlightConfig(p => ({ ...p, calculationBasePax: Number(e.target.value) }))}
                          className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 font-bold"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-800">
                    Costo Aéreo Resultante ({targetCurrency}):
                  </span>
                  <span className="text-sm font-black text-blue-700">
                    ${Math.round(transportCostPerPax).toLocaleString()} {targetCurrency} / pax
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 3. MÓDULO ALOJAMIENTO (MÚLTIPLES HOTELES / CIRCUITO MULTICIUDAD) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Hotel className="h-5 w-5 text-indigo-600" />
                  3. Alojamiento &amp; Circuito Multi-Ciudad
                </h2>
                <p className="text-xs text-slate-400">
                  Configurá uno o múltiples hoteles a lo largo del recorrido con sus noches y regímenes respectivos.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black">
                  {hotelsList.length} {hotelsList.length === 1 ? 'Hotel' : 'Hoteles'} · {totalLodgingNights} Noches Totales
                </span>
                <button
                  type="button"
                  onClick={handleAddHotelStay}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1 shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" /> + Agregar Hotel / Ciudad
                </button>
              </div>
            </div>

            {/* TABS DE HOTELES / CIUDADES */}
            <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
              {hotelsList.map((hotel, hIdx) => (
                <div
                  key={hotel.id || hIdx}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition cursor-pointer flex-shrink-0 ${
                    activeHotelIdx === hIdx
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 font-black shadow-sm ring-1 ring-indigo-500'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                  }`}
                  onClick={() => setActiveHotelIdx(hIdx)}
                >
                  <span>🏨 {hIdx + 1}. {hotel.city || 'Ciudad'}: {hotel.hotelName || 'Hotel'} ({hotel.nightsCount}n)</span>
                  {hotelsList.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveHotelStay(hIdx);
                      }}
                      className="text-slate-400 hover:text-red-600 p-0.5"
                      title="Eliminar este hotel"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* FORMULARIO DEL HOTEL ACTIVO */}
            {hotelsList[activeHotelIdx] && (
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Ciudad / Destino de Estadía</label>
                    <input
                      type="text"
                      value={hotelsList[activeHotelIdx].city}
                      onChange={e => updateActiveHotelField('city', e.target.value)}
                      placeholder="Ej: Salta Capital / Cafayate"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Nombre del Hotel / Complejo</label>
                    <input
                      type="text"
                      value={hotelsList[activeHotelIdx].hotelName}
                      onChange={e => updateActiveHotelField('hotelName', e.target.value)}
                      placeholder="Ej: Hotel Alejandro I"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Régimen de Comidas</label>
                    <select
                      value={hotelsList[activeHotelIdx].foodPlan}
                      onChange={e => updateActiveHotelField('foodPlan', e.target.value as FoodPlan)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
                    >
                      <option value="Solo_Alojamiento">Solo Alojamiento</option>
                      <option value="Desayuno">Con Desayuno</option>
                      <option value="Media_Pension">Media Pensión</option>
                      <option value="Pension_Completa">Pensión Completa</option>
                      <option value="All_Inclusive">All Inclusive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Noches en este Hotel</label>
                    <input
                      type="number"
                      min={1}
                      value={hotelsList[activeHotelIdx].nightsCount}
                      onChange={e => updateActiveHotelField('nightsCount', Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-black text-indigo-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Moneda del Hotel</label>
                    <select
                      value={hotelsList[activeHotelIdx].currency}
                      onChange={e => updateActiveHotelField('currency', e.target.value as CurrencyType)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
                    >
                      <option value="ARS">ARS ($)</option>
                      <option value="USD">USD (U$D)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">IVA Alojamiento</label>
                    <select
                      value={hotelsList[activeHotelIdx].ivaRate}
                      onChange={e => updateActiveHotelField('ivaRate', e.target.value as IvaRate)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
                    >
                      <option value="21">21%</option>
                      <option value="10.5">10.5%</option>
                      <option value="Exento">Exento</option>
                      <option value="0">0%</option>
                    </select>
                  </div>
                </div>

                {/* TABLA DE TARIFAS POR HABITACIÓN PARA ESTE HOTEL */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Activo</th>
                        <th className="p-2.5">Tipo Habitación</th>
                        <th className="p-2.5">Tarifa Noche / Pax</th>
                        <th className="p-2.5 text-right">Subtotal Estadía ({targetCurrency})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(['single', 'doble', 'triple', 'cuadruple', 'quintuple'] as RoomCategory[]).map(rKey => {
                        const currentHotel = hotelsList[activeHotelIdx];
                        const room = currentHotel.rooms[rKey] || { enabled: false, ratePerNightPerPax: 0 };
                        const subtotalStay = convertAmountToTarget(
                          room.ratePerNightPerPax * (currentHotel.nightsCount || 0),
                          currentHotel.currency,
                          currentHotel.ivaRate
                        );

                        return (
                          <tr key={rKey} className={room.enabled ? 'bg-white' : 'bg-slate-50/50 opacity-60'}>
                            <td className="p-2.5">
                              <input
                                type="checkbox"
                                checked={room.enabled}
                                onChange={e => updateActiveHotelRoom(rKey, 'enabled', e.target.checked)}
                                className="rounded text-tech-blue focus:ring-tech-blue h-4 w-4"
                              />
                            </td>
                            <td className="p-2.5 font-bold text-slate-700 capitalize">
                              {rKey === 'single' ? 'Single (1 Pax)' :
                               rKey === 'doble' ? 'Doble (2 Pax)' :
                               rKey === 'triple' ? 'Triple (3 Pax)' :
                               rKey === 'cuadruple' ? 'Cuádruple (4 Pax)' : 'Quíntuple (5 Pax)'}
                            </td>
                            <td className="p-2.5">
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400 font-bold">{currentHotel.currency}</span>
                                <input
                                  type="number"
                                  disabled={!room.enabled}
                                  value={room.ratePerNightPerPax}
                                  onChange={e => updateActiveHotelRoom(rKey, 'ratePerNightPerPax', Number(e.target.value))}
                                  className="w-28 px-2 py-1 text-xs font-bold rounded border border-slate-200 focus:outline-none"
                                />
                              </div>
                            </td>
                            <td className="p-2.5 text-right font-black text-slate-800">
                              {room.enabled ? `$${Math.round(subtotalStay).toLocaleString()} ${targetCurrency}` : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* RESUMEN GLOBAL ACUMULADO DE TODOS LOS HOTELES */}
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-black text-indigo-950 block">Resumen del Circuito de Alojamiento</span>
                <span className="text-indigo-700 font-medium">
                  {totalLodgingNights} noches combinadas en {hotelsList.length} hoteles.
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                <span className="bg-white px-2.5 py-1 rounded-lg border border-indigo-100 text-indigo-900">
                  Doble Total: ${Math.round(calculateTotalLodgingForRoom('doble')).toLocaleString()} {targetCurrency}
                </span>
                <span className="bg-white px-2.5 py-1 rounded-lg border border-indigo-100 text-indigo-900">
                  Single Total: ${Math.round(calculateTotalLodgingForRoom('single')).toLocaleString()} {targetCurrency}
                </span>
              </div>
            </div>
          </div>

          {/* 4. PLAN DE COMIDAS & LIBERADOS & COORDINACIÓN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Comidas Extra */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Utensils className="h-4 w-4 text-amber-600" />
                4. Gastronomía Extra en Ruta
              </h3>
              <input
                type="text"
                value={foodPlanExtra.description}
                onChange={e => setFoodPlanExtra(p => ({ ...p, description: e.target.value }))}
                placeholder="Descripción del menú o paradas"
                className="w-full p-2 text-xs rounded-lg border border-slate-200"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400">Precio Menú</span>
                  <input
                    type="number"
                    value={foodPlanExtra.unitPricePerMeal}
                    onChange={e => setFoodPlanExtra(p => ({ ...p, unitPricePerMeal: Number(e.target.value) }))}
                    className="w-full p-2 text-xs font-bold rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Cant. Comidas</span>
                  <input
                    type="number"
                    value={foodPlanExtra.mealsCount}
                    onChange={e => setFoodPlanExtra(p => ({ ...p, mealsCount: Number(e.target.value) }))}
                    className="w-full p-2 text-xs font-bold rounded-lg border border-slate-200"
                  />
                </div>
              </div>
              <div className="text-right text-xs font-bold text-amber-700">
                Subtotal: ${Math.round(foodCostPerPax).toLocaleString()} {targetCurrency} / pax
              </div>
            </div>

            {/* Liberados & Cortesías */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Gift className="h-4 w-4 text-purple-600" />
                5. Liberados y Cortesías
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">¿Incluye Liberados?</span>
                <input
                  type="checkbox"
                  checked={courtesyConfig.hasCourtesy}
                  onChange={e => setCourtesyConfig(p => ({ ...p, hasCourtesy: e.target.checked }))}
                  className="rounded text-purple-600 h-4 w-4"
                />
              </div>
              {courtesyConfig.hasCourtesy && (
                <div>
                  <span className="text-[10px] text-slate-400">Cantidad de Pasajeros Liberados</span>
                  <input
                    type="number"
                    value={courtesyConfig.courtesyPaxCount}
                    onChange={e => setCourtesyConfig(p => ({ ...p, courtesyPaxCount: Number(e.target.value) }))}
                    className="w-full p-2 text-xs font-bold rounded-lg border border-slate-200"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Se absorbe el costo neto total dividido sobre la base de {basePax} pasajeros.
                  </p>
                </div>
              )}
              <div className="text-right text-xs font-bold text-purple-700">
                Incidencia: +${Math.round(courtesyCostPerPax).toLocaleString()} {targetCurrency} / pax
              </div>
            </div>

            {/* Coordinador */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-indigo-600" />
                6. Coordinación y Guías
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400">Honorarios Totales</span>
                  <input
                    type="number"
                    value={coordinationConfig.coordinatorFeeTotal}
                    onChange={e => setCoordinationConfig(p => ({ ...p, coordinatorFeeTotal: Number(e.target.value) }))}
                    className="w-full p-2 text-xs font-bold rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Viáticos Totales</span>
                  <input
                    type="number"
                    value={coordinationConfig.perDiemTotal}
                    onChange={e => setCoordinationConfig(p => ({ ...p, perDiemTotal: Number(e.target.value) }))}
                    className="w-full p-2 text-xs font-bold rounded-lg border border-slate-200"
                  />
                </div>
              </div>
              <div className="text-right text-xs font-bold text-indigo-700">
                Subtotal: ${Math.round(coordinationCostPerPax).toLocaleString()} {targetCurrency} / pax
              </div>
            </div>

            {/* Asistencia al Viajero */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                7. Asistencia Médica
              </h3>
              <input
                type="text"
                value={assistanceConfig.provider}
                onChange={e => setAssistanceConfig(p => ({ ...p, provider: e.target.value }))}
                placeholder="Prestador"
                className="w-full p-2 text-xs rounded-lg border border-slate-200"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400">Costo Día / Pax</span>
                  <input
                    type="number"
                    value={assistanceConfig.ratePerDay}
                    onChange={e => setAssistanceConfig(p => ({ ...p, ratePerDay: Number(e.target.value) }))}
                    className="w-full p-2 text-xs font-bold rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Días de Viaje</span>
                  <input
                    type="number"
                    value={assistanceConfig.daysCount}
                    onChange={e => setAssistanceConfig(p => ({ ...p, daysCount: Number(e.target.value) }))}
                    className="w-full p-2 text-xs font-bold rounded-lg border border-slate-200"
                  />
                </div>
              </div>
              <div className="text-right text-xs font-bold text-emerald-700">
                Subtotal: ${Math.round(assistanceCostPerPax).toLocaleString()} {targetCurrency} / pax
              </div>
            </div>
          </div>

          {/* 8. SERVICIOS ADICIONALES (HASTA 20 ITEMS) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-tech-blue" />
                  8. Servicios Adicionales & Excursiones ({extraServices.length}/20)
                </h2>
                <p className="text-xs text-slate-400">
                  Entradas a parques, catas de vino, guías de sitio, transfers locales, etc.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddExtraService}
                disabled={extraServices.length >= 20}
                className="px-3 py-1.5 bg-tech-blue/10 text-tech-blue text-xs font-bold rounded-xl hover:bg-tech-blue hover:text-white transition flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> Agregar Ítem
              </button>
            </div>

            <div className="space-y-3">
              {extraServices.map((item, idx) => (
                <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                  <div className="md:col-span-4">
                    <span className="text-[10px] text-slate-400 font-bold">Servicio #{idx + 1}</span>
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => handleUpdateExtraService(item.id, 'name', e.target.value)}
                      className="w-full p-1.5 text-xs font-medium rounded border border-slate-200 bg-white"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <span className="text-[10px] text-slate-400 font-bold">Proveedor</span>
                    <input
                      type="text"
                      value={item.provider}
                      onChange={e => handleUpdateExtraService(item.id, 'provider', e.target.value)}
                      className="w-full p-1.5 text-xs rounded border border-slate-200 bg-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold">Tipo Costo</span>
                    <select
                      value={item.costType}
                      onChange={e => handleUpdateExtraService(item.id, 'costType', e.target.value)}
                      className="w-full p-1.5 text-xs rounded border border-slate-200 bg-white font-medium"
                    >
                      <option value="por_pax">Por Pax</option>
                      <option value="grupal_fijo">Grupal Fijo</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold">Costo ({item.currency})</span>
                    <div className="flex">
                      <input
                        type="number"
                        value={item.netCost}
                        onChange={e => handleUpdateExtraService(item.id, 'netCost', Number(e.target.value))}
                        className="w-full p-1.5 text-xs font-bold rounded-l border border-slate-200 bg-white"
                      />
                      <select
                        value={item.currency}
                        onChange={e => handleUpdateExtraService(item.id, 'currency', e.target.value as CurrencyType)}
                        className="rounded-r border border-l-0 border-slate-200 bg-slate-100 text-[10px] font-bold px-1"
                      >
                        <option value="ARS">ARS</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>

                  <div className="md:col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveExtraService(item.id)}
                      className="text-red-500 hover:text-red-700 p-1 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 text-right text-xs font-bold text-slate-700">
              Total Extras por Pax: ${Math.round(extraServicesCostPerPax).toLocaleString()} {targetCurrency}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: MOTOR FINANCIERO, REWARDS Y MATRIZ DE PRECIOS (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">

          {/* MOTOR FINANCIERO & REWARDS SETTINGS */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-base font-bold flex items-center gap-2 text-white">
                <Percent className="h-5 w-5 text-emerald-400" />
                Márgenes, Comisión y Rewards
              </h2>
              <span className="text-xs px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-full border border-emerald-500/30">
                {targetCurrency} Activo
              </span>
            </div>

            {/* Sliders / Inputs Financieros y Desglose en $ */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-300">Markup Ganancia Agencia:</span>
                  <span className="text-emerald-400">{financials.markupPercent}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  value={financials.markupPercent}
                  onChange={e => setFinancials(p => ({ ...p, markupPercent: Number(e.target.value) }))}
                  className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-300">Comisión Vendedor Interno:</span>
                  <span className="text-purple-400">{financials.sellerCommissionPercent || 3}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={financials.sellerCommissionPercent || 3}
                  onChange={e => setFinancials(p => ({ ...p, sellerCommissionPercent: Number(e.target.value) }))}
                  className="w-full accent-purple-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-300">Comisión Promotor / Afiliado:</span>
                  <span className="text-blue-400">{financials.affiliateCommissionPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={financials.affiliateCommissionPercent}
                  onChange={e => setFinancials(p => ({ ...p, affiliateCommissionPercent: Number(e.target.value) }))}
                  className="w-full accent-blue-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-300">Descuento Socios Rewards:</span>
                  <span className="text-amber-400">{financials.rewardsDiscountPercent}% OFF</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={financials.rewardsDiscountPercent}
                  onChange={e => setFinancials(p => ({ ...p, rewardsDiscountPercent: Number(e.target.value) }))}
                  className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* DESGLOSE DE GANANCIAS Y BALANCE EN TIEMPO REAL */}
              <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <span className="font-black text-[11px] text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4" /> Rentabilidad en Vivo ({basePax} Pax):
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowProfitAnalysisModal(true)}
                    className="text-[10px] font-bold text-blue-400 hover:text-blue-300 underline"
                  >
                    Ver Detalle
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-750">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Facturación Total Salida:</span>
                    <span className="font-black text-white text-xs">${tripFinancialAnalysis.totalGrossRevenue.toLocaleString()} {targetCurrency}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Costo Total Salida:</span>
                    <span className="font-bold text-slate-300 text-xs">${tripFinancialAnalysis.totalOperatingCost.toLocaleString()} {targetCurrency}</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ganancia Neta Agencia / Pax:</span>
                    <span className="font-black text-emerald-400">+${tripFinancialAnalysis.agencyProfitPerPax.toLocaleString()} {targetCurrency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ganancia Total Salida ({basePax} pax):</span>
                    <span className="font-black text-emerald-400 text-sm">+${tripFinancialAnalysis.totalAgencyProfit.toLocaleString()} {targetCurrency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Comisiones Vendedores ({financials.sellerCommissionPercent || 3}%):</span>
                    <span className="font-bold text-purple-300">+${tripFinancialAnalysis.totalSellerCommission.toLocaleString()} {targetCurrency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Comisiones Afiliados ({financials.affiliateCommissionPercent}%):</span>
                    <span className="font-bold text-blue-300">+${tripFinancialAnalysis.totalAffiliateCommission.toLocaleString()} {targetCurrency}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-700">
                    <span className="text-slate-300">Punto de Equilibrio (Break-Even):</span>
                    <span className="font-black text-amber-400">{tripFinancialAnalysis.breakEvenPax} / {basePax} Pax</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowProfitAnalysisModal(true)}
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-700 hover:bg-slate-650 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <BarChart3 className="h-3.5 w-3.5 text-emerald-400" /> Abrir Informe & Balance Imprimible
                </button>
              </div>
            </div>

            {/* REWARDS CALCULATION RULES */}
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Award className="h-4 w-4" />
                Reglas de Puntos ({scope})
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400">Acumulación (Multiplicador)</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={financials.rewardsEarnMultiplier}
                    onChange={e => setFinancials(p => ({ ...p, rewardsEarnMultiplier: Number(e.target.value) }))}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white font-bold p-1.5 rounded-lg"
                  />
                  <span className="text-[9px] text-slate-400">
                    {scope === 'Nacional' ? '1 pt cada $1.000 ARS' : '1 pt por USD'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Valor Canje Punto ({targetCurrency})</span>
                  <input
                    type="number"
                    step="0.01"
                    value={financials.rewardsPointValue}
                    onChange={e => setFinancials(p => ({ ...p, rewardsPointValue: Number(e.target.value) }))}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 text-white font-bold p-1.5 rounded-lg"
                  />
                  <span className="text-[9px] text-slate-400">Valor monetario por punto</span>
                </div>
              </div>
            </div>
          </div>

          {/* CONFIGURACIÓN DE PUBLICACIÓN & ESTRUCTURA TARIFARIA */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-600" />
              Modalidad Tarifaria &amp; Publicación
            </h2>

            {/* Selector: Matriz por Habitación vs Tarifa Única Plana */}
            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">Esquema de Precios para el Catálogo:</label>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPricingStructure('per_room_type')}
                  className={`flex-1 py-2 rounded-lg font-bold transition text-xs ${
                    pricingStructure === 'per_room_type' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Matriz por Habitación (SGL/DBL/TPL)
                </button>
                <button
                  type="button"
                  onClick={() => setPricingStructure('flat_single_price')}
                  className={`flex-1 py-2 rounded-lg font-bold transition text-xs ${
                    pricingStructure === 'flat_single_price' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Tarifa Única Plana por Pax
                </button>
              </div>
            </div>

            {/* Si es Tarifa Única Plana */}
            {pricingStructure === 'flat_single_price' ? (
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 space-y-2 text-xs">
                <span className="font-black text-purple-900 block">Tarifa Única por Pasajero ({targetCurrency}):</span>
                <input
                  type="number"
                  value={flatPriceAmount}
                  onChange={e => setFlatPriceAmount(Number(e.target.value))}
                  className="w-full p-2 rounded-xl bg-white border border-purple-300 font-black text-purple-900 text-sm"
                />
                <span className="text-[10px] text-purple-700 block">
                  Esta tarifa aplicará para todos los pasajeros sin distinción de habitación.
                </span>
              </div>
            ) : (
              /* Selector de Tarifa Destacada a Publicar */
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-slate-700 block">Tarifa Principal a Mostrar en Marketplace / Catálogo:</span>
                <select
                  value={featuredRoomType}
                  onChange={e => setFeaturedRoomType(e.target.value as RoomCategory)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 text-xs"
                >
                  <option value="doble">Base Doble (Recomendada - Tarifa estándar)</option>
                  <option value="triple">Base Triple</option>
                  <option value="cuadruple">Base Cuádruple</option>
                  <option value="single">Base Single (Individual)</option>
                </select>
                <span className="text-[10px] text-slate-400 block">
                  Evita que se publique el valor Single más alto por defecto en la portada del catálogo.
                </span>
              </div>
            )}
          </div>

          {/* MATRIZ DE PRECIOS FINAL */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <Ticket className="h-5 w-5 text-tech-blue" />
                Matriz de Precios por Habitación
              </h2>
              <span className="text-xs font-bold text-slate-500">Base {basePax} Pax</span>
            </div>

            <div className="space-y-4">
              {matrixResults.filter(m => m.enabled).map(room => (
                <div
                  key={room.roomType}
                  className="rounded-2xl border border-slate-200 p-4 bg-gradient-to-br from-white to-slate-50/60 shadow-sm hover:border-tech-blue transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-sm text-slate-800">{room.roomLabel}</span>
                    <span className="text-xs font-black text-tech-blue bg-tech-blue/10 px-2 py-0.5 rounded-md">
                      PVP ${room.pvpTargetCurrency.toLocaleString()} {targetCurrency}
                    </span>
                  </div>

                  {/* Detalle Costos & Precios */}
                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t border-b border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Costo Neto:</span>
                      <span className="font-bold text-slate-600">${room.costNetoTargetCurrency.toLocaleString()} {targetCurrency}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">{room.secondaryCurrencyLabel}:</span>
                      <span className="font-bold text-indigo-600">${room.pvpSecondaryCurrency.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Socio Rewards (-{financials.rewardsDiscountPercent}%):</span>
                      <span className="font-extrabold text-emerald-600">${room.pvpRewardsTargetCurrency.toLocaleString()} {targetCurrency}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Acumula / Canje Total:</span>
                      <span className="font-bold text-amber-600">+{room.pointsEarned} / {room.pointsRequiredForRedemption.toLocaleString()} pts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="pt-4 space-y-3">
              <button
                type="button"
                onClick={() => handleSaveQuote('catalog')}
                disabled={savingStatus !== null}
                className="w-full py-3 px-4 bg-tech-blue text-white text-sm font-black rounded-2xl hover:bg-blue-700 transition shadow-md shadow-tech-blue/20 flex items-center justify-center gap-2"
              >
                {savingStatus === 'catalog' ? (
                  <>Guardando en Catálogo...</>
                ) : (
                  <>
                    <Palmtree className="h-5 w-5" />
                    Publicar en Catálogo de Experiencias
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSaveQuote('reservation')}
                disabled={savingStatus !== null}
                className="w-full py-3 px-4 bg-emerald-600 text-white text-sm font-black rounded-2xl hover:bg-emerald-700 transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                <ArrowRight className="h-5 w-5" />
                Crear Reserva Directa con esta Cotización
              </button>

              <button
                type="button"
                onClick={() => handleSaveQuote('draft')}
                disabled={savingStatus !== null}
                className="w-full py-2.5 px-4 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                Guardar como Borrador de Presupuesto
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL / DOCUMENTO IMPRIMIBLE: BALANCE FINANCIERO DE SALIDA     */}
      {/* ------------------------------------------------------------- */}
      {showProfitAnalysisModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            
            {/* Header del Informe (Con Botones de Acción en Pantalla) */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-tech-blue/10 text-tech-blue text-[10px] font-black uppercase tracking-wider">
                    TravelApp Experiences · Control Financiero
                  </span>
                  <span className="text-xs text-slate-400 font-bold">
                    ID Ref: {title ? title.slice(0, 8).toUpperCase() : 'EXP'}-{Date.now().toString().slice(-4)}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Balance &amp; Análisis de Rentabilidad de Salida
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {title} · Destino: <strong>{destination}</strong> · Salida: <strong>{departureDate}</strong> ({basePax} Pax de Base)
                </p>
              </div>

              {/* Botonera de control */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-tech-blue hover:bg-slate-900 text-white rounded-xl text-xs font-black transition shadow-md"
                >
                  <Printer className="h-4 w-4" /> Imprimir Balance
                </button>
                <button
                  type="button"
                  onClick={() => setShowProfitAnalysisModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* 1. RESUMEN EJECUTIVO (KPIs) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Facturación Total (PVP)</span>
                <span className="text-lg font-black text-slate-900 mt-0.5 block">
                  ${tripFinancialAnalysis.totalGrossRevenue.toLocaleString()} {targetCurrency}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Base {basePax} pasajeros</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Costo Total Salida</span>
                <span className="text-lg font-black text-slate-700 mt-0.5 block">
                  ${tripFinancialAnalysis.totalOperatingCost.toLocaleString()} {targetCurrency}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Fijos + Variables</span>
              </div>

              <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200">
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">Ganancia Neta Agencia</span>
                <span className="text-lg font-black text-emerald-600 mt-0.5 block">
                  +${tripFinancialAnalysis.totalAgencyProfit.toLocaleString()} {targetCurrency}
                </span>
                <span className="text-[10px] text-emerald-700 font-bold">Markup: {financials.markupPercent}%</span>
              </div>

              <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200">
                <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">Punto de Equilibrio</span>
                <span className="text-lg font-black text-amber-900 mt-0.5 block">
                  {tripFinancialAnalysis.breakEvenPax} Pax
                </span>
                <span className="text-[10px] text-amber-700 font-medium">de {basePax} butacas totales</span>
              </div>
            </div>

            {/* 2. ESTRUCTURA DE COSTOS DETALLADA (FIJOS VS VARIABLES) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              
              {/* Costos Fijos */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-2">
                <div className="flex justify-between items-center border-b border-slate-200 pb-1.5 font-black text-slate-800">
                  <span>🏢 Costos Fijos Totales (Grupo)</span>
                  <span className="text-slate-900">${tripFinancialAnalysis.totalFixedCosts.toLocaleString()} {targetCurrency}</span>
                </div>
                <div className="space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Transporte Chárter ({transportType}):</span>
                    <span className="font-bold text-slate-800">
                      ${(transportType === 'Bus'
                        ? convertAmountToTarget(busConfig.totalCharterPrice, busConfig.currency, busConfig.ivaRate)
                        : (flightConfig.mode === 'Charter' ? convertAmountToTarget(flightConfig.totalCharterPrice || 0, flightConfig.currency, flightConfig.ivaRate) : 0)
                      ).toLocaleString()} {targetCurrency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Coordinador (Honorarios + Viáticos):</span>
                    <span className="font-bold text-slate-800">
                      ${convertAmountToTarget((coordinationConfig.coordinatorFeeTotal || 0) + (coordinationConfig.perDiemTotal || 0), coordinationConfig.currency, 'Sin IVA' as IvaRate).toLocaleString()} {targetCurrency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cortesías (Servicios Absorbidos):</span>
                    <span className="font-bold text-slate-800">
                      ${Math.round(courtesyCostPerPax * basePax).toLocaleString()} {targetCurrency}
                    </span>
                  </div>
                  {extraServices.filter(i => i.costType === 'grupal_fijo').length > 0 && (
                    <div className="flex justify-between">
                      <span>Servicios Extras Fijos ({extraServices.filter(i => i.costType === 'grupal_fijo').length}):</span>
                      <span className="font-bold text-slate-800">
                        ${extraServices.filter(i => i.costType === 'grupal_fijo').reduce((s, i) => s + convertAmountToTarget(i.netCost, i.currency, i.ivaRate), 0).toLocaleString()} {targetCurrency}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-500 font-bold">
                    <span>Incidencia Fija por Pasajero:</span>
                    <span>${tripFinancialAnalysis.fixedCostPerPax.toLocaleString()} {targetCurrency} / pax</span>
                  </div>
                </div>
              </div>

              {/* Costos Variables */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-2">
                <div className="flex justify-between items-center border-b border-slate-200 pb-1.5 font-black text-slate-800">
                  <span>👤 Costos Variables Unitarios (Por Pax)</span>
                  <span className="text-slate-900">${tripFinancialAnalysis.variableCostPerPax.toLocaleString()} {targetCurrency}</span>
                </div>
                <div className="space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Alojamiento Hoteles ({hotelsList.reduce((s, h) => s + h.nightsCount, 0)} Noches Base Dbl):</span>
                    <span className="font-bold text-slate-800">${calculateTotalLodgingForRoom('doble').toLocaleString()} {targetCurrency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Comidas / Pensión Adicional ({foodPlanExtra.mealsCount} comidas):</span>
                    <span className="font-bold text-slate-800">
                      ${convertAmountToTarget((foodPlanExtra.unitPricePerMeal || 0) * (foodPlanExtra.mealsCount || 0), foodPlanExtra.currency, foodPlanExtra.ivaRate).toLocaleString()} {targetCurrency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Asistencia Médica ({assistanceConfig.daysCount} días):</span>
                    <span className="font-bold text-slate-800">
                      ${convertAmountToTarget(assistanceConfig.ratePerDay * assistanceConfig.daysCount, assistanceConfig.currency, assistanceConfig.ivaRate).toLocaleString()} {targetCurrency}
                    </span>
                  </div>
                  {extraServices.filter(i => i.costType === 'por_pax').length > 0 && (
                    <div className="flex justify-between">
                      <span>Excursiones &amp; Extras por Pax:</span>
                      <span className="font-bold text-slate-800">
                        ${extraServices.filter(i => i.costType === 'por_pax').reduce((s, i) => s + convertAmountToTarget(i.netCost, i.currency, i.ivaRate), 0).toLocaleString()} {targetCurrency}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-500 font-bold">
                    <span>Subtotal Variables ({basePax} Pax):</span>
                    <span>${tripFinancialAnalysis.totalVariableCostsForGroup.toLocaleString()} {targetCurrency}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* 3. TABLA DE GANANCIA Y COMISIONES POR TIPO DE HABITACIÓN */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  📈 Desglose Exhaustivo de Ganancia &amp; Comisiones por Pasajero
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">Moneda: {targetCurrency}</span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 font-black text-slate-700 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">Habitación</th>
                      <th className="p-3">Costo Neto Pax</th>
                      <th className="p-3 text-emerald-700">Ganancia Agencia ({financials.markupPercent}%)</th>
                      <th className="p-3 text-purple-700">Vendedor ({financials.sellerCommissionPercent || 3}%)</th>
                      <th className="p-3 text-blue-700">Afiliado ({financials.affiliateCommissionPercent}%)</th>
                      <th className="p-3 text-right">PVP al Pax</th>
                      <th className="p-3 text-right text-emerald-700 font-black">Ganancia Salida ({basePax}p)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {tripFinancialAnalysis.roomBreakdown.map((row) => (
                      <tr key={row.roomType} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{row.roomLabel}</td>
                        <td className="p-3">${row.costNetoPax.toLocaleString()}</td>
                        <td className="p-3 text-emerald-600 font-black">+${row.agencyProfitPax.toLocaleString()}</td>
                        <td className="p-3 text-purple-600">+${row.sellerCommPax.toLocaleString()}</td>
                        <td className="p-3 text-blue-600">+${row.affiliateCommPax.toLocaleString()}</td>
                        <td className="p-3 text-right font-black text-slate-900">${row.pvpPax.toLocaleString()}</td>
                        <td className="p-3 text-right font-black text-emerald-700">+${row.totalTripProfitIfAll.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. TOTALES CONSOLIDADOS Y FIRMAS DE CONFORMIDAD */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="font-black text-slate-800 uppercase block text-[10px]">Observaciones Administrativas:</span>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Presupuesto calculado a Tipo de Cambio oficial fijado a ${exchangeRate} ARS/USD.
                  Las comisiones de vendedores y afiliados se liquidan contra reserva efectivamente señada o cancelada.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 sm:pt-0">
                <div className="border-t border-slate-300 pt-2 text-center text-[10px] text-slate-400 font-bold">
                  Firma Responsable Comercial
                </div>
                <div className="border-t border-slate-300 pt-2 text-center text-[10px] text-slate-400 font-bold">
                  Firma Auditoría / Dirección
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
