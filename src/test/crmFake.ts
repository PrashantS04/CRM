/**
 * An in-memory stand-in for the CRM backend, for component tests: the same routes, shapes and error codes
 * (validation, duplicate-block) as the Spring Boot API, with a few Persons and Entities.
 */
import { vi } from 'vitest'

type Json = Record<string, unknown>

const field = (object: string, apiName: string, label: string, dataType: string, extra: Json = {}): Json => ({
  id: `${object}-${apiName}`, object, apiName, label, help: null, dataType, picklist: null, mandatory: false, expected: false,
  sensitive: false, defaultValue: null, showInList: false, maxLength: null, decimalPlaces: null, sortOrder: 0, active: true,
  version: 0, storage: 'CUSTOM', systemKey: null, placeholder: null, width: 'HALF', validation: {}, showOnCreate: true,
  showOnDetail: true, listOrder: 0, searchable: true, filterable: true, sortable: true, editableAfterCreate: true,
  requiredLocked: false, section: 'Details', displayRules: {}, formula: null, optionsFrom: null, arm: 'BOTH', system: false,
  deletable: true, canEdit: true, operators: OPERATORS[dataType] ?? ['EQUALS', 'IS_EMPTY', 'IS_NOT_EMPTY'], ...extra,
})

/** The operators the server offers per field type (a subset, enough for the list filters). */
const OPERATORS: Record<string, string[]> = {
  TEXT: ['EQUALS', 'NOT_EQUALS', 'CONTAINS', 'STARTS_WITH', 'IS_EMPTY', 'IS_NOT_EMPTY'],
  PICKLIST: ['IN', 'NOT_IN', 'IS_EMPTY', 'IS_NOT_EMPTY'],
  MULTI_PICKLIST: ['CONTAINS_ANY', 'CONTAINS_ALL', 'EXCLUDES', 'IS_EMPTY', 'IS_NOT_EMPTY'],
  USER: ['IN', 'NOT_IN', 'IS_ME', 'IS_EMPTY', 'IS_NOT_EMPTY'],
}

/** Enough of the server's filter engine for tests: picklist and user conditions, all ANDed. */
function matches(values: Json, c: { field: string; operator: string; value?: unknown }): boolean {
  const v = values[c.field]
  const have = Array.isArray(v) ? (v as string[]) : v == null ? [] : [String(v)]
  const want = Array.isArray(c.value) ? (c.value as string[]) : []
  switch (c.operator) {
    case 'IN': case 'CONTAINS_ANY': return have.some((x) => want.includes(x))
    case 'NOT_IN': case 'EXCLUDES': return !have.some((x) => want.includes(x))
    case 'CONTAINS_ALL': return want.every((x) => have.includes(x))
    case 'IS_EMPTY': return have.length === 0
    case 'IS_NOT_EMPTY': return have.length > 0
    default: return true
  }
}

const FIELDS: Record<string, Json[]> = {
  person: [
    field('person', 'personTypes', 'Type of contact', 'MULTI_PICKLIST', { picklist: 'PERSON_TYPE', mandatory: true, section: 'Classification', showInList: true }),
    field('person', 'firstName', 'First Name', 'TEXT', { mandatory: true, section: 'Personal details' }),
    field('person', 'lastName', 'Last Name', 'TEXT', { mandatory: true, section: 'Personal details' }),
    field('person', 'emails', 'Email', 'EMAIL_LIST', { picklist: 'EMAIL_LABEL', mandatory: true, section: 'Personal details', showInList: true }),
    field('person', 'phones', 'Phones', 'PHONE_LIST', { picklist: 'PHONE_LABEL', section: 'Personal details' }),
    field('person', 'ownerId', 'Owner', 'USER', { mandatory: true, section: 'Sales tracking', showInList: true }),
  ],
  entity: [
    field('entity', 'name', 'Entity name', 'TEXT', { mandatory: true, section: 'Entity details' }),
    field('entity', 'acn', 'ACN', 'TEXT', { validation: { format: 'ACN' }, section: 'Entity details', showInList: true }),
    field('entity', 'abn', 'ABN', 'TEXT', { validation: { format: 'ABN' }, section: 'Entity details', showInList: true }),
    field('entity', 'entityType', 'Entity type', 'PICKLIST', { picklist: 'ENTITY_TYPE', mandatory: true, section: 'Entity details', showInList: true }),
    field('entity', 'ownerId', 'Owner', 'USER', { mandatory: true, section: 'Status' }),
  ],
}

