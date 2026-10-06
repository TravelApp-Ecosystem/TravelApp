import React from 'react';
import { MapPin, Ticket, Award, Car, Calendar, Users, Eye, Clock, Crown, Sparkles } from 'lucide-react';
import { Tour, AvailabilityStatus } from '@/types/experiences';

interface TourCardProps {
  tour: Tour;
  onSelect?: (tour: Tour) => void;
}

export const TourCard: React.FC<TourCardProps> = ({ tour, onSelect }) => {
  const getBadgeStyle = (status: AvailabilityStatus) => {
    switch (status) {
      case 'Disponible': return 'bg-emerald-500 text-white font-bold';
      case 'Cupos Limitados': return 'bg-amber-500 text-slate-950 font-bold';
      case 'Agotado': return 'bg-slate-500 text-white font-medium';
      default: return 'bg-tech-blue text-white font-medium';
    }
  };

  const currencySymbol = tour.currency === 'USD' ? 'USD ' : '$ ';
  const hasTravelCab = tour.transportation?.toLowerCase().includes('travelcab') || 
                       tour.services?.some(s => s.toLowerCase().includes('travelcab'));

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Imagen Superior con Badges */}
      <div className="relative h-52 w-full overflow-hidden bg-slate-100">
        <img 
          src={tour.imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80'} 
          alt={tour.title} 
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30"></div>
        
        {/* Código y Badges Superiores */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
          <span className="inline-flex items-center rounded-lg bg-slate-950/80 px-2 py-0.5 text-[10px] font-black text-white backdrop-blur-xs">
            {tour.id}
          </span>
          {hasTravelCab && (
            <span className="inline-flex items-center gap-1 rounded-md bg-tech-blue/90 px-2 py-0.5 text-[9px] font-black uppercase text-white shadow-xs backdrop-blur-xs">
              <Car className="h-3 w-3" /> TravelCab Transfer
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider shadow-md backdrop-blur-xs ${getBadgeStyle(tour.availability)}`}>
            {tour.availability}
          </span>
        </div>

        {/* Ubicación y Salida en base de foto */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
          <span className="flex items-center gap-1 font-bold bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-xs">
            <MapPin className="h-3.5 w-3.5 text-emerald-400" />
            {tour.location}
          </span>
          <span className="flex items-center gap-1 font-bold bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-xs">
            <Users className="h-3 w-3 text-sky-300" /> {tour.tripType}
          </span>
        </div>
      </div>

      {/* Contenido Inferior */}
      <div className="flex flex-1 flex-col p-5 justify-between space-y-4">
        <div>
          <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
            {tour.title}
          </h3>
          
          <p className="mt-1.5 text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
            {tour.description}
          </p>

          {/* Detalles de Transporte & Pick-up */}
          <div className="mt-3 grid grid-cols-2 gap-1.5 border-t border-slate-100 pt-2.5 text-[11px] font-bold text-slate-600 bg-slate-50 p-2 rounded-xl">
            <div className="flex items-center gap-1 truncate">
              <Car className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{tour.transportation}</span>
            </div>
            <div className="flex items-center gap-1 truncate">
              <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{tour.departureDate}</span>
            </div>
          </div>
        </div>

        {/* Precios y Rewards */}
        <div className="border-t border-slate-100 pt-3 space-y-2.5">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tarifa Pública</p>
              <p className="text-xl font-black text-slate-900 tracking-tight">
                {currencySymbol}{(tour.price || 0).toLocaleString('es-AR')}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-[10px] font-black text-amber-700 px-2 py-0.5 border border-amber-200">
                <Award className="h-3 w-3 text-amber-500" /> +{tour.pointsEarned || 0} pts
              </span>
            </div>
          </div>

          {/* Tarifa Miembro Club Rewards */}
          <div className="bg-gradient-to-r from-emerald-50 to-lime-50 border border-emerald-200/80 rounded-2xl p-2.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                <Crown className="h-3.5 w-3.5 text-amber-500" /> Tarifa Socio Club:
              </span>
              <span className="text-base font-black text-emerald-950">
                {currencySymbol}{(tour.priceRewards || Math.round((tour.price || 0) * 0.9)).toLocaleString('es-AR')}
              </span>
            </div>
            <button 
              type="button"
              onClick={() => onSelect?.(tour)}
              className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-black text-white shadow-xs transition-colors"
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
