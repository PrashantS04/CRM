import { getTaskDisplayStatus, isTaskForRecord } from './status'

const NOW = new Date('2026-11-11T10:00:00')

describe('getTaskDisplayStatus', () => {
  it('derives Overdue for active tasks past their due date', () => {
    expect(getTaskDisplayStatus({ status: 'Open', dueAt: '2026-11-09T17:00:00' }, NOW)).toBe(
      'Overdue',
    )
    expect(getTaskDisplayStatus({ status: 'In Progress', dueAt: '2026-11-09T17:00:00' }, NOW)).toBe(
      'Overdue',
    )
  })

  it('never marks finished tasks overdue', () => {
    expect(getTaskDisplayStatus({ status: 'Done', dueAt: '2026-11-09T17:00:00' }, NOW)).toBe('Done')
    expect(getTaskDisplayStatus({ status: 'Cancelled', dueAt: '2026-11-09T17:00:00' }, NOW)).toBe(
      'Cancelled',
    )
  })

  it('keeps the stored status when not yet due', () => {
    expect(getTaskDisplayStatus({ status: 'Open', dueAt: '2026-11-12T17:00:00' }, NOW)).toBe('Open')
  })
})

describe('isTaskForRecord', () => {
  it('matches a short "related to" against the longer record name', () => {
    expect(isTaskForRecord({ relatedTo: 'Harbourview Group' }, 'Harbourview Group Limited')).toBe(
      true,
    )
  })

  it('does not match unrelated records', () => {
    expect(
      isTaskForRecord({ relatedTo: 'Harbourview Group' }, 'Blue Coast Finance', undefined),
    ).toBe(false)
  })
})
