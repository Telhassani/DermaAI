'use client'

import { useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, closestCenter } from '@dnd-kit/core'
import { format, startOfWeek, addDays, isToday, addMinutes } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils/cn'
import { Appointment, AppointmentType } from '@/lib/hooks/use-appointments'
import { DraggableAppointment } from './draggable-appointment'
import { DroppableTimeSlot } from './droppable-time-slot'
import { AppointmentCard } from './appointment-card'
import { toast } from 'sonner'

interface CalendarWeekViewDndProps {
  currentDate: Date
  appointments: Appointment[]
  onAppointmentClick?: (appointment: Appointment) => void
  onTimeSlotClick?: (date: Date, hour: number) => void
  onAppointmentReschedule?: (appointmentId: number, newStartTime: Date, newEndTime: Date) => void
  startHour?: number
  endHour?: number
}

export function CalendarWeekViewDnd({
  currentDate,
  appointments,
  onAppointmentClick,
  onTimeSlotClick,
  onAppointmentReschedule,
  startHour = 7,
  endHour = 20,
}: CalendarWeekViewDndProps) {
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null)

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

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || !onAppointmentReschedule) {
      setActiveAppointment(null)
      return
    }

    const appointment = active.data.current?.appointment as Appointment
    const dropData = over.data.current

    if (dropData?.type === 'time-slot') {
      const newDate = dropData.date as Date
      const newHour = dropData.hour as number

      // Calculate new start and end times
      const oldStart = new Date(appointment.start_time)
      const oldEnd = new Date(appointment.end_time)
      const duration = oldEnd.getTime() - oldStart.getTime()

      const newStart = new Date(newDate)
      newStart.setHours(newHour, 0, 0, 0)

      const newEnd = addMinutes(newStart, duration / (1000 * 60))

      // Check if time is valid
      if (newStart < new Date()) {
        toast.error('Impossible de programmer un rendez-vous dans le passé')
        setActiveAppointment(null)
        return
      }

      // Call reschedule callback
      onAppointmentReschedule(appointment.id, newStart, newEnd)
      toast.success('Rendez-vous reprogrammé')
    }

    setActiveAppointment(null)
  }

  return (
    <DndContext
      onDragStart={(event) => {
        const appointment = event.active.data.current?.appointment as Appointment
        setActiveAppointment(appointment)
      }}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCenter}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-white shadow-sm">
        {/* Week header */}
        <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b bg-gray-50">
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

        {/* Scrollable content */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-[80px_repeat(7,1fr)]">
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
                {weekDays.map((day) => {
                  const isCurrentDay = isToday(day)
                  const slotId = `slot-${format(day, 'yyyy-MM-dd')}-${hour}`

                  return (
                    <DroppableTimeSlot
                      key={slotId}
                      id={slotId}
                      date={day}
                      hour={hour}
                      className={cn(
                        'group relative',
                        isCurrentDay && 'bg-blue-50/30',
                        onTimeSlotClick && 'cursor-pointer hover:bg-blue-50'
                      )}
                    >
                      <div
                        onClick={() => onTimeSlotClick?.(day, hour)}
                        className="absolute inset-0"
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
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    top: style.top,
                                    height: style.height,
                                  }}
                                  className="absolute left-1 right-1 z-20"
                                >
                                  <DraggableAppointment
                                    appointment={appointment}
                                    onClick={onAppointmentClick}
                                    compact={true}
                                    showActions={false}
                                  />
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
                    </DroppableTimeSlot>
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

      {/* Drag overlay */}
      <DragOverlay>
        {activeAppointment && (
          <div className="w-64 rotate-3 opacity-90">
            <AppointmentCard
              appointment={activeAppointment}
              compact={true}
              showActions={false}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
