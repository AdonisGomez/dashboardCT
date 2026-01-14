import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Filter, Globe, Server, Beaker, Network, Power, ArrowRight, CheckCircle, XCircle, Cloud } from 'lucide-react'
import api from '../services/api'

export default function Clientes() {
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [totales, setTotales] = useState({ todos: 0, produccion: 0, pruebas: 0 })

  useEffect(() => {
    loadClientes()
  }, [filtro])

  const loadClientes = async () => {
    try {
      const response = await api.get(`/clientes/api?ambiente=${filtro}`)
      setClientes(response.data.clientes || [])
      // Calcular totales
      const todos = response.data.clientes || []
      setTotales({
        todos: todos.length,
        produccion: todos.filter((c: any) => c.ambiente === 'produccion').length,
        pruebas: todos.filter((c: any) => c.ambiente === 'pruebas').length,
      })
    } catch (error) {
      console.error('Error loading clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400 text-lg">Cargando clientes...</div>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 animate-fade-in px-1 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 md:mb-6">
        <div className="mb-2 sm:mb-0 w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-100 mb-1 sm:mb-2 gradient-text">Clientes</h1>
          <p className="text-[11px] sm:text-xs md:text-sm text-slate-400 flex items-center">
            <Server className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
            <span className="truncate">Gestión completa de clientes del sistema</span>
          </p>
        </div>
        <Link
          to="/clientes/nuevo"
          className="w-full sm:w-auto mt-2 sm:mt-0 inline-flex items-center justify-center px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm sm:text-base font-medium rounded-lg sm:rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 active:scale-95"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
          <span className="hidden sm:inline">Agregar Cliente</span>
          <span className="sm:hidden">Agregar</span>
        </Link>
      </div>

      {/* Filtros de Ambiente */}
      <div className="card rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 border border-slate-700/50">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5 md:gap-3">
          <span className="text-[11px] sm:text-xs md:text-sm font-semibold text-slate-300 flex items-center mb-1 sm:mb-0 sm:w-auto">
            <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
            <span className="hidden sm:inline">Filtrar por ambiente:</span>
            <span className="sm:hidden">Filtrar:</span>
          </span>
          <div className="flex flex-wrap gap-2 sm:gap-2.5 md:gap-3">
            <button
              onClick={() => setFiltro('todos')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs md:text-sm font-medium transition-all active:scale-95 flex items-center justify-center ${
                filtro === 'todos'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-slate-800 text-slate-300 active:bg-slate-700 border border-slate-700'
              }`}
            >
              <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
              <span>Todos</span>
              <span className="ml-1.5 sm:ml-2">({totales.todos})</span>
            </button>
            <button
              onClick={() => setFiltro('produccion')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs md:text-sm font-medium transition-all active:scale-95 flex items-center justify-center ${
                filtro === 'produccion'
                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-800 text-slate-300 active:bg-slate-700 border border-slate-700'
              }`}
            >
              <Server className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">Producción</span>
              <span className="sm:hidden">Prod</span>
              <span className="ml-1.5 sm:ml-2">({totales.produccion})</span>
            </button>
            <button
              onClick={() => setFiltro('pruebas')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs md:text-sm font-medium transition-all active:scale-95 flex items-center justify-center ${
                filtro === 'pruebas'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-500/30'
                  : 'bg-slate-800 text-slate-300 active:bg-slate-700 border border-slate-700'
              }`}
            >
              <Beaker className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">Pruebas</span>
              <span className="sm:hidden">Test</span>
              <span className="ml-1.5 sm:ml-2">({totales.pruebas})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Clientes */}
      {clientes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {clientes.map((cliente, index) => (
            <Link
              key={cliente.nit}
              to={`/clientes/${cliente.nit}?ambiente=${cliente.ambiente || filtro}`}
              className="group card rounded-lg sm:rounded-xl md:rounded-2xl p-3.5 sm:p-4 md:p-5 border border-slate-700/50 active:border-blue-500/50 sm:hover:border-blue-500/50 transition-all active:scale-[0.98] sm:hover:scale-[1.02] sm:hover:shadow-xl sm:hover:shadow-blue-500/20"
              style={{
                animation: `fadeIn 0.5s ease ${index * 0.1}s both`,
              }}
            >
              {/* Header del Card - Nombre Completo */}
              <div className="mb-3 sm:mb-4">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 
                      className="text-sm sm:text-base md:text-lg font-bold text-slate-100 group-active:text-blue-400 sm:group-hover:text-blue-400 transition-colors mb-1 sm:mb-1.5 leading-snug sm:leading-tight break-words"
                      title={cliente.nombre_comercial || cliente.nombre || 'Sin nombre'}
                    >
                      {cliente.nombre_comercial || cliente.nombre || 'Sin nombre'}
                    </h3>
                    {cliente.nombre && cliente.nombre !== cliente.nombre_comercial && (
                      <p className="text-[10px] sm:text-xs text-slate-500 mb-1 sm:mb-1.5 line-clamp-1" title={cliente.nombre}>
                        {cliente.nombre}
                      </p>
                    )}
                    <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-400 font-mono break-all" title={cliente.nit}>
                      NIT: {cliente.nit}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span
                      className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold ${
                        cliente.ambiente === 'produccion'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : cliente.ambiente === 'pruebas'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-700 text-slate-400 border border-slate-600'
                      }`}
                    >
                      {cliente.ambiente === 'produccion' ? (
                        <Server className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 sm:mr-1.5" />
                      ) : (
                        <Beaker className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 sm:mr-1.5" />
                      )}
                      <span className="hidden sm:inline">{cliente.ambiente === 'produccion' ? 'PROD' : 'TEST'}</span>
                      <span className="sm:hidden">{cliente.ambiente === 'produccion' ? 'P' : 'T'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Estado General */}
              <div className="mb-3 sm:mb-4">
                <div className="flex items-center justify-between px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-800/60 rounded-md sm:rounded-lg border border-slate-700/50">
                  <div className="flex items-center text-[10px] sm:text-xs text-slate-400">
                    <Power className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 sm:mr-2 flex-shrink-0" />
                    <span className="hidden sm:inline">Estado General</span>
                    <span className="sm:hidden">Estado</span>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold ${
                      cliente.estado === 'activo'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {cliente.estado === 'activo' ? (
                      <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 flex-shrink-0" />
                    )}
                    <span className="hidden sm:inline">{cliente.estado?.toUpperCase() || 'INACTIVO'}</span>
                    <span className="sm:hidden">{cliente.estado === 'activo' ? 'OK' : 'OFF'}</span>
                  </span>
                </div>
              </div>

              {/* Información Técnica */}
              <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                <div className="flex items-center justify-between px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-800/40 rounded-md sm:rounded-lg">
                  <div className="flex items-center text-[10px] sm:text-xs text-slate-400">
                    <Network className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 sm:mr-2 flex-shrink-0" />
                    <span>API</span>
                  </div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <span className="text-[10px] sm:text-xs font-mono font-semibold text-slate-200">
                      :{cliente.api_port || 'N/A'}
                    </span>
                    {cliente.contenedores?.api === 'running' ? (
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-400 rounded-full animate-pulse flex-shrink-0" title="API Activo"></span>
                    ) : (
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-400 rounded-full flex-shrink-0" title="API Detenido"></span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-800/40 rounded-md sm:rounded-lg">
                  <div className="flex items-center text-[10px] sm:text-xs text-slate-400">
                    <Power className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 sm:mr-2 flex-shrink-0" />
                    <span>Firmador</span>
                  </div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <span className="text-[10px] sm:text-xs font-mono font-semibold text-slate-200">
                      :{cliente.firmador_port || 'N/A'}
                    </span>
                    {cliente.contenedores?.firmador === 'running' ? (
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-400 rounded-full animate-pulse flex-shrink-0" title="Firmador Activo"></span>
                    ) : (
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-400 rounded-full flex-shrink-0" title="Firmador Detenido"></span>
                    )}
                  </div>
                </div>
                {cliente.contenedores && (
                  <div className="flex items-center justify-between px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-800/40 rounded-md sm:rounded-lg">
                    <div className="flex items-center text-[10px] sm:text-xs text-slate-400">
                      <Cloud className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 sm:mr-2 flex-shrink-0" />
                      <span>Túnel</span>
                    </div>
                    <div className="flex items-center">
                      {cliente.contenedores.cloudflared === 'running' ? (
                        <>
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-400 rounded-full animate-pulse mr-1.5 sm:mr-2 flex-shrink-0" title="Cloudflare Activo"></span>
                          <span className="text-[10px] sm:text-xs text-emerald-400 font-semibold">Activo</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-400 rounded-full mr-1.5 sm:mr-2 flex-shrink-0" title="Cloudflare Detenido"></span>
                          <span className="text-[10px] sm:text-xs text-red-400 font-semibold">Inactivo</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer del Card */}
              <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-slate-700/50">
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Ver detalles</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-active:text-blue-400 sm:group-hover:text-blue-400 group-active:translate-x-0.5 sm:group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* Estado Vacío */
        <div className="card rounded-2xl p-16 border border-slate-700/50 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Server className="w-12 h-12 text-slate-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-200 mb-3">No hay clientes registrados</h3>
            <p className="text-slate-400 mb-6">Comienza agregando tu primer cliente al sistema</p>
            <Link
              to="/clientes/nuevo"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transform hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              Agregar Primer Cliente
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
