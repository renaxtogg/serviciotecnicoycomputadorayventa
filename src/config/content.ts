/* ============================================================================
   CONTENIDO DEL SITIO PÚBLICO
   Todo el texto de marketing vive acá. Cambiar de cliente = editar este archivo
   y brand.ts, sin tocar componentes.
   ==========================================================================*/
import { BRAND_CONFIG } from './brand'

export const HERO = {
  badge: `Diagnóstico sin costo · Garantía de ${BRAND_CONFIG.warrantyDays} días`,
  title: 'Reparamos tu celular o notebook',
  titleAccent: 'y te avisamos en cada paso',
  subtitle:
    'Servicio técnico en Asunción con presupuesto antes de tocar tu equipo, seguimiento online de la reparación y garantía por escrito. También vendemos celulares, notebooks y accesorios.',
  primaryCta: 'Pedir presupuesto',
  secondaryCta: 'Ver la tienda',
  trackTitle: '¿Ya dejaste tu equipo?',
  trackHint: 'Ingresá el código de tu orden (ej. OS-1042) y mirá en qué estado está.',
}

/** Datos duros que generan confianza. Ajustar a la realidad de cada cliente. */
export const TRUST_STATS = [
  { value: '+8.400', label: 'equipos reparados' },
  { value: '4.9/5', label: 'promedio de reseñas' },
  { value: '24 h', label: 'promedio de entrega' },
  { value: `${BRAND_CONFIG.foundedYear}`, label: 'desde' },
]

/** Los tres miedos reales de quien deja su equipo en un service */
export const VALUE_PROPS = [
  {
    icon: 'shield',
    title: 'Presupuesto antes de tocar nada',
    text: 'Revisamos el equipo, te mandamos el detalle por WhatsApp y recién trabajamos cuando lo aprobás. Si no aceptás, no pagás el diagnóstico.',
  },
  {
    icon: 'eye',
    title: 'Seguimiento online, sin llamar',
    text: 'Cada equipo entra con un código de orden. Lo ponés en la web y ves si está en diagnóstico, en reparación o listo para retirar.',
  },
  {
    icon: 'badge-check',
    title: `Garantía escrita de ${BRAND_CONFIG.warrantyDays} días`,
    text: 'Repuestos de calidad y garantía por escrito sobre la mano de obra y la pieza. Si vuelve a fallar por lo mismo, lo resolvemos sin cargo.',
  },
]

export const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Traés o pedís el retiro',
    text: 'Nos escribís por WhatsApp o pasás por el local. Registramos el equipo con un checklist del estado en el que llega.',
  },
  {
    step: '02',
    title: 'Diagnosticamos sin costo',
    text: 'Un técnico revisa el equipo y determina la falla real. El diagnóstico no se cobra, aceptes o no el trabajo.',
  },
  {
    step: '03',
    title: 'Te pasamos el presupuesto',
    text: 'Recibís el detalle de repuestos, mano de obra y plazo. Lo aprobás o no, sin compromiso ni presión.',
  },
  {
    step: '04',
    title: 'Reparamos y te avisamos',
    text: 'Trabajamos sobre el equipo y te notificamos cuando está listo. Podés seguir el avance online con tu código de orden.',
  },
]

export const DIFFERENTIATORS = [
  {
    title: 'Micro-soldadura propia',
    text: 'Tenemos estación de aire caliente y microscopio. Reparamos placas que en otros lados descartan.',
  },
  {
    title: 'Repuestos con trazabilidad',
    text: 'Sabés exactamente qué pieza se le puso a tu equipo y de qué calidad es. Nada de "cambié la plaqueta".',
  },
  {
    title: 'Datos respaldados antes de tocar',
    text: 'Antes de formatear o reparar, respaldamos tu información. Tus fotos y archivos no se pierden.',
  },
  {
    title: 'Atención a empresas',
    text: 'Planes de mantenimiento para oficinas, con soporte en el lugar y prioridad en la cola del taller.',
  },
]

export const FAQ = [
  {
    q: '¿Cuánto sale el diagnóstico?',
    a: 'Nada. El diagnóstico es sin cargo y no tenés obligación de dejar el equipo. Te pasamos el presupuesto y vos decidís.',
  },
  {
    q: '¿Cuánto tarda una reparación?',
    a: 'Depende del trabajo. Un cambio de batería o de pantalla sale en el día. Una reparación de placa o algo que necesite un repuesto especial puede llevar entre 2 y 5 días. En el presupuesto te decimos el plazo estimado.',
  },
  {
    q: '¿Qué garantía tienen los trabajos?',
    a: `Damos ${BRAND_CONFIG.warrantyDays} días de garantía por escrito sobre la mano de obra y el repuesto colocado. No cubre golpes, humedad posterior ni manipulación de terceros.`,
  },
  {
    q: '¿Se pierden mis datos?',
    a: 'En la mayoría de las reparaciones no. Igual, antes de trabajar te consultamos si querés que hagamos un respaldo. En equipos que no encienden hacemos recuperación de datos como servicio aparte.',
  },
  {
    q: '¿Puedo ver cómo va mi reparación?',
    a: 'Sí. Cuando dejás el equipo te damos un código de orden. Lo cargás en la sección "Seguimiento" de esta web y ves el estado actualizado sin tener que llamar.',
  },
  {
    q: '¿Aceptan tarjeta o hacen cuotas?',
    a: 'Aceptamos efectivo, transferencia, pago QR y tarjetas de débito y crédito. En la compra de equipos manejamos planes en cuotas con tarjeta.',
  },
  {
    q: '¿Los equipos que venden son nuevos?',
    a: 'Tenemos equipos nuevos sellados y también reacondicionados revisados por nuestros propios técnicos. Cada publicación aclara la condición, la garantía y el estado de la batería si corresponde.',
  },
  {
    q: '¿Toman equipos usados en parte de pago?',
    a: 'Sí, según el modelo y el estado. Traelo al local y te hacemos una cotización en el momento.',
  },
]

