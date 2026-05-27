export type AccountType = 'banco' | 'billetera' | 'caja_chica';
export type Currency    = 'ARS' | 'USD' | 'EUR' | 'BRL';
export type BizUnit     = 'TravelCab' | 'Experiences' | 'Rewards' | 'Global';

export interface BankAccount {
  id: string;
  name: string;
  type: AccountType;
  currency: Currency;
  balance: number;
  businessUnit: BizUnit;
  status: 'active' | 'disabled';
  accountNumber?: string;
  cbuCvu?: string;
  alias?: string;
  branch?: string;
}

export interface AuditAdjustment {
  id: string;
  accountId: string;
  previousBalance: number;
  newBalance: number;
  reason: string;
  executedBy: string;
  timestamp: Date;
}

export type TxType      = 'ingreso' | 'egreso';
export type TxStatus    = 'completado' | 'pendiente_conciliacion';
export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque';

export interface LedgerTransaction {
  id: string;
  date: Date;
  concept: string;
  businessUnit: BizUnit;
  accountId: string;
  type: TxType;
  amount: number;
  currency: Currency;
  status: TxStatus;
  paymentMethod: PaymentMethod;
  attachmentUrl: string | null;
}

export type ScheduleType   = 'cobro' | 'pago';
export type ScheduleStatus = 'vencido' | 'pendiente' | 'pagado';

export interface ScheduledTransaction {
  id: string;
  dueDate: Date;
  concept: string;
  businessUnit: BizUnit;
  type: ScheduleType;
  amount: number;
  currency: Currency;
  status: ScheduleStatus;
}

// ── Audit Log ─────────────────────────────────────────────────────────────────
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  module: string;
  timestamp: Date;
  details: string;
}

// ── Profitability: Fixed Costs ────────────────────────────────────────────────
export interface FixedCost {
  id: string;
  concept: string;
  amount: number;
  category: string;
  isTemporary: boolean;
  remainingInstallments?: number;
  status: 'active' | 'completed';
}

// ── Profitability: Budgets ────────────────────────────────────────────────────
export interface Budget {
  id: string;
  name: string;
  assignedAmount: number;
  consumedAmount: number;
  // Link hook: when a LedgerTransaction egreso is saved with budgetId,
  // consumedAmount += transaction.amount (wire in LedgerTab onSave in production)
  status: 'active' | 'archived';
}

export const INITIAL_FIXED_COSTS: FixedCost[] = [
  { id:'fc-1', concept:'Alquiler Oficina Central', amount:180_000, category:'Inmueble', isTemporary:false, status:'active' },
  { id:'fc-2', concept:'Hosting Vercel (Pro) — USD 420', amount:420, category:'IT / Software', isTemporary:false, status:'active' },
  { id:'fc-3', concept:'Google Workspace Business', amount:85_000, category:'IT / Software', isTemporary:false, status:'active' },
  { id:'fc-4', concept:'Mapfre — Póliza Flota Automotor', amount:96_400, category:'Seguros', isTemporary:false, status:'active' },
  { id:'fc-5', concept:'Software Dispatch (Suscripción)', amount:22_000, category:'IT / Software', isTemporary:false, status:'active' },
  { id:'fc-6', concept:'Contador / Estudio Contable', amount:75_000, category:'Profesionales', isTemporary:false, status:'active' },
  { id:'fc-7', concept:'Impresora Multifunción — Cuotas', amount:18_500, category:'Equipamiento', isTemporary:true, remainingInstallments:4, status:'active' },
];

export const INITIAL_BUDGETS: Budget[] = [
  { id:'bg-1', name:'Operaciones TravelCab', assignedAmount:2_500_000, consumedAmount:2_100_000, status:'active' },
  { id:'bg-2', name:'Marketing & Crecimiento', assignedAmount:350_000, consumedAmount:297_500, status:'active' },
  { id:'bg-3', name:'Experiences / Tours', assignedAmount:1_200_000, consumedAmount:980_000, status:'active' },
  { id:'bg-4', name:'Rewards & Fidelización', assignedAmount:400_000, consumedAmount:310_000, status:'active' },
  { id:'bg-5', name:'Infraestructura IT', assignedAmount:180_000, consumedAmount:107_000, status:'active' },
  { id:'bg-6', name:'Campaña Meta Vaca Muerta', assignedAmount:120_000, consumedAmount:102_000, status:'active' },
  { id:'bg-7', name:'Operaciones Q1 2026', assignedAmount:900_000, consumedAmount:900_000, status:'archived' },
];

// ── Directory ─────────────────────────────────────────────────────────────────
export type DirectoryCategory = 'proveedor' | 'prestador' | 'operador';

export interface DirectoryContact {
  id: string;
  name: string;
  cuit: string;
  category: DirectoryCategory;
  rubro: string;
  email: string;
  phone: string;
}

