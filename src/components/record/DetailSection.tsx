import type { ReactNode } from 'react'
import { Badge, Button, Card } from '@/components/ui'
import { cn } from '@/lib/cn'

export interface FieldGridItem {
  label: string
  value: ReactNode
}

/** Dense two-column label/value grid used inside detail sections. */
export function FieldGrid({ items }: { items: readonly FieldGridItem[] }) {
  return (
    <dl className="m-0 grid gap-x-7 gap-y-3.5 px-3.5 py-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-muted mb-1 text-[10px] font-bold tracking-wide uppercase">
            {item.label}
          </dt>
          <dd className="text-text m-0 text-xs leading-snug font-semibold break-words">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export interface DetailSectionProps {
  title: string
  /** Small tag next to the title (e.g. "Investor only"). */
  tag?: ReactNode
  onEdit?: () => void
  children: ReactNode
  className?: string
}

/**
 * Detail block: tinted header row with title, optional tag and Edit action,
 * then a dense field grid or custom content (prototype `recordSection`).
 */
export function DetailSection({
  title,
  tag,
  onEdit,
  children,
  className,
}: DetailSectionProps) {
  return (
    <Card className={cn('mb-2.5 overflow-hidden', className)}>
      <div className="bg-canvas border-line flex min-h-[43px] items-center justify-between gap-3 border-b px-3.5 py-2.5">
        <h2 className="text-ink m-0 flex items-center gap-2 text-[13px] font-bold">
          {title}
          {tag && (
            <Badge tone="neutral" shape="tag">
              {tag}
            </Badge>
          )}
        </h2>
        {onEdit && <Button onClick={onEdit}>Edit</Button>}
      </div>
      {children}
    </Card>
  )
}
