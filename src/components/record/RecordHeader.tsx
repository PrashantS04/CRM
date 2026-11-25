import type { ReactNode } from 'react'
import { Card } from '@/components/ui'
import { cn } from '@/lib/cn'

export interface RecordHeaderProps {
  /** Full name or record title. */
  name: string
  /** Short badge under the name (record type, entity type...). */
  badge?: ReactNode
  /** Avatar initials; derived from `name` when omitted. */
  initials?: string
  /** e.g. "Sales stage" label + control, "Owner" label + value pairs. */
  meta?: { label: string; value: ReactNode }[]
  actions?: ReactNode
  /** Optional strip rendered under the header row (e.g. stage flow). */
  footer?: ReactNode
}

function deriveInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}

/**
 * Record-page header card: avatar, name, type badge, key meta fields and
 * quick actions — the shared top block for Person, Entity, Task and
 * Opportunity detail pages (prototype `recordTop`).
 */
export function RecordHeader({
  name,
  badge,
  initials,
  meta = [],
  actions,
  footer,
}: RecordHeaderProps) {
  return (
    <Card padded>
      <div className="flex flex-wrap items-center gap-4">
        <span
          aria-hidden
          className="bg-info-soft text-info flex size-[42px] shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold"
        >
          {initials ?? deriveInitials(name)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-ink m-0 text-[21px] leading-tight font-bold tracking-tight">
            {name}
          </h1>
          {badge && (
            <span className="bg-info-soft text-info mt-1 inline-block rounded-pill px-2 py-[3px] text-[10px] font-bold">
              {badge}
            </span>
          )}
        </div>
        {meta.map((item) => (
          <div key={item.label} className="min-w-0">
            <small className="text-muted block text-[11px]">{item.label}</small>
            <div className="text-text mt-0.5 text-[13px] font-semibold">{item.value}</div>
          </div>
        ))}
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {footer && <div className={cn('mt-4 border-t border-line pt-3')}>{footer}</div>}
    </Card>
  )
}
