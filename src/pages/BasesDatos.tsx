import { useState, useEffect } from 'react'
import {
  Database,
  RefreshCw,
  Server,
  XCircle,
  AlertTriangle,
  Activity,
  HardDrive,
  Layers,
  TrendingUp,
  Gauge,
  Save,
  Search,
  Play,
  FileText,
} from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../stores/authStore'
import RestrictedAccess from '../components/RestrictedAccess'

interface MiembroReplicaSet {
  id: number
  nombre: string
  estado: string
  salud: number
  lag?: number
  ultima_sincronizacion?: string
}

interface ReplicaSet {
  nombre: string | null
  estado: string
  miembros: MiembroReplicaSet[]
  primary: string | null
  secondaries: string[]
  sincronizado: boolean
  lag_replicacion: number | null
}

interface BaseDatos {
  nombre: string
  tamaño: number
  colecciones: number
  documentos: number
}

interface EstadoMongoDB {
  conectado: boolean
  ambiente: string
  replica_set: ReplicaSet
  servidor: {
    host: string | null
    puerto: number | null
    version: string | null
    uptime: number | null
  }
  bases_datos: BaseDatos[]
  estadisticas: {
    total_colecciones: number
    total_documentos: number
    tamaño_datos: number
  }
  errores: string[]
  timestamp: string
}

interface MetricasRendimiento {
  conectado: boolean
  memoria: {
    total_mb: number | null
    usada_mb: number | null
    disponible_mb: number | null
    porcentaje_usado: number | null
    virtual_mb: number | null
    residente_mb: number | null
  }
  operaciones: {
    inserts_por_segundo: number | null
    queries_por_segundo: number | null
    updates_por_segundo: number | null
    deletes_por_segundo: number | null
    getmores_por_segundo: number | null
    commands_por_segundo: number | null
  }
  conexiones: {
    activas: number | null
    disponibles: number | null
    totales: number | null
    porcentaje_usado: number | null
  }
  cache: {
    tamaño_gb: number | null
    usado_gb: number | null
    dirty_mb: number | null
  }
  errores: string[]
  timestamp: string
}

interface Backup {
  nombre: string
  ruta: string
  tamaño_bytes: number
  tamaño_mb: number
  fecha_creacion: string
  fecha_modificacion: string
}

type TabType = 'estado' | 'metricas' | 'backups' | 'consultas'

