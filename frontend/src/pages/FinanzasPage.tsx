import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Presupuesto } from '../lib/api'
import { money, monthRange } from '../lib/money'
import type { DesgloseCategoria, FlujoCaja, Transaccion } from '../types/api'

export function FinanzasPage() {
  const { inicio, fin } = monthRange()
  const [txs, setTxs] = useState<Transaccion[]>([])
  const [flujo, setFlujo] = useState<FlujoCaja | null>(null)
  const [desglose, setDesglose] = useState<DesgloseCategoria[]>([])
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api.transacciones(`?fecha_inicio=${inicio}&fecha_fin=${fin}&limit=50`),
      api.flujoCaja(inicio, fin),
      api.desgloseGastos(inicio, fin),
      api.presupuestos(),
    ])
      .then(([t, f, d, p]) => {
        setTxs(t)
        setFlujo(f)
        setDesglose(d)
        setPresupuestos(p)
      })
      .catch((e: Error) => setError(e.message))
  }, [inicio, fin])

  return (
    <div className="page space-y-5">
      <header className="page-header">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">Dinero</p>
          <h1 className="page-title">Finanzas</h1>
          <p className="text-sm text-mist">Mes actual · {inicio} → {fin}</p>
        </div>
        <Link to="/transacciones/nuevo?tipo=gasto" className="shrink-0 rounded-2xl bg-accent px-3 py-2 text-sm font-semibold text-ink">
          + Registrar
        </Link>
      </header>

      <div className="chip-scroll">
        <Link to="/cuentas" className="shrink-0 rounded-2xl bg-ink-soft px-3 py-2 text-xs font-semibold text-foam">Cuentas</Link>
        <Link to="/ingresos-fijos" className="shrink-0 rounded-2xl bg-income-soft px-3 py-2 text-xs font-semibold text-income">Ingresos fijos</Link>
        <Link to="/recurrentes" className="shrink-0 rounded-2xl bg-expense-soft px-3 py-2 text-xs font-semibold text-expense">Gastos fijos</Link>
        <Link to="/reporte" className="shrink-0 rounded-2xl bg-accent-soft px-3 py-2 text-xs font-semibold text-accent">Reporte</Link>
      </div>

      {error && <p className="text-sm text-expense">{error}</p>}

      {flujo && (
        <section className="metric-grid cols-3">
          <Tile label="Ingresos" value={money(flujo.ingresos_totales)} tone="text-income" />
          <Tile label="Gastos" value={money(flujo.gastos_totales)} tone="text-expense" />
          <Tile label="Neto" value={money(flujo.balance_neto)} tone="text-accent" />
        </section>
      )}

      {presupuestos.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-mist">Presupuesto del mes</h2>
          {presupuestos.map((p) => (
            <div key={p.id} className="rounded-xl border border-line/80 bg-panel/80 px-3 py-3">
              <div className="flex justify-between text-sm">
                <span>{p.categoria_nombre}</span>
                <span className={p.porcentaje >= 100 ? 'text-expense' : 'text-mist'}>
                  {money(p.gastado)} / {money(p.limite)}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-soft">
                <div
                  className={`h-full ${p.porcentaje >= 100 ? 'bg-expense' : p.porcentaje >= 80 ? 'bg-warn' : 'bg-accent'}`}
                  style={{ width: `${Math.min(p.porcentaje, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-mist">Desglose gastos</h2>
        {desglose.length === 0 ? (
          <Empty text="Sin gastos en el período" />
        ) : (
          desglose.map((d) => (
            <div key={`${d.categoria_id}-${d.nombre}`} className="rounded-xl border border-line/80 bg-panel/80 px-3 py-3">
              <div className="flex justify-between text-sm">
                <span>{d.nombre}</span>
                <span className="text-expense">{money(d.total)}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-soft">
                <div className="h-full bg-expense/80" style={{ width: `${Math.min(d.porcentaje, 100)}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-mist">{d.porcentaje.toFixed(1)}%</p>
            </div>
          ))
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-mist">Libro diario</h2>
        {txs.length === 0 ? (
          <Empty text="Sin transacciones" />
        ) : (
          txs.map((t) => (
            <article key={t.id} className="row-between rounded-xl border border-line/80 bg-panel/80 px-3 py-3">
              <div>
                <p className="truncate font-medium text-foam">{t.nota || t.tipo}</p>
                <p className="text-xs text-mist">
                  {t.fecha_transaccion} · {t.metodo_pago || '—'}
                </p>
              </div>
              <p className={`money text-sm ${t.tipo === 'ingreso' ? 'text-income' : 'text-expense'}`}>
                {t.tipo === 'ingreso' ? '+' : '-'}
                {money(t.monto, t.moneda_id)}
              </p>
            </article>
          ))
        )}
      </section>
    </div>
  )
}

function Tile({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="native-card px-2.5 py-3 sm:px-3">
      <p className="text-[11px] text-mist">{label}</p>
      <p className={`money mt-1 text-sm ${tone}`}>{value}</p>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-line/70 px-3 py-4 text-sm text-mist">{text}</p>
}
