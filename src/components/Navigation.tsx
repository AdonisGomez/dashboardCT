import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, FileText, Bell, Database, Terminal, AlertTriangle, BarChart3, Key, Activity, Clock } from 'lucide-react'
import { memo } from 'react'

const Navigation = memo(function Navigation() {
  // Prefetch deshabilitado - causaba errores 404
  // Las rutas de React Router se cargan automáticamente cuando se navega
  // useEffect(() => {
  //   const prefetchRoutes = () => {
  //     const routes = ['/dashboard', '/clientes', '/dte', '/alertas', '/bases-datos']
  //     routes.forEach(route => {
  //       const link = document.createElement('link')
  //       link.rel = 'prefetch'
  //       link.href = route
  //       document.head.appendChild(link)
  //     })
  //   }
  //   setTimeout(prefetchRoutes, 2000)
  // }, [])

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800/50 overflow-x-auto">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <nav className="flex items-center space-x-1 sm:space-x-2 h-12 min-w-max">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `inline-flex items-center px-2 sm:px-3 md:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all relative group whitespace-nowrap ${
                isActive ? 'text-blue-400' : 'text-slate-300 hover:text-slate-100'
              }`
            }
          >
            <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Dashboard</span>
            <span className="sm:hidden">Dash</span>
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform" />
          </NavLink>

          <NavLink
            to="/clientes"
            className={({ isActive }) =>
              `inline-flex items-center px-2 sm:px-3 md:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all relative group whitespace-nowrap ${
                isActive ? 'text-blue-400' : 'text-slate-300 hover:text-slate-100'
              }`
            }
          >
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span>Clientes</span>
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform" />
          </NavLink>

          <NavLink
            to="/dte"
            className={({ isActive }) =>
              `inline-flex items-center px-2 sm:px-3 md:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all relative group whitespace-nowrap ${
                isActive ? 'text-blue-400' : 'text-slate-300 hover:text-slate-100'
              }`
            }
          >
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span>DTE</span>
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform" />
          </NavLink>

          <NavLink
            to="/alertas"
            className={({ isActive }) =>
              `inline-flex items-center px-2 sm:px-3 md:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all relative group whitespace-nowrap ${
                isActive ? 'text-blue-400' : 'text-slate-300 hover:text-slate-100'
              }`
            }
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span>Alertas</span>
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform" />
          </NavLink>

          <NavLink
            to="/bases-datos"
            className={({ isActive }) =>
              `inline-flex items-center px-2 sm:px-3 md:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all relative group whitespace-nowrap ${
                isActive ? 'text-blue-400' : 'text-slate-300 hover:text-slate-100'
              }`
            }
          >
            <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Bases de Datos</span>
            <span className="sm:hidden">BD</span>
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform" />
          </NavLink>

          <NavLink
            to="/timeline"
            className={({ isActive }) =>
              `inline-flex items-center px-2 sm:px-3 md:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all relative group whitespace-nowrap ${
                isActive ? 'text-blue-400' : 'text-slate-300 hover:text-slate-100'
              }`
            }
          >
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Timeline</span>
            <span className="sm:hidden">Time</span>
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform" />
          </NavLink>

          <NavLink
            to="/logs"
            className={({ isActive }) =>
              `inline-flex items-center px-2 sm:px-3 md:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all relative group whitespace-nowrap ${
                isActive ? 'text-blue-400' : 'text-slate-300 hover:text-slate-100'
              }`
            }
          >
            <Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span>Logs</span>
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform" />
          </NavLink>

          <NavLink
            to="/errores"
            className={({ isActive }) =>
              `inline-flex items-center px-2 sm:px-3 md:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all relative group whitespace-nowrap ${
                isActive ? 'text-blue-400' : 'text-slate-300 hover:text-slate-100'
              }`
            }
          >
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span>Errores</span>
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform" />
          </NavLink>

          <NavLink
            to="/api-analytics"
            className={({ isActive }) =>
              `inline-flex items-center px-2 sm:px-3 md:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all relative group whitespace-nowrap ${
                isActive ? 'text-blue-400' : 'text-slate-300 hover:text-slate-100'
              }`
            }
          >
            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">API Analytics</span>
            <span className="sm:hidden">Analytics</span>
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform" />
          </NavLink>

          <NavLink
            to="/api-keys"
            className={({ isActive }) =>
              `inline-flex items-center px-2 sm:px-3 md:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all relative group whitespace-nowrap ${
                isActive ? 'text-blue-400' : 'text-slate-300 hover:text-slate-100'
              }`
            }
          >
            <Key className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">API Keys</span>
            <span className="sm:hidden">Keys</span>
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform" />
          </NavLink>

          <NavLink
            to="/system-health"
            className={({ isActive }) =>
              `inline-flex items-center px-2 sm:px-3 md:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all relative group whitespace-nowrap ${
                isActive ? 'text-blue-400' : 'text-slate-300 hover:text-slate-100'
              }`
            }
          >
            <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">System Health</span>
            <span className="sm:hidden">Health</span>
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform" />
          </NavLink>
        </nav>
      </div>
    </div>
  )
})

export default Navigation

