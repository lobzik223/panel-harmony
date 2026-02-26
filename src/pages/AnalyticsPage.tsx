import { useState, useEffect, useCallback } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { Server, Database, Users, UserX, RefreshCw, TrendingUp } from 'lucide-react'
import { api, type HealthStats } from '../data/api'
import './SectionPage.css'
import './AnalyticsPage.css'

const BAR_COLORS = ['#6366f1', '#8b5cf6', '#a855f7']
const PIE_COLORS = ['#22c55e', '#ef4444']

export default function AnalyticsPage() {
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
      setError(e instanceof Error ? e.message : 'Не удалось загрузить аналитику')
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 60_000)
    return () => clearInterval(t)
  }, [load])

  if (loading && !stats) {
    return (
      <div className="section-page">
        <header className="page-header">
          <h1>Аналитика</h1>
          <p>Пользователи приложения, сервер и графики</p>
        </header>
        <div className="page-loading">Загрузка...</div>
      </div>
    )
  }

  const totalUsers = stats?.totalActiveUsers ?? 0
  const deleted = stats?.deletedAccounts ?? 0
  const chartData = stats
    ? [
        { name: 'За день', value: stats.registrationsToday, fill: BAR_COLORS[0] },
        { name: 'За неделю', value: stats.registrationsWeek, fill: BAR_COLORS[1] },
        { name: 'За месяц', value: stats.registrationsMonth, fill: BAR_COLORS[2] },
      ]
    : []
  const pieData = stats
    ? [
        { name: 'Активные', value: totalUsers, fill: PIE_COLORS[0] },
        { name: 'Удалённые', value: deleted, fill: PIE_COLORS[1] },
      ].filter((d) => d.value > 0)
    : []

  return (
    <div className="section-page analytics-page">
      <header className="page-header analytics-header">
        <div>
          <h1>Аналитика</h1>
          <p>Пользователи приложения Harmony, состояние сервера и графики</p>
        </div>
        <button
          type="button"
          className="analytics-refresh-btn"
          onClick={load}
          disabled={loading}
          title="Обновить"
        >
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
          Обновить
        </button>
      </header>

      {error && (
        <div className="analytics-error">
          {error}. Проверьте <code>VITE_API_URL</code> и <code>VITE_APP_KEY</code> в .env
        </div>
      )}

      {stats && (
        <>
          <section className="analytics-cards">
            <div className={`analytics-card analytics-card-server ${stats.serverOk ? 'ok' : 'bad'}`}>
              <div className="analytics-card-icon">
                <Server size={28} />
              </div>
              <div className="analytics-card-body">
                <span className="analytics-card-label">Сервер</span>
                <span className="analytics-card-value">
                  {stats.serverOk ? 'Работает' : 'Недоступен'}
                </span>
              </div>
            </div>
            <div className={`analytics-card analytics-card-db ${stats.dbOk ? 'ok' : 'bad'}`}>
              <div className="analytics-card-icon">
                <Database size={28} />
              </div>
              <div className="analytics-card-body">
                <span className="analytics-card-label">База данных</span>
                <span className="analytics-card-value">{stats.dbOk ? 'Работает' : 'Ошибка'}</span>
              </div>
            </div>
            <div className="analytics-card analytics-card-users">
              <div className="analytics-card-icon">
                <Users size={28} />
              </div>
              <div className="analytics-card-body">
                <span className="analytics-card-label">Пользователей в приложении</span>
                <span className="analytics-card-value analytics-card-value-big">{totalUsers}</span>
              </div>
            </div>
            <div className="analytics-card analytics-card-deleted">
              <div className="analytics-card-icon">
                <UserX size={28} />
              </div>
              <div className="analytics-card-body">
                <span className="analytics-card-label">Удалённых аккаунтов</span>
                <span className="analytics-card-value analytics-card-value-big">{deleted}</span>
              </div>
            </div>
          </section>

          <section className="analytics-section">
            <h2>
              <TrendingUp size={22} />
              Регистрации из приложения
            </h2>
            <p className="analytics-section-desc">
              Новые пользователи за день, неделю и месяц (только активные, без удалённых)
            </p>
            <div className="analytics-chart-wrap">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 20, right: 24, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 14, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 13, fill: '#64748b' }}
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                    formatter={(value: number) => [value, 'регистраций']}
                    labelFormatter={(label) => label}
                  />
                  <Bar dataKey="value" name="Регистраций" radius={[8, 8, 0, 0]} maxBarSize={80}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="analytics-legend">
              <span>
                <strong>{stats.registrationsToday}</strong> за день
              </span>
              <span>
                <strong>{stats.registrationsWeek}</strong> за неделю
              </span>
              <span>
                <strong>{stats.registrationsMonth}</strong> за месяц
              </span>
            </div>
          </section>

          {pieData.length > 0 && (
            <section className="analytics-section">
              <h2>Активные и удалённые аккаунты</h2>
              <div className="analytics-pie-wrap">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }}
                      formatter={(value: number, name: string) => [value, name]}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
