import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, Clock, MessageCircle, ShieldCheck, Wrench } from 'lucide-react'
import { useDemo } from '@/demo/store'
import { QUOTE_BRANDS, QUOTE_DEVICES, QUOTE_ISSUES, TIME_SLOTS } from '@/config/content'
import { BRAND_CONFIG } from '@/config/brand'
import { money } from '@/lib/format'
import { usePageMeta } from '@/lib/seo'
import { waLink } from '@/lib/whatsapp'
import { Button } from '@/components/ui/primitives'
import { Input, Select, Textarea } from '@/components/ui/form'
import { useToast } from '@/components/ui/overlay'
import { toneSoft } from '@/components/ui/tone'
import { PageHeader } from './shared'

interface FormState {
  name: string
  phone: string
  deviceType: string
  brand: string
  model: string
  issueId: string
  detail: string
  slot: string
}

const EMPTY: FormState = {
  name: '', phone: '', deviceType: 'celular', brand: '', model: '',
  issueId: '', detail: '', slot: TIME_SLOTS[0],
}

export function Agendar() {
  usePageMeta({
    title: 'Pedir presupuesto para tu reparación',
    description:
      'Contanos qué equipo tenés y qué le pasa. Te confirmamos el horario y hacemos el diagnóstico sin cargo, con presupuesto antes de tocar nada.',
  })

  const { actions } = useDemo()
  const toast = useToast()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [done, setDone] = useState(false)

  const issues = QUOTE_ISSUES[form.deviceType] ?? []
  const selectedIssue = issues.find((i) => i.id === form.issueId)
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const validate = () => {
    const e: Partial<Record<keyof FormState, string>> = {}
    if (form.name.trim().length < 3) e.name = 'Escribí tu nombre y apellido.'
    if (form.phone.replace(/\D/g, '').length < 9) e.phone = 'Ingresá un número de teléfono válido.'
    if (!form.brand) e.brand = 'Elegí la marca de tu equipo.'
    if (!form.issueId) e.issueId = 'Contanos qué le pasa al equipo.'
    if (form.detail.trim().length > 0 && form.detail.trim().length < 10) {
      e.detail = 'Si vas a agregar detalle, escribí al menos una frase completa.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const deviceLabel = `${form.brand}${form.model ? ` ${form.model}` : ''}`
    actions.createRequest({
      type: 'reparacion',
      name: form.name.trim(),
      phone: form.phone.trim(),
      deviceLabel,
      issue: [selectedIssue?.label, form.detail.trim()].filter(Boolean).join(' — '),
      preferredSlot: form.slot,
      estimate: selectedIssue?.from,
      source: 'web',
    })
    setDone(true)
    toast('Solicitud enviada', { tone: 'mint', detail: 'Te contactamos para confirmar el horario.' })
  }

  if (done) {
    return (
      <>
        <PageHeader eyebrow="Listo" title="Recibimos tu solicitud" breadcrumb={[{ label: 'Pedir presupuesto' }]} />
        <section className="container-x -mt-8 max-w-2xl">
          <div className="anim-fade-up rounded-[16px] border border-line bg-card p-6 text-center sm:p-9">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full" style={toneSoft('mint', 13)}>
              <BadgeCheck size={28} />
            </span>
            <h2 className="mt-5 text-[22px] font-extrabold text-strong">Gracias, {form.name.split(' ')[0]}</h2>
            <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-dim">
              Tu pedido ya entró a nuestra bandeja. Te vamos a escribir al <strong className="font-semibold text-body">{form.phone}</strong> para
              confirmar el horario ({form.slot.toLowerCase()}) y coordinar la revisión de tu {form.brand}.
            </p>

            <dl className="mx-auto mt-7 max-w-sm divide-y divide-line rounded-[13px] border border-line text-left">
              <div className="flex justify-between gap-4 px-4 py-3">
                <dt className="text-[13px] text-dim">Equipo</dt>
                <dd className="text-[13px] font-semibold text-strong">
                  {form.brand} {form.model}
                </dd>
              </div>
              <div className="flex justify-between gap-4 px-4 py-3">
                <dt className="text-[13px] text-dim">Problema</dt>
                <dd className="text-right text-[13px] font-semibold text-strong">{selectedIssue?.label}</dd>
              </div>
              {selectedIssue && (
                <div className="flex justify-between gap-4 px-4 py-3">
                  <dt className="text-[13px] text-dim">Estimado</dt>
                  <dd className="text-[13px] font-semibold text-strong">
                    {money(selectedIssue.from)} – {money(selectedIssue.to)}
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
              <Button
                variant="whatsapp"
                href={waLink(
                  `Hola, acabo de pedir un presupuesto por la web.\n• Nombre: ${form.name}\n• Equipo: ${form.brand} ${form.model}\n• Problema: ${selectedIssue?.label}\n• Horario: ${form.slot}`,
                )}
                external
                icon={<MessageCircle size={16} />}
              >
                Adelantar por WhatsApp
              </Button>
              <Button variant="secondary" to="/">
                Volver al inicio
              </Button>
            </div>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Pedir presupuesto"
        title="Contanos qué le pasa a tu equipo"
        description="Completá el formulario y te confirmamos horario. El diagnóstico no se cobra y no trabajamos sin tu aprobación."
        breadcrumb={[{ label: 'Pedir presupuesto' }]}
      />

      <section className="container-x -mt-8 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <form onSubmit={submit} noValidate className="rounded-[16px] border border-line bg-card p-5 sm:p-6">
          <fieldset className="border-0 p-0">
            <legend className="mb-4 text-[15px] font-bold text-strong">1. Tus datos</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Nombre y apellido"
                required
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                error={errors.name}
                placeholder="Ej. Rodrigo Benítez"
                autoComplete="name"
              />
              <Input
                label="Teléfono / WhatsApp"
                type="tel"
                required
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                error={errors.phone}
                placeholder="0981 234 567"
                autoComplete="tel"
                hint="Es el número al que te vamos a escribir."
              />
            </div>
          </fieldset>

          <fieldset className="mt-8 border-0 p-0">
            <legend className="mb-4 text-[15px] font-bold text-strong">2. Tu equipo</legend>
            <div className="grid gap-4 sm:grid-cols-3">
              <Select
                label="Tipo"
                value={form.deviceType}
                onChange={(e) => {
                  set('deviceType', e.target.value)
                  set('brand', '')
                  set('issueId', '')
                }}
                options={QUOTE_DEVICES.map((d) => ({ value: d.value, label: d.label }))}
              />
              <Select
                label="Marca"
                required
                value={form.brand}
                onChange={(e) => set('brand', e.target.value)}
                error={errors.brand}
                placeholder="Elegí una"
                options={(QUOTE_BRANDS[form.deviceType] ?? []).map((b) => ({ value: b, label: b }))}
              />
              <Input
                label="Modelo"
                value={form.model}
                onChange={(e) => set('model', e.target.value)}
                placeholder="Ej. Galaxy A54"
                hint="Si no sabés, dejalo vacío."
              />
            </div>
          </fieldset>

          <fieldset className="mt-8 border-0 p-0">
            <legend className="mb-4 text-[15px] font-bold text-strong">3. Qué le pasa</legend>
            <Select
              label="Problema principal"
              required
              value={form.issueId}
              onChange={(e) => set('issueId', e.target.value)}
              error={errors.issueId}
              placeholder="Elegí el problema"
              options={issues.map((i) => ({ value: i.id, label: i.label }))}
            />
            {selectedIssue && (
              <p className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[10px] p-3 text-[12.5px]" style={toneSoft('blue', 8)}>
                <span className="font-semibold">
                  Estimado: {money(selectedIssue.from)} – {money(selectedIssue.to)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={13} aria-hidden /> {selectedIssue.eta}
                </span>
                <span className="text-dim">El precio final lo confirma el diagnóstico.</span>
              </p>
            )}
            <Textarea
              label="Contanos un poco más (opcional)"
              className="mt-4"
              rows={3}
              value={form.detail}
              onChange={(e) => set('detail', e.target.value)}
              error={errors.detail}
              placeholder="Ej. Se cayó al piso hace dos días y desde ahí la pantalla parpadea."
            />
          </fieldset>

          <fieldset className="mt-8 border-0 p-0">
            <legend className="mb-4 text-[15px] font-bold text-strong">4. Cuándo te viene bien</legend>
            <Select
              label="Horario preferido"
              value={form.slot}
              onChange={(e) => set('slot', e.target.value)}
              options={TIME_SLOTS.map((s) => ({ value: s, label: s }))}
              hint="Te confirmamos por WhatsApp antes de que vengas."
            />
          </fieldset>

          <div className="mt-8 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12.5px] leading-relaxed text-dim">
              Al enviar aceptás que te contactemos por WhatsApp o teléfono.
            </p>
            <Button type="submit" size="lg" className="sm:px-8">
              Enviar solicitud
            </Button>
          </div>
        </form>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[16px] border border-line bg-muted/60 p-5">
            <h2 className="text-[15px] font-bold text-strong">Qué pasa después</h2>
            <ol className="mt-4 flex flex-col gap-4">
              {[
                { i: <MessageCircle size={16} />, t: 'Te escribimos', d: 'Confirmamos el horario y te decimos qué traer.' },
                { i: <Wrench size={16} />, t: 'Revisamos el equipo', d: 'Diagnóstico sin cargo, delante tuyo si querés.' },
                { i: <ShieldCheck size={16} />, t: 'Aprobás o no', d: 'Te pasamos el presupuesto y decidís sin presión.' },
              ].map((s) => (
                <li key={s.t} className="flex gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-card text-brand">
                    {s.i}
                  </span>
                  <div>
                    <p className="text-[13.5px] font-bold text-strong">{s.t}</p>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-dim">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-5 border-t border-line pt-5">
              <p className="text-[13px] leading-relaxed text-dim">
                ¿Es urgente? Escribinos directo al{' '}
                <a
                  href={waLink('Hola, tengo una urgencia con mi equipo.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-brand hover:underline"
                >
                  {BRAND_CONFIG.whatsappDisplay}
                </a>{' '}
                o pasá directo por {BRAND_CONFIG.address}.
              </p>
              <p className="mt-3 text-[13px] text-dim">
                ¿Ya dejaste tu equipo?{' '}
                <Link to="/seguimiento" className="font-semibold text-brand hover:underline">
                  Consultá el estado acá
                </Link>
                .
              </p>
            </div>
          </div>
        </aside>
      </section>
    </>
  )
}
