import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  BarChart3, Bell, ExternalLink, Globe, Inbox, LayoutDashboard, Menu, Package, Receipt,
  RotateCcw, Settings, ShoppingCart, UserCog, Users, Wallet, Wrench, X,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { BRAND_CONFIG } from '@/config/brand'
import { useDemo } from '@/demo/store'
import { isOpen } from '@/demo/metrics'
import { relative } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Avatar, Button, DemoTag } from '@/components/ui/primitives'
import { ConfirmDialog, useToast } from '@/components/ui/overlay'
import { Logo } from '@/site/Logo'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
  badge?: number
  badgeTone?: 'brand' | 'warn'
}

export function AdminLayout() {
  const { db, ready, actions } = useDemo()
  const toast = useToast()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
    setNotifOpen(false)
  }, [pathname])

  useEffect(() => {
    document.title = `Panel · ${BRAND_CONFIG.name}`
    const robots = document.head.querySelector('meta[name="robots"]')
    robots?.setAttribute('content', 'noindex, nofollow')
  }, [pathname])

  const openOrders = db.orders.filter(isOpen).length
  const newRequests = db.requests.filter((r) => r.status === 'nueva').length
  const lowStock = db.products.filter((p) => p.stock <= p.minStock).length
  const unread = db.notifications.filter((n) => !n.read).length

  const groups: Array<{ title: string; items: NavItem[] }> = useMemo(
    () => [
      {
        title: 'Operación',
        items: [
          { to: '/panel', label: 'Resumen', icon: <LayoutDashboard size={17} />, end: true },
          { to: '/panel/ordenes', label: 'Taller', icon: <Wrench size={17} />, badge: openOrders },
          { to: '/panel/solicitudes', label: 'Solicitudes web', icon: <Inbox size={17} />, badge: newRequests, badgeTone: 'warn' },
        ],
      },
      {
        title: 'Ventas',
        items: [
          { to: '/panel/pos', label: 'Punto de venta', icon: <ShoppingCart size={17} /> },
          { to: '/panel/ventas', label: 'Ventas', icon: <Receipt size={17} /> },
          { to: '/panel/inventario', label: 'Inventario', icon: <Package size={17} />, badge: lowStock, badgeTone: 'warn' },
          { to: '/panel/clientes', label: 'Clientes', icon: <Users size={17} /> },
        ],
      },
      {
        title: 'Administración',
        items: [
          { to: '/panel/caja', label: 'Caja', icon: <Wallet size={17} /> },
          { to: '/panel/reportes', label: 'Reportes', icon: <BarChart3 size={17} /> },
          { to: '/panel/equipo', label: 'Equipo', icon: <UserCog size={17} /> },
          { to: '/panel/servicios', label: 'Servicios web', icon: <Globe size={17} /> },
          { to: '/panel/configuracion', label: 'Configuración', icon: <Settings size={17} /> },
        ],
      },
    ],
    [openOrders, newRequests, lowStock],
  )

  const owner = db.staff.find((s) => s.role === 'admin')

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-[64px] shrink-0 items-center justify-between border-b border-white/10 px-4">
        <Link to="/panel" aria-label="Panel — inicio">
          <Logo variant="light" size="sm" />
        </Link>
        <button
          onClick={() => setMenuOpen(false)}
          aria-label="Cerrar menú"
          className="rounded-lg p-1.5 text-white/60 hover:text-white lg:hidden"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="thin-scroll flex-1 overflow-y-auto px-3 py-4" aria-label="Panel">
        {groups.map((g) => (
          <div key={g.title} className="mb-5">
            <p className="mb-2 px-2.5 text-[10.5px] font-bold uppercase tracking-[0.13em] text-white/35">
              {g.title}
            </p>
            <ul className="flex flex-col gap-0.5">
              {g.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13.5px] font-medium transition-colors',
                        isActive
                          ? 'bg-white/12 font-semibold text-white'
                          : 'text-white/60 hover:bg-white/6 hover:text-white',
                      )
                    }
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {Boolean(item.badge) && (
                      <span
                        className={cn(
                          'flex h-[19px] min-w-[19px] items-center justify-center rounded-full px-1.5 text-[10.5px] font-bold',
                          item.badgeTone === 'warn' ? 'bg-warn text-ink' : 'bg-white/15 text-white',
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13px] font-medium text-white/60 transition-colors hover:bg-white/6 hover:text-white"
        >
          <ExternalLink size={16} />
          Ver el sitio público
        </Link>
        <button
          onClick={() => setConfirmReset(true)}
          className="mt-0.5 flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13px] font-medium text-white/60 transition-colors hover:bg-white/6 hover:text-white"
        >
          <RotateCcw size={16} />
          Restaurar datos demo
        </button>
        {owner && (
          <div className="mt-3 flex items-center gap-2.5 rounded-[10px] bg-white/6 px-2.5 py-2">
            <Avatar name={owner.name} tone="blue" size={30} />
            <div className="min-w-0">
              <p className="truncate text-[12.5px] font-semibold text-white">{owner.name}</p>
              <p className="truncate text-[11px] text-white/45">Administración</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-app">
      {/* --------------------------------------------------------- Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[236px] bg-ink lg:block">{sidebar}</aside>

      {menuOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button aria-label="Cerrar" onClick={() => setMenuOpen(false)} className="absolute inset-0 bg-ink/55" />
          <aside className="anim-slide-right absolute inset-y-0 left-0 w-[264px] bg-ink" style={{ animationName: 'fade-in' }}>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-[236px]">
        {/* ------------------------------------------------------- Topbar */}
        <header className="sticky top-0 z-30 flex h-[64px] items-center gap-3 border-b border-line bg-card/92 px-4 backdrop-blur-md sm:px-6">
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
            className="flex size-9 items-center justify-center rounded-[9px] border border-line-strong text-strong lg:hidden"
          >
            <Menu size={18} />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold text-strong">{db.settings.businessName}</p>
            <p className="hidden text-[12px] text-dim sm:block">
              Panel de gestión · {new Date().toLocaleDateString('es-PY', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          <DemoTag className="hidden md:inline-flex" />

          <div className="relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              aria-label={`Notificaciones${unread ? ` (${unread} sin leer)` : ''}`}
              aria-expanded={notifOpen}
              className="relative flex size-9 items-center justify-center rounded-[9px] border border-line-strong text-dim transition-colors hover:text-strong"
            >
              <Bell size={17} />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="anim-pop absolute right-0 top-11 z-50 w-[min(92vw,340px)] overflow-hidden rounded-[13px] border border-line bg-card shadow-[var(--shadow-lg)]">
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <h2 className="text-[14px] font-bold text-strong">Notificaciones</h2>
                  {unread > 0 && (
                    <button
                      onClick={() => actions.markAllNotificationsRead()}
                      className="text-[12px] font-semibold text-brand hover:underline"
                    >
                      Marcar todas
                    </button>
                  )}
                </div>
                <ul className="thin-scroll max-h-[340px] overflow-y-auto">
                  {db.notifications.length === 0 && (
                    <li className="px-4 py-8 text-center text-[13px] text-dim">Sin novedades por ahora.</li>
                  )}
                  {db.notifications.slice(0, 12).map((n) => (
                    <li key={n.id} className="border-b border-line/70 last:border-0">
                      <Link
                        to={n.link ?? '/panel'}
                        onClick={() => actions.markNotificationRead(n.id)}
                        className={cn(
                          'flex gap-3 px-4 py-3 transition-colors hover:bg-muted/60',
                          !n.read && 'bg-brand/[0.035]',
                        )}
                      >
                        <span
                          className={cn(
                            'mt-1.5 size-2 shrink-0 rounded-full',
                            n.read ? 'bg-line-strong' : 'bg-brand',
                          )}
                          aria-hidden
                        />
                        <span className="min-w-0">
                          <span className="block text-[13px] font-semibold text-strong">{n.title}</span>
                          <span className="mt-0.5 block text-[12.5px] leading-snug text-dim">{n.text}</span>
                          <span className="mt-1 block text-[11.5px] text-dim/80">{relative(n.ts)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <Button size="sm" to="/panel/pos" icon={<ShoppingCart size={15} />} className="hidden sm:inline-flex">
            Nueva venta
          </Button>
        </header>

        <main className="px-4 py-6 sm:px-6 sm:py-7">
          {ready ? (
            <Outlet />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="skeleton h-24 rounded-[14px]" />
              <div className="skeleton h-64 rounded-[14px]" />
            </div>
          )}
        </main>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          actions.resetDemo()
          toast('Datos de demostración restaurados', { tone: 'mint', detail: 'El panel volvió a su estado original.' })
        }}
        title="Restaurar datos de demostración"
        confirmLabel="Restaurar todo"
        message="Se van a descartar todos los cambios que hiciste (órdenes, ventas, clientes y ajustes) y el panel volverá al set de datos original. Esta acción no se puede deshacer."
      />
    </div>
  )
}

/* ------------------------------------------------------------------------- */
/** Encabezado estándar de cada pantalla del panel */
export function PanelHeader({
  title, description, actions: actionSlot, badge,
}: {
  title: string
  description?: string
  actions?: ReactNode
  badge?: ReactNode
}) {
  return (
    <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-[21px] font-extrabold tracking-tight text-strong">{title}</h1>
          {badge}
        </div>
        {description && <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-dim">{description}</p>}
      </div>
      {actionSlot && <div className="flex flex-wrap items-center gap-2.5">{actionSlot}</div>}
    </header>
  )
}

