import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Hoy' },
  { to: '/finanzas', label: 'Finanzas' },
  { to: '/proyectos', label: 'Proyectos' },
  { to: '/agenda', label: 'Agenda' },
] as const

export function DesktopSidebar() {
  return (
    <aside className="sticky top-[61px] hidden h-[calc(100vh-61px)] w-52 shrink-0 border-r border-line/60 bg-ink/40 p-4 md:block">
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-mist">Navegación</p>
      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm transition ${
                isActive ? 'bg-panel text-accent' : 'text-mist hover:bg-panel/60 hover:text-foam'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
