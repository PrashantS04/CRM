import { checkLogic, conditionReady, relativeDateLabel } from './filterLogic'

/** Filter logic for Person and Entity lists (brief §3.10: filter, save a filter set as a named view). */
describe('checkLogic', () => {
  it.each([
    ['', 3],
    ['  ', 0],
    ['1 AND 2 AND 3', 3],
    ['1 OR 2', 2],
    ['1 AND (2 OR 3)', 3],
    ['(1 OR 2) AND NOT 3', 3],
    ['1 and (2 or not 3)', 3],
    ['NOT (1 AND 2)', 2],
  ])('"%s" with %i filters is fine', (logic, count) => {
    expect(checkLogic(logic, count)).toBeNull()
  })

  it.each([
    ['1 AND 2 OR 3', 3, 'Use parentheses when you mix AND and OR, e.g. 1 AND (2 OR 3).'],
    ['1 AND 4', 3, 'There is no filter 4. Filters are numbered 1 to 3.'],
    ['0 AND 1', 1, 'There is no filter 0. Filters are numbered 1 to 1.'],
    ['1 AND', 1, 'The filter logic ends too early. Add a filter number after AND, OR or NOT.'],
    ['(1 AND 2', 2, "A '(' in the filter logic has no matching ')'."],
    ['1 AND 2)', 2, "Unexpected ')' in the filter logic."],
    ['1 XOR 2', 2, "'XOR' isn't allowed. Use filter numbers, AND, OR, NOT and parentheses."],
    ['1; DROP TABLE', 2, "';' isn't allowed. Use filter numbers, AND, OR, NOT and parentheses."],
    ['1 AND 2', 3, "Filter 3 isn't used in the filter logic. Use every filter, or remove the ones you don't need."],
    ['1', 0, 'Add filters before writing filter logic.'],
    ['1 2', 2, "Unexpected '2' in the filter logic."],
  ])('"%s" with %i filters → %s', (logic, count, error) => {
    expect(checkLogic(logic, count)).toBe(error)
  })
})

describe('conditionReady', () => {
  it('operators without a value are always ready', () => {
    expect(conditionReady({ field: 'x', operator: 'IS_EMPTY' })).toBe(true)
    expect(conditionReady({ field: 'x', operator: 'IS_ME' })).toBe(true)
  })

  it('needs a value, a non-empty list, or both ends of a range', () => {
    expect(conditionReady({ field: 'x', operator: 'EQUALS', value: '' })).toBe(false)
    expect(conditionReady({ field: 'x', operator: 'EQUALS', value: '  ' })).toBe(false)
    expect(conditionReady({ field: 'x', operator: 'EQUALS', value: 'a' })).toBe(true)
    expect(conditionReady({ field: 'x', operator: 'IN', value: [] })).toBe(false)
    expect(conditionReady({ field: 'x', operator: 'IN', value: ['BROKER'] })).toBe(true)
    expect(conditionReady({ field: 'x', operator: 'BETWEEN', value: ['1', ''] })).toBe(false)
    expect(conditionReady({ field: 'x', operator: 'BETWEEN', value: ['1', '5'] })).toBe(true)
    expect(conditionReady({ field: 'x', operator: 'BETWEEN', value: '1' })).toBe(false)
  })
})

describe('relativeDateLabel', () => {
  it.each([
    ['LAST_N_DAYS:30', 'Last 30 days'],
    ['NEXT_N_DAYS:7', 'Next 7 days'],
    ['THIS_MONTH', 'This month'],
    ['LAST_QUARTER', 'Last quarter'],
    ['2026-11-23', null],
  ])('%s → %s', (v, label) => {
    expect(relativeDateLabel(v)).toBe(label)
  })
})
