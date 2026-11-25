import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { NAV_ITEMS } from '../navigation'

export const SIDEBAR_WIDTH = 248
export const SIDEBAR_COLLAPSED = 64

export interface SidebarProps {
  /** Called after navigating (used to close the mobile drawer). */
  onNavigate?: () => void
  /** When true, renders in mobile mode (always fully expanded, no toggle button). */
  isMobile?: boolean
  className?: string
}

interface TooltipState {
  visible: boolean
  text: string
  top: number
  left: number
}

/** Logo, primary navigation and (for the active section) its sub-navigation, with LMS-style toggle. */
export function Sidebar({ onNavigate, isMobile = false, className }: SidebarProps) {
  const { pathname } = useLocation()

  // Open state persisted to localStorage, default to true
  const [open, setOpen] = useState<boolean>(() => {
    if (isMobile) return true
    try {
      const stored = localStorage.getItem('pi_sidebar_open')
      if (stored !== null) return JSON.parse(stored)
    } catch {
      // fallback
    }
    return true
  })

  const [hoverExpanded, setHoverExpanded] = useState(false)
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    text: '',
    top: 0,
    left: 0,
  })

  const isExpanded = isMobile || open || hoverExpanded

  // Persist open state
  useEffect(() => {
    if (!isMobile) {
      try {
        localStorage.setItem('pi_sidebar_open', JSON.stringify(open))
      } catch {
        // ignore
      }
    }
  }, [open, isMobile])

  // Dispatch custom event for external listeners
  useEffect(() => {
    if (!isMobile) {
      window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: isExpanded }))
    }
  }, [isExpanded, isMobile])

  // Responsive: collapse on screen resize below 1024px
  useEffect(() => {
    if (isMobile) return
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isMobile])

  const showTooltip = (e: React.MouseEvent<HTMLElement>, text: string) => {
    if (isExpanded && text !== 'Collapse sidebar' && text !== 'Expand sidebar') return
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({
      visible: true,
      text,
      top: rect.top + rect.height / 2,
      left: rect.right + 12,
    })
  }

  const hideTooltip = () => {
    setTooltip((prev) => ({ ...prev, visible: false }))
  }

  const handleMouseEnter = () => {
    if (!isMobile && !open) {
      setHoverExpanded(true)
      hideTooltip()
    }
  }

  const handleMouseLeave = () => {
    if (!isMobile && !open) {
      setHoverExpanded(false)
      hideTooltip()
    }
  }

  return (
    <div
      className={cn(
        'relative shrink-0 select-none transition-all duration-300 ease-in-out',
        isMobile ? 'h-full w-[248px]' : 'sticky top-0 z-30 h-screen overflow-visible',
        className,
      )}
      style={{
        width: isMobile ? SIDEBAR_WIDTH : isExpanded ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Round Toggle Button on right border (LMS-style) */}
      {!isMobile && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setOpen((prev) => !prev)
          }}
          onMouseEnter={(e) => showTooltip(e, open ? 'Collapse sidebar' : 'Expand sidebar')}
          onMouseLeave={hideTooltip}
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
          className="border-line bg-surface shadow-card hover:bg-surface-alt text-muted hover:text-ink absolute top-1/2 right-0 z-50 hidden size-8 -translate-y-1/2 translate-x-1/2 cursor-pointer items-center justify-center rounded-full border transition-all duration-200 hover:scale-110 md:flex"
        >
          {open ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
      )}

      {/* Sidebar Content Panel */}
      <aside
        aria-label="Sidebar"
        className="bg-surface border-line flex h-full w-full flex-col border-r transition-all duration-300 ease-in-out no-scrollbar overflow-hidden"
      >
        <nav
          aria-label="Primary"
          className={cn(
            'flex h-full flex-col overflow-y-auto overflow-x-hidden no-scrollbar transition-all duration-200',
            isExpanded ? 'px-[13px] py-4' : 'px-2 py-4',
          )}
        >
          {/* Logo */}
          <div className="pb-4">
            {isExpanded ? (
              <div className="text-ink flex items-center gap-2 px-2.5 text-[22px] font-extrabold tracking-tight">
                <span aria-hidden className="bg-brand inline-block size-3.5 shrink-0 rounded-sm" />
                <span className="truncate">PrivateInvest</span>
              </div>
            ) : (
              <div
                className="flex items-center justify-center py-1 cursor-pointer"
                onMouseEnter={(e) => showTooltip(e, 'PrivateInvest')}
                onMouseLeave={hideTooltip}
              >
                <span aria-hidden className="bg-brand inline-block size-4 shrink-0 rounded-sm" />
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <div className="flex-1 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = item.to
                ? pathname === item.to || pathname.startsWith(`${item.to}/`)
                : false
              const Icon = item.icon

              return (
                <div key={item.label}>
                  {item.to ? (
                    <NavLink
                      to={item.to}
                      onClick={onNavigate}
                      onMouseEnter={(e) => showTooltip(e, item.label)}
                      onMouseLeave={hideTooltip}
                      className={cn(
                        'my-0.5 flex w-full items-center rounded-lg text-sm no-underline transition-all duration-200',
                        isExpanded
                          ? 'gap-[11px] px-[13px] py-2 text-left'
                          : 'size-10 justify-center px-0 mx-auto text-center',
                        isActive
                          ? 'bg-brand font-semibold text-white'
                          : 'text-muted hover:bg-surface-alt',
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon size={19} className="shrink-0" aria-hidden />
                      <span className={cn('truncate', !isExpanded && 'sr-only')}>
                        {item.label}
                      </span>
                    </NavLink>
                  ) : (
                    <div
                      title={isExpanded ? 'Coming soon' : undefined}
                      onMouseEnter={(e) => showTooltip(e, `${item.label} (Coming soon)`)}
                      onMouseLeave={hideTooltip}
                      className={cn(
                        'my-0.5 flex w-full cursor-not-allowed items-center rounded-lg text-sm text-muted opacity-60 transition-all duration-200',
                        isExpanded
                          ? 'gap-[11px] px-[13px] py-2 text-left'
                          : 'size-10 justify-center px-0 mx-auto text-center',
                      )}
                    >
                      <Icon size={19} className="shrink-0" aria-hidden />
                      <span className={cn('truncate', !isExpanded && 'sr-only')}>
                        {item.label}
                      </span>
                    </div>
                  )}

                  {/* Sub-navigation for active section with children */}
                  {isActive && item.children && isExpanded && (
                    <ul className="border-line-soft m-0 mt-[3px] mb-2 ml-[23px] list-none border-l p-0 pl-2 space-y-0.5">
                      {item.children.map((child) =>
                        child.to ? (
                          <li key={child.label}>
                            <NavLink
                              to={child.to}
                              onClick={onNavigate}
                              className={({ isActive: childActive }) =>
                                cn(
                                  'block rounded-md px-2.5 py-1.5 text-xs no-underline transition-colors',
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
                              className="text-subtle block cursor-not-allowed rounded-md px-2.5 py-1.5 text-xs opacity-60"
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

          {/* System status at bottom */}
          <div className="mt-auto pt-2">
            {isExpanded ? (
              <div className="text-subtle flex items-center p-2.5 text-xs">
                <span
                  aria-hidden
                  className="bg-success mr-1.5 inline-block size-[7px] shrink-0 rounded-full"
                />
                <span className="truncate">System connected</span>
              </div>
            ) : (
              <div
                className="flex items-center justify-center py-2"
                onMouseEnter={(e) => showTooltip(e, 'System connected')}
                onMouseLeave={hideTooltip}
              >
                <span aria-hidden className="bg-success inline-block size-2 rounded-full" />
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Floating LMS-style Tooltip */}
      {tooltip.visible && !isExpanded && (
        <div
          className="fixed z-[10000] rounded-md bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white shadow-lg pointer-events-none whitespace-nowrap"
          style={{
            top: tooltip.top,
            left: tooltip.left,
            transform: 'translateY(-50%)',
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  )
}
