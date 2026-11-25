import { ArrowDown, ArrowUp, Lock, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { errorMessage } from '@/api/crmClient'
import { useToast } from '@/components/feedback/toastContext'
import { Badge, Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import { addPicklistValue, orderPicklist, updatePicklistValue, type ServerPicklist, type ServerPicklistValue } from '../api'
import { FieldLabel, Select, inputClass } from '../fields/FieldInput'
import { useInvalidateConfig, useMetadata } from '../hooks'

type Arm = 'CREDIT' | 'CAPITAL' | 'BOTH'
const ARMS: [Arm, string][] = [['CREDIT', 'Credit'], ['CAPITAL', 'Capital'], ['BOTH', 'Both']]

/**
 * Setup → Picklists: the shared option lists (Salesforce global value sets). Relabel, reorder, retire and add
 * values. Records store the code, so relabelling never changes data.
 */
export function PicklistsTab() {
  const metadata = useMetadata()
  const sets = useMemo(() => Object.values(metadata.data?.picklists ?? {}), [metadata.data])
  const [active, setActive] = useState<string | null>(null)
  const [find, setFind] = useState('')
  const term = find.trim().toLowerCase()
  const listed = sets.filter((s) => !term || s.name.toLowerCase().includes(term) || s.code.toLowerCase().includes(term))
  const set = sets.find((s) => s.code === active) ?? sets[0]

  if (metadata.isPending) return <div className="skeleton h-80" aria-busy="true" />
  if (metadata.error) return <p className="text-brand-dark">{errorMessage(metadata.error)}</p>

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <nav aria-label="Picklists" className="border-line bg-surface shadow-card animate-fade-up h-fit overflow-hidden rounded-card border">
        <div className="border-line border-b p-2">
          <div className="relative">
            <Search size={14} className="text-subtle pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2" />
            <input aria-label="Search picklists" value={find} onChange={(e) => setFind(e.target.value)} placeholder="Search lists"
              className={cn(inputClass, 'h-8 pl-8 text-[13px]')} />
          </div>
        </div>
        <div className="max-h-[64vh] overflow-auto p-1.5">
          {listed.map((s) => (
            <button key={s.code} type="button" aria-current={set?.code === s.code ? 'true' : undefined} onClick={() => setActive(s.code)}
              className={cn('flex w-full items-center justify-between gap-2 rounded-control px-3 py-2 text-left text-sm transition-colors',
                set?.code === s.code ? 'bg-brand-tint text-brand font-bold' : 'text-text-soft hover:bg-canvas')}>
              <span className="truncate">{s.name}</span>
              <span className="flex shrink-0 items-center gap-1.5">
                {s.placeholder && <span className="bg-warning size-1.5 rounded-full" title="Values still to be supplied" />}
                {s.locked && <Lock size={12} className="text-subtle" />}
                <span className="text-subtle text-xs font-normal tabular-nums">{s.values.length}</span>
              </span>
            </button>
          ))}
          {!listed.length && <p className="text-subtle m-0 px-3 py-6 text-center text-xs">No lists match.</p>}
        </div>
      </nav>
      {set && <PicklistEditor key={set.code} set={set} parent={set.parentSet ? metadata.data?.picklists[set.parentSet] : undefined} />}
    </div>
  )
}

function PicklistEditor({ set, parent }: { set: ServerPicklist; parent?: ServerPicklist }) {
  const invalidate = useInvalidateConfig()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [newLabel, setNewLabel] = useState('')
  const [newParent, setNewParent] = useState('')
  const parentLabel = (code: string | null) => parent?.values.find((v) => v.code === code)?.label ?? code ?? '—'

  const act = async (fn: () => Promise<unknown>, done?: string) => {
    setBusy(true)
    try {
      await fn()
      await invalidate()
      if (done) toast.success(done)
      return true
    } catch (e) {
      toast.error(errorMessage(e))
      return false
    } finally {
      setBusy(false)
    }
  }
  const saveLabel = (v: ServerPicklistValue) => {
    const label = drafts[v.code]?.trim()
    if (label === undefined) return
    if (!label || label === v.label) {
      setDrafts((d) => without(d, v.code))
      return
    }
    void act(() => updatePicklistValue(set.code, v.code, { label }), 'Label saved').then(() =>
      setDrafts((d) => without(d, v.code)))
  }
  const move = (i: number, dir: -1 | 1) => {
    const codes = set.values.map((v) => v.code)
    const j = i + dir
    if (j < 0 || j >= codes.length) return
    ;[codes[i], codes[j]] = [codes[j]!, codes[i]!]
    void act(() => orderPicklist(set.code, codes), 'Order saved')
  }
  const add = async () => {
    const label = newLabel.trim()
    if (await act(() => addPicklistValue(set.code, label, parent ? newParent : undefined), `"${label}" added`)) setNewLabel('')
  }

  return (
    <section className="border-line bg-surface shadow-card animate-fade-up min-w-0 rounded-card border" aria-label={set.name}>
      <div className="border-line border-b px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-ink m-0 text-lg font-bold">{set.name}</h2>
          {set.multi && <Badge tone="info">Multi-select</Badge>}
          {set.locked && <Badge tone="neutral"><Lock size={11} className="mr-1 inline" />Locked: relabel and reorder only</Badge>}
          {set.placeholder && <Badge tone="warning">Values to be supplied by PrivateInvest</Badge>}
          {parent && <Badge tone="teal">Depends on {parent.name}</Badge>}
        </div>
        {set.description && <p className="text-muted m-0 mt-1 text-sm">{set.description}</p>}
        <p className="text-subtle m-0 mt-1 font-mono text-[11px]">{set.code}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-[13px]">
          <thead>
            <tr className="bg-surface-alt text-muted text-left text-xs font-bold">
              <th className="w-16 px-4 py-2.5"><span className="sr-only">Order</span></th>
              <th className="px-4 py-2.5">Label (shown to users)</th>
              <th className="px-4 py-2.5">Stored code</th>
              {parent && <th className="px-4 py-2.5">{parent.name}</th>}
              <th className="px-4 py-2.5">Arm</th>
              <th className="px-4 py-2.5">Active</th>
            </tr>
          </thead>
          <tbody>
            {set.values.map((v, i) => (
              <tr key={v.code} className={cn('border-line-soft animate-fade-up border-t', !v.active && 'opacity-60')} style={{ '--stagger': Math.min(i, 14) } as React.CSSProperties}>
                <td className="px-4 py-1.5">
                  <span className="flex">
                    <button type="button" aria-label={`Move ${v.label} up`} disabled={busy || i === 0} onClick={() => move(i, -1)} className="hover:bg-canvas rounded p-1 disabled:opacity-30"><ArrowUp size={14} /></button>
                    <button type="button" aria-label={`Move ${v.label} down`} disabled={busy || i === set.values.length - 1} onClick={() => move(i, 1)} className="hover:bg-canvas rounded p-1 disabled:opacity-30"><ArrowDown size={14} /></button>
                  </span>
                </td>
                <td className="px-4 py-1.5">
                  <input aria-label={`Label for ${v.code}`} value={drafts[v.code] ?? v.label} maxLength={120}
                    onChange={(e) => setDrafts({ ...drafts, [v.code]: e.target.value })}
                    onBlur={() => saveLabel(v)} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                    className="focus:border-brand hover:border-line h-8 w-full min-w-48 rounded-control border border-transparent bg-transparent px-2 focus:outline-none" />
                </td>
                <td className="text-muted px-4 py-1.5 font-mono text-xs">{v.code}</td>
                {parent && <td className="px-4 py-1.5 text-xs">{parentLabel(v.parent)}</td>}
                <td className="px-4 py-1.5">
                  <Select aria-label={`Arm for ${v.label}`} value={v.arm} disabled={busy || set.locked} className="h-8 w-28 text-xs"
                    onChange={(e) => void act(() => updatePicklistValue(set.code, v.code, { arm: e.target.value as Arm }), 'Arm saved')}>
                    {ARMS.map(([a, label]) => <option key={a} value={a}>{label}</option>)}
                  </Select>
                </td>
                <td className="px-4 py-1.5">
                  {v.system || set.locked ? (
                    <span className="text-subtle flex items-center gap-1 text-xs" title="The CRM's rules depend on this value, so it can't be retired."><Lock size={12} /> System</span>
                  ) : (
                    <input type="checkbox" aria-label={v.active ? `Retire ${v.label}` : `Reactivate ${v.label}`} checked={v.active} disabled={busy}
                      onChange={(e) => void act(() => updatePicklistValue(set.code, v.code, { active: e.target.checked }), e.target.checked ? 'Value reactivated' : 'Value retired')}
                      className="size-4 accent-[color:var(--pi-brand)]" />
                  )}
                </td>
              </tr>
            ))}
            {!set.values.length && <tr><td colSpan={parent ? 6 : 5} className="text-subtle px-4 py-8 text-center">No values yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {!set.locked && (
        <form className="border-line flex flex-wrap items-end gap-3 border-t px-5 py-4" onSubmit={(e) => { e.preventDefault(); void add() }}>
          <div className="min-w-56 flex-1">
            <FieldLabel htmlFor="pl-new">New value</FieldLabel>
            <input id="pl-new" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} maxLength={120} className={inputClass} />
          </div>
          {parent && (
            <div className="min-w-48">
              <FieldLabel htmlFor="pl-parent">{parent.name}</FieldLabel>
              <Select id="pl-parent" value={newParent} onChange={(e) => setNewParent(e.target.value)}>
                <option value="">Choose…</option>
                {parent.values.map((p) => <option key={p.code} value={p.code}>{p.label}</option>)}
              </Select>
            </div>
          )}
          <Button type="submit" variant="primary" startIcon={<Plus size={16} />} disabled={busy || !newLabel.trim() || (!!parent && !newParent)}>Add value</Button>
        </form>
      )}
      <p className="text-subtle border-line m-0 border-t px-5 py-3 text-xs">
        Records store the code, not the label, so renaming a value never changes data. A retired value stays on old records but is not offered on new ones.
      </p>
    </section>
  )
}

/** A copy of a drafts map without one key. */
function without(d: Record<string, string>, key: string): Record<string, string> {
  const next = { ...d }
  delete next[key]
  return next
}
