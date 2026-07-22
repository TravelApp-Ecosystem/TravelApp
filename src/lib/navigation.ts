import { BarChart3, FileText, Users, LayoutDashboard, Calendar, History, Bot, MessageSquare, Car, Map, Route, Palmtree, Ticket, Megaphone, TrendingUp, Settings, Gift, PieChart, UserCheck, UserPlus, Vault, BookOpen, AlarmClock, Building2, Zap, Radio, PlusCircle, ShieldAlert, DollarSign, Calculator } from 'lucide-react';

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
      title: 'Auditoría & Finanzas',
      items: [
        { id: 'audit-overview', label: 'Tablero de Control', href: '/audit', icon: BarChart3 },
      ]
    };
  }

  // Configuración para Recursos Humanos (RRHH)
  if (pathname.startsWith('/hr')) {
    return {
      title: 'Recursos Humanos',
      items: [
        { id: 'partners', label: 'Lista de Socios', href: '/hr', icon: Users },
        { id: 'new-partner', label: 'Nuevo Conductor', href: '/hr/new-partner', icon: UserPlus },
        { id: 'applications', label: 'Postulaciones', href: '/hr#postulaciones', icon: FileText },
        { id: 'staff', label: 'Gestión de Personal', href: '/hr/staff', icon: Users },
        { id: 'org-chart', label: 'Organigrama empresarial', href: '/hr/org-chart', icon: Route },
      ]
    };
  }

  // Configuración para CMS
  if (pathname.startsWith('/cms')) {
    return {
      title: 'CMS & Landing Web',
      items: [
        { id: 'cms-editor', label: 'Gestor de Contenido', href: '/cms', icon: FileText },
      ]
    };
  }

  // Configuración para Rewards
  if (pathname.startsWith('/rewards')) {
    return {
      title: 'Rewards & Fidelización',
      items: [
        { id: 'analytics', label: 'Principal', href: '/rewards/analytics', icon: PieChart },
        { id: 'rewards-create-merchant', label: 'Comercio Asociado', href: '/rewards/merchants/new', icon: UserPlus },
        { id: 'rewards-create-rubro', label: 'Crear Rubro', href: '/rewards/settings?tab=rubros&action=new', icon: PlusCircle },
        { id: 'rewards-create-category', label: 'Crear Categoría', href: '/rewards/settings?tab=categories&action=new', icon: PlusCircle },
        { id: 'validator', label: 'Validador de cupones', href: '/rewards/validator', icon: Zap },
        { id: 'merchants', label: 'Gestión de comercios', href: '/rewards/merchants', icon: Building2 },
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
        { id: 'dashboard', label: 'Principal', href: '/experiences', icon: LayoutDashboard },
        { id: 'quoter', label: 'Cotizador de Viajes', href: '/experiences/quoter', icon: Calculator },
        { id: 'catalog', label: 'Catálogo de viajes', href: '/experiences/catalog', icon: Palmtree },
        { id: 'create-customer', label: 'Crear Cliente', href: '/experiences/customers/new', icon: UserPlus },
        { id: 'create-reservation', label: 'Crear Reserva', href: '/experiences/reservations/new', icon: Ticket },
        { id: 'create-group-trip', label: 'Crear Viaje Grupal', href: '/experiences/group-trips/new', icon: PlusCircle },
        { id: 'spots', label: 'Cupos disponibles', href: '/experiences/spots', icon: Users },
        { id: 'coordinators', label: 'Gestión de Coordinadores', href: '/experiences/coordinators', icon: UserCheck },
        { id: 'coordinator-app', label: 'Gestión de App Coordinador', href: '/experiences/coordinator-app', icon: Radio },
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
        { id: 'travelcab-create-service', label: 'Crear Servicio', href: '/travelcab/settings?tab=tariffs&action=new', icon: PlusCircle },
        { id: 'travelcab-create-category', label: 'Crear Categoría', href: '/travelcab/settings?tab=categories&action=new', icon: PlusCircle },
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
