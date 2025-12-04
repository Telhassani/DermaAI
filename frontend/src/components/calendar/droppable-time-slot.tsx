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
        className
      )}
    >
      {children}
    </div>
  )
}
