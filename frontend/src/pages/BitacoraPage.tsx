import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { Nota } from '../types/api'

export function BitacoraPage() {
  const [notas, setNotas] = useState<Nota[]>([])
  const [q, setQ] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      api
        .bitacora(q || undefined)
        .then(setNotas)
        .catch((e: Error) => setError(e.message))
    }, 200)
    return () => clearTimeout(t)
  }, [q])

  return (
    <div className="page space-y-5">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Bitácora</h1>
          <p className="text-sm text-mist">Notas rápidas con #hashtags</p>
        </div>
        <Link to="/bitacora/nuevo" className="text-sm text-accent">
          + Nota
        </Link>
      </header>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar o filtrar #etiquetas"
        className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
      />

      {error && <p className="text-sm text-expense">{error}</p>}

      <section className="space-y-2">
        {notas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line/70 px-3 py-4 text-sm text-mist">
            Sin notas
          </p>
        ) : (
          notas.map((n) => (
            <article key={n.id} className="rounded-xl border border-line/80 bg-panel/80 px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-foam">{n.titulo || 'Sin título'}</p>
                {n.fijado && <span className="text-[10px] text-accent">FIJADA</span>}
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-mist">{n.contenido}</p>
              {n.etiquetas && <p className="mt-2 text-xs text-accent">{n.etiquetas}</p>}
            </article>
          ))
        )}
      </section>
    </div>
  )
}
