export const Colors = {
  primary: '#0A2A5B',      // Tech Blue principal
  primaryDark: '#071A3A',  // Tech Blue noche
  accent: '#FF6B00',       // Naranja vibrante TravelApp
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  white: '#FFFFFF',
  background: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  textDark: '#0F172A',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  techBlueBg: '#0B192C',   // Fondo Azul Tech para Login y Home
  techBlueCard: '#1E293B',
};

export const Fonts = {
  regular: 'Quicksand-Regular',
  medium: 'Quicksand-Medium',
  semiBold: 'Quicksand-SemiBold',
  bold: 'Quicksand-Bold',
};

export const GOOGLE_MAPS_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyD4XIT5MNfECRy6wQe8BNgBb9pWC6lsr9U';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://travelapp.ar';

export const TRAVIS_WEBHOOK_URL =
  process.env.EXPO_PUBLIC_TRAVIS_WEBHOOK_URL || 'https://travelapp.ar/api/travis-webhook';

