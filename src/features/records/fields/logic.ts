import type { DisplayCondition, FieldDef, ListItem, Values } from './types'

/**
 * Display conditions, the same rules the server applies (record/FieldLogic.java): a field shows when every
 * visibleWhen condition holds, and must have a value when it shows and every requiredWhen condition holds.
 * A condition on "$linkedEntityType" reads the record's context (the types of the Entities a Person links to).
 */
export type RecordContext = Record<string, unknown>

const empty = (v: unknown) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)

function matchesAny(actual: unknown, expected: unknown[]): boolean {
  if (actual === undefined || actual === null) return false
  const have = Array.isArray(actual) ? actual : [actual]
  return have.some((h) => expected.some((e) => String(h) === String(e)))
}

function holds(c: DisplayCondition, values: Values, context: RecordContext): boolean {
  const actual = c.field.startsWith('$') ? context[c.field.slice(1)] : values[c.field]
  const list = Array.isArray(c.value) ? c.value : [c.value]
  switch (c.operator) {
    case 'IS_EMPTY': return empty(actual)
    case 'IS_NOT_EMPTY': return !empty(actual)
    case 'IS_TRUE': return actual === true
    case 'IS_FALSE': return actual !== true
    case 'EQUALS': return matchesAny(actual, [c.value])
    case 'NOT_EQUALS': return !matchesAny(actual, [c.value])
    case 'IN':
    case 'CONTAINS_ANY': return matchesAny(actual, list)
    case 'NOT_IN': return !matchesAny(actual, list)
    default: return false
  }
}

const all = (conditions: DisplayCondition[] | undefined, values: Values, context: RecordContext) =>
  !conditions || conditions.every((c) => holds(c, values, context))

export function isVisible(f: Pick<FieldDef, 'displayRules'>, values: Values, context: RecordContext = {}) {
  return all(f.displayRules?.visibleWhen, values, context)
}

/** Required by its definition, or by its requiredWhen conditions right now. */
export function isRequiredNow(f: Pick<FieldDef, 'mandatory' | 'displayRules'>, values: Values, context: RecordContext = {}) {
  if (f.mandatory) return true
  const when = f.displayRules?.requiredWhen
  return !!when?.length && isVisible(f, values, context) && all(when, values, context)
}

/** The items of a phone or email list value (empty for anything else). */
export const listItems = (v: unknown): ListItem[] =>
  Array.isArray(v) ? (v.filter((i) => i && typeof i === 'object' && 'value' in i) as ListItem[]) : []

/** The primary item's value of a list, or the value itself. */
export function primaryOf(v: unknown): string | null {
  const items = listItems(v)
  if (items.length) return (items.find((i) => i.primary) ?? items[0]).value
  return v === undefined || v === null || v === '' ? null : String(v)
}

/** A condition as a sentence, for Setup: "Sole trader equals Yes". */
export function describeRule(c: DisplayCondition, label: (api: string) => string, value: (api: string, code: unknown) => string) {
  const name = c.field === '$linkedEntityType' ? 'Linked Entity type' : label(c.field)
  const vals = (Array.isArray(c.value) ? c.value : [c.value]).map((v) => (c.field === '$linkedEntityType' ? String(v) : value(c.field, v)))
  switch (c.operator) {
    case 'IS_EMPTY': return `${name} is empty`
    case 'IS_NOT_EMPTY': return `${name} has a value`
    case 'IS_TRUE': return `${name} is ticked`
    case 'IS_FALSE': return `${name} is not ticked`
    case 'NOT_EQUALS':
    case 'NOT_IN': return `${name} is not ${vals.join(' or ')}`
    default: return `${name} is ${vals.join(' or ')}`
  }
}

/* ---------- ABN and ACN digit-length checks (as the server checks them, common/Formats.java) ---------- */

const digitsOf = (s: string) => s.replace(/\D/g, '')

export function abnError(abn: string): string | undefined {
  const d = digitsOf(abn)
  return d.length === 11 ? undefined : `An ABN has 11 digits. This one has ${d.length}.`
}

export function acnError(acn: string): string | undefined {
  const d = digitsOf(acn)
  return d.length === 9 ? undefined : `An ACN has 9 digits. This one has ${d.length}.`
}
