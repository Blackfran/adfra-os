import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../lib/api'
import { money } from '../lib/money'
import type { WishlistItem } from '../types/api'

export function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [titulo, setTitulo] = useState('')
  const [precio, setPrecio] = useState('')
  const [prioridad, setPrioridad] = useState('media')
  const [error, setError] = useState<string | null>(null)

  const load = () => api.wishlist().then(setItems).catch((e: Error) => setError(e.message))

  useEffect(() => {
    void load()
  }, [])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    await api.createWishlist({
      titulo,
      precio_estimado: Number(precio),
      moneda_id: 'USD',
      prioridad,
      estado: 'deseado',
    })
    setTitulo('')
    setPrecio('')
    await load()
  }

  async function aportar(id: number) {
    const raw = window.prompt('Monto a aportar (USD)')
    if (!raw) return
    await api.aporteWishlist(id, Number(raw))
    await load()
  }

  async function comprar(id: number) {
    if (!window.confirm('¿Registrar compra como gasto y archivar?')) return
    await api.comprarWishlist(id)
    await load()
  }

  return (
    <div className="page space-y-5">
      <header>
        <h1 className="page-title">Wishlist</h1>
        <p className="text-sm text-mist">Metas de ahorro y adquisiciones</p>
      </header>

      {error && <p className="text-sm text-expense">{error}</p>}

      <form onSubmit={onCreate} className="space-y-2 rounded-2xl border border-line/80 bg-panel/80 p-4">
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Qué quieres comprar"
          className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-accent"
          required
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            placeholder="Precio estimado"
            inputMode="decimal"
            className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-accent"
            required
          />
          <select
            value={prioridad}
            onChange={(e) => setPrioridad(e.target.value)}
            className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select>
        </div>
        <button type="submit" className="w-full rounded-lg bg-accent py-2 text-sm font-semibold text-ink">
          Agregar deseo
        </button>
      </form>

      <section className="space-y-2">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border border-line/80 bg-panel/80 px-3 py-3">
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-medium">{item.titulo}</p>
                <p className="text-xs capitalize text-mist">
                  {item.prioridad} · {item.estado.replace('_', ' ')}
                </p>
              </div>
              <p className="text-sm font-semibold">{money(item.precio_estimado, item.moneda_id)}</p>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-soft">
              <div className="h-full bg-accent" style={{ width: `${item.progreso_pct}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-mist">
              {money(item.monto_ahorrado, item.moneda_id)} · {item.progreso_pct}%
              {item.meses_estimados != null ? ` · ~${item.meses_estimados} meses` : ''}
            </p>
            {item.estado !== 'comprado' && item.estado !== 'descartado' && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => void aportar(item.id)}
                  className="rounded-lg bg-ink-soft py-1.5 text-xs text-foam"
                >
                  Aportar
                </button>
                <button
                  type="button"
                  onClick={() => void comprar(item.id)}
                  className="rounded-lg bg-income/20 py-1.5 text-xs font-semibold text-income"
                >
                  Comprar
                </button>
              </div>
            )}
          </article>
        ))}
      </section>
    </div>
  )
}
