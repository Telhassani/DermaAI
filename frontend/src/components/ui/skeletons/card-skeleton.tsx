import { Skeleton, SkeletonCircle, SkeletonText, SkeletonTitle } from '@/components/ui/skeleton'

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <SkeletonText className="w-24" />
          <SkeletonTitle className="w-16" />
        </div>
        <SkeletonCircle className="h-12 w-12" />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded" />
        <SkeletonText className="w-32" />
      </div>
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonText className="w-28" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="h-12 w-12 rounded-lg" />
      </div>
      <div className="mt-4">
        <SkeletonText className="w-36" />
      </div>
    </div>
  )
}

export function ActivityCardSkeleton() {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-slate-200 bg-white p-4">
      <SkeletonCircle className="h-10 w-10" />
      <div className="flex-1 space-y-2">
        <SkeletonTitle className="w-3/4" />
        <SkeletonText className="w-full" />
        <SkeletonText className="w-24" />
      </div>
    </div>
  )
}
