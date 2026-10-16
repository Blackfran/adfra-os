import { useEffect, useState, type FormEvent } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { api } from '../lib/api'
import { money } from '../lib/money'
import type { WishlistItem } from '../types/api'

type Pending =
  | { type: 'save'; payload: Record<string, unknown> }
  | { type: 'delete'; item: WishlistItem }
  | null

export function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [titulo, setTitulo] = useState('')
  const [precio, setPrecio] = useState('')
  const [prioridad, setPrioridad] = useState('media')
  const [editing, setEditing] = useState<WishlistItem | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<Pending>(null)
  const [busy, setBusy] = useState(false)

  const load = () => api.wishlist().then(setItems).catch((e: Error) => setError(e.message))

  useEffect(() => {
    void load()
  }, [])

  function resetForm() {
    setTitulo('')
    setPrecio('')
    setPrioridad('media')
    setEditing(null)
  }

  function openEdit(item: WishlistItem) {
    setEditing(item)
    setTitulo(item.titulo)
    setPrecio(String(item.precio_estimado))
    setPrioridad(item.prioridad)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function onSave(e: FormEvent) {
    e.preventDefault()
    const payload = {
      titulo: titulo.trim(),
      precio_estimado: Number(precio),
      moneda_id: 'USD',
      prioridad,
    }
    if (!payload.titulo || !payload.precio_estimado) {
      setError('Completa título y precio')
      return
    }
    if (editing) {
      setPending({ type: 'save', payload })
      return
    }
    void (async () => {
      setBusy(true)
      try {
        await api.createWishlist({ ...payload, estado: 'deseado' })
        resetForm()
        await load()
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setBusy(false)
      }
    })()
  }

  function pedirEliminar(item: WishlistItem) {
    setPending({ type: 'delete', item })
  }

  async function confirmar() {
    if (!pending) return
    setBusy(true)
    setError(null)
    try {
      if (pending.type === 'save' && editing) {
        await api.updateWishlist(editing.id, pending.payload)
        resetForm()
      }
      if (pending.type === 'delete') {
        await api.deleteWishlist(pending.item.id)
        if (editing?.id === pending.item.id) resetForm()
      }
      setPending(null)
      await load()
    } catch (err) {
      setError((err as Error).message)
      setPending(null)
    } finally {
      setBusy(false)
    }
  }

  async function aportar(id: number) {
    const raw = window.prompt('Monto a aportar (USD)')
    if (!raw) return
    await api.aporteWishlist(id, Number(raw))
    await load()
  }

  async function comprar(id: number) {
    setPending(null)
    if (!window.confirm('¿Registrar compra como gasto y archivar?')) return
    await api.comprarWishlist(id)
    await load()
  }

  const dialogOpen = pending !== null
  const dialogTitle = pending?.type === 'delete' ? 'Eliminar deseo' : 'Guardar cambios'
  const dialogMessage =
    pending?.type === 'delete'
      ? `¿Seguro que quieres eliminar "${pending.item.titulo}"? Esta acción no se puede deshacer.`
      : editing
        ? `¿Guardar los cambios de "${editing.titulo}"?`
        : ''

  return (
    <div className="page space-y-5">
      <header>
        <h1 className="page-title">Wishlist</h1>
        <p className="text-sm text-mist">Metas de ahorro y adquisiciones</p>
      </header>

      {error && <p className="text-sm text-expense">{error}</p>}

      <form onSubmit={onSave} className="native-card space-y-2 p-4">
        <p className="text-sm font-bold">{editing ? 'Editar deseo' : 'Nuevo deseo'}</p>
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Qué quieres comprar"
          className="native-input"
          required
        />
        <div className="form-grid cols-2">
          <input
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            placeholder="Precio estimado"
            inputMode="decimal"
            className="native-input"
            required
          />
          <select
            value={prioridad}
            onChange={(e) => setPrioridad(e.target.value)}
            className="native-input"
          >
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select>
        </div>
        <div className={`grid gap-2 ${editing ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {editing && (
            <button type="button" onClick={resetForm} className="native-btn bg-ink-soft text-mist">
              Cancelar
            </button>
          )}
          <button type="submit" disabled={busy} className="native-btn bg-accent text-ink disabled:opacity-60">
            {editing ? 'Guardar cambios' : 'Agregar deseo'}
          </button>
        </div>
      </form>

      <section className="space-y-2">
        {items.map((item) => (
          <article key={item.id} className="native-card px-3 py-3">
            <div className="row-between">
              <div>
                <p className="truncate font-medium">{item.titulo}</p>
                <p className="text-xs capitalize text-mist">
                  {item.prioridad} · {item.estado.replace('_', ' ')}
                </p>
              </div>
              <p className="money text-sm">{money(item.precio_estimado, item.moneda_id)}</p>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-soft">
              <div className="h-full bg-accent" style={{ width: `${item.progreso_pct}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-mist">
              {money(item.monto_ahorrado, item.moneda_id)} · {item.progreso_pct}%
              {item.meses_estimados != null ? ` · ~${item.meses_estimados} meses` : ''}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => openEdit(item)}
                className="rounded-xl bg-accent-soft py-2 text-xs font-bold text-accent"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => pedirEliminar(item)}
                className="rounded-xl bg-expense-soft py-2 text-xs font-bold text-expense"
              >
                Eliminar
              </button>
              {item.estado !== 'comprado' && item.estado !== 'descartado' && (
                <>
                  <button
                    type="button"
                    onClick={() => void aportar(item.id)}
                    className="rounded-xl bg-ink-soft py-2 text-xs font-bold text-foam"
                  >
                    Aportar
                  </button>
                  <button
                    type="button"
                    onClick={() => void comprar(item.id)}
                    className="rounded-xl bg-income-soft py-2 text-xs font-bold text-income"
                  >
                    Comprar
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
        {items.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line px-3 py-6 text-center text-sm text-mist">
            Sin deseos aún. Agrega el primero arriba.
          </p>
        )}
      </section>

      <ConfirmDialog
        open={dialogOpen}
        title={dialogTitle}
        message={dialogMessage}
        confirmLabel={pending?.type === 'delete' ? 'Sí, eliminar' : 'Sí, guardar'}
        cancelLabel="No"
        danger={pending?.type === 'delete'}
        onCancel={() => !busy && setPending(null)}
        onConfirm={() => void confirmar()}
      />
    </div>
  )
}
