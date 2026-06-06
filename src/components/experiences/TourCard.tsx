import React from 'react';
import { MapPin, Ticket, Award, Car, Calendar, Users, Eye } from 'lucide-react';
import { Tour, AvailabilityStatus } from '@/types/experiences';

interface TourCardProps {
  tour: Tour;
  onSelect?: (tour: Tour) => void;
}

export const TourCard: React.FC<TourCardProps> = ({ tour, onSelect }) => {
  const getBadgeStyle = (status: AvailabilityStatus) => {
    switch (status) {
      case 'Disponible': return 'bg-emerald-500 text-white font-bold';
      case 'Cupos Limitados': return 'bg-amber-500 text-white font-bold';
      case 'Agotado': return 'bg-slate-500 text-white font-medium';
      default: return 'bg-tech-blue text-white font-medium';
    }
  };

  const currencySymbol = tour.currency === 'ARS' ? '$' : 'USD ';

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Imagen Superior */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        <img 
          src={tour.imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80'} 
          alt={tour.title} 
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent"></div>
        
        {/* Código y Disponibilidad */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center rounded-lg bg-slate-900/80 px-2 py-1 text-xs font-black text-white backdrop-blur-sm">
            {tour.id}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider shadow-md ${getBadgeStyle(tour.availability)}`}>
            {tour.availability}
          </span>
        </div>
      </div>

      {/* Contenido Inferior */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center text-xs font-semibold text-slate-500 justify-between">
          <span className="flex items-center">
            <MapPin className="mr-1 h-3.5 w-3.5 text-tech-blue" />
            {tour.location}
          </span>
          <span className="flex items-center gap-1 font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
            <Users className="h-3 w-3" /> {tour.tripType}
          </span>
        </div>
        
        <h3 className="mb-2 text-base font-bold leading-snug text-tech-blue line-clamp-1">
          {tour.title}
        </h3>
        
        <p className="mb-4 flex-1 text-xs text-slate-500 line-clamp-2">
          {tour.description}
        </p>

        {/* Detalles Rápidos */}
        <div className="grid grid-cols-2 gap-1.5 mb-4 border-t border-slate-100 pt-3 text-[11px] text-slate-600">
          <div className="flex items-center gap-1">
            <Car className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate">{tour.transportation}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate">{tour.departureDate}</span>
          </div>
        </div>

        {/* Precios y Rewards */}
        <div className="mt-auto border-t border-slate-100 pt-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Precio Público</p>
              <p className="text-sm font-semibold text-slate-500 mt-1">
                {currencySymbol}{(tour.price || 0).toLocaleString('es-AR')}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 text-[10px] font-black text-emerald-600 px-1.5 py-0.5">
                <Award className="h-3 w-3" /> +{tour.pointsEarned || 0} pts
              </span>
            </div>
          </div>

          <div className="bg-lime-500/10 border border-lime-500/20 rounded-xl p-2 flex items-center justify-between">
            <div>
              <span className="text-[9px] font-black text-lime-600 uppercase tracking-wider block">Miembro Rewards</span>
              <span className="text-lg font-black text-lime-600">
                {currencySymbol}{(tour.priceRewards || 0).toLocaleString('es-AR')}
              </span>
            </div>
            <button 
              onClick={() => onSelect?.(tour)}
              className="flex items-center gap-1 rounded-lg bg-lime-500 hover:bg-lime-600 px-3 py-1.5 text-xs font-bold text-gray-950 transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              Detalles
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

