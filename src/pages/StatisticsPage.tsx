import { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Server, Database, UserX, RefreshCw, HardDrive } from 'lucide-react'
import { api, type HealthStats } from '../data/api'
import './SectionPage.css'
import './StatisticsPage.css'

const BAR_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4']

const HOUR_MS = 60 * 60 * 1000

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} МБ`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} ГБ`
}

export default function StatisticsPage() {
  const [stats, setStats] = useState<HealthStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.stats.get()
      setStats(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить статистику')
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, HOUR_MS)
    return () => clearInterval(t)
  }, [load])

  if (loading && !stats) {
    return (
      <div className="section-page">
        <header className="page-header">
          <h1>Статистика</h1>
          <p>Состояние сервера, БД и регистрации</p>
        </header>
        <div className="page-loading">Загрузка...</div>
      </div>
    )
  }

  const chartData = stats
    ? [
        { name: 'За день', value: stats.registrationsToday, fill: BAR_COLORS[0] },
        { name: 'За неделю', value: stats.registrationsWeek, fill: BAR_COLORS[1] },
        { name: 'За месяц', value: stats.registrationsMonth, fill: BAR_COLORS[2] },
      ]
    : []

  return (
    <div className="section-page stats-page">
      <header className="page-header stats-header">
        <div>
          <h1>Статистика</h1>
          <p>Состояние сервера, базы данных и регистраций</p>
        </div>
        <button type="button" className="stats-refresh-btn" onClick={load} disabled={loading} title="Обновить">
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
          Обновить
        </button>
      </header>

      {error && (
        <div className="stats-error">
          {error}. Проверьте <code>VITE_API_URL</code> и <code>VITE_APP_KEY</code> в .env
        </div>
      )}

      {stats && (
        <>
          <section className="stats-cards">
            <div className={`stats-card ${stats.serverOk ? 'ok' : 'bad'}`}>
              <div className="stats-card-icon">
                <Server size={24} />
              </div>
              <div className="stats-card-body">
                <span className="stats-card-label">Сервер</span>
                <span className="stats-card-value">{stats.serverOk ? 'Работает' : 'Недоступен'}</span>
              </div>
            </div>
            <div className={`stats-card ${stats.dbOk ? 'ok' : 'bad'}`}>
              <div className="stats-card-icon">
                <Database size={24} />
              </div>
              <div className="stats-card-body">
                <span className="stats-card-label">База данных</span>
                <span className="stats-card-value">{stats.dbOk ? 'Работает' : 'Ошибка'}</span>
              </div>
            </div>
            <div className="stats-card neutral">
              <div className="stats-card-icon">
                <UserX size={24} />
              </div>
              <div className="stats-card-body">
                <span className="stats-card-label">Удалённых аккаунтов</span>
                <span className="stats-card-value">{stats.deletedAccounts}</span>
              </div>
            </div>
          </section>

          {stats.diskUsage && (
            <section className="card-section stats-disk-section">
              <h2>Заполнение диска</h2>
              <p className="stats-section-desc">Размер папок с загрузками и общее место на сервере (обновляется каждый час)</p>
              <div className="stats-disk-cards">
                {stats.diskUsage.diskTotalBytes != null && stats.diskUsage.diskUsedBytes != null && (
                  <div className="stats-disk-card stats-disk-total">
                    <div className="stats-disk-icon">
                      <HardDrive size={24} />
                    </div>
                    <div className="stats-disk-body">
                      <span className="stats-disk-label">Диск (/)</span>
                      <span className="stats-disk-value">
                        {formatBytes(stats.diskUsage.diskUsedBytes)} из {formatBytes(stats.diskUsage.diskTotalBytes)}
                      </span>
                      <span className="stats-disk-meta">
                        Свободно: {formatBytes(stats.diskUsage.diskAvailBytes ?? 0)}
                      </span>
                    </div>
                  </div>
                )}
                <div className="stats-disk-card">
                  <div className="stats-disk-body">
                    <span className="stats-disk-label">Всего загрузок</span>
                    <span className="stats-disk-value">{formatBytes(stats.diskUsage.totalUploadsBytes)}</span>
                  </div>
                </div>
              </div>
              <div className="stats-disk-folders">
                {stats.diskUsage.folders.map((f) => (
                  <div key={f.path} className="stats-disk-row">
                    <span className="stats-disk-folder-label">{f.label}</span>
                    <span className="stats-disk-folder-size">{formatBytes(f.bytes)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="card-section">
            <h2>Регистрации</h2>
            <p className="stats-section-desc">Новые пользователи за день, неделю и месяц (без удалённых)</p>
            <div className="stats-chart-wrap">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 13 }} stroke="#6b7280" />
                  <YAxis tick={{ fontSize: 13 }} stroke="#6b7280" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                    formatter={(value: number) => [value, 'Регистраций']}
                    labelFormatter={(label) => label}
                  />
                  <Bar dataKey="value" name="Регистраций" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="stats-legend">
              <span><strong>{stats.registrationsToday}</strong> за день</span>
              <span><strong>{stats.registrationsWeek}</strong> за неделю</span>
              <span><strong>{stats.registrationsMonth}</strong> за месяц</span>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
