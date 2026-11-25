import { request } from '@/api/crmClient'
import { OBJECTS, type ObjectKey } from './api'
import type { BadgeTone as Tone } from '@/components/ui'

export interface AuditChange {
  field: string
  label: string
  before: unknown
  after: unknown
  sensitive: boolean
  redacted: boolean
}

export interface AuditEntry {
  id: number
  recordKind: string
  recordId: string | null
  action: string
  targetLabel: string | null
  changes: AuditChange[]
  details: Record<string, unknown>
  reason: string | null
  userId: string
  userName: string
  userInitials: string
  occurredAt: string
}

export interface AuditPage {
  items: AuditEntry[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export const KIND_LABELS: Record<string, string> = {
  person: 'Person',
  entity: 'Entity',
  entity_link: 'Entity link',
  custom_field_def: 'Field definition',
  picklist_value: 'Picklist value',
  list_view: 'List view',
  app_setting: 'Rules & settings',
  object_def: 'Object label',
  field_def: 'Field label',
}

export function actionPresentation(entry: AuditEntry): { label: string; tone: Tone } {
  if (entry.recordKind === 'entity_link') {
    switch (entry.action) {
      case 'create':
        return { label: 'Linked entity', tone: 'info' }
      case 'update':
        return { label: 'Updated link', tone: 'neutral' }
      case 'delete':
        return { label: 'Unlinked entity', tone: 'warning' }
      case 'make-primary':
        return { label: 'Set primary link', tone: 'info' }
    }
  }
  switch (entry.action) {
    case 'create':
      return { label: 'Created', tone: 'success' }
    case 'update':
    case 'update-custom-fields':
      return { label: 'Updated', tone: 'info' }
    case 'archive':
      return { label: 'Archived', tone: 'warning' }
    case 'restore':
      return { label: 'Restored', tone: 'success' }
    case 'delete':
      return { label: 'Deleted (soft)', tone: 'warning' }
    case 'delete-permanently':
      return { label: 'Deleted permanently', tone: 'brand' }
    case 'retire':
      return { label: 'Disabled', tone: 'neutral' }
    case 'reactivate':
      return { label: 'Enabled', tone: 'success' }
    case 'flag-hot':
      return { label: 'Flagged Hot', tone: 'brand' }
    case 'clear-hot':
      return { label: 'Cleared Hot', tone: 'neutral' }
    case 'remove-field':
      return { label: 'Removed field', tone: 'warning' }
    case 'add-field-back':
      return { label: 'Restored field', tone: 'success' }
    case 'add-record-field':
      return { label: 'Added one-off field', tone: 'info' }
    case 'update-record-field':
      return { label: 'Updated one-off field', tone: 'info' }
    case 'remove-record-field':
      return { label: 'Removed one-off field', tone: 'warning' }
    case 'order':
    case 'order-list':
    case 'move':
      return { label: 'Reordered', tone: 'neutral' }
    default:
      return { label: entry.action.replace(/-/g, ' '), tone: 'neutral' }
  }
}

export function getRecordHistory(object: ObjectKey, id: string, page = 0, size = 25) {
  const qs = new URLSearchParams({ page: String(page), size: String(size) })
  return request<AuditPage>('GET', `${OBJECTS[object].api}/${id}/history?${qs}`)
}

export function getAuditLog(params: {
  recordKind?: string
  recordId?: string
  action?: string
  userId?: string
  page?: number
  size?: number
}) {
  const qs = new URLSearchParams()
  if (params.recordKind) qs.set('recordKind', params.recordKind)
  if (params.recordId) qs.set('recordId', params.recordId)
  if (params.action) qs.set('action', params.action)
  if (params.userId) qs.set('userId', params.userId)
  qs.set('page', String(params.page ?? 0))
  qs.set('size', String(params.size ?? 25))
  return request<AuditPage>('GET', `/api/audit?${qs}`)
}
