import { daysUntil, describeFollowUp, isOverdue } from './date'

const NOW = new Date('2026-11-11T10:00:00')

describe('date helpers', () => {
  it('counts calendar days regardless of time of day', () => {
    expect(daysUntil('2026-11-11T23:30:00', NOW)).toBe(0)
    expect(daysUntil('2026-11-14T01:00:00', NOW)).toBe(3)
    expect(daysUntil('2026-11-10T23:00:00', NOW)).toBe(-1)
  })

  it('flags past dates as overdue but not today', () => {
    expect(isOverdue('2026-11-10T09:00:00', NOW)).toBe(true)
    expect(isOverdue('2026-11-11T09:00:00', NOW)).toBe(false)
  })

  it('describes follow-ups', () => {
    expect(describeFollowUp(null, NOW)).toBe('Follow-up not set')
    expect(describeFollowUp('2026-11-10T09:00:00', NOW)).toBe('Follow-up overdue')
    expect(describeFollowUp('2026-11-11T09:00:00', NOW)).toBe('Follow up today')
    expect(describeFollowUp('2026-11-12T09:00:00', NOW)).toBe('Follow up in 1 day')
    expect(describeFollowUp('2026-11-14T09:00:00', NOW)).toBe('Follow up in 3 days')
  })
})
