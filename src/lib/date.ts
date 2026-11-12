const DAY_MS = 86_400_000

/** ISO timestamp `days` from now (negative = past) at the given hour/minute. */
export function daysFromNow(days: number, hour = 9, minute = 0): string {
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  return new Date(date.getTime() + days * DAY_MS).toISOString()
}

/** Whole calendar days from today to `iso` (negative = overdue). */
export function daysUntil(iso: string, now: Date = new Date()): number {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const target = new Date(iso)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - start.getTime()) / DAY_MS)
}

export function isOverdue(iso: string, now: Date = new Date()): boolean {
  return daysUntil(iso, now) < 0
}

/** "Follow up in 3 days", "Follow up today", "Follow-up overdue". */
export function describeFollowUp(iso: string | null, now: Date = new Date()): string {
  if (!iso) return 'Follow-up not set'
  const days = daysUntil(iso, now)
  if (days < 0) return 'Follow-up overdue'
  if (days === 0) return 'Follow up today'
  return `Follow up in ${days} ${days === 1 ? 'day' : 'days'}`
}
