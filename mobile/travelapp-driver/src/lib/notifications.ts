import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// 1. Configurar el comportamiento cuando la app recibe una notificación en primer plano (con protección contra errores)
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (e) {
  console.warn('[Driver Notifications] setNotificationHandler skipped:', e);
}

export async function registerForPushNotificationsAsync(driverId?: string): Promise<string | null> {
  let token: string | null = null;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'General',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync('trip_requests', {
        name: 'Solicitudes de Viaje y Despachos',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 1000, 500, 1000],
        lightColor: '#EF4444',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Push Notifications Driver] Permiso de notificaciones no concedido.');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '981daf60-ddc3-4651-9f8f-34fb64cf612b',
    }).catch(async () => {
      return await Notifications.getExpoPushTokenAsync({
        projectId: '981daf60-ddc3-4651-9f8f-34fb64cf612b',
      });
    });

    token = tokenData.data;
    console.log('[Push Notifications Driver] Token obtenido:', token);

    if (driverId && token) {
      await saveDriverPushToken(driverId, token);
    }
  } catch (error) {
    console.warn('[Push Notifications Driver] Error al registrar push token:', error);
  }

  return token;
}

export async function saveDriverPushToken(driverId: string, token: string) {
  try {
    const driverRef = doc(db, 'drivers', driverId);
    const snap = await getDoc(driverRef);
    if (snap.exists()) {
      await updateDoc(driverRef, {
        expoPushToken: token,
        pushToken: token,
        pushTokenUpdatedAt: new Date().toISOString(),
      });
    } else {
      await setDoc(driverRef, {
        expoPushToken: token,
        pushToken: token,
        pushTokenUpdatedAt: new Date().toISOString(),
      }, { merge: true });
    }
    console.log(`[Push Notifications Driver] Token guardado en Firestore (drivers/${driverId})`);
  } catch (err) {
    console.warn('[Push Notifications Driver] Error guardando token en Firestore:', err);
  }
}
