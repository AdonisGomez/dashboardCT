import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Filter, Globe, Server, Beaker, Network, Power, ArrowUpRight, CheckCircle, XCircle, Cloud, Lock } from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../stores/authStore'

export default function Clientes() {
  const { canWrite, role } = useAuthStore()
  const isViewer = role === 'viewer'
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [totales, setTotales] = useState({ todos: 0, produccion: 0, pruebas: 0 })
  const [accessDeniedModal, setAccessDeniedModal] = useState(false)

  useEffect(() => {
    loadClientes()
  }, [filtro])

  const loadClientes = async () => {
    try {
      const responseTodos = await api.get('/clientes/api?ambiente=todos')
      const todosClientes = responseTodos.data.clientes || []
      
      setTotales({
        todos: todosClientes.length,
        produccion: todosClientes.filter((c: any) => c.ambiente === 'produccion').length,
        pruebas: todosClientes.filter((c: any) => c.ambiente === 'pruebas').length,
      })
      
      if (filtro === 'todos') {
        setClientes(todosClientes)
      } else {
        const clientesFiltrados = todosClientes.filter((c: any) => c.ambiente === filtro)
        setClientes(clientesFiltrados)
      }
    } catch (error) {
      console.error('Error loading clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-2 border-slate-700 border-t-slate-400 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 text-sm">Cargando clientes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">Clientes</h1>
          <p className="text-sm text-slate-500 mt-1">Gestión de clientes del sistema de facturación</p>
        </div>
        {canWrite() ? (
          <Link
            to="/clientes/nuevo"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-sky-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Cliente</span>
          </Link>
        ) : (
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800/50 text-slate-500 text-sm font-medium rounded-xl border border-slate-700/50 cursor-not-allowed">
            <Lock className="w-4 h-4" />
            <span>Solo Lectura</span>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 mr-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm text-slate-400">Ambiente:</span>
        </div>
        {[
          { key: 'todos', label: 'Todos', icon: Globe, count: totales.todos },
          { key: 'produccion', label: 'Producción', icon: Server, count: totales.produccion },
          { key: 'pruebas', label: 'Pruebas', icon: Beaker, count: totales.pruebas },
        ].map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setFiltro(key)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filtro === key
                ? 'bg-slate-700/60 text-slate-100 border border-slate-600'
                : 'bg-slate-800/40 text-slate-400 border border-slate-700/40 hover:bg-slate-800/60 hover:text-slate-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
            <span className="px-1.5 py-0.5 rounded-md bg-slate-900/60 text-xs">{count}</span>
          </button>
        ))}
      </div>

      {/* Grid de Clientes */}
      {clientes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {clientes.map((cliente, index) => (
            <div
              key={cliente.nit}
              onClick={() => {
                if (isViewer) {
                  setAccessDeniedModal(true)
                } else {
                  window.location.href = `/clientes/${cliente.nit}?ambiente=${cliente.ambiente || filtro}`
                }
              }}
              className="group bg-slate-800/40 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-300 cursor-pointer"
              style={{ animation: `fadeIn 0.3s ease ${index * 0.05}s both` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-slate-100 truncate group-hover:text-sky-400 transition-colors">
                    {cliente.nombre_comercial || cliente.nombre || 'Sin nombre'}
                  </h3>
                  {!isViewer ? (
                    <p className="text-xs text-slate-500 font-mono mt-1">NIT: {cliente.nit}</p>
                  ) : (
                    <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Información restringida
                    </p>
                  )}
                </div>
                <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                  cliente.ambiente === 'produccion'
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                    : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'
                }`}>
                  {cliente.ambiente === 'produccion' ? <Server className="w-3 h-3" /> : <Beaker className="w-3 h-3" />}
                  {cliente.ambiente === 'produccion' ? 'Prod' : 'Test'}
                </span>
              </div>

              {/* Estado */}
              <div className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl mb-4">
                <span className="text-xs text-slate-500">Estado</span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                  cliente.estado === 'activo' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {cliente.estado === 'activo' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {cliente.estado === 'activo' ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {/* Info técnica */}
              {!isViewer ? (
                <div className="space-y-2 mb-4">
                  {[
                    { icon: Network, label: 'API', value: `:${cliente.api_port || 'N/A'}`, status: cliente.contenedores?.api === 'running' },
                    { icon: Power, label: 'Firmador', value: `:${cliente.firmador_port || 'N/A'}`, status: cliente.contenedores?.firmador === 'running' },
                  ].map(({ icon: Icon, label, value, status }) => (
                    <div key={label} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-slate-500">
                        <Icon className="w-3.5 h-3.5" /> {label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-300">{value}</span>
                        <span className={`w-1.5 h-1.5 rounded-full ${status ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      </div>
                    </div>
                  ))}
                  {cliente.contenedores?.cloudflared && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-slate-500">
                        <Cloud className="w-3.5 h-3.5" /> Túnel
                      </span>
                      <span className={`font-medium ${cliente.contenedores.cloudflared === 'running' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {cliente.contenedores.cloudflared === 'running' ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-slate-900/40 rounded-xl mb-4">
                  <p className="text-xs text-slate-600 flex items-center gap-2">
                    <Lock className="w-3 h-3" /> Información técnica restringida
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-700/30">
                <span className="text-xs text-slate-500">
                  {isViewer ? 'Acceso restringido' : 'Ver detalles'}
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-800/40 rounded-2xl p-12 border border-slate-700/30 text-center">
          <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Server className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-200 mb-2">Sin clientes</h3>
          <p className="text-sm text-slate-500 mb-6">No hay clientes registrados en el sistema</p>
          {canWrite() && (
            <Link
              to="/clientes/nuevo"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" />
              Agregar Cliente
            </Link>
          )}
        </div>
      )}

      {/* Modal Acceso Denegado */}
      {accessDeniedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setAccessDeniedModal(false)} />
          <div className="relative w-full max-w-sm bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6 text-center">
            <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Acceso Restringido</h3>
            <p className="text-sm text-slate-500 mb-6">
              Tu usuario tiene permisos de solo lectura. No puedes acceder a los detalles de los clientes.
            </p>
            <button
              onClick={() => setAccessDeniedModal(false)}
              className="w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
