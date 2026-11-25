import { useState } from 'react'
import { errorMessage } from '@/api/crmClient'
import { useToast } from '@/components/feedback/toastContext'
import { Button } from '@/components/ui'
import { updateSettings, type BusinessSettings } from '../api'
import { FieldLabel, Select, inputClass } from '../fields/FieldInput'
import { useInvalidateConfig, useMetadata, useRecordConfig } from '../hooks'

type Key = 'hotExpiryDays' | 'inactiveAfterMonths' | 'noteEditHours' | 'personTypeQueueOwner' | 'entityTypeQueueOwner' | 'duplicateQueueOwner'

const PERIODS: { key: Key; label: string; help: string; max: number }[] = [
  { key: 'hotExpiryDays', label: 'Hot flag clears after (days)', help: 'Brief §3.8.2', max: 365 },
  { key: 'inactiveAfterMonths', label: 'Set Inactive after no Active trigger for (months)', help: 'Brief §3.7', max: 120 },
  { key: 'noteEditHours', label: 'Author can edit a note for (hours)', help: 'Brief §3.6.1', max: 720 },
]
const OWNERS: { key: Key; label: string }[] = [
  { key: 'personTypeQueueOwner', label: 'Person Type review queue' },
  { key: 'entityTypeQueueOwner', label: 'Entity type review queue' },
  { key: 'duplicateQueueOwner', label: 'Duplicate review queue' },
]

/** Setup → Business settings (Salesforce custom metadata): time periods and who owns each review queue. */
export function BusinessSettingsTab() {
  const metadata = useMetadata()
  const { users } = useRecordConfig('person')
  const invalidate = useInvalidateConfig()
  const toast = useToast()
  const [draft, setDraft] = useState<Partial<BusinessSettings>>({})
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({})
  const [busy, setBusy] = useState(false)
  const saved = metadata.data?.settings ?? {}
  const value = (k: Key) => (k in draft ? draft[k] : saved[k])
  const dirty = Object.keys(draft).filter((k) => draft[k] !== saved[k])

  if (metadata.isPending) return <div className="skeleton h-64" aria-busy="true" />

  const save = async () => {
    const errs: Partial<Record<Key, string>> = {}
    for (const p of PERIODS) {
      const n = Number(value(p.key))
      if (!Number.isInteger(n) || n < 1 || n > p.max) errs[p.key] = `Enter a whole number from 1 to ${p.max}.`
    }
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      await updateSettings(Object.fromEntries(dirty.map((k) => [k, draft[k]])))
      await invalidate()
      setDraft({})
      toast.success('Settings saved')
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); void save() }} className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="border-line bg-surface shadow-card animate-fade-up space-y-4 rounded-card border p-5">
          <h2 className="text-ink m-0 text-base font-bold">Time periods</h2>
          {PERIODS.map((p) => (
            <div key={p.key}>
              <FieldLabel htmlFor={`st-${p.key}`} help={p.help}>{p.label}</FieldLabel>
              <input id={`st-${p.key}`} type="number" inputMode="numeric" min={1} max={p.max} value={String(value(p.key) ?? '')}
                aria-invalid={!!errors[p.key]} aria-describedby={errors[p.key] ? `st-${p.key}-err` : undefined}
                onChange={(e) => setDraft({ ...draft, [p.key]: e.target.value === '' ? '' : Number(e.target.value) })} className={inputClass} />
              {errors[p.key] && <span id={`st-${p.key}-err`} className="text-brand-dark mt-1 block text-xs">{errors[p.key]}</span>}
            </div>
          ))}
        </section>
        <section className="border-line bg-surface shadow-card animate-fade-up space-y-4 rounded-card border p-5" style={{ '--stagger': 1 } as React.CSSProperties}>
          <h2 className="text-ink m-0 text-base font-bold">Review queue owners</h2>
          {OWNERS.map((o) => (
            <div key={o.key}>
              <FieldLabel htmlFor={`st-${o.key}`}>{o.label}</FieldLabel>
              <Select id={`st-${o.key}`} value={String(value(o.key) ?? '')} onChange={(e) => setDraft({ ...draft, [o.key]: e.target.value })}>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Select>
            </div>
          ))}
        </section>
        <section className="border-line bg-surface-alt animate-fade-up rounded-card border p-5 lg:col-span-2" style={{ '--stagger': 2 } as React.CSSProperties}>
          <h2 className="text-ink m-0 text-base font-bold">Fixed in code</h2>
          <p className="text-muted m-0 mt-1 text-sm">
            These rules come from the brief and are not configurable: Person Type and Entity type are required; ACN and ABN are unique
            (hard gate G1) and format-checked (G2); the Entity type is read through the primary link and never copied onto the Person;
            the CRM never merges records and never deletes them.
          </p>
        </section>
      </div>
      <div className="flex items-center justify-end gap-2">
        {dirty.length > 0 && <span className="text-muted text-xs">{dirty.length} unsaved change{dirty.length === 1 ? '' : 's'}</span>}
        {dirty.length > 0 && <Button onClick={() => { setDraft({}); setErrors({}) }}>Undo</Button>}
        <Button type="submit" variant="primary" disabled={busy || !dirty.length}>{busy ? 'Saving…' : 'Save settings'}</Button>
      </div>
    </form>
  )
}
