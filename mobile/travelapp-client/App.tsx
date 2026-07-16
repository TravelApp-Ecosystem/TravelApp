import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View, StyleSheet, Text, Animated } from 'react-native';
import { useFonts, Quicksand_400Regular, Quicksand_500Medium, Quicksand_600SemiBold, Quicksand_700Bold } from '@expo-google-fonts/quicksand';
import { Ionicons } from '@expo/vector-icons';
import RootNavigator from './src/navigation/RootNavigator';
import { Colors } from './src/lib/constants';
import { TravelCabLogo, TravelAppLogo } from './src/components/BrandLogos';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Quicksand-Regular': Quicksand_400Regular,
    'Quicksand-Medium': Quicksand_500Medium,
    'Quicksand-SemiBold': Quicksand_600SemiBold,
    'Quicksand-Bold': Quicksand_700Bold,
  });

  const [showSplash, setShowSplash] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const [activeIcon, setActiveIcon] = useState<'car' | 'briefcase' | 'airplane' | 'business' | 'gift' | 'logo'>('car');
  const iconAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (fontsLoaded) {
      // Secuencia animada de iconos (auto, valija, avion, hotel, rewards, logo)
      const t1 = setTimeout(() => setActiveIcon('briefcase'), 400);
      const t2 = setTimeout(() => setActiveIcon('airplane'), 800);
      const t3 = setTimeout(() => setActiveIcon('business'), 1200);
      const t4 = setTimeout(() => setActiveIcon('gift'), 1600);
      const t5 = setTimeout(() => setActiveIcon('logo'), 2000);

      // Desvanecer splash a los 3000ms
      const timer = setTimeout(() => {
        Animated.timing(splashOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setShowSplash(false);
        });
      }, 3000);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        clearTimeout(t5);
        clearTimeout(timer);
      };
    }
  }, [fontsLoaded]);

  useEffect(() => {
    // Animación de pulso/rebote al cambiar de icono
    iconAnim.setValue(0.3);
    Animated.spring(iconAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [activeIcon]);

  if (!fontsLoaded) {
    return (
      <View style={[styles.splashContainer, { backgroundColor: Colors.primary }]}>
        <ActivityIndicator size="large" color={Colors.white} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={{ flex: 1 }}>
        <RootNavigator />

        {showSplash && (
          <Animated.View style={[styles.splashContainer, { opacity: splashOpacity }]}>
            {/* Logo Central o Icono Animado */}
            <View style={styles.centerContainer}>
              <Animated.View style={{ transform: [{ scale: iconAnim }] }}>
                {activeIcon === 'car' && (
                  <Ionicons name="car-outline" size={85} color={Colors.white} />
                )}
                {activeIcon === 'briefcase' && (
                  <Ionicons name="briefcase-outline" size={85} color={Colors.white} />
                )}
                {activeIcon === 'airplane' && (
                  <Ionicons name="airplane-outline" size={85} color={Colors.white} />
                )}
                {activeIcon === 'business' && (
                  <Ionicons name="business-outline" size={85} color={Colors.white} />
                )}
                {activeIcon === 'gift' && (
                  <Ionicons name="gift-outline" size={85} color={Colors.white} />
                )}
                {activeIcon === 'logo' && (
                  <TravelCabLogo size={95} textColor={Colors.white} isAccentColor={false} />
                )}
              </Animated.View>
            </View>

            {/* Footer en Blanco */}
            <View style={styles.footerContainer}>
              <View style={styles.appLogoRow}>
                <TravelAppLogo size={20} textColor={Colors.white} isAccentColor={false} />
                <Text style={styles.footerTextMuted}>Miembro del ecosistema TravelApp</Text>
              </View>
              <Text style={styles.copyrightText}>
                Todos los derechos reservados TravelApp s.a.s. - 2026 - Versión 1.1
              </Text>
            </View>
          </Animated.View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0A2A5B', // Fondo Azul Tech
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 60,
    zIndex: 9999,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerContainer: {
    alignItems: 'center',
    gap: 4,
    width: '100%',
  },
  footerTextMuted: {
    fontSize: 13,
    fontFamily: 'Quicksand-Medium',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
  },
  appLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  copyrightText: {
    fontSize: 10,
    fontFamily: 'Quicksand-Regular',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 4,
  },
});
