import { cn } from '@/lib/utils/cn'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-200/60', className)}
      {...props}
    />
  )
}

// Variantes spécifiques
export function SkeletonText({ className, ...props }: SkeletonProps) {
  return <Skeleton className={cn('h-4 w-full', className)} {...props} />
}

export function SkeletonTitle({ className, ...props }: SkeletonProps) {
  return <Skeleton className={cn('h-6 w-3/4', className)} {...props} />
}

export function SkeletonCircle({ className, ...props }: SkeletonProps) {
  return <Skeleton className={cn('h-12 w-12 rounded-full', className)} {...props} />
}

export function SkeletonButton({ className, ...props }: SkeletonProps) {
  return <Skeleton className={cn('h-10 w-24 rounded-lg', className)} {...props} />
}
