'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  X,
  Edit,
  Trash2,
  Clock,
  User,
  Phone,
  FileText,
  Calendar as CalendarIcon,
  CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppointmentForm } from './appointment-form'
import {
  Appointment,
  AppointmentStatus,
  AppointmentType,
  useUpdateAppointment,
  useUpdateAppointmentStatus,
  useDeleteAppointment,
} from '@/lib/hooks/use-appointments'
import { usePatient } from '@/lib/hooks/use-patients'
import { cn } from '@/lib/utils/cn'

interface AppointmentDetailsModalProps {
  appointment: Appointment | null
  isOpen: boolean
  onClose: () => void
}

// Type labels
const typeLabels: Record<AppointmentType, string> = {
  [AppointmentType.CONSULTATION]: 'Consultation',
  [AppointmentType.FOLLOW_UP]: 'Suivi',
  [AppointmentType.PROCEDURE]: 'Intervention',
  [AppointmentType.EMERGENCY]: 'Urgence',
}

// Status labels
const statusLabels: Record<AppointmentStatus, { label: string; color: string }> = {
  [AppointmentStatus.SCHEDULED]: { label: 'Planifié', color: 'bg-gray-100 text-gray-700' },
  [AppointmentStatus.CONFIRMED]: { label: 'Confirmé', color: 'bg-blue-100 text-blue-700' },
  [AppointmentStatus.IN_PROGRESS]: { label: 'En cours', color: 'bg-yellow-100 text-yellow-700' },
  [AppointmentStatus.COMPLETED]: { label: 'Terminé', color: 'bg-green-100 text-green-700' },
  [AppointmentStatus.CANCELLED]: { label: 'Annulé', color: 'bg-red-100 text-red-700' },
  [AppointmentStatus.NO_SHOW]: { label: 'Absent', color: 'bg-orange-100 text-orange-700' },
}

export function AppointmentDetailsModal({
  appointment,
  isOpen,
  onClose,
}: AppointmentDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false)

  const updateMutation = useUpdateAppointment()
  const updateStatusMutation = useUpdateAppointmentStatus()
  const deleteMutation = useDeleteAppointment()

  // Fetch patient data
  const { data: patient } = usePatient(appointment?.patient_id || 0, !!appointment)

  if (!isOpen || !appointment) return null

  const startTime = new Date(appointment.start_time)
  const endTime = new Date(appointment.end_time)

  const handleUpdate = async (data: any) => {
    try {
      await updateMutation.mutateAsync({ id: appointment.id, data })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update appointment:', error)
    }
  }

  const handleStatusChange = async (status: AppointmentStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: appointment.id, status })
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleDelete = async () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
      try {
        await deleteMutation.mutateAsync(appointment.id)
        onClose()
      } catch (error) {
        console.error('Failed to delete appointment:', error)
      }
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
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Modifier le rendez-vous' : 'Détails du rendez-vous'}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Rendez-vous #{appointment.id}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  title="Modifier"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-6">
          {isEditing ? (
            <AppointmentForm
              appointment={appointment}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
              isLoading={updateMutation.isPending}
            />
          ) : (
            <div className="space-y-6">
              {/* Status and Type badges */}
              <div className="flex flex-wrap gap-2">
                <span
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium',
                    statusLabels[appointment.status].color
                  )}
                >
                  {statusLabels[appointment.status].label}
                </span>
                <span className="rounded-md bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
                  {typeLabels[appointment.type]}
                </span>
                {appointment.is_first_visit && (
                  <span className="rounded-md bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700">
                    1ère visite
                  </span>
                )}
              </div>

              {/* Date and Time */}
              <div className="space-y-3 rounded-lg border bg-gray-50 p-4">
                <div className="flex items-start gap-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Date</p>
                    <p className="text-base font-semibold text-gray-900 capitalize">
                      {format(startTime, 'EEEE d MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Heure</p>
                    <p className="text-base font-semibold text-gray-900">
                      {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                      <span className="ml-2 text-sm font-normal text-gray-600">
                        ({appointment.duration_minutes} minutes)
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Patient Info */}
              {patient && (
                <div className="space-y-3 rounded-lg border p-4">
                  <h3 className="font-semibold text-gray-900">Patient</h3>
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{patient.full_name}</p>
                      <p className="text-sm text-gray-600">{patient.age} ans • {patient.gender}</p>
                      {patient.phone && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          {patient.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Reason */}
              {appointment.reason && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">Motif de consultation</h3>
                  </div>
                  <p className="rounded-lg border bg-gray-50 p-4 text-gray-700">
                    {appointment.reason}
                  </p>
                </div>
              )}

              {/* Notes */}
              {appointment.notes && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Notes internes</h3>
                  <p className="rounded-lg border bg-gray-50 p-4 text-gray-700">
                    {appointment.notes}
                  </p>
                </div>
              )}

              {/* Diagnosis (if completed) */}
              {appointment.diagnosis && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Diagnostic</h3>
                  <p className="rounded-lg border bg-green-50 p-4 text-gray-700">
                    {appointment.diagnosis}
                  </p>
                </div>
              )}

              {/* Quick Actions */}
              {appointment.status !== AppointmentStatus.COMPLETED &&
                appointment.status !== AppointmentStatus.CANCELLED && (
                <div className="flex gap-3 border-t pt-4">
                  <Button
                    onClick={() => handleStatusChange(AppointmentStatus.CONFIRMED)}
                    variant="outline"
                    className="flex-1"
                    disabled={appointment.status === AppointmentStatus.CONFIRMED}
                  >
                    Confirmer
                  </Button>
                  <Button
                    onClick={() => handleStatusChange(AppointmentStatus.IN_PROGRESS)}
                    variant="outline"
                    className="flex-1"
                    disabled={appointment.status === AppointmentStatus.IN_PROGRESS}
                  >
                    Démarrer
                  </Button>
                  <Button
                    onClick={() => handleStatusChange(AppointmentStatus.COMPLETED)}
                    className="flex-1 gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Terminer
                  </Button>
                </div>
              )}

              {/* Metadata */}
              <div className="border-t pt-4 text-xs text-gray-500">
                <p>Créé le {format(new Date(appointment.created_at), 'dd/MM/yyyy à HH:mm')}</p>
                <p>
                  Dernière modification le{' '}
                  {format(new Date(appointment.updated_at), 'dd/MM/yyyy à HH:mm')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
