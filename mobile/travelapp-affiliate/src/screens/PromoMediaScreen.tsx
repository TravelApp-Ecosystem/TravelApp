import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PromoMediaScreen() {
  const catalogExperiences = [
    {
      id: 'EXP-101',
      title: 'Excursión Valles Calchaquíes & Bodegas VIP',
      location: 'Tafí del Valle & Cafayate',
      price: '$120.000',
      commission: '+$8.400',
    },
    {
      id: 'EXP-102',
      title: 'Trekking & Canopy Aventura Yungas',
      location: 'San Javier, Tucumán',
      price: '$60.000',
      commission: '+$4.200',
    },
    {
      id: 'EXP-103',
      title: 'Traslado Privado Executive TravelCab',
      location: 'Aeropuerto Tucumán ➔ Hotel',
      price: '$45.000',
      commission: '+$3.150',
    }
  ];

  const assets = [
    {
      id: 'AST-01',
      title: 'Pack Fotos HD Valles Calchaquíes & Bodegas',
      type: 'Imágenes HD',
      desc: '10 imágenes sin marca de agua en alta calidad para publicaciones e historias.',
    },
    {
      id: 'AST-02',
      title: 'Reel 9:16 Aventura Yungas (Editado)',
      type: 'Video 9:16',
      desc: 'Video vertical para Instagram Reels / TikTok con música en tendencia.',
    },
    {
      id: 'AST-03',
      title: 'Guión WhatsApp & Copy para Instagram',
      type: 'Texto Copy',
      desc: 'Texto pre-redactado con tu cupón FLOR10OFF para enviar por chats.',
    },
  ];

  const handleCopyAsset = (title: string) => {
    Alert.alert('¡Recurso Copiado!', `El recurso "${title}" se descargó / copió al portapapeles.`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* Marketplace de Viajes */}
      <Text style={styles.headerTitle}>Marketplace de Viajes de la Empresa</Text>
      <Text style={styles.headerSub}>Catálogo de experiencias corporativas para generar links directos</Text>

      {catalogExperiences.map((exp) => (
        <View key={exp.id} style={styles.expCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.itemTitle}>{exp.title}</Text>
            <Text style={styles.commBadge}>{exp.commission} (7%)</Text>
          </View>
          <Text style={styles.itemDesc}>{exp.location} · Precio: {exp.price}</Text>

          <TouchableOpacity style={styles.expBtn} onPress={() => handleCopyAsset(exp.title)}>
            <Ionicons name="share-outline" size={16} color="#FFFFFF" />
            <Text style={styles.expBtnText}>Generar Enlace de Experiencia</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Media Hub */}
      <Text style={[styles.headerTitle, { marginTop: 16 }]}>Repositorio Promocional (Media Hub)</Text>
      <Text style={styles.headerSub}>Imágenes HD, Reels 9:16 y Copys para redes sociales</Text>

      {assets.map(item => (
        <View key={item.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.type}</Text>
            </View>
          </View>
          <Text style={styles.itemDesc}>{item.desc}</Text>

          <TouchableOpacity style={styles.copyBtn} onPress={() => handleCopyAsset(item.title)}>
            <Ionicons name="cloud-download-outline" size={16} color="#FFFFFF" />
            <Text style={styles.copyBtnText}>Copiar / Descargar Recurso</Text>
          </TouchableOpacity>
        </View>
      ))}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16 },
  headerTitle: { color: '#0A2A5B', fontSize: 16, fontFamily: 'Quicksand-Bold' },
  headerSub: { color: '#64748B', fontSize: 12, fontFamily: 'Quicksand-Medium', marginBottom: 14 },
  expCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  itemTitle: { color: '#0A2A5B', fontSize: 13, fontFamily: 'Quicksand-Bold', flex: 1, marginRight: 10 },
  badge: { backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1, borderColor: '#FCA5A5' },
  badgeText: { color: '#EF4444', fontSize: 10, fontFamily: 'Quicksand-Bold' },
  commBadge: { color: '#10B981', fontSize: 12, fontFamily: 'Quicksand-Bold' },
  itemDesc: { color: '#64748B', fontSize: 11, fontFamily: 'Quicksand-Medium', marginBottom: 10 },
  expBtn: { backgroundColor: '#0A2A5B', borderRadius: 10, paddingVertical: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  expBtnText: { color: '#FFFFFF', fontSize: 11, fontFamily: 'Quicksand-Bold' },
  copyBtn: { backgroundColor: '#EF4444', borderRadius: 10, paddingVertical: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  copyBtnText: { color: '#FFFFFF', fontSize: 11, fontFamily: 'Quicksand-Bold' },
});
