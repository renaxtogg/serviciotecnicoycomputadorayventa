/* ============================================================================
   GENERADOR DE DATOS DEMO
   Produce un negocio verosímil con ~3 meses de historia operativa.
   Todas las fechas son relativas a "hoy", así la demo nunca se ve vieja.
   ==========================================================================*/
import { BRAND_CONFIG } from '@/config/brand'
import {
  COMPANY_NAMES, LAPTOP_ISSUES, LAPTOP_MODELS, NEIGHBORHOODS, PC_ISSUES, PC_MODELS,
  PERSON_NAMES, PHONE_ISSUES, PHONE_MODELS, PHONE_PREFIXES, PRODUCT_SEED, SERVICE_SEED,
  TABLET_MODELS, type IssueTemplate,
} from './catalog'
import type {
  AppNotification, CashMovement, Channel, Customer, DemoDB, OrderEvent, OrderStatus, PaymentMethod,
  Product, Sale, ServiceItem, ServiceOrder, Staff, WebRequest,
} from './types'

export const DEMO_VERSION = 3

/* --- PRNG determinista (mulberry32) -------------------------------------- */
function makeRng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rng = makeRng(20260214)

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)]
const int = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min
const chance = (p: number) => rng() < p
function weighted<T extends string>(options: Array<[T, number]>): T {
  const total = options.reduce((a, [, w]) => a + w, 0)
  let r = rng() * total
  for (const [value, w] of options) {
    r -= w
    if (r <= 0) return value
  }
  return options[0][0]
}
function shuffle<T>(arr: T[]) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/* --- Fechas --------------------------------------------------------------- */
const DAY = 86_400_000
function at(daysAgo: number, hour = 9, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}
function workHour() {
  return int(8, 18)
}
/** Empuja una fecha a día hábil (el taller cierra domingos) */
function businessDate(iso: string) {
  const d = new Date(iso)
  if (d.getDay() === 0) d.setDate(d.getDate() + 1)
  return d.toISOString()
}
function plusHours(iso: string, hours: number) {
  return businessDate(new Date(new Date(iso).getTime() + hours * 3_600_000).toISOString())
}

let evSeq = 0
function ev(ts: string, type: OrderEvent['type'], text: string, by: string): OrderEvent {
  return { id: `ev${++evSeq}`, ts, type, text, by }
}

function phoneNumber() {
  return `${pick(PHONE_PREFIXES)}${int(100, 999)}${int(100, 999)}`
}

/* ==========================================================================
   EQUIPO DE TRABAJO
   ========================================================================== */
function buildStaff(): Staff[] {
  return [
    { id: 'st1', name: 'Adrián Villamayor', role: 'admin', specialty: 'Dueño / Administración', phone: '0981447203', active: true, since: at(2100), tone: 'navy' },
    { id: 'st2', name: 'Cristian Bogado', role: 'tecnico', specialty: 'Micro-soldadura y placas', phone: '0982334119', active: true, since: at(1420), tone: 'blue' },
    { id: 'st3', name: 'Nadia Chávez', role: 'tecnico', specialty: 'Celulares y módulos', phone: '0985776210', active: true, since: at(890), tone: 'mint' },
    { id: 'st4', name: 'Elvio Barreto', role: 'tecnico', specialty: 'Notebooks y PC', phone: '0971558402', active: true, since: at(610), tone: 'amber' },
    { id: 'st5', name: 'Belén Ramírez', role: 'vendedor', specialty: 'Mostrador y ventas', phone: '0983221847', active: true, since: at(430), tone: 'slate' },
    { id: 'st6', name: 'Julio Sanabria', role: 'recepcion', specialty: 'Recepción y entregas', phone: '0991604733', active: true, since: at(180), tone: 'blue' },
  ]
}

/* ==========================================================================
   PRODUCTOS Y SERVICIOS
   ========================================================================== */
