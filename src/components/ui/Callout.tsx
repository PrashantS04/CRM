import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export type CalloutTone = 'gate' | 'notice'

const TONE: Record<CalloutTone, string> = {
  gate: 'border-l-[3px] border-warning bg-warning-soft text-warning-text rounded-md p-3 text-xs leading-normal',
  notice:
    'border border-notice-border bg-notice-bg text-notice-text rounded-md p-2.5 text-xs leading-snug',
}

export interface CalloutProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CalloutTone
}

/** Inline message: `gate` for hard-gate rules, `notice` for guidance. */
export function Callout({ tone = 'gate', className, ...rest }: CalloutProps) {
  return <div role="note" className={cn(TONE[tone], className)} {...rest} />
}
