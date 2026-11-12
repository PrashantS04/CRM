import Drawer from '@mui/material/Drawer'
import { useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { BreadcrumbContext, type BreadcrumbApi } from './breadcrumbContext'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

const SIDEBAR_WIDTH = 248

/** Page frame: fixed sidebar on desktop, slide-over drawer on phones/tablets. */
export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [tail, setTail] = useState<string | null>(null)
  const breadcrumbs = useMemo<BreadcrumbApi>(() => ({ tail, setTail }), [tail])

  return (
    <BreadcrumbContext.Provider value={breadcrumbs}>
      <a
        href="#main"
        className="bg-surface text-brand sr-only z-50 rounded p-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      {/* minmax(0,1fr) lets the content column shrink so wide children (kanban, tables) scroll inside their own container instead of stretching the page. */}
      <div className="border-teal grid min-h-screen grid-cols-[minmax(0,1fr)] border-t-[3px] md:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="bg-surface border-line hidden border-r md:block">
          <Sidebar />
        </aside>
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sx={{ display: { md: 'none' } }}
          slotProps={{ paper: { sx: { width: SIDEBAR_WIDTH } } }}
        >
          <Sidebar onNavigate={() => setDrawerOpen(false)} />
        </Drawer>

        <div className="min-w-0">
          <TopBar onMenuClick={() => setDrawerOpen(true)} />
          <main id="main" className="mx-auto max-w-[1600px] px-5 pt-[30px] pb-[42px] md:px-[34px]">
            <Outlet />
          </main>
        </div>
      </div>
    </BreadcrumbContext.Provider>
  )
}
