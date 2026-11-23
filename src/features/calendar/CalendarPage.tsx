import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useToast } from '@/components/feedback/toastContext'
import { FormField } from '@/components/form'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DataTable,
  FormDialog,
  PageHeader,
  SegmentedControl,
  type Column,
} from '@/components/ui'
import { CURRENT_USER, OWNERS } from '@/constants/lists'
import { cn } from '@/lib/cn'
import {
  ALL_DAY_TASKS,
  CALENDAR_EVENTS,
  CALENDAR_TODAY,
  CALENDARS,
  EVENT_TYPES,
  HOURS,
  addDays,
  eventHeight,
  eventTop,
  eventsForRange,
  formatHour,
  parseKey,
  sameDay,
  shiftAnchor,
  startOfWeek,
  toKey,
  viewTitle,
  type CalendarEvent,
  type CalendarView,
} from './calendarData'

const VIEWS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'table', label: 'Table' },
] as const

const TONE_CLASS: Record<CalendarEvent['tone'], string> = {
  slate: 'bg-[#eef1f6] text-[#3c4a63] border-[#d8dfe9]',
  blue: 'bg-[#e7efff] text-[#2454b7] border-[#b9cdf5]',
  teal: 'bg-[#e2f4f2] text-[#147873] border-[#b7e2dc]',
  orange: 'bg-[#fff1df] text-[#9a5b12] border-[#f2d6a8]',
  purple: 'bg-[#f1eafb] text-[#7c4fc0] border-[#dccbf5]',
  gold: 'bg-[#fff6df] text-[#8a6416] border-[#ecd9a4]',
}

export function CalendarPage() {
  const [view, setView] = useState<CalendarView>('week')
  const [anchor, setAnchor] = useState<Date>(startOfWeek(CALENDAR_TODAY))
  const [colourBy, setColourBy] = useState<'type' | 'person'>('type')
  const [selected, setSelected] = useState<CalendarEvent | null>(null)
  const [creating, setCreating] = useState(false)

  const weekStart = startOfWeek(anchor)
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const monthStart = useMemo(() => {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    return addDays(first, -((first.getDay() + 6) % 7))
  }, [anchor])
  const monthDays = useMemo(() => Array.from({ length: 42 }, (_, i) => addDays(monthStart, i)), [monthStart])

  const shift = (delta: number) => setAnchor((a) => shiftAnchor(view, a, delta))

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Schedule activities by date and time, linked to any CRM object."
        actions={
          <Button variant="primary" startIcon={<Plus size={16} />} onClick={() => setCreating(true)}>
            New event
          </Button>
        }
      />

      <Card className="mb-4 flex flex-wrap items-center gap-4 px-5 py-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="bg-info-soft text-info grid size-[46px] shrink-0 place-items-center rounded-[10px] text-[22px]">
            ▣
          </span>
          <div className="min-w-0">
            <small className="text-muted block text-[11px] font-bold">Calendar</small>
            <h1 className="text-ink m-0 text-xl font-bold tracking-tight">{viewTitle(view, anchor)}</h1>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <IconButton aria-label="Previous" onClick={() => shift(-1)} size="small">
            <ChevronLeft />
          </IconButton>
          <IconButton aria-label="Next" onClick={() => shift(1)} size="small">
            <ChevronRight />
          </IconButton>
          <Button onClick={() => setAnchor(startOfWeek(CALENDAR_TODAY))}>Today</Button>
        </div>
        <SegmentedControl label="Calendar view" value={view} onChange={setView} options={VIEWS} />
        <div className="bg-canvas flex items-center gap-0.5 rounded-control p-1">
          <span className="text-muted px-1.5 text-xs font-bold">Colour by</span>
          {(['type', 'person'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={colourBy === option}
              onClick={() => setColourBy(option)}
              className={cn(
                'cursor-pointer rounded-md border-0 px-3 py-1.5 text-xs font-bold',
                colourBy === option ? 'bg-surface text-info shadow-sm' : 'bg-transparent text-neutral-text',
              )}
            >
              {option === 'type' ? 'Type' : 'Person'}
            </button>
          ))}
        </div>
        <Badge tone="success" shape="pill">
          ↻ Outlook synced · 10:38 am
        </Badge>
      </Card>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_310px]">
        <div className="min-w-0">
          {view === 'week' && <WeekGrid days={weekDays} onSelect={setSelected} colourBy={colourBy} />}
          {view === 'day' && <DayList day={anchor} onSelect={setSelected} colourBy={colourBy} />}
          {view === 'month' && <MonthGrid days={monthDays} anchor={anchor} onSelect={setSelected} colourBy={colourBy} />}
          {view === 'table' && <EventTable onSelect={setSelected} colourBy={colourBy} />}
        </div>
        <CalendarSide anchor={anchor} onAnchor={setAnchor} onNewEvent={() => setCreating(true)} />
      </div>

      <EventDrawer event={selected} onClose={() => setSelected(null)} />
      <NewEventDialog open={creating} onClose={() => setCreating(false)} />
    </>
  )
}

