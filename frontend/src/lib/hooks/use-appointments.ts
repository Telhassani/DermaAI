/**
 * Appointments hooks using React Query
 * Provides data fetching and mutations for appointments
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { toast } from 'sonner'

// Appointment types
export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum AppointmentType {
  CONSULTATION = 'consultation',
  FOLLOW_UP = 'follow_up',
  PROCEDURE = 'procedure',
  EMERGENCY = 'emergency',
}

export interface Appointment {
  id: number
  patient_id: number
  doctor_id: number
  start_time: string
  end_time: string
  type: AppointmentType
  status: AppointmentStatus
  reason?: string
  notes?: string
  diagnosis?: string
  is_first_visit: boolean
  reminder_sent: boolean
  created_at: string
  updated_at: string
  duration_minutes: number
  is_upcoming: boolean
  is_past: boolean
}

export interface AppointmentWithDetails extends Appointment {
  patient_name?: string
  patient_phone?: string
  doctor_name?: string
}

export interface AppointmentListParams {
  patient_id?: number
  doctor_id?: number
  type?: AppointmentType
  status?: AppointmentStatus
  start_date?: string
  end_date?: string
  is_first_visit?: boolean
  page?: number
  page_size?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface AppointmentCreateData {
  patient_id: number
  doctor_id: number
  start_time: string
  end_time: string
  type?: AppointmentType
  reason?: string
  notes?: string
  is_first_visit?: boolean
}

export interface AppointmentUpdateData {
  patient_id?: number
  doctor_id?: number
  start_time?: string
  end_time?: string
  type?: AppointmentType
  status?: AppointmentStatus
  reason?: string
  notes?: string
  diagnosis?: string
  is_first_visit?: boolean
  reminder_sent?: boolean
}

// Query keys
export const appointmentKeys = {
  all: ['appointments'] as const,
  lists: () => [...appointmentKeys.all, 'list'] as const,
  list: (params: AppointmentListParams) => [...appointmentKeys.lists(), params] as const,
  details: () => [...appointmentKeys.all, 'detail'] as const,
  detail: (id: number) => [...appointmentKeys.details(), id] as const,
  stats: (params?: any) => [...appointmentKeys.all, 'stats', params] as const,
}

// Hook: List appointments
export function useAppointments(params: AppointmentListParams = {}) {
  return useQuery({
    queryKey: appointmentKeys.list(params),
    queryFn: async () => {
      const response = await api.appointments.list(params)
      return response.data
    },
  })
}

// Hook: Get single appointment
export function useAppointment(id: number, enabled: boolean = true) {
  return useQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn: async () => {
      const response = await api.appointments.get(id)
      return response.data
    },
    enabled: enabled && !!id,
  })
}

// Hook: Get appointment stats
export function useAppointmentStats(params?: any) {
  return useQuery({
    queryKey: appointmentKeys.stats(params),
    queryFn: async () => {
      const response = await api.appointments.stats(params)
      return response.data
    },
  })
}

// Hook: Create appointment
export function useCreateAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AppointmentCreateData) => {
      const response = await api.appointments.create(data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: appointmentKeys.stats() })
      toast.success('Rendez-vous créé avec succès')
    },
    onError: (error: any) => {
      console.error('Create appointment error:', error)
      // Error toast is handled by the API client interceptor
    },
  })
}

// Hook: Update appointment (with optimistic updates)
export function useUpdateAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: AppointmentUpdateData }) => {
      const response = await api.appointments.update(id, data)
      return response.data
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: appointmentKeys.lists() })
      await queryClient.cancelQueries({ queryKey: appointmentKeys.detail(id) })

      // Snapshot previous values
      const previousAppointments = queryClient.getQueryData(appointmentKeys.lists())
      const previousAppointment = queryClient.getQueryData(appointmentKeys.detail(id))

      // Optimistically update lists
      queryClient.setQueriesData({ queryKey: appointmentKeys.lists() }, (old: any) => {
        if (!old?.appointments) return old
        return {
          ...old,
          appointments: old.appointments.map((apt: Appointment) =>
            apt.id === id ? { ...apt, ...data } : apt
          ),
        }
      })

      // Optimistically update detail
      queryClient.setQueryData(appointmentKeys.detail(id), (old: any) => {
        if (!old) return old
        return { ...old, ...data }
      })

      return { previousAppointments, previousAppointment }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: appointmentKeys.stats() })
      toast.success('Rendez-vous modifié avec succès')
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousAppointments) {
        queryClient.setQueryData(appointmentKeys.lists(), context.previousAppointments)
      }
      if (context?.previousAppointment) {
        queryClient.setQueryData(appointmentKeys.detail(variables.id), context.previousAppointment)
      }
      console.error('Update appointment error:', error)
    },
  })
}

// Hook: Update appointment status
export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
    }: {
      id: number
      status: AppointmentStatus
      notes?: string
    }) => {
      const response = await api.appointments.updateStatus(id, { status, notes })
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: appointmentKeys.stats() })
      toast.success('Statut du rendez-vous mis à jour')
    },
    onError: (error: any) => {
      console.error('Update appointment status error:', error)
    },
  })
}

// Hook: Delete appointment (with optimistic updates)
export function useDeleteAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.appointments.delete(id)
      return id
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: appointmentKeys.lists() })

      // Snapshot previous value
      const previousAppointments = queryClient.getQueryData(appointmentKeys.lists())

      // Optimistically remove from lists
      queryClient.setQueriesData({ queryKey: appointmentKeys.lists() }, (old: any) => {
        if (!old?.appointments) return old
        return {
          ...old,
          appointments: old.appointments.filter((apt: Appointment) => apt.id !== id),
          total: old.total - 1,
        }
      })

      return { previousAppointments }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: appointmentKeys.stats() })
      toast.success('Rendez-vous supprimé avec succès')
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousAppointments) {
        queryClient.setQueryData(appointmentKeys.lists(), context.previousAppointments)
      }
      console.error('Delete appointment error:', error)
      toast.error('Erreur lors de la suppression')
    },
  })
}

// Hook: Check conflicts (mutation version)
export function useCheckAppointmentConflicts() {
  return useMutation({
    mutationFn: async (data: {
      doctor_id: number
      start_time: string
      end_time: string
      exclude_appointment_id?: number
    }) => {
      const response = await api.appointments.checkConflicts(data)
      return response.data
    },
  })
}

// Hook: Check conflicts (query version for real-time detection)
export function useCheckAppointmentConflictsQuery(
  data?: {
    doctor_id: number
    start_time: string
    end_time: string
    exclude_appointment_id?: number
  }
) {
  return useQuery({
    queryKey: ['conflicts', data],
    queryFn: async () => {
      if (!data) throw new Error('Data is required')
      const response = await api.appointments.checkConflicts(data)
      return response.data
    },
    enabled: !!data,
    staleTime: 0, // Always refetch for real-time detection
    retry: false,
  })
}
