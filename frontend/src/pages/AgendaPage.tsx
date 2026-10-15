import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../lib/api'
import type { AgendaEvento } from '../types/api'

export function AgendaPage() {
  const today = new Date().toISOString().slice(0, 10)
  const [fecha, setFecha] = useState(today)
  const [eventos, setEventos] = useState<AgendaEvento[]>([])
  const [titulo, setTitulo] = useState('')
  const [hora, setHora] = useState('09:00')
  const [tipo, setTipo] = useState('tarea')
  const [error, setError] = useState<string | null>(null)

  const load = () =>
    api.agenda(fecha).then(setEventos).catch((e: Error) => setError(e.message))

  useEffect(() => {
    void load()
  }, [fecha])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    await api.createAgenda({
      titulo,
      tipo,
      prioridad: 'media',
      fecha_inicio: `${fecha}T${hora}:00`,
    })
    setTitulo('')
    await load()
  }

  async function toggle(ev: AgendaEvento) {
    await api.updateAgenda(ev.id, { completado: !ev.completado })
    await load()
  }

  async function snooze(id: number, minutos: number) {
    await api.snooze(id, minutos)
    await load()
  }

  return (
    <div className="page space-y-5">
      <header>
        <h1 className="page-title">Agenda</h1>
        <p className="text-sm text-mist">Tareas, reuniones y recordatorios</p>
      </header>

      <input
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        className="rounded-lg border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
      />

      {error && <p className="text-sm text-expense">{error}</p>}

      <form onSubmit={onCreate} className="space-y-2 rounded-2xl border border-line/80 bg-panel/80 p-4">
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Nuevo evento"
          className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-accent"
          required
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="tarea">Tarea</option>
            <option value="reunion">Reunión</option>
            <option value="recordatorio_pago">Recordatorio pago</option>
            <option value="evento_personal">Personal</option>
          </select>
        </div>
        <button type="submit" className="w-full rounded-lg bg-accent py-2 text-sm font-semibold text-ink">
          Agregar
        </button>
      </form>

      <section className="space-y-2">
        {eventos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line/70 px-3 py-4 text-sm text-mist">
            Sin eventos este día
          </p>
        ) : (
          eventos.map((ev) => (
            <article
              key={ev.id}
              className={`rounded-xl border border-line/80 bg-panel/80 px-3 py-3 ${
                ev.completado ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{ev.titulo}</p>
                  <p className="text-xs capitalize text-mist">
                    {ev.tipo.replace('_', ' ')} ·{' '}
                    {new Date(ev.fecha_inicio).toLocaleTimeString('es-VE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void toggle(ev)}
                  className="text-xs text-accent"
                >
                  {ev.completado ? 'Reabrir' : 'Completar'}
                </button>
              </div>
              {!ev.completado && (
                <div className="mt-2 flex gap-2">
                  {[15, 30, 60].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => void snooze(ev.id, m)}
                      className="rounded-lg bg-ink-soft px-2 py-1 text-[11px] text-mist"
                    >
                      +{m}m
                    </button>
                  ))}
                </div>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  )
}
