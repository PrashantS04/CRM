import { cn } from '@/lib/cn'
import { getInitials } from '@/lib/format'

const SIZE = {
  sm: 'size-[27px] text-[10px]',
  md: 'size-[34px] text-xs',
} as const

export interface AvatarProps {
  name: string
  size?: keyof typeof SIZE
  className?: string
}

/** Initials avatar. The full name is exposed to assistive tech. */
export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <span
      role="img"
      aria-label={name}
      title={name}
      className={cn(
        'bg-brand-soft text-brand inline-grid shrink-0 place-items-center rounded-full font-semibold',
        SIZE[size],
        className,
      )}
    >
      {getInitials(name)}
    </span>
  )
}
