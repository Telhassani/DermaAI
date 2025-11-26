/**
 * Hook for drag and drop appointment rescheduling
 * Handles dragging appointments to different dates with conflict detection
 */

'use client'

import { useState, useCallback } from 'react'
import { Appointment, useUpdateAppointment, useCheckAppointmentConflicts } from './use-appointments'
import { toast } from 'sonner'
import { addMinutes, startOfDay, endOfDay, format, parse } from 'date-fns'
import { fr } from 'date-fns/locale'

export interface DragDropState {
  isDragging: boolean
  draggedAppointment: Appointment | null
  dragSource: 'month-view' | 'week-view' | 'day-view' | null
  dragOffset: number // offset in minutes from day start
}

interface UseAppointmentDragDropReturn {
  dragState: DragDropState
  handleDragStart: (appointment: Appointment, source: string) => (e: React.DragEvent) => void
  handleDragOver: (e: React.DragEvent) => void
  handleDrop: (targetDate: Date) => (e: React.DragEvent) => Promise<void>
  resetDragState: () => void
  isDraggingAppointment: boolean
}

/**
 * Find the first available time slot on a given day
 * by checking for conflicts and finding gaps
 */
function findAvailableTimeSlot(
  targetDate: Date,
  appointmentDuration: number,
  existingAppointments: Appointment[],
  startHour: number = 8,
  endHour: number = 18
): Date {
  const dayStart = startOfDay(targetDate)
  let currentTime = addMinutes(dayStart, startHour * 60)
  const dayEnd = addMinutes(dayStart, endHour * 60)

  // Sort appointments by start time
  const sortedAppointments = existingAppointments
    .filter((apt) => {
      const aptStart = startOfDay(new Date(apt.start_time))
      return aptStart.getTime() === dayStart.getTime()
    })
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

  // Find first available slot
  for (const apt of sortedAppointments) {
    const aptStart = new Date(apt.start_time)
    const aptEnd = new Date(apt.end_time)

    // Check if current time + duration fits before this appointment
    const slotEnd = addMinutes(currentTime, appointmentDuration)
    if (slotEnd <= aptStart) {
      return currentTime
    }

    // Move current time to after this appointment
    currentTime = aptEnd
  }

  // Check if we can fit after last appointment
  const finalSlotEnd = addMinutes(currentTime, appointmentDuration)
  if (finalSlotEnd <= dayEnd) {
    return currentTime
  }

  // If no slot found, return original time (will be caught by conflict detection)
  return currentTime
}

/**
 * Hook for managing appointment drag and drop
 */
export function useAppointmentDragDrop(
  allAppointments: Appointment[] = []
): UseAppointmentDragDropReturn {
  const [dragState, setDragState] = useState<DragDropState>({
    isDragging: false,
    draggedAppointment: null,
    dragSource: null,
    dragOffset: 0,
  })

  const updateMutation = useUpdateAppointment()
  const conflictMutation = useCheckAppointmentConflicts()

  const resetDragState = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedAppointment: null,
      dragSource: null,
      dragOffset: 0,
    })
  }, [])

  const handleDragStart = useCallback(
    (appointment: Appointment, source: string) => (e: React.DragEvent) => {
      // Check if appointment can be dragged
      if (
        appointment.status === 'completed' ||
        appointment.status === 'cancelled' ||
        appointment.status === 'no_show'
      ) {
        e.preventDefault()
        return
      }

      console.log('Drag started for appointment:', appointment.id)
      e.dataTransfer!.effectAllowed = 'move'
      e.dataTransfer!.setData('text/plain', JSON.stringify(appointment))

      // Calculate offset within the day (for time preservation if supported)
      const startTime = new Date(appointment.start_time)
      const dayStart = startOfDay(startTime)
      const offsetMinutes = Math.round((startTime.getTime() - dayStart.getTime()) / (1000 * 60))

      setDragState({
        isDragging: true,
        draggedAppointment: appointment,
        dragSource: source as any,
        dragOffset: offsetMinutes,
      })

      // Visual feedback
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move'
      }
    },
    []
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer!.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback(
    (targetDate: Date) => async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      console.log('Drop event triggered on', targetDate)

      if (!dragState.draggedAppointment) {
        console.error('No dragged appointment in state')
        toast.error('Erreur: Pas de rendez-vous en cours de déplacement')
        resetDragState()
        return
      }

      toast.info(`Déplacement vers le ${format(targetDate, 'dd/MM')}`)

      try {
        const appointment = dragState.draggedAppointment

        // Check if dropping on the same day
        const originalDate = startOfDay(new Date(appointment.start_time))
        const targetDay = startOfDay(targetDate)

        if (originalDate.getTime() === targetDay.getTime()) {
          toast.info('Veuillez choisir une date différente')
          resetDragState()
          return
        }

        // Failsafe: Check if appointment can be modified
        if (
          appointment.status === 'completed' ||
          appointment.status === 'cancelled' ||
          appointment.status === 'no_show'
        ) {
          toast.error('Ce rendez-vous ne peut pas être déplacé')
          resetDragState()
          return
        }

        // Calculate new time slot
        const appointmentDuration = appointment.duration_minutes
        const newStartTime = findAvailableTimeSlot(
          targetDate,
          appointmentDuration,
          allAppointments,
          8,
          18
        )
        const newEndTime = addMinutes(newStartTime, appointmentDuration)

        // Format times as ISO strings
        const startTimeStr = newStartTime.toISOString()
        const endTimeStr = newEndTime.toISOString()

        // Check for conflicts with the new time
        const conflictResponse = await conflictMutation.mutateAsync({
          doctor_id: appointment.doctor_id,
          start_time: startTimeStr,
          end_time: endTimeStr,
          exclude_appointment_id: appointment.id,
        })

        if (conflictResponse.has_conflict) {
          toast.error(
            `Conflit détecté: ${conflictResponse.conflict_details}. Essayez une autre date.`
          )
          resetDragState()
          return
        }

        // Perform the update
        await updateMutation.mutateAsync({
          id: appointment.id,
          data: {
            start_time: startTimeStr,
            end_time: endTimeStr,
          },
        })

        toast.success(
          `Rendez-vous décalé au ${format(newStartTime, 'dd/MM/yyyy à HH:mm', { locale: fr })}`
        )
      } catch (error) {
        console.error('Drop error:', error)
        toast.error('Erreur lors du déplacement du rendez-vous')
      } finally {
        resetDragState()
      }
    },
    [dragState, updateMutation, conflictMutation, resetDragState, allAppointments]
  )

  return {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDrop,
    resetDragState,
    isDraggingAppointment: dragState.isDragging,
  }
}
