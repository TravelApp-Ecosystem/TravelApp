import * as Speech from 'expo-speech';
import { Vibration } from 'react-native';

const getAudio = () => {
  try {
    const expoAv = require('expo-av');
    return expoAv?.Audio || null;
  } catch {
    return null;
  }
};

let alertSoundInstance: any = null;
let isAlertPlaying = false;

/**
 * Reproduce la alerta sonora fuerte y continua para el conductor cuando entra una nueva solicitud de viaje.
 * @param customAudioUrl URL opcional de archivo MP3/WAV configurado desde el Dashboard
 */
export async function playTripRequestAlertSound(customAudioUrl?: string): Promise<void> {
  try {
    if (isAlertPlaying) return;
    isAlertPlaying = true;

    // Vibración persistente de solicitud entrante
    Vibration.vibrate([0, 500, 200, 500, 200, 500], true);

    // Configurar modo de audio si el módulo está disponible
    const Audio = getAudio();
    if (Audio) {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
      } catch (modeErr) {
        console.log('Audio mode set skipped:', modeErr);
      }
    }

    // Locución hablada de alerta inmediata
    Speech.stop();
    Speech.speak('Nueva solicitud de viaje. Tocá la pantalla para aceptar.', {
      language: 'es-AR',
      rate: 1.05,
      pitch: 1.0,
    });

    // Intentar reproducir sonido de timbre/campana o URL personalizada
    if (Audio) {
      try {
        if (alertSoundInstance) {
          await alertSoundInstance.unloadAsync();
        }
        const soundUri = customAudioUrl || 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
        const { sound } = await Audio.Sound.createAsync(
          { uri: soundUri },
          { shouldPlay: true, isLooping: true, volume: 1.0 }
        );
        alertSoundInstance = sound;
        await alertSoundInstance.playAsync();
      } catch (soundErr) {
        console.log('Audio Sound create fallback to speech:', soundErr);
      }
    }
  } catch (err) {
    console.warn('Error playing trip request alert sound:', err);
  }
}

/**
 * Detiene inmediatamente el sonido de alerta de solicitud de viaje.
 */
export async function stopTripRequestAlertSound(): Promise<void> {
  try {
    isAlertPlaying = false;
    Vibration.cancel();
    Speech.stop();
    if (alertSoundInstance) {
      await alertSoundInstance.stopAsync();
      await alertSoundInstance.unloadAsync();
      alertSoundInstance = null;
    }
  } catch (err) {
    console.log('Error stopping alert sound:', err);
  }
}

/**
 * Reproduce la locución de seguridad al iniciar el viaje (Cinturón de seguridad).
 * @param customText Texto personalizado configurado desde el Dashboard
 * @param customAudioUrl URL de MP3 grabado en estudio configurado desde el Dashboard
 * @param voiceGender 'female' | 'male' para entonación femenina o masculina
 */
export async function playSeatbeltSafetyPrompt(
  customText?: string,
  customAudioUrl?: string,
  voiceGender: 'female' | 'male' = 'female'
): Promise<void> {
  try {
    const Audio = getAudio();
    if (customAudioUrl && Audio) {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: customAudioUrl },
          { shouldPlay: true, volume: 1.0 }
        );
        await sound.playAsync();
        return;
      } catch (e) {
        console.log('Custom seatbelt audio play fallback to speech:', e);
      }
    }

    const textToSpeak = customText || 'Por tu seguridad, es importante que te coloques el cinturón de seguridad y verifiques tu destino. ¡Buen viaje!';
    Speech.stop();
    Speech.speak(textToSpeak, {
      language: 'es-AR',
      rate: 0.95,
      pitch: voiceGender === 'male' ? 0.8 : 1.15,
    });
  } catch (err) {
    console.warn('Error playing seatbelt safety prompt:', err);
  }
}

/**
 * Reproduce una notificación hablada personalizada o alerta sonoro según lo enviado desde el Dashboard Web.
 */
export function playCustomVoiceNotification(text: string, voiceGender: 'female' | 'male' = 'female'): void {
  try {
    if (!text) return;
    Vibration.vibrate([0, 300, 150, 300]);
    Speech.stop();
    Speech.speak(text, {
      language: 'es-AR',
      rate: 1.0,
      pitch: voiceGender === 'male' ? 0.8 : 1.15,
    });
  } catch (err) {
    console.warn('Error playing custom voice notification:', err);
  }
}
