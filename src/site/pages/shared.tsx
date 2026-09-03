import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

/** Encabezado oscuro reutilizable de las páginas internas del sitio */
export function PageHeader({
  eyebrow, title, description, breadcrumb, children,
}: {
  eyebrow?: string
  title: string
  description?: string
  breadcrumb?: Array<{ label: string; to?: string }>
  children?: ReactNode
}) {
  return (
    <header className="hero-mesh relative overflow-hidden pb-20 pt-12 sm:pt-14">
      <div className="grid-lines absolute inset-0" aria-hidden />
      <div className="container-x relative">
        {breadcrumb && (
          <nav aria-label="Migas de pan" className="mb-5">
            <ol className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-white/55">
              <li>
                <Link to="/" className="transition-colors hover:text-white">
                  Inicio
                </Link>
              </li>
              {breadcrumb.map((b) => (
                <li key={b.label} className="flex items-center gap-1.5">
                  <ChevronRight size={13} aria-hidden />
                  {b.to ? (
                    <Link to={b.to} className="transition-colors hover:text-white">
                      {b.label}
                    </Link>
                  ) : (
                    <span className="text-white/85">{b.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {eyebrow && (
          <span className="mb-3 inline-block rounded-full bg-white/10 px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.14em] text-white/80">
            {eyebrow}
          </span>
        )}
        <h1 className="max-w-3xl text-[30px] font-extrabold leading-[1.12] text-white sm:text-[40px]">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/70">{description}</p>
        )}
        {children}
      </div>
    </header>
  )
}