function buildProducts(): Product[] {
  return PRODUCT_SEED.map((p, i) => ({
    id: `pr${i + 1}`,
    sku: p.sku,
    name: p.name,
    category: p.category,
    brand: p.brand,
    model: p.model,
    condition: p.condition,
    cost: p.cost,
    price: p.price,
    stock: p.stock,
    minStock: p.minStock,
    warrantyDays: p.warrantyDays,
    specs: p.specs,
    description: p.description,
    published: p.published,
    featured: Boolean(p.featured),
    location: p.location,
    createdAt: at(int(40, 240), workHour()),
    art: { emoji: p.emoji, tone: p.tone },
  }))
}

function buildServices(): ServiceItem[] {
  return SERVICE_SEED.map((s, i) => ({
    id: `sv${i + 1}`,
    name: s.name,
    category: s.category,
    description: s.description,
    fromPrice: s.fromPrice,
    etaHours: s.etaHours,
    warrantyDays: s.warrantyDays,
    icon: s.icon,
    published: true,
    popular: Boolean(s.popular),
  }))
}

/* ==========================================================================
   CLIENTES
   ========================================================================== */
function buildCustomers(): Customer[] {
  const people = shuffle([...PERSON_NAMES]).slice(0, 34)
  const customers: Customer[] = people.map((name, i) => ({
    id: `cu${i + 1}`,
    name,
    phone: phoneNumber(),
    email: chance(0.45)
      ? `${name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(' ')[0]}.${name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(' ')[1]}@gmail.com`
      : undefined,
    kind: 'persona',
    address: `${pick(NEIGHBORHOODS)}, ${chance(0.5) ? 'Asunción' : 'Central'}`,
    createdAt: at(int(5, 400), workHour()),
    channel: weighted([['local', 5], ['whatsapp', 4], ['instagram', 2], ['web', 2], ['telefono', 1]]),
    notes: chance(0.16) ? pick([
      'Cliente frecuente, siempre paga en efectivo.',
      'Prefiere que le avisemos por WhatsApp, no atiende llamadas.',
      'Pasa a retirar después de las 17:00.',
      'Trabaja con nosotros hace años, hacer precio.',
    ]) : undefined,
  }))

  COMPANY_NAMES.forEach((name, i) => {
    customers.push({
      id: `cu${people.length + i + 1}`,
      name,
      phone: phoneNumber(),
      email: `administracion@${name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '').slice(0, 14)}.com.py`,
      kind: 'empresa',
      ruc: `${int(80010000, 80099999)}-${int(0, 9)}`,
      address: `${pick(NEIGHBORHOODS)}, Asunción`,
      createdAt: at(int(60, 500), workHour()),
      channel: weighted([['local', 3], ['telefono', 3], ['web', 2]]),
      notes: chance(0.5) ? 'Factura a nombre de la empresa. Pago a 15 días.' : undefined,
    })
  })

  return customers
}

/* ==========================================================================
   ÓRDENES DE SERVICIO — el corazón del taller
   ========================================================================== */
function statusForAge(age: number): OrderStatus {
  if (age >= 16) return weighted<OrderStatus>([['entregado', 84], ['rechazado', 8], ['no_reparable', 8]])
  if (age >= 8) return weighted<OrderStatus>([['entregado', 45], ['listo', 22], ['espera_repuesto', 14], ['reparacion', 10], ['presupuestado', 9]])
  if (age >= 3) return weighted<OrderStatus>([['reparacion', 28], ['listo', 20], ['presupuestado', 18], ['aprobado', 14], ['espera_repuesto', 10], ['entregado', 10]])
  if (age >= 1) return weighted<OrderStatus>([['diagnostico', 32], ['presupuestado', 26], ['reparacion', 20], ['aprobado', 12], ['recibido', 10]])
  return weighted<OrderStatus>([['recibido', 55], ['diagnostico', 30], ['presupuestado', 15]])
}

const CLOSED: OrderStatus[] = ['entregado', 'rechazado', 'no_reparable']
const QUOTED_ONWARDS: OrderStatus[] = ['presupuestado', 'aprobado', 'reparacion', 'espera_repuesto', 'listo', 'entregado']
const REPAIRED: OrderStatus[] = ['reparacion', 'espera_repuesto', 'listo', 'entregado']

