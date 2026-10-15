import { useMemo, useState } from 'react'
import { api } from '../lib/api'
import { useCachedQuery } from '../lib/cache'
import { money } from '../lib/money'

export function ReportePage() {
  const now = new Date()
  const [anio, setAnio] = useState(now.getFullYear())
  const [mes, setMes] = useState(now.getMonth() + 1)

  const key = useMemo(() => `reporte-${anio}-${mes}`, [anio, mes])
  const { data, loading, error, fromCache, refreshing } = useCachedQuery(
    key,
    () => api.reporteMensual(anio, mes),
    [anio, mes],
  )

  return (
    <div className="page space-y-5">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">Cierre</p>
        <h1 className="page-title">Reporte mensual</h1>
        <p className="text-sm text-mist">
          Cuánto cobraste, gastaste y te quedó
          {fromCache && refreshing ? ' · actualizando…' : ''}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className="native-input">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {new Date(2000, m - 1, 1).toLocaleString('es', { month: 'long' })}
            </option>
          ))}
        </select>
        <select value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="native-input">
          {[anio - 1, anio, anio + 1].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {loading && !data && <p className="text-sm text-mist">Calculando…</p>}
      {error && !data && <p className="text-sm text-expense">{error}</p>}

      {data && (
        <>
          <section className="native-card border-accent/20 bg-accent-soft/40 p-4">
            <p className="text-sm font-semibold text-foam">{data.resumen}</p>
          </section>

          <section className="metric-grid">
            <Metric label="Ingresos" value={money(data.ingresos_totales)} tone="text-income" />
            <Metric label="Gastos" value={money(data.gastos_totales)} tone="text-expense" />
            <Metric
              label="Te quedó"
              value={money(data.balance_neto)}
              tone={Number(data.balance_neto) >= 0 ? 'text-accent' : 'text-expense'}
            />
            <Metric label="Liquidez ahora" value={money(data.liquidez_actual)} />
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-mist">Desglose de ingresos</h2>
            <Row label="Cobros de proyectos / comisiones" value={money(data.cobros_proyectos)} tone="text-income" />
            <Row label="Ingresos fijos registrados" value={money(data.ingresos_fijos_registrados)} />
            <Row label="Otros ingresos" value={money(data.ingresos_variables)} />
            <Row label="Ingresos fijos programados /mes" value={money(data.ingresos_fijos_programados)} />
            <Row label="Aún por cobrar (pipeline)" value={money(data.por_cobrar_pendiente)} tone="text-accent" />
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-mist">Desglose de gastos</h2>
            <Row label="Gastos fijos registrados" value={money(data.gastos_fijos_registrados)} tone="text-expense" />
            <Row label="Gastos variables" value={money(data.gastos_variables)} tone="text-expense" />
            <Row label="Gastos fijos programados /mes" value={money(data.gastos_fijos_programados)} />
          </section>

          {data.cobros_detalle.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-mist">Cobros de proyectos del mes</h2>
              {data.cobros_detalle.map((c) => (
                <article key={c.transaccion_id} className="native-card px-3 py-3">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-semibold">{c.concepto}</p>
                      <p className="text-xs text-mist">
                        {c.proyecto || 'Proyecto'} · {c.fecha}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-income">{money(c.monto_usd)}</p>
                  </div>
                </article>
              ))}
            </section>
          )}

          {data.desglose_gastos.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-mist">Gastos por categoría</h2>
              {data.desglose_gastos.map((d) => (
                <div key={d.nombre} className="native-card px-3 py-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">{d.nombre}</span>
                    <span className="text-expense">{money(d.total)}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-soft">
                    <div className="h-full bg-expense" style={{ width: `${Math.min(d.porcentaje, 100)}%` }} />
                  </div>
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}

function Metric({ label, value, tone = 'text-foam' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="native-card px-3 py-3">
      <p className="text-[11px] font-semibold text-mist">{label}</p>
      <p className={`money mt-1 text-sm ${tone}`}>{value}</p>
    </div>
  )
}

function Row({ label, value, tone = 'text-foam' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="native-card row-between items-center px-3 py-3">
      <span className="pr-2 text-sm text-mist">{label}</span>
      <span className={`money text-sm ${tone}`}>{value}</span>
    </div>
  )
}
