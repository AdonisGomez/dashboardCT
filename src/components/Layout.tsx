import { Outlet, useLocation } from 'react-router-dom'
import { memo, useEffect } from 'react'
import Header from './Header'
import Navigation from './Navigation'
import MobileNav from './MobileNav'

// Componente Layout optimizado con memo y transiciones
const Layout = memo(function Layout() {
  const location = useLocation()

  // Scroll to top en cambio de ruta
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  return (
    <div className="min-h-screen min-h-[100dvh] bg-theme-primary transition-colors duration-200">
      <Header />
      {/* Navigation solo visible en desktop */}
      <div className="hidden lg:block">
        <Navigation />
      </div>
      <main 
        className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 pb-20 lg:pb-6"
        key={location.pathname}
      >
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>
      <MobileNav />
    </div>
  )
})

export default Layout
