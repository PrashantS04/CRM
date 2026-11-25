import { Archive, ArrowLeft, ChevronDown, Flame, Mail, Pencil, Phone, RotateCcw, Star, Trash2, Unlink, UserPlus } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { usePageCrumb } from '@/app/layout/breadcrumbContext'
import { CrmApiError, errorMessage } from '@/api/crmClient'
import { useToast } from '@/components/feedback/toastContext'
import { Badge, Button, Modal } from '@/components/ui'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { archiveRecord, restoreRecord, setRecordHot, type LookupItem, type ObjectKey, type RecordDetail } from './api'
import { actionPresentation } from './audit'
import { FieldGrid, groupBySection, isWide } from './fields/DynamicForm'
import { FieldLabel, Select, inputClass } from './fields/FieldInput'
import { FieldValue } from './fields/FieldValue'
import { isVisible, primaryOf } from './fields/logic'
import { isComputed, type FieldDef, type Values } from './fields/types'
import { toApiValue, toFormValue, validateValues } from './fields/validate'
import { useLinkWrites, useObjectInfo, useRecord, useRecordConfig, useRecordHistory, useRecordWrites, type RecordConfig } from './hooks'
import { RecordFieldsCard, RemovedFieldsCard, RemoveFieldDialog } from './RecordFields'
import { RecordSelect } from './RecordSelect'

type Tab = 'details' | 'related' | 'history'

/**
 * A Person or Entity, as the design lays it out: a header card (name, type, sales stage, owner, quick actions),
 * Details / Related / History tabs, collapsible field sections edited in place, and a rail with linked records.
 * Every section and field comes from the field registry.
 */
export function RecordDetailPage({ object }: { object: ObjectKey }) {
  const info = useObjectInfo(object)
  const params = useParams()
  const id = params.personId ?? params.entityId ?? ''
  const [search] = useSearchParams()
  const config = useRecordConfig(object)
  const query = useRecord(object, id, search.get('archived') === '1' || config.can(`${info.perm}_ARCHIVE`))
  const record = query.data
  const [tab, setTab] = useState<Tab>('details')
  usePageCrumb(record?.title)

  if (query.error) {
    const notFound = query.error instanceof CrmApiError && query.error.status === 404
    return (
      <div className="animate-fade-up mx-auto max-w-xl py-16 text-center">
        <p className="text-ink text-lg font-bold">{notFound ? `This ${info.singular.toLowerCase()} was not found.` : errorMessage(query.error)}</p>
        <p className="text-muted">{notFound && 'It may have been archived, or the link is out of date.'}</p>
        <Link to={info.route} className="text-brand font-bold">Back to {info.plural === 'Persons' ? 'people' : 'entities'}</Link>
      </div>
    )
  }
  if (!record || config.loading) {
    return (
      <div className="space-y-4" aria-busy>
        <div className="skeleton h-28" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_310px]">
          <div className="space-y-4">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-40" />)}</div>
          <div className="skeleton h-64" />
        </div>
      </div>
    )
  }
  return <RecordView object={object} record={record} config={config} tab={tab} setTab={setTab} />
}

