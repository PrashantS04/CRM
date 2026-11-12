import type { TimelineEntry } from '@/types/domain'

export interface TimelineProps {
  entries: readonly TimelineEntry[]
  label: string
}

/** Vertical event list with teal markers (history, audit trail). */
export function Timeline({ entries, label }: TimelineProps) {
  return (
    <ol
      aria-label={label}
      className="border-line-soft m-0 mt-2.5 ml-[9px] list-none border-l-2 pl-5"
    >
      {entries.map((entry) => (
        <li key={entry.id} className="relative pb-[19px] last:pb-0">
          <span
            aria-hidden
            className="bg-teal border-teal-soft absolute top-1 -left-[26px] size-2.5 rounded-full border-[3px] box-content"
          />
          <b className="text-[13px]">{entry.title}</b>
          <small className="text-muted mt-[3px] block">{entry.detail}</small>
        </li>
      ))}
    </ol>
  )
}
