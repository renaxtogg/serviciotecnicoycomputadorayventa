import { BRAND_CONFIG } from '@/config/brand'

/**
 * Construye un enlace de WhatsApp con mensaje pre-cargado.
 * Pre-cargar el contexto (servicio, modelo, producto) reduce la fricción y
 * evita el ida y vuelta de "hola, ¿qué necesitás?".
 */
export function waLink(message?: string) {
  const base = `https://wa.me/${BRAND_CONFIG.whatsapp}`
  if (!message) return base
  return `${base}?text=${encodeURIComponent(message)}`
}

export const waMessages = {
  general: () => `Hola ${BRAND_CONFIG.name}, quiero hacer una consulta.`,
  service: (service: string, device?: string) =>
    `Hola ${BRAND_CONFIG.name}, quiero consultar por *${service}*${device ? ` para mi ${device}` : ''}. ¿Cuánto sale y cuánto demora?`,
  quote: (brand: string, model: string, issue: string, estimate?: string) =>
    `Hola ${BRAND_CONFIG.name}, cotizo una reparación:\n` +
    `• Equipo: ${brand} ${model}\n` +
    `• Problema: ${issue}\n` +
    (estimate ? `• Estimado web: ${estimate}\n` : '') +
    `¿Me confirman disponibilidad?`,
  product: (name: string, price: string) =>
    `Hola ${BRAND_CONFIG.name}, me interesa *${name}* (${price}). ¿Sigue disponible? ¿Manejan cuotas?`,
  order: (code: string) =>
    `Hola ${BRAND_CONFIG.name}, consulto por mi orden *${code}*.`,
  location: () => `Hola ${BRAND_CONFIG.name}, ¿me pasan la ubicación exacta del local?`,
}
