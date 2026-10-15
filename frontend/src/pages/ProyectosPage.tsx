import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { cacheInvalidate, useCachedQuery } from '../lib/cache'
import { money } from '../lib/money'
import type { Cliente, Proyecto } from '../types/api'

const ESTADOS = ['propuesta', 'en_proceso', 'pausado', 'entregado', 'finalizado'] as const

export function ProyectosPage() {
  const [filtro, setFiltro] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Proyecto | null>(null)
  const [titulo, setTitulo] = useState('')
  const [presupuesto, setPresupuesto] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [estado, setEstado] = useState<string>('propuesta')

  const {
    data: bundle,
    loading,
    refreshing,
    error,
    fromCache,
    reload,
  } = useCachedQuery(
    'proyectos-bundle',
    async () => {
      const [proyectos, clientes] = await Promise.all([api.proyectos(), api.clientes()])
      return { proyectos, clientes }
    },
    [],
  )

  const proyectos = bundle?.proyectos ?? []
  const clientes = bundle?.clientes ?? []

  const filtered = useMemo(
    () => (filtro ? proyectos.filter((p) => p.estado === filtro) : proyectos),
    [proyectos, filtro],
  )

  function openCreate() {
    setEditing(null)
    setTitulo('')
    setPresupuesto('')
    setClienteId('')
    setEstado('propuesta')
    setShowForm(true)
  }

  function openEdit(p: Proyecto) {
    setEditing(p)
    setTitulo(p.titulo)
    setPresupuesto(String(p.presupuesto_total))
    setClienteId(p.cliente_id ? String(p.cliente_id) : '')
    setEstado(p.estado)
    setShowForm(true)
  }

  async function onSave(e: FormEvent) {
    e.preventDefault()
    const amount = Number(presupuesto)
    if (!titulo || !amount) return
    const payload = {
      titulo,
      presupuesto_total: amount,
      moneda_id: 'USD',
      cliente_id: clienteId ? Number(clienteId) : null,
      estado,
    }
    if (editing) await api.updateProyecto(editing.id, payload)
    else await api.createProyecto({ ...payload, estado: 'propuesta' })
    await cacheInvalidate('proyectos')
    await cacheInvalidate('hoy')
    setShowForm(false)
    setEditing(null)
    await reload()
  }

  async function onDelete(p: Proyecto) {
    if (!window.confirm(`¿Eliminar "${p.titulo}" y sus hitos?`)) return
    await api.deleteProyecto(p.id)
    await cacheInvalidate('proyectos')
    await cacheInvalidate('hoy')
    await reload()
  }

  async function addClienteQuick() {
    const nombre = window.prompt('Nombre del cliente')
    if (!nombre) return
    await api.createCliente({ nombre })
    await cacheInvalidate('proyectos')
    await reload()
  }

  return (
    <div className="page space-y-5">
      <header className="page-header">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">Trabajo</p>
          <h1 className="page-title">Proyectos</h1>
          <p className="text-sm text-mist">
            Pipeline y cobranzas
            {fromCache && refreshing ? ' · actualizando…' : ''}
          </p>
        </div>
        <button type="button" onClick={openCreate} className="shrink-0 rounded-2xl bg-accent px-3 py-2 text-sm font-semibold text-ink">
          + Nuevo
        </button>
      </header>

      {error && !bundle && <p className="text-sm text-expense">{error}</p>}
      {loading && !bundle && <p className="text-sm text-mist">Cargando…</p>}

      {showForm && (
        <form onSubmit={onSave} className="native-card space-y-2 p-4">
          <p className="text-sm font-bold">{editing ? 'Editar proyecto' : 'Nuevo proyecto'}</p>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título"
            className="native-input"
            required
          />
          <input
            value={presupuesto}
            onChange={(e) => setPresupuesto(e.target.value)}
            placeholder="Presupuesto / comisión total USD"
            inputMode="decimal"
            className="native-input"
            required
          />
          <div className="flex gap-2">
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="native-input flex-1"
            >
              <option value="">Sin cliente</option>
              {clientes.map((c: Cliente) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => void addClienteQuick()} className="rounded-2xl bg-ink-soft px-3 text-xs font-semibold text-accent">
              + Cliente
            </button>
          </div>
          {editing && (
            <select value={estado} onChange={(e) => setEstado(e.target.value)} className="native-input">
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {e.replace('_', ' ')}
                </option>
              ))}
            </select>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="native-btn bg-ink-soft text-mist">
              Cancelar
            </button>
            <button type="submit" className="native-btn bg-accent text-ink">
              Guardar
            </button>
          </div>
        </form>
      )}

      <div className="chip-scroll">
        <Chip active={!filtro} onClick={() => setFiltro('')} label="Todos" />
        {ESTADOS.map((e) => (
          <Chip key={e} active={filtro === e} onClick={() => setFiltro(e)} label={e.replace('_', ' ')} />
        ))}
      </div>

      <section className="space-y-2">
        {filtered.map((p) => (
          <article key={p.id} className="native-card px-3 py-3">
            <Link to={`/proyectos/${p.id}`} className="block">
              <div className="row-between">
                <div>
                  <p className="truncate font-semibold text-foam">{p.titulo}</p>
                  <p className="text-xs capitalize text-mist">
                    {p.estado.replace('_', ' ')}
                    {p.cliente_nombre ? ` · ${p.cliente_nombre}` : ''}
                  </p>
                </div>
                <div className="shrink-0 text-right text-sm">
                  <p className="money text-accent">{money(p.presupuesto_total, p.moneda_id)}</p>
                  <p className="text-xs text-mist">Pend. {money(p.pendiente, p.moneda_id)}</p>
                </div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-soft">
                <div
                  className="h-full bg-income"
                  style={{
                    width: `${Math.min(100, (Number(p.cobrado) / Math.max(Number(p.presupuesto_total), 1)) * 100)}%`,
                  }}
                />
              </div>
            </Link>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => openEdit(p)} className="rounded-xl bg-accent-soft py-2 text-xs font-bold text-accent">
                Editar
              </button>
              <button type="button" onClick={() => void onDelete(p)} className="rounded-xl bg-expense-soft py-2 text-xs font-bold text-expense">
                Eliminar
              </button>
            </div>
          </article>
        ))}
        {!loading && filtered.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line px-3 py-6 text-center text-sm text-mist">
            Sin proyectos. Toca + Nuevo.
          </p>
        )}
      </section>
    </div>
  )
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-2xl px-3 py-2 text-xs font-semibold capitalize ${
        active ? 'bg-accent text-ink' : 'bg-ink-soft text-mist'
      }`}
    >
      {label}
    </button>
  )
}
