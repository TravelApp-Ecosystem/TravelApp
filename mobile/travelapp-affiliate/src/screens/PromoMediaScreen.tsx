import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PromoMediaScreen() {
  const assets = [
    {
      id: 'AST-01',
      title: 'Banner Instagram Story (1080x1920)',
      type: 'Imagen',
      desc: 'Plantilla en alta definición con cupón 10% OFF para publicar en Stories.',
    },
    {
      id: 'AST-02',
      title: 'Guión WhatsApp para Amigos / Clientes',
      type: 'Texto',
      desc: 'Texto pre-redactado con tu link directo para enviar por chats.',
    },
    {
      id: 'AST-03',
      title: 'Clip de Video TikTok / Reels (Catálogo Valles)',
      type: 'Video',
      desc: 'Video corto mostrando excursiones gastronómicas y bodegas.',
    },
  ];

  const handleCopyAsset = (title: string) => {
    Alert.alert('¡Recurso Copiado!', `El recurso "${title}" fue copiado al portapapeles.`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Material Promocional para Redes</Text>
      <Text style={styles.headerSub}>Banners, guiones y recursos creados para maximizar tus ventas</Text>

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
            <Ionicons name="download-outline" size={16} color="#FFFFFF" />
            <Text style={styles.copyBtnText}>Copiar / Descargar Recurso</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 16 },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  headerSub: { color: '#94A3B8', fontSize: 12, marginBottom: 16 },
  card: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  itemTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', flex: 1, marginRight: 10 },
  badge: { backgroundColor: 'rgba(59, 130, 246, 0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: '#3B82F6', fontSize: 10, fontWeight: '800' },
  itemDesc: { color: '#94A3B8', fontSize: 12, lineHeight: 18, marginBottom: 12 },
  copyBtn: { backgroundColor: '#334155', borderRadius: 10, paddingVertical: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  copyBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
});
