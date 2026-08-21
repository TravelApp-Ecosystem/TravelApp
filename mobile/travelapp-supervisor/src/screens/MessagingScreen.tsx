import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MessagingScreen() {
  const [broadcastText, setBroadcastText] = useState('');

  const handleSendBroadcast = () => {
    if (!broadcastText.trim()) return;
    Alert.alert(
      'Comunicado Enviado',
      `El comunicado fue transmitido a los 12 choferes de tu flota.`
    );
    setBroadcastText('');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Centro de Mensajería & Avisos</Text>
      <Text style={styles.headerSub}>Transmite comunicados o alertas masivas a tu flota</Text>

      {/* Broadcast Box */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="radio-outline" size={20} color="#A855F7" />
          <Text style={styles.cardTitle}>Comunicado Broadcast a toda la Flota</Text>
        </View>

        <TextInput
          multiline
          numberOfLines={4}
          placeholder="Escribí un aviso masivo para todos tus choferes..."
          placeholderTextColor="#64748B"
          value={broadcastText}
          onChangeText={setBroadcastText}
          style={styles.textArea}
        />

        <TouchableOpacity style={styles.sendBtn} onPress={handleSendBroadcast}>
          <Ionicons name="paper-plane-outline" size={16} color="#FFFFFF" />
          <Text style={styles.sendBtnText}>Enviar Comunicado Masivo</Text>
        </TouchableOpacity>
      </View>

      {/* History */}
      <Text style={styles.sectionTitle}>Historial de Avisos</Text>

      <View style={styles.historyCard}>
        <Text style={styles.historyDate}>Hoy · 09:30 AM</Text>
        <Text style={styles.historyText}>Recordatorio: Mantener encendido el GPS en zonas de alta demanda (Terminal y Centro).</Text>
        <Text style={styles.historyBadge}>Enviado a 12 choferes 🟢</Text>
      </View>

      <View style={styles.historyCard}>
        <Text style={styles.historyDate}>Ayer · 16:45 PM</Text>
        <Text style={styles.historyText}>Atención: Tránsito demorado en Av. Mate de Luna por obras públicas.</Text>
        <Text style={styles.historyBadge}>Enviado a 12 choferes 🟢</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 16 },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  headerSub: { color: '#94A3B8', fontSize: 12, marginBottom: 16 },
  card: { backgroundColor: '#1E293B', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#334155', marginBottom: 24 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  textArea: { backgroundColor: '#0F172A', borderRadius: 12, padding: 12, color: '#FFFFFF', fontSize: 13, minHeight: 90, textAlignVertical: 'top', borderWidth: 1, borderColor: '#334155', marginBottom: 14 },
  sendBtn: { backgroundColor: '#A855F7', borderRadius: 12, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  sendBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  sectionTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginBottom: 12 },
  historyCard: { backgroundColor: '#1E293B', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#334155', marginBottom: 10 },
  historyDate: { color: '#94A3B8', fontSize: 10, fontWeight: '700', marginBottom: 4 },
  historyText: { color: '#E2E8F0', fontSize: 12, marginBottom: 6 },
  historyBadge: { color: '#10B981', fontSize: 10, fontWeight: '800' },
});
