import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Banknote, Check, MessageCircle, Phone, Plus, Printer, ShieldCheck, Trash2, X,
} from 'lucide-react'
import { useDemo } from '@/demo/store'
import { balanceOf, marginOf, paidOf, partsCost, warrantyUntil } from '@/demo/metrics'
import {
  DEVICE_LABEL, ORDER_STATUS, PAYMENT_LABEL, type OrderPart, type OrderStatus, type PaymentMethod,
} from '@/demo/types'
import { dmy, dmyHm, longDate, money, phone as fmtPhone, relative } from '@/lib/format'
import { cn } from '@/lib/utils'
import { waLink } from '@/lib/whatsapp'
import { Avatar, Badge, Button, KeyValue } from '@/components/ui/primitives'
import { Input, MoneyInput, Select, Textarea } from '@/components/ui/form'
import { EmptyState } from '@/components/ui/data'
import { ConfirmDialog, Modal, useToast } from '@/components/ui/overlay'
import { toneSoft } from '@/components/ui/tone'
import { PanelHeader } from '../AdminLayout'
import { CHANNEL_LABEL, PanelCard, StatusBadge } from '../shared'

export function OrdenDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { db, actions } = useDemo()
  const toast = useToast()

  const order = db.orders.find((o) => o.id === id)
  const [note, setNote] = useState('')
  const [showQuote, setShowQuote] = useState(false)
  const [showPay, setShowPay] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!order) {
    return (
      <div className="rounded-[14px] border border-line bg-card">
        <EmptyState
          title="No encontramos esa orden"
          description="Puede que la hayas eliminado o que el enlace esté viejo."
          action={<Button to="/panel/ordenes">Volver al taller</Button>}
        />
      </div>
    )
  }

  const customer = db.customers.find((c) => c.id === order.customerId)
  const tech = db.staff.find((s) => s.id === order.technicianId)
  const meta = ORDER_STATUS[order.status]
  const paid = paidOf(order)
  const balance = balanceOf(order)
  const warranty = warrantyUntil(order)
  const failedChecks = order.checklist.filter((c) => !c.ok)

  const nextStates = meta.next
  const allStates = (Object.keys(ORDER_STATUS) as OrderStatus[]).filter((s) => s !== order.status)

  return (
    <>
      <Link
        to="/panel/ordenes"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-dim transition-colors hover:text-strong"
      >
        <ArrowLeft size={15} /> Volver al taller
      </Link>

      <PanelHeader
        title={`${order.device.brand} ${order.device.model}`}
        description={order.reportedIssue}
        badge={
          <span className="flex items-center gap-2">
            <span className="rounded-md bg-muted px-2 py-1 font-mono text-[12.5px] font-bold text-dim">
              {order.code}
            </span>
            <StatusBadge status={order.status} />
            {order.priority === 'urgente' && <Badge tone="danger">Urgente</Badge>}
          </span>
        }
        actions={
          <>
            <Button
              size="sm"
              variant="whatsapp"
              icon={<MessageCircle size={15} />}
              href={waLink(
                `Hola ${customer?.name.split(' ')[0] ?? ''}, te escribimos por tu ${order.device.brand} ${order.device.model} (orden ${order.code}). Estado actual: ${meta.label}.`,
              )}
              external
            >
              Avisar al cliente
            </Button>
            <Button size="sm" variant="secondary" onClick={() => window.print()} icon={<Printer size={15} />}>
              Imprimir
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* ================================================= COLUMNA IZQUIERDA */}
        <div className="flex flex-col gap-4">
          {/* Cambio de estado */}
          <PanelCard title="Estado de la orden" subtitle={meta.help}>
            <div className="flex flex-wrap gap-2">
              {nextStates.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={s === 'listo' || s === 'entregado' || s === 'aprobado' ? 'primary' : 'secondary'}
                  onClick={() => {
                    actions.setOrderStatus(order.id, s)
                    toast(`Estado: ${ORDER_STATUS[s].label}`, {
                      tone: 'mint',
                      detail:
                        s === 'entregado' && balance > 0
                          ? `Se registró el cobro del saldo (${money(balance)}).`
                          : undefined,
                    })
                  }}
                  icon={<Check size={14} />}
                >
                  {ORDER_STATUS[s].label}
                </Button>
              ))}
              {nextStates.length === 0 && (
                <p className="text-[13px] text-dim">Esta orden está cerrada. No quedan pasos pendientes.</p>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-line pt-4">
              <Select
                label="Forzar otro estado"
                value=""
                onChange={(e) => {
                  if (!e.target.value) return
                  actions.setOrderStatus(order.id, e.target.value as OrderStatus, 'Estado corregido manualmente por administración.')
                  toast('Estado actualizado', { tone: 'blue' })
                }}
                placeholder="Elegir estado…"
                className="!h-10"
                wrapClassName="min-w-[190px]"
                options={allStates.map((s) => ({ value: s, label: ORDER_STATUS[s].label }))}
              />
              <Select
                label="Técnico asignado"
                value={order.technicianId ?? ''}
                onChange={(e) => {
                  actions.assignTechnician(order.id, e.target.value)
                  toast('Técnico asignado', { tone: 'mint' })
                }}
                placeholder="Sin asignar"
                className="!h-10"
                wrapClassName="min-w-[180px]"
                options={db.staff.filter((s) => s.role === 'tecnico' && s.active).map((s) => ({ value: s.id, label: s.name }))}
              />
            </div>
          </PanelCard>

          {/* Diagnóstico y presupuesto */}
          <PanelCard
            title="Diagnóstico y presupuesto"
            subtitle={order.quoteSentAt ? `Enviado al cliente el ${dmy(order.quoteSentAt)}` : 'Todavía sin presupuestar'}
            action={
              <Button size="sm" variant="secondary" onClick={() => setShowQuote(true)}>
                {order.quotedTotal > 0 ? 'Editar presupuesto' : 'Cargar presupuesto'}
              </Button>
            }
          >
            {order.diagnosis ? (
              <p className="rounded-[10px] bg-muted/70 p-3.5 text-[13.5px] leading-relaxed text-body">
                {order.diagnosis}
              </p>
            ) : (
              <p className="text-[13.5px] text-dim">
                Sin diagnóstico cargado. Cuando el técnico revise el equipo, cargalo acá para poder enviar el
                presupuesto al cliente.
              </p>
            )}

            {order.parts.length > 0 && (
              <table className="mt-4 w-full text-[13px]">
                <thead>
                  <tr className="border-b border-line text-left text-[11.5px] uppercase tracking-wide text-dim">
                    <th className="pb-2 font-bold">Repuesto</th>
                    <th className="pb-2 text-center font-bold">Cant.</th>
                    <th className="pb-2 text-right font-bold">Costo</th>
                    <th className="pb-2 text-right font-bold">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {order.parts.map((p, i) => (
                    <tr key={`${p.name}-${i}`} className="border-b border-line/60">
                      <td className="py-2 font-medium text-strong">{p.name}</td>
                      <td className="py-2 text-center tabular-nums text-body">{p.qty}</td>
                      <td className="py-2 text-right tabular-nums text-dim">{money(p.cost * p.qty)}</td>
                      <td className="py-2 text-right font-semibold tabular-nums text-strong">
                        {money(p.price * p.qty)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {order.quotedTotal > 0 && (
              <dl className="mt-4 divide-y divide-line border-t border-line pt-1">
                <KeyValue label="Repuestos" value={money(order.parts.reduce((a, p) => a + p.price * p.qty, 0))} />
                <KeyValue label="Mano de obra" value={money(order.labor)} />
                <KeyValue label="Total presupuestado" value={<span className="text-[15px]">{money(order.quotedTotal)}</span>} />
                <KeyValue label="Costo de repuestos" value={<span className="text-dim">−{money(partsCost(order))}</span>} />
                <KeyValue
                  label="Margen del trabajo"
                  value={<span style={{ color: 'var(--brand-accent)' }}>{money(marginOf(order))}</span>}
                />
              </dl>
            )}

            {order.workDone && (
              <div className="mt-4 rounded-[10px] border p-3.5" style={toneSoft('mint', 8)}>
                <p className="text-[12px] font-bold uppercase tracking-wide">Trabajo realizado</p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-body">{order.workDone}</p>
              </div>
            )}
          </PanelCard>

          {/* Checklist de recepción */}
          {order.checklist.length > 0 && (
            <PanelCard
              title="Estado en el que ingresó"
              subtitle="Registrado al recibir el equipo, delante del cliente"
            >
              <ul className="grid gap-2 sm:grid-cols-2">
                {order.checklist.map((c) => (
                  <li key={c.key} className="flex items-center gap-2 text-[13px]">
                    <span
                      className={cn(
                        'flex size-5 shrink-0 items-center justify-center rounded-full',
                        c.ok ? 'bg-accent/12 text-accent' : 'bg-danger/12 text-danger',
                      )}
                      aria-hidden
                    >
                      {c.ok ? <Check size={12} /> : <X size={12} />}
                    </span>
                    <span className={c.ok ? 'text-body' : 'font-semibold text-strong'}>{c.label}</span>
                  </li>
                ))}
              </ul>
              {failedChecks.length > 0 && (
                <p className="mt-3.5 rounded-[10px] border p-3 text-[12.5px] leading-relaxed" style={toneSoft('amber', 9)}>
                  <strong className="font-semibold">Observaciones al ingreso:</strong>{' '}
                  {failedChecks.map((c) => c.label.toLowerCase()).join(', ')}. Esto queda registrado para
                  evitar reclamos al momento de la entrega.
                </p>
              )}
            </PanelCard>
          )}

          {/* Historial */}
          <PanelCard title="Historial completo" subtitle={`${order.events.length} movimientos registrados`}>
            <div className="mb-4 flex gap-2">
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Agregar una nota interna…"
                wrapClassName="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && note.trim().length > 2) {
                    actions.addOrderNote(order.id, note.trim())
                    setNote('')
                    toast('Nota agregada al historial', { tone: 'mint' })
                  }
                }}
              />
              <Button
                size="md"
                disabled={note.trim().length < 3}
                onClick={() => {
                  actions.addOrderNote(order.id, note.trim())
                  setNote('')
                  toast('Nota agregada al historial', { tone: 'mint' })
                }}
                icon={<Plus size={15} />}
              >
                Agregar
              </Button>
            </div>

            <ol className="flex flex-col">
              {[...order.events].reverse().map((e, i, arr) => (
                <li key={e.id} className="flex gap-3.5">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        'mt-1.5 size-2.5 shrink-0 rounded-full',
                        i === 0 ? 'bg-brand ring-4 ring-brand/15' : 'bg-line-strong',
                      )}
                      aria-hidden
                    />
                    {i < arr.length - 1 && <span className="w-px flex-1 bg-line" aria-hidden />}
                  </div>
                  <div className="pb-4">
                    <p className="text-[13.5px] leading-snug text-body">{e.text}</p>
                    <p className="mt-1 text-[11.5px] text-dim">
                      {longDate(e.ts)} · {e.by}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </PanelCard>
        </div>

        {/* ================================================== COLUMNA DERECHA */}
        <div className="flex flex-col gap-4">
          {/* Cliente */}
          <PanelCard
            title="Cliente"
            action={
              customer && (
                <Link to={`/panel/clientes/${customer.id}`} className="text-[12.5px] font-semibold text-brand hover:underline">
                  Ver ficha
                </Link>
              )
            }
          >
            {customer ? (
              <>
                <div className="flex items-center gap-3">
                  <Avatar name={customer.name} tone="blue" size={40} />
                  <div className="min-w-0">
                    <p className="truncate text-[14.5px] font-bold text-strong">{customer.name}</p>
                    <p className="text-[12.5px] text-dim">
                      {customer.kind === 'empresa' ? `RUC ${customer.ruc}` : 'Cliente particular'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="secondary" href={`tel:${customer.phone}`} icon={<Phone size={14} />} className="flex-1">
                    {fmtPhone(customer.phone)}
                  </Button>
                  <Button
                    size="sm"
                    variant="whatsapp"
                    href={`https://wa.me/595${customer.phone.replace(/\D/g, '').slice(1)}`}
                    external
                    icon={<MessageCircle size={14} />}
                  >
                    WhatsApp
                  </Button>
                </div>
                {customer.notes && (
                  <p className="mt-3 rounded-[10px] bg-muted/70 p-3 text-[12.5px] leading-relaxed text-dim">
                    {customer.notes}
                  </p>
                )}
              </>
            ) : (
              <p className="text-[13px] text-dim">Cliente no encontrado.</p>
            )}
          </PanelCard>

          {/* Cobros */}
          <PanelCard
            title="Cobros"
            subtitle={balance > 0 ? `Saldo pendiente de ${money(balance)}` : 'Sin saldo pendiente'}
            action={
              <Button size="sm" variant="secondary" onClick={() => setShowPay(true)} icon={<Banknote size={14} />}>
                Registrar
              </Button>
            }
          >
            <dl className="divide-y divide-line">
              <KeyValue label="Presupuestado" value={money(order.quotedTotal)} />
              <KeyValue label="Cobrado" value={money(paid)} />
              <KeyValue
                label="Saldo"
                value={<span className={balance > 0 ? 'text-warn' : 'text-accent'}>{money(balance)}</span>}
              />
            </dl>
            {order.payments.length > 0 && (
              <ul className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
                {order.payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 text-[12.5px]">
                    <span className="min-w-0">
                      <span className="block font-semibold text-strong">{PAYMENT_LABEL[p.method]}</span>
                      <span className="block truncate text-dim">
                        {dmy(p.date)}
                        {p.note && ` · ${p.note}`}
                      </span>
                    </span>
                    <span className="shrink-0 font-bold tabular-nums text-strong">{money(p.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </PanelCard>

          {/* Equipo */}
          <PanelCard title="Datos del equipo">
            <dl className="divide-y divide-line">
              <KeyValue label="Tipo" value={DEVICE_LABEL[order.device.type]} />
              <KeyValue label="Marca y modelo" value={`${order.device.brand} ${order.device.model}`} />
              {order.device.serial && (
                <KeyValue label="IMEI / Serie" value={<span className="font-mono text-[12px]">{order.device.serial}</span>} />
              )}
              {order.device.color && <KeyValue label="Color" value={order.device.color} />}
              {order.device.unlock && <KeyValue label="Desbloqueo" value={order.device.unlock} />}
              <KeyValue
                label="Accesorios"
                value={order.device.accessories.length > 0 ? order.device.accessories.join(', ') : 'Ninguno'}
              />
              <KeyValue label="Ingresó" value={`${dmyHm(order.receivedAt)} · ${relative(order.receivedAt)}`} />
              <KeyValue label="Fecha prometida" value={dmy(order.promisedAt)} />
              {order.deliveredAt && <KeyValue label="Entregado" value={dmyHm(order.deliveredAt)} />}
              <KeyValue label="Canal de ingreso" value={CHANNEL_LABEL[order.channel]} />
              {tech && <KeyValue label="Técnico" value={tech.name} />}
            </dl>
          </PanelCard>

          {/* Garantía */}
          {warranty && (
            <div
              className="flex items-start gap-3 rounded-[13px] border p-4"
              style={toneSoft(warranty.getTime() > Date.now() ? 'mint' : 'slate', 9)}
            >
              <ShieldCheck size={19} className="mt-0.5 shrink-0" aria-hidden />
              <div>
                <p className="text-[13.5px] font-bold text-strong">
                  {warranty.getTime() > Date.now() ? 'Garantía vigente' : 'Garantía vencida'}
                </p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed">
                  {order.warrantyDays} días desde la entrega · {warranty.getTime() > Date.now() ? 'hasta' : 'venció'} el{' '}
                  {dmy(warranty)}
                </p>
              </div>
            </div>
          )}

          {order.notes && (
            <PanelCard title="Observaciones internas">
              <p className="text-[13px] leading-relaxed text-body">{order.notes}</p>
            </PanelCard>
          )}

          <button
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-line-strong px-3 py-2 text-[12.5px] font-semibold text-dim transition-colors hover:border-danger hover:text-danger"
          >
            <Trash2 size={14} /> Eliminar esta orden
          </button>
        </div>
      </div>

      <QuoteModal open={showQuote} onClose={() => setShowQuote(false)} orderId={order.id} />
      <PaymentModal open={showPay} onClose={() => setShowPay(false)} orderId={order.id} suggested={balance} />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          actions.deleteOrder(order.id)
          toast('Orden eliminada', { tone: 'danger' })
          navigate('/panel/ordenes')
        }}
        title="Eliminar orden"
        confirmLabel="Eliminar"
        message={`Se va a borrar la orden ${order.code} junto con todo su historial. Esta acción no se puede deshacer.`}
      />
    </>
  )
}

/* ==========================================================================
   PRESUPUESTO
   ========================================================================== */
function QuoteModal({ open, onClose, orderId }: { open: boolean; onClose: () => void; orderId: string }) {
  const { db, actions } = useDemo()
  const toast = useToast()
  const order = db.orders.find((o) => o.id === orderId)!

  const [diagnosis, setDiagnosis] = useState(order.diagnosis ?? '')
  const [labor, setLabor] = useState(order.labor)
  const [parts, setParts] = useState<OrderPart[]>(order.parts)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const spareParts = useMemo(
    () => db.products.filter((p) => p.category === 'repuesto' || p.category === 'componente'),
    [db.products],
  )

  const total = labor + parts.reduce((a, p) => a + p.price * p.qty, 0)

  const addPart = (productId: string) => {
    const p = db.products.find((x) => x.id === productId)
    if (!p) return
    setParts((prev) => [...prev, { productId: p.id, name: p.name, qty: 1, cost: p.cost, price: p.price || p.cost * 1.7 }])
  }

  const save = (send: boolean) => {
    const e: Record<string, string> = {}
    if (diagnosis.trim().length < 10) e.diagnosis = 'Escribí el diagnóstico con al menos una frase.'
    if (total <= 0) e.total = 'El presupuesto no puede quedar en cero.'
    if (parts.some((p) => p.qty <= 0)) e.total = 'Las cantidades deben ser mayores a cero.'
    setErrors(e)
    if (Object.keys(e).length > 0) return

    actions.saveQuote(orderId, { diagnosis: diagnosis.trim(), parts, labor, send })
    toast(send ? 'Presupuesto enviado al cliente' : 'Presupuesto guardado', {
      tone: 'mint',
      detail: send ? `Total ${money(total)} · queda esperando aprobación.` : undefined,
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Diagnóstico y presupuesto"
      description={`${order.code} · ${order.device.brand} ${order.device.model}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="secondary" size="sm" onClick={() => save(false)}>
            Solo guardar
          </Button>
          <Button size="sm" onClick={() => save(true)} icon={<MessageCircle size={14} />}>
            Guardar y enviar al cliente
          </Button>
        </>
      }
    >
      <Textarea
        label="Diagnóstico técnico"
        required
        rows={3}
        value={diagnosis}
        onChange={(e) => setDiagnosis(e.target.value)}
        error={errors.diagnosis}
        placeholder="Ej. Módulo de pantalla dañado por impacto. Placa y batería sin daño."
        hint="Este texto es el que ve el cliente en el seguimiento online."
      />

      <div className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h3 className="text-[13.5px] font-bold text-strong">Repuestos</h3>
          <Select
            value=""
            onChange={(e) => e.target.value && addPart(e.target.value)}
            placeholder="Agregar desde inventario…"
            aria-label="Agregar repuesto"
            className="!h-9 !text-[13px]"
            wrapClassName="min-w-[240px]"
            options={spareParts.map((p) => ({
              value: p.id,
              label: `${p.name} · ${money(p.cost)} (stock ${p.stock})`,
            }))}
          />
        </div>

        {parts.length === 0 ? (
          <p className="mt-3 rounded-[10px] border border-dashed border-line-strong p-4 text-center text-[13px] text-dim">
            Sin repuestos. Si el trabajo es solo mano de obra, dejalo así.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {parts.map((p, i) => (
              <li key={`${p.name}-${i}`} className="flex flex-wrap items-end gap-2.5 rounded-[10px] border border-line p-3">
                <span className="min-w-[150px] flex-1 text-[13px] font-semibold text-strong">{p.name}</span>
                <Input
                  label="Cant."
                  type="number"
                  min={1}
                  value={p.qty}
                  onChange={(e) =>
                    setParts((prev) => prev.map((x, j) => (j === i ? { ...x, qty: Math.max(1, Number(e.target.value) || 1) } : x)))
                  }
                  className="!h-9 w-[70px] !text-[13px]"
                  wrapClassName="shrink-0"
                />
                <MoneyInput
                  label="Costo"
                  value={p.cost}
                  onValueChange={(v) => setParts((prev) => prev.map((x, j) => (j === i ? { ...x, cost: v } : x)))}
                  className="w-[130px] shrink-0"
                />
                <MoneyInput
                  label="Precio"
                  value={p.price}
                  onValueChange={(v) => setParts((prev) => prev.map((x, j) => (j === i ? { ...x, price: v } : x)))}
                  className="w-[130px] shrink-0"
                />
                <button
                  onClick={() => setParts((prev) => prev.filter((_, j) => j !== i))}
                  aria-label={`Quitar ${p.name}`}
                  className="mb-1 flex size-9 shrink-0 items-center justify-center rounded-[9px] border border-line-strong text-dim transition-colors hover:border-danger hover:text-danger"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <MoneyInput label="Mano de obra" value={labor} onValueChange={setLabor} hint="Lo que cobra el taller por el trabajo." />
        <div className="flex flex-col justify-end">
          <div className="rounded-[11px] border border-line bg-muted/60 p-3.5">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-dim">Total a presupuestar</p>
            <p className="mt-1 text-[24px] font-extrabold leading-none tabular-nums text-strong">{money(total)}</p>
            <p className="mt-1.5 text-[12px] text-dim">
              Margen estimado:{' '}
              <strong className="font-semibold" style={{ color: 'var(--brand-accent)' }}>
                {money(total - parts.reduce((a, p) => a + p.cost * p.qty, 0))}
              </strong>
            </p>
          </div>
        </div>
      </div>
      {errors.total && <p className="mt-2 text-[12px] font-medium text-danger">{errors.total}</p>}
    </Modal>
  )
}

/* ==========================================================================
   COBRO
   ========================================================================== */
function PaymentModal({
  open, onClose, orderId, suggested,
}: {
  open: boolean
  onClose: () => void
  orderId: string
  suggested: number
}) {
  const { actions } = useDemo()
  const toast = useToast()
  const [amount, setAmount] = useState(suggested)
  const [method, setMethod] = useState<PaymentMethod>('efectivo')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar cobro"
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={() => {
              if (amount <= 0) {
                setError('Ingresá un monto mayor a cero.')
                return
              }
              actions.addOrderPayment(orderId, amount, method, note.trim() || undefined)
              toast(`Cobro de ${money(amount)} registrado`, { tone: 'mint', detail: 'Ya impactó en la caja del día.' })
              setNote('')
              setError('')
              onClose()
            }}
          >
            Registrar cobro
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <MoneyInput label="Monto" value={amount} onValueChange={setAmount} error={error} required />
        <Select
          label="Forma de pago"
          value={method}
          onChange={(e) => setMethod(e.target.value as PaymentMethod)}
          options={(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((m) => ({ value: m, label: PAYMENT_LABEL[m] }))}
        />
        <Input
          label="Concepto (opcional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ej. Seña para el repuesto"
        />
        <p className="rounded-[10px] bg-muted/70 p-3 text-[12.5px] leading-relaxed text-dim">
          El cobro queda registrado en el historial de la orden y suma al movimiento de caja del día.
        </p>
      </div>
    </Modal>
  )
}
