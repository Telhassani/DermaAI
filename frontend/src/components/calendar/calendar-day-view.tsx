'use client'

import { format, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils/cn'
import { Appointment, AppointmentType } from '@/lib/hooks/use-appointments'
import { AppointmentCard } from './appointment-card'

interface CalendarDayViewProps {
  currentDate: Date
  appointments: Appointment[]
  onAppointmentClick?: (appointment: Appointment) => void
  onAppointmentEdit?: (appointment: Appointment) => void
  onAppointmentDelete?: (appointment: Appointment) => void
  onTimeSlotClick?: (date: Date, hour: number) => void
  startHour?: number
  endHour?: number
}

export function CalendarDayView({
  currentDate,
  appointments,
  onAppointmentClick,
  onAppointmentEdit,
  onAppointmentDelete,
  onTimeSlotClick,
  startHour = 7,
  endHour = 20,
}: CalendarDayViewProps) {
  // Generate hours array
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)

  // Filter appointments for current day
  const dayAppointments = appointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.start_time)
    return format(appointmentDate, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
  })

  // Sort appointments by start time
  const sortedAppointments = [...dayAppointments].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  )

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
      height: `${Math.max(height, 8)}%`, // Minimum height for visibility
    }
  }

  const isCurrentDay = isToday(currentDate)

  return (
    <div className="flex h-full gap-4">
      {/* Main timeline */}
      <div className="flex-1 overflow-hidden rounded-lg border bg-white shadow-sm">
        {/* Day header */}
        <div className={cn('border-b p-4', isCurrentDay && 'bg-blue-50')}>
          <div className="text-sm font-medium text-gray-500">
            {format(currentDate, 'EEEE', { locale: fr })}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={cn(
                'text-3xl font-bold',
                isCurrentDay ? 'text-blue-600' : 'text-gray-900'
              )}
            >
              {format(currentDate, 'd')}
            </span>
            <span className="text-lg text-gray-600">
              {format(currentDate, 'MMMM yyyy', { locale: fr })}
            </span>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {sortedAppointments.length} rendez-vous
          </div>
        </div>

        {/* Scrollable timeline */}
        <div className="relative overflow-auto" style={{ height: 'calc(100% - 120px)' }}>
          <div className="grid grid-cols-[80px_1fr]">
            {hours.map((hour) => (
              <div key={hour} className="contents">
                {/* Time label */}
                <div className="sticky left-0 z-10 border-b border-r bg-gray-50 p-3 text-right">
                  <span className="text-sm font-medium text-gray-600">
                    {hour.toString().padStart(2, '0')}:00
                  </span>
                </div>

                {/* Hour slot */}
                <div
                  onClick={() => onTimeSlotClick?.(currentDate, hour)}
                  className={cn(
                    'group relative min-h-[80px] border-b border-r',
                    isCurrentDay && 'bg-blue-50/20',
                    onTimeSlotClick && 'cursor-pointer hover:bg-blue-50'
                  )}
                >
                  {/* 15-minute markers */}
                  <div className="absolute left-0 right-0 top-[25%] h-px bg-gray-100" />
                  <div className="absolute left-0 right-0 top-[50%] h-px bg-gray-200" />
                  <div className="absolute left-0 right-0 top-[75%] h-px bg-gray-100" />

                  {/* Hover overlay */}
                  {onTimeSlotClick && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="text-sm text-gray-400">Cliquer pour ajouter un rendez-vous</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Appointments overlay */}
          <div className="pointer-events-none absolute left-[80px] right-0 top-0 bottom-0">
            {sortedAppointments.map((appointment) => {
              const style = getAppointmentStyle(appointment)

              return (
                <div
                  key={appointment.id}
                  style={{
                    top: style.top,
                    height: style.height,
                  }}
                  className="pointer-events-auto absolute left-2 right-2 z-20"
                >
                  <AppointmentCard
                    appointment={appointment}
                    onClick={() => onAppointmentClick?.(appointment)}
                    onEdit={() => onAppointmentEdit?.(appointment)}
                    onDelete={() => onAppointmentDelete?.(appointment)}
                    showActions={true}
                  />
                </div>
              )
            })}
          </div>

          {/* Current time indicator */}
          {isCurrentDay && (() => {
            const now = new Date()
            const currentHour = now.getHours()
            const currentMinutes = now.getMinutes()

            if (currentHour >= startHour && currentHour <= endHour) {
              const currentHourFloat = currentHour + currentMinutes / 60
              const topPosition = ((currentHourFloat - startHour) / (endHour - startHour + 1)) * 100

              return (
                <div
                  className="pointer-events-none absolute left-[80px] right-0 z-30"
                  style={{ top: `${topPosition}%` }}
                >
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-red-500 ring-4 ring-red-100" />
                    <div className="h-0.5 flex-1 bg-red-500" />
                  </div>
                  <div className="ml-4 mt-1 text-xs font-medium text-red-600">
                    {format(now, 'HH:mm')}
                  </div>
                </div>
              )
            }
            return null
          })()}
        </div>
      </div>

      {/* Right sidebar: List of appointments */}
      <div className="w-80 overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="border-b bg-gray-50 p-4">
          <h3 className="font-semibold text-gray-900">Rendez-vous du jour</h3>
        </div>
        <div className="overflow-auto p-4" style={{ height: 'calc(100% - 60px)' }}>
          {sortedAppointments.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="rounded-full bg-gray-100 p-4">
                <svg
                  className="h-8 w-8 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="mt-4 text-sm font-medium text-gray-900">Aucun rendez-vous</p>
              <p className="mt-1 text-xs text-gray-500">
                Aucun rendez-vous prévu pour cette journée
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onClick={() => onAppointmentClick?.(appointment)}
                  onEdit={() => onAppointmentEdit?.(appointment)}
                  onDelete={() => onAppointmentDelete?.(appointment)}
                  compact={false}
                  showActions={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
