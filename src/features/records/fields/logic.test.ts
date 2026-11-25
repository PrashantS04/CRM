import { abnError, acnError, describeRule, isRequiredNow, isVisible, listItems, primaryOf } from './logic'
import type { DisplayCondition, DisplayRules } from './types'

/**
 * The display-condition engine behind the client field map's conditional rows. The server has the same rules
 * (BE record/FieldLogic.java, tested by FieldLogicTest.java with the same cases), so a field shows, hides and
 * becomes required the same way on screen and on the server.
 */
const both = (c: DisplayCondition): { mandatory: boolean; displayRules: DisplayRules } => ({
  mandatory: false,
  displayRules: { visibleWhen: [c], requiredWhen: [c] },
})

describe('field map rules', () => {
  const abn = both({ field: 'soleTrader', operator: 'EQUALS', value: 'YES' })

  it.each([
    ['YES', true],
    ['NO', false],
    [undefined, false],
  ])('ABN (Required if Yes): Sole trader %s → shown and required %s', (soleTrader, expected) => {
    expect(isVisible(abn, { soleTrader })).toBe(expected)
    expect(isRequiredNow(abn, { soleTrader })).toBe(expected)
  })

  it('Preferred phone is required when Preferred channel holds SMS or Phone', () => {
    const phone = both({ field: 'preferredChannels', operator: 'CONTAINS_ANY', value: ['SMS', 'PHONE'] })
    expect(isRequiredNow(phone, { preferredChannels: ['SMS'] })).toBe(true)
    expect(isRequiredNow(phone, { preferredChannels: ['EMAIL', 'PHONE'] })).toBe(true)
    expect(isRequiredNow(phone, { preferredChannels: ['EMAIL'] })).toBe(false)
    expect(isRequiredNow(phone, { preferredChannels: [] })).toBe(false)
    expect(isRequiredNow(phone, {})).toBe(false)
  })

  it.each([
    ['OPTED_IN', true],
    ['OPTED_OUT', true],
    [null, false],
    ['', false],
  ])('Marketing channels: consent %s → required %s (regardless of opted in or out)', (marketingConsent, expected) => {
    const channels = both({ field: 'marketingConsent', operator: 'IS_NOT_EMPTY' })
    expect(isRequiredNow(channels, { marketingConsent })).toBe(expected)
  })

  it('ACR / ACL / Industry Body show for a Broker linked to an Aggregator or Aggregator Office', () => {
    const acr = {
      mandatory: false,
      displayRules: {
        visibleWhen: [
          { field: 'personTypes', operator: 'CONTAINS_ANY', value: ['BROKER'] },
          { field: '$linkedEntityType', operator: 'IN', value: ['AGGREGATOR_GROUP', 'AGGREGATOR_OFFICE'] },
        ] as DisplayCondition[],
      },
    }
    const broker = { personTypes: ['INVESTOR', 'BROKER'] }
    expect(isVisible(acr, broker, { linkedEntityType: ['AGGREGATOR_OFFICE'] })).toBe(true)
    expect(isVisible(acr, broker, { linkedEntityType: ['DEVELOPER', 'AGGREGATOR_GROUP'] })).toBe(true)
    expect(isVisible(acr, broker, { linkedEntityType: ['DEVELOPER'] })).toBe(false)
    expect(isVisible(acr, broker, {})).toBe(false)
    expect(isVisible(acr, { personTypes: ['INVESTOR'] }, { linkedEntityType: ['AGGREGATOR_GROUP'] })).toBe(false)
    expect(isRequiredNow(acr, broker, { linkedEntityType: ['AGGREGATOR_GROUP'] })).toBe(false)
  })
})