function checklistFor(type: string) {
  const base = [
    { key: 'enciende', label: 'Enciende' },
    { key: 'pantalla', label: 'Pantalla sin fisuras' },
    { key: 'carcasa', label: 'Carcasa sin golpes' },
    { key: 'botones', label: 'Botones funcionan' },
    { key: 'carga', label: 'Carga correctamente' },
  ]
  const extra = type === 'celular' || type === 'tablet'
    ? [{ key: 'camara', label: 'Cámaras OK' }, { key: 'audio', label: 'Audio y micrófono OK' }, { key: 'humedad', label: 'Sin indicio de humedad' }]
    : [{ key: 'teclado', label: 'Teclado completo' }, { key: 'bateria', label: 'Batería retiene carga' }, { key: 'puertos', label: 'Puertos sin daño' }]
  return [...base, ...extra].map((it) => ({ ...it, ok: chance(0.72) }))
}

function buildOrders(customers: Customer[], staff: Staff[]) {
  const techs = staff.filter((s) => s.role === 'tecnico')
  const orders: ServiceOrder[] = []
  let seq = 1000

  const TOTAL = 58
  for (let i = 0; i < TOTAL; i++) {
    // Distribución: más órdenes recientes que antiguas
    const age = i < 14 ? int(0, 3) : i < 28 ? int(4, 12) : int(13, 88)
    const receivedAt = at(age, workHour(), pick([0, 15, 30, 45]))

    const deviceType = weighted<'celular' | 'notebook' | 'pc' | 'tablet'>([
      ['celular', 55], ['notebook', 30], ['pc', 10], ['tablet', 5],
    ])
    const pool = deviceType === 'celular' ? PHONE_MODELS
      : deviceType === 'notebook' ? LAPTOP_MODELS
      : deviceType === 'pc' ? PC_MODELS : TABLET_MODELS
    const device = pick(pool)
    const issues: IssueTemplate[] = deviceType === 'celular' || deviceType === 'tablet' ? PHONE_ISSUES
      : deviceType === 'pc' ? PC_ISSUES : LAPTOP_ISSUES
    const tpl = pick(issues)

    const status = statusForAge(age)
    const tech = pick(techs)
    const customer = pick(customers)
    const priority = chance(0.12) ? 'urgente' : 'normal'

    const partPrice = tpl.part ? tpl.part.price : 0
    const quoted = tpl.labor + partPrice
    const etaHours = tpl.part ? int(24, 72) : int(4, 30)
    const promisedAt = plusHours(receivedAt, priority === 'urgente' ? Math.round(etaHours / 2) : etaHours)

    const hasQuote = QUOTED_ONWARDS.includes(status)
    const wasRepaired = REPAIRED.includes(status)
    const delivered = status === 'entregado'

    const by = tech.name
    const events: OrderEvent[] = [
      ev(receivedAt, 'creacion', `Equipo recibido en mostrador. Falla reportada: "${tpl.issue}".`, 'Julio Sanabria'),
    ]

    const tDiag = plusHours(receivedAt, int(2, 20))
    if (status !== 'recibido') {
      events.push(ev(tDiag, 'estado', `Diagnóstico iniciado por ${by}.`, by))
    }
    if (hasQuote) {
      const tQuote = plusHours(tDiag, int(1, 8))
      events.push(ev(tQuote, 'presupuesto', `Presupuesto enviado al cliente por WhatsApp: ₲ ${quoted.toLocaleString('es-PY')}.`, by))
    }
    if (status === 'rechazado') {
      events.push(ev(plusHours(tDiag, int(10, 40)), 'estado', 'El cliente no aprobó el presupuesto. Se prepara devolución del equipo.', 'Julio Sanabria'))
    }
    if (status === 'no_reparable') {
      events.push(ev(plusHours(tDiag, int(8, 30)), 'estado', 'Placa con daño irreversible. Se informa al cliente que no tiene reparación viable.', by))
    }

    let approvedAt: string | undefined
    if (['aprobado', 'reparacion', 'espera_repuesto', 'listo', 'entregado'].includes(status)) {
      approvedAt = plusHours(tDiag, int(2, 26))
      events.push(ev(approvedAt, 'estado', 'Cliente aprobó el presupuesto. Orden pasa a reparación.', 'Julio Sanabria'))
    }
    if (status === 'espera_repuesto') {
      events.push(ev(plusHours(approvedAt ?? tDiag, int(1, 6)), 'repuesto', `Repuesto "${tpl.part?.name ?? 'componente'}" pedido al proveedor. Llegada estimada en 48 h.`, by))
    }
    if (['listo', 'entregado'].includes(status)) {
      events.push(ev(plusHours(approvedAt ?? tDiag, int(3, 30)), 'estado', `Reparación finalizada y probada. ${tpl.work}`, by))
      events.push(ev(plusHours(approvedAt ?? tDiag, int(31, 34)), 'aviso', 'Se avisó al cliente por WhatsApp que el equipo está listo para retirar.', 'Julio Sanabria'))
    }

    const payments = []
    let deliveredAt: string | undefined
    if (delivered) {
      deliveredAt = plusHours(approvedAt ?? tDiag, int(36, 96))
      const method = weighted<PaymentMethod>([['efectivo', 45], ['transferencia', 26], ['tarjeta', 15], ['qr', 10], ['cuotas', 4]])
      payments.push({ id: `pay${i}a`, date: deliveredAt, amount: quoted, method, note: 'Pago al retirar' })
      events.push(ev(deliveredAt, 'pago', `Cobro de ₲ ${quoted.toLocaleString('es-PY')} en ${method}.`, 'Belén Ramírez'))
      events.push(ev(deliveredAt, 'estado', 'Equipo entregado al cliente con comprobante de garantía.', 'Julio Sanabria'))
    } else if (hasQuote && tpl.part && chance(0.45) && approvedAt) {
      const seña = Math.round((quoted * 0.4) / 10000) * 10000
      payments.push({ id: `pay${i}s`, date: approvedAt, amount: seña, method: 'efectivo' as PaymentMethod, note: 'Seña para compra del repuesto' })
      events.push(ev(approvedAt, 'pago', `Seña de ₲ ${seña.toLocaleString('es-PY')} para cubrir el repuesto.`, 'Belén Ramírez'))
    }

    if (chance(0.18)) {
      events.push(ev(plusHours(receivedAt, int(4, 40)), 'nota', pick([
        'El cliente pidió que le guardemos el repuesto viejo.',
        'Se avisó al cliente que el equipo tiene humedad previa; acepta el riesgo.',
        'Cliente pide factura a nombre de la empresa.',
        'Equipo ingresó sin cargador ni funda.',
        'El cliente pregunta si conviene reparar o cambiar el equipo.',
      ]), 'Julio Sanabria'))
    }

    orders.push({
      id: `or${i + 1}`,
      code: `OS-${++seq}`,
      customerId: customer.id,
      device: {
        type: deviceType,
        brand: device.brand,
        model: device.model,
        serial: deviceType === 'celular'
          ? `35${int(1000000, 9999999)}${int(10000, 99999)}`
          : `SN${int(100000, 999999)}${String.fromCharCode(65 + int(0, 25))}`,
        color: pick(['Negro', 'Azul', 'Gris', 'Blanco', 'Verde', 'Plateado']),
        accessories: shuffle(['Cargador', 'Funda', 'Caja', 'Cable', 'Mochila']).slice(0, int(0, 2)),
        unlock: deviceType === 'celular' && chance(0.6) ? pick(['PIN 1234', 'Patrón en L', 'Sin bloqueo', 'PIN 0000']) : undefined,
      },
      reportedIssue: tpl.issue,
      diagnosis: status === 'recibido' ? undefined : tpl.diagnosis,
      workDone: wasRepaired && status !== 'reparacion' ? tpl.work : undefined,
      checklist: checklistFor(deviceType),
      status,
      priority,
      technicianId: status === 'recibido' ? undefined : tech.id,
      parts: tpl.part && hasQuote
        ? [{ name: tpl.part.name, qty: 1, cost: tpl.part.cost, price: tpl.part.price }]
        : [],
      labor: hasQuote ? tpl.labor : 0,
      quotedTotal: hasQuote ? quoted : 0,
      quoteSentAt: hasQuote ? plusHours(tDiag, 2) : undefined,
      approvedAt,
      payments,
      warrantyDays: BRAND_CONFIG.warrantyDays,
      receivedAt,
      promisedAt,
      deliveredAt,
      channel: weighted([['local', 6], ['whatsapp', 3], ['web', 2], ['instagram', 1]]),
      notes: chance(0.2) ? 'Avisar al cliente antes de las 12:00, después entra a trabajar.' : undefined,
      events: events.sort((a, b) => a.ts.localeCompare(b.ts)),
    })
  }

  return { orders: orders.sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)), lastSeq: seq }
}

