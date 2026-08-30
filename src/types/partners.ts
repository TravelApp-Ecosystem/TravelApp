// ============================================================
// Partner & Driver Data Architecture
// TravelApp Ecosystem
// ============================================================

// ── Address ──────────────────────────────────────────────────
export interface Address {
  street: string;           // Calle
  number: string;           // Número
  floor?: string;           // Piso
  apartment?: string;       // Depto
  city: string;             // Localidad
  province: string;         // Provincia
  postalCode: string;       // Código Postal
}

// ── Tax Information (ARCA / ex-AFIP) ─────────────────────────
export type TaxIdType = 'CUIL' | 'CUIT';
export type TaxRegistrationType =
  | 'Monotributista'
  | 'Responsable Inscripto'
  | 'Exento';

export interface TaxInfo {
  taxIdType: TaxIdType;
  taxIdNumber: string;                    // CUIL or CUIT — 11 digits
  registrationType?: TaxRegistrationType; // Only if CUIT
  arcaConstanciaUrl?: string;             // PDF upload URL (only if CUIT)
}

// ── Bank / Payment Info ───────────────────────────────────────
export interface BankInfo {
  cbuCvu: string;   // Exactly 22 characters
  alias: string;
  accountHolder: string;
}

// ── Sutrappa License (Taxi/Remis municipal license) ──────────
export interface SutrappaLicense {
  isActive: boolean;
  licenseNumber?: string;   // Required if isActive = true
  holder?: string;          // Titular — Required if isActive = true
}

// ── Vehicle ──────────────────────────────────────────────────
export interface Vehicle {
  id: string;
  make: string;             // Marca
  model: string;            // Modelo
  year: number;             // Año (4 digits)
  color: string;            // Color
  licensePlate: string;     // Patente

  // Documents (storage URLs)
  cedularFrontUrl?: string;    // Cédula Verde/Azul — Frente
  cedularBackUrl?: string;     // Cédula Verde/Azul — Dorso
  insurancePdfUrl?: string;    // Seguro Comercial (PDF)
  rtoUrl?: string;             // Revisión Técnica Obligatoria

  // Photos (storage URLs)
  photoFrontUrl?: string;      // Foto Frontal
  photoSideUrl?: string;       // Foto Lateral
  photo45Url?: string;         // Foto a 45°

  sutrappa: SutrappaLicense;
}

// ── Partner Status ────────────────────────────────────────────
export type PartnerStatus =
  | 'Activo'
  | 'Pendiente Documentación'
  | 'Suspendido'
  | 'En Revisión';

// ── Wallet Transaction ────────────────────────────────────────
export type WalletTransactionType = 'credit' | 'debit' | 'withdrawal' | 'bonus';

export interface WalletTransaction {
  id: string;
  date: number;             // Timestamp (ms)
  type: WalletTransactionType;
  amount: number;           // Positive = credit, negative = debit
  description: string;
  tripId?: string;
}

// ── Partner Wallet ────────────────────────────────────────────
export interface PartnerWallet {
  cashBalance: number;      // ARS balance
  pointsBalance: number;    // Loyalty points
  transactions: WalletTransaction[];
}

// ── Driver / Partner (Socio-Conductor) ───────────────────────
export interface DriverPartner {
  id: string;
  createdAt: number;        // Timestamp (ms)
  updatedAt: number;

  // Personal
  firstName: string;
  lastName: string;
  dob: string;              // ISO date — must be +18 years old
  email: string;
  phone: string;
  photoUrl?: string;

  // Address
  address: Address;

  // Tax & Fiscal
  taxInfo: TaxInfo;

  // Bank
  bankInfo: BankInfo;

  // Vehicle (a partner may have one primary vehicle)
  vehicle?: Vehicle;

  // Documents (storage URLs)
  driverLicenseUrl?: string;        // Licencia de Conducir
  criminalRecordUrl?: string;       // Certificado de Reincidencia
  conductCertificateUrl?: string;   // Buena Conducta
  healthCertificateUrl?: string;    // Certificado de Sanidad

  // Status & Wallet
  status: PartnerStatus;
  wallet: PartnerWallet;

  // Logistics & Tariffs Assignment
  branchIds?: string[];             // Sucursales donde está autorizado a operar (o ['all'])
  allowedCategories?: string[];     // Categorías de servicio habilitadas (ej: ['taxi', 'estandar'], ['vip', 'premium'])
  assignedTariffIds?: string[];     // Tarifarios específicos asignados
  allowedServiceModes?: string[];   // Modalidades habilitadas: ['mu', 'arc', 'transfers']
  planType?: 'commission' | 'membership'; // Plan de trabajo: Comisión o Membresía
  maxNegativeBalance?: number;      // Límite de saldo negativo
  currentCommissionBalance?: number;
  enabledAt?: number;               // Timestamp de cuando fue habilitado

  // Fleet Supervisor Linkage
  fleetSupervisorId?: string;       // Employee ID of the Fleet Supervisor
  fleetSupervisorName?: string;     // Display name of the supervisor
  referralCodeUsed?: string;        // Referral code used at driver signup
}

// ── Fleet Supervisor Configuration ───────────────────────────
export interface FleetSupervisorConfig {
  id: string;
  userId: string;                   // Employee user ID in HR
  employeeName: string;
  employeeEmail: string;
  referralCode: string;             // e.g. "FERNANDO-CAB"
  companyFeeCommissionPct: number;  // % taken from TravelApp's commission fee (e.g. 10%)
  totalDriversRecruited: number;
  totalCommissionEarned: number;    // Accumulated ARS earned
  status: 'active' | 'inactive';
  createdAt: number;
}

// ── Argentina Provinces (enum helper) ────────────────────────
export const ARGENTINA_PROVINCES = [
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Ciudad Autónoma de Buenos Aires',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
] as const;

export type ArgentinaProvince = (typeof ARGENTINA_PROVINCES)[number];
