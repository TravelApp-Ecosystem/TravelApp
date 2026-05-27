import React from 'react';
import { Car, AlertCircle } from 'lucide-react';

export default function TravelCabFleetPage() {
  return (
    <div className="flex h-full w-full flex-col bg-slate-50 p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-tech-blue flex items-center">
          <Car className="mr-3 h-7 w-7 text-vial-orange" />
          Estado de Móviles
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Monitoreo en tiempo real, gestión de flota, kilometraje y mantenimientos programados.
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white/50 p-8 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-gray-600" />
        <h3 className="text-lg font-medium text-slate-600">Módulo en Desarrollo</h3>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          La telemetría de los vehículos y la integración GPS se activará en la próxima fase.
        </p>
      </div>
    </div>
  );
}
