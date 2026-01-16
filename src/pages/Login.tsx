import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Lock, User, ArrowRight, Shield } from 'lucide-react'

export default function Login() {
  const [username, setUsername] = useState('viewer')
  const [password, setPassword] = useState('1234')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const success = await login(username, password)
      if (success) {
        navigate('/dashboard')
      } else {
        setError('Credenciales inválidas')
      }
    } catch (err) {
      setError('Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center bg-theme-primary px-4 py-8 transition-colors duration-300">
      {/* Fondo con patrón sutil */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/30 via-transparent to-transparent dark:from-slate-900/50 pointer-events-none" />
      
      <div className="relative w-full max-w-[360px] sm:max-w-sm">
        {/* Logo y branding */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-5 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-theme-card border border-theme-primary">
            <img src="/static/logo.png" alt="Logo" className="w-full h-full object-contain p-2" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-theme-primary tracking-tight">DTE Admin</h1>
          <p className="text-sm text-theme-muted mt-1.5">Sistema de Facturación Electrónica</p>
        </div>

        {/* Card de login */}
        <div className="card p-5 sm:p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {error && (
              <div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center flex items-center justify-center gap-2">
                <Shield className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">Usuario</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-theme-muted" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-styled pl-11 sm:pl-12 py-3 sm:py-3.5 text-sm sm:text-base"
                  placeholder="Ingresa tu usuario"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-theme-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-styled pl-11 sm:pl-12 py-3 sm:py-3.5 text-sm sm:text-base"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 sm:py-3.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-sm sm:text-base font-semibold rounded-xl transition-all shadow-lg shadow-sky-600/25 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Ingresando...</span>
                </>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Demo hint */}
        <div className="mt-4 p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-center">
          <p className="text-xs text-sky-400">
            <span className="font-medium">Demo:</span> Usuario <span className="font-mono bg-sky-500/20 px-1.5 py-0.5 rounded">viewer</span> / Contraseña <span className="font-mono bg-sky-500/20 px-1.5 py-0.5 rounded">1234</span>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-theme-muted mt-6 sm:mt-8">
          © 2024 DTE Admin. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}
