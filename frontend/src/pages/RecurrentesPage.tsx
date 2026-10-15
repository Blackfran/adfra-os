import { useEffect, useState, type FormEvent } from 'react'
import { api, type Recurrente } from '../lib/api'
import { money } from '../lib/money'

export function RecurrentesPage() {
  const [items, setItems] = useState<Recurrente[]>([])
  const [nombre, setNombre] = useState('')
  const [monto, setMonto] = useState('')
  const [dia, setDia] = useState('1')
  const [error, setError] = useState<string | null>(null)

  const load = () => api.recurrentes().then(setItems).catch((e: Error) => setError(e.message))
  useEffect(() => {
    void load()
  }, [])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    await api.createRecurrente({
      nombre,
      monto: Number(monto),
      moneda_id: 'USD',
      dia_cobro: Number(dia),
    })
    setNombre('')
    setMonto('')
    await load()
  }

  async function pagar(id: number) {
    if (!window.confirm('Registrar este gasto fijo hoy?')) return
    await api.pagarRecurrente(id)
    await load()
  }

  const mensuales = items.filter((i) => i.activo).reduce((a, i) => a + Number(i.monto), 0)

  return (
    <div className="page space-y-5">
      <header>
        <h1 className="page-title">Gastos fijos</h1>
        <p className="text-sm text-mist">Suscripciones y pagos recurrentes · ~{money(mensuales)}/mes</p>
      </header>
      {error && <p className="text-sm text-expense">{error}</p>}

      <form onSubmit={onCreate} className="space-y-2 rounded-2xl border border-line/80 bg-panel/80 p-4">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej. Internet, Notion, alquiler…"
          className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-accent"
          required
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="Monto USD"
            inputMode="decimal"
            className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-accent"
            required
          />
          <input
            value={dia}
            onChange={(e) => setDia(e.target.value)}
            placeholder="Día cobro (1-28)"
            inputMode="numeric"
            className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <button type="submit" className="w-full rounded-lg bg-accent py-2 text-sm font-semibold text-ink">
          Agregar fijo
        </button>
      </form>

      <section className="space-y-2">
        {items.map((r) => (
          <article key={r.id} className="rounded-xl border border-line/80 bg-panel/80 px-3 py-3">
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-medium">{r.nombre}</p>
                <p className="text-xs text-mist">
                  Día {r.dia_cobro} · próximo {r.proximo_pago}
                  {r.dias_restantes != null ? ` (${r.dias_restantes}d)` : ''}
                </p>
              </div>
              <p className="text-sm font-semibold text-expense">{money(r.monto, r.moneda_id)}</p>
            </div>
            {r.activo && (
              <button
                type="button"
                onClick={() => void pagar(r.id)}
                className="mt-2 w-full rounded-lg bg-expense/15 py-1.5 text-xs font-semibold text-expense"
              >
                Pagar ahora
              </button>
            )}
          </article>
        ))}
      </section>
    </div>
  )
}
