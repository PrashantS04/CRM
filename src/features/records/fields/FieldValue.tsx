import { Mail, Phone } from 'lucide-react'
import { Badge } from '@/components/ui'
import { formatDate } from '@/lib/format'
import { listItems } from './logic'
import type { DataType } from './types'

const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 })

function PhoneLink({ value }: { value: string }) {
  return (
    <a href={`tel:${value.replace(/[^\d+]/g, '')}`} onClick={(e) => e.stopPropagation()}
      className="text-text hover:text-brand inline-flex items-center gap-1.5 whitespace-nowrap no-underline transition-colors">
      <Phone size={13} className="text-subtle shrink-0" />
      {value}
    </a>
  )
}

function EmailLink({ value }: { value: string }) {
  return (
    <a href={`mailto:${value}`} onClick={(e) => e.stopPropagation()} title="Open a new email"
      className="text-text hover:text-brand inline-flex min-w-0 items-center gap-1.5 no-underline transition-colors">
      <Mail size={13} className="text-subtle shrink-0" />
      <span className="truncate">{value}</span>
    </a>
  )
}

/** Read-only display of a stored value, formatted by its field type. */
export function FieldValue({ dataType, picklist, value, compact, optionLabel, userName }: {
  dataType: DataType
  picklist?: string | null
  value: unknown
  /** One line, for list columns: a phone or email list shows its primary item only. */
  compact?: boolean
  optionLabel: (setCode: string | null | undefined, code: string) => string
  userName: (id: string) => string
}) {
  if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
    return <span className="text-subtle">—</span>
  }
  switch (dataType) {
    case 'CURRENCY':
      return <span className="tabular-nums">{money.format(Number(value))}</span>
    case 'PERCENT':
      return <span className="tabular-nums">{String(value)}%</span>
    case 'NUMBER':
      return <span className="tabular-nums">{Number(value).toLocaleString('en-AU')}</span>
    case 'DATE':
      return <>{formatDate(String(value))}</>
    case 'CHECKBOX':
    case 'BOOLEAN':
      return <>{value === true ? 'Yes' : 'No'}</>
    case 'PICKLIST':
      return <>{optionLabel(picklist, String(value))}</>
    case 'MULTI_PICKLIST':
      return (
        <span className="flex flex-wrap gap-1">
          {(value as string[]).map((c) => <Badge key={c} tone="teal" shape="chip">{optionLabel(picklist, c)}</Badge>)}
        </span>
      )
    case 'USER':
      return <>{userName(String(value))}</>
    case 'EMAIL':
      return <EmailLink value={String(value)} />
    case 'PHONE':
      return <PhoneLink value={String(value)} />
    case 'PHONE_LIST':
    case 'EMAIL_LIST': {
      const items = [...listItems(value)].sort((a, b) => Number(b.primary) - Number(a.primary))
      if (!items.length) return <span className="text-subtle">—</span>
      const one = (v: string) => (dataType === 'PHONE_LIST' ? <PhoneLink value={v} /> : <EmailLink value={v} />)
      if (compact) {
        return (
          <span className="inline-flex min-w-0 items-center gap-1.5">
            {one(items[0].value)}
            {items.length > 1 && <span className="text-subtle text-xs">+{items.length - 1}</span>}
          </span>
        )
      }
      return (
        <ul className="m-0 list-none space-y-1 p-0">
          {items.map((i) => (
            <li key={i.value} className="flex flex-wrap items-center gap-2">
              {one(i.value)}
              <span className="text-subtle text-xs font-normal">{optionLabel(picklist, i.label)}</span>
              {i.primary && items.length > 1 && <Badge tone="info" shape="chip">Primary</Badge>}
            </li>
          ))}
        </ul>
      )
    }
    case 'URL': {
      const href = /^https?:\/\//i.test(String(value)) ? String(value) : `https://${String(value)}`
      return (
        <a className="text-brand no-underline hover:underline" href={href} target="_blank" rel="noreferrer noopener"
          onClick={(e) => e.stopPropagation()}>
          {String(value)}
        </a>
      )
    }
    default:
      return <span className="whitespace-pre-wrap">{String(value)}</span>
  }
}
