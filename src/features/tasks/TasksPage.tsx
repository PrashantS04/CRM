import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QueryState } from '@/components/feedback/QueryState'
import {
  Badge,
  Button,
  Card,
  DataTable,
  FilterBar,
  FilterSelect,
  PageHeader,
  RecordLink,
  SearchInput,
  type Column,
} from '@/components/ui'
import { uniqueSorted } from '@/lib/collections'
import { formatDateTime } from '@/lib/format'
import type { Task } from '@/types/domain'
import { useTasks } from './hooks'
import { NewTaskDialog } from './NewTaskDialog'
import { getTaskDisplayStatus, TASK_STATUS_TONE } from './status'

type StatusFilter = 'active' | 'overdue' | 'completed' | 'all'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Open and In Progress' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'completed', label: 'Completed' },
]

const matchesStatus = (task: Task, filter: StatusFilter) => {
  const display = getTaskDisplayStatus(task)
  if (filter === 'active')
    return display === 'Open' || display === 'In Progress' || display === 'Overdue'
  if (filter === 'overdue') return display === 'Overdue'
  if (filter === 'completed') return display === 'Done'
  return true
}

export function TasksPage() {
  const navigate = useNavigate()
  const query = useTasks()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('active')
  const [related, setRelated] = useState('')
  const [createdBy, setCreatedBy] = useState('')
  const [creating, setCreating] = useState(false)

  const columns = useMemo<Column<Task>[]>(
    () => [
      {
        key: 'title',
        header: 'Task',
        cell: (task) => <RecordLink to={`/tasks/${task.id}`}>{task.title}</RecordLink>,
      },
      { key: 'related', header: 'Related to', cell: (task) => task.relatedTo },
      { key: 'createdBy', header: 'Created by', cell: (task) => task.createdBy },
      {
        key: 'created',
        header: 'Created date and time',
        cell: (task) => formatDateTime(task.createdAt),
      },
      { key: 'assignee', header: 'Assigned to', cell: (task) => task.assignee },
      {
        key: 'status',
        header: 'Status',
        cell: (task) => {
          const display = getTaskDisplayStatus(task)
          return (
            <Badge shape="pill" tone={TASK_STATUS_TONE[display]}>
              {display}
            </Badge>
          )
        },
      },
    ],
    [],
  )

  return (
    <>
      <PageHeader
        title="My tasks"
        description="Task ownership, assignment history and auditable status changes."
        actions={
          <Button
            variant="primary"
            startIcon={<Plus size={16} />}
            onClick={() => setCreating(true)}
          >
            New task
          </Button>
        }
      />
      <QueryState query={query}>
        {(tasks) => {
          const term = search.trim().toLowerCase()
          const rows = tasks.filter(
            (task) =>
              matchesStatus(task, status) &&
              (!related || task.relatedTo === related) &&
              (!createdBy || task.createdBy === createdBy) &&
              (!term || `${task.title} ${task.relatedTo}`.toLowerCase().includes(term)),
          )
          return (
            <>
              <FilterBar>
                <SearchInput value={search} onChange={setSearch} placeholder="Search tasks" />
                <FilterSelect
                  value={status === 'all' ? '' : status}
                  onChange={(value) => setStatus((value || 'all') as StatusFilter)}
                  options={STATUS_OPTIONS}
                  allLabel="All tasks"
                />
                <FilterSelect
                  value={related}
                  onChange={setRelated}
                  options={uniqueSorted(tasks.map((t) => t.relatedTo))}
                  allLabel="All related records"
                />
                <FilterSelect
                  value={createdBy}
                  onChange={setCreatedBy}
                  options={uniqueSorted(tasks.map((t) => t.createdBy))}
                  allLabel="Created by anyone"
                />
              </FilterBar>
              <Card>
                <DataTable
                  label="Tasks"
                  columns={columns}
                  rows={rows}
                  getRowId={(task) => task.id}
                  onRowClick={(task) => navigate(`/tasks/${task.id}`)}
                  emptyMessage="No tasks match these filters."
                  minWidth={900}
                />
              </Card>
            </>
          )
        }}
      </QueryState>
      <NewTaskDialog open={creating} onClose={() => setCreating(false)} />
    </>
  )
}
