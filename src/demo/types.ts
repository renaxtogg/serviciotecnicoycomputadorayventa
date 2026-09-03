/* ============================================================================
   MODELO DE DOMINIO — Servicio técnico + venta de celulares y computadoras
   ==========================================================================*/

export type DeviceType = 'celular' | 'notebook' | 'pc' | 'tablet' | 'impresora' | 'consola'

export type OrderStatus =
  | 'recibido'
  | 'diagnostico'
  | 'presupuestado'
  | 'aprobado'
  | 'reparacion'
  | 'espera_repuesto'
  | 'listo'
  | 'entregado'
  | 'no_reparable'
  | 'rechazado'

export type Channel = 'local' | 'web' | 'whatsapp' | 'instagram' | 'telefono'
export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'qr' | 'cuotas'
export type StaffRole = 'admin' | 'tecnico' | 'vendedor' | 'recepcion'
export type Tone = 'blue' | 'navy' | 'mint' | 'amber' | 'slate' | 'danger'

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  kind: 'persona' | 'empresa'
  ruc?: string
  address?: string
  notes?: string
  createdAt: string
  channel: Channel
}

export interface ChecklistItem {
  key: string
  label: string
  ok: boolean
}

export interface OrderPart {
  productId?: string
  name: string
  qty: number
  cost: number
  price: number
}

export interface OrderPayment {
  id: string
  date: string
  amount: number
  method: PaymentMethod
  note?: string
}

export interface OrderEvent {
  id: string
  ts: string
  type: 'estado' | 'nota' | 'pago' | 'presupuesto' | 'repuesto' | 'aviso' | 'creacion'
  text: string
  by: string
}

export interface ServiceOrder {
  id: string
  code: string
  customerId: string
  device: {
    type: DeviceType
    brand: string
    model: string
    serial?: string
    color?: string
    accessories: string[]
    unlock?: string
  }
  reportedIssue: string
  diagnosis?: string
  workDone?: string
  checklist: ChecklistItem[]
  status: OrderStatus
  priority: 'normal' | 'urgente'
  technicianId?: string
  parts: OrderPart[]
  labor: number
  quotedTotal: number
  quoteSentAt?: string
  approvedAt?: string
  payments: OrderPayment[]
  warrantyDays: number
  receivedAt: string
  promisedAt: string
  deliveredAt?: string
  channel: Channel
  notes?: string
  events: OrderEvent[]
}

export type ProductCategory =
  | 'celular'
  | 'notebook'
  | 'pc'
  | 'tablet'
  | 'accesorio'
  | 'repuesto'
  | 'componente'

export interface Product {
  id: string
  sku: string
  name: string
  category: ProductCategory
  brand: string
  model?: string
  condition: 'nuevo' | 'usado' | 'reacondicionado'
  cost: number
  price: number
  stock: number
  minStock: number
  serial?: string
  warrantyDays: number
  specs: string[]
  description?: string
  /** Si está publicado, aparece en la tienda del sitio web público */
  published: boolean
  featured: boolean
  location?: string
  createdAt: string
  /** Identidad visual del producto en la demo (sin fotos reales) */
  art: { emoji: string; tone: Tone }
}

export interface SaleItem {
  productId: string
  name: string
  qty: number
  price: number
  cost: number
}

export interface Sale {
  id: string
  code: string
  customerId?: string
  customerName: string
  items: SaleItem[]
  discount: number
  total: number
  method: PaymentMethod
  installments?: number
  status: 'pagada' | 'pendiente' | 'anulada'
  sellerId: string
  date: string
  channel: Channel
  note?: string
}

export interface Staff {
  id: string
  name: string
  role: StaffRole
  specialty?: string
  phone: string
  active: boolean
  since: string
  tone: Tone
}

export interface CashMovement {
  id: string
  date: string
  kind: 'ingreso' | 'egreso'
  concept: string
  category: 'servicio' | 'venta' | 'repuestos' | 'sueldos' | 'alquiler' | 'servicios' | 'otros'
  amount: number
  method: PaymentMethod
  refType?: 'orden' | 'venta' | 'manual'
  refId?: string
}

/** Solicitud entrante desde el sitio web público hacia la bandeja del panel */
export interface WebRequest {
  id: string
  type: 'reparacion' | 'producto' | 'consulta'
  name: string
  phone: string
  deviceLabel?: string
  issue?: string
  productId?: string
  productName?: string
  preferredSlot?: string
  status: 'nueva' | 'contactado' | 'agendada' | 'convertida' | 'descartada'
  createdAt: string
  source: Channel
  estimate?: number
  note?: string
}

/** Catálogo de servicios: se administra en el panel y se publica en la web */
export interface ServiceItem {
  id: string
  name: string
  category: 'celular' | 'notebook' | 'pc' | 'general'
  description: string
  fromPrice: number
  etaHours: number
  warrantyDays: number
  icon: string
  published: boolean
  popular: boolean
}

export interface AppNotification {
  id: string
  ts: string
  kind: 'stock' | 'orden' | 'lead' | 'pago' | 'garantia'
  title: string
  text: string
  read: boolean
  link?: string
}

