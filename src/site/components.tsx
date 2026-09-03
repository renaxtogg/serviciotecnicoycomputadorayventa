import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  BadgeCheck, Battery, Building2, Cpu, Database, Droplet, Eye, HardDrive, Monitor,
  MemoryStick, MessageCircle, MonitorSmartphone, Plug, RefreshCw, Shield, Smartphone, Wind,
} from 'lucide-react'
import type { Product, ServiceItem, Tone } from '@/demo/types'
import { money } from '@/lib/format'
import { cn } from '@/lib/utils'
import { waLink, waMessages } from '@/lib/whatsapp'
import { Badge, Button } from '@/components/ui/primitives'
import { toneSoft } from '@/components/ui/tone'

/* ======================================================= ICONOS DE SERVICIO */
const SERVICE_ICONS: Record<string, ReactNode> = {
  smartphone: <Smartphone size={21} />,
  battery: <Battery size={21} />,
  plug: <Plug size={21} />,
  droplet: <Droplet size={21} />,
  refresh: <RefreshCw size={21} />,
  database: <Database size={21} />,
  'hard-drive': <HardDrive size={21} />,
  memory: <MemoryStick size={21} />,
  wind: <Wind size={21} />,
  monitor: <Monitor size={21} />,
  cpu: <Cpu size={21} />,
  pc: <MonitorSmartphone size={21} />,
  building: <Building2 size={21} />,
}

export const VALUE_ICONS: Record<string, ReactNode> = {
  shield: <Shield size={22} />,
  eye: <Eye size={22} />,
  'badge-check': <BadgeCheck size={22} />,
}

export function ServiceIcon({ name }: { name: string }) {
  return <>{SERVICE_ICONS[name] ?? <Smartphone size={21} />}</>
}

/* ====================================================== TARJETA DE SERVICIO */
export function ServiceCard({ service }: { service: ServiceItem }) {
  const eta =
    service.etaHours <= 8
      ? `Listo en el día`
      : service.etaHours <= 24
        ? '24 horas'
        : `${Math.round(service.etaHours / 24)} días`

  return (
    <article className="group relative flex flex-col rounded-[15px] border border-line bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-[var(--shadow-md)]">
      {service.popular && (
        <span className="absolute right-4 top-4">
          <Badge tone="mint">Más pedido</Badge>
        </span>
      )}
      <span className="mb-4 flex size-11 items-center justify-center rounded-[12px]" style={toneSoft('blue', 11)}>
        <ServiceIcon name={service.icon} />
      </span>
      <h3 className="pr-16 text-[16px] font-bold leading-snug text-strong">{service.name}</h3>
      <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-dim">{service.description}</p>

      <dl className="mt-4 flex flex-wrap items-baseline gap-x-5 gap-y-1.5 border-t border-line pt-4">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-dim">Desde</dt>
          <dd className="text-[17px] font-extrabold tracking-tight text-strong">{money(service.fromPrice)}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-dim">Plazo</dt>
          <dd className="text-[13.5px] font-semibold text-body">{eta}</dd>
        </div>
        {service.warrantyDays > 0 && (
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-dim">Garantía</dt>
            <dd className="text-[13.5px] font-semibold text-body">{service.warrantyDays} días</dd>
          </div>
        )}
      </dl>

      <Button
        variant="soft"
        size="sm"
        block
        className="mt-4"
        href={waLink(waMessages.service(service.name))}
        external
        icon={<MessageCircle size={14} />}
      >
        Consultar por este servicio
      </Button>
    </article>
  )
}

/* ====================================================== TARJETA DE PRODUCTO */
const CONDITION_TONE: Record<Product['condition'], Tone> = {
  nuevo: 'mint',
  reacondicionado: 'blue',
  usado: 'amber',
}

const CONDITION_LABEL: Record<Product['condition'], string> = {
  nuevo: 'Nuevo',
  reacondicionado: 'Reacondicionado',
  usado: 'Usado',
}

export function ProductArt({
  product, className, size = 'md',
}: {
  product: Product
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const fontSize = { sm: 30, md: 52, lg: 84 }[size]
  return (
    <div
      className={cn('flex items-center justify-center overflow-hidden rounded-[12px]', className)}
      style={{
        background: `linear-gradient(140deg, color-mix(in srgb, ${
          { blue: 'var(--brand-primary)', navy: 'var(--brand-secondary)', mint: 'var(--brand-accent)',
            amber: 'var(--brand-warning)', slate: 'var(--text-muted)', danger: 'var(--brand-danger)' }[product.art.tone]
        } 13%, white), var(--surface-muted))`,
      }}
      aria-hidden
    >
      <span style={{ fontSize }} className="select-none leading-none drop-shadow-sm">
        {product.art.emoji}
      </span>
    </div>
  )
}

export function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stock === 0
  return (
    <article className="group flex flex-col overflow-hidden rounded-[15px] border border-line bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-[var(--shadow-md)]">
      <Link to={`/tienda/${product.id}`} className="block">
        <div className="relative">
          <ProductArt product={product} className="aspect-[4/3] w-full" />
          <span className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <Badge tone={CONDITION_TONE[product.condition]}>{CONDITION_LABEL[product.condition]}</Badge>
            {outOfStock && <Badge tone="danger">Sin stock</Badge>}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-dim">{product.brand}</p>
        <h3 className="mt-1 text-[14.5px] font-bold leading-snug text-strong">
          <Link to={`/tienda/${product.id}`} className="transition-colors hover:text-brand">
            {product.name}
          </Link>
        </h3>

        {product.specs.length > 0 && (
          <ul className="mt-2.5 flex flex-1 flex-col gap-1">
            {product.specs.slice(0, 3).map((s) => (
              <li key={s} className="flex items-start gap-1.5 text-[12.5px] leading-snug text-dim">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-brand/50" aria-hidden />
                {s}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 border-t border-line pt-3.5">
          <p className="text-[20px] font-extrabold leading-none tracking-tight text-strong">
            {money(product.price)}
          </p>
          <p className="mt-1.5 text-[12px] text-dim">
            o {product.price >= 1_000_000 ? '10' : '6'} cuotas de{' '}
            <strong className="font-semibold text-body">
              {money(Math.round(product.price / (product.price >= 1_000_000 ? 10 : 6) / 1000) * 1000)}
            </strong>
          </p>
          <Button size="sm" block className="mt-3.5" to={`/tienda/${product.id}`}>
            Ver detalle
          </Button>
        </div>
      </div>
    </article>
  )
}

/* ============================================================ CINTA DE CTA */
export function CtaBand({
  title, text, primary, secondary,
}: {
  title: string
  text: string
  primary?: ReactNode
  secondary?: ReactNode
}) {
  return (
    <section className="container-x my-20">
      <div className="hero-mesh relative overflow-hidden rounded-[22px] px-6 py-12 text-center sm:px-12 sm:py-14">
        <div className="grid-lines absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-[26px] font-extrabold leading-tight text-white sm:text-[32px]">{title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/72">{text}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {primary}
            {secondary}
          </div>
        </div>
      </div>
    </section>
  )
}
