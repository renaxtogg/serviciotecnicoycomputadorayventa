/* ============================================================================
   MÉTRICAS DEL NEGOCIO
   Los KPIs que un dueño de servicio técnico realmente mira: cuánto entró hoy,
   qué equipos están trabados, qué presupuestos están sin respuesta, qué se
   está por quedar sin stock y cuánto deja realmente cada trabajo.
   ==========================================================================*/
import { daysSince, isSameMonth, isToday, isoDate } from '@/lib/format'
import { delta, sum } from '@/lib/utils'
import type { DemoDB, OrderStatus, ServiceOrder } from './types'
import { OPEN_STATUSES } from './types'

const DAY = 86_400_000

export function paidOf(order: ServiceOrder) {
  return sum(order.payments, (p) => p.amount)
}

export function balanceOf(order: ServiceOrder) {
  return Math.max(0, order.quotedTotal - paidOf(order))
}

export function partsCost(order: ServiceOrder) {
  return sum(order.parts, (p) => p.cost * p.qty)
}

/** Lo que realmente deja la reparación después de pagar los repuestos */
export function marginOf(order: ServiceOrder) {
  return order.quotedTotal - partsCost(order)
}

export function saleMargin(items: { price: number; cost: number; qty: number }[]) {
  return sum(items, (it) => (it.price - it.cost) * it.qty)
}

export function isOpen(o: ServiceOrder) {
  return OPEN_STATUSES.includes(o.status)
}

/** Órdenes que pasaron la fecha prometida al cliente y siguen abiertas */
export function isOverdue(o: ServiceOrder) {
  return isOpen(o) && o.status !== 'listo' && new Date(o.promisedAt).getTime() < Date.now()
}

/** Equipos terminados que el cliente todavía no vino a retirar */
export function isStalledPickup(o: ServiceOrder, days = 4) {
  if (o.status !== 'listo') return false
  const readyEvent = [...o.events].reverse().find((e) => e.type === 'aviso')
  const ref = readyEvent?.ts ?? o.promisedAt
  return Date.now() - new Date(ref).getTime() > days * DAY
}

export function warrantyUntil(o: ServiceOrder) {
  if (!o.deliveredAt) return null
  return new Date(new Date(o.deliveredAt).getTime() + o.warrantyDays * DAY)
}

export function warrantyActive(o: ServiceOrder) {
  const until = warrantyUntil(o)
  return until ? until.getTime() > Date.now() : false
}

/* ==========================================================================
   RESUMEN PARA EL DASHBOARD
   ========================================================================== */
