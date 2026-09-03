import { useMemo, useState } from 'react'
import { Ban, Receipt, ShoppingCart } from 'lucide-react'
import { useDemo } from '@/demo/store'
import { saleMargin } from '@/demo/metrics'
import { PAYMENT_LABEL, type PaymentMethod, type Sale } from '@/demo/types'
import { dmyHm, isSameMonth, isToday, money } from '@/lib/format'
import { matches, sum } from '@/lib/utils'
import { Badge, Button } from '@/components/ui/primitives'
import { SegmentedControl, Select } from '@/components/ui/form'
import {
  type Column, DataTable, EmptyState, Pagination, SearchInput, StatCard, usePagination,
} from '@/components/ui/data'
import { ConfirmDialog, Modal, useToast } from '@/components/ui/overlay'
import { PanelHeader } from '../AdminLayout'
import { CHANNEL_LABEL } from '../shared'

type Period = 'hoy' | 'mes' | 'todo'

export function Ventas() {
  const { db, actions } = useDemo()
  const toast = useToast()
  const [period, setPeriod] = useState<Period>('mes')
  const [query, setQuery] = useState('')
  const [method, setMethod] = useState('')
  const [detail, setDetail] = useState<Sale | null>(null)
  const [toVoid, setToVoid] = useState<Sale | null>(null)

  const sellerOf = (id: string) => db.staff.find((s) => s.id === id)?.name ?? '—'

  const filtered = useMemo(() => {
    let rows = db.sales
    if (period === 'hoy') rows = rows.filter((s) => isToday(s.date))
    else if (period === 'mes') rows = rows.filter((s) => isSameMonth(s.date))
    if (method) rows = rows.filter((s) => s.method === method)
    return rows.filter((s) =>
      matches([s.code, s.customerName, sellerOf(s.sellerId), ...s.items.map((i) => i.name)], query),
    )
  }, [db.sales, db.staff, period, method, query])

  const paid = filtered.filter((s) => s.status === 'pagada')
  const revenue = sum(paid, (s) => s.total)
  const margin = sum(paid, (s) => saleMargin(s.items) - s.discount)
  const units = sum(paid, (s) => sum(s.items, (i) => i.qty))
  const ticket = paid.length ? revenue / paid.length : 0

  const { slice, page, pages, setPage, total } = usePagination(filtered, 15)

  const columns: Column<Sale>[] = [
    {
      key: 'code',
      header: 'Venta',
      width: '130px',
      render: (s) => (
        <span className="flex flex-col gap-0.5">
          <span className="font-mono text-[12.5px] font-bold text-strong">{s.code}</span>
          <span className="text-[11.5px] text-dim">{dmyHm(s.date)}</span>
        </span>
      ),
    },
    {
      key: 'items',
      header: 'Productos',
      render: (s) => (
        <span className="flex flex-col gap-0.5">
          <span className="line-clamp-1 font-medium text-strong">
            {s.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}
          </span>
          <span className="text-[12px] text-dim">{s.customerName}</span>
        </span>
      ),
    },
    { key: 'seller', header: 'Vendedor', hideBelow: 'lg', render: (s) => <span className="text-[12.5px] text-body">{sellerOf(s.sellerId)}</span> },
    {
      key: 'method',
      header: 'Pago',
      hideBelow: 'md',
      render: (s) => (
        <span className="text-[12.5px] text-body">
          {PAYMENT_LABEL[s.method]}
          {s.installments && <span className="text-dim"> ×{s.installments}</span>}
        </span>
      ),
    },
    { key: 'channel', header: 'Canal', hideBelow: 'lg', render: (s) => <span className="text-[12.5px] text-dim">{CHANNEL_LABEL[s.channel]}</span> },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (s) => (
        <span className="flex flex-col items-end gap-0.5">
          <span className="font-bold tabular-nums text-strong">{money(s.total)}</span>
          {s.status !== 'pagada' && (
            <Badge tone={s.status === 'anulada' ? 'danger' : 'amber'}>
              {s.status === 'anulada' ? 'Anulada' : 'Pendiente'}
            </Badge>
          )}
        </span>
      ),
    },
  ]

  return (
    <>
      <PanelHeader
        title="Ventas"
        description="Historial completo del mostrador, con margen real por operación."
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
            <Button size="sm" to="/panel/pos" icon={<ShoppingCart size={15} />}>
              Nueva venta
            </Button>
          </>
        }
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Facturado" value={money(revenue, { compact: true })} tone="mint" icon={<Receipt size={16} />} hint={`${paid.length} ventas`} />
        <StatCard label="Margen bruto" value={money(margin, { compact: true })} tone="blue" hint={revenue ? `${Math.round((margin / revenue) * 100)}% sobre lo facturado` : undefined} />
        <StatCard label="Ticket promedio" value={money(ticket, { compact: true })} tone="navy" />
        <StatCard label="Unidades vendidas" value={units} tone="slate" />
      </section>

      <div className="mb-4 flex flex-wrap items-center gap-2.5 rounded-[13px] border border-line bg-card p-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar por código, producto, cliente o vendedor…" className="min-w-[220px] flex-1" />
        <Select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          placeholder="Todas las formas de pago"
          aria-label="Filtrar por forma de pago"
          className="!h-10"
          wrapClassName="min-w-[190px]"
          options={(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((m) => ({ value: m, label: PAYMENT_LABEL[m] }))}
        />
      </div>

      <div className="rounded-[14px] border border-line bg-card p-2 sm:p-3">
        <DataTable
          rows={slice}
          columns={columns}
          onRowClick={setDetail}
          empty={
            <EmptyState
              icon={<Receipt size={24} />}
              title="Sin ventas en este período"
              description="Cambiá el filtro de período o registrá una venta desde el punto de venta."
              action={<Button to="/panel/pos">Ir al punto de venta</Button>}
            />
          }
          mobileCard={(s) => (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-mono text-[12px] font-bold text-dim">{s.code}</span>
                  <p className="mt-0.5 line-clamp-2 text-[13.5px] font-semibold text-strong">
                    {s.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}
                  </p>
                  <p className="text-[12.5px] text-dim">{s.customerName}</p>
                </div>
                <span className="shrink-0 text-right">
                  <span className="block text-[15px] font-bold tabular-nums text-strong">{money(s.total)}</span>
                  {s.status !== 'pagada' && (
                    <Badge tone={s.status === 'anulada' ? 'danger' : 'amber'} className="mt-1">
                      {s.status === 'anulada' ? 'Anulada' : 'Pendiente'}
                    </Badge>
                  )}
                </span>
              </div>
              <p className="mt-2 border-t border-line pt-2 text-[12px] text-dim">
                {dmyHm(s.date)} · {PAYMENT_LABEL[s.method]} · {sellerOf(s.sellerId)}
              </p>
            </>
          )}
        />
        <Pagination page={page} pages={pages} onChange={setPage} total={total} unit="ventas" />
      </div>

      {/* ---------------------------------------------------- Detalle venta */}
      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={`Venta ${detail?.code ?? ''}`}
        description={detail ? `${dmyHm(detail.date)} · ${detail.customerName}` : undefined}
        footer={
          detail && (
            <>
              <Button variant="secondary" size="sm" onClick={() => setDetail(null)}>
                Cerrar
              </Button>
              {detail.status === 'pagada' && (
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Ban size={14} />}
                  onClick={() => {
                    setToVoid(detail)
                    setDetail(null)
                  }}
                >
                  Anular venta
                </Button>
              )}
            </>
          )
        }
      >
        {detail && (
          <>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-line text-left text-[11.5px] uppercase tracking-wide text-dim">
                  <th className="pb-2 font-bold">Producto</th>
                  <th className="pb-2 text-center font-bold">Cant.</th>
                  <th className="pb-2 text-right font-bold">Precio</th>
                  <th className="pb-2 text-right font-bold">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {detail.items.map((it) => (
                  <tr key={it.productId} className="border-b border-line/60">
                    <td className="py-2.5 font-medium text-strong">{it.name}</td>
                    <td className="py-2.5 text-center tabular-nums text-body">{it.qty}</td>
                    <td className="py-2.5 text-right tabular-nums text-body">{money(it.price)}</td>
                    <td className="py-2.5 text-right font-semibold tabular-nums text-strong">
                      {money(it.price * it.qty)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <dl className="mt-4 flex flex-col gap-2 border-t border-line pt-4 text-[13px]">
              {detail.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-dim">Descuento</dt>
                  <dd className="font-semibold tabular-nums text-danger">−{money(detail.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-dim">Forma de pago</dt>
                <dd className="font-semibold text-strong">
                  {PAYMENT_LABEL[detail.method]}
                  {detail.installments && ` en ${detail.installments} cuotas`}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-dim">Vendedor</dt>
                <dd className="font-semibold text-strong">{sellerOf(detail.sellerId)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-dim">Margen de la venta</dt>
                <dd className="font-semibold tabular-nums" style={{ color: 'var(--brand-accent)' }}>
                  {money(saleMargin(detail.items) - detail.discount)}
                </dd>
              </div>
              <div className="mt-1 flex items-baseline justify-between border-t border-line pt-3">
                <dt className="text-[14px] font-bold text-strong">Total</dt>
                <dd className="text-[20px] font-extrabold tabular-nums text-strong">{money(detail.total)}</dd>
              </div>
            </dl>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toVoid)}
        onClose={() => setToVoid(null)}
        onConfirm={() => {
          if (toVoid) {
            actions.voidSale(toVoid.id)
            toast(`Venta ${toVoid.code} anulada`, {
              tone: 'amber',
              detail: 'Se devolvió el stock y se compensó la caja.',
            })
          }
        }}
        title="Anular venta"
        confirmLabel="Anular"
        message={
          toVoid
            ? `Se va a anular la venta ${toVoid.code} por ${money(toVoid.total)}. El stock vuelve al inventario y se registra un egreso compensatorio en la caja.`
            : ''
        }
      />
    </>
  )
}
