import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

let _notificationsModule: any = null;
let _handlerConfigured = false;

function getNotificationsModule(): any {
  if (_notificationsModule !== null) return _notificationsModule;
  if (isRunningInExpoGo()) return null;
  try {
    _notificationsModule = require('expo-notifications');
    if (_notificationsModule && _notificationsModule.setNotificationHandler && !_handlerConfigured) {
      _notificationsModule.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      _handlerConfigured = true;
    }
    return _notificationsModule;
  } catch (e) {
    console.warn('[Driver Notifications] Native module not available:', e);
    return null;
  }
}

export async function registerForPushNotificationsAsync(driverId?: string): Promise<string | null> {
  const NotificationsModule = getNotificationsModule();
  if (isRunningInExpoGo() || !NotificationsModule) {
    console.log('[Driver Push Notifications] Expo Go detectado o modulo no disponible: Se omite registro remoto.');
    return null;
  }

  let token: string | null = null;

  try {
    if (Platform.OS === 'android' && NotificationsModule.setNotificationChannelAsync) {
      await NotificationsModule.setNotificationChannelAsync('default', {
        name: 'General',
        importance: NotificationsModule.AndroidImportance?.MAX || 4,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      await NotificationsModule.setNotificationChannelAsync('trip_requests', {
        name: 'Solicitudes de Viaje y Despachos',
        importance: NotificationsModule.AndroidImportance?.MAX || 4,
        vibrationPattern: [0, 1000, 500, 1000],
        lightColor: '#EF4444',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    if (NotificationsModule.getPermissionsAsync) {
      const { status: existingStatus } = await NotificationsModule.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted' && NotificationsModule.requestPermissionsAsync) {
        const { status } = await NotificationsModule.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('[Push Notifications Driver] Permiso de notificaciones no concedido.');
        return null;
      }
    }

    if (NotificationsModule.getExpoPushTokenAsync) {
      const tokenData = await NotificationsModule.getExpoPushTokenAsync({
        projectId: '981daf60-ddc3-4651-9f8f-34fb64cf612b',
      });

      token = tokenData?.data || null;
      console.log('[Push Notifications Driver] Token obtenido:', token);

      if (driverId && token) {
        await saveDriverPushToken(driverId, token);
      }
    }
  } catch (error) {
    console.warn('[Push Notifications Driver] Error al registrar push token:', error);
  }

  return token;
}

export function setupDriverNotificationResponseListener(handler: (data: any) => void): { remove: () => void } {
  const NotificationsModule = getNotificationsModule();
  if (isRunningInExpoGo() || !NotificationsModule || !NotificationsModule.addNotificationResponseReceivedListener) {
    return { remove: () => {} };
  }
  try {
    const sub = NotificationsModule.addNotificationResponseReceivedListener((response: any) => {
      const data = response?.notification?.request?.content?.data;
      handler(data);
    });
    return sub || { remove: () => {} };
  } catch (e) {
    console.warn('[Driver Notifications] Listener non-fatal error:', e);
    return { remove: () => {} };
  }
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

