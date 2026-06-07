import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { db } from '../lib/firebase';
import { Colors } from '../lib/constants';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  searching: { label: 'Buscando conductor...', color: Colors.accent, icon: 'search' },
  accepted: { label: 'Conductor asignado', color: Colors.primary, icon: 'checkmark-circle' },
  on_way: { label: 'Conductor en camino', color: Colors.primary, icon: 'car' },
  arrived: { label: 'Conductor llegó', color: Colors.success, icon: 'location' },
  in_progress: { label: 'Viaje en curso', color: Colors.primary, icon: 'navigate' },
  completed: { label: 'Viaje completado ✓', color: Colors.success, icon: 'checkmark-done' },
  cancelled: { label: 'Viaje cancelado', color: Colors.danger, icon: 'close-circle' },
};

export default function TripTrackingScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { tripId } = route.params;
  const [trip, setTrip] = useState<any>(null);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'trips', tripId), (snap) => {
      setTrip({ id: snap.id, ...snap.data() });
    });
    // Pulso animado
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
    return unsub;
  }, [tripId]);

  const handleCancel = async () => {
    await updateDoc(doc(db, 'trips', tripId), { status: 'cancelled' });
    navigation.navigate('Home');
  };

  if (!trip) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );

  const statusInfo = STATUS_CONFIG[trip.status] || STATUS_CONFIG.searching;
  const isCompleted = trip.status === 'completed' || trip.status === 'cancelled';

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: -31.4167, longitude: -64.1833,
          latitudeDelta: 0.05, longitudeDelta: 0.05,
        }}
        showsUserLocation>
        {trip.driverLocation && (
          <Marker coordinate={trip.driverLocation} title="Tu conductor">
            <View style={styles.driverMarker}>
              <Ionicons name="car" size={18} color={Colors.white} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Header */}
      <View style={styles.header}>
        {isCompleted && (
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Seguimiento de viaje</Text>
      </View>

      {/* Panel de estado */}
      <View style={styles.panel}>
        {/* Status */}
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '18' }]}>
          {trip.status === 'searching' ? (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Ionicons name={statusInfo.icon as any} size={20} color={statusInfo.color} />
            </Animated.View>
          ) : (
            <Ionicons name={statusInfo.icon as any} size={20} color={statusInfo.color} />
          )}
          <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
        </View>

        {/* Info del viaje */}
        <View style={styles.tripInfo}>
          <View style={styles.tripRow}>
            <View style={styles.dotGreen} />
            <Text style={styles.tripText} numberOfLines={1}>{trip.origin || 'Ubicación actual'}</Text>
          </View>
          <View style={styles.tripLine} />
          <View style={styles.tripRow}>
            <View style={styles.dotRed} />
            <Text style={styles.tripText} numberOfLines={1}>{trip.destination}</Text>
          </View>
        </View>

        {/* Info del conductor (si hay) */}
        {trip.driverName && (
          <View style={styles.driverInfo}>
            <View style={styles.driverAvatar}>
              <Ionicons name="person" size={24} color={Colors.white} />
            </View>
            <View>
              <Text style={styles.driverName}>{trip.driverName}</Text>
              <Text style={styles.driverSub}>{trip.vehiclePlate || 'Conductor asignado'}</Text>
            </View>
            <TouchableOpacity style={styles.callBtn}>
              <Ionicons name="call" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Precio */}
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Precio estimado</Text>
          <Text style={styles.price}>${trip.estimatedPrice} ARS</Text>
        </View>

        {/* Botones */}
        {!isCompleted && trip.status === 'searching' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancelar viaje</Text>
          </TouchableOpacity>
        )}
        {isCompleted && (
          <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.homeBtnText}>Volver al inicio</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  driverMarker: {
    backgroundColor: Colors.primary, width: 36, height: 36,
    borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.white,
  },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: Colors.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, elevation: 4,
  },
  backBtn: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  panel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 44, gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, elevation: 10,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12,
    borderRadius: 12, alignSelf: 'flex-start',
  },
  statusText: { fontSize: 14, fontWeight: '700' },
  tripInfo: { backgroundColor: Colors.background, borderRadius: 14, padding: 14, gap: 8 },
  tripRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.success },
  dotRed: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.danger },
  tripLine: { width: 1, height: 16, backgroundColor: Colors.border, marginLeft: 4 },
  tripText: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  driverInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.background, borderRadius: 14, padding: 14,
  },
  driverAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  driverName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  driverSub: { fontSize: 12, color: Colors.textSecondary },
  callBtn: {
    marginLeft: 'auto', width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center',
  },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 14, color: Colors.textSecondary },
  price: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  cancelBtn: {
    borderWidth: 1.5, borderColor: Colors.danger, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  cancelText: { color: Colors.danger, fontWeight: '700', fontSize: 15 },
  homeBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  homeBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});
