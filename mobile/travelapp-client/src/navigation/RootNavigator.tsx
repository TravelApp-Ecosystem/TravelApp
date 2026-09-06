import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { User, onAuthStateChanged } from 'firebase/auth';
import { ActivityIndicator, View } from 'react-native';
import { auth } from '../lib/firebase';
import { Colors } from '../lib/constants';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import RequestTripScreen from '../screens/RequestTripScreen';
import TripTrackingScreen from '../screens/TripTrackingScreen';
import ChatScreen from '../screens/ChatScreen';
import HistoryScreen from '../screens/HistoryScreen';
import RewardsScreen from '../screens/RewardsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CompleteProfileScreen from '../screens/CompleteProfileScreen';

const Stack = createNativeStackNavigator();

import { registerForPushNotificationsAsync, setupNotificationResponseListener } from '../lib/notifications';

export default function RootNavigator() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const safetyTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 3500);

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (isMounted) {
        if (u) {
          setUser(u);
          setLoading(false);
          clearTimeout(safetyTimer);
          registerForPushNotificationsAsync(u.uid).catch((err) => {
            console.warn('[Push Registration non-fatal]:', err);
          });
        } else {
          // Si Firebase no tiene el usuario en memoria, verificar credenciales guardadas
          try {
            const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
            const raw = await AsyncStorage.getItem('travelapp_saved_user_credentials');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed && parsed.email && parsed.pass) {
                const { signInWithEmailAndPassword } = await import('firebase/auth');
                const res = await signInWithEmailAndPassword(auth, parsed.email, parsed.pass);
                if (res?.user && isMounted) {
                  setUser(res.user);
                  setLoading(false);
                  clearTimeout(safetyTimer);
                  return;
                }
              }
            }
          } catch (storageAuthErr) {
            console.warn('Client auto-login from storage failed:', storageAuthErr);
          }
          setUser(null);
          setLoading(false);
          clearTimeout(safetyTimer);
        }
      }
    });

    // Escuchar cuando el usuario toca una notificación (con protección contra errores)
    const responseListener = setupNotificationResponseListener((data) => {
      console.log('[Notification Tapped]', data);
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      unsub();
      if (responseListener) responseListener.remove();
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary }}>
        <ActivityIndicator size="large" color={Colors.white} />
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
            <Stack.Screen name="RequestTrip" component={RequestTripScreen} />
            <Stack.Screen name="TripTracking" component={TripTrackingScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="Rewards" component={RewardsScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
