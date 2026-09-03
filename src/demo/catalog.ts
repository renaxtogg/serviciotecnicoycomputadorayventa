/* ============================================================================
   CATÁLOGO BASE DE LA DEMO
   Productos, servicios, fallas y nombres usados por el generador de datos.
   Precios en guaraníes, coherentes con el mercado paraguayo.
   ==========================================================================*/
import type { ProductCategory, Tone } from './types'

export const PERSON_NAMES = [
  'Rodrigo Benítez', 'Carmen Villalba', 'Derlis Cáceres', 'Liz Fernández',
  'Nathalia Ovelar', 'Óscar Giménez', 'Marcos Duarte', 'Fátima Riveros',
  'Hugo Escobar', 'Lourdes Aquino', 'Sergio Ayala', 'Belén Ramírez',
  'Wilfrido Zaracho', 'Larissa Insfrán', 'Cristian Bogado', 'Dahiana Cabral',
  'Néstor Vera', 'Mirta Espínola', 'Gustavo Franco', 'Rocío Núñez',
  'Jorge Ortiz', 'Sandra Melgarejo', 'Aldo Pereira', 'Nadia Chávez',
  'Elvio Barreto', 'Tania Recalde', 'Julio Sanabria', 'Verónica Paredes',
  'Alcides Rojas', 'Karen Godoy', 'Diego Maldonado', 'Silvia Acosta',
  'Rubén Talavera', 'Patricia Ocampos', 'Fabián Cardozo', 'Noelia Britos',
  'Enrique Samudio', 'Gloria Alderete', 'Matías Leguizamón', 'Andrea Coronel',
]

export const COMPANY_NAMES = [
  'Farmacia San Blas', 'Despensa Doña Ramona', 'Estudio Contable Ayala & Asoc.',
  'Colegio San Miguel', 'Ferretería El Tornillo', 'Inmobiliaria Yvoty',
  'Transporte Guaraní SRL', 'Panadería La Esquina',
]

export const NEIGHBORHOODS = [
  'Villa Morra', 'Barrio Jara', 'Sajonia', 'San Vicente', 'Recoleta',
  'Trinidad', 'Fernando de la Mora', 'Lambaré', 'San Lorenzo', 'Luque',
  'Mariano Roque Alonso', 'Ñemby', 'Capiatá', 'Villa Elisa',
]

export const PHONE_PREFIXES = ['0981', '0982', '0983', '0985', '0986', '0991', '0971', '0972', '0975', '0976']

/* --------------------------------------------------------------------------
   Equipos frecuentes en el taller
   -------------------------------------------------------------------------*/
export const PHONE_MODELS = [
  { brand: 'Samsung', model: 'Galaxy A54' }, { brand: 'Samsung', model: 'Galaxy A15' },
  { brand: 'Samsung', model: 'Galaxy S21' }, { brand: 'Samsung', model: 'Galaxy A34' },
  { brand: 'Xiaomi', model: 'Redmi Note 12' }, { brand: 'Xiaomi', model: 'Redmi Note 13 Pro' },
  { brand: 'Xiaomi', model: 'Poco X5' }, { brand: 'Apple', model: 'iPhone 11' },
  { brand: 'Apple', model: 'iPhone 12' }, { brand: 'Apple', model: 'iPhone 13' },
  { brand: 'Apple', model: 'iPhone XR' }, { brand: 'Motorola', model: 'Moto G54' },
  { brand: 'Motorola', model: 'Moto E13' }, { brand: 'Honor', model: 'X8b' },
  { brand: 'Tecno', model: 'Spark 20' },
]

export const LAPTOP_MODELS = [
  { brand: 'Lenovo', model: 'IdeaPad 3 15ITL' }, { brand: 'Lenovo', model: 'ThinkPad E14' },
  { brand: 'HP', model: '250 G9' }, { brand: 'HP', model: 'Pavilion 15' },
  { brand: 'Dell', model: 'Inspiron 3520' }, { brand: 'Acer', model: 'Aspire 5 A515' },
  { brand: 'Asus', model: 'VivoBook X515' }, { brand: 'Apple', model: 'MacBook Air M1' },
  { brand: 'Exo', model: 'Smart XL4' },
]

