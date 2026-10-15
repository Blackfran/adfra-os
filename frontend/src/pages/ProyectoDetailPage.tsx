import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { cacheInvalidate, useCachedQuery } from '../lib/cache'
import { money } from '../lib/money'
import type { Hito } from '../types/api'

export function ProyectoDetailPage() {
  const { id } = useParams()
  const proyectoId = Number(id)
  const navigate = useNavigate()
  const [concepto, setConcepto] = useState('')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [msg, setMsg] = useState<string | null>(null)
  const [editHito, setEditHito] = useState<Hito | null>(null)

  const { data, loading, error, fromCache, refreshing, reload } = useCachedQuery(
    `proyecto-${proyectoId}`,
    async () => {
      const [lista, hitos] = await Promise.all([api.proyectos(), api.hitos(proyectoId)])
      const proyecto = lista.find((p) => p.id === proyectoId) || null
      return { proyecto, hitos }
    },
    [proyectoId],
  )

  const proyecto = data?.proyecto ?? null
  const hitos = data?.hitos ?? []

  async function addOrUpdateHito(e: FormEvent) {
    e.preventDefault()
    if (editHito) {
      await api.updateHito(editHito.id, {
        concepto,
        monto: Number(monto),
        fecha_vencimiento: fecha,
      })
    } else {
      await api.createHito(proyectoId, {
        concepto,
        monto: Number(monto),
        fecha_vencimiento: fecha,
      })
    }
    setConcepto('')
    setMonto('')
    setEditHito(null)
    await cacheInvalidate('proyecto')
    await cacheInvalidate('proyectos')
    await reload()
  }

  async function liquidar(hitoId: number) {
    await api.liquidarHito(hitoId, { metodo_pago: 'Transferencia' })
    setMsg('Hito cobrado · ingreso sumado a finanzas')
    await cacheInvalidate('')
    await reload()
  }

  async function startEdit(h: Hito) {
    setEditHito(h)
    setConcepto(h.concepto)
    setMonto(String(h.monto))
    setFecha(h.fecha_vencimiento)
  }

  async function removeHito(h: Hito) {
    if (!window.confirm(`¿Eliminar hito "${h.concepto}"?`)) return
    await api.deleteHito(h.id)
    await cacheInvalidate('proyecto')
    await reload()
  }

  async function setEstado(estado: string) {
    await api.updateProyecto(proyectoId, { estado })
    await cacheInvalidate('proyecto')
    await cacheInvalidate('proyectos')
    await reload()
  }

  async function deleteProject() {
    if (!proyecto || !window.confirm(`¿Eliminar "${proyecto.titulo}"?`)) return
    await api.deleteProyecto(proyectoId)
    await cacheInvalidate('')
    navigate('/proyectos')
  }

  if (loading && !proyecto) return <p className="text-sm text-mist">Cargando…</p>
  if (error && !proyecto) return <p className="text-sm text-expense">{error}</p>
  if (!proyecto) return <p className="text-sm text-mist">Proyecto no encontrado</p>

  return (
    <div className="page space-y-5">
      <Link to="/proyectos" className="text-sm font-semibold text-accent">
        ← Trabajo
      </Link>
      <header>
        <h1 className="page-title">{proyecto.titulo}</h1>
        <p className="text-sm text-mist">
          {proyecto.cliente_nombre || 'Sin cliente'} · {money(proyecto.presupuesto_total, proyecto.moneda_id)}
          {fromCache && refreshing ? ' · actualizando…' : ''}
        </p>
      </header>

      {msg && <p className="text-xs font-semibold text-income">{msg}</p>}

      <div className="flex flex-wrap gap-2">
        {['propuesta', 'en_proceso', 'pausado', 'entregado', 'finalizado'].map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => void setEstado(e)}
            className={`rounded-2xl px-2.5 py-1.5 text-xs font-semibold capitalize ${
              proyecto.estado === e ? 'bg-accent text-ink' : 'bg-ink-soft text-mist'
            }`}
          >
            {e.replace('_', ' ')}
          </button>
        ))}
      </div>

      <section className="grid grid-cols-2 gap-2">
        <Stat label="Cobrado / comisión" value={money(proyecto.cobrado, proyecto.moneda_id)} />
        <Stat label="Pendiente" value={money(proyecto.pendiente, proyecto.moneda_id)} />
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-mist">Hitos de cobro</h2>
        {hitos.map((h) => (
          <article key={h.id} className="native-card px-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{h.concepto}</p>
                <p className="text-xs capitalize text-mist">
                  {h.estado} · vence {h.fecha_vencimiento}
                </p>
              </div>
              <p className="text-sm font-bold text-income">{money(h.monto, proyecto.moneda_id)}</p>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {h.estado !== 'cobrado' && (
                <button type="button" onClick={() => void liquidar(h.id)} className="rounded-xl bg-income-soft py-2 text-[11px] font-bold text-income">
                  Cobrar
                </button>
              )}
              <button type="button" onClick={() => void startEdit(h)} className="rounded-xl bg-accent-soft py-2 text-[11px] font-bold text-accent">
                Editar
              </button>
              {h.estado !== 'cobrado' && (
                <button type="button" onClick={() => void removeHito(h)} className="rounded-xl bg-expense-soft py-2 text-[11px] font-bold text-expense">
                  Borrar
                </button>
              )}
            </div>
          </article>
        ))}
      </section>

      <form onSubmit={addOrUpdateHito} className="native-card space-y-2 p-4">
        <p className="text-sm font-bold">{editHito ? 'Editar hito' : 'Nuevo hito / cuota'}</p>
        <input value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Concepto" className="native-input" required />
        <div className="grid grid-cols-2 gap-2">
          <input value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="Monto" inputMode="decimal" className="native-input" required />
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="native-input" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {editHito && (
            <button type="button" onClick={() => { setEditHito(null); setConcepto(''); setMonto('') }} className="native-btn bg-ink-soft text-mist">
              Cancelar
            </button>
          )}
          <button type="submit" className={`native-btn bg-accent text-ink ${editHito ? '' : 'col-span-2'}`}>
            {editHito ? 'Guardar hito' : 'Agregar hito'}
          </button>
        </div>
      </form>

      <button type="button" onClick={() => void deleteProject()} className="native-btn w-full bg-expense-soft text-expense">
        Eliminar proyecto
      </button>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="native-card px-3 py-3">
      <p className="text-[11px] font-semibold text-mist">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  )
}
