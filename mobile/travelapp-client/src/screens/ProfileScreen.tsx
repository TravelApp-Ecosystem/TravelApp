import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../lib/firebase';
import { Colors } from '../lib/constants';
import { doc, onSnapshot } from 'firebase/firestore';

const MENU_ITEMS = [
  { icon: 'person-circle-outline', label: 'Ficha de Cliente (Datos & Familia)', route: 'CompleteProfile', highlight: true },
  { icon: 'card-outline', label: 'Métodos de pago', route: null },
  { icon: 'star-outline', label: 'Mis rewards', route: 'Rewards' },
  { icon: 'time-outline', label: 'Historial de viajes', route: 'History' },
  { icon: 'notifications-outline', label: 'Notificaciones', route: null },
  { icon: 'shield-checkmark-outline', label: 'Seguridad', route: null },
  { icon: 'help-circle-outline', label: 'Ayuda y soporte', route: 'Chat' },
];

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const user = auth.currentUser;
  const [points, setPoints] = useState(850);
  const [customerLevel, setCustomerLevel] = useState<number>(1);
  const [progress, setProgress] = useState<number>(30);
  const [familyCount, setFamilyCount] = useState<number>(0);

  useEffect(() => {
    if (user?.uid) {
      const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.rewardsPoints !== undefined) {
            setPoints(data.rewardsPoints);
          }
          if (data.customerLevel !== undefined) {
            setCustomerLevel(data.customerLevel);
          }
          if (data.profileCompletedPercentage !== undefined) {
            setProgress(data.profileCompletedPercentage);
          }
          if (Array.isArray(data.familyMembers)) {
            setFamilyCount(data.familyMembers.length);
          }
        }
      });
      return unsub;
    }
  }, [user?.uid]);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro que querés salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: () => auth.signOut(),
      },
    ]);
  };

  const initials = (user?.displayName || user?.email || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const isVIP = customerLevel === 2 || progress === 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar + Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{user?.displayName || 'Usuario'}</Text>
          <Text style={styles.email}>{user?.email}</Text>

          {/* VIP Level Badge */}
          <View style={[styles.levelBadge, isVIP ? styles.levelBadgeVip : styles.levelBadgeBasic]}>
            <Ionicons name={isVIP ? "sparkles" : "shield-outline"} size={14} color={isVIP ? "#D97706" : Colors.textSecondary} />
            <Text style={[styles.levelBadgeText, isVIP ? styles.levelBadgeTextVip : styles.levelBadgeTextBasic]}>
              {isVIP ? 'Cliente VIP Nivel 2' : 'Cliente Básico Nivel 1'}
            </Text>
          </View>

          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Viajes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{points}</Text>
              <Text style={styles.statLabel}>Puntos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{familyCount}</Text>
              <Text style={styles.statLabel}>Familiares</Text>
            </View>
          </View>
        </View>

        {/* Tarjeta de Acción: Completar Perfil de Pasajero y Familia */}
        <TouchableOpacity
          style={styles.bannerCard}
          onPress={() => navigation.navigate('CompleteProfile')}
          activeOpacity={0.88}
        >
          <View style={styles.bannerHeader}>
            <View style={styles.bannerIconBox}>
              <Ionicons name="airplane" size={22} color={Colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>
                {isVIP ? 'Ficha de Cliente Activa' : 'Completar Ficha de Cliente'}
              </Text>
              <Text style={styles.bannerSub}>
                {isVIP
                  ? `${familyCount} acompañantes · DNI/Pasaporte y AFIP al día`
                  : 'Completá tu DNI, datos fiscales, grupo familiar y ficha médica'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.accent} />
          </View>

          <View style={styles.bannerProgressRow}>
            <View style={styles.bannerTrack}>
              <View style={[styles.bannerFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.bannerProgressText}>{progress}% completo</Text>
          </View>
        </TouchableOpacity>

        {/* Menú */}
        <View style={styles.menuSection}>
          {MENU_ITEMS.map(item => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, item.highlight && styles.menuItemHighlight]}
              onPress={() => item.route ? navigation.navigate(item.route) : null}>
              <View style={[styles.menuIconWrap, item.highlight && { backgroundColor: Colors.accent + '15' }]}>
                <Ionicons
                  name={item.icon as any}
                  size={22}
                  color={item.highlight ? Colors.accent : Colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, item.highlight && { fontWeight: '700', color: Colors.textPrimary }]}>
                  {item.label}
                </Text>
                {item.highlight && (
                  <Text style={{ fontSize: 11, color: Colors.accent, fontWeight: '600' }}>
                    {isVIP ? 'Perfil Completo (VIP Nivel 2)' : 'Completar ahora para beneficios'}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={styles.version}>TravelApp v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: Colors.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, elevation: 3,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  profileSection: {
    alignItems: 'center', backgroundColor: Colors.white, paddingVertical: 28,
    paddingHorizontal: 20, marginBottom: 12,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: Colors.white },
  name: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  email: { fontSize: 14, color: Colors.textSecondary, marginTop: 2, marginBottom: 10 },

  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 16,
  },
  levelBadgeVip: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A' },
  levelBadgeBasic: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  levelBadgeText: { fontSize: 12, fontWeight: '700' },
  levelBadgeTextVip: { color: '#B45309' },
  levelBadgeTextBasic: { color: '#64748B' },

  statRow: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 12, color: Colors.textSecondary },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.border },

  bannerCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: Colors.accent + '30',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
  },
  bannerHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.accent + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  bannerSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  bannerProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bannerTrack: { flex: 1, height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
  bannerFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 3 },
  bannerProgressText: { fontSize: 11, fontWeight: '700', color: Colors.accent },

  menuSection: { backgroundColor: Colors.white, marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  menuItemHighlight: { backgroundColor: '#FFFBF5' },
  menuIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.primary + '12', alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { fontSize: 15, color: Colors.textPrimary },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, borderRadius: 14, paddingVertical: 14,
    borderWidth: 1.5, borderColor: Colors.danger, marginBottom: 16,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: Colors.danger },
  version: { textAlign: 'center', fontSize: 12, color: Colors.textMuted, marginBottom: 32 },
});
