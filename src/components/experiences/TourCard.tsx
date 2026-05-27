import React from 'react';
import { MapPin, Ticket } from 'lucide-react';
import { Tour, AvailabilityStatus } from '@/types/experiences';

interface TourCardProps {
  tour: Tour;
}

export const TourCard: React.FC<TourCardProps> = ({ tour }) => {
  const getBadgeStyle = (status: AvailabilityStatus) => {
    switch (status) {
      case 'Disponible': return 'bg-lime-500 text-gray-950 font-bold';
      case 'Cupos Limitados': return 'bg-yellow-500 text-gray-950 font-bold';
      case 'Agotado': return 'bg-gray-600 text-gray-200 font-medium';
      default: return 'bg-tech-blue text-tech-blue font-medium';
    }
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-lime-900/10">
      {/* Imagen Superior */}
      <div className="relative h-56 w-full overflow-hidden bg-slate-100">
        <img 
          src={tour.imageUrl} 
          alt={tour.title} 
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent"></div>
        
        {/* Badge Disponibilidad */}
        <div className="absolute top-4 right-4">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs uppercase tracking-wider shadow-lg ${getBadgeStyle(tour.availability)}`}>
            {tour.availability}
          </span>
        </div>
      </div>

      {/* Contenido Inferior */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center text-sm font-medium text-slate-500">
          <MapPin className="mr-1.5 h-4 w-4 text-tech-blue" />
          {tour.location}
        </div>
        
        <h3 className="mb-3 text-xl font-bold leading-tight text-tech-blue line-clamp-2">
          {tour.title}
        </h3>
        
        <p className="mb-6 flex-1 text-sm text-slate-500 line-clamp-3">
          {tour.description}
        </p>

        {/* Footer Card */}
        <div className="mt-auto flex items-end justify-between border-t border-slate-200 pt-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Precio por persona</p>
            <p className="text-2xl font-black text-lime-400">
              USD {tour.price}
            </p>
          </div>
          <button className="flex items-center justify-center rounded-xl bg-tech-blue px-4 py-2.5 text-sm font-bold text-tech-blue shadow-lg shadow-blue-900/20 transition-all hover:bg-tech-blue hover:scale-[1.02]">
            <Ticket className="mr-2 h-4 w-4" />
            Reservar
          </button>
        </div>
      </div>
    </div>
  );
};
