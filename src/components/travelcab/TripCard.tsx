import React from 'react';
import { MapPin, Navigation, User, Car, Clock } from 'lucide-react';
import { Trip, TripStatus } from '@/types/travelcab';

interface TripCardProps {
  trip: Trip;
  onClick?: () => void;
}

export const TripCard: React.FC<TripCardProps> = ({ trip, onClick }) => {
  const getStatusColor = (status: TripStatus) => {
    switch (status) {
      case 'Buscando Chofer': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'En Camino': return 'bg-tech-blue/10 text-blue-400 border-blue-500/20';
      case 'En Viaje': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'Completado': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-gray-500/10 text-slate-500 border-gray-500/20';
    }
  };

  return (
    <div 
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <User className="h-5 w-5 text-slate-500" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-tech-blue">{trip.passengerName}</h4>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-slate-500">#{trip.id.substring(0, 6)}</span>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusColor(trip.status)}`}>
                {trip.status}
              </span>
            </div>
          </div>
        </div>
        
        {trip.price !== undefined && (
          <div className="text-right">
            <span className="text-sm font-bold text-slate-600">${trip.price.toLocaleString('es-AR')}</span>
          </div>
        )}
      </div>
      
      <div className="mt-4 rounded-md bg-slate-50 p-3 space-y-3 border border-slate-200/50">
        <div className="flex items-start">
          <MapPin className="mr-3 mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
          <p className="text-sm text-slate-600 line-clamp-1">{trip.origin}</p>
        </div>
        <div className="flex items-start">
          <Navigation className="mr-3 mt-0.5 h-4 w-4 shrink-0 text-tech-blue" />
          <p className="text-sm text-slate-600 line-clamp-1">{trip.destination}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-200/50 pt-3">
        <div className="flex items-center text-xs text-slate-500">
          <Car className="mr-2 h-4 w-4 text-slate-500" />
          {trip.driverName ? (
            <span className="font-medium text-slate-600">{trip.driverName}</span>
          ) : (
            <span className="italic text-slate-500">Sin asignar</span>
          )}
        </div>
        
        {trip.scheduledTime && (
          <div className="flex items-center text-xs text-slate-500">
            <Clock className="mr-1.5 h-3.5 w-3.5" />
            {new Date(trip.scheduledTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
};
