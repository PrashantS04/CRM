import type { ReactNode } from 'react'

export interface InfoItem {
  label: string
  value: ReactNode
}

export interface InfoGridProps {
  items: readonly InfoItem[]
}

/** Two-column label/value grid (`<dl>`) for record details. */
export function InfoGrid({ items }: InfoGridProps) {
  return (
    <dl className="m-0 grid gap-x-6 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-subtle mt-4 mb-1 text-[11px] font-bold tracking-wide uppercase">
            {item.label}
          </dt>
          <dd className="text-text m-0 font-medium">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
