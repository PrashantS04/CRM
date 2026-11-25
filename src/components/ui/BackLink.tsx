import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export interface BackLinkProps {
  to: string
  children: ReactNode
}

/** Small "← Back to ..." navigation link shown above record headers. */
export function BackLink({ to, children }: BackLinkProps) {
  return (
    <Link
      to={to}
      className="text-brand mb-3 inline-flex items-center gap-1 text-xs font-bold no-underline hover:underline"
    >
      <ArrowLeft size={14} /> {children}
    </Link>
  )
}
