import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface StageFlowProps {
  stages: readonly string[]
  /** Index of the current stage; `-1` when the stage is not part of the pipeline. */
  currentIndex: number
}

/** Horizontal stage tracker: completed ✓, current, upcoming. */
export function StageFlow({ stages, currentIndex }: StageFlowProps) {
  return (
    <ol className="border-line bg-surface m-0 flex list-none overflow-auto rounded-[9px] border p-0">
      {stages.map((stage, index) => {
        const state =
          index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming'
        return (
          <li
            key={stage}
            aria-current={state === 'current' ? 'step' : undefined}
            className={cn(
              'border-line relative min-w-[145px] flex-1 border-r py-3.5 pr-4 pl-[38px] last:border-r-0',
              state === 'done' && 'bg-success-soft',
              state === 'current' && 'bg-amber-soft',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'absolute top-[17px] left-[15px] grid size-3.5 place-items-center rounded-full border-[3px] border-white box-content',
                state === 'done' && 'bg-success-strong text-white',
                state === 'current' && 'bg-warning ring-3 ring-amber-soft',
                state === 'upcoming' && 'bg-line ring-1 ring-line-strong',
              )}
            >
              {state === 'done' && <Check size={9} strokeWidth={4} />}
            </span>
            <b className="block text-xs">{stage}</b>
            <small
              className={cn(
                'mt-1 block text-[11px]',
                state === 'current' ? 'text-warning-text' : 'text-muted',
              )}
            >
              {state === 'done' ? 'Completed' : state === 'current' ? 'Current stage' : 'Upcoming'}
            </small>
          </li>
        )
      })}
    </ol>
  )
}
