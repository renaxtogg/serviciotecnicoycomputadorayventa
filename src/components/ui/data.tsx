import type { ReactNode } from 'react'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Search, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Tone } from '@/demo/types'
import { TONE_VAR, toneSoft } from './tone'

/* ============================================================ BUSCADOR ==== */
export function SearchInput({
  value, onChange, placeholder = 'Buscar…', className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-full rounded-[10px] border border-line-strong bg-card pl-9 pr-3 text-[13.5px] text-strong placeholder:text-dim/70 focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/14"
      />
    </div>
  )
}

/* ========================================================== ESTADO VACÍO = */
export function EmptyState({
  icon, title, description, action, compact,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  compact?: boolean
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'py-10' : 'py-16')}>
      {icon && (
        <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted text-dim">
          {icon}
        </span>
      )}
      <h3 className="text-[15px] font-bold text-strong">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-dim">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/* ============================================================= SKELETON == */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden />
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2.5 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full" />
      ))}
    </div>
  )
}

/* ================================================================ KPI ===== */
export function StatCard({
  label, value, hint, icon, tone = 'blue', delta, onClick, alert,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  tone?: Tone
  delta?: number
  onClick?: () => void
  alert?: boolean
}) {
  const Tag = onClick ? 'button' : 'div'
  const up = (delta ?? 0) >= 0
  return (
    <Tag
      onClick={onClick}
      className={cn(
        'group flex w-full flex-col items-start gap-3 rounded-[14px] border bg-card p-4 text-left transition-all',
        onClick && 'hover:-translate-y-px hover:border-brand/45 hover:shadow-[var(--shadow-md)]',
        alert ? 'border-warn/45 bg-warn/[0.045]' : 'border-line',
      )}
    >
      <div className="flex w-full items-start justify-between gap-3">
        <span className="text-[12.5px] font-semibold leading-tight text-dim">{label}</span>
        {icon && (
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-[9px]"
            style={toneSoft(tone, 12)}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="w-full">
        <p className="text-[24px] font-extrabold leading-none tracking-tight text-strong tabular-nums">
          {value}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {typeof delta === 'number' && Number.isFinite(delta) && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11.5px] font-bold"
              style={toneSoft(up ? 'mint' : 'danger', 12)}
            >
              {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {up ? '+' : ''}
              {Math.round(delta)}%
            </span>
          )}
          {hint && <span className="text-[12px] text-dim">{hint}</span>}
        </div>
      </div>
    </Tag>
  )
}

/* ============================================================== TABLA ===== */
export interface Column<T> {
  key: string
  header: ReactNode
  render: (row: T) => ReactNode
  align?: 'left' | 'right' | 'center'
  width?: string
  /** Se oculta en pantallas medianas para priorizar lo importante */
  hideBelow?: 'sm' | 'md' | 'lg'
}

const HIDE_CLASS = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
}

export function DataTable<T extends { id: string }>({
  rows, columns, onRowClick, mobileCard, empty, className, dense,
}: {
  rows: T[]
  columns: Column<T>[]
  onRowClick?: (row: T) => void
  /** En móvil la tabla se convierte en tarjetas legibles */
  mobileCard?: (row: T) => ReactNode
  empty?: ReactNode
  className?: string
  dense?: boolean
}) {
  if (rows.length === 0 && empty) return <>{empty}</>

  return (
    <>
      {mobileCard && (
        <div className="flex flex-col gap-2.5 md:hidden">
          {rows.map((row) => (
            <div
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              role={onRowClick ? 'button' : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onRowClick(row)
                      }
                    }
                  : undefined
              }
              className={cn(
                'rounded-[13px] border border-line bg-card p-3.5',
                onRowClick && 'cursor-pointer transition-colors active:bg-muted',
              )}
            >
              {mobileCard(row)}
            </div>
          ))}
        </div>
      )}

      <div className={cn('overflow-x-auto', mobileCard && 'hidden md:block', className)}>
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr className="border-b border-line">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  style={{ width: c.width }}
                  className={cn(
                    'whitespace-nowrap px-3 py-2.5 text-[11.5px] font-bold uppercase tracking-wider text-dim',
                    c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                    c.hideBelow && HIDE_CLASS[c.hideBelow],
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-line/70 last:border-0',
                  onRowClick && 'cursor-pointer transition-colors hover:bg-brand/[0.035]',
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      'px-3 align-middle text-body',
                      dense ? 'py-2' : 'py-3',
                      c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                      c.hideBelow && HIDE_CLASS[c.hideBelow],
                    )}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

/* ========================================================== PAGINACIÓN === */
export function usePagination<T>(items: T[], perPage = 12) {
  const [page, setPage] = useState(1)
  const pages = Math.max(1, Math.ceil(items.length / perPage))
  const current = Math.min(page, pages)
  const slice = items.slice((current - 1) * perPage, current * perPage)
  return { slice, page: current, pages, setPage, total: items.length }
}

export function Pagination({
  page, pages, onChange, total, unit = 'registros',
}: {
  page: number
  pages: number
  onChange: (p: number) => void
  total: number
  unit?: string
}) {
  if (pages <= 1) {
    return (
      <p className="px-1 py-3 text-[12.5px] text-dim">
        {total} {unit}
      </p>
    )
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      <p className="text-[12.5px] text-dim">
        Página {page} de {pages} · {total} {unit}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          aria-label="Página anterior"
          className="flex size-8 items-center justify-center rounded-lg border border-line-strong text-dim transition-colors hover:text-strong disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === pages}
          aria-label="Página siguiente"
          className="flex size-8 items-center justify-center rounded-lg border border-line-strong text-dim transition-colors hover:text-strong disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

/* =========================================================== PROGRESO ==== */
export function ProgressBar({
  value, max = 100, tone = 'blue', className, height = 6,
}: {
  value: number
  max?: number
  tone?: Tone
  className?: string
  height?: number
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-muted', className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: TONE_VAR[tone] }}
      />
    </div>
  )
}
