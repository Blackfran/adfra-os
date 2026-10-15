import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

const TOKEN_KEY = 'adfra_token'
const USER_KEY = 'adfra_user'

function readJwtSub(token: string | null): string | null {
  if (!token) return null
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { sub?: string }
    return json.sub || null
  } catch {
    return null
  }
}

type AuthCtx = {
  token: string | null
  user: string | null
  ready: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY)
    const fromJwt = readJwtSub(stored)
    // Tokens antiguos (solo password) no tienen usuario real
    if (stored && (!fromJwt || fromJwt === 'adfra-owner' || fromJwt === 'dev')) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      setToken(null)
      setUser(null)
      setReady(true)
      return
    }
    const storedUser = localStorage.getItem(USER_KEY) || fromJwt
    setToken(stored)
    setUser(storedUser)
    setReady(true)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(
        text.includes('incorrectos') || text.includes('incorrecta')
          ? 'Usuario o contraseña incorrectos'
          : 'No se pudo iniciar sesión',
      )
    }
    const data = (await res.json()) as { access_token: string }
    localStorage.setItem(TOKEN_KEY, data.access_token)
    localStorage.setItem(USER_KEY, username)
    setToken(data.access_token)
    setUser(username)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
    window.location.assign('/login')
  }, [])

  const value = useMemo(
    () => ({ token, user, ready, login, logout }),
    [token, user, ready, login, logout],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth outside provider')
  return ctx
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}
