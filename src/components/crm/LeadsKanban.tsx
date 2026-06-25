"use client";

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LeadCard } from './LeadCard';
import { LeadDetailSlideOver } from './LeadDetailSlideOver';
import { Lead } from '@/types/crm';
import { Database } from 'lucide-react';

export const LeadsKanban = () => {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // States for each column
  const [nuevos, setNuevos] = useState<Lead[]>([]);
  const [agendados, setAgendados] = useState<Lead[]>([]);
  const [negociacion, setNegociacion] = useState<Lead[]>([]);
  const [cerrados, setCerrados] = useState<Lead[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'leads'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData: Lead[] = [];
      snapshot.forEach((doc) => {
        leadsData.push({ id: doc.id, ...doc.data() } as Lead);
      });

      // Filter and set leads by status
      setNuevos(leadsData.filter(lead => lead.status === 'Nuevos'));
      setAgendados(leadsData.filter(lead => lead.status === 'Agendados'));
      setNegociacion(leadsData.filter(lead => lead.status === 'En Negociación'));
      setCerrados(leadsData.filter(lead => lead.status === 'Ganados/Perdidos'));
    }, (error) => {
      console.error("Error fetching leads:", error);
    });

    return () => unsubscribe();
  }, []);

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const closeSlideOver = () => {
    setSelectedLead(null);
  };

  return (
    <>
      <div className="flex h-[calc(100vh-14rem)] space-x-4 overflow-x-auto pb-4">
        {/* Columna: Nuevos */}
        <div className="flex w-80 min-w-80 flex-col rounded-xl bg-slate-50/50 border border-slate-200 p-3">
          <div className="mb-3 flex items-center justify-between px-1">
            <h3 className="font-semibold text-slate-700">Nuevos (Travis)</h3>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-500">
              {nuevos.length}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto custom-scrollbar">
            {nuevos.map((lead) => (
              <LeadCard key={lead.id} {...lead} onClick={() => handleLeadClick(lead)} />
            ))}
          </div>
        </div>

        {/* Columna: Agendados */}
        <div className="flex w-80 min-w-80 flex-col rounded-xl bg-slate-50/50 border border-slate-200 p-3">
          <div className="mb-3 flex items-center justify-between px-1">
            <h3 className="font-semibold text-slate-700">Agendados</h3>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-500">
              {agendados.length}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto custom-scrollbar">
            {agendados.map((lead) => (
              <LeadCard key={lead.id} {...lead} onClick={() => handleLeadClick(lead)} />
            ))}
          </div>
        </div>

        {/* Columna: En Negociación */}
        <div className="flex w-80 min-w-80 flex-col rounded-xl bg-slate-50/50 border border-slate-200 p-3">
          <div className="mb-3 flex items-center justify-between px-1">
            <h3 className="font-semibold text-slate-700">En Negociación</h3>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-500">
              {negociacion.length}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto custom-scrollbar">
            {negociacion.map((lead) => (
              <LeadCard key={lead.id} {...lead} onClick={() => handleLeadClick(lead)} />
            ))}
          </div>
        </div>

        {/* Columna: Ganados/Perdidos */}
        <div className="flex w-80 min-w-80 flex-col rounded-xl bg-slate-50/50 border border-slate-200 p-3">
          <div className="mb-3 flex items-center justify-between px-1">
            <h3 className="font-semibold text-slate-700">Ganados / Perdidos</h3>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-500">
              {cerrados.length}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto custom-scrollbar">
            {cerrados.map((lead) => (
              <LeadCard key={lead.id} {...lead} onClick={() => handleLeadClick(lead)} />
            ))}
          </div>
        </div>
      </div>

      <LeadDetailSlideOver 
        lead={selectedLead} 
        isOpen={selectedLead !== null} 
        onClose={closeSlideOver} 
      />
    </>
  );
};
