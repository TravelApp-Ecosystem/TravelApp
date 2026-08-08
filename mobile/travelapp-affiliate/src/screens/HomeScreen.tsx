import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }: any) {
  const [copied, setCopied] = useState(false);

  const creator = {
    name: 'María Florencia Travel',
    tierName: 'Level 2: Pro Creator',
    commissionPct: 5.0,
    couponCode: 'FLOR10OFF',
    couponDiscountPct: 10,
    shareUrl: 'https://afiliados.travelapp.ar?ref=FLOR_TRAVEL',
    totalEarned: 48000,
    walletBalance: 48000,
    totalBookings: 8,
    nextTierMinBookings: 11,
    rewardsPoints: 2000,
  };

  const handleCopyLink = () => {
    setCopied(true);
    Alert.alert('¡Enlace Copiado!', 'Tu enlace de afiliado se copió al portapapeles.');
    setTimeout(() => setCopied(false), 2000);
  };

  const progressPct = Math.min(100, Math.round((creator.totalBookings / creator.nextTierMinBookings) * 100));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.badge}>EMBAJADOR DE EXPERIENCIAS</Text>
          <Text style={styles.greeting}>{creator.name}</Text>
          <Text style={styles.subgreeting}>Nivel: <Text style={{ color: '#F59E0B', fontWeight: '800' }}>{creator.tierName}</Text></Text>
        </View>
        <TouchableOpacity style={styles.shareIconBtn} onPress={handleCopyLink}>
          <Ionicons name={copied ? 'checkmark-circle' : 'share-social-outline'} size={24} color="#A855F7" />
        </TouchableOpacity>
      </View>

      {/* Wallet Card */}
      <View style={styles.walletCard}>
        <Text style={styles.cardLabel}>COMISIONES ACUMULADAS</Text>
        <Text style={styles.cardAmount}>${creator.walletBalance.toLocaleString('es-AR')}</Text>
        <Text style={styles.cardSub}>Comisión por Cuota: <Text style={{ color: '#10B981', fontWeight: '800' }}>{creator.commissionPct}%</Text> · Points: <Text style={{ color: '#F59E0B', fontWeight: '800' }}>+{creator.rewardsPoints}</Text></Text>

        <TouchableOpacity 
          style={styles.payoutBtn}
          onPress={() => navigation.navigate('PayoutConfig')}
        >
          <Text style={styles.payoutBtnText}>Configurar Método de Cobro (MP / CBU)</Text>
        </TouchableOpacity>
      </View>

      {/* Gamified Level Progress */}
      <View style={styles.levelCard}>
        <View style={styles.levelHeader}>
          <Text style={styles.levelTitle}>Progreso a Level 3: Master Partner (7%)</Text>
          <Text style={styles.levelCount}>{creator.totalBookings} / {creator.nextTierMinBookings} reservas</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
        </View>
        <Text style={styles.levelSub}>¡Faltan solo {creator.nextTierMinBookings - creator.totalBookings} reservas para subir al 7% de comisión!</Text>
      </View>

      {/* Coupon Card */}
      <View style={styles.couponCard}>
        <Text style={styles.couponHeader}>TU CUPÓN DE DESCUENTO SEGUIDORES</Text>
        <Text style={styles.couponDiscount}>{creator.couponDiscountPct}% OFF</Text>
        <View style={styles.couponBadge}>
          <Text style={styles.couponCodeText}>{creator.couponCode}</Text>
        </View>
        <TouchableOpacity style={styles.copyBtn} onPress={handleCopyLink}>
          <Ionicons name="copy-outline" size={16} color="#FFFFFF" />
          <Text style={styles.copyBtnText}>{copied ? '¡Copiado!' : 'Copiar Enlace & Cupón'}</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Menu */}
      <Text style={styles.sectionTitle}>Acciones Rápidas</Text>

      <TouchableOpacity 
        style={styles.menuRow}
        onPress={() => navigation.navigate('Bookings')}
      >
        <View style={styles.menuIconContainer}>
          <Ionicons name="trending-up-outline" size={22} color="#A855F7" />
        </View>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuTitle}>Reservas & Split por Cuota</Text>
          <Text style={styles.menuSubtitle}>Ver ventas concretadas e ingresos acreditados</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#64748B" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.menuRow}
        onPress={() => navigation.navigate('PromoMedia')}
      >
        <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
          <Ionicons name="images-outline" size={22} color="#3B82F6" />
        </View>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuTitle}>Material Promocional Redes</Text>
          <Text style={styles.menuSubtitle}>Banners para Instagram, TikTok y WhatsApp</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#64748B" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  badge: { color: '#A855F7', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 2 },
  greeting: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  subgreeting: { color: '#94A3B8', fontSize: 12 },
  shareIconBtn: { backgroundColor: '#1E293B', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
  walletCard: { backgroundColor: '#1E293B', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#334155', marginBottom: 20 },
  cardLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '800' },
  cardAmount: { color: '#A855F7', fontSize: 32, fontWeight: '900', marginVertical: 4 },
  cardSub: { color: '#CBD5E1', fontSize: 12, marginBottom: 16 },
  payoutBtn: { backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  payoutBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  levelCard: { backgroundColor: '#1E293B', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#A855F7', marginBottom: 20 },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  levelTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  levelCount: { color: '#F59E0B', fontSize: 12, fontWeight: '900' },
  progressBarBg: { height: 10, backgroundColor: '#0F172A', borderRadius: 5, overflow: 'hidden', marginBottom: 8 },
  progressBarFill: { height: '100%', backgroundColor: '#A855F7', borderRadius: 5 },
  levelSub: { color: '#94A3B8', fontSize: 11 },
  couponCard: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#10B981', alignItems: 'center', marginBottom: 24 },
  couponHeader: { color: '#10B981', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  couponDiscount: { color: '#FFFFFF', fontSize: 36, fontWeight: '900', marginVertical: 4 },
  couponBadge: { backgroundColor: '#1E293B', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#10B981', marginBottom: 14 },
  couponCodeText: { color: '#F59E0B', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  copyBtn: { backgroundColor: '#10B981', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
  copyBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  sectionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginBottom: 12 },
  menuRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  menuIconContainer: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(168, 85, 247, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuTextContainer: { flex: 1 },
  menuTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  menuSubtitle: { color: '#94A3B8', fontSize: 11 },
});
