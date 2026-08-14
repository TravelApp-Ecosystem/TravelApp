import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Alert, ActivityIndicator, Vibration, Dimensions
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { db, auth } from '../lib/firebase';
import { Colors, API_BASE_URL } from '../lib/constants';

const { width } = Dimensions.get('window');

export default function TripRequestScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { trip } = route.params;
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Calcular ETA estimado en tiempo (Minutos de viaje para recoger al pasajero)
  const pickupEtaMinutes = trip?.pickupEtaMinutes || Math.max(3, Math.round((trip?.distanceToPassengerKm || 2.4) * 1.6));

  // Coordenadas Origen (Pasajero) y Destino
  const originCoords = trip?.originCoords || { latitude: -26.82414, longitude: -65.22260 };
  const destinationCoords = trip?.destinationCoords || { latitude: -26.83500, longitude: -65.23000 };

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true }).start();

    // Reproducir patrón de vibración táctil sin depender de módulos nativos inestables
    try {
      Vibration.vibrate([0, 600, 250, 600, 250, 600], true);
    } catch (e) {
      console.warn('Vibration error:', e);
    }

    return () => {
      Vibration.cancel();
    };
  }, []);

  const stopAlerts = () => {
    Vibration.cancel();
  };

  const handleAccept = async () => {
    stopAlerts();
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const driverRef = doc(db, 'drivers', user.uid);
      const driverSnap = await getDoc(driverRef);
      const driverData = driverSnap.data();

      const driverName = driverData?.name || user.displayName || (user.email ? user.email.split('@')[0] : 'Socio Conductor');
      const driverPhone = driverData?.phone || '+5491100000000';
      const driverRating = driverData?.rating || 5.0;
      const vehicleModel = driverData?.activeVehicle?.brand || 'Fiat Cronos (Gris Plata)';
      const vehiclePlate = driverData?.activeVehicle?.plate || 'AF 123 JK';
      const driverProfilePhoto = driverData?.photoUrl || undefined;
      const driverCarPhoto = driverData?.activeVehicle?.photoUrl || undefined;

      const isMercadoPago = trip?.paymentMethod === 'Mercado Pago';
      if (isMercadoPago) {
        let paymentSuccess = false;
        let payData: any = null;

        const endpoints = [`${API_BASE_URL}/api/checkout/process-debit`];

        for (const url of endpoints) {
          try {
            const payResponse = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tripId: trip.id,
                passengerId: trip.passengerId,
                driverId: user.uid,
                amount: trip.estimatedPrice
              })
            });
            if (payResponse.ok) {
              payData = await payResponse.json();
              if (payData && payData.success) {
                paymentSuccess = true;
                break;
              }
            }
          } catch (e) {
            console.log(`Failed to connect to ${url}`);
          }
        }

        if (paymentSuccess) {
          await updateDoc(doc(db, 'trips', trip.id), {
            status: 'accepted',
            driverId: user.uid,
            driverName,
            driverPhone,
            driverRating,
            vehicleModel,
            vehiclePlate,
            driverProfilePhoto,
            driverCarPhoto,
            acceptedAt: Timestamp.now(),
            paymentStatus: 'paid',
            paymentId: payData?.paymentId
          });
          navigation.navigate('ActiveTrip', { tripId: trip.id });
        } else {
          Alert.alert(
            'Cobro Rechazado',
            'No se pudo debitar el saldo de Mercado Pago del pasajero. El viaje se cambió a cobro en EFECTIVO.',
            [{ text: 'Entendido', onPress: async () => {
              await updateDoc(doc(db, 'trips', trip.id), {
                status: 'accepted',
                driverId: user.uid,
                driverName,
                driverPhone,
                driverRating,
                vehicleModel,
                vehiclePlate,
                driverProfilePhoto,
                driverCarPhoto,
                acceptedAt: Timestamp.now(),
                paymentMethod: 'Efectivo',
                paymentStatus: 'pending'
              });
              navigation.navigate('ActiveTrip', { tripId: trip.id });
            }}]
          );
        }
      } else {
        await updateDoc(doc(db, 'trips', trip.id), {
          status: 'accepted',
          driverId: user.uid,
          driverName,
          driverPhone,
          driverRating,
          vehicleModel,
          vehiclePlate,
          driverProfilePhoto,
          driverCarPhoto,
          acceptedAt: Timestamp.now(),
        });
        navigation.navigate('ActiveTrip', { tripId: trip.id });
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo aceptar el viaje. Intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    stopAlerts();
    try {
      const user = auth.currentUser;
      if (user && trip?.id) {
        const { arrayUnion } = await import('firebase/firestore');
        await updateDoc(doc(db, 'trips', trip.id), {
          status: 'cancelled',
          rejectedBy: arrayUnion(user.uid),
          cancelledReason: 'Rechazado por el conductor',
          updatedAt: Timestamp.now()
        });
      }
    } catch (e) {
      console.warn('Error rejecting trip in Firestore:', e);
    } finally {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backdrop} onPress={handleReject} />

      <Animated.View
        style={[
          styles.panel,
          { transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }) }] },
        ]}>
        
        {/* Header */}
        <View style={styles.panelHeader}>
          <View style={styles.pingDot} />
          <Text style={styles.panelTitle}>Nueva solicitud de viaje</Text>
          <View style={styles.payBadge}>
            <Ionicons
              name={trip.paymentMethod === 'Efectivo' ? 'cash' : 'card'}
              size={14}
              color={trip.paymentMethod === 'Efectivo' ? '#15803D' : Colors.primary}
            />
            <Text style={[styles.payBadgeText, { color: trip.paymentMethod === 'Efectivo' ? '#15803D' : Colors.primary }]}>
              {trip.paymentMethod || 'Efectivo'}
            </Text>
          </View>
        </View>

        {/* Badge de ETA en Tiempo (Minutos para buscar al pasajero) */}
        <View style={styles.etaBadgeBox}>
          <Ionicons name="time" size={16} color="#0284C7" />
          <Text style={styles.etaBadgeText}>
            ⏱️ <Text style={styles.etaBold}>{pickupEtaMinutes} min</Text> para llegar a buscar al pasajero
          </Text>
        </View>

        {/* Mapa Interactivo con Origen y Destino */}
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: (originCoords.latitude + destinationCoords.latitude) / 2,
              longitude: (originCoords.longitude + destinationCoords.longitude) / 2,
              latitudeDelta: Math.abs(originCoords.latitude - destinationCoords.latitude) * 1.6 || 0.03,
              longitudeDelta: Math.abs(originCoords.longitude - destinationCoords.longitude) * 1.6 || 0.03,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker
              coordinate={originCoords}
              title={`Origen: ${trip.origin || 'Pasajero'}`}
              pinColor="#10B981"
            />
            <Marker
              coordinate={destinationCoords}
              title={`Destino: ${trip.destination || 'Destino'}`}
              pinColor="#EF4444"
            />
            <Polyline
              coordinates={[originCoords, destinationCoords]}
              strokeColor="#FF6B00"
              strokeWidth={4}
            />
          </MapView>
        </View>

        {/* Ganancia Estimada */}
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Ganancia estimada</Text>
          <Text style={styles.price}>${trip.estimatedPrice || trip.price || 0} ARS</Text>
          {trip.bonusIncentive ? (
            <View style={styles.bonusBanner}>
              <Ionicons name="flash" size={14} color="#92400E" />
              <Text style={styles.bonusBannerText}>¡Incluye +${trip.bonusIncentive} ARS de incentivo prioritario!</Text>
            </View>
          ) : null}
        </View>

        {/* Ruta */}
        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={styles.dotGreen} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>Origen</Text>
              <Text style={styles.routeText}>{trip.origin || 'Ubicación del pasajero'}</Text>
            </View>
          </View>
          <View style={styles.routeDash} />
          <View style={styles.routeRow}>
            <View style={styles.dotRed} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>Destino</Text>
              <Text style={styles.routeText}>{trip.destination}</Text>
            </View>
          </View>
        </View>

        {/* Info del pasajero */}
        <View style={styles.passengerCard}>
          <View style={styles.passengerAvatar}>
            <Ionicons name="person" size={22} color={Colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.passengerName}>{trip.userName || 'Pasajero'}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={Colors.accent} />
              <Text style={styles.ratingText}>4.9 · {trip.serviceType || 'TravelCab'}</Text>
            </View>
          </View>
        </View>

        {/* Acciones */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.rejectBtn} onPress={handleReject}>
            <Text style={styles.rejectBtnText}>Rechazar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.acceptBtnText}>Aceptar Viaje 🚕</Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  panel: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    gap: 12,
    maxHeight: '92%',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
  },
  panelTitle: {
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
    color: Colors.textPrimary,
    flex: 1,
    marginLeft: 8,
  },
  payBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  payBadgeText: {
    fontSize: 11,
    fontFamily: 'Quicksand-Bold',
  },
  etaBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  etaBadgeText: {
    fontSize: 12,
    fontFamily: 'Quicksand-Medium',
    color: '#0369A1',
  },
  etaBold: {
    fontFamily: 'Quicksand-Bold',
    color: '#0284C7',
  },
  mapContainer: {
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  priceContainer: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  priceLabel: {
    fontSize: 11,
    fontFamily: 'Quicksand-Medium',
    color: Colors.textMuted,
  },
  price: {
    fontSize: 26,
    fontFamily: 'Quicksand-Bold',
    color: Colors.primary,
  },
  bonusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 4,
  },
  bonusBannerText: {
    fontSize: 11,
    fontFamily: 'Quicksand-Bold',
    color: '#92400E',
  },
  routeCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dotGreen: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
  },
  dotRed: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.danger,
  },
  routeDash: {
    width: 2,
    height: 12,
    backgroundColor: '#CBD5E1',
    marginLeft: 4,
    marginVertical: 2,
  },
  routeLabel: {
    fontSize: 10,
    fontFamily: 'Quicksand-Bold',
    color: Colors.textMuted,
  },
  routeText: {
    fontSize: 12,
    fontFamily: 'Quicksand-Bold',
    color: Colors.textPrimary,
  },
  passengerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  passengerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerName: {
    fontSize: 13,
    fontFamily: 'Quicksand-Bold',
    color: Colors.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    fontFamily: 'Quicksand-Medium',
    color: Colors.textMuted,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  rejectBtnText: {
    fontSize: 14,
    fontFamily: 'Quicksand-Bold',
    color: Colors.textSecondary,
  },
  acceptBtn: {
    flex: 2,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptBtnText: {
    fontSize: 14,
    fontFamily: 'Quicksand-Bold',
    color: Colors.white,
  },
});
