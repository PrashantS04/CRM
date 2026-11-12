import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface EmptyStateProps {
  children: ReactNode
  className?: string
}

export function EmptyState({ children, className }: EmptyStateProps) {
  return <p className={cn('text-subtle m-0 px-4 py-10 text-center', className)}>{children}</p>
}
