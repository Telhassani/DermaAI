import { Skeleton, SkeletonCircle, SkeletonText } from '@/components/ui/skeleton'

interface TableSkeletonProps {
  rows?: number
  columns?: number
}

export function TableSkeleton({ rows = 5, columns = 5 }: TableSkeletonProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      {/* Header */}
      <div className="grid gap-4 border-b border-slate-200 p-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonText key={`header-${i}`} className="h-4 w-20" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="grid gap-4 border-b border-slate-100 p-4 last:border-b-0"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <SkeletonText key={`cell-${rowIndex}-${colIndex}`} className="h-4" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function PatientTableRowSkeleton() {
  return (
    <div className="grid grid-cols-6 gap-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <SkeletonCircle className="h-10 w-10" />
        <div className="space-y-2">
          <SkeletonText className="w-32" />
          <SkeletonText className="w-24" />
        </div>
      </div>
      <div className="flex items-center">
        <SkeletonText className="w-28" />
      </div>
      <div className="flex items-center">
        <SkeletonText className="w-20" />
      </div>
      <div className="flex items-center">
        <SkeletonText className="w-36" />
      </div>
      <div className="flex items-center">
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex items-center justify-end gap-2">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </div>
  )
}

export function PatientListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <PatientTableRowSkeleton key={i} />
      ))}
    </div>
  )
}
