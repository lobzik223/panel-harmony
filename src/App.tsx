import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import AdminLayout from './layouts/AdminLayout'
import StatisticsPage from './pages/StatisticsPage'
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
                  <Route path="/" element={<Navigate to="/content/main" replace />} />
                  <Route path="/content" element={<Navigate to="/content/main" replace />} />
                  <Route path="/content/main" element={<ContentPage />} />
                  <Route path="/content/sleep" element={<ContentPage />} />
                  <Route path="/content/meditation" element={<ContentPage />} />
                  <Route path="/statistics" element={<StatisticsPage />} />
                  <Route path="*" element={<Navigate to="/content/main" replace />} />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
}
