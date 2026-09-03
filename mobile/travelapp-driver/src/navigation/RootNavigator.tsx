import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { User, onAuthStateChanged } from 'firebase/auth';
import { ActivityIndicator, View } from 'react-native';
import { auth } from '../lib/firebase';
import { Colors } from '../lib/constants';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import TripRequestScreen from '../screens/TripRequestScreen';
import ActiveTripScreen from '../screens/ActiveTripScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import WalletScreen from '../screens/WalletScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ScheduleScreen from '../screens/ScheduleScreen';

import { registerForPushNotificationsAsync } from '../lib/notifications';
import * as Notifications from 'expo-notifications';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const [user, setUser] = useState<User | null>(null);
  const [sessionVerified, setSessionVerified] = useState(false);
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

            if (u) {
              registerForPushNotificationsAsync(u.uid);
            }
          }
        },
        (error) => {
          console.warn('Auth state error in driver app:', error);
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

    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('[Driver Notification Tapped]', data);
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      unsub();
      responseListener.remove();
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary }}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user || !sessionVerified ? (
          <Stack.Screen name="Login">
            {(props) => (
              <LoginScreen
                {...props}
                onLoginSuccess={() => setSessionVerified(true)}
              />
            )}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen
              name="TripRequest"
              component={TripRequestScreen}
              options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen name="ActiveTrip" component={ActiveTripScreen} />
            <Stack.Screen name="Schedule" component={ScheduleScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Wallet" component={WalletScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
