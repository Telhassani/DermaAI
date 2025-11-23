'use client'

import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarMini } from './calendar-mini'

export type CalendarView = 'month' | 'week' | 'day' | 'agenda'

interface CalendarToolbarProps {
  currentDate: Date
  view: CalendarView
  onDateChange: (date: Date) => void
  onViewChange: (view: CalendarView) => void
  onCreateAppointment?: () => void
  onToggleFilters?: () => void
  showFilters?: boolean
}

export function CalendarToolbar({
  currentDate,
  view,
  onDateChange,
  onViewChange,
  onCreateAppointment,
  onToggleFilters,
  showFilters,
}: CalendarToolbarProps) {
  // Navigation handlers
  const handlePrevious = () => {
    const newDate = new Date(currentDate)
    switch (view) {
      case 'month':
        newDate.setMonth(currentDate.getMonth() - 1)
        break
      case 'week':
        newDate.setDate(currentDate.getDate() - 7)
        break
      case 'day':
        newDate.setDate(currentDate.getDate() - 1)
        break
      case 'agenda':
        newDate.setDate(currentDate.getDate() - 7)
        break
    }
    onDateChange(newDate)
  }

  const handleNext = () => {
    const newDate = new Date(currentDate)
    switch (view) {
      case 'month':
        newDate.setMonth(currentDate.getMonth() + 1)
        break
      case 'week':
        newDate.setDate(currentDate.getDate() + 7)
        break
      case 'day':
        newDate.setDate(currentDate.getDate() + 1)
        break
      case 'agenda':
        newDate.setDate(currentDate.getDate() + 7)
        break
    }
    onDateChange(newDate)
  }

  const handleToday = () => {
    onDateChange(new Date())
  }

  // Format current period display
  const formatPeriod = () => {
    switch (view) {
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: fr })
      case 'week':
        const weekStart = new Date(currentDate)
        weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1) // Monday
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        return `${format(weekStart, 'd MMM', { locale: fr })} - ${format(weekEnd, 'd MMM yyyy', { locale: fr })}`
      case 'day':
        return format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })
      case 'agenda':
        return 'Liste des rendez-vous'
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      {/* Left section: Navigation and period */}
      <div className="flex flex-1 items-center gap-3">
        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday} className="px-4">
            Aujourd'hui
          </Button>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Current period display with Mini Calendar Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 hover:bg-gray-100 px-2">
              <CalendarIcon className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold capitalize text-gray-900">
                {formatPeriod()}
              </h2>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarMini
              currentDate={currentDate}
              onDateChange={(date) => {
                onDateChange(date)
                // Optional: Close popover here if we had access to open state
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Right section: View selector and actions */}
      <div className="flex items-center gap-3">
        {/* View selector */}
        <div className="flex items-center rounded-lg border bg-gray-50 p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewChange('month')}
            className={cn(
              'px-3',
              view === 'month'
                ? 'bg-white font-medium text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            Mois
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewChange('week')}
            className={cn(
              'px-3',
              view === 'week'
                ? 'bg-white font-medium text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            Semaine
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewChange('day')}
            className={cn(
              'px-3',
              view === 'day'
                ? 'bg-white font-medium text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            Jour
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewChange('agenda')}
            className={cn(
              'px-3',
              view === 'agenda'
                ? 'bg-white font-medium text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            Agenda
          </Button>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-200" />

        {/* Filter toggle */}
        {onToggleFilters && (
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleFilters}
            className={cn(showFilters && 'bg-blue-50 text-blue-600')}
          >
            <Filter className="h-4 w-4" />
          </Button>
        )}

        {/* Create appointment button */}
        {onCreateAppointment && (
          <Button onClick={onCreateAppointment} className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouveau rendez-vous</span>
            <span className="sm:hidden">Nouveau</span>
          </Button>
        )}
      </div>
    </div>
  )
}
