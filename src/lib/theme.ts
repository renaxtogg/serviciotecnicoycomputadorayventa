import { BRAND_CONFIG } from '@/config/brand'

/**
 * Inyecta la identidad visual definida en BRAND_CONFIG como variables CSS.
 * Es el único puente entre la configuración de marca y los estilos: cambiando
 * brand.ts se re-colorea todo el sistema sin tocar un solo componente.
 */
export function applyBrandTheme() {
  const root = document.documentElement.style
  const c = BRAND_CONFIG.colors
  root.setProperty('--brand-primary', c.primary)
  root.setProperty('--brand-primary-dark', c.primaryDark)
  root.setProperty('--brand-secondary', c.secondary)
  root.setProperty('--brand-accent', c.accent)
  root.setProperty('--brand-warning', c.warning)
  root.setProperty('--brand-danger', c.danger)
  root.setProperty('--brand-whatsapp', c.whatsapp)
  root.setProperty('--font-brand-display', BRAND_CONFIG.fonts.display)
  root.setProperty('--font-brand-body', BRAND_CONFIG.fonts.body)

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', BRAND_CONFIG.colors.secondary)
}
