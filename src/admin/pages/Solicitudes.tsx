import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Inbox, MessageCircle, Phone, Trash2 } from 'lucide-react'
import { useDemo } from '@/demo/store'
import { REQUEST_STATUS, type WebRequest } from '@/demo/types'
import { dmyHm, money, phone as fmtPhone, relative } from '@/lib/format'
import { matches } from '@/lib/utils'
import { waLink } from '@/lib/whatsapp'
import { Avatar, Badge, Button } from '@/components/ui/primitives'
import { SegmentedControl, Select } from '@/components/ui/form'
import { EmptyState, SearchInput, StatCard } from '@/components/ui/data'
import { ConfirmDialog, useToast } from '@/components/ui/overlay'
import { toneSoft } from '@/components/ui/tone'
import { PanelHeader } from '../AdminLayout'
import { CHANNEL_LABEL, PanelCard, RequestBadge } from '../shared'

type Filter = 'pendientes' | 'todas' | 'convertidas'

const TYPE_LABEL: Record<WebRequest['type'], string> = {
  reparacion: 'Reparación',
  producto: 'Producto',
  consulta: 'Consulta',
}

export function Solicitudes() {
  const { db, actions } = useDemo()
  const toast = useToast()
  const navigate = useNavigate()

  const [filter, setFilter] = useState<Filter>('pendientes')
  const [query, setQuery] = useState('')
  const [toDelete, setToDelete] = useState<WebRequest | null>(null)

  const list = useMemo(() => {
    let rows = db.requests
    if (filter === 'pendientes') rows = rows.filter((r) => ['nueva', 'contactado', 'agendada'].includes(r.status))
    else if (filter === 'convertidas') rows = rows.filter((r) => r.status === 'convertida')
    return rows.filter((r) => matches([r.name, r.phone, r.deviceLabel, r.productName, r.issue], query))
  }, [db.requests, filter, query])

  const nuevas = db.requests.filter((r) => r.status === 'nueva').length
  const convertidas = db.requests.filter((r) => r.status === 'convertida').length
  const conversion = db.requests.length ? (convertidas / db.requests.length) * 100 : 0

  return (
    <>
      <PanelHeader
        title="Solicitudes desde la web"
        description="Cada formulario del sitio público cae acá. Responder rápido es la diferencia entre ganar y perder el trabajo."
        actions={
          <SegmentedControl<Filter>
            value={filter}
            onChange={setFilter}
            size="sm"
            options={[
              { value: 'pendientes', label: 'Pendientes' },
              { value: 'convertidas', label: 'Convertidas' },
              { value: 'todas', label: 'Todas' },
            ]}
          />
        }
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Sin responder" value={nuevas} tone="blue" icon={<Inbox size={16} />} alert={nuevas > 0} />
        <StatCard label="Convertidas en orden" value={convertidas} tone="mint" />
        <StatCard label="Tasa de conversión" value={`${Math.round(conversion)}%`} tone="navy" hint="Del total de solicitudes recibidas" />
        <StatCard label="Total histórico" value={db.requests.length} tone="slate" />
      </section>

      <div className="mb-4">
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar por nombre, teléfono o equipo…" className="max-w-md" />
      </div>

      {list.length === 0 ? (
        <div className="rounded-[14px] border border-line bg-card">
          <EmptyState
            icon={<Inbox size={24} />}
            title={filter === 'pendientes' ? 'No hay solicitudes pendientes' : 'Sin resultados'}
            description={
              filter === 'pendientes'
                ? 'Todas las consultas que llegaron por la web ya fueron atendidas. Buen trabajo.'
                : 'Probá con otro filtro o limpiando la búsqueda.'
            }
          />
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {list.map((r) => (
            <li key={r.id}>
              <article className="flex h-full flex-col rounded-[14px] border border-line bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <Avatar name={r.name} tone={r.status === 'nueva' ? 'blue' : 'slate'} size={38} />
                    <div className="min-w-0">
                      <p className="truncate text-[14.5px] font-bold text-strong">{r.name}</p>
                      <p className="text-[12.5px] text-dim">
                        {fmtPhone(r.phone)} · {CHANNEL_LABEL[r.source]} · {relative(r.createdAt)}
                      </p>
                    </div>
                  </div>
                  <RequestBadge status={r.status} />
                </div>

                <div className="mt-3.5 flex flex-wrap items-center gap-2">
                  <Badge tone={r.type === 'reparacion' ? 'navy' : r.type === 'producto' ? 'mint' : 'slate'}>
                    {TYPE_LABEL[r.type]}
                  </Badge>
                  {r.deviceLabel && <span className="text-[13px] font-semibold text-strong">{r.deviceLabel}</span>}
                  {r.productName && <span className="text-[13px] font-semibold text-strong">{r.productName}</span>}
                </div>

                {r.issue && (
                  <p className="mt-2.5 flex-1 rounded-[10px] bg-muted/70 p-3 text-[13px] leading-relaxed text-body">
                    “{r.issue}”
                  </p>
                )}

                <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px]">
                  {r.preferredSlot && (
                    <div className="flex gap-1.5">
                      <dt className="text-dim">Prefiere:</dt>
                      <dd className="font-semibold text-strong">{r.preferredSlot}</dd>
                    </div>
                  )}
                  {r.estimate && (
                    <div className="flex gap-1.5">
                      <dt className="text-dim">Estimado web:</dt>
                      <dd className="font-semibold text-strong">{money(r.estimate)}</dd>
                    </div>
                  )}
                  <div className="flex gap-1.5">
                    <dt className="text-dim">Recibida:</dt>
                    <dd className="text-body">{dmyHm(r.createdAt)}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3.5">
                  <Button
                    size="sm"
                    variant="whatsapp"
                    icon={<MessageCircle size={14} />}
                    href={waLink(
                      `Hola ${r.name.split(' ')[0]}, te escribimos de Planet Service por tu consulta${
                        r.deviceLabel ? ` sobre tu ${r.deviceLabel}` : ''
                      }.`,
                    )}
                    external
                    onClick={() => r.status === 'nueva' && actions.updateRequest(r.id, { status: 'contactado' })}
                  >
                    Responder
                  </Button>
                  <Button size="sm" variant="secondary" href={`tel:${r.phone}`} icon={<Phone size={14} />}>
                    Llamar
                  </Button>

                  {r.status !== 'convertida' && r.type === 'reparacion' && (
                    <Button
                      size="sm"
                      icon={<ArrowRight size={14} />}
                      onClick={() => {
                        const orderId = actions.convertRequestToOrder(r.id)
                        toast('Orden creada desde la solicitud', {
                          tone: 'mint',
                          detail: 'Se registró el cliente y el equipo entró al taller.',
                        })
                        if (orderId) navigate(`/panel/ordenes/${orderId}`)
                      }}
                    >
                      Crear orden
                    </Button>
                  )}

                  <Select
                    value={r.status}
                    onChange={(e) => {
                      actions.updateRequest(r.id, { status: e.target.value as WebRequest['status'] })
                      toast('Solicitud actualizada', { tone: 'blue' })
                    }}
                    aria-label="Cambiar estado de la solicitud"
                    className="!h-9 !text-[12.5px]"
                    wrapClassName="ml-auto min-w-[140px]"
                    options={(Object.keys(REQUEST_STATUS) as WebRequest['status'][]).map((s) => ({
                      value: s,
                      label: REQUEST_STATUS[s].label,
                    }))}
                  />
                  <button
                    onClick={() => setToDelete(r)}
                    aria-label={`Eliminar solicitud de ${r.name}`}
                    className="flex size-9 items-center justify-center rounded-[9px] border border-line-strong text-dim transition-colors hover:border-danger hover:text-danger"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      <PanelCard
        className="mt-6"
        title="Por qué esto importa"
        subtitle="El argumento comercial detrás de esta pantalla"
      >
        <p className="text-[13.5px] leading-relaxed text-body">
          Las consultas que llegan por Instagram o WhatsApp se pierden entre mensajes personales. Acá cada
          pedido queda con nombre, teléfono, equipo y estado, y en un clic se convierte en una orden de taller
          con el cliente ya cargado. Nada se responde “mañana” por olvido.
        </p>
        <p className="mt-3 rounded-[10px] p-3 text-[12.5px] leading-relaxed" style={toneSoft('blue', 8)}>
          Probalo: entrá al sitio público, completá el formulario de <strong className="font-semibold">Pedir presupuesto</strong> y
          volvé acá. La solicitud aparece al instante.
        </p>
      </PanelCard>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            actions.deleteRequest(toDelete.id)
            toast('Solicitud eliminada', { tone: 'danger' })
          }
        }}
        title="Eliminar solicitud"
        confirmLabel="Eliminar"
        message={`Se va a borrar la solicitud de ${toDelete?.name}. Esta acción no se puede deshacer.`}
      />
    </>
  )
}
