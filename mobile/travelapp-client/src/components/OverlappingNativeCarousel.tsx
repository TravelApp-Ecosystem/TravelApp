import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  Linking,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../lib/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.84;
const CARD_MARGIN = 10;
const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN * 2;

export interface PromoCardItem {
  title: string;
  badge?: string;
  subtitle?: string;
  description?: string;
  imageUrl: string;
  url: string;
  ctaText?: string;
}

interface OverlappingNativeCarouselProps {
  cards: PromoCardItem[];
  title?: string;
  subtitle?: string;
  onSeeMore?: () => void;
  badgeColor?: string;
}

export const OverlappingNativeCarousel: React.FC<OverlappingNativeCarouselProps> = ({
  cards = [],
  title = 'Novedades del Ecosistema',
  subtitle = 'Deslizá para descubrir promociones exclusivas',
  onSeeMore,
  badgeColor = '#FF6B00',
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  if (!cards || cards.length === 0) return null;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / SNAP_INTERVAL);
    if (index >= 0 && index < cards.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const handleCardPress = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(err => console.warn('Could not open URL:', err));
    }
  };

  return (
    <View style={styles.container}>
      {/* Header de la sección */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="sparkles" size={16} color={badgeColor} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
          {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
        </View>

        {onSeeMore && (
          <TouchableOpacity onPress={onSeeMore} style={styles.seeMoreBtn}>
            <Text style={[styles.seeMoreText, { color: badgeColor }]}>Ver todo</Text>
            <Ionicons name="chevron-forward" size={14} color={badgeColor} />
          </TouchableOpacity>
        )}
      </View>

      {/* Carrusel de Tarjetas Deslizables */}
      <FlatList
        ref={flatListRef}
        data={cards}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => {
          const isFocused = index === activeIndex;
          const displayBadge = item.badge || (index === 0 ? '🎁 REWARDS' : '✨ DESTACADO');
          const displayCta = item.ctaText || 'Ver Beneficio';
          const displaySubtitle = item.subtitle || item.description || '';

          return (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleCardPress(item.url)}
              style={[
                styles.cardContainer,
                isFocused ? styles.cardFocused : styles.cardUnfocused,
              ]}
            >
              {/* Imagen de Fondo */}
              <Image source={{ uri: item.imageUrl }} style={styles.cardImage} resizeMode="cover" />

              {/* Degradado / Máscara Oscura para Contraste */}
              <View style={styles.cardGradientMask} />

              {/* Contenido Superior: Badge & Contador */}
              <View style={styles.cardTopRow}>
                <View style={[styles.badgePill, { backgroundColor: 'rgba(255, 255, 255, 0.25)' }]}>
                  <Ionicons name="pricetag" size={11} color="#FFD166" style={{ marginRight: 4 }} />
                  <Text style={styles.badgeText}>{displayBadge}</Text>
                </View>

                <View style={styles.counterPill}>
                  <Text style={styles.counterText}>{index + 1}/{cards.length}</Text>
                </View>
              </View>

              {/* Contenido Inferior: Título, Subtítulo y Botón CTA */}
              <View style={styles.cardBottomContainer}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                {displaySubtitle ? (
                  <Text style={styles.cardSubtitle} numberOfLines={2}>{displaySubtitle}</Text>
                ) : null}

                <View style={styles.ctaRow}>
                  <View style={styles.ctaButton}>
                    <Text style={styles.ctaButtonText}>{displayCta}</Text>
                    <Ionicons name="arrow-forward" size={12} color={Colors.white} style={{ marginLeft: 4 }} />
                  </View>
                  <Text style={styles.footerBrand}>TravelApp Ecosystem</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Indicadores de Puntos (Dots) */}
      <View style={styles.dotsRow}>
        {cards.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex
                ? [styles.activeDot, { backgroundColor: badgeColor }]
                : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
    fontWeight: '800',
    color: '#0B192C',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontFamily: 'Quicksand-Medium',
    color: '#64748B',
    marginTop: 1,
  },
  seeMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  seeMoreText: {
    fontSize: 12,
    fontFamily: 'Quicksand-Bold',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: 180,
    marginHorizontal: CARD_MARGIN,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    justifyContent: 'space-between',
    padding: 14,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  cardFocused: {
    transform: [{ scale: 1.0 }],
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  cardUnfocused: {
    transform: [{ scale: 0.94 }],
    opacity: 0.88,
  },
  cardImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  cardGradientMask: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 25, 44, 0.65)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontFamily: 'Quicksand-Bold',
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  counterPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  counterText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 10,
    fontFamily: 'Quicksand-SemiBold',
    fontWeight: '700',
  },
  cardBottomContainer: {
    zIndex: 2,
  },
  cardTitle: {
    color: Colors.white,
    fontSize: 17,
    fontFamily: 'Quicksand-Bold',
    fontWeight: '800',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cardSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontFamily: 'Quicksand-Medium',
    lineHeight: 15,
    marginBottom: 8,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  ctaButtonText: {
    color: Colors.white,
    fontSize: 11,
    fontFamily: 'Quicksand-Bold',
    fontWeight: '800',
  },
  footerBrand: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 9,
    fontFamily: 'Quicksand-SemiBold',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 5,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  activeDot: {
    width: 18,
  },
  inactiveDot: {
    width: 5,
    backgroundColor: '#CBD5E1',
  },
});
