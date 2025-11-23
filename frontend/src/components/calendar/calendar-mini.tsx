'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

interface CalendarMiniProps {
    currentDate: Date
    onDateChange: (date: Date) => void
    className?: string
}

export function CalendarMini({ currentDate, onDateChange, className }: CalendarMiniProps) {
    const [viewDate, setViewDate] = useState(currentDate)

    // Sync viewDate with currentDate when it changes externally
    // But allow independent navigation within the mini calendar

    const monthStart = startOfMonth(viewDate)
    const monthEnd = endOfMonth(viewDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
    const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

    const handlePreviousMonth = () => setViewDate(subMonths(viewDate, 1))
    const handleNextMonth = () => setViewDate(addMonths(viewDate, 1))

    return (
        <div className={cn("w-[280px] p-3 bg-white rounded-lg border shadow-sm", className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-gray-900 capitalize">
                    {format(viewDate, 'MMMM yyyy', { locale: fr })}
                </span>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handlePreviousMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleNextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Week days */}
            <div className="grid grid-cols-7 mb-2">
                {weekDays.map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-y-2">
                {days.map((day) => {
                    const isCurrentMonth = isSameMonth(day, viewDate)
                    const isSelected = isSameDay(day, currentDate)
                    const isTodayDate = isToday(day)

                    return (
                        <button
                            key={day.toISOString()}
                            onClick={() => onDateChange(day)}
                            className={cn(
                                "h-8 w-8 mx-auto flex items-center justify-center rounded-full text-sm transition-colors",
                                !isCurrentMonth && "text-gray-300",
                                isCurrentMonth && !isSelected && "text-gray-700 hover:bg-gray-100",
                                isSelected && "bg-blue-600 text-white hover:bg-blue-700",
                                isTodayDate && !isSelected && "text-blue-600 font-semibold bg-blue-50"
                            )}
                        >
                            {format(day, 'd')}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
