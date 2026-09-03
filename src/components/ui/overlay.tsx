import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Tone } from '@/demo/types'
import { Button } from './primitives'
import { TONE_VAR } from './tone'

/* ================================================================ MODAL === */
export function Modal({
  open, onClose, title, description, children, footer, size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <button
        aria-label="Cerrar"
        onClick={onClose}
        className="anim-fade-in absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={cn(
          'anim-pop relative flex max-h-[92vh] w-full flex-col rounded-t-[20px] border border-line bg-card shadow-[var(--shadow-lg)] sm:rounded-[18px]',
          widths[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-[17px] font-bold text-strong">{title}</h2>
            {description && <p className="mt-1 text-[13px] text-dim">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-1 -mt-1 rounded-lg p-1.5 text-dim transition-colors hover:bg-muted hover:text-strong"
          >
            <X size={18} />
          </button>
        </div>
        <div className="thin-scroll flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-2.5 border-t border-line bg-muted/50 px-5 py-4 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

/* =============================================================== DRAWER === */
export function Drawer({
  open, onClose, title, subtitle, children, footer,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      <button aria-label="Cerrar" onClick={onClose} className="anim-fade-in absolute inset-0 bg-ink/45" />
      <aside
        role="dialog"
        aria-modal="true"
        className="anim-slide-right relative flex h-full w-full max-w-[560px] flex-col border-l border-line bg-card shadow-[var(--shadow-lg)]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-[17px] font-bold text-strong">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[13px] text-dim">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 text-dim transition-colors hover:bg-muted hover:text-strong"
          >
            <X size={18} />
          </button>
        </header>
        <div className="thin-scroll flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <footer className="flex flex-wrap justify-end gap-2.5 border-t border-line bg-muted/50 px-5 py-4">
            {footer}
          </footer>
        )}
      </aside>
    </div>,
    document.body,
  )
}

/* ========================================================== CONFIRMACIÓN == */
export function ConfirmDialog({
  open, onClose, onConfirm, title, message, confirmLabel = 'Confirmar', tone = 'danger',
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: ReactNode
  confirmLabel?: string
  tone?: 'danger' | 'primary'
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3.5">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full"
          style={{
            background: `color-mix(in srgb, ${tone === 'danger' ? TONE_VAR.danger : TONE_VAR.blue} 12%, transparent)`,
            color: tone === 'danger' ? TONE_VAR.danger : TONE_VAR.blue,
          }}
        >
          <AlertTriangle size={19} />
        </span>
        <p className="pt-1.5 text-[14px] leading-relaxed text-body">{message}</p>
      </div>
    </Modal>
  )
}

/* ================================================================ TOASTS == */
interface ToastItem {
  id: string
  message: string
  tone: Tone
  detail?: string
}

const ToastContext = createContext<{ toast: (message: string, opts?: { tone?: Tone; detail?: string }) => void } | null>(
  null,
)

const TOAST_ICON: Partial<Record<Tone, ReactNode>> = {
  mint: <CheckCircle2 size={17} />,
  danger: <XCircle size={17} />,
  amber: <AlertTriangle size={17} />,
  blue: <Info size={17} />,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, opts?: { tone?: Tone; detail?: string }) => {
    const id = Math.random().toString(36).slice(2)
    setItems((prev) => [...prev.slice(-2), { id, message, tone: opts?.tone ?? 'mint', detail: opts?.detail }])
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3800)
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-[200] flex w-[min(94vw,420px)] -translate-x-1/2 flex-col gap-2 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0">
          {items.map((t) => (
            <div
              key={t.id}
              role="status"
              className="anim-pop pointer-events-auto flex items-start gap-3 rounded-[13px] border border-line bg-card px-4 py-3 shadow-[var(--shadow-lg)]"
            >
              <span className="mt-0.5 shrink-0" style={{ color: TONE_VAR[t.tone] }}>
                {TOAST_ICON[t.tone] ?? TOAST_ICON.blue}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold leading-snug text-strong">{t.message}</p>
                {t.detail && <p className="mt-0.5 text-[12.5px] text-dim">{t.detail}</p>}
              </div>
              <button
                onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
                aria-label="Cerrar aviso"
                className="-mr-1 shrink-0 rounded p-1 text-dim transition-colors hover:text-strong"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return ctx.toast
}
