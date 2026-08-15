import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { User, onAuthStateChanged } from 'firebase/auth';
import { ActivityIndicator, View } from 'react-native';
import { auth } from '../lib/firebase';
import { Colors } from '../lib/constants';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import BookingsScreen from '../screens/BookingsScreen';
import PayoutConfigScreen from '../screens/PayoutConfigScreen';
import PromoMediaScreen from '../screens/PromoMediaScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Timer de seguridad: descongela el splash screen a los 3.5s si el listener falla o demora
    const safetyTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 3500);

    let unsub = () => {};
    try {
      unsub = onAuthStateChanged(
        auth,
        (u) => {
          if (isMounted) {
            setUser(u);
            setLoading(false);
            clearTimeout(safetyTimer);
          }
        },
        (error) => {
          console.warn('Auth state error in affiliate app:', error);
          if (isMounted) {
            setLoading(false);
            clearTimeout(safetyTimer);
          }
        }
      );
    } catch (err) {
      console.warn('Auth listener mount error:', err);
      if (isMounted) {
        setLoading(false);
        clearTimeout(safetyTimer);
      }
    }

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      unsub();
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E1B4B' }}>
        <ActivityIndicator size="large" color="#818CF8" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen
              name="Bookings"
              component={BookingsScreen}
              options={{ headerShown: true, title: 'Reservas & Comisiones', headerStyle: { backgroundColor: '#1E1B4B' }, headerTintColor: '#FFFFFF' }}
            />
            <Stack.Screen
              name="PayoutConfig"
              component={PayoutConfigScreen}
              options={{ headerShown: true, title: 'Configuración de Cobro', headerStyle: { backgroundColor: '#1E1B4B' }, headerTintColor: '#FFFFFF' }}
            />
            <Stack.Screen
              name="PromoMedia"
              component={PromoMediaScreen}
              options={{ headerShown: true, title: 'Material Promocional', headerStyle: { backgroundColor: '#1E1B4B' }, headerTintColor: '#FFFFFF' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
