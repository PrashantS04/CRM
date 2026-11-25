import { Check, Plus, Star, X } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { formatAbn, formatAcn } from '@/lib/format'
import type { ServerPicklistValue, ServerUser } from '../api'
import { listItems } from './logic'
import type { DataType, FieldDef, ListItem } from './types'

/** The parts of a definition an input needs; one-off fields pass a probe built with {@link probeField}. */
export type InputField = Pick<
  FieldDef,
  'apiName' | 'label' | 'dataType' | 'picklist' | 'mandatory' | 'placeholder' | 'help' | 'decimalPlaces' | 'maxLength' | 'validation'
>

export const probeField = (dataType: DataType, label: string, key = 'value'): InputField => ({
  apiName: key,
  label,
  dataType,
  picklist: null,
  mandatory: true,
  placeholder: null,
  help: null,
  decimalPlaces: null,
  maxLength: null,
  validation: {},
})

/** The design's input: 40px high, 6px radius, red focus ring. */
export const inputClass =
  'h-10 w-full rounded-input border border-line-strong bg-surface px-[11px] text-sm text-text outline-none transition ' +
  'placeholder:text-subtle focus:border-brand focus:ring-[3px] focus:ring-brand-soft disabled:cursor-not-allowed disabled:bg-canvas disabled:text-muted'

const selectClass = cn(inputClass, 'cursor-pointer appearance-none bg-[length:16px] bg-[right_10px_center] bg-no-repeat pr-8')
const chevron = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%236f7e94' stroke-width='2'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E\")",
}

