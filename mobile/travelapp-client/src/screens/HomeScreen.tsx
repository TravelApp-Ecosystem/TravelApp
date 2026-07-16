import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch,
  TextInput, ActivityIndicator, Animated, ScrollView, Dimensions, Alert, Modal, Image, Linking, Platform, Vibration,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Colors, TRAVIS_WEBHOOK_URL, GOOGLE_MAPS_KEY } from '../lib/constants';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { TravelCabLogo, TravelAppLogo, TravelExperienceLogo } from '../components/BrandLogos';

const { width, height } = Dimensions.get('window');

interface CMSBlock {
  id: string;
  blockTitle: string;
  cards: {
    title: string;
    description: string;
    imageUrl: string;
    url: string;
  }[];
}

interface RewardItem {
  id: string;
  title: string;
  points: number;
  description: string;
  imageUrl: string;
}

function getNext10Days() {
  const days = [];
  for (let i = 0; i < 10; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }));
  }
  return days;
}

function decodePolyline(encoded: string) {
  if (!encoded) return [];
  const poly = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    poly.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5
    });
  }
  return poly;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const user = auth.currentUser!;
  const firstName = user?.displayName?.split(' ')[0] || 'Pasajero';

  // Navegación de Tabs: 'home' | 'experience' | 'trips' | 'rewards' | 'profile'
  const [activeTab, setActiveTab] = useState<'home' | 'experience' | 'trips' | 'rewards' | 'profile'>('home');

  // Modo de servicio: 'urbana' (Movilidad Urbana) | 'aci' (Auto Compartido Interurbano)
  const [serviceMode, setServiceMode] = useState<'urbana' | 'aci'>('urbana');

  // Estados de Ubicación y Mapa
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [onlineDrivers, setOnlineDrivers] = useState<any[]>([]);

  // Estados de Búsqueda de Viaje
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Estandar');
  const [selectedPayment, setSelectedPayment] = useState('Efectivo');
  
  // Autocomplete y Ruta
  const [originSuggestions, setOriginSuggestions] = useState<any[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<any[]>([]);
  const [originCoords, setOriginCoords] = useState<any>(null);
  const [destinationCoords, setDestinationCoords] = useState<any>(null);
  const [routePolyline, setRoutePolyline] = useState<string>('');
  const [routeDistance, setRouteDistance] = useState<number>(0);
  const [routeDuration, setRouteDuration] = useState<number>(0);
  const [activeSearchField, setActiveSearchField] = useState<'origin' | 'destination' | null>(null);
  const [activeTariffs, setActiveTariffs] = useState<any[]>([]);
  const [notificationSoundUrl, setNotificationSoundUrl] = useState<string | null>(null);
  const [overlayMessage, setOverlayMessage] = useState<string | null>(null);
  const overlayAnim = useRef(new Animated.Value(-100)).current;
  
  // Agendar Viaje
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);

  // Flujo de Viaje Activo
  const [requestFlowStep, setRequestFlowStep] = useState<'idle' | 'pricing' | 'searching' | 'active'>('idle');
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [driverDetails, setDriverDetails] = useState<any>(null);
  const [searchTimer, setSearchTimer] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);

  // Categorías de Vehículos (Dinámicas de Firestore)
  const [categories, setCategories] = useState<any[]>([]);

  // Datos del CMS y Rewards
  const [cmsBlocks, setCmsBlocks] = useState<CMSBlock[]>([]);
  const [rewardsBlocks, setRewardsBlocks] = useState<any[]>([]);
  const [rewardsList, setRewardsList] = useState<RewardItem[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [passengerTrips, setPassengerTrips] = useState<any[]>([]);
  const [rewardsPoints, setRewardsPoints] = useState(1450); // Puntos por defecto
  const [activeSubMode, setActiveSubMode] = useState<'urbana' | 'interurbano' | 'traslados'>('urbana');
  const [scheduleCity, setScheduleCity] = useState('');
  const [schedulePassengers, setSchedulePassengers] = useState('1');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Datos de TravelApp Experience - Viajes Contratados
  const [hasPurchasedOrganizedTrip, setHasPurchasedOrganizedTrip] = useState(false);
  const [contractedTrip, setContractedTrip] = useState<any | null>(null);
  const [experienceMainTab, setExperienceMainTab] = useState<'catalog' | 'trip'>('catalog');
  const [activeTripSubTab, setActiveTripSubTab] = useState<'itinerary' | 'payments' | 'group' | 'gallery'>('itinerary');
  const [expandedDay, setExpandedDay] = useState<number | null>(1); // Acordeón de itinerario
  const [travisQuery, setTravisQuery] = useState('');
  const [travisAnswer, setTravisAnswer] = useState('');
  const [travisLoading, setTravisLoading] = useState(false);
  const [groupMessages, setGroupMessages] = useState<any[]>([]);
  const [coordinatorMessage, setCoordinatorMessage] = useState('');
  const [isGaliciaPaying, setIsGaliciaPaying] = useState(false);
  const [selectedExcursion, setSelectedExcursion] = useState<any | null>(null);
  const [paymentSuccessModal, setPaymentSuccessModal] = useState(false);
  const [excursionsList, setExcursionsList] = useState<any[]>([]);
  const [isQrModalVisible, setIsQrModalVisible] = useState(false);
  const [rewardsSubTab, setRewardsSubTab] = useState<'canje' | 'beneficios'>('canje');
  const [selectedBenefit, setSelectedBenefit] = useState<any | null>(null);

  // Datos extendidos de Perfil para TravelApp Experience
  const [passport, setPassport] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [isDossierModalVisible, setIsDossierModalVisible] = useState(false);
  const [mpLinked, setMpLinked] = useState(false);
  const [mpLinkedEmail, setMpLinkedEmail] = useState('');
  const [tripCompletedModalVisible, setTripCompletedModalVisible] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [isEcosystemExpanded, setIsEcosystemExpanded] = useState(false);
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const mapRef = useRef<MapView | null>(null);

  // Animación de paneles
  const panelSlideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(panelSlideAnim, { toValue: 1, useNativeDriver: true }).start();
  }, [activeTab]);

  useEffect(() => {
    if (requestFlowStep === 'active') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, { toValue: -6, duration: 800, useNativeDriver: true }),
          Animated.timing(bounceAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [requestFlowStep]);

  useEffect(() => {
    if (originCoords && destinationCoords && mapRef.current) {
      mapRef.current.fitToCoordinates([originCoords, destinationCoords], {
        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
        animated: true,
      });
    }
  }, [originCoords, destinationCoords, routePolyline]);

  // Escuchar perfil en tiempo real para Mercado Pago y datos extendidos
  useEffect(() => {
    if (user?.uid) {
      const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setPassport(data.passport || '');
          setEmergencyContact(data.emergencyContact || '');
          setMedicalNotes(data.medicalNotes || '');
          setMpLinked(!!data.mpLinked);
          setMpLinkedEmail(data.mpUserEmail || '');
          setHasPurchasedOrganizedTrip(!!data.hasPurchasedOrganizedTrip);
          if (data.rewardsPoints !== undefined) {
            setRewardsPoints(data.rewardsPoints);
          }
        }
      });
      return unsubProfile;
    }
  }, [user?.uid]);

  // Escuchar viaje contratado y sus mensajes de grupo en tiempo real
  useEffect(() => {
    if (user?.uid) {
      const q = query(collection(db, 'contracted_trips'), where('userId', '==', user.uid));
      const unsubTrip = onSnapshot(q, (snap) => {
        if (!snap.empty) {
          const tripDoc = snap.docs[0];
          const data = { id: tripDoc.id, ...tripDoc.data() } as any;
          setContractedTrip(data);
          setExcursionsList(data.optionalExcursions || []);
          
          // Suscribirse a los mensajes del grupo de este viaje
          const unsubMessages = onSnapshot(collection(db, 'contracted_trips', tripDoc.id, 'group_messages'), (msgSnap) => {
            const msgs = msgSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            msgs.sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0));
            setGroupMessages(msgs);
          });
          return () => unsubMessages();
        } else {
          setContractedTrip(null);
          setExcursionsList([]);
          setGroupMessages([]);
        }
      });
      return unsubTrip;
    }
  }, [user?.uid]);

  // Escuchar viajes de TravelCab del usuario en tiempo real
  useEffect(() => {
    if (user?.uid) {
      const q = query(collection(db, 'trips'), where('passengerId', '==', user.uid));
      const unsubPassengerTrips = onSnapshot(q, (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a: any, b: any) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });
        setPassengerTrips(list);
      });
      return unsubPassengerTrips;
    }
  }, [user?.uid]);

  // Cambiar por defecto al tab de viaje activo si ya tiene uno comprado
  useEffect(() => {
    if (hasPurchasedOrganizedTrip) {
      setExperienceMainTab('trip');
    } else {
      setExperienceMainTab('catalog');
    }
  }, [hasPurchasedOrganizedTrip]);

  // Manejar simulación de compra/cancelación de viaje grupal (Modo Tester)
  const handleSimulateTrip = async (enable: boolean) => {
    if (!user?.uid) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      if (enable) {
        await setDoc(userRef, { hasPurchasedOrganizedTrip: true }, { merge: true });
        
        const tripId = `trip_humahuaca_${user.uid}`;
        const tripRef = doc(db, 'contracted_trips', tripId);
        const tripData = {
          id: tripId,
          userId: user.uid,
          destination: "Quebrada de Humahuaca & Salinas Grandes",
          dates: "12 Oct - 19 Oct, 2026",
          imageUrl: "https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?q=80&w=800&auto=format&fit=crop",
          coordinator: {
            name: "Marcos Vignola",
            phone: "+5493815556667",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"
          },
          services: [
            "Aéreos ida y vuelta (Aerolíneas Argentinas)",
            "Traslados privados en minibus (TravelCab ACI)",
            "7 noches en Posada del Silencio (Purmamarca)",
            "Régimen de media pensión (Desayuno y Cena)",
            "Excursiones terrestres con guías locales autorizados",
            "Cobertura Assist Card Premium (Asistencia Médica Completa)"
          ],
          itinerary: [
            { day: 1, title: "Vuelo a Salta & Transfer a Purmamarca", description: "Arribo al aeropuerto de Salta. Recepción por Marcos Vignola y traslado privado a Purmamarca recorriendo el espectacular camino de cornisa. Check-in en el hotel y cena grupal de bienvenida." },
            { day: 2, title: "Cerro de Siete Colores & Paseo de los Colorados", description: "Trekking matutino suave por el Paseo de los Colorados para apreciar las distintas tonalidades geológicas del Cerro de Siete Colores. Tarde libre para recorrer la feria de artesanos locales de Purmamarca." },
            { day: 3, title: "Salinas Grandes & Cuesta de Lipán", description: "Ascenso por la impactante Cuesta de Lipán hasta alcanzar los 4.170 msnm. Descenso a las imponentes Salinas Grandes. Almuerzo campestre en el salar y sesión fotográfica interactiva." },
            { day: 4, title: "Pucará de Tilcara & Garganta del Diablo", description: "Traslado a Tilcara. Visita guiada al sitio arqueológico Pucará de Tilcara. Trekking opcional a la Garganta del Diablo para ver las cascadas naturales en el lecho del río." },
            { day: 5, title: "Hornocal (Serranía de los 14 Colores) & Humahuaca", description: "Viaje al norte hacia Humahuaca. Almuerzo tradicional con peña folclórica en vivo. Por la tarde, ascenso en camionetas 4x4 al mirador del Hornocal (4.350 msnm) para ver el atardecer sobre los 14 colores." },
            { day: 6, title: "Día Libre en Purmamarca o Excursión Opcional a Iruya", description: "Día libre para descansar y disfrutar del hotel. Recomendamos la excursión opcional de día entero al mágico pueblo colgado de la montaña: Iruya." },
            { day: 7, title: "Caminata entre Cardones & Regreso a Salta Capital", description: "Check-out del hotel. Viaje de regreso visitando el Parque Nacional Los Cardones. Tarde libre en Salta Capital para últimas compras y cena de despedida grupal en la Peña de Balderrama." },
            { day: 8, title: "Despedida & Vuelo de Retorno", description: "Transfer al aeropuerto de Salta para abordar el vuelo de regreso a Buenos Aires. Fin de la experiencia." }
          ],
          payment: {
            totalAmount: 1450,
            paidAmount: 950,
            currency: "USD"
          },
          assistancePdfUrl: "https://www.assistcard.com/content/dam/assistcard/global/pdf/condiciones-generales.pdf",
          recommendations: "Llevar ropa de abrigo en capas (amplitud térmica), protector solar factor 50+, anteojos de sol, calzado de trekking cómodo y abundante agua para evitar el mal de altura (apunamiento).",
          optionalExcursions: [
            { id: "exc-iruya", title: "Excursión Especial de Día Entero a Iruya (4x4)", description: "Aventura todo terreno cruzando el Abra del Cóndor a 4000 msnm para descender al histórico pueblo colgado de Iruya. Incluye almuerzo.", price: 120, paid: false },
            { id: "exc-bodega", title: "Degustación de Vinos de Altura & Almuerzo en Cafayate", description: "Visita a una prestigiosa bodega boutique con degustación dirigida por enólogo y almuerzo de pasos maridado.", price: 85, paid: false }
          ],
          photos: [
            "https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1619542402915-dcaf30e4e2a1?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=600&auto=format&fit=crop"
          ]
        };
        await setDoc(tripRef, tripData);
        
        // Crear un par de mensajes de grupo de bienvenida
        const welcomeRef1 = doc(collection(db, 'contracted_trips', tripId, 'group_messages'), 'msg_welcome_1');
        const welcomeRef2 = doc(collection(db, 'contracted_trips', tripId, 'group_messages'), 'msg_welcome_2');
        await setDoc(welcomeRef1, {
          sender: "Marcos Vignola",
          senderRole: "coordinador",
          text: "¡Hola a todos! Bienvenidos al grupo de la expedición a Humahuaca y Salinas Grandes. Acá voy a ir subiendo novedades y vamos a estar en contacto durante todo el viaje.",
          timestamp: Date.now() - 3600000 * 2
        });
        await setDoc(welcomeRef2, {
          sender: "Sofía (BsAs)",
          senderRole: "pasajero",
          text: "¡Hola Marcos! Qué bueno, estoy re entusiasmada con este viaje. Ya tengo todo listo para arrancar.",
          timestamp: Date.now() - 3600000
        });
      } else {
        await setDoc(userRef, { hasPurchasedOrganizedTrip: false }, { merge: true });
        await deleteDoc(doc(db, 'contracted_trips', `trip_humahuaca_${user.uid}`));
      }
    } catch (err) {
      console.log("Error in simulator trip toggle:", err);
    }
  };

  // Preguntar a Travis AI sobre el destino
  const handleAskTravisAboutDestination = async () => {
    const text = travisQuery.trim();
    if (!text || travisLoading) return;
    setTravisLoading(true);
    setTravisAnswer('');
    try {
      const res = await fetch(TRAVIS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriber_id: user?.uid || 'app_user',
          message: `Pregunta sobre mi viaje grupal a ${contractedTrip?.destination || 'nuestro destino'}: ${text}`,
          first_name: user?.displayName?.split(' ')[0] || 'Pasajero',
          channel: 'app_client',
        }),
      });
      const data = await res.json();
      const reply = data.messages?.[0]?.text || data.reply || 'No tengo respuesta en este momento sobre el destino.';
      setTravisAnswer(reply);
    } catch (err) {
      setTravisAnswer('Hubo un problema de conexión con Travis AI. Intentá de nuevo.');
    } finally {
      setTravisLoading(false);
    }
  };

  // Enviar mensaje al grupo del coordinador
  const handleSendCoordinatorMessage = async () => {
    const text = coordinatorMessage.trim();
    if (!text || !contractedTrip?.id) return;
    try {
      const msgRef = doc(collection(db, 'contracted_trips', contractedTrip.id, 'group_messages'), `msg_${Date.now()}`);
      await setDoc(msgRef, {
        sender: user.displayName || 'Pasajero',
        senderRole: 'pasajero',
        text: text,
        timestamp: Date.now()
      });
      setCoordinatorMessage('');
      
      // Auto respuesta simulada del coordinador después de 3 segundos
      setTimeout(async () => {
        const replyRef = doc(collection(db, 'contracted_trips', contractedTrip.id, 'group_messages'), `msg_reply_${Date.now()}`);
        await setDoc(replyRef, {
          sender: "Marcos Vignola",
          senderRole: "coordinador",
          text: `¡Hola ${firstName}! Recibí tu mensaje. Recordá que nos reunimos todos hoy a las 20hs en el lobby del hotel para repasar los detalles de mañana.`,
          timestamp: Date.now()
        });
      }, 3000);
      
    } catch (err) {
      console.log("Error sending coordinator message:", err);
    }
  };

  // Procesar pago con Nave Galicia
  const handleStartGaliciaPayment = (excursion: any) => {
    setSelectedExcursion(excursion);
    setIsGaliciaPaying(true);
  };

  const handleConfirmGaliciaPayment = async () => {
    if (!selectedExcursion || !contractedTrip?.id) return;
    setIsGaliciaPaying(true);
    
    setTimeout(async () => {
      try {
        const tripRef = doc(db, 'contracted_trips', contractedTrip.id);
        const updatedExcursions = excursionsList.map(exc => {
          if (exc.id === selectedExcursion.id) {
            return { ...exc, paid: true };
          }
          return exc;
        });
        
        await updateDoc(tripRef, {
          optionalExcursions: updatedExcursions,
          'payment.paidAmount': contractedTrip.payment.paidAmount + selectedExcursion.price
        });

        // Sumar puntos en Rewards (1 punto por cada USD gastado)
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          rewardsPoints: rewardsPoints + selectedExcursion.price
        });
        
        setExcursionsList(updatedExcursions);
        setIsGaliciaPaying(false);
        setPaymentSuccessModal(true);
      } catch (err) {
        console.log("Error executing Galicia payment:", err);
        setIsGaliciaPaying(false);
        Alert.alert("Error de pago", "No se pudo procesar la transacción.");
      }
    }, 2000);
  };

  // Cargar ubicación GPS inicial
  useEffect(() => {
    const getGPS = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setCurrentLocation({
            latitude: -34.6037,
            longitude: -58.3816,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          });
          setLoadingLocation(false);
          return;
        }
        let loc = await Location.getLastKnownPositionAsync({});
        if (!loc) {
          loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        }
        if (loc) {
          setCurrentLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          });
        } else {
          setCurrentLocation({
            latitude: -34.6037,
            longitude: -58.3816,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          });
        }
      } catch (e) {
        console.log("Error obtaining GPS client", e);
        // Fallback Buenos Aires
        setCurrentLocation({
          latitude: -34.6037,
          longitude: -58.3816,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        });
      } finally {
        setLoadingLocation(false);
      }
    };
    getGPS();
  }, []);

  // Escuchar Choferes online, Categorías de Vehículos y CMS en tiempo real
  useEffect(() => {
    // 1. Choferes activos
    const qDrivers = query(collection(db, 'drivers'), where('isOnline', '==', true));
    const unsubDrivers = onSnapshot(qDrivers, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOnlineDrivers(list);
    });

    // 2. Categorías dinámicas (mismo catálogo que la Landing)
    const unsubCategories = onSnapshot(collection(db, 'categories'), (snap) => {
      if (!snap.empty) {
        setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } else {
        // Fallbacks si la base de datos está limpia
        setCategories([
          { id: 'cat-1', name: 'Estandar', multiplier: 1.0, basePrice: 400, icon: 'car-outline' },
          { id: 'cat-2', name: 'Premium', multiplier: 1.5, basePrice: 600, icon: 'sparkles-outline' },
          { id: 'cat-3', name: 'Taxi', multiplier: 1.1, basePrice: 450, icon: 'color-palette-outline' },
        ]);
      }
    });

    // 3. Bloques CMS para carrusel promocional
    const unsubCMS = onSnapshot(collection(db, 'cms_blocks'), (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        const block1 = list.find(b => b.id === 'block-1');
        const block2 = list.find(b => b.id === 'block-2');
        
        if (block1) {
          setCmsBlocks([block1]);
        } else {
          setCmsBlocks([]);
        }
        
        if (block2) {
          setRewardsBlocks(block2.cards || []);
        } else {
          setRewardsBlocks([]);
        }
      } else {
        // Fallback CMS Blocks
        setCmsBlocks([
          {
            id: 'block-1',
            blockTitle: 'Novedades del Ecosistema',
            cards: [
              {
                title: 'TravelApp Rewards',
                description: 'Completá tu foto de perfil en el panel y ganá 150 puntos extra al instante para tu próximo canje.',
                imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80',
                url: 'https://travelapp.ar/rewards',
              },
              {
                title: 'Nuevas Experiencias',
                description: 'Ya podés agendar paseos de aventura y traslados rurales en las yungas tucumanas.',
                imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80',
                url: 'https://travelapp.ar/experiences',
              }
            ]
          }
        ]);
        setRewardsBlocks([
          {
            title: 'Descuento Gastronómico',
            description: 'Obtené un 20% de descuento en restaurantes adheridos presentando tu código QR.',
            imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
            url: 'https://travelapp.ar/rewards/food'
          },
          {
            title: 'Descuento Hotelería',
            description: 'Ahorrá hasta un 15% en estadías seleccionadas de TravelApp Experiences.',
            imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
            url: 'https://travelapp.ar/rewards/hotel'
          }
        ]);
      }
    });

    // 4. Catálogo de Canjes / Beneficios de Rewards
    const unsubRewards = onSnapshot(collection(db, 'rewards_catalog'), (snap) => {
      if (!snap.empty) {
        setRewardsList(snap.docs.map(d => ({ id: d.id, ...d.data() } as RewardItem)));
      } else {
        setRewardsList([
          {
            id: 'item-1',
            title: '15% Off en Traslado Premium',
            points: 400,
            description: 'Canjeá este beneficio por un descuento en tu próximo viaje ejecutivo.',
            imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=600&q=80'
          },
          {
            id: 'item-2',
            title: 'Tour en Cerro San Javier',
            points: 1200,
            description: 'Un traslado de ida y vuelta con merienda de campo incluida.',
            imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80'
          }
        ]);
      }
    });

    // 5. Catálogo de Experiencias en tiempo real
    const unsubExperiences = onSnapshot(collection(db, 'experiences'), (snap) => {
      if (!snap.empty) {
        setExperiences(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } else {
        setExperiences([
          {
            id: 'cat-mendoza',
            title: 'Mendoza: Caminos del Vino & Aconcagua',
            desc: 'Sumergite en las mejores bodegas boutique de Luján de Cuyo y Valle de Uco, combinado con un trekking suave en el Parque Provincial Aconcagua.',
            price: 'U$S 980',
            duration: '5 Días / 4 Noches',
            img: 'https://images.unsplash.com/photo-1504270997636-07ddfbd48945?q=80&w=600&auto=format&fit=crop'
          },
          {
            id: 'cat-ushuaia',
            title: 'Ushuaia & Calafate: Glaciares y Fin del Mundo',
            desc: 'Explorá el Glaciar Perito Moreno y navegá el Canal Beagle en una expedición de lujo con coordinator permanente de TravelApp.',
            price: 'U$S 1.650',
            duration: '8 Días / 7 Noches',
            img: 'https://images.unsplash.com/photo-1473163928189-364b2c4e1135?q=80&w=600&auto=format&fit=crop'
          },
          {
            id: 'cat-iguazu',
            title: 'Iguazú Premium & Selva Misionera',
            desc: 'Disfrutá de las Cataratas del Iguazú desde una perspectiva exclusiva con paseos náuticos de aventura y hospedaje dentro del Parque Nacional.',
            price: 'U$S 740',
            duration: '4 Días / 3 Noches',
            img: 'https://images.unsplash.com/photo-1581404179374-e35df3e48118?q=80&w=600&auto=format&fit=crop'
          }
        ]);
      }
    });

    // 6. Tarifarios activos
    const qTariffs = query(collection(db, 'tariffs'), where('isActive', '==', true));
    const unsubTariffs = onSnapshot(qTariffs, (snap) => {
      setActiveTariffs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.log("Error fetching active tariffs:", err));

    // 7. Configuración de sonido y logística
    const unsubLogistics = onSnapshot(doc(db, 'system_config', 'logistics'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.notificationSoundUrl) {
          setNotificationSoundUrl(data.notificationSoundUrl);
        }
      }
    }, (err) => console.log("Error fetching logistics config:", err));

    return () => {
      unsubDrivers();
      unsubCategories();
      unsubCMS();
      unsubRewards();
      unsubExperiences();
      unsubTariffs();
      unsubLogistics();
    };
  }, []);

  // Configuración de audio para expo-audio
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
    }).catch((err: any) => console.log("Audio mode set error:", err));
  }, []);
  const showOverlayNotification = (msg: string) => {
    setOverlayMessage(msg);
    Animated.sequence([
      Animated.timing(overlayAnim, {
        toValue: 20,
        duration: 400,
        useNativeDriver: true
      }),
      Animated.delay(4000),
      Animated.timing(overlayAnim, {
        toValue: -100,
        duration: 400,
        useNativeDriver: true
      })
    ]).start(() => {
      setOverlayMessage(null);
    });
  };

  const playNotificationSoundAndVibrate = async () => {
    try {
      Vibration.vibrate([0, 500, 200, 500]);
      if (notificationSoundUrl) {
        const player = createAudioPlayer(notificationSoundUrl);
        const subscription = player.addListener('playbackStatusUpdate', (status) => {
          if (status.didJustFinish) {
            subscription.remove();
            player.release();
          }
        });
        player.play();
      }
    } catch (e) {
      console.warn("Failed to play notification sound:", e);
    }
  };

  const fetchPlaceSuggestions = async (text: string, field: 'origin' | 'destination') => {
    if (field === 'origin') setOrigin(text);
    else setDestination(text);

    if (!text || text.length < 3) {
      if (field === 'origin') setOriginSuggestions([]);
      else setDestSuggestions([]);
      return;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_MAPS_KEY}&language=es&components=country:ar`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.predictions) {
        if (field === 'origin') setOriginSuggestions(data.predictions);
        else setDestSuggestions(data.predictions);
      }
    } catch (e) {
      console.warn("Error fetching place suggestions:", e);
      // Fallback local mock prediction list if API fails
      const mockSuggestions = [
        { place_id: `mock-1-${field}`, description: `${text}, San Miguel de Tucumán` },
        { place_id: `mock-2-${field}`, description: `${text}, Yerba Buena, Tucumán` },
        { place_id: `mock-3-${field}`, description: `${text}, Tafí Viejo, Tucumán` },
      ];
      if (field === 'origin') setOriginSuggestions(mockSuggestions);
      else setDestSuggestions(mockSuggestions);
    }
  };

  const handleSelectSuggestion = async (suggestion: any, field: 'origin' | 'destination') => {
    const { place_id, description } = suggestion;
    
    if (field === 'origin') {
      setOrigin(description);
      setOriginSuggestions([]);
    } else {
      setDestination(description);
      setDestSuggestions([]);
    }
    setActiveSearchField(null);

    // If it's a simulated mock place
    if (place_id.startsWith('mock-')) {
      const mockCoords = field === 'origin' 
        ? { latitude: -26.8241, longitude: -65.2226 }
        : { latitude: -26.8167, longitude: -65.2833 };
      if (field === 'origin') setOriginCoords(mockCoords);
      else setDestinationCoords(mockCoords);
      return;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&key=${GOOGLE_MAPS_KEY}&fields=geometry`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.result && data.result.geometry && data.result.geometry.location) {
        const { lat, lng } = data.result.geometry.location;
        const coords = { latitude: lat, longitude: lng };
        if (field === 'origin') {
          setOriginCoords(coords);
        } else {
          setDestinationCoords(coords);
        }
      }
    } catch (e) {
      console.warn("Error getting place details:", e);
      const mockCoords = field === 'origin' 
        ? { latitude: -26.8241, longitude: -65.2226 }
        : { latitude: -26.8167, longitude: -65.2833 };
      if (field === 'origin') setOriginCoords(mockCoords);
      else setDestinationCoords(mockCoords);
    }
  };

  useEffect(() => {
    if (originCoords && destinationCoords) {
      fetchRouteDetails();
    }
  }, [originCoords, destinationCoords]);

  const fetchRouteDetails = async () => {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originCoords.latitude},${originCoords.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}&key=${GOOGLE_MAPS_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];
        setRouteDistance(leg.distance.value / 1000);
        setRouteDuration(leg.duration.value / 60);
        setRoutePolyline(route.overview_polyline.points);
      } else {
        throw new Error("No routes found");
      }
    } catch (e) {
      console.warn("Error getting directions:", e);
      const lat1 = originCoords.latitude;
      const lon1 = originCoords.longitude;
      const lat2 = destinationCoords.latitude;
      const lon2 = destinationCoords.longitude;
      const dist = Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2)) * 111.32;
      setRouteDistance(dist > 0 ? dist : 5.4);
      setRouteDuration(dist > 0 ? dist * 2 : 12);
    }
  };

  const startSearchDriver = async () => {
    if (!origin || !destination) {
      return Alert.alert('Ruta incompleta', 'Por favor ingresá origen y destino del traslado.');
    }

    try {
      const estimatedPrice = calculateFare(selectedCategory);
      const tripData: any = {
        passengerId: user.uid,
        userName: firstName,
        passengerPhone: '',
        origin,
        destination,
        originCoords: originCoords ? { lat: originCoords.latitude, lng: originCoords.longitude } : null,
        destinationCoords: destinationCoords ? { lat: destinationCoords.latitude, lng: destinationCoords.longitude } : null,
        routePolyline: routePolyline || '',
        estimatedDistanceKm: routeDistance || 0,
        estimatedDurationMins: routeDuration || 0,
        serviceType: selectedCategory,
        estimatedPrice,
        paymentMethod: selectedPayment,
        paymentStatus: selectedPayment === 'Efectivo' ? 'pending' : 'awaiting_payment',
        status: 'searching',
        createdAt: Timestamp.now()
      };

      setRequestFlowStep('searching');
      const docRef = await addDoc(collection(db, 'trips'), tripData);
      setActiveTrip({ id: docRef.id, ...tripData });

      // Configurar un timer para simulación (si no hay choferes reales tras 15 segundos)
      const timer = setTimeout(() => {
        Alert.alert(
          'Simulación de Viaje',
          '¿Deseas simular que un conductor acepta tu solicitud para continuar con la prueba?',
          [
            {
              text: 'Seguir buscando real',
              style: 'cancel'
            },
            {
              text: 'Simular Chofer',
              onPress: async () => {
                // Simular aceptación escribiendo datos mock en el documento de Firestore
                await updateDoc(doc(db, 'trips', docRef.id), {
                  status: 'accepted',
                  driverId: 'driver-mock-1',
                  driverName: 'Roberto Gómez (Simulado)',
                  driverPhone: '+5491133334444',
                  driverRating: 4.9,
                  vehicleModel: 'Chevrolet Prisma (Blanco)',
                  vehiclePlate: 'AB 876 YZ',
                  driverLocation: originCoords ? { latitude: originCoords.latitude - 0.005, longitude: originCoords.longitude - 0.005 } : { latitude: -26.8241, longitude: -65.2226 },
                  acceptedAt: Timestamp.now()
                });
              }
            }
          ]
        );
      }, 15000);
      setSearchTimer(timer);

      // Escuchar el documento en tiempo real
      const unsubTrip = onSnapshot(doc(db, 'trips', docRef.id), async (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();

        // 1. Aceptado
        if (data.status === 'accepted' && data.driverId) {
          if (timer) clearTimeout(timer);
          
          const driverDetailsObj = {
            id: data.driverId,
            name: data.driverName || 'Roberto Gómez',
            plate: data.vehiclePlate || 'AB 876 YZ',
            model: data.vehicleModel || 'Chevrolet Prisma (Blanco)',
            rating: String(data.driverRating || '4.9'),
            phone: data.driverPhone || '+5491100000000',
            avatar: data.driverProfilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
            carPhoto: data.driverCarPhoto || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=400&q=80'
          };

          // DEBITAR SI EL PAGO ES MERCADO PAGO Y ESTÁ VINCULADO
          if (data.paymentMethod === 'Mercado Pago' && data.paymentStatus === 'awaiting_payment') {
            if (mpLinked) {
              try {
                const payResponse = await fetch('http://localhost:3000/api/checkout/process-debit', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    tripId: docRef.id,
                    passengerId: user.uid,
                    driverId: data.driverId,
                    amount: estimatedPrice
                  })
                });
                const payData = await payResponse.json();
                if (payData.success) {
                  showOverlayNotification(`¡Pago Acreditado! Cobrado automáticamente en Mercado Pago.`);
                  await updateDoc(doc(db, 'trips', docRef.id), { paymentStatus: 'paid', paymentId: payData.paymentId });
                } else {
                  showOverlayNotification(`Pago fallido. Se cambió el viaje a Efectivo.`);
                  await updateDoc(doc(db, 'trips', docRef.id), { paymentMethod: 'Efectivo', paymentStatus: 'pending' });
                }
              } catch (err) {
                console.log("Error debiting trip:", err);
              }
            } else {
              showOverlayNotification(`Mercado Pago no vinculado. Pago en Efectivo.`);
              await updateDoc(doc(db, 'trips', docRef.id), { paymentMethod: 'Efectivo', paymentStatus: 'pending' });
            }
          }

          setDriverDetails(driverDetailsObj);
          setActiveTrip({ id: snap.id, ...data });
          setRequestFlowStep('active');
          showOverlayNotification(`¡Chofer asignado! ${driverDetailsObj.name} se encuentra en camino.`);
          playNotificationSoundAndVibrate();
        }

        // 2. En camino al pasajero (actualizar ubicación)
        if (data.status === 'on_way') {
          setActiveTrip((prev: any) => prev ? { ...prev, status: 'on_way' } : null);
        }

        // 3. Chofer llegó
        if (data.status === 'arrived') {
          setActiveTrip((prev: any) => prev ? { ...prev, status: 'arrived' } : null);
          showOverlayNotification("¡Tu conductor ha llegado! Te espera en el punto de encuentro.");
          playNotificationSoundAndVibrate();
        }

        // 4. Viaje en curso
        if (data.status === 'in_progress') {
          setActiveTrip((prev: any) => prev ? { ...prev, status: 'in_progress' } : null);
          showOverlayNotification("Viaje iniciado. ¡Disfrutá tu viaje!");
          playNotificationSoundAndVibrate();
        }

        // 5. Completado
        if (data.status === 'completed') {
          setActiveTrip((prev: any) => prev ? { ...prev, status: 'completed', finalPrice: data.finalPrice } : null);
          showOverlayNotification("¡Viaje finalizado! Gracias por viajar con nosotros.");
          playNotificationSoundAndVibrate();
          
          setTimeout(() => {
            Alert.alert(
              'Viaje Finalizado',
              `El viaje finalizó correctamente. Total abonado: $${data.finalPrice || estimatedPrice} ARS.`,
              [{ text: 'Calificar Conductor', onPress: () => {
                setRequestFlowStep('idle');
                setActiveTrip(null);
                setDriverDetails(null);
                setOrigin('');
                setDestination('');
                setOriginCoords(null);
                setDestinationCoords(null);
                setRoutePolyline('');
                setRouteDistance(0);
                setRouteDuration(0);
              }}]
            );
          }, 1500);

          unsubTrip();
        }

        // 6. Cancelado
        if (data.status === 'cancelled') {
          Alert.alert('Viaje Cancelado', 'El conductor canceló el traslado.');
          setRequestFlowStep('idle');
          setActiveTrip(null);
          setDriverDetails(null);
          unsubTrip();
        }

        // 7. Sincronizar ubicación del marcador
        if (data.driverLocation) {
          setOnlineDrivers([
            {
              id: data.driverId,
              latitude: data.driverLocation.latitude,
              longitude: data.driverLocation.longitude,
              name: data.driverName
            }
          ]);
        }
      });

    } catch (e) {
      console.log("Error creating trip", e);
      setRequestFlowStep('idle');
    }
  };

  const cancelSearch = () => {
    if (searchTimer) clearTimeout(searchTimer);
    setRequestFlowStep('idle');
  };

  const handleCancelTrip = () => {
    Alert.alert('Cancelar viaje', '¿Seguro que deseas cancelar el traslado actual?', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, Cancelar', style: 'destructive', onPress: () => setRequestFlowStep('idle') }
    ]);
  };

  // Cálculo de tarifa real usando tarifario o fallback
  const calculateFare = (categoryName: string) => {
    // 1. Encontrar la categoría seleccionada
    const selectedCat = categories.find(c => c.name === categoryName) || { id: 'cat-1', basePrice: 400, multiplier: 1 };
    
    // 2. Buscar si hay una tarifa activa de Firestore para esta categoría
    const matchedTariff = activeTariffs.find((t: any) => t.category === selectedCat.id || t.category === categoryName);
    if (!matchedTariff) {
      // Si no hay tarifa activa en la BD, calcular en base al fallback y la distancia estimada
      const distance = routeDistance > 0 ? routeDistance : 1; // Mínimo 1 km
      const pricePerKm = categoryName === 'Premium' ? 550 : categoryName === 'Taxi' ? 450 : 350;
      const baseFare = categoryName === 'Premium' ? 600 : categoryName === 'Taxi' ? 450 : 350;
      return Math.round(baseFare + pricePerKm * distance);
    }

    // 3. Si hay tarifa activa en la BD, usar sus valores reales
    const baseFare = matchedTariff.baseFare || 300;
    const pricePerKm = matchedTariff.pricePerKm || 180;
    const travelMinutePrice = matchedTariff.travelMinutePrice || 50;
    const minimumFare = matchedTariff.minimumFare || 450;

    const distance = routeDistance > 0 ? routeDistance : 1;
    const duration = routeDuration > 0 ? routeDuration : 2;

    const computedFare = baseFare + (pricePerKm * distance) + (travelMinutePrice * duration);
    return Math.max(minimumFare, Math.round(computedFare));
  };

  const getDaysRemaining = (dateStr: string) => {
    try {
      const match = dateStr.match(/(\d+)\s+([A-Za-z]+).*?(\d{4})/);
      if (match) {
        const day = parseInt(match[1]);
        const monthStr = match[2].toLowerCase();
        const year = parseInt(match[3]);
        
        const months: any = {
          jan: 0, ene: 0, feb: 1, mar: 2, apr: 3, abr: 3, may: 4, jun: 5, jul: 6, aug: 7, ago: 7, sep: 8, oct: 9, nov: 10, dec: 11, dic: 11
        };
        
        const month = months[monthStr.substring(0, 3)] || 9; // default Oct
        const targetDate = new Date(year, month, day);
        const today = new Date();
        targetDate.setHours(0,0,0,0);
        today.setHours(0,0,0,0);
        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
      }
    } catch (e) {
      console.error(e);
    }
    const targetDate = new Date(2026, 9, 12); // Oct 12, 2026
    const today = new Date();
    targetDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
      const options: any = { day: 'numeric', month: 'short' };
      return date.toLocaleDateString('es-AR', options);
    } catch (e) {
      return '';
    }
  };

  // Agendar Viaje Logic
  const handleScheduleTrip = () => {
    if (!scheduleDate || !scheduleTime) {
      return Alert.alert('Completar campos', 'Ingresá fecha y hora para programar el traslado.');
    }
    setIsScheduled(true);
    setScheduleModalVisible(false);
    Alert.alert('¡Viaje Agendado!', `Tu traslado desde "${origin || 'Tu ubicación'}" ha sido programado para el día ${scheduleDate} a las ${scheduleTime} hs.`);
  };

  // Vinculación de Billetera Mercado Pago (Wallet Connect)
  const handleLinkMercadoPago = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/checkout/wallet-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, email: user.email })
      });
      const data = await response.json();
      if (data.url) {
        Linking.openURL(data.url);
      } else {
        Alert.alert('Error', 'No se pudo generar el enlace de vinculación.');
      }
    } catch (err) {
      console.warn(err);
      // Fallback local
      const localSimUrl = `http://localhost:3000/checkout/mp-connect?userId=${user.uid}&email=${encodeURIComponent(user.email || '')}`;
      Linking.openURL(localSimUrl);
    }
  };

  // Finalizar viaje y procesar el pago Split en Mercado Pago
  const handleCompleteTrip = async () => {
    if (!activeTrip) return;
    setSavingProfile(true);
    try {
      if (selectedPayment === 'Mercado Pago' && !mpLinked) {
        Alert.alert(
          'Mercado Pago no vinculado', 
          'Por favor vinculá tu cuenta de Mercado Pago desde la pestaña de Perfil para poder pagar de forma automática.'
        );
        setSavingProfile(false);
        return;
      }

      const response = await fetch('http://localhost:3000/api/checkout/process-debit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: activeTrip.id,
          passengerId: user.uid,
          driverId: 'driver-1',
          amount: activeTrip.estimatedPrice || calculateFare(selectedCategory)
        })
      });

      const data = await response.json();
      if (data.success) {
        setEarnedPoints(data.pointsEarned || 150);
        setTripCompletedModalVisible(true);
        setRequestFlowStep('idle');
        setActiveTrip(null);
      } else {
        Alert.alert('Error en Pago', data.error || 'No se pudo debitar el saldo de Mercado Pago.');
      }
    } catch (err) {
      console.warn(err);
      setEarnedPoints(150); // Fallback local points
      setTripCompletedModalVisible(true);
      setRequestFlowStep('idle');
      setActiveTrip(null);
    } finally {
      setSavingProfile(false);
    }
  };

  // Guardar Datos extendidos de perfil
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        passport,
        emergencyContact,
        medicalNotes,
        updatedAt: Timestamp.now()
      }, { merge: true });
      Alert.alert('Perfil ampliado', 'Tus datos para reservas de TravelApp Experience se guardaron correctamente.');
    } catch {
      Alert.alert('Error', 'No se pudieron guardar tus datos.');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <View style={[styles.container, activeTab === 'home' && requestFlowStep !== 'active' && { backgroundColor: '#0A2A5B' }]}>
      {activeTab === 'home' && requestFlowStep === 'active' && driverDetails ? (
        <View style={styles.activeTripScreenContainer}>
          {/* 50% Superior: Mapa de Seguimiento */}
          <View style={styles.topHalfMapContainer}>
            {Platform.OS === 'web' ? (
              <View style={styles.webMapPlaceholder}>
                <View style={styles.webMapGrid}>
                  <View style={[styles.gridLine, { top: '50%', left: 0, right: 0 }]} />
                  <View style={[styles.gridLine, { left: '50%', top: 0, bottom: 0 }]} />
                  <View style={[styles.simulatedCar, { top: '45%', left: '45%' }]}>
                    <Ionicons name="car" size={20} color={Colors.accent} />
                  </View>
                </View>
                <Text style={styles.webMapText}>Seguimiento en Vivo (Simulación)</Text>
              </View>
            ) : (
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={currentLocation}
                showsUserLocation
              >
                {originCoords && (
                  <Marker coordinate={originCoords} title="Origen">
                    <View style={[styles.markerPin, { backgroundColor: Colors.success }]}>
                      <Ionicons name="pin" size={16} color={Colors.white} />
                    </View>
                  </Marker>
                )}
                {destinationCoords && (
                  <Marker coordinate={destinationCoords} title="Destino">
                    <View style={[styles.markerPin, { backgroundColor: Colors.danger }]}>
                      <Ionicons name="flag" size={16} color={Colors.white} />
                    </View>
                  </Marker>
                )}
                {routePolyline ? (
                  <Polyline
                    coordinates={decodePolyline(routePolyline)}
                    strokeColor={Colors.accent}
                    strokeWidth={4}
                  />
                ) : null}
              </MapView>
            )}
          </View>

          {/* 50% Inferior: Panel de información y deslizable */}
          <View style={[styles.bottomHalfContainer, { paddingBottom: insets.bottom }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.bottomHalfScrollContent}>
              {/* Tarjeta del Chofer Asignado y Vehículo */}
              <View style={styles.driverTrackingCard}>
                <View style={styles.driverPanelHeader}>
                  <Image source={{ uri: driverDetails.avatar }} style={styles.driverAvatarImg} />
                  <View style={styles.driverInfoCol}>
                    <Text style={styles.driverNameLabel}>{driverDetails.name}</Text>
                    <Text style={styles.driverCarPlate}>{driverDetails.model} · <Text style={{ fontFamily: 'Quicksand-Bold' }}>{driverDetails.plate}</Text></Text>
                    <Text style={styles.driverRatingText}>⭐ {driverDetails.rating} · Conductor Verificado</Text>
                  </View>
                </View>
                
                {driverDetails.carPhoto && (
                  <Image source={{ uri: driverDetails.carPhoto }} style={styles.carPhotoTrackingImg} />
                )}
              </View>

              {/* Controles de Viaje (Fila Horizontal) */}
              <View style={styles.tripControlsRow}>
                <TouchableOpacity 
                  style={[styles.controlBtnSquare, isRecording && styles.controlBtnRecording]}
                  onPress={() => setIsRecording(prev => !prev)}
                >
                  <Ionicons name={isRecording ? "mic" : "mic-outline"} size={20} color={Colors.white} />
                  <Text style={styles.controlBtnLabel}>{isRecording ? "Grabando" : "Grabar"}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.controlBtnSquare, { backgroundColor: '#25D366' }]}
                  onPress={() => Linking.openURL('https://wa.me/?text=Hola!%20Estoy%20viajando%20en%20TravelCab,%20seguí%20mi%20recorrido%20en%20tiempo%20real.')}
                >
                  <Ionicons name="logo-whatsapp" size={20} color={Colors.white} />
                  <Text style={styles.controlBtnLabel}>Compartir</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.controlBtnSquare, { backgroundColor: Colors.danger }]}
                  onPress={() => Linking.openURL('tel:911')}
                >
                  <Ionicons name="alert-circle" size={20} color={Colors.white} />
                  <Text style={styles.controlBtnLabel}>SOS 911</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.controlBtnSquare, { backgroundColor: Colors.primary }]}
                  onPress={() => navigation.navigate('Chat')}
                >
                  <Ionicons name="chatbubbles-outline" size={20} color={Colors.white} />
                  <Text style={styles.controlBtnLabel}>Chat Chofer</Text>
                </TouchableOpacity>
              </View>

              {/* Sección de Novedades del Ecosistema Desplegable */}
              <View style={styles.ecosystemDrawerContainer}>
                <TouchableOpacity 
                  style={styles.ecosystemDrawerHeader} 
                  onPress={() => setIsEcosystemExpanded(prev => !prev)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="compass-outline" size={20} color={Colors.primary} />
                    <Text style={styles.ecosystemDrawerTitle}>Novedades del Ecosistema</Text>
                  </View>
                  
                  {!isEcosystemExpanded ? (
                    <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
                      <Ionicons name="chevron-up" size={20} color={Colors.accent} />
                    </Animated.View>
                  ) : (
                    <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
                  )}
                </TouchableOpacity>

                {!isEcosystemExpanded && (
                  <TouchableOpacity onPress={() => setIsEcosystemExpanded(true)} style={styles.drawerHintBanner}>
                    <Text style={styles.drawerHintText}>Tocá para desplegar los beneficios y novedades 🔼</Text>
                  </TouchableOpacity>
                )}

                {isEcosystemExpanded && (
                  <View style={styles.ecosystemDrawerBody}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cmsCarousel}>
                      {cmsBlocks.length > 0 ? (
                        cmsBlocks.flatMap(block => block.cards).map((card, idx) => (
                          <TouchableOpacity key={idx} style={styles.cmsCard} onPress={() => Linking.openURL(card.url)}>
                            <Image source={{ uri: card.imageUrl }} style={styles.cmsCardImg} />
                            <View style={styles.cmsCardBody}>
                              <Text style={styles.cmsCardTitle} numberOfLines={1}>{card.title}</Text>
                              <Text style={styles.cmsCardDesc} numberOfLines={2}>{card.description}</Text>
                            </View>
                          </TouchableOpacity>
                        ))
                      ) : (
                        <View style={styles.promoCard}>
                          <Text style={styles.promoCardTitle}>Info Ecosistema TravelApp</Text>
                          <Text style={styles.promoCardDesc}>
                            ¿Sabías que al completar este viaje acumulás **150 puntos** en tu perfil de Rewards? Canjealos por beneficios en TravelApp Experiences.
                          </Text>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Botones Finales */}
              <View style={{ gap: 10, marginTop: 12 }}>
                <TouchableOpacity 
                  style={[styles.cancelTripBtn, { borderColor: Colors.success, paddingVertical: 12 }]} 
                  onPress={handleCompleteTrip}
                >
                  <Text style={[styles.cancelTripBtnText, { color: Colors.success }]}>
                    Finalizar Viaje (Simular Pago 1-Clic)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.cancelTripBtn, { paddingVertical: 12 }]} onPress={handleCancelTrip}>
                  <Text style={styles.cancelTripBtnText}>Cancelar Viaje</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      ) : activeTab === 'home' && requestFlowStep === 'pricing' ? (
        <View style={styles.activeTripScreenContainer}>
          {/* 50% Superior: Mapa de Seguimiento */}
          <View style={styles.topHalfMapContainer}>
            {Platform.OS === 'web' ? (
              <View style={styles.webMapPlaceholder}>
                <View style={styles.webMapGrid}>
                  <View style={[styles.gridLine, { top: '50%', left: 0, right: 0 }]} />
                  <View style={[styles.gridLine, { left: '50%', top: 0, bottom: 0 }]} />
                  {onlineDrivers.slice(0, 3).map((d: any, index: number) => {
                    const topVal = 40 + (index * 12) % 40;
                    const leftVal = 30 + (index * 19) % 50;
                    return (
                      <View key={d.id || index} style={[styles.simulatedCar, { top: `${topVal}%`, left: `${leftVal}%` }]}>
                        <Ionicons name="car" size={18} color={Colors.accent} />
                      </View>
                    );
                  })}
                </View>
                <Text style={styles.webMapText}>Mapa de Tarifas (Simulación)</Text>
              </View>
            ) : (
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={currentLocation}
                showsUserLocation
              >
                {onlineDrivers.map((d: any) => d.location && (
                  <Marker
                    key={d.id}
                    coordinate={d.location}
                    title={d.name}
                  >
                    <View style={[styles.markerPin, { backgroundColor: Colors.primary, width: 26, height: 26, borderRadius: 13 }]}>
                      <Ionicons name="car" size={14} color={Colors.white} />
                    </View>
                  </Marker>
                ))}
                {originCoords && (
                  <Marker coordinate={originCoords} title="Origen">
                    <View style={[styles.markerPin, { backgroundColor: Colors.success }]}>
                      <Ionicons name="pin" size={16} color={Colors.white} />
                    </View>
                  </Marker>
                )}
                {destinationCoords && (
                  <Marker coordinate={destinationCoords} title="Destino">
                    <View style={[styles.markerPin, { backgroundColor: Colors.danger }]}>
                      <Ionicons name="flag" size={16} color={Colors.white} />
                    </View>
                  </Marker>
                )}
                {routePolyline ? (
                  <Polyline
                    coordinates={decodePolyline(routePolyline)}
                    strokeColor={Colors.accent}
                    strokeWidth={4}
                  />
                ) : null}
              </MapView>
            )}
          </View>

          {/* 50% Inferior: Tarifas y Selección (Estilo Canva) */}
          <View style={[styles.bottomHalfContainer, { paddingBottom: insets.bottom }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.bottomHalfScrollContent}>
              <Text style={styles.canvaPricingTitle}>Tarifa aproximada</Text>
              
              <View style={{ gap: 10 }}>
                {categories.length > 0 ? (
                  categories.slice(0, 4).map(cat => {
                    const isSelected = selectedCategory === cat.name;
                    const fare = calculateFare(cat.name);
                    return (
                      <TouchableOpacity 
                        key={cat.id} 
                        style={[styles.canvaCategoryBtn, isSelected && styles.canvaCategoryBtnActive]}
                        onPress={() => setSelectedCategory(cat.name)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={styles.categoryIconCircle}>
                            <Ionicons 
                              name={cat.icon || "car-outline"} 
                              size={20} 
                              color={Colors.accent} 
                            />
                          </View>
                          <Text style={styles.canvaCategoryName}>{cat.name}</Text>
                        </View>
                        <Text style={styles.canvaCategoryPrice}>${fare}</Text>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <Text style={{ textAlign: 'center', color: Colors.textSecondary, fontFamily: 'Quicksand-Medium', marginVertical: 10 }}>
                    No hay categorías disponibles
                  </Text>
                )}
              </View>

              {/* Botón de Agenda tu viaje */}
              <TouchableOpacity 
                style={styles.canvaAgendaBtn}
                onPress={() => {
                  setScheduleModalVisible(true);
                }}
              >
                <Ionicons name="calendar-outline" size={20} color={Colors.accent} style={{ marginRight: 8 }} />
                <Text style={styles.canvaAgendaBtnText}>Agenda tu viaje</Text>
              </TouchableOpacity>

              {/* Botones de acción */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <TouchableOpacity style={styles.canvaBackBtn} onPress={() => setRequestFlowStep('idle')}>
                  <Text style={styles.canvaBackBtnText}>Volver</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.canvaConfirmBtn} onPress={startSearchDriver}>
                  <Text style={styles.canvaConfirmBtnText}>Solicitar viaje</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      ) : (
        <>
          {/* MAPA DE FONDO EN INICIO */}
      {activeTab === 'home' && requestFlowStep === 'searching' && (
        <View style={styles.mapContainer}>
          {loadingLocation ? (
            <ActivityIndicator size="large" color={Colors.primary} style={StyleSheet.absoluteFill} />
          ) : Platform.OS === 'web' ? (
            <View style={styles.webMapPlaceholder}>
              <View style={styles.webMapGrid}>
                <View style={[styles.gridLine, { top: '30%', left: 0, right: 0 }]} />
                <View style={[styles.gridLine, { top: '60%', left: 0, right: 0 }]} />
                <View style={[styles.gridLine, { left: '33%', top: 0, bottom: 0 }]} />
                <View style={[styles.gridLine, { left: '66%', top: 0, bottom: 0 }]} />
                
                {/* Choferes reales desde Firestore (simulados en web en posiciones relativas) */}
                {onlineDrivers.map((d: any, index: number) => {
                  const topVal = 30 + (index * 17) % 50;
                  const leftVal = 20 + (index * 23) % 65;
                  return (
                    <View key={d.id} style={[styles.simulatedCar, { top: `${topVal}%`, left: `${leftVal}%` }]}>
                      <Ionicons name="car" size={18} color={index === 0 ? Colors.accent : Colors.white} />
                      <Text style={{ color: Colors.white, fontSize: 8, fontFamily: 'Quicksand-Bold', marginTop: 2 }}>
                        {d.name || d.driverName || 'Chofer'}
                      </Text>
                    </View>
                  );
                })}

                {/* Ruta simulada en Web */}
                {originCoords && destinationCoords && (
                  <View style={styles.webSimulatedRouteContainer}>
                    <View style={[styles.simulatedMarker, { backgroundColor: Colors.success }]}>
                      <Text style={styles.simulatedMarkerText}>O</Text>
                    </View>
                    <View style={styles.simulatedRouteLine} />
                    <View style={[styles.simulatedMarker, { backgroundColor: Colors.danger }]}>
                      <Text style={styles.simulatedMarkerText}>D</Text>
                    </View>
                  </View>
                )}
              </View>
              <Text style={styles.webMapText}>
                {originCoords && destinationCoords 
                  ? `Ruta: ${origin.split(',')[0]} ➔ ${destination.split(',')[0]}` 
                  : "Mapa en Vivo (Simulación Ecosistema)"}
              </Text>
            </View>
          ) : (
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={currentLocation}
              showsUserLocation
            >
              {/* Choferes online */}
              {onlineDrivers.map((d: any) => d.location && (
                <Marker
                  key={d.id}
                  coordinate={d.location}
                  title={d.name}
                  description="Chofer de TravelCab cercano"
                >
                  <View style={styles.driverCarMarker}>
                    <Ionicons name="car" size={16} color={Colors.white} />
                  </View>
                </Marker>
              ))}

              {/* Ruta activa y marcadores de origen/destino */}
              {originCoords && (
                <Marker coordinate={originCoords} title="Origen">
                  <View style={[styles.markerPin, { backgroundColor: Colors.success }]}>
                    <Ionicons name="pin" size={16} color={Colors.white} />
                  </View>
                </Marker>
              )}
              {destinationCoords && (
                <Marker coordinate={destinationCoords} title="Destino">
                  <View style={[styles.markerPin, { backgroundColor: Colors.danger }]}>
                    <Ionicons name="flag" size={16} color={Colors.white} />
                  </View>
                </Marker>
              )}
              {routePolyline ? (
                <Polyline
                  coordinates={decodePolyline(routePolyline)}
                  strokeColor={Colors.accent}
                  strokeWidth={4}
                />
              ) : null}
            </MapView>
          )}
        </View>
      )}

      {/* HEADER DE INICIO (ESTILO CANVA) */}
      {activeTab === 'home' && requestFlowStep === 'idle' && (
        <View style={[styles.canvaHeader, { paddingTop: insets.top > 0 ? insets.top + 16 : 40 }]}>
          <View style={styles.canvaLogoRow}>
            <TravelCabLogo size={32} textColor={Colors.white} isAccentColor={true} />
          </View>
          
          <View style={styles.canvaUserGreetingRow}>
            <View style={styles.canvaUserAvatarCircle}>
              <Ionicons name="person" size={18} color="#0A2A5B" />
            </View>
            <Text style={styles.canvaGreetingText}>
              Hola {user?.displayName ? user.displayName.split(' ')[0] : 'Fernando'} ¿Adonde vamos hoy?
            </Text>
          </View>
          
          <View style={styles.canvaPointsRow}>
            <Text style={styles.canvaPointsVal}>{rewardsPoints}</Text>
            <Text style={styles.canvaPointsLabel}> Puntos Rewards</Text>
          </View>
        </View>
      )}

      {/* CONTENIDO PRINCIPAL SEGÚN EL TAB ACTIVO */}
      <ScrollView 
        style={styles.mainScroll}
        contentContainerStyle={[
          styles.mainScrollContent,
          activeTab === 'home' && requestFlowStep === 'idle' && [
            styles.mainScrollContentHomeMap,
            { paddingBottom: 82 + insets.bottom }
          ]
        ]}
        showsVerticalScrollIndicator={false}
      >
        
        {/* TABS 1: INICIO (HOME) */}
        {activeTab === 'home' && (
          <View style={[styles.tabContentContainer, { paddingTop: 20 }]}>
            
            {/* Flujo: Formulario inicial de búsqueda */}
            {requestFlowStep === 'idle' && (
              <Animated.View style={styles.bookingCard}>
                {/* Tabs de Selección de Servicio */}
                <View style={styles.canvaTabsRow}>
                  <TouchableOpacity 
                    style={[styles.canvaTabOpt, activeSubMode === 'urbana' && styles.canvaTabOptActive]}
                    onPress={() => {
                      setActiveSubMode('urbana');
                      setServiceMode('urbana');
                    }}
                  >
                    <Text style={[styles.canvaTabOptText, activeSubMode === 'urbana' && styles.canvaTabOptTextActive]}>Urbano</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.canvaTabOpt, activeSubMode === 'interurbano' && styles.canvaTabOptActive]}
                    onPress={() => {
                      setActiveSubMode('interurbano');
                      setServiceMode('aci');
                    }}
                  >
                    <Text style={[styles.canvaTabOptText, activeSubMode === 'interurbano' && styles.canvaTabOptTextActive]}>Interurbano</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.canvaTabOpt, activeSubMode === 'traslados' && styles.canvaTabOptActive]}
                    onPress={() => setActiveSubMode('traslados')}
                  >
                    <Text style={[styles.canvaTabOptText, activeSubMode === 'traslados' && styles.canvaTabOptTextActive]}>Traslados</Text>
                  </TouchableOpacity>
                </View>

                {/* Título de Tarjeta dinámico */}
                <Text style={[
                  styles.canvaCardTitle,
                  activeSubMode === 'interurbano' && { color: Colors.accent },
                  activeSubMode === 'traslados' && { color: Colors.danger }
                ]}>
                  {activeSubMode === 'urbana' ? 'Movilidad Urbana' : activeSubMode === 'interurbano' ? 'Interurbano' : 'Traslados'}
                </Text>

                {/* Formularios según modo */}
                {activeSubMode !== 'traslados' ? (
                  <View style={{ gap: 8 }}>
                    {/* Origen */}
                    <View>
                      <Text style={styles.canvaInputLabel}>Origen</Text>
                      <View style={styles.canvaInputField}>
                        <Ionicons name="ellipse" size={10} color={Colors.success} style={{ marginRight: 8 }} />
                        <TextInput
                          style={styles.canvaTextInput}
                          placeholder="Origen (Ubicación actual)"
                          placeholderTextColor="#A0AEC0"
                          value={origin}
                          onChangeText={(text) => fetchPlaceSuggestions(text, 'origin')}
                          onFocus={() => setActiveSearchField('origin')}
                        />
                        {origin.length > 0 && (
                          <TouchableOpacity onPress={() => { setOrigin(''); setOriginSuggestions([]); }}>
                            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                          </TouchableOpacity>
                        )}
                      </View>
                      {activeSearchField === 'origin' && originSuggestions.length > 0 && (
                        <View style={styles.suggestionsContainer}>
                          {originSuggestions.map((item) => (
                            <TouchableOpacity
                              key={item.place_id}
                              style={styles.suggestionItem}
                              onPress={() => handleSelectSuggestion(item, 'origin')}
                            >
                              <Ionicons name="location-outline" size={16} color={Colors.textMuted} style={{ marginRight: 6 }} />
                              <Text style={styles.suggestionText} numberOfLines={1}>
                                {item.description}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>

                    {/* Destino */}
                    <View>
                      <Text style={styles.canvaInputLabel}>Destino</Text>
                      <View style={styles.canvaInputField}>
                        <Ionicons name="location" size={14} color={Colors.danger} style={{ marginRight: 8 }} />
                        <TextInput
                          style={styles.canvaTextInput}
                          placeholder="¿A dónde querés ir?"
                          placeholderTextColor="#A0AEC0"
                          value={destination}
                          onChangeText={(text) => fetchPlaceSuggestions(text, 'destination')}
                          onFocus={() => setActiveSearchField('destination')}
                        />
                        {destination.length > 0 && (
                          <TouchableOpacity onPress={() => { setDestination(''); setDestSuggestions([]); }}>
                            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                          </TouchableOpacity>
                        )}
                      </View>
                      {activeSearchField === 'destination' && destSuggestions.length > 0 && (
                        <View style={styles.suggestionsContainer}>
                          {destSuggestions.map((item) => (
                            <TouchableOpacity
                              key={item.place_id}
                              style={styles.suggestionItem}
                              onPress={() => handleSelectSuggestion(item, 'destination')}
                            >
                              <Ionicons name="location-outline" size={16} color={Colors.textMuted} style={{ marginRight: 6 }} />
                              <Text style={styles.suggestionText} numberOfLines={1}>
                                {item.description}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                ) : (
                  <View style={{ gap: 8 }}>
                    {/* Fila 1: Fecha y Hora */}
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.canvaInputLabel}>Fecha</Text>
                        <TouchableOpacity 
                          style={styles.canvaInputField}
                          onPress={() => setShowDatePicker(true)}
                        >
                          <Ionicons name="calendar-outline" size={16} color={Colors.textMuted} style={{ marginRight: 8 }} />
                          <Text style={[styles.canvaTextInput, !scheduleDate && { color: '#A0AEC0' }]}>
                            {scheduleDate || "Elegir fecha"}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.canvaInputLabel}>Hora</Text>
                        <TouchableOpacity 
                          style={styles.canvaInputField}
                          onPress={() => setShowTimePicker(true)}
                        >
                          <Ionicons name="time-outline" size={16} color={Colors.textMuted} style={{ marginRight: 8 }} />
                          <Text style={[styles.canvaTextInput, !scheduleTime && { color: '#A0AEC0' }]}>
                            {scheduleTime ? `${scheduleTime} hs` : "Elegir hora"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Fila 2: Ciudad y Cantidad de pasajeros */}
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ flex: 1.5 }}>
                        <Text style={styles.canvaInputLabel}>Ciudad</Text>
                        <View style={styles.canvaInputField}>
                          <Ionicons name="business-outline" size={16} color={Colors.textMuted} style={{ marginRight: 8 }} />
                          <TextInput 
                            style={styles.canvaTextInput}
                            placeholder="Ej. Tucumán"
                            placeholderTextColor="#A0AEC0"
                            value={scheduleCity}
                            onChangeText={setScheduleCity}
                          />
                        </View>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.canvaInputLabel}>Pasajeros</Text>
                        <View style={styles.canvaInputField}>
                          <Ionicons name="people-outline" size={16} color={Colors.textMuted} style={{ marginRight: 8 }} />
                          <TextInput 
                            style={styles.canvaTextInput}
                            placeholder="Cantidad"
                            placeholderTextColor="#A0AEC0"
                            keyboardType="numeric"
                            value={schedulePassengers}
                            onChangeText={setSchedulePassengers}
                          />
                        </View>
                      </View>
                    </View>

                    {/* Origen */}
                    <View>
                      <Text style={styles.canvaInputLabel}>Origen</Text>
                      <View style={styles.canvaInputField}>
                        <Ionicons name="ellipse" size={10} color={Colors.success} style={{ marginRight: 8 }} />
                        <TextInput 
                          style={styles.canvaTextInput}
                          placeholder="Origen (Ubicación actual)"
                          placeholderTextColor="#A0AEC0"
                          value={origin}
                          onChangeText={(text) => fetchPlaceSuggestions(text, 'origin')}
                          onFocus={() => setActiveSearchField('origin')}
                        />
                      </View>
                    </View>

                    {/* Destino */}
                    <View>
                      <Text style={styles.canvaInputLabel}>Destino</Text>
                      <View style={styles.canvaInputField}>
                        <Ionicons name="location" size={14} color={Colors.danger} style={{ marginRight: 8 }} />
                        <TextInput 
                          style={styles.canvaTextInput}
                          placeholder="¿A dónde querés ir?"
                          placeholderTextColor="#A0AEC0"
                          value={destination}
                          onChangeText={(text) => fetchPlaceSuggestions(text, 'destination')}
                          onFocus={() => setActiveSearchField('destination')}
                        />
                      </View>
                    </View>
                  </View>
                )}

                {/* Selector de Método de Pago */}
                <Text style={styles.canvaPaymentTitle}>Forma de pago</Text>
                <View style={styles.canvaPaymentBox}>
                  {[
                    { id: 'Efectivo', label: 'Efectivo', activeColor: '#00A86B', idleColor: '#4BB5E6' },
                    { id: 'Mercado Pago', label: 'Mercado Pago', activeColor: '#009EE3', idleColor: '#4BB5E6' },
                    { id: 'Rewards', label: 'Puntos Rewards', activeColor: '#F59E0B', idleColor: '#4BB5E6' }
                  ].map(m => {
                    const isSelected = selectedPayment === m.id;
                    return (
                      <View key={m.id} style={styles.canvaPaymentCol}>
                        <Text style={styles.canvaPaymentColLabel}>{m.label}</Text>
                        <TouchableOpacity 
                          style={[
                            styles.canvaPaymentBlock, 
                            { backgroundColor: isSelected ? m.activeColor : m.idleColor }
                          ]}
                          onPress={() => setSelectedPayment(m.id)}
                        >
                          {m.id === 'Efectivo' && (
                            <Ionicons name="cash" size={18} color={Colors.white} />
                          )}
                          {m.id === 'Mercado Pago' && (
                            <Ionicons name="card" size={18} color={Colors.white} />
                          )}
                          {m.id === 'Rewards' && (
                            <Ionicons name="gift" size={18} color={Colors.white} />
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>

                {/* Botón Calcular Viaje Naranja Redondeado */}
                <TouchableOpacity 
                  style={styles.canvaCalcularBtn}
                  onPress={() => {
                    if (!origin || !destination) {
                      return Alert.alert('Ruta incompleta', 'Ingresá origen y destino.');
                    }
                    setRequestFlowStep('pricing');
                  }}
                >
                  <Text style={styles.canvaCalcularBtnText}>Calcular viaje</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Carruseles CMS de Novedades del Ecosistema y Beneficios Rewards */}
            {requestFlowStep === 'idle' && (
              <View style={{ gap: 16, marginTop: 12 }}>
                {/* CMS: Novedades del Ecosistema */}
                <View>
                  <View style={styles.canvaSectionHeader}>
                    <Text style={styles.canvaSectionTitle}>Novedades del Ecosistema</Text>
                    <TouchableOpacity onPress={() => setActiveTab('experience')}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.canvaSectionVerMas}>Ver más</Text>
                        <Ionicons name="arrow-forward" size={12} color={Colors.danger} style={{ marginLeft: 2 }} />
                      </View>
                    </TouchableOpacity>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.canvaCarouselContent}>
                    {cmsBlocks.flatMap(block => block.cards).map((card, idx) => (
                      <TouchableOpacity key={idx} style={styles.canvaCarouselCard} onPress={() => Linking.openURL(card.url)}>
                        <Image source={{ uri: card.imageUrl }} style={styles.canvaCarouselCardImg} />
                        <View style={styles.canvaCarouselCardBody}>
                          <Text style={styles.canvaCarouselCardTitle} numberOfLines={1}>{card.title}</Text>
                          <Text style={styles.canvaCarouselCardDesc} numberOfLines={2}>{card.description}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* CMS: Beneficios Rewards */}
                <View>
                  <View style={styles.canvaSectionHeader}>
                    <Text style={styles.canvaSectionTitle}>Beneficios Rewards</Text>
                    <TouchableOpacity onPress={() => setActiveTab('rewards')}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.canvaSectionVerMas, { color: '#F59E0B' }]}>Ver más</Text>
                        <Ionicons name="arrow-forward" size={12} color="#F59E0B" style={{ marginLeft: 2 }} />
                      </View>
                    </TouchableOpacity>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.canvaCarouselContent}>
                    {rewardsBlocks.length > 0 ? (
                      rewardsBlocks.map((card, idx) => (
                        <TouchableOpacity key={idx} style={styles.canvaCarouselCard} onPress={() => Linking.openURL(card.url || 'https://travelapp.ar/rewards')}>
                          <Image source={{ uri: card.imageUrl }} style={styles.canvaCarouselCardImg} />
                          <View style={styles.canvaCarouselCardBody}>
                            <Text style={styles.canvaCarouselCardTitle} numberOfLines={1}>{card.title}</Text>
                            <Text style={styles.canvaCarouselCardDesc} numberOfLines={2}>{card.description}</Text>
                          </View>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={styles.canvaCarouselCardPlaceholder}>
                        <Text style={{ fontSize: 12, fontFamily: 'Quicksand-Bold', color: Colors.textSecondary }}>Info Beneficios</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              </View>
            )}
          </View>
        )}

        {/* TABS: EXPERIENCIAS */}
        {activeTab === 'experience' && (
          <View style={[styles.tabContentContainer, { paddingTop: insets.top > 0 ? insets.top + 10 : 20 }]}>
            <View style={styles.experienceHeader}>
              <TravelAppLogo size={28} textColor={Colors.primary} isAccentColor={true} />
              <Text style={styles.experienceHeaderTitle}>TravelApp Experiences</Text>
            </View>
            <Text style={styles.experienceHeaderDesc}>Viajes grupales, de autor y experiencias premium seleccionadas para vos.</Text>

            {/* Segmented Control de Experiencias */}
            <View style={styles.segmentedControl}>
              <TouchableOpacity 
                style={[styles.segmentBtn, experienceMainTab === 'catalog' && styles.segmentBtnActive]}
                onPress={() => setExperienceMainTab('catalog')}
              >
                <Ionicons name="earth" size={16} color={experienceMainTab === 'catalog' ? Colors.white : Colors.textSecondary} />
                <Text style={[styles.segmentText, experienceMainTab === 'catalog' && styles.segmentTextActive]}>Catálogo</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.segmentBtn, experienceMainTab === 'trip' && styles.segmentBtnActive]}
                onPress={() => setExperienceMainTab('trip')}
              >
                <Ionicons name="compass" size={16} color={experienceMainTab === 'trip' ? Colors.white : Colors.textSecondary} />
                <Text style={[styles.segmentText, experienceMainTab === 'trip' && styles.segmentTextActive]}>Mi Viaje Grupal</Text>
                {!hasPurchasedOrganizedTrip && (
                  <Ionicons name="lock-closed" size={12} color={experienceMainTab === 'trip' ? Colors.white : Colors.textMuted} style={{ marginLeft: 4 }} />
                )}
              </TouchableOpacity>
            </View>

            {/* SECCIÓN A: CATÁLOGO */}
            {experienceMainTab === 'catalog' && (
              <View style={styles.catalogContainer}>
                {experiences.map(item => (
                  <View key={item.id} style={styles.catalogCard}>
                    <Image source={{ uri: item.img || item.imageUrl }} style={styles.catalogCardImg} />
                    <View style={styles.catalogCardBody}>
                      <View style={styles.catalogCardMeta}>
                        <Text style={styles.catalogDuration}>{item.duration}</Text>
                        <Text style={styles.catalogPrice}>{item.price}</Text>
                      </View>
                      <Text style={styles.catalogTitle}>{item.title}</Text>
                      <Text style={styles.catalogDesc}>{item.desc || item.description}</Text>
                      <TouchableOpacity 
                        style={styles.catalogConsultBtn}
                        onPress={() => {
                          Alert.alert(
                            'Consultar Experiencia',
                            `¿Querés hablar con un asesor o consultarle a Travis AI sobre "${item.title}"?`,
                            [
                              { text: 'Preguntar a Travis', onPress: () => {
                                setExperienceMainTab('trip');
                                setActiveTripSubTab('itinerary');
                                if (!hasPurchasedOrganizedTrip) {
                                  Alert.alert("Simulador", "Habilitá el Switch del Modo Tester para poder interactuar con Travis sobre el viaje.");
                                } else {
                                  setTravisQuery(`¿Qué excursiones recomiendan hacer en Mendoza en un viaje de 5 días?`);
                                }
                              }},
                              { text: 'Chatear con Asesor', onPress: () => {
                                navigation.navigate('Chat');
                              }},
                              { text: 'Cancelar', style: 'cancel' }
                            ]
                          );
                        }}
                      >
                        <Ionicons name="chatbubble-ellipses-outline" size={16} color={Colors.white} />
                        <Text style={styles.catalogConsultBtnText}>Consultar Detalles</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* SECCIÓN B: MI VIAJE GRUPAL */}
            {experienceMainTab === 'trip' && (
              <View style={{ width: '100%' }}>
                {!hasPurchasedOrganizedTrip || !contractedTrip ? (
                  <View style={styles.lockedTripContainer}>
                    <View style={styles.lockIconCircle}>
                      <Ionicons name="lock-closed" size={32} color={Colors.accent} />
                    </View>
                    <Text style={styles.lockedTripTitle}>Módulo Bloqueado</Text>
                    <Text style={styles.lockedTripDesc}>
                      Este sector exclusivo se habilitará una vez que realices la reserva o contrates un viaje grupal organizado por nosotros.
                    </Text>
                    
                    <View style={styles.testerCard}>
                      <View style={styles.testerHeader}>
                        <Ionicons name="flask-outline" size={20} color={Colors.primary} />
                        <Text style={styles.testerTitle}>Herramienta del Tester (Simulación)</Text>
                      </View>
                      <Text style={styles.testerDesc}>
                        Activa este interruptor para simular en tiempo real que contrataste el viaje grupal "Quebrada de Humahuaca & Salinas Grandes" y probar todo el módulo.
                      </Text>
                      <View style={styles.testerToggleRow}>
                        <Text style={styles.testerToggleLabel}>Simular Viaje Adquirido</Text>
                        <Switch 
                          value={hasPurchasedOrganizedTrip}
                          onValueChange={(val) => handleSimulateTrip(val)}
                          trackColor={{ false: '#CBD5E1', true: Colors.accent }}
                          thumbColor={Colors.white}
                        />
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.activeTripDetailContainer}>
                    <View style={styles.activeTripHero}>
                      <Image source={{ uri: contractedTrip.imageUrl }} style={styles.activeTripHeroImg} />
                      <View style={styles.activeTripHeroOverlay}>
                        <Text style={styles.activeTripHeroTitle}>{contractedTrip.destination}</Text>
                        <View style={styles.activeTripHeroBadge}>
                          <Ionicons name="calendar-outline" size={12} color={Colors.white} />
                          <Text style={styles.activeTripHeroBadgeText}>{contractedTrip.dates}</Text>
                        </View>
                      </View>
                    </View>

                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.subTabScroll}
                      contentContainerStyle={styles.subTabScrollContent}
                    >
                      {[
                        { id: 'itinerary', label: 'Itinerario & Info', icon: 'list-circle-outline' },
                        { id: 'payments', label: 'Pagos & Extras', icon: 'wallet-outline' },
                        { id: 'group', label: 'Comunidad', icon: 'people-outline' },
                        { id: 'gallery', label: 'Fotos', icon: 'images-outline' },
                      ].map(subTab => {
                        const isSubSelected = activeTripSubTab === subTab.id;
                        return (
                          <TouchableOpacity
                            key={subTab.id}
                            style={[styles.subTabBtn, isSubSelected && styles.subTabBtnActive]}
                            onPress={() => setActiveTripSubTab(subTab.id as any)}
                          >
                            <Ionicons name={subTab.icon as any} size={16} color={isSubSelected ? Colors.white : Colors.textSecondary} />
                            <Text style={[styles.subTabBtnText, isSubSelected && styles.subTabBtnTextActive]}>{subTab.label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    {activeTripSubTab === 'itinerary' && (
                      <View style={styles.subTabContent}>
                        <View style={styles.infoSectionCard}>
                          <Text style={styles.sectionSubTitle}>Servicios Contratados</Text>
                          {contractedTrip.services?.map((service: string, idx: number) => (
                            <View key={idx} style={styles.serviceRow}>
                              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                              <Text style={styles.serviceText}>{service}</Text>
                            </View>
                          ))}
                          
                          <TouchableOpacity 
                            style={styles.downloadPdfBtn}
                            onPress={() => {
                              Alert.alert(
                                'Descargar Cobertura',
                                'Descargando póliza y credencial digital de asistencia Assist Card (PDF) en segundo plano...',
                                [{ text: 'Listo' }]
                              );
                            }}
                          >
                            <Ionicons name="cloud-download-outline" size={18} color={Colors.primary} />
                            <Text style={styles.downloadPdfBtnText}>Descargar Voucher de Asistencia (PDF)</Text>
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.sectionSubTitle}>Itinerario del Viaje</Text>
                        <View style={styles.itineraryAccordion}>
                          {contractedTrip.itinerary?.map((day: any) => {
                            const isExpanded = expandedDay === day.day;
                            return (
                              <View key={day.day} style={[styles.accordionItem, isExpanded && styles.accordionItemExpanded]}>
                                <TouchableOpacity 
                                  style={styles.accordionHeader}
                                  onPress={() => setExpandedDay(isExpanded ? null : day.day)}
                                >
                                  <View style={styles.accordionDayCircle}>
                                    <Text style={styles.accordionDayText}>D{day.day}</Text>
                                  </View>
                                  <Text style={styles.accordionHeaderTitle} numberOfLines={1}>{day.title}</Text>
                                  <Ionicons 
                                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                                    size={18} 
                                    color={Colors.textSecondary} 
                                  />
                                </TouchableOpacity>
                                
                                {isExpanded && (
                                  <View style={styles.accordionBody}>
                                    <Text style={styles.accordionBodyDesc}>{day.description}</Text>
                                  </View>
                                )}
                              </View>
                            );
                          })}
                        </View>

                        <View style={styles.travisWidgetCard}>
                          <View style={styles.travisWidgetHeader}>
                            <View style={styles.travisWidgetAvatar}>
                              <Text style={styles.travisWidgetAvatarText}>T</Text>
                            </View>
                            <View>
                              <Text style={styles.travisWidgetTitle}>¿Dudas sobre {contractedTrip.destination}?</Text>
                              <Text style={styles.travisWidgetSubtitle}>Preguntale a Travis AI sobre clima, ropa, gastronomía, etc.</Text>
                            </View>
                          </View>
                          
                          <View style={styles.travisWidgetForm}>
                            <TextInput
                              style={styles.travisWidgetInput}
                              placeholder="Ej: ¿Qué ropa llevo para el Hornocal?"
                              value={travisQuery}
                              onChangeText={setTravisQuery}
                            />
                            <TouchableOpacity 
                              style={styles.travisWidgetBtn}
                              onPress={handleAskTravisAboutDestination}
                              disabled={travisLoading}
                            >
                              {travisLoading ? (
                                <ActivityIndicator size="small" color={Colors.white} />
                              ) : (
                                <Ionicons name="send" size={16} color={Colors.white} />
                              )}
                            </TouchableOpacity>
                          </View>

                          {travisAnswer ? (
                            <View style={styles.travisWidgetResponse}>
                              <Text style={styles.travisWidgetResponseTitle}>Respuesta de Travis:</Text>
                              <Text style={styles.travisWidgetResponseText}>{travisAnswer}</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    )}

                    {activeTripSubTab === 'payments' && (
                      <View style={styles.subTabContent}>
                        <View style={styles.paymentStatusCard}>
                          <Text style={styles.paymentCardTitle}>Financiación y Estado de Pago</Text>
                          <View style={styles.paymentProgressContainer}>
                            <View style={styles.paymentProgRow}>
                              <Text style={styles.paymentProgLabel}>Saldo Abonado</Text>
                              <Text style={styles.paymentProgValue}>
                                {contractedTrip.payment.currency} ${contractedTrip.payment.paidAmount} / ${contractedTrip.payment.totalAmount}
                              </Text>
                            </View>
                            <View style={styles.progressBarBg}>
                              <View style={[
                                styles.progressBarFill, 
                                { width: `${(contractedTrip.payment.paidAmount / contractedTrip.payment.totalAmount) * 100}%` }
                              ]} />
                            </View>
                            <Text style={styles.remainingBalanceText}>
                              Saldo Restante a pagar: {contractedTrip.payment.currency} ${contractedTrip.payment.totalAmount - contractedTrip.payment.paidAmount}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.sectionSubTitle}>Excursiones Opcionales (Adquirir con Galicia - Nave)</Text>
                        <View style={styles.excursionsList}>
                          {excursionsList.map((exc: any) => (
                            <View key={exc.id} style={styles.excursionCard}>
                              <View style={styles.excursionHeader}>
                                <Text style={styles.excursionTitle}>{exc.title}</Text>
                                <Text style={styles.excursionPrice}>U$S {exc.price}</Text>
                              </View>
                              <Text style={styles.excursionDesc}>{exc.description}</Text>
                              
                              {exc.paid ? (
                                <View style={styles.paidBadge}>
                                  <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                                  <Text style={styles.paidBadgeText}>ADQUIRIDA Y PAGADA</Text>
                                </View>
                              ) : (
                                <TouchableOpacity 
                                  style={styles.payExcursionBtn}
                                  onPress={() => handleStartGaliciaPayment(exc)}
                                >
                                  <Ionicons name="wallet-outline" size={16} color={Colors.white} />
                                  <Text style={styles.payExcursionBtnText}>Pagar con Galicia - Nave</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {activeTripSubTab === 'group' && (
                      <View style={styles.subTabContent}>
                        <View style={styles.coordinatorCard}>
                          <Image source={{ uri: contractedTrip.coordinator.avatar }} style={styles.coordinatorAvatar} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.coordinatorName}>{contractedTrip.coordinator.name}</Text>
                            <Text style={styles.coordinatorRole}>Coordinador de Viaje Asignado</Text>
                            <TouchableOpacity 
                              style={styles.whatsappCoordBtn}
                              onPress={() => Linking.openURL(`https://wa.me/${contractedTrip.coordinator.phone.replace(/[^0-9]/g, '')}`)}
                            >
                              <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
                              <Text style={styles.whatsappCoordText}>Hablar por WhatsApp</Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        <Text style={styles.sectionSubTitle}>Tus Compañeros de Viaje</Text>
                        <View style={styles.passengersListRow}>
                          {['Sofía (BsAs)', 'Martín (Tucumán)', 'Griselda (Cba)', 'Juan Pablo (Mza)'].map((pName, index) => (
                            <View key={index} style={styles.passengerChip}>
                              <Ionicons name="person-outline" size={12} color={Colors.primary} />
                              <Text style={styles.passengerChipText}>{pName}</Text>
                            </View>
                          ))}
                        </View>

                        <Text style={styles.sectionSubTitle}>Chat Grupal de la Expedición 💬</Text>
                        <View style={styles.groupChatContainer}>
                          <ScrollView 
                            style={styles.chatScroll}
                            contentContainerStyle={{ gap: 10, padding: 10 }}
                            nestedScrollEnabled
                          >
                            {groupMessages.map((msg) => {
                              const isMe = msg.senderRole === 'pasajero' && msg.sender === user.displayName;
                              const isCoord = msg.senderRole === 'coordinador';
                              return (
                                <View 
                                  key={msg.id} 
                                  style={[
                                    styles.chatBubble, 
                                    isMe ? styles.chatBubbleMe : isCoord ? styles.chatBubbleCoord : styles.chatBubbleOther
                                  ]}
                                >
                                  <Text style={styles.chatSenderName}>{msg.sender}</Text>
                                  <Text style={styles.chatBubbleText}>{msg.text}</Text>
                                </View>
                              );
                            })}
                          </ScrollView>
                          
                          <View style={styles.chatInputRow}>
                            <TextInput
                              style={styles.chatInput}
                              placeholder="Escribí un mensaje al grupo..."
                              value={coordinatorMessage}
                              onChangeText={setCoordinatorMessage}
                            />
                            <TouchableOpacity 
                              style={styles.chatSendBtn}
                              onPress={handleSendCoordinatorMessage}
                            >
                              <Ionicons name="send" size={16} color={Colors.white} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    )}

                    {activeTripSubTab === 'gallery' && (
                      <View style={styles.subTabContent}>
                        <Text style={styles.sectionSubTitle}>Galería de Recuerdos del Viaje 📸</Text>
                        <Text style={styles.tabHeaderDesc}>Fotos capturadas por el coordinador y los participantes para descargar.</Text>
                        
                        <View style={styles.galleryGrid}>
                          {contractedTrip.photos?.map((photoUrl: string, index: number) => (
                            <View key={index} style={styles.galleryItem}>
                              <Image source={{ uri: photoUrl }} style={styles.galleryImg} />
                              <TouchableOpacity 
                                style={styles.downloadPhotoBtn}
                                onPress={() => {
                                  Alert.alert(
                                    'Descarga de Foto',
                                    'La foto fue guardada en tu galería de imágenes.',
                                    [{ text: 'Aceptar' }]
                                  );
                                }}
                              >
                                <Ionicons name="cloud-download-outline" size={16} color={Colors.white} />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    <View style={[styles.testerCard, { marginTop: 24 }]}>
                      <View style={styles.testerToggleRow}>
                        <Text style={styles.testerToggleLabel}>🧪 Desactivar Simulación (Modo Tester)</Text>
                        <Switch 
                          value={hasPurchasedOrganizedTrip}
                          onValueChange={(val) => handleSimulateTrip(val)}
                          trackColor={{ false: '#CBD5E1', true: Colors.accent }}
                          thumbColor={Colors.white}
                        />
                      </View>
                    </View>

                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* TABS 2: MIS VIAJES */}
        {activeTab === 'trips' && (
          <View style={[styles.tabContentContainer, { paddingTop: insets.top > 0 ? insets.top + 10 : 20 }]}>
            <Text style={styles.tabHeaderTitle}>Mis Viajes y Actividad</Text>
            <Text style={styles.tabHeaderDesc}>Listado de traslados urbanos e interurbanos y tus canjes del ecosistema.</Text>
            
            {hasPurchasedOrganizedTrip && contractedTrip && (
              <View style={styles.upcomingExperienceCard}>
                <Image source={{ uri: contractedTrip.imageUrl }} style={styles.upcomingExperienceImg} />
                <View style={styles.upcomingExperienceOverlay} />
                <View style={styles.upcomingExperienceBody}>
                  <View style={styles.upcomingBadge}>
                    <Text style={styles.upcomingBadgeText}>PRÓXIMO VIAJE GRUPAL</Text>
                  </View>
                  <Text style={styles.upcomingDest}>{contractedTrip.destination}</Text>
                  <Text style={styles.upcomingDates}><Ionicons name="calendar-outline" size={12} color="#FFF" /> {contractedTrip.dates}</Text>
                  
                  {/* Cuenta regresiva */}
                  <View style={styles.countdownRow}>
                    <Ionicons name="time-outline" size={16} color="#FFE082" />
                    <Text style={styles.countdownText}>
                      Faltan <Text style={{ fontFamily: 'Quicksand-Bold', color: '#FFE082' }}>{getDaysRemaining(contractedTrip.dates)}</Text> días para la partida
                    </Text>
                  </View>
                  
                  <View style={styles.upcomingFooter}>
                    <View style={styles.coordInfo}>
                      <Image source={{ uri: contractedTrip.coordinator?.avatar }} style={styles.coordAvatar} />
                      <View>
                        <Text style={styles.coordLabel}>Coordinador</Text>
                        <Text style={styles.coordName}>{contractedTrip.coordinator?.name}</Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.qrCheckinBtn}
                      onPress={() => setIsQrModalVisible(true)}
                    >
                      <Ionicons name="qr-code-outline" size={16} color={Colors.white} />
                      <Text style={styles.qrCheckinBtnText}>Boarding Pass</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 10, fontSize: 16, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary }]}>Historial de Viajes</Text>

            <View style={styles.tripsList}>
              {passengerTrips.length > 0 ? (
                passengerTrips.map(item => (
                  <View key={item.id} style={styles.tripHistoryItem}>
                    <View style={styles.historyIcon}>
                      <Ionicons name="car-outline" size={20} color={Colors.accent} />
                    </View>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.historyTitle} numberOfLines={1}>{item.origin} → {item.destination}</Text>
                      <Text style={styles.historyDate}>{formatDate(item.createdAt)} · {item.serviceType === 'standard' ? 'Standard' : item.serviceType === 'premium' ? 'Premium' : 'Taxi'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.historyCost}>${item.estimatedPrice} ARS</Text>
                      <Text style={styles.historyPoints}>+150 Pts</Text>
                    </View>
                  </View>
                ))
              ) : (
                // Fallbacks si no tiene viajes reales
                [
                  { id: 't-1', title: 'Viaje TravelCab - San Javier', cost: 1800, points: 150, date: '12 Jun, 2026' },
                  { id: 't-2', title: 'Viaje TravelCab - Centro', cost: 1200, points: 150, date: '10 Jun, 2026' },
                ].map(item => (
                  <View key={item.id} style={styles.tripHistoryItem}>
                    <View style={styles.historyIcon}>
                      <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyTitle}>{item.title}</Text>
                      <Text style={styles.historyDate}>{item.date}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.historyCost}>${item.cost} ARS</Text>
                      <Text style={styles.historyPoints}>+{item.points} Pts</Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* MODAL DEL QR BOARDING PASS */}
            {contractedTrip && (
              <Modal
                visible={isQrModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsQrModalVisible(false)}
              >
                <View style={styles.qrModalOverlay}>
                  <View style={styles.qrModalContent}>
                    <View style={styles.qrModalHeader}>
                      <Text style={styles.qrModalTitle}>Boarding Pass</Text>
                      <TouchableOpacity onPress={() => setIsQrModalVisible(false)} style={styles.qrModalCloseBtn}>
                        <Ionicons name="close" size={24} color={Colors.textPrimary} />
                      </TouchableOpacity>
                    </View>
                    
                    <Text style={styles.qrModalSubtitle}>Presentá este código QR al coordinador al subir al micro</Text>
                    
                    <View style={styles.qrFrame}>
                      <Image 
                        source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=trip_checkin:${user.uid}:${contractedTrip.id}` }} 
                        style={styles.qrCodeImg} 
                      />
                    </View>
                    
                    <View style={styles.qrModalTripInfo}>
                      <Text style={styles.qrModalTripDest}>{contractedTrip.destination}</Text>
                      <Text style={styles.qrModalTripDate}><Ionicons name="calendar-outline" size={12} /> {contractedTrip.dates}</Text>
                      <Text style={styles.qrModalPassenger}>Pasajero: {firstName} {user?.displayName ? user.displayName.split(' ').slice(1).join(' ') : ''}</Text>
                    </View>

                    <TouchableOpacity 
                      style={styles.qrModalButton} 
                      onPress={() => setIsQrModalVisible(false)}
                    >
                      <Text style={styles.qrModalButtonText}>Listo</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            )}
          </View>
        )}

        {/* TABS 3: REWARDS */}
        {activeTab === 'rewards' && (
          <View style={[styles.tabContentContainer, { paddingTop: insets.top > 0 ? insets.top + 10 : 20 }]}>
            {/* Tarjeta de Puntos */}
            <View style={styles.pointsCard}>
              <Text style={styles.pointsCardLabel}>Balance de Puntos</Text>
              <Text style={styles.pointsCardVal}>{rewardsPoints} Puntos</Text>
              <Text style={styles.pointsCardStatus}>Fidelización Nivel Oro</Text>
            </View>

            {/* Segmented Control de Rewards */}
            <View style={[styles.segmentedControl, { marginBottom: 16 }]}>
              <TouchableOpacity 
                style={[styles.segmentBtn, rewardsSubTab === 'canje' && styles.segmentBtnActive]}
                onPress={() => setRewardsSubTab('canje')}
              >
                <Ionicons name="gift-outline" size={16} color={rewardsSubTab === 'canje' ? Colors.white : Colors.textSecondary} />
                <Text style={[styles.segmentText, rewardsSubTab === 'canje' && styles.segmentTextActive]}>Canje por Puntos</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.segmentBtn, rewardsSubTab === 'beneficios' && styles.segmentBtnActive]}
                onPress={() => setRewardsSubTab('beneficios')}
              >
                <Ionicons name="sparkles-outline" size={16} color={rewardsSubTab === 'beneficios' ? Colors.white : Colors.textSecondary} />
                <Text style={[styles.segmentText, rewardsSubTab === 'beneficios' && styles.segmentTextActive]}>Beneficios Libres</Text>
              </TouchableOpacity>
            </View>

            {rewardsSubTab === 'canje' ? (
              <>
                <Text style={styles.tabHeaderTitle}>Catálogo de Canjes y Promociones</Text>
                <Text style={styles.tabHeaderDesc}>Canjeá tus puntos acumulados por viajes gratis y actividades en TravelApp Experiences.</Text>

                <View style={styles.rewardsCatalogGrid}>
                  {rewardsList.map(item => (
                    <View key={item.id} style={styles.rewardCatalogCard}>
                      <Image source={{ uri: item.imageUrl }} style={styles.rewardItemImg} />
                      <View style={styles.rewardItemBody}>
                        <Text style={styles.rewardItemTitle}>{item.title}</Text>
                        <Text style={styles.rewardItemDesc}>{item.description}</Text>
                        
                        <View style={styles.rewardItemFooter}>
                          <Text style={styles.rewardItemPoints}>{item.points} Pts</Text>
                          <TouchableOpacity 
                            style={[styles.canjearBtn, rewardsPoints < item.points && styles.canjearBtnDisabled]}
                            disabled={rewardsPoints < item.points}
                            onPress={async () => {
                              try {
                                const userRef = doc(db, 'users', user.uid);
                                await updateDoc(userRef, {
                                  rewardsPoints: rewardsPoints - item.points
                                });
                                Alert.alert('¡Canje exitoso!', `Has canjeado "${item.title}". El código de cupón te fue enviado por email.`);
                              } catch (err: any) {
                                Alert.alert('Error', 'No se pudo procesar el canje: ' + err.message);
                              }
                            }}
                          >
                            <Text style={styles.canjearBtnText}>Canjear</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.tabHeaderTitle}>Beneficios Exclusivos Gratuitos</Text>
                <Text style={styles.tabHeaderDesc}>Descargá cupones de beneficios gratis en locales asociados sin consumir tus puntos.</Text>

                <View style={styles.rewardsCatalogGrid}>
                  {[
                    {
                      id: 'ben-cafemartinez',
                      title: '2x1 Cafe Martínez',
                      description: 'Presentá este cupón en sucursales adheridas para obtener un 2x1 en café y muffins.',
                      code: 'BEN_CAFEMARTINEZ_2026',
                      imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop&q=80'
                    },
                    {
                      id: 'ben-shell',
                      title: '10% Off Shell V-Power',
                      description: 'Descuento los miércoles en cargas de combustibles premium Shell V-Power.',
                      code: 'BEN_SHELL_VPOWER_10',
                      imageUrl: 'https://images.unsplash.com/photo-1527018601619-a508a2be00cd?w=600&auto=format&fit=crop&q=80'
                    },
                    {
                      id: 'ben-posada',
                      title: 'Posada del Silencio late check-out',
                      description: 'Extensión de check-out hasta las 16:00 hs bonificada en tu estadía en Purmamarca.',
                      code: 'BEN_POSADASILENCIO_LATE',
                      imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=80'
                    }
                  ].map(item => (
                    <View key={item.id} style={styles.rewardCatalogCard}>
                      <Image source={{ uri: item.imageUrl }} style={styles.rewardItemImg} />
                      <View style={styles.rewardItemBody}>
                        <Text style={styles.rewardItemTitle}>{item.title}</Text>
                        <Text style={styles.rewardItemDesc}>{item.description}</Text>
                        
                        <View style={styles.rewardItemFooter}>
                          <Text style={[styles.rewardItemPoints, { color: Colors.success }]}>GRATIS</Text>
                          <TouchableOpacity 
                            style={[styles.canjearBtn, { backgroundColor: Colors.success }]}
                            onPress={() => setSelectedBenefit(item)}
                          >
                            <Text style={styles.canjearBtnText}>Obtener QR</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* MODAL DEL BENEFICIO / CUPÓN QR */}
            {selectedBenefit && (
              <Modal
                visible={!!selectedBenefit}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedBenefit(null)}
              >
                <View style={styles.qrModalOverlay}>
                  <View style={styles.qrModalContent}>
                    <View style={styles.qrModalHeader}>
                      <Text style={styles.qrModalTitle}>Cupón de Beneficio</Text>
                      <TouchableOpacity onPress={() => setSelectedBenefit(null)} style={styles.qrModalCloseBtn}>
                        <Ionicons name="close" size={24} color={Colors.textPrimary} />
                      </TouchableOpacity>
                    </View>
                    
                    <Text style={styles.qrModalSubtitle}>Presentá este código QR en el establecimiento para validar el descuento:</Text>
                    
                    <View style={styles.qrFrame}>
                      <Image 
                        source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=benefit_code:${selectedBenefit.code}:${user.uid}` }} 
                        style={styles.qrCodeImg} 
                      />
                    </View>
                    
                    <View style={styles.qrModalTripInfo}>
                      <Text style={styles.qrModalTripDest}>{selectedBenefit.title}</Text>
                      <Text style={[styles.qrModalTripDate, { color: Colors.success }]}>Código: {selectedBenefit.code}</Text>
                    </View>

                    <TouchableOpacity 
                      style={[styles.qrModalButton, { backgroundColor: Colors.success }]} 
                      onPress={() => setSelectedBenefit(null)}
                    >
                      <Text style={styles.qrModalButtonText}>Entendido</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            )}
          </View>
        )}

        {/* TABS 4: PERFIL */}
        {activeTab === 'profile' && (
          <View style={[styles.tabContentContainer, { paddingTop: insets.top > 0 ? insets.top + 10 : 20 }]}>
            <Text style={styles.tabHeaderTitle}>Configuración de Cuenta</Text>
            <Text style={styles.tabHeaderDesc}>Actualizá tus datos personales y completá la ficha de viaje para el ecosistema.</Text>

            {/* TravelApp Experience button */}
            <TouchableOpacity 
              style={styles.experienceBtn}
              onPress={() => Linking.openURL('https://travelapp.ar/experiences')}
            >
              <TravelExperienceLogo size={180} />
            </TouchableOpacity>

            {/* Mercado Pago Wallet Connect Card */}
            <View style={styles.mpWalletCard}>
              <View style={styles.mpWalletHeader}>
                <Ionicons name="wallet-outline" size={24} color="#009EE3" />
                <Text style={styles.mpWalletTitle}>Mercado Pago Wallet Connect</Text>
              </View>
              {mpLinked ? (
                <View style={styles.mpWalletBody}>
                  <View style={styles.mpLinkedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    <Text style={styles.mpLinkedBadgeText}>Cuenta Vinculada (Débito 1-Clic)</Text>
                  </View>
                  <Text style={styles.mpWalletDesc}>Email: {mpLinkedEmail || user.email}</Text>
                  <TouchableOpacity 
                    style={styles.mpUnlinkBtn} 
                    onPress={async () => {
                      try {
                        await setDoc(doc(db, 'users', user.uid), {
                          mpLinked: false,
                          mpPayerToken: null,
                          mpUserEmail: null
                        }, { merge: true });
                        Alert.alert('Desvinculado', 'Tu cuenta de Mercado Pago fue desvinculada con éxito.');
                      } catch {
                        Alert.alert('Error', 'No se pudo desvincular la cuenta.');
                      }
                    }}
                  >
                    <Text style={styles.mpUnlinkBtnText}>Desvincular Cuenta</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.mpWalletBody}>
                  <Text style={styles.mpWalletDesc}>
                    Vinculá tu cuenta para pagar tus traslados automáticamente en segundo plano, sin ingresar tarjetas.
                  </Text>
                  <TouchableOpacity style={styles.mpLinkBtn} onPress={handleLinkMercadoPago}>
                    <Ionicons name="logo-usd" size={16} color={Colors.white} />
                    <Text style={styles.mpLinkBtnText}>Vincular Mercado Pago</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.profileForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre completo</Text>
                <TextInput style={[styles.formInput, { backgroundColor: '#ECEFF1' }]} value={user.displayName || 'Pasajero'} editable={false} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email registrado</Text>
                <TextInput style={[styles.formInput, { backgroundColor: '#ECEFF1' }]} value={user.email || 'Email'} editable={false} />
              </View>

              {/* Botón para completar la Ficha de Reserva */}
              <TouchableOpacity 
                style={styles.dossierLaunchBtn}
                onPress={() => setIsDossierModalVisible(true)}
              >
                <Ionicons name="document-text-outline" size={20} color={Colors.white} />
                <Text style={styles.dossierLaunchBtnText}>Completar Ficha de Reserva</Text>
              </TouchableOpacity>

              {/* Cerrar Sesión */}
              <TouchableOpacity style={styles.logoutBtn} onPress={() => auth.signOut()}>
                <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
                <Text style={styles.logoutBtnText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* FOOTER NAVIGATION BAR */}
      {requestFlowStep !== 'active' && (
        <View style={[styles.footerTabs, { height: 64 + insets.bottom, paddingBottom: insets.bottom > 0 ? insets.bottom : 8 }]}>
          {[
            { id: 'home', label: 'Inicio', icon: 'map-outline' },
            { id: 'experience', label: 'Experiences', icon: 'compass-outline' },
            { id: 'trips', label: 'Mis viajes', icon: 'time-outline' },
            { id: 'rewards', label: 'Rewards', icon: 'star-outline' },
            { id: 'profile', label: 'Perfil', icon: 'person-outline' },
          ].map(tab => {
            const isSelected = activeTab === tab.id;
            return (
              <TouchableOpacity 
                key={tab.id} 
                style={styles.tabBtn}
                onPress={() => {
                  setRequestFlowStep('idle'); // Reiniciar a idle si cambia
                  setActiveTab(tab.id as any);
                }}
              >
                <Ionicons name={tab.icon as any} size={22} color={isSelected ? Colors.accent : '#94A3B8'} />
                <Text style={[styles.tabLabel, isSelected && styles.tabLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </>
  )}

      {/* Date Selector Modal */}
      <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
        <View style={styles.canvaModalOverlay}>
          <View style={styles.canvaPickerCard}>
            <Text style={styles.canvaPickerTitle}>Seleccionar Fecha</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {getNext10Days().map((day, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.canvaPickerOption}
                  onPress={() => {
                    setScheduleDate(day);
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={styles.canvaPickerOptionText}>{day}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.canvaPickerCloseBtn} onPress={() => setShowDatePicker(false)}>
              <Text style={styles.canvaPickerCloseText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Time Selector Modal */}
      <Modal visible={showTimePicker} transparent animationType="fade" onRequestClose={() => setShowTimePicker(false)}>
        <View style={styles.canvaModalOverlay}>
          <View style={styles.canvaPickerCard}>
            <Text style={styles.canvaPickerTitle}>Seleccionar Hora</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {Array.from({ length: 24 }).map((_, hour) => {
                const hh = hour.toString().padStart(2, '0');
                return ['00', '15', '30', '45'].map(minute => {
                  const timeString = `${hh}:${minute}`;
                  return (
                    <TouchableOpacity 
                      key={timeString} 
                      style={styles.canvaPickerOption}
                      onPress={() => {
                        setScheduleTime(timeString);
                        setShowTimePicker(false);
                      }}
                    >
                      <Text style={styles.canvaPickerOptionText}>{timeString} hs</Text>
                    </TouchableOpacity>
                  );
                });
              })}
            </ScrollView>
            <TouchableOpacity style={styles.canvaPickerCloseBtn} onPress={() => setShowTimePicker(false)}>
              <Text style={styles.canvaPickerCloseText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DE FICHA DE RESERVA */}
      <Modal
        visible={isDossierModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsDossierModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="document-text" size={24} color={Colors.primary} />
              <Text style={styles.modalTitle}>Ficha de Reserva</Text>
            </View>
            <Text style={styles.modalSubtitle}>Completá tus datos médicos y de emergencia obligatorios para viajar con TravelApp Experience.</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300, width: '100%', marginBottom: 16 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>DNI o Pasaporte</Text>
                <TextInput 
                  style={styles.formInput} 
                  placeholder="Ej. DNI 35.123.456" 
                  value={passport}
                  onChangeText={setPassport}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contacto de Emergencia (Nombre y Nro)</Text>
                <TextInput 
                  style={styles.formInput} 
                  placeholder="Ej. María Gómez (+549...)" 
                  value={emergencyContact}
                  onChangeText={setEmergencyContact}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notas Médicas / Alergias (Opcional)</Text>
                <TextInput 
                  style={styles.formInput} 
                  placeholder="Ej. Alergia a la penicilina, asma." 
                  value={medicalNotes}
                  onChangeText={setMedicalNotes}
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsDossierModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveProfileBtn, { flex: 1, marginTop: 0 }]} 
                onPress={async () => {
                  await handleSaveProfile();
                  setIsDossierModalVisible(false);
                }}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.saveProfileText}>Guardar Ficha</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL DE BÚSQUEDA DE CHOFER */}
      <Modal
        visible={requestFlowStep === 'searching'}
        transparent
        animationType="fade"
      >
        <View style={styles.searchingOverlay}>
          <View style={styles.searchingBox}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.searchingTitle}>Buscando tu conductor...</Text>
            <Text style={styles.searchingDesc}>Analizando choferes y tarifas activas en tu zona. Aguarda un momento.</Text>
            <TouchableOpacity style={styles.cancelSearchBtn} onPress={cancelSearch}>
              <Text style={styles.cancelSearchText}>Cancelar Búsqueda</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DE VIAJE FINALIZADO Y PUNTOS ACUMULADOS */}
      <Modal
        visible={tripCompletedModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTripCompletedModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'center', padding: 30 }]}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(245, 158, 11, 0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Ionicons name="gift" size={45} color="#F59E0B" />
            </View>
            
            <Text style={[styles.modalTitle, { textAlign: 'center', fontSize: 24, marginBottom: 8 }]}>¡Viaje Finalizado!</Text>
            <Text style={{ fontSize: 14, fontFamily: 'Quicksand-Medium', color: Colors.textSecondary, textAlign: 'center', marginBottom: 20 }}>
              Tu pago fue procesado con éxito. ¡Gracias por confiar en TravelCab!
            </Text>

            <View style={{ backgroundColor: Colors.background, borderRadius: 16, padding: 16, width: '100%', alignItems: 'center', marginBottom: 24, borderWidth: 1.5, borderColor: '#FFE082' }}>
              <Text style={{ fontSize: 12, fontFamily: 'Quicksand-Bold', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>PUNTOS ACUMULADOS</Text>
              <Text style={{ fontSize: 32, fontFamily: 'Quicksand-Bold', color: '#F59E0B' }}>+{earnedPoints} PTS</Text>
              <Text style={{ fontSize: 11, fontFamily: 'Quicksand-Medium', color: Colors.textMuted, marginTop: 4, textAlign: 'center' }}>
                Sumados automáticamente a tu billetera Rewards
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.confirmBtn, { width: '100%', marginTop: 0 }]} 
              onPress={() => setTripCompletedModalVisible(false)}
            >
              <Text style={styles.confirmBtnText}>¡Excelente!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DE AGENDAR VIAJE */}
      <Modal
        visible={scheduleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setScheduleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="time" size={24} color={Colors.accent} />
              <Text style={styles.modalTitle}>Agendar Viaje</Text>
            </View>
            <Text style={styles.modalSubtitle}>Ingresá los datos para programar tu conductor.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fecha (DD/MM/AAAA)</Text>
              <TextInput 
                style={styles.formInput} 
                placeholder="Ej. 25/06/2026" 
                value={scheduleDate}
                onChangeText={setScheduleDate}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hora (HH:MM)</Text>
              <TextInput 
                style={styles.formInput} 
                placeholder="Ej. 18:30" 
                value={scheduleTime}
                onChangeText={setScheduleTime}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setScheduleModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleScheduleTrip}>
                <Text style={styles.confirmBtnText}>Programar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL CHECKOUT NAVE - BANCO GALICIA */}
      <Modal
        visible={isGaliciaPaying && selectedExcursion !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setIsGaliciaPaying(false)}
      >
        <View style={styles.galiciaModalOverlay}>
          <View style={styles.galiciaCheckoutCard}>
            <View style={styles.galiciaHeader}>
              <View style={styles.galiciaLogoCol}>
                <View style={styles.galiciaLogoCircle}>
                  <Text style={styles.galiciaLogoText}>G</Text>
                </View>
                <Text style={styles.galiciaTitle}>Nave Banco Galicia</Text>
              </View>
              <TouchableOpacity onPress={() => setIsGaliciaPaying(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedExcursion && (
              <View style={styles.galiciaSummaryCard}>
                <View style={styles.galiciaSummaryRow}>
                  <Text style={styles.galiciaSummaryLabel}>Concepto:</Text>
                  <Text style={styles.galiciaSummaryVal}>{selectedExcursion.title}</Text>
                </View>
                <View style={styles.galiciaSummaryRow}>
                  <Text style={styles.galiciaSummaryLabel}>Importe:</Text>
                  <Text style={[styles.galiciaSummaryVal, { color: Colors.success }]}>U$S {selectedExcursion.price}</Text>
                </View>
                <View style={styles.galiciaSummaryRow}>
                  <Text style={styles.galiciaSummaryLabel}>Conversión Aprox:</Text>
                  <Text style={styles.galiciaSummaryVal}>${(selectedExcursion.price * 1000).toLocaleString('es-AR')} ARS</Text>
                </View>
                <View style={styles.galiciaNaveBadge}>
                  <Ionicons name="sparkles" size={12} color="#0369A1" />
                  <Text style={styles.galiciaNaveBadgeText}>3 Cuotas Sin Interés con Galicia</Text>
                </View>
              </View>
            )}

            <Text style={styles.label}>Elegí tu medio de pago:</Text>
            <View style={styles.galiciaPaymentOptions}>
              <TouchableOpacity style={[styles.galiciaOpt, styles.galiciaOptActive]}>
                <Ionicons name="card" size={18} color="#FF6B00" />
                <Text style={styles.galiciaOptText}>Tarjeta Galicia Débito Visa</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.galiciaOpt}>
                <Ionicons name="logo-usd" size={18} color={Colors.textSecondary} />
                <Text style={styles.galiciaOptText}>Dinero en cuenta Nave Galicia</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.galiciaConfirmBtn}
              onPress={handleConfirmGaliciaPayment}
              disabled={isGaliciaPaying && selectedExcursion === null}
            >
              <Text style={styles.galiciaConfirmText}>Confirmar Pago Seguro</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.galiciaCancelBtn}
              onPress={() => setIsGaliciaPaying(false)}
            >
              <Text style={styles.galiciaCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DE ÉXITO DE PAGO GALICIA */}
      <Modal
        visible={paymentSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setPaymentSuccessModal(false)}
      >
        <View style={styles.searchingOverlay}>
          <View style={styles.searchingBox}>
            <Ionicons name="checkmark-circle" size={54} color={Colors.success} />
            <Text style={styles.searchingTitle}>¡Pago Aprobado!</Text>
            <Text style={styles.searchingDesc}>
              El cobro de tu excursión fue procesado con éxito a través de Nave Banco Galicia. Tu voucher digital ya está activo.
            </Text>
            <TouchableOpacity 
              style={[styles.cancelSearchBtn, { borderColor: Colors.success, marginTop: 12 }]} 
              onPress={() => setPaymentSuccessModal(false)}
            >
              <Text style={[styles.cancelSearchText, { color: Colors.success }]}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* NOTIFICACIÓN OVERLAY FLOTANTE */}
      {overlayMessage && (
        <Animated.View style={[styles.overlayBanner, { transform: [{ translateY: overlayAnim }] }]}>
          <View style={styles.overlayIconBox}>
            <Ionicons name="notifications" size={20} color={Colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.overlayTitle}>Notificación de Viaje</Text>
            <Text style={styles.overlayText} numberOfLines={2}>{overlayMessage}</Text>
          </View>
          <TouchableOpacity onPress={() => {
            Animated.timing(overlayAnim, {
              toValue: -100,
              duration: 250,
              useNativeDriver: true
            }).start(() => setOverlayMessage(null));
          }}>
            <Ionicons name="close" size={20} color={Colors.white} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  mapContainer: { ...StyleSheet.absoluteFill, zIndex: 1 },
  map: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: Colors.textSecondary, fontSize: 14, fontFamily: 'Quicksand-Medium' },
  markerPin: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  
  // Header principal flotante
  topBar: {
    position: 'absolute', top: 56, left: 16, right: 16,
    zIndex: 10, gap: 12,
  },
  brandingRow: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.white, borderRadius: 24, paddingVertical: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 5,
  },
  serviceSelector: {
    flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 24, padding: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 5,
  },
  selectorOpt: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 20 },
  selectorOptActive: { backgroundColor: Colors.primary },
  selectorOptText: { fontSize: 13, fontFamily: 'Quicksand-Bold', color: Colors.textSecondary },
  selectorOptTextActive: { color: Colors.white },

  // Scroll Content principal
  mainScroll: { flex: 1, zIndex: 2 },
  mainScrollContent: { flexGrow: 1, paddingBottom: 100 },
  mainScrollContentHomeMap: { flexGrow: 1, paddingBottom: 0, justifyContent: 'flex-end' },
  webMapPlaceholder: { flex: 1, backgroundColor: '#071A3C', justifyContent: 'center', alignItems: 'center', minHeight: 250 },
  webMapGrid: { ...StyleSheet.absoluteFill },
  gridLine: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.15)' },
  simulatedCar: { position: 'absolute', width: 50, height: 35, justifyContent: 'center', alignItems: 'center' },
  webMapText: { fontSize: 12, fontFamily: 'Quicksand-Bold', color: 'rgba(255,255,255,0.4)', zIndex: 5 },
  webSimulatedRouteContainer: { position: 'absolute', top: '50%', left: '15%', right: '15%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  simulatedMarker: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  simulatedMarkerText: { color: Colors.white, fontSize: 9, fontFamily: 'Quicksand-Bold' },
  simulatedRouteLine: { flex: 1, height: 2, borderStyle: 'dashed', borderWidth: 1, borderColor: Colors.accent },

  // Contenido de cada pestaña
  tabContentContainer: { padding: 20, gap: 20 },
  tabHeaderTitle: { fontSize: 22, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  tabHeaderDesc: { fontSize: 13, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary, lineHeight: 18 },

  // Estilos Canva Redesign
  canvaHeader: { paddingHorizontal: 20, paddingBottom: 24, gap: 14 },
  canvaLogoRow: { alignItems: 'center', justifyContent: 'center' },
  canvaUserGreetingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  canvaUserAvatarCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  canvaGreetingText: { fontSize: 16, fontFamily: 'Quicksand-Bold', color: Colors.white, flex: 1 },
  canvaPointsRow: { flexDirection: 'row', alignItems: 'center' },
  canvaPointsVal: { fontSize: 26, fontFamily: 'Quicksand-Bold', color: Colors.white },
  canvaPointsLabel: { fontSize: 26, fontFamily: 'Quicksand-Bold', color: '#F59E0B' },
  
  canvaTabsRow: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 20, padding: 3, marginBottom: 8 },
  canvaTabOpt: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 18 },
  canvaTabOptActive: { backgroundColor: Colors.white, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  canvaTabOptText: { fontSize: 12, fontFamily: 'Quicksand-Bold', color: '#718096' },
  canvaTabOptTextActive: { color: '#0A2A5B' },
  
  canvaCardTitle: { fontSize: 18, fontFamily: 'Quicksand-Bold', color: '#0A2A5B', marginBottom: 12, textAlign: 'center' },
  canvaInputLabel: { fontSize: 12, fontFamily: 'Quicksand-Bold', color: '#718096', marginLeft: 4 },
  canvaInputField: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 24, paddingHorizontal: 16, height: 44, marginTop: 4, marginBottom: 8 },
  canvaTextInput: { flex: 1, fontSize: 13, fontFamily: 'Quicksand-Bold', color: '#0A2A5B', padding: 0 },
  
  canvaPaymentTitle: { fontSize: 13, fontFamily: 'Quicksand-Bold', color: '#718096', marginTop: 12, marginBottom: 8, textAlign: 'center' },
  canvaPaymentBox: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 16 },
  canvaPaymentCol: { flex: 1, alignItems: 'center', gap: 4 },
  canvaPaymentColLabel: { fontSize: 10, fontFamily: 'Quicksand-Bold', color: '#718096', textAlign: 'center' },
  canvaPaymentBlock: { width: '100%', height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: 1 },
  
  canvaCalcularBtn: { backgroundColor: '#FF7A00', borderRadius: 24, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8, shadowColor: '#FF7A00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  canvaCalcularBtnText: { color: Colors.white, fontSize: 16, fontFamily: 'Quicksand-Bold' },
  
  canvaSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 12, marginBottom: 8 },
  canvaSectionTitle: { fontSize: 15, fontFamily: 'Quicksand-Bold', color: Colors.white },
  canvaSectionVerMas: { fontSize: 12, fontFamily: 'Quicksand-Bold', color: '#FF7A00' },
  canvaCarouselContent: { gap: 12, paddingHorizontal: 20, paddingRight: 30 },
  canvaCarouselCard: { width: 140, backgroundColor: '#071A3C', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#1E293B' },
  canvaCarouselCardImg: { width: '100%', height: 80, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  canvaCarouselCardBody: { padding: 8, gap: 2 },
  canvaCarouselCardTitle: { fontSize: 11, fontFamily: 'Quicksand-Bold', color: Colors.white },
  canvaCarouselCardDesc: { fontSize: 9, fontFamily: 'Quicksand-Regular', color: '#94A3B8', lineHeight: 12 },
  canvaCarouselCardPlaceholder: { width: 140, height: 130, backgroundColor: '#071A3C', borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1E293B' },
  
  canvaPricingTitle: { fontSize: 18, fontFamily: 'Quicksand-Bold', color: '#0A2A5B', marginBottom: 14, textAlign: 'center' },
  canvaCategoryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FF7A00', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  canvaCategoryBtnActive: { borderWidth: 2, borderColor: '#0A2A5B' },
  categoryIconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  canvaCategoryName: { fontSize: 14, fontFamily: 'Quicksand-Bold', color: Colors.white },
  canvaCategoryPrice: { fontSize: 16, fontFamily: 'Quicksand-Bold', color: Colors.white },
  
  canvaAgendaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#FF7A00', borderRadius: 12, paddingVertical: 10, marginTop: 12 },
  canvaAgendaBtnText: { color: '#FF7A00', fontSize: 13, fontFamily: 'Quicksand-Bold' },
  
  canvaBackBtn: { flex: 1, borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  canvaBackBtnText: { fontSize: 13, fontFamily: 'Quicksand-Bold', color: '#475569' },
  canvaConfirmBtn: { flex: 2, backgroundColor: '#0A2A5B', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  canvaConfirmBtnText: { color: Colors.white, fontSize: 13, fontFamily: 'Quicksand-Bold' },
  
  canvaModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  canvaPickerCard: { width: '100%', maxWidth: 300, backgroundColor: Colors.white, borderRadius: 16, padding: 16, gap: 12 },
  canvaPickerTitle: { fontSize: 16, fontFamily: 'Quicksand-Bold', color: '#0A2A5B', textAlign: 'center', marginBottom: 4 },
  canvaPickerOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', alignItems: 'center' },
  canvaPickerOptionText: { fontSize: 14, fontFamily: 'Quicksand-Medium', color: '#334155' },
  canvaPickerCloseBtn: { paddingVertical: 12, marginTop: 8, alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 8 },
  canvaPickerCloseText: { fontSize: 14, fontFamily: 'Quicksand-Bold', color: '#64748B' },

  // Tarjeta de reserva (Inicio)
  bookingCard: {
    backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, gap: 16, zIndex: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8,
  },
  bookingCardTitle: { fontSize: 18, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  inputsBox: {
    backgroundColor: Colors.background, borderRadius: 16, padding: 12, gap: 10,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  inputField: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  textInput: { flex: 1, fontSize: 14, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary, padding: 0 },
  inputDivider: { height: 1.5, backgroundColor: Colors.border, marginHorizontal: 4 },
  
  // Botones de acción formulario
  actionRow: { flexDirection: 'row', gap: 12 },
  scheduleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: Colors.accent, borderRadius: 14, paddingVertical: 14,
  },
  scheduledBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  scheduleBtnText: { fontSize: 13, fontFamily: 'Quicksand-Bold', color: Colors.accent },
  scheduledTextActive: { color: Colors.white },
  requestBtn: {
    flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 14,
  },
  requestBtnText: { color: Colors.white, fontSize: 14, fontFamily: 'Quicksand-Bold' },

  // CMS carrusel promocional
  cmsContainer: { marginTop: 8, gap: 14 },
  cmsBlock: { gap: 10 },
  cmsBlockTitle: { fontSize: 15, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  cmsCarousel: { gap: 12, paddingRight: 20 },
  cmsCard: {
    width: 250, backgroundColor: Colors.white, borderRadius: 18, overflow: 'hidden',
    borderWidth: 1.5, borderColor: Colors.border,
  },
  cmsCardImg: { width: '100%', height: 110 },
  cmsCardBody: { padding: 12, gap: 4 },
  cmsCardTitle: { fontSize: 14, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  cmsCardDesc: { fontSize: 11, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary, lineHeight: 15 },

  // Pestaña: Historial de Viajes
  tripsList: { gap: 12 },
  tripHistoryItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, padding: 16, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  historyIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.success + '10', alignItems: 'center', justifyContent: 'center' },
  historyTitle: { fontSize: 14, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  historyDate: { fontSize: 11, fontFamily: 'Quicksand-Regular', color: Colors.textMuted, marginTop: 2 },
  historyCost: { fontSize: 14, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  historyPoints: { fontSize: 11, fontFamily: 'Quicksand-Bold', color: Colors.success, marginTop: 2 },

  // Pestaña: Rewards
  pointsCard: {
    backgroundColor: Colors.primary, borderRadius: 24, padding: 24, gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, elevation: 5,
  },
  pointsCardLabel: { fontSize: 13, fontFamily: 'Quicksand-Medium', color: 'rgba(255,255,255,0.7)' },
  pointsCardVal: { fontSize: 32, fontFamily: 'Quicksand-Bold', color: Colors.white },
  pointsCardStatus: { fontSize: 12, fontFamily: 'Quicksand-Bold', color: Colors.accent, marginTop: 4 },
  rewardsCatalogGrid: { gap: 14 },
  rewardCatalogCard: {
    backgroundColor: Colors.white, borderRadius: 20, overflow: 'hidden',
    borderWidth: 1.5, borderColor: Colors.border,
  },
  rewardItemImg: { width: '100%', height: 140 },
  rewardItemBody: { padding: 16, gap: 6 },
  rewardItemTitle: { fontSize: 15, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  rewardItemDesc: { fontSize: 12, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary, lineHeight: 16 },
  rewardItemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  rewardItemPoints: { fontSize: 18, fontFamily: 'Quicksand-Bold', color: Colors.success },
  canjearBtn: { backgroundColor: Colors.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  canjearBtnDisabled: { backgroundColor: Colors.border },
  canjearBtnText: { color: Colors.white, fontSize: 13, fontFamily: 'Quicksand-Bold' },

  // Pestaña: Perfil
  experienceBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#0A2A5B', paddingVertical: 10, borderRadius: 14,
  },
  experienceBtnText: { color: Colors.white, fontSize: 14, fontFamily: 'Quicksand-Bold' },
  dossierLaunchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#0A2A5B', paddingVertical: 14, borderRadius: 12, marginTop: 8,
  },
  dossierLaunchBtnText: { color: Colors.white, fontSize: 14, fontFamily: 'Quicksand-Bold' },
  profileForm: { gap: 14 },
  extendedProfileTitle: { fontSize: 15, fontFamily: 'Quicksand-Bold', color: Colors.primary, marginTop: 12 },
  saveProfileBtn: {
    backgroundColor: Colors.accent, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8,
  },
  saveProfileText: { color: Colors.white, fontSize: 14, fontFamily: 'Quicksand-Bold' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: Colors.danger, borderRadius: 12, paddingVertical: 14, marginTop: 14,
  },
  logoutBtnText: { color: Colors.danger, fontSize: 14, fontFamily: 'Quicksand-Bold' },

  // Marcador de auto conductor en mapa
  driverCarMarker: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.white,
  },

  // Flujo: Pricing y Fares
  pricingOverlay: { paddingHorizontal: 16, paddingBottom: 24, zIndex: 10, width: '100%' },
  pricingCard: {
    backgroundColor: Colors.white, borderRadius: 24, padding: 20, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, elevation: 8,
  },
  pricingTitle: { fontSize: 16, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  categoriesBox: { gap: 10 },
  categoryOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14, backgroundColor: Colors.background,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  categoryOptionActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '05' },
  categoryName: { fontSize: 14, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  categoryMeta: { fontSize: 10, fontFamily: 'Quicksand-Regular', color: Colors.textMuted, marginTop: 2 },
  categoryFare: { fontSize: 16, fontFamily: 'Quicksand-Bold', color: Colors.primary },
  payLabel: { fontSize: 13, fontFamily: 'Quicksand-Bold', color: Colors.textSecondary, marginTop: 4 },
  paymentBox: { flexDirection: 'row', gap: 8 },
  paymentOpt: { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  paymentOptActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '08' },
  paymentOptText: { fontSize: 12, fontFamily: 'Quicksand-Bold', color: Colors.textSecondary },
  paymentOptTextActive: { color: Colors.accent },
  pricingActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  backBtn: { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  backBtnText: { fontSize: 13, fontFamily: 'Quicksand-Bold', color: Colors.textSecondary },
  confirmTripBtn: { flex: 2, backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  confirmTripText: { color: Colors.white, fontSize: 13, fontFamily: 'Quicksand-Bold' },

  // Flujo: Solicitud Activa (Chofer Asignado)
  activeTripContainer: {
    backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, gap: 16, zIndex: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, elevation: 10,
  },
  halfMap: { height: height * 0.22, borderRadius: 18, overflow: 'hidden', borderWidth: 1.5, borderColor: Colors.border },
  driverPanel: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 4 },
  driverAvatarImg: { width: 52, height: 52, borderRadius: 26 },
  driverInfoCol: { flex: 1, gap: 2 },
  driverNameLabel: { fontSize: 16, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  driverCarPlate: { fontSize: 12, fontFamily: 'Quicksand-Medium', color: Colors.textSecondary },
  driverRatingText: { fontSize: 11, fontFamily: 'Quicksand-Bold', color: Colors.accent },
  carPhotoImg: { width: '100%', height: 110, borderRadius: 14 },
  promoCard: { backgroundColor: Colors.primary + '0B', borderLeftWidth: 3, borderLeftColor: Colors.primary, padding: 12, borderRadius: 8 },
  promoCardTitle: { fontSize: 13, fontFamily: 'Quicksand-Bold', color: Colors.primary },
  promoCardDesc: { fontSize: 11, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary, lineHeight: 16, marginTop: 4 },
  tripControls: { flexDirection: 'row', gap: 8 },
  controlBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: 10 },
  controlBtnRecording: { backgroundColor: Colors.danger },
  controlBtnText: { color: Colors.white, fontSize: 11, fontFamily: 'Quicksand-Bold' },
  cancelTripBtn: { borderWidth: 1.5, borderColor: Colors.danger, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelTripBtnText: { color: Colors.danger, fontSize: 14, fontFamily: 'Quicksand-Bold' },

  // Nuevos estilos de tracking de viaje reestructurado
  driverTrackingCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  driverPanelHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  carPhotoTrackingImg: { width: '100%', height: 120, borderRadius: 12, resizeMode: 'cover', marginTop: 4 },
  tripControlsRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between', marginVertical: 12 },
  controlBtnSquare: { flex: 1, height: 62, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', gap: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  controlBtnLabel: { color: Colors.white, fontSize: 10, fontFamily: 'Quicksand-Bold' },

  // Estilos de pantalla dividida 50/50 y panel de novedades deslizable
  activeTripScreenContainer: { flex: 1, backgroundColor: Colors.white },
  topHalfMapContainer: { height: '50%', width: '100%' },
  bottomHalfContainer: { height: '50%', width: '100%', backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  bottomHalfScrollContent: { padding: 16, paddingBottom: 40, gap: 12 },
  ecosystemDrawerContainer: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 16, padding: 12, backgroundColor: Colors.background, marginTop: 8 },
  ecosystemDrawerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  ecosystemDrawerTitle: { fontSize: 13, fontFamily: 'Quicksand-Bold', color: Colors.primary },
  drawerHintBanner: { backgroundColor: Colors.accent + '15', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginTop: 8, alignItems: 'center' },
  drawerHintText: { color: Colors.accent, fontSize: 11, fontFamily: 'Quicksand-Bold' },
  ecosystemDrawerBody: { marginTop: 12 },

  // Barra inferior de Tabs
  footerTabs: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 70, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border,
    flexDirection: 'row', paddingBottom: 12, zIndex: 9,
  },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabLabel: { fontSize: 10, fontFamily: 'Quicksand-Medium', color: '#94A3B8' },
  tabLabelActive: { color: Colors.accent, fontFamily: 'Quicksand-Bold' },

  // Estilos para Viaje Grupal Próximo (Experiences)
  upcomingExperienceCard: {
    borderRadius: 20, overflow: 'hidden', height: 210, backgroundColor: Colors.primary,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, elevation: 8,
    marginBottom: 10,
  },
  upcomingExperienceImg: {
    ...StyleSheet.absoluteFill, width: '100%', height: '100%',
  },
  upcomingExperienceOverlay: {
    ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10, 42, 91, 0.65)',
  },
  upcomingExperienceBody: {
    flex: 1, padding: 18, justifyContent: 'space-between',
  },
  upcomingBadge: {
    alignSelf: 'flex-start', backgroundColor: '#ff6b00', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
  },
  upcomingBadgeText: {
    color: '#FFF', fontSize: 10, fontFamily: 'Quicksand-Bold', letterSpacing: 0.5,
  },
  upcomingDest: {
    color: '#FFF', fontSize: 18, fontFamily: 'Quicksand-Bold', marginTop: 4,
  },
  upcomingDates: {
    color: '#FFF', fontSize: 12, fontFamily: 'Quicksand-Medium', opacity: 0.9, marginTop: 2,
  },
  countdownRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start', marginTop: 8,
  },
  countdownText: {
    color: '#FFF', fontSize: 12, fontFamily: 'Quicksand-Medium',
  },
  upcomingFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12,
  },
  coordInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  coordAvatar: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#FFF',
  },
  coordLabel: {
    color: 'rgba(255,255,255,0.7)', fontSize: 9, fontFamily: 'Quicksand-Regular',
  },
  coordName: {
    color: '#FFF', fontSize: 11, fontFamily: 'Quicksand-Bold',
  },
  qrCheckinBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ff6b00',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  qrCheckinBtnText: {
    color: '#FFF', fontSize: 12, fontFamily: 'Quicksand-Bold',
  },

  // Modal QR Boarding Pass
  qrModalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  qrModalContent: {
    width: '100%', maxWidth: 340, backgroundColor: '#FFF', borderRadius: 24, padding: 24, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, elevation: 12,
  },
  qrModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 12,
  },
  qrModalTitle: {
    fontSize: 20, fontFamily: 'Quicksand-Bold', color: Colors.primary,
  },
  qrModalCloseBtn: {
    padding: 4,
  },
  qrModalSubtitle: {
    fontSize: 12, fontFamily: 'Quicksand-Medium', color: Colors.textSecondary, textAlign: 'center', marginBottom: 16,
  },
  qrFrame: {
    padding: 12, backgroundColor: '#F8FAFC', borderRadius: 18, borderWidth: 1, borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  qrCodeImg: {
    width: 180, height: 180,
  },
  qrModalTripInfo: {
    width: '100%', alignItems: 'center', gap: 4, marginBottom: 20,
  },
  qrModalTripDest: {
    fontSize: 15, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary, textAlign: 'center',
  },
  qrModalTripDate: {
    fontSize: 12, fontFamily: 'Quicksand-Medium', color: Colors.textSecondary,
  },
  qrModalPassenger: {
    fontSize: 12, fontFamily: 'Quicksand-Bold', color: Colors.accent, marginTop: 4,
  },
  qrModalButton: {
    width: '100%', backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center',
  },
  qrModalButtonText: {
    color: '#FFF', fontSize: 14, fontFamily: 'Quicksand-Bold',
  },

  // Modales
  searchingOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  searchingBox: { backgroundColor: Colors.white, borderRadius: 24, padding: 24, alignItems: 'center', gap: 12, textAlign: 'center' },
  searchingTitle: { fontSize: 18, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  searchingDesc: { fontSize: 12, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary, textAlign: 'center', lineHeight: 18 },
  cancelSearchBtn: { borderWidth: 1.5, borderColor: Colors.danger, borderRadius: 12, paddingVertical: 12, width: '100%', alignItems: 'center', marginTop: 8 },
  cancelSearchText: { color: Colors.danger, fontSize: 13, fontFamily: 'Quicksand-Bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: Colors.white, borderRadius: 24, padding: 24, gap: 14 },
  modalTitle: { fontSize: 18, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  modalSubtitle: { fontSize: 12, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary, marginBottom: 8 },
  label: { fontSize: 11, fontFamily: 'Quicksand-Bold', color: Colors.textSecondary },
  formInput: {
    backgroundColor: Colors.background, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, fontFamily: 'Quicksand-Regular', color: Colors.textPrimary,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: Colors.border, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontFamily: 'Quicksand-Bold', color: Colors.textSecondary },
  confirmBtn: { flex: 2, backgroundColor: Colors.accent, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  confirmBtnText: { fontSize: 14, fontFamily: 'Quicksand-Bold', color: Colors.white },
  inputGroup: { gap: 6, width: '100%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  mpWalletCard: {
    backgroundColor: Colors.white, borderRadius: 20, padding: 18, gap: 12,
    borderWidth: 1.5, borderColor: '#009EE330', marginVertical: 4,
    shadowColor: '#009EE3', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, elevation: 4,
  },
  mpWalletHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mpWalletTitle: { fontSize: 15, fontFamily: 'Quicksand-Bold', color: '#009EE3' },
  mpWalletBody: { gap: 10 },
  mpWalletDesc: { fontSize: 12, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary, lineHeight: 18 },
  mpLinkBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#009EE3', borderRadius: 12, paddingVertical: 12,
  },
  mpLinkBtnText: { color: Colors.white, fontSize: 13, fontFamily: 'Quicksand-Bold' },
  mpLinkedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.success + '10', alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  mpLinkedBadgeText: { fontSize: 11, fontFamily: 'Quicksand-Bold', color: Colors.success },
  mpUnlinkBtn: {
    borderWidth: 1.5, borderColor: Colors.danger, borderRadius: 12, paddingVertical: 12, alignItems: 'center',
  },
  mpUnlinkBtnText: { color: Colors.danger, fontSize: 13, fontFamily: 'Quicksand-Bold' },

  // Pestaña Experiencias
  experienceHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  experienceHeaderTitle: { fontSize: 20, fontFamily: 'Quicksand-Bold', color: Colors.primary },
  experienceHeaderDesc: { fontSize: 13, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary, marginBottom: 14 },
  
  segmentedControl: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 14, padding: 4, marginBottom: 18 },
  segmentBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  segmentBtnActive: { backgroundColor: Colors.primary },
  segmentText: { fontSize: 13, fontFamily: 'Quicksand-Medium', color: Colors.textSecondary },
  segmentTextActive: { color: Colors.white, fontFamily: 'Quicksand-Bold' },

  catalogContainer: { gap: 16 },
  catalogCard: { backgroundColor: Colors.white, borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: Colors.border },
  catalogCardImg: { width: '100%', height: 160 },
  catalogCardBody: { padding: 16, gap: 8 },
  catalogCardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catalogDuration: { fontSize: 11, fontFamily: 'Quicksand-Bold', color: Colors.accent },
  catalogPrice: { fontSize: 16, fontFamily: 'Quicksand-Bold', color: Colors.primary },
  catalogTitle: { fontSize: 15, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  catalogDesc: { fontSize: 12, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary, lineHeight: 18 },
  catalogConsultBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.primary, paddingVertical: 10, borderRadius: 10 },
  catalogConsultBtnText: { color: Colors.white, fontSize: 13, fontFamily: 'Quicksand-Bold' },

  // locked trip state
  lockedTripContainer: { alignItems: 'center', paddingVertical: 24, gap: 14 },
  lockIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.accent + '15', alignItems: 'center', justifyContent: 'center' },
  lockedTripTitle: { fontSize: 18, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  lockedTripDesc: { fontSize: 13, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 16, lineHeight: 20 },
  
  testerCard: { backgroundColor: Colors.primary + '08', borderStyle: 'dashed', borderWidth: 1.5, borderColor: Colors.primary + '40', borderRadius: 18, padding: 16, gap: 8, width: '100%' },
  testerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  testerTitle: { fontSize: 14, fontFamily: 'Quicksand-Bold', color: Colors.primary },
  testerDesc: { fontSize: 11, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary, lineHeight: 16 },
  testerToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  testerToggleLabel: { fontSize: 13, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },

  // active trip details
  activeTripDetailContainer: { gap: 16 },
  activeTripHero: { height: 130, borderRadius: 18, overflow: 'hidden', justifyContent: 'flex-end' },
  activeTripHeroImg: { ...StyleSheet.absoluteFill },
  activeTripHeroOverlay: { padding: 14, backgroundColor: 'rgba(0,0,0,0.45)', gap: 4 },
  activeTripHeroTitle: { fontSize: 18, fontFamily: 'Quicksand-Bold', color: Colors.white },
  activeTripHeroBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.accent, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  activeTripHeroBadgeText: { fontSize: 10, fontFamily: 'Quicksand-Bold', color: Colors.white },

  subTabScroll: { marginVertical: 4 },
  subTabScrollContent: { gap: 8 },
  subTabBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  subTabBtnActive: { backgroundColor: Colors.accent },
  subTabBtnText: { fontSize: 12, fontFamily: 'Quicksand-Medium', color: Colors.textSecondary },
  subTabBtnTextActive: { color: Colors.white, fontFamily: 'Quicksand-Bold' },

  subTabContent: { marginTop: 10, gap: 14 },
  sectionTitle: { fontSize: 16, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  sectionSubTitle: { fontSize: 15, fontFamily: 'Quicksand-Bold', color: Colors.primary, marginVertical: 4 },
  infoSectionCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: Colors.border, gap: 10 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  serviceText: { fontSize: 12, fontFamily: 'Quicksand-Medium', color: Colors.textSecondary },
  downloadPdfBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 10, paddingVertical: 10, marginTop: 8 },
  downloadPdfBtnText: { color: Colors.primary, fontSize: 12, fontFamily: 'Quicksand-Bold' },

  itineraryAccordion: { gap: 8 },
  accordionItem: { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  accordionItemExpanded: { borderColor: Colors.accent },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  accordionDayCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  accordionDayText: { color: Colors.white, fontSize: 11, fontFamily: 'Quicksand-Bold' },
  accordionHeaderTitle: { flex: 1, fontSize: 13, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  accordionBody: { paddingHorizontal: 12, paddingBottom: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8 },
  accordionBodyDesc: { fontSize: 12, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary, lineHeight: 18 },

  travisWidgetCard: { backgroundColor: Colors.primary + '0B', borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: Colors.primary + '20' },
  travisWidgetHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  travisWidgetAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  travisWidgetAvatarText: { color: Colors.white, fontSize: 14, fontFamily: 'Quicksand-Bold' },
  travisWidgetTitle: { fontSize: 13, fontFamily: 'Quicksand-Bold', color: Colors.primary },
  travisWidgetSubtitle: { fontSize: 10, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary },
  travisWidgetForm: { flexDirection: 'row', gap: 8 },
  travisWidgetInput: { flex: 1, backgroundColor: Colors.white, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, fontFamily: 'Quicksand-Regular', borderWidth: 1, borderColor: Colors.border },
  travisWidgetBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  travisWidgetResponse: { backgroundColor: Colors.white, padding: 10, borderRadius: 10, gap: 4, borderWidth: 1, borderColor: Colors.border },
  travisWidgetResponseTitle: { fontSize: 11, fontFamily: 'Quicksand-Bold', color: Colors.primary },
  travisWidgetResponseText: { fontSize: 12, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary, lineHeight: 16 },

  paymentStatusCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: Colors.border },
  paymentCardTitle: { fontSize: 14, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary, marginBottom: 8 },
  paymentProgressContainer: { gap: 10 },
  paymentProgRow: { flexDirection: 'row', justifyContent: 'space-between' },
  paymentProgLabel: { fontSize: 12, fontFamily: 'Quicksand-Medium', color: Colors.textSecondary },
  paymentProgValue: { fontSize: 12, fontFamily: 'Quicksand-Bold', color: Colors.primary },
  progressBarBg: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: Colors.success },
  remainingBalanceText: { fontSize: 11, fontFamily: 'Quicksand-Bold', color: Colors.textSecondary },

  excursionsList: { gap: 10 },
  excursionCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 6 },
  excursionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  excursionTitle: { fontSize: 13, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary, flex: 1 },
  excursionPrice: { fontSize: 14, fontFamily: 'Quicksand-Bold', color: Colors.primary },
  excursionDesc: { fontSize: 11, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary, lineHeight: 16 },
  payExcursionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FF6B00', borderRadius: 10, paddingVertical: 8, marginTop: 4 },
  payExcursionBtnText: { color: Colors.white, fontSize: 12, fontFamily: 'Quicksand-Bold' },
  paidBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.success + '12', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start', marginTop: 4 },
  paidBadgeText: { color: Colors.success, fontSize: 11, fontFamily: 'Quicksand-Bold' },

  coordinatorCard: { flexDirection: 'row', gap: 12, backgroundColor: Colors.white, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  coordinatorAvatar: { width: 44, height: 44, borderRadius: 22 },
  coordinatorName: { fontSize: 14, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  coordinatorRole: { fontSize: 11, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary },
  whatsappCoordBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  whatsappCoordText: { fontSize: 11, fontFamily: 'Quicksand-Bold', color: '#25D366' },

  passengersListRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  passengerChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary + '0B', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  passengerChipText: { fontSize: 11, fontFamily: 'Quicksand-Medium', color: Colors.primary },

  groupChatContainer: { height: 260, backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  chatScroll: { flex: 1, backgroundColor: '#F8FAFC' },
  chatBubble: { padding: 10, borderRadius: 12, maxWidth: '80%', gap: 2 },
  chatBubbleMe: { backgroundColor: Colors.accent + '15', alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  chatBubbleCoord: { backgroundColor: Colors.primary + '15', alignSelf: 'flex-start', borderBottomLeftRadius: 2 },
  chatBubbleOther: { backgroundColor: '#ECEFF1', alignSelf: 'flex-start', borderBottomLeftRadius: 2 },
  chatSenderName: { fontSize: 9, fontFamily: 'Quicksand-Bold', color: Colors.textSecondary },
  chatBubbleText: { fontSize: 12, fontFamily: 'Quicksand-Regular', color: Colors.textPrimary },
  chatInputRow: { flexDirection: 'row', padding: 8, gap: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  chatInput: { flex: 1, backgroundColor: Colors.background, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, fontFamily: 'Quicksand-Regular' },
  chatSendBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },

  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  galleryItem: { width: '47%', height: 110, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  galleryImg: { width: '100%', height: '100%' },
  downloadPhotoBtn: { position: 'absolute', bottom: 6, right: 6, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },

  // modal de Galicia
  galiciaModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  galiciaCheckoutCard: { backgroundColor: '#F8FAFC', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14 },
  galiciaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 12 },
  galiciaLogoCol: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  galiciaLogoCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FF6B00', alignItems: 'center', justifyContent: 'center' },
  galiciaLogoText: { color: Colors.white, fontSize: 12, fontFamily: 'Quicksand-Bold' },
  galiciaTitle: { fontSize: 15, fontFamily: 'Quicksand-Bold', color: Colors.primary },
  galiciaSummaryCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 6 },
  galiciaSummaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  galiciaSummaryLabel: { fontSize: 12, fontFamily: 'Quicksand-Medium', color: Colors.textSecondary },
  galiciaSummaryVal: { fontSize: 12, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  galiciaNaveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4 },
  galiciaNaveBadgeText: { color: '#0369A1', fontSize: 10, fontFamily: 'Quicksand-Bold' },
  galiciaPaymentOptions: { gap: 10, marginVertical: 4 },
  galiciaOpt: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border },
  galiciaOptActive: { borderColor: '#FF6B00', backgroundColor: '#FF6B00' + '05' },
  galiciaOptText: { fontSize: 12, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  galiciaConfirmBtn: { backgroundColor: '#FF6B00', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  galiciaConfirmText: { color: Colors.white, fontSize: 14, fontFamily: 'Quicksand-Bold' },
  galiciaCancelBtn: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  galiciaCancelText: { color: Colors.textSecondary, fontSize: 13, fontFamily: 'Quicksand-Bold' },

  overlayBanner: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 12,
    zIndex: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  overlayIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  overlayTitle: {
    fontSize: 12,
    fontFamily: 'Quicksand-Bold',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  overlayText: {
    fontSize: 14,
    fontFamily: 'Quicksand-Bold',
    color: Colors.white,
    marginTop: 2,
  },
  suggestionsContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    maxHeight: 180,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  suggestionText: {
    fontSize: 13,
    fontFamily: 'Quicksand-Bold',
    color: Colors.textPrimary,
    flex: 1,
  },
});
