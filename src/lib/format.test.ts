import { formatAcn, formatAbn, formatCurrency, formatMillions, getInitials, pluralize } from './format'

describe('formatCurrency', () => {
  it('formats AUD without cents', () => {
    expect(formatCurrency(60_000_000)).toBe('$60,000,000')
  })

  it('shows a fallback when no amount has been entered', () => {
    expect(formatCurrency(null)).toBe('Not entered')
  })
})

describe('formatMillions', () => {
  it('shortens to millions', () => {
    expect(formatMillions(498_000_000)).toBe('$498m')
    expect(formatMillions(1_500_000)).toBe('$1.5m')
  })
})

describe('getInitials', () => {
  it('uses the first two words and ignores dots', () => {
    expect(getInitials('Alex Stewart')).toBe('AS')
    expect(getInitials('J. Davies')).toBe('JD')
  })
})

describe('pluralize', () => {
  it('handles singular and plural', () => {
    expect(pluralize(1, 'entity', 'entities')).toBe('1 entity')
    expect(pluralize(3, 'task')).toBe('3 tasks')
  })
})

describe('formatAcn', () => {
  it('formats 9 digits into 3-3-3 pattern', () => {
    expect(formatAcn('000000019')).toBe('000 000 019')
    expect(formatAcn('123456789')).toBe('123 456 789')
  })

  it('caps at 9 digits and ignores non-digits', () => {
    expect(formatAcn('000000019999999')).toBe('000 000 019')
    expect(formatAcn('abc 123 def 456 789')).toBe('123 456 789')
  })

  it('formats partial input progressively', () => {
    expect(formatAcn('12')).toBe('12')
    expect(formatAcn('1234')).toBe('123 4')
    expect(formatAcn('1234567')).toBe('123 456 7')
  })
})

describe('formatAbn', () => {
  it('formats 11 digits into 2-3-3-3 pattern', () => {
    expect(formatAbn('51824753556')).toBe('51 824 753 556')
  })

  it('caps at 11 digits and ignores non-digits', () => {
    expect(formatAbn('51824753556999999')).toBe('51 824 753 556')
    expect(formatAbn('ab51 cd824 ef753 gh556')).toBe('51 824 753 556')
  })

  it('formats partial input progressively', () => {
    expect(formatAbn('5')).toBe('5')
    expect(formatAbn('518')).toBe('51 8')
    expect(formatAbn('518247')).toBe('51 824 7')
  })
})
