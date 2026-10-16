import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { useTasas } from '../lib/useTasas'

function fmtBs(n: number) {
  return n.toLocaleString('es-VE', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
}

export function AjustesPage() {
  const { logout } = useAuth()
  const { tasas, loading, error, refresh } = useTasas()
  const [msg, setMsg] = useState<string | null>(null)

  async function actualizarVivas() {
    setMsg(null)
    const snap = await refresh(true)
    if (!snap.error) setMsg('Cotizaciones actualizadas')
  }

  const filas = [
    { key: 'USD_BCV' as const, titulo: 'Dólar (USD)', sub: 'Tasa oficial BCV' },
    { key: 'EUR' as const, titulo: 'Euro (EUR)', sub: 'Tasa oficial BCV' },
    { key: 'USDT' as const, titulo: 'USDT (Binance)', sub: 'P2P · promedio top 5 compra' },
  ]

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

      {msg && <p className="text-sm font-semibold text-income">{msg}</p>}
      {error && <p className="text-sm font-semibold text-expense">{error}</p>}

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-mist">Cotización en bolívares</h2>
          <p className="text-xs text-mist">USD y EUR = BCV · USDT = mercado digital (Binance)</p>
        </div>

        <div className="native-card space-y-3 p-4">
          <button
            type="button"
            disabled={loading}
            onClick={() => void actualizarVivas()}
            className="native-btn w-full bg-accent text-ink disabled:opacity-60"
          >
            {loading ? 'Consultando…' : 'Actualizar tasas ahora'}
          </button>
          <p className="text-[11px] text-mist">
            Oficial BCV (DolarAPI) + USDT Binance P2P.
          </p>
        </div>

        <div className="space-y-2">
          {filas.map((f) => {
            const valor = tasas[f.key]
            return (
              <article
                key={f.key}
                className="flex items-center justify-between rounded-xl border border-line/80 bg-panel/80 px-3 py-3"
              >
                <div>
                  <p className="font-medium">{f.titulo}</p>
                  <p className="text-xs text-mist">{f.sub}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold tabular-nums text-foam">
                    {valor != null && Number.isFinite(valor) ? fmtBs(valor) : '—'}
                  </p>
                  <p className="text-[11px] text-mist">Bs</p>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="rounded-xl border border-line/80 bg-panel/50 px-3 py-4 text-sm text-mist">
        <p className="font-medium text-foam">Cómo usarlo día a día</p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs">
          <li>Empieza en Hoy: mira alertas y cobros atrasados.</li>
          <li>Registra gastos/ingresos con el botón + (menos de 5s).</li>
          <li>Mantén cuentas con saldos reales para liquidez verdadera.</li>
          <li>Actualiza cotizaciones cuando cambie el BCV o Binance.</li>
          <li>Al cobrar un hito, liquídalo: entra solo al libro diario.</li>
        </ul>
      </section>
    </div>
  )
}
