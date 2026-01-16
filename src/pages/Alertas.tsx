import { useState, useEffect } from 'react'
import {
  AlertTriangle,
  XCircle,
  CheckCircle,
  RefreshCw,
  Server,
  FileX,
  Activity,
  Clock,
  Filter,
  X,
  Database,
} from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../stores/authStore'
import RestrictedAccess from '../components/RestrictedAccess'

interface Alerta {
  tipo: string
  severidad: 'alta' | 'media' | 'baja' | 'critica'
  mensaje: string
  timestamp: string
  contenedor?: string
  servicio?: string
  nit?: string
  estado?: string
  cliente_id?: string
  codigo_generacion?: string
  error?: string
  ambiente?: string
  servidor?: string
  nodo?: string
  replica_set?: string
  lag_segundos?: number
  total_miembros?: number
}

export default function Alertas() {
  const { role } = useAuthStore()
  
  // Bloquear acceso a viewers
  if (role === 'viewer') {
    return <RestrictedAccess title="Alertas - Acceso Bloqueado" message="Las alertas del sistema contienen información técnica y de seguridad. Solo los administradores pueden acceder a esta sección." />
  }
  
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroSeveridad, setFiltroSeveridad] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    loadAlertas()

    // Auto-refresh cada 10 segundos si está habilitado
    let interval: ReturnType<typeof setInterval> | null = null
    if (autoRefresh) {
      interval = setInterval(() => {
        loadAlertas()
      }, 10000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const loadAlertas = async () => {
    try {
      const response = await api.get('/alertas/api')
      if (response.data.success) {
        setAlertas(response.data.alertas || [])
      }
    } catch (error) {
      console.error('Error cargando alertas:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'contenedor_detenido':
        return <Server className="w-5 h-5" />
      case 'contenedor_problema':
        return <Activity className="w-5 h-5" />
      case 'dte_error':
        return <FileX className="w-5 h-5" />
      case 'mongodb_desconectado':
      case 'mongodb_sin_primary':
      case 'mongodb_rollback':
      case 'mongodb_nodo_desconectado':
      case 'mongodb_nodo_no_saludable':
      case 'mongodb_lag_replicacion':
      case 'mongodb_sin_secondaries':
      case 'mongodb_error_verificacion':
        return <Database className="w-5 h-5" />
      default:
        return <AlertTriangle className="w-5 h-5" />
    }
  }

  const getSeveridadColor = (severidad: string) => {
    switch (severidad) {
      case 'critica':
        return 'bg-red-600/20 text-red-500 border-red-600/30'
      case 'alta':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'media':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'baja':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default:
        return 'bg-slate-700 text-slate-400 border-slate-600'
    }
  }

  const getTipoNombre = (tipo: string) => {
    switch (tipo) {
      case 'contenedor_detenido':
        return 'Contenedor Detenido'
      case 'contenedor_problema':
        return 'Problema de Contenedor'
      case 'dte_error':
        return 'DTE con Error'
      case 'mongodb_desconectado':
        return 'MongoDB Desconectado'
      case 'mongodb_sin_primary':
        return 'MongoDB Sin PRIMARY'
      case 'mongodb_rollback':
        return 'MongoDB en ROLLBACK'
      case 'mongodb_nodo_desconectado':
        return 'Nodo MongoDB Desconectado'
      case 'mongodb_nodo_no_saludable':
        return 'Nodo MongoDB No Saludable'
      case 'mongodb_lag_replicacion':
        return 'Lag de Replicación'
      case 'mongodb_sin_secondaries':
        return 'Sin Nodos SECONDARY'
      case 'mongodb_error_verificacion':
        return 'Error Verificando MongoDB'
      default:
        return tipo.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    }
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return 'Hace unos segundos'
      if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`
      if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`
      if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`
      
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return timestamp
    }
  }

  // Filtrar alertas
  const alertasFiltradas = alertas.filter((alerta) => {
    if (filtroTipo && alerta.tipo !== filtroTipo) return false
    if (filtroSeveridad && alerta.severidad !== filtroSeveridad) return false
    return true
  })

  // Estadísticas
  const totalAlertas = alertas.length
  const alertasAltas = alertas.filter((a) => a.severidad === 'alta').length
  const alertasMedias = alertas.filter((a) => a.severidad === 'media').length
  const contenedoresDetenidos = alertas.filter((a) => a.tipo === 'contenedor_detenido').length
  const dteConError = alertas.filter((a) => a.tipo === 'dte_error').length

  // Tipos únicos para el filtro
  const tiposUnicos = Array.from(new Set(alertas.map((a) => a.tipo)))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">Alertas del Sistema</h1>
          <p className="text-sm text-slate-500 mt-1">Monitoreo de problemas y notificaciones</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              autoRefresh
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800/60 text-slate-400 border border-slate-700/50'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto' : 'Manual'}
          </button>
          <button
            onClick={loadAlertas}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 text-slate-300 text-sm font-medium rounded-xl transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">Total</p>
              <p className="text-2xl font-semibold text-slate-100">{totalAlertas}</p>
            </div>
            <AlertTriangle className="w-6 h-6 text-slate-600" />
          </div>
        </div>
        <div className="bg-red-500/10 rounded-2xl p-5 border border-red-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-400 mb-1">Alta</p>
              <p className="text-2xl font-semibold text-red-400">{alertasAltas}</p>
            </div>
            <XCircle className="w-6 h-6 text-red-500/50" />
          </div>
        </div>
        <div className="bg-amber-500/10 rounded-2xl p-5 border border-amber-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-400 mb-1">Media</p>
              <p className="text-2xl font-semibold text-amber-400">{alertasMedias}</p>
            </div>
            <AlertTriangle className="w-6 h-6 text-amber-500/50" />
          </div>
        </div>
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">Contenedores</p>
              <p className="text-2xl font-semibold text-slate-100">{contenedoresDetenidos}</p>
            </div>
            <Server className="w-6 h-6 text-slate-600" />
          </div>
        </div>
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">DTE Error</p>
              <p className="text-2xl font-semibold text-slate-100">{dteConError}</p>
            </div>
            <FileX className="w-6 h-6 text-slate-600" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/30">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-400">Filtros:</span>
          </div>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-4 py-2 bg-slate-900/60 border border-slate-700/50 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-slate-600"
          >
            <option value="">Todos los tipos</option>
            {tiposUnicos.map((tipo) => (
              <option key={tipo} value={tipo}>
                {getTipoNombre(tipo)}
              </option>
            ))}
          </select>
          <select
            value={filtroSeveridad}
            onChange={(e) => setFiltroSeveridad(e.target.value)}
            className="px-4 py-2 bg-slate-900/60 border border-slate-700/50 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-slate-600"
          >
            <option value="">Todas las severidades</option>
            <option value="critica">Crítica</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
          {(filtroTipo || filtroSeveridad) && (
            <button
              onClick={() => {
                setFiltroTipo('')
                setFiltroSeveridad('')
              }}
              className="inline-flex items-center gap-1 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-slate-300 text-sm rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Lista de Alertas */}
      {loading ? (
        <div className="bg-slate-800/40 rounded-2xl p-12 border border-slate-700/30">
          <div className="flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-2 border-slate-700 border-t-slate-400 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 text-sm">Cargando alertas...</p>
          </div>
        </div>
      ) : alertasFiltradas.length === 0 ? (
        <div className="bg-slate-800/40 rounded-2xl p-12 border border-slate-700/30">
          <div className="flex flex-col items-center justify-center">
            <CheckCircle className="w-14 h-14 text-emerald-500/40 mb-4" />
            <p className="text-lg font-semibold text-slate-100 mb-2">Sin alertas</p>
            <p className="text-sm text-slate-500 text-center max-w-md">
              {totalAlertas === 0
                ? 'El sistema está funcionando correctamente.'
                : 'No hay alertas que coincidan con los filtros.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {alertasFiltradas.map((alerta, index) => (
            <div
              key={index}
              className={`rounded-2xl p-5 border transition-all ${
                alerta.severidad === 'critica'
                  ? 'bg-red-500/10 border-red-500/30'
                  : alerta.severidad === 'alta'
                  ? 'bg-red-500/5 border-red-500/20'
                  : alerta.severidad === 'media'
                  ? 'bg-amber-500/5 border-amber-500/20'
                  : 'bg-sky-500/5 border-sky-500/20'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start mb-2 sm:mb-3">
                    <div
                      className={`p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3 flex-shrink-0 ${
                        alerta.severidad === 'critica'
                          ? 'bg-red-600/20 text-red-500'
                          : alerta.severidad === 'alta'
                          ? 'bg-red-500/20 text-red-400'
                          : alerta.severidad === 'media'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {getIcon(alerta.tipo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        <span
                          className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getSeveridadColor(
                            alerta.severidad
                          )}`}
                        >
                          {alerta.severidad.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-400">{getTipoNombre(alerta.tipo)}</span>
                        {alerta.ambiente && (
                          <span
                            className={`text-xs px-1.5 sm:px-2 py-0.5 rounded ${
                              alerta.ambiente === 'produccion'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {alerta.ambiente.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm sm:text-base text-slate-100 font-medium mb-2 break-words">{alerta.mensaje}</p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-slate-400">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimestamp(alerta.timestamp)}
                        </div>
                        {alerta.nit && (
                          <div className="flex items-center">
                            <span className="break-all">NIT: {alerta.nit}</span>
                          </div>
                        )}
                        {alerta.cliente_id && (
                          <div className="flex items-center">
                            <span className="break-all">Cliente: {alerta.cliente_id}</span>
                          </div>
                        )}
                        {alerta.contenedor && (
                          <div className="flex items-center min-w-0">
                            <Server className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{alerta.contenedor}</span>
                          </div>
                        )}
                      </div>
                      {alerta.error && (
                        <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                          <p className="text-xs text-slate-400 mb-1">Detalle del error:</p>
                          <p className="text-xs sm:text-sm text-red-400 font-mono break-words">{alerta.error}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
