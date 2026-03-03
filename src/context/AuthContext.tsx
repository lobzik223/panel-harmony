import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'

import { API_BASE, API_PREFIX, APP_KEY } from '../config'

const AUTH_TOKEN_KEY = 'harmony_admin_token'
const AUTH_EMAIL_KEY = 'harmony_admin_email'
const INACTIVITY_MINUTES = 3

interface AuthContextType {
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  token: string | null
}

const AuthContext = createContext<AuthContextType | null>(null)

/** URL входа админа: должен совпадать с бэкендом (POST /api/admin/login). */
export const ADMIN_LOGIN_URL = `${API_BASE}${API_PREFIX}/admin/login`

function getLoginHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (APP_KEY) h['X-Harmony-App-Key'] = APP_KEY
  return h
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_TOKEN_KEY))
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token)
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem(AUTH_EMAIL_KEY)
    }
  }, [token])

  const logout = useCallback(() => {
    setToken(null)
  }, [])

  useEffect(() => {
    if (!token) return
    const delay = INACTIVITY_MINUTES * 60 * 1000
    const resetTimer = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
      inactivityTimerRef.current = setTimeout(() => {
        logout()
      }, delay)
    }
    resetTimer()
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach((ev) => window.addEventListener(ev, resetTimer))
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
      events.forEach((ev) => window.removeEventListener(ev, resetTimer))
    }
  }, [token, logout])

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    let res: Response
    try {
      res = await fetch(ADMIN_LOGIN_URL, {
        method: 'POST',
        headers: getLoginHeaders(),
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
            ? 'Неверная почта или пароль. Если уверены в данных — на сервере выполните: cd backend-harmony && npm run create-admin'
            : `Ошибка ${res.status}`)
      throw new Error(msg)
    }
    const data = (await res.json()) as { token: string; email: string }
    setToken(data.token)
    if (data.email) localStorage.setItem(AUTH_EMAIL_KEY, data.email)
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