export const PC_MODELS = [
  { brand: 'Armada', model: 'Intel i5 / 16GB' },
  { brand: 'Dell', model: 'OptiPlex 3070' },
  { brand: 'HP', model: 'ProDesk 400 G6' },
  { brand: 'Armada', model: 'Ryzen 5 / GTX 1650' },
]

export const TABLET_MODELS = [
  { brand: 'Samsung', model: 'Galaxy Tab A8' },
  { brand: 'Apple', model: 'iPad 9na gen' },
  { brand: 'Lenovo', model: 'Tab M10' },
]

/* --------------------------------------------------------------------------
   Fallas típicas por tipo de equipo, con su reparación y rango de precio
   -------------------------------------------------------------------------*/
export interface IssueTemplate {
  issue: string
  diagnosis: string
  work: string
  part?: { name: string; cost: number; price: number }
  labor: number
}

export const PHONE_ISSUES: IssueTemplate[] = [
  {
    issue: 'Se le cayó y quedó la pantalla rota, no responde al tacto',
    diagnosis: 'Módulo de pantalla dañado por impacto. Placa y batería sin daño.',
    work: 'Cambio de módulo de pantalla completo. Prueba de táctil, sensores y cámara frontal.',
    part: { name: 'Módulo de pantalla', cost: 320000, price: 520000 },
    labor: 120000,
  },
  {
    issue: 'La batería dura menos de medio día y se apaga con 20%',
    diagnosis: 'Batería con 71% de salud y 940 ciclos. Requiere reemplazo.',
    work: 'Cambio de batería original compatible. Calibración de carga.',
    part: { name: 'Batería', cost: 130000, price: 240000 },
    labor: 60000,
  },
  {
    issue: 'No carga, hay que mover el cable para que tome carga',
    diagnosis: 'Pin de carga con pines desgastados y suciedad compactada.',
    work: 'Reemplazo de flex de carga y limpieza del puerto.',
    part: { name: 'Flex de carga', cost: 85000, price: 165000 },
    labor: 85000,
  },
  {
    issue: 'Se cayó al agua, prendió y después se apagó',
    diagnosis: 'Oxidación en placa madre, zona de gestión de energía.',
    work: 'Limpieza ultrasónica de placa, reemplazo de componentes oxidados y secado.',
    labor: 280000,
  },
  {
    issue: 'Se queda en el logo al encender',
    diagnosis: 'Sistema operativo corrupto tras actualización fallida.',
    work: 'Reinstalación de firmware conservando datos del usuario.',
    labor: 120000,
  },
  {
    issue: 'No se escucha al hablar por llamada',
    diagnosis: 'Auricular superior obstruido y flex de altavoz dañado.',
    work: 'Reemplazo de auricular y limpieza de rejilla.',
    part: { name: 'Auricular / speaker', cost: 55000, price: 110000 },
    labor: 70000,
  },
  {
    issue: 'La cámara sale toda borrosa',
    diagnosis: 'Lente de cámara trasera rayado y módulo con enfoque defectuoso.',
    work: 'Cambio de módulo de cámara trasera y vidrio de lente.',
    part: { name: 'Módulo de cámara', cost: 145000, price: 265000 },
    labor: 80000,
  },
]

