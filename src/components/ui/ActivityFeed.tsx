import { CalendarDays, CheckSquare, Mail, Pencil, Phone, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { ActivityItem, ActivityKind } from '@/types/domain'
import { EmptyState } from './EmptyState'

const ICON: Record<ActivityKind, { Icon: LucideIcon; className: string }> = {
  task: { Icon: CheckSquare, className: 'bg-teal-soft text-teal-text' },
  event: { Icon: CalendarDays, className: 'bg-purple-soft text-purple' },
  email: { Icon: Mail, className: 'bg-canvas text-neutral-text' },
  call: { Icon: Phone, className: 'bg-teal-soft text-teal-text' },
  note: { Icon: Pencil, className: 'bg-teal-soft text-teal-text' },
}

export interface ActivityFeedProps {
  items: readonly ActivityItem[]
}

/** Grouped activity list: tasks, calendar pointers, email pointers, calls and notes. */
export function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) return <EmptyState>No activity yet.</EmptyState>

  const groups = [...new Set(items.map((item) => item.group))]
  return (
    <div>
      {groups.map((group) => (
        <section key={group} aria-label={group}>
          <h3 className="bg-canvas mt-3.5 mb-0 rounded-md px-3 py-[9px] text-xs font-bold">
            {group}
          </h3>
          <ul className="m-0 list-none p-0">
            {items
              .filter((item) => item.group === group)
              .map((item) => {
                const { Icon, className } = ICON[item.kind]
                return (
                  <li
                    key={item.id}
                    className="border-line-soft grid grid-cols-[30px_1fr_auto] gap-2.5 border-b px-2 py-3.5"
                  >
                    <span className={cn('grid size-7 place-items-center rounded-[7px]', className)}>
                      <Icon size={15} aria-hidden />
                    </span>
                    <div>
                      <b>{item.title}</b>
                      <small className="text-muted mt-0.5 block text-xs">{item.detail}</small>
                      <div className="text-muted mt-1 text-[11px]">{item.meta}</div>
                    </div>
                    <span
                      className={cn(
                        'text-[11px] whitespace-nowrap',
                        item.alert ? 'text-brand' : 'text-muted',
                      )}
                    >
                      {item.status}
                    </span>
                  </li>
                )
              })}
          </ul>
        </section>
      ))}
    </div>
  )
}
