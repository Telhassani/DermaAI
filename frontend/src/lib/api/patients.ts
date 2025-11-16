/**
 * Patients API endpoints wrapper
 * Provides type-safe access to patient-related API calls
 */

import { api } from './client'

export interface PatientResponse {
  id: number
  first_name: string
  last_name: string
  full_name: string
  email?: string
  phone?: string
  date_of_birth?: string
  gender?: string
  age?: number
  address?: string
  city?: string
  postal_code?: string
  country?: string
  identification_type?: string
  identification_number?: string
  medical_history?: string
  allergies?: string
  created_at: string
  updated_at: string
}

export interface ListPatientsParams {
  search?: string
  page?: number
  page_size?: number
}

export interface PatientsListResponse {
  patients: PatientResponse[]
  total: number
  total_pages: number
  page: number
  page_size: number
}

/**
 * List all patients with pagination and search
 */
export async function listPatients(
  params?: ListPatientsParams
): Promise<PatientsListResponse> {
  const response = await api.patients.list(params)
  return response.data
}

/**
 * Get a single patient by ID
 */
export async function getPatient(id: number): Promise<PatientResponse> {
  const response = await api.patients.get(id)
  return response.data
}

/**
 * Create a new patient
 */
export async function createPatient(data: Partial<PatientResponse>) {
  const response = await api.patients.create(data)
  return response.data
}

/**
 * Update an existing patient
 */
export async function updatePatient(
  id: number,
  data: Partial<PatientResponse>
) {
  const response = await api.patients.update(id, data)
  return response.data
}

/**
 * Delete a patient by ID
 */
export async function deletePatient(id: number) {
  await api.patients.delete(id)
}

/**
 * Get patient statistics
 */
export async function getPatientStats(id: number) {
  const response = await api.patients.stats(id)
  return response.data
}
