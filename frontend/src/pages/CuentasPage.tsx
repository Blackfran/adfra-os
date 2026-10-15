import { useState, type FormEvent } from 'react'
import { api, type Cuenta } from '../lib/api'
import { cacheInvalidate, useCachedQuery } from '../lib/cache'
import { money } from '../lib/money'

const emptyForm = {
  nombre: '',
  saldo: '',
  tipo: 'banco',
  moneda: 'USD',
  banco: '',
  numero_cuenta: '',
  tipo_cuenta: 'ahorro',
  titular: '',
  documento_id: '',
  telefono_pago: '',
  email_pago: '',
}

export function CuentasPage() {
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<Cuenta | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const { data, loading, error, fromCache, refreshing, reload } = useCachedQuery(
    'cuentas',
    () => api.cuentas(),
    [],
  )
  const items = data ?? []
  const totalUsd = items.reduce((a, c) => a + Number(c.saldo_usd || 0), 0)

  function setField(key: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(c: Cuenta) {
    setEditing(c)
    setForm({
      nombre: c.nombre,
      saldo: String(c.saldo),
      tipo: c.tipo,
      moneda: c.moneda_id,
      banco: c.banco || '',
      numero_cuenta: c.numero_cuenta || '',
      tipo_cuenta: c.tipo_cuenta || 'ahorro',
      titular: c.titular || '',
      documento_id: c.documento_id || '',
      telefono_pago: c.telefono_pago || '',
      email_pago: c.email_pago || '',
    })
    setShowForm(true)
  }

  async function onSave(e: FormEvent) {
    e.preventDefault()
    const payload = {
      nombre: form.nombre,
      tipo: form.tipo,
      moneda_id: form.moneda,
      saldo: Number(form.saldo || 0),
      banco: form.banco || null,
      numero_cuenta: form.numero_cuenta || null,
      tipo_cuenta: form.tipo_cuenta || null,
      titular: form.titular || null,
      documento_id: form.documento_id || null,
      telefono_pago: form.telefono_pago || null,
      email_pago: form.email_pago || null,
    }
    if (editing) await api.updateCuenta(editing.id, payload)
    else await api.createCuenta(payload)
    setShowForm(false)
    setEditing(null)
    setForm(emptyForm)
    await cacheInvalidate('cuentas')
    await cacheInvalidate('hoy')
    await reload()
  }

  async function ajustar(id: number, actual: string | number) {
    const raw = window.prompt('Nuevo saldo', String(actual))
    if (raw == null) return
    await api.ajustarCuenta(id, Number(raw), 'Ajuste manual')
    await cacheInvalidate('cuentas')
    await reload()
  }

  async function remove(c: Cuenta) {
    if (!window.confirm(`¿Eliminar cuenta "${c.nombre}"?`)) return
    await api.deleteCuenta(c.id)
    await cacheInvalidate('cuentas')
    await reload()
  }

  async function copyText(label: string, value: string) {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(label)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      window.prompt('Copia manualmente:', value)
    }
  }

  function paymentBlock(c: Cuenta) {
    return [
      c.banco && `Banco: ${c.banco}`,
      c.tipo_cuenta && `Tipo: ${c.tipo_cuenta}`,
      c.numero_cuenta && `Cuenta: ${c.numero_cuenta}`,
      c.titular && `Titular: ${c.titular}`,
      c.documento_id && `Documento: ${c.documento_id}`,
      c.telefono_pago && `Pago móvil: ${c.telefono_pago}`,
      c.email_pago && `Email: ${c.email_pago}`,
      `Moneda: ${c.moneda_id}`,
    ]
      .filter(Boolean)
      .join('\n')
  }

  return (
    <div className="page space-y-5">
      <header className="page-header">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">Dinero</p>
          <h1 className="page-title">Cuentas</h1>
          <p className="text-sm text-mist">
            Liquidez {money(totalUsd)}
            {fromCache && refreshing ? ' · actualizando…' : ''}
          </p>
        </div>
        <button type="button" onClick={openCreate} className="shrink-0 rounded-2xl bg-accent px-3 py-2 text-sm font-semibold text-ink">
          + Nueva
        </button>
      </header>

      {copied && (
        <p className="rounded-2xl bg-income-soft px-3 py-2 text-xs font-semibold text-income">
          Copiado: {copied}
        </p>
      )}
      {error && !items.length && <p className="text-sm text-expense">{error}</p>}
      {loading && !items.length && <p className="text-sm text-mist">Cargando…</p>}

      {showForm && (
        <form onSubmit={onSave} className="native-card space-y-2 p-4">
          <p className="text-sm font-bold">{editing ? 'Editar cuenta' : 'Nueva cuenta'}</p>
          <input
            value={form.nombre}
            onChange={(e) => setField('nombre', e.target.value)}
            placeholder="Alias (Banesco USD, Zinli…)"
            className="native-input"
            required
          />
          <div className="form-grid cols-3">
            <input
              value={form.saldo}
              onChange={(e) => setField('saldo', e.target.value)}
              placeholder="Saldo"
              inputMode="decimal"
              className="native-input"
            />
            <select value={form.tipo} onChange={(e) => setField('tipo', e.target.value)} className="native-input">
              <option value="banco">Banco</option>
              <option value="billetera">Billetera</option>
              <option value="efectivo">Efectivo</option>
              <option value="crypto">Crypto</option>
            </select>
            <select value={form.moneda} onChange={(e) => setField('moneda', e.target.value)} className="native-input">
              <option value="USD">USD</option>
              <option value="VES">VES</option>
              <option value="EUR">EUR</option>
            </select>
          </div>

          <p className="pt-1 text-xs font-bold uppercase tracking-[0.12em] text-mist">Datos para transferir</p>
          <input
            value={form.banco}
            onChange={(e) => setField('banco', e.target.value)}
            placeholder="Banco / plataforma"
            className="native-input"
          />
          <input
            value={form.numero_cuenta}
            onChange={(e) => setField('numero_cuenta', e.target.value)}
            placeholder="Número de cuenta"
            className="native-input"
            inputMode="numeric"
          />
          <select
            value={form.tipo_cuenta}
            onChange={(e) => setField('tipo_cuenta', e.target.value)}
            className="native-input"
          >
            <option value="ahorro">Ahorro</option>
            <option value="corriente">Corriente</option>
            <option value="digital">Digital / billetera</option>
            <option value="otro">Otro</option>
          </select>
          <input
            value={form.titular}
            onChange={(e) => setField('titular', e.target.value)}
            placeholder="Titular"
            className="native-input"
          />
          <input
            value={form.documento_id}
            onChange={(e) => setField('documento_id', e.target.value)}
            placeholder="Cédula / RIF"
            className="native-input"
          />
          <input
            value={form.telefono_pago}
            onChange={(e) => setField('telefono_pago', e.target.value)}
            placeholder="Teléfono pago móvil"
            className="native-input"
            inputMode="tel"
          />
          <input
            value={form.email_pago}
            onChange={(e) => setField('email_pago', e.target.value)}
            placeholder="Email de pago"
            className="native-input"
            inputMode="email"
          />

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

      <section className="space-y-3">
        {items.map((c) => {
          const fields = [
            { label: 'Banco', value: c.banco },
            { label: 'Nº cuenta', value: c.numero_cuenta },
            { label: 'Tipo', value: c.tipo_cuenta },
            { label: 'Titular', value: c.titular },
            { label: 'Documento', value: c.documento_id },
            { label: 'Pago móvil', value: c.telefono_pago },
            { label: 'Email', value: c.email_pago },
          ].filter((f) => f.value)

          return (
            <article key={c.id} className="native-card px-3 py-3">
              <div className="row-between">
                <div>
                  <p className="truncate font-semibold">{c.nombre}</p>
                  <p className="text-xs capitalize text-mist">
                    {c.tipo} · ≈ {money(c.saldo_usd)}
                  </p>
                </div>
                <p className="money text-sm text-accent">{money(c.saldo, c.moneda_id)}</p>
              </div>

              {fields.length > 0 ? (
                <div className="mt-3 space-y-1.5">
                  {fields.map((f) => (
                    <div
                      key={f.label}
                      className="flex items-center justify-between gap-2 rounded-xl bg-ink-soft px-2.5 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-mist">{f.label}</p>
                        <p className="truncate text-sm font-semibold text-foam">{f.value}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void copyText(f.label, String(f.value))}
                        className="shrink-0 rounded-xl bg-panel px-2.5 py-1.5 text-[11px] font-bold text-accent"
                      >
                        Copiar
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => void copyText('Datos de pago', paymentBlock(c))}
                    className="mt-1 w-full rounded-xl bg-accent-soft py-2.5 text-xs font-bold text-accent"
                  >
                    Copiar todos los datos
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-xs text-mist">Sin número de cuenta. Edita para agregar datos de pago.</p>
              )}

              <div className="mt-2 grid grid-cols-3 gap-2">
                <button type="button" onClick={() => openEdit(c)} className="rounded-xl bg-accent-soft py-2 text-[11px] font-bold text-accent">
                  Editar
                </button>
                <button type="button" onClick={() => void ajustar(c.id, c.saldo)} className="rounded-xl bg-ink-soft py-2 text-[11px] font-bold text-mist">
                  Saldo
                </button>
                <button type="button" onClick={() => void remove(c)} className="rounded-xl bg-expense-soft py-2 text-[11px] font-bold text-expense">
                  Borrar
                </button>
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}
