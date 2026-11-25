import IconButton from '@mui/material/IconButton'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronDown, Menu } from 'lucide-react'
import { Fragment, useContext, useEffect, useRef, useState } from 'react'
import { useMatches } from 'react-router-dom'
import { devUser, setDevUser } from '@/api/crmClient'
import { Avatar } from '@/components/ui/Avatar'
import { getMe, getUsers } from '@/features/records/api'
import { crmKeys } from '@/features/records/hooks'
import { cn } from '@/lib/cn'
import { BreadcrumbContext } from './breadcrumbContext'

export interface RouteHandle {
  crumb?: string
}

export interface TopBarProps {
  onMenuClick: () => void
}

/**
 * Breadcrumb trail (from route handles + the current record name) and the signed-in user. Until sign-in is wired,
 * development runs as a seeded dev user, switchable here to try each role's permissions.
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
      <div ref={ref} className="relative">
        <button type="button" aria-haspopup="menu" aria-expanded={open}
          onClick={() => { setOpen((o) => !o); void users.refetch() }}
          className="hover:bg-canvas flex items-center gap-[9px] rounded-control px-2 py-1 font-semibold transition-colors">
          <Avatar name={name} />
          <span className="hidden text-left sm:block">
            {name}
            {me.data && <span className="text-subtle block text-[11px] font-normal">{me.data.roles.join(', ').toLowerCase()} · dev user</span>}
          </span>
          <ChevronDown size={15} className={cn('text-subtle transition-transform', open && 'rotate-180')} />
        </button>
        {open && (
          <div role="menu" className="border-line bg-surface shadow-dialog animate-pop absolute right-0 z-50 mt-1 w-64 rounded-control border p-1">
            <p className="text-subtle m-0 px-3 pt-1.5 pb-1 text-[11px] font-bold tracking-wide uppercase">Act as (development)</p>
            {(users.data ?? []).map((u) => (
              <button key={u.id} type="button" role="menuitem"
                onClick={() => { setDevUser(u.id); setOpen(false); void qc.invalidateQueries({ queryKey: ['crm'] }) }}
                className="hover:bg-canvas flex w-full items-center gap-2 rounded-input px-3 py-2 text-left text-sm">
                <span className="w-4">{devUser() === u.id && <Check size={15} className="text-brand" />}</span>
                <span className="flex-1">{u.name}</span>
                <span className="text-subtle font-mono text-[11px]">{u.id}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}
