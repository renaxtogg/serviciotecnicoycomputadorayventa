import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useDemo } from '@/demo/store'
import { technicianStats } from '@/demo/metrics'
import { ROLE_LABEL, type Staff, type StaffRole, type Tone } from '@/demo/types'
import { dmy, money } from '@/lib/format'
import { Avatar, Badge, Button } from '@/components/ui/primitives'
import { Input, Select, Switch } from '@/components/ui/form'
import { EmptyState, ProgressBar } from '@/components/ui/data'
import { HBarChart } from '@/components/ui/charts'
import { ConfirmDialog, Modal, useToast } from '@/components/ui/overlay'
import { PanelHeader } from '../AdminLayout'
import { PanelCard } from '../shared'

const TONES: Tone[] = ['blue', 'navy', 'mint', 'amber', 'slate']

export function Equipo() {
  const { db, actions } = useDemo()
  const toast = useToast()
  const [editing, setEditing] = useState<Staff | 'new' | null>(null)
  const [toDelete, setToDelete] = useState<Staff | null>(null)

  const stats = useMemo(() => technicianStats(db), [db])
  const maxIncome = Math.max(...stats.map((s) => s.incomeMonth), 1)

  const sellers = useMemo(
    () =>
      db.staff
        .filter((s) => ['vendedor', 'admin', 'recepcion'].includes(s.role))
        .map((s) => {
          const sales = db.sales.filter(
            (v) => v.sellerId === s.id && v.status === 'pagada' && new Date(v.date).getMonth() === new Date().getMonth(),
          )
          return { staff: s, count: sales.length, total: sales.reduce((a, v) => a + v.total, 0) }
        })
        .sort((a, b) => b.total - a.total),
    [db.staff, db.sales],
  )

  return (
    <>
      <PanelHeader
        title="Equipo"
        description="Quién hace qué, cuánta carga tiene cada técnico y cuánto genera cada uno."
        actions={
          <Button size="sm" onClick={() => setEditing('new')} icon={<Plus size={15} />}>
            Agregar persona
          </Button>
        }
      />

      {/* ------------------------------------------ Rendimiento de técnicos */}
      <PanelCard
        className="mb-5"
        title="Rendimiento del taller este mes"
        subtitle="Órdenes entregadas, facturación generada y tiempo promedio de reparación"
      >
        {stats.length === 0 ? (
          <EmptyState compact title="Sin técnicos cargados" description="Agregá al menos un técnico para poder asignar órdenes." />
        ) : (
          <ul className="flex flex-col gap-4">
            {stats.map((s) => (
              <li key={s.tech.id} className="flex flex-wrap items-center gap-4 border-b border-line/70 pb-4 last:border-0 last:pb-0">
                <Avatar name={s.tech.name} tone={s.tech.tone} size={40} />
                <div className="min-w-[150px] flex-1">
                  <p className="text-[14px] font-bold text-strong">{s.tech.name}</p>
                  <p className="text-[12.5px] text-dim">{s.tech.specialty}</p>
                </div>

                <dl className="flex flex-wrap gap-x-6 gap-y-2">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-dim">Abiertas</dt>
                    <dd className="text-[15px] font-bold tabular-nums text-strong">{s.openCount}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-dim">Entregadas</dt>
                    <dd className="text-[15px] font-bold tabular-nums text-strong">{s.doneMonth}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-dim">Promedio</dt>
                    <dd className="text-[15px] font-bold tabular-nums text-strong">
                      {s.avgDays ? `${s.avgDays.toFixed(1)} d` : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-dim">Generado</dt>
                    <dd className="text-[15px] font-bold tabular-nums text-strong">
                      {money(s.incomeMonth, { compact: true })}
                    </dd>
                  </div>
                </dl>

                <div className="w-full min-w-[140px] flex-1 sm:w-auto">
                  <ProgressBar value={s.incomeMonth} max={maxIncome} tone={s.tech.tone} />
                </div>

                {s.overdue > 0 && <Badge tone="danger">{s.overdue} atrasadas</Badge>}
              </li>
            ))}
          </ul>
        )}
      </PanelCard>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* ------------------------------------------------------- Personas */}
        <PanelCard title="Personal" subtitle={`${db.staff.filter((s) => s.active).length} activos de ${db.staff.length}`} bodyClassName="p-3">
          <ul className="flex flex-col gap-2">
            {db.staff.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center gap-3 rounded-[11px] border border-line p-3"
              >
                <Avatar name={s.name} tone={s.tone} size={38} />
                <div className="min-w-[130px] flex-1">
                  <p className="text-[13.5px] font-bold text-strong">{s.name}</p>
                  <p className="text-[12px] text-dim">
                    {s.specialty ?? ROLE_LABEL[s.role]} · desde {dmy(s.since)}
                  </p>
                </div>
                <Badge tone={s.role === 'admin' ? 'navy' : s.role === 'tecnico' ? 'blue' : 'slate'}>
                  {ROLE_LABEL[s.role]}
                </Badge>
                <Badge tone={s.active ? 'mint' : 'slate'} dot>
                  {s.active ? 'Activo' : 'Inactivo'}
                </Badge>
                <span className="flex gap-1.5">
                  <button
                    onClick={() => setEditing(s)}
                    aria-label={`Editar ${s.name}`}
                    className="flex size-8 items-center justify-center rounded-lg border border-line-strong text-dim transition-colors hover:border-brand hover:text-brand"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setToDelete(s)}
                    aria-label={`Eliminar ${s.name}`}
                    className="flex size-8 items-center justify-center rounded-lg border border-line-strong text-dim transition-colors hover:border-danger hover:text-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </PanelCard>

        {/* ------------------------------------------------------- Mostrador */}
        <PanelCard title="Ventas por vendedor" subtitle="Facturación del mes en el mostrador">
          <HBarChart
            data={sellers.map((s) => ({ label: s.staff.name, value: s.total, meta: `${s.count} ventas` }))}
            emptyLabel="Todavía no hubo ventas este mes."
          />
        </PanelCard>
      </div>

      <StaffModal
        staff={editing}
        onClose={() => setEditing(null)}
        onSaved={(name, isNew) => toast(isNew ? `${name} agregado al equipo` : `${name} actualizado`, { tone: 'mint' })}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            actions.deleteStaff(toDelete.id)
            toast(`${toDelete.name} eliminado del equipo`, { tone: 'danger' })
          }
        }}
        title="Eliminar del equipo"
        confirmLabel="Eliminar"
        message={`Se va a quitar a ${toDelete?.name}. Las órdenes que tenía asignadas quedan sin técnico.`}
      />
    </>
  )
}

