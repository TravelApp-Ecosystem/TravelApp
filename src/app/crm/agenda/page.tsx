import React from 'react';
import { AgendaCalendar } from '@/components/crm/AgendaCalendar';

export default function CRMAgendaPage() {
  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-tech-blue mb-1">Mi Agenda (Meet)</h1>
          <p className="text-sm text-slate-500">Administra tus reuniones virtuales y disponibilidad horaria.</p>
        </div>
      </div>

      <AgendaCalendar />
    </>
  );
}
