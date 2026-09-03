import { useState } from 'react'
import {
  Clock, ExternalLink, Mail, MapPin, MessageCircle, Minus, Phone, Plus, Quote, Star,
} from 'lucide-react'
import { BRAND_CONFIG } from '@/config/brand'
import { DIFFERENTIATORS, FAQ, PROCESS_STEPS, VALUE_PROPS } from '@/config/content'
import { TESTIMONIALS } from '@/demo/catalog'
import { cn } from '@/lib/utils'
import { waLink, waMessages } from '@/lib/whatsapp'
import { Button, SectionTitle } from '@/components/ui/primitives'
import { toneSoft } from '@/components/ui/tone'
import { VALUE_ICONS } from '../components'

/* ================================================== PROPUESTA DE VALOR ==== */
export function ValueProps() {
  return (
    <section className="container-x -mt-8 grid gap-4 sm:grid-cols-3 lg:-mt-12">
      {VALUE_PROPS.map((v, i) => (
        <article
          key={v.title}
          className="anim-fade-up rounded-[15px] border border-line bg-card p-5 shadow-[var(--shadow-sm)]"
          style={{ animationDelay: `${i * 70}ms` }}
        >
          <span className="flex size-11 items-center justify-center rounded-[12px]" style={toneSoft('blue', 11)}>
            {VALUE_ICONS[v.icon]}
          </span>
          <h3 className="mt-4 text-[15.5px] font-bold leading-snug text-strong">{v.title}</h3>
          <p className="mt-2 text-[13.5px] leading-relaxed text-dim">{v.text}</p>
        </article>
      ))}
    </section>
  )
}

