import { formatCurrency, formatMillions, getInitials, pluralize } from './format'

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
