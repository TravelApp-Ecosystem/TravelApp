import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function WalletSupervisorScreen() {
  const [requested, setRequested] = useState(false);

  const wallet = {
    balance: 29700,
    companyFeeBase: 297000,
    history: [
      { id: 'LIQ-2026-07', period: 'Julio 2026', amount: 29700, status: 'Pagado', date: '2026-08-01' },
      { id: 'LIQ-2026-06', period: 'Junio 2026', amount: 24500, status: 'Pagado', date: '2026-07-01' },
    ]
  };

  const handleRequestPayout = () => {
    setRequested(true);
    Alert.alert(
      'Solicitud Enviada',
      'Tu solicitud de liquidación de haberes por $29.700 fue transmitida al área de Finanzas.'
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Liquidación & Retiro de Haberes</Text>
      <Text style={styles.headerSub}>Administración de sueldos y comisiones de supervisión</Text>

      {/* Balance Card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>COMISIÓN PENDIENTE DE LIQUIDACIÓN</Text>
        <Text style={styles.cardAmount}>${wallet.balance.toLocaleString('es-AR')}</Text>
        <Text style={styles.cardSub}>Calculado sobre Fee de Empresa acumulado ($297.000)</Text>

        <TouchableOpacity 
          disabled={requested}
          style={[styles.payoutBtn, { backgroundColor: requested ? '#334155' : '#10B981' }]}
          onPress={handleRequestPayout}
        >
          <Ionicons name="card-outline" size={18} color="#FFFFFF" />
          <Text style={styles.payoutBtnText}>
            {requested ? 'Solicitud en Proceso 🟡' : 'Solicitar Retiro / Transferencia'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* History */}
      <Text style={styles.sectionTitle}>Historial de Liquidaciones</Text>

      {wallet.history.map(item => (
        <View key={item.id} style={styles.historyCard}>
          <View>
            <Text style={styles.itemTitle}>{item.period}</Text>
            <Text style={styles.itemId}>{item.id} · {item.date}</Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.itemAmount}>${item.amount.toLocaleString('es-AR')}</Text>
            <Text style={styles.itemBadge}>🟢 {item.status}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 16 },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  headerSub: { color: '#94A3B8', fontSize: 12, marginBottom: 16 },
  card: { backgroundColor: '#1E293B', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#334155', marginBottom: 24 },
  cardLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '800' },
  cardAmount: { color: '#10B981', fontSize: 32, fontWeight: '900', marginVertical: 6 },
  cardSub: { color: '#CBD5E1', fontSize: 11, marginBottom: 16 },
  payoutBtn: { borderRadius: 14, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  payoutBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  sectionTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginBottom: 12 },
  historyCard: { backgroundColor: '#1E293B', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#334155', marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  itemId: { color: '#94A3B8', fontSize: 11, marginTop: 2 },
  itemAmount: { color: '#F1F5F9', fontSize: 15, fontWeight: '900' },
  itemBadge: { color: '#10B981', fontSize: 10, fontWeight: '800', marginTop: 2 },
});
