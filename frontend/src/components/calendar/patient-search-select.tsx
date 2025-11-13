'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Search, User, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSearchPatients, Patient } from '@/lib/hooks/use-patients'

interface PatientSearchSelectProps {
  value?: number
  onSelect: (patient: Patient | null) => void
  placeholder?: string
  error?: string
}

export function PatientSearchSelect({
  value,
  onSelect,
  placeholder = 'Rechercher un patient...',
  error,
}: PatientSearchSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  // Search patients
  const { data: searchData, isLoading } = useSearchPatients(searchQuery, searchQuery.length >= 2)

  const patients = searchData?.patients || []

  // Handle selection
  const handleSelect = (patient: Patient) => {
    setSelectedPatient(patient)
    onSelect(patient)
    setOpen(false)
    setSearchQuery('')
  }

  // Handle clear
  const handleClear = () => {
    setSelectedPatient(null)
    onSelect(null)
    setSearchQuery('')
  }

  return (
    <div className="relative w-full">
      {/* Selected patient display */}
      {selectedPatient ? (
        <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-white p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{selectedPatient.full_name}</p>
              <p className="text-xs text-gray-500">
                {selectedPatient.age} ans • {selectedPatient.phone}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-gray-500 hover:text-gray-700"
          >
            Changer
          </Button>
        </div>
      ) : (
        <>
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setOpen(e.target.value.length >= 2)
              }}
              onFocus={() => searchQuery.length >= 2 && setOpen(true)}
              className={cn(
                'pl-10 pr-10',
                error && 'border-red-500 focus-visible:ring-red-500'
              )}
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
            )}
          </div>

          {/* Error message */}
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

          {/* Dropdown results */}
          {open && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setOpen(false)}
              />

              {/* Results dropdown */}
              <div className="absolute z-50 mt-2 max-h-[300px] w-full overflow-auto rounded-lg border bg-white shadow-lg">
                {isLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-600">Recherche en cours...</span>
                  </div>
                ) : patients.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-600">
                      {searchQuery.length < 2
                        ? 'Tapez au moins 2 caractères pour rechercher'
                        : 'Aucun patient trouvé'}
                    </p>
                  </div>
                ) : (
                  <div className="py-1">
                    {patients.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => handleSelect(patient)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                      >
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {patient.full_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {patient.age} ans • {patient.phone}
                            {patient.email && ` • ${patient.email}`}
                          </p>
                        </div>
                        <Check className="h-4 w-4 flex-shrink-0 text-blue-600 opacity-0" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Helper text */}
                {searchQuery.length >= 2 && patients.length > 0 && (
                  <div className="border-t bg-gray-50 px-4 py-2">
                    <p className="text-xs text-gray-500">
                      {patients.length} patient{patients.length > 1 ? 's' : ''} trouvé{patients.length > 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
