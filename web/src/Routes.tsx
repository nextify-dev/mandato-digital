// src/Routes.tsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuth } from '@/contexts/AuthProvider'
import DashboardSignIn from '@/screens/DashboardSignIn'
import DashboardV1 from '@/screens/DashboardV1'
import ForgotPasswordScreen from '@/screens/ForgotPassword'
import { ViewsProvider } from './contexts/ViewsProvider'

interface RouteProps {
  isAuthenticated: boolean
  children: React.ReactNode
}

const PrivateRoute = ({ isAuthenticated, children }: RouteProps) => {
  if (!isAuthenticated) return <Navigate to="/entrar" replace />
  return <>{children}</>
}

const PublicRoute = ({ isAuthenticated, children }: RouteProps) => {
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

const AppRoutes = () => {
  const { isAuth, isAuthLoading } = useAuth()

  if (isAuthLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}
      >
        <Spin size="large" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/entrar"
          element={
            <PublicRoute isAuthenticated={isAuth}>
              <DashboardSignIn />
            </PublicRoute>
          }
        />
        <Route
          path="/esqueci-senha"
          element={
            <PublicRoute isAuthenticated={isAuth}>
              <ForgotPasswordScreen />
            </PublicRoute>
          }
        />
        <Route
          path="/dashboard/:menuId?"
          element={
            <PrivateRoute isAuthenticated={isAuth}>
              <ViewsProvider>
                <DashboardV1 />
              </ViewsProvider>
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
