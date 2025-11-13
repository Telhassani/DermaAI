'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, addMinutes } from 'date-fns'
import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PatientSearchSelect } from './patient-search-select'
import { AppointmentType, AppointmentStatus, Appointment } from '@/lib/hooks/use-appointments'
import { Patient } from '@/lib/hooks/use-patients'
import { useAuth } from '@/lib/hooks/use-auth'

// Validation schema
const appointmentSchema = z.object({
  patient_id: z.number({ required_error: 'Veuillez sélectionner un patient' }).min(1),
  doctor_id: z.number().min(1),
  date: z.string().min(1, 'Date requise'),
  start_time: z.string().min(1, 'Heure de début requise'),
  duration: z.number().min(15, 'Durée minimale: 15 minutes').max(480, 'Durée maximale: 8 heures'),
  type: z.nativeEnum(AppointmentType),
  reason: z.string().optional(),
  notes: z.string().optional(),
  is_first_visit: z.boolean(),
})

type AppointmentFormData = z.infer<typeof appointmentSchema>

interface AppointmentFormProps {
  appointment?: Appointment
  initialDate?: Date
  initialHour?: number
  onSubmit: (data: any) => void
  onCancel: () => void
  isLoading?: boolean
}

// Duration presets
const durationPresets = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1h' },
  { value: 90, label: '1h 30' },
  { value: 120, label: '2h' },
]

export function AppointmentForm({
  appointment,
  initialDate,
  initialHour,
  onSubmit,
  onCancel,
  isLoading,
}: AppointmentFormProps) {
  const { user } = useAuth()

  // Default values
  const getDefaultValues = (): AppointmentFormData => {
    if (appointment) {
      const startDate = new Date(appointment.start_time)
      return {
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        date: format(startDate, 'yyyy-MM-dd'),
        start_time: format(startDate, 'HH:mm'),
        duration: appointment.duration_minutes,
        type: appointment.type,
        reason: appointment.reason || '',
        notes: appointment.notes || '',
        is_first_visit: appointment.is_first_visit,
      }
    }

    // For new appointment
    const date = initialDate || new Date()
    const hour = initialHour !== undefined ? initialHour : date.getHours()

    return {
      patient_id: 0,
      doctor_id: user?.id || 0,
      date: format(date, 'yyyy-MM-dd'),
      start_time: `${hour.toString().padStart(2, '0')}:00`,
      duration: 30,
      type: AppointmentType.CONSULTATION,
      reason: '',
      notes: '',
      is_first_visit: false,
    }
  }

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: getDefaultValues(),
  })

  const watchDuration = watch('duration')
  const watchDate = watch('date')
  const watchStartTime = watch('start_time')

  // Calculate end time
  const calculateEndTime = () => {
    if (!watchDate || !watchStartTime || !watchDuration) return ''

    try {
      const [hours, minutes] = watchStartTime.split(':').map(Number)
      const startDate = new Date(watchDate)
      startDate.setHours(hours, minutes, 0, 0)
      const endDate = addMinutes(startDate, watchDuration)
      return format(endDate, 'HH:mm')
    } catch {
      return ''
    }
  }

  // Handle form submission
  const handleFormSubmit = (data: AppointmentFormData) => {
    // Combine date and time
    const startDateTime = new Date(`${data.date}T${data.start_time}:00`)
    const endDateTime = addMinutes(startDateTime, data.duration)

    const payload = {
      patient_id: data.patient_id,
      doctor_id: data.doctor_id,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      type: data.type,
      reason: data.reason || undefined,
      notes: data.notes || undefined,
      is_first_visit: data.is_first_visit,
    }

    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Patient Selection */}
      <div>
        <Label>Patient *</Label>
        <div className="mt-1.5">
          <Controller
            name="patient_id"
            control={control}
            render={({ field }) => (
              <PatientSearchSelect
                value={field.value}
                onSelect={(patient: Patient | null) => {
                  field.onChange(patient?.id || 0)
                }}
                error={errors.patient_id?.message}
              />
            )}
          />
        </div>
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">Date *</Label>
          <div className="relative mt-1.5">
            <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="date"
              type="date"
              {...register('date')}
              className="pl-10"
            />
          </div>
          {errors.date && (
            <p className="mt-1 text-xs text-red-600">{errors.date.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="start_time">Heure de début *</Label>
          <div className="relative mt-1.5">
            <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="start_time"
              type="time"
              {...register('start_time')}
              className="pl-10"
            />
          </div>
          {errors.start_time && (
            <p className="mt-1 text-xs text-red-600">{errors.start_time.message}</p>
          )}
        </div>
      </div>

      {/* Duration */}
      <div>
        <Label>Durée *</Label>
        <div className="mt-1.5 space-y-2">
          {/* Duration presets */}
          <div className="flex flex-wrap gap-2">
            {durationPresets.map((preset) => (
              <Button
                key={preset.value}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setValue('duration', preset.value)}
                className={watchDuration === preset.value ? 'bg-blue-50 text-blue-700 border-blue-500' : ''}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Custom duration input */}
          <div className="flex items-center gap-2">
            <Input
              type="number"
              {...register('duration', { valueAsNumber: true })}
              min={15}
              max={480}
              step={15}
              className="w-32"
            />
            <span className="text-sm text-gray-600">minutes</span>
          </div>

          {/* End time display */}
          {calculateEndTime() && (
            <p className="text-sm text-gray-600">
              Fin prévue : <span className="font-medium">{calculateEndTime()}</span>
            </p>
          )}

          {errors.duration && (
            <p className="text-xs text-red-600">{errors.duration.message}</p>
          )}
        </div>
      </div>

      {/* Appointment Type */}
      <div>
        <Label htmlFor="type">Type de rendez-vous *</Label>
        <select
          id="type"
          {...register('type')}
          className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={AppointmentType.CONSULTATION}>Consultation</option>
          <option value={AppointmentType.FOLLOW_UP}>Suivi</option>
          <option value={AppointmentType.PROCEDURE}>Intervention</option>
          <option value={AppointmentType.EMERGENCY}>Urgence</option>
        </select>
      </div>

      {/* First Visit Checkbox */}
      <div className="flex items-center gap-2">
        <input
          id="is_first_visit"
          type="checkbox"
          {...register('is_first_visit')}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <Label htmlFor="is_first_visit" className="cursor-pointer font-normal">
          Première visite
        </Label>
      </div>

      {/* Reason */}
      <div>
        <Label htmlFor="reason">Motif de consultation</Label>
        <textarea
          id="reason"
          {...register('reason')}
          rows={3}
          placeholder="Ex: Consultation dermatologique pour éruption cutanée..."
          className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Notes internes</Label>
        <textarea
          id="notes"
          {...register('notes')}
          rows={2}
          placeholder="Notes privées visibles uniquement par le personnel médical..."
          className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Enregistrement...' : appointment ? 'Mettre à jour' : 'Créer le rendez-vous'}
        </Button>
      </div>
    </form>
  )
}
