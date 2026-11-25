import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import { Bell, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/components/feedback/toastContext'
import { Badge, Button } from '@/components/ui'
import { cn } from '@/lib/cn'

interface Notice {
  id: string
  tag: string
  tagTone: 'brand' | 'neutral'
  title: string
  body: string
  actionLabel: string
  to: string
}

const NEEDS_ATTENTION: Notice[] = [
  {
    id: 'n1',
    tag: 'Task overdue',
    tagTone: 'brand',
    title: 'Follow up on term sheet',
    body: 'Ellison Capital Partners · overdue by 5 days',
    actionLabel: 'Open task',
    to: '/tasks',
  },
  {
    id: 'n2',
    tag: 'Client response',
    tagTone: 'neutral',
    title: 'Alex Morgan replied to the valuation request',
    body: 'New client email response was recorded against the Person record.',
    actionLabel: 'Open person',
    to: '/people',
  },
]

const UPCOMING: Notice[] = [
  {
    id: 'n3',
    tag: 'Meeting',
    tagTone: 'neutral',
    title: 'Credit Committee starts tomorrow',
    body: '24 Oct 2026 · 10:00–11:00 · linked to Greenfield Solar Expansion',
    actionLabel: 'Open calendar',
    to: '/calendar',
  },
  {
    id: 'n4',
    tag: 'Pipeline',
    tagTone: 'neutral',
    title: 'Greenfield Solar Expansion moved to Credit DD',
    body: 'Sarah Chen progressed the opportunity stage 12 minutes ago.',
    actionLabel: 'View opportunity',
    to: '/loan-opportunities',
  },
]

const UNREAD = NEEDS_ATTENTION.length + UPCOMING.length

function NoticeCard({ notice, onOpen }: { notice: Notice; onOpen: () => void }) {
  return (
    <article className="border-line mb-2.5 rounded-[10px] border bg-surface p-[15px_18px]">
      <Badge tone={notice.tagTone} shape="tag" className="mr-1.5">
        {notice.tag}
      </Badge>
      <b className="text-ink block text-[13px]">{notice.title}</b>
      <p className="text-muted m-0 my-[5px] text-xs leading-normal">{notice.body}</p>
      <Button size="small" variant={notice.tagTone === 'brand' ? 'primary' : 'secondary'} onClick={onOpen}>
        {notice.actionLabel}
      </Button>
    </article>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-subtle m-0 mb-2 text-[11px] font-extrabold tracking-[0.35px] uppercase">
      {children}
    </p>
  )
}

/**
 * Notification bell + slide-over centre (prototype `showNotificationCenter`):
 * unread badge on the bell, needs-attention and upcoming cards, and desktop
 * reminder preferences.
 */
export function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  const go = (to: string) => {
    setOpen(false)
    navigate(to)
  }

  const enableReminders = async () => {
    if (!('Notification' in window)) {
      toast.info('Desktop notifications are not supported by this browser.')
      return
    }
    const permission = await Notification.requestPermission()
    toast[permission === 'granted' ? 'success' : 'info'](
      permission === 'granted'
        ? 'Desktop reminders enabled.'
        : 'Desktop reminder permission was not granted.',
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Notifications"
        aria-label={`Notifications, ${UNREAD} unread`}
        className="bg-brand-soft text-brand relative grid size-[36px] cursor-pointer place-items-center rounded-full border-0 shadow-card-sm"
      >
        <Bell size={20} aria-hidden />
        <span className="border-surface absolute -top-1 -right-[5px] grid min-w-[15px] place-items-center rounded-full border-2 bg-brand px-1 text-[9px] leading-[13px] font-bold text-white">
          {UNREAD}
        </span>
      </button>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{ paper: { sx: { width: 'min(470px,100%)' } } }}
      >
        <header className="border-line flex items-start gap-3 border-b px-[22px] pt-[22px] pb-[17px]">
          <div>
            <p className="text-brand m-0 text-[11px] font-extrabold tracking-[0.4px] uppercase">
              {UNREAD} unread
            </p>
            <h2 className="text-navy m-0 mt-[5px] mb-1 text-[21px]">Notifications</h2>
            <p className="text-muted m-0 text-xs">
              Meetings, assignments, stage moves and client responses.
            </p>
          </div>
          <IconButton
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
            size="small"
            className="ml-auto"
          >
            <X size={20} />
          </IconButton>
        </header>
        <div className="overflow-auto px-[22px] py-4">
          <SectionLabel>Needs attention</SectionLabel>
          {NEEDS_ATTENTION.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} onOpen={() => go(notice.to)} />
          ))}
          <SectionLabel>Upcoming</SectionLabel>
          {UPCOMING.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} onOpen={() => go(notice.to)} />
          ))}
          <section
            className={cn(
              'border-line bg-surface-alt mt-[18px] rounded-[10px] border p-4',
            )}
          >
            <b className="text-ink block text-[13px]">Reminder preferences</b>
            <p className="text-muted m-0 my-2 text-xs leading-normal">
              Choose which CRM events should create browser reminders.
            </p>
            <Button size="small" onClick={enableReminders}>
              Enable desktop reminders
            </Button>
          </section>
        </div>
      </Drawer>
    </>
  )
}
