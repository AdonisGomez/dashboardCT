import { useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw, Download, ChevronDown, ChevronRight, Clock, Server, User } from 'lucide-react'
import api from '../services/api'

interface ErrorInstance {
  timestamp: string
  datetime: string
  message: string
  container: string
  servicio: string
  tipo_error: string
  mensaje_corto: string
  stack_trace?: string
  contexto?: {
    endpoint?: string
    cliente_id?: string
  }
}

interface ErrorGroup {
  error: ErrorInstance
  count: number
  instances: ErrorInstance[]
}

export default function Errores() {
  const [errores, setErrores] = useState<ErrorGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroServicio, setFiltroServicio] = useState<string>('')
  const [horas, setHoras] = useState<number>(24)
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set())
  const [servicios, setServicios] = useState<string[]>([])

  useEffect(() => {
    loadServicios()
    loadErrores()
    const interval = setInterval(loadErrores, 60000) // Actualizar cada minuto
    return () => clearInterval(interval)
  }, [filtroServicio, horas])

  const loadServicios = async () => {
    try {
      const response = await api.get('/logs/servicios')
      if (response.data.success) {
        setServicios(Object.keys(response.data.servicios || {}))
      }
    } catch (error) {
      console.error('Error cargando servicios:', error)
    }
  }

  const loadErrores = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroServicio) params.append('servicio', filtroServicio)
      params.append('horas', horas.toString())
      params.append('agrupar', 'true')

      const response = await api.get(`/errores/api?${params.toString()}`)
      if (response.data.success) {
        setErrores(response.data.errores_agrupados || [])
      }
    } catch (error) {
      console.error('Error cargando errores:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleGroup = (index: number) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedGroups(newExpanded)
  }

  const exportErrores = () => {
    const dataStr = JSON.stringify(errores, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `errores-${new Date().toISOString()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    } catch {
      return timestamp
    }
  }

  const getTipoErrorColor = (tipo: string) => {
    switch (tipo) {
      case 'ValidationError':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      case 'ConnectionError':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20'
      case 'TimeoutError':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      case 'HTTPError':
        return 'text-red-400 bg-red-500/10 border-red-500/20'
      case 'MongoDBError':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20'
      case 'HaciendaError':
        return 'text-pink-400 bg-pink-500/10 border-pink-500/20'
      default:
        return 'text-red-400 bg-red-500/10 border-red-500/20'
    }
  }

  const totalErrores = errores.reduce((sum, grupo) => sum + grupo.count, 0)

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
        <div className="mb-3 sm:mb-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-100 mb-2 gradient-text">
            Error Tracking
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 flex items-center">
            <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            Análisis y agrupación de errores del sistema
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadErrores}
            className="inline-flex items-center px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-slate-800/80 text-slate-300 border border-slate-700/50 hover:border-blue-500/50 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
          <button
            onClick={exportErrores}
            className="inline-flex items-center px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-slate-800/80 text-slate-300 border border-slate-700/50 hover:border-blue-500/50 transition-all"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      {/* Filtros y Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="card p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-slate-400 mb-1">Total Errores</div>
          <div className="text-lg sm:text-2xl font-bold text-red-400">{totalErrores}</div>
        </div>
        <div className="card p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-slate-400 mb-1">Tipos Únicos</div>
          <div className="text-lg sm:text-2xl font-bold text-slate-100">{errores.length}</div>
        </div>
        <div className="card p-3 sm:p-4 sm:col-span-2">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs text-slate-400 mb-1">Servicio</label>
              <select
                value={filtroServicio}
                onChange={(e) => setFiltroServicio(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 focus:border-blue-500/50 focus:outline-none"
              >
                <option value="">Todos</option>
                {servicios.map(servicio => (
                  <option key={servicio} value={servicio}>{servicio}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-slate-400 mb-1">Período</label>
              <select
                value={horas}
                onChange={(e) => setHoras(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 focus:border-blue-500/50 focus:outline-none"
              >
                <option value="1">Última hora</option>
                <option value="6">Últimas 6 horas</option>
                <option value="24">Últimas 24 horas</option>
                <option value="48">Últimas 48 horas</option>
                <option value="168">Última semana</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Errores Agrupados */}
      <div className="card p-0 overflow-hidden">
        <div className="bg-slate-900/50 px-4 py-3 border-b border-slate-700/50">
          <h3 className="text-sm font-semibold text-slate-300">Errores Agrupados</h3>
        </div>
        <div className="max-h-[700px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-slate-400">Cargando errores...</div>
            </div>
          ) : errores.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-slate-400 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No se encontraron errores en el período seleccionado</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {errores.map((grupo, index) => {
                const isExpanded = expandedGroups.has(index)
                const error = grupo.error
                
                return (
                  <div key={index} className="bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                    {/* Header del Grupo */}
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => toggleGroup(index)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            )}
                            <span className={`px-2 py-1 rounded text-xs font-semibold border ${getTipoErrorColor(error.tipo_error)}`}>
                              {error.tipo_error}
                            </span>
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
                              {grupo.count} {grupo.count === 1 ? 'vez' : 'veces'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-200 font-mono break-words ml-6">
                            {error.mensaje_corto}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 ml-6 text-xs text-slate-400">
                            <span className="flex items-center">
                              <Server className="w-3 h-3 mr-1" />
                              {error.servicio}
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatTimestamp(error.datetime)}
                            </span>
                            {error.contexto?.cliente_id && (
                              <span className="flex items-center">
                                <User className="w-3 h-3 mr-1" />
                                {error.contexto.cliente_id}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Detalles Expandidos */}
                    {isExpanded && (
                      <div className="px-4 pb-4 ml-6 border-l-2 border-slate-700/50 space-y-3">
                        {/* Contexto */}
                        {error.contexto && Object.keys(error.contexto).length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-slate-400 mb-2">Contexto</h4>
                            <div className="bg-slate-900/50 rounded-lg p-3 text-xs">
                              {error.contexto.endpoint && (
                                <div className="mb-1">
                                  <span className="text-slate-400">Endpoint:</span>{' '}
                                  <span className="text-slate-200 font-mono">{error.contexto.endpoint}</span>
                                </div>
                              )}
                              {error.contexto.cliente_id && (
                                <div>
                                  <span className="text-slate-400">Cliente:</span>{' '}
                                  <span className="text-slate-200 font-mono">{error.contexto.cliente_id}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Stack Trace */}
                        {error.stack_trace && (
                          <div>
                            <h4 className="text-xs font-semibold text-slate-400 mb-2">Stack Trace</h4>
                            <pre className="bg-slate-900/50 rounded-lg p-3 text-xs text-slate-300 font-mono overflow-x-auto">
                              {error.stack_trace}
                            </pre>
                          </div>
                        )}

                        {/* Mensaje Completo */}
                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 mb-2">Mensaje Completo</h4>
                          <pre className="bg-slate-900/50 rounded-lg p-3 text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap">
                            {error.message}
                          </pre>
                        </div>

                        {/* Últimas Instancias */}
                        {grupo.instances.length > 1 && (
                          <div>
                            <h4 className="text-xs font-semibold text-slate-400 mb-2">
                              Últimas {Math.min(5, grupo.instances.length)} instancias
                            </h4>
                            <div className="space-y-2">
                              {grupo.instances.slice(0, 5).map((instancia, i) => (
                                <div key={i} className="bg-slate-900/50 rounded-lg p-2 text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-400">{formatTimestamp(instancia.datetime)}</span>
                                    <span className="text-slate-400">{instancia.container}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