/* ==========================================================================
   VENTAS DE MOSTRADOR
   ========================================================================== */
function buildSales(customers: Customer[], products: Product[], staff: Staff[]) {
  const sellers = staff.filter((s) => ['vendedor', 'admin', 'recepcion'].includes(s.role))
  const sellable = products.filter((p) => p.category !== 'repuesto')
  const sales: Sale[] = []
  let seq = 3200

  const TOTAL = 96
  for (let i = 0; i < TOTAL; i++) {
    const age = i < 6 ? 0 : i < 14 ? int(1, 3) : i < 40 ? int(4, 20) : int(21, 88)
    const date = at(age, workHour(), pick([5, 20, 35, 50]))
    const itemCount = weighted([['1', 62], ['2', 27], ['3', 11]])
    const chosen = shuffle(sellable).slice(0, Number(itemCount))

    const items = chosen.map((p) => {
      const qty = p.price < 200000 ? int(1, 3) : 1
      return { productId: p.id, name: p.name, qty, price: p.price, cost: p.cost }
    })
    const subtotal = items.reduce((a, it) => a + it.price * it.qty, 0)
    const discount = chance(0.22) ? Math.round((subtotal * (chance(0.6) ? 0.05 : 0.1)) / 5000) * 5000 : 0
    const total = subtotal - discount
    const method = weighted<PaymentMethod>(
      total > 2_000_000
        ? [['cuotas', 34], ['tarjeta', 26], ['transferencia', 24], ['efectivo', 16]]
        : [['efectivo', 44], ['qr', 20], ['transferencia', 20], ['tarjeta', 16]],
    )
    const customer = chance(0.62) ? pick(customers) : undefined
    const status = age <= 2 && chance(0.08) ? 'pendiente' : chance(0.02) ? 'anulada' : 'pagada'

    sales.push({
      id: `sa${i + 1}`,
      code: `V-${++seq}`,
      customerId: customer?.id,
      customerName: customer?.name ?? 'Consumidor final',
      items,
      discount,
      total,
      method,
      installments: method === 'cuotas' ? pick([3, 6, 10, 12]) : undefined,
      status: status as Sale['status'],
      sellerId: pick(sellers).id,
      date,
      channel: weighted([['local', 7], ['whatsapp', 2], ['web', 1]]),
      note: discount > 0 ? 'Descuento por pago en el momento.' : undefined,
    })
  }

  return { sales: sales.sort((a, b) => b.date.localeCompare(a.date)), lastSeq: seq }
}

