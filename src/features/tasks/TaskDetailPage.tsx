import { useParams } from 'react-router-dom'
import { usePageCrumb } from '@/app/layout/breadcrumbContext'
import { QueryState } from '@/components/feedback/QueryState'
import { useToast } from '@/components/feedback/toastContext'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  InfoGrid,
  PageHeader,
  RecordLayout,
  Timeline,
} from '@/components/ui'
import { formatDateTime } from '@/lib/format'
import { useSetTaskStatus, useTask, useTaskHistory } from './hooks'
import { getTaskDisplayStatus, TASK_STATUS_TONE } from './status'

export function TaskDetailPage() {
  const { taskId = '' } = useParams()
  const toast = useToast()
  const taskQuery = useTask(taskId)
  const historyQuery = useTaskHistory(taskId)
  const setStatus = useSetTaskStatus()
  usePageCrumb(taskQuery.data?.title)

  return (
    <QueryState query={taskQuery}>
      {(task) => {
        const display = getTaskDisplayStatus(task)
        return (
          <>
            <PageHeader
              back={{ to: '/tasks', label: 'Back to tasks' }}
              title={task.title}
              description={`Related to ${task.relatedTo}`}
              actions={
                <>
                  <Button onClick={() => toast.info('Task editor opened')}>Edit task</Button>
                  <Button
                    variant="primary"
                    disabled={task.status === 'Done' || setStatus.isPending}
                    onClick={() =>
                      setStatus.mutate(
                        { id: task.id, status: 'Done' },
                        { onSuccess: () => toast.success('Task marked Done') },
                      )
                    }
                  >
                    Mark done
                  </Button>
                </>
              }
            />
            <RecordLayout
              aside={
                <Card padded>
                  <CardHeader
                    title="Audit trail"
                    description="The immutable task audit records each creation, assignment, edit and status change."
                  />
                  <Button onClick={() => toast.success('Audit export recorded')}>
                    Export audit trail
                  </Button>
                </Card>
              }
            >
              <Card padded>
                <CardHeader title="Task details" />
                <InfoGrid
                  items={[
                    { label: 'Created by', value: task.createdBy },
                    { label: 'Created date and time', value: formatDateTime(task.createdAt) },
                    { label: 'Assigned to', value: task.assignee },
                    { label: 'Priority', value: task.priority },
                    {
                      label: 'Status',
                      value: (
                        <Badge shape="pill" tone={TASK_STATUS_TONE[display]}>
                          {display}
                        </Badge>
                      ),
                    },
                    { label: 'Due date', value: formatDateTime(task.dueAt) },
                  ]}
                />
              </Card>
              <Card padded>
                <CardHeader title="Task history" />
                <QueryState query={historyQuery}>
                  {(entries) => <Timeline label="Task history" entries={entries} />}
                </QueryState>
              </Card>
            </RecordLayout>
          </>
        )
      }}
    </QueryState>
  )
}
