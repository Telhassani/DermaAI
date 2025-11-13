'use client'

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils/cn'
import { ReactNode } from 'react'

interface DroppableTimeSlotProps {
  id: string
  date: Date
  hour: number
  children?: ReactNode
  className?: string
  onDrop?: (date: Date, hour: number) => void
}

export function DroppableTimeSlot({
  id,
  date,
  hour,
  children,
  className,
}: DroppableTimeSlotProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      date,
      hour,
      type: 'time-slot',
    },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative min-h-[60px] border-b border-gray-200 transition-colors',
        isOver && 'bg-blue-50 ring-2 ring-blue-400 ring-inset',
        className
      )}
    >
      {children}

      {/* Drop indicator */}
      {isOver && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-lg bg-blue-500 px-3 py-1 text-xs font-medium text-white shadow-lg">
            Déposer ici
          </div>
        </div>
      )}
    </div>
  )
}
