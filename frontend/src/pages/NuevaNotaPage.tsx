import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { enqueueMutation, flushQueue } from '../lib/offlineQueue'

export function NuevaNotaPage() {
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const [etiquetas, setEtiquetas] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const navigate = useNavigate()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!contenido.trim()) {
      setStatus('Escribe el contenido de la nota')
      return
    }

    const payload = {
      uuid_sync: crypto.randomUUID(),
      titulo: titulo || undefined,
      contenido,
      etiquetas: etiquetas || undefined,
    }

    try {
      if (!navigator.onLine) {
        await enqueueMutation({ entity: 'nota', payload })
        setStatus('Nota en cola offline')
      } else {
        await api.createNota(payload)
        await flushQueue()
        setStatus('Nota guardada')
      }
      setTimeout(() => navigate('/bitacora'), 400)
    } catch (err) {
      await enqueueMutation({ entity: 'nota', payload })
      setStatus(`Guardado local: ${(err as Error).message}`)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Link to="/bitacora" className="text-sm text-accent">
        ← Volver
      </Link>
      <h1 className="page-title">Nota rápida</h1>
      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-line/80 bg-panel/80 p-4">
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título (opcional)"
          className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-foam outline-none focus:border-accent"
        />
        <textarea
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          placeholder="Idea, referencia bancaria, nota de reunión…"
          rows={5}
          autoFocus
          className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-foam outline-none focus:border-accent"
        />
        <input
          value={etiquetas}
          onChange={(e) => setEtiquetas(e.target.value)}
          placeholder="#ideas #pagos"
          className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-foam outline-none focus:border-accent"
        />
        <button type="submit" className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-ink">
          Guardar nota
        </button>
        {status && <p className="text-xs text-mist">{status}</p>}
      </form>
    </div>
  )
}
