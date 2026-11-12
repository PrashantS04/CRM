import type { ReactNode } from 'react'

/** Small uppercase caption above a group of fields. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-subtle mt-[18px] mb-2 text-[11px] font-bold tracking-wider uppercase">
      {children}
    </p>
  )
}
