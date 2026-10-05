import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, orderBy, addDoc, serverTimestamp, onSnapshot, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { subscribeToRealFleet } from '../lib/supervisorService';

interface AnnouncementItem {
  id: string;
  text: string;
  date: string;
  author: string;
}

export default function MessagingScreen({ route, navigation }: any) {
  const [broadcastText, setBroadcastText] = useState('');
  const [sending, setSending] = useState(false);
  const [totalDrivers, setTotalDrivers] = useState(route.params?.totalDrivers || 0);
  const [history, setHistory] = useState<AnnouncementItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Escuchar total de choferes en tiempo real
  useEffect(() => {
    const uid = auth.currentUser?.uid || '';
    const unsub = subscribeToRealFleet(uid, (drivers) => {
      setTotalDrivers(drivers.length);
    });

    return () => unsub();
  }, []);

  // Escuchar comunicados reales en Firestore
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setLoadingHistory(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'fleet_announcements'),
        where('supervisorId', '==', uid)
      );

      const unsub = onSnapshot(
        q,
        (snap) => {
          const list: AnnouncementItem[] = [];
          snap.forEach((docSnap) => {
            const data = docSnap.data();
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
            const dateStr = createdAt.toLocaleDateString('es-AR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            });

            list.push({
              id: docSnap.id,
              text: data.text || '',
              date: dateStr,
              author: data.supervisorName || 'Supervisor',
            });
          });

          setHistory(list);
          setLoadingHistory(false);
        },
        (err) => {
          console.warn('Error escuchando fleet_announcements:', err);
          setHistory([]);
          setLoadingHistory(false);
        }
      );

      return () => unsub();
    } catch (e) {
      console.warn('Catch announcements listener:', e);
      setLoadingHistory(false);
    }
  }, []);

  const handleSendBroadcast = async () => {
    const trimmed = broadcastText.trim();
    if (!trimmed) {
      return Alert.alert('Mensaje Vacío', 'Por favor ingresá el texto del comunicado para tu flota.');
    }

    const uid = auth.currentUser?.uid;
    if (!uid) return;

    setSending(true);
    try {
      await addDoc(collection(db, 'fleet_announcements'), {
        text: trimmed,
        supervisorId: uid,
        supervisorEmail: auth.currentUser?.email || '',
        supervisorName: auth.currentUser?.displayName || 'Supervisor',
        createdAt: serverTimestamp(),
        targetFleet: 'all',
      });

      Alert.alert(
        'Comunicado Enviado',
        totalDrivers > 0
          ? `El comunicado fue transmitido a los ${totalDrivers} choferes registrados en tu flota.`
          : 'El comunicado fue publicado en el sistema para cuando tus choferes se conecten.'
      );
      setBroadcastText('');
    } catch (err) {
      console.warn('Error enviando broadcast:', err);
      Alert.alert('Error', 'No se pudo enviar el comunicado. Verificá tu conexión.');
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Navigation */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Centro de Mensajería & Avisos</Text>
      </View>

      <Text style={styles.headerSub}>Transmite comunicados o alertas en tiempo real a tu flota</Text>

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

        <TouchableOpacity
          style={[styles.sendBtn, { opacity: sending ? 0.7 : 1 }]}
          onPress={handleSendBroadcast}
          disabled={sending}
          activeOpacity={0.85}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="paper-plane-outline" size={16} color="#FFFFFF" />
              <Text style={styles.sendBtnText}>
                Enviar a {totalDrivers > 0 ? `${totalDrivers} Choferes` : 'la Flota'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* History (100% Real) */}
      <Text style={styles.sectionTitle}>Historial de Avisos Emitidos</Text>

      {loadingHistory ? (
        <ActivityIndicator size="small" color="#A855F7" style={{ marginVertical: 20 }} />
      ) : history.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="chatbubble-ellipses-outline" size={32} color="#64748B" />
          <Text style={styles.emptyTitle}>Sin comunicados emitidos</Text>
          <Text style={styles.emptySub}>
            Los avisos masivos que envíes a tu flota quedarán registrados cronológicamente aquí.
          </Text>
        </View>
      ) : (
        history.map((item) => (
          <View key={item.id} style={styles.historyCard}>
            <Text style={styles.historyDate}>{item.date}</Text>
            <Text style={styles.historyText}>{item.text}</Text>
            <Text style={styles.historyBadge}>Emitido por {item.author} 🟢</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 16 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    paddingTop: 8,
  },
  backBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#1E293B',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  headerSub: { color: '#94A3B8', fontSize: 12, marginBottom: 16, marginTop: 4 },
  card: { backgroundColor: '#1E293B', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#334155', marginBottom: 24 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  textArea: { backgroundColor: '#0F172A', borderRadius: 12, padding: 12, color: '#FFFFFF', fontSize: 13, minHeight: 90, textAlignVertical: 'top', borderWidth: 1, borderColor: '#334155', marginBottom: 14 },
  sendBtn: { backgroundColor: '#A855F7', borderRadius: 12, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  sendBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  sectionTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginBottom: 12 },
  emptyCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', marginTop: 8 },
  emptySub: { color: '#94A3B8', fontSize: 12, textAlign: 'center', marginTop: 4, lineHeight: 18 },
  historyCard: { backgroundColor: '#1E293B', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#334155', marginBottom: 10 },
  historyDate: { color: '#94A3B8', fontSize: 10, fontWeight: '700', marginBottom: 4 },
  historyText: { color: '#E2E8F0', fontSize: 12, marginBottom: 6, lineHeight: 18 },
  historyBadge: { color: '#10B981', fontSize: 10, fontWeight: '800' },
});
