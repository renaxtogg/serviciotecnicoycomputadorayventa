import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { KanbanSquare, List, Plus, Wrench } from 'lucide-react'
import { useDemo } from '@/demo/store'
import { isOpen, isOverdue, isStalledPickup } from '@/demo/metrics'
import {
  BOARD_COLUMNS, DEVICE_LABEL, ORDER_STATUS, type DeviceType, type OrderStatus, type ServiceOrder,
} from '@/demo/types'
import { dmy, isoDate, money, relative } from '@/lib/format'
import { matches, sortBy } from '@/lib/utils'
import { Button } from '@/components/ui/primitives'
import { Checkbox, Input, SegmentedControl, Select, Textarea } from '@/components/ui/form'
import { type Column, DataTable, EmptyState, Pagination, SearchInput, usePagination } from '@/components/ui/data'
import { Modal, useToast } from '@/components/ui/overlay'
import { PanelHeader } from '../AdminLayout'
import { AgeChip, OrderFlags, StatusBadge } from '../shared'

type View = 'tablero' | 'lista'

const RECEPTION_CHECKS: Record<'movil' | 'computo', Array<{ key: string; label: string }>> = {
  movil: [
    { key: 'enciende', label: 'Enciende' },
    { key: 'pantalla', label: 'Pantalla sin fisuras' },
    { key: 'carcasa', label: 'Carcasa sin golpes' },
    { key: 'botones', label: 'Botones funcionan' },
    { key: 'carga', label: 'Carga correctamente' },
    { key: 'camara', label: 'Cámaras OK' },
    { key: 'audio', label: 'Audio y micrófono OK' },
    { key: 'humedad', label: 'Sin indicio de humedad' },
  ],
  computo: [
    { key: 'enciende', label: 'Enciende' },
    { key: 'pantalla', label: 'Pantalla sin fisuras' },
    { key: 'carcasa', label: 'Carcasa sin golpes' },
    { key: 'teclado', label: 'Teclado completo' },
    { key: 'carga', label: 'Carga correctamente' },
    { key: 'bateria', label: 'Batería retiene carga' },
    { key: 'puertos', label: 'Puertos sin daño' },
  ],
}