/* ============================================================== PROCESO === */
export function Process() {
  return (
    <section className="container-x my-20">
      <SectionTitle
        eyebrow="Cómo trabajamos"
        title="Cuatro pasos y ninguna sorpresa"
        description="El desorden y la falta de información son lo que más molesta al dejar un equipo. Por eso el proceso es siempre el mismo y lo ves de punta a punta."
      />
      <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PROCESS_STEPS.map((s, i) => (
          <li key={s.step} className="relative">
            {i < PROCESS_STEPS.length - 1 && (
              <span
                className="absolute right-[-14px] top-6 hidden h-px w-7 bg-line-strong lg:block"
                aria-hidden
              />
            )}
            <div className="flex h-full flex-col rounded-[15px] border border-line bg-card p-5">
              <span className="text-[26px] font-extrabold leading-none tracking-tight text-brand/25">
                {s.step}
              </span>
              <h3 className="mt-3 text-[15.5px] font-bold leading-snug text-strong">{s.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-dim">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

/* ======================================================= DIFERENCIADORES == */
export function Differentiators() {
  return (
    <section className="bg-muted/70 py-20">
      <div className="container-x grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <SectionTitle
          eyebrow="Por qué nosotros"
          title="Lo que un service común no hace"
          description="Hay muchos lugares que cambian una pantalla. Lo que nos diferencia es lo que pasa alrededor de esa reparación."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {DIFFERENTIATORS.map((d) => (
            <article key={d.title} className="rounded-[14px] border border-line bg-card p-5">
              <h3 className="text-[14.5px] font-bold text-strong">{d.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-dim">{d.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ========================================================== TESTIMONIOS === */
export function Testimonials() {
  return (
    <section className="container-x my-20">
      <SectionTitle
        eyebrow="Lo que dicen"
        title="Clientes que volvieron y recomendaron"
        align="center"
      />
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <figure key={t.name} className="flex flex-col rounded-[15px] border border-line bg-card p-5">
            <Quote size={22} className="text-brand/25" aria-hidden />
            <blockquote className="mt-3 flex-1 text-[13.5px] leading-relaxed text-body">
              “{t.text}”
            </blockquote>
            <figcaption className="mt-5 border-t border-line pt-4">
              <span className="mb-1.5 flex gap-0.5" aria-label={`${t.rating} de 5 estrellas`}>
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={12} className="fill-warn text-warn" aria-hidden />
                ))}
              </span>
              <p className="text-[13.5px] font-bold text-strong">{t.name}</p>
              <p className="mt-0.5 text-[12px] text-dim">
                {t.role} · {t.service}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

/* ================================================================= FAQ ==== */
export function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section className="container-x my-20 grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
      <div className="lg:sticky lg:top-24">
        <SectionTitle
          eyebrow="Preguntas frecuentes"
          title="Lo que todos preguntan antes de venir"
          description="Si tu duda no está acá, escribinos por WhatsApp y te contestamos en el momento."
        />
        <Button
          variant="whatsapp"
          className="mt-6"
          href={waLink(waMessages.general())}
          external
          icon={<MessageCircle size={16} />}
        >
          Hacer una consulta
        </Button>
      </div>

      <dl className="divide-y divide-line overflow-hidden rounded-[15px] border border-line bg-card">
        {FAQ.map((item, i) => {
          const isOpen = open === i
          return (
            <div key={item.q}>
              <dt>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50"
                >
                  <span className="text-[14.5px] font-semibold text-strong">{item.q}</span>
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-full transition-colors',
                      isOpen ? 'bg-brand text-white' : 'bg-muted text-dim',
                    )}
                    aria-hidden
                  >
                    {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                  </span>
                </button>
              </dt>
              {isOpen && (
                <dd className="anim-fade-in px-5 pb-5 pr-16 text-[13.5px] leading-relaxed text-dim">
                  {item.a}
                </dd>
              )}
            </div>
          )
        })}
      </dl>
    </section>
  )
}

/* ============================================================ UBICACIÓN === */
export function LocationBlock() {
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${
    BRAND_CONFIG.coords.lng - 0.006
  }%2C${BRAND_CONFIG.coords.lat - 0.004}%2C${BRAND_CONFIG.coords.lng + 0.006}%2C${
    BRAND_CONFIG.coords.lat + 0.004
  }&layer=mapnik&marker=${BRAND_CONFIG.coords.lat}%2C${BRAND_CONFIG.coords.lng}`

  return (
    <section className="container-x my-20">
      <div className="overflow-hidden rounded-[18px] border border-line bg-card">
        <div className="grid lg:grid-cols-2">
          <div className="p-6 sm:p-9">
            <SectionTitle eyebrow="Dónde estamos" title="Pasá por el local" />
            <p className="mt-4 text-[14px] leading-relaxed text-dim">
              Estamos sobre avenida, con estacionamiento en la puerta. Traé el equipo y en 15 minutos te
              decimos qué tiene.
            </p>

            <ul className="mt-7 flex flex-col gap-4">
              <li className="flex gap-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px]" style={toneSoft('blue', 11)}>
                  <MapPin size={16} />
                </span>
                <div>
                  <p className="text-[13.5px] font-bold text-strong">Dirección</p>
                  <p className="mt-0.5 text-[13.5px] text-dim">
                    {BRAND_CONFIG.address}
                    <br />
                    {BRAND_CONFIG.neighborhood}, {BRAND_CONFIG.city}
                  </p>
                </div>
              </li>
              <li className="flex gap-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px]" style={toneSoft('blue', 11)}>
                  <Clock size={16} />
                </span>
                <div>
                  <p className="text-[13.5px] font-bold text-strong">Horarios</p>
                  <ul className="mt-0.5 text-[13.5px] text-dim">
                    {BRAND_CONFIG.hours.map((h) => (
                      <li key={h.days}>
                        {h.days}: {h.open ? `${h.open} – ${h.close}` : 'Cerrado'}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
              <li className="flex gap-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px]" style={toneSoft('blue', 11)}>
                  <Phone size={16} />
                </span>
                <div>
                  <p className="text-[13.5px] font-bold text-strong">Contacto</p>
                  <p className="mt-0.5 text-[13.5px] text-dim">
                    <a href={`tel:${BRAND_CONFIG.phone.replace(/\s/g, '')}`} className="hover:text-brand">
                      {BRAND_CONFIG.phone}
                    </a>
                    {' · '}
                    <a href={waLink(waMessages.location())} target="_blank" rel="noopener noreferrer" className="hover:text-brand">
                      {BRAND_CONFIG.whatsappDisplay}
                    </a>
                  </p>
                </div>
              </li>
              <li className="flex gap-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px]" style={toneSoft('blue', 11)}>
                  <Mail size={16} />
                </span>
                <div>
                  <p className="text-[13.5px] font-bold text-strong">Email</p>
                  <a href={`mailto:${BRAND_CONFIG.email}`} className="mt-0.5 block text-[13.5px] text-dim hover:text-brand">
                    {BRAND_CONFIG.email}
                  </a>
                </div>
              </li>
            </ul>

            <Button
              variant="secondary"
              className="mt-7"
              href={BRAND_CONFIG.mapsUrl}
              external
              iconRight={<ExternalLink size={14} />}
            >
              Cómo llegar
            </Button>
          </div>

          <div className="min-h-[300px] bg-muted lg:min-h-full">
            <iframe
              title={`Ubicación de ${BRAND_CONFIG.name} en ${BRAND_CONFIG.city}`}
              src={mapSrc}
              loading="lazy"
              className="size-full min-h-[300px] border-0"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
