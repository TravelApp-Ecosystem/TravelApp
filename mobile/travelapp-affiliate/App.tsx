import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/HomeScreen';
import BookingsScreen from './src/screens/BookingsScreen';
import PayoutConfigScreen from './src/screens/PayoutConfigScreen';
import PromoMediaScreen from './src/screens/PromoMediaScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: { backgroundColor: '#0F172A' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: 'bold' },
            contentStyle: { backgroundColor: '#0F172A' },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'TravelApp Partners' }}
          />
          <Stack.Screen 
            name="Bookings" 
            component={BookingsScreen} 
            options={{ title: 'Reservas & Comisiones' }}
          />
          <Stack.Screen 
            name="PayoutConfig" 
            component={PayoutConfigScreen} 
            options={{ title: 'Configuración de Cobro' }}
          />
          <Stack.Screen 
            name="PromoMedia" 
            component={PromoMediaScreen} 
            options={{ title: 'Material Promocional' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
