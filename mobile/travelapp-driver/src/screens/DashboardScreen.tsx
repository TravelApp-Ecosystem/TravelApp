import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch,
  ScrollView, Animated, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, setDoc, onSnapshot, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { db, auth } from '../lib/firebase';
import { Colors } from '../lib/constants';

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const [isOnline, setIsOnline] = useState(false);
  const [todayTrips, setTodayTrips] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [pendingTrip, setPendingTrip] = useState<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const locationInterval = useRef<any>(null);

  const user = auth.currentUser!;

  // Pulso animado cuando está online
  useEffect(() => {
    if (isOnline) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isOnline]);

  // Escuchar viajes pendientes cuando está online
  useEffect(() => {
    if (!isOnline) { setPendingTrip(null); return; }
    const q = query(collection(db, 'trips'), where('status', '==', 'searching'));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const trip = { id: snap.docs[0].id, ...snap.docs[0].data() };
        setPendingTrip(trip);
        navigation.navigate('TripRequest', { trip });
      }
    });
    return unsub;
  }, [isOnline]);

  // Enviar ubicación periódicamente cuando está online
  useEffect(() => {
    if (isOnline) {
      locationInterval.current = setInterval(async () => {
        const loc = await Location.getCurrentPositionAsync({});
        await setDoc(doc(db, 'drivers', user.uid), {
          isOnline: true,
          location: { latitude: loc.coords.latitude, longitude: loc.coords.longitude },
          updatedAt: Timestamp.now(),
          name: user.displayName || 'Conductor',
        }, { merge: true });
      }, 10000);
    } else {
      clearInterval(locationInterval.current);
      setDoc(doc(db, 'drivers', user.uid), { isOnline: false, updatedAt: Timestamp.now() }, { merge: true });
    }
    return () => clearInterval(locationInterval.current);
  }, [isOnline]);

  const toggleOnline = async () => {
    if (!isOnline) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu ubicación para conectarte.');
      }
    }
    setIsOnline(prev => !prev);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {user.displayName?.split(' ')[0] || 'Conductor'} 👋</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user.displayName || 'C')[0].toUpperCase()}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Toggle Online */}
        <View style={[styles.onlineCard, isOnline && styles.onlineCardActive]}>
          <Animated.View style={[styles.onlineIndicator, { transform: [{ scale: pulseAnim }], backgroundColor: isOnline ? Colors.online : Colors.offline }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.onlineTitle, isOnline && styles.onlineTitleActive]}>
              {isOnline ? '● En línea' : '○ Desconectado'}
            </Text>
            <Text style={[styles.onlineSubtitle, isOnline && styles.onlineSubtitleActive]}>
              {isOnline ? 'Estás recibiendo solicitudes de viaje' : 'Activá para recibir viajes'}
            </Text>
          </View>
          <Switch
            value={isOnline}
            onValueChange={toggleOnline}
            trackColor={{ false: Colors.border, true: Colors.online + '60' }}
            thumbColor={isOnline ? Colors.online : Colors.textMuted}
            ios_backgroundColor={Colors.border}
          />
        </View>

        {/* Estadísticas del día */}
        <Text style={styles.sectionTitle}>Resumen de hoy</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.primary + '15' }]}>
              <Ionicons name="car" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{todayTrips}</Text>
            <Text style={styles.statLabel}>Viajes</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.accent + '20' }]}>
              <Ionicons name="cash" size={22} color={Colors.accent} />
            </View>
            <Text style={styles.statValue}>${todayEarnings}</Text>
            <Text style={styles.statLabel}>Ganancias</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.success + '15' }]}>
              <Ionicons name="star" size={22} color={Colors.success} />
            </View>
            <Text style={styles.statValue}>4.9</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Accesos rápidos */}
        <Text style={styles.sectionTitle}>Menú</Text>
        <View style={styles.menuGrid}>
          {[
            { icon: 'time', label: 'Historial', route: 'History', color: Colors.primary },
            { icon: 'map', label: 'Mapa en vivo', route: 'LiveMap', color: '#8B5CF6' },
            { icon: 'person', label: 'Mi perfil', route: 'Profile', color: Colors.accent },
            { icon: 'help-circle', label: 'Soporte', route: null, color: Colors.textSecondary },
          ].map(item => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuCard}
              onPress={() => item.route ? navigation.navigate(item.route) : null}>
              <Ionicons name={item.icon as any} size={26} color={item.color} />
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tip */}
        <View style={styles.tipCard}>
          <Ionicons name="information-circle" size={20} color={Colors.primary} />
          <Text style={styles.tipText}>
            {isOnline
              ? 'Estás activo. Mantené la app abierta para recibir solicitudes.'
              : 'Activá el modo en línea para comenzar a recibir viajes.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20,
    backgroundColor: Colors.primary,
  },
  greeting: { fontSize: 20, fontWeight: '800', color: Colors.white },
  date: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2, textTransform: 'capitalize' },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: Colors.white },
  content: { padding: 20, gap: 20, paddingBottom: 40 },
  onlineCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.white, borderRadius: 20, padding: 20,
    borderWidth: 2, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, elevation: 3,
  },
  onlineCardActive: { borderColor: Colors.online, backgroundColor: Colors.online + '08' },
  onlineIndicator: { width: 14, height: 14, borderRadius: 7 },
  onlineTitle: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary },
  onlineTitleActive: { color: Colors.online },
  onlineSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  onlineSubtitleActive: { color: Colors.online + 'AA' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 16,
    padding: 16, alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, elevation: 2,
  },
  statIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 12, color: Colors.textSecondary },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  menuCard: {
    width: '47%', backgroundColor: Colors.white, borderRadius: 16,
    padding: 20, alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, elevation: 2,
  },
  menuLabel: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  tipCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: Colors.primary + '0F', borderRadius: 14,
    padding: 14, borderLeftWidth: 3, borderLeftColor: Colors.primary,
  },
  tipText: { flex: 1, fontSize: 13, color: Colors.primary, lineHeight: 18 },
});
