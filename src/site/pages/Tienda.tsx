import { useMemo, useState } from 'react'
import { MessageCircle, PackageX, SlidersHorizontal } from 'lucide-react'
import { useDemo } from '@/demo/store'
import { CATEGORY_LABEL, type ProductCategory } from '@/demo/types'
import { usePageMeta } from '@/lib/seo'
import { matches, sortBy } from '@/lib/utils'
import { waLink } from '@/lib/whatsapp'
import { Button } from '@/components/ui/primitives'
import { Checkbox, Select } from '@/components/ui/form'
import { EmptyState, SearchInput, Skeleton } from '@/components/ui/data'
import { ProductCard } from '../components'
import { PageHeader } from './shared'

type SortKey = 'destacados' | 'precio-asc' | 'precio-desc' | 'nuevos'

const SHOP_CATEGORIES: ProductCategory[] = ['celular', 'notebook', 'pc', 'tablet', 'accesorio', 'componente']

export function Tienda() {
  usePageMeta({
    title: 'Tienda — celulares, notebooks y accesorios',
    description:
      'Celulares, notebooks, PC armadas, accesorios y componentes en Asunción. Equipos nuevos y reacondicionados con garantía y respaldo de nuestro propio taller.',
  })

  const { db, ready } = useDemo()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('')
  const [brand, setBrand] = useState<string>('')
  const [condition, setCondition] = useState<string>('')
  const [sort, setSort] = useState<SortKey>('destacados')
  const [onlyStock, setOnlyStock] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const published = useMemo(
    () => db.products.filter((p) => p.published && SHOP_CATEGORIES.includes(p.category)),
    [db.products],
  )

  const brands = useMemo(
    () => [...new Set(published.map((p) => p.brand))].sort(),
    [published],
  )

  const results = useMemo(() => {
    let list = published.filter((p) => {
      if (category && p.category !== category) return false
      if (brand && p.brand !== brand) return false
      if (condition && p.condition !== condition) return false
      if (onlyStock && p.stock === 0) return false
      return matches([p.name, p.brand, p.model, p.sku, ...p.specs], query)
    })

    if (sort === 'precio-asc') list = sortBy(list, (p) => p.price, 'asc')
    else if (sort === 'precio-desc') list = sortBy(list, (p) => p.price, 'desc')
    else if (sort === 'nuevos') list = sortBy(list, (p) => p.createdAt, 'desc')
    else list = sortBy(list, (p) => (p.featured ? 0 : 1) + (p.stock === 0 ? 2 : 0), 'asc')

    return list
  }, [published, category, brand, condition, onlyStock, query, sort])

  const activeFilters = [category, brand, condition].filter(Boolean).length + (onlyStock ? 1 : 0)

  const clearAll = () => {
    setCategory('')
    setBrand('')
    setCondition('')
    setOnlyStock(false)
    setQuery('')
  }

  return (
    <>
      <PageHeader
        eyebrow="Tienda"
        title="Equipos y accesorios con respaldo técnico"
        description="Lo que vendemos pasa antes por nuestro taller. Equipos nuevos sellados y reacondicionados revisados por los mismos técnicos que después te dan la garantía."
        breadcrumb={[{ label: 'Tienda' }]}
      />

      <section className="container-x -mt-8 pb-6">
        {/* Controles: una sola fila arriba de la grilla */}
        <div className="rounded-[15px] border border-line bg-card p-4 shadow-[var(--shadow-sm)]">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Buscar por modelo, marca o característica…"
              className="min-w-[220px] flex-1"
            />
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Ordenar resultados"
              className="!h-10 w-auto min-w-[170px]"
              wrapClassName="shrink-0"
              options={[
                { value: 'destacados', label: 'Destacados' },
                { value: 'precio-asc', label: 'Precio: menor a mayor' },
                { value: 'precio-desc', label: 'Precio: mayor a menor' },
                { value: 'nuevos', label: 'Ingresos recientes' },
              ]}
            />
            <Button
              variant="secondary"
              size="sm"
              className="!h-10 lg:hidden"
              onClick={() => setShowFilters((v) => !v)}
              icon={<SlidersHorizontal size={15} />}
            >
              Filtros{activeFilters > 0 && ` (${activeFilters})`}
            </Button>
          </div>

          <div className={`${showFilters ? 'grid' : 'hidden'} mt-4 gap-3 border-t border-line pt-4 sm:grid-cols-3 lg:grid`}>
            <Select
              label="Categoría"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Todas"
              className="!h-10"
              options={SHOP_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))}
            />
            <Select
              label="Marca"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Todas"
              className="!h-10"
              options={brands.map((b) => ({ value: b, label: b }))}
            />
            <Select
              label="Condición"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="Cualquiera"
              className="!h-10"
              options={[
                { value: 'nuevo', label: 'Nuevo' },
                { value: 'reacondicionado', label: 'Reacondicionado' },
                { value: 'usado', label: 'Usado' },
              ]}
            />
            <div className="flex items-end justify-between gap-3 sm:col-span-3">
              <Checkbox label="Mostrar solo lo que está en stock" checked={onlyStock} onChange={setOnlyStock} />
              {activeFilters > 0 && (
                <button
                  onClick={clearAll}
                  className="text-[12.5px] font-semibold text-brand transition-colors hover:underline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="mt-5 text-[13px] text-dim">
          {results.length} {results.length === 1 ? 'producto' : 'productos'}
          {query && <> para “{query}”</>}
        </p>

        {!ready ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[380px] rounded-[15px]" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            icon={<PackageX size={24} />}
            title="No encontramos productos con esos filtros"
            description="Probá quitando algún filtro. Si buscás un modelo puntual, consultanos: traemos a pedido."
            action={
              <div className="flex flex-wrap justify-center gap-2.5">
                <Button variant="secondary" onClick={clearAll}>
                  Limpiar filtros
                </Button>
                <Button
                  variant="whatsapp"
                  href={waLink(`Hola, busco un producto que no encontré en la web: `)}
                  external
                  icon={<MessageCircle size={15} />}
                >
                  Consultar disponibilidad
                </Button>
              </div>
            }
          />
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-[15px] border border-line bg-muted/60 p-5">
          <div>
            <h2 className="text-[15.5px] font-bold text-strong">¿Buscás algo que no está publicado?</h2>
            <p className="mt-1 text-[13.5px] text-dim">
              Traemos equipos a pedido y tomamos usados en parte de pago. Contanos qué necesitás.
            </p>
          </div>
          <Button
            variant="whatsapp"
            href={waLink('Hola, quiero consultar por un equipo que no vi en la web.')}
            external
            icon={<MessageCircle size={16} />}
          >
            Consultar por WhatsApp
          </Button>
        </div>
      </section>
    </>
  )
}
