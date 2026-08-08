import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DocumentAlertsScreen() {
  const alerts = [
    {
      id: 'ALT-101',
      driverName: 'Mariano Silva',
      documentType: 'Seguro Comercial Automotor',
      expiryDate: '2026-08-10',
      daysLeft: 2,
      status: 'critical', // 🔴
    },
    {
      id: 'ALT-102',
      driverName: 'Esteban Morales',
      documentType: 'Licencia Municipal SUTRAPPA',
      expiryDate: '2026-08-18',
      daysLeft: 10,
      status: 'warning', // 🟡
    },
    {
      id: 'ALT-103',
      driverName: 'Carlos Mamani',
      documentType: 'Revisión Técnica Obligatoria (RTO)',
      expiryDate: '2026-08-22',
      daysLeft: 14,
      status: 'warning', // 🟡
    },
    {
      id: 'ALT-104',
      driverName: 'Valeria Luna',
      documentType: 'Licencia Nacional de Conducir',
      expiryDate: '2026-11-05',
      daysLeft: 89,
      status: 'ok', // 🟢
    },
  ];

  const handleNotify = (driverName: string, docType: string) => {
    Alert.alert(
      'Notificación Enviada',
      `Se envió un recordatorio de renovación de ${docType} al conductor ${driverName}.`
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Semáforo Preventivo de Documentación</Text>
      <Text style={styles.headerSub}>Control de seguros, licencias y habilitaciones de la flota</Text>

      <FlatList
        data={alerts}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isCritical = item.status === 'critical';
          const isWarning = item.status === 'warning';
          const color = isCritical ? '#EF4444' : isWarning ? '#F59E0B' : '#10B981';

          return (
            <View style={[styles.card, { borderColor: color }]}>
              <View style={styles.cardHeader}>
                <View style={styles.statusIndicator}>
                  <View style={[styles.dot, { backgroundColor: color }]} />
                  <Text style={[styles.statusTag, { color }]}>
                    {isCritical ? '🔴 Vence Próximamente (Urgente)' : isWarning ? '🟡 Vence en menos de 15 días' : '🟢 Al día'}
                  </Text>
                </View>
                <Text style={styles.daysText}>{item.daysLeft} días restantes</Text>
              </View>

              <Text style={styles.driverName}>{item.driverName}</Text>
              <Text style={styles.docType}>{item.documentType}</Text>
              <Text style={styles.expiry}>Vencimiento: {item.expiryDate}</Text>

              <TouchableOpacity 
                style={[styles.notifyBtn, { backgroundColor: isCritical ? '#EF4444' : '#334155' }]}
                onPress={() => handleNotify(item.driverName, item.documentType)}
              >
                <Ionicons name="notifications-outline" size={16} color="#FFFFFF" />
                <Text style={styles.notifyBtnText}>Enviar Recordatorio</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 16 },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  headerSub: { color: '#94A3B8', fontSize: 12, marginBottom: 16 },
  list: { paddingBottom: 20 },
  card: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusTag: { fontSize: 11, fontWeight: '800' },
  daysText: { color: '#94A3B8', fontSize: 11, fontWeight: '700' },
  driverName: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  docType: { color: '#F59E0B', fontSize: 12, fontWeight: '700', marginTop: 2 },
  expiry: { color: '#64748B', fontSize: 11, marginTop: 4, marginBottom: 12 },
  notifyBtn: { borderRadius: 12, paddingVertical: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  notifyBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
});