export const LAPTOP_ISSUES: IssueTemplate[] = [
  {
    issue: 'Muy lenta, tarda 5 minutos en encender',
    diagnosis: 'Disco mecánico con sectores lentos. Sistema saturado.',
    work: 'Instalación de SSD, migración de datos y optimización del sistema.',
    part: { name: 'SSD 480GB', cost: 185000, price: 315000 },
    labor: 180000,
  },
  {
    issue: 'Se calienta mucho y se apaga sola',
    diagnosis: 'Disipador obstruido con polvo y pasta térmica seca.',
    work: 'Desarme completo, limpieza de disipador y cambio de pasta térmica.',
    labor: 190000,
  },
  {
    issue: 'No prende, no da señal de vida',
    diagnosis: 'Cortocircuito en línea de alimentación de la placa.',
    work: 'Reparación de placa: reemplazo de mosfet y controlador de carga.',
    labor: 480000,
  },
  {
    issue: 'La pantalla queda negra pero se escucha que prende',
    diagnosis: 'Panel LCD con backlight quemado.',
    work: 'Reemplazo de panel LCD 15.6" y prueba de video.',
    part: { name: 'Panel LCD 15.6"', cost: 420000, price: 690000 },
    labor: 150000,
  },
  {
    issue: 'Se rompió la bisagra y la tapa se separa',
    diagnosis: 'Bisagra derecha fracturada y carcasa con inserto arrancado.',
    work: 'Reemplazo de bisagra y refuerzo de carcasa.',
    part: { name: 'Bisagra + carcasa', cost: 165000, price: 290000 },
    labor: 160000,
  },
  {
    issue: 'Varias teclas no funcionan',
    diagnosis: 'Teclado con membrana dañada por líquido.',
    work: 'Reemplazo de teclado completo.',
    part: { name: 'Teclado notebook', cost: 175000, price: 305000 },
    labor: 90000,
  },
  {
    issue: 'Aparecen ventanas de publicidad y anda lentísima',
    diagnosis: 'Sistema con adware y arranque saturado.',
    work: 'Formateo, instalación limpia de Windows 11, Office y antivirus.',
    labor: 220000,
  },
]

export const PC_ISSUES: IssueTemplate[] = [
  {
    issue: 'Se reinicia sola cuando juego',
    diagnosis: 'Fuente de poder genérica insuficiente, caída de tensión bajo carga.',
    work: 'Reemplazo de fuente por una de 600W certificada y prueba de estrés.',
    part: { name: 'Fuente 600W 80+', cost: 320000, price: 520000 },
    labor: 120000,
  },
  {
    issue: 'No arranca Windows, tira pantalla azul',
    diagnosis: 'Disco de sistema con sectores defectuosos.',
    work: 'Clonado a SSD nuevo, reparación de arranque y verificación de datos.',
    part: { name: 'SSD 480GB', cost: 185000, price: 315000 },
    labor: 190000,
  },
  {
    issue: 'Quiero ampliar memoria para trabajar con planillas grandes',
    diagnosis: 'Equipo con 8GB, uso de memoria al 94%. Soporta hasta 32GB.',
    work: 'Instalación de 2x8GB DDR4 y configuración de canal dual.',
    part: { name: 'RAM 8GB DDR4 (x2)', cost: 360000, price: 590000 },
    labor: 80000,
  },
]

/* --------------------------------------------------------------------------
   Catálogo de servicios publicado en la web
   -------------------------------------------------------------------------*/
