'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Appointment } from '@/lib/hooks/use-appointments'
import { AppointmentCard } from './appointment-card'
import { GripVertical } from 'lucide-react'

interface DraggableAppointmentProps {
  appointment: Appointment
  onClick?: (appointment: Appointment) => void
  onEdit?: (appointment: Appointment) => void
  onDelete?: (id: number) => void
  onStatusChange?: (id: number, status: string) => void
  compact?: boolean
  showActions?: boolean
}

export function DraggableAppointment({
  appointment,
  onClick,
  onEdit,
  onDelete,
  onStatusChange,
  compact = false,
  showActions = true,
}: DraggableAppointmentProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `appointment-${appointment.id}`,
    data: {
      appointment,
      type: 'appointment',
    },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Drag handle - only visible on hover */}
      <div
        {...listeners}
        {...attributes}
        className="absolute -left-2 top-1/2 z-10 -translate-y-1/2 cursor-grab opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
      >
        <div className="rounded bg-gray-100 p-1 shadow-sm hover:bg-gray-200">
          <GripVertical className="h-4 w-4 text-gray-600" />
        </div>
      </div>

      {/* Appointment card */}
      <div className="group">
        <AppointmentCard
          appointment={appointment}
          onClick={onClick}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          compact={compact}
          showActions={showActions}
        />
      </div>
    </div>
  )
}
