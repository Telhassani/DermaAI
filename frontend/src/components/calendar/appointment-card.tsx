'use client'

import { Clock, User, Phone, FileText, MoreVertical, Edit, Trash2, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Appointment, AppointmentStatus, AppointmentType, AppointmentWithDetails } from '@/lib/hooks/use-appointments'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface AppointmentCardProps {
  appointment: Appointment | AppointmentWithDetails
  onClick?: () => void
  onEdit?: () => void
  onDelete?: (id: number) => void
  onStatusChange?: (status: AppointmentStatus) => void
  compact?: boolean
  showActions?: boolean
}

// Type colors mapping
const typeColors: Record<AppointmentType, { bg: string; border: string; text: string }> = {
  [AppointmentType.CONSULTATION]: {
    bg: 'bg-blue-50',
    border: 'border-l-blue-500',
    text: 'text-blue-700',
  },
  [AppointmentType.FOLLOW_UP]: {
    bg: 'bg-green-50',
    border: 'border-l-green-500',
    text: 'text-green-700',
  },
  [AppointmentType.PROCEDURE]: {
    bg: 'bg-purple-50',
    border: 'border-l-purple-500',
    text: 'text-purple-700',
  },
  [AppointmentType.EMERGENCY]: {
    bg: 'bg-red-50',
    border: 'border-l-red-500',
    text: 'text-red-700',
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

export function AppointmentCard({
  appointment,
  onClick,
  onEdit,
  onDelete,
  onStatusChange,
  compact = false,
  showActions = true,
}: AppointmentCardProps) {
  const colors = typeColors[appointment.type]
  const statusInfo = statusLabels[appointment.status]

  // Format time
  const startTime = new Date(appointment.start_time).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const endTime = new Date(appointment.end_time).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative w-full max-w-full overflow-hidden rounded-lg border-l-4 p-3 shadow-sm transition-all hover:shadow-md',
        colors.border,
        colors.bg,
        onClick && 'cursor-pointer',
        compact && 'p-2'
      )}
    >
      {/* Header */}
      <div className="mb-2 flex items-start justify-between">
        <div className="flex-1 space-y-1">
          {/* Time */}
          <div className="flex min-w-0 items-center gap-1.5">
            <Clock className={cn('h-3.5 w-3.5 flex-shrink-0', colors.text)} />
            <span className={cn('truncate text-xs font-semibold sm:text-sm', colors.text)}>
              {startTime} - {endTime}
            </span>
          </div>

          {/* Patient name (if available) */}
          {!compact && (
            <div className="flex min-w-0 items-center gap-1.5">
              <User className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
              <span className="truncate text-xs font-medium text-gray-900 sm:text-sm">
                {appointment.patient_name || `Patient ID: ${appointment.patient_id}`}
              </span>
              {appointment.is_first_visit && (
                <span className="flex-shrink-0 rounded-full bg-blue-500 px-1.5 py-0.5 text-xs font-medium text-white whitespace-nowrap">
                  1ère visite
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onEdit && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </DropdownMenuItem>
              )}
              {onStatusChange && appointment.status !== AppointmentStatus.COMPLETED && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onStatusChange(AppointmentStatus.COMPLETED)
                  }}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Marquer comme terminé
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); onDelete(appointment.id); }}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Compact mode: just show status badge */}
      {compact && (
        <div className="mt-1">
          <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium', statusInfo.color)}>
            {statusInfo.label}
          </span>
        </div>
      )}

      {/* Indicator badges */}
      <div className="absolute -right-1 -top-1 flex gap-1">
        {appointment.is_upcoming && (
          <div className="h-2 w-2 rounded-full bg-blue-500 ring-2 ring-white" />
        )}
        {appointment.reminder_sent && (
          <div className="h-2 w-2 rounded-full bg-green-500 ring-2 ring-white" />
        )}
      </div>
    </div>
  )
}
