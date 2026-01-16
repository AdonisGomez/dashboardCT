import { useEffect, useState, useRef } from 'react'
import { Terminal, Search, Filter, Download, Play, Square, RefreshCw, X } from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../stores/authStore'
import RestrictedAccess from '../components/RestrictedAccess'

interface LogEntry {
  timestamp: string
  message: string
  container: string
  servicio: string
  level: 'error' | 'warning' | 'info' | 'debug'
}

export default function Logs() {
  const { role } = useAuthStore()
  
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [streaming, setStreaming] = useState(false)
  
  // Bloquear acceso a viewers
  if (role === 'viewer') {
    return <RestrictedAccess title="Logs - Acceso Bloqueado" message="Los logs del sistema contienen información técnica sensible. Solo los administradores pueden acceder a esta sección." />
  }
  const [filtroServicio, setFiltroServicio] = useState<string>('')
  const [filtroNivel, setFiltroNivel] = useState<string>('')
  const [filtroBusqueda, setFiltroBusqueda] = useState<string>('')
  const [servicios, setServicios] = useState<string[]>([])
  const eventSourceRef = useRef<EventSource | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadServicios()
    loadLogs()
  }, [])

  useEffect(() => {
    if (streaming) {
      startStreaming()
    } else {
      stopStreaming()
    }
    return () => {
      stopStreaming()
    }
  }, [streaming, filtroServicio, filtroNivel, filtroBusqueda])

  useEffect(() => {
    // Auto-scroll al final cuando hay nuevos logs
    if (streaming && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, streaming])

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

  const loadLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroServicio) params.append('servicio', filtroServicio)
      if (filtroNivel) params.append('nivel', filtroNivel)
      if (filtroBusqueda) params.append('busqueda', filtroBusqueda)
      params.append('limite', '500')

      const response = await api.get(`/logs/api?${params.toString()}`)
      if (response.data.success) {
        setLogs(response.data.logs || [])
      }
    } catch (error) {
      console.error('Error cargando logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const startStreaming = () => {
    stopStreaming() // Asegurar que no hay stream activo

    const params = new URLSearchParams()
    if (filtroServicio) params.append('servicio', filtroServicio)
    if (filtroNivel) params.append('nivel', filtroNivel)
    if (filtroBusqueda) params.append('busqueda', filtroBusqueda)
    if (logs.length > 0) {
      params.append('ultimo_timestamp', logs[0].timestamp)
    }

    const url = `/admin/logs/stream?${params.toString()}`
    const eventSource = new EventSource(url)

    eventSource.onmessage = (event) => {
      try {
        const log: LogEntry = JSON.parse(event.data)
        if (log.timestamp && log.message) {
          setLogs(prev => {
            // Evitar duplicados
            const exists = prev.some(l => l.timestamp === log.timestamp && l.message === log.message)
            if (exists) return prev
            
            // Agregar al inicio y mantener máximo 1000 logs
            return [log, ...prev].slice(0, 1000)
          })
        }
      } catch (error) {
        console.error('Error parseando log:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('Error en EventSource:', error)
      // Reconectar después de 3 segundos
      setTimeout(() => {
        if (streaming) {
          startStreaming()
        }
      }, 3000)
    }

    eventSourceRef.current = eventSource
  }

  const stopStreaming = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }

  const toggleStreaming = () => {
    setStreaming(!streaming)
  }

  const clearLogs = () => {
    setLogs([])
  }

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `logs-${new Date().toISOString()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-400 bg-red-500/10 border-red-500/20'
      case 'warning':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      case 'info':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20'
    }
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
      }) + '.' + date.getMilliseconds().toString().padStart(3, '0')
    } catch {
      return timestamp
    }
  }

  const filteredLogs = logs.filter(log => {
    if (filtroBusqueda && !log.message.toLowerCase().includes(filtroBusqueda.toLowerCase())) {
      return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">Logs en Tiempo Real</h1>
          <p className="text-sm text-slate-500 mt-1">Monitoreo de logs de todos los servicios</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleStreaming}
            className={`inline-flex items-center px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              streaming
                ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30'
            }`}
          >
            {streaming ? (
              <>
                <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Detener</span>
                <span className="sm:hidden">Stop</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Iniciar Stream</span>
                <span className="sm:hidden">Play</span>
              </>
            )}
          </button>
          <button
            onClick={loadLogs}
            className="inline-flex items-center px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-slate-800/80 text-slate-300 border border-slate-700/50 hover:border-blue-500/50 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
          <button
            onClick={clearLogs}
            className="inline-flex items-center px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-slate-800/80 text-slate-300 border border-slate-700/50 hover:border-red-500/50 transition-all"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Limpiar</span>
          </button>
          <button
            onClick={exportLogs}
            className="inline-flex items-center px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-slate-800/80 text-slate-300 border border-slate-700/50 hover:border-blue-500/50 transition-all"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center space-x-2 mb-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-300">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Filtro por Servicio */}
          <div>
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

          {/* Filtro por Nivel */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Nivel</label>
            <select
              value={filtroNivel}
              onChange={(e) => setFiltroNivel(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 focus:border-blue-500/50 focus:outline-none"
            >
              <option value="">Todos</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
          </div>

          {/* Búsqueda */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={filtroBusqueda}
                onChange={(e) => setFiltroBusqueda(e.target.value)}
                placeholder="Buscar en logs..."
                className="w-full pl-10 pr-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 focus:border-blue-500/50 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="card p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-slate-400 mb-1">Total Logs</div>
          <div className="text-lg sm:text-2xl font-bold text-slate-100">{filteredLogs.length}</div>
        </div>
        <div className="card p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-slate-400 mb-1">Errores</div>
          <div className="text-lg sm:text-2xl font-bold text-red-400">
            {filteredLogs.filter(l => l.level === 'error').length}
          </div>
        </div>
        <div className="card p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-slate-400 mb-1">Warnings</div>
          <div className="text-lg sm:text-2xl font-bold text-amber-400">
            {filteredLogs.filter(l => l.level === 'warning').length}
          </div>
        </div>
        <div className="card p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-slate-400 mb-1">Estado</div>
          <div className="text-lg sm:text-2xl font-bold">
            {streaming ? (
              <span className="text-emerald-400">● Streaming</span>
            ) : (
              <span className="text-slate-400">○ Detenido</span>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Logs */}
      <div className="card p-0 overflow-hidden">
        <div className="bg-slate-900/50 px-4 py-3 border-b border-slate-700/50">
          <h3 className="text-sm font-semibold text-slate-300">Logs</h3>
        </div>
        <div className="h-[600px] overflow-y-auto bg-slate-950/50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-slate-400">Cargando logs...</div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-slate-400 text-center">
                <Terminal className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay logs disponibles</p>
                {!streaming && (
                  <p className="text-xs mt-2">Haz clic en "Iniciar Stream" para comenzar</p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {filteredLogs.map((log, index) => (
                <div
                  key={`${log.timestamp}-${index}`}
                  className={`p-3 rounded-lg border ${getLevelColor(log.level)} transition-all hover:opacity-80`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getLevelColor(log.level)}`}>
                        {log.level.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-400 truncate">{log.servicio}</span>
                      <span className="text-xs text-slate-500 truncate">{log.container}</span>
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                  <div className="text-sm text-slate-200 font-mono break-words">
                    {log.message}
                  </div>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

