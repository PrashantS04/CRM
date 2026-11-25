import { CalendarDays, Mail, Pencil, Phone, Plus, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { ActivityFeed, Badge, Button, ButtonLink, Card, CardHeader } from '@/components/ui'
import type { ActivityItem } from '@/types/domain'

export interface RailLink {
  id: string
  title: ReactNode
  description?: ReactNode
  to?: string
}

export interface RailDocument {
  id: string
  title: string
  description?: string
}

export interface ActivityRailProps {
  /** Heading of the links card, e.g. "Linked opportunities" or "Parties". */
  linksTitle?: string
  links: readonly RailLink[]
  linksCount?: number
  onAddLink?: () => void
  documents?: readonly RailDocument[]
  onAddDocument?: () => void
  /** Quick-action handlers for the Notes & activities card. */
  onLogCall?: () => void
  onNewEvent?: () => void
  onEmail?: () => void
  onNote?: () => void
  onNewTask?: () => void
  activities?: readonly ActivityItem[]
}

function RailLinkRow({ link }: { link: RailLink }) {
  const body = (
    <>
      <b className="text-text text-[13px]">{link.title}</b>
      {link.description && (
        <p className="text-muted m-0 mt-1 text-[11px] leading-snug">{link.description}</p>
      )}
    </>
  )
  return link.to ? (
    <ButtonLink to={link.to} variant="link" className="mb-2 block text-left">
      {body}
    </ButtonLink>
  ) : (
    <div className="mb-2">{body}</div>
  )
}

/**
 * Right-hand rail shared by record detail pages: connected records,
 * SharePoint documents and the notes/activity quick actions + feed
 * (prototype `activityRail`).
 */
export function ActivityRail({
  linksTitle = 'Linked opportunities',
  links,
  linksCount,
  onAddLink,
  documents = [],
  onAddDocument,
  onLogCall,
  onNewEvent,
  onEmail,
  onNote,
  onNewTask,
  activities = [],
}: ActivityRailProps) {
  return (
    <>
      <p className="text-subtle m-0 text-[10px] font-bold tracking-[0.65px] uppercase">
        Connected to
      </p>
      <Card padded>
        <CardHeader
          className="mb-2"
          title={linksTitle}
          action={
            linksCount !== undefined ? (
              <Badge tone="neutral" shape="tag">
                {linksCount}
              </Badge>
            ) : undefined
          }
        />
        {links.length === 0 ? (
          <p className="text-muted m-0 text-[13px]">No linked records yet.</p>
        ) : (
          links.map((link) => <RailLinkRow key={link.id} link={link} />)
        )}
        {onAddLink && (
          <Button variant="link" startIcon={<Plus size={13} />} onClick={onAddLink}>
            Add link
          </Button>
        )}
      </Card>

      <Card padded>
        <CardHeader
          className="mb-2"
          title="Documents"
          action={
            documents.length > 0 ? (
              <Badge tone="neutral" shape="tag">
                {documents.length}
              </Badge>
            ) : undefined
          }
          description="SharePoint links only. Files stay in SharePoint."
        />
        {documents.length === 0 ? (
          <p className="text-muted m-0 text-[13px]">No documents linked.</p>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="mb-2">
              <b className="text-text text-[13px]">{doc.title}</b>
              {doc.description && (
                <p className="text-muted m-0 mt-1 text-[11px]">{doc.description}</p>
              )}
            </div>
          ))
        )}
        {onAddDocument && (
          <Button variant="link" startIcon={<Plus size={13} />} onClick={onAddDocument}>
            Add SharePoint link
          </Button>
        )}
      </Card>

      <p className="text-subtle mt-4 mb-0 text-[10px] font-bold tracking-[0.65px] uppercase">
        Notes and activities
      </p>
      <Card padded>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {onNewTask && (
            <Button variant="primary" size="small" onClick={onNewTask}>
              New task
            </Button>
          )}
          {onLogCall && (
            <Button size="small" startIcon={<Phone size={14} />} onClick={onLogCall}>
              Call
            </Button>
          )}
          {onEmail && (
            <Button size="small" startIcon={<Mail size={14} />} onClick={onEmail}>
              Email
            </Button>
          )}
          {onNewEvent && (
            <Button size="small" startIcon={<CalendarDays size={14} />} onClick={onNewEvent}>
              Meeting
            </Button>
          )}
          {onNote && (
            <Button size="small" startIcon={<Pencil size={14} />} onClick={onNote}>
              Note
            </Button>
          )}
        </div>
        {activities.length > 0 && <ActivityFeed items={activities} />}
        {activities.length === 0 && (
          <p className="text-muted m-0 flex items-center gap-1.5 text-[12px]">
            <Users size={14} aria-hidden /> Log a call, email or note to start the timeline.
          </p>
        )}
      </Card>
    </>
  )
}
