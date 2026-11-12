import { CalendarPlus, CheckSquare, Mail, Phone, Plus } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { usePageCrumb } from '@/app/layout/breadcrumbContext'
import { QueryState } from '@/components/feedback/QueryState'
import { useToast } from '@/components/feedback/toastContext'
import {
  ActivityFeed,
  Badge,
  Button,
  ButtonLink,
  Callout,
  Card,
  CardHeader,
  InfoGrid,
  PageHeader,
  RecordLayout,
  RuleItem,
  StageFlow,
  Tabs,
  Timeline,
} from '@/components/ui'
import { NoteDialog } from '@/features/notes/NoteDialog'
import { NewTaskDialog } from '@/features/tasks/NewTaskDialog'
import { useTasks } from '@/features/tasks/hooks'
import { getTaskDisplayStatus, isTaskForRecord } from '@/features/tasks/status'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import { OPPORTUNITY_KINDS } from './config'
import { useOpportunity, useOpportunityActivity, useOpportunityAudit, usePipelines } from './hooks'
import { MoveStageDialog } from './MoveStageDialog'

type DetailTab = 'activity' | 'details' | 'audit'
const TABS = [
  { value: 'activity', label: 'Activity' },
  { value: 'details', label: 'Details' },
  { value: 'audit', label: 'Audit history' },
] as const

