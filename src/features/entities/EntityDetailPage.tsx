import { ArrowLeft, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { usePageCrumb } from '@/app/layout/breadcrumbContext'
import { NewTaskDialog } from '@/components/NewTaskDialog'
import { NoteDialog } from '@/components/NoteDialog'
import { QueryState } from '@/components/feedback/QueryState'
import { useToast } from '@/components/feedback/toastContext'
import { ActivityRail, DetailSection, FieldGrid, RecordHeader } from '@/components/record'
import { ActivityFeed, Badge, Button, Card, RecordLink, RelationshipStatusBadge, Tabs, Timeline, type Column, DataTable } from '@/components/ui'
import { usePeople } from '@/features/people/hooks'
import { detailPath } from '@/features/opportunities/config'
import { useAllOpportunities } from '@/features/opportunities/hooks'
import type { ActivityItem, Person } from '@/types/domain'
import { useEntity, useEntityTimeline } from './hooks'

type Tab = 'activity' | 'details' | 'history'
const TABS = [
  { value: 'activity', label: 'Activity' },
  { value: 'details', label: 'Details' },
  { value: 'history', label: 'History' },
] as const

const PEOPLE_COLUMNS: Column<Person>[] = [
  { key: 'person', header: 'Person', cell: (p) => <RecordLink to={`/people/${p.id}`}>{p.name}</RecordLink> },
  { key: 'role', header: 'Role', cell: (p) => p.linkRole },
  { key: 'primary', header: 'Primary', cell: () => <Badge tone="neutral">Yes</Badge> },
  { key: 'since', header: 'Since', cell: () => '2024' },
]

export function EntityDetailPage() {
  const { entityId = '' } = useParams()
  const toast = useToast()
  const entityQuery = useEntity(entityId)
  const timeline = useEntityTimeline(entityId)
  const people = usePeople()
  const opportunities = useAllOpportunities()
  const [tab, setTab] = useState<Tab>('activity')
  const [taskOpen, setTaskOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  usePageCrumb(entityQuery.data?.name)

  return (
    <QueryState query={entityQuery}>
      {(entity) => {
        const linkedPeople = (people.data ?? []).filter((p) => p.entityId === entity.id)
        const related = (opportunities.data ?? []).filter((o) => o.party === entity.name)
        const feedItems: ActivityItem[] = [
          ...related.map((o) => ({
            id: o.id,
            kind: 'event' as const,
            title: `${o.kind === 'loan' ? 'Loan' : 'Investment'} opportunity: ${o.name}`,
            detail: `Current stage ${o.stage} · Owner ${o.owner}`,
            meta: `Follow-up ${o.followUpAt ?? 'not set'}`,
            status: 'Open',
            group: 'Related records',
          })),
          ...linkedPeople.slice(0, 3).map((p) => ({
            id: p.id,
            kind: 'note' as const,
            title: `Linked person: ${p.name}`,
            detail: `${p.type} · ${p.roles}`,
            meta: `Owner ${p.owner}`,
            status: 'Linked',
            group: 'Connected people',
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
          ...related.map((o) => ({
            id: o.id,
            title: o.name,
            description: `${o.kind === 'loan' ? 'Loan' : 'Investment'} Opportunity · ${o.stage}`,
            to: detailPath(o.kind, o.id),
          })),
          ...linkedPeople.slice(0, 4).map((p) => ({
            id: p.id,
            title: p.name,
            description: `${p.type} · ${p.linkRole}`,
            to: `/people/${p.id}`,
          })),
        ]

        return (
          <>
            <Link to="/entities" className="text-info mb-3 inline-flex items-center gap-1 text-xs font-bold no-underline hover:underline">
              <ArrowLeft size={14} /> Back to entities
            </Link>
            <RecordHeader
              name={entity.name}
              badge={entity.type}
              meta={[
                { label: 'Owner', value: entity.owner },
                { label: 'Relationship', value: <RelationshipStatusBadge status={entity.status} /> },
              ]}
              actions={
                <>
                  <Button onClick={() => toast.info('Entity edit form opened')}>Edit</Button>
                  <Button variant="primary" startIcon={<Plus size={16} />} onClick={() => setTaskOpen(true)}>
                    Task
                  </Button>
                </>
              }
            />
            <Tabs label="Entity sections" value={tab} onChange={setTab} items={TABS} />
            <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.92fr)_minmax(310px,0.78fr)]">
              <div className="grid min-w-0 content-start gap-3">
                {tab === 'details' && (
                  <>
                    <DetailSection title="Entity overview" onEdit={() => toast.info('Entity editor opened')}>
                      <FieldGrid
                        items={[
                          { label: 'Entity name', value: entity.name },
                          { label: 'Entity type', value: entity.type },
                          { label: 'Relationship status', value: <RelationshipStatusBadge status={entity.status} /> },
                          { label: 'Owner', value: entity.owner },
                          { label: 'ACN', value: entity.acn },
                          { label: 'ABN', value: entity.abn },
                          { label: 'Relationship', value: entity.relationship },
                        ]}
                      />
                    </DetailSection>
                    <DetailSection title="Legal and registry details">
                      <FieldGrid
                        items={[
                          { label: 'Legal entity name', value: `${entity.name} Pty Ltd` },
                          { label: 'Country of incorporation', value: 'Australia' },
                          { label: 'Tax residency', value: 'Australian resident' },
                          { label: 'Entity status', value: 'Active' },
                          { label: 'ID / KYC status', value: 'Verified' },
                          { label: 'SharePoint folder', value: 'Linked' },
                        ]}
                      />
                    </DetailSection>
                    <DetailSection
                      title="Connected people"
                      onEdit={() => toast.info('Link person panel opened')}
                    >
                      <div className="p-3.5">
                        <DataTable
                          label="Linked people"
                          columns={PEOPLE_COLUMNS}
                          rows={linkedPeople}
                          getRowId={(p) => p.id}
                          emptyMessage="No people linked to this Entity yet."
                          minWidth={480}
                        />
                      </div>
                    </DetailSection>
                    <DetailSection title="Record details">
                      <FieldGrid
                        items={[
                          { label: 'Record status', value: entity.status },
                          { label: 'Data quality', value: 'Complete' },
                          { label: 'Last verified', value: '10 Nov 2026' },
                          { label: 'Source system', value: 'CRM migration' },
                        ]}
                      />
                    </DetailSection>
                  </>
                )}
                {tab === 'activity' && (
                  <Card padded>
                    <div className="flex flex-wrap items-center gap-2 pb-4">
                      <Button variant="primary" size="small" startIcon={<Plus size={15} />} onClick={() => setTaskOpen(true)}>
                        New task
                      </Button>
                      <Button size="small" onClick={() => toast.info('Outlook would open')}>Email</Button>
                      <Button size="small" onClick={() => toast.info('Calendar event panel opened')}>Event</Button>
                      <Button size="small" startIcon={<Plus size={15} />} onClick={() => setNoteOpen(true)}>Note</Button>
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
                  linksTitle="Parties"
                  links={railLinks}
                  linksCount={railLinks.length}
                  documents={[{ id: 'd1', title: 'Facility information pack', description: 'SharePoint link · added 14 Oct 2026' }]}
                  onAddDocument={() => toast.info('SharePoint link panel opened')}
                  onEmail={() => toast.info('Outlook would open')}
                  onNewEvent={() => toast.info('Calendar event panel opened')}
                  onNote={() => setNoteOpen(true)}
                  onNewTask={() => setTaskOpen(true)}
                  activities={feedItems.slice(0, 4)}
                />
              </aside>
            </div>
            <NewTaskDialog open={taskOpen} onClose={() => setTaskOpen(false)} relatedTo={entity.name} area="People" />
            <NoteDialog open={noteOpen} onClose={() => setNoteOpen(false)} recordId={entity.id} recordName={entity.name} />
          </>
        )
      }}
    </QueryState>
  )
}
