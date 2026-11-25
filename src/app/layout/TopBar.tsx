import IconButton from '@mui/material/IconButton'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronDown, Menu } from 'lucide-react'
import { Fragment, useContext, useEffect, useRef, useState } from 'react'
import { useMatches } from 'react-router-dom'
import { devUser, setDevUser } from '@/api/crmClient'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { getMe, getUsers } from '@/features/records/api'
import { crmKeys } from '@/features/records/hooks'
import { cn } from '@/lib/cn'
import { BreadcrumbContext } from './breadcrumbContext'
import { UserMenu } from './UserMenu'

export interface RouteHandle {
  crumb?: string
}

export interface TopBarProps {
  onMenuClick: () => void
}

/**
 * Breadcrumb trail (from route handles + the current record name), notifications, dev-user switcher,
 * and user menu with sign-out.
 */
export function TopBar({ onMenuClick }: TopBarProps) {
  const matches = useMatches()
  const tail = useContext(BreadcrumbContext)?.tail
  const crumbs = [
    ...matches.map((match) => (match.handle as RouteHandle | undefined)?.crumb).filter(Boolean),
    ...(tail ? [tail] : []),
  ] as string[]
  const me = useQuery({ queryKey: crmKeys.me, queryFn: getMe, staleTime: 5 * 60_000 })
  const users = useQuery({ queryKey: crmKeys.users, queryFn: getUsers, staleTime: 5 * 60_000, enabled: false })
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const name = me.data?.name ?? 'Signing in…'

  return (
    <header className="bg-surface border-line flex h-[70px] items-center justify-between border-b px-5 md:px-[34px]">
      <div className="flex min-w-0 items-center gap-2">
        <IconButton aria-label="Open navigation menu" onClick={onMenuClick} sx={{ display: { md: 'none' } }} edge="start">
          <Menu size={22} />
        </IconButton>
        <nav aria-label="Breadcrumb" className="text-muted truncate text-[13px]">
          {crumbs.map((crumb, index) => (
            <Fragment key={`${crumb}-${index}`}>
              {index > 0 && <span aria-hidden> / </span>}
              <span aria-current={index === crumbs.length - 1 ? 'page' : undefined}>{crumb}</span>
            </Fragment>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {/* Development user switch (allows testing Credit, Capital, Standard, and Admin roles) */}
        <div ref={ref} className="relative">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => {
              setOpen((o) => !o)
              void users.refetch()
            }}
            className="hover:bg-surface-alt flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-muted transition-colors cursor-pointer"
          >
            <span className="bg-brand inline-block size-2 rounded-full" />
            <span className="hidden sm:inline">Role:</span>
            <span className="font-semibold text-ink">{name}</span>
            <ChevronDown size={14} className={cn('text-subtle transition-transform', open && 'rotate-180')} />
          </button>
          {open && (
            <div role="menu" className="border-line bg-surface shadow-dialog animate-pop absolute right-0 z-50 mt-1 w-64 rounded-xl border p-1">
              <p className="text-subtle m-0 px-3 pt-1.5 pb-1 text-[11px] font-bold tracking-wide uppercase">Act as (development)</p>
              {(users.data ?? []).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setDevUser(u.id)
                    setOpen(false)
                    void qc.invalidateQueries({ queryKey: ['crm'] })
                  }}
                  className="hover:bg-canvas flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm"
                >
                  <span className="w-4">{devUser() === u.id && <Check size={15} className="text-brand" />}</span>
                  <span className="flex-1">{u.name}</span>
                  <span className="text-subtle font-mono text-[11px]">{u.id}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <NotificationCenter />
        <UserMenu />
      </div>
    </header>
  )
}
