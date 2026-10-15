import { useEffect, useState } from 'react'
import { api, type Moneda } from '../lib/api'
import { useAuth } from '../lib/auth'

export function AjustesPage() {
  const { logout } = useAuth()
  const [monedas, setMonedas] = useState<Moneda[]>([])
  const [msg, setMsg] = useState<string | null>(null)

  const load = () => api.monedas().then(setMonedas)
  useEffect(() => {
    void load()
  }, [])

  async function saveTasa(id: string, current: string | number) {
    const raw = window.prompt(`Nueva tasa de ${id} (unidades por 1 USD)`, String(current))
    if (raw == null) return
    await api.updateTasa(id, Number(raw))
    setMsg(`Tasa ${id} actualizada`)
    await load()
  }

  return (
    <div className="page space-y-5">
      <header>
        <h1 className="page-title">Ajustes</h1>
        <p className="text-sm text-mist">Tasas de cambio y preferencias operativas</p>
      </header>

      <section className="native-card space-y-3 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-mist">Sesión</h2>
        <button
          type="button"
          onClick={logout}
          className="native-btn w-full border border-line bg-ink-soft text-foam"
        >
          Cerrar sesión
        </button>
      </section>
      {msg && <p className="text-xs text-accent">{msg}</p>}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-mist">Tasas (vs USD)</h2>
        <p className="text-xs text-mist">Ej. VES 36.5 significa 36.5 Bs = 1 USD</p>
        {monedas.map((m) => (
          <article key={m.id} className="flex items-center justify-between rounded-xl border border-line/80 bg-panel/80 px-3 py-3">
            <div>
              <p className="font-medium">
                {m.id} · {m.nombre}
              </p>
              <p className="text-xs text-mist">
                {m.simbolo} · tasa {m.tasa_referencia}
              </p>
            </div>
            {m.id !== 'USD' && (
              <button
                type="button"
                onClick={() => void saveTasa(m.id, m.tasa_referencia)}
                className="rounded-lg bg-ink-soft px-3 py-1.5 text-xs text-accent"
              >
                Editar
              </button>
            )}
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-line/80 bg-panel/50 px-3 py-4 text-sm text-mist">
        <p className="font-medium text-foam">Cómo usarlo día a día</p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs">
          <li>Empieza en Hoy: mira alertas y cobros atrasados.</li>
          <li>Registra gastos/ingresos con el botón + (menos de 5s).</li>
          <li>Mantén cuentas con saldos reales para liquidez verdadera.</li>
          <li>Carga tus fijos (internet, tools) para no sorprenderte.</li>
          <li>Al cobrar un hito, liquídalo: entra solo al libro diario.</li>
        </ul>
      </section>
    </div>
  )
}
