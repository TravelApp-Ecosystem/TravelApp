'use client';

import React, { useState, useEffect } from 'react';
import { Palmtree, DatabaseZap, Plus, Edit, Trash2, X, Save, Upload, HelpCircle } from 'lucide-react';
import { collection, onSnapshot, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Tour } from '@/types/experiences';
import { TourCard } from '@/components/experiences/TourCard';

const SEED_TOURS: Tour[] = [
  {
    id: 'EXP-001',
    title: 'Mendoza Wine Tour Premium',
    location: 'Mendoza, Argentina',
    price: 350,
    currency: 'USD',
    priceRewards: 280,
    pointsEarned: 150,
    tripType: 'Grupal',
    transportation: 'SUV Premium',
    departureDate: '2026-10-12',
    departureOrigin: 'Mendoza Capital',
    services: ['Degustación Premium', 'Almuerzo 5 pasos', 'Guía Sommelier', 'Traslados'],
    imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=800',
    description: 'Recorrido exclusivo por 3 de las mejores bodegas del Valle de Uco, terminando con un almuerzo maridado de primer nivel.',
    observations: 'Cupos limitados por protocolo de bodega. Consultar por tarifas grupales especiales.',
    availability: 'Disponible',
  },
  {
    id: 'EXP-002',
    title: 'Aventura en Quebrada de Humahuaca',
    location: 'Jujuy, Argentina',
    price: 85000,
    currency: 'ARS',
    priceRewards: 68000,
    pointsEarned: 100,
    tripType: 'Grupal',
    transportation: 'MiniBus 4x4',
    departureDate: '2026-09-05',
    departureOrigin: 'San Salvador de Jujuy',
    services: ['Trekking Guiado', 'Entradas Parques', 'Almuerzo Criollo', 'Seguro'],
    imageUrl: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&q=80&w=800',
    description: 'Senderismo por el Cerro de los Siete Colores y Purmamarca, conociendo las costumbres locales del NOA.',
    observations: 'Llevar calzado de trekking y abrigo liviano para la tarde.',
    availability: 'Cupos Limitados',
  }
];

