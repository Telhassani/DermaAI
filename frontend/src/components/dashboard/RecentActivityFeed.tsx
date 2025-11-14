'use client'

import { Calendar, FileText, Stethoscope } from 'lucide-react'
import { ActivityItem } from '@/types/analytics'
import Link from 'next/link'

interface RecentActivityFeedProps {
  activities: ActivityItem[]
}

const activityIcons = {
  consultation: Stethoscope,
  appointment: Calendar,
  prescription: FileText,
}

const activityColors = {
  consultation: 'bg-blue-100 text-blue-600',
  appointment: 'bg-green-100 text-green-600',
  prescription: 'bg-purple-100 text-purple-600',
}

const activityLinks = {
  consultation: (id: number) => `/dashboard/consultations/${id}`,
  appointment: (id: number) => `/dashboard/appointments`,
  prescription: (id: number) => `/dashboard/prescriptions/${id}`,
}

export default function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `Il y a ${diffMins} min`
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`
    } else if (diffDays < 7) {
      return `Il y a ${diffDays}j`
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
      })
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Activité récente</h3>

      {activities.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-gray-500">
          Aucune activité récente
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type]
            const colorClass = activityColors[activity.type]
            const link = activityLinks[activity.type](activity.id)

            return (
              <Link
                key={`${activity.type}-${activity.id}`}
                href={link}
                className="block transition-colors hover:bg-gray-50"
              >
                <div className="flex items-start space-x-3 rounded-lg p-3">
                  {/* Icon */}
                  <div className={`rounded-full p-2 ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.patient_name}
                      </p>
                      <span className="text-xs text-gray-500">
                        {formatDate(activity.date)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
