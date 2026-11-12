import { cn } from '@/lib/cn'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
}

export interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: readonly SegmentedOption<T>[]
  label: string
  className?: string
}

/** Two-or-three-way toggle (e.g. List / Kanban). */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'border-line bg-surface flex overflow-hidden rounded-control border',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'cursor-pointer border-0 px-3 py-2 text-xs font-semibold',
              active ? 'bg-brand text-white' : 'bg-surface text-neutral-text hover:bg-surface-alt',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
