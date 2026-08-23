export type AvailabilityStatus = 'Disponible' | 'Cupos Limitados' | 'Agotado';
export type TripType = 'Individual' | 'Grupal';
export type TripScope = 'Nacional' | 'Internacional';
export type CurrencyType = 'ARS' | 'USD';
export type IvaRate = 'Exento' | '21' | '10.5' | '0';

export type TransportType = 'Bus' | 'Avion';
export type FlightMode = 'Cupo_Grupo' | 'Charter';
export type FoodPlan = 'Solo_Alojamiento' | 'Desayuno' | 'Media_Pension' | 'Pension_Completa' | 'All_Inclusive';
export type RoomCategory = 'single' | 'doble' | 'triple' | 'cuadruple' | 'quintuple';
export type ServiceCategory = 'Aereo' | 'Bus' | 'Hotel' | 'Traslados' | 'Excursiones' | 'Seguro' | 'Crucero' | 'Otro';
export type LiquidationPricingMode = 'comision_mayorista' | 'neto_markup';

export interface OperatorCustomChargeItem {
  id: string;
  name: string; // Ej: 'Tax aéreo Q/Fuel', 'Percepción AFIP/ARCA RG 4815', 'Fee de emisión mayorista', 'Asistencia médica obligatoria'
  amount: number;
}

export interface IndependentSupplierService {
  id: string;
  category: ServiceCategory;
  providerName: string; // Ej: 'Logan Travel', 'Julia Tours', 'Assist Card'
  bookingLocator: string; // PNR / Localizador
  description: string;
  pricingMode: LiquidationPricingMode;
  currency: CurrencyType;
  // Campos de cálculo
  grossPrice: number; // PVP al público o Tarifa Bruta Operador
  operatorCommissionPercent: number; // % Comisión cedida por el operador (ej: 10%)
  operatorCommissionAmount: number; // $ Comisión de agencia descontada
  isManualAgencyCommission?: boolean; // Control manual de comisión de agencia
  manualAgencyCommissionAmount?: number; // Importe cargado manualmente por el asesor
  adminFeeAmount: number; // Gastos administrativos / Fee de gestión del operador
  bankTaxAmount: number; // Impuesto Débito / Crédito bancario (Ley 25.413)
  ivaRate: IvaRate;
  ivaAmount: number;
  customCharges?: OperatorCustomChargeItem[]; // Desglose de ítems extra que cobra el operador
  netToPayOperator: number; // Total neto liquidado a transferir al operador
  agencyGrossProfit: number; // Margen / Utilidad de la agencia en este servicio
  // Control de vencimiento
  paymentDeadline: string; // YYYY-MM-DD
  paymentStatus: 'Pendiente' | 'Señado' | 'Pagado';
  paidAmountToOperator?: number;
  paymentReceiptNotes?: string;
}

export interface CommercialAllocation {
  sellerId?: string;
  sellerName?: string;
  sellerCommissionPercent: number; // % acordado en RRHH
  sellerCommissionAmount: number;
  promoterId?: string;
  promoterName?: string;
  promoterType?: 'afiliado' | 'promotor_interno';
  promoterCommissionPercent: number; // % acordado en perfil de afiliado
  promoterCommissionAmount: number;
  totalPvpCharged: number;
  totalCostToSuppliers: number;
  totalCommercialCommissions: number;
  netAgencyProfit: number; // PVP - Costos Operadores - Comisiones Vendedor/Afiliado
}

export interface BusDeckConfig {
  decksCount: 1 | 2; // 1 piso o 2 pisos
  presetName?: string; // 'Suite 26', 'Suite 32', 'Convencional 42', 'Mixto 50', 'Doble Piso 60', 'Personalizado'
  deck1SeatsCount: number; // Planta Baja (o total si es 1 piso)
  deck1SeatType: 'Cama' | 'SemiCama' | 'Suite_Premium';
  deck2SeatsCount: number; // Planta Alta (si es 2 pisos)
  deck2SeatType: 'Cama' | 'SemiCama' | 'Suite_Premium';
  totalSeats: number;
}

