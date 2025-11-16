/**
 * Hook for appointment resizing (duration adjustment)
 * Allows dragging the bottom edge of an appointment to adjust its duration
 */

'use client'

import { useState, useCallback, useRef } from 'react'
import { Appointment, useUpdateAppointment, useCheckAppointmentConflicts } from './use-appointments'
import { toast } from 'sonner'
import { addMinutes, format } from 'date-fns'

// Constraints for appointment duration
const MIN_DURATION_MINUTES = 15
const MAX_DURATION_MINUTES = 8 * 60 // 8 hours
const RESIZE_STEP = 15 // Snap to 15-minute increments

interface ResizeState {
  isResizing: boolean
  resizingAppointment: Appointment | null
  originalDuration: number
  currentDuration: number
  startY: number
}

interface UseAppointmentResizeReturn {
  resizeState: ResizeState
  handleResizeStart: (appointment: Appointment) => (e: React.MouseEvent) => void
  handleResizeMove: (e: React.MouseEvent) => void
  handleResizeEnd: (e: React.MouseEvent) => Promise<void>
  isResizing: boolean
  durationDisplayText: string
}

/**
 * Round duration to nearest step
 */
function roundToStep(duration: number, step: number = RESIZE_STEP): number {
  return Math.round(duration / step) * step
}

/**
 * Validate and clamp duration within acceptable range
 */
function validateDuration(duration: number): number {
  return Math.max(MIN_DURATION_MINUTES, Math.min(duration, MAX_DURATION_MINUTES))
}

/**
 * Hook for managing appointment resizing
 */
export function useAppointmentResize(
  allAppointments: Appointment[] = []
): UseAppointmentResizeReturn {
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    resizingAppointment: null,
    originalDuration: 0,
    currentDuration: 0,
    startY: 0,
  })

  const updateMutation = useUpdateAppointment()
  const conflictMutation = useCheckAppointmentConflicts()
  const startYRef = useRef(0)

  // Define handleResizeMove first since it's a dependency for handleResizeEnd
  const handleResizeMove = useCallback((e: React.MouseEvent) => {
    if (!resizeState.isResizing) return

    const deltaY = e.clientY - startYRef.current
    // Each pixel = 1 minute change (can be adjusted for sensitivity)
    const deltaMinutes = Math.round(deltaY / 2)
    let newDuration = resizeState.originalDuration + deltaMinutes

    // Round to step and validate
    newDuration = roundToStep(newDuration)
    newDuration = validateDuration(newDuration)

    setResizeState((prev) => ({
      ...prev,
      currentDuration: newDuration,
    }))
  }, [resizeState])

  // Define handleResizeEnd after handleResizeMove since it depends on it
  const handleResizeEnd = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault()

      if (!resizeState.isResizing || !resizeState.resizingAppointment) {
        setResizeState({
          isResizing: false,
          resizingAppointment: null,
          originalDuration: 0,
          currentDuration: 0,
          startY: 0,
        })
        return
      }

      // Remove global listeners
      document.removeEventListener('mousemove', handleResizeMove as any)
      document.removeEventListener('mouseup', handleResizeEnd as any)

      try {
        const appointment = resizeState.resizingAppointment
        const newDuration = resizeState.currentDuration

        // Check if duration actually changed
        if (newDuration === appointment.duration_minutes) {
          setResizeState({
            isResizing: false,
            resizingAppointment: null,
            originalDuration: 0,
            currentDuration: 0,
            startY: 0,
          })
          return
        }

        // Calculate new end time
        const startTime = new Date(appointment.start_time)
        const newEndTime = addMinutes(startTime, newDuration)
        const endTimeStr = newEndTime.toISOString()

        // Check for conflicts with new time
        const conflictResponse = await conflictMutation.mutateAsync({
          doctor_id: appointment.doctor_id,
          start_time: appointment.start_time,
          end_time: endTimeStr,
          exclude_appointment_id: appointment.id,
        })

        if (conflictResponse.has_conflict) {
          toast.error(
            `La nouvelle durée crée un conflit: ${conflictResponse.conflict_details}`
          )
          setResizeState({
            isResizing: false,
            resizingAppointment: null,
            originalDuration: 0,
            currentDuration: 0,
            startY: 0,
          })
          return
        }

        // Perform the update
        await updateMutation.mutateAsync({
          id: appointment.id,
          data: {
            end_time: endTimeStr,
          },
        })

        toast.success(
          `Durée mise à jour: ${newDuration} minutes`
        )
      } catch (error) {
        console.error('Resize error:', error)
        toast.error('Erreur lors du redimensionnement du rendez-vous')
      } finally {
        setResizeState({
          isResizing: false,
          resizingAppointment: null,
          originalDuration: 0,
          currentDuration: 0,
          startY: 0,
        })
      }
    },
    [resizeState, updateMutation, conflictMutation, handleResizeMove]
  )

  const handleResizeStart = useCallback(
    (appointment: Appointment) => (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      startYRef.current = e.clientY

      const newState = {
        isResizing: true,
        resizingAppointment: appointment,
        originalDuration: appointment.duration_minutes,
        currentDuration: appointment.duration_minutes,
        startY: e.clientY,
      }
      setResizeState(newState)

      // Define event handlers that capture the new state
      const handleMove = (moveEvent: MouseEvent) => {
        const deltaY = moveEvent.clientY - startYRef.current
        const deltaMinutes = Math.round(deltaY / 2)
        let newDuration = newState.originalDuration + deltaMinutes

        newDuration = roundToStep(newDuration)
        newDuration = validateDuration(newDuration)

        setResizeState((prev) => ({
          ...prev,
          currentDuration: newDuration,
        }))
      }

      const handleEnd = async (endEvent: MouseEvent) => {
        document.removeEventListener('mousemove', handleMove)
        document.removeEventListener('mouseup', handleEnd)

        // Call the resize end handler
        const syntheticEvent = {
          preventDefault: () => {},
        } as unknown as React.MouseEvent
        await handleResizeEnd(syntheticEvent)
      }

      document.addEventListener('mousemove', handleMove)
      document.addEventListener('mouseup', handleEnd)
    },
    [handleResizeEnd]
  )

  // Generate display text for current resize operation
  const durationDisplayText = resizeState.isResizing
    ? `${resizeState.currentDuration} min (${Math.floor(resizeState.currentDuration / 60)}h ${resizeState.currentDuration % 60}m)`
    : ''

  return {
    resizeState,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd,
    isResizing: resizeState.isResizing,
    durationDisplayText,
  }
}
