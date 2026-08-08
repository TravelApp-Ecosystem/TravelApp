import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PayoutConfigScreen() {
  const [method, setMethod] = useState<'mp' | 'cbu'>('mp');
  const [cbu, setCbu] = useState('0000003100084592019482');
  const [alias, setAlias] = useState('FLOR.TRAVEL.MP');
  const [holder, setHolder] = useState('María Florencia Rossi');

  const handleSave = () => {
    Alert.alert('¡Configuración Guardada!', 'Tus datos de cobranza fueron actualizados.');
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
          <Ionicons name="flash-outline" size={18} color={method === 'mp' ? '#38BDF8' : '#94A3B8'} />
          <Text style={[styles.selectorText, method === 'mp' && { color: '#38BDF8' }]}>
            Split Mercado Pago (Instantáneo)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.selectorBtn, method === 'cbu' && styles.selectorActiveCbu]}
          onPress={() => setMethod('cbu')}
        >
          <Ionicons name="calendar-outline" size={18} color={method === 'cbu' ? '#F59E0B' : '#94A3B8'} />
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
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text style={styles.mpStatusText}>Cuenta MP Vinculada (OAuth) 🟢</Text>
          </View>
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
            placeholderTextColor="#64748B"
          />

          <Text style={styles.inputLabel}>Alias CBU</Text>
          <TextInput
            style={styles.input}
            value={alias}
            onChangeText={setAlias}
            placeholder="TU.ALIAS.MP"
            placeholderTextColor="#64748B"
          />

          <Text style={styles.inputLabel}>Titular de la Cuenta</Text>
          <TextInput
            style={styles.input}
            value={holder}
            onChangeText={setHolder}
            placeholder="Nombre y Apellido"
            placeholderTextColor="#64748B"
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
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 16 },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  headerSub: { color: '#94A3B8', fontSize: 12, marginBottom: 16 },
  selectorContainer: { gap: 10, marginBottom: 20 },
  selectorBtn: { backgroundColor: '#1E293B', padding: 16, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#334155' },
  selectorActiveMp: { borderColor: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.1)' },
  selectorActiveCbu: { borderColor: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.1)' },
  selectorText: { color: '#94A3B8', fontSize: 13, fontWeight: '700' },
  cardMp: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#38BDF8', marginBottom: 20 },
  cardCbu: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F59E0B', marginBottom: 20 },
  cardTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', marginBottom: 6 },
  cardDesc: { color: '#94A3B8', fontSize: 12, lineHeight: 18, marginBottom: 14 },
  mpStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: 10, borderRadius: 10 },
  mpStatusText: { color: '#10B981', fontSize: 12, fontWeight: '800' },
  inputLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '800', marginBottom: 4, marginTop: 10 },
  input: { backgroundColor: '#0F172A', borderRadius: 10, padding: 12, color: '#FFFFFF', fontSize: 13, borderWidth: 1, borderColor: '#334155' },
  saveBtn: { backgroundColor: '#A855F7', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
});
