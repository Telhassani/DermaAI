'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Filter, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils/cn'
import { AppointmentType, AppointmentStatus } from '@/lib/hooks/use-appointments'

export interface CalendarFilters {
  types: AppointmentType[]
  statuses: AppointmentStatus[]
  searchQuery: string
  showCancelled: boolean
  showCompleted: boolean
}

interface CalendarFiltersPanelProps {
  isOpen: boolean
  onClose: () => void
  filters: CalendarFilters
  onFiltersChange: (filters: CalendarFilters) => void
}

const FILTER_STORAGE_KEY = 'dermai-calendar-filters'

// Type labels
const typeLabels: Record<AppointmentType, string> = {
  [AppointmentType.CONSULTATION]: 'Consultation',
  [AppointmentType.FOLLOW_UP]: 'Suivi',
  [AppointmentType.PROCEDURE]: 'Intervention',
  [AppointmentType.EMERGENCY]: 'Urgence',
}

// Status labels
const statusLabels: Record<AppointmentStatus, string> = {
  [AppointmentStatus.SCHEDULED]: 'Planifié',
  [AppointmentStatus.CONFIRMED]: 'Confirmé',
  [AppointmentStatus.IN_PROGRESS]: 'En cours',
  [AppointmentStatus.COMPLETED]: 'Terminé',
  [AppointmentStatus.CANCELLED]: 'Annulé',
  [AppointmentStatus.NO_SHOW]: 'Absent',
}

// Type colors
const typeColors: Record<AppointmentType, string> = {
  [AppointmentType.CONSULTATION]: 'bg-blue-100 text-blue-700 border-blue-300',
  [AppointmentType.FOLLOW_UP]: 'bg-green-100 text-green-700 border-green-300',
  [AppointmentType.PROCEDURE]: 'bg-purple-100 text-purple-700 border-purple-300',
  [AppointmentType.EMERGENCY]: 'bg-red-100 text-red-700 border-red-300',
}

export function CalendarFiltersPanel({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
}: CalendarFiltersPanelProps) {
  const [localFilters, setLocalFilters] = useState<CalendarFilters>(filters)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load saved filters from localStorage on mount
  useEffect(() => {
    const savedFilters = localStorage.getItem(FILTER_STORAGE_KEY)
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters)
        setLocalFilters(parsed)
        onFiltersChange(parsed)
      } catch (error) {
        console.error('Failed to parse saved filters:', error)
      }
    }
  }, [])

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  // Save filters to localStorage when they change
  const saveFilters = (newFilters: CalendarFilters) => {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(newFilters))
  }

  // Toggle type filter
  const toggleType = (type: AppointmentType) => {
    const newTypes = localFilters.types.includes(type)
      ? localFilters.types.filter((t) => t !== type)
      : [...localFilters.types, type]

    const newFilters = { ...localFilters, types: newTypes }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
    saveFilters(newFilters)
  }

  // Toggle status filter
  const toggleStatus = (status: AppointmentStatus) => {
    const newStatuses = localFilters.statuses.includes(status)
      ? localFilters.statuses.filter((s) => s !== status)
      : [...localFilters.statuses, status]

    const newFilters = { ...localFilters, statuses: newStatuses }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
    saveFilters(newFilters)
  }

  // Update search query with debounce (300ms)
  const handleSearchChange = (query: string) => {
    // Update local state immediately for UI responsiveness
    setLocalFilters((prev) => ({ ...prev, searchQuery: query }))

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Debounce the actual filter application and save
    searchTimeoutRef.current = setTimeout(() => {
      const newFilters = { ...localFilters, searchQuery: query }
      onFiltersChange(newFilters)
      saveFilters(newFilters)
    }, 300)
  }

  // Toggle show cancelled
  const toggleShowCancelled = () => {
    const newFilters = { ...localFilters, showCancelled: !localFilters.showCancelled }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
    saveFilters(newFilters)
  }

  // Toggle show completed
  const toggleShowCompleted = () => {
    const newFilters = { ...localFilters, showCompleted: !localFilters.showCompleted }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
    saveFilters(newFilters)
  }

  // Reset all filters
  const resetFilters = () => {
    const defaultFilters: CalendarFilters = {
      types: [],
      statuses: [],
      searchQuery: '',
      showCancelled: true,
      showCompleted: true,
    }
    setLocalFilters(defaultFilters)
    onFiltersChange(defaultFilters)
    saveFilters(defaultFilters)
  }

  // Count active filters
  const activeFiltersCount =
    localFilters.types.length +
    localFilters.statuses.length +
    (localFilters.searchQuery ? 1 : 0) +
    (!localFilters.showCancelled ? 1 : 0) +
    (!localFilters.showCompleted ? 1 : 0)

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-96 overflow-y-auto bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
            {activeFiltersCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                {activeFiltersCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1">
              <RotateCcw className="h-4 w-4" />
              Réinitialiser
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Filters content */}
        <div className="space-y-6 p-4">
          {/* Search */}
          <div>
            <Label htmlFor="search" className="mb-2 block text-sm font-medium text-gray-700">
              Rechercher
            </Label>
            <input
              id="search"
              type="text"
              placeholder="Nom du patient, motif..."
              value={localFilters.searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type filters */}
          <div>
            <Label className="mb-3 block text-sm font-medium text-gray-700">
              Type de rendez-vous
            </Label>
            <div className="space-y-2">
              {Object.values(AppointmentType).map((type) => {
                const isSelected = localFilters.types.includes(type)
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg border-2 px-4 py-2.5 text-left text-sm font-medium transition-all',
                      isSelected
                        ? typeColors[type]
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    <span>{typeLabels[type]}</span>
                    {isSelected && (
                      <svg
                        className="h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Status filters */}
          <div>
            <Label className="mb-3 block text-sm font-medium text-gray-700">
              Statut
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(AppointmentStatus).map((status) => {
                const isSelected = localFilters.statuses.includes(status)
                return (
                  <button
                    key={status}
                    onClick={() => toggleStatus(status)}
                    className={cn(
                      'rounded-lg border-2 px-3 py-2 text-center text-xs font-medium transition-all',
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    {statusLabels[status]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quick toggles */}
          <div>
            <Label className="mb-3 block text-sm font-medium text-gray-700">
              Options d'affichage
            </Label>
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={localFilters.showCompleted}
                  onChange={toggleShowCompleted}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    Afficher les rendez-vous terminés
                  </div>
                  <div className="text-xs text-gray-500">
                    Inclure les rendez-vous passés
                  </div>
                </div>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={localFilters.showCancelled}
                  onChange={toggleShowCancelled}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    Afficher les rendez-vous annulés
                  </div>
                  <div className="text-xs text-gray-500">
                    Inclure les annulations
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t bg-white p-4">
          <div className="text-xs text-gray-500">
            {activeFiltersCount === 0
              ? 'Aucun filtre actif'
              : `${activeFiltersCount} filtre${activeFiltersCount > 1 ? 's' : ''} actif${activeFiltersCount > 1 ? 's' : ''}`}
          </div>
        </div>
      </div>
    </>
  )
}
