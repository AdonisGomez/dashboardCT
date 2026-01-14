import { Outlet, useLocation } from 'react-router-dom'
import { memo, useEffect } from 'react'
import Header from './Header'
import Navigation from './Navigation'

// Componente Layout optimizado con memo y transiciones
const Layout = memo(function Layout() {
  const location = useLocation()

  // Scroll to top en cambio de ruta
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      <Navigation />
      <main 
        className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6"
        key={location.pathname}
      >
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
})

export default Layout

