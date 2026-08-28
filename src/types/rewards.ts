export interface RewardRule {
  id: string;
  name: string; // ej: 'Bares & Gastronomía', 'TravelCab Traslados', 'Paquetes & Experiencias'
  rubro?: string; // ej: 'Gastronomía', 'Movilidad', 'Turismo', 'Hotelería'
  conversionRate: number; // Cuántos Pesos ($) gastados equivalen a 1 Punto (ej: $2.500 ARS = 1 Pto)
  pointValue: number; // Cuánto dinero ($) representa ese punto al momento del canje (ej: $175 ARS)
  partnerId?: string; // Identificador si la regla pertenece a un comercio socio
  isActive: boolean;
  notes?: string;
}

export interface PointTransaction {
  id: string;
  userId: string;
  date: number; // Timestamp
  points: number; // Positivo si ganó (emisión), negativo si gastó (canje)
  ruleApplied?: string; // Nombre o ID de la regla aplicada
  orderId?: string; // ID del viaje, reserva o ticket
  description?: string;
}

export interface GlobalRewardsConfig {
  defaultPointValue: number; // $175 ARS
  maxRedemptionPercentPerOrder: number; // ej: 25% del total del viaje
  minPointsToRedeem: number; // ej: 5 puntos
}
