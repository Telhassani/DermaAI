import { apiClient } from './client'

export interface PatientResponse {
  id: number
  full_name: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  date_of_birth?: string
  age?: number
  gender?: 'male' | 'female' | 'other'
  address?: string
  city?: string
  postal_code?: string
  country?: string
  identification_type?: 'cin' | 'passport'
  identification_number?: string
  insurance_number?: string
  allergies?: string
  medical_history?: string
  created_at: string
  updated_at: string
}

export interface PatientListResponse {
  patients: PatientResponse[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface PatientCreateRequest {
  full_name: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  date_of_birth?: string
  gender?: 'male' | 'female' | 'other'
  address?: string
  city?: string
  postal_code?: string
  country?: string
  identification_type?: 'cin' | 'passport'
  identification_number?: string
  insurance_number?: string
  allergies?: string
  medical_history?: string
}

// Alias for compatibility
export type PatientData = PatientCreateRequest

export interface PatientListParams {
  search?: string
  page?: number
  page_size?: number
  gender?: 'male' | 'female' | 'other'
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

// List patients with filters
export async function listPatients(params?: PatientListParams): Promise<PatientListResponse> {
  const response = await apiClient.get('/patients', { params })
  return response.data
}

// Search patients (alias for listPatients with search param)
export async function searchPatients(query: string): Promise<PatientListResponse> {
  return listPatients({ search: query, page: 1, page_size: 20 })
}

// Get single patient by ID
export async function getPatient(id: number): Promise<PatientResponse> {
  const response = await apiClient.get(`/patients/${id}`)
  return response.data
}

// Create new patient
export async function createPatient(data: PatientCreateRequest): Promise<PatientResponse> {
  const response = await apiClient.post('/patients', data)
  return response.data
}

// Update patient
export async function updatePatient(
  id: number,
  data: Partial<PatientCreateRequest>
): Promise<PatientResponse> {
  const response = await apiClient.put(`/patients/${id}`, data)
  return response.data
}

// Delete patient
export async function deletePatient(id: number): Promise<void> {
  await apiClient.delete(`/patients/${id}`)
}