export const INITIAL_DIRECTORY: DirectoryContact[] = [
  { id:'dc-1', name:'Vercel Inc.', cuit:'30-71234567-9', category:'proveedor', rubro:'Hosting / Infraestructura', email:'billing@vercel.com', phone:'+1 415 000 0001' },
  { id:'dc-2', name:'Google Workspace', cuit:'30-68100000-1', category:'proveedor', rubro:'Software / SaaS', email:'admin@travelapp.ar', phone:'+54 11 0000 0001' },
  { id:'dc-3', name:'Mapfre Argentina S.A.', cuit:'30-55123456-7', category:'proveedor', rubro:'Seguros Automotor', email:'siniestros@mapfre.com.ar', phone:'0800 888 6273' },
  { id:'dc-4', name:'Carlos Medina', cuit:'20-28456789-3', category:'prestador', rubro:'Chofer TravelCab', email:'cmedina.cab@gmail.com', phone:'+54 381 456 7890' },
  { id:'dc-5', name:'Rodrigo Villalba', cuit:'20-30112233-4', category:'prestador', rubro:'Chofer TravelCab', email:'rvillalba.cab@gmail.com', phone:'+54 381 567 8901' },
  { id:'dc-6', name:'Pablo Gutierrez', cuit:'20-25678901-5', category:'prestador', rubro:'Guía Turístico', email:'pgutierrez.tours@gmail.com', phone:'+54 381 678 9012' },
  { id:'dc-7', name:'Agencia Mayorista Norte S.R.L.', cuit:'30-62345678-2', category:'operador', rubro:'Turismo Receptivo', email:'ventas@mayoristanorte.com.ar', phone:'0381 422 1234' },
  { id:'dc-8', name:'Viajes del Sol S.A.', cuit:'30-70123456-8', category:'operador', rubro:'Operador Mayorista Nacional', email:'ops@viajesdelsolsa.ar', phone:'011 4800 5555' },
];

