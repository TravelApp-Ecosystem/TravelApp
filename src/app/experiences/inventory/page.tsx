import React from 'react';
import { Users, AlertCircle } from 'lucide-react';

export default function ExperiencesInventoryPage() {
  return (
    <div className="flex h-full w-full flex-col bg-slate-50 p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-tech-blue flex items-center">
          <Users className="mr-3 h-7 w-7 text-green-500" />
          Inventario de Cupos
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Control de disponibilidad, asignación de guías y vehículos por fecha y tour.
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white/50 p-8 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-gray-600" />
        <h3 className="text-lg font-medium text-slate-600">Módulo en Desarrollo</h3>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          La calendarización de inventario está en fase de despliegue.
        </p>
      </div>
    </div>
  );
}
