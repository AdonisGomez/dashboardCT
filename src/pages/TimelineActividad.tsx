import { useState, useEffect } from 'react'
import { Clock, Activity, RefreshCw, Filter, CheckCircle, XCircle, AlertTriangle, Server, FileText, Globe, Zap } from 'lucide-react'
import api from '../services/api'

interface Actividad {
  tipo: string
  timestamp: string
  cliente_id?: string
  endpoint?: string
  metodo?: string
  status_code?: number
  success?: boolean
  duracion_ms?: number
  tipo_dte?: string
  codigo_generacion?: string
  descripcion?: string
  contenedor?: string
  estado?: string
}

export default function TimelineActividad() {
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState<string>('')
  const [limite, setLimite] = useState(100)

  useEffect(() => {
    loadActividades()
    const interval = setInterval(loadActividades, 30000) // Actualizar cada 30 segundos
    return () => clearInterval(interval)
  }, [filtroTipo, limite])

  const loadActividades = async () => {
    try {
      const params: any = { limite }
      if (filtroTipo) {
        params.tipo = filtroTipo
      }
      const response = await api.get('/timeline', { params })
      if (response.data.success) {
        setActividades(response.data.actividades || [])
      }
    } catch (error) {
      console.error('Error loading actividades:', error)
    } finally {
      setLoading(false)
    }
  }

  const obtenerIcono = (tipo: string) => {
    if (tipo.startsWith('dte_aceptado')) {
      return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
    }
    if (tipo.startsWith('dte_rechazado')) {
      return <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
    }
    if (tipo.startsWith('dte_error')) {
      return <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
    }
    if (tipo === 'api_request') {
      return <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
    }
    if (tipo === 'contenedor_evento') {
      return <Server className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
    }
    return <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
  }

  const obtenerColor = (tipo: string) => {
    if (tipo.startsWith('dte_aceptado')) {
      return 'bg-emerald-500/20 border-emerald-500/30'
    }
    if (tipo.startsWith('dte_rechazado')) {
      return 'bg-red-500/20 border-red-500/30'
    }
    if (tipo.startsWith('dte_error')) {
      return 'bg-amber-500/20 border-amber-500/30'
    }
    if (tipo === 'api_request') {
      return 'bg-blue-500/20 border-blue-500/30'
    }
    if (tipo === 'contenedor_evento') {
      return 'bg-purple-500/20 border-purple-500/30'
    }
    return 'bg-slate-800/50 border-slate-700/50'
  }

  const obtenerTitulo = (actividad: Actividad) => {
    if (actividad.tipo.startsWith('dte_')) {
      const estado = actividad.tipo.replace('dte_', '').toUpperCase()
      return `DTE ${estado}`
    }
    if (actividad.tipo === 'api_request') {
      return `${actividad.metodo || 'REQUEST'} ${actividad.endpoint || ''}`
    }
    if (actividad.tipo === 'contenedor_evento') {
      return `Contenedor: ${actividad.contenedor || 'N/A'}`
    }
    return actividad.tipo.replace('_', ' ').toUpperCase()
  }

  const formatearFecha = (timestamp: string) => {
    try {
      const fecha = new Date(timestamp)
      return fecha.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    } catch {
      return timestamp
    }
  }

  const actividadesFiltradas = actividades.filter(act => {
    if (!filtroTipo) return true
    return act.tipo.toLowerCase().includes(filtroTipo.toLowerCase())
  })

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
        <div className="mb-3 sm:mb-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text mb-2 flex items-center">
            <Clock className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mr-1.5 sm:mr-2" />
            <span className="text-lg sm:text-2xl md:text-3xl lg:text-4xl">Timeline de Actividad</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Historial de eventos y acciones del sistema en tiempo real
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={limite}
            onChange={(e) => setLimite(Number(e.target.value))}
            className="px-3 sm:px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={50}>50 eventos</option>
            <option value={100}>100 eventos</option>
            <option value={200}>200 eventos</option>
            <option value={500}>500 eventos</option>
          </select>
          <button
            onClick={loadActividades}
            className="px-3 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs sm:text-sm font-medium text-slate-300 transition-all hover:border-blue-500 flex items-center"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-slate-700/50">
        <div className="flex items-center mb-4">
          <Filter className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-400" />
          <h3 className="text-base sm:text-lg font-bold text-slate-100">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">Tipo de Evento</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los tipos</option>
              <option value="dte_aceptado">DTE Aceptados</option>
              <option value="dte_rechazado">DTE Rechazados</option>
              <option value="dte_error">DTE con Error</option>
              <option value="api_request">Peticiones API</option>
              <option value="contenedor_evento">Eventos de Contenedores</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFiltroTipo('')}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-xs sm:text-sm font-semibold transition-all hover:border-blue-500"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mr-3" />
          <span className="text-slate-400">Cargando actividades...</span>
        </div>
      )}

      {!loading && (
        <div className="card rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-slate-700/50">
          <div className="relative">
            {/* Línea vertical del timeline */}
            <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-0.5 bg-slate-700"></div>

            <div className="space-y-4 sm:space-y-6">
              {actividadesFiltradas.length > 0 ? (
                actividadesFiltradas.map((actividad, index) => (
                  <div
                    key={index}
                    className={`relative pl-10 sm:pl-14 ${obtenerColor(actividad.tipo)} rounded-xl p-3 sm:p-4 border`}
                  >
                    {/* Punto en el timeline */}
                    <div className="absolute -left-1.5 sm:-left-2 top-4 sm:top-5 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-4 border-slate-900 z-10 flex items-center justify-center">
                      {obtenerIcono(actividad.tipo)}
                    </div>

                    {/* Contenido */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1.5 sm:mb-2">
                          <h4 className="text-xs sm:text-sm font-semibold text-slate-200">
                            {obtenerTitulo(actividad)}
                          </h4>
                          {actividad.status_code && (
                            <span
                              className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-semibold ${
                                actividad.status_code >= 200 && actividad.status_code < 300
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : actividad.status_code >= 400
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              {actividad.status_code}
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] sm:text-xs text-slate-400 mb-2">
                          {actividad.descripcion || 'Sin descripción'}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-500">
                          {actividad.cliente_id && (
                            <span className="flex items-center">
                              <FileText className="w-3 h-3 mr-1" />
                              Cliente: <span className="font-mono text-slate-300 ml-1">{actividad.cliente_id}</span>
                            </span>
                          )}
                          {actividad.codigo_generacion && (
                            <span className="flex items-center">
                              <Zap className="w-3 h-3 mr-1" />
                              DTE: <span className="font-mono text-slate-300 ml-1">{actividad.codigo_generacion.substring(0, 8)}...</span>
                            </span>
                          )}
                          {actividad.duracion_ms && (
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {actividad.duracion_ms}ms
                            </span>
                          )}
                          {actividad.contenedor && (
                            <span className="flex items-center">
                              <Server className="w-3 h-3 mr-1" />
                              {actividad.contenedor}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 sm:mt-0 sm:ml-4 flex-shrink-0">
                        <p className="text-[10px] sm:text-xs text-slate-500 whitespace-nowrap">
                          {formatearFecha(actividad.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <Activity className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-slate-600" />
                  <p className="text-sm sm:text-base">No hay actividades para mostrar</p>
                  <p className="text-xs sm:text-sm mt-2">Las actividades aparecerán aquí en tiempo real</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Indicador de actualización automática */}
      <div className="flex items-center justify-center space-x-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg">
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
        <span className="text-xs sm:text-sm text-slate-400">Actualizando cada 30 segundos</span>
      </div>
    </div>
  )
}

