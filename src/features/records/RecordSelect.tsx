import { Loader2, Search, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { errorMessage } from '@/api/crmClient'
import { cn } from '@/lib/cn'
import { lookupRecords, type LookupItem, type ObjectKey } from './api'
import { FieldLabel, inputClass } from './fields/FieldInput'

const PAGE = 20

/**
 * Searchable picker for Persons or Entities. Searches the server as you type (debounced) and loads more on
 * demand, so it never loads every record. `only` narrows the choice, e.g. Entities whose type is Aggregator.
 */
export function RecordSelect({ object, label, value, onChange, exclude = [], required, only, placeholder, error }: {
  object: ObjectKey
  label?: string
  value: LookupItem | null
  onChange: (v: LookupItem | null) => void
  exclude?: string[]
  required?: boolean
  only?: { field: string; values: string[] }
  placeholder?: string
  error?: string
}) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<LookupItem[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState<string | null>(null)
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const listId = useId()
  const skip = exclude.join(',')
  const filter = only ? `${only.field}:${only.values.join(',')}` : ''

  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await lookupRecords(object, { q, page: 0, size: PAGE, exclude: skip ? skip.split(',') : [], ...(only ?? {}) })
        if (!cancelled) {
          setItems(res.items)
          setHasMore(res.hasMore)
          setPage(0)
          setActive(0)
          setFailed(null)
        }
      } catch (e) {
        if (!cancelled) setFailed(errorMessage(e, 'Search failed.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 220)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, open, skip, object, filter])

  const more = async () => {
    setLoading(true)
    try {
      const res = await lookupRecords(object, { q, page: page + 1, size: PAGE, exclude: skip ? skip.split(',') : [], ...(only ?? {}) })
      setItems((cur) => [...cur, ...res.items])
      setHasMore(res.hasMore)
      setPage((p) => p + 1)
    } finally {
      setLoading(false)
    }
  }

  const pick = (item: LookupItem) => {
    onChange(item)
    setOpen(false)
    setQ('')
  }

  return (
    <div ref={ref} className="relative">
      {label && <FieldLabel required={required}>{label}</FieldLabel>}
      {value ? (
        <div className={cn(inputClass, 'flex items-center justify-between gap-2')}>
          <span className="min-w-0 truncate">
            <b className="text-ink">{value.title}</b>
            {value.subtitle && <span className="text-muted ml-2 text-xs">{value.subtitle}</span>}
          </span>
          <button type="button" aria-label={`Clear ${value.title}`} onClick={() => onChange(null)} className="text-subtle hover:text-text">
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search size={16} className="text-subtle pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" />
          <input role="combobox" aria-expanded={open} aria-controls={listId} aria-autocomplete="list" value={q}
            placeholder={placeholder ?? (object === 'entity' ? 'Search by name, ACN or ABN' : 'Search by name, email or mobile')}
            onFocus={() => setOpen(true)} onChange={(e) => { setQ(e.target.value); setOpen(true) }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)) }
              if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
              if (e.key === 'Enter' && items[active]) { e.preventDefault(); pick(items[active]) }
              if (e.key === 'Escape') setOpen(false)
            }}
            className={cn(inputClass, 'pl-9', error && 'border-brand')} />
          {loading && <Loader2 size={16} className="text-subtle absolute top-1/2 right-3 -translate-y-1/2 animate-spin" />}
        </div>
      )}
      {error && <span className="text-brand-dark mt-1 block text-xs">{error}</span>}
      {open && !value && (
        <div id={listId} role="listbox" className="border-line bg-surface shadow-dialog animate-pop absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-control border p-1">
          {failed && <p className="text-brand-dark m-0 px-3 py-2 text-sm">{failed}</p>}
          {!failed && items.length === 0 && !loading && <p className="text-muted m-0 px-3 py-2 text-sm">No matches.</p>}
          {items.map((item, i) => (
            <div key={item.id} role="option" aria-selected={i === active}>
              <button type="button" onMouseEnter={() => setActive(i)} onClick={() => pick(item)}
                className={cn('w-full rounded-input px-3 py-2 text-left transition-colors', i === active ? 'bg-brand-tint' : 'hover:bg-canvas')}>
                <span className="text-ink block text-sm font-semibold">{item.title}</span>
                {item.subtitle && <span className="text-muted block text-xs">{item.subtitle}</span>}
              </button>
            </div>
          ))}
          {hasMore && (
            <button type="button" onClick={more} className="text-brand w-full px-3 py-2 text-left text-xs font-bold">Load more…</button>
          )}
        </div>
      )}
    </div>
  )
}
