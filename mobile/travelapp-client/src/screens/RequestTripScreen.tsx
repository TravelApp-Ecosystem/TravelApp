import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Colors } from '../lib/constants';

const SERVICES = [
  { id: 'travelcab', label: 'TravelCab', icon: 'car', desc: 'Viaje estándar', basePrice: 800 },
  { id: 'travelcab_plus', label: 'TravelCab Plus', icon: 'car-sport', desc: 'Mayor comodidad', basePrice: 1200 },
  { id: 'travelcab_xl', label: 'TravelCab XL', icon: 'bus', desc: 'Vehículo grande', basePrice: 1500 },
];

export default function RequestTripScreen() {
  const navigation = useNavigation<any>();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedService, setSelectedService] = useState('travelcab');
  const [loading, setLoading] = useState(false);

  const selected = SERVICES.find(s => s.id === selectedService)!;

  const handleRequest = async () => {
    if (!origin || !destination) {
      return Alert.alert('Campos requeridos', 'Ingresá origen y destino.');
    }
    setLoading(true);
    try {
      const user = auth.currentUser!;
      const docRef = await addDoc(collection(db, 'trips'), {
        userId: user.uid,
        userName: user.displayName || user.email,
        origin,
        destination,
        serviceType: selectedService,
        estimatedPrice: selected.basePrice,
        status: 'searching',
        channel: 'app_client',
        createdAt: Timestamp.now(),
      });
      navigation.navigate('TripTracking', { tripId: docRef.id });
    } catch (err) {
      Alert.alert('Error', 'No se pudo crear el viaje. Intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Solicitar viaje</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Origen / Destino */}
        <View style={styles.card}>
          <View style={styles.locationRow}>
            <View style={styles.dotGreen} />
            <TextInput
              style={styles.locationInput}
              placeholder="Desde... (tu ubicación actual)"
              placeholderTextColor={Colors.textMuted}
              value={origin}
              onChangeText={setOrigin}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.locationRow}>
            <View style={styles.dotRed} />
            <TextInput
              style={styles.locationInput}
              placeholder="¿A dónde vas?"
              placeholderTextColor={Colors.textMuted}
              value={destination}
              onChangeText={setDestination}
            />
          </View>
        </View>

        {/* Tipo de servicio */}
        <Text style={styles.sectionTitle}>Tipo de servicio</Text>
        {SERVICES.map(service => (
          <TouchableOpacity
            key={service.id}
            style={[styles.serviceCard, selectedService === service.id && styles.serviceCardSelected]}
            onPress={() => setSelectedService(service.id)}>
            <View style={[styles.serviceIcon, { backgroundColor: selectedService === service.id ? Colors.primary : Colors.background }]}>
              <Ionicons name={service.icon as any} size={24} color={selectedService === service.id ? Colors.white : Colors.textSecondary} />
            </View>
            <View style={styles.serviceInfo}>
              <Text style={[styles.serviceLabel, selectedService === service.id && styles.serviceTextActive]}>
                {service.label}
              </Text>
              <Text style={styles.serviceDesc}>{service.desc}</Text>
            </View>
            <Text style={[styles.servicePrice, selectedService === service.id && styles.serviceTextActive]}>
              ${service.basePrice}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Resumen */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Servicio</Text>
            <Text style={styles.summaryValue}>{selected.label}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Precio estimado</Text>
            <Text style={[styles.summaryValue, { color: Colors.primary, fontWeight: '700' }]}>
              ${selected.basePrice} ARS
            </Text>
          </View>
          <Text style={styles.summaryNote}>* El precio puede variar según la distancia y disponibilidad</Text>
        </View>

        {/* Botón */}
        <TouchableOpacity style={styles.button} onPress={handleRequest} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Ionicons name="car" size={20} color={Colors.white} />
              <Text style={styles.buttonText}>Buscar conductor</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: Colors.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, elevation: 3,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, elevation: 2,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  dotGreen: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.success },
  dotRed: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.danger },
  locationInput: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  serviceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: 14, padding: 16,
    borderWidth: 2, borderColor: Colors.border,
  },
  serviceCardSelected: { borderColor: Colors.primary },
  serviceIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  serviceInfo: { flex: 1 },
  serviceLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  serviceDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  servicePrice: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  serviceTextActive: { color: Colors.primary },
  summaryCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, elevation: 2,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { color: Colors.textSecondary, fontSize: 14 },
  summaryValue: { fontSize: 14, color: Colors.textPrimary },
  summaryNote: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  button: {
    backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  buttonText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
});