export interface DemoDB {
  version: number
  seededAt: string
  customers: Customer[]
  orders: ServiceOrder[]
  products: Product[]
  sales: Sale[]
  staff: Staff[]
  cash: CashMovement[]
  requests: WebRequest[]
  services: ServiceItem[]
  notifications: AppNotification[]
  settings: {
    businessName: string
    warrantyDays: number
    lowStockAlert: boolean
    slaDays: number
    orderSeq: number
    saleSeq: number
  }
}

/* ---------------------------------------------------------------------------
   Metadatos de estado — un único lugar define etiqueta, color y flujo válido
   -------------------------------------------------------------------------*/
export const ORDER_STATUS: Record<
  OrderStatus,
  { label: string; short: string; tone: Tone; help: string; next: OrderStatus[] }
> = {
  recibido: {
    label: 'Recibido',
    short: 'Recibido',
    tone: 'slate',
    help: 'El equipo ingresó al taller y está en cola de diagnóstico.',
    next: ['diagnostico', 'rechazado'],
  },
  diagnostico: {
    label: 'En diagnóstico',
    short: 'Diagnóstico',
    tone: 'blue',
    help: 'Un técnico está revisando el equipo para determinar la falla.',
    next: ['presupuestado', 'no_reparable'],
  },
  presupuestado: {
    label: 'Presupuesto enviado',
    short: 'Presupuestado',
    tone: 'amber',
    help: 'Esperando que el cliente apruebe el presupuesto.',
    next: ['aprobado', 'rechazado'],
  },
  aprobado: {
    label: 'Aprobado',
    short: 'Aprobado',
    tone: 'mint',
    help: 'El cliente aprobó el presupuesto. Listo para entrar a reparación.',
    next: ['reparacion', 'espera_repuesto'],
  },
  reparacion: {
    label: 'En reparación',
    short: 'Reparando',
    tone: 'blue',
    help: 'Trabajo en curso sobre el equipo.',
    next: ['espera_repuesto', 'listo', 'no_reparable'],
  },
  espera_repuesto: {
    label: 'Esperando repuesto',
    short: 'Repuesto',
    tone: 'amber',
    help: 'Reparación pausada hasta que llegue el repuesto.',
    next: ['reparacion', 'listo', 'no_reparable'],
  },
  listo: {
    label: 'Listo para retirar',
    short: 'Listo',
    tone: 'mint',
    help: 'Reparación terminada. El cliente puede pasar a retirar.',
    next: ['entregado'],
  },
  entregado: {
    label: 'Entregado',
    short: 'Entregado',
    tone: 'slate',
    help: 'Equipo entregado al cliente y cobrado.',
    next: [],
  },
  no_reparable: {
    label: 'Sin reparación',
    short: 'Sin repar.',
    tone: 'danger',
    help: 'El equipo no tiene reparación viable. Se devuelve al cliente.',
    next: ['entregado'],
  },
  rechazado: {
    label: 'Presupuesto rechazado',
    short: 'Rechazado',
    tone: 'danger',
    help: 'El cliente no aprobó el presupuesto. Se devuelve el equipo.',
    next: ['entregado'],
  },
}

/** Estados en los que el equipo sigue ocupando lugar físico en el taller */
export const OPEN_STATUSES: OrderStatus[] = [
  'recibido',
  'diagnostico',
  'presupuestado',
  'aprobado',
  'reparacion',
  'espera_repuesto',
  'listo',
]

/** Columnas del tablero de taller */
export const BOARD_COLUMNS: OrderStatus[] = [
  'recibido',
  'diagnostico',
  'presupuestado',
  'aprobado',
  'reparacion',
  'espera_repuesto',
  'listo',
]

export const DEVICE_LABEL: Record<DeviceType, string> = {
  celular: 'Celular',
  notebook: 'Notebook',
  pc: 'PC de escritorio',
  tablet: 'Tablet',
  impresora: 'Impresora',
  consola: 'Consola',
}

export const CATEGORY_LABEL: Record<ProductCategory, string> = {
  celular: 'Celulares',
  notebook: 'Notebooks',
  pc: 'PC de escritorio',
  tablet: 'Tablets',
  accesorio: 'Accesorios',
  repuesto: 'Repuestos',
  componente: 'Componentes',
}

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  qr: 'Pago QR',
  cuotas: 'Cuotas',
}

export const REQUEST_STATUS: Record<WebRequest['status'], { label: string; tone: Tone }> = {
  nueva: { label: 'Nueva', tone: 'blue' },
  contactado: { label: 'Contactado', tone: 'amber' },
  agendada: { label: 'Agendada', tone: 'navy' },
  convertida: { label: 'Convertida', tone: 'mint' },
  descartada: { label: 'Descartada', tone: 'slate' },
}

export const ROLE_LABEL: Record<StaffRole, string> = {
  admin: 'Administración',
  tecnico: 'Técnico',
  vendedor: 'Ventas',
  recepcion: 'Recepción',
}
