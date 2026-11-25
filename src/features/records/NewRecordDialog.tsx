import { AlertTriangle, ChevronDown, Plus, ShieldAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CrmApiError } from '@/api/crmClient'
import { useToast } from '@/components/feedback/toastContext'
import { Button, Modal } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { DuplicateMatch, ObjectKey } from './api'
import { DynamicForm, FieldGrid, groupBySection } from './fields/DynamicForm'
import { inputClass } from './fields/FieldInput'
import { isRequiredNow } from './fields/logic'
import { isComputed, type DraftRecordField, type Values } from './fields/types'
import { isEmptyValue, toApiValue, toFormValue, validateValues } from './fields/validate'
import { useInvalidateConfig, useObjectInfo, useRecordConfig, useRecordWrites } from './hooks'
import { draftsToApi, validateDrafts } from './recordFieldDrafts'
import { RecordFieldsDraft } from './RecordFields'
import { FieldEditorDialog } from './setup/FieldEditorDialog'

/** Hard gate G1: another record already holds this ACN or ABN, so the save stops (brief §3.8.3). */
interface Block {
  field: string
  existingId: string | null
  existingName: string
}

/**
 * New Person / New Entity. Quick create, as in the design: the dialog opens with the fields a record needs
 * (required ones, and those a condition makes required); "More details" reveals every other field set to show on
 * the New form, by section. A possible duplicate asks for a reason; a duplicate ACN or ABN stops the save.
 */
export function NewRecordDialog({ object, open, onClose }: { object: ObjectKey; open: boolean; onClose: () => void }) {
  return open ? <NewRecordForm object={object} onClose={onClose} /> : null
}

