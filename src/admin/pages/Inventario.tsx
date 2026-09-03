import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Boxes, Globe, Package, PackageX, Pencil, Plus, Trash2, TrendingUp } from 'lucide-react'
import { useDemo } from '@/demo/store'
import { CATEGORY_LABEL, type Product, type ProductCategory, type Tone } from '@/demo/types'
import { money, num } from '@/lib/format'
import { matches, sortBy, sum } from '@/lib/utils'
import { Badge, Button } from '@/components/ui/primitives'
import { Checkbox, Input, MoneyInput, SegmentedControl, Select, Textarea } from '@/components/ui/form'
import {
  type Column, DataTable, EmptyState, Pagination, SearchInput, StatCard, usePagination,
} from '@/components/ui/data'
import { ConfirmDialog, Modal, useToast } from '@/components/ui/overlay'
import { ProductArt } from '@/site/components'
import { PanelHeader } from '../AdminLayout'
import { PanelCard } from '../shared'

type Filter = 'todo' | 'bajo' | 'publicados' | 'repuestos'

const EMPTY_PRODUCT = {
  sku: '', name: '', category: 'accesorio' as ProductCategory, brand: '', model: '',
  condition: 'nuevo' as Product['condition'], cost: 0, price: 0, stock: 0, minStock: 1,
  warrantyDays: 365, specs: '', description: '', published: true, featured: false,
  location: '', emoji: '📦', tone: 'slate' as Tone,
}