const RULES: Record<string, Json> = {
  person: { nameFields: ['firstName', 'lastName'], subtitleFields: ['emails'], uniqueFields: [], ownerField: 'ownerId', typeField: 'personTypes',
    reviewQueue: { field: 'personTypes', values: ['NOT_YET_KNOWN'] }, defaultSort: [],
    duplicateCheck: { nameFields: ['firstName', 'lastName'], emailField: 'emails', mobileField: 'phones', dateOfBirthField: null } },
  entity: { nameFields: ['name'], subtitleFields: ['entityType'], uniqueFields: ['acn', 'abn'], ownerField: 'ownerId', typeField: 'entityType',
    reviewQueue: { field: 'entityType', values: ['NOT_YET_KNOWN'] }, defaultSort: [],
    duplicateCheck: { nameFields: ['name'], emailField: null, mobileField: null, dateOfBirthField: null } },
}

const list = (code: string, labels: [string, string][], extra: Json = {}) => ({
  code, name: code, description: null, multi: false, locked: false, placeholder: false, parentSet: null, ...extra,
  values: labels.map(([c, label]) => ({ code: c, label, arm: 'BOTH', active: true, system: false, parent: null })),
})
const PICKLISTS = {
  PERSON_TYPE: list('PERSON_TYPE', [['BORROWER', 'Borrower'], ['INVESTOR', 'Investor'], ['ADVISER', 'Adviser'], ['NOT_YET_KNOWN', 'Not yet known']],
    { name: 'Type of contact', multi: true }),
  EMAIL_LABEL: list('EMAIL_LABEL', [['BUSINESS', 'Business'], ['PERSONAL', 'Personal']]),
  PHONE_LABEL: list('PHONE_LABEL', [['MOBILE', 'Mobile'], ['OFFICE', 'Business']]),
  ENTITY_TYPE: list('ENTITY_TYPE', [['DEVELOPER', 'Developer'], ['FAMILY_OFFICE', 'Family Office'], ['NOT_YET_KNOWN', 'Not yet known']]),
  ENTITY_LINK_ROLE: list('ENTITY_LINK_ROLE', [['DECISION_MAKER', 'Decision maker'], ['TRUSTEE', 'Trustee']]),
}
const USERS = [
  { id: 'u1', name: 'Sophie Turner', email: 'sophie@example.test', initials: 'ST' },
  { id: 'u2', name: 'Daniel Ng', email: 'daniel@example.test', initials: 'DN' },
]
const OBJECT_LABELS = {
  person: { apiName: 'person', label: 'Person', labelPlural: 'Persons' },
  entity: { apiName: 'entity', label: 'Entity', labelPlural: 'Entities' },
}
const SETTINGS = { hotExpiryDays: 30, inactiveAfterMonths: 12, noteEditHours: 24, personTypeQueueOwner: 'u2',
  entityTypeQueueOwner: 'u2', duplicateQueueOwner: 'u1' }
const AUDIT = [
  { id: 1, recordKind: 'person', recordId: 'p1', action: 'update', targetLabel: 'James Caldwell', reason: null, details: {},
    changes: [{ field: 'personTypes', label: 'Type of contact', before: ['INVESTOR'], after: ['BORROWER'], sensitive: false, redacted: false }],
    userId: 'u1', userName: 'Sophie Turner', userInitials: 'ST', occurredAt: '2026-11-18T09:00:00Z' },
  { id: 2, recordKind: 'picklist_value', recordId: null, action: 'create', targetLabel: null, reason: null, details: {}, changes: [],
    userId: 'u2', userName: 'Daniel Ng', userInitials: 'DN', occurredAt: '2026-11-17T09:00:00Z' },
]

