import { PointTransaction } from './rewards';

export type Source = 'WhatsApp' | 'Web' | 'IG' | 'Messenger';
export type Unit = 'TravelCab' | 'Experiencias' | 'Rewards';
export type LeadStatus = 'Nuevos' | 'Agendados' | 'En Negociación' | 'Ganados/Perdidos';
export type CustomerLevel = 1 | 2;

export interface ChatMessage {
  sender: 'Travis' | 'Client';
  message: string;
  timestamp: number;
}

// ── Customer Identity Document ────────────────────────────────
export type DocumentType = 'DNI' | 'Pasaporte' | 'Otro';

export interface CustomerDocument {
  type: DocumentType;
  number: string;
  issueDate?: string;       // ISO date
  expiryDate?: string;      // ISO date
  frontUrl?: string;        // Storage URL
  backUrl?: string;         // Storage URL (for DNI)
}

// ── Emergency Contact (Level 2) ───────────────────────────────
export interface EmergencyContact {
  name: string;
  phone: string;
  relationship?: string;    // e.g. 'Madre', 'Cónyuge'
}

// ── Customer Address ──────────────────────────────────────────
export interface CustomerAddress {
  street: string;
  number: string;
  floor?: string;
  apartment?: string;
  city: string;
  province: string;
  postalCode: string;
  country?: string;
}

// ── Customer Wallet Transaction ───────────────────────────────
export interface CustomerWalletTransaction {
  id: string;
  date: number;             // Timestamp (ms)
  points: number;           // Positive = earned, Negative = spent
  description: string;
  ruleApplied?: string;
}

// ── Customer Wallet ───────────────────────────────────────────
export interface CustomerWallet {
  pointsBalance: number;
  cashCredit: number;       // ARS (promotional balance)
  transactions: CustomerWalletTransaction[];
}

// ── Lead / Customer ───────────────────────────────────────────
export interface Lead {
  id: string;               // Document ID

  // ─ Level 1 — Basic (all customers) ─────────────────────────
  customerName: string;
  phone?: string;
  email?: string;
  status: LeadStatus;
  customerStatus: 'Prospecto' | 'Cliente';
  customerLevel: CustomerLevel;  // 1 = Basic, 2 = VIP
  origin: Source;
  businessUnit: Unit;
  chatHistory: ChatMessage[];
  loyaltyPoints?: number;
  pointsHistory?: PointTransaction[];
  wallet?: CustomerWallet;

  // Calendar / Meetings
  googleEventId?: string;
  meetingLink?: string;
  meetingDate?: number;     // Timestamp

  // ─ Level 2 — VIP (extended profile) ─────────────────────────
  dob?: string;             // ISO date
  occupation?: string;
  document?: CustomerDocument;
  address?: CustomerAddress;
  emergencyContact?: EmergencyContact;
  allergies?: string;       // Food allergies or dietary restrictions
  dietaryRestrictions?: string;
}

export interface CalendarEvent {
  id?: string;
  title: string;
  time: string;             // e.g., '09:00 AM'
  date: string;             // e.g., 'YYYY-MM-DD'
  type: string;
  duration: string;
  color: string;
  leadId?: string;
}
