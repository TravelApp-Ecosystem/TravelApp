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

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Timer de seguridad: desbloquea la app a los 3.5s si el listener de auth demora o falla
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
          console.warn('Auth state error in client app:', error);
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
