import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { DesktopSidebar } from './DesktopSidebar'
import { FabCapture } from './FabCapture'
import { Header } from './Header'

export function AppShell() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-[100vw] flex-col md:max-w-6xl">
      <Header />
      <div className="flex min-w-0 flex-1">
        <DesktopSidebar />
        <main className="animate-page safe-bottom min-w-0 flex-1 overflow-x-hidden px-3 pt-3 sm:px-4 md:px-6 md:pb-10">
          <Outlet />
        </main>
      </div>
      <FabCapture />
      <BottomNav />
    </div>
  )
}
