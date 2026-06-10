"use client";

import React, { useState, useEffect } from 'react';
import { Map as MapIcon, Search, Filter, Compass } from 'lucide-react';
import { TripCard } from '@/components/travelcab/TripCard';
import { Trip, TripStatus } from '@/types/travelcab';
import { UnifiedDispatcher } from '@/components/travelcab/UnifiedDispatcher';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import dynamic from 'next/dynamic';

// Importación dinámica para desactivar SSR y evitar errores de 'window is not defined' con Google Maps
const GoogleInteractiveMap = dynamic(
  () => import('@/components/travelcab/GoogleInteractiveMap').then((mod) => mod.GoogleInteractiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full flex-col items-center justify-center bg-slate-950 text-slate-400">
        <Compass className="h-10 w-10 animate-spin text-vial-orange mb-3" />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Iniciando Sistemas de Navegación...</p>
      </div>
    )
  }
);

export default function DispatcherPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [rightPanelMode, setRightPanelMode] = useState<'list' | 'dispatch'>('dispatch');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [previewCoords, setPreviewCoords] = useState<{
    originCoords: { lat: number; lng: number } | null;
    destinationCoords: { lat: number; lng: number } | null;
  } | null>(null);

  // Derivar activeTrip para evitar bucles infinitos en el useEffect
  const activeTrip = trips.find(t => t.id === activeTripId) || null;

  // Escuchar viajes en tiempo real desde Firestore
  useEffect(() => {
    const q = query(collection(db, 'trips'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tripsData: Trip[] = [];
      snapshot.forEach((doc) => {
        tripsData.push({ id: doc.id, ...doc.data() } as Trip);
      });
      
      setTrips(tripsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error al obtener viajes en tiempo real:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Actualizar estado del viaje en Firestore
  const handleUpdateTripStatus = async (tripId: string, newStatus: TripStatus, driverName?: string) => {
    try {
      const tripRef = doc(db, 'trips', tripId);
      const updateData: any = { status: newStatus };
      
      if (driverName) {
        updateData.driverName = driverName;
      }
      
      await updateDoc(tripRef, updateData);
    } catch (error) {
      console.error("Error al actualizar estado del viaje:", error);
      alert("No se pudo actualizar el estado del viaje.");
    }
  };

  // Filtrar viajes en base a búsqueda
  const filteredTrips = trips.filter(trip => 
    trip.passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-50">
      
      {/* Columna Izquierda (60%) - Mapa Interactivo Real con Google Maps */}
      <div className="hidden w-[60%] border-r border-slate-200 bg-slate-950 lg:flex lg:flex-col relative">
        <GoogleInteractiveMap 
          activeTrip={activeTrip}
          trips={trips}
          onUpdateTripStatus={handleUpdateTripStatus}
          previewCoords={previewCoords}
        />
      </div>

      {/* Columna Derecha (40%) - Panel de Control Lateral */}
      <div className="flex w-full flex-col bg-slate-50 lg:w-[40%]">
        
        {/* Toggle Nav */}
        <div className="flex border-b border-slate-200 bg-white">
          <button
            onClick={() => {
              setRightPanelMode('list');
              setPreviewCoords(null); // Clear preview when switching to operations list
            }}
            className={`flex-1 py-3 text-sm font-bold transition-all ${
              rightPanelMode === 'list' 
                ? 'border-b-2 border-vial-orange text-vial-orange' 
                : 'border-b-2 border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Lista de Viajes
          </button>
          <button
            onClick={() => {
              setRightPanelMode('dispatch');
              setActiveTripId(null); // Clear active trip so the new quote route can render on the map
            }}
            className={`flex-1 py-3 text-sm font-bold transition-all ${
              rightPanelMode === 'dispatch' 
                ? 'border-b-2 border-vial-orange text-vial-orange' 
                : 'border-b-2 border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Despachador Maestro
          </button>
        </div>

        {rightPanelMode === 'list' ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header Listado */}
            <div className="border-b border-slate-200 p-4 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-tech-blue">Centro de Operaciones</h2>
                <div className="flex h-6 w-10 items-center justify-center rounded-full bg-vial-orange text-xs font-bold text-gray-950">
                  {trips.length}
                </div>
              </div>
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar por pasajero, origen, destino..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm font-semibold text-tech-blue focus:border-vial-orange focus:outline-none focus:ring-2 focus:ring-vial-orange/15"
                  />
                </div>
                <button className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-500 hover:bg-slate-50 hover:text-tech-blue transition-all">
                  <Filter className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
              {isLoading ? (
                <div className="flex h-full flex-col items-center justify-center text-slate-400 py-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-400 border-t-transparent mb-3"></div>
                  <p className="text-xs font-bold uppercase tracking-wider">Cargando bitácora de flota...</p>
                </div>
              ) : filteredTrips.length > 0 ? (
                filteredTrips.map(trip => (
                  <div 
                    key={trip.id}
                    className={`transition-all ${activeTrip?.id === trip.id ? 'ring-2 ring-vial-orange scale-[1.01]' : ''}`}
                  >
                    <TripCard 
                      trip={trip} 
                      onClick={() => {
                        setActiveTripId(trip.id);
                        // Cuando se selecciona un viaje, mostramos su ruta en el mapa
                      }}
                    />
                  </div>
                ))
              ) : (
                <div className="flex h-[300px] flex-col items-center justify-center text-slate-400 text-center p-6 bg-white rounded-2xl border border-slate-200/60 shadow-inner">
                  <MapIcon className="h-10 w-10 text-slate-300 mb-3" />
                  <p className="text-sm font-bold text-slate-500">Sin traslados registrados</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">Utiliza el Despachador Maestro para registrar el primer viaje.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <UnifiedDispatcher onCoordsChange={setPreviewCoords} />
          </div>
        )}
      </div>

    </div>
  );
}
