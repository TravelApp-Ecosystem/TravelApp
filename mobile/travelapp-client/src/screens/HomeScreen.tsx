import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Animated,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../lib/firebase';
import { Colors } from '../lib/constants';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [destination, setDestination] = useState('');
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      }
      setLoading(false);
      Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, delay: 300 }).start();
    })();
  }, []);

  const user = auth.currentUser;
  const firstName = user?.displayName?.split(' ')[0] || 'Pasajero';

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Obteniendo tu ubicación...</Text>
        </View>
      ) : (
        <>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: location?.coords.latitude ?? -31.4167,
              longitude: location?.coords.longitude ?? -64.1833,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {location && (
              <Marker
                coordinate={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                }}
                title="Tu ubicación"
              />
            )}
          </MapView>

          {/* Header flotante */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>¡Hola, {firstName}! 👋</Text>
              <Text style={styles.subtitle}>¿A dónde vas hoy?</Text>
            </View>
            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => navigation.navigate('Profile')}>
              <Ionicons name="person-circle" size={42} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Panel inferior */}
          <Animated.View
            style={[
              styles.bottomPanel,
              { transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }) }] },
            ]}>
            <View style={styles.handle} />

            <Text style={styles.panelTitle}>Reservar un viaje</Text>

            <TouchableOpacity
              style={styles.searchBar}
              onPress={() => navigation.navigate('RequestTrip')}>
              <Ionicons name="search" size={20} color={Colors.primary} />
              <Text style={styles.searchPlaceholder}>¿A dónde querés ir?</Text>
            </TouchableOpacity>

            {/* Accesos rápidos */}
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('RequestTrip')}>
                <View style={[styles.quickIcon, { backgroundColor: Colors.primary + '15' }]}>
                  <Ionicons name="car" size={22} color={Colors.primary} />
                </View>
                <Text style={styles.quickLabel}>TravelCab</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('Chat')}>
                <View style={[styles.quickIcon, { backgroundColor: Colors.accent + '20' }]}>
                  <Ionicons name="chatbubble-ellipses" size={22} color={Colors.accent} />
                </View>
                <Text style={styles.quickLabel}>Travis IA</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('Rewards')}>
                <View style={[styles.quickIcon, { backgroundColor: Colors.success + '15' }]}>
                  <Ionicons name="star" size={22} color={Colors.success} />
                </View>
                <Text style={styles.quickLabel}>Rewards</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('History')}>
                <View style={[styles.quickIcon, { backgroundColor: '#8B5CF6' + '15' }]}>
                  <Ionicons name="time" size={22} color="#8B5CF6" />
                </View>
                <Text style={styles.quickLabel}>Historial</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  map: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: Colors.textSecondary, fontSize: 15 },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: Colors.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  greeting: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  profileBtn: {},
  bottomPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 20, elevation: 10,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 20,
  },
  panelTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 14 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.background, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1.5, borderColor: Colors.border, marginBottom: 20,
  },
  searchPlaceholder: { color: Colors.textMuted, fontSize: 15 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between' },
  quickItem: { alignItems: 'center', flex: 1, gap: 8 },
  quickIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
});