export function Ordenes() {
  const { db, actions } = useDemo()
  const navigate = useNavigate()
  const toast = useToast()
  const [params, setParams] = useSearchParams()

  const [view, setView] = useState<View>('tablero')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState(params.get('estado') ?? '')
  const [tech, setTech] = useState('')
  const [quick, setQuick] = useState(params.get('filtro') ?? '')
  const [showNew, setShowNew] = useState(params.get('nueva') === '1')
  const [dragOver, setDragOver] = useState<OrderStatus | null>(null)

  useEffect(() => {
    if (params.get('filtro') || params.get('estado')) setView('lista')
  }, [params])

  const nameOf = (id: string) => db.customers.find((c) => c.id === id)?.name ?? 'Cliente'
  const techOf = (id?: string) => db.staff.find((s) => s.id === id)?.name

  const filtered = useMemo(() => {
    let list = db.orders
    if (quick === 'atrasadas') list = list.filter(isOverdue)
    else if (quick === 'listos') list = list.filter((o) => isStalledPickup(o))
    else if (quick === 'abiertas') list = list.filter(isOpen)
    if (status) list = list.filter((o) => o.status === status)
    if (tech) list = list.filter((o) => o.technicianId === tech)
    return list.filter((o) =>
      matches([o.code, o.device.brand, o.device.model, o.device.serial, o.reportedIssue, nameOf(o.customerId)], query),
    )
  }, [db.orders, db.customers, quick, status, tech, query])

  const boardOrders = useMemo(() => filtered.filter(isOpen), [filtered])
  const { slice, page, pages, setPage, total } = usePagination(filtered, 14)

  const clearFilters = () => {
    setQuery('')
    setStatus('')
    setTech('')
    setQuick('')
    setParams({}, { replace: true })
  }

  const activeFilters = [status, tech, quick].filter(Boolean).length

  const move = (order: ServiceOrder, next: OrderStatus) => {
    if (order.status === next) return
    actions.setOrderStatus(order.id, next)
    toast(`${order.code} → ${ORDER_STATUS[next].label}`, {
      tone: 'mint',
      detail: next === 'listo' ? 'Se registró el aviso al cliente.' : undefined,
    })
  }

  const columns: Column<ServiceOrder>[] = [
    {
      key: 'code',
      header: 'Orden',
      width: '150px',
      render: (o) => (
        <span className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1.5">
            <span className="font-mono text-[12.5px] font-bold text-strong">{o.code}</span>
            <OrderFlags order={o} />
          </span>
          <span className="text-[11.5px] text-dim">{dmy(o.receivedAt)}</span>
        </span>
      ),
    },
    {
      key: 'device',
      header: 'Equipo',
      render: (o) => (
        <span className="flex flex-col gap-0.5">
          <span className="font-semibold text-strong">
            {o.device.brand} {o.device.model}
          </span>
          <span className="text-[12px] text-dim">{DEVICE_LABEL[o.device.type]}</span>
        </span>
      ),
    },
    {
      key: 'customer',
      header: 'Cliente',
      hideBelow: 'lg',
      render: (o) => <span className="text-body">{nameOf(o.customerId)}</span>,
    },
    {
      key: 'issue',
      header: 'Falla',
      hideBelow: 'lg',
      render: (o) => (
        <span className="line-clamp-1 max-w-[240px] text-[12.5px] text-dim" title={o.reportedIssue}>
          {o.reportedIssue}
        </span>
      ),
    },
    {
      key: 'tech',
      header: 'Técnico',
      hideBelow: 'md',
      render: (o) => <span className="text-[12.5px] text-body">{techOf(o.technicianId) ?? '—'}</span>,
    },
    { key: 'age', header: 'Días', align: 'center', hideBelow: 'sm', render: (o) => <AgeChip order={o} /> },
    {
      key: 'total',
      header: 'Presupuesto',
      align: 'right',
      hideBelow: 'sm',
      render: (o) => (
        <span className="font-semibold tabular-nums text-strong">
          {o.quotedTotal > 0 ? money(o.quotedTotal) : '—'}
        </span>
      ),
    },
    { key: 'status', header: 'Estado', align: 'right', render: (o) => <StatusBadge status={o.status} /> },
  ]

  return (
    <>
      <PanelHeader
        title="Taller"
        description="Todos los equipos que pasaron por el local, con su estado, su técnico y su plazo."
        actions={
          <>
            <SegmentedControl<View>
              value={view}
              onChange={setView}
              size="sm"
              options={[
                { value: 'tablero', label: <span className="flex items-center gap-1.5"><KanbanSquare size={14} /> Tablero</span> },
                { value: 'lista', label: <span className="flex items-center gap-1.5"><List size={14} /> Lista</span> },
              ]}
            />
            <Button size="sm" onClick={() => setShowNew(true)} icon={<Plus size={15} />}>
              Nueva orden
            </Button>
          </>
        }
      />

      {/* ------------------------------------------------------- Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-2.5 rounded-[13px] border border-line bg-card p-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar por código, equipo, cliente o falla…"
          className="min-w-[200px] flex-1"
        />
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          placeholder="Todos los estados"
          aria-label="Filtrar por estado"
          className="!h-10"
          wrapClassName="min-w-[170px]"
          options={(Object.keys(ORDER_STATUS) as OrderStatus[]).map((s) => ({
            value: s,
            label: ORDER_STATUS[s].label,
          }))}
        />
        <Select
          value={tech}
          onChange={(e) => setTech(e.target.value)}
          placeholder="Todos los técnicos"
          aria-label="Filtrar por técnico"
          className="!h-10"
          wrapClassName="min-w-[160px]"
          options={db.staff.filter((s) => s.role === 'tecnico').map((s) => ({ value: s.id, label: s.name }))}
        />
        <Select
          value={quick}
          onChange={(e) => setQuick(e.target.value)}
          placeholder="Sin filtro rápido"
          aria-label="Filtro rápido"
          className="!h-10"
          wrapClassName="min-w-[170px]"
          options={[
            { value: 'abiertas', label: 'Solo abiertas' },
            { value: 'atrasadas', label: 'Fuera de plazo' },
            { value: 'listos', label: 'Listos sin retirar' },
          ]}
        />
        {(activeFilters > 0 || query) && (
          <button onClick={clearFilters} className="text-[12.5px] font-semibold text-brand hover:underline">
            Limpiar
          </button>
        )}
      </div>

      {/* ------------------------------------------------------- Tablero */}
      {view === 'tablero' ? (
        <div className="thin-scroll -mx-4 flex gap-3 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6">
          {BOARD_COLUMNS.map((col) => {
            const items = sortBy(
              boardOrders.filter((o) => o.status === col),
              (o) => (o.priority === 'urgente' ? 0 : 1) + (isOverdue(o) ? 0 : 0.5),
            )
            const meta = ORDER_STATUS[col]
            return (
              <section
                key={col}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(col)
                }}
                onDragLeave={() => setDragOver((c) => (c === col ? null : c))}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOver(null)
                  const id = e.dataTransfer.getData('text/plain')
                  const order = db.orders.find((o) => o.id === id)
                  if (order) move(order, col)
                }}
                className={`flex w-[268px] shrink-0 flex-col rounded-[13px] border bg-muted/45 transition-colors ${
                  dragOver === col ? 'border-brand bg-brand/[0.05]' : 'border-line'
                }`}
              >
                <header className="flex items-center justify-between gap-2 border-b border-line px-3.5 py-3">
                  <h2 className="flex items-center gap-2 text-[12.5px] font-bold text-strong">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: `var(--brand-${meta.tone === 'mint' ? 'accent' : meta.tone === 'blue' ? 'primary' : meta.tone === 'amber' ? 'warning' : meta.tone === 'danger' ? 'danger' : 'secondary'})` }}
                      aria-hidden
                    />
                    {meta.short}
                  </h2>
                  <span className="rounded-full bg-card px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-dim">
                    {items.length}
                  </span>
                </header>

                <div className="thin-scroll flex max-h-[62vh] flex-col gap-2 overflow-y-auto p-2.5">
                  {items.length === 0 && (
                    <p className="px-1 py-6 text-center text-[12px] text-dim">Sin equipos acá</p>
                  )}
                  {items.map((o) => (
                    <article
                      key={o.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', o.id)}
                      onClick={() => navigate(`/panel/ordenes/${o.id}`)}
                      className="cursor-pointer rounded-[11px] border border-line bg-card p-3 transition-all hover:border-brand/45 hover:shadow-[var(--shadow-sm)] active:cursor-grabbing"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11.5px] font-bold text-dim">{o.code}</span>
                        <span className="flex items-center gap-1.5">
                          <OrderFlags order={o} />
                          <AgeChip order={o} />
                        </span>
                      </div>
                      <p className="mt-1.5 text-[13px] font-bold leading-snug text-strong">
                        {o.device.brand} {o.device.model}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-dim">{nameOf(o.customerId)}</p>
                      <p className="mt-1.5 line-clamp-2 text-[12px] leading-snug text-dim">{o.reportedIssue}</p>
                      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-line pt-2.5">
                        <span className="truncate text-[11.5px] text-dim">
                          {techOf(o.technicianId) ?? 'Sin asignar'}
                        </span>
                        {o.quotedTotal > 0 && (
                          <span className="shrink-0 text-[12px] font-bold tabular-nums text-strong">
                            {money(o.quotedTotal, { compact: true })}
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        /* --------------------------------------------------------- Lista */
        <div className="rounded-[14px] border border-line bg-card p-2 sm:p-3">
          <DataTable
            rows={slice}
            columns={columns}
            onRowClick={(o) => navigate(`/panel/ordenes/${o.id}`)}
            empty={
              <EmptyState
                icon={<Wrench size={24} />}
                title="No hay órdenes con esos filtros"
                description="Probá limpiando los filtros o registrá una orden nueva."
                action={<Button onClick={clearFilters} variant="secondary">Limpiar filtros</Button>}
              />
            }
            mobileCard={(o) => (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="font-mono text-[12px] font-bold text-dim">{o.code}</span>
                      <OrderFlags order={o} />
                    </span>
                    <p className="mt-0.5 truncate text-[14px] font-bold text-strong">
                      {o.device.brand} {o.device.model}
                    </p>
                    <p className="truncate text-[12.5px] text-dim">{nameOf(o.customerId)}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <p className="mt-2 line-clamp-2 text-[12.5px] leading-snug text-dim">{o.reportedIssue}</p>
                <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2.5">
                  <span className="flex items-center gap-2 text-[12px] text-dim">
                    <AgeChip order={o} />
                    {relative(o.receivedAt)}
                  </span>
                  {o.quotedTotal > 0 && (
                    <span className="text-[13px] font-bold tabular-nums text-strong">{money(o.quotedTotal)}</span>
                  )}
                </div>
              </>
            )}
          />
          <Pagination page={page} pages={pages} onChange={setPage} total={total} unit="órdenes" />
        </div>
      )}

      <NuevaOrdenModal open={showNew} onClose={() => { setShowNew(false); setParams({}, { replace: true }) }} />
    </>
  )
}

/* ==========================================================================
   ALTA DE ORDEN — recepción del equipo con checklist
   ========================================================================== */
function NuevaOrdenModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { db, actions } = useDemo()
  const toast = useToast()
  const navigate = useNavigate()

  const [newCustomer, setNewCustomer] = useState(false)
  const [form, setForm] = useState({
    customerId: '',
    name: '',
    phone: '',
    type: 'celular' as DeviceType,
    brand: '',
    model: '',
    serial: '',
    color: '',
    unlock: '',
    accessories: [] as string[],
    issue: '',
    priority: 'normal' as 'normal' | 'urgente',
    technicianId: '',
    promised: isoDate(new Date(Date.now() + 2 * 86_400_000)),
    notes: '',
  })
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const checkList = ['celular', 'tablet'].includes(form.type) ? RECEPTION_CHECKS.movil : RECEPTION_CHECKS.computo

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  const reset = () => {
    setForm({
      customerId: '', name: '', phone: '', type: 'celular', brand: '', model: '', serial: '',
      color: '', unlock: '', accessories: [], issue: '', priority: 'normal', technicianId: '',
      promised: isoDate(new Date(Date.now() + 2 * 86_400_000)), notes: '',
    })
    setChecks({})
    setErrors({})
    setNewCustomer(false)
  }

  const submit = () => {
    const e: Record<string, string> = {}
    if (newCustomer) {
      if (form.name.trim().length < 3) e.name = 'Escribí el nombre del cliente.'
      if (form.phone.replace(/\D/g, '').length < 9) e.phone = 'Teléfono inválido.'
    } else if (!form.customerId) {
      e.customerId = 'Elegí un cliente o cargá uno nuevo.'
    }
    if (!form.brand.trim()) e.brand = 'Indicá la marca del equipo.'
    if (!form.model.trim()) e.model = 'Indicá el modelo.'
    if (form.issue.trim().length < 8) e.issue = 'Describí la falla que reporta el cliente.'
    const promisedDate = new Date(`${form.promised}T18:00:00`)
    if (Number.isNaN(promisedDate.getTime())) e.promised = 'Fecha inválida.'
    else if (promisedDate.getTime() < Date.now() - 86_400_000) e.promised = 'La fecha prometida no puede estar en el pasado.'

    setErrors(e)
    if (Object.keys(e).length > 0) return

    const customerId = newCustomer
      ? actions.createCustomer({
          name: form.name.trim(),
          phone: form.phone.trim(),
          kind: 'persona',
          channel: 'local',
        }).id
      : form.customerId

    const order = actions.createOrder({
      customerId,
      device: {
        type: form.type,
        brand: form.brand.trim(),
        model: form.model.trim(),
        serial: form.serial.trim() || undefined,
        color: form.color.trim() || undefined,
        accessories: form.accessories,
        unlock: form.unlock.trim() || undefined,
      },
      reportedIssue: form.issue.trim(),
      priority: form.priority,
      technicianId: form.technicianId || undefined,
      promisedAt: promisedDate.toISOString(),
      channel: 'local',
      checklist: checkList.map((c) => ({ ...c, ok: Boolean(checks[c.key]) })),
      notes: form.notes.trim() || undefined,
    })

    toast(`Orden ${order?.code} creada`, { tone: 'mint', detail: 'El equipo entró a la cola de diagnóstico.' })
    reset()
    onClose()
    if (order) navigate(`/panel/ordenes/${order.id}`)
  }

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose() }}
      title="Recepción de equipo"
      description="Registrá el equipo con el estado en el que llega. Esto evita discusiones al momento de entregar."
      size="lg"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={() => { reset(); onClose() }}>
            Cancelar
          </Button>
          <Button size="sm" onClick={submit}>
            Crear orden
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Cliente */}
        <fieldset className="border-0 p-0">
          <legend className="mb-3 text-[13.5px] font-bold text-strong">Cliente</legend>
          {newCustomer ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Nombre y apellido" required value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} placeholder="Ej. Carmen Villalba" />
              <Input label="Teléfono" required value={form.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} placeholder="0981 234 567" />
            </div>
          ) : (
            <Select
              label="Buscar cliente registrado"
              required
              value={form.customerId}
              onChange={(e) => set('customerId', e.target.value)}
              error={errors.customerId}
              placeholder="Elegí un cliente"
              options={sortBy(db.customers, (c) => c.name).map((c) => ({
                value: c.id,
                label: `${c.name} · ${c.phone}`,
              }))}
            />
          )}
          <button
            onClick={() => setNewCustomer((v) => !v)}
            className="mt-2 text-[12.5px] font-semibold text-brand hover:underline"
          >
            {newCustomer ? 'Elegir un cliente existente' : 'El cliente es nuevo, cargarlo ahora'}
          </button>
        </fieldset>

        {/* Equipo */}
        <fieldset className="border-0 p-0">
          <legend className="mb-3 text-[13.5px] font-bold text-strong">Equipo</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <Select
              label="Tipo"
              value={form.type}
              onChange={(e) => set('type', e.target.value as DeviceType)}
              options={(Object.keys(DEVICE_LABEL) as DeviceType[]).map((t) => ({ value: t, label: DEVICE_LABEL[t] }))}
            />
            <Input label="Marca" required value={form.brand} onChange={(e) => set('brand', e.target.value)} error={errors.brand} placeholder="Samsung" />
            <Input label="Modelo" required value={form.model} onChange={(e) => set('model', e.target.value)} error={errors.model} placeholder="Galaxy A54" />
            <Input label="IMEI / Serie" value={form.serial} onChange={(e) => set('serial', e.target.value)} placeholder="Opcional" />
            <Input label="Color" value={form.color} onChange={(e) => set('color', e.target.value)} placeholder="Negro" />
            <Input label="Desbloqueo" value={form.unlock} onChange={(e) => set('unlock', e.target.value)} placeholder="PIN o patrón" hint="Necesario para probar el equipo." />
          </div>
          <div className="mt-3 flex flex-wrap gap-4">
            {['Cargador', 'Funda', 'Caja', 'Cable', 'Mochila'].map((a) => (
              <Checkbox
                key={a}
                label={a}
                checked={form.accessories.includes(a)}
                onChange={(v) =>
                  set('accessories', v ? [...form.accessories, a] : form.accessories.filter((x) => x !== a))
                }
              />
            ))}
          </div>
        </fieldset>

        {/* Falla y asignación */}
        <fieldset className="border-0 p-0">
          <legend className="mb-3 text-[13.5px] font-bold text-strong">Falla y asignación</legend>
          <Textarea
            label="Falla reportada por el cliente"
            required
            rows={2}
            value={form.issue}
            onChange={(e) => set('issue', e.target.value)}
            error={errors.issue}
            placeholder="Ej. Se le cayó y la pantalla quedó con líneas de colores."
          />
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Select
              label="Prioridad"
              value={form.priority}
              onChange={(e) => set('priority', e.target.value as 'normal' | 'urgente')}
              options={[
                { value: 'normal', label: 'Normal' },
                { value: 'urgente', label: 'Urgente' },
              ]}
            />
            <Select
              label="Técnico asignado"
              value={form.technicianId}
              onChange={(e) => set('technicianId', e.target.value)}
              placeholder="Asignar después"
              options={db.staff.filter((s) => s.role === 'tecnico' && s.active).map((s) => ({ value: s.id, label: s.name }))}
            />
            <Input
              label="Fecha prometida"
              type="date"
              value={form.promised}
              onChange={(e) => set('promised', e.target.value)}
              error={errors.promised}
            />
          </div>
        </fieldset>

        {/* Checklist */}
        <fieldset className="border-0 p-0">
          <legend className="mb-1 text-[13.5px] font-bold text-strong">Estado en el que ingresa</legend>
          <p className="mb-3 text-[12.5px] text-dim">
            Marcá lo que funciona. Lo que quede sin marcar se registra como observación del ingreso.
          </p>
          <div className="grid gap-1 rounded-[11px] border border-line p-3 sm:grid-cols-2">
            {checkList.map((c) => (
              <Checkbox
                key={c.key}
                label={c.label}
                checked={Boolean(checks[c.key])}
                onChange={(v) => setChecks((prev) => ({ ...prev, [c.key]: v }))}
              />
            ))}
          </div>
          <Textarea
            label="Observaciones internas"
            className="mt-3"
            rows={2}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Ej. El cliente pide que le avisemos antes de las 12:00."
          />
        </fieldset>
      </div>
    </Modal>
  )
}

