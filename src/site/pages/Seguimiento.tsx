import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  BadgeCheck, CalendarClock, CircleDashed, Cpu, MessageCircle, PackageSearch, Search, ShieldCheck,
} from 'lucide-react'
import { useDemo } from '@/demo/store'
import { DEVICE_LABEL, ORDER_STATUS, type OrderStatus, type ServiceOrder } from '@/demo/types'
import { balanceOf, paidOf, warrantyUntil } from '@/demo/metrics'
import { BRAND_CONFIG } from '@/config/brand'
import { dmy, longDate, money, relative } from '@/lib/format'
import { usePageMeta } from '@/lib/seo'
import { cn } from '@/lib/utils'
import { waLink, waMessages } from '@/lib/whatsapp'
import { Badge, Button, DemoTag, KeyValue } from '@/components/ui/primitives'
import { EmptyState } from '@/components/ui/data'
import { toneSoft } from '@/components/ui/tone'
import { PageHeader } from './shared'

/** Etapas que ve el cliente (versión simplificada del flujo interno) */
const PUBLIC_STEPS: Array<{ key: string; label: string; covers: OrderStatus[] }> = [
  { key: 'recibido', label: 'Recibido', covers: ['recibido'] },
  { key: 'diagnostico', label: 'En diagnóstico', covers: ['diagnostico'] },
  { key: 'presupuesto', label: 'Presupuesto', covers: ['presupuestado', 'aprobado'] },
  { key: 'reparacion', label: 'En reparación', covers: ['reparacion', 'espera_repuesto'] },
  { key: 'listo', label: 'Listo para retirar', covers: ['listo'] },
  { key: 'entregado', label: 'Entregado', covers: ['entregado'] },
]

function stepIndex(status: OrderStatus) {
  return PUBLIC_STEPS.findIndex((s) => s.covers.includes(status))
}

function maskPhone(phone: string) {
  const d = phone.replace(/\D/g, '')
  return d.length > 4 ? `${d.slice(0, 4)} ••• ${d.slice(-3)}` : phone
}

