import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ChevronRight, Flame } from 'lucide-react'
import {
  ORDER_STATUS, REQUEST_STATUS,
  type Channel, type OrderStatus, type ServiceOrder, type Tone, type WebRequest,
} from '@/demo/types'
import { daysSince, dmy, money, relative } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/primitives'
import { toneSoft } from '@/components/ui/tone'

export function StatusBadge({ status, dot = true }: { status: OrderStatus; dot?: boolean }) {
  const meta = ORDER_STATUS[status]
  return (
    <Badge tone={meta.tone} dot={dot}>
      {meta.short}
    </Badge>
  )
}

export function RequestBadge({ status }: { status: WebRequest['status'] }) {
  const meta = REQUEST_STATUS[status]
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  )
}

export const CHANNEL_LABEL: Record<Channel, string> = {
  local: 'Mostrador',
  web: 'Sitio web',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  telefono: 'Teléfono',
}

/** Marca visual de urgencia + atraso, lo primero que mira un encargado */
export function OrderFlags({ order }: { order: ServiceOrder }) {
  const overdue =
    !['entregado', 'rechazado', 'no_reparable', 'listo'].includes(order.status) &&
    new Date(order.promisedAt).getTime() < Date.now()
  if (!order.priority && !overdue) return null
  return (
    <span className="inline-flex items-center gap-1.5">
      {order.priority === 'urgente' && (
        <span title="Urgente" className="text-danger">
          <Flame size={13} />
        </span>
      )}
      {overdue && (
        <span title="Fuera del plazo prometido" className="text-warn">
          <AlertTriangle size={13} />
        </span>
      )}
    </span>
  )
}

/** Franja de alertas accionables en el dashboard */
export function AlertRow({
  tone, icon, title, detail, to, count,
}: {
  tone: Tone
  icon: ReactNode
  title: string
  detail: string
  to: string
  count: number
}) {
  if (count === 0) return null
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-[12px] border bg-card p-3.5 transition-all hover:-translate-y-px hover:shadow-[var(--shadow-sm)]"
      style={{ borderColor: `color-mix(in srgb, ${toneSoft(tone).borderColor}, transparent 0%)` }}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px]" style={toneSoft(tone, 13)}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-bold text-strong">
          {count} {title}
        </span>
        <span className="block truncate text-[12.5px] text-dim">{detail}</span>
      </span>
      <ChevronRight size={16} className="shrink-0 text-dim transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

/** Fila compacta de orden reutilizada en varias pantallas */
export function OrderLine({
  order, customerName, right,
}: {
  order: ServiceOrder
  customerName?: string
  right?: ReactNode
}) {
  return (
    <Link
      to={`/panel/ordenes/${order.id}`}
      className="flex items-center gap-3 rounded-[10px] px-2.5 py-2.5 transition-colors hover:bg-muted/70"
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-mono text-[12px] font-bold text-dim">{order.code}</span>
          <OrderFlags order={order} />
        </span>
        <span className="mt-0.5 block truncate text-[13.5px] font-semibold text-strong">
          {order.device.brand} {order.device.model}
        </span>
        <span className="block truncate text-[12px] text-dim">
          {customerName ?? 'Cliente'} · {relative(order.receivedAt)}
        </span>
      </span>
      {right ?? <StatusBadge status={order.status} />}
    </Link>
  )
}

/** Antigüedad del equipo en el taller, con color según gravedad */
export function AgeChip({ order }: { order: ServiceOrder }) {
  const days = daysSince(order.receivedAt)
  const tone: Tone = days >= 15 ? 'danger' : days >= 8 ? 'amber' : days >= 4 ? 'blue' : 'slate'
  return (
    <span
      className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11.5px] font-semibold tabular-nums"
      style={toneSoft(tone, 11)}
      title={`Ingresó el ${dmy(order.receivedAt)}`}
    >
      {days === 0 ? 'hoy' : `${days} d`}
    </span>
  )
}

export function MoneyCell({ value, muted }: { value: number; muted?: boolean }) {
  return (
    <span className={cn('font-semibold tabular-nums', muted ? 'text-dim' : 'text-strong')}>
      {money(value)}
    </span>
  )
}

/** Panel lateral de sección dentro de una pantalla del panel */
export function PanelCard({
  title, subtitle, action, children, className, bodyClassName,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={cn('rounded-[14px] border border-line bg-card', className)}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-[14.5px] font-bold text-strong">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[12.5px] text-dim">{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </section>
  )
}