/* --------------------------------------------------------------------------
   COTIZADOR RÁPIDO
   Estimación orientativa para bajar la fricción del "¿cuánto sale?".
   El precio final siempre lo confirma el diagnóstico.
   -------------------------------------------------------------------------*/
export const QUOTE_DEVICES = [
  { value: 'celular', label: 'Celular' },
  { value: 'notebook', label: 'Notebook' },
  { value: 'pc', label: 'PC de escritorio' },
  { value: 'tablet', label: 'Tablet' },
] as const

export const QUOTE_BRANDS: Record<string, string[]> = {
  celular: ['Samsung', 'Apple', 'Xiaomi', 'Motorola', 'Honor', 'Tecno', 'Otra marca'],
  notebook: ['Lenovo', 'HP', 'Dell', 'Acer', 'Asus', 'Apple', 'Otra marca'],
  pc: ['Armada', 'Dell', 'HP', 'Lenovo', 'Otra marca'],
  tablet: ['Samsung', 'Apple', 'Lenovo', 'Otra marca'],
}

export interface QuoteIssue {
  id: string
  label: string
  /** Rango estimado en guaraníes */
  from: number
  to: number
  eta: string
}

export const QUOTE_ISSUES: Record<string, QuoteIssue[]> = {
  celular: [
    { id: 'pantalla', label: 'Pantalla rota o sin imagen', from: 380000, to: 950000, eta: 'Mismo día' },
    { id: 'bateria', label: 'Batería que no dura', from: 220000, to: 420000, eta: '2 horas' },
    { id: 'carga', label: 'No carga / hay que mover el cable', from: 180000, to: 320000, eta: 'Mismo día' },
    { id: 'mojado', label: 'Se mojó', from: 250000, to: 850000, eta: '48 horas' },
    { id: 'software', label: 'Se traba, se reinicia o no arranca', from: 120000, to: 260000, eta: '3 horas' },
    { id: 'camara', label: 'Cámara o audio con fallas', from: 180000, to: 420000, eta: 'Mismo día' },
    { id: 'placa', label: 'No enciende (reparación de placa)', from: 450000, to: 1200000, eta: '3 a 5 días' },
  ],
  notebook: [
    { id: 'lenta', label: 'Muy lenta al arrancar', from: 320000, to: 620000, eta: 'Mismo día' },
    { id: 'temp', label: 'Se calienta o se apaga sola', from: 190000, to: 340000, eta: 'Mismo día' },
    { id: 'pantalla', label: 'Pantalla rota o negra', from: 620000, to: 1400000, eta: '2 a 4 días' },
    { id: 'teclado', label: 'Teclas que no funcionan', from: 290000, to: 520000, eta: '2 días' },
    { id: 'bisagra', label: 'Bisagra o carcasa rota', from: 280000, to: 560000, eta: '2 días' },
    { id: 'noprende', label: 'No enciende (reparación de placa)', from: 480000, to: 1500000, eta: '3 a 6 días' },
    { id: 'formateo', label: 'Formateo e instalación de programas', from: 180000, to: 320000, eta: 'Mismo día' },
  ],
  pc: [
    { id: 'noprende', label: 'No enciende', from: 250000, to: 900000, eta: '1 a 3 días' },
    { id: 'lenta', label: 'Muy lenta / disco lleno', from: 320000, to: 680000, eta: 'Mismo día' },
    { id: 'upgrade', label: 'Ampliar memoria o disco', from: 280000, to: 900000, eta: 'Mismo día' },
    { id: 'formateo', label: 'Formateo e instalación', from: 180000, to: 320000, eta: 'Mismo día' },
    { id: 'armado', label: 'Armado de PC a medida', from: 150000, to: 400000, eta: '1 a 2 días' },
  ],
  tablet: [
    { id: 'pantalla', label: 'Pantalla rota', from: 420000, to: 980000, eta: '2 días' },
    { id: 'bateria', label: 'Batería que no dura', from: 260000, to: 480000, eta: '1 día' },
    { id: 'carga', label: 'No carga', from: 200000, to: 360000, eta: '1 día' },
    { id: 'software', label: 'Software / no arranca', from: 130000, to: 280000, eta: '1 día' },
  ],
}

/** Franjas para agendar la visita al local */
export const TIME_SLOTS = [
  'Hoy a la mañana',
  'Hoy a la tarde',
  'Mañana a la mañana',
  'Mañana a la tarde',
  'Esta semana, cualquier día',
  'El sábado a la mañana',
]

export const NAV_LINKS = [
  { to: '/servicios', label: 'Servicios' },
  { to: '/tienda', label: 'Tienda' },
  { to: '/seguimiento', label: 'Seguimiento' },
  { to: '/contacto', label: 'Contacto' },
]
