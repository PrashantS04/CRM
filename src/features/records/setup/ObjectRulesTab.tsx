import { useState } from 'react'
import { errorMessage } from '@/api/crmClient'
import { useToast } from '@/components/feedback/toastContext'
import { Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import { updateRules, type ObjectKey, type ObjectRules } from '../api'
import { FieldLabel, Select } from '../fields/FieldInput'
import type { FieldDef } from '../fields/types'
import { useInvalidateConfig, useObjectInfo, useRecordConfig, type RecordConfig } from '../hooks'

/**
 * Setup → Person rules / Entity rules: which fields make the record name, the picker subtitle, the duplicate
 * check, the unique fields (hard gate G1), the owner, the type and the review queue.
 */
export function ObjectRulesTab({ object }: { object: ObjectKey }) {
  const info = useObjectInfo(object)
  const config = useRecordConfig(object)
  return (
    <section className="border-line bg-surface shadow-card animate-fade-up min-w-0 rounded-card border">
      <div className="border-line border-b px-5 py-4">
        <h2 className="text-ink m-0 text-base font-bold">{info.singular} rules</h2>
        <p className="text-muted m-0 mt-0.5 text-sm">Every rule names fields, so renaming or moving a field never breaks it. Disabling a field switches off the rules that use it.</p>
      </div>
      <div className="p-5">
        {config.rules ? <RulesForm key={object} object={object} config={config} /> : <div className="skeleton h-64" aria-busy="true" />}
      </div>
    </section>
  )
}

function RulesForm({ object, config }: { object: ObjectKey; config: RecordConfig }) {
  const toast = useToast()
  const invalidate = useInvalidateConfig()
  const [draft, setDraft] = useState<ObjectRules>(config.rules!)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const active = config.fields
  const of = (pred: (f: FieldDef) => boolean) => active.filter(pred)
  const text = (f: FieldDef) => ['TEXT', 'LONG_TEXT', 'EMAIL', 'PHONE', 'URL'].includes(f.dataType)
  const queueField = active.find((f) => f.apiName === draft.reviewQueue?.field)

  const multi = (label: string, key: string, value: string[], options: FieldDef[], onChange: (v: string[]) => void, help: string) => (
    <div>
      <FieldLabel help={help}>{label}</FieldLabel>
      <div className="flex flex-wrap gap-1.5">
        {options.map((f) => {
          const at = value.indexOf(f.apiName)
          return (
            <button key={f.apiName} type="button" aria-pressed={at >= 0} disabled={at < 0 && value.length >= 3}
              onClick={() => onChange(at >= 0 ? value.filter((v) => v !== f.apiName) : [...value, f.apiName])}
              className={cn('rounded-full border px-2.5 py-0.5 text-[13px] transition disabled:opacity-40', at >= 0 ? 'border-brand bg-brand-tint text-brand-dark' : 'border-line text-muted hover:text-text')}>
              {at >= 0 && <b className="mr-1">{at + 1}</b>}{f.label}
            </button>
          )
        })}
      </div>
      <span className={cn('mt-1 block text-xs', errors[key] ? 'text-brand-dark' : 'text-subtle')}>{errors[key] ?? help}</span>
    </div>
  )
  const one = (label: string, key: string, value: string | null, options: FieldDef[], onChange: (v: string | null) => void, help: string) => (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <Select value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">— Off —</option>
        {options.map((f) => <option key={f.apiName} value={f.apiName}>{f.label}</option>)}
      </Select>
      <span className={cn('mt-1 block text-xs', errors[key] ? 'text-brand-dark' : 'text-subtle')}>{errors[key] ?? help}</span>
    </div>
  )

  return (
    <div className="space-y-5">
      {config.ruleWarnings.length > 0 && (
        <ul className="bg-notice-bg text-notice-text m-0 list-none space-y-1 rounded-control px-4 py-3 text-sm">{config.ruleWarnings.map((w) => <li key={w}>{w}</li>)}</ul>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        {multi('Record name', 'nameFields', draft.nameFields, of(text), (v) => setDraft({ ...draft, nameFields: v }), 'Joined to make the name on records, lists and pickers.')}
        {multi('Picker subtitle', 'subtitleFields', draft.subtitleFields, of((f) => f.dataType !== 'LONG_TEXT'), (v) => setDraft({ ...draft, subtitleFields: v }), 'Shown under the name in pickers.')}
        {multi('Duplicate check: name fields', 'duplicateCheck.nameFields', draft.duplicateCheck.nameFields, of(text),
          (v) => setDraft({ ...draft, duplicateCheck: { ...draft.duplicateCheck, nameFields: v } }), 'Same or similar name warns before saving.')}
        {multi('Unique fields (hard gate G1)', 'uniqueFields', draft.uniqueFields ?? [], of((f) => f.dataType === 'TEXT' || f.dataType === 'EMAIL' || f.dataType === 'PHONE'),
          (v) => setDraft({ ...draft, uniqueFields: v }), 'No two live records may share a value; the save stops.')}
        {one('Duplicate check: email', 'duplicateCheck.emailField', draft.duplicateCheck.emailField, of((f) => f.dataType === 'EMAIL' || f.dataType === 'EMAIL_LIST'),
          (v) => setDraft({ ...draft, duplicateCheck: { ...draft.duplicateCheck, emailField: v } }), 'Any address of a list counts.')}
        {one('Duplicate check: mobile', 'duplicateCheck.mobileField', draft.duplicateCheck.mobileField, of((f) => f.dataType === 'PHONE' || f.dataType === 'PHONE_LIST'),
          (v) => setDraft({ ...draft, duplicateCheck: { ...draft.duplicateCheck, mobileField: v } }), 'Phones labelled Mobile count.')}
        {one('Owner', 'ownerField', draft.ownerField, of((f) => f.dataType === 'USER'), (v) => setDraft({ ...draft, ownerField: v }), '"My records" and the default owner.')}
        {one('Type', 'typeField', draft.typeField, of((f) => f.dataType === 'PICKLIST' || f.dataType === 'MULTI_PICKLIST'), (v) => setDraft({ ...draft, typeField: v }),
          object === 'entity' ? 'What the Entity does; a linked Person reads it.' : 'How the CRM classifies the Person.')}
        <div className="md:col-span-2">
          {one('Review queue field', 'reviewQueue.field', draft.reviewQueue?.field ?? null, of((f) => f.dataType === 'PICKLIST' || f.dataType === 'MULTI_PICKLIST'),
            (v) => setDraft({ ...draft, reviewQueue: v ? { field: v, values: [] } : null }), 'Records holding one of the values below need review.')}
          {queueField && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(config.picklists[queueField.picklist ?? '']?.values ?? []).filter((v) => v.active).map((v) => {
                const on = !!draft.reviewQueue?.values.includes(v.code)
                return (
                  <button key={v.code} type="button" aria-pressed={on}
                    onClick={() => setDraft({ ...draft, reviewQueue: { field: queueField.apiName, values: on ? draft.reviewQueue!.values.filter((c) => c !== v.code) : [...(draft.reviewQueue?.values ?? []), v.code] } })}
                    className={cn('rounded-full border px-2.5 py-0.5 text-[13px] transition', on ? 'border-brand bg-brand-tint text-brand-dark' : 'border-line text-muted hover:text-text')}>
                    {v.label}
                  </button>
                )
              })}
              {errors['reviewQueue.values'] && <span className="text-brand-dark w-full text-xs">{errors['reviewQueue.values']}</span>}
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-end">
        <Button variant="primary" disabled={saving} onClick={async () => {
          setSaving(true)
          try {
            await updateRules(draft, object)
            await invalidate()
            setErrors({})
            toast.success('Rules saved')
          } catch (e) {
            setErrors(e instanceof Error && 'errors' in e ? (e as { errors: Record<string, string> }).errors : {})
            toast.error(errorMessage(e))
          } finally {
            setSaving(false)
          }
        }}>{saving ? 'Saving…' : 'Save rules'}</Button>
      </div>
    </div>
  )
}
