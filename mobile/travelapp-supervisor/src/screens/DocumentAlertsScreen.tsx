import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../lib/firebase';
import { subscribeToRealFleet, DriverItem } from '../lib/supervisorService';

interface RealAlertItem {
  id: string;
  driverName: string;
  driverPhone: string;
  documentType: string;
  expiryDate: string;
  daysLeft: number;
  status: 'critical' | 'warning' | 'ok';
}

export default function DocumentAlertsScreen({ navigation }: any) {
  const [alerts, setAlerts] = useState<RealAlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid || '';
    const unsub = subscribeToRealFleet(uid, (drivers) => {
      const computedAlerts: RealAlertItem[] = [];
      const today = new Date();

      drivers.forEach((drv) => {
        const checkDoc = (docType: string, dateStr?: string) => {
          if (!dateStr) return;
          const exp = new Date(dateStr);
          if (isNaN(exp.getTime())) return;

          const diffMs = exp.getTime() - today.getTime();
          const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          let status: 'critical' | 'warning' | 'ok' = 'ok';
          if (daysLeft <= 5) {
            status = 'critical';
          } else if (daysLeft <= 20) {
            status = 'warning';
          }

          if (daysLeft <= 30) {
            computedAlerts.push({
              id: `${drv.id}-${docType}`,
              driverName: drv.name,
              driverPhone: drv.phone,
              documentType: docType,
              expiryDate: dateStr,
              daysLeft,
              status,
            });
          }
        };

        checkDoc('Seguro Comercial Automotor', drv.insuranceExpiry);
        checkDoc('Licencia de Conducir', drv.licenseExpiry);
        checkDoc('Revisión Técnica / RTO', drv.rtoExpiry);
      });

      // Ordenar por urgencia (menos días primero)
      computedAlerts.sort((a, b) => a.daysLeft - b.daysLeft);

      setAlerts(computedAlerts);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleNotify = (item: RealAlertItem) => {
    if (item.driverPhone) {
      const cleanPhone = item.driverPhone.replace(/[^0-9]/g, '');
      Linking.openURL(
        `https://wa.me/${cleanPhone}?text=Hola%20${encodeURIComponent(
          item.driverName
        )},%20te%20escribo%20desde%20Supervisión%20TravelApp%20para%20recordarte%20que%20tu%20${encodeURIComponent(
          item.documentType
        )}%20vence%20el%20${item.expiryDate}%20(en%20${item.daysLeft}%20días).%20Por%20favor%20gestioná%20la%20renovación.`
      );
    } else {
      Alert.alert(
        'Sin Teléfono',
        `El chofer ${item.driverName} no tiene teléfono registrado en el sistema.`
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Navigation */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Semáforo de Documentación</Text>
      </View>

      <Text style={styles.headerSub}>Control preventivo de seguros, licencias y RTO de la flota</Text>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Verificando documentación de flota...</Text>
        </View>
      ) : alerts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.okIconBox}>
            <Ionicons name="shield-checkmark" size={48} color="#10B981" />
          </View>
          <Text style={styles.okTitle}>Flota al Día 🟢</Text>
          <Text style={styles.okSub}>
            No hay alertas de vencimientos pendientes ni documentos vencidos en este momento.
          </Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isCritical = item.status === 'critical';
            const isWarning = item.status === 'warning';
            const color = isCritical ? '#EF4444' : isWarning ? '#F59E0B' : '#10B981';

            return (
              <View style={[styles.card, { borderColor: color }]}>
                <View style={styles.cardHeader}>
                  <View style={styles.statusIndicator}>
                    <View style={[styles.dot, { backgroundColor: color }]} />
                    <Text style={[styles.statusTag, { color }]}>
                      {item.daysLeft < 0
                        ? '🔴 Documento Vencido'
                        : isCritical
                        ? '🔴 Vence Próximamente (Urgente)'
                        : '🟡 Vence en menos de 20 días'}
                    </Text>
                  </View>
                  <Text style={styles.daysText}>
                    {item.daysLeft < 0 ? `Vencido hace ${Math.abs(item.daysLeft)}d` : `${item.daysLeft} días restantes`}
                  </Text>
                </View>

                <Text style={styles.driverName}>{item.driverName}</Text>
                <Text style={styles.docType}>{item.documentType}</Text>
                <Text style={styles.expiry}>Fecha de Vencimiento: {item.expiryDate}</Text>

                <TouchableOpacity
                  style={[styles.notifyBtn, { backgroundColor: isCritical ? '#EF4444' : '#334155' }]}
                  onPress={() => handleNotify(item)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
                  <Text style={styles.notifyBtnText}>Recordar por WhatsApp</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 16 },
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
  list: { paddingBottom: 20 },
  card: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusTag: { fontSize: 11, fontWeight: '800' },
  daysText: { color: '#CBD5E1', fontSize: 11, fontWeight: '700' },
  driverName: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginTop: 4 },
  docType: { color: '#94A3B8', fontSize: 13, marginTop: 2 },
  expiry: { color: '#64748B', fontSize: 11, marginTop: 4, marginBottom: 12 },
  notifyBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 10, borderRadius: 12 },
  notifyBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94A3B8', fontSize: 13, marginTop: 12 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  okIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  okTitle: { color: '#10B981', fontSize: 18, fontWeight: '900', marginBottom: 6 },
  okSub: { color: '#94A3B8', fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
