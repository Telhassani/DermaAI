'use client'

import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils/cn'
import { Appointment, AppointmentType, AppointmentStatus } from '@/lib/hooks/use-appointments'

import { AppointmentTooltip } from './appointment-tooltip'

import { DraggableAppointment } from './draggable-appointment'
import { DroppableDay } from './droppable-day'
import { GripVertical } from 'lucide-react'
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
import { useState, useRef } from 'react'
import { AppointmentCard } from './appointment-card'
import { toast } from 'sonner'
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
  onAppointmentReschedule?: (appointmentId: number, newStartTime: Date, newEndTime: Date) => void
}

export function CalendarGrid({
  currentDate,
  appointments,
  onDayClick,
  onAppointmentClick,
  onAppointmentReschedule,
}: CalendarGridProps) {
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required to start drag - prevents accidental drags on click
      },
    })
  )

  const [currentDragDate, setCurrentDragDate] = useState<Date | null>(null)

  const handleDragOver = (event: any) => {
    const { over } = event
    if (!over) {
      setCurrentDragDate(null)
      return
    }

    const dropData = over.data.current
    if (dropData?.type === 'day-slot') {
      setCurrentDragDate(dropData.date as Date)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setCurrentDragDate(null)

    if (!over) {
      setActiveAppointment(null)
      return
    }

    const appointment = active.data.current?.appointment as Appointment
    const dropData = over.data.current

    if (dropData?.type === 'day-slot' && onAppointmentReschedule) {
      const targetDate = dropData.date as Date

      // Calculate new start time preserving the time of day
      const originalStart = new Date(appointment.start_time)
      const newStart = new Date(targetDate)
      newStart.setHours(originalStart.getHours())
      newStart.setMinutes(originalStart.getMinutes())
      newStart.setSeconds(0)
      newStart.setMilliseconds(0)

      // Calculate new end time preserving duration
      const duration = new Date(appointment.end_time).getTime() - originalStart.getTime()
      const newEnd = new Date(newStart.getTime() + duration)

      onAppointmentReschedule(appointment.id, newStart, newEnd)
    }

    setActiveAppointment(null)
  }
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

  const restrictToGrid = ({ transform, draggingNodeRect }: any) => {
    const gridElement = document.getElementById('calendar-month-grid')

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
      onDragStart={(event) => {
        const appointment = event.active.data.current?.appointment as Appointment
        setActiveAppointment(appointment)
      }}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCenter}
      modifiers={[restrictToGrid]}
    >
      <div id="calendar-month-grid" className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm ring-1 ring-black/5">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/50">
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
              <DroppableDay
                key={day.toISOString()}
                id={`day-${day.toISOString()}`}
                date={day}
                onClick={() => onDayClick?.(day)}
                className={cn(
                  'group min-h-[120px] border-b border-r p-2 last:border-r-0',
                  (index + 1) % 7 === 0 && 'border-r-0',
                  index >= days.length - 7 && 'border-b-0',
                  isCurrentMonth ? (isWeekend ? 'bg-gray-50/50' : 'bg-white') : 'bg-gray-50',
                  onDayClick && 'cursor-pointer hover:bg-blue-50',
                  isTodayDate && 'bg-blue-50 ring-2 ring-inset ring-blue-500',
                )}
              >
                {/* Day number */}
                <div className="mb-1 flex items-center justify-center">
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
                </div>

                {/* Appointments list (first 3) */}
                <div className="space-y-1 mt-1">
                  {dayAppointments.slice(0, 3).map((appointment, index) => {
                    const isDragging = activeAppointment?.id === appointment.id
                    return (
                      <div key={appointment.id} className={cn(isDragging && "opacity-0")}>
                        <DraggableAppointment
                          appointment={appointment}
                          onClick={(app) => {
                            onAppointmentClick?.(app)
                          }}
                          variant="month"
                          showActions={false}
                        />
                      </div>
                    )
                  })}

                  {/* Show more indicator with Popover */}
                  {dayAppointments.length > 3 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            // Don't navigate, just open popover
                          }}
                          className="w-full rounded px-1 py-0.5 text-left text-[10px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                        >
                          {dayAppointments.length - 3} autres...
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-3" align="start">
                        <div className="mb-2 font-medium text-gray-900 text-sm">
                          {format(day, 'EEEE d MMMM', { locale: fr })}
                        </div>
                        <div className="space-y-1 max-h-[300px] overflow-y-auto">
                          {dayAppointments.map((appointment) => (
                            <DraggableAppointment
                              key={appointment.id}
                              appointment={appointment}
                              onClick={(app) => {
                                onAppointmentClick?.(app)
                              }}
                              variant="month"
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
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
                    {/* Removed text to be cleaner, just highlight is enough or maybe a small plus */}
                  </div>
                )}
              </DroppableDay>
            )
          })}
        </div>
      </div>
      <DragOverlay modifiers={[restrictToWindowEdges]} dropAnimation={null}>
        {activeAppointment && (
          <div className="flex items-center gap-2">
            <div className="w-[150px] opacity-90">
              <DraggableAppointment
                appointment={activeAppointment}
                variant="month"
                showActions={false}
                disableTooltip={true}
              />
            </div>
            {currentDragDate && (
              <div className="rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow-lg">
                {format(currentDragDate, 'd MMM', { locale: fr })} •{' '}
                {new Date(activeAppointment.start_time).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            )}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
