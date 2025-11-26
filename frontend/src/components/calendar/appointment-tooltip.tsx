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
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    icon: 'text-blue-500',
  },
  [AppointmentType.FOLLOW_UP]: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    icon: 'text-green-500',
  },
  [AppointmentType.PROCEDURE]: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    icon: 'text-purple-500',
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
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          className={cn('w-64 p-0 border-0', colors.bg)}
        >
          {/* Header with type indicator */}
          <div className={cn('border-l-4 px-4 py-3', colors.text, colors.bg)}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Type and Status badges */}
                <div className="mb-2 flex flex-wrap gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium',
                      colors.bg,
                      colors.text
                    )}
                  >
                    <Briefcase className="h-3 w-3" />
                    {typeLabel}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium',
                      statusInfo.color
                    )}
                  >
                    <Heart className="h-3 w-3" />
                    {statusInfo.label}
                  </span>
                </div>

                {/* Date */}
                <div className="text-xs font-medium capitalize text-gray-600">{dateFormatted}</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-3 px-4 py-3">
            {/* Time */}
            <div className="flex items-center gap-2">
              <Clock className={cn('h-4 w-4', colors.icon)} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {startTime} - {endTime}
                </p>
              </div>
            </div>

            {/* Patient */}
            <div className="flex items-start gap-2">
              <User className={cn('h-4 w-4 mt-0.5', colors.icon)} />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Patient</p>
                <p className="text-sm font-medium text-gray-900">
                  {(appointment as any).patient_name || (appointment as any).guest_name || `ID: ${appointment.patient_id}`}
                </p>
                {((appointment as any).patient_phone || (appointment as any).guest_phone) && (
                  <p className="text-xs text-gray-600">
                    {(appointment as any).patient_phone || (appointment as any).guest_phone}
                  </p>
                )}
                {((appointment as any).patient_email || (appointment as any).guest_email) && (
                  <p className="text-xs text-gray-600">
                    {(appointment as any).patient_email || (appointment as any).guest_email}
                  </p>
                )}
              </div>
            </div>

            {/* Doctor info */}
            <div className="flex items-center gap-2">
              <User className={cn('h-4 w-4', colors.icon)} />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Médecin</p>
                <p className="text-sm font-medium text-gray-900">
                  {(appointment as any).doctor_name || `ID: ${appointment.doctor_id}`}
                </p>
              </div>
            </div>

            {/* Reason */}
            {appointment.reason && (
              <div className="border-t border-gray-200 pt-2">
                <p className="text-xs font-medium text-gray-600">Raison</p>
                <p className="text-sm text-gray-700">{appointment.reason}</p>
              </div>
            )}

            {/* First visit indicator */}
            {appointment.is_first_visit && (
              <div className="rounded bg-blue-100 px-2 py-1.5">
                <p className="text-xs font-medium text-blue-700">✨ Première visite</p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
