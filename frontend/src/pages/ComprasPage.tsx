import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type RefObject } from 'react'

gsap.registerPlugin(useGSAP)

type Item = { id: string; nombre: string; precio: number | null }
type ModoPago = 'bolivares' | 'divisa'
type Vista = 'catalogo' | 'compra'

const STORAGE_KEY = 'adfra-compras-catalogo'

const CATALOGO_BASE = [
  'Harina PAN',
  'Arroz',
  'Aceite',
  'Azúcar',
  'Café',
  'Leche',
  'Huevos',
  'Pan',
  'Pasta',
  'Caraotas',
  'Lentejas',
  'Pollo',
  'Carne',
  'Queso',
  'Jamón',
  'Atún',
  'Sardinas',
  'Tomate',
  'Cebolla',
  'Ajo',
  'Plátano',
  'Cambur',
  'Papas',
  'Zanahoria',
  'Mayonesa',
  'Salsa de tomate',
  'Mantequilla',
  'Yogurt',
  'Cereal',
  'Galletas',
  'Jugo',
  'Agua',
  'Refresco',
  'Papel higiénico',
  'Jabón',
  'Detergente',
  'Cloro',
  'Shampoo',
  'Pasta dental',
  'Servilletas',
]

function loadCatalogo(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [...CATALOGO_BASE]
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return [...CATALOGO_BASE]
    const names = parsed.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    return names.length ? names : [...CATALOGO_BASE]
  } catch {
    return [...CATALOGO_BASE]
  }
}

