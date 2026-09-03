import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { Tone } from '@/demo/types'
import { TONE_VAR, toneSoft } from './tone'

/* ============================================================== BOTÓN ===== */
type Variant = 'primary' | 'secondary' | 'ghost' | 'dark' | 'danger' | 'whatsapp' | 'soft'
type Size = 'sm' | 'md' | 'lg'

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5 rounded-[10px]',
  md: 'h-11 px-5 text-sm gap-2 rounded-[12px]',
  lg: 'h-13 px-7 text-[15px] gap-2.5 rounded-[14px]',
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand text-white shadow-[0_6px_18px_-6px_color-mix(in_srgb,var(--brand-primary)_60%,transparent)] hover:brightness-110 active:brightness-95',
  secondary:
    'bg-card text-strong border border-line-strong hover:border-brand hover:text-brand',
  ghost: 'text-dim hover:text-strong hover:bg-muted',
  dark: 'bg-ink text-white hover:brightness-125',
  danger: 'bg-danger text-white hover:brightness-110',
  whatsapp: 'bg-wa text-white hover:brightness-105',
  soft: 'bg-brand/10 text-brand hover:bg-brand/16',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  iconRight?: ReactNode
  block?: boolean
  href?: string
  to?: string
  external?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  block,
  className,
  children,
  href,
  to,
  external,
  ...rest
}: ButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center font-semibold transition-all duration-150 select-none',
    'disabled:opacity-45 disabled:pointer-events-none whitespace-nowrap',
    SIZES[size],
    VARIANTS[variant],
    block && 'w-full',
    className,
  )
  const content = (
    <>
      {icon}
      {children}
      {iconRight}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    )
  }
  if (href) {
    return (
      <a
        href={href}
        className={classes}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {content}
      </a>
    )
  }
  return (
    <button type="button" className={classes} {...rest}>
      {content}
    </button>
  )
}

/* =============================================================== BADGE ==== */
export function Badge({
  tone = 'slate',
  children,
  icon,
  className,
  dot,
}: {
  tone?: Tone
  children: ReactNode
  icon?: ReactNode
  className?: string
  dot?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold leading-none',
        className,
      )}
      style={toneSoft(tone)}
    >
      {dot && (
        <span
          className="size-1.5 shrink-0 rounded-full"
          style={{ background: TONE_VAR[tone] }}
          aria-hidden
        />
      )}
      {icon}
      {children}
    </span>
  )
}

/* ================================================================ CARD ==== */
export function Card({
  children,
  className,
  padded = true,
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  padded?: boolean
  as?: 'div' | 'section' | 'article' | 'li'
}) {
  return (
    <Tag
      className={cn(
        'rounded-[14px] border border-line bg-card shadow-[var(--shadow-xs)]',
        padded && 'p-5',
        className,
      )}
    >
      {children}
    </Tag>
  )
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h3 className="text-[15px] font-bold text-strong">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[13px] text-dim">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/* ============================================================== AVATAR ==== */
export function Avatar({
  name,
  tone = 'blue',
  size = 36,
  className,
}: {
  name: string
  tone?: Tone
  size?: number
  className?: string
}) {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-bold', className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        ...toneSoft(tone, 14),
      }}
      aria-hidden
    >
      {letters}
    </span>
  )
}

/* =============================================================== VARIOS === */
export function SectionTitle({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  align?: 'left' | 'center'
  className?: string
}) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && (
        <span className="mb-3 inline-block rounded-full bg-brand/10 px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.14em] text-brand">
          {eyebrow}
        </span>
      )}
      <h2 className="text-[26px] font-extrabold leading-[1.15] sm:text-[34px]">{title}</h2>
      {description && <p className="mt-3.5 text-[15px] leading-relaxed text-dim">{description}</p>}
    </div>
  )
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-0 border-t border-line', className)} />
}

/** Etiqueta discreta que recuerda que se trata de una demostración */
export function DemoTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider',
        className,
      )}
      style={toneSoft('amber', 13)}
    >
      <span className="size-1.5 rounded-full bg-warn" />
      Modo demostración
    </span>
  )
}

export function KeyValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="shrink-0 text-[13px] text-dim">{label}</dt>
      <dd className="text-right text-[13.5px] font-semibold text-strong">{value}</dd>
    </div>
  )
}
