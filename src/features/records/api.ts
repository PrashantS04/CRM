import type { Condition, DataType, DraftRecordField, FieldDef, FieldSectionDef, RecordField, Validation, Values, ViewDefinition, DisplayRules } from './fields/types'
import { request } from '@/api/crmClient'

/* ---------- Record types ---------- */

/** The configurable record types. Each has the same API under its own path. */
export type ObjectKey = 'person' | 'entity'

export interface ObjectInfo {
  key: ObjectKey
  singular: string
  plural: string
  /** Screen route, e.g. /persons. */
  route: string
  /** API base path, e.g. /api/persons. */
  api: string
  /** Permission prefix: PERSON_READ, ENTITY_CREATE... */
  perm: 'PERSON' | 'ENTITY'
}

export const OBJECTS: Record<ObjectKey, ObjectInfo> = {
  person: { key: 'person', singular: 'Person', plural: 'Persons', route: '/people', api: '/api/persons', perm: 'PERSON' },
  entity: { key: 'entity', singular: 'Entity', plural: 'Entities', route: '/entities', api: '/api/entities', perm: 'ENTITY' },
}

/* ---------- Server metadata (picklists, users) ---------- */

export interface ServerPicklistValue {
  code: string
  label: string
  arm: string
  active: boolean
  system: boolean
  parent: string | null
}

export interface ServerPicklist {
  code: string
  name: string
  description?: string | null
  /** Multi-select list. */
  multi?: boolean
  /** Locked lists can be relabelled and reordered only (the program depends on their values). */
  locked?: boolean
  /** Values still to be supplied by PrivateInvest. */
  placeholder?: boolean
  /** A dependent list: each value belongs to a value of this set. */
  parentSet?: string | null
  values: ServerPicklistValue[]
}

/** Record type labels, e.g. Person / Persons. */
export interface ServerObjectLabel {
  apiName: string
  label: string
  labelPlural: string
}

/** Business settings that are not field rules (time periods, review queue owners). */
export interface BusinessSettings {
  hotExpiryDays?: number
  inactiveAfterMonths?: number
  noteEditHours?: number
  personTypeQueueOwner?: string
  entityTypeQueueOwner?: string
  duplicateQueueOwner?: string
  [key: string]: unknown
}

export interface ServerMetadata {
  objects?: Record<string, ServerObjectLabel>
  picklists: Record<string, ServerPicklist>
  settings?: BusinessSettings
}

export interface ServerUser {
  id: string
  name: string
  email: string
  initials: string
}

export interface Me extends ServerUser {
  roles: string[]
  permissions: string[]
}

export const getMetadata = () => request<ServerMetadata>('GET', '/api/metadata')

/* ---------- Setup: labels, picklists and business settings ---------- */

export const updateObjectLabel = (object: ObjectKey, body: { label: string; labelPlural: string }) =>
  request<void>('PUT', `/api/metadata/objects/${object}`, body)

export const updateFieldLabel = (object: ObjectKey, apiName: string, label: string) =>
  request<void>('PUT', `/api/metadata/fields/${object}/${apiName}`, { label })

/** Partial update of one picklist value: anything left out stays as it is. */
export const updatePicklistValue = (setCode: string, code: string,
  body: { label?: string; arm?: 'CREDIT' | 'CAPITAL' | 'BOTH'; active?: boolean; sortOrder?: number }) =>
  request<void>('PUT', `/api/metadata/picklists/${setCode}/values/${code}`, body)

/** Puts a list's values in this order; every value of the list must be named once. */
export const orderPicklist = (setCode: string, codes: string[]) =>
  request<void>('PUT', `/api/metadata/picklists/${setCode}/order`, { codes })

export const updateSettings = (changes: Partial<BusinessSettings>) =>
  request<void>('PUT', '/api/metadata/settings', changes)
export const getUsers = () => request<ServerUser[]>('GET', '/api/metadata/users')
export const getMe = () => request<Me>('GET', '/api/me')

/* ---------- Record rules ---------- */

/** Which fields the CRM's rules use. Every field is configurable, so these are settings too. */
export interface ObjectRules {
  nameFields: string[]
  subtitleFields: string[]
  duplicateCheck: { nameFields: string[]; emailField: string | null; mobileField: string | null; dateOfBirthField: string | null }
  /** Fields no two live records may share (hard gate G1), e.g. ACN and ABN. */
  uniqueFields: string[]
  ownerField: string | null
  /** The field that classifies the record; a Person reads an Entity's through its links. */
  typeField: string | null
  reviewQueue: { field: string; values: string[] } | null
  defaultSort: { field: string; dir: 'ASC' | 'DESC' }[]
}

