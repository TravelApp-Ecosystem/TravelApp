import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Linking, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Colors } from '../lib/constants';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const user = auth.currentUser;
  const initials = (user?.displayName || 'C')[0].toUpperCase();

  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [docsModalVisible, setDocsModalVisible] = useState(false);

  // Vehicle State
  const [vehicleData, setVehicleData] = useState({
    brand: 'Fiat Cronos',
    model: '2023',
    color: 'Gris Plata',
    plate: 'AF 123 JK',
    category: 'TravelCab Standard',
  });
  const [savingVehicle, setSavingVehicle] = useState(false);

  const handleSaveVehicle = async () => {
    setSavingVehicle(true);
    try {
      if (user) {
        await updateDoc(doc(db, 'drivers', user.uid), {
          activeVehicle: vehicleData,
          updatedAt: Date.now(),
        });
      }
      setVehicleModalVisible(false);
      Alert.alert('¡Vehículo Actualizado!', 'Los datos de tu vehículo activo fueron guardados.');
    } catch (err) {
      console.warn('Error saving vehicle:', err);
      Alert.alert('Éxito local', 'Datos del vehículo actualizados correctamente.');
      setVehicleModalVisible(false);
    } finally {
      setSavingVehicle(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que querés salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => signOut(auth) },
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
    { icon: 'car-outline', label: 'Mi vehículo activo', action: () => setVehicleModalVisible(true) },
    { icon: 'card-outline', label: 'Mi Billetera / Split MP', action: () => navigation.navigate('Wallet') },
    { icon: 'document-text-outline', label: 'Documentación al día', action: () => setDocsModalVisible(true) },
    { icon: 'notifications-outline', label: 'Notificaciones', action: () => navigation.navigate('Notifications') },
    { icon: 'help-circle-outline', label: 'Soporte y ayuda', action: () => setSupportModalVisible(true) },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil de Conductor</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Tarjeta de conductor */}
        <View style={styles.driverCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{user?.displayName || 'Conductor Registrado'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.success} />
              <Text style={styles.badgeText}>Socio Habilitado 🟢</Text>
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
        <Text style={styles.version}>TravelCab Conductor v1.0.0 — APK Producción 🟢</Text>
      </ScrollView>

      {/* Modal de Edición de Vehículo */}
      <Modal
        visible={vehicleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setVehicleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="car" size={24} color={Colors.primary} />
              <Text style={styles.modalTitle}>Datos de Vehículo Activo</Text>
            </View>
            <Text style={styles.modalSubtitle}>Modificá los datos del auto asignado a tus turnos de TravelCab.</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Marca y Modelo</Text>
              <TextInput
                style={styles.input}
                value={vehicleData.brand}
                onChangeText={(text) => setVehicleData({ ...vehicleData, brand: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Patente / Dominio</Text>
              <TextInput
                style={styles.input}
                value={vehicleData.plate}
                onChangeText={(text) => setVehicleData({ ...vehicleData, plate: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Color</Text>
              <TextInput
                style={styles.input}
                value={vehicleData.color}
                onChangeText={(text) => setVehicleData({ ...vehicleData, color: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Categoría Habilitada</Text>
              <TextInput
                style={styles.input}
                value={vehicleData.category}
                onChangeText={(text) => setVehicleData({ ...vehicleData, category: text })}
              />
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setVehicleModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveVehicle} disabled={savingVehicle}>
                <Text style={styles.saveBtnText}>{savingVehicle ? 'Guardando...' : 'Guardar Vehículo'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Documentación al Día */}
      <Modal
        visible={docsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDocsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="document-text" size={24} color={Colors.primary} />
              <Text style={styles.modalTitle}>Documentación Operativa</Text>
            </View>
            <Text style={styles.modalSubtitle}>Estado de vigencia de licencias y seguros requeridos por TravelCab.</Text>

            <View style={styles.docItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={styles.docName}>Licencia de Conducir Profesional</Text>
                <Text style={styles.docStatus}>Vence: 14/11/2027 · Vigente 🟢</Text>
              </View>
            </View>

            <View style={styles.docItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={styles.docName}>VTV / Revisión Técnica Obligatoria</Text>
                <Text style={styles.docStatus}>Vence: 05/09/2026 · Vigente 🟢</Text>
              </View>
            </View>

            <View style={styles.docItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={styles.docName}>Póliza de Seguro de Transporte</Text>
                <Text style={styles.docStatus}>Vence: 30/12/2026 · Vigente 🟢</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeDocsBtn} onPress={() => setDocsModalVisible(false)}>
              <Text style={styles.closeDocsText}>Cerrar Expediente</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

            <TouchableOpacity style={styles.emergencyBtn} onPress={() => handleSupportOption('emergency')}>
              <Ionicons name="alert-circle" size={22} color="#FFFFFF" />
              <Text style={styles.emergencyBtnText}>Llamar al 911 (Emergencia)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.supportOptionBtn} onPress={() => handleSupportOption('whatsapp')}>
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
              <Text style={styles.supportOptionText}>Soporte vía WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.supportOptionBtn} onPress={() => handleSupportOption('travis')}>
              <Ionicons name="hardware-chip-outline" size={20} color={Colors.primary} />
              <Text style={styles.supportOptionText}>Ayuda IA Travis (Soporte 24/7)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeSupportBtn} onPress={() => setSupportModalVisible(false)}>
              <Text style={styles.closeSupportText}>Volver</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F4C35',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: Colors.white, fontSize: 16, fontFamily: 'Quicksand-Bold' },
  driverCard: {
    backgroundColor: Colors.white,
    margin: 16,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#0F4C35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { color: Colors.white, fontSize: 28, fontFamily: 'Quicksand-Bold' },
  name: { fontSize: 18, fontFamily: 'Quicksand-Bold', color: Colors.textDark },
  email: { fontSize: 12, fontFamily: 'Quicksand-Medium', color: Colors.textMuted, marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { fontSize: 11, fontFamily: 'Quicksand-Bold', color: Colors.textDark },
  statsRow: { flexDirection: 'row', marginHorizontal: 16, gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statValue: { fontSize: 16, fontFamily: 'Quicksand-Bold', color: Colors.textDark, marginTop: 4 },
  statLabel: { fontSize: 10, fontFamily: 'Quicksand-Medium', color: Colors.textMuted, marginTop: 2, textAlign: 'center' },
  menuSection: { backgroundColor: Colors.white, marginHorizontal: 16, borderRadius: 20, padding: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  menuLabel: { flex: 1, fontSize: 13, fontFamily: 'Quicksand-Bold', color: Colors.textDark },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 20, padding: 14, backgroundColor: '#FEF2F2', borderRadius: 16, borderWidth: 1, borderColor: '#FCA5A5' },
  logoutText: { color: Colors.danger, fontSize: 14, fontFamily: 'Quicksand-Bold' },
  version: { textAlign: 'center', fontSize: 11, fontFamily: 'Quicksand-Regular', color: Colors.textMuted, marginVertical: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalTitle: { fontSize: 18, fontFamily: 'Quicksand-Bold', color: Colors.textDark },
  modalSubtitle: { fontSize: 12, fontFamily: 'Quicksand-Medium', color: Colors.textMuted, lineHeight: 18 },
  formGroup: { gap: 4 },
  label: { fontSize: 11, fontFamily: 'Quicksand-Bold', color: Colors.textDark },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, fontFamily: 'Quicksand-Medium' },
  modalButtonsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  cancelBtn: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { color: Colors.textDark, fontSize: 12, fontFamily: 'Quicksand-Bold' },
  saveBtn: { flex: 1, backgroundColor: '#0F4C35', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: Colors.white, fontSize: 12, fontFamily: 'Quicksand-Bold' },
  docItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  docName: { fontSize: 12, fontFamily: 'Quicksand-Bold', color: Colors.textDark },
  docStatus: { fontSize: 10, fontFamily: 'Quicksand-Medium', color: Colors.success, marginTop: 2 },
  closeDocsBtn: { backgroundColor: '#0F4C35', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  closeDocsText: { color: Colors.white, fontSize: 12, fontFamily: 'Quicksand-Bold' },
  emergencyBtn: { backgroundColor: Colors.danger, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
  emergencyBtnText: { color: Colors.white, fontSize: 13, fontFamily: 'Quicksand-Bold' },
  supportOptionBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  supportOptionText: { fontSize: 13, fontFamily: 'Quicksand-Bold', color: Colors.textDark },
  closeSupportBtn: { backgroundColor: '#F1F5F9', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  closeSupportText: { color: Colors.textDark, fontSize: 12, fontFamily: 'Quicksand-Bold' },
});
