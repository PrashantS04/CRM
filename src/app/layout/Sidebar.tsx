import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { NAV_ITEMS } from '../navigation'
import { LogoutConfirm } from './LogoutConfirm'

const STORAGE_KEY = 'crm_sidebar_open'

export interface SidebarProps {
  /** Called after navigating (used to close the mobile drawer). */
  onNavigate?: () => void
}

interface TooltipState {
  text: string
  top: number
  left: number
}

/** Logo, primary navigation and (for the active section) its sub-navigation. */
export function Sidebar({ onNavigate }: SidebarProps) {
  const { pathname } = useLocation()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [open, setOpen] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'true') as boolean
    } catch {
      return true
    }
  })
  const [hoverExpanded, setHoverExpanded] = useState(false)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const navRef = useRef<HTMLElement | null>(null)
  const openRef = useRef(open)

  // When rendered inside the mobile drawer it is always expanded and never
  // drives the desktop layout width.
  const isDrawer = onNavigate !== undefined
  const isExpanded = isDrawer || open || hoverExpanded

  useEffect(() => {
    if (isDrawer) return
    window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: isExpanded }))
  }, [isExpanded, isDrawer])

  useEffect(() => {
    openRef.current = open
  }, [open])

  useEffect(() => {
    if (!isDrawer) localStorage.setItem(STORAGE_KEY, JSON.stringify(open))
  }, [open, isDrawer])

  useEffect(() => {
    if (isDrawer) return
    const el = navRef.current
    if (!el) return
    const handleEnter = () => {
      if (!openRef.current) setHoverExpanded(true)
    }
    const handleLeave = () => setHoverExpanded(false)
    el.addEventListener('mouseenter', handleEnter)
    el.addEventListener('mouseleave', handleLeave)
    return () => {
      el.removeEventListener('mouseenter', handleEnter)
      el.removeEventListener('mouseleave', handleLeave)
    }
  }, [isDrawer])

  const showTooltip = (event: ReactMouseEvent<HTMLElement>, text: string) => {
    if (isExpanded && text !== 'Collapse' && text !== 'Expand') return
    const rect = event.currentTarget.getBoundingClientRect()
    setTooltip({ text, top: rect.top + rect.height / 2, left: rect.right + 12 })
  }
  const hideTooltip = () => setTooltip(null)

  return (
    <nav
      ref={navRef}
      aria-label="Primary"
      className={cn(
        'relative flex h-full flex-col py-6 transition-[padding] duration-300',
        isExpanded ? 'px-[13px]' : 'px-2',
      )}
    >
      {!isDrawer && (
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          onMouseEnter={(event) => showTooltip(event, open ? 'Collapse' : 'Expand')}
          onMouseLeave={hideTooltip}
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
          className="bg-surface border-line absolute top-1/2 right-0 z-20 hidden size-9 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border shadow-md transition-all duration-300 md:flex"
        >
          {open ? <ChevronLeft size={16} aria-hidden /> : <ChevronRight size={16} aria-hidden />}
        </button>
      )}

      <div
        className={cn(
          'pb-[29px]',
          isExpanded ? 'text-ink px-2.5 text-[22px] font-extrabold tracking-tight' : 'flex justify-center',
        )}
      >
        {isExpanded ? (
          <>
            <span aria-hidden className="bg-brand mr-1.5 inline-block size-3.5" />
            PrivateInvest
          </>
        ) : (
          <span aria-hidden className="bg-brand block size-6" />
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.to || pathname.startsWith(`${item.to}/`)
        const Icon = item.icon
        return (
          <div key={item.to}>
            <NavLink
              to={item.to}
              onClick={onNavigate}
              onMouseEnter={(event) => showTooltip(event, item.label)}
              onMouseLeave={hideTooltip}
              className={cn(
                'my-0.5 flex w-full items-center rounded-lg no-underline transition-all duration-200',
                isExpanded
                  ? 'gap-[11px] px-[13px] py-3 text-left'
                  : 'mx-auto size-10 justify-center',
                isActive ? 'bg-brand font-semibold text-white' : 'text-muted hover:bg-surface-alt',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={19} aria-hidden className="shrink-0" />
              <span
                className={cn(
                  'transition-all duration-200',
                  isExpanded ? 'opacity-100' : 'max-w-0 overflow-hidden whitespace-nowrap opacity-0',
                )}
              >
                {item.label}
              </span>
            </NavLink>
            {isExpanded && isActive && item.children && (
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
      </div>

      {/* <div className="text-subtle mt-auto p-2.5 text-xs">
        <span aria-hidden className="bg-success mr-1.5 inline-block size-[7px] rounded-full" />
        System connected
      </div> */}
      <div className="border-line-soft border-t pt-2">
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          onMouseEnter={(event) => showTooltip(event, 'Logout')}
          onMouseLeave={hideTooltip}
          className={cn(
            'text-muted hover:bg-surface-alt my-0.5 flex w-full items-center rounded-lg no-underline transition-all duration-200',
            isExpanded ? 'gap-[11px] px-[13px] py-3 text-left' : 'mx-auto size-10 justify-center',
          )}
        >
          {isExpanded ? (
            <>
              <LogOut size={19} aria-hidden className="shrink-0" />
              Logout
            </>
          ) : (
            <LogOut size={19} aria-hidden />
          )}
        </button>
      </div>

      {tooltip && (
        <div
          className="bg-ink text-surface fixed z-[10000] rounded-md px-3 py-1.5 text-sm whitespace-nowrap shadow-lg"
          style={{ top: tooltip.top, left: tooltip.left, transform: 'translateY(-50%)' }}
        >
          {tooltip.text}
        </div>
      )}

      <LogoutConfirm open={confirmOpen} onClose={() => setConfirmOpen(false)} />
    </nav>
  )
}
