import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch,
  TextInput, ActivityIndicator, Animated, ScrollView, Dimensions, Alert, Modal, Image, Linking, Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs, addDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Colors } from '../lib/constants';
import { TravelCabLogo, TravelAppLogo } from '../components/BrandLogos';

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

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const user = auth.currentUser!;
  const firstName = user?.displayName?.split(' ')[0] || 'Pasajero';

  // Navegación de Tabs: 'home' | 'trips' | 'rewards' | 'profile'
  const [activeTab, setActiveTab] = useState<'home' | 'trips' | 'rewards' | 'profile'>('home');

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
  const [rewardsList, setRewardsList] = useState<RewardItem[]>([]);
  const [rewardsPoints, setRewardsPoints] = useState(1450); // Puntos por defecto

  // Datos extendidos de Perfil para TravelApp Experience
  const [passport, setPassport] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [mpLinked, setMpLinked] = useState(false);
  const [mpLinkedEmail, setMpLinkedEmail] = useState('');

  // Animación de paneles
  const panelSlideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(panelSlideAnim, { toValue: 1, useNativeDriver: true }).start();
  }, [activeTab]);

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
          if (data.rewardsPoints !== undefined) {
            setRewardsPoints(data.rewardsPoints);
          }
        }
      });
      return unsubProfile;
    }
  }, [user?.uid]);

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
        setCmsBlocks(snap.docs.map(d => ({ id: d.id, ...d.data() } as CMSBlock)));
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

    return () => {
      unsubDrivers();
      unsubCategories();
      unsubCMS();
      unsubRewards();
    };
  }, []);

  // Simular la búsqueda y aceptación del chofer
  const startSearchDriver = () => {
    if (!origin || !destination) {
      return Alert.alert('Ruta incompleta', 'Por favor ingresá origen y destino del traslado.');
    }
    setRequestFlowStep('searching');

    // Simular que el servidor busca chofer y en 4 segundos uno acepta
    const timer = setTimeout(async () => {
      // Registrar viaje en Firestore para simular flujo real
      try {
        const estimatedPrice = calculateFare(selectedCategory);
        const tripData: any = {
          passengerId: user.uid,
          userName: firstName,
          origin,
          destination,
          serviceType: selectedCategory,
          estimatedPrice,
          paymentMethod: selectedPayment,
          paymentStatus: selectedPayment === 'Efectivo' ? 'pending' : 'awaiting_payment',
          status: 'accepted',
          createdAt: Timestamp.now()
        };
        const docRef = await addDoc(collection(db, 'trips'), tripData);
        
        // DEBITAR AUTOMÁTICAMENTE SI EL MÉTODO ES MERCADO PAGO Y EL CHOFER ACEPTA
        if (selectedPayment === 'Mercado Pago') {
          if (!mpLinked) {
            Alert.alert(
              'Mercado Pago no vinculado',
              'Como tu cuenta no está vinculada, se cambió el viaje a pago Efectivo para tu seguridad.',
              [{ text: 'Entendido' }]
            );
            tripData.paymentMethod = 'Efectivo';
            tripData.paymentStatus = 'pending';
            await updateDoc(doc(db, 'trips', docRef.id), { paymentMethod: 'Efectivo', paymentStatus: 'pending' });
          } else {
            try {
              const payResponse = await fetch('http://localhost:3000/api/checkout/process-debit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  tripId: docRef.id,
                  passengerId: user.uid,
                  driverId: 'driver-1',
                  amount: estimatedPrice
                })
              });
              const payData = await payResponse.json();
              if (payData.success) {
                Alert.alert(
                  '¡Pago Acreditado!',
                  `El conductor aceptó tu solicitud. Se cobraron $${estimatedPrice} ARS automáticamente mediante Wallet Connect.`,
                  [{ text: '¡Excelente!' }]
                );
                tripData.paymentStatus = 'paid';
                tripData.paymentId = payData.paymentId;
              } else {
                Alert.alert(
                  'Pago Rechazado',
                  'Se rechazó el débito en Mercado Pago. Se cambió la forma de pago a Efectivo.',
                  [{ text: 'Entendido' }]
                );
                tripData.paymentMethod = 'Efectivo';
                tripData.paymentStatus = 'pending';
                await updateDoc(doc(db, 'trips', docRef.id), { paymentMethod: 'Efectivo', paymentStatus: 'pending' });
              }
            } catch (payErr) {
              console.warn("Error debiting trip automatically:", payErr);
            }
          }
        }

        // Mock Driver details for active map tracking
        const mockDriver = {
          id: 'driver-1',
          name: 'Roberto Gómez',
          plate: 'AB 876 YZ',
          model: 'Chevrolet Prisma (Blanco)',
          rating: '4.9',
          phone: '+5491100000000',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          carPhoto: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=400&q=80'
        };

        setDriverDetails(mockDriver);
        setActiveTrip({ id: docRef.id, ...tripData });
        setRequestFlowStep('active');
      } catch (e) {
        console.log("Error creating simulated trip", e);
        setRequestFlowStep('idle');
      }
    }, 4000);

    setSearchTimer(timer);
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

  // Cálculo de tarifa simulada
  const calculateFare = (categoryName: string) => {
    const selectedCat = categories.find(c => c.name === categoryName) || { basePrice: 400, multiplier: 1 };
    return Math.round(selectedCat.basePrice * selectedCat.multiplier);
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
        Alert.alert(
          '¡Viaje Completado!',
          `Cobro debitado de forma automática por Wallet Connect.\n\nMonto cobrado: $${data.amount} ARS\nComisión TravelApp: $${data.applicationFee} ARS (Split 1:1)\nPuntos Sumados: +${data.pointsEarned} Pts\nOperación MP N°: ${data.paymentId}`,
          [{ text: 'Entendido', onPress: () => setRequestFlowStep('idle') }]
        );
      } else {
        Alert.alert('Error en Pago', data.error || 'No se pudo debitar el saldo de Mercado Pago.');
      }
    } catch (err) {
      console.warn(err);
      Alert.alert(
        '¡Viaje Completado (Simulado local)!',
        `Se procesó el cobro de $${activeTrip.estimatedPrice || calculateFare(selectedCategory)} ARS de forma local.\nSe sumaron puntos en Rewards.`,
        [{ text: 'Entendido', onPress: () => setRequestFlowStep('idle') }]
      );
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
    <View style={styles.container}>
      {/* MAPA DE FONDO EN INICIO */}
      {activeTab === 'home' && (
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
                
                {/* Choferes simulados */}
                <View style={[styles.simulatedCar, { top: '40%', left: '25%' }]}>
                  <Ionicons name="car" size={18} color={Colors.accent} />
                </View>
                <View style={[styles.simulatedCar, { top: '55%', left: '70%' }]}>
                  <Ionicons name="car" size={18} color={Colors.white} />
                </View>
              </View>
              <Text style={styles.webMapText}>Mapa en Vivo (Simulación Ecosistema)</Text>
            </View>
          ) : (
            <MapView
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
            </MapView>
          )}
        </View>
      )}

      {/* HEADER DE INICIO */}
      {activeTab === 'home' && requestFlowStep === 'idle' && (
        <View style={styles.topBar}>
          <View style={styles.brandingRow}>
            <TravelCabLogo size={34} textColor={Colors.primary} />
          </View>
          
          {/* Selector de servicio */}
          <View style={styles.serviceSelector}>
            <TouchableOpacity 
              style={[styles.selectorOpt, serviceMode === 'urbana' && styles.selectorOptActive]}
              onPress={() => setServiceMode('urbana')}
            >
              <Text style={[styles.selectorOptText, serviceMode === 'urbana' && styles.selectorOptTextActive]}>Urbano</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.selectorOpt, serviceMode === 'aci' && styles.selectorOptActive]}
              onPress={() => setServiceMode('aci')}
            >
              <Text style={[styles.selectorOptText, serviceMode === 'aci' && styles.selectorOptTextActive]}>ACI (Interurbano)</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* CONTENIDO PRINCIPAL SEGÚN EL TAB ACTIVO */}
      <ScrollView 
        style={styles.mainScroll}
        contentContainerStyle={[
          styles.mainScrollContent,
          activeTab === 'home' && requestFlowStep === 'idle' && styles.mainScrollContentHomeMap
        ]}
        showsVerticalScrollIndicator={false}
      >
        
        {/* TABS 1: INICIO (HOME) */}
        {activeTab === 'home' && (
          <View style={styles.tabContentContainer}>
            
            {/* Flujo: Formulario inicial de búsqueda */}
            {requestFlowStep === 'idle' && (
              <Animated.View style={styles.bookingCard}>
                <Text style={styles.bookingCardTitle}>¿A dónde viajamos?</Text>
                
                <View style={styles.inputsBox}>
                  <View style={styles.inputField}>
                    <Ionicons name="ellipse" size={12} color={Colors.success} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Origen (Ubicación actual)"
                      placeholderTextColor={Colors.textMuted}
                      value={origin}
                      onChangeText={setOrigin}
                    />
                  </View>
                  <View style={styles.inputDivider} />
                  <View style={styles.inputField}>
                    <Ionicons name="location" size={14} color={Colors.danger} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="¿A dónde querés ir?"
                      placeholderTextColor={Colors.textMuted}
                      value={destination}
                      onChangeText={setDestination}
                    />
                  </View>
                </View>

                {/* Fila de Acciones Rápidas */}
                <View style={styles.actionRow}>
                  <TouchableOpacity 
                    style={[styles.scheduleBtn, isScheduled && styles.scheduledBtnActive]}
                    onPress={() => setScheduleModalVisible(true)}
                  >
                    <Ionicons name="time-outline" size={18} color={isScheduled ? Colors.white : Colors.accent} />
                    <Text style={[styles.scheduleBtnText, isScheduled && styles.scheduledTextActive]}>
                      {isScheduled ? `Agendado: ${scheduleTime}` : 'Agendar viaje'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.requestBtn}
                    onPress={() => {
                      if (!origin || !destination) return Alert.alert('Ruta incompleta', 'Ingresá origen y destino.');
                      setRequestFlowStep('pricing');
                    }}
                  >
                    <Text style={styles.requestBtnText}>Buscar tarifas</Text>
                    <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                  </TouchableOpacity>
                </View>

                {/* CMS Promotional blocks scroll */}
                <View style={styles.cmsContainer}>
                  {cmsBlocks.map(block => (
                    <View key={block.id} style={styles.cmsBlock}>
                      <Text style={styles.cmsBlockTitle}>{block.blockTitle}</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cmsCarousel}>
                        {block.cards.map((card, idx) => (
                          <TouchableOpacity key={idx} style={styles.cmsCard} onPress={() => Linking.openURL(card.url)}>
                            <Image source={{ uri: card.imageUrl }} style={styles.cmsCardImg} />
                            <View style={styles.cmsCardBody}>
                              <Text style={styles.cmsCardTitle} numberOfLines={1}>{card.title}</Text>
                              <Text style={styles.cmsCardDesc} numberOfLines={2}>{card.description}</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Flujo: Selección de categorías y cotización */}
            {requestFlowStep === 'pricing' && (
              <View style={styles.pricingOverlay}>
                <View style={styles.pricingCard}>
                  <Text style={styles.pricingTitle}>Categorías y Tarifas</Text>
                  
                  {/* Listado de Categorías Dinámicas */}
                  <View style={styles.categoriesBox}>
                    {categories.map(cat => {
                      const isSelected = selectedCategory === cat.name;
                      const fare = calculateFare(cat.name);
                      return (
                        <TouchableOpacity 
                          key={cat.id} 
                          style={[styles.categoryOption, isSelected && styles.categoryOptionActive]}
                          onPress={() => setSelectedCategory(cat.name)}
                        >
                          <Ionicons name="car-outline" size={24} color={isSelected ? Colors.accent : Colors.primary} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.categoryName}>{cat.name}</Text>
                            <Text style={styles.categoryMeta}>Tarifa Base · Split Habilitado</Text>
                          </View>
                          <Text style={styles.categoryFare}>${fare} ARS</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Selector de Método de Pago */}
                  <Text style={styles.payLabel}>Forma de pago</Text>
                  <View style={styles.paymentBox}>
                    {['Efectivo', 'Mercado Pago', 'Rewards'].map(m => (
                      <TouchableOpacity 
                        key={m} 
                        style={[styles.paymentOpt, selectedPayment === m && styles.paymentOptActive]}
                        onPress={() => setSelectedPayment(m)}
                      >
                        <Text style={[styles.paymentOptText, selectedPayment === m && styles.paymentOptTextActive]}>{m}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Botones de acción */}
                  <View style={styles.pricingActions}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => setRequestFlowStep('idle')}>
                      <Text style={styles.backBtnText}>Volver</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.confirmTripBtn} onPress={startSearchDriver}>
                      <Text style={styles.confirmTripText}>Confirmar Viaje</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Flujo: Viaje Aceptado (Chofer asignado) */}
            {requestFlowStep === 'active' && driverDetails && (
              <View style={styles.activeTripContainer}>
                {/* Mapa a media pantalla */}
                <View style={styles.halfMap}>
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
                      style={styles.map}
                      initialRegion={currentLocation}
                      showsUserLocation
                    >
                      <Marker coordinate={currentLocation} title="Tu ubicación" />
                    </MapView>
                  )}
                </View>

                {/* Tarjeta del Chofer Asignado en el centro */}
                <View style={styles.driverPanel}>
                  <Image source={{ uri: driverDetails.avatar }} style={styles.driverAvatarImg} />
                  <View style={styles.driverInfoCol}>
                    <Text style={styles.driverNameLabel}>{driverDetails.name}</Text>
                    <Text style={styles.driverCarPlate}>Patente: {driverDetails.plate} · {driverDetails.model}</Text>
                    <Text style={styles.driverRatingText}>⭐ {driverDetails.rating} Calificación Conductor</Text>
                  </View>
                </View>

                {/* Tarjeta del Vehículo */}
                <Image source={{ uri: driverDetails.carPhoto }} style={styles.carPhotoImg} />

                {/* Bloque de Información Promocional del Ecosistema */}
                <View style={styles.promoCard}>
                  <Text style={styles.promoCardTitle}>Info Ecosistema TravelApp</Text>
                  <Text style={styles.promoCardDesc}>
                    ¿Sabías que al completar este viaje acumulás **150 puntos** en tu perfil de Rewards? Canjealos por beneficios en TravelApp Experiences.
                  </Text>
                </View>

                {/* Controles de Viaje */}
                <View style={styles.tripControls}>
                  <TouchableOpacity 
                    style={[styles.controlBtn, isRecording && styles.controlBtnRecording]}
                    onPress={() => setIsRecording(prev => !prev)}
                  >
                    <Ionicons name={isRecording ? "mic" : "mic-outline"} size={22} color={Colors.white} />
                    <Text style={styles.controlBtnText}>{isRecording ? "Grabando..." : "Grabar Audio"}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.controlBtn, { backgroundColor: '#25D366' }]}
                    onPress={() => Linking.openURL('https://wa.me/?text=Hola!%20Estoy%20viajando%20en%20TravelCab,%20seguí%20mi%20recorrido%20en%20tiempo%20real.')}
                  >
                    <Ionicons name="logo-whatsapp" size={22} color={Colors.white} />
                    <Text style={styles.controlBtnText}>Compartir viaje</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.controlBtn, { backgroundColor: Colors.danger }]}
                    onPress={() => Linking.openURL('tel:911')}
                  >
                    <Ionicons name="alert-circle" size={22} color={Colors.white} />
                    <Text style={styles.controlBtnText}>Pánico (911)</Text>
                  </TouchableOpacity>
                </View>

                {/* Botón de Finalizar Viaje (para testing de Cobro Automático) */}
                <TouchableOpacity 
                  style={[styles.cancelTripBtn, { borderColor: Colors.success, marginTop: 4 }]} 
                  onPress={handleCompleteTrip}
                >
                  <Text style={[styles.cancelTripBtnText, { color: Colors.success }]}>
                    Finalizar Viaje (Simular Pago 1-Clic)
                  </Text>
                </TouchableOpacity>

                {/* Botón de Cancelar */}
                <TouchableOpacity style={styles.cancelTripBtn} onPress={handleCancelTrip}>
                  <Text style={styles.cancelTripBtnText}>Cancelar Viaje</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* TABS 2: MIS VIAJES */}
        {activeTab === 'trips' && (
          <View style={styles.tabContentContainer}>
            <Text style={styles.tabHeaderTitle}>Mis Viajes y Actividad</Text>
            <Text style={styles.tabHeaderDesc}>Listado de traslados urbanos e interurbanos y tus canjes del ecosistema.</Text>
            
            <View style={styles.tripsList}>
              {[
                { id: 't-1', title: 'Viaje TravelCab - San Javier', cost: 1800, points: 150, date: '12 Jun, 2026' },
                { id: 't-2', title: 'Viaje TravelCab - Centro', cost: 1200, points: 150, date: '10 Jun, 2026' },
                { id: 't-3', title: 'Aventura Cerro de Siete Colores (Experiences)', cost: 12000, points: 500, date: '04 Jun, 2026' },
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
              ))}
            </View>
          </View>
        )}

        {/* TABS 3: REWARDS */}
        {activeTab === 'rewards' && (
          <View style={styles.tabContentContainer}>
            {/* Tarjeta de Puntos */}
            <View style={styles.pointsCard}>
              <Text style={styles.pointsCardLabel}>Balance de Puntos</Text>
              <Text style={styles.pointsCardVal}>{rewardsPoints} Puntos</Text>
              <Text style={styles.pointsCardStatus}>Fidelización Nivel Oro</Text>
            </View>

            {/* Carrusel editable de beneficios */}
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
                        onPress={() => {
                          setRewardsPoints(p => p - item.points);
                          Alert.alert('¡Canje exitoso!', `Has canjeado "${item.title}". El código de cupón te fue enviado por email.`);
                        }}
                      >
                        <Text style={styles.canjearBtnText}>Canjear</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* TABS 4: PERFIL */}
        {activeTab === 'profile' && (
          <View style={styles.tabContentContainer}>
            <Text style={styles.tabHeaderTitle}>Configuración de Cuenta</Text>
            <Text style={styles.tabHeaderDesc}>Actualizá tus datos personales y completá la ficha de viaje para el ecosistema.</Text>

            {/* TravelApp Experience button */}
            <TouchableOpacity 
              style={styles.experienceBtn}
              onPress={() => Linking.openURL('https://travelapp.ar/experiences')}
            >
              <TravelAppLogo size={24} textColor={Colors.white} isAccentColor={false} />
              <Text style={styles.experienceBtnText}>Ir a TravelApp Experience</Text>
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

              {/* Ficha extendida para reservas en tucuman/norte */}
              <Text style={styles.extendedProfileTitle}>Datos de Reservas (Experiences & ACI)</Text>
              
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

              <TouchableOpacity 
                style={styles.saveProfileBtn} 
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.saveProfileText}>Guardar Datos Ficha</Text>
                )}
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
        <View style={styles.footerTabs}>
          {[
            { id: 'home', label: 'Inicio', icon: 'map-outline' },
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  mapContainer: { ...StyleSheet.absoluteFill, zIndex: 1 },
  map: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: Colors.textSecondary, fontSize: 14, fontFamily: 'Quicksand-Medium' },
  
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
  simulatedCar: { position: 'absolute', width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  webMapText: { fontSize: 12, fontFamily: 'Quicksand-Bold', color: 'rgba(255,255,255,0.4)', zIndex: 5 },

  // Contenido de cada pestaña
  tabContentContainer: { padding: 20, gap: 20 },
  tabHeaderTitle: { fontSize: 22, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  tabHeaderDesc: { fontSize: 13, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary, lineHeight: 18 },

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
    backgroundColor: '#0F4C35', paddingVertical: 14, borderRadius: 14,
  },
  experienceBtnText: { color: Colors.white, fontSize: 14, fontFamily: 'Quicksand-Bold' },
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
  driverAvatarImg: { width: 50, height: 50, borderRadius: 25 },
  driverInfoCol: { flex: 1, gap: 2 },
  driverNameLabel: { fontSize: 16, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  driverCarPlate: { fontSize: 12, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary },
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

  // Barra inferior de Tabs
  footerTabs: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 70, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border,
    flexDirection: 'row', paddingBottom: 12, zIndex: 9,
  },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabLabel: { fontSize: 10, fontFamily: 'Quicksand-Medium', color: '#94A3B8' },
  tabLabelActive: { color: Colors.accent, fontFamily: 'Quicksand-Bold' },

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
});
