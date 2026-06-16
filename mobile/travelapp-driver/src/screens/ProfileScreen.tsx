import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../lib/firebase';
import { Colors } from '../lib/constants';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const user = auth.currentUser;
  const initials = (user?.displayName || 'C')[0].toUpperCase();

  const [supportModalVisible, setSupportModalVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que querés salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => auth.signOut() },
    ]);
  };

  const handleSupportOption = (type: 'emergency' | 'whatsapp' | 'travis') => {
    setSupportModalVisible(false);
    if (type === 'emergency') {
      Linking.openURL('tel:911');
    } else if (type === 'whatsapp') {
      Linking.openURL('https://wa.me/5491100000000?text=Hola,%20necesito%20soporte%20como%20conductor%20en%20TravelApp.');
    } else if (type === 'travis') {
      Linking.openURL('https://travelapp.ar/support');
    }
  };

  const menuItems = [
    { icon: 'car-outline', label: 'Mi vehículo', action: () => Alert.alert('Mi vehículo', 'Funcionalidad de edición de vehículo próximamente disponible.') },
    { icon: 'card-outline', label: 'Mi Billetera / Split MP', action: () => navigation.navigate('Wallet') },
    { icon: 'document-text-outline', label: 'Mis documentos', action: () => Alert.alert('Documentación', 'Tus documentos están aprobados y al día.') },
    { icon: 'notifications-outline', label: 'Notificaciones', action: () => navigation.navigate('Notifications') },
    { icon: 'help-circle-outline', label: 'Soporte y ayuda', action: () => setSupportModalVisible(true) },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
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
            { label: 'Viajes totales', value: '184', icon: 'car' },
            { label: 'Horas activo', value: '142h', icon: 'time' },
            { label: 'Rating', value: '4.9 ⭐', icon: 'star' },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Ionicons name={s.icon as any} size={20} color={Colors.accent} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Menú de opciones */}
        <View style={styles.menuSection}>
          {menuItems.map(item => (
            <TouchableOpacity key={item.label} style={styles.menuItem} onPress={item.action}>
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
        <Text style={styles.version}>TravelCab Conductor v1.0.0</Text>
      </ScrollView>

      {/* Modal de Asistencia y Soporte */}
      <Modal
        visible={supportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSupportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
              <Text style={styles.modalTitle}>Centro de Asistencia</Text>
            </View>
            <Text style={styles.modalSubtitle}>¿En qué podemos ayudarte hoy? Si tenés una emergencia, presioná el Botón de Pánico.</Text>

            <TouchableOpacity 
              style={[styles.modalOption, styles.panicButton]} 
              onPress={() => handleSupportOption('emergency')}
            >
              <Ionicons name="call" size={22} color={Colors.white} />
              <Text style={styles.panicText}>Llamar al 911 (Botón de Pánico)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalOption} 
              onPress={() => handleSupportOption('whatsapp')}
            >
              <Ionicons name="logo-whatsapp" size={22} color={Colors.success} />
              <Text style={styles.optionText}>Soporte Oficial por WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalOption} 
              onPress={() => handleSupportOption('travis')}
            >
              <Ionicons name="chatbubble-ellipses" size={22} color={Colors.accent} />
              <Text style={styles.optionText}>Chatear con Travis (Asistente IA)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.closeModalBtn} 
              onPress={() => setSupportModalVisible(false)}
            >
              <Text style={styles.closeModalText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerTitle: { fontSize: 18, fontFamily: 'Quicksand-Bold', color: Colors.white },
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
  avatarText: { fontSize: 32, fontFamily: 'Quicksand-Bold', color: Colors.white },
  name: { fontSize: 22, fontFamily: 'Quicksand-Bold', color: Colors.white },
  email: { fontSize: 13, fontFamily: 'Quicksand-Regular', color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  badgeText: { fontSize: 12, color: Colors.white, fontFamily: 'Quicksand-SemiBold' },
  statsRow: {
    flexDirection: 'row', margin: 16, gap: 10,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, elevation: 2,
  },
  statValue: { fontSize: 16, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  statLabel: { fontSize: 10, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary, textAlign: 'center' },
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
  menuLabel: { flex: 1, fontSize: 15, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, borderRadius: 14, paddingVertical: 14,
    borderWidth: 1.5, borderColor: Colors.danger, marginBottom: 16,
  },
  logoutText: { fontSize: 15, fontFamily: 'Quicksand-Bold', color: Colors.danger },
  version: { textAlign: 'center', fontSize: 12, fontFamily: 'Quicksand-Regular', color: Colors.textMuted, marginBottom: 32 },

  // Modal de soporte
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: Colors.white, borderRadius: 24, padding: 24, gap: 14 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  modalTitle: { fontSize: 18, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  modalSubtitle: { fontSize: 12, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary, lineHeight: 18, marginBottom: 8 },
  modalOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.background, padding: 16, borderRadius: 14,
  },
  panicButton: { backgroundColor: Colors.danger },
  panicText: { color: Colors.white, fontSize: 14, fontFamily: 'Quicksand-Bold' },
  optionText: { fontSize: 14, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  closeModalBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 8 },
  closeModalText: { fontSize: 14, fontFamily: 'Quicksand-Bold', color: Colors.accent },
});