/* ==========================================================================
   CAJA — se alimenta de órdenes entregadas, ventas y gastos fijos
   ========================================================================== */
function buildCash(orders: ServiceOrder[], sales: Sale[]): CashMovement[] {
  const cash: CashMovement[] = []
  let n = 0

  orders.forEach((o) => {
    o.payments.forEach((p) => {
      cash.push({
        id: `cm${++n}`,
        date: p.date,
        kind: 'ingreso',
        concept: `${o.code} — ${o.device.brand} ${o.device.model}`,
        category: 'servicio',
        amount: p.amount,
        method: p.method,
        refType: 'orden',
        refId: o.id,
      })
    })
  })

  sales.filter((s) => s.status === 'pagada').forEach((s) => {
    cash.push({
      id: `cm${++n}`,
      date: s.date,
      kind: 'ingreso',
      concept: `${s.code} — ${s.items.length === 1 ? s.items[0].name : `${s.items.length} productos`}`,
      category: 'venta',
      amount: s.total,
      method: s.method,
      refType: 'venta',
      refId: s.id,
    })
  })

  // Gastos fijos de los últimos 3 meses
  for (let m = 0; m < 3; m++) {
    const base = m * 30
    cash.push({ id: `cm${++n}`, date: at(base + 5, 10), kind: 'egreso', concept: 'Alquiler del local', category: 'alquiler', amount: 3_800_000, method: 'transferencia', refType: 'manual' })
    cash.push({ id: `cm${++n}`, date: at(base + 3, 11), kind: 'egreso', concept: 'Sueldos del equipo', category: 'sueldos', amount: 14_200_000, method: 'transferencia', refType: 'manual' })
    cash.push({ id: `cm${++n}`, date: at(base + 7, 15), kind: 'egreso', concept: 'ANDE + internet + agua', category: 'servicios', amount: 1_150_000, method: 'transferencia', refType: 'manual' })
    cash.push({ id: `cm${++n}`, date: at(base + int(9, 20), 14), kind: 'egreso', concept: 'Compra de repuestos — proveedor Ciudad del Este', category: 'repuestos', amount: int(4_200_000, 8_600_000), method: 'transferencia', refType: 'manual' })
    if (m === 0) {
      cash.push({ id: `cm${++n}`, date: at(int(1, 12), 16), kind: 'egreso', concept: 'Reposición de mercadería — celulares', category: 'repuestos', amount: 12_400_000, method: 'transferencia', refType: 'manual' })
    }
  }

  return cash.sort((a, b) => b.date.localeCompare(a.date))
}

