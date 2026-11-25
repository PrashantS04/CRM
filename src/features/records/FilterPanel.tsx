import { Plus, SlidersHorizontal, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { ObjectKey } from './api'
import { FieldLabel, Select, inputClass } from './fields/FieldInput'
import { checkLogic, conditionReady } from './fields/filterLogic'
import { NO_VALUE_OPERATORS, RELATIVE_DATES, type Condition, type FieldDef, type Operator } from './fields/types'
import { isNumeric } from './fields/validate'
import { COMMA_OPERATORS, emptyValue, filterableFields, operatorLabel, picksOptions, toEditable, toSent, type Filters } from './filters'
import { useObjectInfo, type RecordConfig } from './hooks'

/**
 * The filter drawer: numbered filters on any filterable field, with the operators the server allows for its type
 * (relative dates included), optional filter logic checked as you type, and Cancel / Apply. The list changes only
 * on Apply. Rendered only while open, so each opening starts from the applied filters.
 */
export function FilterPanel({ object, config, value, onApply, onClose }: {
  object: ObjectKey
  config: RecordConfig
  value: Filters
  onApply: (v: Filters) => void
  onClose: () => void
}) {
  const info = useObjectInfo(object)
  const fields = filterableFields(config)
  const [conditions, setConditions] = useState<Condition[]>(value.conditions.map((c) => toEditable(c, config.field(c.field))))
  const [logic, setLogic] = useState(value.logic)
  const [showLogic, setShowLogic] = useState(!!value.logic)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const logicError = showLogic ? checkLogic(logic, conditions.length) : null
  const incomplete = conditions.findIndex((c) => !conditionReady(c))

  const update = (i: number, c: Condition) => setConditions((cs) => cs.map((x, j) => (j === i ? c : x)))
  const remove = (i: number) => {
    setConditions((cs) => cs.filter((_, j) => j !== i))
    // Numbers after the removed filter shift down, so the old logic no longer fits: start it again.
    if (logic.trim()) setLogic('')
  }
  const add = () => {
    const f = fields[0]
    if (!f) return
    setConditions((cs) => [...cs, { field: f.apiName, operator: f.operators[0], value: emptyValue(f, f.operators[0]) }])
    if (logic.trim()) setLogic(`${logic.trim()} AND ${conditions.length + 1}`)
  }
  const apply = () => {
    setTouched(true)
    if (logicError || incomplete !== -1) return
    onApply({ conditions: conditions.map((c) => toSent(c, config.field(c.field))), logic: showLogic ? logic.trim().toUpperCase() : '' })
  }

  return (
    <div className="fixed inset-0 z-[1300] flex justify-end">
      <div role="presentation" className="animate-fade absolute inset-0 bg-[rgba(16,24,40,0.28)]" onMouseDown={onClose} />
      <aside role="dialog" aria-modal="true" aria-label="Filters"
        className="border-line bg-surface shadow-dialog animate-slide-in relative flex h-full w-full max-w-[440px] flex-col border-l">
        <div className="border-line flex items-center justify-between border-b px-[22px] py-[18px]">
          <div className="flex items-center gap-2.5">
            <span className="bg-brand-tint text-brand grid size-8 place-items-center rounded-control"><SlidersHorizontal size={16} /></span>
            <div>
              <h2 className="text-ink m-0 text-base font-bold">Filter {info.plural === 'Persons' ? 'people' : info.plural.toLowerCase()}</h2>
              <p className="text-muted m-0 text-xs">Filters apply on top of the view and search.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close filters" className="text-muted hover:bg-canvas hover:text-ink rounded-control p-1.5 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-[22px] py-[18px]">
          {conditions.length === 0 && (
            <div className="border-line text-muted animate-fade rounded-card border border-dashed px-4 py-8 text-center text-[13px]">
              No filters yet. Every {info.singular.toLowerCase()} in the view is shown.
            </div>
          )}
          <ol className="m-0 list-none space-y-3 p-0">
            {conditions.map((c, i) => (
              <ConditionCard key={i} n={i + 1} condition={c} fields={fields} config={config} invalid={touched && !conditionReady(c)}
                onChange={(x) => update(i, x)} onRemove={() => remove(i)} />
            ))}
          </ol>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="small" startIcon={<Plus size={15} />} onClick={add} disabled={!fields.length}>Add filter</Button>
            {conditions.length > 0 && (
              <Button variant="link" onClick={() => { setConditions([]); setLogic(''); setShowLogic(false) }}>Remove all</Button>
            )}
          </div>

          {conditions.length > 1 && (
            showLogic ? (
              <div className="animate-fade">
                <FieldLabel htmlFor="filter-logic" help="Combine filters by number, e.g. 1 AND (2 OR 3). Use AND, OR, NOT and parentheses.">Filter logic</FieldLabel>
                <input id="filter-logic" value={logic} onChange={(e) => setLogic(e.target.value)}
                  placeholder={conditions.map((_, i) => i + 1).join(' AND ')}
                  className={cn(inputClass, 'font-mono', logicError && 'border-brand')} />
                {logicError
                  ? <span role="alert" className="text-brand-dark mt-1 block text-xs">{logicError}</span>
                  : <span className="text-subtle mt-1 block text-xs">Blank means every filter must match (AND).</span>}
                <button type="button" className="text-brand mt-1 text-xs font-bold" onClick={() => { setShowLogic(false); setLogic('') }}>
                  Remove filter logic
                </button>
              </div>
            ) : (
              <button type="button" className="text-brand hover:text-brand-dark text-[13px] font-bold"
                onClick={() => { setShowLogic(true); setLogic(conditions.map((_, i) => i + 1).join(' AND ')) }}>
                Add filter logic
              </button>
            )
          )}
        </div>

        <div className="border-line flex items-center justify-end gap-2 border-t px-[22px] py-[15px]">
          {touched && incomplete !== -1 && <span className="text-brand-dark mr-auto text-xs">Filter {incomplete + 1} needs a value.</span>}
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!!logicError} onClick={apply}>Apply filters</Button>
        </div>
      </aside>
    </div>
  )
}

