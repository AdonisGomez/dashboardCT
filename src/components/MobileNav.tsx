import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  X, 
  LayoutDashboard, 
  Users, 
  FileText, 
  Bell, 
  Database, 
  Terminal, 
  AlertTriangle, 
  BarChart3, 
  Key, 
  Activity, 
  Clock,
  Home,
  MoreHorizontal
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', description: 'Vista general' },
  { to: '/clientes', icon: Users, label: 'Clientes', description: 'Gestión de clientes' },
  { to: '/dte', icon: FileText, label: 'DTE', description: 'Monitoreo en tiempo real' },
  { to: '/alertas', icon: Bell, label: 'Alertas', description: 'Notificaciones' },
  { to: '/bases-datos', icon: Database, label: 'Base de Datos', description: 'Estado de MongoDB' },
  { to: '/timeline', icon: Clock, label: 'Timeline', description: 'Historial' },
  { to: '/logs', icon: Terminal, label: 'Logs', description: 'Registros' },
  { to: '/errores', icon: AlertTriangle, label: 'Errores', description: 'Errores agrupados' },
  { to: '/api-analytics', icon: BarChart3, label: 'Analytics', description: 'Métricas de API' },
  { to: '/api-keys', icon: Key, label: 'API Keys', description: 'Claves de acceso' },
  { to: '/system-health', icon: Activity, label: 'Sistema', description: 'Salud del sistema' },
]

// Items principales para la barra inferior
const bottomNavItems = [
  { to: '/dashboard', icon: Home, label: 'Inicio' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/dte', icon: FileText, label: 'DTE' },
  { to: '/alertas', icon: Bell, label: 'Alertas' },
]

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  // Cerrar el menú cuando cambia la ruta
  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  // Prevenir scroll del body cuando el menú está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      {/* Barra de navegación inferior fija - Solo móvil */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/50 safe-bottom">
        <div className="flex items-center justify-around px-2 py-1">
          {bottomNavItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to || 
              (to === '/dashboard' && location.pathname === '/')
            return (
              <NavLink
                key={to}
                to={to}
                className="flex flex-col items-center py-2 px-3 min-w-[60px]"
              >
                <div className={`p-1.5 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-sky-600/20' 
                    : ''
                }`}>
                  <Icon className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-sky-400' : 'text-slate-500'
                  }`} />
                </div>
                <span className={`text-[10px] mt-0.5 font-medium transition-colors ${
                  isActive ? 'text-sky-400' : 'text-slate-500'
                }`}>
                  {label}
                </span>
              </NavLink>
            )
          })}
          
          {/* Botón Más */}
          <button
            onClick={() => setIsOpen(true)}
            className="flex flex-col items-center py-2 px-3 min-w-[60px]"
          >
            <div className="p-1.5">
              <MoreHorizontal className="w-5 h-5 text-slate-500" />
            </div>
            <span className="text-[10px] mt-0.5 font-medium text-slate-500">Más</span>
          </button>
        </div>
      </nav>

      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md transition-opacity duration-300 lg:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer desde abajo */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 max-h-[85vh] bg-slate-900 rounded-t-3xl border-t border-slate-800/50 shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle para cerrar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-slate-700 rounded-full" />
        </div>

        {/* Header del drawer */}
        <div className="flex items-center justify-between px-5 pb-4 border-b border-slate-800/50">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Menú</h2>
            <p className="text-xs text-slate-500">Todas las secciones</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2.5 bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Grid de navegación */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-3 gap-3">
            {navItems.map(({ to, icon: Icon, label }) => {
              const isActive = location.pathname === to
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={`flex flex-col items-center p-4 rounded-2xl transition-all active:scale-95 ${
                    isActive
                      ? 'bg-sky-600/20 border border-sky-500/30'
                      : 'bg-slate-800/40 border border-slate-700/30'
                  }`}
                >
                  <div className={`p-3 rounded-xl mb-2 ${
                    isActive ? 'bg-sky-600/30' : 'bg-slate-700/50'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      isActive ? 'text-sky-400' : 'text-slate-400'
                    }`} />
                  </div>
                  <span className={`text-xs font-medium text-center ${
                    isActive ? 'text-sky-300' : 'text-slate-300'
                  }`}>
                    {label}
                  </span>
                </NavLink>
              )
            })}
          </div>
        </div>

        {/* Footer con versión */}
        <div className="px-5 py-3 border-t border-slate-800/50">
          <p className="text-center text-[10px] text-slate-600">
            DTE Admin v2.0 • Sistema de Facturación
          </p>
        </div>
      </div>
    </>
  )
}
