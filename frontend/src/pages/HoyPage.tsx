import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useCachedQuery } from '../lib/cache'
import { money } from '../lib/money'

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
}

const severity = {
  critico: 'border-expense/30 bg-expense-soft text-expense',
  aviso: 'border-warn/30 bg-warn-soft text-warn',
  info: 'border-accent/25 bg-accent-soft text-accent',
} as const

export function HoyPage() {
  const { user } = useAuth()
  const { data, loading, error, fromCache, refreshing } = useCachedQuery('hoy', () => api.hoy(), [])

  if (loading && !data) {
    return <p className="py-10 text-center text-sm font-medium text-mist">Cargando tu día…</p>
  }
  if (error && !data) {
    return (
      <div className="native-card border-expense/30 bg-expense-soft p-4 text-sm text-expense">
        {error}
      </div>
    )
  }
  if (!data) return null

  const bal = data.balance_dia
  const mes = data.balance_mes

  return (
    <div className="page space-y-5">
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">Hoy</p>
        <h1 className="page-title mt-1">{user ? `Hola ${user}` : '¿Qué hay que atender?'}</h1>
        <p className="mt-1 text-sm text-mist">
          Alertas, cobros y foco del día
          {fromCache && refreshing ? ' · actualizando…' : ''}
        </p>
      </section>

      <section className="metric-grid cols-4">
        <Tile label="Liquidez" value={money(data.liquidez.total_usd)} hint={`${data.liquidez.cuentas_activas} cuentas`} />
        <Tile label="Por cobrar" value={money(data.por_cobrar_total)} hint="Clientes" tone="text-income" />
        <Tile label="Hoy" value={money(bal.neto)} tone={Number(bal.neto) >= 0 ? 'text-income' : 'text-expense'} />
        <Tile label="Este mes" value={money(mes.neto)} tone={Number(mes.neto) >= 0 ? 'text-accent' : 'text-expense'} />
      </section>

      <section className="grid grid-cols-3 gap-2">
        <Quick to="/transacciones/nuevo?tipo=gasto" label="Gasto" tone="bg-expense-soft text-expense" />
        <Quick to="/transacciones/nuevo?tipo=ingreso" label="Ingreso" tone="bg-income-soft text-income" />
        <Quick to="/reporte" label="Reporte" tone="bg-accent-soft text-accent" />
      </section>

      <section className="space-y-2">
        <SectionTitle>Te conviene ver</SectionTitle>
        {data.insights.map((i) => (
          <Link key={i.codigo + i.titulo} to={i.accion_url || '/'} className={`block rounded-2xl border px-3.5 py-3.5 ${severity[i.severidad]}`}>
            <p className="text-sm font-bold">{i.titulo}</p>
            <p className="mt-0.5 text-xs opacity-90">{i.detalle}</p>
          </Link>
        ))}
      </section>

      {data.hitos_vencidos.length > 0 && (
        <section className="space-y-2">
          <SectionTitle tone="text-expense">Cobros atrasados</SectionTitle>
          {data.hitos_vencidos.map((h) => (
            <Link key={h.id} to="/proyectos" className="native-card block px-3.5 py-3.5">
              <div className="row-between">
                <div>
                  <p className="truncate font-semibold text-foam">{h.concepto}</p>
                  <p className="text-xs text-mist">{h.proyecto_titulo} · {h.fecha_vencimiento}</p>
                </div>
                <p className="money text-sm text-expense">{money(h.monto, h.moneda_id)}</p>
              </div>
            </Link>
          ))}
        </section>
      )}

      <section className="space-y-2">
        <SectionTitle>Por cobrar hoy</SectionTitle>
        {data.hitos_por_cobrar_hoy.length === 0 ? (
          <Empty text="Nada por cobrar hoy" />
        ) : (
          data.hitos_por_cobrar_hoy.map((h) => (
            <article key={h.id} className="native-card px-3.5 py-3.5">
              <div className="row-between">
                <div>
                  <p className="truncate font-semibold">{h.concepto}</p>
                  <p className="text-xs text-mist">{h.proyecto_titulo}</p>
                </div>
                <p className="money text-sm text-income">{money(h.monto, h.moneda_id)}</p>
              </div>
            </article>
          ))
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <SectionTitle>Agenda</SectionTitle>
          <Link to="/agenda" className="text-xs font-bold text-accent">Abrir</Link>
        </div>
        {data.eventos_del_dia.length === 0 ? (
          <Empty text="Agenda libre" />
        ) : (
          data.eventos_del_dia.map((e) => (
            <article key={e.id} className="native-card flex gap-3 px-3.5 py-3.5">
              <div className="w-14 shrink-0 text-xs font-bold text-accent">{timeLabel(e.fecha_inicio)}</div>
              <div>
                <p className="font-semibold">{e.titulo}</p>
                <p className="text-xs capitalize text-mist">{e.tipo.replace('_', ' ')}</p>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  )
}

function SectionTitle({ children, tone = 'text-mist' }: { children: ReactNode; tone?: string }) {
  return <h2 className={`text-xs font-bold uppercase tracking-[0.12em] ${tone}`}>{children}</h2>
}

function Tile({ label, value, hint, tone = 'text-foam' }: { label: string; value: string; hint?: string; tone?: string }) {
  return (
    <div className="native-card px-3 py-3.5">
      <p className="text-[11px] font-semibold text-mist">{label}</p>
      <p className={`money mt-1 text-[clamp(0.95rem,3.8vw,1.1rem)] ${tone}`}>{value}</p>
      {hint && <p className="mt-0.5 text-[10px] text-mist">{hint}</p>}
    </div>
  )
}

function Quick({ to, label, tone }: { to: string; label: string; tone: string }) {
  return (
    <Link to={to} className={`native-btn flex items-center justify-center ${tone}`}>
      {label}
    </Link>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-line bg-ink-soft/60 px-3 py-5 text-center text-sm text-mist">
      {text}
    </p>
  )
}
