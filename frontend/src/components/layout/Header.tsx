import { useEffect, useState } from 'react'

export function Header() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  const today = new Date().toLocaleDateString('es-VE', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  })

  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-ink/85 px-4 py-3 backdrop-blur-md md:px-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold tracking-tight text-white md:text-xl">
            AdFra OS
          </p>
          <p className="text-xs capitalize text-mist">{today}</p>
        </div>
        <div
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
            online ? 'bg-income/15 text-income' : 'bg-expense/15 text-expense'
          }`}
        >
          {online ? 'En línea' : 'Offline'}
        </div>
      </div>
    </header>
  )
}
