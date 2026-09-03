/* ============================================================================
   STORE DE LA DEMO
   Un único punto de verdad para el sitio público y el panel. Cada acción
   aplica las mismas reglas de negocio que aplicaría un sistema real:
   una venta descuenta stock y mueve caja, una entrega registra el cobro,
   un cambio de estado deja rastro en el historial.
   ==========================================================================*/
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { BRAND_CONFIG } from '@/config/brand'
import { uid } from '@/lib/utils'
import { loadDB, resetDB, saveDB } from './storage'
import type {
  AppNotification, CashMovement, Customer, DemoDB, OrderEvent, OrderStatus, PaymentMethod,
  Product, Sale, SaleItem, ServiceItem, ServiceOrder, Staff, WebRequest,
} from './types'
import { ORDER_STATUS } from './types'

interface DemoContextValue {
  db: DemoDB
  ready: boolean
  actions: ReturnType<typeof buildActions> & { resetDemo: () => void }
}

const DemoContext = createContext<DemoContextValue | null>(null)

const now = () => new Date().toISOString()

function event(type: OrderEvent['type'], text: string, by = 'Adrián Villamayor'): OrderEvent {
  return { id: uid('ev'), ts: now(), type, text, by }
}

function buildActions(setDB: (fn: (db: DemoDB) => DemoDB) => void) {
  const patch = <K extends keyof DemoDB>(key: K, value: (db: DemoDB) => DemoDB[K]) =>
    setDB((db) => ({ ...db, [key]: value(db) }))

  /* ---------------------------------------------------------------- CAJA */
  const pushCash = (db: DemoDB, mv: Omit<CashMovement, 'id'>): DemoDB => ({
    ...db,
    cash: [{ ...mv, id: uid('cm') }, ...db.cash],
  })

  const pushNotification = (db: DemoDB, n: Omit<AppNotification, 'id' | 'ts' | 'read'>): DemoDB => ({
    ...db,
    notifications: [{ ...n, id: uid('nt'), ts: now(), read: false }, ...db.notifications].slice(0, 40),
  })

  return {
    /* ================================================================ ÓRDENES */
    createOrder(input: {
      customerId: string
      device: ServiceOrder['device']
      reportedIssue: string
      priority: ServiceOrder['priority']
      technicianId?: string
      promisedAt: string
      channel: ServiceOrder['channel']
      checklist: ServiceOrder['checklist']
      notes?: string
    }) {
      let created: ServiceOrder | null = null
      setDB((db) => {
        const seq = db.settings.orderSeq + 1
        const order: ServiceOrder = {
          id: uid('or'),
          code: `OS-${seq}`,
          customerId: input.customerId,
          device: input.device,
          reportedIssue: input.reportedIssue,
          checklist: input.checklist,
          status: 'recibido',
          priority: input.priority,
          technicianId: input.technicianId,
          parts: [],
          labor: 0,
          quotedTotal: 0,
          payments: [],
          warrantyDays: db.settings.warrantyDays,
          receivedAt: now(),
          promisedAt: input.promisedAt,
          channel: input.channel,
          notes: input.notes,
          events: [event('creacion', `Equipo recibido en mostrador. Falla reportada: "${input.reportedIssue}".`)],
        }
        created = order
        return {
          ...db,
          orders: [order, ...db.orders],
          settings: { ...db.settings, orderSeq: seq },
        }
      })
      return created as ServiceOrder | null
    },

    updateOrder(id: string, changes: Partial<ServiceOrder>, note?: string) {
      patch('orders', (db) =>
        db.orders.map((o) =>
          o.id === id
            ? { ...o, ...changes, events: note ? [...o.events, event('nota', note)] : o.events }
            : o,
        ),
      )
    },

    setOrderStatus(id: string, status: OrderStatus, note?: string) {
      setDB((db) => {
        let next = db
        const orders = db.orders.map((o) => {
          if (o.id !== id) return o
          const events = [
            ...o.events,
            event('estado', note ?? `Estado actualizado a "${ORDER_STATUS[status].label}".`),
          ]
          const updated: ServiceOrder = { ...o, status, events }

          if (status === 'aprobado' && !o.approvedAt) updated.approvedAt = now()
          if (status === 'presupuestado') updated.quoteSentAt = now()

          // Entregar cierra el círculo: se cobra el saldo y entra a caja.
          if (status === 'entregado' && !o.deliveredAt) {
            updated.deliveredAt = now()
            const paid = o.payments.reduce((a, p) => a + p.amount, 0)
            const balance = Math.max(0, o.quotedTotal - paid)
            if (balance > 0) {
              updated.payments = [
                ...o.payments,
                { id: uid('pay'), date: now(), amount: balance, method: 'efectivo', note: 'Saldo al retirar' },
              ]
              updated.events.push(event('pago', `Cobro de saldo: ₲ ${balance.toLocaleString('es-PY')}.`))
              next = pushCash(next, {
                date: now(),
                kind: 'ingreso',
                concept: `${o.code} — ${o.device.brand} ${o.device.model}`,
                category: 'servicio',
                amount: balance,
                method: 'efectivo',
                refType: 'orden',
                refId: o.id,
              })
            }
          }

          if (status === 'listo') {
            updated.events.push(
              event('aviso', 'Se avisó al cliente que el equipo está listo para retirar.'),
            )
          }
          return updated
        })
        return { ...next, orders }
      })
    },

    addOrderPayment(id: string, amount: number, method: PaymentMethod, note?: string) {
      setDB((db) => {
        const order = db.orders.find((o) => o.id === id)
        if (!order) return db
        const withCash = pushCash(db, {
          date: now(),
          kind: 'ingreso',
          concept: `${order.code} — ${note ?? 'Pago parcial'}`,
          category: 'servicio',
          amount,
          method,
          refType: 'orden',
          refId: order.id,
        })
        return {
          ...withCash,
          orders: withCash.orders.map((o) =>
            o.id === id
              ? {
                  ...o,
                  payments: [...o.payments, { id: uid('pay'), date: now(), amount, method, note }],
                  events: [...o.events, event('pago', `Cobro de ₲ ${amount.toLocaleString('es-PY')} en ${method}.`)],
                }
              : o,
          ),
        }
      })
    },

    /** Guarda diagnóstico + repuestos + mano de obra y envía el presupuesto */
    saveQuote(id: string, data: { diagnosis: string; parts: ServiceOrder['parts']; labor: number; send: boolean }) {
      setDB((db) => ({
        ...db,
        orders: db.orders.map((o) => {
          if (o.id !== id) return o
          const total = data.labor + data.parts.reduce((a, p) => a + p.price * p.qty, 0)
          const events = [...o.events, event('presupuesto', `Presupuesto actualizado: ₲ ${total.toLocaleString('es-PY')}.`)]
          if (data.send) {
            events.push(event('aviso', 'Presupuesto enviado al cliente por WhatsApp.'))
          }
          return {
            ...o,
            diagnosis: data.diagnosis,
            parts: data.parts,
            labor: data.labor,
            quotedTotal: total,
            status: data.send ? 'presupuestado' : o.status,
            quoteSentAt: data.send ? now() : o.quoteSentAt,
            events,
          }
        }),
      }))
    },

    addOrderNote(id: string, text: string) {
      patch('orders', (db) =>
        db.orders.map((o) => (o.id === id ? { ...o, events: [...o.events, event('nota', text)] } : o)),
      )
    },

    assignTechnician(id: string, technicianId: string) {
      setDB((db) => {
        const tech = db.staff.find((s) => s.id === technicianId)
        return {
          ...db,
          orders: db.orders.map((o) =>
            o.id === id
              ? {
                  ...o,
                  technicianId,
                  events: [...o.events, event('nota', `Orden asignada a ${tech?.name ?? 'técnico'}.`)],
                }
              : o,
          ),
        }
      })
    },

    deleteOrder(id: string) {
      patch('orders', (db) => db.orders.filter((o) => o.id !== id))
    },

    /* ================================================================ CLIENTES */
    createCustomer(input: Omit<Customer, 'id' | 'createdAt'>) {
      const customer: Customer = { ...input, id: uid('cu'), createdAt: now() }
      patch('customers', (db) => [customer, ...db.customers])
      return customer
    },

    updateCustomer(id: string, changes: Partial<Customer>) {
      patch('customers', (db) => db.customers.map((c) => (c.id === id ? { ...c, ...changes } : c)))
    },

    deleteCustomer(id: string) {
      patch('customers', (db) => db.customers.filter((c) => c.id !== id))
    },

    /* ================================================================ PRODUCTOS */
    createProduct(input: Omit<Product, 'id' | 'createdAt'>) {
      const product: Product = { ...input, id: uid('pr'), createdAt: now() }
      patch('products', (db) => [product, ...db.products])
      return product
    },

    updateProduct(id: string, changes: Partial<Product>) {
      patch('products', (db) => db.products.map((p) => (p.id === id ? { ...p, ...changes } : p)))
    },

    deleteProduct(id: string) {
      patch('products', (db) => db.products.filter((p) => p.id !== id))
    },

    /** Ajuste manual de stock (ingreso de mercadería, merma, corrección) */
    adjustStock(id: string, deltaQty: number, reason: string) {
      setDB((db) => {
        const product = db.products.find((p) => p.id === id)
        if (!product) return db
        const next = {
          ...db,
          products: db.products.map((p) =>
            p.id === id ? { ...p, stock: Math.max(0, p.stock + deltaQty) } : p,
          ),
        }
        if (deltaQty > 0) {
          return pushCash(next, {
            date: now(),
            kind: 'egreso',
            concept: `Ingreso de mercadería — ${product.name} (${deltaQty} u.) · ${reason}`,
            category: 'repuestos',
            amount: product.cost * deltaQty,
            method: 'transferencia',
            refType: 'manual',
          })
        }
        return next
      })
    },

    /* ================================================================ VENTAS */
    createSale(input: {
      items: SaleItem[]
      customerId?: string
      customerName: string
      discount: number
      method: PaymentMethod
      installments?: number
      sellerId: string
      channel: Sale['channel']
      note?: string
    }) {
      let created: Sale | null = null
      setDB((db) => {
        const seq = db.settings.saleSeq + 1
        const subtotal = input.items.reduce((a, it) => a + it.price * it.qty, 0)
        const sale: Sale = {
          id: uid('sa'),
          code: `V-${seq}`,
          customerId: input.customerId,
          customerName: input.customerName,
          items: input.items,
          discount: input.discount,
          total: subtotal - input.discount,
          method: input.method,
          installments: input.installments,
          status: 'pagada',
          sellerId: input.sellerId,
          date: now(),
          channel: input.channel,
          note: input.note,
        }
        created = sale

        // Descuenta stock de cada producto vendido
        const products = db.products.map((p) => {
          const line = input.items.find((it) => it.productId === p.id)
          return line ? { ...p, stock: Math.max(0, p.stock - line.qty) } : p
        })

        let next: DemoDB = {
          ...db,
          products,
          sales: [sale, ...db.sales],
          settings: { ...db.settings, saleSeq: seq },
        }

        next = pushCash(next, {
          date: sale.date,
          kind: 'ingreso',
          concept: `${sale.code} — ${sale.items.length === 1 ? sale.items[0].name : `${sale.items.length} productos`}`,
          category: 'venta',
          amount: sale.total,
          method: sale.method,
          refType: 'venta',
          refId: sale.id,
        })

        // Alerta si alguna venta dejó un producto por debajo del mínimo
        const dropped = products.filter(
          (p) => input.items.some((it) => it.productId === p.id) && p.stock <= p.minStock,
        )
        dropped.forEach((p) => {
          next = pushNotification(next, {
            kind: 'stock',
            title: 'Stock bajo',
            text: `${p.name} — quedan ${p.stock} de ${p.minStock} mínimos.`,
            link: '/panel/inventario',
          })
        })

        return next
      })
      return created as Sale | null
    },

    voidSale(id: string) {
      setDB((db) => {
        const sale = db.sales.find((s) => s.id === id)
        if (!sale || sale.status === 'anulada') return db
        // Devuelve el stock y compensa la caja
        const products = db.products.map((p) => {
          const line = sale.items.find((it) => it.productId === p.id)
          return line ? { ...p, stock: p.stock + line.qty } : p
        })
        const next: DemoDB = {
          ...db,
          products,
          sales: db.sales.map((s) => (s.id === id ? { ...s, status: 'anulada' } : s)),
        }
        return pushCash(next, {
          date: now(),
          kind: 'egreso',
          concept: `Anulación de ${sale.code}`,
          category: 'venta',
          amount: sale.total,
          method: sale.method,
          refType: 'venta',
          refId: sale.id,
        })
      })
    },

    /* ================================================================ SOLICITUDES WEB */
    createRequest(input: Omit<WebRequest, 'id' | 'createdAt' | 'status'>) {
      const request: WebRequest = { ...input, id: uid('wr'), createdAt: now(), status: 'nueva' }
      setDB((db) =>
        pushNotification({ ...db, requests: [request, ...db.requests] }, {
          kind: 'lead',
          title: 'Nueva solicitud desde la web',
          text: `${request.name} — ${request.deviceLabel ?? request.productName ?? 'Consulta general'}`,
          link: '/panel/solicitudes',
        }),
      )
      return request
    },

    updateRequest(id: string, changes: Partial<WebRequest>) {
      patch('requests', (db) => db.requests.map((r) => (r.id === id ? { ...r, ...changes } : r)))
    },

    deleteRequest(id: string) {
      patch('requests', (db) => db.requests.filter((r) => r.id !== id))
    },

    /** Convierte una solicitud web en cliente + orden de servicio real */
    convertRequestToOrder(requestId: string) {
      let orderId: string | null = null
      setDB((db) => {
        const req = db.requests.find((r) => r.id === requestId)
        if (!req) return db

        let customer = db.customers.find((c) => c.phone === req.phone)
        let customers = db.customers
        if (!customer) {
          customer = {
            id: uid('cu'),
            name: req.name,
            phone: req.phone,
            kind: 'persona',
            createdAt: now(),
            channel: req.source,
          }
          customers = [customer, ...db.customers]
        }

        const seq = db.settings.orderSeq + 1
        const [brand, ...rest] = (req.deviceLabel ?? 'Equipo').split(' ')
        const promised = new Date()
        promised.setDate(promised.getDate() + 2)

        const order: ServiceOrder = {
          id: uid('or'),
          code: `OS-${seq}`,
          customerId: customer.id,
          device: {
            type: /note|laptop|pc/i.test(req.deviceLabel ?? '') ? 'notebook' : 'celular',
            brand,
            model: rest.join(' ') || '—',
            accessories: [],
          },
          reportedIssue: req.issue ?? 'Consulta desde el sitio web',
          checklist: [],
          status: 'recibido',
          priority: 'normal',
          parts: [],
          labor: 0,
          quotedTotal: 0,
          payments: [],
          warrantyDays: db.settings.warrantyDays,
          receivedAt: now(),
          promisedAt: promised.toISOString(),
          channel: req.source,
          events: [
            event('creacion', `Orden creada desde la solicitud web de ${req.name}.`),
            ...(req.estimate
              ? [event('nota', `Estimado mostrado en la web: ₲ ${req.estimate.toLocaleString('es-PY')}.`)]
              : []),
          ],
        }
        orderId = order.id

        return {
          ...db,
          customers,
          orders: [order, ...db.orders],
          requests: db.requests.map((r) => (r.id === requestId ? { ...r, status: 'convertida' } : r)),
          settings: { ...db.settings, orderSeq: seq },
        }
      })
      return orderId as string | null
    },

    /* ================================================================ SERVICIOS */
    createService(input: Omit<ServiceItem, 'id'>) {
      const service: ServiceItem = { ...input, id: uid('sv') }
      patch('services', (db) => [...db.services, service])
      return service
    },

    updateService(id: string, changes: Partial<ServiceItem>) {
      patch('services', (db) => db.services.map((s) => (s.id === id ? { ...s, ...changes } : s)))
    },

    deleteService(id: string) {
      patch('services', (db) => db.services.filter((s) => s.id !== id))
    },

    /* ================================================================ EQUIPO */
    createStaff(input: Omit<Staff, 'id'>) {
      const member: Staff = { ...input, id: uid('st') }
      patch('staff', (db) => [...db.staff, member])
      return member
    },

    updateStaff(id: string, changes: Partial<Staff>) {
      patch('staff', (db) => db.staff.map((s) => (s.id === id ? { ...s, ...changes } : s)))
    },

    deleteStaff(id: string) {
      patch('staff', (db) => db.staff.filter((s) => s.id !== id))
    },

    /* ================================================================ CAJA */
    addCashMovement(input: Omit<CashMovement, 'id'>) {
      setDB((db) => pushCash(db, input))
    },

    deleteCashMovement(id: string) {
      patch('cash', (db) => db.cash.filter((c) => c.id !== id))
    },

    /* ========================================================= NOTIFICACIONES */
    markNotificationRead(id: string) {
      patch('notifications', (db) =>
        db.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      )
    },

    markAllNotificationsRead() {
      patch('notifications', (db) => db.notifications.map((n) => ({ ...n, read: true })))
    },

    /* ============================================================ AJUSTES */
    updateSettings(changes: Partial<DemoDB['settings']>) {
      patch('settings', (db) => ({ ...db.settings, ...changes }))
    },
  }
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DemoDB | null>(null)
  const dirty = useRef(false)

  useEffect(() => {
    setDb(loadDB())
  }, [])

  // Persistencia: se guarda tras cada cambio, sin bloquear el render.
  useEffect(() => {
    if (!db || !dirty.current) return
    const t = window.setTimeout(() => saveDB(db), 120)
    return () => window.clearTimeout(t)
  }, [db])

  const setDB = useCallback((fn: (prev: DemoDB) => DemoDB) => {
    dirty.current = true
    setDb((prev) => (prev ? fn(prev) : prev))
  }, [])

  const actions = useMemo(() => {
    const base = buildActions(setDB)
    return {
      ...base,
      /** Restaurar datos de demostración */
      resetDemo() {
        dirty.current = false
        setDb(resetDB())
      },
    }
  }, [setDB])

  const value = useMemo<DemoContextValue>(
    () => ({ db: db ?? EMPTY_DB, ready: db !== null, actions }),
    [db, actions],
  )

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

const EMPTY_DB: DemoDB = {
  version: 0,
  seededAt: '',
  customers: [], orders: [], products: [], sales: [], staff: [],
  cash: [], requests: [], services: [], notifications: [],
  settings: {
    businessName: BRAND_CONFIG.name,
    warrantyDays: BRAND_CONFIG.warrantyDays,
    lowStockAlert: true,
    slaDays: 3,
    orderSeq: 1000,
    saleSeq: 3000,
  },
}

export function useDemo() {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemo debe usarse dentro de <DemoProvider>')
  return ctx
}

/* ---------------------------------------------------------------------------
   Selectores de conveniencia
   -------------------------------------------------------------------------*/
export function useLookup() {
  const { db } = useDemo()
  return useMemo(
    () => ({
      customer: (id?: string) => db.customers.find((c) => c.id === id),
      staff: (id?: string) => db.staff.find((s) => s.id === id),
      product: (id?: string) => db.products.find((p) => p.id === id),
      order: (id?: string) => db.orders.find((o) => o.id === id),
      orderByCode: (code: string) =>
        db.orders.find((o) => o.code.toLowerCase() === code.trim().toLowerCase()),
    }),
    [db],
  )
}