export default function ExperienceCatalogPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  // Editor States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Partial<Tour> | null>(null);
  const [serviceInput, setServiceInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Sincronización en vivo con Firestore
    const unsubscribe = onSnapshot(collection(db, 'experiences'), (snapshot) => {
      const fetchedTours: Tour[] = [];
      snapshot.forEach(doc => {
        fetchedTours.push(doc.data() as Tour);
      });
      setTours(fetchedTours);
      setLoading(false);
    }, (err) => {
      console.error("Error loading experiences catalog:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSeedTours = async () => {
    setIsSeeding(true);
    try {
      for (const tour of SEED_TOURS) {
        await setDoc(doc(db, 'experiences', tour.id), tour);
      }
      alert('Tours base inyectados con éxito.');
    } catch (error) {
      console.error('Error seeding:', error);
      alert('Error al inyectar tours base.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleOpenEditor = (tour: Tour | null = null) => {
    if (tour) {
      setEditingTour({ ...tour });
    } else {
      setEditingTour({
        id: `EXP-${Math.floor(100 + Math.random() * 900)}`,
        title: '',
        location: '',
        price: 0,
        currency: 'USD',
        priceRewards: 0,
        pointsEarned: 0,
        tripType: 'Individual',
        transportation: '',
        departureDate: '',
        departureOrigin: '',
        services: [],
        imageUrl: '',
        description: '',
        observations: '',
        availability: 'Disponible',
      });
    }
    setServiceInput('');
    setIsEditorOpen(true);
  };

  const handleSaveTour = async () => {
    if (!editingTour?.id || !editingTour.title || !editingTour.location) {
      alert('Por favor completa los campos principales (Código, Título y Destino).');
      return;
    }

    try {
      await setDoc(doc(db, 'experiences', editingTour.id), editingTour);
      setIsEditorOpen(false);
      setEditingTour(null);
    } catch (error) {
      console.error('Error saving tour:', error);
      alert('No se pudo guardar el viaje en la base de datos.');
    }
  };

  const handleDeleteTour = async (id: string) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el viaje con código ${id}?`)) {
      try {
        await deleteDoc(doc(db, 'experiences', id));
      } catch (error) {
        console.error('Error deleting tour:', error);
        alert('Error al eliminar el viaje.');
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const base64 = canvas.toDataURL('image/jpeg', 0.7);
        setEditingTour(prev => prev ? { ...prev, imageUrl: base64 } : null);
        setIsUploading(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex h-full flex-col p-6 lg:p-8 bg-slate-50 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-end sm:space-y-0 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-tech-blue flex items-center gap-2">
            <Palmtree className="h-7 w-7 text-green-500" />
            Catálogo de Viajes
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 font-medium">Gestión del stock de experiencias y paquetes turísticos de Concorde 360.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {tours.length === 0 && (
            <button 
              onClick={handleSeedTours}
              disabled={isSeeding}
              className="flex items-center rounded-xl border border-lime-500/30 bg-lime-500/10 px-4 py-2.5 text-sm font-bold text-lime-600 hover:bg-lime-500/20 transition-colors disabled:opacity-50"
            >
              <DatabaseZap className="mr-2 h-4 w-4" />
              {isSeeding ? 'Inyectando...' : 'Cargar Tours Base'}
            </button>
          )}

          <button
            onClick={() => handleOpenEditor()}
            className="flex items-center rounded-xl bg-tech-blue px-5 py-2.5 text-sm font-bold text-white hover:bg-tech-blue/90 shadow-lg transition-all"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Viaje
          </button>
        </div>
      </div>

      {/* Grid de Experiencias */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Cargando catálogo...</div>
      ) : tours.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tours.map(tour => (
            <div key={tour.id} className="relative group">
              <TourCard tour={tour} />
              
              {/* Acciones Rápidas flotantes */}
              <div className="absolute right-4 top-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  onClick={() => handleOpenEditor(tour)}
                  className="rounded-lg bg-white p-2 text-slate-600 hover:text-tech-blue shadow-md border border-slate-100 transition-colors"
                  title="Editar"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteTour(tour.id)}
                  className="rounded-lg bg-white p-2 text-red-500 hover:text-red-700 shadow-md border border-slate-100 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-400">
          No hay viajes registrados. Utiliza el botón superior para agregar el primero.
        </div>
      )}

      {/* Editor Modal */}
      {isEditorOpen && editingTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">
                {editingTour.title ? `Editar Viaje: ${editingTour.title}` : 'Crear Nuevo Viaje'}
              </h2>
              <button onClick={() => setIsEditorOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Código del Viaje (ID)</label>
                  <input
                    type="text"
                    value={editingTour.id || ''}
                    onChange={e => setEditingTour(prev => ({ ...prev, id: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                    placeholder="EXP-101"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Título del Tour</label>
                  <input
                    type="text"
                    value={editingTour.title || ''}
                    onChange={e => setEditingTour(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                    placeholder="Mendoza Wine Premium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Ubicación / Destino</label>
                  <input
                    type="text"
                    value={editingTour.location || ''}
                    onChange={e => setEditingTour(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                    placeholder="Mendoza, Argentina"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Tipo de Salida</label>
                  <select
                    value={editingTour.tripType || 'Grupal'}
                    onChange={e => setEditingTour(prev => ({ ...prev, tripType: e.target.value as any }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none bg-white focus:border-tech-blue"
                  >
                    <option value="Grupal">Grupal Compartida</option>
                    <option value="Individual">Privado / Individual</option>
                  </select>
                </div>
              </div>

              {/* Precios y Puntos */}
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-black text-tech-blue uppercase tracking-wide mb-2">Precios y Fidelización</p>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Moneda</label>
                    <select
                      value={editingTour.currency || 'USD'}
                      onChange={e => setEditingTour(prev => ({ ...prev, currency: e.target.value as any }))}
                      className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-700 outline-none bg-white focus:border-tech-blue"
                    >
                      <option value="USD">Dólares (USD)</option>
                      <option value="ARS">Pesos (ARS)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Precio Normal</label>
                    <input
                      type="number"
                      value={editingTour.price || 0}
                      onChange={e => setEditingTour(prev => ({ ...prev, price: Number(e.target.value) }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Precio Canje (Pts)</label>
                    <input
                      type="number"
                      value={editingTour.priceRewards || 0}
                      onChange={e => setEditingTour(prev => ({ ...prev, priceRewards: Number(e.target.value) }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Pts Ganados</label>
                    <input
                      type="number"
                      value={editingTour.pointsEarned || 0}
                      onChange={e => setEditingTour(prev => ({ ...prev, pointsEarned: Number(e.target.value) }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                    />
                  </div>
                </div>
              </div>

              {/* Logística */}
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-black text-tech-blue uppercase tracking-wide mb-2">Detalles de Operaciones</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Medio de Traslado</label>
                    <input
                      type="text"
                      value={editingTour.transportation || ''}
                      onChange={e => setEditingTour(prev => ({ ...prev, transportation: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                      placeholder="MiniBus 4x4 o SUV Premium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Lugar de Salida</label>
                    <input
                      type="text"
                      value={editingTour.departureOrigin || ''}
                      onChange={e => setEditingTour(prev => ({ ...prev, departureOrigin: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                      placeholder="Mendoza Capital o Retiro"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Fecha de Salida</label>
                    <input
                      type="date"
                      value={editingTour.departureDate || ''}
                      onChange={e => setEditingTour(prev => ({ ...prev, departureDate: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Disponibilidad</label>
                    <select
                      value={editingTour.availability || 'Disponible'}
                      onChange={e => setEditingTour(prev => ({ ...prev, availability: e.target.value as any }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none bg-white focus:border-tech-blue"
                    >
                      <option value="Disponible">Disponible</option>
                      <option value="Cupos Limitados">Cupos Limitados</option>
                      <option value="Agotado">Agotado</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Imagen y Texto */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">URL de Imagen o Subir Archivo</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingTour.imageUrl || ''}
                      onChange={e => setEditingTour(prev => ({ ...prev, imageUrl: e.target.value }))}
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                      placeholder="https://images.unsplash.com/..."
                    />
                    <label className="flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 cursor-pointer text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all">
                      <Upload className="h-4 w-4 mr-1.5" />
                      {isUploading ? 'Subiendo...' : 'Subir'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Descripción del Tour</label>
                  <textarea
                    value={editingTour.description || ''}
                    onChange={e => setEditingTour(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue h-20 resize-none"
                    placeholder="Descripción detallada de la experiencia..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Observaciones</label>
                  <input
                    type="text"
                    value={editingTour.observations || ''}
                    onChange={e => setEditingTour(prev => ({ ...prev, observations: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                    placeholder="Recomendaciones o aclaraciones de cupo..."
                  />
                </div>
              </div>

              {/* Servicios Incluidos */}
              <div className="border-t border-slate-100 pt-3">
                <label className="block text-xs font-bold text-slate-500 mb-1">Servicios Incluidos</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={serviceInput}
                    onChange={e => setServiceInput(e.target.value)}
                    placeholder="Ej: Guía bilingüe"
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-tech-blue"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!serviceInput.trim()) return;
                      setEditingTour(prev => prev ? {
                        ...prev,
                        services: [...(prev.services || []), serviceInput.trim()]
                      } : null);
                      setServiceInput('');
                    }}
                    className="bg-slate-100 text-slate-700 rounded-lg px-4 py-2 text-xs font-bold border border-slate-200 hover:bg-slate-200"
                  >
                    Agregar
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {editingTour.services?.map((svc, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-1 rounded text-xs text-slate-600 font-semibold">
                      {svc}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTour(prev => prev ? {
                            ...prev,
                            services: (prev.services || []).filter((_, i) => i !== idx)
                          } : null);
                        }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-5 border-t border-slate-100 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveTour}
                className="rounded-lg bg-tech-blue px-4 py-2 text-xs font-bold text-white hover:bg-tech-blue/90"
              >
                Guardar Viaje
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
