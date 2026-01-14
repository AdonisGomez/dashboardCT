import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, CheckCircle, FileText, TrendingUp, Server, Clock, Calendar, Zap, RefreshCw } from 'lucide-react'
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import api from '../services/api'

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 30000) // Actualizar cada 30 segundos
    return () => clearInterval(interval)
  }, [])

  const loadStats = async () => {
    try {
      const response = await api.get('/stats')
      console.log('Stats loaded:', response.data)
      setStats(response.data)
    } catch (error: any) {
      console.error('Error loading stats:', error)
      console.error('Error details:', error.response?.data)
      // Establecer valores por defecto en caso de error
      setStats({
        total_clientes: 0,
        clientes_activos: 0,
        dte_procesados_hoy: 0,
        tasa_exito: 0,
        clientes_produccion: 0,
        clientes_pruebas: 0,
        servicios_activos: 0,
        servicios_totales: 0,
        dte_pendientes_reintento: 0,
        dte_procesados_semana: 0,
        dte_procesados_mes: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400 text-lg">Cargando estadísticas...</div>
      </div>
    )
  }

  // Usar valores por defecto si stats es null
  const statsData = stats || {
    total_clientes: 0,
    clientes_activos: 0,
    dte_procesados_hoy: 0,
    tasa_exito: 0,
    clientes_produccion: 0,
    clientes_pruebas: 0,
    servicios_activos: 0,
    servicios_totales: 0,
    dte_pendientes_reintento: 0,
    dte_procesados_semana: 0,
    dte_procesados_mes: 0,
  }

  // Datos para gráfico de línea (últimos 7 días)
  const dteChartData = [
    { name: 'Lun', value: Math.floor((statsData.dte_procesados_semana || 0) / 7) },
    { name: 'Mar', value: Math.floor((statsData.dte_procesados_semana || 0) / 7) },
    { name: 'Mié', value: Math.floor((statsData.dte_procesados_semana || 0) / 7) },
    { name: 'Jue', value: Math.floor((statsData.dte_procesados_semana || 0) / 7) },
    { name: 'Vie', value: Math.floor((statsData.dte_procesados_semana || 0) / 7) },
    { name: 'Sáb', value: Math.floor((statsData.dte_procesados_semana || 0) / 7) },
    { name: 'Dom', value: statsData.dte_procesados_hoy || 0 },
  ]

  // Datos para gráfico de dona (distribución por ambiente)
  const ambienteChartData = [
    { name: 'Producción', value: statsData.clientes_produccion || 0, color: '#10b981' },
    { name: 'Pruebas', value: statsData.clientes_pruebas || 0, color: '#f59e0b' },
  ]

  const tasaExito = statsData.tasa_exito || 0
  const tasaExitoColor = tasaExito >= 0.9 ? 'text-emerald-400' : tasaExito >= 0.7 ? 'text-amber-400' : 'text-red-400'
  const tasaExitoBg = tasaExito >= 0.9 ? 'bg-emerald-500' : tasaExito >= 0.7 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 md:mb-8">
        <div className="mb-3 sm:mb-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-100 mb-2 gradient-text">Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-400 flex items-center">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            Vista general del sistema en tiempo real
          </p>
        </div>
        <button
          onClick={loadStats}
          className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-300 transition-all hover:border-blue-500 flex items-center justify-center"
        >
          <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
          Actualizar
        </button>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Clientes */}
        <div className="relative card rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-slate-700/50 hover:border-blue-500/50 transition-all overflow-hidden">
          <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-blue-500/10 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 font-medium">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-100">{statsData.total_clientes || 0}</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-300">Clientes Registrados</p>
            <div className="mt-2 flex items-center text-xs text-slate-400">
              <CheckCircle className="w-3 h-3 mr-1 text-emerald-400" />
              <span>Activos: {statsData.clientes_activos || 0}</span>
            </div>
          </div>
        </div>

        {/* Clientes Activos */}
        <div className="relative card rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-slate-700/50 hover:border-emerald-500/50 transition-all overflow-hidden">
          <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-emerald-500/10 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div className="text-right">
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Activos</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-100">{statsData.clientes_activos || 0}</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-300">Clientes Activos</p>
            <div className="mt-2 flex items-center text-[10px] sm:text-xs text-slate-400">
              <span className="text-emerald-400 mr-1">%</span>
              <span className="truncate">
                {statsData.total_clientes > 0
                  ? Math.round((statsData.clientes_activos / statsData.total_clientes) * 100)
                  : 0}% del total
              </span>
            </div>
          </div>
        </div>

        {/* DTE Procesados Hoy */}
        <div className="relative card rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-slate-700/50 hover:border-indigo-500/50 transition-all overflow-hidden">
          <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-indigo-500/10 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div className="text-right">
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Hoy</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-100">{statsData.dte_procesados_hoy || 0}</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-300">DTE Procesados</p>
            <div className="mt-2 flex items-center text-[10px] sm:text-xs text-slate-400">
              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 text-indigo-400" />
              <span>Últimas 24h</span>
            </div>
          </div>
        </div>

        {/* Tasa de Éxito */}
        <div className="relative card rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-slate-700/50 hover:border-amber-500/50 transition-all overflow-hidden">
          <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-amber-500/10 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div className="text-right">
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Éxito</p>
                <p className={`text-xl sm:text-2xl font-bold ${tasaExitoColor}`}>
                  {(tasaExito * 100).toFixed(1)}%
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-300">Tasa de Éxito</p>
            <div className="mt-2">
              <div className="w-full bg-slate-700 rounded-full h-1.5 sm:h-2">
                <div
                  className={`h-1.5 sm:h-2 rounded-full ${tasaExitoBg}`}
                  style={{ width: `${tasaExito * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos y Visualizaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {/* Gráfico de DTE por Día */}
        <div className="card rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-100 flex items-center flex-wrap">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1.5 sm:mr-2 text-blue-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm md:text-base lg:text-lg truncate">DTE Procesados (Últimos 7 días)</span>
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">Tendencia semanal</p>
            </div>
          </div>
          <div className="h-[200px] sm:h-[250px] md:h-[280px] lg:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dteChartData}>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#cbd5e1' }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribución por Ambiente */}
        <div className="card rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-100 flex items-center flex-wrap">
                <Server className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1.5 sm:mr-2 text-purple-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm md:text-base lg:text-lg truncate">Distribución por Ambiente</span>
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">Clientes por ambiente</p>
            </div>
          </div>
          <div className="h-[200px] sm:h-[250px] md:h-[280px] lg:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                  }}
                />
                <Legend
                  wrapperStyle={{ color: '#cbd5e1' }}
                  iconType="circle"
                />
                <Pie
                  data={ambienteChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                >
                  {ambienteChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Estado del Sistema y Acciones Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {/* Estado del Sistema */}
        <div className="card rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-slate-700/50">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-100 mb-3 sm:mb-4 md:mb-6 flex items-center">
            <Server className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1.5 sm:mr-2 text-green-400" />
            <span className="truncate">Estado del Sistema</span>
          </h3>
          <div className="space-y-2 sm:space-y-3 md:space-y-4">
            <div className="flex items-center justify-between p-2 sm:p-2.5 md:p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center min-w-0 flex-1">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-emerald-400 rounded-full mr-2 sm:mr-3 animate-pulse flex-shrink-0"></div>
                <span className="text-xs sm:text-sm text-slate-300 truncate">Servicios Activos</span>
              </div>
              <span className="text-sm sm:text-base md:text-lg font-bold text-slate-100 ml-2 flex-shrink-0">
                {statsData.servicios_activos || 0}/{statsData.servicios_totales || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 sm:p-2.5 md:p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center min-w-0 flex-1">
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-2 sm:mr-3 text-amber-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-slate-300 truncate">DTE Pendientes</span>
              </div>
              <span className="text-sm sm:text-base md:text-lg font-bold text-slate-100 ml-2 flex-shrink-0">
                {statsData.dte_pendientes_reintento || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 sm:p-2.5 md:p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center min-w-0 flex-1">
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-2 sm:mr-3 text-blue-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-slate-300 truncate">DTE Semana</span>
              </div>
              <span className="text-sm sm:text-base md:text-lg font-bold text-slate-100 ml-2 flex-shrink-0">
                {statsData.dte_procesados_semana || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 sm:p-2.5 md:p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center min-w-0 flex-1">
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-2 sm:mr-3 text-indigo-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-slate-300 truncate">DTE Mes</span>
              </div>
              <span className="text-sm sm:text-base md:text-lg font-bold text-slate-100 ml-2 flex-shrink-0">
                {statsData.dte_procesados_mes || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="card rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-slate-100 mb-6 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-400" />
            Acciones Rápidas
          </h3>
          <div className="space-y-3">
            <Link
              to="/clientes/nuevo"
              className="group flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl text-white transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transform hover:scale-105"
            >
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-3" />
                <span className="font-medium">Agregar Cliente</span>
              </div>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link
              to="/clientes"
              className="group flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-200 transition-all hover:border-blue-500 transform hover:scale-105"
            >
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-3" />
                <span className="font-medium">Ver Clientes</span>
              </div>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link
              to="/dte"
              className="group flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-200 transition-all hover:border-blue-500 transform hover:scale-105"
            >
              <div className="flex items-center">
                <FileText className="w-5 h-5 mr-3" />
                <span className="font-medium">Ver DTE</span>
              </div>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>

        {/* Resumen por Ambiente */}
        <div className="card rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-slate-100 mb-6 flex items-center">
            <Server className="w-5 h-5 mr-2 text-purple-400" />
            Resumen por Ambiente
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-emerald-400">Producción</span>
                <span className="text-lg font-bold text-emerald-400">
                  {statsData.clientes_produccion || 0}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{
                    width: `${
                      statsData.total_clientes > 0
                        ? (statsData.clientes_produccion / statsData.total_clientes) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-amber-400">Pruebas</span>
                <span className="text-lg font-bold text-amber-400">
                  {statsData.clientes_pruebas || 0}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full"
                  style={{
                    width: `${
                      statsData.total_clientes > 0
                        ? (statsData.clientes_pruebas / statsData.total_clientes) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
