import { useState } from 'react'
import { BadgeCheck, Mail, MessageCircle, Phone } from 'lucide-react'
import { Instagram } from '@/components/ui/InstagramIcon'
import { useDemo } from '@/demo/store'
import { BRAND_CONFIG } from '@/config/brand'
import { usePageMeta } from '@/lib/seo'
import { waLink, waMessages } from '@/lib/whatsapp'
import { Button } from '@/components/ui/primitives'
import { Input, Textarea } from '@/components/ui/form'
import { useToast } from '@/components/ui/overlay'
import { toneSoft } from '@/components/ui/tone'
import { LocationBlock } from '../sections/blocks'
import { PageHeader } from './shared'

export function Contacto() {
  usePageMeta({
    title: 'Contacto',
    description: `Escribinos por WhatsApp, llamanos al ${BRAND_CONFIG.phone} o pasá por ${BRAND_CONFIG.address}, ${BRAND_CONFIG.city}. Respondemos en el día.`,
  })

  const { actions } = useDemo()
  const toast = useToast()
  const [form, setForm] = useState({ name: '', phone: '', message: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sent, setSent] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (form.name.trim().length < 3) next.name = 'Escribí tu nombre.'
    if (form.phone.replace(/\D/g, '').length < 9) next.phone = 'Ingresá un teléfono válido.'
    if (form.message.trim().length < 10) next.message = 'Contanos un poco más para poder ayudarte.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    actions.createRequest({
      type: 'consulta',
      name: form.name.trim(),
      phone: form.phone.trim(),
      issue: form.message.trim(),
      source: 'web',
    })
    setSent(true)
    toast('Consulta enviada', { tone: 'mint', detail: 'Te respondemos en el día.' })
  }

  const channels = [
    {
      icon: <MessageCircle size={19} />,
      title: 'WhatsApp',
      value: BRAND_CONFIG.whatsappDisplay,
      note: 'La vía más rápida. Respondemos en minutos en horario comercial.',
      href: waLink(waMessages.general()),
    },
    {
      icon: <Phone size={19} />,
      title: 'Teléfono',
      value: BRAND_CONFIG.phone,
      note: 'Llamanos si preferís hablar con alguien del local.',
      href: `tel:${BRAND_CONFIG.phone.replace(/\s/g, '')}`,
    },
    {
      icon: <Mail size={19} />,
      title: 'Email',
      value: BRAND_CONFIG.email,
      note: 'Para presupuestos de empresas y facturación.',
      href: `mailto:${BRAND_CONFIG.email}`,
    },
    {
      icon: <Instagram size={19} />,
      title: 'Instagram',
      value: BRAND_CONFIG.social.instagramHandle,
      note: 'Ahí publicamos ingresos de equipos y promociones.',
      href: BRAND_CONFIG.social.instagram,
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Contacto"
        title="Estamos para ayudarte"
        description="Elegí el canal que te quede más cómodo. Si es una consulta técnica, contanos el modelo del equipo y qué le pasa: así te respondemos con precio de una."
        breadcrumb={[{ label: 'Contacto' }]}
      />

      <section className="container-x -mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {channels.map((c) => (
            <a
              key={c.title}
              href={c.href}
              target={c.href.startsWith('http') ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="group flex gap-3.5 rounded-[15px] border border-line bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-[var(--shadow-md)]"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[12px]" style={toneSoft('blue', 11)}>
                {c.icon}
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-bold uppercase tracking-wider text-dim">{c.title}</p>
                <p className="mt-0.5 truncate text-[15px] font-bold text-strong group-hover:text-brand">
                  {c.value}
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-dim">{c.note}</p>
              </div>
            </a>
          ))}
        </div>

        <div className="rounded-[16px] border border-line bg-card p-5 sm:p-6">
          {sent ? (
            <div className="anim-fade-in flex flex-col items-center py-8 text-center">
              <span className="flex size-14 items-center justify-center rounded-full" style={toneSoft('mint', 13)}>
                <BadgeCheck size={28} />
              </span>
              <h2 className="mt-5 text-[19px] font-extrabold text-strong">Recibimos tu mensaje</h2>
              <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-dim">
                Te vamos a responder al {form.phone} dentro del día. Si es urgente, escribinos directo por
                WhatsApp.
              </p>
              <Button
                variant="whatsapp"
                className="mt-6"
                href={waLink(`Hola, escribí por la web. ${form.message}`)}
                external
                icon={<MessageCircle size={16} />}
              >
                Continuar por WhatsApp
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <h2 className="text-[17px] font-bold text-strong">Escribinos</h2>
              <p className="mt-1.5 text-[13.5px] text-dim">
                Dejanos tu consulta y te contactamos. Respondemos de lunes a sábado.
              </p>
              <div className="mt-5 flex flex-col gap-4">
                <Input
                  label="Nombre"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  error={errors.name}
                  placeholder="Nombre y apellido"
                  autoComplete="name"
                />
                <Input
                  label="Teléfono / WhatsApp"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  error={errors.phone}
                  placeholder="0981 234 567"
                  autoComplete="tel"
                />
                <Textarea
                  label="Tu consulta"
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  error={errors.message}
                  placeholder="Ej. Tengo una notebook Lenovo que no enciende. ¿Cuánto puede salir revisarla?"
                />
                <Button type="submit" size="lg" block>
                  Enviar consulta
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>

      <LocationBlock />
    </>
  )
}
