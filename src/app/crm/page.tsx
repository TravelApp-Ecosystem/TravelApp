import React from 'react';
import { LeadsKanban } from '@/components/crm/LeadsKanban';
import { Plus } from 'lucide-react';

export default function CRMPage() {
  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-tech-blue mb-1">Tablero de Leads</h1>
          <p className="text-sm text-slate-500">Gestiona los prospectos calificados por Travis y tu equipo.</p>
        </div>
        <button className="inline-flex items-center justify-center space-x-2 rounded-md bg-tech-blue px-4 py-2 text-sm font-medium text-white hover:bg-tech-blue/90 transition-colors">
          <Plus className="h-4 w-4" />
          <span>Nuevo Lead Manual</span>
        </button>
      </div>

      <LeadsKanban />
    </>
  );
}
