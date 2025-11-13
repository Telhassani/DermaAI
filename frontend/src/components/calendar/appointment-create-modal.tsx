'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppointmentForm } from './appointment-form'
import { useCreateAppointment } from '@/lib/hooks/use-appointments'

interface AppointmentCreateModalProps {
  isOpen: boolean
  onClose: () => void
  initialDate?: Date
  initialHour?: number
}

export function AppointmentCreateModal({
  isOpen,
  onClose,
  initialDate,
  initialHour,
}: AppointmentCreateModalProps) {
  const createMutation = useCreateAppointment()

  if (!isOpen) return null

  const handleSubmit = async (data: any) => {
    try {
      await createMutation.mutateAsync(data)
      onClose()
    } catch (error) {
      // Error is handled by the mutation
      console.error('Failed to create appointment:', error)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Nouveau rendez-vous</h2>
            <p className="mt-1 text-sm text-gray-600">
              Créez un nouveau rendez-vous pour un patient
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-6">
          <AppointmentForm
            initialDate={initialDate}
            initialHour={initialHour}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isLoading={createMutation.isPending}
          />
        </div>
      </div>
    </>
  )
}
