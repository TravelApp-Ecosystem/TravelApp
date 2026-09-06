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
    console.warn('[Notifications] Native module not available:', e);
    return null;
  }
}

/**
 * Registra el dispositivo para recibir notificaciones Push de Expo
 * y guarda el token en el documento de Firestore del usuario o conductor.
 */
export async function registerForPushNotificationsAsync(userId?: string): Promise<string | null> {
  const NotificationsModule = getNotificationsModule();
  if (isRunningInExpoGo() || !NotificationsModule) {
    console.log('[Push Notifications] Expo Go detectado o modulo no disponible: Registro remoto omitido de forma segura.');
    return null;
  }

  let token: string | null = null;

  try {
    // Configuración específica de Canales para Android (Requerido para que suene y despierte con la app cerrada)
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

      await NotificationsModule.setNotificationChannelAsync('trip_updates', {
        name: 'Actualizaciones de Viaje y Alertas',
        importance: NotificationsModule.AndroidImportance?.MAX || 4,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#10B981',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      await NotificationsModule.setNotificationChannelAsync('driver_alerts', {
        name: 'Alertas de Conductor y Nuevos Viajes',
        importance: NotificationsModule.AndroidImportance?.MAX || 4,
        vibrationPattern: [0, 800, 400, 800],
        lightColor: '#F59E0B',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    // Solicitar permisos de notificación al sistema operativo
    if (NotificationsModule.getPermissionsAsync) {
      const { status: existingStatus } = await NotificationsModule.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted' && NotificationsModule.requestPermissionsAsync) {
        const { status } = await NotificationsModule.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('[Push Notifications] Permiso de notificaciones no concedido.');
        return null;
      }
    }

    // Obtener el Expo Push Token con projectId del proyecto
    if (NotificationsModule.getExpoPushTokenAsync) {
      const tokenData = await NotificationsModule.getExpoPushTokenAsync({
        projectId: 'a687d59f-c1ec-4f94-b77f-eea980284d82',
      });

      token = tokenData?.data || null;
      console.log('[Push Notifications] Token obtenido:', token);

      // Si tenemos el ID del usuario, sincronizarlo en Firestore
      if (userId && token) {
        await savePushTokenToFirestore(userId, token);
      }
    }
  } catch (error) {
    console.warn('[Push Notifications] Error al registrar push token:', error);
  }

  return token;
}

/**
 * Escucha cuando el usuario toca una notificación para navegar a la pantalla correspondiente
 */
export function setupNotificationResponseListener(handler: (data: any) => void): { remove: () => void } {
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
    console.warn('[Push Notifications] Listener non-fatal error:', e);
    return { remove: () => {} };
  }
}

/**
 * Guarda el token en Firestore tanto en `users` como en `drivers` si aplica
 */
export async function savePushTokenToFirestore(userId: string, token: string, isDriver: boolean = false) {
  try {
    const collectionName = isDriver ? 'drivers' : 'users';
    const userRef = doc(db, collectionName, userId);
    
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      await updateDoc(userRef, {
        expoPushToken: token,
        pushToken: token,
        pushTokenUpdatedAt: new Date().toISOString(),
      });
    } else {
      await setDoc(userRef, {
        expoPushToken: token,
        pushToken: token,
        pushTokenUpdatedAt: new Date().toISOString(),
      }, { merge: true });
    }
    console.log(`[Push Notifications] Token guardado en Firestore (${collectionName}/${userId})`);
  } catch (err) {
    console.warn('[Push Notifications] Error guardando token en Firestore:', err);
  }
}

