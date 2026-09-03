import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { useId } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BRAND_CONFIG } from '@/config/brand'

const BASE_FIELD =
  'w-full rounded-[10px] border bg-card px-3.5 text-[14px] text-strong transition-colors ' +
  'placeholder:text-dim/70 focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/14 ' +
  'disabled:bg-muted disabled:text-dim'

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
  htmlFor,
}: {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
  htmlFor?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-[12.5px] font-semibold text-strong">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="flex items-center gap-1.5 text-[12px] font-medium text-danger">
          <AlertCircle size={13} aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12px] text-dim">{hint}</p>
      ) : null}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  icon?: ReactNode
  suffix?: ReactNode
  wrapClassName?: string
}

export function Input({
  label, hint, error, required, icon, suffix, className, wrapClassName, ...rest
}: InputProps) {
  const id = useId()
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={id} className={wrapClassName}>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim">
            {icon}
          </span>
        )}
        <input
          id={id}
          aria-invalid={Boolean(error)}
          className={cn(
            BASE_FIELD,
            'h-11',
            Boolean(icon) && 'pl-10',
            Boolean(suffix) && 'pr-14',
            error ? 'border-danger' : 'border-line-strong',
            className,
          )}
          {...rest}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[12.5px] font-semibold text-dim">
            {suffix}
          </span>
        )}
      </div>
    </Field>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
  options: Array<{ value: string; label: string; disabled?: boolean }>
  placeholder?: string
  wrapClassName?: string
}

export function Select({
  label, hint, error, required, options, placeholder, className, wrapClassName, ...rest
}: SelectProps) {
  const id = useId()
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={id} className={wrapClassName}>
      <select
        id={id}
        aria-invalid={Boolean(error)}
        className={cn(
          BASE_FIELD,
          'h-11 cursor-pointer appearance-none pr-9',
          error ? 'border-danger' : 'border-line-strong',
          className,
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7793' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
        }}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
  wrapClassName?: string
}

export function Textarea({ label, hint, error, required, className, wrapClassName, ...rest }: TextareaProps) {
  const id = useId()
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={id} className={wrapClassName}>
      <textarea
        id={id}
        rows={3}
        aria-invalid={Boolean(error)}
        className={cn(
          BASE_FIELD,
          'resize-y py-2.5 leading-relaxed',
          error ? 'border-danger' : 'border-line-strong',
          className,
        )}
        {...rest}
      />
    </Field>
  )
}

/** Entrada de guaraníes: se escribe sin puntos y se muestra formateado */
export function MoneyInput({
  label, hint, error, value, onValueChange, required, placeholder, className, disabled,
}: {
  label?: string
  hint?: string
  error?: string
  value: number
  onValueChange: (n: number) => void
  required?: boolean
  placeholder?: string
  className?: string
  disabled?: boolean
}) {
  const id = useId()
  const display = value ? value.toLocaleString(BRAND_CONFIG.currency.locale) : ''
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={id} className={className}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-bold text-dim">
          {BRAND_CONFIG.currency.symbol}
        </span>
        <input
          id={id}
          inputMode="numeric"
          disabled={disabled}
          value={display}
          placeholder={placeholder ?? '0'}
          aria-invalid={Boolean(error)}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '')
            onValueChange(digits ? Number(digits) : 0)
          }}
          className={cn(
            BASE_FIELD,
            'h-11 pl-9 font-semibold tabular-nums',
            error ? 'border-danger' : 'border-line-strong',
          )}
        />
      </div>
    </Field>
  )
}

export function Checkbox({
  label, checked, onChange, description, disabled,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  description?: string
  disabled?: boolean
}) {
  const id = useId()
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-start gap-2.5 rounded-[10px] p-1 transition-colors',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-[17px] shrink-0 cursor-pointer accent-[var(--brand-primary)]"
      />
      <span className="min-w-0">
        <span className="block text-[13.5px] font-medium leading-snug text-strong">{label}</span>
        {description && <span className="mt-0.5 block text-[12px] text-dim">{description}</span>}
      </span>
    </label>
  )
}

export function Switch({
  label, checked, onChange, description,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  description?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-strong">{label}</p>
        {description && <p className="mt-0.5 text-[12.5px] text-dim">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
          checked ? 'bg-brand' : 'bg-line-strong',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  )
}

/** Grupo de opciones tipo segmented control */
export function SegmentedControl<T extends string>({
  value, onChange, options, className, size = 'md',
}: {
  value: T
  onChange: (v: T) => void
  options: Array<{ value: T; label: ReactNode }>
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <div
      className={cn(
        'inline-flex rounded-[11px] border border-line bg-muted p-1',
        className,
      )}
      role="tablist"
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-[8px] font-semibold transition-all duration-150',
              size === 'sm' ? 'px-2.5 py-1 text-[12px]' : 'px-3.5 py-1.5 text-[13px]',
              active
                ? 'bg-card text-strong shadow-[var(--shadow-xs)]'
                : 'text-dim hover:text-strong',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
