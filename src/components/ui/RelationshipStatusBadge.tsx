import type { RelationshipStatus } from '@/types/domain'
import { Badge, type BadgeTone } from './Badge'

const TONE: Record<RelationshipStatus, BadgeTone> = {
  Active: 'info',
  Prospect: 'neutral',
  Inactive: 'neutral',
}

/** Prospect / Active / Inactive pill (brief §3.7). */
export function RelationshipStatusBadge({ status }: { status: RelationshipStatus }) {
  return (
    <Badge shape="pill" tone={TONE[status]}>
      {status}
    </Badge>
  )
}
