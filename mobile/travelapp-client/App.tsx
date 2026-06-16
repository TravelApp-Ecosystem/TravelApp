import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View, StyleSheet, Text, Animated } from 'react-native';
import { useFonts, Quicksand_400Regular, Quicksand_500Medium, Quicksand_600SemiBold, Quicksand_700Bold } from '@expo-google-fonts/quicksand';
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

  useEffect(() => {
    if (fontsLoaded) {
      // Mostrar splash durante 3 segundos, luego desvanecer en 500ms
      const timer = setTimeout(() => {
        Animated.timing(splashOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setShowSplash(false);
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded]);

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
            {/* Logo Central en Blanco */}
            <View style={styles.centerContainer}>
              <TravelCabLogo size={90} textColor={Colors.white} isAccentColor={false} />
            </View>

            {/* Footer en Blanco */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerTextMuted}>Una empresa del ecosistema</Text>
              <View style={styles.appLogoRow}>
                <TravelAppLogo size={26} textColor={Colors.white} isAccentColor={false} />
              </View>
              <Text style={styles.copyrightText}>
                Todos los derechos reservados TravelApp s.a.s. - versión 1.1
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
    gap: 8,
    width: '100%',
  },
  footerTextMuted: {
    fontSize: 13,
    fontFamily: 'Quicksand-Medium',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
  },
  appLogoRow: {
    marginVertical: 4,
  },
  copyrightText: {
    fontSize: 10,
    fontFamily: 'Quicksand-Regular',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 8,
  },
});
