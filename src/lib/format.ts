import { BRAND_CONFIG } from '@/config/brand'

const LOCALE = BRAND_CONFIG.currency.locale

/** ₲ 1.250.000 — guaraníes no usan decimales */
export function money(value: number, opts?: { compact?: boolean; symbol?: boolean }) {
  const symbol = opts?.symbol === false ? '' : `${BRAND_CONFIG.currency.symbol} `
  if (opts?.compact && Math.abs(value) >= 1_000_000) {
    return `${symbol}${(value / 1_000_000).toLocaleString(LOCALE, { maximumFractionDigits: 1 })} M`
  }
  if (opts?.compact && Math.abs(value) >= 1_000) {
    return `${symbol}${Math.round(value / 1000).toLocaleString(LOCALE)} mil`
  }
  return `${symbol}${Math.round(value).toLocaleString(LOCALE, { maximumFractionDigits: 0 })}`
}

export function num(value: number) {
  return value.toLocaleString(LOCALE, { maximumFractionDigits: 0 })
}

export function pct(value: number, digits = 0) {
  return `${value.toLocaleString(LOCALE, { maximumFractionDigits: digits })}%`
}

const MONTHS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'set', 'oct', 'nov', 'dic',
]
const MONTHS_LONG = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]
const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

export function toDate(v: string | number | Date) {
  return v instanceof Date ? v : new Date(v)
}

/** 14/03/2026 */
export function dmy(v: string | number | Date) {
  const d = toDate(v)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

/** 14 mar */
export function dayMonth(v: string | number | Date) {
  const d = toDate(v)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

/** 14 de marzo, 09:30 */
export function longDate(v: string | number | Date) {
  const d = toDate(v)
  return `${d.getDate()} de ${MONTHS_LONG[d.getMonth()]}, ${hm(d)}`
}

export function weekday(v: string | number | Date) {
  return DAYS[toDate(v).getDay()]
}

/** 09:30 */
export function hm(v: string | number | Date) {
  const d = toDate(v)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 14/03/2026 09:30 */
export function dmyHm(v: string | number | Date) {
  return `${dmy(v)} ${hm(v)}`
}

/** "hace 2 h", "en 3 días", "recién" */
export function relative(v: string | number | Date) {
  const diff = toDate(v).getTime() - Date.now()
  const abs = Math.abs(diff)
  const past = diff < 0
  const fmt = (n: number, unit: string, plural = 's') => {
    const label = `${n} ${unit}${n === 1 ? '' : plural}`
    return past ? `hace ${label}` : `en ${label}`
  }
  if (abs < 60_000) return past ? 'recién' : 'en instantes'
  if (abs < 3_600_000) return fmt(Math.round(abs / 60_000), 'min', '')
  if (abs < 86_400_000) return fmt(Math.round(abs / 3_600_000), 'hora')
  if (abs < 2_592_000_000) return fmt(Math.round(abs / 86_400_000), 'día')
  return fmt(Math.round(abs / 2_592_000_000), 'mes', 'es')
}

/** Días enteros transcurridos desde una fecha (para SLA de taller) */
export function daysSince(v: string | number | Date) {
  return Math.floor((Date.now() - toDate(v).getTime()) / 86_400_000)
}

export function isToday(v: string | number | Date) {
  const d = toDate(v)
  const n = new Date()
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()
}

export function isSameMonth(v: string | number | Date, ref = new Date()) {
  const d = toDate(v)
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
}

/** Input <input type="date"> → yyyy-mm-dd */
export function isoDate(v: string | number | Date) {
  const d = toDate(v)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 0981 447 203 */
export function phone(raw: string) {
  const d = raw.replace(/\D/g, '')
  if (d.length === 10 && d.startsWith('0')) return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`
  if (d.length === 12 && d.startsWith('595')) return `+595 ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`
  return raw
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}
