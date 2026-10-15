import { useEffect, useState } from 'react'
import { fetchVistaHoy } from '../lib/api'
import type { VistaHoy } from '../types/api'

function money(value: string | number, currency = 'USD') {
  const n = typeof value === 'string' ? Number(value) : value
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0)
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
}

export function HoyPage() {
  const [data, setData] = useState<VistaHoy | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetchVistaHoy()
      .then((res) => {
        if (alive) {
          setData(res)
          setError(null)
        }
      })
      .catch((err: Error) => {
        if (alive) setError(err.message || 'No se pudo cargar la vista de hoy')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  if (loading) {
    return <p className="text-sm text-mist">Cargando consola matutina…</p>
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-expense/40 bg-expense/10 p-4 text-sm text-expense">
        {error || 'Sin datos'}
        <p className="mt-2 text-mist">Asegúrate de que la API esté en :8000</p>
      </div>
    )
  }

  const { balance_dia: bal } = data

  return (
    <div className="space-y-5">
      <section>
        <h1 className="font-display text-2xl font-semibold text-white">Vista Hoy</h1>
        <p className="mt-1 text-sm text-mist">Agenda, cobros del día y saldo circulante.</p>
      </section>

      <section className="grid grid-cols-3 gap-2">
        <BalanceTile label="Ingresos" value={money(bal.ingresos)} tone="text-income" />
        <BalanceTile label="Gastos" value={money(bal.gastos)} tone="text-expense" />
        <BalanceTile label="Neto" value={money(bal.neto)} tone="text-accent" />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-mist">Por cobrar hoy</h2>
        {data.hitos_por_cobrar_hoy.length === 0 ? (
          <EmptyRow text="Sin hitos de cobro para hoy" />
        ) : (
          data.hitos_por_cobrar_hoy.map((h) => (
            <article
              key={h.id}
              className="rounded-xl border border-line/80 bg-panel/80 px-3 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foam">{h.concepto}</p>
                  <p className="text-xs text-mist">{h.proyecto_titulo}</p>
                </div>
                <p className="text-sm font-semibold text-income">
                  {money(h.monto, h.moneda_id)}
                </p>
              </div>
            </article>
          ))
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-mist">
          Tareas críticas
        </h2>
        {data.tareas_pendientes.length === 0 ? (
          <EmptyRow text="No hay tareas pendientes" />
        ) : (
          data.tareas_pendientes.map((t) => (
            <article
              key={t.id}
              className="flex items-center justify-between rounded-xl border border-line/80 bg-panel/80 px-3 py-3"
            >
              <div>
                <p className="font-medium text-foam">{t.titulo}</p>
                <p className="text-xs capitalize text-mist">
                  {t.prioridad} · {timeLabel(t.fecha_inicio)}
                </p>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            </article>
          ))
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-mist">Agenda</h2>
        {data.eventos_del_dia.length === 0 ? (
          <EmptyRow text="Agenda libre" />
        ) : (
          data.eventos_del_dia.map((e) => (
            <article
              key={e.id}
              className="flex gap-3 rounded-xl border border-line/80 bg-panel/80 px-3 py-3"
            >
              <div className="w-14 shrink-0 text-xs font-medium text-accent">
                {timeLabel(e.fecha_inicio)}
              </div>
              <div>
                <p className="font-medium text-foam">{e.titulo}</p>
                <p className="text-xs capitalize text-mist">{e.tipo.replace('_', ' ')}</p>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  )
}

function BalanceTile({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: string
}) {
  return (
    <div className="rounded-xl border border-line/80 bg-panel/90 px-2.5 py-3">
      <p className="text-[11px] text-mist">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${tone}`}>{value}</p>
    </div>
  )
}

function EmptyRow({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-line/70 px-3 py-4 text-sm text-mist">
      {text}
    </p>
  )
}
