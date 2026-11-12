import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** Adds the standard 20px inner padding. */
  padded?: boolean
  /** Hover treatment for cards that act as links/buttons. */
  interactive?: boolean
  as?: 'section' | 'div' | 'article' | 'aside' | 'nav'
}

/** White surface with border and soft shadow — the base container for every panel. */
export function Card({
  padded = false,
  interactive = false,
  as: Tag = 'section',
  className,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={cn(
        'bg-surface border-line rounded-card shadow-card border',
        padded && 'p-5',
        interactive &&
          'hover:border-brand hover:shadow-card-hover cursor-pointer transition-shadow',
        className,
      )}
      {...rest}
    />
  )
}

export interface CardHeaderProps {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}

/** Title + helper text on the left, optional actions on the right. */
export function CardHeader({ title, description, action, className }: CardHeaderProps) {
  return (
    <div className={cn('mb-4 flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="text-navy m-0 text-lg font-bold">{title}</h2>
        {description && (
          <p className="text-muted mt-1 mb-0 text-[13px] leading-normal">{description}</p>
        )}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  )
}
