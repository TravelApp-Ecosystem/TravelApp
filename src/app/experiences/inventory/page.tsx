'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass, Plus, MapPin, Calendar, Users, Hotel, Bus, Plane,
  Image as ImageIcon, Video, CheckCircle2, AlertCircle, Trash2,
  Save, Sparkles, ArrowLeft, ArrowRight, Eye, Layers, Clock,
  FileText, ShieldCheck, Award, DollarSign, PlusCircle, ExternalLink
} from 'lucide-react';
import { collection, onSnapshot, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  MasterTrip, ItineraryDay, BoardingPoint, OptionalExcursion,
  ScheduledDeparture, TripScope, CurrencyType, FoodPlan
} from '@/types/experiences';

export default function ExperienceInventoryPage() {
  const [trips, setTrips] = useState<MasterTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');

  // Active Editor State
  const [activeTab, setActiveTab] = useState<'general' | 'itinerary' | 'services' | 'departures' | 'practical'>('general');
  const [editingTripId, setEditingTripId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [scope, setScope] = useState<TripScope>('Nacional');
  const [currency, setCurrency] = useState<CurrencyType>('ARS');
  const [price, setPrice] = useState<number>(185000);
  const [priceRewards, setPriceRewards] = useState<number>(155000);
  const [pointsEarned, setPointsEarned] = useState<number>(250);
  const [transportation, setTransportation] = useState('Bus Chárter Ejecutivo 55 Butacas');
  const [hotelName, setHotelName] = useState('Hotel Alejandro I');
  const [nightsCount, setNightsCount] = useState<number>(5);
  const [foodPlan, setFoodPlan] = useState<FoodPlan>('Media_Pension');
  const [departureOrigin, setDepartureOrigin] = useState('Buenos Aires (Retiro & Paradas)');
  const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?q=80&w=800&auto=format&fit=crop');
  const [galleryImages, setGalleryImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&q=80&w=800'
  ]);
  const [videoUrl, setVideoUrl] = useState('');
  const [overviewDescription, setOverviewDescription] = useState('Salida grupal organizada recorriendo los paisajes más imponentes con hotelería seleccionada, coordinador permanente y seguro médico.');

  // Itinerario Día por Día
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([
    {
      dayNumber: 1,
      title: 'Salida & Recepción en Destino',
      description: 'Salida en horas de la tarde desde los puntos de ascenso acordados. Noche a bordo en bus chárter con servicio de vianda.',
      timeSlot: '19:00 hs',
      includedMeals: ['Cena'],
      activities: ['Puntos de Embarque', 'Noche en Ruta']
    },
    {
      dayNumber: 2,
      title: 'Llegada, Check-in & City Tour Histórico',
      description: 'Arribo en horas de la mañana, check-in en el hotel y almuerzo de bienvenida. Por la tarde, recorrido guiado por el casco histórico.',
      timeSlot: 'Mañana y Tarde',
      includedMeals: ['Desayuno', 'Almuerzo'],
      activities: ['Check-in', 'City Tour Guiado', 'Cena Libre']
    }
  ]);

  // Inclusiones y Exclusiones
  const [includedServices, setIncludedServices] = useState<string[]>([
    'Transporte privado ida y vuelta en Bus Chárter de Lujo',
    '5 Noches de alojamiento en hotel con desayuno y cena',
    'Coordinador permanente y guías locales autorizados',
    'Cobertura médica integral Assist Card 24hs',
    'Kit de viaje y traslados a todas las excursiones'
  ]);
  const [notIncludedServices, setNotIncludedServices] = useState<string[]>([
    'Bebidas en las cenas del hotel',
    'Propinas a guías y maleteros',
    'Gastos personales y excursiones opcionales'
  ]);

  // Puntos de Embarque / Ascenso
  const [boardingPoints, setBoardingPoints] = useState<BoardingPoint[]>([
    { id: 'bp-1', locationName: 'Terminal de Ómnibus Retiro (Plat. 1 a 5)', city: 'Buenos Aires', scheduledTime: '19:00 hs' },
    { id: 'bp-2', locationName: 'Parador Pacheco (Panamericana km 32)', city: 'Tigre', scheduledTime: '20:15 hs' },
    { id: 'bp-3', locationName: 'Parador Zárate (Ruta 9)', city: 'Zárate', scheduledTime: '21:30 hs' }
  ]);

  // Excursiones Opcionales
  const [optionalExcursions, setOptionalExcursions] = useState<OptionalExcursion[]>([
    {
      id: 'exc-1',
      title: 'Excursión en 4x4 a Serranía del Hornocal (14 Colores)',
      description: 'Ascenso a 4.350 msnm para contemplar el atardecer en el mirador de los 14 colores.',
      price: 35000,
      currency: 'ARS',
      duration: 'Medio Día'
    }
  ]);

  // Ficha Práctica
  const [requiredDocs, setRequiredDocs] = useState<string[]>([
    'DNI Argentino vigente o Pasaporte',
    'Voucher digital de reserva en la app',
    'Ficha médica / Carnet de obra social'
  ]);
  const [recommendations, setRecommendations] = useState(
    'Llevar ropa cómoda de abrigo en capas (amplitud térmica), protector solar FPS 50+, lentes de sol, calzado de trekking y botella de agua personal.'
  );

  // Salidas Calendarizadas
  const [scheduledDepartures, setScheduledDepartures] = useState<ScheduledDeparture[]>([
    {
      id: 'dep-1',
      departureDate: '2026-10-12',
      returnDate: '2026-10-18',
      status: 'Abierta',
      totalSeats: 45,
      availableSeats: 38,
      rooming: {
        single: { totalBlocked: 4, occupied: 1, available: 3 },
        doble: { totalBlocked: 15, occupied: 2, available: 13 },
        triple: { totalBlocked: 4, occupied: 0, available: 4 },
        cuadruple: { totalBlocked: 2, occupied: 0, available: 2 }
      },
      coordinator: { name: 'Marcos Vignola', phone: '+5493815556667' },
      transportProvider: 'Flecha Bus Chárter'
    }
  ]);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // 1. Sync master trips & catalog in real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'experiences'), (snap) => {
      const list: MasterTrip[] = [];
      snap.forEach(d => {
        const data = d.data();
        list.push({
          id: d.id,
          title: data.title || 'Experiencia',
          destination: data.location || data.destination || 'Destino',
          scope: data.scope || 'Nacional',
          currency: data.currency || 'ARS',
          price: Number(data.price || 0),
          priceRewards: Number(data.priceRewards || 0),
          pointsEarned: Number(data.pointsEarned || 0),
          tripType: data.tripType || 'Grupal',
          transportation: data.transportation || 'Bus Chárter',
          hotelName: data.hotelName || 'Hotel Seleccionado',
          nightsCount: Number(data.nightsCount || 4),
          foodPlan: data.foodPlan || 'Media_Pension',
          departureOrigin: data.departureOrigin || 'A convenir',
          coverImage: data.imageUrl || data.coverImage || 'https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?q=80&w=800&auto=format&fit=crop',
          galleryImages: data.galleryImages || [],
          videoUrl: data.videoUrl || '',
          overviewDescription: data.description || '',
          itinerary: data.itinerary || [],
          includedServices: data.services || [],
          notIncludedServices: data.notIncludedServices || [],
          boardingPoints: data.boardingPoints || [],
          optionalExcursions: data.optionalExcursions || [],
          requiredDocs: data.requiredDocs || [],
          recommendations: data.observations || data.recommendations || '',
          scheduledDepartures: data.scheduledDepartures || [],
          createdAt: data.createdAt || new Date().toISOString()
        });
      });
      setTrips(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Cargar viaje para edición
  const handleEditTrip = (trip: MasterTrip) => {
    setEditingTripId(trip.id);
    setTitle(trip.title);
    setDestination(trip.destination);
    setScope(trip.scope || 'Nacional');
    setCurrency(trip.currency || 'ARS');
    setPrice(trip.price || 150000);
    setPriceRewards(trip.priceRewards || 120000);
    setPointsEarned(trip.pointsEarned || 200);
    setTransportation(trip.transportation || '');
    setHotelName(trip.hotelName || '');
    setNightsCount(trip.nightsCount || 4);
    setFoodPlan(trip.foodPlan || 'Media_Pension');
    setDepartureOrigin(trip.departureOrigin || '');
    setCoverImage(trip.coverImage || '');
    setGalleryImages(trip.galleryImages || []);
    setVideoUrl(trip.videoUrl || '');
    setOverviewDescription(trip.overviewDescription || '');
    setItinerary(trip.itinerary && trip.itinerary.length > 0 ? trip.itinerary : [
      { dayNumber: 1, title: 'Salida & Recepción', description: 'Encuentro y traslado.', timeSlot: '19:00 hs', includedMeals: ['Cena'] }
    ]);
    setIncludedServices(trip.includedServices || []);
    setNotIncludedServices(trip.notIncludedServices || []);
    setBoardingPoints(trip.boardingPoints || []);
    setOptionalExcursions(trip.optionalExcursions || []);
    setRequiredDocs(trip.requiredDocs || []);
    setRecommendations(trip.recommendations || '');
    setScheduledDepartures(trip.scheduledDepartures || []);
    setViewMode('editor');
    setActiveTab('general');
  };

  // Crear nuevo viaje
  const handleNewTrip = () => {
    const newId = `EXP-M-${Math.floor(100 + Math.random() * 900)}`;
    setEditingTripId(newId);
    setTitle('Nueva Salida Organizada');
    setDestination('Mendoza & Alta Montaña');
    setScope('Nacional');
    setCurrency('ARS');
    setPrice(195000);
    setPriceRewards(165000);
    setPointsEarned(250);
    setTransportation('Bus Chárter Cama / Semicama');
    setHotelName('Hotel Gran Mendoza');
    setNightsCount(5);
    setFoodPlan('Media_Pension');
    setDepartureOrigin('Retiro / Terminal');
    setCoverImage('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800');
    setGalleryImages([]);
    setVideoUrl('');
    setOverviewDescription('Experiencia grupal única con coordinación permanente.');
    setItinerary([
      { dayNumber: 1, title: 'Salida hacia destino', description: 'Embarque en puntos de ascenso y noche en ruta.', timeSlot: '19:00 hs', includedMeals: ['Cena'] },
      { dayNumber: 2, title: 'Arribo & Alojamiento', description: 'Check-in y tarde de actividades guiadas.', timeSlot: 'Mañana', includedMeals: ['Desayuno', 'Cena'] }
    ]);
    setIncludedServices(['Bus Chárter Exclusivo', 'Alojamiento con Media Pensión', 'Coordinador Guía', 'Asistencia Médica']);
    setNotIncludedServices(['Bebidas en comidas', 'Gastos personales']);
    setBoardingPoints([{ id: 'bp-1', locationName: 'Terminal Central', city: 'Buenos Aires', scheduledTime: '19:00 hs' }]);
    setOptionalExcursions([]);
    setRequiredDocs(['DNI Argentino vigente', 'Voucher digital']);
    setRecommendations('Ropa cómoda, calzado de trekking y protector solar.');
    setScheduledDepartures([{
      id: 'dep-1',
      departureDate: '2026-11-15',
      returnDate: '2026-11-21',
      status: 'Abierta',
      totalSeats: 45,
      availableSeats: 45,
      rooming: {
        single: { totalBlocked: 4, occupied: 0, available: 4 },
        doble: { totalBlocked: 15, occupied: 0, available: 15 },
        triple: { totalBlocked: 4, occupied: 0, available: 4 },
        cuadruple: { totalBlocked: 2, occupied: 0, available: 2 }
      },
      coordinator: { name: 'Equipo de Coordinación', phone: '+5493815556667' },
      transportProvider: 'Transporte Chárter'
    }]);
    setViewMode('editor');
    setActiveTab('general');
  };

  // Guardar Ficha Maestra en Firebase
  const handleSaveMasterTrip = async () => {
    if (!title || !destination) {
      alert('Por favor completá el título y destino del viaje.');
      return;
    }

    setSaving(true);
    setFeedback(null);

    const tripId = editingTripId || `EXP-M-${Math.floor(100 + Math.random() * 900)}`;

    const masterTripPayload: MasterTrip = {
      id: tripId,
      title,
      destination,
      scope,
      currency,
      price,
      priceRewards,
      pointsEarned,
      tripType: 'Grupal',
      transportation,
      hotelName,
      nightsCount,
      foodPlan,
      departureOrigin,
      coverImage,
      galleryImages,
      videoUrl,
      overviewDescription,
      itinerary,
      includedServices,
      notIncludedServices,
      boardingPoints,
      optionalExcursions,
      requiredDocs,
      recommendations,
      scheduledDepartures,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // 1. Guardar en master_trips
      await setDoc(doc(db, 'master_trips', tripId), masterTripPayload);

      // 2. Publicar en experiences para que Marketplace y App se sincronicen
      await setDoc(doc(db, 'experiences', tripId), {
        id: tripId,
        title,
        location: destination,
        price,
        currency,
        priceRewards,
        pointsEarned,
        tripType: 'Grupal',
        scope,
        transportation,
        departureDate: scheduledDepartures[0]?.departureDate || '2026-10-15',
        departureOrigin,
        services: includedServices,
        imageUrl: coverImage,
        galleryImages,
        itinerary,
        description: overviewDescription,
        observations: recommendations,
        availability: 'Disponible',
        boardingPoints,
        optionalExcursions,
        scheduledDepartures,
        createdAt: new Date().toISOString()
      });

      setFeedback(`¡Ficha Maestra ${tripId} guardada y publicada exitosamente!`);
      setSaving(false);
      setTimeout(() => {
        setFeedback(null);
        setViewMode('list');
      }, 2000);
    } catch (err: any) {
      console.error('Error saving master trip:', err);
      alert(`Error al guardar la ficha de viaje: ${err.message}`);
      setSaving(false);
    }
  };

  // Helper Itinerario: Agregar / Eliminar Día
  const handleAddItineraryDay = () => {
    const nextDay = itinerary.length + 1;
    setItinerary([
      ...itinerary,
      {
        dayNumber: nextDay,
        title: `Día ${nextDay}: Actividades Programadas`,
        description: 'Detalle de los paseos, visitas y tiempo libre.',
        timeSlot: 'Día Completo',
        includedMeals: ['Desayuno'],
        activities: ['Excursión']
      }
    ]);
  };

  const handleRemoveItineraryDay = (index: number) => {
    const next = itinerary.filter((_, i) => i !== index).map((day, idx) => ({ ...day, dayNumber: idx + 1 }));
    setItinerary(next);
  };

  // Helper Salidas: Agregar Fecha
  const handleAddDepartureDate = () => {
    const nextId = `dep-${Date.now()}`;
    const newDep: ScheduledDeparture = {
      id: nextId,
      departureDate: '2026-11-20',
      returnDate: '2026-11-26',
      status: 'Abierta',
      totalSeats: 45,
      availableSeats: 45,
      rooming: {
        single: { totalBlocked: 4, occupied: 0, available: 4 },
        doble: { totalBlocked: 15, occupied: 0, available: 15 },
        triple: { totalBlocked: 4, occupied: 0, available: 4 },
        cuadruple: { totalBlocked: 2, occupied: 0, available: 2 }
      },
      coordinator: { name: 'Coordinador Asignado', phone: '+5493815556667' },
      transportProvider: 'Flecha Bus Chárter'
    };
    setScheduledDepartures([...scheduledDepartures, newDep]);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-6">
      {/* TOP HEADER */}
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/experiences"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <span className="rounded-full bg-tech-blue/10 px-3 py-0.5 text-xs font-bold text-tech-blue uppercase tracking-wider">
              Módulo Operativo
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2 mt-0.5">
              <Layers className="h-7 w-7 text-tech-blue" />
              Ficha Maestra de Experiencias &amp; Salidas
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {viewMode === 'list' ? (
            <button
              type="button"
              onClick={handleNewTrip}
              className="px-5 py-2.5 bg-tech-blue text-white rounded-xl text-xs font-black hover:bg-blue-700 transition shadow-md shadow-tech-blue/20 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nueva Ficha Maestra de Viaje
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
            >
              Volver al Catálogo
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="max-w-7xl mx-auto p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          {feedback}
        </div>
      )}

      {/* VISTA 1: LISTADO DE FICHAS MAESTRAS */}
      {viewMode === 'list' ? (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map(trip => (
              <div
                key={trip.id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:border-tech-blue transition flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 w-full bg-slate-100">
                    <img
                      src={trip.coverImage}
                      alt={trip.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[10px] font-bold">
                      {trip.scope}
                    </div>
                    <div className="absolute top-3 right-3 bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-black">
                      ${trip.price?.toLocaleString()} {trip.currency}
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="font-extrabold text-sm text-slate-800 line-clamp-1">{trip.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{trip.overviewDescription}</p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-tech-blue" />
                        <span className="truncate">{trip.destination}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-purple-600" />
                        <span>{trip.nightsCount} Noches</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="h-3.5 w-3.5 text-amber-500" />
                        <span>+{trip.pointsEarned} pts Rewards</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{trip.scheduledDepartures?.length || 1} Salidas</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditTrip(trip)}
                    className="flex-1 py-2 bg-tech-blue text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
                  >
                    Editar Ficha &amp; Salidas
                  </button>
                  <Link
                    href={`/experiences/spots`}
                    className="px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition flex items-center justify-center"
                    title="Ver Stock de Butacas y Rooming"
                  >
                    <Users className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* VISTA 2: EDITOR COMPLETO DE FICHA MAESTRA */
        <div className="max-w-7xl mx-auto space-y-6">
          {/* TABS DE NAVEGACIÓN */}
          <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm text-xs font-bold">
            {[
              { id: 'general', label: '1. Cabecera & Precios', icon: <Compass className="h-4 w-4" /> },
              { id: 'itinerary', label: '2. Itinerario Día por Día', icon: <Calendar className="h-4 w-4" /> },
              { id: 'services', label: '3. Servicios & Paradas', icon: <Bus className="h-4 w-4" /> },
              { id: 'practical', label: '4. Ficha Práctica & Qué Llevar', icon: <FileText className="h-4 w-4" /> },
              { id: 'departures', label: '5. Salidas Programadas (Stock)', icon: <Users className="h-4 w-4" /> }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2.5 px-4 rounded-xl transition ${
                  activeTab === tab.id
                    ? 'bg-tech-blue text-white shadow-md shadow-tech-blue/20'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* TAB 1: INFORMACIÓN GENERAL & PRECIOS */}
          {activeTab === 'general' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Compass className="h-5 w-5 text-tech-blue" />
                Información Básica, Multimedia &amp; Precios
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="md:col-span-2">
                  <label className="block text-slate-600 font-bold mb-1">Título de la Experiencia</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Destino Principal</label>
                  <input
                    type="text"
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Alcance Geográfico</label>
                  <select
                    value={scope}
                    onChange={e => setScope(e.target.value as TripScope)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                  >
                    <option value="Nacional">🇦🇷 Nacional (Argentina)</option>
                    <option value="Internacional">🌎 Internacional (Exterior)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Precio PVP Referencia</label>
                  <div className="flex">
                    <select
                      value={currency}
                      onChange={e => setCurrency(e.target.value as CurrencyType)}
                      className="rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 font-bold px-2"
                    >
                      <option value="ARS">ARS ($)</option>
                      <option value="USD">USD (U$D)</option>
                    </select>
                    <input
                      type="number"
                      value={price}
                      onChange={e => setPrice(Number(e.target.value))}
                      className="w-full rounded-r-xl border border-slate-200 p-2.5 font-black text-emerald-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Precio Socios Rewards</label>
                  <input
                    type="number"
                    value={priceRewards}
                    onChange={e => setPriceRewards(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-black text-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Puntos Rewards que Acumula</label>
                  <input
                    type="number"
                    value={pointsEarned}
                    onChange={e => setPointsEarned(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Transporte Principal</label>
                  <input
                    type="text"
                    value={transportation}
                    onChange={e => setTransportation(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Hotel y Cantidad de Noches</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={hotelName}
                      onChange={e => setHotelName(e.target.value)}
                      placeholder="Hotel"
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                    />
                    <input
                      type="number"
                      value={nightsCount}
                      onChange={e => setNightsCount(Number(e.target.value))}
                      placeholder="Noches"
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                    />
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-slate-600 font-bold mb-1">Imagen de Portada (URL)</label>
                  <input
                    type="text"
                    value={coverImage}
                    onChange={e => setCoverImage(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs"
                  />
                  {coverImage && (
                    <img src={coverImage} alt="Preview" className="h-36 w-full object-cover rounded-2xl mt-2 border border-slate-200" />
                  )}
                </div>

                <div className="md:col-span-3">
                  <label className="block text-slate-600 font-bold mb-1">Descripción General de la Experiencia</label>
                  <textarea
                    rows={3}
                    value={overviewDescription}
                    onChange={e => setOverviewDescription(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ITINERARIO DÍA POR DÍA */}
          {activeTab === 'itinerary' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    Itinerario Día por Día
                  </h2>
                  <p className="text-xs text-slate-400">
                    Este cronograma alimenta la pestaña 'Mi Viaje' en la app del cliente y el marketplace.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddItineraryDay}
                  className="px-4 py-2 bg-purple-100 text-purple-800 rounded-xl text-xs font-bold hover:bg-purple-200 transition flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Agregar Día
                </button>
              </div>

              <div className="space-y-4">
                {itinerary.map((day, idx) => (
                  <div key={idx} className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-xs text-purple-700 uppercase tracking-wider">
                        Día #{day.dayNumber}
                      </span>
                      {itinerary.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItineraryDay(idx)}
                          className="text-red-500 hover:text-red-700 text-xs p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="md:col-span-2">
                        <label className="block text-slate-500 font-bold mb-1">Título del Día</label>
                        <input
                          type="text"
                          value={day.title}
                          onChange={e => {
                            const val = e.target.value;
                            setItinerary(prev => prev.map((d, i) => i === idx ? { ...d, title: val } : d));
                          }}
                          className="w-full p-2 bg-white rounded-lg border border-slate-200 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 font-bold mb-1">Horario / Turno</label>
                        <input
                          type="text"
                          value={day.timeSlot || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setItinerary(prev => prev.map((d, i) => i === idx ? { ...d, timeSlot: val } : d));
                          }}
                          placeholder="Ej: 09:00 hs / Tarde"
                          className="w-full p-2 bg-white rounded-lg border border-slate-200 font-medium"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-slate-500 font-bold mb-1">Descripción de Actividades</label>
                        <textarea
                          rows={2}
                          value={day.description}
                          onChange={e => {
                            const val = e.target.value;
                            setItinerary(prev => prev.map((d, i) => i === idx ? { ...d, description: val } : d));
                          }}
                          className="w-full p-2 bg-white rounded-lg border border-slate-200 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SERVICIOS, PARADAS & OPCIONALES */}
          {activeTab === 'services' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-8">
              {/* Puntos de Embarque */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Bus className="h-4 w-4 text-emerald-600" />
                    Puntos de Embarque / Ascenso de Pasajeros
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setBoardingPoints([
                        ...boardingPoints,
                        { id: `bp-${Date.now()}`, locationName: 'Nueva Parada', city: 'Ciudad', scheduledTime: '22:00 hs' }
                      ]);
                    }}
                    className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-200"
                  >
                    + Agregar Parada
                  </button>
                </div>

                <div className="space-y-2">
                  {boardingPoints.map((bp, idx) => (
                    <div key={bp.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-2 items-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold">Lugar / Plataforma</span>
                        <input
                          type="text"
                          value={bp.locationName}
                          onChange={e => {
                            const val = e.target.value;
                            setBoardingPoints(prev => prev.map((b, i) => i === idx ? { ...b, locationName: val } : b));
                          }}
                          className="w-full p-1.5 bg-white rounded border border-slate-200 font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold">Ciudad / Zona</span>
                        <input
                          type="text"
                          value={bp.city}
                          onChange={e => {
                            const val = e.target.value;
                            setBoardingPoints(prev => prev.map((b, i) => i === idx ? { ...b, city: val } : b));
                          }}
                          className="w-full p-1.5 bg-white rounded border border-slate-200"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <span className="text-[10px] text-slate-400 font-bold">Horario de Salida</span>
                          <input
                            type="text"
                            value={bp.scheduledTime}
                            onChange={e => {
                              const val = e.target.value;
                              setBoardingPoints(prev => prev.map((b, i) => i === idx ? { ...b, scheduledTime: val } : b));
                            }}
                            className="w-full p-1.5 bg-white rounded border border-slate-200 font-black text-emerald-700"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setBoardingPoints(boardingPoints.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700 mt-3 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Excursiones Opcionales */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Excursiones &amp; Actividades Opcionales en Destino
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setOptionalExcursions([
                        ...optionalExcursions,
                        { id: `exc-${Date.now()}`, title: 'Nueva Excursión Opcional', description: 'Detalle de la actividad.', price: 25000, currency }
                      ]);
                    }}
                    className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold hover:bg-amber-200"
                  >
                    + Agregar Opcional
                  </button>
                </div>

                <div className="space-y-2">
                  {optionalExcursions.map((exc, idx) => (
                    <div key={exc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-2 items-center text-xs">
                      <div className="md:col-span-2">
                        <span className="text-[10px] text-slate-400 font-bold">Título de la Actividad</span>
                        <input
                          type="text"
                          value={exc.title}
                          onChange={e => {
                            const val = e.target.value;
                            setOptionalExcursions(prev => prev.map((item, i) => i === idx ? { ...item, title: val } : item));
                          }}
                          className="w-full p-1.5 bg-white rounded border border-slate-200 font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold">Precio ({currency})</span>
                        <input
                          type="number"
                          value={exc.price}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setOptionalExcursions(prev => prev.map((item, i) => i === idx ? { ...item, price: val } : item));
                          }}
                          className="w-full p-1.5 bg-white rounded border border-slate-200 font-black text-amber-700"
                        />
                      </div>
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => setOptionalExcursions(optionalExcursions.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FICHA PRÁCTICA & RECOMENDACIONES */}
          {activeTab === 'practical' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6 text-xs">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                Ficha Práctica, Documentación &amp; Qué Llevar
              </h2>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Recomendaciones de Ropa, Clima y Equipaje</label>
                <textarea
                  rows={4}
                  value={recommendations}
                  onChange={e => setRecommendations(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Documentación Obligatoria Exigida</label>
                <div className="space-y-2">
                  {requiredDocs.map((docItem, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={docItem}
                        onChange={e => {
                          const val = e.target.value;
                          setRequiredDocs(prev => prev.map((d, i) => i === idx ? val : d));
                        }}
                        className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setRequiredDocs(requiredDocs.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setRequiredDocs([...requiredDocs, 'Nuevo requisito de documentación'])}
                    className="text-xs font-bold text-tech-blue hover:underline mt-1"
                  >
                    + Agregar Requisito
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SALIDAS PROGRAMADAS & STOCK */}
          {activeTab === 'departures' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Users className="h-5 w-5 text-emerald-600" />
                    Salidas Específicas Calendarizadas (Control de Stock)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Definí las fechas programadas y el bloqueo de butacas y habitaciones por hotel.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddDepartureDate}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1 shadow-sm"
                >
                  <Plus className="h-4 w-4" /> + Nueva Fecha de Salida
                </button>
              </div>

              <div className="space-y-4">
                {scheduledDepartures.map((dep, idx) => (
                  <div key={dep.id} className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-tech-blue" />
                        Salida: {dep.departureDate} al {dep.returnDate}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          dep.status === 'Abierta' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {dep.status}
                        </span>
                        {scheduledDepartures.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setScheduledDepartures(scheduledDepartures.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold">Fecha de Salida</span>
                        <input
                          type="date"
                          value={dep.departureDate}
                          onChange={e => {
                            const val = e.target.value;
                            setScheduledDepartures(prev => prev.map((d, i) => i === idx ? { ...d, departureDate: val } : d));
                          }}
                          className="w-full p-2 bg-white rounded-lg border border-slate-200 font-bold"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold">Fecha de Regreso</span>
                        <input
                          type="date"
                          value={dep.returnDate}
                          onChange={e => {
                            const val = e.target.value;
                            setScheduledDepartures(prev => prev.map((d, i) => i === idx ? { ...d, returnDate: val } : d));
                          }}
                          className="w-full p-2 bg-white rounded-lg border border-slate-200 font-bold"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold">Butacas Totales Bus</span>
                        <input
                          type="number"
                          value={dep.totalSeats}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setScheduledDepartures(prev => prev.map((d, i) => i === idx ? { ...d, totalSeats: val, availableSeats: val } : d));
                          }}
                          className="w-full p-2 bg-white rounded-lg border border-slate-200 font-bold text-tech-blue"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold">Coordinador Asignado</span>
                        <input
                          type="text"
                          value={dep.coordinator?.name || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setScheduledDepartures(prev => prev.map((d, i) => i === idx ? { ...d, coordinator: { ...d.coordinator, name: val, phone: d.coordinator?.phone || '' } } : d));
                          }}
                          placeholder="Nombre y apellido"
                          className="w-full p-2 bg-white rounded-lg border border-slate-200 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BOTÓN GUARDAR FICHA MAESTRA */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="px-5 py-3 bg-slate-100 text-slate-700 rounded-2xl text-xs font-bold hover:bg-slate-200 transition"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSaveMasterTrip}
              disabled={saving}
              className="px-8 py-3 bg-tech-blue text-white rounded-2xl text-xs font-black hover:bg-blue-700 transition shadow-lg shadow-tech-blue/20 flex items-center gap-2"
            >
              {saving ? (
                <>Guardando y Publicando...</>
              ) : (
                <>
                  <Save className="h-5 w-5" /> Guardar Ficha Maestra y Publicar en Marketplace &amp; App
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
