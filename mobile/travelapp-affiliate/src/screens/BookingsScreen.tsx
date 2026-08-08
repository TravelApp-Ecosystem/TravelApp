import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

export default function BookingsScreen() {
  const bookings = [
    {
      id: 'RES-901',
      experienceTitle: 'Excursión Valles Calchaquíes & Bodegas',
      customerName: 'Santiago Rossi',
      totalAmount: 120000,
      installmentsCount: 3,
      paidInstallments: 2,
      commissionPerInstallment: 2000,
      totalCommissionEarned: 4000,
    },
    {
      id: 'RES-902',
      experienceTitle: 'Trekking & Canopy San Javier',
      customerName: 'Laura Benítez',
      totalAmount: 60000,
      installmentsCount: 2,
      paidInstallments: 2,
      commissionPerInstallment: 1500,
      totalCommissionEarned: 3000,
    },
    {
      id: 'RES-903',
      experienceTitle: 'City Tour Histórico & Gastronómico',
      customerName: 'Esteban Paz',
      totalAmount: 90000,
      installmentsCount: 3,
      paidInstallments: 1,
      commissionPerInstallment: 1500,
      totalCommissionEarned: 1500,
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Reservas & Split por Cuota</Text>
      <Text style={styles.headerSub}>Desglose de comisiones ganadas por cuota cobrada</Text>

      <FlatList
        data={bookings}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.expTitle}>{item.experienceTitle}</Text>
            <Text style={styles.client}>{item.id} · Cliente: {item.customerName}</Text>

            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.label}>Monto Total Reserva:</Text>
              <Text style={styles.val}>${item.totalAmount.toLocaleString('es-AR')}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Cuotas Pagadas:</Text>
              <Text style={styles.badge}>{item.paidInstallments} de {item.installmentsCount} cuotas</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Tu Comisión por Cuota (5%):</Text>
              <Text style={styles.val}>+${item.commissionPerInstallment.toLocaleString('es-AR')}</Text>
            </View>

            <View style={[styles.row, { marginTop: 6 }]}>
              <Text style={styles.totalLabel}>GANANCIA ACREDITADA:</Text>
              <Text style={styles.totalVal}>+${item.totalCommissionEarned.toLocaleString('es-AR')}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 16 },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  headerSub: { color: '#94A3B8', fontSize: 12, marginBottom: 16 },
  list: { paddingBottom: 20 },
  card: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  expTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  client: { color: '#94A3B8', fontSize: 11, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#334155', marginVertical: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label: { color: '#94A3B8', fontSize: 12 },
  val: { color: '#F1F5F9', fontSize: 12, fontWeight: '700' },
  badge: { color: '#A855F7', fontSize: 11, fontWeight: '800', backgroundColor: 'rgba(168, 85, 247, 0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  totalLabel: { color: '#10B981', fontSize: 12, fontWeight: '900' },
  totalVal: { color: '#10B981', fontSize: 15, fontWeight: '900' },
});
