import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: 'Hoy', icon: IconToday },
  { to: '/finanzas', label: 'Finanzas', icon: IconFinance },
  { to: '/proyectos', label: 'Proyectos', icon: IconProjects },
  { to: '/agenda', label: 'Agenda', icon: IconAgenda },
] as const

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-4 px-2 py-2">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] transition ${
                  isActive ? 'text-accent' : 'text-mist hover:text-foam'
                }`
              }
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function IconToday() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <path d="M8 2v4M16 2v4M3 10h18" />
    </svg>
  )
}

function IconFinance() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3v18M7 8h7a3 3 0 010 6H9a3 3 0 000 6h8" />
    </svg>
  )
}

function IconProjects() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h16v12H4zM8 7V5h8v2" />
      <path d="M8 12h8M8 16h5" />
    </svg>
  )
}

function IconAgenda() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}
