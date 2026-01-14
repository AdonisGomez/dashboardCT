import { useEffect, useState } from 'react'
import { BarChart3, RefreshCw } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, XAxis, YAxis } from 'recharts'
import api from '../services/api'

export default function ApiAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [horas, setHoras] = useState<number>(24)

  useEffect(() => {
    loadAnalytics()
    const interval = setInterval(loadAnalytics, 60000) // Actualizar cada minuto
    return () => clearInterval(interval)
  }, [horas])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('horas', horas.toString())

      const response = await api.get(`/api-analytics/api?${params.toString()}`)
      if (response.data.success) {
        setAnalytics(response.data)
      }
    } catch (error) {
      console.error('Error cargando analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400 text-lg">Cargando analytics...</div>
      </div>
    )
  }

  const data = analytics || {
    total_requests: 0,
    requests_por_segundo: 0,
    tiempo_promedio_ms: 0,
    tiempo_p50_ms: 0,
    tiempo_p95_ms: 0,
    tiempo_p99_ms: 0,
    tasa_error_porcentaje: 0,
    total_errores: 0,
    status_codes: {},
    top_endpoints: [],
    clientes_stats: {}
  }

  // Datos para gráfico de status codes
  const statusCodesData = Object.entries(data.status_codes || {}).map(([code, count]) => ({
    code,
    count,
    name: code === '200' ? 'OK' : code === '400' ? 'Bad Request' : code === '401' ? 'Unauthorized' : code === '500' ? 'Server Error' : code
  }))

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6']

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
        <div className="mb-3 sm:mb-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-100 mb-2 gradient-text">
            API Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 flex items-center">
            <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            Métricas de uso y rendimiento de la API
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={horas}
            onChange={(e) => setHoras(Number(e.target.value))}
            className="px-3 py-2 bg-slate-800/80 border border-slate-700/50 rounded-lg text-sm text-slate-300 focus:border-blue-500/50 focus:outline-none"
          >
            <option value="1">Última hora</option>
            <option value="6">Últimas 6 horas</option>
            <option value="24">Últimas 24 horas</option>
            <option value="48">Últimas 48 horas</option>
            <option value="168">Última semana</option>
          </select>
          <button
            onClick={loadAnalytics}
            className="inline-flex items-center px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-slate-800/80 text-slate-300 border border-slate-700/50 hover:border-blue-500/50 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="card p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-slate-400 mb-1">Total Requests</div>
          <div className="text-lg sm:text-2xl font-bold text-slate-100">{data.total_requests.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">{data.requests_por_segundo} req/s</div>
        </div>
        <div className="card p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-slate-400 mb-1">Tiempo Promedio</div>
          <div className="text-lg sm:text-2xl font-bold text-blue-400">
            {data.tiempo_promedio_ms ? `${data.tiempo_promedio_ms}ms` : 'N/A'}
          </div>
          <div className="text-xs text-slate-500 mt-1">P95: {data.tiempo_p95_ms ? `${data.tiempo_p95_ms}ms` : 'N/A'}</div>
        </div>
        <div className="card p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-slate-400 mb-1">Tasa de Error</div>
          <div className={`text-lg sm:text-2xl font-bold ${
            data.tasa_error_porcentaje < 1 ? 'text-emerald-400' : 
            data.tasa_error_porcentaje < 5 ? 'text-amber-400' : 'text-red-400'
          }`}>
            {data.tasa_error_porcentaje.toFixed(2)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">{data.total_errores} errores</div>
        </div>
        <div className="card p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-slate-400 mb-1">P99 Latency</div>
          <div className="text-lg sm:text-2xl font-bold text-purple-400">
            {data.tiempo_p99_ms ? `${data.tiempo_p99_ms}ms` : 'N/A'}
          </div>
          <div className="text-xs text-slate-500 mt-1">P50: {data.tiempo_p50_ms ? `${data.tiempo_p50_ms}ms` : 'N/A'}</div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Status Codes */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Distribución de Status Codes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusCodesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {statusCodesData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Endpoints */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Top Endpoints</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.top_endpoints.slice(0, 10)}>
              <XAxis dataKey="endpoint" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla de Endpoints */}
      <div className="card p-0 overflow-hidden">
        <div className="bg-slate-900/50 px-4 py-3 border-b border-slate-700/50">
          <h3 className="text-sm font-semibold text-slate-300">Endpoints Detallados</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-slate-400">Endpoint</th>
                <th className="px-4 py-3 text-left text-slate-400">Método</th>
                <th className="px-4 py-3 text-right text-slate-400">Total</th>
                <th className="px-4 py-3 text-right text-slate-400">Exitosos</th>
                <th className="px-4 py-3 text-right text-slate-400">Errores</th>
                <th className="px-4 py-3 text-right text-slate-400">Promedio</th>
                <th className="px-4 py-3 text-right text-slate-400">P95</th>
                <th className="px-4 py-3 text-right text-slate-400">Tasa Éxito</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {data.top_endpoints.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No hay datos disponibles
                  </td>
                </tr>
              ) : (
                data.top_endpoints.map((endpoint: any, index: number) => (
                  <tr key={index} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-slate-200 font-mono text-xs">{endpoint.endpoint}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        endpoint.metodo === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                        endpoint.metodo === 'POST' ? 'bg-green-500/20 text-green-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {endpoint.metodo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">{endpoint.total}</td>
                    <td className="px-4 py-3 text-right text-emerald-400">{endpoint.exitosos}</td>
                    <td className="px-4 py-3 text-right text-red-400">{endpoint.errores}</td>
                    <td className="px-4 py-3 text-right text-slate-300">
                      {endpoint.tiempo_promedio ? `${endpoint.tiempo_promedio.toFixed(0)}ms` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">
                      {endpoint.tiempo_p95 ? `${endpoint.tiempo_p95.toFixed(0)}ms` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${
                        endpoint.tasa_exito >= 95 ? 'text-emerald-400' :
                        endpoint.tasa_exito >= 80 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {endpoint.tasa_exito.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Estadísticas por Cliente */}
      {Object.keys(data.clientes_stats || {}).length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Uso por Cliente</h3>
          <div className="space-y-2">
            {Object.entries(data.clientes_stats).slice(0, 10).map(([cliente, stats]: [string, any]) => (
              <div key={cliente} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div>
                  <div className="text-sm font-semibold text-slate-200">{cliente}</div>
                  <div className="text-xs text-slate-400">{Object.keys(stats.endpoints || {}).length} endpoints</div>
                </div>
                <div className="text-lg font-bold text-blue-400">{stats.total}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

