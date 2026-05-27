export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'alert';
}

export interface InternalMessage {
  id: string;
  senderName: string;
  content: string;
  timestamp: number;
}
