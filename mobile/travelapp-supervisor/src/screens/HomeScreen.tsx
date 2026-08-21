import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }: any) {
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const supervisor = {
    name: 'Fernando Gómez',
    referralCode: 'FERNANDO-CAB',
    totalRecruited: 12,
    activeDriversToday: 9,
    fleetRevenueMonth: 1485000,
    companyFee: 297000,
    supervisorCommission: 29700,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.badge}>SUPERVISOR DE FLOTA</Text>
          <Text style={styles.greeting}>Hola, {supervisor.name}</Text>
          <Text style={styles.subgreeting}>Control y liquidación de choferes a cargo</Text>
        </View>
        <TouchableOpacity style={styles.qrButton} onPress={() => setQrModalOpen(true)}>
          <Ionicons name="qr-code-outline" size={24} color="#F59E0B" />
        </TouchableOpacity>
      </View>

      {/* KPI Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>MI COMISIÓN ACUMULADA (MES)</Text>
        <Text style={styles.balanceAmount}>${supervisor.supervisorCommission.toLocaleString('es-AR')}</Text>
        <Text style={styles.balanceDetail}>10% del Fee Empresa (${supervisor.companyFee.toLocaleString('es-AR')})</Text>

        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Wallet')}
        >
          <Text style={styles.actionBtnText}>Solicitar Retiro de Haberes</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={styles.grid}>
        <View style={styles.card}>
          <Ionicons name="car-sport-outline" size={22} color="#10B981" />
          <Text style={styles.cardValue}>{supervisor.activeDriversToday} / {supervisor.totalRecruited}</Text>
          <Text style={styles.cardLabel}>Activos Hoy</Text>
        </View>

        <View style={styles.card}>
          <Ionicons name="cash-outline" size={22} color="#3B82F6" />
          <Text style={styles.cardValue}>${(supervisor.fleetRevenueMonth / 1000).toFixed(0)}k</Text>
          <Text style={styles.cardLabel}>Recaudación Mes</Text>
        </View>
      </View>

      {/* Action Quick Links */}
      <Text style={styles.sectionTitle}>Gestión Rápida</Text>

      <TouchableOpacity 
        style={styles.menuRow}
        onPress={() => navigation.navigate('DriversList')}
      >
        <View style={styles.menuIconContainer}>
          <Ionicons name="people-outline" size={22} color="#3B82F6" />
        </View>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuTitle}>Conductores a Cargo</Text>
          <Text style={styles.menuSubtitle}>Ver choferes, saldos y viajes realizados</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#64748B" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.menuRow}
        onPress={() => navigation.navigate('DocumentAlerts')}
      >
        <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
          <Ionicons name="alert-circle-outline" size={22} color="#F59E0B" />
        </View>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuTitle}>Semáforo de Vencimientos</Text>
          <Text style={styles.menuSubtitle}>Control de licencias, seguros y RTO</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#64748B" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.menuRow}
        onPress={() => navigation.navigate('Messaging')}
      >
        <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
          <Ionicons name="chatbubbles-outline" size={22} color="#A855F7" />
        </View>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuTitle}>Centro de Mensajería</Text>
          <Text style={styles.menuSubtitle}>Enviar avisos broadcast o chat directo</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#64748B" />
      </TouchableOpacity>

      {/* QR Invitation Modal */}
      <Modal visible={qrModalOpen} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>QR de Alta de Conductor</Text>
            <Text style={styles.modalSub}>Los choferes que escaneen este código quedarán automáticamente asignados a tu supervisión.</Text>

            <View style={styles.qrContainer}>
              <Ionicons name="qr-code" size={180} color="#0F172A" />
            </View>

            <Text style={styles.codeText}>CÓDIGO: {supervisor.referralCode}</Text>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setQrModalOpen(false)}>
              <Text style={styles.closeBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  badge: { color: '#F59E0B', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 2 },
  greeting: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  subgreeting: { color: '#94A3B8', fontSize: 12 },
  qrButton: { backgroundColor: '#1E293B', padding: 12, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  balanceCard: { backgroundColor: '#1E293B', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#334155', marginBottom: 20 },
  balanceLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '800' },
  balanceAmount: { color: '#F59E0B', fontSize: 32, fontWeight: '900', marginVertical: 4 },
  balanceDetail: { color: '#CBD5E1', fontSize: 12, marginBottom: 16 },
  actionBtn: { backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  actionBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  grid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  card: { flex: 1, backgroundColor: '#1E293B', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155' },
  cardValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', marginTop: 8 },
  cardLabel: { color: '#94A3B8', fontSize: 11 },
  sectionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginBottom: 12 },
  menuRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  menuIconContainer: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(59, 130, 246, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuTextContainer: { flex: 1 },
  menuTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  menuSubtitle: { color: '#94A3B8', fontSize: 11 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: '#1E293B', borderRadius: 24, padding: 24, width: '100%', alignItems: 'center' },
  modalTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', marginBottom: 6 },
  modalSub: { color: '#94A3B8', fontSize: 12, textAlign: 'center', marginBottom: 16 },
  qrContainer: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20, marginBottom: 16 },
  codeText: { color: '#F59E0B', fontWeight: '900', fontSize: 14, letterSpacing: 1, marginBottom: 20 },
  closeBtn: { backgroundColor: '#334155', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12 },
  closeBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
});
