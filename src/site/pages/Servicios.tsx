import { useState } from 'react'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { useDemo } from '@/demo/store'
import { usePageMeta } from '@/lib/seo'
import { waLink, waMessages } from '@/lib/whatsapp'
import { BRAND_CONFIG } from '@/config/brand'
import { Button } from '@/components/ui/primitives'
import { SegmentedControl } from '@/components/ui/form'
import { EmptyState } from '@/components/ui/data'
import { CtaBand, ServiceCard } from '../components'
import { Faq, Process } from '../sections/blocks'
import { PageHeader } from './shared'

type Filter = 'todos' | 'celular' | 'notebook' | 'pc' | 'general'

export function Servicios() {
  usePageMeta({
    title: 'Servicios de reparación de celulares, notebooks y PC',
    description:
      'Cambio de pantalla, batería, pin de carga, reparación de placas, cambio a SSD, formateo y recuperación de datos en Asunción. Precios desde, plazos y garantía escrita.',
  })

  const { db } = useDemo()
  const [filter, setFilter] = useState<Filter>('todos')

  const services = db.services
    .filter((s) => s.published)
    .filter((s) => filter === 'todos' || s.category === filter)

  return (
    <>
      <PageHeader
        eyebrow="Servicio técnico"
        title="Todo lo que reparamos"
        description={`Precios de referencia, plazos reales y garantía de ${BRAND_CONFIG.warrantyDays} días por escrito. Si tu problema no está en la lista, escribinos: casi siempre hay solución.`}
      />

      <section className="container-x -mt-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SegmentedControl<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'todos', label: 'Todos' },
              { value: 'celular', label: 'Celulares' },
              { value: 'notebook', label: 'Notebooks' },
              { value: 'pc', label: 'PC' },
              { value: 'general', label: 'Otros' },
            ]}
          />
          <p className="text-[13px] text-dim">
            {services.length} {services.length === 1 ? 'servicio' : 'servicios'}
          </p>
        </div>

        {services.length === 0 ? (
          <EmptyState
            title="No hay servicios en esta categoría"
            description="Probá con otra categoría o escribinos y te asesoramos."
            action={
              <Button variant="whatsapp" href={waLink(waMessages.general())} external icon={<MessageCircle size={15} />}>
                Consultar
              </Button>
            }
          />
        ) : (
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        )}

        <p className="mt-7 rounded-[13px] border border-line bg-muted/60 p-4 text-[13px] leading-relaxed text-dim">
          <strong className="font-semibold text-strong">Los precios son de referencia.</strong> El valor final
          depende del modelo y de lo que muestre el diagnóstico, que hacemos sin cargo. Nunca trabajamos sobre
          un equipo sin que apruebes el presupuesto.
        </p>
      </section>

      <Process />
      <Faq />

      <CtaBand
        title="¿No sabés qué le pasa a tu equipo?"
        text="Traelo o escribinos. El diagnóstico es sin costo y te decimos con honestidad si conviene repararlo o cambiarlo."
        primary={
          <Button size="lg" to="/agendar" iconRight={<ArrowRight size={17} />}>
            Pedir presupuesto
          </Button>
        }
        secondary={
          <Button size="lg" variant="whatsapp" href={waLink(waMessages.general())} external icon={<MessageCircle size={17} />}>
            Escribir por WhatsApp
          </Button>
        }
      />
    </>
  )
}
