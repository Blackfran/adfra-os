import { useState, type FormEvent } from 'react'
import { api, type IngresoFijo } from '../lib/api'
import { cacheInvalidate, useCachedQuery } from '../lib/cache'
import { money } from '../lib/money'

export function IngresosFijosPage() {
  const [nombre, setNombre] = useState('')
  const [monto, setMonto] = useState('')
  const [dia, setDia] = useState('1')
  const [edit, setEdit] = useState<IngresoFijo | null>(null)

  const { data, loading, error, fromCache, refreshing, reload } = useCachedQuery(
    'ingresos-fijos',
    () => api.ingresosFijos(),
    [],
  )
  const items = data ?? []

  async function onSave(e: FormEvent) {
    e.preventDefault()
    const payload = { nombre, monto: Number(monto), moneda_id: 'USD', dia_cobro: Number(dia) }
    if (edit) await api.updateIngresoFijo(edit.id, payload)
    else await api.createIngresoFijo(payload)
    setNombre('')
    setMonto('')
    setEdit(null)
    await cacheInvalidate('ingresos')
    await cacheInvalidate('hoy')
    await reload()
  }

  async function cobrar(id: number) {
    if (!window.confirm('¿Registrar este ingreso fijo hoy?')) return
    await api.cobrarIngresoFijo(id)
    await cacheInvalidate('')
    await reload()
  }

  async function remove(id: number) {
    if (!window.confirm('¿Eliminar ingreso fijo?')) return
    await api.deleteIngresoFijo(id)
    await cacheInvalidate('ingresos')
    await reload()
  }

  function startEdit(item: IngresoFijo) {
    setEdit(item)
    setNombre(item.nombre)
    setMonto(String(item.monto))
    setDia(String(item.dia_cobro))
  }

  const mensuales = items.filter((i) => i.activo).reduce((a, i) => a + Number(i.monto), 0)

  return (
    <div className="page space-y-5">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-income">Ingresos</p>
        <h1 className="page-title">Ingresos fijos</h1>
        <p className="text-sm text-mist">
          Retainers / salarios · ~{money(mensuales)}/mes
          {fromCache && refreshing ? ' · actualizando…' : ''}
        </p>
      </header>

      {error && !items.length && <p className="text-sm text-expense">{error}</p>}
      {loading && !items.length && <p className="text-sm text-mist">Cargando…</p>}

      <form onSubmit={onSave} className="native-card space-y-2 p-4">
        <p className="text-sm font-bold">{edit ? 'Editar' : 'Agregar ingreso fijo'}</p>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Retainer, salario…" className="native-input" required />
        <div className="grid grid-cols-2 gap-2">
          <input value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="Monto USD" inputMode="decimal" className="native-input" required />
          <input value={dia} onChange={(e) => setDia(e.target.value)} placeholder="Día (1-28)" inputMode="numeric" className="native-input" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {edit && (
            <button type="button" onClick={() => { setEdit(null); setNombre(''); setMonto('') }} className="native-btn bg-ink-soft text-mist">
              Cancelar
            </button>
          )}
          <button type="submit" className={`native-btn bg-income text-ink ${edit ? '' : 'col-span-2'}`}>
            Guardar
          </button>
        </div>
      </form>

      <section className="space-y-2">
        {items.map((r) => (
          <article key={r.id} className="native-card px-3 py-3">
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-semibold">{r.nombre}</p>
                <p className="text-xs text-mist">
                  Día {r.dia_cobro} · próximo {r.proximo_cobro}
                </p>
              </div>
              <p className="text-sm font-bold text-income">{money(r.monto, r.moneda_id)}</p>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <button type="button" onClick={() => void cobrar(r.id)} className="rounded-xl bg-income-soft py-2 text-[11px] font-bold text-income">
                Cobrar
              </button>
              <button type="button" onClick={() => startEdit(r)} className="rounded-xl bg-accent-soft py-2 text-[11px] font-bold text-accent">
                Editar
              </button>
              <button type="button" onClick={() => void remove(r.id)} className="rounded-xl bg-expense-soft py-2 text-[11px] font-bold text-expense">
                Borrar
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
