// =============================================================================
// TIPOS DE MENSAJERÍA — Centro de Comunicaciones TravelApp
// =============================================================================

export type MessageChannel = 'whatsapp' | 'instagram' | 'messenger' | 'web' | 'internal' | 'push';

export type ConversationType = 'customer_support' | 'driver_passenger' | 'group_trip' | 'broadcast';

export type ConversationStatus = 'bot' | 'pending' | 'active' | 'closed';

export type SenderRole = 'customer' | 'driver' | 'operator' | 'travis' | 'system';

export type AutomatedTrigger =
  | 'driver_assigned'
  | 'trip_started'
  | 'trip_ending_soon'
  | 'seatbelt_reminder'
  | 'arrival_check'
  | 'trip_completed'
  | 'rate_trip'
  | 'welcome'
  | 'custom';

export type BroadcastAudience = 'all' | 'passengers' | 'drivers' | 'specific';

// -----------------------------------------------------------------------------
// Conversación
// -----------------------------------------------------------------------------

export interface ConversationParticipant {
  id: string;
  name: string;
  role: SenderRole;
  phone?: string;
  avatarUrl?: string;
}

export interface ConversationMetadata {
  leadId?: string;
  tripId?: string;
  groupId?: string;
  driverName?: string;
  passengerName?: string;
  businessUnit?: 'TravelCab' | 'Experiences' | 'Rewards' | 'General';
}

export interface Conversation {
  id: string;
  type: ConversationType;
  channel: MessageChannel;
  participants: ConversationParticipant[];
  status: ConversationStatus;
  lastMessage: string;
  lastMessageAt: number;
  unreadCount: number;
  operatorId?: string; // ID del operador que tomó control
  operatorName?: string;
  manyChatSubscriberId?: string; // ID del suscriptor en ManyChat
  metadata: ConversationMetadata;
  createdAt: number;
}

// -----------------------------------------------------------------------------
// Mensaje
// -----------------------------------------------------------------------------

export interface MessageSender {
  id: string;
  name: string;
  role: SenderRole;
}

export type MessageType = 'text' | 'automated' | 'system' | 'image' | 'template';

export interface Message {
  id: string;
  conversationId: string;
  sender: MessageSender;
  content: string;
  timestamp: number;
  type: MessageType;
  channel: MessageChannel;
  manyChatMessageId?: string;
  isRead?: boolean;
}

// -----------------------------------------------------------------------------
// Mensajes Automáticos
// -----------------------------------------------------------------------------

export interface AutomatedMessage {
  id: string;
  trigger: AutomatedTrigger;
  title: string;           // Nombre descriptivo para el admin
  content: string;         // Texto del mensaje (puede tener {variables})
  delaySeconds: number;    // Segundos después del trigger para enviar
  isActive: boolean;
  channel: MessageChannel | 'both';
  createdAt: number;
  updatedAt: number;
}

// Triggers predefinidos con sus labels
export const AUTOMATED_TRIGGER_LABELS: Record<AutomatedTrigger, string> = {
  driver_assigned: '🚗 Conductor Asignado',
  trip_started: '🟢 Viaje Iniciado',
  trip_ending_soon: '⏱️ Viaje por Terminar (3 min)',
  seatbelt_reminder: '🔒 Recordatorio Cinturón',
  arrival_check: '📦 ¿No te olvidaste nada?',
  trip_completed: '✅ Viaje Completado',
  rate_trip: '⭐ Calificar el Viaje',
  welcome: '👋 Bienvenida al Servicio',
  custom: '⚡ Personalizado',
};

// Mensajes predeterminados para inicializar
export const DEFAULT_AUTOMATED_MESSAGES: Omit<AutomatedMessage, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    trigger: 'driver_assigned',
    title: 'Conductor en Camino',
    content: '¡Hola {nombre}! 🚗 Tu conductor *{conductor}* ya está en camino. Llegará en aproximadamente *{eta} minutos*. Podés seguir el viaje en tiempo real desde la app.',
    delaySeconds: 0,
    isActive: true,
    channel: 'whatsapp',
  },
  {
    trigger: 'trip_started',
    title: 'Inicio del Viaje',
    content: '¡Tu viaje comenzó! 🟢 Estás en buenas manos con *{conductor}*. Recordá colocarte el cinturón de seguridad. 🔒',
    delaySeconds: 30,
    isActive: true,
    channel: 'both',
  },
  {
    trigger: 'seatbelt_reminder',
    title: 'Recordatorio Cinturón de Seguridad',
    content: '🔒 ¡Recordá siempre colocarte el cinturón! Es por tu seguridad y la de todos. ¡Buen viaje!',
    delaySeconds: 60,
    isActive: true,
    channel: 'whatsapp',
  },
  {
    trigger: 'trip_ending_soon',
    title: 'Llegando al Destino',
    content: '⏱️ ¡Ya casi llegás! En aproximadamente *3 minutos* arribarás a *{destino}*. Podés prepararte para bajar.',
    delaySeconds: 0,
    isActive: true,
    channel: 'whatsapp',
  },
  {
    trigger: 'arrival_check',
    title: '¿No te olvidaste nada?',
    content: '📦 ¡Ya llegaste! Antes de bajar, revisá que no te olvidés ningún objeto personal en el vehículo. ¡Hasta la próxima! 😊',
    delaySeconds: 10,
    isActive: true,
    channel: 'both',
  },
  {
    trigger: 'rate_trip',
    title: 'Solicitud de Calificación',
    content: '⭐ ¿Cómo fue tu viaje? Tu opinión es muy importante para nosotros. Calificá tu experiencia: https://travelapp.ar/calificar/{viaje_id}',
    delaySeconds: 120,
    isActive: true,
    channel: 'whatsapp',
  },
];

