'use client'

import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils/cn'
import { Appointment, AppointmentType } from '@/lib/hooks/use-appointments'
import { useAppointmentDragDrop } from '@/lib/hooks/use-appointment-drag-drop'
import { useAppointmentResize } from '@/lib/hooks/use-appointment-resize'
import { AppointmentTooltip } from './appointment-tooltip'
import { AnimatedAppointmentCard } from './animated-appointment-card'
import { GripVertical } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface CalendarGridProps {
  currentDate: Date
  appointments: Appointment[]
  onDayClick?: (date: Date) => void
  onAppointmentClick?: (appointment: Appointment) => void
}

export function CalendarGrid({
  currentDate,
  appointments,
  onDayClick,
  onAppointmentClick,
}: CalendarGridProps) {
  const dragDrop = useAppointmentDragDrop(appointments)
  const resize = useAppointmentResize(appointments)
  // Get month boundaries
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)

  // Get calendar boundaries (start from Monday)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  // Get all days to display
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Group appointments by day
  const appointmentsByDay = appointments.reduce((acc, appointment) => {
    const date = format(new Date(appointment.start_time), 'yyyy-MM-dd')
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(appointment)
    return acc
  }, {} as Record<string, Appointment[]>)

  // Weekday headers
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  // Get appointments for a specific day
  const getAppointmentsForDay = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return appointmentsByDay[dateKey] || []
  }

  // Type colors for dots
  const typeColors: Record<AppointmentType, string> = {
    [AppointmentType.CONSULTATION]: 'bg-blue-500',
    [AppointmentType.FOLLOW_UP]: 'bg-green-500',
    [AppointmentType.PROCEDURE]: 'bg-purple-500',
    [AppointmentType.EMERGENCY]: 'bg-red-500',
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b bg-gray-50">
        {weekDays.map((day) => (
          <div
            key={day}
            className="border-r p-3 text-center text-sm font-semibold text-gray-600 last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dayAppointments = getAppointmentsForDay(day)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isTodayDate = isToday(day)
          const dayNumber = format(day, 'd')

          const isWeekend = day.getDay() === 0 || day.getDay() === 6

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDayClick?.(day)}
              className={cn(
                'group relative min-h-[120px] border-b border-r p-2 transition-colors last:border-r-0',
                (index + 1) % 7 === 0 && 'border-r-0',
                index >= days.length - 7 && 'border-b-0',
                isCurrentMonth ? (isWeekend ? 'bg-gray-50/50' : 'bg-white') : 'bg-gray-50',
                onDayClick && 'cursor-pointer hover:bg-blue-50',
                isTodayDate && 'bg-blue-50 ring-2 ring-inset ring-blue-500',
                dragDrop.isDraggingAppointment && 'ring-1 ring-blue-200 bg-blue-50/10'
              )}
              onDragOver={(e) => {
                e.preventDefault()
                e.currentTarget.classList.add('bg-blue-100')
                dragDrop.handleDragOver(e)
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('bg-blue-100')
              }}
              onDrop={(e) => {
                e.currentTarget.classList.remove('bg-blue-100')
                dragDrop.handleDrop(day)(e)
              }}
            >
              {/* Day number */}
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium transition-colors',
                    isTodayDate
                      ? 'bg-blue-600 text-white'
                      : isCurrentMonth
                        ? 'text-gray-900 group-hover:bg-gray-100'
                        : 'text-gray-400'
                  )}
                >
                  {dayNumber}
                </span>
                {dayAppointments.length > 0 && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {dayAppointments.length}
                  </span>
                )}
              </div>

              {/* Appointments list (first 3) */}
              <div className="space-y-1">
                {dayAppointments.slice(0, 3).map((appointment, index) => (
                  <AnimatedAppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onClick={(app) => {
                      onAppointmentClick?.(app)
                    }}
                    compact={true}
                    showActions={false}
                    animationDelay={index * 0.05}
                    draggable
                    onDragStart={dragDrop.handleDragStart(appointment, 'month-view')}
                    onDragOver={dragDrop.handleDragOver}
                    onDrop={(e) => {
                      e.stopPropagation()
                      dragDrop.handleDrop(day)(e)
                    }}
                    className={cn(
                      'relative mb-1',
                      dragDrop.isDraggingAppointment && dragDrop.dragState.draggedAppointment?.id === appointment.id && 'opacity-50'
                    )}
                  />
                ))}

                {/* Show more indicator with Popover */}
                {dayAppointments.length > 3 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          // Don't navigate, just open popover
                        }}
                        className="w-full rounded px-2 py-1 text-left text-xs font-medium text-blue-600 hover:bg-blue-100"
                      >
                        +{dayAppointments.length - 3} plus
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-3" align="start">
                      <div className="mb-2 font-medium text-gray-900">
                        {format(day, 'EEEE d MMMM', { locale: fr })}
                      </div>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {dayAppointments.map((appointment) => (
                          <AnimatedAppointmentCard
                            key={appointment.id}
                            appointment={appointment}
                            onClick={(app) => {
                              onAppointmentClick?.(app)
                            }}
                            compact={true}
                            showActions={false}
                          />
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {/* Hover overlay for empty days */}
              {dayAppointments.length === 0 && onDayClick && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="text-xs text-gray-400">Cliquer pour ajouter</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
