import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch,
  Animated, Alert, Modal, Linking, Dimensions, ActivityIndicator, ScrollView, TextInput,
  AppState, AppStateStatus, Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { doc, setDoc, onSnapshot, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { db, auth } from '../lib/firebase';
import { Colors } from '../lib/constants';
import { TravelCabLogo } from '../components/BrandLogos';

const { width, height } = Dimensions.get('window');

interface Vehicle {
  id: string;
  brand: string;
  plate: string;
  color: string;
  category: string;
  active: boolean;
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [isOnline, setIsOnline] = useState(false);
  const [todayTrips, setTodayTrips] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);

  // Inactividad y Validación Biométrica
  const [lastActiveTime, setLastActiveTime] = useState(Date.now());
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [biometricTimeoutMinutes, setBiometricTimeoutMinutes] = useState(5); // default 5 mins
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);
  const [biometricSuccess, setBiometricSuccess] = useState(false);

  // Taxímetro de viaje libre (Modo Taxi)
  const [taximeterVisible, setTaximeterVisible] = useState(false);
  const [taximeterStep, setTaximeterStep] = useState<'idle' | 'running' | 'summary'>('idle');
  const [taxiSeconds, setTaxiSeconds] = useState(0);
  const [taxiDistance, setTaxiDistance] = useState(0.0);
  const [taxiFare, setTaxiFare] = useState(300.0);
  const [referralPassengerBonus, setReferralPassengerBonus] = useState(1500);
  const [referralDriverBonus, setReferralDriverBonus] = useState(2000);

  const appState = useRef(AppState.currentState);
  const [lastBackgroundTime, setLastBackgroundTime] = useState<number | null>(null);

  // Escuchar configuración de seguridad de Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_config', 'driver_settings'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.biometricTimeoutMinutes !== undefined) {
          setBiometricTimeoutMinutes(data.biometricTimeoutMinutes);
        }
        if (data.referralPassengerBonus !== undefined) {
          setReferralPassengerBonus(data.referralPassengerBonus);
        }
        if (data.referralDriverBonus !== undefined) {
          setReferralDriverBonus(data.referralDriverBonus);
        }
      }
    });
    return unsub;
  }, []);

  // Efecto del taxímetro digital activo
  useEffect(() => {
    let interval: any = null;
    if (taximeterStep === 'running') {
      interval = setInterval(() => {
        setTaxiSeconds(prev => {
          const nextSecs = prev + 1;
          setTaxiDistance(dist => {
            const nextDist = dist + 0.015; // 0.015 km por segundo
            const base = 300.0;
            const distCost = nextDist * 180.0;
            const timeCost = (nextSecs / 60.0) * 50.0;
            setTaxiFare(Math.round(base + distCost + timeCost));
            return nextDist;
          });
          return nextSecs;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [taximeterStep]);

  // Timer de inactividad activa en pantalla
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const inactiveMs = Date.now() - lastActiveTime;
      const timeoutMs = biometricTimeoutMinutes * 60 * 1000;
      if (inactiveMs > timeoutMs && !showBiometricModal && isOnline) {
        setShowBiometricModal(true);
      }
    }, 10000); // Chequear cada 10 segundos
    return () => clearInterval(checkInterval);
  }, [lastActiveTime, biometricTimeoutMinutes, showBiometricModal, isOnline]);

  // Listener de AppState (Inactividad por segundo plano)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App vuelve al primer plano
        if (lastBackgroundTime) {
          const inactiveMs = Date.now() - lastBackgroundTime;
          const timeoutMs = biometricTimeoutMinutes * 60 * 1000;
          if (inactiveMs > timeoutMs && !showBiometricModal) {
            setShowBiometricModal(true);
          }
        }
        setLastActiveTime(Date.now()); // Reiniciar tiempo activo al volver
      } else if (nextAppState.match(/inactive|background/)) {
        // App pasa al segundo plano
        setLastBackgroundTime(Date.now());
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [lastBackgroundTime, biometricTimeoutMinutes, showBiometricModal]);

  const handleTriggerBiometric = () => {
    setIsBiometricScanning(true);
    setTimeout(() => {
      setIsBiometricScanning(false);
      setBiometricSuccess(true);
      setTimeout(() => {
        setBiometricSuccess(false);
        setShowBiometricModal(false);
        setLastActiveTime(Date.now()); // Reiniciar inactividad
      }, 1500);
    }, 2000);
  };
  
  // Modales y Menú
  const [menuVisible, setMenuVisible] = useState(false);
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  // Vehículos
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);
  const [newBrand, setNewBrand] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [newColor, setNewColor] = useState('');
  const [newCategory, setNewCategory] = useState('Standard');
  const [savingVehicle, setSavingVehicle] = useState(false);

  // Ubicación del conductor
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideMenuAnim = useRef(new Animated.Value(-width * 0.75)).current;
  const locationInterval = useRef<any>(null);

  const user = auth.currentUser!;

  // Animación de menú lateral
  useEffect(() => {
    if (menuVisible) {
      Animated.timing(slideMenuAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideMenuAnim, {
        toValue: -width * 0.75,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [menuVisible]);

  // Pulso animado cuando está online
  useEffect(() => {
    if (isOnline) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isOnline]);

  // Obtener ubicación inicial con fallbacks de alta robustez
  useEffect(() => {
    const getInitialLocation = async () => {
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

        // 1. Intentar obtener la última ubicación conocida (instantáneo)
        let loc = await Location.getLastKnownPositionAsync({});
        
        // 2. Si no hay última ubicación, pedir la actual con balanced accuracy (más rápido)
        if (!loc) {
          loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        }

        if (loc) {
          setCurrentLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          });
        } else {
          throw new Error("No location resolved");
        }
      } catch (e) {
        console.log("Error getting location, using fallback coordinate", e);
        // Coordenada por defecto (Buenos Aires Centro)
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
    getInitialLocation();
  }, []);

  // Escuchar viajes de hoy, solicitudes y modulo de vehículos
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, 'trips'),
      where('driverId', '==', user.uid),
      where('status', '==', 'completed'),
      where('createdAt', '>=', Timestamp.fromDate(today))
    );

    const unsub = onSnapshot(q, (snap) => {
      setTodayTrips(snap.size);
      let earnings = 0;
      snap.forEach(d => {
        const trip = d.data();
        earnings += (trip.finalPrice || trip.estimatedPrice || 0);
      });
      setTodayEarnings(earnings);
    });

    // Escuchar si hay viajes pendientes (en búsqueda)
    const qPending = query(collection(db, 'trips'), where('status', '==', 'searching'));
    const unsubPending = onSnapshot(qPending, (snap) => {
      if (isOnline && !snap.empty) {
        const trip = { id: snap.docs[0].id, ...snap.docs[0].data() };
        navigation.navigate('TripRequest', { trip });
      }
    });

    // Escuchar vehículos en Firestore
    const unsubVehicles = onSnapshot(collection(db, 'drivers', user.uid, 'vehicles'), async (snap) => {
      if (snap.empty) {
        // Inicializar con vehículo por defecto si la base está vacía
        const defaultVehicle = {
          brand: 'Chevrolet Prisma',
          plate: 'AB 123 CD',
          color: 'Blanco',
          category: 'Standard',
          active: true,
          createdAt: Timestamp.now()
        };
        const docRef = await addDoc(collection(db, 'drivers', user.uid, 'vehicles'), defaultVehicle);
        await setDoc(doc(db, 'drivers', user.uid), {
          activeVehicle: { id: docRef.id, ...defaultVehicle }
        }, { merge: true });
      } else {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Vehicle));
        setVehicles(list);
      }
    });

    return () => {
      unsub();
      unsubPending();
      unsubVehicles();
    };
  }, [isOnline]);

  // Enviar ubicación periódicamente cuando está online
  useEffect(() => {
    if (isOnline) {
      locationInterval.current = setInterval(async () => {
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setCurrentLocation((prev: any) => prev ? { ...prev, ...coords } : { ...coords, latitudeDelta: 0.015, longitudeDelta: 0.015 });
          
          await setDoc(doc(db, 'drivers', user.uid), {
            isOnline: true,
            location: coords,
            updatedAt: Timestamp.now(),
            name: user.displayName || 'Conductor',
          }, { merge: true });
        } catch (e) {
          console.log("Error sending driver location", e);
        }
      }, 10000);
    } else {
      clearInterval(locationInterval.current);
      setDoc(doc(db, 'drivers', user.uid), { isOnline: false, updatedAt: Timestamp.now() }, { merge: true });
    }
    return () => clearInterval(locationInterval.current);
  }, [isOnline]);

  const toggleOnline = async () => {
    if (!isOnline) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu ubicación para conectarte.');
      }
    }
    setIsOnline(prev => !prev);
  };

  const handleSupportOption = (type: 'emergency' | 'whatsapp' | 'travis') => {
    setSupportModalVisible(false);
    if (type === 'emergency') {
      Linking.openURL('tel:911');
    } else if (type === 'whatsapp') {
      Linking.openURL('https://wa.me/5491100000000?text=Hola,%20necesito%20soporte%20como%20conductor%20en%20TravelApp.');
    } else if (type === 'travis') {
      Linking.openURL('https://travelapp.ar/support');
    }
  };

  const handleMenuNavigation = (route: string) => {
    setMenuVisible(false);
    navigation.navigate(route);
  };

  // Gestión de Vehículos
  const handleSelectActiveVehicle = async (vehicleId: string) => {
    try {
      const targetVehicle = vehicles.find(v => v.id === vehicleId);
      if (!targetVehicle) return;

      // Actualizar todos los vehículos en Firestore
      for (const v of vehicles) {
        await updateDoc(doc(db, 'drivers', user.uid, 'vehicles', v.id), {
          active: v.id === vehicleId
        });
      }

      // Actualizar el vehículo activo en el perfil principal del conductor
      await setDoc(doc(db, 'drivers', user.uid), {
        activeVehicle: {
          id: targetVehicle.id,
          brand: targetVehicle.brand,
          plate: targetVehicle.plate,
          color: targetVehicle.color,
          category: targetVehicle.category,
          active: true
        }
      }, { merge: true });

      Alert.alert('Vehículo activado', `Ahora estás manejando el ${targetVehicle.brand}.`);
    } catch (e) {
      Alert.alert('Error', 'No se pudo activar el vehículo. Intentá de nuevo.');
    }
  };

  const handleAddVehicle = async () => {
    if (!newBrand || !newPlate || !newColor) {
      return Alert.alert('Campos incompletos', 'Por favor completa marca/modelo, patente y color.');
    }
    if (vehicles.length >= 3) {
      return Alert.alert('Límite alcanzado', 'Solo podés tener hasta 3 vehículos registrados.');
    }

    setSavingVehicle(true);
    try {
      const isFirst = vehicles.length === 0;
      const vehicleData = {
        brand: newBrand,
        plate: newPlate.toUpperCase(),
        color: newColor,
        category: newCategory,
        active: isFirst,
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'drivers', user.uid, 'vehicles'), vehicleData);

      if (isFirst) {
        await setDoc(doc(db, 'drivers', user.uid), {
          activeVehicle: { id: docRef.id, ...vehicleData }
        }, { merge: true });
      }

      // Limpiar Formulario
      setNewBrand('');
      setNewPlate('');
      setNewColor('');
      setNewCategory('Standard');
      setShowAddVehicleForm(false);
      Alert.alert('Éxito', 'Vehículo registrado correctamente.');
    } catch {
      Alert.alert('Error', 'No se pudo guardar el vehículo.');
    } finally {
      setSavingVehicle(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string, isActive: boolean) => {
    if (isActive && vehicles.length > 1) {
      return Alert.alert('Operación no permitida', 'No podés eliminar el vehículo que tenés activo actualmente. Primero activa otro.');
    }

    Alert.alert('Eliminar vehículo', '¿Estás seguro de que deseas eliminar este vehículo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'drivers', user.uid, 'vehicles', vehicleId));
            // Si era el único, limpiar en perfil
            if (vehicles.length === 1) {
              await setDoc(doc(db, 'drivers', user.uid), {
                activeVehicle: null
              }, { merge: true });
            }
          } catch {
            Alert.alert('Error', 'No se pudo eliminar el vehículo.');
          }
        }
      }
    ]);
  };

  const activeVehicle = vehicles.find(v => v.active);
  const isTaxi = activeVehicle?.category === 'Taxi';

  const formatTaxiTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container} onTouchStart={() => setLastActiveTime(Date.now())}>
      {/* Mapa en tiempo real */}
      {loadingLocation ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Iniciando GPS...</Text>
        </View>
      ) : (
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={currentLocation}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {isOnline && currentLocation && (
            <Marker coordinate={currentLocation} title="Tu Ubicación Online">
              <View style={styles.markerOutline}>
                <View style={styles.markerInner} />
              </View>
            </Marker>
          )}
        </MapView>
      )}

      {/* Visor de recaudación del día en la parte superior */}
      <View style={[styles.topBar, { top: insets.top > 0 ? insets.top + 8 : 40 }]}>
        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={28} color={Colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.revenueCard}
          onPress={() => navigation.navigate('Wallet')}
        >
          <Text style={styles.revenueLabel}>Recaudación hoy</Text>
          <Text style={styles.revenueValue}>${todayEarnings.toLocaleString('es-AR')} ARS</Text>
        </TouchableOpacity>
      </View>

      {/* Panel Inferior Flotante */}
      <View style={styles.bottomCard}>
        {/* Switch de Online / Offline */}
        <View style={[styles.onlineRow, isOnline && styles.onlineRowActive]}>
          <Animated.View style={[styles.onlineIndicator, { transform: [{ scale: pulseAnim }], backgroundColor: isOnline ? Colors.online : Colors.offline }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.onlineTitle, isOnline && styles.onlineTitleActive]}>
              {isOnline ? '● En línea' : '○ Desconectado'}
            </Text>
            <Text style={styles.onlineSubtitle}>
              {isOnline ? 'Recibiendo solicitudes de viajes' : 'Conectate para empezar a facturar'}
            </Text>
          </View>
          <Switch
            value={isOnline}
            onValueChange={toggleOnline}
            trackColor={{ false: Colors.border, true: Colors.online + '60' }}
            thumbColor={isOnline ? Colors.online : Colors.textMuted}
            ios_backgroundColor={Colors.border}
          />
        </View>

        {/* Estadísticas en Tarjetas */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="car" size={20} color={Colors.primary} />
            <Text style={styles.statVal}>{todayTrips}</Text>
            <Text style={styles.statLabel}>Viajes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="star" size={20} color={Colors.accent} />
            <Text style={styles.statVal}>4.9</Text>
            <Text style={styles.statLabel}>Calificación</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="time" size={20} color="#8B5CF6" />
            <Text style={styles.statVal}>6.5h</Text>
            <Text style={styles.statLabel}>Activo</Text>
          </View>
        </View>

        {/* Botón Viaje Libre para Taxi */}
        {isTaxi && isOnline && (
          <TouchableOpacity 
            style={styles.taximeterBtn} 
            onPress={() => {
              setTaximeterStep('idle');
              setTaxiSeconds(0);
              setTaxiDistance(0.0);
              setTaxiFare(300.0);
              setTaximeterVisible(true);
            }}
          >
            <Ionicons name="calculator-outline" size={20} color={Colors.white} />
            <Text style={styles.taximeterBtnText}>Iniciar Viaje Libre (Taxímetro)</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* MODAL DE TAXÍMETRO (VIAJE LIBRE) */}
      <Modal
        visible={taximeterVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (taximeterStep !== 'running') {
            setTaximeterVisible(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="calculator" size={24} color={Colors.primary} />
              <Text style={styles.modalTitle}>Taxímetro Viaje Libre</Text>
            </View>

            {taximeterStep === 'idle' && (
              <View style={{ width: '100%', gap: 12, alignItems: 'center' }}>
                <Text style={styles.modalSubtitle}>Iniciá un viaje fuera de la plataforma calculando la tarifa según la ordenanza municipal vigente:</Text>
                
                <View style={styles.taxiRateBox}>
                  <View style={styles.taxiRateRow}>
                    <Text style={styles.taxiRateLabel}>Bajada de Bandera:</Text>
                    <Text style={styles.taxiRateValue}>$300.00 ARS</Text>
                  </View>
                  <View style={styles.taxiRateRow}>
                    <Text style={styles.taxiRateLabel}>Valor por Kilómetro:</Text>
                    <Text style={styles.taxiRateValue}>$180.00 ARS</Text>
                  </View>
                  <View style={styles.taxiRateRow}>
                    <Text style={styles.taxiRateLabel}>Valor por Minuto de Espera:</Text>
                    <Text style={styles.taxiRateValue}>$50.00 ARS</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.saveFormBtn, { width: '100%', backgroundColor: Colors.success, marginTop: 12 }]}
                  onPress={() => setTaximeterStep('running')}
                >
                  <Text style={styles.saveFormText}>Iniciar Viaje</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.cancelFormBtn, { width: '100%' }]}
                  onPress={() => setTaximeterVisible(false)}
                >
                  <Text style={styles.cancelFormText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            )}

            {taximeterStep === 'running' && (
              <View style={{ width: '100%', gap: 14, alignItems: 'center' }}>
                <View style={styles.taxiLiveDisplay}>
                  <Text style={styles.taxiLiveFare}>${taxiFare} ARS</Text>
                  <Text style={styles.taxiLiveFareLabel}>Tarifa Estimada</Text>
                </View>

                <View style={styles.taxiLiveStats}>
                  <View style={styles.taxiLiveStatItem}>
                    <Ionicons name="time-outline" size={20} color={Colors.primary} />
                    <Text style={styles.taxiLiveStatVal}>{formatTaxiTime(taxiSeconds)}</Text>
                    <Text style={styles.taxiLiveStatLabel}>Tiempo</Text>
                  </View>
                  <View style={styles.taxiLiveStatDivider} />
                  <View style={styles.taxiLiveStatItem}>
                    <Ionicons name="resize-outline" size={20} color={Colors.accent} />
                    <Text style={styles.taxiLiveStatVal}>{taxiDistance.toFixed(2)} km</Text>
                    <Text style={styles.taxiLiveStatLabel}>Distancia</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.saveFormBtn, { width: '100%', backgroundColor: Colors.danger, marginTop: 12 }]}
                  onPress={() => setTaximeterStep('summary')}
                >
                  <Text style={styles.saveFormText}>Finalizar Viaje</Text>
                </TouchableOpacity>
              </View>
            )}

            {taximeterStep === 'summary' && (
              <View style={{ width: '100%', gap: 12, alignItems: 'center' }}>
                <Text style={styles.modalSubtitle}>Detalle del viaje libre completado:</Text>

                <View style={styles.taxiRateBox}>
                  <View style={styles.taxiRateRow}>
                    <Text style={styles.taxiRateLabel}>Bajada de Bandera:</Text>
                    <Text style={styles.taxiRateValue}>$300 ARS</Text>
                  </View>
                  <View style={styles.taxiRateRow}>
                    <Text style={styles.taxiRateLabel}>Distancia ({taxiDistance.toFixed(2)} km):</Text>
                    <Text style={styles.taxiRateValue}>${Math.round(taxiDistance * 180)} ARS</Text>
                  </View>
                  <View style={styles.taxiRateRow}>
                    <Text style={styles.taxiRateLabel}>Tiempo ({formatTaxiTime(taxiSeconds)}):</Text>
                    <Text style={styles.taxiRateValue}>${Math.round((taxiSeconds / 60) * 50)} ARS</Text>
                  </View>
                  <View style={[styles.taxiRateRow, { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 6, marginTop: 4 }]}>
                    <Text style={[styles.taxiRateLabel, { fontFamily: 'Quicksand-Bold', color: Colors.textPrimary }]}>Total a Cobrar:</Text>
                    <Text style={[styles.taxiRateValue, { fontFamily: 'Quicksand-Bold', color: Colors.success, fontSize: 16 }]}>${taxiFare} ARS</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.saveFormBtn, { width: '100%', backgroundColor: Colors.primary, marginTop: 8 }]}
                  onPress={() => {
                    setTodayEarnings(prev => prev + taxiFare);
                    setTodayTrips(prev => prev + 1);
                    setTaximeterVisible(false);
                    setTaximeterStep('idle');
                    Alert.alert('Viaje Registrado', 'Los ingresos fueron sumados a tu recaudación diaria.');
                  }}
                >
                  <Text style={styles.saveFormText}>Cobrar en Efectivo y Cerrar</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.saveFormBtn, { width: '100%', backgroundColor: '#25D366' }]}
                  onPress={async () => {
                    try {
                      await Share.share({
                        message: `¡Hola! Gracias por viajar conmigo. Descargá la app del pasajero TravelApp, registrate usando mi código de referido CHOFER_${user.uid} y obtené un descuento de $${referralPassengerBonus} ARS en tu primer viaje: https://travelapp.ar/invite`
                      });
                    } catch (error) {
                      console.log("Error sharing referral:", error);
                    }
                  }}
                >
                  <Ionicons name="logo-whatsapp" size={16} color={Colors.white} style={{ marginRight: 6 }} />
                  <Text style={styles.saveFormText}>Enviar Invitación / Referido</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* MENÚ HAMBURGUESA LATERAL (DRAWER OVERLAY MODAL) */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.drawerOverlay}>
          <TouchableOpacity style={styles.drawerBackdrop} onPress={() => setMenuVisible(false)} />
          
          <Animated.View style={[styles.drawerView, { transform: [{ translateX: slideMenuAnim }] }]}>
            <View style={styles.drawerHeader}>
              <TravelCabLogo size={42} textColor={Colors.white} isAccentColor={false} />
              <View style={styles.drawerUserSection}>
                <View style={styles.drawerAvatar}>
                  <Text style={styles.drawerAvatarText}>
                    {(user.displayName || 'C')[0].toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.drawerUserName} numberOfLines={1}>{user.displayName || 'Conductor'}</Text>
                  <Text style={styles.drawerUserSub}>Socio Verificado</Text>
                </View>
              </View>
            </View>

            <ScrollView contentContainerStyle={styles.drawerMenuItems}>
              {[
                { label: 'Mi Perfil', icon: 'person-outline', action: () => handleMenuNavigation('Profile') },
                { label: 'Mis Vehículos', icon: 'car-sport-outline', action: () => { setMenuVisible(false); setVehicleModalVisible(true); } },
                { label: 'Mi Billetera', icon: 'wallet-outline', action: () => handleMenuNavigation('Wallet') },
                { label: 'Historial de viajes', icon: 'time-outline', action: () => handleMenuNavigation('History') },
                { label: 'Notificaciones', icon: 'notifications-outline', action: () => handleMenuNavigation('Notifications') },
                { label: 'Asistencia', icon: 'help-circle-outline', action: () => { setMenuVisible(false); setSupportModalVisible(true); } },
                { label: 'Información', icon: 'information-circle-outline', action: () => { setMenuVisible(false); setInfoModalVisible(true); } },
              ].map(item => (
                <TouchableOpacity key={item.label} style={styles.drawerItem} onPress={item.action}>
                  <Ionicons name={item.icon as any} size={22} color={Colors.primary} />
                  <Text style={styles.drawerItemLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.drawerFooter}>
              <TouchableOpacity style={styles.logoutBtn} onPress={() => { setMenuVisible(false); auth.signOut(); }}>
                <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
                <Text style={styles.logoutText}>Cerrar Sesión</Text>
              </TouchableOpacity>
              <Text style={styles.drawerVersion}>Versión 1.1</Text>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* MODAL DE ASISTENCIA */}
      <Modal
        visible={supportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSupportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
              <Text style={styles.modalTitle}>Centro de Asistencia</Text>
            </View>
            <Text style={styles.modalSubtitle}>¿En qué podemos ayudarte? Si tenés una emergencia presioná el Botón de Pánico.</Text>

            <TouchableOpacity 
              style={[styles.modalOption, styles.panicButton]} 
              onPress={() => handleSupportOption('emergency')}
            >
              <Ionicons name="call" size={22} color={Colors.white} />
              <Text style={styles.panicText}>Llamar al 911 (Botón de Pánico)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalOption} 
              onPress={() => handleSupportOption('whatsapp')}
            >
              <Ionicons name="logo-whatsapp" size={22} color={Colors.success} />
              <Text style={styles.optionText}>Soporte por WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalOption} 
              onPress={() => handleSupportOption('travis')}
            >
              <Ionicons name="chatbubble-ellipses" size={22} color={Colors.accent} />
              <Text style={styles.optionText}>Chatear con Travis (Asistente IA)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.closeModalBtn} 
              onPress={() => setSupportModalVisible(false)}
            >
              <Text style={styles.closeModalText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DE VEHÍCULOS (MIS VEHÍCULOS - MÁX 3) */}
      <Modal
        visible={vehicleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => { setVehicleModalVisible(false); setShowAddVehicleForm(false); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="car-sport" size={24} color={Colors.primary} />
              <Text style={styles.modalTitle}>Mis Vehículos ({vehicles.length}/3)</Text>
            </View>

            {!showAddVehicleForm ? (
              <ScrollView style={styles.vehicleListScroll} showsVerticalScrollIndicator={false}>
                {vehicles.map(v => (
                  <View key={v.id} style={[styles.vehicleItemCard, v.active && styles.activeVehicleCard]}>
                    <TouchableOpacity 
                      style={styles.vehicleSelectArea} 
                      onPress={() => handleSelectActiveVehicle(v.id)}
                    >
                      <Ionicons 
                        name={v.active ? "checkmark-circle" : "ellipse-outline"} 
                        size={22} 
                        color={v.active ? Colors.success : Colors.textMuted} 
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.vehicleItemTitle}>{v.brand}</Text>
                        <Text style={styles.vehicleItemMeta}>Patente: {v.plate} · Color: {v.color}</Text>
                        <Text style={[styles.vehicleItemCategory, { color: v.active ? Colors.success : Colors.primary }]}>{v.category}</Text>
                      </View>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.deleteVehicleBtn}
                      onPress={() => handleDeleteVehicle(v.id, v.active)}
                    >
                      <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                ))}

                {vehicles.length < 3 && (
                  <TouchableOpacity 
                    style={styles.addVehicleBtn}
                    onPress={() => setShowAddVehicleForm(true)}
                  >
                    <Ionicons name="add" size={20} color={Colors.white} />
                    <Text style={styles.addVehicleBtnText}>Registrar nuevo vehículo</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            ) : (
              <ScrollView style={styles.vehicleFormScroll}>
                <Text style={styles.formTitle}>Registrar nuevo vehículo</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Marca y Modelo</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Ej. Chevrolet Prisma"
                    value={newBrand}
                    onChangeText={setNewBrand}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Patente (Dominio)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Ej. AB123CD"
                    value={newPlate}
                    onChangeText={setNewPlate}
                    autoCapitalize="characters"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Color</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Ej. Blanco"
                    value={newColor}
                    onChangeText={setNewColor}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Categoría de Servicio</Text>
                  <View style={styles.categoryPicker}>
                    {['Standard', 'Premium', 'Taxi'].map(cat => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.categoryOpt, newCategory === cat && styles.categoryOptActive]}
                        onPress={() => setNewCategory(cat)}
                      >
                        <Text style={[styles.categoryOptText, newCategory === cat && styles.categoryOptTextActive]}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formButtons}>
                  <TouchableOpacity 
                    style={styles.cancelFormBtn}
                    onPress={() => setShowAddVehicleForm(false)}
                  >
                    <Text style={styles.cancelFormText}>Atrás</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.saveFormBtn}
                    onPress={handleAddVehicle}
                    disabled={savingVehicle}
                  >
                    {savingVehicle ? (
                      <ActivityIndicator color={Colors.white} size="small" />
                    ) : (
                      <Text style={styles.saveFormText}>Guardar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}

            <TouchableOpacity 
              style={styles.closeModalBtn} 
              onPress={() => { setVehicleModalVisible(false); setShowAddVehicleForm(false); }}
            >
              <Text style={styles.closeModalText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DE INFORMACIÓN */}
      <Modal
        visible={infoModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="information-circle" size={24} color={Colors.primary} />
              <Text style={styles.modalTitle}>Información de la App</Text>
            </View>
            
            <Text style={styles.infoText}>
              **TravelCab Conductor** es la plataforma de movilidad urbana del ecosistema **TravelApp**.
            </Text>

            <View style={styles.infoSpecs}>
              <Text style={styles.infoSpecItem}>• Versión del sistema: 1.1</Text>
              <Text style={styles.infoSpecItem}>• Motor de Mapas: Google Maps API</Text>
              <Text style={styles.infoSpecItem}>• Ecosistema: TravelApp Rewards & Experiences</Text>
            </View>

            <Text style={styles.copyrightLabel}>
              Todos los derechos reservados TravelApp s.a.s. - 2026
            </Text>

            <TouchableOpacity 
              style={styles.closeModalBtn} 
              onPress={() => setInfoModalVisible(false)}
            >
              <Text style={styles.closeModalText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DE VALIDACIÓN BIOMÉTRICA */}
      <Modal
        visible={showBiometricModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.biometricOverlay}>
          <View style={styles.biometricCard}>
            <View style={styles.biometricHeader}>
              <Ionicons name="shield-checkmark" size={40} color={Colors.primary} />
              <Text style={styles.biometricTitle}>Seguridad Requerida</Text>
              <Text style={styles.biometricDesc}>
                Por inactividad, por favor valida tu identidad para continuar en línea en el sistema.
              </Text>
            </View>

            <TouchableOpacity 
              style={[
                styles.biometricScanBtn, 
                biometricSuccess && styles.biometricScanBtnSuccess,
                isBiometricScanning && styles.biometricScanBtnScanning
              ]}
              onPress={handleTriggerBiometric}
              disabled={isBiometricScanning || biometricSuccess}
            >
              {isBiometricScanning ? (
                <View style={styles.scanningWrap}>
                  <ActivityIndicator size="large" color={Colors.white} />
                  <Text style={styles.scanningText}>Escaneando...</Text>
                </View>
              ) : biometricSuccess ? (
                <View style={styles.successWrap}>
                  <Ionicons name="checkmark-circle" size={54} color={Colors.white} />
                  <Text style={styles.successText}>Acceso Permitido</Text>
                </View>
              ) : (
                <View style={styles.startScanWrap}>
                  <Ionicons name="finger-print-outline" size={54} color={Colors.primary} />
                  <Text style={styles.startScanText}>Presiona para escanear</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.biometricFooterText}>
              Verificación configurada cada {biometricTimeoutMinutes} min.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontFamily: 'Quicksand-Medium', color: Colors.textSecondary },
  map: { flex: 1 },
  
  // Elementos superiores flotantes
  topBar: {
    position: 'absolute', top: 56, left: 16, right: 16,
    flexDirection: 'row', gap: 12, alignItems: 'center',
  },
  menuButton: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 5,
  },
  revenueCard: {
    flex: 1, height: 48, borderRadius: 24, backgroundColor: Colors.white,
    paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 5,
  },
  revenueLabel: { fontSize: 11, fontFamily: 'Quicksand-Bold', color: Colors.textSecondary },
  revenueValue: { fontSize: 14, fontFamily: 'Quicksand-Bold', color: Colors.primary },

  // Panel Inferior Flotante
  bottomCard: {
    position: 'absolute', bottom: 24, left: 16, right: 16,
    backgroundColor: Colors.white, borderRadius: 24, padding: 16, gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 6,
  },
  onlineRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 16, backgroundColor: Colors.background,
  },
  onlineRowActive: { backgroundColor: Colors.online + '08' },
  onlineIndicator: { width: 10, height: 10, borderRadius: 5 },
  onlineTitle: { fontSize: 15, fontFamily: 'Quicksand-Bold', color: Colors.textSecondary },
  onlineTitleActive: { color: Colors.online },
  onlineSubtitle: { fontSize: 11, fontFamily: 'Quicksand-Regular', color: Colors.textMuted, marginTop: 1 },

  // Estadísticas del día
  statsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 16, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  statLabel: { fontSize: 10, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary },
  statDivider: { width: 1, height: 28, backgroundColor: Colors.border },

  // Marcador de conductor en el mapa
  markerOutline: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.online + '25',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.online,
  },
  markerInner: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.online,
  },

  // MENÚ LATERAL DRAWER
  drawerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row' },
  drawerBackdrop: { flex: 1 },
  drawerView: {
    width: width * 0.75, height: '100%', backgroundColor: Colors.white,
    shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 12,
  },
  drawerHeader: {
    backgroundColor: Colors.primary, padding: 24, paddingTop: 64, gap: 16,
  },
  drawerUserSection: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  drawerAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  drawerAvatarText: { fontSize: 20, fontFamily: 'Quicksand-Bold', color: Colors.white },
  drawerUserName: { fontSize: 16, fontFamily: 'Quicksand-Bold', color: Colors.white },
  drawerUserSub: { fontSize: 11, fontFamily: 'Quicksand-Medium', color: 'rgba(255,255,255,0.6)' },
  drawerMenuItems: { padding: 16, gap: 4 },
  drawerItem: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12,
  },
  drawerItemLabel: { fontSize: 14, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  drawerFooter: { padding: 16, borderTopWidth: 1, borderTopColor: Colors.border, gap: 10 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10,
  },
  logoutText: { fontSize: 14, fontFamily: 'Quicksand-Bold', color: Colors.danger },
  drawerVersion: { fontSize: 11, fontFamily: 'Quicksand-Regular', color: Colors.textMuted, paddingLeft: 12 },

  // MODALES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: Colors.white, borderRadius: 24, padding: 24, gap: 14 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  modalTitle: { fontSize: 18, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  modalSubtitle: { fontSize: 12, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary, lineHeight: 18, marginBottom: 8 },
  modalOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.background, padding: 16, borderRadius: 14,
  },
  panicButton: { backgroundColor: Colors.danger },
  panicText: { color: Colors.white, fontSize: 14, fontFamily: 'Quicksand-Bold' },
  optionText: { fontSize: 14, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  closeModalBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 8 },
  closeModalText: { fontSize: 14, fontFamily: 'Quicksand-Bold', color: Colors.accent },

  // Vehículo Scroll & List
  vehicleListScroll: { maxHeight: height * 0.45 },
  vehicleItemCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderRadius: 16, backgroundColor: Colors.background,
    borderWidth: 1.5, borderColor: Colors.border, marginBottom: 10,
  },
  activeVehicleCard: { borderColor: Colors.success, backgroundColor: Colors.success + '05' },
  vehicleSelectArea: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  vehicleItemTitle: { fontSize: 15, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  vehicleItemMeta: { fontSize: 11, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary, marginTop: 2 },
  vehicleItemCategory: { fontSize: 11, fontFamily: 'Quicksand-Bold', marginTop: 2 },
  deleteVehicleBtn: { padding: 8 },
  addVehicleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 14, marginTop: 4,
  },
  addVehicleBtnText: { color: Colors.white, fontSize: 14, fontFamily: 'Quicksand-Bold' },

  // Vehículo Formulario
  vehicleFormScroll: { maxHeight: height * 0.5 },
  formTitle: { fontSize: 16, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary, marginBottom: 8 },
  inputGroup: { gap: 6, marginBottom: 12 },
  inputLabel: { fontSize: 12, fontFamily: 'Quicksand-Bold', color: Colors.textSecondary },
  formInput: {
    backgroundColor: Colors.background, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, fontFamily: 'Quicksand-Regular', color: Colors.textPrimary,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  categoryPicker: { flexDirection: 'row', gap: 8, marginTop: 2 },
  categoryOpt: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    paddingVertical: 10, alignItems: 'center', backgroundColor: Colors.white,
  },
  categoryOptActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '08' },
  categoryOptText: { fontSize: 13, fontFamily: 'Quicksand-Bold', color: Colors.textSecondary },
  categoryOptTextActive: { color: Colors.accent },
  formButtons: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelFormBtn: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  cancelFormText: { fontSize: 13, fontFamily: 'Quicksand-Bold', color: Colors.textSecondary },
  saveFormBtn: {
    flex: 2, backgroundColor: Colors.accent, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  saveFormText: { fontSize: 13, fontFamily: 'Quicksand-Bold', color: Colors.white },

  // Modal Info específico
  infoText: { fontSize: 13, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary, lineHeight: 20 },
  infoSpecs: { gap: 6, marginVertical: 8 },
  infoSpecItem: { fontSize: 12, fontFamily: 'Quicksand-Medium', color: Colors.textPrimary },
  copyrightLabel: { fontSize: 11, fontFamily: 'Quicksand-Regular', color: Colors.textMuted, textAlign: 'center', marginTop: 8 },

  // Validación Biométrica
  biometricOverlay: { flex: 1, backgroundColor: 'rgba(7,20,40,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  biometricCard: { width: '100%', maxWidth: 340, backgroundColor: Colors.white, borderRadius: 28, padding: 28, alignItems: 'center', gap: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 10 },
  biometricHeader: { alignItems: 'center', gap: 8, textAlign: 'center' },
  biometricTitle: { fontSize: 20, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary, marginTop: 4 },
  biometricDesc: { fontSize: 13, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary, textAlign: 'center', lineHeight: 18 },
  biometricScanBtn: { width: 140, height: 140, borderRadius: 70, borderStyle: 'dashed', borderWidth: 2, borderColor: Colors.primary, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  biometricScanBtnScanning: { borderStyle: 'solid', borderColor: Colors.accent, backgroundColor: Colors.accent },
  biometricScanBtnSuccess: { borderStyle: 'solid', borderColor: Colors.success, backgroundColor: Colors.success },
  scanningWrap: { alignItems: 'center', gap: 8 },
  scanningText: { color: Colors.white, fontSize: 12, fontFamily: 'Quicksand-Bold' },
  successWrap: { alignItems: 'center', gap: 6 },
  successText: { color: Colors.white, fontSize: 12, fontFamily: 'Quicksand-Bold' },
  startScanWrap: { alignItems: 'center', gap: 6 },
  startScanText: { color: Colors.primary, fontSize: 11, fontFamily: 'Quicksand-Bold' },
  biometricFooterText: { fontSize: 11, fontFamily: 'Quicksand-Medium', color: Colors.textMuted },
  
  // Taxímetro de viaje libre (Modo Taxi)
  taximeterBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#0A2A5B', paddingVertical: 14, borderRadius: 12, marginTop: 14,
    width: '100%',
  },
  taximeterBtnText: { color: Colors.white, fontSize: 13, fontFamily: 'Quicksand-Bold' },
  taxiRateBox: {
    width: '100%', backgroundColor: Colors.background, borderRadius: 16, padding: 16, gap: 10,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  taxiRateRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  taxiRateLabel: { fontSize: 12, fontFamily: 'Quicksand-Medium', color: Colors.textSecondary },
  taxiRateValue: { fontSize: 12, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  taxiLiveDisplay: {
    width: '100%', backgroundColor: '#071428', borderRadius: 20, paddingVertical: 28,
    alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 2, borderColor: Colors.primary,
  },
  taxiLiveFare: { fontSize: 38, fontWeight: '900', color: Colors.white, letterSpacing: 1 },
  taxiLiveFareLabel: { fontSize: 12, fontFamily: 'Quicksand-Bold', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' },
  taxiLiveStats: {
    flexDirection: 'row', width: '100%', paddingVertical: 12,
    backgroundColor: Colors.background, borderRadius: 16,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  taxiLiveStatItem: { flex: 1, alignItems: 'center', gap: 4 },
  taxiLiveStatVal: { fontSize: 16, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  taxiLiveStatLabel: { fontSize: 11, fontFamily: 'Quicksand-Medium', color: Colors.textSecondary },
  taxiLiveStatDivider: { width: 1.5, height: '80%', backgroundColor: Colors.border, alignSelf: 'center' },
});
