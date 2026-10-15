import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { DesktopSidebar } from './DesktopSidebar'
import { FabCapture } from './FabCapture'
import { Header } from './Header'

export function AppShell() {
  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col md:max-w-5xl">
      <Header />
      <div className="flex flex-1">
        <DesktopSidebar />
        <main className="flex-1 px-4 pb-28 pt-3 md:px-6 md:pb-8">
          <Outlet />
        </main>
      </div>
      <FabCapture />
      <BottomNav />
    </div>
  )
}
