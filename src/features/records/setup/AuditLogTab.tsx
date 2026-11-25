import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { errorMessage } from '@/api/crmClient'
import { Badge, Button } from '@/components/ui'
import { formatDateTime } from '@/lib/format'
import { actionPresentation, KIND_LABELS, type AuditChange } from '../audit'
import { Select } from '../fields/FieldInput'
import { useAuditLog, useRecordConfig } from '../hooks'

const PAGE_SIZE = 15

const KIND_OPTIONS: [string, string][] = [
  ['', 'All areas'],
  ['person', 'Persons'],
  ['entity', 'Entities'],
  ['entity_link', 'Entity links'],
  ['custom_field_def', 'Field definitions'],
  ['picklist_value', 'Picklists'],
  ['list_view', 'List views'],
  ['app_setting', 'Rules & settings'],
  ['object_def', 'Object labels'],
  ['field_def', 'Field labels'],
]

const ACTION_OPTIONS: [string, string][] = [
  ['', 'All actions'],
  ['create', 'Created'],
  ['update', 'Updated'],
  ['update-custom-fields', 'Updated fields'],
  ['delete', 'Deleted (soft)'],
  ['delete-permanently', 'Deleted permanently'],
  ['restore', 'Restored'],
  ['archive', 'Archived'],
  ['retire', 'Disabled'],
  ['reactivate', 'Enabled'],
  ['order', 'Reordered'],
  ['remove-field', 'Removed field'],
  ['add-field-back', 'Restored field'],
]

/**
 * Setup → Audit log (Salesforce Setup Audit Trail): every record and configuration change, newest first.
 * Needs field administration permission; sensitive values stay hidden unless the user may see them.
 */
export function AuditLogTab() {
  const { can, users, loading } = useRecordConfig('person')
  const allowed = can('CUSTOM_FIELD_MANAGE')
  const [recordKind, setRecordKind] = useState('')
  const [action, setAction] = useState('')
  const [userId, setUserId] = useState('')
  const [page, setPage] = useState(0)
  const log = useAuditLog({ recordKind: recordKind || undefined, action: action || undefined, userId: userId || undefined, page, size: PAGE_SIZE }, allowed)
  const filter = (set: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => { set(e.target.value); setPage(0) }

  if (loading) return <div className="skeleton h-64" aria-busy="true" />
  if (!allowed) {
    return (
      <p className="border-line bg-surface text-muted rounded-card border p-6 text-sm">
        You need field administration permission to view the audit log. Each Person and Entity page still shows its own history.
      </p>
    )
  }

  const items = log.data?.items ?? []
  const total = log.data?.totalElements ?? 0
  const totalPages = log.data?.totalPages ?? 0

  return (
    <section className="border-line bg-surface shadow-card animate-fade-up min-w-0 rounded-card border">
      <div className="border-line flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2 className="text-ink m-0 text-base font-bold">Audit log</h2>
          <p className="text-muted m-0 mt-0.5 text-sm">Every record change, link, field and configuration update, as the database audit trail keeps it.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select aria-label="Filter by area" value={recordKind} onChange={filter(setRecordKind)} className="h-9 w-auto text-[13px]">
            {KIND_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
          <Select aria-label="Filter by action" value={action} onChange={filter(setAction)} className="h-9 w-auto text-[13px]">
            {ACTION_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
          <Select aria-label="Filter by user" value={userId} onChange={filter(setUserId)} className="h-9 w-auto text-[13px]">
            <option value="">All users</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
          <Button size="small" startIcon={<RefreshCw size={14} className={log.isFetching ? 'animate-spin' : undefined} />}
            disabled={log.isFetching} onClick={() => void log.refetch()}>Refresh</Button>
        </div>
      </div>

      {log.error && <p role="alert" className="bg-brand-soft text-brand-dark mx-5 mt-4 rounded-control px-3 py-2 text-sm">{errorMessage(log.error)}</p>}

      {log.isPending ? (
        <div className="space-y-3 p-5" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-14" />)}</div>
      ) : items.length === 0 ? (
        <p className="text-muted px-5 py-10 text-center text-sm">No audit entries match these filters.</p>
      ) : (
        <ol className="m-0 list-none divide-y divide-[color:var(--pi-line-soft)] p-0" aria-label="Audit entries">
          {items.map((entry, i) => {
            const pres = actionPresentation(entry)
            const href = entry.recordId && (entry.recordKind === 'person' || entry.recordKind === 'entity')
              ? `/${entry.recordKind === 'person' ? 'people' : 'entities'}/${entry.recordId}` : null
            return (
              <li key={entry.id} className="animate-fade-up px-5 py-3.5" style={{ '--stagger': Math.min(i, 12) } as React.CSSProperties}>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span title={entry.userName} className="border-line bg-canvas text-ink flex size-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold">
                    {entry.userInitials}
                  </span>
                  <span className="text-ink font-semibold">{entry.userName}</span>
                  <Badge tone={pres.tone}>{pres.label}</Badge>
                  <Badge tone="neutral">{KIND_LABELS[entry.recordKind] ?? entry.recordKind}</Badge>
                  {entry.targetLabel && (href
                    ? <Link to={href} className="text-ink hover:text-brand font-semibold">{entry.targetLabel}</Link>
                    : <span className="text-ink font-semibold">{entry.targetLabel}</span>)}
                  <span className="text-subtle ml-auto text-xs tabular-nums">{formatDateTime(entry.occurredAt)}</span>
                </div>
                {(entry.changes.length > 0 || entry.reason) && (
                  <div className="pl-9">
                    <Changes changes={entry.changes} />
                    {entry.reason && <p className="text-muted m-0 mt-1 text-xs">Reason: {entry.reason}</p>}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}

      {total > 0 && (
        <div className="border-line text-muted flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3 text-xs">
          <span>{total.toLocaleString('en-AU')} event{total === 1 ? '' : 's'}</span>
          {totalPages > 1 && (
            <span className="flex items-center gap-2">
              <Button size="small" disabled={page === 0 || log.isFetching} onClick={() => setPage((p) => Math.max(0, p - 1))}>Previous</Button>
              <span className="tabular-nums">Page {page + 1} of {totalPages}</span>
              <Button size="small" disabled={page + 1 >= totalPages || log.isFetching} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </span>
          )}
        </div>
      )}
    </section>
  )
}

function Changes({ changes }: { changes: AuditChange[] }) {
  if (!changes.length) return null
  return (
    <ul className="text-text m-0 mt-1.5 list-none space-y-0.5 p-0 text-[13px]">
      {changes.slice(0, 8).map((c) => (
        <li key={c.field}>
          <span className="text-muted">{c.label}:</span>{' '}
          {c.redacted ? <i className="text-subtle">hidden</i> : <><s className="text-subtle">{show(c.before)}</s> → <b>{show(c.after)}</b></>}
        </li>
      ))}
      {changes.length > 8 && <li className="text-subtle text-xs">and {changes.length - 8} more</li>}
    </ul>
  )
}

function show(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—'
  if (Array.isArray(v)) return v.map((x) => (typeof x === 'object' && x ? (x as { value?: string }).value ?? JSON.stringify(x) : String(x))).join(', ')
  return typeof v === 'object' ? JSON.stringify(v) : String(v)
}
