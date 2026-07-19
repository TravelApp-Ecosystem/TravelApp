'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, AlertCircle, RefreshCw, Compass, ShieldAlert, Sparkles, Plus } from 'lucide-react';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface GroupTrip {
  id: string;
  title: string;
  destination: string;
  departureDate: string;
  totalSeats: number;
  availableSeats: number;
  notes?: string;
  passengers?: any[];
}

export default function ExperienceSpotsPage() {
  const [trips, setTrips] = useState<GroupTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Load group trips in real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'contracted_trips'), (snapshot) => {
      const list: GroupTrip[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const passengersCount = Array.isArray(data.passengers) ? data.passengers.length : 0;
        const total = Number(data.totalSeats || 40);
        const available = Number(data.availableSeats !== undefined ? data.availableSeats : (total - passengersCount));

        list.push({
          id: docSnap.id,
          title: data.title || 'Viaje Grupal Especial',
          destination: data.destination || 'Destino',
          departureDate: data.departureDate || '',
          totalSeats: total,
          availableSeats: available >= 0 ? available : 0,
          notes: data.notes || '',
          passengers: data.passengers || []
        });
      });
      setTrips(list);
      setLoading(false);
    }, (error) => {
      console.error("Error loading group trips spots:", error);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAdjustSeats = async (tripId: string, diff: number) => {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;

    const newAvailable = trip.availableSeats + diff;
    if (newAvailable < 0 || newAvailable > trip.totalSeats) {
      alert("Ajuste inválido: Excede los límites de cupos totales.");
      return;
    }

    try {
      await updateDoc(doc(db, 'contracted_trips', tripId), {
        availableSeats: newAvailable
      });
    } catch (err) {
      console.error("Error adjusting seats:", err);
    }
  };

  const filtered = trips.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    t.destination.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full w-full flex-col bg-slate-50 p-6 gap-6">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-tech-blue flex items-center gap-2">
            <Users className="h-7 w-7 text-green-500" />
            Cupos Disponibles
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">Control de disponibilidad de pasajes, asientos libres y reservas por viaje grupal.</p>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por título o destino..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-700 shadow-sm outline-none focus:border-tech-blue/40 focus:ring-2 focus:ring-tech-blue/10 transition-all"
        />
      </div>

      {/* Grid view of spots */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Cargando inventario de plazas...</div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(trip => {
            const booked = trip.totalSeats - trip.availableSeats;
            const fillRate = trip.totalSeats > 0 ? Math.round((booked / trip.totalSeats) * 100) : 0;
            const isFull = trip.availableSeats === 0;
            const isLow = trip.availableSeats > 0 && trip.availableSeats <= 5;

            return (
              <div key={trip.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden">
                {/* Visual fill indicator bar on top */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${isFull ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>

                <div>
                  <h3 className="font-bold text-tech-blue text-sm line-clamp-1">{trip.title}</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{trip.destination} · Salida: {trip.departureDate}</p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Ocupación</span>
                    <span>{fillRate}% ({booked} / {trip.totalSeats})</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-100 shadow-inner">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFull ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} 
                      style={{ width: `${fillRate}%` }}
                    ></div>
                  </div>
                </div>

                {/* Status Pills */}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] font-bold text-slate-400">Cupos Libres:</span>
                  {isFull ? (
                    <span className="inline-flex rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 font-bold text-rose-700 text-[10px] uppercase">
                      Agotado
                    </span>
                  ) : isLow ? (
                    <span className="inline-flex rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 font-bold text-amber-700 text-[10px] uppercase animate-pulse">
                      Últimos {trip.availableSeats} libres
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 font-bold text-emerald-700 text-[10px] uppercase">
                      {trip.availableSeats} disponibles
                    </span>
                  )}
                </div>

                {/* Adjustment Controls */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400">Ajustar plazas:</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAdjustSeats(trip.id, -1)}
                      disabled={isFull}
                      className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                    >
                      -1 Asiento
                    </button>
                    <button 
                      onClick={() => handleAdjustSeats(trip.id, 1)}
                      disabled={trip.availableSeats >= trip.totalSeats}
                      className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                    >
                      +1 Asiento
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-inner">
          <AlertCircle className="h-10 w-10 text-slate-350 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500">Sin viajes grupales registrados</p>
          <p className="text-xs text-slate-400 mt-1 max-w-[250px] mx-auto">
            Configura primero un viaje grupal en el catálogo operativo para ver su inventario de cupos.
          </p>
        </div>
      )}

    </div>
  );
}
