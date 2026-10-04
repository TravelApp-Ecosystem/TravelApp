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
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [unitFilter, setUnitFilter] = useState<string>('all');

  useEffect(() => {
    const q = query(collection(db, 'leads'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData: Lead[] = [];
      snapshot.forEach((doc) => {
        leadsData.push({ id: doc.id, ...doc.data() } as Lead);
      });
      setAllLeads(leadsData);
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

  // Filter leads based on selected Channel and Business Unit
  const filteredLeads = allLeads.filter(lead => {
    // Channel filter
    if (channelFilter !== 'all') {
      const src = (lead.origin || '').toLowerCase();
      if (channelFilter === 'whatsapp' && !src.includes('whatsapp')) return false;
      if (channelFilter === 'instagram' && !src.includes('ig') && !src.includes('instagram')) return false;
      if (channelFilter === 'messenger' && !src.includes('messenger')) return false;
      if (channelFilter === 'web' && !src.includes('web')) return false;
    }

    // Business unit filter
    if (unitFilter !== 'all') {
      const u = (lead.businessUnit || '').toLowerCase();
      if (unitFilter === 'cab_driver' && !u.includes('conductor')) return false;
      if (unitFilter === 'cab_user' && (!u.includes('travelcab') || u.includes('conductor'))) return false;
      if (unitFilter === 'experiences' && !u.includes('experience') && !u.includes('experiencias')) return false;
      if (unitFilter === 'rewards' && !u.includes('rewards')) return false;
      if (unitFilter === 'afiliados' && !u.includes('afiliados')) return false;
      if (unitFilter === 'general' && u !== 'travelapp' && u !== 'general') return false;
    }

    return true;
  });

  const nuevos = filteredLeads.filter(lead => lead.status === 'Nuevos' || lead.status === 'En Espera Operador');
  const agendados = filteredLeads.filter(lead => lead.status === 'Agendados');
  const negociacion = filteredLeads.filter(lead => lead.status === 'En Negociación');
  const cerrados = filteredLeads.filter(lead => lead.status === 'Ganados/Perdidos');

  return (
    <>
      {/* Filtros Omnicanal y Unidad de Negocio */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mr-1">Canal:</span>
          {[
            { id: 'all', label: 'Todos' },
            { id: 'whatsapp', label: '📱 WhatsApp' },
            { id: 'instagram', label: '📷 Instagram' },
            { id: 'messenger', label: '💬 Messenger' },
            { id: 'web', label: '🌐 Chat Web' },
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setChannelFilter(c.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                channelFilter === c.id
                  ? 'bg-tech-blue text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mr-1">Unidad:</span>
          {[
            { id: 'all', label: 'Todas' },
            { id: 'cab_user', label: '🚕 Pasajeros' },
            { id: 'cab_driver', label: '👨‍✈️ Choferes' },
            { id: 'experiences', label: '🗺️ Tours' },
            { id: 'rewards', label: '🎁 Rewards' },
            { id: 'afiliados', label: '🤝 Afiliados' },
          ].map(u => (
            <button
              key={u.id}
              onClick={() => setUnitFilter(u.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                unitFilter === u.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex h-[calc(100vh-17rem)] space-x-4 overflow-x-auto pb-4">
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
