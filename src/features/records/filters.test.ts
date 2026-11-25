import { fieldDef } from '@/test/fieldDefs'
import { describeCondition, emptyValue, filterableFields, parseFilters, picksOptions, serializeFilters, toEditable, toSent } from './filters'
import type { RecordConfig } from './hooks'

const config = {
  optionLabel: (set: string | null | undefined, code: string) =>
    (({ PERSON_TYPE: { BROKER: 'Broker', INVESTOR: 'Investor' } }) as Record<string, Record<string, string>>)[set ?? '']?.[code] ?? code,
  userName: (id: string) => ({ u1: 'Sophie Turner' })[id] ?? id,
}

const personTypes = fieldDef('personTypes', 'MULTI_PICKLIST', { label: 'Type of contact', picklist: 'PERSON_TYPE' })
const owner = fieldDef('ownerId', 'USER', { label: 'Owner' })
const lastName = fieldDef('lastName', 'TEXT', { label: 'Last Name' })
const linked = fieldDef('linkedinDate', 'DATE', { label: 'LinkedIn First Connect Date' })

describe('describeCondition', () => {
  it('names picklist values and users, not codes', () => {
    expect(describeCondition({ field: 'personTypes', operator: 'CONTAINS_ANY', value: ['BROKER', 'INVESTOR'] }, personTypes, config))
      .toBe('Type of contact includes Broker, Investor')
    expect(describeCondition({ field: 'ownerId', operator: 'IN', value: ['u1'] }, owner, config)).toBe('Owner equals any of Sophie Turner')
  })

  it('words dates and ranges as Salesforce does', () => {
    expect(describeCondition({ field: 'linkedinDate', operator: 'GTE', value: 'LAST_N_DAYS:30' }, linked, config))
      .toBe('LinkedIn First Connect Date on or after Last 30 days')
    expect(describeCondition({ field: 'linkedinDate', operator: 'BETWEEN', value: ['2026-01-01', '2026-06-30'] }, linked, config))
      .toBe('LinkedIn First Connect Date between 2026-01-01 and 2026-06-30')
  })

  it('operators without a value, and unknown fields', () => {
    expect(describeCondition({ field: 'lastName', operator: 'IS_EMPTY' }, lastName, config)).toBe('Last Name is empty')
    expect(describeCondition({ field: 'gone', operator: 'EQUALS', value: 'x' }, undefined, config)).toBe('gone equals x')
  })
})

describe('toSent / toEditable', () => {
  it('a typed comma list is sent as a list and edited as text again', () => {
    const typed = { field: 'lastName', operator: 'EQUALS' as const, value: 'Smith, Jones ,' }
    const sent = toSent(typed, lastName)
    expect(sent.value).toEqual(['Smith', 'Jones'])
    expect(toEditable(sent, lastName).value).toBe('Smith, Jones')
  })

  it('one value stays single; dates and picked options are left alone; no-value operators drop the value', () => {
    expect(toSent({ field: 'lastName', operator: 'EQUALS', value: 'Smith,' }, lastName).value).toBe('Smith')
    expect(toSent({ field: 'linkedinDate', operator: 'EQUALS', value: '2026-01-01,2026-02-01' }, linked).value).toBe('2026-01-01,2026-02-01')
    expect(toSent({ field: 'lastName', operator: 'IS_EMPTY', value: 'x' }, lastName)).toEqual({ field: 'lastName', operator: 'IS_EMPTY' })
  })
})

describe('options and empty values', () => {
  it('list operators and picklist/user equals pick options', () => {
    expect(picksOptions(personTypes, 'CONTAINS_ANY')).toBe(true)
    expect(picksOptions(owner, 'EQUALS')).toBe(true)
    expect(picksOptions(lastName, 'EQUALS')).toBe(false)
    expect(emptyValue(personTypes, 'CONTAINS_ANY')).toEqual([])
    expect(emptyValue(lastName, 'BETWEEN')).toEqual(['', ''])
    expect(emptyValue(lastName, 'CONTAINS')).toBe('')
  })

  it('only filterable, readable fields with operators are offered', () => {
    const fields = [
      fieldDef('a', 'TEXT', { operators: ['EQUALS'] }),
      fieldDef('b', 'TEXT', { operators: ['EQUALS'], filterable: false }),
      fieldDef('c', 'TEXT', { operators: ['EQUALS'], canEdit: false }),
      fieldDef('d', 'TEXT', { operators: [] }),
    ]
    expect(filterableFields({ fields } as unknown as RecordConfig).map((f) => f.apiName)).toEqual(['a'])
  })
})

describe('filters in the URL', () => {
  it('round-trips, and bad or empty input means no filters', () => {
    const f = { conditions: [{ field: 'personTypes', operator: 'CONTAINS_ANY' as const, value: ['BROKER'] }], logic: '1' }
    expect(parseFilters(serializeFilters(f))).toEqual(f)
    expect(serializeFilters({ conditions: [], logic: '' })).toBeNull()
    expect(parseFilters(null)).toEqual({ conditions: [], logic: '' })
    expect(parseFilters('{not json')).toEqual({ conditions: [], logic: '' })
    expect(parseFilters('{"conditions":"x","logic":5}')).toEqual({ conditions: [], logic: '' })
  })
})
