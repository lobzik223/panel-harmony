import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SidebarIcons } from '../components/SidebarIcons'
import './AdminLayout.css'

const navItems = [
  { path: '/', label: 'Главная страница', icon: SidebarIcons.home },
  { path: '/statistics', label: 'Статистика', icon: SidebarIcons.statistics },
  { path: '/harmony', label: 'Гармония', icon: SidebarIcons.harmony },
  { path: '/finance', label: 'Финансы', icon: SidebarIcons.finance },
  { path: '/health', label: 'Здоровье', icon: SidebarIcons.health },
  { path: '/sleep', label: 'Сон', icon: SidebarIcons.sleep },
  { path: '/love', label: 'Любовь', icon: SidebarIcons.love },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <img
            src="/harmonyicon.png"
            alt="Harmony"
            className="sidebar-logo"
            style={{ filter: 'brightness(0)' }}
          />
          <span className="sidebar-brand">Harmony</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            Выйти
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
