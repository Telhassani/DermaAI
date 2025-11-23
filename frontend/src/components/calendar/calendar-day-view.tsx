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
    <div className="flex h-full flex-col gap-4 md:flex-row">
      {/* Main timeline */}
      <div className="flex-1 overflow-hidden rounded-lg border bg-white shadow-sm">
        {/* ... (content remains the same) ... */}
      </div>

      {/* Right sidebar: List of appointments */}
      <div className="hidden w-full overflow-hidden rounded-lg border bg-white shadow-sm md:block md:w-80">
        <div className="border-b bg-gray-50 p-4">
          <h3 className="font-semibold text-gray-900">Rendez-vous du jour</h3>
        </div>
        <div className="overflow-auto p-4" style={{ height: 'calc(100% - 60px)' }}>
          {sortedAppointments.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              {/* ... (empty state content) ... */}
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
