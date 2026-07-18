import { BarChart3, FileText, Users, LayoutDashboard, Calendar, History, Bot, MessageSquare, Car, Map, Route, Palmtree, Ticket, Megaphone, TrendingUp, Settings, Gift, PieChart, UserCheck, UserPlus, Vault, BookOpen, AlarmClock, Building2, Zap, Radio, PlusCircle, ShieldAlert, DollarSign } from 'lucide-react';

export const topNavTabs = [
  { id: 'global', label: 'Visión Global', href: '/' },
  { id: 'crm', label: 'CRM Ventas', href: '/crm' },
  { id: 'travelcab', label: 'TravelCab', href: '/travelcab' },
  { id: 'experiences', label: 'Experience', href: '/experiences' },
  { id: 'rewards', label: 'Rewards', href: '/rewards/analytics' },
  { id: 'hr', label: 'RRHH', href: '/hr' },
  { id: 'cms', label: 'CMS Web', href: '/cms' },
  { id: 'growth', label: 'Crecimiento', href: '/marketing' },
  { id: 'audit', label: 'Auditoría', href: '/audit' },
];

export const getSidebarConfig = (pathname: string) => {
  // Configuración para Mensajería
  if (pathname.startsWith('/messages')) {
    return {
      title: 'Centro de Mensajería',
      items: [
        { id: 'conversations', label: 'Conversaciones', href: '/messages', icon: MessageSquare },
        { id: 'automated', label: 'Mensajes Automáticos', href: '/messages#automated', icon: Zap },
        { id: 'broadcast', label: 'Broadcast / Campañas', href: '/messages#broadcast', icon: Radio },
      ]
    };
  }

  // Configuración para Auditoría Contable
  if (pathname.startsWith('/audit')) {
    return {
      title: 'Control Financiero',
      items: [
        { id: 'audit-flow', label: 'Flujo y Bancos', href: '/audit', icon: Vault },
        { id: 'audit-ledger', label: 'Libro Mayor', href: '/audit#ledger', icon: BookOpen },
        { id: 'audit-schedule', label: 'Vencimientos', href: '/audit#schedule', icon: AlarmClock },
        { id: 'audit-directory', label: 'Directorio Comercial', href: '/audit#directory', icon: Building2 },
      ]
    };
  }

  // Configuración para RRHH / Socios
  if (pathname.startsWith('/hr')) {
    return {
      title: 'RRHH & Socios',
      items: [
        { id: 'partners', label: 'Lista de Socios', href: '/hr', icon: UserCheck },
        { id: 'new-partner', label: 'Nuevo Conductor', href: '/hr/new-partner', icon: UserPlus },
        { id: 'applications', label: 'Postulaciones', href: '/hr#postulaciones', icon: FileText },
      ]
    };
  }

  // Configuración para Rewards
  if (pathname.startsWith('/rewards')) {
    return {
      title: 'Rewards & Fidelización',
      items: [
        { id: 'analytics', label: 'Panel Analítico', href: '/rewards/analytics', icon: PieChart },
        { id: 'settings', label: 'Reglas de Recompensa', href: '/rewards/settings', icon: Gift },
      ]
    };
  }

  // Configuración para Marketing / Crecimiento
  if (pathname.startsWith('/marketing')) {
    return {
      title: 'Growth & Ads',
      items: [
        { id: 'marketing', label: 'Marketing & Ads', href: '/marketing', icon: Megaphone },
        { id: 'analytics', label: 'Analítica Avanzada', href: '#', icon: TrendingUp },
      ]
    };
  }

  // Configuración para Experiencias
  if (pathname.startsWith('/experiences')) {
    return {
      title: 'Experiencias & Tours',
      items: [
        { id: 'catalog', label: 'Catálogo de Tours', href: '/experiences', icon: Palmtree },
        { id: 'reservations', label: 'Reservas Activas', href: '#', icon: Ticket },
        { id: 'inventory', label: 'Inventario de Cupos', href: '#', icon: Users },
      ]
    };
  }

  // Configuración para TravelCab
  if (pathname.startsWith('/travelcab')) {
    return {
      title: 'Logística TravelCab',
      items: [
        { id: 'dashboard', label: 'Principal', href: '/travelcab', icon: LayoutDashboard },
        { id: 'dispatch', label: 'Central de Despacho', href: '/travelcab/dispatch', icon: Map },
        { id: 'branches', label: 'Gestión de Sucursal', href: '/travelcab/branches', icon: Building2 },
        { id: 'drivers', label: 'Gestión de Conductores', href: '/travelcab/drivers', icon: Users },
        { id: 'fleet', label: 'Gestión de Móviles', href: '/travelcab/fleet', icon: Car },
        { id: 'create-service', label: 'Crear Servicio', href: '/travelcab/settings?tab=tariffs&action=new', icon: PlusCircle },
        { id: 'create-category', label: 'Crear Categoría', href: '/travelcab/settings?tab=categories&action=new', icon: PlusCircle },
        { id: 'settings', label: 'Gestión de Tarifas', href: '/travelcab/settings', icon: DollarSign },
        { id: 'security', label: 'Seguridad del Ecosistema', href: '/travelcab/security', icon: ShieldAlert },
      ]
    };
  }

  // Configuración para el CRM
  if (pathname.startsWith('/crm')) {
    return {
      title: 'CRM Ventas',
      items: [
        { id: 'leads', label: 'Tablero de Leads', href: '/crm', icon: LayoutDashboard },
        { id: 'agenda', label: 'Mi Agenda (Meet)', href: '/crm/agenda', icon: Calendar },
        { id: 'history', label: 'Historial de Ventas', href: '/crm/history', icon: History },
        { id: 'customers', label: 'Lista de Clientes', href: '/crm/customers', icon: Users },
        { id: 'travis', label: 'Travis IA ✦', href: '/crm/travis', icon: Bot },
      ]
    };
  }
  
  // Configuración por defecto (Visión Global)
  return {
    title: 'Visión Global',
    items: [
      { id: 'metrics', label: 'Métricas del Sistema', href: '/', icon: BarChart3 },
      { id: 'users', label: 'Gestión de Usuarios', href: '/users', icon: Users },
      { id: 'branches', label: 'Gestión de Sucursales', href: '/branches', icon: Building2 },
      { id: 'messages', label: 'Centro de Mensajería', href: '/messages', icon: MessageSquare },
    ]
  };
};
