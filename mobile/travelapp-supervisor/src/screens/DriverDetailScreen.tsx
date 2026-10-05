import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DriverItem } from '../lib/supervisorService';

export default function DriverDetailScreen({ route, navigation }: any) {
  const driver: DriverItem | null = route.params?.driver || null;

  if (!driver) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginTop: 12 }}>
          Conductor no encontrado
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Volver a la lista</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleWhatsApp = () => {
    if (!driver.phone) return;
    const cleanPhone = driver.phone.replace(/[^0-9]/g, '');
    Linking.openURL(
      `https://wa.me/${cleanPhone}?text=Hola%20${encodeURIComponent(
        driver.name
      )},%20te%20contacto%20desde%20Supervisión%20TravelApp.`
    );
  };

  const handleCall = () => {
    if (!driver.phone) return;
    Linking.openURL(`tel:${driver.phone}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        <Text style={styles.backButtonText}>Volver</Text>
      </TouchableOpacity>

      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={32} color="#F59E0B" />
        </View>
        <Text style={styles.name}>{driver.name}</Text>
        <Text style={styles.sub}>
          {driver.id.slice(0, 8)} · {driver.vehicle}
        </Text>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor:
                driver.status === 'Inactivo'
                  ? 'rgba(239, 68, 68, 0.15)'
                  : driver.status === 'En Ruta'
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(16, 185, 129, 0.15)',
            },
          ]}
        >
          <Text
            style={[
              styles.statusPillText,
              {
                color:
                  driver.status === 'Inactivo'
                    ? '#EF4444'
                    : driver.status === 'En Ruta'
                    ? '#F59E0B'
                    : '#10B981',
              },
            ]}
          >
            ● {driver.status}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.wsBtn, { opacity: driver.phone ? 1 : 0.4 }]}
          onPress={handleWhatsApp}
          disabled={!driver.phone}
        >
          <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
          <Text style={styles.wsBtnText}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.callBtn, { opacity: driver.phone ? 1 : 0.4 }]}
          onPress={handleCall}
          disabled={!driver.phone}
        >
          <Ionicons name="call-outline" size={18} color="#FFFFFF" />
          <Text style={styles.callBtnText}>Llamar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mapBtn}
          onPress={() => navigation.navigate('FleetMap', { driverId: driver.id })}
        >
          <Ionicons name="map-outline" size={18} color="#0F172A" />
          <Text style={styles.mapBtnText}>Ver en Mapa</Text>
        </TouchableOpacity>
      </View>

      {/* Financial Overview (Real) */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Estado Financiero del Chofer</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Saldo Recaudación / Billetera:</Text>
          <Text style={styles.rowValue}>${(driver.cashBalance || 0).toLocaleString('es-AR')}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Viajes Concretados (Mes):</Text>
          <Text style={styles.rowValue}>{driver.tripsMonth || 0} viajes</Text>
        </View>
      </View>

      {/* Vehicle Info */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Vehículo & Registro</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Móvil Registrado:</Text>
          <Text style={styles.rowValue}>{driver.vehicle}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Patente:</Text>
          <Text style={styles.rowValue}>{driver.plate || 'No especificada'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Teléfono:</Text>
          <Text style={styles.rowValue}>{driver.phone || 'No registrado'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Conexión en Vivo:</Text>
          <Text style={[styles.rowValue, { color: driver.isOnline ? '#10B981' : '#64748B' }]}>
            {driver.isOnline ? 'Conectado / En Línea' : 'Desconectado'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 20 },
  profileHeader: { alignItems: 'center', marginBottom: 20 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  name: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  sub: { color: '#94A3B8', fontSize: 12, marginTop: 2, marginBottom: 8 },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  wsBtn: {
    flex: 1,
    backgroundColor: '#25D366',
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  wsBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  callBtn: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  callBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  mapBtn: {
    flex: 1.2,
    backgroundColor: '#38BDF8',
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  mapBtnText: { color: '#0F172A', fontWeight: '800', fontSize: 12 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  sectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  sectionTitle: { color: '#F59E0B', fontSize: 13, fontWeight: '800', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  rowLabel: { color: '#94A3B8', fontSize: 12 },
  rowValue: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
