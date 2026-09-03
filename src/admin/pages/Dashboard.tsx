import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, ArrowRight, Banknote, CalendarClock, ClipboardList, Inbox, PackageX,
  Plus, ShoppingCart, Timer, Wallet, Wrench,
} from 'lucide-react'
import { useDemo } from '@/demo/store'
import {
  agingBuckets, buildDashboard, incomeSeries, revenueMix, topIssues, topProducts,
} from '@/demo/metrics'
import { ORDER_STATUS, type OrderStatus } from '@/demo/types'
import { dmy, hm, isToday, money, num, relative } from '@/lib/format'
import { sortBy } from '@/lib/utils'
import { Badge, Button } from '@/components/ui/primitives'
import { EmptyState, ProgressBar, StatCard } from '@/components/ui/data'
import { CHART_SERIES, ChartFrame, HBarChart, ShareBar, StackedBarChart } from '@/components/ui/charts'
import { TONE_VAR } from '@/components/ui/tone'
import { PanelHeader } from '../AdminLayout'
import { AgeChip, AlertRow, OrderLine, PanelCard, StatusBadge } from '../shared'

export function Dashboard() {
  const { db } = useDemo()
  const k = useMemo(() => buildDashboard(db), [db])
  const series = useMemo(() => incomeSeries(db, 14), [db])
  const mix = useMemo(() => revenueMix(db), [db])
  const aging = useMemo(() => agingBuckets(db), [db])
  const issues = useMemo(() => topIssues(db, 5), [db])
  const products = useMemo(() => topProducts(db, 5), [db])

  const nameOf = (id: string) => db.customers.find((c) => c.id === id)?.name

  /** Cola de trabajo del día: lo que realmente hay que resolver */
  const attention = useMemo(() => {
    const list = [
      ...k.overdue.map((o) => ({ o, why: 'Fuera de plazo' as const, weight: 0 })),
      ...k.awaitingQuote.map((o) => ({ o, why: 'Sin respuesta del cliente' as const, weight: 1 })),
      ...k.stalled.map((o) => ({ o, why: 'Listo sin retirar' as const, weight: 2 })),
    ]
    const seen = new Set<string>()
    return sortBy(list, (x) => x.weight).filter((x) => {
      if (seen.has(x.o.id)) return false
      seen.add(x.o.id)
      return true
    }).slice(0, 7)
  }, [k])

  /** Entregas comprometidas para hoy */
  const dueToday = useMemo(
    () =>
      sortBy(
        db.orders.filter((o) => k.open.includes(o) && isToday(o.promisedAt)),
        (o) => o.promisedAt,
      ),
    [db.orders, k.open],
  )

  const statusCounts = useMemo(() => {
    const counts: Array<{ status: OrderStatus; count: number }> = []
    ;(['recibido', 'diagnostico', 'presupuestado', 'aprobado', 'reparacion', 'espera_repuesto', 'listo'] as OrderStatus[])
      .forEach((s) => counts.push({ status: s, count: db.orders.filter((o) => o.status === s).length }))
    return counts
  }, [db.orders])

  const maxAging = Math.max(...aging.map((a) => a.count), 1)

  return (
    <>
      <PanelHeader
        title="Resumen del negocio"
        description="Todo lo que está pasando hoy en el taller y en el mostrador, en una sola pantalla."
        actions={
          <>
            <Button variant="secondary" size="sm" to="/panel/ordenes?nueva=1" icon={<Plus size={15} />}>
              Nueva orden
            </Button>
            <Button size="sm" to="/panel/pos" icon={<ShoppingCart size={15} />}>
              Nueva venta
            </Button>
          </>
        }
      />

      {/* ------------------------------------------------------- ALERTAS */}
      {(k.overdue.length > 0 || k.newRequests.length > 0 || k.lowStock.length > 0 || k.stalled.length > 0) && (
        <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Requiere atención">
          <AlertRow
            tone="danger"
            icon={<AlertTriangle size={17} />}
            count={k.overdue.length}
            title={k.overdue.length === 1 ? 'orden fuera de plazo' : 'órdenes fuera de plazo'}
            detail="Pasaron la fecha prometida al cliente"
            to="/panel/ordenes?filtro=atrasadas"
          />
          <AlertRow
            tone="blue"
            icon={<Inbox size={17} />}
            count={k.newRequests.length}
            title={k.newRequests.length === 1 ? 'solicitud sin responder' : 'solicitudes sin responder'}
            detail="Llegaron desde el sitio web"
            to="/panel/solicitudes"
          />
          <AlertRow
            tone="amber"
            icon={<PackageX size={17} />}
            count={k.lowStock.length}
            title={k.lowStock.length === 1 ? 'producto con stock bajo' : 'productos con stock bajo'}
            detail="Están en el mínimo o por debajo"
            to="/panel/inventario?filtro=bajo"
          />
          <AlertRow
            tone="navy"
            icon={<Timer size={17} />}
            count={k.stalled.length}
            title={k.stalled.length === 1 ? 'equipo sin retirar' : 'equipos sin retirar'}
            detail="Listos hace más de 4 días"
            to="/panel/ordenes?filtro=listos"
          />
        </section>
      )}

      {/* ----------------------------------------------------------- KPIs */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" aria-label="Indicadores">
        <StatCard
          label="Ingresos de hoy"
          value={money(k.incomeToday, { compact: true })}
          icon={<Banknote size={16} />}
          tone="mint"
          delta={k.incomeDeltaDay}
          hint="vs. ayer"
        />
        <StatCard
          label="Ingresos del mes"
          value={money(k.incomeMonth, { compact: true })}
          icon={<Wallet size={16} />}
          tone="blue"
          delta={k.incomeDeltaMonth}
          hint="vs. mes anterior"
        />
        <StatCard
          label="Equipos en el taller"
          value={num(k.open.length)}
          icon={<Wrench size={16} />}
          tone="navy"
          hint={`${k.receivedToday.length} ingresaron hoy`}
        />
        <StatCard
          label="Listos para retirar"
          value={num(k.ready.length)}
          icon={<ClipboardList size={16} />}
          tone="mint"
          hint={k.stalled.length > 0 ? `${k.stalled.length} demorados` : 'Al día'}
          alert={k.stalled.length > 0}
        />
        <StatCard
          label="Presupuestos sin respuesta"
          value={num(k.awaitingQuote.length)}
          icon={<CalendarClock size={16} />}
          tone="amber"
          hint={`${money(k.quotedAtRisk, { compact: true })} en juego`}
          alert={k.awaitingQuote.length > 3}
        />
        <StatCard
          label="Por cobrar"
          value={money(k.pendingCollection, { compact: true })}
          icon={<Banknote size={16} />}
          tone="blue"
          hint="Saldos de órdenes abiertas"
        />
      </section>

      {/* --------------------------------------------------------- GRÁFICOS */}
      <section className="mt-5 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <ChartFrame
          title="Ingresos de los últimos 14 días"
          subtitle="Separando lo que entra por servicio técnico de lo que entra por venta de productos"
          legend={[
            { label: 'Servicio técnico', color: CHART_SERIES[0] },
            { label: 'Venta de productos', color: CHART_SERIES[1] },
          ]}
          table={
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-line text-left text-dim">
                  <th className="py-2 pr-3 font-semibold">Día</th>
                  <th className="py-2 pr-3 text-right font-semibold">Servicio</th>
                  <th className="py-2 pr-3 text-right font-semibold">Venta</th>
                  <th className="py-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {series.map((d) => (
                  <tr key={d.date} className="border-b border-line/60">
                    <td className="py-1.5 pr-3">{d.label}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{money(d.servicio)}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{money(d.venta)}</td>
                    <td className="py-1.5 text-right font-semibold tabular-nums">{money(d.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        >
          <StackedBarChart
            data={series.map((d) => ({ label: d.label, a: d.servicio, b: d.venta }))}
            labels={['Servicio', 'Venta']}
          />
        </ChartFrame>

        <div className="flex flex-col gap-4">
          <ChartFrame
            title="De dónde viene la plata este mes"
            subtitle="Mix de ingresos por tipo"
          >
            <ShareBar
              total={mix.total}
              segments={[
                { label: 'Servicio técnico', value: mix.servicio, color: CHART_SERIES[0] },
                { label: 'Venta de productos', value: mix.venta, color: CHART_SERIES[1] },
              ]}
            />
            <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4">
              <div>
                <dt className="text-[11.5px] font-semibold uppercase tracking-wide text-dim">Margen servicio</dt>
                <dd className="mt-0.5 text-[16px] font-extrabold tabular-nums text-strong">
                  {money(k.serviceMarginMonth, { compact: true })}
                </dd>
              </div>
              <div>
                <dt className="text-[11.5px] font-semibold uppercase tracking-wide text-dim">Margen venta</dt>
                <dd className="mt-0.5 text-[16px] font-extrabold tabular-nums text-strong">
                  {money(k.salesMarginMonth, { compact: true })}
                </dd>
              </div>
            </dl>
          </ChartFrame>

          <PanelCard title="Estado del taller" subtitle={`${k.open.length} equipos en proceso`}>
            <ul className="flex flex-col gap-2.5">
              {statusCounts.map(({ status, count }) => (
                <li key={status}>
                  <Link
                    to={`/panel/ordenes?estado=${status}`}
                    className="flex items-center gap-3 rounded-lg px-1 py-1 transition-colors hover:bg-muted/60"
                  >
                    <span className="w-[132px] shrink-0 text-[12.5px] font-medium text-body">
                      {ORDER_STATUS[status].label}
                    </span>
                    <span className="flex-1">
                      <ProgressBar
                        value={count}
                        max={Math.max(...statusCounts.map((s) => s.count), 1)}
                        tone={ORDER_STATUS[status].tone}
                        height={7}
                      />
                    </span>
                    <span className="w-6 shrink-0 text-right text-[12.5px] font-bold tabular-nums text-strong">
                      {count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </PanelCard>
        </div>
      </section>

      {/* ------------------------------------------------- TRABAJO DEL DÍA */}
      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <PanelCard
          title="Requiere atención"
          subtitle="Lo que se traba y hace perder clientes o plata"
          action={
            <Link to="/panel/ordenes" className="text-[12.5px] font-semibold text-brand hover:underline">
              Ver taller
            </Link>
          }
          bodyClassName="p-2"
        >
          {attention.length === 0 ? (
            <EmptyState
              compact
              title="Todo en orden"
              description="No hay órdenes atrasadas, presupuestos sin respuesta ni equipos demorados."
            />
          ) : (
            <ul className="flex flex-col">
              {attention.map(({ o, why }) => (
                <li key={o.id}>
                  <OrderLine
                    order={o}
                    customerName={nameOf(o.customerId)}
                    right={
                      <span className="flex shrink-0 items-center gap-2">
                        <Badge tone={why === 'Fuera de plazo' ? 'danger' : why === 'Listo sin retirar' ? 'navy' : 'amber'}>
                          {why}
                        </Badge>
                        <AgeChip order={o} />
                      </span>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </PanelCard>

        <PanelCard
          title="Entregas prometidas para hoy"
          subtitle={dmy(new Date())}
          bodyClassName="p-2"
        >
          {dueToday.length === 0 ? (
            <EmptyState
              compact
              title="Sin entregas comprometidas hoy"
              description="Ninguna orden abierta vence en el día de hoy."
            />
          ) : (
            <ul className="flex flex-col">
              {dueToday.map((o) => (
                <li key={o.id}>
                  <OrderLine
                    order={o}
                    customerName={nameOf(o.customerId)}
                    right={
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="text-[12px] font-semibold tabular-nums text-dim">
                          {hm(o.promisedAt)}
                        </span>
                        <StatusBadge status={o.status} />
                      </span>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </PanelCard>
      </section>

      {/* ------------------------------------------------------- ANÁLISIS */}
      <section className="mt-5 grid gap-4 lg:grid-cols-3">
        <ChartFrame title="Fallas más frecuentes" subtitle="Sobre el total histórico de órdenes">
          <HBarChart
            data={issues.map((i) => ({
              label: i.label.length > 42 ? `${i.label.slice(0, 42)}…` : i.label,
              value: i.count,
              meta: 'órdenes',
            }))}
            formatter={(n) => String(n)}
          />
        </ChartFrame>

        <ChartFrame
          title="Productos más vendidos"
          subtitle="Facturación del mes en curso"
          action={
            <Link to="/panel/inventario" className="text-[12.5px] font-semibold text-brand hover:underline">
              Inventario
            </Link>
          }
        >
          <HBarChart
            data={products.map((p) => ({
              label: p.name.length > 34 ? `${p.name.slice(0, 34)}…` : p.name,
              value: p.total,
              meta: `${p.qty} u.`,
            }))}
            tone={CHART_SERIES[1]}
            emptyLabel="Todavía no hubo ventas este mes."
          />
        </ChartFrame>

        <PanelCard
          title="Antigüedad en el taller"
          subtitle="Cuánto hace que están los equipos abiertos"
        >
          <ul className="flex flex-col gap-3.5">
            {aging.map((b) => (
              <li key={b.label}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-[13px] font-medium text-strong">{b.label}</span>
                  <span className="text-[12.5px] font-bold tabular-nums text-strong">{b.count}</span>
                </div>
                <div className="h-[7px] w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-[width] duration-700"
                    style={{
                      width: `${Math.max(2, (b.count / maxAging) * 100)}%`,
                      background: b.label === '+15 días' ? TONE_VAR.danger : b.label === '8–15 días' ? TONE_VAR.amber : 'var(--chart-1)',
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-line pt-3.5 text-[12.5px] leading-relaxed text-dim">
            Los equipos de más de 15 días ocupan lugar y suelen terminar abandonados. Conviene llamar al
            cliente antes de que pase el mes.
          </p>
        </PanelCard>
      </section>

      {/* ------------------------------------------------- ÚLTIMOS MOVIMIENTOS */}
      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <PanelCard
          title="Últimas ventas"
          action={
            <Link to="/panel/ventas" className="text-[12.5px] font-semibold text-brand hover:underline">
              Ver todas
            </Link>
          }
          bodyClassName="p-2"
        >
          <ul className="flex flex-col">
            {db.sales.slice(0, 6).map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-2.5 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="font-mono text-[12px] font-bold text-dim">{s.code}</span>
                  <span className="mt-0.5 block truncate text-[13.5px] font-semibold text-strong">
                    {s.items.length === 1 ? s.items[0].name : `${s.items.length} productos`}
                  </span>
                  <span className="block truncate text-[12px] text-dim">
                    {s.customerName} · {relative(s.date)}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[13.5px] font-bold tabular-nums text-strong">{money(s.total)}</span>
                  {s.status !== 'pagada' && (
                    <Badge tone={s.status === 'anulada' ? 'danger' : 'amber'} className="mt-1">
                      {s.status === 'anulada' ? 'Anulada' : 'Pendiente'}
                    </Badge>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </PanelCard>

        <PanelCard
          title="Solicitudes desde la web"
          subtitle="Clientes que dejaron sus datos en el sitio"
          action={
            <Link to="/panel/solicitudes" className="text-[12.5px] font-semibold text-brand hover:underline">
              Ver bandeja
            </Link>
          }
          bodyClassName="p-2"
        >
          {db.requests.length === 0 ? (
            <EmptyState compact title="Sin solicitudes" description="Cuando alguien complete un formulario en la web, aparece acá." />
          ) : (
            <ul className="flex flex-col">
              {db.requests.slice(0, 6).map((r) => (
                <li key={r.id}>
                  <Link
                    to="/panel/solicitudes"
                    className="flex items-center gap-3 rounded-[10px] px-2.5 py-2.5 transition-colors hover:bg-muted/70"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold text-strong">{r.name}</span>
                      <span className="block truncate text-[12.5px] text-dim">
                        {r.deviceLabel ?? r.productName ?? 'Consulta general'} · {relative(r.createdAt)}
                      </span>
                    </span>
                    <Badge tone={r.status === 'nueva' ? 'blue' : r.status === 'convertida' ? 'mint' : 'slate'} dot>
                      {r.status === 'nueva' ? 'Nueva' : r.status === 'convertida' ? 'Convertida' : 'En curso'}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </PanelCard>
      </section>

      <p className="mt-6 flex flex-wrap items-center gap-2 text-[12.5px] text-dim">
        ¿Querés el detalle financiero completo?
        <Link to="/panel/reportes" className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
          Ir a reportes <ArrowRight size={13} />
        </Link>
      </p>
    </>
  )
}
