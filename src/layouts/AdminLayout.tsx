import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SidebarIcons } from '../components/SidebarIcons'
import './AdminLayout.css'

const navItems = [
  { path: '/content/main', label: 'Главный', icon: SidebarIcons.content },
  { path: '/content/sleep', label: 'Сон', icon: SidebarIcons.sleep },
  { path: '/content/meditation', label: 'Медитация', icon: SidebarIcons.harmony },
  { path: '/statistics', label: 'Статистика', icon: SidebarIcons.statistics },
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
          />
          <span className="sidebar-brand">Harmony</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={true}
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
