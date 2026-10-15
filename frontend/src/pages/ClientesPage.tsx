import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../lib/api'
import type { Cliente } from '../types/api'

export function ClientesPage() {
  const [items, setItems] = useState<Cliente[]>([])
  const [nombre, setNombre] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [error, setError] = useState<string | null>(null)

  const load = () => api.clientes().then(setItems).catch((e: Error) => setError(e.message))
  useEffect(() => {
    void load()
  }, [])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    await api.createCliente({ nombre, empresa: empresa || undefined, email: email || undefined, telefono: telefono || undefined })
    setNombre('')
    setEmpresa('')
    setEmail('')
    setTelefono('')
    await load()
  }

  return (
    <div className="page space-y-5">
      <header>
        <h1 className="page-title">Clientes</h1>
        <p className="text-sm text-mist">Directorio comercial para tus proyectos freelance</p>
      </header>
      {error && <p className="text-sm text-expense">{error}</p>}

      <form onSubmit={onCreate} className="space-y-2 rounded-2xl border border-line/80 bg-panel/80 p-4">
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" required className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-accent" />
        <input value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Empresa" className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-accent" />
        <div className="grid grid-cols-2 gap-2">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-accent" />
          <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Teléfono" className="rounded-lg border border-line bg-ink px-3 py-2 text-sm outline-none focus:border-accent" />
        </div>
        <button type="submit" className="w-full rounded-lg bg-accent py-2 text-sm font-semibold text-ink">Guardar cliente</button>
      </form>

      <section className="space-y-2">
        {items.map((c) => (
          <article key={c.id} className="rounded-xl border border-line/80 bg-panel/80 px-3 py-3">
            <p className="font-medium">{c.nombre}</p>
            <p className="text-xs text-mist">{c.empresa || 'Sin empresa'}</p>
            <p className="mt-1 text-xs text-accent">
              {[c.email, c.telefono].filter(Boolean).join(' · ') || 'Sin contacto'}
            </p>
          </article>
        ))}
      </section>
    </div>
  )
}
