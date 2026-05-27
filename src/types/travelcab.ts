export type TripStatus = 'Buscando Chofer' | 'En Camino' | 'En Viaje' | 'Completado';

export interface Trip {
  id: string; // Firebase doc id
  passengerName: string;
  origin: string;
  destination: string;
  status: TripStatus;
  driverName?: string;
  price?: number;
  scheduledTime?: number; // Timestamp
  originCoords?: { lat: number; lng: number };
  destinationCoords?: { lat: number; lng: number };
  distanceKm?: number;
  durationMinutes?: number;
  routePolyline?: string;
  passengerPhone?: string;
  serviceType?: string;
  paymentMethod?: string;
  createdAt?: number;
}
