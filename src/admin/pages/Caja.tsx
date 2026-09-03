import { useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Plus, Trash2, Wallet } from 'lucide-react'
import { useDemo } from '@/demo/store'
import { incomeSeries } from '@/demo/metrics'
import { PAYMENT_LABEL, type CashMovement, type PaymentMethod } from '@/demo/types'
import { dmy, isSameMonth, isToday, isoDate, money } from '@/lib/format'
import { matches, sum } from '@/lib/utils'
import { Button } from '@/components/ui/primitives'
import { Input, MoneyInput, SegmentedControl, Select } from '@/components/ui/form'
import {
  type Column, DataTable, EmptyState, Pagination, SearchInput, StatCard, usePagination,
} from '@/components/ui/data'
import { CHART_SERIES, ChartFrame, StackedBarChart } from '@/components/ui/charts'
import { ConfirmDialog, Modal, useToast } from '@/components/ui/overlay'
import { toneSoft } from '@/components/ui/tone'
import { PanelHeader } from '../AdminLayout'

type Period = 'hoy' | 'mes' | 'todo'

const CATEGORY_LABEL: Record<CashMovement['category'], string> = {
  servicio: 'Servicio técnico',
  venta: 'Venta de productos',
  repuestos: 'Compra de repuestos',
  sueldos: 'Sueldos',
  alquiler: 'Alquiler',
  servicios: 'Servicios (ANDE, internet)',
  otros: 'Otros',
}