function ConditionCard({ n, condition, fields, config, invalid, onChange, onRemove }: {
  n: number
  condition: Condition
  fields: FieldDef[]
  config: RecordConfig
  invalid: boolean
  onChange: (c: Condition) => void
  onRemove: () => void
}) {
  const f = fields.find((x) => x.apiName === condition.field)
  const op = condition.operator
  return (
    <li className={cn('bg-surface animate-pop rounded-card border p-3 transition-colors', invalid ? 'border-brand' : 'border-line')}>
      <div className="mb-2 flex items-center justify-between">
        <span className="bg-brand-tint text-brand-dark rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums">Filter {n}</span>
        <button type="button" aria-label={`Remove filter ${n}`} onClick={onRemove}
          className="text-muted hover:bg-brand-tint hover:text-brand rounded-input p-1 transition-colors">
          <Trash2 size={15} />
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Select aria-label={`Filter ${n} field`} value={condition.field}
          onChange={(e) => {
            const nf = fields.find((x) => x.apiName === e.target.value)!
            onChange({ field: nf.apiName, operator: nf.operators[0], value: emptyValue(nf, nf.operators[0]) })
          }}>
          {!f && <option value={condition.field}>{condition.field} (no longer available)</option>}
          {fields.map((x) => <option key={x.apiName} value={x.apiName}>{x.label}</option>)}
        </Select>
        {f && (
          <Select aria-label={`Filter ${n} operator`} value={op}
            onChange={(e) => {
              const next = e.target.value as Operator
              const keep = picksOptions(f, next) === picksOptions(f, op) && (next === 'BETWEEN') === (op === 'BETWEEN')
              onChange({ ...condition, operator: next, value: keep ? condition.value : emptyValue(f, next) })
            }}>
            {f.operators.map((o) => <option key={o} value={o}>{operatorLabel(f, o)}</option>)}
          </Select>
        )}
      </div>
      {f && !NO_VALUE_OPERATORS.includes(op) && (
        <div className="mt-2"><ValueInput n={n} field={f} condition={condition} config={config} onChange={onChange} /></div>
      )}
    </li>
  )
}

