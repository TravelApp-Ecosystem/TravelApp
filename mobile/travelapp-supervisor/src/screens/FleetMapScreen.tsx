import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FleetMapView, FleetVehicle } from '../components/FleetMapView';

// Fallback flota base de supervisión (San Miguel de Tucumán y Gran Tucumán)
const INITIAL_FLEET: FleetVehicle[] = [
  {
    id: 'DRV-001',
    name: 'Carlos Mamani',
    vehicle: 'VW Gol Trend (AB 123 CD)',
    plate: 'AB 123 CD',
    status: 'Activo',
    phone: '+54 381 445-1234',
    speed: 32,
    location: { latitude: -26.8285, longitude: -65.2050 }, // Plaza Independencia
    heading: 90,
    lastUpdate: 'Hace 1 min',
  },
  {
    id: 'DRV-003',
    name: 'Jorge Ruiz',
    vehicle: 'Toyota Corolla (GH 789 IJ)',
    plate: 'GH 789 IJ',
    status: 'Activo',
    phone: '+54 381 556-7890',
    speed: 45,
    location: { latitude: -26.8150, longitude: -65.2180 }, // Av. Sarmiento / Urquiza
    heading: 180,
    lastUpdate: 'Hace 30 seg',
  },
  {
    id: 'DRV-005',
    name: 'Mariano Silva',
    vehicle: 'Fiat Cronos (AB 456 EF)',
    plate: 'AB 456 EF',
    status: 'Activo',
    phone: '+54 381 667-8901',
    speed: 28,
    location: { latitude: -26.8360, longitude: -65.2020 }, // Terminal de Ómnibus
    heading: 45,
    lastUpdate: 'Hace 2 min',
  },
  {
    id: 'DRV-007',
    name: 'Valeria Luna',
    vehicle: 'Chevrolet Onix (DC 789 GH)',
    plate: 'DC 789 GH',
    status: 'En Ruta',
    phone: '+54 381 778-9012',
    speed: 55,
    location: { latitude: -26.8190, longitude: -65.2850 }, // Yerba Buena / Av. Aconquija
    heading: 270,
    lastUpdate: 'En vivo',
  },
  {
    id: 'DRV-009',
    name: 'Esteban Morales',
    vehicle: 'Renault Logan (AE 112 KL)',
    plate: 'AE 112 KL',
    status: 'Inactivo',
    phone: '+54 381 889-0123',
    speed: 0,
    location: { latitude: -26.8450, longitude: -65.2200 }, // Barrio Sur
    heading: 0,
    lastUpdate: 'Hace 25 min',
  },
];

