import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export type BadgeTone = 'brand' | 'neutral' | 'teal' | 'info' | 'success' | 'warning'
export type BadgeShape = 'tag' | 'chip' | 'pill'

const TONE: Record<BadgeTone, string> = {
  brand: 'bg-brand-soft text-brand-dark',
  neutral: 'bg-neutral-soft text-neutral-text',
  teal: 'bg-teal-soft text-teal-text',
  info: 'bg-info-soft text-info',
  success: 'bg-success-soft text-success-strong',
  warning: 'bg-warning-soft text-warning-text',
}

const SHAPE: Record<BadgeShape, string> = {
  tag: 'rounded-chip px-[7px] py-1 text-[11px]',
  chip: 'rounded-full px-2 py-1 text-[11px]',
  pill: 'rounded-pill px-2 py-1 text-[11px] whitespace-nowrap',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  shape?: BadgeShape
}

/** Small label used for tags, type chips and status pills. */
export function Badge({ tone = 'brand', shape = 'tag', className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn('inline-block font-medium', TONE[tone], SHAPE[shape], className)}
      {...rest}
    />
  )
}
