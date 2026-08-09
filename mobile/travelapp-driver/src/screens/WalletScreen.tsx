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
  const [cashEarnings, setCashEarnings] = useState(18500);
  const [digitalEarnings, setDigitalEarnings] = useState(24000);
  const [rewardsEarnings, setRewardsEarnings] = useState(3500);
  const [commissionPaid, setCommissionPaid] = useState(6900); // 15% aprox
  const [maxNegativeBalance, setMaxNegativeBalance] = useState(-10000);
  const [currentCommissionBalance, setCurrentCommissionBalance] = useState(-2500);
  
  const [expenses, setExpenses] = useState<any[]>([
    { id: 'exp-1', concept: 'Combustible ⛽', amount: 8500, time: '14:30' },
    { id: 'exp-2', concept: 'Peaje 🛣️', amount: 1200, time: '16:15' },
  ]);

  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [expenseConcept, setExpenseConcept] = useState('Combustible ⛽');
  const [expenseAmount, setExpenseAmount] = useState('');

  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    // Escuchar datos del conductor
    const unsubDriver = onSnapshot(doc(db, 'drivers', user?.uid || 'demo'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setBalance(data.balance ?? 0);
        if (data.cashEarnings !== undefined) setCashEarnings(data.cashEarnings);
        if (data.digitalEarnings !== undefined) setDigitalEarnings(data.digitalEarnings);
        if (data.rewardsEarnings !== undefined) setRewardsEarnings(data.rewardsEarnings);
        if (data.commissionPaid !== undefined) setCommissionPaid(data.commissionPaid);
        if (data.maxNegativeBalance !== undefined) setMaxNegativeBalance(data.maxNegativeBalance);
        if (data.currentCommissionBalance !== undefined) setCurrentCommissionBalance(data.currentCommissionBalance);
      }
      setLoadingData(false);
    });

    return unsubDriver;
  }, [user?.uid]);

  const grossEarnings = cashEarnings + digitalEarnings + rewardsEarnings;
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netEarnings = grossEarnings - commissionPaid - totalExpenses;
  const isOverNegativeLimit = currentCommissionBalance < maxNegativeBalance;

  const handleAddExpense = () => {
    const amt = parseFloat(expenseAmount);
    if (isNaN(amt) || amt <= 0) {
      return Alert.alert('Monto inválido', 'Por favor ingresá un monto mayor a cero.');
    }
    const newExp = {
      id: Date.now().toString(),
      concept: expenseConcept,
      amount: amt,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setExpenses([newExp, ...expenses]);
    setExpenseModalVisible(false);
    setExpenseAmount('');
    Alert.alert('Gasto registrado 📝', `Se descontaron $${amt} ARS de tu control diario.`);
  };

  const handleRequestWithdraw = async (amount: number) => {
    try {
      Alert.alert(
        'Retiro solicitado',
        `Hemos recibido tu solicitud de retiro por $${amount} ARS. Se acreditará en tu cuenta de Mercado Pago / CBU registrado.`
      );
    } catch (err) {
      Alert.alert('Error', 'No se pudo procesar el retiro. Intentá nuevamente.');
    }
  };
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Control Financiero Diario</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Tarjeta de Ganancia Neta Diaria */}
        <View style={styles.netBalanceCard}>
          <Text style={styles.netLabel}>GANANCIA NETA DEL DÍA</Text>
          <Text style={styles.netValue}>${netEarnings.toLocaleString('es-AR')} ARS</Text>

          <View style={styles.netMetricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Recaudación Bruta</Text>
              <Text style={[styles.metricVal, { color: Colors.success }]}>+${grossEarnings.toLocaleString('es-AR')}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Comisión Plataforma</Text>
              <Text style={[styles.metricVal, { color: Colors.danger }]}>-${commissionPaid.toLocaleString('es-AR')}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Gastos Cargados</Text>
              <Text style={[styles.metricVal, { color: '#D97706' }]}>-${totalExpenses.toLocaleString('es-AR')}</Text>
            </View>
          </View>
        </View>

        {/* Alerta de Saldo Negativo de Comisiones */}
        <View style={[styles.commissionCard, isOverNegativeLimit && styles.commissionCardDanger]}>
          <View style={styles.commHeader}>
            <Ionicons name={isOverNegativeLimit ? "alert-circle" : "card"} size={20} color={isOverNegativeLimit ? Colors.danger : Colors.primary} />
            <Text style={styles.commTitle}>Estado de Saldo de Comisión</Text>
          </View>
          <View style={styles.commRow}>
            <View>
              <Text style={styles.commSub}>Saldo adeudado actual:</Text>
              <Text style={[styles.commVal, { color: currentCommissionBalance < 0 ? Colors.danger : Colors.success }]}>
                ${currentCommissionBalance.toLocaleString('es-AR')} ARS
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.commSub}>Límite máximo permitido:</Text>
              <Text style={styles.commLimit}>${maxNegativeBalance.toLocaleString('es-AR')} ARS</Text>
            </View>
          </View>

          {isOverNegativeLimit ? (
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={16} color={Colors.danger} />
              <Text style={styles.warningText}>
                ⚠️ Superaste el límite negativo. El sistema actualmente sólo te ofrece viajes con PAGOS DIGITALES para regularizar tu saldo.
              </Text>
            </View>
          ) : (
            <Text style={styles.normalNotice}>
              ✓ Estás dentro del límite. Tu cuenta puede recibir viajes en efectivo y pagos digitales.
            </Text>
          )}
        </View>

        {/* Desglose de Recaudación */}
        <Text style={styles.sectionHeading}>Desglose de Cobros del Día</Text>
        <View style={styles.breakdownGrid}>
          <View style={styles.breakdownCard}>
            <Ionicons name="cash-outline" size={24} color="#15803D" />
            <Text style={styles.breakdownTitle}>Efectivo</Text>
            <Text style={styles.breakdownAmount}>${cashEarnings.toLocaleString('es-AR')}</Text>
          </View>

          <View style={styles.breakdownCard}>
            <Ionicons name="card-outline" size={24} color="#2563EB" />
            <Text style={styles.breakdownTitle}>Pagos Digitales</Text>
            <Text style={styles.breakdownAmount}>${digitalEarnings.toLocaleString('es-AR')}</Text>
          </View>

          <View style={styles.breakdownCard}>
            <Ionicons name="gift-outline" size={24} color="#7C3AED" />
            <Text style={styles.breakdownTitle}>Puntos Rewards</Text>
            <Text style={styles.breakdownAmount}>${rewardsEarnings.toLocaleString('es-AR')}</Text>
          </View>
        </View>

        {/* Gestor de Control de Gastos Diarios */}
        <View style={styles.expensesHeaderRow}>
          <Text style={styles.sectionHeading}>Control de Gastos Diarios</Text>
          <TouchableOpacity style={styles.addExpenseBtn} onPress={() => setExpenseModalVisible(true)}>
            <Ionicons name="add-circle" size={18} color={Colors.white} />
            <Text style={styles.addExpenseBtnText}>Cargar Gasto</Text>
          </TouchableOpacity>
        </View>

        {expenses.length === 0 ? (
          <Text style={styles.emptyExpensesText}>No registraste gastos el día de hoy.</Text>
        ) : (
          <View style={styles.expensesList}>
            {expenses.map(exp => (
              <View key={exp.id} style={styles.expenseItem}>
                <View style={styles.expIconContainer}>
                  <Ionicons name="receipt-outline" size={18} color="#92400E" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.expConcept}>{exp.concept}</Text>
                  <Text style={styles.expTime}>{exp.time}</Text>
                </View>
                <Text style={styles.expAmount}>-${exp.amount.toLocaleString('es-AR')}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal Cargar Gasto */}
      <Modal visible={expenseModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cargar Gasto Diario</Text>
            <Text style={styles.modalSubtitle}>Seleccioná el concepto e ingresá el monto gastado:</Text>

            <Text style={styles.fieldLabel}>Concepto:</Text>
            <View style={styles.conceptChipsRow}>
              {['Combustible ⛽', 'Peaje 🛣️', 'Lavado 🧼', 'Comida 🍔', 'Mantenimiento 🔧'].map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.conceptChip, expenseConcept === cat && styles.conceptChipActive]}
                  onPress={() => setExpenseConcept(cat)}
                >
                  <Text style={[styles.conceptChipText, expenseConcept === cat && styles.conceptChipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Monto ($ ARS):</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej: 5000"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={expenseAmount}
              onChangeText={setExpenseAmount}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setExpenseModalVisible(false)}>
                <Text style={styles.cancelModalText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmModalBtn} onPress={handleAddExpense}>
                <Text style={styles.confirmModalText}>Registrar Gasto</Text>
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.white },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  
  netBalanceCard: {
    backgroundColor: Colors.primary, borderRadius: 24, padding: 20, gap: 10,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, elevation: 6,
  },
  netLabel: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  netValue: { fontSize: 32, fontWeight: '900', color: Colors.white },
  netMetricsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 14, marginTop: 4,
  },
  metricItem: { flex: 1, alignItems: 'center' },
  metricLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  metricVal: { fontSize: 13, fontWeight: '800', marginTop: 2 },
  metricDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.2)' },

  commissionCard: {
    backgroundColor: Colors.white, borderRadius: 18, padding: 16, gap: 10,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  commissionCardDanger: { borderColor: Colors.danger, backgroundColor: '#FEF2F2' },
  commHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  commRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  commSub: { fontSize: 11, color: Colors.textSecondary },
  commVal: { fontSize: 16, fontWeight: '800' },
  commLimit: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  warningBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEE2E2',
    padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#FCA5A5',
  },
  warningText: { flex: 1, fontSize: 11, color: Colors.danger, fontWeight: '700' },
  normalNotice: { fontSize: 11, color: Colors.success, fontWeight: '600' },

  sectionHeading: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginTop: 4 },
  breakdownGrid: { flexDirection: 'row', gap: 10 },
  breakdownCard: {
    flex: 1, backgroundColor: Colors.white, padding: 14, borderRadius: 16, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  breakdownTitle: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  breakdownAmount: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },

  expensesHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  addExpenseBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
  },
  addExpenseBtnText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  emptyExpensesText: { fontSize: 12, color: Colors.textSecondary, fontStyle: 'italic', textAlign: 'center', marginVertical: 10 },
  expensesList: { gap: 8 },
  expenseItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.white,
    padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0',
  },
  expIconContainer: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  expConcept: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  expTime: { fontSize: 11, color: Colors.textSecondary },
  expAmount: { fontSize: 14, fontWeight: '800', color: Colors.danger },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: Colors.white, borderRadius: 24, padding: 20, width: '100%', gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  modalSubtitle: { fontSize: 12, color: Colors.textSecondary },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary, marginTop: 4 },
  conceptChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  conceptChip: {
    backgroundColor: Colors.background, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  conceptChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  conceptChipText: { fontSize: 12, color: Colors.textPrimary, fontWeight: '600' },
  conceptChipTextActive: { color: Colors.white },
  modalInput: {
    backgroundColor: Colors.background, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 16, fontWeight: '700', color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border,
  },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 10 },
  cancelModalBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.background, alignItems: 'center' },
  cancelModalText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  confirmModalBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center' },
  confirmModalText: { fontSize: 14, fontWeight: '700', color: Colors.white },
});
