import { Lock, ShieldX } from 'lucide-react'
import { Link } from 'react-router-dom'

interface RestrictedAccessProps {
  title?: string
  message?: string
}

export default function RestrictedAccess({ 
  title = "Acceso Restringido",
  message = "Tu usuario tiene permisos de solo lectura. No tienes acceso a esta sección por razones de seguridad."
}: RestrictedAccessProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/30 max-w-md text-center">
        <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold text-slate-100 mb-3">{title}</h2>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        <div className="flex items-center justify-center gap-2 text-xs text-slate-600 mb-6">
          <Lock className="w-3.5 h-3.5" />
          <span>Usuario: Viewer (Solo Lectura)</span>
        </div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl transition-all"
        >
          Volver al Dashboard
        </Link>
      </div>
    </div>
  )
}

