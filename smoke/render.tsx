/* Prueba de render real: monta la aplicación en un DOM, deja correr los efectos
   (incluida la carga desde localStorage) y verifica que cada pantalla dibuje
   contenido de verdad. Se ejecuta en Node, no forma parte del sitio publicado. */
import './dom'

import { act, createElement, StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { App } from '@/App'
import { DemoProvider } from '@/demo/store'
import { ToastProvider } from '@/components/ui/overlay'
import { loadDB } from '@/demo/storage'

let failed = 0
function check(label: string, ok: boolean, extra?: unknown) {
  if (ok) console.log(`  ok   ${label}`)
  else {
    failed++
    console.log(`  FAIL ${label}`, extra ?? '')
  }
}

const container = document.getElementById('root')!
let root: Root | null = null

async function renderRoute(path: string) {
  await act(async () => {
    if (root) root.unmount()
    root = createRoot(container)
    root.render(
      createElement(
        StrictMode,
        null,
        createElement(
          MemoryRouter,
          { initialEntries: [path] },
          createElement(DemoProvider, null, createElement(ToastProvider, null, createElement(App))),
        ),
      ),
    )
  })
  // deja correr los efectos encadenados (carga de datos + render con datos)
  await act(async () => {
    await new Promise((r) => setTimeout(r, 30))
  })
  return container.textContent ?? ''
}

function has(text: string, ...needles: string[]) {
  return needles.every((n) => text.includes(n))
}

const db = loadDB()
const sampleOrder = db.orders.find((o) => o.status === 'reparacion' || o.status === 'listo') ?? db.orders[0]
const sampleProduct = db.products.find((p) => p.published)!
const sampleCustomer = db.customers[0]
// El inventario ordena por nombre y pagina de a 14: usamos el primero alfabéticamente
const firstProductByName = [...db.products].sort((a, b) => a.name.localeCompare(b.name))[0]

console.log('\n[A] Sitio público')
let t = await renderRoute('/')
check('portada renderiza el hero y la marca', has(t, 'Planet Service', 'Reparamos tu celular'), t.slice(0, 60))
check('portada muestra servicios reales', has(t, 'Cambio de pantalla', 'Diagnóstico'), '')
check('portada muestra el cotizador', has(t, 'Cotizador rápido', '¿Qué equipo es?'))
check('portada muestra productos de la tienda', has(t, 'Samsung Galaxy A55 5G 256GB'))
check('portada muestra testimonios y FAQ', has(t, 'Clientes que volvieron', 'Preguntas frecuentes'))
check('portada muestra ubicación y horarios', has(t, 'Avda. Eusebio Ayala', 'Lunes a Viernes'))
check('portada tiene el buscador de órdenes', has(t, '¿Ya dejaste tu equipo?'))

t = await renderRoute('/servicios')
check('servicios lista el catálogo', has(t, 'Todo lo que reparamos', 'Cambio de batería'))
check('servicios muestra precios en guaraníes', t.includes('₲'))

t = await renderRoute('/tienda')
check('tienda lista productos publicados', has(t, 'Equipos y accesorios', sampleProduct.name))
check('tienda muestra filtros', has(t, 'Categoría', 'Marca', 'Condición'))

t = await renderRoute(`/tienda/${sampleProduct.id}`)
check('detalle de producto renderiza', has(t, sampleProduct.name, 'Consultar por WhatsApp'))
check('detalle muestra reserva y garantía', has(t, 'Reservalo sin pagar nada'))

t = await renderRoute(`/seguimiento?codigo=${sampleOrder.code}`)
check('seguimiento encuentra la orden por código', has(t, sampleOrder.code, sampleOrder.device.brand), sampleOrder.code)
check('seguimiento muestra el historial del equipo', has(t, 'Historial del equipo'))
check('seguimiento muestra las etapas', has(t, 'En diagnóstico', 'Listo para retirar'))

t = await renderRoute('/seguimiento?codigo=OS-NOEXISTE')
check('seguimiento maneja el código inexistente', has(t, 'No encontramos esa orden'))

t = await renderRoute('/agendar')
check('formulario de presupuesto renderiza', has(t, 'Contanos qué le pasa', 'Nombre y apellido', 'Horario preferido'))

t = await renderRoute('/contacto')
check('contacto muestra canales', has(t, 'WhatsApp', 'Teléfono', 'Instagram'))

t = await renderRoute('/una-ruta-que-no-existe')
check('404 renderiza', has(t, 'Esta página no existe'))

console.log('\n[B] Panel administrativo')
t = await renderRoute('/panel')
check('dashboard renderiza KPIs', has(t, 'Resumen del negocio', 'Ingresos de hoy', 'Equipos en el taller'))
check('dashboard muestra gráficos con leyenda', has(t, 'Servicio técnico', 'Venta de productos'))
check('dashboard muestra el estado del taller', has(t, 'Estado del taller', 'En reparación'))
check('dashboard lista últimas ventas', has(t, 'Últimas ventas'))
check('navegación lateral completa', has(t, 'Taller', 'Punto de venta', 'Inventario', 'Caja', 'Reportes'))

t = await renderRoute('/panel/ordenes')
check('taller renderiza el tablero', has(t, 'Taller', 'Recibido', 'Presupuestado', 'Listo'))
check('tablero muestra órdenes reales', t.includes('OS-'))

t = await renderRoute(`/panel/ordenes/${sampleOrder.id}`)
check('detalle de orden renderiza', has(t, sampleOrder.code, 'Estado de la orden', 'Historial completo'))
check('detalle muestra datos del equipo', has(t, 'Datos del equipo', sampleOrder.device.brand))

t = await renderRoute('/panel/solicitudes')
check('bandeja de solicitudes renderiza', has(t, 'Solicitudes desde la web', 'Sin responder'))

t = await renderRoute('/panel/pos')
check('punto de venta renderiza catálogo y carrito', has(t, 'Punto de venta', 'Venta actual', 'Cobrar'))

t = await renderRoute('/panel/ventas')
check('ventas renderiza historial', has(t, 'Ventas', 'Facturado', 'Ticket promedio'))
check('ventas muestra códigos reales', t.includes('V-'))

t = await renderRoute('/panel/inventario')
check('inventario renderiza', has(t, 'Inventario', 'Valor del inventario', 'Stock bajo'))
check('inventario lista productos', t.includes(firstProductByName.name), firstProductByName.name)

t = await renderRoute('/panel/clientes')
check('clientes renderiza', has(t, 'Clientes', 'Clientes registrados', 'Total gastado'))

t = await renderRoute(`/panel/clientes/${sampleCustomer.id}`)
check('ficha de cliente renderiza', has(t, sampleCustomer.name, 'Historial de reparaciones'))

t = await renderRoute('/panel/caja')
check('caja renderiza', has(t, 'Caja', 'Arqueo de hoy', 'Ingresos del período'))

t = await renderRoute('/panel/equipo')
check('equipo renderiza rendimiento', has(t, 'Equipo', 'Rendimiento del taller', 'Ventas por vendedor'))

t = await renderRoute('/panel/servicios')
check('servicios web renderiza', has(t, 'Servicios publicados en la web', 'Cambio de pantalla'))

t = await renderRoute('/panel/reportes')
check('reportes renderiza', has(t, 'Reportes', 'Resultado del mes', 'Rentabilidad por técnico'))
check('reportes muestra dinero atado', has(t, 'Dinero atado', 'Presupuestos esperando respuesta'))

t = await renderRoute('/panel/configuracion')
check('configuración renderiza', has(t, 'Configuración', 'Datos del negocio', 'src/config/brand.ts'))
check('configuración informa la persistencia', has(t, 'Persistencia activa'))

console.log('\n[C] Persistencia en localStorage')
check('la base quedó guardada en localStorage', Boolean(window.localStorage.getItem('planet_service_demo')))
const stored = JSON.parse(window.localStorage.getItem('planet_service_demo') ?? '{}')
check('lo guardado tiene órdenes', Array.isArray(stored.orders) && stored.orders.length > 0, stored.orders?.length)
check('lo guardado tiene productos', Array.isArray(stored.products) && stored.products.length > 0)
check('recargar devuelve los mismos datos', loadDB().orders.length === stored.orders.length)

await act(async () => {
  root?.unmount()
})

console.log(`\n${failed === 0 ? 'TODAS LAS PANTALLAS RENDERIZAN CORRECTAMENTE' : `${failed} VERIFICACIONES DE RENDER FALLARON`}\n`)
if (failed > 0) process.exit(1)
