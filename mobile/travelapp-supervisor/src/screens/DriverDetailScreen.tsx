import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DriverDetailScreen({ route }: any) {
  const driver = route.params?.driver || {
    name: 'Carlos Mamani',
    id: 'DRV-001',
    vehicle: 'VW Gol Trend (AB 123 CD)',
    phone: '+54 381 445-1234',
    cashBalance: 42500,
    tripsMonth: 84,
  };

  const handleWhatsApp = () => {
    Linking.openURL(`https://wa.me/${driver.phone.replace(/[^0-9]/g, '')}?text=Hola%20${encodeURIComponent(driver.name)},%20te%20contacto%20desde%20Supervisión%20TravelApp.`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={32} color="#F59E0B" />
        </View>
        <Text style={styles.name}>{driver.name}</Text>
        <Text style={styles.sub}>{driver.id} · {driver.vehicle}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.wsBtn} onPress={handleWhatsApp}>
          <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
          <Text style={styles.wsBtnText}>Mensaje WhatsApp</Text>
        </TouchableOpacity>
      </View>

      {/* Financial Overview */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Estado Financiero del Chofer</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Saldo Recaudación / Billetera:</Text>
          <Text style={styles.rowValue}>${driver.cashBalance?.toLocaleString('es-AR')}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Viajes Concretados (Mes):</Text>
          <Text style={styles.rowValue}>{driver.tripsMonth} viajes</Text>
        </View>
      </View>

      {/* Vehicle Info */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Vehículo & Licencia</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Móvil Registrado:</Text>
          <Text style={styles.rowValue}>{driver.vehicle}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Licencia SUTRAPPA:</Text>
          <Text style={[styles.rowValue, { color: '#10B981' }]}>Activa 🟢</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 20 },
  profileHeader: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(245, 158, 11, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  name: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  sub: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  wsBtn: { flex: 1, backgroundColor: '#25D366', borderRadius: 14, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  wsBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  sectionCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155', marginBottom: 16 },
  sectionTitle: { color: '#F59E0B', fontSize: 13, fontWeight: '800', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155' },
  rowLabel: { color: '#94A3B8', fontSize: 12 },
  rowValue: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