export const SERVICE_SEED = [
  {
    name: 'Cambio de pantalla',
    category: 'celular' as const,
    description: 'Módulo completo con garantía. Cambiamos pantallas de iPhone, Samsung, Xiaomi y Motorola el mismo día.',
    fromPrice: 320000, etaHours: 6, warrantyDays: 90, icon: 'smartphone', popular: true,
  },
  {
    name: 'Cambio de batería',
    category: 'celular' as const,
    description: 'Si tu celular no llega al final del día, medimos la salud real de la batería y la reemplazamos en el momento.',
    fromPrice: 180000, etaHours: 2, warrantyDays: 90, icon: 'battery', popular: true,
  },
  {
    name: 'Reparación de pin de carga',
    category: 'celular' as const,
    description: '¿Tenés que mover el cable para que cargue? Cambiamos el flex de carga y limpiamos el puerto.',
    fromPrice: 150000, etaHours: 4, warrantyDays: 60, icon: 'plug',
  },
  {
    name: 'Equipo mojado — limpieza de placa',
    category: 'celular' as const,
    description: 'Limpieza ultrasónica y recuperación de placas oxidadas. Cuanto antes lo traigas, más chances hay.',
    fromPrice: 220000, etaHours: 48, warrantyDays: 30, icon: 'droplet',
  },
  {
    name: 'Liberación y software',
    category: 'celular' as const,
    description: 'Equipos trabados en el logo, actualizaciones fallidas, cuentas y restauración de sistema.',
    fromPrice: 90000, etaHours: 3, warrantyDays: 30, icon: 'refresh',
  },
  {
    name: 'Recuperación de datos',
    category: 'general' as const,
    description: 'Fotos, contactos y archivos de celulares y discos dañados. Diagnóstico previo sin cargo.',
    fromPrice: 250000, etaHours: 72, warrantyDays: 0, icon: 'database', popular: true,
  },
  {
    name: 'Cambio a disco SSD + migración',
    category: 'notebook' as const,
    description: 'La mejora que más se nota: tu notebook arranca en segundos. Migramos todo sin perder nada.',
    fromPrice: 180000, etaHours: 6, warrantyDays: 180, icon: 'hard-drive', popular: true,
  },
  {
    name: 'Ampliación de memoria RAM',
    category: 'notebook' as const,
    description: 'Verificamos compatibilidad, instalamos y probamos en canal dual.',
    fromPrice: 120000, etaHours: 2, warrantyDays: 180, icon: 'memory',
  },
  {
    name: 'Limpieza y cambio de pasta térmica',
    category: 'notebook' as const,
    description: 'Si se calienta o se apaga sola: desarme completo, limpieza de disipador y pasta térmica premium.',
    fromPrice: 160000, etaHours: 5, warrantyDays: 90, icon: 'wind', popular: true,
  },
  {
    name: 'Formateo e instalación de programas',
    category: 'notebook' as const,
    description: 'Windows 11 original, Office, antivirus y drivers. Respaldamos tus archivos antes de tocar nada.',
    fromPrice: 140000, etaHours: 5, warrantyDays: 30, icon: 'monitor',
  },
  {
    name: 'Reparación de placa (micro-soldadura)',
    category: 'notebook' as const,
    description: 'Notebooks y celulares que no encienden. Trabajo a nivel componente con estación de aire y microscopio.',
    fromPrice: 480000, etaHours: 72, warrantyDays: 90, icon: 'cpu',
  },
  {
    name: 'Armado y actualización de PC',
    category: 'pc' as const,
    description: 'Te armamos la PC para lo que realmente necesitás: trabajo, diseño o juegos. Presupuesto sin compromiso.',
    fromPrice: 150000, etaHours: 24, warrantyDays: 90, icon: 'pc',
  },
  {
    name: 'Mantenimiento para empresas',
    category: 'general' as const,
    description: 'Plan mensual para oficinas: mantenimiento preventivo, respaldos y soporte prioritario en el lugar.',
    fromPrice: 350000, etaHours: 24, warrantyDays: 30, icon: 'building',
  },
]

/* --------------------------------------------------------------------------
   Productos en venta (vitrina + inventario)
   -------------------------------------------------------------------------*/
export interface ProductSeed {
  sku: string
  name: string
  category: ProductCategory
  brand: string
  model?: string
  condition: 'nuevo' | 'usado' | 'reacondicionado'
  cost: number
  price: number
  stock: number
  minStock: number
  warrantyDays: number
  specs: string[]
  description?: string
  published: boolean
  featured?: boolean
  location?: string
  emoji: string
  tone: Tone
}

