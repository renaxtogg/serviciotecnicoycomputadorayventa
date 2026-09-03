import { ArrowRight, MessageCircle } from 'lucide-react'
import { BRAND_CONFIG } from '@/config/brand'
import { useDemo } from '@/demo/store'
import { usePageMeta } from '@/lib/seo'
import { waLink, waMessages } from '@/lib/whatsapp'
import { Button, SectionTitle } from '@/components/ui/primitives'
import { Skeleton } from '@/components/ui/data'
import { Hero } from '../sections/Hero'
import { QuoteWizard } from '../sections/QuoteWizard'
import { Differentiators, Faq, LocationBlock, Process, Testimonials, ValueProps } from '../sections/blocks'
import { CtaBand, ProductCard, ServiceCard } from '../components'

export function Home() {
  usePageMeta({
    title: BRAND_CONFIG.seo.defaultTitle,
    description: BRAND_CONFIG.seo.defaultDescription,
  })

  const { db, ready } = useDemo()
  const services = db.services.filter((s) => s.published).slice(0, 6)
  const products = db.products.filter((p) => p.published && p.featured).slice(0, 4)

  return (
    <>
      <Hero />
      <ValueProps />

      {/* ---------------------------------------------------------- SERVICIOS */}
      <section className="container-x my-20">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <SectionTitle
            eyebrow="Servicio técnico"
            title="Lo que más nos traen al taller"
            description="Reparamos celulares, notebooks y PC. Todos los trabajos salen con garantía escrita y presupuesto aprobado por vos."
          />
          <Button variant="secondary" to="/servicios" iconRight={<ArrowRight size={15} />}>
            Ver todos los servicios
          </Button>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {!ready
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[300px] rounded-[15px]" />)
            : services.map((s) => <ServiceCard key={s.id} service={s} />)}
        </div>
      </section>

      <QuoteWizard />
      <Process />

      {/* ------------------------------------------------------------ TIENDA */}
      <section className="bg-muted/70 py-20">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <SectionTitle
              eyebrow="Tienda"
              title="También vendemos equipos"
              description="Celulares, notebooks, PC armadas y accesorios. Todo lo que vendemos lo revisamos nosotros y lo respaldamos con nuestro propio taller."
            />
            <Button variant="secondary" to="/tienda" iconRight={<ArrowRight size={15} />}>
              Ver la tienda completa
            </Button>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {!ready
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[380px] rounded-[15px]" />)
              : products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      <Differentiators />
      <Testimonials />
      <Faq />
      <LocationBlock />

      <CtaBand
        title="Traé tu equipo hoy y llevate el diagnóstico sin costo"
        text="Revisamos el equipo, te decimos exactamente qué tiene y cuánto cuesta arreglarlo. Vos decidís después."
        primary={
          <Button size="lg" to="/agendar" iconRight={<ArrowRight size={17} />}>
            Pedir presupuesto
          </Button>
        }
        secondary={
          <Button
            size="lg"
            variant="whatsapp"
            href={waLink(waMessages.general())}
            external
            icon={<MessageCircle size={17} />}
          >
            Escribir por WhatsApp
          </Button>
        }
      />
    </>
  )
}
