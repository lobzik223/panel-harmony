import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './LoginPage.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const success = login(email, password)
    if (success) {
      navigate('/')
    } else {
      setError('Неверная почта или пароль. Демо: admin@harmony.ru / admin123')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-wrap">
            <img
              src="/harmonyicon.png"
              alt="Harmony"
              className="login-logo"
            />
          </div>
          <h1>Harmony Admin</h1>
          <p>Вход в панель администратора</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}
          <div className="form-group">
            <label>Почта</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@harmony.ru"
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="login-btn">
            Войти
          </button>
        </form>

        <p className="login-hint">Демо: admin@harmony.ru / admin123</p>
      </div>
    </div>
  )
}
