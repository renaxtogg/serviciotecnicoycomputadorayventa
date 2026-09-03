import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Phone, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { useDemo } from '@/demo/store'
import { paidOf, warrantyActive, warrantyUntil } from '@/demo/metrics'
import { PAYMENT_LABEL } from '@/demo/types'
import { dmy, dmyHm, money, phone as fmtPhone, relative } from '@/lib/format'
import { sortBy, sum } from '@/lib/utils'
import { Avatar, Badge, Button, KeyValue } from '@/components/ui/primitives'
import { Input, Textarea } from '@/components/ui/form'
import { EmptyState, StatCard } from '@/components/ui/data'
import { ConfirmDialog, Modal, useToast } from '@/components/ui/overlay'
import { toneSoft } from '@/components/ui/tone'
import { PanelHeader } from '../AdminLayout'
import { CHANNEL_LABEL, OrderLine, PanelCard } from '../shared'

export function ClienteDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { db, actions } = useDemo()
  const toast = useToast()

  const customer = db.customers.find((c) => c.id === id)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!customer) {
    return (
      <div className="rounded-[14px] border border-line bg-card">
        <EmptyState
          title="Cliente no encontrado"
          description="Puede que lo hayas eliminado."
          action={<Button to="/panel/clientes">Volver a clientes</Button>}
        />
      </div>
    )
  }

  const orders = sortBy(db.orders.filter((o) => o.customerId === customer.id), (o) => o.receivedAt, 'desc')
  const sales = sortBy(
    db.sales.filter((s) => s.customerId === customer.id),
    (s) => s.date,
    'desc',
  )
  const spentServices = sum(orders, paidOf)
  const spentSales = sum(sales.filter((s) => s.status === 'pagada'), (s) => s.total)
  const activeWarranties = orders.filter(warrantyActive)
  const lastVisit = [...orders.map((o) => o.receivedAt), ...sales.map((s) => s.date)].sort().pop()

  const waPhone = `https://wa.me/595${customer.phone.replace(/\D/g, '').slice(1)}`

  return (
    <>
      <Link
        to="/panel/clientes"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-dim transition-colors hover:text-strong"
      >
        <ArrowLeft size={15} /> Volver a clientes
      </Link>

      <PanelHeader
        title={customer.name}
        description={`Cliente desde ${dmy(customer.createdAt)} · Llegó por ${CHANNEL_LABEL[customer.channel].toLowerCase()}`}
        badge={
          <Badge tone={customer.kind === 'empresa' ? 'navy' : 'blue'}>
            {customer.kind === 'empresa' ? `Empresa · RUC ${customer.ruc}` : 'Cliente particular'}
          </Badge>
        }
        actions={
          <>
            <Button size="sm" variant="secondary" href={`tel:${customer.phone}`} icon={<Phone size={15} />}>
              {fmtPhone(customer.phone)}
            </Button>
            <Button size="sm" variant="whatsapp" href={waPhone} external icon={<MessageCircle size={15} />}>
              WhatsApp
            </Button>
            <Button size="sm" onClick={() => setEditing(true)}>
              Editar ficha
            </Button>
          </>
        }
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total gastado" value={money(spentServices + spentSales, { compact: true })} tone="mint" hint="Servicios + compras" />
        <StatCard label="Reparaciones" value={orders.length} tone="blue" hint={`${money(spentServices, { compact: true })} en servicio`} />
        <StatCard label="Compras" value={sales.length} tone="navy" hint={`${money(spentSales, { compact: true })} en productos`} />
        <StatCard
          label="Garantías vigentes"
          value={activeWarranties.length}
          tone={activeWarranties.length > 0 ? 'amber' : 'slate'}
          icon={<ShieldCheck size={16} />}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-4">
          <PanelCard
            title="Historial de reparaciones"
            subtitle={orders.length ? `${orders.length} órdenes registradas` : undefined}
            action={
              <Button size="sm" variant="secondary" to="/panel/ordenes?nueva=1" icon={<Plus size={14} />}>
                Nueva orden
              </Button>
            }
            bodyClassName="p-2"
          >
            {orders.length === 0 ? (
              <EmptyState compact title="Todavía no trajo equipos" description="Cuando ingrese una reparación, aparece acá con todo su historial." />
            ) : (
              <ul className="flex flex-col">
                {orders.map((o) => (
                  <li key={o.id}>
                    <OrderLine
                      order={o}
                      customerName={undefined}
                      right={
                        <span className="flex shrink-0 items-center gap-2">
                          {o.quotedTotal > 0 && (
                            <span className="text-[13px] font-bold tabular-nums text-strong">{money(o.quotedTotal)}</span>
                          )}
                          {warrantyActive(o) && <Badge tone="mint">En garantía</Badge>}
                        </span>
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </PanelCard>

          <PanelCard title="Compras en el mostrador" bodyClassName="p-2">
            {sales.length === 0 ? (
              <EmptyState compact title="Sin compras registradas" description="Las ventas asociadas a este cliente se listan acá." />
            ) : (
              <ul className="flex flex-col">
                {sales.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 px-2.5 py-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="font-mono text-[12px] font-bold text-dim">{s.code}</span>
                      <span className="mt-0.5 block truncate text-[13.5px] font-semibold text-strong">
                        {s.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}
                      </span>
                      <span className="block text-[12px] text-dim">
                        {dmyHm(s.date)} · {PAYMENT_LABEL[s.method]}
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
            )}
          </PanelCard>
        </div>

        <div className="flex flex-col gap-4">
          <PanelCard title="Ficha del cliente">
            <div className="mb-4 flex items-center gap-3">
              <Avatar name={customer.name} tone={customer.kind === 'empresa' ? 'navy' : 'blue'} size={46} />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold text-strong">{customer.name}</p>
                <p className="text-[12.5px] text-dim">
                  {lastVisit ? `Última visita ${relative(lastVisit)}` : 'Sin visitas registradas'}
                </p>
              </div>
            </div>
            <dl className="divide-y divide-line">
              <KeyValue label="Teléfono" value={fmtPhone(customer.phone)} />
              {customer.email && <KeyValue label="Email" value={customer.email} />}
              {customer.ruc && <KeyValue label="RUC" value={customer.ruc} />}
              {customer.address && <KeyValue label="Dirección" value={customer.address} />}
              <KeyValue label="Origen" value={CHANNEL_LABEL[customer.channel]} />
              <KeyValue label="Alta" value={dmy(customer.createdAt)} />
            </dl>
            {customer.notes && (
              <p className="mt-4 rounded-[10px] p-3 text-[12.5px] leading-relaxed" style={toneSoft('amber', 8)}>
                <strong className="font-semibold">Nota interna:</strong> {customer.notes}
              </p>
            )}
          </PanelCard>

          {activeWarranties.length > 0 && (
            <PanelCard title="Garantías vigentes" subtitle="Trabajos que todavía están cubiertos">
              <ul className="flex flex-col gap-2.5">
                {activeWarranties.map((o) => {
                  const until = warrantyUntil(o)
                  return (
                    <li key={o.id} className="flex items-center justify-between gap-3 text-[13px]">
                      <Link to={`/panel/ordenes/${o.id}`} className="min-w-0 hover:text-brand">
                        <span className="block truncate font-semibold text-strong">
                          {o.device.brand} {o.device.model}
                        </span>
                        <span className="block text-[12px] text-dim">{o.code}</span>
                      </Link>
                      <span className="shrink-0 text-right text-[12.5px] font-semibold" style={{ color: 'var(--brand-accent)' }}>
                        hasta {until ? dmy(until) : '—'}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </PanelCard>
          )}

          <button
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-line-strong px-3 py-2 text-[12.5px] font-semibold text-dim transition-colors hover:border-danger hover:text-danger"
          >
            <Trash2 size={14} /> Eliminar cliente
          </button>
        </div>
      </div>

      <EditCustomerModal open={editing} onClose={() => setEditing(false)} customerId={customer.id} />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          actions.deleteCustomer(customer.id)
          toast('Cliente eliminado', { tone: 'danger' })
          navigate('/panel/clientes')
        }}
        title="Eliminar cliente"
        confirmLabel="Eliminar"
        message={`Se va a borrar la ficha de ${customer.name}. Sus órdenes y ventas quedan en el historial, pero sin cliente asociado.`}
      />
    </>
  )
}

function EditCustomerModal({
  open, onClose, customerId,
}: {
  open: boolean
  onClose: () => void
  customerId: string
}) {
  const { db, actions } = useDemo()
  const toast = useToast()
  const customer = db.customers.find((c) => c.id === customerId)!
  const [form, setForm] = useState({
    name: customer.name,
    phone: customer.phone,
    email: customer.email ?? '',
    ruc: customer.ruc ?? '',
    address: customer.address ?? '',
    notes: customer.notes ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = <K extends keyof typeof form>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar ficha"
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={() => {
              const e: Record<string, string> = {}
              if (form.name.trim().length < 3) e.name = 'El nombre es obligatorio.'
              if (form.phone.replace(/\D/g, '').length < 9) e.phone = 'Teléfono inválido.'
              if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Email inválido.'
              setErrors(e)
              if (Object.keys(e).length > 0) return
              actions.updateCustomer(customerId, {
                name: form.name.trim(),
                phone: form.phone.trim(),
                email: form.email.trim() || undefined,
                ruc: form.ruc.trim() || undefined,
                address: form.address.trim() || undefined,
                notes: form.notes.trim() || undefined,
              })
              toast('Ficha actualizada', { tone: 'mint' })
              onClose()
            }}
          >
            Guardar cambios
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Nombre" required value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
        <Input label="Teléfono" required value={form.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} />
        <Input label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
        <Input label="RUC" value={form.ruc} onChange={(e) => set('ruc', e.target.value)} />
        <Input label="Dirección" value={form.address} onChange={(e) => set('address', e.target.value)} wrapClassName="sm:col-span-2" />
        <Textarea label="Notas internas" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} wrapClassName="sm:col-span-2" />
      </div>
    </Modal>
  )
}
