import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }: any) {
  const [copied, setCopied] = useState(false);

  const creator = {
    name: 'María Florencia Rossi',
    tierName: 'Level 3: Master Partner',
    commissionPct: 7.0,
    couponCode: 'FLOR10OFF',
    couponDiscountPct: 10,
    shareUrl: 'https://afiliados.travelapp.ar?ref=FLOR_TRAVEL',
    totalEarned: 98000,
    walletBalance: 98000,
    totalBookings: 14,
    nextTierMinBookings: 20,
    rewardsPoints: 3500,
    status: 'active', // 'active' | 'pending' | 'suspended'
  };

  const handleCopyLink = () => {
    setCopied(true);
    Alert.alert('¡Enlace Copiado!', 'Tu enlace de afiliado se copió al portapapeles.');
    setTimeout(() => setCopied(false), 2000);
  };

  const progressPct = Math.min(100, Math.round((creator.totalBookings / creator.nextTierMinBookings) * 100));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* Account Status Badge */}
      <View style={styles.statusBanner}>
        <Ionicons name="checkmark-circle" size={18} color="#10B981" />
        <Text style={styles.statusText}>Cuenta Aprobada & Habilitada para Operar</Text>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.badge}>EMBAJADOR DE EXPERIENCIAS</Text>
          <Text style={styles.greeting}>{creator.name}</Text>
          <Text style={styles.subgreeting}>Nivel: <Text style={{ color: '#EF4444', fontFamily: 'Quicksand-Bold' }}>{creator.tierName}</Text></Text>
        </View>
        <TouchableOpacity style={styles.shareIconBtn} onPress={handleCopyLink}>
          <Ionicons name={copied ? 'checkmark-circle' : 'share-social-outline'} size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Wallet Card */}
      <View style={styles.walletCard}>
        <Text style={styles.cardLabel}>COMISIONES ACUMULADAS</Text>
        <Text style={styles.cardAmount}>${creator.walletBalance.toLocaleString('es-AR')}</Text>
        <Text style={styles.cardSub}>Comisión por Cuota: <Text style={{ color: '#10B981', fontFamily: 'Quicksand-Bold' }}>{creator.commissionPct}%</Text> · Points: <Text style={{ color: '#F59E0B', fontFamily: 'Quicksand-Bold' }}>+{creator.rewardsPoints}</Text></Text>

        <TouchableOpacity 
          style={styles.payoutBtn}
          onPress={() => navigation.navigate('PayoutConfig')}
        >
          <Text style={styles.payoutBtnText}>Vinculación de Cobro (Split MP / CBU)</Text>
        </TouchableOpacity>
      </View>

      {/* Level Progress */}
      <View style={styles.levelCard}>
        <View style={styles.levelHeader}>
          <Text style={styles.levelTitle}>Progreso a Level 4: VIP Ambassador (10%)</Text>
          <Text style={styles.levelCount}>{creator.totalBookings} / {creator.nextTierMinBookings} reservas</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
        </View>
        <Text style={styles.levelSub}>¡Faltan solo {creator.nextTierMinBookings - creator.totalBookings} reservas para subir al 10% de comisión!</Text>
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
          <Ionicons name="trending-up-outline" size={22} color="#EF4444" />
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
        <View style={styles.menuIconContainer}>
          <Ionicons name="images-outline" size={22} color="#EF4444" />
        </View>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuTitle}>Media Hub & Repositorio Promocional</Text>
          <Text style={styles.menuSubtitle}>Descargar imágenes HD, Reels y Copys para redes</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#64748B" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.menuRow}
        onPress={() => navigation.navigate('PayoutConfig')}
      >
        <View style={styles.menuIconContainer}>
          <Ionicons name="flash-outline" size={22} color="#009EE3" />
        </View>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuTitle}>Mercado Pago OAuth & CBU</Text>
          <Text style={styles.menuSubtitle}>Configurar split automático instantáneo</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#64748B" />
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Quicksand-Bold',
    color: '#065F46',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    fontSize: 10,
    fontFamily: 'Quicksand-Bold',
    color: '#EF4444',
    letterSpacing: 1,
  },
  greeting: {
    fontSize: 22,
    fontFamily: 'Quicksand-Bold',
    color: '#0A2A5B',
    marginTop: 2,
  },
  subgreeting: {
    fontSize: 12,
    fontFamily: 'Quicksand-Medium',
    color: '#64748B',
    marginTop: 2,
  },
  shareIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletCard: {
    backgroundColor: '#0A2A5B',
    borderRadius: 20,
    padding: 20,
    gap: 8,
  },
  cardLabel: {
    fontSize: 10,
    fontFamily: 'Quicksand-Bold',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  cardAmount: {
    fontSize: 32,
    fontFamily: 'Quicksand-Bold',
    color: '#F59E0B',
  },
  cardSub: {
    fontSize: 12,
    fontFamily: 'Quicksand-Medium',
    color: '#CBD5E1',
  },
  payoutBtn: {
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  payoutBtnText: {
    fontSize: 12,
    fontFamily: 'Quicksand-Bold',
    color: '#FFFFFF',
  },
  levelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 8,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelTitle: {
    fontSize: 12,
    fontFamily: 'Quicksand-Bold',
    color: '#0A2A5B',
  },
  levelCount: {
    fontSize: 11,
    fontFamily: 'Quicksand-Bold',
    color: '#EF4444',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0A2A5B',
    borderRadius: 10,
  },
  levelSub: {
    fontSize: 11,
    fontFamily: 'Quicksand-Medium',
    color: '#64748B',
  },
  couponCard: {
    backgroundColor: '#065F46',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  couponHeader: {
    fontSize: 10,
    fontFamily: 'Quicksand-Bold',
    color: '#A7F3D0',
    letterSpacing: 1,
  },
  couponDiscount: {
    fontSize: 34,
    fontFamily: 'Quicksand-Bold',
    color: '#FFFFFF',
  },
  couponBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
    marginVertical: 4,
  },
  couponCodeText: {
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
    color: '#FDE047',
    letterSpacing: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  copyBtnText: {
    fontSize: 12,
    fontFamily: 'Quicksand-Bold',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Quicksand-Bold',
    color: '#0A2A5B',
    marginTop: 8,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  menuIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 13,
    fontFamily: 'Quicksand-Bold',
    color: '#0A2A5B',
  },
  menuSubtitle: {
    fontSize: 11,
    fontFamily: 'Quicksand-Medium',
    color: '#64748B',
    marginTop: 1,
  },
});