function ValueInput({ n, field: f, condition, config, onChange }: {
  n: number
  field: FieldDef
  condition: Condition
  config: RecordConfig
  onChange: (c: Condition) => void
}) {
  const op = condition.operator
  const set = (value: unknown) => onChange({ ...condition, value })

  if (picksOptions(f, op)) {
    const options = f.dataType === 'USER'
      ? config.users.map((u) => ({ code: u.id, label: u.name, active: true }))
      : (config.picklists[f.picklist ?? '']?.values ?? [])
    const selected = Array.isArray(condition.value) ? (condition.value as string[]) : condition.value ? [String(condition.value)] : []
    return (
      <div role="group" aria-label={`Filter ${n} values`} className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
        {options.filter((o) => o.active || selected.includes(o.code)).map((o) => {
          const on = selected.includes(o.code)
          return (
            <button type="button" key={o.code} aria-pressed={on} onClick={() => set(on ? selected.filter((c) => c !== o.code) : [...selected, o.code])}
              className={cn('rounded-full border px-2.5 py-1 text-xs font-semibold transition-all duration-150 active:scale-95',
                on ? 'border-brand bg-brand-tint text-brand-dark' : 'border-line text-muted hover:border-line-strong hover:text-ink')}>
              {o.label}
            </button>
          )
        })}
      </div>
    )
  }
  if (op === 'BETWEEN') {
    const [a, b] = (Array.isArray(condition.value) ? condition.value : ['', '']) as unknown[]
    return (
      <div className="flex items-center gap-2">
        {f.dataType === 'DATE' ? (
          <>
            <DateValue n={n} value={String(a ?? '')} onChange={(v) => set([v, b])} />
            <span className="text-muted text-xs">and</span>
            <DateValue n={n} value={String(b ?? '')} onChange={(v) => set([a, v])} />
          </>
        ) : (
          <>
            <input aria-label={`Filter ${n} from`} inputMode="decimal" className={inputClass} value={String(a ?? '')} onChange={(e) => set([e.target.value, b])} />
            <span className="text-muted text-xs">and</span>
            <input aria-label={`Filter ${n} to`} inputMode="decimal" className={inputClass} value={String(b ?? '')} onChange={(e) => set([a, e.target.value])} />
          </>
        )}
      </div>
    )
  }
  if (f.dataType === 'DATE') return <DateValue n={n} value={String(condition.value ?? '')} onChange={set} />
  return (
    <input aria-label={`Filter ${n} value`} inputMode={isNumeric(f.dataType) ? 'decimal' : undefined} className={inputClass}
      value={String(condition.value ?? '')} onChange={(e) => set(e.target.value)}
      placeholder={COMMA_OPERATORS.includes(op) ? 'One value, or several separated by commas' : undefined} />
  )
}

/** A specific date, or a relative one ("This month", "Last N days") that moves with today. */
function DateValue({ n, value, onChange }: { n: number; value: string; onChange: (v: string) => void }) {
  const nDays = /^(LAST|NEXT)_N_DAYS:(\d*)$/.exec(value)
  const mode = /^\d{4}-\d{2}-\d{2}$/.test(value) || value === '' ? 'DATE' : nDays ? `${nDays[1]}_N_DAYS` : value
  return (
    <div className="flex min-w-0 flex-1 gap-2">
      <Select aria-label={`Filter ${n} date kind`} className="w-40 shrink-0" value={mode}
        onChange={(e) => {
          const m = e.target.value
          onChange(m === 'DATE' ? '' : m.endsWith('_N_DAYS') ? `${m}:30` : m)
        }}>
        <option value="DATE">Specific date</option>
        {RELATIVE_DATES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
      </Select>
      {mode === 'DATE' && (
        <input aria-label={`Filter ${n} date`} type="date" className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
      {nDays && (
        <input aria-label={`Filter ${n} number of days`} type="number" min={1} max={3650} className={cn(inputClass, 'w-24')}
          value={nDays[2]} onChange={(e) => onChange(`${nDays[1]}_N_DAYS:${e.target.value}`)} />
      )}
    </div>
  )
}
