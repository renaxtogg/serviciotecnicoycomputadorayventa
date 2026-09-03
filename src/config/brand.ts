/**
 * ============================================================================
 *  BRAND_CONFIG — ÚNICO ARCHIVO A EDITAR PARA CAMBIAR DE CLIENTE
 * ============================================================================
 *  Cambiando este archivo se re-marca TODO el sistema (web pública + panel):
 *  nombre, logo, colores, contacto, ubicación, horarios y redes sociales.
 *  Los colores se inyectan en tiempo de ejecución como variables CSS
 *  (ver src/lib/theme.ts), por lo que no hay colores hardcodeados en el código.
 * ============================================================================
 */

export const BRAND_CONFIG = {
  // --- Identidad -----------------------------------------------------------
  name: 'Planet Service',
  legalName: 'Planet Service PY',
  shortName: 'Planet',
  tagline: 'Servicio técnico y venta de celulares y computadoras',
  claim: 'Tu equipo en manos expertas',
  // Logo: dejar `logoUrl` en null para usar el logotipo tipográfico incluido.
  // Para usar una imagen: colocar el archivo en /public y poner '/logo.svg'
  logoUrl: null as string | null,
  foundedYear: 2017,

  // --- Colores de marca ----------------------------------------------------
  colors: {
    primary: '#1B4DFF', // azul eléctrico — acciones principales
    primaryDark: '#123AC7',
    secondary: '#0A1633', // navy — headers, footer, fondos oscuros
    accent: '#12B981', // verde menta — éxito, garantía, disponible
    warning: '#F59E0B',
    danger: '#E11D48',
    whatsapp: '#25D366',
  },

  // --- Tipografía ----------------------------------------------------------
  fonts: {
    display: "'Plus Jakarta Sans', system-ui, sans-serif",
    body: "'Inter', system-ui, -apple-system, sans-serif",
  },

  // --- Contacto ------------------------------------------------------------
  phone: '021 336 908',
  whatsapp: '595981447203', // formato internacional sin + ni espacios
  whatsappDisplay: '0981 447 203',
  email: 'contacto@planetservice.com.py',

  // --- Ubicación -----------------------------------------------------------
  address: 'Avda. Eusebio Ayala 1245 c/ Cnel. Torres',
  neighborhood: 'Barrio Villa Aurelia',
  city: 'Asunción',
  country: 'Paraguay',
  mapsUrl: 'https://maps.google.com/?q=Avda.+Eusebio+Ayala+1245,+Asunci%C3%B3n,+Paraguay',
  coords: { lat: -25.3097, lng: -57.5759 },

  // --- Horarios ------------------------------------------------------------
  hours: [
    { days: 'Lunes a Viernes', open: '08:00', close: '18:30' },
    { days: 'Sábados', open: '08:00', close: '13:00' },
    { days: 'Domingos', open: null, close: null }, // null = cerrado
  ],

  // --- Redes ---------------------------------------------------------------
  social: {
    instagram: 'https://www.instagram.com/planetservicepy/',
    instagramHandle: '@planetservicepy',
    facebook: 'https://www.facebook.com/planetservicepy',
    tiktok: '',
  },

  // --- Datos comerciales ---------------------------------------------------
  ruc: '80098765-4',
  warrantyDays: 90,
  freeDiagnosis: true,
  currency: { code: 'PYG', symbol: '₲', locale: 'es-PY' },

  // --- SEO -----------------------------------------------------------------
  seo: {
    domain: 'https://planetservice.com.py',
    defaultTitle: 'Planet Service | Servicio técnico de celulares y notebooks en Asunción',
    defaultDescription:
      'Reparación de celulares, notebooks y PC en Asunción. Diagnóstico gratis, garantía de 90 días y seguimiento online de tu reparación. También vendemos equipos y accesorios.',
  },
} as const

export type BrandConfig = typeof BRAND_CONFIG
