import type { ActivityKind } from '@/types/domain'

export type CalendarView = 'day' | 'week' | 'month' | 'table'
export type CalendarColour = 'type' | 'person'

export interface CalendarEvent {
  id: string
  /** ISO date (yyyy-mm-dd) the event sits on. */
  date: string
  /** Hour, fractional values allowed (9.5 = 09:30). */
  hour: number
  type: string
  title: string
  meta: string
  tone: 'slate' | 'blue' | 'teal' | 'orange' | 'purple' | 'gold'
  needsLink?: boolean
}

/** Reference "today" for the mock calendar (matches the prototype data). */
export const CALENDAR_TODAY = new Date(2026, 10, 16)

export const CALENDAR_EVENTS: readonly CalendarEvent[] = [
  { id: 'e1', date: '2026-11-16', hour: 9, type: 'Internal', title: 'Pipeline stand-up', meta: 'Credit team', tone: 'slate' },
  { id: 'e2', date: '2026-11-16', hour: 10, type: 'Client meeting', title: 'Fleet loan review', meta: 'Outcome not logged', tone: 'blue' },
  { id: 'e3', date: '2026-11-16', hour: 14, type: 'Call', title: 'Broker check-in', meta: 'Raj Kumar · Linked', tone: 'teal' },
  { id: 'e4', date: '2026-11-17', hour: 9.5, type: 'Client meeting', title: 'Intro meeting — property portfolio', meta: 'Needs a CRM link', tone: 'orange', needsLink: true },
  { id: 'e5', date: '2026-11-17', hour: 12, type: 'Internal', title: 'Busy', meta: 'Private', tone: 'slate' },
  { id: 'e6', date: '2026-11-17', hour: 13.5, type: 'Site visit', title: 'Farm site visit', meta: 'Aisha Rahman', tone: 'orange' },
  { id: 'e7', date: '2026-11-18', hour: 8.5, type: 'Follow-up', title: 'Send term sheet', meta: 'Harbourview Group', tone: 'purple' },
  { id: 'e8', date: '2026-11-18', hour: 12.5, type: 'Client meeting', title: 'Lunch — clinic group', meta: 'Needs a CRM link', tone: 'orange', needsLink: true },
  { id: 'e9', date: '2026-11-18', hour: 15, type: 'Internal', title: 'Credit committee', meta: 'Boardroom', tone: 'slate' },
  { id: 'e10', date: '2026-11-19', hour: 9, type: 'Call', title: 'Facility terms call', meta: 'Tom Hughes', tone: 'teal' },
  { id: 'e11', date: '2026-11-19', hour: 14, type: 'Client meeting', title: 'Annual review', meta: 'Aisha Rahman', tone: 'blue' },
  { id: 'e12', date: '2026-11-19', hour: 16, type: 'Call', title: 'Call — new referral', meta: 'Linked', tone: 'teal' },
  { id: 'e13', date: '2026-11-20', hour: 9, type: 'Internal', title: 'Pipeline stand-up', meta: 'Credit team', tone: 'slate' },
  { id: 'e14', date: '2026-11-20', hour: 10, type: 'Webinar / event', title: 'November client webinar', meta: 'Outlook event', tone: 'gold' },
  { id: 'e15', date: '2026-11-20', hour: 14, type: 'Client meeting', title: 'Settlement planning', meta: 'Sarah Tan', tone: 'blue' },
]

export interface CalendarTaskStrip {
  id: string
  label: string
  tone: 'overdue' | 'normal' | 'gold'
}

/** All-day task strips shown above the week grid (prototype behaviour). */
export const ALL_DAY_TASKS: Record<string, CalendarTaskStrip[]> = {
  '2026-11-16': [
    { id: 't1', label: 'Overdue · Check subscription form received', tone: 'overdue' },
    { id: 't2', label: 'Chase valuation report', tone: 'normal' },
  ],
  '2026-11-18': [
    { id: 't3', label: '9:00 am · Webinar reminder', tone: 'gold' },
    { id: 't4', label: 'Recontact Alex', tone: 'normal' },
  ],
  '2026-11-19': [{ id: 't5', label: 'Chase CP: insurance', tone: 'normal' }],
  '2026-11-20': [{ id: 't6', label: '10:00 am · November close', tone: 'gold' }],
}

export const EVENT_TYPES = [
  'Client meeting',
  'Call',
  'Site visit',
  'Follow-up',
  'Webinar / event',
  'Internal',
] as const

export const CALENDARS = [
  { id: 'me', label: 'Alex Stewart', hint: 'My events', checked: true },
  { id: 'sc', label: 'Sarah Chen', hint: undefined, checked: false },
  { id: 'jd', label: 'J. Davies', hint: undefined, checked: false },
  { id: 'tasks', label: 'Tasks', hint: undefined, checked: true },
] as const

export const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19] as const
const HOUR_PX = 62
const DAY_START = 8

export const eventTop = (hour: number) => (hour - DAY_START) * HOUR_PX + 4
export const eventHeight = (type: string) =>
  type === 'Site visit' ? 186 : type === 'Client meeting' ? 76 : 39

export const ACTIVITY_KIND_FOR_TYPE: Record<string, ActivityKind> = {
  Call: 'call',
  'Client meeting': 'event',
  'Site visit': 'event',
  'Follow-up': 'task',
  'Webinar / event': 'event',
  Internal: 'event',
}

const pad = (n: number) => String(n).padStart(2, '0')
export const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parseKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y!, m! - 1, d!)
}
export const addDays = (d: Date, n: number) => {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + n)
  return copy
}
export const startOfWeek = (d: Date) => {
  // Monday-based week.
  const copy = new Date(d)
  const offset = (copy.getDay() + 6) % 7
  return addDays(copy, -offset)
}
export const sameDay = (a: Date, b: Date) => toKey(a) === toKey(b)

export function formatHour(hour: number) {
  const h = Math.floor(hour)
  const m = hour % 1 ? '30' : '00'
  const suffix = h >= 12 ? 'pm' : 'am'
  const display = h > 12 ? h - 12 : h
  return `${display}:${m} ${suffix}`
}

export function weekTitle(anchor: Date) {
  const end = addDays(anchor, 6)
  return `${anchor.getDate()} – ${end.getDate()} ${end.toLocaleDateString('en-AU', {
    month: 'long',
    year: 'numeric',
  })}`
}

export function viewTitle(mode: CalendarView, anchor: Date) {
  if (mode === 'month')
    return anchor.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
  if (mode === 'day')
    return anchor.toLocaleDateString('en-AU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  return weekTitle(startOfWeek(anchor))
}

export function shiftAnchor(mode: CalendarView, anchor: Date, delta: number) {
  if (mode === 'month') return new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1)
  return addDays(anchor, delta * (mode === 'week' ? 7 : 1))
}

export function eventsForRange(from: Date, days: number) {
  const start = toKey(from)
  const end = toKey(addDays(from, days - 1))
  return CALENDAR_EVENTS.filter((e) => e.date >= start && e.date <= end)
}
