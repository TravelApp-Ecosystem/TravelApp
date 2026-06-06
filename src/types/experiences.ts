export type AvailabilityStatus = 'Disponible' | 'Cupos Limitados' | 'Agotado';
export type TripType = 'Individual' | 'Grupal';

export interface Tour {
  id: string; // Código de viaje, ej. EXP-001
  title: string;
  location: string; // Destino, ej. Mendoza
  price: number;
  currency: 'ARS' | 'USD';
  priceRewards: number; // Precio miembro Rewards
  pointsEarned: number; // Puntos que suma
  tripType: TripType; // Individual o Grupal
  transportation: string; // Transporte, ej. Bus, Avión
  departureDate: string; // Fecha de salida, ej. YYYY-MM-DD
  departureOrigin: string; // Origen de salida, ej. Tucumán
  services: string[]; // Servicios incluidos
  imageUrl: string;
  description: string;
  observations: string; // Observaciones generales
  availability: AvailabilityStatus;
}

export interface Reservation {
  id: string;
  tourId: string;
  customerName: string;
  paxCount: number;
  status: 'Confirmada' | 'Pendiente' | 'Cancelada';
  timestamp: number;
}

