import { Skeleton, SkeletonText, SkeletonButton } from '@/components/ui/skeleton'

export function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <SkeletonText className="h-4 w-24" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  )
}

export function FormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div className="space-y-6 rounded-lg border border-slate-200 bg-white p-6">
      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <FormFieldSkeleton key={i} />
        ))}
      </div>
      <div className="flex gap-3 border-t border-slate-200 pt-6">
        <SkeletonButton className="w-32" />
        <SkeletonButton className="w-24" />
      </div>
    </div>
  )
}

export function PatientFormSkeleton() {
  return (
    <div className="space-y-8">
      {/* Section: Informations personnelles */}
      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-4">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormFieldSkeleton />
          <FormFieldSkeleton />
          <FormFieldSkeleton />
          <FormFieldSkeleton />
        </div>
      </div>

      {/* Section: Contact */}
      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-4">
          <Skeleton className="h-6 w-36" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormFieldSkeleton />
          <FormFieldSkeleton />
          <FormFieldSkeleton />
          <FormFieldSkeleton />
        </div>
      </div>

      {/* Section: Informations médicales */}
      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-4">
          <Skeleton className="h-6 w-52" />
        </div>
        <div className="space-y-4">
          <FormFieldSkeleton />
          <FormFieldSkeleton />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <SkeletonButton className="w-32 h-11" />
        <SkeletonButton className="w-24 h-11" />
      </div>
    </div>
  )
}

export function ConsultationFormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Multiple sections */}
      {Array.from({ length: 4 }).map((_, sectionIndex) => (
        <div key={sectionIndex} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-4">
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, fieldIndex) => (
              <FormFieldSkeleton key={fieldIndex} />
            ))}
          </div>
        </div>
      ))}

      {/* Actions */}
      <div className="flex gap-3">
        <SkeletonButton className="w-40 h-11" />
        <SkeletonButton className="w-24 h-11" />
      </div>
    </div>
  )
}
