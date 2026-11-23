import { ArrowLeft, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { usePageCrumb } from '@/app/layout/breadcrumbContext'
import { CallButton, EmailButton } from '@/components/ContactButtons'
import { NewTaskDialog } from '@/components/NewTaskDialog'
import { NoteDialog } from '@/components/NoteDialog'
import { QueryState } from '@/components/feedback/QueryState'
import { useToast } from '@/components/feedback/toastContext'
import { ActivityRail, DetailSection, FieldGrid, RecordHeader } from '@/components/record'
import { ActivityFeed, Button, Card, RecordLink, RelationshipStatusBadge, Tabs, Timeline } from '@/components/ui'
import { useEntity } from '@/features/entities/hooks'
import { detailPath } from '@/features/opportunities/config'
import { useAllOpportunities } from '@/features/opportunities/hooks'
import { useTasks } from '@/features/tasks/hooks'
import { getTaskDisplayStatus, isTaskForRecord } from '@/features/tasks/status'
import { formatDate } from '@/lib/format'
import type { ActivityItem } from '@/types/domain'
import { usePerson, usePersonTimeline } from './hooks'
import { buildMappedPersonFields } from './mappedFields'

type Tab = 'activity' | 'details' | 'history'
const TABS = [
  { value: 'activity', label: 'Activity' },
  { value: 'details', label: 'Details' },
  { value: 'history', label: 'History' },
] as const

export function PersonDetailPage() {
  const { personId = '' } = useParams()
  const toast = useToast()
  const personQuery = usePerson(personId)
  const person = personQuery.data
  const entityQuery = useEntity(person?.entityId ?? '')
  const entity = person?.entityId ? entityQuery.data : undefined
  const timeline = usePersonTimeline(personId)
  const tasks = useTasks()
  const opportunities = useAllOpportunities()
  const [tab, setTab] = useState<Tab>('activity')
  const [taskOpen, setTaskOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  usePageCrumb(person?.name)

  return (
    <QueryState query={personQuery}>
      {(p) => {
        const mapped = buildMappedPersonFields(p)
        const relatedOpportunities = (opportunities.data ?? []).filter(
          (o) => entity && o.party === entity.name,
        )
        const openTasks = (tasks.data ?? []).filter(
          (t) => isTaskForRecord(t, p.name, entity?.name) && ['Open', 'In Progress'].includes(t.status),
        )
        const feedItems: ActivityItem[] = [
          ...openTasks.map((t) => ({
            id: t.id,
            kind: 'task' as const,
            title: t.title,
            detail: `Related to ${t.relatedTo} · Due ${formatDate(t.dueAt)}`,
            meta: `${t.createdBy} · ${t.priority} priority`,
            status: getTaskDisplayStatus(t),
            group: 'Upcoming and overdue',
            alert: getTaskDisplayStatus(t) === 'Overdue',
          })),
          ...relatedOpportunities.map((o) => ({
            id: o.id,
            kind: 'event' as const,
            title: `${o.kind === 'loan' ? 'Loan' : 'Investment'} opportunity: ${o.name}`,
            detail: `Current stage ${o.stage} · Owner ${o.owner}`,
            meta: `Follow-up ${o.followUpAt ? formatDate(o.followUpAt) : 'not set'}`,
            status: 'Open',
            group: 'Related records',
          })),
          ...(timeline.data ?? []).map((entry) => ({
            id: entry.id,
            kind: (entry.title.startsWith('Call')
              ? 'call'
              : entry.title.startsWith('Email')
                ? 'email'
                : 'note') as ActivityItem['kind'],
            title: entry.title,
            detail: entry.detail,
            meta: '',
            status: 'Logged',
            group: 'Record activity',
          })),
        ]
        const railLinks = [
          ...(entity
            ? [{ id: 'ent', title: entity.name, description: `${entity.type} · ${entity.relationship}`, to: `/entities/${entity.id}` }]
            : []),
          ...relatedOpportunities.map((o) => ({
            id: o.id,
            title: o.name,
            description: `${o.kind === 'loan' ? 'Loan' : 'Investment'} Opportunity · ${o.stage}`,
            to: detailPath(o.kind, o.id),
          })),
        ]

        return (
          <>
            <Link to="/people" className="text-info mb-3 inline-flex items-center gap-1 text-xs font-bold no-underline hover:underline">
              <ArrowLeft size={14} /> Back to people
            </Link>
            <RecordHeader
              name={p.name}
              badge={p.type}
              meta={[
                { label: 'Owner', value: p.owner },
                {
                  label: 'Relationship status',
                  value: <RelationshipStatusBadge status={p.status} />,
                },
              ]}
              actions={
                <>
                  {p.phone && <CallButton phone={p.phone} />}
                  <EmailButton email={p.email} />
                  <Button variant="primary" startIcon={<Plus size={16} />} onClick={() => setTaskOpen(true)}>
                    Task
                  </Button>
                </>
              }
            />
            <Tabs label="Person sections" value={tab} onChange={setTab} items={TABS} />
            <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.92fr)_minmax(310px,0.78fr)]">
              <div className="grid min-w-0 content-start gap-3">
                {tab === 'details' && (
                  <>
                    <DetailSection title="Person details" onEdit={() => toast.info('Person editor opened')}>
                      <FieldGrid
                        items={[
                          { label: 'Email', value: <RecordLink to={`mailto:${p.email}`}>{p.email}</RecordLink> },
                          { label: 'Phone', value: p.phone || 'Not entered' },
                          { label: 'Person type', value: p.type },
                          { label: 'Relationship status', value: <RelationshipStatusBadge status={p.status} /> },
                          {
                            label: 'Primary entity',
                            value: entity ? <RecordLink to={`/entities/${entity.id}`}>{entity.name}</RecordLink> : 'Not linked',
                          },
                          { label: 'Owner', value: p.owner },
                          { label: 'Roles', value: p.roles },
                        ]}
                      />
                    </DetailSection>
                    {mapped.map((group) => (
                      <DetailSection key={group.group} title={group.group} onEdit={() => toast.info('Mapped field editor opened')}>
                        <FieldGrid items={group.fields} />
                      </DetailSection>
                    ))}
                  </>
                )}
                {tab === 'activity' && (
                  <Card padded>
                    <div className="flex flex-wrap items-center gap-2 pb-4">
                      <Button variant="primary" size="small" startIcon={<Plus size={15} />} onClick={() => setTaskOpen(true)}>
                        New task
                      </Button>
                      <Button size="small" onClick={() => toast.info('Teams dialler would open')}>
                        Call
                      </Button>
                      <Button size="small" onClick={() => toast.info('Outlook would open')}>
                        Email
                      </Button>
                      <Button size="small" onClick={() => toast.info('Calendar event panel opened')}>
                        Event
                      </Button>
                      <Button size="small" startIcon={<Plus size={15} />} onClick={() => setNoteOpen(true)}>
                        Add note
                      </Button>
                    </div>
                    <ActivityFeed items={feedItems} />
                  </Card>
                )}
                {tab === 'history' && (
                  <Card padded>
                    <QueryState query={timeline}>
                      {(entries) => <Timeline label="Record history" entries={entries} />}
                    </QueryState>
                  </Card>
                )}
              </div>
              <aside className="grid content-start gap-4">
                <ActivityRail
                  linksTitle="Linked opportunities"
                  links={railLinks}
                  linksCount={railLinks.length}
                  documents={[{ id: 'd1', title: 'Identity verification', description: 'SharePoint link · added 02 Sep 2026' }]}
                  onAddDocument={() => toast.info('SharePoint link panel opened')}
                  onLogCall={p.phone ? undefined : () => toast.info('No phone number on record')}
                  onEmail={() => toast.info('Outlook would open')}
                  onNewEvent={() => toast.info('Calendar event panel opened')}
                  onNote={() => setNoteOpen(true)}
                  onNewTask={() => setTaskOpen(true)}
                  activities={feedItems.slice(0, 4)}
                />
              </aside>
            </div>
            <NewTaskDialog open={taskOpen} onClose={() => setTaskOpen(false)} relatedTo={p.name} area="People" />
            <NoteDialog open={noteOpen} onClose={() => setNoteOpen(false)} recordId={p.id} recordName={p.name} />
          </>
        )
      }}
    </QueryState>
  )
}
