import { Plus, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CrmApiError } from '@/api/crmClient'
import { Button, Modal } from '@/components/ui'
import { cn } from '@/lib/cn'
import { createField, updateField, type FieldInput as FieldPayload, type ObjectKey } from '../api'
import { FieldLabel, Select, inputClass } from '../fields/FieldInput'
import { SHARED_FIELD_TYPES, hasOptions, isComputed, isList, type DataType, type DisplayCondition, type FieldDef } from '../fields/types'
import { isNumeric, isTextType } from '../fields/validate'
import { useObjectInfo, type RecordConfig } from '../hooks'

/**
 * Add or edit a field of a record type. The type and api name are fixed after creation, so stored values stay
 * valid. Display conditions say when the field shows and when it is required.
 */
export function FieldEditorDialog({ object, field, config, sections, defaultSection, onClose, onSaved }: {
  object: ObjectKey
  field?: FieldDef
  config: RecordConfig
  sections: string[]
  /** The section a new field starts in, e.g. the one whose Add field was clicked. */
  defaultSection?: string
  onClose: () => void
  onSaved: () => void
}) {
  const info = useObjectInfo(object)
  const editing = !!field
  const [label, setLabel] = useState(field?.label ?? '')
  const [dataType, setDataType] = useState<DataType>(field?.dataType ?? 'TEXT')
  const [section, setSection] = useState(field?.section ?? defaultSection ?? sections[0] ?? 'Details')
  const [newSection, setNewSection] = useState('')
  const [help, setHelp] = useState(field?.help ?? '')
  const [mandatory, setMandatory] = useState(field?.mandatory ?? false)
  const [showOnCreate, setShowOnCreate] = useState(field?.showOnCreate ?? true)
  const [showOnDetail, setShowOnDetail] = useState(field?.showOnDetail ?? true)
  const [showInList, setShowInList] = useState(field?.showInList ?? false)
  const [searchable, setSearchable] = useState(field?.searchable ?? true)
  const [width, setWidth] = useState<'HALF' | 'FULL'>(field?.width ?? 'HALF')
  const [arm, setArm] = useState<'CREDIT' | 'CAPITAL' | 'BOTH'>(field?.arm ?? 'BOTH')
  const [format, setFormat] = useState<'' | 'ABN' | 'ACN'>(field?.validation?.format ?? '')
  const [min, setMin] = useState(field?.validation?.min?.toString() ?? '')
  const [max, setMax] = useState(field?.validation?.max?.toString() ?? '')
  const [options, setOptions] = useState('')
  const [visibleWhen, setVisibleWhen] = useState<DisplayCondition[]>(field?.displayRules?.visibleWhen ?? [])
  const [requiredWhen, setRequiredWhen] = useState<DisplayCondition[]>(field?.displayRules?.requiredWhen ?? [])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const computed = !!field && isComputed(field)
  const num = (s: string) => (s.trim() === '' ? undefined : Number(s))

  const save = async () => {
    const errs: Record<string, string> = {}
    if (!label.trim()) errs.label = 'Enter a field label.'
    if (!editing && hasOptions(dataType) && !options.trim()) errs.options = isList(dataType) ? 'Add at least one label.' : 'Add at least one option.'
    if ([...visibleWhen, ...requiredWhen].some((c) => !c.field || (!c.operator.startsWith('IS_') && (c.value === undefined || c.value === '' || (Array.isArray(c.value) && !c.value.length))))) {
      errs.displayRules = 'Give every condition a field and a value, or remove it.'
    }
    setErrors(errs)
    if (Object.keys(errs).length) return
    const payload: FieldPayload = {
      label: label.trim(),
      help: help.trim() || null,
      mandatory,
      expected: field?.expected ?? false,
      sensitive: field?.sensitive ?? false,
      showInList,
      showOnCreate,
      showOnDetail,
      searchable,
      filterable: field?.filterable ?? true,
      sortable: field?.sortable ?? dataType !== 'MULTI_PICKLIST',
      width,
      arm,
      section: (section === '__new' ? newSection.trim() : section) || 'Details',
      displayRules: { visibleWhen, requiredWhen },
      maxLength: field?.maxLength ?? null,
      decimalPlaces: field?.decimalPlaces ?? (isNumeric(dataType) ? 2 : null),
      validation: isNumeric(dataType) ? { min: num(min), max: num(max) }
        : isTextType(dataType) ? { ...(field?.validation ?? {}), format: dataType === 'TEXT' && format ? format : undefined } : {},
    }
    setSaving(true)
    try {
      if (editing) await updateField(field.id, field.version, payload)
      else await createField(object, dataType, payload, hasOptions(dataType) ? options.split('\n').map((o) => o.trim()).filter(Boolean) : undefined)
      onSaved()
      onClose()
    } catch (e) {
      if (e instanceof CrmApiError) setErrors({ ...e.errors, _form: Object.keys(e.errors).length ? '' : e.message })
    } finally {
      setSaving(false)
    }
  }

  const check = (lbl: string, value: boolean, set: (v: boolean) => void) => (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" checked={value} onChange={(e) => set(e.target.checked)} className="size-4 accent-[color:var(--pi-brand)]" />
      {lbl}
    </label>
  )

  return (
    <Modal open title={editing ? `Edit field: ${field.label}` : `Add a field for every ${info.singular}`} onClose={onClose} maxWidth={760}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save field'}</Button></>}>
      <div className="max-h-[70vh] space-y-4 overflow-y-auto p-[22px]">
        {(errors._form || Object.entries(errors).filter(([k]) => !['label', 'options', 'displayRules', '_form'].includes(k)).length > 0) && (
          <p role="alert" className="bg-brand-soft text-brand-dark animate-fade m-0 rounded-control px-3 py-2 text-sm">
            {errors._form || Object.entries(errors).filter(([k]) => !['label', 'options', 'displayRules', '_form'].includes(k)).map(([, v]) => v).join(' ')}
          </p>
        )}
        {computed && (
          <p className="bg-canvas text-muted m-0 rounded-control px-3 py-2 text-sm">
            The CRM fills this field in ({field.formula?.fn?.toLowerCase().replace('_', ' ')}). Users can't type into it.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel required>Field label</FieldLabel>
            <input className={cn(inputClass, errors.label && 'border-brand')} value={label} onChange={(e) => setLabel(e.target.value)} />
            {errors.label && <span className="text-brand-dark mt-1 block text-xs">{errors.label}</span>}
          </div>
          <div>
            <FieldLabel required>Field type</FieldLabel>
            <Select value={dataType} disabled={editing} onChange={(e) => setDataType(e.target.value as DataType)}>
              {(editing ? [{ value: field.dataType, label: SHARED_FIELD_TYPES.find((t) => t.value === field.dataType)?.label ?? field.dataType }] : SHARED_FIELD_TYPES)
                .map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </div>
          <div>
            <FieldLabel required>Section</FieldLabel>
            <Select value={section} onChange={(e) => setSection(e.target.value)}>
              {sections.map((s) => <option key={s} value={s}>{s}</option>)}
              <option value="__new">+ New section…</option>
            </Select>
            {section === '__new' && <input aria-label="New section name" className={cn(inputClass, 'animate-fade-up mt-2')} placeholder="Section name" value={newSection} onChange={(e) => setNewSection(e.target.value)} />}
          </div>
          <div>
            <FieldLabel>Business arm</FieldLabel>
            <Select value={arm} onChange={(e) => setArm(e.target.value as typeof arm)}>
              <option value="BOTH">Both</option>
              <option value="CREDIT">Credit</option>
              <option value="CAPITAL">Capital</option>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Help text</FieldLabel>
            <input className={inputClass} value={help} onChange={(e) => setHelp(e.target.value)} />
          </div>
          {!editing && hasOptions(dataType) && (
            <div className="animate-fade-up sm:col-span-2">
              <FieldLabel required>{isList(dataType) ? 'Labels, one per line (e.g. Mobile, Business)' : 'Options, one per line'}</FieldLabel>
              <textarea rows={4} className={cn(inputClass, 'h-auto py-2', errors.options && 'border-brand')} value={options} onChange={(e) => setOptions(e.target.value)} />
              {errors.options && <span className="text-brand-dark mt-1 block text-xs">{errors.options}</span>}
            </div>
          )}
          {editing && hasOptions(dataType) && <p className="text-muted m-0 text-xs sm:col-span-2">Options are managed with the option lists.</p>}
          {dataType === 'TEXT' && (
            <div>
              <FieldLabel>Format check</FieldLabel>
              <Select value={format} onChange={(e) => setFormat(e.target.value as typeof format)}>
                <option value="">Any text</option>
                <option value="ABN">ABN (11 digits, ATO check)</option>
                <option value="ACN">ACN (9 digits, ASIC check)</option>
              </Select>
            </div>
          )}
          {isNumeric(dataType) && (
            <>
              <div><FieldLabel>Minimum</FieldLabel><input type="number" className={inputClass} value={min} onChange={(e) => setMin(e.target.value)} /></div>
              <div><FieldLabel>Maximum</FieldLabel><input type="number" className={inputClass} value={max} onChange={(e) => setMax(e.target.value)} /></div>
            </>
          )}
          <div>
            <FieldLabel>Width on the form</FieldLabel>
            <Select value={width} onChange={(e) => setWidth(e.target.value as 'HALF' | 'FULL')}>
              <option value="HALF">Half (one column)</option>
              <option value="FULL">Full (both columns)</option>
            </Select>
          </div>
        </div>
        {!computed && (
          <div className="border-line space-y-4 rounded-card border p-4">
            <Conditions title="Show only when" help="Leave empty to always show the field." self={field?.apiName} config={config} value={visibleWhen} onChange={setVisibleWhen} />
            <Conditions title="Required when" help="Leave empty unless the field is required only in some cases." self={field?.apiName} config={config} value={requiredWhen} onChange={setRequiredWhen} />
            {errors.displayRules && <p className="text-brand-dark m-0 text-xs">{errors.displayRules}</p>}
          </div>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          {check('Required', mandatory, setMandatory)}
          {check(`Show on the New ${info.singular.toLowerCase()} form`, showOnCreate, setShowOnCreate)}
          {check('Show on the record page', showOnDetail, setShowOnDetail)}
          {check('Show as a list column', showInList, setShowInList)}
          {check('Include in quick search', searchable, setSearchable)}
        </div>
      </div>
    </Modal>
  )
}

type Op = DisplayCondition['operator']
const OPS: { value: Op; label: string; needsValue: boolean }[] = [
  { value: 'EQUALS', label: 'is', needsValue: true },
  { value: 'NOT_EQUALS', label: 'is not', needsValue: true },
  { value: 'CONTAINS_ANY', label: 'is any of', needsValue: true },
  { value: 'IS_NOT_EMPTY', label: 'has a value', needsValue: false },
  { value: 'IS_EMPTY', label: 'is empty', needsValue: false },
  { value: 'IS_TRUE', label: 'is ticked', needsValue: false },
]

/** Conditions for one rule: every row must hold. Persons can also use the type of a linked Entity. */
function Conditions({ title, help, value, onChange, self, config }: {
  title: string
  help: string
  value: DisplayCondition[]
  onChange: (v: DisplayCondition[]) => void
  self?: string
  config: RecordConfig
}) {
  const candidates = useMemo(() => config.fields.filter((f) => f.apiName !== self && !f.formula), [config.fields, self])
  const fieldOf = (api: string) => (api === '$linkedEntityType' ? { picklist: 'ENTITY_TYPE' } : candidates.find((f) => f.apiName === api))
  const update = (i: number, patch: Partial<DisplayCondition>) => onChange(value.map((c, k) => (k === i ? { ...c, ...patch } : c)))
  return (
    <div className="space-y-2">
      <div>
        <p className="text-navy m-0 text-[13px] font-bold">{title}</p>
        <p className="text-subtle m-0 text-xs">{help}</p>
      </div>
      {value.map((c, i) => {
        const f = fieldOf(c.field)
        const opts = f?.picklist ? (config.picklists[f.picklist]?.values ?? []).filter((v) => v.active) : null
        const op = OPS.find((o) => o.value === c.operator) ?? OPS[0]
        const selected = Array.isArray(c.value) ? (c.value as string[]) : c.value === undefined || c.value === '' ? [] : [String(c.value)]
        return (
          <div key={i} className="border-line animate-fade-up flex flex-wrap items-start gap-2 rounded-control border p-2">
            <span className="text-subtle mt-2.5 w-9 text-xs">{i === 0 ? 'When' : 'and'}</span>
            <Select aria-label={`${title} ${i + 1} field`} value={c.field} className="w-48" onChange={(e) => update(i, { field: e.target.value, value: undefined })}>
              {config.object === 'person' && <option value="$linkedEntityType">Linked Entity type</option>}
              {candidates.map((x) => <option key={x.apiName} value={x.apiName}>{x.label}</option>)}
            </Select>
            <Select aria-label={`${title} ${i + 1} operator`} value={c.operator} className="w-36"
              onChange={(e) => { const next = e.target.value as Op; update(i, { operator: next, value: OPS.find((o) => o.value === next)?.needsValue ? (next === 'CONTAINS_ANY' ? selected : selected[0]) : undefined }) }}>
              {OPS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
            {op.needsValue && (opts ? (
              <div className="flex min-w-0 flex-1 flex-wrap gap-1 pt-1.5">
                {opts.map((o) => {
                  const on = selected.includes(o.code)
                  return (
                    <button type="button" key={o.code} aria-pressed={on}
                      onClick={() => { const next = on ? selected.filter((s) => s !== o.code) : c.operator === 'CONTAINS_ANY' ? [...selected, o.code] : [o.code]; update(i, { value: c.operator === 'CONTAINS_ANY' ? next : next[0] }) }}
                      className={cn('rounded-full border px-2 py-0.5 text-xs transition', on ? 'border-brand bg-brand-tint text-brand-dark' : 'border-line text-muted hover:text-text')}>
                      {o.label}
                    </button>
                  )
                })}
              </div>
            ) : (
              <input aria-label={`${title} ${i + 1} value`} className={cn(inputClass, 'min-w-0 flex-1')} value={selected.join(', ')}
                onChange={(e) => update(i, { value: c.operator === 'CONTAINS_ANY' ? e.target.value.split(',').map((s) => s.trim()).filter(Boolean) : e.target.value })} />
            ))}
            <button type="button" aria-label={`Remove condition ${i + 1}`} onClick={() => onChange(value.filter((_, k) => k !== i))}
              className="text-subtle hover:text-text mt-1.5 rounded p-1.5"><X size={16} /></button>
          </div>
        )
      })}
      {value.length < 5 && (
        <button type="button" onClick={() => onChange([...value, { field: candidates[0]?.apiName ?? '', operator: 'EQUALS' }])}
          className="text-brand inline-flex items-center gap-1 text-xs font-bold"><Plus size={14} /> Add condition</button>
      )}
    </div>
  )
}
