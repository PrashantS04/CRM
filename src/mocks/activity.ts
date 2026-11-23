import { CURRENT_USER } from '@/constants/lists'
import { daysFromNow } from '@/lib/date'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import type { ActivityItem, Entity, Opportunity, Person, TimelineEntry } from '@/types/domain'

const monthLabel = () =>
  new Intl.DateTimeFormat('en-AU', { month: 'long', year: 'numeric' }).format(new Date())

export function buildOpportunityActivity(o: Opportunity): ActivityItem[] {
  return [
    {
      id: 'a1',
      kind: 'task',
      title: 'Prepare credit memo',
      detail: `Assigned to ${CURRENT_USER} by Sarah Chen · Due ${formatDate(daysFromNow(-1))}`,
      meta: `High priority · Related to ${o.name}`,
      status: 'Overdue',
      group: 'Upcoming and overdue',
      alert: true,
    },
    {
      id: 'a2',
      kind: 'event',
      title: 'Credit Committee meeting',
      detail: `${formatDateTime(daysFromNow(1, 10))} · Attendees: ${CURRENT_USER}, Sarah Chen`,
      meta: 'Calendar pointer',
      status: 'Tomorrow',
      group: 'Upcoming and overdue',
    },
    {
      id: 'a3',
      kind: 'email',
      title: 'Updated financials requested',
      detail: `Email sent to ${o.party} · Attachment names recorded, body excluded`,
      meta: `${CURRENT_USER} · ${formatDateTime(daysFromNow(-1, 11, 4))}`,
      status: 'Sent',
      group: monthLabel(),
    },
    {
      id: 'a4',
      kind: 'call',
      title: `Call with ${o.party}`,
      detail: 'Outbound Teams call · 12 minutes · Call note saved',
      meta: `${CURRENT_USER} · ${formatDateTime(daysFromNow(-2, 15, 42))}`,
      status: 'Logged',
      group: monthLabel(),
    },
    {
      id: 'a5',
      kind: 'note',
      title: 'Note added',
      detail: '“Information pack received and added to SharePoint.”',
      meta: `${CURRENT_USER} · ${formatDateTime(daysFromNow(-2, 10, 15))}`,
      status: 'Note',
      group: monthLabel(),
    },
  ]
}

export function buildOpportunityAudit(o: Opportunity): TimelineEntry[] {
  return [
    {
      id: 'u1',
      title: 'Stage changed',
      detail: `Previous stage → ${o.stage} · ${CURRENT_USER} · ${formatDateTime(daysFromNow(-1, 14, 25))}`,
    },
    {
      id: 'u2',
      title: 'Amount updated',
      detail: `Old: ${formatCurrency(55_000_000)} · New: ${formatCurrency(o.amount)} · ${CURRENT_USER} · ${formatDateTime(daysFromNow(-2, 12, 6))}`,
    },
    {
      id: 'u3',
      title: 'Opportunity created',
      detail: `${o.owner} · ${formatDateTime(o.createdAt)}`,
    },
  ]
}

export function buildPersonTimeline(p: Person): TimelineEntry[] {
  return [
    {
      id: 'h1',
      title: `Call with ${p.name}`,
      detail: `Outbound · 14 minutes · Today, 10:35 · ${CURRENT_USER}`,
    },
    {
      id: 'h2',
      title: 'Email pointer: Updated information request',
      detail: `To ${p.email} · Yesterday, 16:20 · Attachment names stored`,
    },
    {
      id: 'h3',
      title: 'Note added',
      detail: `“Confirmed next steps for diligence.” · ${formatDate(daysFromNow(-3))} · ${CURRENT_USER}`,
    },
  ]
}

export function buildEntityTimeline(e: Entity): TimelineEntry[] {
  return [
    {
      id: 'e-h1',
      title: `Compliance review with ${e.name}`,
      detail: `Outbound · 22 minutes · Today, 09:12 · ${CURRENT_USER}`,
    },
    {
      id: 'e-h2',
      title: 'Email pointer: Registry documents requested',
      detail: `To registry@${e.name.toLowerCase().replaceAll(' ', '')}.com · Yesterday, 14:05 · Attachment names stored`,
    },
    {
      id: 'e-h3',
      title: 'Note added',
      detail: `“Relationship manager confirmed authorised signatory.” · ${formatDate(daysFromNow(-4))} · ${CURRENT_USER}`,
    },
  ]
}

/** Task history entries, derived from the task being viewed. */
export function buildTaskHistory(args: {
  status: string
  createdBy: string
  assignee: string
  createdAt: string
}): TimelineEntry[] {
  return [
    {
      id: 'k1',
      title: `Status changed to ${args.status}`,
      detail: `${args.assignee} · ${formatDateTime(daysFromNow(-1, 9, 10))}`,
    },
    {
      id: 'k2',
      title: 'Due date changed',
      detail: `${formatDate(daysFromNow(-2))} → ${formatDate(daysFromNow(-1))} · ${args.createdBy} · ${formatDateTime(daysFromNow(-3, 16, 5))}`,
    },
    {
      id: 'k3',
      title: 'Task created and assigned',
      detail: `${args.createdBy} assigned to ${args.assignee} · ${formatDateTime(args.createdAt)}`,
    },
  ]
}
