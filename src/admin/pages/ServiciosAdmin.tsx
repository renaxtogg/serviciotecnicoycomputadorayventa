import { useState } from 'react'
import { ExternalLink, Eye, EyeOff, Globe, Pencil, Plus, Trash2 } from 'lucide-react'
import { useDemo } from '@/demo/store'
import type { ServiceItem } from '@/demo/types'
import { money } from '@/lib/format'
import { Badge, Button } from '@/components/ui/primitives'
import { Checkbox, Input, MoneyInput, Select, Textarea } from '@/components/ui/form'
import { EmptyState, StatCard } from '@/components/ui/data'
import { ConfirmDialog, Modal, useToast } from '@/components/ui/overlay'
import { toneSoft } from '@/components/ui/tone'
import { ServiceIcon } from '@/site/components'
import { PanelHeader } from '../AdminLayout'
import { PanelCard } from '../shared'

const CATEGORY_LABEL: Record<ServiceItem['category'], string> = {
  celular: 'Celulares',
  notebook: 'Notebooks',
  pc: 'PC de escritorio',
  general: 'General',
}

const ICON_OPTIONS = [
  'smartphone', 'battery', 'plug', 'droplet', 'refresh', 'database',
  'hard-drive', 'memory', 'wind', 'monitor', 'cpu', 'pc', 'building',
]

const EMPTY: Omit<ServiceItem, 'id'> = {
  name: '', category: 'celular', description: '', fromPrice: 0,
  etaHours: 24, warrantyDays: 90, icon: 'smartphone', published: true, popular: false,
}

