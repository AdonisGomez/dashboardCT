import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState, Suspense, lazy } from 'react'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import Login from './pages/Login'

// Lazy loading de páginas para code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Clientes = lazy(() => import('./pages/Clientes'))
const ClienteDetail = lazy(() => import('./pages/ClienteDetail'))
const ClienteForm = lazy(() => import('./pages/ClienteForm'))
const DTEList = lazy(() => import('./pages/DTEList'))
const Alertas = lazy(() => import('./pages/Alertas'))
const BasesDatos = lazy(() => import('./pages/BasesDatos'))
const Logs = lazy(() => import('./pages/Logs'))
const Errores = lazy(() => import('./pages/Errores'))
const ApiAnalytics = lazy(() => import('./pages/ApiAnalytics'))
const ApiKeys = lazy(() => import('./pages/ApiKeys'))
const SystemHealth = lazy(() => import('./pages/SystemHealth'))
const TimelineActividad = lazy(() => import('./pages/TimelineActividad'))

// Componente de carga optimizado
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <div className="text-slate-400 text-sm">Cargando...</div>
    </div>
  </div>
)

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, checkAuth } = useAuthStore()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Verificar sesión al cargar
    const verifySession = async () => {
      try {
        await checkAuth()
      } catch (error) {
        console.error('Error verifying session:', error)
      } finally {
        setChecking(false)
      }
    }
    verifySession()
  }, [checkAuth])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-slate-400">Verificando sesión...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route 
            path="dashboard" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <Dashboard />
              </Suspense>
            } 
          />
          <Route 
            path="clientes" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <Clientes />
              </Suspense>
            } 
          />
          <Route 
            path="clientes/nuevo" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <ClienteForm />
              </Suspense>
            } 
          />
          <Route 
            path="clientes/:nit" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <ClienteDetail />
              </Suspense>
            } 
          />
          <Route 
            path="dte" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <DTEList />
              </Suspense>
            } 
          />
          <Route 
            path="alertas" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <Alertas />
              </Suspense>
            } 
          />
          <Route 
            path="bases-datos" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <BasesDatos />
              </Suspense>
            } 
          />
          <Route 
            path="logs" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <Logs />
              </Suspense>
            } 
          />
          <Route 
            path="errores" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <Errores />
              </Suspense>
            } 
          />
          <Route 
            path="api-analytics" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <ApiAnalytics />
              </Suspense>
            } 
          />
          <Route 
            path="api-keys" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <ApiKeys />
              </Suspense>
            } 
          />
          <Route 
            path="system-health" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <SystemHealth />
              </Suspense>
            } 
          />
          <Route 
            path="timeline" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <TimelineActividad />
              </Suspense>
            } 
          />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App

