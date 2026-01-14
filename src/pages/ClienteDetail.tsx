import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Info,
  Server,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Heart,
  BarChart3,
  Play,
  Square,
  RotateCw,
  FileText,
  RefreshCw,
  Code,
  Key,
  Cloud,
  Network,
  Power,
  TrendingUp,
  Clock,
} from 'lucide-react'
import api from '../services/api'

export default function ClienteDetail() {
  const { nit } = useParams<{ nit: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const ambiente = searchParams.get('ambiente') || 'produccion'

  const [cliente, setCliente] = useState<any>(null)
  const [estadoContenedores, setEstadoContenedores] = useState<any>({})
  const [estadisticasDte, setEstadisticasDte] = useState<any>({})
  const [salud, setSalud] = useState<any>(null)
  const [erroresRecientes, setErroresRecientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    loadCliente()
    const interval = setInterval(loadCliente, 30000) // Actualizar cada 30 segundos
    return () => clearInterval(interval)
  }, [nit, ambiente])

  const loadCliente = async () => {
    try {
      const response = await api.get(`/clientes/${nit}/api?ambiente=${ambiente}`)
      const data = response.data
      setCliente(data.cliente)
      setEstadoContenedores(data.estado_contenedores || {})
      setEstadisticasDte(data.estadisticas_dte || {})
      setSalud(data.salud)
      setErroresRecientes(data.errores_recientes || [])
    } catch (error: any) {
      console.error('Error loading cliente:', error)
      if (error.response?.status === 404) {
        navigate('/clientes')
      }
    } finally {
      setLoading(false)
    }
  }

  const controlarServicio = async (accion: 'iniciar' | 'detener' | 'reiniciar') => {
    if (!nit || !cliente) return

    setActionLoading(accion)
    setNotification(null)

    try {
      const formData = new FormData()
      formData.append('ambiente', cliente.ambiente || ambiente)

      const response = await api.post(`/clientes/${nit}/${accion}/api`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      if (response.data.success) {
        setNotification({ message: response.data.message, type: 'success' })
        // Esperar un momento y actualizar estado
        setTimeout(() => {
          loadCliente()
        }, 2000)
      } else {
        setNotification({ message: response.data.error || 'Error al ejecutar acción', type: 'error' })
      }
    } catch (error: any) {
      setNotification({
        message: error.response?.data?.error || `Error al ${accion} servicios`,
        type: 'error',
      })
    } finally {
      setActionLoading(null)
      setTimeout(() => setNotification(null), 5000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400 text-lg">Cargando detalles del cliente...</div>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Cliente no encontrado</p>
        <Link to="/clientes" className="text-blue-400 hover:text-blue-300 mt-4 inline-block">
          Volver a clientes
        </Link>
      </div>
    )
  }

  const tasaExito = estadisticasDte?.tasa_exito || 0
  const tasaExitoColor =
    tasaExito >= 0.9 ? 'text-emerald-400' : tasaExito >= 0.7 ? 'text-amber-400' : 'text-red-400'
  const tasaExitoBg = tasaExito >= 0.9 ? 'bg-emerald-500' : tasaExito >= 0.7 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 md:mb-8">
        <div className="flex items-center space-x-2 sm:space-x-4 mb-3 sm:mb-0 w-full sm:w-auto">
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
            <span className="text-white font-bold text-lg sm:text-xl md:text-2xl">{nit?.substring(0, 2)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold gradient-text truncate">
                {cliente.nombre_comercial || cliente.nombre || nit}
              </h1>
              {cliente.ambiente && (
                <span
                  className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-xs font-semibold flex-shrink-0 ${
                    cliente.ambiente === 'produccion'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {cliente.ambiente === 'produccion' ? (
                    <Server className="w-3 h-3 mr-1" />
                  ) : (
                    <Key className="w-3 h-3 mr-1" />
                  )}
                  <span className="hidden sm:inline">{cliente.ambiente.toUpperCase()}</span>
                  <span className="sm:hidden">{cliente.ambiente === 'produccion' ? 'PROD' : 'TEST'}</span>
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-400 flex items-center">
              <Info className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              NIT: <span className="font-mono ml-1 break-all">{nit}</span>
            </p>
          </div>
        </div>
        <Link
          to={`/clientes?ambiente=${cliente.ambiente || 'todos'}`}
          className="w-full sm:w-auto mt-2 sm:mt-0 inline-flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:border-blue-500 transition-all transform hover:scale-105"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
          Volver
        </Link>
      </div>

      {/* Notificación */}
      {notification && (
        <div
          className={`card rounded-xl p-4 border ${
            notification.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10'
              : 'border-red-500/30 bg-red-500/10'
          }`}
        >
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-2 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 mr-2 text-red-400" />
            )}
            <p className={`text-sm ${notification.type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>
              {notification.message}
            </p>
          </div>
        </div>
      )}

      {/* Información del Cliente */}
      <div className="card rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-slate-700/50 mb-4 sm:mb-6">
        <div className="flex items-center mb-4 sm:mb-6">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-2 sm:mr-3">
            <Info className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-100">Información del Cliente</h3>
        </div>
        <dl className="grid grid-cols-1 gap-2 sm:gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="p-3 sm:p-4 bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-700/50">
            <dt className="text-[10px] sm:text-xs font-semibold text-slate-400 mb-1.5 sm:mb-2 flex items-center">
              <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
              <span className="truncate">NIT</span>
            </dt>
            <dd className="text-sm sm:text-base md:text-lg font-bold text-slate-100 font-mono truncate">{cliente.nit}</dd>
          </div>
          <div className="p-3 sm:p-4 bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-700/50">
            <dt className="text-[10px] sm:text-xs font-semibold text-slate-400 mb-1.5 sm:mb-2 flex items-center">
              <Server className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Nombre</span>
            </dt>
            <dd className="text-xs sm:text-sm md:text-base text-slate-100 truncate">{cliente.nombre || 'N/A'}</dd>
          </div>
          <div className="p-3 sm:p-4 bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-700/50">
            <dt className="text-[10px] sm:text-xs font-semibold text-slate-400 mb-1.5 sm:mb-2 flex items-center">
              <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Nombre Comercial</span>
            </dt>
            <dd className="text-xs sm:text-sm md:text-base text-slate-100 truncate">{cliente.nombre_comercial || 'N/A'}</dd>
          </div>
          <div className="p-3 sm:p-4 bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-700/50">
            <dt className="text-[10px] sm:text-xs font-semibold text-slate-400 mb-1.5 sm:mb-2 flex items-center">
              <Power className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Estado</span>
            </dt>
            <dd className="mt-1">
              <span
                className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold ${
                  cliente.estado === 'activo'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {cliente.estado === 'activo' ? (
                  <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                ) : (
                  <XCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                )}
                <span className="truncate">{cliente.estado?.toUpperCase() || 'INACTIVO'}</span>
              </span>
            </dd>
          </div>
          <div className="p-3 sm:p-4 bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-700/50">
            <dt className="text-[10px] sm:text-xs font-semibold text-slate-400 mb-1.5 sm:mb-2 flex items-center">
              <Network className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Puerto API</span>
            </dt>
            <dd className="text-sm sm:text-base md:text-lg font-mono font-bold text-blue-400">:{cliente.api_port || 'N/A'}</dd>
          </div>
          <div className="p-3 sm:p-4 bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-700/50">
            <dt className="text-[10px] sm:text-xs font-semibold text-slate-400 mb-1.5 sm:mb-2 flex items-center">
              <Key className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Puerto Firmador</span>
            </dt>
            <dd className="text-sm sm:text-base md:text-lg font-mono font-bold text-indigo-400">:{cliente.firmador_port || 'N/A'}</dd>
          </div>
        </dl>
      </div>

      {/* Estado de Contenedores */}
      <div className="card rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-slate-700/50 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-2 sm:mr-3">
              <Server className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-100">Estado de Contenedores</h3>
          </div>
          <button
            onClick={loadCliente}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-300 transition-all hover:border-blue-500 transform hover:scale-105 flex items-center justify-center"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            Actualizar
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:gap-3 md:gap-4 sm:grid-cols-3">
          {['api', 'firmador', 'cloudflared'].map((tipo) => {
            const estado = estadoContenedores[tipo] || 'stopped'
            const isRunning = estado === 'running'
            const Icon = tipo === 'api' ? Code : tipo === 'firmador' ? Key : Cloud
            const label = tipo === 'api' ? 'API' : tipo === 'firmador' ? 'Firmador' : 'Cloudflare'

            return (
              <div
                key={tipo}
                className={`p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl border transform hover:scale-105 transition-all ${
                  isRunning
                    ? 'bg-gradient-to-br from-emerald-500/10 to-green-500/5 border-emerald-500/30'
                    : 'bg-gradient-to-br from-red-500/10 to-rose-500/5 border-red-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <dt className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center min-w-0 flex-1">
                    <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                    <span className="truncate">{label}</span>
                  </dt>
                  <div
                    className={`w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full flex-shrink-0 ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}
                  ></div>
                </div>
                <dd className={`text-sm sm:text-base md:text-lg font-bold ${isRunning ? 'text-emerald-400' : 'text-red-400'} flex items-center`}>
                  {isRunning ? (
                    <>
                      <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                      <span className="truncate">Activo</span>
                    </>
                  ) : estado === 'stopped' ? (
                    <>
                      <Square className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                      <span className="truncate">Detenido</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                      <span className="truncate">Desconocido</span>
                    </>
                  )}
                </dd>
              </div>
            )
          })}
        </div>
      </div>

      {/* Control de Servicios */}
      <div className="card rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-slate-700/50 mb-4 sm:mb-6">
        <div className="flex items-center mb-4 sm:mb-6">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-2 sm:mr-3">
            <Power className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-100">Control de Servicios</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <button
            onClick={() => controlarServicio('iniciar')}
            disabled={actionLoading !== null}
            className="group w-full inline-flex items-center justify-center px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:hover:scale-100"
          >
            {actionLoading === 'iniciar' ? (
              <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1 sm:mr-1.5 md:mr-2 animate-spin" />
            ) : (
              <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1 sm:mr-1.5 md:mr-2" />
            )}
            <span className="truncate">Iniciar</span>
          </button>
          <button
            onClick={() => controlarServicio('detener')}
            disabled={actionLoading !== null}
            className="group w-full inline-flex items-center justify-center px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:hover:scale-100"
          >
            {actionLoading === 'detener' ? (
              <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1 sm:mr-1.5 md:mr-2 animate-spin" />
            ) : (
              <Square className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1 sm:mr-1.5 md:mr-2" />
            )}
            <span className="truncate">Detener</span>
          </button>
          <button
            onClick={() => controlarServicio('reiniciar')}
            disabled={actionLoading !== null}
            className="group w-full inline-flex items-center justify-center px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:hover:scale-100"
          >
            {actionLoading === 'reiniciar' ? (
              <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1 sm:mr-1.5 md:mr-2 animate-spin" />
            ) : (
              <RotateCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1 sm:mr-1.5 md:mr-2" />
            )}
            <span className="truncate">Reiniciar</span>
          </button>
          <Link
            to={`/clientes/${nit}/logs?ambiente=${cliente.ambiente || ambiente}`}
            className="group w-full col-span-2 lg:col-span-1 inline-flex items-center justify-center px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500 text-slate-200 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all transform hover:scale-105"
          >
            <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1 sm:mr-1.5 md:mr-2" />
            <span className="truncate">Ver Logs</span>
          </Link>
        </div>
      </div>

      {/* Salud del Cliente */}
      {salud && (
        <div className="card rounded-2xl p-6 border border-slate-700/50 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div
                className={`w-10 h-10 bg-gradient-to-br rounded-xl flex items-center justify-center mr-3 ${
                  salud.estado === 'healthy'
                    ? 'from-emerald-500 to-green-600'
                    : salud.estado === 'degraded'
                    ? 'from-amber-500 to-orange-600'
                    : 'from-red-500 to-rose-600'
                }`}
              >
                <Heart className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-100">Salud del Sistema</h3>
            </div>
            <span
              className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold ${
                salud.estado === 'healthy'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : salud.estado === 'degraded'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}
            >
              {salud.estado === 'healthy' ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Saludable
                </>
              ) : salud.estado === 'degraded' ? (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Degradado
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  No Saludable
                </>
              )}
            </span>
          </div>

          {salud.problemas && salud.problemas.length > 0 && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <h4 className="text-sm font-semibold text-red-400 mb-3 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Problemas Críticos
              </h4>
              <ul className="space-y-2">
                {salud.problemas.map((problema: string, idx: number) => (
                  <li key={idx} className="text-sm text-slate-200 flex items-start p-2 bg-slate-800/50 rounded-lg">
                    <XCircle className="w-4 h-4 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{problema}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {salud.alertas && salud.alertas.length > 0 && (
            <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <h4 className="text-sm font-semibold text-amber-400 mb-3 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Alertas
              </h4>
              <ul className="space-y-2">
                {salud.alertas.map((alerta: string, idx: number) => (
                  <li key={idx} className="text-sm text-slate-200 flex items-start p-2 bg-slate-800/50 rounded-lg">
                    <Info className="w-4 h-4 text-amber-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{alerta}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(!salud.problemas || salud.problemas.length === 0) &&
            (!salud.alertas || salud.alertas.length === 0) && (
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <p className="text-base font-semibold text-emerald-300">
                  Todos los sistemas funcionando correctamente
                </p>
              </div>
            )}
        </div>
      )}

      {/* Estadísticas DTE */}
      {estadisticasDte && Object.keys(estadisticasDte).length > 0 && (
        <div className="card rounded-2xl p-6 border border-slate-700/50 mb-6">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Estadísticas DTE</h3>
            <span className="ml-auto text-sm text-slate-400">Últimos 7 días</span>
          </div>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-5 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 rounded-xl border border-blue-500/30">
              <dt className="text-xs font-semibold text-slate-400 mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Total Procesados
              </dt>
              <dd className="text-3xl font-bold text-slate-100">{estadisticasDte.total || 0}</dd>
            </div>
            <div className="p-5 bg-gradient-to-br from-emerald-500/10 to-green-500/5 rounded-xl border border-emerald-500/30">
              <dt className="text-xs font-semibold text-slate-400 mb-2 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Aceptados
              </dt>
              <dd className="text-3xl font-bold text-emerald-400">{estadisticasDte.aceptados || 0}</dd>
            </div>
            <div className="p-5 bg-gradient-to-br from-red-500/10 to-rose-500/5 rounded-xl border border-red-500/30">
              <dt className="text-xs font-semibold text-slate-400 mb-2 flex items-center">
                <XCircle className="w-4 h-4 mr-2" />
                Rechazados
              </dt>
              <dd className="text-3xl font-bold text-red-400">{estadisticasDte.rechazados || 0}</dd>
            </div>
            <div
              className={`p-5 bg-gradient-to-br rounded-xl border ${
                tasaExito >= 0.9
                  ? 'from-emerald-500/10 to-green-500/5 border-emerald-500/30'
                  : tasaExito >= 0.7
                  ? 'from-amber-500/10 to-orange-500/5 border-amber-500/30'
                  : 'from-red-500/10 to-rose-500/5 border-red-500/30'
              }`}
            >
              <dt className="text-xs font-semibold text-slate-400 mb-2 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Tasa de Éxito
              </dt>
              <dd className={`text-3xl font-bold ${tasaExitoColor}`}>
                {(tasaExito * 100).toFixed(1)}%
              </dd>
              <div className="mt-3 w-full bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${tasaExitoBg}`}
                  style={{ width: `${tasaExito * 100}%` }}
                ></div>
              </div>
            </div>
          </dl>
        </div>
      )}

      {/* Errores Recientes */}
      {erroresRecientes && erroresRecientes.length > 0 && (
        <div className="card rounded-2xl p-6 border border-slate-700/50 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center mr-3">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-100">Errores Recientes</h3>
              <span className="ml-3 text-xs text-slate-400">(Últimas 2h)</span>
            </div>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {erroresRecientes.map((error: any, idx: number) => (
              <div
                key={idx}
                className="bg-gradient-to-r from-red-500/10 to-rose-500/5 border border-red-500/30 rounded-xl p-4 transform hover:scale-[1.02] transition-all"
              >
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                    <XCircle className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 font-mono break-words">
                      {error.message?.substring(0, 250)}
                      {error.message?.length > 250 && '...'}
                    </p>
                    <div className="flex items-center mt-2 text-xs text-slate-400">
                      <Server className="w-3 h-3 mr-1" />
                      <span className="mr-3">{error.container}</span>
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{error.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
