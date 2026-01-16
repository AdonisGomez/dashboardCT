import { useState, useEffect, memo } from 'react'
import { Search, Server, Bell, LogOut, Eye } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import api from '../services/api'
import GlobalSearch from './GlobalSearch'
import NotificationSettings from './NotificationSettings'
import { useNotifications } from '../hooks/useNotifications'

const Header = memo(function Header() {
  const { username, role, logout } = useAuthStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  useNotifications()

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
    const loadNotifications = async () => {
      try {
        const response = await api.get('/alertas/api', { timeout: 20000 })
        if (response.data.success) {
          const unread = response.data.alertas?.filter((a: any) => !a.leida).length || 0
          setUnreadCount(unread)
        }
      } catch (error: any) {
        if (error.code !== 'ECONNABORTED' && error.message !== 'timeout of 20000ms exceeded') {
          console.error('Error loading notifications:', error)
        }
      }
    }
    loadNotifications()
    // Reducir frecuencia de polling en móvil
    const isMobile = window.innerWidth < 768
    const interval = setInterval(loadNotifications, isMobile ? 60000 : 30000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => {
      setStatsOpen(false)
      setNotificationsOpen(false)
      setUserMenuOpen(false)
    }
    if (statsOpen || notificationsOpen || userMenuOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [statsOpen, notificationsOpen, userMenuOpen])

  return (
    <header className="header-bg sticky top-0 z-50 safe-top">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12 sm:h-14">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="relative">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden bg-theme-card border border-theme-primary">
                <img src="/static/logo.png" alt="Logo" className="w-full h-full object-contain p-0.5" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-theme-secondary" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-semibold text-theme-primary tracking-tight">DTE Admin</h1>
              <p className="text-[10px] text-theme-muted hidden sm:block">Sistema de Facturación</p>
            </div>
          </div>

          {/* Búsqueda - Desktop */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <button
              onClick={(e) => { e.stopPropagation(); setSearchOpen(true) }}
              className="w-full flex items-center px-4 py-2 bg-slate-800/50 border border-slate-700/40 rounded-xl text-sm text-slate-400 hover:border-slate-600 transition-all"
            >
              <Search className="w-4 h-4 mr-3 text-slate-500" />
              <span className="flex-1 text-left">Buscar clientes, DTE...</span>
              <kbd className="hidden lg:inline-flex items-center px-2 py-0.5 text-xs text-slate-500 bg-slate-800 border border-slate-700 rounded">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Búsqueda móvil */}
          <button
            onClick={(e) => { e.stopPropagation(); setSearchOpen(true) }}
            className="md:hidden p-2 rounded-xl bg-slate-800/50 border border-slate-700/40 active:scale-95 transition-all"
          >
            <Search className="w-4 h-4 text-slate-400" />
          </button>

          {/* Acciones */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Estado */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setStatsOpen(!statsOpen) }}
                className="p-2 rounded-lg hover:bg-slate-800/60 transition-all relative"
              >
                <Server className="w-4 h-4 text-slate-400" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              </button>
              {statsOpen && (
                <div className="absolute top-full right-0 mt-2 w-52 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl p-4 z-50">
                  <div className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wider">Estado</div>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Servicios', status: 'Activo' },
                      { label: 'MongoDB', status: 'Conectado' },
                      { label: 'Docker', status: 'Operativo' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">{item.label}</span>
                        <span className="text-xs font-medium text-emerald-400">{item.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notificaciones */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setNotificationsOpen(!notificationsOpen) }}
                className="p-2 rounded-lg hover:bg-slate-800/60 transition-all relative"
              >
                <Bell className="w-4 h-4 text-slate-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl p-4 z-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-200">Notificaciones</span>
                  </div>
                  <div className="text-xs text-slate-500 text-center py-6">Sin notificaciones nuevas</div>
                </div>
              )}
            </div>

            {/* Usuario */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setUserMenuOpen(!userMenuOpen) }}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800/60 transition-all"
              >
                <div className="w-7 h-7 bg-slate-700 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-semibold text-slate-300">
                    {username?.[0]?.toUpperCase() || 'A'}
                  </span>
                </div>
                <span className="hidden md:block text-sm text-slate-300">{username || 'Admin'}</span>
                {role === 'viewer' && (
                  <span className="hidden md:flex items-center gap-1 px-2 py-0.5 bg-slate-700/50 rounded-md text-[10px] text-slate-400">
                    <Eye className="w-3 h-3" /> Viewer
                  </span>
                )}
              </button>
              {userMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-3 border-b border-slate-700/50">
                    <p className="text-sm font-medium text-slate-200">{username || 'Usuario'}</p>
                    {role === 'viewer' && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                        <Eye className="w-3 h-3" /> Solo lectura
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </button>
                </div>
              )}
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
