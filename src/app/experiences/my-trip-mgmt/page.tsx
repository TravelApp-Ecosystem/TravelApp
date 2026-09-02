'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles, Ticket, Image as ImageIcon, Send, ShieldCheck,
  CheckCircle2, AlertCircle, Clock, Users, ArrowLeft, Plus,
  Trash2, RefreshCw, Eye, Download, Car, MapPin, DollarSign,
  Phone, Smartphone, Award, FileText, Lock, Unlock, Calendar
} from 'lucide-react';
import { collection, onSnapshot, query, doc, updateDoc, setDoc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ContractedTrip, VoucherDoc, LivePhotoItem, ItineraryDay } from '@/types/experiences';

export default function MyTripManagementPage() {
  const [activeTab, setActiveTab] = useState<'vouchers' | 'photos' | 'broadcast' | 'excursions' | 'checkin' | 'passengers'>('vouchers');
  const [tripsList, setTripsList] = useState<ContractedTrip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<ContractedTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form States
  // 1. Voucher form
  const [voucherName, setVoucherName] = useState('');
  const [voucherType, setVoucherType] = useState<VoucherDoc['type']>('general');
  const [voucherUrl, setVoucherUrl] = useState('');
  const [voucherUnlockHours, setVoucherUnlockHours] = useState<number>(72);

  // 2. Photo form
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');

  // 3. Broadcast form
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [sendPushNotification, setSendPushNotification] = useState(true);
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // 4. Excursion form
  const [excTitle, setExcTitle] = useState('');
  const [excDesc, setExcDesc] = useState('');
  const [excPrice, setExcPrice] = useState<number>(0);
  const [excCurrency, setExcCurrency] = useState<'ARS' | 'USD'>('USD');
  const [excPoints, setExcPoints] = useState<number>(0);
  const [excImg, setExcImg] = useState('');

  // Cargar viajes contratados desde Firestore
  useEffect(() => {
    const q = query(collection(db, 'contracted_trips'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trips: ContractedTrip[] = [];
      snapshot.forEach((docSnap) => {
        trips.push({ id: docSnap.id, ...docSnap.data() } as ContractedTrip);
      });
      setTripsList(trips);
      if (trips.length > 0 && !selectedTrip) {
        setSelectedTrip(trips[0]);
      } else if (selectedTrip) {
        const updated = trips.find(t => t.id === selectedTrip.id);
        if (updated) setSelectedTrip(updated);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSelectTrip = (trip: ContractedTrip) => {
    setSelectedTrip(trip);
    setActionSuccess(null);
  };

  const showNotificationSuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  // Crear un viaje demo de prueba si no existe ninguno
  const handleSeedSampleTrips = async () => {
    try {
      const demoPropioId = 'trip_bariloche_propio_demo';
      const demoPropio: ContractedTrip = {
        id: demoPropioId,
        userId: 'demo_user_travelapp',
        userName: 'Fernando Ríncola',
        userEmail: 'ferincola@gmail.com',
        userPhone: '+5493815551234',
        reservationCode: 'RES-89241-TRV',
        tourCode: 'TRV-EXP-BARILOCHE-2026',
        tourId: 'tour_bariloche_alta_montana',
        tripType: 'salida_propia',
        title: 'Bariloche Mágico & Circuito Chico',
        destination: 'San Carlos de Bariloche, Río Negro',
        departureDate: '2026-09-15',
        returnDate: '2026-09-22',
        dates: '15 al 22 de Septiembre 2026',
        departureOrigin: 'San Miguel de Tucumán',
        coverImage: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=1200&auto=format&fit=crop',
        imageUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=1200&auto=format&fit=crop',
        weather: {
          city: 'Bariloche',
          temperature: 12,
          condition: 'Soleado con brisa andina',
          conditionCode: 'sunny',
          humidity: 55,
          windSpeed: '14 km/h',
          forecast: [
            { day: 'Lun', temp: 12, icon: 'sunny' },
            { day: 'Mar', temp: 10, icon: 'partly-sunny' },
            { day: 'Mié', temp: 8, icon: 'snow' },
            { day: 'Jue', temp: 11, icon: 'cloudy' },
            { day: 'Vie', temp: 13, icon: 'sunny' },
          ]
        },
        payment: {
          currency: 'ARS',
          totalAmount: 650000,
          paidAmount: 450000,
          status: 'Señada',
          paymentsHistory: [
            { date: '2026-08-01', amount: 200000, method: 'Transferencia Bancaria', concept: 'Seña Inicial 30%' },
            { date: '2026-08-20', amount: 250000, method: 'Mercado Pago (Tarjeta)', concept: 'Cuota 1 Refuerzo' },
          ]
        },
        passengers: [
          { fullName: 'Fernando Ríncola', dni: '38.450.912', isTitular: true, seat: 'Butaca 12 (Planta Alta)', roomType: 'Doble Matrimonial', dietaryRestrictions: 'Ninguna' },
          { fullName: 'María Elena Torres', dni: '39.812.304', isTitular: false, seat: 'Butaca 13 (Planta Alta)', roomType: 'Doble Matrimonial', dietaryRestrictions: 'Vegetariana' },
        ],
        services: [
          'Bus Cama Ejecutivo con servicio a bordo',
          '7 Noches en Hotel Edelweiss 4★ c/ Desayuno Buffet',
          'Circuito Chico y Cerro Campanario con ascenso incluido',
          'Asistencia Médica Assist Card Cobertura $100.000 USD',
          'Coordinador permanente y guía local de Parques Nacionales'
        ],
        itinerary: [
          { dayNumber: 1, title: 'Partida y Noche en Ruta', description: 'Salida 19:00 hs desde Terminal de Tucumán. Cena caliente y snacks a bordo.', timeSlot: '19:00 hs', location: 'Terminal Tucumán' },
          { dayNumber: 2, title: 'Llegada a Bariloche & Check-in', description: 'Arribo al mediodía. Alojamiento en Hotel Edelweiss. Tarde libre en el Centro Cívico.', timeSlot: '13:00 hs', location: 'Hotel Edelweiss' },
          { dayNumber: 3, title: 'Circuito Chico y Cerro Campanario', description: 'Ascenso en aerosilla a la mejor vista panorámica del mundo según National Geographic.', timeSlot: '09:30 hs', location: 'Cerro Campanario' },
          { dayNumber: 4, title: 'Día Libre o Navegación Isla Victoria', description: 'Excursión lacustre opcional a Puerto Blest y Cascada de los Cántaros.', timeSlot: '10:00 hs', location: 'Puerto Pañuelo' },
        ],
        coordinator: {
          name: 'Lucas Benítez',
          phone: '+5493816112233',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
          bio: 'Coordinador experto en destinos patagónicos con 8 años en TravelApp.'
        },
        optionalExcursions: [
          { id: 'exc_puerto_blest', title: 'Navegación Puerto Blest & Cascada', description: 'Paseo en catamarán de alta tecnología por el Lago Nahuel Huapi.', price: 65, currency: 'USD', pointsPrice: 1200, imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400&auto=format&fit=crop', paid: false },
          { id: 'exc_cerro_catedral', title: 'Tour de Nieve en Cerro Catedral', description: 'Traslado y pases de ascenso a la cumbre de esquí más grande de Sudamérica.', price: 45, currency: 'USD', pointsPrice: 900, imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=400&auto=format&fit=crop', paid: true },
        ],
        vouchers: [
          { id: 'vouc_1', name: 'Voucher Póliza Asistencia Médica Assist Card', type: 'asistencia', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', unlockHoursBefore: 0, unlockedAt: '2026-09-01' },
          { id: 'vouc_2', name: 'Boucher Alojamiento Hotel Edelweiss', type: 'hotel', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', unlockHoursBefore: 72 },
        ],
        travelAssistance: {
          provider: 'Assist Card Argentina',
          policyNumber: 'AC-ARG-99201-TRV',
          voucherPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          emergencyPhone24h: '+54 11 5555-8000'
        },
        webCheckIn: {
          enabled: true,
          isCompleted: false,
          doorPickupRequested: true,
          pickupAddress: 'Av. Aconquija 1820, Yerba Buena, Tucumán',
          pickupTime: '17:30 hs (15/09/2026)',
          pickupNotes: '2 valijas grandes y 1 bolso de mano. Llevar vehículo con baúl amplio.'
        },
        termsAccepted: {
          accepted: true,
          acceptedAt: '2026-08-01 14:22:10',
          acceptedBy: 'Fernando Ríncola (DNI 38.450.912)'
        },
        communityPrivacy: {
          hideProfile: false
        },
        photos: [
          'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop',
        ],
        livePhotos: [
          { id: 'lp_1', url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=800&auto=format&fit=crop', caption: 'Llegada al Mirador del Lago Moreno', uploadedAt: '2026-09-02 11:30', uploadedBy: 'Lucas Benítez (Coordinador)' }
        ],
        recommendations: [
          'Llevar calzado de trekking o zapatillas antideslizantes para las caminatas.',
          'Ropa en capas ("efecto cebolla"): remera térmica, buzo polar y campera rompevientos.',
          'Protector solar y lentes UV (la radiación en montaña y nieve es alta).',
          'DNI físico original vigente obligatorio para el abordaje.'
        ],
        emergencyContacts: [
          { label: 'Guardia Operativa TravelApp 24hs', phone: '+54 9 381 400-9999' },
          { label: 'Assist Card Central Emergencias', phone: '+54 11 5555-8000' }
        ],
        createdAt: new Date().toISOString()
      };

      const demoOperadorId = 'trip_caribe_operador_demo';
      const demoOperador: ContractedTrip = {
        id: demoOperadorId,
        userId: 'demo_user_travelapp',
        userName: 'Fernando Ríncola',
        userEmail: 'ferincola@gmail.com',
        userPhone: '+5493815551234',
        reservationCode: 'RES-94102-OP',
        tourCode: 'TRV-OP-PUNTACANA-2026',
        tourId: 'tour_punta_cana_all_inclusive',
        tripType: 'operador_mayorista',
        title: 'Punta Cana All Inclusive - Grand Palladium Resort',
        destination: 'Punta Cana, República Dominicana',
        departureDate: '2026-10-10',
        returnDate: '2026-10-18',
        dates: '10 al 18 de Octubre 2026',
        departureOrigin: 'Ezeiza (EZE), Buenos Aires',
        coverImage: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=1200&auto=format&fit=crop',
        imageUrl: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=1200&auto=format&fit=crop',
        weather: {
          city: 'Punta Cana',
          temperature: 30,
          condition: 'Cálido y soleado caribeño',
          conditionCode: 'sunny',
          humidity: 70,
          windSpeed: '18 km/h',
        },
        payment: {
          currency: 'USD',
          totalAmount: 2800,
          paidAmount: 2800,
          status: 'Pagado_Total',
          paymentsHistory: [
            { date: '2026-07-15', amount: 1000, method: 'Transferencia USD', concept: 'Seña Confirmatoria' },
            { date: '2026-08-25', amount: 1800, method: 'Tarjeta Crédito Galicia', concept: 'Cancelación Total Saldo' },
          ]
        },
        passengers: [
          { fullName: 'Fernando Ríncola', dni: '38.450.912', isTitular: true, seat: 'Vuelo: Asiento 18A', roomType: 'Deluxe Swim-Up' },
          { fullName: 'María Elena Torres', dni: '39.812.304', isTitular: false, seat: 'Vuelo: Asiento 18B', roomType: 'Deluxe Swim-Up' },
        ],
        vouchers: [
          { id: 'vouc_op_1', name: 'Tickets Aéreos E-Ticket Copa Airlines', type: 'aereo', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', unlockHoursBefore: 72 },
          { id: 'vouc_op_2', name: 'Voucher Hotel Grand Palladium Resort & Spa', type: 'hotel', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', unlockHoursBefore: 72 },
          { id: 'vouc_op_3', name: 'Voucher Traslados In/Out Aeropuerto-Hotel', type: 'bus', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', unlockHoursBefore: 72 },
        ],
        travelAssistance: {
          provider: 'Universal Assistance Excellence',
          policyNumber: 'UA-GLOBAL-7711-TRV',
          voucherPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          emergencyPhone24h: '+1 800 555-0199'
        },
        operatorDetails: {
          operatorName: 'Juliá Tours Mayorista Internacional',
          tickets: [
            {
              type: 'Avion',
              provider: 'Copa Airlines',
              identifier: 'CM 452 / CM 120 (Conexión Panamá)',
              locatorPnr: '7QXZ9P',
              origin: 'Ezeiza (EZE)',
              destination: 'Punta Cana (PUJ)',
              departureTime: '10/10/2026 - 02:30 hs',
              arrivalTime: '10/10/2026 - 11:45 hs',
              seats: ['18A', '18B'],
              baggagePolicy: '1 valija despachada en bodega 23kg + 1 carry on 10kg por pasajero'
            }
          ],
          landServices: [
            { id: 'ls_1', type: 'Hotel', title: 'Grand Palladium Punta Cana Resort & Spa', provider: 'Palladium Hotel Group', foodPlan: 'All Inclusive 24hs c/ 8 restaurantes temáticos', hotelName: 'Grand Palladium Punta Cana' },
            { id: 'ls_2', type: 'Traslado', title: 'Traslado Privado Aeropuerto PUJ - Hotel - Aeropuerto', provider: 'Otium International Dominican Republic', notes: 'Recepción con cartel con nombre del titular en puerta de arribos.' }
          ],
          emergencyPhone24h: '+1 809 555-8822 (Guardia 24hs Operador República Dominicana)',
          generalTermsUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          vouchersUnlockedAt72h: false
        },
        termsAccepted: {
          accepted: true,
          acceptedAt: '2026-07-15 10:05:00',
          acceptedBy: 'Fernando Ríncola'
        },
        recommendations: [
          'Pasaporte con vigencia mínima de 6 meses al momento de ingresar a República Dominicana.',
          'Completar el E-Ticket electrónico de entrada y salida de migración dominicana.',
          'Moneda local: Peso Dominicano, pero el Dólar Estadounidense (USD) es ampliamente aceptado.',
          'Adaptador de enchufe tipo A / B (clavijas planas norma americana).'
        ],
        emergencyContacts: [
          { label: 'Operador Juliá Tours Guardia', phone: '+54 11 4310-0000' },
          { label: 'Consulado Argentino en Santo Domingo', phone: '+1 809 688-7446' }
        ],
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'contracted_trips', demoPropioId), demoPropio);
      await setDoc(doc(db, 'contracted_trips', demoOperadorId), demoOperador);

      showNotificationSuccess('✅ Viajes de demostración (Salida Propia y Operador) sincronizados con éxito en Firestore.');
    } catch (err: any) {
      console.error('Error seeding demo trips:', err);
      alert('Error al generar viajes demo: ' + err.message);
    }
  };

  // 1. Agregar Voucher
  const handleAddVoucher = async () => {
    if (!selectedTrip || !voucherName || !voucherUrl) {
      alert('Por favor completa el nombre y la URL del voucher.');
      return;
    }
    try {
      const newVoucher: VoucherDoc = {
        id: `vouc_${Date.now()}`,
        name: voucherName,
        type: voucherType,
        url: voucherUrl,
        unlockHoursBefore: Number(voucherUnlockHours) || 0,
        unlockedAt: voucherUnlockHours === 0 ? new Date().toISOString() : undefined,
      };

      const updatedVouchers = [...(selectedTrip.vouchers || []), newVoucher];
      await updateDoc(doc(db, 'contracted_trips', selectedTrip.id), {
        vouchers: updatedVouchers,
        updatedAt: new Date().toISOString(),
      });

      setVoucherName('');
      setVoucherUrl('');
      showNotificationSuccess('📄 Voucher adjuntado y sincronizado con la App del Pasajero.');
    } catch (err: any) {
      alert('Error al guardar voucher: ' + err.message);
    }
  };

  // Eliminar Voucher
  const handleDeleteVoucher = async (voucherId: string) => {
    if (!selectedTrip || !confirm('¿Deseas eliminar este voucher?')) return;
    try {
      const updatedVouchers = (selectedTrip.vouchers || []).filter(v => v.id !== voucherId);
      await updateDoc(doc(db, 'contracted_trips', selectedTrip.id), {
        vouchers: updatedVouchers,
        updatedAt: new Date().toISOString(),
      });
      showNotificationSuccess('🗑️ Voucher eliminado.');
    } catch (err: any) {
      alert('Error al eliminar voucher: ' + err.message);
    }
  };

  // 2. Agregar Foto al Banco de Imágenes
  const handleAddPhoto = async () => {
    if (!selectedTrip || !photoUrl) {
      alert('Por favor ingresa la URL de la imagen.');
      return;
    }
    try {
      const newPhotoItem: LivePhotoItem = {
        id: `lp_${Date.now()}`,
        url: photoUrl,
        caption: photoCaption || 'Foto del Viaje',
        uploadedAt: new Date().toLocaleDateString('es-AR') + ' ' + new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        uploadedBy: selectedTrip.coordinator?.name || 'Coordinación TravelApp',
        likesCount: 0
      };

      const updatedLivePhotos = [newPhotoItem, ...(selectedTrip.livePhotos || [])];
      const updatedSimplePhotos = [photoUrl, ...(selectedTrip.photos || [])];

      await updateDoc(doc(db, 'contracted_trips', selectedTrip.id), {
        livePhotos: updatedLivePhotos,
        photos: updatedSimplePhotos,
        updatedAt: new Date().toISOString(),
      });

      setPhotoUrl('');
      setPhotoCaption('');
      showNotificationSuccess('📸 Foto agregada al Banco de Imágenes en Vivo de los pasajeros.');
    } catch (err: any) {
      alert('Error al subir foto: ' + err.message);
    }
  };

  // Eliminar Foto
  const handleDeletePhoto = async (photoId: string) => {
    if (!selectedTrip || !confirm('¿Eliminar esta foto de la galería?')) return;
    try {
      const updatedLive = (selectedTrip.livePhotos || []).filter(p => p.id !== photoId);
      const updatedSimple = (selectedTrip.photos || []).filter((_, idx) => idx !== 0);
      await updateDoc(doc(db, 'contracted_trips', selectedTrip.id), {
        livePhotos: updatedLive,
        photos: updatedSimple,
        updatedAt: new Date().toISOString(),
      });
      showNotificationSuccess('🗑️ Foto eliminada del banco de imágenes.');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // 3. Enviar Comunicado Broadcast + Push
  const handleSendBroadcast = async () => {
    if (!selectedTrip || !broadcastTitle || !broadcastBody) {
      alert('Por favor completa el título y el mensaje del comunicado.');
      return;
    }
    setIsSendingBroadcast(true);
    try {
      // 1. Guardar mensaje en subcolección de Firestore
      const msgRef = doc(collection(db, 'contracted_trips', selectedTrip.id, 'group_messages'), `msg_${Date.now()}`);
      await setDoc(msgRef, {
        id: msgRef.id,
        sender: selectedTrip.coordinator?.name || 'Dirección de Operaciones TravelApp',
        senderRole: 'coordinador',
        title: broadcastTitle,
        text: broadcastBody,
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
        isOfficialBroadcast: true,
      });

      // 2. Si está activado el envío Push, llamar al endpoint de notificaciones
      if (sendPushNotification) {
        try {
          await fetch('/api/notifications/send-push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: `📣 ${broadcastTitle}`,
              body: broadcastBody,
              userIds: [selectedTrip.userId],
              data: {
                type: 'trip_broadcast',
                tripId: selectedTrip.id,
                reservationCode: selectedTrip.reservationCode,
                tourCode: selectedTrip.tourCode
              }
            })
          });
        } catch (pushErr) {
          console.warn('Error calling push API:', pushErr);
        }
      }

      setBroadcastTitle('');
      setBroadcastBody('');
      showNotificationSuccess('📢 Comunicado emitido y notificación Push enviada a los celulares de los pasajeros.');
    } catch (err: any) {
      alert('Error al emitir comunicado: ' + err.message);
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  // 4. Agregar Excursión Opcional
  const handleAddExcursion = async () => {
    if (!selectedTrip || !excTitle || !excPrice) {
      alert('Completa el título y precio de la excursión opcional.');
      return;
    }
    try {
      const newExc = {
        id: `exc_${Date.now()}`,
        title: excTitle,
        description: excDesc,
        price: Number(excPrice),
        currency: excCurrency,
        pointsPrice: Number(excPoints) || (Number(excPrice) * 20),
        imageUrl: excImg || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400&auto=format&fit=crop',
        paid: false
      };

      const updated = [...(selectedTrip.optionalExcursions || []), newExc];
      await updateDoc(doc(db, 'contracted_trips', selectedTrip.id), {
        optionalExcursions: updated,
        updatedAt: new Date().toISOString(),
      });

      setExcTitle('');
      setExcDesc('');
      setExcPrice(0);
      setExcPoints(0);
      setExcImg('');
      showNotificationSuccess('✨ Excursión opcional agregada al catálogo de compra de la App.');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Filtrado de viajes por búsqueda
  const filteredTrips = tripsList.filter(t => 
    (t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     t.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     t.reservationCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     t.tourCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     t.userName?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header Superior */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <Link 
              href="/experiences/reservations" 
              className="p-2.5 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Post-Venta & Operativa en Vivo
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Sincronizado con App Móvil
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">
                Gestor Operativo "Mi Viaje"
              </h1>
              <p className="text-sm text-slate-400">
                Administrá vouchers a 72hs, fotos en vivo, notificaciones push, opcionales y traslados TravelCab para tus pasajeros.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSeedSampleTrips}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
            >
              <Sparkles className="w-4 h-4" />
              Sincronizar Viajes Demo
            </button>
            <Link
              href="/experiences/catalog"
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-sm font-medium transition-colors"
            >
              <Ticket className="w-4 h-4" />
              Catálogo
            </Link>
          </div>
        </div>

        {/* Notificación de éxito */}
        {actionSuccess && (
          <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-400 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{actionSuccess}</span>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Izquierda: Selector de Salidas y Reservas (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 backdrop-blur">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-emerald-400" />
                Salidas & Reservas Activas ({tripsList.length})
              </h3>
              <button 
                onClick={() => window.location.reload()}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                title="Refrescar lista"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Buscar por código, destino o pasajero..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 mb-3"
            />

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredTrips.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">
                  No se encontraron salidas. Hacé clic en "Sincronizar Viajes Demo" para cargar ejemplos.
                </div>
              ) : (
                filteredTrips.map((trip) => {
                  const isSelected = selectedTrip?.id === trip.id;
                  const isPropio = trip.tripType === 'salida_propia';

                  return (
                    <div
                      key={trip.id}
                      onClick={() => handleSelectTrip(trip)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
                          isPropio ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {isPropio ? 'Salida Propia' : 'Operador Mayorista'}
                        </span>
                        <span className="text-[11px] font-mono font-medium text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
                          {trip.reservationCode}
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold text-white line-clamp-1">{trip.title}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {trip.destination}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60">
                        <span className="flex items-center gap-1 text-slate-300 font-medium">
                          <Users className="w-3 h-3 text-slate-400" />
                          {trip.userName || 'Pasajero'} ({trip.passengers?.length || 1} pax)
                        </span>
                        <span className="font-mono text-slate-400">{trip.departureDate}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Panel de Control del Viaje Seleccionado (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedTrip ? (
            <>
              {/* Card de Resumen del Viaje */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                <div 
                  className="absolute inset-0 opacity-15 bg-cover bg-center"
                  style={{ backgroundImage: `url(${selectedTrip.coverImage || selectedTrip.imageUrl})` }}
                />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                        selectedTrip.tripType === 'salida_propia'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {selectedTrip.tripType === 'salida_propia' ? '🌟 Salida Propia TravelApp' : '✈️ Operador Mayorista'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-200 border border-slate-700">
                        Tour: {selectedTrip.tourCode}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Reserva: {selectedTrip.reservationCode}
                      </span>
                    </div>

                    <h2 className="text-xl md:text-2xl font-bold text-white mb-1">{selectedTrip.title}</h2>
                    <p className="text-sm text-slate-300 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      {selectedTrip.dates} ({selectedTrip.departureOrigin} ➔ {selectedTrip.destination})
                    </p>
                  </div>

                  {/* Estado Financiero Rápido */}
                  <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl text-right min-w-[200px]">
                    <div className="text-xs text-slate-400">Estado de Cobro</div>
                    <div className="text-base font-bold text-emerald-400 font-mono">
                      {selectedTrip.payment.currency} ${selectedTrip.payment.paidAmount.toLocaleString()} / ${selectedTrip.payment.totalAmount.toLocaleString()}
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div 
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, (selectedTrip.payment.paidAmount / selectedTrip.payment.totalAmount) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pestañas Operativas */}
              <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1">
                {[
                  { id: 'vouchers', label: 'Vouchers (72hs)', icon: FileText, count: selectedTrip.vouchers?.length || 0 },
                  { id: 'photos', label: 'Fotos en Vivo', icon: ImageIcon, count: selectedTrip.livePhotos?.length || selectedTrip.photos?.length || 0 },
                  { id: 'broadcast', label: 'Comunicados Push', icon: Send },
                  { id: 'excursions', label: 'Opcionales & Merch', icon: Sparkles, count: selectedTrip.optionalExcursions?.length || 0 },
                  { id: 'checkin', label: 'Web Check-In 48h', icon: Car },
                  { id: 'passengers', label: 'Pasajeros & Términos', icon: Users, count: selectedTrip.passengers?.length || 0 },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm rounded-xl transition-all whitespace-nowrap ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                      {tab.count !== undefined && (
                        <span className={`text-xs px-1.5 py-0.2 rounded-full font-bold ${
                          isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* CONTENIDO DE PESTAÑAS */}

              {/* 1. VOUCHERS */}
              {activeTab === 'vouchers' && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-400" />
                      Gestión de Vouchers Descargables (App Pasajeros)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Cargá los vouchers en PDF de aéreos, buses, hoteles y asistencia. Los vouchers de operadores mayoristas se desbloquean automáticamente en la app 72 horas antes de la salida.
                    </p>
                  </div>

                  {/* Formulario para nuevo voucher */}
                  <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl space-y-3">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Adjuntar Nuevo Documento / Voucher</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Nombre del Voucher</label>
                        <input
                          type="text"
                          placeholder="Ej: E-Ticket Vuelo Copa Airlines"
                          value={voucherName}
                          onChange={(e) => setVoucherName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Categoría</label>
                        <select
                          value={voucherType}
                          onChange={(e) => setVoucherType(e.target.value as any)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="general">General / Voucher Todo Incluido</option>
                          <option value="aereo">Pasaje Aéreo / E-Ticket</option>
                          <option value="bus">Pasaje de Micro / Ómnibus</option>
                          <option value="hotel">Voucher de Alojamiento / Hotel</option>
                          <option value="asistencia">Póliza Asistencia al Viajero</option>
                          <option value="excursion">Voucher de Excursión</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Política de Desbloqueo</label>
                        <select
                          value={voucherUnlockHours}
                          onChange={(e) => setVoucherUnlockHours(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="0">🔓 Inmediato (Ya disponible)</option>
                          <option value="72">⏳ 72 Horas antes de la salida (Estándar Operadores)</option>
                          <option value="48">⏳ 48 Horas antes de la salida</option>
                          <option value="24">⏳ 24 Horas antes de la salida</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">URL del Archivo PDF / Documento</label>
                      <input
                        type="text"
                        placeholder="https://... o enlace a Storage de Firebase"
                        value={voucherUrl}
                        onChange={(e) => setVoucherUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <button
                      onClick={handleAddVoucher}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Guardar Voucher para el Pasajero
                    </button>
                  </div>

                  {/* Lista de vouchers cargados */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vouchers Asignados a esta Reserva</h4>
                    {(!selectedTrip.vouchers || selectedTrip.vouchers.length === 0) ? (
                      <p className="text-sm text-slate-500 italic p-4 bg-slate-950 rounded-xl text-center">
                        No hay vouchers cargados todavía para este viaje.
                      </p>
                    ) : (
                      selectedTrip.vouchers.map((v) => (
                        <div key={v.id} className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-slate-900 rounded-lg text-emerald-400 border border-slate-800">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-white">{v.name}</div>
                              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                <span className="capitalize px-2 py-0.5 rounded bg-slate-900 border border-slate-800">{v.type}</span>
                                {v.unlockHoursBefore && v.unlockHoursBefore > 0 ? (
                                  <span className="flex items-center gap-1 text-amber-400">
                                    <Lock className="w-3 h-3" /> Bloqueado hasta 72hs antes
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-emerald-400">
                                    <Unlock className="w-3 h-3" /> Disponible ahora
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={v.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white"
                              title="Ver Voucher"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => handleDeleteVoucher(v.id)}
                              className="p-2 hover:bg-red-950/60 rounded-lg text-red-400 hover:text-red-300"
                              title="Eliminar Voucher"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 2. BANCO DE FOTOS EN VIVO */}
              {activeTab === 'photos' && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-indigo-400" />
                      Banco de Imágenes en Vivo del Coordinador
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Las fotos que subas aquí aparecerán instantáneamente en la pestaña "Fotos" de la App de todos los pasajeros del grupo para descarga directa.
                    </p>
                  </div>

                  {/* Formulario nueva foto */}
                  <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">URL de la Foto en Alta Resolución</label>
                        <input
                          type="text"
                          placeholder="https://images.unsplash.com/..."
                          value={photoUrl}
                          onChange={(e) => setPhotoUrl(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Epígrafe / Lugar de la Toma</label>
                        <input
                          type="text"
                          placeholder="Ej: Foto grupal en la cima del Campanario"
                          value={photoCaption}
                          onChange={(e) => setPhotoCaption(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleAddPhoto}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-sm transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Publicar Foto en la Galería del Grupo
                    </button>
                  </div>

                  {/* Grilla de Fotos */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(selectedTrip.livePhotos || []).map((p) => (
                      <div key={p.id} className="relative group bg-slate-950 rounded-xl overflow-hidden border border-slate-800 aspect-video md:aspect-square">
                        <img src={p.url} alt={p.caption || 'Foto'} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between">
                          <button
                            onClick={() => handleDeletePhoto(p.id)}
                            className="self-end p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <div>
                            <p className="text-xs font-semibold text-white line-clamp-1">{p.caption}</p>
                            <p className="text-[10px] text-slate-300">{p.uploadedAt}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. COMUNICADOS Y NOTIFICACIONES PUSH */}
              {activeTab === 'broadcast' && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Send className="w-5 h-5 text-emerald-400" />
                      Emisión de Comunicados Oficiales & Push Notifications
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Enviá avisos importantes a los celulares de los pasajeros de este viaje. La notificación sonará y se mostrará incluso si la app está cerrada en segundo plano.
                    </p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Título del Aviso / Notificación</label>
                      <input
                        type="text"
                        placeholder="Ej: ⏰ Horario de partida para la excursión de mañana"
                        value={broadcastTitle}
                        onChange={(e) => setBroadcastTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Cuerpo del Mensaje</label>
                      <textarea
                        rows={3}
                        placeholder="Escribí el comunicado detallado (horarios de desayuno, recomendaciones de abrigo, puntos de encuentro)..."
                        value={broadcastBody}
                        onChange={(e) => setBroadcastBody(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex items-center gap-3 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      <input
                        type="checkbox"
                        id="pushToggle"
                        checked={sendPushNotification}
                        onChange={(e) => setSendPushNotification(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-700"
                      />
                      <label htmlFor="pushToggle" className="text-xs text-slate-200 cursor-pointer">
                        <span className="font-semibold text-emerald-400">Disparar Notificación Push (FCM / Expo)</span>: Hará sonar el smartphone de los pasajeros del grupo aunque la aplicación esté cerrada.
                      </label>
                    </div>

                    <button
                      onClick={handleSendBroadcast}
                      disabled={isSendingBroadcast}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-all flex items-center gap-2"
                    >
                      {isSendingBroadcast ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Transmitiendo Comunicado...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Emitir Comunicado a Pasajeros
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* 4. OPCIONALES Y MERCH */}
              {activeTab === 'excursions' && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      Tienda de Excursiones Opcionales & Merchandising
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Agregá actividades opcionales para que los pasajeros las compren desde su app con Mercado Pago / Galicia Nave, Efectivo o Canje de Puntos Rewards.
                    </p>
                  </div>

                  {/* Formulario nuevo opcional */}
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Publicar Nuevo Opcional / Merchandising</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-2">
                        <label className="text-xs text-slate-400 block mb-1">Título de la Actividad / Producto</label>
                        <input
                          type="text"
                          placeholder="Ej: Alquiler de Ropa de Nieve Completo"
                          value={excTitle}
                          onChange={(e) => setExcTitle(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Precio</label>
                        <div className="flex gap-1">
                          <select
                            value={excCurrency}
                            onChange={(e) => setExcCurrency(e.target.value as any)}
                            className="px-2 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white"
                          >
                            <option value="USD">USD</option>
                            <option value="ARS">ARS</option>
                          </select>
                          <input
                            type="number"
                            placeholder="0"
                            value={excPrice || ''}
                            onChange={(e) => setExcPrice(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Puntos Rewards Requeridos</label>
                        <input
                          type="number"
                          placeholder="Ej: 500"
                          value={excPoints || ''}
                          onChange={(e) => setExcPoints(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Descripción</label>
                        <input
                          type="text"
                          placeholder="Detalles de lo que incluye..."
                          value={excDesc}
                          onChange={(e) => setExcDesc(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">URL de la Foto</label>
                        <input
                          type="text"
                          placeholder="https://..."
                          value={excImg}
                          onChange={(e) => setExcImg(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleAddExcursion}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg text-sm transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Publicar Opcional
                    </button>
                  </div>

                  {/* Lista de opcionales */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(selectedTrip.optionalExcursions || []).map((exc) => (
                      <div key={exc.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex gap-3">
                        <img src={exc.imageUrl} alt={exc.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-white">{exc.title}</h4>
                          <p className="text-xs text-slate-400 line-clamp-1">{exc.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs font-bold text-amber-400 font-mono">
                              {exc.currency} ${exc.price}
                            </span>
                            <span className="text-xs font-semibold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                              🎁 {exc.pointsPrice || exc.price * 20} Pts
                            </span>
                            {exc.paid && (
                              <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                                ✓ PAGADA
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. WEB CHECK-IN 48H & TRASLADOS */}
              {activeTab === 'checkin' && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Car className="w-5 h-5 text-emerald-400" />
                      Monitoreo de Web Check-In & Traslados TravelCab
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Visualizá las solicitudes de recogida en domicilio puerta a puerta de los pasajeros para llevarlos a la terminal o aeropuerto.
                    </p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <span className="text-xs text-slate-400">Estado del Check-In 48h</span>
                        <div className="text-sm font-bold text-white">
                          {selectedTrip.webCheckIn?.isCompleted ? '✓ Check-In Realizado' : '⏳ Pendiente de Check-In'}
                        </div>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        selectedTrip.webCheckIn?.doorPickupRequested ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {selectedTrip.webCheckIn?.doorPickupRequested ? '🚖 Traslado Puerta a Puerta Solicitado' : 'Sin Traslado'}
                      </span>
                    </div>

                    {selectedTrip.webCheckIn?.doorPickupRequested && (
                      <div className="bg-slate-900 p-4 rounded-xl space-y-2 border border-slate-800">
                        <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Detalles del Servicio de Recogida:</div>
                        <div className="text-sm text-slate-200 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-emerald-400" />
                          <span className="font-semibold">Dirección:</span> {selectedTrip.webCheckIn.pickupAddress}
                        </div>
                        <div className="text-sm text-slate-200 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-emerald-400" />
                          <span className="font-semibold">Horario Requerido:</span> {selectedTrip.webCheckIn.pickupTime}
                        </div>
                        {selectedTrip.webCheckIn.pickupNotes && (
                          <div className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                            Notas de Equipaje: {selectedTrip.webCheckIn.pickupNotes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 6. PASAJEROS, ROSTER & CONDICIONES */}
              {activeTab === 'passengers' && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-400" />
                      Manifiesto de Pasajeros & Aceptación de Condiciones Generales
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Auditoría de datos de pasajeros, butacas asignadas y firma electrónica de condiciones generales de contratación.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {(selectedTrip.passengers || []).map((pax, idx) => (
                      <div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{pax.fullName}</span>
                            {pax.isTitular && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                TITULAR
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                            <span>DNI: <strong className="text-slate-300 font-mono">{pax.dni}</strong></span>
                            {pax.seat && <span>Ubicación: <strong className="text-slate-300">{pax.seat}</strong></span>}
                            {pax.roomType && <span>Habitación: <strong className="text-slate-300">{pax.roomType}</strong></span>}
                            {pax.dietaryRestrictions && <span>Dieta: <strong className="text-slate-300">{pax.dietaryRestrictions}</strong></span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[11px] text-slate-400 block">Condiciones Generales:</span>
                            {selectedTrip.termsAccepted?.accepted ? (
                              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 justify-end">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Aceptadas digitalmente
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-amber-400 flex items-center gap-1 justify-end">
                                <Clock className="w-3.5 h-3.5" /> Pendiente de firma
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              <Ticket className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <p className="text-base font-semibold text-slate-300">Seleccioná una salida o reserva para gestionar "Mi Viaje"</p>
              <p className="text-xs text-slate-500 mt-1">O hacé clic en "Sincronizar Viajes Demo" para inicializar las salidas de prueba.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
