import { ArrowDown, ArrowUp, ChevronDown, FolderPlus, GripVertical, Pencil, Plus, RotateCcw, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { errorMessage } from '@/api/crmClient'
import { useToast } from '@/components/feedback/toastContext'
import { Badge, Button, Modal } from '@/components/ui'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { deleteField, fieldUsage, moveSection, orderFields, orderSections, restoreField, setFieldActive, type ObjectKey } from '../api'
import { Select, inputClass } from '../fields/FieldInput'
import { SHARED_FIELD_TYPES, type FieldDef, type FieldSectionDef } from '../fields/types'
import { useAllFields, useDeletedFields, useInvalidateConfig, useObjectInfo, useRecordConfig, useSections, type RecordConfig } from '../hooks'
import { FieldEditorDialog } from './FieldEditorDialog'
import { DeleteSectionDialog, SectionFormDialog } from './SectionDialogs'
import { ruleUses } from './ruleUses'

const typeLabel = (t: string) => SHARED_FIELD_TYPES.find((x) => x.value === t)?.label ?? (t === 'USER' ? 'User' : t)
const same = (a?: string | null, b?: string | null) => (a ?? '').trim().toLowerCase() === (b ?? '').trim().toLowerCase()

/** A section and its fields; `section` is null for fields whose section no longer exists. */
interface Group { key: string; name: string; section: FieldSectionDef | null; all: FieldDef[]; shown: FieldDef[] }

/**
 * Setup → Person fields / Entity fields: the record type's sections, each a collapsible card with its fields.
 * Create, rename, reorder (drag or arrows) and delete sections; add, edit, reorder, enable, disable, delete and
 * restore fields. Changes apply at once to forms, record pages, lists and filters.
 */
export function ObjectFieldsTab({ object }: { object: ObjectKey }) {
  const info = useObjectInfo(object)
  const config = useRecordConfig(object)
  const all = useAllFields(object)
  const sectionsQuery = useSections(object)
  const deleted = useDeletedFields(object)
  const invalidate = useInvalidateConfig()
  const toast = useToast()
  const [view, setView] = useState<'fields' | 'deleted'>('fields')
  const [find, setFind] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [overviewOpen, setOverviewOpen] = useState(true)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropId, setDropId] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ field?: FieldDef; section?: string } | null>(null)
  const [deletingField, setDeletingField] = useState<{ field: FieldDef; inUse: number } | null>(null)
  const [sectionForm, setSectionForm] = useState<FieldSectionDef | 'new' | null>(null)
  const [deletingSection, setDeletingSection] = useState<FieldSectionDef | null>(null)

  const fields = useMemo(() => all.data ?? [], [all.data])
  const sections = useMemo(() => sectionsQuery.data ?? [], [sectionsQuery.data])
  const deletedRows = deleted.data ?? []
  const term = find.trim().toLowerCase()
  const searching = !!term
  const fieldMatches = (f: { label: string; apiName: string }) => !term || f.label.toLowerCase().includes(term) || f.apiName.toLowerCase().includes(term)

  const groups = useMemo<Group[]>(() => {
    const out: Group[] = sections.map((s) => ({ key: s.id, name: s.name, section: s, all: fields.filter((f) => same(f.section, s.name)), shown: [] }))
    for (const f of fields) {
      if (out.some((g) => same(g.name, f.section))) continue
      const name = f.section?.trim() || 'Details'
      out.push({ key: `orphan-${name}`, name, section: null, all: fields.filter((x) => same(x.section, name)), shown: [] })
    }
    return out
  }, [sections, fields])
  const visible = groups
    .filter((g) => !sectionFilter || g.name === sectionFilter)
    .map((g) => ({ ...g, shown: !term || g.name.toLowerCase().includes(term) ? g.all : g.all.filter(fieldMatches) }))
    .filter((g) => !searching || g.shown.length > 0 || g.name.toLowerCase().includes(term))
  const sectionNames = groups.map((g) => g.name)

  const act = async (fn: () => Promise<unknown>, done: string) => {
    try {
      await fn()
      await invalidate()
      toast.success(done)
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }
  /** Swaps a field with its neighbour inside its section. */
  const moveField = (group: FieldDef[], k: number, dir: -1 | 1) => {
    const a = group[k]
    const b = group[k + dir]
    if (!a || !b) return
    const ids = fields.map((f) => f.id)
    const i = ids.indexOf(a.id)
    const j = ids.indexOf(b.id)
    ;[ids[i], ids[j]] = [ids[j]!, ids[i]!]
    void act(() => orderFields(object, ids), 'Order saved')
  }
  const dropSection = (targetId: string) => {
    if (!dragId || dragId === targetId) return
    const ids = sections.map((s) => s.id)
    const from = ids.indexOf(dragId)
    const to = ids.indexOf(targetId)
    if (from < 0 || to < 0) return
    ids.splice(to, 0, ids.splice(from, 1)[0]!)
    void act(() => orderSections(object, ids), 'Section order saved')
  }
  const dragProps = (id: string) => ({
    onDragOver: (e: React.DragEvent) => { if (dragId && !searching) { e.preventDefault(); setDropId(id) } },
    onDragLeave: () => setDropId((d) => (d === id ? null : d)),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); dropSection(id); setDragId(null); setDropId(null) },
  })
  const jumpTo = (key: string) => {
    setSectionFilter('')
    setCollapsed((c) => ({ ...c, [key]: false }))
    requestAnimationFrame(() => document.getElementById(`section-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  const setAll = (isCollapsed: boolean) => setCollapsed(Object.fromEntries(groups.map((g) => [g.key, isCollapsed])))

  return (
    <section className="border-line bg-surface shadow-card animate-fade-up min-w-0 rounded-card border">
      <div className="border-line flex flex-wrap items-start justify-between gap-4 border-b px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-ink m-0 text-base font-bold">{info.singular} sections and fields</h2>
          <p className="text-muted m-0 mt-0.5 text-sm">
            Create sections first, then organize and reorder fields inside each section. Changes apply at once across forms and record pages.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button startIcon={<Plus size={16} />} onClick={() => setSectionForm('new')}>New section</Button>
          <Button variant="primary" startIcon={<Plus size={16} />} disabled={!sections.length}
            title={!sections.length ? 'Create a section first' : undefined}
            onClick={() => setEditing({ section: sectionFilter || sections[0]?.name })}>Add custom field</Button>
        </div>
      </div>

      <div className="border-line flex flex-wrap items-center justify-between gap-3 border-b px-5">
        <div className="flex gap-[18px] pt-3" role="tablist" aria-label={`${info.singular} field views`}>
          {([
            ['fields', `Sections & fields (${groups.length} · ${fields.length})`],
            ['deleted', `Deleted fields (${deletedRows.length})`],
          ] as const).map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={view === id} onClick={() => setView(id)}
              className={cn('-mb-px border-b-2 px-0.5 pb-3 text-sm font-semibold transition-colors',
                view === id ? 'border-brand text-brand' : 'text-muted hover:text-text border-transparent')}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 py-2.5">
          <Select aria-label="Filter by section" value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className="h-9 w-48 text-[13px]">
            <option value="">All sections</option>
            {groups.map((g) => <option key={g.key} value={g.name}>{g.name} ({g.all.length})</option>)}
          </Select>
          <div className="relative w-56">
            <Search size={15} className="text-subtle pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" />
            <input aria-label="Search sections or fields" value={find} onChange={(e) => setFind(e.target.value)} placeholder="Search sections or fields…"
              className={cn(inputClass, 'h-9 pl-9 text-[13px]')} />
          </div>
          {view === 'fields' && !searching && groups.length > 0 && (
            <span className="border-line flex items-center gap-1 border-l pl-2">
              <button type="button" onClick={() => setAll(false)} className="text-muted hover:bg-canvas hover:text-ink rounded px-2 py-1 text-xs font-semibold">Expand all</button>
              <button type="button" onClick={() => setAll(true)} className="text-muted hover:bg-canvas hover:text-ink rounded px-2 py-1 text-xs font-semibold">Collapse all</button>
            </span>
          )}
        </div>
      </div>

      <div key={view} className="animate-fade space-y-3 p-5">
        {view === 'deleted' ? (
          <DeletedFields rows={deletedRows.filter((f) => fieldMatches(f) && (!sectionFilter || f.section === sectionFilter))} loading={deleted.isPending}
            total={deletedRows.length} plural={info.plural.toLowerCase()}
            onRestore={(f) => void act(() => restoreField(f.id), `${f.label} restored with its values`)} />
        ) : all.isPending || sectionsQuery.isPending ? (
          <div className="space-y-3" aria-busy="true"><span className="sr-only">Loading</span>{[0, 1, 2].map((i) => <div key={i} className="skeleton h-14" />)}</div>
        ) : (
          <>
            {!sections.length && (
              <div className="border-line text-muted flex flex-col items-center gap-2 rounded-card border border-dashed px-5 py-10 text-center text-sm">
                <p className="m-0">No sections yet. Create your first section to organize fields.</p>
                <Button size="small" variant="primary" startIcon={<Plus size={14} />} onClick={() => setSectionForm('new')}>New section</Button>
              </div>
            )}

            {sections.length > 0 && (
              <div className="border-line overflow-hidden rounded-card border">
                <button type="button" aria-expanded={overviewOpen} onClick={() => setOverviewOpen((o) => !o)}
                  className="hover:bg-canvas flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors">
                  <span className="flex items-center gap-2">
                    <ChevronDown size={16} className={cn('text-muted transition-transform duration-200', !overviewOpen && '-rotate-90')} />
                    <span className="text-muted text-xs font-bold tracking-wider uppercase">Sections</span>
                    <Badge tone="neutral">{sections.length}</Badge>
                  </span>
                  <span className="text-subtle hidden text-xs sm:inline">
                    {overviewOpen ? 'Drag pills to reorder · Click a pill to jump to section' : 'Click to view and reorder all sections'}
                  </span>
                </button>
                <div className="collapse-grid" data-open={overviewOpen}>
                  <div>
                    <div className="border-line flex flex-wrap items-center gap-2 border-t px-4 py-3" role="group" aria-label="Sections">
                      {sections.map((s) => {
                        const count = groups.find((g) => g.key === s.id)?.all.length ?? 0
                        return (
                          <div key={s.id} draggable={!searching} {...dragProps(s.id)}
                            onDragStart={(e) => { setDragId(s.id); e.dataTransfer.effectAllowed = 'move' }}
                            onDragEnd={() => { setDragId(null); setDropId(null) }}
                            className={cn('border-line bg-canvas text-ink inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all',
                              !searching && 'cursor-grab active:cursor-grabbing',
                              dropId === s.id && dragId !== s.id && 'border-brand bg-brand-tint ring-brand-soft ring-2',
                              dragId === s.id && 'opacity-50')}>
                            {!searching && <GripVertical size={12} className="text-subtle" />}
                            <button type="button" onClick={() => jumpTo(s.id)} className="hover:text-brand">{s.name}</button>
                            <Badge tone="neutral">{count}</Badge>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {sections.length > 0 && visible.length === 0 && (
              <div className="border-line text-muted rounded-card border border-dashed px-5 py-10 text-center text-sm">
                No section or field matches this search.
                <button type="button" className="text-brand ml-2 font-semibold hover:underline" onClick={() => { setFind(''); setSectionFilter('') }}>Clear search</button>
              </div>
            )}

            {visible.map((g, gi) => (
              <SectionBlock key={g.key} group={g} index={gi} sections={sections} config={config} searching={searching}
                open={searching || !collapsed[g.key]} onToggle={() => setCollapsed((c) => ({ ...c, [g.key]: !c[g.key] }))}
                dragging={dragId === g.key} dropTarget={dropId === g.key && dragId !== g.key}
                dragProps={g.section ? dragProps(g.key) : undefined}
                onDragStart={() => setDragId(g.key)} onDragEnd={() => { setDragId(null); setDropId(null) }}
                onMoveSection={(dir) => { const s = g.section; if (s) void act(() => moveSection(s.id, dir), 'Section order saved') }}
                onAddField={() => setEditing({ section: g.name })}
                onEditSection={() => g.section && setSectionForm(g.section)}
                onDeleteSection={() => g.section && setDeletingSection(g.section)}
                onEditField={(f) => setEditing({ field: f })}
                onMoveField={(k, dir) => moveField(g.all, k, dir)}
                onToggleField={(f, uses) => {
                  if (f.active && uses.length && !window.confirm(`${f.label} is used by: ${uses.join(', ')}. Disabling it switches that off. Continue?`)) return
                  void act(() => setFieldActive(f.id, !f.active), f.active ? 'Field disabled' : 'Field enabled')
                }}
                onDeleteField={async (f) => {
                  try {
                    const u = await fieldUsage(f.id)
                    setDeletingField({ field: f, inUse: u.recordsWithValue + u.archivedRecordsWithValue })
                  } catch (e) {
                    toast.error(errorMessage(e))
                  }
                }} />
            ))}
          </>
        )}
      </div>

      {editing && (
        <FieldEditorDialog object={object} config={config} sections={sectionNames} field={editing.field} defaultSection={editing.section}
          onClose={() => setEditing(null)} onSaved={() => { void invalidate(); toast.success('Field saved') }} />
      )}
      {sectionForm && <SectionFormDialog object={object} section={sectionForm === 'new' ? undefined : sectionForm} onClose={() => setSectionForm(null)} />}
      {deletingSection && <DeleteSectionDialog section={deletingSection} sections={sections} onClose={() => setDeletingSection(null)} />}
      {deletingField && (
        <Modal open title={`Delete "${deletingField.field.label}"?`} onClose={() => setDeletingField(null)} maxWidth={480}
          footer={<><Button onClick={() => setDeletingField(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => { const d = deletingField; setDeletingField(null); void act(() => deleteField(d.field.id, d.field.version), 'Field deleted. You can restore it from Deleted fields.') }}>Delete</Button></>}>
          <div className="space-y-2 p-[22px] text-sm">
            {deletingField.inUse > 0 && <p className="bg-notice-bg text-notice-text m-0 rounded-control px-3 py-2"><b>{deletingField.inUse} records</b> have a value in this field. The values are kept.</p>}
            <p className="m-0">The field disappears from forms, records, lists, filters and search. An administrator can restore it, with its values, from Deleted fields.</p>
          </div>
        </Modal>
      )}
    </section>
  )
}

function SectionBlock({ group, index, sections, config, searching, open, onToggle, dragging, dropTarget, dragProps, onDragStart, onDragEnd,
  onMoveSection, onAddField, onEditSection, onDeleteSection, onEditField, onMoveField, onToggleField, onDeleteField }: {
  group: Group
  index: number
  sections: FieldSectionDef[]
  config: RecordConfig
  searching: boolean
  open: boolean
  onToggle: () => void
  dragging: boolean
  dropTarget: boolean
  dragProps?: { onDragOver: (e: React.DragEvent) => void; onDragLeave: () => void; onDrop: (e: React.DragEvent) => void }
  onDragStart: () => void
  onDragEnd: () => void
  onMoveSection: (dir: -1 | 1) => void
  onAddField: () => void
  onEditSection: () => void
  onDeleteSection: () => void
  onEditField: (f: FieldDef) => void
  onMoveField: (k: number, dir: -1 | 1) => void
  onToggleField: (f: FieldDef, uses: string[]) => void
  onDeleteField: (f: FieldDef) => void
}) {
  const { section, all, shown } = group
  const sIdx = section ? sections.findIndex((s) => s.id === section.id) : -1
  const disabled = all.filter((f) => !f.active).length
  const reorderable = !!section && !searching

  return (
    <div id={`section-${group.key}`} {...dragProps}
      className={cn('border-line bg-surface animate-fade-up overflow-hidden rounded-card border transition-all', dropTarget && 'border-brand ring-brand-soft ring-2', dragging && 'opacity-60')}
      style={{ '--stagger': Math.min(index, 12) } as React.CSSProperties}>
      <div draggable={reorderable} onDragStart={(e) => { if (!reorderable) return; onDragStart(); e.dataTransfer.effectAllowed = 'move' }} onDragEnd={onDragEnd}
        className="bg-column flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {reorderable && (
            <span className="border-line flex items-center gap-0.5 border-r pr-2">
              <span className="text-subtle hover:text-ink cursor-grab p-1" title="Drag to reorder section"><GripVertical size={16} /></span>
              <button type="button" aria-label={`Move section ${group.name} up`} disabled={sIdx === 0} onClick={() => onMoveSection(-1)} className="text-muted hover:bg-canvas rounded p-1 disabled:opacity-30"><ArrowUp size={14} /></button>
              <button type="button" aria-label={`Move section ${group.name} down`} disabled={sIdx === sections.length - 1} onClick={() => onMoveSection(1)} className="text-muted hover:bg-canvas rounded p-1 disabled:opacity-30"><ArrowDown size={14} /></button>
            </span>
          )}
          <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-2 text-left">
            <ChevronDown size={16} className={cn('text-muted shrink-0 transition-transform duration-200', !open && '-rotate-90')} />
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                <h3 className="text-ink m-0 text-sm font-bold">{group.name}</h3>
                <Badge tone="neutral">{all.length} {all.length === 1 ? 'field' : 'fields'}</Badge>
                {disabled > 0 && <Badge tone="warning">{disabled} disabled</Badge>}
                {!section && <Badge tone="warning" title="No section with this name exists; edit the fields to move them.">No section</Badge>}
              </span>
              {section?.description && <span className="text-muted mt-0.5 block truncate text-xs">{section.description}</span>}
            </span>
          </button>
        </div>
        <span className="flex shrink-0 items-center gap-1">
          <Button size="small" startIcon={<Plus size={14} />} onClick={onAddField}>Add field</Button>
          {section && (
            <>
              <Button size="small" variant="ghost" aria-label={`Edit section ${group.name}`} onClick={onEditSection} sx={{ minWidth: 34, px: 1 }}><Pencil size={14} /></Button>
              <Button size="small" variant="ghost" aria-label={`Delete section ${group.name}`} disabled={sections.length <= 1}
                title={sections.length <= 1 ? 'At least one section is required' : undefined} onClick={onDeleteSection} sx={{ minWidth: 34, px: 1 }}><Trash2 size={14} /></Button>
            </>
          )}
        </span>
      </div>

      <div className="collapse-grid" data-open={open}>
        <div>
          <div className="border-line border-t">
            {shown.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
                <FolderPlus size={28} className="text-subtle" />
                <p className="text-ink m-0 text-sm font-semibold">No fields in &ldquo;{group.name}&rdquo; yet</p>
                <p className="text-muted m-0 max-w-md text-xs">Add a field straight into this section, or edit an existing field to move it here.</p>
                <Button size="small" startIcon={<Plus size={14} />} onClick={onAddField}>Add field to {group.name}</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-surface-alt text-muted text-left text-xs font-bold">
                      <th className="w-16 px-3 py-2.5"><span className="sr-only">Order</span></th>
                      <th className="px-3 py-2.5">Field</th>
                      <th className="px-3 py-2.5">Type</th>
                      <th className="px-3 py-2.5">Rules and behaviour</th>
                      <th className="px-3 py-2.5">Shown on</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((f) => {
                      const uses = ruleUses(f.apiName, config.rules)
                      const i = all.indexOf(f)
                      return (
                        <tr key={f.id} className={cn('border-line-soft border-t transition-colors hover:bg-[color:var(--pi-brand-tint)]', !f.active && 'text-muted')}>
                          <td className="px-3 py-2">
                            {!searching && (
                              <span className="flex">
                                <button type="button" aria-label={`Move ${f.label} up`} disabled={i === 0} onClick={() => onMoveField(i, -1)} className="hover:bg-canvas rounded p-1 disabled:opacity-30"><ArrowUp size={14} /></button>
                                <button type="button" aria-label={`Move ${f.label} down`} disabled={i === all.length - 1} onClick={() => onMoveField(i, 1)} className="hover:bg-canvas rounded p-1 disabled:opacity-30"><ArrowDown size={14} /></button>
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <span className="text-ink font-semibold">{f.label}</span>{f.mandatory && <span className="text-brand ml-1">*</span>}
                            <span className="text-subtle block font-mono text-[11px]">{f.apiName}</span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">{typeLabel(f.dataType)}</td>
                          <td className="px-3 py-2">
                            <span className="flex flex-wrap gap-1">
                              {uses.map((u) => <Badge key={u} tone="info" shape="chip">{u}</Badge>)}
                              {!!f.displayRules?.visibleWhen?.length && <Badge tone="warning" shape="chip">Conditional</Badge>}
                              {!!f.displayRules?.requiredWhen?.length && <Badge tone="warning" shape="chip">Required when…</Badge>}
                              {f.formula && <Badge tone="neutral" shape="chip">{['CHANGED_BY', 'CHANGED_ON'].includes(String(f.formula.fn)) ? 'Stamp' : 'Formula'}</Badge>}
                              {f.validation?.format && <Badge tone="neutral" shape="chip">{f.validation.format} check</Badge>}
                              {f.sensitive && <Badge tone="brand" shape="chip">Sensitive</Badge>}
                              {f.arm !== 'BOTH' && <Badge tone="teal" shape="chip">{f.arm === 'CREDIT' ? 'Credit' : 'Capital'}</Badge>}
                            </span>
                          </td>
                          <td className="text-muted px-3 py-2 text-xs whitespace-nowrap">
                            {[f.showOnCreate && 'New form', f.showOnDetail && 'Record', f.showInList && 'List'].filter(Boolean).join(' · ') || '—'}
                          </td>
                          <td className="px-3 py-2">{f.active ? <Badge tone="success" shape="pill">Enabled</Badge> : <Badge tone="neutral" shape="pill">Disabled</Badge>}</td>
                          <td className="px-3 py-2">
                            <span className="flex justify-end gap-1">
                              <Button size="small" aria-label={`Edit ${f.label}`} onClick={() => onEditField(f)} sx={{ minWidth: 34, px: 1 }}><Pencil size={14} /></Button>
                              <Button size="small" onClick={() => onToggleField(f, uses)}>{f.active ? 'Disable' : 'Enable'}</Button>
                              {f.deletable && (
                                <Button size="small" aria-label={`Delete ${f.label}`} sx={{ minWidth: 34, px: 1 }} onClick={() => onDeleteField(f)}><Trash2 size={14} /></Button>
                              )}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function DeletedFields({ rows, loading, total, plural, onRestore }: {
  rows: (FieldDef & { deletedAt: string; deletedByName: string; recordsWithValue: number; archivedRecordsWithValue: number })[]
  loading: boolean
  total: number
  plural: string
  onRestore: (f: FieldDef) => void
}) {
  if (loading) return <div className="skeleton h-24" />
  if (!total) return <p className="text-subtle py-10 text-center text-sm">No deleted fields. Fields you delete are listed here and can be restored.</p>
  if (!rows.length) return <p className="text-subtle py-10 text-center text-sm">No deleted fields match.</p>
  return (
    <ul className="m-0 list-none divide-y divide-[color:var(--pi-line-soft)] p-0">
      {rows.map((f, i) => (
        <li key={f.id} className="animate-fade-up flex flex-wrap items-center justify-between gap-3 py-3" style={{ '--stagger': i } as React.CSSProperties}>
          <div>
            <b className="text-ink">{f.label}</b> <span className="text-subtle font-mono text-[11px]">{f.apiName}</span>
            <p className="text-muted m-0 text-xs">
              {f.section} · deleted {formatDate(f.deletedAt)} by {f.deletedByName} · values kept on {(f.recordsWithValue + f.archivedRecordsWithValue).toLocaleString('en-AU')} {plural}
            </p>
          </div>
          <Button size="small" startIcon={<RotateCcw size={14} />} onClick={() => onRestore(f)}>Restore</Button>
        </li>
      ))}
    </ul>
  )
}
