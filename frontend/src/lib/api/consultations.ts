import { apiClient } from './client'

export interface Consultation {
  id: number
  patient_id: number
  doctor_id: number
  consultation_date: string
  reason: string
  diagnosis?: string
  treatment?: string
  notes?: string
  follow_up_date?: string
  status: 'scheduled' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface ConsultationListResponse {
  consultations: Consultation[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface ConsultationCreateRequest {
  patient_id: number
  consultation_date: string
  reason: string
  diagnosis?: string
  treatment?: string
  notes?: string
  follow_up_date?: string
}

// List consultations
export async function listConsultations(params?: {
  patient_id?: number
  page?: number
  page_size?: number
}): Promise<ConsultationListResponse> {
  const response = await apiClient.get('/consultations', { params })
  return response.data
}

// Get single consultation
export async function getConsultation(id: number): Promise<Consultation> {
  const response = await apiClient.get(`/consultations/${id}`)
  return response.data
}

// Create consultation
export async function createConsultation(
  data: ConsultationCreateRequest
): Promise<Consultation> {
  const response = await apiClient.post('/consultations', data)
  return response.data
}

// Update consultation
export async function updateConsultation(
  id: number,
  data: Partial<ConsultationCreateRequest>
): Promise<Consultation> {
  const response = await apiClient.put(`/consultations/${id}`, data)
  return response.data
}

// Delete consultation
export async function deleteConsultation(id: number): Promise<void> {
  await apiClient.delete(`/consultations/${id}`)
}

// Get consultations by patient
export async function getPatientConsultations(patientId: number): Promise<Consultation[]> {
  const response = await apiClient.get(`/patients/${patientId}/consultations`)
  return response.data
}

// Aliases for compatibility
export type ConsultationResponse = Consultation
export type ConsultationData = ConsultationCreateRequest
export const getPatientConsultationHistory = getPatientConsultations
