import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Button, ButtonLink } from './Button'
import { Card } from './Card'

export type MetricAccent = 'brand' | 'teal' | 'gold'

const ACCENT: Record<MetricAccent, string> = {
  brand: 'bg-brand-soft text-brand',
  teal: 'bg-teal-soft text-teal',
  gold: 'bg-amber-soft text-warning-text',
}

export interface MetricCardProps {
  icon: ReactNode
  label: string
  value: ReactNode
  accent?: MetricAccent
  /** Link under the value. Provide `to` to navigate or `onClick` for an action. */
  link?: { label: string; to?: string; onClick?: () => void }
}

/** KPI tile: icon, label, big number and a drill-down link. */
export function MetricCard({ icon, label, value, accent = 'brand', link }: MetricCardProps) {
  return (
    <Card className="grid grid-cols-[48px_1fr] items-center gap-3.5 px-5 py-[19px]">
      <div className={cn('grid size-[46px] place-items-center rounded-full', ACCENT[accent])}>
        {icon}
      </div>
      <div>
        <div className="text-text-soft font-bold">{label}</div>
        <div className="text-navy my-0.5 text-[28px] leading-tight font-extrabold tracking-tight">
          {value}
        </div>
        {link &&
          (link.to ? (
            <ButtonLink to={link.to} variant="link">
              {link.label}
            </ButtonLink>
          ) : (
            <Button variant="link" onClick={link.onClick}>
              {link.label}
            </Button>
          ))}
      </div>
    </Card>
  )
}
