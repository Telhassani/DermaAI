'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Clock, CheckCircle, ChevronRight } from 'lucide-react'
import { format, addMinutes } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useCheckAppointmentConflictsQuery } from '@/lib/hooks/use-appointments'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'

interface ConflictDetectorProps {
  startTime: Date | null
  endTime: Date | null
  doctorId: number
  excludeAppointmentId?: number
  onSuggestionSelect?: (startTime: Date) => void
  className?: string
}

export function ConflictDetector({
  startTime,
  endTime,
  doctorId,
  excludeAppointmentId,
  onSuggestionSelect,
  className,
}: ConflictDetectorProps) {
  const [shouldCheck, setShouldCheck] = useState(false)

  // Debounce the conflict check
  useEffect(() => {
    if (startTime && endTime && doctorId) {
      const timer = setTimeout(() => {
        setShouldCheck(true)
      }, 500)

      return () => {
        clearTimeout(timer)
        setShouldCheck(false)
      }
    }
  }, [startTime, endTime, doctorId])

  // Check for conflicts
  const { data: conflictData, isLoading } = useCheckAppointmentConflictsQuery(
    shouldCheck && startTime && endTime
      ? {
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          doctor_id: doctorId,
          exclude_appointment_id: excludeAppointmentId,
        }
      : undefined
  )

  // Don't render if not checking or no data
  if (!shouldCheck || !startTime || !endTime) {
    return null
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('rounded-lg border border-gray-200 bg-gray-50 p-4', className)}>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
          <span>Vérification des conflits...</span>
        </div>
      </div>
    )
  }

  // No conflicts
  if (!conflictData?.has_conflict) {
    return (
      <div className={cn('rounded-lg border border-green-200 bg-green-50 p-4', className)}>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium text-green-900">Créneau disponible</p>
            <p className="text-sm text-green-700">
              Aucun conflit détecté pour ce créneau horaire
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Has conflicts
  const conflicts = conflictData.conflicts || []
  const suggestions = conflictData.suggestions || []

  return (
    <div className={cn('space-y-4', className)}>
      {/* Conflict warning */}
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <div className="flex-1">
            <p className="font-medium text-red-900">
              {conflicts.length} conflit{conflicts.length > 1 ? 's' : ''} détecté
              {conflicts.length > 1 ? 's' : ''}
            </p>
            <p className="mt-1 text-sm text-red-700">
              Ce créneau chevauche {conflicts.length} rendez-vous existant
              {conflicts.length > 1 ? 's' : ''}
            </p>

            {/* List of conflicts */}
            <div className="mt-3 space-y-2">
              {conflicts.map((conflict, index) => (
                <div
                  key={index}
                  className="rounded-md bg-white/50 p-2 text-sm text-red-800"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">
                      {format(new Date(conflict.start_time), 'HH:mm')} -{' '}
                      {format(new Date(conflict.end_time), 'HH:mm')}
                    </span>
                  </div>
                  {conflict.reason && (
                    <p className="mt-1 text-xs text-red-600">{conflict.reason}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="mb-3 font-medium text-blue-900">
            Créneaux alternatifs disponibles
          </p>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => {
              const suggestionStart = new Date(suggestion.start_time)
              const suggestionEnd = new Date(suggestion.end_time)
              const duration = (suggestionEnd.getTime() - suggestionStart.getTime()) / (1000 * 60)

              return (
                <button
                  key={index}
                  onClick={() => onSuggestionSelect?.(suggestionStart)}
                  className="flex w-full items-center justify-between rounded-lg border-2 border-blue-200 bg-white p-3 text-left transition-all hover:border-blue-400 hover:bg-blue-50"
                >
                  <div>
                    <div className="flex items-center gap-2 font-medium text-blue-900">
                      <Clock className="h-4 w-4" />
                      {format(suggestionStart, "EEEE d MMMM 'à' HH:mm", { locale: fr })}
                    </div>
                    <p className="mt-1 text-sm text-blue-600">
                      Durée : {duration} minutes • Jusqu'à{' '}
                      {format(suggestionEnd, 'HH:mm')}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 flex-shrink-0 text-blue-400" />
                </button>
              )
            })}
          </div>

          {suggestions.length === 0 && (
            <p className="text-sm text-blue-700">
              Aucun créneau alternatif disponible pour cette durée.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