function RecordView({ object, record, config, tab, setTab }: {
  object: ObjectKey
  record: RecordDetail
  config: RecordConfig
  tab: Tab
  setTab: (t: Tab) => void
}) {
  const info = useObjectInfo(object)
  const toast = useToast()
  const { patch, settle } = useRecordWrites(object)
  const [archiving, setArchiving] = useState(false)
  const [removingField, setRemovingField] = useState<FieldDef | null>(null)
  const canEdit = config.can(`${info.perm}_EDIT`) && !record.archived
  const context = record.context ?? {}

  const typeField = config.rules?.typeField ? config.field(config.rules.typeField) : undefined
  const typeValue = typeField ? record.values[typeField.apiName] : undefined
  const typeCodes = Array.isArray(typeValue) ? (typeValue as string[]) : typeValue ? [String(typeValue)] : []
  const queue = config.rules?.reviewQueue
  const inQueue = !!queue && (() => {
    const v = record.values[queue.field]
    return (Array.isArray(v) ? (v as string[]) : v ? [String(v)] : []).some((c) => queue.values.includes(c))
  })()
  const stageField = config.field('salesStage')
  const tempField = config.field('engagementTemperature')
  const phone = primaryOf(record.values.phones)
  const email = primaryOf(record.values.emails)
  const ownerId = config.rules?.ownerField ? (record.values[config.rules.ownerField] as string | undefined) : undefined

  const save = async (values: Values) => {
    try {
      await patch.mutateAsync({ id: record.id, version: record.version, values })
      toast.success('Saved')
    } catch (e) {
      if (e instanceof CrmApiError && e.code === 'stale') toast.error('Someone else changed this record. It has been reloaded; check and save again.')
      throw e
    }
  }

  const [hotPending, setHotPending] = useState(false)
  const hot = !!record.flags.hotSince
  const hotDays = typeof config.settings.hotExpiryDays === 'number' ? config.settings.hotExpiryDays : 30
  const toggleHot = async () => {
    setHotPending(true)
    try {
      settle(await setRecordHot(object, record.id, !hot))
      toast.success(hot ? 'Hot flag cleared' : `Marked Hot for ${hotDays} days`)
    } catch (e) {
      toast.error(errorMessage(e, 'Changing the Hot flag failed.'))
    } finally {
      setHotPending(false)
    }
  }

  const restore = async () => {
    try {
      settle(await restoreRecord(object, record.id, record.version))
      toast.success(`${info.singular} restored`)
    } catch (e) {
      toast.error(errorMessage(e, 'Restoring failed.'))
    }
  }

  return (
    <>
      <Link to={info.route} className="text-brand animate-fade mb-3 inline-flex items-center gap-1.5 text-xs font-bold no-underline hover:underline">
        <ArrowLeft size={14} /> Back to {info.plural === 'Persons' ? 'people' : 'entities'}
      </Link>

      {/* Header card */}
      <section className="border-line bg-surface shadow-card animate-fade-up grid items-center gap-[18px] rounded-card border p-5 md:grid-cols-[minmax(220px,1fr)_minmax(140px,.55fr)_minmax(110px,.42fr)_auto]">
        <div className="flex min-w-0 items-center gap-3">
          <span className="bg-info-soft text-info grid size-11 flex-none place-items-center rounded-full text-sm font-extrabold">
            {record.title.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
          </span>
          <div className="min-w-0">
            <h1 className="text-ink m-0 text-[25px] leading-tight font-bold break-words">{record.title}</h1>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {typeCodes.map((c) => <Badge key={c} tone="info" shape="chip" className="font-bold">{config.optionLabel(typeField?.picklist, c)}</Badge>)}
              {object === 'person' && record.inheritedEntityType && (
                <Badge tone="neutral" shape="chip" title="Read through the primary Entity link">via {config.optionLabel('ENTITY_TYPE', record.inheritedEntityType)}</Badge>
              )}
              {record.archived && <Badge tone="neutral" shape="chip">Archived</Badge>}
              {hot && !record.archived && (
                <Badge tone="brand" shape="chip" title={`Hot since ${formatDate(record.flags.hotSince!)}. Clears after ${hotDays} days unless renewed.`}>Hot</Badge>
              )}
              {record.flags.possibleDuplicateReason && <Badge tone="warning" shape="chip" title={record.flags.possibleDuplicateReason}>Possible duplicate</Badge>}
              {inQueue && !record.archived && <Badge tone="warning" shape="chip">Needs review</Badge>}
            </div>
          </div>
        </div>
        <div>
          {stageField && (
            <>
              <small className="text-muted block text-xs">{stageField.label}</small>
              <StageSelect field={stageField} value={record.values.salesStage as string | undefined} config={config}
                disabled={!canEdit || patch.isPending} onChange={(v) => void save({ salesStage: v || null })} />
            </>
          )}
        </div>
        <div>
          <small className="text-muted block text-xs">Owner</small>
          <b className="text-ink">{ownerId ? config.userName(ownerId) : '—'}</b>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {tempField && typeof record.values.engagementTemperature === 'string' && (
            <Badge tone={record.values.engagementTemperature === 'HOT' ? 'brand' : 'neutral'}>
              {config.optionLabel(tempField.picklist, record.values.engagementTemperature)}
            </Badge>
          )}
          {canEdit && (
            <Button variant={hot ? 'primary' : 'secondary'} startIcon={<Flame size={15} />} onClick={() => void toggleHot()}
              disabled={hotPending} aria-pressed={hot}
              title={hot ? 'Clear the Hot flag' : `Mark Hot: moves to the top of lists for ${hotDays} days`}>
              {hot ? 'Hot' : 'Mark hot'}
            </Button>
          )}
          {phone && <Button href={`tel:${phone.replace(/[^\d+]/g, '')}`} startIcon={<Phone size={15} />}>Call</Button>}
          {email && <Button href={`mailto:${email}`} startIcon={<Mail size={15} />}>Email</Button>}
          {config.can(`${info.perm}_ARCHIVE`) && (record.archived
            ? <Button startIcon={<RotateCcw size={15} />} onClick={restore}>Restore</Button>
            : <Button variant="ghost" startIcon={<Archive size={15} />} onClick={() => setArchiving(true)}>Archive</Button>)}
        </div>
      </section>

      {record.archived && (
        <p className="bg-neutral-soft text-neutral-text animate-fade mt-3 mb-0 rounded-control px-4 py-2.5 text-sm">
          Archived. Hidden from lists, search and pickers; its data and history are kept.
        </p>
      )}

      <Tabs value={tab} onChange={setTab} items={[
        { id: 'details', label: 'Details' },
        { id: 'related', label: object === 'person' ? `Linked entities (${record.links?.length ?? 0})` : `Linked persons (${record.persons?.length ?? 0})` },
        { id: 'history', label: 'History' },
      ]} />

      <div className="grid gap-[18px] lg:grid-cols-[minmax(0,1.8fr)_minmax(295px,.9fr)]">
        <div key={tab} className="min-w-0 space-y-3">
          {tab === 'details' && (() => {
            const sections = groupBySection(config.fields.filter((f) => f.showOnDetail && !record.hiddenFields.includes(f.apiName)))
            return (
              <>
                {sections.map(([title, fields], i) => (
                  <SectionCard key={title} index={i} title={title} fields={fields} record={record} config={config}
                    context={context} canEdit={canEdit} onSave={save} onRemoveField={setRemovingField} />
                ))}
                <RecordFieldsCard object={object} record={record} config={config} canEdit={canEdit} index={sections.length} />
                <RemovedFieldsCard object={object} record={record} config={config} canEdit={canEdit} />
              </>
            )
          })()}
          {tab === 'related' && <LinksPanel object={object} record={record} config={config} canEdit={config.can('PERSON_EDIT') && !record.archived} />}
          {tab === 'history' && <HistoryPanel object={object} id={record.id} />}
        </div>
        <aside className="space-y-3">
          <div className="text-subtle animate-fade text-[11px] font-bold tracking-[0.4px] uppercase">Connected to</div>
          <LinksPanel object={object} record={record} config={config} canEdit={config.can('PERSON_EDIT') && !record.archived} compact />
          <section className="border-line bg-surface shadow-card animate-fade-up rounded-card border p-5" style={{ '--stagger': 3 } as React.CSSProperties}>
            <h2 className="text-navy m-0 mb-2 text-base font-bold">Record</h2>
            <dl className="m-0 grid grid-cols-2 gap-y-2 text-[13px]">
              <dt className="text-muted">Created</dt><dd className="m-0">{formatDate(record.createdAt)}</dd>
              <dt className="text-muted">Updated</dt><dd className="m-0">{formatDate(record.updatedAt)}</dd>
              {record.dataGaps.length > 0 && (<><dt className="text-muted">Missing</dt><dd className="text-notice-text m-0">{record.dataGaps.length} expected fields</dd></>)}
            </dl>
          </section>
        </aside>
      </div>

      {removingField && (
        <RemoveFieldDialog object={object} record={record} field={removingField} onClose={() => setRemovingField(null)} />
      )}
      {archiving && (
        <ArchiveDialog title={record.title} singular={info.singular} onClose={() => setArchiving(false)}
          onConfirm={async (reason) => {
            try {
              settle(await archiveRecord(object, record.id, record.version, reason))
              toast.success(`${info.singular} archived`)
              setArchiving(false)
            } catch (e) {
              toast.error(errorMessage(e, 'Archiving failed.'))
            }
          }} />
      )}
    </>
  )
}

/** The sales stage, changed straight from the header; the field pulses when the change lands. */
function StageSelect({ field, value, config, disabled, onChange }: {
  field: FieldDef
  value: string | undefined
  config: RecordConfig
  disabled: boolean
  onChange: (v: string) => void
}) {
  const [pulse, setPulse] = useState(0)
  const prev = useRef(value)
  useEffect(() => {
    if (prev.current !== value) setPulse((p) => p + 1)
    prev.current = value
  }, [value])
  return (
    <Select key={pulse} aria-label={field.label} value={value ?? ''} disabled={disabled} onChange={(e) => onChange(e.target.value)}
      className={cn('mt-1 h-9 w-auto min-w-[150px]', pulse > 0 && 'animate-pulse-ring')}>
      <option value="">— None —</option>
      {(config.picklists[field.picklist ?? '']?.values ?? []).filter((v) => v.active || v.code === value).map((v) => (
        <option key={v.code} value={v.code}>{v.label}</option>
      ))}
    </Select>
  )
}

/** Tabs with an underline that slides to the selected tab. */
function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { id: T; label: string }[] }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [bar, setBar] = useState({ left: 0, width: 0 })
  useLayoutEffect(() => {
    const el = refs.current[value]
    if (el) setBar({ left: el.offsetLeft, width: el.offsetWidth })
  }, [value, items.length])
  return (
    <div role="tablist" className="border-line relative mt-[18px] mb-3 flex gap-6 border-b">
      {items.map((t) => (
        <button key={t.id} ref={(el) => { refs.current[t.id] = el }} role="tab" type="button" aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cn('pb-[11px] text-[13px] font-bold transition-colors', value === t.id ? 'text-ink' : 'text-muted hover:text-text')}>
          {t.label}
        </button>
      ))}
      <span aria-hidden className="bg-brand absolute bottom-[-1px] h-[3px] rounded-full transition-all duration-300 ease-out"
        style={{ left: bar.left, width: bar.width }} />
    </div>
  )
}

