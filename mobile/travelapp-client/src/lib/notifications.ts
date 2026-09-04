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
  console.warn('[Notifications] setNotificationHandler skipped:', e);
}

/**
 * Registra el dispositivo para recibir notificaciones Push de Expo
 * y guarda el token en el documento de Firestore del usuario o conductor.
 */
export async function registerForPushNotificationsAsync(userId?: string): Promise<string | null> {
  let token: string | null = null;

  try {
    // Configuración específica de Canales para Android (Requerido para que suene y despierte con la app cerrada)
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

      await Notifications.setNotificationChannelAsync('trip_updates', {
        name: 'Actualizaciones de Viaje y Alertas',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#10B981',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync('driver_alerts', {
        name: 'Alertas de Conductor y Nuevos Viajes',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 800, 400, 800],
        lightColor: '#F59E0B',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    // Solicitar permisos de notificación al sistema operativo
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Push Notifications] Permiso de notificaciones no concedido.');
      return null;
    }

    // Obtener el Expo Push Token con projectId del proyecto
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'a687d59f-c1ec-4f94-b77f-eea980284d82',
    }).catch(async () => {
      return await Notifications.getExpoPushTokenAsync({
        projectId: 'a687d59f-c1ec-4f94-b77f-eea980284d82',
      });
    });

    token = tokenData.data;
    console.log('[Push Notifications] Token obtenido:', token);

    // Si tenemos el ID del usuario, sincronizarlo en Firestore
    if (userId && token) {
      await savePushTokenToFirestore(userId, token);
    }
  } catch (error) {
    console.warn('[Push Notifications] Error al registrar push token:', error);
  }

  return token;
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
