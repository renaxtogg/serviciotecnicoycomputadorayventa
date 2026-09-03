import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useDemo } from '@/demo/store'
import { CATEGORY_LABEL, PAYMENT_LABEL, type PaymentMethod, type Product, type SaleItem } from '@/demo/types'
import { money } from '@/lib/format'
import { matches, sortBy } from '@/lib/utils'
import { Badge, Button } from '@/components/ui/primitives'
import { MoneyInput, Select } from '@/components/ui/form'
import { EmptyState, SearchInput } from '@/components/ui/data'
import { useToast } from '@/components/ui/overlay'
import { toneSoft } from '@/components/ui/tone'
import { ProductArt } from '@/site/components'
import { PanelHeader } from '../AdminLayout'

const POS_CATEGORIES = ['celular', 'notebook', 'pc', 'tablet', 'accesorio', 'componente'] as const

export function PuntoDeVenta() {
  const { db, actions } = useDemo()
  const toast = useToast()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('')
  const [cart, setCart] = useState<SaleItem[]>([])
  const [customerId, setCustomerId] = useState('')
  const [sellerId, setSellerId] = useState(db.staff.find((s) => s.role === 'vendedor')?.id ?? db.staff[0]?.id ?? '')
  const [method, setMethod] = useState<PaymentMethod>('efectivo')
  const [installments, setInstallments] = useState(6)
  const [discount, setDiscount] = useState(0)
  const [error, setError] = useState('')

  const catalog = useMemo(
    () =>
      sortBy(
        db.products.filter((p) => POS_CATEGORIES.includes(p.category as (typeof POS_CATEGORIES)[number])),
        (p) => p.name,
      ),
    [db.products],
  )

  const results = useMemo(
    () =>
      catalog.filter((p) => {
        if (category && p.category !== category) return false
        return matches([p.name, p.brand, p.model, p.sku], query)
      }),
    [catalog, category, query],
  )

  const subtotal = cart.reduce((a, it) => a + it.price * it.qty, 0)
  const total = Math.max(0, subtotal - discount)
  const margin = cart.reduce((a, it) => a + (it.price - it.cost) * it.qty, 0) - discount

  const stockLeft = (p: Product) => p.stock - (cart.find((it) => it.productId === p.id)?.qty ?? 0)

  const add = (p: Product) => {
    if (stockLeft(p) <= 0) {
      toast('Sin stock disponible', { tone: 'amber', detail: `${p.name} no tiene unidades para vender.` })
      return
    }
    setError('')
    setCart((prev) => {
      const found = prev.find((it) => it.productId === p.id)
      if (found) return prev.map((it) => (it.productId === p.id ? { ...it, qty: it.qty + 1 } : it))
      return [...prev, { productId: p.id, name: p.name, qty: 1, price: p.price, cost: p.cost }]
    })
  }

  const setQty = (productId: string, qty: number) => {
    const product = db.products.find((p) => p.id === productId)
    const max = product?.stock ?? 99
    setCart((prev) =>
      prev
        .map((it) => (it.productId === productId ? { ...it, qty: Math.min(max, Math.max(0, qty)) } : it))
        .filter((it) => it.qty > 0),
    )
  }

  const checkout = () => {
    if (cart.length === 0) {
      setError('Agregá al menos un producto para poder cobrar.')
      return
    }
    if (discount > subtotal) {
      setError('El descuento no puede superar el subtotal.')
      return
    }
    if (!sellerId) {
      setError('Elegí quién realiza la venta.')
      return
    }
    const customer = db.customers.find((c) => c.id === customerId)
    const sale = actions.createSale({
      items: cart,
      customerId: customerId || undefined,
      customerName: customer?.name ?? 'Consumidor final',
      discount,
      method,
      installments: method === 'cuotas' ? installments : undefined,
      sellerId,
      channel: 'local',
    })
    toast(`Venta ${sale?.code} registrada`, {
      tone: 'mint',
      detail: `${money(total)} · el stock ya quedó descontado.`,
    })
    setCart([])
    setDiscount(0)
    setCustomerId('')
    setError('')
    navigate('/panel/ventas')
  }

  return (
    <>
      <PanelHeader
        title="Punto de venta"
        description="Cobrá en el mostrador en pocos clics. El stock y la caja se actualizan solos."
      />

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* ------------------------------------------------------- Catálogo */}
        <div className="rounded-[14px] border border-line bg-card p-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <SearchInput value={query} onChange={setQuery} placeholder="Buscar producto o código…" className="min-w-[200px] flex-1" />
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Todas las categorías"
              aria-label="Filtrar por categoría"
              className="!h-10"
              wrapClassName="min-w-[170px]"
              options={POS_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))}
            />
          </div>

          {results.length === 0 ? (
            <EmptyState
              icon={<ShoppingCart size={22} />}
              title="No encontramos productos"
              description="Revisá la búsqueda o cargá el producto desde Inventario."
              action={<Button variant="secondary" to="/panel/inventario">Ir a inventario</Button>}
            />
          ) : (
            <ul className="mt-4 grid max-h-[64vh] gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3 thin-scroll">
              {results.map((p) => {
                const left = stockLeft(p)
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => add(p)}
                      disabled={left <= 0}
                      className="flex w-full gap-3 rounded-[12px] border border-line p-2.5 text-left transition-all hover:border-brand/50 hover:shadow-[var(--shadow-sm)] disabled:opacity-45 disabled:hover:border-line disabled:hover:shadow-none"
                    >
                      <ProductArt product={p} size="sm" className="size-14 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-[12.5px] font-semibold leading-snug text-strong">
                          {p.name}
                        </span>
                        <span className="mt-1 block text-[13px] font-bold tabular-nums text-strong">
                          {money(p.price)}
                        </span>
                        <span
                          className={`mt-0.5 block text-[11.5px] font-medium ${
                            left <= 0 ? 'text-danger' : left <= p.minStock ? 'text-warn' : 'text-dim'
                          }`}
                        >
                          {left <= 0 ? 'Sin stock' : `${left} disponibles`}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* --------------------------------------------------------- Carrito */}
        <aside className="lg:sticky lg:top-[84px] lg:self-start">
          <div className="rounded-[14px] border border-line bg-card">
            <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5">
              <h2 className="flex items-center gap-2 text-[14.5px] font-bold text-strong">
                <ShoppingCart size={16} /> Venta actual
              </h2>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-[12.5px] font-semibold text-dim transition-colors hover:text-danger"
                >
                  Vaciar
                </button>
              )}
            </header>

            <div className="thin-scroll max-h-[36vh] overflow-y-auto px-4 py-3">
              {cart.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-dim">
                  Tocá un producto de la izquierda para agregarlo a la venta.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {cart.map((it) => (
                    <li key={it.productId} className="flex items-start gap-2.5">
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-strong">
                          {it.name}
                        </span>
                        <span className="mt-0.5 block text-[12px] text-dim">{money(it.price)} c/u</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => setQty(it.productId, it.qty - 1)}
                          aria-label="Quitar una unidad"
                          className="flex size-7 items-center justify-center rounded-lg border border-line-strong text-dim transition-colors hover:text-strong"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-6 text-center text-[13px] font-bold tabular-nums text-strong">{it.qty}</span>
                        <button
                          onClick={() => setQty(it.productId, it.qty + 1)}
                          aria-label="Agregar una unidad"
                          className="flex size-7 items-center justify-center rounded-lg border border-line-strong text-dim transition-colors hover:text-strong"
                        >
                          <Plus size={13} />
                        </button>
                      </span>
                      <span className="w-[86px] shrink-0 text-right text-[13px] font-bold tabular-nums text-strong">
                        {money(it.price * it.qty)}
                      </span>
                      <button
                        onClick={() => setQty(it.productId, 0)}
                        aria-label={`Quitar ${it.name}`}
                        className="mt-0.5 shrink-0 text-dim transition-colors hover:text-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-line px-4 py-4">
              <div className="grid gap-3">
                <Select
                  label="Cliente"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  placeholder="Consumidor final"
                  className="!h-10"
                  options={sortBy(db.customers, (c) => c.name).map((c) => ({ value: c.id, label: c.name }))}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select
                    label="Vendedor"
                    value={sellerId}
                    onChange={(e) => setSellerId(e.target.value)}
                    className="!h-10"
                    options={db.staff.filter((s) => s.active).map((s) => ({ value: s.id, label: s.name }))}
                  />
                  <Select
                    label="Forma de pago"
                    value={method}
                    onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                    className="!h-10"
                    options={(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((m) => ({
                      value: m,
                      label: PAYMENT_LABEL[m],
                    }))}
                  />
                </div>
                {method === 'cuotas' && (
                  <Select
                    label="Cantidad de cuotas"
                    value={String(installments)}
                    onChange={(e) => setInstallments(Number(e.target.value))}
                    className="!h-10"
                    options={[3, 6, 10, 12, 18].map((n) => ({
                      value: String(n),
                      label: `${n} cuotas de ${money(Math.round(total / n / 1000) * 1000)}`,
                    }))}
                  />
                )}
                <MoneyInput label="Descuento" value={discount} onValueChange={setDiscount} />
              </div>

              <dl className="mt-4 divide-y divide-line border-t border-line pt-2">
                <div className="flex justify-between py-2 text-[13px]">
                  <dt className="text-dim">Subtotal</dt>
                  <dd className="font-semibold tabular-nums text-body">{money(subtotal)}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between py-2 text-[13px]">
                    <dt className="text-dim">Descuento</dt>
                    <dd className="font-semibold tabular-nums text-danger">−{money(discount)}</dd>
                  </div>
                )}
                <div className="flex items-baseline justify-between py-3">
                  <dt className="text-[13.5px] font-bold text-strong">Total</dt>
                  <dd className="text-[24px] font-extrabold leading-none tabular-nums text-strong">{money(total)}</dd>
                </div>
              </dl>

              {cart.length > 0 && (
                <p className="mb-3 rounded-[10px] p-2.5 text-[12px]" style={toneSoft('mint', 9)}>
                  Margen de esta venta: <strong className="font-bold">{money(margin)}</strong>
                </p>
              )}

              {error && <p className="mb-3 text-[12.5px] font-medium text-danger">{error}</p>}

              <Button size="lg" block onClick={checkout} disabled={cart.length === 0}>
                Cobrar {cart.length > 0 && money(total)}
              </Button>
              <p className="mt-2.5 text-center text-[11.5px] text-dim">
                Al cobrar se descuenta el stock y se registra el ingreso en caja.
              </p>
            </div>
          </div>

          {cart.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {cart.map((it) => (
                <Badge key={it.productId} tone="blue">
                  {it.qty}× {it.name.slice(0, 22)}
                  {it.name.length > 22 ? '…' : ''}
                </Badge>
              ))}
            </div>
          )}
        </aside>
      </div>
    </>
  )
}
