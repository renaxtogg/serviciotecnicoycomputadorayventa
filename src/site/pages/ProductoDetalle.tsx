import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  BadgeCheck, Check, CreditCard, MapPin, MessageCircle, PackageX, ShieldCheck, Truck,
} from 'lucide-react'
import { useDemo } from '@/demo/store'
import { CATEGORY_LABEL } from '@/demo/types'
import { BRAND_CONFIG } from '@/config/brand'
import { money } from '@/lib/format'
import { usePageMeta } from '@/lib/seo'
import { waLink, waMessages } from '@/lib/whatsapp'
import { Badge, Button, KeyValue } from '@/components/ui/primitives'
import { Input } from '@/components/ui/form'
import { EmptyState } from '@/components/ui/data'
import { useToast } from '@/components/ui/overlay'
import { ProductArt, ProductCard } from '../components'
import { PageHeader } from './shared'

const CONDITION_COPY = {
  nuevo: 'Producto nuevo, sellado, con garantía oficial.',
  reacondicionado: 'Revisado y probado por nuestros técnicos, con garantía escrita del local.',
  usado: 'Equipo usado en buen estado, revisado por nuestro taller antes de publicarlo.',
}

export function ProductoDetalle() {
  const { id } = useParams()
  const { db, actions } = useDemo()
  const toast = useToast()
  const product = db.products.find((p) => p.id === id && p.published)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})
  const [sent, setSent] = useState(false)

  usePageMeta({
    title: product ? `${product.name} — Tienda` : 'Producto no encontrado',
    description: product
      ? `${product.name}. ${product.specs.join(' · ')}. ${money(product.price)} en ${BRAND_CONFIG.city}.`
      : undefined,
  })

  if (!product) {
    return (
      <>
        <PageHeader title="No encontramos ese producto" breadcrumb={[{ label: 'Tienda', to: '/tienda' }]} />
        <section className="container-x -mt-8 rounded-[15px] border border-line bg-card">
          <EmptyState
            icon={<PackageX size={24} />}
            title="Este producto ya no está publicado"
            description="Puede que se haya vendido o que lo hayamos dado de baja. Mirá el resto de la tienda o consultanos."
            action={
              <Button to="/tienda">Volver a la tienda</Button>
            }
          />
        </section>
      </>
    )
  }

  const related = db.products
    .filter((p) => p.published && p.category === product.category && p.id !== product.id)
    .slice(0, 4)

  const installments = product.price >= 1_000_000 ? 10 : 6
  const perMonth = Math.round(product.price / installments / 1000) * 1000
  const outOfStock = product.stock === 0

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (name.trim().length < 3) next.name = 'Escribí tu nombre completo.'
    if (phone.replace(/\D/g, '').length < 9) next.phone = 'Necesitamos un teléfono válido para contactarte.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    actions.createRequest({
      type: 'producto',
      name: name.trim(),
      phone: phone.trim(),
      productId: product.id,
      productName: product.name,
      issue: `Reserva desde la web · ${money(product.price)}`,
      source: 'web',
    })
    setSent(true)
    toast('Reserva enviada', { tone: 'mint', detail: 'Te contactamos para coordinar el retiro.' })
  }

  return (
    <>
      <PageHeader
        eyebrow={CATEGORY_LABEL[product.category]}
        title={product.name}
        breadcrumb={[{ label: 'Tienda', to: '/tienda' }, { label: product.brand }]}
      />

      <section className="container-x -mt-8">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          {/* ------------------------------------------------------- Imagen */}
          <div>
            <div className="rounded-[16px] border border-line bg-card p-4">
              <ProductArt product={product} size="lg" className="aspect-[4/3] w-full" />
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone={product.condition === 'nuevo' ? 'mint' : product.condition === 'usado' ? 'amber' : 'blue'}>
                  {product.condition === 'nuevo'
                    ? 'Nuevo'
                    : product.condition === 'usado'
                      ? 'Usado'
                      : 'Reacondicionado'}
                </Badge>
                {product.warrantyDays > 0 && (
                  <Badge tone="blue" icon={<ShieldCheck size={12} />}>
                    Garantía {product.warrantyDays >= 365 ? '1 año' : `${product.warrantyDays} días`}
                  </Badge>
                )}
                <Badge tone={outOfStock ? 'danger' : 'mint'} dot>
                  {outOfStock ? 'Sin stock' : product.stock <= product.minStock ? `Últimas ${product.stock} unidades` : 'Disponible'}
                </Badge>
              </div>
            </div>

            {product.specs.length > 0 && (
              <div className="mt-5 rounded-[16px] border border-line bg-card p-5">
                <h2 className="text-[15px] font-bold text-strong">Características</h2>
                <ul className="mt-3.5 grid gap-2.5 sm:grid-cols-2">
                  {product.specs.map((s) => (
                    <li key={s} className="flex items-start gap-2 text-[13.5px] leading-snug text-body">
                      <Check size={15} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                      {s}
                    </li>
                  ))}
                </ul>
                <dl className="mt-5 divide-y divide-line border-t border-line pt-1">
                  <KeyValue label="Marca" value={product.brand} />
                  {product.model && <KeyValue label="Modelo" value={product.model} />}
                  <KeyValue label="Código" value={<span className="font-mono text-[12.5px]">{product.sku}</span>} />
                  <KeyValue label="Condición" value={CONDITION_COPY[product.condition]} />
                </dl>
              </div>
            )}
          </div>

          {/* ------------------------------------------------------- Compra */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[16px] border border-line bg-card p-5 sm:p-6">
              <p className="text-[12px] font-bold uppercase tracking-wider text-dim">{product.brand}</p>
              <h1 className="mt-1 text-[21px] font-extrabold leading-tight text-strong">{product.name}</h1>
              {product.description && (
                <p className="mt-3 text-[13.5px] leading-relaxed text-dim">{product.description}</p>
              )}

              <p className="mt-5 text-[32px] font-extrabold leading-none tracking-tight text-strong">
                {money(product.price)}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-[13px] text-dim">
                <CreditCard size={14} aria-hidden />
                {installments} cuotas de <strong className="font-semibold text-body">{money(perMonth)}</strong> con
                tarjeta
              </p>

              <div className="mt-5 flex flex-col gap-2.5">
                <Button
                  variant="whatsapp"
                  size="lg"
                  block
                  icon={<MessageCircle size={17} />}
                  href={waLink(waMessages.product(product.name, money(product.price)))}
                  external
                >
                  Consultar por WhatsApp
                </Button>
              </div>

              {/* Reserva → cae como solicitud en el panel del negocio */}
              <div className="mt-5 border-t border-line pt-5">
                {sent ? (
                  <div className="anim-fade-in flex gap-3 rounded-[12px] border border-accent/30 bg-accent/[0.07] p-4">
                    <BadgeCheck size={19} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                    <div>
                      <p className="text-[13.5px] font-bold text-strong">Reserva registrada</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-dim">
                        Te vamos a contactar al {phone} para coordinar. Lo guardamos por 48 horas.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={submit} noValidate>
                    <h2 className="text-[14.5px] font-bold text-strong">Reservalo sin pagar nada</h2>
                    <p className="mt-1 text-[12.5px] text-dim">
                      Te lo guardamos 48 horas y te llamamos para coordinar el retiro.
                    </p>
                    <div className="mt-3.5 flex flex-col gap-3">
                      <Input
                        label="Tu nombre"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        error={errors.name}
                        placeholder="Nombre y apellido"
                        required
                      />
                      <Input
                        label="Teléfono"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        error={errors.phone}
                        placeholder="0981 234 567"
                        required
                      />
                      <Button type="submit" block disabled={outOfStock}>
                        {outOfStock ? 'Sin stock disponible' : 'Reservar este producto'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>

              <ul className="mt-5 flex flex-col gap-2.5 border-t border-line pt-5">
                <li className="flex items-center gap-2.5 text-[13px] text-body">
                  <ShieldCheck size={15} className="shrink-0 text-accent" aria-hidden />
                  Garantía respaldada por nuestro propio taller
                </li>
                <li className="flex items-center gap-2.5 text-[13px] text-body">
                  <MapPin size={15} className="shrink-0 text-accent" aria-hidden />
                  Retiro en {BRAND_CONFIG.address}
                </li>
                <li className="flex items-center gap-2.5 text-[13px] text-body">
                  <Truck size={15} className="shrink-0 text-accent" aria-hidden />
                  Envío a domicilio en Asunción y Central
                </li>
              </ul>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <div className="mt-16">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-[20px] font-extrabold text-strong">También te puede servir</h2>
              <Link to="/tienda" className="text-[13.5px] font-semibold text-brand hover:underline">
                Ver todo
              </Link>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  )
}
