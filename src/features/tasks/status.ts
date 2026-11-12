import type { BadgeTone } from '@/components/ui'
import { isOverdue } from '@/lib/date'
import type { Task } from '@/types/domain'

export type TaskDisplayStatus = Task['status'] | 'Overdue'

/** "Overdue" is derived from the due date; it is not a stored status (brief §3.6.5). */
export function getTaskDisplayStatus(
  task: Pick<Task, 'status' | 'dueAt'>,
  now = new Date(),
): TaskDisplayStatus {
  const active = task.status === 'Open' || task.status === 'In Progress'
  return active && isOverdue(task.dueAt, now) ? 'Overdue' : task.status
}

export const TASK_STATUS_TONE: Record<TaskDisplayStatus, BadgeTone> = {
  Overdue: 'brand',
  'In Progress': 'info',
  Open: 'neutral',
  Done: 'success',
  Cancelled: 'neutral',
}

/** Case-insensitive match between a task's "related to" text and one of a record's names. */
export function isTaskForRecord(
  task: Pick<Task, 'relatedTo'>,
  ...names: (string | undefined)[]
): boolean {
  const related = task.relatedTo.toLowerCase()
  return names.some((name) => {
    const candidate = name?.toLowerCase()
    return Boolean(candidate) && (candidate!.startsWith(related) || related.startsWith(candidate!))
  })
}
