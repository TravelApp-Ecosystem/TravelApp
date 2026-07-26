'use client';

import { useEffect } from 'react';
import { startTripAlert, stopTripAlert } from '@/lib/soundAlerts';

interface UseTripAlertSoundOptions {
  soundFrequencyHigh?: number;
  soundFrequencyLow?: number;
  vibrationPattern?: number[];
  maxDurationMs?: number;
}

/**
 * Hook de React para activar alertas de sonido y vibración con limpieza automática
 * cuando cambia el estado de la notificación o se desmonta el componente.
 *
 * @param shouldPlay Boolean que indica si debe sonar/vibrar la alerta de viaje.
 * @param options Opciones de configuración de frecuencia, patrón de vibración y duración máxima.
 */
export function useTripAlertSound(
  shouldPlay: boolean,
  options: UseTripAlertSoundOptions = {}
) {
  useEffect(() => {
    if (shouldPlay) {
      startTripAlert(options);
    } else {
      stopTripAlert();
    }

    // Limpieza garantizada al desmontar la pantalla o cerrar el modal
    return () => {
      stopTripAlert();
    };
  }, [shouldPlay, options.maxDurationMs]);
}
