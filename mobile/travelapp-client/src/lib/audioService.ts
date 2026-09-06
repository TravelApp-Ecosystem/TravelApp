import * as Speech from 'expo-speech';
import { Vibration } from 'react-native';

/**
 * Reproduce la locución de seguridad al iniciar el viaje (Cinturón de seguridad) en la app del Pasajero.
 * @param customText Texto personalizado configurado desde el Dashboard
 * @param _customAudioUrl URL de audio (opcional)
 * @param voiceGender 'female' | 'male' para entonación femenina o masculina
 */
export async function playSeatbeltSafetyPrompt(
  customText?: string,
  _customAudioUrl?: string,
  voiceGender: 'female' | 'male' = 'female'
): Promise<void> {
  try {

    const textToSpeak = customText || 'Por tu seguridad, es importante que te coloques el cinturón de seguridad y verifiques tu destino. ¡Buen viaje en TravelApp!';
    Speech.stop();
    Speech.speak(textToSpeak, {
      language: 'es-AR',
      rate: 0.95,
      pitch: voiceGender === 'male' ? 0.8 : 1.15,
    });
  } catch (err) {
    console.warn('Error playing seatbelt safety prompt in client:', err);
  }
}

/**
 * Reproduce una notificación hablada personalizada o alerta sonoro según lo enviado desde el Dashboard Web.
 */
export function playCustomVoiceNotification(text: string, voiceGender: 'female' | 'male' = 'female'): void {
  try {
    if (!text) return;
    Vibration.vibrate([0, 250, 100, 250]);
    Speech.stop();
    Speech.speak(text, {
      language: 'es-AR',
      rate: 1.0,
      pitch: voiceGender === 'male' ? 0.8 : 1.15,
    });
  } catch (err) {
    console.warn('Error playing custom voice notification in client:', err);
  }
}
