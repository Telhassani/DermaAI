'use client'

import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils/cn'
import { Appointment, AppointmentType, AppointmentStatus } from '@/lib/hooks/use-appointments'
import { useAppointmentDragDrop } from '@/lib/hooks/use-appointment-drag-drop'
import { useAppointmentResize } from '@/lib/hooks/use-appointment-resize'
import { AppointmentTooltip } from './appointment-tooltip'

import { DraggableAppointment } from './draggable-appointment'
import { DroppableDay } from './droppable-day'
import { GripVertical } from 'lucide-react'
import { DndContext, DragEndEvent, DragOverlay, closestCenter, useSensor, useSensors, MouseSensor, TouchSensor, KeyboardSensor } from '@dnd-kit/core'
import { useState } from 'react'
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
}

export function CalendarGrid({
  currentDate,
  appointments,
  onDayClick,
  onAppointmentClick,
}: CalendarGridProps) {
  const dragDrop = useAppointmentDragDrop(appointments)
  const resize = useAppointmentResize(appointments)
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
    }),
    useSensor(KeyboardSensor)
  )



  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveAppointment(null)
      return
    }

    const appointment = active.data.current?.appointment as Appointment
    const dropData = over.data.current

    if (dropData?.type === 'day-slot') {
      const targetDate = dropData.date as Date

      // Call the existing handleDrop logic from the hook
      // We need to adapt it since the hook expects a DragEvent
      // But we can just call the logic directly if we expose it properly or adapt here
      // For now, let's use the hook's logic but we need to pass the date
      // The hook's handleDrop returns a function that takes a DragEvent

      // Since the hook is designed for HTML5 DnD, we might need to adjust it or manually call the update
      // Let's look at what handleDrop does: it calls updateMutation

      // We'll manually trigger the drop logic here using the hook's internal functions if possible
      // Or better, let's just use the hook's handleDrop but mock the event since we are refactoring
      // Actually, the hook is tightly coupled to HTML5 DnD (e.preventDefault, dataTransfer)
      // We should probably refactor the hook later, but for now let's duplicate the critical logic here
      // or modify the hook to be agnostic.

      // Let's try to use the hook's handleDrop by creating a fake event
      // This is a temporary bridge until we fully refactor the hook
      const fakeEvent = {
        preventDefault: () => { },
        stopPropagation: () => { },
        dataTransfer: {
          getData: () => JSON.stringify(appointment)
        }
      } as unknown as React.DragEvent

      // We need to set the dragged appointment in the hook state for handleDrop to work
      // But we can't easily do that from here without triggering handleDragStart
      // So let's manually call the update logic which is cleaner

      // Actually, let's just use the hook's handleDrop but we need to ensure state is set
      // The hook's state is set via handleDragStart.
      // Dnd-kit doesn't use the hook's state.

      // We should probably just call the update mutation directly here?
      // But we need conflict detection etc.

      // Let's use the hook's handleDrop but we need to make sure `dragState.draggedAppointment` is set.
      // We can set it in onDragStart of DndContext.

      dragDrop.handleDrop(targetDate)(fakeEvent)
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

  // Type colors for dots
  const typeColors: Record<AppointmentType, string> = {
    [AppointmentType.CONSULTATION]: 'bg-blue-500',
    [AppointmentType.FOLLOW_UP]: 'bg-green-500',
    [AppointmentType.PROCEDURE]: 'bg-purple-500',
    [AppointmentType.EMERGENCY]: 'bg-red-500',
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(event) => {
        const appointment = event.active.data.current?.appointment as Appointment
        setActiveAppointment(appointment)
        // Sync with hook state for compatibility
        // We pass a fake event to handleDragStart to set the state
        const fakeEvent = {
          dataTransfer: {
            setData: () => { },
            effectAllowed: 'move'
          }
        } as unknown as React.DragEvent
        dragDrop.handleDragStart(appointment, 'month-view')(fakeEvent)
      }}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCenter}
    >
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
                <div className="space-y-0.5">
                  {dayAppointments.slice(0, 3).map((appointment, index) => (
                    <div key={appointment.id} className="max-h-12 overflow-hidden">
                      <DraggableAppointment
                        appointment={appointment}
                        onClick={(app) => {
                          onAppointmentClick?.(app)
                        }}
                        compact={true}
                        extraCompact={true}
                        showActions={false}
                      />
                    </div>
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
                            <DraggableAppointment
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
              </DroppableDay>
            )
          })}
        </div>
      </div>
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
