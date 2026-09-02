export interface VehicleCategory {
  id: string;          // Código identificador (ej: 'estandar', 'vip', 'premium')
  name: string;        // Nombre público (ej: 'TravelCab VIP')
  description: string; // Descripción comercial
  eta: string;         // Tiempo estimado de arribo (ej: '3 - 5 min')
  icon?: string;       // Icono de Lucide (ej: 'Car', 'Sparkles', 'Crown')
  seats?: number;      // Capacidad de asientos disponibles para el servicio
  createdAt: number;
}

export interface TariffSpecialRate {
  id: string;
  name: string;
  daysOfWeek: string[]; // ['Lunes', 'Martes', ..., 'Todos los días', 'Feriados']
  startTime: string;    // HH:mm (ej: '22:00')
  endTime: string;      // HH:mm (ej: '06:00')
  percentageModifier: number; // e.g. 15 for +15%, -10 for -10%
}

export type MUTariffSpecialRate = TariffSpecialRate;

export interface TariffPenalties {
  cancelGracePeriodMinutes: number;         // Minutos para cancelar sin cargo (ej: 3 min)
  cancelFixedFee: number;                   // Monto fijo de penalidad si cancela tarde ($)
  postAcceptanceCancelFeeType: 'fixed' | 'percentage'; // Monto fijo o % del viaje cotizado
  postAcceptanceCancelFeeValue: number;      // Valor del monto o porcentaje ($ o %)
  postAcceptanceGraceMinutes: number;       // Minutos de gracia tras aceptación del chofer
  driverCancelPenaltyFee: number;           // Multa al conductor por cancelar viaje asignado ($)
}

export interface ARCRoute {
  id: string;
  mainOrigin: string;
  mainDestination: string;
  pricePerSeat: number;
  isBidirectional?: boolean; // Si es true, habilita automáticamente el sentido Destino -> Origen con la misma tarifa
}

export interface ARCTariff {
  id: string;
  name: string;
  branchIds?: string[];         // IDs de las sucursales asignadas (o ['all'])
  category: string;             // ID de la categoría dinámica (ej: 'vip')
  routes: ARCRoute[];
  iva: number;                  // IVA % sobre comisión de plataforma (ej: 21)
  iibb: number;                 // IIBB % sobre comisión de plataforma (ej: 3.5)
  taxMunicipal: number;         // TEM / Tasas Municipales % sobre comisión (ej: 1.5)
  electronicPaymentFee: number; // Tax por pago electrónico / Tarjeta % (ej: 5)
  commissionRate: number;       // Comisión de la plataforma % (ej: 15)
  weeklyMembership: number;     // Membresía Semanal $ (ej: 5000)
  specialRates?: TariffSpecialRate[];
  isActive?: boolean;
  type?: 'arc' | 'aci';
}

export interface MUTariff {
  id: string;
  name: string;
  branchIds?: string[];         // IDs de las sucursales asignadas (o ['all'])
  category: string;             // ID de la categoría dinámica (ej: 'estandar')
  baseFare: number;             // Bajada de Bandera
  pricePerKm: number;           // Precio por KM
  minimumFare: number;          // Valor Mínimo del viaje
  waitMinutePrice: number;      // Minuto de Espera
  courtesyTimeMinutes: number;  // Tiempo de Cortesía en espera
  travelMinutePrice: number;    // Minuto en Viaje
  penalties?: TariffPenalties;  // Políticas de penalidades pasajero y chofer
  iva: number;                  // IVA % sobre comisión de plataforma (ej: 21)
  iibb: number;                 // IIBB % sobre comisión de plataforma (ej: 3.5)
  taxMunicipal: number;         // TEM / Tasas Municipales % sobre comisión (ej: 1.5)
  electronicPaymentFee: number; // Tax por pago electrónico / Tarjeta % (ej: 5)
  commissionRate: number;       // Comisión de la plataforma % (ej: 15)
  weeklyMembership: number;     // Membresía Semanal $ (ej: 5000)
  specialRates?: TariffSpecialRate[];
  isActive?: boolean;
  isFreeTripOnly?: boolean;     // Si es true, es exclusivo para el taxímetro de viaje libre y no se muestra a pasajeros
  type?: 'mu';
}

export interface TransferRoute {
  id: string;
  originName: string;
  destinationName: string;
  fixedPrice: number;
  isBidirectional?: boolean; // Si es true, aplica la misma tarifa en sentido inverso
}

export interface TransferTariff {
  id: string;
  name: string;
  branchIds?: string[];         // IDs de las sucursales asignadas (o ['all'])
  category: string;             // ID de la categoría (ej: 'estandar', 'vip')
  routes: TransferRoute[];
  iva?: number;                 // IVA % sobre comisión
  iibb?: number;                // IIBB % sobre comisión
  taxMunicipal?: number;        // TEM % sobre comisión
  electronicPaymentFee?: number;// Tax por pago electrónico %
  commissionRate?: number;      // Comisión plataforma %
  weeklyMembership?: number;    // Membresía Semanal $
  specialRates?: TariffSpecialRate[];
  isActive?: boolean;
  type: 'transfers';
}

export interface Branch {
  id: string;
  name: string;
  code?: string;
  location?: string;
  address?: string;
  city?: string;
  province?: string;
  phone?: string;
  email?: string;
  active: boolean;
  activeMUTariffId?: string;
  activeARCTariffId?: string;
  activeTransferTariffId?: string;
  enabledARCRouteIds?: string[];
  createdAt?: number;
}



