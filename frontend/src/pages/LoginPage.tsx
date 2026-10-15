import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import { useAuth } from '../lib/auth'

export function LoginPage() {
  const { token, ready, login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (ready && token) return <Navigate to="/" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(username.trim(), password)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-sm">
        <BrandMark size="lg" subtitle="Tu gestión personal" />
        <p className="mt-3 text-sm text-mist">Usuario y contraseña para entrar</p>

        <form onSubmit={onSubmit} className="native-card mt-6 space-y-4 p-4 sm:p-5">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-mist">Usuario</span>
            <input
              type="text"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder=""
              className="native-input"
              autoFocus
              autoComplete="off"
              required
              spellCheck={false}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-mist">Contraseña</span>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=""
              className="native-input"
              autoComplete="current-password"
              required
            />
          </label>
          {error && <p className="text-sm font-semibold text-expense">{error}</p>}
          <button type="submit" disabled={loading} className="native-btn w-full bg-accent text-ink disabled:opacity-60">
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
