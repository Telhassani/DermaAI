'use client'

import { useState, useRef } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { format, startOfWeek, addDays, isToday, addMinutes, isSameDay, parse } from 'date-fns'
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
  const [resizingAppointment, setResizingAppointment] = useState<{ id: number; start: Date; end: Date } | null>(null)
  const [initialResizeState, setInitialResizeState] = useState<{ start: Date; end: Date } | null>(null)
  const [currentDragTime, setCurrentDragTime] = useState<{ start: Date; end: Date } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, // Add threshold to prevent accidental/too-quick drags
      },
    })
  )

  // Get week start (Monday)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })

  // Generate array of 7 days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Generate hours array
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)

  // Group appointments by day
  // Get appointments for a specific day
  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.start_time)
      return isSameDay(appointmentDate, date)
    })
  }

  // Detect overlapping appointments for a specific day and create column layout
  const getAppointmentGroupsForDay = (dayAppointments: Appointment[]) => {
    if (dayAppointments.length === 0) return []

    // Sort by start time
    const sorted = [...dayAppointments].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )

    // Group overlapping appointments
    const groups: Appointment[][] = []
    let currentGroup: Appointment[] = [sorted[0]]
    let maxEndTime = new Date(sorted[0].end_time).getTime()

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i]
      const currentStart = new Date(current.start_time).getTime()
      const currentEnd = new Date(current.end_time).getTime()

      // If current appointment starts before the max end time of the group, they overlap
      if (currentStart < maxEndTime) {
        currentGroup.push(current)
        maxEndTime = Math.max(maxEndTime, currentEnd)
      } else {
        groups.push(currentGroup)
        currentGroup = [current]
        maxEndTime = currentEnd
      }
    }
    groups.push(currentGroup)

    return groups
  }

  // Calculate position and height for appointment with column layout
  const getAppointmentStyle = (appointment: Appointment, dayAppointments: Appointment[]) => {
    const start = new Date(appointment.start_time)
    const end = new Date(appointment.end_time)

    const startHourFloat = start.getHours() + start.getMinutes() / 60
    const endHourFloat = end.getHours() + end.getMinutes() / 60

    const top = ((startHourFloat - startHour) / (endHour - startHour + 1)) * 100
    const height = ((endHourFloat - startHourFloat) / (endHour - startHour + 1)) * 100

    // Get column information for this appointment
    const groups = getAppointmentGroupsForDay(dayAppointments)
    let columnIndex = 0
    let columnCount = 1

    for (const group of groups) {
      const appointmentIndex = group.findIndex((a) => a.id === appointment.id)
      if (appointmentIndex !== -1) {
        columnIndex = appointmentIndex
        columnCount = group.length
        break
      }
    }

    const columnWidth = 100 / columnCount
    const left = columnIndex * columnWidth

    return {
      top: `${top}%`,
      height: `${height}%`,
      left: `${left}%`,
      width: `${columnWidth}%`,
    }
  }

  // Handle drag start
  const handleDragStart = (event: any) => {
    const { active } = event
    const data = active.data.current

    if (data?.type === 'appointment') {
      const appointment = data.appointment as Appointment
      setActiveAppointment(appointment)
      setCurrentDragTime({
        start: new Date(appointment.start_time),
        end: new Date(appointment.end_time)
      })
    } else if (data?.type === 'resize') {
      const appointment = data.appointment as Appointment
      const start = new Date(appointment.start_time)
      const end = new Date(appointment.end_time)

      setResizingAppointment({
        id: appointment.id,
        start,
        end
      })
      setInitialResizeState({
        start,
        end
      })
      // Initialize time badge for resize too
      setCurrentDragTime({
        start,
        end
      })
    }
  }

  // Handle drag move
  const handleDragMove = (event: any) => {
    const { active, delta } = event
    const data = active.data.current

    if (data?.type === 'appointment' && activeAppointment) {
      // Existing move logic
      const step = 25 // 15 min step
      const snappedY = Math.round(delta.y / step) * step
      const minutesMoved = (snappedY / 100) * 60

      const originalStart = new Date(activeAppointment.start_time)
      const originalEnd = new Date(activeAppointment.end_time)

      const newStart = addMinutes(originalStart, minutesMoved)
      const newEnd = addMinutes(originalEnd, minutesMoved)

      setCurrentDragTime({ start: newStart, end: newEnd })
    } else if (data?.type === 'resize' && resizingAppointment && initialResizeState) {
      // Resize logic
      const step = 25 // 15 min step

      // Use Math.trunc/floor logic to add friction
      const frictionY = delta.y
      const snappedY = (frictionY > 0)
        ? Math.floor(frictionY / step) * step
        : Math.ceil(frictionY / step) * step

      const minutesMoved = (snappedY / 100) * 60

      // CRITICAL FIX: Always calculate from the INITIAL state, not the current (updating) state
      const originalStart = initialResizeState.start
      const originalEnd = initialResizeState.end

      let newStart = resizingAppointment.start
      let newEnd = resizingAppointment.end

      if (data.position === 'top') {
        const potentialStart = addMinutes(originalStart, minutesMoved)
        const newDuration = (originalEnd.getTime() - potentialStart.getTime()) / (1000 * 60)

        // Constraints: Min 15 mins, Max 8 hours
        if (newDuration >= 15 && newDuration <= 8 * 60) {
          newStart = potentialStart
          setResizingAppointment({
            ...resizingAppointment,
            start: newStart
          })
        }
      } else if (data.position === 'bottom') {
        const potentialEnd = addMinutes(originalEnd, minutesMoved)
        const newDuration = (potentialEnd.getTime() - originalStart.getTime()) / (1000 * 60)

        // Constraints: Min 15 mins, Max 8 hours
        if (newDuration >= 15 && newDuration <= 8 * 60) {
          newEnd = potentialEnd
          setResizingAppointment({
            ...resizingAppointment,
            end: newEnd
          })
        }
      }

      // Update time badge
      setCurrentDragTime({ start: newStart, end: newEnd })
    }
  }

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event
    const data = active.data.current

    // Reset state
    setActiveAppointment(null)
    setCurrentDragTime(null)
    setResizingAppointment(null)
    setInitialResizeState(null)

    if (!onAppointmentReschedule) return

    if (data?.type === 'appointment' && over) {
      // Existing move commit logic
      // Parse drop target: slot-yyyy-MM-dd-hour
      const parts = (over.id as string).split('-')
      const dateStr = `${parts[1]}-${parts[2]}-${parts[3]}`
      const targetDate = parse(dateStr, 'yyyy-MM-dd', new Date())

      const step = 25 // 15 min step
      const snappedY = Math.round(delta.y / step) * step
      const minutesMoved = (snappedY / 100) * 60

      const originalStart = new Date(data.appointment.start_time)
      const newTimeOfDay = addMinutes(originalStart, minutesMoved)

      const newStart = new Date(targetDate)
      newStart.setHours(newTimeOfDay.getHours())
      newStart.setMinutes(newTimeOfDay.getMinutes())
      newStart.setSeconds(0)
      newStart.setMilliseconds(0)

      const duration = new Date(data.appointment.end_time).getTime() - originalStart.getTime()
      const newEnd = new Date(newStart.getTime() + duration)

      onAppointmentReschedule(data.appointment.id, newStart, newEnd)

    } else if (data?.type === 'resize' && resizingAppointment) {
      // Commit resize
      onAppointmentReschedule(resizingAppointment.id, resizingAppointment.start, resizingAppointment.end)
    }
  }

  // Snap to grid modifier (25px = 15 minutes, assuming 100px per hour)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const snapToGrid = ({ transform }: any) => {
    const step = 25 // 15 minute interval
    return {
      ...transform,
      y: Math.round(transform.y / step) * step,
    }
  }

  const restrictToGrid = ({ transform, draggingNodeRect }: any) => {
    const gridElement = document.getElementById('calendar-week-grid')

    if (!gridElement || !draggingNodeRect) {
      return transform
    }

    const gridRect = gridElement.getBoundingClientRect()
    const nodeRect = draggingNodeRect

    // Calculate boundaries
    const minX = gridRect.left - nodeRect.left
    const maxX = gridRect.right - nodeRect.width - nodeRect.left
    const minY = gridRect.top - nodeRect.top
    const maxY = gridRect.bottom - nodeRect.height - nodeRect.top

    return {
      ...transform,
      x: Math.max(minX, Math.min(maxX, transform.x)),
      y: Math.max(minY, Math.min(maxY, transform.y)),
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCenter}
    >
      <div id="calendar-week-grid" className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm ring-1 ring-black/5">
        {/* Week header */}
        <div className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/50">
          <div className="border-r border-gray-50 p-3" /> {/* Empty cell for time column */}
          {weekDays.map((day, index) => {
            const isCurrentDay = isToday(day)
            const dayNumber = format(day, 'd')
            const dayName = format(day, 'EEE', { locale: fr })

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'border-r border-gray-50 p-3 text-center last:border-r-0',
                  isCurrentDay && 'bg-blue-50/30'
                )}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{dayName}</div>
                <div
                  className={cn(
                    'mt-1.5 mx-auto flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium transition-colors',
                    isCurrentDay
                      ? 'bg-blue-600 text-white shadow-sm'
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
        <div className="flex-1 overflow-auto custom-scrollbar relative">
          <div className="grid grid-cols-[70px_repeat(7,1fr)]">
            {/* Time column and day columns */}
            {hours.map((hour) => (
              <div key={hour} className="contents">
                {/* Time label */}
                <div className="sticky left-0 z-10 border-r border-gray-100 bg-white h-full pointer-events-none">
                  <span className="absolute top-0 right-2 text-xs font-medium text-gray-500 -translate-y-1/2 bg-white px-1">
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
                        'group relative border-b border-r border-gray-100 h-[100px]', // Added border-r for vertical grid
                        isCurrentDay && 'bg-blue-50/5',
                        onTimeSlotClick && 'cursor-pointer hover:bg-gray-50/50 transition-colors'
                      )}
                    >
                      <div
                        onClick={() => onTimeSlotClick?.(day, hour)}
                        className="absolute inset-0"
                      >
                        {/* 15-minute markers - subtle */}
                        <div className="absolute left-0 right-0 top-[25%] h-px bg-gray-50/30" />
                        <div className="absolute left-0 right-0 top-[50%] h-px bg-gray-100/50 border-t border-dashed border-gray-200" />
                        <div className="absolute left-0 right-0 top-[75%] h-px bg-gray-50/30" />

                        {/* Show appointments only in first hour slot to avoid duplication */}
                        {hour === startHour && (
                          <div
                            className="absolute inset-0 z-20 pointer-events-none pr-1" // Added right padding for spacing
                            style={{ height: `${hours.length * 100}%` }}
                          >
                            {(() => {
                              const dayAppointments = getAppointmentsForDay(day)
                              return dayAppointments.map((appointment) => {
                                // Use resizing appointment data if it matches
                                const isResizing = resizingAppointment?.id === appointment.id
                                const displayAppointment = isResizing
                                  ? { ...appointment, start_time: resizingAppointment.start.toISOString(), end_time: resizingAppointment.end.toISOString() }
                                  : appointment

                                const style = getAppointmentStyle(displayAppointment, dayAppointments)
                                const isDragging = activeAppointment?.id === appointment.id

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
                                    className={cn(
                                      "absolute pointer-events-auto z-10 hover:z-20 pb-[1px]", // Added bottom padding for vertical gap
                                      !isResizing && "transition-all duration-300 ease-in-out", // Disable transition during resize for smoothness
                                      isDragging && "opacity-0" // Hide original while dragging (but NOT while resizing)
                                    )}
                                  >
                                    <DraggableAppointment
                                      appointment={displayAppointment}
                                      onClick={onAppointmentClick}
                                      variant="week"
                                      showActions={false}
                                    />
                                  </div>
                                )
                              })
                            })()}
                          </div>
                        )}

                        {/* Hover overlay for empty slots */}
                        {onTimeSlotClick && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                            <div className="bg-blue-500/10 text-blue-600 text-[10px] font-medium px-1.5 py-0.5 rounded">
                              +
                            </div>
                          </div>
                        )}
                      </div>
                    </DroppableTimeSlot>
                  )
                })}
              </div>
            ))}
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
                  className="pointer-events-none absolute left-[70px] right-0 z-30 flex items-center"
                  style={{ top: `${topPosition}%` }}
                >
                  <div className="h-2.5 w-2.5 -ml-1.5 rounded-full bg-red-500 ring-2 ring-white shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                  <div className="h-px flex-1 bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.4)]" />
                </div>
              )
            }
            return null
          })()}
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay modifiers={[snapToGrid, restrictToGrid]} dropAnimation={null}>
        {(() => {
          if (activeAppointment) {
            // Dragging the whole card
            const durationMinutes = (new Date(activeAppointment.end_time).getTime() - new Date(activeAppointment.start_time).getTime()) / (1000 * 60)
            const height = (durationMinutes / 60) * 100 // 100px per hour

            return (
              <div className="flex items-center">
                <div
                  className="shadow-2xl scale-[1.02] cursor-grabbing opacity-90 relative"
                  style={{
                    height: `${height}px`,
                    width: '180px' // Approximate column width
                  }}
                >
                  <DraggableAppointment
                    appointment={activeAppointment}
                    variant="week"
                    showActions={false}
                  />
                </div>

                {/* Time Indicator */}
                {currentDragTime && (
                  <div className="ml-2 flex flex-col leading-tight text-xs font-semibold text-blue-600 animate-in fade-in slide-in-from-left-2 duration-200">
                    <span>{format(currentDragTime.start, 'HH:mm')}</span>
                    <span className="text-blue-400">{format(currentDragTime.end, 'HH:mm')}</span>
                  </div>
                )}
              </div>
            )
          } else if (resizingAppointment && currentDragTime) {
            // Resizing - Show only the time indicator following the cursor
            // We position it slightly offset so it doesn't block the view
            return (
              <div className="pointer-events-none flex items-center">
                {/* Invisible spacer to offset the badge if needed, or just absolute positioning */}
                <div className="w-4 h-4" />

                <div className="ml-4 flex flex-col leading-tight text-xs font-semibold text-blue-600 bg-white/80 backdrop-blur-sm px-2 py-1 rounded shadow-sm border border-blue-100 animate-in fade-in zoom-in duration-200">
                  <span>{format(currentDragTime.start, 'HH:mm')}</span>
                  <span className="text-blue-400">{format(currentDragTime.end, 'HH:mm')}</span>
                </div>
              </div>
            )
          }
          return null
        })()}
      </DragOverlay>
    </DndContext>
  )
}