export function Inventario() {
  const { db, actions } = useDemo()
  const toast = useToast()
  const [params, setParams] = useSearchParams()

  const [filter, setFilter] = useState<Filter>((params.get('filtro') as Filter) || 'todo')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [editing, setEditing] = useState<Product | 'new' | null>(null)
  const [adjusting, setAdjusting] = useState<Product | null>(null)
  const [toDelete, setToDelete] = useState<Product | null>(null)

  useEffect(() => {
    if (params.get('filtro')) setFilter(params.get('filtro') as Filter)
  }, [params])

  const filtered = useMemo(() => {
    let rows = db.products
    if (filter === 'bajo') rows = rows.filter((p) => p.stock <= p.minStock)
    else if (filter === 'publicados') rows = rows.filter((p) => p.published)
    else if (filter === 'repuestos') rows = rows.filter((p) => p.category === 'repuesto' || p.category === 'componente')
    if (category) rows = rows.filter((p) => p.category === category)
    return sortBy(
      rows.filter((p) => matches([p.name, p.sku, p.brand, p.model, p.location], query)),
      (p) => p.name,
    )
  }, [db.products, filter, category, query])

  const lowStock = db.products.filter((p) => p.stock <= p.minStock)
  const inventoryValue = sum(db.products, (p) => p.cost * p.stock)
  const retailValue = sum(db.products, (p) => p.price * p.stock)
  const published = db.products.filter((p) => p.published).length

  const { slice, page, pages, setPage, total } = usePagination(filtered, 14)

  const columns: Column<Product>[] = [
    {
      key: 'product',
      header: 'Producto',
      render: (p) => (
        <span className="flex items-center gap-3">
          <ProductArt product={p} size="sm" className="size-10 shrink-0" />
          <span className="min-w-0">
            <span className="block truncate font-semibold text-strong">{p.name}</span>
            <span className="block text-[11.5px] text-dim">
              <span className="font-mono">{p.sku}</span>
              {p.location && ` · ${p.location}`}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Categoría',
      hideBelow: 'lg',
      render: (p) => <span className="text-[12.5px] text-body">{CATEGORY_LABEL[p.category]}</span>,
    },
    {
      key: 'stock',
      header: 'Stock',
      align: 'center',
      render: (p) => (
        <span className="flex flex-col items-center gap-0.5">
          <span
            className={`text-[13.5px] font-bold tabular-nums ${
              p.stock === 0 ? 'text-danger' : p.stock <= p.minStock ? 'text-warn' : 'text-strong'
            }`}
          >
            {p.stock}
          </span>
          <span className="text-[11px] text-dim">mín. {p.minStock}</span>
        </span>
      ),
    },
    {
      key: 'cost',
      header: 'Costo',
      align: 'right',
      hideBelow: 'md',
      render: (p) => <span className="tabular-nums text-dim">{money(p.cost)}</span>,
    },
    {
      key: 'price',
      header: 'Precio',
      align: 'right',
      render: (p) => (
        <span className="flex flex-col items-end gap-0.5">
          <span className="font-semibold tabular-nums text-strong">{money(p.price)}</span>
          {p.price > 0 && p.cost > 0 && (
            <span className="text-[11px] text-dim">
              {Math.round(((p.price - p.cost) / p.price) * 100)}% margen
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'web',
      header: 'Web',
      align: 'center',
      hideBelow: 'sm',
      render: (p) =>
        p.published ? (
          <Badge tone="mint" icon={<Globe size={11} />}>
            Publicado
          </Badge>
        ) : (
          <span className="text-[12px] text-dim">Interno</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '120px',
      render: (p) => (
        <span className="flex justify-end gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); setAdjusting(p) }}
            aria-label={`Ajustar stock de ${p.name}`}
            title="Ajustar stock"
            className="flex size-8 items-center justify-center rounded-lg border border-line-strong text-dim transition-colors hover:border-brand hover:text-brand"
          >
            <Boxes size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setEditing(p) }}
            aria-label={`Editar ${p.name}`}
            title="Editar"
            className="flex size-8 items-center justify-center rounded-lg border border-line-strong text-dim transition-colors hover:border-brand hover:text-brand"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setToDelete(p) }}
            aria-label={`Eliminar ${p.name}`}
            title="Eliminar"
            className="flex size-8 items-center justify-center rounded-lg border border-line-strong text-dim transition-colors hover:border-danger hover:text-danger"
          >
            <Trash2 size={14} />
          </button>
        </span>
      ),
    },
  ]

  return (
    <>
      <PanelHeader
        title="Inventario"
        description="Productos en venta y repuestos del taller. Lo que marques como publicado aparece en la tienda del sitio web."
        actions={
          <Button size="sm" onClick={() => setEditing('new')} icon={<Plus size={15} />}>
            Nuevo producto
          </Button>
        }
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Valor del inventario"
          value={money(inventoryValue, { compact: true })}
          tone="navy"
          icon={<Package size={16} />}
          hint={`${money(retailValue, { compact: true })} a precio de venta`}
        />
        <StatCard
          label="Productos con stock bajo"
          value={lowStock.length}
          tone="amber"
          icon={<PackageX size={16} />}
          alert={lowStock.length > 0}
          onClick={() => { setFilter('bajo'); setParams({ filtro: 'bajo' }) }}
          hint="Tocá para verlos"
        />
        <StatCard label="Publicados en la web" value={published} tone="mint" icon={<Globe size={16} />} hint={`de ${db.products.length} productos`} />
        <StatCard
          label="Margen potencial"
          value={money(retailValue - inventoryValue, { compact: true })}
          tone="blue"
          icon={<TrendingUp size={16} />}
          hint="Si se vendiera todo el stock"
        />
      </section>

      <div className="mb-4 flex flex-wrap items-center gap-2.5 rounded-[13px] border border-line bg-card p-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar por nombre, código o ubicación…" className="min-w-[200px] flex-1" />
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Todas las categorías"
          aria-label="Filtrar por categoría"
          className="!h-10"
          wrapClassName="min-w-[170px]"
          options={(Object.keys(CATEGORY_LABEL) as ProductCategory[]).map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))}
        />
        <SegmentedControl<Filter>
          value={filter}
          onChange={(v) => { setFilter(v); setParams(v === 'todo' ? {} : { filtro: v }) }}
          size="sm"
          options={[
            { value: 'todo', label: 'Todo' },
            { value: 'bajo', label: 'Stock bajo' },
            { value: 'publicados', label: 'En la web' },
            { value: 'repuestos', label: 'Repuestos' },
          ]}
        />
      </div>

      {filter === 'bajo' && lowStock.length > 0 && (
        <PanelCard
          className="mb-4"
          title="Reponer cuanto antes"
          subtitle="Estos productos están en el mínimo o por debajo, y son los que más se venden"
        >
          <ul className="flex flex-wrap gap-2">
            {lowStock.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => setAdjusting(p)}
                  className="flex items-center gap-2 rounded-full border border-line-strong px-3 py-1.5 text-[12.5px] font-medium text-body transition-colors hover:border-brand hover:text-brand"
                >
                  {p.name}
                  <span className="font-bold tabular-nums text-warn">{p.stock}</span>
                </button>
              </li>
            ))}
          </ul>
        </PanelCard>
      )}

      <div className="rounded-[14px] border border-line bg-card p-2 sm:p-3">
        <DataTable
          rows={slice}
          columns={columns}
          empty={
            <EmptyState
              icon={<Package size={24} />}
              title="No hay productos con esos filtros"
              description="Cambiá los filtros o cargá un producto nuevo."
              action={<Button onClick={() => setEditing('new')}>Nuevo producto</Button>}
            />
          }
          mobileCard={(p) => (
            <>
              <div className="flex gap-3">
                <ProductArt product={p} size="sm" className="size-14 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[13.5px] font-bold leading-snug text-strong">{p.name}</p>
                  <p className="mt-0.5 font-mono text-[11.5px] text-dim">{p.sku}</p>
                  <p className="mt-1 text-[14px] font-bold tabular-nums text-strong">{money(p.price)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={`text-[16px] font-bold tabular-nums ${
                      p.stock === 0 ? 'text-danger' : p.stock <= p.minStock ? 'text-warn' : 'text-strong'
                    }`}
                  >
                    {p.stock}
                  </p>
                  <p className="text-[11px] text-dim">en stock</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2 border-t border-line pt-3">
                <Button size="sm" variant="secondary" onClick={() => setAdjusting(p)} icon={<Boxes size={14} />} className="flex-1">
                  Stock
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setEditing(p)} icon={<Pencil size={14} />} className="flex-1">
                  Editar
                </Button>
              </div>
            </>
          )}
        />
        <Pagination page={page} pages={pages} onChange={setPage} total={total} unit="productos" />
      </div>

      <ProductModal
        product={editing}
        onClose={() => setEditing(null)}
        onSaved={(name, isNew) =>
          toast(isNew ? `${name} agregado al inventario` : `${name} actualizado`, {
            tone: 'mint',
            detail: isNew ? 'Si lo publicaste, ya está visible en la tienda web.' : undefined,
          })
        }
      />

      <StockModal
        product={adjusting}
        onClose={() => setAdjusting(null)}
        onDone={(name, delta) =>
          toast(`Stock de ${name} ${delta > 0 ? 'aumentado' : 'reducido'}`, {
            tone: delta > 0 ? 'mint' : 'amber',
            detail: delta > 0 ? 'Se registró la compra como egreso de caja.' : undefined,
          })
        }
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            actions.deleteProduct(toDelete.id)
            toast(`${toDelete.name} eliminado`, { tone: 'danger' })
          }
        }}
        title="Eliminar producto"
        confirmLabel="Eliminar"
        message={`Se va a borrar “${toDelete?.name}” del inventario y de la tienda web. El histórico de ventas no se modifica.`}
      />
    </>
  )
}

