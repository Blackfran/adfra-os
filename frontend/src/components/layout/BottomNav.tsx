import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

const primary = [
  { to: '/', label: 'Hoy', icon: IconHome },
  { to: '/finanzas', label: 'Dinero', icon: IconMoney },
  { to: '/proyectos', label: 'Trabajo', icon: IconBrief },
] as const

const moreLinks = [
  { to: '/agenda', label: 'Agenda', desc: 'Tareas y reuniones' },
  { to: '/cuentas', label: 'Cuentas', desc: 'Saldos y liquidez' },
  { to: '/ingresos-fijos', label: 'Ingresos fijos', desc: 'Retainers / salario' },
  { to: '/recurrentes', label: 'Gastos fijos', desc: 'Suscripciones' },
  { to: '/reporte', label: 'Reporte mensual', desc: 'Cierre y neto' },
  { to: '/clientes', label: 'Clientes', desc: 'Directorio' },
  { to: '/wishlist', label: 'Wishlist', desc: 'Metas de ahorro' },
  { to: '/bitacora', label: 'Bitácora', desc: 'Notas rápidas' },
  { to: '/ajustes', label: 'Ajustes', desc: 'Tasas y preferencias' },
] as const

export function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-foam/35 backdrop-blur-[2px]"
            aria-label="Cerrar"
            onClick={() => setMoreOpen(false)}
          />
          <div className="animate-sheet absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border border-line bg-panel px-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl sm:px-4">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
            <p className="mb-3 font-display text-lg font-bold text-foam">Más · AdFra Ges</p>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {moreLinks.map((item) => (
                <li key={item.to}>
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false)
                      navigate(item.to)
                    }}
                    className="native-card flex w-full flex-col items-start px-3 py-3 text-left active:scale-[0.98]"
                  >
                    <span className="text-sm font-semibold text-foam">{item.label}</span>
                    <span className="text-[11px] text-mist">{item.desc}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-panel/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-4 px-1 py-1.5">
          {primary.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-semibold transition ${
                    isActive ? 'bg-accent-soft text-accent' : 'text-mist'
                  }`
                }
              >
                <Icon />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={`flex min-h-[56px] w-full flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-semibold ${
                moreOpen ? 'bg-accent-soft text-accent' : 'text-mist'
              }`}
            >
              <IconMore />
              <span>Más</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  )
}

function IconHome() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" />
    </svg>
  )
}

function IconMoney() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v18M7 8h7a3 3 0 1 1 0 6H9a3 3 0 1 0 0 6h8" />
    </svg>
  )
}

function IconBrief() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5h8v2" />
    </svg>
  )
}

function IconMore() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="6" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="18" cy="12" r="1.6" fill="currentColor" />
    </svg>
  )
}
