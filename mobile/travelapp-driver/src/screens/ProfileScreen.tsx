import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../lib/firebase';
import { Colors } from '../lib/constants';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const user = auth.currentUser;
  const initials = (user?.displayName || 'C')[0].toUpperCase();

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que querés salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => auth.signOut() },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Tarjeta de conductor */}
        <View style={styles.driverCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{user?.displayName || 'Conductor'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.success} />
              <Text style={styles.badgeText}>Socio verificado</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="star" size={14} color={Colors.accent} />
              <Text style={styles.badgeText}>4.9 Rating</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Viajes totales', value: '0', icon: 'car' },
            { label: 'Horas activo', value: '0h', icon: 'time' },
            { label: 'Ganancias', value: '$0', icon: 'cash' },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Ionicons name={s.icon as any} size={20} color={Colors.primary} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Menú de opciones */}
        <View style={styles.menuSection}>
          {[
            { icon: 'car-outline', label: 'Mi vehículo' },
            { icon: 'card-outline', label: 'Datos de pago' },
            { icon: 'document-text-outline', label: 'Mis documentos' },
            { icon: 'notifications-outline', label: 'Notificaciones' },
            { icon: 'help-circle-outline', label: 'Soporte y ayuda' },
          ].map(item => (
            <TouchableOpacity key={item.label} style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon as any} size={20} color={Colors.primary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
        <Text style={styles.version}>TravelApp Conductor v1.0.0</Text>
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
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.white },
  driverCard: {
    backgroundColor: Colors.primary, alignItems: 'center',
    paddingBottom: 32, paddingHorizontal: 24,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: { fontSize: 32, fontWeight: '900', color: Colors.white },
  name: { fontSize: 22, fontWeight: '800', color: Colors.white },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  badgeText: { fontSize: 12, color: Colors.white, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row', margin: 16, gap: 10,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, elevation: 2,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 10, color: Colors.textSecondary, textAlign: 'center' },
  menuSection: {
    marginHorizontal: 16, backgroundColor: Colors.white,
    borderRadius: 16, overflow: 'hidden', marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.primary + '12', alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, borderRadius: 14, paddingVertical: 14,
    borderWidth: 1.5, borderColor: Colors.danger, marginBottom: 16,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: Colors.danger },
  version: { textAlign: 'center', fontSize: 12, color: Colors.textMuted, marginBottom: 32 },
});
