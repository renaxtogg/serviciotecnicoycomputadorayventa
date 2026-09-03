import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Plus, Users } from 'lucide-react'
import { useDemo } from '@/demo/store'
import { paidOf } from '@/demo/metrics'
import type { Customer } from '@/demo/types'
import { isSameMonth, money, phone as fmtPhone, relative } from '@/lib/format'
import { matches, sortBy, sum } from '@/lib/utils'
import { Avatar, Badge, Button } from '@/components/ui/primitives'
import { Input, SegmentedControl, Textarea } from '@/components/ui/form'
import {
  type Column, DataTable, EmptyState, Pagination, SearchInput, StatCard, usePagination,
} from '@/components/ui/data'
import { Modal, useToast } from '@/components/ui/overlay'
import { PanelHeader } from '../AdminLayout'
import { CHANNEL_LABEL } from '../shared'

type Filter = 'todos' | 'personas' | 'empresas' | 'recurrentes'

export function Clientes() {
  const { db, actions } = useDemo()
  const navigate = useNavigate()
  const toast = useToast()

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('todos')
  const [showNew, setShowNew] = useState(false)

  /** Métricas por cliente: cuántas veces vino y cuánto dejó */
  const enriched = useMemo(
    () =>
      db.customers.map((c) => {
        const orders = db.orders.filter((o) => o.customerId === c.id)
        const sales = db.sales.filter((s) => s.customerId === c.id && s.status === 'pagada')
        const spent = sum(orders, paidOf) + sum(sales, (s) => s.total)
        const lastVisit = [...orders.map((o) => o.receivedAt), ...sales.map((s) => s.date)].sort().pop()
        return { customer: c, orders: orders.length, sales: sales.length, spent, lastVisit }
      }),
    [db.customers, db.orders, db.sales],
  )

  const rows = useMemo(() => {
    let list = enriched
    if (filter === 'personas') list = list.filter((r) => r.customer.kind === 'persona')
    else if (filter === 'empresas') list = list.filter((r) => r.customer.kind === 'empresa')
    else if (filter === 'recurrentes') list = list.filter((r) => r.orders + r.sales >= 2)
    return sortBy(
      list.filter((r) => matches([r.customer.name, r.customer.phone, r.customer.email, r.customer.ruc], query)),
      (r) => r.spent,
      'desc',
    )
  }, [enriched, filter, query])

  const tableRows = rows.map((r) => ({ ...r, id: r.customer.id }))
  const { slice, page, pages, setPage, total } = usePagination(tableRows, 15)

  const newThisMonth = db.customers.filter((c) => isSameMonth(c.createdAt)).length
  const companies = db.customers.filter((c) => c.kind === 'empresa').length
  const recurring = enriched.filter((r) => r.orders + r.sales >= 2).length

  const columns: Column<(typeof tableRows)[number]>[] = [
    {
      key: 'name',
      header: 'Cliente',
      render: (r) => (
        <span className="flex items-center gap-3">
          <Avatar name={r.customer.name} tone={r.customer.kind === 'empresa' ? 'navy' : 'blue'} size={34} />
          <span className="min-w-0">
            <span className="block truncate font-semibold text-strong">{r.customer.name}</span>
            <span className="block text-[11.5px] text-dim">
              {fmtPhone(r.customer.phone)}
              {r.customer.kind === 'empresa' && ` · RUC ${r.customer.ruc}`}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: 'channel',
      header: 'Origen',
      hideBelow: 'lg',
      render: (r) => <span className="text-[12.5px] text-dim">{CHANNEL_LABEL[r.customer.channel]}</span>,
    },
    {
      key: 'orders',
      header: 'Reparaciones',
      align: 'center',
      hideBelow: 'md',
      render: (r) => <span className="font-semibold tabular-nums text-body">{r.orders}</span>,
    },
    {
      key: 'sales',
      header: 'Compras',
      align: 'center',
      hideBelow: 'md',
      render: (r) => <span className="font-semibold tabular-nums text-body">{r.sales}</span>,
    },
    {
      key: 'last',
      header: 'Última visita',
      hideBelow: 'lg',
      render: (r) => (
        <span className="text-[12.5px] text-dim">{r.lastVisit ? relative(r.lastVisit) : 'Sin movimientos'}</span>
      ),
    },
    {
      key: 'spent',
      header: 'Total gastado',
      align: 'right',
      render: (r) => <span className="font-bold tabular-nums text-strong">{money(r.spent)}</span>,
    },
  ]

  return (
    <>
      <PanelHeader
        title="Clientes"
        description="Quién es quién, cuánto dejó en el local y cuándo fue la última vez que vino."
        actions={
          <Button size="sm" onClick={() => setShowNew(true)} icon={<Plus size={15} />}>
            Nuevo cliente
          </Button>
        }
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Clientes registrados" value={db.customers.length} tone="blue" icon={<Users size={16} />} />
        <StatCard label="Nuevos este mes" value={newThisMonth} tone="mint" />
        <StatCard label="Clientes que vuelven" value={recurring} tone="navy" hint={`${Math.round((recurring / Math.max(1, db.customers.length)) * 100)}% del total`} />
        <StatCard label="Empresas" value={companies} tone="slate" icon={<Building2 size={16} />} />
      </section>

      <div className="mb-4 flex flex-wrap items-center gap-2.5 rounded-[13px] border border-line bg-card p-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar por nombre, teléfono, email o RUC…" className="min-w-[220px] flex-1" />
        <SegmentedControl<Filter>
          value={filter}
          onChange={setFilter}
          size="sm"
          options={[
            { value: 'todos', label: 'Todos' },
            { value: 'personas', label: 'Personas' },
            { value: 'empresas', label: 'Empresas' },
            { value: 'recurrentes', label: 'Recurrentes' },
          ]}
        />
      </div>

      <div className="rounded-[14px] border border-line bg-card p-2 sm:p-3">
        <DataTable
          rows={slice}
          columns={columns}
          onRowClick={(r) => navigate(`/panel/clientes/${r.customer.id}`)}
          empty={
            <EmptyState
              icon={<Users size={24} />}
              title="No encontramos clientes"
              description="Probá con otro filtro o registrá un cliente nuevo."
              action={<Button onClick={() => setShowNew(true)}>Nuevo cliente</Button>}
            />
          }
          mobileCard={(r) => (
            <>
              <div className="flex items-start gap-3">
                <Avatar name={r.customer.name} tone={r.customer.kind === 'empresa' ? 'navy' : 'blue'} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold text-strong">{r.customer.name}</p>
                  <p className="text-[12.5px] text-dim">{fmtPhone(r.customer.phone)}</p>
                </div>
                <span className="shrink-0 text-right">
                  <span className="block text-[14px] font-bold tabular-nums text-strong">{money(r.spent)}</span>
                  <span className="block text-[11px] text-dim">total</span>
                </span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2 border-t border-line pt-2.5 text-[12px] text-dim">
                <Badge tone="slate">{r.orders} reparaciones</Badge>
                <Badge tone="slate">{r.sales} compras</Badge>
                {r.lastVisit && <span className="self-center">Última: {relative(r.lastVisit)}</span>}
              </div>
            </>
          )}
        />
        <Pagination page={page} pages={pages} onChange={setPage} total={total} unit="clientes" />
      </div>

      <NewCustomerModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreate={(c) => {
          const created = actions.createCustomer(c)
          toast(`${created.name} agregado`, { tone: 'mint' })
          navigate(`/panel/clientes/${created.id}`)
        }}
      />
    </>
  )
}

export function NewCustomerModal({
  open, onClose, onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (c: Omit<Customer, 'id' | 'createdAt'>) => void
}) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', kind: 'persona' as Customer['kind'],
    ruc: '', address: '', notes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  const save = () => {
    const e: Record<string, string> = {}
    if (form.name.trim().length < 3) e.name = 'El nombre es obligatorio.'
    if (form.phone.replace(/\D/g, '').length < 9) e.phone = 'Ingresá un teléfono válido.'
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'El email no parece válido.'
    if (form.kind === 'empresa' && !form.ruc.trim()) e.ruc = 'Cargá el RUC para poder facturar.'
    setErrors(e)
    if (Object.keys(e).length > 0) return

    onCreate({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      kind: form.kind,
      ruc: form.ruc.trim() || undefined,
      address: form.address.trim() || undefined,
      notes: form.notes.trim() || undefined,
      channel: 'local',
    })
    setForm({ name: '', phone: '', email: '', kind: 'persona', ruc: '', address: '', notes: '' })
    setErrors({})
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo cliente"
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" onClick={save}>
            Crear cliente
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <SegmentedControl<Customer['kind']>
          value={form.kind}
          onChange={(v) => set('kind', v)}
          options={[
            { value: 'persona', label: 'Persona' },
            { value: 'empresa', label: 'Empresa' },
          ]}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label={form.kind === 'empresa' ? 'Razón social' : 'Nombre y apellido'}
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            error={errors.name}
            placeholder={form.kind === 'empresa' ? 'Farmacia San Blas' : 'Carmen Villalba'}
          />
          <Input label="Teléfono" required value={form.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} placeholder="0981 234 567" />
          <Input label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} placeholder="opcional" />
          {form.kind === 'empresa' ? (
            <Input label="RUC" required value={form.ruc} onChange={(e) => set('ruc', e.target.value)} error={errors.ruc} placeholder="80012345-6" />
          ) : (
            <Input label="Dirección" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Villa Morra, Asunción" />
          )}
        </div>
        {form.kind === 'empresa' && (
          <Input label="Dirección" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Villa Morra, Asunción" />
        )}
        <Textarea
          label="Notas internas"
          rows={2}
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Ej. Prefiere que le avisemos por WhatsApp, no atiende llamadas."
        />
      </div>
    </Modal>
  )
}

