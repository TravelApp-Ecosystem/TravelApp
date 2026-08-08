import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DriversListScreen({ navigation }: any) {
  const [search, setSearch] = useState('');

  const drivers = [
    { id: 'DRV-001', name: 'Carlos Mamani', vehicle: 'VW Gol Trend (AB 123 CD)', status: 'Activo', cashBalance: 42500, tripsMonth: 84 },
    { id: 'DRV-003', name: 'Jorge Ruiz', vehicle: 'Toyota Corolla (GH 789 IJ)', status: 'Activo', cashBalance: 61000, tripsMonth: 112 },
    { id: 'DRV-005', name: 'Mariano Silva', vehicle: 'Fiat Cronos (AB 456 EF)', status: 'Activo', cashBalance: 29800, tripsMonth: 65 },
    { id: 'DRV-007', name: 'Valeria Luna', vehicle: 'Chevrolet Onix (DC 789 GH)', status: 'En Ruta', cashBalance: 38900, tripsMonth: 78 },
    { id: 'DRV-009', name: 'Esteban Morales', vehicle: 'Renault Logan (AE 112 KL)', status: 'Inactivo', cashBalance: 12000, tripsMonth: 42 },
  ];

  const filtered = drivers.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.vehicle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#94A3B8" />
        <TextInput
          placeholder="Buscar chofer por nombre o patente..."
          placeholderTextColor="#64748B"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('DriverDetail', { driver: item })}
          >
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.driverName}>{item.name}</Text>
                <Text style={styles.driverId}>{item.id} · {item.vehicle}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: item.status === 'Inactivo' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)' }]}>
                <Text style={[styles.statusText, { color: item.status === 'Inactivo' ? '#EF4444' : '#10B981' }]}>
                  {item.status}
                </Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.footerLabel}>SALDO BILLETERA</Text>
                <Text style={styles.footerValue}>${item.cashBalance.toLocaleString('es-AR')}</Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.footerLabel}>VIAJES REALIZADOS</Text>
                <Text style={styles.footerValue}>{item.tripsMonth} viajes</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#334155', marginBottom: 16 },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 13, marginLeft: 8 },
  list: { paddingBottom: 20 },
  card: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  driverName: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  driverId: { color: '#94A3B8', fontSize: 11, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: '800' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#334155' },
  footerLabel: { color: '#64748B', fontSize: 9, fontWeight: '800' },
  footerValue: { color: '#F1F5F9', fontSize: 13, fontWeight: '700', marginTop: 2 },
});
