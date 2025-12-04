'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Appointment, AppointmentType, AppointmentStatus } from '@/lib/hooks/use-appointments'
import { Clock, User, Heart, Briefcase } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils/cn'

interface AppointmentTooltipProps {
  appointment: Appointment
  children: React.ReactNode
}

// Type colors mapping
const typeColors: Record<AppointmentType, { bg: string; text: string; icon: string }> = {
  [AppointmentType.CONSULTATION]: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    icon: 'text-purple-500',
  },
  [AppointmentType.FOLLOW_UP]: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    icon: 'text-green-500',
  },
  [AppointmentType.PROCEDURE]: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    icon: 'text-blue-500',
  },
  [AppointmentType.EMERGENCY]: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    icon: 'text-red-500',
  },
}

// Status labels mapping
const statusLabels: Record<AppointmentStatus, { label: string; color: string }> = {
  [AppointmentStatus.SCHEDULED]: { label: 'Planifié', color: 'bg-gray-100 text-gray-700' },
  [AppointmentStatus.CONFIRMED]: { label: 'Confirmé', color: 'bg-blue-100 text-blue-700' },
  [AppointmentStatus.IN_PROGRESS]: { label: 'En cours', color: 'bg-yellow-100 text-yellow-700' },
  [AppointmentStatus.COMPLETED]: { label: 'Terminé', color: 'bg-green-100 text-green-700' },
  [AppointmentStatus.CANCELLED]: { label: 'Annulé', color: 'bg-red-100 text-red-700' },
  [AppointmentStatus.NO_SHOW]: { label: 'Absent', color: 'bg-orange-100 text-orange-700' },
}

// Type labels mapping
const typeLabels: Record<AppointmentType, string> = {
  [AppointmentType.CONSULTATION]: 'Consultation',
  [AppointmentType.FOLLOW_UP]: 'Suivi',
  [AppointmentType.PROCEDURE]: 'Intervention',
  [AppointmentType.EMERGENCY]: 'Urgence',
}

export function AppointmentTooltip({ appointment, children }: AppointmentTooltipProps) {
  const colors = typeColors[appointment.type]
  const statusInfo = statusLabels[appointment.status]
  const typeLabel = typeLabels[appointment.type]

  // Format times
  const startTime = format(new Date(appointment.start_time), 'HH:mm', { locale: fr })
  const endTime = format(new Date(appointment.end_time), 'HH:mm', { locale: fr })
  const dateFormatted = format(new Date(appointment.start_time), 'EEEE d MMMM yyyy', {
    locale: fr,
  })

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          className={cn('w-80 p-0 border border-gray-100 shadow-xl bg-white rounded-xl overflow-hidden z-50')}
        >
          {/* Header with color strip */}
          <div className={cn('px-4 py-3 border-b border-gray-100 flex justify-between items-start bg-opacity-30', colors.bg)}>
            <div>
              <p className={cn('text-xs font-bold uppercase tracking-wider mb-0.5', colors.text)}>
                {typeLabel}
              </p>
              <p className="text-sm font-semibold text-gray-900 capitalize">
                {dateFormatted}
              </p>
            </div>
            <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium bg-white bg-opacity-60', colors.text)}>
              {statusInfo.label}
            </span>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Time */}
            <div className="flex items-start gap-3">
              <div className={cn('p-1.5 rounded-md mt-0.5', colors.bg)}>
                <Clock className={cn('h-4 w-4', colors.icon)} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {startTime} - {endTime}
                </p>
                <p className="text-xs text-gray-500">Heure du rendez-vous</p>
              </div>
            </div>

            {/* Patient */}
            <div className="flex items-start gap-3">
              <div className={cn('p-1.5 rounded-md mt-0.5', colors.bg)}>
                <User className={cn('h-4 w-4', colors.icon)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {(appointment as any).patient_name || (appointment as any).guest_name || `ID: ${appointment.patient_id}`}
                </p>
                <div className="space-y-0.5 mt-0.5">
                  {((appointment as any).patient_phone || (appointment as any).guest_phone) && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="opacity-70">Tél:</span> {(appointment as any).patient_phone || (appointment as any).guest_phone}
                    </p>
                  )}
                  {((appointment as any).patient_email || (appointment as any).guest_email) && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                      <span className="opacity-70">Email:</span> {(appointment as any).patient_email || (appointment as any).guest_email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Reason */}
            {appointment.reason && (
              <div className="flex items-start gap-3">
                <div className={cn('p-1.5 rounded-md mt-0.5', colors.bg)}>
                  <Briefcase className={cn('h-4 w-4', colors.icon)} />
                </div>
                <div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {appointment.reason}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Motif de consultation</p>
                </div>
              </div>
            )}

            {/* Footer / First visit */}
            {appointment.is_first_visit && (
              <div className="mt-2 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                  <Heart className="h-4 w-4 fill-current" />
                  <span className="text-xs font-semibold">Première visite du patient</span>
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