export function buildDashboard(db: DemoDB) {
  const { orders, sales, products, cash, customers, requests } = db

  const paidSales = sales.filter((s) => s.status === 'pagada')

  /* --- Ingresos ---------------------------------------------------------- */
  const incomeToday = sum(
    cash.filter((c) => c.kind === 'ingreso' && isToday(c.date)),
    (c) => c.amount,
  )
  const incomeMonth = sum(
    cash.filter((c) => c.kind === 'ingreso' && isSameMonth(c.date)),
    (c) => c.amount,
  )
  const expenseMonth = sum(
    cash.filter((c) => c.kind === 'egreso' && isSameMonth(c.date)),
    (c) => c.amount,
  )

  const prevMonthRef = new Date()
  prevMonthRef.setMonth(prevMonthRef.getMonth() - 1)
  const incomePrevMonth = sum(
    cash.filter((c) => c.kind === 'ingreso' && isSameMonth(c.date, prevMonthRef)),
    (c) => c.amount,
  )

  const yesterday = new Date(Date.now() - DAY)
  const incomeYesterday = sum(
    cash.filter((c) => c.kind === 'ingreso' && isoDate(c.date) === isoDate(yesterday)),
    (c) => c.amount,
  )

  /* --- Taller ------------------------------------------------------------ */
  const open = orders.filter(isOpen)
  const ready = orders.filter((o) => o.status === 'listo')
  const overdue = orders.filter(isOverdue)
  const stalled = orders.filter((o) => isStalledPickup(o))
  const awaitingQuote = orders.filter((o) => o.status === 'presupuestado')
  const inRepair = orders.filter((o) => o.status === 'reparacion' || o.status === 'espera_repuesto')
  const receivedToday = orders.filter((o) => isToday(o.receivedAt))
  const deliveredToday = orders.filter((o) => o.deliveredAt && isToday(o.deliveredAt))

  /* --- Cobranzas --------------------------------------------------------- */
  const pendingCollection = sum(
    orders.filter((o) => isOpen(o) && o.quotedTotal > 0),
    balanceOf,
  )
  const quotedAtRisk = sum(awaitingQuote, (o) => o.quotedTotal)

  /* --- Inventario -------------------------------------------------------- */
  const lowStock = products.filter((p) => p.stock <= p.minStock)
  const outOfStock = products.filter((p) => p.stock === 0)
  const inventoryValue = sum(products, (p) => p.cost * p.stock)

  /* --- Ventas ------------------------------------------------------------ */
  const salesToday = paidSales.filter((s) => isToday(s.date))
  const salesMonth = paidSales.filter((s) => isSameMonth(s.date))
  const ticketAvg = salesMonth.length ? sum(salesMonth, (s) => s.total) / salesMonth.length : 0

  /* --- Clientes ---------------------------------------------------------- */
  const newCustomersMonth = customers.filter((c) => isSameMonth(c.createdAt))
  const newRequests = requests.filter((r) => r.status === 'nueva')

  /* --- Rentabilidad ------------------------------------------------------ */
  const serviceMarginMonth = sum(
    orders.filter((o) => o.deliveredAt && isSameMonth(o.deliveredAt)),
    marginOf,
  )
  const salesMarginMonth = sum(salesMonth, (s) => saleMargin(s.items) - s.discount)

  /* --- Aprobación de presupuestos ---------------------------------------- */
  const quotedHistoric = orders.filter((o) =>
    ['aprobado', 'reparacion', 'espera_repuesto', 'listo', 'entregado', 'rechazado'].includes(o.status),
  )
  const approvedHistoric = quotedHistoric.filter((o) => o.status !== 'rechazado')
  const approvalRate = quotedHistoric.length
    ? (approvedHistoric.length / quotedHistoric.length) * 100
    : 0

  /* --- Tiempo medio de reparación (órdenes entregadas) ------------------- */
  const closed = orders.filter((o) => o.deliveredAt)
  const avgTurnaround = closed.length
    ? sum(closed, (o) => (new Date(o.deliveredAt!).getTime() - new Date(o.receivedAt).getTime()) / DAY) /
      closed.length
    : 0

  return {
    incomeToday,
    incomeYesterday,
    incomeDeltaDay: delta(incomeToday, incomeYesterday),
    incomeMonth,
    incomePrevMonth,
    incomeDeltaMonth: delta(incomeMonth, incomePrevMonth),
    expenseMonth,
    resultMonth: incomeMonth - expenseMonth,

    open,
    ready,
    overdue,
    stalled,
    awaitingQuote,
    inRepair,
    receivedToday,
    deliveredToday,

    pendingCollection,
    quotedAtRisk,

    lowStock,
    outOfStock,
    inventoryValue,

    salesToday,
    salesMonth,
    ticketAvg,

    newCustomersMonth,
    newRequests,

    serviceMarginMonth,
    salesMarginMonth,
    approvalRate,
    avgTurnaround,
  }
}

/* ==========================================================================
   SERIES PARA GRÁFICOS
   ========================================================================== */
/** Ingresos por día de los últimos N días, separando servicio de venta */
export function incomeSeries(db: DemoDB, days = 14) {
  const buckets: Array<{ date: string; label: string; servicio: number; venta: number; total: number }> = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY)
    buckets.push({
      date: isoDate(d),
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      servicio: 0,
      venta: 0,
      total: 0,
    })
  }
  const index = new Map(buckets.map((b) => [b.date, b]))
  db.cash
    .filter((c) => c.kind === 'ingreso')
    .forEach((c) => {
      const b = index.get(isoDate(c.date))
      if (!b) return
      if (c.category === 'servicio') b.servicio += c.amount
      else b.venta += c.amount
      b.total += c.amount
    })
  return buckets
}

