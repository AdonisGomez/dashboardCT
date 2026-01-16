import { useEffect, useState, useMemo, useCallback, memo } from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, 
  CheckCircle, 
  FileText, 
  TrendingUp, 
  Server, 
  Clock, 
  Calendar,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  CircleDot,
  Layers
} from 'lucide-react'
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getCached } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import { StatCardSkeleton, ChartSkeleton } from '../components/Skeleton'

// Componentes memoizados para evitar re-renders
const StatCard = memo(function StatCard({ 
  icon: Icon, 
  value, 
  label, 
  badge, 
  badgeColor = 'text-emerald-400',
  progress 
}: {
  icon: any
  value: React.ReactNode
  label: string
  badge?: { icon: any; text: string }
  badgeColor?: string
  progress?: number
}) {
  return (
    <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-5 lg:p-6 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-150">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 bg-slate-700/50 rounded-xl">
          <Icon className="w-5 h-5 text-slate-400" />
        </div>
        {badge && (
          <div className={`flex items-center gap-1 ${badgeColor}`}>
            <badge.icon className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{badge.text}</span>
          </div>
        )}
      </div>
      <p className="text-3xl lg:text-4xl font-semibold text-slate-100 tracking-tight mb-1">
        {value}
      </p>
      <p className="text-sm text-slate-500 font-medium">{label}</p>
      {progress !== undefined && (
        <div className="mt-3 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${
              progress >= 90 ? 'bg-emerald-500' : progress >= 70 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
})

const COLORS = ['#0ea5e9', '#64748b']

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { role } = useAuthStore()
  const isViewer = role === 'viewer'

  const loadStats = useCallback(async () => {
    try {
      const response = await getCached('/stats', { ttl: 5000 })
      setStats(response.data)
    } catch (error: any) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 30000)
    return () => clearInterval(interval)
  }, [loadStats])

  // Memoizar datos calculados
  const statsData = useMemo(() => stats || {
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
  }, [stats])

  const chartData = useMemo(() => {
    const week = statsData.dte_procesados_semana || 0
    return [
      { day: 'Lun', dte: Math.floor(week * 0.12) },
      { day: 'Mar', dte: Math.floor(week * 0.15) },
      { day: 'Mié', dte: Math.floor(week * 0.18) },
      { day: 'Jue', dte: Math.floor(week * 0.14) },
      { day: 'Vie', dte: Math.floor(week * 0.20) },
      { day: 'Sáb', dte: Math.floor(week * 0.08) },
      { day: 'Hoy', dte: statsData.dte_procesados_hoy || 0 },
    ]
  }, [statsData.dte_procesados_semana, statsData.dte_procesados_hoy])

  const pieData = useMemo(() => [
    { name: 'Producción', value: statsData.clientes_produccion || 0 },
    { name: 'Pruebas', value: statsData.clientes_pruebas || 0 },
  ], [statsData.clientes_produccion, statsData.clientes_pruebas])

  const tasaExito = useMemo(() => statsData.tasa_exito || 0, [statsData.tasa_exito])
  const tasaExitoPercent = useMemo(() => (tasaExito * 100).toFixed(1), [tasaExito])

  // Formatear fecha actual (DEBE estar antes de cualquier return condicional)
  const fechaActual = useMemo(() => new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }), [])

  // Skeleton mientras carga
  if (loading) {
    return (
      <div className="space-y-6 lg:space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <div className="h-4 w-48 bg-slate-700/50 rounded mb-2 animate-pulse" />
            <div className="h-8 w-64 bg-slate-700/50 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><ChartSkeleton /></div>
          <ChartSkeleton height={180} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header minimalista */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-slate-500 text-sm font-medium mb-1 capitalize">{fechaActual}</p>
          <h1 className="text-2xl lg:text-3xl font-semibold text-slate-100 tracking-tight">
            Panel de Control
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 rounded-lg border border-slate-700/50">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <span className="text-xs text-slate-400 font-medium">Sistema operativo</span>
          </div>
        </div>
      </div>

      {/* Métricas principales - Grid sobrio con componentes memoizados */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          icon={Users}
          value={statsData.total_clientes || 0}
          label="Clientes totales"
          badge={{ icon: ArrowUpRight, text: String(statsData.clientes_activos) }}
        />
        <StatCard
          icon={FileText}
          value={statsData.dte_procesados_hoy || 0}
          label="DTE procesados"
          badge={{ icon: Activity, text: 'Hoy' }}
          badgeColor="text-sky-400"
        />
        <StatCard
          icon={TrendingUp}
          value={`${tasaExitoPercent}%`}
          label="Tasa de éxito"
          badge={{ 
            icon: tasaExito >= 0.9 ? ArrowUpRight : ArrowDownRight, 
            text: tasaExito >= 0.9 ? 'Óptimo' : 'Revisar' 
          }}
          badgeColor={tasaExito >= 0.9 ? 'text-emerald-400' : 'text-amber-400'}
          progress={tasaExito * 100}
        />
        <StatCard
          icon={Server}
          value={<>{statsData.servicios_activos || 0}<span className="text-lg text-slate-500">/{statsData.servicios_totales || 0}</span></>}
          label="Servicios activos"
          badge={{ icon: CircleDot, text: 'Activo' }}
        />
      </div>

      {/* Sección de gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de actividad - 2 columnas */}
        <div className="lg:col-span-2 bg-slate-800/40 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/30">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-slate-200">Actividad semanal</h3>
              <p className="text-sm text-slate-500">DTE procesados últimos 7 días</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/40 rounded-lg">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400 font-medium">{statsData.dte_procesados_semana || 0} total</span>
            </div>
          </div>
          <div className="h-[220px] lg:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDte" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                  }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 500 }}
                  itemStyle={{ color: '#0ea5e9' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="dte" 
                  stroke="#0ea5e9" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorDte)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribución por ambiente */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/30">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-slate-200">Distribución</h3>
            <p className="text-sm text-slate-500">Clientes por ambiente</p>
          </div>
          <div className="h-[180px] mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-sky-500"></div>
                <span className="text-sm text-slate-400">Producción</span>
              </div>
              <span className="text-sm font-semibold text-slate-200">{statsData.clientes_produccion || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                <span className="text-sm text-slate-400">Pruebas</span>
              </div>
              <span className="text-sm font-semibold text-slate-200">{statsData.clientes_pruebas || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sección inferior - Estadísticas y acciones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Métricas adicionales */}
        <div className="lg:col-span-2 bg-slate-800/40 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/30">
          <div className="flex items-center gap-2 mb-6">
            <Layers className="w-5 h-5 text-slate-400" />
            <h3 className="text-base font-semibold text-slate-200">Resumen de operaciones</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-700/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-slate-500 font-medium">Pendientes</span>
              </div>
              <p className="text-2xl font-semibold text-slate-100">{statsData.dte_pendientes_reintento || 0}</p>
            </div>
            <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-700/20">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-sky-400" />
                <span className="text-xs text-slate-500 font-medium">Esta semana</span>
              </div>
              <p className="text-2xl font-semibold text-slate-100">{statsData.dte_procesados_semana || 0}</p>
            </div>
            <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-700/20">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-violet-400" />
                <span className="text-xs text-slate-500 font-medium">Este mes</span>
              </div>
              <p className="text-2xl font-semibold text-slate-100">{statsData.dte_procesados_mes || 0}</p>
            </div>
            <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-700/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-500 font-medium">Activos</span>
              </div>
              <p className="text-2xl font-semibold text-slate-100">{statsData.clientes_activos || 0}</p>
            </div>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/30">
          <h3 className="text-base font-semibold text-slate-200 mb-4">Accesos directos</h3>
          <div className="space-y-3">
            {!isViewer && (
              <Link
                to="/clientes/nuevo"
                className="flex items-center justify-between p-4 bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 rounded-xl text-sky-300 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5" />
                  <span className="font-medium">Nuevo cliente</span>
                </div>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            )}
            <Link
              to="/clientes"
              className="flex items-center justify-between p-4 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 rounded-xl text-slate-300 transition-all group"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5" />
                <span className="font-medium">Ver clientes</span>
              </div>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
            <Link
              to="/dte"
              className="flex items-center justify-between p-4 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 rounded-xl text-slate-300 transition-all group"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5" />
                <span className="font-medium">Monitorear DTE</span>
              </div>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
