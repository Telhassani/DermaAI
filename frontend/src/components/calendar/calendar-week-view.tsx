'use client'

import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils/cn'
import { Appointment, AppointmentType } from '@/lib/hooks/use-appointments'
import { AppointmentCard } from './appointment-card'

interface CalendarWeekViewProps {
  currentDate: Date
  appointments: Appointment[]
  onAppointmentClick?: (appointment: Appointment) => void
  onTimeSlotClick?: (date: Date, hour: number) => void
  startHour?: number
  endHour?: number
}

export function CalendarWeekView({
  currentDate,
  appointments,
  onAppointmentClick,
  onTimeSlotClick,
  startHour = 7,
  endHour = 20,
}: CalendarWeekViewProps) {
  // Get week start (Monday)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })

  // Generate array of 7 days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Generate hours array
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)

  // Group appointments by day
  const appointmentsByDay = appointments.reduce((acc, appointment) => {
    const startDate = new Date(appointment.start_time)
    const dateKey = format(startDate, 'yyyy-MM-dd')
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(appointment)
    return acc
  }, {} as Record<string, Appointment[]>)

  // Get appointments for a specific day
  const getAppointmentsForDay = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return appointmentsByDay[dateKey] || []
  }

  // Calculate position and height for appointment
  const getAppointmentStyle = (appointment: Appointment) => {
    const start = new Date(appointment.start_time)
    const end = new Date(appointment.end_time)

    const startHourFloat = start.getHours() + start.getMinutes() / 60
    const endHourFloat = end.getHours() + end.getMinutes() / 60

    const top = ((startHourFloat - startHour) / (endHour - startHour + 1)) * 100
    const height = ((endHourFloat - startHourFloat) / (endHour - startHour + 1)) * 100

    return {
      top: `${top}%`,
      height: `${height}%`,
    }
  }

  // Type colors
  const typeColors: Record<AppointmentType, string> = {
    [AppointmentType.CONSULTATION]: 'border-l-blue-500 bg-blue-50',
    [AppointmentType.FOLLOW_UP]: 'border-l-green-500 bg-green-50',
    [AppointmentType.PROCEDURE]: 'border-l-purple-500 bg-purple-50',
    [AppointmentType.EMERGENCY]: 'border-l-red-500 bg-red-50',
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="overflow-x-auto border-b bg-gray-50 scrollbar-hide">
        {/* Week header */}
        <div className="min-w-[800px] grid grid-cols-[80px_repeat(7,1fr)]">
          <div className="border-r p-3" /> {/* Empty cell for time column */}
          {weekDays.map((day) => {
            const isCurrentDay = isToday(day)
            const dayNumber = format(day, 'd')
            const dayName = format(day, 'EEE', { locale: fr })

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'border-r p-3 text-center last:border-r-0',
                  isCurrentDay && 'bg-blue-50'
                )}
              >
                <div className="text-xs font-medium uppercase text-gray-500">{dayName}</div>
                <div
                  className={cn(
                    'mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                    isCurrentDay
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-900'
                  )}
                >
                  {dayNumber}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[800px] grid grid-cols-[80px_repeat(7,1fr)]">
          {/* Time column and day columns */}
          {hours.map((hour) => (
            <div key={hour} className="contents">
              {/* Time label */}
              <div className="sticky left-0 z-10 border-b border-r bg-gray-50 p-2 text-right">
                <span className="text-xs font-medium text-gray-500">
                  {hour.toString().padStart(2, '0')}:00
                </span>
              </div>

              {/* Hour slots for each day */}
              {weekDays.map((day, dayIndex) => {
                const isCurrentDay = isToday(day)

                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    onClick={() => onTimeSlotClick?.(day, hour)}
                    className={cn(
                      'group relative min-h-[60px] border-b border-r last:border-r-0',
                      isCurrentDay && 'bg-blue-50/30',
                      onTimeSlotClick && 'cursor-pointer hover:bg-blue-50'
                    )}
                  >
                    {/* Show appointments only in first hour slot to avoid duplication */}
                    {hour === startHour && (
                      <div className="absolute inset-0 overflow-hidden">
                        {getAppointmentsForDay(day).map((appointment) => {
                          const style = getAppointmentStyle(appointment)
                          const startTime = format(new Date(appointment.start_time), 'HH:mm')
                          const endTime = format(new Date(appointment.end_time), 'HH:mm')

                          return (
                            <div
                              key={appointment.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                onAppointmentClick?.(appointment)
                              }}
                              style={{
                                top: style.top,
                                height: style.height,
                              }}
                              className={cn(
                                'absolute left-1 right-1 z-20 overflow-hidden rounded-lg border-l-4 p-2 shadow-sm transition-all hover:shadow-md',
                                typeColors[appointment.type],
                                'cursor-pointer'
                              )}
                            >
                              <div className="text-xs font-semibold text-gray-700">
                                {startTime} - {endTime}
                              </div>
                              <div className="mt-0.5 truncate text-xs text-gray-600">
                                Patient #{appointment.patient_id}
                              </div>
                              {appointment.reason && (
                                <div className="mt-0.5 truncate text-xs text-gray-500">
                                  {appointment.reason}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Hover overlay for empty slots */}
                    {onTimeSlotClick && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="text-xs text-gray-400">+</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Current time indicator (if today is in view) */}
      {weekDays.some((day) => isToday(day)) && (() => {
        const now = new Date()
        const currentHour = now.getHours()
        const currentMinutes = now.getMinutes()

        // Only show if within working hours
        if (currentHour >= startHour && currentHour <= endHour) {
          const currentHourFloat = currentHour + currentMinutes / 60
          const topPosition = ((currentHourFloat - startHour) / (endHour - startHour + 1)) * 100

          return (
            <div
              className="pointer-events-none absolute left-[80px] right-0 z-30"
              style={{ top: `${topPosition + 8}%` }}
            >
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-0.5 flex-1 bg-red-500" />
              </div>
            </div>
          )
        }
        return null
      })()}
    </div>
    </div >
  )
}