function StaffModal({
  staff, onClose, onSaved,
}: {
  staff: Staff | 'new' | null
  onClose: () => void
  onSaved: (name: string, isNew: boolean) => void
}) {
  const { actions } = useDemo()
  const isNew = staff === 'new'
  const current = staff && staff !== 'new' ? staff : null

  const [form, setForm] = useState({
    name: current?.name ?? '',
    role: current?.role ?? ('tecnico' as StaffRole),
    specialty: current?.specialty ?? '',
    phone: current?.phone ?? '',
    active: current?.active ?? true,
    tone: current?.tone ?? ('blue' as Tone),
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [key, setKey] = useState('')

  // Rehidrata el formulario cuando cambia la persona seleccionada
  const currentKey = staff === 'new' ? 'new' : (staff?.id ?? '')
  if (currentKey !== key && staff) {
    setKey(currentKey)
    setForm({
      name: current?.name ?? '',
      role: current?.role ?? 'tecnico',
      specialty: current?.specialty ?? '',
      phone: current?.phone ?? '',
      active: current?.active ?? true,
      tone: current?.tone ?? 'blue',
    })
    setErrors({})
  }

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <Modal
      open={Boolean(staff)}
      onClose={onClose}
      title={isNew ? 'Agregar al equipo' : 'Editar persona'}
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
              if (form.name.trim().length < 3) e.name = 'El nombre es obligatorio.'
              if (form.phone.replace(/\D/g, '').length < 9) e.phone = 'Teléfono inválido.'
              setErrors(e)
              if (Object.keys(e).length > 0) return

              const payload = {
                name: form.name.trim(),
                role: form.role,
                specialty: form.specialty.trim() || undefined,
                phone: form.phone.trim(),
                active: form.active,
                tone: form.tone,
              }
              if (isNew) actions.createStaff({ ...payload, since: new Date().toISOString() })
              else if (current) actions.updateStaff(current.id, payload)
              onSaved(payload.name, isNew)
              onClose()
            }}
          >
            {isNew ? 'Agregar' : 'Guardar'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Nombre y apellido" required value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Rol"
            value={form.role}
            onChange={(e) => set('role', e.target.value as StaffRole)}
            options={(Object.keys(ROLE_LABEL) as StaffRole[]).map((r) => ({ value: r, label: ROLE_LABEL[r] }))}
          />
          <Input label="Teléfono" required value={form.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} placeholder="0981 234 567" />
        </div>
        <Input
          label="Especialidad"
          value={form.specialty}
          onChange={(e) => set('specialty', e.target.value)}
          placeholder="Ej. Micro-soldadura y placas"
          hint="Sirve para asignar el trabajo a la persona correcta."
        />
        <Select
          label="Color en el panel"
          value={form.tone}
          onChange={(e) => set('tone', e.target.value as Tone)}
          options={TONES.map((t) => ({
            value: t,
            label: { blue: 'Azul', navy: 'Azul oscuro', mint: 'Verde', amber: 'Ámbar', slate: 'Gris', danger: 'Rojo' }[t],
          }))}
        />
        <Switch
          label="Activo"
          description="Los inactivos no aparecen para asignar órdenes ni ventas."
          checked={form.active}
          onChange={(v) => set('active', v)}
        />
      </div>
    </Modal>
  )
}

