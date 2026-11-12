import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '@/lib/cn'

/** Brand-coloured link to another record (Person, Entity, Opportunity, Task). */
export function RecordLink({ className, ...rest }: LinkProps) {
  return (
    <Link
      className={cn('text-brand font-bold no-underline hover:underline', className)}
      {...rest}
    />
  )
}
