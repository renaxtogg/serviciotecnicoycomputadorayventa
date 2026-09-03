import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, MessageCircle, PackageSearch, ShieldCheck, Star } from 'lucide-react'
import { HERO, TRUST_STATS } from '@/config/content'
import { BRAND_CONFIG } from '@/config/brand'
import { waLink, waMessages } from '@/lib/whatsapp'
import { Button } from '@/components/ui/primitives'

export function Hero() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')

  return (
    <section className="hero-mesh relative overflow-hidden">
      <div className="grid-lines absolute inset-0" aria-hidden />

      <div className="container-x relative grid gap-12 py-14 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-20">
        {/* ----------------------------------------------------- Discurso */}
        <div className="anim-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/12 px-3.5 py-1.5 text-[12.5px] font-semibold text-white">
            <ShieldCheck size={14} className="text-accent" aria-hidden />
            {HERO.badge}
          </span>

          <h1 className="mt-6 text-[34px] font-extrabold leading-[1.08] text-white sm:text-[46px] lg:text-[52px]">
            {HERO.title}{' '}
            <span className="text-accent">{HERO.titleAccent}</span>
          </h1>

          <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-white/72 sm:text-[16.5px]">
            {HERO.subtitle}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" to="/agendar" iconRight={<ArrowRight size={17} />}>
              {HERO.primaryCta}
            </Button>
            <Button
              size="lg"
              variant="whatsapp"
              href={waLink(waMessages.general())}
              external
              icon={<MessageCircle size={17} />}
            >
              Escribir por WhatsApp
            </Button>
          </div>

          {/* Prueba social compacta */}
          <dl className="mt-10 grid max-w-lg grid-cols-2 gap-x-6 gap-y-5 border-t border-white/12 pt-7 sm:grid-cols-4">
            {TRUST_STATS.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span className="block text-[22px] font-extrabold leading-none text-white">{s.value}</span>
                  <span className="mt-1.5 block text-[12px] leading-tight text-white/55">{s.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ------------------------------------- Consulta de estado (killer) */}
        <div className="anim-fade-up lg:justify-self-end" style={{ animationDelay: '90ms' }}>
          <div className="w-full rounded-[18px] border border-white/12 bg-white p-6 shadow-[var(--shadow-lg)] sm:p-7 lg:max-w-[430px]">
            <span className="flex size-11 items-center justify-center rounded-[12px] bg-brand/10 text-brand">
              <PackageSearch size={22} />
            </span>
            <h2 className="mt-4 text-[19px] font-extrabold text-strong">{HERO.trackTitle}</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-dim">{HERO.trackHint}</p>

            <form
              className="mt-5"
              onSubmit={(e) => {
                e.preventDefault()
                const clean = code.trim()
                navigate(clean ? `/seguimiento?codigo=${encodeURIComponent(clean)}` : '/seguimiento')
              }}
            >
              <label htmlFor="hero-code" className="sr-only">
                Código de orden
              </label>
              <div className="flex gap-2">
                <input
                  id="hero-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="OS-1042"
                  autoComplete="off"
                  className="h-12 min-w-0 flex-1 rounded-[12px] border border-line-strong bg-card px-4 text-[15px] font-semibold uppercase tracking-wide text-strong placeholder:font-normal placeholder:tracking-normal placeholder:text-dim/70 focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/14"
                />
                <Button type="submit" size="lg" className="shrink-0 px-5">
                  Ver estado
                </Button>
              </div>
            </form>

            <div className="mt-6 flex items-start gap-3 rounded-[12px] bg-muted p-3.5">
              <span className="flex shrink-0 gap-0.5 pt-0.5" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={12} className="fill-warn text-warn" />
                ))}
              </span>
              <p className="text-[12.5px] leading-relaxed text-body">
                <strong className="font-semibold text-strong">Sin llamar ni preguntar.</strong> Cada equipo que
                entra al taller recibe un código y podés ver el avance las 24 horas.
              </p>
            </div>

            <p className="mt-4 text-center text-[12px] text-dim">
              ¿Preferís hablar? Llamanos al{' '}
              <a
                href={`tel:${BRAND_CONFIG.phone.replace(/\s/g, '')}`}
                className="font-semibold text-brand hover:underline"
              >
                {BRAND_CONFIG.phone}
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