export interface BusConfig {
  provider: string;
  totalCharterPrice: number;
  currency: CurrencyType;
  ivaRate: IvaRate;
  seatsTotal: number;
  seatsCama: number;
  seatsSemiCama: number;
  calculationBasePax: number;
  deckConfig?: BusDeckConfig;
  backupDocs?: { name: string; url?: string; notes?: string }[];
}

export interface FlightConfig {
  mode: FlightMode;
  provider: string;
  currency: CurrencyType;
  ivaRate: IvaRate;
  netBaseFarePerPax: number;
  taxesPerPax: number;
  totalCharterPrice: number;
  calculationBasePax: number;
  backupDocs?: { name: string; url?: string; notes?: string }[];
}

export interface LodgingRoomRate {
  enabled: boolean;
  ratePerNightPerPax: number;
}

export interface LodgingHotelStay {
  id: string;
  city: string; // Ej: 'Salta Capital', 'Cafayate', 'Tilcara', 'Madrid', 'Roma'
  hotelName: string;
  foodPlan: FoodPlan;
  nightsCount: number;
  currency: CurrencyType;
  ivaRate: IvaRate;
  rooms: {
    single: LodgingRoomRate;
    doble: LodgingRoomRate;
    triple: LodgingRoomRate;
    cuadruple: LodgingRoomRate;
    quintuple: LodgingRoomRate;
  };
  backupDocs?: { name: string; url?: string; notes?: string }[];
}

export interface LodgingConfig {
  hotelName: string;
  foodPlan: FoodPlan;
  nightsCount: number;
  currency: CurrencyType;
  ivaRate: IvaRate;
  rooms: {
    single: LodgingRoomRate;
    doble: LodgingRoomRate;
    triple: LodgingRoomRate;
    cuadruple: LodgingRoomRate;
    quintuple: LodgingRoomRate;
  };
  hotelsList?: LodgingHotelStay[]; // Lista para múltiples hoteles en circuitos multiciudad
  backupDocs?: { name: string; url?: string; notes?: string }[];
}

export interface FoodPlanConfig {
  unitPricePerMeal: number;
  mealsCount: number;
  currency: CurrencyType;
  ivaRate: IvaRate;
  description?: string;
}

export interface CourtesyConfig {
  hasCourtesy: boolean;
  courtesyPaxCount: number;
}

export interface CoordinatorConfig {
  coordinatorFeeTotal: number;
  perDiemTotal: number;
  currency: CurrencyType;
}

export interface TravelAssistanceConfig {
  provider: string;
  coverageType: string;
  ratePerDay: number;
  daysCount: number;
  currency: CurrencyType;
  ivaRate: IvaRate;
  backupDocs?: { name: string; url?: string; notes?: string }[];
}

export interface AdditionalServiceItem {
  id: string;
  name: string;
  provider: string;
  costType: 'por_pax' | 'grupal_fijo';
  netCost: number;
  currency: CurrencyType;
  ivaRate: IvaRate;
}

export interface RewardsFinancialConfig {
  markupPercent: number;
  affiliateCommissionPercent: number;
  rewardsDiscountPercent: number;
  rewardsEarnMultiplier: number;
  rewardsPointValue: number;
  exchangeRate: number;
  usdToArsPerceptionPercent: number;
}

export interface RoomCalculationResult {
  roomType: RoomCategory;
  roomLabel: string;
  enabled: boolean;
  costNetoTargetCurrency: number;
  pvpTargetCurrency: number;
  pvpRewardsTargetCurrency: number;
  pointsEarned: number;
  pointsRequiredForRedemption: number;
  secondaryCurrencyLabel: string;
  pvpSecondaryCurrency: number;
}

