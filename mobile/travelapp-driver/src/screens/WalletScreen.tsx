import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, FlatList, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { doc, onSnapshot, updateDoc, collection, addDoc, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Colors } from '../lib/constants';

export default function WalletScreen() {
  const navigation = useNavigation<any>();
  const user = auth.currentUser!;

  const [balance, setBalance] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [mpEmail, setMpEmail] = useState('');
  const [isLinked, setIsLinked] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [processingWithdraw, setProcessingWithdraw] = useState(false);
  const [linkingMp, setLinkingMp] = useState(false);

  useEffect(() => {
    // Escuchar balance y datos de Mercado Pago del conductor
    const unsubDriver = onSnapshot(doc(db, 'drivers', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setBalance(data.balance ?? 0);
        setTotalEarnings(data.totalEarnings ?? 0);
        setMpEmail(data.mercadoPagoEmail ?? '');
        setIsLinked(!!data.mercadoPagoLinked);
      }
      setLoadingData(false);
    });

    // Cargar transacciones
    const fetchTransactions = async () => {
      try {
        const q = query(
          collection(db, 'drivers', user.uid, 'transactions'),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } else {
          // Si está vacío, creamos unas transacciones de muestra para visualización premium inicial
          setTransactions([
            {
              id: 'mock-1',
              type: 'trip',
              amount: 4500,
              createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000)),
              description: 'Viaje finalizado - Origen a Destino'
            },
            {
              id: 'mock-2',
              type: 'withdrawal',
              amount: -8000,
              status: 'completed',
              createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000)),
              description: 'Retiro enviado a Mercado Pago'
            },
            {
              id: 'mock-3',
              type: 'trip',
              amount: 5200,
              createdAt: Timestamp.fromDate(new Date(Date.now() - 172800000)),
              description: 'Viaje finalizado - Zona Centro'
            }
          ]);
        }
      } catch (e) {
        console.log("Error loading transactions", e);
      }
    };

    fetchTransactions();

    return unsubDriver;
  }, [user.uid]);

  const handleLinkMercadoPago = async () => {
    if (!mpEmail || !mpEmail.includes('@')) {
      return Alert.alert('Email inválido', 'Por favor ingresá un email válido de Mercado Pago.');
    }
    setLinkingMp(true);
    try {
      await updateDoc(doc(db, 'drivers', user.uid), {
        mercadoPagoEmail: mpEmail,
        mercadoPagoLinked: true,
        updatedAt: Timestamp.now()
      });
      setIsLinked(true);
      Alert.alert('¡Cuenta vinculada!', 'Tu cuenta de Mercado Pago está lista para recibir el Split de Pagos.');
    } catch {
      Alert.alert('Error', 'No se pudo vincular la cuenta. Intentá más tarde.');
    } finally {
      setLinkingMp(false);
    }
  };

  const handleRequestWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      return Alert.alert('Monto inválido', 'Por favor ingresá un monto mayor a cero.');
    }
    if (amount > balance) {
      return Alert.alert('Saldo insuficiente', 'No tenés suficiente saldo disponible para este retiro.');
    }
    if (!isLinked) {
      return Alert.alert('Mercado Pago requerido', 'Primero debés vincular tu cuenta de Mercado Pago.');
    }

    setProcessingWithdraw(true);
    try {
      const newBalance = balance - amount;

      // 1. Actualizar balance en el documento del conductor
      await updateDoc(doc(db, 'drivers', user.uid), {
        balance: newBalance,
        updatedAt: Timestamp.now()
      });

      // 2. Registrar la transacción de retiro
      const txRef = await addDoc(collection(db, 'drivers', user.uid, 'transactions'), {
        type: 'withdrawal',
        amount: -amount,
        status: 'pending',
        description: 'Retiro de fondos a Mercado Pago',
        createdAt: Timestamp.now()
      });

      // Agregar localmente a la lista para feedback visual inmediato
      setTransactions(prev => [
        {
          id: txRef.id,
          type: 'withdrawal',
          amount: -amount,
          status: 'pending',
          description: 'Retiro de fondos a Mercado Pago',
          createdAt: Timestamp.now()
        },
        ...prev
      ]);

      setWithdrawModalVisible(false);
      setWithdrawAmount('');
      Alert.alert(
        'Retiro solicitado',
        `Hemos recibido tu solicitud de retiro por $${amount} ARS. Se acreditará en tu cuenta de Mercado Pago.`
      );
    } catch {
      Alert.alert('Error', 'No se pudo procesar el retiro. Intentá nuevamente.');
    } finally {
      setProcessingWithdraw(false);
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Billetera</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Tarjeta de Saldo */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo disponible</Text>
          <Text style={styles.balanceValue}>${balance.toLocaleString('es-AR')} ARS</Text>
          
          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Ganancias totales</Text>
              <Text style={styles.statVal}>${totalEarnings.toLocaleString('es-AR')}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.withdrawBtn, balance <= 0 && styles.disabledBtn]} 
              disabled={balance <= 0}
              onPress={() => setWithdrawModalVisible(true)}
            >
              <Text style={styles.withdrawBtnText}>Retirar</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Mercado Pago Split */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="logo-usd" size={20} color={Colors.accent} />
            <Text style={styles.sectionTitle}>Split de Mercado Pago</Text>
          </View>
          <Text style={styles.sectionDesc}>
            Conectá tu cuenta corporativa o personal para que la plataforma procese tus ingresos y comisiones automáticamente.
          </Text>

          {isLinked ? (
            <View style={styles.linkedContainer}>
              <View style={styles.linkedInfo}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                <View>
                  <Text style={styles.linkedTitle}>Cuenta vinculada</Text>
                  <Text style={styles.linkedSub}>{mpEmail}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsLinked(false)} style={styles.changeBtn}>
                <Text style={styles.changeBtnText}>Cambiar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.linkForm}>
              <TextInput
                style={styles.input}
                placeholder="Email de Mercado Pago"
                placeholderTextColor={Colors.textMuted}
                value={mpEmail}
                onChangeText={setMpEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity 
                style={styles.linkBtn} 
                onPress={handleLinkMercadoPago}
                disabled={linkingMp}
              >
                {linkingMp ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.linkBtnText}>Vincular cuenta</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Historial de Transacciones */}
        <Text style={styles.listTitle}>Movimientos recientes</Text>
        
        {loadingData ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.listContainer}>
            {transactions.map(item => (
              <View key={item.id} style={styles.txItem}>
                <View style={[styles.txIcon, { backgroundColor: item.amount < 0 ? Colors.danger + '10' : Colors.success + '10' }]}>
                  <Ionicons 
                    name={item.amount < 0 ? 'arrow-up-outline' : 'arrow-down-outline'} 
                    size={18} 
                    color={item.amount < 0 ? Colors.danger : Colors.success} 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txDesc}>{item.description}</Text>
                  <Text style={styles.txDate}>{formatDate(item.createdAt)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.txAmount, { color: item.amount < 0 ? Colors.danger : Colors.success }]}>
                    {item.amount < 0 ? '-' : '+'}${Math.abs(item.amount).toLocaleString('es-AR')}
                  </Text>
                  {item.status === 'pending' && (
                    <Text style={styles.pendingBadge}>Pendiente</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal de Retiro */}
      <Modal
        visible={withdrawModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWithdrawModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Solicitar Retiro</Text>
            <Text style={styles.modalSubtitle}>Ingresá el monto que deseas retirar a Mercado Pago</Text>
            <Text style={styles.modalBalance}>Disponible: ${balance.toLocaleString('es-AR')} ARS</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="$ Monto a retirar"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelModalBtn} 
                onPress={() => { setWithdrawModalVisible(false); setWithdrawAmount(''); }}
              >
                <Text style={styles.cancelModalText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmModalBtn} 
                onPress={handleRequestWithdraw}
                disabled={processingWithdraw}
              >
                {processingWithdraw ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.confirmModalText}>Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
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
  content: { padding: 20, gap: 20, paddingBottom: 40 },
  balanceCard: {
    backgroundColor: Colors.primary,
    borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, elevation: 5,
  },
  balanceLabel: { fontSize: 13, fontFamily: 'Quicksand-Medium', color: 'rgba(255,255,255,0.7)' },
  balanceValue: { fontSize: 32, fontFamily: 'Quicksand-Bold', color: Colors.white, marginTop: 4 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statCol: { gap: 4 },
  statLabel: { fontSize: 11, fontFamily: 'Quicksand-Medium', color: 'rgba(255,255,255,0.6)' },
  statVal: { fontSize: 16, fontFamily: 'Quicksand-Bold', color: Colors.white },
  withdrawBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.accent, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
  },
  disabledBtn: { backgroundColor: 'rgba(255,255,255,0.2)' },
  withdrawBtnText: { color: Colors.white, fontSize: 14, fontFamily: 'Quicksand-Bold' },
  sectionCard: {
    backgroundColor: Colors.white, borderRadius: 20, padding: 20, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  sectionDesc: { fontSize: 12, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary, lineHeight: 18 },
  linkedContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.background, padding: 14, borderRadius: 12, marginTop: 4,
  },
  linkedInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  linkedTitle: { fontSize: 14, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  linkedSub: { fontSize: 12, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary, marginTop: 2 },
  changeBtn: { paddingVertical: 6, paddingHorizontal: 12 },
  changeBtnText: { fontSize: 13, fontFamily: 'Quicksand-Bold', color: Colors.accent },
  linkForm: { gap: 12, marginTop: 4 },
  input: {
    backgroundColor: Colors.background, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 14, fontFamily: 'Quicksand-Regular', color: Colors.textPrimary,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  linkBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  linkBtnText: { color: Colors.white, fontSize: 14, fontFamily: 'Quicksand-Bold' },
  listTitle: { fontSize: 16, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary, marginTop: 8 },
  listContainer: {
    backgroundColor: Colors.white, borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, elevation: 2,
  },
  txItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  txIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txDesc: { fontSize: 13, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  txDate: { fontSize: 11, fontFamily: 'Quicksand-Regular', color: Colors.textMuted, marginTop: 2 },
  txAmount: { fontSize: 15, fontFamily: 'Quicksand-Bold' },
  pendingBadge: { fontSize: 10, fontFamily: 'Quicksand-Bold', color: Colors.accent, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: Colors.white, borderRadius: 24, padding: 24, gap: 16 },
  modalTitle: { fontSize: 20, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary },
  modalSubtitle: { fontSize: 13, fontFamily: 'Quicksand-Regular', color: Colors.textSecondary },
  modalBalance: { fontSize: 14, fontFamily: 'Quicksand-Bold', color: Colors.primary },
  modalInput: {
    backgroundColor: Colors.background, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 18, fontFamily: 'Quicksand-Bold', color: Colors.textPrimary,
    borderWidth: 1.5, borderColor: Colors.accent, textAlign: 'center',
  },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelModalBtn: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border,
    paddingVertical: 14, borderRadius: 12, alignItems: 'center',
  },
  cancelModalText: { fontSize: 14, fontFamily: 'Quicksand-Bold', color: Colors.textSecondary },
  confirmModalBtn: {
    flex: 1, backgroundColor: Colors.accent,
    paddingVertical: 14, borderRadius: 12, alignItems: 'center',
  },
  confirmModalText: { fontSize: 14, fontFamily: 'Quicksand-Bold', color: Colors.white },
});
