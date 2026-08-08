import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/HomeScreen';
import DriversListScreen from './src/screens/DriversListScreen';
import DriverDetailScreen from './src/screens/DriverDetailScreen';
import DocumentAlertsScreen from './src/screens/DocumentAlertsScreen';
import MessagingScreen from './src/screens/MessagingScreen';
import WalletSupervisorScreen from './src/screens/WalletSupervisorScreen';

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
            options={{ title: 'TravelApp Supervisor' }}
          />
          <Stack.Screen 
            name="DriversList" 
            component={DriversListScreen} 
            options={{ title: 'Conductores a Cargo' }}
          />
          <Stack.Screen 
            name="DriverDetail" 
            component={DriverDetailScreen} 
            options={{ title: 'Detalle de Conductor' }}
          />
          <Stack.Screen 
            name="DocumentAlerts" 
            component={DocumentAlertsScreen} 
            options={{ title: 'Semáforo de Vencimientos' }}
          />
          <Stack.Screen 
            name="Messaging" 
            component={MessagingScreen} 
            options={{ title: 'Centro de Comunicados' }}
          />
          <Stack.Screen 
            name="Wallet" 
            component={WalletSupervisorScreen} 
            options={{ title: 'Liquidación de Haberes' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
