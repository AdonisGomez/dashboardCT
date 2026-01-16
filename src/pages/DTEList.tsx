import { useEffect, useState } from 'react'
import {
  FileText,
  RefreshCw,
  Users,
  Tag,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  AlertTriangle,
  Server,
  Beaker,
  Eye,
  Filter,
  User,
  Calendar,
  Activity,
  Lock,
} from 'lucide-react'
import api from '../services/api'
import DTEDetailModal from '../components/DTEDetailModal'
import { useAuthStore } from '../stores/authStore'

const tipoDTENombres: Record<string, string> = {
  '01': 'Factura',
  '03': 'CCF',
  '04': 'Nota de Débito',
  '05': 'Nota de Crédito',
  '06': 'Registro de Factura',
  '07': 'Factura de Exportación',
  '08': 'Factura de Compra',
  '09': 'Factura de Consignación',
  '11': 'Factura de Donación',
  '14': 'Factura de Regalo',
}

interface DTE {
  codigo_generacion: string
  estado: string
  ambiente: string
  tipo_dte: string
  cliente_id: string
  fecha_creacion: string
}

interface DTEStats {
  total: number
  aceptados: number
  rechazados: number
  pendientes: number
}

interface DTETipoInfo {
  nombre: string
  total: number
}

export default function DTEList() {
  const { role } = useAuthStore()
  const isViewer = role === 'viewer'
  
  const [dteList, setDteList] = useState<DTE[]>([])
  const [dtePorCliente, setDtePorCliente] = useState<Record<string, DTEStats>>({})
  const [dtePorTipo, setDtePorTipo] = useState<Record<string, DTETipoInfo>>({})
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroAmbiente, setFiltroAmbiente] = useState('produccion')
  
  const [selectedDTE, setSelectedDTE] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    loadClientes()
    loadDTE()
    loadEstadisticas()

    const interval = setInterval(() => {
      if (!modalOpen) {
        loadDTE()
        loadEstadisticas()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [modalOpen])

  useEffect(() => {
    loadDTE()
  }, [filtroCliente, filtroEstado, filtroAmbiente])

  const loadClientes = async () => {
    try {
      const response = await api.get('/clientes/api?ambiente=todos')
      setClientes(response.data.clientes || [])
    } catch (error) {
      console.error('Error loading clientes:', error)
    }
  }

  const loadDTE = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filtroCliente) params.append('cliente_id', filtroCliente)
      if (filtroEstado) params.append('estado', filtroEstado)
      const ambiente = filtroAmbiente || 'produccion'
      params.append('ambiente', ambiente)
      params.append('limite', '100')

      const response = await api.get(`/dte/api/tiempo-real?${params.toString()}`)
      
      if (response.data.success) {
        setDteList(response.data.dte || [])
      } else {
        setDteList([])
      }
    } catch (error: any) {
      console.error('Error loading DTE:', error)
      setDteList([])
    } finally {
      setLoading(false)
    }
  }

  const loadEstadisticas = async () => {
    try {
      const responseCliente = await api.get('/dte/api/por-dia-cliente')
      if (responseCliente.data.success) {
        setDtePorCliente(responseCliente.data.dte_por_cliente || {})
      }

      const responseTipo = await api.get('/dte/api/por-tipo')
      if (responseTipo.data.success) {
        setDtePorTipo(responseTipo.data.dte_por_tipo || {})
      }
    } catch (error) {
      console.error('Error loading estadísticas:', error)
    }
  }

  const formatearFecha = (fechaStr?: string) => {
    if (!fechaStr) return 'N/A'
    try {
      let date: Date
      if (fechaStr.includes('+') || fechaStr.includes('Z') || (fechaStr.includes('-') && fechaStr.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}/))) {
        date = new Date(fechaStr)
      } else {
        const normalized = fechaStr.replace(' ', 'T')
        date = new Date(normalized + '-06:00')
      }
      
      return date.toLocaleString('es-ES', {
        timeZone: 'America/Guatemala',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return fechaStr
    }
  }

  const getStatusStyle = (estado: string) => {
    const styles: Record<string, string> = {
      aceptado: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      rechazado: 'bg-red-500/15 text-red-400 border-red-500/30',
      enviado: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
      pendiente: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      firmado: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    }
    return styles[estado] || 'bg-slate-700/50 text-slate-400 border-slate-600/50'
  }

  const getStatusIcon = (estado: string) => {
    const icons: Record<string, JSX.Element> = {
      aceptado: <CheckCircle className="w-3 h-3" />,
      rechazado: <XCircle className="w-3 h-3" />,
      enviado: <Send className="w-3 h-3" />,
      pendiente: <Clock className="w-3 h-3" />,
    }
    return icons[estado] || <AlertTriangle className="w-3 h-3" />
  }

  if (loading && dteList.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-2 border-slate-700 border-t-slate-400 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 text-sm">Cargando documentos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">Monitoreo DTE</h1>
          <p className="text-sm text-slate-500 mt-1">Visualización en tiempo real de documentos tributarios</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 rounded-lg border border-slate-700/50">
            <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-400">Auto-refresh 5s</span>
          </div>
          <button
            onClick={() => { loadDTE(); loadEstadisticas() }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 rounded-xl text-sm text-slate-300 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por Cliente - Solo visible para admin */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/30">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-slate-700/50 rounded-xl">
              <Users className="w-5 h-5 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">DTE por Cliente (Hoy)</h3>
          </div>
          {isViewer ? (
            <div className="text-center py-8">
              <Lock className="w-10 h-10 mx-auto mb-3 text-slate-600" />
              <p className="text-sm text-slate-500">Información restringida</p>
              <p className="text-xs text-slate-600 mt-1">Solo administradores</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {Object.keys(dtePorCliente).length > 0 ? (
                Object.entries(dtePorCliente)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([clienteId, stats]) => (
                    <div key={clienteId} className="p-3 bg-slate-900/40 rounded-xl border border-slate-700/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-slate-400 truncate max-w-[200px]">{clienteId}</span>
                        <span className="text-lg font-semibold text-slate-100">{stats.total}</span>
                      </div>
                      <div className="flex gap-4 text-xs">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle className="w-3 h-3" /> {stats.aceptados}
                        </span>
                        <span className="flex items-center gap-1 text-red-400">
                          <XCircle className="w-3 h-3" /> {stats.rechazados}
                        </span>
                        <span className="flex items-center gap-1 text-amber-400">
                          <Clock className="w-3 h-3" /> {stats.pendientes}
                        </span>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                  <p className="text-sm">Sin DTE procesados hoy</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Por Tipo */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/30">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-slate-700/50 rounded-xl">
              <Tag className="w-5 h-5 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">DTE por Tipo (Hoy)</h3>
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {Object.keys(dtePorTipo).length > 0 ? (
              Object.entries(dtePorTipo)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([tipoDte, info]) => (
                  <div key={tipoDte} className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-slate-700/20">
                    <div>
                      <span className="text-sm font-medium text-slate-200">{info.nombre}</span>
                      <span className="text-xs text-slate-500 ml-2">({tipoDte})</span>
                    </div>
                    <span className="text-lg font-semibold text-slate-100">{info.total}</span>
                  </div>
                ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Tag className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                <p className="text-sm">Sin DTE procesados hoy</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/30">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-300">Filtros</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <select
            value={filtroCliente}
            onChange={(e) => setFiltroCliente(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-700/50 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-slate-600"
          >
            <option value="">Todos los clientes</option>
            {clientes.map((cliente) => (
              <option key={cliente.nit} value={cliente.nit}>
                {cliente.nombre_comercial || cliente.nombre || cliente.nit}
              </option>
            ))}
          </select>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-700/50 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-slate-600"
          >
            <option value="">Todos los estados</option>
            <option value="aceptado">Aceptado</option>
            <option value="rechazado">Rechazado</option>
            <option value="enviado">Enviado</option>
            <option value="pendiente">Pendiente</option>
          </select>
          <select
            value={filtroAmbiente}
            onChange={(e) => setFiltroAmbiente(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-700/50 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-slate-600"
          >
            <option value="produccion">Producción</option>
            <option value="pruebas">Pruebas</option>
          </select>
          <button
            onClick={() => {
              setFiltroCliente('')
              setFiltroEstado('')
              setFiltroAmbiente('produccion')
            }}
            className="px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-xl text-sm text-slate-300 transition-all"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Lista de DTE */}
      <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/30">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-700/50 rounded-xl">
              <FileText className="w-5 h-5 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">Últimos DTE</h3>
          </div>
          <span className="px-3 py-1 bg-sky-500/15 text-sky-400 rounded-lg text-xs font-medium border border-sky-500/30">
            {dteList.length} documentos
          </span>
        </div>

        <div className="space-y-3">
          {dteList.length > 0 ? (
            dteList.map((dte, index) => (
              <div
                key={dte.codigo_generacion || index}
                className="p-4 bg-slate-900/40 rounded-xl border border-slate-700/20 hover:border-slate-600/40 transition-all"
                style={{ animation: `fadeIn 0.3s ease ${index * 0.03}s both` }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {/* Ambiente */}
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${
                        dte.ambiente === '01' || dte.ambiente === 'produccion'
                          ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                          : 'bg-slate-700/50 text-slate-400 border-slate-600/50'
                      }`}>
                        {dte.ambiente === '01' || dte.ambiente === 'produccion' ? <Server className="w-3 h-3" /> : <Beaker className="w-3 h-3" />}
                        {dte.ambiente === '01' || dte.ambiente === 'produccion' ? 'PROD' : 'TEST'}
                      </span>
                      {/* Estado */}
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${getStatusStyle(dte.estado)}`}>
                        {getStatusIcon(dte.estado)}
                        {(dte.estado || 'N/A').toUpperCase()}
                      </span>
                      {/* Tipo */}
                      <span className="text-xs text-slate-500">
                        {tipoDTENombres[dte.tipo_dte] || dte.tipo_dte || 'N/A'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {isViewer ? (
                          <span className="flex items-center gap-1 text-slate-600">
                            <Lock className="w-2.5 h-2.5" /> Restringido
                          </span>
                        ) : (
                          <span className="font-mono">{dte.cliente_id || 'N/A'}</span>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatearFecha(dte.fecha_creacion)}
                      </span>
                      {!isViewer && (
                        <span className="font-mono text-slate-600 text-[10px]">
                          {dte.codigo_generacion?.substring(0, 12)}...
                        </span>
                      )}
                    </div>
                  </div>
                  {isViewer ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 border border-slate-700/30 rounded-lg text-xs text-slate-500">
                      <Lock className="w-3 h-3" />
                      Restringido
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedDTE(dte.codigo_generacion)
                        setModalOpen(true)
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-lg text-xs text-slate-300 transition-all"
                    >
                      <Eye className="w-3 h-3" />
                      Ver detalle
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-sm">No hay DTE registrados</p>
              <p className="text-xs text-slate-600 mt-1">Los documentos aparecerán aquí en tiempo real</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal */}
      {selectedDTE && (
        <DTEDetailModal
          codigoGeneracion={selectedDTE}
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setSelectedDTE(null)
          }}
        />
      )}
    </div>
  )
}
