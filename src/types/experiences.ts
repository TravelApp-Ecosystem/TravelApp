export type AvailabilityStatus = 'Disponible' | 'Cupos Limitados' | 'Agotado';

export interface Tour {
  id: string; // Firebase doc ID
  title: string;
  location: string;
  price: number;
  description: string;
  imageUrl: string;
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
