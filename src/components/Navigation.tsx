import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, FileText, Bell, Database, Terminal, AlertTriangle, BarChart3, Key, Activity, Clock } from 'lucide-react'
import { memo } from 'react'

const Navigation = memo(function Navigation() {
  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', shortLabel: 'Dash' },
    { to: '/clientes', icon: Users, label: 'Clientes', shortLabel: 'Clientes' },
    { to: '/dte', icon: FileText, label: 'DTE', shortLabel: 'DTE' },
    { to: '/alertas', icon: Bell, label: 'Alertas', shortLabel: 'Alertas' },
    { to: '/bases-datos', icon: Database, label: 'Base de Datos', shortLabel: 'BD' },
    { to: '/timeline', icon: Clock, label: 'Timeline', shortLabel: 'Time' },
    { to: '/logs', icon: Terminal, label: 'Logs', shortLabel: 'Logs' },
    { to: '/errores', icon: AlertTriangle, label: 'Errores', shortLabel: 'Errores' },
    { to: '/api-analytics', icon: BarChart3, label: 'Analytics', shortLabel: 'Stats' },
    { to: '/api-keys', icon: Key, label: 'API Keys', shortLabel: 'Keys' },
    { to: '/system-health', icon: Activity, label: 'Sistema', shortLabel: 'Health' },
  ]

  return (
    <div className="hidden lg:block nav-bg border-b border-theme-primary overflow-x-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <nav className="flex items-center gap-1 h-11 min-w-max">
          {navItems.map(({ to, icon: Icon, label, shortLabel }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-slate-800/60 text-slate-100' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`
              }
            >
              <Icon className="w-4 h-4 mr-2" />
              <span className="hidden lg:inline">{label}</span>
              <span className="lg:hidden">{shortLabel}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
})

export default Navigation
