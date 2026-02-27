import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const AUTH_TOKEN_KEY = 'harmony_admin_token'
const AUTH_EMAIL_KEY = 'harmony_admin_email'

interface AuthContextType {
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  token: string | null
}

const AuthContext = createContext<AuthContextType | null>(null)

const API_BASE = ((import.meta as any).env?.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')
const API_PREFIX = '/api'
/** URL входа админа: должен совпадать с бэкендом (POST /api/admin/login). */
export const ADMIN_LOGIN_URL = `${API_BASE}${API_PREFIX}/admin/login`

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_TOKEN_KEY))

  useEffect(() => {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token)
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem(AUTH_EMAIL_KEY)
    }
  }, [token])

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    let res: Response
    try {
      res = await fetch(ADMIN_LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
    } catch {
      throw new Error('Не удалось подключиться к серверу. Запустите бэкенд (например, порт 3000) и проверьте VITE_API_URL.')
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      const msg =
        (err && err.message) ||
        (res.status === 404
          ? 'Сервер не найден (404). Запустите бэкенд и проверьте VITE_API_URL при сборке панели.'
          : res.status === 401
            ? 'Неверная почта или пароль'
            : `Ошибка ${res.status}`)
      throw new Error(msg)
    }
    const data = (await res.json()) as { token: string; email: string }
    setToken(data.token)
    if (data.email) localStorage.setItem(AUTH_EMAIL_KEY, data.email)
  }, [])

  const logout = useCallback(() => {
    setToken(null)
  }, [])

  const isAuthenticated = !!token

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