export function Caja() {
  const { db, actions } = useDemo()
  const toast = useToast()

  const [period, setPeriod] = useState<Period>('mes')
  const [kind, setKind] = useState('')
  const [query, setQuery] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [toDelete, setToDelete] = useState<CashMovement | null>(null)

  const filtered = useMemo(() => {
    let rows = db.cash
    if (period === 'hoy') rows = rows.filter((c) => isToday(c.date))
    else if (period === 'mes') rows = rows.filter((c) => isSameMonth(c.date))
    if (kind) rows = rows.filter((c) => c.kind === kind)
    return rows.filter((c) => matches([c.concept, CATEGORY_LABEL[c.category], PAYMENT_LABEL[c.method]], query))
  }, [db.cash, period, kind, query])

  const income = sum(filtered.filter((c) => c.kind === 'ingreso'), (c) => c.amount)
  const expense = sum(filtered.filter((c) => c.kind === 'egreso'), (c) => c.amount)
  const result = income - expense

  const todayIncome = sum(db.cash.filter((c) => c.kind === 'ingreso' && isToday(c.date)), (c) => c.amount)
  const todayExpense = sum(db.cash.filter((c) => c.kind === 'egreso' && isToday(c.date)), (c) => c.amount)

  const series = useMemo(() => incomeSeries(db, 14), [db])

  /** Desglose por forma de pago: sirve para arqueo de caja al cerrar el día */
  const byMethod = useMemo(() => {
    const map = new Map<PaymentMethod, number>()
    db.cash
      .filter((c) => c.kind === 'ingreso' && isToday(c.date))
      .forEach((c) => map.set(c.method, (map.get(c.method) ?? 0) + c.amount))
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [db.cash])

  const { slice, page, pages, setPage, total } = usePagination(filtered, 15)

  const columns: Column<CashMovement>[] = [
    {
      key: 'date',
      header: 'Fecha',
      width: '110px',
      render: (c) => <span className="text-[12.5px] tabular-nums text-dim">{dmy(c.date)}</span>,
    },
    {
      key: 'concept',
      header: 'Concepto',
      render: (c) => (
        <span className="flex items-center gap-2.5">
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-lg"
            style={toneSoft(c.kind === 'ingreso' ? 'mint' : 'danger', 11)}
            aria-hidden
          >
            {c.kind === 'ingreso' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium text-strong">{c.concept}</span>
            <span className="block text-[11.5px] text-dim">{CATEGORY_LABEL[c.category]}</span>
          </span>
        </span>
      ),
    },
    {
      key: 'method',
      header: 'Forma',
      hideBelow: 'md',
      render: (c) => <span className="text-[12.5px] text-body">{PAYMENT_LABEL[c.method]}</span>,
    },
    {
      key: 'amount',
      header: 'Monto',
      align: 'right',
      render: (c) => (
        <span
          className="font-bold tabular-nums"
          style={{ color: c.kind === 'ingreso' ? 'var(--brand-accent)' : 'var(--brand-danger)' }}
        >
          {c.kind === 'ingreso' ? '+' : '−'}
          {money(c.amount)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '52px',
      render: (c) =>
        c.refType === 'manual' ? (
          <button
            onClick={(e) => { e.stopPropagation(); setToDelete(c) }}
            aria-label="Eliminar movimiento"
            className="flex size-8 items-center justify-center rounded-lg border border-line-strong text-dim transition-colors hover:border-danger hover:text-danger"
          >
            <Trash2 size={14} />
          </button>
        ) : (
          <span className="text-[11px] text-dim">auto</span>
        ),
    },
  ]

  return (
    <>
      <PanelHeader
        title="Caja"
        description="Todo lo que entra y sale del negocio. Las ventas y los cobros de reparaciones se cargan solos."
        actions={
          <>
            <SegmentedControl<Period>
              value={period}
              onChange={setPeriod}
              size="sm"
              options={[
                { value: 'hoy', label: 'Hoy' },
                { value: 'mes', label: 'Este mes' },
                { value: 'todo', label: 'Todo' },
              ]}
            />
            <Button size="sm" onClick={() => setShowNew(true)} icon={<Plus size={15} />}>
              Movimiento manual
            </Button>
          </>
        }
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Ingresos del período" value={money(income, { compact: true })} tone="mint" icon={<ArrowUpRight size={16} />} />
        <StatCard label="Egresos del período" value={money(expense, { compact: true })} tone="danger" icon={<ArrowDownLeft size={16} />} />
        <StatCard
          label="Resultado"
          value={money(result, { compact: true })}
          tone={result >= 0 ? 'mint' : 'danger'}
          icon={<Wallet size={16} />}
          alert={result < 0}
        />
        <StatCard
          label="Caja de hoy"
          value={money(todayIncome - todayExpense, { compact: true })}
          tone="blue"
          hint={`${money(todayIncome, { compact: true })} entró · ${money(todayExpense, { compact: true })} salió`}
        />
      </section>

      <div className="mb-5 grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <ChartFrame
          title="Movimiento de los últimos 14 días"
          subtitle="Ingresos diarios separados por origen"
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

        <section className="rounded-[14px] border border-line bg-card p-5">
          <h2 className="text-[15px] font-bold text-strong">Arqueo de hoy</h2>
          <p className="mt-0.5 text-[12.5px] text-dim">Cuánto entró por cada forma de pago</p>
          {byMethod.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-dim">Todavía no hubo cobros hoy.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2.5">
              {byMethod.map(([m, amount]) => (
                <li key={m} className="flex items-center justify-between gap-3 border-b border-line/70 pb-2.5 last:border-0">
                  <span className="text-[13px] font-medium text-body">{PAYMENT_LABEL[m]}</span>
                  <span className="text-[13.5px] font-bold tabular-nums text-strong">{money(amount)}</span>
                </li>
              ))}
              <li className="flex items-baseline justify-between gap-3 border-t border-line pt-3">
                <span className="text-[13.5px] font-bold text-strong">Total del día</span>
                <span className="text-[18px] font-extrabold tabular-nums text-strong">{money(todayIncome)}</span>
              </li>
            </ul>
          )}
          <p className="mt-4 rounded-[10px] p-3 text-[12px] leading-relaxed" style={toneSoft('blue', 8)}>
            Al cerrar el local, el efectivo en la caja tendría que coincidir con lo que figura en “Efectivo”.
          </p>
        </section>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2.5 rounded-[13px] border border-line bg-card p-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar por concepto o categoría…" className="min-w-[220px] flex-1" />
        <Select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          placeholder="Ingresos y egresos"
          aria-label="Filtrar por tipo"
          className="!h-10"
          wrapClassName="min-w-[180px]"
          options={[
            { value: 'ingreso', label: 'Solo ingresos' },
            { value: 'egreso', label: 'Solo egresos' },
          ]}
        />
      </div>

      <div className="rounded-[14px] border border-line bg-card p-2 sm:p-3">
        <DataTable
          rows={slice}
          columns={columns}
          empty={
            <EmptyState
              icon={<Wallet size={24} />}
              title="Sin movimientos en este período"
              description="Cambiá el filtro de período o registrá un movimiento manual."
            />
          }
          mobileCard={(c) => (
            <div className="flex items-center gap-3">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-[10px]"
                style={toneSoft(c.kind === 'ingreso' ? 'mint' : 'danger', 11)}
                aria-hidden
              >
                {c.kind === 'ingreso' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold text-strong">{c.concept}</span>
                <span className="block text-[12px] text-dim">
                  {dmy(c.date)} · {PAYMENT_LABEL[c.method]}
                </span>
              </span>
              <span
                className="shrink-0 text-[13.5px] font-bold tabular-nums"
                style={{ color: c.kind === 'ingreso' ? 'var(--brand-accent)' : 'var(--brand-danger)' }}
              >
                {c.kind === 'ingreso' ? '+' : '−'}
                {money(c.amount, { compact: true })}
              </span>
            </div>
          )}
        />
        <Pagination page={page} pages={pages} onChange={setPage} total={total} unit="movimientos" />
      </div>

      <NewMovementModal open={showNew} onClose={() => setShowNew(false)} onSaved={() => toast('Movimiento registrado', { tone: 'mint' })} />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            actions.deleteCashMovement(toDelete.id)
            toast('Movimiento eliminado', { tone: 'danger' })
          }
        }}
        title="Eliminar movimiento"
        confirmLabel="Eliminar"
        message={`Se va a borrar “${toDelete?.concept}” de la caja.`}
      />
    </>
  )
}

function NewMovementModal({
  open, onClose, onSaved,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const { actions } = useDemo()
  const [form, setForm] = useState({
    kind: 'egreso' as CashMovement['kind'],
    concept: '',
    category: 'otros' as CashMovement['category'],
    amount: 0,
    method: 'efectivo' as PaymentMethod,
    date: isoDate(new Date()),
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Movimiento manual de caja"
      description="Para gastos e ingresos que no vienen de una venta o una reparación."
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={() => {
              const e: Record<string, string> = {}
              if (form.concept.trim().length < 3) e.concept = 'Describí el movimiento.'
              if (form.amount <= 0) e.amount = 'El monto debe ser mayor a cero.'
              const d = new Date(`${form.date}T12:00:00`)
              if (Number.isNaN(d.getTime())) e.date = 'Fecha inválida.'
              else if (d.getTime() > Date.now() + 86_400_000) e.date = 'No se pueden cargar movimientos futuros.'
              setErrors(e)
              if (Object.keys(e).length > 0) return

              actions.addCashMovement({
                date: d.toISOString(),
                kind: form.kind,
                concept: form.concept.trim(),
                category: form.category,
                amount: form.amount,
                method: form.method,
                refType: 'manual',
              })
              setForm({ ...form, concept: '', amount: 0 })
              setErrors({})
              onSaved()
              onClose()
            }}
          >
            Registrar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <SegmentedControl<CashMovement['kind']>
          value={form.kind}
          onChange={(v) => set('kind', v)}
          options={[
            { value: 'egreso', label: 'Egreso (gasto)' },
            { value: 'ingreso', label: 'Ingreso' },
          ]}
        />
        <Input label="Concepto" required value={form.concept} onChange={(e) => set('concept', e.target.value)} error={errors.concept} placeholder="Ej. Compra de insumos de limpieza" />
        <MoneyInput label="Monto" value={form.amount} onValueChange={(v) => set('amount', v)} error={errors.amount} required />
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Categoría"
            value={form.category}
            onChange={(e) => set('category', e.target.value as CashMovement['category'])}
            options={(Object.keys(CATEGORY_LABEL) as CashMovement['category'][]).map((c) => ({
              value: c,
              label: CATEGORY_LABEL[c],
            }))}
          />
          <Select
            label="Forma de pago"
            value={form.method}
            onChange={(e) => set('method', e.target.value as PaymentMethod)}
            options={(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((m) => ({ value: m, label: PAYMENT_LABEL[m] }))}
          />
        </div>
        <Input label="Fecha" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} error={errors.date} />
      </div>
    </Modal>
  )
}
