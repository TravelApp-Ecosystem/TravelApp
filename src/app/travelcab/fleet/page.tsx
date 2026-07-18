'use client';

import React from 'react';
import { Car, ShieldAlert, Sparkles, Building2, Info, Compass } from 'lucide-react';
import Link from 'next/link';

export default function FleetPlaceholderPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-slate-50 p-6 text-center space-y-6">
      
      {/* Visual illustration box */}
      <div className="relative p-8 bg-white border border-slate-200 rounded-3xl shadow-xl max-w-md w-full overflow-hidden flex flex-col items-center">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 to-transparent pointer-events-none"></div>

        {/* Icon with pulsing background */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-[#FF7A00]/10 rounded-full scale-125 animate-ping"></div>
          <div className="bg-[#FF7A00]/10 p-5 rounded-full relative z-10 border border-[#FF7A00]/20">
            <Car className="h-10 w-10 text-[#FF7A00]" />
          </div>
        </div>

        <h2 className="text-xl font-black text-tech-blue">Gestión de Móviles Propios</h2>
        
        <p className="text-sm text-slate-500 mt-3.5 leading-relaxed font-medium">
          Este módulo está reservado para la administración centralizada de la flota propia de la empresa.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-6 flex gap-2.5 items-start text-left w-full">
          <Info className="h-5 w-5 text-[#FF7A00] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-slate-700">Desarrollo a Futuro</p>
            <p className="text-[11px] text-slate-400 mt-1 leading-normal">
              Lo desarrollaremos e integraremos con telemetría en tiempo real una vez que Concorde 360 incorpore vehículos de propiedad corporativa.
            </p>
          </div>
        </div>

        {/* Link back to dashboard */}
        <Link 
          href="/travelcab" 
          className="mt-8 w-full py-2.5 rounded-xl bg-tech-blue text-white text-xs font-bold hover:bg-tech-blue/90 shadow-md transition-all active:scale-[0.98]"
        >
          Volver al Panel Principal
        </Link>
      </div>

    </div>
  );
}