/** One field section: a collapsible card ("⌄ Title" bar with Edit) that edits its fields in place. */
function SectionCard({ index, title, fields, record, config, context, canEdit, onSave, onRemoveField }: {
  index: number
  title: string
  fields: FieldDef[]
  record: RecordDetail
  config: RecordConfig
  context: Record<string, unknown>
  canEdit: boolean
  onSave: (values: Values) => Promise<void>
  /** Removes a field from this record only (its value is deleted; other records keep the field). */
  onRemoveField?: (f: FieldDef) => void
}) {
  const [open, setOpen] = useState(true)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Values>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const shown = fields.filter((f) => isVisible(f, editing ? { ...record.values, ...draft } : record.values, context))
  if (!shown.length && !editing) return null

  const start = () => {
    setDraft(Object.fromEntries(fields.map((f) => [f.apiName, toFormValue(f.dataType, record.values[f.apiName])])))
    setErrors({})
    setEditing(true)
    setOpen(true)
  }
  const save = async () => {
    const editable = fields.filter((f) => f.editableAfterCreate && f.canEdit && !isComputed(f))
    const merged = { ...Object.fromEntries(Object.entries(record.values).map(([k, v]) => [k, toFormValue(config.field(k)?.dataType ?? 'TEXT', v)])), ...draft }
    const errs = validateValues(editable, merged, context)
    setErrors(errs)
    if (Object.keys(errs).length) return
    const changes: Values = {}
    for (const f of editable) {
      const next = toApiValue(f.dataType, draft[f.apiName])
      if (JSON.stringify(next) !== JSON.stringify(record.values[f.apiName] ?? null)) changes[f.apiName] = next
    }
    if (!Object.keys(changes).length) return setEditing(false)
    setSaving(true)
    try {
      await onSave(changes)
      setEditing(false)
    } catch (e) {
      if (e instanceof CrmApiError) setErrors(Object.keys(e.errors).length ? e.errors : { _form: e.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="border-line bg-surface shadow-card animate-fade-up overflow-hidden rounded-card border" style={{ '--stagger': index } as React.CSSProperties}>
      <div className="bg-column border-line flex items-center justify-between gap-2 border-b px-4 py-[13px]">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="text-navy flex items-center gap-1.5 text-[15px] font-bold">
          <ChevronDown size={17} className={cn('transition-transform duration-200', !open && '-rotate-90')} />
          {title}
        </button>
        {canEdit && (editing ? (
          <span className="flex gap-2">
            <Button size="small" onClick={() => setEditing(false)}>Cancel</Button>
            <Button size="small" variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </span>
        ) : (
          <Button size="small" startIcon={<Pencil size={13} />} onClick={start}>Edit</Button>
        ))}
      </div>
      <div className="collapse-grid" data-open={open}>
        <div>
          <div className="p-4">
            {errors._form && <p role="alert" className="bg-brand-soft text-brand-dark m-0 mb-3 rounded-control px-3 py-2 text-sm">{errors._form}</p>}
            {editing ? (
              <FieldGrid fields={fields} values={{ ...record.values, ...draft }} errors={errors} mode="edit" context={context} config={config}
                onChange={(k, v) => setDraft((d) => ({ ...d, [k]: v }))} />
            ) : (
              <dl className="m-0 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {shown.map((f) => (
                  <div key={f.apiName} className={cn('group min-w-0', isWide(f) && 'sm:col-span-2')}>
                    <dt className="text-muted mb-1 flex items-center gap-1 text-xs">
                      {f.label}
                      {onRemoveField && canEdit && !f.mandatory && f.canEdit && !isComputed(f) && (
                        <button type="button" aria-label={`Remove ${f.label} from this record`} title="Remove from this record only"
                          onClick={() => onRemoveField(f)}
                          className="text-subtle hover:text-brand rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </dt>
                    <dd className="text-ink m-0 flex flex-wrap items-center gap-2 text-sm font-semibold">
                      {f.sensitive && !config.can('CUSTOM_FIELD_SENSITIVE') ? (
                        // The server leaves the value out; say so rather than showing it as empty.
                        <span className="text-muted font-normal" title="Only users with permission see this value.">Hidden</span>
                      ) : (
                        <FieldValue dataType={f.dataType} picklist={f.picklist} value={record.values[f.apiName]}
                          optionLabel={config.optionLabel} userName={config.userName} />
                      )}
                      {record.dataGaps.includes(f.apiName) && <Badge tone="warning" shape="chip">Missing</Badge>}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- Links ---------- */

interface LinkDraft {
  linkId?: string
  other: LookupItem | null
  role: string
  jobTitle: string
  department: string
  email: string
  primary: boolean
}

/** A Person's Entities, or an Entity's Persons, with role, job title and the primary link. */
function LinksPanel({ object, record, config, canEdit, compact }: {
  object: ObjectKey
  record: RecordDetail
  config: RecordConfig
  canEdit: boolean
  compact?: boolean
}) {
  const toast = useToast()
  const writes = useLinkWrites()
  const [editing, setEditing] = useState<LinkDraft | null>(null)
  const rows = object === 'person'
    ? (record.links ?? []).map((l) => ({ id: l.id, otherId: l.entityId, name: l.entityName, route: '/entities', role: l.role,
        sub: [config.optionLabel('ENTITY_TYPE', l.entityType ?? ''), l.jobTitle].filter(Boolean).join(' · '), primary: l.primary,
        jobTitle: l.jobTitle, department: l.department, email: l.email }))
    : (record.persons ?? []).map((p) => ({ id: p.linkId, otherId: p.personId, name: p.personName, route: '/people', role: p.role,
        sub: [p.jobTitle, p.primaryEmail].filter(Boolean).join(' · '), primary: p.primary,
        jobTitle: p.jobTitle, department: p.department, email: null as string | null }))
  const run = async (fn: () => Promise<unknown>, done: string) => {
    try {
      await fn()
      toast.success(done)
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <section className={cn('border-line bg-surface shadow-card animate-fade-up rounded-card border', compact ? 'p-5' : 'p-5')} style={{ '--stagger': 1 } as React.CSSProperties}>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-navy m-0 text-base font-bold">{object === 'person' ? 'Linked entities' : 'Linked persons'}</h2>
        <Badge tone="neutral">{rows.length}</Badge>
      </div>
      {rows.length === 0 && <p className="text-muted m-0 text-[13px]">{object === 'person' ? 'Not linked to an Entity yet.' : 'No linked persons yet.'}</p>}
      <ul className="m-0 list-none divide-y divide-[color:var(--pi-line-soft)] p-0">
        {rows.map((r, i) => (
          <li key={r.id} className="group animate-fade-up py-2.5" style={{ '--stagger': i } as React.CSSProperties}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link to={`${r.route}/${r.otherId}`} className="text-brand font-bold no-underline hover:underline">{r.name || '(No name)'}</Link>
                {r.primary && object === 'person' && <Badge tone="info" shape="chip" className="ml-2">Primary</Badge>}
                <p className="text-muted m-0 mt-0.5 text-xs">{config.optionLabel('ENTITY_LINK_ROLE', r.role)}{r.sub ? ` · ${r.sub}` : ''}</p>
              </div>
              {canEdit && !compact && (
                <span className="flex shrink-0 gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                  {object === 'person' && !r.primary && (
                    <button type="button" title="Make primary" aria-label={`Make ${r.name} primary`} className="text-subtle hover:text-brand rounded p-1.5"
                      onClick={() => run(() => writes.primary.mutateAsync(r.id), 'Primary link changed')}><Star size={15} /></button>
                  )}
                  <button type="button" title="Edit link" aria-label={`Edit link to ${r.name}`} className="text-subtle hover:text-text rounded p-1.5"
                    onClick={() => setEditing({ linkId: r.id, other: { id: r.otherId, title: r.name, subtitle: null }, role: r.role,
                      jobTitle: r.jobTitle ?? '', department: r.department ?? '', email: r.email ?? '', primary: r.primary })}><Pencil size={15} /></button>
                  <button type="button" title="Unlink" aria-label={`Unlink ${r.name}`} className="text-subtle hover:text-brand rounded p-1.5"
                    onClick={() => window.confirm(`Unlink ${r.name}? Both records stay; only the link goes.`) && run(() => writes.remove.mutateAsync(r.id), 'Unlinked')}>
                    <Unlink size={15} />
                  </button>
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
      {canEdit && (
        <button type="button" onClick={() => setEditing({ other: null, role: '', jobTitle: '', department: '', email: '', primary: rows.length === 0 })}
          className="text-brand hover:text-brand-dark mt-2 inline-flex items-center gap-1.5 text-xs font-bold">
          <UserPlus size={14} /> Add link
        </button>
      )}
      {editing && (
        <LinkDialog object={object} draft={editing} config={config} onClose={() => setEditing(null)}
          onSave={async (d) => {
            if (d.linkId) {
              await writes.update.mutateAsync({ id: d.linkId, role: d.role, jobTitle: d.jobTitle || null, department: d.department || null,
                email: object === 'person' ? d.email || null : undefined })
            } else {
              await writes.create.mutateAsync({
                personId: object === 'person' ? record.id : d.other!.id,
                entityId: object === 'person' ? d.other!.id : record.id,
                role: d.role, jobTitle: d.jobTitle || null, department: d.department || null,
                email: object === 'person' ? d.email || null : null, primary: d.primary,
              })
            }
            toast.success(d.linkId ? 'Link updated' : 'Linked')
            setEditing(null)
          }} />
      )}
    </section>
  )
}

function LinkDialog({ object, draft, config, onClose, onSave }: {
  object: ObjectKey
  draft: LinkDraft
  config: RecordConfig
  onClose: () => void
  onSave: (d: LinkDraft) => Promise<void>
}) {
  const [d, setD] = useState(draft)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const other: ObjectKey = object === 'person' ? 'entity' : 'person'
  const roles = (config.picklists.ENTITY_LINK_ROLE?.values ?? []).filter((v) => v.active || v.code === d.role)
  const set = (patch: Partial<LinkDraft>) => setD((x) => ({ ...x, ...patch }))
  const submit = async () => {
    const errs: Record<string, string> = {}
    if (!d.other) errs.other = `Pick ${other === 'entity' ? 'an Entity' : 'a Person'}.`
    if (!d.role) errs.role = 'Pick a role.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    try {
      await onSave(d)
    } catch (e) {
      if (e instanceof CrmApiError) setErrors({ ...e.errors, other: e.errors.entityId ?? e.errors.personId ?? (Object.keys(e.errors).length ? '' : e.message) })
    } finally {
      setSaving(false)
    }
  }
  return (
    <Modal open title={d.linkId ? 'Edit link' : other === 'entity' ? 'Link an Entity' : 'Link a Person'} onClose={onClose} maxWidth={560}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" disabled={saving} onClick={submit}>{saving ? 'Saving…' : 'Save'}</Button></>}>
      <div className="grid gap-4 p-[22px] sm:grid-cols-2">
        <div className="sm:col-span-2">
          {d.linkId
            ? <p className="m-0 text-sm"><span className="text-muted">{other === 'entity' ? 'Entity' : 'Person'}: </span><b>{d.other?.title}</b></p>
            : <RecordSelect object={other} label={other === 'entity' ? 'Entity' : 'Person'} required value={d.other} onChange={(v) => set({ other: v })} error={errors.other} />}
        </div>
        <div className="sm:col-span-2">
          <FieldLabel required>Role</FieldLabel>
          <Select value={d.role} onChange={(e) => set({ role: e.target.value })} className={cn(errors.role && 'border-brand')}>
            <option value="">— Choose —</option>
            {roles.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
          </Select>
          {errors.role && <span className="text-brand-dark mt-1 block text-xs">{errors.role}</span>}
        </div>
        <div>
          <FieldLabel>Job title</FieldLabel>
          <input className={inputClass} value={d.jobTitle} onChange={(e) => set({ jobTitle: e.target.value })} />
        </div>
        <div>
          <FieldLabel>Department</FieldLabel>
          <input className={inputClass} value={d.department} onChange={(e) => set({ department: e.target.value })} />
        </div>
        {object === 'person' && (
          <div className="sm:col-span-2">
            <FieldLabel>Email at this Entity</FieldLabel>
            <input type="email" className={inputClass} value={d.email} onChange={(e) => set({ email: e.target.value })} placeholder="name@company.com.au" />
            <span className="text-subtle mt-1 block text-xs">A new address is also added to the Person's Email list.</span>
          </div>
        )}
        {object === 'person' && !d.linkId && (
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={d.primary} onChange={(e) => set({ primary: e.target.checked })} className="accent-[color:var(--pi-brand)] size-4" />
            Primary Entity (its type is read onto the Person)
          </label>
        )}
      </div>
    </Modal>
  )
}

/* ---------- History ---------- */

function HistoryPanel({ object, id }: { object: ObjectKey; id: string }) {
  const history = useRecordHistory(object, id, true)
  if (history.isPending) return <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-14" />)}</div>
  if (history.error) return <p className="text-brand-dark">{errorMessage(history.error)}</p>
  const items = history.data?.items ?? []
  return (
    <section className="border-line bg-surface shadow-card animate-fade-up rounded-card border p-5">
      <h2 className="text-navy m-0 mb-3 text-lg font-bold">History</h2>
      {items.length === 0 && <p className="text-muted m-0">No changes recorded yet.</p>}
      <ol className="border-line m-0 list-none space-y-0 border-l p-0 pl-5">
        {items.map((e, i) => {
          const p = actionPresentation(e)
          return (
            <li key={e.id} className="animate-fade-up relative pb-4" style={{ '--stagger': Math.min(i, 12) } as React.CSSProperties}>
              <span className="bg-brand absolute top-1.5 -left-[25px] size-2.5 rounded-full ring-4 ring-[color:var(--pi-brand-tint)]" />
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge tone={p.tone}>{p.label}</Badge>
                <span className="text-ink font-semibold">{e.userName}</span>
                <span className="text-muted text-xs">{new Date(e.occurredAt).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
              {e.changes.length > 0 && (
                <ul className="text-text m-0 mt-1.5 list-none space-y-0.5 p-0 text-[13px]">
                  {e.changes.slice(0, 6).map((c) => (
                    <li key={c.field}>
                      <span className="text-muted">{c.label}:</span>{' '}
                      {c.redacted ? <i className="text-subtle">hidden</i> : <><s className="text-subtle">{show(c.before)}</s> → <b>{show(c.after)}</b></>}
                    </li>
                  ))}
                </ul>
              )}
              {e.reason && <p className="text-muted m-0 mt-1 text-xs">Reason: {e.reason}</p>}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function show(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—'
  if (Array.isArray(v)) return v.map((x) => (typeof x === 'object' && x ? (x as { value?: string }).value ?? JSON.stringify(x) : String(x))).join(', ')
  return typeof v === 'object' ? JSON.stringify(v) : String(v)
}

function ArchiveDialog({ title, singular, onClose, onConfirm }: { title: string; singular: string; onClose: () => void; onConfirm: (reason: string) => Promise<void> }) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const ready = useMemo(() => !busy, [busy])
  return (
    <Modal open title={`Archive ${title}?`} onClose={onClose} maxWidth={480}
      footer={<><Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" disabled={!ready} onClick={async () => { setBusy(true); try { await onConfirm(reason) } finally { setBusy(false) } }}>Archive</Button></>}>
      <div className="space-y-3 p-[22px]">
        <p className="m-0 text-sm">The {singular} disappears from lists, search and pickers. Nothing is deleted, and an administrator can restore it.</p>
        <div>
          <FieldLabel>Reason</FieldLabel>
          <textarea rows={2} className={cn(inputClass, 'h-auto py-2')} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      </div>
    </Modal>
  )
}
