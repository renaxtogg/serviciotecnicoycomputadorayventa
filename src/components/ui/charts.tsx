/* ============================================================================
   GRÁFICOS
   SVG propio, sin librerías: menos peso, control total y coherencia con los
   tokens de marca. Cada gráfico trae leyenda, tooltip y vista de tabla, para
   que la información nunca dependa únicamente del color.
   ==========================================================================*/
import { useState } from 'react'
import type { ReactNode } from 'react'
import { Table2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { money } from '@/lib/format'

const SERIES = ['var(--chart-1)', 'var(--chart-2)'] as const

/* ============================================================== MARCO ===== */
export function ChartFrame({
  title, subtitle, legend, children, table, action,
}: {
  title: string
  subtitle?: string
  legend?: Array<{ label: string; color: string }>
  children: ReactNode
  table?: ReactNode
  action?: ReactNode
}) {
  const [showTable, setShowTable] = useState(false)
  return (
    <section className="rounded-[14px] border border-line bg-card p-5">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold text-strong">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[12.5px] text-dim">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {legend && legend.length > 1 && (
            <ul className="flex flex-wrap items-center gap-3">
              {legend.map((l) => (
                <li key={l.label} className="flex items-center gap-1.5 text-[12px] font-medium text-dim">
                  <span className="size-2.5 rounded-[3px]" style={{ background: l.color }} aria-hidden />
                  {l.label}
                </li>
              ))}
            </ul>
          )}
          {action}
          {table && (
            <button
              onClick={() => setShowTable((v) => !v)}
              aria-pressed={showTable}
              title="Ver los datos como tabla"
              className={cn(
                'flex size-7 items-center justify-center rounded-lg border border-line-strong transition-colors',
                showTable ? 'bg-brand/10 text-brand' : 'text-dim hover:text-strong',
              )}
            >
              <Table2 size={14} />
            </button>
          )}
        </div>
      </header>
      {showTable && table ? <div className="thin-scroll max-h-64 overflow-auto">{table}</div> : children}
    </section>
  )
}

/* ================================================= BARRAS APILADAS (TIEMPO) */
export interface StackedPoint {
  label: string
  a: number
  b: number
}

export function StackedBarChart({
  data, labels, height = 190, formatter = (n: number) => money(n, { compact: true }),
}: {
  data: StackedPoint[]
  labels: [string, string]
  height?: number
  formatter?: (n: number) => string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(...data.map((d) => d.a + d.b), 1)
  const cols = data.length
  const gap = 2 // separación de superficie entre segmentos apilados

  return (
    <div className="relative">
      <div className="flex items-end gap-[3px]" style={{ height }}>
        {data.map((d, i) => {
          const total = d.a + d.b
          const hA = (d.a / max) * (height - 22)
          const hB = (d.b / max) * (height - 22)
          const active = hover === i
          return (
            <div
              key={d.label}
              className="group relative flex h-full flex-1 cursor-default flex-col justify-end"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              tabIndex={0}
              aria-label={`${d.label}: ${labels[0]} ${formatter(d.a)}, ${labels[1]} ${formatter(d.b)}`}
            >
              {total === 0 ? (
                <div className="h-[3px] w-full rounded-full bg-muted" />
              ) : (
                <>
                  {hB > 0 && (
                    <div
                      className="w-full rounded-t-[4px] transition-opacity"
                      style={{
                        height: Math.max(hB, 3),
                        background: SERIES[1],
                        opacity: hover === null || active ? 1 : 0.42,
                        marginBottom: hA > 0 ? gap : 0,
                      }}
                    />
                  )}
                  {hA > 0 && (
                    <div
                      className={cn('w-full transition-opacity', hB > 0 ? 'rounded-b-[4px]' : 'rounded-[4px]')}
                      style={{
                        height: Math.max(hA, 3),
                        background: SERIES[0],
                        opacity: hover === null || active ? 1 : 0.42,
                      }}
                    />
                  )}
                </>
              )}
              <span
                className={cn(
                  'mt-2 block truncate text-center text-[10px] font-medium tabular-nums',
                  active ? 'text-strong' : 'text-dim',
                )}
              >
                {d.label}
              </span>
            </div>
          )
        })}
      </div>

      {hover !== null && (
        <div
          className="pointer-events-none absolute -top-1 z-10 w-max max-w-[190px] rounded-[10px] border border-line bg-card px-3 py-2 shadow-[var(--shadow-md)]"
          style={{
            left: `${((hover + 0.5) / cols) * 100}%`,
            transform: `translateX(${hover > cols / 2 ? '-100%' : '0'})`,
          }}
        >
          <p className="mb-1.5 text-[11.5px] font-bold text-strong">{data[hover].label}</p>
          <p className="flex items-center justify-between gap-3 text-[11.5px] text-body">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-[2px]" style={{ background: SERIES[0] }} />
              {labels[0]}
            </span>
            <span className="font-semibold tabular-nums text-strong">{formatter(data[hover].a)}</span>
          </p>
          <p className="mt-0.5 flex items-center justify-between gap-3 text-[11.5px] text-body">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-[2px]" style={{ background: SERIES[1] }} />
              {labels[1]}
            </span>
            <span className="font-semibold tabular-nums text-strong">{formatter(data[hover].b)}</span>
          </p>
          <p className="mt-1.5 border-t border-line pt-1.5 text-[11.5px] font-bold text-strong">
            Total {formatter(data[hover].a + data[hover].b)}
          </p>
        </div>
      )}
    </div>
  )
}

/* ============================================== BARRAS HORIZONTALES ======= */
export function HBarChart({
  data, formatter = (n: number) => money(n, { compact: true }), tone = 'var(--chart-1)', emptyLabel,
}: {
  data: Array<{ label: string; value: number; meta?: string }>
  formatter?: (n: number) => string
  tone?: string
  emptyLabel?: string
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  if (data.length === 0) {
    return <p className="py-8 text-center text-[13px] text-dim">{emptyLabel ?? 'Sin datos en el período.'}</p>
  }
  return (
    <ul className="flex flex-col gap-3.5">
      {data.map((d, i) => (
        <li key={`${d.label}-${i}`}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-[13px] font-medium text-strong" title={d.label}>
              {d.label}
            </span>
            <span className="shrink-0 text-[12.5px] font-bold tabular-nums text-strong">
              {formatter(d.value)}
              {d.meta && <span className="ml-1.5 font-medium text-dim">{d.meta}</span>}
            </span>
          </div>
          <div className="h-[7px] w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-[width] duration-700"
              style={{ width: `${Math.max(2, (d.value / max) * 100)}%`, background: tone }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

/* ================================================= BARRA DE PARTICIPACIÓN = */
export function ShareBar({
  segments, total, formatter = (n: number) => money(n, { compact: true }),
}: {
  segments: Array<{ label: string; value: number; color: string }>
  total: number
  formatter?: (n: number) => string
}) {
  const safeTotal = total || 1
  return (
    <div>
      <div className="flex h-3.5 w-full gap-[2px] overflow-hidden rounded-full">
        {segments.map((s) => (
          <div
            key={s.label}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ width: `${Math.max(1, (s.value / safeTotal) * 100)}%`, background: s.color }}
            title={`${s.label}: ${formatter(s.value)}`}
          />
        ))}
      </div>
      <ul className="mt-4 flex flex-col gap-2.5">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-[13px] text-body">
              <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: s.color }} aria-hidden />
              <span className="truncate">{s.label}</span>
            </span>
            <span className="shrink-0 text-[13px] font-bold tabular-nums text-strong">
              {formatter(s.value)}
              <span className="ml-1.5 text-[12px] font-medium text-dim">
                {Math.round((s.value / safeTotal) * 100)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ================================================================ MINI ==== */
export function Sparkline({
  values, width = 96, height = 26, color = 'var(--chart-1)',
}: {
  values: number[]
  width?: number
  height?: number
  color?: string
}) {
  if (values.length < 2) return null
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const span = max - min || 1
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width
      const y = height - ((v - min) / span) * (height - 3) - 1.5
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-hidden focusable="false">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export const CHART_SERIES = SERIES