export function OpportunityDetailPage() {
  const { opportunityId = '' } = useParams()
  const toast = useToast()
  const opportunityQuery = useOpportunity(opportunityId)
  const activity = useOpportunityActivity(opportunityId)
  const audit = useOpportunityAudit(opportunityId)
  const pipelines = usePipelines()
  const tasks = useTasks()
  const [tab, setTab] = useState<DetailTab>('activity')
  const [taskOpen, setTaskOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  usePageCrumb(opportunityQuery.data?.name)

  return (
    <QueryState query={opportunityQuery}>
      {(o) => {
        const config = OPPORTUNITY_KINDS[o.kind]
        const stages = pipelines.data?.find((p) => p.id === config.pipelineId)?.stages ?? []
        const relatedTasks = (tasks.data ?? []).filter((t) => isTaskForRecord(t, o.name, o.party))
        const area = o.kind === 'loan' ? 'Credit' : 'Capital'

        return (
          <>
            <PageHeader
              back={{ to: config.basePath, label: `Back to ${config.plural}` }}
              title={o.name}
              description={`${config.singular} · ${o.stage} · Owner: ${o.owner}`}
              actions={
                <>
                  <Button startIcon={<Plus size={16} />} onClick={() => setNoteOpen(true)}>
                    Note
                  </Button>
                  <Button startIcon={<Plus size={16} />} onClick={() => setTaskOpen(true)}>
                    Task
                  </Button>
                  <Button variant="primary" onClick={() => setMoveOpen(true)}>
                    Move stage
                  </Button>
                </>
              }
            />

            <Card padded className="mb-4">
              <CardHeader
                title="Opportunity stage flow"
                description="Completed stages, the current stage, and the stages still ahead."
                action={
                  <Badge tone="teal" shape="chip">
                    {o.stage}
                  </Badge>
                }
              />
              <StageFlow stages={stages} currentIndex={stages.indexOf(o.stage)} />
            </Card>

            <RecordLayout
              aside={
                <>
                  <Card padded>
                    <CardHeader title="Stage readiness" />
                    <Callout>
                      Expected information is incomplete: latest financials, valuation report. These
                      data gaps do not stop the move unless a defined hard gate applies.
                    </Callout>
                    <ButtonLink to="/settings/pipelines" sx={{ mt: 2 }}>
                      View stage fields
                    </ButtonLink>
                  </Card>
                  <Card padded>
                    <CardHeader title="Related tasks" />
                    {relatedTasks.length === 0 ? (
                      <p className="text-muted m-0 text-[13px]">No related tasks.</p>
                    ) : (
                      relatedTasks.map((task) => (
                        <RuleItem
                          key={task.id}
                          icon={getTaskDisplayStatus(task) === 'Overdue' ? '!' : '✓'}
                          title={task.title}
                          description={`Created by ${task.createdBy} · Due ${formatDate(task.dueAt)}`}
                        />
                      ))
                    )}
                    <Button sx={{ mt: 1.5 }} onClick={() => setTaskOpen(true)}>
                      Assign task
                    </Button>
                  </Card>
                  <Card padded>
                    <CardHeader
                      title="Files"
                      description="SharePoint links only. No document binaries are stored in CRM."
                    />
                    <Button onClick={() => toast.info('SharePoint folder would open')}>
                      Open SharePoint folder
                    </Button>
                  </Card>
                </>
              }
            >
              <Card padded>
                <CardHeader
                  title="Opportunity overview"
                  description="Key details remain visible while you work through the record."
                  action={
                    <Button onClick={() => toast.info('Opportunity editor opened')}>Edit</Button>
                  }
                />
                <InfoGrid
                  items={[
                    { label: config.partyLabel, value: o.party },
                    { label: 'Owner', value: o.owner },
                    { label: 'Amount', value: formatCurrency(o.amount) },
                    { label: 'Follow-up due', value: formatDate(o.followUpAt) },
                    { label: 'Created', value: formatDateTime(o.createdAt) },
                    { label: 'Source', value: o.source },
                  ]}
                />
              </Card>

              <Card padded>
                <Tabs label="Opportunity sections" value={tab} onChange={setTab} items={TABS} />

                {tab === 'activity' && (
                  <>
                    <div className="flex flex-wrap items-center gap-2 pb-4">
                      <Button
                        variant="primary"
                        startIcon={<CheckSquare size={15} />}
                        onClick={() => setTaskOpen(true)}
                      >
                        New task
                      </Button>
                      <Button
                        startIcon={<Phone size={15} />}
                        onClick={() =>
                          toast.info('Teams dialler would open and a post-call log will be offered')
                        }
                      >
                        Log call
                      </Button>
                      <Button
                        startIcon={<CalendarPlus size={15} />}
                        onClick={() => toast.info('New calendar event panel opened')}
                      >
                        New event
                      </Button>
                      <Button
                        startIcon={<Mail size={15} />}
                        onClick={() =>
                          toast.info('Outlook would open and the email pointer will be captured')
                        }
                      >
                        Email
                      </Button>
                      <Button startIcon={<Plus size={15} />} onClick={() => setNoteOpen(true)}>
                        Note
                      </Button>
                      <span className="text-muted text-xs md:ml-auto">
                        All time · All activities
                      </span>
                    </div>
                    <QueryState query={activity}>
                      {(items) => <ActivityFeed items={items} />}
                    </QueryState>
                  </>
                )}

                {tab === 'details' && (
                  <InfoGrid
                    items={[
                      { label: 'Lead category', value: o.leadCategory },
                      { label: 'Lead status', value: o.leadStatus },
                      { label: 'Current stage', value: o.stage },
                      { label: 'Pipeline', value: `${config.plural} (${config.pipelineKind})` },
                    ]}
                  />
                )}

                {tab === 'audit' && (
                  <>
                    <CardHeader
                      title="Record audit trail"
                      description="Immutable history of create, changes, stage moves and connected-system calls."
                      action={
                        <Button onClick={() => toast.success('Audit export recorded')}>
                          Export audit
                        </Button>
                      }
                    />
                    <QueryState query={audit}>
                      {(entries) => <Timeline label="Audit trail" entries={entries} />}
                    </QueryState>
                  </>
                )}
              </Card>
            </RecordLayout>

            <NewTaskDialog
              open={taskOpen}
              onClose={() => setTaskOpen(false)}
              relatedTo={o.name}
              area={area}
            />
            <NoteDialog
              open={noteOpen}
              onClose={() => setNoteOpen(false)}
              recordId={o.id}
              recordName={o.name}
            />
            <MoveStageDialog
              open={moveOpen}
              onClose={() => setMoveOpen(false)}
              opportunity={o}
              stages={stages}
            />
          </>
        )
      }}
    </QueryState>
  )
}