export function ServiciosAdmin() {
  const { db, actions } = useDemo()
  const toast = useToast()
  const [editing, setEditing] = useState<ServiceItem | 'new' | null>(null)
  const [toDelete, setToDelete] = useState<ServiceItem | null>(null)

  const published = db.services.filter((s) => s.published)
  const popular = db.services.filter((s) => s.popular)
  const avgPrice = published.length
    ? published.reduce((a, s) => a + s.fromPrice, 0) / published.length
    : 0

  return (
    <>
      <PanelHeader
        title="Servicios publicados en la web"
        description="Esta es la lista de precios que ven tus clientes en el sitio. Lo que cambies acá se actualiza en la web al instante."
        actions={
          <>
            <Button size="sm" variant="secondary" href="/servicios" icon={<ExternalLink size={15} />}>
              Ver en el sitio
            </Button>
            <Button size="sm" onClick={() => setEditing('new')} icon={<Plus size={15} />}>
              Nuevo servicio
            </Button>
          </>
        }
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Servicios publicados" value={published.length} tone="mint" icon={<Globe size={16} />} hint={`de ${db.services.length} cargados`} />
        <StatCard label="Marcados como populares" value={popular.length} tone="blue" hint="Se destacan con una etiqueta" />
        <StatCard label="Precio promedio 'desde'" value={money(avgPrice, { compact: true })} tone="navy" />
        <StatCard label="Ocultos al público" value={db.services.length - published.length} tone="slate" />
      </section>

      <PanelCard
        className="mb-5"
        title="Cómo funciona"
        subtitle="El argumento comercial de esta pantalla"
      >
        <p className="text-[13.5px] leading-relaxed text-body">
          El dueño actualiza precios desde acá, sin llamar a nadie ni pagar por cada cambio. Si sube el precio
          del módulo de pantalla, lo edita y en dos segundos la web muestra el valor nuevo.
        </p>
      </PanelCard>

      {db.services.length === 0 ? (
        <div className="rounded-[14px] border border-line bg-card">
          <EmptyState
            icon={<Globe size={24} />}
            title="Todavía no hay servicios cargados"
            description="Cargá los trabajos que hacés con su precio de referencia para que aparezcan en el sitio."
            action={<Button onClick={() => setEditing('new')}>Crear el primero</Button>}
          />
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {db.services.map((s) => (
            <li key={s.id}>
              <article
                className={`flex h-full flex-col rounded-[14px] border bg-card p-4 ${
                  s.published ? 'border-line' : 'border-dashed border-line-strong opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 items-center justify-center rounded-[11px]" style={toneSoft('blue', 11)}>
                    <ServiceIcon name={s.icon} />
                  </span>
                  <span className="flex flex-wrap justify-end gap-1.5">
                    {s.popular && <Badge tone="mint">Popular</Badge>}
                    <Badge tone={s.published ? 'blue' : 'slate'} icon={s.published ? <Eye size={11} /> : <EyeOff size={11} />}>
                      {s.published ? 'Publicado' : 'Oculto'}
                    </Badge>
                  </span>
                </div>

                <h2 className="mt-3.5 text-[15px] font-bold leading-snug text-strong">{s.name}</h2>
                <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-dim">{s.description}</p>

                <dl className="mt-3.5 flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-3.5 text-[12.5px]">
                  <div>
                    <dt className="text-[10.5px] font-bold uppercase tracking-wide text-dim">Desde</dt>
                    <dd className="text-[15px] font-extrabold tabular-nums text-strong">{money(s.fromPrice)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10.5px] font-bold uppercase tracking-wide text-dim">Plazo</dt>
                    <dd className="font-semibold text-body">
                      {s.etaHours <= 24 ? `${s.etaHours} h` : `${Math.round(s.etaHours / 24)} días`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10.5px] font-bold uppercase tracking-wide text-dim">Garantía</dt>
                    <dd className="font-semibold text-body">{s.warrantyDays ? `${s.warrantyDays} días` : 'Sin garantía'}</dd>
                  </div>
                  <div>
                    <dt className="text-[10.5px] font-bold uppercase tracking-wide text-dim">Categoría</dt>
                    <dd className="font-semibold text-body">{CATEGORY_LABEL[s.category]}</dd>
                  </div>
                </dl>

                <div className="mt-3.5 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setEditing(s)}
                    icon={<Pencil size={14} />}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      actions.updateService(s.id, { published: !s.published })
                      toast(s.published ? 'Servicio ocultado del sitio' : 'Servicio publicado en el sitio', {
                        tone: s.published ? 'amber' : 'mint',
                      })
                    }}
                    icon={s.published ? <EyeOff size={14} /> : <Eye size={14} />}
                  >
                    {s.published ? 'Ocultar' : 'Publicar'}
                  </Button>
                  <button
                    onClick={() => setToDelete(s)}
                    aria-label={`Eliminar ${s.name}`}
                    className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-line-strong text-dim transition-colors hover:border-danger hover:text-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      <ServiceModal
        service={editing}
        onClose={() => setEditing(null)}
        onSaved={(name, isNew) =>
          toast(isNew ? `${name} creado` : `${name} actualizado`, {
            tone: 'mint',
            detail: 'El sitio público ya muestra el cambio.',
          })
        }
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            actions.deleteService(toDelete.id)
            toast(`${toDelete.name} eliminado`, { tone: 'danger' })
          }
        }}
        title="Eliminar servicio"
        confirmLabel="Eliminar"
        message={`“${toDelete?.name}” va a desaparecer del sitio público y de esta lista.`}
      />
    </>
  )
}

function ServiceModal({
  service, onClose, onSaved,
}: {
  service: ServiceItem | 'new' | null
  onClose: () => void
  onSaved: (name: string, isNew: boolean) => void
}) {
  const { actions } = useDemo()
  const isNew = service === 'new'
  const current = service && service !== 'new' ? service : null

  const [form, setForm] = useState<Omit<ServiceItem, 'id'>>(current ?? EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [key, setKey] = useState('')

  const currentKey = service === 'new' ? 'new' : (service?.id ?? '')
  if (currentKey !== key && service) {
    setKey(currentKey)
    setForm(current ?? EMPTY)
    setErrors({})
  }

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <Modal
      open={Boolean(service)}
      onClose={onClose}
      title={isNew ? 'Nuevo servicio' : 'Editar servicio'}
      description="Lo que cargues acá se muestra tal cual en la página de servicios del sitio."
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
              if (form.name.trim().length < 3) e.name = 'Poné un nombre claro para el cliente.'
              if (form.description.trim().length < 15) e.description = 'Explicá en una o dos frases qué incluye.'
              if (form.fromPrice <= 0) e.fromPrice = 'El precio de referencia debe ser mayor a cero.'
              if (form.etaHours <= 0) e.etaHours = 'Indicá el plazo en horas.'
              if (form.warrantyDays < 0) e.warrantyDays = 'La garantía no puede ser negativa.'
              setErrors(e)
              if (Object.keys(e).length > 0) return

              const payload = { ...form, name: form.name.trim(), description: form.description.trim() }
              if (isNew) actions.createService(payload)
              else if (current) actions.updateService(current.id, payload)
              onSaved(payload.name, isNew)
              onClose()
            }}
          >
            {isNew ? 'Crear servicio' : 'Guardar cambios'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Nombre del servicio" required value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} placeholder="Cambio de pantalla" />
        <Textarea
          label="Descripción para el cliente"
          required
          rows={3}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          error={errors.description}
          placeholder="Módulo completo con garantía. Cambiamos pantallas de iPhone, Samsung y Xiaomi el mismo día."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <MoneyInput label="Precio desde" value={form.fromPrice} onValueChange={(v) => set('fromPrice', v)} error={errors.fromPrice} required />
          <Select
            label="Categoría"
            value={form.category}
            onChange={(e) => set('category', e.target.value as ServiceItem['category'])}
            options={(Object.keys(CATEGORY_LABEL) as ServiceItem['category'][]).map((c) => ({
              value: c,
              label: CATEGORY_LABEL[c],
            }))}
          />
          <Input label="Plazo (horas)" type="number" min={1} value={form.etaHours} onChange={(e) => set('etaHours', Number(e.target.value) || 0)} error={errors.etaHours} hint="6 = mismo día, 48 = dos días." />
          <Input label="Garantía (días)" type="number" min={0} value={form.warrantyDays} onChange={(e) => set('warrantyDays', Number(e.target.value) || 0)} error={errors.warrantyDays} />
        </div>
        <Select
          label="Ícono"
          value={form.icon}
          onChange={(e) => set('icon', e.target.value)}
          options={ICON_OPTIONS.map((i) => ({ value: i, label: i }))}
        />
        <div className="rounded-[11px] border border-line p-3.5">
          <Checkbox
            label="Publicar en el sitio web"
            description="Si lo desmarcás, el servicio deja de mostrarse a los clientes."
            checked={form.published}
            onChange={(v) => set('published', v)}
          />
          <Checkbox
            label="Marcar como “Más pedido”"
            description="Le agrega una etiqueta destacada en la web."
            checked={form.popular}
            onChange={(v) => set('popular', v)}
          />
        </div>
      </div>
    </Modal>
  )
}