// ── Shared helpers ────────────────────────────────────────────────────────────
export const CUR_SYM: Record<Currency, string> = { ARS: '$', USD: 'U$D', EUR: '€', BRL: 'R$' };
export const fmt = (n: number, c: Currency) =>
  `${CUR_SYM[c]} ${n.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;

export const BIZ_COLOR: Record<BizUnit, string> = {
  TravelCab:   'bg-yellow-100 text-yellow-800',
  Experiences: 'bg-lime-100 text-lime-800',
  Rewards:     'bg-purple-100 text-purple-800',
  Global:      'bg-sky-100 text-sky-800',
};

export const INITIAL_ACCOUNTS: BankAccount[] = [
  { id:'a1', name:'Banco Galicia', type:'banco', currency:'ARS', balance:1_840_500, businessUnit:'Experiences', status:'active', accountNumber:'4-123456/7-001', cbuCvu:'0070999420000012345670', alias:'travelapp.exp.galicia', branch:'Suc. Tucumán Centro - 0994' },
  { id:'a2', name:'Banco Macro', type:'banco', currency:'ARS', balance:3_215_000, businessUnit:'TravelCab', status:'active', accountNumber:'3-098765/4-002', cbuCvu:'2850590940090876540024', alias:'travelcab.macro.tuc', branch:'Suc. Yerba Buena - 0590' },
  { id:'a3', name:'Banco Industrial', type:'banco', currency:'ARS', balance:620_000, businessUnit:'Rewards', status:'active', accountNumber:'5-456789/2-003', cbuCvu:'3220001805604567890032', alias:'rewards.industrial.tuc', branch:'Suc. Av. Mate de Luna - 0018' },
  { id:'a4', name:'Mercado Pago', type:'billetera', currency:'ARS', balance:475_320, businessUnit:'Global', status:'active', cbuCvu:'0000003100058765432100', alias:'travelapp.ecosistema', branch:'Billetera Digital' },
  { id:'a5', name:'Caja Chica Oficina', type:'caja_chica', currency:'ARS', balance:85_000, businessUnit:'Global', status:'active', branch:'Oficina Central TravelApp' },
  { id:'a6', name:'Banco Galicia USD', type:'banco', currency:'USD', balance:12_400, businessUnit:'Experiences', status:'active', accountNumber:'4-123456/7-401', cbuCvu:'0070999420000012345671', alias:'travelapp.exp.galicia.usd', branch:'Suc. Tucumán Centro - 0994' },
  { id:'a7', name:'Binance USDT', type:'billetera', currency:'USD', balance:3_800, businessUnit:'Global', status:'active', alias:'travelapp_binance', branch:'Exchange Digital' },
];

export const INITIAL_SCHEDULED: ScheduledTransaction[] = [
  { id:'sc-001', dueDate: new Date('2026-05-17'), concept:'Cobro Agencia Mayorista — Lote Abril', businessUnit:'Experiences', type:'cobro', amount:320_000, currency:'ARS', status:'vencido' },
  { id:'sc-002', dueDate: new Date('2026-05-22'), concept:'Liquidación Choferes — Semana 21', businessUnit:'TravelCab', type:'pago', amount:185_000, currency:'ARS', status:'pendiente' },
  { id:'sc-003', dueDate: new Date('2026-05-23'), concept:'Pago Hosting Vercel (Mensual)', businessUnit:'Global', type:'pago', amount:420, currency:'USD', status:'pendiente' },
  { id:'sc-004', dueDate: new Date('2026-05-30'), concept:'Cobro Reserva Grupo Mayo — RVA-N°38', businessUnit:'Experiences', type:'cobro', amount:98_500, currency:'ARS', status:'pendiente' },
  { id:'sc-005', dueDate: new Date('2026-06-05'), concept:'Póliza Seguro Flota — Renovación Semestral', businessUnit:'TravelCab', type:'pago', amount:145_000, currency:'ARS', status:'pendiente' },
  { id:'sc-006', dueDate: new Date('2026-06-10'), concept:'Cobro Anticipo Tour Salta — GRP-11', businessUnit:'Experiences', type:'cobro', amount:1_800, currency:'USD', status:'pendiente' },
  { id:'sc-007', dueDate: new Date('2026-05-18'), concept:'Abono Software Dispatch — Mayo', businessUnit:'TravelCab', type:'pago', amount:22_000, currency:'ARS', status:'pagado' },
];

export const INITIAL_TRANSACTIONS: LedgerTransaction[] = [
  { id:'tx-001', date: new Date('2026-05-19T09:00:00'), concept:'Liquidación Chofer Carlos M. — Viaje MU-1042', businessUnit:'TravelCab', accountId:'a2', type:'egreso', amount:28_500, currency:'ARS', status:'completado', paymentMethod:'transferencia', attachmentUrl:null },
  { id:'tx-002', date: new Date('2026-05-19T10:15:00'), concept:'Cobro Reserva Cuba — RVA-N°25/01', businessUnit:'Experiences', accountId:'a6', type:'ingreso', amount:1_200, currency:'USD', status:'completado', paymentMethod:'transferencia', attachmentUrl:'comprobante_rva25.pdf' },
  { id:'tx-003', date: new Date('2026-05-18T14:30:00'), concept:'Pago Software Dispatch (Suscripción mensual)', businessUnit:'TravelCab', accountId:'a5', type:'egreso', amount:15_000, currency:'ARS', status:'completado', paymentMethod:'tarjeta', attachmentUrl:'factura_dispatch_mayo.pdf' },
  { id:'tx-004', date: new Date('2026-05-18T08:00:00'), concept:'Acreditación Rewards — Puntos Canjeados Lote 88', businessUnit:'Rewards', accountId:'a3', type:'egreso', amount:42_300, currency:'ARS', status:'pendiente_conciliacion', paymentMethod:'transferencia', attachmentUrl:null },
  { id:'tx-005', date: new Date('2026-05-17T16:45:00'), concept:'Ingreso Tour Tafí del Valle — GRP-07', businessUnit:'Experiences', accountId:'a1', type:'ingreso', amount:185_000, currency:'ARS', status:'completado', paymentMethod:'transferencia', attachmentUrl:'comprobante_grp07.pdf' },
  { id:'tx-006', date: new Date('2026-05-17T11:00:00'), concept:'Seguro Flota Automotor — Póliza ANT-2026', businessUnit:'TravelCab', accountId:'a2', type:'egreso', amount:96_400, currency:'ARS', status:'pendiente_conciliacion', paymentMethod:'cheque', attachmentUrl:null },
  { id:'tx-007', date: new Date('2026-05-16T09:30:00'), concept:'Cobro Viaje VIP Aeropuerto MU-1038', businessUnit:'TravelCab', accountId:'a4', type:'ingreso', amount:18_700, currency:'ARS', status:'completado', paymentMethod:'efectivo', attachmentUrl:null },
  { id:'tx-008', date: new Date('2026-05-15T13:20:00'), concept:'Honorarios Guía Turístico — Gutierrez Pablo', businessUnit:'Experiences', accountId:'a1', type:'egreso', amount:35_000, currency:'ARS', status:'completado', paymentMethod:'transferencia', attachmentUrl:'recibo_gutierrez.pdf' },
  { id:'tx-009', date: new Date('2026-05-15T08:00:00'), concept:'Transferencia ecosistema — Global a TravelCab', businessUnit:'Global', accountId:'a4', type:'egreso', amount:150_000, currency:'ARS', status:'completado', paymentMethod:'transferencia', attachmentUrl:null },
  { id:'tx-010', date: new Date('2026-05-14T17:00:00'), concept:'Cobro Anticipo RVA. N°31 — Mendoza Circuito', businessUnit:'Experiences', accountId:'a6', type:'ingreso', amount:800, currency:'USD', status:'pendiente_conciliacion', paymentMethod:'transferencia', attachmentUrl:null },
  { id:'tx-011', date: new Date('2026-05-14T10:10:00'), concept:'Liquidación Chofer Rodrigo V. — Lote Sem. 19', businessUnit:'TravelCab', accountId:'a2', type:'egreso', amount:31_200, currency:'ARS', status:'completado', paymentMethod:'transferencia', attachmentUrl:'liquidacion_rv_s19.pdf' },
  { id:'tx-012', date: new Date('2026-05-13T15:00:00'), concept:'Recarga Caja Chica Oficina — Autorización FRI', businessUnit:'Global', accountId:'a5', type:'ingreso', amount:50_000, currency:'ARS', status:'completado', paymentMethod:'efectivo', attachmentUrl:null },
];
