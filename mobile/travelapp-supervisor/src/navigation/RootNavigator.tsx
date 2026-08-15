import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { User, onAuthStateChanged } from 'firebase/auth';
import { ActivityIndicator, View } from 'react-native';
import { auth } from '../lib/firebase';
import { Colors } from '../lib/constants';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import DriversListScreen from '../screens/DriversListScreen';
import DriverDetailScreen from '../screens/DriverDetailScreen';
import DocumentAlertsScreen from '../screens/DocumentAlertsScreen';
import WalletSupervisorScreen from '../screens/WalletSupervisorScreen';
import MessagingScreen from '../screens/MessagingScreen';

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
          console.warn('Auth state error in supervisor app:', error);
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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A' }}>
        <ActivityIndicator size="large" color="#38BDF8" />
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
            <Stack.Screen name="DriversList" component={DriversListScreen} />
            <Stack.Screen name="DriverDetail" component={DriverDetailScreen} />
            <Stack.Screen name="DocumentAlerts" component={DocumentAlertsScreen} />
            <Stack.Screen name="WalletSupervisor" component={WalletSupervisorScreen} />
            <Stack.Screen name="Messaging" component={MessagingScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