// -----------------------------------------------------------------------------
// Configuración de Travis
// -----------------------------------------------------------------------------

export interface TravisKnowledgeEntry {
  id: string;
  title: string;
  content: string;    // Markdown
  category: 'TravelCab' | 'Experiences' | 'Rewards' | 'General' | 'Drivers';
  createdAt: number;
}

export interface TravisChannelStatus {
  whatsapp: boolean;
  instagram: boolean;
  messenger: boolean;
  web: boolean;
}

export interface TravisConfig {
  systemPrompt: string;
  businessContext: string;
  knowledgeBase: TravisKnowledgeEntry[];
  activeChannels: TravisChannelStatus;
  autoReplyEnabled: boolean;
  handoffTriggers: string[];  // Palabras que escalan al humano
  workingHours?: { start: string; end: string; timezone: string };
  outOfHoursMessage: string;
  updatedAt: number;
  isAiDispatchForcedEnabled?: boolean;
}

export const DEFAULT_TRAVIS_CONFIG: Omit<TravisConfig, 'updatedAt'> = {
  systemPrompt: `Sos Travis, el asistente virtual de TravelApp — una plataforma de movilidad premium de Tucumán, Argentina. 

Tu personalidad es: amigable, profesional, eficiente y directo. Siempre respondés en español rioplatense (usás "vos" en lugar de "tú").

**Tu rol principal:**
- Responder consultas sobre TravelCab (servicio de transporte urbano)
- Informar sobre TravelExperiences (tours y experiencias)  
- Explicar el programa de Rewards (puntos y beneficios)
- Ayudar a conductores con el proceso de registro
- Derivar al equipo humano cuando la consulta lo requiere

**Reglas importantes:**
- Nunca inventés información que no tengas en tu base de conocimiento
- Si no sabés algo, decí "En este momento no tengo esa información, pero te conecto con nuestro equipo" y escalá la conversación
- Siempre saludá con calidez y terminá con una pregunta de cierre para confirmar que resolviste la duda
- Para reservas o situaciones urgentes, siempre ofrecé el contacto directo: +54 9 381 418-8106`,

  businessContext: `TravelApp es un ecosistema de movilidad y experiencias premium con sede en Tucumán, Argentina. 
Operamos con: TravelCab (remises y transporte urbano), TravelExperiences (tours y excursiones) y TravelRewards (programa de fidelización).`,

  knowledgeBase: [],
  
  activeChannels: {
    whatsapp: true,
    instagram: false,
    messenger: false,
    web: true,
  },
  
  autoReplyEnabled: true,
  
  handoffTriggers: [
    'hablar con una persona',
    'hablar con alguien',
    'operador',
    'urgente',
    'reclamo',
    'queja',
    'problema grave',
    'accidente',
    'emergencia',
    'reembolso',
  ],
  
  outOfHoursMessage: '¡Hola! 👋 Gracias por escribirnos. Nuestro equipo atiende de lunes a sábados de 8:00 a 22:00 hs. Dejanos tu mensaje y te respondemos a la brevedad. Si es urgente, llamanos al +54 9 381 418-8106.',
};

// -----------------------------------------------------------------------------
// Broadcast / Campañas
// -----------------------------------------------------------------------------

export type BroadcastStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';

export interface BroadcastStats {
  targeted: number;
  sent: number;
  delivered: number;
  read: number;
}

export interface BroadcastCampaign {
  id: string;
  title: string;
  message: string;
  audience: BroadcastAudience;
  specificIds?: string[];   // IDs específicos si audience === 'specific'
  channel: MessageChannel | 'both';
  status: BroadcastStatus;
  scheduledAt?: number;
  sentAt?: number;
  stats: BroadcastStats;
  createdBy: string;
  createdAt: number;
}
