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
    <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-3 z-50 sm:right-4 md:bottom-8 md:right-8">
      {open && (
        <div className="mb-3 flex flex-col items-end gap-2">
          <Action label="Gasto" className="bg-expense text-ink" onClick={() => go('/transacciones/nuevo?tipo=gasto')} />
          <Action label="Ingreso" className="bg-income text-ink" onClick={() => go('/transacciones/nuevo?tipo=ingreso')} />
          <Action label="Nota" className="bg-accent text-ink" onClick={() => go('/bitacora/nuevo')} />
        </div>
      )}
      <button
        type="button"
        aria-label="Captura rápida"
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-accent text-3xl font-light text-ink shadow-lg shadow-accent/25 transition active:scale-95"
      >
        {open ? '×' : '+'}
      </button>
    </div>
  )
}

function Action({
  label,
  className,
  onClick,
}: {
  label: string
  className: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-2xl px-4 text-sm font-semibold shadow-md ${className}`}
    >
      {label}
    </button>
  )
}