/** Configuration the tests may change; reset for every test. */
let meta: { fields: Record<string, Json[]>; picklists: Record<string, ReturnType<typeof list>>; objects: typeof OBJECT_LABELS; settings: Json } =
  structuredClone({ fields: FIELDS, picklists: PICKLISTS, objects: OBJECT_LABELS, settings: SETTINGS })

/** Sections created in a test that have no fields yet. */
let extraSections: Record<string, string[]> = {}

/** Sections derived from the fields, as the server lists them. */
function sections(object: string) {
  const names = [...new Set([...meta.fields[object]!.map((f) => String(f.section)), ...(extraSections[object] ?? [])])]
  return names.map((name, i) => {
    const inIt = meta.fields[object]!.filter((f) => f.section === name)
    return { id: `${object}-sec-${i}`, object, name, description: null, sortOrder: i, version: 0, fieldCount: inIt.length,
      activeFieldCount: inIt.filter((f) => f.active).length, deletedFieldCount: 0 }
  })
}
const ME = { ...USERS[0], roles: ['ADMIN'], permissions: ['PERSON_READ', 'PERSON_CREATE', 'PERSON_EDIT', 'PERSON_ARCHIVE',
  'ENTITY_READ', 'ENTITY_CREATE', 'ENTITY_EDIT', 'ENTITY_ARCHIVE', 'CUSTOM_FIELD_MANAGE'] }

interface Rec { id: string; values: Json; version: number; recordFields?: Json[]; hidden?: string[] }
let records: Record<string, Rec[]> = {}

function seed() {
  meta = structuredClone({ fields: FIELDS, picklists: PICKLISTS, objects: OBJECT_LABELS, settings: SETTINGS })
  extraSections = {}
  records = {
    person: [
      { id: 'p1', version: 0, values: { firstName: 'James', lastName: 'Caldwell', personTypes: ['BORROWER'], ownerId: 'u1',
        emails: [{ label: 'BUSINESS', value: 'james.caldwell@harbourview.com.au', primary: true }],
        phones: [{ label: 'MOBILE', value: '0412 830 412', primary: true }] } },
      { id: 'p2', version: 0, values: { firstName: 'Olivia', lastName: 'Bennett', personTypes: ['ADVISER'], ownerId: 'u1',
        emails: [{ label: 'BUSINESS', value: 'olivia@crestadvisory.com.au', primary: true }] } },
    ],
    entity: [
      { id: 'e1', version: 0, values: { name: 'Harbourview Group Limited', entityType: 'DEVELOPER', acn: '618432910', ownerId: 'u1' } },
      { id: 'e2', version: 0, values: { name: 'Mitchell Family Office', entityType: 'FAMILY_OFFICE', acn: '000000019', ownerId: 'u1' } },
    ],
  }
}

const title = (object: string, v: Json) =>
  ((RULES[object].nameFields as string[]).map((f) => v[f]).filter(Boolean).join(' ') || '(No name)')

function detail(object: string, r: Rec): Json {
  return {
    id: r.id, object, title: title(object, r.values), version: r.version, values: r.values, recordFields: r.recordFields ?? [], dataGaps: [],
    hiddenFields: r.hidden ?? [], context: {}, archived: false, archivedAt: null, createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z',
    flags: { hotSince: null, possibleDuplicateReason: null },
    ...(object === 'person'
      ? { links: r.id === 'p1' ? [{ id: 'l1', entityId: 'e1', entityName: 'Harbourview Group Limited', entityType: 'DEVELOPER',
          role: 'DECISION_MAKER', jobTitle: 'Director', department: null, dateLinked: '2026-10-21', email: null, primary: true }] : [],
          inheritedEntityType: r.id === 'p1' ? 'DEVELOPER' : null }
      : { persons: [] }),
  }
}

