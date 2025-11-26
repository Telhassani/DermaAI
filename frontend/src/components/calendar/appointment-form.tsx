'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, addMinutes } from 'date-fns'
import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PatientSearchSelect } from './patient-search-select'
import { ConflictDetector } from './conflict-detector'
import { AppointmentType, AppointmentStatus, Appointment } from '@/lib/hooks/use-appointments'
import { Patient } from '@/lib/hooks/use-patients'
import { useAuth } from '@/lib/hooks/use-auth'

// Validation schema
const appointmentSchema = z.object({
  patient_id: z.number().optional(),
  doctor_id: z.number().min(1),
  date: z.string().min(1, 'Date requise'),
  start_time: z.string().min(1, 'Heure de début requise'),
  duration: z.number().min(15, 'Durée minimale: 15 minutes').max(480, 'Durée maximale: 8 heures'),
  type: z.nativeEnum(AppointmentType),
  reason: z.string().optional(),
  notes: z.string().optional(),
  is_first_visit: z.boolean(),
  guest_name: z.string().optional(),
  guest_phone: z.string().optional(),
  guest_email: z.string().email('Email invalide').optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if ((!data.patient_id || data.patient_id === 0) && !data.guest_name) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Veuillez sélectionner un patient ou saisir un nom d'invité",
      path: ["patient_id"],
    });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Nom de l'invité requis",
      path: ["guest_name"],
    });
  }
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
  const [isGuest, setIsGuest] = useState(false)

  // Default values
  const getDefaultValues = (): AppointmentFormData => {
    if (appointment) {
      const startDate = new Date(appointment.start_time)
      const isGuestAppt = !appointment.patient_id && !!appointment.guest_name
      if (isGuestAppt) {
        // We need to set isGuest state in useEffect because we can't do it here during render
        // But for default values it's fine
      }

      return {
        patient_id: appointment.patient_id || 0,
        doctor_id: appointment.doctor_id,
        date: format(startDate, 'yyyy-MM-dd'),
        start_time: format(startDate, 'HH:mm'),
        duration: appointment.duration_minutes,
        type: appointment.type,
        reason: appointment.reason || '',
        notes: appointment.notes || '',
        is_first_visit: appointment.is_first_visit,
        guest_name: appointment.guest_name || '',
        guest_phone: appointment.guest_phone || '',
        guest_email: appointment.guest_email || '',
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
      guest_name: '',
      guest_phone: '',
      guest_email: '',
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

  // Set isGuest state if editing a guest appointment
  useEffect(() => {
    if (appointment && !appointment.patient_id && appointment.guest_name) {
      setIsGuest(true)
    }
  }, [appointment])

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

  // Calculate start and end times for conflict detection
  const getCalculatedTimes = (): { start: Date | null; end: Date | null } => {
    if (!watchDate || !watchStartTime || !watchDuration) {
      return { start: null, end: null }
    }

    try {
      const start = new Date(`${watchDate}T${watchStartTime}:00`)
      const end = addMinutes(start, watchDuration)
      return { start, end }
    } catch {
      return { start: null, end: null }
    }
  }

  const calculatedTimes = getCalculatedTimes()

  // Handle form submission
  const handleFormSubmit = (data: AppointmentFormData) => {
    // Combine date and time
    const startDateTime = new Date(`${data.date}T${data.start_time}:00`)
    const endDateTime = addMinutes(startDateTime, data.duration)

    const payload = {
      patient_id: isGuest ? null : (data.patient_id || null),
      doctor_id: data.doctor_id,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      type: data.type,
      reason: data.reason || undefined,
      notes: data.notes || undefined,
      is_first_visit: data.is_first_visit,
      guest_name: isGuest ? data.guest_name : undefined,
      guest_phone: isGuest ? data.guest_phone : undefined,
      guest_email: isGuest ? data.guest_email : undefined,
    }

    onSubmit(payload)
  }

  // Handle suggestion selection from conflict detector
  const handleSuggestionSelect = (newStartTime: Date) => {
    setValue('date', format(newStartTime, 'yyyy-MM-dd'))
    setValue('start_time', format(newStartTime, 'HH:mm'))
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Patient Selection or Guest Input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label>Patient *</Label>
          {isGuest && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsGuest(false)
                setValue('guest_name', '')
                setValue('guest_phone', '')
                setValue('guest_email', '')
              }}
              className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800"
            >
              Rechercher un patient existant
            </Button>
          )}
        </div>

        {!isGuest ? (
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
                  onGuestSelect={(name?: string) => {
                    setIsGuest(true)
                    field.onChange(0)
                    if (name) {
                      setValue('guest_name', name)
                    }
                  }}
                  error={errors.patient_id?.message}
                />
              )}
            />
          </div>
        ) : (
          <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div>
              <Label htmlFor="guest_name" className="text-xs font-medium text-gray-500">Nom complet *</Label>
              <Input
                id="guest_name"
                {...register('guest_name')}
                placeholder="Ex: Jean Dupont"
                className="mt-1 bg-white"
              />
              {errors.guest_name && (
                <p className="mt-1 text-xs text-red-600">{errors.guest_name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guest_phone" className="text-xs font-medium text-gray-500">Téléphone</Label>
                <Input
                  id="guest_phone"
                  {...register('guest_phone')}
                  placeholder="06 12 34 56 78"
                  className="mt-1 bg-white"
                />
              </div>
              <div>
                <Label htmlFor="guest_email" className="text-xs font-medium text-gray-500">Email</Label>
                <Input
                  id="guest_email"
                  type="email"
                  {...register('guest_email')}
                  placeholder="jean.dupont@email.com"
                  className="mt-1 bg-white"
                />
                {errors.guest_email && (
                  <p className="mt-1 text-xs text-red-600">{errors.guest_email.message}</p>
                )}
              </div>
            </div>
          </div>
        )}
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

      {/* Conflict Detection */}
      {user && calculatedTimes.start && calculatedTimes.end && (
        <ConflictDetector
          startTime={calculatedTimes.start}
          endTime={calculatedTimes.end}
          doctorId={user.id}
          excludeAppointmentId={appointment?.id}
          onSuggestionSelect={handleSuggestionSelect}
        />
      )}

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
