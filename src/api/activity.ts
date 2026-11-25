import { CURRENT_USER } from '@/constants/lists'
import { formatDateTime } from '@/lib/format'
import {
  buildEntityTimeline,
  buildOpportunityActivity,
  buildOpportunityAudit,
  buildPersonTimeline,
  buildTaskHistory,
} from '@/mocks/activity'
import { db, nextId } from '@/mocks/db'
import type { ActivityItem, ID, TimelineEntry } from '@/types/domain'
import { notFound, respond } from './http'

const noteToActivity = (note: { id: ID; text: string; author: string; createdAt: string }) =>
  ({
    id: note.id,
    kind: 'note',
    title: 'Note added',
    detail: `“${note.text}”`,
    meta: `${note.author} · ${formatDateTime(note.createdAt)}`,
    status: 'Note',
    group: 'Recent notes',
  }) satisfies ActivityItem

const noteToTimeline = (note: { id: ID; text: string; author: string; createdAt: string }) =>
  ({
    id: note.id,
    title: 'Note added',
    detail: `“${note.text}” · ${formatDateTime(note.createdAt)} · ${note.author}`,
  }) satisfies TimelineEntry

const notesFor = (recordId: ID) => db.notes.filter((n) => n.recordId === recordId)

export const activityApi = {
  async opportunityActivity(id: ID) {
    const opportunity = db.opportunities.find((o) => o.id === id)
    if (!opportunity) return notFound('Opportunity', id)
    return respond([...notesFor(id).map(noteToActivity), ...buildOpportunityActivity(opportunity)])
  },

  async opportunityAudit(id: ID) {
    const opportunity = db.opportunities.find((o) => o.id === id)
    return opportunity ? respond(buildOpportunityAudit(opportunity)) : notFound('Opportunity', id)
  },

  async personTimeline(id: ID) {
    const person = db.people.find((p) => p.id === id)
    if (!person) return notFound('Person', id)
    return respond([...notesFor(id).map(noteToTimeline), ...buildPersonTimeline(person)])
  },

  async entityTimeline(id: ID) {
    const entity = db.entities.find((e) => e.id === id)
    if (!entity) return notFound('Entity', id)
    return respond([...notesFor(id).map(noteToTimeline), ...buildEntityTimeline(entity)])
  },

  async taskHistory(id: ID) {
    const task = db.tasks.find((t) => t.id === id)
    return task ? respond(buildTaskHistory(task)) : notFound('Task', id)
  },

  /** Notes are append-only: never deleted (brief §3.6.1). */
  async addNote(recordId: ID, text: string) {
    const note = {
      id: nextId('n'),
      recordId,
      text,
      author: CURRENT_USER,
      createdAt: new Date().toISOString(),
    }
    db.notes.unshift(note)
    return respond(note)
  },
}
