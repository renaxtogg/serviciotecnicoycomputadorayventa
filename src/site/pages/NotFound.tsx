import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { usePageMeta } from '@/lib/seo'
import { NAV_LINKS } from '@/config/content'
import { Button } from '@/components/ui/primitives'
import { toneSoft } from '@/components/ui/tone'

export function NotFound() {
  usePageMeta({ title: 'Página no encontrada', noIndex: true })

  return (
    <section className="container-x flex min-h-[62vh] flex-col items-center justify-center py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl" style={toneSoft('blue', 11)}>
        <Compass size={30} />
      </span>
      <p className="mt-6 text-[13px] font-bold uppercase tracking-[0.18em] text-dim">Error 404</p>
      <h1 className="mt-3 text-[30px] font-extrabold leading-tight text-strong sm:text-[38px]">
        Esta página no existe
      </h1>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-dim">
        Puede que el enlace esté viejo o que hayamos movido la sección. Estos son los lugares a los que
        seguramente querías ir:
      </p>

      <nav className="mt-7 flex flex-wrap justify-center gap-2.5">
        {NAV_LINKS.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="rounded-full border border-line-strong px-4 py-2 text-[13.5px] font-semibold text-body transition-colors hover:border-brand hover:text-brand"
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <Button className="mt-8" to="/" size="lg">
        Volver al inicio
      </Button>
    </section>
  )
}
