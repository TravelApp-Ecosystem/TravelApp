"use client";

import React, { useState, useEffect } from 'react';
import { Video, Clock, Users } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CalendarEvent } from '@/types/crm';

const timeSlots = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];

export const AgendaCalendar = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sincronizar con la colección calendar_events de Firestore
    const q = query(collection(db, 'calendar_events'), orderBy('date', 'asc'), orderBy('time', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEvents: CalendarEvent[] = [];
      snapshot.forEach((doc) => {
        fetchedEvents.push({ id: doc.id, ...doc.data() } as CalendarEvent);
      });
      setEvents(fetchedEvents);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching calendar events:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filtramos los eventos a mostrar (en una app real se filtraría por fecha específica seleccionada)
  const todayEvents = events; 

  return (
    <div className="flex h-full flex-col lg:flex-row gap-6">
      {/* Columna Izquierda: Minicalendario y Filtros */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-tech-blue mb-4">Disponibilidad (Meet)</h3>
          <p className="text-sm text-slate-500">
            Tu calendario está sincronizado directamente con Firestore mediante Zapier. Los leads agendados por Travis aparecen aquí automáticamente.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 flex-1 overflow-y-auto custom-scrollbar">
          <h3 className="font-semibold text-tech-blue mb-4">Próximas Reuniones</h3>
          {loading ? (
            <p className="text-sm text-slate-500">Cargando eventos...</p>
          ) : todayEvents.length === 0 ? (
            <p className="text-sm text-slate-500">No hay reuniones programadas.</p>
          ) : (
            <div className="space-y-3">
              {todayEvents.map(event => (
                <div key={event.id} className="flex items-start space-x-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className={`mt-1 h-2 w-2 rounded-full ${event.color || 'bg-tech-blue'}`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-tech-blue">{event.title}</p>
                    <div className="mt-1 flex items-center text-xs text-slate-500 space-x-3">
                      <span className="flex items-center"><Clock className="mr-1 h-3 w-3" /> {event.time}</span>
                      <span className="flex items-center"><Users className="mr-1 h-3 w-3" /> {event.type || 'Meet'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Columna Derecha: Grilla de Horarios */}
      <div className="flex-1 rounded-xl border border-slate-200 bg-white p-5 overflow-y-auto custom-scrollbar h-[calc(100vh-10rem)]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-tech-blue">Eventos Agendados</h2>
          <div className="flex space-x-2">
            <button className="rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200">Día</button>
            <button className="rounded-md bg-transparent px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-600">Semana</button>
          </div>
        </div>

        <div className="relative">
          {timeSlots.map((slot) => {
            const event = todayEvents.find(e => e.time === slot);
            
            return (
              <div key={slot} className="flex group min-h-[80px]">
                <div className="w-20 pr-4 text-right text-xs font-medium text-slate-500 pt-2">
                  {slot}
                </div>
                <div className="flex-1 border-t border-slate-200 relative group-hover:bg-slate-100/30 transition-colors p-2">
                  {event && (
                    <div className={`absolute inset-x-2 top-2 rounded-md ${(event.color || 'bg-tech-blue').replace('bg-', 'bg-').replace('500', '500/20')} border ${(event.color || 'bg-tech-blue').replace('bg-', 'border-').replace('500', '500/30')} p-3 shadow-sm`}>
                      <p className={`text-sm font-semibold ${(event.color || 'bg-tech-blue').replace('bg-', 'text-')}`}>{event.title}</p>
                      <p className="text-xs text-slate-500 mt-1 flex items-center">
                        <Video className="mr-1 h-3 w-3 inline" /> {event.type || 'Google Meet'} • {event.duration}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

