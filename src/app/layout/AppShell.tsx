import Drawer from '@mui/material/Drawer'
import { useEffect, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { BreadcrumbContext, type BreadcrumbApi } from './breadcrumbContext'
import { Sidebar, SIDEBAR_WIDTH } from './Sidebar'
import { TopBar } from './TopBar'

/** Page frame: collapsible sidebar on desktop, slide-over drawer on phones/tablets. */
export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [tail, setTail] = useState<string | null>(null)
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('crm_sidebar_open') ?? 'true') as boolean
    } catch {
      return true
    }
  })
  const breadcrumbs = useMemo<BreadcrumbApi>(() => ({ tail, setTail }), [tail])

  useEffect(() => {
    const handleToggle = (event: Event) => {
      setSidebarExpanded((event as CustomEvent<boolean>).detail)
    }
    window.addEventListener('sidebar-toggle', handleToggle)
    return () => window.removeEventListener('sidebar-toggle', handleToggle)
  }, [])

  return (
    <BreadcrumbContext.Provider value={breadcrumbs}>
      <a
        href="#main"
        className="bg-surface text-brand sr-only z-50 rounded p-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>

      {/* minmax(0,1fr) lets the content column shrink so wide children (kanban, tables) scroll inside their own container instead of stretching the page. */}
      <div
        className={`border-teal grid h-screen grid-rows-[minmax(0,1fr)] grid-cols-[minmax(0,1fr)] overflow-hidden border-t-[3px] transition-[grid-template-columns] duration-300 ease-in-out ${
          sidebarExpanded
            ? 'md:grid-cols-[248px_minmax(0,1fr)]'
            : 'md:grid-cols-[64px_minmax(0,1fr)]'
        }`}
      >
        <aside className="bg-surface border-line sticky top-0 hidden h-screen border-r md:block">
          <Sidebar />
        </aside>

        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sx={{ display: { md: 'none' } }}
          slotProps={{ paper: { sx: { width: SIDEBAR_WIDTH } } }}
        >
          <Sidebar isMobile onNavigate={() => setDrawerOpen(false)} />
        </Drawer>

        <div className="min-w-0 min-h-0 overflow-y-auto flex flex-col flex-1">
          <TopBar onMenuClick={() => setDrawerOpen(true)} />
          <main id="main" className="mx-auto max-w-[1600px] w-full px-5 pt-[30px] pb-[42px] md:px-[34px] flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </BreadcrumbContext.Provider>
  )
}
