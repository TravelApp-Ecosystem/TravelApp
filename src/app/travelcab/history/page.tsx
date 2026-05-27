import React from 'react';
import { Route, AlertCircle } from 'lucide-react';

export default function TravelCabHistoryPage() {
  return (
    <div className="flex h-full w-full flex-col bg-slate-50 p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-tech-blue flex items-center">
          <Route className="mr-3 h-7 w-7 text-vial-orange" />
          Historial de Rutas
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Registro completo de viajes realizados, rutas frecuentes y estadísticas logísticas.
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white/50 p-8 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-gray-600" />
        <h3 className="text-lg font-medium text-slate-600">Módulo en Desarrollo</h3>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          El histórico de viajes y exportación de datos está siendo integrado con la base de datos de producción.
        </p>
      </div>
    </div>
  );
}
