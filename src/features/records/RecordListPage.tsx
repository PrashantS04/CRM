import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { errorMessage } from '@/api/crmClient'
import { Avatar, Badge, Button, PageHeader } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { ObjectKey, SearchRequest } from './api'
import { FieldValue } from './fields/FieldValue'
import { Select, inputClass } from './fields/FieldInput'
import type { Condition } from './fields/types'
import { FilterPanel } from './FilterPanel'
import { NO_FILTERS, describeCondition, filterableFields, parseFilters, serializeFilters, type Filters } from './filters'
import { useObjectInfo, useRecordConfig, useRecordSearch } from './hooks'
import { NewRecordDialog } from './NewRecordDialog'

const PAGE_SIZE = 25

const DESCRIPTION: Record<ObjectKey, string> = {
  person: 'One record for each natural person, with their relationships and CRM activity in one place.',
  entity: 'Companies, trusts and other organisations. Search by name, ACN or ABN.',
}

type View = 'all' | 'mine' | 'review' | 'duplicates' | 'archived'

/**
 * People or Entities: search, filter by type, standard views (all, mine, review queue, possible duplicates,
 * archived), sortable columns and paging, all on the server. Columns are the fields set to show in the list.
 */
export function RecordListPage({ object }: { object: ObjectKey }) {
  const info = useObjectInfo(object)
  const config = useRecordConfig(object)
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [creating, setCreating] = useState(false)
  const [filtering, setFiltering] = useState(false)
  const rawFilters = params.get('filters')
  const filters = useMemo(() => parseFilters(rawFilters), [rawFilters])
  const view = (params.get('view') as View) || 'all'
  const type = params.get('type') ?? ''
  const page = Number(params.get('page') ?? 0)
  const sortField = params.get('sort')
  const sortDir = (params.get('dir') as 'ASC' | 'DESC') || 'ASC'
  const plural = info.plural.toLowerCase() === 'persons' ? 'people' : info.plural.toLowerCase()

  const set = (patch: Record<string, string | null>) =>
    setParams((cur) => {
      const next = new URLSearchParams(cur)
      Object.entries(patch).forEach(([k, v]) => (v === null || v === '' ? next.delete(k) : next.set(k, v)))
      return next
    }, { replace: true })

  const applyFilters = (f: Filters) => set({ filters: serializeFilters(f), page: null })

  useEffect(() => {
    const t = setTimeout(() => { if ((params.get('q') ?? '') !== q) set({ q, page: null }) }, 280)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const typeField = config.rules?.typeField ? config.field(config.rules.typeField) : undefined
  const queue = config.rules?.reviewQueue
  // A filter on a field that was since deleted or disabled is left out (and its logic with it).
  const known = new Set(config.fields.map((f) => f.apiName))
  const userConditions = config.loading ? filters.conditions : filters.conditions.filter((c) => known.has(c.field))
  const userLogic = userConditions.length === filters.conditions.length ? filters.logic : ''
  // The panel's filters come first, so their numbers match the logic; the type and view filters are ANDed on.
  const conditions: Condition[] = [...userConditions]
  if (type && typeField) {
    conditions.push({ field: typeField.apiName, operator: typeField.dataType === 'MULTI_PICKLIST' ? 'CONTAINS_ANY' : 'IN', value: [type] })
  }
  if (view === 'review' && queue) {
    conditions.push({ field: queue.field, operator: config.field(queue.field)?.dataType === 'MULTI_PICKLIST' ? 'CONTAINS_ANY' : 'IN', value: queue.values })
  }
  const req: SearchRequest = {
    q: params.get('q') || undefined,
    scope: view === 'archived' ? 'ARCHIVED' : 'ACTIVE',
    ownerScope: view === 'mine' ? 'MINE' : 'ALL',
    flag: view === 'duplicates' ? 'POSSIBLE_DUPLICATE' : undefined,
    conditions,
    logic: userLogic
      ? [`(${userLogic})`, ...conditions.slice(userConditions.length).map((_, i) => String(userConditions.length + i + 1))].join(' AND ')
      : undefined,
    sort: sortField ? [{ field: sortField, dir: sortDir }] : undefined,
    page,
    size: PAGE_SIZE,
  }
  const search = useRecordSearch(object, req, !config.loading)
  const result = search.data
  const columns = useMemo(
    () => (result?.columns ?? []).map((c) => config.field(c)).filter((f) => !!f && f.apiName !== typeField?.apiName),
    [result?.columns, config, typeField],
  )
  const total = result?.totalElements ?? 0
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1
  const to = Math.min(total, (page + 1) * PAGE_SIZE)

  const views: { id: View; label: string; show: boolean }[] = [
    { id: 'all', label: `All ${plural}`, show: true },
    { id: 'mine', label: `My ${plural}`, show: !!config.rules?.ownerField },
    { id: 'review', label: 'Needs review', show: !!queue },
    { id: 'duplicates', label: 'Possible duplicates', show: true },
    { id: 'archived', label: `Archived ${plural}`, show: config.can(`${info.perm}_ARCHIVE`) },
  ]

  return (
    <>
      <div className="animate-fade-up">
        <PageHeader
          title={info.plural === 'Persons' ? 'People' : info.plural}
          description={DESCRIPTION[object]}
          actions={config.can(`${info.perm}_CREATE`) && (
            <Button variant="primary" startIcon={<Plus size={16} />} onClick={() => setCreating(true)}>
              New {info.singular.toLowerCase()}
            </Button>
          )}
        />
      </div>

      <div className="animate-fade-up mb-[18px] flex flex-wrap items-center gap-[9px]" style={{ '--stagger': 1 } as React.CSSProperties}>
        <div className="relative w-full max-w-[340px]">
          <Search size={16} className="text-subtle pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" />
          <input aria-label={`Search ${plural}`} value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={object === 'entity' ? 'Search by name, ACN or ABN' : 'Search by name, email or phone'} className={cn(inputClass, 'pl-9')} />
        </div>
        {typeField && (
          <Select aria-label={`Filter by ${typeField.label}`} value={type} onChange={(e) => set({ type: e.target.value, page: null })} className="w-auto min-w-[170px]">
            <option value="">All {typeField.label.toLowerCase().replace(/^type of /, '').replace(/ type$/, '')} types</option>
            {(config.picklists[typeField.picklist ?? '']?.values ?? []).filter((v) => v.active).map((v) => (
              <option key={v.code} value={v.code}>{v.label}</option>
            ))}
          </Select>
        )}
        <Select aria-label="View" value={view} onChange={(e) => set({ view: e.target.value === 'all' ? null : e.target.value, page: null })} className="w-auto min-w-[170px]">
          {views.filter((v) => v.show).map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
        </Select>
        <Button variant={userConditions.length ? 'ghost' : 'secondary'} onClick={() => setFiltering(true)}
          disabled={config.loading || !filterableFields(config).length}
          startIcon={<SlidersHorizontal size={15} />} aria-label={`Filters${userConditions.length ? ` (${userConditions.length} applied)` : ''}`}>
          Filters
          {userConditions.length > 0 && (
            <span key={userConditions.length} className="bg-brand animate-pop ml-1.5 rounded-full px-1.5 text-[11px] leading-[18px] font-bold text-white tabular-nums">
              {userConditions.length}
            </span>
          )}
        </Button>
        <span className="text-muted ml-auto text-xs tabular-nums">
          {search.isFetching && !search.isPending ? 'Updating…' : `${total.toLocaleString('en-AU')} ${total === 1 ? info.singular.toLowerCase() : plural}`}
        </span>
      </div>

      {userConditions.length > 0 && (
        <div className="animate-fade mb-[14px] flex flex-wrap items-center gap-2" aria-label="Applied filters" role="group">
          {userConditions.map((c, i) => (
            <span key={`${i}-${c.field}`} className="border-brand-border bg-brand-tint text-brand-dark animate-pop inline-flex max-w-[360px] items-center gap-1.5 rounded-full border py-1 pr-1 pl-2.5 text-xs font-semibold"
              style={{ animationDelay: `${i * 40}ms` }}>
              {userLogic && <span className="text-brand tabular-nums">{i + 1}.</span>}
              <span className="truncate" title={describeCondition(c, config.field(c.field), config)}>{describeCondition(c, config.field(c.field), config)}</span>
              <button type="button" aria-label={`Remove filter ${describeCondition(c, config.field(c.field), config)}`}
                onClick={() => applyFilters({ conditions: userConditions.filter((_, j) => j !== i), logic: '' })}
                className="hover:bg-brand-soft grid size-5 place-items-center rounded-full transition-colors">
                <X size={12} />
              </button>
            </span>
          ))}
          {userLogic && <span className="text-muted text-xs">Logic: <span className="font-mono">{userLogic}</span></span>}
          <Button variant="link" onClick={() => applyFilters(NO_FILTERS)}>Clear filters</Button>
        </div>
      )}

      {(search.error || config.error) && (
        <div role="alert" className="bg-brand-soft text-brand-dark animate-fade mb-4 flex items-center justify-between rounded-control px-4 py-3 text-sm">
          {errorMessage(search.error ?? config.error, `Could not load ${plural}.`)}
          <Button onClick={() => void search.refetch()}>Try again</Button>
        </div>
      )}

      <div className="border-line bg-surface shadow-card animate-fade-up overflow-hidden rounded-card border" style={{ '--stagger': 2 } as React.CSSProperties}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-[13px]" aria-busy={search.isFetching}>
            <thead>
              <tr className="bg-surface-alt text-left text-[11px] font-bold tracking-[0.2px] text-[color:var(--pi-text-soft)] uppercase">
                <th className="border-line-soft sticky left-0 z-10 border-b bg-[color:var(--pi-surface-alt)] px-[15px] py-[13px]">{info.singular === 'Person' ? 'Person' : 'Entity'}</th>
                {typeField && <th className="border-line-soft border-b px-[15px] py-[13px]">Type</th>}
                {columns.map((c) => (
                  <th key={c!.apiName} className="border-line-soft border-b px-[15px] py-[13px] whitespace-nowrap">
                    {c!.sortable && !c!.formula ? (
                      <button type="button" onClick={() => set({ sort: c!.apiName, dir: sortField === c!.apiName && sortDir === 'ASC' ? 'DESC' : 'ASC', page: null })}
                        className="hover:text-ink inline-flex items-center gap-1 uppercase transition-colors">
                        {c!.label}
                        {sortField === c!.apiName && (sortDir === 'ASC' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                      </button>
                    ) : c!.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={cn('transition-opacity duration-200', search.isFetching && !search.isPending && 'opacity-60')}>
              {(search.isPending || config.loading) && Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}><td colSpan={columns.length + 2} className="border-line-soft border-b px-[15px] py-3"><span className="sr-only">Loading</span><div className="skeleton h-6" /></td></tr>
              ))}
              {result?.items.map((item, i) => {
                const types = typeField ? item.values[typeField.apiName] : undefined
                const typeCodes = Array.isArray(types) ? (types as string[]) : types ? [String(types)] : []
                return (
                  <tr key={item.id} onClick={() => navigate(`${info.route}/${item.id}${item.archived ? '?archived=1' : ''}`)}
                    className="group animate-fade-up cursor-pointer transition-colors hover:bg-[color:var(--pi-brand-tint)]" style={{ '--stagger': Math.min(i, 14) } as React.CSSProperties}>
                    <td className="border-line-soft sticky left-0 border-b bg-surface px-[15px] py-[13px] group-hover:bg-[color:var(--pi-brand-tint)]">
                      <span className="flex items-center gap-2.5">
                        <Avatar name={item.title} />
                        <a href={`${info.route}/${item.id}`} onClick={(e) => e.preventDefault()} className="text-brand font-bold whitespace-nowrap no-underline">{item.title}</a>
                        {item.hot && !item.archived && <Badge tone="brand" shape="chip" title="Hot: moves to the top of lists">Hot</Badge>}
                        {item.archived && <Badge tone="neutral" shape="chip">Archived</Badge>}
                      </span>
                    </td>
                    {typeField && (
                      <td className="border-line-soft border-b px-[15px] py-[13px]">
                        <span className="flex flex-wrap gap-1">
                          {typeCodes.map((c) => <Badge key={c} tone={queue?.values.includes(c) ? 'warning' : 'teal'} shape="chip">{config.optionLabel(typeField.picklist, c)}</Badge>)}
                        </span>
                      </td>
                    )}
                    {columns.map((c) => (
                      <td key={c!.apiName} className="border-line-soft text-text border-b px-[15px] py-[13px] whitespace-nowrap">
                        <FieldValue dataType={c!.dataType} picklist={c!.picklist} value={item.values[c!.apiName]} compact
                          optionLabel={config.optionLabel} userName={config.userName} />
                      </td>
                    ))}
                  </tr>
                )
              })}
              {result && result.items.length === 0 && !search.isFetching && (
                <tr>
                  <td colSpan={columns.length + 2} className="text-subtle animate-fade px-4 py-[42px] text-center">
                    No {plural} match this view{params.get('q') ? ' and search' : ''}{userConditions.length ? ' and filters' : ''}.
                    {(params.get('q') || userConditions.length > 0 || type) && (
                      <button type="button" className="text-brand ml-2 font-bold"
                        onClick={() => { setQ(''); set({ q: null, type: null, filters: null, page: null }) }}>
                        Clear search and filters
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-line-soft text-muted flex items-center justify-between border-t px-4 py-3 text-xs">
          <span className="tabular-nums">{total ? `${from}–${to} of ${total.toLocaleString('en-AU')}` : ''}</span>
          <div className="flex gap-1">
            <Button aria-label="Previous page" disabled={page === 0} onClick={() => set({ page: String(page - 1) })} sx={{ minWidth: 36, px: 1 }}>
              <ChevronLeft size={16} />
            </Button>
            <Button aria-label="Next page" disabled={!result || page + 1 >= result.totalPages} onClick={() => set({ page: String(page + 1) })} sx={{ minWidth: 36, px: 1 }}>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>

      {filtering && (
        <FilterPanel object={object} config={config} value={{ conditions: userConditions, logic: userLogic }}
          onClose={() => setFiltering(false)} onApply={(f) => { applyFilters(f); setFiltering(false) }} />
      )}
      <NewRecordDialog object={object} open={creating} onClose={() => setCreating(false)} />
    </>
  )
}
