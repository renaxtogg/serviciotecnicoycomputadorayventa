import { BRAND_CONFIG } from '@/config/brand'
import { cn } from '@/lib/utils'

/**
 * Logotipo. Si BRAND_CONFIG.logoUrl tiene una imagen, se usa esa.
 * Si no, se dibuja la marca tipográfica + símbolo, con los colores de marca.
 */
export function Logo({
  variant = 'dark',
  size = 'md',
  className,
}: {
  variant?: 'dark' | 'light'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const dims = { sm: 28, md: 34, lg: 42 }[size]
  const text = { sm: 'text-[15px]', md: 'text-[18px]', lg: 'text-[22px]' }[size]

  if (BRAND_CONFIG.logoUrl) {
    return (
      <img
        src={BRAND_CONFIG.logoUrl}
        alt={BRAND_CONFIG.name}
        height={dims}
        className={cn('w-auto', className)}
        style={{ height: dims }}
      />
    )
  }

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg
        width={dims}
        height={dims}
        viewBox="0 0 64 64"
        aria-hidden
        className="shrink-0"
        focusable="false"
      >
        <rect
          width="64"
          height="64"
          rx="15"
          fill={variant === 'light' ? 'rgba(255,255,255,0.10)' : 'var(--brand-secondary)'}
        />
        <circle cx="32" cy="30" r="12.5" fill="none" stroke="var(--brand-primary)" strokeWidth="5" />
        <ellipse
          cx="32"
          cy="30"
          rx="23"
          ry="8"
          fill="none"
          stroke="var(--brand-accent)"
          strokeWidth="4"
          transform="rotate(-22 32 30)"
        />
      </svg>
      <span className="flex flex-col leading-none">
        <span
          className={cn('font-display font-extrabold tracking-tight', text)}
          style={{ color: variant === 'light' ? '#fff' : 'var(--text-strong)' }}
        >
          {BRAND_CONFIG.name}
        </span>
        <span
          className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.2em]"
          style={{ color: variant === 'light' ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }}
        >
          Celulares · Notebooks
        </span>
      </span>
    </span>
  )
}
