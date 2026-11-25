import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { CrmApiError, errorMessage } from '@/api/crmClient'
import { useToast } from '@/components/feedback/toastContext'
import { Button, Modal } from '@/components/ui'
import { cn } from '@/lib/cn'
import { addFieldBackTo, addRecordFieldTo, removeFieldFrom, removeRecordFieldFrom, updateRecordFieldOn, type ObjectKey, type RecordDetail } from './api'
import { FieldInput, FieldLabel, Select, inputClass, probeField } from './fields/FieldInput'
import { FieldValue } from './fields/FieldValue'
import { RECORD_FIELD_TYPES, type DataType, type DraftRecordField, type FieldDef, type RecordField } from './fields/types'
import { isEmptyValue, toApiValue, toFormValue } from './fields/validate'
import { valueError } from './recordFieldDrafts'

/** One-off fields are plain types (text, number, date…), so they never need option lists. */
const NO_PICKLISTS = {}
import { useObjectInfo, useRecordWrites, type RecordConfig } from './hooks'

/**
 * "Add a field for this person only" on the New form: a label, a type and a value per field. They are saved with
 * the record and never become fields of other records.
 */
export function RecordFieldsDraft({ object, drafts, setDrafts, errors }: {
  object: ObjectKey
  drafts: DraftRecordField[]
  setDrafts: (d: DraftRecordField[]) => void
  errors: Record<string, string>
}) {
  const info = useObjectInfo(object)
  const singular = info.singular.toLowerCase()
  const update = (key: string, patch: Partial<DraftRecordField>) => setDrafts(drafts.map((d) => (d.key === key ? { ...d, ...patch } : d)))
  return (
    <div className="space-y-3">
      {drafts.length > 0 && (
        <div className="border-line animate-fade space-y-3 rounded-control border border-dashed p-3" role="group" aria-label={`Fields for this ${singular} only`}>
          <p className="text-muted m-0 text-xs">Fields for this {singular} only. Other {info.plural === 'Persons' ? 'people' : info.plural.toLowerCase()} won't get them.</p>
          {drafts.map((d, i) => (
            <div key={d.key} className="animate-fade-up grid items-start gap-2 sm:grid-cols-[1fr_9rem_1fr_auto]">
              <div>
                <FieldLabel htmlFor={`${d.key}-label`} required>Field label</FieldLabel>
                <input id={`${d.key}-label`} value={d.label} maxLength={80} placeholder="e.g. Assistant name"
                  onChange={(e) => update(d.key, { label: e.target.value })}
                  aria-invalid={!!errors[`${d.key}.label`]}
                  className={cn(inputClass, errors[`${d.key}.label`] && 'border-brand')} />
                {errors[`${d.key}.label`] && <span className="text-brand-dark mt-1 block text-xs">{errors[`${d.key}.label`]}</span>}
              </div>
              <div>
                <FieldLabel htmlFor={`${d.key}-type`}>Type</FieldLabel>
                <Select id={`${d.key}-type`} value={d.dataType} onChange={(e) => update(d.key, { dataType: e.target.value as DataType, value: '' })}>
                  {RECORD_FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
              </div>
              <FieldInput field={probeField(d.dataType, d.label.trim() || `Value ${i + 1}`, `${d.key}-value`)} value={d.value}
                onChange={(v) => update(d.key, { value: v })} error={errors[`${d.key}.value`]} picklists={NO_PICKLISTS} users={[]} />
              <button type="button" aria-label={`Remove ${d.label.trim() || 'this field'}`} onClick={() => setDrafts(drafts.filter((x) => x.key !== d.key))}
                className="text-muted hover:bg-canvas hover:text-brand mt-6 rounded-control p-2">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
      <Button size="small" variant="ghost" startIcon={<Plus size={15} />}
        onClick={() => setDrafts([...drafts, { key: crypto.randomUUID(), label: '', dataType: 'TEXT', value: '' }])}>
        Add a field for this {singular} only
      </Button>
    </div>
  )
}

/** "Fields for this person only" on the record page: values only this record has. Add, edit and remove them. */
export function RecordFieldsCard({ object, record, config, canEdit, index }: {
  object: ObjectKey
  record: RecordDetail
  config: RecordConfig
  canEdit: boolean
  index: number
}) {
  const info = useObjectInfo(object)
  const singular = info.singular.toLowerCase()
  const { settle } = useRecordWrites(object)
  const toast = useToast()
  const [editing, setEditing] = useState<RecordField | 'new' | null>(null)
  const [removing, setRemoving] = useState<RecordField | null>(null)
  const fields = record.recordFields ?? []
  if (!fields.length && !canEdit) return null

  return (
    <section className="border-line bg-surface shadow-card animate-fade-up overflow-hidden rounded-card border" style={{ '--stagger': index } as React.CSSProperties}
      aria-label={`Fields for this ${singular} only`}>
      <div className="bg-column border-line flex items-center justify-between gap-2 border-b px-4 py-[13px]">
        <h2 className="text-navy m-0 text-[15px] font-bold">Fields for this {singular} only <span className="text-subtle text-xs font-semibold">{fields.length}</span></h2>
        {canEdit && <Button size="small" startIcon={<Plus size={13} />} onClick={() => setEditing('new')}>Add field</Button>}
      </div>
      <div className="p-4">
        {fields.length === 0 ? (
          <p className="text-muted m-0 text-sm">Add a labelled value only this {singular} needs, e.g. an assistant's name. Other records won't get it.</p>
        ) : (
          <dl className="m-0 grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.id} className="group flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0">
                  <dt className="text-muted mb-1 text-xs">{f.label}</dt>
                  <dd className="text-ink m-0 text-sm font-semibold">
                    <FieldValue dataType={f.dataType} value={f.value} optionLabel={config.optionLabel} userName={config.userName} />
                  </dd>
                </div>
                {canEdit && (
                  <span className="flex gap-0.5 opacity-60 transition-opacity group-hover:opacity-100">
                    <button type="button" aria-label={`Edit ${f.label}`} onClick={() => setEditing(f)} className="text-muted hover:bg-canvas hover:text-ink rounded p-1"><Pencil size={14} /></button>
                    <button type="button" aria-label={`Remove ${f.label}`} onClick={() => setRemoving(f)} className="text-muted hover:bg-canvas hover:text-brand rounded p-1"><Trash2 size={14} /></button>
                  </span>
                )}
              </div>
            ))}
          </dl>
        )}
      </div>

      {editing && (
        <RecordFieldDialog singular={singular} field={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)}
          onSave={async (label, dataType, value) => {
            settle(editing === 'new'
              ? await addRecordFieldTo(object, record.id, { label, dataType, value })
              : await updateRecordFieldOn(object, record.id, editing.id, { label, value, version: editing.version }))
            toast.success(editing === 'new' ? `${label} added to this ${singular}` : 'Field saved')
            setEditing(null)
          }} />
      )}
      {removing && (
        <Modal open title={`Remove "${removing.label}"?`} onClose={() => setRemoving(null)} maxWidth={460}
          footer={<><Button onClick={() => setRemoving(null)}>Cancel</Button>
            <Button variant="primary" onClick={async () => {
              try {
                settle(await removeRecordFieldFrom(object, record.id, removing.id))
                toast.success(`${removing.label} removed`)
                setRemoving(null)
              } catch (e) {
                toast.error(errorMessage(e))
              }
            }}>Remove</Button></>}>
          <p className="m-0 p-[22px] text-sm">The field and its value disappear from this {singular}. The change is kept in the record's history.</p>
        </Modal>
      )}
    </section>
  )
}

function RecordFieldDialog({ singular, field, onClose, onSave }: {
  singular: string
  field?: RecordField
  onClose: () => void
  onSave: (label: string, dataType: DataType, value: unknown) => Promise<void>
}) {
  const [label, setLabel] = useState(field?.label ?? '')
  const [dataType, setDataType] = useState<DataType>(field?.dataType ?? 'TEXT')
  const [value, setValue] = useState<unknown>(toFormValue(field?.dataType ?? 'TEXT', field?.value))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const save = async () => {
    const errs: Record<string, string> = {}
    if (!label.trim()) errs.label = 'Enter a label.'
    const e = valueError(dataType, value)
    if (e) errs.value = e
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      await onSave(label.trim(), dataType, toApiValue(dataType, value))
    } catch (err) {
      setErrors(err instanceof CrmApiError && Object.keys(err.errors).length ? err.errors : { label: errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open title={field ? `Edit "${field.label}"` : `Add a field for this ${singular} only`} onClose={onClose} maxWidth={520}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save'}</Button></>}>
      <form className="space-y-4 p-[22px]" onSubmit={(e) => { e.preventDefault(); void save() }}>
        <div>
          <FieldLabel htmlFor="rf-label" required>Field label</FieldLabel>
          <input id="rf-label" value={label} maxLength={80} placeholder="e.g. Assistant name" onChange={(e) => setLabel(e.target.value)}
            aria-invalid={!!errors.label} className={cn(inputClass, errors.label && 'border-brand')} />
          {errors.label && <span className="text-brand-dark mt-1 block text-xs">{errors.label}</span>}
        </div>
        <div>
          <FieldLabel htmlFor="rf-type">Type</FieldLabel>
          <Select id="rf-type" value={dataType} disabled={!!field} onChange={(e) => { setDataType(e.target.value as DataType); setValue('') }}>
            {RECORD_FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
          {field && <span className="text-subtle mt-1 block text-xs">The type is fixed once the field exists.</span>}
        </div>
        <FieldInput field={probeField(dataType, 'Value', 'rf-value')} value={value} onChange={setValue} error={errors.value} picklists={NO_PICKLISTS} users={[]} />
        {isEmptyValue(value) && !errors.value && <p className="text-subtle m-0 text-xs">Only this {singular} gets this field.</p>}
      </form>
    </Modal>
  )
}

/** Shared fields removed from this record only, with a way to add each back (it comes back empty). */
export function RemovedFieldsCard({ object, record, config, canEdit }: {
  object: ObjectKey
  record: RecordDetail
  config: RecordConfig
  canEdit: boolean
}) {
  const info = useObjectInfo(object)
  const { settle } = useRecordWrites(object)
  const toast = useToast()
  const [busy, setBusy] = useState<string | null>(null)
  const removed = config.fields.filter((f) => record.hiddenFields.includes(f.apiName))
  if (!removed.length) return null
  return (
    <section className="border-line bg-surface-alt animate-fade-up rounded-card border border-dashed p-4" aria-label={`Removed from this ${info.singular.toLowerCase()}`}>
      <h2 className="text-muted m-0 mb-2 text-xs font-bold tracking-[0.4px] uppercase">Removed from this {info.singular.toLowerCase()} ({removed.length})</h2>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {removed.map((f) => (
          <li key={f.apiName} className="border-line bg-surface flex items-center gap-1.5 rounded-full border py-1 pr-1 pl-3 text-[13px]">
            {f.label}
            {canEdit && (
              <button type="button" aria-label={`Add ${f.label} back`} disabled={busy === f.apiName}
                onClick={async () => {
                  setBusy(f.apiName)
                  try {
                    settle(await addFieldBackTo(object, record.id, f.apiName))
                    toast.success(`${f.label} added back`)
                  } catch (e) {
                    toast.error(errorMessage(e))
                  } finally {
                    setBusy(null)
                  }
                }}
                className="text-brand hover:bg-brand-tint inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold disabled:opacity-50">
                <RotateCcw size={12} /> Add back
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Confirms removing a shared field from one record: its value there is deleted, other records keep the field. */
export function RemoveFieldDialog({ object, record, field, onClose }: {
  object: ObjectKey
  record: RecordDetail
  field: FieldDef
  onClose: () => void
}) {
  const info = useObjectInfo(object)
  const { settle } = useRecordWrites(object)
  const toast = useToast()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const hasValue = !isEmptyValue(record.values[field.apiName])
  const singular = info.singular.toLowerCase()
  return (
    <Modal open title={`Remove "${field.label}" from this ${singular}?`} onClose={onClose} maxWidth={480}
      footer={<><Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" disabled={busy} onClick={async () => {
          setBusy(true)
          try {
            settle(await removeFieldFrom(object, record.id, field.apiName))
            toast.success(`${field.label} removed from ${record.title}`)
            onClose()
          } catch (e) {
            setError(e instanceof CrmApiError && Object.keys(e.errors).length ? Object.values(e.errors)[0]! : errorMessage(e, 'Removing failed.'))
          } finally {
            setBusy(false)
          }
        }}>Remove</Button></>}>
      <div className="space-y-2 p-[22px] text-sm">
        {error && <p role="alert" className="bg-brand-soft text-brand-dark m-0 rounded-control px-3 py-2">{error}</p>}
        <p className="m-0">
          {hasValue
            ? `The ${field.label} value on ${record.title} is deleted and the field disappears from this record.`
            : `${field.label} disappears from ${record.title}.`}{' '}
          Other records keep the field. You can add it back from &ldquo;Removed from this {singular}&rdquo;.
        </p>
      </div>
    </Modal>
  )
}
