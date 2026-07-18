"use client";

import React, { useState, useEffect } from 'react';
import { Palmtree, Ticket, DatabaseZap, Plus, Edit, Trash2, X, Save, Upload, Award, ShieldAlert } from 'lucide-react';
import { collection, onSnapshot, setDoc, doc, deleteDoc, query, where, updateDoc } from 'firebase/firestore';
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

interface Reservation {
  id: string;
  tourId: string;
  tourTitle: string;
  nombrePasajero: string;
  emailPasajero: string;
  telefonoPasajero: string;
  cantidadPersonas: number;
  estado: 'Pendiente' | 'Confirmada' | 'Cancelada';
  createdAt: string;
}

export default function ExperiencesPage() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'reservations' | 'group-trips'>('catalog');
  const [contractedTrips, setContractedTrips] = useState<any[]>([]);
  const [selectedWebTrip, setSelectedWebTrip] = useState<any | null>(null);
  const [webGroupMessages, setWebGroupMessages] = useState<any[]>([]);
  const [adminMsgText, setAdminMsgText] = useState('');
  const [webPassengers, setWebPassengers] = useState<any[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const [biometricTimeout, setBiometricTimeout] = useState<number>(5); // default 5 mins
  const [referralPassengerBonus, setReferralPassengerBonus] = useState<number>(1500);
  const [referralDriverBonus, setReferralDriverBonus] = useState<number>(2000);
  const [pointsConversionRate, setPointsConversionRate] = useState<number>(1);
  
  // Editor States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Partial<Tour> | null>(null);
  const [serviceInput, setServiceInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomGuests, setNewRoomGuests] = useState('');

  useEffect(() => {
    // Sincronización en vivo con Firestore (Tours)
    const unsubscribeTours = onSnapshot(collection(db, 'experiences'), (snapshot) => {
      const fetchedTours: Tour[] = [];
      snapshot.forEach(doc => {
        fetchedTours.push(doc.data() as Tour);
      });
      setTours(fetchedTours);
    });

    // Sincronización en vivo con Firestore (Reservas)
    const unsubscribeReservations = onSnapshot(collection(db, 'experience_reservations'), (snapshot) => {
      const fetchedRes: Reservation[] = [];
      snapshot.forEach(doc => {
        fetchedRes.push({ id: doc.id, ...doc.data() } as Reservation);
      });
      fetchedRes.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setReservations(fetchedRes);
    });

    // Sincronización de viajes grupales contratados
    const unsubscribeContracted = onSnapshot(collection(db, 'contracted_trips'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setContractedTrips(list);
      if (list.length > 0 && !selectedWebTrip) {
        setSelectedWebTrip(list[0]);
      }
    });

    // Sincronización en vivo con Configuración de Seguridad de Conductores
    const unsubscribeSecurity = onSnapshot(doc(db, 'system_config', 'driver_settings'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.biometricTimeoutMinutes !== undefined) {
          setBiometricTimeout(data.biometricTimeoutMinutes);
        }
        if (data.referralPassengerBonus !== undefined) {
          setReferralPassengerBonus(data.referralPassengerBonus);
        }
        if (data.referralDriverBonus !== undefined) {
          setReferralDriverBonus(data.referralDriverBonus);
        }
        if (data.pointsConversionRate !== undefined) {
          setPointsConversionRate(data.pointsConversionRate);
        }
      }
    });

    return () => {
      unsubscribeTours();
      unsubscribeReservations();
      unsubscribeContracted();
      unsubscribeSecurity();
    };
  }, []);

  // Escuchar mensajes del chat grupal seleccionado y sus pasajeros asociados
  useEffect(() => {
    if (selectedWebTrip) {
      const unsubMessages = onSnapshot(
        collection(db, 'contracted_trips', selectedWebTrip.id, 'group_messages'),
        (snapshot) => {
          const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          msgs.sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0));
          setWebGroupMessages(msgs);
        }
      );
      
      const unsubUsers = onSnapshot(
        query(collection(db, 'users'), where('hasPurchasedOrganizedTrip', '==', true)),
        (userSnap) => {
          const list: any[] = [];
          userSnap.forEach((d) => {
            list.push({ id: d.id, ...d.data() });
          });
          setWebPassengers(list);
        }
      );

      return () => {
        unsubMessages();
        unsubUsers();
      };
    } else {
      setWebGroupMessages([]);
      setWebPassengers([]);
    }
  }, [selectedWebTrip?.id]);

  // Actualizar parámetros de seguridad (Biometría Conductores)
  const handleUpdateSecurity = async (minutes: number) => {
    try {
      await setDoc(doc(db, 'system_config', 'driver_settings'), {
        biometricTimeoutMinutes: minutes,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setBiometricTimeout(minutes);
    } catch (error: any) {
      console.error("Error updating security settings:", error);
      alert("Error al actualizar la configuración: " + error.message);
    }
  };

  // Actualizar parámetros de referidos y Rewards
  const handleUpdateReferrals = async () => {
    try {
      await setDoc(doc(db, 'system_config', 'driver_settings'), {
        referralPassengerBonus: Number(referralPassengerBonus),
        referralDriverBonus: Number(referralDriverBonus),
        pointsConversionRate: Number(pointsConversionRate),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      alert("¡Configuración de referidos y Rewards guardada con éxito!");
    } catch (error: any) {
      console.error("Error updating referral settings:", error);
      alert("Error al guardar la configuración: " + error.message);
    }
  };

  // Agregar habitación a Rooming List
  const handleAddRoom = async (roomNum: string, guestsText: string) => {
    if (!selectedWebTrip || !roomNum || !guestsText) return;
    try {
      const currentRooming = selectedWebTrip.roomingList || [];
      const newRoom = {
        roomNumber: roomNum.trim(),
        guests: guestsText.split(',').map(g => g.trim()).filter(Boolean)
      };
      const updatedRooming = [...currentRooming, newRoom];
      
      const tripRef = doc(db, 'contracted_trips', selectedWebTrip.id);
      await updateDoc(tripRef, {
        roomingList: updatedRooming
      });
      setSelectedWebTrip({
        ...selectedWebTrip,
        roomingList: updatedRooming
      });
      setNewRoomNumber('');
      setNewRoomGuests('');
      alert("¡Habitación asignada y guardada con éxito!");
    } catch (err: any) {
      alert("Error al guardar habitación: " + err.message);
    }
  };

  // Eliminar habitación de Rooming List
  const handleDeleteRoom = async (indexToDelete: number) => {
    if (!selectedWebTrip) return;
    try {
      const currentRooming = selectedWebTrip.roomingList || [];
      const updatedRooming = currentRooming.filter((_: any, idx: number) => idx !== indexToDelete);
      
      const tripRef = doc(db, 'contracted_trips', selectedWebTrip.id);
      await updateDoc(tripRef, {
        roomingList: updatedRooming
      });
      setSelectedWebTrip({
        ...selectedWebTrip,
        roomingList: updatedRooming
      });
      alert("¡Habitación eliminada con éxito!");
    } catch (err: any) {
      alert("Error al eliminar habitación: " + err.message);
    }
  };

  // Enviar mensaje al grupo como admin/sistema
  const handleSendAdminMessage = async () => {
    const text = adminMsgText.trim();
    if (!text || !selectedWebTrip) return;
    try {
      const msgRef = doc(collection(db, 'contracted_trips', selectedWebTrip.id, 'group_messages'), `msg_admin_${Date.now()}`);
      await setDoc(msgRef, {
        sender: "TravelApp Sistema",
        senderRole: "sistema",
        text: text,
        timestamp: Date.now()
      });
      setAdminMsgText('');
    } catch (err) {
      console.error("Error sending admin message:", err);
    }
  };

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

  const handleUpdateReservationStatus = async (id: string, newStatus: 'Confirmada' | 'Cancelada' | 'Pendiente') => {
    try {
      await setDoc(doc(db, 'experience_reservations', id), { estado: newStatus }, { merge: true });
    } catch (error) {
      console.error('Error updating status:', error);
      alert('No se pudo actualizar el estado de la reserva.');
    }
  };

  const handleDeleteReservation = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta reserva?')) {
      try {
        await deleteDoc(doc(db, 'experience_reservations', id));
      } catch (error) {
        console.error('Error deleting reservation:', error);
        alert('No se pudo eliminar la reserva.');
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
        <button
          onClick={() => setActiveTab('group-trips')}
          className={`flex items-center rounded-lg px-6 py-2.5 text-sm font-bold transition-all ${
            activeTab === 'group-trips'
              ? 'bg-tech-blue text-white shadow-md'
              : 'text-slate-500 hover:text-tech-blue hover:bg-slate-100'
          }`}
        >
          <Award className="mr-2 h-4 w-4" />
          Viajes Grupales Activos
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
              <span className="text-sm font-semibold text-slate-500 bg-slate-200/60 px-2.5 py-0.5 rounded-full">
                {reservations.length} Reservas en total
              </span>
            </div>

            {reservations.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center p-6 text-center">
                <Ticket className="mb-4 h-12 w-12 text-slate-350" />
                <h3 className="text-base font-bold text-slate-600">No hay solicitudes de reservas</h3>
                <p className="mt-1 text-xs text-slate-400 max-w-sm">
                  Las reservas realizadas por los usuarios en el marketplace aparecerán aquí en tiempo real de forma automática.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-extrabold text-slate-500 uppercase tracking-wider">
                      <th className="p-4">Pasajero Principal</th>
                      <th className="p-4">Contacto</th>
                      <th className="p-4">Experiencia Solicitada</th>
                      <th className="p-4">Pax</th>
                      <th className="p-4">Fecha Solicitud</th>
                      <th className="p-4">Estado</th>
                      <th className="p-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {reservations.map((res) => (
                      <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold text-slate-800">{res.nombrePasajero}</td>
                        <td className="p-4">
                          <p>{res.emailPasajero}</p>
                          <p className="text-slate-400 mt-0.5">{res.telefonoPasajero}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-slate-800">{res.tourTitle || 'Cargando título...'}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">Código: {res.tourId}</p>
                        </td>
                        <td className="p-4 font-bold text-center sm:text-left">{res.cantidadPersonas || 1} pax</td>
                        <td className="p-4 text-slate-400">
                          {res.createdAt ? new Date(res.createdAt).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : '—'}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                            res.estado === 'Confirmada' 
                              ? 'bg-emerald-50 border border-emerald-200 text-emerald-600' 
                              : res.estado === 'Cancelada' 
                              ? 'bg-red-50 border border-red-200 text-red-600' 
                              : 'bg-amber-50 border border-amber-200 text-amber-600'
                          }`}>
                            {res.estado || 'Pendiente'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {res.estado !== 'Confirmada' && (
                              <button
                                onClick={() => handleUpdateReservationStatus(res.id, 'Confirmada')}
                                className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-black text-emerald-600 transition-colors"
                              >
                                Confirmar
                              </button>
                            )}
                            {res.estado !== 'Cancelada' && (
                              <button
                                onClick={() => handleUpdateReservationStatus(res.id, 'Cancelada')}
                                className="px-2 py-1 rounded bg-red-50 hover:bg-red-100 border border-red-200 text-[10px] font-black text-red-600 transition-colors"
                              >
                                Cancelar
                              </button>
                            )}
                            {res.estado !== 'Pendiente' && (
                              <button
                                onClick={() => handleUpdateReservationStatus(res.id, 'Pendiente')}
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] font-black text-slate-600 transition-colors"
                              >
                                Reabrir
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteReservation(res.id)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Eliminar solicitud"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'group-trips' && (
          <div className="flex gap-6 h-[calc(100vh-220px)] min-h-[500px]">
            {/* COLUMNA IZQUIERDA: LISTA DE VIAJES */}
            <div className="w-1/3 rounded-2xl border border-slate-200 bg-white p-4 flex flex-col gap-4 overflow-y-auto">
              
              {/* Parámetros de Referidos y Rewards */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 text-slate-800">
                    <Award className="w-4 h-4 text-tech-blue" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Referidos y Rewards</h4>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Referido Pasajero (ARS)</label>
                      <input 
                        type="number" 
                        value={referralPassengerBonus}
                        onChange={(e) => setReferralPassengerBonus(Number(e.target.value))}
                        className="w-full text-xs border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-tech-blue"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Referido Conductor (ARS)</label>
                      <input 
                        type="number" 
                        value={referralDriverBonus}
                        onChange={(e) => setReferralDriverBonus(Number(e.target.value))}
                        className="w-full text-xs border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-tech-blue"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Conversión Puntos (Pts x U$S)</label>
                      <input 
                        type="number" 
                        value={pointsConversionRate}
                        onChange={(e) => setPointsConversionRate(Number(e.target.value))}
                        className="w-full text-xs border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-tech-blue"
                      />
                    </div>

                    <button 
                      onClick={handleUpdateReferrals}
                      className="bg-tech-blue hover:bg-tech-blue/90 text-white font-bold py-1.5 px-3 rounded text-[10px] transition-all"
                    >
                      Guardar Configuración
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-2 flex flex-col gap-1">
                  <p className="text-[9px] text-slate-400">
                    🔒 Persistencia de sesión activa para clientes.
                  </p>
                  <p className="text-[9px] text-slate-400">
                    🔑 Contraseñas seguras validadas mediante Firebase Auth (SHA-256).
                  </p>
                </div>
              </div>

              <h3 className="text-sm font-bold text-tech-blue uppercase tracking-wider mt-2">Viajes Grupales Activos</h3>
              {contractedTrips.length === 0 ? (
                <p className="text-xs text-slate-400">No hay viajes grupales activos en el sistema.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {contractedTrips.map((trip) => {
                    const isSel = selectedWebTrip?.id === trip.id;
                    return (
                      <button
                        key={trip.id}
                        onClick={() => setSelectedWebTrip(trip)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                          isSel 
                            ? 'bg-tech-blue/5 border-tech-blue text-tech-blue ring-1 ring-tech-blue' 
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <p className="font-bold text-sm">{trip.destination}</p>
                        <p className="text-xs text-slate-400 mt-1">📅 {trip.dates}</p>
                        <p className="text-[10px] text-slate-500 mt-2 font-semibold">Coordinador: {trip.coordinator?.name}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* COLUMNA DERECHA: MONITOREO Y CONTROL */}
            <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-6 flex flex-col gap-6 overflow-y-auto">
              {selectedWebTrip ? (
                <div className="flex flex-col gap-6 flex-1">
                  {/* Encabezado de Monitoreo */}
                  <div className="border-b border-slate-100 pb-4 flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">{selectedWebTrip.destination}</h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Fechas: <span className="font-bold text-tech-blue">{selectedWebTrip.dates}</span> | Coordinador: <span className="font-bold text-slate-700">{selectedWebTrip.coordinator?.name}</span>
                      </p>
                    </div>
                    <div className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wider">
                      Monitoreando En Vivo
                    </div>
                  </div>

                  {/* Sección 1: Fichas de Pasajeros y Estado de Pagos */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Fichas de Pasajeros & Financiación</h3>
                    {webPassengers.length === 0 ? (
                      <p className="text-xs text-slate-450">No hay pasajeros registrados en el viaje.</p>
                    ) : (
                      <div className="border border-slate-100 rounded-xl overflow-hidden text-xs bg-white">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-505 text-slate-500">
                              <th className="p-3">Pasajero</th>
                              <th className="p-3">DNI/Pasaporte</th>
                              <th className="p-3">Emergencia</th>
                              <th className="p-3">Ficha Médica</th>
                              <th className="p-3">Saldo Abonado</th>
                              <th className="p-3 text-right">Opcionales</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                            {webPassengers.map((passenger) => (
                              <tr key={passenger.id} className="hover:bg-slate-50/50">
                                <td className="p-3">
                                  <p className="font-bold text-slate-800">{passenger.displayName}</p>
                                  <p className="text-[10px] text-slate-400">{passenger.email}</p>
                                </td>
                                <td className="p-3">{passenger.passport || '—'}</td>
                                <td className="p-3 text-slate-500">{passenger.emergencyContact || '—'}</td>
                                <td className="p-3 text-red-500">{passenger.medicalNotes || 'Ninguna'}</td>
                                <td className="p-3">
                                  <span className="font-bold text-tech-blue">
                                    U$S {selectedWebTrip.payment?.paidAmount}
                                  </span>
                                  <span className="text-slate-400 font-normal"> / U$S {selectedWebTrip.payment?.totalAmount}</span>
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex flex-wrap gap-1 justify-end">
                                    {selectedWebTrip.optionalExcursions?.map((exc: any) => (
                                      <span
                                        key={exc.id}
                                        className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                          exc.paid 
                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                                        }`}
                                        title={exc.title}
                                      >
                                        {exc.id === 'exc-iruya' ? 'Iruya' : 'Bodega'}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Sección Rooming List */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Asignación de Habitaciones (Rooming List)</h3>
                    <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 flex flex-col gap-4">
                      {/* Formulario de Asignación */}
                      <div className="flex gap-3 items-end">
                        <div className="flex flex-col gap-1 w-1/4">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Nro. de Habitación</label>
                          <input 
                            type="text" 
                            placeholder="Ej: 101"
                            value={newRoomNumber}
                            onChange={(e) => setNewRoomNumber(e.target.value)}
                            className="text-xs border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-tech-blue"
                          />
                        </div>
                        <div className="flex flex-col gap-1 flex-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Pasajeros (Separados por coma)</label>
                          <input 
                            type="text" 
                            placeholder="Ej: admin@travelapp.ar, Juan Pérez"
                            value={newRoomGuests}
                            onChange={(e) => setNewRoomGuests(e.target.value)}
                            className="text-xs border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-tech-blue"
                          />
                        </div>
                        <button 
                          onClick={() => handleAddRoom(newRoomNumber, newRoomGuests)}
                          className="bg-tech-blue hover:bg-tech-blue/90 text-white font-bold py-1.5 px-4 rounded text-xs transition-all h-[34px] flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Asignar Habitación
                        </button>
                      </div>

                      {/* Lista de Habitaciones */}
                      {(!selectedWebTrip.roomingList || selectedWebTrip.roomingList.length === 0) ? (
                        <p className="text-xs text-slate-450 italic">No hay habitaciones asignadas. Usa el formulario superior para crear una.</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2.5">
                          {selectedWebTrip.roomingList.map((room: any, idx: number) => (
                            <div key={idx} className="bg-white border border-slate-100 rounded-xl p-3 flex justify-between items-center text-xs shadow-sm">
                              <div>
                                <p className="font-bold text-slate-800">Habitación {room.roomNumber}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{room.guests.join(' & ')}</p>
                              </div>
                              <button 
                                onClick={() => handleDeleteRoom(idx)}
                                className="text-red-500 hover:text-red-600 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sección 2: Monitoreo de Chat y Envío de Avisos */}
                  <div className="flex-1 flex flex-col min-h-[300px]">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Historial del Chat Grupal</h3>
                    <div className="flex-1 border border-slate-200 rounded-xl flex flex-col bg-slate-50 overflow-hidden">
                      {/* Historial de Mensajes */}
                      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 text-xs h-[180px]">
                        {webGroupMessages.length === 0 ? (
                          <div className="text-center text-slate-400 py-8">No hay mensajes registrados en el chat grupal.</div>
                        ) : (
                          webGroupMessages.map((msg) => {
                            const isCoord = msg.senderRole === 'coordinador';
                            const isSystem = msg.senderRole === 'sistema';
                            return (
                              <div
                                key={msg.id}
                                className={`max-w-[75%] p-2.5 rounded-xl flex flex-col gap-0.5 ${
                                  isSystem 
                                    ? 'bg-amber-50 border border-amber-100 text-amber-800 self-center max-w-[90%]' 
                                    : isCoord 
                                    ? 'bg-tech-blue/10 border border-tech-blue/20 text-tech-blue self-start' 
                                    : 'bg-white border border-slate-200 text-slate-700 self-end'
                                }`}
                              >
                                <span className="text-[9px] font-bold uppercase opacity-60">
                                  {msg.sender} ({msg.senderRole})
                                </span>
                                <p className="text-xs font-semibold">{msg.text}</p>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Caja de Entrada para Avisos de Administración */}
                      <div className="p-3 bg-white border-t border-slate-200 flex gap-3">
                        <input
                          type="text"
                          value={adminMsgText}
                          onChange={(e) => setAdminMsgText(e.target.value)}
                          placeholder="Escribí un aviso importante del sistema para enviar a todo el grupo (ej: 'Cambio de horario de vuelo')..."
                          className="flex-1 bg-slate-100 rounded-xl px-4 py-2 text-xs border border-slate-200 font-semibold focus:outline-none focus:border-tech-blue/40"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSendAdminMessage();
                          }}
                        />
                        <button
                          onClick={handleSendAdminMessage}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow transition-colors"
                        >
                          Enviar aviso del Sistema
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center text-center">
                  <Palmtree className="mb-4 h-12 w-12 text-slate-300" />
                  <h3 className="text-base font-bold text-slate-500">Selecciona un viaje</h3>
                  <p className="mt-1 text-xs text-slate-400">Elige un viaje grupal de la lista de la izquierda para ver su panel de control en vivo.</p>
                </div>
              )}
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
