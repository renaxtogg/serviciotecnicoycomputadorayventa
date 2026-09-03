# Planet Service — Demo comercial

Sitio web público + panel de gestión para un **servicio técnico de celulares y computadoras que además vende equipos**.
Pensado como demostración de venta: se abre en el navegador, funciona completo, sin backend ni base de datos.

- **Web pública** → capta clientes: cotizador de precios, tienda, seguimiento online de la reparación, WhatsApp en un clic.
- **Panel** (`/panel`) → gestiona el negocio: taller, ventas, inventario, clientes, caja y reportes.
- **Todo persiste en `localStorage`**: lo que cargues sigue ahí al recargar o cerrar el navegador.

---

## Cómo se usa

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # genera dist/
npm run preview   # sirve el build
npm test          # pruebas de datos + render (104 verificaciones)
```

---

## Deploy en Cloudflare Pages

En el dashboard de Cloudflare → **Workers & Pages → Create → Pages → Connect to Git**, elegí este repositorio y configurá:

| Campo | Valor |
|---|---|
| Framework preset | `Vite` (o `None`) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | `20` o superior (variable `NODE_VERSION`) |

No hacen falta variables de entorno ni secretos: la demo no llama a ninguna API.

Ya vienen incluidos en `public/`:

- **`_redirects`** — `/* /index.html 200`, necesario para que rutas como `/panel/ordenes` o `/seguimiento` funcionen al recargar o al entrar directo.
- **`_headers`** — caché inmutable para `/assets/*` y cabeceras de seguridad básicas.
- **`robots.txt`** y **`sitemap.xml`** — el panel queda excluido de la indexación.

> Si preferís subir el build a mano: `npm run build` y arrastrá la carpeta `dist` a Cloudflare Pages (Direct Upload).

---

## Personalización para otro cliente

### 1. Marca, colores y contacto → `src/config/brand.ts`

**Un solo archivo** define toda la identidad. Los colores se inyectan como variables CSS en tiempo de ejecución
(`src/lib/theme.ts`), así que no hay colores repetidos por el proyecto.

```ts
export const BRAND_CONFIG = {
  name: 'Planet Service',
  logoUrl: null,                    // null = logotipo tipográfico incluido; o '/logo.svg'
  colors: {
    primary:   '#1B4DFF',           // acciones, enlaces, gráficos
    secondary: '#0A1633',           // header oscuro, footer, sidebar del panel
    accent:    '#12B981',           // éxito, garantía, disponible
    warning:   '#F59E0B',
    danger:    '#E11D48',
  },
  fonts: { display: "...", body: "..." },
  phone: '021 336 908',
  whatsapp: '595981447203',         // internacional, sin + ni espacios
  email: '...', address: '...', city: '...', mapsUrl: '...', coords: { lat, lng },
  hours: [...],                     // open: null = cerrado
  social: { instagram: '...' },
  ruc: '...', warrantyDays: 90,
  currency: { code: 'PYG', symbol: '₲', locale: 'es-PY' },
  seo: { domain: '...', defaultTitle: '...', defaultDescription: '...' },
}
```

**Logo:** poné el archivo en `public/` y cambiá `logoUrl: '/logo.svg'`. Si lo dejás en `null`, se dibuja el logotipo
tipográfico de `src/site/Logo.tsx` con los colores de marca.

**Favicon y portada social:** reemplazá `public/favicon.svg` y `public/og-cover.svg`.

### 2. Textos del sitio → `src/config/content.ts`

Titular del hero, propuesta de valor, pasos del proceso, diferenciadores, preguntas frecuentes, franjas horarias
y el **cotizador rápido** (equipos, marcas, fallas y rangos de precio).

### 3. Metadatos estáticos → `index.html`

Título, descripción, Open Graph y el bloque **JSON-LD `LocalBusiness`** (dirección, horarios, teléfono).
Es el fallback para buscadores; el contenido "vivo" por ruta lo sincroniza `src/lib/seo.ts`.

### 4. Catálogo inicial → `src/demo/catalog.ts`

Productos, servicios, modelos de equipos, fallas típicas, testimonios, nombres y barrios.
Ahí se cambia el rubro completo sin tocar la aplicación.

### 5. Servicios y productos publicados → desde el propio panel

**Servicios web** e **Inventario** editan lo que ve el cliente en la web. Marcar un producto como *publicado*
lo hace aparecer en la tienda al instante. Es el mejor momento de la demo: se edita un precio delante del cliente
y se muestra el cambio en el sitio.

### 6. Escala visual → `src/index.css`

Radios, sombras, superficies, tipografía base y colores de los gráficos, todo en variables CSS bajo `:root`.

---

## Arquitectura

```
src/
  config/
    brand.ts          ← identidad: nombre, logo, colores, contacto, SEO
    content.ts        ← textos del sitio + cotizador
  lib/
    theme.ts          ← inyecta BRAND_CONFIG como variables CSS
    format.ts         ← guaraníes, fechas, teléfonos paraguayos
    seo.ts            ← title/description/canonical por ruta
    whatsapp.ts       ← enlaces con mensaje pre-cargado
  demo/
    types.ts          ← modelo de dominio y estados de la orden
    catalog.ts        ← catálogo base (productos, servicios, fallas)
    seed.ts           ← genera ~3 meses de historia operativa realista
    storage.ts        ← persistencia en localStorage
    store.tsx         ← estado global + reglas de negocio
    metrics.ts        ← KPIs, series y agregados
  components/ui/      ← botones, tablas, modales, formularios, gráficos SVG
  site/               ← web pública
  admin/              ← panel de gestión
public/
  _redirects, _headers, robots.txt, sitemap.xml, favicon.svg, og-cover.svg
smoke/                ← pruebas (no se publican)
```

### Flujo de la orden de servicio

```
Recibido → Diagnóstico → Presupuestado → Aprobado → En reparación ⇄ Esperando repuesto → Listo → Entregado
                              ↓                            ↓
                         Rechazado                   Sin reparación
```

Cada transición deja rastro en el historial, y **Entregado** cobra el saldo pendiente y lo registra en caja.

---

## Reglas de negocio implementadas

- Una **venta** descuenta stock, entra a caja y alerta si el producto queda bajo el mínimo.
- **Anular** una venta devuelve el stock y compensa la caja.
- **Entregar** una orden cobra el saldo, registra el ingreso y arranca la garantía.
- Un **ingreso de mercadería** genera el egreso de caja por el costo.
- Una **solicitud web** se convierte en orden creando el cliente si no existía.
- El **seguimiento público** muestra solo el nombre de pila y el teléfono enmascarado.

---

## Pruebas

```bash
npm run test:data     # 60+ verificaciones: integridad, coherencia, KPIs, formato
npm run test:render   # 44 verificaciones: cada pantalla renderiza con datos reales
npm test              # las dos
```

`test:render` monta la aplicación en un DOM real (jsdom), deja correr los efectos y comprueba que cada ruta
dibuje contenido, incluida la persistencia en `localStorage`.

---

## Alcance

Es una **demostración comercial**, no un producto en producción. No tiene backend, autenticación real,
multiusuario, respaldos ni facturación electrónica. La lógica de negocio, en cambio, es la real:
sirve para mostrarle al dueño exactamente cómo trabajaría.

Los datos son ficticios pero verosímiles para Paraguay: nombres, teléfonos `09xx xxx xxx`, precios en guaraníes
y equipos que efectivamente entran a un taller.
