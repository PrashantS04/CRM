import type { Entity, ID, Opportunity, Person, PipelineDefinition, Task } from '@/types/domain'
import { seedEntities, seedOpportunities, seedPeople, seedPipelines, seedTasks } from './data'

export interface NoteRecord {
  id: ID
  recordId: ID
  text: string
  author: string
  createdAt: string
}

interface Database {
  people: Person[]
  entities: Entity[]
  opportunities: Opportunity[]
  tasks: Task[]
  pipelines: PipelineDefinition[]
  notes: NoteRecord[]
}

function createDatabase(): Database {
  return {
    people: seedPeople(),
    entities: seedEntities(),
    opportunities: seedOpportunities(),
    tasks: seedTasks(),
    pipelines: seedPipelines(),
    notes: [],
  }
}

/** In-memory store standing in for CRM-Backend until the real API exists. */
export const db: Database = createDatabase()

/** Restores seed data. Used by tests. */
export function resetDatabase(): void {
  Object.assign(db, createDatabase())
}

let counter = 100
export function nextId(prefix: string): ID {
  counter += 1
  return `${prefix}${counter}`
}