export const PRODUCT_SEED: ProductSeed[] = [
  // --- Celulares ---
  {
    sku: 'CEL-SAM-A55', name: 'Samsung Galaxy A55 5G 256GB', category: 'celular', brand: 'Samsung',
    model: 'Galaxy A55 5G', condition: 'nuevo', cost: 2450000, price: 3290000, stock: 4, minStock: 2,
    warrantyDays: 365, specs: ['256GB / 8GB RAM', 'Pantalla Super AMOLED 6.6"', 'Cámara 50MP OIS', 'Batería 5000mAh'],
    description: 'Sellado, con garantía oficial. Ideal para quien quiere buena cámara y que le dure años.',
    published: true, featured: true, location: 'Vitrina A', emoji: '📱', tone: 'blue',
  },
  {
    sku: 'CEL-XIA-N13P', name: 'Xiaomi Redmi Note 13 Pro 256GB', category: 'celular', brand: 'Xiaomi',
    model: 'Redmi Note 13 Pro', condition: 'nuevo', cost: 1620000, price: 2190000, stock: 6, minStock: 2,
    warrantyDays: 365, specs: ['256GB / 8GB RAM', 'Cámara 200MP', 'Carga rápida 67W', 'Pantalla AMOLED 120Hz'],
    description: 'El más vendido del local. Relación precio-calidad imbatible.',
    published: true, featured: true, location: 'Vitrina A', emoji: '📱', tone: 'amber',
  },
  {
    sku: 'CEL-APP-13', name: 'iPhone 13 128GB — Reacondicionado', category: 'celular', brand: 'Apple',
    model: 'iPhone 13', condition: 'reacondicionado', cost: 3900000, price: 4950000, stock: 2, minStock: 1,
    warrantyDays: 180, specs: ['128GB', 'Batería 89% de salud', 'Libre de fábrica', 'Incluye cargador y funda'],
    description: 'Revisado por nuestros técnicos, sin detalles estéticos. Garantía escrita de 6 meses.',
    published: true, featured: true, location: 'Vitrina B', emoji: '📱', tone: 'navy',
  },
  {
    sku: 'CEL-MOT-G84', name: 'Motorola Moto G84 5G 256GB', category: 'celular', brand: 'Motorola',
    model: 'Moto G84', condition: 'nuevo', cost: 1290000, price: 1750000, stock: 3, minStock: 2,
    warrantyDays: 365, specs: ['256GB / 8GB RAM', 'Pantalla pOLED 6.5"', 'Sonido Dolby Atmos'],
    published: true, location: 'Vitrina A', emoji: '📱', tone: 'slate',
  },
  {
    sku: 'CEL-SAM-A15', name: 'Samsung Galaxy A15 128GB', category: 'celular', brand: 'Samsung',
    model: 'Galaxy A15', condition: 'nuevo', cost: 1050000, price: 1450000, stock: 1, minStock: 3,
    warrantyDays: 365, specs: ['128GB / 4GB RAM', 'Batería 5000mAh', 'Pantalla 6.5"'],
    description: 'La opción más pedida para primer celular o para regalar.',
    published: true, location: 'Vitrina A', emoji: '📱', tone: 'blue',
  },

  // --- Notebooks / PC ---
  {
    sku: 'NB-LEN-IP3', name: 'Notebook Lenovo IdeaPad 3 i5 16GB 512GB', category: 'notebook', brand: 'Lenovo',
    model: 'IdeaPad 3 15ITL', condition: 'nuevo', cost: 2950000, price: 3850000, stock: 3, minStock: 1,
    warrantyDays: 365, specs: ['Intel Core i5-1155G7', '16GB RAM DDR4', 'SSD 512GB NVMe', 'Pantalla 15.6" FHD'],
    description: 'Con Windows 11 y Office instalados sin costo. La usamos como estándar para estudio y oficina.',
    published: true, featured: true, location: 'Estante 1', emoji: '💻', tone: 'blue',
  },
  {
    sku: 'NB-HP-250', name: 'Notebook HP 250 G9 i3 8GB 256GB', category: 'notebook', brand: 'HP',
    model: '250 G9', condition: 'nuevo', cost: 2250000, price: 2990000, stock: 2, minStock: 1,
    warrantyDays: 365, specs: ['Intel Core i3-1215U', '8GB RAM', 'SSD 256GB', 'Pantalla 15.6"'],
    published: true, location: 'Estante 1', emoji: '💻', tone: 'slate',
  },
  {
    sku: 'NB-ACE-A515', name: 'Notebook Acer Aspire 5 Ryzen 5 16GB', category: 'notebook', brand: 'Acer',
    model: 'Aspire 5 A515', condition: 'nuevo', cost: 3200000, price: 4150000, stock: 2, minStock: 1,
    warrantyDays: 365, specs: ['Ryzen 5 7520U', '16GB RAM', 'SSD 512GB', 'Pantalla 15.6" IPS'],
    published: true, location: 'Estante 1', emoji: '💻', tone: 'mint',
  },
  {
    sku: 'NB-APP-AIRM1', name: 'MacBook Air M1 8GB 256GB — Usado', category: 'notebook', brand: 'Apple',
    model: 'MacBook Air M1', condition: 'usado', cost: 5400000, price: 6900000, stock: 1, minStock: 1,
    warrantyDays: 90, specs: ['Chip Apple M1', '8GB RAM', 'SSD 256GB', 'Batería 92% — 180 ciclos'],
    description: 'Impecable, con caja y cargador original. Revisado en nuestro taller.',
    published: true, featured: true, location: 'Vitrina B', emoji: '💻', tone: 'navy',
  },
  {
    sku: 'PC-ARM-R5', name: 'PC Armada Ryzen 5 + GTX 1650 16GB', category: 'pc', brand: 'Armada',
    model: 'Gamer Nivel 1', condition: 'nuevo', cost: 4100000, price: 5400000, stock: 2, minStock: 1,
    warrantyDays: 365, specs: ['Ryzen 5 5600G', '16GB DDR4 3200', 'SSD 500GB NVMe', 'GTX 1650 4GB', 'Fuente 600W 80+'],
    description: 'Armada y probada por nosotros. Corre los juegos actuales en alto a 1080p.',
    published: true, featured: true, location: 'Estante 2', emoji: '🖥️', tone: 'navy',
  },
  {
    sku: 'PC-DEL-3070', name: 'PC Dell OptiPlex 3070 i5 8GB — Reacondicionada', category: 'pc', brand: 'Dell',
    model: 'OptiPlex 3070', condition: 'reacondicionado', cost: 1350000, price: 1890000, stock: 4, minStock: 2,
    warrantyDays: 180, specs: ['Intel Core i5-9500', '8GB RAM', 'SSD 240GB', 'Formato mini torre'],
    description: 'Ideal para oficinas y despensas. Vendemos por cantidad con descuento.',
    published: true, location: 'Estante 2', emoji: '🖥️', tone: 'slate',
  },

  // --- Tablets ---
  {
    sku: 'TAB-SAM-A9', name: 'Tablet Samsung Galaxy Tab A9 64GB', category: 'tablet', brand: 'Samsung',
    model: 'Galaxy Tab A9', condition: 'nuevo', cost: 950000, price: 1290000, stock: 3, minStock: 1,
    warrantyDays: 365, specs: ['64GB / 4GB RAM', 'Pantalla 8.7"', 'Wi-Fi'],
    published: true, location: 'Vitrina B', emoji: '📲', tone: 'blue',
  },

  // --- Accesorios ---
  {
    sku: 'ACC-MON-S24', name: 'Monitor Samsung 24" LED FHD', category: 'accesorio', brand: 'Samsung',
    condition: 'nuevo', cost: 690000, price: 950000, stock: 5, minStock: 2, warrantyDays: 365,
    specs: ['24" Full HD 75Hz', 'HDMI + VGA', 'Panel IPS'],
    published: true, location: 'Estante 3', emoji: '🖵', tone: 'slate',
  },
  {
    sku: 'ACC-AUD-BT', name: 'Auriculares Bluetooth TWS', category: 'accesorio', brand: 'Xiaomi',
    condition: 'nuevo', cost: 105000, price: 165000, stock: 12, minStock: 5, warrantyDays: 180,
    specs: ['Bluetooth 5.3', 'Hasta 24h con estuche', 'Cancelación de ruido'],
    published: true, location: 'Mostrador', emoji: '🎧', tone: 'mint',
  },
  {
    sku: 'ACC-CAR-20W', name: 'Cargador rápido USB-C 20W', category: 'accesorio', brand: 'Genérico',
    condition: 'nuevo', cost: 48000, price: 85000, stock: 24, minStock: 8, warrantyDays: 90,
    specs: ['20W Power Delivery', 'Compatible iPhone y Android', 'Cable incluido'],
    published: true, location: 'Mostrador', emoji: '🔌', tone: 'amber',
  },
  {
    sku: 'ACC-VID-TEM', name: 'Vidrio templado (colocación incluida)', category: 'accesorio', brand: 'Genérico',
    condition: 'nuevo', cost: 12000, price: 35000, stock: 46, minStock: 15, warrantyDays: 0,
    specs: ['9H antishock', 'Colocación sin burbujas', 'Para todos los modelos'],
    published: true, location: 'Mostrador', emoji: '🛡️', tone: 'blue',
  },
  {
    sku: 'ACC-FUN-AS', name: 'Funda antishock reforzada', category: 'accesorio', brand: 'Genérico',
    condition: 'nuevo', cost: 18000, price: 45000, stock: 38, minStock: 12, warrantyDays: 0,
    specs: ['Esquinas reforzadas', 'Varios colores', 'Para todos los modelos'],
    published: true, location: 'Mostrador', emoji: '📦', tone: 'slate',
  },
  {
    sku: 'ACC-TEC-KIT', name: 'Kit teclado + mouse inalámbrico', category: 'accesorio', brand: 'Logitech',
    condition: 'nuevo', cost: 92000, price: 145000, stock: 7, minStock: 3, warrantyDays: 365,
    specs: ['Receptor USB único', 'Teclado en español', 'Pilas incluidas'],
    published: true, location: 'Estante 3', emoji: '⌨️', tone: 'slate',
  },

  // --- Componentes ---
  {
    sku: 'COM-SSD-480', name: 'SSD Kingston A400 480GB', category: 'componente', brand: 'Kingston',
    condition: 'nuevo', cost: 185000, price: 315000, stock: 9, minStock: 4, warrantyDays: 365,
    specs: ['SATA III 2.5"', 'Lectura 500MB/s', 'Instalación incluida'],
    description: 'El upgrade que más se nota en notebooks viejas.',
    published: true, featured: true, location: 'Depósito', emoji: '💾', tone: 'mint',
  },
  {
    sku: 'COM-RAM-8D4', name: 'Memoria RAM 8GB DDR4 3200MHz', category: 'componente', brand: 'Kingston',
    condition: 'nuevo', cost: 175000, price: 285000, stock: 2, minStock: 4, warrantyDays: 365,
    specs: ['8GB DDR4 3200MHz', 'Para notebook (SODIMM)', 'Instalación incluida'],
    published: true, location: 'Depósito', emoji: '🧠', tone: 'amber',
  },
  {
    sku: 'COM-FUE-600', name: 'Fuente de poder 600W 80+ Bronze', category: 'componente', brand: 'Aerocool',
    condition: 'nuevo', cost: 320000, price: 520000, stock: 3, minStock: 2, warrantyDays: 365,
    specs: ['600W reales', 'Certificación 80 Plus Bronze', 'Cableado completo'],
    published: true, location: 'Depósito', emoji: '⚡', tone: 'navy',
  },

  // --- Repuestos (uso interno del taller, no publicados) ---
  {
    sku: 'REP-PAN-IP11', name: 'Pantalla iPhone 11 (módulo)', category: 'repuesto', brand: 'Apple',
    condition: 'nuevo', cost: 320000, price: 520000, stock: 3, minStock: 2, warrantyDays: 90,
    specs: ['Calidad Incell premium'], published: false, location: 'Gaveta R1', emoji: '🔧', tone: 'slate',
  },
  {
    sku: 'REP-PAN-A54', name: 'Pantalla Samsung A54 (módulo OLED)', category: 'repuesto', brand: 'Samsung',
    condition: 'nuevo', cost: 380000, price: 590000, stock: 1, minStock: 2, warrantyDays: 90,
    specs: ['OLED con marco'], published: false, location: 'Gaveta R1', emoji: '🔧', tone: 'slate',
  },
  {
    sku: 'REP-BAT-IP12', name: 'Batería iPhone 12', category: 'repuesto', brand: 'Apple',
    condition: 'nuevo', cost: 130000, price: 240000, stock: 5, minStock: 3, warrantyDays: 90,
    specs: ['2815mAh compatible'], published: false, location: 'Gaveta R2', emoji: '🔋', tone: 'slate',
  },
  {
    sku: 'REP-FLE-CAR', name: 'Flex de carga (surtido Samsung/Xiaomi)', category: 'repuesto', brand: 'Genérico',
    condition: 'nuevo', cost: 45000, price: 165000, stock: 14, minStock: 6, warrantyDays: 60,
    specs: ['Varios modelos'], published: false, location: 'Gaveta R2', emoji: '🔧', tone: 'slate',
  },
  {
    sku: 'REP-LCD-156', name: 'Panel LCD notebook 15.6" FHD', category: 'repuesto', brand: 'Genérico',
    condition: 'nuevo', cost: 420000, price: 690000, stock: 2, minStock: 2, warrantyDays: 90,
    specs: ['30 pines, FHD mate'], published: false, location: 'Estante R', emoji: '🖵', tone: 'slate',
  },
  {
    sku: 'REP-TEC-NB', name: 'Teclado notebook (surtido HP/Lenovo)', category: 'repuesto', brand: 'Genérico',
    condition: 'nuevo', cost: 175000, price: 305000, stock: 4, minStock: 2, warrantyDays: 90,
    specs: ['Layout español latino'], published: false, location: 'Estante R', emoji: '⌨️', tone: 'slate',
  },
  {
    sku: 'REP-PAS-TER', name: 'Pasta térmica premium (jeringa)', category: 'repuesto', brand: 'Arctic',
    condition: 'nuevo', cost: 35000, price: 0, stock: 8, minStock: 3, warrantyDays: 0,
    specs: ['MX-4 4g — insumo de taller'], published: false, location: 'Taller', emoji: '🧴', tone: 'slate',
  },
]

