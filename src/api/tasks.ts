import { db, nextId } from '@/mocks/db'
import type { ID, Task, TaskArea, TaskPriority, TaskStatus } from '@/types/domain'
import { notFound, respond } from './http'

export interface CreateTaskInput {
  title: string
  relatedTo: string
  area: TaskArea
  assignee: string
  priority: TaskPriority
  dueAt: string
  createdBy: string
}

export const tasksApi = {
  list: () => respond(db.tasks),

  async get(id: ID) {
    const task = db.tasks.find((t) => t.id === id)
    return task ? respond(task) : notFound('Task', id)
  },

  async create(input: CreateTaskInput) {
    const task: Task = {
      ...input,
      id: nextId('t'),
      createdAt: new Date().toISOString(),
      status: 'Open',
    }
    db.tasks.unshift(task)
    return respond(task)
  },

  /** Tasks are never deleted, only Cancelled (brief §3.6.5). */
  async setStatus(id: ID, status: TaskStatus) {
    const task = db.tasks.find((t) => t.id === id)
    if (!task) return notFound('Task', id)
    task.status = status
    return respond(task)
  },
}
