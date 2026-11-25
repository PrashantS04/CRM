import {
  ArrowDown,
  ArrowUp,
  MoreVertical,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useToast } from '@/components/feedback/toastContext'
import { cn } from '@/lib/cn'
import type { ObjectKey } from '../records/api'
import { useAllFields } from '../records/hooks'
import { ObjectFieldsTab } from '../records/setup/ObjectFieldsTab'
import { FIELD_MAP_CATALOG, type CatalogField } from './fieldMapCatalog'

export function FieldMapPage() {
  const toast = useToast()

  const [selectedBlock, setSelectedBlock] = useState<string>('Person')
  const [addingCustom, setAddingCustom] = useState(false)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [pendingToggles, setPendingToggles] = useState<Record<string, boolean>>({})
  const [customCatalogFields, setCustomCatalogFields] = useState<Record<string, CatalogField[]>>({})
  const [catalogOrders, setCatalogOrders] = useState<Record<string, CatalogField[]>>({})

  const menuRef = useRef<HTMLDivElement>(null)

  // Close action menu on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Live fields queries for counts
  const personFieldsQuery = useAllFields('person')
  const entityFieldsQuery = useAllFields('entity')

  const currentObjectKey: ObjectKey | null =
    selectedBlock === 'Person' ? 'person' : selectedBlock === 'Entity' ? 'entity' : null

  // Field counts for left menu
  const blockCounts: Record<string, number> = useMemo(() => {
    const counts: Record<string, number> = {}
    Object.keys(FIELD_MAP_CATALOG).forEach((key) => {
      counts[key] = (catalogOrders[key]?.length ?? FIELD_MAP_CATALOG[key]?.length ?? 0) + (customCatalogFields[key]?.length ?? 0)
    })
    if (personFieldsQuery.data) {
      counts.Person = personFieldsQuery.data.filter((f) => f.active !== false).length
    }
    if (entityFieldsQuery.data) {
      counts.Entity = entityFieldsQuery.data.filter((f) => f.active !== false).length
    }
    return counts
  }, [personFieldsQuery.data, entityFieldsQuery.data, customCatalogFields, catalogOrders])

  // Block names in preferred order
  const blockNames = useMemo(() => {
    return [
      'Person',
      'Entity',
      'Linked entities',
      'Linked opportunities',
      'Broker profile',
      'Panel membership',
      'Documents',
      'Note',
      'Activity',
      'Loan Opportunity',
    ]
  }, [])

  // Flat rows for non-Person/Entity blocks
  const catalogRows = useMemo(() => {
    if (currentObjectKey) return []
    const customExtra = customCatalogFields[selectedBlock] ?? []
    const customOrdered = catalogOrders[selectedBlock]
    const baseList = customOrdered ?? [...(FIELD_MAP_CATALOG[selectedBlock] ?? []), ...customExtra]

    return baseList.map((item, idx) => ({
      id: `${item.field}-${idx}`,
      field: item.field,
      type: item.type,
      required: pendingToggles[item.field] !== undefined
        ? pendingToggles[item.field]
          ? 'Required'
          : 'Optional'
        : item.required,
      rule: item.rule,
      isCustom: customExtra.some((c) => c.field === item.field),
    }))
  }, [currentObjectKey, selectedBlock, customCatalogFields, catalogOrders, pendingToggles])

  // Toggle field requirement
  const handleToggleRequired = (row: { field: string; required: string }) => {
    const currentIsRequired = row.required.toLowerCase().includes('required')
    setPendingToggles((prev) => ({
      ...prev,
      [row.field]: !currentIsRequired,
    }))
    setActiveMenuId(null)
  }

  // Move non-Person/Entity catalog row
  const handleMoveCatalogRow = (idx: number, dir: -1 | 1) => {
    const customExtra = customCatalogFields[selectedBlock] ?? []
    const currentList = catalogOrders[selectedBlock] ?? [...(FIELD_MAP_CATALOG[selectedBlock] ?? []), ...customExtra]
    const target = idx + dir
    if (target < 0 || target >= currentList.length) return
    const next = [...currentList]
    ;[next[idx], next[target]] = [next[target]!, next[idx]!]
    setCatalogOrders((prev) => ({ ...prev, [selectedBlock]: next }))
    toast.success('Field position adjusted')
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-3 sm:px-6">
      {/* Page Header */}
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-navy text-[26px] font-black tracking-tight leading-tight">
            Field map configuration
          </h1>
          <p className="text-subtle mt-0.5 text-[13px]">
            Fields, types, required state and source notes from EXT CRM Field Map Master Contact.
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={() => toast.success('Field map changes saved')}
            className="inline-flex items-center justify-center rounded-lg bg-[#ee3f34] px-4 py-2 text-xs font-bold text-white shadow-[0_4px_10px_rgba(238,63,52,0.2)] transition-all hover:bg-[#d53b31] active:scale-[0.98] cursor-pointer"
          >
            Save changes
          </button>
        </div>
      </div>

      {/* 2-Column Layout: 260px (Left), 1fr (Center) */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[260px_1fr]">
        {/* LEFT COLUMN: Mapped CRM blocks (Sticky rail) */}
        <aside className="border-line rounded-card shadow-card bg-surface border p-4 sticky top-6 self-start max-h-[calc(100vh-3rem)] overflow-y-auto no-scrollbar">
          <h2 className="text-navy m-0 text-base font-bold">Mapped CRM blocks</h2>
          <p className="text-subtle m-0 mt-1 mb-3 text-[13px] leading-normal">
            Select an object or related record block.
          </p>

          <nav className="space-y-1">
            {blockNames.map((name) => {
              const isSelected = selectedBlock === name
              const count = blockCounts[name] ?? 0

              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSelectedBlock(name)}
                  className={cn(
                    'flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors',
                    isSelected
                      ? 'border-l-[3px] border-l-[#ee3f34] bg-[#fff4f2] text-[#ee3f34] font-bold'
                      : 'border-l-[3px] border-l-transparent text-[#213547] hover:bg-[#f6f8fb]',
                  )}
                >
                  <span className="truncate pr-2">{name}</span>
                  <span
                    className={cn(
                      'text-xs font-semibold shrink-0',
                      isSelected ? 'text-[#ee3f34]' : 'text-subtle',
                    )}
                  >
                    {count} fields
                  </span>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* CENTER COLUMN: Exactly matches Image 2 for Person & Entity, or catalog block */}
        <main className="min-w-0">
          {currentObjectKey ? (
            <ObjectFieldsTab key={currentObjectKey} object={currentObjectKey} />
          ) : (
            <div className="border-line rounded-card shadow-card bg-surface overflow-hidden border p-4 space-y-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <h2 className="text-navy m-0 text-base font-bold">{selectedBlock} fields</h2>
                  <p className="text-subtle m-0 mt-1 text-[13px] leading-normal">
                    Field source: Contact field map. Required values and configured choices can be maintained in Settings.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddingCustom(true)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#ee3f34] px-3.5 py-1.5 text-xs font-bold text-white shadow-[0_2px_6px_rgba(238,63,52,0.2)] transition-all hover:bg-[#d53b31] active:scale-[0.98]"
                >
                  <Plus className="size-3.5 stroke-[2.5]" />
                  <span>Add custom field</span>
                </button>
              </div>

              <div className="border-line overflow-hidden rounded-lg border">
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-[48px_1.4fr_0.85fr_0.6fr_1fr_32px] items-center gap-2 border-b border-[#e7edf3] bg-[#f9fafc] px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">
                    <span className="text-center">Order</span>
                    <span>Field</span>
                    <span>Type</span>
                    <span>Required</span>
                    <span>Picklist or rule</span>
                    <span className="text-right"></span>
                  </div>

                  <div className="divide-y divide-[#edf1f5]">
                    {catalogRows.map((row, idx) => {
                      const isRequired = row.required.toLowerCase().includes('required')
                      const isMenuOpen = activeMenuId === row.id

                      return (
                        <div
                          key={row.id}
                          className="grid grid-cols-[48px_1.4fr_0.85fr_0.6fr_1fr_32px] items-center gap-2 px-3.5 py-3 text-[13px] hover:bg-[#fafbfc]"
                        >
                          <div className="flex items-center justify-center gap-0.5">
                            <button
                              type="button"
                              aria-label={`Move ${row.field} up`}
                              disabled={idx === 0}
                              onClick={() => handleMoveCatalogRow(idx, -1)}
                              className="rounded p-0.5 text-[#9ca3af] hover:text-[#111827] hover:bg-[#e7edf3] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                              title="Move field up"
                            >
                              <ArrowUp className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Move ${row.field} down`}
                              disabled={idx === catalogRows.length - 1}
                              onClick={() => handleMoveCatalogRow(idx, 1)}
                              className="rounded p-0.5 text-[#9ca3af] hover:text-[#111827] hover:bg-[#e7edf3] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                              title="Move field down"
                            >
                              <ArrowDown className="size-3.5" />
                            </button>
                          </div>

                          <div className="min-w-0 pr-1">
                            <span className="text-ink font-bold">{row.field}</span>
                            {row.isCustom && (
                              <span className="ml-1.5 rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold text-brand-dark">
                                Custom
                              </span>
                            )}
                          </div>

                          <div className="text-text-soft truncate pr-1">{row.type}</div>

                          <div>
                            <button
                              type="button"
                              onClick={() => handleToggleRequired(row)}
                              title="Click to toggle Required / Optional"
                              className={cn(
                                'inline-block cursor-pointer rounded px-2 py-0.5 text-[11px] transition-colors',
                                isRequired
                                  ? 'bg-[#fff0ef] text-[#d53b31] font-semibold hover:bg-brand-soft'
                                  : 'bg-[#f1f4f7] text-[#65738a] font-normal hover:bg-line',
                              )}
                            >
                              {row.required}
                            </button>
                          </div>

                          <div className="text-text-soft text-xs leading-snug line-clamp-2 pr-1">
                            {row.rule || '—'}
                          </div>

                          <div className="relative text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setActiveMenuId(isMenuOpen ? null : row.id)
                              }}
                              className="hover:bg-line/60 rounded p-1 text-[#9ca3af] hover:text-[#374151]"
                              aria-label="Actions"
                            >
                              <MoreVertical className="size-4" />
                            </button>

                            {isMenuOpen && (
                              <div
                                ref={menuRef}
                                className="bg-surface border-line rounded-dropdown shadow-menu absolute right-0 top-full z-20 mt-1 min-w-[170px] border py-1 text-left"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleToggleRequired(row)}
                                  className="hover:bg-surface-alt flex w-full items-center gap-2 px-3 py-1.5 text-xs text-ink"
                                >
                                  {isRequired ? (
                                    <>
                                      <ToggleLeft className="size-3.5 text-muted" />
                                      <span>Set as Optional</span>
                                    </>
                                  ) : (
                                    <>
                                      <ToggleRight className="size-3.5 text-brand" />
                                      <span>Set as Required</span>
                                    </>
                                  )}
                                </button>

                                {row.isCustom && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCustomCatalogFields((prev) => ({
                                        ...prev,
                                        [selectedBlock]: (prev[selectedBlock] ?? []).filter((f) => f.field !== row.field),
                                      }))
                                      toast.success(`Field "${row.field}" removed`)
                                      setActiveMenuId(null)
                                    }}
                                    className="hover:bg-brand-soft/40 flex w-full items-center gap-2 px-3 py-1.5 text-xs text-brand-dark"
                                  >
                                    <Trash2 className="size-3.5 text-brand" />
                                    <span>Delete field</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Simple Custom Field Dialog for Non-Person/Entity Blocks */}
      {!currentObjectKey && addingCustom && (
        <SimpleCustomFieldModal
          blockName={selectedBlock}
          onClose={() => setAddingCustom(false)}
          onAdd={(newField) => {
            setCustomCatalogFields((prev) => ({
              ...prev,
              [selectedBlock]: [...(prev[selectedBlock] ?? []), newField],
            }))
            setAddingCustom(false)
            toast.success(`Custom field "${newField.field}" added to ${selectedBlock}`)
          }}
        />
      )}
    </div>
  )
}

function SimpleCustomFieldModal({
  blockName,
  onClose,
  onAdd,
}: {
  blockName: string
  onClose: () => void
  onAdd: (f: CatalogField) => void
}) {
  const [label, setLabel] = useState('')
  const [type, setType] = useState('Text')
  const [required, setRequired] = useState(false)
  const [rule, setRule] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) return
    onAdd({
      field: label.trim(),
      type,
      required: required ? 'Required' : 'Optional',
      rule: rule.trim(),
    })
  }

  return (
    <div className="bg-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-surface border-line rounded-dialog shadow-dialog animate-pop w-full max-w-md border p-6">
        <h3 className="text-ink m-0 text-lg font-bold">Add custom field to {blockName}</h3>
        <p className="text-muted mt-1 text-xs">Configure the field label, data type, and validation rules.</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label htmlFor="cf-label" className="text-text mb-1 block text-xs font-semibold">Field label</label>
            <input
              id="cf-label"
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Risk classification"
              className="border-line focus:border-brand h-9 w-full rounded-md border px-3 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="cf-type" className="text-text mb-1 block text-xs font-semibold">Field type</label>
            <select
              id="cf-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="border-line focus:border-brand h-9 w-full rounded-md border bg-white px-2.5 text-sm focus:outline-none"
            >
              <option value="Text">Text</option>
              <option value="Numeric">Numeric</option>
              <option value="Date">Date</option>
              <option value="Single-select picklist">Single-select picklist</option>
              <option value="Multi-select picklist">Multi-select picklist</option>
              <option value="Boolean">Boolean</option>
              <option value="Currency">Currency</option>
              <option value="URL">URL</option>
            </select>
          </div>

          <div>
            <label htmlFor="cf-rule" className="text-text mb-1 block text-xs font-semibold">Picklist or rule description</label>
            <input
              id="cf-rule"
              type="text"
              value={rule}
              onChange={(e) => setRule(e.target.value)}
              placeholder="e.g. High, Medium, Low"
              className="border-line focus:border-brand h-9 w-full rounded-md border px-3 text-sm focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="req-checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="accent-brand size-4 cursor-pointer rounded"
            />
            <label htmlFor="req-checkbox" className="text-text cursor-pointer text-xs font-medium">
              Required field
            </label>
          </div>

          <div className="mt-5 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="border-line text-text hover:bg-surface-alt cursor-pointer rounded-lg border px-4 py-2 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-brand text-white hover:bg-brand-dark cursor-pointer rounded-lg px-4 py-2 text-xs font-semibold"
            >
              Add field
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