/** Frases reales de clientes para testimonios (ficticias pero verosímiles) */
export const TESTIMONIALS = [
  {
    name: 'Liz Fernández',
    role: 'Villa Morra',
    text: 'Llevé mi iPhone con la pantalla destrozada un martes a la mañana y a las 4 de la tarde ya lo tenía como nuevo. Me fueron avisando por WhatsApp en cada paso.',
    rating: 5,
    service: 'Cambio de pantalla',
  },
  {
    name: 'Marcos Duarte',
    role: 'Fernando de la Mora',
    text: 'Mi notebook tardaba 5 minutos en prender. Le pusieron un SSD y ahora arranca en 12 segundos. Me pasaron el presupuesto antes de tocar nada, sin sorpresas.',
    rating: 5,
    service: 'Cambio a SSD',
  },
  {
    name: 'Estudio Contable Ayala & Asoc.',
    role: 'Empresa — Asunción',
    text: 'Nos hacen el mantenimiento de las 9 máquinas de la oficina. En temporada de balances es clave que respondan rápido, y responden.',
    rating: 5,
    service: 'Mantenimiento empresas',
  },
  {
    name: 'Nathalia Ovelar',
    role: 'Lambaré',
    text: 'Se me cayó el celular al agua y ya lo daba por perdido. Lo recuperaron con todas mis fotos. Honestos: me dijeron desde el principio que era 50 y 50.',
    rating: 5,
    service: 'Equipo mojado',
  },
  {
    name: 'Hugo Escobar',
    role: 'San Lorenzo',
    text: 'Compré una notebook para mi hija y me la entregaron con Windows y Office ya instalados. Encima me hicieron precio pagando en efectivo.',
    rating: 5,
    service: 'Venta de equipos',
  },
  {
    name: 'Rocío Núñez',
    role: 'Luque',
    text: 'Lo mejor es poder ver por la web en qué estado está la reparación. No tuve que llamar ni una vez para preguntar si estaba listo.',
    rating: 5,
    service: 'Seguimiento online',
  },
]
