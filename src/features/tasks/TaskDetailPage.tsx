import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import { usePageCrumb } from '@/app/layout/breadcrumbContext'
import { NewTaskDialog } from '@/components/NewTaskDialog'
import { QueryState } from '@/components/feedback/QueryState'
import { useToast } from '@/components/feedback/toastContext'
import { DetailSection, FieldGrid, RecordHeader } from '@/components/record'
import { BackLink, Badge, Button, Card, Tabs, Timeline } from '@/components/ui'
import { FormField } from '@/components/form'
import { TASK_PRIORITIES, TASK_STATUSES } from '@/constants/lists'
import { formatDateTime } from '@/lib/format'
import type { TaskStatus } from '@/types/domain'
import { useSetTaskStatus, useTask, useTaskHistory } from './hooks'
import { getTaskDisplayStatus, TASK_STATUS_TONE } from './status'

type Tab = 'activity' | 'details' | 'history'
const TABS = [
  { value: 'activity', label: 'Activity' },
  { value: 'details', label: 'Details' },
  { value: 'history', label: 'History' },
] as const

export function TaskDetailPage() {
  const { taskId = '' } = useParams()
  const toast = useToast()
  const taskQuery = useTask(taskId)
  const historyQuery = useTaskHistory(taskId)
  const setStatus = useSetTaskStatus()
  const [tab, setTab] = useState<Tab>('activity')
  const [statusOverride, setStatusOverride] = useState<TaskStatus | null>(null)
  const [priority, setPriority] = useState('Normal')
  const [relatedTaskOpen, setRelatedTaskOpen] = useState(false)
  usePageCrumb(taskQuery.data?.title)

  return (
    <QueryState query={taskQuery}>
      {(task) => {
        const display = getTaskDisplayStatus(task)
        const currentStatus = statusOverride ?? task.status
        return (
          <>
            <BackLink to="/tasks">Back to tasks</BackLink>
            <RecordHeader
              name={task.title}
              badge={task.area}
              meta={[
                { label: 'Assigned to', value: task.assignee },
                {
                  label: 'Status',
                  value: (
                    <Badge shape="pill" tone={TASK_STATUS_TONE[display]}>
                      {display}
                    </Badge>
                  ),
                },
              ]}
              actions={
                <>
                  <Button onClick={() => toast.info('Task editor opened')}>Edit task</Button>
                  <Button
                    variant="primary"
                    startIcon={<Plus size={16} />}
                    onClick={() => setRelatedTaskOpen(true)}
                  >
                    Create related task
                  </Button>
                  <Button
                    variant="primary"
                    disabled={task.status === 'Done' || setStatus.isPending}
                    onClick={() =>
                      setStatus.mutate(
                        { id: task.id, status: 'Done' },
                        {
                          onSuccess: () => {
                            setStatusOverride('Done')
                            toast.success('Task marked Done')
                          },
                        },
                      )
                    }
                  >
                    Mark done
                  </Button>
                </>
              }
            />
            <Tabs label="Task sections" value={tab} onChange={setTab} items={TABS} />
            <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.92fr)_minmax(310px,0.78fr)]">
              <div className="grid min-w-0 content-start gap-3">
                {tab === 'details' && (
                  <>
                    <DetailSection title="Task assignment and status" onEdit={() => toast.info('Full task editor opened')}>
                      <div className="grid gap-3.5 p-3.5 sm:grid-cols-2">
                        <FormField id="td-status" label="Status">
                          <Select
                            value={currentStatus}
                            onChange={(e) => setStatusOverride(e.target.value as TaskStatus)}
                            fullWidth
                            size="small"
                            inputProps={{ 'aria-label': 'Status' }}
                          >
                            {TASK_STATUSES.map((s) => (
                              <MenuItem key={s} value={s}>
                                {s}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormField>
                        <FormField id="td-priority" label="Priority">
                          <Select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            fullWidth
                            size="small"
                            inputProps={{ 'aria-label': 'Priority' }}
                          >
                            {TASK_PRIORITIES.map((p) => (
                              <MenuItem key={p} value={p}>
                                {p}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormField>
                        <div className="sm:col-span-2">
                          <Button
                            variant="primary"
                            disabled={setStatus.isPending || currentStatus === task.status}
                            onClick={() =>
                              setStatus.mutate(
                                { id: task.id, status: currentStatus },
                                {
                                  onSuccess: () => toast.success('Task updated'),
                                  onError: () => toast.info('Only status changes are supported by the tasks API'),
                                },
                              )
                            }
                          >
                            Save changes
                          </Button>
                        </div>
                      </div>
                    </DetailSection>
                    <DetailSection title="Task details">
                      <FieldGrid
                        items={[
                          { label: 'Related object', value: task.area },
                          { label: 'Related record', value: task.relatedTo },
                          { label: 'Created by', value: task.createdBy },
                          { label: 'Created date and time', value: formatDateTime(task.createdAt) },
                          { label: 'Assigned to', value: task.assignee },
                          { label: 'Due date', value: formatDateTime(task.dueAt) },
                        ]}
                      />
                    </DetailSection>
                  </>
                )}
                {tab === 'activity' && (
                  <Card padded>
                    <QueryState query={historyQuery}>
                      {(entries) => <Timeline label="Task activity" entries={entries} />}
                    </QueryState>
                  </Card>
                )}
                {tab === 'history' && (
                  <Card padded>
                    <QueryState query={historyQuery}>
                      {(entries) => <Timeline label="Task history" entries={entries} />}
                    </QueryState>
                  </Card>
                )}
              </div>
              <aside className="grid content-start gap-4">
                <Card padded>
                  <h2 className="text-ink m-0 mb-2 text-sm">Task context</h2>
                  <p className="text-muted m-0 text-xs leading-relaxed">
                    Created by: {task.createdBy}
                    <br />
                    Created: {formatDateTime(task.createdAt)}
                    <br />
                    Due date: {formatDateTime(task.dueAt)}
                    <br />
                    Priority: {priority}
                  </p>
                  <Button className="mt-3" onClick={() => toast.success('Audit export recorded')}>
                    Export audit trail
                  </Button>
                </Card>
                <Card padded>
                  <h2 className="text-ink m-0 mb-2 text-sm">Attachments</h2>
                  <p className="text-muted m-0 text-xs">No files attached. SharePoint links can be added from the related record.</p>
                  <Button variant="link" className="mt-1" onClick={() => toast.info('Attachment panel opened')}>
                    Add attachment
                  </Button>
                </Card>
              </aside>
            </div>
            <NewTaskDialog
              open={relatedTaskOpen}
              onClose={() => setRelatedTaskOpen(false)}
              relatedTo={task.relatedTo}
              area={task.area}
            />
          </>
        )
      }}
    </QueryState>
  )
}
