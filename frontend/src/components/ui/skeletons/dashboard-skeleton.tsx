import { StatCardSkeleton, ActivityCardSkeleton } from './card-skeleton'
import { Skeleton, SkeletonText, SkeletonTitle } from '@/components/ui/skeleton'

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Welcome section */}
      <div className="space-y-3">
        <Skeleton className="h-9 w-80" />
        <SkeletonText className="w-64" />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <SkeletonTitle className="mb-4 w-36" />
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-lg border border-slate-200 p-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <SkeletonText className="w-32" />
                    <SkeletonText className="w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <SkeletonTitle className="mb-4 w-40" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <ActivityCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>

        {/* Right column - 1/3 width */}
        <div className="space-y-6">
          {/* Upcoming appointments */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <SkeletonTitle className="mb-4 w-48" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <SkeletonText className="w-full" />
                    <SkeletonText className="w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts placeholder */}
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
