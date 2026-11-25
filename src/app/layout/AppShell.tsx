import Drawer from '@mui/material/Drawer'
import { useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { BreadcrumbContext, type BreadcrumbApi } from './breadcrumbContext'
import { Sidebar, SIDEBAR_WIDTH } from './Sidebar'
import { TopBar } from './TopBar'

/** Page frame: collapsible sidebar on desktop, slide-over drawer on phones/tablets. */
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
      {/* Flex container allows sidebar to collapse/expand smoothly while the content expands to fill all available width */}
      <div className="border-teal flex min-h-screen w-full border-t-[3px]">
        {/* Desktop Collapsible Sidebar */}
        <Sidebar className="hidden md:flex" />

        {/* Mobile Slide-over Drawer */}
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sx={{ display: { md: 'none' } }}
          slotProps={{ paper: { sx: { width: SIDEBAR_WIDTH } } }}
        >
          <Sidebar isMobile onNavigate={() => setDrawerOpen(false)} />
        </Drawer>

        <div className="min-w-0 flex-1 flex flex-col">
          <TopBar onMenuClick={() => setDrawerOpen(true)} />
          <main id="main" className="mx-auto max-w-[1600px] w-full px-5 pt-[30px] pb-[42px] md:px-[34px] flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </BreadcrumbContext.Provider>
  )
}
