'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Building2,
  Car,
  Compass,
  Gift,
  DollarSign,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  Phone,
  Calendar,
  Sparkles,
  Search,
  Send,
  Ticket,
  TrendingUp,
  Hotel,
  UserCheck,
  Navigation,
  ShieldCheck,
  Percent,
  Wallet,
  ArrowRight,
  Plus,
  Edit3,
  Trash2,
  QrCode,
  FileText,
  Upload,
  Download,
  Banknote,
  Award,
  Store,
  Utensils,
  Briefcase,
  Mail,
  Hash,
  GitBranch,
  Check,
  X,
  Eye,
  Printer,
  CreditCard,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Tour } from '@/types/experiences';
import { UnifiedDispatcher } from '@/components/travelcab/UnifiedDispatcher';

const GoogleInteractiveMap = dynamic(
  () =>
    import('@/components/travelcab/GoogleInteractiveMap').then(
      (mod) => mod.GoogleInteractiveMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#0a0f18] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#ff7b1a] border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
);

// ============================================================================
// TIPOS DEL ECOSISTEMA B2B (GESTOR CENTRAL + PORTAL B2B DEL ALIADO)
// ============================================================================

export type B2BPartnerCategory = 'Agencia' | 'Hotel' | 'Comercio' | 'Bar / Restó';

export type IvaConditionType =
  | 'Responsable Inscripto'
  | 'Monotributo'
  | 'IVA Exento'
  | 'Consumidor Final';

export interface B2BBranch {
  id: string;
  name: string;
  address: string;
  managerName: string;
  managerEmail: string;
  managerPhone: string;
}

export interface B2BEnabledServices {
  travelCab: boolean;
  experience: boolean;
  rewards: boolean;
}

export interface B2BSignedAgreement {
  hasSignedAgreement: boolean;
  agreementNumber: string;
  signedDate: string;
  validUntil: string;
  status: 'Vigente' | 'En Renovación' | 'Pendiente de Firma';
  fileName?: string;
  fileDataUrl?: string; // PDF o Imagen en Base64 o URL externa
  notes?: string;
}

export interface B2BPartner {
  id: string;
  category: B2BPartnerCategory;
  commercialName: string; // Nombre Comercial
  legalName: string; // Razón Social
  cuit: string; // CUIT
  address: string; // Domicilio Central
  phone: string; // Teléfono Comercial
  email: string; // Correo Comercial
  ivaCondition: IvaConditionType; // Condición Frente a IVA
  managerName: string; // Responsable Principal
  managerPhone: string; // Teléfono Responsable
  managerEmail: string; // Correo Responsable
  branches: B2BBranch[]; // Sucursales dinámicas
  enabledServices: B2BEnabledServices; // TravelCab - Experience - Rewards
  // Configuración comercial por servicio
  cabCommissionPct: number; // % Comisión por despacho TravelCab
  experienceCommissionPct: number; // % Comisión por venta de excursión Experience
  rewardsDiscountPct: number; // % Descuento que otorga en Rewards
  rewardsReimbursementPct: number; // % del descuento que TravelApp reintegra/reconoce al aliado
  // Convenio firmado
  agreement: B2BSignedAgreement;
  // Preferencias de pago y billetera de puntos
  preferredPaymentMethod: 'Efectivo' | 'Transferencia' | 'Puntos Rewards';
  bankAliasOrCbu?: string;
  accumulatedPointsBalance: number;
  status: 'active' | 'suspended';
  createdAt?: string;
}

export interface B2BSettlementRecord {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerCategory: B2BPartnerCategory;
  paymentMethod: 'Efectivo' | 'Transferencia' | 'Puntos Rewards';
  amountArs: number;
  pointsCredited: number;
  // Desglose por origen
  cabCommissionIncluded: number;
  experienceCommissionIncluded: number;
  rewardsReimbursementIncluded: number;
  itemsCount: number;
  // Datos de auditoría y pago en efectivo
  deliveredByName: string; // Quién paga / entrega el efectivo
  receivedByName: string; // Quién recibe en el aliado
  receivedByDni?: string;
  receiptNumber: string; // N° de recibo o comprobante
  notes?: string;
  createdAt: string;
}

export interface B2BRewardsRedemption {
  id: string;
  partnerId: string;
  partnerName: string;
  branchName: string;
  voucherCode: string;
  memberName: string;
  memberDni: string;
  memberTier: 'Silver' | 'Gold' | 'Black';
  ticketTotalAmount: number; // Consumo total en $
  discountPctApplied: number; // % descuento aplicado
  discountAmountGranted: number; // $ Descuento otorgado al socio
  netChargedToCustomer: number; // $ Cobrado al socio
  reimbursementPct: number; // % reconocido al comercio
  reimbursementAmountDue: number; // $ A pagar por TravelApp al aliado
  pointsEquivalentDue: number; // Equivalente en puntos
  invoiceOrTicketNumber: string;
  settlementStatus: 'pending' | 'paid';
  settlementPaymentMethod?: 'Efectivo' | 'Transferencia' | 'Puntos Rewards';
  settlementReceiptNumber?: string;
  createdAt: string;
}

// ============================================================================
// DATOS SEMILLA INICIALES (ALIADOS B2B + EXCURSIONES HABILITADAS + CUPONES)
// ============================================================================

const INITIAL_B2B_PARTNERS: B2BPartner[] = [
  {
    id: 'B2B-ALLY-001',
    category: 'Hotel',
    commercialName: 'Sheraton Tucumán Hotel',
    legalName: 'Hoteles del Jardín S.A.',
    cuit: '30-70984512-9',
    address: 'Av. Soldati 440, San Miguel de Tucumán',
    phone: '+54 9 381 455-9000',
    email: 'conserjeria@sheratontucuman.com',
    ivaCondition: 'Responsable Inscripto',
    managerName: 'Lic. Martín Alurralde',
    managerPhone: '+54 9 381 512-3344',
    managerEmail: 'malurralde@sheratontucuman.com',
    branches: [
      {
        id: 'BR-01',
        name: 'Recepción Principal - Parque 9 de Julio',
        address: 'Av. Soldati 440, S.M. de Tucumán',
        managerName: 'Martín Alurralde',
        managerEmail: 'recepcion@sheratontucuman.com',
        managerPhone: '+54 9 381 512-3344',
      },
      {
        id: 'BR-02',
        name: 'Mostrador VIP - Lobby Lounge',
        address: 'Av. Soldati 440 PB, S.M. de Tucumán',
        managerName: 'Lucía Paz',
        managerEmail: 'concierge@sheratontucuman.com',
        managerPhone: '+54 9 381 599-1122',
      },
    ],
    enabledServices: {
      travelCab: true,
      experience: true,
      rewards: true,
    },
    cabCommissionPct: 10,
    experienceCommissionPct: 15,
    rewardsDiscountPct: 15,
    rewardsReimbursementPct: 100,
    agreement: {
      hasSignedAgreement: true,
      agreementNumber: 'CONV-B2B-2026-001',
      signedDate: '2026-01-15',
      validUntil: '2027-01-15',
      status: 'Vigente',
      fileName: 'Convenio_Marco_Sheraton_Tucuman_2026.pdf',
      notes: 'Liquidación quincenal en efectivo por conserjería o transferencia bancaria. Incluye tablet en mostrador.',
    },
    preferredPaymentMethod: 'Efectivo',
    bankAliasOrCbu: 'SHERATON.TUC.B2B',
    accumulatedPointsBalance: 4500,
    status: 'active',
    createdAt: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 'B2B-ALLY-002',
    category: 'Bar / Restó',
    commercialName: 'El Portal Empanadas & Parrilla',
    legalName: 'Gastronomía del Norte S.R.L.',
    cuit: '30-71445890-3',
    address: 'Av. Aconquija 1645, Yerba Buena',
    phone: '+54 9 381 425-8811',
    email: 'administracion@elportalresto.com.ar',
    ivaCondition: 'Responsable Inscripto',
    managerName: 'Facundo Gramajo',
    managerPhone: '+54 9 381 601-4477',
    managerEmail: 'fgramajo@elportalresto.com.ar',
    branches: [
      {
        id: 'BR-03',
        name: 'Sucursal Yerba Buena',
        address: 'Av. Aconquija 1645, Yerba Buena',
        managerName: 'Facundo Gramajo',
        managerEmail: 'yerbabuena@elportalresto.com.ar',
        managerPhone: '+54 9 381 601-4477',
      },
      {
        id: 'BR-04',
        name: 'Sucursal Barrio Norte',
        address: '25 de Mayo 740, S.M. de Tucumán',
        managerName: 'Valeria Soraire',
        managerEmail: 'barrionorte@elportalresto.com.ar',
        managerPhone: '+54 9 381 622-9810',
      },
    ],
    enabledServices: {
      travelCab: true,
      experience: false,
      rewards: true,
    },
    cabCommissionPct: 10,
    experienceCommissionPct: 12,
    rewardsDiscountPct: 20,
    rewardsReimbursementPct: 50,
    agreement: {
      hasSignedAgreement: true,
      agreementNumber: 'CONV-B2B-2026-002',
      signedDate: '2026-02-10',
      validUntil: '2027-02-10',
      status: 'Vigente',
      fileName: 'Convenio_Gastronomico_ElPortal_Firmado.pdf',
      notes: '20% de descuento a socios Rewards (50% absorbe comercio, 50% reintegra TravelApp en efectivo o puntos). Despacho TravelCab para comensales.',
    },
    preferredPaymentMethod: 'Efectivo',
    bankAliasOrCbu: 'ELPORTAL.YB.MP',
    accumulatedPointsBalance: 12800,
    status: 'active',
    createdAt: '2026-02-10T12:00:00.000Z',
  },
  {
    id: 'B2B-ALLY-003',
    category: 'Agencia',
    commercialName: 'NOA Receptivo & Viajes',
    legalName: 'NOA Turismo EVT Leg. 14920',
    cuit: '30-68912345-7',
    address: 'San Martín 650, San Miguel de Tucumán',
    phone: '+54 9 381 430-1100',
    email: 'ventas@noareceptivo.tur.ar',
    ivaCondition: 'Responsable Inscripto',
    managerName: 'Carolina Aráoz',
    managerPhone: '+54 9 381 588-7766',
    managerEmail: 'caraoz@noareceptivo.tur.ar',
    branches: [
      {
        id: 'BR-05',
        name: 'Casa Central Microcentro',
        address: 'San Martín 650, S.M. de Tucumán',
        managerName: 'Carolina Aráoz',
        managerEmail: 'ventas@noareceptivo.tur.ar',
        managerPhone: '+54 9 381 588-7766',
      },
    ],
    enabledServices: {
      travelCab: true,
      experience: true,
      rewards: false,
    },
    cabCommissionPct: 10,
    experienceCommissionPct: 18,
    rewardsDiscountPct: 10,
    rewardsReimbursementPct: 100,
    agreement: {
      hasSignedAgreement: true,
      agreementNumber: 'CONV-B2B-2026-003',
      signedDate: '2026-03-01',
      validUntil: '2027-03-01',
      status: 'Vigente',
      fileName: 'Convenio_Agencia_NOA_Receptivo.pdf',
      notes: 'Comisión preferencial del 18% en excursiones de Luna Viajera comercializadas vía TravelApp Experience.',
    },
    preferredPaymentMethod: 'Transferencia',
    bankAliasOrCbu: 'NOA.TURISMO.B2B',
    accumulatedPointsBalance: 3200,
    status: 'active',
    createdAt: '2026-03-01T09:00:00.000Z',
  },
  {
    id: 'B2B-ALLY-004',
    category: 'Comercio',
    commercialName: 'Regionales & Ponchos Tucumanos',
    legalName: 'Artesanías del Tucumán S.A.S.',
    cuit: '30-71662310-4',
    address: 'Congreso 215 (Frente a Casa Histórica), S.M. de Tucumán',
    phone: '+54 9 381 422-3399',
    email: 'contacto@regionalestucuman.com',
    ivaCondition: 'Monotributo',
    managerName: 'Roberto Villagra',
    managerPhone: '+54 9 381 477-9900',
    managerEmail: 'rvillagra@regionalestucuman.com',
    branches: [
      {
        id: 'BR-06',
        name: 'Local Paseo de la Independencia',
        address: 'Congreso 215, S.M. de Tucumán',
        managerName: 'Roberto Villagra',
        managerEmail: 'congreso@regionalestucuman.com',
        managerPhone: '+54 9 381 477-9900',
      },
    ],
    enabledServices: {
      travelCab: true,
      experience: true,
      rewards: true,
    },
    cabCommissionPct: 10,
    experienceCommissionPct: 15,
    rewardsDiscountPct: 15,
    rewardsReimbursementPct: 80,
    agreement: {
      hasSignedAgreement: true,
      agreementNumber: 'CONV-B2B-2026-004',
      signedDate: '2026-03-10',
      validUntil: '2027-03-10',
      status: 'Vigente',
      fileName: 'Convenio_Regionales_PaseoHistorico.pdf',
      notes: 'Punto oficial de canje de cupones Rewards y venta de excursiones en Paseo Histórico.',
    },
    preferredPaymentMethod: 'Efectivo',
    bankAliasOrCbu: 'REGIONALES.TUC',
    accumulatedPointsBalance: 6400,
    status: 'active',
    createdAt: '2026-03-10T11:00:00.000Z',
  },
];

const FALLBACK_B2B_TOURS: Tour[] = [
  {
    id: 'LV-NOA-001',
    title: 'Tafí del Valle, Ruinas de Quilmes y Cafayate',
    location: 'Tucumán & Valles Calchaquíes',
    price: 78000,
    currency: 'ARS',
    priceRewards: 65000,
    pointsEarned: 180,
    tripType: 'Grupal',
    scope: 'Nacional',
    tourismVertical: 'receptivo',
    productType: 'experiencia_dia',
    transportation: 'Combi Mercedes-Benz Sprinter 19 Pax',
    departureDate: 'Salidas Diarias 07:30 hs',
    departureOrigin: 'Pick-up por Hotel / Sucursal del Aliado',
    services: [
      'Pick-up directo por el Hotel / Agencia',
      'Parada en Monumento al Indio y Dique La Angostura',
      'Ingreso guiado a Ciudad Sagrada de Quilmes',
      'Degustación en Bodega de Cafayate',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&q=80&w=800',
    description: 'El circuito más vendido del NOA recorriendo la Ruta 307, Tafí del Valle, Amaicha, Quilmes y Cafayate.',
    observations: 'Habilitada para venta en Portal B2B Experience.',
    availability: 'Disponible',
    b2bEnabled: true,
    hotelCommissionPct: 15,
  },
  {
    id: 'LV-NOA-002',
    title: 'City Tour Histórico Tucumán, San Javier y Yungas',
    location: 'San Miguel de Tucumán & Yerba Buena',
    price: 42000,
    currency: 'ARS',
    priceRewards: 35000,
    pointsEarned: 110,
    tripType: 'Grupal',
    scope: 'Nacional',
    tourismVertical: 'receptivo',
    productType: 'experiencia_dia',
    transportation: 'Van Ejecutiva / SUV TravelCab',
    departureDate: 'Salidas Diarias 09:00 y 15:00 hs',
    departureOrigin: 'Pick-up por Hotel / Sucursal del Aliado',
    services: [
      'Casa Histórica de la Independencia y Plaza Independencia',
      'Parque 9 de Julio y Museo de la Industria Azucarera',
      'Ascenso por Yungas hasta el Cristo Bendicente en San Javier',
      'Regreso al hotel o punto gastronómico',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&q=80&w=800',
    description: 'Medio día ideal para huéspedes recién llegados a Tucumán combinando historia y selva de Yungas.',
    observations: 'Confirmación inmediata desde recepción.',
    availability: 'Disponible',
    b2bEnabled: true,
    hotelCommissionPct: 15,
  },
  {
    id: 'LV-NOA-003',
    title: 'Ruta del Vino de Altura & Bodegas de Colalao del Valle',
    location: 'Valles Calchaquíes, Tucumán',
    price: 95000,
    currency: 'ARS',
    priceRewards: 80000,
    pointsEarned: 220,
    tripType: 'Grupal',
    scope: 'Nacional',
    tourismVertical: 'receptivo',
    productType: 'experiencia_dia',
    transportation: 'SUV 4x4 Premium (TravelCab)',
    departureDate: 'Jueves a Domingos 08:00 hs',
    departureOrigin: 'Pick-up VIP por Hotel / Agencia',
    services: [
      'Degustación en 3 bodegas de altura en los Valles Calchaquíes',
      'Almuerzo regional maridado con Torrontés y Malbec',
      'Visita a artesanos tejedores en Amaicha del Valle',
      'Guía Sommelier especializado',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=800',
    description: 'Experiencia enogastronómica premium diseñada para pasajeros de hoteles 4 y 5 estrellas.',
    observations: 'Cupos limitados.',
    availability: 'Cupos Limitados',
    b2bEnabled: true,
    hotelCommissionPct: 18,
  },
  {
    id: 'LV-NOA-004',
    title: 'Dique El Cadillal, Aerosilla & Kayak en las Yungas',
    location: 'El Cadillal, Tucumán',
    price: 49000,
    currency: 'ARS',
    priceRewards: 41000,
    pointsEarned: 130,
    tripType: 'Grupal',
    scope: 'Nacional',
    tourismVertical: 'receptivo',
    productType: 'experiencia_dia',
    transportation: 'Minibús Turístico Luna Viajera',
    departureDate: 'Salidas Diarias 10:00 hs',
    departureOrigin: 'Pick-up por Hotel / Sucursal',
    services: [
      'Traslado ida y vuelta desde San Miguel de Tucumán o Yerba Buena',
      'Ticket de ascenso en Complejo Aerosillas El Cadillal',
      'Paseo guiado en Kayak o Catamarán por el espejo de agua',
      'Tiempo libre en anfiteatro y paseo gastronómico frente al lago',
    ],
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=800',
    description: 'Escapada de naturaleza y aventura a solo 25 minutos de la capital tucumana.',
    observations: 'Ideal para familias y parejas.',
    availability: 'Disponible',
    b2bEnabled: true,
    hotelCommissionPct: 15,
  },
];

// Tarifario oficial del Despachador TravelCab para cálculo automático
const TRAVELCAB_VEHICLE_RATES = [
  {
    id: 'Standard',
    label: 'TravelCab Standard (Sedán)',
    baseFare: 1800,
    perKmRate: 950,
    capacity: 'Hasta 4 pasajeros · 2 valijas',
  },
  {
    id: 'Ejecutivo',
    label: 'TravelCab Ejecutivo VIP (Corolla / SUV)',
    baseFare: 2600,
    perKmRate: 1350,
    capacity: 'Hasta 4 pasajeros · Confort Ejecutivo',
  },
  {
    id: 'XL',
    label: 'TravelCab XL / Combi Familiar (6-7 Pax)',
    baseFare: 3800,
    perKmRate: 1750,
    capacity: 'Hasta 7 pasajeros · Equipaje completo',
  },
] as const;

const QUICK_ROUTES_PRESETS = [
  { label: 'Aeropuerto Benjamín Matienzo (TUC)', km: 12.5 },
  { label: 'Terminal de Ómnibus Tucumán', km: 3.5 },
  { label: 'Centro Histórico / Casa Histórica', km: 2.8 },
  { label: 'Yerba Buena (Shopping / Av. Aconquija)', km: 11.0 },
  { label: 'Cerro San Javier (Cristo Bendicente)', km: 26.0 },
  { label: 'Dique El Cadillal', km: 28.0 },
  { label: 'Tafí del Valle (Traslado Privado)', km: 107.0 },
];

// Base de códigos QR y cupones de socios para el Verificador Rewards
const SAMPLE_REWARDS_CODES: Record<
  string,
  {
    code: string;
    memberName: string;
    memberDni: string;
    memberTier: 'Silver' | 'Gold' | 'Black';
    campaignTitle: string;
    bonusDiscountPct: number;
  }
> = {
  'QR-REW-2026': {
    code: 'QR-REW-2026',
    memberName: 'Santiago Paz Posse',
    memberDni: '34.892.104',
    memberTier: 'Black',
    campaignTitle: 'Socio TravelApp Black · Beneficio Gastronomía & Turismo',
    bonusDiscountPct: 20,
  },
  'DESC-NOA-20': {
    code: 'DESC-NOA-20',
    memberName: 'María Florencia Colombres',
    memberDni: '37.110.492',
    memberTier: 'Gold',
    campaignTitle: 'Cupón Descuento 20% Aliados B2B Tucumán',
    bonusDiscountPct: 20,
  },
  'TUC-VIP-15': {
    code: 'TUC-VIP-15',
    memberName: 'Gonzalo Terán',
    memberDni: '31.405.881',
    memberTier: 'Silver',
    campaignTitle: 'Voucher Huésped / Socio Silver 15% OFF',
    bonusDiscountPct: 15,
  },
};

export default function B2BManagerAndPortalPage() {
  // ==========================================================================
  // 1. MODO PRINCIPAL DE VISTA: 'admin_manager' (Gestor B2B) vs 'partner_portal' (Portal B2B)
  // ==========================================================================
  const [workspaceMode, setWorkspaceMode] = useState<'admin_manager' | 'partner_portal'>('admin_manager');

  // Sub-pestaña dentro del Gestor B2B Central
  const [adminSubTab, setAdminSubTab] = useState<'directory' | 'create_form' | 'settlements_cash'>('directory');

  // Estado de Aliados B2B (sincronizado con Firestore `b2b_partners`)
  const [partners, setPartners] = useState<B2BPartner[]>(INITIAL_B2B_PARTNERS);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(INITIAL_B2B_PARTNERS[0].id);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(INITIAL_B2B_PARTNERS[0].branches[0]?.id || '');

  // Pestaña activa en el Sidebar del Portal B2B del Aliado
  const [portalSidebarTab, setPortalSidebarTab] = useState<'travelcab' | 'experience' | 'rewards' | 'settlements'>('travelcab');

  // Filtros del Directorio de Aliados
  const [partnerSearch, setPartnerSearch] = useState('');
  const [partnerCategoryFilter, setPartnerCategoryFilter] = useState<'Todos' | B2BPartnerCategory>('Todos');

  // ==========================================================================
  // 2. ESTADO DEL FORMULARIO DE ALTA / EDICIÓN DE ALIADO B2B
  // ==========================================================================
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [formCategory, setFormCategory] = useState<B2BPartnerCategory>('Hotel');
  const [formCommercialName, setFormCommercialName] = useState('');
  const [formLegalName, setFormLegalName] = useState('');
  const [formCuit, setFormCuit] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formIvaCondition, setFormIvaCondition] = useState<IvaConditionType>('Responsable Inscripto');
  const [formManagerName, setFormManagerName] = useState('');
  const [formManagerPhone, setFormManagerPhone] = useState('');
  const [formManagerEmail, setFormManagerEmail] = useState('');

  // Sucursales dinámicas en el formulario
  const [formBranches, setFormBranches] = useState<B2BBranch[]>([]);
  const [showAddBranchForm, setShowAddBranchForm] = useState(false);
  const [branchDraftName, setBranchDraftName] = useState('');
  const [branchDraftAddress, setBranchDraftAddress] = useState('');
  const [branchDraftManager, setBranchDraftManager] = useState('');
  const [branchDraftEmail, setBranchDraftEmail] = useState('');
  const [branchDraftPhone, setBranchDraftPhone] = useState('');

  // Selector de Servicios que se habilitan
  const [formEnabledServices, setFormEnabledServices] = useState<B2BEnabledServices>({
    travelCab: true,
    experience: true,
    rewards: true,
  });
  const [formCabCommPct, setFormCabCommPct] = useState(10);
  const [formExpCommPct, setFormExpCommPct] = useState(15);
  const [formRewardsDiscPct, setFormRewardsDiscPct] = useState(15);
  const [formRewardsReimbPct, setFormRewardsReimbPct] = useState(100);

  // Convenio Firmado en el formulario
  const [formHasAgreement, setFormHasAgreement] = useState(true);
  const [formAgreementNumber, setFormAgreementNumber] = useState('CONV-B2B-2026-005');
  const [formAgreementDate, setFormAgreementDate] = useState(new Date().toISOString().split('T')[0]);
  const [formAgreementValidUntil, setFormAgreementValidUntil] = useState('2027-04-01');
  const [formAgreementStatus, setFormAgreementStatus] = useState<'Vigente' | 'En Renovación' | 'Pendiente de Firma'>('Vigente');
  const [formAgreementFileName, setFormAgreementFileName] = useState('');
  const [formAgreementDataUrl, setFormAgreementDataUrl] = useState('');
  const [formAgreementNotes, setFormAgreementNotes] = useState('');

  // Preferencias de cobro
  const [formPreferredPayment, setFormPreferredPayment] = useState<'Efectivo' | 'Transferencia' | 'Puntos Rewards'>('Efectivo');
  const [formBankAlias, setFormBankAlias] = useState('');
  const [savingPartner, setSavingPartner] = useState(false);

  // Modal de visualización rápida del Convenio Firmado
  const [viewingAgreementPartner, setViewingAgreementPartner] = useState<B2BPartner | null>(null);

  // ==========================================================================
  // 3. DATOS OPERATIVOS EN TIEMPO REAL (EXCURSIONES, RESERVAS, TRAVELCAB, REWARDS, PAGOS)
  // ==========================================================================
  const [allCatalogTours, setAllCatalogTours] = useState<Tour[]>(FALLBACK_B2B_TOURS);
  const [b2bTourBookings, setB2bTourBookings] = useState<any[]>([]);
  const [b2bCabTrips, setB2bCabTrips] = useState<any[]>([]);
  const [b2bRewardsRedemptions, setB2bRewardsRedemptions] = useState<B2BRewardsRedemption[]>([]);
  const [b2bSettlements, setB2bSettlements] = useState<B2BSettlementRecord[]>([]);

  // ==========================================================================
  // 4. ESTADOS DEL PORTAL B2B DEL ALIADO (DESPACHADOR CAB, EXPERIENCE, REWARDS)
  // ==========================================================================
  // 4.1 TravelCab Despachador B2B (Módulo Central de Despacho Integrado)
  const [cabOrigin, setCabOrigin] = useState('');
  const [b2bPreviewCoords, setB2bPreviewCoords] = useState<{
    originCoords: { lat: number; lng: number } | null;
    destinationCoords: { lat: number; lng: number } | null;
  } | null>(null);
  const [cabDestination, setCabDestination] = useState('');
  const [cabDistanceKm, setCabDistanceKm] = useState<number>(12.5);
  const [cabVehicleType, setCabVehicleType] = useState<'Standard' | 'Ejecutivo' | 'XL'>('Standard');
  const [cabGuestName, setCabGuestName] = useState('');
  const [cabGuestPhone, setCabGuestPhone] = useState('');
  const [cabGuestReference, setCabGuestReference] = useState('');
  const [cabPaymentMethod, setCabPaymentMethod] = useState<'Efectivo al Chofer' | 'Cargo a Cuenta / Recepción' | 'Tarjeta / QR'>('Efectivo al Chofer');
  const [dispatchingCab, setDispatchingCab] = useState(false);
  const [cabSuccessToast, setCabSuccessToast] = useState<string | null>(null);

  // 4.2 Experience Catálogo B2B
  const [expSearch, setExpSearch] = useState('');
  const [selectedTourId, setSelectedTourId] = useState<string>(FALLBACK_B2B_TOURS[0].id);
  const [expGuestName, setExpGuestName] = useState('');
  const [expGuestPhone, setExpGuestPhone] = useState('');
  const [expGuestDni, setExpGuestDni] = useState('');
  const [expPaxCount, setExpPaxCount] = useState(2);
  const [expDate, setExpDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().split('T')[0];
  });
  const [expPaymentMethod, setExpPaymentMethod] = useState<'Cobrado en Mostrador (Descuenta Comisión)' | 'Link de Pago / Seña' | 'Pago al Guía en Pick-up'>('Cobrado en Mostrador (Descuenta Comisión)');
  const [bookingTourSubmitting, setBookingTourSubmitting] = useState(false);
  const [tourSuccessToast, setTourSuccessToast] = useState<string | null>(null);

  // 4.3 Rewards Verificador de Códigos QR y Cupón de Descuento
  const [qrInputCode, setQrInputCode] = useState('QR-REW-2026');
  const [verifiedVoucher, setVerifiedVoucher] = useState<{
    code: string;
    memberName: string;
    memberDni: string;
    memberTier: 'Silver' | 'Gold' | 'Black';
    campaignTitle: string;
    discountPct: number;
  } | null>(null);
  const [ticketAmountInput, setTicketAmountInput] = useState<number>(45000);
  const [invoiceNumberInput, setInvoiceNumberInput] = useState('FC-B-0004-00019283');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [rewardsSuccessToast, setRewardsSuccessToast] = useState<string | null>(null);

  // ==========================================================================
  // 5. MODAL DE LIQUIDACIÓN Y PAGO EN EFECTIVO / TRANSFERENCIA / PUNTOS
  // ==========================================================================
  const [settlementModalPartner, setSettlementModalPartner] = useState<B2BPartner | null>(null);
  const [settlementPaymentMethod, setSettlementPaymentMethod] = useState<'Efectivo' | 'Transferencia' | 'Puntos Rewards'>('Efectivo');
  const [settlementDeliveredBy, setSettlementDeliveredBy] = useState('Tesorería / Recaudador Concorde 360');
  const [settlementReceivedBy, setSettlementReceivedBy] = useState('');
  const [settlementReceivedDni, setSettlementReceivedDni] = useState('');
  const [settlementReceiptNumber, setSettlementReceiptNumber] = useState('');
  const [settlementNotes, setSettlementNotes] = useState('');
  const [processingSettlement, setProcessingSettlement] = useState(false);
  const [printableSettlementReceipt, setPrintableSettlementReceipt] = useState<B2BSettlementRecord | null>(null);

  // ==========================================================================
  // SINCRONIZACIÓN CON FIRESTORE
  // ==========================================================================

  // 1. Escuchar Aliados B2B (`b2b_partners`)
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'b2b_partners'),
      (snap) => {
        if (!snap.empty) {
          const loaded = snap.docs.map((d) => ({ id: d.id, ...d.data() } as B2BPartner));
          setPartners(loaded);
        } else {
          setPartners(INITIAL_B2B_PARTNERS);
        }
      },
      () => {
        setPartners(INITIAL_B2B_PARTNERS);
      }
    );
    return () => unsub();
  }, []);

  // 2. Escuchar Catálogo de Excursiones (`experiences`) y filtrar las habilitadas para B2B
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'experiences'),
      (snap) => {
        if (!snap.empty) {
          const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Tour));
          const b2bList = docs.filter(
            (t) =>
              t.b2bEnabled !== false &&
              (t.tourismVertical === 'receptivo' || !t.scope?.includes('Internacional'))
          );
          if (b2bList.length > 0) {
            setAllCatalogTours(b2bList);
          } else {
            setAllCatalogTours(FALLBACK_B2B_TOURS);
          }
        }
      },
      () => {
        setAllCatalogTours(FALLBACK_B2B_TOURS);
      }
    );
    return () => unsub();
  }, []);

  // 3. Escuchar Reservas de Excursiones B2B (`experience_reservations`)
  useEffect(() => {
    const q = query(collection(db, 'experience_reservations'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as any))
          .filter((r) => r.channel === 'hotel_b2b' || r.partnerId || r.hotelId);
        setB2bTourBookings(list);
      },
      () => {}
    );
    return () => unsub();
  }, []);

  // 4. Escuchar Despachos de TravelCab B2B (`travelcab_trips`)
  useEffect(() => {
    const q = query(collection(db, 'travelcab_trips'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as any))
          .filter((t) => t.bookingChannel === 'hotel_reception_b2b' || t.partnerId || t.hotelId);
        setB2bCabTrips(list);
      },
      () => {}
    );
    return () => unsub();
  }, []);

  // 5. Escuchar Canjes y Descuentos Rewards B2B (`rewards_redemptions`)
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'rewards_redemptions'),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as any))
          .filter((r) => r.channel === 'b2b_portal' || r.partnerId);
        setB2bRewardsRedemptions(list);
      },
      () => {}
    );
    return () => unsub();
  }, []);

  // 6. Escuchar Historial de Pagos y Liquidaciones B2B (`b2b_settlements`)
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'b2b_settlements'),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as B2BSettlementRecord))
          .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setB2bSettlements(list);
      },
      () => {}
    );
    return () => unsub();
  }, []);

  // Aliado activo y sucursal activa
  const activePartner = useMemo(
    () => partners.find((p) => p.id === selectedPartnerId) || partners[0],
    [partners, selectedPartnerId]
  );

  const activeBranch = useMemo(() => {
    if (!activePartner) return null;
    return (
      activePartner.branches?.find((b) => b.id === selectedBranchId) ||
      activePartner.branches?.[0] ||
      null
    );
  }, [activePartner, selectedBranchId]);

  // Actualizar origen de TravelCab y pestaña válida cuando cambia el aliado o sucursal
  useEffect(() => {
    if (!activePartner) return;
    const addr = activeBranch ? `${activePartner.commercialName} (${activeBranch.name}) - ${activeBranch.address}` : `${activePartner.commercialName} - ${activePartner.address}`;
    setCabOrigin(addr);

    // Garantizar que la pestaña activa en el Portal B2B esté habilitada para este aliado
    if (portalSidebarTab === 'travelcab' && !activePartner.enabledServices.travelCab) {
      if (activePartner.enabledServices.experience) setPortalSidebarTab('experience');
      else if (activePartner.enabledServices.rewards) setPortalSidebarTab('rewards');
      else setPortalSidebarTab('settlements');
    } else if (portalSidebarTab === 'experience' && !activePartner.enabledServices.experience) {
      if (activePartner.enabledServices.travelCab) setPortalSidebarTab('travelcab');
      else if (activePartner.enabledServices.rewards) setPortalSidebarTab('rewards');
      else setPortalSidebarTab('settlements');
    } else if (portalSidebarTab === 'rewards' && !activePartner.enabledServices.rewards) {
      if (activePartner.enabledServices.travelCab) setPortalSidebarTab('travelcab');
      else if (activePartner.enabledServices.experience) setPortalSidebarTab('experience');
      else setPortalSidebarTab('settlements');
    }
  }, [activePartner, activeBranch, portalSidebarTab]);

  // ==========================================================================
  // CÁLCULO DE TARIFA Y COMISIÓN EN VIVO DEL DESPACHADOR TRAVELCAB B2B
  // ==========================================================================
  const selectedCabVehicleObj = useMemo(
    () => TRAVELCAB_VEHICLE_RATES.find((v) => v.id === cabVehicleType) || TRAVELCAB_VEHICLE_RATES[0],
    [cabVehicleType]
  );

  const calculatedCabFare = useMemo(() => {
    const km = Math.max(1, Number(cabDistanceKm) || 1);
    return Math.round((selectedCabVehicleObj.baseFare + km * selectedCabVehicleObj.perKmRate) / 100) * 100;
  }, [selectedCabVehicleObj, cabDistanceKm]);

  const calculatedCabCommission = useMemo(() => {
    const pct = activePartner?.cabCommissionPct ?? 10;
    return Math.round(calculatedCabFare * (pct / 100));
  }, [calculatedCabFare, activePartner]);

  // ==========================================================================
  // CÁLCULO DE EXCURSIONES HABILITADAS PARA EXPERIENCE B2B
  // ==========================================================================
  const b2bEnabledTours = useMemo(() => {
    return allCatalogTours.filter(
      (t) =>
        t.b2bEnabled !== false &&
        (expSearch === '' ||
          t.title.toLowerCase().includes(expSearch.toLowerCase()) ||
          t.location.toLowerCase().includes(expSearch.toLowerCase()))
    );
  }, [allCatalogTours, expSearch]);

  const selectedTourObj = useMemo(
    () => b2bEnabledTours.find((t) => t.id === selectedTourId) || b2bEnabledTours[0] || FALLBACK_B2B_TOURS[0],
    [b2bEnabledTours, selectedTourId]
  );

  const effectiveTourCommissionPct = useMemo(() => {
    return selectedTourObj?.hotelCommissionPct || activePartner?.experienceCommissionPct || 15;
  }, [selectedTourObj, activePartner]);

  const tourBookingTotal = (selectedTourObj?.price || 0) * expPaxCount;
  const tourBookingCommission = Math.round(tourBookingTotal * (effectiveTourCommissionPct / 100));

  // ==========================================================================
  // CÁLCULO DE REWARDS (VERIFICADOR QR & DESCUENTOS OTORGADOS)
  // ==========================================================================
  const effectiveRewardsDiscountPct = useMemo(() => {
    return verifiedVoucher?.discountPct || activePartner?.rewardsDiscountPct || 15;
  }, [verifiedVoucher, activePartner]);

  const rewardsDiscountAmountGranted = useMemo(() => {
    return Math.round((Number(ticketAmountInput) || 0) * (effectiveRewardsDiscountPct / 100));
  }, [ticketAmountInput, effectiveRewardsDiscountPct]);

  const rewardsNetToChargeCustomer = useMemo(() => {
    return Math.max(0, (Number(ticketAmountInput) || 0) - rewardsDiscountAmountGranted);
  }, [ticketAmountInput, rewardsDiscountAmountGranted]);

  const rewardsReimbursementDueToPartner = useMemo(() => {
    const reimbPct = activePartner?.rewardsReimbursementPct ?? 100;
    return Math.round(rewardsDiscountAmountGranted * (reimbPct / 100));
  }, [rewardsDiscountAmountGranted, activePartner]);

  const rewardsPointsEquivalent = useMemo(() => {
    return Math.round(rewardsReimbursementDueToPartner / 10);
  }, [rewardsReimbursementDueToPartner]);

  // ==========================================================================
  // RESUMEN CONTABLE Y DE COMISIONES / DESCUENTOS POR ALIADO
  // ==========================================================================
  const getPartnerFinancialSummary = (partnerId: string) => {
    const partnerTrips = b2bCabTrips.filter((t) => (t.partnerId || t.hotelId) === partnerId);
    const partnerTours = b2bTourBookings.filter((r) => (r.partnerId || r.hotelId) === partnerId);
    const partnerRedemptions = b2bRewardsRedemptions.filter((r) => r.partnerId === partnerId);
    const partnerSettlements = b2bSettlements.filter((s) => s.partnerId === partnerId);

    const pendingCab = partnerTrips
      .filter((t) => t.commissionStatus !== 'paid')
      .reduce((acc, t) => acc + (Number(t.hotelCommission) || 0), 0);

    const paidCab = partnerTrips
      .filter((t) => t.commissionStatus === 'paid')
      .reduce((acc, t) => acc + (Number(t.hotelCommission) || 0), 0);

    const pendingExp = partnerTours
      .filter((r) => r.commissionStatus !== 'paid')
      .reduce((acc, r) => acc + (Number(r.hotelCommissionAmount) || 0), 0);

    const paidExp = partnerTours
      .filter((r) => r.commissionStatus === 'paid')
      .reduce((acc, r) => acc + (Number(r.hotelCommissionAmount) || 0), 0);

    const pendingRewards = partnerRedemptions
      .filter((r) => r.settlementStatus !== 'paid')
      .reduce((acc, r) => acc + (Number(r.reimbursementAmountDue) || 0), 0);

    const paidRewards = partnerRedemptions
      .filter((r) => r.settlementStatus === 'paid')
      .reduce((acc, r) => acc + (Number(r.reimbursementAmountDue) || 0), 0);

    const totalPendingArs = pendingCab + pendingExp + pendingRewards;
    const totalPaidArs = paidCab + paidExp + paidRewards;

    const pendingItemsCount =
      partnerTrips.filter((t) => t.commissionStatus !== 'paid').length +
      partnerTours.filter((r) => r.commissionStatus !== 'paid').length +
      partnerRedemptions.filter((r) => r.settlementStatus !== 'paid').length;

    return {
      pendingCab,
      paidCab,
      pendingExp,
      paidExp,
      pendingRewards,
      paidRewards,
      totalPendingArs,
      totalPaidArs,
      pendingItemsCount,
      partnerTrips,
      partnerTours,
      partnerRedemptions,
      partnerSettlements,
    };
  };

  const activePartnerSummary = useMemo(
    () => getPartnerFinancialSummary(activePartner?.id || ''),
    [activePartner, b2bCabTrips, b2bTourBookings, b2bRewardsRedemptions, b2bSettlements]
  );

  // ==========================================================================
  // FUNCIONES DEL FORMULARIO DE ALTA / EDICIÓN DE ALIADO B2B
  // ==========================================================================
  const handleResetAndOpenNewPartnerForm = () => {
    setEditingPartnerId(null);
    setFormCategory('Hotel');
    setFormCommercialName('');
    setFormLegalName('');
    setFormCuit('');
    setFormAddress('');
    setFormPhone('');
    setFormEmail('');
    setFormIvaCondition('Responsable Inscripto');
    setFormManagerName('');
    setFormManagerPhone('');
    setFormManagerEmail('');
    setFormBranches([]);
    setShowAddBranchForm(false);
    setFormEnabledServices({ travelCab: true, experience: true, rewards: true });
    setFormCabCommPct(10);
    setFormExpCommPct(15);
    setFormRewardsDiscPct(15);
    setFormRewardsReimbPct(100);
    setFormHasAgreement(true);
    setFormAgreementNumber(`CONV-B2B-2026-00${partners.length + 1}`);
    setFormAgreementDate(new Date().toISOString().split('T')[0]);
    setFormAgreementValidUntil('2027-04-01');
    setFormAgreementStatus('Vigente');
    setFormAgreementFileName('');
    setFormAgreementDataUrl('');
    setFormAgreementNotes('');
    setFormPreferredPayment('Efectivo');
    setFormBankAlias('');
    setAdminSubTab('create_form');
  };

  const handleOpenEditPartnerForm = (partner: B2BPartner) => {
    setEditingPartnerId(partner.id);
    setFormCategory(partner.category);
    setFormCommercialName(partner.commercialName);
    setFormLegalName(partner.legalName);
    setFormCuit(partner.cuit);
    setFormAddress(partner.address);
    setFormPhone(partner.phone);
    setFormEmail(partner.email);
    setFormIvaCondition(partner.ivaCondition);
    setFormManagerName(partner.managerName);
    setFormManagerPhone(partner.managerPhone);
    setFormManagerEmail(partner.managerEmail);
    setFormBranches(partner.branches || []);
    setFormEnabledServices(partner.enabledServices);
    setFormCabCommPct(partner.cabCommissionPct);
    setFormExpCommPct(partner.experienceCommissionPct);
    setFormRewardsDiscPct(partner.rewardsDiscountPct);
    setFormRewardsReimbPct(partner.rewardsReimbursementPct);
    setFormHasAgreement(partner.agreement?.hasSignedAgreement ?? true);
    setFormAgreementNumber(partner.agreement?.agreementNumber || '');
    setFormAgreementDate(partner.agreement?.signedDate || '');
    setFormAgreementValidUntil(partner.agreement?.validUntil || '');
    setFormAgreementStatus(partner.agreement?.status || 'Vigente');
    setFormAgreementFileName(partner.agreement?.fileName || '');
    setFormAgreementDataUrl(partner.agreement?.fileDataUrl || '');
    setFormAgreementNotes(partner.agreement?.notes || '');
    setFormPreferredPayment(partner.preferredPaymentMethod || 'Efectivo');
    setFormBankAlias(partner.bankAliasOrCbu || '');
    setAdminSubTab('create_form');
  };

  const handleAddBranchToForm = () => {
    if (!branchDraftAddress.trim() || !branchDraftManager.trim()) {
      alert('Completá el Domicilio y el Responsable de la sucursal.');
      return;
    }
    const newBranch: B2BBranch = {
      id: `BR-${Date.now()}`,
      name: branchDraftName.trim() || `Sucursal ${formBranches.length + 1}`,
      address: branchDraftAddress.trim(),
      managerName: branchDraftManager.trim(),
      managerEmail: branchDraftEmail.trim(),
      managerPhone: branchDraftPhone.trim(),
    };
    setFormBranches((prev) => [...prev, newBranch]);
    setBranchDraftName('');
    setBranchDraftAddress('');
    setBranchDraftManager('');
    setBranchDraftEmail('');
    setBranchDraftPhone('');
    setShowAddBranchForm(false);
  };

  const handleRemoveBranchFromForm = (branchId: string) => {
    setFormBranches((prev) => prev.filter((b) => b.id !== branchId));
  };

  // Manejo de subida de archivo de Convenio Firmado (PDF o Imagen)
  const handleAgreementFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormAgreementFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Si el archivo es menor a 700KB guardamos el DataURL directo para descarga inmediata
        if (file.size <= 700 * 1024) {
          setFormAgreementDataUrl(reader.result);
        } else {
          setFormAgreementDataUrl('');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCommercialName.trim() || !formCuit.trim()) {
      alert('Por favor completá el Nombre Comercial y el CUIT del aliado.');
      return;
    }
    if (!formEnabledServices.travelCab && !formEnabledServices.experience && !formEnabledServices.rewards) {
      alert('Seleccioná al menos un servicio habilitado (TravelCab, Experience o Rewards).');
      return;
    }

    setSavingPartner(true);
    try {
      const partnerId = editingPartnerId || `B2B-ALLY-${Math.floor(100 + Math.random() * 900)}`;
      const branchesToSave: B2BBranch[] =
        formBranches.length > 0
          ? formBranches
          : [
              {
                id: `BR-${Date.now()}`,
                name: 'Casa Central / Recepción Principal',
                address: formAddress,
                managerName: formManagerName,
                managerEmail: formManagerEmail || formEmail,
                managerPhone: formManagerPhone || formPhone,
              },
            ];

      const newPartnerObj: B2BPartner = {
        id: partnerId,
        category: formCategory,
        commercialName: formCommercialName.trim(),
        legalName: formLegalName.trim() || formCommercialName.trim(),
        cuit: formCuit.trim(),
        address: formAddress.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        ivaCondition: formIvaCondition,
        managerName: formManagerName.trim(),
        managerPhone: formManagerPhone.trim(),
        managerEmail: formManagerEmail.trim(),
        branches: branchesToSave,
        enabledServices: formEnabledServices,
        cabCommissionPct: Number(formCabCommPct) || 10,
        experienceCommissionPct: Number(formExpCommPct) || 15,
        rewardsDiscountPct: Number(formRewardsDiscPct) || 15,
        rewardsReimbursementPct: Number(formRewardsReimbPct) || 100,
        agreement: {
          hasSignedAgreement: formHasAgreement,
          agreementNumber: formAgreementNumber.trim() || `CONV-${partnerId}`,
          signedDate: formAgreementDate,
          validUntil: formAgreementValidUntil,
          status: formAgreementStatus,
          fileName: formAgreementFileName || `Convenio_${formCommercialName.replace(/\s+/g, '_')}.pdf`,
          fileDataUrl: formAgreementDataUrl,
          notes: formAgreementNotes.trim(),
        },
        preferredPaymentMethod: formPreferredPayment,
        bankAliasOrCbu: formBankAlias.trim(),
        accumulatedPointsBalance:
          partners.find((p) => p.id === partnerId)?.accumulatedPointsBalance || 0,
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'b2b_partners', partnerId), newPartnerObj);
      setPartners((prev) => {
        const exists = prev.some((p) => p.id === partnerId);
        return exists ? prev.map((p) => (p.id === partnerId ? newPartnerObj : p)) : [newPartnerObj, ...prev];
      });
      setSelectedPartnerId(partnerId);
      setAdminSubTab('directory');
    } catch (err) {
      console.error('Error guardando aliado B2B:', err);
    } finally {
      setSavingPartner(false);
    }
  };

  // ==========================================================================
  // ACCIONES OPERATIVAS DEL PORTAL B2B (TRAVELCAB, EXPERIENCE, REWARDS)
  // ==========================================================================

  // 1. Despachar TravelCab desde el Portal B2B
  const handleDispatchCab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cabDestination.trim() || !cabGuestName.trim() || !activePartner) return;
    setDispatchingCab(true);
    try {
      const tripCode = `CAB-B2B-${Math.floor(1000 + Math.random() * 9000)}`;
      const payload = {
        tripCode,
        bookingChannel: 'hotel_reception_b2b',
        partnerId: activePartner.id,
        partnerName: activePartner.commercialName,
        partnerCategory: activePartner.category,
        hotelId: activePartner.id,
        hotelName: activePartner.commercialName,
        branchId: activeBranch?.id || 'CENTRAL',
        branchName: activeBranch?.name || 'Casa Central',
        passengerName: cabGuestName.trim(),
        passengerPhone: cabGuestPhone.trim(),
        roomNumber: cabGuestReference.trim() || 'Mostrador',
        origin: cabOrigin.trim(),
        destination: cabDestination.trim(),
        distanceKm: Number(cabDistanceKm) || 5,
        vehicleCategory: cabVehicleType,
        paymentMethod: cabPaymentMethod,
        estimatedFare: calculatedCabFare,
        hotelCommissionPct: activePartner.cabCommissionPct,
        hotelCommission: calculatedCabCommission,
        commissionStatus: 'pending',
        status: 'dispatching',
        driverName: 'Asignando unidad cercana...',
        createdAt: serverTimestamp(),
        createdAtIso: new Date().toISOString(),
      };

      await addDoc(collection(db, 'travelcab_trips'), payload);
      setCabSuccessToast(
        `¡Móvil ${cabVehicleType} despachado (${tripCode})! Tarifa: $${calculatedCabFare.toLocaleString('es-AR')} · Tu comisión: $${calculatedCabCommission.toLocaleString('es-AR')}`
      );
      setCabDestination('');
      setCabGuestName('');
      setCabGuestPhone('');
      setCabGuestReference('');
      setTimeout(() => setCabSuccessToast(null), 6000);
    } catch (err) {
      console.error('Error despachando TravelCab B2B:', err);
    } finally {
      setDispatchingCab(false);
    }
  };

  // 2. Reservar Excursión desde Experience B2B
  const handleBookExperienceB2B = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expGuestName.trim() || !selectedTourObj || !activePartner) return;
    setBookingTourSubmitting(true);
    try {
      const fileNumber = `EXP-B2B-${Math.floor(1000 + Math.random() * 9000)}`;
      const payload = {
        fileNumber,
        channel: 'hotel_b2b',
        businessUnit: 'TravelApp Experience B2B',
        operatedBy: 'Luna Viajera',
        partnerId: activePartner.id,
        partnerName: activePartner.commercialName,
        partnerCategory: activePartner.category,
        hotelId: activePartner.id,
        hotelName: activePartner.commercialName,
        branchName: activeBranch?.name || 'Casa Central',
        receptionistName: activeBranch?.managerName || activePartner.managerName,
        tourId: selectedTourObj.id,
        tourTitle: selectedTourObj.title,
        customerName: expGuestName.trim(),
        customerPhone: expGuestPhone.trim(),
        customerDni: expGuestDni.trim(),
        roomNumber: activeBranch?.name || 'Mostrador',
        paxCount: Number(expPaxCount),
        departureDate: expDate,
        pickupLocation: `${activePartner.commercialName} (${activeBranch?.address || activePartner.address})`,
        totalAmount: tourBookingTotal,
        hotelCommissionPct: effectiveTourCommissionPct,
        hotelCommissionAmount: tourBookingCommission,
        netToLunaViajera: tourBookingTotal - tourBookingCommission,
        paymentMethod: expPaymentMethod,
        status: 'Confirmada',
        commissionStatus: 'pending',
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'experience_reservations'), payload);
      setTourSuccessToast(
        `¡Voucher ${fileNumber} emitido! Comisión generada para ${activePartner.commercialName}: $${tourBookingCommission.toLocaleString('es-AR')}`
      );
      setExpGuestName('');
      setExpGuestPhone('');
      setExpGuestDni('');
      setTimeout(() => setTourSuccessToast(null), 6000);
    } catch (err) {
      console.error('Error registrando reserva Experience B2B:', err);
    } finally {
      setBookingTourSubmitting(false);
    }
  };

  // 3. Verificar Código QR / Cupón Rewards y Registrar Descuento Otorgado
  const handleVerifyQrOrCoupon = () => {
    const normalized = qrInputCode.trim().toUpperCase();
    if (!normalized) return;

    const foundPreset = SAMPLE_REWARDS_CODES[normalized];
    if (foundPreset) {
      setVerifiedVoucher({
        code: foundPreset.code,
        memberName: foundPreset.memberName,
        memberDni: foundPreset.memberDni,
        memberTier: foundPreset.memberTier,
        campaignTitle: foundPreset.campaignTitle,
        discountPct: activePartner?.rewardsDiscountPct || foundPreset.bonusDiscountPct,
      });
    } else {
      // Cualquier código QR o cupón ingresado es validado dinámicamente con el % configurado del aliado
      setVerifiedVoucher({
        code: normalized,
        memberName: 'Socio Verificado TravelApp Rewards',
        memberDni: '35.612.890',
        memberTier: 'Gold',
        campaignTitle: `Beneficio Oficial en ${activePartner?.commercialName || 'Aliado B2B'}`,
        discountPct: activePartner?.rewardsDiscountPct || 15,
      });
    }
  };

  const handleConfirmRewardsRedemption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePartner) return;
    const activeVoucher = verifiedVoucher || {
      code: qrInputCode.trim().toUpperCase() || 'QR-SOCIO-DIRECTO',
      memberName: 'Socio TravelApp Rewards',
      memberDni: '35.612.890',
      memberTier: 'Gold' as const,
      campaignTitle: `Descuento B2B ${activePartner.commercialName}`,
      discountPct: activePartner.rewardsDiscountPct,
    };

    setValidatingCoupon(true);
    try {
      const redemptionPayload: Omit<B2BRewardsRedemption, 'id'> & { channel: string; merchantName: string; status: string } = {
        channel: 'b2b_portal',
        partnerId: activePartner.id,
        partnerName: activePartner.commercialName,
        merchantName: activePartner.commercialName,
        branchName: activeBranch?.name || 'Casa Central',
        voucherCode: activeVoucher.code,
        memberName: activeVoucher.memberName,
        memberDni: activeVoucher.memberDni,
        memberTier: activeVoucher.memberTier,
        ticketTotalAmount: Number(ticketAmountInput) || 0,
        discountPctApplied: effectiveRewardsDiscountPct,
        discountAmountGranted: rewardsDiscountAmountGranted,
        netChargedToCustomer: rewardsNetToChargeCustomer,
        reimbursementPct: activePartner.rewardsReimbursementPct,
        reimbursementAmountDue: rewardsReimbursementDueToPartner,
        pointsEquivalentDue: rewardsPointsEquivalent,
        invoiceOrTicketNumber: invoiceNumberInput.trim() || 'S/N',
        settlementStatus: 'pending',
        status: 'validated',
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'rewards_redemptions'), redemptionPayload);
      setRewardsSuccessToast(
        `¡Cupón ${activeVoucher.code} validado! Descuento otorgado: $${rewardsDiscountAmountGranted.toLocaleString('es-AR')} · Pendiente de pago/reintegro al aliado: $${rewardsReimbursementDueToPartner.toLocaleString('es-AR')}`
      );
      setTimeout(() => setRewardsSuccessToast(null), 6000);
    } catch (err) {
      console.error('Error registrando descuento Rewards B2B:', err);
    } finally {
      setValidatingCoupon(false);
    }
  };

  // ==========================================================================
  // GESTIÓN DE PAGO EN EFECTIVO / TRANSFERENCIA / PUNTOS DE COMISIONES Y REWARDS
  // ==========================================================================
  const handleOpenSettlementModal = (partner: B2BPartner) => {
    setSettlementModalPartner(partner);
    setSettlementPaymentMethod(partner.preferredPaymentMethod || 'Efectivo');
    setSettlementDeliveredBy('Tesorería / Recaudador Concorde 360');
    setSettlementReceivedBy(partner.managerName);
    setSettlementReceivedDni('');
    setSettlementReceiptNumber(`REC-EFE-${Math.floor(10000 + Math.random() * 90000)}`);
    setSettlementNotes(
      `Liquidación total de comisiones TravelCab, Experience y descuentos Rewards para ${partner.commercialName}.`
    );
  };

  const handleConfirmSettlementPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlementModalPartner) return;
    const summary = getPartnerFinancialSummary(settlementModalPartner.id);
    if (summary.totalPendingArs <= 0) {
      alert('Este aliado no registra saldo pendiente de cobro en este momento.');
      return;
    }

    setProcessingSettlement(true);
    try {
      const pointsToCredit =
        settlementPaymentMethod === 'Puntos Rewards'
          ? Math.round(summary.totalPendingArs / 10)
          : 0;

      const settlementId = `LIQ-B2B-${Date.now()}`;
      const record: B2BSettlementRecord = {
        id: settlementId,
        partnerId: settlementModalPartner.id,
        partnerName: settlementModalPartner.commercialName,
        partnerCategory: settlementModalPartner.category,
        paymentMethod: settlementPaymentMethod,
        amountArs: summary.totalPendingArs,
        pointsCredited: pointsToCredit,
        cabCommissionIncluded: summary.pendingCab,
        experienceCommissionIncluded: summary.pendingExp,
        rewardsReimbursementIncluded: summary.pendingRewards,
        itemsCount: summary.pendingItemsCount,
        deliveredByName: settlementDeliveredBy.trim() || 'Administración Concorde 360',
        receivedByName: settlementReceivedBy.trim() || settlementModalPartner.managerName,
        receivedByDni: settlementReceivedDni.trim(),
        receiptNumber: settlementReceiptNumber.trim() || `REC-${Date.now()}`,
        notes: settlementNotes.trim(),
        createdAt: new Date().toISOString(),
      };

      // 1. Guardar comprobante de liquidación en `b2b_settlements`
      await setDoc(doc(db, 'b2b_settlements', settlementId), record);

      // 2. Marcar viajes TravelCab como pagados
      for (const trip of summary.partnerTrips.filter((t) => t.commissionStatus !== 'paid')) {
        await updateDoc(doc(db, 'travelcab_trips', trip.id), {
          commissionStatus: 'paid',
          settlementPaymentMethod,
          settlementReceiptNumber: record.receiptNumber,
          settledAt: record.createdAt,
        });
      }

      // 3. Marcar reservas Experience como pagadas
      for (const res of summary.partnerTours.filter((r) => r.commissionStatus !== 'paid')) {
        await updateDoc(doc(db, 'experience_reservations', res.id), {
          commissionStatus: 'paid',
          settlementPaymentMethod,
          settlementReceiptNumber: record.receiptNumber,
          settledAt: record.createdAt,
        });
      }

      // 4. Marcar descuentos otorgados de Rewards como pagados
      for (const red of summary.partnerRedemptions.filter((r) => r.settlementStatus !== 'paid')) {
        await updateDoc(doc(db, 'rewards_redemptions', red.id), {
          settlementStatus: 'paid',
          settlementPaymentMethod,
          settlementReceiptNumber: record.receiptNumber,
          settledAt: record.createdAt,
        });
      }

      // 5. Si se pagó con Puntos Rewards, acreditar los puntos a la cuenta del aliado
      if (pointsToCredit > 0) {
        const updatedPoints = (settlementModalPartner.accumulatedPointsBalance || 0) + pointsToCredit;
        await setDoc(
          doc(db, 'b2b_partners', settlementModalPartner.id),
          { ...settlementModalPartner, accumulatedPointsBalance: updatedPoints },
          { merge: true }
        );
      }

      setSettlementModalPartner(null);
      setPrintableSettlementReceipt(record);
    } catch (err) {
      console.error('Error procesando liquidación B2B:', err);
    } finally {
      setProcessingSettlement(false);
    }
  };

  // Filtrado de aliados en el directorio
  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const matchesCat = partnerCategoryFilter === 'Todos' || p.category === partnerCategoryFilter;
      const matchesQuery =
        partnerSearch === '' ||
        p.commercialName.toLowerCase().includes(partnerSearch.toLowerCase()) ||
        p.legalName.toLowerCase().includes(partnerSearch.toLowerCase()) ||
        p.cuit.includes(partnerSearch) ||
        p.managerName.toLowerCase().includes(partnerSearch.toLowerCase());
      return matchesCat && matchesQuery;
    });
  }, [partners, partnerCategoryFilter, partnerSearch]);

  // Totales globales del Gestor B2B
  const globalB2BMetrics = useMemo(() => {
    let pendingTotal = 0;
    let paidTotal = 0;
    let pendingRewardsDiscounts = 0;
    partners.forEach((p) => {
      const s = getPartnerFinancialSummary(p.id);
      pendingTotal += s.totalPendingArs;
      paidTotal += s.totalPaidArs;
      pendingRewardsDiscounts += s.pendingRewards;
    });
    return { pendingTotal, paidTotal, pendingRewardsDiscounts };
  }, [partners, b2bCabTrips, b2bTourBookings, b2bRewardsRedemptions]);

  return (
    <div className="space-y-6 pb-16">
      {/* ====================================================================
          BARRA SUPERIOR DEL ECOSISTEMA B2B: GESTOR CENTRAL vs PORTAL B2B
          ==================================================================== */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 text-white shadow-xl border border-amber-500/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-wider mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>Concorde 360 · Red Comercial de Aliados B2B</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Gestor B2B & Portal Operativo de Aliados
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-3xl">
              Administrá el alta fiscal y sucursales de <strong>Agencias, Hoteles, Comercios y Bares/Restó</strong>, resguardá el <strong>Convenio Firmado</strong>, liquidá comisiones o descuentos de <strong>Rewards en Efectivo / Puntos</strong> y operá el <strong>Portal B2B</strong> con sidebar dinámico.
            </p>
          </div>

          {/* Conmutador Principal: Gestor B2B (Admin) vs Portal B2B del Aliado */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-950/70 p-1.5 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setWorkspaceMode('admin_manager')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                workspaceMode === 'admin_manager'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Gestor Central B2B ({partners.length} Aliados)</span>
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceMode('partner_portal')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                workspaceMode === 'partner_portal'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Navigation className="w-4 h-4" />
              <span>Abrir Portal B2B del Aliado</span>
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================
          MODO 1: GESTOR CENTRAL B2B (ALTA DE ALIADOS, CONVENIOS Y PAGOS EN EFECTIVO/PUNTOS)
          ==================================================================== */}
      {workspaceMode === 'admin_manager' && (
        <div className="space-y-6">
          {/* Sub-navegación del Gestor B2B */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setAdminSubTab('directory')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                  adminSubTab === 'directory'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Directorio de Aliados & Convenios ({partners.length})</span>
              </button>

              <button
                type="button"
                onClick={handleResetAndOpenNewPartnerForm}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                  adminSubTab === 'create_form'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>{editingPartnerId ? 'Editando Aliado B2B' : '+ Dar de Alta Nuevo Aliado B2B'}</span>
              </button>

              <button
                type="button"
                onClick={() => setAdminSubTab('settlements_cash')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                  adminSubTab === 'settlements_cash'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Liquidación y Pago en Efectivo / Puntos</span>
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-bold">
                Pendiente a Pagar Aliados:{' '}
                <span className="font-black text-amber-700">
                  ${globalB2BMetrics.pendingTotal.toLocaleString('es-AR')}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold">
                Total Liquidado:{' '}
                <span className="font-black text-emerald-700">
                  ${globalB2BMetrics.paidTotal.toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------------
              SUB-PESTAÑA 1.1: DIRECTORIO DE ALIADOS, SUCURSALES Y CONVENIOS
              ---------------------------------------------------------------- */}
          {adminSubTab === 'directory' && (
            <div className="space-y-5">
              {/* Barra de filtro por tipo de aliado y buscador */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(['Todos', 'Agencia', 'Hotel', 'Comercio', 'Bar / Restó'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setPartnerCategoryFilter(cat)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                        partnerCategoryFilter === cat
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    value={partnerSearch}
                    onChange={(e) => setPartnerSearch(e.target.value)}
                    placeholder="Buscar por Nombre Comercial, CUIT, Responsable..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Grilla de Tarjetas de Aliados B2B */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {filteredPartners.map((partner) => {
                  const fin = getPartnerFinancialSummary(partner.id);
                  return (
                    <div
                      key={partner.id}
                      className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                    >
                      <div className="p-6 space-y-4">
                        {/* Encabezado de la tarjeta */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  partner.category === 'Hotel'
                                    ? 'bg-amber-100 text-amber-900'
                                    : partner.category === 'Agencia'
                                    ? 'bg-blue-100 text-blue-900'
                                    : partner.category === 'Bar / Restó'
                                    ? 'bg-rose-100 text-rose-900'
                                    : 'bg-purple-100 text-purple-900'
                                }`}
                              >
                                {partner.category}
                              </span>
                              <span className="text-[11px] font-bold text-slate-400">
                                CUIT: {partner.cuit} · {partner.ivaCondition}
                              </span>
                            </div>
                            <h3 className="text-lg font-black text-slate-900">{partner.commercialName}</h3>
                            <p className="text-xs font-medium text-slate-500">
                              Razón Social: <strong className="text-slate-700">{partner.legalName}</strong>
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditPartnerForm(partner)}
                              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                              title="Editar Aliado y Convenio"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Datos de domicilio, responsable y sucursales */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-slate-400">Domicilio & Contacto</p>
                            <p className="font-bold text-slate-800 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{partner.address}</span>
                            </p>
                            <p className="text-slate-600 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{partner.phone}</span>
                            </p>
                            <p className="text-slate-600 flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{partner.email}</span>
                            </p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-slate-400">Responsable Designado</p>
                            <p className="font-bold text-slate-800 flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{partner.managerName}</span>
                            </p>
                            <p className="text-slate-600 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{partner.managerPhone}</span>
                            </p>
                            <p className="text-slate-600 flex items-center gap-1.5">
                              <GitBranch className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span className="font-bold text-amber-900">
                                {partner.branches?.length || 1} Sucursal(es) habilitada(s)
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Servicios Habilitados y % configurados */}
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                            Servicios Habilitados en el Sidebar del Portal B2B
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border ${
                                partner.enabledServices.travelCab
                                  ? 'bg-blue-50 text-blue-900 border-blue-200'
                                  : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                              }`}
                            >
                              <Car className="w-3.5 h-3.5" />
                              TravelCab ({partner.cabCommissionPct}% com.)
                            </span>

                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border ${
                                partner.enabledServices.experience
                                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                                  : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                              }`}
                            >
                              <Compass className="w-3.5 h-3.5" />
                              Experience ({partner.experienceCommissionPct}% com.)
                            </span>

                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border ${
                                partner.enabledServices.rewards
                                  ? 'bg-purple-50 text-purple-900 border-purple-200'
                                  : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                              }`}
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              Rewards ({partner.rewardsDiscountPct}% dto.)
                            </span>
                          </div>
                        </div>

                        {/* Estado del Convenio Firmado y Saldo de Comisiones / Puntos */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div className="rounded-2xl border border-slate-200 p-3 flex items-center justify-between">
                            <div>
                              <span className="block text-[10px] font-black uppercase text-slate-400">
                                Convenio Firmado
                              </span>
                              <span className="text-xs font-black text-slate-800">
                                {partner.agreement?.hasSignedAgreement
                                  ? partner.agreement.agreementNumber
                                  : 'Sin convenio adjunto'}
                              </span>
                              <span className="block text-[10px] text-emerald-700 font-bold">
                                {partner.agreement?.status} · Vence {partner.agreement?.validUntil || '-'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setViewingAgreementPartner(partner)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-black flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              Ver Convenio
                            </button>
                          </div>

                          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 flex items-center justify-between">
                            <div>
                              <span className="block text-[10px] font-black uppercase text-emerald-700">
                                Saldo Pendiente a Pagar
                              </span>
                              <span className="text-base font-black text-emerald-950">
                                ${fin.totalPendingArs.toLocaleString('es-AR')}
                              </span>
                              <span className="block text-[10px] text-emerald-700 font-bold">
                                Billetera: {(partner.accumulatedPointsBalance || 0).toLocaleString('es-AR')} pts
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenSettlementModal(partner)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black flex items-center gap-1 shadow-xs"
                            >
                              <Banknote className="w-3.5 h-3.5" />
                              Pagar
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Pie de tarjeta: Botón directo al Portal B2B de este aliado */}
                      <div className="bg-slate-900 px-6 py-3.5 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-300">
                          Cobro preferido: <strong className="text-amber-400">{partner.preferredPaymentMethod}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPartnerId(partner.id);
                            setSelectedBranchId(partner.branches?.[0]?.id || '');
                            setWorkspaceMode('partner_portal');
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-black text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          <span>Abrir Portal B2B de {partner.commercialName}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------
              SUB-PESTAÑA 1.2: FORMULARIO DE ALTA / EDICIÓN DE ALIADO B2B
              ---------------------------------------------------------------- */}
          {adminSubTab === 'create_form' && (
            <form
              onSubmit={handleSavePartner}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="bg-slate-900 text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                    Alta Oficial de Aliado Comercial B2B
                  </span>
                  <h2 className="text-xl font-black mt-0.5">
                    {editingPartnerId
                      ? `Editar Ficha y Convenio: ${formCommercialName}`
                      : 'Dar de Alta Nuevo Aliado B2B'}
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Completá los datos comerciales, fiscales, sucursales, servicios habilitados y adjuntá el convenio firmado.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAdminSubTab('directory')}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white self-start sm:self-auto"
                >
                  Volver al Listado
                </button>
              </div>

              <div className="p-6 sm:p-8 space-y-8">
                {/* 1. SELECTOR DE RUBRO / CATEGORÍA DEL ALIADO */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-3">
                    1. Seleccionar Tipo de Aliado B2B
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(
                      [
                        { id: 'Agencia', label: 'Agencia', icon: Briefcase, desc: 'Agencias de viajes y receptivos' },
                        { id: 'Hotel', label: 'Hotel', icon: Hotel, desc: 'Hoteles, aparts y hosterías' },
                        { id: 'Comercio', label: 'Comercio', icon: Store, desc: 'Regionales, locales y tiendas' },
                        { id: 'Bar / Restó', label: 'Bar / Restó', icon: Utensils, desc: 'Gastronomía, peñas y cafés' },
                      ] as const
                    ).map((item) => {
                      const Icon = item.icon;
                      const active = formCategory === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFormCategory(item.id)}
                          className={`p-4 rounded-2xl border text-left transition-all ${
                            active
                              ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/20'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <Icon className={`w-5 h-5 ${active ? 'text-amber-600' : 'text-slate-400'}`} />
                            {active && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                          </div>
                          <p className="text-sm font-black text-slate-900">{item.label}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. DATOS COMERCIALES Y FISCALES */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                    2. Datos Comerciales y Fiscales
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nombre Comercial *
                      </label>
                      <input
                        type="text"
                        required
                        value={formCommercialName}
                        onChange={(e) => setFormCommercialName(e.target.value)}
                        placeholder="Ej: Sheraton Tucumán / El Portal"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Razón Social *
                      </label>
                      <input
                        type="text"
                        required
                        value={formLegalName}
                        onChange={(e) => setFormLegalName(e.target.value)}
                        placeholder="Ej: Hoteles del Jardín S.A."
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        CUIT *
                      </label>
                      <input
                        type="text"
                        required
                        value={formCuit}
                        onChange={(e) => setFormCuit(e.target.value)}
                        placeholder="30-71234567-9"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Domicilio Comercial *
                      </label>
                      <input
                        type="text"
                        required
                        value={formAddress}
                        onChange={(e) => setFormAddress(e.target.value)}
                        placeholder="Calle, Número, Localidad, Provincia"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Teléfono Comercial *
                      </label>
                      <input
                        type="text"
                        required
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        placeholder="+54 9 381 ..."
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Correo Electrónico *
                      </label>
                      <input
                        type="email"
                        required
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        placeholder="administracion@aliado.com"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Condición Frente a IVA *
                      </label>
                      <select
                        value={formIvaCondition}
                        onChange={(e) => setFormIvaCondition(e.target.value as IvaConditionType)}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-900 bg-white outline-none focus:border-amber-500"
                      >
                        <option value="Responsable Inscripto">Responsable Inscripto</option>
                        <option value="Monotributo">Monotributo</option>
                        <option value="IVA Exento">IVA Exento</option>
                        <option value="Consumidor Final">Consumidor Final</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Modalidad Preferida de Cobro de Comisiones
                      </label>
                      <select
                        value={formPreferredPayment}
                        onChange={(e) => setFormPreferredPayment(e.target.value as any)}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-900 bg-white outline-none focus:border-amber-500"
                      >
                        <option value="Efectivo">Efectivo en Mano (Recaudador / Mostrador)</option>
                        <option value="Transferencia">Transferencia Bancaria (CBU / Alias)</option>
                        <option value="Puntos Rewards">Acreditación de Puntos TravelApp Rewards</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        CBU / Alias Bancario (Opcional)
                      </label>
                      <input
                        type="text"
                        value={formBankAlias}
                        onChange={(e) => setFormBankAlias(e.target.value)}
                        placeholder="ALIADO.B2B.MP"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. DATOS DEL RESPONSABLE PRINCIPAL */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                    3. Datos del Responsable Principal
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Responsable (Nombre y Apellido) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formManagerName}
                        onChange={(e) => setFormManagerName(e.target.value)}
                        placeholder="Ej: Lic. Martín Alurralde"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Teléfono del Responsable *
                      </label>
                      <input
                        type="text"
                        required
                        value={formManagerPhone}
                        onChange={(e) => setFormManagerPhone(e.target.value)}
                        placeholder="+54 9 381 512-3344"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Correo del Responsable *
                      </label>
                      <input
                        type="email"
                        required
                        value={formManagerEmail}
                        onChange={(e) => setFormManagerEmail(e.target.value)}
                        placeholder="responsable@aliado.com"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. AGREGAR SUCURSALES (DESPLIEGA DOMICILIO - RESPONSABLE - CORREO - TELÉFONO) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                        4. Sucursales / Puntos de Atención ({formBranches.length})
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Agregá cada sucursal o mostrador con su Domicilio, Responsable, Correo y Teléfono.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddBranchForm((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-xs transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Agregar Sucursal</span>
                    </button>
                  </div>

                  {/* Panel desplegable al hacer clic en "Agregar Sucursal" */}
                  {showAddBranchForm && (
                    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/60 p-5 space-y-4 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                          Nueva Sucursal del Aliado
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAddBranchForm(false)}
                          className="text-amber-800 hover:text-amber-950"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-amber-950 mb-1">
                            Nombre Sucursal
                          </label>
                          <input
                            type="text"
                            value={branchDraftName}
                            onChange={(e) => setBranchDraftName(e.target.value)}
                            placeholder="Ej: Sucursal Yerba Buena"
                            className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-amber-950 mb-1">
                            Domicilio Sucursal *
                          </label>
                          <input
                            type="text"
                            value={branchDraftAddress}
                            onChange={(e) => setBranchDraftAddress(e.target.value)}
                            placeholder="Av. Aconquija 1645"
                            className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-amber-950 mb-1">
                            Responsable *
                          </label>
                          <input
                            type="text"
                            value={branchDraftManager}
                            onChange={(e) => setBranchDraftManager(e.target.value)}
                            placeholder="Nombre del Encargado"
                            className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-amber-950 mb-1">
                            Correo
                          </label>
                          <input
                            type="email"
                            value={branchDraftEmail}
                            onChange={(e) => setBranchDraftEmail(e.target.value)}
                            placeholder="sucursal@aliado.com"
                            className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-amber-950 mb-1">
                            Teléfono
                          </label>
                          <input
                            type="text"
                            value={branchDraftPhone}
                            onChange={(e) => setBranchDraftPhone(e.target.value)}
                            placeholder="+54 9 381 ..."
                            className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleAddBranchToForm}
                          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>Confirmar Sucursal</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Lista de sucursales cargadas */}
                  {formBranches.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {formBranches.map((br) => (
                        <div
                          key={br.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <p className="font-black text-slate-900">{br.name}</p>
                            <p className="text-slate-600 font-medium">{br.address}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Resp: <strong>{br.managerName}</strong> · {br.managerPhone} · {br.managerEmail}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveBranchFromForm(br.id)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. SELECTOR DE SERVICIOS QUE SE HABILITAN (TRAVELCAB - EXPERIENCE - REWARDS) */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                    5. Selector de Servicios que se Habilitan en el Portal B2B
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* TravelCab */}
                    <div
                      className={`rounded-2xl border-2 p-5 transition-all ${
                        formEnabledServices.travelCab
                          ? 'border-blue-500 bg-blue-50/40'
                          : 'border-slate-200 bg-slate-50/50 opacity-70'
                      }`}
                    >
                      <label className="flex items-center justify-between cursor-pointer mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-blue-600 text-white">
                            <Car className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="block text-sm font-black text-slate-900">TravelCab</span>
                            <span className="text-[11px] text-slate-500">Cálculo de tarifa y despacho</span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={formEnabledServices.travelCab}
                          onChange={(e) =>
                            setFormEnabledServices((prev) => ({ ...prev, travelCab: e.target.checked }))
                          }
                          className="h-5 w-5 rounded border-blue-400 text-blue-600"
                        />
                      </label>
                      {formEnabledServices.travelCab && (
                        <div className="pt-2 border-t border-blue-200/60">
                          <label className="block text-[11px] font-bold text-blue-950 mb-1">
                            % Comisión Aliado por Viaje Despachado
                          </label>
                          <input
                            type="number"
                            value={formCabCommPct}
                            onChange={(e) => setFormCabCommPct(Number(e.target.value))}
                            className="w-full rounded-xl border border-blue-300 bg-white px-3 py-1.5 text-xs font-black text-slate-900"
                          />
                        </div>
                      )}
                    </div>

                    {/* Experience */}
                    <div
                      className={`rounded-2xl border-2 p-5 transition-all ${
                        formEnabledServices.experience
                          ? 'border-amber-500 bg-amber-50/40'
                          : 'border-slate-200 bg-slate-50/50 opacity-70'
                      }`}
                    >
                      <label className="flex items-center justify-between cursor-pointer mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-amber-500 text-slate-950">
                            <Compass className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="block text-sm font-black text-slate-900">Experience</span>
                            <span className="text-[11px] text-slate-500">Catálogo de excursiones B2B</span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={formEnabledServices.experience}
                          onChange={(e) =>
                            setFormEnabledServices((prev) => ({ ...prev, experience: e.target.checked }))
                          }
                          className="h-5 w-5 rounded border-amber-400 text-amber-600"
                        />
                      </label>
                      {formEnabledServices.experience && (
                        <div className="pt-2 border-t border-amber-200/60">
                          <label className="block text-[11px] font-bold text-amber-950 mb-1">
                            % Comisión Base en Excursiones
                          </label>
                          <input
                            type="number"
                            value={formExpCommPct}
                            onChange={(e) => setFormExpCommPct(Number(e.target.value))}
                            className="w-full rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-black text-slate-900"
                          />
                        </div>
                      )}
                    </div>

                    {/* Rewards */}
                    <div
                      className={`rounded-2xl border-2 p-5 transition-all ${
                        formEnabledServices.rewards
                          ? 'border-purple-500 bg-purple-50/40'
                          : 'border-slate-200 bg-slate-50/50 opacity-70'
                      }`}
                    >
                      <label className="flex items-center justify-between cursor-pointer mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-purple-600 text-white">
                            <QrCode className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="block text-sm font-black text-slate-900">Rewards</span>
                            <span className="text-[11px] text-slate-500">Verificador QR y Cupón Dto.</span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={formEnabledServices.rewards}
                          onChange={(e) =>
                            setFormEnabledServices((prev) => ({ ...prev, rewards: e.target.checked }))
                          }
                          className="h-5 w-5 rounded border-purple-400 text-purple-600"
                        />
                      </label>
                      {formEnabledServices.rewards && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-200/60">
                          <div>
                            <label className="block text-[10px] font-bold text-purple-950 mb-1">
                              % Dto. Socio
                            </label>
                            <input
                              type="number"
                              value={formRewardsDiscPct}
                              onChange={(e) => setFormRewardsDiscPct(Number(e.target.value))}
                              className="w-full rounded-xl border border-purple-300 bg-white px-2.5 py-1.5 text-xs font-black text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-purple-950 mb-1">
                              % Reintegro B2B
                            </label>
                            <input
                              type="number"
                              value={formRewardsReimbPct}
                              onChange={(e) => setFormRewardsReimbPct(Number(e.target.value))}
                              className="w-full rounded-xl border border-purple-300 bg-white px-2.5 py-1.5 text-xs font-black text-slate-900"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 6. APARTADO PARA GUARDAR EL CONVENIO FIRMADO CON CADA ALIADO */}
                <div className="rounded-3xl border-2 border-slate-200 bg-slate-50/70 p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-2xl bg-slate-900 text-amber-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">
                          6. Resguardo Digital del Convenio Firmado con el Aliado
                        </h3>
                        <p className="text-xs text-slate-500">
                          Adjuntá el contrato o convenio comercial firmado (PDF o escaneo) y sus cláusulas de liquidación.
                        </p>
                      </div>
                    </div>

                    <label className="inline-flex items-center gap-2 text-xs font-black text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formHasAgreement}
                        onChange={(e) => setFormHasAgreement(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-400 text-slate-900"
                      />
                      <span>Posee Convenio Firmado</span>
                    </label>
                  </div>

                  {formHasAgreement && (
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            N° de Convenio / Legajo
                          </label>
                          <input
                            type="text"
                            value={formAgreementNumber}
                            onChange={(e) => setFormAgreementNumber(e.target.value)}
                            placeholder="CONV-B2B-2026-005"
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Fecha de Firma
                          </label>
                          <input
                            type="date"
                            value={formAgreementDate}
                            onChange={(e) => setFormAgreementDate(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Vigencia Hasta
                          </label>
                          <input
                            type="date"
                            value={formAgreementValidUntil}
                            onChange={(e) => setFormAgreementValidUntil(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Estado Legal
                          </label>
                          <select
                            value={formAgreementStatus}
                            onChange={(e) => setFormAgreementStatus(e.target.value as any)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                          >
                            <option value="Vigente">Vigente</option>
                            <option value="En Renovación">En Renovación</option>
                            <option value="Pendiente de Firma">Pendiente de Firma</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 flex flex-col justify-center">
                          <label className="block text-xs font-black text-slate-700 mb-1">
                            Subir Archivo del Convenio Firmado (PDF / Imagen Escaneada)
                          </label>
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            onChange={handleAgreementFileUpload}
                            className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-slate-900 file:text-white hover:file:bg-slate-800"
                          />
                          {formAgreementFileName && (
                            <p className="text-[11px] font-bold text-emerald-700 mt-2 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Archivo vinculado: {formAgreementFileName}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Cláusulas Especiales / Condiciones de Pago Acordadas
                          </label>
                          <textarea
                            rows={3}
                            value={formAgreementNotes}
                            onChange={(e) => setFormAgreementNotes(e.target.value)}
                            placeholder="Ej: Se acuerda pago semanal en efectivo por mostrador contra entrega de recibo firmado o acreditación de puntos..."
                            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-800 resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botón de Guardado Final */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAdminSubTab('directory')}
                    className="px-5 py-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingPartner}
                    className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-lg flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>{savingPartner ? 'Guardando Aliado...' : 'Guardar Aliado B2B y Habilitar Portal'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ----------------------------------------------------------------
              SUB-PESTAÑA 1.3: GESTIÓN DE PAGO EN EFECTIVO, TRANSFERENCIA O PUNTOS A ALIADOS
              ---------------------------------------------------------------- */}
          {adminSubTab === 'settlements_cash' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                      Tesorería B2B · Comisiones & Descuentos Rewards
                    </span>
                    <h2 className="text-xl font-black text-slate-900">
                      Gestión de Pago en Efectivo, Puntos o Transferencia a Aliados
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Controlá el saldo acumulado por cada aliado (viajes TravelCab + excursiones Experience + descuentos otorgados en Rewards) y registrá el pago en efectivo con recibo o en puntos.
                    </p>
                  </div>
                </div>

                {/* Tabla de estado de liquidación por aliado */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-400">
                        <th className="py-3 px-3">Aliado B2B</th>
                        <th className="py-3 px-3">TravelCab Pend.</th>
                        <th className="py-3 px-3">Experience Pend.</th>
                        <th className="py-3 px-3">Dto. Rewards a Pagar</th>
                        <th className="py-3 px-3">Total Pendiente ($)</th>
                        <th className="py-3 px-3">Billetera Puntos</th>
                        <th className="py-3 px-3">Total Ya Abonado</th>
                        <th className="py-3 px-3 text-right">Acción de Pago</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {partners.map((partner) => {
                        const fin = getPartnerFinancialSummary(partner.id);
                        return (
                          <tr key={partner.id} className="hover:bg-slate-50/80">
                            <td className="py-3.5 px-3">
                              <p className="font-black text-slate-900">{partner.commercialName}</p>
                              <p className="text-[11px] text-slate-500">
                                {partner.category} · Resp: {partner.managerName}
                              </p>
                            </td>
                            <td className="py-3.5 px-3 font-bold text-blue-700">
                              ${fin.pendingCab.toLocaleString('es-AR')}
                            </td>
                            <td className="py-3.5 px-3 font-bold text-amber-700">
                              ${fin.pendingExp.toLocaleString('es-AR')}
                            </td>
                            <td className="py-3.5 px-3 font-bold text-purple-700">
                              ${fin.pendingRewards.toLocaleString('es-AR')}
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-950 font-black">
                                ${fin.totalPendingArs.toLocaleString('es-AR')}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 font-black text-indigo-700">
                              {(partner.accumulatedPointsBalance || 0).toLocaleString('es-AR')} pts
                            </td>
                            <td className="py-3.5 px-3 font-bold text-emerald-700">
                              ${fin.totalPaidArs.toLocaleString('es-AR')}
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleOpenSettlementModal(partner)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-xs transition-all"
                              >
                                <Banknote className="w-3.5 h-3.5" />
                                <span>Liquidar / Pagar Efectivo o Puntos</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Historial de Recibos y Pagos Realizados */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Historial Auditable de Pagos en Efectivo, Puntos y Transferencias ({b2bSettlements.length})</span>
                </h3>

                {b2bSettlements.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    Todavía no se registraron liquidaciones cerradas. Usá el botón &ldquo;Liquidar / Pagar Efectivo o Puntos&rdquo; para emitir el primer recibo.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {b2bSettlements.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60 text-xs"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 font-black text-[10px]">
                              {item.paymentMethod.toUpperCase()}
                            </span>
                            <span className="font-black text-slate-900">{item.partnerName}</span>
                            <span className="text-slate-400">· Recibo N° {item.receiptNumber}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1">
                            Entregó: <strong>{item.deliveredByName}</strong> · Recibió en mano:{' '}
                            <strong>{item.receivedByName}</strong> {item.receivedByDni ? `(DNI ${item.receivedByDni})` : ''}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Incluye Cab: ${item.cabCommissionIncluded.toLocaleString('es-AR')} | Experience: $
                            {item.experienceCommissionIncluded.toLocaleString('es-AR')} | Rewards: $
                            {item.rewardsReimbursementIncluded.toLocaleString('es-AR')}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-black text-emerald-700">
                              ${item.amountArs.toLocaleString('es-AR')}
                            </p>
                            {item.pointsCredited > 0 && (
                              <p className="text-[11px] font-black text-purple-700">
                                +{item.pointsCredited.toLocaleString('es-AR')} Puntos
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setPrintableSettlementReceipt(item)}
                            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
                            title="Ver / Imprimir Recibo"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          MODO 2: PORTAL B2B DEL ALIADO (CON SU PROPIO SIDEBAR DINÁMICO)
          ==================================================================== */}
      {workspaceMode === 'partner_portal' && activePartner && (
        <div className="space-y-5">
          {/* Selector superior de Aliado y Sucursal activa */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500 text-slate-950">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-900 text-amber-400">
                    Portal B2B Activo · {activePartner.category}
                  </span>
                  <span className="text-xs font-bold text-slate-400">CUIT {activePartner.cuit}</span>
                </div>
                <h2 className="text-lg font-black text-slate-900 mt-0.5">
                  {activePartner.commercialName}
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Cambiar Aliado B2B
                </label>
                <select
                  value={selectedPartnerId}
                  onChange={(e) => {
                    setSelectedPartnerId(e.target.value);
                    const found = partners.find((p) => p.id === e.target.value);
                    setSelectedBranchId(found?.branches?.[0]?.id || '');
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-900 outline-none focus:border-amber-500"
                >
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.category}: {p.commercialName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Sucursal / Mostrador Activo
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-900 outline-none focus:border-amber-500"
                >
                  {(activePartner.branches || []).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.address})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ESTRUCTURA DEL PORTAL B2B: SIDEBAR LATERAL DINÁMICO + CONTENIDO */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* SIDEBAR DEL PORTAL B2B (SOLO MUESTRA LOS BOTONES HABILITADOS PARA ESTE ALIADO) */}
            <aside className="lg:col-span-3 bg-slate-900 text-white rounded-3xl p-5 shadow-xl space-y-6">
              <div className="border-b border-white/10 pb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  Menú Operativo B2B
                </p>
                <p className="text-sm font-black mt-0.5">{activePartner.commercialName}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Resp: {activeBranch?.managerName || activePartner.managerName}
                </p>
              </div>

              {/* Botones dinámicos según servicios habilitados: TravelCab - Experience - Rewards */}
              <nav className="space-y-2">
                {activePartner.enabledServices.travelCab && (
                  <button
                    type="button"
                    onClick={() => setPortalSidebarTab('travelcab')}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-black transition-all ${
                      portalSidebarTab === 'travelcab'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Car className="w-4 h-4" />
                      <span>TravelCab</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-black/20 text-[10px]">
                      {activePartner.cabCommissionPct}% Com.
                    </span>
                  </button>
                )}

                {activePartner.enabledServices.experience && (
                  <button
                    type="button"
                    onClick={() => setPortalSidebarTab('experience')}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-black transition-all ${
                      portalSidebarTab === 'experience'
                        ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Compass className="w-4 h-4" />
                      <span>Experience</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-black/15 text-[10px]">
                      {activePartner.experienceCommissionPct}% Com.
                    </span>
                  </button>
                )}

                {activePartner.enabledServices.rewards && (
                  <button
                    type="button"
                    onClick={() => setPortalSidebarTab('rewards')}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-black transition-all ${
                      portalSidebarTab === 'rewards'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <QrCode className="w-4 h-4" />
                      <span>Rewards</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-black/20 text-[10px]">
                      QR / Cupón
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setPortalSidebarTab('settlements')}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-black transition-all ${
                    portalSidebarTab === 'settlements'
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Wallet className="w-4 h-4" />
                    <span>Comisiones & Convenio</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-black/15 text-[10px]">
                    ${activePartnerSummary.totalPendingArs.toLocaleString('es-AR')}
                  </span>
                </button>
              </nav>

              {/* Resumen financiero en el Sidebar del Aliado */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Pendiente a Cobrar:</span>
                  <span className="font-black text-amber-400 text-sm">
                    ${activePartnerSummary.totalPendingArs.toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Ya Cobrado:</span>
                  <span className="font-bold text-emerald-400">
                    ${activePartnerSummary.totalPaidArs.toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-white/10">
                  <span>Puntos Acumulados:</span>
                  <span className="font-black text-purple-300">
                    {(activePartner.accumulatedPointsBalance || 0).toLocaleString('es-AR')} pts
                  </span>
                </div>
              </div>
            </aside>

            {/* ÁREA PRINCIPAL DEL PORTAL B2B SEGÚN BOTÓN ACTIVO DEL SIDEBAR */}
            <div className="lg:col-span-9 space-y-6">
              {/* ==============================================================
                  BOTÓN 1 DEL SIDEBAR B2B: TRAVELCAB (CENTRAL DE DESPACHO - PESTAÑA DESPACHADOR)
                  ============================================================== */}
              {portalSidebarTab === 'travelcab' && activePartner.enabledServices.travelCab && (
                <div className="space-y-5">
                  {/* Contenedor idéntico al módulo Central de Despacho (Solo Pestaña Despachador) */}
                  <div className="bg-[#0f1117] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden text-white">
                    {/* Barra Superior de Central de Despacho (Solo pestaña Despachador) */}
                    <div className="px-6 py-4 bg-[#181b23] border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="px-4 py-2 rounded-xl bg-amber-500 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20">
                          <Send className="w-3.5 h-3.5" />
                          <span>Despachador</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-wider text-white">
                              Central de Despacho TravelCab · {activePartner.commercialName}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black">
                              Comisión Aliado: {activePartner.cabCommissionPct}%
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Origen pre-cargado por defecto en:{' '}
                            <strong className="text-amber-300">
                              {activeBranch
                                ? `${activeBranch.address} (${activeBranch.name})`
                                : activePartner.address}
                            </strong>
                          </p>
                        </div>
                      </div>

                      {cabSuccessToast && (
                        <div className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{cabSuccessToast}</span>
                        </div>
                      )}
                    </div>

                    {/* Split Screen: Mapa Interactivo a la izquierda + Despachador Maestro a la derecha */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 min-h-[680px]">
                      {/* Mapa Google Interactive Map */}
                      <div className="xl:col-span-6 relative min-h-[360px] xl:min-h-[680px] border-b xl:border-b-0 xl:border-r border-white/10">
                        <GoogleInteractiveMap
                          activeTrip={null}
                          trips={[]}
                          onUpdateTripStatus={async () => {}}
                          previewCoords={b2bPreviewCoords}
                        />
                        <div className="absolute bottom-4 left-4 right-4 pointer-events-none flex items-center justify-between gap-2">
                          <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-xl px-3.5 py-2 text-[11px] text-slate-300 font-bold">
                            📍 Pick-up Aliado:{' '}
                            <span className="text-white">
                              {activeBranch ? activeBranch.address : activePartner.address}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Despachador Maestro Unificado con Origen del Aliado por Defecto */}
                      <div className="xl:col-span-6 h-[680px] overflow-hidden">
                        <UnifiedDispatcher
                          key={`${activePartner.id}-${activeBranch?.id || 'main'}`}
                          onCoordsChange={setB2bPreviewCoords}
                          defaultOriginAddress={
                            activeBranch?.address
                              ? `${activeBranch.address}, Tucumán, Argentina`
                              : `${activePartner.address}, Tucumán, Argentina`
                          }
                          b2bPartner={{
                            id: activePartner.id,
                            commercialName: activePartner.commercialName,
                            category: activePartner.category,
                            branchId: activeBranch?.id || 'main',
                            branchName: activeBranch?.name || 'Casa Central',
                            address: activeBranch?.address || activePartner.address,
                            cabCommissionPct: activePartner.cabCommissionPct,
                          }}
                          onTripDispatched={(tripData) => {
                            const code = tripData?.tripCode || 'CAB-B2B';
                            const fare = Number(tripData?.estimatedFare || tripData?.fare || 0);
                            const comm = Number(tripData?.hotelCommission || tripData?.commission || 0);
                            setCabSuccessToast(
                              `Viaje ${code} despachado ($${fare.toLocaleString('es-AR')}) · Comisión +$${comm.toLocaleString('es-AR')}`
                            );
                            setTimeout(() => setCabSuccessToast(null), 6000);
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Resumen compacto de últimos viajes despachados por este Aliado B2B */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                          Últimos Despachos Solicitados por {activePartner.commercialName} (
                          {activePartnerSummary.partnerTrips.length})
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Cada despacho impacta en tiempo real en la Central de TravelCab y suma comisión a favor del aliado.
                        </p>
                      </div>
                    </div>

                    {activePartnerSummary.partnerTrips.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-400">
                        Aún no hay viajes despachados desde este aliado. Ingresá el destino en el Despachador Maestro arriba y presioná &ldquo;Confirmar y Despachar Viaje&rdquo;.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {activePartnerSummary.partnerTrips.slice(0, 6).map((trip) => (
                          <div
                            key={trip.id}
                            className="rounded-2xl border border-slate-200 p-3.5 bg-slate-50/70 space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-black text-slate-900">
                                {trip.tripCode || 'CAB-B2B'} · {trip.passengerName}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                  trip.commissionStatus === 'paid'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {trip.commissionStatus === 'paid'
                                  ? 'Comisión Cobrada'
                                  : 'En Curso / Pend.'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 truncate">
                              Origen: <strong>{trip.origin}</strong>
                            </p>
                            <p className="text-[11px] text-slate-600 truncate">
                              Destino: <strong>{trip.destination}</strong> ({trip.vehicleCategory})
                            </p>
                            <div className="flex items-center justify-between pt-1 border-t border-slate-200/70 text-[11px]">
                              <span className="text-slate-500">
                                Tarifa:{' '}
                                <strong>
                                  ${Number(trip.estimatedFare || 0).toLocaleString('es-AR')}
                                </strong>
                              </span>
                              <span className="font-black text-emerald-700">
                                Comisión: +$
                                {Number(trip.hotelCommission || 0).toLocaleString('es-AR')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ==============================================================
                  BOTÓN 2 DEL SIDEBAR B2B: EXPERIENCE (CATÁLOGO DE EXCURSIONES HABILITADAS)
                  ============================================================== */}
              {portalSidebarTab === 'experience' && activePartner.enabledServices.experience && (
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="bg-amber-950 text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                          TravelApp Experience B2B · Operado por Luna Viajera
                        </span>
                        <h3 className="text-xl font-black mt-0.5">
                          Excursiones del Catálogo Habilitadas para Venta B2B ({b2bEnabledTours.length})
                        </h3>
                        <p className="text-xs text-amber-100/80 mt-0.5">
                          Seleccioná cualquier excursión habilitada en el catálogo general, reservá con pick-up directo por {activePartner.commercialName} y ganá tu comisión B2B.
                        </p>
                      </div>
                      <Link
                        href="/experiences/catalog"
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-black text-amber-300 flex items-center gap-1.5 self-start sm:self-auto"
                      >
                        <span>Habilitar más excursiones en Catálogo</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Listado de Excursiones Habilitadas */}
                      <div className="lg:col-span-7 space-y-4">
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                          <input
                            type="text"
                            value={expSearch}
                            onChange={(e) => setExpSearch(e.target.value)}
                            placeholder="Buscar excursión por destino o nombre..."
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[540px] overflow-y-auto pr-1">
                          {b2bEnabledTours.map((tour) => {
                            const isSelected = selectedTourObj?.id === tour.id;
                            const commPct = tour.hotelCommissionPct || activePartner.experienceCommissionPct || 15;
                            const commPerPax = Math.round((tour.price || 0) * (commPct / 100));
                            return (
                              <div
                                key={tour.id}
                                onClick={() => setSelectedTourId(tour.id)}
                                className={`cursor-pointer rounded-2xl border-2 overflow-hidden transition-all flex flex-col justify-between ${
                                  isSelected
                                    ? 'border-amber-500 bg-amber-50/40 shadow-md'
                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                }`}
                              >
                                <div>
                                  <div className="h-32 w-full bg-slate-200 relative overflow-hidden">
                                    <img
                                      src={tour.imageUrl}
                                      alt={tour.title}
                                      className="w-full h-full object-cover"
                                    />
                                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black shadow-xs">
                                      Comisión {commPct}% (+${commPerPax.toLocaleString('es-AR')}/pax)
                                    </span>
                                  </div>
                                  <div className="p-3.5">
                                    <p className="text-[10px] font-black uppercase text-amber-700">
                                      {tour.location}
                                    </p>
                                    <h4 className="text-xs font-black text-slate-900 line-clamp-2 mt-0.5">
                                      {tour.title}
                                    </h4>
                                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                                      {tour.description}
                                    </p>
                                  </div>
                                </div>

                                <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                                  <span className="font-black text-slate-900">
                                    ${(tour.price || 0).toLocaleString('es-AR')} <span className="text-[10px] font-normal text-slate-500">/ pax</span>
                                  </span>
                                  <span className="text-[11px] font-black text-amber-700">
                                    {isSelected ? '✓ Seleccionada' : 'Seleccionar'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Formulario de Emisión de Reserva B2B */}
                      <form
                        onSubmit={handleBookExperienceB2B}
                        className="lg:col-span-5 rounded-3xl border border-amber-200 bg-amber-50/40 p-5 space-y-4"
                      >
                        <div>
                          <span className="text-[10px] font-black uppercase text-amber-700">
                            Emitir Voucher de Excursión B2B
                          </span>
                          <h4 className="text-sm font-black text-slate-900 mt-0.5">
                            {selectedTourObj?.title}
                          </h4>
                        </div>

                        {tourSuccessToast && (
                          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
                            {tourSuccessToast}
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Nombre y Apellido del Pasajero / Huésped *
                          </label>
                          <input
                            type="text"
                            required
                            value={expGuestName}
                            onChange={(e) => setExpGuestName(e.target.value)}
                            placeholder="Ej: Laura Martínez"
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              WhatsApp Pasajero *
                            </label>
                            <input
                              type="text"
                              required
                              value={expGuestPhone}
                              onChange={(e) => setExpGuestPhone(e.target.value)}
                              placeholder="+54 9 381 ..."
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              DNI / Pasaporte
                            </label>
                            <input
                              type="text"
                              value={expGuestDni}
                              onChange={(e) => setExpGuestDni(e.target.value)}
                              placeholder="32.456.789"
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Fecha de Excursión
                            </label>
                            <input
                              type="date"
                              value={expDate}
                              onChange={(e) => setExpDate(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Cantidad de Pasajeros
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={25}
                              value={expPaxCount}
                              onChange={(e) => setExpPaxCount(Number(e.target.value))}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-900"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Modalidad de Cobro en Mostrador
                          </label>
                          <select
                            value={expPaymentMethod}
                            onChange={(e) => setExpPaymentMethod(e.target.value as any)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                          >
                            <option value="Cobrado en Mostrador (Descuenta Comisión)">
                              Cobrado en Mostrador (Retiene Comisión)
                            </option>
                            <option value="Link de Pago / Seña">Link de Pago / Transferencia</option>
                            <option value="Pago al Guía en Pick-up">Pago al Guía en el Pick-up</option>
                          </select>
                        </div>

                        {/* Desglose de tarifa y comisión del aliado */}
                        <div className="rounded-2xl bg-slate-900 text-white p-4 space-y-1.5 text-xs">
                          <div className="flex justify-between text-slate-400">
                            <span>Total Público ({expPaxCount} pax):</span>
                            <span className="font-bold text-white">
                              ${tourBookingTotal.toLocaleString('es-AR')}
                            </span>
                          </div>
                          <div className="flex justify-between text-emerald-400 font-black text-sm pt-1 border-t border-white/10">
                            <span>Comisión Aliado ({effectiveTourCommissionPct}%):</span>
                            <span>+${tourBookingCommission.toLocaleString('es-AR')}</span>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={bookingTourSubmitting}
                          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md transition-all"
                        >
                          {bookingTourSubmitting
                            ? 'Confirmando Reserva...'
                            : 'Confirmar Excursión y Generar Comisión'}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* ==============================================================
                  BOTÓN 3 DEL SIDEBAR B2B: REWARDS (VERIFICADOR DE CÓDIGOS QR Y CUPÓN DE DESCUENTO)
                  ============================================================== */}
              {portalSidebarTab === 'rewards' && activePartner.enabledServices.rewards && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="bg-purple-950 text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-purple-300">
                        Enlazado en Tiempo Real con Módulo TravelApp Rewards
                      </span>
                      <h3 className="text-xl font-black mt-0.5">
                        Verificador de Códigos QR y Cupón de Descuento
                      </h3>
                      <p className="text-xs text-purple-200 mt-0.5">
                        Validá el código QR o cupón del socio, aplicá el {activePartner.rewardsDiscountPct}% de descuento en su consumo y dejá registrado el descuento otorgado para su pago/reintegro ({activePartner.rewardsReimbursementPct}% reconocido por TravelApp en Efectivo o Puntos).
                      </p>
                    </div>
                    <Link
                      href="/rewards/analytics"
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-black text-purple-200 flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <span>Ver en Módulo Central Rewards</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Columna Izquierda: Verificador QR / Cupón y Liquidación del Descuento */}
                    <form onSubmit={handleConfirmRewardsRedemption} className="lg:col-span-7 space-y-5">
                      {rewardsSuccessToast && (
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{rewardsSuccessToast}</span>
                        </div>
                      )}

                      {/* Paso 1: Lector / Ingreso de Código QR o Cupón */}
                      <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 space-y-3">
                        <label className="block text-xs font-black text-purple-950">
                          1. Escanear Código QR del Socio o Ingresar Código de Cupón
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <QrCode className="w-4 h-4 text-purple-600 absolute left-3.5 top-2.5" />
                            <input
                              type="text"
                              value={qrInputCode}
                              onChange={(e) => setQrInputCode(e.target.value)}
                              placeholder="Ej: QR-REW-2026 o DESC-NOA-20"
                              className="w-full pl-9 pr-4 py-2 rounded-xl border border-purple-300 bg-white text-xs font-black text-slate-900 uppercase"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleVerifyQrOrCoupon}
                            className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-black shrink-0"
                          >
                            Verificar Código
                          </button>
                        </div>

                        {/* Botones rápidos de prueba */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-bold text-purple-700">Códigos de prueba:</span>
                          {Object.keys(SAMPLE_REWARDS_CODES).map((codeKey) => (
                            <button
                              key={codeKey}
                              type="button"
                              onClick={() => {
                                setQrInputCode(codeKey);
                                const preset = SAMPLE_REWARDS_CODES[codeKey];
                                setVerifiedVoucher({
                                  code: preset.code,
                                  memberName: preset.memberName,
                                  memberDni: preset.memberDni,
                                  memberTier: preset.memberTier,
                                  campaignTitle: preset.campaignTitle,
                                  discountPct: activePartner.rewardsDiscountPct || preset.bonusDiscountPct,
                                });
                              }}
                              className="px-2 py-0.5 rounded-md bg-white border border-purple-200 text-[10px] font-black text-purple-900 hover:bg-purple-100"
                            >
                              {codeKey}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Tarjeta de Socio / Cupón Verificado */}
                      {verifiedVoucher && (
                        <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/60 p-4 flex items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black uppercase">
                                QR / CUPÓN VÁLIDO · NIVEL {verifiedVoucher.memberTier}
                              </span>
                              <span className="text-xs font-black text-emerald-950">
                                {verifiedVoucher.code}
                              </span>
                            </div>
                            <p className="text-sm font-black text-slate-900 mt-1">
                              Socio: {verifiedVoucher.memberName} (DNI {verifiedVoucher.memberDni})
                            </p>
                            <p className="text-[11px] text-emerald-800 font-medium">
                              {verifiedVoucher.campaignTitle}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="block text-[10px] font-black uppercase text-emerald-700">
                              Descuento Habilitado
                            </span>
                            <span className="text-2xl font-black text-emerald-700">
                              {effectiveRewardsDiscountPct}% OFF
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Paso 2: Cargar monto del consumo / ticket para calcular el descuento otorgado */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            2. Monto Total del Ticket / Consumo ($) *
                          </label>
                          <input
                            type="number"
                            required
                            min={100}
                            value={ticketAmountInput}
                            onChange={(e) => setTicketAmountInput(Number(e.target.value))}
                            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-black text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            N° de Ticket / Factura / Mesa
                          </label>
                          <input
                            type="text"
                            value={invoiceNumberInput}
                            onChange={(e) => setInvoiceNumberInput(e.target.value)}
                            placeholder="FC-B-0004-00019283"
                            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-900"
                          />
                        </div>
                      </div>

                      {/* Desglose Contable del Descuento Otorgado para Pagarlo al Aliado */}
                      <div className="rounded-2xl bg-slate-900 text-white p-5 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Subtotal Consumo del Socio:</span>
                          <span className="font-bold text-white">
                            ${Number(ticketAmountInput || 0).toLocaleString('es-AR')}
                          </span>
                        </div>
                        <div className="flex justify-between text-amber-400 font-bold">
                          <span>Descuento Otorgado al Socio ({effectiveRewardsDiscountPct}%):</span>
                          <span>-${rewardsDiscountAmountGranted.toLocaleString('es-AR')}</span>
                        </div>
                        <div className="flex justify-between text-white font-black text-sm pt-1 border-t border-white/10">
                          <span>Neto a Cobrar al Socio en Caja:</span>
                          <span>${rewardsNetToChargeCustomer.toLocaleString('es-AR')}</span>
                        </div>
                        <div className="flex justify-between text-emerald-400 font-black text-sm pt-2 border-t border-white/10">
                          <span>
                            Reintegro a Pagar por TravelApp ({activePartner.rewardsReimbursementPct}% del Dto.):
                          </span>
                          <span>
                            +${rewardsReimbursementDueToPartner.toLocaleString('es-AR')} (o{' '}
                            {rewardsPointsEquivalent.toLocaleString('es-AR')} pts)
                          </span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={validatingCoupon}
                        className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-lg flex items-center justify-center gap-2"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>
                          {validatingCoupon
                            ? 'Registrando en Rewards...'
                            : 'Validar Código QR/Cupón y Registrar Descuento para Cobro'}
                        </span>
                      </button>
                    </form>

                    {/* Columna Derecha: Control de Descuentos Otorgados por este Aliado */}
                    <div className="lg:col-span-5 space-y-3 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                          Control de Descuentos Otorgados ({activePartnerSummary.partnerRedemptions.length})
                        </h4>
                        <span className="text-xs font-black text-purple-700">
                          Pend. Reintegro: ${activePartnerSummary.pendingRewards.toLocaleString('es-AR')}
                        </span>
                      </div>

                      <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                        {activePartnerSummary.partnerRedemptions.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                            No hay cupones ni códigos QR validados todavía en esta sucursal.
                          </div>
                        ) : (
                          activePartnerSummary.partnerRedemptions.map((red) => (
                            <div
                              key={red.id}
                              className="rounded-2xl border border-slate-200 p-3.5 bg-slate-50/70 space-y-1 text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-black text-purple-900">
                                  {red.voucherCode} · {red.memberName}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                    red.settlementStatus === 'paid'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-900'
                                  }`}
                                >
                                  {red.settlementStatus === 'paid'
                                    ? `Pagado (${red.settlementPaymentMethod || 'Efectivo'})`
                                    : 'Pendiente de Pago'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600">
                                Ticket: ${Number(red.ticketTotalAmount || 0).toLocaleString('es-AR')} · Dto. otorgado ({red.discountPctApplied}%):{' '}
                                <strong>-${Number(red.discountAmountGranted || 0).toLocaleString('es-AR')}</strong>
                              </p>
                              <div className="flex items-center justify-between pt-1 border-t border-slate-200/70 text-[11px]">
                                <span className="text-slate-500">Comp: {red.invoiceOrTicketNumber}</span>
                                <span className="font-black text-emerald-700">
                                  A cobrar: +${Number(red.reimbursementAmountDue || 0).toLocaleString('es-AR')}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==============================================================
                  BOTÓN 4 DEL SIDEBAR B2B: COMISIONES, PAGOS EN EFECTIVO/PUNTOS Y CONVENIO FIRMADO
                  ============================================================== */}
              {portalSidebarTab === 'settlements' && (
                <div className="space-y-6">
                  {/* Tarjetas resumen del aliado */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-3xl border border-slate-200 p-5">
                      <span className="text-[10px] font-black uppercase text-amber-700">
                        Total Pendiente a Cobrar
                      </span>
                      <p className="text-2xl font-black text-slate-900 mt-1">
                        ${activePartnerSummary.totalPendingArs.toLocaleString('es-AR')}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Cab: ${activePartnerSummary.pendingCab.toLocaleString('es-AR')} · Exp: $
                        {activePartnerSummary.pendingExp.toLocaleString('es-AR')} · Rewards: $
                        {activePartnerSummary.pendingRewards.toLocaleString('es-AR')}
                      </p>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 p-5">
                      <span className="text-[10px] font-black uppercase text-emerald-700">
                        Total Ya Liquidado / Cobrado
                      </span>
                      <p className="text-2xl font-black text-emerald-700 mt-1">
                        ${activePartnerSummary.totalPaidArs.toLocaleString('es-AR')}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Modalidad preferida: <strong>{activePartner.preferredPaymentMethod}</strong>
                      </p>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 p-5 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase text-purple-700">
                          Billetera Corporativa Puntos Rewards
                        </span>
                        <p className="text-2xl font-black text-purple-800 mt-1">
                          {(activePartner.accumulatedPointsBalance || 0).toLocaleString('es-AR')} pts
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2">
                        Liquidación administrada por Central Concorde 360 (Etapa 3: Otorgamiento directo de puntos al público).
                      </p>
                    </div>
                  </div>

                  {/* Historial de Liquidaciones Recibidas (Solo Lectura para el Aliado) */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                          Comprobantes de Liquidaciones Acreditadas ({activePartnerSummary.partnerSettlements.length})
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Estado de cuenta de solo lectura. Los pagos y liquidaciones son emitidos por Administración Central.
                        </p>
                      </div>
                    </div>

                    {activePartnerSummary.partnerSettlements.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-400">
                        Aún no hay recibos de liquidación emitidos por Administración para este aliado.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {activePartnerSummary.partnerSettlements.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-2xl border border-slate-200 p-3.5 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <span className="font-black text-slate-900">
                                Recibo {item.receiptNumber} · {item.paymentMethod}
                              </span>
                              <p className="text-[11px] text-slate-500">
                                Fecha: {new Date(item.createdAt).toLocaleDateString('es-AR')} · Recibido por:{' '}
                                <strong>{item.receivedByName}</strong>
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-black text-emerald-700">
                                ${item.amountArs.toLocaleString('es-AR')}
                              </span>
                              <button
                                type="button"
                                onClick={() => setPrintableSettlementReceipt(item)}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 font-bold text-slate-700 flex items-center gap-1.5"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Ver Recibo</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Convenio Firmado del Aliado */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400">
                        Resguardo Legal · Convenio Firmado con {activePartner.commercialName}
                      </span>
                      <h4 className="text-base font-black text-slate-900">
                        Legajo {activePartner.agreement?.agreementNumber} ({activePartner.agreement?.status})
                      </h4>
                      <p className="text-xs text-slate-600">
                        Firmado: {activePartner.agreement?.signedDate} · Vigente hasta:{' '}
                        {activePartner.agreement?.validUntil} · Archivo:{' '}
                        <strong>{activePartner.agreement?.fileName || 'Sin archivo'}</strong>
                      </p>
                      {activePartner.agreement?.notes && (
                        <p className="text-xs text-amber-900 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 mt-2">
                          Cláusula: {activePartner.agreement.notes}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewingAgreementPartner(activePartner)}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-2 shrink-0"
                    >
                      <FileText className="w-4 h-4 text-amber-400" />
                      <span>Ver / Descargar Convenio Firmado</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 1: GESTIÓN DE PAGO EN EFECTIVO / PUNTOS / TRANSFERENCIA A ALIADO
          ==================================================================== */}
      {settlementModalPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-100">
            <div className="bg-emerald-950 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                  Liquidación Oficial a Aliado B2B
                </span>
                <h3 className="text-lg font-black mt-0.5">
                  Pagar Comisiones / Puntos a {settlementModalPartner.commercialName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSettlementModalPartner(null)}
                className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const fin = getPartnerFinancialSummary(settlementModalPartner.id);
              return (
                <form onSubmit={handleConfirmSettlementPayment} className="p-6 space-y-4 text-xs">
                  {/* Desglose de lo que se está liquidando */}
                  <div className="rounded-2xl bg-slate-900 text-white p-4 space-y-1.5">
                    <div className="flex justify-between text-slate-300">
                      <span>Comisiones TravelCab pendientes:</span>
                      <span className="font-bold">${fin.pendingCab.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Comisiones Experience pendientes:</span>
                      <span className="font-bold">${fin.pendingExp.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Reintegro de Descuentos Rewards otorgados:</span>
                      <span className="font-bold">${fin.pendingRewards.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-black text-base pt-2 border-t border-white/10">
                      <span>Total a Abonar al Aliado ({fin.pendingItemsCount} operaciones):</span>
                      <span>${fin.totalPendingArs.toLocaleString('es-AR')}</span>
                    </div>
                  </div>

                  {/* Selector de Modalidad: Efectivo, Puntos o Transferencia */}
                  <div>
                    <label className="block font-black text-slate-700 mb-2">
                      Seleccionar Medio de Pago
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {(
                        [
                          { id: 'Efectivo', label: '💵 Pago en Efectivo', sub: 'Recibo en mano' },
                          { id: 'Puntos Rewards', label: '⭐ Puntos Rewards', sub: `${Math.round(fin.totalPendingArs / 10)} pts` },
                          { id: 'Transferencia', label: '🏦 Transferencia', sub: settlementModalPartner.bankAliasOrCbu || 'CBU' },
                        ] as const
                      ).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSettlementPaymentMethod(m.id)}
                          className={`p-3 rounded-2xl border text-left transition-all ${
                            settlementPaymentMethod === m.id
                              ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <p className="font-black text-slate-900">{m.label}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{m.sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Entregado / Autorizado por (Concorde 360) *
                      </label>
                      <input
                        type="text"
                        required
                        value={settlementDeliveredBy}
                        onChange={(e) => setSettlementDeliveredBy(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        N° de Recibo / Comprobante *
                      </label>
                      <input
                        type="text"
                        required
                        value={settlementReceiptNumber}
                        onChange={(e) => setSettlementReceiptNumber(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 font-black text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Recibido en Mano por (Responsable Aliado) *
                      </label>
                      <input
                        type="text"
                        required
                        value={settlementReceivedBy}
                        onChange={(e) => setSettlementReceivedBy(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        DNI / Firma de quien recibe el efectivo
                      </label>
                      <input
                        type="text"
                        value={settlementReceivedDni}
                        onChange={(e) => setSettlementReceivedDni(e.target.value)}
                        placeholder="Ej: 31.455.902"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Observaciones del Pago
                    </label>
                    <input
                      type="text"
                      value={settlementNotes}
                      onChange={(e) => setSettlementNotes(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 font-medium text-slate-800"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSettlementModalPartner(null)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={processingSettlement || fin.totalPendingArs <= 0}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black shadow-md flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {processingSettlement
                          ? 'Registrando Pago...'
                          : `Confirmar Pago en ${settlementPaymentMethod}`}
                      </span>
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: VISOR Y DESCARGA DEL CONVENIO FIRMADO CON EL ALIADO
          ==================================================================== */}
      {viewingAgreementPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-400">
                  Legajo Digital de Convenio B2B
                </span>
                <h3 className="text-lg font-black mt-0.5">
                  {viewingAgreementPartner.commercialName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingAgreementPartner(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">N° de Convenio:</span>
                  <span className="font-black text-slate-900">
                    {viewingAgreementPartner.agreement?.agreementNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Razón Social & CUIT:</span>
                  <span className="font-bold text-slate-800">
                    {viewingAgreementPartner.legalName} ({viewingAgreementPartner.cuit})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Firmante / Responsable:</span>
                  <span className="font-bold text-slate-800">
                    {viewingAgreementPartner.managerName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vigencia:</span>
                  <span className="font-bold text-emerald-700">
                    {viewingAgreementPartner.agreement?.signedDate} al{' '}
                    {viewingAgreementPartner.agreement?.validUntil} (
                    {viewingAgreementPartner.agreement?.status})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Archivo Resguardado:</span>
                  <span className="font-black text-blue-700">
                    {viewingAgreementPartner.agreement?.fileName || 'Acta_Convenio_B2B.pdf'}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-1.5">
                <p className="font-black text-amber-950 uppercase text-[10px]">
                  Condiciones Comerciales y Cláusulas Pactadas
                </p>
                <p className="text-amber-900 font-medium">
                  {viewingAgreementPartner.agreement?.notes ||
                    'Liquidación de comisiones habilitada en efectivo por mostrador, transferencia bancaria o puntos Rewards.'}
                </p>
                <p className="text-[11px] font-bold text-amber-800 pt-1">
                  • TravelCab: {viewingAgreementPartner.cabCommissionPct}% | Experience:{' '}
                  {viewingAgreementPartner.experienceCommissionPct}% | Rewards Dto.:{' '}
                  {viewingAgreementPartner.rewardsDiscountPct}% (Reintegro:{' '}
                  {viewingAgreementPartner.rewardsReimbursementPct}%)
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {viewingAgreementPartner.agreement?.fileDataUrl ? (
                  <a
                    href={viewingAgreementPartner.agreement.fileDataUrl}
                    download={viewingAgreementPartner.agreement.fileName || 'Convenio_B2B.pdf'}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Copia Original</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir Constancia del Convenio</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewingAgreementPartner(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 3: COMPROBANTE IMPRIMIBLE DE RECIBO DE PAGO EN EFECTIVO / PUNTOS
          ==================================================================== */}
      {printableSettlementReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 p-6 space-y-4 text-xs">
            <div className="border-b border-dashed border-slate-300 pb-4 text-center">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-black text-[10px] uppercase">
                Comprobante Oficial de Liquidación B2B
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                Recibo N° {printableSettlementReceipt.receiptNumber}
              </h3>
              <p className="text-[11px] text-slate-500">
                Fecha: {new Date(printableSettlementReceipt.createdAt).toLocaleString('es-AR')}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Aliado Comercial:</span>
                <span className="font-black text-slate-900">{printableSettlementReceipt.partnerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Modalidad de Pago:</span>
                <span className="font-black text-emerald-700">
                  {printableSettlementReceipt.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Entregado por:</span>
                <span className="font-bold text-slate-800">
                  {printableSettlementReceipt.deliveredByName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recibido en conformidad por:</span>
                <span className="font-bold text-slate-800">
                  {printableSettlementReceipt.receivedByName}{' '}
                  {printableSettlementReceipt.receivedByDni
                    ? `(DNI ${printableSettlementReceipt.receivedByDni})`
                    : ''}
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900 text-white p-4 space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Comisiones TravelCab:</span>
                <span>${printableSettlementReceipt.cabCommissionIncluded.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Comisiones Experience:</span>
                <span>
                  ${printableSettlementReceipt.experienceCommissionIncluded.toLocaleString('es-AR')}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Reintegro Descuentos Rewards:</span>
                <span>
                  ${printableSettlementReceipt.rewardsReimbursementIncluded.toLocaleString('es-AR')}
                </span>
              </div>
              <div className="flex justify-between text-emerald-400 font-black text-base pt-2 border-t border-white/10">
                <span>TOTAL ABONADO:</span>
                <span>${printableSettlementReceipt.amountArs.toLocaleString('es-AR')}</span>
              </div>
            </div>

            <div className="pt-6 border-t border-dashed border-slate-300 text-center text-[11px] text-slate-400">
              Firma y Aclaración Receptor Aliado B2B
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-black flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Recibo</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintableSettlementReceipt(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
