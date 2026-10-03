export type OtaPackageType = 'paquete' | 'salida_grupal' | 'crucero' | 'escapada';
export type OtaProviderType = 'propio' | 'mayorista';
export type OtaTransportType = 'Aéreo' | 'Bus Cama' | 'Crucero' | 'Terrestre' | 'Sin Transporte';
export type OtaFoodPlan = 'Solo Alojamiento' | 'Desayuno' | 'Media Pensión' | 'Pensión Completa' | 'All Inclusive';

export interface OtaItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface OtaPackage {
  id: string;
  title: string;
  destination: string;
  country: string;
  region: 'Nacional' | 'Internacional' | 'Regional';
  type: OtaPackageType;
  providerType: OtaProviderType;
  operatorName?: string; // Ej: "TravelApp Exclusivo", "Juliá Tours", "Ola", "Dertour", "Tip Group", etc.
  durationDays: number;
  durationNights: number;
  departureDates: string[]; // Ej: ["15 Nov 2026", "05 Dic 2026"]
  departureOrigin: string; // Ej: "Buenos Aires", "Tucumán", "Córdoba"
  transportType: OtaTransportType;
  airline?: string; // Ej: "Aerolíneas Argentinas", "LATAM", "Flybondi", "Copa Airlines"
  hotelName?: string;
  hotelStars?: number;
  foodPlan: OtaFoodPlan;
  priceArs: number;
  priceUsd: number;
  installments?: string; // Ej: "Hasta 6 cuotas sin interés"
  rewardsPointsEarned?: number;
  badge?: string; // Ej: "🔥 MÁS VENDIDO", "⭐ SALIDA CONFIRMADA", "🌴 ALL INCLUSIVE"
  imageUrl: string;
  gallery?: string[];
  description: string;
  includedServices: string[];
  itinerarySummary?: OtaItineraryDay[];
  featured?: boolean;
}