export default function FleetMapScreen({ route, navigation }: any) {
  const initialSelectedId = route.params?.driverId || null;
  const [fleet, setFleet] = useState<FleetVehicle[]>(INITIAL_FLEET);
  const [selectedDriver, setSelectedDriver] = useState<FleetVehicle | null>(null);
  const [filter, setFilter] = useState<'all' | 'Activo' | 'En Ruta' | 'Inactivo'>('all');
  const [loading, setLoading] = useState(false);

  // Escuchar conductores reales en Firestore en tiempo real
  useEffect(() => {
    let unsub = () => {};
    try {
      unsub = onSnapshot(
        collection(db, 'drivers'),
        (snapshot) => {
          if (!snapshot.empty) {
            const liveDrivers: FleetVehicle[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              if (data.location && typeof data.location.latitude === 'number') {
                liveDrivers.push({
                  id: docSnap.id,
                  name: data.name || data.displayName || 'Chofer Flota',
                  vehicle: data.vehicleModel || data.vehicle || 'Vehículo Registrado',
                  plate: data.licensePlate || data.plate || '',
                  status: data.isOnline ? (data.currentTripId ? 'En Ruta' : 'Activo') : 'Inactivo',
                  phone: data.phone || data.phoneNumber || '',
                  speed: data.speed ?? (data.isOnline ? 30 : 0),
                  location: {
                    latitude: data.location.latitude,
                    longitude: data.location.longitude,
                  },
                  heading: data.heading ?? 0,
                  lastUpdate: 'En vivo',
                });
              }
            });

            if (liveDrivers.length > 0) {
              // Combinar conductores en vivo con la flota base si son pocos
              const combined = [...liveDrivers];
              INITIAL_FLEET.forEach((baseDrv) => {
                if (!combined.some((c) => c.id === baseDrv.id)) {
                  combined.push(baseDrv);
                }
              });
              setFleet(combined);
            }
          }
        },
        (err) => {
          console.warn('Firestore live drivers listener note:', err);
        }
      );
    } catch (e) {
      console.warn('Live drivers snapshot catch:', e);
    }

    return () => unsub();
  }, []);

  // Si se pasó un driver específico por parámetros al abrir el mapa
  useEffect(() => {
    if (initialSelectedId) {
      const found = fleet.find((d) => d.id === initialSelectedId);
      if (found) setSelectedDriver(found);
    }
  }, [initialSelectedId, fleet]);

  const filteredDrivers = fleet.filter((d) => {
    if (filter === 'all') return true;
    return d.status === filter;
  });

  const activeCount = fleet.filter((d) => d.status === 'Activo').length;
  const enRutaCount = fleet.filter((d) => d.status === 'En Ruta').length;
  const inactivoCount = fleet.filter((d) => d.status === 'Inactivo').length;

  const handleWhatsApp = (driver: FleetVehicle) => {
    if (!driver.phone) return;
    const cleanPhone = driver.phone.replace(/[^0-9]/g, '');
    Linking.openURL(
      `https://wa.me/${cleanPhone}?text=Hola%20${encodeURIComponent(
        driver.name
      )},%20te%20contacto%20desde%20Supervisión%20TravelApp%20sobre%20tu%20móvil%20(${encodeURIComponent(
        driver.vehicle
      )}).`
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Geolocalización de Flota</Text>
          <View style={styles.liveBadgeRow}>
            <View style={styles.liveDot} />
            <Text style={styles.headerSub}>
              {activeCount + enRutaCount} móviles conectados en tiempo real
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => setSelectedDriver(null)}
          activeOpacity={0.7}
        >
          <Ionicons name="scan-outline" size={20} color="#38BDF8" />
        </TouchableOpacity>
      </View>

      {/* Filter Chips Bar */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              Todos ({fleet.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'Activo' && styles.filterChipActive]}
            onPress={() => setFilter('Activo')}
          >
            <Text style={[styles.filterText, filter === 'Activo' && styles.filterTextActive]}>
              🟢 Disponibles ({activeCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'En Ruta' && styles.filterChipActive]}
            onPress={() => setFilter('En Ruta')}
          >
            <Text style={[styles.filterText, filter === 'En Ruta' && styles.filterTextActive]}>
              🟡 En Viaje ({enRutaCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'Inactivo' && styles.filterChipActive]}
            onPress={() => setFilter('Inactivo')}
          >
            <Text style={[styles.filterText, filter === 'Inactivo' && styles.filterTextActive]}>
              ⚪ Inactivos ({inactivoCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <FleetMapView
          drivers={filteredDrivers}
          selectedDriverId={selectedDriver?.id}
          onSelectDriver={(d) => setSelectedDriver(d)}
          centerCoords={selectedDriver ? selectedDriver.location : null}
        />
      </View>

      {/* Floating Selected Driver Card */}
      {selectedDriver && (
        <View style={styles.driverCard}>
          <View style={styles.driverCardHeader}>
            <View style={styles.driverAvatar}>
              <Ionicons name="car-sport" size={24} color="#38BDF8" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.driverName}>{selectedDriver.name}</Text>
              <Text style={styles.driverVehicle}>{selectedDriver.vehicle}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedDriver(null)}
              style={styles.closeCardBtn}
            >
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Quick Metrics */}
          <View style={styles.cardMetricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>ESTADO</Text>
              <Text
                style={[
                  styles.metricValue,
                  {
                    color:
                      selectedDriver.status === 'En Ruta'
                        ? '#F59E0B'
                        : selectedDriver.status === 'Activo'
                        ? '#10B981'
                        : '#94A3B8',
                  },
                ]}
              >
                {selectedDriver.status}
              </Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>VELOCIDAD</Text>
              <Text style={styles.metricValue}>{selectedDriver.speed} km/h</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>ACTUALIZACIÓN</Text>
              <Text style={styles.metricValue}>{selectedDriver.lastUpdate || 'En vivo'}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.btnWhatsApp}
              onPress={() => handleWhatsApp(selectedDriver)}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
              <Text style={styles.btnActionText}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnDetail}
              onPress={() => {
                navigation.navigate('DriverDetail', { driver: selectedDriver });
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="person-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.btnActionText}>Ver Ficha Completa</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  headerSub: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBar: {
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterChipActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  filterText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  mapContainer: {
    flex: 1,
  },
  driverCard: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  driverCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  driverVehicle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  closeCardBtn: {
    padding: 6,
  },
  cardMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 10,
    marginVertical: 12,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    backgroundColor: '#334155',
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
  },
  metricValue: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnWhatsApp: {
    flex: 1,
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnDetail: {
    flex: 1.2,
    backgroundColor: '#38BDF8',
    borderRadius: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
