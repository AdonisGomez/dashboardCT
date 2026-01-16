import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState, Suspense, lazy, memo, useCallback } from 'react'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import { PageSkeleton } from './components/Skeleton'

// Lazy loading de páginas con preload
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

// Preload de rutas críticas en background
const preloadCriticalRoutes = () => {
  // Preload después de 1 segundo de inactividad
  setTimeout(() => {
    import('./pages/Dashboard')
    import('./pages/Clientes')
    import('./pages/DTEList')
  }, 1000)
}

// Loading skeleton ultraligero
const QuickLoader = memo(() => (
  <div className="p-4 sm:p-6">
    <PageSkeleton />
  </div>
))

// Verificación de sesión inline (sin re-render)
const PrivateRoute = memo(function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, checkAuth } = useAuthStore()
  const [status, setStatus] = useState<'checking' | 'done'>('checking')

  const verify = useCallback(async () => {
    try {
      await checkAuth()
    } catch {
      // Silent fail
    } finally {
      setStatus('done')
    }
  }, [checkAuth])

  useEffect(() => {
    verify()
    // Preload rutas después de autenticación
    preloadCriticalRoutes()
  }, [verify])

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-primary">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">Verificando...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
})

// Wrapper de ruta con Suspense optimizado
const RouteWrapper = memo(({ component: Component }: { component: React.ComponentType }) => (
  <Suspense fallback={<QuickLoader />}>
    <Component />
  </Suspense>
))

function App() {
  return (
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
        <Route path="dashboard" element={<RouteWrapper component={Dashboard} />} />
        <Route path="clientes" element={<RouteWrapper component={Clientes} />} />
        <Route path="clientes/nuevo" element={<RouteWrapper component={ClienteForm} />} />
        <Route path="clientes/:nit" element={<RouteWrapper component={ClienteDetail} />} />
        <Route path="dte" element={<RouteWrapper component={DTEList} />} />
        <Route path="alertas" element={<RouteWrapper component={Alertas} />} />
        <Route path="bases-datos" element={<RouteWrapper component={BasesDatos} />} />
        <Route path="logs" element={<RouteWrapper component={Logs} />} />
        <Route path="errores" element={<RouteWrapper component={Errores} />} />
        <Route path="api-analytics" element={<RouteWrapper component={ApiAnalytics} />} />
        <Route path="api-keys" element={<RouteWrapper component={ApiKeys} />} />
        <Route path="system-health" element={<RouteWrapper component={SystemHealth} />} />
        <Route path="timeline" element={<RouteWrapper component={TimelineActividad} />} />
      </Route>
    </Routes>
  )
}

export default App
