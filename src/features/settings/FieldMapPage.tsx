import { Info } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/cn'
import type { ObjectKey } from '../records/api'
import { useAllFields } from '../records/hooks'
import { ObjectFieldsTab } from '../records/setup/ObjectFieldsTab'
import { FIELD_MAP_CATALOG } from './fieldMapCatalog'

/** The blocks of the client field map, in the order the field map lists them. */
const BLOCKS = [
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
] as const

/**
 * Settings → Field map and objects. Person and Entity are live: their sections and fields come from the backend
 * and every change there is saved at once (brief §2.2), so the page has no separate Save button. The other blocks
 * are records this build does not have yet; they show the client field map (EXT CRM Field Map Master Contact) as
 * a read-only reference, so nobody edits settings that would not be kept.
 */
export function FieldMapPage() {
  const [selectedBlock, setSelectedBlock] = useState<string>('Person')

  const personFieldsQuery = useAllFields('person')
  const entityFieldsQuery = useAllFields('entity')

  const currentObjectKey: ObjectKey | null =
    selectedBlock === 'Person' ? 'person' : selectedBlock === 'Entity' ? 'entity' : null

  const blockCounts: Record<string, number> = useMemo(() => {
    const counts: Record<string, number> = {}
    Object.keys(FIELD_MAP_CATALOG).forEach((key) => {
      counts[key] = FIELD_MAP_CATALOG[key]?.length ?? 0
    })
    if (personFieldsQuery.data) {
      counts.Person = personFieldsQuery.data.filter((f) => f.active !== false).length
    }
    if (entityFieldsQuery.data) {
      counts.Entity = entityFieldsQuery.data.filter((f) => f.active !== false).length
    }
    return counts
  }, [personFieldsQuery.data, entityFieldsQuery.data])

  const catalogRows = currentObjectKey ? [] : (FIELD_MAP_CATALOG[selectedBlock] ?? [])

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-3 sm:px-6">
      <div className="mb-4">
        <h1 className="text-navy text-[26px] font-black tracking-tight leading-tight">Field map configuration</h1>
        <p className="text-subtle mt-0.5 text-[13px]">
          Fields, types, required state and source notes from EXT CRM Field Map Master Contact. Person and Entity
          changes are saved as you make them.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="border-line rounded-card shadow-card bg-surface border p-4 lg:sticky lg:top-6 self-start lg:max-h-[calc(100vh-3rem)] overflow-y-auto no-scrollbar">
          <h2 className="text-navy m-0 text-base font-bold">Mapped CRM blocks</h2>
          <p className="text-subtle m-0 mt-1 mb-3 text-[13px] leading-normal">Select an object or related record block.</p>
          <nav className="space-y-1" aria-label="Field map blocks">
            {BLOCKS.map((name) => {
              const isSelected = selectedBlock === name
              const live = name === 'Person' || name === 'Entity'
              return (
                <button
                  key={name}
                  type="button"
                  aria-current={isSelected ? 'true' : undefined}
                  onClick={() => setSelectedBlock(name)}
                  className={cn(
                    'flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors',
                    isSelected
                      ? 'border-l-[3px] border-l-[#ee3f34] bg-[#fff4f2] text-[#ee3f34] font-bold'
                      : 'border-l-[3px] border-l-transparent text-[#213547] hover:bg-[#f6f8fb]',
                  )}
                >
                  <span className="truncate pr-2">{name}</span>
                  <span className={cn('text-xs font-semibold shrink-0', isSelected ? 'text-[#ee3f34]' : 'text-subtle')}>
                    {blockCounts[name] ?? 0} fields{live ? '' : ' · reference'}
                  </span>
                </button>
              )
            })}
          </nav>
        </aside>

        <main className="min-w-0">
          {currentObjectKey ? (
            <ObjectFieldsTab key={currentObjectKey} object={currentObjectKey} />
          ) : (
            <div className="border-line rounded-card shadow-card bg-surface overflow-hidden border p-4 space-y-4">
              <div>
                <h2 className="text-navy m-0 text-base font-bold">{selectedBlock} fields</h2>
                <p className="bg-info-soft text-info mt-2 mb-0 flex items-start gap-2 rounded-lg px-3 py-2 text-[13px] leading-normal">
                  <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>
                    Reference only. These rows come from the client field map. The {selectedBlock} record is not built
                    yet, so its fields can't be added or changed here; they become editable when it is.
                  </span>
                </p>
              </div>

              <div className="border-line overflow-hidden rounded-lg border">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] border-collapse text-[13px]">
                    <thead>
                      <tr className="border-b border-[#e7edf3] bg-[#f9fafc] text-left text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">
                        <th scope="col" className="px-3.5 py-2.5">Field</th>
                        <th scope="col" className="px-3.5 py-2.5">Type</th>
                        <th scope="col" className="px-3.5 py-2.5">Required</th>
                        <th scope="col" className="px-3.5 py-2.5">Picklist or rule</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf1f5]">
                      {catalogRows.map((row, idx) => {
                        const isRequired = row.required.toLowerCase().startsWith('required')
                        return (
                          <tr key={`${row.field}-${idx}`}>
                            <td className="text-ink px-3.5 py-3 font-bold">{row.field}</td>
                            <td className="text-text-soft px-3.5 py-3">{row.type}</td>
                            <td className="px-3.5 py-3">
                              <span
                                className={cn(
                                  'inline-block rounded px-2 py-0.5 text-[11px]',
                                  isRequired ? 'bg-[#fff0ef] text-[#d53b31] font-semibold' : 'bg-[#f1f4f7] text-[#65738a]',
                                )}
                              >
                                {row.required}
                              </span>
                            </td>
                            <td className="text-text-soft px-3.5 py-3 text-xs leading-snug">{row.rule || '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