/** Every request the fake answered, for assertions. */
export const calls: { method: string; path: string; body?: unknown }[] = []

function respond(status: number, body: unknown) {
  return Promise.resolve(new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }))
}

/** Replaces fetch with the fake API for the current test file. Call in beforeEach. */
export function installCrmFake() {
  seed()
  calls.length = 0
  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost')
    const method = init?.method ?? 'GET'
    const body = init?.body ? JSON.parse(String(init.body)) : undefined
    calls.push({ method, path: url.pathname + url.search, body })
    const p = url.pathname
    let m: RegExpMatchArray | null
    if (p === '/api/metadata') return respond(200, { objects: meta.objects, picklists: meta.picklists, settings: meta.settings, fields: [], customFields: [] })
    if (p === '/api/metadata/settings' && method === 'PUT') {
      Object.assign(meta.settings, body)
      return respond(204, undefined)
    }
    if ((m = p.match(/^\/api\/metadata\/objects\/(person|entity)$/)) && method === 'PUT') {
      Object.assign(meta.objects[m[1] as 'person'], body)
      return respond(204, undefined)
    }
    if ((m = p.match(/^\/api\/metadata\/fields\/(person|entity)\/(\w+)$/)) && method === 'PUT') {
      const f = meta.fields[m[1]]!.find((x) => x.apiName === m![2])
      if (!f) return respond(404, { code: 'not-found', detail: 'Field not found' })
      f.label = body.label
      return respond(204, undefined)
    }
    if ((m = p.match(/^\/api\/metadata\/picklists\/(\w+)\/(values|order)(?:\/(\w+))?$/))) {
      const set = meta.picklists[m[1]]
      if (!set) return respond(404, { code: 'not-found', detail: 'Picklist not found' })
      if (m[2] === 'order') {
        set.values = (body.codes as string[]).map((c) => set.values.find((v) => v.code === c)!)
        return respond(204, undefined)
      }
      if (method === 'POST') {
        const v = { code: String(body.label).toUpperCase().replace(/\W+/g, '_'), label: body.label, arm: 'BOTH', active: true, system: false, parent: body.parent ?? null }
        set.values.push(v)
        return respond(201, v)
      }
      const v = set.values.find((x) => x.code === m![3])
      if (!v) return respond(404, { code: 'not-found', detail: 'Value not found' })
      const { sortOrder: _ignored, ...change } = body as Json
      Object.assign(v, change)
      return respond(204, undefined)
    }
    if ((m = p.match(/^\/api\/metadata\/objects\/(person|entity)\/sections$/))) return respond(200, sections(m[1]))
    if (p === '/api/metadata/custom-field-sections' && method === 'POST') {
      const object = String(body.object)
      // A new, empty section: kept as a field-less name so the derived list includes it.
      extraSections[object] = [...(extraSections[object] ?? []), String(body.name)]
      return respond(201, sections(object).find((x) => x.name === body.name))
    }
    if (p === '/api/metadata/custom-fields' && method === 'POST') {
      const object = String(body.object)
      const f = field(object, String(body.label).replace(/\W+(\w)/g, (_, c: string) => c.toUpperCase()).replace(/^\w/, (c) => c.toLowerCase()),
        String(body.label), String(body.dataType), { section: body.section, mandatory: !!body.mandatory, showOnCreate: body.showOnCreate ?? true })
      meta.fields[object]!.push(f)
      return respond(201, f)
    }
    if (p === '/api/audit') {
      const kind = url.searchParams.get('recordKind')
      const items = AUDIT.filter((a) => !kind || a.recordKind === kind)
      return respond(200, { items, page: 0, size: 15, totalElements: items.length, totalPages: 1 })
    }
    if (p === '/api/metadata/users') return respond(200, USERS)
    if (p === '/api/me') return respond(200, ME)
    if ((m = p.match(/^\/api\/metadata\/objects\/(person|entity)\/fields$/))) return respond(200, meta.fields[m[1]])
    if ((m = p.match(/^\/api\/metadata\/objects\/(person|entity)\/rules$/))) return respond(200, { rules: RULES[m[1]], warnings: [] })
    if (p.startsWith('/api/metadata/custom-fields/deleted')) return respond(200, [])
    const base = p.match(/^\/api\/(persons|entities)(.*)$/)
    if (base) {
      const object = base[1] === 'persons' ? 'person' : 'entity'
      const rest = base[2]
      if (rest === '/search') {
        const q = String(body?.q ?? '').toLowerCase()
        const conditions = (body?.conditions ?? []) as { field: string; operator: string; value?: unknown }[]
        const items = records[object].filter((r) => !q || title(object, r.values).toLowerCase().includes(q))
          .filter((r) => conditions.every((c) => matches(r.values, c)))
          .map((r) => ({ id: r.id, version: r.version, title: title(object, r.values), archived: false, values: r.values }))
        const columns = meta.fields[object]!.filter((f) => f.showInList).map((f) => f.apiName)
        return respond(200, { items, columns, page: 0, size: 25, totalElements: items.length, totalPages: 1 })
      }
      if (rest === '' && method === 'POST') {
        const values = body.values as Json
        // Like the backend: ABN and ACN are compared as digits.
        if (typeof values.acn === 'string') values.acn = values.acn.replace(/\D/g, '')
        const clash = records[object].find((r) => values.acn && r.values.acn === values.acn)
        if (clash) {
          return respond(409, { code: 'duplicate-block', detail: 'This ACN already belongs to another Entity.', field: 'ACN',
            existingId: clash.id, existingName: title(object, clash.values) })
        }
        const recordFields = ((body.recordFields ?? []) as Json[]).map((f, i) => ({ id: `rf${i + 1}`, sortOrder: i, version: 0, ...f }))
        const r: Rec = { id: `${object[0]}${records[object].length + 1}`, version: 0, values, recordFields }
        records[object].push(r)
        return respond(201, detail(object, r))
      }
      if ((m = rest.match(/^\/([\w-]+)\/history/))) return respond(200, { items: [], page: 0, size: 50, totalElements: 0, totalPages: 0 })
      if ((m = rest.match(/^\/([\w-]+)\/(record-fields|fields)(?:\/([\w-]+))?$/))) {
        const r = records[object].find((x) => x.id === m![1])
        if (!r) return respond(404, { code: 'not-found', detail: 'Not found' })
        r.version += 1
        if (m[2] === 'fields') {
          // Remove a shared field from this record only, or add it back.
          r.hidden = method === 'DELETE' ? [...(r.hidden ?? []), m[3]!] : (r.hidden ?? []).filter((h) => h !== m![3])
          if (method === 'DELETE') delete r.values[m[3]!]
        } else if (method === 'POST') {
          r.recordFields = [...(r.recordFields ?? []), { id: `rf${Date.now()}`, sortOrder: 0, version: 0, ...body }]
        } else if (method === 'PUT') {
          r.recordFields = (r.recordFields ?? []).map((f) => (f.id === m![3] ? { ...f, label: body.label, value: body.value, version: Number(f.version) + 1 } : f))
        } else if (method === 'DELETE') {
          r.recordFields = (r.recordFields ?? []).filter((f) => f.id !== m![3])
        }
        return respond(200, detail(object, r))
      }
      if ((m = rest.match(/^\/([\w-]+)$/))) {
        const r = records[object].find((x) => x.id === m![1])
        if (!r) return respond(404, { code: 'not-found', detail: 'Not found' })
        if (method === 'PATCH') {
          r.values = { ...r.values, ...(body.values as Json) }
          r.version += 1
        }
        return respond(200, detail(object, r))
      }
    }
    return respond(404, { code: 'not-found', detail: `No fake route for ${method} ${p}` })
  })
}