export function Select({ className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  // A width given by the caller replaces the default full width.
  const base = /(^|\s)w-/.test(className ?? '') ? selectClass.replace('w-full ', '') : selectClass
  return (
    <select className={cn(base, className)} style={chevron} {...rest}>
      {children}
    </select>
  )
}

/** Field label in the design's form style: 12px, bold, soft text; a red asterisk for required. */
export function FieldLabel({ htmlFor, required, help, children }: { htmlFor?: string; required?: boolean; help?: string | null; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-text-soft mb-1.5 flex items-center gap-1 text-xs font-bold" title={help ?? undefined}>
      {children}
      {required && <span className="text-brand" aria-hidden>*</span>}
    </label>
  )
}

/** The right input for a field's type. Values are form values (see toFormValue / toApiValue). */
export function FieldInput({
  field,
  value,
  onChange,
  error,
  disabled,
  hint,
  showLabel = true,
  required,
  options,
  picklists,
  users,
}: {
  field: InputField
  value: unknown
  onChange: (v: unknown) => void
  error?: string
  disabled?: boolean
  hint?: string
  showLabel?: boolean
  /** Overrides the definition's mandatory flag (a requiredWhen condition holds). */
  required?: boolean
  /** For a field that picks from the record's own phone or email list: that list's values. */
  options?: string[]
  picklists: Record<string, { values: ServerPicklistValue[] }>
  users: ServerUser[]
}) {
  const id = `fld-${field.apiName}-${useId()}`
  const cls = cn(inputClass, error && 'border-brand ring-[3px] ring-brand-soft')
  const t = field.dataType
  const isAcn = field.apiName.toLowerCase() === 'acn' || field.validation?.format === 'ACN'
  const isAbn = field.apiName.toLowerCase() === 'abn' || field.validation?.format === 'ABN'
  const defaultPlaceholder = isAcn ? 'e.g. 000 000 019' : isAbn ? 'e.g. 51 824 753 556' : undefined
  const placeholder = field.placeholder ?? defaultPlaceholder
  let control: ReactNode

  if (options) {
    const current = String(value ?? '')
    control = (
      <Select id={id} value={current} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={cls}>
        <option value="">{options.length ? '— Choose —' : `— Add ${t === 'PHONE' ? 'a phone' : 'an email'} first —`}</option>
        {current && !options.includes(current) && <option value={current}>{current} (no longer listed)</option>}
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </Select>
    )
  } else if (t === 'PHONE_LIST' || t === 'EMAIL_LIST') {
    control = (
      <ListEditor id={id} field={field} items={listItems(value)} onChange={onChange} disabled={disabled} invalid={!!error}
        labels={picklists[field.picklist ?? '']?.values ?? []} />
    )
  } else if (t === 'LONG_TEXT') {
    control = (
      <textarea id={id} rows={3} value={String(value ?? '')} placeholder={placeholder} disabled={disabled}
        onChange={(e) => onChange(e.target.value)} className={cn(cls, 'h-auto min-h-[84px] py-2 leading-relaxed')} />
    )
  } else if (t === 'CHECKBOX') {
    control = (
      <label className="flex h-10 cursor-pointer items-center gap-2.5 text-sm">
        <span className={cn('grid size-5 place-items-center rounded-[5px] border transition',
          value === true ? 'border-brand bg-brand text-white' : 'border-line-strong bg-surface')}>
          {value === true && <Check size={14} className="animate-pop" />}
        </span>
        <input id={id} type="checkbox" className="sr-only" checked={value === true} disabled={disabled}
          onChange={(e) => onChange(e.target.checked ? true : null)} />
        {field.label}
      </label>
    )
  } else if (t === 'BOOLEAN') {
    control = (
      <Select id={id} value={value === true ? 'true' : value === false ? 'false' : ''} disabled={disabled} className={cls}
        onChange={(e) => onChange(e.target.value === '' ? null : e.target.value === 'true')}>
        <option value="">— None —</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </Select>
    )
  } else if (t === 'PICKLIST' || t === 'USER') {
    const current = String(value ?? '')
    const opts = t === 'USER'
      ? users.map((u) => ({ code: u.id, label: u.name, active: true }))
      : (picklists[field.picklist ?? '']?.values ?? []).filter((v) => v.active || v.code === current)
    control = (
      <Select id={id} value={current} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={cls}>
        <option value="">— None —</option>
        {opts.map((o) => <option key={o.code} value={o.code}>{o.label}{!o.active ? ' (retired)' : ''}</option>)}
      </Select>
    )
  } else if (t === 'MULTI_PICKLIST') {
    const selected = Array.isArray(value) ? (value as string[]) : []
    const opts = (picklists[field.picklist ?? '']?.values ?? []).filter((v) => v.active || selected.includes(v.code))
    control = (
      <div id={id} role="group" aria-label={field.label} className="flex flex-wrap gap-1.5">
        {opts.map((o) => {
          const on = selected.includes(o.code)
          return (
            <button type="button" key={o.code} aria-pressed={on} disabled={disabled}
              onClick={() => onChange(on ? selected.filter((c) => c !== o.code) : [...selected, o.code])}
              className={cn('inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[13px] transition duration-150 active:scale-95 disabled:cursor-not-allowed',
                on ? 'border-brand bg-brand-tint text-brand-dark' : 'border-line bg-surface text-muted hover:border-line-strong hover:text-text')}>
              {on && <Check size={13} className="animate-pop" />}
              {o.label}
            </button>
          )
        })}
      </div>
    )
  } else {
    const type = t === 'DATE' ? 'date' : t === 'EMAIL' ? 'email' : t === 'PHONE' ? 'tel' : t === 'URL' ? 'url' : 'text'
    const numeric = t === 'NUMBER' || t === 'CURRENCY' || t === 'PERCENT'
    const maxLength = isAcn ? 11 : isAbn ? 14 : (field.maxLength ?? (t === 'TEXT' ? 255 : undefined))
    const handleTextChange = (raw: string) => {
      if (isAcn) {
        onChange(formatAcn(raw))
      } else if (isAbn) {
        onChange(formatAbn(raw))
      } else {
        onChange(raw)
      }
    }
    control = (
      <div className="relative">
        {t === 'CURRENCY' && <span className="text-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">$</span>}
        <input
          id={id}
          type={type}
          inputMode={isAcn || isAbn ? 'numeric' : numeric ? 'decimal' : undefined}
          maxLength={maxLength}
          value={String(value ?? '')}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => handleTextChange(e.target.value)}
          className={cn(cls, t === 'CURRENCY' && 'pl-7', t === 'PERCENT' && 'pr-8')}
        />
        {t === 'PERCENT' && <span className="text-muted pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">%</span>}
      </div>
    )
  }

  return (
    <div className="min-w-0">
      {showLabel && t !== 'CHECKBOX' && (
        <FieldLabel htmlFor={id} required={required ?? field.mandatory} help={field.help}>{field.label}</FieldLabel>
      )}
      {control}
      {error ? (
        <span role="alert" className="text-brand-dark animate-fade mt-1 block text-xs">{error}</span>
      ) : (
        (hint || field.help) && <span className="text-subtle mt-1 block text-xs">{hint ?? field.help}</span>
      )}
    </div>
  )
}

