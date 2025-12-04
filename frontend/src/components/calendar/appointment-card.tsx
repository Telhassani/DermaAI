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
  extraCompact?: boolean
  showActions?: boolean
}



// Type colors mapping
const typeColors: Record<AppointmentType, { bg: string; border: string; text: string }> = {
  [AppointmentType.CONSULTATION]: {
    bg: 'bg-purple-50',
    border: 'border-l-purple-500',
    text: 'text-purple-700',
  },
  [AppointmentType.FOLLOW_UP]: {
    bg: 'bg-green-50',
    border: 'border-l-green-500',
    text: 'text-green-700',
  },
  [AppointmentType.PROCEDURE]: {
    bg: 'bg-blue-50',
    border: 'border-l-blue-500',
    text: 'text-blue-700',
  },
  [AppointmentType.EMERGENCY]: {
    bg: 'bg-red-50',
    border: 'border-l-red-500',
    text: 'text-red-700',
  },
}

export function AppointmentCard({
  appointment,
  onClick,
  onEdit,
  onDelete,
  onStatusChange,
  compact = false,
  extraCompact = false,
  showActions = true,
}: AppointmentCardProps) {
  const colors = typeColors[appointment.type]

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
        'group relative w-full h-full overflow-hidden rounded-md border transition-all duration-200 hover:shadow-sm hover:border-gray-300',
        colors.bg,
        colors.border.replace('border-l-', 'border-l-[3px] border-'),
        'border-gray-200', // Base border color
        onClick && 'cursor-pointer',
        !extraCompact && 'p-2',
        compact && !extraCompact && 'p-1.5',
        extraCompact && 'p-1'
      )}
    >

      {/* Header */}
      <div className={cn('appt-header flex items-start justify-between', extraCompact ? 'mb-0' : 'mb-1')}>
        <div className="flex-1 min-w-0 space-y-0.5">
          {/* Time */}
          <div className="flex items-center gap-1.5">
            {!compact && !extraCompact && (
              <Clock className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
            )}
            <span className={cn(
              'appt-time truncate font-medium tracking-tight text-gray-900',
              extraCompact ? 'text-[10px]' : compact ? 'text-xs' : 'text-sm'
            )}>
              {extraCompact ? startTime : `${startTime} - ${endTime}`}
            </span>
          </div>

          {/* Patient name (if available) */}
          {!compact && !extraCompact && (
            <div className="appt-details flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
              <span className="truncate text-xs text-gray-600">
                {(appointment as any).patient_name || `Patient ID: ${appointment.patient_id}`}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="appt-actions">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 -mr-1 -mt-1 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3.5 w-3.5 text-gray-400" />
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
          </div>
        )}
      </div>
    </div>
  )
}
