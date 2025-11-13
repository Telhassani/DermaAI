'use client'

import { format, isToday, isTomorrow, isYesterday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { Appointment } from '@/lib/hooks/use-appointments'
import { AnimatedAppointmentCard } from './animated-appointment-card'

interface CalendarAgendaViewProps {
  appointments: Appointment[]
  onAppointmentClick?: (appointment: Appointment) => void
  onAppointmentEdit?: (appointment: Appointment) => void
  onAppointmentDelete?: (appointment: Appointment) => void
}

export function CalendarAgendaView({
  appointments,
  onAppointmentClick,
  onAppointmentEdit,
  onAppointmentDelete,
}: CalendarAgendaViewProps) {
  // Sort appointments by start time
  const sortedAppointments = [...appointments].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  )

  // Group appointments by day
  const appointmentsByDay = sortedAppointments.reduce((acc, appointment) => {
    const date = format(new Date(appointment.start_time), 'yyyy-MM-dd')
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(appointment)
    return acc
  }, {} as Record<string, Appointment[]>)

  // Get days array
  const days = Object.keys(appointmentsByDay).sort()

  // Format day header
  const formatDayHeader = (dateString: string) => {
    const date = new Date(dateString)

    if (isToday(date)) {
      return "Aujourd'hui"
    }
    if (isTomorrow(date)) {
      return 'Demain'
    }
    if (isYesterday(date)) {
      return 'Hier'
    }

    return format(date, 'EEEE d MMMM yyyy', { locale: fr })
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      {/* Header */}
      <div className="border-b bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Vue Agenda</h3>
            <p className="mt-1 text-sm text-gray-600">
              {sortedAppointments.length} rendez-vous
            </p>
          </div>
          <CalendarIcon className="h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="overflow-auto p-4" style={{ maxHeight: 'calc(100vh - 300px)' }}>
        {days.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-gray-100 p-4">
              <CalendarIcon className="h-8 w-8 text-gray-400" />
            </div>
            <p className="mt-4 text-sm font-medium text-gray-900">Aucun rendez-vous</p>
            <p className="mt-1 text-xs text-gray-500">
              Aucun rendez-vous prévu pour la période sélectionnée
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {days.map((day, dayIndex) => {
              const date = new Date(day)
              const dayAppointments = appointmentsByDay[day]
              const isCurrentDay = isToday(date)

              return (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: dayIndex * 0.1, duration: 0.3 }}
                  className="space-y-3"
                >
                  {/* Day header */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: dayIndex * 0.1 + 0.1, duration: 0.3 }}
                    className={cn(
                      'sticky top-0 z-10 border-l-4 bg-white py-2 pl-3',
                      isCurrentDay ? 'border-l-blue-600' : 'border-l-gray-200'
                    )}
                  >
                    <h4
                      className={cn(
                        'font-semibold capitalize',
                        isCurrentDay ? 'text-blue-600' : 'text-gray-900'
                      )}
                    >
                      {formatDayHeader(day)}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {dayAppointments.length} rendez-vous
                    </p>
                  </motion.div>

                  {/* Appointments list */}
                  <div className="space-y-2 pl-4">
                    {dayAppointments.map((appointment, index) => (
                      <AnimatedAppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        onClick={() => onAppointmentClick?.(appointment)}
                        onEdit={() => onAppointmentEdit?.(appointment)}
                        onDelete={() => onAppointmentDelete?.(appointment.id)}
                        compact={false}
                        showActions={true}
                        animationDelay={dayIndex * 0.1 + index * 0.05}
                      />
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
