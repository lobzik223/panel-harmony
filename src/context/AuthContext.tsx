import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const AUTH_KEY = 'harmony_admin_auth'

interface AuthContextType {
  isAuthenticated: boolean
  login: (email: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_KEY)
    if (stored === 'true') setIsAuthenticated(true)
  }, [])

  const login = useCallback((email: string, password: string) => {
    // Демо-доступ: admin@harmony.ru / admin123
    const valid = email === 'admin@harmony.ru' && password === 'admin123'
    if (valid) {
      setIsAuthenticated(true)
      localStorage.setItem(AUTH_KEY, 'true')
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    setIsAuthenticated(false)
    localStorage.removeItem(AUTH_KEY)
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