/** @deprecated The same shape for every record type; kept for older imports. */
export type PersonRules = ObjectRules

export const getRules = (object: ObjectKey = 'person') =>
  request<{ rules: ObjectRules; warnings: string[] }>('GET', `/api/metadata/objects/${object}/rules`)

export const updateRules = (r: ObjectRules, object: ObjectKey = 'person') =>
  request<{ rules: ObjectRules; warnings: string[] }>('PUT', `/api/metadata/objects/${object}/rules`, r)

export const getPersonRules = () => getRules('person')
export const updatePersonRules = (r: ObjectRules) => updateRules(r, 'person')

/* ---------- Field definitions ---------- */

export const getFields = (object: string, includeDisabled = false) =>
  request<FieldDef[]>('GET', `/api/metadata/objects/${object}/fields${includeDisabled ? '?includeDisabled=true' : ''}`)

export interface FieldInput {
  label: string
  help?: string | null
  mandatory: boolean
  expected?: boolean
  sensitive?: boolean
  defaultValue?: unknown
  showInList: boolean
  maxLength?: number | null
  decimalPlaces?: number | null
  placeholder?: string | null
  width?: 'HALF' | 'FULL'
  validation?: Validation
  showOnCreate?: boolean
  showOnDetail?: boolean
  searchable?: boolean
  filterable?: boolean
  sortable?: boolean
  section?: string
  displayRules?: DisplayRules
  optionsFrom?: string | null
  arm?: 'CREDIT' | 'CAPITAL' | 'BOTH'
}

export const createField = (object: string, dataType: DataType, f: FieldInput, picklistValues?: string[]) =>
  request<FieldDef>('POST', '/api/metadata/custom-fields', { object, dataType, picklistValues, ...f })

export const updateField = (id: string, version: number, f: FieldInput) =>
  request<FieldDef>('PUT', `/api/metadata/custom-fields/${id}`, { ...f, version })

export const setFieldActive = (id: string, active: boolean) =>
  request<FieldDef>('PUT', `/api/metadata/custom-fields/${id}/active`, { active })

export const orderFields = (object: string, fieldIds: string[], list = false) =>
  request<FieldDef[]>('PUT', '/api/metadata/custom-fields/order', { object, fieldIds, list })

/* ---------- Field sections ---------- */

export const getSections = (object: string) =>
  request<FieldSectionDef[]>('GET', `/api/metadata/objects/${object}/sections`)

export const createSection = (object: string, body: { name: string; description?: string | null }) =>
  request<FieldSectionDef>('POST', '/api/metadata/custom-field-sections', { object, ...body })

export const updateSection = (id: string, version: number, body: { name: string; description?: string | null }) =>
  request<FieldSectionDef>('PUT', `/api/metadata/custom-field-sections/${id}`, { ...body, version })

export const moveSection = (id: string, direction: -1 | 1) =>
  request<FieldSectionDef[]>('PUT', `/api/metadata/custom-field-sections/${id}/move`, { direction })

export const orderSections = (object: string, sectionIds: string[]) =>
  request<FieldSectionDef[]>('PUT', '/api/metadata/custom-field-sections/order', { object, sectionIds })

export const deleteSection = (id: string, version: number, moveTo?: string) =>
  request<{ deleted: string; fieldsMoved: number; movedTo?: string }>(
    'DELETE', `/api/metadata/custom-field-sections/${id}${moveTo ? `?moveTo=${moveTo}` : ''}`, undefined, version)

export const fieldUsage = (id: string) =>
  request<{ recordsWithValue: number; archivedRecordsWithValue: number; deletable: boolean }>('GET', `/api/metadata/custom-fields/${id}/usage`)

/**
 * Deletes a field. By default a soft delete: it leaves every screen, its values are kept, and it can be restored
 * from Deleted fields. `permanent` (only for a field already deleted) removes it and its values for good.
 */
export const deleteField = (id: string, version: number, permanent = false) =>
  request<{ deleted: string; permanent: boolean; valuesKept?: number; valuesDeleted?: number }>(
    'DELETE', `/api/metadata/custom-fields/${id}${permanent ? '?permanent=true' : ''}`, undefined, version)

/** A deleted field as Setup → Deleted fields lists it. */
export interface DeletedField extends FieldDef {
  deletedAt: string
  deletedBy: string
  deletedByName: string
  recordsWithValue: number
  archivedRecordsWithValue: number
}

export const getDeletedFields = (object = 'person') =>
  request<DeletedField[]>('GET', `/api/metadata/custom-fields/deleted?object=${object}`)

/** Brings a deleted field back exactly as it was, values included. */
export const restoreField = (id: string) => request<FieldDef>('POST', `/api/metadata/custom-fields/${id}/restore`)

