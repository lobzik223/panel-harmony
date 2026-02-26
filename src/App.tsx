import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import AdminLayout from './layouts/AdminLayout'
import DashboardPage from './pages/DashboardPage'
import HarmonyPage from './pages/HarmonyPage'
import FinancePage from './pages/FinancePage'
import HealthPage from './pages/HealthPage'
import SleepPage from './pages/SleepPage'
import LovePage from './pages/LovePage'
import StatisticsPage from './pages/StatisticsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import ContentPage from './pages/ContentPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/harmony" element={<HarmonyPage />} />
                  <Route path="/finance" element={<FinancePage />} />
                  <Route path="/health" element={<HealthPage />} />
                  <Route path="/sleep" element={<SleepPage />} />
                  <Route path="/love" element={<LovePage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/content" element={<ContentPage />} />
                  <Route path="/statistics" element={<StatisticsPage />} />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
}