export interface OrganizedTripQuote {
  id: string;
  title: string;
  destination: string;
  scope: TripScope;
  targetCurrency: CurrencyType;
  departureDate?: string;
  returnDate?: string;
  departureOrigin?: string;
  transportType: TransportType;
  transportBus: BusConfig;
  transportFlight: FlightConfig;
  lodging: LodgingConfig;
  foodPlanExtra: FoodPlanConfig;
  courtesy: CourtesyConfig;
  coordination: CoordinatorConfig;
  assistance: TravelAssistanceConfig;
  extraServices: AdditionalServiceItem[];
  financials: RewardsFinancialConfig;
  matrixResults: RoomCalculationResult[];
  status: 'Borrador' | 'Confirmada' | 'Publicada_Catalogo';
  createdAt: string;
  updatedAt?: string;
}

// -------------------------------------------------------------
// OPERATIVO & FICHA MAESTRA DEL VIAJE
// -------------------------------------------------------------

export interface ItineraryDay {
  dayNumber: number;
  title: string;
  description: string;
  timeSlot?: string; // Ej: 'Mañana', 'Tarde', 'Noche', '09:00 hs'
  includedMeals?: ('Desayuno' | 'Almuerzo' | 'Merienda' | 'Cena')[];
  activities?: string[];
  location?: string;
}

export interface BoardingPoint {
  id: string;
  locationName: string; // Ej: 'Terminal Retiro - Plataforma 1 a 5'
  city: string; // Ej: 'Buenos Aires'
  scheduledTime: string; // Ej: '20:00 hs'
  notes?: string;
}

export interface OptionalExcursion {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: CurrencyType;
  imageUrl?: string;
  duration?: string;
}

export interface RoomInventoryCount {
  totalBlocked: number;
  occupied: number;
  available: number;
}

export interface ScheduledDeparture {
  id: string;
  departureDate: string; // YYYY-MM-DD
  returnDate: string; // YYYY-MM-DD
  status: 'Abierta' | 'Cupos Limitados' | 'Agotada' | 'Cerrada';
  totalSeats: number;
  availableSeats: number;
  rooming: {
    single: RoomInventoryCount;
    doble: RoomInventoryCount;
    triple: RoomInventoryCount;
    cuadruple: RoomInventoryCount;
  };
  coordinator?: {
    name: string;
    phone: string;
    avatar?: string;
  };
  transportProvider?: string;
}

export interface MasterTrip {
  id: string;
  title: string;
  destination: string;
  scope: TripScope;
  currency: CurrencyType;
  price: number;
  priceRewards: number;
  pointsEarned: number;
  tripType: TripType;
  transportation: string;
  hotelName: string;
  nightsCount: number;
  foodPlan: FoodPlan;
  departureOrigin: string;
  coverImage: string;
  galleryImages: string[];
  videoUrl?: string;
  overviewDescription: string;
  itinerary: ItineraryDay[];
  includedServices: string[];
  notIncludedServices: string[];
  boardingPoints: BoardingPoint[];
  optionalExcursions: OptionalExcursion[];
  requiredDocs: string[];
  recommendations: string;
  scheduledDepartures: ScheduledDeparture[];
  departureDate?: string;
  location?: string;
  roomPricing?: Record<string, number>;
  quoteId?: string;
  showOnLanding?: boolean;
  productType?: 'salida_propia' | 'operador_mayorista' | 'crucero' | 'paquete_individual' | 'experiencia_dia';
  createdAt: string;
  updatedAt?: string;
}

export interface Tour {
  id: string;
  title: string;
  location: string;
  price: number;
  currency: CurrencyType;
  priceRewards: number;
  pointsEarned: number;
  tripType: TripType;
  scope?: TripScope;
  transportation: string;
  departureDate: string;
  departureOrigin: string;
  services: string[];
  imageUrl: string;
  galleryImages?: string[];
  itinerary?: ItineraryDay[];
  description: string;
  observations: string;
  availability: AvailabilityStatus;
  quoteId?: string;
  showOnLanding?: boolean;
  productType?: 'salida_propia' | 'operador_mayorista' | 'crucero' | 'paquete_individual' | 'experiencia_dia';
  roomPricing?: Record<string, number>;
  boardingPoints?: BoardingPoint[];
  optionalExcursions?: OptionalExcursion[];
  scheduledDepartures?: ScheduledDeparture[];
}