export default function BasesDatos() {
  const { role } = useAuthStore()
  
  // Bloquear acceso a viewers
  if (role === 'viewer') {
    return <RestrictedAccess title="Base de Datos - Acceso Bloqueado" message="La información de bases de datos contiene credenciales y datos sensibles. Solo los administradores pueden acceder a esta sección." />
  }
  
  const [estado, setEstado] = useState<EstadoMongoDB | null>(null)
  const [metricas, setMetricas] = useState<MetricasRendimiento | null>(null)
  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMetricas, setLoadingMetricas] = useState(false)
  const [loadingBackups, setLoadingBackups] = useState(false)
  const [creandoBackup, setCreandoBackup] = useState(false)
  const [ambiente, setAmbiente] = useState('produccion') // Por defecto producción - NUNCA mezclar ambientes
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [tabActivo, setTabActivo] = useState<TabType>('estado')

  // Consultas MongoDB
  type TipoConsulta = 'dte_recientes' | 'estadisticas_dte' | 'dte_por_cliente' | 'dte_aceptados' | 'dte_rechazados' | 'dte_pendientes' | 'dte_con_errores' | 'dte_por_estado' | 'dte_por_tipo'
  const [tipoConsulta, setTipoConsulta] = useState<TipoConsulta>('dte_recientes')
  const [baseDatos, setBaseDatos] = useState('dte_production')
  const [coleccion, setColeccion] = useState('dte_transactions')
  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroTipoDte, setFiltroTipoDte] = useState('')
  const [resultadoConsulta, setResultadoConsulta] = useState<any>(null)
  const [ejecutandoConsulta, setEjecutandoConsulta] = useState(false)
  const [limiteConsulta, setLimiteConsulta] = useState(100)
  const [clientes, setClientes] = useState<any[]>([])

  // Cargar estado solo cuando es necesario (tab estado o primera carga)
  useEffect(() => {
    if (tabActivo === 'estado' || !estado) {
      loadEstado()
    }
  }, [tabActivo === 'estado', ambiente])

  // Cargar métricas solo cuando se activa el tab
  useEffect(() => {
    if (tabActivo === 'metricas') {
      loadMetricas()
    }
  }, [tabActivo === 'metricas'])

  // Cargar backups solo cuando se activa el tab
  useEffect(() => {
    if (tabActivo === 'backups') {
      loadBackups()
    }
  }, [tabActivo === 'backups'])

  // Cargar clientes solo cuando se activa el tab de consultas (y solo una vez)
  useEffect(() => {
    if (tabActivo === 'consultas' && clientes.length === 0) {
      loadClientes()
    }
  }, [tabActivo === 'consultas'])

  // Auto-refresh solo para el tab activo
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      if (tabActivo === 'estado') {
        loadEstado()
      } else if (tabActivo === 'metricas') {
        loadMetricas()
      } else if (tabActivo === 'backups') {
        loadBackups()
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [autoRefresh, tabActivo])

  const loadClientes = async () => {
    try {
      const response = await api.get(`/clientes/api?ambiente=todos`)
      setClientes(response.data.clientes || [])
    } catch (error) {
      console.error('Error cargando clientes:', error)
    }
  }

  const loadEstado = async () => {
    if (loading && estado) return // Evitar cargas duplicadas
    
    try {
      const response = await api.get(`/bases-datos/api?ambiente=${ambiente}`)
      if (response.data.success) {
        setEstado(response.data.estado)
      }
    } catch (error) {
      console.error('Error cargando estado de MongoDB:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMetricas = async () => {
    setLoadingMetricas(true)
    try {
      const response = await api.get(`/bases-datos/metricas?ambiente=${ambiente}`)
      if (response.data.success) {
        setMetricas(response.data.metricas)
      }
    } catch (error) {
      console.error('Error cargando métricas:', error)
    } finally {
      setLoadingMetricas(false)
    }
  }

  const loadBackups = async () => {
    setLoadingBackups(true)
    try {
      const response = await api.get(`/bases-datos/backups?ambiente=${ambiente}`)
      if (response.data.success) {
        setBackups(response.data.backups || [])
      }
    } catch (error) {
      console.error('Error cargando backups:', error)
    } finally {
      setLoadingBackups(false)
    }
  }

  const crearBackup = async () => {
    if (!window.confirm('¿Está seguro de crear un backup? Esto puede tardar varios minutos.')) {
      return
    }

    setCreandoBackup(true)
    try {
      const response = await api.post(`/bases-datos/backups/crear?ambiente=${ambiente}`)
      if (response.data.success) {
        alert('Backup creado exitosamente')
        loadBackups()
      } else {
        alert(`Error: ${response.data.resultado?.mensaje || 'Error desconocido'}`)
      }
    } catch (error: any) {
      alert(`Error creando backup: ${error.response?.data?.error || error.message}`)
    } finally {
      setCreandoBackup(false)
    }
  }

  const ejecutarConsulta = async () => {
    setEjecutandoConsulta(true)
    try {
      const filtros: any = {}
      if (filtroCliente) filtros.cliente_id = filtroCliente
      if (filtroEstado) filtros.estado = filtroEstado
      if (filtroTipoDte) filtros.tipo_dte = filtroTipoDte

      const response = await api.post('/bases-datos/consultas/ejecutar', {
        tipo_consulta: tipoConsulta,
        base_datos: baseDatos,
        coleccion: coleccion.trim(),
        ambiente,
        filtros,
        limite: limiteConsulta,
      })

      if (response.data.success) {
        setResultadoConsulta(response.data.resultado)
      } else {
        alert(`Error: ${response.data.resultado?.mensaje || 'Error desconocido'}`)
      }
    } catch (error: any) {
      alert(`Error ejecutando consulta: ${error.response?.data?.error || error.message}`)
    } finally {
      setEjecutandoConsulta(false)
    }
  }

  const formatTamaño = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
  }

  const formatUptime = (seconds: number | null): string => {
    if (!seconds) return 'N/A'
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (days > 0) return `${days}d ${hours}h ${mins}m`
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PRIMARY':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'SECONDARY':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'STARTUP':
      case 'STARTUP2':
      case 'RECOVERING':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      default:
        return 'bg-red-500/20 text-red-400 border-red-500/30'
    }
  }

  const tabs = [
    { id: 'estado' as TabType, label: 'Estado', icon: Database },
    { id: 'metricas' as TabType, label: 'Métricas', icon: Gauge },
    { id: 'backups' as TabType, label: 'Backups', icon: Save },
    { id: 'consultas' as TabType, label: 'Consultas', icon: Search },
  ]

  if (loading && !estado) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="card rounded-xl p-12 border border-slate-700/50">
          <div className="flex flex-col items-center justify-center">
            <RefreshCw className="w-12 h-12 text-slate-600 animate-spin mb-4" />
            <p className="text-slate-400">Cargando estado de bases de datos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">Base de Datos</h1>
          <p className="text-sm text-slate-500 mt-1">Monitoreo y sincronización de MongoDB</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={ambiente}
            onChange={(e) => setAmbiente(e.target.value)}
            className="px-4 py-2 bg-slate-900/60 border border-slate-700/50 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-slate-600"
          >
            <option value="produccion">Producción</option>
            <option value="pruebas">Pruebas</option>
          </select>

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
            onClick={() => {
              loadEstado()
              if (tabActivo === 'metricas') loadMetricas()
              if (tabActivo === 'backups') loadBackups()
            }}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => {
                setTabActivo(tab.id)
                if (tab.id === 'metricas' && !metricas) loadMetricas()
                if (tab.id === 'backups' && backups.length === 0) loadBackups()
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                tabActivo === tab.id
                  ? 'bg-slate-700/60 text-slate-100 border border-slate-600'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Contenido de Tabs */}
      {tabActivo === 'estado' && (
        <>
          {/* Estado de Conexión */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/30">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                <Database className="w-5 h-5 text-slate-400" />
                Estado de Conexión
              </h2>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    estado?.conectado ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                  }`}
                />
                <span
                  className={`text-xs sm:text-sm font-semibold ${
                    estado?.conectado ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {estado?.conectado ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
            </div>

            {estado?.conectado ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
                  <div className="text-xs sm:text-sm text-slate-400 mb-1">Servidor</div>
                  <div className="text-base sm:text-lg font-semibold text-slate-100 truncate">
                    {estado.servidor.host || 'N/A'}
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
                  <div className="text-xs sm:text-sm text-slate-400 mb-1">Puerto</div>
                  <div className="text-base sm:text-lg font-semibold text-slate-100">
                    {estado.servidor.puerto || 'N/A'}
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
                  <div className="text-xs sm:text-sm text-slate-400 mb-1">Versión</div>
                  <div className="text-base sm:text-lg font-semibold text-slate-100 truncate">
                    {estado.servidor.version || 'N/A'}
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
                  <div className="text-xs sm:text-sm text-slate-400 mb-1">Uptime</div>
                  <div className="text-base sm:text-lg font-semibold text-slate-100">
                    {formatUptime(estado.servidor.uptime)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-red-400">
                  <XCircle className="w-5 h-5" />
                  <span className="font-semibold">No se pudo conectar a MongoDB</span>
                </div>
                {estado?.errores && estado.errores.length > 0 && (
                  <div className="mt-2 text-xs sm:text-sm text-slate-400">{estado.errores[0]}</div>
                )}
              </div>
            )}
          </div>

          {/* Replica Set */}
          {estado?.conectado && (
            <div className="card rounded-xl p-4 sm:p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center">
                  <Layers className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-purple-400" />
                  Replica Set
                </h2>
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      estado.replica_set.sincronizado ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <span
                    className={`text-xs sm:text-sm font-semibold ${
                      estado.replica_set.sincronizado ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {estado.replica_set.sincronizado ? 'Sincronizado' : 'No Sincronizado'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Información del Replica Set */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-slate-400 mb-1">Nombre</div>
                    <div className="text-base sm:text-lg font-semibold text-slate-100">
                      {estado.replica_set.nombre || 'N/A'}
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-slate-400 mb-1">Estado</div>
                    <div className="text-base sm:text-lg font-semibold text-slate-100">
                      {estado.replica_set.estado || 'N/A'}
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-slate-400 mb-1">Lag de Replicación</div>
                    <div
                      className={`text-base sm:text-lg font-semibold ${
                        estado.replica_set.lag_replicacion !== null && estado.replica_set.lag_replicacion < 10
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {estado.replica_set.lag_replicacion !== null
                        ? `${estado.replica_set.lag_replicacion.toFixed(2)}s`
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-slate-400 mb-1">Miembros</div>
                    <div className="text-base sm:text-lg font-semibold text-slate-100">
                      {estado.replica_set.miembros.length || 0}
                    </div>
                  </div>
                </div>

                {/* Miembros del Replica Set */}
                {estado.replica_set.miembros && estado.replica_set.miembros.length > 0 && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-slate-200 mb-3">Miembros del Replica Set</h3>
                    <div className="space-y-3">
                      {estado.replica_set.miembros.map((miembro) => (
                        <div
                          key={miembro.id}
                          className={`bg-slate-800/50 rounded-lg p-4 border ${
                            miembro.estado === 'PRIMARY' ? 'border-blue-500/50' : 'border-slate-700'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div
                                className={`w-3 h-3 rounded-full ${
                                  miembro.salud === 1 ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                                }`}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-slate-100 truncate">{miembro.nombre}</div>
                                <div className="text-xs sm:text-sm text-slate-400">ID: {miembro.id}</div>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                              <div>
                                <div className="text-xs text-slate-400 mb-1">Estado</div>
                                <span
                                  className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border ${getEstadoColor(
                                    miembro.estado
                                  )}`}
                                >
                                  {miembro.estado}
                                </span>
                              </div>
                              {miembro.lag !== null && miembro.lag !== undefined && (
                                <div>
                                  <div className="text-xs text-slate-400 mb-1">Lag</div>
                                  <div
                                    className={`text-sm font-semibold ${
                                      miembro.lag < 10 ? 'text-emerald-400' : 'text-amber-400'
                                    }`}
                                  >
                                    {miembro.lag.toFixed(2)}s
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Estadísticas Generales */}
          {estado?.conectado && (
            <div className="card rounded-xl p-4 sm:p-6 border border-slate-700/50">
              <h2 className="text-lg sm:text-xl font-bold text-slate-100 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-indigo-400" />
                Estadísticas Generales
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
                  <div className="text-xs sm:text-sm text-slate-400 mb-1">Total Colecciones</div>
                  <div className="text-2xl font-bold text-slate-100">
                    {estado.estadisticas.total_colecciones || 0}
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
                  <div className="text-xs sm:text-sm text-slate-400 mb-1">Total Documentos</div>
                  <div className="text-2xl font-bold text-slate-100">
                    {(estado.estadisticas.total_documentos || 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
                  <div className="text-xs sm:text-sm text-slate-400 mb-1">Tamaño de Datos</div>
                  <div className="text-2xl font-bold text-slate-100">
                    {formatTamaño(estado.estadisticas.tamaño_datos || 0)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bases de Datos */}
          {estado?.conectado && estado.bases_datos && estado.bases_datos.length > 0 && (
            <div className="card rounded-xl p-4 sm:p-6 border border-slate-700/50">
              <h2 className="text-lg sm:text-xl font-bold text-slate-100 mb-4 flex items-center">
                <HardDrive className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-cyan-400" />
                Bases de Datos
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-slate-300">Nombre</th>
                      <th className="text-right py-3 px-4 text-xs sm:text-sm font-semibold text-slate-300">Tamaño</th>
                      <th className="text-right py-3 px-4 text-xs sm:text-sm font-semibold text-slate-300">
                        Colecciones
                      </th>
                      <th className="text-right py-3 px-4 text-xs sm:text-sm font-semibold text-slate-300">
                        Documentos
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {estado.bases_datos.map((db) => (
                      <tr key={db.nombre} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Database className="w-4 h-4 text-cyan-400" />
                            <span className="font-medium text-slate-100">{db.nombre}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300 text-xs sm:text-sm">
                          {formatTamaño(db.tamaño)}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300 text-xs sm:text-sm">{db.colecciones}</td>
                        <td className="py-3 px-4 text-right text-slate-300 text-xs sm:text-sm">
                          {(db.documentos || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Errores */}
          {estado?.errores && estado.errores.length > 0 && (
            <div className="card rounded-xl p-4 sm:p-6 border border-red-500/30 bg-red-500/10">
              <h2 className="text-lg sm:text-xl font-bold text-red-400 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                Errores
              </h2>
              <ul className="space-y-2">
                {estado.errores.map((error, index) => (
                  <li key={index} className="text-xs sm:text-sm text-red-300 flex items-start space-x-2">
                    <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Tab Métricas */}
      {tabActivo === 'metricas' && (
        <div className="space-y-4 sm:space-y-6">
          {loadingMetricas ? (
            <div className="card rounded-xl p-12 border border-slate-700/50">
              <div className="flex flex-col items-center justify-center">
                <RefreshCw className="w-12 h-12 text-slate-600 animate-spin mb-4" />
                <p className="text-slate-400">Cargando métricas...</p>
              </div>
            </div>
          ) : metricas && metricas.conectado ? (
            <>
              {/* Memoria */}
              <div className="card rounded-xl p-4 sm:p-6 border border-slate-700/50">
                <h2 className="text-lg sm:text-xl font-bold text-slate-100 mb-4 flex items-center">
                  <HardDrive className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-400" />
                  Memoria
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-slate-400 mb-1">Total</div>
                    <div className="text-lg font-semibold text-slate-100">
                      {metricas.memoria.total_mb !== null ? `${(metricas.memoria.total_mb / 1024).toFixed(2)} GB` : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-slate-400 mb-1">Usada</div>
                    <div className="text-lg font-semibold text-slate-100">
                      {metricas.memoria.usada_mb !== null ? `${(metricas.memoria.usada_mb / 1024).toFixed(2)} GB` : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-slate-400 mb-1">Disponible</div>
                    <div className="text-lg font-semibold text-slate-100">
                      {metricas.memoria.disponible_mb !== null
                        ? `${(metricas.memoria.disponible_mb / 1024).toFixed(2)} GB`
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-slate-400 mb-1">% Usado</div>
                    <div
                      className={`text-lg font-semibold ${
                        metricas.memoria.porcentaje_usado !== null && metricas.memoria.porcentaje_usado > 80
                          ? 'text-red-400'
                          : metricas.memoria.porcentaje_usado !== null && metricas.memoria.porcentaje_usado > 60
                          ? 'text-amber-400'
                          : 'text-slate-100'
                      }`}
                    >
                      {metricas.memoria.porcentaje_usado !== null
                        ? `${metricas.memoria.porcentaje_usado.toFixed(1)}%`
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Operaciones */}
              <div className="card rounded-xl p-4 sm:p-6 border border-slate-700/50">
                <h2 className="text-lg sm:text-xl font-bold text-slate-100 mb-4 flex items-center">
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-green-400" />
                  Operaciones por Segundo
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-slate-400 mb-1">Inserts/seg</div>
                    <div className="text-xl font-bold text-slate-100">
                      {metricas.operaciones.inserts_por_segundo !== null
                        ? metricas.operaciones.inserts_por_segundo.toFixed(2)
                        : '0.00'}
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-slate-400 mb-1">Queries/seg</div>
                    <div className="text-xl font-bold text-slate-100">
                      {metricas.operaciones.queries_por_segundo !== null
                        ? metricas.operaciones.queries_por_segundo.toFixed(2)
                        : '0.00'}
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-slate-400 mb-1">Updates/seg</div>
                    <div className="text-xl font-bold text-slate-100">
                      {metricas.operaciones.updates_por_segundo !== null
                        ? metricas.operaciones.updates_por_segundo.toFixed(2)
                        : '0.00'}
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-slate-400 mb-1">Deletes/seg</div>
                    <div className="text-xl font-bold text-slate-100">
                      {metricas.operaciones.deletes_por_segundo !== null
                        ? metricas.operaciones.deletes_por_segundo.toFixed(2)
                        : '0.00'}
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-slate-400 mb-1">Getmores/seg</div>
                    <div className="text-xl font-bold text-slate-100">
                      {metricas.operaciones.getmores_por_segundo !== null
                        ? metricas.operaciones.getmores_por_segundo.toFixed(2)
                        : '0.00'}
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-slate-400 mb-1">Commands/seg</div>
                    <div className="text-xl font-bold text-slate-100">
                      {metricas.operaciones.commands_por_segundo !== null
                        ? metricas.operaciones.commands_por_segundo.toFixed(2)
                        : '0.00'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Conexiones */}
              <div className="card rounded-xl p-4 sm:p-6 border border-slate-700/50">
                <h2 className="text-lg sm:text-xl font-bold text-slate-100 mb-4 flex items-center">
                  <Server className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-purple-400" />
                  Conexiones
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-slate-400 mb-1">Activas</div>
                    <div className="text-2xl font-bold text-slate-100">
                      {metricas.conexiones.activas !== null ? metricas.conexiones.activas : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-slate-400 mb-1">Disponibles</div>
                    <div className="text-2xl font-bold text-slate-100">
                      {metricas.conexiones.disponibles !== null ? metricas.conexiones.disponibles : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-slate-400 mb-1">Totales Creadas</div>
                    <div className="text-2xl font-bold text-slate-100">
                      {metricas.conexiones.totales !== null ? metricas.conexiones.totales.toLocaleString() : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-slate-400 mb-1">% Usado</div>
                    <div
                      className={`text-2xl font-bold ${
                        metricas.conexiones.porcentaje_usado !== null && metricas.conexiones.porcentaje_usado > 80
                          ? 'text-red-400'
                          : metricas.conexiones.porcentaje_usado !== null &&
                            metricas.conexiones.porcentaje_usado > 60
                          ? 'text-amber-400'
                          : 'text-slate-100'
                      }`}
                    >
                      {metricas.conexiones.porcentaje_usado !== null
                        ? `${metricas.conexiones.porcentaje_usado.toFixed(1)}%`
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cache */}
              {metricas.cache.tamaño_gb !== null && (
                <div className="card rounded-xl p-4 sm:p-6 border border-slate-700/50">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-100 mb-4 flex items-center">
                    <Database className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-cyan-400" />
                    Cache WiredTiger
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
                      <div className="text-xs sm:text-sm text-slate-400 mb-1">Tamaño</div>
                      <div className="text-2xl font-bold text-slate-100">
                        {metricas.cache.tamaño_gb !== null ? `${metricas.cache.tamaño_gb.toFixed(2)} GB` : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
                      <div className="text-xs sm:text-sm text-slate-400 mb-1">Usado</div>
                      <div className="text-2xl font-bold text-slate-100">
                        {metricas.cache.usado_gb !== null ? `${metricas.cache.usado_gb.toFixed(2)} GB` : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
                      <div className="text-xs sm:text-sm text-slate-400 mb-1">Dirty</div>
                      <div className="text-2xl font-bold text-slate-100">
                        {metricas.cache.dirty_mb !== null ? `${metricas.cache.dirty_mb.toFixed(2)} MB` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card rounded-xl p-12 border border-slate-700/50">
              <div className="flex flex-col items-center justify-center">
                <XCircle className="w-16 h-16 text-red-500/50 mb-4" />
                <p className="text-xl font-semibold text-slate-100 mb-2">No se pudo conectar a MongoDB</p>
                <p className="text-slate-400 text-center">
                  {metricas?.errores && metricas.errores.length > 0 ? metricas.errores[0] : 'Error desconocido'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Backups */}
      {tabActivo === 'backups' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center">
              <Save className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-emerald-400" />
              Backups de MongoDB
            </h2>
            <button
              onClick={crearBackup}
              disabled={creandoBackup}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            >
              <Save className={`w-4 h-4 mr-2 ${creandoBackup ? 'animate-spin' : ''}`} />
              {creandoBackup ? 'Creando...' : 'Crear Backup'}
            </button>
          </div>

          {loadingBackups ? (
            <div className="card rounded-xl p-12 border border-slate-700/50">
              <div className="flex flex-col items-center justify-center">
                <RefreshCw className="w-12 h-12 text-slate-600 animate-spin mb-4" />
                <p className="text-slate-400">Cargando backups...</p>
              </div>
            </div>
          ) : backups.length === 0 ? (
            <div className="card rounded-xl p-12 border border-slate-700/50">
              <div className="flex flex-col items-center justify-center">
                <FileText className="w-16 h-16 text-slate-600 mb-4" />
                <p className="text-xl font-semibold text-slate-100 mb-2">No hay backups disponibles</p>
                <p className="text-slate-400 text-center">Crea tu primer backup usando el botón de arriba</p>
              </div>
            </div>
          ) : (
            <div className="card rounded-xl p-4 sm:p-6 border border-slate-700/50">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-slate-300">Nombre</th>
                      <th className="text-right py-3 px-4 text-xs sm:text-sm font-semibold text-slate-300">Tamaño</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-slate-300">
                        Fecha Creación
                      </th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-slate-300">
                        Fecha Modificación
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map((backup, index) => (
                      <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-emerald-400" />
                            <span className="font-medium text-slate-100">{backup.nombre}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300 text-xs sm:text-sm">
                          {formatTamaño(backup.tamaño_bytes)}
                        </td>
                        <td className="py-3 px-4 text-slate-300 text-xs sm:text-sm">
                          {new Date(backup.fecha_creacion).toLocaleString('es-ES')}
                        </td>
                        <td className="py-3 px-4 text-slate-300 text-xs sm:text-sm">
                          {new Date(backup.fecha_modificacion).toLocaleString('es-ES')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Consultas */}
      {tabActivo === 'consultas' && (
        <div className="space-y-4 sm:space-y-6">
          <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center">
            <Search className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-400" />
            Consultas Preestablecidas MongoDB
          </h2>

          <div className="card rounded-xl p-4 sm:p-6 border border-slate-700/50">
            <div className="space-y-4">
              {/* Tipo de Consulta */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tipo de Consulta</label>
                      <select
                        value={tipoConsulta}
                        onChange={(e) => setTipoConsulta(e.target.value as TipoConsulta)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="dte_recientes">DTE Recientes</option>
                  <option value="dte_aceptados">DTE Aceptados</option>
                  <option value="dte_rechazados">DTE Rechazados</option>
                  <option value="dte_pendientes">DTE Pendientes</option>
                  <option value="dte_con_errores">DTE con Errores</option>
                  <option value="dte_por_estado">DTE por Estado</option>
                  <option value="dte_por_cliente">DTE por Cliente</option>
                  <option value="dte_por_tipo">DTE por Tipo</option>
                  <option value="estadisticas_dte">Estadísticas de DTE</option>
                </select>
              </div>

              {/* Configuración */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Base de Datos</label>
                  <input
                    type="text"
                    value={baseDatos}
                    onChange={(e) => setBaseDatos(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="dte_production"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Colección</label>
                  <input
                    type="text"
                    value={coleccion}
                    onChange={(e) => setColeccion(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="dte_transactions"
                  />
                </div>
              </div>

              {/* Filtros según tipo de consulta */}
              {(tipoConsulta === 'dte_por_cliente' || tipoConsulta === 'dte_recientes' || 
                tipoConsulta === 'dte_aceptados' || tipoConsulta === 'dte_rechazados' || 
                tipoConsulta === 'dte_pendientes' || tipoConsulta === 'dte_con_errores' ||
                tipoConsulta === 'estadisticas_dte') && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {tipoConsulta !== 'dte_por_cliente' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Filtrar por Cliente (NIT)</label>
                      <select
                        value={filtroCliente}
                        onChange={(e) => setFiltroCliente(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Todos los clientes</option>
                        {clientes.map((cliente) => (
                          <option key={cliente.nit} value={cliente.nit}>
                            {cliente.nit} - {cliente.nombre || 'Sin nombre'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {(tipoConsulta === 'dte_por_estado' as TipoConsulta) && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Estado</label>
                      <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Todos los estados</option>
                        <option value="aceptado">Aceptado</option>
                        <option value="rechazado">Rechazado</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="enviado">Enviado</option>
                        <option value="firmado">Firmado</option>
                        <option value="error">Error</option>
                        <option value="error_firma">Error Firma</option>
                        <option value="error_envio">Error Envío</option>
                      </select>
                    </div>
                  )}
                  {(tipoConsulta === 'dte_por_tipo' as TipoConsulta) && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Tipo DTE</label>
                      <select
                        value={filtroTipoDte}
                        onChange={(e) => setFiltroTipoDte(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Todos los tipos</option>
                        <option value="01">01 - Factura</option>
                        <option value="03">03 - CCF</option>
                        <option value="05">05 - Nota de Crédito</option>
                        <option value="06">06 - Nota de Débito</option>
                      </select>
                    </div>
                  )}
                  {tipoConsulta === 'dte_por_cliente' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Cliente (NIT) *</label>
                      <select
                        value={filtroCliente}
                        onChange={(e) => setFiltroCliente(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Seleccione un cliente</option>
                        {clientes.map((cliente) => (
                          <option key={cliente.nit} value={cliente.nit}>
                            {cliente.nit} - {cliente.nombre || 'Sin nombre'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Límite */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Límite de Resultados</label>
                <input
                  type="number"
                  value={limiteConsulta}
                  onChange={(e) => setLimiteConsulta(parseInt(e.target.value) || 100)}
                  min={1}
                  max={1000}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={ejecutarConsulta}
                disabled={ejecutandoConsulta || (tipoConsulta === 'dte_por_cliente' && !filtroCliente)}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
              >
                <Play className={`w-4 h-4 mr-2 ${ejecutandoConsulta ? 'animate-spin' : ''}`} />
                {ejecutandoConsulta ? 'Ejecutando...' : 'Ejecutar Consulta'}
              </button>
            </div>
          </div>

          {/* Resultados */}
          {resultadoConsulta && (
            <div className="card rounded-xl p-4 sm:p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-100 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-green-400" />
                  Resultados
                </h3>
                {resultadoConsulta.exitoso && (
                  <div className="text-sm text-slate-400">
                    {resultadoConsulta.total} resultado{resultadoConsulta.total !== 1 ? 's' : ''} en{' '}
                    {resultadoConsulta.tiempo_ms?.toFixed(2)}ms
                  </div>
                )}
              </div>

              {resultadoConsulta.exitoso ? (
                resultadoConsulta.resultados && resultadoConsulta.resultados.length > 0 ? (
                  tipoConsulta === 'estadisticas_dte' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {resultadoConsulta.resultados.map((stat: any, index: number) => (
                        <div key={index} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                          <div className="text-xs sm:text-sm text-slate-400 mb-1">Estado: {stat._id || 'N/A'}</div>
                          <div className="text-2xl font-bold text-slate-100 mb-2">{stat.total || 0}</div>
                          {stat.total_documento && (
                            <div className="text-sm text-slate-300">
                              Total: ${stat.total_documento.toFixed(2)}
                            </div>
                          )}
                          {stat.total_iva && (
                            <div className="text-sm text-slate-300">
                              IVA: ${stat.total_iva.toFixed(2)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-slate-700">
                            {resultadoConsulta.resultados[0] && Object.keys(resultadoConsulta.resultados[0]).slice(0, 8).map((key) => (
                              <th key={key} className="text-left py-2 px-3 font-semibold text-slate-300">
                                {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {resultadoConsulta.resultados.map((doc: any, index: number) => (
                            <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/50">
                              {Object.keys(doc).slice(0, 8).map((key) => (
                                <td key={key} className="py-2 px-3 text-slate-300">
                                  {typeof doc[key] === 'object' ? (
                                    <span className="text-slate-500">[Objeto]</span>
                                  ) : (
                                    String(doc[key] || '').substring(0, 50)
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {resultadoConsulta.resultados.length >= limiteConsulta && (
                        <div className="mt-4 text-xs text-slate-400 text-center">
                          Mostrando {limiteConsulta} resultados. Aumenta el límite para ver más.
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div className="text-center py-8 text-slate-400">No se encontraron resultados</div>
                )
              ) : (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-red-400">
                    <XCircle className="w-5 h-5" />
                    <span className="font-semibold">Error ejecutando consulta</span>
                  </div>
                  <p className="mt-2 text-sm text-red-300">{resultadoConsulta.mensaje}</p>
                  {resultadoConsulta.errores && resultadoConsulta.errores.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {resultadoConsulta.errores.map((error: string, index: number) => (
                        <li key={index} className="text-xs text-red-300">• {error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