/**
 * Phones or emails: one row per item with its label, the value, and a star for the primary one. The first item is
 * primary until another is starred (the server applies the same rule).
 */
function ListEditor({ id, field, items, labels, onChange, disabled, invalid }: {
  id: string
  field: InputField
  items: ListItem[]
  labels: ServerPicklistValue[]
  onChange: (v: unknown) => void
  disabled?: boolean
  invalid: boolean
}) {
  const phone = field.dataType === 'PHONE_LIST'
  const firstLabel = labels.find((l) => l.active)?.code ?? ''
  const rows: ListItem[] = items.length ? items : [{ label: firstLabel, value: '', primary: true }]
  const set = (next: ListItem[]) => onChange(next)
  const update = (i: number, patch: Partial<ListItem>) => set(rows.map((r, k) => (k === i ? { ...r, ...patch } : r)))
  const makePrimary = (i: number) => set(rows.map((r, k) => ({ ...r, primary: k === i })))
  const remove = (i: number) => {
    const next = rows.filter((_, k) => k !== i)
    if (next.length && !next.some((r) => r.primary)) next[0] = { ...next[0], primary: true }
    set(next)
  }
  const add = () => {
    const used = new Set(rows.map((r) => r.label))
    const label = labels.find((l) => l.active && !used.has(l.code))?.code ?? firstLabel
    set([...rows, { label, value: '', primary: false }])
  }
  return (
    <div id={id} role="group" aria-label={field.label} className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="animate-fade-up flex items-center gap-2">
          <Select aria-label={`${field.label} ${i + 1} label`} value={r.label} disabled={disabled}
            onChange={(e) => update(i, { label: e.target.value })} className={cn('w-32 shrink-0 sm:w-36', invalid && 'border-brand')}>
            {labels.filter((l) => l.active || l.code === r.label).map((l) => (
              <option key={l.code} value={l.code}>{l.label}{!l.active ? ' (retired)' : ''}</option>
            ))}
          </Select>
          <input aria-label={`${field.label} ${i + 1}`} type={phone ? 'tel' : 'email'} value={r.value} disabled={disabled}
            placeholder={phone ? 'e.g. 0412 345 678' : 'name@example.com.au'}
            onChange={(e) => update(i, { value: e.target.value })}
            className={cn(inputClass, 'min-w-0 flex-1', invalid && 'border-brand')} />
          <button type="button" disabled={disabled} onClick={() => makePrimary(i)} aria-pressed={r.primary}
            aria-label={r.primary ? `${r.value || 'This item'} is primary` : `Make ${r.value || 'this item'} primary`}
            title={r.primary ? 'Primary' : 'Make primary'}
            className={cn('grid size-10 shrink-0 place-items-center rounded-input border transition active:scale-90',
              r.primary ? 'border-brand bg-brand-tint text-brand' : 'border-line text-subtle hover:text-text')}>
            <Star size={16} className={cn(r.primary && 'animate-pop fill-current')} />
          </button>
          <button type="button" disabled={disabled || (rows.length === 1 && !r.value)} onClick={() => remove(i)}
            aria-label={`Remove ${r.value || 'this row'}`} title="Remove"
            className="text-subtle hover:bg-canvas hover:text-text grid size-10 shrink-0 place-items-center rounded-input transition disabled:opacity-40">
            <X size={16} />
          </button>
        </div>
      ))}
      {!disabled && rows.length < 10 && (
        <button type="button" onClick={add} className="text-brand hover:text-brand-dark inline-flex items-center gap-1 text-[13px] font-bold">
          <Plus size={15} /> Add {phone ? 'phone' : 'email'}
        </button>
      )}
    </div>
  )
}