/* ==========================================================================
   ALTA / EDICIÓN DE PRODUCTO
   ========================================================================== */
function ProductModal({
  product, onClose, onSaved,
}: {
  product: Product | 'new' | null
  onClose: () => void
  onSaved: (name: string, isNew: boolean) => void
}) {
  const { actions } = useDemo()
  const isNew = product === 'new'
  const [form, setForm] = useState(EMPTY_PRODUCT)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!product) return
    if (product === 'new') {
      setForm(EMPTY_PRODUCT)
    } else {
      setForm({
        sku: product.sku, name: product.name, category: product.category, brand: product.brand,
        model: product.model ?? '', condition: product.condition, cost: product.cost, price: product.price,
        stock: product.stock, minStock: product.minStock, warrantyDays: product.warrantyDays,
        specs: product.specs.join('\n'), description: product.description ?? '',
        published: product.published, featured: product.featured, location: product.location ?? '',
        emoji: product.art.emoji, tone: product.art.tone,
      })
    }
    setErrors({})
  }, [product])

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  const save = () => {
    const e: Record<string, string> = {}
    if (form.name.trim().length < 3) e.name = 'El nombre es obligatorio.'
    if (!form.sku.trim()) e.sku = 'Cargá un código interno para identificarlo.'
    if (!form.brand.trim()) e.brand = 'Indicá la marca.'
    if (form.cost < 0 || form.price < 0) e.price = 'Los importes no pueden ser negativos.'
    if (form.price > 0 && form.price < form.cost) e.price = 'El precio de venta está por debajo del costo.'
    if (form.stock < 0) e.stock = 'El stock no puede ser negativo.'
    if (form.minStock < 0) e.minStock = 'El mínimo no puede ser negativo.'
    setErrors(e)
    if (Object.keys(e).length > 0) return

    const payload = {
      sku: form.sku.trim().toUpperCase(),
      name: form.name.trim(),
      category: form.category,
      brand: form.brand.trim(),
      model: form.model.trim() || undefined,
      condition: form.condition,
      cost: form.cost,
      price: form.price,
      stock: form.stock,
      minStock: form.minStock,
      warrantyDays: form.warrantyDays,
      specs: form.specs.split('\n').map((s) => s.trim()).filter(Boolean),
      description: form.description.trim() || undefined,
      published: form.published,
      featured: form.featured,
      location: form.location.trim() || undefined,
      art: { emoji: form.emoji || '📦', tone: form.tone },
    }

    if (isNew) actions.createProduct(payload)
    else if (product) actions.updateProduct(product.id, payload)

    onSaved(payload.name, isNew)
    onClose()
  }

  return (
    <Modal
      open={Boolean(product)}
      onClose={onClose}
      title={isNew ? 'Nuevo producto' : 'Editar producto'}
      description="Los productos publicados se muestran automáticamente en la tienda del sitio web."
      size="lg"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" onClick={save}>
            {isNew ? 'Crear producto' : 'Guardar cambios'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Nombre" required value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} placeholder="Samsung Galaxy A55 5G 256GB" />
          <Input label="Código interno (SKU)" required value={form.sku} onChange={(e) => set('sku', e.target.value)} error={errors.sku} placeholder="CEL-SAM-A55" />
          <Input label="Marca" required value={form.brand} onChange={(e) => set('brand', e.target.value)} error={errors.brand} placeholder="Samsung" />
          <Input label="Modelo" value={form.model} onChange={(e) => set('model', e.target.value)} placeholder="Galaxy A55 5G" />
          <Select
            label="Categoría"
            value={form.category}
            onChange={(e) => set('category', e.target.value as ProductCategory)}
            options={(Object.keys(CATEGORY_LABEL) as ProductCategory[]).map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))}
          />
          <Select
            label="Condición"
            value={form.condition}
            onChange={(e) => set('condition', e.target.value as Product['condition'])}
            options={[
              { value: 'nuevo', label: 'Nuevo' },
              { value: 'reacondicionado', label: 'Reacondicionado' },
              { value: 'usado', label: 'Usado' },
            ]}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <MoneyInput label="Costo" value={form.cost} onValueChange={(v) => set('cost', v)} />
          <MoneyInput label="Precio de venta" value={form.price} onValueChange={(v) => set('price', v)} error={errors.price} />
          <Input label="Stock actual" type="number" min={0} value={form.stock} onChange={(e) => set('stock', Number(e.target.value) || 0)} error={errors.stock} />
          <Input label="Stock mínimo" type="number" min={0} value={form.minStock} onChange={(e) => set('minStock', Number(e.target.value) || 0)} error={errors.minStock} hint="Avisa cuando baje de acá." />
        </div>

        {form.price > 0 && form.cost > 0 && (
          <p className="rounded-[10px] bg-muted/70 p-3 text-[12.5px] text-dim">
            Margen por unidad:{' '}
            <strong className="font-bold text-strong">{money(form.price - form.cost)}</strong> (
            {Math.round(((form.price - form.cost) / form.price) * 100)}%) · Valor del stock:{' '}
            <strong className="font-bold text-strong">{money(form.cost * form.stock)}</strong>
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <Input label="Ubicación física" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Vitrina A" hint="Para encontrarlo rápido." />
          <Input label="Garantía (días)" type="number" min={0} value={form.warrantyDays} onChange={(e) => set('warrantyDays', Number(e.target.value) || 0)} />
          <Input label="Ícono" value={form.emoji} onChange={(e) => set('emoji', e.target.value)} placeholder="📱" hint="Emoji para la vitrina." />
        </div>

        <Textarea
          label="Características (una por línea)"
          rows={4}
          value={form.specs}
          onChange={(e) => set('specs', e.target.value)}
          placeholder={'256GB / 8GB RAM\nPantalla Super AMOLED 6.6"\nCámara 50MP OIS'}
        />
        <Textarea
          label="Descripción para la web"
          rows={2}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Sellado, con garantía oficial. Ideal para quien quiere buena cámara."
        />

        <div className="rounded-[11px] border border-line p-3.5">
          <Checkbox
            label="Publicar en la tienda del sitio web"
            description="Si lo desmarcás, queda solo para uso interno (repuestos, insumos)."
            checked={form.published}
            onChange={(v) => set('published', v)}
          />
          <Checkbox
            label="Destacar en la portada"
            description="Aparece en la sección de productos destacados de la página de inicio."
            checked={form.featured}
            onChange={(v) => set('featured', v)}
          />
        </div>
      </div>
    </Modal>
  )
}

