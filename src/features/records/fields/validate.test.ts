import { fieldDef } from '@/test/fieldDefs'
import type { FieldDef } from './types'
import { isEmptyValue, toApiValue, toFormValue, validateValue, validateValues } from './validate'

/** The client-side checks mirror the server's (CustomFieldService); the server stays the authority. */
const one = (dataType: FieldDef['dataType'], extra: Partial<FieldDef> = {}) =>
  fieldDef('f', dataType, { label: 'Field', ...extra })

describe('validateValue: required', () => {
  it.each([undefined, null, '', '   ', []])('a mandatory field with %j is required', (v) => {
    expect(validateValue(one('TEXT', { mandatory: true }), v)).toBe('Field is required.')
  })

  it('an optional empty field is fine', () => {
    expect(validateValue(one('TEXT'), '')).toBeUndefined()
  })

  it('a mandatory checkbox needs a tick', () => {
    expect(validateValue(one('CHECKBOX', { mandatory: true }), false)).toBe('Field is required.')
    expect(validateValue(one('CHECKBOX', { mandatory: true }), true)).toBeUndefined()
  })
})

describe('validateValue: formats (hard gate G2 on screen)', () => {
  it.each(['nope@', 'a@b', '@example.test', 'two words@example.test'])('email %s is refused', (v) => {
    expect(validateValue(one('EMAIL'), v)).toBe('This email address is not in a valid format.')
  })

  it('a valid email passes', () => {
    expect(validateValue(one('EMAIL'), 'first.last@privateinvest.com.au')).toBeUndefined()
  })

  it.each([
    ['0412 345 678', undefined],
    ['+61 (2) 9000-1234', undefined],
    ['phone', 'Enter a phone number using digits, spaces, +, ( ) or -.'],
    ['12345', 'Enter a phone number using digits, spaces, +, ( ) or -.'],
    ['1234 5678 9012 3456', 'A phone number has 6 to 15 digits.'],
  ])('phone %s → %s', (v, error) => {
    expect(validateValue(one('PHONE'), v)).toBe(error)
  })

  it.each([
    ['example.com.au', undefined],
    ['https://www.linkedin.com/in/someone', undefined],
    ['nodot', 'Enter a web address, e.g. example.com.au.'],
    ['http://exa mple.com', 'Enter a web address, e.g. example.com.au.'],
  ])('web address %s → %s', (v, error) => {
    expect(validateValue(one('URL'), v)).toBe(error)
  })

  it.each([
    ['1980-01-31', undefined],
    ['31/01/1980', 'Enter a date as YYYY-MM-DD.'],
    ['1980-1-31', 'Enter a date as YYYY-MM-DD.'],
  ])('date %s → %s', (v, error) => {
    expect(validateValue(one('DATE'), v)).toBe(error)
  })

  it('ABN and ACN formats name the digit count', () => {
    expect(validateValue(one('TEXT', { validation: { format: 'ABN' } }), '51 824')).toBe('An ABN has 11 digits. This one has 5.')
    expect(validateValue(one('TEXT', { validation: { format: 'ACN' } }), '000 000 019')).toBeUndefined()
  })
})

describe('validateValue: lengths and numbers', () => {
  it('text stops at 255 characters by default, long text at 32,000 (brief §1.2 problem 4)', () => {
    expect(validateValue(one('TEXT'), 'x'.repeat(255))).toBeUndefined()
    expect(validateValue(one('TEXT'), 'x'.repeat(256))).toBe('Use at most 255 characters (this has 256).')
    expect(validateValue(one('LONG_TEXT'), 'x'.repeat(32000))).toBeUndefined()
    expect(validateValue(one('LONG_TEXT'), 'x'.repeat(32001))).toBe('Use at most 32000 characters (this has 32001).')
    expect(validateValue(one('TEXT', { maxLength: 5 }), 'abcdef')).toBe('Use at most 5 characters (this has 6).')
  })

  it('min length and pattern rules apply to text', () => {
    expect(validateValue(one('TEXT', { validation: { minLength: 3 } }), 'ab')).toBe('Use at least 3 characters.')
    const holder = one('TEXT', { validation: { pattern: '[XI]\\d{10}', patternMessage: 'Enter a HIN or SRN.' } })
    expect(validateValue(holder, 'X0012345678')).toBeUndefined()
    expect(validateValue(holder, 'H123')).toBe('Enter a HIN or SRN.')
    // A pattern the browser can't read is left to the server.
    expect(validateValue(one('TEXT', { validation: { pattern: '(' } }), 'anything')).toBeUndefined()
  })

  it.each([
    ['12', undefined],
    ['1,250,000', undefined],
    ['abc', 'Enter a number.'],
    ['1.234', 'Use at most 2 decimal places.'],
    ['1.50', undefined],
  ])('number %s → %s', (v, error) => {
    expect(validateValue(one('CURRENCY'), v)).toBe(error)
  })

  it('whole numbers, min and max', () => {
    expect(validateValue(one('NUMBER', { decimalPlaces: 0 }), '1.5')).toBe('Enter a whole number.')
    const lvr = one('PERCENT', { decimalPlaces: 1, validation: { min: 0, max: 100 } })
    expect(validateValue(lvr, '-1')).toBe('Enter a number of 0 or more.')
    expect(validateValue(lvr, '100.1')).toBe('Enter a number of 100 or less.')
    expect(validateValue(lvr, '65.5')).toBeUndefined()
  })
})

