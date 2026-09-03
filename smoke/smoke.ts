/* Smoke test de la capa de datos y métricas (se ejecuta en Node, no se publica) */
import { createSeedDB } from '@/demo/seed'
import {
  agingBuckets, balanceOf, buildDashboard, incomeSeries, isOpen, isOverdue, marginOf, paidOf,
  revenueMix, technicianStats, topIssues, topProducts,
} from '@/demo/metrics'
import { ORDER_STATUS, OPEN_STATUSES } from '@/demo/types'
import { money, dmy, relative, daysSince } from '@/lib/format'

let failed = 0
function check(label: string, ok: boolean, extra?: unknown) {
  if (ok) {
    console.log(`  ok   ${label}`)
  } else {
    failed++
    console.log(`  FAIL ${label}`, extra ?? '')
  }
}
const finite = (n: number) => typeof n === 'number' && Number.isFinite(n)

const db = createSeedDB()

console.log()
console.log('[0] Volumen del set de datos')
console.log(
  `  ${db.customers.length} clientes (${db.customers.filter((c) => c.kind === 'empresa').length} empresas) · ` +
    `${db.orders.length} órdenes (${db.orders.filter(isOpen).length} abiertas) · ` +
    `${db.products.length} productos (${db.products.filter((p) => p.published).length} publicados en la web)`,
)
console.log(
  `  ${db.sales.length} ventas · ${db.cash.length} movimientos de caja · ${db.services.length} servicios · ` +
    `${db.staff.length} personas en el equipo · ${db.requests.length} solicitudes web`,
)

console.log('\n[1] Generación de datos')
check('clientes generados', db.customers.length >= 30, db.customers.length)
check('órdenes generadas', db.orders.length >= 40, db.orders.length)
check('productos generados', db.products.length >= 20, db.products.length)
check('ventas generadas', db.sales.length >= 50, db.sales.length)
check('movimientos de caja generados', db.cash.length >= 80, db.cash.length)
check('servicios generados', db.services.length >= 10, db.services.length)
check('equipo generado', db.staff.length >= 5, db.staff.length)
check('solicitudes web generadas', db.requests.length >= 5, db.requests.length)
check('notificaciones generadas', db.notifications.length >= 1, db.notifications.length)

console.log('\n[2] Integridad referencial')
const customerIds = new Set(db.customers.map((c) => c.id))
const productIds = new Set(db.products.map((p) => p.id))
const staffIds = new Set(db.staff.map((s) => s.id))
check('toda orden apunta a un cliente existente', db.orders.every((o) => customerIds.has(o.customerId)))
check('todo técnico asignado existe', db.orders.every((o) => !o.technicianId || staffIds.has(o.technicianId)))
check('todo item de venta apunta a un producto existente', db.sales.every((s) => s.items.every((i) => productIds.has(i.productId))))
check('todo vendedor existe', db.sales.every((s) => staffIds.has(s.sellerId)))
check('códigos de orden únicos', new Set(db.orders.map((o) => o.code)).size === db.orders.length)
check('códigos de venta únicos', new Set(db.sales.map((s) => s.code)).size === db.sales.length)
check('SKUs únicos', new Set(db.products.map((p) => p.sku)).size === db.products.length)

console.log('\n[3] Coherencia del negocio')
check('todos los estados son válidos', db.orders.every((o) => Boolean(ORDER_STATUS[o.status])))
check('fecha prometida posterior al ingreso', db.orders.every((o) => new Date(o.promisedAt) >= new Date(o.receivedAt)))
check('entregadas tienen fecha de entrega', db.orders.filter((o) => o.status === 'entregado').every((o) => Boolean(o.deliveredAt)))
check('entregadas quedan sin saldo', db.orders.filter((o) => o.status === 'entregado').every((o) => balanceOf(o) === 0))
check('sin cobros mayores al presupuesto', db.orders.every((o) => paidOf(o) <= o.quotedTotal + 1))
check('órdenes presupuestadas tienen total > 0', db.orders.filter((o) => o.status === 'presupuestado').every((o) => o.quotedTotal > 0))
check('recibidas no tienen presupuesto', db.orders.filter((o) => o.status === 'recibido').every((o) => o.quotedTotal === 0))
check('el margen nunca es negativo', db.orders.every((o) => marginOf(o) >= 0))
check('todas las órdenes tienen historial', db.orders.every((o) => o.events.length > 0))
check('historial ordenado cronológicamente', db.orders.every((o) => o.events.every((e, i, a) => i === 0 || a[i - 1].ts <= e.ts)))
check('stock nunca negativo', db.products.every((p) => p.stock >= 0))
check('precio de venta por encima del costo', db.products.filter((p) => p.price > 0).every((p) => p.price >= p.cost))
check('hay órdenes abiertas para mostrar el tablero', db.orders.filter(isOpen).length >= 5, db.orders.filter(isOpen).length)
check('hay al menos un equipo listo para retirar', db.orders.some((o) => o.status === 'listo'))
check('hay presupuestos esperando respuesta', db.orders.some((o) => o.status === 'presupuestado'))
check('todos los estados abiertos son conocidos', db.orders.filter(isOpen).every((o) => OPEN_STATUSES.includes(o.status)))

