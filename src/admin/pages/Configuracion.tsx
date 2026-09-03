import { useState } from 'react'
import { AlertTriangle, Check, Database, FileCode2, Palette, RotateCcw, Store } from 'lucide-react'
import { BRAND_CONFIG } from '@/config/brand'
import { useDemo } from '@/demo/store'
import { storageAvailable } from '@/demo/storage'
import { dmyHm, money } from '@/lib/format'
import { Badge, Button } from '@/components/ui/primitives'
import { Input, Switch } from '@/components/ui/form'
import { ConfirmDialog, useToast } from '@/components/ui/overlay'
import { toneSoft } from '@/components/ui/tone'
import { PanelHeader } from '../AdminLayout'
import { PanelCard } from '../shared'

export function Configuracion() {
  const { db, actions } = useDemo()
  const toast = useToast()
  const [confirmReset, setConfirmReset] = useState(false)
  const [name, setName] = useState(db.settings.businessName)
  const [warranty, setWarranty] = useState(db.settings.warrantyDays)
  const [sla, setSla] = useState(db.settings.slaDays)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const persistence = storageAvailable()

  const counts = [
    { label: 'Clientes', value: db.customers.length },
    { label: 'Órdenes de servicio', value: db.orders.length },
    { label: 'Productos', value: db.products.length },
    { label: 'Ventas', value: db.sales.length },
    { label: 'Movimientos de caja', value: db.cash.length },
    { label: 'Solicitudes web', value: db.requests.length },
    { label: 'Servicios publicados', value: db.services.filter((s) => s.published).length },
    { label: 'Personas en el equipo', value: db.staff.length },
  ]

  const save = () => {
    const e: Record<string, string> = {}
    if (name.trim().length < 2) e.name = 'El nombre del negocio es obligatorio.'
    if (warranty < 0 || warranty > 730) e.warranty = 'Ingresá un valor entre 0 y 730 días.'
    if (sla < 1 || sla > 30) e.sla = 'El plazo objetivo debe estar entre 1 y 30 días.'
    setErrors(e)
    if (Object.keys(e).length > 0) return
    actions.updateSettings({ businessName: name.trim(), warrantyDays: warranty, slaDays: sla })
    toast('Configuración guardada', { tone: 'mint' })
  }

  return (
    <>
      <PanelHeader
        title="Configuración"
        description="Parámetros del negocio y datos de la demostración."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* -------------------------------------------------- Negocio */}
        <PanelCard title="Datos del negocio" subtitle="Se usan en las órdenes, comprobantes y avisos">
          <div className="flex flex-col gap-4">
            <Input label="Nombre comercial" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Garantía por defecto (días)"
                type="number"
                min={0}
                value={warranty}
                onChange={(e) => setWarranty(Number(e.target.value) || 0)}
                error={errors.warranty}
                hint="Se aplica a las órdenes nuevas."
              />
              <Input
                label="Plazo objetivo de reparación (días)"
                type="number"
                min={1}
                value={sla}
                onChange={(e) => setSla(Number(e.target.value) || 0)}
                error={errors.sla}
                hint="Sirve para marcar las órdenes atrasadas."
              />
            </div>
            <Switch
              label="Avisar cuando un producto llegue al stock mínimo"
              description="Genera una notificación en el panel y lo marca en el inventario."
              checked={db.settings.lowStockAlert}
              onChange={(v) => {
                actions.updateSettings({ lowStockAlert: v })
                toast(v ? 'Alertas de stock activadas' : 'Alertas de stock desactivadas', { tone: 'blue' })
              }}
            />
            <div>
              <Button size="sm" onClick={save} icon={<Check size={15} />}>
                Guardar cambios
              </Button>
            </div>
          </div>
        </PanelCard>

        {/* ------------------------------------------------- Identidad */}
        <PanelCard
          title="Identidad visual y marca"
          subtitle="Dónde se cambia el nombre, el logo, los colores y el contacto"
        >
          <div className="flex flex-wrap items-center gap-3">
            {(['primary', 'secondary', 'accent'] as const).map((key) => (
              <div key={key} className="flex items-center gap-2">
                <span
                  className="size-8 rounded-[9px] border border-line"
                  style={{ background: BRAND_CONFIG.colors[key] }}
                  aria-hidden
                />
                <span className="text-[12px]">
                  <span className="block font-semibold text-strong">
                    {{ primary: 'Principal', secondary: 'Oscuro', accent: 'Acento' }[key]}
                  </span>
                  <span className="block font-mono text-dim">{BRAND_CONFIG.colors[key]}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[11px] border border-line p-4">
            <p className="flex items-center gap-2 text-[13px] font-bold text-strong">
              <FileCode2 size={15} /> src/config/brand.ts
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-dim">
              Todo lo visual y de contacto sale de ese único archivo: nombre, logo, colores, tipografías,
              teléfono, WhatsApp, dirección, horarios, redes y datos de SEO. Cambiándolo se re-marca el sitio
              completo y el panel, sin tocar ningún componente.
            </p>
          </div>

          <div className="mt-3 rounded-[11px] border border-line p-4">
            <p className="flex items-center gap-2 text-[13px] font-bold text-strong">
              <FileCode2 size={15} /> src/config/content.ts
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-dim">
              Textos del sitio: titulares, propuesta de valor, pasos del proceso, preguntas frecuentes y el
              cotizador rápido con sus rangos de precio.
            </p>
          </div>

          <ul className="mt-4 flex flex-col gap-2 border-t border-line pt-4 text-[12.5px]">
            <li className="flex justify-between gap-3">
              <span className="text-dim">Teléfono</span>
              <span className="font-semibold text-strong">{BRAND_CONFIG.phone}</span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-dim">WhatsApp</span>
              <span className="font-semibold text-strong">{BRAND_CONFIG.whatsappDisplay}</span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-dim">Dirección</span>
              <span className="text-right font-semibold text-strong">
                {BRAND_CONFIG.address}, {BRAND_CONFIG.city}
              </span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-dim">Instagram</span>
              <span className="font-semibold text-strong">{BRAND_CONFIG.social.instagramHandle}</span>
            </li>
          </ul>
        </PanelCard>

        {/* ------------------------------------------------ Datos demo */}
        <PanelCard
          title="Datos de demostración"
          subtitle="Cómo funciona la persistencia de esta demo"
        >
          <div
            className="mb-4 flex items-start gap-3 rounded-[11px] border p-3.5"
            style={toneSoft(persistence ? 'mint' : 'amber', 9)}
          >
            <Database size={18} className="mt-0.5 shrink-0" aria-hidden />
            <div>
              <p className="text-[13px] font-bold text-strong">
                {persistence ? 'Persistencia activa' : 'Persistencia no disponible'}
              </p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed">
                {persistence
                  ? 'Todo lo que cargues queda guardado en este navegador. Podés cerrar la pestaña y volver: los datos siguen ahí.'
                  : 'El navegador está bloqueando el almacenamiento local (modo privado). La demo funciona, pero los cambios se pierden al recargar.'}
              </p>
            </div>
          </div>

          <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            {counts.map((c) => (
              <li key={c.label} className="flex items-baseline justify-between gap-2 border-b border-line/70 pb-2">
                <span className="text-[12.5px] text-dim">{c.label}</span>
                <span className="text-[14px] font-bold tabular-nums text-strong">{c.value}</span>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-[12px] text-dim">
            Set de datos generado el {dmyHm(db.seededAt)} · versión {db.version}
          </p>

          <div className="mt-5 border-t border-line pt-5">
            <Button variant="secondary" size="sm" onClick={() => setConfirmReset(true)} icon={<RotateCcw size={15} />}>
              Restaurar datos de demostración
            </Button>
            <p className="mt-2 text-[12px] leading-relaxed text-dim">
              Vuelve todo al estado original: útil antes de mostrarle el sistema a un cliente nuevo.
            </p>
          </div>
        </PanelCard>

        {/* ------------------------------------------------ Alcance demo */}
        <PanelCard title="Sobre esta demostración" subtitle="Qué es y qué no es este sistema">
          <div className="flex items-start gap-3 rounded-[11px] border p-3.5" style={toneSoft('amber', 9)}>
            <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden />
            <p className="text-[12.5px] leading-relaxed">
              Esta es una <strong className="font-semibold">demostración comercial</strong>. Funciona
              íntegramente en el navegador, sin servidor ni base de datos, y los datos son ficticios aunque
              realistas.
            </p>
          </div>

          <ul className="mt-4 flex flex-col gap-2.5 text-[13px] leading-relaxed text-body">
            <li className="flex gap-2">
              <Check size={15} className="mt-0.5 shrink-0 text-accent" aria-hidden />
              Toda la lógica de negocio es real: cambiar un estado, cobrar, vender o ajustar stock impacta en
              los KPIs y en el historial.
            </li>
            <li className="flex gap-2">
              <Check size={15} className="mt-0.5 shrink-0 text-accent" aria-hidden />
              El sitio público y el panel comparten los mismos datos: lo que publicás acá se ve en la web al
              instante.
            </li>
            <li className="flex gap-2">
              <Check size={15} className="mt-0.5 shrink-0 text-accent" aria-hidden />
              En producción se agrega backend con usuarios, permisos, respaldos y facturación electrónica.
            </li>
          </ul>

          <div className="mt-5 flex flex-wrap gap-2.5 border-t border-line pt-5">
            <Button size="sm" variant="secondary" href="/" icon={<Store size={15} />}>
              Ver el sitio público
            </Button>
            <Button size="sm" variant="secondary" href="/servicios" icon={<Palette size={15} />}>
              Ver servicios publicados
            </Button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-5">
            <Badge tone="slate">Moneda: {BRAND_CONFIG.currency.code}</Badge>
            <Badge tone="slate">Formato: {money(1250000)}</Badge>
            <Badge tone="slate">Zona: {BRAND_CONFIG.city}, {BRAND_CONFIG.country}</Badge>
          </div>
        </PanelCard>
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
        message="Se descartan todos los cambios (órdenes, ventas, clientes, productos y ajustes) y se regenera el set de datos original."
      />
    </>
  )
}
