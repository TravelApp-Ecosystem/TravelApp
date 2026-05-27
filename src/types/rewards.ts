export interface RewardRule {
  id: string;
  name: string; // ej: 'Promo Cuba', 'TravelCab Estándar', 'Socio Café Martínez'
  conversionRate: number; // Cuántos Pesos ($) equivalen a 1 Punto
  pointValue: number; // Cuánto dinero ($) representa ese punto al momento del canje
  partnerId?: string; // Para identificar si la regla es nuestra o de un comercio socio
  isActive: boolean;
}

export interface PointTransaction {
  id: string;
  date: number; // Timestamp
  points: number; // Positivo si ganó, negativo si gastó
  ruleApplied: string; // Nombre de la regla o ID de la regla aplicada
  description?: string;
}
