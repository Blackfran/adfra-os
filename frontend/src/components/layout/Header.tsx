import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandMark } from '../BrandMark'
import { api } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import type { SearchHit } from '../../types/api'

export function Header() {
  const { user } = useAuth()
  const [online, setOnline] = useState(navigator.onLine)
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([])
      return
    }
    const t = setTimeout(() => {
      api.search(q.trim()).then((r) => setHits(r.results)).catch(() => setHits([]))
    }, 220)
    return () => clearTimeout(t)
  }, [q])

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-panel/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-4 md:px-6">
        <BrandMark subtitle={user ? `Hola ${user}` : 'Gestión personal'} />
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            aria-label="Buscar"
            onClick={() => setSearchOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ink-soft text-accent"
          >
            <SearchIcon />
          </button>
          <span
            className={`rounded-2xl px-2 py-1.5 text-[10px] font-semibold sm:px-2.5 sm:text-[11px] ${
              online ? 'bg-income-soft text-income' : 'bg-expense-soft text-expense'
            }`}
          >
            {online ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {searchOpen && (
        <div className="relative px-3 pb-3 sm:px-4 md:px-6">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar cobros, notas, proyectos…"
            className="native-input"
          />
          {hits.length > 0 && (
            <ul className="absolute inset-x-3 z-40 mt-2 max-h-64 overflow-auto rounded-2xl border border-line bg-panel shadow-lg sm:inset-x-4 md:inset-x-6">
              {hits.map((h) => (
                <li key={`${h.entity}-${h.id}`} className="border-b border-line/70 px-3 py-3 last:border-0">
                  <p className="text-sm font-medium text-foam">{h.titulo}</p>
                  <p className="text-[11px] capitalize text-mist">
                    {h.entity}
                    {h.detalle ? ` · ${h.detalle}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {!q && (
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                to="/transacciones/nuevo?tipo=gasto"
                className="rounded-2xl bg-expense-soft px-3 py-1.5 text-xs font-semibold text-expense"
              >
                Gasto rápido
              </Link>
              <Link
                to="/transacciones/nuevo?tipo=ingreso"
                className="rounded-2xl bg-income-soft px-3 py-1.5 text-xs font-semibold text-income"
              >
                Ingreso
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  )
}
