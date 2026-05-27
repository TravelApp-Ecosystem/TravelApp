"use client";

import React, { useState, useEffect } from 'react';
import { Palmtree, Ticket, DatabaseZap } from 'lucide-react';
import { collection, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Tour, Reservation } from '@/types/experiences';
import { TourCard } from '@/components/experiences/TourCard';

const SEED_TOURS: Tour[] = [
  {
    id: 'TOUR-001',
    title: 'La Habana VIP: Historia y Ron',
    location: 'La Habana, Cuba',
    price: 150,
    description: 'Descubre los secretos de la ciudad vieja en un recorrido privado en auto clásico, terminando con una degustación premium de rones añejos en la terraza del Hotel Nacional.',
    imageUrl: 'https://images.unsplash.com/photo-1510006764491-a12810a9c8b7?auto=format&fit=crop&q=80&w=800',
    availability: 'Disponible',
  },
  {
    id: 'TOUR-002',
    title: 'Varadero Sunset Catamarán',
    location: 'Varadero, Cuba',
    price: 85,
    description: 'Navega por las cristalinas aguas de Varadero al atardecer. Incluye barra libre, música en vivo y una cena de langosta fresca a bordo.',
    imageUrl: 'https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&q=80&w=800',
    availability: 'Cupos Limitados',
  },
  {
    id: 'TOUR-003',
    title: 'Viñales Nature & Tobacco',
    location: 'Pinar del Río, Cuba',
    price: 120,
    description: 'Excursión de día completo al Valle de Viñales. Cabalgata por los mogotes, visita a fincas tabacaleras tradicionales y almuerzo campesino orgánico.',
    imageUrl: 'https://images.unsplash.com/photo-1590483840742-8c1719b66bb2?auto=format&fit=crop&q=80&w=800',
    availability: 'Disponible',
  }
];

export default function ExperiencesPage() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'reservations'>('catalog');
  const [tours, setTours] = useState<Tour[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    // Sincronización en vivo con Firestore
    const unsubscribe = onSnapshot(collection(db, 'experiences'), (snapshot) => {
      const fetchedTours: Tour[] = [];
      snapshot.forEach(doc => {
        fetchedTours.push(doc.data() as Tour);
      });
      setTours(fetchedTours);
    });

    return () => unsubscribe();
  }, []);

  const handleSeedTours = async () => {
    setIsSeeding(true);
    try {
      for (const tour of SEED_TOURS) {
        await setDoc(doc(db, 'experiences', tour.id), tour);
      }
      alert('Tours inyectados correctamente en Firestore.');
    } catch (error) {
      console.error('Error inyectando tours:', error);
      alert('Hubo un error al inyectar los tours.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="flex h-full flex-col p-6 lg:p-8 bg-slate-50">
      
      {/* Header y Pestañas (SPA) */}
      <div className="mb-8 flex flex-col justify-between space-y-4 sm:flex-row sm:items-end sm:space-y-0">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-tech-blue">Centro de Experiencias</h1>
          <p className="mt-2 text-slate-500">Gestión de tours, paquetes y reservas del ecosistema.</p>
        </div>
        
        {/* Acciones de Admin (Temporal) */}
        {tours.length === 0 && (
          <button 
            onClick={handleSeedTours}
            disabled={isSeeding}
            className="flex items-center rounded-xl border border-lime-500/30 bg-lime-500/10 px-4 py-2 text-sm font-bold text-lime-400 hover:bg-lime-500/20 transition-colors disabled:opacity-50"
          >
            <DatabaseZap className="mr-2 h-4 w-4" />
            {isSeeding ? 'Inyectando...' : 'Seed Data: Cargar Tours Base'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-8 flex space-x-1 rounded-xl bg-white/50 p-1 backdrop-blur-md w-max border border-slate-200">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center rounded-lg px-6 py-2.5 text-sm font-bold transition-all ${
            activeTab === 'catalog'
              ? 'bg-tech-blue text-tech-blue shadow-lg shadow-blue-900/20'
              : 'text-slate-500 hover:text-tech-blue hover:bg-slate-100'
          }`}
        >
          <Palmtree className="mr-2 h-4 w-4" />
          Catálogo de Tours
        </button>
        <button
          onClick={() => setActiveTab('reservations')}
          className={`flex items-center rounded-lg px-6 py-2.5 text-sm font-bold transition-all ${
            activeTab === 'reservations'
              ? 'bg-lime-500 text-gray-950 shadow-lg shadow-lime-900/20'
              : 'text-slate-500 hover:text-tech-blue hover:bg-slate-100'
          }`}
        >
          <Ticket className="mr-2 h-4 w-4" />
          Gestión de Reservas
        </button>
      </div>

      {/* Contenido SPA */}
      <div className="flex-1 overflow-y-auto">
        
        {activeTab === 'catalog' && (
          <div>
            {tours.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50">
                <Palmtree className="mb-4 h-12 w-12 text-gray-600" />
                <h3 className="text-lg font-medium text-slate-600">Catálogo Vacío</h3>
                <p className="mt-1 text-sm text-slate-500">Haz clic en 'Seed Data' para inicializar la base de datos.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tours.map(tour => (
                  <TourCard key={tour.id} tour={tour} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reservations' && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
            {/* Placeholder List for Reservations */}
            <div className="border-b border-slate-200 p-6 bg-slate-50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-tech-blue">Reservas Activas</h3>
              <span className="text-sm text-slate-500">Total: 2 (Mock)</span>
            </div>
            <div className="divide-y divide-gray-800/50">
              {/* Mock Row 1 */}
              <div className="flex items-center justify-between p-6 hover:bg-slate-100/50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-tech-blue">Carlos Mendoza (VIP)</p>
                  <p className="text-xs text-slate-500 mt-1">La Habana VIP: Historia y Ron • 2 Pax</p>
                </div>
                <span className="inline-flex rounded-full bg-tech-blue/10 px-3 py-1 text-xs font-bold text-blue-400 border border-blue-500/20">
                  Confirmada
                </span>
              </div>
              {/* Mock Row 2 */}
              <div className="flex items-center justify-between p-6 hover:bg-slate-100/50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-tech-blue">Familia Rodríguez</p>
                  <p className="text-xs text-slate-500 mt-1">Varadero Sunset Catamarán • 4 Pax</p>
                </div>
                <span className="inline-flex rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-500 border border-yellow-500/20">
                  Pendiente
                </span>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