/* ==========================================================================
   SOLICITUDES ENTRANTES DE LA WEB
   ========================================================================== */
function buildRequests(products: Product[]): WebRequest[] {
  const featured = products.filter((p) => p.published)
  const list: Array<Partial<WebRequest> & { type: WebRequest['type'] }> = [
    { type: 'reparacion', name: 'Sandra Melgarejo', deviceLabel: 'Samsung Galaxy A34', issue: 'Se me cayó y la pantalla quedó con líneas de colores', preferredSlot: 'Mañana por la mañana', estimate: 590000, status: 'nueva' },
    { type: 'reparacion', name: 'Aldo Pereira', deviceLabel: 'Notebook HP Pavilion 15', issue: 'Se apaga sola cuando la uso más de media hora', preferredSlot: 'Hoy después de las 16:00', estimate: 190000, status: 'nueva' },
    { type: 'producto', name: 'Karen Godoy', productName: featured[0]?.name, issue: '¿Tienen en stock? ¿Hacen cuotas sin interés?', status: 'nueva' },
    { type: 'reparacion', name: 'Rubén Talavera', deviceLabel: 'iPhone 12', issue: 'La batería no me llega ni a la tarde', preferredSlot: 'Sábado a la mañana', estimate: 300000, status: 'contactado' },
    { type: 'consulta', name: 'Colegio San Miguel', issue: 'Necesitamos presupuesto de mantenimiento para 14 equipos de la sala de informática', status: 'contactado' },
    { type: 'producto', name: 'Matías Leguizamón', productName: featured[5]?.name, issue: 'Quiero saber si viene con Windows y Office instalado', status: 'agendada' },
    { type: 'reparacion', name: 'Andrea Coronel', deviceLabel: 'Xiaomi Redmi Note 12', issue: 'No carga, tengo que mover el cable', preferredSlot: 'Cualquier día a la tarde', estimate: 250000, status: 'convertida' },
    { type: 'reparacion', name: 'Enrique Samudio', deviceLabel: 'PC armada', issue: 'No arranca Windows, tira pantalla azul', status: 'convertida' },
    { type: 'consulta', name: 'Gloria Alderete', issue: '¿Compran celulares usados o toman en parte de pago?', status: 'descartada' },
  ]

  return list.map((r, i) => ({
    id: `wr${i + 1}`,
    type: r.type,
    name: r.name!,
    phone: phoneNumber(),
    deviceLabel: r.deviceLabel,
    issue: r.issue,
    productId: r.productName ? featured.find((p) => p.name === r.productName)?.id : undefined,
    productName: r.productName,
    preferredSlot: r.preferredSlot,
    status: (r.status ?? 'nueva') as WebRequest['status'],
    createdAt: at(i < 3 ? 0 : i < 6 ? int(1, 3) : int(4, 18), workHour(), int(0, 59)),
    source: (i % 3 === 1 ? 'instagram' : 'web') as Channel,
    estimate: r.estimate,
  })).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/* ==========================================================================
   NOTIFICACIONES — derivadas del estado real del negocio
   ========================================================================== */
function buildNotifications(orders: ServiceOrder[], products: Product[], requests: WebRequest[]): AppNotification[] {
  const out: AppNotification[] = []
  let n = 0

  products.filter((p) => p.stock <= p.minStock).slice(0, 3).forEach((p) => {
    out.push({
      id: `nt${++n}`, ts: at(0, int(8, 12), int(0, 59)), kind: 'stock',
      title: 'Stock bajo', text: `${p.name} — quedan ${p.stock} de ${p.minStock} mínimos.`,
      read: false, link: '/panel/inventario',
    })
  })

  requests.filter((r) => r.status === 'nueva').slice(0, 2).forEach((r) => {
    out.push({
      id: `nt${++n}`, ts: r.createdAt, kind: 'lead',
      title: 'Nueva solicitud desde la web',
      text: `${r.name} — ${r.deviceLabel ?? r.productName ?? 'Consulta general'}`,
      read: false, link: '/panel/solicitudes',
    })
  })

  const stalled = orders.filter((o) => o.status === 'listo' && Date.now() - new Date(o.promisedAt).getTime() > 5 * DAY).slice(0, 2)
  stalled.forEach((o) => {
    out.push({
      id: `nt${++n}`, ts: at(0, 9, 15), kind: 'orden',
      title: 'Equipo sin retirar', text: `${o.code} lleva varios días listo y el cliente no pasó a retirar.`,
      read: false, link: `/panel/ordenes/${o.id}`,
    })
  })

  const overdue = orders.filter((o) => !CLOSED.includes(o.status) && new Date(o.promisedAt).getTime() < Date.now()).slice(0, 2)
  overdue.forEach((o) => {
    out.push({
      id: `nt${++n}`, ts: at(0, 8, 30), kind: 'orden',
      title: 'Orden fuera de plazo', text: `${o.code} pasó la fecha prometida al cliente.`,
      read: true, link: `/panel/ordenes/${o.id}`,
    })
  })

  return out.sort((a, b) => b.ts.localeCompare(a.ts))
}

/* ==========================================================================
   ENSAMBLADO FINAL
   ========================================================================== */
export function createSeedDB(): DemoDB {
  const staff = buildStaff()
  const products = buildProducts()
  const services = buildServices()
  const customers = buildCustomers()
  const { orders, lastSeq } = buildOrders(customers, staff)
  const { sales, lastSeq: saleSeq } = buildSales(customers, products, staff)
  const cash = buildCash(orders, sales)
  const requests = buildRequests(products)
  const notifications = buildNotifications(orders, products, requests)

  return {
    version: DEMO_VERSION,
    seededAt: new Date().toISOString(),
    customers,
    orders,
    products,
    sales,
    staff,
    cash,
    requests,
    services,
    notifications,
    settings: {
      businessName: BRAND_CONFIG.name,
      warrantyDays: BRAND_CONFIG.warrantyDays,
      lowStockAlert: true,
      slaDays: 3,
      orderSeq: lastSeq,
      saleSeq,
    },
  }
}
