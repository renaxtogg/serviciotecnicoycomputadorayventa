import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calculator, Clock, MessageCircle, RotateCcw } from 'lucide-react'
import { QUOTE_BRANDS, QUOTE_DEVICES, QUOTE_ISSUES } from '@/config/content'
import { BRAND_CONFIG } from '@/config/brand'
import { money } from '@/lib/format'
import { cn } from '@/lib/utils'
import { waLink, waMessages } from '@/lib/whatsapp'
import { Button, SectionTitle } from '@/components/ui/primitives'

/**
 * Cotizador orientativo. Resuelve el "¿cuánto sale?" que frena la mitad de las
 * consultas, sin comprometer al negocio: siempre aclara que el precio final
 * lo confirma el diagnóstico.
 */
export function QuoteWizard() {
  const [device, setDevice] = useState<string>('celular')
  const [brand, setBrand] = useState<string>('')
  const [issue, setIssue] = useState<string>('')

  const issues = QUOTE_ISSUES[device] ?? []
  const selected = useMemo(() => issues.find((i) => i.id === issue), [issues, issue])
  const complete = Boolean(brand && selected)

  const reset = () => {
    setBrand('')
    setIssue('')
  }

  return (
    <section className="container-x my-20 scroll-mt-24" id="cotizador">
      <SectionTitle
        eyebrow="Cotizador rápido"
        title="Sabé cuánto sale antes de venir"
        description="Elegí tu equipo y qué le pasa. Te damos un rango estimado al instante, basado en lo que cobramos habitualmente por ese trabajo."
        align="center"
      />

      <div className="mx-auto mt-10 grid max-w-5xl gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        {/* ------------------------------------------------------ Selección */}
        <div className="rounded-[16px] border border-line bg-card p-5 sm:p-6">
          <Step n={1} label="¿Qué equipo es?" />
          <div className="mt-3 flex flex-wrap gap-2">
            {QUOTE_DEVICES.map((d) => (
              <Chip
                key={d.value}
                active={device === d.value}
                onClick={() => {
                  setDevice(d.value)
                  reset()
                }}
              >
                {d.label}
              </Chip>
            ))}
          </div>

          <Step n={2} label="¿De qué marca?" className="mt-7" />
          <div className="mt-3 flex flex-wrap gap-2">
            {(QUOTE_BRANDS[device] ?? []).map((b) => (
              <Chip key={b} active={brand === b} onClick={() => setBrand(b)}>
                {b}
              </Chip>
            ))}
          </div>

          <Step n={3} label="¿Qué le pasa?" className="mt-7" />
          <div className="mt-3 flex flex-col gap-2">
            {issues.map((i) => (
              <button
                key={i.id}
                onClick={() => setIssue(i.id)}
                aria-pressed={issue === i.id}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-[11px] border px-4 py-3 text-left transition-all',
                  issue === i.id
                    ? 'border-brand bg-brand/[0.06] ring-[3px] ring-brand/12'
                    : 'border-line hover:border-line-strong hover:bg-muted/60',
                )}
              >
                <span className="text-[13.5px] font-medium text-strong">{i.label}</span>
                <span className="shrink-0 text-[12.5px] font-semibold tabular-nums text-dim">
                  desde {money(i.from, { compact: true })}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ------------------------------------------------------ Resultado */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[16px] border border-line bg-muted/60 p-5 sm:p-6">
            <span className="flex size-10 items-center justify-center rounded-[11px] bg-brand/12 text-brand">
              <Calculator size={20} />
            </span>

            {complete && selected ? (
              <div className="anim-fade-in">
                <p className="mt-4 text-[12px] font-bold uppercase tracking-wider text-dim">
                  Estimado para tu {brand}
                </p>
                <p className="mt-1.5 text-[15px] font-semibold leading-snug text-strong">{selected.label}</p>

                <p className="mt-5 text-[27px] font-extrabold leading-none tracking-tight text-strong">
                  {money(selected.from)}
                  <span className="text-dim"> – </span>
                  {money(selected.to)}
                </p>

                <p className="mt-3 flex items-center gap-1.5 text-[13px] font-medium text-body">
                  <Clock size={14} className="text-brand" aria-hidden />
                  Plazo estimado: {selected.eta}
                </p>

                <p className="mt-4 rounded-[10px] border border-line bg-card p-3 text-[12px] leading-relaxed text-dim">
                  Es un rango orientativo. El precio exacto sale del diagnóstico, que es{' '}
                  <strong className="font-semibold text-strong">sin costo</strong> y no te obliga a nada.
                </p>

                <div className="mt-5 flex flex-col gap-2.5">
                  <Button
                    variant="whatsapp"
                    block
                    icon={<MessageCircle size={16} />}
                    href={waLink(
                      waMessages.quote(
                        brand,
                        QUOTE_DEVICES.find((d) => d.value === device)?.label ?? '',
                        selected.label,
                        `${money(selected.from)} – ${money(selected.to)}`,
                      ),
                    )}
                    external
                  >
                    Confirmar por WhatsApp
                  </Button>
                  <Button variant="secondary" block to="/agendar" iconRight={<ArrowRight size={15} />}>
                    Agendar la visita
                  </Button>
                  <button
                    onClick={reset}
                    className="mt-1 inline-flex items-center justify-center gap-1.5 text-[12.5px] font-semibold text-dim transition-colors hover:text-strong"
                  >
                    <RotateCcw size={13} />
                    Empezar de nuevo
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="mt-4 text-[15px] font-bold text-strong">Completá los 3 pasos</p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-dim">
                  Elegí el equipo, la marca y el problema. Acá te mostramos el rango de precio y el plazo
                  estimado, sin que tengas que escribirle a nadie.
                </p>
                <ul className="mt-5 flex flex-col gap-2.5 border-t border-line pt-5 text-[13px] text-body">
                  <li className="flex gap-2">
                    <span className="text-accent">✓</span> Diagnóstico sin cargo
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent">✓</span> Garantía de {BRAND_CONFIG.warrantyDays} días
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent">✓</span> No trabajamos sin tu aprobación
                  </li>
                </ul>
                <p className="mt-5 text-[12.5px] text-dim">
                  ¿Tu problema no está en la lista?{' '}
                  <Link to="/agendar" className="font-semibold text-brand hover:underline">
                    Contanos qué pasa
                  </Link>
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}

function Step({ n, label, className }: { n: number; label: string; className?: string }) {
  return (
    <p className={cn('flex items-center gap-2.5', className)}>
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ink text-[11.5px] font-bold text-white">
        {n}
      </span>
      <span className="text-[14px] font-bold text-strong">{label}</span>
    </p>
  )
}

function Chip({
  active, onClick, children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-all',
        active
          ? 'border-brand bg-brand text-white'
          : 'border-line-strong bg-card text-body hover:border-brand hover:text-brand',
      )}
    >
      {children}
    </button>
  )
}
