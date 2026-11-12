import { Plus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePageCrumb } from '@/app/layout/breadcrumbContext'
import { CallButton, EmailButton } from '@/components/ContactButtons'
import { QueryState } from '@/components/feedback/QueryState'
import { useToast } from '@/components/feedback/toastContext'
import {
  Button,
  Card,
  CardHeader,
  DataTable,
  InfoGrid,
  PageHeader,
  RecordLayout,
  RecordLink,
  RelationshipStatusBadge,
  RuleItem,
  SectionLabel,
  Timeline,
  type Column,
} from '@/components/ui'
import { useEntity } from '@/features/entities/hooks'
import { NoteDialog } from '@/features/notes/NoteDialog'
import { detailPath } from '@/features/opportunities/config'
import { useAllOpportunities } from '@/features/opportunities/hooks'
import { NewTaskDialog } from '@/features/tasks/NewTaskDialog'
import { useTasks } from '@/features/tasks/hooks'
import { getTaskDisplayStatus, isTaskForRecord } from '@/features/tasks/status'
import { formatDate } from '@/lib/format'
import { usePerson, usePersonTimeline } from './hooks'
import { buildMappedPersonFields } from './mappedFields'

interface LinkedRow {
  id: string
  block: string
  record: ReactNode
  role: string
  state: string
}

const LINKED_COLUMNS: Column<LinkedRow>[] = [
  { key: 'block', header: 'Block', cell: (row) => row.block },
  { key: 'record', header: 'Linked record', cell: (row) => row.record },
  { key: 'role', header: 'Role', cell: (row) => row.role },
  { key: 'state', header: 'Stage or status', cell: (row) => row.state },
]

export function PersonDetailPage() {
  const { personId = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const personQuery = usePerson(personId)
  const person = personQuery.data
  const entityQuery = useEntity(person?.entityId ?? '')
  const entity = person?.entityId ? entityQuery.data : undefined
  const timeline = usePersonTimeline(personId)
  const tasks = useTasks()
  const opportunities = useAllOpportunities()
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
          (t) =>
            isTaskForRecord(t, p.name, entity?.name) && ['Open', 'In Progress'].includes(t.status),
        )
        const linkedRows: LinkedRow[] = [
          ...(entity
            ? [
                {
                  id: 'entity',
                  block: 'Linked entity',
                  record: <RecordLink to={`/entities/${entity.id}`}>{entity.name}</RecordLink>,
                  role: p.roles,
                  state: entity.status,
                },
              ]
            : []),
          ...relatedOpportunities.map((o) => ({
            id: o.id,
            block: 'Linked opportunity',
            record: <RecordLink to={detailPath(o.kind, o.id)}>{o.name}</RecordLink>,
            role: p.type,
            state: o.stage,
          })),
        ]
        const entityName = entity?.name

        return (
          <>
            <PageHeader
              back={{ to: '/people', label: 'Back to people' }}
              title={p.name}
              description={`${p.type}${entityName ? ` · ${entityName}` : ''}`}
              actions={
                <>
                  {p.phone && <CallButton phone={p.phone} />}
                  <EmailButton email={p.email} />
                  <Button
                    variant="primary"
                    startIcon={<Plus size={16} />}
                    onClick={() => setTaskOpen(true)}
                  >
                    Task
                  </Button>
                </>
              }
            />
            <RecordLayout
              aside={
                <>
                  <Card padded>
                    <CardHeader title="Open tasks" />
                    {openTasks.length === 0 ? (
                      <p className="text-muted m-0 text-[13px]">No open tasks.</p>
                    ) : (
                      openTasks.map((task) => (
                        <RuleItem
                          key={task.id}
                          icon={getTaskDisplayStatus(task) === 'Overdue' ? '!' : '✓'}
                          title={task.title}
                          description={`Due ${formatDate(task.dueAt)} · ${task.priority} priority`}
                        />
                      ))
                    )}
                    <Button sx={{ mt: 2 }} onClick={() => setTaskOpen(true)}>
                      Assign task
                    </Button>
                  </Card>
                  {p.type === 'Broker' && (
                    <Card padded>
                      <CardHeader
                        title="Broker and panel fields"
                        description="ACR, ACL, Industry Body and Panel Membership blocks from the field map."
                      />
                      <Button onClick={() => navigate('/settings/forms')}>
                        View mapped blocks
                      </Button>
                    </Card>
                  )}
                </>
              }
            >
              <Card padded>
                <CardHeader
                  title="Person details"
                  description="Core identity and relationship information."
                  action={<Button onClick={() => toast.info('Person editor opened')}>Edit</Button>}
                />
                <InfoGrid
                  items={[
                    {
                      label: 'Email',
                      value: <RecordLink to={`mailto:${p.email}`}>{p.email}</RecordLink>,
                    },
                    { label: 'Phone', value: p.phone || 'Not entered' },
                    { label: 'Person type', value: p.type },
                    {
                      label: 'Relationship status',
                      value: <RelationshipStatusBadge status={p.status} />,
                    },
                    {
                      label: 'Primary entity',
                      value: entity ? (
                        <RecordLink to={`/entities/${entity.id}`}>{entity.name}</RecordLink>
                      ) : (
                        'Not linked'
                      ),
                    },
                    { label: 'Owner', value: p.owner },
                  ]}
                />
              </Card>

              <Card padded>
                <CardHeader
                  title="Mapped Person fields"
                  description="Values organised by the imported Contact field map. Use Edit to maintain the record values."
                  action={
                    <Button onClick={() => toast.info('Mapped Person field editor opened')}>
                      Edit mapped fields
                    </Button>
                  }
                />
                {mapped.map((group) => (
                  <div key={group.group}>
                    <SectionLabel>{group.group}</SectionLabel>
                    <InfoGrid items={group.fields} />
                  </div>
                ))}
              </Card>

              <Card padded>
                <CardHeader
                  title="Linked records"
                  description="Fields from the mapped related-record blocks."
                />
                <DataTable
                  label="Linked records"
                  columns={LINKED_COLUMNS}
                  rows={linkedRows}
                  getRowId={(row) => row.id}
                  emptyMessage="No linked records yet."
                  minWidth={560}
                />
              </Card>

              <Card padded>
                <CardHeader
                  title="Activity history"
                  description="Email and call pointers retain metadata only. Notes remain append-only."
                  action={
                    <Button startIcon={<Plus size={16} />} onClick={() => setNoteOpen(true)}>
                      Add note
                    </Button>
                  }
                />
                <QueryState query={timeline}>
                  {(entries) => <Timeline label="Activity history" entries={entries} />}
                </QueryState>
              </Card>
            </RecordLayout>

            <NewTaskDialog
              open={taskOpen}
              onClose={() => setTaskOpen(false)}
              relatedTo={p.name}
              area="People"
            />
            <NoteDialog
              open={noteOpen}
              onClose={() => setNoteOpen(false)}
              recordId={p.id}
              recordName={p.name}
            />
          </>
        )
      }}
    </QueryState>
  )
}
