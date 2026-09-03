import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Clock, LayoutDashboard, Mail, MapPin, Menu, MessageCircle, Phone, X,
} from 'lucide-react'
import { Instagram } from '@/components/ui/InstagramIcon'
import { BRAND_CONFIG } from '@/config/brand'
import { NAV_LINKS } from '@/config/content'
import { cn } from '@/lib/utils'
import { waLink, waMessages } from '@/lib/whatsapp'
import { Button } from '@/components/ui/primitives'
import { Logo } from './Logo'

/* ================================================================ HEADER == */
function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      {/* Barra superior: datos de contacto siempre visibles en desktop */}
      <div className="hidden bg-ink text-white/75 lg:block">
        <div className="container-x flex h-9 items-center justify-between text-[12.5px]">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <MapPin size={13} aria-hidden />
              {BRAND_CONFIG.address}, {BRAND_CONFIG.city}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={13} aria-hidden />
              Lun a Vie 08:00–18:30 · Sáb 08:00–13:00
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href={`tel:${BRAND_CONFIG.phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 transition-colors hover:text-white">
              <Phone size={13} aria-hidden />
              {BRAND_CONFIG.phone}
            </a>
            <a
              href={BRAND_CONFIG.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors hover:text-white"
            >
              <Instagram size={13} aria-hidden />
              {BRAND_CONFIG.social.instagramHandle}
            </a>
          </div>
        </div>
      </div>

      <header
        className={cn(
          'sticky top-0 z-50 border-b transition-all duration-200',
          scrolled
            ? 'border-line bg-card/92 shadow-[var(--shadow-sm)] backdrop-blur-md'
            : 'border-transparent bg-card',
        )}
      >
        <nav className="container-x flex h-[68px] items-center justify-between gap-4" aria-label="Principal">
          <Link to="/" aria-label={`${BRAND_CONFIG.name} — inicio`}>
            <Logo />
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  className={({ isActive }) =>
                    cn(
                      'rounded-lg px-3.5 py-2 text-[14px] font-semibold transition-colors',
                      isActive ? 'text-brand' : 'text-body hover:text-strong',
                    )
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2.5">
            <Button
              size="sm"
              variant="whatsapp"
              href={waLink(waMessages.general())}
              external
              icon={<MessageCircle size={15} />}
              className="hidden sm:inline-flex"
            >
              WhatsApp
            </Button>
            <Button size="sm" to="/agendar" className="hidden sm:inline-flex">
              Pedir presupuesto
            </Button>
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={open}
              className="flex size-10 items-center justify-center rounded-[10px] border border-line-strong text-strong md:hidden"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>

        {/* Menú móvil */}
        {open && (
          <div className="anim-fade-in border-t border-line bg-card md:hidden">
            <ul className="container-x flex flex-col py-2">
              {NAV_LINKS.map((l) => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    className={({ isActive }) =>
                      cn(
                        'block border-b border-line/70 py-3.5 text-[15px] font-semibold transition-colors',
                        isActive ? 'text-brand' : 'text-strong',
                      )
                    }
                  >
                    {l.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <div className="container-x flex flex-col gap-2.5 pb-5 pt-3">
              <Button to="/agendar" block>
                Pedir presupuesto
              </Button>
              <Button
                variant="whatsapp"
                block
                href={waLink(waMessages.general())}
                external
                icon={<MessageCircle size={16} />}
              >
                Escribir por WhatsApp
              </Button>
            </div>
          </div>
        )}
      </header>
    </>
  )
}

/* ================================================================ FOOTER == */
function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-20 bg-ink text-white/70">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo variant="light" />
          <p className="mt-5 max-w-xs text-[13.5px] leading-relaxed">
            Servicio técnico de celulares, notebooks y PC en {BRAND_CONFIG.city}. Reparamos, vendemos y
            damos garantía por escrito desde {BRAND_CONFIG.foundedYear}.
          </p>
          <div className="mt-5 flex gap-2.5">
            <a
              href={BRAND_CONFIG.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex size-9 items-center justify-center rounded-[10px] bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <Instagram size={16} />
            </a>
            <a
              href={waLink(waMessages.general())}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="flex size-9 items-center justify-center rounded-[10px] bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <MessageCircle size={16} />
            </a>
          </div>
        </div>

        <nav aria-label="Secciones">
          <h3 className="mb-4 text-[13px] font-bold uppercase tracking-wider text-white">Navegación</h3>
          <ul className="flex flex-col gap-2.5 text-[13.5px]">
            <li><Link to="/" className="transition-colors hover:text-white">Inicio</Link></li>
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="transition-colors hover:text-white">{l.label}</Link>
              </li>
            ))}
            <li><Link to="/agendar" className="transition-colors hover:text-white">Pedir presupuesto</Link></li>
          </ul>
        </nav>

        <div>
          <h3 className="mb-4 text-[13px] font-bold uppercase tracking-wider text-white">Servicios</h3>
          <ul className="flex flex-col gap-2.5 text-[13.5px]">
            <li>Cambio de pantalla y batería</li>
            <li>Reparación de placas</li>
            <li>Notebooks y PC</li>
            <li>Recuperación de datos</li>
            <li>Venta de equipos y accesorios</li>
            <li>Mantenimiento para empresas</li>
          </ul>
        </div>

        <address className="not-italic">
          <h3 className="mb-4 text-[13px] font-bold uppercase tracking-wider text-white">Contacto</h3>
          <ul className="flex flex-col gap-3 text-[13.5px]">
            <li className="flex gap-2.5">
              <MapPin size={15} className="mt-0.5 shrink-0" aria-hidden />
              <span>
                {BRAND_CONFIG.address}
                <br />
                {BRAND_CONFIG.neighborhood}, {BRAND_CONFIG.city}
              </span>
            </li>
            <li className="flex gap-2.5">
              <Phone size={15} className="mt-0.5 shrink-0" aria-hidden />
              <a href={`tel:${BRAND_CONFIG.phone.replace(/\s/g, '')}`} className="transition-colors hover:text-white">
                {BRAND_CONFIG.phone}
              </a>
            </li>
            <li className="flex gap-2.5">
              <MessageCircle size={15} className="mt-0.5 shrink-0" aria-hidden />
              <a href={waLink(waMessages.general())} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
                {BRAND_CONFIG.whatsappDisplay}
              </a>
            </li>
            <li className="flex gap-2.5">
              <Mail size={15} className="mt-0.5 shrink-0" aria-hidden />
              <a href={`mailto:${BRAND_CONFIG.email}`} className="transition-colors hover:text-white">
                {BRAND_CONFIG.email}
              </a>
            </li>
            <li className="flex gap-2.5">
              <Clock size={15} className="mt-0.5 shrink-0" aria-hidden />
              <span>
                {BRAND_CONFIG.hours
                  .filter((h) => h.open)
                  .map((h) => `${h.days}: ${h.open}–${h.close}`)
                  .join(' · ')}
              </span>
            </li>
          </ul>
        </address>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-[12.5px] sm:flex-row">
          <p>
            © {year} {BRAND_CONFIG.legalName} · RUC {BRAND_CONFIG.ruc}
          </p>
          <Link
            to="/panel"
            className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 font-semibold text-white/80 transition-colors hover:border-white/35 hover:text-white"
          >
            <LayoutDashboard size={13} aria-hidden />
            Panel de gestión
          </Link>
        </div>
      </div>
    </footer>
  )
}

/* ======================================================== CTA FLOTANTE ==== */
function StickyMobileCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 px-4 py-3 backdrop-blur-md sm:hidden">
      <div className="flex gap-2.5">
        <Button
          variant="whatsapp"
          href={waLink(waMessages.general())}
          external
          icon={<MessageCircle size={16} />}
          className="flex-1"
        >
          WhatsApp
        </Button>
        <Button to="/agendar" className="flex-1">
          Presupuesto
        </Button>
      </div>
    </div>
  )
}

function WhatsAppFab() {
  return (
    <a
      href={waLink(waMessages.general())}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      className="anim-ring fixed bottom-6 right-6 z-40 hidden size-14 items-center justify-center rounded-full bg-wa text-white shadow-[var(--shadow-lg)] transition-transform hover:scale-105 sm:flex"
    >
      <MessageCircle size={25} />
    </a>
  )
}

/* ================================================================ LAYOUT == */
export function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-card">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Saltar al contenido
      </a>
      <Header />
      <main id="contenido" className="flex-1 pb-20 sm:pb-0">
        <Outlet />
      </main>
      <Footer />
      <StickyMobileCta />
      <WhatsAppFab />
    </div>
  )
}
