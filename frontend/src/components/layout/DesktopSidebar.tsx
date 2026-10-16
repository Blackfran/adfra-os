import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Hoy' },
  { to: '/finanzas', label: 'Dinero' },
  { to: '/cuentas', label: 'Cuentas' },
  { to: '/ingresos-fijos', label: 'Ingresos fijos' },
  { to: '/recurrentes', label: 'Gastos fijos' },
  { to: '/reporte', label: 'Reporte mensual' },
  { to: '/proyectos', label: 'Trabajo' },
  { to: '/clientes', label: 'Clientes' },
  { to: '/agenda', label: 'Agenda' },
  { to: '/wishlist', label: 'Wishlist' },
  { to: '/compras', label: 'Compras' },
  { to: '/whatsapp', label: 'WhatsApp' },
  { to: '/bitacora', label: 'Bitácora' },
  { to: '/ajustes', label: 'Ajustes' },
] as const

export function DesktopSidebar() {
  return (
    <aside className="sticky top-[65px] hidden h-[calc(100vh-65px)] w-52 shrink-0 overflow-y-auto border-r border-line bg-panel/70 p-3 lg:w-56 lg:p-4 md:block">
      <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-mist">AdFra Ges</p>
      <nav className="flex flex-col gap-0.5">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                isActive ? 'bg-accent-soft text-accent' : 'text-mist hover:bg-ink-soft hover:text-foam'
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
