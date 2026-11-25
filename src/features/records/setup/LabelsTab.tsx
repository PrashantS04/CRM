import { Search } from 'lucide-react'
import { useState } from 'react'
import { errorMessage } from '@/api/crmClient'
import { useToast } from '@/components/feedback/toastContext'
import { Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import { OBJECTS, updateFieldLabel, updateObjectLabel, type ObjectKey } from '../api'
import { FieldLabel, inputClass } from '../fields/FieldInput'
import { useAllFields, useInvalidateConfig, useMetadata, useObjectInfo } from '../hooks'

const KEYS: ObjectKey[] = ['person', 'entity']

/**
 * Setup → Objects and fields (Salesforce Object Manager): rename a record type everywhere it is shown, and
 * relabel any field. Labels are display only; the stored API names never change.
 */
export function LabelsTab() {
  const [object, setObject] = useState<ObjectKey>('person')
  return (
    <div className="space-y-4">
      <section className="border-line bg-surface shadow-card animate-fade-up rounded-card border p-5">
        <h2 className="text-ink m-0 text-base font-bold">Record labels</h2>
        <p className="text-muted m-0 mt-0.5 mb-4 text-sm">Rename a record type on its pages, dialogs and filters (brief §1.4).</p>
        <div className="grid gap-5 md:grid-cols-2">
          {KEYS.map((o) => <ObjectLabelForm key={o} object={o} />)}
        </div>
      </section>
      <FieldLabels object={object} onObject={setObject} />
    </div>
  )
}

function ObjectLabelForm({ object }: { object: ObjectKey }) {
  const metadata = useMetadata()
  const live = metadata.data?.objects?.[object]
  const invalidate = useInvalidateConfig()
  const toast = useToast()
  const [draft, setDraft] = useState<{ label: string; labelPlural: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const value = draft ?? { label: live?.label ?? OBJECTS[object].singular, labelPlural: live?.labelPlural ?? OBJECTS[object].plural }
  const changed = !!draft && (draft.label !== live?.label || draft.labelPlural !== live?.labelPlural)
  const ready = changed && value.label.trim() && value.labelPlural.trim()

  return (
    <form className="border-line rounded-control border p-4" aria-label={`${object} labels`}
      onSubmit={async (e) => {
        e.preventDefault()
        if (!ready) return
        setBusy(true)
        try {
          await updateObjectLabel(object, { label: value.label.trim(), labelPlural: value.labelPlural.trim() })
          await invalidate()
          setDraft(null)
          toast.success('Record label saved')
        } catch (err) {
          toast.error(errorMessage(err))
        } finally {
          setBusy(false)
        }
      }}>
      <p className="text-subtle m-0 mb-2 font-mono text-[11px]">{object}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel htmlFor={`ol-${object}`}>Singular</FieldLabel>
          <input id={`ol-${object}`} value={value.label} maxLength={60} onChange={(e) => setDraft({ ...value, label: e.target.value })} className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor={`op-${object}`}>Plural</FieldLabel>
          <input id={`op-${object}`} value={value.labelPlural} maxLength={60} onChange={(e) => setDraft({ ...value, labelPlural: e.target.value })} className={inputClass} />
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        {draft && <Button onClick={() => setDraft(null)}>Undo</Button>}
        <Button type="submit" variant="primary" disabled={busy || !ready}>{busy ? 'Saving…' : 'Save'}</Button>
      </div>
    </form>
  )
}

function FieldLabels({ object, onObject }: { object: ObjectKey; onObject: (o: ObjectKey) => void }) {
  const fields = useAllFields(object)
  const invalidate = useInvalidateConfig()
  const toast = useToast()
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [find, setFind] = useState('')
  const term = find.trim().toLowerCase()
  const rows = (fields.data ?? []).filter((f) => !term || f.label.toLowerCase().includes(term) || f.apiName.toLowerCase().includes(term))
  const drop = (key: string) => setDrafts((d) => without(d, key))

  const save = async (apiName: string, current: string) => {
    const label = drafts[apiName]?.trim()
    if (label === undefined) return
    if (!label || label === current) return drop(apiName)
    try {
      await updateFieldLabel(object, apiName, label)
      await invalidate()
      toast.success('Field label saved')
    } catch (e) {
      toast.error(errorMessage(e))
    }
    drop(apiName)
  }

  return (
    <section className="border-line bg-surface shadow-card animate-fade-up min-w-0 rounded-card border" style={{ '--stagger': 1 } as React.CSSProperties}>
      <div className="border-line flex flex-wrap items-center gap-3 border-b px-5 py-4">
        <h2 className="text-ink m-0 text-base font-bold">Field labels</h2>
        <div className="border-line flex rounded-control border p-0.5 text-sm" role="group" aria-label="Record type">
          {KEYS.map((o) => <ObjectToggle key={o} object={o} active={object === o} onClick={() => { setDrafts({}); onObject(o) }} />)}
        </div>
        <div className="relative ml-auto w-56">
          <Search size={15} className="text-subtle pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" />
          <input aria-label="Search field labels" value={find} onChange={(e) => setFind(e.target.value)} placeholder="Search fields"
            className={cn(inputClass, 'h-9 pl-9 text-[13px]')} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-[13px]">
          <thead>
            <tr className="bg-surface-alt text-muted text-left text-xs font-bold">
              <th className="px-4 py-2.5">API name</th>
              <th className="px-4 py-2.5">Label</th>
              <th className="px-4 py-2.5">Section</th>
              <th className="px-4 py-2.5">Help text</th>
            </tr>
          </thead>
          <tbody>
            {fields.isPending && Array.from({ length: 6 }).map((_, i) => <tr key={i}><td colSpan={4} className="px-4 py-2"><span className="sr-only">Loading</span><div className="skeleton h-7" /></td></tr>)}
            {rows.map((f, i) => (
              <tr key={f.id} className={cn('border-line-soft animate-fade-up border-t', !f.active && 'text-muted')} style={{ '--stagger': Math.min(i, 14) } as React.CSSProperties}>
                <td className="text-muted px-4 py-1.5 font-mono text-xs">{f.apiName}</td>
                <td className="px-4 py-1.5">
                  <input aria-label={`Label for ${f.apiName}`} value={drafts[f.apiName] ?? f.label} maxLength={120}
                    onChange={(e) => setDrafts({ ...drafts, [f.apiName]: e.target.value })}
                    onBlur={() => void save(f.apiName, f.label)} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                    className="focus:border-brand hover:border-line h-8 w-full min-w-48 rounded-control border border-transparent bg-transparent px-2 focus:outline-none" />
                </td>
                <td className="px-4 py-1.5 text-xs">{f.section}</td>
                <td className="text-muted px-4 py-1.5 text-xs">{f.help ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ObjectToggle({ object, active, onClick }: { object: ObjectKey; active: boolean; onClick: () => void }) {
  const info = useObjectInfo(object)
  return (
    <button type="button" aria-pressed={active} onClick={onClick}
      className={cn('rounded-[7px] px-3 py-1 transition-colors', active ? 'bg-navy text-white' : 'text-muted hover:text-text')}>
      {info.singular}
    </button>
  )
}

/** A copy of a drafts map without one key. */
function without(d: Record<string, string>, key: string): Record<string, string> {
  const next = { ...d }
  delete next[key]
  return next
}