function fmt(n: number) {
  return n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function parsePrecio(raw: string): number | null {
  const t = String(raw).replace(',', '.').trim()
  if (!t) return null
  const n = Number(t)
  return Number.isFinite(n) && n >= 0 ? n : null
}

export function ComprasPage() {
  const uid = useId()
  const [vista, setVista] = useState<Vista>('catalogo')
  const [catalogo, setCatalogo] = useState<string[]>(() => loadCatalogo())
  const [items, setItems] = useState<Item[]>([])
  const [filtro, setFiltro] = useState('')
  const [nuevoCatalogo, setNuevoCatalogo] = useState('')
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [modo, setModo] = useState<ModoPago>('bolivares')
  const [facturaOpen, setFacturaOpen] = useState(false)
  const nombreRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(catalogo))
  }, [catalogo])

  const tasa = modo === 'bolivares' ? 0.16 : 0.03
  const etiquetaImpuesto = modo === 'bolivares' ? 'IVA 16%' : 'IGTF 3%'

  const subtotal = useMemo(() => items.reduce((s, i) => s + (i.precio ?? 0), 0), [items])
  const sinPrecio = items.filter((i) => i.precio == null).length
  const impuesto = subtotal * tasa
  const total = subtotal + impuesto

  const seleccionados = useMemo(
    () => new Set(items.map((i) => i.nombre.toLowerCase())),
    [items],
  )

  const catalogoFiltrado = useMemo(() => {
    const q = filtro.trim().toLowerCase()
    if (!q) return catalogo
    return catalogo.filter((p) => p.toLowerCase().includes(q))
  }, [filtro, catalogo])

  function makeId() {
    return `${uid}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  }

  function agregarAlCatalogo(e: FormEvent) {
    e.preventDefault()
    const n = nuevoCatalogo.trim()
    if (!n) return
    const key = n.toLowerCase()
    if (catalogo.some((p) => p.toLowerCase() === key)) {
      setNuevoCatalogo('')
      return
    }
    setCatalogo((prev) => [...prev, n].sort((a, b) => a.localeCompare(b, 'es')))
    setNuevoCatalogo('')
  }

  function eliminarDelCatalogo(producto: string) {
    const key = producto.toLowerCase()
    setCatalogo((prev) => prev.filter((p) => p.toLowerCase() !== key))
    setItems((prev) => prev.filter((i) => i.nombre.toLowerCase() !== key))
  }

  function toggleCatalogo(producto: string) {
    const key = producto.toLowerCase()
    setItems((prev) => {
      const exists = prev.find((i) => i.nombre.toLowerCase() === key)
      if (exists) return prev.filter((i) => i.id !== exists.id)
      return [...prev, { id: makeId(), nombre: producto, precio: null }]
    })
  }

  function setPrecioItem(id: string, raw: string) {
    const p = parsePrecio(raw)
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, precio: p } : i)))
  }

  function agregarManual(e: FormEvent) {
    e.preventDefault()
    const n = nombre.trim()
    if (!n) return
    const p = parsePrecio(precio)
    setItems((prev) => {
      const key = n.toLowerCase()
      const exists = prev.find((i) => i.nombre.toLowerCase() === key)
      if (exists) {
        return prev.map((i) => (i.id === exists.id ? { ...i, precio: p ?? i.precio } : i))
      }
      return [...prev, { id: makeId(), nombre: n, precio: p }]
    })
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

      <div className="grid grid-cols-2 gap-1 rounded-2xl border border-line bg-ink-soft p-1">
        <button
          type="button"
          onClick={() => setVista('catalogo')}
          className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
            vista === 'catalogo' ? 'bg-panel text-foam shadow-sm' : 'text-mist'
          }`}
        >
          Catálogo
        </button>
        <button
          type="button"
          onClick={() => setVista('compra')}
          className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
            vista === 'compra' ? 'bg-panel text-foam shadow-sm' : 'text-mist'
          }`}
        >
          Mi compra{items.length > 0 ? ` (${items.length})` : ''}
        </button>
      </div>

      {vista === 'catalogo' ? (
        <VistaCatalogo
          filtro={filtro}
          setFiltro={setFiltro}
          nuevoCatalogo={nuevoCatalogo}
          setNuevoCatalogo={setNuevoCatalogo}
          onAgregarCatalogo={agregarAlCatalogo}
          catalogoFiltrado={catalogoFiltrado}
          seleccionados={seleccionados}
          onToggle={toggleCatalogo}
          onEliminar={eliminarDelCatalogo}
          count={items.length}
          onIrCompra={() => setVista('compra')}
        />
      ) : (
        <VistaCompra
          items={items}
          modo={modo}
          setModo={setModo}
          nombre={nombre}
          setNombre={setNombre}
          precio={precio}
          setPrecio={setPrecio}
          nombreRef={nombreRef}
          onAgregar={agregarManual}
          onQuitar={quitar}
          onPrecio={setPrecioItem}
          subtotal={subtotal}
          impuesto={impuesto}
          total={total}
          sinPrecio={sinPrecio}
          etiquetaImpuesto={etiquetaImpuesto}
          onFactura={() => setFacturaOpen(true)}
          onIrCatalogo={() => setVista('catalogo')}
        />
      )}

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

function VistaCatalogo({
  filtro,
  setFiltro,
  nuevoCatalogo,
  setNuevoCatalogo,
  onAgregarCatalogo,
  catalogoFiltrado,
  seleccionados,
  onToggle,
  onEliminar,
  count,
  onIrCompra,
}: {
  filtro: string
  setFiltro: (v: string) => void
  nuevoCatalogo: string
  setNuevoCatalogo: (v: string) => void
  onAgregarCatalogo: (e: FormEvent) => void
  catalogoFiltrado: string[]
  seleccionados: Set<string>
  onToggle: (p: string) => void
  onEliminar: (p: string) => void
  count: number
  onIrCompra: () => void
}) {
  return (
    <div className="space-y-4">
      <section className="native-card space-y-3 p-4">
        <div>
          <p className="text-sm font-semibold text-foam">Catálogo</p>
          <p className="text-xs text-mist">Marca para la compra · agrega o elimina productos</p>
        </div>
        <input
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="native-input"
          placeholder="Buscar producto…"
          autoComplete="off"
        />
      </section>

      <form onSubmit={onAgregarCatalogo} className="native-card flex gap-2 p-3">
        <input
          value={nuevoCatalogo}
          onChange={(e) => setNuevoCatalogo(e.target.value)}
          className="native-input min-w-0 flex-1"
          placeholder="Nuevo producto al catálogo"
          autoComplete="off"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-ink"
        >
          Agregar
        </button>
      </form>

      <ul className="space-y-2">
        {catalogoFiltrado.map((producto) => {
          const on = seleccionados.has(producto.toLowerCase())
          return (
            <li
              key={producto}
              className={`flex items-center gap-2 rounded-xl border px-2 py-2 ${
                on ? 'border-accent bg-accent-soft' : 'border-line/80 bg-panel/80'
              }`}
            >
              <button
                type="button"
                onClick={() => onToggle(producto)}
                className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-2 py-2 text-left active:scale-[0.99]"
              >
                <span className={`truncate font-medium ${on ? 'text-accent' : 'text-foam'}`}>
                  {producto}
                </span>
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    on ? 'bg-accent text-ink' : 'bg-ink-soft text-mist'
                  }`}
                >
                  {on ? '✓' : '+'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onEliminar(producto)}
                className="shrink-0 rounded-lg bg-expense-soft px-2.5 py-2 text-xs font-semibold text-expense"
                aria-label={`Eliminar ${producto} del catálogo`}
              >
                Eliminar
              </button>
            </li>
          )
        })}
        {catalogoFiltrado.length === 0 && (
          <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-sm text-mist">
            {filtro.trim() ? 'Nada coincide con la búsqueda' : 'Catálogo vacío. Agrega el primero arriba.'}
          </p>
        )}
      </ul>

      {count > 0 && (
        <button type="button" onClick={onIrCompra} className="native-btn w-full bg-accent text-ink">
          Ir a mi compra ({count})
        </button>
      )}
    </div>
  )
}