/** Cuántas órdenes hay en cada estado (para el tablero y el donut) */
export function statusBreakdown(db: DemoDB) {
  const counts = {} as Record<OrderStatus, number>
  db.orders.forEach((o) => {
    counts[o.status] = (counts[o.status] ?? 0) + 1
  })
  return counts
}

/** Fallas más frecuentes — dice al dueño en qué conviene especializarse */
export function topIssues(db: DemoDB, limit = 6) {
  const map = new Map<string, { label: string; count: number; income: number }>()
  db.orders.forEach((o) => {
    const key = o.reportedIssue.slice(0, 44)
    const entry = map.get(key) ?? { label: o.reportedIssue, count: 0, income: 0 }
    entry.count += 1
    entry.income += o.quotedTotal
    map.set(key, entry)
  })
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, limit)
}

/** Productos más vendidos del período */
export function topProducts(db: DemoDB, limit = 6) {
  const map = new Map<string, { name: string; qty: number; total: number; margin: number }>()
  db.sales
    .filter((s) => s.status === 'pagada' && isSameMonth(s.date))
    .forEach((s) =>
      s.items.forEach((it) => {
        const entry = map.get(it.productId) ?? { name: it.name, qty: 0, total: 0, margin: 0 }
        entry.qty += it.qty
        entry.total += it.price * it.qty
        entry.margin += (it.price - it.cost) * it.qty
        map.set(it.productId, entry)
      }),
    )
  return [...map.values()].sort((a, b) => b.total - a.total).slice(0, limit)
}

/** Carga y rendimiento por técnico */
export function technicianStats(db: DemoDB) {
  return db.staff
    .filter((s) => s.role === 'tecnico')
    .map((tech) => {
      const assigned = db.orders.filter((o) => o.technicianId === tech.id)
      const openOnes = assigned.filter(isOpen)
      const done = assigned.filter((o) => o.deliveredAt && isSameMonth(o.deliveredAt))
      const avgDays = done.length
        ? sum(done, (o) => (new Date(o.deliveredAt!).getTime() - new Date(o.receivedAt).getTime()) / DAY) /
          done.length
        : 0
      return {
        tech,
        openCount: openOnes.length,
        doneMonth: done.length,
        incomeMonth: sum(done, (o) => o.quotedTotal),
        marginMonth: sum(done, marginOf),
        avgDays,
        overdue: assigned.filter(isOverdue).length,
      }
    })
    .sort((a, b) => b.incomeMonth - a.incomeMonth)
}

/** Mix de ingresos del mes: servicio técnico vs venta de productos */
export function revenueMix(db: DemoDB) {
  const servicio = sum(
    db.cash.filter((c) => c.kind === 'ingreso' && c.category === 'servicio' && isSameMonth(c.date)),
    (c) => c.amount,
  )
  const venta = sum(
    db.cash.filter((c) => c.kind === 'ingreso' && c.category === 'venta' && isSameMonth(c.date)),
    (c) => c.amount,
  )
  return { servicio, venta, total: servicio + venta }
}

/** Antigüedad de los equipos que siguen en el taller */
export function agingBuckets(db: DemoDB) {
  const open = db.orders.filter(isOpen)
  const buckets = [
    { label: 'Hoy', min: 0, max: 0, count: 0 },
    { label: '1–3 días', min: 1, max: 3, count: 0 },
    { label: '4–7 días', min: 4, max: 7, count: 0 },
    { label: '8–15 días', min: 8, max: 15, count: 0 },
    { label: '+15 días', min: 16, max: Infinity, count: 0 },
  ]
  open.forEach((o) => {
    const age = daysSince(o.receivedAt)
    const b = buckets.find((x) => age >= x.min && age <= x.max)
    if (b) b.count += 1
  })
  return buckets
}
