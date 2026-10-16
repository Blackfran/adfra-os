import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useId, useMemo, useRef, useState, type FormEvent } from 'react'

gsap.registerPlugin(useGSAP)

type Item = { id: string; nombre: string; precio: number }
type ModoPago = 'bolivares' | 'divisa'

function fmt(n: number) {
  return n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function parsePrecio(raw: string) {
  const n = Number(String(raw).replace(',', '.').trim())
  return Number.isFinite(n) && n >= 0 ? n : null
}

export function ComprasPage() {
  const uid = useId()
  const [items, setItems] = useState<Item[]>([])
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [modo, setModo] = useState<ModoPago>('bolivares')
  const [facturaOpen, setFacturaOpen] = useState(false)
  const nombreRef = useRef<HTMLInputElement>(null)

  const tasa = modo === 'bolivares' ? 0.16 : 0.03
  const etiquetaImpuesto = modo === 'bolivares' ? 'IVA 16%' : 'IGTF 3%'

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.precio, 0), [items])
  const impuesto = subtotal * tasa
  const total = subtotal + impuesto

  function agregar(e: FormEvent) {
    e.preventDefault()
    const p = parsePrecio(precio)
    const n = nombre.trim()
    if (!n || p == null) return
    setItems((prev) => [...prev, { id: `${uid}-${Date.now()}-${prev.length}`, nombre: n, precio: p }])
    setNombre('')
    setPrecio('')
    nombreRef.current?.focus()
  }

  function quitar(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function limpiar() {
    setItems([])
    setFacturaOpen(false)
  }

  return (
    <div className="page space-y-5">
      <header className="page-header">
        <div>
          <h1 className="page-title">Compras</h1>
          <p className="text-sm text-mist">Lista temporal · no se guarda</p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={limpiar}
            className="rounded-xl bg-ink-soft px-3 py-2 text-xs font-semibold text-mist"
          >
            Limpiar
          </button>
        )}
      </header>

      <section className="native-card space-y-3 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-mist">Forma de pago</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setModo('bolivares')}
            className={`rounded-2xl border px-3 py-3 text-left transition ${
              modo === 'bolivares'
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-line bg-panel text-mist'
            }`}
          >
            <span className="block text-sm font-semibold">Bolívares</span>
            <span className="text-[11px]">+16% IVA</span>
          </button>
          <button
            type="button"
            onClick={() => setModo('divisa')}
            className={`rounded-2xl border px-3 py-3 text-left transition ${
              modo === 'divisa'
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-line bg-panel text-mist'
            }`}
          >
            <span className="block text-sm font-semibold">Divisa</span>
            <span className="text-[11px]">+3% IGTF</span>
          </button>
        </div>
      </section>

      <form onSubmit={agregar} className="native-card space-y-3 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-mist">Agregar producto</p>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-mist">Producto</span>
          <input
            ref={nombreRef}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="native-input"
            placeholder="Ej. Arroz, café…"
            autoComplete="off"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-mist">Precio</span>
          <input
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            className="native-input tabular-nums"
            inputMode="decimal"
            placeholder="0,00"
          />
        </label>
        <button type="submit" className="native-btn w-full bg-accent text-ink">
          Agregar a la lista
        </button>
      </form>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-mist">
          Lista ({items.length})
        </h2>
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-sm text-mist">
            Aún no hay productos. Agrega el primero arriba.
          </p>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-line/80 bg-panel/80 px-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{item.nombre}</p>
                <p className="text-xs tabular-nums text-mist">{fmt(item.precio)}</p>
              </div>
              <button
                type="button"
                onClick={() => quitar(item.id)}
                className="shrink-0 rounded-lg bg-expense-soft px-2.5 py-1.5 text-xs font-semibold text-expense"
              >
                Quitar
              </button>
            </article>
          ))
        )}
      </section>

      <section className="native-card space-y-2 p-4">
        <div className="flex justify-between text-sm">
          <span className="text-mist">Subtotal (neto)</span>
          <span className="font-semibold tabular-nums">{fmt(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-mist">{etiquetaImpuesto}</span>
          <span className="font-semibold tabular-nums">{fmt(impuesto)}</span>
        </div>
        <div className="border-t border-line pt-2">
          <div className="flex items-end justify-between">
            <span className="text-sm font-semibold">Total a pagar</span>
            <span className="font-display text-2xl font-bold tabular-nums text-foam">
              {fmt(total)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-mist">
            {modo === 'bolivares' ? 'Pago en bolívares' : 'Pago en divisa'} · temporal
          </p>
        </div>
        <button
          type="button"
          disabled={items.length === 0}
          onClick={() => setFacturaOpen(true)}
          className="native-btn mt-2 w-full bg-accent text-ink disabled:opacity-50"
        >
          Ver factura digital
        </button>
      </section>

      {facturaOpen && (
        <FacturaDigital
          items={items}
          subtotal={subtotal}
          impuesto={impuesto}
          total={total}
          etiquetaImpuesto={etiquetaImpuesto}
          modo={modo}
          onClose={() => setFacturaOpen(false)}
        />
      )}
    </div>
  )
}

function FacturaDigital({
  items,
  subtotal,
  impuesto,
  total,
  etiquetaImpuesto,
  modo,
  onClose,
}: {
  items: Item[]
  subtotal: number
  impuesto: number
  total: number
  etiquetaImpuesto: string
  modo: ModoPago
  onClose: () => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const ticketRef = useRef<HTMLDivElement>(null)
  const fecha = new Date().toLocaleString('es-VE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.from('.factura-backdrop', { opacity: 0, duration: 0.25 })
        .from(
          ticketRef.current,
          { y: 48, opacity: 0, scale: 0.94, duration: 0.45, ease: 'back.out(1.4)' },
          '-=0.05',
        )
        .from('.factura-line', { opacity: 0, x: -12, stagger: 0.06, duration: 0.28 }, '-=0.15')
        .from('.factura-totales > *', { opacity: 0, y: 10, stagger: 0.08, duration: 0.3 }, '-=0.1')
        .from('.factura-sello', { scale: 0, rotation: -12, duration: 0.4, ease: 'back.out(2)' }, '-=0.05')
    },
    { scope: rootRef },
  )

  return (
    <div ref={rootRef} className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="factura-backdrop absolute inset-0 bg-foam/40 backdrop-blur-[3px]"
        aria-label="Cerrar factura"
        onClick={onClose}
      />
      <div
        ref={ticketRef}
        className="relative z-10 mx-3 mb-[calc(1rem+env(safe-area-inset-bottom))] w-full max-w-sm overflow-hidden rounded-2xl border border-line bg-[#fffdf8] shadow-2xl sm:mb-0"
      >
        <div className="h-2 bg-gradient-to-r from-accent via-accent/70 to-income" />
        <div className="space-y-4 px-5 py-5">
          <header className="text-center">
            <p className="font-display text-lg font-bold tracking-tight text-foam">AdFra Ges</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-mist">Factura digital</p>
            <p className="mt-1 text-xs text-mist">{fecha}</p>
          </header>

          <div className="border-y border-dashed border-line/90 py-3">
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id} className="factura-line flex justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-foam">{item.nombre}</span>
                  <span className="shrink-0 tabular-nums text-mist">{fmt(item.precio)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="factura-totales space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-mist">Subtotal</span>
              <span className="tabular-nums">{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-mist">{etiquetaImpuesto}</span>
              <span className="tabular-nums">{fmt(impuesto)}</span>
            </div>
            <div className="flex items-end justify-between border-t border-line pt-2">
              <span className="font-semibold">Total</span>
              <span className="font-display text-2xl font-bold tabular-nums text-foam">
                {fmt(total)}
              </span>
            </div>
            <p className="text-[11px] text-mist">
              {modo === 'bolivares' ? 'Pagar en bolívares' : 'Pagar en divisa'}
            </p>
          </div>

          <div className="factura-sello mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-income/50 text-[10px] font-bold uppercase leading-tight text-income">
            Listo
            <br />
            a pagar
          </div>

          <button type="button" onClick={onClose} className="native-btn w-full border border-line bg-ink-soft text-foam">
            Cerrar
          </button>
        </div>
        <div
          className="h-3 bg-[#fffdf8]"
          style={{
            maskImage:
              'radial-gradient(circle at 8px 0, transparent 7px, #000 7.5px)',
            maskSize: '16px 12px',
            WebkitMaskImage:
              'radial-gradient(circle at 8px 0, transparent 7px, #000 7.5px)',
            WebkitMaskSize: '16px 12px',
          }}
        />
      </div>
    </div>
  )
}
