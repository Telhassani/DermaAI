'use client'

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils/cn'
import { ReactNode } from 'react'
import { format } from 'date-fns'

interface DroppableDayProps {
    id: string
    date: Date
    children?: ReactNode
    className?: string
    onClick?: () => void
}

export function DroppableDay({
    id,
    date,
    children,
    className,
    onClick,
}: DroppableDayProps) {
    const { isOver, setNodeRef } = useDroppable({
        id,
        data: {
            date,
            type: 'day-slot',
        },
    })

    return (
        <div
            ref={setNodeRef}
            onClick={onClick}
            className={cn(
                'relative transition-colors',
                isOver && 'bg-blue-50 ring-2 ring-blue-400 ring-inset z-10',
                className
            )}
        >
            {children}

            {/* Drop indicator */}
            {isOver && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-blue-50/50">
                    <div className="rounded-lg bg-blue-500 px-3 py-1 text-xs font-medium text-white shadow-lg">
                        Déposer ici
                    </div>
                </div>
            )}
        </div>
    )
}
