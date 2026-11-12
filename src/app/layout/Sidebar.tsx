import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { NAV_ITEMS } from '../navigation'

export interface SidebarProps {
  /** Called after navigating (used to close the mobile drawer). */
  onNavigate?: () => void
}

/** Logo, primary navigation and (for the active section) its sub-navigation. */
export function Sidebar({ onNavigate }: SidebarProps) {
  const { pathname } = useLocation()

  return (
    <nav aria-label="Primary" className="flex h-full flex-col px-[13px] py-6">
      <div className="text-ink px-2.5 pb-[29px] text-[22px] font-extrabold tracking-tight">
        <span aria-hidden className="bg-brand mr-1.5 inline-block size-3.5" />
        PrivateInvest
      </div>

      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.to || pathname.startsWith(`${item.to}/`)
        const Icon = item.icon
        return (
          <div key={item.to}>
            <NavLink
              to={item.to}
              onClick={onNavigate}
              className={cn(
                'my-0.5 flex w-full items-center gap-[11px] rounded-lg px-[13px] py-3 text-left no-underline',
                isActive ? 'bg-brand font-semibold text-white' : 'text-muted hover:bg-surface-alt',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={19} aria-hidden />
              {item.label}
            </NavLink>
            {isActive && item.children && (
              <ul className="border-line-soft m-0 mt-[5px] mb-3 ml-[23px] list-none border-l p-0 pl-2">
                {item.children.map((child) =>
                  child.to ? (
                    <li key={child.label}>
                      <NavLink
                        to={child.to}
                        onClick={onNavigate}
                        className={({ isActive: childActive }) =>
                          cn(
                            'block rounded-md px-2.5 py-2 no-underline',
                            childActive
                              ? 'text-brand bg-brand-tint font-bold'
                              : 'text-subtle hover:bg-surface-alt',
                          )
                        }
                      >
                        {child.label}
                      </NavLink>
                    </li>
                  ) : (
                    <li key={child.label}>
                      <span
                        aria-disabled="true"
                        title="Not built yet"
                        className="text-subtle block cursor-not-allowed rounded-md px-2.5 py-2 opacity-60"
                      >
                        {child.label}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            )}
          </div>
        )
      })}

      <div className="text-subtle mt-auto p-2.5 text-xs">
        <span aria-hidden className="bg-success mr-1.5 inline-block size-[7px] rounded-full" />
        System connected
      </div>
    </nav>
  )
}