console.log('\n[4] Métricas del dashboard')
const k = buildDashboard(db)
const numericKeys = [
  'incomeToday', 'incomeMonth', 'incomeDeltaDay', 'incomeDeltaMonth', 'expenseMonth', 'resultMonth',
  'pendingCollection', 'quotedAtRisk', 'inventoryValue', 'ticketAvg', 'serviceMarginMonth',
  'salesMarginMonth', 'approvalRate', 'avgTurnaround',
] as const
numericKeys.forEach((key) => check(`KPI ${key} es un número finito`, finite(k[key] as number), k[key]))
check('ingresos del mes mayores a cero', k.incomeMonth > 0, k.incomeMonth)
check('tasa de aprobación entre 0 y 100', k.approvalRate >= 0 && k.approvalRate <= 100, k.approvalRate)
check('tiempo medio de reparación razonable', k.avgTurnaround > 0 && k.avgTurnaround < 60, k.avgTurnaround)
check('hay productos con stock bajo para la alerta', k.lowStock.length > 0, k.lowStock.length)
check('los atrasados son un subconjunto de los abiertos', k.overdue.every(isOverdue))

console.log('\n[5] Series y agregados de gráficos')
const series = incomeSeries(db, 14)
check('la serie tiene 14 días', series.length === 14)
check('todos los valores de la serie son finitos', series.every((d) => finite(d.servicio) && finite(d.venta) && finite(d.total)))
check('total = servicio + venta en cada día', series.every((d) => Math.abs(d.total - (d.servicio + d.venta)) < 1))
check('hay movimiento en la serie', series.some((d) => d.total > 0))

const mix = revenueMix(db)
check('mix de ingresos consistente', Math.abs(mix.total - (mix.servicio + mix.venta)) < 1)
check('mix con ambas fuentes activas', mix.servicio > 0 && mix.venta > 0, mix)

const issues = topIssues(db, 6)
check('top de fallas devuelve resultados', issues.length > 0 && issues.every((i) => i.count > 0))
const prods = topProducts(db, 6)
check('top de productos devuelve resultados', prods.length > 0 && prods.every((p) => finite(p.total)))
const techs = technicianStats(db)
check('estadísticas por técnico completas', techs.length >= 3 && techs.every((t) => finite(t.incomeMonth) && finite(t.avgDays)))
const aging = agingBuckets(db)
check('antigüedad cubre todas las órdenes abiertas', aging.reduce((a, b) => a + b.count, 0) === db.orders.filter(isOpen).length)

console.log('\n[6] Formateo')
check('moneda en guaraníes', money(1250000) === '₲ 1.250.000', money(1250000))
check('moneda compacta', money(4500000, { compact: true }).startsWith('₲ 4,5 M'), money(4500000, { compact: true }))
check('fecha dd/mm/aaaa', /^\d{2}\/\d{2}\/\d{4}$/.test(dmy(new Date())), dmy(new Date()))
check('tiempo relativo en español', relative(new Date(Date.now() - 7200000)).includes('hace'), relative(new Date(Date.now() - 7200000)))
check('días transcurridos', daysSince(new Date(Date.now() - 3 * 86400000)) === 3)

console.log('\n[7] Datos verosímiles (sin placeholders)')
const allText = JSON.stringify(db).toLowerCase()
check('sin "lorem ipsum"', !allText.includes('lorem'))
check('sin "cliente 1" / "producto 1"', !/cliente \d|producto \d|usuario \d/.test(allText))
check('teléfonos con formato paraguayo', db.customers.every((c) => /^09[0-9]{8}$/.test(c.phone)), db.customers[0]?.phone)
check('todos los clientes tienen nombre real', db.customers.every((c) => c.name.trim().split(' ').length >= 2))

console.log(`\n${failed === 0 ? 'TODAS LAS VERIFICACIONES PASARON' : `${failed} VERIFICACIONES FALLARON`}\n`)
if (failed > 0) process.exit(1)
