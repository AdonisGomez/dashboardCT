import { memo } from 'react'

// Skeleton base ultraligero
export const Skeleton = memo(function Skeleton({ 
  className = '',
  style
}: { 
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div 
      className={`bg-slate-700/50 rounded animate-pulse ${className}`}
      style={{ animationDuration: '1.5s', ...style }}
    />
  )
})

// Skeleton para cards de estadísticas
export const StatCardSkeleton = memo(function StatCardSkeleton() {
  return (
    <div className="bg-slate-800/40 rounded-2xl p-5 lg:p-6 border border-slate-700/30">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="w-16 h-5 rounded-lg" />
      </div>
      <Skeleton className="w-20 h-10 rounded mb-2" />
      <Skeleton className="w-28 h-4 rounded" />
    </div>
  )
})

// Skeleton para lista de clientes
export const ClientCardSkeleton = memo(function ClientCardSkeleton() {
  return (
    <div className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700/30">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1">
          <Skeleton className="w-32 h-5 rounded mb-2" />
          <Skeleton className="w-24 h-3 rounded" />
        </div>
        <Skeleton className="w-14 h-6 rounded-lg" />
      </div>
      <div className="p-3 bg-slate-900/40 rounded-xl mb-4">
        <Skeleton className="w-full h-4 rounded" />
      </div>
      <div className="space-y-2 mb-4">
        <Skeleton className="w-full h-3 rounded" />
        <Skeleton className="w-full h-3 rounded" />
      </div>
      <div className="pt-3 border-t border-slate-700/30">
        <Skeleton className="w-20 h-4 rounded" />
      </div>
    </div>
  )
})

// Skeleton para lista de DTE
export const DTEItemSkeleton = memo(function DTEItemSkeleton() {
  return (
    <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-700/20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="w-14 h-6 rounded-lg" />
            <Skeleton className="w-20 h-6 rounded-lg" />
            <Skeleton className="w-16 h-4 rounded" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="w-24 h-3 rounded" />
            <Skeleton className="w-32 h-3 rounded" />
          </div>
        </div>
        <Skeleton className="w-24 h-8 rounded-lg" />
      </div>
    </div>
  )
})

// Skeleton para gráficos
export const ChartSkeleton = memo(function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/30">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="w-32 h-5 rounded mb-2" />
          <Skeleton className="w-48 h-3 rounded" />
        </div>
        <Skeleton className="w-24 h-8 rounded-lg" />
      </div>
      <Skeleton className={`w-full rounded-lg`} style={{ height }} />
    </div>
  )
})

// Skeleton para página completa (minimalista)
export const PageSkeleton = memo(function PageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="w-48 h-8 rounded mb-2" />
          <Skeleton className="w-64 h-4 rounded" />
        </div>
        <Skeleton className="w-32 h-10 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    </div>
  )
})

// Skeleton inline ultraligero
export const InlineSkeleton = memo(function InlineSkeleton({ 
  width = 'w-20', 
  height = 'h-4' 
}: { 
  width?: string
  height?: string 
}) {
  return <Skeleton className={`${width} ${height} inline-block`} />
})