export function Seguimiento() {
  usePageMeta({
    title: 'Seguimiento de tu reparación',
    description:
      'Consultá el estado de tu reparación con el código de orden. Enterate si está en diagnóstico, en reparación o listo para retirar, sin llamar ni escribir.',
  })

  const [params, setParams] = useSearchParams()
  const { db, ready } = useDemo()
  const [code, setCode] = useState(params.get('codigo')?.toUpperCase() ?? '')
  const [searched, setSearched] = useState(Boolean(params.get('codigo')))

  useEffect(() => {
    const q = params.get('codigo')
    if (q) {
      setCode(q.toUpperCase())
      setSearched(true)
    }
  }, [params])

  const order = useMemo(() => {
    const clean = code.trim().toLowerCase()
    if (!clean) return undefined
    return db.orders.find(
      (o) => o.code.toLowerCase() === clean || o.code.toLowerCase().replace('os-', '') === clean,
    )
  }, [db.orders, code])

  const customer = db.customers.find((c) => c.id === order?.customerId)
  const technician = db.staff.find((s) => s.id === order?.technicianId)

  /* Códigos reales del set de demostración, para poder probar la función */
  const samples = useMemo(
    () =>
      db.orders
        .filter((o) => ['reparacion', 'listo', 'presupuestado', 'entregado'].includes(o.status))
        .slice(0, 3)
        .map((o) => o.code),
    [db.orders],
  )

  const search = (e: React.FormEvent) => {
    e.preventDefault()
    setSearched(true)
    setParams(code.trim() ? { codigo: code.trim() } : {}, { replace: true })
  }

  return (
    <>
      <PageHeader
        eyebrow="Seguimiento"
        title="¿Cómo va mi reparación?"
        description="Ingresá el código que te dimos al dejar el equipo y mirá exactamente en qué etapa está. Se actualiza en tiempo real, las 24 horas."
        breadcrumb={[{ label: 'Seguimiento' }]}
      />

      <section className="container-x -mt-8">
        {/* --------------------------------------------------------- Buscador */}
        <form onSubmit={search} className="rounded-[16px] border border-line bg-card p-5 shadow-[var(--shadow-sm)] sm:p-6">
          <label htmlFor="track-code" className="text-[13.5px] font-bold text-strong">
            Código de orden
          </label>
          <div className="mt-2.5 flex flex-col gap-2.5 sm:flex-row">
            <input
              id="track-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="OS-1042"
              autoComplete="off"
              className="h-12 min-w-0 flex-1 rounded-[12px] border border-line-strong bg-card px-4 text-[16px] font-semibold uppercase tracking-wide text-strong placeholder:font-normal placeholder:tracking-normal placeholder:text-dim/70 focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/14"
            />
            <Button type="submit" size="lg" icon={<Search size={16} />} className="sm:px-7">
              Consultar
            </Button>
          </div>

          {ready && samples.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
              <DemoTag />
              <span className="text-[12.5px] text-dim">Probá con estos códigos:</span>
              {samples.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setCode(s)
                    setSearched(true)
                    setParams({ codigo: s }, { replace: true })
                  }}
                  className="rounded-full border border-line-strong px-2.5 py-1 font-mono text-[12px] font-semibold text-brand transition-colors hover:border-brand hover:bg-brand/5"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </form>

        {/* --------------------------------------------------------- Resultado */}
        {searched && !order && (
          <div className="mt-6 rounded-[16px] border border-line bg-card">
            <EmptyState
              icon={<PackageSearch size={24} />}
              title="No encontramos esa orden"
              description="Revisá que el código esté completo (empieza con OS-). Si lo perdiste, escribinos por WhatsApp con tu nombre y te lo buscamos."
              action={
                <Button
                  variant="whatsapp"
                  href={waLink('Hola, perdí el código de mi orden. Mi nombre es: ')}
                  external
                  icon={<MessageCircle size={15} />}
                >
                  Pedir mi código
                </Button>
              }
            />
          </div>
        )}

        {order && <OrderTracking order={order} customerName={customer?.name} customerPhone={customer?.phone} technician={technician?.name} />}

        {!searched && (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { icon: <CircleDashed size={19} />, t: 'Sin llamar', d: 'Consultá cuando quieras, incluso fuera del horario del local.' },
              { icon: <CalendarClock size={19} />, t: 'Fecha estimada', d: 'Vas a ver el plazo que te prometimos y si estamos en tiempo.' },
              { icon: <ShieldCheck size={19} />, t: 'Historial completo', d: 'Cada movimiento del equipo queda registrado con fecha y hora.' },
            ].map((f) => (
              <div key={f.t} className="rounded-[15px] border border-line bg-card p-5">
                <span className="flex size-10 items-center justify-center rounded-[11px]" style={toneSoft('blue', 11)}>
                  {f.icon}
                </span>
                <h2 className="mt-3.5 text-[14.5px] font-bold text-strong">{f.t}</h2>
                <p className="mt-1.5 text-[13px] leading-relaxed text-dim">{f.d}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

/* ========================================================================== */
function OrderTracking({
  order, customerName, customerPhone, technician,
}: {
  order: ServiceOrder
  customerName?: string
  customerPhone?: string
  technician?: string
}) {
  const meta = ORDER_STATUS[order.status]
  const current = stepIndex(order.status)
  const rejected = order.status === 'rechazado' || order.status === 'no_reparable'
  const balance = balanceOf(order)
  const paid = paidOf(order)
  const warranty = warrantyUntil(order)

  return (
    <div className="anim-fade-up mt-6 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
      <div className="flex flex-col gap-5">
        {/* Estado actual */}
        <div className="rounded-[16px] border border-line bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[12.5px] font-bold uppercase tracking-wider text-dim">
                {order.code}
              </p>
              <h2 className="mt-1.5 text-[22px] font-extrabold leading-tight text-strong">
                {order.device.brand} {order.device.model}
              </h2>
              <p className="mt-1 text-[13.5px] text-dim">
                {DEVICE_LABEL[order.device.type]}
                {order.device.color && ` · ${order.device.color}`}
                {customerName && ` · ${customerName.split(' ')[0]}`}
                {customerPhone && ` · ${maskPhone(customerPhone)}`}
              </p>
            </div>
            <Badge tone={meta.tone} dot className="!px-3 !py-1.5 !text-[12.5px]">
              {meta.label}
            </Badge>
          </div>

          <p className="mt-4 rounded-[11px] p-3.5 text-[13.5px] leading-relaxed" style={toneSoft(meta.tone, 8)}>
            {meta.help}
          </p>

          {/* Línea de etapas */}
          {!rejected && (
            <ol className="mt-7 flex flex-col gap-0 sm:flex-row sm:gap-1">
              {PUBLIC_STEPS.map((s, i) => {
                const done = i < current
                const active = i === current
                return (
                  <li key={s.key} className="flex flex-1 gap-3 sm:flex-col sm:gap-2">
                    <div className="flex flex-col items-center sm:flex-row sm:items-center sm:gap-1.5">
                      <span
                        className={cn(
                          'flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-colors',
                          done && 'border-accent bg-accent text-white',
                          active && 'border-brand bg-brand text-white',
                          !done && !active && 'border-line-strong bg-card text-dim',
                        )}
                      >
                        {done ? <BadgeCheck size={13} /> : i + 1}
                      </span>
                      <span
                        className={cn(
                          'h-full w-0.5 flex-1 sm:h-0.5 sm:w-full',
                          i === PUBLIC_STEPS.length - 1 && 'hidden',
                          done ? 'bg-accent' : 'bg-line-strong',
                        )}
                        aria-hidden
                      />
                    </div>
                    <p
                      className={cn(
                        'pb-4 text-[12.5px] font-semibold leading-tight sm:pb-0',
                        active ? 'text-strong' : done ? 'text-body' : 'text-dim',
                      )}
                    >
                      {s.label}
                    </p>
                  </li>
                )
              })}
            </ol>
          )}

          <dl className="mt-6 grid gap-x-6 border-t border-line pt-2 sm:grid-cols-2">
            <KeyValue label="Ingresó" value={`${dmy(order.receivedAt)} · ${relative(order.receivedAt)}`} />
            <KeyValue
              label={order.deliveredAt ? 'Entregado' : 'Entrega estimada'}
              value={dmy(order.deliveredAt ?? order.promisedAt)}
            />
            <KeyValue label="Falla reportada" value={order.reportedIssue} />
            {technician && <KeyValue label="Técnico asignado" value={technician} />}
            {warranty && (
              <KeyValue
                label="Garantía"
                value={
                  warranty.getTime() > Date.now()
                    ? `Vigente hasta el ${dmy(warranty)}`
                    : `Vencida el ${dmy(warranty)}`
                }
              />
            )}
          </dl>
        </div>

        {/* Historial */}
        <div className="rounded-[16px] border border-line bg-card p-5 sm:p-6">
          <h3 className="text-[15px] font-bold text-strong">Historial del equipo</h3>
          <p className="mt-1 text-[13px] text-dim">Todo lo que pasó con tu equipo, con fecha y hora.</p>
          <ol className="mt-5 flex flex-col">
            {[...order.events].reverse().map((e, i, arr) => (
              <li key={e.id} className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      'mt-1 size-2.5 shrink-0 rounded-full',
                      i === 0 ? 'bg-brand ring-4 ring-brand/15' : 'bg-line-strong',
                    )}
                    aria-hidden
                  />
                  {i < arr.length - 1 && <span className="w-px flex-1 bg-line" aria-hidden />}
                </div>
                <div className="pb-5">
                  <p className="text-[13.5px] leading-snug text-body">{e.text}</p>
                  <p className="mt-1 text-[12px] text-dim">{longDate(e.ts)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* ------------------------------------------------------------- Aside */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-[16px] border border-line bg-card p-5">
          <h3 className="text-[15px] font-bold text-strong">Presupuesto</h3>

          {order.quotedTotal > 0 ? (
            <>
              <p className="mt-3 text-[27px] font-extrabold leading-none tracking-tight text-strong">
                {money(order.quotedTotal)}
              </p>
              <dl className="mt-4 divide-y divide-line border-t border-line pt-1">
                {order.parts.map((p) => (
                  <KeyValue key={p.name} label={`${p.name} ×${p.qty}`} value={money(p.price * p.qty)} />
                ))}
                {order.labor > 0 && <KeyValue label="Mano de obra" value={money(order.labor)} />}
                {paid > 0 && <KeyValue label="Pagado" value={money(paid)} />}
                {balance > 0 && order.status !== 'entregado' && (
                  <KeyValue label="Saldo a pagar" value={<span className="text-brand">{money(balance)}</span>} />
                )}
              </dl>

              {order.status === 'presupuestado' && (
                <div className="mt-4 rounded-[11px] border p-3.5" style={toneSoft('amber', 9)}>
                  <p className="text-[13px] font-semibold leading-snug text-strong">
                    Esperamos tu aprobación
                  </p>
                  <p className="mt-1 text-[12.5px] leading-relaxed">
                    No tocamos el equipo hasta que nos confirmes. Si no te sirve, te lo devolvemos sin cargo.
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="mt-3 text-[13.5px] leading-relaxed text-dim">
              Todavía estamos diagnosticando el equipo. Apenas tengamos el detalle te lo enviamos por WhatsApp
              y lo vas a ver acá.
            </p>
          )}

          <div className="mt-5 flex flex-col gap-2.5 border-t border-line pt-5">
            <Button
              variant={order.status === 'presupuestado' ? 'primary' : 'whatsapp'}
              block
              icon={<MessageCircle size={16} />}
              href={waLink(
                order.status === 'presupuestado'
                  ? `Hola, apruebo el presupuesto de la orden *${order.code}* (${money(order.quotedTotal)}). Pueden avanzar.`
                  : waMessages.order(order.code),
              )}
              external
            >
              {order.status === 'presupuestado' ? 'Aprobar por WhatsApp' : 'Consultar por esta orden'}
            </Button>
            <Button variant="secondary" block href={BRAND_CONFIG.mapsUrl} external icon={<Cpu size={15} />}>
              Ver ubicación del local
            </Button>
          </div>

          <p className="mt-4 text-[12px] leading-relaxed text-dim">
            Horario de retiro: {BRAND_CONFIG.hours[0].days} de {BRAND_CONFIG.hours[0].open} a{' '}
            {BRAND_CONFIG.hours[0].close}. Traé tu documento y el código de orden.
          </p>
        </div>
      </aside>
    </div>
  )
}