describe('validateValue: Phones and Email lists (one primary, field map)', () => {
  const phones = one('PHONE_LIST', { label: 'Phones', mandatory: true, picklist: 'PHONE_LABEL' })
  const emails = one('EMAIL_LIST', { label: 'Email', mandatory: true, picklist: 'EMAIL_LABEL' })

  it('a required list needs at least one item with a value', () => {
    expect(validateValue(phones, [])).toBe('Phones is required.')
    expect(validateValue(phones, [{ label: 'MOBILE', value: '  ', primary: true }])).toBe('Phones is required.')
  })

  it('several items with one primary are fine', () => {
    expect(validateValue(phones, [
      { label: 'MOBILE', value: '0412 345 678', primary: true },
      { label: 'OFFICE', value: '02 9000 0000', primary: false },
    ])).toBeUndefined()
  })

  it('two primaries are refused', () => {
    expect(validateValue(emails, [
      { label: 'BUSINESS', value: 'a@example.test', primary: true },
      { label: 'PERSONAL', value: 'b@example.test', primary: true },
    ])).toBe('Mark one email address as primary.')
  })

  it('the same number or address twice is refused, however it is written', () => {
    expect(validateValue(phones, [
      { label: 'MOBILE', value: '0412 345 678', primary: true },
      { label: 'OTHER', value: '0412345678', primary: false },
    ])).toBe('0412345678 is listed twice.')
    expect(validateValue(emails, [
      { label: 'BUSINESS', value: 'A@Example.test', primary: true },
      { label: 'OTHER', value: 'a@example.test', primary: false },
    ])).toBe('a@example.test is listed twice.')
  })

  it('each item needs a label and a valid value', () => {
    expect(validateValue(emails, [{ label: '', value: 'a@example.test', primary: true }])).toBe('Choose a label for a@example.test.')
    expect(validateValue(emails, [{ label: 'BUSINESS', value: 'bad@', primary: true }]))
      .toBe('bad@: This email address is not in a valid format.')
  })
})

describe('validateValues: a whole form', () => {
  const fields = [
    fieldDef('firstName', 'TEXT', { label: 'First Name', mandatory: true }),
    fieldDef('soleTrader', 'PICKLIST', { label: 'Sole trader' }),
    fieldDef('abn', 'TEXT', { label: 'ABN', validation: { format: 'ABN' },
      displayRules: { visibleWhen: [{ field: 'soleTrader', operator: 'EQUALS', value: 'YES' }],
        requiredWhen: [{ field: 'soleTrader', operator: 'EQUALS', value: 'YES' }] } }),
    fieldDef('ageWeeks', 'NUMBER', { label: 'Age', mandatory: true, formula: { fn: 'WEEKS_SINCE', field: 'since' } }),
    fieldDef('phones', 'PHONE_LIST', { label: 'Phones' }),
    fieldDef('preferredPhone', 'PHONE', { label: 'Preferred phone', optionsFrom: 'phones' }),
  ]

  it('fields hidden by their conditions and CRM-set fields are skipped', () => {
    expect(validateValues(fields, { firstName: 'Ava', soleTrader: 'NO', abn: '1' })).toEqual({})
  })

  it('a field becomes required when its condition holds', () => {
    expect(validateValues(fields, { firstName: 'Ava', soleTrader: 'YES' })).toEqual({ abn: 'ABN is required.' })
  })

  it('a field that picks from the record list must hold one of its values', () => {
    const v = { firstName: 'Ava', phones: [{ label: 'MOBILE', value: '0412 345 678', primary: true }] }
    expect(validateValues(fields, { ...v, preferredPhone: '0412345678' })).toEqual({})
    expect(validateValues(fields, { ...v, preferredPhone: '0499 999 999' }))
      .toEqual({ preferredPhone: "Choose one of this record's phone numbers." })
  })

  it('edit mode: a mandatory field left empty and untouched does not block other changes', () => {
    expect(validateValues(fields, { firstName: '' }, {}, { firstName: '' })).toEqual({})
    expect(validateValues(fields, { firstName: '' }, {}, { firstName: 'Ava' })).toEqual({ firstName: 'First Name is required.' })
  })

  it('edit mode: a condition that now holds still makes its field required', () => {
    expect(validateValues(fields, { firstName: 'Ava', soleTrader: 'YES' }, {}, { firstName: 'Ava' }))
      .toEqual({ abn: 'ABN is required.' })
  })
})

describe('form ↔ API values', () => {
  it('toApiValue sends numbers as numbers, blanks as null and drops empty list rows', () => {
    expect(toApiValue('CURRENCY', '1,250,000')).toBe(1250000)
    expect(toApiValue('TEXT', '  Ava  ')).toBe('Ava')
    expect(toApiValue('TEXT', '   ')).toBeNull()
    expect(toApiValue('CHECKBOX', false)).toBeNull()
    expect(toApiValue('CHECKBOX', true)).toBe(true)
    expect(toApiValue('BOOLEAN', 'true')).toBe(true)
    expect(toApiValue('BOOLEAN', false)).toBe(false)
    expect(toApiValue('PHONE_LIST', [{ label: 'MOBILE', value: ' 0412 ', primary: true }, { label: 'OFFICE', value: '', primary: false }]))
      .toEqual([{ label: 'MOBILE', value: '0412', primary: true }])
    expect(toApiValue('EMAIL_LIST', [{ label: 'BUSINESS', value: '', primary: true }])).toBeNull()
  })

  it('toFormValue shows stored values in inputs', () => {
    expect(toFormValue('MULTI_PICKLIST', null)).toEqual([])
    expect(toFormValue('PHONE_LIST', undefined)).toEqual([])
    expect(toFormValue('TEXT', null)).toBe('')
    expect(toFormValue('NUMBER', 12.5)).toBe('12.5')
    expect(toFormValue('PICKLIST', 'YES')).toBe('YES')
  })

  it('isEmptyValue', () => {
    expect([undefined, null, '', '  ', []].every(isEmptyValue)).toBe(true)
    expect([0, false, 'x', ['a']].some(isEmptyValue)).toBe(false)
  })
})
