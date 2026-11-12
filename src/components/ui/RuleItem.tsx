import type { ReactNode } from 'react'

export interface RuleItemProps {
  icon: ReactNode
  title: ReactNode
  description?: ReactNode
}

/** Icon + title + helper text row used in side rails and rule lists. */
export function RuleItem({ icon, title, description }: RuleItemProps) {
  return (
    <div className="border-line-soft flex items-start gap-2.5 border-b py-[11px] last:border-b-0">
      <span className="bg-teal-soft text-teal-text grid size-[18px] shrink-0 place-items-center rounded-chip">
        {icon}
      </span>
      <span>
        <b>{title}</b>
        {description && (
          <small className="text-muted mt-0.5 block text-[13px]">{description}</small>
        )}
      </span>
    </div>
  )
}
