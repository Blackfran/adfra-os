import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function FabCapture() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const go = (path: string) => {
    setOpen(false)
    navigate(path)
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-8 md:right-8">
      {open && (
        <div className="mb-3 flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={() => go('/transacciones/nuevo?tipo=gasto')}
            className="rounded-full bg-expense px-3 py-2 text-xs font-semibold text-ink shadow-lg"
          >
            Gasto
          </button>
          <button
            type="button"
            onClick={() => go('/transacciones/nuevo?tipo=ingreso')}
            className="rounded-full bg-income px-3 py-2 text-xs font-semibold text-ink shadow-lg"
          >
            Ingreso
          </button>
          <button
            type="button"
            onClick={() => go('/bitacora/nuevo')}
            className="rounded-full bg-amber-400 px-3 py-2 text-xs font-semibold text-ink shadow-lg"
          >
            Nota
          </button>
        </div>
      )}
      <button
        type="button"
        aria-label="Captura rápida"
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl font-light text-ink shadow-[0_8px_24px_rgba(56,189,248,0.35)] transition active:scale-95"
      >
        {open ? '×' : '+'}
      </button>
    </div>
  )
}
