export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`
}

export function slugify(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Búsqueda sin acentos ni mayúsculas */
export function normalize(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export function matches(haystack: Array<string | number | undefined | null>, query: string) {
  if (!query.trim()) return true
  const q = normalize(query.trim())
  return normalize(haystack.filter(Boolean).join(' ')).includes(q)
}

export function sum<T>(items: T[], pick: (item: T) => number) {
  return items.reduce((acc, it) => acc + pick(it), 0)
}

export function groupBy<T, K extends string>(items: T[], key: (item: T) => K) {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item)
    ;(acc[k] ||= []).push(item)
    return acc
  }, {})
}

export function sortBy<T>(items: T[], pick: (item: T) => number | string, dir: 'asc' | 'desc' = 'asc') {
  return [...items].sort((a, b) => {
    const va = pick(a)
    const vb = pick(b)
    if (va === vb) return 0
    return (va > vb ? 1 : -1) * (dir === 'asc' ? 1 : -1)
  })
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

/** Variación porcentual entre dos períodos (para KPIs) */
export function delta(current: number, previous: number) {
  if (!previous) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}
