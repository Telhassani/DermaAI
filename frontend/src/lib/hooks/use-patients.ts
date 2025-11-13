/**
 * Patients hooks using React Query
 * Provides data fetching for patients
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { toast } from 'sonner'

// Patient types
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum IdentificationType {
  CNI = 'cni',
  PASSPORT = 'passport',
  RESIDENCE_PERMIT = 'residence_permit',
}

export interface Patient {
  id: number
  identification_type: IdentificationType
  identification_number: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: Gender
  email?: string
  phone: string
  address?: string
  city?: string
  postal_code?: string
  country?: string
  insurance_number?: string
  allergies?: string
  medical_history?: string
  doctor_id?: number
  created_at: string
  updated_at: string
  full_name: string
  age: number
}

export interface PatientListParams {
  search?: string
  gender?: Gender
  doctor_id?: number
  min_age?: number
  max_age?: number
  page?: number
  page_size?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

// Query keys
export const patientKeys = {
  all: ['patients'] as const,
  lists: () => [...patientKeys.all, 'list'] as const,
  list: (params: PatientListParams) => [...patientKeys.lists(), params] as const,
  details: () => [...patientKeys.all, 'detail'] as const,
  detail: (id: number) => [...patientKeys.details(), id] as const,
}

// Hook: List patients
export function usePatients(params: PatientListParams = {}) {
  return useQuery({
    queryKey: patientKeys.list(params),
    queryFn: async () => {
      const response = await api.patients.list(params)
      return response.data
    },
  })
}

// Hook: Get single patient
export function usePatient(id: number, enabled: boolean = true) {
  return useQuery({
    queryKey: patientKeys.detail(id),
    queryFn: async () => {
      const response = await api.patients.get(id)
      return response.data
    },
    enabled: enabled && !!id,
  })
}

// Hook: Search patients (for autocomplete)
export function useSearchPatients(search: string, enabled: boolean = true) {
  return useQuery({
    queryKey: [...patientKeys.lists(), 'search', search],
    queryFn: async () => {
      const response = await api.patients.list({
        search,
        page_size: 20,
        sort_by: 'last_name',
        sort_order: 'asc',
      })
      return response.data
    },
    enabled: enabled && search.length >= 2,
    staleTime: 30000, // Cache for 30 seconds
  })
}