export interface Reservation {
  id: string;
  tourId: string;
  customerName: string;
  paxCount: number;
  status: 'Confirmada' | 'Señada' | 'Presupuestada' | 'Cancelada';
  timestamp: number;
  expiresAt?: string; // Time-to-Pay ISO Timestamp
}

// -------------------------------------------------------------
// HELPER TIME-TO-PAY (TTL)
// -------------------------------------------------------------
export function calculateTimeToPayDeadline(departureDateStr?: string): { hours: number; deadlineIso: string; label: string } {
  const now = new Date();
  if (!departureDateStr) {
    // Por defecto 48 horas
    const deadline = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    return { hours: 48, deadlineIso: deadline.toISOString(), label: '48 Horas (Estándar)' };
  }

  const depDate = new Date(departureDateStr);
  const diffTime = depDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let hours = 48;
  let label = '48 Horas (> 90 días para la salida)';

  if (diffDays > 90) {
    hours = 48;
    label = '48 Horas (> 90 días para la salida)';
  } else if (diffDays >= 60 && diffDays <= 90) {
    hours = 24;
    label = '24 Horas (Entre 60 y 90 días)';
  } else if (diffDays >= 30 && diffDays < 60) {
    hours = 12;
    label = '12 Horas (Entre 30 y 60 días)';
  } else if (diffDays > 0 && diffDays < 30) {
    hours = 4;
    label = '4 Horas (Salida inminente < 30 días)';
  } else {
    hours = 2;
    label = '2 Horas (Salida inmediata)';
  }

  const deadline = new Date(now.getTime() + hours * 60 * 60 * 1000);
  return { hours, deadlineIso: deadline.toISOString(), label };
}

export function getTimeRemainingInfo(expiresAtStr?: string | null): { isExpired: boolean; label: string; urgencyClass: string } | null {
  if (!expiresAtStr) return null;
  const now = new Date().getTime();
  const exp = new Date(expiresAtStr).getTime();
  const diffMs = exp - now;

  if (diffMs <= 0) {
    return { isExpired: true, label: 'Expirada (Sin Pago)', urgencyClass: 'bg-red-100 text-red-700 border-red-200' };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours < 4) {
    return { isExpired: false, label: `⏱️ Vence en ${hours}h ${mins}m`, urgencyClass: 'bg-red-50 text-red-700 border-red-300 animate-pulse' };
  }
  if (hours < 24) {
    return { isExpired: false, label: `⏱️ Vence en ${hours}h ${mins}m`, urgencyClass: 'bg-amber-50 text-amber-800 border-amber-300' };
  }
  return { isExpired: false, label: `⏱️ ${hours}h ${mins}m restantes`, urgencyClass: 'bg-blue-50 text-blue-700 border-blue-200' };
}

// Balance de Cierre y Liquidación Real de Salida Post-Viaje
export interface TripClosureRealData {
  id?: string;
  quoteId?: string;
  tripId?: string;
  tripTitle: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  currency: CurrencyType;
  // Pasajeros reales
  budgetedPax: number;
  actualPaxCount: number;
  actualSinglesCount: number;
  actualDoublesCount: number;
  actualTriplesCount: number;
  actualQuadsCount: number;
  // Ingresos reales
  actualGrossRevenue: number;
  // Costos operativos reales incurridos
  actualTransportCost: number;
  actualLodgingCost: number;
  actualFoodCost: number;
  actualAssistanceCost: number;
  actualCoordinationCost: number;
  actualExtraServicesCost: number;
  actualTotalOperatingCosts: number;
  // Margen bruto real
  actualGrossMargin: number;
  // Deducciones comerciales reales
  actualSellerCommissionsPaid: number;
  actualAffiliateCommissionsPaid: number;
  actualRewardsCostPaid: number;
  actualRewardsDiscountsGiven: number;
  // Resultado / Utilidad Neta Líquida Final
  actualNetAgencyProfit: number;
  actualProfitMarginPercent: number;
  actualProfitPerPax: number;
  closureNotes?: string;
  closedBy?: string;
  closedAt: string;
}

