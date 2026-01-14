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
} from 'lucide-react'
import api from '../services/api'
import DTEDetailModal from '../components/DTEDetailModal'

// Mapeo de tipos DTE
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
  const [dteList, setDteList] = useState<DTE[]>([])
  const [dtePorCliente, setDtePorCliente] = useState<Record<string, DTEStats>>({})
  const [dtePorTipo, setDtePorTipo] = useState<Record<string, DTETipoInfo>>({})
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroAmbiente, setFiltroAmbiente] = useState('produccion') // Por defecto producción - NUNCA mezclar ambientes
  
  // Modal de detalles
  const [selectedDTE, setSelectedDTE] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    loadClientes()
    loadDTE()
    loadEstadisticas()

    // Actualizar cada 5 segundos
    const interval = setInterval(() => {
      loadDTE()
      loadEstadisticas()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Recargar cuando cambien los filtros
    console.log('🔄 Filtros cambiaron, recargando DTEs...', {
      filtroCliente,
      filtroEstado,
      filtroAmbiente
    })
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
      // SIEMPRE enviar ambiente - por defecto producción si no está especificado (NUNCA mezclar ambientes)
      const ambiente = filtroAmbiente || 'produccion'
      params.append('ambiente', ambiente)
      params.append('limite', '100')

      console.log(`🔍 Cargando DTEs con filtros:`, {
        ambiente,
        cliente: filtroCliente || 'todos',
        estado: filtroEstado || 'todos',
        url: `/dte/api/tiempo-real?${params.toString()}`
      })

      const response = await api.get(`/dte/api/tiempo-real?${params.toString()}`)
      console.log('📥 Respuesta del servidor:', {
        success: response.data.success,
        total: response.data.total,
        dteCount: response.data.dte?.length || 0
      })
      
      if (response.data.success) {
        const dtes = response.data.dte || []
        console.log(`✅ Cargados ${dtes.length} DTEs del ambiente "${ambiente}"`)
        if (dtes.length > 0) {
          console.log('📋 Primer DTE:', {
            codigo: dtes[0].codigo_generacion?.substring(0, 20),
            estado: dtes[0].estado,
            ambiente: dtes[0].ambiente,
            cliente: dtes[0].cliente_id
          })
        }
        setDteList(dtes)
      } else {
        console.error('❌ Error en respuesta del servidor:', response.data)
        setDteList([])
      }
    } catch (error: any) {
      console.error('❌ Error loading DTE:', error)
      if (error.response) {
        console.error('Response status:', error.response.status)
        console.error('Response data:', error.response.data)
        if (error.response.status === 401) {
          console.error('⚠️ Sesión expirada o no autenticado')
        }
      }
      setDteList([])
    } finally {
      setLoading(false)
    }
  }

  const loadEstadisticas = async () => {
    try {
      // DTE por cliente
      const responseCliente = await api.get('/dte/api/por-dia-cliente')
      if (responseCliente.data.success) {
        setDtePorCliente(responseCliente.data.dte_por_cliente || {})
      }

      // DTE por tipo
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
      // Las fechas vienen sin timezone desde MongoDB (naive datetime)
      // Asumimos que están en hora de Centroamérica (GMT-6)
      let date: Date
      if (fechaStr.includes('+') || fechaStr.includes('Z') || (fechaStr.includes('-') && fechaStr.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}/))) {
        // Ya tiene timezone
        date = new Date(fechaStr)
      } else {
        // No tiene timezone, asumir que es hora de Centroamérica (GMT-6)
        const normalized = fechaStr.replace(' ', 'T')
        date = new Date(normalized + '-06:00')
      }
      
      return date.toLocaleString('es-ES', {
        timeZone: 'America/Guatemala',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    } catch {
      return fechaStr
    }
  }


  const obtenerClaseEstado = (estado: string) => {
    const clases: Record<string, string> = {
      aceptado: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      rechazado: 'bg-red-500/20 text-red-400 border border-red-500/30',
      enviado: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      pendiente: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      firmado: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
    }
    return clases[estado] || 'bg-slate-700 text-slate-400 border border-slate-600'
  }

  const obtenerIconoEstado = (estado: string) => {
    switch (estado) {
      case 'aceptado':
        return <CheckCircle className="w-3 h-3" />
      case 'rechazado':
        return <XCircle className="w-3 h-3" />
      case 'enviado':
        return <Send className="w-3 h-3" />
      case 'pendiente':
        return <Clock className="w-3 h-3" />
      default:
        return <AlertTriangle className="w-3 h-3" />
    }
  }

  const obtenerClaseAmbiente = (ambiente: string) => {
    // Según schema: '00' = Pruebas, '01' = Producción
    if (ambiente === '01' || ambiente === 'produccion') {
      return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    } else if (ambiente === '00' || ambiente === 'pruebas') {
      return 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
    }
    return 'bg-slate-700 text-slate-400 border border-slate-600'
  }

  const obtenerNombreAmbiente = (ambiente: string) => {
    // Según schema: '00' = Pruebas, '01' = Producción
    if (ambiente === '01' || ambiente === 'produccion') {
      return 'PRODUCCIÓN'
    } else if (ambiente === '00' || ambiente === 'pruebas') {
      return 'PRUEBAS'
    }
    return (ambiente || 'N/A').toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400 text-lg">Cargando DTE...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 md:mb-8">
        <div className="mb-3 sm:mb-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text mb-2 flex items-center">
            <FileText className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mr-1.5 sm:mr-2" />
            <span className="text-lg sm:text-2xl md:text-3xl lg:text-4xl">Monitoreo DTE en Tiempo Real</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 flex items-center">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            Visualización en tiempo real de DTE procesados
          </p>
        </div>
        <div className="mt-2 sm:mt-0 flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <button
            onClick={() => {
              loadDTE()
              loadEstadisticas()
            }}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-300 transition-all hover:border-blue-500 transform hover:scale-105 flex items-center justify-center"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            Actualizar
          </button>
          <div className="flex items-center justify-center sm:justify-start space-x-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-slate-400">Actualizando cada 5s</span>
          </div>
        </div>
      </div>

      {/* Estadísticas del Día */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {/* DTE por Cliente (Hoy) */}
        <div className="card rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-slate-700/50">
          <div className="flex items-center mb-3 sm:mb-4 md:mb-6">
            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
              <Users className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-white" />
            </div>
            <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-slate-100 truncate">DTE por Cliente (Hoy)</h3>
          </div>
          <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-80 md:max-h-96 overflow-y-auto scrollbar-hide">
            {Object.keys(dtePorCliente).length > 0 ? (
              Object.entries(dtePorCliente)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([clienteId, stats]) => (
                  <div key={clienteId} className="p-2.5 sm:p-3 md:p-4 bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-700/50">
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      <span className="font-semibold text-slate-200 font-mono text-[10px] sm:text-xs md:text-sm truncate flex-1 min-w-0 pr-2">{clienteId}</span>
                      <span className="text-base sm:text-lg font-bold text-blue-400 flex-shrink-0">{stats.total}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                      <div className="text-emerald-400 flex items-center">
                        <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                        <span className="truncate">{stats.aceptados}</span>
                      </div>
                      <div className="text-red-400 flex items-center">
                        <XCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                        <span className="truncate">{stats.rechazados}</span>
                      </div>
                      <div className="text-amber-400 flex items-center">
                        <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                        <span className="truncate">{stats.pendientes}</span>
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-6 sm:py-8 text-slate-500">
                <FileText className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto mb-2 text-slate-600" />
                <p className="text-xs sm:text-sm">No hay DTE procesados hoy</p>
              </div>
            )}
          </div>
        </div>

        {/* DTE por Tipo (Hoy) */}
        <div className="card rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-slate-700/50">
          <div className="flex items-center mb-3 sm:mb-4 md:mb-6">
            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
              <Tag className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-white" />
            </div>
            <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-slate-100 truncate">DTE por Tipo (Hoy)</h3>
          </div>
          <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-96 overflow-y-auto scrollbar-hide">
            {Object.keys(dtePorTipo).length > 0 ? (
              Object.entries(dtePorTipo)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([tipoDte, info]) => (
                  <div key={tipoDte} className="p-3 sm:p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 pr-2">
                        <span className="font-semibold text-slate-200 text-xs sm:text-sm block sm:inline">{info.nombre}</span>
                        <span className="text-xs text-slate-400 ml-0 sm:ml-2 block sm:inline">({tipoDte})</span>
                      </div>
                      <span className="text-base sm:text-lg font-bold text-purple-400 flex-shrink-0">{info.total}</span>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-6 sm:py-8 text-slate-500">
                <FileText className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-slate-600" />
                <p className="text-xs sm:text-sm">No hay DTE procesados hoy</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-slate-700/50">
        <div className="flex items-center mb-3 sm:mb-4">
          <Filter className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 mr-1.5 sm:mr-2 text-blue-400 flex-shrink-0" />
          <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-100">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">Cliente</label>
            <select
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los clientes</option>
              {clientes.map((cliente) => (
                <option key={cliente.nit} value={cliente.nit}>
                  {cliente.nombre_comercial || cliente.nombre || cliente.nit}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="aceptado">Aceptado</option>
              <option value="rechazado">Rechazado</option>
              <option value="enviado">Enviado</option>
              <option value="pendiente">Pendiente</option>
              <option value="error">Error</option>
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">Ambiente</label>
            <select
              value={filtroAmbiente}
              onChange={(e) => setFiltroAmbiente(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="produccion">Producción</option>
              <option value="pruebas">Pruebas</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFiltroCliente('')
                setFiltroEstado('')
                setFiltroAmbiente('produccion') // Resetear a producción por defecto - NUNCA mezclar ambientes
              }}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-xs sm:text-sm font-semibold transition-all hover:border-blue-500"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de DTE en Tiempo Real */}
      <div className="card rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-slate-700/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 md:mb-6 gap-2 sm:gap-0">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
              <FileText className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-white" />
            </div>
            <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-slate-100 truncate">Últimos DTE Procesados</h3>
          </div>
          <span className="px-2 sm:px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap">
            {dteList.length} DTE
          </span>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {dteList.length > 0 ? (
            dteList.map((dte, index) => (
              <div
                key={dte.codigo_generacion || index}
                className="dte-card p-3 sm:p-4 bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-700/50 hover:border-blue-500/50 transition-all transform hover:scale-[1.01]"
                style={{
                  animation: `fadeIn 0.5s ease ${index * 0.05}s both`,
                }}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 mb-2">
                      <span className="font-mono text-[10px] sm:text-xs text-slate-400 truncate">
                        {dte.codigo_generacion?.substring(0, 8) || 'N/A'}...
                      </span>
                      <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-semibold ${obtenerClaseEstado(dte.estado)}`}>
                        {obtenerIconoEstado(dte.estado)}
                        <span className="ml-0.5 sm:ml-1 truncate">{(dte.estado || 'desconocido').toUpperCase()}</span>
                      </span>
                      <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-semibold ${obtenerClaseAmbiente(dte.ambiente)}`}>
                        {dte.ambiente === '01' || dte.ambiente === 'produccion' ? (
                          <Server className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                        ) : (
                          <Beaker className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                        )}
                        <span className="truncate">{obtenerNombreAmbiente(dte.ambiente)}</span>
                      </span>
                      <span className="text-[10px] sm:text-xs text-slate-500 truncate">
                        Tipo: <span className="font-semibold text-slate-300">
                          {tipoDTENombres[dte.tipo_dte] || dte.tipo_dte || 'N/A'}
                        </span>
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-[10px] sm:text-xs text-slate-400">
                      <span className="flex items-center min-w-0">
                        <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                        <span className="truncate">Cliente: <span className="font-mono text-slate-300 ml-0.5">{dte.cliente_id || 'N/A'}</span></span>
                      </span>
                      <span className="flex items-center whitespace-nowrap">
                        <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                        {formatearFecha(dte.fecha_creacion)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-0 sm:ml-4 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        setSelectedDTE(dte.codigo_generacion)
                        setModalOpen(true)
                      }}
                      className="w-full sm:w-auto px-2.5 sm:px-3 py-1 sm:py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-[10px] sm:text-xs font-medium text-blue-400 transition-colors flex items-center justify-center"
                    >
                      <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                      Ver
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 sm:py-12 text-slate-500">
              <FileText className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4 text-slate-600" />
              <p className="text-sm sm:text-base md:text-lg">No hay DTE registrados</p>
              <p className="text-xs sm:text-sm mt-1 sm:mt-2">Los DTE procesados aparecerán aquí en tiempo real</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de Detalles */}
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
