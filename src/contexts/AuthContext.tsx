import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authFetch, TOKEN_KEY } from '../lib/authFetch'

const PASSPORT_BASE = (import.meta.env.VITE_PASSPORT_ENDPOINT as string | undefined) ?? 'http://127.0.0.1:9000'

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  roles: string[]
  permissions: string[]
}

interface AuthContextValue {
  token: string | null
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<string | null>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }
    fetchMe(token).then(u => {
      setUser(u)
      setIsLoading(false)
    })
  }, [token])

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch(`${PASSPORT_BASE}/api/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, tenant: 'content-admin' }),
      })
      const data = await res.json() as Record<string, unknown>
      if (!res.ok) {
        return (data.message as string | undefined) ?? 'Login failed.'
      }
      const jwt = data.token as string
      localStorage.setItem(TOKEN_KEY, jwt)
      setToken(jwt)
      const me = await fetchMe(jwt)
      setUser(me)
      return null
    } catch {
      return 'Unable to connect to auth server.'
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

async function fetchMe(jwt: string): Promise<AuthUser | null> {
  try {
    const res = await authFetch(`${PASSPORT_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${jwt}` },
    })
    if (!res.ok) return null
    const data = await res.json() as Record<string, unknown>
    return {
      id: data.id as string,
      email: data.email as string,
      firstName: data.first_name as string,
      lastName: data.last_name as string,
      roles: (data.roles as string[] | undefined) ?? [],
      permissions: (data.permissions as string[] | undefined) ?? [],
    }
  } catch {
    return null
  }
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export { PASSPORT_BASE }
