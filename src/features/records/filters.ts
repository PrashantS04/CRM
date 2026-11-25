import { relativeDateLabel } from './fields/filterLogic'
import { DATE_OPERATOR_LABELS, NO_VALUE_OPERATORS, OPERATOR_LABELS, type Condition, type FieldDef, type Operator } from './fields/types'
import type { RecordConfig } from './hooks'

/** The filters of a list: numbered conditions and optional logic such as "1 AND (2 OR 3)". */
export interface Filters {
  conditions: Condition[]
  logic: string
}

export const NO_FILTERS: Filters = { conditions: [], logic: '' }

export const LIST_OPERATORS: Operator[] = ['IN', 'NOT_IN', 'CONTAINS_ANY', 'CONTAINS_ALL', 'EXCLUDES']
/** Operators where text and number values can be a comma list: "equals A, B". */
export const COMMA_OPERATORS: Operator[] = ['EQUALS', 'NOT_EQUALS', 'CONTAINS', 'NOT_CONTAINS', 'STARTS_WITH']

export const operatorLabel = (f: FieldDef | undefined, op: Operator) =>
  (f?.dataType === 'DATE' && DATE_OPERATOR_LABELS[op]) || OPERATOR_LABELS[op]

/** Dropdown and owner filters pick options instead of typing. */
export const picksOptions = (f: FieldDef, op: Operator) =>
  LIST_OPERATORS.includes(op) || ((f.dataType === 'PICKLIST' || f.dataType === 'USER') && (op === 'EQUALS' || op === 'NOT_EQUALS'))

export function emptyValue(f: FieldDef, op: Operator): unknown {
  if (op === 'BETWEEN') return ['', '']
  if (picksOptions(f, op)) return []
  return ''
}

/** Fields a user can filter on: set as filterable, readable, and offering at least one operator. */
export const filterableFields = (config: RecordConfig) =>
  config.fields.filter((f) => f.filterable && f.canEdit && f.operators?.length)

/** A filter as one line: "Type of contact includes Investor, Broker". */
export function describeCondition(c: Condition, f: FieldDef | undefined, config: Pick<RecordConfig, 'optionLabel' | 'userName'>): string {
  const label = f?.label ?? c.field
  const op = operatorLabel(f, c.operator)
  if (NO_VALUE_OPERATORS.includes(c.operator)) return `${label} ${op}`
  const one = (v: unknown) => {
    const s = String(v)
    if (f?.dataType === 'USER') return config.userName(s)
    if (f?.dataType === 'PICKLIST' || f?.dataType === 'MULTI_PICKLIST') return config.optionLabel(f.picklist, s)
    if (f?.dataType === 'DATE') return relativeDateLabel(s) ?? s
    return s
  }
  if (c.operator === 'BETWEEN' && Array.isArray(c.value)) return `${label} between ${one(c.value[0])} and ${one(c.value[1])}`
  const values = Array.isArray(c.value) ? c.value.map(one).join(', ') : one(c.value)
  return `${label} ${op} ${values}`
}

/** Typed comma lists become lists, single values stay single; numbers are sent as text and parsed by the server. */
export function toSent(c: Condition, f: FieldDef | undefined): Condition {
  if (NO_VALUE_OPERATORS.includes(c.operator)) return { field: c.field, operator: c.operator }
  if (f && COMMA_OPERATORS.includes(c.operator) && !picksOptions(f, c.operator) && typeof c.value === 'string'
    && c.value.includes(',') && f.dataType !== 'DATE') {
    const parts = c.value.split(',').map((p) => p.trim()).filter(Boolean)
    return { ...c, value: parts.length === 1 ? parts[0] : parts }
  }
  return c
}

/** For editing: lists typed as "A, B" show again as text. */
export function toEditable(c: Condition, f: FieldDef | undefined): Condition {
  if (f && Array.isArray(c.value) && COMMA_OPERATORS.includes(c.operator) && !picksOptions(f, c.operator)) {
    return { ...c, value: c.value.join(', ') }
  }
  return c
}

/** Filters kept in the URL as JSON, so a filtered list can be bookmarked, shared and survives Back. */
export function parseFilters(raw: string | null): Filters {
  if (!raw) return NO_FILTERS
  try {
    const v = JSON.parse(raw) as Partial<Filters>
    return { conditions: Array.isArray(v.conditions) ? v.conditions : [], logic: typeof v.logic === 'string' ? v.logic : '' }
  } catch {
    return NO_FILTERS
  }
}

export const serializeFilters = (f: Filters) => (f.conditions.length ? JSON.stringify(f) : null)