/* ==========================================================================
   AJUSTE DE STOCK
   ========================================================================== */
function StockModal({
  product, onClose, onDone,
}: {
  product: Product | null
  onClose: () => void
  onDone: (name: string, delta: number) => void
}) {
  const { actions } = useDemo()
  const [qty, setQty] = useState(1)
  const [mode, setMode] = useState<'ingreso' | 'salida'>('ingreso')
  const [reason, setReason] = useState('Compra a proveedor')
  const [error, setError] = useState('')

  useEffect(() => {
    setQty(1)
    setMode('ingreso')
    setReason('Compra a proveedor')
    setError('')
  }, [product])

  if (!product) return null

  const delta = mode === 'ingreso' ? qty : -qty
  const resulting = product.stock + delta

  return (
    <Modal
      open
      onClose={onClose}
      title="Ajustar stock"
      description={`${product.name} · stock actual: ${num(product.stock)}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={() => {
              if (qty <= 0) return setError('La cantidad debe ser mayor a cero.')
              if (resulting < 0) return setError('No podés descontar más de lo que hay en stock.')
              actions.adjustStock(product.id, delta, reason)
              onDone(product.name, delta)
              onClose()
            }}
          >
            Confirmar ajuste
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <SegmentedControl<'ingreso' | 'salida'>
          value={mode}
          onChange={(v) => {
            setMode(v)
            setReason(v === 'ingreso' ? 'Compra a proveedor' : 'Rotura / merma')
          }}
          options={[
            { value: 'ingreso', label: 'Ingreso de mercadería' },
            { value: 'salida', label: 'Salida / merma' },
          ]}
        />
        <Input label="Cantidad" type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value) || 0)} error={error} required />
        <Select
          label="Motivo"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          options={
            mode === 'ingreso'
              ? [
                  { value: 'Compra a proveedor', label: 'Compra a proveedor' },
                  { value: 'Devolución de cliente', label: 'Devolución de cliente' },
                  { value: 'Corrección de inventario', label: 'Corrección de inventario' },
                ]
              : [
                  { value: 'Rotura / merma', label: 'Rotura / merma' },
                  { value: 'Uso interno del taller', label: 'Uso interno del taller' },
                  { value: 'Corrección de inventario', label: 'Corrección de inventario' },
                ]
          }
        />
        <p className="rounded-[10px] bg-muted/70 p-3 text-[12.5px] leading-relaxed text-dim">
          Stock resultante: <strong className="font-bold text-strong">{Math.max(0, resulting)}</strong> unidades.
          {mode === 'ingreso' && (
            <>
              {' '}
              Se registra un egreso de caja por{' '}
              <strong className="font-bold text-strong">{money(product.cost * qty)}</strong>.
            </>
          )}
        </p>
      </div>
    </Modal>
  )
}