export const addPicklistValue = (setCode: string, label: string, parent?: string) =>
  request<ServerPicklistValue>('POST', `/api/metadata/picklists/${setCode}/values`, { label, parent })

/* ---------- Records (Persons and Entities) ---------- */

/** One of a Person's Entity links. */
export interface PersonLink {
  id: string
  entityId: string
  entityName: string
  entityType: string | null
  role: string
  jobTitle: string | null
  department: string | null
  dateLinked: string
  email: string | null
  primary: boolean
}

/** One of an Entity's linked Persons. */
export interface EntityPersonLink {
  linkId: string
  personId: string
  personName: string
  primaryEmail: string | null
  primaryPhone: string | null
  role: string
  jobTitle: string | null
  department: string | null
  dateLinked: string
  primary: boolean
}

export interface RecordDetail {
  id: string
  object: ObjectKey
  /** The record name, built from the fields the "record name" rule names. */
  title: string
  version: number
  values: Values
  recordFields: RecordField[]
  dataGaps: string[]
  /** Fields removed from this record only; they don't show on its page or edit form. */
  hiddenFields: string[]
  /** Facts display conditions read besides fields, e.g. linkedEntityType. */
  context: Record<string, unknown>
  archived: boolean
  archivedAt: string | null
  createdAt: string
  updatedAt: string
  flags: { hotSince: string | null; possibleDuplicateReason: string | null }
  /** Person only: its Entity links and the type inherited through the primary one. */
  links?: PersonLink[]
  inheritedEntityType?: string | null
  /** Entity only: its linked Persons. */
  persons?: EntityPersonLink[]
}

/** @deprecated Kept for older imports. */
export type PersonRecord = RecordDetail

export interface DuplicateMatch {
  id: string
  name: string
  reasons: string[]
}

const base = (object: ObjectKey) => OBJECTS[object].api

export const getRecord = (object: ObjectKey, id: string, includeArchived = false) =>
  request<RecordDetail>('GET', `${base(object)}/${id}${includeArchived ? '?includeArchived=true' : ''}`)

export const createRecord = (object: ObjectKey, values: Values, recordFields: DraftRecordField[], duplicateReason?: string) =>
  request<RecordDetail>('POST', base(object), {
    values,
    recordFields: recordFields.map(({ label, dataType, value }) => ({ label, dataType, value })),
    duplicateReason,
  })

export const patchRecord = (object: ObjectKey, id: string, version: number, values: Values) =>
  request<RecordDetail>('PATCH', `${base(object)}/${id}`, { values }, version)

export const archiveRecord = (object: ObjectKey, id: string, version: number, reason: string) =>
  request<RecordDetail>('DELETE', `${base(object)}/${id}`, { reason }, version)

export const restoreRecord = (object: ObjectKey, id: string, version: number, duplicateReason?: string) =>
  request<RecordDetail>('POST', `${base(object)}/${id}/restore`, { duplicateReason }, version)

export const setRecordHot = (object: ObjectKey, id: string, hot: boolean) =>
  request<RecordDetail>('PUT', `${base(object)}/${id}/hot`, { hot })

export const addRecordFieldTo = (object: ObjectKey, id: string, f: { label: string; dataType: DataType; value: unknown }) =>
  request<RecordDetail>('POST', `${base(object)}/${id}/record-fields`, f)

export const updateRecordFieldOn = (object: ObjectKey, id: string, fieldId: string, f: { label: string; value: unknown; version: number }) =>
  request<RecordDetail>('PUT', `${base(object)}/${id}/record-fields/${fieldId}`, f)

export const removeRecordFieldFrom = (object: ObjectKey, id: string, fieldId: string) =>
  request<RecordDetail>('DELETE', `${base(object)}/${id}/record-fields/${fieldId}`)

/** Removes a field from this record only: its value is deleted; other records keep the field. */
export const removeFieldFrom = (object: ObjectKey, id: string, apiName: string) =>
  request<RecordDetail>('DELETE', `${base(object)}/${id}/fields/${apiName}`)

/** Adds a field removed from this record back to it. */
export const addFieldBackTo = (object: ObjectKey, id: string, apiName: string) =>
  request<RecordDetail>('POST', `${base(object)}/${id}/fields/${apiName}`)

/* Person-named wrappers used by older screens. */
export const getPerson = (id: string, includeArchived = false) => getRecord('person', id, includeArchived)
export const createPerson = (values: Values, recordFields: DraftRecordField[], duplicateReason?: string) =>
  createRecord('person', values, recordFields, duplicateReason)
