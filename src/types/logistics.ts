export interface VehicleCategory {
  id: string;          // Código identificador (ej: 'estandar', 'vip', 'premium')
  name: string;        // Nombre público (ej: 'TravelCab VIP')
  description: string; // Descripción comercial
  eta: string;         // Tiempo estimado de arribo (ej: '3 - 5 min')
  icon?: string;       // Icono de Lucide (ej: 'Car', 'Sparkles', 'Crown')
  createdAt: number;
}

export interface ARCRoute {
  id: string;
  mainOrigin: string;
  mainDestination: string;
  pricePerSeat: number;
}

export interface ARCTariff {
  id: string;
  name: string;
  category: string;             // ID de la categoría dinámica (ej: 'vip')
  routes: ARCRoute[];
  iva: number;                  // IVA % (ej: 21)
  iibb: number;                 // Ingresos Brutos % (ej: 3.5)
  taxMunicipal: number;         // Tasas Municipales % (ej: 1.5)
  electronicPaymentFee: number; // Tax por pago electrónico / Tarjeta % (ej: 5)
  commissionRate: number;       // Comisión de la plataforma % (ej: 15)
  weeklyMembership: number;     // Membresía Semanal $ (ej: 5000)
  specialRates?: {
    [key: string]: number;
  };
  isActive?: boolean;
}

export interface MUTariffSpecialRate {
  id: string;
  name: string;
  daysOfWeek: string[];
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  percentageModifier: number; // e.g. 15 for +15%, -10 for -10%
}

export interface MUTariff {
  id: string;
  name: string;
  category: string;             // ID de la categoría dinámica (ej: 'estandar')
  baseFare: number;             // Bajada de Bandera
  pricePerKm: number;           // Precio por KM
  minimumFare: number;          // Valor Mínimo
  waitMinutePrice: number;      // Minuto de Espera
  courtesyTimeMinutes: number;  // Tiempo de Cortesía
  travelMinutePrice: number;    // Minuto en Viaje
  iva: number;                  // IVA % (ej: 21)
  iibb: number;                 // Ingresos Brutos % (ej: 3.5)
  taxMunicipal: number;         // Tasas Municipales % (ej: 1.5)
  electronicPaymentFee: number; // Tax por pago electrónico / Tarjeta % (ej: 5)
  commissionRate: number;       // Comisión de la plataforma % (ej: 15)
  weeklyMembership: number;     // Membresía Semanal $ (ej: 5000)
  specialRates?: MUTariffSpecialRate[];
  isActive?: boolean;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  activeMUTariffId?: string;
  enabledARCRouteIds: string[];
}

