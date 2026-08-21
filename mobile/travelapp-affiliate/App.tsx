import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View, StyleSheet, Text, Animated, ImageBackground } from 'react-native';
import { useFonts, Quicksand_400Regular, Quicksand_500Medium, Quicksand_600SemiBold, Quicksand_700Bold } from '@expo-google-fonts/quicksand';
import { Ionicons } from '@expo/vector-icons';
import RootNavigator from './src/navigation/RootNavigator';
import { TravelExperienceLogo, TravelAppLogo } from './src/components/BrandLogos';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Quicksand-Regular': Quicksand_400Regular,
    'Quicksand-Medium': Quicksand_500Medium,
    'Quicksand-SemiBold': Quicksand_600SemiBold,
    'Quicksand-Bold': Quicksand_700Bold,
  });

  const [showSplash, setShowSplash] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const [activeIcon, setActiveIcon] = useState<'camera' | 'briefcase' | 'airplane' | 'gift' | 'logo'>('camera');
  const iconAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Secuencia animada de iconos (Camara -> Maletin -> Avion -> Regalo -> Logo Experience)
      const t1 = setTimeout(() => setActiveIcon('briefcase'), 500);
      const t2 = setTimeout(() => setActiveIcon('airplane'), 1000);
      const t3 = setTimeout(() => setActiveIcon('gift'), 1500);
      const t4 = setTimeout(() => setActiveIcon('logo'), 2000);

      // Desvanecer splash a los 3200ms
      const timer = setTimeout(() => {
        Animated.timing(splashOpacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }).start(() => {
          setShowSplash(false);
        });
      }, 3200);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        clearTimeout(timer);
      };
    }
  }, [fontsLoaded, fontError]);

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

  if (!fontsLoaded && !fontError) {
    return (
      <View style={[styles.splashContainer, { backgroundColor: '#1E1B4B' }]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={{ flex: 1 }}>
        
        {/* Navegador principal con autenticación */}
        <RootNavigator />

        {/* SPLASH SCREEN ANIMADO CON FONDO DE IMAGEN & SUPERPOSICIÓN DE MARCA */}
        {showSplash && (
          <Animated.View style={[styles.splashOverlayContainer, { opacity: splashOpacity }]}>
            <ImageBackground
              source={require('./assets/splash_bg.png')}
              style={styles.imageBackground}
              resizeMode="cover"
            >
              {/* Overlay Azul Tech Semitransparente para Legibilidad */}
              <View style={styles.darkOverlay}>
                
                {/* Logo Central o Icono Animado */}
                <View style={styles.centerContainer}>
                  <Animated.View style={{ transform: [{ scale: iconAnim }] }}>
                    {activeIcon === 'camera' && (
                      <Ionicons name="camera-outline" size={85} color="#FFFFFF" />
                    )}
                    {activeIcon === 'briefcase' && (
                      <Ionicons name="briefcase-outline" size={85} color="#FFFFFF" />
                    )}
                    {activeIcon === 'airplane' && (
                      <Ionicons name="airplane-outline" size={85} color="#FFFFFF" />
                    )}
                    {activeIcon === 'gift' && (
                      <Ionicons name="gift-outline" size={85} color="#FFFFFF" />
                    )}
                    {activeIcon === 'logo' && (
                      <TravelExperienceLogo size={220} />
                    )}
                  </Animated.View>
                </View>

                {/* Footer idéntico a TravelCab con Leyenda Ecosistema */}
                <View style={styles.footerContainer}>
                  <Text style={styles.ecosystemLabel}>Miembro del ecosistema</Text>
                  <View style={styles.appLogoRow}>
                    <TravelAppLogo size={140} textColor="#FFFFFF" />
                  </View>
                  <Text style={styles.copyrightText}>
                    Todos los derechos reservados TravelApp s.a.s. - 2026 - Versión 1.1
                  </Text>
                </View>

              </View>
            </ImageBackground>
          </Animated.View>
        )}

      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashOverlayContainer: {
    ...StyleSheet.absoluteFill,
    zIndex: 99999,
  },
  splashContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#1E1B4B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  darkOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 27, 75, 0.88)',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 20,
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
  ecosystemLabel: {
    fontSize: 12,
    fontFamily: 'Quicksand-Medium',
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  appLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  copyrightText: {
    fontSize: 10,
    fontFamily: 'Quicksand-Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 4,
  },
});