function NewRecordForm({ object, onClose }: { object: ObjectKey; onClose: () => void }) {
  const info = useObjectInfo(object)
  const config = useRecordConfig(object)
  const { create } = useRecordWrites(object)
  const toast = useToast()
  const navigate = useNavigate()
  const [values, setValues] = useState<Values>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [more, setMore] = useState(false)
  const [matches, setMatches] = useState<DuplicateMatch[] | null>(null)
  const [reason, setReason] = useState('')
  const [block, setBlock] = useState<Block | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<DraftRecordField[]>([])
  const [addingField, setAddingField] = useState(false)
  const invalidate = useInvalidateConfig()
  const canManageFields = config.can('CUSTOM_FIELD_MANAGE')

  const formFields = useMemo(() => config.fields.filter((f) => f.showOnCreate && !isComputed(f)), [config.fields])
  // Defaults fill untouched fields; the owner field (owner rule) starts as the signed-in user.
  const formValues = useMemo(() => {
    const out: Values = {}
    for (const f of formFields) {
      if (f.apiName in values) out[f.apiName] = values[f.apiName]
      else if (f.apiName === config.rules?.ownerField && config.me) out[f.apiName] = config.me.id
      else out[f.apiName] = toFormValue(f.dataType, f.defaultValue)
    }
    return out
  }, [formFields, values, config.rules, config.me])

  // Required fields lead, with the fields the save checks against other records (unique ACN/ABN, the duplicate
  // check's email and mobile). A field a condition makes required stays in its section, next to its driver.
  const r = config.rules
  const checked = new Set([...(r?.uniqueFields ?? []), r?.duplicateCheck.emailField, r?.duplicateCheck.mobileField].filter(Boolean) as string[])
  const essential = formFields.filter((f) => f.mandatory || checked.has(f.apiName))
  const optional = formFields.filter((f) => !essential.includes(f))
  const conditionalMissing = optional.some((f) => isRequiredNow(f, formValues, {}))

  const save = async () => {
    const errs = { ...validateValues(formFields, formValues), ...validateDrafts(drafts) }
    setErrors(errs)
    setFormError(null)
    setBlock(null)
    if (Object.keys(errs).length) {
      if (Object.keys(errs).some((k) => optional.some((f) => f.apiName === k))) setMore(true)
      return
    }
    const payload: Values = {}
    for (const f of formFields) {
      const v = toApiValue(f.dataType, formValues[f.apiName])
      if (!isEmptyValue(v)) payload[f.apiName] = v
    }
    try {
      const r = await create.mutateAsync({ values: payload, recordFields: draftsToApi(drafts), duplicateReason: matches ? reason.trim() : undefined })
      toast.success(`${info.singular} saved`)
      onClose()
      navigate(`${info.route}/${r.id}`)
    } catch (e) {
      if (e instanceof CrmApiError && e.code === 'duplicate-warning') {
        setMatches((e.body.matches as DuplicateMatch[]) ?? [])
      } else if (e instanceof CrmApiError && e.code === 'duplicate-block') {
        setBlock({ field: String(e.body.field ?? ''), existingId: (e.body.existingId as string) ?? null, existingName: String(e.body.existingName ?? '') })
      } else if (e instanceof CrmApiError && Object.keys(e.errors).length) {
        setErrors(e.errors)
        if (Object.keys(e.errors).some((k) => optional.some((f) => f.apiName === k))) setMore(true)
      } else {
        setFormError(e instanceof CrmApiError ? e.message : 'Saving failed. Try again.')
      }
    }
  }

  return (
    <Modal open title={`New ${info.singular.toLowerCase()}`} onClose={onClose} maxWidth={760}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={create.isPending || config.loading || (!!matches && !reason.trim())}>
            {create.isPending ? 'Saving…' : matches ? 'Save anyway' : `Save ${info.singular.toLowerCase()}`}
          </Button>
        </>
      }>
      <div className="max-h-[70vh] space-y-4 overflow-y-auto p-[22px]">
        <p className="text-muted m-0 text-[13px]">
          {object === 'entity'
            ? 'ACN and ABN are checked for a duplicate and a valid format before an Entity saves.'
            : 'Create one record for one natural person. Add more detail now, or later on the record.'}
        </p>
        {formError && <p role="alert" className="bg-brand-soft text-brand-dark animate-fade m-0 rounded-control px-3 py-2 text-sm">{formError}</p>}
        {block && (
          <div role="alert" className="border-brand-border bg-brand-tint text-brand-dark animate-pop flex gap-3 rounded-control border p-3 text-sm">
            <ShieldAlert size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="m-0 font-bold">This {block.field} is already used, so the {info.singular} can't be saved.</p>
              <p className="m-0 mt-1">
                {block.existingId
                  ? <Link to={`${info.route}/${block.existingId}`} className="text-brand-dark font-bold" onClick={onClose}>{block.existingName}</Link>
                  : block.existingName}{' '}
                already has it. Open that record, or check the number.
              </p>
            </div>
          </div>
        )}
        {matches && (
          <div role="alert" className="border-notice-border bg-notice-bg text-notice-text animate-pop space-y-2 rounded-control border p-3 text-sm">
            <p className="m-0 flex items-center gap-2 font-bold"><AlertTriangle size={16} /> This may already be in the CRM.</p>
            <ul className="m-0 list-none space-y-1 p-0">
              {matches.map((m) => (
                <li key={m.id}>
                  <Link to={`${info.route}/${m.id}`} target="_blank" className="text-ink font-bold">{m.name}</Link>
                  <span> · {m.reasons.join(', ')}</span>
                </li>
              ))}
            </ul>
            <label className="block">
              <span className="text-text-soft mb-1.5 block text-xs font-bold">Reason to save a new record <span className="text-brand">*</span></span>
              <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} className={cn(inputClass, 'h-auto py-2')} />
            </label>
            <p className="m-0 text-xs">The record is flagged Possible duplicate and goes on the duplicate review queue.</p>
          </div>
        )}
        {config.loading ? (
          <div className="grid gap-4 sm:grid-cols-2" aria-busy>{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-16" />)}</div>
        ) : (
          <>
            <FieldGrid fields={essential} values={formValues} errors={errors} mode="create" config={config}
              onChange={(k, v) => { setValues((s) => ({ ...s, [k]: v })); setBlock(null) }} />
            {optional.length > 0 && (
              <>
                <button type="button" onClick={() => setMore((m) => !m)} aria-expanded={more}
                  className="text-brand hover:text-brand-dark inline-flex items-center gap-1.5 text-[13px] font-bold">
                  <ChevronDown size={16} className={cn('transition-transform duration-200', more && 'rotate-180')} />
                  {more ? 'Fewer details' : `More details (${optional.length} optional fields)`}
                </button>
                {!more && conditionalMissing && (
                  <p className="text-notice-text m-0 text-xs">A field in More details is now required.</p>
                )}
                <div className="collapse-grid" data-open={more}>
                  <div>
                    {more && (
                      <DynamicForm fields={optional} values={formValues} errors={errors} mode="create" config={config}
                        onChange={(k, v) => setValues((s) => ({ ...s, [k]: v }))} />
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
        {!config.loading && (
          <div className="border-line space-y-2 border-t pt-4">
            <RecordFieldsDraft object={object} drafts={drafts} setDrafts={setDrafts} errors={errors} />
            {canManageFields && (
              <Button size="small" variant="ghost" startIcon={<Plus size={15} />} onClick={() => setAddingField(true)}>
                Add a field for every {info.singular}
              </Button>
            )}
          </div>
        )}
      </div>
      {addingField && (
        <FieldEditorDialog object={object} config={config} sections={groupBySection(config.fields).map(([name]) => name)}
          onClose={() => setAddingField(false)}
          onSaved={() => {
            void invalidate()
            setMore(true)
            toast.success(`Field added to every ${info.singular}. Fill it in below.`)
          }} />
      )}
    </Modal>
  )
}
