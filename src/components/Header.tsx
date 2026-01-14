import { useState, useEffect, memo } from 'react'
import { Search, Server, Bell, User, Settings } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import api from '../services/api'
import GlobalSearch from './GlobalSearch'
import NotificationSettings from './NotificationSettings'
import { useNotifications } from '../hooks/useNotifications'

const Header = memo(function Header() {
  const { username, logout } = useAuthStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  useNotifications() // Inicializar sistema de notificaciones

  // Atajo de teclado Ctrl+K para búsqueda
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    // Cargar notificaciones
    const loadNotifications = async () => {
      try {
        const response = await api.get('/alertas/api', { timeout: 20000 })
        if (response.data.success) {
          const unread = response.data.alertas?.filter((a: any) => !a.leida).length || 0
          setUnreadCount(unread)
        }
      } catch (error: any) {
        // Solo loggear errores que no sean timeout
        if (error.code !== 'ECONNABORTED' && error.message !== 'timeout of 20000ms exceeded') {
          console.error('Error loading notifications:', error)
        }
      }
    }
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  return (
    <header className="glass-effect border-b border-slate-700/50 shadow-2xl sticky top-0 z-50">
      <div className="bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              <div className="relative group">
                <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 transform group-hover:scale-110 transition-all duration-200">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-sm" />
                </div>
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold gradient-text tracking-tight">DTE ADMIN</h1>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-slate-400">DTE Admin</span>
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                </div>
              </div>
            </div>

            {/* Búsqueda - Móvil */}
            <div className="flex-1 max-w-xs mx-2 sm:hidden">
              <button
                onClick={() => setSearchOpen(true)}
                className="w-full flex items-center px-3 py-1.5 bg-slate-800/80 border border-slate-700/50 rounded-lg text-xs text-slate-300 hover:border-blue-500/50 transition-all"
              >
                <Search className="w-3.5 h-3.5 mr-2 text-slate-400" />
                <span className="flex-1 text-left truncate">Buscar...</span>
              </button>
            </div>

            {/* Búsqueda - Desktop */}
            <div className="hidden lg:flex flex-1 max-w-lg mx-6">
              <div className="relative w-full">
                <button
                  onClick={() => setSearchOpen(true)}
                  className="w-full flex items-center px-4 py-2 bg-slate-800/80 border border-slate-700/50 rounded-lg text-sm text-slate-300 hover:border-blue-500/50 transition-all"
                >
                  <Search className="w-4 h-4 mr-3 text-slate-400" />
                  <span className="flex-1 text-left">Buscar clientes, DTE...</span>
                  <kbd className="hidden xl:inline-flex items-center px-2 py-1 text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-700 rounded">
                    Ctrl+K
                  </kbd>
                </button>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              {/* Estado del Sistema */}
              <div className="relative">
                <button
                  onClick={() => setStatsOpen(!statsOpen)}
                  className="relative p-2 rounded-lg bg-slate-800/80 border border-slate-700/50 hover:border-blue-500/50 transition-all"
                >
                  <Server className="w-5 h-5 text-blue-400" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse" />
                </button>
                {statsOpen && (
                  <div className="absolute top-full right-0 mt-2 w-60 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl p-4 z-50">
                    <div className="text-xs font-semibold text-slate-400 mb-3">Estado del Sistema</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">Servicios</span>
                        <span className="text-sm font-bold text-emerald-400">Operativo</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">MongoDB</span>
                        <span className="text-sm font-bold text-emerald-400">Conectado</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">Docker</span>
                        <span className="text-sm font-bold text-emerald-400">Activo</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notificaciones */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 rounded-lg bg-slate-800/80 border border-slate-700/50 hover:border-amber-500/50 transition-all"
                >
                  <Bell className="w-5 h-5 text-amber-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs font-bold text-white flex items-center justify-center border-2 border-slate-900">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {notificationsOpen && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl p-4 z-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold text-slate-200">Notificaciones</div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setNotificationsOpen(false)
                            setSettingsOpen(true)
                          }}
                          className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Configuración"
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                        </button>
                        <button className="text-xs text-blue-400 hover:text-blue-300">Marcar todas</button>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 text-center py-4">No hay notificaciones nuevas</div>
                  </div>
                )}
              </div>

              {/* Menú de Usuario */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-blue-400 transition-all"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md mr-2">
                    <span className="text-xs font-bold text-white">
                      {username?.[0]?.toUpperCase() || 'A'}
                    </span>
                  </div>
                  <span className="hidden md:inline">{username || 'Admin'}</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="p-3 border-b border-slate-700">
                      <p className="text-sm font-semibold text-slate-200">{username || 'Administrador'}</p>
                      <p className="text-xs text-slate-400">{username || 'admin'}@example.com</p>
                    </div>
                    <div className="py-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
                      >
                        <User className="w-5 h-5 mr-2" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <NotificationSettings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </header>
  )
})

export default Header

