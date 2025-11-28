'use client'

import { useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, closestCenter, useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core'
import { format, isToday, addMinutes, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils/cn'
import { Appointment, AppointmentType } from '@/lib/hooks/use-appointments'
import { DraggableAppointment } from './draggable-appointment'
import { DroppableTimeSlot } from './droppable-time-slot'
import { AppointmentCard } from './appointment-card'
import { toast } from 'sonner'

interface CalendarDayViewDndProps {
  currentDate: Date
  appointments: Appointment[]
  onAppointmentClick?: (appointment: Appointment) => void
  onAppointmentEdit?: (appointment: Appointment) => void
  onAppointmentDelete?: (appointment: Appointment) => void
  onTimeSlotClick?: (date: Date, hour: number) => void
  onAppointmentReschedule?: (appointmentId: number, newStartTime: Date, newEndTime: Date) => void
  startHour?: number
  endHour?: number
}

export function CalendarDayViewDnd({
  currentDate,
  appointments,
  onAppointmentClick,
  onAppointmentEdit,
  onAppointmentDelete,
  onTimeSlotClick,
  onAppointmentReschedule,
  startHour = 7,
  endHour = 20,
}: CalendarDayViewDndProps) {
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 3, // Reduced from 10 for more responsive drag
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150, // Reduced from 250 for better mobile experience
        tolerance: 5,
      },
    })
  )

  // Generate hours array
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)

  // Filter appointments for current day
  const dayAppointments = appointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.start_time)
    return isSameDay(appointmentDate, currentDate)
  })

  // Sort appointments by start time
  const sortedAppointments = [...dayAppointments].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  )

  // Detect overlapping appointments and create column layout
  const getAppointmentGroups = (appointmentsToGroup: Appointment[]) => {
    if (appointmentsToGroup.length === 0) return []

    // Sort by start time
    const sorted = [...appointmentsToGroup].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )

    // Group overlapping appointments
    const groups: Appointment[][] = []
    let currentGroup: Appointment[] = [sorted[0]]

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i]
      const lastInGroup = currentGroup[currentGroup.length - 1]

      const currentStart = new Date(current.start_time).getTime()
      const lastEnd = new Date(lastInGroup.end_time).getTime()

      // If current appointment starts before last appointment ends, they overlap
      if (currentStart < lastEnd) {
        currentGroup.push(current)
      } else {
        groups.push(currentGroup)
        currentGroup = [current]
      }
    }
    groups.push(currentGroup)

    return groups
  }

  // Create a map of appointment ID to column information
  const appointmentColumnMap = (() => {
    const groups = getAppointmentGroups(sortedAppointments)
    const map = new Map<number, { columnIndex: number; columnCount: number }>()

    groups.forEach((group) => {
      group.forEach((appointment, index) => {
        map.set(appointment.id, {
          columnIndex: index,
          columnCount: group.length,
        })
      })
    })

    return map
  })()

  // Calculate position and height for appointment with column layout
  const getAppointmentStyle = (appointment: Appointment) => {
    const start = new Date(appointment.start_time)
    const end = new Date(appointment.end_time)

    const startHourFloat = start.getHours() + start.getMinutes() / 60
    const endHourFloat = end.getHours() + end.getMinutes() / 60

    const top = ((startHourFloat - startHour) / (endHour - startHour + 1)) * 100
    const height = ((endHourFloat - startHourFloat) / (endHour - startHour + 1)) * 100

    // Get column information for this appointment
    const columnInfo = appointmentColumnMap.get(appointment.id) || { columnIndex: 0, columnCount: 1 }
    const columnWidth = 100 / columnInfo.columnCount
    const left = columnInfo.columnIndex * columnWidth

    return {
      top: `${top}%`,
      height: `${Math.max(height, 8)}%`, // Minimum height for visibility
      left: `${left}%`,
      width: `${columnWidth}%`,
    }
  }

  const isCurrentDay = isToday(currentDate)

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
      sensors={sensors}
      onDragStart={(event) => {
        const appointment = event.active.data.current?.appointment as Appointment
        setActiveAppointment(appointment)
      }}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCenter}
    >
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
              {hours.map((hour) => {
                const slotId = `slot-${format(currentDate, 'yyyy-MM-dd')}-${hour}`

                return (
                  <div key={hour} className="contents">
                    {/* Time label */}
                    <div className="sticky left-0 z-10 border-b border-r bg-gray-50 p-3 text-right">
                      <span className="text-sm font-medium text-gray-600">
                        {hour.toString().padStart(2, '0')}:00
                      </span>
                    </div>

                    {/* Hour slot */}
                    <DroppableTimeSlot
                      id={slotId}
                      date={currentDate}
                      hour={hour}
                      className={cn(
                        'group relative',
                        isCurrentDay && 'bg-blue-50/20',
                        onTimeSlotClick && 'cursor-pointer hover:bg-blue-50'
                      )}
                    >
                      <div onClick={() => onTimeSlotClick?.(currentDate, hour)} className="absolute inset-0">
                        {/* 15-minute markers */}
                        <div className="absolute left-0 right-0 top-[25%] h-px bg-gray-100" />
                        <div className="absolute left-0 right-0 top-[50%] h-px bg-gray-200" />
                        <div className="absolute left-0 right-0 top-[75%] h-px bg-gray-100" />

                        {/* Show appointments only in first hour slot to avoid duplication */}
                        {hour === startHour && (
                          <div
                            className="absolute inset-0 z-20 pointer-events-none"
                            style={{ height: `${hours.length * 100}%` }}
                          >
                            {sortedAppointments.map((appointment) => {
                              const style = getAppointmentStyle(appointment)

                              return (
                                <div
                                  key={appointment.id}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    top: style.top,
                                    height: style.height,
                                    left: style.left,
                                    width: style.width,
                                  }}
                                  className="absolute pointer-events-auto overflow-hidden px-0.5"
                                >
                                  <DraggableAppointment
                                    appointment={appointment}
                                    onClick={onAppointmentClick}
                                    onEdit={onAppointmentEdit}
                                    onDelete={(id) => {
                                      const appt = appointments.find((a) => a.id === id)
                                      if (appt) onAppointmentDelete?.(appt)
                                    }}
                                    compact={false}
                                    showActions={true}
                                  />
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Hover overlay */}
                        {onTimeSlotClick && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                            <span className="text-sm text-gray-400">Cliquer pour ajouter un rendez-vous</span>
                          </div>
                        )}
                      </div>
                    </DroppableTimeSlot>
                  </div>
                )
              })}
            </div>

            {/* Current time indicator (if today) */}
            {isCurrentDay && (() => {
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
                    style={{ top: `${topPosition}%` }}
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
        </div>

        {/* Sidebar with appointment list */}
        <div className="w-80 space-y-3 overflow-auto rounded-lg border bg-white p-4 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900">Rendez-vous du jour</h3>
            <p className="text-sm text-gray-500">{sortedAppointments.length} au total</p>
          </div>

          {sortedAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-2">📅</div>
              <p className="text-sm text-gray-500">Aucun rendez-vous pour cette journée</p>
            </div>
          ) : (
            sortedAppointments.map((appointment) => (
              <div key={appointment.id} onClick={(e) => e.stopPropagation()}>
                <DraggableAppointment
                  appointment={appointment}
                  onClick={onAppointmentClick}
                  onEdit={onAppointmentEdit}
                  onDelete={(id) => {
                    const appt = appointments.find((a) => a.id === id)
                    if (appt) onAppointmentDelete?.(appt)
                  }}
                  compact={false}
                  showActions={true}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeAppointment && (
          <div className="w-64 rotate-3 opacity-90">
            <AppointmentCard
              appointment={activeAppointment}
              compact={false}
              showActions={false}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
