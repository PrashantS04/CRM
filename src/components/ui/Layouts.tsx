import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface RecordLayoutProps {
  children: ReactNode
  aside?: ReactNode
}

/** Detail-page layout: main column plus a 310px right rail (stacks on small screens). */
export function RecordLayout({ children, aside }: RecordLayoutProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_310px]">
      <div className="grid min-w-0 content-start gap-4">{children}</div>
      {aside && <aside className="grid content-start gap-4">{aside}</aside>}
    </div>
  )
}

const PANES = {
  /** Settings → pipeline configuration. */
  config: 'xl:grid-cols-[330px_minmax(520px,1fr)_280px]',
  /** Settings → field map. */
  objects: 'xl:grid-cols-[260px_minmax(0,1fr)_285px]',
} as const

export interface ThreePaneProps {
  variant: keyof typeof PANES
  children: ReactNode
}

/** Three-column settings layout that collapses to one column below `xl`. */
export function ThreePane({ variant, children }: ThreePaneProps) {
  return <div className={cn('grid gap-4', PANES[variant])}>{children}</div>
}

/** Equal-width responsive grid for KPI tiles and chart cards. */
export function CardGrid({ columns = 3, children }: { columns?: 2 | 3; children: ReactNode }) {
  return (
    <div
      className={cn(
        'mb-4 grid gap-4',
        columns === 3 ? 'md:grid-cols-2 lg:grid-cols-3' : 'lg:grid-cols-2',
      )}
    >
      {children}
    </div>
  )
}
