import React, { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  View,
  StyleSheet,
  Text,
  Animated,
  ImageBackground,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Quicksand_400Regular,
  Quicksand_500Medium,
  Quicksand_600SemiBold,
  Quicksand_700Bold,
} from '@expo-google-fonts/quicksand';
import { Ionicons } from '@expo/vector-icons';
import RootNavigator from './src/navigation/RootNavigator';
import { Colors } from './src/lib/constants';
import { TravelCabLogo, TravelAppLogo } from './src/components/BrandLogos';

// Prevenir que el Splash nativo se oculte antes de tiempo
SplashScreen.preventAutoHideAsync().catch(() => {});

// Escudo protector raíz contra errores no controlados
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[Driver Crash Shield caught error]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>TravelApp Conductor</Text>
          <Text style={styles.errorSubtitle}>Iniciando en modo seguro...</Text>
          <ActivityIndicator size="small" color="#0A2A5B" style={{ marginTop: 16 }} />
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Quicksand-Regular': Quicksand_400Regular,
    'Quicksand-Medium': Quicksand_500Medium,
    'Quicksand-SemiBold': Quicksand_600SemiBold,
    'Quicksand-Bold': Quicksand_700Bold,
  });

  const [showSplash, setShowSplash] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const [activeIcon, setActiveIcon] = useState<'wheel' | 'speedometer' | 'navigate' | 'shield' | 'logo'>('wheel');
  const iconAnim = useRef(new Animated.Value(0.3)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Ocultar el Splash nativo apenas las fuentes o la pantalla React estén listas
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Animación de rotación continua para la rueda
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  useEffect(() => {
    // Secuencia animada de iconos para chofer (rueda girando -> velocímetro -> navegación GPS -> seguridad -> logo TravelCab)
    const t1 = setTimeout(() => setActiveIcon('speedometer'), 900);
    const t2 = setTimeout(() => setActiveIcon('navigate'), 1800);
    const t3 = setTimeout(() => setActiveIcon('shield'), 2700);
    const t4 = setTimeout(() => setActiveIcon('logo'), 3600);

    // Desvanecer splash a los 5500ms
    const timer = setTimeout(() => {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        setShowSplash(false);
      });
    }, 5500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    // Pulso al cambiar de icono
    iconAnim.setValue(0.2);
    Animated.spring(iconAnim, {
      toValue: 1,
      friction: 5,
      tension: 50,
      useNativeDriver: true,
    }).start();
  }, [activeIcon]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Si las fuentes están cargando y no hubo error, mostrar preparación silenciosa
  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#0A2A5B" />
      </View>
    );
  }

  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <RootNavigator />

          {showSplash && (
            <Animated.View style={[styles.splashOverlay, { opacity: splashOpacity }]}>
              <ImageBackground
                source={require('./assets/splash.png')}
                style={styles.backgroundImage}
                resizeMode="cover"
              >
                <View style={styles.lightMask}>
                  {/* Icono animado central o Logo TravelCab */}
                  <View style={styles.centerContainer}>
                    <Animated.View style={[styles.iconBox, activeIcon === 'logo' && styles.logoBoxReveal, { transform: [{ scale: iconAnim }] }]}>
                      {activeIcon === 'wheel' && (
                        <Animated.View style={{ transform: [{ rotate: spin }] }}>
                          <Ionicons name="disc-outline" size={90} color="#0A2A5B" />
                        </Animated.View>
                      )}
                      {activeIcon === 'speedometer' && (
                        <Ionicons name="speedometer-outline" size={90} color="#FF7A00" />
                      )}
                      {activeIcon === 'navigate' && (
                        <Ionicons name="navigate-outline" size={90} color="#0A2A5B" />
                      )}
                      {activeIcon === 'shield' && (
                        <Ionicons name="shield-checkmark-outline" size={90} color="#10B981" />
                      )}
                      {activeIcon === 'logo' && (
                        <View style={styles.logoRevealBox}>
                          <TravelCabLogo size={220} textColor="#0B192C" />
                        </View>
                      )}
                    </Animated.View>
                  </View>

                  {/* Footer del Splash */}
                  <View style={styles.footerContainer}>
                    <Text style={styles.ecosystemText}>Miembro del ecosistema</Text>
                    <View style={styles.appLogoRow}>
                      <TravelAppLogo size={140} textColor="#0B192C" />
                    </View>
                  </View>
                </View>
              </ImageBackground>
            </Animated.View>
          )}
        </View>
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0A2A5B',
    marginTop: 16,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },
  splashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 99999,
    backgroundColor: '#FFFFFF',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    flex: 1,
  },
  lightMask: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  logoBoxReveal: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
    padding: 0,
  },
  logoRevealBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  footerContainer: {
    alignItems: 'center',
    gap: 6,
    width: '100%',
    marginBottom: 20,
  },
  ecosystemText: {
    fontSize: 13,
    fontFamily: 'Quicksand-Bold',
    color: '#64748B',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  appLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
});