function toneFor(event: CalendarEvent, colourBy: 'type' | 'person') {
  return colourBy === 'person' ? 'blue' : event.tone
}

function EventChip({ event, colourBy, className, onClick }: { event: CalendarEvent; colourBy: 'type' | 'person'; className?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-md border px-1.5 py-1 text-left text-[11px] font-bold leading-tight',
        TONE_CLASS[toneFor(event, colourBy)],
        className,
      )}
    >
      <b className="block truncate">{event.title}</b>
      <span className="block truncate font-medium opacity-80">
        {formatHour(event.hour)} · {event.type}
      </span>
    </button>
  )
}

function WeekGrid({
  days,
  onSelect,
  colourBy,
}: {
  days: Date[]
  onSelect: (e: CalendarEvent) => void
  colourBy: 'type' | 'person'
}) {
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const day of days) {
      map.set(toKey(day), eventsForRange(day, 1))
    }
    return map
  }, [days])

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-[64px_repeat(7,minmax(120px,1fr))] border-b border-line">
        <div className="bg-canvas grid place-items-center text-[11px] font-bold text-subtle">
          GMT+8
        </div>
        {days.map((day) => (
          <div
            key={toKey(day)}
            className={cn(
              'border-line border-l px-2 pt-2.5 text-center text-xs font-extrabold',
              sameDay(day, CALENDAR_TODAY) && 'text-info',
            )}
          >
            {day.toLocaleDateString('en-AU', { weekday: 'short' }).toUpperCase()}
            <b
              className={cn(
                'mx-auto mt-1 mb-2 grid size-[30px] place-items-center rounded-full text-[15px]',
                sameDay(day, CALENDAR_TODAY) && 'bg-info text-white',
              )}
            >
              {day.getDate()}
            </b>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[64px_repeat(7,minmax(120px,1fr))] border-b border-line">
        <div className="bg-canvas px-1.5 py-1.5 text-[10px] font-bold text-subtle">
          All day · tasks
        </div>
        {days.map((day) => (
          <div key={toKey(day)} className="border-line flex min-h-[44px] flex-col gap-1 border-l p-1">
            {(ALL_DAY_TASKS[toKey(day)] ?? []).map((task) => (
              <span
                key={task.id}
                className={cn(
                  'truncate rounded px-1.5 py-1 text-[10px] font-bold',
                  task.tone === 'overdue' && 'bg-brand-soft text-brand-dark',
                  task.tone === 'gold' && 'bg-amber-soft text-warning-text',
                  task.tone === 'normal' && 'bg-teal-soft text-teal-text',
                )}
              >
                ☑ {task.label}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[64px_repeat(7,minmax(120px,1fr))]">
        <div className="relative">
          {HOURS.map((h) => (
            <span
              key={h}
              className="text-muted absolute right-2 -translate-y-1/2 text-[10px] font-bold"
              style={{ top: (h - 8) * 62 + 4 }}
            >
              {h > 12 ? `${h - 12} pm` : `${h} am`}
            </span>
          ))}
        </div>
        {days.map((day) => {
          const key = toKey(day)
          const items = byDay.get(key) ?? []
          return (
            <div key={key} className="border-line relative border-l" style={{ height: 62 * HOURS.length }}>
              {HOURS.map((h) => (
                <div key={h} className="border-line-soft absolute right-0 left-0 border-t" style={{ top: (h - 8) * 62 + 62 }} />
              ))}
              {items.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => onSelect(event)}
                  style={{ top: eventTop(event.hour), height: eventHeight(event.type) }}
                  className={cn(
                    'absolute right-1 left-1 cursor-pointer overflow-hidden rounded-md border px-1.5 py-1 text-left text-[11px] font-bold leading-tight',
                    TONE_CLASS[toneFor(event, colourBy)],
                  )}
                >
                  <b className="block truncate">{event.title}</b>
                  <span className="block truncate font-medium opacity-80">
                    {formatHour(event.hour)}
                    {eventHeight(event.type) > 45 ? ` – ${formatHour(event.hour + 1)}` : ''}
                  </span>
                  {eventHeight(event.type) > 45 && (
                    <small className="block truncate font-medium opacity-70">{event.meta}</small>
                  )}
                </button>
              ))}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function DayList({ day, onSelect, colourBy }: { day: Date; onSelect: (e: CalendarEvent) => void; colourBy: 'type' | 'person' }) {
  const items = eventsForRange(day, 1)
  return (
    <Card padded>
      <CardHeader title={day.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })} description={`${items.length} events`} />
      {items.length === 0 ? (
        <p className="text-muted m-0 text-[13px]">No events scheduled.</p>
      ) : (
        <ul className="m-0 list-none p-0">
          {items.map((event) => (
            <li key={event.id} className="border-line-soft flex items-center gap-3 border-b py-3 last:border-0">
              <span className="text-muted w-16 shrink-0 text-xs font-bold">{formatHour(event.hour)}</span>
              <EventChip event={event} colourBy={colourBy} className="flex-1" onClick={() => onSelect(event)} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function MonthGrid({
  days,
  anchor,
  onSelect,
  colourBy,
}: {
  days: Date[]
  anchor: Date
  onSelect: (e: CalendarEvent) => void
  colourBy: 'type' | 'person'
}) {
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const day of days) map.set(toKey(day), eventsForRange(day, 1))
    return map
  }, [days])
  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-7 border-b border-line bg-canvas">
        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d) => (
          <div key={d} className="px-2.5 py-3 text-center text-[11px] font-extrabold text-subtle">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = toKey(day)
          const items = byDay.get(key) ?? []
          const inMonth = day.getMonth() === anchor.getMonth()
          const isToday = sameDay(day, CALENDAR_TODAY)
          return (
            <div
              key={key}
              className={cn(
                'border-line min-h-[120px] border-r border-b p-1.5',
                !inMonth && 'bg-canvas/60 text-subtle',
                isToday && 'bg-brand-tint/40',
              )}
            >
              <b
                className={cn(
                  'mb-1 inline-grid size-[26px] place-items-center rounded-full text-xs',
                  isToday && 'bg-info text-white',
                )}
              >
                {day.getDate()}
              </b>
              <div className="grid gap-1">
                {items.slice(0, 3).map((event) => (
                  <EventChip key={event.id} event={event} colourBy={colourBy} onClick={() => onSelect(event)} />
                ))}
                {items.length > 3 && <span className="text-muted text-[10px] font-bold">+{items.length - 3} more</span>}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

const TABLE_COLUMNS: Column<CalendarEvent>[] = [
  { key: 'date', header: 'Date', cell: (e) => parseKey(e.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }) },
  { key: 'time', header: 'Time', cell: (e) => formatHour(e.hour) },
  { key: 'title', header: 'Subject', cell: (e) => <b>{e.title}</b> },
  { key: 'type', header: 'Type', cell: (e) => e.type },
  { key: 'assignee', header: 'Assigned to', cell: () => CURRENT_USER },
  { key: 'contact', header: 'Contact', cell: (e) => (e.needsLink ? '—' : 'Alex Morgan') },
  { key: 'related', header: 'Related to', cell: (e) => (e.needsLink ? '—' : 'Harbour View Mixed Use') },
  {
    key: 'link',
    header: 'CRM link',
    cell: (e) => (
      <Badge tone={e.needsLink ? 'neutral' : 'brand'} shape="tag">
        {e.needsLink ? 'Needs link' : 'Linked'}
      </Badge>
    ),
  },
]

function EventTable({ onSelect, colourBy }: { onSelect: (e: CalendarEvent) => void; colourBy: 'type' | 'person' }) {
  void colourBy
  return (
    <Card padded>
      <CardHeader
        title={`${CALENDAR_EVENTS.length} events · ${viewTitle('week', CALENDAR_TODAY)}`}
        description="Linked to CRM records where matched."
      />
      <DataTable
        label="Calendar events"
        columns={TABLE_COLUMNS}
        rows={CALENDAR_EVENTS}
        getRowId={(e) => e.id}
        onRowClick={onSelect}
        minWidth={980}
      />
    </Card>
  )
}

function CalendarSide({ anchor, onAnchor, onNewEvent }: { anchor: Date; onAnchor: (d: Date) => void; onNewEvent: () => void }) {
  const toast = useToast()
  const monthLabel = anchor.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate()
  const mini = [...Array(offset).fill(''), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  return (
    <div className="grid content-start gap-4">
      <Card padded>
        <CardHeader
          className="mb-2"
          title={
            <span className="flex items-center justify-between text-base">
              <IconButton size="small" aria-label="Previous month" onClick={() => onAnchor(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1))}>
                <ChevronLeft size={16} />
              </IconButton>
              <b>{monthLabel}</b>
              <IconButton size="small" aria-label="Next month" onClick={() => onAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1))}>
                <ChevronRight size={16} />
              </IconButton>
            </span>
          }
        />
        <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-bold text-subtle">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
          {mini.map((d, i) => (
            <span
              key={i}
              className={cn(
                'mx-auto grid size-6 place-items-center rounded-full text-[11px]',
                d === CALENDAR_TODAY.getDate() && anchor.getMonth() === CALENDAR_TODAY.getMonth() && 'bg-info font-extrabold text-white',
              )}
            >
              {d}
            </span>
          ))}
        </div>
      </Card>

      <Card padded className="border-l-[3px] border-l-warning bg-warning-soft/60">
        <h3 className="text-ink m-0 text-[13px]">↗ 3 meetings need a CRM link</h3>
        <p className="text-muted m-0 mt-1 text-[11px] leading-snug">
          Outlook meetings with outside attendees that did not match a Person automatically can be
          linked to their record.
        </p>
        <Button className="mt-2.5" onClick={() => toast.info('Record-linking review opened')}>
          Review and link
        </Button>
      </Card>

      <Card padded className="border-l-[3px] border-l-info bg-info-soft/50">
        <h3 className="text-ink m-0 text-[13px]">✎ 6 meetings need an outcome</h3>
        <p className="text-muted m-0 mt-1 text-[11px] leading-snug">
          A one-line outcome keeps activities current and clears the stale alert.
        </p>
        {['Broker check-in', 'Fleet loan review', 'Call with client accountant'].map((title) => (
          <div key={title} className="mt-2 flex items-center justify-between gap-2 text-xs">
            <span>
              <b>{title}</b>
              <br />
              <small className="text-muted">Mon 16 Nov</small>
            </span>
            <Button variant="link" onClick={() => setTimeout(() => toast.info('Outcome panel opened'), 0)}>
              Log
            </Button>
          </div>
        ))}
      </Card>

      <Card padded>
        <CardHeader className="mb-2" title="Calendars" />
        <div className="grid gap-1.5">
          {CALENDARS.map((cal) => (
            <label key={cal.id} className="text-text flex cursor-pointer items-center gap-2 text-xs font-semibold">
              <input type="checkbox" defaultChecked={cal.checked} />
              <span className="bg-info-soft text-info inline-grid size-5 place-items-center rounded-full text-[9px] font-extrabold">
                {cal.label.split(' ').map((w) => w[0]).join('').slice(0, 2)}
              </span>
              {cal.label}
              {cal.hint && <small className="text-muted font-normal">{cal.hint}</small>}
            </label>
          ))}
        </div>
        <CardHeader className="mb-2 mt-4" title="Event types" />
        <div className="grid gap-1.5">
          {EVENT_TYPES.map((type) => (
            <label key={type} className="text-text flex cursor-pointer items-center gap-2 text-xs font-semibold">
              <input type="checkbox" defaultChecked />
              {type}
            </label>
          ))}
        </div>
      </Card>
      <Button variant="primary" className="w-full" onClick={onNewEvent}>
        + New event
      </Button>
    </div>
  )
}

function EventDrawer({ event, onClose }: { event: CalendarEvent | null; onClose: () => void }) {
  const toast = useToast()
  const [followUp, setFollowUp] = useState(true)
  if (!event) return null
  const day = parseKey(event.date)
  return (
    <Drawer anchor="right" open={!!event} onClose={onClose} slotProps={{ paper: { sx: { width: 'min(510px,92vw)' } } }}>
      <div className="flex items-start justify-between gap-3 border-b border-line p-5">
        <div>
          <Badge tone="teal" shape="tag">{event.type}</Badge>
          <h2 className="text-ink m-0 mt-2 text-lg font-bold">{event.title}</h2>
          <p className="text-muted m-0 mt-1 text-xs">
            {day.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} ·{' '}
            {formatHour(event.hour)}–{formatHour(event.hour + 1)} (GMT+8)
          </p>
        </div>
        <IconButton aria-label="Close" onClick={onClose} size="small">
          <X />
        </IconButton>
      </div>
      <div className="grid gap-4 overflow-auto p-5">
        <Card padded className="border-l-[3px] border-l-info bg-info-soft/50">
          <h3 className="text-ink m-0 text-sm">✎ How did it go?</h3>
          <p className="text-muted m-0 mt-1 text-xs">
            This activity has ended. Its outcome will be saved in Notes & Activities on all linked records.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="primary" size="small" onClick={() => toast.success('Outcome saved as Positive')}>
              Positive — next step agreed
            </Button>
            <Button size="small" onClick={() => toast.success('Outcome saved as Neutral')}>
              Neutral
            </Button>
            <Button size="small" onClick={() => toast.success('Outcome saved as Rescheduled')}>
              Rescheduled
            </Button>
          </div>
          <TextField
            fullWidth
            multiline
            minRows={2}
            placeholder="e.g. Agreed to send valuation by Friday"
            sx={{ mt: 2 }}
            slotProps={{ htmlInput: { 'aria-label': 'Outcome note' } }}
          />
          <label className="text-text mt-3 flex items-center gap-2 text-xs font-semibold">
            <input type="checkbox" checked={followUp} onChange={(e) => setFollowUp(e.target.checked)} />
            Create a follow-up task
          </label>
          {followUp && (
            <div className="mt-2.5 flex items-end gap-2">
              <TextField type="date" size="small" defaultValue="2026-11-19" slotProps={{ htmlInput: { 'aria-label': 'Follow-up due' } }} />
              <Button variant="primary" size="small" onClick={() => toast.success('Outcome and follow-up task saved')}>
                Save outcome
              </Button>
            </div>
          )}
        </Card>
        <dl className="m-0 grid gap-x-6 sm:grid-cols-2">
          <div>
            <dt className="text-subtle text-[11px] font-bold tracking-wide uppercase">Assigned to</dt>
            <dd className="text-text m-0 mt-1 font-medium">{CURRENT_USER}</dd>
          </div>
          <div>
            <dt className="text-subtle text-[11px] font-bold tracking-wide uppercase">Attendees</dt>
            <dd className="text-text m-0 mt-1 font-medium">{event.meta}</dd>
          </div>
        </dl>
        <Card padded>
          <h3 className="text-ink m-0 mb-3 text-sm">Linked CRM records</h3>
          {event.needsLink ? (
            <p className="text-muted m-0 text-[13px]">No CRM record linked yet.</p>
          ) : (
            <>
              <b className="text-info text-[13px]">Alex Morgan</b>
              <p className="text-muted m-0 mt-0.5 mb-2 text-[11px]">Person · Investor</p>
              <b className="text-info text-[13px]">Harbour View Mixed Use</b>
              <p className="text-muted m-0 mt-0.5 text-[11px]">Loan Opportunity · Credit DD</p>
            </>
          )}
          <Button variant="link" className="mt-2" onClick={() => toast.info('Record-linking panel opened')}>
            {event.needsLink ? 'Link a CRM record' : 'Change linked records'}
          </Button>
        </Card>
        <p className="text-muted m-0 text-[11px]">↻ Created in Outlook. The linked CRM record retains the activity pointer.</p>
      </div>
    </Drawer>
  )
}

function NewEventDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast()
  const [type, setType] = useState<string>('Client meeting')
  const [assignee, setAssignee] = useState<string>(`${CURRENT_USER} (me)`)
  const [person, setPerson] = useState<string>('None')
  const [related, setRelated] = useState<string>('None')
  const selectSx = { minWidth: 0, width: '100%' } as const
  return (
    <FormDialog
      open={open}
      title="New event"
      description="This event will be created in Outlook. Invites are sent from Outlook and its linked CRM record retains the activity."
      submitLabel="Create in Outlook"
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault()
        toast.success(`Event created in Outlook for ${assignee}`)
        onClose()
      }}
    >
      <FormField id="ev-subject" label="Subject (required)" fullWidth>
        <TextField fullWidth size="small" name="subject" placeholder="e.g. Loan review with client" />
      </FormField>
      <FormField id="ev-type" label="Type">
        <Select value={type} onChange={(e) => setType(e.target.value)} fullWidth size="small" sx={selectSx} inputProps={{ 'aria-label': 'Type' }}>
          {EVENT_TYPES.map((t) => (
            <MenuItem key={t} value={t}>
              {t}
            </MenuItem>
          ))}
        </Select>
      </FormField>
      <FormField id="ev-assignee" label="Assigned to">
        <Select value={assignee} onChange={(e) => setAssignee(e.target.value)} fullWidth size="small" sx={selectSx} inputProps={{ 'aria-label': 'Assigned to' }}>
          {OWNERS.map((o) => (
            <MenuItem key={o} value={`${o} (me)`}>
              {o} (me)
            </MenuItem>
          ))}
        </Select>
      </FormField>
      <FormField id="ev-date" label="Date">
        <TextField fullWidth size="small" name="date" type="date" defaultValue={toKey(CALENDAR_TODAY)} />
      </FormField>
      <FormField id="ev-start" label="Start">
        <TextField fullWidth size="small" name="start" type="time" defaultValue="10:00" />
      </FormField>
      <FormField id="ev-end" label="End">
        <TextField fullWidth size="small" name="end" type="time" defaultValue="11:00" />
      </FormField>
      <FormField id="ev-location" label="Location" fullWidth>
        <TextField fullWidth size="small" name="location" placeholder="Office, client site or address" />
      </FormField>
      <FormField id="ev-person" label="Person / Contact">
        <Select value={person} onChange={(e) => setPerson(e.target.value)} fullWidth size="small" sx={selectSx} inputProps={{ 'aria-label': 'Person / Contact' }}>
          {['None', 'Alex Morgan', 'Sarah Tan'].map((p) => (
            <MenuItem key={p} value={p}>
              {p}
            </MenuItem>
          ))}
        </Select>
      </FormField>
      <FormField id="ev-related" label="Related to">
        <Select value={related} onChange={(e) => setRelated(e.target.value)} fullWidth size="small" sx={selectSx} inputProps={{ 'aria-label': 'Related to' }}>
          {['None', 'Harbour View Mixed Use', 'Greenfield Solar Expansion'].map((r) => (
            <MenuItem key={r} value={r}>
              {r}
            </MenuItem>
          ))}
        </Select>
      </FormField>
      <FormField id="ev-notes" label="Notes" fullWidth>
        <TextField fullWidth size="small" name="notes" multiline minRows={2} />
      </FormField>
    </FormDialog>
  )
}
