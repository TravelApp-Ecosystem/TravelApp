/**
 * Generador dinámico de iconos SVG para vehículos TravelCab.
 * Soporta colores por estado y badges de alerta en tiempo real.
 */

export type VehicleStatus = 'online' | 'busy' | 'offline' | 'alert';

export interface CarSvgOptions {
  status: 'Activo' | 'En Viaje' | 'Desconectado' | 'offline' | string;
  isOnline?: boolean;
  hasAlert?: boolean;
  alertReason?: string;
  heading?: number;
  scale?: number;
}

export function getVehicleColor(status: string, isOnline: boolean = true, hasAlert: boolean = false): {
  primary: string;
  secondary: string;
  glow: string;
  label: string;
} {
  if (hasAlert) {
    return {
      primary: '#EF4444', // Rojo Alerta
      secondary: '#991B1B',
      glow: 'rgba(239, 68, 68, 0.4)',
      label: 'Alerta / Evento',
    };
  }

  if (status === 'En Viaje' || status === 'busy') {
    return {
      primary: '#FF7B1A', // Naranja Corporativo
      secondary: '#C2410C',
      glow: 'rgba(255, 123, 26, 0.4)',
      label: 'En Viaje',
    };
  }

  if ((status === 'Activo' || status === 'online') && isOnline) {
    return {
      primary: '#10B981', // Verde Esmeralda Online
      secondary: '#047857',
      glow: 'rgba(16, 185, 129, 0.4)',
      label: 'Disponible (Online)',
    };
  }

  return {
    primary: '#64748B', // Gris Desconectado
    secondary: '#334155',
    glow: 'rgba(100, 116, 139, 0.3)',
    label: 'Desconectado',
  };
}

export function getCarSvgDataUrl(options: CarSvgOptions): string {
  const { status, isOnline = true, hasAlert = false, heading = 0 } = options;
  const color = getVehicleColor(status, isOnline, hasAlert);

  const alertBadgeSvg = hasAlert
    ? `
      <!-- Badge de Alerta Pulsante -->
      <circle cx="48" cy="22" r="10" fill="#EF4444" stroke="#FFFFFF" stroke-width="2.5" />
      <text x="48" y="26" font-size="11" font-weight="900" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif">!</text>
    `
    : '';

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="48" height="48">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="rgba(0,0,0,0.35)" />
    </filter>
  </defs>

  <g filter="url(#shadow)" transform="rotate(${heading}, 48, 48)">
    <!-- Halo / Ring de estado -->
    <circle cx="48" cy="48" r="42" fill="${color.glow}" stroke="${color.primary}" stroke-width="1.5" stroke-dasharray="${hasAlert ? '4,4' : 'none'}" />
    
    <!-- Sombra del Auto -->
    <rect x="33" y="19" width="30" height="58" rx="8" fill="rgba(0,0,0,0.18)" />

    <!-- Chasis Principal del Auto (Top-Down Silhouette) -->
    <rect x="34" y="18" width="28" height="60" rx="8" fill="${color.primary}" stroke="#FFFFFF" stroke-width="1.8" />
    
    <!-- Ruedas -->
    <rect x="30" y="27" width="4" height="11" rx="2" fill="#1E293B" />
    <rect x="62" y="27" width="4" height="11" rx="2" fill="#1E293B" />
    <rect x="30" y="58" width="4" height="11" rx="2" fill="#1E293B" />
    <rect x="62" y="58" width="4" height="11" rx="2" fill="#1E293B" />

    <!-- Parabrisas Delantero -->
    <path d="M37 32 Q48 29 59 32 L58 40 Q48 38 38 40 Z" fill="#0B192C" opacity="0.9" />

    <!-- Techo -->
    <rect x="37" y="40" width="22" height="20" rx="3" fill="${color.secondary}" opacity="0.95" />

    <!-- Luneta Trasera -->
    <path d="M38 60 Q48 59 58 60 L57 66 Q48 64 39 66 Z" fill="#0B192C" opacity="0.9" />

    <!-- Faros Delanteros (Luces LED) -->
    <circle cx="37" cy="20" r="2" fill="#FEF08A" />
    <circle cx="59" cy="20" r="2" fill="#FEF08A" />

    <!-- Luces Traseras -->
    <rect x="36" y="76" width="4" height="1.5" rx="0.5" fill="#EF4444" />
    <rect x="56" y="76" width="4" height="1.5" rx="0.5" fill="#EF4444" />
  </g>

  ${alertBadgeSvg}
</svg>
`.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