describe('operators', () => {
  const shows = (c: DisplayCondition, values: Record<string, unknown>) => isVisible({ displayRules: { visibleWhen: [c] } }, values)

  it.each([
    ['EQUALS', 'A', 'A', true],
    ['EQUALS', 'A', 'B', false],
    ['EQUALS', 'A', undefined, false],
    ['NOT_EQUALS', 'A', 'B', true],
    ['NOT_EQUALS', 'A', 'A', false],
    ['NOT_EQUALS', 'A', undefined, true],
    ['IN', ['A', 'B'], 'B', true],
    ['IN', ['A', 'B'], 'C', false],
    ['NOT_IN', ['A', 'B'], 'C', true],
    ['NOT_IN', ['A', 'B'], 'A', false],
    ['IS_EMPTY', undefined, undefined, true],
    ['IS_EMPTY', undefined, '', true],
    ['IS_EMPTY', undefined, 'A', false],
    ['IS_NOT_EMPTY', undefined, 'A', true],
    ['IS_NOT_EMPTY', undefined, undefined, false],
    ['UNKNOWN_OP', 'A', 'A', false],
  ] as const)('%s %j on %j → %s', (operator, value, actual, expected) => {
    expect(shows({ field: 'x', operator: operator as DisplayCondition['operator'], value }, { x: actual })).toBe(expected)
  })

  it('IS_TRUE / IS_FALSE read only a real true', () => {
    expect(shows({ field: 'b', operator: 'IS_TRUE' }, { b: true })).toBe(true)
    expect(shows({ field: 'b', operator: 'IS_TRUE' }, { b: 'true' })).toBe(false)
    expect(shows({ field: 'b', operator: 'IS_FALSE' }, { b: null })).toBe(true)
    expect(shows({ field: 'b', operator: 'IS_FALSE' }, { b: false })).toBe(true)
  })

  it('an empty list is empty; values compare as text', () => {
    expect(shows({ field: 'm', operator: 'IS_EMPTY' }, { m: [] })).toBe(true)
    expect(shows({ field: 'n', operator: 'EQUALS', value: '5' }, { n: 5 })).toBe(true)
  })

  it('no rules: always shown, never required by a condition; mandatory is always required', () => {
    expect(isVisible({ displayRules: {} }, {})).toBe(true)
    expect(isRequiredNow({ mandatory: false, displayRules: {} }, {})).toBe(false)
    expect(isRequiredNow({ mandatory: true, displayRules: {} }, {})).toBe(true)
  })

  it('a hidden field is never required, even when its requiredWhen holds', () => {
    const f = {
      mandatory: false,
      displayRules: {
        visibleWhen: [{ field: 'a', operator: 'EQUALS', value: 'SHOW' }],
        requiredWhen: [{ field: 'b', operator: 'EQUALS', value: 'REQ' }],
      } as DisplayRules,
    }
    expect(isRequiredNow(f, { a: 'HIDE', b: 'REQ' })).toBe(false)
    expect(isRequiredNow(f, { a: 'SHOW', b: 'REQ' })).toBe(true)
    expect(isRequiredNow(f, { a: 'SHOW', b: 'NO' })).toBe(false)
  })
})

describe('phone and email lists', () => {
  const items = [
    { label: 'OFFICE', value: '02 9000 0000', primary: false },
    { label: 'MOBILE', value: '0412 345 678', primary: true },
  ]

  it('reads list items and ignores anything that is not one', () => {
    expect(listItems([...items, null, 'x', { label: 'NO_VALUE' }])).toHaveLength(2)
    expect(listItems('0412 345 678')).toEqual([])
  })

  it('primaryOf picks the starred item, else the first, else the plain value', () => {
    expect(primaryOf(items)).toBe('0412 345 678')
    expect(primaryOf(items.map((i) => ({ ...i, primary: false })))).toBe('02 9000 0000')
    expect(primaryOf('plain@example.test')).toBe('plain@example.test')
    expect(primaryOf('')).toBeNull()
    expect(primaryOf(null)).toBeNull()
  })
})

describe('describeRule (Setup wording)', () => {
  const label = (api: string) => ({ soleTrader: 'Sole trader', marketingConsent: 'Marketing consent', b: 'Flag' })[api] ?? api
  const value = (_api: string, code: unknown) => ({ YES: 'Yes', SMS: 'SMS', PHONE: 'Phone' })[String(code)] ?? String(code)

  it.each([
    [{ field: 'soleTrader', operator: 'EQUALS', value: 'YES' }, 'Sole trader is Yes'],
    [{ field: 'soleTrader', operator: 'NOT_IN', value: ['YES'] }, 'Sole trader is not Yes'],
    [{ field: 'marketingConsent', operator: 'IS_NOT_EMPTY' }, 'Marketing consent has a value'],
    [{ field: 'marketingConsent', operator: 'IS_EMPTY' }, 'Marketing consent is empty'],
    [{ field: 'b', operator: 'IS_TRUE' }, 'Flag is ticked'],
    [{ field: 'b', operator: 'IS_FALSE' }, 'Flag is not ticked'],
    [{ field: 'x', operator: 'CONTAINS_ANY', value: ['SMS', 'PHONE'] }, 'x is SMS or Phone'],
    [{ field: '$linkedEntityType', operator: 'IN', value: ['AGGREGATOR_GROUP'] }, 'Linked Entity type is AGGREGATOR_GROUP'],
  ] as [DisplayCondition, string][])('%j → "%s"', (c, text) => {
    expect(describeRule(c, label, value)).toBe(text)
  })
})

describe('ABN and ACN length checks (as common/Formats.java words them)', () => {
  it('names the digit count when the length is wrong', () => {
    expect(abnError('51 824 753')).toBe('An ABN has 11 digits. This one has 8.')
    expect(acnError('12345')).toBe('An ACN has 9 digits. This one has 5.')
  })

  it('accepts the right length however it is spaced (the server checks the check digits)', () => {
    expect(abnError('51 824 753 556')).toBeUndefined()
    expect(acnError('000-000-019')).toBeUndefined()
  })
})
