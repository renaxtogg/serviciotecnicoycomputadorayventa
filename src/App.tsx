import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { SiteLayout } from './site/SiteLayout'
import { Home } from './site/pages/Home'
import { Servicios } from './site/pages/Servicios'
import { Tienda } from './site/pages/Tienda'
import { ProductoDetalle } from './site/pages/ProductoDetalle'
import { Seguimiento } from './site/pages/Seguimiento'
import { Agendar } from './site/pages/Agendar'
import { Contacto } from './site/pages/Contacto'
import { NotFound } from './site/pages/NotFound'

/**
 * El panel se carga bajo demanda: el visitante del sitio público nunca
 * descarga el código de administración, así la web pública queda liviana.
 */
const AdminLayout = lazy(() => import('./admin/AdminLayout').then((m) => ({ default: m.AdminLayout })))
const Dashboard = lazy(() => import('./admin/pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const Ordenes = lazy(() => import('./admin/pages/Ordenes').then((m) => ({ default: m.Ordenes })))
const OrdenDetalle = lazy(() => import('./admin/pages/OrdenDetalle').then((m) => ({ default: m.OrdenDetalle })))
const Solicitudes = lazy(() => import('./admin/pages/Solicitudes').then((m) => ({ default: m.Solicitudes })))
const PuntoDeVenta = lazy(() => import('./admin/pages/PuntoDeVenta').then((m) => ({ default: m.PuntoDeVenta })))
const Ventas = lazy(() => import('./admin/pages/Ventas').then((m) => ({ default: m.Ventas })))
const Inventario = lazy(() => import('./admin/pages/Inventario').then((m) => ({ default: m.Inventario })))
const Clientes = lazy(() => import('./admin/pages/Clientes').then((m) => ({ default: m.Clientes })))
const ClienteDetalle = lazy(() => import('./admin/pages/ClienteDetalle').then((m) => ({ default: m.ClienteDetalle })))
const Caja = lazy(() => import('./admin/pages/Caja').then((m) => ({ default: m.Caja })))
const Equipo = lazy(() => import('./admin/pages/Equipo').then((m) => ({ default: m.Equipo })))
const ServiciosAdmin = lazy(() => import('./admin/pages/ServiciosAdmin').then((m) => ({ default: m.ServiciosAdmin })))
const Reportes = lazy(() => import('./admin/pages/Reportes').then((m) => ({ default: m.Reportes })))
const Configuracion = lazy(() => import('./admin/pages/Configuracion').then((m) => ({ default: m.Configuracion })))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

function PanelLoading() {
  return (
    <div className="flex min-h-screen flex-col gap-4 bg-app p-6">
      <div className="skeleton h-16 w-full rounded-[14px]" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-[14px]" />
        ))}
      </div>
      <div className="skeleton h-72 w-full rounded-[14px]" />
      <span className="sr-only">Cargando el panel…</span>
    </div>
  )
}

export function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* -------------------------------------------------- SITIO PÚBLICO */}
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/servicios" element={<Servicios />} />
          <Route path="/tienda" element={<Tienda />} />
          <Route path="/tienda/:id" element={<ProductoDetalle />} />
          <Route path="/seguimiento" element={<Seguimiento />} />
          <Route path="/agendar" element={<Agendar />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* ------------------------------------------------ PANEL INTERNO */}
        <Route
          path="/panel"
          element={
            <Suspense fallback={<PanelLoading />}>
              <AdminLayout />
            </Suspense>
          }
        >
          <Route index element={<Suspense fallback={<PanelLoading />}><Dashboard /></Suspense>} />
          <Route path="ordenes" element={<Suspense fallback={<PanelLoading />}><Ordenes /></Suspense>} />
          <Route path="ordenes/:id" element={<Suspense fallback={<PanelLoading />}><OrdenDetalle /></Suspense>} />
          <Route path="solicitudes" element={<Suspense fallback={<PanelLoading />}><Solicitudes /></Suspense>} />
          <Route path="pos" element={<Suspense fallback={<PanelLoading />}><PuntoDeVenta /></Suspense>} />
          <Route path="ventas" element={<Suspense fallback={<PanelLoading />}><Ventas /></Suspense>} />
          <Route path="inventario" element={<Suspense fallback={<PanelLoading />}><Inventario /></Suspense>} />
          <Route path="clientes" element={<Suspense fallback={<PanelLoading />}><Clientes /></Suspense>} />
          <Route path="clientes/:id" element={<Suspense fallback={<PanelLoading />}><ClienteDetalle /></Suspense>} />
          <Route path="caja" element={<Suspense fallback={<PanelLoading />}><Caja /></Suspense>} />
          <Route path="equipo" element={<Suspense fallback={<PanelLoading />}><Equipo /></Suspense>} />
          <Route path="servicios" element={<Suspense fallback={<PanelLoading />}><ServiciosAdmin /></Suspense>} />
          <Route path="reportes" element={<Suspense fallback={<PanelLoading />}><Reportes /></Suspense>} />
          <Route path="configuracion" element={<Suspense fallback={<PanelLoading />}><Configuracion /></Suspense>} />
          <Route path="*" element={<Navigate to="/panel" replace />} />
        </Route>
      </Routes>
    </>
  )
}
