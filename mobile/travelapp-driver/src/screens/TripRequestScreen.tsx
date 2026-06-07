import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { db, auth } from '../lib/firebase';
import { Colors } from '../lib/constants';

export default function TripRequestScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { trip } = route.params;
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true }).start();
  }, []);

  const handleAccept = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser!;
      await updateDoc(doc(db, 'trips', trip.id), {
        status: 'accepted',
        driverId: user.uid,
        driverName: user.displayName || 'Conductor',
        acceptedAt: Timestamp.now(),
      });
      navigation.navigate('ActiveTrip', { tripId: trip.id });
    } catch {
      Alert.alert('Error', 'No se pudo aceptar el viaje. Intentá nuevamente.');
      setLoading(false);
    }
  };

  const handleReject = async () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Fondo oscurecido */}
      <TouchableOpacity style={styles.backdrop} onPress={handleReject} />

      {/* Panel */}
      <Animated.View
        style={[
          styles.panel,
          { transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [500, 0] }) }] },
        ]}>
        {/* Header */}
        <View style={styles.panelHeader}>
          <View style={styles.pingDot} />
          <Text style={styles.panelTitle}>Nueva solicitud de viaje</Text>
        </View>

        {/* Precio destacado */}
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Ganancia estimada</Text>
          <Text style={styles.price}>${trip.estimatedPrice} ARS</Text>
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
          <View>
            <Text style={styles.passengerName}>{trip.userName || 'Pasajero'}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={Colors.accent} />
              <Text style={styles.ratingText}>4.8 · {trip.serviceType || 'TravelCab'}</Text>
            </View>
          </View>
        </View>

        {/* Botones */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.rejectBtn} onPress={handleReject}>
            <Ionicons name="close" size={24} color={Colors.danger} />
            <Text style={styles.rejectText}>Rechazar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark" size={24} color={Colors.white} />
                <Text style={styles.acceptText}>Aceptar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.6)' },
  panel: {
    backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 44, gap: 16,
  },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pingDot: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.success,
  },
  panelTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  priceContainer: {
    backgroundColor: Colors.primary + '0F', borderRadius: 16,
    padding: 20, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.primary + '30',
  },
  priceLabel: { fontSize: 13, color: Colors.primary, marginBottom: 4 },
  price: { fontSize: 36, fontWeight: '900', color: Colors.primary },
  routeCard: {
    backgroundColor: Colors.background, borderRadius: 16, padding: 16, gap: 4,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  dotGreen: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.success },
  dotRed: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.danger },
  routeDash: { width: 1, height: 16, backgroundColor: Colors.border, marginLeft: 5 },
  routeLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  routeText: { fontSize: 14, color: Colors.textPrimary, fontWeight: '600' },
  passengerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.background, borderRadius: 14, padding: 14,
  },
  passengerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  passengerName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontSize: 13, color: Colors.textSecondary },
  buttonsRow: { flexDirection: 'row', gap: 12 },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 16,
    borderWidth: 2, borderColor: Colors.danger,
  },
  rejectText: { color: Colors.danger, fontSize: 16, fontWeight: '700' },
  acceptBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16,
  },
  acceptText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
