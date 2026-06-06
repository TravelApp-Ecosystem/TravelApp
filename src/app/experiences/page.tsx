"use client";

import React, { useState, useEffect } from 'react';
import { Palmtree, Ticket, DatabaseZap, Plus, Edit, Trash2, X, Save, Upload, Award, ShieldAlert } from 'lucide-react';
import { collection, onSnapshot, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Tour, AvailabilityStatus, TripType } from '@/types/experiences';
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

export default function ExperiencesPage() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'reservations'>('catalog');
  const [tours, setTours] = useState<Tour[]>([]);
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

  // Image base64 compression helper
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
    <div className="flex h-full flex-col p-6 lg:p-8 bg-slate-50">
      
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between space-y-4 sm:flex-row sm:items-end sm:space-y-0">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-tech-blue">Panel de Experiencias</h1>
          <p className="mt-2 text-slate-500">Gestión completa de viajes, tours especiales y configuraciones del catálogo.</p>
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
            className="flex items-center rounded-xl bg-tech-blue px-5 py-2.5 text-sm font-bold text-white hover:bg-tech-blue/90 shadow-lg shadow-blue-500/10 transition-all hover:scale-[1.02]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Viaje
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex space-x-1 rounded-xl bg-white/50 p-1 backdrop-blur-md w-max border border-slate-200">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center rounded-lg px-6 py-2.5 text-sm font-bold transition-all ${
            activeTab === 'catalog'
              ? 'bg-tech-blue text-white shadow-md'
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
              ? 'bg-tech-blue text-white shadow-md'
              : 'text-slate-500 hover:text-tech-blue hover:bg-slate-100'
          }`}
        >
          <Ticket className="mr-2 h-4 w-4" />
          Gestión de Reservas
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'catalog' && (
          <div>
            {tours.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
                <Palmtree className="mb-4 h-12 w-12 text-slate-300" />
                <h3 className="text-lg font-bold text-slate-600">Catálogo de viajes vacío</h3>
                <p className="mt-1 text-sm text-slate-400">Comienza agregando un nuevo viaje o inyecta los de prueba.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tours.map(tour => (
                  <div key={tour.id} className="relative group">
                    <TourCard tour={tour} />
                    
                    {/* Controles de Administración flotantes al hacer hover */}
                    <div className="absolute top-2 left-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleOpenEditor(tour)}
                        className="p-2 rounded-lg bg-white/95 text-slate-700 hover:text-tech-blue shadow-md transition-colors hover:scale-105"
                        title="Editar Viaje"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTour(tour.id)}
                        className="p-2 rounded-lg bg-white/95 text-red-600 hover:bg-red-50 shadow-md transition-colors hover:scale-105"
                        title="Eliminar Viaje"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reservations' && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 p-6 bg-slate-50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-tech-blue">Reservas Activas de Experiencias</h3>
              <span className="text-sm font-semibold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full">Próximos Viajes</span>
            </div>
            <div className="divide-y divide-slate-100">
              <div className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-800">Gonzalo Pérez</p>
                  <p className="text-xs text-slate-500 mt-1">Mendoza Wine Tour Premium • 2 Personas • Código: EXP-001</p>
                </div>
                <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-600">
                  Confirmada
                </span>
              </div>
              <div className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-800">Martina Silva</p>
                  <p className="text-xs text-slate-500 mt-1">Aventura en Quebrada de Humahuaca • 1 Persona • Código: EXP-002</p>
                </div>
                <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-600">
                  Pendiente
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {isEditorOpen && editingTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-xl font-bold text-tech-blue">
                {editingTour.title ? 'Editar Viaje' : 'Nuevo Viaje de Catálogo'}
              </h3>
              <button 
                onClick={() => { setIsEditorOpen(false); setEditingTour(null); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Form Scrollable */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* ID del Viaje */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Código Único (Ej: EXP-001)</label>
                  <input
                    type="text"
                    value={editingTour.id || ''}
                    disabled={tours.some(t => t.id === editingTour.id) && editingTour.title !== ''} // Bloquear ID si ya existe al editar
                    onChange={(e) => setEditingTour({ ...editingTour, id: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-tech-blue"
                  />
                </div>

                {/* Título */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Título del Viaje</label>
                  <input
                    type="text"
                    value={editingTour.title || ''}
                    onChange={(e) => setEditingTour({ ...editingTour, title: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-tech-blue"
                  />
                </div>

                {/* Destino */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Destino (Localidad / Provincia)</label>
                  <input
                    type="text"
                    value={editingTour.location || ''}
                    onChange={(e) => setEditingTour({ ...editingTour, location: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-tech-blue"
                  />
                </div>

                {/* Tipo de Viaje */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Tipo de Viaje</label>
                  <select
                    value={editingTour.tripType || 'Individual'}
                    onChange={(e) => setEditingTour({ ...editingTour, tripType: e.target.value as TripType })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-tech-blue"
                  >
                    <option value="Individual">Individual</option>
                    <option value="Grupal">Grupal</option>
                  </select>
                </div>

                {/* Transporte */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Medio de Transporte</label>
                  <input
                    type="text"
                    value={editingTour.transportation || ''}
                    placeholder="Ej: Avión, Bus, SUV"
                    onChange={(e) => setEditingTour({ ...editingTour, transportation: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-tech-blue"
                  />
                </div>

                {/* Origen Salida */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Origen de Salida</label>
                  <input
                    type="text"
                    value={editingTour.departureOrigin || ''}
                    placeholder="Ej: San Miguel de Tucumán"
                    onChange={(e) => setEditingTour({ ...editingTour, departureOrigin: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-tech-blue"
                  />
                </div>

                {/* Fecha Salida */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Fecha de Salida</label>
                  <input
                    type="date"
                    value={editingTour.departureDate || ''}
                    onChange={(e) => setEditingTour({ ...editingTour, departureDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-tech-blue"
                  />
                </div>

                {/* Disponibilidad */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Estado Disponibilidad</label>
                  <select
                    value={editingTour.availability || 'Disponible'}
                    onChange={(e) => setEditingTour({ ...editingTour, availability: e.target.value as AvailabilityStatus })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-tech-blue"
                  >
                    <option value="Disponible">Disponible</option>
                    <option value="Cupos Limitados">Cupos Limitados</option>
                    <option value="Agotado">Agotado</option>
                  </select>
                </div>

                {/* Moneda */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Moneda de Carga</label>
                  <select
                    value={editingTour.currency || 'USD'}
                    onChange={(e) => setEditingTour({ ...editingTour, currency: e.target.value as 'ARS' | 'USD' })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-tech-blue"
                  >
                    <option value="USD">Dólares (USD)</option>
                    <option value="ARS">Pesos (ARS)</option>
                  </select>
                </div>

                {/* Precio Público */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Precio Público General</label>
                  <input
                    type="number"
                    value={editingTour.price || ''}
                    onChange={(e) => setEditingTour({ ...editingTour, price: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-tech-blue"
                  />
                </div>

                {/* Precio Miembro Rewards */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Precio Miembro Rewards</label>
                  <input
                    type="number"
                    value={editingTour.priceRewards || ''}
                    onChange={(e) => setEditingTour({ ...editingTour, priceRewards: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-tech-blue"
                  />
                </div>

                {/* Puntos que Suma */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Puntos Rewards Acumulables</label>
                  <input
                    type="number"
                    value={editingTour.pointsEarned || ''}
                    onChange={(e) => setEditingTour({ ...editingTour, pointsEarned: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-tech-blue"
                  />
                </div>

                {/* Subir Imagen */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Imagen de Portada (URL o Subida Local)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://..."
                      value={editingTour.imageUrl || ''}
                      onChange={(e) => setEditingTour({ ...editingTour, imageUrl: e.target.value })}
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-tech-blue"
                    />
                    <label className="flex items-center justify-center rounded-lg border border-dashed border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploading ? 'Reduciendo...' : 'Subir'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Vista previa de imagen */}
              {editingTour.imageUrl && (
                <div className="relative h-40 w-full overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                  <img src={editingTour.imageUrl} alt="preview" className="h-full w-full object-cover" />
                  <button 
                    onClick={() => setEditingTour({ ...editingTour, imageUrl: '' })}
                    className="absolute top-2 right-2 bg-slate-900/80 text-white rounded-full p-1.5 hover:bg-slate-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Servicios Incluidos */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Servicios Incluidos (Ej: Traslado, Hotel 5*, Desayuno)</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={serviceInput}
                    placeholder="Escribe un servicio y presiona añadir..."
                    onChange={(e) => setServiceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && serviceInput.trim()) {
                        e.preventDefault();
                        const current = editingTour.services || [];
                        setEditingTour({ ...editingTour, services: [...current, serviceInput.trim()] });
                        setServiceInput('');
                      }
                    }}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-tech-blue"
                  />
                  <button
                    onClick={() => {
                      if (serviceInput.trim()) {
                        const current = editingTour.services || [];
                        setEditingTour({ ...editingTour, services: [...current, serviceInput.trim()] });
                        setServiceInput('');
                      }
                    }}
                    className="rounded-lg bg-slate-100 hover:bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
                  >
                    Añadir
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(editingTour.services || []).map((srv, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 rounded-lg bg-tech-blue/5 border border-tech-blue/10 px-2.5 py-1 text-xs font-bold text-tech-blue">
                      {srv}
                      <button 
                        onClick={() => {
                          const updated = (editingTour.services || []).filter((_, i) => i !== idx);
                          setEditingTour({ ...editingTour, services: updated });
                        }}
                        className="hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Descripción Detallada</label>
                <textarea
                  rows={4}
                  value={editingTour.description || ''}
                  onChange={(e) => setEditingTour({ ...editingTour, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-tech-blue"
                />
              </div>

              {/* Observaciones generales */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Observaciones / Notas Importantes</label>
                <textarea
                  rows={3}
                  value={editingTour.observations || ''}
                  onChange={(e) => setEditingTour({ ...editingTour, observations: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-tech-blue"
                />
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-4">
              <button
                onClick={() => { setIsEditorOpen(false); setEditingTour(null); }}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTour}
                className="flex items-center rounded-xl bg-tech-blue px-6 py-2.5 text-sm font-bold text-white hover:bg-tech-blue/90"
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar Viaje
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
