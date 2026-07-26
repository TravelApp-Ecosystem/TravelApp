// =============================================================================
// TRAVELCAB - CONTROLADOR GLOBAL DE SONIDO Y VIBRACIÓN DE NOTIFICACIONES DE VIAJE
// Soluciona el problema de bucle o tildado de sonido y vibración en apps de Conductor y Pasajero
// =============================================================================

let audioInterval: any = null;
let vibrationInterval: any = null;
let autoStopTimeout: any = null;
let audioCtx: AudioContext | null = null;
let isAlertActive = false;

interface TripAlertOptions {
  soundFrequencyHigh?: number;
  soundFrequencyLow?: number;
  vibrationPattern?: number[];
  maxDurationMs?: number;
}

/**
 * Detiene inmediatamente cualquier sonido y corta la vibración del dispositivo (navigator.vibrate(0)).
 */
export function stopTripAlert(): void {
  isAlertActive = false;

  // 1. Limpiar timers de repetición
  if (audioInterval) {
    clearInterval(audioInterval);
    audioInterval = null;
  }
  if (vibrationInterval) {
    clearInterval(vibrationInterval);
    vibrationInterval = null;
  }
  if (autoStopTimeout) {
    clearTimeout(autoStopTimeout);
    autoStopTimeout = null;
  }

  // 2. Detener y cerrar AudioContext si está activo
  if (audioCtx) {
    try {
      if (audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
    } catch (e) {
      // Ignorar errores al cerrar audio context
    }
    audioCtx = null;
  }

  // 3. Detener vibración nativa del navegador / dispositivo móvil
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(0);
      navigator.vibrate([]);
    } catch (e) {
      // Ignorar errores de API de vibración no soportada
    }
  }
}

/**
 * Reproduce un tono de alerta de doble bip limpio usando Web Audio API.
 */

function playChimeStep(freq1 = 880, freq2 = 1320): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const now = audioCtx.currentTime;

    // Primer bip (Tono alto)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq1, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);

    // Segundo bip (Tono armónico)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq2, now + 0.18);
    gain2.gain.setValueAtTime(0.15, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.4);
  } catch (err) {
    console.warn('[TripSoundAlert] Error al sintetizar audio:', err);
  }
}

/**
 * Inicia la secuencia de sonido y vibración rítmica con auto-apagado de seguridad (evita tildados).
 */
export function startTripAlert(options: TripAlertOptions = {}): void {
  const {
    soundFrequencyHigh = 1320,
    soundFrequencyLow = 880,
    vibrationPattern = [300, 150, 300, 150, 500],
    maxDurationMs = 25000 // Detener automáticamente a los 25 seg máximo
  } = options;

  // Si ya está sonando, detener primero para reiniciar limpio
  stopTripAlert();
  isAlertActive = true;

  // 1. Primer Chime y Vibración Inmediata
  playChimeStep(soundFrequencyLow, soundFrequencyHigh);
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(vibrationPattern);
    } catch (e) {}
  }

  // 2. Repetición Rítmica de Audio cada 1.4 segundos
  audioInterval = setInterval(() => {
    if (!isAlertActive) return;
    playChimeStep(soundFrequencyLow, soundFrequencyHigh);
  }, 1400);

  // 3. Repetición Rítmica de Vibración cada 2.2 segundos
  vibrationInterval = setInterval(() => {
    if (!isAlertActive) return;
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(vibrationPattern);
      } catch (e) {}
    }
  }, 2200);

  // 4. Timer de Auto-Apagado de Seguridad (Evita que quede tildado si se cierra la pantalla)
  autoStopTimeout = setTimeout(() => {
    stopTripAlert();
  }, maxDurationMs);
}
