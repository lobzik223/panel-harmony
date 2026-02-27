import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api, type HealthStats } from '../data/api'
import { FileText, BarChart3 } from 'lucide-react'
import './SectionPage.css'

export default function DashboardPage() {
  const [stats, setStats] = useState<HealthStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api.stats
      .get()
      .then((data) => {
        if (!cancelled) setStats(data)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Ошибка загрузки')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  if (loading && !stats) {
    return (
      <div className="section-page">
        <header className="page-header">
          <h1>Главная</h1>
        </header>
        <div className="page-loading">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="section-page">
      <header className="page-header">
        <h1>Главная</h1>
        <p>Панель управления Harmony</p>
      </header>

      {error && (
        <div className="page-error" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {stats && (
        <section className="card-section" style={{ marginBottom: 24 }}>
          <h2>Сервер</h2>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ padding: 12, background: stats.serverOk ? '#dcfce7' : '#fee2e2', borderRadius: 8 }}>
              API: {stats.serverOk ? 'OK' : 'Ошибка'}
            </div>
            <div style={{ padding: 12, background: stats.dbOk ? '#dcfce7' : '#fee2e2', borderRadius: 8 }}>
              БД: {stats.dbOk ? 'OK' : 'Ошибка'}
            </div>
            {stats.totalActiveUsers != null && (
              <div style={{ padding: 12, background: '#e0e7ff', borderRadius: 8 }}>
                Пользователей: {stats.totalActiveUsers}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="card-section">
        <h2>Разделы</h2>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link
            to="/content"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 16,
              background: '#f1f5f9',
              borderRadius: 12,
              textDecoration: 'none',
              color: '#0f172a',
            }}
          >
            <FileText size={24} />
            <span><strong>Контент</strong> — секции, треки, статьи для приложения</span>
          </Link>
          <Link
            to="/statistics"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 16,
              background: '#f1f5f9',
              borderRadius: 12,
              textDecoration: 'none',
              color: '#0f172a',
            }}
          >
            <BarChart3 size={24} />
            <span><strong>Статистика</strong> — регистрации, сервер, БД</span>
          </Link>
        </div>
      </section>
    </div>
  )
}
