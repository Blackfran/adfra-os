import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, createTransaccion } from '../lib/api'
import { cacheInvalidate } from '../lib/cache'
import { enqueueMutation, flushQueue } from '../lib/offlineQueue'
import type { Categoria } from '../types/api'

export function NuevaTransaccionPage() {
  const [params] = useSearchParams()
  const tipoParam = params.get('tipo') === 'ingreso' ? 'ingreso' : 'gasto'
  const [tipo, setTipo] = useState<'ingreso' | 'gasto'>(tipoParam)
  const [monto, setMonto] = useState('')
  const [nota, setNota] = useState('')
  const [moneda, setMoneda] = useState('USD')
  const [categoriaId, setCategoriaId] = useState<number | ''>('')
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api.categorias().then(setCategorias).catch(() => undefined)
  }, [])

  const cats = useMemo(() => categorias.filter((c) => c.tipo === tipo), [categorias, tipo])
  const title = useMemo(() => (tipo === 'gasto' ? 'Registrar gasto' : 'Registrar ingreso'), [tipo])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const amount = Number(monto)
    if (!amount || amount <= 0) {
      setStatus('Ingresa un monto válido')
      return
    }

    const payload = {
      uuid_sync: crypto.randomUUID(),
      tipo,
      monto: amount,
      moneda_id: moneda,
      tasa_cambio: 1,
      nota: nota || undefined,
      fecha_transaccion: new Date().toISOString().slice(0, 10),
      categoria_id: categoriaId === '' ? null : Number(categoriaId),
    }

    setSaving(true)
    setStatus(null)
    try {
      if (!navigator.onLine) {
        await enqueueMutation({ entity: 'transaccion', payload })
        setStatus('Guardado offline — se sincronizará al recuperar red')
      } else {
        await createTransaccion(payload)
        await flushQueue()
        await cacheInvalidate('')
        setStatus('Transacción registrada')
      }
      setTimeout(() => navigate('/finanzas'), 500)
    } catch (err) {
      await enqueueMutation({ entity: 'transaccion', payload })
      setStatus(`Cola local: ${(err as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Link to="/finanzas" className="text-sm text-accent">
        ← Volver
      </Link>
      <h1 className="page-title">{title}</h1>

      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-line/80 bg-panel/80 p-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTipo('gasto')}
            className={`rounded-lg py-2 text-sm font-medium ${
              tipo === 'gasto' ? 'bg-expense text-ink' : 'bg-ink-soft text-mist'
            }`}
          >
            Gasto
          </button>
          <button
            type="button"
            onClick={() => setTipo('ingreso')}
            className={`rounded-lg py-2 text-sm font-medium ${
              tipo === 'ingreso' ? 'bg-income text-ink' : 'bg-ink-soft text-mist'
            }`}
          >
            Ingreso
          </button>
        </div>

        <label className="block text-sm">
          <span className="text-mist">Monto</span>
          <input
            inputMode="decimal"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-foam outline-none focus:border-accent"
            placeholder="0.00"
            autoFocus
          />
        </label>

        <label className="block text-sm">
          <span className="text-mist">Categoría</span>
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value ? Number(e.target.value) : '')}
            className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-foam outline-none focus:border-accent"
          >
            <option value="">Sin categoría</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-mist">Moneda</span>
          <select
            value={moneda}
            onChange={(e) => setMoneda(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-foam outline-none focus:border-accent"
          >
            <option value="USD">USD</option>
            <option value="VES">VES</option>
            <option value="EUR">EUR</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-mist">Nota</span>
          <input
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2 text-foam outline-none focus:border-accent"
            placeholder="Descripción breve"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-ink disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
        {status && <p className="text-xs text-mist">{status}</p>}
      </form>
    </div>
  )
}
