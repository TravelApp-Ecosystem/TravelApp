import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot, updateDoc, Timestamp } from 'firebase/firestore';
import * as Location from 'expo-location';
import { useNavigation, useRoute } from '@react-navigation/native';
import { db, auth } from '../lib/firebase';
import { Colors } from '../lib/constants';

const STEPS = [
  { status: 'on_way', label: 'En camino al pasajero', action: 'Llegué al punto de encuentro', next: 'arrived' },
  { status: 'arrived', label: 'En punto de encuentro', action: 'Iniciar viaje', next: 'in_progress' },
  { status: 'in_progress', label: 'Viaje en curso', action: 'Completar viaje', next: 'completed' },
];

export default function ActiveTripScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { tripId } = route.params;
  const [trip, setTrip] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'trips', tripId), snap => {
      const data: any = { id: snap.id, ...snap.data() };
      setTrip(data);
      if (data.status === 'completed' || data.status === 'cancelled') {
        Alert.alert('Viaje finalizado', `Ganancia: $${data.estimatedPrice} ARS`, [
          { text: 'Ver resumen', onPress: () => navigation.navigate('Dashboard') },
        ]);
      }
    });

    // Si el viaje acaba de ser aceptado, iniciar en estado on_way
    updateDoc(doc(db, 'trips', tripId), { status: 'on_way' });

    // Tracking de ubicación
    const trackLocation = async () => {
      const loc = await Location.getCurrentPositionAsync({});
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setDriverLocation(coords);
      await updateDoc(doc(db, 'trips', tripId), { driverLocation: coords });
    };
    trackLocation();
    const interval = setInterval(trackLocation, 8000);

    return () => { unsub(); clearInterval(interval); };
  }, [tripId]);

  const advanceStep = async () => {
    const currentStep = STEPS.find(s => s.status === trip?.status);
    if (!currentStep) return;
    setLoading(true);
    try {
      const update: any = { status: currentStep.next };
      if (currentStep.next === 'completed') {
        update.completedAt = Timestamp.now();
        update.finalPrice = trip.estimatedPrice;
      }
      await updateDoc(doc(db, 'trips', tripId), update);
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el estado. Intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!trip) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );

  const currentStep = STEPS.find(s => s.status === trip.status);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: driverLocation?.latitude ?? -31.4167,
          longitude: driverLocation?.longitude ?? -64.1833,
          latitudeDelta: 0.03, longitudeDelta: 0.03,
        }}
        showsUserLocation>
        {driverLocation && (
          <Marker coordinate={driverLocation} title="Tu posición">
            <View style={styles.driverMarker}>
              <Ionicons name="car" size={18} color={Colors.white} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.statusDot, { backgroundColor: Colors.success }]} />
        <Text style={styles.headerTitle}>{currentStep?.label || 'Viaje activo'}</Text>
      </View>

      {/* Panel inferior */}
      <View style={styles.panel}>
        {/* Pasajero */}
        <View style={styles.passengerRow}>
          <View style={styles.passengerAvatar}>
            <Ionicons name="person" size={22} color={Colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.passengerName}>{trip.userName || 'Pasajero'}</Text>
            <Text style={styles.passengerDest} numberOfLines={1}>📍 {trip.destination}</Text>
          </View>
          <TouchableOpacity style={styles.callBtn}>
            <Ionicons name="call" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Progreso */}
        <View style={styles.stepsRow}>
          {STEPS.map((step, i) => {
            const isDone = STEPS.indexOf(STEPS.find(s => s.status === trip.status)!) > i;
            const isCurrent = step.status === trip.status;
            return (
              <React.Fragment key={step.status}>
                <View style={[styles.stepDot,
                  isDone && styles.stepDotDone,
                  isCurrent && styles.stepDotCurrent,
                ]} />
                {i < STEPS.length - 1 && (
                  <View style={[styles.stepLine, isDone && styles.stepLineDone]} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* Ganancia */}
        <View style={styles.earningsRow}>
          <Text style={styles.earningsLabel}>Ganancia del viaje</Text>
          <Text style={styles.earnings}>${trip.estimatedPrice} ARS</Text>
        </View>

        {/* Botón de avance */}
        {currentStep && (
          <TouchableOpacity
            style={[styles.actionBtn, currentStep.next === 'completed' && styles.actionBtnComplete]}
            onPress={advanceStep}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons
                  name={currentStep.next === 'completed' ? 'checkmark-done' : 'arrow-forward'}
                  size={20} color={Colors.white} />
                <Text style={styles.actionBtnText}>{currentStep.action}</Text>
              </>
            )}
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
    backgroundColor: Colors.primary, width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.white,
  },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: Colors.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, elevation: 4,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  headerTitle: { fontSize: 16, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  panel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 44, gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, elevation: 10,
  },
  passengerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  passengerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  passengerName: { fontSize: 15, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  passengerDest: { fontSize: 12, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary, marginTop: 2 },
  callBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center',
  },
  stepsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  stepDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.border },
  stepDotDone: { backgroundColor: Colors.success },
  stepDotCurrent: { backgroundColor: Colors.primary, width: 18, height: 18, borderRadius: 9 },
  stepLine: { flex: 1, height: 3, backgroundColor: Colors.border },
  stepLineDone: { backgroundColor: Colors.success },
  earningsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  earningsLabel: { fontSize: 14, fontFamily: 'Quicksand-Medium', color: Colors.textSecondary },
  earnings: { fontSize: 22, fontFamily: 'Quicksand-Bold', color: Colors.primary },
  actionBtn: {
    backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  actionBtnComplete: { backgroundColor: Colors.success },
  actionBtnText: { color: Colors.white, fontSize: 16, fontFamily: 'Quicksand-Bold' },
});
