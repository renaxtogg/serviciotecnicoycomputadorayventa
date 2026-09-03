import type { Tone } from '@/demo/types'

/** Cada tono apunta a una variable de marca: cambiar brand.ts recolorea todo. */
export const TONE_VAR: Record<Tone, string> = {
  blue: 'var(--brand-primary)',
  navy: 'var(--brand-secondary)',
  mint: 'var(--brand-accent)',
  amber: 'var(--brand-warning)',
  danger: 'var(--brand-danger)',
  slate: 'var(--text-muted)',
}

export function toneSoft(tone: Tone, strength = 11) {
  const c = TONE_VAR[tone]
  return {
    background: `color-mix(in srgb, ${c} ${strength}%, transparent)`,
    color: tone === 'slate' ? 'var(--text-body)' : c,
    borderColor: `color-mix(in srgb, ${c} ${strength + 14}%, transparent)`,
  }
}

export function toneSolid(tone: Tone) {
  return { background: TONE_VAR[tone], color: '#fff' }
}

export function toneText(tone: Tone) {
  return { color: TONE_VAR[tone] }
}
