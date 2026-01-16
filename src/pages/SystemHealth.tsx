import { useEffect, useState } from 'react'
import { Activity, RefreshCw, Cpu, HardDrive, MemoryStick, Network, Server } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, Legend, XAxis, YAxis } from 'recharts'
import api from '../services/api'
import { useAuthStore } from '../stores/authStore'
import RestrictedAccess from '../components/RestrictedAccess'

export default function SystemHealth() {
  const { role } = useAuthStore()
  
  // Bloquear acceso a viewers
  if (role === 'viewer') {
    return <RestrictedAccess title="System Health - Acceso Bloqueado" message="Las métricas del sistema contienen información sensible de infraestructura. Solo los administradores pueden acceder a esta sección." />
  }
  const [metricas, setMetricas] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [historial, setHistorial] = useState<any[]>([])

  useEffect(() => {
    loadMetricas()
    const interval = setInterval(loadMetricas, 5000) // Actualizar cada 5 segundos
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (metricas) {
      setHistorial(prev => {
        const nuevo = [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          cpu: metricas.cpu?.porcentaje || 0,
          memoria: metricas.memoria?.porcentaje_usado || 0,
          disco: metricas.disco?.porcentaje_usado || 0
        }]
        // Mantener solo últimos 20 puntos
        return nuevo.slice(-20)
      })
    }
  }, [metricas])

  const loadMetricas = async () => {
    try {
      const response = await api.get('/system-health/api')
      if (response.data.success) {
        setMetricas(response.data)
      }
    } catch (error) {
      console.error('Error cargando métricas:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !metricas) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400 text-lg">Cargando métricas del sistema...</div>
      </div>
    )
  }

  const data = metricas || {
    cpu: { porcentaje: 0, cores: 0 },
    memoria: { total_gb: 0, usada_gb: 0, disponible_gb: 0, porcentaje_usado: 0 },
    disco: { total_gb: 0, usado_gb: 0, disponible_gb: 0, porcentaje_usado: 0 },
    red: { bytes_enviados_mb: 0, bytes_recibidos_mb: 0 },
    sistema: { uptime_dias: 0, procesos_activos: 0 }
  }

  const getColor = (porcentaje: number) => {
    if (porcentaje < 50) return 'text-emerald-400'
    if (porcentaje < 80) return 'text-amber-400'
    return 'text-red-400'
  }

  const getBgColor = (porcentaje: number) => {
    if (porcentaje < 50) return 'bg-emerald-500'
    if (porcentaje < 80) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
        <div className="mb-3 sm:mb-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-100 mb-2 gradient-text">
            System Health
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 flex items-center">
            <Activity className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            Métricas del sistema en tiempo real
          </p>
        </div>
        <button
          onClick={loadMetricas}
          className="inline-flex items-center px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-slate-800/80 text-slate-300 border border-slate-700/50 hover:border-blue-500/50 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
          <span className="hidden sm:inline">Actualizar</span>
        </button>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* CPU */}
        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-semibold text-slate-300">CPU</h3>
            </div>
            <span className={`text-2xl font-bold ${getColor(data.cpu?.porcentaje || 0)}`}>
              {data.cpu?.porcentaje?.toFixed(1) || 0}%
            </span>
          </div>
          <div className="space-y-2 text-xs text-slate-400">
            {data.cpu?.cores && (
              <div>Cores: {data.cpu.cores}</div>
            )}
            {data.cpu?.frecuencia_mhz && (
              <div>Frecuencia: {data.cpu.frecuencia_mhz.toFixed(0)} MHz</div>
            )}
          </div>
          <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${getBgColor(data.cpu?.porcentaje || 0)} transition-all`}
              style={{ width: `${data.cpu?.porcentaje || 0}%` }}
            />
          </div>
        </div>

        {/* Memoria */}
        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <MemoryStick className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-semibold text-slate-300">Memoria</h3>
            </div>
            <span className={`text-2xl font-bold ${getColor(data.memoria?.porcentaje_usado || 0)}`}>
              {data.memoria?.porcentaje_usado?.toFixed(1) || 0}%
            </span>
          </div>
          <div className="space-y-2 text-xs text-slate-400">
            <div>Total: {data.memoria?.total_gb || 0} GB</div>
            <div>Usada: {data.memoria?.usada_gb || 0} GB</div>
            <div>Disponible: {data.memoria?.disponible_gb || 0} GB</div>
          </div>
          <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${getBgColor(data.memoria?.porcentaje_usado || 0)} transition-all`}
              style={{ width: `${data.memoria?.porcentaje_usado || 0}%` }}
            />
          </div>
        </div>

        {/* Disco */}
        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-300">Disco</h3>
            </div>
            <span className={`text-2xl font-bold ${getColor(data.disco?.porcentaje_usado || 0)}`}>
              {data.disco?.porcentaje_usado?.toFixed(1) || 0}%
            </span>
          </div>
          <div className="space-y-2 text-xs text-slate-400">
            <div>Total: {data.disco?.total_gb || 0} GB</div>
            <div>Usado: {data.disco?.usado_gb || 0} GB</div>
            <div>Disponible: {data.disco?.disponible_gb || 0} GB</div>
          </div>
          <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${getBgColor(data.disco?.porcentaje_usado || 0)} transition-all`}
              style={{ width: `${data.disco?.porcentaje_usado || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Gráfico de Tendencias */}
      {historial.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Tendencias (Últimos 20 puntos)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={historial}>
              <defs>
                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCpu)" name="CPU %" />
              <Area type="monotone" dataKey="memoria" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorMem)" name="Memoria %" />
              <Area type="monotone" dataKey="disco" stroke="#f59e0b" fillOpacity={1} fill="url(#colorDisk)" name="Disco %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Información Adicional */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Red */}
        {data.red && (data.red.bytes_enviados_mb !== null || data.red.bytes_recibidos_mb !== null) && (
          <div className="card p-4">
            <div className="flex items-center space-x-2 mb-4">
              <Network className="w-5 h-5 text-green-400" />
              <h3 className="text-sm font-semibold text-slate-300">Red</h3>
            </div>
            <div className="space-y-2 text-sm">
              {data.red.bytes_enviados_mb !== null && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Enviados:</span>
                  <span className="text-slate-200">{data.red.bytes_enviados_mb.toFixed(2)} MB</span>
                </div>
              )}
              {data.red.bytes_recibidos_mb !== null && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Recibidos:</span>
                  <span className="text-slate-200">{data.red.bytes_recibidos_mb.toFixed(2)} MB</span>
                </div>
              )}
              {data.red.paquetes_enviados !== null && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Paquetes Enviados:</span>
                  <span className="text-slate-200">{data.red.paquetes_enviados.toLocaleString()}</span>
                </div>
              )}
              {data.red.paquetes_recibidos !== null && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Paquetes Recibidos:</span>
                  <span className="text-slate-200">{data.red.paquetes_recibidos.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sistema */}
        <div className="card p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Server className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-300">Sistema</h3>
          </div>
          <div className="space-y-2 text-sm">
            {data.sistema?.uptime_dias !== null && data.sistema?.uptime_dias !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-400">Uptime:</span>
                <span className="text-slate-200">{data.sistema.uptime_dias.toFixed(1)} días</span>
              </div>
            )}
            {data.sistema?.uptime_texto && (
              <div className="flex justify-between">
                <span className="text-slate-400">Uptime:</span>
                <span className="text-slate-200">{data.sistema.uptime_texto}</span>
              </div>
            )}
            {data.sistema?.procesos_activos !== null && data.sistema?.procesos_activos !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-400">Procesos:</span>
                <span className="text-slate-200">{data.sistema.procesos_activos}</span>
              </div>
            )}
            {data.timestamp && (
              <div className="flex justify-between">
                <span className="text-slate-400">Última actualización:</span>
                <span className="text-slate-200 text-xs">
                  {new Date(data.timestamp).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

