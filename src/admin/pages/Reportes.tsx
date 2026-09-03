import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Percent, PiggyBank, Repeat } from 'lucide-react'
import { useDemo } from '@/demo/store'
import {
  agingBuckets, buildDashboard, incomeSeries, revenueMix, technicianStats, topIssues, topProducts,
} from '@/demo/metrics'
import { PAYMENT_LABEL, type Channel, type PaymentMethod } from '@/demo/types'
import { isSameMonth, money, num } from '@/lib/format'
import { sum } from '@/lib/utils'
import { StatCard } from '@/components/ui/data'
import { CHART_SERIES, ChartFrame, HBarChart, ShareBar, StackedBarChart } from '@/components/ui/charts'
import { PanelHeader } from '../AdminLayout'
import { CHANNEL_LABEL, PanelCard } from '../shared'

export function Reportes() {
  const { db } = useDemo()
  const k = useMemo(() => buildDashboard(db), [db])
  const mix = useMemo(() => revenueMix(db), [db])
  const series = useMemo(() => incomeSeries(db, 14), [db])
  const issues = useMemo(() => topIssues(db, 7), [db])
  const products = useMemo(() => topProducts(db, 7), [db])
  const techs = useMemo(() => technicianStats(db), [db])
  const aging = useMemo(() => agingBuckets(db), [db])

  /** Comparativa de los últimos 6 meses */
  const monthly = useMemo(() => {
    const out: Array<{ label: string; servicio: number; venta: number; egresos: number }> = []
    for (let i = 5; i >= 0; i--) {
      const ref = new Date()
      ref.setDate(1)
      ref.setMonth(ref.getMonth() - i)
      const rows = db.cash.filter((c) => isSameMonth(c.date, ref))
      out.push({
        label: ref.toLocaleDateString('es-PY', { month: 'short' }),
        servicio: sum(rows.filter((c) => c.kind === 'ingreso' && c.category === 'servicio'), (c) => c.amount),
        venta: sum(rows.filter((c) => c.kind === 'ingreso' && c.category === 'venta'), (c) => c.amount),
        egresos: sum(rows.filter((c) => c.kind === 'egreso'), (c) => c.amount),
      })
    }
    return out
  }, [db.cash])

  /** Cómo llegan los clientes: dice dónde conviene invertir en marketing */
  const byChannel = useMemo(() => {
    const map = new Map<Channel, number>()
    db.orders.forEach((o) => map.set(o.channel, (map.get(o.channel) ?? 0) + 1))
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [db.orders])

  const byPayment = useMemo(() => {
    const map = new Map<PaymentMethod, number>()
    db.cash
      .filter((c) => c.kind === 'ingreso' && isSameMonth(c.date))
      .forEach((c) => map.set(c.method, (map.get(c.method) ?? 0) + c.amount))
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [db.cash])

  const deliveredMonth = db.orders.filter((o) => o.deliveredAt && isSameMonth(o.deliveredAt))
  const serviceRevenueMonth = sum(deliveredMonth, (o) => o.quotedTotal)
  const serviceTicket = deliveredMonth.length ? serviceRevenueMonth / deliveredMonth.length : 0

  return (
    <>
      <PanelHeader
        title="Reportes"
        description="Los números que explican cómo está funcionando el negocio, no solo cuánto entró."
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Resultado del mes"
          value={money(k.resultMonth, { compact: true })}
          tone={k.resultMonth >= 0 ? 'mint' : 'danger'}
          icon={<PiggyBank size={16} />}
          hint={`${money(k.incomeMonth, { compact: true })} − ${money(k.expenseMonth, { compact: true })}`}
          alert={k.resultMonth < 0}
        />
        <StatCard
          label="Presupuestos aprobados"
          value={`${Math.round(k.approvalRate)}%`}
          tone="blue"
          icon={<Percent size={16} />}
          hint="De los que llegaron a presupuesto"
        />
        <StatCard
          label="Tiempo medio de reparación"
          value={`${k.avgTurnaround.toFixed(1)} días`}
          tone="navy"
          icon={<Clock size={16} />}
          hint="Desde el ingreso hasta la entrega"
        />
        <StatCard
          label="Ticket promedio de taller"
          value={money(serviceTicket, { compact: true })}
          tone="slate"
          icon={<Repeat size={16} />}
          hint={`${deliveredMonth.length} equipos entregados`}
        />
      </section>

      {/* -------------------------------------------------- Serie mensual */}
      <div className="mb-5 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <ChartFrame
          title="Últimos 6 meses"
          subtitle="Ingresos por servicio y por venta, mes a mes"
          legend={[
            { label: 'Servicio técnico', color: CHART_SERIES[0] },
            { label: 'Venta de productos', color: CHART_SERIES[1] },
          ]}
          table={
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-line text-left text-dim">
                  <th className="py-2 pr-3 font-semibold">Mes</th>
                  <th className="py-2 pr-3 text-right font-semibold">Servicio</th>
                  <th className="py-2 pr-3 text-right font-semibold">Venta</th>
                  <th className="py-2 pr-3 text-right font-semibold">Egresos</th>
                  <th className="py-2 text-right font-semibold">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {monthly.map((m) => (
                  <tr key={m.label} className="border-b border-line/60">
                    <td className="py-1.5 pr-3 capitalize">{m.label}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{money(m.servicio)}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{money(m.venta)}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{money(m.egresos)}</td>
                    <td className="py-1.5 text-right font-semibold tabular-nums">
                      {money(m.servicio + m.venta - m.egresos)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        >
          <StackedBarChart
            data={monthly.map((m) => ({ label: m.label, a: m.servicio, b: m.venta }))}
            labels={['Servicio', 'Venta']}
            height={210}
          />
        </ChartFrame>

        <ChartFrame title="Mix de ingresos del mes" subtitle="Servicio técnico frente a venta de productos">
          <ShareBar
            total={mix.total}
            segments={[
              { label: 'Servicio técnico', value: mix.servicio, color: CHART_SERIES[0] },
              { label: 'Venta de productos', value: mix.venta, color: CHART_SERIES[1] },
            ]}
          />
          <p className="mt-5 rounded-[10px] bg-muted/70 p-3 text-[12.5px] leading-relaxed text-dim">
            {mix.servicio > mix.venta
              ? 'El taller está sosteniendo el negocio. Ampliar la vitrina de productos puede subir el ticket promedio sin sumar horas de trabajo.'
              : 'La venta de productos manda este mes. Conviene reforzar el stock de lo que más rota y mantener el taller como diferencial.'}
          </p>
        </ChartFrame>
      </div>

      {/* ----------------------------------------------------- Detalle 3col */}
      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <ChartFrame title="Últimos 14 días" subtitle="Ritmo diario de ingresos">
          <StackedBarChart
            data={series.map((d) => ({ label: d.label, a: d.servicio, b: d.venta }))}
            labels={['Servicio', 'Venta']}
            height={160}
          />
        </ChartFrame>

        <ChartFrame title="Cómo llegan los clientes" subtitle="Canal de ingreso de las órdenes">
          <HBarChart
            data={byChannel.map(([c, n]) => ({ label: CHANNEL_LABEL[c], value: n, meta: 'órdenes' }))}
            formatter={(n) => String(n)}
          />
          <p className="mt-4 border-t border-line pt-3.5 text-[12.5px] leading-relaxed text-dim">
            Los canales digitales que más traen son los que conviene alimentar con contenido y respuestas
            rápidas.
          </p>
        </ChartFrame>

        <ChartFrame title="Formas de cobro del mes" subtitle="Cuánto entra por cada medio">
          <HBarChart
            data={byPayment.map(([m, v]) => ({ label: PAYMENT_LABEL[m], value: v }))}
            tone={CHART_SERIES[1]}
          />
        </ChartFrame>
      </div>

      {/* --------------------------------------------------------- Taller */}
      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        <ChartFrame title="Fallas más frecuentes" subtitle="Dónde conviene tener repuestos y especializarse">
          <HBarChart
            data={issues.map((i) => ({
              label: i.label.length > 48 ? `${i.label.slice(0, 48)}…` : i.label,
              value: i.count,
              meta: 'órdenes',
            }))}
            formatter={(n) => String(n)}
          />
        </ChartFrame>

        <ChartFrame title="Productos más vendidos" subtitle="Facturación del mes por producto">
          <HBarChart
            data={products.map((p) => ({
              label: p.name.length > 40 ? `${p.name.slice(0, 40)}…` : p.name,
              value: p.total,
              meta: `${p.qty} u.`,
            }))}
            tone={CHART_SERIES[1]}
            emptyLabel="Todavía no hubo ventas este mes."
          />
        </ChartFrame>
      </div>

      {/* ------------------------------------------------------- Técnicos */}
      <PanelCard
        className="mb-5"
        title="Rentabilidad por técnico"
        subtitle="Cuánto facturó cada uno este mes y cuánto queda después de pagar los repuestos"
        action={
          <Link to="/panel/equipo" className="text-[12.5px] font-semibold text-brand hover:underline">
            Ver equipo
          </Link>
        }
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-[11.5px] uppercase tracking-wider text-dim">
                <th className="px-4 py-2.5 font-bold">Técnico</th>
                <th className="px-4 py-2.5 text-center font-bold">Abiertas</th>
                <th className="px-4 py-2.5 text-center font-bold">Entregadas</th>
                <th className="px-4 py-2.5 text-center font-bold">Prom. días</th>
                <th className="px-4 py-2.5 text-right font-bold">Facturado</th>
                <th className="px-4 py-2.5 text-right font-bold">Margen</th>
              </tr>
            </thead>
            <tbody>
              {techs.map((t) => (
                <tr key={t.tech.id} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-3">
                    <span className="block font-semibold text-strong">{t.tech.name}</span>
                    <span className="block text-[11.5px] text-dim">{t.tech.specialty}</span>
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums text-body">{t.openCount}</td>
                  <td className="px-4 py-3 text-center tabular-nums text-body">{t.doneMonth}</td>
                  <td className="px-4 py-3 text-center tabular-nums text-body">
                    {t.avgDays ? t.avgDays.toFixed(1) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-strong">
                    {money(t.incomeMonth)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums" style={{ color: 'var(--brand-accent)' }}>
                    {money(t.marginMonth)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelCard>

      {/* ---------------------------------------------------- Salud taller */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PanelCard title="Antigüedad de los equipos en el taller" subtitle={`${k.open.length} equipos abiertos`}>
          <HBarChart
            data={aging.map((b) => ({ label: b.label, value: b.count }))}
            formatter={(n) => `${n} equipos`}
          />
        </PanelCard>

        <PanelCard title="Dinero atado" subtitle="Plata comprometida que todavía no entró a la caja">
          <dl className="flex flex-col gap-3.5">
            <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3.5">
              <dt className="text-[13.5px] text-body">Presupuestos esperando respuesta</dt>
              <dd className="text-[16px] font-extrabold tabular-nums text-strong">
                {money(k.quotedAtRisk)}
                <span className="ml-1.5 text-[12px] font-medium text-dim">({k.awaitingQuote.length})</span>
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3.5">
              <dt className="text-[13.5px] text-body">Saldos por cobrar de órdenes abiertas</dt>
              <dd className="text-[16px] font-extrabold tabular-nums text-strong">{money(k.pendingCollection)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3.5">
              <dt className="text-[13.5px] text-body">Valor del stock inmovilizado</dt>
              <dd className="text-[16px] font-extrabold tabular-nums text-strong">{money(k.inventoryValue)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-[13.5px] text-body">Equipos listos sin retirar</dt>
              <dd className="text-[16px] font-extrabold tabular-nums text-strong">{num(k.stalled.length)}</dd>
            </div>
          </dl>
          <p className="mt-4 rounded-[10px] bg-muted/70 p-3 text-[12.5px] leading-relaxed text-dim">
            Perseguir los presupuestos sin respuesta suele ser la forma más rápida de subir la facturación del
            mes: el trabajo ya está diagnosticado y el cliente ya vino una vez.
          </p>
        </PanelCard>
      </div>
    </>
  )
}

