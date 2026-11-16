import IconButton from '@mui/material/IconButton'
import { Menu } from 'lucide-react'
import { Fragment, useContext } from 'react'
import { useMatches } from 'react-router-dom'
import { BreadcrumbContext } from './breadcrumbContext'
import { UserMenu } from './UserMenu'

export interface RouteHandle {
  crumb?: string
}

export interface TopBarProps {
  onMenuClick: () => void
}

/** Breadcrumb trail (from route handles + the current record name) and the signed-in user. */
export function TopBar({ onMenuClick }: TopBarProps) {
  const matches = useMatches()
  const tail = useContext(BreadcrumbContext)?.tail
  const crumbs = [
    ...matches.map((match) => (match.handle as RouteHandle | undefined)?.crumb).filter(Boolean),
    ...(tail ? [tail] : []),
  ] as string[]

  return (
    <header className="bg-surface border-line flex h-[70px] items-center justify-between border-b px-5 md:px-[34px]">
      <div className="flex min-w-0 items-center gap-2">
        <IconButton
          aria-label="Open navigation menu"
          onClick={onMenuClick}
          sx={{ display: { md: 'none' } }}
          edge="start"
        >
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
      <UserMenu />
    </header>
  )
}