export const patchPerson = (id: string, version: number, values: Values) => patchRecord('person', id, version, values)
export const archivePerson = (id: string, version: number, reason: string) => archiveRecord('person', id, version, reason)
export const restorePerson = (id: string, version: number, duplicateReason?: string) =>
  restoreRecord('person', id, version, duplicateReason)
export const addRecordField = (id: string, f: { label: string; dataType: DataType; value: unknown }) => addRecordFieldTo('person', id, f)
export const updateRecordField = (id: string, fieldId: string, f: { label: string; value: unknown; version: number }) =>
  updateRecordFieldOn('person', id, fieldId, f)
export const removePersonField = (id: string, apiName: string) => removeFieldFrom('person', id, apiName)
export const addPersonFieldBack = (id: string, apiName: string) => addFieldBackTo('person', id, apiName)
export const removeRecordField = (id: string, fieldId: string) => removeRecordFieldFrom('person', id, fieldId)

/* ---------- Entity links ---------- */

export interface LinkInput {
  personId: string
  entityId: string
  role: string
  jobTitle?: string | null
  department?: string | null
  email?: string | null
  primary?: boolean
}

export const createLink = (l: LinkInput) => request<{ id: string }>('POST', '/api/entity-links', l)
export const updateLink = (id: string, l: { role: string; jobTitle?: string | null; department?: string | null; email?: string | null }) =>
  request<void>('PUT', `/api/entity-links/${id}`, l)
export const makeLinkPrimary = (id: string) => request<void>('PUT', `/api/entity-links/${id}/primary`)
export const deleteLink = (id: string) => request<void>('DELETE', `/api/entity-links/${id}`)

/* ---------- Search and picker ---------- */

export interface SearchRequest {
  q?: string
  scope?: 'ACTIVE' | 'ARCHIVED'
  ownerScope?: 'ALL' | 'MINE'
  /** Only flagged records: the duplicate review queue, or Hot records. */
  flag?: 'POSSIBLE_DUPLICATE' | 'HOT'
  conditions?: Condition[]
  logic?: string
  sort?: { field: string; dir: 'ASC' | 'DESC' }[]
  columns?: string[]
  page?: number
  size?: number
}

export interface SearchItem {
  id: string
  version: number
  title: string
  archived: boolean
  values: Values
}

export interface SearchPage {
  items: SearchItem[]
  columns: string[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export const searchRecords = (object: ObjectKey, r: SearchRequest) => request<SearchPage>('POST', `${base(object)}/search`, r)
export const searchPersons = (r: SearchRequest) => searchRecords('person', r)

export interface LookupItem {
  id: string
  title: string
  subtitle: string | null
}

export function lookupRecords(object: ObjectKey, p: {
  q?: string; page?: number; size?: number; exclude?: string[]; ids?: string[]
  /** Narrow the choice to records whose field holds one of these values. */
  field?: string; values?: string[]
}) {
  const qs = new URLSearchParams()
  if (p.q) qs.set('q', p.q)
  qs.set('page', String(p.page ?? 0))
  qs.set('size', String(p.size ?? 20))
  if (p.exclude?.length) qs.set('exclude', p.exclude.join(','))
  if (p.ids?.length) qs.set('ids', p.ids.join(','))
  if (p.field && p.values?.length) {
    qs.set('field', p.field)
    qs.set('values', p.values.join(','))
  }
  return request<{ items: LookupItem[]; hasMore: boolean }>('GET', `${base(object)}/lookup?${qs}`)
}

export const lookupPersons = (p: { q?: string; page?: number; size?: number; exclude?: string[]; ids?: string[] }) =>
  lookupRecords('person', p)

/* ---------- Saved list views ---------- */

export interface ListView extends ViewDefinition {
  id: string
  object: string
  name: string
  ownerId: string
  ownerName: string
  shared: boolean
  pinned: boolean
  canEdit: boolean
  updatedAt: string
  version: number
}

export interface ListViewInput extends ViewDefinition {
  name: string
  shared: boolean
}

export const getListViews = (object = 'person') => request<ListView[]>('GET', `/api/list-views?object=${object}`)

export const createListView = (v: ListViewInput, object = 'person') =>
  request<ListView>('POST', `/api/list-views?object=${object}`, { ...v, logic: v.logic || null })

export const updateListView = (id: string, version: number, v: ListViewInput) =>
  request<ListView>('PUT', `/api/list-views/${id}`, { ...v, logic: v.logic || null }, version)

export const deleteListView = (id: string) => request<void>('DELETE', `/api/list-views/${id}`)

export const pinListView = (id: string) => request<ListView>('PUT', `/api/list-views/${id}/pin`)

export const unpinListView = (object = 'person') => request<void>('DELETE', `/api/list-views/pin?object=${object}`)
