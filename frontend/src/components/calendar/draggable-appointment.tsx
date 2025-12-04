'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils/cn'
import { Appointment } from '@/lib/hooks/use-appointments'
import { AppointmentCard } from './appointment-card'
import { AppointmentTooltip } from './appointment-tooltip'
import { GripVertical } from 'lucide-react'

interface DraggableAppointmentProps {
  appointment: Appointment
  onClick?: (appointment: Appointment) => void
  onEdit?: (appointment: Appointment) => void
  onDelete?: (id: number) => void
  onStatusChange?: (status: string) => void
  compact?: boolean
  extraCompact?: boolean
  showActions?: boolean
  variant?: 'default' | 'month' | 'week'
  disableTooltip?: boolean
}

interface ResizeHandleProps {
  id: string
  position: 'top' | 'bottom'
  appointment: Appointment
}

function ResizeHandle({ id, position, appointment }: ResizeHandleProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: {
      type: 'resize',
      position,
      appointment,
    },
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "absolute left-0 right-0 h-3 z-20 cursor-ns-resize group/handle flex justify-center items-center",
        position === 'top' ? "-top-1.5" : "-bottom-1.5"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Visual handle (only visible on hover or drag) */}
      <div className={cn(
        "w-8 h-1 rounded-full bg-white shadow-sm border border-gray-200 transition-opacity",
        isDragging ? "opacity-100" : "opacity-0 group-hover/handle:opacity-100"
      )} />
    </div>
  )
}

export function DraggableAppointment({
  appointment,
  onClick,
  onEdit,
  onDelete,
  onStatusChange,
  compact = false,
  extraCompact = false,
  showActions = true,
  variant = 'default',
  disableTooltip = false,
}: DraggableAppointmentProps) {
  // Removed status checks to allow dragging all appointments
  const isDraggable = true

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `appointment-${appointment.id}`,
    data: {
      appointment,
      type: 'appointment',
    },
    disabled: !isDraggable,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: isDragging ? 50 : 'auto', // Ensure dragged item is on top
  }

  // Month view simplified rendering
  // Month view simplified rendering
  if (variant === 'month') {
    const colors = {
      bg: 'bg-blue-500',
      text: 'text-white',
      border: 'border-blue-600'
    }

    if (appointment.type === 'consultation') {
      colors.bg = 'bg-purple-500'
      colors.border = 'border-purple-600'
    } else if (appointment.type === 'follow_up') {
      colors.bg = 'bg-green-500'
      colors.border = 'border-green-600'
    } else if (appointment.type === 'emergency') {
      colors.bg = 'bg-red-500'
      colors.border = 'border-red-600'
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="relative mb-1"
      >
        <div {...listeners} {...attributes} className="h-full w-full">
          {!disableTooltip ? (
            <AppointmentTooltip appointment={appointment}>
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  onClick?.(appointment)
                }}
                className={cn(
                  'group flex cursor-pointer items-center overflow-hidden rounded px-1.5 py-0.5 text-[10px] shadow-sm transition-all hover:brightness-110',
                  colors.bg,
                  colors.text,
                  isDragging && 'opacity-50'
                )}
              >
                <div className="flex w-full items-center gap-1.5">
                  <span className="truncate font-medium">
                    {new Date(appointment.start_time).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="truncate font-medium opacity-90">
                    {(appointment as any).patient_name || 'Patient'}
                  </span>
                </div>
              </div>
            </AppointmentTooltip>
          ) : (
            <div
              onClick={(e) => {
                e.stopPropagation()
                onClick?.(appointment)
              }}
              className={cn(
                'group flex cursor-pointer items-center overflow-hidden rounded px-1.5 py-0.5 text-[10px] shadow-sm transition-all hover:brightness-110',
                colors.bg,
                colors.text,
                isDragging && 'opacity-50'
              )}
            >
              <div className="flex w-full items-center gap-1.5">
                <span className="truncate font-medium">
                  {new Date(appointment.start_time).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="truncate font-medium opacity-90">
                  {(appointment as any).patient_name || 'Patient'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Week view rendering (vertical event block)
  if (variant === 'week') {
    const colors = {
      bg: 'bg-blue-500',
      text: 'text-white',
    }

    if (appointment.type === 'consultation') {
      colors.bg = 'bg-purple-500'
      colors.text = 'text-white'
    } else if (appointment.type === 'follow_up') {
      colors.bg = 'bg-green-500'
      colors.text = 'text-white'
    } else if (appointment.type === 'procedure') {
      colors.bg = 'bg-blue-500'
      colors.text = 'text-white'
    } else if (appointment.type === 'emergency') {
      colors.bg = 'bg-red-500'
      colors.text = 'text-white'
    }

    const startTime = new Date(appointment.start_time).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
    const endTime = new Date(appointment.end_time).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })

    return (
      <div ref={setNodeRef} style={style} className="relative h-full w-full group/appointment">
        {/* Resize Handles - Only for week view */}
        <ResizeHandle
          id={`resize-top-${appointment.id}`}
          position="top"
          appointment={appointment}
        />

        <div {...listeners} {...attributes} className="h-full w-full">
          <AppointmentTooltip appointment={appointment}>
            <div
              onClick={(e) => {
                e.stopPropagation()
                onClick?.(appointment)
              }}
              className={cn(
                "flex flex-col h-full w-full rounded-md px-1.5 py-1 text-xs font-medium transition-all duration-200 hover:brightness-105 hover:shadow-md hover:-translate-y-[1px] cursor-pointer shadow-sm overflow-hidden",
                colors.bg,
                colors.text
              )}
            >
              <div className="flex items-center gap-1 mb-0.5">
                <span className="font-semibold text-[11px] opacity-90">{startTime} - {endTime}</span>
              </div>
              <div className="font-bold truncate text-[11px] leading-tight">
                {(appointment as any).patient_name || `Patient ${appointment.patient_id}`}
              </div>
            </div>
          </AppointmentTooltip>
        </div>

        <ResizeHandle
          id={`resize-bottom-${appointment.id}`}
          position="bottom"
          appointment={appointment}
        />
      </div>
    )
  }

  return (
    <div ref={setNodeRef} style={style} className="relative h-full">
      {/* Drag handle - always available for better UX */}
      <div
        {...listeners}
        {...attributes}
        className="absolute -left-2 top-1/2 z-20 -translate-y-1/2 cursor-grab opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
      >
        <div className="rounded bg-gray-100 p-1 shadow-sm hover:bg-gray-200">
          <GripVertical className="h-4 w-4 text-gray-600" />
        </div>
      </div>

      {/* Appointment card */}
      <div className="group h-full">
        <AppointmentTooltip appointment={appointment}>
          <div className="h-full">
            <AppointmentCard
              appointment={appointment}
              onClick={() => onClick?.(appointment)}
              onEdit={() => onEdit?.(appointment)}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              compact={compact}
              extraCompact={extraCompact}
              showActions={showActions}
            />
          </div>
        </AppointmentTooltip>
      </div>
    </div>
  )
}