function VistaCompra({
  items,
  modo,
  setModo,
  nombre,
  setNombre,
  precio,
  setPrecio,
  nombreRef,
  onAgregar,
  onQuitar,
  onPrecio,
  subtotal,
  impuesto,
  total,
  sinPrecio,
  etiquetaImpuesto,
  onFactura,
  onIrCatalogo,
}: {
  items: Item[]
  modo: ModoPago
  setModo: (m: ModoPago) => void
  nombre: string
  setNombre: (v: string) => void
  precio: string
  setPrecio: (v: string) => void
  nombreRef: RefObject<HTMLInputElement | null>
  onAgregar: (e: FormEvent) => void
  onQuitar: (id: string) => void
  onPrecio: (id: string, raw: string) => void
  subtotal: number
  impuesto: number
  total: number
  sinPrecio: number
  etiquetaImpuesto: string
  onFactura: () => void
  onIrCatalogo: () => void
}) {
  return (
    <div className="space-y-5">
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

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-mist">
            Productos ({items.length})
          </h2>
          <button
            type="button"
            onClick={onIrCatalogo}
            className="text-xs font-semibold text-accent"
          >
            + Del catálogo
          </button>
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line px-3 py-6 text-center">
            <p className="text-sm text-mist">Aún no hay productos.</p>
            <button
              type="button"
              onClick={onIrCatalogo}
              className="mt-3 text-sm font-semibold text-accent"
            >
              Ir al catálogo
            </button>
          </div>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className="space-y-2 rounded-xl border border-line/80 bg-panel/80 px-3 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate font-medium">{item.nombre}</p>
                <button
                  type="button"
                  onClick={() => onQuitar(item.id)}
                  className="shrink-0 rounded-lg bg-expense-soft px-2.5 py-1.5 text-xs font-semibold text-expense"
                >
                  Quitar
                </button>
              </div>
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold text-mist">Precio (opcional)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="native-input tabular-nums"
                  placeholder="Sin precio aún"
                  value={item.precio == null ? '' : String(item.precio)}
                  onChange={(e) => onPrecio(item.id, e.target.value)}
                />
              </label>
            </article>
          ))
        )}
      </section>

      <form onSubmit={onAgregar} className="native-card space-y-3 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-mist">Agregar otro</p>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-mist">Producto</span>
          <input
            ref={nombreRef}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="native-input"
            placeholder="Nombre del producto"
            autoComplete="off"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-mist">Precio (opcional)</span>
          <input
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            className="native-input tabular-nums"
            inputMode="decimal"
            placeholder="Puedes dejarlo vacío"
          />
        </label>
        <button type="submit" className="native-btn w-full border border-line bg-ink-soft text-foam">
          Agregar a la compra
        </button>
      </form>

      <section className="native-card space-y-2 p-4">
        <div className="flex justify-between text-sm">
          <span className="text-mist">Subtotal (neto)</span>
          <span className="font-semibold tabular-nums">{fmt(subtotal)}</span>
        </div>
        {sinPrecio > 0 && (
          <p className="text-[11px] text-warn">
            {sinPrecio} producto{sinPrecio === 1 ? '' : 's'} sin precio (cuentan como 0)
          </p>
        )}
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
          onClick={onFactura}
          className="native-btn mt-2 w-full bg-accent text-ink disabled:opacity-50"
        >
          Ver factura digital
        </button>
      </section>
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
                  <span className="shrink-0 tabular-nums text-mist">
                    {item.precio == null ? '—' : fmt(item.precio)}
                  </span>
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
            maskImage: 'radial-gradient(circle at 8px 0, transparent 7px, #000 7.5px)',
            maskSize: '16px 12px',
            WebkitMaskImage: 'radial-gradient(circle at 8px 0, transparent 7px, #000 7.5px)',
            WebkitMaskSize: '16px 12px',
          }}
        />
      </div>
    </div>
  )
}
