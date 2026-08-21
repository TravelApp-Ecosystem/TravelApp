import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PayoutConfigScreen() {
  const [method, setMethod] = useState<'mp' | 'cbu'>('mp');
  const [mpLinked, setMpLinked] = useState(true);
  const [mpEmail, setMpEmail] = useState('mp.florencia@mercadopago.com.ar');
  const [cbu, setCbu] = useState('0000003100084592019482');
  const [alias, setAlias] = useState('FLOR.TRAVEL.MP');
  const [holder, setHolder] = useState('María Florencia Rossi');

  const handleSave = () => {
    Alert.alert('¡Configuración Guardada!', 'Tus datos de cobranza fueron actualizados.');
  };

  const handleToggleMp = () => {
    setMpLinked(!mpLinked);
    Alert.alert(
      mpLinked ? 'Cuenta MP Desvinculada' : 'Cuenta MP Vinculada',
      mpLinked ? 'Se pausó el Split Instantáneo.' : '¡Mercado Pago OAuth conectado con éxito!'
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Configuración de Cobro de Comisiones</Text>
      <Text style={styles.headerSub}>Elegí cómo recibir las comisiones generadas por tus seguidores</Text>

      {/* Selector */}
      <View style={styles.selectorContainer}>
        <TouchableOpacity 
          style={[styles.selectorBtn, method === 'mp' && styles.selectorActiveMp]}
          onPress={() => setMethod('mp')}
        >
          <Ionicons name="flash-outline" size={18} color={method === 'mp' ? '#009EE3' : '#64748B'} />
          <Text style={[styles.selectorText, method === 'mp' && { color: '#009EE3' }]}>
            Split Mercado Pago (OAuth)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.selectorBtn, method === 'cbu' && styles.selectorActiveCbu]}
          onPress={() => setMethod('cbu')}
        >
          <Ionicons name="calendar-outline" size={18} color={method === 'cbu' ? '#F59E0B' : '#64748B'} />
          <Text style={[styles.selectorText, method === 'cbu' && { color: '#F59E0B' }]}>
            CBU / CVU (Semanal)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Option MP */}
      {method === 'mp' ? (
        <View style={styles.cardMp}>
          <Text style={styles.cardTitle}>⚡ Split Inverso Instantáneo de Mercado Pago</Text>
          <Text style={styles.cardDesc}>
            Tu comisión se acredita automáticamente en tu cuenta de Mercado Pago vinculada al venderse la experiencia.
          </Text>
          
          <View style={styles.mpStatusBadge}>
            <Ionicons name={mpLinked ? "checkmark-circle" : "alert-circle"} size={18} color={mpLinked ? "#10B981" : "#F59E0B"} />
            <Text style={styles.mpStatusText}>
              {mpLinked ? `OAuth MP Activo (${mpEmail})` : 'Sin cuenta MP vinculada'}
            </Text>
          </View>

          <TouchableOpacity style={styles.mpLinkBtn} onPress={handleToggleMp}>
            <Text style={styles.mpLinkBtnText}>
              {mpLinked ? 'Desvincular Cuenta MP' : '⚡ Conectar Mercado Pago OAuth'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Option CBU */
        <View style={styles.cardCbu}>
          <Text style={styles.cardTitle}>🗓️ Transferencia Bancaria Semanal (Lunes)</Text>
          <Text style={styles.cardDesc}>
            Ingresá tu CBU, CVU o Alias para recibir el total de comisiones de la semana todos los Lunes.
          </Text>

          <Text style={styles.inputLabel}>CBU o CVU (22 dígitos)</Text>
          <TextInput
            style={styles.input}
            value={cbu}
            onChangeText={setCbu}
            placeholder="00000031000..."
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.inputLabel}>Alias CBU</Text>
          <TextInput
            style={styles.input}
            value={alias}
            onChangeText={setAlias}
            placeholder="TU.ALIAS.MP"
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.inputLabel}>Titular de la Cuenta</Text>
          <TextInput
            style={styles.input}
            value={holder}
            onChangeText={setHolder}
            placeholder="Nombre y Apellido"
            placeholderTextColor="#94A3B8"
          />
        </View>
      )}

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Guardar Configuración</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, gap: 14 },
  headerTitle: { color: '#0A2A5B', fontSize: 16, fontFamily: 'Quicksand-Bold' },
  headerSub: { color: '#64748B', fontSize: 12, fontFamily: 'Quicksand-Medium' },
  selectorContainer: { flexDirection: 'row', gap: 10 },
  selectorBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 12, borderRadius: 14 },
  selectorActiveMp: { borderColor: '#009EE3', backgroundColor: '#F0F9FF' },
  selectorActiveCbu: { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' },
  selectorText: { fontSize: 11, fontFamily: 'Quicksand-Bold', color: '#64748B' },
  cardMp: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#BAE6FD', padding: 16, gap: 8 },
  cardCbu: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#FDE68A', padding: 16, gap: 8 },
  cardTitle: { fontSize: 14, fontFamily: 'Quicksand-Bold', color: '#0A2A5B' },
  cardDesc: { fontSize: 11, fontFamily: 'Quicksand-Medium', color: '#64748B', lineHeight: 16 },
  mpStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', padding: 10, borderRadius: 10, marginVertical: 4 },
  mpStatusText: { fontSize: 11, fontFamily: 'Quicksand-Bold', color: '#065F46' },
  mpLinkBtn: { backgroundColor: '#009EE3', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  mpLinkBtnText: { color: '#FFFFFF', fontSize: 12, fontFamily: 'Quicksand-Bold' },
  inputLabel: { fontSize: 11, fontFamily: 'Quicksand-Bold', color: '#0A2A5B', marginTop: 4 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, fontFamily: 'Quicksand-Medium', color: '#0F172A' },
  saveBtn: { backgroundColor: '#0A2A5B', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Quicksand-Bold' },
});
