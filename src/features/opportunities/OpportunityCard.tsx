import { Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar, Badge, Card } from '@/components/ui'
import { cn } from '@/lib/cn'
import { daysUntil, describeFollowUp } from '@/lib/date'
import { formatCurrency } from '@/lib/format'
import type { Opportunity } from '@/types/domain'
import { detailPath } from './config'

/** Kanban card: name, counterparty, lead tag, amount, owner and follow-up. */
export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const due = opportunity.followUpAt !== null && daysUntil(opportunity.followUpAt) <= 3

  return (
    <Card as="article" interactive className="shadow-card-sm">
      <Link
        to={detailPath(opportunity.kind, opportunity.id)}
        draggable={false}
        className="block p-3.5 text-inherit no-underline"
      >
        <b className="text-sm">{opportunity.name}</b>
        <p className="text-muted mt-[5px] mb-[11px] text-[13px]">{opportunity.party}</p>
        <Badge>
          {opportunity.leadCategory} · {opportunity.leadStatus}
        </Badge>
        <div className="text-neutral-text mt-[13px] flex items-center justify-between">
          <b>{formatCurrency(opportunity.amount)}</b>
          <Avatar name={opportunity.owner} size="sm" />
        </div>
        <div
          className={cn(
            'mt-3 flex items-center gap-1.5 text-xs',
            due ? 'text-brand' : 'text-muted',
          )}
        >
          <Clock size={13} aria-hidden />
          {describeFollowUp(opportunity.followUpAt)}
        </div>
      </Link>
    </Card>
  )
}
